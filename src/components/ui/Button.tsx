"use client";

import Link from "next/link";
import { forwardRef, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePointerCapability } from "@/lib/motion";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-charcoal text-ivory hover:bg-clay",
  secondary: "bg-transparent text-charcoal border border-charcoal/30 hover:border-charcoal",
  ghost: "bg-transparent text-charcoal hover:text-clay",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 py-2.5 text-xs",
  lg: "min-h-12 px-7 py-3.5 text-[0.8125rem]",
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-[0.14em] transition-colors duration-300 ease-out disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay";

type ButtonOwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /**
   * Subtle pointer-follow nudge (a few px, spring-smoothed). Reserve this for
   * a page's one or two primary CTAs — it's intentionally not the default.
   */
  magnetic?: boolean;
};

type ButtonAsButton = ButtonOwnProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = ButtonOwnProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const MAGNETIC_PULL = 10;
const MAGNETIC_SPRING = { stiffness: 200, damping: 18, mass: 0.4 };

function MagneticWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const enabled = usePointerCapability();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, MAGNETIC_SPRING);
  const springY = useSpring(y, MAGNETIC_SPRING);

  function handleMouseMove(event: React.MouseEvent<HTMLSpanElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const relY = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    x.set(relX * MAGNETIC_PULL);
    y.set(relY * MAGNETIC_PULL);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      ref={ref}
      onMouseMove={enabled ? handleMouseMove : undefined}
      onMouseLeave={enabled ? handleMouseLeave : undefined}
      style={enabled ? { x: springX, y: springY } : undefined}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, magnetic = false, ...props }, ref) => {
    const classes = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

    const content =
      props.href !== undefined ? (
        (() => {
          const { href, ...anchorProps } = props;
          return (
            <Link
              ref={ref as React.Ref<HTMLAnchorElement>}
              href={href}
              className={classes}
              {...anchorProps}
            />
          );
        })()
      ) : (
        <button ref={ref as React.Ref<HTMLButtonElement>} className={classes} {...props} />
      );

    return magnetic ? <MagneticWrapper>{content}</MagneticWrapper> : content;
  }
);

Button.displayName = "Button";
