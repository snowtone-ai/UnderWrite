import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient, getSessionUser } from "@/lib/supabase/server";
import { STRUCTURES } from "@/lib/domain";

const CreateScanBody = z.object({
  address: z.string().min(1).max(200),
  buildYear: z.number().int().min(1900).max(new Date().getFullYear()),
  structure: z.enum(STRUCTURES),
  floorAreaSqm: z.number().positive().max(10_000),
  landAreaSqm: z.number().positive().max(100_000).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateScanBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { address, buildYear, structure, floorAreaSqm, landAreaSqm } = parsed.data;

  const user = await getSessionUser();
  const db = getServiceClient();
  const { data, error } = await db
    .from("scans")
    .insert({
      address,
      build_year: buildYear,
      structure,
      floor_area_sqm: floorAreaSqm,
      land_area_sqm: landAreaSqm ?? null,
      status: "pending",
      user_id: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("scans insert error", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ scanId: data.id }, { status: 201 });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from("scans")
    .select("id, address, build_year, structure, floor_area_sqm, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("scans fetch error", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ scans: data ?? [] });
}
