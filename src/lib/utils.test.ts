import { describe, expect, it } from "vitest";
import { sanitizeRedirectTo, safeJsonLd, isUuid } from "@/lib/utils";

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

describe("safeJsonLd", () => {
  it("serializes normal data unchanged in structure", () => {
    expect(JSON.parse(safeJsonLd({ a: 1, b: "two" }))).toEqual({ a: 1, b: "two" });
  });

  it("escapes a literal </script> so it can't break out of the tag", () => {
    // Escaping the opening `<` alone is sufficient: an HTML parser requires
    // the literal `<` to recognize a closing tag at all, so `\u003c/script>`
    // is inert even though the trailing `>` is left untouched.
    const output = safeJsonLd({ description: "Ends with </script><script>alert(1)</script>" });
    expect(output).not.toContain("</script>");
    expect(output).toContain("\\u003c/script>");
  });

  it("round-trips through JSON.parse back to the original string", () => {
    const value = "Includes a < angle bracket and </script> sequence";
    const output = safeJsonLd({ value });
    expect(JSON.parse(output)).toEqual({ value });
  });
});

describe("isUuid", () => {
  it("accepts a well-formed v4 UUID", () => {
    expect(isUuid("3fa85f64-5717-4562-b3fc-2c963f66afa6")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isUuid("3FA85F64-5717-4562-B3FC-2C963F66AFA6")).toBe(true);
  });

  it("rejects a malformed value", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("3fa85f64-5717-4562-b3fc-2c963f66afa")).toBe(false);
    expect(isUuid("")).toBe(false);
  });

  it("rejects a UUID with SQL-injection-style payload appended", () => {
    expect(isUuid("3fa85f64-5717-4562-b3fc-2c963f66afa6; DROP TABLE bookings;")).toBe(false);
  });
});
