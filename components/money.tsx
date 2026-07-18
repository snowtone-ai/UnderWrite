import { cn } from "@/lib/utils";
import { formatMan, formatManSigned } from "@/lib/format";

/**
 * A monetary figure in 万円. The number is the subject; the unit is small.
 * Always tabular-nums. `signed` renders a leading +/− for ledger lines.
 */
export function Money({
  yen,
  className,
  unitClassName,
  signed = false,
}: {
  yen: number;
  className?: string;
  unitClassName?: string;
  signed?: boolean;
}) {
  return (
    <span className={cn("tnum whitespace-nowrap", className)}>
      {signed ? formatManSigned(yen) : formatMan(yen)}
      <span className={cn("ml-0.5 font-medium text-[0.55em] text-muted-foreground", unitClassName)}>
        万円
      </span>
    </span>
  );
}
