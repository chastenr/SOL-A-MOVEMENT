import heicConvert from "heic-convert";

/**
 * HEIC/HEIF is a container format (ISOBMFF, the same wrapper MP4 uses) — a
 * photo saved or shared from an iPhone with a ".jpg"/".png" name is very
 * often still actually HEIC underneath, which no browser <img> tag and no
 * simple magic-byte image sniffer recognizes. Detected by the container's
 * "ftyp" box (bytes 4-7) and one of HEIC's known major-brand codes (bytes
 * 8-11) — see ISO/IEC 14496-12.
 */
export function isHeic(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const isFtypBox = bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
  if (!isFtypBox) return false;
  const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  return ["heic", "heix", "heim", "heis", "hevc", "hevm", "hevs", "mif1"].includes(brand);
}

/** Throws on a genuinely corrupt/unsupported file — callers should catch and surface a clear message. */
export async function convertHeicToJpeg(bytes: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  const converted = await heicConvert({ buffer: Buffer.from(bytes), format: "JPEG", quality: 0.9 });
  // Uint8Array.from() (not `new Uint8Array(converted)`) copies into a fresh,
  // definitely-ArrayBuffer-backed array — sidesteps a TS strictness split
  // where Buffer's .buffer is typed ArrayBufferLike (allows SharedArrayBuffer).
  return Uint8Array.from(converted);
}
