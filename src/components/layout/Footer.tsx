"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { siteConfig } from "@/data/site";
import { COOKIE_SETTINGS_EVENT } from "@/components/privacy/CookieConsent";
import { EASE } from "@/lib/motion";

const ritualNavigation = [
  { number: "01", title: "Studio", description: "Discover Veora", href: "/about" },
  { number: "02", title: "Classes", description: "Find your movement", href: "/services" },
  { number: "03", title: "Packages", description: "Choose your ritual", href: "/pricing" },
  { number: "04", title: "Schedule", description: "Plan your week", href: "/schedule" },
  { number: "05", title: "Visit", description: "Come see us", href: "/locations" },
] as const;

const socialLinks = [
  { label: "Instagram", detail: "@veora.ph", href: siteConfig.social.instagram, icon: "instagram" },
  { label: "Facebook", detail: "Veora PH", href: siteConfig.social.facebook, icon: "facebook" },
] as const;

function SocialIcon({ platform }: { platform: (typeof socialLinks)[number]["icon"] }) {
  if (platform === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.4" cy="6.6" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V5a23 23 0 0 0-2.4-.1c-2.4 0-4 1.5-4 4.1v2H7.7v3h2.7v8h3.1Z" />
    </svg>
  );
}

export function Footer() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // The admin dashboard is its own product surface with its own chrome.
  if (pathname.startsWith("/admin") || pathname === "/site-locked") return null;

  const phoneDisplay = siteConfig.contact.phone.replace(/^0/, "+63 ").replaceAll("-", " ");
  const phoneHref = siteConfig.contact.phone.replace(/\D/g, "").replace(/^0/, "+63");
  const studioHours = siteConfig.hours[0];

  return (
    <footer
      className="texture-plaster relative overflow-hidden bg-walnut text-ivory"
      style={{
        background:
          "radial-gradient(circle at 72% 18%, rgba(250,247,242,0.04), transparent 34%), var(--color-walnut)",
      }}
    >
      <div className="relative z-10 mx-auto max-w-[1600px] px-6 pt-16 sm:px-8 sm:pt-20 lg:px-[clamp(3rem,5vw,6rem)]">
        <motion.section
          aria-labelledby="footer-ritual-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: EASE }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ivory/55 sm:text-[11px]">
            Move · Flow · Dance
          </p>
          <h2
            id="footer-ritual-heading"
            className="font-display mt-5 max-w-[11ch] text-[clamp(3.25rem,6vw,6.25rem)] leading-[0.95] tracking-[-0.035em] text-ivory sm:max-w-none sm:whitespace-nowrap"
          >
            Your ritual continues.
          </h2>
          <p className="mt-6 text-sm tracking-[0.03em] text-ivory/65 sm:ml-[clamp(3rem,13vw,12rem)] sm:text-base">
            Move intentionally. Live fully.
          </p>
        </motion.section>

        <nav aria-label="Footer navigation" className="mt-14 sm:mt-16">
          <ol className="grid border-t border-ivory/15 lg:grid-cols-5">
            {ritualNavigation.map((item, index) => (
              <li key={item.href} className="relative lg:border-l lg:border-ivory/10 lg:first:border-l-0">
                <Link
                  href={item.href}
                  className="group flex min-h-14 items-center gap-5 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ivory lg:min-h-24 lg:items-start lg:px-5 lg:py-5 xl:px-7"
                >
                  <span className="w-5 shrink-0 pt-0.5 text-[9px] font-medium tracking-[0.16em] text-ivory/40">
                    {item.number}
                  </span>
                  <span className="min-w-0 flex-1 transition-transform duration-300 ease-[var(--ease-veora)] group-hover:translate-x-1.5 group-focus-visible:translate-x-1.5">
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ivory/85">
                        {item.title}
                      </span>
                      <ArrowUpRight
                        className="h-3.5 w-3.5 -translate-x-1 text-ivory/60 opacity-0 transition-all duration-300 ease-[var(--ease-veora)] group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                        strokeWidth={1.4}
                        aria-hidden
                      />
                    </span>
                    <span className="mt-3 hidden text-xs tracking-[0.02em] text-ivory/45 lg:block">
                      {item.description}
                    </span>
                  </span>
                </Link>
                <motion.span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px origin-left bg-ivory/20"
                  initial={reduceMotion ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : index * 0.08, ease: EASE }}
                />
              </li>
            ))}
          </ol>
        </nav>

        <motion.section
          aria-label="Studio information"
          className="relative z-10 mt-14 grid gap-9 text-sm sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-14"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: reduceMotion ? 0 : 0.9, delay: reduceMotion ? 0 : 0.18, ease: EASE }}
        >
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory/75">
              Veora Wellness Studio
            </h3>
            <address className="mt-5 max-w-xs not-italic leading-[1.8] text-ivory/55">
              <span className="block">{siteConfig.contact.address.line1}</span>
              <span className="block">{siteConfig.contact.address.line2}</span>
            </address>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory/75">
              {studioHours?.day ?? "Studio hours"}
            </h3>
            <p className="mt-5 text-base tracking-[0.04em] text-ivory/65">
              {studioHours?.hours ?? siteConfig.hoursNote}
            </p>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory/75">Bookings</h3>
            <div className="mt-5 flex flex-col items-start gap-2 text-ivory/60">
              <a
                href={`tel:${phoneHref}`}
                className="transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory"
              >
                {phoneDisplay}
              </a>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory"
              >
                {siteConfig.contact.email}
              </a>
            </div>

            <div className="mt-6 flex flex-col items-start gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ivory/55 transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory"
                >
                  <SocialIcon platform={social.icon} />
                  <span>{social.label}</span>
                  <span className="hidden normal-case tracking-normal text-ivory/35 sm:inline">{social.detail}</span>
                  <span className="h-px w-0 bg-ivory/55 transition-[width] duration-300 ease-[var(--ease-veora)] group-hover:w-8 group-focus-visible:w-8" aria-hidden />
                  <ArrowUpRight className="h-3 w-3" strokeWidth={1.4} aria-hidden />
                  <span className="sr-only">; opens in a new tab</span>
                </a>
              ))}
            </div>
          </div>
        </motion.section>

        <div className="relative mt-8 h-[clamp(5.5rem,12vw,12rem)] sm:mt-6" aria-hidden>
          <motion.p
            className="font-display absolute inset-x-1/2 bottom-[-0.1em] w-max -translate-x-1/2 select-none whitespace-nowrap text-[25vw] leading-[0.72] tracking-[0.04em] text-ivory/[0.075] sm:text-[clamp(8rem,18vw,20rem)]"
            initial={reduceMotion ? false : { clipPath: "inset(0 100% 0 0)" }}
            whileInView={{ clipPath: "inset(0 0% 0 0)" }}
            viewport={{ once: true, margin: "-5% 0px" }}
            transition={{ duration: reduceMotion ? 0 : 1.15, ease: EASE }}
          >
            VEORA
          </motion.p>
        </div>
      </div>

      <div className="relative z-10 border-t border-ivory/15 bg-walnut/95">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-6 py-5 text-[9px] font-medium uppercase tracking-[0.16em] text-ivory/40 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-[clamp(3rem,5vw,6rem)]">
          <p>© 2026 Veora Wellness</p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/policies#privacy-cookies" className="transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory">
              Privacy
            </Link>
            <Link href="/policies#general-terms" className="transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory">
              Terms
            </Link>
            <Link href="/policies" className="transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory">
              Policies
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}
              className="transition-colors hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory"
            >
              Cookie settings
            </button>
          </nav>
          <a
            href="https://elevenchase.com"
            target="_blank"
            rel="noreferrer noopener"
            className="transition-colors hover:text-ivory/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory"
          >
            Powered by ElevenChase<span className="sr-only">; opens in a new tab</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
