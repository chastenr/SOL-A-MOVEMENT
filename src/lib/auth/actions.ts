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

type ActionResult = { error: string } | { success: true };
type SignUpResult = { error: string } | { success: true; needsEmailConfirmation: boolean };

const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function signUpAction(values: SignUpFormValues): Promise<SignUpResult> {
  const parsed = signUpSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const key = await getActionClientKey("signup", parsed.data.email);
  if (isRateLimited(key, { windowMs: 15 * 60 * 1000, max: 5 })) {
    return { error: "Too many sign-up attempts. Please try again in a few minutes." };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = parsed;

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      // NOTE: role is never accepted here — it's hardcoded to 'customer' by
      // the handle_new_user() DB trigger regardless of what's sent.
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        mobile_number: data.mobileNumber,
        birthday: data.birthday || null,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/account`,
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
  // Deliberately ignore the result — never reveal whether an email exists
  // in the system via response timing/content differences.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  });

  return { success: true };
}

export async function resetPasswordAction(values: ResetPasswordFormValues): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  }

  const supabase = await createSupabaseServerClient();
  // Requires an active recovery session, established by the /auth/callback
  // PKCE exchange when the customer clicked the reset-password email link.
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: error.message || GENERIC_ERROR };
  }

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
