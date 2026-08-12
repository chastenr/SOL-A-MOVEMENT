"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sparkle } from "lucide-react";
import { LayoutGroup, motion, type Variants } from "framer-motion";
import { siteConfig } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { EASE, usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useAuthState } from "@/lib/auth/use-auth-state";

// Modeled on a reference navbar's actual shipped behavior (inspected via its
// live HTML/CSS/JS, not guessed): there is no scroll-triggered state change
// at all — the pill stays a semi-transparent, blurred glass shape on every
// route. Each completed page navigation intentionally remounts this motion
// wrapper so the full navbar smoothly fades in and settles down again.
const pillVariants: Variants = {
  hidden: { opacity: 0, y: -36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: EASE, staggerChildren: 0.08, delayChildren: 0.18 },
  },
};

const fromLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE } },
};

const fromTop: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
};

const fromRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE } },
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
  if (pathname.startsWith("/admin") || pathname === "/site-locked") return null;

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
        <motion.div
          key={pathname}
          initial="hidden"
          animate="visible"
          variants={pillMotion}
          className="pointer-events-auto mx-auto flex h-[4.75rem] max-w-7xl items-center justify-between gap-3 rounded-full border border-ivory/10 bg-walnut/55 px-4 shadow-[0_10px_40px_-18px_rgba(20,14,10,0.55)] backdrop-blur-xl sm:h-[5.5rem] sm:px-6"
        >
          <motion.div
            variants={leftMotion}
            className="absolute left-1/2 min-w-0 xl:static"
          >
            <Link
              href="/"
              className="flex -translate-x-1/2 shrink-0 items-center gap-3 text-ivory xl:translate-x-0"
            >
              <Image
                src="/veora-mark.png"
                alt=""
                width={608}
                height={676}
                priority
                quality={100}
                // The source art is brown (matches the logo everywhere it sits
                // on a light background) — this pill is dark, so it's forced
                // to ivory here the same way the taupe mark it replaced was
                // deliberately light-colored for the same reason.
                className="h-9 w-auto brightness-0 invert drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)] sm:h-10"
              />
              <div className="flex flex-col items-center gap-1">
                <Image
                  src="/veora-wordmark.png"
                  alt={siteConfig.shortName}
                  width={1218}
                  height={189}
                  priority
                  quality={100}
                  className="h-4 w-auto brightness-0 invert drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)] sm:h-[1.1rem]"
                />
                <div className="flex items-center gap-1.5">
                  <span className="h-px w-4 bg-ivory/40 sm:w-5" />
                  <Sparkle className="h-2.5 w-2.5 shrink-0 text-ivory/70" strokeWidth={1.5} />
                  <span className="h-px w-4 bg-ivory/40 sm:w-5" />
                </div>
                <p className="whitespace-nowrap text-[8px] font-medium uppercase tracking-[0.22em] text-ivory/60 sm:text-[9px]">
                  Move. Flow. Dance.
                </p>
                <p className="whitespace-nowrap text-[6px] uppercase tracking-[0.18em] text-ivory/40 sm:text-[7px] sm:tracking-[0.22em]">
                  Where Movement Becomes Ritual
                </p>
              </div>
            </Link>
          </motion.div>

          <LayoutGroup id="primary-navigation">
            <nav
              className="hidden items-center gap-5 xl:flex"
              aria-label="Primary navigation"
            >
              {siteConfig.nav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.href}
                    variants={topMotion}
                    whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  >
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "relative block px-1 py-2 text-[11px] uppercase tracking-[0.2em] transition-[color,transform] duration-300 hover:-translate-y-px",
                        isActive ? "text-ivory" : "text-ivory/55 hover:text-ivory"
                      )}
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active-indicator"
                          className="absolute inset-x-1 bottom-0 h-px bg-ivory/75 shadow-[0_1px_5px_rgba(250,247,242,0.45)]"
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 360, damping: 30, mass: 0.7 }
                          }
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </LayoutGroup>

          <motion.div variants={rightMotion} className="ml-auto flex items-center gap-2 xl:ml-0">
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
