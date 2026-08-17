"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelClassSessionAction } from "@/app/admin/(protected)/classes/actions";

export function CancelClassSessionButton({ sessionId, bookedCount }: { sessionId: string; bookedCount: number }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    const message =
      bookedCount > 0
        ? `Cancel this class?\n\n${bookedCount} customer${bookedCount === 1 ? "" : "s"} currently ${bookedCount === 1 ? "has" : "have"} a reservation. Any deducted package credits will be restored and everyone will be notified.`
        : "Cancel this class? No one is currently booked.";
    if (!window.confirm(message)) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await cancelClassSessionAction(sessionId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleCancel}
        disabled={submitting}
        className="text-xs uppercase tracking-[0.1em] text-charcoal/50 underline underline-offset-2 hover:text-red-600 disabled:opacity-50"
      >
        {submitting ? "Cancelling…" : "Cancel Class"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
