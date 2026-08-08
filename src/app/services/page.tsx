import type { Metadata } from "next";
import { services } from "@/data/services";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceSchema } from "@/components/seo/ServiceSchema";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore SOLÉA Movement & Wellness's services — Reformer Pilates, Mat Pilates, Yoga Flow, Mobility & Stretch, Private Sessions and Wellness Sessions.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <ServiceSchema />
      <section className="mx-auto max-w-7xl px-6 pt-40 pb-16 sm:px-8 lg:px-12">
        <AnimatedSection>
          <SectionHeading
            eyebrow="Our Offerings"
            heading="Movement for every season of you."
            body="Every SOLÉA session is designed with intention. Explore our services below, then reserve your visit — no memberships or payment required to book."
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
    </>
  );
}
