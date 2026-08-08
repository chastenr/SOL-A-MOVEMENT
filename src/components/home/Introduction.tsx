import { images } from "@/data/images";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";

export function Introduction() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32 lg:px-12">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <AnimatedSection>
          <SectionHeading
            eyebrow="Welcome to SOLÉA"
            heading="Movement designed around you."
            body="SOLÉA is more than a place to work out. It's a space to reconnect with your body, build strength, improve mobility and create a movement practice that supports how you want to feel every day."
          />
          <div className="mt-10">
            <Button href="/about" variant="secondary">
              Discover SOLÉA
            </Button>
          </div>
        </AnimatedSection>

        <ImageReveal
          src={images.introduction.src}
          alt={images.introduction.alt}
          width={800}
          height={960}
          containerClassName="aspect-[4/5] rounded-2xl lg:aspect-[5/6]"
          sizes="(min-width: 1024px) 45vw, 100vw"
        />
      </div>
    </section>
  );
}
