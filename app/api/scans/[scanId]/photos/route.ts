import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";

export async function POST(req: NextRequest, { params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;

  const formData = await req.formData();
  const slot = (formData.get("slot") as string | null) ?? "unknown";
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Missing image field" }, { status: 400 });
  }

  // Convert to base64 for AI analysis
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  // Run AI analysis on this single photo
  const aiProvider = await getAIProvider();
  const findings = await aiProvider.analyzeImages([base64], `スロット: ${slot}`);

  const db = getServiceClient();

  // Save photo record
  const photoFilename = `${scanId}/${slot}-${Date.now()}.jpg`;
  const { data: photoRow, error: photoErr } = await db
    .from("photos")
    .insert({ scan_id: scanId, storage_path: photoFilename, slot })
    .select("id")
    .single();

  if (photoErr || !photoRow) {
    console.error("photos insert error", photoErr);
    return NextResponse.json({ error: "DB error saving photo" }, { status: 500 });
  }

  // Save findings
  if (findings.length > 0) {
    const rows = findings.map((f) => ({
      scan_id: scanId,
      photo_id: photoRow.id,
      surface: f.surface,
      category: f.category,
      severity: f.severity,
      confidence: f.confidence,
      evidence_text: f.evidenceText,
      cost_estimate_low_yen: f.costEstimateLowYen ?? null,
      cost_estimate_high_yen: f.costEstimateHighYen ?? null,
      raw_json: f,
    }));

    const { error: findingErr } = await db.from("findings").insert(rows);
    if (findingErr) {
      console.error("findings insert error", findingErr);
    }
  }

  return NextResponse.json({ photoId: photoRow.id, findingCount: findings.length }, { status: 201 });
}
