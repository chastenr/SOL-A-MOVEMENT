import { services } from "@/data/services";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/services/ServiceCard";
import { Button } from "@/components/ui/Button";

export function ServicesSection() {
  return (
    <section className="bg-cream/40 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <AnimatedSection className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Our Classes"
            heading="Find the movement that moves you."
            body="Whether you're trying your first class or building a consistent routine, we have flexible options designed around your goals."
          />
          <Button href="/services" variant="secondary" className="shrink-0">
            View All Services
          </Button>
        </AnimatedSection>

        <div className="mt-16 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <AnimatedSection key={service.slug} delay={index * 0.08}>
              <ServiceCard service={service} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
