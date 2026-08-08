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

/** Masked line-by-line reveal for large, high-impact headings (hero-scale only). */
export function RevealHeading({ lines, className, delay = 0, as: Tag = "h1" }: RevealHeadingProps) {
  return (
    <Tag className={className}>
      {lines.map((line, index) => (
        <span key={line} className="block overflow-hidden">
          <motion.span
            className={cn("block")}
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.9, ease: EASE, delay: delay + index * 0.1 }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
