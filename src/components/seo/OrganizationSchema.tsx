import { siteConfig } from "@/data/site";
import { safeJsonLd } from "@/lib/utils";

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ExerciseGym",
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address.streetAddress,
      addressLocality: siteConfig.contact.address.addressLocality,
      addressRegion: siteConfig.contact.address.addressRegion,
      postalCode: siteConfig.contact.address.postalCode,
      addressCountry: siteConfig.contact.address.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.contact.geo.lat,
      longitude: siteConfig.contact.geo.lng,
    },
    sameAs: [siteConfig.social.instagram, siteConfig.social.facebook],
    openingHoursSpecification: siteConfig.hours
      .filter((entry) => entry.hours !== "Closed")
      .map((entry) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: entry.day,
        opens: entry.hours.split("–")[0]?.trim(),
        closes: entry.hours.split("–")[1]?.trim(),
      })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
