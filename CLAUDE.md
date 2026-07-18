# CLAUDE.md — UnderWrite / pm-zero v11 (Claude Code only, Windows PowerShell, Pro plan)

UnderWrite（アンダーライト）: 築古住宅アンダーライティングAI。スマホスキャン＋公開データで
「買付上限価格・再生コストP10/P50/P90・隠れ損傷リスク・再販価格・粗利」を即日算出する B2B SaaS。
思想: 「開けなくても、わかる。」計測ではなく "目利き（アンダーライティング）" を売る。

## Language
- Reports, error reports, manual confirmation requests: Japanese.
- Code identifiers, comments, file content: English.
- When 3+ HIGH assumptions accumulate, ask immediately (batched).

## Source of Truth (read on demand)
- Intent: docs/vision.md | Tasks: tasks.md | State: docs/state.md
- Decisions: docs/decisions.md | Failures: docs/issues.md | Map: docs/repo-map.md
- Product spec: 企画書_UnderWrite_築古住宅アンダーライティングAI.md | Report: HANDOFF-JA.md

## Startup Read
- This file, docs/state.md, docs/decisions.md, docs/repo-map.md Summary. Nothing else.

## Budget (Pro plan, hard wall)
- One task per session. Plan → /handoff → execute for big features.
- Haiku subagents for wide reading; Sonnet for everything else; Opus only for
  top-risk review/architecture when available. Never block on Opus. Fable 5 = advisor only.
- Long builds/tests in background. Batch questions. Compact at checkpoints. RTK always on.

## Continuity (auto-compact at 50%)
- Checkpoint to tasks.md + docs/state.md and commit after each logical unit.
- When compacting, always preserve: active task ID, modified files list, verify command.
- Keep this file lean; @path or rg for detail; subagents for wide reading.

## Autonomy
- bypassPermissions is active; never ask permission for tool calls.
- The global guard hook blocks the dangerous set; if blocked, do not work around it.
- Human gate only for irreversible real-world acts (real money, prod credentials,
  publishing personal data, production deploy).

## Task Ledger
- tasks.md is the only execution ledger; main agent is the only writer.
- Every ready task: owner, dependencies, write scope, acceptance, verification, evidence.

## Parallelism
- Disjoint write scopes or worktree isolation. Same file → serialize.
- Default cap: ≤2 concurrent worker subagents; raise only if budget clearly allows.

## Self-Review (no human reviewer)
- Tier 0: verify script + tests + lint + typecheck (always).
- Tier 1: fresh-context Sonnet subagent (review classes: 300+ line diff, new external
  API, critical-workflow changes, and all Tier 2 classes).
- Tier 2: fresh Opus subagent when available/affordable (auth, billing, DB schema,
  RLS/permissions, deploy, security, production data, personal information).
  Otherwise Tier 1 at high effort; record the substitution. CodeX is not permitted — Claude only.

## Self-Evolution
- Log failures in docs/issues.md. On 3 repeats, web-search a fix and record the source URL.
- Promote always-applicable lessons here; reference lessons into docs/lessons.md;
  operator-level lessons into auto-memory.

## Engineering Role
- Principal-level full-stack engineer. Readable, testable, minimal, correct code.
- No placeholder code or TODOs. Every committed function works.
- Refined simplicity is the top product value — minimal surface area, no premature abstraction.

## Product Architecture Invariants
- AI is SWAPPABLE. All model calls go through lib/ai/ (provider interface). AI_PROVIDER env
  selects the impl (gemini | claude | openai). Never call a model SDK outside lib/ai/.
- The underwriting math (cost distribution P10/P50/P90, purchase-cap, margin) is a PURE,
  deterministic TypeScript module (lib/underwriting/). It must NOT live inside an LLM prompt.
- Public-data ingestion (不動産情報ライブラリ 等) lives behind typed clients in lib/data/.

## Coding Priorities (in order)
- Correctness, Security, Reliability, Data Integrity, Observability,
  Maintainability, Performance, Scalability, Testability, Dependency Security.

## Commands
- install: pnpm install | lint: pnpm lint | typecheck: pnpm typecheck
- test: pnpm test | build: pnpm build | verify: pnpm verify | setup: node scripts/setup.mjs
- Use only commands that exist in this repository.

## Shell
- PowerShell for all operations. Windows backslash paths. node scripts/name.mjs.
- RTK compresses CLI output transparently (global hook). rtk gain shows savings.

## Git (full auto)
- Never commit to main. Branch per task: <type>/<short-description>.
- Commit after each logical unit; push after every commit; auto-PR to main.
- Stage only Write-Scope files. Never stage .env* or secrets. gitleaks pre-push if available.
- Merge: final verify green + fresh-context self-review passed.
  Low/medium risk: squash-merge + delete branch.
  High-risk classes: stop before irreversible real-world side effects; Japanese summary.

## Execution Boundaries
- Handle every error explicitly. Safe values only in output.
- .env.example is the template; runtime reads actual env values from .env.local.
- Irreversible real-world acts are human-gated. Everything else is AI-executed without asking.
