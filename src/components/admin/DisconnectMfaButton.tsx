"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  unenrollMfaFactorAction,
  challengeExistingFactorAction,
  verifyMfaStepUpAction,
} from "@/lib/auth/mfa-management-actions";
import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/Button";

// Matches Supabase's own message ("AAL2 required to unenroll verified
// factor") without depending on its exact wording — a session that hasn't
// completed an MFA challenge this session can enroll/browse fine but can't
// remove a verified factor; that's Supabase's own rule, not this app's.
function isAal2RequiredError(message: string): boolean {
  return message.toLowerCase().includes("aal2");
}

export function DisconnectMfaButton({ factorId }: { factorId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  async function attemptDisconnect() {
    const result = await unenrollMfaFactorAction(factorId);
    if ("error" in result) {
      // Supabase requires the session to have completed an MFA challenge
      // (AAL2) before it'll let you remove a verified factor — a session
      // that was never challenged this login (e.g. MFA was enrolled while
      // it wasn't required app-wide) can't unenroll directly. Rather than
      // showing that raw message, ask for a code right here and retry.
      if (isAal2RequiredError(result.error)) {
        const challenge = await challengeExistingFactorAction(factorId);
        if ("error" in challenge) {
          setError(challenge.error);
          return;
        }
        setChallengeId(challenge.challengeId);
        setError(null);
        return;
      }
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDisconnect() {
    if (!window.confirm("Disconnect this sign-in method? You can set it up again anytime.")) return;
    setSubmitting(true);
    setError(null);
    try {
      await attemptDisconnect();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyAndRetry(event: React.FormEvent) {
    event.preventDefault();
    if (!challengeId) return;
    setSubmitting(true);
    setError(null);
    try {
      const verified = await verifyMfaStepUpAction(factorId, challengeId, code);
      if ("error" in verified) {
        setError(verified.error);
        return;
      }
      setChallengeId(null);
      setCode("");
      await attemptDisconnect();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (challengeId) {
    return (
      <form onSubmit={handleVerifyAndRetry} className="mt-4">
        <p className="text-xs text-charcoal/60">Enter the current code to confirm it&rsquo;s you, then we&rsquo;ll disconnect it.</p>
        <div className="mt-3">
          <OtpInput value={code} onChange={setCode} disabled={submitting} autoFocus />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        <div className="mt-3 flex items-center gap-3">
          <Button type="submit" size="md" disabled={submitting || code.length !== 6}>
            {submitting ? "Confirming…" : "Confirm & Disconnect"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setChallengeId(null);
              setCode("");
              setError(null);
            }}
            disabled={submitting}
            className="text-xs text-charcoal/50 underline underline-offset-2 hover:text-charcoal"
          >
            Cancel
          </button>
        </div>
      </form>
    );
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
