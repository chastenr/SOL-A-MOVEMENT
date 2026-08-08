/**
 * Both default to `false` — the safe state while no SMS provider is
 * configured in the Supabase dashboard (Authentication → Providers →
 * Phone). Flipping either to `true` enforces the corresponding gate;
 * neither is ever bypassed silently just because an SMS send fails.
 */
export function isPhoneVerificationRequired(): boolean {
  return process.env.PHONE_VERIFICATION_REQUIRED === "true";
}

export function isAdminMfaRequired(): boolean {
  return process.env.ADMIN_MFA_REQUIRED === "true";
}
