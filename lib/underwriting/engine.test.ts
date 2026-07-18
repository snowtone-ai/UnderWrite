import { describe, it, expect } from "vitest";
import { runEngine } from "./engine";
import type { ScanInputV1, FindingV1 } from "@/lib/domain";

const BASE_INPUT: ScanInputV1 = {
  _v: 1,
  scanId: "d4e5f6a7-b8c9-4d0e-1f2a-b3c4d5e6f7a8",
  address: "栃木県宇都宮市戸祭町",
  buildYear: 1985,
  structure: "木造",
  floorAreaSqm: 95.2,
};

const RESALE = { medianYen: 18_800_000, comps: 312, confidence: 0.8 };

function makeFinding(overrides: Partial<FindingV1> = {}): FindingV1 {
  return {
    _v: 1,
    id: "e5f6a7b8-c9d0-4e1f-2a3b-c4d5e6f7a8b9",
    surface: "天井",
    category: "雨漏り",
    severity: "warning",
    confidence: 0.8,
    evidenceText: "天井にシミがある",
    ...overrides,
  };
}

describe("runEngine — determinism", () => {
  it("returns identical result for identical input", () => {
    const a = runEngine({ input: BASE_INPUT, findings: [], resaleBaseline: RESALE, providerModelId: "gemini/test" });
    const b = runEngine({ input: BASE_INPUT, findings: [], resaleBaseline: RESALE, providerModelId: "gemini/test" });
    // assessedAt is time-based; compare everything else
    expect({ ...a, assessedAt: "" }).toEqual({ ...b, assessedAt: "" });
  });
});

describe("runEngine — P10/P50/P90 ordering", () => {
  it("p10 < p50 < p90 for renovation cost", () => {
    const r = runEngine({ input: BASE_INPUT, findings: [], resaleBaseline: RESALE, providerModelId: "x" });
    expect(r.renovationCostYen.p10).toBeLessThan(r.renovationCostYen.p50);
    expect(r.renovationCostYen.p50).toBeLessThan(r.renovationCostYen.p90);
  });

  it("p10 < p50 < p90 for resale price", () => {
    const r = runEngine({ input: BASE_INPUT, findings: [], resaleBaseline: RESALE, providerModelId: "x" });
    expect(r.resalePriceYen.p10).toBeLessThan(r.resalePriceYen.p50);
    expect(r.resalePriceYen.p50).toBeLessThan(r.resalePriceYen.p90);
  });
});

describe("runEngine — critical finding raises costs", () => {
  it("critical finding increases P90 vs no findings", () => {
    const base = runEngine({ input: BASE_INPUT, findings: [], resaleBaseline: RESALE, providerModelId: "x" });
    const withCritical = runEngine({
      input: BASE_INPUT,
      findings: [makeFinding({ severity: "critical", costEstimateLowYen: 800_000, costEstimateHighYen: 1_800_000 })],
      resaleBaseline: RESALE,
      providerModelId: "x",
    });
    expect(withCritical.renovationCostYen.p90).toBeGreaterThan(base.renovationCostYen.p90);
    expect(withCritical.purchaseCapYen).toBeLessThan(base.purchaseCapYen);
  });
});

describe("runEngine — boundary values", () => {
  it("purchaseCapYen is non-negative", () => {
    const r = runEngine({
      input: { ...BASE_INPUT, buildYear: 1960, floorAreaSqm: 200 },
      findings: Array.from({ length: 5 }, (_, i) =>
        makeFinding({ id: crypto.randomUUID(), severity: "critical" }),
      ),
      resaleBaseline: { medianYen: 5_000_000, comps: 5, confidence: 0.3 },
      providerModelId: "x",
    });
    expect(r.purchaseCapYen).toBeGreaterThanOrEqual(0);
  });

  it("nogo verdict when margin is too low", () => {
    const r = runEngine({
      input: { ...BASE_INPUT, buildYear: 1960, floorAreaSqm: 200 },
      findings: Array.from({ length: 6 }, (_, i) =>
        makeFinding({ id: crypto.randomUUID(), severity: "critical" }),
      ),
      resaleBaseline: { medianYen: 5_000_000, comps: 3, confidence: 0.2 },
      providerModelId: "x",
    });
    expect(r.verdict).toBe("nogo");
  });

  it("go verdict for new cheap property with high resale", () => {
    const r = runEngine({
      input: { ...BASE_INPUT, buildYear: 2010, floorAreaSqm: 80 },
      findings: [],
      resaleBaseline: { medianYen: 30_000_000, comps: 100, confidence: 0.9 },
      providerModelId: "x",
    });
    expect(r.verdict).toBe("go");
  });
});
