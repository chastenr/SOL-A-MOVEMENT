"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import { inviteStaffSchema, type InviteStaffFormValues } from "@/lib/validations";
import type { AdminUserRole } from "@/lib/admin/users";

type InviteResult = { error: string } | { success: true };

/**
 * Thin wrapper around the `set_user_role()` RPC (see migration 0001) — that
 * function is the actual security boundary (it re-checks is_super_admin()
 * itself and writes the audit log row), this just adds UI-facing guards so a
 * plain admin never even sees a working control, and so a super_admin can't
 * accidentally lock everyone out by demoting their own only account.
 */
export async function updateUserRoleAction(targetUserId: string, newRole: AdminUserRole): Promise<void> {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin") {
    throw new Error("Only super admins can change roles.");
  }
  if (targetUserId === admin.id) {
    throw new Error("You can't change your own role from here.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_user_role", {
    target_user_id: targetUserId,
    new_role: newRole,
  });
  if (error) throw new Error(error.message || "Something went wrong. Please try again.");

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
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/admin`,
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
