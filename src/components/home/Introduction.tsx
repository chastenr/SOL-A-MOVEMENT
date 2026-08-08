import { images } from "@/data/images";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";

export function Introduction() {
  return (
    <section className="bg-ivory px-6 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[2fr_3fr] lg:gap-14">
        <AnimatedSection>
          <SectionHeading
            eyebrow="Why Veora?"
            heading="More than just a workout. This is a space to feel your best."
            body="At Veora, wellness is about moving with purpose. Our thoughtfully designed studio offers a welcoming environment where you can explore different movement practices, challenge yourself and reconnect with your body — all under one roof. Whether you're just beginning your wellness journey or looking to elevate your routine, our experienced instructors are here to guide you every step of the way."
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
          height={720}
          containerClassName="aspect-[4/5] rounded-xl sm:aspect-[16/11]"
          sizes="(min-width: 1024px) 55vw, 100vw"
        />
      </div>
    </section>
  );
}
