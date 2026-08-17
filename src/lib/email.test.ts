import { describe, expect, it } from "vitest";
import { escapeEmailHtml } from "@/lib/email";

describe("escapeEmailHtml", () => {
  it("renders customer input as text instead of email markup", () => {
    expect(escapeEmailHtml(`<a href="https://example.com?a=1&b=2">O'Reilly</a>`)).toBe(
      "&lt;a href=&quot;https://example.com?a=1&amp;b=2&quot;&gt;O&#39;Reilly&lt;/a&gt;"
    );
  });
});
