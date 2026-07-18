import { z } from "zod";
import { FindingV1 } from "./finding";

const MoneyRange = z.object({
  p10: z.number(),
  p50: z.number(),
  p90: z.number(),
});

const LedgerLine = z.object({
  label: z.string(),
  amountYen: z.number(),
  kind: z.enum(["income", "cost", "total"]),
});

const RiskSummary = z.object({
  id: z.string(),
  title: z.string(),
  likelihood: z.enum(["高", "中", "低"]),
  costLowYen: z.number(),
  costHighYen: z.number(),
  severity: z.enum(["critical", "warning", "info"]),
  evidence: z.string(),
  note: z.string(),
});

export const UnderwritingV1 = z.object({
  _v: z.literal(1),
  scanId: z.string().uuid(),
  engineVersion: z.string(),
  providerModelId: z.string(),
  verdict: z.enum(["go", "conditional", "nogo"]),
  purchaseCapYen: z.number(),
  headline: z.string(),
  renovationCostYen: MoneyRange,
  resalePriceYen: MoneyRange,
  ledger: z.array(LedgerLine),
  expectedGrossProfitYen: z.number(),
  expectedMarginPct: z.number(),
  risks: z.array(RiskSummary),
  confidence: z.enum(["高", "標準", "低"]),
  comps: z.number().int().nonnegative(),
  photoCoverage: z.object({ taken: z.number().int(), recommended: z.number().int() }),
  findings: z.array(FindingV1),
  assessedAt: z.string().datetime({ offset: true }),
});

export type UnderwritingV1 = z.infer<typeof UnderwritingV1>;
export type Verdict = UnderwritingV1["verdict"];
export type MoneyRange = z.infer<typeof MoneyRange>;
export type LedgerLine = z.infer<typeof LedgerLine>;
export type RiskSummary = z.infer<typeof RiskSummary>;
