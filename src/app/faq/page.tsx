import { createPageMetadata } from "@/lib/seo-metadata";
import { faqTopics } from "@/data/faq";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { safeJsonLd } from "@/lib/utils";

export const metadata = createPageMetadata({
  title: "Pilates & Studio FAQs in Bacoor",
  description: "Get direct answers about Veora Wellness classes, first visits, booking, grip socks, parking, safety, lockers, showers and cancellation policies.",
  path: "/faq",
});

export default function FaqPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqTopics.flatMap((topic) => topic.items).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
    <section className="mx-auto max-w-4xl px-6 pt-40 pb-16 sm:px-8 sm:pb-20">
      <AnimatedSection>
        <SectionHeading
          as="h1"
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
                  <dt className="font-semibold text-charcoal">{item.question}</dt>
                  <dd className="mt-2 text-base leading-[1.7] text-charcoal/75">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </AnimatedSection>
        ))}
      </div>
    </section>
    </>
  );
}
