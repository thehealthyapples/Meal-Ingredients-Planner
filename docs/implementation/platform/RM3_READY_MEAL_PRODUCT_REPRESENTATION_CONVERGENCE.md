# RM3 — Ready Meal Product Representation Convergence

**Type:** Implementation (retires debt the RM1 investigation identified). Per
`docs/architecture/README.md`, investigations *discover*; implementations *build and
maintain*. This document records what was retired, how it was verified safe, and what
remains.

**Date:** 2026-07-15
**Session ID:** `RM3_Ready_Meal_Product_Representation_Convergence`
**Rollback:** `rollback/RM3-ready-meal-product-representation-convergence-20260715` → `b7ddc442`
**Governing basis:** `docs/investigations/platform/RM1_CANONICAL_READY_MEAL_ROLE.md`
(headline recommendation §2, evidence §3.3, migration impact §6, workstream RM3 §8);
`ARCHITECTURE_PRINCIPLES.md` Principle 1 (one identity), Principle 8 (retire on
introduction / converge away duplicates); Source-of-Truth Register Domain 13.
**Status:** Complete.

---

## 1. Mission

Retire the **duplicate ready-meal product representation** and converge ready meals onto
the existing canonical `meals` identity:

- `meal_template_products` (a second, denormalized per-template product store)
- `server/meal-resolution-service.ts` (its only reader — a scratch-vs-ready-meal scoring engine)
- the orphaned Analyser **"Link to template"** writer flow and its routes

**without** creating a new Product entity, migrating generic ready meals, redesigning the
Planner or Cookbook, or changing shopping resolution — and while preserving the
Analyser→Planner journey (RM2A), barcode identity reuse, shopping, nutrition, Apple Score
and dietary safety behaviour.

This is RM1 §8's follow-on debt convergence: pure retirement of a store with **no live
consumer**, expressible — where a genuine "cook-or-buy" need ever arises — as two `meals`
rows sharing a `meals.mealTemplateId` (an FK that already exists).

---

## 2. Trace — every writer and consumer of `meal_template_products`

The retirement is only safe because the store is orphaned. The full trace (confirming
RM1 §3.3):

| Direction | Path | Live? |
|---|---|---|
| **Writer** | `storage.addMealTemplateProduct` ← `POST /api/meal-templates/:id/products` ← client `linkToTemplate` mutation (`products-page.tsx`) ← "Create Meal Template" button in `AnalyserDetailV2` | The *only* writer. It created a throwaway `meal_templates` shell + one denormalized product row with `store: null`. **Nothing read what it wrote.** |
| **Reader** | `storage.getMealTemplateProducts` ← `server/meal-resolution-service.ts` (`resolveTemplate` / `resolveAllTemplatesForPlan`) behind `POST /api/meal-templates/:id/resolve` | **No client caller.** `resolveAllTemplatesForPlan` was never route-wired. |
| **Reader** | `GET /api/meal-templates/:id` embedded a `products` field | **No client read it** — the Analyser/Planner render from `meals`, never from `template.products`. |
| **Reader** | `GET /api/meal-templates/:id/products` | **No client caller.** |
| **Delete** | `storage.removeMealTemplateProduct` ← `DELETE /api/meal-template-products/:id` (admin) + a cascade inside `deleteMealTemplate` | Admin-only; no client management UI exists. |

**Conclusion:** no live feature reads or depends on `meal_template_products`. The
resolution engine has **no required live consumer**. There was therefore **no legitimate
remaining dependency to replace** — the canonical `meals` + `mealTemplateId` path already
carries every downstream fact (RM1 §5), and the Analyser→Planner journey (RM2A) already
resolves products by barcode over `meals`, never through these routes. Safe to retire in
full.

---

## 3. What was retired (files / routes / data)

### 3.1 Schema — `shared/schema.ts`
- Removed the `mealTemplateProducts` `pgTable` definition, `insertMealTemplateProductSchema`,
  and the `MealTemplateProduct` / `InsertMealTemplateProduct` types. Replaced with a
  tombstone comment pointing at the drop migration and RM1 §2 (do not reintroduce).

### 3.2 Storage — `server/storage.ts`
- Removed the three `IStorage` methods and their implementations:
  `getMealTemplateProducts`, `addMealTemplateProduct`, `removeMealTemplateProduct`.
- Removed the `mealTemplateProducts` cascade delete from `deleteMealTemplate` (the table
  is gone; nothing to cascade).
- Dropped the now-unused `MealTemplateProduct`, `InsertMealTemplateProduct`,
  `mealTemplateProducts` imports.

### 3.3 Routes — `server/routes.ts`
- Retired four routes, replaced with a tombstone comment:
  - `GET  /api/meal-templates/:id/products`
  - `POST /api/meal-templates/:id/products`
  - `DELETE /api/meal-template-products/:id`
  - `POST /api/meal-templates/:id/resolve` (the resolution-engine route)
- Dropped the `products` field from `GET /api/meal-templates/:id` (it embedded the retired
  store; no client read it).
- Dropped the `insertMealTemplateProductSchema` import and the dynamic
  `import("./meal-resolution-service")`.
- **Preserved** `POST /api/meal-templates` (authenticated, not admin). Its original caller
  was the retired "Link to template" flow, but it is generic `meal_templates` (shell)
  creation on live platform content; the guard split (authenticated create; admin
  patch/delete) stays load-bearing and is still tested.

### 3.4 Resolution engine — `server/meal-resolution-service.ts`
- **Deleted.** Its only route (`/resolve`) is gone and it had no other importer.

### 3.5 Client — Analyser "Link to template" writer
- `client/src/pages/products-page.tsx` — removed the `linkToTemplate` mutation and its two
  wiring points (`onLinkToTemplate`, `linkToTemplatePending`).
- `client/src/components/analyser/AnalyserDetailV2.tsx` — removed the "Create Meal
  Template" button, its `onLinkToTemplate` / `linkToTemplatePending` props, and the now-
  unused `Layers` icon import. Adding an analysed product to the plan flows entirely
  through **"Add to Week"** (RM2A → resolve-or-create a `meals` identity by barcode).

### 3.6 Migration — `server/migrations/runner.ts`
- Appended `2026-07-15_rm3_retire_meal_template_products`: `DROP TABLE IF EXISTS
  meal_template_products`. Idempotent; the table has no inbound foreign keys and no live
  reader/writer remains. The historical drizzle snapshot
  (`migrations/0000_conscious_nuke.sql`) is left untouched — it is an immutable
  point-in-time artefact; the runner's `DROP … IF EXISTS` is the operative retirement.

### 3.7 Capability registry & read-port documentation
- `server/intelligence/capability-registry.ts` — removed `meal-resolution-service.ts` from
  the `owningService` strings of the Planner, Cookbook/Meals and Diary capabilities (it no
  longer exists). No runtime behaviour depends on these strings.
- `server/intelligence/handlers/meals-read-port.ts` — updated the OWNER-CORRECTION comment
  to drop the reference to the deleted service.

### 3.8 Tests — `server/tests/test-trust1-s3-secure-meal-template-endpoints.ts`
- Removed the assertions for the four retired routes (anonymous LINK/UNLINK/RESOLVE
  refusal, household LINK success, admin RESOLVE success, the static-audit rows for the
  product/resolve routes, and the stale "GET …/products still reachable" public-read
  assertion). The surviving `POST /api/meal-templates` create route keeps both its
  anonymous-refused and non-admin-household-succeeds assertions — the guard split RM3 did
  not touch.

### 3.9 Source-of-Truth Register — Domain 13
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — Domain 13's
  authoritative source narrowed from `meal_templates + meal_template_products` to
  `meal_templates`, with an RM3 note recording the retirement and why.

---

## 4. Preserved user journeys (verify points)

| Requirement | How it is preserved |
|---|---|
| **Analysed products can still be added to the Planner** | Untouched: the RM2A "Add to Week" / "Add to Planner" path (resolve-or-create a `meals` identity by barcode → normal `planner_entries` row). RM3 removed only the *dead* "Link to template" writer, never a plannable path. `test:rm2a-analyser-to-planner` 14/14. |
| **Previously added ready meals remain discoverable and reusable from the Planner** | User-reusable ready meals are `meals` rows (Domain 12) — created by "Save to Cookbook" / RM2A, surfaced in the Cookbook and addable to any planner slot by `mealId`. **None of that is `meal_template_products`.** The dropped table held only orphaned rows written by the "Link to template" flow that no surface ever read, so nothing a user could discover or reuse depended on it. `meals` and `meal_templates` are untouched. |
| **No duplicate ready-meal identities are created** | RM3 *removes* a duplicate identity space; it adds none. RM2A's barcode idempotency over `meals` is unchanged. |
| **Barcode identity reuse** | Owned by `storage.resolveOrCreateProductMeal` over `meals` (RM2A) — not touched. |
| **Shopping / nutrition / Apple Score / dietary safety** | All resolve from the one `meals` identity; RM3 changed no shopping resolution, no nutrition, no scoring, no allergen path. A ready-meal line still emits as one `unit:'pack'` item; the barcode still rides along as the preferred-match hint. |

---

## 5. Data impact

- **One table dropped:** `meal_template_products`. It had **no inbound foreign keys** and
  **no live reader/writer**.
- **No generic ready meals migrated.** None were ever stored here as canonical identities
  — the ~300 authored generic ready meals live in `meals` (Domain 12) and are untouched
  (RM1 §3.1). The only rows in the dropped table were throwaway per-product rows from the
  orphaned "Link to template" flow, referenced by nothing.
- **`meal_templates` untouched.** The shell catalogue and its seeds remain the Domain 13
  authoritative source.
- **No new entity, no new key space, no schema addition.** Pure subtraction.

---

## 6. Verification

**Typecheck** — `tsc --noEmit`: **zero errors in any RM3-touched file**, and no error
anywhere referencing a removed RM3 symbol (`MealTemplateProduct`, `mealTemplateProducts`,
`meal-resolution-service`, `resolveTemplate`). Pre-existing baseline errors in the working
tree belong to other concurrent sessions, not RM3.

**Full-repo reference sweep** — no live (non-comment) reference to
`meal_template_products` / `mealTemplateProducts` / `MealTemplateProduct` /
`meal-resolution-service` / `getMealTemplateProducts` / `addMealTemplateProduct` /
`resolveTemplate` / `resolveAllTemplatesForPlan` remains in `*.ts` / `*.tsx`. The only
matches are RM3 tombstone comments and the immutable `0000_conscious_nuke.sql` snapshot.

**Tests — all green against the real database:**

| Suite | Result |
|---|---|
| `test:trust1-s3-secure-meal-template-endpoints` (directly modified) | 30 / 30 |
| `test:rm2a-analyser-to-planner` (Analyser→Planner journey) | 14 / 14 |
| `test:intelligence-templates-binding` | 56 / 56 |
| `test:intelligence-analyser-binding` | 30 / 30 |
| `test:intelligence-planner-binding` | 31 / 31 |
| `test:intelligence-meals-binding` | 72 / 72 |
| `test:intelligence-shopping-binding` | 38 / 38 |
| `test:product-dedup` | 76 / 76 |

Each mission verify point is proven: no live feature depends on `meal_template_products`
(trace §2 + reference sweep); analysed products still reach the Planner and previously
added ready meals remain discoverable/reusable (RM2A + meals suites); no duplicate
identity is created (RM3 only removes one); planner/analyser/shopping regressions pass.

---

## 7. Remaining gaps

1. **Ready-meal vocabulary unification** (`mealSourceType ∈ {ready_meal, openfoodfacts}`
   vs `isReadyMeal` vs `mealFormat='ready-meal'`, RM1 §6.2) — a "one canonical identity"
   cleanup, still open. Not a data migration; deliberately out of RM3's retirement scope.
2. **Fate of the ~300 authored generic ready meals** (RM1 §3.1 / §6.3) — they carry no
   nutrition/UPF/allergens and render as gaps. Keep as generic intents or enrich: a
   product decision, recorded so it is not rediscovered.
3. **Cross-member canonical identity** (RM2A §7.1) — barcode resolution is per household
   member by design; a single shared canonical identity per barcode remains a deliberate
   ownership decision, untaken.

None of these block RM3; all are recorded so the next reader does not rediscover them.

---

## 8. Milestone commit

Commit: **`RM3 — Ready Meal Product Representation Convergence`** (see git log). Files:
`shared/schema.ts`, `server/storage.ts`, `server/routes.ts`,
`server/meal-resolution-service.ts` (deleted), `server/migrations/runner.ts` (RM3
migration only), `server/intelligence/capability-registry.ts`,
`server/intelligence/handlers/meals-read-port.ts`,
`client/src/pages/products-page.tsx`,
`client/src/components/analyser/AnalyserDetailV2.tsx`,
`server/tests/test-trust1-s3-secure-meal-template-endpoints.ts`,
`docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Domain 13 only), this
document, and the session run file. Concurrent sessions' unrelated working-tree changes
were deliberately left unstaged.

---

_Rollback reference: `rollback/RM3-ready-meal-product-representation-convergence-20260715` → `b7ddc442`._
