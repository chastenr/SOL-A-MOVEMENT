# SOLÉA Movement & Wellness

A production-ready marketing and booking site for SOLÉA Movement & Wellness, built with Next.js (App Router), TypeScript, Tailwind CSS and Framer Motion. There is no checkout, cart or payment flow anywhere on the site — the booking flow collects a session request and emails it to the studio owner and the client.

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

- `site.ts` — brand name, contact info, hours, nav, booking CTA wording, time slots.
- `services.ts` — the six services shown across the homepage, `/services` and the booking flow.
- `schedule.ts` — the recurring weekly class templates shown on `/schedule`.
- `images.ts` — image sources for every section (see licensing below).

Fields prefixed `TODO` (address, phone, email, instructor names, founder bio) are placeholders — replace them with real studio information before launch.

## Images

Photography is sourced from Unsplash (editorial license, free to use) and Wikimedia Commons (CC BY-SA 4.0). Attribution for the two Commons images:

- Reformer Pilates photo — Radhika Karle, CC BY-SA 4.0, via Wikimedia Commons.
- Private Sessions photo — Helderoliveira, CC BY-SA 4.0, via Wikimedia Commons.

Swap in real studio photography before launch — placeholders are for demonstration only.

## QA checklist

```bash
npm run lint
npm run typecheck
npm run build
```

Manually verify: full booking flow (Home → Book → Service → Date/Time → Details → Confirm → Success), that no payment step exists anywhere, that past/closed dates are disabled on the calendar, and that booking/contact emails arrive when Resend is configured.
