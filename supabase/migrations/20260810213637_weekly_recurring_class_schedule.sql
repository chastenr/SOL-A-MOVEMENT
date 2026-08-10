-- Turn the recurring template from "this hour every day" into a real weekly
-- schedule. Existing templates are copied to all seven weekdays so this is
-- backwards-compatible; admins can then customize or clear each day.

alter table public.class_time_slots
  add column weekday smallint;

update public.class_time_slots
set weekday = 0
where weekday is null;

alter table public.class_time_slots
  alter column weekday set not null;

alter table public.class_time_slots
  add constraint class_time_slots_weekday_check check (weekday between 0 and 6);

alter table public.class_time_slots
  drop constraint class_time_slots_location_id_hour_key;

alter table public.class_time_slots
  add constraint class_time_slots_location_weekday_hour_key unique (location_id, weekday, hour);

insert into public.class_time_slots
  (location_id, weekday, hour, is_active, class_type_id, instructor_id, capacity, minimum_participants)
select
  slot.location_id,
  day.weekday,
  slot.hour,
  slot.is_active,
  slot.class_type_id,
  slot.instructor_id,
  slot.capacity,
  slot.minimum_participants
from public.class_time_slots slot
cross join generate_series(1, 6) as day(weekday)
where slot.weekday = 0
on conflict (location_id, weekday, hour) do nothing;

-- The generator and one-off admin form both rely on one session per location
-- and start time. Enforce that in Postgres so concurrent cron/manual runs can
-- never create duplicates.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'class_sessions_location_start_key'
      and conrelid = 'public.class_sessions'::regclass
  ) then
    alter table public.class_sessions
      add constraint class_sessions_location_start_key unique (location_id, start_at);
  end if;
end $$;

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
  v_day integer;
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
    for v_day in 0..greatest(p_days_ahead - 1, 0) loop
      v_local_date := (now() at time zone 'Asia/Manila')::date + v_day;

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
