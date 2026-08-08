export const siteConfig = {
  name: "SOLÉA Movement & Wellness",
  shortName: "SOLÉA",
  tagline: "Move intentionally. Live fully.",
  description:
    "Discover intentional movement, Pilates, yoga and wellness sessions at SOLÉA Movement & Wellness. Explore our services and book your session online.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://solea-movement.example.com",

  contact: {
    email: "TODO@soleamovement.com",
    phone: "TODO (555) 000-0000",
    address: {
      line1: "TODO Studio Address",
      line2: "TODO City, State ZIP",
      full: "TODO Studio Address, TODO City, State ZIP",
    },
    instagram: "https://instagram.com/soleamovement",
  },

  hours: [
    { day: "Monday", hours: "7:00 AM – 7:00 PM" },
    { day: "Tuesday", hours: "7:00 AM – 7:00 PM" },
    { day: "Wednesday", hours: "7:00 AM – 7:00 PM" },
    { day: "Thursday", hours: "7:00 AM – 7:00 PM" },
    { day: "Friday", hours: "7:00 AM – 6:00 PM" },
    { day: "Saturday", hours: "8:00 AM – 2:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ],

  // Weekday indices (0 = Sunday ... 6 = Saturday) the studio is closed for booking.
  closedWeekdays: [0] as number[],

  // Generic appointment time slots offered on open days for the booking flow.
  timeSlots: [
    "9:00 AM",
    "10:00 AM",
    "11:30 AM",
    "1:00 PM",
    "2:30 PM",
    "4:00 PM",
    "5:30 PM",
  ],

  nav: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Schedule", href: "/schedule" },
    { label: "Contact", href: "/contact" },
  ],

  bookingCtaLabel: "Book a Session",

  // Toggle the wording used in booking confirmation emails and the success screen.
  // "received" = studio will manually confirm; "confirmed" = treated as final.
  bookingStatusWording: "received" as "received" | "confirmed",

  social: {
    instagram: "https://instagram.com/soleamovement",
  },
} as const;

export type SiteConfig = typeof siteConfig;
