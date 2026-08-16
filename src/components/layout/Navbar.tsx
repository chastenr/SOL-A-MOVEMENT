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
import { MobileDock } from "@/components/layout/MobileDock";
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
      <header className="font-navbar pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
        <motion.div
          key={pathname}
          initial="hidden"
          animate="visible"
          variants={pillMotion}
          className={cn(
            "pointer-events-auto relative mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 rounded-full border px-4 backdrop-blur-xl sm:h-[5.25rem] sm:px-6 xl:h-[5.5rem]",
            mobileOpen
              ? "border-ivory/20 bg-charcoal/95 shadow-none"
              : "border-ivory/10 bg-walnut/65 shadow-[0_10px_40px_-18px_rgba(20,14,10,0.55)]"
          )}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 xl:hidden">
            <motion.div variants={leftMotion} className="min-w-0">
              <Link href="/" aria-label="Veora Wellness home" className="flex shrink-0 items-center gap-3 text-ivory">
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
                className="h-9 w-auto brightness-0 invert drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)] sm:h-10"
              />
              <div className="flex min-w-0 flex-col items-center gap-1">
                <Image
                  src="/veora-wordmark.png"
                  alt={siteConfig.shortName}
                  width={1218}
                  height={189}
                  priority
                  quality={100}
                  className="h-4 w-auto brightness-0 invert drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)] sm:h-[1.1rem]"
                />
                <p className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.24em] text-ivory/75">
                  Wellness
                </p>
              </div>
              </Link>
            </motion.div>
          </div>

          <motion.div variants={leftMotion} className="hidden min-w-0 xl:block">
            <Link href="/" aria-label="Veora Wellness home" className="flex shrink-0 items-center gap-2 text-ivory">
              <Image
                src="/veora-mark.png"
                alt=""
                width={608}
                height={676}
                priority
                quality={100}
                className="h-7 w-auto brightness-0 invert drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
              />
              <div className="flex flex-col items-center gap-0.5">
                <Image
                  src="/veora-wordmark.png"
                  alt={siteConfig.shortName}
                  width={1218}
                  height={189}
                  priority
                  quality={100}
                  className="h-3.5 w-auto brightness-0 invert drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
                />
                <div className="flex items-center gap-1.5" aria-hidden>
                  <span className="h-px w-4 bg-ivory/40" />
                  <Sparkle className="h-2 w-2 shrink-0 text-ivory/70" strokeWidth={1.5} />
                  <span className="h-px w-4 bg-ivory/40" />
                </div>
                <p className="whitespace-nowrap text-[8px] font-bold uppercase leading-none tracking-[0.1em] text-ivory drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                  Move. Flow. Dance.
                </p>
                <p className="whitespace-nowrap text-[7px] font-semibold uppercase leading-none tracking-[0.06em] text-ivory/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
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
                        "relative block px-1 py-2 text-xs font-medium uppercase tracking-[0.16em] transition-[color,transform] duration-300 hover:-translate-y-px",
                        isActive ? "text-ivory" : "text-ivory/80 hover:text-ivory"
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
              className="hidden shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-ivory/80 transition-colors duration-300 hover:text-ivory xl:inline"
            >
              {signedIn ? "My Account" : "Login"}
            </Link>

            <div className="hidden shrink-0 xl:block">
              <Button
                href="/book"
                magnetic
                className="border-ivory/60 px-5 py-2.5 text-xs text-ivory hover:border-ivory hover:bg-ivory hover:text-charcoal"
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
              className="relative z-50 flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-[5px] rounded-full border border-ivory/45 bg-ivory/10 transition-colors hover:bg-ivory/15 xl:hidden"
            >
              <span className="sr-only">Menu</span>
              <motion.span
                animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 5 : 0 }}
                className="h-[1.5px] w-5 rounded-full bg-ivory shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                transition={{ duration: 0.3 }}
              />
              <motion.span
                animate={{ opacity: mobileOpen ? 0 : 1 }}
                className="h-[1.5px] w-5 rounded-full bg-ivory shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                transition={{ duration: 0.2 }}
              />
              <motion.span
                animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -5 : 0 }}
                className="h-[1.5px] w-5 rounded-full bg-ivory shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                transition={{ duration: 0.3 }}
              />
            </button>
          </motion.div>
        </motion.div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} signedIn={signedIn} />
      <MobileDock pathname={pathname} onNavigate={() => setMobileOpen(false)} />
    </>
  );
}
