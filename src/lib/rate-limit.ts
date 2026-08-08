const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

const hits = new Map<string, number[]>();

/**
 * Best-effort in-memory rate limiter, keyed by client IP + route.
 * Resets when the server process restarts — sufficient as a basic
 * spam deterrent, not a substitute for edge/CDN-level protection.
 */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
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
