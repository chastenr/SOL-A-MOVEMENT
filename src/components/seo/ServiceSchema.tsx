import { siteConfig } from "@/data/site";
import { getServices } from "@/lib/catalog/services";
import { safeJsonLd } from "@/lib/utils";

export async function ServiceSchema() {
  const services = await getServices();
  const schema = services.map((service) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.name,
    name: service.name,
    description: service.description,
    category: service.category,
    provider: {
      "@type": "ExerciseGym",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    url: `${siteConfig.url}/services#${service.slug}`,
  }));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
