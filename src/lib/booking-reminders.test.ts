import { describe, expect, it } from "vitest";
import { getBookingReminderType } from "@/lib/booking-reminders";

describe("booking reminder windows", () => {
  const now = new Date("2026-09-14T02:00:00.000Z");

  it("selects the 24-hour reminder inside its tolerant cron window", () => {
    expect(getBookingReminderType("2026-09-15T02:05:00.000Z", now)).toBe("reminder_24h");
  });

  it("selects the 2-hour reminder inside its tolerant cron window", () => {
    expect(getBookingReminderType("2026-09-14T04:00:00.000Z", now)).toBe("reminder_2h");
  });

  it("skips bookings outside both windows and classes already started", () => {
    expect(getBookingReminderType("2026-09-14T10:00:00.000Z", now)).toBeNull();
    expect(getBookingReminderType("2026-09-14T01:00:00.000Z", now)).toBeNull();
  });
});
