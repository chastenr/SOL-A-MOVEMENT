import type { Metadata } from "next";
import Link from "next/link";
import { pricing } from "@/data/pricing";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PricingCard } from "@/components/pricing/PricingCard";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Veora Wellness pricing — Founding Member offers, single-session passes, class packs and studio rentals. All prices are informational; booking never requires online payment.",
  alternates: { canonical: "/pricing" },
};

function PricingSection({
  id,
  eyebrow,
  heading,
  body,
  options,
  ctaType,
}: {
  id?: string;
  eyebrow: string;
  heading: string;
  body?: string;
  options: typeof pricing.packages;
  ctaType: "book" | "inquire";
}) {
  if (options.length === 0) return null;

  return (
    <section id={id} className="mx-auto max-w-7xl scroll-mt-24 px-6 py-10 sm:px-8 sm:py-12 lg:px-12">
      <AnimatedSection>
        <SectionHeading eyebrow={eyebrow} heading={heading} body={body} />
      </AnimatedSection>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option, index) => (
          <AnimatedSection key={option.slug} delay={Math.min(index * 0.06, 0.3)}>
            <PricingCard option={option} ctaType={ctaType} />
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}

export default function PricingPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pt-28 pb-8 sm:px-8 lg:px-12">
        <AnimatedSection>
          <SectionHeading
            eyebrow="Pricing"
            heading="Move in a way that works for you."
            body="All pricing below is published for your information — booking a session never requires online payment. Choose an option and we'll confirm the details with you directly."
          />
        </AnimatedSection>
      </section>

      <PricingSection
        eyebrow="Founding Member Offers"
        heading="Pre-opening rates, for a limited time."
        body="Available only during our preselling period. After our official launch, pricing transitions to standard rates below."
        options={pricing.introOffers}
        ctaType="book"
      />

      <PricingSection
        eyebrow="Single Sessions"
        heading="Try a class."
        options={pricing.singleSessions}
        ctaType="book"
      />

      <PricingSection
        eyebrow="Class Packs"
        heading="Build a practice."
        options={pricing.packages}
        ctaType="book"
      />

      <PricingSection
        id="studio-rentals"
        eyebrow="Studio Rentals"
        heading="Host your next event at Veora."
        body="Private studio access for your own event, wellness gathering or private class — with or without an instructor."
        options={pricing.specialOffers}
        ctaType="inquire"
      />

      <section className="mx-auto max-w-3xl px-6 pb-14 text-center sm:px-8 sm:pb-16">
        <AnimatedSection>
          <p className="text-sm text-charcoal/55">
            Class credits are personal and non-transferable. Please cancel or reschedule at least
            12 hours before your class. Full terms are available on our{" "}
            <Link href="/policies" className="underline underline-offset-2 hover:text-charcoal">
              Policies
            </Link>{" "}
            page.
          </p>
        </AnimatedSection>
      </section>
    </>
  );
}
