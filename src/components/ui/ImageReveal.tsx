"use client";

import Image, { type ImageProps } from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ImageRevealProps = Omit<ImageProps, "className"> & {
  containerClassName?: string;
  imageClassName?: string;
  hoverScale?: boolean;
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function ImageReveal({
  containerClassName,
  imageClassName,
  hoverScale = false,
  alt,
  quality = 92,
  ...imageProps
}: ImageRevealProps) {
  return (
    <motion.div
      className={cn("relative overflow-hidden", containerClassName)}
      initial={{ clipPath: "inset(100% 0 0 0)" }}
      whileInView={{ clipPath: "inset(0% 0 0 0)" }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1, ease: EASE }}
    >
      <motion.div
        className="relative h-full w-full"
        // A smaller reveal zoom keeps the cinematic movement without briefly
        // stretching a responsive raster image far beyond its rendered size.
        initial={{ scale: 1.06 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        whileHover={hoverScale ? { scale: 1.025 } : undefined}
        transition={{ duration: 1.1, ease: EASE }}
      >
        <Image
          {...imageProps}
          alt={alt}
          quality={quality}
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      </motion.div>
    </motion.div>
  );
}
