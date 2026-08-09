"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/auth/require-role";
import { isRateLimited, getActionClientKey } from "@/lib/rate-limit";

const GENERIC_ERROR = "Something went wrong. Please try again.";

/**
 * Disconnects any MFA factor (TOTP or phone) — Supabase's unenroll endpoint
 * is factor-agnostic, so one action covers both. Lives here (not in
 * totp-mfa-actions.ts / phone-mfa-actions.ts) since it isn't specific to
 * either enrollment flow.
 *
 * If this comes back with an AAL2-required error, the caller (see
 * DisconnectMfaButton) is expected to step the session up itself via
 * challengeExistingFactorAction/verifyMfaStepUpAction below and retry —
 * this action doesn't do that itself so it stays a simple, single-purpose
 * RPC wrapper.
 */
export async function unenrollMfaFactorAction(factorId: string): Promise<{ error: string } | { success: true }> {
  const user = await getAuthedUser();
  if (!user) return { error: "Please sign in." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { error: error.message || GENERIC_ERROR };

  revalidatePath("/admin/security");
  return { success: true };
}

/**
 * Opens a challenge against an EXISTING, already-verified factor — distinct
 * from startTotpEnrollmentAction, which is for enrolling a brand-new one.
 * This is the "prove it's still you" step: for TOTP it just opens a
 * challenge window (no message sent); for phone it triggers an SMS.
 */
export async function challengeExistingFactorAction(
  factorId: string
): Promise<{ error: string } | { challengeId: string }> {
  const user = await getAuthedUser();
  if (!user) return { error: "Please sign in." };

  const rateLimitKey = await getActionClientKey("mfa-step-up-challenge", user.id);
  if (isRateLimited(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 8 })) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  if (error || !data) return { error: GENERIC_ERROR };
  return { challengeId: data.id };
}

/**
 * Verifies a step-up challenge against an existing factor and persists the
 * resulting AAL2 session — same pattern as verifyTotpEnrollmentAction, just
 * for "confirm it's you" rather than "finish enrolling."
 */
export async function verifyMfaStepUpAction(
  factorId: string,
  challengeId: string,
  code: string
): Promise<{ error: string } | { success: true }> {
  const user = await getAuthedUser();
  if (!user) return { error: "Please sign in." };

  const rateLimitKey = await getActionClientKey("mfa-step-up-verify", user.id);
  if (isRateLimited(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 8 })) {
    return { error: "Too many attempts. Please request a new code and try again." };
  }

  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
  if (error || !data) return { error: "That code is incorrect or has expired." };

  await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  return { success: true };
}
