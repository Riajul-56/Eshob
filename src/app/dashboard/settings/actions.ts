"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
  return { supabase, businessId: member.business_id as string };
}

export async function updateBusinessProfile(formData: FormData) {
  const { supabase, businessId } = await requireBiz();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Business name is required.");
  await supabase
    .from("businesses")
    .update({
      name,
      category: String(formData.get("category") || "").trim() || null,
      logo_url: String(formData.get("logo_url") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
    })
    .eq("id", businessId);
  revalidatePath("/dashboard/settings");
}

export async function updateLocationHours(formData: FormData) {
  const { supabase, businessId } = await requireBiz();
  const latRaw = String(formData.get("lat") || "").trim();
  const lngRaw = String(formData.get("lng") || "").trim();
  await supabase
    .from("businesses")
    .update({
      address: String(formData.get("address") || "").trim() || null,
      lat: latRaw ? parseFloat(latRaw) : null,
      lng: lngRaw ? parseFloat(lngRaw) : null,
      geofence_radius: parseInt(String(formData.get("geofence_radius") || "200"), 10) || 200,
      open_daily: formData.get("open_daily") === "on",
      open_from: String(formData.get("open_from") || "").trim() || null,
      close_at: String(formData.get("close_at") || "").trim() || null,
    })
    .eq("id", businessId);
  revalidatePath("/dashboard/settings");
}

export async function setToggle(
  field: "allow_remote_scan" | "compulsory_approval" | "scratch_enabled",
  value: boolean
) {
  const { supabase, businessId } = await requireBiz();
  await supabase.from("businesses").update({ [field]: value }).eq("id", businessId);
  revalidatePath("/dashboard/settings");
}

export async function setScratchChance(formData: FormData) {
  const { supabase, businessId } = await requireBiz();
  let chance = parseInt(String(formData.get("scratch_chance") || "20"), 10);
  if (!Number.isFinite(chance)) chance = 20;
  chance = Math.min(100, Math.max(0, chance));
  await supabase.from("businesses").update({ scratch_chance: chance }).eq("id", businessId);
  revalidatePath("/dashboard/settings");
}

export async function addScratchPrize(formData: FormData) {
  const { supabase, businessId } = await requireBiz();
  const label = String(formData.get("label") || "").trim();
  if (!label) throw new Error("Prize label is required.");
  const weight = Math.max(1, parseInt(String(formData.get("weight") || "1"), 10) || 1);
  await supabase.from("scratch_prizes").insert({ business_id: businessId, label, weight });
  revalidatePath("/dashboard/settings");
}

export async function deleteScratchPrize(id: string) {
  const { supabase } = await requireBiz();
  await supabase.from("scratch_prizes").delete().eq("id", id);
  revalidatePath("/dashboard/settings");
}

export async function addBranch(formData: FormData) {
  const { supabase, businessId } = await requireBiz();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Branch name is required.");
  await supabase.from("branches").insert({
    business_id: businessId,
    name,
    address: String(formData.get("address") || "").trim() || null,
  });
  revalidatePath("/dashboard/settings");
}

export async function deleteBranch(id: string) {
  const { supabase } = await requireBiz();
  await supabase.from("branches").delete().eq("id", id);
  revalidatePath("/dashboard/settings");
}

export async function updateSocialLinks(formData: FormData) {
  const { supabase, businessId } = await requireBiz();
  await supabase
    .from("businesses")
    .update({
      social_links: {
        instagram: String(formData.get("instagram") || "").trim(),
        facebook: String(formData.get("facebook") || "").trim(),
        google_review: String(formData.get("google_review") || "").trim(),
      },
    })
    .eq("id", businessId);
  revalidatePath("/dashboard/settings");
}
