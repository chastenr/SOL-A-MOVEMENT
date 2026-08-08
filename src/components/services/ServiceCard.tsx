import { ArrowUpRight } from "lucide-react";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { Button } from "@/components/ui/Button";
import type { Service } from "@/data/services";
import { cn } from "@/lib/utils";

type ServiceCardProps = {
  service: Service;
  variant?: "compact" | "detailed";
  className?: string;
};

export function ServiceCard({ service, variant = "compact", className }: ServiceCardProps) {
  if (variant === "detailed") {
    return (
      <article
        id={service.slug}
        className={cn(
          "group grid scroll-mt-28 gap-8 border-b border-charcoal/10 pb-12 sm:grid-cols-5 sm:gap-10",
          className
        )}
      >
        <ImageReveal
          src={service.image.src}
          alt={service.image.alt}
          width={640}
          height={480}
          hoverScale
          containerClassName="sm:col-span-2 aspect-[4/3] rounded-2xl"
          sizes="(min-width: 640px) 40vw, 100vw"
        />
        <div className="flex flex-col sm:col-span-3">
          <p className="text-xs uppercase tracking-[0.2em] text-clay">{service.category}</p>
          <h3 className="font-display mt-3 text-3xl text-charcoal sm:text-4xl">{service.name}</h3>
          <p className="mt-4 max-w-lg text-charcoal/70">{service.description}</p>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-charcoal/60">
            <div className="flex gap-2">
              <dt className="uppercase tracking-[0.1em] text-charcoal/40">Duration</dt>
              <dd>{service.duration}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="uppercase tracking-[0.1em] text-charcoal/40">Level</dt>
              <dd>{service.level}</dd>
            </div>
            {service.instructor && (
              <div className="flex gap-2">
                <dt className="uppercase tracking-[0.1em] text-charcoal/40">Instructor</dt>
                <dd>{service.instructor}</dd>
              </div>
            )}
          </dl>

          <div className="mt-8">
            <Button href={`/book?service=${service.slug}`}>Book</Button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group flex flex-col", className)}>
      <ImageReveal
        src={service.image.src}
        alt={service.image.alt}
        width={480}
        height={360}
        hoverScale
        containerClassName="aspect-[4/5] rounded-2xl"
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
      />
      <h3 className="font-display mt-6 text-2xl text-charcoal">{service.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/65">{service.shortDescription}</p>
      <a
        href={`/services#${service.slug}`}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.15em] text-charcoal/70 transition-colors group-hover:text-clay"
      >
        Learn more
        <ArrowUpRight size={14} aria-hidden />
      </a>
    </article>
  );
}
