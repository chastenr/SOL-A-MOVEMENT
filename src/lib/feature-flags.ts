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

/**
 * Set MAINTENANCE_MODE=true (Vercel → Project → Settings → Environment
 * Variables → Production) to show a "coming soon" page to every visitor
 * except /admin — see src/proxy.ts for the actual gate and the bypass-link
 * mechanism used to preview the real site while this is on.
 */
export function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === "true";
}
