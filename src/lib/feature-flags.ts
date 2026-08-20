/**
 * Both default to `false`. Customer verification is backed by Semaphore;
 * admin phone MFA remains Supabase Auth AAL2 (TOTP is also available).
 */
export function isPhoneVerificationRequired(): boolean {
  return process.env.PHONE_VERIFICATION_REQUIRED === "true";
}

export function isAdminMfaRequired(): boolean {
  return process.env.ADMIN_MFA_REQUIRED === "true";
}
