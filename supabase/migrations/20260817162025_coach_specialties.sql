-- Coach specialties/classes are admin-managed labels. Empty is valid while
-- Veora waits for final coach bios and assignments.
alter table public.instructors
  add column if not exists specialties text[] not null default '{}';
