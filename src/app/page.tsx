import { createPageMetadata } from "@/lib/seo-metadata";
import { Hero } from "@/components/home/Hero";
import { Introduction } from "@/components/home/Introduction";
import { ServicesSection } from "@/components/home/ServicesSection";
import { StudioExperience } from "@/components/home/StudioExperience";
import { StudioGallery } from "@/components/home/StudioGallery";
import { PackagesPreview } from "@/components/home/PackagesPreview";
import { BookingCta } from "@/components/home/BookingCta";

export const metadata = createPageMetadata({
  title: "Pilates & Wellness Studio in Bacoor, Cavite",
  description:
    "Veora Wellness is a boutique studio in Bacoor, Cavite offering beginner-friendly Mat Pilates, yoga, barre, strength, recovery and ballet classes. View the schedule and book online.",
  path: "/",
});

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
