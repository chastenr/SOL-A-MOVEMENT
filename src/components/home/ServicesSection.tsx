import { getServices } from "@/lib/catalog/services";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/services/ServiceCard";
import { Button } from "@/components/ui/Button";

export async function ServicesSection() {
  const services = await getServices();

  return (
    <section className="bg-sand/25 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <AnimatedSection className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Our Classes"
            heading="Find the movement that moves you."
            body="Whether you're trying your first class or building a consistent routine, we have flexible options designed around your goals."
          />
          <Button href="/services" variant="secondary" className="shrink-0">
            View All Services
          </Button>
        </AnimatedSection>

        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <AnimatedSection key={service.slug} delay={Math.min(index * 0.06, 0.3)}>
              <ServiceCard service={service} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
