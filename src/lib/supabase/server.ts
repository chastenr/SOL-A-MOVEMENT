import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cookie-bound Supabase client for Server Components / Server Actions /
 * Route Handlers — carries the signed-in user's session via cookies, still
 * subject to RLS (unlike `@/lib/supabase/admin`). Always derive identity via
 * `@/lib/auth/require-role`'s `getAuthedUser()` (backed by `auth.getClaims()`),
 * never this client's raw `getSession()` for an authorization decision —
 * `getSession()` only decodes the cookie's JWT locally without verifying it.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component render, where cookies can't be
            // set — safe to ignore because middleware.ts refreshes the
            // session on every request regardless.
          }
        },
      },
    }
  );
}
