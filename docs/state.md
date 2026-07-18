# docs/state.md — UnderWrite

- **Branch**: `main`（全PR マージ済、clean）
- **Active Task**: T17（フロントエンド品質最終仕上げ）— 完了後に本セッション終了予定
- **Executor**: main agent (Sonnet 4.6)
- **Write Lock**: なし
- **Vercel**: project `under-write`（prj_pX2FfMIMvmxpN1NsjHVjNicMf3M0）、本番=main 自動デプロイ、env設定済
- **Supabase**: project `erpfxhrvrzmxawojziyc`（ap-northeast-1）

## 完了済みタスク（mainにマージ済み）

| Task | 内容 | PR |
|------|------|----|
| T00 | pm-zero v11 基盤整備 | scaffold commit |
| T01 | Next.js16/TS/Supabase/Vercel 雛形 | #2 |
| T-UI | 世界水準デザインシステム＋3画面 | #3 |
| T02 | lib/domain Zod スキーマ | #4 |
| T03 | lib/underwriting 決定論エンジン | #4 |
| T04 | lib/data 不動産情報ライブラリ client | #4 |
| T05 | lib/ai Gemini provider | #4 |
| T06 | スキャンフロー UI + POST /api/scans | #4 |
| T07 | 判定ダッシュボード + GET /api/scans/[scanId]/status | #4 |
| T08 | 認証ゲート・写真Storage・エンジン純粋化 | #8 |
| T09 | 査定履歴ページ・写真解析エンドポイント | #9/#10 |
| T10 | 実データ結果ダッシュボード（[scanId]ページ） | #10 |
| T11 | PDF帳票生成（print CSS） | #12 |
| T12 | PWA manifest + service worker（Turbopack対応） | #13 |
| T13 | マルチユーザー管理UI + bootstrap trigger + admin nav | #14 |
| T14 | 写真解析ジョブキュー化（next/server after()） | #15 |
| T15 | テストスイート60件 + ポーリングタイムアウト + 写真サイズ上限 | #16 |
| T16 | 商業ハードニング（IDOR修正・サーバ側ガード・エンジン境界値・MIME伝播・失敗リトライUX）＋Opus Tier2レビュー修正 | #17 |

## Milestone 達成状況

- **Milestone 1**: ✅ MVP（住所+写真→判定ダッシュボード 本番URL稼働）
- **Milestone 2**: ✅ PDF帳票 / PWA / マルチユーザー / ジョブキュー化
- **Milestone 3**: ✅ テストスイート60件 / UX改善（タイムアウト・サイズ上限）
- **Milestone 4**: ✅ 商業ハードニング（テナント分離 / サーバ側ガード / エンジン境界値。テスト78件）

## 既知の残課題（次フェーズ候補）

- 公開データ（不動産情報ライブラリ）実APIへの接続（現在モック graceful-degrade）
- 実物件1件での sanity check（買付上限価格の妥当性確認）
- iOS RoomPlan / LiDAR 3D復元アプリ（後フェーズ）
- 課金・サブスクリプション
- AI呼び出しエンドポイントのレート制限（現状は認証＋20枚/scanのみ）
- user_id NULL の旧スキャン（認証導入前）は status API から参照不可（T16の所有権厳格化。本番該当データがあれば移行要）
- status GET の engine 二重実行レース（冪等 upsert のため無害。Opusレビュー記録済）

> tasks.md と食い違う場合は tasks.md が正。
