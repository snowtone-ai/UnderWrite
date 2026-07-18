import { describe, it, expect } from "vitest";
import { FindingV1, ScanInputV1, UnderwritingV1 } from "./index";

describe("FindingV1", () => {
  const valid = {
    _v: 1 as const,
    id: "a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5",
    surface: "天井",
    category: "雨漏り" as const,
    severity: "warning" as const,
    confidence: 0.85,
    evidenceText: "天井にシミが確認できる",
  };

  it("accepts valid finding", () => {
    expect(() => FindingV1.parse(valid)).not.toThrow();
  });

  it("rejects confidence out of range", () => {
    expect(() => FindingV1.parse({ ...valid, confidence: 1.5 })).toThrow();
  });

  it("rejects unknown severity", () => {
    expect(() => FindingV1.parse({ ...valid, severity: "unknown" })).toThrow();
  });

  it("rejects wrong schema version", () => {
    expect(() => FindingV1.parse({ ...valid, _v: 2 })).toThrow();
  });
});

describe("ScanInputV1", () => {
  const valid = {
    _v: 1 as const,
    scanId: "b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6",
    address: "栃木県宇都宮市戸祭町",
    buildYear: 1985,
    structure: "木造" as const,
    floorAreaSqm: 95.2,
  };

  it("accepts valid input", () => {
    expect(() => ScanInputV1.parse(valid)).not.toThrow();
  });

  it("rejects future build year", () => {
    expect(() => ScanInputV1.parse({ ...valid, buildYear: 2099 })).toThrow();
  });

  it("rejects empty address", () => {
    expect(() => ScanInputV1.parse({ ...valid, address: "" })).toThrow();
  });

  it("accepts optional landAreaSqm", () => {
    const result = ScanInputV1.parse({ ...valid, landAreaSqm: 152 });
    expect(result.landAreaSqm).toBe(152);
  });
});

describe("UnderwritingV1", () => {
  const valid: UnderwritingV1 = {
    _v: 1,
    scanId: "c3d4e5f6-a7b8-4c9d-8e1f-a2b3c4d5e6f7",
    engineVersion: "1.0.0",
    providerModelId: "gemini/gemini-2.0-flash",
    verdict: "conditional",
    purchaseCapYen: 8_200_000,
    headline: "この金額以下で買えれば粗利を確保できます",
    renovationCostYen: { p10: 4_500_000, p50: 6_200_000, p90: 7_800_000 },
    resalePriceYen: { p10: 16_800_000, p50: 18_800_000, p90: 20_400_000 },
    ledger: [
      { label: "想定再販価格", amountYen: 18_800_000, kind: "income" },
      { label: "想定粗利", amountYen: 3_000_000, kind: "total" },
    ],
    expectedGrossProfitYen: 3_000_000,
    expectedMarginPct: 16,
    risks: [],
    confidence: "標準",
    comps: 312,
    photoCoverage: { taken: 7, recommended: 10 },
    findings: [],
    assessedAt: "2026-07-18T16:40:00+09:00",
  };

  it("accepts valid underwriting result", () => {
    expect(() => UnderwritingV1.parse(valid)).not.toThrow();
  });

  it("rejects invalid verdict", () => {
    expect(() => UnderwritingV1.parse({ ...valid, verdict: "maybe" })).toThrow();
  });
});
