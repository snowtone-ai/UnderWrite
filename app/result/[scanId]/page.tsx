"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Loader2, Plus, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMan } from "@/lib/format";
import { Money } from "@/components/money";
import { VerdictBadge, verdictRule } from "@/components/verdict-badge";
import { RangeBar } from "@/components/range-bar";
import { RiskItem } from "@/components/risk-item";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";
import type { UnderwritingV1 } from "@/lib/domain";

type StatusResponse =
  | { status: "done"; result: UnderwritingV1 }
  | { status: "pending" }
  | { error: string };

export default function ResultPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const [result, setResult] = useState<UnderwritingV1 | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      while (!cancelled) {
        try {
          const res = await fetch(`/api/scans/${scanId}/status`);
          if (!res.ok) {
            setErrorMsg("判定結果の取得に失敗しました");
            return;
          }
          const data = (await res.json()) as StatusResponse;
          if ("error" in data) {
            setErrorMsg(data.error);
            return;
          }
          if (data.status === "done") {
            setResult(data.result);
            return;
          }
          // pending — retry after 2s
          await new Promise((r) => setTimeout(r, 2000));
        } catch {
          setErrorMsg("ネットワークエラーが発生しました");
          return;
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [scanId]);

  if (errorMsg) {
    return (
      <main className="mx-auto max-w-[560px] px-4 pt-10 text-center">
        <p className="text-destructive">{errorMsg}</p>
        <Link href="/scan" className="mt-4 inline-block text-sm text-primary">
          やり直す
        </Link>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="mx-auto flex max-w-[560px] flex-col items-center justify-center gap-4 px-4 pt-24">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">AIが写真を解析中です。しばらくお待ちください…</p>
      </main>
    );
  }

  const u = result;
  const assessed = new Date(u.assessedAt).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="mx-auto max-w-[560px] px-4 pb-28 pt-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/scans"
            className="mb-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <LogoMark className="size-4" />
            <ArrowLeft className="size-3.5" aria-hidden /> 物件一覧
          </Link>
          <h1 className="truncate text-[17px] font-medium">査定結果</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{assessed} 判定</p>
        </div>
        <Link
          href="/scan"
          className="print-hide -mr-2 shrink-0 rounded-md px-2 py-2 text-xs font-medium text-primary"
        >
          新しい査定
        </Link>
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
                <tr key={line.label} className={cn(isTotal && "border-t border-border-strong")}>
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
      {u.risks.length > 0 && (
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
      )}

      {/* Evidence */}
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
          </p>
          <p>
            ※ 本結果は確率分布に基づく参考値です。最終的な買付判断は事業者ご自身で行ってください。
          </p>
          <p className="text-[11px]">
            エンジン: {u.engineVersion} / モデル: {u.providerModelId}
          </p>
        </div>
      </details>

      {/* Sticky action bar */}
      <div className="print-hide fixed inset-x-0 bottom-0 border-t border-border bg-background/90 backdrop-blur">
        <div
          className="mx-auto flex max-w-[560px] items-center justify-between gap-3 px-4 py-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center gap-2">
            <VerdictBadge verdict={u.verdict} />
            <Money yen={u.purchaseCapYen} className="text-base font-bold" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => window.print()}
            >
              <Printer className="size-4" aria-hidden /> PDFで保存
            </Button>
            <Button asChild className="gap-1.5">
              <Link href="/scan">
                <Plus className="size-4" aria-hidden /> 新しい査定
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
