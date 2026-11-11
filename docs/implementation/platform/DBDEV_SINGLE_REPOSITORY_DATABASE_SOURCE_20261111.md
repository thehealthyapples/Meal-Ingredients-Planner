# DBDEV — Single repository database source

## Summary
Pinned the integrated development server's `DATABASE_URL` source to this repository's root `.env` and made `npm run dev` launch on Windows. Previously, an inherited shell variable silently took precedence, and Windows cmd.exe rejected the POSIX-style npm command before the server started.

## Decision
Use the repo-root `.env` as the only database URL source for the integrated-dev server. This is the source project governance already calls authoritative. Alternatives were retaining shell-dependent overrides (ambiguous) or adding a second database selector (duplicate configuration). The chosen change is limited to the two dev-server npm lifecycle entry points. Production, CI, tests, and explicit database scripts are unchanged.

## Architecture Compliance
- **Verified:** `server/db.ts` is the existing application database connection owner; consumers continue to use its one pool/Drizzle instance.
- **Verified:** project governance names the local `.env` authoritative and confidential. This change does not inspect or alter its content.
- **Verified:** no tables, business-data owners, read services, authorization, or write paths changed.
- **Verified:** no second database, environment selector, or connection workflow was added.
- **Inferred:** the repo `.env` points to the intended development database. It was not read; this must be established before a server restart.

## Definition of Done
- `npm run dev` starts through a Node launcher that sets development mode without shell-specific syntax.
- The launcher and direct development `tsx server/index.ts` starts disregard inherited `DATABASE_URL` and load the value from this repo's root `.env`.
- Missing/unreadable `.env` or missing `DATABASE_URL` fails closed.
- Production, CI, tests, and explicit database scripts preserve existing behavior.
- Manual acceptance after restart: run from this repository while an intentionally different inherited sentinel URL is present; verify the app uses only the repo `.env` target and the Companion now renders grouped diet conflict notices with Acknowledge/Snooze controls.
- Existing Planner, Companion, and DB consumer behavior remains otherwise unchanged.

## Data Impact
- Code loads the existing local `.env` when the named dev-server command starts.
- No data rows, schema, or credentials were changed; no backfill.
- The existing startup migration runner can apply pending migrations upon restart. No restart or migration was performed.

## Trust Check
- No connection string or credential was read, logged, copied, or changed by this task.
- The server fails closed instead of silently falling through to an inherited URL.
- Highest-risk remaining inferred claim: the repo `.env` points to the intended dev database; owner confirmation is required before runtime activation.

## Rollback Information
- `rollback/DBDEV-repository-env-source-20261111` → `82f23226f43a3a8e8298f8863c483239a3e2a89d` (committed state only; the worktree had 52 pre-existing dirty entries).
- Exact-byte `package.json` backup: `package.json.pre-dbdev-windows-launch-20261111T193404068.bak` (SHA-256 `1FBA765BE72F8C2412B8D8545A1A29BDEC638C672AF682959FD41C97968607CF`).
- Revert only this task's `server/db.ts`, `scripts/start-dev.ts`, and `package.json` edits. No DB rollback is needed because no database operation occurred.

## Scope Lock
Changed only the development server entry point and DB URL selection in `package.json`, `scripts/start-dev.ts`, and `server/db.ts`. No sibling repository, folder, `.env`, database, staging, or production target was changed. No commit or promotion was made.

## Validation Performed
- `package.json` parses; `git diff --check` passes for `server/db.ts`, `scripts/start-dev.ts`, and `package.json`.
- `npm run dev -- --check` passed through npm/Windows command dispatch and resolved this checkout's root. The server-start step was intentionally skipped.
- Typecheck exited 2 with diagnostics in other files; no diagnostic referenced `server/db.ts` or `scripts/start-dev.ts`. No tests or build were run. No database query or full runtime launch/restart was performed.
- Runtime UI acceptance remains pending.

## Implementation Completion Report
- Completed: `npm run dev` has a Windows-compatible launcher; DB URL selection is deterministic for this command and direct development `tsx server/index.ts` starts.
- Remaining gap: **External Dependency** — verify repo `.env` target and pending migrations, then restart the dev server and confirm the user-visible Companion update.
- Recommended next action: owner confirms this checkout's `.env` target and permits startup if it will apply pending development migrations.
- Deployment/promotion: none.



## Follow-up verification and promotion to Git

- Follow-up date: 2026-11-11. Rollback point before the follow-up commit: `rollback/DBDEV-env-source-before-commit-20261111` → `8f540457d55dc75f9e8446e01c4535a55e03010c`; the working tree was dirty (50 status entries), so the tag captures committed state only.
- `npm run dev -- --check`: PASS; Windows npm dispatch reaches `scripts/start-dev.ts`, resolves this repository root, and skips server startup.
- Isolated DB source check: imported `server/db.ts` with `npm_lifecycle_event=dev` and an inherited fake sentinel URL. PASS: the sentinel was replaced with the value loaded from this repository's `.env`; the value was not printed and no database connection was attempted.
- The owner-provided Claude report additionally states that full `npm run dev` and inherited-URL override were live-tested. Codex did not repeat full server startup because `server/index.ts` runs pending migrations; that report says the snooze migration applied during startup. Applied DB state remains uninspected here.
- Timestamped package backup exists: `package.json.pre-dbdev-windows-launch-20261111T193404068.bak`, SHA-256 `1FBA765BE72F8C2412B8D8545A1A29BDEC638C672AF682959FD41C97968607CF`.
- Commit scope: only `package.json`, `server/db.ts`, `scripts/start-dev.ts`, this implementation record, and its session record. No `.env`, database, other dirty work, or runtime service is included.
