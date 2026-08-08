"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { siteConfig } from "@/data/site";
import { Button } from "@/components/ui/Button";

const EASE = [0.16, 1, 0.3, 1] as const;

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 flex flex-col bg-ivory lg:hidden"
        >
          <div className="flex-1 overflow-y-auto px-8 pt-28 pb-10">
            <nav className="flex flex-col gap-2">
              {siteConfig.nav.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.08 * index, ease: EASE }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="font-display block border-b border-charcoal/10 py-4 text-4xl text-charcoal"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 * siteConfig.nav.length, ease: EASE }}
              className="mt-10"
            >
              <Button href="/book" size="lg" className="w-full" onClick={onClose}>
                {siteConfig.bookingCtaLabel}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.08 * siteConfig.nav.length + 0.15 }}
              className="mt-12 space-y-1 text-sm text-charcoal/60"
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
