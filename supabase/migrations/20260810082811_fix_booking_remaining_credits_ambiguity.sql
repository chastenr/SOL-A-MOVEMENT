-- Fix production bookings failing with PostgreSQL 42702. The function's
-- RETURNS TABLE output includes a PL/pgSQL variable named
-- `remaining_credits`, which made unqualified references to the column of
-- the same name ambiguous at runtime. Explicit table aliases keep the
-- existing API contract while removing that ambiguity.

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

  select cp.*
    into v_pkg
    from public.customer_packages as cp
   where cp.id = p_customer_package_id
     and cp.user_id = v_user_id
   for update;

  if not found then
    raise exception 'PACKAGE_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_pkg.status <> 'active' then
    raise exception 'PACKAGE_EXHAUSTED' using errcode = 'P0003';
  end if;

  if v_pkg.expires_at is not null and v_pkg.expires_at <= now() then
    update public.customer_packages as cp
       set status = 'expired'
     where cp.id = p_customer_package_id;
    raise exception 'PACKAGE_EXPIRED' using errcode = 'P0002';
  end if;

  if v_pkg.remaining_credits <= 0 then
    raise exception 'PACKAGE_EXHAUSTED' using errcode = 'P0003';
  end if;

  select cs.*
    into v_session
    from public.class_sessions as cs
   where cs.id = p_class_session_id
     and cs.status = 'scheduled'
   for update;

  if not found then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0004';
  end if;

  if not v_session.booking_enabled then
    raise exception 'BOOKING_DISABLED' using errcode = 'P0010';
  end if;

  v_local_date := (v_session.start_at at time zone 'Asia/Manila')::date;
  v_cutoff := ((v_local_date - 1)::timestamp + interval '22 hours') at time zone 'Asia/Manila';

  if now() >= v_cutoff then
    raise exception 'BOOKING_CUTOFF_PASSED' using errcode = 'P0009';
  end if;

  if exists (
    select 1
      from public.class_bookings as cb
     where cb.class_session_id = p_class_session_id
       and cb.user_id = v_user_id
       and cb.status = 'booked'
  ) then
    raise exception 'ALREADY_BOOKED' using errcode = 'P0005';
  end if;

  update public.customer_packages as cp
     set remaining_credits = cp.remaining_credits - 1,
         status = case
           when cp.remaining_credits - 1 = 0 then 'exhausted'
           else cp.status
         end,
         activated_at = coalesce(cp.activated_at, now()),
         expires_at = case
           when cp.expires_at is null and cp.activated_at is null then
             (
               select now() + (p.validity_days || ' days')::interval
                 from public.packages as p
                where p.id = v_pkg.package_id
                  and p.validity_days is not null
             )
           else cp.expires_at
         end,
         updated_at = now()
   where cp.id = p_customer_package_id
     and cp.remaining_credits > 0
     and cp.status = 'active'
  returning cp.remaining_credits into v_remaining;

  if v_remaining is null then
    raise exception 'PACKAGE_EXHAUSTED' using errcode = 'P0003';
  end if;

  update public.class_sessions as cs
     set booked_count = cs.booked_count + 1
   where cs.id = p_class_session_id
     and cs.booked_count < cs.capacity
  returning cs.booked_count into v_new_booked_count;

  if not found then
    raise exception 'SESSION_FULL' using errcode = 'P0006';
  end if;

  insert into public.class_bookings (
    class_session_id,
    user_id,
    customer_package_id,
    status,
    credits_used
  ) values (
    p_class_session_id,
    v_user_id,
    p_customer_package_id,
    'booked',
    1
  )
  returning id into v_booking_id;

  insert into public.package_credit_transactions (
    customer_package_id,
    booking_id,
    amount,
    type,
    balance_after,
    created_by
  ) values (
    p_customer_package_id,
    v_booking_id,
    -1,
    'booking_reserved',
    v_remaining,
    v_user_id
  );

  return query select v_booking_id, v_remaining;
end;
$$;

revoke execute on function public.book_class_session(uuid, uuid) from public;
grant execute on function public.book_class_session(uuid, uuid) to authenticated;
