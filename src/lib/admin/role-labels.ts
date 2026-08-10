import type { AdminUserRole } from "@/lib/admin/users";

// Shared everywhere a role is shown to a human — the sidebar header badge,
// the invite form, the role-change dropdown and its confirmation dialog —
// so renaming a role's display name never means hunting down scattered
// copies. "super_admin" reads as "Owner" here on purpose: that's the actual
// real-world relationship for the account(s) with full control (staff
// access, role changes, account deletion), not a generic engineering label.
export const ROLE_LABEL: Record<AdminUserRole, string> = {
  customer: "Customer",
  admin: "Admin",
  super_admin: "Owner",
};
