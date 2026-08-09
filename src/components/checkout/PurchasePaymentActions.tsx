"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { markPaidAction } from "@/app/purchases/[id]/actions";
import { Button } from "@/components/ui/Button";

export function PurchasePaymentActions({
  purchaseId,
  hasReceipt,
}: {
  purchaseId: string;
  hasReceipt: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(hasReceipt);

  async function handleMarkPaid() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await markPaidAction(purchaseId);
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

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("receipt", file);
      const response = await fetch(`/api/purchases/${purchaseId}/receipt`, { method: "POST", body: formData });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.message || "Upload failed. Please try again.");
        return;
      }
      setUploaded(true);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.1em] text-charcoal/45">Upload Payment Receipt</p>
        <div className="mt-2 flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="text-sm text-charcoal/70 file:mr-3 file:rounded-full file:border-0 file:bg-cream file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-[0.1em] file:text-charcoal hover:file:bg-sand"
          />
          {uploaded && (
            <span className="flex items-center gap-1 text-xs text-clay">
              <Check size={14} aria-hidden /> Uploaded
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-charcoal/40">
          {uploaded ? "JPEG, PNG or PDF, up to 4MB." : "Required before you can confirm payment — JPEG, PNG or PDF, up to 4MB."}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="button" size="lg" onClick={handleMarkPaid} disabled={submitting || !uploaded} className="w-full">
        {submitting ? "Submitting…" : uploaded ? "I Have Paid" : "Upload a receipt to continue"}
      </Button>
    </div>
  );
}
