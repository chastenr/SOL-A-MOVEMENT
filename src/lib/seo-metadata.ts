import type { Metadata } from "next";
import { siteConfig } from "@/data/site";

export function createPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const socialTitle = `${title} | ${siteConfig.name}`;
  const socialImage = {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: `${siteConfig.name} — Pilates and wellness studio in Bacoor, Cavite`,
  };

  return {
    title: path === "/" ? { absolute: socialTitle } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_PH",
      siteName: siteConfig.name,
      url: path,
      title: socialTitle,
      description,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [socialImage.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    other: {
      "geo.region": "PH-CAV",
      "geo.placename": "Bacoor, Cavite",
      ICBM: `${siteConfig.contact.geo.lat}, ${siteConfig.contact.geo.lng}`,
    },
  };
}
