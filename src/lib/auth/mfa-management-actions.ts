"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/auth/require-role";

const GENERIC_ERROR = "Something went wrong. Please try again.";

/**
 * Disconnects any MFA factor (TOTP or phone) — Supabase's unenroll endpoint
 * is factor-agnostic, so one action covers both. Lives here (not in
 * totp-mfa-actions.ts / phone-mfa-actions.ts) since it isn't specific to
 * either enrollment flow — it's what lets an admin manage their MFA setup
 * without ever needing to revisit /admin/mfa, which redirects away the
 * moment the session is already AAL2 (that page is a one-shot verification
 * gate, not a management screen).
 */
export async function unenrollMfaFactorAction(factorId: string): Promise<{ error: string } | { success: true }> {
  const user = await getAuthedUser();
  if (!user) return { error: "Please sign in." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  // Supabase requires an AAL2 session to unenroll a verified factor — surface
  // its own message (e.g. "AAL2 required") rather than a generic one here.
  if (error) return { error: error.message || GENERIC_ERROR };

  revalidatePath("/admin/security");
  return { success: true };
}
