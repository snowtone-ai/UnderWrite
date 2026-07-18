import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { runEngine } from "@/lib/underwriting";
import { fetchResaleBaseline } from "@/lib/data";
import { getAIProvider } from "@/lib/ai";
import { FindingV1, ScanInputV1, SCHEMA_VERSION } from "@/lib/domain";
import type { FindingV1 as FindingV1Type } from "@/lib/domain";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;
  const db = getServiceClient();

  // Return cached underwriting if already computed
  const { data: existing } = await db
    .from("underwritings")
    .select("result_json")
    .eq("scan_id", scanId)
    .maybeSingle();

  if (existing?.result_json) {
    return NextResponse.json({ status: "done", result: existing.result_json });
  }

  // Load scan metadata
  const { data: scan, error: scanErr } = await db
    .from("scans")
    .select("id, address, build_year, structure, floor_area_sqm, land_area_sqm, status")
    .eq("id", scanId)
    .single();

  if (scanErr || !scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  // Load findings
  const { data: findingRows } = await db
    .from("findings")
    .select("raw_json")
    .eq("scan_id", scanId);

  const findings: FindingV1Type[] = [];
  for (const row of findingRows ?? []) {
    const r = FindingV1.safeParse({ _v: SCHEMA_VERSION, ...row.raw_json });
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
  await db.from("underwritings").upsert({
    scan_id: scanId,
    engine_version: result.engineVersion,
    verdict: result.verdict,
    purchase_cap_yen: result.purchaseCapYen,
    result_json: result,
  });

  // Update scan status
  await db.from("scans").update({ status: "done" }).eq("id", scanId);

  return NextResponse.json({ status: "done", result });
}
