"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approvePurchaseAction, rejectPurchaseAction } from "@/app/admin/(protected)/payments/actions";
import { Button } from "@/components/ui/Button";
import { fieldInputClasses } from "@/components/ui/Field";

export function PaymentReviewActions({ purchaseId }: { purchaseId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [reason, setReason] = useState("");

  async function handleApprove() {
    setSubmitting("approve");
    setError(null);
    try {
      const result = await approvePurchaseAction(purchaseId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleReject() {
    setSubmitting("reject");
    setError(null);
    try {
      const result = await rejectPurchaseAction(purchaseId, reason);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={handleApprove} disabled={submitting !== null}>
          {submitting === "approve" ? "Approving…" : "Approve"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="border-red-300 text-red-600 hover:border-red-500 hover:bg-red-500 hover:text-ivory"
          onClick={() => setShowRejectReason((open) => !open)}
          disabled={submitting !== null}
        >
          Reject
        </Button>
      </div>

      {showRejectReason && (
        <div className="mt-3 max-w-sm">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason (shown to the customer)"
            rows={2}
            className={fieldInputClasses}
          />
          <Button type="button" size="md" variant="secondary" onClick={handleReject} disabled={submitting !== null} className="mt-2">
            {submitting === "reject" ? "Rejecting…" : "Confirm Reject"}
          </Button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
