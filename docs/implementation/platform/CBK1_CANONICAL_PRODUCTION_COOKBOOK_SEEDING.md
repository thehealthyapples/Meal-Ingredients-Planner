# CBK1 — Canonical Production Cookbook Seeding

**Status:** Implemented — committed locally, not pushed, not deployed
**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Closes:** REL1 Blocker 1 — *The founding cookbook has no production seeding path*

---

## ROLLBACK PROTECTION

| Field | Value |
|---|---|
| Rollback identifier | `rollback/pre-CBK1` |
| Commit at tag | `9b42637c9f2cc269bce4fe527a417219fad25f82` |
| Created | Before any file was modified |
| Working tree at start | Dirty with **pre-existing, unrelated** untracked work (PDA1 investigations, `docs/product/`, four `scripts/*.ts`, `M .replit`). None authored by CBK1; none touched by it. |

---

## REFERENCE DOCUMENTS READ

- `docs/architecture/README.md` (Architecture Bootstrap — mandatory entry point)
- `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- `docs/architecture/ENGINEERING_WORKFLOW.md`
- `docs/architecture/REPOSITORY_CONVENTIONS.md`
- `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md`
- `docs/architecture/capabilities/meals.md`
- `RELEASE.md`, `docs/implementation/platform/REL1_RELEASE_PACKAGING.md`

---

## THE PROBLEM

REL1 committed the 500 founding recipes so that a clean checkout could reproduce the platform. It
then reported what committing them did *not* fix:

> The 500 THA-authored recipes reach production only as rows in the `meals` table. The only
> importer refuses to run when `NODE_ENV=production`. So the source data is now reproducible from
> the repository, but there is **no sanctioned mechanism that puts those 500 recipes into a
> production database.** A fresh production DB would serve an empty THA library.

Two governing statements were therefore in direct contradiction, and had been for as long as both
existed:

| Statement | Source |
|---|---|
| "The 500 founding recipes **reach production as rows in the `meals` table**" | `RELEASE.md` (canonical definition of the release package) |
| "This importer is **dev-only and must never write to production**" | `scripts/import-tha-founding-cookbook-500.ts` |

The release process asserted an outcome that the only mechanism capable of producing it explicitly
forbade. Nothing reconciled the two, so nothing failed — the Cookbook would simply have been empty
in production, and no gate would have said so.

---

## THE CANONICAL MECHANISM

**`npm run seed:cookbook` — the existing importer, extended into the one governed seeder, run as a
documented release step (RELEASE.md Step 4a) and proved by a read-only gate
(`npm run verify:cookbook-seed`).**

No second pipeline was created. No recipe content was duplicated. No new store, no new key space,
no new ownership.

### Why not the alternatives

| Considered | Rejected because |
|---|---|
| **Boot-time seed** (like `seedReadyMeals`) | It would make `data/cookbook/` a **runtime** asset. RELEASE.md states `data/` is a seed-source tree that *"no production code path may read"*, and Check 4 of the packaging gate mechanically fails any server runtime file that reaches into it. It would also mean shipping the 3.7 MB corpus in `dist/`. This is the option that *looks* most convenient and is forbidden by a document written the day before. |
| **A seeding migration** (500 recipes as SQL in `runner.ts`) | A second copy of the cookbook content, in a second format, immediately diverging from the JSON source of truth. Recipe content would become unmaintainable without a new migration per edit. Explicitly forbidden: *no duplicate cookbook data*. |
| **A new prod-only seed script** | A second cookbook import pipeline. Fails the Architecture Compliance item *"Extends existing architecture — builds on existing patterns, not beside them."* |
| **Extending the existing importer** ✅ | One mechanism, one key space, one write funnel. The smallest change that makes production seeding possible, and the only one that keeps it singular. |

The chosen shape is not novel — it is the shape RELEASE.md **already uses** for production data
(Step 4, `backfill-item-resolution.ts`): idempotent, manual, dry-run first, explicitly listed under
*what does NOT auto-run*. CBK1 adds a second citizen to an established pattern rather than inventing
a third one.

---

## IMPLEMENTATION

### 1. The importer became the canonical seeder — `scripts/import-tha-founding-cookbook-500.ts`

The guard was not deleted. It was made to **say who may pass**.

| Behaviour | Before | After |
|---|---|---|
| Development / CI database | Seeds | Seeds (**unchanged**) |
| `NODE_ENV=production` | Refuses | Refuses — **unless** `--production` is typed |
| **Managed DB host, `NODE_ENV` unset** | **Seeds silently** ⚠️ | **Refuses** — unless `--production` is typed |
| `--rollback` against production | Refuses | **Refuses always. No override, ever.** |
| Preview a run | *(not possible)* | `--dry-run` — reports exactly what would change, writes nothing |

**The third row is a defect this task found, not merely a feature it added.** The old guard keyed on
`NODE_ENV` alone. But the shape of a real release command — and the shape RELEASE.md Step 4 itself
prescribes — is `DATABASE_URL="<prod neon url>" npx tsx scripts/...`, with `NODE_ENV` unset. Under
the old guard, that command would have written production and reported success. The guard that was
described as protecting production did not protect production against the one command anybody would
actually type.

Target classification now asks the same question the schema-push guard asks (TRUST1-O8), through the
same module, so *"is this host production?"* has exactly one answer in the repository.

### 2. Categories are resolved by name — the silent-corruption fix

The importer hard-coded `{ breakfast: 1, lunch: 2, dinner: 3, snack: 4 }`. Those ids are true of the
development database **only by the accident of insertion order**. `meal_categories.id` is a serial;
on a fresh production database the ids are whatever the sequence produced.

This is exactly the scenario CBK1 exists to serve, and the failure mode is the worst kind: not an
error, but 500 recipes filed under the wrong category — breakfasts appearing as dinners — with the
seeder reporting `RESULT: PASS`. Categories are now resolved from `meal_categories` **by name**, and
a missing category is a loud refusal.

That refusal has a second effect, which is the reason it is a refusal and not a repair: categories
are owned by `seedReadyMeals()` at server boot. Refusing when they are absent **enforces the correct
release ordering** (deploy → boot → seed) rather than documenting it and hoping.

### 3. Canonical identity is now enforced, not merely declared

`acquisition_source_key` (`tha_original:THA-###`) is the identity of a founding recipe and the key
the seeder reconciles on — but nothing in the database prevented the same recipe existing twice. "No
duplicates" was a property of the script's *care*, not of the *data*. Since system meals are visible
to every user, a duplicate would have been a silent, permanent, globally-visible defect.

One reviewed migration (`2026-07-11_cbk1_cookbook_canonical_identity`), through the only sanctioned
schema route, adds a **partial** unique index scoped to the founding cookbook's key space alone:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS meals_tha_original_source_key_uniq
  ON meals (acquisition_source_key)
  WHERE is_system_meal = true AND acquisition_source_key LIKE 'tha_original:%'
```

Ready meals (NULL key) and user meals are untouched and unconstrained. Duplication of a founding
recipe is now refused by Postgres — *demonstrated below, not asserted*.

### 4. Verification the seed cannot fake — `scripts/ci/verify-cookbook-seed.ts`

A **read-only** gate, safe to run against production, and the single owner of what "correctly
seeded" means. Eight checks: source integrity, presence of all 500, no duplicate keys, **set
equality** of seeded identities against the committed source (not merely a count), canonical
provenance (`tha_library` / `authored` / system / `user_id=0`), content integrity, legacy names
retired, categories resolve. Exit 0 / exit 1. The seed does not get to mark its own homework.

### 5. Release integration — `RELEASE.md`

- **New Step 4a** — the canonical seeding step: dry-run → `--production` → verify. Placed after
  Step 3 (migrations) because the app must boot once before the cookbook can be seeded.
- The **stale guard claim** (*"Importer refuses when `NODE_ENV=production`"*) is corrected — it is
  now false, and leaving it would have been the same class of defect REL1 existed to fix: a document
  describing a protection the code no longer provides.
- Added to **"What does NOT auto-run"**, with the reason it is not a boot seed stated rather than
  left to be rediscovered.
- Cookbook added to the **live-path verification** table.

### 6. Ownership recorded — `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`

Domain 12 (Meal Identity) had **no `Seed` row** — Domain 13 did. That absence was the ownership gap
that let the Cookbook have no seeding owner at all. It now names the canonical seeder, the write
funnel, the identity key, the enforcing index, and the verification gate.

---

## ARCHITECTURE COMPLIANCE

| Check | Status | Evidence |
|---|---|---|
| One canonical identity | ✅ | `acquisition_source_key` = `tha_original:THA-###`. One key space; now **enforced unique** by the database. |
| One owner per fact | ✅ | Recipe content: `meals` (SoT D12). Categories: `seedReadyMeals`. "Is this host production?": `scripts/db/database-target.ts` — extracted precisely so it did **not** get a second owner. |
| No duplicate entities | ✅ | No new store, table, or key space. The `meals` table is extended with rows, not rivalled. |
| No duplicate ownership | ✅ | The seeder writes recipe rows; it does not own categories (it reads them and refuses if absent). |
| No duplicate state | ✅ | The JSON is a **one-way seed source**, never a co-owner. It is never read back at runtime and never reconciled *from* the database. |
| Extends existing architecture | ✅ | The existing importer, the existing `storage.createMeal` funnel, the existing `isSystemMeal` visibility, the existing RELEASE.md manual-data-step pattern. Nothing new stands beside them. |
| Progressive enrichment | ✅ | Only columns that exist are written. `difficulty`, `prep_minutes`, `slug` etc. remain honest gaps in the source, not invented columns. |
| Knowledge domain compliance | N/A | Introduces no knowledge domain; the Recipes domain and its pipeline are unchanged. |
| Honest gaps over fabrication | ✅ | No nutrition estimated, no quantities invented. An unseeded Cookbook now reports itself **empty and failing**, rather than appearing fine. |
| No permanent synchronisation bridge | ✅ | A **funnel** (JSON → `storage.createMeal` → `meals`), which Principle 7 names as permitted infrastructure — not a bridge keeping two owners in agreement. |
| Evolution over replacement | ✅ | Nothing replaced. `import-tha-founding-cookbook-batch-001.ts` remains as the documented Batch-001 restore path (see Scope Lock). |

**Recipe Acquisition Architecture §5** — every insert goes through the canonical write funnel
`storage.createMeal`. No raw insert, no bulk COPY, no seeding SQL. Every row carries
`acquisition_lane` / `acquisition_type` / `acquisition_source_key` (Rule 4). The `--production` flag
gates the **environment**, never the **right**: `tha_library` already grants all-user visibility, so
no new permission was created.

**Experience & UI Governance** — no user-facing surface, pattern, route, or dialog is added. The
Cookbook page, its read path, and its bucketing are untouched. What changes is that in production the
existing surface will have its intended content. No new visual pattern; checklists owed nothing.

---

## PRODUCT REGISTRY IMPACT

- **Registry affected:** NO
- **Entries created / updated / retired:** NONE
- **Any entry set to `public` or `household`:** N/A
- **Product knowledge written into a prompt, template, or fallback string:** NO (Rule PKR27)

CBK1 adds no page, route, journey, capability, dialog, integration, setting, or claim. It changes
*where the existing Cookbook's content comes from*, not what THA is. `docs/product/` is currently
**untracked work belonging to PDA1** and was deliberately not committed or altered by this task; it
was inspected and contains **no claim that CBK1 falsifies** (no entry asserts the founding cookbook's
production availability).

---

## DATA IMPACT

- **Reads existing data:** YES — system meals, `meal_categories` (read-only).
- **Writes new data:** YES — up to 500 `meals` rows (`user_id=0`, `is_system_meal=true`), and
  in-place updates to those same rows on re-run. **No user-owned row is ever matched, read, or
  written**; every write is scoped to `is_system_meal = true`.
- **Changes meaning of existing data:** NO. Column semantics are unchanged.
- **Requires backfill:** NO. The seed *is* the data step, and it is idempotent.
- **Schema change:** YES — one additive partial unique index. It creates nothing, drops nothing, and
  cannot destroy a row. It was applied to a database **already holding the 500 rows** (dev) without
  error, which is direct evidence there are no pre-existing duplicates for it to trip on.

---

## TRUST CHECK

**Could this mislead the user?** The opposite, and this is the substance of the change. Before CBK1,
a production Cookbook could be **empty and nothing would say so** — not the packaging gate, not the
tests, not the build. A household would open the Cookbook and find nothing, and the release would
have reported success. `verify:cookbook-seed` now fails, loudly and by exit code, on exactly that
state. It was run against a fresh database *before* seeding specifically to prove it detects the
blocker rather than merely passing when things are already fine.

**Could this fabricate certainty?** No. Verification reads the database and compares it to the
committed source by **set equality of identities**, not by a row count that a duplicate could
satisfy. The seeder verifies its own result and **throws** if the post-state is wrong, so a
partially-applied seed cannot report `PASS`.

**Is anything guessed but shown as real?** No — and one place where it *was* has been fixed. The
hard-coded category ids were a guess that presented as a fact and would have silently miscategorised
all 500 recipes on a fresh production database. Categories are now resolved by name or the seed
refuses.

**What happens if the system is wrong?** Blast radius is genuinely global — system meals are visible
to every authenticated user, so a bad seed is a bad seed for everyone at once, with no per-user
containment. That is the reason for the layering: a dry run previews, the seed self-verifies, the
gate independently re-verifies, the database refuses duplicates outright, and repair is *re-running
the idempotent seed*, never deletion. `--rollback` is refused against production with no override,
because deleting 500 live rows to fix a bad seed is a worse outcome than the bad seed.

**No architectural duplication introduced:** YES (none).
**No new source of truth created:** YES (none — `meals` remains SoT D12).
**No runtime behaviour altered:** YES — no server runtime file changed except the migration list.
The application's request-handling behaviour is byte-for-byte unchanged.

---

## ROLLBACK PLAN

**Rollback identifier:** `rollback/pre-CBK1` → `9b42637c9f2cc269bce4fe527a417219fad25f82`

```bash
git reset --hard rollback/pre-CBK1     # code
```

**Files to revert:** `scripts/import-tha-founding-cookbook-500.ts`, `scripts/db/database-target.ts`
(new), `scripts/db/schema-push-guard.ts`, `scripts/ci/verify-cookbook-seed.ts` (new),
`server/migrations/runner.ts`, `server/tests/test-cbk1-cookbook-seed.ts` (new), `package.json`,
`RELEASE.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, this report.

**Database rollback:** the only schema change is one additive index:

```sql
DROP INDEX IF EXISTS meals_tha_original_source_key_uniq;
```

It holds no data and dropping it destroys nothing.

**Seeded rows:** nothing has been seeded to production — no production database was contacted at any
point in this task. On a development database, `npm run seed:cookbook -- --rollback` removes the 500.
There is deliberately **no production equivalent**.

**Verification after rollback:** `npm run typecheck:ci`, `npm test`, `npm run build`.

---

## DEFINITION OF DONE

**What success looks like**
- One canonical mechanism seeds the founding cookbook into any database, including production. ✅
- Running it twice creates no duplicates. ✅
- Recipe identities remain canonical and match the committed source exactly. ✅
- Failures are refusals with a stated reason, not silent successes. ✅
- The release process documents it; a gate proves it. ✅

**What must not break**
- The dev/CI seeding path — unchanged behaviour. ✅ (`ci:setup-db` + seed on a fresh DB, green)
- TRUST1-O8 production schema protection — the guard was refactored, so this is load-bearing. ✅
  (33/33 pass)
- The release packaging gate. ✅ (5/5 pass)
- User-owned meals — never touched by any code path here. ✅ (every write scoped to `is_system_meal`)

---

## MANUAL VERIFICATION

Performed against a **genuinely fresh database** (`CREATE DATABASE`, then `npm run ci:setup-db` —
the same schema + migrations + boot-seed path CI uses), not against the long-lived dev database.

| # | Step | Result |
|---|---|---|
| 1 | Verify gate on a fresh, unseeded DB | **FAIL, exit 1** — *"0 rows — the Cookbook is EMPTY on this database"*. The gate detects the blocker. |
| 2 | `seed:cookbook --dry-run` | *"Would insert 500"* — and **0 rows written**, confirmed by query. |
| 3 | Seed the clean database | **500 inserted**, 0 reconciled. `RESULT: PASS`. |
| 4 | Confirm all recipes available | **8/8 checks pass** — 500 present, identities match source by set equality, provenance canonical. |
| 5 | **Run the seed again** | **0 inserted, 500 reconciled**, total still 500. |
| 6 | **Confirm no duplicates** | 0 duplicate keys. Verify gate: **8/8 pass**. |
| 7 | Categories on a fresh DB | Dinner 270 · Lunch 135 · Breakfast 75 · Snack 20 — **exactly the source manifest** (lunch 110 + side 25 = 135). The bug that would have hit only production did not occur. |
| 8 | Release documentation | RELEASE.md Step 4a is the canonical process; the false guard claim is gone. |

**Guard verification**

| # | Scenario | Result |
|---|---|---|
| 9 | Managed (Neon) host, **`NODE_ENV` unset**, no flag | **REFUSED**, exit 1 — the hole in the old guard, now closed. Credentials redacted in output. |
| 10 | `NODE_ENV=production`, no flag | **REFUSED**, exit 1. |
| 11 | `NODE_ENV=production` **with `--production`** | Proceeds — and is still idempotent (0 inserted, 500 reconciled). |
| 12 | `--rollback --production` against a managed host | **REFUSED**, exit 1 — *"There is no override for this."* |
| 13 | Fresh DB with schema but **never booted** (no categories) | **REFUSED**, exit 1 — *"required meal categories are missing"*. Old code would have written orphan category ids and reported success. |
| 14 | `INSERT` a duplicate `tha_original:THA-001` directly via SQL | **Postgres refused**: `duplicate key value violates unique constraint "meals_tha_original_source_key_uniq"`. Duplication is now impossible, not merely avoided. |

---

## USER ACCEPTANCE EVIDENCE

| Gate | Result |
|---|---|
| `npm run verify:cookbook-seed` (clean DB, seeded) | **PASS — 8 passed, 0 failed** |
| `npm run test:cbk1-cookbook-seed` | **PASS — 37 passed, 0 failed** |
| `npm test` (full suite, 70 suites) | **PASS — exit 0, zero failing suites** |
| `npm run test:trust1-o8-production-schema-protection` (guard refactor) | **PASS — 33 passed, 0 failed** |
| `npm run typecheck:ci` | **PASS — baseline 175, current 175. No new type errors.** |
| `npm run build` | **PASS — exit 0** |
| `npm run verify:release-packaging` | **PASS — 5 passed, 0 failed** |
| `.engineering/scripts/repo-structure-verify.sh` | **PASS — repository structure is clean** |

---

## SCOPE LOCK

**Done:** one canonical seeding mechanism; production opt-in guard; dry-run; category resolution by
name; enforced canonical identity; a read-only verification gate; RELEASE.md integration; SoT
register ownership; a test suite.

**Deliberately NOT done:**
- **The live production database was not seeded, and was never contacted.** No production
  `DATABASE_URL` was used at any point. Guard testing used a *fake* Neon URL that fails at the guard
  before any connection is attempted.
- **Nothing was deployed or pushed.** Local commit only.
- **Cookbook was not redesigned.** The read path, the UI, the bucketing, the capability card — all
  untouched.
- **No recipe content was modified.** The JSON source of truth was read, never written.
- **No second importer.** `scripts/import-tha-founding-cookbook-batch-001.ts` is superseded but
  **retained**, because it is the documented restore path for the 10 Batch-001 rows. Retiring it is a
  Cookbook decision with its own rollback consequences and was out of scope. It cannot be reached by
  the release process.
- **No uploads / object storage.** Untouched (REL1 Blocker 2 remains open).
- **`scripts/verify-prod.ts` was not modified** — see below.

**Discovered, reported, not fixed (out of scope):**
`scripts/verify-prod.ts:44` hard-codes `expectedHead = "2026-06-18_ws0_knowledge_registry"`, which was
already **eight migrations stale before CBK1**. Its "Schema at head" check therefore fails against a
correctly-migrated production database today. Fixing it properly means giving the schema head one
owner (the runner computes it dynamically; verify-prod re-declares it), which is release-verification
work, not cookbook work. **CBK1 deliberately did not build its cookbook check into that script**, so
the new gate is standalone and unaffected by this pre-existing defect. It should be fixed before the
next release.

---

## IS THE COOKBOOK DEPLOYMENT BLOCKER CLOSED?

**Yes — the mechanism blocker is closed.** REL1 Blocker 1 asked for an *owner* and a *sanctioned
mechanism* for getting 500 recipes into a production database. Both now exist, are documented in the
canonical release process, are idempotent, are verified by a gate that fails when the Cookbook is
empty, and are protected by a guard that cannot be passed by accident.

**What is not closed, and cannot be from here:** the production database has not been seeded, because
seeding it was explicitly out of scope and requires a deploy plus an operator running Step 4a. Until
someone does that, production would still serve an empty Cookbook — but that is now a **scheduled,
documented, verifiable step with a failing gate attached**, rather than a gap nobody had a way to
close.

## REMAINING PRODUCTION DEPLOYMENT BLOCKERS

| # | Blocker | Status |
|---|---|---|
| 🟠 1 | **`uploads/` is ephemeral on the deploy target** (REL1 Blocker 2) — meal photos are lost on every redeploy; needs object storage. | **OPEN** — genuine data loss, untouched by CBK1 |
| 🟡 2 | **`.replit` is modified and uncommitted** (REL1 Blocker 3) — deployed config ≠ repository config. | **OPEN** — needs the person who changed it |
| 🟡 3 | **`scripts/verify-prod.ts` expected schema head is stale** — the release verification script fails against a correct production DB. | **OPEN** — newly discovered by CBK1 |
| 🟢 4 | **Cookbook has no production seeding path** (REL1 Blocker 1) | **CLOSED by CBK1** |
