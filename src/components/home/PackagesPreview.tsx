import { getPricingGroups } from "@/lib/catalog/packages";
import type { PricingOption } from "@/data/pricing";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";

function pickFeatured(groups: Awaited<ReturnType<typeof getPricingGroups>>): PricingOption[] {
  const all = [...groups.introOffers, ...groups.singleSessions, ...groups.packages].filter(
    (option) => option.available !== false
  );
  const recommended = all.filter((option) => option.recommended);
  if (recommended.length >= 2) return recommended.slice(0, 2);
  return all.slice(0, 2);
}

export async function PackagesPreview() {
  const groups = await getPricingGroups();
  const featured = pickFeatured(groups);

  if (featured.length === 0) return null;

  return (
    <section className="bg-ivory py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <AnimatedSection className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <SectionLabel index="05" label="Packages" className="mb-5" />
            <SectionHeading heading="Begin with one class." body="Try the pre-opening Intro Pass, then explore the packages being prepared for launch." />
          </div>
          <Button href="/pricing" variant="secondary" className="shrink-0">
            View All Pricing
          </Button>
        </AnimatedSection>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {featured.map((option) => (
            <AnimatedSection key={option.slug} delay={0.06}>
              <div className="flex h-full flex-col rounded-2xl border border-charcoal/10 bg-cream/30 p-8">
                {option.recommended && (
                  <span className="mb-4 w-fit rounded-full bg-clay px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-ivory">
                    {option.recommendedLabel ?? "Most Popular"}
                  </span>
                )}
                <p className="font-display text-xl text-charcoal">{option.name}</p>
                <p className="mt-2 text-base leading-[1.65] text-charcoal/75">{option.description}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-4xl text-charcoal">{option.price}</span>
                  {option.originalPrice && (
                    <span className="text-sm text-charcoal/40 line-through">{option.originalPrice}</span>
                  )}
                </div>
                {option.sessions && (
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-charcoal/45">
                    {option.sessions} {option.sessions === 1 ? "class" : "classes"}
                  </p>
                )}
                <div className="mt-6 flex-1" />
                <Button href={`/checkout/${option.slug}`} variant="secondary" className="w-full">
                  Choose Package
                </Button>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
