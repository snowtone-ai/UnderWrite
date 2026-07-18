// Simulated use-case data: 佐藤社長 (宇都宮) scans a 1985 wooden house.
// These display types are a prototype stand-in; T02 formalizes them as zod schemas
// in lib/domain and the dashboard will import from there. No AI/DB is called here.

export type Verdict = "go" | "conditional" | "nogo";
export type Likelihood = "高" | "中" | "低";
export type Severity = "critical" | "warning" | "info";

export interface MoneyRange {
  /** yen */ p10: number;
  /** yen */ p50: number;
  /** yen */ p90: number;
}

export interface RiskWarning {
  id: string;
  title: string;
  likelihood: Likelihood;
  costLowYen: number;
  costHighYen: number;
  severity: Severity;
  evidence: string;
  note: string;
}

export interface LedgerLine {
  label: string;
  /** yen; negative for costs */ amountYen: number;
  kind: "income" | "cost" | "total";
}

export interface UnderwritingResult {
  property: {
    address: string;
    buildYear: number;
    structure: string;
    floorAreaSqm: number;
    landAreaSqm: number;
    assessedAt: string;
  };
  verdict: Verdict;
  /** hero number, yen */ purchaseCapYen: number;
  headline: string;
  renovationCostYen: MoneyRange;
  resalePriceYen: MoneyRange;
  ledger: LedgerLine[];
  expectedGrossProfitYen: number;
  expectedMarginPct: number;
  risks: RiskWarning[];
  confidence: "高" | "標準" | "低";
  comps: number;
  photoCoverage: { taken: number; recommended: number };
}

export const SAMPLE_UNDERWRITING: UnderwritingResult = {
  property: {
    address: "栃木県宇都宮市戸祭町",
    buildYear: 1985,
    structure: "木造2階建",
    floorAreaSqm: 95.2,
    landAreaSqm: 152.0,
    assessedAt: "2026-07-18T16:40:00+09:00",
  },
  verdict: "conditional",
  purchaseCapYen: 8_200_000,
  headline: "この金額以下で買えれば、粗利180万円以上を8割の確率で確保できます。",
  renovationCostYen: { p10: 4_500_000, p50: 6_200_000, p90: 7_800_000 },
  resalePriceYen: { p10: 16_800_000, p50: 18_800_000, p90: 20_400_000 },
  ledger: [
    { label: "想定再販価格", amountYen: 18_800_000, kind: "income" },
    { label: "仕入（買付上限）", amountYen: -8_200_000, kind: "cost" },
    { label: "リノベ費用（中央値）", amountYen: -6_200_000, kind: "cost" },
    { label: "諸経費", amountYen: -1_400_000, kind: "cost" },
    { label: "想定粗利", amountYen: 3_000_000, kind: "total" },
  ],
  expectedGrossProfitYen: 3_000_000,
  expectedMarginPct: 16,
  risks: [
    {
      id: "foundation",
      title: "基礎の補修",
      likelihood: "中",
      costLowYen: 800_000,
      costHighYen: 1_800_000,
      severity: "critical",
      evidence: "外観（側面）・床下の傾き兆候",
      note: "この築年×地域は基礎補修の発生率が約34%。P90で+180万円を織り込んでいます。",
    },
    {
      id: "leak",
      title: "雨漏りの痕跡",
      likelihood: "高",
      costLowYen: 600_000,
      costHighYen: 1_200_000,
      severity: "warning",
      evidence: "天井（2階）のシミ",
      note: "天井に複数のシミ。屋根・防水の追加工事の可能性があります。",
    },
    {
      id: "termite",
      title: "白蟻の兆候",
      likelihood: "中",
      costLowYen: 400_000,
      costHighYen: 900_000,
      severity: "warning",
      evidence: "玄関まわりの木部",
      note: "玄関框に食害の可能性。床下点検で確定してください。",
    },
    {
      id: "plumbing",
      title: "給排水設備の老朽",
      likelihood: "高",
      costLowYen: 500_000,
      costHighYen: 700_000,
      severity: "info",
      evidence: "水回り（キッチン・浴室）",
      note: "築年から一式更新を前提に見込み済み。想定内のコストです。",
    },
  ],
  confidence: "標準",
  comps: 312,
  photoCoverage: { taken: 7, recommended: 10 },
};
