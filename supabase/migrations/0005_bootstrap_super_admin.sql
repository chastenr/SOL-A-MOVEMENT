-- =========================================================================
-- Bootstrap: promote the very first super_admin.
--
-- set_user_role() (see 0001) is deliberately the only sanctioned way to
-- change a role, but it requires an existing super_admin caller — a
-- chicken-and-egg problem for the account that becomes the *first* one.
-- This function exists solely to solve that, and only that:
--
--   1. Sign up normally through the public /signup form (creates a regular
--      'customer' profile via the existing handle_new_user() trigger).
--   2. Run, once, in the Supabase SQL Editor (as the project owner):
--         select public.bootstrap_first_super_admin('the-signed-up-email');
--   3. Log in at /admin/login — that account is now super_admin.
--
-- It permanently refuses to run once any super_admin already exists, and is
-- NOT granted to `authenticated` — it is only reachable from the SQL Editor
-- (or another service_role/postgres context), never from the app or from a
-- signed-in user's own session. Without that restriction, any customer could
-- call it against their own account before a real super_admin exists.
-- =========================================================================

create or replace function public.bootstrap_first_super_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
begin
  if exists (select 1 from public.profiles where role = 'super_admin') then
    raise exception 'forbidden: a super_admin already exists — use set_user_role() instead';
  end if;

  select id into v_user_id from public.profiles where lower(email) = lower(target_email);
  if v_user_id is null then
    raise exception 'no account found for %; sign up with this email at /signup first', target_email;
  end if;

  update public.profiles set role = 'super_admin', updated_at = now() where id = v_user_id;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (v_user_id, 'super_admin', 'profile.bootstrap_super_admin', 'profile', v_user_id,
          jsonb_build_object('email', target_email));
end;
$$;

revoke execute on function public.bootstrap_first_super_admin(text) from public, authenticated;
