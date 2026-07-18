# tasks.md — UnderWrite

**Goal Binding**: 本番プロダクト「UnderWrite」の完成。現フェーズ = MVP基盤（住所＋写真 → 判断ダッシュボード）を
本番URLで通す（Milestone 1）。詳細意図は docs/vision.md、一次資料は 企画書_UnderWrite_*.md。

**Status Vocabulary**: proposed / ready / doing / blocked / review / done / verified

**Main agent is the only writer of this file.**

## Tasks

| ID | Status | Owner | Depends On | Write Scope | Acceptance | Verification | Evidence |
|----|--------|-------|-----------|-------------|------------|--------------|----------|
| T00 | done | main | — | 全ルート台帳/設定 | pm-zero v11 の13ファイル構成・git・remote・guard 整備 | Phase 0.5 self-audit | このコミット |
| T01 | done | main | T00 | app scaffold, package.json, next.config, lib/, supabase schema | Next.js16/TS/pnpm 雛形＋landing。Supabase project(erpfxhrvrzmxawojziyc)＋tables＋RLS＋updated_atトリガ＋private bucket。Vercel import 済（本番URL稼働） | pnpm verify ALL PASSED／本番デプロイ済 | verify緑, Vercel稼働(ユーザー確認), Tier1レビュー対応済 |
| T-UI | done | main | T01 | app/, components/, lib/(format,utils,sample), globals.css | 世界水準デザインシステム実装（Fable指針: 藍/帳票言語/Inter+NotoJP/Tailwind v4+shadcn）。画面: landing / scan入力フロー / 判定ダッシュボード。ユースケース(佐藤社長)をmockで再現 | pnpm verify ALL PASSED／build 4 routes | verify緑, lint0, test4, Tier1レビュー指摘(B/M/m)全対応 |
| T02 | verified | main | T01 | lib/domain/ | zod スキーマ＋TS型: `Finding`,`ScanInput`,`Underwriting`（versioned）。AI境界の背骨 | pnpm typecheck／schema unit test | PR#4 merged main |
| T03 | verified | main | T02 | lib/underwriting/ | 純TS決定論エンジン: 築年×工法×findings→対数正規で隠れ損傷分布, P10/P50/P90, 買付上限価格式, 粗利。lib/ai を import しない | fixture findings で unit test（決定論・境界値・負パス） | PR#4 merged main |
| T04 | verified | main | T02 | lib/data/ | 不動産情報ライブラリ 型付きクライアント→comps＋再販ベースライン。応答をDBキャッシュ。欠損時 graceful degrade | モックfetch でクライアント test | PR#4 merged main |
| T05 | verified | main | T02 | lib/ai/ | `AIProvider` interface＋Gemini実装（structured output→`Finding[]`）。AI_PROVIDER 選択。境界で zod 検証＋生出力永続 | provider契約 test（スキーマ非適合で reject/retry） | PR#4 merged main |
| T06 | verified | main | T01,T05 | app/(scan)/, app/api/ | 住所＋写真アップロードpage→Storage→写真1枚ずつ処理route（DB status追跡＋ポーリング） | ローカルで1件アップ→findings生成をE2E確認 | PR#4 merged main |
| T07 | verified | main | T03,T04,T05,T06 | app/(result)/ | 結果ダッシュボード。T06→T05→T04→T03 を結線 ← **Milestone 1 ゲート** | final verify＋Tier1レビュー（実物件sanity checkは残課題） | PR#4 merged main |
| T08 | verified | main | T07 | lib/supabase/, lib/underwriting/engine.ts, proxy.ts, app/login/, app/api/auth/, app/api/scans/[scanId]/ | 認証ゲート(proxy.ts), loginページ, logoutルート, エンジン純粋化(currentYear/now inject), 写真Storage実アップロード | verify緑＋PR#8マージ済 | PR#8 merged main |
| T09 | verified | main | T08 | app/scans/, app/api/scans/route.ts, app/api/scans/[scanId]/photos/, app/api/scans/[scanId]/status/, proxy.ts | 査定履歴ページ(GET /api/scans), per-photo同期Gemini(タイムアウト対策), /scans認証保護 | pnpm verify ALL PASSED | PR#9 merged main |
| T10 | verified | main | T09 | app/api/scans/[scanId]/photos/route.ts, app/api/scans/[scanId]/status/route.ts, app/result/[scanId]/page.tsx | Gemini同期解析→statusルートでポーリング、結果ダッシュボード実データ表示 | pnpm verify ALL PASSED | PR#10 merged main |
| T11 | verified | main | T10 | app/result/page.tsx, app/result/[scanId]/page.tsx, components/print-button.tsx | PDF帳票生成（window.print + print:hidden CSS） | pnpm verify ALL PASSED | PR#12 merged main |
| T12 | verified | main | T11 | app/manifest.ts, app/offline/page.tsx, public/sw.js, next.config.ts | PWA manifest + サービスワーカー（Turbopack対応: serwistを使わずvanilla SW） | pnpm verify ALL PASSED | PR#13 merged main |
| T13 | verified | main | T12 | app/admin/layout.tsx, app/admin/users/page.tsx, app/admin/users/users-table.tsx, app/api/admin/users/route.ts, app/api/admin/users/[userId]/route.ts, supabase migration(bootstrap trigger), app/scans/page.tsx | マルチユーザー管理UI: 招待・ロール変更・削除。初回サインアップ→admin自動昇格。/scansヘッダーに管理リンク | pnpm verify ALL PASSED | PR#14 merged main |
| T14 | verified | main | T13 | app/api/scans/[scanId]/photos/route.ts, lib/ai/analyze-photo.ts | 写真解析ジョブキュー化: after()でレスポンス後にGemini呼び出し、Vercelタイムアウトリスク解消 | pnpm verify ALL PASSED | PR#15 merged main |
| T15 | verified | main | T14 | vitest.setup.ts, vitest.config.ts, proxy.test.ts, app/api/scans/route.test.ts, app/api/scans/[scanId]/photos/route.test.ts, lib/ai/analyze-photo.test.ts, app/api/admin/users/route.test.ts, app/api/admin/users/[userId]/route.test.ts, app/result/[scanId]/page.tsx, components/scan-flow.tsx | テストスイート60件(11ファイル): auth middleware/scans/photos/analyze-photo/admin全API。ポーリング5分タイムアウト。写真10MBサイズ上限 | pnpm verify ALL PASSED (60 tests) | PR#16 merged main |
| T16 | verified | main | T15 | app/api/scans/**, lib/ai/**, lib/underwriting/engine*, components/scan-flow.tsx, app/result/[scanId]/page.tsx, app/scans/page.tsx | 商業ハードニング: IDOR修正(photos/status所有権チェック), scan作成認証必須, サーバ側ガード(10MB/MIME/slot注入/20枚), エンジン cap=0→nogo＋NaNガード(ENGINE 1.1.0), AIProvider MIME伝播, 失敗リトライUX, 写真統計表示 | pnpm verify ALL PASSED (78 tests) | PR#17 squash-merged main (83460e0) |

## Blockers

| ID | Task | Summary | Needs |
|----|------|---------|-------|
| ~~B-01~~ | T01 | 解決済: ユーザーが Vercel import＋env設定＋deploy 完了。本番URL稼働 | done |

## Review Notes

| Task | Reviewer | Tier | Result | Notes |
|------|----------|------|--------|-------|
| T00 | — | — | — | scaffold; self-audit pending in this session |
| T01 | fresh Sonnet subagent | Tier 1 (DB schema含; budget上 Opus不使用) | conditional-pass→対応済 | M-01(updated_atトリガ), M-02(bucket作成), m-08(B-01化), m-01(Next16表記), n-04(env JSDoc) を修正。残findingは T02-06 で対応 |
| T-UI | fresh Sonnet subagent | Tier 1 (UI, 400+行) | FAIL→全指摘対応→自己確認でPASS | B-1(safe-area),B-2(cond contrast),M-1(年),M-2(clamp),M-3(精度文言),M-5(disclaimer contrast),m-1(tap44),m-2(aria),m-5(Noto),m-9(income符号) 修正。verify緑で再確認（Opus不使用のため full再レビューは代替） |
| T16 | fresh Opus subagent | Tier 2 (auth/security/500+行) | PASS＋1件修正適用 | [中]storage孤児blob(insert失敗時cleanup欠如)を発見→5f88115で修正＋回帰テスト。engine二重実行レースは冪等upsertのため見送り記録。報告書 .opus_review_report.md |
