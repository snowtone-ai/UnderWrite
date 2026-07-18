import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { SCHEMA_VERSION } from "@/lib/domain";

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
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const aiProvider = await getAIProvider();
  const [providerName, modelId] = aiProvider.modelId.split("/");

  let findings;
  try {
    findings = await aiProvider.analyzeImages([base64], `スロット: ${slot}`);
  } catch (err) {
    console.error("analyzeImages error", err);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 502 });
  }

  const db = getServiceClient();

  const photoFilename = `${scanId}/${slot}-${Date.now()}.jpg`;
  const { data: photoRow, error: photoErr } = await db
    .from("photos")
    .insert({ scan_id: scanId, storage_path: photoFilename, slot, status: "done" })
    .select("id")
    .single();

  if (photoErr || !photoRow) {
    console.error("photos insert error", photoErr);
    return NextResponse.json({ error: "DB error saving photo" }, { status: 500 });
  }

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
    if (findingErr) {
      console.error("findings insert error", findingErr);
    }
  }

  return NextResponse.json({ photoId: photoRow.id, findingCount: findings.length }, { status: 201 });
}
