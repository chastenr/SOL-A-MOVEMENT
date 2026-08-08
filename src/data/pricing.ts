export type PricingOption = {
  slug: string;
  name: string;
  price: string;
  originalPrice?: string;
  sessions?: number;
  validity: string;
  description: string;
  includedServices: string[];
  conditions?: string[];
  recommended?: boolean;
  /** Set only when this option redeems against exactly one services.ts slug (Restore, Ballet) — lets /book pre-select it. Classics-tier options span 4 services, so they're left unset. */
  serviceSlug?: string;
};

// Real, published pricing migrated from the studio's live booking platform.
// Prices are informational only — this site never collects payment.
// "Founding Member" pricing is a time-limited pre-opening promotion the
// studio is currently running; see NEEDS_CLIENT_CONFIRMATION.md for the
// note on when it's expected to convert to standard pricing.
export const pricing: {
  introOffers: PricingOption[];
  singleSessions: PricingOption[];
  packages: PricingOption[];
  memberships: PricingOption[];
  privateSessions: PricingOption[];
  specialOffers: PricingOption[];
} = {
  introOffers: [
    {
      slug: "founding-classic-intro",
      name: "CLASSIC Intro Pass — Founding Member",
      price: "₱599",
      originalPrice: "₱850",
      sessions: 1,
      validity: "15 days from purchase",
      description: "A single class credit at an exclusive pre-opening rate.",
      includedServices: ["Mat Pilates, Yoga, Barre, Strength or Mobility classes"],
      conditions: [
        "Available only during our preselling period — after official launch, pricing transitions to standard rates.",
      ],
    },
    {
      slug: "founding-classic-week",
      name: "CLASSIC Unlimited Week — Founding Member",
      price: "₱2,500",
      sessions: 7,
      validity: "7 class credits within 1 week of first booking",
      description: "Seven class credits to use within one week, starting from your first booking.",
      includedServices: ["Mat Pilates, Yoga, Barre, Strength or Mobility classes"],
      conditions: [
        "Available only during our preselling period — after official launch, pricing transitions to standard rates.",
      ],
    },
    {
      slug: "founding-classic-month",
      name: "CLASSIC Unlimited Month — Founding Member",
      price: "₱9,500",
      sessions: 30,
      validity: "30 class credits within 30 days",
      description: "Thirty class credits to use within thirty days.",
      includedServices: ["Mat Pilates, Yoga, Barre, Strength or Mobility classes"],
      conditions: [
        "Available only during our preselling period — after official launch, pricing transitions to standard rates.",
      ],
    },
    {
      slug: "founding-classic-quarter",
      name: "CLASSIC Unlimited Quarter — Founding Member",
      price: "₱25,000",
      sessions: 90,
      validity: "90 class credits within 90 days",
      description: "Ninety class credits to use within ninety days.",
      includedServices: ["Mat Pilates, Yoga, Barre, Strength or Mobility classes"],
      conditions: [
        "Available only during our preselling period — after official launch, pricing transitions to standard rates.",
      ],
    },
    {
      slug: "founding-classic-consistency",
      name: "CLASSIC Consistency (20-class credit) — Founding Member",
      price: "₱14,000",
      sessions: 20,
      validity: "100 days from purchase",
      description: "Twenty class credits for building a consistent practice.",
      includedServices: ["Mat Pilates, Yoga, Barre, Strength or Mobility classes"],
      conditions: [
        "Available only during our preselling period — after official launch, pricing transitions to standard rates.",
      ],
    },
    {
      slug: "founding-restore-week",
      serviceSlug: "recovery-restore",
      name: "RESTORE Unlimited Week — Founding Member",
      price: "₱4,500",
      sessions: 7,
      validity: "7 class credits within 1 week of first booking",
      description: "Seven thermal recovery class credits to use within one week.",
      includedServices: ["Heated and Red Light Recovery classes (Hot Pilates, Infrared Yoga and more)"],
      conditions: [
        "Available only during our preselling period — after official launch, pricing transitions to standard rates.",
      ],
    },
    {
      slug: "founding-restore-elevate",
      serviceSlug: "recovery-restore",
      name: "RESTORE Elevate (20-class credit) — Founding Member",
      price: "₱19,000",
      sessions: 20,
      validity: "100 days from purchase",
      description: "Twenty thermal recovery class credits.",
      includedServices: ["Heated and Red Light Recovery classes (Hot Pilates, Infrared Yoga and more)"],
      conditions: [
        "Available only during our preselling period — after official launch, pricing transitions to standard rates.",
      ],
    },
    {
      slug: "founding-ballet-term",
      serviceSlug: "ballet",
      name: "Ballet 12-Week Term — Founding Member",
      price: "₱10,500",
      originalPrice: "₱11,000",
      sessions: 12,
      validity: "90 days from purchase",
      description: "Twelve ballet class credits across a structured 12-week term.",
      includedServices: ["Ballet classes, all age groups"],
      conditions: [
        "Available only during our preselling period — after official launch, pricing transitions to standard rates.",
      ],
    },
  ],

  singleSessions: [
    {
      slug: "classic-intro-pass",
      name: "CLASSIC Intro Pass (Single Session)",
      price: "₱850",
      sessions: 1,
      validity: "15 days from purchase",
      description: "Try a single class credit, redeemable for any Classics-category class.",
      includedServices: ["Mat Pilates, Yoga, Barre, Strength or Mobility classes"],
    },
    {
      slug: "restore-calm",
      serviceSlug: "recovery-restore",
      name: "RESTORE Calm (Single Session)",
      price: "₱1,500",
      sessions: 1,
      validity: "15 days from purchase",
      description: "A single thermal recovery class credit.",
      includedServices: ["Heated and Red Light Recovery classes (Hot Pilates, Infrared Yoga and more)"],
    },
    {
      slug: "ballet-trial",
      serviceSlug: "ballet",
      name: "Ballet Trial Class (Single Session)",
      price: "₱1,000",
      sessions: 1,
      validity: "15 days from purchase",
      description: "A single ballet class credit.",
      includedServices: ["Ballet classes, all age groups"],
    },
  ],

  packages: [
    {
      slug: "classic-discovery",
      name: "CLASSIC Discovery (4-class credit)",
      price: "₱3,200",
      sessions: 4,
      validity: "30 days from purchase",
      description: "Four flexible class credits.",
      includedServices: ["Mat Pilates, Yoga, Barre, Strength or Mobility classes"],
    },
    {
      slug: "classic-foundation",
      name: "CLASSIC Foundation (8-class credit)",
      price: "₱6,200",
      sessions: 8,
      validity: "60 days from purchase",
      description: "Eight flexible class credits.",
      includedServices: ["Mat Pilates, Yoga, Barre, Strength or Mobility classes"],
    },
    {
      slug: "classic-lifestyle",
      name: "CLASSIC Lifestyle (10-class credit)",
      price: "₱7,500",
      sessions: 10,
      validity: "75 days from purchase",
      description: "Ten flexible class credits.",
      includedServices: ["Mat Pilates, Yoga, Barre, Strength or Mobility classes"],
    },
    {
      slug: "restore-balance",
      serviceSlug: "recovery-restore",
      name: "RESTORE Balance (4-class credit)",
      price: "₱5,400",
      sessions: 4,
      validity: "30 days from purchase",
      description: "Four thermal recovery class credits.",
      includedServices: ["Heated and Red Light Recovery classes (Hot Pilates, Infrared Yoga and more)"],
    },
    {
      slug: "restore-recovery",
      serviceSlug: "recovery-restore",
      name: "RESTORE Recovery (8-class credit)",
      price: "₱9,600",
      sessions: 8,
      validity: "60 days from purchase",
      description: "Eight thermal recovery class credits.",
      includedServices: ["Heated and Red Light Recovery classes (Hot Pilates, Infrared Yoga and more)"],
    },
    {
      slug: "restore-thrive",
      serviceSlug: "recovery-restore",
      name: "RESTORE Thrive (10-class credit)",
      price: "₱11,000",
      sessions: 10,
      validity: "75 days from purchase",
      description: "Ten thermal recovery class credits.",
      includedServices: ["Heated and Red Light Recovery classes (Hot Pilates, Infrared Yoga and more)"],
    },
    {
      slug: "ballet-starter",
      serviceSlug: "ballet",
      name: "Ballet Starter Class (4-class credit)",
      price: "₱3,800",
      sessions: 4,
      validity: "30 days from purchase",
      description: "Four ballet class credits.",
      includedServices: ["Ballet classes, all age groups"],
    },
    {
      slug: "ballet-12-week-term",
      serviceSlug: "ballet",
      name: "Ballet 12-Week Term",
      price: "₱11,000",
      sessions: 12,
      validity: "90 days from purchase",
      description: "Twelve ballet class credits across a structured 12-week term.",
      includedServices: ["Ballet classes, all age groups"],
    },
  ],

  // No recurring memberships have been published yet — only the class-credit
  // packages above and the introductory offers exist at time of writing.
  memberships: [],

  // No standalone private 1:1 sessions are offered — private, instructor-led
  // experiences are only available via Studio Rental (see specialOffers).
  privateSessions: [],

  specialOffers: [
    {
      slug: "studio-rental",
      name: "Studio Rental (without instructor)",
      price: "₱6,500",
      validity: "Booking must be made within 30 days of purchase",
      description: "Private access to the studio for your own event or activity.",
      includedServices: ["2-hour exclusive studio use", "Up to 10 guests", "No instructor included"],
      conditions: [
        "Additional guest: ₱300/person",
        "Does not include event styling, decorations, furniture or catering",
        "No-shows and unused bookings are forfeited",
      ],
    },
    {
      slug: "studio-classics-experience",
      name: "Studio + Classics Experience",
      price: "₱10,000",
      validity: "Booking must be made within 30 days of purchase",
      description: "Exclusive studio access plus one private Classics class with an instructor.",
      includedServices: [
        "2-hour exclusive studio use",
        "One private 50–60 min class (Mat Pilates, Yoga, Barre or Strength)",
        "Up to 10 guests",
      ],
      conditions: [
        "Additional guest: ₱450/person",
        "Does not include event styling, decorations, furniture or catering",
      ],
    },
    {
      slug: "studio-restore-experience",
      serviceSlug: "recovery-restore",
      name: "Studio + Restore Experience",
      price: "₱13,500",
      validity: "Booking must be made within 30 days of purchase",
      description: "Exclusive studio access plus one private thermal Restore class with an instructor.",
      includedServices: [
        "2-hour exclusive studio use",
        "One private 50–60 min heated or infrared class",
        "Up to 10 guests",
      ],
      conditions: [
        "Additional guest: ₱650/person",
        "Does not include event styling, decorations, furniture or catering",
      ],
    },
  ],
};

export function getPricingOptionBySlug(slug: string): PricingOption | undefined {
  return Object.values(pricing)
    .flat()
    .find((option) => option.slug === slug);
}
