import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  heading: React.ReactNode;
  body?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  tone?: "dark" | "light";
};

export function SectionHeading({
  eyebrow,
  heading,
  body,
  align = "left",
  className,
  tone = "dark",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "mb-3 text-[11px] font-medium uppercase tracking-[0.22em]",
            tone === "dark" ? "text-clay" : "text-cream"
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "font-display balance text-3xl leading-[1.15] sm:text-4xl md:text-5xl",
          tone === "dark" ? "text-charcoal" : "text-ivory"
        )}
      >
        {heading}
      </h2>
      {body && (
        <p
          className={cn(
            "mt-4 text-[15px] leading-relaxed sm:text-base",
            tone === "dark" ? "text-charcoal/70" : "text-ivory/80"
          )}
        >
          {body}
        </p>
      )}
    </div>
  );
}
