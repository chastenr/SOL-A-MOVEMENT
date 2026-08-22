import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";
import { getServices } from "@/lib/catalog/services";
import { images } from "@/data/images";
import { articles } from "@/data/articles";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = await getServices();
  const routes = [
    "",
    "/about",
    "/services",
    "/pricing",
    "/schedule",
    "/locations",
    "/contact",
    "/faq",
    "/articles",
    "/policies",
  ];

  const pageImages: Record<string, string[]> = {
    "": [images.hero.src, images.studioExperienceOne.src],
    "/about": [images.studioExperienceOne.src],
    "/services": services.map((service) => service.image.src),
  };

  const pages: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    changeFrequency: route === "/schedule" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/pricing" ? 0.9 : 0.7,
    ...(pageImages[route] ? { images: pageImages[route] } : {}),
  }));

  const classPages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${siteConfig.url}/services/${service.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
    images: [service.image.src],
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteConfig.url}/articles/${article.slug}`,
    lastModified: article.publishedAt,
    changeFrequency: "monthly",
    priority: 0.7,
    images: [article.image.src],
  }));

  return [...pages, ...classPages, ...articlePages];
}
