import Link from "next/link";
import { ArrowRight, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  { n: "01", label: "スキャン", body: "住所を取得し、気になる箇所を数枚撮影する（15分）。" },
  { n: "02", label: "照会", body: "公開データ（不動産情報ライブラリ 等）を自動照会する。" },
  { n: "03", label: "解析", body: "劣化診断と隠れ損傷の確率分布を推定する。" },
  { n: "04", label: "判断", body: "買付上限価格・粗利・リスクを即日お知らせする。" },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-[560px] px-5 py-14">
      <p className="text-[13px] font-medium tracking-wide text-primary">
        UnderWrite（アンダーライト）
      </p>
      <h1 className="mt-3 text-[34px] font-bold leading-tight tracking-tight">
        開けなくても、わかる。
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
        スマホスキャン15分と公開データだけで、築古住宅の「買付上限価格・再生コスト・隠れ損傷リスク・
        粗利」を即日算出する、買取再販・リフォーム業者向けのアンダーライティングAI。
      </p>

      <div className="mt-7 flex flex-col gap-2 sm:flex-row">
        <Button asChild size="lg" className="justify-center gap-2">
          <Link href="/scan">
            <ScanLine className="size-5" /> 査定をはじめる
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="justify-center gap-2">
          <Link href="/result">
            サンプル判定を見る <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <ol className="mt-12 grid gap-2">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="flex gap-4 rounded-xl border border-border bg-card px-4 py-4"
          >
            <span className="tnum text-sm font-medium text-primary">{s.n}</span>
            <div>
              <p className="font-medium">{s.label}</p>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-10 border-t border-border pt-5 text-[13px] leading-relaxed text-muted-foreground">
        査定結果は確率分布として提示し、最終判断は事業者に委ねます。計測でも積算でもなく、
        「目利き」そのものを支援します。
      </p>
    </main>
  );
}
