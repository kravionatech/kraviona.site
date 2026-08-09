import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kraviona",
    short_name: "Kraviona",
    description: "Clear ideas for better work.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f7f6",
    theme_color: "#264b51",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
