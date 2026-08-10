"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserRoleAction } from "@/app/admin/(protected)/users/actions";
import type { AdminUserRole } from "@/lib/admin/users";
import { Button } from "@/components/ui/Button";
import { fieldInputClasses } from "@/components/ui/Field";

const ROLE_OPTIONS: { value: AdminUserRole; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

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
  const [pendingRole, setPendingRole] = useState<AdminUserRole | null>(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(nextRole: AdminUserRole) {
    if (nextRole === role) return;
    // Every real change lands here — the only no-op is picking the role
    // that's already selected. Granting/revoking admin access is sensitive
    // enough that it always needs the admin's own password re-entered, not
    // just an "OK" click.
    setPendingRole(nextRole);
    setPassword("");
    setError(null);
  }

  async function handleConfirmSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!pendingRole) return;

    const previousRole = role;
    setRole(pendingRole);
    setSubmitting(true);
    setError(null);
    try {
      await updateUserRoleAction(userId, pendingRole, password);
      setPendingRole(null);
      setPassword("");
      router.refresh();
    } catch (err) {
      setRole(previousRole);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    setPendingRole(null);
    setPassword("");
    setError(null);
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

      {pendingRole && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-role-heading"
        >
          <form onSubmit={handleConfirmSubmit} className="w-full max-w-sm rounded-2xl bg-ivory p-6 shadow-xl">
            <h2 id="confirm-role-heading" className="font-display text-lg text-charcoal">
              Confirm role change
            </h2>
            <p className="mt-2 text-sm text-charcoal/70">
              Change this account&rsquo;s role from <strong>{role.replace("_", " ")}</strong> to{" "}
              <strong>{pendingRole.replace("_", " ")}</strong>? This takes effect immediately. Enter your own
              password to confirm.
            </p>
            <div className="mt-4">
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                className={fieldInputClasses}
              />
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex gap-3">
              <Button type="submit" size="md" disabled={submitting || !password} className="flex-1">
                {submitting ? "Confirming…" : "Confirm Change"}
              </Button>
              <Button type="button" variant="secondary" size="md" onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
