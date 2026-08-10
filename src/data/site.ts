import { getPrimaryLocation } from "@/data/locations";

const primaryLocation = getPrimaryLocation();

export const siteConfig = {
  name: "Veora Wellness",
  shortName: "Veora",
  tagline: "Move intentionally. Live fully.",
  description:
    "A premium boutique movement and wellness studio in Bacoor, Cavite offering Pilates, yoga, barre, ballet and specialty heated and infrared recovery classes. Explore our services and book your session online.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.veorawellnessph.com",

  // Veora is a new studio preparing to open — avoid language that implies
  // years of history, an established client base, or existing reviews.
  isPreLaunch: true,

  // Primary studio contact — sourced from locations.ts (the single source of
  // truth once Veora adds more branches).
  contact: {
    email: primaryLocation.email,
    phone: primaryLocation.phone,
    address: primaryLocation.address,
    geo: primaryLocation.geo,
    mapUrl: primaryLocation.mapUrl,
  },

  // Business hours have not been published yet — do not display fabricated hours.
  hours: primaryLocation.hours,
  hoursNote: primaryLocation.hoursNote ?? "",

  // Weekday indices (0 = Sunday ... 6 = Saturday) the studio is closed for booking.
  closedWeekdays: [0] as number[],

  // Generic appointment time slots offered on open days for the booking flow.
  // No live class timetable is published yet, so booking requests are
  // reviewed and confirmed by the studio rather than instantly guaranteed.
  timeSlots: [
    "9:00 AM",
    "10:00 AM",
    "11:30 AM",
    "1:00 PM",
    "2:30 PM",
    "4:00 PM",
    "5:30 PM",
  ],

  // Classes are cancelled free of charge up to this many hours before start.
  cancellationWindowHours: 12,

  // Kept short on purpose — the logo already covers Home, and Locations
  // (a single-address studio) stays reachable via the footer and /contact
  // rather than taking a top-level slot.
  nav: [
    { label: "Studio", href: "/about" },
    { label: "Classes", href: "/services" },
    { label: "Packages", href: "/pricing" },
    { label: "Schedule", href: "/schedule" },
    { label: "Contact", href: "/contact" },
  ],

  footerNav: [
    { label: "Studio", href: "/about" },
    { label: "Classes", href: "/services" },
    { label: "Packages", href: "/pricing" },
    { label: "Schedule", href: "/schedule" },
    { label: "Locations", href: "/locations" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Policies", href: "/policies" },
  ],

  bookingCtaLabel: "Book a Session",

  // Toggle the wording used in booking confirmation emails and the success screen.
  // "received" = studio will manually confirm; "confirmed" = treated as final.

  social: {
    instagram: "https://www.instagram.com/spacioblnc/",
    facebook: "https://www.facebook.com/spacioblnc/",
  },
} as const;

export type SiteConfig = typeof siteConfig;
