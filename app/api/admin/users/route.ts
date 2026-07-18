import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient, getSessionUser } from "@/lib/supabase/server";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return null;
  const db = getServiceClient();
  const { data } = await db.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getServiceClient();
  const { data: authData, error: authErr } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) return NextResponse.json({ error: "Failed to list users" }, { status: 500 });

  const { data: profiles } = await db.from("profiles").select("id, role");
  const roleMap = new Map((profiles ?? []).map((p) => [p.id, p.role as string]));

  const users = authData.users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    role: roleMap.get(u.id) ?? "member",
    createdAt: u.created_at,
    lastSignIn: u.last_sign_in_at ?? null,
    banned: u.banned_until ? new Date(u.banned_until) > new Date() : false,
  }));

  return NextResponse.json({ users });
}

const InviteBody = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = InviteBody.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const db = getServiceClient();
  const { error } = await db.auth.admin.inviteUserByEmail(parsed.data.email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 201 });
}
