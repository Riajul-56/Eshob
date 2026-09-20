import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
});

export type PlanKey = "monthly" | "yearly" | "lifetime";

export const PLANS: Record<
  PlanKey,
  { id: string | undefined; mode: "subscription" | "payment"; label: string; price: string; per: string; note: string }
> = {
  // The currency is part of the label everywhere a price is shown. A Canadian
  // owner looking at "$20" shouldn't have to wonder whether it means USD.
  monthly: {
    id: process.env.STRIPE_PRICE_MONTHLY,
    mode: "subscription",
    label: "Monthly",
    price: "$20",
    per: "CAD / month",
    note: "Billed every month",
  },
  yearly: {
    id: process.env.STRIPE_PRICE_YEARLY,
    mode: "subscription",
    label: "Yearly",
    price: "$150",
    per: "CAD / year",
    note: "Save $90 CAD a year",
  },
  lifetime: {
    id: process.env.STRIPE_PRICE_LIFETIME,
    mode: "payment",
    label: "Lifetime",
    price: "$250",
    per: "CAD one-time",
    note: "Pay once, use forever",
  },
};

export type SubStatus = "trialing" | "active" | "past_due" | "canceled";

/** Map Stripe's subscription status onto our DB enum. */
export function mapStatus(s: string): SubStatus {
  if (s === "trialing" || s === "active" || s === "past_due" || s === "canceled") return s;
  if (s === "unpaid") return "past_due";
  return "canceled"; // incomplete, incomplete_expired, paused, …
}

/** Which of our plans does this Stripe price belong to? */
export function planFromPrice(priceId?: string | null): PlanKey | null {
  if (!priceId) return null;
  return (Object.keys(PLANS) as PlanKey[]).find((k) => PLANS[k].id === priceId) ?? null;
}

export function tsToIso(ts?: number | null): string | null {
  return ts ? new Date(ts * 1000).toISOString() : null;
}

/**
 * `current_period_end` moved from the Subscription object onto its items in
 * Stripe API 2025-03-31+. Read whichever shape this account's version sends.
 */
export function periodEndOf(sub: unknown): string | null {
  const s = sub as {
    current_period_end?: number | null;
    items?: { data?: Array<{ current_period_end?: number | null }> };
  };
  return tsToIso(s?.current_period_end ?? s?.items?.data?.[0]?.current_period_end ?? null);
}
