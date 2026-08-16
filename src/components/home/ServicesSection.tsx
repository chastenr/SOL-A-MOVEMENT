import { ArrowUpRight } from "lucide-react";
import { getServices } from "@/lib/catalog/services";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export async function ServicesSection() {
  const services = await getServices();

  return (
    <section className="bg-sand/25 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <AnimatedSection className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <SectionLabel index="02" label="Our Classes" className="mb-5" />
            <SectionHeading
              heading="Find the movement that moves you."
              body="Six ways to move, one studio to call your own."
            />
          </div>
          <Button href="/services" variant="secondary" className="shrink-0">
            View All Services
          </Button>
        </AnimatedSection>

        <div className="mt-14 divide-y divide-charcoal/10 border-t border-charcoal/10">
          {services.map((service, index) => {
            const reversed = index % 2 === 1;
            return (
              <AnimatedSection key={service.slug} delay={Math.min(index * 0.05, 0.25)}>
                <a
                  href={`/services/${service.slug}`}
                  className={cn(
                    "group flex flex-col items-start gap-6 py-8 sm:flex-row sm:items-center sm:gap-10",
                    reversed && "sm:flex-row-reverse"
                  )}
                >
                  <span className="font-display shrink-0 text-3xl italic text-charcoal/60 sm:text-4xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <ImageReveal
                    src={service.image.src}
                    alt={service.image.alt}
                    width={320}
                    height={320}
                    hoverScale
                    containerClassName="mask-arch aspect-square w-full shrink-0 sm:w-36 lg:w-44"
                    sizes="(min-width: 1024px) 176px, (min-width: 640px) 144px, calc(100vw - 3rem)"
                  />

                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                      {service.category}
                    </p>
                    <h3 className="font-display mt-2 text-2xl text-charcoal sm:text-3xl">
                      {service.name}
                    </h3>
                    <p className="mt-3 max-w-[62ch] text-base leading-[1.7] text-charcoal/75">
                      {service.shortDescription}
                    </p>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium uppercase tracking-[0.15em] text-charcoal/70 transition-colors group-hover:text-clay">
                    Learn more
                    <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                  </span>
                </a>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
