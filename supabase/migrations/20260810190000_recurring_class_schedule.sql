-- Veora Wellness — turns "Class Times" from a plain open/closed toggle into
-- a recurring template, so the studio's actual pattern (a class every open
-- hour, every day) doesn't require an admin to click "Schedule Session"
-- once per hour per day forever. An admin now assigns a class type (and
-- optionally a coach/capacity/minimum) to a slot ONCE; a daily job — plus an
-- immediate manual trigger — keeps a rolling window of real, bookable
-- class_sessions generated from it automatically.
--
-- Slots with no class_type_id behave exactly as before (an open hour with
-- no recurring template — an admin can still hand-schedule into it, e.g.
-- for a one-off). Ballet is untouched — it was never part of this hourly
-- grid (see migration 0012) and still isn't.

alter table public.class_time_slots
  add column if not exists class_type_id uuid references public.class_types(id) on delete set null,
  add column if not exists instructor_id uuid references public.instructors(id) on delete set null,
  add column if not exists capacity integer not null default 10 check (capacity > 0),
  add column if not exists minimum_participants integer check (minimum_participants > 0);

-- Generates real class_sessions rows for every active, class-type-assigned
-- slot, for the next p_days_ahead Manila-calendar days — skipping any
-- location+start_at that already has a session (so running this daily, or
-- re-running it by hand, only ever fills in the newly-exposed day rather
-- than duplicating anything). Callable by an admin (the "Generate Now"
-- button) or by the daily cron job (service_role) — see
-- /api/cron/generate-sessions.
create or replace function public.generate_recurring_class_sessions(p_days_ahead integer default 14)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_created integer := 0;
  v_slot record;
  v_day integer;
  v_local_date date;
  v_start_at timestamptz;
  v_end_at timestamptz;
begin
  if not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden: only admin/super_admin or the system may generate sessions';
  end if;

  for v_slot in
    select * from public.class_time_slots
    where is_active = true and class_type_id is not null
  loop
    for v_day in 0..greatest(p_days_ahead - 1, 0) loop
      v_local_date := (now() at time zone 'Asia/Manila')::date + v_day;
      v_start_at := (v_local_date::timestamp + make_interval(hours => v_slot.hour)) at time zone 'Asia/Manila';
      v_end_at := v_start_at + interval '50 minutes';

      if not exists (
        select 1 from public.class_sessions cs
        where cs.location_id = v_slot.location_id and cs.start_at = v_start_at
      ) then
        insert into public.class_sessions
          (class_type_id, location_id, instructor_id, start_at, end_at, capacity, minimum_participants, status, booking_enabled)
        values
          (v_slot.class_type_id, v_slot.location_id, v_slot.instructor_id, v_start_at, v_end_at,
           v_slot.capacity, v_slot.minimum_participants, 'scheduled', true);
        v_created := v_created + 1;
      end if;
    end loop;
  end loop;

  return v_created;
end;
$$;

revoke execute on function public.generate_recurring_class_sessions(integer) from public;
grant execute on function public.generate_recurring_class_sessions(integer) to authenticated, service_role;
