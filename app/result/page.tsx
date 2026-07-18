import Link from "next/link";
import { ArrowLeft, ChevronDown, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMan } from "@/lib/format";
import { Money } from "@/components/money";
import { VerdictBadge, verdictRule } from "@/components/verdict-badge";
import { RangeBar } from "@/components/range-bar";
import { RiskItem } from "@/components/risk-item";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";
import { SAMPLE_UNDERWRITING as u } from "@/lib/sample/underwriting";

export default function ResultPage() {
  const assessed = new Date(u.property.assessedAt).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const age = new Date().getFullYear() - u.property.buildYear;

  return (
    <main className="mx-auto max-w-[560px] px-4 pb-28 pt-5">
      {/* Header */}
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/"
            className="mb-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <LogoMark className="size-4" />
            <ArrowLeft className="size-3.5" aria-hidden /> 物件一覧
          </Link>
          <h1 className="truncate text-[17px] font-medium">{u.property.address}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {u.property.structure}・{u.property.buildYear}年築（築{age}年）・
            延床{u.property.floorAreaSqm}㎡ ／ {assessed} 判定
          </p>
        </div>
        <button
          type="button"
          className="-mr-2 shrink-0 rounded-md px-2 py-2 text-xs font-medium text-primary"
        >
          再計算
        </button>
      </header>

      {/* Verdict hero */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className={cn("h-1 w-full", verdictRule(u.verdict))} />
        <div className="p-5">
          <VerdictBadge verdict={u.verdict} />
          <p className="mt-4 text-sm text-muted-foreground">買付上限価格</p>
          <div className="mt-1">
            <Money yen={u.purchaseCapYen} className="text-[44px] font-bold leading-none tracking-tight" />
          </div>
          <p className="mt-4 text-[15px] leading-relaxed">{u.headline}</p>
        </div>
      </section>

      {/* Renovation cost distribution */}
      <section className="mt-4 rounded-xl border border-border bg-card p-5">
        <RangeBar
          label="リノベ費用の見込み"
          range={u.renovationCostYen}
          caption={`10回やれば8回は ${formatMan(u.renovationCostYen.p10)}万〜${formatMan(
            u.renovationCostYen.p90,
          )}万円 に収まる見込みです。太字は中央値。`}
        />
      </section>

      {/* Ledger */}
      <section className="mt-4 rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-medium text-muted-foreground">収支の内訳</p>
        <table className="w-full text-[15px]">
          <tbody>
            {u.ledger.map((line) => {
              const isTotal = line.kind === "total";
              return (
                <tr
                  key={line.label}
                  className={cn(isTotal && "border-t border-border-strong")}
                >
                  <th
                    scope="row"
                    className={cn(
                      "py-1.5 text-left font-normal text-muted-foreground",
                      isTotal && "pt-2.5 font-medium text-foreground",
                    )}
                  >
                    {line.label}
                  </th>
                  <td
                    className={cn(
                      "py-1.5 text-right",
                      isTotal ? "pt-2.5 font-bold" : "text-foreground",
                    )}
                  >
                    <Money yen={line.amountYen} signed={line.kind === "cost"} />
                    {isTotal && (
                      <span className="ml-2 text-xs font-medium text-muted-foreground">
                        （{u.expectedMarginPct}%）
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Risks */}
      <section className="mt-4 rounded-xl border border-border bg-card p-5">
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          リスク警告（影響額の大きい順）
        </p>
        <div>
          {u.risks.map((risk) => (
            <RiskItem key={risk.id} risk={risk} />
          ))}
        </div>
      </section>

      {/* Evidence (collapsed by default) */}
      <details className="group mt-4 rounded-xl border border-border bg-card p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
          この判定の根拠
          <ChevronDown
            className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-muted-foreground">
          <p>
            近隣の成約事例 <span className="tnum font-medium text-foreground">{u.comps}</span> 件と、
            写真 {u.photoCoverage.taken} 枚（推奨 {u.photoCoverage.recommended} 枚）を照合しています。
          </p>
          <p>
            現在の判定精度は「<span className="font-medium text-foreground">{u.confidence}</span>」です。
            <span className="text-primary">床下の写真</span>を追加すると精度が上がります。
          </p>
          <p>
            ※ 本結果は確率分布に基づく参考値です。最終的な買付判断は事業者ご自身で行ってください。
          </p>
        </div>
      </details>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/90 backdrop-blur">
        <div
          className="mx-auto flex max-w-[560px] items-center justify-between gap-3 px-4 py-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center gap-2">
            <VerdictBadge verdict={u.verdict} />
            <Money yen={u.purchaseCapYen} className="text-base font-bold" />
          </div>
          <Button className="gap-1.5">
            <Share2 className="size-4" aria-hidden /> PDFで共有
          </Button>
        </div>
      </div>
    </main>
  );
}
