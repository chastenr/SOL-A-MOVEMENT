-- Resolve PL/pgSQL output-column/row-column name collisions in existing
-- operational functions. `use_column` preserves the intended behavior of
-- expressions such as remaining_credits + p_delta and purchase_id = ... .

create or replace function public.admin_adjust_customer_package_credits(
  p_customer_package_id uuid,
  p_delta integer,
  p_reason text
) returns table (remaining_credits integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_credit_count integer;
  v_new_remaining integer;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may adjust package credits';
  end if;
  if p_delta = 0 then
    raise exception 'adjustment amount must not be zero';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'a reason is required for a credit adjustment';
  end if;

  select cp.credit_count
    into v_credit_count
    from public.customer_packages cp
   where cp.id = p_customer_package_id
   for update;
  if v_credit_count is null then
    raise exception 'customer package % not found', p_customer_package_id;
  end if;

  update public.customer_packages as cp
     set remaining_credits = cp.remaining_credits + p_delta,
         status = case
           when cp.remaining_credits + p_delta <= 0 then 'exhausted'
           when cp.status = 'exhausted' and cp.remaining_credits + p_delta > 0 then 'active'
           else cp.status
         end,
         updated_at = now()
   where cp.id = p_customer_package_id
     and cp.remaining_credits + p_delta >= 0
     and cp.remaining_credits + p_delta <= cp.credit_count
  returning cp.remaining_credits into v_new_remaining;

  if v_new_remaining is null then
    raise exception 'adjustment would put remaining credits outside the allowed range (0 to %)', v_credit_count;
  end if;

  insert into public.package_credit_transactions
    (customer_package_id, amount, type, reason, balance_after, created_by)
  values (p_customer_package_id, p_delta, 'admin_adjustment', p_reason, v_new_remaining, auth.uid());

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), (select p.role from public.profiles p where p.id = auth.uid()),
          'package.credits_adjusted', 'customer_package', p_customer_package_id,
          jsonb_build_object('delta', p_delta, 'reason', p_reason, 'new_balance', v_new_remaining));

  return query select v_new_remaining;
end;
$$;

create or replace function public.admin_cancel_class_session(p_class_session_id uuid)
returns table (booking_id uuid, user_id uuid, customer_package_id uuid, remaining_credits integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_session public.class_sessions;
  v_row record;
  v_new_remaining integer;
  v_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may cancel a class session';
  end if;

  select * into v_session from public.class_sessions cs where cs.id = p_class_session_id for update;
  if v_session.id is null then
    raise exception 'class session % not found', p_class_session_id;
  end if;
  if v_session.status = 'completed' then
    raise exception 'class session % has already completed', p_class_session_id;
  end if;
  if v_session.status = 'cancelled' then
    return;
  end if;

  for v_row in
    select cb.id, cb.user_id, cb.customer_package_id, cb.credits_used
    from public.class_bookings cb
    where cb.class_session_id = p_class_session_id and cb.status = 'booked'
    for update of cb
  loop
    update public.class_bookings cb
       set status = 'cancelled', cancelled_at = now(), cancellation_source = 'studio', updated_at = now()
     where cb.id = v_row.id;

    update public.customer_packages cp
       set remaining_credits = cp.remaining_credits + v_row.credits_used,
           status = case when cp.status = 'exhausted' then 'active' else cp.status end,
           updated_at = now()
     where cp.id = v_row.customer_package_id
    returning cp.remaining_credits into v_new_remaining;

    insert into public.package_credit_transactions
      (customer_package_id, booking_id, amount, type, reason, balance_after, created_by)
    values (v_row.customer_package_id, v_row.id, v_row.credits_used, 'class_cancelled_by_studio',
            'Class cancelled by studio', v_new_remaining, auth.uid());

    insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
    values (auth.uid(), (select p.role from public.profiles p where p.id = auth.uid()),
            'booking.cancelled', 'class_booking', v_row.id,
            jsonb_build_object('reason', 'class_session_cancelled', 'class_session_id', p_class_session_id));

    v_count := v_count + 1;
    booking_id := v_row.id;
    user_id := v_row.user_id;
    customer_package_id := v_row.customer_package_id;
    remaining_credits := v_new_remaining;
    return next;
  end loop;

  update public.class_sessions cs set status = 'cancelled', updated_at = now() where cs.id = p_class_session_id;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), (select p.role from public.profiles p where p.id = auth.uid()),
          'class_session.cancelled', 'class_session', p_class_session_id,
          jsonb_build_object('affected_bookings', v_count));
end;
$$;

create or replace function public.system_cancel_class_session(p_class_session_id uuid)
returns table (booking_id uuid, user_id uuid, customer_package_id uuid, remaining_credits integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_session public.class_sessions;
  v_row record;
  v_new_remaining integer;
  v_count integer := 0;
begin
  select * into v_session from public.class_sessions cs where cs.id = p_class_session_id for update;
  if v_session.id is null then
    raise exception 'class session % not found', p_class_session_id;
  end if;
  if v_session.status <> 'scheduled' then
    return;
  end if;

  for v_row in
    select cb.id, cb.user_id, cb.customer_package_id, cb.credits_used
    from public.class_bookings cb
    where cb.class_session_id = p_class_session_id and cb.status = 'booked'
    for update of cb
  loop
    update public.class_bookings cb
       set status = 'cancelled', cancelled_at = now(), cancellation_source = 'system', updated_at = now()
     where cb.id = v_row.id;

    update public.customer_packages cp
       set remaining_credits = cp.remaining_credits + v_row.credits_used,
           status = case when cp.status = 'exhausted' then 'active' else cp.status end,
           updated_at = now()
     where cp.id = v_row.customer_package_id
    returning cp.remaining_credits into v_new_remaining;

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

  update public.class_sessions cs
     set status = 'cancelled', attendance_checked_at = now(), updated_at = now()
   where cs.id = p_class_session_id;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (null, null, 'class_session.auto_cancelled', 'class_session', p_class_session_id,
          jsonb_build_object('affected_bookings', v_count, 'reason', 'below_minimum_attendance'));
end;
$$;

create or replace function public.approve_purchase(p_purchase_id uuid)
returns table (purchase_id uuid, customer_package_id uuid, already_processed boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_purchase public.purchases;
  v_package public.packages;
  v_credit_count integer;
  v_customer_package_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may approve purchases';
  end if;

  update public.purchases p
     set purchase_status = 'approved', approved_by = auth.uid(), approved_at = now(), updated_at = now()
   where p.id = p_purchase_id and p.purchase_status in ('pending_payment', 'proof_submitted')
  returning p.* into v_purchase;

  if not found then
    select * into v_purchase from public.purchases p where p.id = p_purchase_id;
    if v_purchase.id is null then
      raise exception 'purchase % not found', p_purchase_id;
    end if;
    if v_purchase.purchase_status = 'approved' then
      select cp.id into v_customer_package_id
      from public.customer_packages cp
      where cp.purchase_id = p_purchase_id;
      return query select v_purchase.id, v_customer_package_id, true;
      return;
    end if;
    raise exception 'purchase % is not awaiting approval (status: %)', p_purchase_id, v_purchase.purchase_status;
  end if;

  select * into v_package from public.packages p where p.id = v_purchase.package_id;
  v_credit_count := coalesce(v_package.credit_count, 1);

  insert into public.customer_packages
    (user_id, purchase_id, package_id, package_name_snapshot, credit_count, remaining_credits,
     status, activated_at, expires_at)
  values (
    v_purchase.user_id, v_purchase.id, v_purchase.package_id, v_purchase.package_name_snapshot,
    v_credit_count, v_credit_count, 'active',
    case when v_package.expires_from = 'purchase' then now() else null end,
    case when v_package.expires_from = 'purchase' and v_package.validity_days is not null
         then now() + (v_package.validity_days || ' days')::interval
         else null end
  )
  returning id into v_customer_package_id;

  insert into public.package_credit_transactions
    (customer_package_id, purchase_id, amount, type, reason, balance_after, created_by)
  values (v_customer_package_id, v_purchase.id, v_credit_count, 'package_purchased',
          v_purchase.package_name_snapshot, v_credit_count, auth.uid());

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'admin', 'purchase.approved', 'purchase', v_purchase.id,
          jsonb_build_object('customer_package_id', v_customer_package_id,
                              'reference_number', v_purchase.reference_number));

  return query select v_purchase.id, v_customer_package_id, false;
end;
$$;

create or replace function public.generate_recurring_class_sessions(p_days_ahead integer default 14)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_created integer := 0;
  v_inserted integer := 0;
  v_slot record;
  v_local_date date;
  v_start_at timestamptz;
  v_end_at timestamptz;
begin
  if not public.is_admin() and coalesce((select auth.jwt() ->> 'role'), '') <> 'service_role' then
    raise exception 'forbidden: only admin/super_admin or the system may generate sessions';
  end if;

  for v_slot in
    select location_id, weekday, hour, class_type_id, instructor_id, capacity, minimum_participants
    from public.class_time_slots
    where is_active = true and class_type_id is not null
  loop
    for v_day_offset in 0..greatest(p_days_ahead - 1, 0) loop
      v_local_date := (now() at time zone 'Asia/Manila')::date + v_day_offset;

      if extract(dow from v_local_date)::smallint <> v_slot.weekday then
        continue;
      end if;

      v_start_at := (v_local_date::timestamp + make_interval(hours => v_slot.hour)) at time zone 'Asia/Manila';
      v_end_at := v_start_at + interval '50 minutes';

      insert into public.class_sessions
        (class_type_id, location_id, instructor_id, start_at, end_at, capacity, minimum_participants, status, booking_enabled)
      values
        (v_slot.class_type_id, v_slot.location_id, v_slot.instructor_id, v_start_at, v_end_at,
         v_slot.capacity, v_slot.minimum_participants, 'scheduled', true)
      on conflict (location_id, start_at) do nothing;

      get diagnostics v_inserted = row_count;
      v_created := v_created + v_inserted;
    end loop;
  end loop;

  return v_created;
end;
$$;

revoke execute on function public.generate_recurring_class_sessions(integer) from public, anon;
grant execute on function public.generate_recurring_class_sessions(integer) to authenticated, service_role;
