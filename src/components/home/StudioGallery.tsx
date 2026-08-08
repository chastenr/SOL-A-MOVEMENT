import { images } from "@/data/images";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";

const materials = [
  { label: "Walls", detail: "Warm plaster & soft ivory tone" },
  { label: "Floors & Fixtures", detail: "Walnut-toned wood, throughout" },
  { label: "Light", detail: "Soft, warm-white — never harsh" },
];

/**
 * A dedicated showcase of the physical studio. `studioExperienceOne` is a
 * real photo of the class floor — the only interior image currently
 * available — so this section builds around it honestly (one confident
 * image + material detail) rather than padding it out with unrelated
 * lifestyle stock relabeled as other rooms.
 */
export function StudioGallery() {
  return (
    <section className="texture-plaster bg-plaster py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 sm:px-8 lg:grid-cols-[2fr_3fr] lg:gap-16 lg:px-12">
        <div>
          <AnimatedSection>
            <SectionLabel index="04" label="The Studio" className="mb-5" />
            <SectionHeading
              heading="A space designed to feel like an exhale."
              body="Warm plaster arches, walnut wood tones and soft, considered lighting — every corner of our Bacoor, Cavite studio is built to slow you down the moment you walk in."
            />
          </AnimatedSection>

          <AnimatedSection delay={0.1} className="mt-10 divide-y divide-charcoal/10 border-t border-charcoal/10">
            {materials.map((item) => (
              <div key={item.label} className="flex items-baseline justify-between gap-4 py-4">
                <span className="text-xs uppercase tracking-[0.18em] text-charcoal/45">{item.label}</span>
                <span className="font-display text-right text-charcoal/80">{item.detail}</span>
              </div>
            ))}
          </AnimatedSection>

          <AnimatedSection delay={0.16} className="mt-8">
            <Button href="/locations" variant="secondary">
              Visit the Studio
            </Button>
          </AnimatedSection>
        </div>

        <AnimatedSection delay={0.1} className="relative">
          <ImageReveal
            src={images.studioExperienceOne.src}
            alt={images.studioExperienceOne.alt}
            width={1000}
            height={1150}
            hoverScale
            containerClassName="mask-arch-deep aspect-[4/5] shadow-glow-warm sm:aspect-[5/6]"
            sizes="(min-width: 1024px) 55vw, 100vw"
          />
          <span className="absolute bottom-5 left-5 rounded-full bg-charcoal/70 px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ivory backdrop-blur-sm">
            The Studio Floor
          </span>
        </AnimatedSection>
      </div>
    </section>
  );
}
