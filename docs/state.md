# docs/state.md — UnderWrite

- **Branch**: feat/t01-scaffold-deploy
- **Active Task**: T01（scaffold + deploy）— コード/DB完了、Vercel import がユーザー作業として残
- **Executor**: main agent (Opus 4.8 this session)
- **Write Lock**: なし
- **Latest Verification**: pnpm verify ALL PASSED（lint/typecheck/test 4件/build 全緑）
- **Supabase**: project `erpfxhrvrzmxawojziyc`（ap-northeast-1）、schema 適用済（scans/photos/findings/underwritings, RLS on）
  URL: https://erpfxhrvrzmxawojziyc.supabase.co ／ publishable key 取得済
- **Blocker Summary**: Vercel への GitHub import（ユーザー一回操作）待ち。完了後 auto-deploy が有効化
- **Next Session Pickup**: Vercel import 確認後 T02（lib/domain zod スキーマ）へ。

> tasks.md と食い違う場合は tasks.md が正。
