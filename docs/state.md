# docs/state.md — UnderWrite

- **Branch**: `feat/t02-t07-mvp-pipeline`（push済み）
- **Active Task**: T02–T07 MVP pipeline — Opus レビュー修正完了
- **Executor**: main agent (Sonnet 4.6)
- **Write Lock**: なし
- **Latest Verification**: pnpm verify ALL PASSED（lint/typecheck/28 tests/build 5 routes）
- **Vercel**: project `under-write`（prj_pX2FfMIMvmxpN1NsjHVjNicMf3M0）、本番=main、env設定済
- **Supabase**: project `erpfxhrvrzmxawojziyc`（ap-northeast-1）、underwritings_scan_id_key UNIQUE追加済み

## 完了済み（このブランチ）

| # | 内容 | コミット |
|---|------|---------|
| T02 | lib/domain Zod schemas (FindingV1, ScanInputV1, UnderwritingV1) | 済 |
| T03 | lib/underwriting deterministic engine (P10/P50/P90, purchase cap) | 済 |
| T04 | Gemini provider (2.5-flash, JSON mode) | 済 |
| T05 | reinfolib.ts 不動産情報ライブラリ client | 済 |
| T06 | POST /api/scans + scan-flow UI (form + photo upload) | 済 |
| T07 | GET /api/scans/[scanId]/status + /result/[scanId] result page | 済 |
| QA  | Opus 自己レビュー → 修正 4 件（gemini/reinfolib/photos/status） | 済 |

## 残課題（別タスクで対応）

- **非同期写真解析**: 現在は /photos POST でブロッキング Gemini 呼び出し → ジョブキュー化
- **認証ゲート**: 全 API に session/API-key ミドルウェア
- **実ファイルアップロード**: property-photos バケットへの実際のストレージ保存（現在 DB 行のみ）
- **エンジン純粋化**: currentYear/now を runEngine() に注入してリプレイ可能に

## Next Session Pickup

PR を main にマージして Vercel 本番デプロイ確認。
その後、非同期写真解析 or 認証ゲートのどちらを優先するかユーザーと確認。

> tasks.md と食い違う場合は tasks.md が正。
