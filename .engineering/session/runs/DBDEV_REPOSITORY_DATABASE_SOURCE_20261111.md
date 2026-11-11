# DBDEV — Repository-scoped development database source

## THA Governance Preflight Receipt
- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- Worktree / branch: `feat/integrated-dev`
- Base HEAD: `82f23226f43a3a8e8298f8863c483239a3e2a89d`
- Pre-existing git status: 52 entries before this task; preserved.
- User request: make this repo use one unambiguous development database source; avoid deleting sibling repositories.
- Governance read: root `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; relevant sections of `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/CANONICAL_PUBLICATION_ARCHITECTURE.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `docs/ai-operating-model/README.md`; `principles.md`; `evidence-and-architecture.md`; `implementation-and-compliance.md`; `risk-and-approval.md`; `rollback-and-output.md`.
- Task-specific implementation inspected: `server/db.ts`, `server/index.ts`, `drizzle.config.ts`, `package.json`, `.env.example`, and `scripts/db/database-target.ts`. `.env` presence was confirmed without reading its contents.
- Authorised scope: pin this repository's development-server DB URL to its root `.env` and make the standard `npm run dev` command launch on Windows.
- Non-goals: no sibling repository inspection/deletion; no `.env` read/edit; no credential changes; no database query/write/migration; no service restart; no staging/production/promotion.
- Architecture conflicts: NONE identified. Local `.env` is explicitly authoritative/confidential in project governance. No separate local DB owner is named in architecture.
- Decision/risk: RED (database target selection and startup persistence risk).
- Implementation permitted: YES under standing `feat/integrated-dev` development authority; no promotion authority.

## Findings
- `server/db.ts` previously kept any inherited `DATABASE_URL`; it only loaded `.env` if the variable was absent. This made DB selection depend on the launching shell.
- `package.json` used POSIX `NODE_ENV=development` syntax, which Windows cmd.exe rejects before Node starts.
- `server/index.ts` runs the migration runner at startup. Runtime restart was therefore deferred.

## Changes Made
- `package.json`: replace POSIX-only `dev` with `tsx scripts/start-dev.ts`.
- `scripts/start-dev.ts`: set `NODE_ENV` inside Node, anchor CWD to this repository, then import the server.
- `server/db.ts`: for `dev`/`dev:reset` npm lifecycle starts or direct development `tsx server/index.ts`, clear inherited `DATABASE_URL`, load `.env` from this repository root, and fail closed if missing.
- Production, CI, tests, and explicit database scripts retain their prior environment-provided behavior.
- No database contents, schema, data, or `.env` values were read or changed.

## Architecture Compliance
- **Verified:** `server/db.ts` remains the one app connection-pool owner; all consumers continue to use the existing pool/Drizzle instance. No second store or writer is introduced.
- **Verified:** the repo-root `.env` is the config source already named authoritative by `PROJECT_GOVERNANCE.md`; this change removes shell-dependent override for dev server only.
- **Verified:** business-data ownership and all consumer authorization paths are unchanged.
- **Inferred:** existing `.env` points to the intended development database. Its contents were not inspected; runtime target must be confirmed by the owner before restart.

## Definition of Done
- `npm run dev` launches through a Node entry point without shell-specific syntax. That entry point and direct development `tsx server/index.ts` starts disregard inherited `DATABASE_URL` and load the value from this repo's root `.env`.
- A missing/unreadable repo `.env` fails closed; it must never fall back to another shell's DB.
- Production, CI, tests, and explicit database commands keep current behavior.
- Manual acceptance after restart: from this repo, run `npm run dev` with an intentionally different inherited sentinel URL; verify the server uses this repository's `.env` target and the Companion displays the new grouped restriction notices/actions. The server must not start against the sentinel.

## Data Impact
- Reads existing repo `.env` only at dev server process startup; no agent access to its contents.
- Writes new database rows: no.
- Changes meaning of existing data: no.
- Backfill: no.
- Runtime restart can run whatever migrations are pending through the existing startup flow; not performed in this task.

## Trust Check
- No credentials or connection strings were printed, copied, or changed.
- Missing configuration fails closed instead of silently selecting an inherited DB.
- Highest-risk remaining inferred claim: the opaque repository `.env` selects the intended dev database.

## Rollback Plan
- Rollback identifier: `rollback/DBDEV-repository-env-source-20261111` → `82f23226f43a3a8e8298f8863c483239a3e2a89d`.
- Exact-byte package configuration backup: `package.json.pre-dbdev-windows-launch-20261111T193404068.bak` (SHA-256 `1FBA765BE72F8C2412B8D8545A1A29BDEC638C672AF682959FD41C97968607CF`).
- Revert only this task's `server/db.ts`, `scripts/start-dev.ts`, and `package.json` changes. Existing unrelated dirty files remain untouched.
- The code rollback does not reverse any migration; none was run.

## Scope Lock
Only the development server's database URL source in this repository changed. No sibling folders, DB data, credentials, migration state, or release environments were touched.

## Validation Performed
- `package.json` parses; `git diff --check` passes for `server/db.ts`, `scripts/start-dev.ts`, and `package.json`.
- `npm run dev -- --check` passed through npm/Windows command dispatch and resolved this checkout's root. The server-start step was intentionally skipped.
- Typecheck: `npm run typecheck -- --pretty false` exited 2 with diagnostics in other files; no diagnostic referenced `server/db.ts` or `scripts/start-dev.ts`. Build and tests were not run.
- The full dev server was not launched because startup can apply pending migrations.

## Implementation Completion Report
- Completed: `npm run dev` now has a Windows-compatible entry point; DB source selection is deterministic for that command and direct development `tsx server/index.ts` starts.
- Remaining gap classification: **External Dependency** — runtime restart and confirmation that the configured `.env` target is the intended development database; startup may apply pending migrations.
- Recommended next action: confirm target and migration status, then restart the dev server and inspect the UI/API response. Do not delete neighboring repositories; their existence does not determine this checkout's DB URL.
- Promotion/deployment: none; no authority requested or used.


## Follow-up verification and promotion to Git

- Follow-up date: 2026-11-11. Rollback point before the follow-up commit: `rollback/DBDEV-env-source-before-commit-20261111` → `8f540457d55dc75f9e8446e01c4535a55e03010c`; the working tree was dirty (50 status entries), so the tag captures committed state only.
- `npm run dev -- --check`: PASS; Windows npm dispatch reaches `scripts/start-dev.ts`, resolves this repository root, and skips server startup.
- Isolated DB source check: imported `server/db.ts` with `npm_lifecycle_event=dev` and an inherited fake sentinel URL. PASS: the sentinel was replaced with the value loaded from this repository's `.env`; the value was not printed and no database connection was attempted.
- The owner-provided Claude report additionally states that full `npm run dev` and inherited-URL override were live-tested. Codex did not repeat full server startup because `server/index.ts` runs pending migrations; that report says the snooze migration applied during startup. Applied DB state remains uninspected here.
- Timestamped package backup exists: `package.json.pre-dbdev-windows-launch-20261111T193404068.bak`, SHA-256 `1FBA765BE72F8C2412B8D8545A1A29BDEC638C672AF682959FD41C97968607CF`.
- Commit scope: only `package.json`, `server/db.ts`, `scripts/start-dev.ts`, this implementation record, and its session record. No `.env`, database, other dirty work, or runtime service is included.
