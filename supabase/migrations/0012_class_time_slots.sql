-- Veora Wellness — admin-managed hourly start times for the fixed-length
-- group classes (Mat Pilates, Yoga, Barre, Strength & HIIT — all 50 minutes,
-- confirmed by the client). Classes run back-to-back on the hour with a
-- 10-minute turnover before the next one, so "available start times" is
-- just a set of toggleable hours per location, not individual sessions.
--
-- Ballet is intentionally NOT covered here — those classes are 60/90
-- minutes (see class_types.duration_minutes) and keep the free-form
-- start time + duration admins already use today.
--
-- App-layer: src/lib/studio-hours.ts (CLASS_DURATION_MINUTES), the class
-- session form/action (src/components/admin/ClassSessionForm.tsx,
-- src/app/admin/(protected)/classes/actions.ts), and the toggle UI at
-- /admin/classes/time-slots.

create table public.class_time_slots (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  hour smallint not null check (hour between 0 and 23),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, hour)
);

create trigger class_time_slots_set_updated_at
  before update on public.class_time_slots
  for each row execute function public.set_updated_at();

alter table public.class_time_slots enable row level security;

-- Admin-only: this table drives what admins see when scheduling a class —
-- customers only ever see actual class_sessions rows, never this table.
create policy "class_time_slots_select_admin" on public.class_time_slots for select
  to authenticated using (public.is_admin());
create policy "class_time_slots_write_admin" on public.class_time_slots for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- Seed one row per hour (7 AM-7 PM start, i.e. within the 7 AM-8 PM studio
-- hours from migration 0011 with room for a 50-minute class) for every
-- existing location, all active by default.
insert into public.class_time_slots (location_id, hour)
select l.id, h.hour
from public.locations l
cross join generate_series(7, 19) as h(hour);
