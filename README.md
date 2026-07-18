# UnderWrite（アンダーライト）

**築古住宅アンダーライティングAI ―「開けなくても、わかる。」**

スマホで撮った写真と住所という最小入力から、築古住宅の
「買付上限価格・再生コストの確率分布（P10/P50/P90）・隠れ損傷リスク・再販価格・粗利」を
即日算出する B2B SaaS。計測アプリでも積算ソフトでもなく、"目利き（アンダーライティング）そのもの" を売る。

事業の全体像は [`企画書_UnderWrite_築古住宅アンダーライティングAI.md`](./企画書_UnderWrite_築古住宅アンダーライティングAI.md) を参照。

## Tech Stack
- **Frontend / API**: Next.js 15 (App Router) + TypeScript, Vercel（無料枠）
- **Data**: Supabase — Postgres / Storage（無料枠）
- **AI**: 差し替え可能なプロバイダ抽象（`lib/ai/`）。初期実装 = Google Gemini（無料枠）。
  `AI_PROVIDER` 環境変数で `gemini | claude | openai` を切替（コード変更不要）。

## Architecture Invariants
- 全モデル呼び出しは `lib/ai/`（`AIProvider` インターフェース）経由のみ。
- アンダーライティング数学は純・決定論的な `lib/underwriting/`（LLM に載せない。同一入力＝同一価格）。
- `lib/domain/` の versioned zod スキーマ `Finding` が AI と下流の硬い境界。

## Getting Started
```powershell
pnpm install
Copy-Item .env.example .env.local   # 値を設定（Gemini / Supabase / 不動産情報ライブラリ）
pnpm dev
```

## Scripts
| コマンド | 内容 |
|---|---|
| `pnpm dev` | 開発サーバ |
| `pnpm build` | 本番ビルド |
| `pnpm lint` | Lint |
| `pnpm typecheck` | 型チェック |
| `pnpm test` | テスト |
| `pnpm verify` | 一括検証（lint + typecheck + test + build） |
| `node scripts/setup.mjs` | 初期セットアップ確認 |

## Development Method
本リポジトリは **pm-zero v11**（Budget-Bound Autonomous Solo-Dev OS）で運用。
台帳は `tasks.md`（単一）、意図は `docs/vision.md`、現在地は `docs/state.md`、規約は `CLAUDE.md`。

## License
[LICENSE](./LICENSE) を参照。
