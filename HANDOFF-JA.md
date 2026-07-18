# HANDOFF-JA.md — UnderWrite 引き継ぎ

## 現在の到達点（完了・本番稼働中）
- **T00**: pm-zero v11 開発環境（13ファイル基盤、CLAUDE.md、guard/settings）構築。
- **T01**: Next.js 16 + TS + pnpm 雛形。Supabase 構築。Vercel 本番デプロイ（env設定済）。
- **T-UI**: 世界水準デザインシステム（「紙の稟議書の誠実さ」／藍／Tailwind v4／Inter+Noto Sans JP）。
  画面 = landing `/`、scan入力 `/scan`、判定ダッシュボード `/result`。ユースケース(佐藤社長)を mock で再現。
- **アイコン**: ベクター「Gable + Median」。favicon(`app/icon.svg`) / iOS(`app/apple-icon.png`) /
  ロゴ(`components/logo.tsx`) / PWA(`app/manifest.ts`)。

## 稼働リソース
- **GitHub**: snowtone-ai/UnderWrite（main 保護せず直接マージ運用、PRは squash）。
- **Vercel**: project `under-write`（prj_pX2FfMIMvmxpN1NsjHVjNicMf3M0 / team_VbVoJAkv3fZhiEDT8BmksU9K）。
  main push で本番自動デプロイ。本番URL: https://under-write-git-main-snowtone-ai-155227e5.vercel.app
- **Supabase**: project `erpfxhrvrzmxawojziyc`（ap-northeast-1）。
  tables: scans/photos/findings/underwritings（RLS on・公開ポリシー無＝service-role のみ）。
  updated_at トリガ、private bucket `property-photos`。URL: https://erpfxhrvrzmxawojziyc.supabase.co
- **AI**: Gemini（`AI_PROVIDER=gemini`）。差替は env のみ（コード不変）。

## 検証状態
- `pnpm verify` = lint 0 / typecheck / test 4 / build（8 routes）全緑。
- レビュー: T01・T-UI とも fresh-context Sonnet サブエージェントで実施し指摘対応済（Review Notes 参照）。

## 次セッションの着手点
1. **（ユーザー要望）Canva MCP**: セッション途中で Claude Desktop 側に Canva を接続済みの可能性。
   新規MCPは再起動後に有効化されるため、**次セッション開始時に Canva が使えるか確認**。使えれば、
   ユーザー希望に応じてアイコンを Canva でも制作/検討（現行は SVG 版が本番反映済。D-009 参照）。
2. **T02**: `lib/domain` に zod スキーマ `Finding` / `ScanInput` / `Underwriting`（versioned）を定義。
   現行 `/result` は `lib/sample/underwriting.ts` の mock 型を使用 → T02 完了時に lib/domain へ差し替え結線。
3. 以降 T03（決定論エンジン）→ T04（不動産情報ライブラリ client）→ T05（lib/ai Gemini）→ T06（scan→Storage→非同期処理）→ T07（実データ結線・Milestone1）。

## 未確定・ユーザー確認が要る可能性
- 不動産情報ライブラリ API キー（申請から5営業日）。届いたら `.env.local` / Vercel env に `REINFOLIB_API_KEY` 設定。
- `SUPABASE_SERVICE_ROLE_KEY` は Vercel に設定済（ユーザー報告）。ローカル `.env.local` にも T06 実装時に要投入。

## セッション終了チェック（このコミット時点）
- git: main 相当までマージ・push 済、作業ツリー clean。
- ledger（tasks/state/decisions/issues）と memory（MEMORY.md）は最新。
