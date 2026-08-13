import { images } from "@/data/images";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";

export function Introduction() {
  return (
    <section className="bg-ivory px-6 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
        <AnimatedSection>
          <SectionLabel index="01" label="Why Veora" className="mb-5" />
          <SectionHeading
            heading="Movement, made intentional."
            body="Veora Wellness is a Pilates and wellness studio in Bacoor, Cavite, Philippines. We offer guided Mat Pilates, yoga, barre, strength, recovery and ballet classes for beginners and experienced movers."
          />
          <div className="mt-8">
            <Button href="/about" variant="secondary">
              Discover Veora
            </Button>
          </div>
        </AnimatedSection>

        <ImageReveal
          src={images.introduction.src}
          alt={images.introduction.alt}
          width={900}
          height={1080}
          containerClassName="mask-arch aspect-[4/5] shadow-glow-warm sm:aspect-[3/4]"
          sizes="(min-width: 1024px) 55vw, 100vw"
        />
      </div>
    </section>
  );
}
