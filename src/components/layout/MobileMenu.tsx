"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { siteConfig } from "@/data/site";
import { EASE, usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const STAGGER = 0.06;

export function MobileMenu({
  open,
  onClose,
  signedIn,
}: {
  open: boolean;
  onClose: () => void;
  signedIn: boolean;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const pathname = usePathname();
  const stagger = reduceMotion ? 0 : STAGGER;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const background = [document.querySelector("main"), document.querySelector("footer")].filter(
      (element): element is HTMLElement => element instanceof HTMLElement
    );

    document.body.style.overflow = "hidden";
    background.forEach((element) => {
      element.inert = true;
    });
    menuRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      background.forEach((element) => {
        element.inert = false;
      });
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          tabIndex={-1}
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: EASE }}
          className="font-navbar fixed inset-0 z-40 flex flex-col bg-[radial-gradient(circle_at_top_left,rgba(77,56,44,0.95),#221f1c_58%)] xl:hidden"
        >
          <div className="flex flex-1 flex-col overflow-y-auto px-8 pb-36 pt-32 sm:px-12 sm:pt-36">
            <nav className="flex flex-col">
              {siteConfig.nav.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: stagger * index, ease: EASE }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={cn(
                      "block border-b border-ivory/15 py-4 text-lg font-medium uppercase tracking-[0.16em] text-ivory/80 transition-colors hover:text-ivory",
                      pathname === item.href && "text-ivory"
                    )}
                  >
                    <span className="flex items-center justify-between gap-4">
                      {item.label}
                      {pathname === item.href && <span className="h-1.5 w-1.5 rounded-full bg-clay" aria-hidden />}
                    </span>
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: stagger * siteConfig.nav.length, ease: EASE }}
              >
                <Link
                  href={signedIn ? "/account" : "/login"}
                  onClick={onClose}
                  aria-current={pathname.startsWith("/account") || pathname === "/login" ? "page" : undefined}
                  className="block border-b border-ivory/15 py-4 text-lg font-medium uppercase tracking-[0.16em] text-ivory/80 transition-colors hover:text-ivory"
                >
                  {signedIn ? "My Account" : "Login"}
                </Link>
              </motion.div>
            </nav>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: stagger * (siteConfig.nav.length + 1) + 0.15, ease: EASE }}
              className="mt-10 space-y-2 border-l border-clay/70 pl-4 text-sm leading-relaxed text-ivory/75"
            >
              <p>{siteConfig.contact.phone}</p>
              <p>{siteConfig.contact.email}</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
