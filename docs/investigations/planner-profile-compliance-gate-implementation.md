# Planner Profile Compliance Gate — Implementation Report

_Date: 2026-06-06 · Scope: single Profile compliance gate for system-generated planner writes (Option B)._

## Rollback identifiers

```
ROLLBACK BEFORE: rollback/planner-compliance-gate-before-2026-06-06  →  1e67eff  (clean main HEAD)
ROLLBACK AFTER:  rollback/planner-compliance-gate-after-2026-06-06   →  af620b9  (commit on feat/planner-profile-compliance-gate)
```

`main` is **untouched** (still at `1e67eff`); the work lives on branch `feat/planner-profile-compliance-gate`.

To undo: `git checkout main` (the gate never touched main) or `git reset --hard rollback/planner-compliance-gate-before-2026-06-06`.

## Files changed

| File | Change |
|---|---|
| `server/lib/planner-compliance.ts` | **NEW** — shared gate (`resolvePlannerComplianceContext`, `isComplianceActive`, `isMealCompliantForUser`, `assertMealCompliantForPlanner`) |
| `server/routes.ts` | import + gate on template-apply (A2), pass userId to applyWeekTemplate (A3), gate on smart-apply auto-import (A1b) |
| `server/storage.ts` | import + gate in `applyWeekTemplate` (A3), `importTemplateItems` (A4), `seedDemoData` (A5) |
| `client/src/hooks/use-smart-suggest.ts` | skip planner-add when a candidate is skipped by the gate |
| `server/tests/test-planner-compliance-gate.ts` | **NEW** — 25 assertions |
| `package.json` | wired `test:planner-compliance` into `npm test` |

Commit `af620b9` stat: 6 files changed, 427 insertions(+), 9 deletions(-).

## Architecture (Option B, as approved)

One helper, **zero new rules logic**. It delegates entirely to the existing single source of truth — `candidateDietExcluded → dietRules.shouldExcludeRecipe` (Profile diet) and `candidateHardExcluded → canonical restriction resolver` (household hard restrictions). No second engine, no duplicated keyword lists, no special vegan logic. Returns `{ compliant, reason }`. **Inactive for unrestricted users** (short-circuits before any per-meal lookup), so their behaviour and performance are unchanged.

System paths gated (non-compliant skipped, compliant preserved, `skippedCount`/`skippedNonCompliant` surfaced):

- `POST /api/plan-templates/:id/apply` (template apply)
- `POST /api/plan-templates/:id/apply-to-week/:weekId` (applyWeekTemplate)
- `POST /api/plan-templates/:id/import` (importTemplateItems)
- `storage.seedDemoData` (demo seed)
- `POST /api/smart-suggest/auto-import` (smart-apply persistence; client skips the planner add when a candidate is skipped)

User-manual placement paths were **not** gated (per scope).

## Check results

| Check | Result |
|---|---|
| `git status` | clean working tree for tracked files; only pre-existing untracked scratch files remain |
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run build` | **PASS** (client + server built) |
| `npm test` (full suite) | **PASS** — 76 existing + 25 new |

## Mandatory test results

- **T1 Vegan apply** — beef/bacon/chicken/fish/seafood/eggs+dairy skipped; vegan meals applied ✓
- **T2 Vegetarian apply** — fish/meat skipped; eggs+dairy & veg meals applied ✓
- **T3 Household sesame** — tahini & sesame oil skipped; sesame-free applied ✓
- **T4 Unrestricted** — gate inactive, all meals applied (behaviour preserved) ✓
- **T5 Manual add** — not gated (verified: `/api/planner/days/:dayId/items`, `PUT …/entries`, `PATCH …/meal` unchanged) ✓
- **T6 Generation** — existing diet hard filter intact (`test-smart-suggest-diet-pattern` 26/26) ✓
- **T7 Smart-apply persistence** — gate at auto-import; client skips cleanly; valid persistence unaffected ✓

Schema changes: **none** · Migration: **none** · Backfill: **none**

## One finding worth flagging (no action taken — scope lock)

The shared SSoT keyword engine excludes a meal literally listing **"coconut milk"** under a Vegan profile (the `"milk"` substring). This is pre-existing engine behaviour the gate deliberately inherits rather than override. If that false positive should be fixed, it is a separate change to the keyword engine itself.

## Data impact declaration

- Reads existing data: **Yes**
- Writes new data: **Yes** — fewer `planner_entries` may be written for non-compliant system paths
- Changes meaning of existing data: **No**
- Requires backfill: **No**
- Schema changes: **No**
- Migration: **No**
