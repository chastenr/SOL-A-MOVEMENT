"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { grantPackageAction } from "@/app/admin/(protected)/customers/[id]/actions";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";

export function GrantPackageForm({
  userId,
  packages,
}: {
  userId: string;
  packages: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!packageId) return;
    if (!window.confirm("Grant this package for free? The customer will get the credits immediately.")) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const result = await grantPackageAction({ userId, packageId, reason });
      if ("error" in result) {
        setMessage(result.error);
        return;
      }
      setMessage("Package granted — credits are active now.");
      setReason("");
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (packages.length === 0) {
    return <p className="text-sm text-charcoal/55">No active packages to grant — create one under Packages first.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Package" required>
        <select
          value={packageId}
          onChange={(event) => setPackageId(event.target.value)}
          className={`${fieldInputClasses} appearance-none`}
        >
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Reason (optional)">
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className={fieldInputClasses}
          placeholder="Referral bonus, apology, etc."
        />
      </Field>

      {message && <p className="text-sm text-charcoal/60 sm:col-span-2">{message}</p>}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Granting…" : "Grant Package"}
        </Button>
      </div>
    </form>
  );
}
