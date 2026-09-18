import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Where the "confirm your email" link lands.
 *
 * Two shapes arrive here depending on how the Supabase email template is
 * written, and both are handled so the link works either way:
 *
 *   ?token_hash=…&type=email   the template uses {{ .TokenHash }} — works from
 *                              ANY device, because nothing is needed from the
 *                              browser that signed up.
 *   ?code=…                    the default PKCE link — only works in the same
 *                              browser, since the verifier sits in its cookie.
 *
 * On success the visitor is signed in and continues to /setup. On failure they
 * go back to /login with a reason, never to a half-signed-in dead end.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");

  // Only ever continue inside this app — never to a URL from the query string.
  const asked = url.searchParams.get("next") || "/setup";
  const next = asked.startsWith("/") && !asked.startsWith("//") ? asked : "/setup";

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, req.url));
    return NextResponse.redirect(new URL("/login?verify=expired", req.url));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, req.url));
    return NextResponse.redirect(new URL("/login?verify=expired", req.url));
  }

  return NextResponse.redirect(new URL("/login?verify=invalid", req.url));
}
