# UnderWrite（アンダーライト）

**築古住宅アンダーライティングAI ―「開けなくても、わかる。」**

スマホで撮った写真と住所という最小入力から、築古住宅の
「買付上限価格・再生コストの確率分布（P10/P50/P90）・隠れ損傷リスク・再販価格・粗利」を
即日算出する B2B SaaS。計測アプリでも積算ソフトでもなく、"目利き（アンダーライティング）そのもの" を売る。

Status: 設計検証のみ

事業計画は AI エージェントに立案させた実験的文書として
[`企画書_UnderWrite_築古住宅アンダーライティングAI.md`](./企画書_UnderWrite_築古住宅アンダーライティングAI.md)
にまとめています。市場規模・収益予測などの数値は検証済みの事業データではなく、参考程度に留めてください。

## 技術アーキテクチャ（設計上の意思決定）

このプロジェクトの主眼は、AIを実運用に組み込む際の境界設計にある。

- **価格計算はLLMに任せない**: 買付上限価格・再生コストP10/P50/P90・粗利の計算は
  [`lib/underwriting/engine.ts`](./lib/underwriting/engine.ts) の純粋な決定論的TypeScript関数として実装。
  同一入力は常に同一の価格を返す。プロンプトの中には価格ロジックを一切書かない。
- **AIプロバイダは差し替え可能**: すべてのモデル呼び出しは
  [`lib/ai/index.ts`](./lib/ai/index.ts) の `AIProvider` インターフェース（`analyzeImages` /
  `generateText` / `modelId`）経由に限定。`AI_PROVIDER` 環境変数で実装を切り替える設計で、
  現時点では Gemini 実装（[`lib/ai/providers/gemini.ts`](./lib/ai/providers/gemini.ts)）のみ
  実装済み。Claude / OpenAI への切り替えはこのインターフェースを実装するクラスを追加すれば良い。
- **AI出力はバージョン管理されたzodスキーマで境界検証**: AIが返すJSONは
  [`lib/domain/finding.ts`](./lib/domain/finding.ts) の `FindingV1`（`_v` フィールドで
  バージョン管理）に対して `safeParse` を通し、スキーマに合致しないデータは破棄してから
  下流（DB・価格エンジン）に渡す。

## Tech Stack
- **Frontend / API**: Next.js 15 (App Router) + TypeScript, Vercel（無料枠）
- **Data**: Supabase — Postgres / Storage（無料枠）
- **AI**: Google Gemini（無料枠）を `lib/ai/` のプロバイダ抽象経由で呼び出し

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
