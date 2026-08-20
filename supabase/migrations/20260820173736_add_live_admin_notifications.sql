-- Durable, realtime admin notifications for important customer and system
-- actions. Activity logs remain the immutable staff audit trail; this table
-- is the operational inbox with per-admin read state and action links.

create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null check (char_length(title) between 1 and 120),
  message text not null check (char_length(message) between 1 and 500),
  severity text not null default 'info'
    check (severity in ('info', 'success', 'warning', 'error')),
  audience text not null default 'admin'
    check (audience in ('admin', 'super_admin')),
  action_url text check (action_url is null or action_url like '/admin%'),
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_notifications_created_idx
  on public.admin_notifications (created_at desc);
create index admin_notifications_audience_created_idx
  on public.admin_notifications (audience, created_at desc);
create index admin_notifications_type_created_idx
  on public.admin_notifications (type, created_at desc);

alter table public.admin_notifications enable row level security;
grant select on public.admin_notifications to authenticated;

create policy "admin_notifications_select_authorized_admins"
  on public.admin_notifications for select to authenticated
  using (
    (audience = 'admin' and public.is_admin())
    or (audience = 'super_admin' and public.is_super_admin())
  );

create table public.admin_notification_reads (
  notification_id uuid not null
    references public.admin_notifications (id) on delete cascade,
  admin_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, admin_id)
);

create index admin_notification_reads_admin_idx
  on public.admin_notification_reads (admin_id, read_at desc);

alter table public.admin_notification_reads enable row level security;
grant select, insert, delete on public.admin_notification_reads to authenticated;

create policy "admin_notification_reads_select_own"
  on public.admin_notification_reads for select to authenticated
  using ((select auth.uid()) = admin_id and public.is_admin());

create policy "admin_notification_reads_insert_own"
  on public.admin_notification_reads for insert to authenticated
  with check ((select auth.uid()) = admin_id and public.is_admin());

create policy "admin_notification_reads_delete_own"
  on public.admin_notification_reads for delete to authenticated
  using ((select auth.uid()) = admin_id and public.is_admin());

create function public.capture_admin_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text;
  v_title text;
  v_message text;
  v_severity text := 'info';
  v_audience text := 'admin';
  v_action_url text;
  v_entity_type text;
  v_entity_id uuid;
  v_customer text;
  v_class_name text;
  v_start_at timestamptz;
  v_status text;
begin
  if tg_table_name = 'profiles' then
    if tg_op = 'INSERT' and new.role = 'customer' then
      v_type := 'customer.signup';
      v_title := 'New customer signup';
      v_customer := coalesce(nullif(trim(concat_ws(' ', new.first_name, new.last_name)), ''), new.email);
      v_message := format('%s created a Veora account (%s).', v_customer, new.email);
      v_action_url := '/admin/customers/' || new.id::text;
      v_entity_type := 'profile';
      v_entity_id := new.id;
    elsif tg_op = 'UPDATE'
      and old.phone_verified_at is null
      and new.phone_verified_at is not null then
      v_type := 'customer.phone_verified';
      v_title := 'Phone number verified';
      v_customer := coalesce(nullif(trim(concat_ws(' ', new.first_name, new.last_name)), ''), new.email);
      v_message := format('%s verified their mobile number.', v_customer);
      v_action_url := '/admin/customers/' || new.id::text;
      v_entity_type := 'profile';
      v_entity_id := new.id;
      v_severity := 'success';
    end if;

  elsif tg_table_name = 'purchases' then
    v_audience := 'super_admin';
    v_action_url := '/admin/payments/' || new.id::text;
    v_entity_type := 'purchase';
    v_entity_id := new.id;

    if tg_op = 'INSERT' then
      v_type := 'purchase.created';
      v_title := 'New package order';
      v_message := format('%s was ordered. Reference %s.', new.package_name_snapshot, new.reference_number);
    elsif old.purchase_status is distinct from new.purchase_status then
      v_status := new.purchase_status::text;
      v_type := 'purchase.' || v_status;
      v_message := format('%s · Reference %s.', new.package_name_snapshot, new.reference_number);

      case v_status
        when 'proof_submitted' then
          v_title := 'Payment proof submitted';
          v_severity := 'warning';
        when 'approved' then
          v_title := 'Payment approved';
          v_severity := 'success';
        when 'rejected' then
          v_title := 'Payment rejected';
          v_severity := 'error';
        when 'cancelled' then
          v_title := 'Order cancelled';
          v_severity := 'warning';
        when 'expired' then
          v_title := 'Order expired';
          v_severity := 'warning';
        else
          v_title := 'Payment status updated';
      end case;
    end if;

  elsif tg_table_name = 'class_bookings' then
    select
      coalesce(nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''), p.email),
      coalesce(ct.name, 'a class'),
      cs.start_at
    into v_customer, v_class_name, v_start_at
    from public.profiles as p
    join public.class_sessions as cs on cs.id = new.class_session_id
    left join public.class_types as ct on ct.id = cs.class_type_id
    where p.id = new.user_id;

    v_action_url := '/admin/bookings/' || new.id::text;
    v_entity_type := 'class_booking';
    v_entity_id := new.id;
    v_message := format(
      '%s · %s · %s PHT.',
      coalesce(v_customer, 'Customer'),
      coalesce(v_class_name, 'Class'),
      coalesce(to_char(v_start_at at time zone 'Asia/Manila', 'Mon DD, YYYY HH12:MI AM'), 'Schedule unavailable')
    );

    if tg_op = 'INSERT' then
      v_type := 'booking.created';
      v_title := 'New class booking';
    elsif old.status is distinct from new.status then
      v_status := new.status::text;
      v_type := 'booking.' || v_status;
      case v_status
        when 'booked' then
          v_title := 'Booking confirmed';
          v_severity := 'success';
        when 'cancelled' then
          v_title := 'Booking cancelled';
          v_severity := 'warning';
        when 'completed' then
          v_title := 'Booking completed';
          v_severity := 'success';
        when 'no_show' then
          v_title := 'Customer marked no-show';
          v_severity := 'warning';
        else
          v_title := 'Booking status updated';
      end case;
    end if;

  elsif tg_table_name = 'customer_memberships' then
    v_action_url := '/admin/customers/' || new.user_id::text;
    v_entity_type := 'customer_membership';
    v_entity_id := new.id;
    v_message := new.membership_name_snapshot;

    if tg_op = 'INSERT' then
      v_type := 'membership.activated';
      v_title := 'Membership activated';
      v_severity := 'success';
    elsif old.status is distinct from new.status then
      v_status := new.status;
      v_type := 'membership.' || v_status;
      v_title := case v_status
        when 'expired' then 'Membership expired'
        when 'revoked' then 'Membership restricted'
        else 'Membership status updated'
      end;
      v_severity := case when v_status = 'revoked' then 'error' else 'warning' end;
    end if;

  elsif tg_table_name = 'booking_notifications' then
    if new.status = 'failed'
      and (tg_op = 'INSERT' or old.status is distinct from new.status) then
      v_type := 'sms.failed';
      v_title := 'SMS delivery failed';
      v_message := format('A %s SMS could not be delivered after %s attempt(s).', new.type, new.attempt_count);
      v_action_url := '/admin/bookings/' || new.booking_id::text;
      v_entity_type := 'booking_notification';
      v_entity_id := new.id;
      v_severity := 'error';
    end if;
  end if;

  if v_type is not null then
    insert into public.admin_notifications (
      type, title, message, severity, audience, action_url,
      entity_type, entity_id
    ) values (
      v_type, v_title, v_message, v_severity, v_audience, v_action_url,
      v_entity_type, v_entity_id
    );
  end if;

  return new;
end;
$$;

revoke execute on function public.capture_admin_notification()
  from public, anon, authenticated;

create trigger profiles_admin_notification
  after insert or update of phone_verified_at on public.profiles
  for each row execute function public.capture_admin_notification();

create trigger purchases_admin_notification
  after insert or update of purchase_status on public.purchases
  for each row execute function public.capture_admin_notification();

create trigger class_bookings_admin_notification
  after insert or update of status on public.class_bookings
  for each row execute function public.capture_admin_notification();

create trigger customer_memberships_admin_notification
  after insert or update of status on public.customer_memberships
  for each row execute function public.capture_admin_notification();

create trigger booking_sms_failure_admin_notification
  after insert or update of status on public.booking_notifications
  for each row execute function public.capture_admin_notification();

alter publication supabase_realtime add table public.admin_notifications;
