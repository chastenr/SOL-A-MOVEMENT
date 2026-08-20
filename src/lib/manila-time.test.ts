import { describe, expect, it } from "vitest";
import {
  formatManilaDate,
  formatManilaDateKey,
  formatManilaDateTime,
  formatManilaFullDateTime,
  formatManilaLongDate,
  formatManilaTime,
} from "@/lib/manila-time";

describe("Manila date and time formatting", () => {
  const utcInstant = "2026-08-14T04:00:00.000Z";

  it("displays a UTC class instant in Philippine time", () => {
    expect(formatManilaTime(utcInstant)).toBe("12:00 PM");
    expect(formatManilaDate(utcInstant)).toBe("Aug 14, 2026");
    expect(formatManilaDateTime(utcInstant)).toBe("Aug 14, 2026 · 12:00 PM");
  });

  it("includes the correct Manila weekday in long labels", () => {
    expect(formatManilaFullDateTime(utcInstant)).toBe("Friday, August 14, 2026 at 12:00 PM");
  });

  it("uses the Manila calendar date when UTC is still on the previous day", () => {
    const afterMidnightInManila = "2026-08-14T17:30:00.000Z";

    expect(formatManilaLongDate(afterMidnightInManila)).toBe("August 15, 2026");
    expect(formatManilaDateKey(afterMidnightInManila)).toBe("2026-08-15");
    expect(formatManilaTime(afterMidnightInManila)).toBe("1:30 AM");
  });
});
