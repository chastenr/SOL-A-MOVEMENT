"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adjustCreditsAction } from "@/app/admin/(protected)/customers/[id]/actions";
import { Button } from "@/components/ui/Button";
import { fieldInputClasses } from "@/components/ui/Field";

export function AdjustCreditsForm({ customerPackageId }: { customerPackageId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedDelta = Number(delta);
    if (!Number.isInteger(parsedDelta) || parsedDelta === 0) {
      setError("Enter a whole number that isn't zero (e.g. 1 or -1).");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await adjustCreditsAction({ customerPackageId, delta: parsedDelta, reason });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setDelta("");
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
        onClick={() => setOpen(true)}
        className="text-xs uppercase tracking-[0.1em] text-charcoal/50 underline underline-offset-2 hover:text-charcoal"
      >
        Adjust Credits
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-charcoal/10 bg-cream/40 p-3">
      <label className="text-xs text-charcoal/50">
        Amount
        <input
          type="number"
          step="1"
          value={delta}
          onChange={(event) => setDelta(event.target.value)}
          placeholder="-1 or 1"
          className={`${fieldInputClasses} mt-1 block w-24 py-2 text-sm`}
        />
      </label>
      <label className="text-xs text-charcoal/50">
        Reason
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Why?"
          className={`${fieldInputClasses} mt-1 block w-48 py-2 text-sm`}
        />
      </label>
      <Button type="submit" size="md" disabled={submitting}>
        {submitting ? "Saving…" : "Save"}
      </Button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-charcoal/40 underline underline-offset-2 hover:text-charcoal"
      >
        Cancel
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
