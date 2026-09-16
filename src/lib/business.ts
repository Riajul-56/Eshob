import { createClient } from "@/lib/supabase/server";

export type Business = {
  id: string;
  name: string;
  category: string | null;
  logo_url: string | null;
};

/**
 * Returns the logged-in user and the business they belong to (if any).
 * RLS ensures a user only ever sees their own membership/business.
 */
export async function getCurrentUserAndBusiness() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return { user: null, business: null as Business | null, businessId: null };

  const { data: member } = await supabase
    .from("business_members")
    .select("business_id, role, businesses(id, name, category, logo_url)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

//nothing 
  const business = (member?.businesses as unknown as Business) ?? null;
  return { user, business, businessId: member?.business_id ?? null };
}
