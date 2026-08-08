-- Veora Wellness — phone verification (customer onboarding gate) and the
-- shared building block for stronger admin MFA. Additive migration, run
-- after 0001 and 0002.
--
-- Real phone OTP delivery/verification is handled entirely by Supabase
-- Auth's native Phone MFA (auth.mfa_factors / auth.mfa_challenges,
-- supabase.auth.mfa.enroll/challenge/verify — see src/lib/auth/phone-mfa.ts).
-- This migration only adds the trusted, server-set flag our app checks, and
-- the one function allowed to set it.

alter table public.profiles
  add column phone_verified_at timestamptz;

-- No RLS/grant change needed: public.profiles already only grants
-- authenticated UPDATE on (first_name, last_name, mobile_number, birthday)
-- (see 0001) — phone_verified_at is excluded by omission, so a customer can
-- never set it directly via a normal table update.

-- The only sanctioned way to set phone_verified_at. Re-derives identity from
-- auth.uid() (never a client-supplied user id, so one user's verification
-- can never mark another user's row) and independently re-checks Supabase's
-- own auth.mfa_factors table for a verified phone factor before trusting
-- the caller — so this can't be used to mark a phone verified without an
-- actual completed Supabase MFA verification having happened first.
create or replace function public.mark_phone_verified()
returns timestamptz
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_has_verified_phone boolean;
  v_verified_at timestamptz;
begin
  select exists (
    select 1 from auth.mfa_factors
    where user_id = auth.uid() and factor_type = 'phone' and status = 'verified'
  ) into v_has_verified_phone;

  if not v_has_verified_phone then
    raise exception 'no verified phone factor found for the current user';
  end if;

  update public.profiles
    set phone_verified_at = coalesce(phone_verified_at, now()), updated_at = now()
    where id = auth.uid()
  returning phone_verified_at into v_verified_at;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    (select role from public.profiles where id = auth.uid()),
    'profile.phone_verified', 'profile', auth.uid(), '{}'::jsonb
  );

  return v_verified_at;
end;
$$;

revoke execute on function public.mark_phone_verified() from public;
grant execute on function public.mark_phone_verified() to authenticated;

-- Clears verification when the customer changes their mobile number — a
-- verified phone factor describes one specific number, so a stale
-- phone_verified_at pointing at a number that's no longer current would be
-- misleading. Only ever clears the CALLER's own row (auth.uid()-derived).
create or replace function public.clear_phone_verification()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.profiles set phone_verified_at = null, updated_at = now() where id = auth.uid();
end;
$$;

revoke execute on function public.clear_phone_verification() from public;
grant execute on function public.clear_phone_verification() to authenticated;
