import { describe, expect, it } from "vitest";
import { formatHourLabel, isWithinStudioHours, manilaLocalToUtc } from "@/lib/studio-hours";

describe("isWithinStudioHours", () => {
  it("accepts a class starting and ending inside 7 AM–8 PM", () => {
    expect(isWithinStudioHours("2026-08-10T07:00", 50)).toBe(true);
    expect(isWithinStudioHours("2026-08-10T19:00", 60)).toBe(true);
  });

  it("rejects a class starting before 7 AM", () => {
    expect(isWithinStudioHours("2026-08-10T06:59", 30)).toBe(false);
  });

  it("rejects a class ending after 8 PM", () => {
    expect(isWithinStudioHours("2026-08-10T19:30", 60)).toBe(false);
  });

  it("accepts a class ending exactly at 8 PM", () => {
    expect(isWithinStudioHours("2026-08-10T19:00", 60)).toBe(true);
  });

  it("accepts a class starting exactly at 7 AM", () => {
    expect(isWithinStudioHours("2026-08-10T07:00", 15)).toBe(true);
  });
});

describe("manilaLocalToUtc", () => {
  // Fixed, absolute expected instants — deliberately not compared against
  // `new Date(datetimeLocal)` here, since that comparison's outcome depends
  // on the machine running the test (it happens to match on a Manila-set
  // dev machine, which is exactly how this bug went unnoticed locally
  // while still being wrong on Vercel's UTC production runtime).
  it("converts a Manila wall-clock morning time to the correct UTC instant", () => {
    expect(manilaLocalToUtc("2026-08-10T07:00").toISOString()).toBe("2026-08-09T23:00:00.000Z");
  });

  it("converts a Manila wall-clock evening time to the correct UTC instant", () => {
    expect(manilaLocalToUtc("2026-08-10T19:30").toISOString()).toBe("2026-08-10T11:30:00.000Z");
  });
});

describe("formatHourLabel", () => {
  it("formats morning hours", () => {
    expect(formatHourLabel(7)).toBe("7:00 AM");
  });

  it("formats noon as 12 PM", () => {
    expect(formatHourLabel(12)).toBe("12:00 PM");
  });

  it("formats midnight as 12 AM", () => {
    expect(formatHourLabel(0)).toBe("12:00 AM");
  });

  it("formats evening hours", () => {
    expect(formatHourLabel(19)).toBe("7:00 PM");
  });
});
