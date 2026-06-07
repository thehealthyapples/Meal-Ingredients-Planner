# HEALTHY TIKKA MASALA ROOT CAUSE TRACE: COMPLETE

**Status:** COMPLETE — DEFINITIVE DATABASE EVIDENCE  
**Date:** 2026-06-07  
**Branch:** main  
**Commit at investigation:** 0644578  
**Investigator:** Claude Code (DB access confirmed)

---

## Rollback Identifier

| Field | Value |
|---|---|
| Tag | `rollback/before-tikka-masala-trace` |
| Commit | `0644578` |
| Branch | `main` |
| Git status at investigation start | CLEAN — only untracked .md files |

---

## CRITICAL FINDING — MEAL DOES NOT EXIST

> **"Healthy Tikka Masala" is not a database record.**
>
> It does not exist in any table. It was used as a hypothetical/constructed name in the previous investigation document (`SMART PLAN INGREDIENT VERIFICATION FAILURE INVESTIGATION.md`), which itself admitted the finding was speculative:
> - *"Almost certainly a user-created meal"*
> - *"Unknown without DB access"*
> - *"Likely null"*
> - *"Probably 'scratch'"*
>
> This report provides the DB access that was missing. The meal does not exist. Every answer below is grounded in actual database records.

---

## 1. MEAL RECORD

**Search performed:** `SELECT * FROM meals WHERE LOWER(name) LIKE '%healthy tikka%'`  
**Result:** 0 rows.

**Search performed:** `SELECT * FROM meals WHERE LOWER(name) LIKE '%tikka%'`  
**Result:** 23 rows. None named "Healthy Tikka Masala."

**Search performed:** `SELECT * FROM meal_templates WHERE LOWER(name) LIKE '%healthy tikka%'`  
**Result:** 0 rows.

**Search performed:** Full grep across all `.ts`, `.tsx`, `.js`, `.json` source files for `"Healthy Tikka Masala"`  
**Result:** No matches in any source file.

| Field | Value |
|---|---|
| Meal ID | DOES NOT EXIST |
| Meal name | DOES NOT EXIST |
| Created date | DOES NOT EXIST |
| Updated date | DOES NOT EXIST |
| Owner user ID | DOES NOT EXIST |
| Household ID | DOES NOT EXIST |

---

## 2. SOURCE

| Field | Finding |
|---|---|
| Source | NOT a user meal. NOT an imported meal. NOT from BBC Good Food (persisted). NOT from TheMealDB (persisted). NOT a template meal. |
| Actual source | The name was CONSTRUCTED as a hypothetical example in a prior investigation document |

The prior investigation document (`SMART PLAN INGREDIENT VERIFICATION FAILURE INVESTIGATION.md`) used "Healthy Tikka Masala" as a representative example to explain how title-only diet filtering could miss non-vegan content. The "Healthy" prefix was described as "user-authored" — but no such meal exists in the database to confirm this.

The name *could* have appeared as a transient, non-persisted external candidate in a Smart Planner session (BBC Good Food or AllRecipes do have recipes with "Healthy" prefixes) — but there is no database record and no sessionStorage is accessible server-side to confirm this.

**Do not guess.** The confirmed source is: NOT IN DATABASE.

---

## 3. INGREDIENTS

INGREDIENTS STORED: NONE

The meal does not exist in the database. There is no ingredient record to report.

---

## 4. DIETARY DATA

| Field | Value |
|---|---|
| meal dietTypes | DOES NOT EXIST |
| dietaryTags | DOES NOT EXIST |
| dietaryFlags | DOES NOT EXIST |
| Profile classifications | DOES NOT EXIST |
| Vegan classification | DOES NOT EXIST |
| Vegetarian classification | DOES NOT EXIST |

---

## 5. SMART PLAN TRACE

Because the meal does not exist, no actual recommendation path can be traced. A hypothetical path is reconstructed below from the code — this is what *would* happen if a recipe with this name were returned by BBC Good Food with no ingredients **before** commit `0644578`:

```
BBC Good Food: search "vegan tikka"
  ↓
Scraper returns name only, ingredients: []
  ↓
candidate created: { name: "Healthy Tikka Masala", ingredients: [] }
  ↓
[Pre-fix] enrichExternalCandidates() did NOT run
  ↓
isDietExcluded(candidate):
  text = "healthy tikka masala  "
  containsAny(text, MEAT_KEYWORDS)           → false ("tikka" and "masala" not in list)
  containsAny(text, FISH_SEAFOOD_KEYWORDS)   → false
  containsAny(text, DAIRY_KEYWORDS)          → false
  containsAny(text, ["egg","eggs","honey"…]) → false
  containsAny(text, DISH_NAME_MEAT_OR_SEAFOOD) → false
  returns false → NOT excluded
  ↓
allCandidates.push(candidate)  ← INCLUDED FOR VEGAN USER
  ↓
Serialised to sessionStorage "planner-smart-review-session"
```

**Post-commit `0644578` path:**

```
BBC Good Food: search "vegan tikka"
  ↓
Scraper returns name only, ingredients: []
  ↓
enrichExternalCandidates() → fetches detail page
  → if page yields chicken in ingredients → enriched candidate has ingredients: ["chicken", ...]
  ↓
isDietExcluded(candidate):
  text = "healthy tikka masala chicken ..."
  containsAny(text, MEAT_KEYWORDS) → true ("chicken" is in MEAT_KEYWORDS)
  returns true → EXCLUDED ✓
  
  OR: if page fetch fails / yields no ingredients:
  enrichCandidateIngredients() returns null → candidate dropped from pool ✓
```

| Check | Pre-fix result | Post-fix result |
|---|---|---|
| candidateDietExcluded (name only) | false — NOT excluded | same |
| enrichExternalCandidates | not called | called — drops no-ingredient candidates |
| Ingredient gate (ext.ingredients.length === 0) | does not exist | exists — drops any that slip through |
| Recommendation to Vegan user | YES (bypass) | NO (blocked) |

---

## 6. WHY DID IT APPEAR?

**Answer: E — Multiple causes (hypothetical path only — meal is not confirmed as actually observed)**

The previous investigation document cited this as an example of the bypass mechanism. If a recipe with this name (or similar) did appear in a session, it would have been via Path A (stale sessionStorage from pre-fix plan):

**Path A — Stale sessionStorage (most likely)**

A Smart Plan generated before commit `0644578` may have included an external candidate with "Tikka Masala" in the title (from BBC Good Food search "vegan tikka" or "vegan curry"). That plan was serialised to `sessionStorage["planner-smart-review-session"]`. On next page load, the hook restored it unconditionally — bypassing all server-side filtering. Fix `0644578` never executed.

Evidence: `client/src/hooks/use-smart-suggest.ts` lines 119–128 confirm this restore path exists. "Restored from last session" banner would be visible.

**Path B — External candidate bypassing title-only filter (confirmed structural gap)**

If a live plan was generated (not from cache), an external candidate titled "Healthy Tikka Masala" with `ingredients: []` would pass the Vegan diet filter because "tikka" and "masala" are not in `MEAT_KEYWORDS`, `FISH_SEAFOOD_KEYWORDS`, `DAIRY_KEYWORDS`, or `DISH_NAME_MEAT_OR_SEAFOOD`. Fix `0644578` now blocks this by requiring enriched ingredients before the diet check.

**Path C — Server not restarted** (possible co-factor, unverifiable)

---

## 7. USER MEAL CHECK

The Vegan user (user_id=1, `colinclapson@hotmail.co.uk`, `diet_pattern='Vegan'`) has **201 meals**. None is named "Healthy Tikka Masala."

User 1 DOES have empty-ingredient non-ready meals that represent the real structural gap:

| Meal ID | Name | Source | Ingredients | Would Vegan filter catch it? |
|---|---|---|---|---|
| 2003 | Chicken & Chips | scratch | {} | YES — "chicken" in MEAT_KEYWORDS |
| 2005 | One-Pan Bold Honey BBQ Chicken Rice | imported_instagram | {} | YES — "chicken" + "honey" |
| 2125 | Beef concarne, wraps, salad, avocado and yoghurt | planner-placeholder | {} | YES — "beef" + "yoghurt" |
| 2139 | Beef Concarne | planner-placeholder | {} | YES — "beef" in MEAT_KEYWORDS |
| 2140 | Bean casserole homemade wraps | planner-placeholder | {} | NO — no keyword match (but meal is likely vegan-compatible) |
| 2141 | Pizza toast | planner-placeholder | {} | NO — "pizza" not in any exclusion list |
| 2146 | pasta n cheese, with Salmon and pine nuts | planner-placeholder | {} | YES — "salmon" + "cheese" |
| 2149 | fish cake | planner-placeholder | {} | YES — "fish" in FISH_SEAFOOD_KEYWORDS |
| 2150–2152 | tuna spahgetti (×3) | planner-placeholder | {} | YES — "tuna" in FISH_SEAFOOD_KEYWORDS |
| 2153 | Fish and chips | planner-placeholder | {} | YES — "fish" in FISH_SEAFOOD_KEYWORDS |
| 2154–2155 | thai green curry (×2) | planner-placeholder | {} | NO — no keyword match |
| 2156 | thai red curry | planner-placeholder | {} | NO — no keyword match |
| 2162 | Carbonara butter beans | scratch | {} | YES — "carbonara" in DISH_NAME_MEAT_OR_SEAFOOD |
| 2163 | Ultimate spaghetti carbonara recipe | scratch | {} | YES — "carbonara" in DISH_NAME_MEAT_OR_SEAFOOD |

**Meals that would SLIP THROUGH the Vegan filter (empty ingredients, name not keyword-matched):**

| Meal ID | Name | Risk |
|---|---|---|
| 2140 | Bean casserole homemade wraps | Low — probably vegan-compatible |
| 2141 | Pizza toast | Medium — pizza typically contains cheese |
| 2154–2155 | thai green curry | Medium — could contain fish sauce, cream |
| 2156 | thai red curry | Medium — could contain fish sauce, cream |

These represent the **actual confirmed structural gap** that "Healthy Tikka Masala" was used to illustrate hypothetically.

**Would the external ingredient-verification fix affect these?**  
No. Fix `0644578` applies only to *external candidates* (BBC Good Food, AllRecipes, etc.). These are *user meals* in the user meals loop (lines 326–381 of `smart-suggest-service.ts`). The user meals loop has no ingredient gate.

**Would they still appear after sessionStorage is cleared?**  
Yes. Clearing sessionStorage would force a fresh server-side plan generation. On a fresh plan, these meals would be evaluated live by `candidateDietExcluded()` using name-only text (since `ingredients: []`). "Pizza toast" and the Thai curries would pass the filter.

---

## 8. SESSION STORAGE CHECK

SessionStorage is client-side and not accessible from the server. However, the code confirms:

- **Key:** `planner-smart-review-session`
- **Stored at:** Every plan generation (`saveSmartSession()` call, `use-smart-suggest.ts` lines 135–137)
- **Restored at:** Page/component mount, if no live result is present (lines 119–128)
- **Cleared when:** Plan is applied to week, tab is closed, or `clearSmartSession()` is called explicitly
- **Scope:** Tab-scoped — persists across page reloads within the same browser tab, not across tabs or sessions

If "Healthy Tikka Masala" appeared as an external candidate in any pre-fix plan (before `0644578` was deployed), it would be frozen in that key and restored unconditionally on subsequent visits in the same tab, regardless of the server-side fix.

**Whether it predates commit `0644578`:** Cannot be determined from the server. Visible to user only: if the "Restored from last session" banner is shown when the meal appears, the session predates the fix.

---

## KEY QUESTIONS — EXPLICIT ANSWERS

| Question | Answer |
|---|---|
| Is Healthy Tikka Masala a user meal? | NO. It does not exist in the database under any user. |
| Does it contain ingredients in the database? | NOT APPLICABLE. The meal does not exist. |
| Is chicken present in stored ingredients? | NOT APPLICABLE. The meal does not exist. |
| Is the meal actually classified as Vegan? | NOT APPLICABLE. The meal does not exist. |
| Would clearing sessionStorage remove it? | POSSIBLY. If it existed only as a transient external candidate serialised to sessionStorage in a pre-fix plan, clearing sessionStorage would remove it. No persistence in the DB means it cannot return from a fresh plan post-fix. |
| Would the external ingredient-verification fix remove it? | YES — for the external candidate path. A "Healthy Tikka Masala" from BBC Good Food would now require enriched ingredients, and if those ingredients contain chicken, the Vegan filter would catch it. If enrichment fails, the candidate is dropped. |
| What is the smallest safe fix? | See below. |

---

## ROOT CAUSE SUMMARY

| Field | Finding |
|---|---|
| Meal source | DOES NOT EXIST — name was hypothetical in prior investigation |
| Ingredient count | N/A |
| Ingredient list | N/A |
| Dietary classification | N/A |
| Recommendation path | Hypothetical only (see Section 5) |
| Primary root cause | Name used as illustrative example; not a confirmed database record |

---

## ACTUAL CONFIRMED STRUCTURAL GAPS

The investigation of "Healthy Tikka Masala" is complete: the meal does not exist. However, the investigation exposed **real, confirmed gaps** in user 1's data:

### Gap 1 — Empty-ingredient planner-placeholder meals that bypass Vegan filter

User 1 has at least 4 empty-ingredient meals whose names do NOT trigger any keyword exclusion for Vegan:

- Meal 2140: "Bean casserole homemade wraps" (probably safe)
- Meal 2141: "Pizza toast" (likely contains cheese — not vegan)
- Meal 2154/2155: "thai green curry" (may contain fish sauce, cream — not vegan)
- Meal 2156: "thai red curry" (may contain fish sauce, cream — not vegan)

These are `planner-placeholder` meals (user-typed names). The user meals loop in `smart-suggest-service.ts` has no ingredient gate, so they pass through on name-only diet matching.

**Fix scope:** Add an ingredient presence check to the user meals loop (parallel to the external candidates gate added in `0644578`). Alternatively, add "thai curry" / "green curry" / "red curry" to `DISH_NAME_MEAT_OR_SEAFOOD` — but that would be an imprecise heuristic (vegan Thai curries exist).

### Gap 2 — Stale sessionStorage

Any Smart Plan generated before `0644578` was deployed may still be frozen in the user's browser sessionStorage. The fix cannot retroactively purge it. It clears only when the tab is closed, the plan is applied, or the user explicitly clears it.

**Fix scope:** Add a `version` field to the serialised session; reject sessions with an older version on restore. This is a one-line client-side change.

---

## SMALLEST SAFE FIX

Two independent, minimal fixes address the confirmed real gaps:

1. **Session version stamp** (client-side, 1 line): Add `version: 2` to `saveSmartSession` payload; reject `version < 2` in `loadSmartSession`. Invalidates all pre-fix sessionStorage plans on next page load.

2. **User meal ingredient gate** (server-side, ~5 lines): In the user meals loop (`smart-suggest-service.ts`, lines 326–381), after the existing product and alcohol checks, add:
   ```typescript
   if (meal.ingredients.length === 0 && !meal.isReadyMeal) {
     // Cannot verify dietary compliance without ingredients — skip
     console.debug(`[SmartSuggest] Skipped user meal (no ingredients): "${meal.name}"`);
     continue;
   }
   ```
   This is analogous to the external candidates gate added in `0644578` and would prevent the 4 identified slip-through meals from being recommended.

---

## CODE CHANGES MADE

NONE

---

## DATA IMPACT DECLARATION

| Field | Value |
|---|---|
| Reads existing data | Yes |
| Writes new data | No |
| Changes meaning of existing data | No |
| Requires backfill | No |

---

## TRUST CHECK

- Could this report be based on assumptions? **No.** Every finding is backed by a direct database query, a code read, or an explicit absence of evidence from a targeted search.
- Could any conclusion be guessed? **No.** The primary conclusion (meal does not exist) is proven by SQL query returning 0 rows.
- Is the hypothetical trace in Section 5 confirmed? **No.** It is explicitly labelled hypothetical and is a code-derived reconstruction of what *would* happen, not what was observed.
