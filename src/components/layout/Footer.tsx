"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/data/site";
import { COOKIE_SETTINGS_EVENT } from "@/components/privacy/CookieConsent";

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d="M15 8h2V5h-2c-1.657 0-3 1.343-3 3v2H9v3h3v7h3v-7h2.5l.5-3H15V8z" />
    </svg>
  );
}

export function Footer() {
  const pathname = usePathname();
  // The admin dashboard is its own product surface with its own chrome
  // (see admin/(protected)/layout.tsx) — it doesn't share the public footer.
  if (pathname.startsWith("/admin") || pathname === "/site-locked") return null;

  return (
    <footer className="texture-plaster bg-walnut text-ivory">
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              {/* Natural brown reads fine here — unlike the navbar's
                  semi-transparent pill, the footer's solid walnut background
                  is dark enough on its own that the mark doesn't need to be
                  inverted to ivory for contrast. */}
              <Image src="/veora-mark.png" alt="" width={608} height={676} className="h-8 w-auto" />
              <p className="font-display text-2xl tracking-[0.06em]">{siteConfig.shortName}</p>
            </div>
            <p className="font-display mt-6 max-w-xs text-xl italic leading-snug text-ivory/80">
              {siteConfig.tagline}
            </p>
            <div className="mt-5 flex items-center gap-5">
              <Link
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Veora on Instagram"
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-ivory/60 transition-colors hover:text-clay"
              >
                <InstagramIcon size={15} />
                Instagram
              </Link>
              <Link
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Veora on Facebook"
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-ivory/60 transition-colors hover:text-clay"
              >
                <FacebookIcon size={15} />
                Facebook
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-ivory/45">Explore</p>
            <ul className="mt-4 space-y-2.5">
              {siteConfig.footerNav.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-ivory/75 transition-colors hover:text-clay"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-ivory/45">Studio</p>
            <ul className="mt-4 space-y-2.5 text-[13px] text-ivory/75">
              <li>{siteConfig.contact.address.line1}</li>
              <li>{siteConfig.contact.address.line2}</li>
              <li>{siteConfig.contact.phone}</li>
              <li>{siteConfig.contact.email}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 grid gap-2 border-t border-ivory/10 pt-6 text-[11px] text-ivory/45 sm:grid-cols-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p>© 2026 {siteConfig.name}. All rights reserved.</p>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}
              className="underline decoration-ivory/20 underline-offset-4 transition-colors hover:text-ivory/75"
            >
              Cookie settings
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end sm:text-right">
            {siteConfig.hours.length > 0 ? (
              siteConfig.hours.map((entry, index) => (
                <span key={entry.day}>
                  {entry.day} {entry.hours}
                  {index < siteConfig.hours.length - 1 && <span className="mx-2">·</span>}
                </span>
              ))
            ) : (
              <span>{siteConfig.hoursNote}</span>
            )}
            <Link
              href="https://elevenchase.com"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Website by ElevenChase"
              className="group inline-flex items-center gap-2 text-ivory/45 transition-colors hover:text-ivory/80"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ivory/30 text-[9px] font-medium text-ivory/60 transition-colors group-hover:border-ivory/50 group-hover:text-ivory">
                C
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.14em]">ElevenChase</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
