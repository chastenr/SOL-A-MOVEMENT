import { cn } from "@/lib/utils";

type SectionLabelProps = {
  index?: string;
  label: string;
  tone?: "dark" | "light";
  className?: string;
};

/** Editorial kicker — small index numeral + hairline + label, used to give
 * homepage sections a numbered, catalog-like rhythm instead of icon badges. */
export function SectionLabel({ index, label, tone = "dark", className }: SectionLabelProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        tone === "dark" ? "text-charcoal/70" : "text-ivory/80",
        className
      )}
    >
      {index && <span className="font-display text-sm italic text-clay">{index}</span>}
      <span className="h-px w-8 bg-current opacity-40" aria-hidden />
      <span className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
}
