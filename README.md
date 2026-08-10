# Veora Wellness

A production-ready marketing, package-purchase and member booking system for Veora Wellness, built with Next.js App Router, TypeScript, Tailwind CSS, Supabase and Resend. Customers create an account, purchase a package, and use their credits to reserve a scheduled class with a specific time and coach.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See `.env.example` for the complete list:

- **Email (Resend)** — set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `BOOKING_NOTIFICATION_EMAIL` and the owner notification addresses for transactional mail.
- **Supabase** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` power authentication, packages, payments, schedules and bookings. Apply the migrations in `supabase/migrations/` in order.
- **SMS (Semaphore)** — set the server-only `SEMAPHORE_API_KEY` and an approved `SEMAPHORE_SENDER_NAME` to send booking and class-status texts. If either value is missing, SMS is safely skipped and email remains the fallback. Never expose the key with a `NEXT_PUBLIC_` prefix.

Semaphore transactional messages do not configure Supabase Auth phone verification by themselves. Customer/admin SMS verification stays disabled until a supported Supabase phone provider or custom Send SMS hook is configured and tested.

## Editing content

All studio-specific content lives in `src/data/`:

- `site.ts` — brand name, contact information, navigation and booking CTA wording.
- `services.ts` — the six class categories shown across the homepage and `/services`.
- `schedule.ts` — the class directory shown on `/schedule`; live dates, times, coaches and availability come from Supabase sessions.
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

Manually verify: public Book CTA → sign in/create account → package-backed member schedule → select a dated time and coach → confirm → booking appears in the admin dashboard/calendar and customer account. Also verify closed/full sessions cannot be booked and email/SMS notifications arrive when configured.
