import { stripe, PLANS, type PlanKey } from "@/lib/stripe";
import { resolvePriceId } from "@/lib/stripe-prices";
import { createAdminClient } from "@/lib/supabase/admin";
import { row as asRow } from "@/lib/db";

/** Length of the free trial, in days. One number, used everywhere. */
export const TRIAL_DAYS = 3;

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

type SubRow = {
  stripe_customer_id: string | null;
  trial_ends_at: string | null;
  card_added_at: string | null;
};

/**
 * How many trial days this checkout should grant.
 *
 * - Never had a card and never had a trial clock → the one free trial.
 * - Trial already running → carry over what's LEFT of it, so switching plans
 *   mid-trial doesn't cost the owner days and can't hand out a fresh 3 days
 *   over and over.
 * - Anything else → none.
 */
function trialDaysFor(mode: "subscription" | "payment", row: SubRow | null): number | undefined {
  if (mode !== "subscription") return undefined; // Lifetime is a one-off payment
  if (!row?.card_added_at && !row?.trial_ends_at) return TRIAL_DAYS;
  if (row?.trial_ends_at) {
    const left = Math.floor((new Date(row.trial_ends_at).getTime() - Date.now()) / 86_400_000);
    if (left >= 1) return Math.min(left, 30);
  }
  return undefined;
}

type Opts = {
  businessId: string;
  email?: string | null;
  plan: PlanKey;
  /** App path Stripe returns to when the card is accepted. */
  successPath: string;
  /** App path Stripe returns to if they back out. */
  cancelPath: string;
};

/**
 * Create a Stripe Checkout session and return its URL.
 *
 * Shared by onboarding (/setup/billing) and Settings → Subscription so the
 * trial rules and the card requirement can only ever be defined in one place.
 */
export async function createCheckoutUrl({
  businessId,
  email,
  plan,
  successPath,
  cancelPath,
}: Opts): Promise<string> {
  const conf = PLANS[plan];

  // Looked up rather than read from the environment, so a stale
  // STRIPE_PRICE_* can't break checkout. See lib/stripe-prices.ts.
  const priceId = await resolvePriceId(plan);

  // Service role: `subscriptions` is read-only to members under RLS, so a
  // write with the user's own client would silently affect zero rows.
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("stripe_customer_id,trial_ends_at,card_added_at")
    .eq("business_id", businessId)
    .maybeSingle();
  const sub = asRow<SubRow>(data);

  let customerId = sub?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      metadata: { business_id: businessId },
    });
    customerId = customer.id;
    await admin
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("business_id", businessId);
  }

  const trialDays = trialDaysFor(conf.mode, sub);
  const base = siteUrl();
  const sep = successPath.includes("?") ? "&" : "?";

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: conf.mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}${successPath}${sep}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}${cancelPath}`,
      allow_promotion_codes: true,
      metadata: { business_id: businessId, plan },
      ...(conf.mode === "subscription"
        ? {
            // Nothing is due today during a trial, and Stripe skips the card
            // form when the total is $0 unless we insist. This is what makes
            // the trial card-backed.
            payment_method_collection: "always" as const,
            subscription_data: {
              metadata: { business_id: businessId, plan },
              ...(trialDays ? { trial_period_days: trialDays } : {}),
            },
          }
        : {}),
    });
    if (!session.url) throw new Error("Could not start checkout.");
    return session.url;
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
}
