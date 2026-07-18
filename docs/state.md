# docs/state.md — UnderWrite

- **Branch**: `feat/t08-hardening`（push待ち）
- **Active Task**: T08 Hardening — 実装完了、verify実行中
- **Executor**: main agent (Sonnet 4.6)
- **Write Lock**: なし
- **Vercel**: project `under-write`（prj_pX2FfMIMvmxpN1NsjHVjNicMf3M0）、本番=main、env設定済
- **Supabase**: project `erpfxhrvrzmxawojziyc`（ap-northeast-1）、scans.user_id追加済み

## 完了済み（T08 このブランチ）

| # | 内容 | ファイル |
|---|------|---------|
| T08-1 | エンジン純粋化: currentYear/now 注入 | lib/underwriting/engine.ts, engine.test.ts |
| T08-2 | 実ファイルアップロード: property-photos Storage | app/api/scans/[scanId]/photos/route.ts |
| T08-3 | 非同期写真解析: lazy parallel (status route) | app/api/scans/[scanId]/status/route.ts |
| T08-4 | 認証ゲート: middleware + login page + logout | middleware.ts, app/login/page.tsx, app/api/auth/logout/route.ts |
| T08-5 | Supabase SSR client (browser + server) | lib/supabase/client.ts, lib/supabase/server.ts |
| T08-6 | scans.user_id: セッションユーザーをDBに保存 | app/api/scans/route.ts |
| T08-7 | NEXT_PUBLIC_SUPABASE_ANON_KEY 設定 | .env.local |

## 完了済み（main にマージ済み）

| # | 内容 |
|---|------|
| T02 | lib/domain Zod schemas |
| T03 | lib/underwriting deterministic engine |
| T04 | Gemini provider (2.5-flash) |
| T05 | reinfolib.ts 不動産情報ライブラリ client |
| T06 | POST /api/scans + scan-flow UI |
| T07 | GET /api/scans/[scanId]/status + /result/[scanId] |
| QA  | Opus 自己レビュー修正 4件 |

## 残課題（次セッション以降）

- **ジョブキュー化**: status route の lazy analysis は同期ブロッキング → Bull/Inngest などへ移行
- **テスト拡充**: middleware・login・photos route の integration tests
- **Vercel env**: NEXT_PUBLIC_SUPABASE_ANON_KEY を Vercel dashboard に追加

## Next Session Pickup

T08 verify グリーン → commit → push → PR to main → squash merge。
その後 Vercel env の NEXT_PUBLIC_SUPABASE_ANON_KEY 追加を確認。

> tasks.md と食い違う場合は tasks.md が正。
