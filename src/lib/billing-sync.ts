import { stripe, mapStatus, planFromPrice, periodEndOf, tsToIso } from "./stripe";
import { planFromResolved } from "./stripe-prices";
import { createAdminClient } from "./supabase/admin";

/**
 * Pull the live subscription state from Stripe and write it into our DB.
 *
 * Webhooks are the normal path, but they can be missed (CLI not running in
 * dev, endpoint down, signature mismatch). This makes the dashboard
 * self-healing: whenever we render billing we can reconcile with Stripe.
 * Safe to call often — it's a couple of read-only Stripe calls plus one update.
 */
export async function syncFromStripe(businessId: string): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY) return;

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("business_id", businessId)
    .maybeSingle();

  const customer = row?.stripe_customer_id as string | undefined;
  if (!customer) return; // never checked out — nothing to reconcile

  try {
    const subs = await stripe.subscriptions.list({ customer, status: "all", limit: 10 });

    // Prefer a subscription that's still live; otherwise the most recent one.
    const live =
      subs.data.find((s) => ["trialing", "active", "past_due", "unpaid"].includes(s.status)) ??
      subs.data[0];

    if (live) {
      // env match first, then anything we've resolved ourselves this process
      const priceId = live.items.data[0]?.price?.id;
      const plan = planFromPrice(priceId) ?? planFromResolved(priceId);
      await admin
        .from("subscriptions")
        .update({
          stripe_subscription_id: live.id,
          status: mapStatus(live.status),
          ...(plan ? { plan } : {}),
          current_period_end: periodEndOf(live),
          trial_ends_at: tsToIso(live.trial_end),
          cancel_at_period_end: live.cancel_at_period_end ?? false,
        })
        .eq("business_id", businessId);
      return;
    }

    // No subscription at all — maybe they bought the one-time Lifetime plan.
    const sessions = await stripe.checkout.sessions.list({ customer, limit: 20 });
    const paid = sessions.data.find((s) => s.mode === "payment" && s.payment_status === "paid");
    if (paid) {
      await admin
        .from("subscriptions")
        .update({ status: "active", plan: "lifetime", cancel_at_period_end: false })
        .eq("business_id", businessId);
    }
  } catch (err) {
    // Never break the dashboard because Stripe is unreachable.
    console.error("[billing-sync]", err);
  }
}
