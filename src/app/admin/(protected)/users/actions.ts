"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminUserRole } from "@/lib/admin/users";

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
