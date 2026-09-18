"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";
import { resolvePriceId } from "@/lib/stripe-prices";
import { syncFromStripe } from "@/lib/billing-sync";
import { createClient } from "@/lib/supabase/server";

async function requireBiz() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: member } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!member) redirect("/setup");
  return { supabase, businessId: member.business_id as string, user };
}

/** Start a Stripe Checkout session for the chosen plan and redirect to it. */
export async function startCheckout(plan: PlanKey) {
  const conf = PLANS[plan];
  const { supabase, businessId, user } = await requireBiz();

  // Looked up rather than read from the environment, so a stale
  // STRIPE_PRICE_* can't break checkout. See lib/stripe-prices.ts.
  const priceId = await resolvePriceId(plan);

  // reuse or create the Stripe customer for this business
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id,trial_ends_at")
    .eq("business_id", businessId)
    .maybeSingle();

  let customerId = sub?.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { business_id: businessId },
    });
    customerId = customer.id;
    await supabase.from("subscriptions").update({ stripe_customer_id: customerId }).eq("business_id", businessId);
  }

  // Carry over whatever is LEFT of the signup trial — never hand out a fresh
  // one, or an owner could restart the trial forever by re-subscribing.
  let trialDays: number | undefined;
  if (conf.mode === "subscription" && sub?.trial_ends_at) {
    const left = Math.floor((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000);
    if (left >= 1) trialDays = Math.min(left, 30);
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      customer: customerId!,
      mode: conf.mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/dashboard/settings?billing=success`,
      cancel_url: `${base}/dashboard/settings?billing=cancel`,
      allow_promotion_codes: true,
      metadata: { business_id: businessId, plan },
      ...(conf.mode === "subscription"
        ? {
            subscription_data: {
              metadata: { business_id: businessId, plan },
              ...(trialDays ? { trial_period_days: trialDays } : {}),
            },
          }
        : {}),
    });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    if (e?.code === "resource_missing") {
      throw new Error(
        `Couldn't start checkout for the ${conf.label} plan (price ${priceId}). ` +
          `Check that STRIPE_SECRET_KEY belongs to the Stripe account you expect.`
      );
    }
    throw err;
  }

  if (!session.url) throw new Error("Could not start checkout.");
  redirect(session.url);
}

/** Re-read the plan straight from Stripe (used if a webhook was missed). */
export async function refreshBilling() {
  const { businessId } = await requireBiz();
  await syncFromStripe(businessId);
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}

/** Open the Stripe billing portal so the owner can manage/cancel their plan. */
export async function openBillingPortal() {
  const { supabase, businessId } = await requireBiz();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("business_id", businessId)
    .maybeSingle();
  if (!sub?.stripe_customer_id) redirect("/dashboard/settings");

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${base}/dashboard/settings`,
  });
  redirect(portal.url);
}
