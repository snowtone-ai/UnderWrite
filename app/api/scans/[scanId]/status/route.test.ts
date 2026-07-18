import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetSessionUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getServiceClient: vi.fn(() => ({ from: mockFrom })),
  getSessionUser: vi.fn(() => mockGetSessionUser()),
}));

vi.mock("@/lib/data", () => ({
  fetchResaleBaseline: vi
    .fn()
    .mockResolvedValue({ medianYen: 18_800_000, comps: 100, confidence: 0.8 }),
}));

vi.mock("@/lib/ai", () => ({
  getAIProvider: vi.fn().mockResolvedValue({
    modelId: "gemini/gemini-2.5-flash",
    analyzeImages: vi.fn(),
    generateText: vi.fn(),
  }),
}));

import { GET } from "./route";

const VALID_SCAN_ID = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";

type ScanRow = {
  id: string;
  user_id: string | null;
  address: string;
  build_year: number;
  structure: string;
  floor_area_sqm: number;
  land_area_sqm: number | null;
};

const OWNED_SCAN: ScanRow = {
  id: VALID_SCAN_ID,
  user_id: "user-1",
  address: "栃木県宇都宮市戸祭町",
  build_year: 1985,
  structure: "木造",
  floor_area_sqm: 95.2,
  land_area_sqm: null,
};

function setupDb(opts: {
  scan?: ScanRow | null;
  photos?: Array<{ status: string }>;
  cachedResult?: unknown;
}) {
  const scansChain: Record<string, unknown> = {};
  scansChain.select = vi.fn().mockReturnValue(scansChain);
  scansChain.eq = vi.fn().mockReturnValue(scansChain);
  scansChain.single = vi.fn().mockResolvedValue({
    data: opts.scan ?? null,
    error: opts.scan ? null : { message: "not found" },
  });
  scansChain.update = vi.fn().mockReturnValue(scansChain);

  const photosChain: Record<string, unknown> = {};
  photosChain.select = vi.fn().mockReturnValue(photosChain);
  photosChain.eq = vi.fn().mockResolvedValue({ data: opts.photos ?? [], error: null });

  const uwChain: Record<string, unknown> = {};
  uwChain.select = vi.fn().mockReturnValue(uwChain);
  uwChain.eq = vi.fn().mockReturnValue(uwChain);
  uwChain.maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: opts.cachedResult ? { result: opts.cachedResult } : null, error: null });
  uwChain.upsert = vi.fn().mockResolvedValue({ error: null });

  const findingsChain: Record<string, unknown> = {};
  findingsChain.select = vi.fn().mockReturnValue(findingsChain);
  findingsChain.eq = vi.fn().mockResolvedValue({ data: [], error: null });

  mockFrom.mockImplementation((table: string) => {
    if (table === "scans") return scansChain;
    if (table === "photos") return photosChain;
    if (table === "underwritings") return uwChain;
    return findingsChain;
  });
}

function makeReq(scanId = VALID_SCAN_ID) {
  return new NextRequest(`http://localhost/api/scans/${scanId}/status`);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSessionUser.mockResolvedValue({ id: "user-1" });
  setupDb({ scan: OWNED_SCAN });
});

describe("GET /api/scans/[scanId]/status", () => {
  it("returns 400 for invalid scanId format", async () => {
    const res = await GET(makeReq("bad-id"), { params: Promise.resolve({ scanId: "bad-id" }) });
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetSessionUser.mockResolvedValue(null);

    const res = await GET(makeReq(), { params: Promise.resolve({ scanId: VALID_SCAN_ID }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when the scan belongs to another user", async () => {
    setupDb({ scan: { ...OWNED_SCAN, user_id: "someone-else" } });

    const res = await GET(makeReq(), { params: Promise.resolve({ scanId: VALID_SCAN_ID }) });
    expect(res.status).toBe(404);
  });

  it("returns 404 when the scan does not exist", async () => {
    setupDb({ scan: null });

    const res = await GET(makeReq(), { params: Promise.resolve({ scanId: VALID_SCAN_ID }) });
    expect(res.status).toBe(404);
  });

  it("returns pending while photos are still processing", async () => {
    setupDb({ scan: OWNED_SCAN, photos: [{ status: "analyzing" }, { status: "done" }] });

    const res = await GET(makeReq(), { params: Promise.resolve({ scanId: VALID_SCAN_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("pending");
  });

  it("returns cached result with photo stats", async () => {
    setupDb({
      scan: OWNED_SCAN,
      photos: [{ status: "done" }, { status: "failed" }],
      cachedResult: { verdict: "go" },
    });

    const res = await GET(makeReq(), { params: Promise.resolve({ scanId: VALID_SCAN_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("done");
    expect(body.result).toEqual({ verdict: "go" });
    expect(body.photos).toEqual({ total: 2, failed: 1 });
  });

  it("runs the engine and returns a result when all photos are done", async () => {
    setupDb({ scan: OWNED_SCAN, photos: [{ status: "done" }] });

    const res = await GET(makeReq(), { params: Promise.resolve({ scanId: VALID_SCAN_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("done");
    expect(body.result.purchaseCapYen).toBeGreaterThanOrEqual(0);
    expect(body.photos).toEqual({ total: 1, failed: 0 });
  });
});
