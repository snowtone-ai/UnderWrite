# docs/issues.md — UnderWrite

Self-Evolution の燃料。失敗の症状・文脈・試行を記録。3回同一失敗で web 検索し出典URLを記録。

## Active Issues
（なし）

## Resolved (with root cause)

### R-001 — ESLint が TypeScript 7 でクラッシュ（TypeError: reading 'Cjs'）
- **症状**: `pnpm lint`（eslint .）が exit 2。`@typescript-eslint/typescript-estree@8.64.0` が
  `shared.js:59` で `undefined.Cjs` を読み crash。tsc/next build は成功するため lint 特有。
- **根本原因**: `typescript@7.0.2`（新・native TS7）に typescript-eslint 8.x が未対応。
- **対処**: TypeScript を広くサポートされた 5.x 系（`^5.9`）にピン留め。TS7 は tooling 追随待ち。
- **教訓**: 新メジャーの TypeScript は lint/型ツールの対応を確認してから採用する（今回は 5.x 継続）。

### R-002 — ESLint 10 で eslint-plugin-react がクラッシュ（getFilename is not a function）
- **症状**: TS 5 化後も `pnpm lint` が exit 2。`eslint-plugin-react@7.37.5` が
  `context.getFilename()` を呼ぶが ESLint 10 で削除済み（→ `context.filename`）。
- **根本原因**: ESLint 10 が新しすぎ、eslint-config-next 16 依存のプラグイン群が未対応。config-next 16 は ESLint 9 前提。
- **対処**: ESLint を `^9`（`9.39.5`）にピン。→ lint 0 errors。
- **教訓**: pnpm は `latest` メジャーを引く。Next/eslint-config-next が公式サポートする **ESLint 9・TypeScript 5** を明示ピンするのが安定。

## Promoted Rules
（なし）
