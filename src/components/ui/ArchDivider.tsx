import { cn } from "@/lib/utils";

type ArchDividerProps = {
  /** Tailwind text-color class applied to the curve (fill uses currentColor). */
  className?: string;
  flip?: boolean;
};

/**
 * A single, gentle architectural curve used to transition between two
 * section backgrounds — the digital equivalent of the studio's curved
 * reception wall. Used sparingly (once or twice a page) per the brief.
 */
export function ArchDivider({ className, flip = false }: ArchDividerProps) {
  return (
    <div className={cn("relative h-10 w-full overflow-hidden sm:h-16", className)} aria-hidden>
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className={cn("h-full w-full text-current", flip && "rotate-180")}
      >
        <path d="M0,100 C 480,0 960,0 1440,100 L1440,100 L0,100 Z" fill="currentColor" />
      </svg>
    </div>
  );
}
