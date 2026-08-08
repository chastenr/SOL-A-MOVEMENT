"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/auth/require-role";
import { normalizePhoneE164 } from "@/lib/phone";
import { isRateLimited, getActionClientKey } from "@/lib/rate-limit";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const SMS_NOT_CONFIGURED_ERROR =
  "We couldn't send a verification code right now. SMS verification may not be configured yet — please contact support.";

type StartResult =
  | { error: string }
  | { alreadyVerified: true }
  | { factorId: string; challengeId: string; maskedPhone: string; expiresAt: number };

/**
 * Enrolls (or re-enrolls, if a previous attempt was abandoned) a phone MFA
 * factor for the CURRENT authenticated user and immediately sends the first
 * OTP. Shared by both the customer /verify-phone flow and the admin
 * /admin/mfa flow — they're the exact same underlying Supabase phone factor
 * mechanism, just reached from different pages with different post-success
 * redirects.
 */
export async function startPhoneVerificationAction(rawPhone: string): Promise<StartResult> {
  const user = await getAuthedUser();
  if (!user) return { error: "Please sign in." };

  const rateLimitKey = await getActionClientKey("phone-challenge", user.id);
  if (isRateLimited(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 3 })) {
    return { error: "Too many verification attempts. Please try again in a few minutes." };
  }

  const phone = normalizePhoneE164(rawPhone);
  if (!phone) return { error: "Enter a valid mobile number." };

  const supabase = await createSupabaseServerClient();

  const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) return { error: GENERIC_ERROR };

  const alreadyVerified = (factorsData?.phone ?? []).some((f) => f.status === "verified");
  if (alreadyVerified) {
    const { error: markError } = await supabase.rpc("mark_phone_verified");
    if (markError) return { error: GENERIC_ERROR };
    return { alreadyVerified: true };
  }

  // Start clean on every attempt so the enrolled number always matches what
  // the customer just confirmed, rather than reusing a stale unverified
  // factor from an earlier abandoned attempt against a different number.
  const staleUnverified = (factorsData?.all ?? []).filter(
    (f) => f.factor_type === "phone" && f.status === "unverified"
  );
  for (const factor of staleUnverified) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }

  const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
    factorType: "phone",
    phone,
    friendlyName: "Primary Phone",
  });
  if (enrollError || !enrollData) return { error: GENERIC_ERROR };

  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: enrollData.id,
    channel: "sms",
  });
  if (challengeError || !challengeData) {
    // Clean up the unverified factor we just created so a retry doesn't pile
    // up dead factors when the SMS provider isn't configured.
    await supabase.auth.mfa.unenroll({ factorId: enrollData.id });
    return { error: SMS_NOT_CONFIGURED_ERROR };
  }

  return {
    factorId: enrollData.id,
    challengeId: challengeData.id,
    maskedPhone: phone,
    expiresAt: challengeData.expires_at,
  };
}

type ResendResult = { error: string } | { challengeId: string; expiresAt: number };

export async function resendPhoneCodeAction(factorId: string): Promise<ResendResult> {
  const user = await getAuthedUser();
  if (!user) return { error: "Please sign in." };

  const rateLimitKey = await getActionClientKey("phone-challenge", user.id);
  if (isRateLimited(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 3 })) {
    return { error: "Too many attempts. Please wait a few minutes before requesting another code." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.challenge({ factorId, channel: "sms" });
  if (error || !data) return { error: SMS_NOT_CONFIGURED_ERROR };

  return { challengeId: data.id, expiresAt: data.expires_at };
}

type VerifyResult = { error: string } | { success: true };

export async function verifyPhoneCodeAction(
  factorId: string,
  challengeId: string,
  code: string
): Promise<VerifyResult> {
  const user = await getAuthedUser();
  if (!user) return { error: "Please sign in." };

  const rateLimitKey = await getActionClientKey("phone-verify", user.id);
  if (isRateLimited(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 5 })) {
    return { error: "Too many attempts. Please request a new code and try again." };
  }

  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
  if (error || !data) return { error: "That code is incorrect or has expired." };

  // Persist the elevated-AAL session verify() returns — without this, the
  // cookie-bound session stays at the pre-verification AAL.
  await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  // Trusted, server-only flag — re-derives identity from auth.uid() and
  // re-checks auth.mfa_factors internally (see migration 0003).
  const { error: markError } = await supabase.rpc("mark_phone_verified");
  if (markError) return { error: "Verified, but we couldn't update your account. Please contact support." };

  return { success: true };
}
