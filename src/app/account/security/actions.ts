"use server";

import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { changePasswordSchema, changeEmailSchema, type ChangePasswordFormValues, type ChangeEmailFormValues } from "@/lib/validations";
import { isRateLimited, getActionClientKey } from "@/lib/rate-limit";

type ActionResult = { error: string } | { success: true };

export async function changePasswordAction(values: ChangePasswordFormValues): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const rateLimitKey = await getActionClientKey("change-password", user.id);
  if (isRateLimited(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 5 })) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  // Confirm the current password on a throwaway, session-less client rather
  // than the cookie-bound one — signing in there would persist a fresh
  // AAL1 session and silently drop an admin who'd already stepped up to
  // AAL2 for MFA-gated actions this session.
  const verifier = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) return { error: "Current password is incorrect." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message || "Something went wrong. Please try again." };

  return { success: true };
}

type ChangeEmailResult = { error: string } | { success: true };

/**
 * Requests an email change via Supabase Auth's own flow — it sends a
 * confirmation link to the new address (and, depending on project settings,
 * a notice to the old one) before the change actually takes effect. The
 * `profiles.email` column stays untouched until that confirmation lands,
 * synced automatically by the `handle_user_email_update()` trigger (0001).
 */
export async function changeEmailAction(values: ChangeEmailFormValues): Promise<ChangeEmailResult> {
  const user = await requireUser();
  const parsed = changeEmailSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const rateLimitKey = await getActionClientKey("change-email", user.id);
  if (isRateLimited(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 5 })) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/account/security` }
  );
  if (error) return { error: error.message || "Something went wrong. Please try again." };

  return { success: true };
}
