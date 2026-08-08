import { describe, expect, it } from "vitest";
import { sanitizeRedirectTo } from "@/lib/utils";

describe("sanitizeRedirectTo", () => {
  it("allows a plain internal path", () => {
    expect(sanitizeRedirectTo("/checkout/classic-foundation")).toBe("/checkout/classic-foundation");
  });

  it("preserves query strings on an internal path", () => {
    expect(sanitizeRedirectTo("/account?tab=packages")).toBe("/account?tab=packages");
  });

  it("falls back to the default for an absolute URL", () => {
    expect(sanitizeRedirectTo("https://evil.com/phish")).toBe("/account");
  });

  it("falls back to the default for a protocol-relative URL", () => {
    expect(sanitizeRedirectTo("//evil.com")).toBe("/account");
  });

  it("falls back to the default for a backslash trick", () => {
    expect(sanitizeRedirectTo("/\\evil.com")).toBe("/account");
  });

  it("falls back to the default for a path not starting with /", () => {
    expect(sanitizeRedirectTo("evil.com")).toBe("/account");
  });

  it("falls back to the default for null/undefined", () => {
    expect(sanitizeRedirectTo(null)).toBe("/account");
    expect(sanitizeRedirectTo(undefined)).toBe("/account");
  });

  it("honors a custom fallback", () => {
    expect(sanitizeRedirectTo(undefined, "/admin")).toBe("/admin");
    expect(sanitizeRedirectTo("https://evil.com", "/admin")).toBe("/admin");
  });
});
