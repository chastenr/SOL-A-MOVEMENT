import type { Metadata } from "next";
import { policyDocuments } from "@/data/policies";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Policies",
  description: "Veora Wellness studio policies, booking terms, privacy notice and cookie information.",
  alternates: { canonical: "/policies" },
};

export default function PoliciesPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-40 pb-16 sm:px-8 sm:pb-20">
      <AnimatedSection>
        <SectionHeading
          eyebrow="Studio Policies"
          heading="Terms & conditions."
          body="The policies below govern bookings, classes, studio rentals, privacy and website cookies at Veora."
        />
      </AnimatedSection>

      <div className="mt-16 space-y-16">
        {policyDocuments.map((doc, docIndex) => (
          <AnimatedSection key={doc.slug} delay={Math.min(docIndex * 0.05, 0.3)}>
            <h2 className="font-display text-3xl text-charcoal" id={doc.slug}>
              {doc.title}
            </h2>
            <div className="mt-6 space-y-6">
              {doc.sections.map((section) => (
                <div key={section.heading}>
                  <h3 className="text-sm font-medium uppercase tracking-[0.08em] text-charcoal/50">
                    {section.heading}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={index} className="text-sm leading-relaxed text-charcoal/70">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
