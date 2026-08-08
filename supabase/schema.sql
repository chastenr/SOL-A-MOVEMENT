-- Veora Wellness — booking storage
-- Run this in the Supabase SQL editor. Optional: the site works via email
-- alone if this table is never created and Supabase env vars are left unset.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  service_slug text not null,
  session_date date not null,
  session_time text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint bookings_unique_slot unique (service_slug, session_date, session_time)
);

create index if not exists bookings_session_lookup
  on public.bookings (service_slug, session_date, session_time);

-- Row Level Security stays on with no policies: only the service role key
-- (used exclusively by server-side API routes) can read or write bookings.
alter table public.bookings enable row level security;
