import { describe, it, expect, vi } from "vitest";
import { fetchResaleBaseline } from "./reinfolib";

describe("fetchResaleBaseline — no API key", () => {
  it("returns fallback with comps=0 and low confidence", async () => {
    const result = await fetchResaleBaseline("栃木県宇都宮市戸祭町", 95, undefined);
    expect(result.comps).toBe(0);
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.medianYen).toBeGreaterThan(0);
  });

  it("returns higher price for Tokyo", async () => {
    const tokyo = await fetchResaleBaseline("東京都渋谷区", 95, undefined);
    const rural = await fetchResaleBaseline("栃木県宇都宮市", 95, undefined);
    expect(tokyo.medianYen).toBeGreaterThan(rural.medianYen);
  });
});

describe("fetchResaleBaseline — fetch failure gracefully degrades", () => {
  it("returns fallback when fetch throws", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("network error")));
    const result = await fetchResaleBaseline("栃木県宇都宮市", 95, "fake-key");
    expect(result.comps).toBe(0);
    vi.unstubAllGlobals();
  });

  it("returns fallback when API returns non-ok status", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve({ ok: false, status: 503 } as Response),
    );
    const result = await fetchResaleBaseline("栃木県宇都宮市", 95, "fake-key");
    expect(result.confidence).toBeLessThan(0.5);
    vi.unstubAllGlobals();
  });
});
