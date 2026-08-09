-- Veora Wellness — credit ledger, booking cutoff, minimum-attendance class
-- cancellation. Additive, run after 0001-0007.
--
-- Driven by the client's latest booking-system requirements meeting:
--   - Every credit balance change must be ledgered (not just the mutable
--     customer_packages.remaining_credits counter) for audit purposes.
--   - Bookings close at 10:00 PM Philippine time the night before the class
--     (server-enforced, not just frontend copy).
--   - Studio-initiated class cancellation must refund every affected
--     customer's credit atomically, in one transaction, not one RPC call
--     per booking (the app-code loop in classes/actions.ts today calls
--     admin_cancel_class_booking() once per booking — each call is its own
--     transaction, so a crash partway through could leave some customers
--     refunded and others not). admin_cancel_class_session() below replaces
--     that loop with a single atomic function.
--   - Distinguish customer-initiated vs. studio-initiated cancellation on
--     the booking row itself (today only audit_logs.actor_id captures
--     "who," which requires a join to answer "was this the customer or
--     us?" for admin dashboard/reporting purposes).

-- =========================================================================
-- 1. Credit ledger
-- =========================================================================

create type public.credit_transaction_type as enum (
  'package_purchased',
  'booking_reserved',
  'booking_cancelled_by_customer',
  'class_cancelled_by_studio',
  'admin_adjustment'
);

create table public.package_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_package_id uuid not null references public.customer_packages (id) on delete restrict,
  booking_id uuid references public.class_bookings (id) on delete set null,
  purchase_id uuid references public.purchases (id) on delete set null,
  amount integer not null check (amount <> 0),
  type public.credit_transaction_type not null,
  reason text,
  balance_after integer not null check (balance_after >= 0),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index package_credit_transactions_package_idx
  on public.package_credit_transactions (customer_package_id, created_at desc);
create index package_credit_transactions_booking_idx
  on public.package_credit_transactions (booking_id);

alter table public.package_credit_transactions enable row level security;

create policy "credit_transactions_select_own_or_admin" on public.package_credit_transactions
  for select to authenticated using (
    exists (
      select 1 from public.customer_packages cp
      where cp.id = customer_package_id and (cp.user_id = auth.uid() or public.is_admin())
    )
  );
-- No insert/update/delete policy for anyone — rows are written only from
-- inside the SECURITY DEFINER functions below, same pattern as audit_logs.

-- =========================================================================
-- 2. class_sessions: minimum_participants (nullable — opt-in per session;
--    NULL means "no minimum enforced," which keeps every session created
--    before this migration, and any session where the studio doesn't care
--    about a floor, behaving exactly as before)
-- =========================================================================

alter table public.class_sessions
  add column minimum_participants integer
    check (minimum_participants is null or minimum_participants > 0);

-- =========================================================================
-- 3. class_bookings: cancellation_source (who initiated the cancellation —
--    distinct from WHO clicked which admin button, which audit_logs already
--    has; this is the queryable "customer vs. studio" flag the admin
--    dashboard and cancellation-email logic need without a join)
-- =========================================================================

alter table public.class_bookings
  add column cancellation_source text
    check (cancellation_source is null or cancellation_source in ('customer', 'studio'));

-- =========================================================================
-- 4. book_class_session(): add the 10 PM Asia/Manila night-before cutoff,
--    and ledger the credit deduction. Same signature as 0001 — no
--    application code needs to change.
--
--    Philippine time has had no DST since 1978, so "wall-clock 10 PM
--    Manila" is always exactly UTC+8 with no seasonal adjustment — safe to
--    compute with a fixed AT TIME ZONE conversion rather than needing any
--    DST-aware library.
-- =========================================================================

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

-- =========================================================================
-- 5. cancel_class_booking() (customer-initiated): tag cancellation_source
--    and ledger the restoration.
-- =========================================================================

create or replace function public.cancel_class_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.class_bookings;
  v_new_remaining integer;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0000';
  end if;

  select cb.* into v_booking from public.class_bookings cb
    join public.class_sessions cs on cs.id = cb.class_session_id
    where cb.id = p_booking_id and cb.user_id = v_user_id and cb.status = 'booked'
    for update of cb;
  if not found then
    raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0007';
  end if;

  if exists (
    select 1 from public.class_sessions where id = v_booking.class_session_id and start_at <= now()
  ) then
    raise exception 'SESSION_ALREADY_STARTED' using errcode = 'P0008';
  end if;

  update public.class_bookings
     set status = 'cancelled', cancelled_at = now(), cancellation_source = 'customer', updated_at = now()
   where id = p_booking_id;

  update public.customer_packages
     set remaining_credits = remaining_credits + v_booking.credits_used,
         status = case when status = 'exhausted' then 'active' else status end,
         updated_at = now()
   where id = v_booking.customer_package_id
  returning remaining_credits into v_new_remaining;

  update public.class_sessions
     set booked_count = greatest(booked_count - 1, 0)
   where id = v_booking.class_session_id;

  insert into public.package_credit_transactions
    (customer_package_id, booking_id, amount, type, balance_after, created_by)
  values (v_booking.customer_package_id, p_booking_id, v_booking.credits_used,
          'booking_cancelled_by_customer', v_new_remaining, v_user_id);
end;
$$;

-- =========================================================================
-- 6. admin_cancel_class_booking() (single booking, studio-initiated): tag
--    cancellation_source and ledger the restoration.
-- =========================================================================

create or replace function public.admin_cancel_class_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking public.class_bookings;
  v_new_remaining integer;
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
     set status = 'cancelled', cancelled_at = now(), cancellation_source = 'studio', updated_at = now()
   where id = p_booking_id;

  update public.customer_packages
     set remaining_credits = remaining_credits + v_booking.credits_used,
         status = case when status = 'exhausted' then 'active' else status end,
         updated_at = now()
   where id = v_booking.customer_package_id
  returning remaining_credits into v_new_remaining;

  update public.class_sessions
     set booked_count = greatest(booked_count - 1, 0)
   where id = v_booking.class_session_id;

  insert into public.package_credit_transactions
    (customer_package_id, booking_id, amount, type, balance_after, created_by)
  values (v_booking.customer_package_id, p_booking_id, v_booking.credits_used,
          'class_cancelled_by_studio', v_new_remaining, auth.uid());

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), (select role from public.profiles where id = auth.uid()),
          'booking.cancelled', 'class_booking', p_booking_id, '{}'::jsonb);
end;
$$;

-- =========================================================================
-- 7. admin_cancel_class_session(): bulk, single-transaction studio
--    cancellation of an entire class — replaces the classes/actions.ts loop
--    that called admin_cancel_class_booking() once per booking (one
--    transaction per call; a mid-loop crash could leave some customers
--    refunded and others not). Returns the affected customers so the
--    calling server action can email each one without a second query.
-- =========================================================================

create or replace function public.admin_cancel_class_session(p_class_session_id uuid)
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
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may cancel a class session';
  end if;

  select * into v_session from public.class_sessions where id = p_class_session_id for update;
  if v_session.id is null then
    raise exception 'class session % not found', p_class_session_id;
  end if;
  if v_session.status = 'completed' then
    raise exception 'class session % has already completed', p_class_session_id;
  end if;
  if v_session.status = 'cancelled' then
    -- Already cancelled by an earlier call — nothing new to refund or
    -- notify. Returning zero rows tells the caller "no emails to send,"
    -- exactly like the already_processed branch on approve_purchase().
    return;
  end if;

  for v_row in
    select cb.id, cb.user_id, cb.customer_package_id, cb.credits_used
    from public.class_bookings cb
    where cb.class_session_id = p_class_session_id and cb.status = 'booked'
    for update of cb
  loop
    update public.class_bookings
       set status = 'cancelled', cancelled_at = now(), cancellation_source = 'studio', updated_at = now()
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
            'Class cancelled by studio', v_new_remaining, auth.uid());

    insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
    values (auth.uid(), (select role from public.profiles where id = auth.uid()),
            'booking.cancelled', 'class_booking', v_row.id,
            jsonb_build_object('reason', 'class_session_cancelled', 'class_session_id', p_class_session_id));

    v_count := v_count + 1;
    booking_id := v_row.id;
    user_id := v_row.user_id;
    customer_package_id := v_row.customer_package_id;
    remaining_credits := v_new_remaining;
    return next;
  end loop;

  update public.class_sessions set status = 'cancelled', updated_at = now() where id = p_class_session_id;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), (select role from public.profiles where id = auth.uid()),
          'class_session.cancelled', 'class_session', p_class_session_id,
          jsonb_build_object('affected_bookings', v_count));
end;
$$;

revoke execute on function public.admin_cancel_class_session(uuid) from public;
grant execute on function public.admin_cancel_class_session(uuid) to authenticated;

-- =========================================================================
-- 8. approve_purchase(): ledger the initial credit grant. Same signature —
--    no application code needs to change.
-- =========================================================================

create or replace function public.approve_purchase(p_purchase_id uuid)
returns table (purchase_id uuid, customer_package_id uuid, already_processed boolean)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_purchase public.purchases;
  v_package public.packages;
  v_credit_count integer;
  v_customer_package_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may approve purchases';
  end if;

  update public.purchases
     set purchase_status = 'approved', approved_by = auth.uid(), approved_at = now(), updated_at = now()
   where id = p_purchase_id and purchase_status = 'proof_submitted'
  returning * into v_purchase;

  if not found then
    select * into v_purchase from public.purchases where id = p_purchase_id;
    if v_purchase.id is null then
      raise exception 'purchase % not found', p_purchase_id;
    end if;
    if v_purchase.purchase_status = 'approved' then
      select id into v_customer_package_id from public.customer_packages where purchase_id = p_purchase_id;
      return query select v_purchase.id, v_customer_package_id, true;
      return;
    end if;
    raise exception 'purchase % is not awaiting approval (status: %)', p_purchase_id, v_purchase.purchase_status;
  end if;

  select * into v_package from public.packages where id = v_purchase.package_id;
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

-- =========================================================================
-- Manual verification (run in the Supabase SQL editor once applied):
-- =========================================================================
--
-- -- Ledger balance should always match customer_packages.remaining_credits:
-- select cp.id, cp.remaining_credits,
--        cp.credit_count + coalesce(sum(t.amount), 0) as ledger_balance
-- from public.customer_packages cp
-- left join public.package_credit_transactions t on t.customer_package_id = cp.id and t.type <> 'package_purchased'
-- group by cp.id, cp.remaining_credits, cp.credit_count
-- having cp.remaining_credits <> cp.credit_count + coalesce(sum(t.amount), 0);
-- -- ^ should return zero rows.
--
-- -- Cutoff check — a session starting tomorrow 7 AM Manila time should be
-- -- bookable before 10 PM Manila tonight and rejected after:
-- select ((now() at time zone 'Asia/Manila')::date + 1 + time '07:00') at time zone 'Asia/Manila' as tomorrow_7am_manila_utc;
