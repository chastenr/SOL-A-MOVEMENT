"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { siteConfig } from "@/data/site";
import { Button } from "@/components/ui/Button";

const EASE = [0.16, 1, 0.3, 1] as const;
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
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 flex flex-col bg-charcoal xl:hidden"
        >
          <div className="flex flex-1 flex-col justify-center overflow-y-auto px-8 pb-10 pt-24">
            <nav className="flex flex-col">
              {siteConfig.nav.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: STAGGER * index, ease: EASE }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="font-display block border-b border-ivory/10 py-3.5 text-3xl text-ivory transition-colors hover:text-clay"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: STAGGER * siteConfig.nav.length, ease: EASE }}
              >
                <Link
                  href={signedIn ? "/account" : "/login"}
                  onClick={onClose}
                  className="font-display block border-b border-ivory/10 py-3.5 text-3xl text-ivory transition-colors hover:text-clay"
                >
                  {signedIn ? "My Account" : "Login"}
                </Link>
              </motion.div>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: STAGGER * (siteConfig.nav.length + 1), ease: EASE }}
              className="mt-8"
            >
              <Button href="/book" size="lg" className="w-full" onClick={onClose}>
                {siteConfig.bookingCtaLabel}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: STAGGER * (siteConfig.nav.length + 1) + 0.15 }}
              className="mt-8 space-y-1 text-sm text-ivory/50"
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
