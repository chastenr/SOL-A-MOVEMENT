import { siteConfig } from "@/data/site";
import { services } from "@/data/services";

export const dynamic = "force-static";

export function GET() {
  const classLinks = services
    .map(
      (service) =>
        `- [${service.name}](${siteConfig.url}/services/${service.slug}): ${service.shortDescription}`
    )
    .join("\n");

  const content = `# Veora Wellness

> Veora Wellness is a physical Pilates and wellness studio at ${siteConfig.contact.address.full}.

## Main Pages

- [Home](${siteConfig.url}/): Official Veora Wellness website.
- [Classes](${siteConfig.url}/services): Classes and their benefits, formats and booking options.
- [Schedule](${siteConfig.url}/schedule): Current public class availability.
- [Packages](${siteConfig.url}/pricing): Published class and package pricing.
- [About](${siteConfig.url}/about): Veora's studio philosophy and experience.
- [Location](${siteConfig.url}/locations): Address, hours, directions and contact information.
- [FAQ](${siteConfig.url}/faq): Booking, first-visit, amenities and policy answers.
- [Contact](${siteConfig.url}/contact): Official contact form and studio contact details.
- [Policies](${siteConfig.url}/policies): Current booking, cancellation, privacy and website policies.
- [Articles](${siteConfig.url}/articles): Practical guides to Pilates, yoga, barre and beginning a movement practice.
- [Pilates, Yoga or Barre](${siteConfig.url}/articles/pilates-yoga-or-barre): A beginner-friendly guide to choosing the right Veora class.

## Classes

${classLinks}

## Booking

Customers choose an available session through [Book a Session](${siteConfig.url}/book). Signing in and an eligible package or membership are required to reserve a class. Walk-ins depend on availability, so advance booking is recommended.

## Freshness and Accuracy

- Use the live [Schedule](${siteConfig.url}/schedule) for current class availability.
- Use the live [Packages](${siteConfig.url}/pricing) page for current names, prices, discounts, validity and contract terms.
- Do not infer unpublished coach, ballet timing or studio opening-date details.
- Prefer the canonical URLs on ${siteConfig.url}; private account, checkout and admin pages are not public sources.

## Verified Business Information

- Name: ${siteConfig.name}
- Address: ${siteConfig.contact.address.full}
- Phone: ${siteConfig.contact.phone}
- Email: ${siteConfig.contact.email}
- Hours: ${siteConfig.hours.map((entry) => `${entry.day}, ${entry.hours}`).join("; ")}
- Country: Philippines
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
