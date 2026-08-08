-- Veora Wellness — admin booking management actions. Additive, run after
-- 0001-0003.
--
-- Unlike book_class_session()/cancel_class_booking() in 0001 (which trust a
-- caller-supplied user id and are therefore service_role-only), these three
-- re-derive the acting admin from auth.uid() and re-check is_admin()
-- internally — the same pattern as approve_purchase()/reject_purchase() —
-- so they work from the admin's own authenticated session without needing
-- the service-role key configured.
--
-- There is no "confirm" action here on purpose: a class_booking row only
-- ever exists in an already-confirmed state (book_class_session() creates
-- it atomically with the credit deduction) — there is no separate pending
-- state for an admin to promote out of.

create or replace function public.admin_cancel_class_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking public.class_bookings;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may cancel bookings';
  end if;

  select * into v_booking from public.class_bookings where id = p_booking_id for update;
  if v_booking is null then
    raise exception 'booking % not found', p_booking_id;
  end if;
  if v_booking.status <> 'booked' then
    raise exception 'booking % is not in a cancellable state (status: %)', p_booking_id, v_booking.status;
  end if;

  update public.class_bookings
     set status = 'cancelled', cancelled_at = now(), updated_at = now()
   where id = p_booking_id;

  -- Admin-initiated cancellation refunds the credit (studio-side change of
  -- plan) — distinct from a no-show, which forfeits it per the site's
  -- published cancellation policy.
  update public.customer_packages
     set remaining_credits = remaining_credits + v_booking.credits_used,
         status = case when status = 'exhausted' then 'active' else status end,
         updated_at = now()
   where id = v_booking.customer_package_id;

  update public.class_sessions
     set booked_count = greatest(booked_count - 1, 0)
   where id = v_booking.class_session_id;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), (select role from public.profiles where id = auth.uid()),
          'booking.cancelled', 'class_booking', p_booking_id, '{}'::jsonb);
end;
$$;

create or replace function public.admin_complete_class_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status public.class_booking_status;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may update bookings';
  end if;

  select status into v_status from public.class_bookings where id = p_booking_id for update;
  if v_status is null then
    raise exception 'booking % not found', p_booking_id;
  end if;
  if v_status <> 'booked' then
    raise exception 'booking % is not in a completable state (status: %)', p_booking_id, v_status;
  end if;

  update public.class_bookings set status = 'completed', updated_at = now() where id = p_booking_id;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), (select role from public.profiles where id = auth.uid()),
          'booking.completed', 'class_booking', p_booking_id, '{}'::jsonb);
end;
$$;

-- No-show forfeits the credit (no refund) — matches the cancellation-window
-- policy already published on the site (src/data/site.ts
-- cancellationWindowHours / the "forfeited credit" copy on /pricing).
create or replace function public.admin_mark_class_booking_no_show(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status public.class_booking_status;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may update bookings';
  end if;

  select status into v_status from public.class_bookings where id = p_booking_id for update;
  if v_status is null then
    raise exception 'booking % not found', p_booking_id;
  end if;
  if v_status <> 'booked' then
    raise exception 'booking % is not in a markable state (status: %)', p_booking_id, v_status;
  end if;

  update public.class_bookings set status = 'no_show', updated_at = now() where id = p_booking_id;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), (select role from public.profiles where id = auth.uid()),
          'booking.no_show', 'class_booking', p_booking_id, '{}'::jsonb);
end;
$$;

revoke execute on function public.admin_cancel_class_booking(uuid) from public;
revoke execute on function public.admin_complete_class_booking(uuid) from public;
revoke execute on function public.admin_mark_class_booking_no_show(uuid) from public;
grant execute on function public.admin_cancel_class_booking(uuid) to authenticated;
grant execute on function public.admin_complete_class_booking(uuid) to authenticated;
grant execute on function public.admin_mark_class_booking_no_show(uuid) to authenticated;
