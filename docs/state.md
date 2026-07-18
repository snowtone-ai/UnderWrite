# docs/state.md — UnderWrite

- **Branch**: main（全マージ済、作業ツリー clean。セッション終了可）
- **Active Task**: T00/T01/T-UI/アイコン done。次は T02（lib/domain zod）。
- **Executor**: main agent (Opus 4.8 this session)
- **Write Lock**: なし
- **Latest Verification**: pnpm verify ALL PASSED（lint0/typecheck/test4/build 4 routes）
- **Vercel**: project `under-write`（prj_pX2FfMIMvmxpN1NsjHVjNicMf3M0）、本番=main、env設定済（Gemini/Supabase/service_role）
- **Supabase**: project `erpfxhrvrzmxawojziyc`（ap-northeast-1）、schema＋トリガ＋bucket `property-photos`
- **Blocker Summary**: なし
- **Next Session Pickup**:
  (0) 開始時に **Canva MCP** が有効か確認（前セッション途中で接続済みの可能性。有効ならユーザー希望に応じ Canva 版アイコン検討。D-009）。
  (1) **T02**: lib/domain の zod スキーマ Finding/ScanInput/Underwriting。完了時に `/result` を lib/sample mock から差し替え結線。
  (2) 以降 T03 決定論エンジン → T04 → T05 → T06 → T07（Milestone1）。

> tasks.md と食い違う場合は tasks.md が正。
