import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, { params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;

  if (!UUID_RE.test(scanId)) {
    return NextResponse.json({ error: "Invalid scanId" }, { status: 400 });
  }

  const formData = await req.formData();
  const slot = (formData.get("slot") as string | null) ?? "unknown";
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Missing image field" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const contentType = file.type || "image/jpeg";
  const storagePath = `${scanId}/${slot}-${Date.now()}.jpg`;

  const db = getServiceClient();

  const { error: uploadErr } = await db.storage
    .from("property-photos")
    .upload(storagePath, arrayBuffer, { contentType, upsert: false });

  if (uploadErr) {
    console.error("storage upload error", uploadErr);
    return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
  }

  const { data: photoRow, error: photoErr } = await db
    .from("photos")
    .insert({ scan_id: scanId, storage_path: storagePath, slot, status: "pending" })
    .select("id")
    .single();

  if (photoErr || !photoRow) {
    console.error("photos insert error", photoErr);
    return NextResponse.json({ error: "DB error saving photo" }, { status: 500 });
  }

  return NextResponse.json({ photoId: photoRow.id }, { status: 201 });
}
