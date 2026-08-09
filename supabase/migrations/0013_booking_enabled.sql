-- Veora Wellness — lets an admin pause NEW bookings on a specific class
-- session without cancelling it (existing bookings, the coach, and the
-- class itself are untouched; the class still runs). This is deliberately a
-- separate concept from class_sessions.status:
--   status = 'cancelled'      -> the class will not happen, everyone refunded
--   booking_enabled = false   -> the class still happens, just not taking
--                                any *new* reservations right now
--
-- Defaults to true so every existing/new session stays bookable unless an
-- admin explicitly turns it off.

alter table public.class_sessions
  add column booking_enabled boolean not null default true;

-- Re-declare book_class_session (originally 0001, superseded by 0008) to
-- also require booking_enabled = true — the app-layer disables the "Book"
-- button for these sessions, but the RPC is the actual trust boundary (same
-- reasoning as every other check already in this function).
create or replace function public.book_class_session(
  p_class_session_id uuid,
  p_customer_package_id uuid
) returns table (booking_id uuid, remaining_credits integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking_id uuid;
  v_remaining integer;
  v_pkg public.customer_packages;
  v_session public.class_sessions;
  v_new_booked_count integer;
  v_local_date date;
  v_cutoff timestamptz;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0000';
  end if;

  select * into v_pkg from public.customer_packages
    where id = p_customer_package_id and user_id = v_user_id
    for update;
  if not found then
    raise exception 'PACKAGE_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_pkg.status <> 'active' then
    raise exception 'PACKAGE_EXHAUSTED' using errcode = 'P0003';
  end if;
  if v_pkg.expires_at is not null and v_pkg.expires_at <= now() then
    update public.customer_packages set status = 'expired' where id = p_customer_package_id;
    raise exception 'PACKAGE_EXPIRED' using errcode = 'P0002';
  end if;
  if v_pkg.remaining_credits <= 0 then
    raise exception 'PACKAGE_EXHAUSTED' using errcode = 'P0003';
  end if;

  select * into v_session from public.class_sessions
    where id = p_class_session_id and status = 'scheduled' for update;
  if not found then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0004';
  end if;

  if not v_session.booking_enabled then
    raise exception 'BOOKING_DISABLED' using errcode = 'P0010';
  end if;

  -- Booking cutoff: 10:00 PM Manila time on the calendar day before the
  -- session's Manila-local date. Rejects with a distinct code so the API
  -- route can surface the exact published rule rather than a generic error.
  v_local_date := (v_session.start_at at time zone 'Asia/Manila')::date;
  v_cutoff := ((v_local_date - 1)::timestamp + interval '22 hours') at time zone 'Asia/Manila';
  if now() >= v_cutoff then
    raise exception 'BOOKING_CUTOFF_PASSED' using errcode = 'P0009';
  end if;

  if exists (
    select 1 from public.class_bookings
    where class_session_id = p_class_session_id and user_id = v_user_id and status = 'booked'
  ) then
    raise exception 'ALREADY_BOOKED' using errcode = 'P0005';
  end if;

  update public.customer_packages
     set remaining_credits = remaining_credits - 1,
         status = case when remaining_credits - 1 = 0 then 'exhausted' else status end,
         activated_at = coalesce(activated_at, now()),
         expires_at = case
           when expires_at is null and activated_at is null then
             (select now() + (validity_days || ' days')::interval
              from public.packages where id = v_pkg.package_id and validity_days is not null)
           else expires_at
         end,
         updated_at = now()
   where id = p_customer_package_id and remaining_credits > 0 and status = 'active'
  returning remaining_credits into v_remaining;

  if v_remaining is null then
    raise exception 'PACKAGE_EXHAUSTED' using errcode = 'P0003';
  end if;

  update public.class_sessions
     set booked_count = booked_count + 1
   where id = p_class_session_id and booked_count < capacity
  returning booked_count into v_new_booked_count;
  if not found then
    raise exception 'SESSION_FULL' using errcode = 'P0006';
  end if;

  insert into public.class_bookings (class_session_id, user_id, customer_package_id, status, credits_used)
  values (p_class_session_id, v_user_id, p_customer_package_id, 'booked', 1)
  returning id into v_booking_id;

  insert into public.package_credit_transactions
    (customer_package_id, booking_id, amount, type, balance_after, created_by)
  values (p_customer_package_id, v_booking_id, -1, 'booking_reserved', v_remaining, v_user_id);

  return query select v_booking_id, v_remaining;
end;
$$;
