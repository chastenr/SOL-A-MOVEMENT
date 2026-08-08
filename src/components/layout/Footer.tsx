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
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-14 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-xl tracking-[0.06em]">{siteConfig.shortName}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-ivory/50">
              Wellness Studio
            </p>
            <p className="font-display mt-5 max-w-xs text-lg italic text-ivory/80">
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
