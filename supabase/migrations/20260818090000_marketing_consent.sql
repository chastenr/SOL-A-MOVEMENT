-- Veora — optional SMS/email marketing opt-in, captured at signup alongside
-- (but independent of) the mandatory waiver. A customer can accept the
-- waiver without opting into marketing; the two are tracked separately.

alter table public.profiles
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists marketing_consent_at timestamptz;

-- Re-declare handle_new_user() (last defined in migration
-- 20260817160236_launch_readiness_waivers_memberships_permissions.sql) to
-- also capture the opt-in from signup metadata. Existing profiles are
-- untouched — the new columns default to false/null for everyone already
-- registered.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_number bigint;
  v_marketing_consent boolean;
begin
  v_customer_number := nextval('public.customer_number_seq');
  v_marketing_consent := coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false);

  insert into public.profiles (
    id, first_name, last_name, email, mobile_number, birthday, role, customer_number,
    marketing_consent, marketing_consent_at
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'mobile_number', ''),
    nullif(new.raw_user_meta_data ->> 'birthday', '')::date,
    'customer',
    v_customer_number,
    v_marketing_consent,
    case when v_marketing_consent then now() else null end
  );

  if coalesce((new.raw_user_meta_data ->> 'waiver_accepted')::boolean, false) then
    insert into public.waiver_acceptances (user_id, accepted, waiver_version, accepted_at)
    values (
      new.id,
      true,
      coalesce(nullif(new.raw_user_meta_data ->> 'waiver_version', ''), '2026-08-18'),
      now()
    ) on conflict (user_id, waiver_version) do nothing;
  end if;

  return new;
end;
$$;
