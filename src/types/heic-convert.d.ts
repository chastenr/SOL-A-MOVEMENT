// heic-convert ships no type declarations and has no @types package —
// this covers the one function this codebase actually calls (see
// node_modules/heic-convert/lib.js for the real, verified signature).
declare module "heic-convert" {
  type ConvertOptions = {
    buffer: Buffer | Uint8Array;
    format: "JPEG" | "PNG";
    quality?: number;
  };

  function convert(options: ConvertOptions): Promise<Buffer>;

  export default convert;
}
