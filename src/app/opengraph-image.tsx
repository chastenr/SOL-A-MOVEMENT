import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public", "veora-logo-full.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      // Cream, not the site's usual dark charcoal — the logo art itself is
      // brown-on-transparent, drawn to sit on a light ground (see every
      // exported version of it), so this shows the real brand colors
      // instead of needing a color-inverted version like the navbar mark.
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3ecdf",
        }}
      >
        <img src={logoSrc} alt="" width={432} height={440} />
      </div>
    ),
    { ...size }
  );
}
