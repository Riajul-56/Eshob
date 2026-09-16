import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin (service-role) Supabase client — BYPASSES Row-Level Security.
 *
 * Use ONLY in server code, and ONLY for the public customer journey
 * (scan -> join -> stamp -> redeem), where the actor is not a business member
 * and therefore cannot pass RLS. Every operation must derive the business_id
 * from a trusted lookup (campaign slug), never from client input.
 *
 * NEVER import this into a Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
