const DEFAULT_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 5;

const hits = new Map<string, number[]>();

/**
 * Best-effort in-memory rate limiter, keyed by caller-supplied key (usually
 * client IP + route, or IP + route + email for auth routes).
 * Resets when the server process restarts and doesn't share state across
 * instances — sufficient as a basic spam deterrent and UX nicety, not a
 * substitute for edge/CDN-level protection or (for login/signup/password
 * reset) Supabase Auth's own built-in server-side rate limits, which apply
 * regardless of what this function does.
 */
export function isRateLimited(
  key: string,
  opts: { windowMs?: number; max?: number } = {}
): boolean {
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
  const max = opts.max ?? DEFAULT_MAX_REQUESTS;
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((time) => now - time < windowMs);

  if (timestamps.length >= max) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return false;
}

export function getClientKey(request: Request, scope: string): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  return `${scope}:${ip}`;
}

/**
 * Same idea as `getClientKey`, for Server Actions — which receive no
 * `Request` object — using `next/headers` instead. Optionally folds in a
 * second identifier (e.g. the submitted email) so a distributed attack
 * against one victim account is still throttled even when spread across
 * many IPs.
 */
export async function getActionClientKey(scope: string, secondaryId?: string): Promise<string> {
  const { headers } = await import("next/headers");
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  return secondaryId ? `${scope}:${ip}:${secondaryId.toLowerCase()}` : `${scope}:${ip}`;
}
