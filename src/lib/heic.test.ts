import { describe, expect, it } from "vitest";
import { isHeic } from "@/lib/heic";

// A real HEIC file's first bytes: a 4-byte box-size field (value doesn't
// matter for detection), then the ASCII "ftyp" box type, then a 4-byte
// major-brand code identifying the specific HEIF variant.
function ftypBox(brand: string): Uint8Array {
  const bytes = new Uint8Array(12);
  bytes.set([0x00, 0x00, 0x00, 0x18], 0); // box size (arbitrary, unchecked)
  bytes.set([..."ftyp"].map((c) => c.charCodeAt(0)), 4);
  bytes.set([...brand].map((c) => c.charCodeAt(0)), 8);
  return bytes;
}

describe("isHeic", () => {
  it("recognizes the common HEIC major-brand codes", () => {
    for (const brand of ["heic", "heix", "heim", "heis", "hevc", "hevm", "hevs", "mif1"]) {
      expect(isHeic(ftypBox(brand))).toBe(true);
    }
  });

  it("rejects a JPEG", () => {
    expect(isHeic(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(false);
  });

  it("rejects a PNG", () => {
    expect(isHeic(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(false);
  });

  it("rejects an ftyp box with an unrelated brand (e.g. an MP4)", () => {
    expect(isHeic(ftypBox("isom"))).toBe(false);
  });

  it("rejects input shorter than the brand field", () => {
    expect(isHeic(new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]))).toBe(false);
  });
});
