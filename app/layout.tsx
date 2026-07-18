import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UnderWrite — 築古住宅アンダーライティングAI",
  description: "開けなくても、わかる。スマホスキャンと公開データで、築古住宅の買付上限価格・再生コスト・粗利を即日算出する。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
