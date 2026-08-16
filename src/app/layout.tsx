import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/data/site";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/privacy/CookieConsent";
import { OrganizationSchema } from "@/components/seo/OrganizationSchema";

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
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
  },
  twitter: {
    card: "summary_large_image",
    title: `Pilates & Wellness Studio in Bacoor, Cavite | ${siteConfig.name}`,
    description: siteConfig.description,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-PH"
      data-scroll-behavior="smooth"
      className={`${cormorantGaramond.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ivory pb-[calc(7rem+env(safe-area-inset-bottom))] text-charcoal xl:pb-0">
        <OrganizationSchema />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
