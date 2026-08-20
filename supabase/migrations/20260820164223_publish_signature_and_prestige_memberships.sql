-- Publish the confirmed Signature and Prestige catalog details while keeping
-- checkout disabled until recurring monthly billing is available. Activating
-- these rows under the current one-time manual-payment flow would grant the
-- full contract term after a single monthly payment.
update public.packages
set
  name = 'Veora Signature',
  category = 'classic',
  package_group = 'membership',
  service_slug = null,
  price_centavos = 720000,
  original_price_centavos = 800000,
  credit_count = null,
  validity_description = '6-month contract',
  validity_days = null,
  expires_from = 'purchase',
  description = 'A six-month Classics membership with one class available each day.',
  included_services = array[
    'Maximum 1 class per day',
    'Monthly auto-payment',
    '6-month membership term'
  ],
  conditions = array[
    'September pre-opening rate ends September 30, 2026',
    'Non-transferable'
  ],
  is_recommended = true,
  recommended_label = 'September offer',
  is_founder_offer = true,
  is_active = false,
  entitlement_type = 'unlimited',
  membership_duration_months = 6,
  unlimited_booking = true,
  sale_starts_at = '2026-09-01 00:00:00+08'::timestamptz,
  sale_ends_at = '2026-10-01 00:00:00+08'::timestamptz,
  sort_order = 30,
  updated_at = now()
where slug = '6-month-unlimited';

update public.packages
set
  name = 'Veora Prestige',
  category = 'classic',
  package_group = 'membership',
  service_slug = null,
  price_centavos = 540000,
  original_price_centavos = 600000,
  credit_count = null,
  validity_description = '12-month contract',
  validity_days = null,
  expires_from = 'purchase',
  description = 'A twelve-month Classics membership with one class available each day.',
  included_services = array[
    'Maximum 1 class per day',
    'Monthly auto-payment',
    '12-month membership term'
  ],
  conditions = array[
    'September pre-opening rate ends September 30, 2026',
    'Non-transferable'
  ],
  is_recommended = false,
  recommended_label = null,
  is_founder_offer = true,
  is_active = false,
  entitlement_type = 'unlimited',
  membership_duration_months = 12,
  unlimited_booking = true,
  sale_starts_at = '2026-09-01 00:00:00+08'::timestamptz,
  sale_ends_at = '2026-10-01 00:00:00+08'::timestamptz,
  sort_order = 31,
  updated_at = now()
where slug = '12-month-unlimited';

-- Membership purchases share the existing atomic booking function. Locking
-- the membership row serializes concurrent requests, so this date check also
-- enforces the one-class-per-Manila-day rule under race conditions.
create or replace function public.book_class_session_with_membership(
  p_class_session_id uuid,
  p_customer_membership_id uuid
) returns table (booking_id uuid, membership_expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_membership public.customer_memberships;
  v_session public.class_sessions;
  v_booking_id uuid;
  v_local_date date;
  v_cutoff timestamptz;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0000';
  end if;

  select cm.* into v_membership
    from public.customer_memberships as cm
   where cm.id = p_customer_membership_id and cm.user_id = v_user_id
   for update;
  if not found then raise exception 'MEMBERSHIP_NOT_FOUND' using errcode = 'P0012'; end if;
  if v_membership.status <> 'active' or not v_membership.unlimited_booking then
    raise exception 'MEMBERSHIP_INACTIVE' using errcode = 'P0013';
  end if;
  if v_membership.starts_at > now() then
    raise exception 'MEMBERSHIP_NOT_STARTED' using errcode = 'P0014';
  end if;
  if v_membership.expires_at <= now() then
    update public.customer_memberships as cm set status = 'expired'
      where cm.id = p_customer_membership_id;
    raise exception 'MEMBERSHIP_EXPIRED' using errcode = 'P0015';
  end if;

  select cs.* into v_session from public.class_sessions as cs
   where cs.id = p_class_session_id and cs.status = 'scheduled' for update;
  if not found then raise exception 'SESSION_NOT_FOUND' using errcode = 'P0004'; end if;
  if not v_session.booking_enabled then
    raise exception 'BOOKING_DISABLED' using errcode = 'P0010';
  end if;

  v_local_date := (v_session.start_at at time zone 'Asia/Manila')::date;
  v_cutoff := ((v_local_date - 1)::timestamp + interval '22 hours') at time zone 'Asia/Manila';
  if now() >= v_cutoff then
    raise exception 'BOOKING_CUTOFF_PASSED' using errcode = 'P0009';
  end if;

  if exists (
    select 1 from public.class_bookings as cb
     where cb.class_session_id = p_class_session_id
       and cb.user_id = v_user_id and cb.status = 'booked'
  ) then raise exception 'ALREADY_BOOKED' using errcode = 'P0005'; end if;

  if exists (
    select 1
      from public.class_bookings as cb
      join public.class_sessions as booked_session
        on booked_session.id = cb.class_session_id
     where cb.customer_membership_id = p_customer_membership_id
       and cb.user_id = v_user_id
       and cb.status = 'booked'
       and (booked_session.start_at at time zone 'Asia/Manila')::date = v_local_date
  ) then
    raise exception 'MEMBERSHIP_DAILY_LIMIT' using errcode = 'P0016';
  end if;

  update public.class_sessions as cs
     set booked_count = cs.booked_count + 1
   where cs.id = p_class_session_id and cs.booked_count < cs.capacity;
  if not found then raise exception 'SESSION_FULL' using errcode = 'P0006'; end if;

  insert into public.class_bookings (
    class_session_id, user_id, customer_package_id,
    customer_membership_id, status, credits_used
  ) values (
    p_class_session_id, v_user_id, null,
    p_customer_membership_id, 'booked', 0
  ) returning id into v_booking_id;

  return query select v_booking_id, v_membership.expires_at;
end;
$$;

revoke execute on function public.book_class_session_with_membership(uuid, uuid)
  from public, anon;
grant execute on function public.book_class_session_with_membership(uuid, uuid)
  to authenticated;
