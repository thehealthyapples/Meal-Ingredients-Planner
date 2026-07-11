# Release Process (THA)

---

## Restore Points / Baseline Tags

| Tag | Date | Branch | Commit | Purpose |
|-----|------|--------|--------|---------|
| `planner-pre-revamp-baseline-v1` | 2026-05-12 | main | e18e746 | Planner state before Phase 0 architecture refactor |
| `planner-phase0-complete-baseline-v1` | 2026-05-12 | main | 824cf1f | Phase 0 complete — context + hooks extracted, pre-workspace shell |

### Rollback instruction

To restore the codebase to any tagged baseline:

```bash
git checkout <tag-name>
```

To create a rollback branch from a tag:

```bash
git checkout -b rollback/planner-pre-revamp planner-pre-revamp-baseline-v1
```

---

### planner-phase0-complete-baseline-v1 — Phase 0 Completion Notes

**Tag:** `planner-phase0-complete-baseline-v1`  
**Date:** 2026-05-12 UTC  
**Branch:** main  
**Commit:** 824cf1f  
**Build:** PASS (vite + esbuild, zero errors)  
**TypeCheck:** PASS (tsc --noEmit, zero errors)

**Phase 0 summary:**  
State extraction from `WeeklyPlannerPage` into isolated, reusable domain modules. No behavioural change. No schema change. No API change. No UI redesign.

**What was extracted:**

| Module | File | Domain |
|--------|------|--------|
| `PlannerContext` | `client/src/contexts/PlannerContext.tsx` | `assistantMode`, `plannerRefresh()` |
| `useSmartSuggest` | `client/src/hooks/use-smart-suggest.ts` | Smart Suggest: state, run, apply, regenerate, lock |
| `usePlannerScan` | `client/src/hooks/use-planner-scan.ts` | Scan: camera, file upload, open/cancel, plannerDays |
| `planner-types` | `client/src/lib/planner-types.ts` | `FullDay`, `FullWeek`, `SmartSuggestResult`, etc. |

**Architectural status at this tag:**

| Area | Status |
|------|--------|
| PlannerContext | Introduced — `assistantMode` wired but non-behavioural |
| Smart Suggest domain | Isolated in `useSmartSuggest` hook |
| Scan domain | Isolated in `usePlannerScan` hook |
| Planner types | Centralised in `planner-types.ts` |
| `WeeklyPlannerPage` | 3104 → 2810 lines (294 lines removed) |
| Modal behaviour | Unchanged — all 9 modals still present |
| Workspace shell | Not yet — planned Phase 1 |
| Intent layer (nullable mealId) | Not yet — planned Phase 3 |
| Drag-and-drop | Not yet — planned Phase 4 |
| Schema | No changes |
| Server routes | No changes |
| Migrations | No changes |

**Planner behaviours verified at this tag:**

| Behaviour | Status |
|-----------|--------|
| Planner grid renders (6 weeks, day columns, meal rows) | Verified |
| Planner loads existing weeks | Verified |
| Smart Suggest opens (preferences → proposal dialog) | Verified |
| Smart Suggest apply writes meals to planner | Verified |
| Scan planner opens (camera → review dialog) | Verified |
| Scan cancel works without data corruption | Verified |
| Templates panel opens | Verified |
| Meal picker opens on slot click | Verified |
| Basket generation (+Week) works | Verified |
| Day drawer opens per column | Verified |
| Planner saves persist across refresh | Verified |

**Deferred hotspots — intentionally NOT extracted in Phase 0:**

These clusters remain inline in `WeeklyPlannerPage` and are candidates for future hook extraction in later phases or a Phase 0b pass:

| Cluster | State variables | Phase target |
|---------|----------------|--------------|
| Meal picker cluster | `mealPickerOpen`, `pickerTarget`, `mealSearch`, `mealFilter`, `productQuery`, `productResults`, `productSearching`, `productRetailer` | Phase 2 (panel migration) |
| Bulk assign cluster | `bulkAssignOpen`, `bulkMeal`, `bulkWeeks`, `bulkDays`, `bulkSlots`, `bulkMealSearch`, `bulkMealFilter`, `bulkStep` | Phase 2 |
| Household override cluster | `weekDietsOpen`, `weekOverrides`, `setOverrideMutation`, `deleteOverrideMutation` | Phase 2 |
| Guest eater cluster | `addGuestOpen`, `guestName`, `guestDietTypes`, `guestRestrictions` | Phase 2 |
| Meal detail / adaptation cluster | `mealDetail`, `adaptationOpen`, `adaptMutation` | Phase 2 |

**Known architectural cautions for Phase 1:**

1. `assistantMode` is wired but has no visual effect yet — Phase 1 must render conditional panel UI based on it
2. `PlannerProvider` is scoped to planner routes only via `PlannerPageWrapper` — correct, do not widen scope
3. Smart Suggest `applySmartSuggestion` is a one-click bulk-write with no per-item confirm — this is a trust risk to address in Phase 3
4. Scan stubs (`mealSourceType: "planner-placeholder"`) accumulate in cookbook without cleanup — deferred to Phase 3
5. `plannerEntries.mealId` remains `NOT NULL` — intent layer not yet started

**Rollback to Phase 0 complete state:**
```bash
git checkout -b rollback/planner-phase0 planner-phase0-complete-baseline-v1
```

**Rollback to pre-revamp state (before any Phase 0 work):**
```bash
git checkout -b rollback/planner-pre-revamp planner-pre-revamp-baseline-v1
```

**Readiness for Phase 1:**  
READY. `PlannerContext` is mounted and functional. `assistantMode` is available to all planner child components. Layout expansion (right-panel shell) can proceed without touching Phase 0 modules.

---

### planner-pre-revamp-baseline-v1 — Baseline Notes

**Tag:** `planner-pre-revamp-baseline-v1`  
**Date:** 2026-05-12 21:58 UTC  
**Branch:** main  
**Commit:** e18e7463ce106db63ca50213826c939fc1cb3212  
**Build:** PASS (vite + esbuild, no errors)  
**TypeCheck:** PASS (tsc --noEmit, zero errors)

**Why this baseline exists:**  
Captured immediately before Phase 0 of the THA planner architecture revamp begins. The revamp will progressively evolve the planner toward a persistent workspace model with a right-side assistant panel. This tag allows a clean rollback if any phase introduces regressions.

**What future work it protects against:**  
- Phase 0: State extraction from WeeklyPlannerPage into PlannerContext  
- Phase 1: Right-side assistant panel shell  
- Phase 2: Modal-to-panel migration (scan, templates, smart suggest, meal picker)  
- Phase 3: Planner meal intent layer (nullable mealId, intentText column)  
- Phase 4: Drag-and-drop / tap-to-assign meal assignment  

**Current planner behaviour at this tag:**

| Behaviour | Status |
|-----------|--------|
| Planner grid loads (6 weeks, day columns, meal rows) | Working |
| Manual meal add (+ Add button → meal picker dialog) | Working |
| Scan planner flow (Camera → PlannerScanReview dialog) | Working |
| Smart Planner (Plan My Week preferences → proposal dialog) | Working |
| Templates panel (THA + My Templates dialog) | Working |
| Existing planner entries display correctly | Working |
| Multi-recipe slots (position-ordered, Day View drawer) | Working |
| Household adaptation (per-entry AI tailoring) | Working |
| Session recovery in scan review (sessionStorage) | Working |
| Week eater diet overrides | Working |
| Bulk assign dialog | Working |
| Share plan | Working |
| Add week to basket | Working |

**Key architectural facts at this tag:**  
- `weekly-planner-page.tsx`: 3,104 lines, monolithic, 9 active modal surfaces  
- `plannerEntries.mealId`: `INTEGER NOT NULL` (pre-intent-layer schema)  
- `mealSourceType: "planner-placeholder"`: coined in scan flow stub creation  
- Smart Suggest: deterministic scoring engine (not LLM)  
- Scan: GPT-4o-mini vision API  
- No drag-and-drop library installed  

---

## Overview

- Development happens in Replit
- Code is pushed to GitHub via `./deploy.sh`
- Production deploys from GitHub → Render (auto-deploy on push to `main`)
- Production database is Neon (separate from dev)
- NEVER assume dev DB = prod DB

---

## Deployment Configuration

**This section is the canonical definition of where THA deploys and what governs it.**
Established under `REL2` (2026-07-11). Enforced by `npm run verify:deployment-config`
(`scripts/ci/verify-deployment-config.ts`).

THA has **exactly one deployment target.**

| | |
|---|---|
| **Production target** | **Render** — auto-deploys on push to `main` |
| Trigger | A GitHub push. Nothing else. There is no deploy CLI, API token, or manual step |
| Build | `npm run build` (`script/build.ts` → `dist/index.cjs` + `dist/public/`) |
| Start | `npm start` → `node dist/index.cjs` |
| Port | `PORT` — the server falls back to `5000` (`server/index.ts`) |
| Database | Neon, owned by Render as a service environment variable |
| Schema | Migrations auto-run at boot (see *What auto-runs on deploy*) |

### THA does not deploy from Replit

Replit is the **development environment**. It is not a deployment target, and `.replit` is not the
deployment configuration — it configures the workspace (the run button, port forwarding, the
`postMerge` hook).

`.replit` used to declare `[deployment] deploymentTarget = "autoscale"` with its own build and run
commands. Nothing ever released from it. But a dead deployment declaration does not sit quietly —
**it gets believed.** `REL1` read that block and diagnosed the ephemeral-uploads blocker against
Replit autoscale, which is not the platform THA runs on. The block was removed under `REL2`, and
`verify:deployment-config` fails the release if it returns.

If THA ever genuinely adopts a second target, that is an architectural decision: **declare it in
this section first**, then update the gate. A deployment target that exists only in a config file
is a deployment target nobody has agreed to.

### What is NOT reproducible from the repository — and why that is stated, not hidden

**Render's service configuration is not in version control.** There is no `render.yaml`. The build
command, start command, environment variables, health check and instance settings live in the
**Render dashboard**, and nothing in this repository can read them or verify they match the table
above.

`REL2` deliberately did **not** invent one. A Render service created from the dashboard *ignores* a
`render.yaml`, so committing an unverified file would create a second source of truth that Render
never reads and that drifts silently from the real config — a worse failure than the honest gap, and
a direct breach of *one owner per fact*. The gate therefore prints this limitation on **every run,
pass or fail**: a green result means THA's own configuration is committed and coherent; it does not
mean Render agrees with it.

**This is an open deployment blocker** (`REL2` Blocker A). Closing it means a human with dashboard
access either adopts a Render Blueprint deliberately, or records the live settings here — where they
can at least be reviewed.

---

## The Release Package

**This section is the canonical definition of what THA ships.** Established under `REL1`
(2026-07-11). Enforced by `npm run verify:release-packaging`
(`scripts/ci/verify-release-packaging.ts`).

The deploy is a **clean checkout of `main` plus `npm run build`**. Nothing is copied by hand.
If a file is not committed, it is not in production — there is no other channel.

### What production loads

| Artefact | Produced / sourced by | Loaded by |
|---|---|---|
| `dist/index.cjs` | `npm run build` (esbuild) | `npm start` — the server |
| `dist/public/**` | `npm run build` (vite) | `server/static.ts` — the SPA |
| `eng.traineddata` | Committed at the repo root | `tesseract.js` via `server/services/ocr.ts`, resolved from the working directory |
| `server/data/canonical-map.json`<br>`server/data/ambiguity-map.json` | Committed | `server/lib/item-resolver.ts` — **inlined into `dist/index.cjs` at build time**, not read from disk at runtime |
| `migrations/` + `server/migrations/runner.ts` | Committed | Applied at boot (see *What auto-runs on deploy*) |
| Production database (Neon) | Migrations + seeds | Everything else — recipes, foods, households |

**`eng.traineddata` is the only file production reads from the filesystem at runtime** other
than its own build output. That is why it lives at the root and why moving it is a behaviour
change (`docs/architecture/REPOSITORY_CONVENTIONS.md` §2).

### What is intentionally excluded from production

These are committed to the repository — so a clean checkout can reproduce the platform — but
they are **not part of the production runtime**, and production must never read them.

| Excluded | Why | Guard |
|---|---|---|
| `data/development_world/` | Development-only fixture world (50 synthetic households). Its admin surface is DEV-only by design. | `assertDevelopmentWorldAllowed()` — refuses when `NODE_ENV=production`, no override |
| `data/cookbook/` | **Seed source**, not a runtime asset. The 500 founding recipes reach production as rows in the `meals` table, never as files — written by the canonical seeder at release time (Step 4a), never read by the server. | No server runtime file reads it (packaging gate, Check 4). The seeder refuses a production target unless the operator passes `--production` |
| `data/usda-snapshot/`, `data/alternatives/`, `data/discovery/`, `data/seasonal/`, `data/stories/` | Build/analysis inputs and workstream report output | Read only by `scripts/` and `server/scripts/` |
| `scripts/`, `docs/`, `.engineering/`, `server/tests/`, `attached_assets/` | Tooling, documentation, tests, and design source | Not imported by `server/index.ts`; never enter `dist/` |

`data/` as a whole is a **development and seed-source tree**. No production code path may read
it. Check 4 of the packaging gate enforces exactly this: any server runtime file that reaches
into repo-root `data/` must refuse to run in production, or the gate fails.

### The rule this exists to enforce

> **Production code must never depend on a file that is absent from the repository.**

Before `REL1`, `data/development_world/` and `data/cookbook/` were untracked while
`server/development-world/world-reader.ts` read the first of them at runtime and *described it
in a comment as "a committed, immutable file."* The code would have shipped; the data would not.
Typecheck, tests and the build all passed, because they ran against a working tree that still
had the files. Only git knew. `npm run verify:release-packaging` is the check that asks git.

---

## Release Checklist

Use this every release. Do not skip steps.

### Step 0 — Deployment configuration gate

```bash
npm run verify:deployment-config   # must PASS — proves the config that deploys is the config in git
```

Fails if `.replit` is uncommitted or modified, if a rival `[deployment]` block reappears, if a
port mapping silently exposes a localhost-bound service, if the declared `PORT` disagrees with the
server, if `[postMerge]` points at a file absent from a clean checkout, or if `npm start` and the
build emit different artefacts. **A FAIL here means the configuration you are about to deploy is
not the one in the repository.**

Read the NOTE it prints. It states what it cannot check: Render's own dashboard config.

### Step 0b — Release packaging gate

```bash
npm run verify:release-packaging   # must PASS — proves a clean checkout can reproduce prod
```

Fails if any runtime asset is untracked, any asset directory has uncommitted files, or any
server runtime path resolves to a file the repository does not contain. **A FAIL here means the
deploy would ship code that reads files that will not be there.**

Both gates run, in this order, ahead of typecheck/test/build in `npm run release:check`.

### Step 1 — Git clean

```bash
git status          # must be clean or intentionally dirty
npm run build       # confirms it compiles
```

### Step 2 — Push code

```bash
./deploy.sh "release: short description"
```

Check Render dashboard → your service → Logs for deployment completion.

### Step 3 — Schema migrations (auto)

Migrations run automatically at server startup via `server/migrations/runner.ts`.

After deploy, open Render Logs and confirm:

```
[Migrations] Schema at head: 2026-06-18_ws0_knowledge_registry
```

If you see `Schema head mismatch` or a migration failure, paste the printed SQL into the Neon SQL Editor and run it manually, then redeploy.

### Step 4a — Seed the THA Founding Cookbook (`CBK1`)

**This is the canonical mechanism by which the 500 THA founding recipes reach a production
database.** There is no other, and there must never be a second one. It is idempotent: run it on
every release, or only when the cookbook changes — the result is the same.

It must run **after Step 3**, and specifically after the app has started at least once. The seeder
resolves `meal_categories` by name, and those categories are created at server boot by
`seedReadyMeals()`. Seeding a database that has never booted the app is refused, loudly, rather
than filing 500 recipes under category ids that do not exist.

**Dry run first (preview only — writes nothing):**
```bash
DATABASE_URL="<prod neon url>" npm run seed:cookbook -- --dry-run
```

**Apply if the output looks correct:**
```bash
DATABASE_URL="<prod neon url>" npm run seed:cookbook -- --production
```

`--production` is required against a production database and must be typed every time. Without it
the seeder refuses — a managed database host counts as production **even when `NODE_ENV` is unset**,
which is the normal shape of the command above.

**Then verify (read-only, safe against prod):**
```bash
DATABASE_URL="<prod neon url>" npm run verify:cookbook-seed   # must PASS
```

This checks all 500 recipes are present, that no recipe was duplicated, that every recipe identity
matches the committed source, and that provenance is canonical (`tha_library` / `authored`). **The
seed does not get to mark its own homework.**

> **`--rollback` is refused against a production database, always, with no override.** It deletes
> all 500 recipes. Re-running the seed repairs a bad seed in place — deleting first is never the
> remedy. (See *Production Data Rules* below.)

### Step 4 — Data reconciliation / backfill

After every deploy that adds new runtime-critical fields, run the item resolution backfill against prod:

**Dry run first (preview only):**
```bash
DATABASE_URL="<prod neon url>" npx tsx server/scripts/backfill-item-resolution.ts --dry-run
```

**Apply if output looks correct:**
```bash
DATABASE_URL="<prod neon url>" npx tsx server/scripts/backfill-item-resolution.ts
```

This resolves `shopping_list` rows still in `resolution_state = 'raw'`. It is idempotent and safe to re-run.

> Skip this step if you made no changes to the shopping list add/import paths
> and no new items have been added since last run.

### Step 5 — Verify live paths

Check these exact paths are working in the deployed prod app:

| Path | What to check |
|------|---------------|
| Cookbook | The THA library is populated, not empty. `npm run verify:cookbook-seed` is the mechanical check (Step 4a). |
| Planner | Week selector shows 6 weeks. Click a day, add a meal. No 500 error. |
| Shopping list | Add an item manually. Add from planner. Both appear on the list. |
| Shopping list — chooser | Add an ambiguous item (e.g. "berries"). Review prompt appears. Select a variant. Item resolves. |
| Pantry | Open pantry. Default items are present. No 500 errors. |
| Pantry knowledge | Click any pantry ingredient. Knowledge card loads (may show "enriching..." on first load). |

---

## Production Data Rules

- NEVER wipe prod data
- NEVER run `DROP TABLE`, `TRUNCATE`, or `DELETE` without a `WHERE` clause
- All migrations must use `IF NOT EXISTS` / `IF EXISTS` — idempotent SQL only
- All backfills must be read-safe (`SELECT` first, then targeted `UPDATE`)
- Migrations run inside transactions — a failure rolls back fully
- If a migration fails with PERMISSION DENIED, the runner prints the raw SQL: paste it into the Neon SQL Editor and run it manually

---

## What auto-runs on deploy

| Step | Where | When |
|------|-------|------|
| Schema migrations | `server/migrations/runner.ts` | Every server start |
| Template migration | `server/template-migration.ts` | Every server start |
| Seed ready meals | `server/lib/seed-ready-meals.ts` | Every server start (idempotent) |
| Seed food knowledge | `server/lib/seed-food-knowledge.ts` | Every server start (idempotent) |
| Sync pantry defaults | `storage.syncAllPantryDefaults()` | Every server start (background, idempotent) |

**What does NOT auto-run:**
- `server/scripts/backfill-item-resolution.ts` — must be run manually per release (Step 4)
- `scripts/import-tha-founding-cookbook-500.ts` — the canonical cookbook seeder. Run manually per
  release (Step 4a). It is **deliberately not a boot-time seed**: `data/cookbook/` is a seed source
  and is not part of the production release package, so no server runtime path may read it
  (packaging gate, Check 4). Making it auto-run would either put the corpus in the runtime bundle
  or create a second seeding pipeline. Both are refused.

---

## Known prod-specific failure modes

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| Planner week selector empty / 500 | `planner_weeks.household_id IS NULL` | Migration `2026-04-19_backfill_planner_weeks_household_id_final` auto-fixes on next deploy |
| Shopping list grouped terms fail chooser | Old items in `raw` state with `needsReview=false` | Run item resolution backfill (Step 4) |
| Pantry knowledge card shows nothing | Table newly created, no data yet | First access triggers async enrichment. Returns `null` then enriches in background. Normal. |
| `getHouseholdForUser` throws | User has no active household_members row | Investigate: check `household_members` for that user_id; may need manual INSERT |

---

## Inspecting prod migration state

Run in Neon SQL Editor:

```sql
SELECT id, applied_at FROM schema_migrations ORDER BY applied_at;
```

Expected head (as of 2026-06-18):
```
2026-06-18_ws0_knowledge_registry
```

---

## Neon / Render quick links

- Neon Console: your project → SQL Editor
- Render: service → Logs tab (search `[Migrations]`)
- One-off commands on Render: service → Shell tab (paid) or one-off job
