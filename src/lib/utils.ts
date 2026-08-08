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
