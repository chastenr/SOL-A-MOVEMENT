import { createPageMetadata } from "@/lib/seo-metadata";
import { policyDocuments } from "@/data/policies";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PolicyDocumentsList } from "@/components/policies/PolicyDocumentsList";

export const metadata = createPageMetadata({
  title: "Studio, Booking & Privacy Policies",
  description: "Veora Wellness studio policies, booking terms, privacy notice and cookie information.",
  path: "/policies",
});

export default function PoliciesPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-40 pb-16 sm:px-8 sm:pb-20">
      <AnimatedSection>
        <SectionHeading
          as="h1"
          eyebrow="Studio Policies"
          heading="Terms & conditions."
          body="The policies below govern bookings, classes, memberships, privacy and website cookies at Veora."
        />
      </AnimatedSection>

      <PolicyDocumentsList documents={policyDocuments} />
    </section>
  );
}
