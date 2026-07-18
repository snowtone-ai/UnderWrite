import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UnderWrite — 築古住宅アンダーライティングAI",
    short_name: "UnderWrite",
    description: "開けなくても、わかる。買付上限価格・再生コスト・粗利を即日算出。",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f4",
    theme_color: "#1e56b0",
    lang: "ja",
    icons: [
      { src: "/icon.png", type: "image/png", sizes: "512x512" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
