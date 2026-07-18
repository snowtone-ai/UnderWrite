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

function buildDb(role: string) {
  const profilesChain: Record<string, unknown> = {};
  profilesChain.select = vi.fn().mockReturnValue(profilesChain);
  profilesChain.eq = vi.fn().mockReturnValue(profilesChain);
  profilesChain.single = vi.fn().mockResolvedValue({ data: { role } });
  profilesChain.upsert = vi.fn().mockResolvedValue({ error: null });

  const auth = {
    admin: {
      deleteUser: vi.fn().mockResolvedValue({ error: null }),
    },
  };
  const from = vi.fn().mockReturnValue(profilesChain);
  return { from, auth, profilesChain };
}

import { PATCH, DELETE } from "./route";

const ADMIN_ID = "admin-uuid-111";
const TARGET_ID = "target-uuid-222";

describe("PATCH /api/admin/users/[userId]", () => {
  it("returns 403 for non-admin", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    mockGetServiceClient.mockReturnValue(buildDb("member"));

    const req = new NextRequest(`http://localhost/api/admin/users/${TARGET_ID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ userId: TARGET_ID }) });
    expect(res.status).toBe(403);
  });

  it("returns 422 for invalid role", async () => {
    mockGetSessionUser.mockResolvedValue({ id: ADMIN_ID });
    mockGetServiceClient.mockReturnValue(buildDb("admin"));

    const req = new NextRequest(`http://localhost/api/admin/users/${TARGET_ID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "superuser" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ userId: TARGET_ID }) });
    expect(res.status).toBe(422);
  });

  it("returns 200 when role update succeeds", async () => {
    mockGetSessionUser.mockResolvedValue({ id: ADMIN_ID });
    mockGetServiceClient.mockReturnValue(buildDb("admin"));

    const req = new NextRequest(`http://localhost/api/admin/users/${TARGET_ID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "member" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ userId: TARGET_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

describe("DELETE /api/admin/users/[userId]", () => {
  it("returns 403 for non-admin", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    mockGetServiceClient.mockReturnValue(buildDb("member"));

    const req = new NextRequest(`http://localhost/api/admin/users/${TARGET_ID}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ userId: TARGET_ID }) });
    expect(res.status).toBe(403);
  });

  it("returns 400 when admin tries to delete own account", async () => {
    mockGetSessionUser.mockResolvedValue({ id: ADMIN_ID });
    mockGetServiceClient.mockReturnValue(buildDb("admin"));

    const req = new NextRequest(`http://localhost/api/admin/users/${ADMIN_ID}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ userId: ADMIN_ID }) });
    expect(res.status).toBe(400);
  });

  it("returns 200 when deletion succeeds", async () => {
    mockGetSessionUser.mockResolvedValue({ id: ADMIN_ID });
    mockGetServiceClient.mockReturnValue(buildDb("admin"));

    const req = new NextRequest(`http://localhost/api/admin/users/${TARGET_ID}`, { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ userId: TARGET_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
