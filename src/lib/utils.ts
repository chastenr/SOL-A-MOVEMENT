import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Restricts a post-auth/post-verification redirect target to a same-origin,
 * plain path — used everywhere a `redirectTo`/`next` query param feeds into
 * a redirect (login, /verify-phone, /admin/mfa) to prevent open redirects
 * (absolute URLs, protocol-relative `//evil.com`, backslash tricks, etc.).
 */
export function sanitizeRedirectTo(path: string | undefined | null, fallback = "/account"): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return fallback;
  }
  try {
    const resolved = new URL(path, "http://internal.invalid");
    if (resolved.origin !== "http://internal.invalid") return fallback;
    return `${resolved.pathname}${resolved.search}`;
  } catch {
    return fallback;
  }
}

/**
 * Safe serialization for JSON-LD injected via `dangerouslySetInnerHTML`.
 * `JSON.stringify` alone doesn't escape `<`, so a value containing a literal
 * `</script>` (e.g. inside an admin-edited service description) would
 * prematurely close the tag and let whatever follows be parsed as HTML.
 * Escaping to the equivalent unicode sequence is inert inside JSON string
 * values but can never close a script tag.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates a route param looks like a UUID before it reaches a database
 * call — lets a malformed id return a clean 400 instead of falling through
 * to Postgres's own "invalid input syntax for type uuid" error (mapped to a
 * generic 500 by callers, which is technically the wrong status for a bad
 * client input even though it leaks nothing sensitive either way).
 */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
