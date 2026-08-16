import { Check } from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { Button } from "@/components/ui/Button";
import type { PricingOption } from "@/data/pricing";
import { cn } from "@/lib/utils";

type PricingCardProps = {
  option: PricingOption;
  ctaType: "book" | "inquire";
  className?: string;
};

export function PricingCard({ option, ctaType, className }: PricingCardProps) {
  // "book" options are real credit packages — availing one goes through
  // checkout (auth + phone verification gated there). "inquire" (studio
  // rentals) still routes to contact.
  const ctaHref = ctaType === "book" ? `/checkout/${option.slug}` : `/contact?topic=Studio+Rental`;

  return (
    <TiltCard
      maxTilt={3}
      className={cn(
        "h-full rounded-2xl border bg-ivory p-8",
        option.recommended ? "border-clay/50 shadow-[0_20px_45px_-24px_rgba(169,116,86,0.4)]" : "border-charcoal/10",
        className
      )}
    >
      {option.recommended && (
        <span className="absolute -top-3 left-8 rounded-full bg-clay px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-ivory">
          {option.recommendedLabel ?? "Most Popular"}
        </span>
      )}
      <div className="flex h-full flex-col">
        <p className="font-display text-xl text-charcoal">{option.name}</p>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-4xl text-charcoal">{option.price}</span>
          {option.originalPrice && (
            <span className="text-sm text-charcoal/40 line-through">{option.originalPrice}</span>
          )}
        </div>
        <p className="mt-1 text-xs uppercase tracking-[0.1em] text-charcoal/45">{option.validity}</p>

        <p className="mt-5 text-base leading-[1.7] text-charcoal/75">{option.description}</p>

        <ul className="mt-5 space-y-2">
          {option.includedServices.map((item) => (
            <li key={item} className="flex items-start gap-2 text-base leading-relaxed text-charcoal/75">
              <Check size={15} className="mt-0.5 shrink-0 text-clay" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {option.conditions && option.conditions.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-charcoal/10 pt-4">
            {option.conditions.map((condition) => (
              <li key={condition} className="text-sm leading-relaxed text-charcoal/70">
                {condition}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex-1" />

        <Button href={ctaHref} className="mt-6 w-full">
          {ctaType === "book" ? "Avail Package" : "Inquire About This Package"}
        </Button>
      </div>
    </TiltCard>
  );
}
