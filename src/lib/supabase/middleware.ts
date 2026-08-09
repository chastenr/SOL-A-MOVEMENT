import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isMaintenanceMode } from "@/lib/feature-flags";

const PROTECTED_PREFIXES = ["/account", "/admin"];
// /admin/login: pre-auth admin sign-in. /admin/mfa: reached by an admin who
// IS signed in but not yet AAL2 — excepted so an unauthenticated direct hit
// gets the page's own redirect to /admin/login rather than the generic
// customer /login.
const PUBLIC_EXCEPTIONS = ["/admin/login", "/admin/mfa"];
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

// Stays reachable even while MAINTENANCE_MODE is on — admin needs the whole
// dashboard, /auth/callback covers an admin's own password-reset link, and
// the rest are cheap/SEO-neutral static routes with nothing to hide.
const MAINTENANCE_ALLOWED_PREFIXES = ["/admin", "/maintenance", "/auth/callback"];
const MAINTENANCE_ALLOWED_EXACT = ["/robots.txt", "/sitemap.xml", "/opengraph-image", "/icon"];
const MAINTENANCE_BYPASS_COOKIE = "veora_bypass";

function isMaintenanceAllowed(path: string): boolean {
  return (
    MAINTENANCE_ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
    MAINTENANCE_ALLOWED_EXACT.includes(path)
  );
}

/**
 * Lets the site owner preview the real, live site while MAINTENANCE_MODE
 * is on for everyone else — visit any page with ?bypass=<MAINTENANCE_
 * BYPASS_KEY> once, and a cookie remembers it for that browser from then on.
 * Never logged, never stored server-side — just a cookie equality check.
 */
function checkMaintenanceBypass(request: NextRequest): NextResponse | null {
  const bypassKey = process.env.MAINTENANCE_BYPASS_KEY;
  if (!bypassKey) return null;

  const queryKey = request.nextUrl.searchParams.get("bypass");
  if (queryKey && queryKey === bypassKey) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("bypass");
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(MAINTENANCE_BYPASS_COOKIE, bypassKey, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

  return null;
}

/**
 * Refreshes the Supabase session cookie on every request and does a cheap,
 * UX-only redirect for protected/auth routes. This is NOT the security
 * boundary — every protected page/action/route still calls `requireAdmin()`
 * or checks `auth.getUser()` itself; RLS is the last line of defense.
 *
 * This runs on nearly every request (see the matcher in src/proxy.ts), so it
 * must never throw: a misconfigured/missing Supabase env var here would
 * otherwise take the entire site down, not just auth-dependent pages. If
 * Supabase isn't reachable/configured, fall through to an unmodified
 * response — every protected route still re-checks auth server-side anyway.
 */
export async function updateSession(request: NextRequest) {
  if (isMaintenanceMode()) {
    const bypassResponse = checkMaintenanceBypass(request);
    if (bypassResponse) return bypassResponse;

    const path = request.nextUrl.pathname;
    const bypassKey = process.env.MAINTENANCE_BYPASS_KEY;
    const hasBypassCookie = Boolean(bypassKey) && request.cookies.get(MAINTENANCE_BYPASS_COOKIE)?.value === bypassKey;

    if (!hasBypassCookie && !isMaintenanceAllowed(path)) {
      return NextResponse.rewrite(new URL("/maintenance", request.url), { status: 503 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });
  let user = null;

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
    });

    // Nothing may run between createServerClient() and getUser() — anything
    // in between can desync the cookie-refresh logic and randomly log users out.
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    return NextResponse.next({ request });
  }

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
