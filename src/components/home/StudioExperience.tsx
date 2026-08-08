import { images } from "@/data/images";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionLabel } from "@/components/ui/SectionLabel";

const features = [
  {
    title: "Beginner-Friendly",
    description:
      "Every class is approachable for first-timers, with modifications offered throughout so you can move at your own pace.",
  },
  {
    title: "Open to Everyone",
    description: "We welcome every body, regardless of age, gender or fitness level.",
  },
  {
    title: "Everything Provided",
    description:
      "Premium mats and equipment, complimentary lockers and shower facilities are all included in your visit.",
  },
];

export function StudioExperience() {
  return (
    <section className="bg-cream/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <ImageReveal
              src={images.studioExperienceOne.src}
              alt={images.studioExperienceOne.alt}
              width={800}
              height={900}
              containerClassName="mask-arch-deep aspect-[4/5] shadow-glow-warm sm:aspect-[5/4] lg:aspect-auto lg:h-full lg:min-h-[460px]"
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
            <div className="absolute -bottom-6 -right-4 hidden w-[38%] sm:block lg:-right-8">
              <ImageReveal
                src={images.studioExperienceTwo.src}
                alt={images.studioExperienceTwo.alt}
                width={400}
                height={400}
                containerClassName="mask-arch aspect-square border-4 border-cream shadow-[0_16px_40px_-16px_rgba(34,31,28,0.45)]"
                sizes="20vw"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <AnimatedSection>
              <SectionLabel index="03" label="The Veora Experience" className="mb-5" />
              <SectionHeading
                heading="A space to move, breathe and reset."
                body="Every detail at Veora is designed to help you feel comfortable, supported and present — from beginner-friendly classes to a calm, welcoming studio."
              />
            </AnimatedSection>

            <div className="mt-10 divide-y divide-charcoal/10 border-t border-charcoal/10">
              {features.map((feature, index) => (
                <AnimatedSection key={feature.title} delay={Math.min(index * 0.08, 0.24)}>
                  <div className="flex items-start gap-5 py-5">
                    <span className="font-display shrink-0 text-lg italic text-clay">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-lg text-charcoal">{feature.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-charcoal/65">{feature.description}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
