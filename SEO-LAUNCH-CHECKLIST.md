# Veora Wellness SEO Launch Checklist

## Deployment and crawlability

- [ ] Deploy the current production build; the site-lock is disabled in code but the live site remains locked until deployment.
- [ ] Confirm `https://www.veora.ph/` returns `200` without a password or `/site-locked` redirect.
- [ ] Remove the current two-hop `http://veora.ph` → `https://veora.ph` → `https://www.veora.ph` chain in the DNS/CDN/Vercel domain layer if the provider supports a direct HTTP-apex rule. HTTPS apex and HTTP www already redirect directly and preserve paths.
- [ ] Test `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and each `/services/[slug]` URL.
- [ ] Confirm public pages have self-referencing canonicals and no `noindex`.
- [ ] Confirm account, admin, auth, checkout, and purchase routes remain private/noindex.
- [ ] Validate the JSON-LD with Schema.org Validator and Google's Rich Results Test where supported.
- [ ] Run Lighthouse on mobile for the homepage, classes, class detail, pricing, schedule, and location pages.

## Google Search Console — Chase/client action

1. Verify the **veora.ph Domain property** using a DNS TXT record.
2. Inspect the canonical `https://www.veora.ph/` URL and confirm Google sees it as indexable after deployment.
3. Submit `https://www.veora.ph/sitemap.xml`.
4. Request indexing for the homepage, `/services`, `/pricing`, `/locations`, and all six class pages.
5. Check Page Indexing for redirects, blocked URLs, duplicates, and crawled-not-indexed pages.
6. Check HTTPS and Core Web Vitals reports after enough real-user data is available.
7. Review structured-data/enhancement reports and fix only genuine errors.
8. Monitor Search Performance monthly by page, query, device, and Philippines location.

## Bing and AI search

- [ ] Verify Bing Webmaster Tools and submit the same sitemap.
- [ ] Confirm Googlebot, Bingbot, and OAI-SearchBot can fetch public pages.
- [ ] Keep `/llms.txt` synchronized when classes, hours, or booking steps change.

## Analytics

No GA4 installation was found in the repository. Add one only after the owner supplies the correct property and privacy decision. Avoid duplicate tags. Recommended consent-aware events: `book_class_click`, `view_schedule`, `view_package`, `begin_checkout`, `purchase`, `contact_click`, `phone_click`, and `directions_click`.
