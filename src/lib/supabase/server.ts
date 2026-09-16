import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";

/** See the note in ./middleware.ts — the cookies option is a union type. */
type CookiesToSet = Parameters<SetAllCookies>[0];

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads the user's session from cookies so RLS runs as the logged-in user.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore; the middleware
            // refreshes the session cookie.
          }
        },
      },
    }
  );
}
