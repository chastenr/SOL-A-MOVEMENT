import Link from "next/link";
import { siteConfig } from "@/data/site";

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
  return (
    <footer className="bg-charcoal text-ivory">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-2xl tracking-[0.06em]">{siteConfig.shortName}</p>
            <p className="mt-1 text-sm uppercase tracking-[0.2em] text-ivory/50">
              Wellness Studio
            </p>
            <p className="font-display mt-6 max-w-xs text-xl italic text-ivory/80">
              {siteConfig.tagline}
            </p>
            <div className="mt-6 flex items-center gap-5">
              <Link
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Veora on Instagram"
                className="inline-flex items-center gap-2 text-sm text-ivory/60 transition-colors hover:text-ivory"
              >
                <InstagramIcon />
                Instagram
              </Link>
              <Link
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Veora on Facebook"
                className="inline-flex items-center gap-2 text-sm text-ivory/60 transition-colors hover:text-ivory"
              >
                <FacebookIcon />
                Facebook
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ivory/50">Explore</p>
            <ul className="mt-5 space-y-3">
              {siteConfig.footerNav.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ivory/80 transition-colors hover:text-ivory"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ivory/50">Studio</p>
            <ul className="mt-5 space-y-3 text-sm text-ivory/80">
              <li>{siteConfig.contact.address.line1}</li>
              <li>{siteConfig.contact.address.line2}</li>
              <li>{siteConfig.contact.phone}</li>
              <li>{siteConfig.contact.email}</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 grid gap-2 border-t border-ivory/10 pt-8 text-xs text-ivory/50 sm:grid-cols-2">
          <p>© 2026 {siteConfig.name}. All rights reserved.</p>
          <div className="sm:text-right">
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
          </div>
        </div>
      </div>
    </footer>
  );
}
