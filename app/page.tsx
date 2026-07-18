const STEPS = [
  { n: "01", label: "スキャン", body: "スマホで住所を入力し、気になる箇所を数枚撮影する（15分）。" },
  { n: "02", label: "照会", body: "公開データ（不動産情報ライブラリ 等）を自動照会する。" },
  { n: "03", label: "解析", body: "劣化診断と隠れ損傷の確率分布を推定する。" },
  { n: "04", label: "判断", body: "買付上限価格・粗利 P10/P50/P90・リスク警告を即日出力する。" },
];

export default function Home() {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "80px 24px",
      }}
    >
      <p style={{ color: "var(--accent)", letterSpacing: "0.08em", fontSize: 13 }}>
        UnderWrite（アンダーライト）
      </p>
      <h1 style={{ fontSize: 40, lineHeight: 1.25, margin: "12px 0 20px" }}>
        開けなくても、わかる。
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 17, maxWidth: 620 }}>
        スマホスキャン15分と公開データだけで、築古住宅の「再生コスト・隠れ損傷リスク・再販価格・粗利」を
        即日算出する、買取再販・リフォーム業者向けアンダーライティングAI。
      </p>

      <ol
        style={{
          listStyle: "none",
          display: "grid",
          gap: 12,
          margin: "48px 0",
        }}
      >
        {STEPS.map((s) => (
          <li
            key={s.n}
            style={{
              display: "flex",
              gap: 16,
              padding: "16px 18px",
              border: "1px solid var(--line)",
              borderRadius: 10,
            }}
          >
            <span style={{ color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
              {s.n}
            </span>
            <span>
              <strong>{s.label}</strong>
              <span style={{ display: "block", color: "var(--muted)", fontSize: 15 }}>
                {s.body}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <p style={{ color: "var(--muted)", fontSize: 13, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
        MVP 構築中。査定結果は確率分布として提示し、最終判断は事業者に委ねます。
      </p>
    </main>
  );
}
