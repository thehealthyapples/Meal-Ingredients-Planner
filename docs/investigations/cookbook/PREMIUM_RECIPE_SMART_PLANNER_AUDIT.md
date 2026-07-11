PREMIUM RECIPE SMART PLANNER AUDIT: COMPLETE

**Date:** 2026-06-08
**Rollback identifier:** `pre-premium-audit-investigation-2026-06-08` at commit `b48ceee`
**Investigator:** Read-only audit — no code or data changes made
**Status:** Investigation complete

---

## Rollback Identifier

Tag: `pre-premium-audit-investigation-2026-06-08`
Commit: `b48ceee` (feat(dietRules): comprehensive Keto/Low-Carb exclusion dictionary)

To restore: `git checkout pre-premium-audit-investigation-2026-06-08`

---

## Files Reviewed

| File | Purpose |
|---|---|
| `server/lib/smart-suggest-service.ts` | Smart Planner engine — candidate pool, scoring, selection |
| `server/routes.ts` (lines 2383–2598) | Recipe search route — live search premium filter |
| `server/routes.ts` (lines 2589–2960) | Recipe import route — import premium filter |
| `server/routes.ts` (lines 4797–4936) | Smart Planner route — meal loading and pre-filter |
| `server/lib/external-meal-service.ts` | External candidate fetching |
| `server/lib/recipe-scraper.ts` | URL scraping |
| `server/lib/recipe-source-gate.ts` | Source gate |
| `server/lib/planner-compliance.ts` | Planner dietary compliance |
| `server/lib/smart-meal-creation-engine.ts` | Smart meal creation |
| `server/storage.ts` (around line 432) | `getMeals()` — raw DB query for user meals |

---

## Database Queries Run

All queries were read-only. No data was modified.

```sql
-- Find the specific meal
SELECT id, name, source_url, meal_source_type, meal_format, user_id, created_at
FROM meals
WHERE name ILIKE '%Marinated chicken%'
OR name ILIKE '%orzo%'
OR name ILIKE '%premium%'
OR name ILIKE '%subscribed%'
OR name ILIKE '%subscriber%'
LIMIT 20;

-- All meals with premium/subscriber wording in name
SELECT id, name, source_url, meal_source_type, created_at
FROM meals
WHERE name ILIKE '%premium%'
OR name ILIKE '%subscribed users%'
OR name ILIKE '%subscriber%'
OR name ILIKE '%piece of content%'
LIMIT 50;

-- BBC Good Food meals
SELECT id, name, source_url, meal_source_type, meal_format, created_at
FROM meals
WHERE source_url ILIKE '%bbcgoodfood%'
OR source_url ILIKE '%goodfood%'
LIMIT 50;

-- meals table schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'meals'
ORDER BY ordinal_position;

-- Premium wording in ingredients/instructions
SELECT id, name FROM meals
WHERE ingredients::text ILIKE '%premium%'
OR instructions::text ILIKE '%premium%'
OR ingredients::text ILIKE '%subscribed%'
OR instructions::text ILIKE '%subscribed%';

-- Seed batch timestamp check
SELECT COUNT(*), created_at
FROM meals
WHERE created_at = '2026-02-27 23:20:26.681784+00'
GROUP BY created_at;

-- BBC Good Food meals for user 1
SELECT COUNT(*) FROM meals
WHERE source_url ILIKE '%bbcgoodfood%' AND user_id = 1;
```

---

## Exact Meal Record Findings

### Meal ID 1558

| Field | Value |
|---|---|
| id | 1558 |
| name | `Marinated chicken with orzo, tomato & feta. This is a premium piece of content available to subscribed users.` |
| source_url | `https://www.bbcgoodfood.com/recipes/marinated-chicken-with-orzo-tomato-feta` |
| meal_source_type | `scratch` |
| meal_format | `recipe` |
| user_id | 1 |
| created_at | 2026-02-27 23:20:26.681784+00 |
| diet_types | `{}` (empty array) |
| ingredients | 9 real recipe ingredients |
| instructions | 3 real cooking steps |
| is_system_meal | false |
| is_ready_meal | false |
| kind | `meal` |
| category_id | 6 (Dessert) |
| barcode | null |

### Meal ID 1559

Identical to 1558 except:
- name: `Marinated chicken with orzo, tomato & feta. This is a premium piece of content available to subscribed users. (Edited)`
- Same source URL, same seed timestamp, same `meal_source_type = 'scratch'`

### Key observation on meal_source_type

Both records are classified as `scratch`. The Smart Planner route excludes `starter`, `planner-placeholder`, and `openfoodfacts` source types — but **not** `scratch`. This means both records pass the source-type filter and enter the candidate pool.

### Premium wording location

The full premium marker string `"This is a premium piece of content available to subscribed users."` exists **only in the `name` field**. It is not present in `ingredients`, `instructions`, or any other column.

### Seed origin

Both records share the bulk-seed timestamp `2026-02-27 23:20:26.681784+00` — the same timestamp as 1,719 other records (134 `scratch`, 309 `ready_meal`, 1,197 `starter`, 80 `openfoodfacts` for user 1). The premium-named meals were scraped from BBC GoodFood before any premium-blocking logic existed in the import path.

---

## Root Cause

The meal is appearing in Smart Planner for three compounding reasons:

1. **Stale data** — Meal IDs 1558 and 1559 were seeded into the database in a bulk import on 2026-02-27, before any premium-detection logic existed at the import path. The full premium marker string was captured as part of the recipe title at scrape time.

2. **No Smart Planner premium gate** — The Smart Planner pipeline (`smart-suggest-service.ts` + the route at `routes.ts` line 4797) applies zero filtering based on meal name content. `storage.getMeals(userId)` returns all user meals unfiltered, and no subsequent step removes meals whose names contain premium wording.

3. **Incomplete import premium check** — Even if this meal were re-imported today via the recipe import route, it would still be saved. The import premium check at `routes.ts` lines 2795-2798 and 2928-2930 scans only `ingredients` and `instructions` — it does not check the recipe `title`. BBC GoodFood embeds the premium notice in the JSON-LD `name` field (which becomes the recipe title), so the check does not catch it.

---

## Premium Filtering Map

### Where premium filtering currently exists

| Location | File | Line | What it checks |
|---|---|---|---|
| Recipe search results (live) | `server/routes.ts` | 2571–2574 | Filters `interleaved` search result display — scans name, category, cuisine, ingredients, instructions |
| Recipe import (JSON-LD path) | `server/routes.ts` | 2795–2798 | Checks `[...ingredients, ...finalInstructions].join("\0")` — **title not included** |
| Recipe import (DOM fallback) | `server/routes.ts` | 2928–2930 | Same check as JSON-LD — **title not included** |

### Where premium filtering is absent

| Location | File | Evidence | Gap |
|---|---|---|---|
| Smart Planner — user meals pre-filter | `server/routes.ts` | Lines 4862–4866 — only filters source type and drinks | No name-content check |
| Smart Planner — candidate scoring/selection | `server/lib/smart-suggest-service.ts` | Entire file — zero references to "premium"/"subscriber" | No name-content check |
| `getMeals()` DB query | `server/storage.ts` | Line 432 — bare SELECT, no WHERE on name content | No filter at retrieval |
| External candidate fetching | `server/lib/external-meal-service.ts` | Entire file — zero premium references | No name-content check |

---

## Premium Filter Coverage Matrix

| Area | Premium Filter Exists | Applies To | Evidence | Status |
|---|---|---|---|---|
| External search (display) | Yes | Live search result display only | `routes.ts` lines 2571–2574 | PASS for live search — does not affect stored meals |
| Recipe import (title) | No | BBC GoodFood-style premium title | `routes.ts` lines 2795, 2928 — title not in scanned text | FAIL — premium-in-title bypasses this gate |
| Recipe import (body) | Partial | Ingredients/instructions only | `routes.ts` lines 2795–2798, 2928–2930 | PARTIAL — body checked but title omitted |
| My Meals candidate pool | No | Saved meals fed into Smart Planner | `routes.ts` lines 4830–4866; `smart-suggest-service.ts` entire file | FAIL — no premium-content check at all |
| Smart Planner final gate | No | All candidates post-scoring | `smart-suggest-service.ts` lines 324–433 | FAIL — no premium-content check |
| Existing DB cleanup needed | Yes | IDs 1558 and 1559 confirmed | SQL query results above | YES — 2 stale rows confirmed |

---

## Affected Candidate Sources

| Source | Affected | Detail |
|---|---|---|
| My Meals (saved meals) | Yes | IDs 1558 and 1559 enter the candidate pool via `storage.getMeals()` |
| Live external search | No | Search display filter blocks these from appearing in UI search results |
| BBC GoodFood via import | Potentially | Import check does not cover title — a fresh import of this URL would succeed today |

---

## Affected Saved Meals Count

**Confirmed with premium wording in name:** 2 meals (IDs 1558 and 1559)

**Potentially paywalled without premium wording in name:** Unknown — 76 BBC GoodFood meals exist for user 1. Any that were scraped before paywall detection could be paywalled content with a clean title. A live HTTP check of each URL would be required to verify this; that check is outside the scope of this read-only investigation.

---

## Mandatory Findings

### 1. Why is this premium recipe appearing in Smart Planner?

Meal IDs 1558 and 1559 exist in the `meals` table with `meal_source_type = 'scratch'`, which is not excluded by the Smart Planner's source-type filter. The Smart Planner has no check for premium-marker text in meal names at any stage of the pipeline. The meals flow from `storage.getMeals()` → pre-filter (source type + drinks only) → scoring → selection, with no premium-name check at any point.

### 2. Is it coming from live external search or saved My Meals?

**Saved My Meals.** The Smart Planner reads `storage.getMeals(req.user!.id)` at `routes.ts` line 4830 and uses those records as the `userMeals` candidate pool. This is not a live external search result. The "My Meals" label on the card in the Smart Planner UI confirms this — it matches the code path for user-saved meals.

### 3. Is existing premium protection missing, bypassed, or stale?

All three simultaneously:
- **Missing** — Smart Planner has no premium protection of any kind
- **Bypassed** — the import gate does not check the recipe title, only ingredients/instructions
- **Stale** — these records predate any premium-detection logic and were seeded before the import gate existed

### 4. Are there more saved premium recipes affected?

**2 confirmed** (IDs 1558 and 1559). These are the only records in the database with the premium marker string in the `name` field. Additional paywalled-but-clean-title recipes cannot be identified from DB content alone.

### 5. What is the smallest safe fix?

A two-part code fix:

**Fix A — Smart Planner gate** (prevents affected meals from appearing in suggestions):
In `routes.ts` at the `userMeals` pre-filter block (around line 4862–4866), add:
```typescript
const PREMIUM_MARKER = "This is a premium piece of content available to subscribed users.";
userMeals = userMeals.filter(meal => !meal.name.includes(PREMIUM_MARKER));
```

**Fix B — Import title check** (prevents future re-import of the same URL from re-creating the problem):
In `routes.ts` at lines 2795 and 2928, include `title` in the scanned text:
```typescript
// Line 2795 — change from:
const importAllText = [...ingredients, ...finalInstructions].join("\0");
// to:
const importAllText = [title, ...ingredients, ...finalInstructions].join("\0");
```
Apply the same change at line 2928 (DOM fallback path).

### 6. Does the smallest safe fix require data cleanup?

**Yes for a complete fix.** The code-only fixes (A and B above) prevent the premium meals from appearing in Smart Planner and block future re-imports. However, IDs 1558 and 1559 will remain visible in My Meals and the cookbook view — the user will see recipe cards with the misleading premium warning in the title. Full remediation requires deleting or renaming those two records.

### 7. Recommended next step

**Combination** — in priority order:

1. **Smart Planner candidate gate** (`routes.ts` line 4862-4866) — unblocks the immediate symptom; safe code-only change
2. **Import title fix** (`routes.ts` lines 2795, 2928) — closes the import gap; prevents the problem from reappearing via re-import
3. **Data cleanup** — delete or rename meal IDs 1558 and 1559 to remove stale premium-named records from My Meals visibility

---

## Data Impact Assessment

| Dimension | Assessment |
|---|---|
| Reads existing data | Yes — read-only queries confirmed meal records |
| Writes new data | No — this investigation made no writes |
| Changes meaning of existing data | No |
| Requires backfill | No — the only fix action needed is deletion of 2 rows (IDs 1558, 1559) |
| Affected row count | 2 confirmed; up to 76 BBC GoodFood URLs require HTTP verification for silent paywalled content |
| Risk of data cleanup | Low — deleting IDs 1558/1559 removes a recipe that cannot be cooked (premium-gated content) |

---

## Trust Check

**Could this mislead the user?**
Yes — showing a premium-only recipe in Smart Planner implies the user can access and cook it. The actual recipe steps are stored (scraped before paywall), but the BBC GoodFood page now requires a subscription. The user could attempt to follow the saved recipe, but any attempt to load the source URL will be paywalled.

**Could this fabricate certainty?**
The 9 ingredient list and 3 recipe steps are stored in the database from the original scrape and are real. The premium warning in the title is also real and stored as-is. No fabrication detected — findings are from DB query results and code reads only.

**Is anything guessed but shown as real?**
No. All findings are sourced from database query results or direct code reads. Where evidence was unavailable (silent paywalled BBC GoodFood URLs), this is stated explicitly as "Unknown — requires HTTP verification".

**What happens if the system is wrong?**
The user plans a meal they cannot access the full recipe for, or cannot verify nutritional content from the source URL. The stored recipe steps may be incomplete if the BBC GoodFood page changed after the seed scrape.

---

## Recommended Next Decision

The investigation is complete. No code or data changes were made.

The next decision for the developer is:

1. **Approve Smart Planner gate fix** — add premium-name filter to `routes.ts` at the `userMeals` pre-filter block
2. **Approve import title fix** — extend the import premium check to include the recipe title field
3. **Approve data cleanup** — delete meal IDs 1558 and 1559 (or rename to strip premium suffix)
4. **Optionally commission** a background HTTP check of 76 saved BBC GoodFood URLs to identify any silently-paywalled recipes that do not have the premium marker in their stored title

All of the above are separate decisions and can be sequenced independently. The Smart Planner gate fix is the highest-priority item as it addresses the immediate symptom.

---

## Scope Declaration

Investigation only.
No code changes made.
No UI changes made.
No schema changes made.
No migrations run.
No data cleaned.
No meals deleted.
No Smart Planner filtering changed.
No import logic altered.
