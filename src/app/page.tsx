import type { Metadata } from "next";
import { siteConfig } from "@/data/site";
import { Hero } from "@/components/home/Hero";
import { Introduction } from "@/components/home/Introduction";
import { ServicesSection } from "@/components/home/ServicesSection";
import { StudioExperience } from "@/components/home/StudioExperience";
import { StudioGallery } from "@/components/home/StudioGallery";
import { PackagesPreview } from "@/components/home/PackagesPreview";
import { BookingCta } from "@/components/home/BookingCta";

export const metadata: Metadata = {
  title: `${siteConfig.name} | Pilates, Movement & Wellness`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Introduction />
      <ServicesSection />
      <StudioExperience />
      <StudioGallery />
      <PackagesPreview />
      <BookingCta />
    </>
  );
}
