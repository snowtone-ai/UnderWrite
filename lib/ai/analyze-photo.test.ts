import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted ensures these refs are available when vi.mock factories run
const { mockFrom, mockAnalyzeImages } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockAnalyzeImages: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/lib/ai", () => ({
  getAIProvider: vi.fn().mockResolvedValue({
    modelId: "gemini/gemini-2.5-flash",
    analyzeImages: mockAnalyzeImages,
    generateText: vi.fn(),
  }),
}));

import { analyzePhoto } from "./analyze-photo";

function buildChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.update = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  return chain;
}

let dbChain: ReturnType<typeof buildChain>;

beforeEach(() => {
  dbChain = buildChain();
  mockFrom.mockReturnValue(dbChain);
  mockAnalyzeImages.mockResolvedValue([
    {
      _v: 1,
      id: crypto.randomUUID(),
      surface: "天井",
      category: "雨漏り",
      severity: "warning",
      confidence: 0.8,
      evidenceText: "天井にシミ",
    },
  ]);
  dbChain.insert.mockResolvedValue({ error: null });
});

describe("analyzePhoto", () => {
  it("sets photo status to 'done' after successful analysis", async () => {
    await analyzePhoto("photo-1", "scan-1", "front", "base64data");

    const updateCalls = dbChain.update.mock.calls;
    const lastStatus = updateCalls.at(-1)?.[0] as Record<string, string>;
    expect(lastStatus).toMatchObject({ status: "done" });
  });

  it("inserts findings into DB on success", async () => {
    await analyzePhoto("photo-1", "scan-1", "front", "base64data");

    const insertCalls = dbChain.insert.mock.calls;
    expect(insertCalls.length).toBeGreaterThan(0);
    const rows = insertCalls[0][0] as Array<Record<string, unknown>>;
    expect(rows[0]).toMatchObject({ scan_id: "scan-1", photo_id: "photo-1" });
  });

  it("sets photo status to 'failed' when AI throws", async () => {
    mockAnalyzeImages.mockRejectedValue(new Error("API quota exceeded"));

    await analyzePhoto("photo-2", "scan-1", "roof", "base64data");

    const updateCalls = dbChain.update.mock.calls;
    const lastStatus = updateCalls.at(-1)?.[0] as Record<string, string>;
    expect(lastStatus).toMatchObject({ status: "failed" });
  });

  it("skips finding insert when AI returns empty array", async () => {
    mockAnalyzeImages.mockResolvedValue([]);

    await analyzePhoto("photo-3", "scan-1", "entrance", "base64data");

    expect(dbChain.insert.mock.calls.length).toBe(0);

    const lastStatus = dbChain.update.mock.calls.at(-1)?.[0] as Record<string, string>;
    expect(lastStatus).toMatchObject({ status: "done" });
  });
});
