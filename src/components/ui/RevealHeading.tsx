"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type RevealHeadingProps = {
  lines: string[];
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3";
};

/**
 * Masked line-by-line reveal for large, high-impact headings (hero-scale only).
 *
 * The `whileInView` trigger lives on the OUTER `overflow-hidden` mask, not the
 * inner line that actually moves — that mask never transforms and is always
 * fully exposed in normal layout, so it's reliably detected as in-view.
 * Putting the trigger on the inner span instead (as this used to) doesn't
 * work: whileInView's IntersectionObserver correctly respects ancestor
 * overflow clipping, and the inner span's own `initial` state starts
 * translated below the mask — i.e., already fully clipped out — so it can
 * never be observed as intersecting and the reveal never fires. The inner
 * span has no trigger of its own; it inherits the mask's "hidden"/"visible"
 * state via matching variant names, same propagation pattern as
 * StaggerContainer/StaggerItem above.
 */
export function RevealHeading({ lines, className, delay = 0, as: Tag = "h1" }: RevealHeadingProps) {
  return (
    <Tag className={className} data-no-text-reveal>
      {lines.map((line, index) => (
        <motion.span
          key={line}
          className="block overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10% 0px" }}
        >
          <motion.span
            className={cn("block")}
            variants={{ hidden: { y: "110%" }, visible: { y: "0%" } }}
            transition={{ duration: 0.9, ease: EASE, delay: delay + index * 0.1 }}
          >
            {line}
          </motion.span>
        </motion.span>
      ))}
    </Tag>
  );
}
