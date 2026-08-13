"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import { isRateLimited, getActionClientKey } from "@/lib/rate-limit";
import { inviteStaffSchema, type InviteStaffFormValues } from "@/lib/validations";
import type { AdminUserRole } from "@/lib/admin/users";

type InviteResult = { error: string } | { success: true };

/**
 * Thin wrapper around the `set_user_role()` RPC (see migration 0001) — that
 * function is the actual security boundary (it re-checks is_super_admin()
 * itself and writes the audit log row), this just adds UI-facing guards so a
 * plain admin never even sees a working control, and so a super_admin can't
 * accidentally lock everyone out by demoting their own only account.
 *
 * confirmPassword re-verifies it's really the super admin at the keyboard —
 * not just an open/left-open session — before granting or revoking admin
 * access, the single most sensitive action in this panel. Verified on a
 * throwaway, session-less client (same pattern as changePasswordAction) so
 * it can't disturb the caller's own session/AAL.
 */
export async function updateUserRoleAction(
  targetUserId: string,
  newRole: AdminUserRole,
  confirmPassword: string
): Promise<void> {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin") {
    throw new Error("Only super admins can change roles.");
  }
  if (targetUserId === admin.id) {
    throw new Error("You can't change your own role from here.");
  }

  const rateLimitKey = await getActionClientKey("update-user-role", admin.id);
  if (isRateLimited(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 5 })) {
    throw new Error("Too many attempts. Please try again in a few minutes.");
  }

  const verifier = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: admin.email,
    password: confirmPassword,
  });
  if (verifyError) throw new Error("Incorrect password.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_user_role", {
    target_user_id: targetUserId,
    new_role: newRole,
  });
  if (error) throw new Error(error.message || "Something went wrong. Please try again.");

  revalidatePath("/admin/users");
}

/**
 * Permanently deletes an account (auth.users row + everything that
 * cascades from it — profiles.id is `on delete cascade`, see migration
 * 0001). Guarded the same way as a role change (super_admin only, can't
 * target your own account, password re-entered and rate-limited) since
 * this is even more sensitive — unlike a role change, it can't be undone
 * by picking a different dropdown value afterward.
 *
 * Deliberately NOT soft-deleted or force-cascaded through purchase/booking
 * history: `purchases.user_id` and `class_bookings.user_id` are `on delete
 * restrict` on purpose (migration 0001), so an account with real payment or
 * class history simply can't be deleted this way — Postgres rejects it and
 * that rejection is surfaced as a plain-language error rather than losing
 * financial/attendance records silently. Only genuinely unused accounts
 * (never purchased, never booked) can actually go through here.
 */
export async function deleteUserAction(targetUserId: string, confirmPassword: string): Promise<void> {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin") {
    throw new Error("Only super admins can delete accounts.");
  }
  if (targetUserId === admin.id) {
    throw new Error("You can't delete your own account from here.");
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    throw new Error("Deleting accounts requires SUPABASE_SERVICE_ROLE_KEY to be configured — it isn't yet.");
  }

  const rateLimitKey = await getActionClientKey("delete-user", admin.id);
  if (isRateLimited(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 5 })) {
    throw new Error("Too many attempts. Please try again in a few minutes.");
  }

  const verifier = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: admin.email,
    password: confirmPassword,
  });
  if (verifyError) throw new Error("Incorrect password.");

  const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
  if (error) {
    // Postgres surfaces the on-delete-restrict block as a foreign_key_violation.
    if ((error as { code?: string }).code === "23503" || /foreign key/i.test(error.message)) {
      throw new Error(
        "This account has purchase or booking history and can't be deleted — that record has to stay intact. Set it to Customer instead of removing it."
      );
    }
    throw new Error(error.message || "Something went wrong. Please try again.");
  }

  revalidatePath("/admin/users");
}

/**
 * Creates a brand-new account for a staff member and sends them Supabase's
 * own invite email (they set their own password by clicking the link — this
 * app never sees or sets a password on their behalf). Requires the
 * service-role key: creating another person's auth.users row is exactly the
 * kind of operation that can never be done with the anon key, by design —
 * there's no way around that requirement, only around asking the person to
 * self-signup and then promoting them via the role dropdown above.
 */
export async function inviteStaffAction(values: InviteStaffFormValues): Promise<InviteResult> {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin") {
    return { error: "Only super admins can invite staff." };
  }

  const parsed = inviteStaffSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return {
      error:
        "Inviting staff directly requires SUPABASE_SERVICE_ROLE_KEY to be configured — it isn't yet. " +
        "For now, ask them to sign up at /signup, then set their role above.",
    };
  }

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(parsed.data.email, {
    // Routes through /reset-password first so the invite actually makes them
    // choose a password, instead of landing an already-authenticated session
    // straight on /admin. The nested `next` is where /reset-password sends
    // them once that's done.
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.veora.ph"}/auth/callback?next=${encodeURIComponent("/reset-password?next=/admin")}`,
  });
  if (error || !data.user) {
    return { error: error?.message || "Something went wrong sending the invite." };
  }

  // The invite already created the auth.users row (and, via the
  // handle_new_user() trigger, a 'customer' profile) by the time this
  // resolves — promote it to the chosen staff role the same audited way any
  // other role change happens.
  const supabase = await createSupabaseServerClient();
  const { error: roleError } = await supabase.rpc("set_user_role", {
    target_user_id: data.user.id,
    new_role: parsed.data.role,
  });
  if (roleError) {
    return {
      error: `Invite sent, but couldn't set their role automatically (${roleError.message}). Set it manually above once they appear.`,
    };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
