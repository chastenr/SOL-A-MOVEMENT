-- Veora Wellness — accounts, packages, payments, booking engine.
--
-- Additive migration: the existing public.bookings table (see
-- supabase/schema.sql) is untouched and keeps powering the guest /api/book
-- flow exactly as before. Everything here is new.
--
-- Run this in the Supabase SQL editor (or `supabase db push` once the
-- project is linked) after supabase/schema.sql. Idempotent-ish via
-- `if not exists` / `create or replace` where practical, but this is a
-- first migration — running it twice against a fresh project is the
-- expected path, not repeated re-application.

-- =========================================================================
-- 0. Shared helpers
-- =========================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- 1. Enums
-- =========================================================================

create type public.user_role as enum ('customer', 'admin', 'super_admin');

-- Mirrors src/data/services.ts. Adding a 7th service later requires
-- `alter type public.service_slug add value 'new-slug';`.
create type public.service_slug as enum (
  'mat-pilates', 'yoga', 'barre', 'strength-hiit', 'recovery-restore', 'ballet'
);

-- Mirrors the 6 keys of the `pricing` object in src/data/pricing.ts.
create type public.package_group as enum (
  'intro_offer', 'single_session', 'package', 'membership', 'private_session', 'special_offer'
);

create type public.package_category as enum ('classic', 'restore', 'ballet', 'studio_rental');

-- Governs where a customer_package's expiry clock starts. Two founder SKUs
-- anchor to "first booking," not purchase date — see seed notes below and
-- NEEDS_CLIENT_CONFIRMATION.md (unresolved 7-day-vs-100-day conflict).
create type public.expiry_anchor as enum ('purchase', 'first_booking');

create type public.purchase_status as enum (
  'pending_payment', 'proof_submitted', 'approved', 'rejected', 'cancelled', 'expired'
);

create type public.payment_method as enum ('bank_transfer', 'gcash_qr', 'paymongo_card', 'cash', 'other');

create type public.class_session_status as enum ('scheduled', 'cancelled', 'completed');

create type public.class_booking_status as enum ('booked', 'cancelled', 'completed', 'no_show');

-- =========================================================================
-- 2. profiles + role plumbing
-- =========================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null,
  mobile_number text not null default '',
  birthday date,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_lower_idx on public.profiles (lower(email));
create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Creates the profile row the instant a Supabase Auth user is created.
-- role is ALWAYS hardcoded to 'customer' here — never read a client-supplied
-- 'role' key out of raw_user_meta_data, or anyone could self-promote to
-- admin at signup via options.data.role in the client-side signUp() call.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, first_name, last_name, email, mobile_number, birthday, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'mobile_number', ''),
    nullif(new.raw_user_meta_data ->> 'birthday', '')::date,
    'customer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keeps profiles.email in sync if a user changes it via auth.updateUser().
create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email, updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_update();

-- RLS-recursion-safe role checks: SECURITY DEFINER functions run as their
-- owner (BYPASSRLS), so the inner `select ... from profiles` never
-- re-triggers RLS evaluation on profiles — there is no cycle to detect.
-- Writing this same query inline inside a policy ON profiles would recurse.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin');
$$;

revoke execute on function public.is_admin() from public;
revoke execute on function public.is_super_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

-- The only sanctioned way to change a role. Re-checks is_super_admin()
-- internally, so even a direct supabase.rpc() call from a non-super-admin
-- hard-fails instead of silently no-op'ing.
create or replace function public.set_user_role(target_user_id uuid, new_role public.user_role)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden: only super_admin may change roles';
  end if;

  update public.profiles set role = new_role, updated_at = now() where id = target_user_id;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'super_admin', 'profile.role_changed', 'profile', target_user_id,
          jsonb_build_object('new_role', new_role));
end;
$$;

revoke execute on function public.set_user_role(uuid, public.user_role) from public;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Column-scoped grant: default schema-wide privileges would otherwise let a
-- customer UPDATE their own `role` column straight to 'admin' and still pass
-- the "own row" USING/WITH CHECK clause above. role/email changes are
-- excluded here on purpose (role -> set_user_role(), email -> Supabase Auth's
-- own flow, synced by the trigger above).
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, mobile_number, birthday) on public.profiles to authenticated;

-- =========================================================================
-- 3. audit_logs (created early — referenced by RPCs below)
-- =========================================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_role public.user_role,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_actor_idx on public.audit_logs (actor_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

create policy "audit_logs_select_admin_only" on public.audit_logs for select
  to authenticated using (public.is_admin());
-- No insert/update/delete policy for anon or authenticated: rows are written
-- only from inside SECURITY DEFINER functions or the service-role client —
-- never a direct client insert, which would let anyone forge an audit entry.

-- =========================================================================
-- 4. locations, instructors, class_types, class_sessions
-- =========================================================================

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  address_line1 text not null,
  address_line2 text not null,
  phone text not null,
  email text not null,
  booking_email text not null,
  map_url text not null,
  lat double precision not null,
  lng double precision not null,
  hours_note text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

insert into public.locations
  (slug, name, address_line1, address_line2, phone, email, booking_email, map_url, lat, lng, hours_note, active)
values (
  'bacoor', 'Veora Wellness — Bacoor',
  '2nd Floor, EMRADEE Building, Daang Hari Road', 'Molino IV, Bacoor, Cavite, 4102, Philippines',
  '+63 917 319 4772', 'bookings@veorawellnessph.com', 'bookings@veorawellnessph.com',
  'https://www.google.com/maps/search/?api=1&query=14.4108087,120.9503414',
  14.4108087, 120.9503414,
  'Studio hours will be announced closer to opening. Contact us for current availability.',
  true
);

create table public.instructors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Empty at launch — no real staff roster exists yet (see
-- NEEDS_CLIENT_CONFIRMATION.md). Admin adds real instructors later.

create trigger instructors_set_updated_at
  before update on public.instructors
  for each row execute function public.set_updated_at();

create table public.class_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  service_slug public.service_slug not null,
  duration_minutes integer not null check (duration_minutes > 0),
  level text not null,
  description text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger class_types_set_updated_at
  before update on public.class_types
  for each row execute function public.set_updated_at();

-- Seed: the real 19-entry class directory from src/data/schedule.ts,
-- verbatim (names/descriptions unchanged) — not an invented timetable.
insert into public.class_types (slug, name, category, service_slug, duration_minutes, level, description) values
('mat-pilates', 'Mat Pilates', 'Mat Pilates', 'mat-pilates', 50, 'Open to all',
  'Strengthen your core, improve balance and enhance flexibility with confidence and precision.'),
('hatha', 'Hatha', 'Yoga', 'yoga', 50, 'Open to all',
  'Improve flexibility, balance and relaxation with traditional yoga poses and mindful breathing.'),
('vinyasa-yoga', 'Vinyasa Yoga', 'Yoga', 'yoga', 50, 'Open to all',
  'Improve strength, flexibility and mindfulness with breath-led movement that flows between poses.'),
('power-yoga', 'Power Yoga', 'Yoga', 'yoga', 50, 'Open to all',
  'Build strength, stamina and confidence through energetic, full-body yoga.'),
('ashtanga', 'Ashtanga', 'Yoga', 'yoga', 50, 'Open to all',
  'Build strength, endurance and discipline through a dynamic, structured sequence of postures.'),
('restorative-yoga', 'Restorative Yoga', 'Yoga', 'yoga', 50, 'Open to all',
  'Reduce stress, improve flexibility and promote deep relaxation through gentle, supported poses.'),
('gentle-flow-yoga', 'Gentle Flow Yoga', 'Yoga', 'yoga', 50, 'Open to all',
  'Improve mobility, balance and relaxation through slow, mindful movement suitable for all levels.'),
('stretch-yoga', 'Stretch Yoga', 'Yoga', 'yoga', 50, 'Open to all',
  'Improve flexibility, mobility and recovery with guided stretches that reduce muscle tension.'),
('yogalates', 'Yogalates', 'Yoga', 'yoga', 50, 'Open to all',
  'Improve strength, flexibility and core stability by combining yoga and Pilates.'),
('barre', 'Barre', 'Barre', 'barre', 50, 'Open to all',
  'Improve posture, balance and muscle endurance through low-impact, ballet-inspired movement.'),
('mat-strength', 'Mat Strength', 'Strength & HIIT', 'strength-hiit', 50, 'Open to all',
  'Develop functional strength, stability and balance with guided full-body resistance exercises.'),
('mat-sculpt', 'Mat Sculpt', 'Strength & HIIT', 'strength-hiit', 50, 'Open to all',
  'Build lean muscle, improve endurance and tone your body through targeted, strength-focused movement.'),
('functional-group-exercise', 'Functional Group Exercise', 'Strength & HIIT', 'strength-hiit', 50, 'Open to all',
  'Improve strength, mobility and overall fitness in a supportive group setting.'),
('hiit', 'HIIT', 'Strength & HIIT', 'strength-hiit', 50, 'Open to all',
  'Improve cardiovascular fitness, build strength and burn calories through high-intensity intervals.'),
('little-swans-ballet', 'Little Swans Ballet (3–5 yrs)', 'Ballet', 'ballet', 60, 'Beginner',
  'Play-based ballet that introduces coordination, balance, rhythm and imaginative storytelling.'),
('tiny-stars-ballet', 'Tiny Stars Ballet (6–8 yrs)', 'Ballet', 'ballet', 60, 'Beginner',
  'The basic foundations of classical ballet — posture, balance, coordination and flexibility.'),
('rising-stars-ballet', 'Rising Stars Ballet (9–12 yrs)', 'Ballet', 'ballet', 90, 'Beginner to Intermediate',
  'Classical technique and alignment, with proper turns, jumps and movement quality.'),
('prima-ballet', 'Prima Ballet (13–17 yrs)', 'Ballet', 'ballet', 90, 'Beginner to Intermediate',
  'Refined technique, artistry and performance skills, with a focus on alignment and injury prevention.'),
('adult-ballet', 'Adult Ballet (18+)', 'Ballet', 'ballet', 60, 'Beginner',
  'Ballet fundamentals in a welcoming, supportive environment — perfect for complete beginners.');

create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_type_id uuid not null references public.class_types (id) on delete restrict,
  location_id uuid not null references public.locations (id) on delete restrict,
  instructor_id uuid references public.instructors (id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null check (end_at > start_at),
  capacity integer not null check (capacity > 0),
  booked_count integer not null default 0 check (booked_count >= 0 and booked_count <= capacity),
  status public.class_session_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Empty at launch: no real timetable exists yet (see schedule.ts comment).
-- Admin populates real sessions via /admin/classes. The customer booking UI
-- shows a "no upcoming sessions" empty state until then — by design.

create index class_sessions_start_idx on public.class_sessions (start_at) where status = 'scheduled';
create index class_sessions_class_type_idx on public.class_sessions (class_type_id);

create trigger class_sessions_set_updated_at
  before update on public.class_sessions
  for each row execute function public.set_updated_at();

alter table public.locations enable row level security;
alter table public.instructors enable row level security;
alter table public.class_types enable row level security;
alter table public.class_sessions enable row level security;

create policy "locations_select_public" on public.locations for select to anon, authenticated using (active = true);
create policy "locations_select_admin" on public.locations for select to authenticated using (public.is_admin());
create policy "locations_write_admin" on public.locations for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "instructors_select_public" on public.instructors for select to anon, authenticated using (active = true);
create policy "instructors_select_admin" on public.instructors for select to authenticated using (public.is_admin());
create policy "instructors_write_admin" on public.instructors for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "class_types_select_public" on public.class_types for select to anon, authenticated using (active = true);
create policy "class_types_select_admin" on public.class_types for select to authenticated using (public.is_admin());
create policy "class_types_write_admin" on public.class_types for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "class_sessions_select_public" on public.class_sessions for select
  to anon, authenticated using (status = 'scheduled');
create policy "class_sessions_select_admin" on public.class_sessions for select to authenticated using (public.is_admin());
create policy "class_sessions_write_admin" on public.class_sessions for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- =========================================================================
-- 5. packages (+ full real seed from src/data/pricing.ts)
-- =========================================================================

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category public.package_category not null,
  package_group public.package_group not null,
  service_slug public.service_slug,
  price_centavos integer not null check (price_centavos >= 0),
  original_price_centavos integer check (original_price_centavos is null or original_price_centavos > price_centavos),
  credit_count integer check (credit_count is null or credit_count > 0),
  validity_description text not null,
  validity_days integer check (validity_days is null or validity_days > 0),
  expires_from public.expiry_anchor not null default 'purchase',
  description text not null,
  included_services text[] not null default '{}',
  conditions text[] not null default '{}',
  is_recommended boolean not null default false,
  recommended_label text check (recommended_label is null or is_recommended = true),
  is_founder_offer boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index packages_active_sort_idx on public.packages (is_active, sort_order);
create index packages_group_idx on public.packages (package_group);
create index packages_category_idx on public.packages (category);

create trigger packages_set_updated_at
  before update on public.packages
  for each row execute function public.set_updated_at();

-- Seed: all 22 real rows from src/data/pricing.ts, migrated verbatim
-- (names/prices/descriptions unchanged; peso digits x 100 = centavos).
insert into public.packages
  (slug, name, category, package_group, service_slug, price_centavos, original_price_centavos,
   credit_count, validity_description, validity_days, expires_from, description, included_services,
   conditions, is_recommended, recommended_label, is_founder_offer, sort_order)
values
-- introOffers (all is_founder_offer = true)
('founding-classic-intro', 'CLASSIC Intro Pass — Founding Member', 'classic', 'intro_offer', null,
  59900, 85000, 1, '15 days from purchase', 15, 'purchase',
  'A single class credit at an exclusive pre-opening rate.',
  array['Mat Pilates, Yoga, Barre, Strength or Mobility classes'],
  array['Available only during our preselling period — after official launch, pricing transitions to standard rates.'],
  false, null, true, 10),

-- validity_days intentionally NULL: NEEDS_CLIENT_CONFIRMATION.md documents a
-- 7-day-vs-100-day conflict on this exact SKU that the studio has not
-- resolved — do not guess. expires_from = 'first_booking' so the clock
-- doesn't start until the customer's first redemption.
('founding-classic-week', 'CLASSIC Unlimited Week — Founding Member', 'classic', 'intro_offer', null,
  250000, null, 7, '7 class credits within 1 week of first booking', null, 'first_booking',
  'Seven class credits to use within one week, starting from your first booking.',
  array['Mat Pilates, Yoga, Barre, Strength or Mobility classes'],
  array['Available only during our preselling period — after official launch, pricing transitions to standard rates.'],
  false, null, true, 20),

('founding-classic-month', 'CLASSIC Unlimited Month — Founding Member', 'classic', 'intro_offer', null,
  950000, null, 30, '30 class credits within 30 days', 30, 'purchase',
  'Thirty class credits to use within thirty days.',
  array['Mat Pilates, Yoga, Barre, Strength or Mobility classes'],
  array['Available only during our preselling period — after official launch, pricing transitions to standard rates.'],
  true, 'Best Value', true, 30),

('founding-classic-quarter', 'CLASSIC Unlimited Quarter — Founding Member', 'classic', 'intro_offer', null,
  2500000, null, 90, '90 class credits within 90 days', 90, 'purchase',
  'Ninety class credits to use within ninety days.',
  array['Mat Pilates, Yoga, Barre, Strength or Mobility classes'],
  array['Available only during our preselling period — after official launch, pricing transitions to standard rates.'],
  false, null, true, 40),

('founding-classic-consistency', 'CLASSIC Consistency (20-class credit) — Founding Member', 'classic', 'intro_offer', null,
  1400000, null, 20, '100 days from purchase', 100, 'purchase',
  'Twenty class credits for building a consistent practice.',
  array['Mat Pilates, Yoga, Barre, Strength or Mobility classes'],
  array['Available only during our preselling period — after official launch, pricing transitions to standard rates.'],
  false, null, true, 50),

('founding-restore-week', 'RESTORE Unlimited Week — Founding Member', 'restore', 'intro_offer', 'recovery-restore',
  450000, null, 7, '7 class credits within 1 week of first booking', null, 'first_booking',
  'Seven thermal recovery class credits to use within one week.',
  array['Heated and Red Light Recovery classes (Hot Pilates, Infrared Yoga and more)'],
  array['Available only during our preselling period — after official launch, pricing transitions to standard rates.'],
  false, null, true, 60),

('founding-restore-elevate', 'RESTORE Elevate (20-class credit) — Founding Member', 'restore', 'intro_offer', 'recovery-restore',
  1900000, null, 20, '100 days from purchase', 100, 'purchase',
  'Twenty thermal recovery class credits.',
  array['Heated and Red Light Recovery classes (Hot Pilates, Infrared Yoga and more)'],
  array['Available only during our preselling period — after official launch, pricing transitions to standard rates.'],
  false, null, true, 70),

('founding-ballet-term', 'Ballet 12-Week Term — Founding Member', 'ballet', 'intro_offer', 'ballet',
  1050000, 1100000, 12, '90 days from purchase', 90, 'purchase',
  'Twelve ballet class credits across a structured 12-week term.',
  array['Ballet classes, all age groups'],
  array['Available only during our preselling period — after official launch, pricing transitions to standard rates.'],
  false, null, true, 80),

-- singleSessions
('classic-intro-pass', 'CLASSIC Intro Pass (Single Session)', 'classic', 'single_session', null,
  85000, null, 1, '15 days from purchase', 15, 'purchase',
  'Try a single class credit, redeemable for any Classics-category class.',
  array['Mat Pilates, Yoga, Barre, Strength or Mobility classes'], array[]::text[], false, null, false, 100),

('restore-calm', 'RESTORE Calm (Single Session)', 'restore', 'single_session', 'recovery-restore',
  150000, null, 1, '15 days from purchase', 15, 'purchase',
  'A single thermal recovery class credit.',
  array['Heated and Red Light Recovery classes (Hot Pilates, Infrared Yoga and more)'], array[]::text[], false, null, false, 110),

('ballet-trial', 'Ballet Trial Class (Single Session)', 'ballet', 'single_session', 'ballet',
  100000, null, 1, '15 days from purchase', 15, 'purchase',
  'A single ballet class credit.',
  array['Ballet classes, all age groups'], array[]::text[], false, null, false, 120),

-- packages
('classic-discovery', 'CLASSIC Discovery (4-class credit)', 'classic', 'package', null,
  320000, null, 4, '30 days from purchase', 30, 'purchase',
  'Four flexible class credits.', array['Mat Pilates, Yoga, Barre, Strength or Mobility classes'], array[]::text[], false, null, false, 200),

('classic-foundation', 'CLASSIC Foundation (8-class credit)', 'classic', 'package', null,
  620000, null, 8, '60 days from purchase', 60, 'purchase',
  'Eight flexible class credits.', array['Mat Pilates, Yoga, Barre, Strength or Mobility classes'], array[]::text[], true, 'Most Popular', false, 210),

('classic-lifestyle', 'CLASSIC Lifestyle (10-class credit)', 'classic', 'package', null,
  750000, null, 10, '75 days from purchase', 75, 'purchase',
  'Ten flexible class credits.', array['Mat Pilates, Yoga, Barre, Strength or Mobility classes'], array[]::text[], false, null, false, 220),

('restore-balance', 'RESTORE Balance (4-class credit)', 'restore', 'package', 'recovery-restore',
  540000, null, 4, '30 days from purchase', 30, 'purchase',
  'Four thermal recovery class credits.', array['Heated and Red Light Recovery classes (Hot Pilates, Infrared Yoga and more)'], array[]::text[], false, null, false, 230),

('restore-recovery', 'RESTORE Recovery (8-class credit)', 'restore', 'package', 'recovery-restore',
  960000, null, 8, '60 days from purchase', 60, 'purchase',
  'Eight thermal recovery class credits.', array['Heated and Red Light Recovery classes (Hot Pilates, Infrared Yoga and more)'], array[]::text[], false, null, false, 240),

('restore-thrive', 'RESTORE Thrive (10-class credit)', 'restore', 'package', 'recovery-restore',
  1100000, null, 10, '75 days from purchase', 75, 'purchase',
  'Ten thermal recovery class credits.', array['Heated and Red Light Recovery classes (Hot Pilates, Infrared Yoga and more)'], array[]::text[], false, null, false, 250),

('ballet-starter', 'Ballet Starter Class (4-class credit)', 'ballet', 'package', 'ballet',
  380000, null, 4, '30 days from purchase', 30, 'purchase',
  'Four ballet class credits.', array['Ballet classes, all age groups'], array[]::text[], false, null, false, 260),

('ballet-12-week-term', 'Ballet 12-Week Term', 'ballet', 'package', 'ballet',
  1100000, null, 12, '90 days from purchase', 90, 'purchase',
  'Twelve ballet class credits across a structured 12-week term.', array['Ballet classes, all age groups'], array[]::text[], false, null, false, 270),

-- specialOffers (studio_rental; credit_count NULL — approve_purchase() below
-- issues a single "use" credit for these, so the ledger stays uniform)
('studio-rental', 'Studio Rental (without instructor)', 'studio_rental', 'special_offer', null,
  650000, null, null, 'Booking must be made within 30 days of purchase', 30, 'purchase',
  'Private access to the studio for your own event or activity.',
  array['2-hour exclusive studio use', 'Up to 10 guests', 'No instructor included'],
  array['Additional guest: ₱300/person', 'Does not include event styling, decorations, furniture or catering', 'No-shows and unused bookings are forfeited'],
  false, null, false, 300),

('studio-classics-experience', 'Studio + Classics Experience', 'studio_rental', 'special_offer', null,
  1000000, null, null, 'Booking must be made within 30 days of purchase', 30, 'purchase',
  'Exclusive studio access plus one private Classics class with an instructor.',
  array['2-hour exclusive studio use', 'One private 50–60 min class (Mat Pilates, Yoga, Barre or Strength)', 'Up to 10 guests'],
  array['Additional guest: ₱450/person', 'Does not include event styling, decorations, furniture or catering'],
  false, null, false, 310),

('studio-restore-experience', 'Studio + Restore Experience', 'studio_rental', 'special_offer', 'recovery-restore',
  1350000, null, null, 'Booking must be made within 30 days of purchase', 30, 'purchase',
  'Exclusive studio access plus one private thermal Restore class with an instructor.',
  array['2-hour exclusive studio use', 'One private 50–60 min heated or infrared class', 'Up to 10 guests'],
  array['Additional guest: ₱650/person', 'Does not include event styling, decorations, furniture or catering'],
  false, null, false, 320);

alter table public.packages enable row level security;

create policy "packages_select_public" on public.packages for select
  to anon, authenticated using (is_active = true);
create policy "packages_select_admin" on public.packages for select
  to authenticated using (public.is_admin());
create policy "packages_write_admin" on public.packages for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- =========================================================================
-- 6. payment_settings, purchases, payment_receipts, customer_packages
-- =========================================================================

create table public.payment_settings (
  id uuid primary key default gen_random_uuid(),
  is_active boolean not null default true,
  method public.payment_method not null,
  label text not null,
  account_name text,
  account_number text,
  bank_name text,
  qr_image_url text,
  instructions text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Empty at launch — no real bank/QR details exist anywhere in this repo.
-- Admin fills these in via /admin/settings/payments once the client
-- provides them. Never fabricate placeholder bank details here.

create trigger payment_settings_set_updated_at
  before update on public.payment_settings
  for each row execute function public.set_updated_at();

alter table public.payment_settings enable row level security;

-- Deliberately no `anon` policy — bank details are shown to signed-in
-- customers during checkout, not to unauthenticated crawlers.
create policy "payment_settings_select_authenticated" on public.payment_settings for select
  to authenticated using (is_active = true or public.is_admin());
create policy "payment_settings_write_admin" on public.payment_settings for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  package_id uuid not null references public.packages (id) on delete restrict,
  package_name_snapshot text not null,
  price_centavos_snapshot integer not null check (price_centavos_snapshot >= 0),
  credit_count_snapshot integer,
  reference_number text not null unique,
  subtotal_centavos integer not null check (subtotal_centavos >= 0),
  total_amount_centavos integer not null check (total_amount_centavos >= 0),
  currency text not null default 'PHP',
  payment_method public.payment_method not null default 'bank_transfer',
  payment_provider text not null default 'manual_bank_transfer',
  provider_payment_id text,
  purchase_status public.purchase_status not null default 'pending_payment',
  receipt_url text,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  rejected_by uuid references public.profiles (id),
  rejected_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index purchases_user_idx on public.purchases (user_id, created_at desc);
create index purchases_package_idx on public.purchases (package_id);
create index purchases_status_idx on public.purchases (purchase_status);
create unique index purchases_provider_payment_idx
  on public.purchases (provider_payment_id) where provider_payment_id is not null;

create trigger purchases_set_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

-- DB-level state machine guard: even a raw UPDATE bypassing approve_purchase()
-- below cannot skip a state (e.g. rejected -> approved).
create or replace function public.enforce_purchase_status_transition()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'UPDATE' and old.purchase_status is distinct from new.purchase_status then
    if not (
      (old.purchase_status = 'pending_payment' and new.purchase_status in ('proof_submitted', 'cancelled', 'expired')) or
      (old.purchase_status = 'proof_submitted' and new.purchase_status in ('approved', 'rejected'))
    ) then
      raise exception 'illegal purchase_status transition: % -> %', old.purchase_status, new.purchase_status;
    end if;
  end if;
  return new;
end;
$$;

create trigger purchases_status_transition
  before update on public.purchases
  for each row execute function public.enforce_purchase_status_transition();

alter table public.purchases enable row level security;

create policy "purchases_select_own_or_admin" on public.purchases for select
  to authenticated using (user_id = auth.uid() or public.is_admin());

-- Customers may only ever create a purchase in the initial pending state —
-- never insert directly as 'approved'.
create policy "purchases_insert_own_pending" on public.purchases for insert
  to authenticated with check (user_id = auth.uid() and purchase_status = 'pending_payment');

-- Customers may only flip pending_payment -> proof_submitted (the "I Have
-- Paid" action) on their own row. Every other transition (approve/reject)
-- requires admin and goes through approve_purchase()/reject_purchase() so it
-- stays atomic with issuing credits / writing the audit log.
create policy "purchases_update_own_mark_paid" on public.purchases for update
  to authenticated
  using (user_id = auth.uid() and purchase_status = 'pending_payment')
  with check (user_id = auth.uid() and purchase_status = 'proof_submitted');

create policy "purchases_update_admin" on public.purchases for update
  to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size_bytes integer not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  uploaded_at timestamptz not null default now()
);

create index payment_receipts_purchase_idx on public.payment_receipts (purchase_id);
create index payment_receipts_user_idx on public.payment_receipts (user_id);

alter table public.payment_receipts enable row level security;

create policy "receipts_select_own_or_admin" on public.payment_receipts for select
  to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "receipts_insert_own" on public.payment_receipts for insert
  to authenticated with check (user_id = auth.uid());
create policy "receipts_delete_admin" on public.payment_receipts for delete
  to authenticated using (public.is_admin());
-- No update policy: a receipt is immutable once uploaded; re-uploads insert a new row.

create table public.customer_packages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  purchase_id uuid not null unique references public.purchases (id) on delete restrict,
  package_id uuid not null references public.packages (id) on delete restrict,
  package_name_snapshot text not null,
  credit_count integer not null check (credit_count > 0),
  remaining_credits integer not null check (remaining_credits >= 0 and remaining_credits <= credit_count),
  status text not null default 'active' check (status in ('active', 'exhausted', 'expired', 'revoked')),
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_packages_user_idx on public.customer_packages (user_id, status);
create index customer_packages_purchase_idx on public.customer_packages (purchase_id);
create index customer_packages_expires_idx on public.customer_packages (expires_at) where status = 'active';

create trigger customer_packages_set_updated_at
  before update on public.customer_packages
  for each row execute function public.set_updated_at();

alter table public.customer_packages enable row level security;

create policy "customer_packages_select_own_or_admin" on public.customer_packages for select
  to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "customer_packages_write_admin" on public.customer_packages for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
-- No customer write policy at all: credits are issued by approve_purchase()
-- and decremented by book_class_session() — both SECURITY DEFINER RPCs —
-- never a direct client insert/update, because "check balance, then
-- decrement" must be one atomic, row-locked transaction.

-- Idempotent approval: the guard is `UPDATE ... WHERE purchase_status =
-- 'proof_submitted'`. Under READ COMMITTED, a second concurrent call (two
-- admins racing, or a double-click) re-evaluates this WHERE clause against
-- the now-committed row and matches zero rows — it takes the
-- already_processed branch instead of granting a second set of credits.
create or replace function public.approve_purchase(p_purchase_id uuid)
returns table (purchase_id uuid, customer_package_id uuid, already_processed boolean)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_purchase public.purchases;
  v_package public.packages;
  v_credit_count integer;
  v_customer_package_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may approve purchases';
  end if;

  update public.purchases
     set purchase_status = 'approved', approved_by = auth.uid(), approved_at = now(), updated_at = now()
   where id = p_purchase_id and purchase_status = 'proof_submitted'
  returning * into v_purchase;

  if not found then
    select * into v_purchase from public.purchases where id = p_purchase_id;
    if v_purchase.id is null then
      raise exception 'purchase % not found', p_purchase_id;
    end if;
    if v_purchase.purchase_status = 'approved' then
      select id into v_customer_package_id from public.customer_packages where purchase_id = p_purchase_id;
      return query select v_purchase.id, v_customer_package_id, true;
      return;
    end if;
    raise exception 'purchase % is not awaiting approval (status: %)', p_purchase_id, v_purchase.purchase_status;
  end if;

  select * into v_package from public.packages where id = v_purchase.package_id;
  v_credit_count := coalesce(v_package.credit_count, 1); -- studio_rental products get a single "use"

  insert into public.customer_packages
    (user_id, purchase_id, package_id, package_name_snapshot, credit_count, remaining_credits,
     status, activated_at, expires_at)
  values (
    v_purchase.user_id, v_purchase.id, v_purchase.package_id, v_purchase.package_name_snapshot,
    v_credit_count, v_credit_count, 'active',
    case when v_package.expires_from = 'purchase' then now() else null end,
    case when v_package.expires_from = 'purchase' and v_package.validity_days is not null
         then now() + (v_package.validity_days || ' days')::interval
         else null end
  )
  returning id into v_customer_package_id;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'admin', 'purchase.approved', 'purchase', v_purchase.id,
          jsonb_build_object('customer_package_id', v_customer_package_id,
                              'reference_number', v_purchase.reference_number));

  return query select v_purchase.id, v_customer_package_id, false;
end;
$$;

create or replace function public.reject_purchase(p_purchase_id uuid, p_reason text default null)
returns table (purchase_id uuid, already_processed boolean)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_purchase public.purchases;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admin/super_admin may reject purchases';
  end if;

  update public.purchases
     set purchase_status = 'rejected', rejected_by = auth.uid(), rejected_at = now(),
         rejected_reason = p_reason, updated_at = now()
   where id = p_purchase_id and purchase_status = 'proof_submitted'
  returning * into v_purchase;

  if not found then
    select * into v_purchase from public.purchases where id = p_purchase_id;
    if v_purchase.id is null then
      raise exception 'purchase % not found', p_purchase_id;
    end if;
    if v_purchase.purchase_status = 'rejected' then
      return query select v_purchase.id, true;
      return;
    end if;
    raise exception 'purchase % is not awaiting approval (status: %)', p_purchase_id, v_purchase.purchase_status;
  end if;

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'admin', 'purchase.rejected', 'purchase', v_purchase.id,
          jsonb_build_object('reference_number', v_purchase.reference_number, 'reason', p_reason));

  return query select v_purchase.id, false;
end;
$$;

revoke execute on function public.approve_purchase(uuid) from public;
revoke execute on function public.reject_purchase(uuid, text) from public;
grant execute on function public.approve_purchase(uuid) to authenticated;
grant execute on function public.reject_purchase(uuid, text) to authenticated;

-- =========================================================================
-- 7. class_bookings (new, credit-based — the existing public.bookings table
--    is untouched and keeps serving the anonymous /api/book flow)
-- =========================================================================

create table public.class_bookings (
  id uuid primary key default gen_random_uuid(),
  class_session_id uuid not null references public.class_sessions (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  customer_package_id uuid not null references public.customer_packages (id) on delete restrict,
  status public.class_booking_status not null default 'booked',
  credits_used integer not null default 1 check (credits_used > 0),
  booked_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index class_bookings_one_active_per_session
  on public.class_bookings (class_session_id, user_id) where status = 'booked';
create index class_bookings_user_idx on public.class_bookings (user_id);
create index class_bookings_session_idx on public.class_bookings (class_session_id);

create trigger class_bookings_set_updated_at
  before update on public.class_bookings
  for each row execute function public.set_updated_at();

alter table public.class_bookings enable row level security;

create policy "class_bookings_select_own_or_admin" on public.class_bookings for select
  to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "class_bookings_write_admin" on public.class_bookings for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
-- No customer insert/update policy: bookings are only ever created via
-- book_class_session() (atomic with credit deduction) and cancelled via
-- cancel_class_booking() below — never a direct client insert/update.

-- The atomic credit-deduct + capacity-check + booking-insert function.
-- Identity is derived from auth.uid() INTERNALLY (not a p_user_id param) —
-- this is what makes it safe to grant directly to `authenticated` rather
-- than requiring the service-role key, matching the pattern used by
-- approve_purchase()/admin_cancel_class_booking() elsewhere in this file.
create or replace function public.book_class_session(
  p_class_session_id uuid,
  p_customer_package_id uuid
) returns table (booking_id uuid, remaining_credits integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking_id uuid;
  v_remaining integer;
  v_pkg public.customer_packages;
  v_new_booked_count integer;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0000';
  end if;

  -- Fixed lock order (package, then session) on every call path — prevents
  -- deadlocks between two concurrent bookings touching the same
  -- package/session pair in reverse order.
  select * into v_pkg from public.customer_packages
    where id = p_customer_package_id and user_id = v_user_id
    for update;
  if not found then
    raise exception 'PACKAGE_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_pkg.status <> 'active' then
    raise exception 'PACKAGE_EXHAUSTED' using errcode = 'P0003';
  end if;
  if v_pkg.expires_at is not null and v_pkg.expires_at <= now() then
    update public.customer_packages set status = 'expired' where id = p_customer_package_id;
    raise exception 'PACKAGE_EXPIRED' using errcode = 'P0002';
  end if;
  if v_pkg.remaining_credits <= 0 then
    raise exception 'PACKAGE_EXHAUSTED' using errcode = 'P0003';
  end if;

  perform 1 from public.class_sessions where id = p_class_session_id and status = 'scheduled' for update;
  if not found then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0004';
  end if;

  if exists (
    select 1 from public.class_bookings
    where class_session_id = p_class_session_id and user_id = v_user_id and status = 'booked'
  ) then
    raise exception 'ALREADY_BOOKED' using errcode = 'P0005';
  end if;

  -- Concurrency-safe backstop #1 — the guarded UPDATE, not the FOR UPDATE
  -- lock above, is what actually prevents double-spend.
  update public.customer_packages
     set remaining_credits = remaining_credits - 1,
         status = case when remaining_credits - 1 = 0 then 'exhausted' else status end,
         activated_at = coalesce(activated_at, now()),
         expires_at = case
           when expires_at is null and activated_at is null then
             (select now() + (validity_days || ' days')::interval
              from public.packages where id = v_pkg.package_id and validity_days is not null)
           else expires_at
         end,
         updated_at = now()
   where id = p_customer_package_id and remaining_credits > 0 and status = 'active'
  returning remaining_credits into v_remaining;

  if v_remaining is null then
    raise exception 'PACKAGE_EXHAUSTED' using errcode = 'P0003';
  end if;

  -- Concurrency-safe backstop #2 — prevents overbooking regardless of lock
  -- bugs; the booked_count <= capacity CHECK constraint is backstop #3.
  update public.class_sessions
     set booked_count = booked_count + 1
   where id = p_class_session_id and booked_count < capacity
  returning booked_count into v_new_booked_count;
  if not found then
    raise exception 'SESSION_FULL' using errcode = 'P0006';
  end if;

  insert into public.class_bookings (class_session_id, user_id, customer_package_id, status, credits_used)
  values (p_class_session_id, v_user_id, p_customer_package_id, 'booked', 1)
  returning id into v_booking_id;

  return query select v_booking_id, v_remaining;
end;
$$;

revoke execute on function public.book_class_session(uuid, uuid) from public;
grant execute on function public.book_class_session(uuid, uuid) to authenticated;

-- Cancellation restores the credit and frees the session slot atomically.
-- Same auth.uid()-derived-identity pattern as book_class_session() above —
-- a customer can only ever cancel their OWN booking.
create or replace function public.cancel_class_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.class_bookings;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0000';
  end if;

  select cb.* into v_booking from public.class_bookings cb
    join public.class_sessions cs on cs.id = cb.class_session_id
    where cb.id = p_booking_id and cb.user_id = v_user_id and cb.status = 'booked'
    for update of cb;
  if not found then
    raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0007';
  end if;

  if exists (
    select 1 from public.class_sessions where id = v_booking.class_session_id and start_at <= now()
  ) then
    raise exception 'SESSION_ALREADY_STARTED' using errcode = 'P0008';
  end if;

  update public.class_bookings
     set status = 'cancelled', cancelled_at = now(), updated_at = now()
   where id = p_booking_id;

  update public.customer_packages
     set remaining_credits = remaining_credits + v_booking.credits_used,
         status = case when status = 'exhausted' then 'active' else status end,
         updated_at = now()
   where id = v_booking.customer_package_id;

  update public.class_sessions
     set booked_count = greatest(booked_count - 1, 0)
   where id = v_booking.class_session_id;
end;
$$;

revoke execute on function public.cancel_class_booking(uuid) from public;
grant execute on function public.cancel_class_booking(uuid) to authenticated;

-- =========================================================================
-- 8. webhook_events (future PayMongo — no fake success ever written here)
-- =========================================================================

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paymongo',
  event_type text not null,
  event_id text not null,
  payload jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  error text,
  received_at timestamptz not null default now(),
  constraint webhook_events_provider_event_unique unique (provider, event_id)
);

create index webhook_events_processed_idx on public.webhook_events (processed, received_at);

alter table public.webhook_events enable row level security;
-- Zero policies — same "service-role only" pattern as the pre-existing
-- public.bookings table. Only the future webhook route handler touches this.

-- =========================================================================
-- 9. Storage bucket + policies for payment receipts
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do nothing;

-- Path convention: payment-receipts/<user_id>/<purchase_id>/<uuid>.<ext> —
-- storage.foldername(name)[1] = the user_id segment, which is what makes
-- per-user isolation work below.
create policy "receipt_files_insert_own_folder" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'payment-receipts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "receipt_files_select_own_or_admin" on storage.objects for select
  to authenticated
  using (bucket_id = 'payment-receipts'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- =========================================================================
-- Manual RLS verification runbook (run in the Supabase SQL editor once this
-- migration is applied — not automated, since no live project exists yet).
-- =========================================================================
--
-- -- As an anonymous visitor: should return only is_active packages/classes.
-- set local role anon;
-- select slug from public.packages;              -- all active rows
-- select * from public.purchases;                 -- 0 rows (RLS denies, no error)
--
-- -- As a specific authenticated customer (replace with a real auth.users id):
-- set local role authenticated;
-- set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001"}';
-- select * from public.purchases;                 -- only that user's own rows
-- select * from public.customer_packages;         -- only that user's own rows
-- update public.profiles set role = 'admin' where id = auth.uid();  -- must FAIL (role column not grantable)
--
-- -- As an admin:
-- set local request.jwt.claims = '{"sub":"<an-admin-uuid>"}';
-- select * from public.purchases;                 -- all rows, every customer
