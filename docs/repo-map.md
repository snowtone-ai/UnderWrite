# docs/repo-map.md — UnderWrite

## Read Policy
セッション開始時は本 `## Summary` のみ読む。対象が不明なときだけ該当セクションを読む。
広範な読み込みは Explore サブエージェント（Haiku）に委譲し要約だけ受け取る。

## Summary
UnderWrite = 築古住宅アンダーライティングAI（B2B SaaS）。Next.js 15 App Router + TypeScript、
Vercel デプロイ、Supabase（Postgres/Storage）。核の3層:
- `lib/ai/` — AIProvider 抽象（差し替え可能。gemini 初期実装）。全モデル呼び出しはここ経由。
- `lib/underwriting/` — 純・決定論的アンダーライティング数学（コスト分布・買付上限・粗利）。lib/ai を import しない。
- `lib/domain/` — versioned zod スキーマ（Finding / ScanInput / Underwriting）= AI 境界の背骨。
`lib/data/` は公開データ（不動産情報ライブラリ 等）型付きクライアント。`app/` は UI＋API route。
台帳は tasks.md（単一）、意図は docs/vision.md、一次資料は 企画書_UnderWrite_*.md。

## Directory Map
- `app/` — Next.js App Router。scan 入力ページ / result ダッシュボード / api route。
- `lib/domain/` — zod スキーマと TS 型（AI 境界）。
- `lib/ai/` — AIProvider interface と各実装（gemini/claude/openai）。
- `lib/underwriting/` — 決定論エンジン（純関数、テスト厚め）。
- `lib/data/` — 公開データ API クライアント（型付き、DBキャッシュ）。
- `supabase/` — マイグレーション・スキーマ。
- `scripts/` — setup.mjs / verify.mjs。
- `docs/` — vision / state / decisions / issues / repo-map。

## Entry Points
- Web: `app/` のルートページ（scan 入力）。
- 検証: `scripts/verify.mjs`（pnpm verify）。

## Common Workflows
- 新機能: tasks.md にタスク → 実装 → pnpm verify → Tier1 セルフレビュー → commit/push/PR。
- AIモデル差し替え: `.env` の `AI_PROVIDER` を変更（コード変更不要）。

## Generated / Ignored
- `node_modules/`, `.next/`, `dist/`, `.vercel`, `.env*`（.env.example 以外）は git 管理外。

## Update Rules
- 構造変更時のみ該当セクションを更新。Summary は20行以内を維持。
