import "server-only";
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
 * Resolves the signed-in user + their `profiles.role`, or null if signed
 * out. Always uses `auth.getUser()` (server-revalidated), never
 * `getSession()` — identity for authorization decisions must never come
 * from a locally-decoded, unrevalidated JWT.
 */
export async function getAuthedUser(): Promise<AuthedUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  return {
    id: user.id,
    email: user.email ?? "",
    role: (profile?.role as AuthedUser["role"]) ?? "customer",
  };
}

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

async function getCurrentAal(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data?.currentLevel ?? null;
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
