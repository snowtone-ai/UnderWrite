import type { ScanInputV1, FindingV1, UnderwritingV1, MoneyRange, RiskSummary } from "@/lib/domain";

export const ENGINE_VERSION = "1.0.0" as const;

// Base renovation rate (yen/sqm) and structure multipliers
const BASE_RATE_PER_SQM = 48_000;
const HIDDEN_DAMAGE_PER_SQM = 12_000;
const STRUCTURE_COEFF: Record<string, number> = {
  木造: 1.0,
  軽量鉄骨: 0.95,
  重量鉄骨: 0.9,
  鉄筋コンクリート: 0.85,
  その他: 1.0,
};
// Lognormal σ for renovation uncertainty
const BASE_SIGMA = 0.22;
const SIGMA_PER_CRITICAL = 0.04;
const SIGMA_PER_WARNING = 0.02;

// Standard expense ratio (purchase price × ratio)
const EXPENSE_RATIO = 0.08;
// Target gross margin ratio applied to resale P50
const TARGET_MARGIN_RATIO = 0.15;

export interface ResaleBaseline {
  medianYen: number;
  comps: number;
  confidence: number; // 0–1
}

export interface EngineInput {
  input: ScanInputV1;
  findings: FindingV1[];
  resaleBaseline: ResaleBaseline;
  providerModelId: string;
}

function lognormalPercentile(median: number, sigma: number, z: number): number {
  return Math.round(median * Math.exp(sigma * z));
}

function moneyRange(median: number, sigma: number): MoneyRange {
  return {
    p10: lognormalPercentile(median, sigma, -1.282),
    p50: Math.round(median),
    p90: lognormalPercentile(median, sigma, 1.282),
  };
}

function findingCostMidYen(f: FindingV1): number {
  if (f.costEstimateLowYen !== undefined && f.costEstimateHighYen !== undefined) {
    return (f.costEstimateLowYen + f.costEstimateHighYen) / 2;
  }
  // Default cost by severity when AI doesn't provide an estimate
  if (f.severity === "critical") return 1_000_000;
  if (f.severity === "warning") return 500_000;
  return 100_000;
}

function toRiskSummary(f: FindingV1): RiskSummary {
  const low = f.costEstimateLowYen ?? (f.severity === "critical" ? 600_000 : f.severity === "warning" ? 200_000 : 50_000);
  const high = f.costEstimateHighYen ?? (f.severity === "critical" ? 1_500_000 : f.severity === "warning" ? 800_000 : 200_000);
  const likelihood: RiskSummary["likelihood"] =
    f.confidence >= 0.7 ? "高" : f.confidence >= 0.4 ? "中" : "低";
  return {
    id: f.id,
    title: `${f.surface}の${f.category}`,
    likelihood,
    costLowYen: low,
    costHighYen: high,
    severity: f.severity,
    evidence: f.evidenceText,
    note: `信頼度 ${Math.round(f.confidence * 100)}%。${f.category}に関するリスクです。`,
  };
}

export function runEngine(engineInput: EngineInput): UnderwritingV1 {
  const { input, findings, resaleBaseline, providerModelId } = engineInput;
  const currentYear = new Date().getFullYear();
  const age = currentYear - input.buildYear;

  // Age coefficient: increases renovation cost with age (capped at 1.6×)
  const ageCoeff = Math.min(1 + Math.max(0, age - 20) * 0.012, 1.6);
  const structCoeff = STRUCTURE_COEFF[input.structure] ?? 1.0;

  // Base renovation cost (hidden damage model)
  const baseCostPerSqm = (BASE_RATE_PER_SQM + HIDDEN_DAMAGE_PER_SQM) * ageCoeff * structCoeff;
  const baseCost = baseCostPerSqm * input.floorAreaSqm;

  // Finding adjustments (observed damage)
  const findingAdjustment = findings.reduce((sum, f) => sum + findingCostMidYen(f), 0);

  const renovationMedian = baseCost + findingAdjustment;

  // Sigma grows with critical/warning findings (more uncertainty)
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const warningCount = findings.filter((f) => f.severity === "warning").length;
  const sigma = BASE_SIGMA + criticalCount * SIGMA_PER_CRITICAL + warningCount * SIGMA_PER_WARNING;

  const renovationCostYen = moneyRange(renovationMedian, sigma);

  const resaleMedian = resaleBaseline.medianYen;
  const resaleRange = moneyRange(resaleMedian, 0.12);

  // Purchase cap: resaleP50 − renovationP90 − expenses − target margin
  const expensesYen = Math.round(resaleMedian * EXPENSE_RATIO);
  const targetMarginYen = Math.round(resaleMedian * TARGET_MARGIN_RATIO);
  const purchaseCapYen = Math.max(
    0,
    resaleMedian - renovationCostYen.p90 - expensesYen - targetMarginYen,
  );

  // Actual expected margin with P50 renovation
  const grossProfitYen = resaleMedian - purchaseCapYen - renovationCostYen.p50 - expensesYen;
  const expectedMarginPct = Math.round((grossProfitYen / resaleMedian) * 100);

  const verdict: UnderwritingV1["verdict"] =
    expectedMarginPct >= 20 ? "go" : expectedMarginPct >= 8 ? "conditional" : "nogo";

  // Confidence: based on comps + photo count
  const photoCount = findings.length;
  const confidence: UnderwritingV1["confidence"] =
    resaleBaseline.comps >= 50 && photoCount >= 4
      ? "高"
      : resaleBaseline.comps >= 10 || photoCount >= 2
        ? "標準"
        : "低";

  const headline = buildHeadline(verdict, purchaseCapYen, expectedMarginPct);

  // Sort risks by cost impact (high→low)
  const risks: RiskSummary[] = findings
    .filter((f) => f.severity !== "info")
    .sort((a, b) => findingCostMidYen(b) - findingCostMidYen(a))
    .map(toRiskSummary);

  const ledger = [
    { label: "想定再販価格", amountYen: resaleMedian, kind: "income" as const },
    { label: "仕入（買付上限）", amountYen: -purchaseCapYen, kind: "cost" as const },
    { label: "リノベ費用（中央値）", amountYen: -renovationCostYen.p50, kind: "cost" as const },
    { label: "諸経費", amountYen: -expensesYen, kind: "cost" as const },
    { label: "想定粗利", amountYen: grossProfitYen, kind: "total" as const },
  ];

  return {
    _v: 1,
    scanId: input.scanId,
    engineVersion: ENGINE_VERSION,
    providerModelId,
    verdict,
    purchaseCapYen,
    headline,
    renovationCostYen,
    resalePriceYen: resaleRange,
    ledger,
    expectedGrossProfitYen: grossProfitYen,
    expectedMarginPct,
    risks,
    confidence,
    comps: resaleBaseline.comps,
    photoCoverage: { taken: photoCount, recommended: 7 },
    findings,
    assessedAt: new Date().toISOString(),
  };
}

function buildHeadline(
  verdict: UnderwritingV1["verdict"],
  cap: number,
  margin: number,
): string {
  const capMan = Math.round(cap / 10_000);
  if (verdict === "go")
    return `この金額以下で買えれば、粗利${margin}%（${capMan}万円基準）を確保できる見込みです。`;
  if (verdict === "conditional")
    return `この金額以下で買えれば、粗利${margin}%を8割の確率で確保できます。`;
  return `現在の相場では採算が取りにくい可能性があります。買付上限は${capMan}万円です。`;
}
