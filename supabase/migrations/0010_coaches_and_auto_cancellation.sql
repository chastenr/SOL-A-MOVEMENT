-- Veora Wellness — coach photo storage, and the automated 10 PM
-- minimum-attendance cancellation/confirmation job. Additive, run after
-- 0001-0009.
--
-- The instructors table itself already has name/bio/photo_url/active
-- (migration 0001) — the gap was that nothing in the app could ever create
-- an instructor row or upload a photo. This migration adds the storage
-- side; supabase/migrations doesn't touch application code.
--
-- The automated cancellation RPC is deliberately SEPARATE from
-- admin_cancel_class_session() (migration 0008): that one re-derives the
-- acting admin from auth.uid() and requires is_admin(), which only makes
-- sense for a human clicking a button in the dashboard. A scheduled cron
-- job has no authenticated user session at all — it calls this function
-- using the service-role key instead, so this one is granted ONLY to
-- service_role and never to authenticated/anon.

-- =========================================================================
-- 1. Coach photo storage
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('coach-photos', 'coach-photos', true)
on conflict (id) do nothing;

create policy "coach_photos_select_public" on storage.objects for select
  to anon, authenticated using (bucket_id = 'coach-photos');
create policy "coach_photos_write_admin" on storage.objects for all
  to authenticated
  using (bucket_id = 'coach-photos' and public.is_admin())
  with check (bucket_id = 'coach-photos' and public.is_admin());

-- =========================================================================
-- 2. class_sessions: attendance_checked_at — set once the 10 PM job has
--    evaluated a session (cancelled it or confirmed it), so a re-run (retry
--    after a partial failure, or a manual re-trigger) never double-cancels
--    or double-emails.
-- =========================================================================

alter table public.class_sessions
  add column attendance_checked_at timestamptz;

-- =========================================================================
-- 3. class_bookings.cancellation_source: allow 'system' alongside the
--    existing 'customer'/'studio' (migration 0008) — an automatic
--    below-minimum cancellation is neither the customer's doing nor a human
--    admin's click, and reporting should be able to tell the difference.
-- =========================================================================

alter table public.class_bookings drop constraint if exists class_bookings_cancellation_source_check;
alter table public.class_bookings
  add constraint class_bookings_cancellation_source_check
  check (cancellation_source is null or cancellation_source in ('customer', 'studio', 'system'));

-- =========================================================================
-- 4. system_cancel_class_session(): same refund-everyone logic as
--    admin_cancel_class_session(), but with no auth.uid()/is_admin() check
--    at all — safety comes entirely from who can EXECUTE this function
--    (service_role only, see grants below), not from an in-function check.
-- =========================================================================

create or replace function public.system_cancel_class_session(p_class_session_id uuid)
returns table (booking_id uuid, user_id uuid, customer_package_id uuid, remaining_credits integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session public.class_sessions;
  v_row record;
  v_new_remaining integer;
  v_count integer := 0;
begin
  select * into v_session from public.class_sessions where id = p_class_session_id for update;
  if v_session.id is null then
    raise exception 'class session % not found', p_class_session_id;
  end if;
  if v_session.status <> 'scheduled' then
    return; -- already cancelled/completed by something else — nothing to do
  end if;

  for v_row in
    select cb.id, cb.user_id, cb.customer_package_id, cb.credits_used
    from public.class_bookings cb
    where cb.class_session_id = p_class_session_id and cb.status = 'booked'
    for update of cb
  loop
    update public.class_bookings
       set status = 'cancelled', cancelled_at = now(), cancellation_source = 'system', updated_at = now()
     where id = v_row.id;

    update public.customer_packages
       set remaining_credits = remaining_credits + v_row.credits_used,
           status = case when status = 'exhausted' then 'active' else status end,
           updated_at = now()
     where id = v_row.customer_package_id
    returning remaining_credits into v_new_remaining;

    insert into public.package_credit_transactions
      (customer_package_id, booking_id, amount, type, reason, balance_after, created_by)
    values (v_row.customer_package_id, v_row.id, v_row.credits_used, 'class_cancelled_by_studio',
            'Automatically cancelled — did not reach minimum attendance', v_new_remaining, null);

    insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
    values (null, null, 'booking.auto_cancelled', 'class_booking', v_row.id,
            jsonb_build_object('reason', 'below_minimum_attendance', 'class_session_id', p_class_session_id));

    v_count := v_count + 1;
    booking_id := v_row.id;
    user_id := v_row.user_id;
    customer_package_id := v_row.customer_package_id;
    remaining_credits := v_new_remaining;
    return next;
  end loop;

  update public.class_sessions
     set status = 'cancelled', attendance_checked_at = now(), updated_at = now()
   where id = p_class_session_id;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (null, null, 'class_session.auto_cancelled', 'class_session', p_class_session_id,
          jsonb_build_object('affected_bookings', v_count, 'reason', 'below_minimum_attendance'));
end;
$$;

revoke execute on function public.system_cancel_class_session(uuid) from public, authenticated, anon;
grant execute on function public.system_cancel_class_session(uuid) to service_role;

-- Marks a session as having met its minimum (no cancellation) so the cron
-- doesn't re-evaluate it on a retry, and so "class confirmed" emails only
-- ever go out once.
create or replace function public.system_confirm_class_session(p_class_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.class_sessions
     set attendance_checked_at = now(), updated_at = now()
   where id = p_class_session_id and status = 'scheduled' and attendance_checked_at is null;
end;
$$;

revoke execute on function public.system_confirm_class_session(uuid) from public, authenticated, anon;
grant execute on function public.system_confirm_class_session(uuid) to service_role;
