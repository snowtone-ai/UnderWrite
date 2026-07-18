import { z } from "zod";

export const STRUCTURES = ["木造", "軽量鉄骨", "重量鉄骨", "鉄筋コンクリート", "その他"] as const;
export type Structure = (typeof STRUCTURES)[number];

export const ScanInputV1 = z.object({
  _v: z.literal(1),
  scanId: z.string().uuid(),
  address: z.string().min(1).max(200),
  buildYear: z.number().int().min(1900).max(new Date().getFullYear()),
  structure: z.enum(STRUCTURES),
  floorAreaSqm: z.number().positive().max(10_000),
  landAreaSqm: z.number().positive().max(100_000).optional(),
});

export type ScanInputV1 = z.infer<typeof ScanInputV1>;
