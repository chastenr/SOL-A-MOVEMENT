"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unenrollMfaFactorAction } from "@/lib/auth/mfa-management-actions";

export function DisconnectMfaButton({ factorId }: { factorId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDisconnect() {
    if (!window.confirm("Disconnect this sign-in method? You can set it up again anytime.")) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await unenrollMfaFactorAction(factorId);
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
    <div className="mt-4">
      <button
        type="button"
        onClick={handleDisconnect}
        disabled={submitting}
        className="text-xs uppercase tracking-[0.15em] text-charcoal/50 underline underline-offset-2 hover:text-red-600 disabled:opacity-50"
      >
        {submitting ? "Disconnecting…" : "Disconnect"}
      </button>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
