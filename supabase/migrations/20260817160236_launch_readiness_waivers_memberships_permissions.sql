-- Veora launch-readiness: customer numbers, waiver evidence, configurable
-- unlimited memberships, least-privilege staff access, and idempotent admin
-- booking confirmation. Existing customer/package/booking rows are preserved.

-- -------------------------------------------------------------------------
-- Customer identity + versioned waiver acceptance
-- -------------------------------------------------------------------------

create sequence if not exists public.customer_number_seq start with 1;

alter table public.profiles
  add column if not exists customer_number bigint;

alter table public.profiles
  alter column customer_number set default nextval('public.customer_number_seq');

update public.profiles
   set customer_number = nextval('public.customer_number_seq')
 where customer_number is null;

alter table public.profiles alter column customer_number set not null;
create unique index if not exists profiles_customer_number_idx
  on public.profiles (customer_number);

create table if not exists public.waiver_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  accepted boolean not null check (accepted),
  waiver_version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, waiver_version)
);

create index if not exists waiver_acceptances_user_idx
  on public.waiver_acceptances (user_id, accepted_at desc);

alter table public.waiver_acceptances enable row level security;
grant select on public.waiver_acceptances to authenticated;

create policy "waiver_acceptances_select_own_or_super_admin"
  on public.waiver_acceptances for select to authenticated
  using ((select auth.uid()) = user_id or public.is_super_admin());

-- Capture the server-validated signup metadata in the same transaction that
-- creates auth.users/profile. Admin invitations have no waiver metadata and
-- remain valid; existing users are not changed or blocked.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_number bigint;
begin
  v_customer_number := nextval('public.customer_number_seq');

  insert into public.profiles (
    id, first_name, last_name, email, mobile_number, birthday, role, customer_number
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'mobile_number', ''),
    nullif(new.raw_user_meta_data ->> 'birthday', '')::date,
    'customer',
    v_customer_number
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

-- -------------------------------------------------------------------------
-- Configurable unlimited membership entitlement
-- -------------------------------------------------------------------------

alter table public.packages
  add column if not exists entitlement_type text not null default 'credits',
  add column if not exists membership_duration_months integer,
  add column if not exists unlimited_booking boolean not null default false,
  add column if not exists sale_starts_at timestamptz,
  add column if not exists sale_ends_at timestamptz;

alter table public.packages
  add constraint packages_entitlement_type_check
  check (entitlement_type in ('credits', 'unlimited')) not valid;
alter table public.packages validate constraint packages_entitlement_type_check;

alter table public.packages
  add constraint packages_membership_configuration_check
  check (
    (entitlement_type = 'credits' and unlimited_booking = false)
    or
    (entitlement_type = 'unlimited' and package_group = 'membership'
      and unlimited_booking = true and credit_count is null)
  ) not valid;
alter table public.packages validate constraint packages_membership_configuration_check;

create table public.customer_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  purchase_id uuid not null unique references public.purchases (id) on delete restrict,
  package_id uuid not null references public.packages (id) on delete restrict,
  membership_name_snapshot text not null,
  status text not null default 'active'
    check (status in ('active', 'expired', 'revoked')),
  starts_at timestamptz not null,
  expires_at timestamptz not null check (expires_at > starts_at),
  unlimited_booking boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_memberships_user_status_idx
  on public.customer_memberships (user_id, status, expires_at desc);
create index customer_memberships_active_expiry_idx
  on public.customer_memberships (expires_at)
  where status = 'active';

create trigger customer_memberships_set_updated_at
  before update on public.customer_memberships
  for each row execute function public.set_updated_at();

alter table public.customer_memberships enable row level security;
grant select on public.customer_memberships to authenticated;
create policy "customer_memberships_select_own_or_admin"
  on public.customer_memberships for select to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

alter table public.class_bookings
  alter column customer_package_id drop not null,
  add column if not exists customer_membership_id uuid
    references public.customer_memberships (id) on delete restrict;

alter table public.class_bookings drop constraint if exists class_bookings_credits_used_check;
alter table public.class_bookings
  add constraint class_bookings_credits_used_check check (credits_used in (0, 1));
alter table public.class_bookings
  add constraint class_bookings_one_entitlement_check check (
    (customer_package_id is not null and customer_membership_id is null and credits_used = 1)
    or
    (customer_package_id is null and customer_membership_id is not null and credits_used = 0)
  ) not valid;
alter table public.class_bookings validate constraint class_bookings_one_entitlement_check;

create index class_bookings_membership_idx
  on public.class_bookings (customer_membership_id)
  where customer_membership_id is not null;

-- Payment approval remains one atomic transaction, but now issues either a
-- finite credit package or a time-bounded unlimited membership. Repeated
-- approvals return the existing entitlement and never issue it twice.
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
begin
  if not public.is_super_admin() then
    raise exception 'forbidden: only super_admin may approve purchases';
  end if;

  update public.purchases as p
     set purchase_status = 'approved', approved_by = auth.uid(),
         approved_at = now(), updated_at = now()
   where p.id = p_purchase_id
     and p.purchase_status in ('pending_payment', 'proof_submitted')
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
      return query select v_purchase.id, v_customer_package_id,
        v_customer_membership_id, true;
      return;
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
    insert into public.customer_memberships (
      user_id, purchase_id, package_id, membership_name_snapshot,
      status, starts_at, expires_at, unlimited_booking
    ) values (
      v_purchase.user_id, v_purchase.id, v_purchase.package_id,
      v_purchase.package_name_snapshot, 'active', v_starts_at, v_expires_at, true
    ) returning id into v_customer_membership_id;
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

  return query select v_purchase.id, v_customer_package_id,
    v_customer_membership_id, false;
end;
$$;

revoke execute on function public.approve_purchase(uuid) from public, anon;
grant execute on function public.approve_purchase(uuid) to authenticated;

create or replace function public.reject_purchase(p_purchase_id uuid, p_reason text default null)
returns table (purchase_id uuid, already_processed boolean)
language plpgsql security definer set search_path = ''
as $$
declare
  v_purchase public.purchases;
begin
  if not public.is_super_admin() then
    raise exception 'forbidden: only super_admin may reject purchases';
  end if;
  update public.purchases as p
     set purchase_status = 'rejected', rejected_by = auth.uid(),
         rejected_at = now(), rejected_reason = p_reason, updated_at = now()
   where p.id = p_purchase_id
     and p.purchase_status in ('pending_payment', 'proof_submitted')
  returning p.* into v_purchase;
  if not found then
    select p.* into v_purchase from public.purchases as p where p.id = p_purchase_id;
    if v_purchase.id is null then raise exception 'purchase % not found', p_purchase_id; end if;
    if v_purchase.purchase_status = 'rejected' then
      return query select v_purchase.id, true; return;
    end if;
    raise exception 'purchase % is not awaiting approval (status: %)', p_purchase_id, v_purchase.purchase_status;
  end if;
  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'super_admin', 'purchase.rejected', 'purchase', v_purchase.id,
    jsonb_build_object('reference_number', v_purchase.reference_number, 'reason', p_reason));
  return query select v_purchase.id, false;
end;
$$;

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

-- Cancellation is idempotent through the booked-status row lock. Credit rows
-- are refunded exactly once; membership bookings only release capacity.
create or replace function public.cancel_class_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.class_bookings;
  v_new_remaining integer;
begin
  if v_user_id is null then raise exception 'NOT_AUTHENTICATED' using errcode = 'P0000'; end if;
  select cb.* into v_booking from public.class_bookings as cb
    join public.class_sessions as cs on cs.id = cb.class_session_id
   where cb.id = p_booking_id and cb.user_id = v_user_id and cb.status = 'booked'
   for update of cb;
  if not found then raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0007'; end if;
  if exists (select 1 from public.class_sessions as cs
    where cs.id = v_booking.class_session_id and cs.start_at <= now()) then
    raise exception 'SESSION_ALREADY_STARTED' using errcode = 'P0008';
  end if;

  update public.class_bookings set status = 'cancelled', cancelled_at = now(),
    cancellation_source = 'customer', updated_at = now() where id = p_booking_id;

  if v_booking.customer_package_id is not null then
    update public.customer_packages as cp
       set remaining_credits = cp.remaining_credits + v_booking.credits_used,
           status = case when cp.status = 'exhausted' then 'active' else cp.status end,
           updated_at = now()
     where cp.id = v_booking.customer_package_id
    returning cp.remaining_credits into v_new_remaining;

    insert into public.package_credit_transactions (
      customer_package_id, booking_id, amount, type, balance_after, created_by
    ) values (
      v_booking.customer_package_id, p_booking_id, v_booking.credits_used,
      'booking_cancelled_by_customer', v_new_remaining, v_user_id
    );
  end if;

  update public.class_sessions as cs
     set booked_count = greatest(cs.booked_count - 1, 0)
   where cs.id = v_booking.class_session_id;
end;
$$;

-- Supports legacy/manual pending rows and is safe to call repeatedly. The
-- booking already owns its seat/entitlement, so confirmation changes only
-- status and can never deduct another credit.
alter type public.class_booking_status add value if not exists 'pending' before 'booked';

create or replace function public.admin_confirm_class_booking(p_booking_id uuid)
returns table (booking_id uuid, already_processed boolean)
language plpgsql security definer set search_path = ''
as $$
declare
  v_status public.class_booking_status;
begin
  if not public.is_admin() then raise exception 'forbidden: admin only'; end if;
  select cb.status into v_status from public.class_bookings as cb
    where cb.id = p_booking_id for update;
  if not found then raise exception 'booking % not found', p_booking_id; end if;
  if v_status = 'booked' then return query select p_booking_id, true; return; end if;
  if v_status::text <> 'pending' then
    raise exception 'booking % cannot be confirmed from status %', p_booking_id, v_status;
  end if;
  update public.class_bookings set status = 'booked', updated_at = now()
    where id = p_booking_id and status::text = 'pending';
  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), (select p.role from public.profiles as p where p.id = auth.uid()),
    'booking.confirmed', 'class_booking', p_booking_id, '{}'::jsonb);
  return query select p_booking_id, false;
end;
$$;

revoke execute on function public.admin_confirm_class_booking(uuid) from public, anon;
grant execute on function public.admin_confirm_class_booking(uuid) to authenticated;

-- -------------------------------------------------------------------------
-- Least-privilege staff access. `admin` is the staff role; `super_admin`
-- retains payments, payment configuration, staff, logs and business setup.
-- -------------------------------------------------------------------------

drop policy if exists "purchases_select_own_or_admin" on public.purchases;
create policy "purchases_select_own_or_super_admin"
  on public.purchases for select to authenticated
  using ((select auth.uid()) = user_id or public.is_super_admin());

drop policy if exists "purchases_update_admin" on public.purchases;
create policy "purchases_update_super_admin"
  on public.purchases for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "payment_settings_select_authenticated" on public.payment_settings;
create policy "payment_settings_select_customer_or_super_admin"
  on public.payment_settings for select to authenticated
  using (is_active = true or public.is_super_admin());

drop policy if exists "payment_settings_write_admin" on public.payment_settings;
create policy "payment_settings_write_super_admin"
  on public.payment_settings for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "audit_logs_select_admin_only" on public.audit_logs;
create policy "audit_logs_select_super_admin_only"
  on public.audit_logs for select to authenticated
  using (public.is_super_admin());

drop policy if exists "packages_select_admin" on public.packages;
create policy "packages_select_super_admin"
  on public.packages for select to authenticated
  using (public.is_super_admin());

drop policy if exists "packages_write_admin" on public.packages;
create policy "packages_write_super_admin"
  on public.packages for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "receipts_select_own_or_admin" on public.payment_receipts;
create policy "receipts_select_own_or_super_admin"
  on public.payment_receipts for select to authenticated
  using ((select auth.uid()) = user_id or public.is_super_admin());

drop policy if exists "receipts_delete_admin" on public.payment_receipts;
create policy "receipts_delete_super_admin"
  on public.payment_receipts for delete to authenticated
  using (public.is_super_admin());

drop policy if exists "class_sessions_select_public" on public.class_sessions;
create policy "class_sessions_select_public"
  on public.class_sessions for select to anon, authenticated
  using (status in ('scheduled', 'cancelled'));

-- -------------------------------------------------------------------------
-- Launch catalog. Unfinalized products remain inactive with a zero placeholder
-- and cannot reach checkout until the owner supplies pricing and activates.
-- -------------------------------------------------------------------------

update public.packages set is_active = false, updated_at = now();

update public.packages
   set name = 'Intro Pass',
       package_group = 'intro_offer',
       category = 'classic',
       price_centavos = 99900,
       original_price_centavos = 110000,
       credit_count = 1,
       validity_days = 5,
       expires_from = 'purchase',
       validity_description = '5 days from purchase',
       description = 'Pre-opening offer: one Veora class before standard launch pricing begins.',
       conditions = array['Pre-opening promotional offer', 'Promotion ends after the September 18 launch'],
       entitlement_type = 'credits',
       unlimited_booking = false,
       is_active = true,
       is_recommended = true,
       recommended_label = 'Pre-opening offer',
       sort_order = 1,
       updated_at = now()
 where slug = 'founding-classic-intro';

insert into public.packages (
  slug, name, category, package_group, price_centavos, credit_count,
  validity_description, validity_days, expires_from, description,
  conditions, entitlement_type, unlimited_booking, is_active, sort_order
) values
  ('3-class-package', '3-Class Package', 'classic', 'package', 0, 3,
   'Validity to be confirmed', null, 'purchase',
   'Three class credits. Final price and validity are awaiting client confirmation.',
   array['Price and validity to be confirmed'], 'credits', false, false, 20),
  ('6-class-package', '6-Class Package', 'classic', 'package', 0, 6,
   'Validity to be confirmed', null, 'purchase',
   'Six class credits. Final price and validity are awaiting client confirmation.',
   array['Price and validity to be confirmed'], 'credits', false, false, 21),
  ('6-month-unlimited', '6-Month Unlimited', 'classic', 'membership', 0, null,
   '6 months from activation', null, 'purchase',
   'Unlimited class booking entitlement for six months. Final price and policies are awaiting client confirmation.',
   array['Price and membership policies to be confirmed'], 'unlimited', true, false, 30),
  ('12-month-unlimited', '12-Month Unlimited', 'classic', 'membership', 0, null,
   '12 months from activation', null, 'purchase',
   'Unlimited class booking entitlement for twelve months. Final price and policies are awaiting client confirmation.',
   array['Price and membership policies to be confirmed'], 'unlimited', true, false, 31)
on conflict (slug) do update set
  name = excluded.name,
  package_group = excluded.package_group,
  credit_count = excluded.credit_count,
  validity_description = excluded.validity_description,
  description = excluded.description,
  conditions = excluded.conditions,
  entitlement_type = excluded.entitlement_type,
  unlimited_booking = excluded.unlimited_booking,
  is_active = false,
  updated_at = now();

update public.packages set membership_duration_months = 6
  where slug = '6-month-unlimited';
update public.packages set membership_duration_months = 12
  where slug = '12-month-unlimited';

-- Membership-aware single-booking cancellation by staff.
create or replace function public.admin_cancel_class_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_booking public.class_bookings;
  v_new_remaining integer;
begin
  if not public.is_admin() then raise exception 'forbidden: admin only'; end if;
  select cb.* into v_booking from public.class_bookings as cb
    where cb.id = p_booking_id for update;
  if not found then raise exception 'booking % not found', p_booking_id; end if;
  if v_booking.status <> 'booked' then
    raise exception 'booking % is not cancellable (status: %)', p_booking_id, v_booking.status;
  end if;

  update public.class_bookings set status = 'cancelled', cancelled_at = now(),
    cancellation_source = 'studio', updated_at = now() where id = p_booking_id;

  if v_booking.customer_package_id is not null then
    update public.customer_packages as cp
       set remaining_credits = cp.remaining_credits + v_booking.credits_used,
           status = case when cp.status = 'exhausted' then 'active' else cp.status end,
           updated_at = now()
     where cp.id = v_booking.customer_package_id
    returning cp.remaining_credits into v_new_remaining;
    insert into public.package_credit_transactions (
      customer_package_id, booking_id, amount, type, balance_after, created_by
    ) values (
      v_booking.customer_package_id, p_booking_id, v_booking.credits_used,
      'class_cancelled_by_studio', v_new_remaining, auth.uid()
    );
  end if;

  update public.class_sessions as cs
     set booked_count = greatest(cs.booked_count - 1, 0)
   where cs.id = v_booking.class_session_id;
  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), (select p.role from public.profiles as p where p.id = auth.uid()),
    'booking.cancelled', 'class_booking', p_booking_id,
    jsonb_build_object('credit_refunded', v_booking.credits_used));
end;
$$;

create or replace function public.admin_cancel_class_session(p_class_session_id uuid)
returns table (booking_id uuid, user_id uuid, customer_package_id uuid, remaining_credits integer)
language plpgsql security definer set search_path = ''
as $$
declare
  v_session public.class_sessions;
  v_row record;
  v_new_remaining integer;
  v_count integer := 0;
begin
  if not public.is_admin() then raise exception 'forbidden: admin only'; end if;
  select cs.* into v_session from public.class_sessions as cs
    where cs.id = p_class_session_id for update;
  if not found then raise exception 'class session % not found', p_class_session_id; end if;
  if v_session.status = 'completed' then raise exception 'class already completed'; end if;
  if v_session.status = 'cancelled' then return; end if;

  for v_row in
    select cb.* from public.class_bookings as cb
     where cb.class_session_id = p_class_session_id and cb.status = 'booked'
     for update
  loop
    update public.class_bookings set status = 'cancelled', cancelled_at = now(),
      cancellation_source = 'studio', updated_at = now() where id = v_row.id;
    v_new_remaining := null;
    if v_row.customer_package_id is not null then
      update public.customer_packages as cp
         set remaining_credits = cp.remaining_credits + v_row.credits_used,
             status = case when cp.status = 'exhausted' then 'active' else cp.status end,
             updated_at = now()
       where cp.id = v_row.customer_package_id
      returning cp.remaining_credits into v_new_remaining;
      insert into public.package_credit_transactions (
        customer_package_id, booking_id, amount, type, balance_after, created_by
      ) values (
        v_row.customer_package_id, v_row.id, v_row.credits_used,
        'class_cancelled_by_studio', v_new_remaining, auth.uid()
      );
    end if;
    v_count := v_count + 1;
    booking_id := v_row.id;
    user_id := v_row.user_id;
    customer_package_id := v_row.customer_package_id;
    remaining_credits := v_new_remaining;
    return next;
  end loop;

  update public.class_sessions set status = 'cancelled', booking_enabled = false,
    booked_count = 0, updated_at = now() where id = p_class_session_id;
  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), (select p.role from public.profiles as p where p.id = auth.uid()),
    'class.cancelled', 'class_session', p_class_session_id,
    jsonb_build_object('affected_bookings', v_count));
end;
$$;

-- Automatic minimum-attendance cancellation follows the same entitlement
-- rules, but is callable only by the server's service role.
create or replace function public.system_cancel_class_session(p_class_session_id uuid)
returns table (booking_id uuid, user_id uuid, customer_package_id uuid, remaining_credits integer)
language plpgsql security definer set search_path = ''
as $$
declare
  v_session public.class_sessions;
  v_row record;
  v_new_remaining integer;
  v_count integer := 0;
begin
  select cs.* into v_session from public.class_sessions as cs
    where cs.id = p_class_session_id for update;
  if not found or v_session.status <> 'scheduled' then return; end if;

  for v_row in
    select cb.* from public.class_bookings as cb
     where cb.class_session_id = p_class_session_id and cb.status = 'booked'
     for update
  loop
    update public.class_bookings set status = 'cancelled', cancelled_at = now(),
      cancellation_source = 'system', updated_at = now() where id = v_row.id;
    v_new_remaining := null;
    if v_row.customer_package_id is not null then
      update public.customer_packages as cp
         set remaining_credits = cp.remaining_credits + v_row.credits_used,
             status = case when cp.status = 'exhausted' then 'active' else cp.status end,
             updated_at = now()
       where cp.id = v_row.customer_package_id
      returning cp.remaining_credits into v_new_remaining;
      insert into public.package_credit_transactions (
        customer_package_id, booking_id, amount, type, reason, balance_after
      ) values (
        v_row.customer_package_id, v_row.id, v_row.credits_used,
        'class_cancelled_by_studio', 'Class cancelled below minimum attendance', v_new_remaining
      );
    end if;
    v_count := v_count + 1;
    booking_id := v_row.id;
    user_id := v_row.user_id;
    customer_package_id := v_row.customer_package_id;
    remaining_credits := v_new_remaining;
    return next;
  end loop;

  update public.class_sessions set status = 'cancelled', booking_enabled = false,
    booked_count = 0, updated_at = now() where id = p_class_session_id;
  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (null, null, 'class.auto_cancelled', 'class_session', p_class_session_id,
    jsonb_build_object('affected_bookings', v_count, 'reason', 'below_minimum_attendance'));
end;
$$;

revoke execute on function public.system_cancel_class_session(uuid) from public, anon, authenticated;
grant execute on function public.system_cancel_class_session(uuid) to service_role;

-- Database-side activity logging for direct admin CRUD paths that previously
-- relied only on UI success states.
create or replace function public.audit_admin_table_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_action text;
begin
  if auth.uid() is null or not public.is_admin() then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  v_id := case when tg_op = 'DELETE' then old.id else new.id end;
  v_action := lower(tg_table_name) || '.' || lower(tg_op);
  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), (select p.role from public.profiles as p where p.id = auth.uid()),
    v_action, tg_table_name, v_id, jsonb_build_object('operation', tg_op));
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

revoke execute on function public.audit_admin_table_change() from public, anon, authenticated;

create trigger class_sessions_audit_change after insert or update or delete on public.class_sessions
  for each row execute function public.audit_admin_table_change();
create trigger instructors_audit_change after insert or update or delete on public.instructors
  for each row execute function public.audit_admin_table_change();
create trigger packages_audit_change after insert or update or delete on public.packages
  for each row execute function public.audit_admin_table_change();
