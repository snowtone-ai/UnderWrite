import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockGetSessionUser, mockGetServiceClient } = vi.hoisted(() => ({
  mockGetSessionUser: vi.fn(),
  mockGetServiceClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSessionUser: mockGetSessionUser,
  getServiceClient: mockGetServiceClient,
}));

type MockChain = Record<string, ReturnType<typeof vi.fn>>;

function buildAdminDb(role: string, listUsersResult: unknown = { users: [] }) {
  const chain: MockChain = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: { role } });

  const from = vi.fn().mockReturnValue(chain);
  const auth = {
    admin: {
      listUsers: vi.fn().mockResolvedValue({ data: listUsersResult, error: null }),
      inviteUserByEmail: vi.fn().mockResolvedValue({ error: null }),
    },
  };

  return { from, auth, chain: chain as MockChain };
}

import { GET, POST } from "./route";

describe("GET /api/admin/users", () => {
  it("returns 403 when not authenticated", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    mockGetServiceClient.mockReturnValue(buildAdminDb("admin"));

    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 403 when user is not admin", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "user-1" });
    const db = buildAdminDb("member");
    mockGetServiceClient.mockReturnValue(db);

    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns user list for admin", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "admin-1" });
    const db = buildAdminDb("admin", {
      users: [
        { id: "user-2", email: "user@example.com", created_at: "2026-01-01T00:00:00Z", last_sign_in_at: null, banned_until: null },
      ],
    });
    db.chain.select.mockReturnValue(db.chain);
    db.chain.single = vi.fn().mockResolvedValue({ data: { role: "admin" } });
    // second from() call for profiles
    const profilesChain = { select: vi.fn().mockResolvedValue({ data: [{ id: "user-2", role: "member" }] }) };
    db.from
      .mockReturnValueOnce(db.chain)   // profiles lookup for requireAdmin
      .mockReturnValueOnce(profilesChain); // profiles lookup in GET handler
    mockGetServiceClient.mockReturnValue(db);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.users).toHaveLength(1);
    expect(body.users[0].email).toBe("user@example.com");
  });
});

describe("POST /api/admin/users (invite)", () => {
  it("returns 403 for non-admin", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    mockGetServiceClient.mockReturnValue(buildAdminDb("member"));

    const req = new NextRequest("http://localhost/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "new@example.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 422 for invalid email", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "admin-1" });
    mockGetServiceClient.mockReturnValue(buildAdminDb("admin"));

    const req = new NextRequest("http://localhost/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("returns 201 when invite succeeds", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "admin-1" });
    mockGetServiceClient.mockReturnValue(buildAdminDb("admin"));

    const req = new NextRequest("http://localhost/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "new@example.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
