import { cn } from "@/lib/utils";
import type { Verdict } from "@/lib/domain";

const VERDICT: Record<Verdict, { label: string; className: string; rule: string }> = {
  go: {
    label: "買い",
    className: "bg-go-bg text-go",
    rule: "bg-go",
  },
  conditional: {
    label: "買い（条件付き）",
    className: "bg-cond-bg text-cond",
    rule: "bg-cond",
  },
  nogo: {
    label: "見送り",
    className: "bg-nogo-bg text-nogo",
    rule: "bg-nogo",
  },
};

/** The verdict chip. Quiet, not a giant traffic light. */
export function VerdictBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  const v = VERDICT[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium",
        v.className,
        className,
      )}
    >
      {v.label}
    </span>
  );
}

/** Top rule color for the hero card (4px accent by verdict). */
export function verdictRule(verdict: Verdict): string {
  return VERDICT[verdict].rule;
}
