import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Veora Wellness",
    short_name: "Veora",
    description: "Pilates and wellness studio in Bacoor, Cavite, Philippines.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#4d382c",
    icons: [
      { src: "/favicon-mark.png", sizes: "256x256", type: "image/png", purpose: "any" },
      { src: "/favicon-mark.png", sizes: "256x256", type: "image/png", purpose: "maskable" },
    ],
  };
}
