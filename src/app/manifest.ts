import type { MetadataRoute } from "next";

// SRS §2 Frontend, NFR-07: cài được ra màn hình chính. Không có service worker.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nước Nôi",
    short_name: "Nước Nôi",
    lang: "vi",
    start_url: "/order",
    scope: "/",
    display: "standalone",
    background_color: "#141210",
    theme_color: "#141210",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
