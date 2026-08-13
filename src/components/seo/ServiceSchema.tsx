import { siteConfig } from "@/data/site";
import { getServices } from "@/lib/catalog/services";
import { safeJsonLd } from "@/lib/utils";

export async function ServiceSchema() {
  const services = await getServices();
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Veora Wellness classes",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteConfig.url}/services/${service.slug}`,
      item: {
        "@type": "Service",
        "@id": `${siteConfig.url}/services/${service.slug}#service`,
        name: service.name,
        serviceType: service.name,
        description: service.description,
        category: service.category,
        areaServed: {
          "@type": "City",
          name: "Bacoor",
          containedInPlace: { "@type": "AdministrativeArea", name: "Cavite, Philippines" },
        },
        provider: { "@id": `${siteConfig.url}/#localbusiness` },
        url: `${siteConfig.url}/services/${service.slug}`,
      },
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
  );
}
