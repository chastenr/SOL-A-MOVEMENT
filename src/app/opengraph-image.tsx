import { ImageResponse } from "next/og";
import { siteConfig } from "@/data/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#221f1c",
          color: "#faf7f2",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 72, letterSpacing: 4 }}>{siteConfig.shortName}</div>
        <div style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", marginTop: 16, color: "#e5d8c3" }}>
          Movement &amp; Wellness
        </div>
        <div style={{ fontSize: 26, marginTop: 40, color: "#f3ecdf", fontStyle: "italic" }}>
          {siteConfig.tagline}
        </div>
      </div>
    ),
    { ...size }
  );
}
