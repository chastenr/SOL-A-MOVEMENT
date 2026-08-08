"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { services } from "@/data/services";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ServiceSelectorProps = {
  value?: string;
  onSelect: (slug: string) => void;
  onContinue: () => void;
};

export function ServiceSelector({ value, onSelect, onContinue }: ServiceSelectorProps) {
  return (
    <div>
      <h2 className="font-display text-3xl text-charcoal sm:text-4xl">Select a service</h2>
      <p className="mt-2 text-charcoal/60">Choose the session you would like to book.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {services.map((service) => {
          const isSelected = value === service.slug;
          return (
            <button
              key={service.slug}
              type="button"
              onClick={() => onSelect(service.slug)}
              aria-pressed={isSelected}
              className={cn(
                "group relative flex gap-4 rounded-2xl border p-4 text-left transition-colors duration-300",
                isSelected ? "border-charcoal bg-cream/50" : "border-charcoal/10 hover:border-charcoal/30"
              )}
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={service.image.src}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.14em] text-clay">{service.category}</p>
                <p className="font-display mt-1 text-xl text-charcoal">{service.name}</p>
                <p className="mt-1 text-sm text-charcoal/60">{service.duration}</p>
              </div>
              <span
                className={cn(
                  "absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border transition-colors duration-300",
                  isSelected ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/20 text-transparent"
                )}
                aria-hidden
              >
                <Check size={14} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex justify-end">
        <Button type="button" size="lg" disabled={!value} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
