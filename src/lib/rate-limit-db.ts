import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Distributed rate limit backed by the `check_rate_limit()` Postgres
 * function (migration 0007) — unlike the in-memory limiter in
 * `rate-limit.ts`, this is consistent across serverless instances. Scoped to
 * the two anonymous, email-triggering routes that have no other backstop
 * (see the migration's own comment for why the rest of the app doesn't need
 * this). Fails OPEN (returns true / "allowed") if the database is
 * unreachable — the in-memory limiter that already guards these same routes
 * is the fallback, not a hard dependency on this succeeding.
 */
export async function isRateLimitedDb(key: string, windowSeconds: number, max: number): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_max: max,
    });
    if (error || data === null) return false;
    return !data;
  } catch {
    return false;
  }
}
