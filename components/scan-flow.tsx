"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { STRUCTURES, type Structure } from "@/lib/domain";

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
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per photo
const MAX_DIMENSION = 2048; // longest edge after client-side compression
const COMPRESS_THRESHOLD_BYTES = 1.5 * 1024 * 1024; // skip re-encode below this

// Downscale + re-encode to JPEG before upload so field uploads over mobile
// networks stay fast. Falls back to the original file if the browser cannot
// decode it (e.g. HEIC on non-Safari) — the server validates type/size again.
async function prepareUpload(file: File): Promise<File> {
  const alreadySmall =
    file.size <= COMPRESS_THRESHOLD_BYTES && (file.type === "image/jpeg" || file.type === "image/webp");
  if (alreadySmall) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function precision(count: number): { level: string; next: string | null } {
  if (count < CORE_REQUIRED)
    return { level: "低", next: `あと${CORE_REQUIRED - count}枚で「標準」になります` };
  if (count < HIGH_PRECISION)
    return { level: "標準", next: `あと${HIGH_PRECISION - count}枚で「高」になります` };
  return { level: "高", next: null };
}

const currentYear = new Date().getFullYear();

export function ScanFlow() {
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [buildYear, setBuildYear] = useState<string>("");
  const [structure, setStructure] = useState<Structure>("木造");
  const [floorArea, setFloorArea] = useState<string>("");
  const [files, setFiles] = useState<Map<string, File>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [uploadState, setUploadState] = useState<{
    current: string;
    done: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Survives a failed submit so retries reuse the same scan and skip uploaded photos
  const scanIdRef = useRef<string | null>(null);
  const uploadedSlotsRef = useRef<Set<string>>(new Set());

  const count = files.size;
  const p = precision(count);

  const propertyValid =
    address.trim().length > 0 &&
    buildYear.length === 4 &&
    Number(buildYear) >= 1900 &&
    Number(buildYear) <= currentYear &&
    Number(floorArea) > 0;

  const canSubmit = propertyValid && count >= CORE_REQUIRED && !submitting;

  const capture = (id: string, file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setError(`ファイルサイズが大きすぎます（上限10MB）。圧縮してから再度お試しください。`);
      return;
    }
    setError(null);
    setFiles((prev) => {
      const next = new Map(prev);
      next.set(id, file);
      return next;
    });
  };

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      if (!scanIdRef.current) {
        const createRes = await fetch("/api/scans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: address.trim(),
            buildYear: Number(buildYear),
            structure,
            floorAreaSqm: Number(floorArea),
          }),
        });

        if (!createRes.ok) throw new Error("査定の作成に失敗しました");

        const { scanId } = (await createRes.json()) as { scanId: string };
        scanIdRef.current = scanId;
      }
      const scanId = scanIdRef.current;

      const pending = [...files].filter(([slot]) => !uploadedSlotsRef.current.has(slot));
      const total = pending.length;
      let done = 0;
      const failedLabels: string[] = [];

      for (const [slot, file] of pending) {
        const label = SHOTS.find((s) => s.id === slot)?.label ?? slot;
        setUploadState({ current: label, done, total });

        const upload = await prepareUpload(file);
        const fd = new FormData();
        fd.append("slot", slot);
        fd.append("image", upload);

        try {
          const photoRes = await fetch(`/api/scans/${scanId}/photos`, {
            method: "POST",
            body: fd,
          });
          if (photoRes.ok) {
            uploadedSlotsRef.current.add(slot);
          } else {
            failedLabels.push(label);
          }
        } catch {
          failedLabels.push(label);
        }
        done++;
      }

      if (failedLabels.length > 0) {
        setError(
          `${failedLabels.length}枚（${failedLabels.join("・")}）の送信に失敗しました。` +
            `通信環境をご確認のうえ、もう一度ボタンを押すと失敗分だけ再送します。`,
        );
        setSubmitting(false);
        setUploadState(null);
        return;
      }

      router.push(`/result/${scanId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setSubmitting(false);
      setUploadState(null);
    }
  }

  function submitLabel() {
    if (uploadState) {
      return `${uploadState.current}を解析中… (${uploadState.done + 1}/${uploadState.total})`;
    }
    if (submitting) return "送信中…";
    if (!propertyValid) return "物件情報を入力してください";
    if (count < CORE_REQUIRED) return `あと${CORE_REQUIRED - count}枚で査定できます`;
    return `査定を依頼する（${count}枚）`;
  }

  return (
    <main className="mx-auto max-w-[560px] px-4 pb-28 pt-5">
      <Link href="/" className="mb-6 inline-flex">
        <Logo />
      </Link>
      <h1 className="text-[22px] font-bold">新しい査定</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        現地で15分。住所と気になる箇所の写真だけで大丈夫です。
      </p>

      {/* Property info */}
      <section className="mt-6 rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-sm font-medium text-muted-foreground">① 物件情報</p>

        <div>
          <label htmlFor="address" className="text-xs text-muted-foreground">
            住所
          </label>
          <input
            id="address"
            placeholder="例：栃木県宇都宮市戸祭町1234"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 h-12 w-full rounded-md border border-border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="buildYear" className="text-xs text-muted-foreground">
              築年（西暦）
            </label>
            <input
              id="buildYear"
              inputMode="numeric"
              placeholder="例：1985"
              value={buildYear}
              onChange={(e) => setBuildYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="mt-1 h-12 w-full rounded-md border border-border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            />
          </div>
          <div>
            <label htmlFor="floorArea" className="text-xs text-muted-foreground">
              延床面積（㎡）
            </label>
            <input
              id="floorArea"
              inputMode="decimal"
              placeholder="例：95.2"
              value={floorArea}
              onChange={(e) => setFloorArea(e.target.value)}
              className="mt-1 h-12 w-full rounded-md border border-border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            />
          </div>
        </div>

        <div>
          <label htmlFor="structure" className="text-xs text-muted-foreground">
            構造
          </label>
          <div className="relative mt-1">
            <select
              id="structure"
              value={structure}
              onChange={(e) => setStructure(e.target.value as Structure)}
              className="h-12 w-full appearance-none rounded-md border border-border bg-background px-3 pr-10 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              {STRUCTURES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* Photo checklist */}
      <section className="mt-4">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm font-medium text-muted-foreground">② 写真を撮る</p>
          <p className="text-xs text-muted-foreground">最低{CORE_REQUIRED}枚から判定できます</p>
        </div>

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
                  files.has(s.id) ? "bg-primary" : "bg-border-strong/60",
                )}
              />
            ))}
          </div>
        </div>

        <ul className="grid gap-2">
          {SHOTS.map((s) => {
            const done = files.has(s.id);
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
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) capture(s.id, f);
                    }}
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
      </section>

      {error && (
        <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      {/* Submit */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/90 backdrop-blur">
        <div
          className="mx-auto max-w-[560px] px-4 py-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          {uploadState && (
            <div className="mb-2 overflow-hidden rounded-full bg-border h-1">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(uploadState.done / uploadState.total) * 100}%` }}
              />
            </div>
          )}
          <Button
            size="lg"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="w-full justify-center"
          >
            {submitLabel()}
          </Button>
        </div>
      </div>
    </main>
  );
}
