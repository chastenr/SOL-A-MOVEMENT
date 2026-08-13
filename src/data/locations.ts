export type LocationHours = { day: string; hours: string };

export type Location = {
  slug: string;
  name: string;
  address: {
    line1: string;
    line2: string;
    full: string;
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  phone: string;
  email: string;
  bookingEmail: string;
  mapUrl: string;
  geo: { lat: number; lng: number };
  /** Empty when the studio hasn't published hours yet — see `hoursNote`. */
  hours: LocationHours[];
  hoursNote?: string;
  /** Service slugs (from services.ts) offered at this location. */
  services: string[];
  active: boolean;
};

// Real, verified location data. Veora currently operates a single studio —
// this array is structured so additional branches can be appended later
// (e.g. locations.push({ slug: "makati", ... })) without changing any
// consuming component.
export const locations: Location[] = [
  {
    slug: "bacoor",
    name: "Veora Wellness — Bacoor",
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
    phone: "+63 917 319 4772",
    email: "bookings@veora.ph",
    bookingEmail: "bookings@veora.ph",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=14.4108087,120.9503414",
    geo: { lat: 14.4108087, lng: 120.9503414 },
    // Confirmed by the client: studio is open 7:00 AM – 8:00 PM daily.
    hours: [
      { day: "Monday – Sunday", hours: "7:00 AM – 8:00 PM" },
    ],
    hoursNote: undefined,
    services: ["mat-pilates", "yoga", "barre", "strength-hiit", "recovery-restore", "ballet"],
    active: true,
  },
];

export function getPrimaryLocation(): Location {
  return locations.find((location) => location.active) ?? locations[0];
}

export function getActiveLocations(): Location[] {
  return locations.filter((location) => location.active);
}
