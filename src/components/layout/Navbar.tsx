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
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "sticky top-0 z-50 w-full transition-colors duration-300",
          scrolled || mobileOpen
            ? "bg-ivory/90 backdrop-blur-md border-b border-charcoal/10"
            : "bg-ivory/40 backdrop-blur-sm"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-12">
          <Link href="/" className="font-display text-xl tracking-[0.08em] text-charcoal">
            {siteConfig.shortName}
            <span className="ml-2 hidden text-xs font-sans font-normal uppercase tracking-[0.2em] text-charcoal/60 sm:inline">
              Movement &amp; Wellness
            </span>
          </Link>

          <nav className="hidden items-center gap-10 lg:flex">
            {siteConfig.nav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm uppercase tracking-[0.12em] transition-colors duration-300",
                    isActive ? "text-charcoal" : "text-charcoal/60 hover:text-charcoal"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:block">
            <Button href="/book" size="md">
              {siteConfig.bookingCtaLabel}
            </Button>
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-[6px] lg:hidden"
          >
            <motion.span
              animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 6 : 0 }}
              className="h-px w-6 bg-charcoal"
              transition={{ duration: 0.3 }}
            />
            <motion.span
              animate={{ opacity: mobileOpen ? 0 : 1 }}
              className="h-px w-6 bg-charcoal"
              transition={{ duration: 0.2 }}
            />
            <motion.span
              animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -6 : 0 }}
              className="h-px w-6 bg-charcoal"
              transition={{ duration: 0.3 }}
            />
          </button>
        </div>
      </motion.header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
