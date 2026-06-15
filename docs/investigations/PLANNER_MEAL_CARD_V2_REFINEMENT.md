# Planner Meal Card V2 — Refinement

**Date:** 2026-06-15
**Rollback point:** tag `rollback/meal-card-v2-refinement` @ commit `1090d28`
(Working tree had pre-existing tier4 shell-recovery work; it was committed as the
`1090d28` checkpoint so the rollback baseline is clean before this task began.)

---

## Objective

Two issues, fixed without touching planner logic, scoring, shell recovery, the DB
schema, or nutrition-boost behaviour:

1. **Metadata write-path** — future shell-created meals must carry the template's
   `styleTags` and `suitableSlots` (plus `primarySlot` / `energyBand`) on the meal
   row, so Planner Meal Card V2 can render their chips and variety info.
2. **Visual density** — the V2 card was too text-heavy. Repurpose it into a calm,
   compact card led by variety dots, with at most two short nutrition labels.

---

## 1. Metadata write-path fix

### Root cause

Accepted Smart Suggest results (including Tier-4 shell-recovery candidates) are
persisted through `POST /api/smart-suggest/auto-import` → `autoImportExternalMeal`.
That path created the meal with `mealSourceType: "scratch"` and **never wrote**
`styleTags` / `suitableSlots` / `primarySlot` / `energyBand`. The meal columns
already exist (`shared/schema.ts`), they were simply left at their empty defaults,
so freshly-applied shell meals showed no chips or variety metadata on the card.

### Fix

`autoImportExternalMeal` already resolves a meal template by name. For a shell
candidate (`name === template.name`) that lookup returns the **shell template**,
which carries the full Hybrid Meal Occasion metadata. After linking the template,
we now copy that metadata onto the new meal row.

- `server/storage.ts` — new `applyTemplateMetadataToMeal(mealId, template)` (added
  to the `IStorage` interface and `DatabaseStorage`). A single
  `db.update(meals).set({ styleTags, suitableSlots, primarySlot, energyBand })`.
  Legacy templates with empty metadata write empty defaults (no-op). **No schema
  change** — the columns already exist; this is a write, not a migration.
- `server/lib/auto-import-service.ts` — after `updateMealTemplateId`, call
  `applyTemplateMetadataToMeal(meal.id, template)`. Also added a small
  dependency-injection seam (optional `storage` param, defaults to the real one)
  so the write-path is unit-testable without a DB.

External (non-shell) candidates resolve to a freshly-created bare template and
harmlessly receive empty metadata — unchanged user-visible behaviour.

The pre-existing-meal early-return branch is intentionally left alone: it returns
an already-existing meal and is not a "future shell-created meal".

---

## 2. UI refinement — `client/src/components/PlannerMealCard.tsx`

### Before

```
Meal title
[Family Table] [Comfort]
Veg • Fruit • Whole grains          ← long wrapped nutrition text line
Suitable for: Lunch • Dinner        ← extra line for multi-slot shells
```

Three to four stacked text rows; nutrition was a comma/bullet text list using a
9-category model independent of the legend; long labels ("Healthy fats", "Whole
grains") wrapped on narrow planner columns.

### After

```
Meal title
[Family Table] [Comfort]            ← max 2 chips
● ● ●  Veg • Herbs                  ← max 3 dots + up to 2 short labels
```

- Variety is now **compact dots** that mirror the planner top legend exactly
  (same five-category `VarietyScore` model + colours from
  `nutrition-variety-chips.tsx`): Fruit (rose), Veg (green), Grains (amber),
  Herbs (violet), Fats (teal).
- Dots are paired with **at most two terse labels** ("Fats", not "Healthy fats").
- The long nutrition text line and the suitable-for line are **removed** from the
  compact card (suitable-for hidden for now to avoid added height).
- Title still leads; chip styling/priority and the parent-rendered boost line
  (`↳ N boost ideas` / `Boosted`) are unchanged.

### Responsive behaviour

| Tier    | Breakpoint   | Chips        | Variety line          |
|---------|--------------|--------------|-----------------------|
| Mobile  | base (<640)  | 1 chip       | dots only             |
| Tablet  | `sm` (≥640)  | up to 2 chips| dots + 1 short label  |
| Desktop | `lg` (≥1024) | 2 chips      | dots + 2 short labels |

Labels use `hidden sm:inline` (first) and `hidden lg:inline` (second); dots always
render. The variety line is a single fixed-height row — **no card-height growth**
versus the old single nutrition text line (it replaces two old lines with one).

---

## Out of scope (confirmed unchanged)

Planner logic, scoring, shell recovery selection, DB schema, nutrition-boost
behaviour, and the planner grid layout were not touched. The top variety legend is
unchanged (the card now references its colours/model for consistency).

---

## Tests

- **New:** `server/tests/test-shell-meal-metadata-write-path.ts` — 11 assertions,
  all pass. Verifies a shell candidate's `styleTags`/`suitableSlots`/`primarySlot`/
  `energyBand` are copied onto the created meal, and that external candidates get
  empty defaults.
- **Regression:** `test-hybrid-meal-occasion.ts` (159 pass),
  `test-tier4-shell-recovery-activation.ts` (26 pass).
- **Type-check:** no new errors in changed files (`PlannerMealCard.tsx`,
  `auto-import-service.ts`, `storage.ts`); pre-existing errors live only in
  unrelated scripts/test fixtures.
- **Build:** `vite build` succeeds.
