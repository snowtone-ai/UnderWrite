# HANDOFF-JA.md — UnderWrite 引き継ぎ

## 今回セッションの成果（開発環境構築 / T00）
pm-zero v11 に完全準拠した本番プロダクト開発環境を UnderWrite リポジトリに構築した。

- **リポジトリ**: git 初期化、`snowtone-ai/UnderWrite` remote 接続、作業ブランチ `chore/scaffold-pm-zero-v11`。
- **pm-zero v11 台帳（13ファイル基盤）**:
  - Core: `CLAUDE.md`, `.claude/settings.json`（bypassPermissions＋thin deny）, `HANDOFF-JA.md`
  - Ledger: `docs/vision.md`, `tasks.md`, `docs/state.md`, `docs/decisions.md`, `docs/issues.md`
  - Navigation: `docs/repo-map.md`
  - Scripts: `scripts/setup.mjs`, `scripts/verify.mjs`
  - Aux: `.env.example`, `.gitignore`, `README.md`
- **アーキテクチャ確定（Fable 5 アドバイザー評を反映、decisions.md D-002〜D-007）**:
  - スタック: Next.js 15 + TS / Vercel 無料枠 / Supabase 無料枠。$0（Claude Pro 以外）厳守。
  - AI 差し替え可能: `lib/ai/` の `AIProvider`（2メソッド: `analyzeImages`, `generateText`）、
    `AI_PROVIDER` env で選択。初期 = Gemini。
  - 数学隔離: `lib/underwriting/` は純・決定論。LLM に載せない。
  - AI 境界: `lib/domain/` の versioned `Finding` zod スキーマ。生出力＋解析結果＋version＋model id を永続。
  - MVP 削減: PWA/認証/ネイティブRoomPlan/帳票 を除外。写真解析は最初から非同期（DB永続＋ポーリング）。

## 検証
- Phase 0 toolchain: node v24.14 / pnpm 10.33 / git 2.54 / gh 2.92（snowtone-ai 認証済）/ rtk 0.39 — OK。
- **レビューティア**: Tier 0（scaffold のためコード検証は次タスク以降）。本セッションはドキュメント/設定中心。

## 次セッションの着手点（T01: scaffold + deploy）
1. Next.js 15 + TS + pnpm 雛形を作成（`pnpm create next-app` 相当、App Router）。
2. Supabase MCP で project 作成 → tables（scans, photos, findings, underwritings）→ Storage bucket。
3. Vercel MCP で hello page を本番デプロイし 200 を確認。
4. `.env.local` に Gemini / Supabase / 不動産情報ライブラリ の値を投入（ユーザー作業が要る場合はここで依頼）。

## 未確定・ユーザー確認が要る可能性
- Supabase / Vercel / Gemini / 不動産情報ライブラリ の各アカウント・APIキー取得（無料枠）。
  MCP でプロジェクト作成は自律実行可能だが、外部アカウント認証が要る場合は `! <command>` での実行を依頼する。
