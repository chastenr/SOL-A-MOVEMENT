import { Activity, HeartHandshake, Users } from "lucide-react";
import { images } from "@/data/images";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const features = [
  {
    icon: Activity,
    title: "Intentional Movement",
    description: "Programs designed around strength, mobility and longevity.",
  },
  {
    icon: HeartHandshake,
    title: "Personal Attention",
    description: "A supportive experience focused on individual needs and progress.",
  },
  {
    icon: Users,
    title: "Welcoming Community",
    description: "A comfortable environment where movement meets connection.",
  },
];

export function StudioExperience() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32 lg:px-12">
      <AnimatedSection>
        <SectionHeading
          align="center"
          eyebrow="The SOLÉA Experience"
          heading="A space to move, breathe and reset."
          body="Every detail at SOLÉA is designed to help you feel comfortable, supported and present—from intentional movement to a calm, welcoming environment."
          className="mx-auto"
        />
      </AnimatedSection>

      <div className="mt-16 grid gap-6 sm:grid-cols-2">
        <ImageReveal
          src={images.studioExperienceOne.src}
          alt={images.studioExperienceOne.alt}
          width={800}
          height={1000}
          containerClassName="aspect-[4/5] rounded-2xl sm:translate-y-8"
          sizes="(min-width: 640px) 45vw, 100vw"
        />
        <ImageReveal
          src={images.studioExperienceTwo.src}
          alt={images.studioExperienceTwo.alt}
          width={800}
          height={1000}
          containerClassName="aspect-[4/5] rounded-2xl"
          sizes="(min-width: 640px) 45vw, 100vw"
        />
      </div>

      <div className="mt-20 grid gap-10 sm:grid-cols-3 sm:gap-8">
        {features.map((feature, index) => (
          <AnimatedSection key={feature.title} delay={index * 0.1}>
            <feature.icon className="text-clay" size={28} strokeWidth={1.5} aria-hidden />
            <h3 className="font-display mt-4 text-2xl text-charcoal">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-charcoal/65">{feature.description}</p>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
