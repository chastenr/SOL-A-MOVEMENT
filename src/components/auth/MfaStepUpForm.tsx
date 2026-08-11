"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, MessageSquareText, ShieldCheck } from "lucide-react";
import {
  challengeExistingFactorAction,
  verifyMfaStepUpAction,
} from "@/lib/auth/mfa-management-actions";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/auth/OtpInput";

type MfaFactor = {
  id: string;
  type: "totp" | "phone";
  label: string;
};

export function MfaStepUpForm({ factors, redirectTo }: { factors: MfaFactor[]; redirectTo: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<MfaFactor | null>(factors.length === 1 ? factors[0] : null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startChallenge(factor: MfaFactor) {
    setSubmitting(true);
    setError(null);
    setSelected(factor);
    try {
      const result = await challengeExistingFactorAction(factor.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setChallengeId(result.challengeId);
      setCode("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !challengeId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await verifyMfaStepUpAction(selected.id, challengeId, code);
      if ("error" in result) {
        setError(result.error);
        setCode("");
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!challengeId) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cream text-clay">
          <ShieldCheck size={21} aria-hidden />
        </span>
        <h1 className="font-display mt-6 text-3xl text-charcoal">Verify your identity</h1>
        <p className="mt-3 text-sm leading-6 text-charcoal/60">
          Complete your second verification step before changing your email or password.
        </p>

        <div className="mt-8 grid gap-3">
          {factors.map((factor) => (
            <Button
              key={factor.id}
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => startChallenge(factor)}
              className="w-full"
            >
              {factor.type === "totp" ? <KeyRound size={17} aria-hidden /> : <MessageSquareText size={17} aria-hidden />}
              {submitting && selected?.id === factor.id ? "Starting…" : factor.label}
            </Button>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={verify} className="flex flex-col items-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-clay">
        <ShieldCheck size={21} aria-hidden />
      </span>
      <h1 className="font-display mt-6 text-3xl text-charcoal">Enter your verification code</h1>
      <p className="mt-3 text-sm leading-6 text-charcoal/60">
        {selected?.type === "phone"
          ? "Enter the 6-digit code sent to your phone."
          : "Open your authenticator app and enter the current 6-digit code."}
      </p>
      <div className="mt-8">
        <OtpInput value={code} onChange={setCode} disabled={submitting} autoFocus />
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" disabled={submitting || code.length !== 6} className="mt-8 w-full">
        {submitting ? "Verifying…" : "Verify & Continue"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setChallengeId(null);
          setCode("");
          setError(null);
        }}
        className="mt-5 text-sm text-charcoal/50 underline underline-offset-2 hover:text-charcoal"
      >
        Use another method
      </button>
    </form>
  );
}
