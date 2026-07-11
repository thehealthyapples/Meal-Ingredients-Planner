# REL3 — Production Verification Convergence

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Workstream:** `platform`
**Risk:** 🟢 GREEN
**Reason:** Read-only verification tooling and its tests. No schema, no runtime behaviour, no user-facing surface, no production contact. The one production-path file touched (`server/migrations/runner.ts`) gains two accessors and applies exactly the same migrations, in the same order, as before.

---

## OUTCOME, STATED FIRST

**The production verifier was lying, and the direction it lied in was the dangerous one.**

`scripts/verify-prod.ts` carried its own copy of the expected migration head as a hand-written
string literal:

```ts
const expectedHead = "2026-06-18_ws0_knowledge_registry";
```

That literal was **20 migrations stale** (the true head is `2026-07-11_cbk1_cookbook_canonical_identity`;
there are 83 reviewed migrations). Two consequences, and the second is the one that matters:

1. Against a **correctly migrated** production database it printed **FAIL**. The one check that
   could catch a real schema gap had been crying wolf for weeks, and the rational response of a
   release operator was to ignore it.
2. Against a database **stuck 20 migrations back** it printed **PASS — "Schema at head"** — while
   `auth_rate_limits` (TRUST1-S5's shared rate-limit counter) and `meals_tha_original_source_key_uniq`
   (CBK1's canonical cookbook identity) were both absent. **A false PASS on a real production gap.**

The fix is not a fresher literal. It is **no literal**: the expected state is now derived from
`server/migrations/runner.ts`, the canonical migration runner. The verifier cannot go stale again,
because there is nothing left in it to keep up to date.

**REL3 is complete.** The verifier is trustworthy, current, tested, and reachable
(`npm run verify:prod` — a command that did not previously exist). It found two real divergences on
the development database the moment it was first run, both recorded below.

**No production was contacted. No deployment was performed. No migration was run against any
database.**

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback tag** | `rollback/REL3-production-verification-convergence-20260711` → `b279a9e7` |
| Working tree at tag time | **Intentionally dirty** — the pre-existing `PDA1` / `PKR` / `.replit` entries recorded by `TRUST1_SOFT_LAUNCH_PRODUCTION_DEPLOYMENT.md` Blocker 1. Not mine; **not one byte touched, staged, or committed** (`COMMIT_PUSH_DEPLOY_PROTOCOL.md` §1) |
| What the tag protects | Committed state only. Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3 it protects **none** of the dirty tree above |
| This task's writes | `server/migrations/runner.ts` (2 accessors), `scripts/verify-prod.ts` (rewritten), `server/tests/test-rel3-production-verification.ts` (new), `package.json` (2 scripts), this document |
| Rollback to committed state | `git checkout rollback/REL3-production-verification-convergence-20260711` |
| Data to unwind | **None.** Every REL3 artefact is read-only. One throwaway database (`rel3_smoke`) was created on the local disposable Postgres to prove the FAIL path, and dropped — verified gone |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (STEP 5 mandatory sections, compliance blocks)
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`
- [x] `.engineering/protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md` (§3 — why nothing here goes near production)
- [x] `RELEASE.md` (Steps 0–5; where the verifier sits in the release checklist)
- [x] `docs/implementation/platform/TRUST1_SOFT_LAUNCH_PRODUCTION_DEPLOYMENT.md` (the open blockers this must not pretend to close)
- [x] `server/migrations/runner.ts`, `scripts/ci/verify-cookbook-seed.ts`, `scripts/ci/verify-schema-migration-coverage.ts`, `scripts/db/database-target.ts`, `scripts/db/schema-push-guard.ts`

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity          No entity created, altered, or keyed.
☑ One owner per fact              THE WHOLE POINT. "Which migrations exist" had two owners: the
                                  runner's list, and a string literal in verify-prod.ts. They
                                  disagreed by 20 migrations. Now there is one, and the runner
                                  consumes its own accessor for its boot-time parity log, so the
                                  runner and the verifier cannot disagree even in principle.
☑ No duplicate entities           None created.
☑ No duplicate ownership          The cookbook check DELEGATES to verifyCookbookSeed() (CBK1) —
                                  its rules are called, never restated. Database classification
                                  delegates to classifyDatabaseTarget() (TRUST1-O8/CBK1) rather
                                  than re-listing managed hosts.
☑ No duplicate state              None. The verifier writes nothing, anywhere.
☑ Extends existing architecture   Uses the existing runner, the existing cookbook verifier, the
                                  existing target classifier, and the existing test conventions.
☑ Knowledge domain compliance     No knowledge domain introduced or altered.
☑ Honest gaps over fabrication    Enforced in code AND asserted by a test: the TRUST1 controls a
                                  database CANNOT witness (S1, S2, S3/S3A, S8/P8) are named as
                                  unwitnessable rather than implied green. An empty database is
                                  reported as UNVERIFIED, never as satisfied.
☑ No permanent sync bridge        None.
☑ Evolution over replacement      The migration list did not move. TRUST1-O8 and CBK1 both grep
                                  runner.ts's source for CREATE TABLE and migration ids; relocating
                                  the array would have silently broken two other milestones' gates.
                                  Accessors were added beside it instead.
```

**Not user-facing.** No client file, route, surface, or copy touched. The Experience & UI Governance
blocks do not apply.

---

## DOMAIN IMPACT

| Domain | Impact |
|---|---|
| Food / Nutrition / Recipes / Household Knowledge | **None.** No knowledge read, written, or graduated. |
| Product Knowledge | **None** — see Product Registry Impact. |
| Intelligence Platform | **None.** No capability, intent, prompt, or context view touched. |
| Data / Schema | **None.** No migration added; no table, column, or index created, altered, or dropped. |

---

## IMPLEMENTATION

### 1. The migration head is derived, not declared (`server/migrations/runner.ts`)

Two accessors, added beside the existing `MIGRATIONS` array:

```ts
export const MIGRATION_IDS: ReadonlyArray<string> = MIGRATIONS.map(m => m.id);

export function expectedMigrationHead(): string {
  const head = MIGRATIONS[MIGRATIONS.length - 1]?.id;
  if (!head) throw new Error("[Migrations] The migration list is empty — there is no expected head.");
  return head;
}
```

`runMigrations()` now consumes `expectedMigrationHead()` for its own boot-time parity log, where it
previously recomputed the head inline. That is deliberate: it means the runner and the verifier read
the head through **the same expression**, so they cannot drift apart.

**This creates no second migration owner.** `MIGRATIONS` did not move. Nothing outside `runMigrations()`
applies, records, orders, or mutates a migration. The accessors are read-only questions asked of the
one list.

**Why the list stayed in `runner.ts`.** The obvious refactor — extract the array into a pure module so
a verifier can import it without dragging in `server/db.ts` — is wrong here, and would have broken
three gates silently:

| Gate | What it does to `runner.ts` |
|---|---|
| `scripts/ci/verify-schema-migration-coverage.ts` | regexes `CREATE TABLE` out of the **file's source** |
| `server/tests/test-trust1-o8-...ts` | regexes `CREATE TABLE` out of the **file's source** |
| `server/tests/test-cbk1-cookbook-seed.ts` | asserts the CBK1 index name and migration id appear in the **file's source** |

Moving the array would have left all three reading an empty file and reporting 0% coverage as a pass.
The architecture principle *evolution over replacement* had a concrete, checkable cost here.

### 2. The verifier (`scripts/verify-prod.ts`) — rewritten

Restructured on the `verify-cookbook-seed.ts` pattern: an exported `verifyProduction(pool)` that a
test can drive, plus a thin CLI. **Read-only** — SELECTs only, asserted by a test.

**Migration state is now a set comparison, not a single-row equality.** The old check asked *"is the
newest `applied_at` row equal to my literal?"*. A database missing a migration in the **middle** of
the list passes that check trivially. `compareMigrationState()` is a pure function that answers the
question that actually matters — *is anything missing, anywhere* — in both directions:

| Divergence | Meaning | Verdict |
|---|---|---|
| **pending** — in the code, not in the database | The tables, columns and indexes that migration creates **are not there**. Features are broken for households right now. | **FAIL** |
| **unknown** — in the database, not in the code | Nothing this code needs is missing, but the database ran a build this commit does not contain. | **WARN**, loudly |

The severity split is load-bearing, not a softening. Missing schema breaks features; extra recorded
history does not. Failing the release over an irreversible historical fact nobody can safely undo
would produce a gate that blocks every release forever — and a gate that always blocks is a gate that
gets bypassed, at which point it protects nothing. That is the same "cries wolf" failure the stale
literal had already caused once.

**Added checks:**

- **Cookbook seed (CBK1)** — delegated wholesale to `verifyCookbookSeed(pool)`. Its eight checks are
  *called*, not restated: there is one owner of "is the cookbook seeded?". REL1 Blocker 1 was a
  production database serving an **empty cookbook** while `verify-prod` said PASS, because
  `verify-prod` never asked. It asks now.
- **TRUST1-S5** — `auth_rate_limits` exists with its required columns. THA runs multiple instances,
  so the rate-limit counter lives in Postgres. **No table ⇒ no shared counter ⇒ login rate limits
  are not enforced**, however green the S5 suite is in CI.
- **CBK1 canonical identity** — the `meals_tha_original_source_key_uniq` index exists. Without it a
  duplicate founding recipe is a silent, permanent, globally-visible defect (system meals are shown
  to every household).

**Per-check error isolation.** Every check runs inside a guard: a thrown error becomes *that check's*
FAIL, not the script's. Previously one missing table aborted the run with `Verify script fatal error`
and reported **nothing** about the other twelve checks — the state you are most likely to be in when
you actually need this script is the state it refused to describe.

> **This bug was still present in my own rewrite, and the end-to-end negative test is what found it.**
> The `users` count query sat outside the guard, so an empty database killed the run with
> `relation "users" does not exist` and printed not one of the 23 other results. It is fixed, and it
> is recorded here rather than quietly corrected, because it is the same defect in the same file for
> the same reason: I reasoned the checks were guarded instead of watching them fail.

**Empty databases are reported as unverified, not as passing.** A database with no non-demo users has
nothing for the household-data invariants to be true *or* false about. The old script called that
`FAIL — "No planner_weeks rows found"`, which is a false alarm on a brand-new production database.
It now reports plainly: *"It is NOT a pass — they are unverified, not satisfied."*

**The honest gap, stated in the file and asserted by a test.** Most TRUST1 controls are **not
observable from a database connection** and are **not claimed**: S1 (SESSION_SECRET fails closed), S2
(secure production cookies), S3/S3A (route guards, IDOR), S8/P8 (log redaction) are environment and
HTTP-layer facts, enforced by their own suites and by a human in the Render dashboard. A PASS here
says nothing about them. What a database *can* witness — the schema those controls need to work at
all — it now witnesses.

### 3. Regression tests (`server/tests/test-rel3-production-verification.ts`, 39 assertions)

A verification script is a strange thing to test, because nobody notices when it is wrong: it fails
silently, in the safest-looking direction. So the central tests are not that it passes — they are
that **it fails when it should**.

- **The stale-production scenario, replayed.** A database holding exactly the migrations up to
  `2026-06-18_ws0_knowledge_registry` — the precise database the old script called *"Schema at head:
  PASS"* — must now come back **not at head**, with TRUST1-S5's and CBK1's migrations **named** as
  pending. This is the historical defect, made permanently checkable.
- **The hole in the middle.** A database that holds the head but is missing a migration from the
  middle of the list fails. The old newest-row comparison passed that database.
- Empty database, database ahead of the code, no-duplicate ids, head-is-last-entry.
- **Structural:** no head literal survives in verify-prod's executable code; it imports the accessors
  from the canonical runner; it declares no migration list of its own; it contains no `CREATE`/`ALTER`/
  `DROP`/`INSERT INTO schema_migrations` (read-only); it delegates to the cookbook owner rather than
  restating it; and it states which TRUST1 controls it cannot witness.
- **Live honesty invariants.** These do not assume the database is healthy — they assert the
  verifier's **verdict matches the database's actual state**, whatever that state is. If the two ever
  disagree, the verifier is lying, in either direction, and the test fails. A verifier that cannot be
  caught lying is the only kind worth running.

### 4. `npm run verify:prod` now exists

It did not. `scripts/verify-prod.ts` was reachable only by typing `npx tsx scripts/verify-prod.ts`
from memory, which is part of why it was allowed to rot unnoticed. `npm run verify:prod` and
`npm run test:rel3-production-verification` are both registered, and the latter is wired into the
`npm test` chain, so CI runs it on every push.

### 5. `RELEASE.md` Step 5 now invokes it

The release checklist verified *live paths by hand* and never ran the database verifier at all — the
old Step 5 was six rows of "click this, check no 500 error". A verifier the checklist never invokes
is a verifier nobody notices has rotted, which is the mechanism by which this one rotted for weeks.

Step 5 is now the mechanical database gate (`npm run verify:prod`, read-only, safe against prod), and
the manual click-through is Step 5b. Step 5 also states plainly, in the checklist itself, **what the
verifier cannot tell you** — that `SESSION_SECRET` fails closed and must be checked in the Render
dashboard, and that a PASS here says nothing about cookies, route guards, or log redaction.

---

## VERIFICATION RESULTS

Everything below was **observed**, not reasoned.

| Check | Result |
|---|---|
| `npm run typecheck:ci` | ✅ **PASS** — baseline 175 errors, current 175. No new type errors. |
| `npm run test:rel3-production-verification` | ✅ **39 passed, 0 failed** |
| `npm run test:trust1-o8-production-schema-protection` | ✅ **33 passed, 0 failed** (unaffected by the runner change) |
| `npm run test:cbk1-cookbook-seed` | ✅ **37 passed, 0 failed** (unaffected by the runner change) |
| `npm run verify:schema-coverage` | ✅ runs; still reads `runner.ts` and reports the same 89 declared tables |
| `npm test` (full chain, 65 suites) | ✅ **PASS — exit 0**, zero failing assertions. See the flake note below |
| `npm run verify:prod` — dev database | ✅ ran read-only; **22 passed, 2 warned, 0 failed** |
| `npm run verify:prod` — **empty** database | ✅ **16 FAILs, exit 1**, each naming the migration that has not applied. No fatal error, no silent pass |

### A flake observed in `test:trust1-s5`, and why it is not REL3

The **first** full-suite run stopped at `test:trust1-s5-authentication-rate-limiting` with one failing
assertion — *"the per-IP 429 and the per-ACCOUNT 429 on /api/login are BYTE-FOR-BYTE identical"*. It
is recorded here rather than re-run until green and forgotten, because "the test was flaky" is the
most over-used excuse in engineering and it is owed evidence.

| Run | Result |
|---|---|
| `test:trust1-s5` in isolation | ✅ 68 passed, 0 failed |
| Chain replayed in the **pre-REL3** order (REL3 suite omitted) | ✅ 68 passed, 0 failed |
| Chain replayed in the **post-REL3** order (REL3 suite included) | ✅ 68 passed, 0 failed |
| Full `npm test`, re-run | ✅ **exit 0**, 65 suites, zero failing assertions |

It did not reproduce in four subsequent runs, including both chain orders. REL3 touches **neither**
`test-trust1-s5-authentication-rate-limiting.ts` **nor** `server/lib/auth-rate-limit.ts` — both are
byte-identical to the rollback tag (verified with `git show … | diff`). The assertion spawns two
server instances and races a rate-limit window, so it is timing-sensitive under full-suite load.

**It is a pre-existing flake in another workstream's suite, it is not REL3's, and it is not fixed
here** — a flaky security test is a real problem, and it belongs to whoever owns S5, not to a
tooling change that happened to observe it.

### The FAIL path, proven end-to-end

The pure tests prove the comparison logic. They do not prove the *script* fails. So a throwaway
database (`rel3_smoke`) was created on the local **disposable** Postgres, pointed at, and dropped
(confirmed gone). Against it the verifier produced 16 FAILs — `No schema_migrations table — the
canonical migration runner has NEVER run against this database`, plus every missing table named with
the migration that would create it — and exited 1.

That is the fresh-production-database case, and it is the case the old script died on with a stack
trace.

### Two real divergences found on first run (development database)

Both are genuine, neither was known, and neither is fixed by this task — a verifier's job is to
report, and fixing another workstream's migration history under cover of a tooling change is exactly
the sort of thing this programme exists to stop.

1. 🟠 **The append-only migration list is not append-only.** Two migrations are recorded as applied
   in `schema_migrations` but **no longer exist in the code**:
   - `2026-07-03_platform_turn_outcomes` — the design it created was retired by OBS1 (`EWO-PRO1`);
     the `2026-07-08_platform_observations` entry says so in its own comment.
   - `2026-07-04_pkc3_retire_live_yogurt_duplicate` — superseded by `2026-07-09_know1_retire_live_yogurt_duplicate`.

   `runner.ts`'s own header states: *"IMPORTANT: Never remove or reorder entries. Only append new
   ones at the end."* Two entries were removed **after they had been applied**. Nothing detected it
   until now, because nothing was looking. Reported as **WARN — Schema migration provenance**.

2. ⚠️ **319 shopping-list items are still in the `raw` resolution state** on the development
   database (`RELEASE.md` Step 4 backfill). Pre-existing; reported as WARN, as before.

**Whether production carries the same two orphaned migration rows is UNKNOWN and cannot be
determined from here** — it depends on whether production ever ran the builds that contained them.
It is a question for whoever next runs `verify:prod` against production, and the verifier will now
answer it.

---

## DEFINITION OF DONE

| # | Requirement | Status |
|---|---|---|
| 1 | Hard-coded migration head removed from `scripts/verify-prod.ts` | ✅ Gone. Asserted absent from the executable code by test. |
| 2 | Expected head derived from the canonical migration runner | ✅ `expectedMigrationHead()` / `MIGRATION_IDS`, imported from `server/migrations/runner.ts`. |
| 3 | No second migration owner created | ✅ `MIGRATIONS` did not move. The runner consumes the same accessor. Asserted by test (`verify-prod.ts` declares no list, writes no schema, records no migration). |
| 4 | Cookbook seed verified | ✅ Delegated to `verifyCookbookSeed()` — CBK1's rules called, not restated. |
| 5 | Current TRUST1 controls verified where appropriate | ✅ S5 (`auth_rate_limits`) and CBK1 (canonical-identity index) — the ones a database can witness. S1/S2/S3/S3A/S8/P8 are named as **unwitnessable from here**, not implied green. |
| 6 | Verification fails honestly on real production gaps | ✅ Proven three ways: pure tests (stale / empty / hole / ahead), live honesty invariants (verdict must match reality), and an end-to-end run against an empty database (16 FAILs, exit 1). |
| 7 | Regression tests added | ✅ 39 assertions, wired into `npm test`, so CI runs them on every push. |
| 8 | Do not deploy or contact production | ✅ **Nothing was pushed, deployed, or run against production.** Read-only, local, disposable databases only. |

**REL3 is complete.**

---

## PRODUCT REGISTRY IMPACT

**Registry affected: NO.**

Nothing shipped to a household. `scripts/verify-prod.ts` is engineering tooling: no route, no
surface, no dialog, no copy, no capability, no setting a household can reach or perceive. No entry in
`docs/product/` is created, updated, or retired (`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`
Rule KC15).

---

## DATA IMPACT

**No production data touched. No production database contacted.**

| Item | Value |
|---|---|
| Schema changes | **None.** No migration added; no table, column, or index created, altered, or dropped |
| Writes to any database | **None.** Every REL3 code path is a SELECT — asserted by a test that forbids `CREATE` / `ALTER` / `DROP` / `INSERT INTO schema_migrations` in `verify-prod.ts` |
| Databases contacted | The local **disposable** development Postgres (read-only), and one throwaway database created and dropped to prove the FAIL path |
| Migration behaviour | **Unchanged.** `runMigrations()` applies the same 83 migrations, in the same order, with the same transactions. Only the source of its parity-log head changed, to an accessor over the same array |

---

## TRUST CHECK

- **Nothing is claimed that was not observed.** Every result in Verification Results was run and its
  output read. The two divergences on the development database are reported because the verifier
  found them, not because they were expected.
- **Nothing is implied green.** The TRUST1 controls a database cannot witness are named as such, in
  the file and in a test that fails if that statement disappears. An empty database is reported as
  *unverified*, never *satisfied*.
- **A bug I introduced is reported, not buried.** The `users` query outside the guard would have
  reproduced the exact "fatal error, tells you nothing" defect REL3 exists to remove. It is written
  up in Implementation §2 in the words it deserves.
- **REL3 closes no TRUST1 blocker and does not pretend to.** `TRUST1-O8` (the `db:push` production
  path) is **open**. Branch protection is **not applied**. The gate has **still never run on GitHub**.
  Production `SESSION_SECRET` is **still unverified**. A better verifier does not deploy anything, and
  the release remains blocked for exactly the reasons `TRUST1_SOFT_LAUNCH_PRODUCTION_DEPLOYMENT.md`
  gives.
- **The verifier is now falsifiable.** Its live tests assert its verdict *matches the database*,
  whichever way that goes. Before REL3 there was no way to catch it lying, and it had been lying for
  weeks.

---

## ROLLBACK PLAN

| Item | Value |
|---|---|
| Rollback tag | `rollback/REL3-production-verification-convergence-20260711` → `b279a9e7` |
| Rollback command | `git revert <REL3 commit>` — or `git checkout rollback/REL3-production-verification-convergence-20260711` for the pre-REL3 tree |
| Data to unwind | **None.** No database was written by this task |
| Blast radius of a revert | The verifier returns to its stale hard-coded head. No runtime behaviour changes: `runMigrations()` applies the same migrations either way |
| Risk of the change itself | **Low.** The only production-path file touched is `runner.ts`, and it gains two pure accessors over an array it already owned |

---

## MANUAL ACTIONS REMAINING

**None are required to call REL3 complete.** These are what REL3 *revealed* or is *blocked behind*,
and each belongs to a named owner.

| # | Action | Owner | Why |
|---|---|---|---|
| 1 | **Reconcile the two orphaned migration rows** — decide whether `2026-07-03_platform_turn_outcomes` and `2026-07-04_pkc3_retire_live_yogurt_duplicate` should be re-added to the list as retired no-ops, or their rows deleted | Engineering | REL3's own finding. The append-only list is not append-only, and nothing was watching |
| 2 | **Run `npm run verify:prod` against production** — the first honest reading production has ever had | **Colin Clapson** (or a named human with the Neon URL) | It is read-only and safe. Nobody can do it from here: `COMMIT_PUSH_DEPLOY_PROTOCOL.md` §3 |
| 3 | **`TRUST1-O8`** — close the `db:push` production path | Engineering | **Still open.** Still the largest data-loss risk in the platform. REL3 changes nothing about it |
| 4 | **Apply branch protection**; let CI run on GitHub once | **Colin Clapson** | `TRUST1-V3`'s outstanding action. The REL3 suite is in `npm test`, so it runs in CI — but CI still stops nothing |
| 5 | **Fix the flaky assertion in `test:trust1-s5`** (the byte-for-byte 429 parity check) | Owner of TRUST1-S5 | Observed failing once under full-suite load, then passing in four runs. A security test that fails randomly gets re-run until green, which is how a real regression eventually gets waved through |

---

## SCOPE LOCK

**Implemented — exactly the mission, and nothing else**
- Removed the hard-coded migration head from `scripts/verify-prod.ts`.
- Derived the expected head from the canonical migration runner; created no second owner.
- Added Cookbook-seed verification (delegated to CBK1's verifier) and the TRUST1 controls a database
  can witness (S5, CBK1 identity).
- Made verification fail honestly: set-based migration comparison, per-check error isolation, empty
  databases reported as unverified rather than passing, unwitnessable controls named as such.
- Added 39 regression assertions; wired them into `npm test`. Registered `npm run verify:prod`.
- Wired the verifier into `RELEASE.md` Step 5 as the mechanical database gate, with an explicit
  statement of what it cannot witness. (Not named in the mission, but a verifier the release
  checklist never invokes is one nobody notices has rotted — which is how this one rotted.)

**Explicitly NOT done**
- ⛔ **No deployment. No push. No production contact.** Render was not reached; no production
  configuration or secret was read or written; no migration was run against any database.
- ⛔ **No migration added, removed, or reordered.** The two orphaned rows REL3 found are **reported,
  not fixed** — repairing another workstream's migration history inside a tooling change is precisely
  the class of quiet, unreviewed schema act TRUST1-O8 exists to prevent.
- ⛔ **The pre-existing dirty working tree was not touched** — no `PDA1` / `PKR` / `.replit` file was
  read into scope, staged, or committed.
- ⛔ **No TRUST1 blocker closed.** REL3 makes verification trustworthy; it does not make the release
  shippable.

**SUGGESTION (out of scope — do not implement without approval):**
`verify-prod.ts` still verifies a hand-maintained list of release-critical tables and columns
(`pantry_ingredient_knowledge`, `shopping_list`, `planner_entries`, `meals`, …). That list is the
same *class* of artefact as the migration head it just replaced: a second, hand-updated description
of the schema that will go stale exactly as silently. `verify-schema-migration-coverage.ts` already
derives the declared-vs-migrated table sets from `shared/schema.ts` and `runner.ts` mechanically.
Pointing the structural half of `verify-prod` at that derivation — verifying the **live database**
against the **declared schema**, rather than against a curated list — would remove the last
hand-written schema expectation in the release path. It is a real convergence and it is not this
task.

---

*REL3. The gate that had been saying PASS while production was twenty migrations behind now says what
is true — and the first thing it did, on the first database it was ever pointed at honestly, was find
two migrations nobody knew were missing from the list.*
