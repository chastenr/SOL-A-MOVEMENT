/**
 * Optional pre-launch password gate for preview environments. Public
 * production must remain crawlable for search engines, so the lock is off
 * unless SITE_LOCKED=true is explicitly configured in the environment.
 */
export const SITE_LOCKED = process.env.SITE_LOCKED === "true";
export const SITE_LOCK_COOKIE = "veora_site_unlocked";
export const SITE_LOCK_PATH = "/site-locked";

const DEFAULT_PASSWORD = "veora2026";

export function getSitePassword(): string {
  return process.env.SITE_PASSWORD || DEFAULT_PASSWORD;
}
