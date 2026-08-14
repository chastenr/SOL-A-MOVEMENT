-- Make cleanup part of the already-scheduled nightly generation operation.
-- Keeping it inside the database function also covers manual generation and
-- avoids requiring a second scheduler or a staff action.
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
