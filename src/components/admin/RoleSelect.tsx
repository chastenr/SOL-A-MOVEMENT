"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserRoleAction } from "@/app/admin/(protected)/users/actions";
import type { AdminUserRole } from "@/lib/admin/users";

const ROLE_OPTIONS: { value: AdminUserRole; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const CONFIRM_ROLES: AdminUserRole[] = ["admin", "super_admin"];

export function RoleSelect({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: AdminUserRole;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState<AdminUserRole>(currentRole);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(nextRole: AdminUserRole) {
    if (nextRole === role) return;

    if (CONFIRM_ROLES.includes(nextRole) || CONFIRM_ROLES.includes(role)) {
      const confirmed = window.confirm(
        `Change this account's role from "${role}" to "${nextRole}"? This takes effect immediately.`
      );
      if (!confirmed) return;
    }

    const previousRole = role;
    setRole(nextRole);
    setSubmitting(true);
    setError(null);
    try {
      await updateUserRoleAction(userId, nextRole);
      router.refresh();
    } catch (err) {
      setRole(previousRole);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <select
        value={role}
        disabled={disabled || submitting}
        onChange={(event) => handleChange(event.target.value as AdminUserRole)}
        className="rounded-lg border border-charcoal/15 bg-ivory px-3 py-1.5 text-sm text-charcoal disabled:opacity-50"
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
