import { Star } from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { siteConfig } from "@/data/site";

export function SocialProof() {
  return (
    <AnimatedSection className="border-b border-charcoal/10 bg-cream/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-6 py-10 text-center sm:px-8 lg:px-12">
        <div className="flex gap-1 text-clay" aria-hidden>
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} size={16} fill="currentColor" strokeWidth={0} />
          ))}
        </div>
        <p className="text-sm uppercase tracking-[0.18em] text-charcoal/60">
          Loved by the {siteConfig.shortName} community
        </p>
      </div>
    </AnimatedSection>
  );
}
