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
      { src: "/veora-mark.png", sizes: "608x676", type: "image/png" },
    ],
  };
}
