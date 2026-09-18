"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { stripe, type PlanKey } from "@/lib/stripe";
import { createCheckoutUrl, siteUrl } from "@/lib/checkout";
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

/**
 * Start a Stripe Checkout session for the chosen plan and redirect to it.
 * The trial rules and the "always collect a card" setting live in
 * lib/checkout.ts, shared with onboarding.
 */
export async function startCheckout(plan: PlanKey) {
  const { businessId, user } = await requireBiz();

  const url = await createCheckoutUrl({
    businessId,
    email: user.email,
    plan,
    successPath: "/api/billing/return?to=%2Fdashboard%2Fsettings",
    cancelPath: "/dashboard/settings?billing=cancel",
  });

  redirect(url);
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

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${siteUrl()}/dashboard/settings`,
  });
  redirect(portal.url);
}
