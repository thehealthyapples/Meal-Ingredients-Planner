<!-- Copy to .engineering/session/runs/<SESSION_ID>.md at the start of a session. -->

# Session: RM2A_Analyser_To_Planner_Journey

| Field | Value |
|---|---|
| **Session ID** | `RM2A_Analyser_To_Planner_Journey` |
| **Rollback ID** | `rollback/RM2A-analyser-to-planner-journey-20260715` → `0f0615aa` |
| **Start time** | 2026-07-15T10:25:24Z UTC |
| **Current stage** | Complete |

## Objective
Implement the missing Analyser → Planner journey: from the Analyser, resolve-or-create
the canonical `meals` identity by barcode (idempotent), then create a normal
`planner_entries` row (any week/day/slot) referencing that `mealId`. No new Product
entity, no second planner reference type. Per RM1 recommendation option (c).

## Files modified
- `server/storage.ts` — new idempotent `resolveOrCreateProductMeal(userId, insertMeal)`.
- `server/routes.ts` — `POST /api/meals` (product saves) and `POST /api/meals/save-product`
  now resolve-or-create by barcode; skip duplicate nutrition/telemetry/auto-analyse on reuse.
- `client/src/components/PlannerAnalyserContent.tsx` — direct "Add to Planner" action
  reusing the existing `AddToWeekModal` (design-system `Button`, zero raw buttons added).
- `server/tests/test-rm2a-analyser-to-planner.ts` — new DB-backed verification (14/14).
- `package.json` — `test:rm2a-analyser-to-planner` script + chained into `npm test`.
- `docs/implementation/platform/RM2A_ANALYSER_TO_PLANNER_JOURNEY.md` — implementation record.

## Checkpoints
- [x] Read governing architecture README + RM1 investigation
- [x] Confirmed git status
- [x] Created rollback branch `rollback/RM2A-analyser-to-planner-journey-20260715` → `0f0615aa`
- [x] Mapped existing code paths (found journey UI existed; identity resolution was the gap)
- [x] Implemented idempotent `resolveOrCreateProductMeal` + wired both product routes
- [x] Added direct "Add to Planner" action to the in-Planner Analyser panel
- [x] Verification: 14/14 RM2A test; analyser/planner/meals/dedup regressions green; typecheck clean for touched files
- [x] Documentation written
- [x] Milestone commit

**Last checkpoint:** Complete — verified and documented.

## Next action
None — complete. Recommended follow-on: **RM3** (retire `meal_template_products` +
`meal-resolution-service.ts`, RM1 §8). Open product decisions: ready-meal vocabulary
unification (RM1 §6.2), fate of the ~300 authored generic ready meals (RM1 §6.3),
optional cross-member canonical identity.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
