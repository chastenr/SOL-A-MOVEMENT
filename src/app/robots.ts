import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    "/api/",
    "/admin/",
    "/account/",
    "/checkout/",
    "/purchases/",
    "/verify-phone",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/mfa",
    "/auth/",
    "/site-locked",
    "/book",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: privatePaths },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
