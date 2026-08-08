"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: React.ReactNode;
  className?: string;
  /** Maximum tilt rotation in degrees. Kept small to stay understated. */
  maxTilt?: number;
};

const SPRING = { stiffness: 200, damping: 22, mass: 0.6 };

export function TiltCard({ children, className, maxTilt = 6 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(pointerY, [0, 1], [maxTilt, -maxTilt]), SPRING);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-maxTilt, maxTilt]), SPRING);
  const scale = useSpring(1, SPRING);
  const glareX = useTransform(pointerX, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(pointerY, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    // Browser-only capability check (hover-capable pointer, no reduced-motion
    // preference) that isn't knowable during SSR — this is a one-time sync
    // with `window` on mount, not state derived from props/render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    pointerX.set((event.clientX - rect.left) / rect.width);
    pointerY.set((event.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    pointerX.set(0.5);
    pointerY.set(0.5);
    scale.set(1);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={enabled ? handleMouseMove : undefined}
      onMouseEnter={enabled ? () => scale.set(1.015) : undefined}
      onMouseLeave={enabled ? handleMouseLeave : undefined}
      style={enabled ? { rotateX, rotateY, scale, transformPerspective: 1000 } : undefined}
      className={cn("group relative", className)}
    >
      {children}
      {enabled && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.16), transparent 60%)`,
          }}
        />
      )}
    </motion.div>
  );
}
