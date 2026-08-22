-- Aug 20 pre-opening meeting implementation:
-- 20-person defaults, configurable opening promotion, recurring
-- membership payment state/history, and strict proof-before-approval.

update public.locations
set phone = '0917-324-4355', updated_at = now()
where slug = 'bacoor';

-- ---------------------------------------------------------------------------
-- Class capacity defaults. Preserve explicit per-session overrides, but move
-- every untouched 10-person template/session to the new studio default.
-- ---------------------------------------------------------------------------
alter table public.class_sessions alter column capacity set default 20;
alter table public.class_time_slots alter column capacity set default 20;

update public.class_sessions
set capacity = 20, updated_at = now()
where status = 'scheduled' and capacity = 10;

update public.class_sessions
set capacity = 20, updated_at = now()
where status = 'scheduled' and capacity > 20 and booked_count <= 20;

update public.class_sessions
set booking_enabled = false, updated_at = now()
where status = 'scheduled' and booked_count > 20;

update public.class_time_slots
set capacity = 20, updated_at = now()
where capacity = 10;

create function public.enforce_group_class_booking_limit()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.booked_count > 20 then
    raise exception 'SESSION_FULL' using errcode = 'P0006';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_group_class_booking_limit()
  from public, anon, authenticated;

create trigger class_sessions_max_twenty_bookings
  before insert or update of booked_count on public.class_sessions
  for each row execute function public.enforce_group_class_booking_limit();

create function public.enforce_group_class_capacity_limit()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.capacity > 20 then
    raise exception 'Group class capacity cannot exceed 20';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_group_class_capacity_limit()
  from public, anon, authenticated;

create trigger class_sessions_max_twenty_capacity
  before insert or update of capacity on public.class_sessions
  for each row execute function public.enforce_group_class_capacity_limit();

create trigger class_time_slots_max_twenty_capacity
  before insert or update of capacity on public.class_time_slots
  for each row execute function public.enforce_group_class_capacity_limit();

-- ---------------------------------------------------------------------------
-- Promotion configuration. A package is promotional only when it has a
-- regular price, a positive discount no greater than 50%, and an active time window.
-- ---------------------------------------------------------------------------
alter table public.packages
  add column if not exists promotion_discount_bps integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'packages_promotion_configuration_check'
      and conrelid = 'public.packages'::regclass
  ) then
    alter table public.packages
      add constraint packages_promotion_configuration_check check (
        promotion_discount_bps is null
        or (
          promotion_discount_bps between 1 and 5000
          and original_price_centavos is not null
          and sale_starts_at is not null
          and sale_ends_at is not null
          and sale_ends_at > sale_starts_at
          and price_centavos = round(
            original_price_centavos::numeric * (10000 - promotion_discount_bps) / 10000
          )::integer
        )
      ) not valid;
  end if;
end $$;

-- Keep standard prices on regular packages. Only Signature and Prestige use
-- crossed-out reference prices for the client-confirmed limited opening offer.
update public.packages
set
  original_price_centavos = case slug
    when '6-month-unlimited' then 800000
    when '12-month-unlimited' then 1000000
    else null
  end,
  price_centavos = case slug
    when 'founding-classic-intro' then 99900
    when '3-class-package' then 300000
    when '6-class-package' then 540000
    when 'veora-unlimited' then 900000
    when '6-month-unlimited' then 700000
    when '12-month-unlimited' then 700000
    when 'infratone-intro-class' then 139900
    when 'infratone-unlimited' then 1549900
  end,
  promotion_discount_bps = case slug
    when '6-month-unlimited' then 1250
    when '12-month-unlimited' then 3000
    else null
  end,
  sale_starts_at = case when slug in ('6-month-unlimited', '12-month-unlimited')
    then '2026-08-22 00:00:00+08'::timestamptz else null end,
  sale_ends_at = case when slug in ('6-month-unlimited', '12-month-unlimited')
    then '2026-10-01 00:00:00+08'::timestamptz else null end,
  is_active = case when slug = 'infratone-unlimited' then is_active else true end,
  credit_count = case slug
    when 'founding-classic-intro' then 1
    when '3-class-package' then 6
    when '6-class-package' then 3
    when 'infratone-intro-class' then 1
    else credit_count
  end,
  recommended_label = case when slug = '6-month-unlimited'
    then 'Save ₱1,000/mo' else recommended_label end,
  conditions = case slug
    when 'founding-classic-intro' then array['Valid for 5 days']
    when '3-class-package' then array['Valid for 15 days', 'Non-transferable']
    when '6-class-package' then array['Valid for 10 days', 'Non-transferable']
    when 'veora-unlimited' then array['Maximum 1 class per day', 'Non-transferable']
    when '6-month-unlimited' then array['Limited opening price: ₱7,000/month', 'Save ₱1,000 every month', 'Monthly payment', 'Non-transferable']
    when '12-month-unlimited' then array['Limited opening price: ₱7,000/month', 'Save ₱3,000 every month', 'Monthly payment', 'Non-transferable']
    when 'infratone-intro-class' then array[]::text[]
    when 'infratone-unlimited' then array['Non-transferable']
  end,
  validity_description = case slug
    when '3-class-package' then '15 days from purchase'
    when '6-class-package' then '10 days from purchase'
    else validity_description
  end,
  validity_days = case slug
    when '3-class-package' then 15
    when '6-class-package' then 10
    else validity_days
  end,
  included_services = case slug
    when '3-class-package' then array['6 class credits']
    when '6-class-package' then array['3 class credits']
    when '6-month-unlimited' then array['Maximum 1 class per day', 'Monthly payment', '6-month membership term']
    when '12-month-unlimited' then array['Maximum 1 class per day', 'Monthly payment', '12-month membership term']
    else included_services
  end,
  updated_at = now()
where slug in (
  'founding-classic-intro', '3-class-package', '6-class-package',
  'veora-unlimited', '6-month-unlimited', '12-month-unlimited',
  'infratone-intro-class', 'infratone-unlimited'
);

alter table public.packages validate constraint packages_promotion_configuration_check;

-- ---------------------------------------------------------------------------
-- Membership lifecycle and monthly billing history.
-- ---------------------------------------------------------------------------
alter table public.customer_memberships
  add column if not exists commitment_ends_at timestamptz,
  add column if not exists monthly_fee_centavos integer,
  add column if not exists payment_status text not null default 'paid',
  add column if not exists next_payment_due date,
  add column if not exists last_payment_at timestamptz,
  add column if not exists status_notes text;

update public.customer_memberships as cm
set
  commitment_ends_at = coalesce(cm.commitment_ends_at, cm.expires_at),
  monthly_fee_centavos = coalesce(
    cm.monthly_fee_centavos,
    pu.total_amount_centavos,
    pkg.original_price_centavos,
    pkg.price_centavos
  ),
  last_payment_at = coalesce(cm.last_payment_at, pu.approved_at, cm.starts_at),
  next_payment_due = coalesce(
    cm.next_payment_due,
    case
      when cm.starts_at + interval '1 month' < cm.expires_at
        then (cm.starts_at + interval '1 month' at time zone 'Asia/Manila')::date
      else null
    end
  )
from public.purchases as pu
join public.packages as pkg on pkg.id = pu.package_id
where pu.id = cm.purchase_id;

alter table public.customer_memberships
  alter column commitment_ends_at set not null,
  alter column monthly_fee_centavos set not null;

alter table public.customer_memberships
  drop constraint if exists customer_memberships_status_check;
alter table public.customer_memberships
  add constraint customer_memberships_status_check check (
    status in (
      'active', 'pending_payment', 'payment_verification', 'past_due',
      'suspended', 'cancelled', 'expired', 'revoked'
    )
  ) not valid;
alter table public.customer_memberships
  add constraint customer_memberships_payment_status_check check (
    payment_status in ('pending', 'pending_verification', 'paid', 'past_due', 'failed', 'rejected')
  ) not valid;
alter table public.customer_memberships
  add constraint customer_memberships_monthly_fee_check check (monthly_fee_centavos >= 0) not valid;
alter table public.customer_memberships
  add constraint customer_memberships_commitment_check check (commitment_ends_at >= expires_at) not valid;

alter table public.customer_memberships validate constraint customer_memberships_status_check;
alter table public.customer_memberships validate constraint customer_memberships_payment_status_check;
alter table public.customer_memberships validate constraint customer_memberships_monthly_fee_check;
alter table public.customer_memberships validate constraint customer_memberships_commitment_check;

create index if not exists customer_memberships_payment_attention_idx
  on public.customer_memberships (payment_status, next_payment_due)
  where status in ('active', 'pending_payment', 'payment_verification', 'past_due', 'suspended');

create table public.membership_payments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.customer_memberships (id) on delete restrict,
  purchase_id uuid references public.purchases (id) on delete restrict,
  amount_centavos integer not null check (amount_centavos >= 0),
  due_date date not null,
  billing_period_start date not null,
  billing_period_end date not null check (billing_period_end > billing_period_start),
  status text not null default 'pending'
    check (status in ('pending', 'pending_verification', 'paid', 'failed', 'rejected', 'waived')),
  payment_reference text,
  receipt_url text,
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (membership_id, due_date)
);

create index membership_payments_membership_due_idx
  on public.membership_payments (membership_id, due_date desc);
create index membership_payments_attention_idx
  on public.membership_payments (status, due_date)
  where status in ('pending', 'pending_verification', 'failed');
create index membership_payments_purchase_idx
  on public.membership_payments (purchase_id)
  where purchase_id is not null;

create trigger membership_payments_set_updated_at
  before update on public.membership_payments
  for each row execute function public.set_updated_at();

alter table public.membership_payments enable row level security;
grant select on public.membership_payments to authenticated;

create policy "membership_payments_select_own_or_admin"
  on public.membership_payments for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.customer_memberships as cm
      where cm.id = membership_id and cm.user_id = (select auth.uid())
    )
  );

insert into public.membership_payments (
  membership_id, purchase_id, amount_centavos, due_date,
  billing_period_start, billing_period_end, status,
  payment_reference, submitted_at, reviewed_by, reviewed_at
)
select
  cm.id,
  cm.purchase_id,
  cm.monthly_fee_centavos,
  (cm.starts_at at time zone 'Asia/Manila')::date,
  (cm.starts_at at time zone 'Asia/Manila')::date,
  least(
    (cm.starts_at + interval '1 month' at time zone 'Asia/Manila')::date,
    (cm.commitment_ends_at at time zone 'Asia/Manila')::date
  ),
  'paid',
  pu.reference_number,
  pu.created_at,
  pu.approved_by,
  coalesce(pu.approved_at, cm.starts_at)
from public.customer_memberships as cm
join public.purchases as pu on pu.id = cm.purchase_id
on conflict (membership_id, due_date) do nothing;

-- Customer proof upload must be reviewed before any package or membership is
-- activated. Direct approval from a receipt-less pending order is removed.
create or replace function public.enforce_purchase_status_transition()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old.purchase_status is distinct from new.purchase_status then
    if not (
      (old.purchase_status = 'pending_payment' and new.purchase_status in ('proof_submitted', 'cancelled', 'expired'))
      or (old.purchase_status = 'proof_submitted' and new.purchase_status in ('approved', 'rejected'))
    ) then
      raise exception 'illegal purchase_status transition: % -> %', old.purchase_status, new.purchase_status;
    end if;
  end if;
  return new;
end;
$$;

drop function if exists public.approve_purchase(uuid);
create function public.approve_purchase(p_purchase_id uuid)
returns table (
  purchase_id uuid,
  customer_package_id uuid,
  customer_membership_id uuid,
  already_processed boolean
)
language plpgsql security definer set search_path = ''
as $$
declare
  v_purchase public.purchases;
  v_package public.packages;
  v_credit_count integer;
  v_customer_package_id uuid;
  v_customer_membership_id uuid;
  v_starts_at timestamptz;
  v_expires_at timestamptz;
  v_next_due date;
begin
  if not public.is_super_admin() then
    raise exception 'forbidden: only super_admin may approve purchases';
  end if;

  update public.purchases as p
     set purchase_status = 'approved', approved_by = auth.uid(),
         approved_at = now(), updated_at = now()
   where p.id = p_purchase_id
     and p.purchase_status = 'proof_submitted'
     and p.receipt_url is not null
  returning p.* into v_purchase;

  if not found then
    select p.* into v_purchase from public.purchases as p where p.id = p_purchase_id;
    if v_purchase.id is null then
      raise exception 'purchase % not found', p_purchase_id;
    end if;
    if v_purchase.purchase_status = 'approved' then
      select cp.id into v_customer_package_id
        from public.customer_packages as cp where cp.purchase_id = p_purchase_id;
      select cm.id into v_customer_membership_id
        from public.customer_memberships as cm where cm.purchase_id = p_purchase_id;
      return query select v_purchase.id, v_customer_package_id, v_customer_membership_id, true;
      return;
    end if;
    if v_purchase.receipt_url is null then
      raise exception 'payment proof is required before approval';
    end if;
    raise exception 'purchase % is not awaiting approval (status: %)',
      p_purchase_id, v_purchase.purchase_status;
  end if;

  select p.* into v_package from public.packages as p where p.id = v_purchase.package_id;

  if v_package.entitlement_type = 'unlimited' then
    if not v_package.unlimited_booking or v_package.membership_duration_months is null then
      raise exception 'membership package is missing its duration or unlimited entitlement';
    end if;
    v_starts_at := now();
    v_expires_at := v_starts_at + make_interval(months => v_package.membership_duration_months);
    v_next_due := case
      when v_starts_at + interval '1 month' < v_expires_at
        then (v_starts_at + interval '1 month' at time zone 'Asia/Manila')::date
      else null
    end;

    insert into public.customer_memberships (
      user_id, purchase_id, package_id, membership_name_snapshot,
      status, starts_at, expires_at, commitment_ends_at, unlimited_booking,
      monthly_fee_centavos, payment_status, next_payment_due, last_payment_at
    ) values (
      v_purchase.user_id, v_purchase.id, v_purchase.package_id,
      v_purchase.package_name_snapshot, 'active', v_starts_at, v_expires_at,
      v_expires_at, true, v_purchase.total_amount_centavos, 'paid', v_next_due, now()
    ) returning id into v_customer_membership_id;

    insert into public.membership_payments (
      membership_id, purchase_id, amount_centavos, due_date,
      billing_period_start, billing_period_end, status,
      payment_reference, submitted_at, reviewed_by, reviewed_at
    ) values (
      v_customer_membership_id, v_purchase.id, v_purchase.total_amount_centavos,
      (v_starts_at at time zone 'Asia/Manila')::date,
      (v_starts_at at time zone 'Asia/Manila')::date,
      least(
        (v_starts_at + interval '1 month' at time zone 'Asia/Manila')::date,
        (v_expires_at at time zone 'Asia/Manila')::date
      ),
      'paid', v_purchase.reference_number, v_purchase.created_at,
      auth.uid(), now()
    );
  else
    v_credit_count := coalesce(v_package.credit_count, 1);
    insert into public.customer_packages (
      user_id, purchase_id, package_id, package_name_snapshot,
      credit_count, remaining_credits, status, activated_at, expires_at
    ) values (
      v_purchase.user_id, v_purchase.id, v_purchase.package_id,
      v_purchase.package_name_snapshot, v_credit_count, v_credit_count, 'active',
      case when v_package.expires_from = 'purchase' then now() else null end,
      case when v_package.expires_from = 'purchase' and v_package.validity_days is not null
        then now() + make_interval(days => v_package.validity_days) else null end
    ) returning id into v_customer_package_id;

    insert into public.package_credit_transactions (
      customer_package_id, purchase_id, amount, type, reason, balance_after, created_by
    ) values (
      v_customer_package_id, v_purchase.id, v_credit_count, 'package_purchased',
      v_purchase.package_name_snapshot, v_credit_count, auth.uid()
    );
  end if;

  insert into public.audit_logs (
    actor_id, actor_role, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(), 'super_admin', 'purchase.approved', 'purchase', v_purchase.id,
    jsonb_build_object(
      'customer_package_id', v_customer_package_id,
      'customer_membership_id', v_customer_membership_id,
      'reference_number', v_purchase.reference_number
    )
  );

  return query select v_purchase.id, v_customer_package_id, v_customer_membership_id, false;
end;
$$;

revoke execute on function public.approve_purchase(uuid) from public, anon;
grant execute on function public.approve_purchase(uuid) to authenticated;

-- Replace the booking RPC so paid status and a current monthly due date are
-- enforced in the same locked transaction as capacity and daily limits.
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
  v_today date := (now() at time zone 'Asia/Manila')::date;
  v_cutoff timestamptz;
  v_membership_service_slug public.service_slug;
  v_session_service_slug public.service_slug;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0000'; end if;

  select cm.* into v_membership
    from public.customer_memberships as cm
   where cm.id = p_customer_membership_id and cm.user_id = v_user_id
   for update;
  if not found then raise exception 'MEMBERSHIP_NOT_FOUND' using errcode = 'P0012'; end if;

  if v_membership.next_payment_due is not null
    and v_membership.next_payment_due < v_today then
    update public.customer_memberships
      set status = 'past_due', payment_status = 'past_due'
      where id = p_customer_membership_id;
    raise exception 'MEMBERSHIP_PAYMENT_DUE' using errcode = 'P0017';
  end if;
  if v_membership.status <> 'active'
    or v_membership.payment_status <> 'paid'
    or not v_membership.unlimited_booking then
    raise exception 'MEMBERSHIP_INACTIVE' using errcode = 'P0013';
  end if;
  if v_membership.starts_at > now() then raise exception 'MEMBERSHIP_NOT_STARTED' using errcode = 'P0014'; end if;
  if v_membership.expires_at <= now() then
    update public.customer_memberships set status = 'expired'
      where id = p_customer_membership_id;
    raise exception 'MEMBERSHIP_EXPIRED' using errcode = 'P0015';
  end if;

  select cs.* into v_session from public.class_sessions as cs
   where cs.id = p_class_session_id and cs.status = 'scheduled' for update;
  if not found then raise exception 'SESSION_NOT_FOUND' using errcode = 'P0004'; end if;
  if not v_session.booking_enabled then raise exception 'BOOKING_DISABLED' using errcode = 'P0010'; end if;

  select p.service_slug into v_membership_service_slug
    from public.packages as p where p.id = v_membership.package_id;
  select ct.service_slug into v_session_service_slug
    from public.class_types as ct where ct.id = v_session.class_type_id;
  if v_session_service_slug is null or (
    v_membership_service_slug is null
    and v_session_service_slug not in ('mat-pilates', 'yoga', 'barre', 'strength-hiit')
  ) or (
    v_membership_service_slug is not null
    and v_membership_service_slug <> v_session_service_slug
  ) then
    raise exception 'PACKAGE_NOT_ELIGIBLE' using errcode = 'P0011';
  end if;

  v_local_date := (v_session.start_at at time zone 'Asia/Manila')::date;
  v_cutoff := ((v_local_date - 1)::timestamp + interval '22 hours') at time zone 'Asia/Manila';
  if now() >= v_cutoff then raise exception 'BOOKING_CUTOFF_PASSED' using errcode = 'P0009'; end if;

  if exists (
    select 1 from public.class_bookings as cb
    where cb.class_session_id = p_class_session_id
      and cb.user_id = v_user_id and cb.status = 'booked'
  ) then raise exception 'ALREADY_BOOKED' using errcode = 'P0005'; end if;

  if exists (
    select 1 from public.class_bookings as cb
    join public.class_sessions as booked_session on booked_session.id = cb.class_session_id
    where cb.customer_membership_id = p_customer_membership_id
      and cb.user_id = v_user_id and cb.status = 'booked'
      and (booked_session.start_at at time zone 'Asia/Manila')::date = v_local_date
  ) then raise exception 'MEMBERSHIP_DAILY_LIMIT' using errcode = 'P0016'; end if;

  update public.class_sessions
    set booked_count = booked_count + 1
    where id = p_class_session_id and booked_count < least(capacity, 20);
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

revoke execute on function public.book_class_session_with_membership(uuid, uuid) from public, anon;
grant execute on function public.book_class_session_with_membership(uuid, uuid) to authenticated;

-- Super-admin controls keep membership status/history auditable and never
-- delete prior membership or booking rows.
create function public.admin_set_membership_status(
  p_membership_id uuid,
  p_status text,
  p_notes text default null
) returns public.customer_memberships
language plpgsql security definer set search_path = ''
as $$
declare v_membership public.customer_memberships;
begin
  if not public.is_super_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('active', 'suspended', 'cancelled') then raise exception 'invalid membership status'; end if;

  update public.customer_memberships
  set status = p_status,
      status_notes = nullif(trim(p_notes), ''),
      payment_status = case when p_status = 'active' then 'paid' else payment_status end
  where id = p_membership_id
    and status not in ('expired', 'revoked')
  returning * into v_membership;
  if not found then raise exception 'membership not found or cannot be changed'; end if;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'super_admin', 'membership.' || p_status, 'customer_membership', p_membership_id,
    jsonb_build_object('notes', p_notes));
  return v_membership;
end;
$$;

create function public.admin_record_membership_payment(
  p_membership_id uuid,
  p_payment_reference text default null,
  p_notes text default null
) returns public.customer_memberships
language plpgsql security definer set search_path = ''
as $$
declare
  v_membership public.customer_memberships;
  v_due date;
  v_period_end date;
begin
  if not public.is_super_admin() then raise exception 'forbidden'; end if;

  select * into v_membership from public.customer_memberships
  where id = p_membership_id for update;
  if not found then raise exception 'membership not found'; end if;
  if v_membership.status in ('cancelled', 'expired', 'revoked') then
    raise exception 'membership cannot receive another payment';
  end if;
  if v_membership.commitment_ends_at <= now() then
    raise exception 'membership commitment has ended';
  end if;

  v_due := coalesce(v_membership.next_payment_due, (now() at time zone 'Asia/Manila')::date);
  v_period_end := least(
    v_due + interval '1 month',
    (v_membership.commitment_ends_at at time zone 'Asia/Manila')::date
  );

  insert into public.membership_payments (
    membership_id, amount_centavos, due_date, billing_period_start,
    billing_period_end, status, payment_reference, reviewed_by, reviewed_at, admin_notes
  ) values (
    v_membership.id, v_membership.monthly_fee_centavos, v_due, v_due,
    v_period_end, 'paid', nullif(trim(p_payment_reference), ''), auth.uid(), now(), nullif(trim(p_notes), '')
  )
  on conflict (membership_id, due_date) do update
  set status = 'paid', payment_reference = excluded.payment_reference,
      reviewed_by = auth.uid(), reviewed_at = now(), admin_notes = excluded.admin_notes;

  update public.customer_memberships
  set status = 'active', payment_status = 'paid', last_payment_at = now(),
      next_payment_due = case
        when v_period_end < (commitment_ends_at at time zone 'Asia/Manila')::date then v_period_end
        else null
      end,
      status_notes = nullif(trim(p_notes), '')
  where id = p_membership_id
  returning * into v_membership;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'super_admin', 'membership.payment_received', 'customer_membership', p_membership_id,
    jsonb_build_object('due_date', v_due, 'reference', p_payment_reference, 'notes', p_notes));
  return v_membership;
end;
$$;

create function public.admin_mark_membership_payment_issue(
  p_membership_id uuid,
  p_issue text,
  p_notes text default null
) returns public.customer_memberships
language plpgsql security definer set search_path = ''
as $$
declare
  v_membership public.customer_memberships;
  v_due date;
begin
  if not public.is_super_admin() then raise exception 'forbidden'; end if;
  if p_issue not in ('past_due', 'failed') then raise exception 'invalid payment issue'; end if;

  select * into v_membership from public.customer_memberships
  where id = p_membership_id for update;
  if not found then raise exception 'membership not found'; end if;
  if v_membership.status in ('cancelled', 'expired', 'revoked') then
    raise exception 'membership cannot be changed';
  end if;
  if v_membership.commitment_ends_at <= now() then
    raise exception 'membership commitment has ended';
  end if;
  v_due := coalesce(v_membership.next_payment_due, (now() at time zone 'Asia/Manila')::date);

  insert into public.membership_payments (
    membership_id, amount_centavos, due_date, billing_period_start,
    billing_period_end, status, reviewed_by, reviewed_at, admin_notes
  ) values (
    v_membership.id, v_membership.monthly_fee_centavos, v_due, v_due,
    least(v_due + interval '1 month', (v_membership.commitment_ends_at at time zone 'Asia/Manila')::date),
    case when p_issue = 'failed' then 'failed' else 'pending' end,
    auth.uid(), now(), nullif(trim(p_notes), '')
  )
  on conflict (membership_id, due_date) do update
  set status = excluded.status, reviewed_by = auth.uid(), reviewed_at = now(), admin_notes = excluded.admin_notes;

  update public.customer_memberships
  set status = case when p_issue = 'failed' then 'suspended' else 'past_due' end,
      payment_status = p_issue,
      status_notes = nullif(trim(p_notes), '')
  where id = p_membership_id
  returning * into v_membership;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'super_admin', 'membership.payment_' || p_issue, 'customer_membership', p_membership_id,
    jsonb_build_object('due_date', v_due, 'notes', p_notes));
  return v_membership;
end;
$$;

revoke execute on function public.admin_set_membership_status(uuid, text, text) from public, anon;
revoke execute on function public.admin_record_membership_payment(uuid, text, text) from public, anon;
revoke execute on function public.admin_mark_membership_payment_issue(uuid, text, text) from public, anon;
grant execute on function public.admin_set_membership_status(uuid, text, text) to authenticated;
grant execute on function public.admin_record_membership_payment(uuid, text, text) to authenticated;
grant execute on function public.admin_mark_membership_payment_issue(uuid, text, text) to authenticated;

-- Operational alerts for recurring dues and failures.
create function public.capture_membership_payment_notification()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_name text;
begin
  select membership_name_snapshot into v_name
  from public.customer_memberships where id = new.membership_id;

  if tg_op = 'INSERT' and new.status in ('pending', 'pending_verification', 'failed') then
    insert into public.admin_notifications (
      type, title, message, severity, audience, action_url, entity_type, entity_id
    ) values (
      'membership_payment.' || new.status,
      case new.status
        when 'pending_verification' then 'Membership payment requires review'
        when 'failed' then 'Membership payment failed'
        else 'Membership payment due'
      end,
      format('%s · Due %s · ₱%s', coalesce(v_name, 'Membership'), new.due_date,
        to_char(new.amount_centavos / 100.0, 'FM999,999,990.00')),
      case when new.status = 'failed' then 'error' else 'warning' end,
      'super_admin', '/admin/memberships', 'membership_payment', new.id
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status
    and new.status in ('pending_verification', 'failed', 'rejected') then
    insert into public.admin_notifications (
      type, title, message, severity, audience, action_url, entity_type, entity_id
    ) values (
      'membership_payment.' || new.status,
      case new.status
        when 'pending_verification' then 'Membership payment requires review'
        when 'failed' then 'Membership payment failed'
        else 'Membership payment rejected'
      end,
      format('%s · Due %s', coalesce(v_name, 'Membership'), new.due_date),
      case when new.status in ('failed', 'rejected') then 'error' else 'warning' end,
      'super_admin', '/admin/memberships', 'membership_payment', new.id
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.capture_membership_payment_notification()
  from public, anon, authenticated;

create trigger membership_payments_admin_notification
  after insert or update of status on public.membership_payments
  for each row execute function public.capture_membership_payment_notification();

create function public.process_membership_dues()
returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  v_membership public.customer_memberships;
  v_today date := (now() at time zone 'Asia/Manila')::date;
  v_created integer := 0;
begin
  for v_membership in
    select * from public.customer_memberships
    where next_payment_due is not null
      and next_payment_due <= v_today
      and status in ('active', 'past_due', 'suspended')
    order by id
    for update
  loop
    insert into public.membership_payments (
      membership_id, amount_centavos, due_date, billing_period_start,
      billing_period_end, status
    ) values (
      v_membership.id, v_membership.monthly_fee_centavos,
      v_membership.next_payment_due, v_membership.next_payment_due,
      least(
        v_membership.next_payment_due + interval '1 month',
        (v_membership.commitment_ends_at at time zone 'Asia/Manila')::date
      ),
      'pending'
    ) on conflict (membership_id, due_date) do nothing;

    if found then v_created := v_created + 1; end if;

    if v_membership.next_payment_due < v_today and v_membership.status = 'active' then
      update public.customer_memberships
      set status = 'past_due', payment_status = 'past_due'
      where id = v_membership.id;
    end if;
  end loop;
  return v_created;
end;
$$;

revoke execute on function public.process_membership_dues() from public, anon, authenticated;
grant execute on function public.process_membership_dues() to service_role;
