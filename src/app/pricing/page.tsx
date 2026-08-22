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
  const infratoneMemberships = pricing.memberships.filter(
    (option) => option.serviceSlug === "recovery-restore"
  );
  const veoraMemberships = pricing.memberships.filter(
    (option) => option.serviceSlug !== "recovery-restore"
  );
  const infratoneOptions = [...pricing.singleSessions, ...infratoneMemberships];

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pt-40 pb-8 sm:px-8 lg:px-12">
        <AnimatedSection>
          <SectionHeading
            as="h1"
            eyebrow="Pricing"
            heading="Move in a way that works for you."
            body="Choose from Discovery, class-credit packages, monthly memberships and dedicated Infratone options."
          />
        </AnimatedSection>
      </section>

      <PricingSection
        eyebrow="Discovery Pass"
        heading="Your first Veora class for ₱999."
        body="The Discovery Pass keeps its existing introductory price and is not included in the September pre-opening promotion."
        options={pricing.introOffers}
        ctaType="book"
      />

      <PricingSection
        eyebrow="Class Packages"
        heading="Choose the rhythm that works for you."
        body="Veora Essence includes 3 classes and Veora Flow includes 6. The 9% pre-opening prices apply during September only."
        options={pricing.packages}
        ctaType="book"
      />

      <PricingSection
        eyebrow="Unlimited Memberships"
        heading="Make Veora part of your routine."
        body="Veora Unlimited, Signature and Prestige receive 9% off during September. Memberships are paid monthly, personal, non-transferable and limited to one class per calendar day."
        options={veoraMemberships}
        ctaType="book"
      />

      <PricingSection
        eyebrow="Infratone"
        heading="Dedicated Infratone options."
        body="Choose an introductory session or unlimited access. Infratone packages keep their regular prices and are not included in the September promotion."
        options={infratoneOptions}
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
