import { cn } from "@/lib/utils";
import { formatMan } from "@/lib/format";
import type { MoneyRange } from "@/lib/sample/underwriting";

/**
 * A single horizontal range bar for a P10→P90 distribution with a P50 tick.
 * No histogram, no violin — one honest band. The median is emphasized; the
 * endpoints are the 8-in-10 spread. Uncertainty is spoken in plain words below.
 */
export function RangeBar({
  label,
  range,
  caption,
  className,
}: {
  label: string;
  range: MoneyRange;
  caption: string;
  className?: string;
}) {
  const span = Math.max(range.p90 - range.p10, 1);
  // Clamp so a skewed distribution (p50 outside [p10,p90]) never overflows the bar.
  const medianPct = Math.min(100, Math.max(0, ((range.p50 - range.p10) / span) * 100));

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>

      <div className="relative h-3 rounded-full bg-border-strong/70">
        <div
          className="absolute top-[-3px] h-[18px] w-0.5 rounded bg-foreground"
          style={{ left: `calc(${medianPct}% - 1px)` }}
          aria-hidden
        />
      </div>

      <div className="relative h-5 text-xs text-muted-foreground">
        <span className="tnum absolute left-0">{formatMan(range.p10)}万</span>
        <span
          className="tnum absolute -translate-x-1/2 font-bold text-foreground"
          style={{ left: `${medianPct}%` }}
        >
          {formatMan(range.p50)}万
        </span>
        <span className="tnum absolute right-0">{formatMan(range.p90)}万</span>
      </div>

      <p className="text-[13px] leading-relaxed text-muted-foreground">{caption}</p>
    </div>
  );
}
