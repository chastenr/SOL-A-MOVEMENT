import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionLabel } from "@/components/ui/SectionLabel";

export function ArticlesSection() {
  return (
    <section className="border-t border-charcoal/10 bg-cream/40 px-6 py-20 sm:px-8 sm:py-28 lg:px-12">
      <AnimatedSection className="mx-auto max-w-3xl text-center">
        <SectionLabel index="06" label="Articles" className="mb-5 justify-center" />
        <SectionHeading
          align="center"
          heading="From the Veora journal."
          body="Thoughtful reads on movement, wellness and everyday practice are coming soon."
        />
      </AnimatedSection>
    </section>
  );
}
