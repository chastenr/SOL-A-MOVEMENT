"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function BookSessionButton({
  classSessionId,
  customerPackageId,
  sessionName,
  scheduleLabel,
}: {
  classSessionId: string;
  customerPackageId: string;
  sessionName: string;
  scheduleLabel: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classSessionId, customerPackageId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (data?.code === "PHONE_NOT_VERIFIED") {
          router.push(`/verify-phone?redirectTo=${encodeURIComponent("/account/book")}`);
          return;
        }
        setError(data?.message || "Something went wrong. Please try again.");
        return;
      }
      setBooked(true);
      setConfirming(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (booked) {
    return <span className="text-xs text-clay">Booked</span>;
  }

  return (
    <>
      <div className="text-right">
        <Button type="button" size="md" onClick={() => setConfirming(true)}>
          Book
        </Button>
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-confirm-heading"
        >
          <div className="w-full max-w-sm rounded-2xl bg-ivory p-6 shadow-xl">
            <h2 id="booking-confirm-heading" className="font-display text-lg text-charcoal">
              Confirm your reservation
            </h2>
            <p className="mt-2 text-sm text-charcoal">{sessionName}</p>
            <p className="text-sm text-charcoal/55">{scheduleLabel}</p>

            <div className="mt-4 space-y-2 rounded-xl bg-cream/50 p-4 text-xs leading-relaxed text-charcoal/70">
              <p>One session will be deducted from your package when this reservation is confirmed.</p>
              <p>Bookings close at 10:00 PM the evening before class.</p>
              <p>
                We&rsquo;ll confirm by 10:00 PM the night before whether this class has enough people to run.
                If it&rsquo;s cancelled, your credit is automatically returned and we&rsquo;ll email you either way.
              </p>
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex gap-3">
              <Button type="button" size="md" onClick={handleConfirm} disabled={submitting} className="flex-1">
                {submitting ? "Booking…" : "Confirm Booking"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setConfirming(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
