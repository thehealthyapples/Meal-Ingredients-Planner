# Session: RM3_Ready_Meal_Product_Representation_Convergence

| Field | Value |
|---|---|
| **Session ID** | `RM3_Ready_Meal_Product_Representation_Convergence` |
| **Rollback ID** | `rollback/RM3-ready-meal-product-representation-convergence-20260715` → `b7ddc442` |
| **Start time** | 2026-07-15 |
| **Current stage** | Complete |

## Objective
Retire the duplicate ready-meal product representation (`meal_template_products` +
`meal-resolution-service.ts` + the orphaned Analyser "Link to template" flow) and
converge ready meals onto the canonical `meals` identity (RM1 §8, Principle 8). No new
Product entity; no migration of generic ready meals. Preserve Analyser→Planner,
barcode reuse, shopping, nutrition, Apple Score and dietary safety behaviour.

## Trace (writers/consumers of meal_template_products)
- **Writer:** `storage.addMealTemplateProduct` ← `POST /api/meal-templates/:id/products`
  ← client `linkToTemplate` mutation (products-page.tsx) → button in AnalyserDetailV2.
  Orphaned: nothing reads what it writes.
- **Readers:** `storage.getMealTemplateProducts` ← `meal-resolution-service.ts`
  (`POST /api/meal-templates/:id/resolve`, **no client caller**), `GET /api/meal-templates/:id`
  (`products` field, **no client reads it**), `GET /api/meal-templates/:id/products`
  (**no client caller**). Resolution engine (`resolveAllTemplatesForPlan`) not route-wired.
- **Conclusion:** no live feature depends on `meal_template_products`. Safe to retire.

## Files modified
- `shared/schema.ts` — remove table, insert schema, types.
- `server/meal-resolution-service.ts` — deleted.
- `server/storage.ts` — remove 3 methods, cascade delete, imports.
- `server/routes.ts` — retire 4 routes, drop `products` field, remove imports.
- `client/src/pages/products-page.tsx` — remove `linkToTemplate` flow.
- `client/src/components/analyser/AnalyserDetailV2.tsx` — remove link-to-template prop + button.
- `server/migrations/runner.ts` — DROP TABLE migration.
- `server/tests/test-trust1-s3-secure-meal-template-endpoints.ts` — drop retired-route assertions.
- `server/intelligence/capability-registry.ts` — remove owningService references.
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — Domain 13 update.
- `docs/implementation/platform/RM3_READY_MEAL_PRODUCT_REPRESENTATION_CONVERGENCE.md` — record.

## Checkpoints
- [x] Read governing README + RM1 + RM2A
- [x] Confirmed git status
- [x] Created rollback branch → `b7ddc442`
- [x] Traced every writer/consumer
- [x] Retired schema/types/service/storage/routes/client
- [x] Added drop migration (`2026-07-15_rm3_retire_meal_template_products`)
- [x] Updated tests + registers (dropped retired-route assertions incl. stale public-read; SoT Domain 13)
- [x] Verification — typecheck clean on all RM3 files; 8 suites green (trust1-s3 30, rm2a 14, templates 56, analyser 30, planner 31, meals 72, shopping 38, dedup 76)
- [x] Documentation (`docs/implementation/platform/RM3_READY_MEAL_PRODUCT_REPRESENTATION_CONVERGENCE.md`) + milestone commit

**Last checkpoint:** Complete — duplicate ready-meal representation retired, verified safe,
documented, committed.

## Next action
None — complete. Follow-ons remain open (RM3 §7): ready-meal vocabulary unification
(RM1 §6.2), fate of the ~300 authored generic ready meals (RM1 §6.3), cross-member
canonical identity (RM2A §7.1). None block anything.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete._
