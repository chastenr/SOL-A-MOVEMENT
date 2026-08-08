import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
 * Use at the top of every `/admin/**` server component/action and every
 * admin-only API route. Redirects a signed-out visitor to /admin/login and a
 * signed-in non-admin to the homepage — this check is defense-in-depth
 * alongside RLS and the `is_admin()` re-check inside every privileged
 * Postgres function; none of these layers is trusted alone.
 */
export async function requireAdmin(): Promise<AuthedUser> {
  const user = await getAuthedUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin" && user.role !== "super_admin") redirect("/");
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
  return user;
}
