import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { runEngine } from "@/lib/underwriting";
import { fetchResaleBaseline } from "@/lib/data";
import { getAIProvider } from "@/lib/ai";
import { FindingV1, ScanInputV1, SCHEMA_VERSION } from "@/lib/domain";
import type { FindingV1 as FindingV1Type } from "@/lib/domain";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;

  if (!UUID_RE.test(scanId)) {
    return NextResponse.json({ error: "Invalid scanId" }, { status: 400 });
  }

  const db = getServiceClient();

  // Return cached underwriting if already computed
  const { data: existing } = await db
    .from("underwritings")
    .select("result")
    .eq("scan_id", scanId)
    .maybeSingle();

  if (existing?.result) {
    return NextResponse.json({ status: "done", result: existing.result });
  }

  // Load scan metadata
  const { data: scan, error: scanErr } = await db
    .from("scans")
    .select("id, address, build_year, structure, floor_area_sqm, land_area_sqm")
    .eq("id", scanId)
    .single();

  if (scanErr || !scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  // Load all photos for this scan
  const { data: photos } = await db
    .from("photos")
    .select("id, storage_path, slot, status")
    .eq("scan_id", scanId);

  const photoList = photos ?? [];

  // If any photos are currently being analyzed, report pending to avoid duplicate work
  const analyzing = photoList.some((p) => p.status === "analyzing");
  if (analyzing) {
    return NextResponse.json({ status: "pending" });
  }

  // Trigger lazy analysis for all pending photos
  const pendingPhotos = photoList.filter((p) => p.status === "pending");

  const aiProvider = await getAIProvider();

  if (pendingPhotos.length > 0) {
    // Mark all pending photos as "analyzing" to act as a soft lock
    const pendingIds = pendingPhotos.map((p) => p.id);
    await db.from("photos").update({ status: "analyzing" }).in("id", pendingIds);

    const [providerName, modelId] = aiProvider.modelId.split("/");

    // Download and analyze all photos in parallel
    await Promise.all(
      pendingPhotos.map(async (photo) => {
        try {
          const { data: blob, error: downloadErr } = await db.storage
            .from("property-photos")
            .download(photo.storage_path);

          if (downloadErr || !blob) {
            console.error(`storage download error for ${photo.storage_path}`, downloadErr);
            await db.from("photos").update({ status: "failed" }).eq("id", photo.id);
            return;
          }

          const arrayBuffer = await blob.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");

          const findings = await aiProvider.analyzeImages([base64], `スロット: ${photo.slot}`);

          if (findings.length > 0) {
            const rows = findings.map((f) => ({
              scan_id: scanId,
              photo_id: photo.id,
              schema_version: SCHEMA_VERSION,
              provider: providerName,
              model_id: modelId,
              raw_output: f,
              parsed: f,
            }));
            const { error: findingErr } = await db.from("findings").insert(rows);
            if (findingErr) console.error("findings insert error", findingErr);
          }

          await db.from("photos").update({ status: "done" }).eq("id", photo.id);
        } catch (err) {
          console.error(`analysis failed for photo ${photo.id}`, err);
          await db.from("photos").update({ status: "failed" }).eq("id", photo.id);
        }
      }),
    );
  }

  // Load all findings (from previously done + just-analyzed photos)
  const { data: findingRows } = await db
    .from("findings")
    .select("parsed")
    .eq("scan_id", scanId);

  const findings: FindingV1Type[] = [];
  for (const row of findingRows ?? []) {
    const r = FindingV1.safeParse({ _v: SCHEMA_VERSION, ...row.parsed });
    if (r.success) findings.push(r.data);
  }

  const scanInputResult = ScanInputV1.safeParse({
    _v: 1,
    scanId: scan.id,
    address: scan.address,
    buildYear: scan.build_year,
    structure: scan.structure,
    floorAreaSqm: Number(scan.floor_area_sqm),
    landAreaSqm: scan.land_area_sqm ? Number(scan.land_area_sqm) : undefined,
  });

  if (!scanInputResult.success) {
    return NextResponse.json({ error: "Scan data invalid" }, { status: 422 });
  }

  const reinfolibKey = process.env.REINFOLIB_API_KEY ?? "";
  const resaleBaseline = await fetchResaleBaseline(scan.address, Number(scan.floor_area_sqm), reinfolibKey);

  const result = runEngine({
    input: scanInputResult.data,
    findings,
    resaleBaseline,
    providerModelId: aiProvider.modelId,
  });

  // Persist underwriting result
  const { error: upsertErr } = await db.from("underwritings").upsert(
    {
      scan_id: scanId,
      engine_version: result.engineVersion,
      input_snapshot: scanInputResult.data,
      result,
    },
    { onConflict: "scan_id" },
  );

  if (upsertErr) {
    console.error("underwritings upsert error", upsertErr);
  }

  await db.from("scans").update({ status: "done" }).eq("id", scanId);

  return NextResponse.json({ status: "done", result });
}
