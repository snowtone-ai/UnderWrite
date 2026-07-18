import { cn } from "@/lib/utils";
import { formatMan } from "@/lib/format";
import type { RiskSummary } from "@/lib/domain";

type Severity = "critical" | "warning" | "info";

const DOT: Record<Severity, string> = {
  critical: "bg-nogo",
  warning: "bg-cond",
  info: "bg-muted-foreground",
};

/**
 * One risk warning, ordered by monetary impact (not by color). Severity is a
 * small dot; the amount speaks louder than the hue. Red appears at most once per screen.
 */
export function RiskItem({ risk }: { risk: RiskSummary }) {
  return (
    <div className="flex gap-3 border-t border-border py-4 first:border-t-0 first:pt-0">
      <span
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT[risk.severity])}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-medium">
            {risk.title}
            <span className="ml-2 text-xs text-muted-foreground">可能性 {risk.likelihood}</span>
          </p>
          <p className="tnum shrink-0 text-sm text-muted-foreground">
            追加 {formatMan(risk.costLowYen)}〜{formatMan(risk.costHighYen)}万円
          </p>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{risk.note}</p>
        <p className="mt-1.5 text-xs text-muted-foreground/80">根拠: {risk.evidence}</p>
      </div>
    </div>
  );
}
