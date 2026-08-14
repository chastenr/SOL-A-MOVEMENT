"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adjustCreditsAction } from "@/app/admin/(protected)/customers/[id]/actions";
import { Button } from "@/components/ui/Button";
import { fieldInputClasses } from "@/components/ui/Field";

export function AdjustCreditsForm({
  customerPackageId,
  currentCredits,
  maximumCredits,
  packageName,
}: {
  customerPackageId: string;
  currentCredits: number;
  maximumCredits: number;
  packageName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newBalance, setNewBalance] = useState(String(currentCredits));
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedBalance = Number(newBalance);
    if (!Number.isInteger(parsedBalance) || parsedBalance < 0 || parsedBalance > maximumCredits) {
      setError(`Enter a whole number from 0 to ${maximumCredits}.`);
      return;
    }

    if (parsedBalance === currentCredits) {
      setError("Enter a balance different from the current balance.");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (!window.confirm(`Change this package from ${currentCredits} to ${parsedBalance} available credits?`)) return;

      const result = await adjustCreditsAction({ customerPackageId, newBalance: parsedBalance, reason });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setNewBalance(String(parsedBalance));
      setReason("");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setNewBalance(String(currentCredits));
          setError(null);
          setOpen(true);
        }}
        className="inline-flex min-h-9 items-center rounded-full border border-charcoal/20 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-charcoal transition-colors hover:border-charcoal hover:bg-charcoal hover:text-ivory"
      >
        Update credits
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-xl border border-charcoal/10 bg-cream/40 p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-charcoal">Update {packageName}</p>
        <p className="mt-1 text-xs text-charcoal/55">
          Current balance: {currentCredits} of {maximumCredits} credits
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,180px)_minmax(240px,1fr)]">
        <label className="text-xs font-medium text-charcoal/60">
          New available balance
          <input
            type="number"
            step="1"
            min="0"
            max={maximumCredits}
            required
            value={newBalance}
            onChange={(event) => setNewBalance(event.target.value)}
            className={`${fieldInputClasses} mt-1 block py-2 text-sm`}
          />
        </label>
        <label className="text-xs font-medium text-charcoal/60">
          Reason for change
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            maxLength={300}
            placeholder="Example: Correcting a payment or complimentary credit"
            className={`${fieldInputClasses} mt-1 block py-2 text-sm`}
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" size="md" disabled={submitting}>
          {submitting ? "Saving…" : "Save"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="text-xs text-charcoal/40 underline underline-offset-2 hover:text-charcoal"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
