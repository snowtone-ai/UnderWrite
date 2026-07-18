import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { SCHEMA_VERSION } from "@/lib/domain";

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

  // Insert photo row as "analyzing"
  const { data: photoRow, error: photoErr } = await db
    .from("photos")
    .insert({ scan_id: scanId, storage_path: storagePath, slot, status: "analyzing" })
    .select("id")
    .single();

  if (photoErr || !photoRow) {
    console.error("photos insert error", photoErr);
    return NextResponse.json({ error: "DB error saving photo" }, { status: 500 });
  }

  // Run Gemini analysis synchronously (one photo per request stays within Vercel timeout)
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const aiProvider = await getAIProvider();
  const [providerName, modelId] = aiProvider.modelId.split("/");

  try {
    const findings = await aiProvider.analyzeImages([base64], `スロット: ${slot}`);

    if (findings.length > 0) {
      const rows = findings.map((f) => ({
        scan_id: scanId,
        photo_id: photoRow.id,
        schema_version: SCHEMA_VERSION,
        provider: providerName,
        model_id: modelId,
        raw_output: f,
        parsed: f,
      }));
      const { error: findingErr } = await db.from("findings").insert(rows);
      if (findingErr) console.error("findings insert error", findingErr);
    }

    await db.from("photos").update({ status: "done" }).eq("id", photoRow.id);
    return NextResponse.json({ photoId: photoRow.id, findingCount: findings.length }, { status: 201 });
  } catch (err) {
    console.error("analyzeImages error", err);
    await db.from("photos").update({ status: "failed" }).eq("id", photoRow.id);
    // Return success for upload; analysis failure is non-fatal
    return NextResponse.json({ photoId: photoRow.id, findingCount: 0 }, { status: 201 });
  }
}
