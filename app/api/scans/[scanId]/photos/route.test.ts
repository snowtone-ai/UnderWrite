import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// after() must be mocked before route import
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: vi.fn() };
});

const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockGetSessionUser = vi.fn();

// Per-table chains: scans (ownership lookup), photos (count + insert)
function buildScansChain(scan: { id: string; user_id: string } | null) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: scan, error: null });
  return chain;
}

function buildPhotosChain(count: number, insertOk = true) {
  const chain: Record<string, unknown> = {};
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(
    insertOk
      ? { data: { id: "photo-uuid-456" }, error: null }
      : { data: null, error: { message: "insert failed" } },
  );
  chain.select = vi.fn().mockImplementation((_cols: string, opts?: { head?: boolean }) => {
    if (opts?.head) {
      const countChain = {
        eq: vi.fn().mockResolvedValue({ count, error: null }),
      };
      return countChain;
    }
    return chain;
  });
  return chain;
}

const mockFrom = vi.fn();
const mockStorage = { from: vi.fn() };

vi.mock("@/lib/supabase/server", () => ({
  getServiceClient: vi.fn(() => ({
    from: mockFrom,
    storage: mockStorage,
  })),
  getSessionUser: vi.fn(() => mockGetSessionUser()),
}));

vi.mock("@/lib/ai/analyze-photo", () => ({
  analyzePhoto: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";

const VALID_SCAN_ID = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";

function setupDb(
  opts: {
    scan?: { id: string; user_id: string } | null;
    photoCount?: number;
    insertOk?: boolean;
  } = {},
) {
  const scansChain = buildScansChain(
    opts.scan === undefined ? { id: VALID_SCAN_ID, user_id: "user-1" } : opts.scan,
  );
  const photosChain = buildPhotosChain(opts.photoCount ?? 0, opts.insertOk ?? true);
  mockFrom.mockImplementation((table: string) => (table === "scans" ? scansChain : photosChain));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSessionUser.mockResolvedValue({ id: "user-1" });
  setupDb();
  mockStorage.from.mockReturnValue({ upload: mockUpload, remove: mockRemove });
  mockUpload.mockResolvedValue({ error: null });
  mockRemove.mockResolvedValue({ error: null });
});

function makeFormData(
  opts: { hasImage?: boolean; slot?: string; type?: string; size?: number } = {},
) {
  const { hasImage = true, slot = "front", type = "image/jpeg", size = 100 } = opts;
  const fd = new FormData();
  if (hasImage) {
    const bytes = new Uint8Array(size).fill(0xff);
    const file = new File([bytes], "test.jpg", { type });
    fd.append("image", file);
  }
  fd.append("slot", slot);
  return fd;
}

function makeReq(fd: FormData, scanId = VALID_SCAN_ID) {
  return new NextRequest(`http://localhost/api/scans/${scanId}/photos`, {
    method: "POST",
    body: fd,
  });
}

describe("POST /api/scans/[scanId]/photos", () => {
  it("returns 400 for invalid scanId format", async () => {
    const res = await POST(makeReq(makeFormData(), "bad-id"), {
      params: Promise.resolve({ scanId: "bad-id" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetSessionUser.mockResolvedValue(null);

    const res = await POST(makeReq(makeFormData()), {
      params: Promise.resolve({ scanId: VALID_SCAN_ID }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 for a slot with path characters", async () => {
    const res = await POST(makeReq(makeFormData({ slot: "../evil" })), {
      params: Promise.resolve({ scanId: VALID_SCAN_ID }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when image field is missing", async () => {
    const res = await POST(makeReq(makeFormData({ hasImage: false })), {
      params: Promise.resolve({ scanId: VALID_SCAN_ID }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Missing image");
  });

  it("returns 415 for a non-image content type", async () => {
    const res = await POST(makeReq(makeFormData({ type: "application/pdf" })), {
      params: Promise.resolve({ scanId: VALID_SCAN_ID }),
    });
    expect(res.status).toBe(415);
  });

  it("returns 413 when the file exceeds 10MB", async () => {
    const res = await POST(makeReq(makeFormData({ size: 10 * 1024 * 1024 + 1 })), {
      params: Promise.resolve({ scanId: VALID_SCAN_ID }),
    });
    expect(res.status).toBe(413);
  });

  it("returns 404 when the scan belongs to another user", async () => {
    setupDb({ scan: { id: VALID_SCAN_ID, user_id: "someone-else" } });

    const res = await POST(makeReq(makeFormData()), {
      params: Promise.resolve({ scanId: VALID_SCAN_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when the scan does not exist", async () => {
    setupDb({ scan: null });

    const res = await POST(makeReq(makeFormData()), {
      params: Promise.resolve({ scanId: VALID_SCAN_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 409 when the photo limit is reached", async () => {
    setupDb({ photoCount: 20 });

    const res = await POST(makeReq(makeFormData()), {
      params: Promise.resolve({ scanId: VALID_SCAN_ID }),
    });
    expect(res.status).toBe(409);
  });

  it("returns 500 when storage upload fails", async () => {
    mockUpload.mockResolvedValue({ error: { message: "bucket full" } });

    const res = await POST(makeReq(makeFormData()), {
      params: Promise.resolve({ scanId: VALID_SCAN_ID }),
    });
    expect(res.status).toBe(500);
  });

  it("removes the uploaded blob when the photo row insert fails", async () => {
    setupDb({ insertOk: false });

    const res = await POST(makeReq(makeFormData()), {
      params: Promise.resolve({ scanId: VALID_SCAN_ID }),
    });
    expect(res.status).toBe(500);
    // The orphaned storage object must be cleaned up.
    expect(mockRemove).toHaveBeenCalledTimes(1);
    const removedPaths = mockRemove.mock.calls[0][0] as string[];
    expect(removedPaths[0]).toMatch(new RegExp(`^${VALID_SCAN_ID}/front-\\d+\\.jpg$`));
  });

  it("returns 201 with photoId on success", async () => {
    const res = await POST(makeReq(makeFormData()), {
      params: Promise.resolve({ scanId: VALID_SCAN_ID }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.photoId).toBe("photo-uuid-456");
  });
});
