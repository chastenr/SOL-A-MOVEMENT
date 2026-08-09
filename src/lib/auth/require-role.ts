import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeRedirectTo } from "@/lib/utils";
import { isPhoneVerificationRequired, isAdminMfaRequired } from "@/lib/feature-flags";

export type AuthedUser = {
  id: string;
  email: string;
  role: "customer" | "admin" | "super_admin";
};

/**
 * Verifies the current session's JWT and returns its claims, or null if
 * signed out — the one place that ever calls a Supabase Auth verification
 * method, so every consumer below shares the same cached result instead of
 * re-verifying independently.
 *
 * Uses `auth.getClaims()`, not `auth.getUser()` or `getSession()`:
 * `getSession()` reads the JWT locally with no verification at all — never
 * safe for an authorization decision. `getClaims()` IS safe for that (it
 * cryptographically verifies the JWT signature), and unlike `getUser()` it
 * does so locally via WebCrypto against this project's asymmetric signing
 * key (confirmed live at /auth/v1/.well-known/jwks.json) instead of a
 * network round-trip to the Auth server on every call — Supabase's own
 * current guidance for Next.js middleware/server code is to use `getClaims()`
 * for exactly this reason. (On a project still using a legacy symmetric
 * secret, the SDK falls back to `getUser()` internally either way, so this
 * is never less correct than before, only sometimes faster.)
 *
 * Wrapped in React's `cache()`: every `/admin/**` page calls `requireAdmin()`
 * a second time on top of the shared layout's own call (deliberate
 * defense-in-depth), which previously meant two full `auth.getUser()`
 * network round-trips plus two `profiles` queries per navigation. `cache()`
 * dedupes repeated calls within the same request/render pass, so the second
 * call reuses the first's result instead of re-verifying again — same
 * security guarantee, less latency. Never dedupes *across* requests.
 */
const getVerifiedClaims = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return null;
  return data.claims;
});

export const getAuthedUser = cache(async (): Promise<AuthedUser | null> => {
  const claims = await getVerifiedClaims();
  if (!claims) return null;

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", claims.sub).single();

  return {
    id: claims.sub,
    email: claims.email ?? "",
    role: (profile?.role as AuthedUser["role"]) ?? "customer",
  };
});

/** Use at the top of every `/account/**` server component/action. */
export async function requireUser(): Promise<AuthedUser> {
  const user = await getAuthedUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Use at the top of sensitive customer actions — checkout, authenticated
 * class booking, payment submission, receipt upload. `returnTo` is the path
 * to send the customer back to once verified; it's sanitized before being
 * placed in a redirect, since it ultimately comes from a query param.
 *
 * When `PHONE_VERIFICATION_REQUIRED` is off (the default until an SMS
 * provider is configured), this behaves exactly like `requireUser()` — the
 * gate is simply not enforced yet, never silently "passed."
 */
export async function requireVerifiedCustomer(returnTo: string): Promise<AuthedUser> {
  const safeReturnTo = sanitizeRedirectTo(returnTo, "/account");

  // Not using requireUser() here: it redirects to a bare /login with no
  // redirectTo, which would strand the customer on /account after signing
  // in instead of resuming checkout/booking. Preserving the destination
  // through the login step too completes the intended chain: /login ->
  // (back to this page) -> /verify-phone if still needed -> back again.
  const user = await getAuthedUser();
  if (!user) redirect(`/login?redirectTo=${encodeURIComponent(safeReturnTo)}`);
  if (!isPhoneVerificationRequired()) return user;

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_verified_at")
    .eq("id", user.id)
    .single();

  if (!profile?.phone_verified_at) {
    redirect(`/verify-phone?redirectTo=${encodeURIComponent(safeReturnTo)}`);
  }

  return user;
}

/**
 * The `aal` claim is already sitting in the JWT `getVerifiedClaims()` just
 * verified — `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` would
 * derive the exact same current-level value, but only after ANOTHER
 * `getUser()` network round-trip internally (it needs the full factors list
 * too, for a `nextLevel` this call site never uses). Reading the claim
 * directly skips that.
 */
async function getCurrentAal(): Promise<string | null> {
  const claims = await getVerifiedClaims();
  return claims?.aal ?? null;
}

/**
 * Use at the top of every `/admin/**` server component/action and every
 * admin-only API route. Redirects a signed-out visitor to /admin/login, a
 * signed-in non-admin to the homepage, and (when `ADMIN_MFA_REQUIRED` is on)
 * an admin who hasn't completed phone MFA to /admin/mfa — this check is
 * defense-in-depth alongside RLS and the `is_admin()` re-check inside every
 * privileged Postgres function; none of these layers is trusted alone.
 */
export async function requireAdmin(): Promise<AuthedUser> {
  const user = await getAuthedUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin" && user.role !== "super_admin") redirect("/");

  if (isAdminMfaRequired() && (await getCurrentAal()) !== "aal2") {
    redirect("/admin/mfa");
  }

  return user;
}

/** Variant for API Route Handlers, which can't cleanly `redirect()` a JSON caller. */
export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireUserApi(): Promise<AuthedUser> {
  const user = await getAuthedUser();
  if (!user) throw new AuthError(401, "Please sign in.");
  return user;
}

export async function requireAdminApi(): Promise<AuthedUser> {
  const user = await requireUserApi();
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new AuthError(403, "Admins only.");
  }
  if (isAdminMfaRequired() && (await getCurrentAal()) !== "aal2") {
    throw new AuthError(403, "Admin MFA required.");
  }
  return user;
}
