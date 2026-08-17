import { CircleDot, LockKeyhole, ShowerHead, SunMedium, TowelRack } from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";

const amenities = [
  { name: "Manduka Mats", icon: CircleDot },
  { name: "Infrared + Red Light Studio", icon: SunMedium },
  { name: "Lockers", icon: LockKeyhole },
  { name: "Showers", icon: ShowerHead },
  { name: "Complimentary Towels", icon: TowelRack },
] as const;

export function AmenitiesSection() {
  return (
    <section className="border-y border-charcoal/10 bg-ivory py-18 sm:py-24" aria-labelledby="amenities-heading">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <AnimatedSection>
          <SectionHeading
            eyebrow="Studio Amenities"
            heading="Everything you need, already here."
            body="Arrive ready to move. Our studio essentials are included so your visit feels simple from start to finish."
          />
        </AnimatedSection>

        <div className="mt-10 grid gap-px overflow-hidden rounded-[1.75rem] border border-charcoal/10 bg-charcoal/10 sm:grid-cols-2 lg:grid-cols-5">
          {amenities.map(({ name, icon: Icon }, index) => (
            <AnimatedSection key={name} delay={Math.min(index * 0.05, 0.2)} className="h-full">
              <div className="flex h-full min-h-36 flex-col justify-between bg-ivory p-5 sm:min-h-40 sm:p-6">
                <Icon className="h-5 w-5 text-clay" strokeWidth={1.5} aria-hidden />
                <h3 className="font-display mt-8 text-xl leading-tight text-charcoal">{name}</h3>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
