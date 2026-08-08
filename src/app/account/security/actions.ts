"use server";

import { requireUser } from "@/lib/auth/require-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations";
import { isRateLimited, getActionClientKey } from "@/lib/rate-limit";

type ActionResult = { error: string } | { success: true };

export async function changePasswordAction(values: ResetPasswordFormValues): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const rateLimitKey = await getActionClientKey("change-password", user.id);
  if (isRateLimited(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 5 })) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message || "Something went wrong. Please try again." };

  return { success: true };
}
