import { createPageMetadata } from "@/lib/seo-metadata";
import { policyDocuments } from "@/data/policies";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PolicyDocumentsList } from "@/components/policies/PolicyDocumentsList";

const waiverMetadata = createPageMetadata({
  title: "Waiver, Studio Policies, Terms & Privacy",
  description:
    "The Veora Wellness waiver, studio policies, booking terms and privacy notice — the same agreement accepted during signup.",
  path: "/waiver",
});

export const metadata = {
  ...waiverMetadata,
  robots: { index: false, follow: true },
};

export default function WaiverPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-40 pb-16 sm:px-8 sm:pb-20">
      <AnimatedSection>
        <SectionHeading
          as="h1"
          eyebrow="Waiver"
          heading="Waiver, studio policies, terms & privacy."
          body="This is the full agreement every member accepts when creating a Veora account — reproduced here as a standalone, shareable page."
        />
      </AnimatedSection>

      <PolicyDocumentsList documents={policyDocuments} />
    </section>
  );
}
