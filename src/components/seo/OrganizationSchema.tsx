import { images } from "@/data/images";
import { siteConfig } from "@/data/site";
import { safeJsonLd } from "@/lib/utils";

const DAYS = [
  "https://schema.org/Monday",
  "https://schema.org/Tuesday",
  "https://schema.org/Wednesday",
  "https://schema.org/Thursday",
  "https://schema.org/Friday",
  "https://schema.org/Saturday",
  "https://schema.org/Sunday",
];

export function OrganizationSchema() {
  const organizationId = `${siteConfig.url}/#organization`;
  const businessId = `${siteConfig.url}/#localbusiness`;
  const websiteId = `${siteConfig.url}/#website`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteConfig.name,
        alternateName: [siteConfig.shortName, "Veora Wellness Studio"],
        url: siteConfig.url,
        logo: {
          "@type": "ImageObject",
          url: `${siteConfig.url}/veora-logo-full.png`,
        },
        sameAs: [siteConfig.social.instagram, siteConfig.social.facebook],
      },
      {
        "@type": ["ExerciseGym", "LocalBusiness"],
        "@id": businessId,
        name: siteConfig.name,
        alternateName: "Veora Wellness Studio",
        description: siteConfig.description,
        url: siteConfig.url,
        image: images.studioExperienceOne.src,
        logo: `${siteConfig.url}/veora-logo-full.png`,
        telephone: siteConfig.contact.phone,
        email: siteConfig.contact.email,
        priceRange: "₱850–₱1,500",
        parentOrganization: { "@id": organizationId },
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
        hasMap: siteConfig.contact.mapUrl,
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: DAYS,
          opens: "07:00",
          closes: "20:00",
        },
        sameAs: [siteConfig.social.instagram, siteConfig.social.facebook],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteConfig.url,
        name: siteConfig.name,
        alternateName: "Veora Wellness Studio",
        inLanguage: "en-PH",
        publisher: { "@id": organizationId },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
