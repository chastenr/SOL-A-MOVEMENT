import { describe, expect, it } from "vitest";
import { getBookingCutoff, isPastBookingCutoff, getManilaDayRange } from "@/lib/booking-cutoff";

describe("getBookingCutoff", () => {
  it("returns 10 PM Manila the calendar day before a morning session", () => {
    // 2026-09-14 07:00 Manila (UTC+8) == 2026-09-13 23:00 UTC.
    const sessionStart = new Date("2026-09-13T23:00:00Z");
    // Cutoff: 2026-09-13 22:00 Manila == 2026-09-13 14:00 UTC.
    expect(getBookingCutoff(sessionStart).toISOString()).toBe("2026-09-13T14:00:00.000Z");
  });

  it("uses the session's Manila-local calendar date, not its UTC date", () => {
    // 2026-09-14 00:00 Manila (just past local midnight) == 2026-09-13 16:00 UTC.
    // Local date is the 14th even though the UTC instant is still the 13th.
    const sessionStart = new Date("2026-09-13T16:00:00Z");
    expect(getBookingCutoff(sessionStart).toISOString()).toBe("2026-09-13T14:00:00.000Z");
  });

  it("matches the SQL logic's documented example for an evening class", () => {
    // 2026-09-14 18:00 Manila == 2026-09-14 10:00 UTC.
    const sessionStart = new Date("2026-09-14T10:00:00Z");
    expect(getBookingCutoff(sessionStart).toISOString()).toBe("2026-09-13T14:00:00.000Z");
  });
});

describe("isPastBookingCutoff", () => {
  const sessionStart = new Date("2026-09-13T23:00:00Z"); // cutoff == 2026-09-13T14:00:00Z

  it("is false just before the cutoff", () => {
    expect(isPastBookingCutoff(sessionStart, new Date("2026-09-13T13:59:59Z"))).toBe(false);
  });

  it("is true exactly at the cutoff", () => {
    expect(isPastBookingCutoff(sessionStart, new Date("2026-09-13T14:00:00Z"))).toBe(true);
  });

  it("is true well after the cutoff", () => {
    expect(isPastBookingCutoff(sessionStart, new Date("2026-09-13T20:00:00Z"))).toBe(true);
  });
});

describe("getManilaDayRange", () => {
  it("bounds a Manila calendar day even when the UTC date differs", () => {
    // 2026-09-13 20:00 UTC == 2026-09-14 04:00 Manila.
    const reference = new Date("2026-09-13T20:00:00Z");
    const { start, end } = getManilaDayRange(reference);
    // Manila midnight Sept 14 == 2026-09-13T16:00:00Z; the following midnight == 2026-09-14T16:00:00Z.
    expect(start.toISOString()).toBe("2026-09-13T16:00:00.000Z");
    expect(end.toISOString()).toBe("2026-09-14T16:00:00.000Z");
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });
});
