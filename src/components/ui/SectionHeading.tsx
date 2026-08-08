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
            "mb-4 text-xs font-medium uppercase tracking-[0.22em]",
            tone === "dark" ? "text-clay" : "text-cream"
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "font-display balance text-4xl leading-[1.1] sm:text-5xl md:text-6xl",
          tone === "dark" ? "text-charcoal" : "text-ivory"
        )}
      >
        {heading}
      </h2>
      {body && (
        <p
          className={cn(
            "mt-6 text-base leading-relaxed sm:text-lg",
            tone === "dark" ? "text-charcoal/70" : "text-ivory/80"
          )}
        >
          {body}
        </p>
      )}
    </div>
  );
}
