import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * @supabase/ssr types `cookies` as a union of the current and deprecated
 * shapes, so TypeScript can't contextually type this callback on its own.
 * Taking it from the library's own SetAllCookies keeps us in step with it.
 */
type CookiesToSet = Parameters<SetAllCookies>[0];

/**
 * Keeps the Supabase auth session fresh on every request and forwards the
 * refreshed cookies to both the request and the response.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() must be called to refresh the session.
  await supabase.auth.getUser();

  return supabaseResponse;
}
