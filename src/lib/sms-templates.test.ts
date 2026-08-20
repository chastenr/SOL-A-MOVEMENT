import { describe, expect, it } from "vitest";
import {
  bookingCancellationSms,
  bookingConfirmationSms,
  bookingReminderSms,
  newCustomerSignupSms,
  SMS_MAX_LENGTH,
} from "@/lib/sms-templates";

describe("booking SMS templates", () => {
  const startAt = "2026-08-23T02:00:00.000Z";

  it("uses Philippine time and stays within one ASCII-sized SMS target", () => {
    const message = bookingConfirmationSms({
      className: "Reformer Pilates",
      coachName: "Mia",
      date: "Aug 23",
      startAt,
    });
    expect(message).toContain("10:00 AM PHT");
    expect(message.length).toBeLessThanOrEqual(SMS_MAX_LENGTH);
  });

  it("creates distinct 24-hour and 2-hour reminders", () => {
    expect(bookingReminderSms({ type: "reminder_24h", className: "Pilates", coachName: "Mia", startAt })).toContain("tomorrow");
    expect(bookingReminderSms({ type: "reminder_2h", className: "Pilates", coachName: "Mia", startAt })).toContain("today");
  });

  it("keeps cancellation messages concise", () => {
    expect(bookingCancellationSms({ className: "Reformer Pilates", date: "Aug 23", startAt }).length)
      .toBeLessThanOrEqual(SMS_MAX_LENGTH);
  });

  it("creates a concise owner alert for a new customer signup", () => {
    const message = newCustomerSignupSms({
      firstName: "Alexandra",
      lastName: "Dela Cruz",
      email: "alexandra.delacruz@example.com",
      mobileNumber: "+639171234567",
    });

    expect(message).toContain("VEORA new signup");
    expect(message).toContain("Alexandra Dela Cruz");
    expect(message).toContain("alexandra.delacruz@example.com");
    expect(message).toContain("+639171234567");
    expect(message.length).toBeLessThanOrEqual(SMS_MAX_LENGTH);
  });
});
