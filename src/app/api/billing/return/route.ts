import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { syncFromStripe, markCardOnFile } from "@/lib/billing-sync";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Where Stripe Checkout sends the owner back to.
 *
 * The webhook is still the source of truth, but it can arrive seconds later —
 * or not at all in dev. Reconciling here means the dashboard is already
 * correct by the time the page paints, instead of showing "trial ended" to
 * someone who just typed in their card.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");

  // Only ever redirect inside this app — never to a URL from the query string.
  const asked = url.searchParams.get("to") || "/dashboard";
  const to = asked.startsWith("/") && !asked.startsWith("//") ? asked : "/dashboard";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const { data: member } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const businessId = member?.business_id as string | undefined;
  if (!businessId) return NextResponse.redirect(new URL("/setup", req.url));

  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      // The session id comes back through the browser, so check it really
      // belongs to this business before trusting it.
      if (session.metadata?.business_id === businessId && session.status === "complete") {
        await markCardOnFile(businessId);
      }
    } catch (err) {
      console.error("[billing-return]", err);
    }
  }

  await syncFromStripe(businessId);

  const dest = new URL(to, req.url);
  dest.searchParams.set("billing", "success");
  return NextResponse.redirect(dest);
}
