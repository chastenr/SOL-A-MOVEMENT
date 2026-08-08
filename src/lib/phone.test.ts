import { describe, expect, it } from "vitest";
import { normalizePhoneE164, isValidPhone, maskPhone } from "@/lib/phone";

describe("normalizePhoneE164", () => {
  it("normalizes a local PH mobile number with a leading zero", () => {
    expect(normalizePhoneE164("09171234567")).toBe("+639171234567");
  });

  it("normalizes a local PH mobile number with spaces", () => {
    expect(normalizePhoneE164("0917 123 4567")).toBe("+639171234567");
  });

  it("normalizes a local PH mobile number without a leading zero", () => {
    expect(normalizePhoneE164("9171234567")).toBe("+639171234567");
  });

  it("passes through an already-E.164 number", () => {
    expect(normalizePhoneE164("+639171234567")).toBe("+639171234567");
  });

  it("normalizes a non-PH E.164-formatted number with spaces/dashes", () => {
    expect(normalizePhoneE164("+1 555-123-4567")).toBe("+15551234567");
  });

  it("rejects an empty string", () => {
    expect(normalizePhoneE164("")).toBeNull();
  });

  it("rejects a too-short number", () => {
    expect(normalizePhoneE164("12345")).toBeNull();
  });

  it("rejects letters/garbage input", () => {
    expect(normalizePhoneE164("not-a-phone")).toBeNull();
  });
});

describe("isValidPhone", () => {
  it("accepts a normalizable number", () => {
    expect(isValidPhone("09171234567")).toBe(true);
  });

  it("rejects a non-normalizable number", () => {
    expect(isValidPhone("abc")).toBe(false);
  });
});

describe("maskPhone", () => {
  it("masks a PH number with the +63 prefix visible", () => {
    expect(maskPhone("+639171234567")).toBe("+63 ••• ••• 4567");
  });

  it("never includes more than the last 4 digits of the original number", () => {
    const masked = maskPhone("+15551234567");
    expect(masked.endsWith("4567")).toBe(true);
    expect(masked).not.toContain("555123");
  });
});
