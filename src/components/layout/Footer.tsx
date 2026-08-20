"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Sparkle } from "lucide-react";
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
            <div className="flex w-fit items-center gap-4 sm:gap-6">
              <Image
                src="/veora-mark.png"
                alt=""
                width={608}
                height={676}
                quality={100}
                className="h-20 w-auto shrink-0 brightness-0 invert sm:h-24"
              />

              <div className="flex min-w-0 flex-col items-center">
                <Image
                  src="/veora-wordmark.png"
                  alt={siteConfig.shortName}
                  width={1218}
                  height={189}
                  quality={100}
                  className="h-auto w-48 brightness-0 invert sm:w-56"
                />

                <div className="mt-3 flex items-center gap-3" aria-hidden>
                  <span className="h-px w-9 bg-ivory/40" />
                  <Sparkle className="h-3.5 w-3.5 shrink-0 text-ivory/75" strokeWidth={1.35} />
                  <span className="h-px w-9 bg-ivory/40" />
                </div>
                <p className="mt-3 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.18em] text-ivory/85">
                  Move. Flow. Dance.
                </p>
                <p className="mt-2 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.14em] text-ivory/75">
                  Where Movement Becomes Ritual
                </p>
              </div>
            </div>

            <p className="font-display mt-6 max-w-xs text-xl italic leading-snug text-ivory/80">
              {siteConfig.tagline}
            </p>
            <div className="mt-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory/65">
                Follow Veora
              </p>
              <div className="mt-3 grid w-full max-w-sm grid-cols-1 gap-3 min-[390px]:grid-cols-2">
                <Link
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex min-h-14 items-center gap-3 rounded-full border border-ivory/20 bg-ivory/[0.04] px-4 text-ivory transition-colors hover:border-ivory/40 hover:bg-ivory/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-walnut"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ivory/10" aria-hidden>
                    <InstagramIcon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold uppercase tracking-[0.12em]">Instagram</span>
                    <span className="mt-0.5 block truncate text-xs text-ivory/65">@veora.ph</span>
                  </span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 shrink-0 text-ivory/50 transition-colors group-hover:text-ivory"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <span className="sr-only">Follow Veora; opens in a new tab</span>
                </Link>
                <Link
                  href={siteConfig.social.facebook}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex min-h-14 items-center gap-3 rounded-full border border-ivory/20 bg-ivory/[0.04] px-4 text-ivory transition-colors hover:border-ivory/40 hover:bg-ivory/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-walnut"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ivory/10" aria-hidden>
                    <FacebookIcon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold uppercase tracking-[0.12em]">Facebook</span>
                    <span className="mt-0.5 block truncate text-xs text-ivory/65">Veora PH</span>
                  </span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 shrink-0 text-ivory/50 transition-colors group-hover:text-ivory"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <span className="sr-only">Follow Veora; opens in a new tab</span>
                </Link>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ivory/80">Explore</p>
            <ul className="mt-4 space-y-2.5">
              {siteConfig.footerNav.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm leading-relaxed text-ivory/85 transition-colors hover:text-ivory"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ivory/80">Studio</p>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-ivory/85">
              <li>{siteConfig.contact.address.line1}</li>
              <li>{siteConfig.contact.address.line2}</li>
              <li>{siteConfig.contact.phone}</li>
              <li>{siteConfig.contact.email}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 grid gap-3 border-t border-ivory/15 pt-6 text-xs leading-relaxed text-ivory/75 sm:grid-cols-2">
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
              className="inline-flex items-center text-ivory/75 transition-colors hover:text-ivory"
            >
              <span className="text-[10px] font-medium uppercase tracking-[0.14em]">Powered by ElevenChase</span>
              <span className="sr-only">website; opens in a new tab</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
