import { describe, expect, it } from "vitest";
import { getDisplayStatus } from "@/lib/class-session-status";

const BASE = {
  status: "scheduled" as const,
  start_at: "2026-09-14T07:00:00+08:00",
  booked_count: 2,
  capacity: 8,
  minimum_participants: null as number | null,
};

describe("getDisplayStatus", () => {
  it("returns CANCELLED regardless of booked count", () => {
    expect(getDisplayStatus({ ...BASE, status: "cancelled" })).toBe("CANCELLED");
  });

  it("returns COMPLETED regardless of booked count", () => {
    expect(getDisplayStatus({ ...BASE, status: "completed" })).toBe("COMPLETED");
  });

  it("returns FULL when booked_count reaches capacity", () => {
    expect(getDisplayStatus({ ...BASE, booked_count: 8, capacity: 8 })).toBe("FULL");
  });

  it("returns OPEN when there's no minimum and the class isn't full", () => {
    expect(getDisplayStatus(BASE)).toBe("OPEN");
  });

  it("returns OPEN when below minimum but the cutoff hasn't passed yet", () => {
    const farFuture = { ...BASE, start_at: "2099-01-01T07:00:00+08:00", minimum_participants: 4 };
    expect(getDisplayStatus(farFuture)).toBe("OPEN");
  });

  it("returns NEEDS ATTENTION when below minimum and the cutoff has passed", () => {
    const pastCutoff = { ...BASE, start_at: "2020-01-01T07:00:00+08:00", minimum_participants: 4 };
    expect(getDisplayStatus(pastCutoff)).toBe("NEEDS ATTENTION");
  });

  it("returns OPEN (not NEEDS ATTENTION) once the minimum is met, even past cutoff", () => {
    const metMinimum = {
      ...BASE,
      start_at: "2020-01-01T07:00:00+08:00",
      booked_count: 5,
      minimum_participants: 4,
    };
    expect(getDisplayStatus(metMinimum)).toBe("OPEN");
  });
});
