# Veora Wellness

A production-ready marketing and booking site for Veora Wellness, built with Next.js (App Router), TypeScript, Tailwind CSS and Framer Motion. There is no checkout, cart or payment flow anywhere on the site — the booking flow collects a session request and emails it to the studio owner and the client.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See `.env.example`. Everything is optional except what you intend to use:

- **Email (Resend)** — set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `OWNER_BOOKING_EMAIL` to send real booking/contact emails. Without these, the booking and contact flows still work end-to-end (validation, success screens) but emails are silently skipped.
- **Supabase** — set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to persist bookings and enforce double-booking protection. Run `supabase/schema.sql` in the Supabase SQL editor first. Without these, booking storage and the availability check are skipped.

## Editing content

All studio-specific content lives in `src/data/`:

- `site.ts` — brand name, real contact info, nav, booking CTA wording, time slots. Business hours are intentionally empty (`hours: []`) because the studio hasn't published them yet — see `hoursNote`.
- `services.ts` — the six real class categories (Mat Pilates, Yoga, Barre, Strength & HIIT, Recovery & Restore, Ballet) shown across the homepage, `/services` and the booking flow.
- `schedule.ts` — the real class directory shown on `/schedule`. There is no live weekly timetable yet (no confirmed dates/times/instructors), so this lists class types rather than fabricated recurring sessions.
- `faq.ts` / `policies.ts` — real FAQ and Terms & Conditions content, shown on `/faq` and `/policies` (footer-linked).
- `images.ts` — image sources for every section (see licensing below).

Fields still marked with bracketed placeholders (founder name/photo/bio on `/about`) reflect information the studio hasn't provided yet — replace them once available. See the migration report from the Veora content-migration task for a full list of what's real vs. still pending confirmation.

## Images

Most photography is sourced from Unsplash (editorial license, free to use) and Wikimedia Commons (CC BY-SA 4.0). One real photo of the studio's actual class floor is hotlinked from the studio's own ImageKit CDN account — this should be downloaded and self-hosted (e.g. in `public/`) rather than hotlinked long-term. Attribution for the Wikimedia Commons image used:

- Barre photo — Radhika Karle, CC BY-SA 4.0, via Wikimedia Commons.

The studio has not yet uploaded real photography for individual classes (its own site currently shows auto-generated text-on-color placeholder cards for each class), so class-specific imagery here remains curated stock photography until real photos are provided.

## QA checklist

```bash
npm run lint
npm run typecheck
npm run build
```

Manually verify: full booking flow (Home → Book → Service → Date/Time → Details → Confirm → Success), that no payment step exists anywhere, that past/closed dates are disabled on the calendar, and that booking/contact emails arrive when Resend is configured.
