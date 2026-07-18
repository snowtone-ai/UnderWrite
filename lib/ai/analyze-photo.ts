import { getServiceClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { SCHEMA_VERSION } from "@/lib/domain";

export async function analyzePhoto(photoId: string, scanId: string, slot: string, base64: string) {
  const db = getServiceClient();
  const aiProvider = await getAIProvider();
  const [providerName, modelId] = aiProvider.modelId.split("/");

  try {
    await db.from("photos").update({ status: "analyzing" }).eq("id", photoId);

    const findings = await aiProvider.analyzeImages([base64], `スロット: ${slot}`);

    if (findings.length > 0) {
      const rows = findings.map((f) => ({
        scan_id: scanId,
        photo_id: photoId,
        schema_version: SCHEMA_VERSION,
        provider: providerName,
        model_id: modelId,
        raw_output: f,
        parsed: f,
      }));
      const { error: findingErr } = await db.from("findings").insert(rows);
      if (findingErr) console.error("findings insert error", findingErr);
    }

    await db.from("photos").update({ status: "done" }).eq("id", photoId);
  } catch (err) {
    console.error("analyzeImages error", err);
    await db.from("photos").update({ status: "failed" }).eq("id", photoId);
  }
}
