VEGAN BOLOGNESE FILTER FAILURE INVESTIGATION: COMPLETE

**Date:** 2026-06-06
**Type:** Investigation only — 🟢 GREEN
**Subject:** "The best spaghetti bolognese recipe" (beef + smoked streaky bacon) shown in a Vegan plan after the diet hard-filter fix (commit 1e67eff).

---

## Rollback identifier

- **Tag:** `rollback-bolognese-investigation-2026-06-06`
- **Commit:** `1e67eff` (`feat(smart-planner): enforce Profile dietPattern as hard filter via dietRules`)
- Working tree at start: only untracked files (investigation docs + the prior report). No tracked files modified. **Code changes made: NONE.** Temporary DB query scripts were created in-workspace to read data, then deleted.

---

## Headline finding

**The hard-filter fix works correctly and is not at fault.** The bolognese never
went through the Smart Planner generation path. It was placed in the user's
planner by **applying the default 6-week meal-plan template** — a path that
writes meals straight into `planner_entries` and **never calls the diet filter**.
What the user is viewing is **persisted/restored planner data**, not a fresh
Smart Suggest result.

---

## Was the result old/restored or fresh?

**Restored / persisted — not a fresh generation.** Meal 1478 is stored in user 1's
saved planner (`planner_entries` id 556 = Week 5 dinner, id 686 = Week 1 dinner,
household 44). Those rows originate from the default template
"The Healthy Apples Family 6 week meal plan" (created 2026-02-27, **before** the
fix), whose `meal_plan_template_items` place meal 1478 at week 1/day 3/dinner and
week 5/day 7/dinner — an exact match to the user's planner entries.

---

## Runtime dietPattern

**`req.user.dietPattern = "Vegan"` — present and correct.**
- `users.diet_pattern = "Vegan"`, `users.diet_restrictions = []` (user 1).
- `storage.getUser()` does `db.select().from(users)` (all columns), so passport's
  `deserializeUser` populates `req.user.dietPattern`. dietPattern is **not** missing
  at runtime. (User prefs also carry `diet_types: [...,"vegan"]`.)

---

## Meal record

| Field | Value |
|---|---|
| meal id | **1478** |
| user_id | 1 |
| name | The best spaghetti bolognese recipe |
| meal_source_type | **`scratch`** (displays as "My Meals") |
| meal_format | recipe |
| category_id | 3 |
| diet_types | `[]` |
| ingredients | incl. **"4 rashers smoked streaky bacon finely chopped"**, **"500g beef mince"**, "1 beef stock", "75g parmesan…", "125ml red wine" |
| is_drink / drink_type | false / null |

---

## candidateDietExcluded result

Run against the **real** meal-1478 data with `dietPattern="Vegan"`:

| Input | Result |
|---|---|
| `candidateDietExcluded(meal1478, "Vegan", [])` (category null) | **true → EXCLUDED** |
| `candidateDietExcluded(meal1478, "Vegan", [])` (name only, no ingredients) | false (no meat word in title) |
| `candidateDietExcluded(meal1478, null, [])` (no profile) | false (gate inert) |

The filter **correctly excludes** this meal when invoked. The only ways it returns
false are an empty-ingredient candidate or a null dietPattern — neither applies here.

---

## shouldExcludeRecipe result

`shouldExcludeRecipe("<name + ingredients>", { dietPattern: "Vegan", dietRestrictions: [] })`
→ **true.** "beef" and "bacon" are both in `MEAT_KEYWORDS`; "parmesan" is in
`DAIRY_KEYWORDS`. The shared engine recognises this meal as non-vegan exactly as
recipe search would.

---

## Root cause

**The diet hard filter is only wired into the Smart Suggest generation pipeline
(`generateSmartSuggestion`). The bolognese entered the planner through a different,
unfiltered path: meal-plan template import.**

- `POST /api/plan-templates/:id/import` → `storage.importTemplateItems(...)`
  copies template items into `planner_entries`, filtering **only** by scope
  (week / day / meal). It performs **no dietary filtering** of any kind.
- The default 6-week template contains a beef/bacon bolognese; applying it to a
  Vegan user writes that meal directly into their planner.
- Additionally, the affected entries are **persisted and pre-date the fix** — the
  filter is not retroactive, so it cannot remove meals already saved.

So this is **not** a regression or a hole in the new filter. It is **missing
coverage**: diet enforcement exists at *generation* time but not at *template-import*
time (nor as a cleanup of pre-existing saved entries).

### Answers to the key questions
1. **Is the hard-filter fix actually running?** Yes, and it correctly excludes meal 1478 — but only on the Smart Suggest path.
2. **Is the user viewing an old/restored plan?** Yes — persisted planner entries sourced from a pre-fix template import.
3. **Is dietPattern missing at runtime?** No — it is "Vegan".
4. **Is "My Meals" bypassing the filter?** Not via source type — Smart Suggest filters My Meals correctly. The bypass is the **template-import path**, which never calls the filter.
5. **Is the filtering text missing ingredients/category?** No — ingredients are present and the filter returns true.

---

## Recommended fix (smallest safe)

Reuse the **same** `candidateDietExcluded` / `dietRules.shouldExcludeRecipe`
single source of truth in the template-import path:

- **Primary:** in `storage.importTemplateItems` (and `applyWeekTemplate`), load the
  importing user's `dietPattern` + `dietRestrictions` and skip any template item
  whose meal fails the diet filter, incrementing `skippedCount` (the return shape
  already has it). This closes the class for all diets, all templates, mirroring
  the planner fix. Risk: 🟡 LOW–MEDIUM (additive skip; reuses tested function;
  verify a strict diet on a meaty template still imports its compliant items and
  surfaces the skip count to the UI).
- **Optional cleanup (separate, AMBER):** a one-off pass to flag/remove existing
  non-compliant `planner_entries` for users whose profile now conflicts — or a
  read-time "not suitable for your diet" badge on saved entries. Not required to
  stop new occurrences.

Out of scope here (do not bundle): scoring/keyword changes — none needed; the
engine already classifies this meal correctly.

---

## Risk rating

- **This investigation:** 🟢 GREEN (read-only).
- **Recommended fix:** 🟡 LOW–MEDIUM (additive filter on import; reuses existing
  trusted `dietRules`; main risk is template-pool thinning for strict diets, which
  should be surfaced via the existing `skippedCount`).

---

## DATA IMPACT DECLARATION
- Reads existing data: **Yes**
- Writes new data: **No**
- Changes meaning of existing data: **No**
- Requires backfill: **No** (a cleanup pass would, but that is a separate, optional change)

## CODE CHANGES MADE: NONE
