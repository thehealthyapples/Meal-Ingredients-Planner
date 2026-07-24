# PLANNER_MEALS1 — Default Meal Curation

**Session ID:** `PLANNER_MEALS1_Default_Meal_Curation`
**Objective:** Curate the meals in the default Planner experience so a household would happily cook every dinner in a default week.
**Rollback ID:** `rollback/PLANNER_MEALS1-default-meal-curation-20260720` → `13fbe61a`
**Stage:** Complete — committed (`58613eab`), pushed; awaiting owner review
**Started & completed:** 2026-07-20

---

## Rollback

Tag on `13fbe61a` (COOKBOOK1). **Tree NOT clean at tag time** — one tracked file
modified, `CURRENT.md`'s automated Stop-hook heartbeat line; the tag does not
cover it. No other uncommitted work existed.

**Data rollback is separate from code rollback:** the seeded template rows are DB
state. Revert with
`git checkout <tag> -- seed/family-plan.json && npm run seed:family-plan`.

## The finding

The target was ambiguous — three things could be called "the default Planner
experience". It is the `is_default = true` template, reached at **Profile → "Load
The Healthy Apples Family 6-Week Meal Plan"** (`profile-page.tsx:403`).

**An exploration reported this feature as dead code** (`loadTemplateMutation` at
`weekly-planner-page.tsx:463` is defined and never called). True of the planner
page, false of the feature — `profile-page.tsx:1897` applies it behind a live
button. Accepting the claim would have abandoned the work as pointless. Checked
before acting.

The plan was **a 6-week plan that was 3 weeks played twice**: 42 slots, 26 distinct
meals. **8 lentil dhals across 11 slots**; weeks 2, 3 and 4 each *opened* on one.
Mussels under two identities (468 `Moules marinière`, 532 `Mussels Mariniere`),
paella under three. The generated import block 1555–1570 supplied **12 of 26**.

The root cause sits one layer below the meal choices: **17 of 42 slots carried no
`mealId`** and resolved by `sourceUrl`/title with `ORDER BY id DESC`. That fuzzy
fallback is why W6D4 served a household a recipe named
**`Lentil & sweet potato curry (Edited)`** — a user's edit artefact, shipped as a
default.

## Delivered

- **`seed/family-plan.json` rewritten** — 42 slots, **42 distinct meals**, every
  one pinned by `mealId`. Weekday/weekend rhythm; Friday deliberately the
  pleasurable slot. 9 of the previous 26 meals retained.
- **`package.json`** — added `seed:family-plan`. The seeder's own docstring told
  readers to run it and **it did not exist**; without it the curation is inert.
- **Seeded to dev DB** — 42/42 resolved, 0 skipped (was 25 pinned + 17 fuzzy).
- **Zero meal rows created, edited or deleted** — meal count 3207 before and after.
  Ownership, canonical foods and acquisition lanes untouched.

## Verification

42 distinct · 0 `(Edited)` · 0 fuzzy · **13 vegetarian / 11 vegan / 0 insufficient
evidence** by the platform's own `classifyDietLabels()` · ingredient reuse
**avg 10.7 anchors/week** (measured, 3+ meals per week) · 12 planner/meal/template/
safety test targets 🟢.

**Two failures, both PRE-EXISTING and verified against the tag by `git stash`:**
`plan2-planner-intelligence-activation` (identical 20 passed / 3 failed) and
`typecheck:ci` (identical 16 regressions, all in a file this change never touches).
Reported, not absorbed, not fixed.

**Not done:** full `npm test` (~160 targets) — 12 relevant ones selected instead.
App not launched; no UI screenshot. Production not seeded.

## Judgement calls

- **Selected from existing meals rather than authoring new ones.** The brief
  forbade duplicate meals and duplicate ownership; selection satisfies both
  absolutely, authoring would have risked both.
- **Did not curate around `meals.servings`** — 71 of 186 imports claim 1 serving
  and **two claim 250**. Fitting a family plan to broken metadata encodes the bug.
- **Filed at the requested root path**, not `planner/`. The structure gate fails
  either way (28 loose reports predate this); moving one file would not turn it
  green, only orphan this report from its siblings.

## Next action

**Owner to review** `docs/implementation/planner/PLANNER_MEALS1_DEFAULT_MEAL_CURATION.md`
— specifically the 42 dinners against the success test, *"I'd happily cook every
one of those."* Then run `npm run seed:family-plan` in **production**; the curation
is live in dev only.

Carried: **the default plan rests on meals owned by 8 private accounts** (users 1,
28, 38, 42, 56, 57, 60, 64), not the platform user — if user 57 deletes
`Steak Diane`, the plan loses a dinner. It cannot move to the system pool until
COOKBOOK1's finding is resolved: of the 500 library recipes, **10 are authored and
490 are template output**. Also open: **0 of 186 `user_import` meals carry
`diet_types`** (not a safety hole — `shouldExcludeRecipe` reads ingredients — but
any diet-filtered surface will under-report the plan); `servings` repair; and
seasonality, which is not expressible while the template has no anchor date.
