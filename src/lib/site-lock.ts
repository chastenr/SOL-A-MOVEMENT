/**
 * Pre-launch password gate for the whole site — no Vercel dashboard steps
 * needed. To turn it off: set SITE_LOCKED to false below and push. To
 * change the password: edit DEFAULT_PASSWORD below and push (or, once
 * comfortable with it, set a SITE_PASSWORD environment variable in Vercel —
 * that's optional and only checked if present).
 */
// Keep the pre-launch gate enabled for deployed Preview and Production builds.
// Local development remains unlocked by the NODE_ENV check in middleware.
export const SITE_LOCKED = true;
export const SITE_LOCK_COOKIE = "veora_site_unlocked";
export const SITE_LOCK_PATH = "/site-locked";

const DEFAULT_PASSWORD = "veora2026";

export function getSitePassword(): string {
  return process.env.SITE_PASSWORD || DEFAULT_PASSWORD;
}
