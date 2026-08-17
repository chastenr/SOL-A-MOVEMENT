"use server";

import { redirect } from "next/navigation";
import {
  signUpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type SignUpFormValues,
  type LoginFormValues,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from "@/lib/validations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRateLimited, getActionClientKey } from "@/lib/rate-limit";
import { normalizePhoneE164 } from "@/lib/phone";
import { sanitizeRedirectTo } from "@/lib/utils";
import { getAuthRedirectOrigin } from "@/lib/auth/request-origin";

type ActionResult = { error: string } | { requiresMfa: true } | { success: true };
type SignUpResult = { error: string } | { success: true; needsEmailConfirmation: boolean };

const GENERIC_ERROR = "Something went wrong. Please try again.";
const WAIVER_VERSION = "2026-08-18";

export async function signUpAction(values: SignUpFormValues, redirectTo?: string): Promise<SignUpResult> {
  const parsed = signUpSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const key = await getActionClientKey("signup", parsed.data.email);
  if (isRateLimited(key, { windowMs: 15 * 60 * 1000, max: 5 })) {
    return { error: "Too many sign-up attempts. Please try again in a few minutes." };
  }

  // Never trust customer-typed phone formatting — normalize to E.164 here so
  // profiles.mobile_number is always in the shape phone MFA enrollment needs.
  const mobileNumber = normalizePhoneE164(parsed.data.mobileNumber);
  if (!mobileNumber) {
    return { error: "Enter a valid mobile number." };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = parsed;
  const safeRedirectTo = sanitizeRedirectTo(redirectTo, "/account");
  const authRedirectOrigin = await getAuthRedirectOrigin();

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      // NOTE: role is never accepted here — it's hardcoded to 'customer' by
      // the handle_new_user() DB trigger regardless of what's sent.
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        mobile_number: mobileNumber,
        birthday: data.birthday || null,
        waiver_accepted: true,
        waiver_version: WAIVER_VERSION,
        marketing_consent: data.marketingConsent,
      },
      emailRedirectTo: `${authRedirectOrigin}/auth/callback?next=${encodeURIComponent(safeRedirectTo)}`,
    },
  });

  if (error) {
    // Supabase returns a generic-enough message for "already registered" —
    // pass it through rather than leaking implementation details, but keep
    // a safe fallback for anything unexpected.
    return { error: error.message || GENERIC_ERROR };
  }

  // If email confirmation is required (the project default), signUp()
  // returns a user but no active session yet — the client shows a "check
  // your email" screen instead of redirecting into /account.
  return { success: true, needsEmailConfirmation: !signUpData.session };
}

export async function loginAction(values: LoginFormValues): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const key = await getActionClientKey("login", parsed.data.email);
  if (isRateLimited(key, { windowMs: 10 * 60 * 1000, max: 8 })) {
    return { error: "Too many sign-in attempts. Please wait a few minutes and try again." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Incorrect email or password." };
  }

  return { success: true };
}

export async function forgotPasswordAction(values: ForgotPasswordFormValues): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const key = await getActionClientKey("forgot-password", parsed.data.email);
  if (isRateLimited(key, { windowMs: 15 * 60 * 1000, max: 4 })) {
    return { error: "Too many requests. Please try again in a few minutes." };
  }

  const supabase = await createSupabaseServerClient();
  const authRedirectOrigin = await getAuthRedirectOrigin();
  // Supabase deliberately returns success for unknown addresses, so handling
  // delivery/configuration errors here does not reveal whether an account exists.
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    // The default hosted template follows Supabase's ConfirmationURL and
    // returns here with a PKCE code. The branded Veora template uses the
    // direct /auth/confirm token-hash endpoint instead, so both paths work.
    redirectTo: `${authRedirectOrigin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return {
        error: "Too many reset links were requested. Please wait up to one hour before trying again.",
      };
    }
    return { error: "We couldn't send the reset email. Please try again shortly." };
  }

  return { success: true };
}

export async function resetPasswordAction(values: ResetPasswordFormValues): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const supabase = await createSupabaseServerClient();
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2" && assurance?.nextLevel === "aal2") {
    return { requiresMfa: true };
  }

  // Requires an active recovery session, established by the /auth/callback
  // PKCE exchange when the customer clicked the reset-password email link.
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    // Protect against a stale AAL check or a session that was downgraded
    // between the assurance check and the password mutation.
    if (error.message.toLowerCase().includes("aal2")) return { requiresMfa: true };
    return { error: error.message || GENERIC_ERROR };
  }

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
