import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const mark = await readFile(join(process.cwd(), "public", "veora-mark.png"));
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    (
      // Transparent background, not the old solid-charcoal square — a
      // favicon needs to read on both light and dark browser tab bars, and
      // transparency (rather than picking one background color) is what
      // makes that automatic.
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={markSrc} alt="" width={28} height={31} />
      </div>
    ),
    { ...size }
  );
}
