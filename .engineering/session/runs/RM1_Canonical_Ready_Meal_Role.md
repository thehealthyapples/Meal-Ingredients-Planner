# Session: RM1_Canonical_Ready_Meal_Role

| Field | Value |
|---|---|
| **Session ID** | `RM1_Canonical_Ready_Meal_Role` |
| **Rollback ID** | `rollback/RM1-canonical-ready-meal-role-20260715` → `0f0615aa` |
| **Start time** | 2026-07-15T09:00:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Determine the correct long-term architectural role of ready meals within THA
(Cookbook entity vs Product Intelligence entity vs both), and the missing
Analyser → Planner journey. Investigation only — do NOT implement, migrate, or
change Planner/Cookbook. Deliver `docs/investigations/platform/RM1_CANONICAL_READY_MEAL_ROLE.md`.

## Files being modified
- `docs/investigations/platform/RM1_CANONICAL_READY_MEAL_ROLE.md` — the investigation (new, docs only)
- `.engineering/session/runs/RM1_Canonical_Ready_Meal_Role.md` — this run file
- `.engineering/session/CURRENT.md` — dashboard row

## Checkpoints
- [x] Read architecture README + principles
- [x] Confirmed git status; created rollback tag
- [x] Mapped current ready-meal representations (meals table, meal_template_products, product analysis)
- [x] Write investigation doc → `docs/investigations/platform/RM1_CANONICAL_READY_MEAL_ROLE.md`
- [x] Reconcile run file + dashboard before final response

**Last checkpoint:** Investigation delivered; recommendation = keep ready meals as `meals`
identity, Analyser as read lens, Planner stores `mealId` (option c). Next workstreams
RM2 (Add-to-Planner journey) and RM3 (retire meal_template_products).

## Next action
Await direction. Recommended next workstream: **RM2 — Analyser → Planner Convergence**
(the "Add to Planner" journey, no schema change). Follow-on **RM3** retires the dead
`meal_template_products` + `meal-resolution-service.ts` under Principle 8. Investigation
only — nothing implemented, migrated, or changed in Planner/Cookbook.

## Blockers
None.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
