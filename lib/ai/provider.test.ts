import { describe, it, expect } from "vitest";
import { FindingV1, SCHEMA_VERSION } from "@/lib/domain";

// Tests that the zod boundary validation works correctly —
// provider implementations must produce valid FindingV1 objects.
describe("FindingV1 boundary validation", () => {
  it("rejects schema-non-conformant AI output", () => {
    const badOutput = { surface: "天井", severity: "unknown", confidence: 2 };
    const result = FindingV1.safeParse({ _v: SCHEMA_VERSION, ...badOutput });
    expect(result.success).toBe(false);
  });

  it("accepts minimal conformant output", () => {
    const good = {
      _v: SCHEMA_VERSION,
      id: crypto.randomUUID(),
      surface: "天井",
      category: "雨漏り",
      severity: "warning",
      confidence: 0.85,
      evidenceText: "天井にシミ",
    };
    expect(FindingV1.safeParse(good).success).toBe(true);
  });

  it("accepts finding with cost estimates", () => {
    const good = {
      _v: SCHEMA_VERSION,
      id: crypto.randomUUID(),
      surface: "基礎",
      category: "ひび割れ",
      severity: "critical",
      confidence: 0.9,
      evidenceText: "基礎にひび割れ確認",
      costEstimateLowYen: 800_000,
      costEstimateHighYen: 1_800_000,
    };
    expect(FindingV1.safeParse(good).success).toBe(true);
  });
});
