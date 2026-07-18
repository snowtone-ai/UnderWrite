import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();

function buildChain() {
  const chain: Record<string, unknown> = {};
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn();
  return chain;
}

let dbChain = buildChain();
const mockFrom = vi.fn().mockReturnValue(dbChain);
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getServiceClient: vi.fn(() => ({ from: mockFrom })),
  getSessionUser: vi.fn(() => mockGetUser()),
}));

import { POST, GET } from "./route";

beforeEach(() => {
  dbChain = buildChain();
  mockFrom.mockReturnValue(dbChain);
  mockGetUser.mockResolvedValue({ id: "user-1", email: "test@example.com" });
});

describe("POST /api/scans", () => {
  it("creates a scan and returns 201 with scanId", async () => {
    (dbChain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: "scan-uuid-123" },
      error: null,
    });

    const req = new NextRequest("http://localhost/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: "栃木県宇都宮市戸祭町1234",
        buildYear: 1985,
        structure: "木造",
        floorAreaSqm: 95.2,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.scanId).toBe("scan-uuid-123");
  });

  it("returns 422 for missing required fields", async () => {
    const req = new NextRequest("http://localhost/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: "栃木県" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("returns 422 for invalid buildYear", async () => {
    const req = new NextRequest("http://localhost/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: "栃木県宇都宮市",
        buildYear: 1800,
        structure: "木造",
        floorAreaSqm: 80,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: "栃木県宇都宮市戸祭町",
        buildYear: 1985,
        structure: "木造",
        floorAreaSqm: 95,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 500 when DB insert fails", async () => {
    (dbChain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const req = new NextRequest("http://localhost/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: "栃木県宇都宮市戸祭町",
        buildYear: 1985,
        structure: "木造",
        floorAreaSqm: 95,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe("GET /api/scans", () => {
  it("returns scan list for authenticated user", async () => {
    (dbChain.limit as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        { id: "scan-1", address: "栃木県宇都宮市", build_year: 1985, structure: "木造", floor_area_sqm: 95, status: "done", created_at: "2026-01-01T00:00:00Z" },
      ],
      error: null,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scans).toHaveLength(1);
    expect(body.scans[0].id).toBe("scan-1");
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });
});
