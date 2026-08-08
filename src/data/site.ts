export const siteConfig = {
  name: "Veora Wellness",
  shortName: "Veora",
  tagline: "Move intentionally. Live fully.",
  description:
    "A premium boutique movement and wellness studio in Bacoor, Cavite offering Pilates, yoga, barre, ballet and specialty heated and infrared recovery classes. Explore our services and book your session online.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://veora-wellness.example.com",

  // Veora is a new studio preparing to open — avoid language that implies
  // years of history, an established client base, or existing reviews.
  isPreLaunch: true,

  contact: {
    email: "hello@veorawellness.com",
    phone: "+63 917 319 4772",
    address: {
      line1: "2nd Floor, EMRADEE Building, Daang Hari Road",
      line2: "Molino IV, Bacoor, Cavite, 4102, Philippines",
      full: "2nd Floor, EMRADEE Building, Daang Hari Road, Molino IV, Bacoor, Cavite, 4102, Philippines",
      streetAddress: "2nd Floor, EMRADEE Building, Daang Hari Road, Molino IV",
      addressLocality: "Bacoor",
      addressRegion: "Cavite",
      postalCode: "4102",
      addressCountry: "PH",
    },
    geo: {
      lat: 14.4108087,
      lng: 120.9503414,
    },
    instagram: "https://www.instagram.com/spacioblnc/",
  },

  // Business hours have not been published yet — do not display fabricated hours.
  hours: [] as { day: string; hours: string }[],
  hoursNote: "Studio hours will be announced closer to opening. Contact us for current availability.",

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

  nav: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Schedule", href: "/schedule" },
    { label: "Contact", href: "/contact" },
  ],

  footerNav: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Schedule", href: "/schedule" },
    { label: "Book", href: "/book" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Policies", href: "/policies" },
  ],

  bookingCtaLabel: "Book a Session",

  // Toggle the wording used in booking confirmation emails and the success screen.
  // "received" = studio will manually confirm; "confirmed" = treated as final.
  bookingStatusWording: "received" as "received" | "confirmed",

  social: {
    instagram: "https://www.instagram.com/spacioblnc/",
    facebook: "https://www.facebook.com/spacioblnc/",
  },
} as const;

export type SiteConfig = typeof siteConfig;
