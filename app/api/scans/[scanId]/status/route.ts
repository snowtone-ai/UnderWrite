import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, getSessionUser } from "@/lib/supabase/server";
import { runEngine } from "@/lib/underwriting";
import { fetchResaleBaseline } from "@/lib/data";
import { getAIProvider } from "@/lib/ai";
import { FindingV1, ScanInputV1, SCHEMA_VERSION } from "@/lib/domain";
import type { FindingV1 as FindingV1Type } from "@/lib/domain";

export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;

  if (!UUID_RE.test(scanId)) {
    return NextResponse.json({ error: "Invalid scanId" }, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServiceClient();

  // Ownership: the scan must exist and belong to the caller
  const { data: scan, error: scanErr } = await db
    .from("scans")
    .select("id, user_id, address, build_year, structure, floor_area_sqm, land_area_sqm")
    .eq("id", scanId)
    .single();

  if (scanErr || !scan || scan.user_id !== user.id) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  // Photo progress (also reported alongside the final result)
  const { data: photos } = await db
    .from("photos")
    .select("status")
    .eq("scan_id", scanId);

  const photoList = photos ?? [];
  const photoStats = {
    total: photoList.length,
    failed: photoList.filter((p) => p.status === "failed").length,
  };

  // Return cached underwriting if already computed
  const { data: existing } = await db
    .from("underwritings")
    .select("result")
    .eq("scan_id", scanId)
    .maybeSingle();

  if (existing?.result) {
    return NextResponse.json({ status: "done", result: existing.result, photos: photoStats });
  }

  const stillProcessing = photoList.some((p) => p.status === "pending" || p.status === "analyzing");
  if (stillProcessing) {
    const processed = photoList.filter(
      (p) => p.status === "done" || p.status === "failed",
    ).length;
    return NextResponse.json({
      status: "pending",
      photos: { total: photoList.length, processed },
    });
  }

  // All photos done/failed — run engine
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

  const aiProvider = await getAIProvider();
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

  return NextResponse.json({ status: "done", result, photos: photoStats });
}
