import { createPageMetadata } from "@/lib/seo-metadata";
import Link from "next/link";
import type { PricingOption } from "@/data/pricing";
import { getPricingGroups } from "@/lib/catalog/packages";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PricingCard } from "@/components/pricing/PricingCard";
import { AmenitiesSection } from "@/components/home/AmenitiesSection";

export const metadata = createPageMetadata({
  title: "Class Packages & Pilates Pricing in Bacoor",
  description:
    "View Veora Wellness class pricing in Bacoor, including single sessions, founding offers, class packs, ballet options and private studio rentals.",
  path: "/pricing",
});

const CATEGORY_ORDER = ["Classics", "Restore", "Ballet"] as const;

function categoryOf(option: PricingOption): (typeof CATEGORY_ORDER)[number] {
  if (option.serviceSlug === "recovery-restore") return "Restore";
  if (option.serviceSlug === "ballet") return "Ballet";
  return "Classics";
}

// Recommended option first within its group — the rest keep their original order.
function sortGroup(options: PricingOption[]) {
  return [...options].sort((a, b) => Number(!!b.recommended) - Number(!!a.recommended));
}

function OptionGrid({ options, ctaType }: { options: PricingOption[]; ctaType: "book" | "inquire" }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sortGroup(options).map((option, index) => (
        <AnimatedSection key={option.slug} delay={Math.min(index * 0.06, 0.3)}>
          <PricingCard option={option} ctaType={ctaType} />
        </AnimatedSection>
      ))}
    </div>
  );
}

function PricingSection({
  id,
  eyebrow,
  heading,
  body,
  options,
  ctaType,
  groupByCategory = false,
}: {
  id?: string;
  eyebrow: string;
  heading: string;
  body?: string;
  options: PricingOption[];
  ctaType: "book" | "inquire";
  /** Splits mixed Classics/Restore/Ballet options into labeled sub-groups instead of one flat grid. */
  groupByCategory?: boolean;
}) {
  if (options.length === 0) return null;

  const categories = groupByCategory
    ? CATEGORY_ORDER.map((category) => ({
        category,
        options: options.filter((option) => categoryOf(option) === category),
      })).filter((group) => group.options.length > 0)
    : null;

  return (
    <section id={id} className="mx-auto max-w-7xl scroll-mt-24 px-6 py-10 sm:px-8 sm:py-12 lg:px-12">
      <AnimatedSection>
        <SectionHeading eyebrow={eyebrow} heading={heading} body={body} />
      </AnimatedSection>

      {categories && categories.length > 1 ? (
        <div className="mt-8 space-y-10">
          {categories.map(({ category, options: groupOptions }) => (
            <div key={category}>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-charcoal/45">{category}</p>
              <div className="mt-4">
                <OptionGrid options={groupOptions} ctaType={ctaType} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <OptionGrid options={options} ctaType={ctaType} />
        </div>
      )}
    </section>
  );
}

export default async function PricingPage() {
  const pricing = await getPricingGroups();

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pt-40 pb-8 sm:px-8 lg:px-12">
        <AnimatedSection>
          <SectionHeading
            as="h1"
            eyebrow="Pricing"
            heading="Move in a way that works for you."
            body="Start with our pre-opening Intro Pass, or preview the class packages and unlimited memberships being prepared for launch."
          />
        </AnimatedSection>
      </section>

      <PricingSection
        eyebrow="Intro Pass"
        heading="Your first Veora class for ₱999."
        body="A one-class pre-opening offer, reduced from ₱1,100 and valid for 5 days from purchase. The introductory promotion ends after the September 18 launch."
        options={pricing.introOffers}
        ctaType="book"
      />

      <PricingSection
        eyebrow="Class Packages"
        heading="Choose a simple class pack."
        body="The 3-Class and 6-Class packages are configured and ready for Veora to add the final price and validity before activation."
        options={pricing.packages}
        ctaType="book"
      />

      <PricingSection
        eyebrow="Unlimited Memberships"
        heading="Make Veora part of your routine."
        body="Six- and twelve-month unlimited memberships are prepared in the system. Final prices and membership policies will be published once confirmed."
        options={pricing.memberships}
        ctaType="book"
      />

      <AmenitiesSection />

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
