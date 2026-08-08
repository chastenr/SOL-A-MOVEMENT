-- Veora Wellness — services catalog (the 6 top-level classes shown on
-- /services and the homepage). Additive migration, run after 0001.
--
-- This is distinct from public.class_types (the 19 granular class variants
-- like "Vinyasa Yoga" or "HIIT" used for real scheduling) — `services` is
-- the marketing-facing catalog: what shows on /services, the homepage
-- "Our Classes" section, and the booking flow's service picker. Both tables
-- share the same `service_slug` enum from 0001 so they stay in sync if a
-- 7th service is ever added.

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug public.service_slug not null unique,
  name text not null,
  category text not null,
  short_description text not null,
  description text not null,
  duration text not null,
  level text not null,
  instructor text,
  -- Real, informational pricing shown alongside the service — no online
  -- payment is collected here; kept as free text to match the display
  -- strings already published (e.g. "₱850 for a single class").
  starting_price text,
  class_variants text[] not null default '{}',
  image_src text not null,
  image_alt text not null,
  image_credit text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_active_sort_idx on public.services (is_active, sort_order);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- Seed: the real 6 services from src/data/services.ts, migrated verbatim.
insert into public.services
  (slug, name, category, short_description, description, duration, level, instructor,
   starting_price, class_variants, image_src, image_alt, sort_order)
values
('mat-pilates', 'Mat Pilates', 'Mat Pilates',
  'Strengthen your core, improve balance and enhance flexibility on the mat.',
  'Move with intention in our Mat Pilates classes, where you''ll strengthen your core, improve balance and enhance flexibility. Every session is led by experienced instructors and designed to help you build strength with confidence, precision and personalized guidance.',
  '50 min', 'Open to all', null, '₱850 for a single class', '{}',
  'https://images.pexels.com/photos/36541468/pexels-photo-36541468.jpeg',
  'A woman seated in a calm, cross-legged pose, viewed from above, in Taytay, Philippines',
  10),

('yoga', 'Yoga', 'Yoga',
  'Breath-led movement, from energizing flows to gentle, restorative practice.',
  'From energizing Vinyasa and Power Yoga to gentle Hatha, Restorative, Gentle Flow, Stretch Yoga and Yogalates, our yoga classes build flexibility, balance and mindful breath at whatever pace suits you.',
  '50 min', 'Open to all', null, '₱850 for a single class',
  array['Hatha', 'Vinyasa Yoga', 'Power Yoga', 'Ashtanga', 'Restorative Yoga', 'Gentle Flow Yoga', 'Stretch Yoga', 'Yogalates'],
  'https://images.pexels.com/photos/9154500/pexels-photo-9154500.jpeg',
  'Silhouette of a woman in a graceful yoga pose on the beach at sunset in Dauin, Philippines',
  20),

('barre', 'Barre', 'Barre',
  'Low-impact, ballet-inspired movement for posture and endurance.',
  'Improve posture, balance and muscle endurance through low-impact movements inspired by ballet — a full-body sculpting class suited to every level.',
  '50 min', 'Open to all', null, '₱850 for a single class', '{}',
  'https://images.pexels.com/photos/36541467/pexels-photo-36541467.jpeg',
  'A dancer reaches gracefully to the side during an open-air stretch in Taytay, Philippines',
  30),

('strength-hiit', 'Strength & HIIT', 'Strength & HIIT',
  'Functional strength, sculpt and cardio conditioning classes.',
  'Build functional strength, tone and cardiovascular fitness through Mat Strength, Mat Sculpt, Functional Group Exercise and HIIT — guided, full-body sessions for every fitness level.',
  '50 min', 'Open to all', null, '₱850 for a single class',
  array['Mat Strength', 'Mat Sculpt', 'Functional Group Exercise', 'HIIT'],
  'https://images.pexels.com/photos/36541458/pexels-photo-36541458.jpeg',
  'An athlete stretches his leg during a strength warm-up on an outdoor track in Taytay, Philippines',
  40),

('recovery-restore', 'Recovery & Restore', 'Recovery & Restore',
  'Infrared-heated and red light therapy recovery classes.',
  'Our Restore classes bring the heat. Choose from infrared-heated versions of our signature Pilates, yoga, barre and strength classes, or red light therapy sessions designed to support circulation, recovery and deep relaxation.',
  '50 min', 'Open to all', null, '₱1,500 for a single class', '{}',
  'https://images.pexels.com/photos/36541460/pexels-photo-36541460.jpeg',
  'A woman stretches her arm across her chest during an outdoor recovery session in Taytay, Philippines',
  50),

('ballet', 'Ballet', 'Ballet',
  'Classical ballet training for every age, from 3 through adult.',
  'Structured ballet training for every age — from playful, play-based first steps at 3–5 years old through disciplined technique for teens and adults — building posture, coordination, artistry and confidence.',
  '60–90 min, varies by age group', 'Beginner-friendly, all ages', null, '₱1,000 trial class',
  array['Little Swans Ballet (3–5 yrs)', 'Tiny Stars Ballet (6–8 yrs)', 'Rising Stars Ballet (9–12 yrs)', 'Prima Ballet (13–17 yrs)', 'Adult Ballet (18+)'],
  'https://images.pexels.com/photos/9155440/pexels-photo-9155440.jpeg',
  'Silhouette of a dancer in an extended, arabesque-like pose on a Philippine beach at sunset',
  60);

alter table public.services enable row level security;

create policy "services_select_public" on public.services for select
  to anon, authenticated using (is_active = true);
create policy "services_select_admin" on public.services for select
  to authenticated using (public.is_admin());
create policy "services_write_admin" on public.services for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
