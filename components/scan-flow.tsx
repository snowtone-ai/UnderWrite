"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, MapPin, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Shot = { id: string; label: string; hint: string; core?: boolean };

const SHOTS: Shot[] = [
  { id: "front", label: "外観（正面）", hint: "建物の正面全体", core: true },
  { id: "side", label: "外観（側面）", hint: "左右から1枚ずつ", core: true },
  { id: "entrance", label: "玄関・室内", hint: "入ってすぐの様子", core: true },
  { id: "water", label: "水回り", hint: "キッチン・浴室・洗面", core: true },
  { id: "roof", label: "屋根まわり", hint: "軒先・雨樋・外壁上部" },
  { id: "ceiling", label: "天井", hint: "シミ・雨漏り痕の有無" },
  { id: "floor", label: "床・床下", hint: "傾き・きしみが気になる所" },
];

const CORE_REQUIRED = 4;
const HIGH_PRECISION = SHOTS.length;

function precision(count: number): { level: string; next: string | null } {
  if (count < CORE_REQUIRED)
    return { level: "低", next: `あと${CORE_REQUIRED - count}枚で「標準」になります` };
  if (count < HIGH_PRECISION)
    return { level: "標準", next: `あと${HIGH_PRECISION - count}枚で「高」になります` };
  return { level: "高", next: null };
}

export function ScanFlow() {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [taken, setTaken] = useState<Set<string>>(new Set());

  const count = taken.size;
  const p = precision(count);
  const canSubmit = count >= CORE_REQUIRED;

  const capture = (id: string) => setTaken((prev) => new Set(prev).add(id));

  return (
    <main className="mx-auto max-w-[560px] px-4 pb-28 pt-5">
      <h1 className="text-[22px] font-bold">新しい査定</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        現地で15分。住所と気になる箇所の写真だけで大丈夫です。
      </p>

      {/* Address */}
      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-medium text-muted-foreground">① 物件の住所</p>
        <Button size="lg" variant="outline" className="w-full justify-center gap-2">
          <MapPin className="size-5 text-primary" aria-hidden /> 現在地から住所を取得
        </Button>
        <div className="mt-3">
          <label htmlFor="zip" className="text-xs text-muted-foreground">
            うまく取れないときは郵便番号（7桁）
          </label>
          <input
            id="zip"
            inputMode="numeric"
            placeholder="例：320-0031"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className="mt-1 h-12 w-full rounded-md border border-border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
        </div>
      </section>

      {/* Photo checklist */}
      <section className="mt-4">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm font-medium text-muted-foreground">② 写真を撮る</p>
          <p className="text-xs text-muted-foreground">最低{CORE_REQUIRED}枚から判定できます</p>
        </div>

        {/* Precision meter (not a quota) */}
        <div className="mb-3 rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm">
            現在の判定精度：<span className="font-bold">{p.level}</span>
            {p.next && <span className="text-muted-foreground"> — {p.next}</span>}
          </p>
          <div className="mt-2 flex gap-1">
            {SHOTS.map((s) => (
              <span
                key={s.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  taken.has(s.id) ? "bg-primary" : "bg-border-strong/60",
                )}
              />
            ))}
          </div>
        </div>

        <ul className="grid gap-2">
          {SHOTS.map((s) => {
            const done = taken.has(s.id);
            return (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-lg",
                    done ? "bg-go-bg text-go" : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="size-5" aria-hidden />
                  ) : (
                    <Camera className="size-5" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {s.label}
                    {s.core && !done && <span className="ml-2 text-xs text-primary">基本</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{s.hint}</p>
                </div>
                <label className="shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={() => capture(s.id)}
                  />
                  <span
                    className={cn(
                      "inline-flex h-11 cursor-pointer items-center rounded-md px-4 text-sm font-medium",
                      done
                        ? "text-muted-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    )}
                  >
                    {done ? "撮り直す" : "撮影"}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <WifiOff className="size-3.5" aria-hidden /> 圏外でも撮影を続けられます。電波が戻り次第、自動で送信します。
        </p>
      </section>

      {/* Submit */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/90 backdrop-blur">
        <div
          className="mx-auto max-w-[560px] px-4 py-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <Button
            size="lg"
            disabled={!canSubmit}
            onClick={() => router.push("/result")}
            className="w-full justify-center"
          >
            {canSubmit ? `査定を依頼する（${count}枚）` : `あと${CORE_REQUIRED - count}枚で査定できます`}
          </Button>
        </div>
      </div>
    </main>
  );
}
