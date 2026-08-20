"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShieldCheck } from "lucide-react";
import {
  startPhoneVerificationAction,
  resendPhoneCodeAction,
  verifyPhoneCodeAction,
} from "@/lib/auth/phone-mfa-actions";
import { maskPhone, normalizePhoneE164 } from "@/lib/phone";
import { Button } from "@/components/ui/Button";
import { Field, fieldInputClasses } from "@/components/ui/Field";
import { OtpInput } from "@/components/auth/OtpInput";

const RESEND_COOLDOWN_SECONDS = 60;

type Step = "phone" | "otp" | "success";

export function PhoneMfaFlow({
  initialPhone = "",
  redirectTo,
  heading = "Verify your mobile number",
  verificationMode = "supabase-mfa",
}: {
  initialPhone?: string;
  redirectTo: string;
  heading?: string;
  verificationMode?: "semaphore" | "supabase-mfa";
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(initialPhone);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((seconds) => Math.max(seconds - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (step !== "success") return;
    const timeout = setTimeout(() => {
      router.push(redirectTo);
      router.refresh();
    }, 1200);
    return () => clearTimeout(timeout);
  }, [step, redirectTo, router]);

  async function handleSendCode(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (verificationMode === "semaphore") {
        const response = await fetch("/api/auth/phone-otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const result = await response.json() as { success?: boolean; message?: string; retryAfter?: number };
        if (!response.ok || !result.success) {
          setError(result.message ?? "Something went wrong. Please try again.");
          if (result.retryAfter) setCooldown(result.retryAfter);
          return;
        }
        const normalized = normalizePhoneE164(phone);
        if (!normalized) {
          setError("Enter a valid Philippine mobile number.");
          return;
        }
        setFactorId("semaphore");
        setChallengeId("semaphore");
        setMaskedPhone(maskPhone(normalized));
        setCode("");
        setCooldown(result.retryAfter ?? RESEND_COOLDOWN_SECONDS);
        setStep("otp");
        return;
      }

      const result = await startPhoneVerificationAction(phone);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if ("alreadyVerified" in result) {
        setStep("success");
        return;
      }
      setFactorId(result.factorId);
      setChallengeId(result.challengeId);
      setMaskedPhone(maskPhone(result.maskedPhone));
      setCode("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!factorId || cooldown > 0) return;
    setSubmitting(true);
    setError(null);
    try {
      if (verificationMode === "semaphore") {
        const response = await fetch("/api/auth/phone-otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const result = await response.json() as { success?: boolean; message?: string; retryAfter?: number };
        if (!response.ok || !result.success) {
          setError(result.message ?? "Something went wrong. Please try again.");
          if (result.retryAfter) setCooldown(result.retryAfter);
          return;
        }
        setCode("");
        setCooldown(result.retryAfter ?? RESEND_COOLDOWN_SECONDS);
        return;
      }

      const result = await resendPhoneCodeAction(factorId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setChallengeId(result.challengeId);
      setCode("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!factorId || !challengeId) return;
    setSubmitting(true);
    setError(null);
    try {
      if (verificationMode === "semaphore") {
        const response = await fetch("/api/auth/phone-otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code }),
        });
        const result = await response.json() as { success?: boolean; message?: string };
        if (!response.ok || !result.success) {
          setError(result.message ?? "Something went wrong. Please try again.");
          return;
        }
        setStep("success");
        return;
      }

      const result = await verifyPhoneCodeAction(factorId, challengeId, code);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setStep("success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {step === "success" ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-2xl border border-charcoal/10 bg-cream/40 px-8 py-16 text-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-charcoal text-ivory">
            <Check size={22} />
          </span>
          <p className="font-display mt-6 text-2xl text-charcoal">Number verified.</p>
          <p className="mt-2 max-w-sm text-charcoal/65">Taking you back now…</p>
        </motion.div>
      ) : step === "otp" ? (
        <motion.form
          key="otp"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleVerify}
          className="flex flex-col items-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-clay">
            <ShieldCheck size={20} aria-hidden />
          </span>
          <p className="font-display mt-6 text-2xl text-charcoal">{heading}</p>
          <p className="mt-2 max-w-sm text-center text-charcoal/65">
            We sent a 6-digit verification code to <span className="text-charcoal">{maskedPhone}</span>.
          </p>

          <div className="mt-8">
            <OtpInput value={code} onChange={setCode} disabled={submitting} autoFocus />
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <Button type="submit" size="lg" disabled={submitting || code.length !== 6} className="mt-8 w-full max-w-xs">
            {submitting ? "Verifying…" : "Verify Number"}
          </Button>

          <div className="mt-5 text-sm text-charcoal/55">
            Didn&rsquo;t receive a code?{" "}
            {cooldown > 0 ? (
              <span>Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={submitting}
                className="underline underline-offset-2 hover:text-charcoal disabled:opacity-50"
              >
                Resend code
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setError(null);
              setCode("");
            }}
            className="mt-2 text-sm text-charcoal/45 underline underline-offset-2 hover:text-charcoal"
          >
            Change Number
          </button>
        </motion.form>
      ) : (
        <motion.form key="phone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSendCode} className="grid gap-5">
          <p className="font-display text-center text-2xl text-charcoal">{heading}</p>
          <p className="text-center text-sm text-charcoal/60">
            Confirm your mobile number and we&rsquo;ll text you a 6-digit code.
          </p>
          <Field label="Mobile Number" required error={error ?? undefined}>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={fieldInputClasses}
              autoComplete="tel"
              placeholder="09171234567"
            />
          </Field>
          <Button type="submit" size="lg" disabled={submitting || !phone} className="w-full">
            {submitting ? "Sending…" : "Send Code"}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
