import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Defense-in-depth alongside each of these pages' own noindex
      // metadata — keeps crawlers out of authenticated/private surfaces
      // entirely rather than relying solely on a meta tag once fetched.
      disallow: [
        "/api/",
        "/admin",
        "/account",
        "/checkout",
        "/purchases",
        "/verify-phone",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/auth/",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
