"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

/** Sign the current user out and send them to the login page. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Create a business (via the SECURITY DEFINER RPC) and go to the dashboard. */
export async function createBusiness(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim() || null;
  if (!name) throw new Error("Business name is required.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_business", {
    p_name: name,
    p_category: category,
  });
  if (error) throw new Error(error.message);

  redirect("/dashboard");
}

/** Helper: current user's business_id (or redirect). */
async function requireBusinessId() {
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
  return { supabase, businessId: member.business_id as string };
}

function offerFields(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const reward_text = String(formData.get("reward_text") || "").trim();
  const stamps_required = parseInt(String(formData.get("stamps_required") || "10"), 10);
  const validityRaw = String(formData.get("stamp_validity_days") || "").trim();
  const expiryRaw = String(formData.get("reward_expiry_days") || "").trim();
  const reward_image_url = String(formData.get("reward_image_url") || "").trim() || null;
  const approval_mode = String(formData.get("approval_mode") || "auto");
  return {
    name,
    reward_text,
    // Clamped here as well: the form's max= only binds a real browser, and a
    // card with thousands of stamps would render thousands of circles.
    stamps_required: Number.isFinite(stamps_required)
      ? Math.min(Math.max(stamps_required, 1), 50)
      : 10,
    stamp_validity_days: validityRaw ? parseInt(validityRaw, 10) : null,
    reward_expiry_days: expiryRaw ? parseInt(expiryRaw, 10) : null,
    reward_image_url,
    approval_mode,
  };
}

/** Create an offer/campaign for the current user's business. */
export async function createCampaign(formData: FormData) {
  const { supabase, businessId } = await requireBusinessId();
  const f = offerFields(formData);
  if (!f.name || !f.reward_text) throw new Error("Name and reward are required.");

  const { error } = await supabase.from("campaigns").insert({ business_id: businessId, ...f });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/campaigns");
  redirect("/dashboard/campaigns");
}

/** Update an existing offer/campaign. */
export async function updateCampaign(campaignId: string, formData: FormData) {
  const { supabase } = await requireBusinessId();
  const f = offerFields(formData);
  if (!f.name || !f.reward_text) throw new Error("Name and reward are required.");

  const { error } = await supabase.from("campaigns").update(f).eq("id", campaignId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/campaigns");
  redirect("/dashboard/campaigns");
}

/** Pause / resume / archive an offer. */
export async function setCampaignStatus(campaignId: string, status: "active" | "paused" | "archived") {
  const { supabase } = await requireBusinessId();
  await supabase.from("campaigns").update({ status }).eq("id", campaignId);
  revalidatePath("/dashboard/campaigns");
}

/** Delete an offer. */
export async function deleteCampaign(campaignId: string) {
  const { supabase } = await requireBusinessId();
  await supabase.from("campaigns").delete().eq("id", campaignId);
  revalidatePath("/dashboard/campaigns");
}

/** Set (or change) the staff redemption PIN for the business. Stored hashed. */
export async function setRedemptionPin(formData: FormData) {
  const pin = String(formData.get("pin") || "").trim();
  if (!/^\d{4,8}$/.test(pin)) throw new Error("PIN must be 4–8 digits.");

  const { supabase, businessId } = await requireBusinessId();
  const hash = await bcrypt.hash(pin, 10);
  const { error } = await supabase
    .from("businesses")
    .update({ redemption_pin_hash: hash })
    .eq("id", businessId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings");
}

/** Approve a pending (manual-mode) stamp and add it to the customer's count. */
export async function approveStamp(stampId: string) {
  const { supabase } = await requireBusinessId();

  const { data: stamp } = await supabase
    .from("stamps")
    .select("id,membership_id,approved")
    .eq("id", stampId)
    .maybeSingle();
  if (!stamp || stamp.approved) return;

  await supabase.from("stamps").update({ approved: true }).eq("id", stampId);

  const { data: mem } = await supabase
    .from("memberships")
    .select("stamp_count")
    .eq("id", stamp.membership_id)
    .single();
  await supabase
    .from("memberships")
    .update({ stamp_count: (mem?.stamp_count ?? 0) + 1 })
    .eq("id", stamp.membership_id);

  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard");
}

/** Reject (delete) a pending stamp. */
export async function rejectStamp(stampId: string) {
  const { supabase } = await requireBusinessId();
  await supabase.from("stamps").delete().eq("id", stampId).eq("approved", false);
  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard");
}

/** Remove a customer's card (membership) from this business, with their stamps. */
export async function removeMembership(membershipId: string) {
  const { supabase } = await requireBusinessId();
  await supabase.from("memberships").delete().eq("id", membershipId);
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");
}

/** Mark a scratch-card win as claimed (given to the customer). */
export async function markScratchClaimed(id: string) {
  const { supabase } = await requireBusinessId();
  await supabase.from("scratch_wins").update({ claimed: true }).eq("id", id);
  revalidatePath("/dashboard/rewards");
}
