import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// after() must be mocked before route import
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: vi.fn() };
});

const mockUpload = vi.fn();
const mockInsert = vi.fn();

let dbChain: Record<string, unknown>;

function buildChain() {
  const chain: Record<string, unknown> = {};
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn();
  return chain;
}

const mockFrom = vi.fn();
const mockStorage = { from: vi.fn() };

vi.mock("@/lib/supabase/server", () => ({
  getServiceClient: vi.fn(() => ({
    from: mockFrom,
    storage: mockStorage,
  })),
  getSessionUser: vi.fn().mockResolvedValue({ id: "user-1" }),
}));

vi.mock("@/lib/ai/analyze-photo", () => ({
  analyzePhoto: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";

beforeEach(() => {
  dbChain = buildChain();
  mockFrom.mockReturnValue(dbChain);
  mockStorage.from.mockReturnValue({ upload: mockUpload });
  mockUpload.mockResolvedValue({ error: null });
  (dbChain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: { id: "photo-uuid-456" },
    error: null,
  });
});

const VALID_SCAN_ID = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";

function makeFormData(hasImage = true, slot = "front") {
  const fd = new FormData();
  if (hasImage) {
    const bytes = new Uint8Array(100).fill(0xff);
    const file = new File([bytes], "test.jpg", { type: "image/jpeg" });
    fd.append("image", file);
  }
  fd.append("slot", slot);
  return fd;
}

describe("POST /api/scans/[scanId]/photos", () => {
  it("returns 400 for invalid scanId format", async () => {
    const req = new NextRequest("http://localhost/api/scans/bad-id/photos", {
      method: "POST",
      body: makeFormData(),
    });

    const res = await POST(req, { params: Promise.resolve({ scanId: "bad-id" }) });
    expect(res.status).toBe(400);
  });

  it("returns 400 when image field is missing", async () => {
    const req = new NextRequest(`http://localhost/api/scans/${VALID_SCAN_ID}/photos`, {
      method: "POST",
      body: makeFormData(false),
    });

    const res = await POST(req, { params: Promise.resolve({ scanId: VALID_SCAN_ID }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Missing image");
  });

  it("returns 500 when storage upload fails", async () => {
    mockUpload.mockResolvedValue({ error: { message: "bucket full" } });

    const req = new NextRequest(`http://localhost/api/scans/${VALID_SCAN_ID}/photos`, {
      method: "POST",
      body: makeFormData(),
    });

    const res = await POST(req, { params: Promise.resolve({ scanId: VALID_SCAN_ID }) });
    expect(res.status).toBe(500);
  });

  it("returns 201 with photoId on success", async () => {
    const req = new NextRequest(`http://localhost/api/scans/${VALID_SCAN_ID}/photos`, {
      method: "POST",
      body: makeFormData(),
    });

    const res = await POST(req, { params: Promise.resolve({ scanId: VALID_SCAN_ID }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.photoId).toBe("photo-uuid-456");
  });
});
