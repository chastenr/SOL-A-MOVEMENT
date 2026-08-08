"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { siteConfig } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "pointer-events-auto mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 rounded-full border px-4 backdrop-blur-xl transition-all duration-300 sm:h-[4.5rem] sm:px-6",
            scrolled || mobileOpen
              ? "border-ivory/15 bg-charcoal/85 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.55)]"
              : "border-ivory/10 bg-charcoal/60 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.4)]"
          )}
        >
          <Link href="/" className="font-display shrink-0 text-lg tracking-[0.06em] text-ivory sm:text-xl">
            {siteConfig.shortName}
            <span className="ml-2 hidden text-[10px] font-sans font-normal uppercase tracking-[0.22em] text-ivory/55 sm:inline">
              Wellness Studio
            </span>
          </Link>

          <nav className="hidden items-center gap-5 xl:flex">
            {siteConfig.nav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative py-1 text-[11px] uppercase tracking-[0.2em] transition-colors duration-300",
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
              );
            })}
          </nav>

          <div className="hidden shrink-0 xl:block">
            <Button
              href="/book"
              magnetic
              className="border-ivory/40 px-5 py-2.5 text-[0.68rem] text-ivory hover:border-ivory hover:bg-ivory hover:text-charcoal"
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
              className="h-px w-4 bg-ivory"
              transition={{ duration: 0.3 }}
            />
            <motion.span
              animate={{ opacity: mobileOpen ? 0 : 1 }}
              className="h-px w-4 bg-ivory"
              transition={{ duration: 0.2 }}
            />
            <motion.span
              animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -5 : 0 }}
              className="h-px w-4 bg-ivory"
              transition={{ duration: 0.3 }}
            />
          </button>
        </motion.div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
