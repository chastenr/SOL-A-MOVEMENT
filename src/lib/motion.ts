"use client";

import { useEffect, useState } from "react";
import type { Variants } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: EASE } },
};

export const scaleReveal: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE } },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

export const staggerItem: Variants = fadeUp;

/**
 * True only for pointer-fine, hover-capable displays with no reduced-motion
 * preference — gates every pointer-tracked (tilt/magnetic/parallax) effect
 * in the app so touch devices and accessibility preferences get the plain,
 * static presentation instead.
 */
export function usePointerCapability(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Browser-only capability check that isn't knowable during SSR — a
    // one-time sync with `window` on mount, not state derived from render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  return enabled;
}

/**
 * True when the user has requested reduced motion — unlike
 * usePointerCapability, this is not tied to hover/pointer support, so it
 * still applies on touch devices (e.g. gating autoplaying background video).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return reduced;
}
