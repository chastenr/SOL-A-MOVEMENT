import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  heading: React.ReactNode;
  body?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  tone?: "dark" | "light";
  as?: "h1" | "h2" | "h3";
};

export function SectionHeading({
  eyebrow,
  heading,
  body,
  align = "left",
  className,
  tone = "dark",
  as: HeadingTag = "h2",
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
            "mb-4 text-xs font-semibold uppercase tracking-[0.2em]",
            tone === "dark" ? "text-clay" : "text-cream"
          )}
        >
          {eyebrow}
        </p>
      )}
      <HeadingTag
        className={cn(
          "font-display balance tracking-[-0.02em]",
          HeadingTag === "h1" && "text-[clamp(2.5rem,5vw,4.75rem)] leading-[1.02]",
          HeadingTag === "h2" && "text-[clamp(2.25rem,4vw,3.75rem)] leading-[1.08]",
          HeadingTag === "h3" && "text-[clamp(1.5rem,2.5vw,2.25rem)] leading-[1.15]",
          tone === "dark" ? "text-charcoal" : "text-ivory"
        )}
      >
        {heading}
      </HeadingTag>
      {body && (
        <p
          className={cn(
            "mt-5 text-base leading-[1.7] sm:text-[1.0625rem]",
            tone === "dark" ? "text-charcoal/70" : "text-ivory/80"
          )}
        >
          {body}
        </p>
      )}
    </div>
  );
}
