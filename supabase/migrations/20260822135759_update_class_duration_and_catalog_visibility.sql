-- Apply the client-confirmed one-hour duration to every non-Ballet class.
-- Ballet stays unchanged in class_types until its coach and exact class
-- duration are confirmed, while the public service catalog says so plainly.
set statement_timeout = '30s';

update public.services
set
  duration = case when slug = 'ballet' then 'To be confirmed' else '1 hour' end,
  starting_price = null
where slug in (
  'mat-pilates', 'yoga', 'barre', 'strength-hiit',
  'recovery-restore', 'ballet'
);

update public.class_types
set duration_minutes = 60
where service_slug <> 'ballet'::public.service_slug
  and duration_minutes <> 60;

-- Keep already-created future sessions consistent with the corrected class
-- length. Ending exactly when the next hourly class starts is intentional.
update public.class_sessions as session
set end_at = session.start_at + interval '60 minutes'
from public.class_types as class_type
where class_type.id = session.class_type_id
  and class_type.service_slug <> 'ballet'::public.service_slug
  and session.start_at > now()
  and session.status = 'scheduled'
  and session.end_at <> session.start_at + interval '60 minutes';

-- Generate each session from its class type's duration instead of a hard-coded
-- value so future corrections remain data-driven.
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

  perform public.complete_past_class_sessions();

  for v_slot in
    select
      slot.location_id,
      slot.weekday,
      slot.hour,
      slot.class_type_id,
      slot.instructor_id,
      slot.capacity,
      slot.minimum_participants,
      class_type.duration_minutes
    from public.class_time_slots as slot
    join public.class_types as class_type on class_type.id = slot.class_type_id
    where slot.is_active = true
  loop
    for v_day_offset in 0..greatest(p_days_ahead - 1, 0) loop
      v_local_date := (now() at time zone 'Asia/Manila')::date + v_day_offset;

      if extract(dow from v_local_date)::smallint <> v_slot.weekday then
        continue;
      end if;

      v_start_at := (v_local_date::timestamp + make_interval(hours => v_slot.hour)) at time zone 'Asia/Manila';
      v_end_at := v_start_at + make_interval(mins => v_slot.duration_minutes);

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
