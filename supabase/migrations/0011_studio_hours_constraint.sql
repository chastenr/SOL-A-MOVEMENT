-- Veora Wellness — enforce the client-confirmed studio hours (7:00 AM –
-- 8:00 PM daily, Manila time) at the database level too. Additive, run
-- after 0001-0010.
--
-- App-layer validation (classSessionFormSchema's superRefine, in
-- src/lib/validations.ts) already blocks this in the UI and the server
-- action — this constraint is the last line of defense, matching this
-- project's everywhere-else pattern of not trusting app code alone
-- (e.g. class_sessions.booked_count <= capacity).
--
-- Safe to add now with no backfill: no class_sessions rows exist yet.

alter table public.class_sessions
  add constraint class_sessions_within_studio_hours
  check (
    (start_at at time zone 'Asia/Manila')::time >= time '07:00'
    and (end_at at time zone 'Asia/Manila')::time <= time '20:00'
  );
