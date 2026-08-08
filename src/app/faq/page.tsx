import type { Metadata } from "next";
import { faqTopics } from "@/data/faq";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about booking, first visits, safety and studio policies at Veora Wellness.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-28 pb-16 sm:px-8 sm:pb-20">
      <AnimatedSection>
        <SectionHeading
          eyebrow="Good to Know"
          heading="Frequently asked questions."
          body="Everything you need to know before your first visit to Veora."
        />
      </AnimatedSection>

      <div className="mt-16 space-y-14">
        {faqTopics.map((topic, topicIndex) => (
          <AnimatedSection key={topic.topic} delay={Math.min(topicIndex * 0.05, 0.3)}>
            <h2 className="font-display text-2xl text-charcoal">{topic.topic}</h2>
            <dl className="mt-6 divide-y divide-charcoal/10 border-t border-charcoal/10">
              {topic.items.map((item) => (
                <div key={item.question} className="py-5">
                  <dt className="font-medium text-charcoal">{item.question}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-charcoal/65">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
