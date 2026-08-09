"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { siteConfig } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { EASE, usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useAuthState } from "@/lib/auth/use-auth-state";

// Modeled on a reference navbar's actual shipped behavior (inspected via its
// live HTML/CSS/JS, not guessed): there is no scroll-triggered state change
// at all — the pill is a permanent semi-transparent, blurred glass shape
// from the very first frame, on every route. The "premium" feeling comes
// entirely from a one-time staggered reveal on load, not from resizing on
// scroll. That's what's reproduced here — no scroll listener, no re-renders
// tied to scroll position, and (as a side effect) no more "washed out over a
// bright hero frame" risk, since the pill's own background always supplies
// its contrast regardless of what's behind it.
const pillVariants: Variants = {
  hidden: { opacity: 0, y: -28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE, staggerChildren: 0.07, delayChildren: 0.15 },
  },
};

const fromLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
};

const fromTop: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const fromRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
};

// A user who requested reduced motion still gets the reveal (so the navbar
// doesn't just pop in with a jarring flash of unstyled content), just
// without any slide — opacity only, near-instant, no stagger.
const reducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const { signedIn } = useAuthState();
  const reduceMotion = usePrefersReducedMotion();

  const pillMotion = reduceMotion ? reducedVariants : pillVariants;
  const leftMotion = reduceMotion ? reducedVariants : fromLeft;
  const topMotion = reduceMotion ? reducedVariants : fromTop;
  const rightMotion = reduceMotion ? reducedVariants : fromRight;

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  // The admin dashboard is its own product surface with its own chrome (see
  // admin/(protected)/layout.tsx) — it doesn't share the public navbar.
  if (pathname.startsWith("/admin") || pathname === "/maintenance") return null;

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={pillMotion}
          className="pointer-events-auto mx-auto flex h-[3.75rem] max-w-7xl items-center justify-between gap-3 rounded-full border border-ivory/10 bg-walnut/55 px-4 shadow-[0_10px_40px_-18px_rgba(20,14,10,0.55)] backdrop-blur-xl sm:h-[4.25rem] sm:px-6"
        >
          <motion.div variants={leftMotion} className="min-w-0">
            <Link href="/" className="flex shrink-0 items-center gap-2 text-ivory">
              <Image
                src="/veora-mark.png"
                alt=""
                width={342}
                height={360}
                priority
                className="h-7 w-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)] sm:h-8"
              />
              <span className="font-display text-lg tracking-[0.06em] sm:text-xl">
                {siteConfig.shortName}
              </span>
              <span className="ml-1 hidden text-[10px] font-sans font-normal uppercase tracking-[0.22em] text-ivory/55 sm:inline">
                Wellness Studio
              </span>
            </Link>
          </motion.div>

          <nav className="hidden items-center gap-5 xl:flex">
            {siteConfig.nav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <motion.div key={item.href} variants={topMotion}>
                  <Link
                    href={item.href}
                    className={cn(
                      "relative py-1 text-[11px] uppercase tracking-[0.2em] transition-[color,transform] duration-300 hover:-translate-y-[1px]",
                      isActive ? "text-ivory" : "text-ivory/60 hover:text-ivory"
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-indicator"
                        className="absolute -bottom-1 left-0 right-0 h-px bg-clay"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <motion.div variants={rightMotion} className="flex items-center gap-2">
            <Link
              href={signedIn ? "/account" : "/login"}
              className="hidden shrink-0 text-[11px] uppercase tracking-[0.2em] text-ivory/60 transition-colors duration-300 hover:text-ivory xl:inline"
            >
              {signedIn ? "My Account" : "Login"}
            </Link>

            <div className="hidden shrink-0 xl:block">
              <Button
                href="/book"
                magnetic
                className="border-ivory/50 px-5 py-2.5 text-[0.68rem] text-ivory hover:border-ivory hover:bg-ivory hover:text-charcoal"
                variant="secondary"
              >
                {siteConfig.bookingCtaLabel}
              </Button>
            </div>

            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
              className="relative z-50 flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[5px] rounded-full border border-ivory/20 bg-ivory/5 xl:hidden"
            >
              <span className="sr-only">Menu</span>
              <motion.span
                animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 5 : 0 }}
                className="h-px w-4 bg-ivory shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                transition={{ duration: 0.3 }}
              />
              <motion.span
                animate={{ opacity: mobileOpen ? 0 : 1 }}
                className="h-px w-4 bg-ivory shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                transition={{ duration: 0.2 }}
              />
              <motion.span
                animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -5 : 0 }}
                className="h-px w-4 bg-ivory shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                transition={{ duration: 0.3 }}
              />
            </button>
          </motion.div>
        </motion.div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} signedIn={signedIn} />
    </>
  );
}
