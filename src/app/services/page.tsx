import type { Metadata } from "next";
import { services } from "@/data/services";
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

const studioRentalPackages = [
  {
    name: "Studio Rental",
    price: "₱6,500",
    detail: "2-hour exclusive studio use · up to 10 guests · no instructor · +₱300 per additional guest",
  },
  {
    name: "Studio + Classics Experience",
    price: "₱10,000",
    detail:
      "2-hour exclusive use + one private 50–60 min class (Mat Pilates, Yoga, Barre or Strength) · up to 10 guests · +₱450 per additional guest",
  },
  {
    name: "Studio + Restore Experience",
    price: "₱13,500",
    detail:
      "2-hour exclusive use + one private 50–60 min heated or infrared class · up to 10 guests · +₱650 per additional guest",
  },
];

export default function ServicesPage() {
  return (
    <>
      <ServiceSchema />
      <section className="mx-auto max-w-7xl px-6 pt-40 pb-16 sm:px-8 lg:px-12">
        <AnimatedSection>
          <SectionHeading
            eyebrow="Our Classes"
            heading="Find the movement that moves you."
            body="Every Veora class is designed with intention. Explore our offerings below, then request your booking — no memberships or online payment required."
          />
        </AnimatedSection>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 sm:px-8 sm:pb-32 lg:px-12">
        <div className="flex flex-col gap-16">
          {services.map((service, index) => (
            <AnimatedSection key={service.slug} delay={Math.min(index * 0.05, 0.3)}>
              <ServiceCard service={service} variant="detailed" />
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section className="bg-cream/40 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 sm:px-8">
          <AnimatedSection>
            <SectionHeading
              align="center"
              eyebrow="Studio Rentals"
              heading="Host your next event at Veora."
              body="Our studio is available for private rentals — perfect for wellness events, dance rehearsals, fitness classes and intimate gatherings. Pricing below is informational; contact us to check availability and confirm details."
              className="mx-auto"
            />
          </AnimatedSection>

          <div className="mt-12 divide-y divide-charcoal/10 rounded-2xl border border-charcoal/10 bg-ivory">
            {studioRentalPackages.map((pkg) => (
              <div key={pkg.name} className="flex flex-col gap-1 px-6 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <div>
                  <p className="font-display text-xl text-charcoal">{pkg.name}</p>
                  <p className="mt-1 text-sm text-charcoal/60">{pkg.detail}</p>
                </div>
                <p className="shrink-0 text-lg text-charcoal">{pkg.price}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button href="/contact" size="lg">
              Inquire About Studio Rental
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
