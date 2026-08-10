# Needs Client Confirmation

Items below could not be verified from the source business (spacioblnc.com) or its underlying booking platform, or exist in a form that needs an explicit decision before launch. Nothing in this list has been fabricated or guessed on the live site — see `SPACIO_TO_VEORA_MIGRATION.md` for what *was* migrated.

## Business identity

- **Website domain.** The public booking address is confirmed as `biance.bookings@veorawellnessph.com`, but `NEXT_PUBLIC_SITE_URL` still needs to match the final production website URL.
- **Social media accounts.** The footer and structured data currently link to the real, active `instagram.com/spacioblnc` and `facebook.com/spacioblnc` accounts — the only real accounts that exist. Decide whether these accounts will be renamed to Veora or replaced with new ones, and update `src/data/site.ts` (`social.instagram`, `social.facebook`) accordingly. Do not point to a guessed `@veorawellness` handle until one actually exists.
- **No TikTok, Threads, YouTube or WhatsApp Business account** were found on the source site or its business record (`whatsAppNumber` is explicitly `null` in the source data). The studio's mobile number is displayed as a phone number only — confirm before labeling it as a WhatsApp contact point.
- **Booking email confirmed.** Public contact and routine booking messages use `biance.bookings@veorawellnessph.com`.

## Hours & schedule

- **Business hours are not published anywhere** on the source site or its booking platform. The site currently shows "Studio hours will be announced closer to opening" instead of fabricated hours (`/contact`, `/locations`, footer). Provide real hours to populate `src/data/locations.ts` → `hours`.
- **No live class timetable exists yet** — the source booking platform's schedule endpoint returns zero entries (no confirmed dates, times or instructors). `/schedule` shows the real class *directory* instead of a fabricated weekly calendar; the booking flow collects a requested date/time and the studio confirms manually. Re-wire this once a real timetable exists.

## Team

- **No instructors, coaches or staff are published yet** (the source platform's staff roster is empty). `/about`'s founder section uses bracketed placeholders (`[Founder name to be provided]`, etc.) rather than inventing anyone. `src/data/team.ts` is scaffolded and ready but intentionally empty.

## Pricing

- **"Founding Member" pricing is a live, time-limited pre-opening promotion** on the source site (discounted rates on several packages). Its own copy says it lasts "during our preselling period" and reverts to standard pricing "after our official launch" — no specific end date is published. Confirm whether Veora wants to run an equivalent promotion, and if so, when it should be removed from `/pricing` (`src/data/pricing.ts` → `introOffers`).
- **Source data inconsistency:** the "CLASSIC Unlimited Week" package (Founding Member and, implicitly, its standard-tier equivalent) has conflicting validity information in the source system — the structured field says credits are valid for 7 days, but the customer-facing description text says "Credit is valid for 100 days from the date of purchase." This site displays the customer-facing text (what customers would actually see), but the discrepancy should be resolved with the studio before relying on either number operationally.
- **FAQ vs. catalog mismatch:** the source FAQ's general description lists "Dance" among Veora's offerings, but the live class/package catalog only contains Ballet (no generic "Dance" class exists as a bookable item). Confirm whether "Dance" was aspirational copy, a synonym for Ballet, or a real class type not yet in the booking system.

## Legal

- **General Terms & Conditions and Studio Rental Terms & Conditions** were migrated with the brand name swapped (SPACIO BLNC → Veora) and meaning otherwise preserved verbatim (`/policies`, `src/data/policies.ts`). These are legally operative documents — have them reviewed by the studio and, ideally, counsel before launch, rather than treating the rebrand substitution as sufficient on its own.

## Structured data

- **Geo coordinates** (14.4108087, 120.9503414) are taken directly from the source platform's own location record — high confidence, but worth a final sanity check against the actual studio address once available.
- **`priceRange` was intentionally omitted** from the LocalBusiness structured data — the real observed price span (₱599 single class to ₱25,000 quarterly package) is too wide to produce a meaningful `priceRange` signal.
