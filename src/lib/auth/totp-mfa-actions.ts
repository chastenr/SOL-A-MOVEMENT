"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/auth/require-role";
import { isRateLimited, getActionClientKey } from "@/lib/rate-limit";

const GENERIC_ERROR = "Something went wrong. Please try again.";

type StartResult =
  | { error: string }
  | { alreadyEnrolled: true }
  | { factorId: string; challengeId: string; qrCode: string; secret: string };

/**
 * Enrolls a TOTP (authenticator app) MFA factor for the current admin and
 * immediately opens a challenge for the first verification. Unlike phone
 * MFA, this needs no external SMS provider — the code is generated locally
 * by the user's own authenticator app — so it works today regardless of
 * whether a Phone provider is configured in the Supabase dashboard.
 */
export async function startTotpEnrollmentAction(): Promise<StartResult> {
  const user = await getAuthedUser();
  if (!user) return { error: "Please sign in." };

  const rateLimitKey = await getActionClientKey("totp-enroll", user.id);
  if (isRateLimited(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 5 })) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) return { error: GENERIC_ERROR };

  const alreadyEnrolled = (factorsData?.totp ?? []).some((f) => f.status === "verified");
  if (alreadyEnrolled) return { alreadyEnrolled: true };

  // Start clean on every attempt so a retry doesn't pile up dead unverified
  // factors from an earlier abandoned enrollment.
  const staleUnverified = (factorsData?.all ?? []).filter(
    (f) => f.factor_type === "totp" && f.status === "unverified"
  );
  for (const factor of staleUnverified) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }

  const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Authenticator App",
  });
  if (enrollError || !enrollData) return { error: GENERIC_ERROR };

  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: enrollData.id,
  });
  if (challengeError || !challengeData) {
    await supabase.auth.mfa.unenroll({ factorId: enrollData.id });
    return { error: GENERIC_ERROR };
  }

  return {
    factorId: enrollData.id,
    challengeId: challengeData.id,
    qrCode: enrollData.totp.qr_code,
    secret: enrollData.totp.secret,
  };
}

type ChallengeResult = { error: string } | { challengeId: string };

/** Re-opens a challenge against an already-enrolled-but-unverified factor — used if the first code expires. */
export async function refreshTotpChallengeAction(factorId: string): Promise<ChallengeResult> {
  const user = await getAuthedUser();
  if (!user) return { error: "Please sign in." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  if (error || !data) return { error: GENERIC_ERROR };
  return { challengeId: data.id };
}

type VerifyResult = { error: string } | { success: true };

export async function verifyTotpEnrollmentAction(
  factorId: string,
  challengeId: string,
  code: string
): Promise<VerifyResult> {
  const user = await getAuthedUser();
  if (!user) return { error: "Please sign in." };

  const rateLimitKey = await getActionClientKey("totp-verify", user.id);
  if (isRateLimited(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 8 })) {
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

  return { success: true };
}

