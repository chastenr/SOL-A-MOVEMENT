import { describe, expect, it } from "vitest";
import { calculatePromotionalPriceCentavos, isPromotionActive, SEPTEMBER_PRE_OPENING_PROMOTION } from "./promotion-window";

const START = "2026-09-01T00:00:00+08:00";
const END = "2026-10-01T00:00:00+08:00";

describe("isPromotionActive", () => {
  it("does not apply the September promotion in August", () => {
    expect(isPromotionActive(START, END, new Date("2026-08-31T23:59:59+08:00").getTime())).toBe(false);
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

describe("September pre-opening promotion", () => {
  it("uses a discount below 10 percent", () => {
    expect(SEPTEMBER_PRE_OPENING_PROMOTION.discountPercent).toBe(9);
    expect(calculatePromotionalPriceCentavos(800_000, 9)).toBe(728_000);
    expect(calculatePromotionalPriceCentavos(600_000, 9)).toBe(546_000);
  });

  it("rejects discounts at or above the studio ceiling", () => {
    expect(() => calculatePromotionalPriceCentavos(100_000, 10)).toThrow(/less than 10%/);
  });

  it("does not include Intro Pass or Infratone", () => {
    expect(SEPTEMBER_PRE_OPENING_PROMOTION.eligiblePackageSlugs).not.toContain("founding-classic-intro");
    expect(SEPTEMBER_PRE_OPENING_PROMOTION.eligiblePackageSlugs).not.toContain("infratone-intro-class");
    expect(SEPTEMBER_PRE_OPENING_PROMOTION.eligiblePackageSlugs).not.toContain("infratone-unlimited");
  });
});
