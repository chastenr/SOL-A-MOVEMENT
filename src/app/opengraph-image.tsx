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
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          background: "#f3ecdf",
          color: "#221f1c",
          padding: "54px 64px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 460,
            height: 460,
            borderRadius: 999,
            right: -130,
            top: -155,
            background: "#e5d8c3",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 690 }}>
          <div style={{ display: "flex", fontSize: 23, letterSpacing: "0.18em", color: "#a97456", textTransform: "uppercase" }}>
            Bacoor, Cavite · Philippines
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "column", fontFamily: "serif", fontSize: 62, lineHeight: 1.02, letterSpacing: "-0.035em" }}>
              <div style={{ display: "flex" }}>Move intentionally.</div>
              <div style={{ display: "flex" }}>Live fully.</div>
            </div>
            <div style={{ display: "flex", marginTop: 24, fontSize: 25, lineHeight: 1.45, color: "#4d382c" }}>
              Pilates, yoga, barre, strength, recovery and ballet in one boutique wellness studio.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 330, position: "relative" }}>
          <img src={logoSrc} alt="" width={290} height={296} />
        </div>
      </div>
    ),
    { ...size }
  );
}
