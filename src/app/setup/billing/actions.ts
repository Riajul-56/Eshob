"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutUrl } from "@/lib/checkout";
import type { PlanKey } from "@/lib/stripe";

/**
 * Onboarding step 2: send the new owner to Stripe to put a card on file.
 * Coming back through /api/billing/return is what starts the trial clock.
 */
export async function startOnboardingCheckout(plan: PlanKey) {
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

  const url = await createCheckoutUrl({
    businessId: member.business_id as string,
    email: user.email,
    plan,
    successPath: "/api/billing/return?to=%2Fdashboard",
    cancelPath: "/setup/billing?billing=cancel",
  });

  redirect(url);
}
