# Veora Wellness SEO Audit

## Overall Status

⚠️ **Implementation is ready for validation and deployment.** The critical whole-site crawl gate is disabled in code. Production will remain locked until this build is deployed.

## Critical Problems Found

- ❌ Production middleware redirected all public pages and crawlers to `/site-locked`.
- ❌ Important classes existed only as sections on one catalog URL, limiting search intent coverage.
- ❌ Structured data used disconnected entities and class fragment URLs; hours were not machine-formatted.
- ❌ Titles/descriptions were generic and did not consistently identify Bacoor, Cavite.
- ❌ The sitemap omitted individual class pages and reset `lastModified` to the build time.
- ⚠️ No Google Search Console, Bing Webmaster Tools, GBP, or GA4 ownership can be verified from source code.

## Problems Fixed

- ✅ Disabled the public production site lock while preserving account/admin authentication.
- ✅ Established `https://www.veora.ph` as the metadata, canonical, sitemap, robots, and schema base.
- ✅ Added six crawlable pages for real services: Mat Pilates, yoga, barre, strength and HIIT, recovery and restore, and ballet.
- ✅ Added local, intent-specific titles, descriptions, self-canonicals, Open Graph data, and Philippine locale signals.
- ✅ Added conversion links between classes, schedule, pricing, FAQ, location, and booking.

## Technical SEO

- ✅ Next.js 16.3 Metadata API and metadata route conventions are used.
- ✅ `lang="en-PH"`, Open Graph `en_PH`, metadata base, publisher, icons, and web manifest are configured.
- ✅ Robots allow public content and explicitly allow OAI-SearchBot while excluding private surfaces.
- ✅ Dynamic sitemap includes only canonical public pages and all six class pages.
- ✅ Auth/account/admin/checkout/purchase pages remain excluded and/or `noindex`.
- ⚠️ Canonical redirects preserve paths. HTTPS apex and HTTP www redirect directly to `https://www.veora.ph`; HTTP apex currently takes two permanent hops through HTTPS apex. Removing that chain requires a DNS/CDN/Vercel domain-layer rule and should be rechecked after deployment.

## Local SEO

- ✅ NAP is centralized in `src/data/locations.ts` and reused by the site, schema, and machine-readable files.
- ✅ Full Bacoor address, Cavite, Philippine phone, hours, coordinates, directions, and parking information are visible HTML.
- ✅ Local terms are used naturally without fake city pages.

## Structured Data

- ✅ Connected `Organization`, `ExerciseGym`/`LocalBusiness`, and `WebSite` entities use stable IDs.
- ✅ Business address, geo, map, hours, logo, image, contact, price range, and official profile URLs are represented.
- ✅ Class catalog uses `ItemList` and connected `Service` entities.
- ✅ Class pages use `WebPage`, `BreadcrumbList`, `Service`, and visible FAQ data.
- ✅ Standalone FAQ uses `FAQPage` matching visible content.
- ✅ No reviews, ratings, instructors, credentials, events, or awards were invented.

## Google Business Profile

⚠️ Owner action is required. Follow `SEO-GOOGLE-BUSINESS-PROFILE.md`; GBP cannot be safely changed from repository code.

## Content SEO

- ✅ Homepage now answers what Veora is, where it is, and what it offers in direct language.
- ✅ Class pages explain audience, duration, level, benefits, formats, preparation, arrival, location, pricing, policies, and booking.
- ✅ “Reformer Pilates” pages and claims were intentionally not created.
- ⚠️ A guide hub was not generated without a confirmed author/editor; low-trust mass content would weaken the site.

## AI / LLM Discoverability

- ✅ Answer-first factual copy, linked entities, local schema, and crawlable service pages support retrieval.
- ✅ `/llms.txt` provides a concise optional overview using only real URLs and verified facts.
- ✅ OAI-SearchBot is not blocked from public content.

## Performance

- ✅ Public photography uses Next Image with dimensions/fill, responsive sizes, modern AVIF/WebP output, and descriptive alt text.
- ✅ Hero video already has mobile/desktop encodes, lightweight posters, `playsInline`, muted playback, metadata preload, and a reduced-motion image fallback.
- ✅ No analytics or other third-party marketing script was found, avoiding duplicate tracking and unnecessary main-thread work.
- ⚠️ Real Core Web Vitals require post-deployment field data and mobile Lighthouse checks.

## Image SEO

- ✅ Meaningful images use natural descriptive alt text; decorative marks are hidden appropriately.
- ✅ Below-fold images retain lazy-loading defaults and explicit sizing/aspect ratio to reduce layout shift.
- ⚠️ Replace stock class photography with owner-approved Veora class photos when available, retaining the same sizing and optimization approach.

## Internal Linking

- ✅ Homepage class links now lead to indexable class URLs.
- ✅ Catalog cards link to class details and booking.
- ✅ Class pages link to related classes, pricing, schedule, FAQ, and booking using descriptive anchors.

## Remaining Business Information Required

`SEO_DATA_REQUIRED`

- Official opening date and whether “Opening soon” should remain visible.
- Legal business name, if different from Veora Wellness.
- Founder/instructor names, bios, credentials, specialties, and approved photos.
- Confirmed class capacities and accepted payment methods.
- Official Veora-branded social profile URLs; current repository URLs use the existing Spacio BLNC handles.
- Confirmed GBP primary category, holiday hours, entrance details, and review link.
- Owner-approved real studio/class photos and image usage rights.
- Google Search Console, Bing Webmaster Tools, GBP, and optional GA4 ownership/access.
- A real guide author/editor and editorial review process.

## Recommended Next Steps

1. Deploy and complete every check in `SEO-LAUNCH-CHECKLIST.md`.
2. Verify and fully complete the Google Business Profile with matching NAP and photos.
3. Collect honest customer reviews after opening and respond consistently.
4. Replace stock imagery with authentic studio/class photography.
5. Publish a small, expert-reviewed guide hub only after author and editorial details are confirmed.

## Local Authority Plan

- Maintain consistent Veora naming and NAP on official social profiles and a small number of reputable Philippine/local business and wellness directories.
- Pursue real Bacoor/Cavite partnerships, instructor profiles, launch coverage, and relevant wellness/event collaborations.
- Use ClassPass only if Veora actually joins it and keep its schedule/NAP consistent.
- Seek legitimate local press around the opening and community events.
- Do not buy links or submit to bulk, low-quality directories.
