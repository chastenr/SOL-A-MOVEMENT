import { describe, expect, it } from "vitest";
import { calculatePromotionalPriceCentavos, isPromotionActive, OPENING_PROMOTION } from "./promotion-window";

const START = "2026-08-22T00:00:00+08:00";
const END = "2026-10-01T00:00:00+08:00";

describe("isPromotionActive", () => {
  it("starts the opening promotion on August 22", () => {
    expect(isPromotionActive(START, END, new Date("2026-08-21T23:59:59+08:00").getTime())).toBe(false);
    expect(isPromotionActive(START, END, new Date("2026-08-22T00:00:00+08:00").getTime())).toBe(true);
  });

  it("applies the promotion throughout September", () => {
    expect(isPromotionActive(START, END, new Date("2026-09-15T12:00:00+08:00").getTime())).toBe(true);
  });

  it("stops the promotion at the start of October", () => {
    expect(isPromotionActive(START, END, new Date("2026-10-01T00:00:00+08:00").getTime())).toBe(false);
  });

  it("does not treat a package without a sale window as discounted", () => {
    expect(isPromotionActive(null, null)).toBe(false);
  });
});

describe("opening promotion", () => {
  it("uses the confirmed Signature and Prestige offer prices", () => {
    expect(calculatePromotionalPriceCentavos(800_000, 12.5)).toBe(700_000);
    expect(calculatePromotionalPriceCentavos(1_000_000, 30)).toBe(700_000);
  });

  it("rejects discounts above the studio ceiling", () => {
    expect(() => calculatePromotionalPriceCentavos(100_000, 50.01)).toThrow(/no more than 50%/);
  });

  it("limits the offer to Signature and Prestige", () => {
    expect(OPENING_PROMOTION.eligiblePackageSlugs).toEqual([
      "6-month-unlimited",
      "12-month-unlimited",
    ]);
  });
});
