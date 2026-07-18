# tasks.md — UnderWrite

**Goal Binding**: 本番プロダクト「UnderWrite」の完成。現フェーズ = MVP基盤（住所＋写真 → 判断ダッシュボード）を
本番URLで通す（Milestone 1）。詳細意図は docs/vision.md、一次資料は 企画書_UnderWrite_*.md。

**Status Vocabulary**: proposed / ready / doing / blocked / review / done / verified

**Main agent is the only writer of this file.**

## Tasks

| ID | Status | Owner | Depends On | Write Scope | Acceptance | Verification | Evidence |
|----|--------|-------|-----------|-------------|------------|--------------|----------|
| T00 | done | main | — | 全ルート台帳/設定 | pm-zero v11 の13ファイル構成・git・remote・guard 整備 | Phase 0.5 self-audit | このコミット |
| T01 | ready | main | T00 | app scaffold, package.json, next.config, supabase/ | Next.js15/TS/pnpm リポ雛形＋hello page が Vercel で live。Supabase project＋Storage bucket＋tables(scans,photos,findings,underwritings) | pnpm build 成功／本番URL 200／supabase list_tables | — |
| T02 | ready | main | T01 | lib/domain/ | zod スキーマ＋TS型: `Finding`,`ScanInput`,`Underwriting`（versioned）。AI境界の背骨 | pnpm typecheck／schema unit test | — |
| T03 | ready | main | T02 | lib/underwriting/ | 純TS決定論エンジン: 築年×工法×findings→対数正規で隠れ損傷分布, P10/P50/P90, 買付上限価格式, 粗利。lib/ai を import しない | fixture findings で unit test（決定論・境界値・負パス） | — |
| T04 | ready | main | T02 | lib/data/ | 不動産情報ライブラリ 型付きクライアント→comps＋再販ベースライン。応答をDBキャッシュ。欠損時 graceful degrade | モックfetch でクライアント test | — |
| T05 | ready | main | T02 | lib/ai/ | `AIProvider` interface＋Gemini実装（structured output→`Finding[]`）。AI_PROVIDER 選択。境界で zod 検証＋生出力永続 | provider契約 test（スキーマ非適合で reject/retry） | — |
| T06 | ready | main | T01,T05 | app/(scan)/, app/api/ | 住所＋写真アップロードpage→Storage→写真1枚ずつ処理route（DB status追跡＋ポーリング） | ローカルで1件アップ→findings生成をE2E確認 | — |
| T07 | ready | main | T03,T04,T05,T06 | app/(result)/ | 結果ダッシュボード。T06→T05→T04→T03 を結線。実在物件1件で検証 ← **Milestone 1 ゲート** | final verify＋実物件sanity check＋Tier1レビュー | — |
| T08 | proposed | main | T07 | 全域 | ハードニング: 認証, エラー/リトライUI, replay項目レビュー, vision/README 更新 | final verify＋Tier1（認証はTier2） | — |

## Blockers

| ID | Task | Summary | Needs |
|----|------|---------|-------|
| — | — | — | — |

## Review Notes

| Task | Reviewer | Tier | Result | Notes |
|------|----------|------|--------|-------|
| T00 | — | — | — | scaffold; self-audit pending in this session |
