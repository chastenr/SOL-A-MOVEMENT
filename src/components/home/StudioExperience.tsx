import { Activity, ShowerHead, Users } from "lucide-react";
import { images } from "@/data/images";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const features = [
  {
    icon: Activity,
    title: "Beginner-Friendly",
    description:
      "Every class is approachable for first-timers, with modifications offered throughout so you can move at your own pace.",
  },
  {
    icon: Users,
    title: "Open to Everyone",
    description: "We welcome every body, regardless of age, gender or fitness level.",
  },
  {
    icon: ShowerHead,
    title: "Everything Provided",
    description: "Premium mats and equipment, complimentary lockers and shower facilities are all included in your visit.",
  },
];

export function StudioExperience() {
  return (
    <section className="bg-cream/50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-0">
          <div className="relative">
            <ImageReveal
              src={images.studioExperienceOne.src}
              alt={images.studioExperienceOne.alt}
              width={800}
              height={900}
              containerClassName="aspect-[4/5] rounded-xl sm:aspect-[5/4] lg:aspect-auto lg:h-full lg:min-h-[420px] lg:rounded-r-none"
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
            <div className="absolute bottom-4 right-4 hidden w-[34%] sm:block">
              <ImageReveal
                src={images.studioExperienceTwo.src}
                alt={images.studioExperienceTwo.alt}
                width={400}
                height={400}
                containerClassName="aspect-square rounded-lg border-4 border-cream/70 shadow-[0_16px_40px_-16px_rgba(34,31,28,0.45)]"
                sizes="20vw"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-xl bg-ivory px-6 py-10 sm:px-10 sm:py-12 lg:rounded-l-none lg:px-14 lg:py-14">
            <AnimatedSection>
              <SectionHeading
                eyebrow="The Veora Experience"
                heading="A space to move, breathe and reset."
                body="Every detail at Veora is designed to help you feel comfortable, supported and present — from beginner-friendly classes to a calm, welcoming studio."
              />
            </AnimatedSection>

            <div className="mt-8 space-y-6">
              {features.map((feature, index) => (
                <AnimatedSection key={feature.title} delay={Math.min(index * 0.08, 0.24)}>
                  <div className="flex items-start gap-4">
                    <feature.icon className="mt-0.5 shrink-0 text-clay" size={22} strokeWidth={1.5} aria-hidden />
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
