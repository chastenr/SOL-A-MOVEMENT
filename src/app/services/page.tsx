import type { Metadata } from "next";
import { getServices } from "@/lib/catalog/services";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceSchema } from "@/components/seo/ServiceSchema";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore Veora Wellness's classes — Mat Pilates, Yoga, Barre, Strength & HIIT, Recovery & Restore and Ballet.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <ServiceSchema />
      <section className="mx-auto max-w-7xl px-6 pt-28 pb-10 sm:px-8 lg:px-12">
        <AnimatedSection className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Our Classes"
            heading="Find the movement that moves you."
            body="Every Veora class is designed with intention. Explore our offerings below, then request your booking — no memberships or online payment required."
          />
          <Button href="/pricing" variant="secondary" className="shrink-0">
            View Pricing
          </Button>
        </AnimatedSection>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14 sm:px-8 sm:pb-16 lg:px-12">
        <div className="flex flex-col gap-10">
          {services.map((service, index) => (
            <AnimatedSection key={service.slug} delay={Math.min(index * 0.05, 0.3)}>
              <ServiceCard service={service} variant="detailed" />
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section className="bg-sand/25 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-6 text-center sm:px-8">
          <AnimatedSection>
            <SectionHeading
              align="center"
              eyebrow="Studio Rentals"
              heading="Host your next event at Veora."
              body="Our studio is also available for private rentals — perfect for wellness events, workshops and intimate gatherings, with or without an instructor."
              className="mx-auto"
            />
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Button href="/pricing#studio-rentals" size="lg">
                See Rental Pricing
              </Button>
              <Button href="/contact" size="lg" variant="secondary">
                Inquire Directly
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
