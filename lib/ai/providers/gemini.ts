import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { FindingV1, SCHEMA_VERSION } from "@/lib/domain";
import { requireEnv } from "@/lib/env";
import type { AIProvider } from "@/lib/ai";

const MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `あなたは築古住宅の目利き専門AIです。
提供された住宅写真を詳細に分析し、発見した損傷・劣化・問題点を JSON 配列として出力してください。

各要素の形式:
{
  "_v": 1,
  "id": "<UUID v4>",
  "surface": "発見箇所（例: 天井、外壁、基礎）",
  "category": 次のいずれか: "雨漏り"|"腐食・劣化"|"ひび割れ"|"シミ・汚損"|"傾き・不陸"|"白蟻"|"設備老朽"|"外壁損傷"|"その他",
  "severity": "critical"|"warning"|"info",
  "confidence": 0.0〜1.0 の数値,
  "evidenceText": "写真から確認できた具体的な証拠（最大200文字）",
  "imageRef": "写真の参照番号（例: image_1）",
  "costEstimateLowYen": 修繕費用の下限（円、省略可）,
  "costEstimateHighYen": 修繕費用の上限（円、省略可）
}

severity の基準:
- critical: 即時対応・大規模修繕が必要（基礎亀裂・雨漏り・構造損傷）
- warning: 注意が必要で放置すると悪化（外壁劣化・設備老朽）
- info: 軽微で通常リノベに織り込み済み

問題が見当たらない場合は空の配列 [] を返してください。
必ず有効な JSON のみを返し、説明文は不要です。`;

export class GeminiProvider implements AIProvider {
  readonly modelId = `gemini/${MODEL}`;
  private readonly client: GoogleGenAI;

  constructor() {
    const apiKey = requireEnv("GEMINI_API_KEY");
    this.client = new GoogleGenAI({ apiKey });
  }

  async analyzeImages(imageBase64List: string[], instructions: string): Promise<FindingV1[]> {
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: SYSTEM_PROMPT },
      { text: instructions || "上記の写真を分析してください。" },
      ...imageBase64List.map((b64) => ({
        inlineData: { mimeType: "image/jpeg", data: b64 },
      })),
    ];

    const response = await this.client.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: { responseMimeType: "application/json" },
    });

    const raw = response.text ?? "[]";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = [];
    }

    if (!Array.isArray(parsed)) return [];

    const findings: FindingV1[] = [];
    for (const item of parsed) {
      if (typeof item !== "object" || item === null) continue;
      const withVersion = { _v: SCHEMA_VERSION, id: crypto.randomUUID(), ...item };
      const result = FindingV1.safeParse(withVersion);
      if (result.success) {
        findings.push(result.data);
      }
    }
    return findings;
  }

  async generateText(prompt: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return response.text ?? "";
  }
}
