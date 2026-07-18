# docs/decisions.md — UnderWrite

Permanent rationale. Newest first.

## D-001 — pm-zero v11 採用と本番プロダクト方針
- **決定**: pm-zero-knowledge-v11.md に完全準拠して開発環境を構築。13ファイル既定構成、tasks.md 単一台帳、
  bypassPermissions＋guard hook、Sonnet-first ルーティング、Fable 5 はアドバイザー専用。
- **理由**: 非エンジニアが Claude Pro（$20/月・上限固定）で1体の自律エージェントを運用する前提に最適化されているため。

## D-008 — フロントエンド・デザインシステム（世界水準UI/UX）
- **決定**: Tailwind CSS v4（`@theme inline`＋OKLCH自動light/dark）＋ shadcn/ui 準拠のコンポーネント層
  ＋ Radix（unified `radix-ui`）＋ motion（Framer後継）＋ lucide。フォントは Inter＋Noto Sans JP（next/font）。
- **デザイン言語**: 「紙の稟議書の誠実さ」— 数字が主役、色は"判定"のみ（藍 #1E56B0 ＋ go/cond/nogo 信号色）。
  影でなく境界線＋背景段差でエレベーション。金額は常に万円丸め（偽の精密さ禁止）。赤は画面に1箇所まで。
- **判定ダッシュボード**: 買付上限価格を唯一のヒーロー数字に、P10/P50/P90 は1本のレンジバー、収支は帳票テーブル、
  リスクは影響額順、根拠は初期折りたたみ。全て Server Component（scan入力のみ client）。
- **理由**: ユーザー要件「世界で最もUI/UXが評価されるプロダクトをモデルに」「最新スタックで最高水準」。
  Stripe（金額作法）/Linear（抑制）/Ramp（判定ファースト）/SmartHR（中高年向け日本語UI）を統合。
- **出典**: Fable 5 デザインアドバイザー評（2026-07-18）。WebSearch で Tailwind v4×shadcn×Next16 互換確認。
- **不変則**: AI/underwriting 呼び出しはコンポーネントに置かない。現状は `lib/sample/` の型付きmockで
  ユースケース（佐藤社長）を再現。T02 で `lib/domain` の zod に置換し実データ結線。

## D-002 — 技術スタック: Next.js 16 (App Router) + TypeScript / Vercel / Supabase
- **決定**: フロント＋APIを Next.js 16 App Router + TS、Vercel 無料枠にデプロイ。DB/Storage は Supabase 無料枠。
  （当初 Next.js 15 想定だったが pnpm 解決の最新メジャーが 16。App Router 前提は不変のため 16 を採用）
- **依存ピン**: TypeScript は 5.x、ESLint は 9.x に固定（最新の TS7 / ESLint10 は lint ツール未対応。docs/issues.md R-001/R-002）。
- **updated_at 契約**: `scans.updated_at` は DB トリガ `set_updated_at()` で自動更新（アプリ側でセット不要）。
- **理由**: $0 制約（Claude Pro 以外は 0）。両者とも寛大な無料枠と MCP 連携があり、solo 自律開発の摩擦が最小。
- **代替案**: 独自バックエンド＋自前ホスティング → 運用コスト・複雑性が増し simplicity 原則に反するため却下。

## D-003 — AIプロバイダ抽象化（差し替え可能性）
- **決定**: 全モデル呼び出しを `lib/ai/` の `AIProvider` インターフェース経由に限定。メソッドは2つのみ:
  `analyzeImages(images, instructions): Promise<Finding[]>` と `generateText(prompt): Promise<string>`。
  `AI_PROVIDER` 環境変数で実装を選択（初期 gemini / 将来 claude, openai）。
- **理由**: ユーザー要件「後で最適なAIモデルに簡単に入れ替えられるように」。初期は Gemini 無料枠で代用。
  `generateReport` を独立メソッドにしない — レポートはエンジン出力から組んだプロンプトの `generateText`。
- **出典**: Fable 5 アドバイザー評（2026-07-18）。

## D-004 — アンダーライティング数学を LLM から隔離
- **決定**: コスト分布 P10/P50/P90・買付上限価格・粗利は純・決定論的な `lib/underwriting/` に実装。
  `lib/ai` からの import を持たない（型で強制: engine は `Finding` を import し `Underwriting` を export）。
- **理由**: (a) 決定論 — 同一入力＝同一価格でなければ顧客が信頼できず回帰テストも不能。
  (b) 差し替え安全 — Gemini→Claude で価格が変わってはならない。(c) LLM は算術・分布で未校正。製品の核は校正済み分布。

## D-005 — `Finding` バージョン付き zod スキーマを AI 境界にする
- **決定**: VLM 出力は自前所有の versioned `Finding` zod スキーマ（surface, severity, confidence, evidence 等）で境界固定。
  毎スキャンで「生モデル出力＋解析済み findings＋engine version＋provider/model id」を DB 永続し replay/diff 可能にする。
- **理由**: 3ヶ月内最大の罠 = プロンプト結合によるスキーマドリフト（差し替え不能・非再現・監査不能化）を構造的に防ぐ。
  この規律だけで swappability・再現性・評価データセット・宅建業者向け監査性を同時に獲得。
- **出典**: Fable 5 アドバイザー評（2026-07-18）。

## D-006 — MVP スコープ削減（simplicity 最優先）
- **決定**: MVP から (1) PWA/オフライン, (2) 認証, (3) ネイティブ RoomPlan, (4) PDF帳票・ハザード・路線価 を除外。
  写真入力は素の `<input type=file accept=image/* capture=environment multiple>`。
  写真解析は最初から「1枚ずつ DB 永続＋クライアントポーリング」の非同期構造（Vercel 無料枠の関数実行時間制約のため）。
- **理由**: refined simplicity 最優先。核となる価値（住所＋写真→判断ダッシュボード）に一点集中。非同期は最適化でなく構造的必須。
- **出典**: Fable 5 アドバイザー評（2026-07-18）。

## D-007 — Supabase / Vercel MCP の利用
- **決定**: プロジェクト作成・マイグレーション・デプロイに Supabase MCP / Vercel MCP を活用。
- **理由**: ユーザー要件「MCPやプラグインを積極的に活用し最大限自律的に」。無料枠内・非破壊操作は即実行。
  破壊的/課金操作（有料化・本番デプロイ）は §15 リスクゲートで人間確認。
