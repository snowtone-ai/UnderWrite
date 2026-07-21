import type { ResaleBaseline } from "@/lib/underwriting";

const REINFOLIB_BASE = "https://www.reinfolib.mlit.go.jp/ex-api/external";

// Prefecture code lookup for major areas
const PREF_CODE: Record<string, string> = {
  北海道: "01", 青森: "02", 岩手: "03", 宮城: "04", 秋田: "05",
  山形: "06", 福島: "07", 茨城: "08", 栃木: "09", 群馬: "10",
  埼玉: "11", 千葉: "12", 東京: "13", 神奈川: "14", 新潟: "15",
  富山: "16", 石川: "17", 福井: "18", 山梨: "19", 長野: "20",
  岐阜: "21", 静岡: "22", 愛知: "23", 三重: "24", 滋賀: "25",
  京都: "26", 大阪: "27", 兵庫: "28", 奈良: "29", 和歌山: "30",
  鳥取: "31", 島根: "32", 岡山: "33", 広島: "34", 山口: "35",
  徳島: "36", 香川: "37", 愛媛: "38", 高知: "39", 福岡: "40",
  佐賀: "41", 長崎: "42", 熊本: "43", 大分: "44", 宮崎: "45",
  鹿児島: "46", 沖縄: "47",
};

interface TransactionRecord {
  TradePrice: string;
  Area: string;
  BuildingYear: string;
  Structure: string;
  Type: string;
}

function prefectureCodeFromAddress(address: string): string | null {
  for (const [pref, code] of Object.entries(PREF_CODE)) {
    if (address.startsWith(pref)) return code;
  }
  return null;
}

function fallbackBaseline(address: string, floorAreaSqm: number): ResaleBaseline {
  // Regional price fallback when API unavailable (万円/sqm rough estimates)
  const isMetro = ["東京", "神奈川", "大阪", "愛知"].some((p) => address.startsWith(p));
  const isMajor = ["埼玉", "千葉", "兵庫", "福岡", "京都"].some((p) => address.startsWith(p));
  const pricePerSqm = isMetro ? 400_000 : isMajor ? 200_000 : 120_000;
  return {
    medianYen: Math.round(pricePerSqm * floorAreaSqm),
    comps: 0,
    confidence: 0.2,
  };
}

export async function fetchResaleBaseline(
  address: string,
  floorAreaSqm: number,
  apiKey: string | undefined,
): Promise<ResaleBaseline> {
  if (!apiKey) {
    return fallbackBaseline(address, floorAreaSqm);
  }

  const prefCode = prefectureCodeFromAddress(address);
  if (!prefCode) {
    return fallbackBaseline(address, floorAreaSqm);
  }

  const now = new Date();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  const prevQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
  const prevYear = currentQuarter === 1 ? now.getFullYear() - 1 : now.getFullYear();
  const params = new URLSearchParams({
    year: String(prevYear),
    quarter: String(prevQuarter),
    area: prefCode,
    priceClassification: "01",
  });

  let data: TransactionRecord[];
  try {
    const res = await fetch(`${REINFOLIB_BASE}/XIT001?${params}`, {
      headers: { "Ocp-Apim-Subscription-Key": apiKey },
      next: { revalidate: 86_400 }, // cache 24h in Next.js
    });
    if (!res.ok) return fallbackBaseline(address, floorAreaSqm);
    const json = await res.json();
    data = (json.data ?? []) as TransactionRecord[];
  } catch {
    return fallbackBaseline(address, floorAreaSqm);
  }

  // Filter to similar-sized residential transactions
  const comps = data.filter((r) => {
    const area = parseFloat(r.Area);
    return (
      r.Type === "中古マンション等" ||
      (r.Type === "宅地(土地と建物)" &&
        area >= floorAreaSqm * 0.5 &&
        area <= floorAreaSqm * 2)
    );
  });

  if (comps.length < 3) return fallbackBaseline(address, floorAreaSqm);

  const prices = comps
    .map((r) => parseFloat(r.TradePrice))
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  const medianIdx = Math.floor(prices.length / 2);
  const medianYen = prices[medianIdx];
  const confidence = Math.min(prices.length / 50, 1);

  return { medianYen, comps: prices.length, confidence };
}
