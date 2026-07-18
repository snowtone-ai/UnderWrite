import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from "@supabase/ssr";
import { proxy } from "./proxy";

const mockGetUser = vi.fn();

beforeEach(() => {
  vi.mocked(createServerClient).mockReturnValue({
    auth: { getUser: mockGetUser },
  } as ReturnType<typeof createServerClient>);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
});

describe("proxy — unauthenticated user", () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it("redirects page routes to /login", async () => {
    const req = new NextRequest("http://localhost/scan");
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("returns 401 JSON for API routes", async () => {
    const req = new NextRequest("http://localhost/api/scans");
    const res = await proxy(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({ error: "Unauthorized" });
  });

  it("redirects /result/* to /login", async () => {
    const req = new NextRequest("http://localhost/result/abc-123");
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });
});

describe("proxy — authenticated user", () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1", email: "test@example.com" } } });
  });

  it("passes through page requests", async () => {
    const req = new NextRequest("http://localhost/scan");
    const res = await proxy(req);
    // NextResponse.next() returns 200 (no explicit redirect or error)
    expect(res.status).toBe(200);
  });

  it("passes through API requests", async () => {
    const req = new NextRequest("http://localhost/api/scans");
    const res = await proxy(req);
    expect(res.status).toBe(200);
  });
});
