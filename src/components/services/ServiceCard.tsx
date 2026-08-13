import { ArrowRight, ArrowUpRight, Check, ChevronDown, Clock3, Sparkles } from "lucide-react";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { Button } from "@/components/ui/Button";
import type { Service } from "@/data/services";
import { cn } from "@/lib/utils";

type ServiceCardProps = {
  service: Service;
  variant?: "compact" | "detailed";
  className?: string;
  priority?: boolean;
};

export function ServiceCard({ service, variant = "compact", className, priority = false }: ServiceCardProps) {
  const variantGroups = service.classVariants
    ? service.category === "Recovery & Restore"
      ? [
          { label: "Heated Classes", items: service.classVariants.filter((name) => name.startsWith("Heated ")) },
          { label: "Red Light Therapy", items: service.classVariants.filter((name) => name.startsWith("Red Light + ")) },
        ]
      : [{ label: "Classes Offered", items: service.classVariants }]
    : [];

  if (variant === "detailed") {
    const optionCount = service.classVariants?.length ?? 0;

    return (
      <article
        id={service.slug}
        className={cn(
          "group flex h-full scroll-mt-36 flex-col overflow-hidden rounded-[1.75rem] border border-charcoal/10 bg-white/60 shadow-[0_18px_55px_-42px_rgba(34,31,28,0.65)] transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1 hover:border-clay/30 hover:shadow-[0_26px_65px_-38px_rgba(77,56,44,0.42)]",
          className
        )}
      >
        <div className="relative">
          <ImageReveal
            src={service.image.src}
            alt={service.image.alt}
            width={720}
            height={480}
            priority={priority}
            hoverScale
            containerClassName="aspect-[3/2]"
            sizes="(min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-charcoal/40 to-transparent" />
          <p className="absolute bottom-4 left-5 rounded-full border border-white/30 bg-charcoal/45 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-md">
            {service.category}
          </p>
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <h3 className="font-display text-[2rem] leading-none text-charcoal sm:text-4xl">{service.name}</h3>
          <p className="mt-4 text-sm leading-relaxed text-charcoal/65">{service.description}</p>

          <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-cream/65 px-3.5 py-3">
              <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-charcoal/40">
                <Clock3 size={13} aria-hidden /> Duration
              </dt>
              <dd className="mt-1.5 text-xs leading-snug text-charcoal/75">{service.duration}</dd>
            </div>
            <div className="rounded-xl bg-cream/65 px-3.5 py-3">
              <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-charcoal/40">
                <Check size={13} aria-hidden /> Level
              </dt>
              <dd className="mt-1.5 text-xs leading-snug text-charcoal/75">{service.level}</dd>
            </div>
          </dl>

          {service.benefits && service.benefits.length > 0 && (
            <div className="mt-4 rounded-2xl border border-clay/15 bg-clay/[0.06] p-4">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-clay">
                <Sparkles size={13} aria-hidden /> Benefits
              </p>
              <ul className="mt-3 space-y-2.5" aria-label={`${service.name} benefits`}>
                {service.benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-2.5 text-xs leading-relaxed text-charcoal/70">
                    <Check size={14} className="mt-0.5 shrink-0 text-clay" strokeWidth={2} aria-hidden />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {variantGroups.length > 0 && (
            <details className="group/options mt-4 border-y border-charcoal/10 py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-xs font-medium uppercase tracking-[0.13em] text-charcoal/65 marker:content-none">
                <span>{optionCount} class {optionCount === 1 ? "option" : "options"}</span>
                <ChevronDown
                  size={16}
                  className="shrink-0 text-clay transition-transform duration-300 group-open/options:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="space-y-4 pb-4">
                {variantGroups.map((group) => (
                  <div key={group.label}>
                    {variantGroups.length > 1 && (
                      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-charcoal/40">
                        {group.label}
                      </p>
                    )}
                    <ul className="flex flex-wrap gap-1.5" aria-label={`${service.name} — ${group.label}`}>
                      {group.items.map((name) => (
                        <li key={name} className="rounded-full border border-charcoal/10 bg-cream/45 px-2.5 py-1.5 text-[11px] leading-tight text-charcoal/65">
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          )}

          <div className="mt-auto pt-6">
            {service.startingPrice && (
              <p className="mb-3 text-xs text-charcoal/55">
                <span className="font-medium text-charcoal">{service.startingPrice}</span>
              </p>
            )}
            <a href={`/services/${service.slug}`} className="mb-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.13em] text-clay transition-colors hover:text-walnut">
              Class details <ArrowUpRight size={14} aria-hidden />
            </a>
            <Button href={`/book?service=${service.slug}`} className="w-full justify-between px-6 py-3.5">
              Book this class
              <ArrowRight size={16} aria-hidden />
            </Button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group flex flex-col", className)}>
      <TiltCard maxTilt={4} className="aspect-[4/3] overflow-hidden rounded-lg">
        <ImageReveal
          src={service.image.src}
          alt={service.image.alt}
          width={480}
          height={360}
          priority={priority}
          hoverScale
          containerClassName="h-full w-full"
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
        />
      </TiltCard>
      <h3 className="font-display mt-4 text-xl text-charcoal">{service.name}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-charcoal/65">{service.shortDescription}</p>
      <a
        href={`/services/${service.slug}`}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.15em] text-charcoal/70 transition-colors group-hover:text-clay"
      >
        Learn more
        <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </a>
    </article>
  );
}
