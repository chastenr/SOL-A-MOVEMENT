import { siteConfig } from "@/data/site";
import { safeJsonLd } from "@/lib/utils";

type Breadcrumb = { name: string; path: string };

export function PageSchema({
  name,
  description,
  path,
  breadcrumbs,
}: {
  name: string;
  description: string;
  path: string;
  breadcrumbs?: Breadcrumb[];
}) {
  const url = `${siteConfig.url}${path}`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name,
      description,
      inLanguage: "en-PH",
      isPartOf: { "@id": `${siteConfig.url}/#website` },
      about: { "@id": `${siteConfig.url}/#localbusiness` },
    },
  ];

  if (breadcrumbs?.length) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${siteConfig.url}${item.path}`,
      })),
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
