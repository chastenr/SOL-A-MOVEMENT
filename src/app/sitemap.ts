import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/services",
    "/pricing",
    "/schedule",
    "/locations",
    "/contact",
    "/faq",
    "/policies",
  ];

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/schedule" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/pricing" ? 0.9 : 0.7,
  }));
}
