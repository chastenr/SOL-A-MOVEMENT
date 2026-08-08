import { siteConfig } from "@/data/site";

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address.line1,
      addressLocality: siteConfig.contact.address.line2,
    },
    sameAs: [siteConfig.contact.instagram],
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
