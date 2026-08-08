import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/account", "/admin"];
// /admin/login: pre-auth admin sign-in. /admin/mfa: reached by an admin who
// IS signed in but not yet AAL2 — excepted so an unauthenticated direct hit
// gets the page's own redirect to /admin/login rather than the generic
// customer /login.
const PUBLIC_EXCEPTIONS = ["/admin/login", "/admin/mfa"];
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

/**
 * Refreshes the Supabase session cookie on every request and does a cheap,
 * UX-only redirect for protected/auth routes. This is NOT the security
 * boundary — every protected page/action/route still calls `requireAdmin()`
 * or checks `auth.getUser()` itself; RLS is the last line of defense.
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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  // Nothing may run between createServerClient() and getUser() — anything in
  // between can desync the cookie-refresh logic and randomly log users out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublicException = PUBLIC_EXCEPTIONS.some((prefix) => path.startsWith(prefix));
  const isProtected = !isPublicException && PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTES.some((prefix) => path.startsWith(prefix));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    return NextResponse.redirect(url);
  }

  // Always return supabaseResponse itself — a fresh NextResponse here would
  // silently drop the refreshed session cookies.
  return supabaseResponse;
}
