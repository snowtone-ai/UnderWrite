// Money formatting. Per the design system, all figures are rounded to 万円 (10k yen)
// — never false-precise to the yen. The unit "万円" is rendered separately by the UI.

/** Yen → integer 万 (万円), rounded. e.g. 8_200_000 → 820 */
export function toMan(yen: number): number {
  return Math.round(yen / 10_000);
}

/** Yen → grouped 万 string without unit. e.g. 18_800_000 → "1,880" */
export function formatMan(yen: number): string {
  return toMan(yen).toLocaleString("ja-JP");
}

/** Signed 万 string for ledgers. e.g. -6_200_000 → "−620" (true minus sign) */
export function formatManSigned(yen: number): string {
  const man = toMan(yen);
  const sign = man < 0 ? "−" : man > 0 ? "+" : "";
  return `${sign}${Math.abs(man).toLocaleString("ja-JP")}`;
}
