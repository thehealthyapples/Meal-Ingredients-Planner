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

## Release Checklist

Use this every release. Do not skip steps.

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
[Migrations] Schema at head: 2026-04-19_backfill_shopping_list_null_resolution_state
```

If you see `Schema head mismatch` or a migration failure, paste the printed SQL into the Neon SQL Editor and run it manually, then redeploy.

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
- `server/scripts/backfill-item-resolution.ts` — must be run manually per release

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

Expected head (as of 2026-04-19):
```
2026-04-19_backfill_shopping_list_null_resolution_state
```

---

## Neon / Render quick links

- Neon Console: your project → SQL Editor
- Render: service → Logs tab (search `[Migrations]`)
- One-off commands on Render: service → Shell tab (paid) or one-off job
