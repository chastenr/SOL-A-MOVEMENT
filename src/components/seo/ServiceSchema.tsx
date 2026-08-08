import { siteConfig } from "@/data/site";
import { services } from "@/data/services";

export function ServiceSchema() {
  const schema = services.map((service) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.name,
    name: service.name,
    description: service.description,
    category: service.category,
    provider: {
      "@type": "HealthAndBeautyBusiness",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    url: `${siteConfig.url}/services#${service.slug}`,
  }));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
