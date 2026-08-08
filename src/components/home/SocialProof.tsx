import { MapPin } from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

export function SocialProof() {
  return (
    <AnimatedSection className="border-b border-charcoal/10 bg-cream/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-6 py-10 text-center sm:px-8 lg:px-12">
        <MapPin className="text-clay" size={20} aria-hidden />
        <p className="text-sm uppercase tracking-[0.18em] text-charcoal/60">
          Opening soon in Bacoor, Cavite
        </p>
      </div>
    </AnimatedSection>
  );
}
