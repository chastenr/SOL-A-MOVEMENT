# Spacio BLNC → Veora Wellness — Content Migration Report

This documents the migration of real business information from the source business (operating today as **SPACIO BLNC**, at spacioblnc.com) into the existing Veora Wellness website. The design, layout, component architecture, animation system and booking flow already in this repository were **not** rebuilt — only business content and the additions explicitly requested (Pricing, Locations, package-aware booking, motion polish) were added on top of them. See `NEEDS_CLIENT_CONFIRMATION.md` for anything that could not be verified.

## Source URLs Audited

spacioblnc.com is a client-rendered app — its HTML has no visible content; everything loads from `https://customer-api.rezerv.co/v1/*`. Every page discovered via its own `sitemap.xml`/`pages-sitemap.xml` was inspected, along with the underlying API endpoints that actually supply each page's data:

- `/home` — hero, "why us" and studio-experience content, footer
- `/class` — full class catalog (14 Classics + 28 Restore + 5 Ballet classes, with real descriptions/durations/levels)
- `/package` — full pricing catalog (Founding Member, Classics, Restore, Ballet, Studio Rentals)
- `/location` — studio address, geo coordinates, phone, email
- `/contact-us` — contact channel
- `/team` — instructor roster (found empty)
- `/timetable` — class schedule (found empty — no live timetable published)
- `/membership` — recurring memberships (found empty)
- `/course`, `/appointment` — found empty
- `faq` endpoint — 8 topics, ~24 published Q&As
- `legal` endpoint — General Terms & Conditions, Studio Rental Terms & Conditions
- `business` / `staff` / `schedule` endpoints — re-checked for freshness immediately before implementation; all confirmed unchanged

## Business Information Migrated

- **Description/positioning:** "a premium boutique movement and wellness studio offering Pilates, yoga, barre, ballet and specialty heated and infrared recovery classes. We believe movement should be accessible, intentional and enjoyable for every body" — rebranded from SPACIO BLNC to Veora, used on the homepage, About and site metadata.
- **Address:** 2nd Floor, EMRADEE Building, Daang Hari Road, Molino IV, Bacoor, Cavite, 4102, Philippines.
- **Phone/mobile:** +63 917 319 4772.
- **Geo coordinates:** 14.4108087, 120.9503414 (used in structured data and the `/locations` map link).
- **Email:** local part `hello@` preserved from the source; domain adapted to the Veora placeholder domain (see `NEEDS_CLIENT_CONFIRMATION.md`).
- **Social:** real, active Instagram and Facebook (`@spacioblnc`) — linked as-is pending the client's rename/replace decision.
- **Cancellation window:** 12 hours before class (confirmed in both the business record and the FAQ).
- **Data architecture:** contact/address/hours now live in `src/data/locations.ts` as the single source of truth (multi-branch-ready); `src/data/site.ts` derives its `contact` block from the active location instead of duplicating it.

## Services Migrated

Replaced all placeholder services (Reformer Pilates, Mat Pilates, Yoga Flow, Mobility & Stretch, Private Sessions, Wellness Sessions) with the real offerings in `src/data/services.ts`:

- **Mat Pilates** — real description, 50 min, open to all
- **Yoga** — umbrella of 8 real styles (Hatha, Vinyasa, Power, Ashtanga, Restorative, Gentle Flow, Stretch, Yogalates)
- **Barre** — real description, 50 min
- **Strength & HIIT** — umbrella of Mat Strength, Mat Sculpt, Functional Group Exercise, HIIT
- **Recovery & Restore** — heated/infrared and red-light thermal versions of the above
- **Ballet** — 5 real age-graded tiers (3–5, 6–8, 9–12, 13–17, 18+)

Removed: "Reformer Pilates" (no reformer machines exist) and "Private Sessions" (not offered standalone — only via Studio Rental). `/schedule` now shows the real 19-class directory (with category filters) instead of a fabricated weekly timetable, since none is published yet.

## Pricing Migrated

All pricing is real, sourced from the live booking platform, and centralized in `src/data/pricing.ts`. Nothing is rounded, converted from ₱, or given an invented discount.

- **Founding Member Offers** (current pre-opening promotion, 8 options): CLASSIC Intro Pass ₱599, CLASSIC Unlimited Week ₱2,500, CLASSIC Unlimited Month ₱9,500, CLASSIC Unlimited Quarter ₱25,000, CLASSIC Consistency (20-class) ₱14,000, RESTORE Unlimited Week ₱4,500, RESTORE Elevate (20-class) ₱19,000, Ballet 12-Week Term ₱10,500.
- **Single Sessions** (standard rate): CLASSIC Intro Pass ₱850, RESTORE Calm ₱1,500, Ballet Trial ₱1,000.
- **Class Packs** (standard rate, 8 options): CLASSIC Discovery (4) ₱3,200, Foundation (8) ₱6,200, Lifestyle (10) ₱7,500; RESTORE Balance (4) ₱5,400, Recovery (8) ₱9,600, Thrive (10) ₱11,000; Ballet Starter (4) ₱3,800, Ballet 12-Week Term ₱11,000.
- **Studio Rentals** (3 options): Studio Rental (no instructor) ₱6,500, Studio + Classics Experience ₱10,000, Studio + Restore Experience ₱13,500 — each with real guest caps, per-extra-guest fees and decoration/cleanup terms.
- **Memberships and standalone private sessions:** none published — sections omitted from `/pricing` rather than shown empty.

New `/pricing` page added and linked in the primary navigation. Every pricing card routes into the existing booking flow (`/book?package=<slug>`, plus `&service=<slug>` when the package maps to exactly one bookable service) rather than any checkout — no payment gateway was added anywhere.

## Team Migrated

None. The source platform's staff roster is empty. `src/data/team.ts` is scaffolded (typed, ready to populate) and `/about`'s founder section keeps its bracketed placeholder rather than inventing a name, bio or credentials.

## Policies Migrated

Both published legal documents, rebranded and reproduced in full on a new `/policies` page (`src/data/policies.ts`):

- **General Terms & Conditions** — bookings, class minimums, late arrival, membership/package terms, studio etiquette, personal belongings, health & safety, photography/privacy, right to refuse service, amendments.
- **Studio Rental Terms & Conditions** — rental scope, 30-day booking validity, reservation/availability, guest limits, decoration rules, clean-up responsibilities, damage liability, right to refuse service.

The full FAQ (8 topics, ~24 questions) was also migrated to a new `/faq` page (`src/data/faq.ts`), footer-linked.

## Removed Placeholders

- Old brand names: SOLÉA, SOLÉA Movement & Wellness, and any residual CTRL+FLOW reference (repo-wide grep confirms none remain outside intentional migration-provenance comments).
- Fake services: Reformer Pilates, Private Sessions, Mobility & Stretch, Wellness Sessions (as distinct offerings), Yoga Flow (renamed/merged into the real "Yoga" umbrella).
- Fabricated weekly class schedule with placeholder instructor names and spot counts.
- The "Loved by the Veora community" star-rating banner — the studio hasn't launched and has zero reviews; replaced with an honest "Opening soon in Bacoor, Cavite."
- Generic/example contact values (`owner@example.com`, `555-` phone numbers, `example.com`) — none exist in customer-facing content; only the intentional `.env.example` template and the `NEXT_PUBLIC_SITE_URL` placeholder fallback remain, both clearly documented as pending the client's real domain.

## Motion / Design Additions

Design, typography, color system, layout and the booking architecture were preserved as-is. Added on top, per the request:

- Shared motion utilities (`src/lib/motion.ts`): reusable variants (`fadeUp`, `fadeIn`, `scaleReveal`, `slideLeft`, `slideRight`, stagger helpers) and a single `usePointerCapability()` hook gating every pointer-tracked effect behind hover-capable + fine-pointer + no-reduced-motion.
- `TiltCard` — subtle 3–6° pointer-tracked 3D tilt with a soft light glare, applied to service cards, class-directory cards, pricing cards and location cards.
- `RevealHeading` — masked line-by-line reveal, applied to the hero headline.
- Hero background now responds to pointer position with a very small (≤2°, ≤6px) depth shift.
- `Button` gained an opt-in `magnetic` prop (pointer-follow nudge, spring-smoothed) — used only on the Navbar and Hero primary CTAs, not globally.
- Navbar gained an animated active-link underline (shared-layout transition) and a small `DecorativeBlob` (pure CSS, warm-toned, respects reduced motion) is available for ambient depth.
- Everything above degrades to the plain, static presentation on touch devices and when `prefers-reduced-motion: reduce` is set.

## What Was Not Done

- No payment gateway, checkout, cart or card collection was added anywhere, including on the new `/pricing` page — every price is informational and every CTA routes into the existing no-payment booking flow.
- No fake reviews, ratings, review counts, instructor names, certifications or business hours were invented.
- No redesign of the existing page layouts, navbar structure, card system or color palette — only the additions explicitly requested.

## Needs Client Confirmation

See `NEEDS_CLIENT_CONFIRMATION.md` for the full list (domain/email, social account ownership, business hours, live timetable, Founding Member promo end date, a source data inconsistency in one package's validity period, the FAQ's "Dance" mention vs. the real catalog, and legal review of the migrated Terms & Conditions).
