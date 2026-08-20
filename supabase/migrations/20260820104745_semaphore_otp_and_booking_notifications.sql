-- Semaphore-backed customer phone verification and idempotent booking SMS.
-- Supabase Auth email login and the existing Supabase MFA factors remain
-- unchanged; these tables are server-only implementation details.

create table public.phone_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  attempt_count smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint phone_verifications_phone_check check (phone ~ '^\+639[0-9]{9}$'),
  constraint phone_verifications_attempt_count_check check (attempt_count between 0 and 5)
);

create index phone_verifications_user_phone_created_idx
  on public.phone_verifications (user_id, phone, created_at desc);
create index phone_verifications_phone_created_idx
  on public.phone_verifications (phone, created_at desc);

create trigger phone_verifications_set_updated_at
  before update on public.phone_verifications
  for each row execute function public.set_updated_at();

alter table public.phone_verifications enable row level security;
revoke all on public.phone_verifications from anon, authenticated;
-- No RLS policies: only the service-role server client can access OTP hashes.

create table public.booking_notifications (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.class_bookings (id) on delete cascade,
  type text not null,
  channel text not null default 'sms',
  status text not null default 'pending',
  provider text not null default 'semaphore',
  provider_message_id text,
  attempt_count smallint not null default 0,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_notifications_type_check check (
    type in ('booking_confirmation', 'reminder_24h', 'reminder_2h', 'booking_cancelled')
  ),
  constraint booking_notifications_channel_check check (channel = 'sms'),
  constraint booking_notifications_status_check check (status in ('pending', 'sent', 'failed')),
  constraint booking_notifications_attempt_count_check check (attempt_count between 0 and 3),
  constraint booking_notifications_unique unique (booking_id, channel, type)
);

create index booking_notifications_booking_idx on public.booking_notifications (booking_id);
create index booking_notifications_retry_idx
  on public.booking_notifications (type, status, last_attempt_at)
  where status in ('pending', 'failed') and attempt_count < 3;

create trigger booking_notifications_set_updated_at
  before update on public.booking_notifications
  for each row execute function public.set_updated_at();

alter table public.booking_notifications enable row level security;
grant select on public.booking_notifications to authenticated;
create policy "booking_notifications_select_admin"
  on public.booking_notifications for select to authenticated
  using (public.is_admin());

-- Atomically validates an OTP, consumes one attempt on a mismatch, and only
-- marks the authenticated route's user id as verified. Callable by the
-- service role only; browser roles cannot submit an arbitrary user id.
create function public.verify_semaphore_phone_otp(
  p_user_id uuid,
  p_phone text,
  p_code_hash text
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_verification public.phone_verifications;
  v_attempts smallint;
begin
  select pv.* into v_verification
    from public.phone_verifications as pv
   where pv.user_id = p_user_id
     and pv.phone = p_phone
     and pv.verified_at is null
   order by pv.created_at desc
   limit 1
   for update;

  if not found then return 'not_found'; end if;
  if v_verification.expires_at <= now() then return 'expired'; end if;
  if v_verification.attempt_count >= 5 then return 'too_many_attempts'; end if;

  if v_verification.code_hash <> p_code_hash then
    update public.phone_verifications
       set attempt_count = attempt_count + 1
     where id = v_verification.id
     returning attempt_count into v_attempts;
    if v_attempts >= 5 then return 'too_many_attempts'; end if;
    return 'incorrect';
  end if;

  update public.phone_verifications
     set verified_at = now()
   where id = v_verification.id;

  update public.profiles
     set mobile_number = p_phone,
         phone_verified_at = now(),
         updated_at = now()
   where id = p_user_id;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (
    p_user_id,
    (select p.role from public.profiles as p where p.id = p_user_id),
    'profile.phone_verified',
    'profile',
    p_user_id,
    jsonb_build_object('provider', 'semaphore')
  );

  return 'verified';
end;
$$;

revoke execute on function public.verify_semaphore_phone_otp(uuid, text, text) from public, anon, authenticated;
grant execute on function public.verify_semaphore_phone_otp(uuid, text, text) to service_role;

-- Claims one delivery attempt. Concurrent cron invocations cannot both
-- claim the same booking/type, and stale/failed attempts stop after three.
create function public.claim_booking_sms_notification(
  p_booking_id uuid,
  p_type text
) returns table (notification_id uuid, attempt_count smallint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.booking_notifications;
begin
  if p_type not in ('booking_confirmation', 'reminder_24h', 'reminder_2h', 'booking_cancelled') then
    raise exception 'invalid booking notification type';
  end if;

  insert into public.booking_notifications (
    booking_id, type, channel, status, provider, attempt_count, last_attempt_at
  ) values (
    p_booking_id, p_type, 'sms', 'pending', 'semaphore', 1, now()
  )
  on conflict (booking_id, channel, type) do nothing
  returning * into v_row;

  if found then
    return query select v_row.id, v_row.attempt_count;
    return;
  end if;

  select bn.* into v_row
    from public.booking_notifications as bn
   where bn.booking_id = p_booking_id
     and bn.channel = 'sms'
     and bn.type = p_type
   for update;

  if v_row.status = 'sent'
     or v_row.attempt_count >= 3
     or (v_row.status = 'pending' and v_row.last_attempt_at > now() - interval '5 minutes') then
    return;
  end if;

  update public.booking_notifications as bn
     set status = 'pending',
         attempt_count = bn.attempt_count + 1,
         last_attempt_at = now(),
         failed_at = null,
         error = null
   where id = v_row.id
   returning * into v_row;

  return query select v_row.id, v_row.attempt_count;
end;
$$;

revoke execute on function public.claim_booking_sms_notification(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_booking_sms_notification(uuid, text) to service_role;
