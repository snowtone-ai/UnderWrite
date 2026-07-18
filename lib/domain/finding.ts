import { z } from "zod";

export const FindingV1 = z.object({
  _v: z.literal(1),
  id: z.string().uuid(),
  surface: z.string().min(1).max(50),
  category: z.enum([
    "雨漏り",
    "腐食・劣化",
    "ひび割れ",
    "シミ・汚損",
    "傾き・不陸",
    "白蟻",
    "設備老朽",
    "外壁損傷",
    "その他",
  ]),
  severity: z.enum(["critical", "warning", "info"]),
  confidence: z.number().min(0).max(1),
  evidenceText: z.string().max(500),
  imageRef: z.string().optional(),
  costEstimateLowYen: z.number().nonnegative().optional(),
  costEstimateHighYen: z.number().nonnegative().optional(),
});

export type FindingV1 = z.infer<typeof FindingV1>;

export const SCHEMA_VERSION = 1 as const;
