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

const PatchBody = z.object({ role: z.enum(["admin", "member"]) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchBody.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const db = getServiceClient();
  const { error } = await db
    .from("profiles")
    .upsert({ id: userId, role: parsed.data.role }, { onConflict: "id" });

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;

  if (userId === admin.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const db = getServiceClient();
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
