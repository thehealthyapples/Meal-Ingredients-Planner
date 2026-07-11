# TRUST1-O8 — Production Schema Protection

**Status:** Implemented (2026-07-11). Phase 1, milestone O8.
**Workstream:** `TRUST1` — Production Trust & Compliance → Workstream O (Operations).
**Closes:** Risk **R6** — *"`drizzle-kit push --force` runs against production, and a post-merge git hook triggers a schema push automatically. Two migration mechanisms own one schema."* (🔴 RED)
**Rollback identifier:** `rollback/TRUST1-O8-production-schema-protection-20260711` → `4fd5a2969e8ecbf06b5cadeab145fb2ca89bce7c`
**Governing sources:** [`TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md`](./TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md) § TRUST1-O8 · [`ARCHITECTURE_PRINCIPLES.md`](../../architecture/ARCHITECTURE_PRINCIPLES.md) (one owner per fact) · [`ENGINEERING_WORKFLOW.md`](../../architecture/ENGINEERING_WORKFLOW.md)

---

## 1. Summary

THA had **two owners of one schema**, and only one of them was reviewed.

| | The reviewed one | The other one |
|---|---|---|
| | `server/migrations/runner.ts` | `drizzle-kit push --force` |
| Ordered | ✅ | ❌ |
| Transactional | ✅ | ❌ |
| Versioned (`schema_migrations`) | ✅ | ❌ |
| Reviewed | ✅ it is a code change | ❌ |
| Can silently drop a column | only if written and reviewed | **yes — that is how it works** |

`drizzle-kit push` reconciles a database to the code by **dropping whatever the code does not
mention**. It reached production two ways, and neither went through `deploy.sh`, CI, a pull request,
or the `TRUST1-V3` verification gate:

1. **`scripts/migrate-prod.sh`** ran `npx drizzle-kit push --force` **directly at the production
   `DATABASE_URL`**. `--force` means it does not ask.
2. **`scripts/post-merge.sh`** ran `npm run db:push` — wired to `.replit`'s `[postMerge]` hook, so it
   ran **automatically after every git merge**.

**A git merge could destroy production data.** That is not a characterisation; it is what the two
files did. Nobody decided this should be true — it accreted.

O8 replaces both with one rule:

> **A production schema changes in exactly one way: a reviewed migration appended to
> `server/migrations/runner.ts`, applied by `runMigrations()` at boot — in a transaction, exactly
> once, recorded in `schema_migrations`.**

`push` is not deleted, because it cannot be: it is the only thing that can build the 88-table
declarative schema in `shared/schema.ts` from empty, which is exactly what CI and a fresh dev
database need. It survives in **one file**, behind a gate that **fails closed** and has **no
override** for a managed host or for `NODE_ENV=production`.

### The finding that proves R6 was never theoretical

The coverage audit (§5) turned up a table that makes this concrete.

**`barcode_lookup_events`** is created by the reviewed migration `2026-04-02_add_barcode_lookup_events`,
is written to on **every barcode scan** (`server/routes.ts:6339`), and **was never declared in
`shared/schema.ts`.**

Drizzle offers to `DROP` any table it finds in the database but not in the schema. `--force` accepts
the offer without asking. **Every production push since April was an unattended instruction to drop
that table and every row in it.** `TRUST1-S5` spotted this exact hazard, defended *its own* table
against it (`shared/schema.ts:2603`, with a comment explaining why) — and nothing generalised the
defence, so this one stayed exposed for three months.

O8 declares the table (§4.6) and adds a regression test asserting that **no** table created by a
migration is missing from the Drizzle schema, so the class of defect cannot recur.

---

## 2. Architecture Compliance

| Check | Result |
|---|---|
| Read `docs/architecture/README.md` first (Bootstrap, STEP 2) | ✅ |
| Complies with governing architecture | ✅ — this task *enforces* `ARCHITECTURE_PRINCIPLES.md`'s "one owner per fact", applied to the schema itself |
| No second source of truth created | ✅ — O8 **removes** one. The reviewed runner is the sole owner of the production schema |
| No architectural duplication introduced | ✅ — and one duplicate safety check was **deleted**: `scripts/ci/setup-test-database.ts` had its own private copy of the managed-host denylist. There is now exactly one |
| No new runtime dependency | ✅ — the guard is build/ops tooling. **No server or client code path imports it.** `dist/index.cjs` is unchanged in behaviour |
| Conflicts with governing architecture | None |
| Bridge / compatibility shim created | **No.** O8 removes a mechanism; it does not wrap one |

### AI Architecture Compliance
**N/A** — no Intelligence surface, capability, prompt, or context path is touched.

### Experience & UI Governance Compliance
**N/A** — no user-facing surface is touched. No route, component, copy string, or visual token changes.

### Product Registry Compliance
See § 7.

---

## 3. What was actually reachable — the audit

Every mechanism in the repository capable of mutating a schema, and its state before and after.

| # | Mechanism | Reachable at production before? | After |
|---|---|---|---|
| 1 | `scripts/migrate-prod.sh` → `npx drizzle-kit push --force` | **YES — pointed at production by design** | **DELETED** |
| 2 | `scripts/post-merge.sh` → `npm run db:push`, via `.replit` `[postMerge]` | **YES — ran automatically after every merge** | **Schema mutation removed.** Hook retained; the script now runs `npm install` and nothing else |
| 3 | `package.json` → `"db:push": "drizzle-kit push"` | **YES — anyone, any agent, any environment** | **Guarded.** Routes through `scripts/db/schema-push-guard.ts` |
| 4 | `scripts/ci/setup-test-database.ts` → `execFileSync("npx", ["drizzle-kit", "push", "--force"])` | Partially — it had a private denylist, **plus a `CI_ALLOW_REMOTE_DB=i-know-what-i-am-doing` escape hatch** | **Guarded.** Uses the shared guard; **escape hatch deleted** |
| 5 | `scripts/apply-*.ts` + `nk6o-add-family-column.ts` — 9 scripts executing raw `CREATE TABLE` / `ALTER TABLE` | **YES — every one of them, with the prod URL, silently** | **All 9 guarded** via `guardAdHocDdl()` |
| 6 | `server/migrations/ensureUserDietColumns.ts` — a second DDL module | Dead (imported by nothing), but present and executable | **DELETED.** Its three columns are already owned by the reviewed migration `2026-02-27_add_user_diet_fields` — identical SQL, verified by content at the moment of deletion |
| 7 | `migrations/*.sql` (drizzle-generated) | **No — nothing executes them.** There is no `drizzle-kit migrate` anywhere in the repo | Unchanged, but **labelled**: `migrations/README.md` now says so. A folder named `migrations/` that is not the migrations is precisely the ambiguity O8 exists to end |
| 8 | `deploy.sh` | No — it never touched the database | Unchanged; now **asserted** by test. (`git add -A` is `TRUST1-O7`'s problem, not O8's — deliberately untouched) |
| 9 | **`server/migrations/runner.ts` at boot** | **YES — and this is correct** | **Unchanged. This is now the only one.** |

> **Note on #5.** These scripts were written as the *safer* alternative to `push` — their own headers
> say "used in place of interactive `drizzle-kit push`", and relative to `push --force` they were
> right: they are additive and idempotent. But they are still schema mutations outside the reviewed
> list, and every one of them would have run happily against production. They are historical and
> already applied; they are kept for provenance and made structurally unable to reach a real database.

---

## 4. Changes made

### 4.1 `scripts/db/schema-push-guard.ts` — **NEW.** The single chokepoint

The only file in the repository permitted to invoke `drizzle-kit push`. **Fails closed:**

| Condition | Behaviour |
|---|---|
| `NODE_ENV=production` | **REFUSE. No override exists.** A schema push is not a deployment step |
| Host is a managed provider (`neon.tech`, `render.com`, `amazonaws.com`, `supabase`, `cloudsql`, …) | **REFUSE. No override exists.** A managed host is where production data lives |
| `DATABASE_URL` missing / unparseable / hostless | **REFUSE** — it cannot prove the target is disposable, so it says no |
| Host is loopback, a CI service container, or Replit's local `helium` | Allow — disposable by construction |
| Any other host | **REFUSE** unless the operator states it exactly: `ALLOW_SCHEMA_PUSH="i-know-this-is-a-disposable-database"` |

The override phrase is a sentence and not a boolean **on purpose**. `ALLOW_SCHEMA_PUSH=1` is the kind
of thing you set once and forget; this is not. And there is deliberately **no** override for the two
conditions that actually matter — *an escape hatch on the control standing between a typo and
irreversible data loss is not a control*, which is why `S10`'s `CI_ALLOW_REMOTE_DB=i-know-what-i-am-doing`
was deleted rather than reused.

Exports: `assertDisposableDatabase()`, `runGuardedSchemaPush()`, `guardAdHocDdl()`, `redactUrl()`,
`UnsafeSchemaTargetError`.

### 4.2 `scripts/migrate-prod.sh` — **DELETED**

O8's brief permitted "deleted **or** rewritten to invoke the runner". **Deleted** is the stronger
answer and the one convergence actually demands: the runner already applies migrations at boot on
every deploy, so a second production migration entry point is not a convenience — it is the second
mechanism this task exists to remove. Rewriting it would have preserved the muscle memory that a
production schema is something you *push*.

There is no operational gap. **Apply** = deploy (the runner runs at boot). **Verify** =
`scripts/verify-prod.ts`, which already asserts the `schema_migrations` head.

### 4.3 `scripts/post-merge.sh` — schema mutation removed

Now runs `npm install` and nothing else. The `[postMerge]` hook is **kept** — installing dependencies
after a merge is genuinely useful and mutates nothing. What is gone is the `npm run db:push` line.
The file carries a comment saying why, and the test suite enforces it.

### 4.4 `package.json`

- `db:push` → `tsx scripts/db/schema-push-guard.ts` (guarded; dev/CI only).
- **NEW** `verify:schema-coverage` → the coverage audit in §5.
- **NEW** `test:trust1-o8-production-schema-protection`, wired **first** in `npm test` — it is the
  cheapest suite on the board and it guards the most expensive mistake.

### 4.5 `scripts/ci/setup-test-database.ts` — reconciled

Uses the shared guard. Its private denylist and its `CI_ALLOW_REMOTE_DB` escape hatch are gone. CI's
Postgres service container is on `localhost`, so it passes the guard unchanged. A second copy of a
safety check is a second thing to forget to update.

### 4.6 `shared/schema.ts` — the data-loss fix

- **`barcodeLookupEvents` declared** (see §1). Mirrors the migration's DDL **exactly** — plain
  `integer` `user_id` (the migration declares no foreign key; adding one here would make the next dev
  push try to create it) and `timestamp` **without** time zone (the migration says `TIMESTAMP`, not
  `TIMESTAMPTZ`). *A declaration that does not mirror the DDL is not protection; it is a queued
  `ALTER TABLE`.*
- Nothing reads through the new Drizzle object — `routes.ts` still uses raw SQL, and O8 deliberately
  **does not** change that, as it would be a behaviour change in an unrelated feature. The
  declaration exists to make the table **visible to drizzle-kit**, which is the entire point.
- The `TRUST1-S5` comment block, which pointed at `scripts/migrate-prod.sh`, is corrected — the
  script no longer exists.

### 4.7 `server/migrations/ensureUserDietColumns.ts` — **DELETED**

Dead code (imported by nothing) that nonetheless performed `ALTER TABLE` outside the runner. Its
three columns are already owned by `2026-02-27_add_user_diet_fields`. Verified by content, at the
moment of deletion, per the Rollback Protection Protocol §4; snapshotted outside the repo first.

### 4.8 Documentation

- **`MIGRATIONS.md`** — leads with the one rule; a table showing which mechanism is real; a loud
  warning that **adding a table to `shared/schema.ts` does not change production**; and an honest
  note that its "Current migrations" table lists 5 of the 82 that exist.
- **`migrations/README.md` — NEW.** States that the SQL files there are executed by nothing, that the
  journal lists only 1 of the 3 files present, and where the real migrations live.

### 4.9 `server/tests/test-trust1-o8-production-schema-protection.ts` — **NEW** (33 assertions)

Detailed in §6.

---

## 5. Schema-to-migration coverage — the honest gap

`npm run verify:schema-coverage` (**NEW**, `scripts/ci/verify-schema-migration-coverage.ts`) compares
the tables declared in `shared/schema.ts` against the tables any reviewed migration actually creates.
It reads two files, touches no database.

```
  Declared in shared/schema.ts .................. 88 tables
  Created by a reviewed migration .............. 42 tables
  NOT created by any reviewed migration ........ 46 tables
  Table-level coverage (UPPER BOUND) ........... 48%
```

**The reviewed migration runner cannot build THA's schema. It never could.**

Roughly half the platform — including **`users`, `meals`, `shopping_list`, `planner_entries`,
`user_preferences`, `meal_templates`, `additives`** — exists in the production database *only because
somebody once ran `drizzle-kit push`*. Those 46 tables have no migration, no review, and no
reproducible provenance. The runner's contents are overwhelmingly `ALTER TABLE`s and backfills that
**presuppose** a schema `push` created.

And the figure is an **upper bound**, because it is table-level. A table counted as "covered" may
still have columns added declaratively and never migrated — `runner.ts` contains migrations that
exist purely to repair exactly that (`2026-03-13_pantry_columns_fix`, whose comment reads *"Add
columns that were added to the Drizzle schema without a migration"*). **True coverage is worse than
48%.**

### What this does and does not mean

- **It does not break production.** Those 46 tables already exist in the production database. Removing
  `push` does not remove them.
- **It does change what happens next, and this is the single most important operational consequence
  of O8:** a **new** table or column added to `shared/schema.ts` will **no longer reach production at
  all** unless someone also writes a migration for it. Previously `migrate-prod.sh` would have pushed
  it. Now nothing will. **A feature that works perfectly in dev will 500 in production.** This is
  written into `MIGRATIONS.md` where an engineer will hit it, not only here.
- **It is why `TRUST1-O5` (tested restore) must still land.** A restore today restores a schema that
  no reviewed artefact fully describes.

### Deliberately not fixed here

Back-filling 46 baseline `CREATE TABLE` migrations to reconcile the runner with the declarative schema
is a large, risky change to the mechanism that builds every database THA has. It is **not** a
prerequisite for closing R6 — R6 is *"a merge can drop a production column"*, and that is closed. It is
its own task, it belongs behind `O5`, and it is stated here rather than quietly bundled into a task
whose brief was to remove a dangerous command. Recommended as **`TRUST1-O8B` — migration baseline
reconciliation** (§9).

---

## 6. Verification performed

### The regression suite — `npm run test:trust1-o8-production-schema-protection`

**33 assertions, 33 passed, 0 failed.** Wired first into `npm test`, so CI (`TRUST1-S10`) runs it on
every push and the `TRUST1-V3` branch protection gate blocks a merge that breaks it.

| Group | What it proves |
|---|---|
| **The detector (8)** | The grep itself still bites. It is fed **the exact lines that were really in this repo** (`npm run db:push`; `npx drizzle-kit push --force`) and must catch them — and must **not** flag a comment, a devDependency entry, or an import. *A grep-based test that silently stops matching reports perfect safety while guarding nothing; this is the check that stops that.* |
| **The merge path (4)** | `post-merge.sh` runs no push, no `psql`, no ad-hoc DDL; `.replit` contains no push anywhere; `[postMerge]` points only at the audited script |
| **The deploy path (3)** | `deploy.sh` runs no push; **`scripts/migrate-prod.sh` does not exist**; no CI workflow runs a raw push |
| **One mechanism (3)** | `drizzle-kit push` is invoked from **exactly one file, and it is the guard**; `db:push` routes through it; no npm script shells straight to drizzle-kit |
| **Ad-hoc DDL (1)** | All 9 `apply-*` scripts call `guardAdHocDdl()` before opening a pool |
| **Canonical mechanism intact (4)** | `server/index.ts` still calls `runMigrations()`; the runner still exports it, still records to `schema_migrations`, still wraps each migration in `BEGIN`/`COMMIT`. *Removing the unsafe path is only half of convergence — if the safe path quietly stopped running, O8 would have achieved nothing but a schema that never changes.* |
| **The guard refuses (9)** | Executed, not grepped. Refuses a managed host; refuses it **even with the override set**; refuses `NODE_ENV=production` even for localhost; refuses missing/unparseable/unrecognised targets; refuses a merely-truthy override. Still **allows** localhost and an explicitly-declared disposable host — or CI and every developer would be broken |
| **No table exposed to a DROP (1)** | Every table any migration creates is declared in `shared/schema.ts`. This is the `barcode_lookup_events` class of defect, closed |

### Driven end-to-end, not just unit-tested

A guard nobody executed is a comment. Against a **simulated managed-host URL** (no real database was
contacted, and **no push was run against any database**):

| Command | Result |
|---|---|
| `DATABASE_URL=<neon-like> npm run db:push` | **REFUSED**, exit 1, named the provider |
| `NODE_ENV=production DATABASE_URL=<localhost> npm run db:push` | **REFUSED**, exit 1 |
| All **9** `apply-*` / `nk6o` scripts with `DATABASE_URL=<neon-like>` | **9 refused, 0 failed to refuse** — which also proves each one's import path resolves, something the compiler would not have caught, since `scripts/` is outside `tsconfig.include` |

### Full gates

| Gate | Result |
|---|---|
| `npm run typecheck:ci` (regression gate) | **PASS** — baseline 175, current 175. *It caught two genuine new type errors in O8's own code on the first run; both were fixed, not baselined.* |
| `npm run build` | **PASS** — `dist/index.cjs`, warnings pre-existing |
| `npm test` (full suite) | **PASS** — exit 0. **62 suites green, 0 failures**, including the new O8 suite and all six pre-existing TRUST1 security suites |
| `.engineering/scripts/repo-structure-verify.sh` | **PASS** — 9/9 |

### 6.1 Full test suite

`npm test` — **exit 0. 62 suites green, 0 failures.** No suite regressed. This matters beyond the
usual reason: the suite exercises the migration runner (`test:trust1-s5-authentication-rate-limiting`
calls `runMigrations()` directly), so a green run is positive evidence that the **surviving**
mechanism still works — not merely that the removed ones are gone.

### What was deliberately NOT run

- **No deployment.** Nothing was pushed, released, or deployed.
- **No production migration.** No migration was run against any production database.
- **No live `drizzle-kit push` against any database — including the development one.** The guard's
  *allow* path is proven by unit test and will be exercised by CI against its own throwaway
  container. Running a real push here would have applied the pending declarative delta to the dev
  database, which could drop dev columns — precisely the class of event O8 exists to prevent. It
  would have been an odd way to celebrate.

---

## 7. Mandatory sections

### Definition of Done

**What success looks like**
- No production-reachable path can mutate a schema except the reviewed runner at boot. ✅
- A git merge cannot mutate any database. ✅
- `drizzle-kit push` exists in exactly one file, gated, fail-closed, no override for prod. ✅
- The unsafe commands cannot return without failing CI. ✅
- Schema-to-migration coverage measured and reported honestly, gaps included. ✅

**What must not break**
- The reviewed runner still applies migrations at boot (asserted by 4 tests). ✅
- CI can still build its test database from empty (localhost passes the guard). ✅
- Developers can still sync a local database (`npm run db:push` works against `helium`/localhost). ✅
- No application behaviour changes. ✅ — no server or client code path imports the guard; the only
  `server/` change is a Drizzle **declaration** nothing reads through yet.

**Manual test steps**
1. `npm run test:trust1-o8-production-schema-protection` → 33 passed.
2. `DATABASE_URL="postgresql://u:p@x.neon.tech/db" npm run db:push` → refuses, exit 1.
3. `NODE_ENV=production npm run db:push` → refuses, exit 1.
4. `npm run verify:schema-coverage` → prints the 88 / 42 / 46 gap.
5. `grep -r "db:push" scripts/post-merge.sh` → only in the comment forbidding it.

### Product Registry Impact

- **Registry affected:** **NO.**
- The test is *"would a person's answer to 'what is THA?' be different after this change?"* It would
  not. O8 changes no domain, page, route, journey, capability, dialog, setting, or claim. It changes
  how engineers change a database.
- Entries created / updated / retired: **NONE**.
- Entries set to `public` or `household`: **N/A**.
- Product knowledge written into a prompt, template, or fallback string: **NO** (Rule PKR27).

### Data Impact

- **Reads existing data:** NO.
- **Writes new data:** NO. Not one DDL or DML statement was executed against any database by this task.
- **Changes meaning of existing data:** NO.
- **Requires backfill:** NO.
- **Removes a means of destroying data:** **YES.** That is the deliverable.

### Trust Check

- **Could this mislead the user?** No — no user-facing surface.
- **Could it mislead an *engineer*?** That is the live risk, and it is met head-on. The temptation was
  to report "production schema is now protected" and stop. **Half of THA's schema still has no
  reviewed migration** (§5), and a new table added to `shared/schema.ts` will now silently fail to
  reach production. Both are stated in `MIGRATIONS.md`, in `migrations/README.md`, and in §5 — in the
  places an engineer will actually hit them, not only in a report.
- **Could this fabricate certainty?** The coverage figure is explicitly labelled an **upper bound**,
  because it is table-level and column-level drift is known to exist.
- **Is anything guessed but shown as real?** No. The `barcode_lookup_events` exposure is evidenced
  (migration at `runner.ts:627`; write at `routes.ts:6339`; absent from `shared/schema.ts`). What is
  **not** claimed: whether the table's data was in fact dropped in production. That would require
  reading the production database, which O8 did not do.
- **What happens if the system is wrong?** The guard fails **closed**. Every failure mode — bad URL,
  unknown host, unset variable, parse error — refuses. A false refusal costs an engineer one
  environment variable. A false allow costs the users their data.
- **No architectural duplication introduced:** YES (one was removed).
- **No new source of truth created:** YES (one was removed).
- **No runtime behaviour altered:** YES.

### Rollback Plan

- **Rollback identifier:** `rollback/TRUST1-O8-production-schema-protection-20260711` → `4fd5a2969e8ecbf06b5cadeab145fb2ca89bce7c`
- **What the tag does NOT cover:** the working tree was **dirty at tag time** with another
  workstream's uncommitted work (`PDA1` — `docs/product/`, `docs/investigations/ux/PDA1_*`,
  `scripts/build-product-inventory.ts`, `scripts/build-registry-nav.ts`,
  `scripts/capture-product-screenshots.ts`, `scripts/verify-product-inventory.ts`,
  `data/cookbook/`, `data/development_world/`, `.engineering/session/*`, and an
  `exposeLocalhost` line in `.replit`). **None of it was authored, staged, or committed by O8**, and
  the tag does not restore it. The `.replit` hunk was staged selectively so PDA1's line stayed
  uncommitted.

**Files modified**

| Change | File |
|---|---|
| NEW | `scripts/db/schema-push-guard.ts` |
| NEW | `scripts/ci/verify-schema-migration-coverage.ts` |
| NEW | `server/tests/test-trust1-o8-production-schema-protection.ts` |
| NEW | `migrations/README.md` |
| NEW | this document |
| **DELETED** | `scripts/migrate-prod.sh` |
| **DELETED** | `server/migrations/ensureUserDietColumns.ts` |
| Modified | `scripts/post-merge.sh`, `package.json`, `scripts/ci/setup-test-database.ts`, `shared/schema.ts`, `MIGRATIONS.md` |
| Modified (guard call) | `scripts/apply-canonical-tables.ts`, `scripts/apply-companion-action-tables.ts`, `scripts/apply-companion-goal-columns.ts`, `scripts/apply-companion-guidance-tables.ts`, `scripts/apply-knowledge-review-phase2-tables.ts`, `scripts/apply-knowledge-review-phase3-columns.ts`, `scripts/apply-knowledge-review-phase4-tables.ts`, `scripts/apply-recipe-acquisition-columns.ts`, `scripts/nk6o-add-family-column.ts` |

**Rollback commands**
```bash
git show --stat rollback/TRUST1-O8-production-schema-protection-20260711   # inspect first
git revert <milestone commit SHA>                                          # preferred — history preserved
# or, to return committed state to the tag:
git checkout rollback/TRUST1-O8-production-schema-protection-20260711
```

**Verification after rollback**
1. `scripts/migrate-prod.sh` and `server/migrations/ensureUserDietColumns.ts` exist again.
2. `npm run test:trust1-o8-production-schema-protection` fails (the suite is gone — expected).
3. `npm test` passes on the restored tree.
4. **Understand what you have restored:** the merge hook that pushes a schema, and
   `drizzle-kit push --force` pointed at the production database. **Rolling this back re-opens R6.**
   No database change needs undoing — O8 executed none — so there is no data-side rollback to perform.

### Architecture Convergence Status

| Field | Value |
|-------|-------|
| Domain | Database schema (production DDL) |
| Current Canonical Owner | `server/migrations/runner.ts` — the reviewed, ordered, transactional migration list |
| Current Runtime Consumer(s) | `server/index.ts` → `runMigrations()` at boot (the only production consumer) · `scripts/ci/setup-test-database.ts` (CI only, guarded) |
| Duplicate Owners Remaining | **0 at production.** `drizzle-kit push` survives for CI/dev only, behind a fail-closed guard that cannot reach a managed host |
| Duplicate State Remaining | **Yes, and it is the residual (§5):** `shared/schema.ts` still describes 46 tables the reviewed migrations do not create. Two *descriptions* of one schema, of which only one is reviewed |
| Duplicate Workflows Remaining | 0 — one route to a production schema change |
| Current Convergence (%) | **Mechanism convergence: 100%** (one owner of the production schema, enforced by test). **Coverage convergence: 48%, upper bound** — `TRUST1-O8B` |

---

## 8. Is production deployment safe to resume?

**Safer than it was, and not yet safe. Do not read this task as a green light.**

**What O8 genuinely closed (R6):**
- ✅ A git merge can no longer mutate any database.
- ✅ `drizzle-kit push --force` can no longer reach production. The script that did it is gone.
- ✅ Ad-hoc DDL scripts cannot reach production.
- ✅ A table created by a migration can no longer be silently dropped by a push (`barcode_lookup_events`).
- ✅ None of it can return without failing CI.

**What remains open, and why deployment is still gated:**

| # | Blocker | Owner |
|---|---|---|
| 1 | **`TRUST1-O5` — no tested restore.** THA has still never restored its database. O8 removed the mechanism most likely to require one, which *lowers* the probability of needing a restore but does not create the capability. `TRUST1` sequences `O5` **before** `O8` for this reason; O8 was implemented first by explicit instruction, and the gate is unchanged | `O5` |
| 2 | **46 tables have no reviewed migration (§5).** The runner cannot rebuild the schema. **A new table added to `shared/schema.ts` will no longer reach production at all** — it will work in dev and 500 in prod | `O8B` (proposed) |
| 3 | **A pending declarative delta exists.** `TRUST1_SOFT_LAUNCH_PRODUCTION_DEPLOYMENT.md` records "a 910-line schema delta queued behind" O8. O8 did **not** apply it, did not measure it against the live production database, and **must not be believed to have resolved it.** It now has only one legal route to production: reviewed migrations. **Someone must write them** | `O8B` / release |
| 4 | The rest of `TRUST1` Phase 1 (`O1`, `V1`, `S11`, `O4`, `O2`) | `TRUST1` |

**The honest summary:** before O8, a *merge* could destroy production data and no reviewed process
stood between a schema change and the live database. That is fixed, and it was the largest single
data-loss risk on the board. What is *not* fixed is that THA still cannot rebuild or restore its
database from reviewed artefacts. **Deployment of application code is materially safer. Deployment of
a schema change is now blocked by construction until someone writes the migration — which is the
point.**

---

## 9. Recommended next

1. **`TRUST1-O5` — tested restore.** Unchanged in priority; O8 does not substitute for it.
2. **`TRUST1-O8B` — migration baseline reconciliation** *(new, proposed by this task)*. Bring the
   reviewed runner up to the declarative schema so the 46 uncovered tables have reviewed provenance
   and the database can be rebuilt from the repository. Then `npm run verify:schema-coverage --strict`
   becomes a CI gate (the `--strict` flag exists and fails on any uncovered table; it is **not** wired
   into CI today, because it would fail immediately — wiring a gate that is known-red is how gates get
   disabled). Sequence **behind `O5`**, for exactly the reason `TRUST1` sequenced `O8` behind it.
3. **Resolve the 910-line declarative delta (§8, #3)** into reviewed migrations before the next
   production schema change.
4. **`TRUST1-V2`** — make `scripts/verify-prod.ts`'s `schema_migrations` head assertion a deployment
   gate. The control already works; it simply is not a gate. Note its `expectedHead` constant is
   currently stale (`2026-06-18_ws0_knowledge_registry`, against 82 migrations in the runner).
