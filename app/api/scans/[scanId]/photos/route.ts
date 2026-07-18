import { NextRequest, NextResponse, after } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { analyzePhoto } from "@/lib/ai/analyze-photo";

export const maxDuration = 60;

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

  // Upload to Storage
  const { error: uploadErr } = await db.storage
    .from("property-photos")
    .upload(storagePath, arrayBuffer, { contentType, upsert: false });

  if (uploadErr) {
    console.error("storage upload error", uploadErr);
    return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
  }

  // Insert photo row as "pending" — analysis runs after response is sent
  const { data: photoRow, error: photoErr } = await db
    .from("photos")
    .insert({ scan_id: scanId, storage_path: storagePath, slot, status: "pending" })
    .select("id")
    .single();

  if (photoErr || !photoRow) {
    console.error("photos insert error", photoErr);
    return NextResponse.json({ error: "DB error saving photo" }, { status: 500 });
  }

  // Schedule analysis to run after response is flushed (non-blocking)
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  after(async () => {
    await analyzePhoto(photoRow.id, scanId, slot, base64);
  });

  return NextResponse.json({ photoId: photoRow.id }, { status: 201 });
}
