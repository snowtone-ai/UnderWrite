import { NextRequest, NextResponse, after } from "next/server";
import { getServiceClient, getSessionUser } from "@/lib/supabase/server";
import { analyzePhoto } from "@/lib/ai/analyze-photo";

export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLOT_RE = /^[a-z0-9_-]{1,32}$/;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // must match client-side guard in scan-flow
const MAX_PHOTOS_PER_SCAN = 20;

// MIME types Gemini accepts for inline image data
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;

  if (!UUID_RE.test(scanId)) {
    return NextResponse.json({ error: "Invalid scanId" }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const slotRaw = formData.get("slot");
  const slot = typeof slotRaw === "string" ? slotRaw : "";
  if (!SLOT_RE.test(slot)) {
    return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image field" }, { status: 400 });
  }

  const contentType = file.type || "image/jpeg";
  const ext = MIME_EXT[contentType];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 415 });
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Image too large (max 10MB)" }, { status: 413 });
  }

  const db = getServiceClient();

  // Ownership: the scan must exist and belong to the caller
  const { data: scan } = await db
    .from("scans")
    .select("id, user_id")
    .eq("id", scanId)
    .maybeSingle();

  if (!scan || scan.user_id !== user.id) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const { count: photoCount } = await db
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("scan_id", scanId);

  if ((photoCount ?? 0) >= MAX_PHOTOS_PER_SCAN) {
    return NextResponse.json({ error: "Photo limit reached for this scan" }, { status: 409 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const storagePath = `${scanId}/${slot}-${Date.now()}.${ext}`;

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
    // Remove the just-uploaded blob so a failed insert does not orphan storage.
    await db.storage.from("property-photos").remove([storagePath]);
    return NextResponse.json({ error: "DB error saving photo" }, { status: 500 });
  }

  // Schedule analysis to run after response is flushed (non-blocking)
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  after(async () => {
    await analyzePhoto(photoRow.id, scanId, slot, base64, contentType);
  });

  return NextResponse.json({ photoId: photoRow.id }, { status: 201 });
}
