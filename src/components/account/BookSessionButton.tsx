"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function BookSessionButton({
  classSessionId,
  customerPackageId,
}: {
  classSessionId: string;
  customerPackageId: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  async function handleBook() {
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
    <div className="text-right">
      <Button type="button" size="md" onClick={handleBook} disabled={submitting}>
        {submitting ? "Booking…" : "Book"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
