"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (!window.confirm("Cancel this booking? Your credit will be refunded.")) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.message || "Something went wrong. Please try again.");
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
        className="text-xs underline underline-offset-2 hover:text-charcoal disabled:opacity-50"
      >
        {submitting ? "Cancelling…" : "Cancel"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
