import { describe, expect, it } from "vitest";
import { getDisplayStatus } from "@/lib/class-session-status";

const BASE = {
  status: "scheduled" as const,
  start_at: "2026-09-14T07:00:00+08:00",
  end_at: "2026-09-14T07:50:00+08:00",
  booked_count: 2,
  capacity: 8,
  minimum_participants: null as number | null,
  booking_enabled: true,
};

describe("getDisplayStatus", () => {
  const beforeClass = new Date("2026-09-13T21:00:00+08:00");

  it("returns CANCELLED regardless of booked count", () => {
    expect(getDisplayStatus({ ...BASE, status: "cancelled" }, beforeClass)).toBe("CANCELLED");
  });

  it("returns COMPLETED regardless of booked count", () => {
    expect(getDisplayStatus({ ...BASE, status: "completed" }, beforeClass)).toBe("COMPLETED");
  });

  it("returns COMPLETED once the scheduled class has ended", () => {
    expect(getDisplayStatus(BASE, new Date("2026-09-14T07:50:00+08:00"))).toBe("COMPLETED");
  });

  it("returns FULL when booked_count reaches capacity", () => {
    expect(getDisplayStatus({ ...BASE, booked_count: 8, capacity: 8 }, beforeClass)).toBe("FULL");
  });

  it("returns OPEN when there's no minimum and the class isn't full", () => {
    expect(getDisplayStatus(BASE, beforeClass)).toBe("OPEN");
  });

  it("returns OPEN when below minimum but the cutoff hasn't passed yet", () => {
    const farFuture = { ...BASE, start_at: "2099-01-01T07:00:00+08:00", minimum_participants: 4 };
    expect(getDisplayStatus(farFuture, beforeClass)).toBe("OPEN");
  });

  it("returns NEEDS ATTENTION when below minimum and the cutoff has passed", () => {
    const afterCutoff = new Date("2026-09-13T22:05:00+08:00");
    expect(getDisplayStatus({ ...BASE, minimum_participants: 4 }, afterCutoff)).toBe("NEEDS ATTENTION");
  });

  it("returns OPEN (not NEEDS ATTENTION) once the minimum is met, even past cutoff", () => {
    const metMinimum = {
      ...BASE,
      booked_count: 5,
      minimum_participants: 4,
    };
    expect(getDisplayStatus(metMinimum, new Date("2026-09-13T22:05:00+08:00"))).toBe("OPEN");
  });

  it("returns BOOKING CLOSED when booking_enabled is false, even with open spots", () => {
    expect(getDisplayStatus({ ...BASE, booking_enabled: false }, beforeClass)).toBe("BOOKING CLOSED");
  });

  it("returns CANCELLED over BOOKING CLOSED when both apply", () => {
    expect(getDisplayStatus({ ...BASE, status: "cancelled", booking_enabled: false }, beforeClass)).toBe(
      "CANCELLED"
    );
  });
});
