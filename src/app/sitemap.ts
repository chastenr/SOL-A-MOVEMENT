import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/about", "/services", "/schedule", "/book", "/contact", "/faq", "/policies"];

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/schedule" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
