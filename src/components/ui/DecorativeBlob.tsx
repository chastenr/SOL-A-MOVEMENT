import { cn } from "@/lib/utils";

type DecorativeBlobProps = {
  className?: string;
  tone?: "sand" | "clay" | "stone";
};

const toneStyles = {
  sand: "bg-sand/40",
  clay: "bg-clay/20",
  stone: "bg-stone/40",
};

/**
 * A very subtle blurred, warm-toned shape used to add ambient depth behind a
 * section without introducing any bright color, gradient noise or literal
 * 3D geometry. Pure CSS (respects prefers-reduced-motion globally).
 */
export function DecorativeBlob({ className, tone = "sand" }: DecorativeBlobProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl animate-float-slow",
        toneStyles[tone],
        className
      )}
    />
  );
}
