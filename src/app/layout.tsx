import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/data/site";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/privacy/CookieConsent";
import { OrganizationSchema } from "@/components/seo/OrganizationSchema";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { GOOGLE_TAG_MANAGER_ID } from "@/lib/analytics";

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "optional",
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "optional",
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `Pilates & Wellness Studio in Bacoor, Cavite | ${siteConfig.name}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "Fitness and wellness",
  // Not /veora-mark.png directly: that's fine brown linework on a
  // transparent ground, drawn to sit on the site's own light background —
  // shrunk to an actual 16-32px tab icon it all but disappears, especially
  // against a dark browser chrome. favicon-mark.png is the same mark
  // recolored ivory on a solid walnut square specifically so it still reads
  // as a solid, on-brand icon at real favicon sizes.
  icons: {
    icon: [{ url: "/favicon-mark.png", type: "image/png", sizes: "256x256" }],
    apple: [{ url: "/favicon-mark.png", type: "image/png", sizes: "256x256" }],
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "en_PH",
    title: `Pilates & Wellness Studio in Bacoor, Cavite | ${siteConfig.name}`,
    description: siteConfig.description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — Pilates and wellness studio in Bacoor, Cavite`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Pilates & Wellness Studio in Bacoor, Cavite | ${siteConfig.name}`,
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "/",
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#4d382c",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-PH"
      data-scroll-behavior="smooth"
      className={`${cormorantGaramond.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ivory pb-[calc(7rem+env(safe-area-inset-bottom))] text-charcoal xl:pb-0">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER_ID}`}
            height="0"
            width="0"
            title="Google Tag Manager"
            className="hidden invisible"
          />
        </noscript>
        <GoogleTagManager />
        <OrganizationSchema />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
