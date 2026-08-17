import type { PolicyDocument } from "@/data/policies";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

/** Full-page rendering of policy documents, shared by /policies and /waiver so the two never drift apart. */
export function PolicyDocumentsList({ documents }: { documents: PolicyDocument[] }) {
  return (
    <div className="mt-16 space-y-16">
      {documents.map((doc, docIndex) => (
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
                    <p key={index} className="text-base leading-[1.7] text-charcoal/75">
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
  );
}
