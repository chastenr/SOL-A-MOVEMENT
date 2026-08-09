-- Database-backed rate limiting for anonymous, email-triggering endpoints.
--
-- The app's existing in-memory limiter (src/lib/rate-limit.ts) resets per
-- serverless instance and doesn't share state across them — a real gap on
-- Vercel, honestly documented in that file's own comments. Most auth
-- endpoints (login/signup/password reset/OTP) don't actually need a fix
-- here: Supabase Auth enforces its own server-side, IP-based rate limits on
-- those regardless of anything this app does. The two endpoints that have
-- NO such backstop are /api/contact and /api/book — both anonymous, both
-- trigger real emails via Resend, and both are the actual "become a spam
-- relay" exposure. This adds a small, already-live-infrastructure fix
-- (no new paid service, no new credentials) scoped to just those.

create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

alter table public.rate_limits enable row level security;
-- No policies for anon/authenticated — same "nobody reads/writes this table
-- directly" pattern as audit_logs/webhook_events. Only the SECURITY DEFINER
-- function below (which bypasses RLS as its owner) touches it.

-- Atomic sliding-window counter: the INSERT ... ON CONFLICT ... DO UPDATE is
-- a single statement, so concurrent calls for the same key serialize on the
-- row's conflict resolution rather than racing a separate read-then-write.
create or replace function public.check_rate_limit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set window_start = case
          when public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
          then now()
          else public.rate_limits.window_start
        end,
        count = case
          when public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
          then 1
          else public.rate_limits.count + 1
        end
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

-- Callable by anonymous visitors (that's exactly who hits /api/contact and
-- /api/book) — safe because the function only ever touches its own counter
-- table via a fixed, parameterized statement, never arbitrary SQL.
revoke execute on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to anon, authenticated;
