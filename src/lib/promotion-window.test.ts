import { describe, expect, it } from "vitest";
import { isPromotionActive } from "./promotion-window";

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
