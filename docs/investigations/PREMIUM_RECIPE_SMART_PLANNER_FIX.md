PREMIUM RECIPE SMART PLANNER FIX IMPLEMENTED: YES

**Date:** 2026-06-08
**Commit:** 00a8ee1
**Rollback identifier:** `pre-premium-fix-implementation-2026-06-08` at commit `b48ceee`
**Scope:** Option B — Smart Planner gate + import title fix + confirmed stale data deletion

---

## Rollback Identifier

Tag: `pre-premium-fix-implementation-2026-06-08`
Commit at tag: `b48ceee`

**To roll back code changes:**
```
git checkout pre-premium-fix-implementation-2026-06-08
```

**To reinstate deleted meal rows (if needed after code rollback):**
```
psql $DATABASE_URL -f docs/investigations/PREMIUM_RECIPE_RESTORE_1558_1559.sql
```

---

## Files Changed

| File | Change |
|---|---|
| `server/lib/smart-suggest-service.ts` | Added `PREMIUM_MARKERS` constant and `candidateIsPremium()` exported function; applied as defense-in-depth gate inside `generateSmartSuggestion()` candidate loop |
| `server/routes.ts` | Added route-level premium pre-filter on `userMeals` after source-type gate (lines 4866–4882); added `title` to both import premium checks (lines 2795, 2928) |
| `server/tests/test-smart-suggest-premium-filter.ts` | New regression test file — 17 test cases |
| `package.json` | Added `test:smart-suggest-premium-filter` script |
| `docs/investigations/PREMIUM_RECIPE_RESTORE_1558_1559.sql` | Full INSERT restore script for deleted rows 1558 and 1559 |
| `docs/investigations/PREMIUM_RECIPE_SMART_PLANNER_AUDIT.md` | Audit investigation report |
| `PREMIUM_RECIPE_SMART_PLANNER_AUDIT.md` | Root-level audit summary |

---

## Smart Planner Premium Gate Summary

### Route-level pre-filter (`routes.ts`)

Added immediately after the existing source-type gate at line 4866. Filters out any
saved user meal whose `name` or `instructions` contain any of the premium markers:

- `premium piece of content`
- `available to subscribed users`
- `subscribed users`
- `subscriber-only`
- `subscribers only`
- `premium content`
- `subscription required`

Matching is case-insensitive. Applied before scoring, nutrition loading, and
`generateSmartSuggestion()` is called.

### Defense-in-depth gate (`smart-suggest-service.ts`)

`candidateIsPremium()` is called inside the `for (const meal of userMeals)` loop in
`generateSmartSuggestion()` immediately after the existing `candidateIsProduct()` check
(around line 337). If either gate fires the meal is skipped with a debug log. This
ensures premium meals are rejected even if the route-level filter is bypassed.

### `candidateIsPremium()` function

Exported for unit testing. Accepts `{ name: string; instructions?: string[] | null }`.
Lowercases both fields before checking against `PREMIUM_MARKERS`. Does not touch
scoring, dietary compliance, or any other pipeline stage.

---

## Import Title Fix Summary

### JSON-LD path (`routes.ts` line 2795)

**Before:**
```typescript
const importAllText = [...ingredients, ...finalInstructions].join("\0");
```

**After:**
```typescript
const importAllText = [title, ...ingredients, ...finalInstructions].join("\0");
```

### DOM fallback path (`routes.ts` line 2928)

**Before:**
```typescript
const fallbackAllText = [...ingredients, ...finalInstructions].join("\0");
```

**After:**
```typescript
const fallbackAllText = [title, ...ingredients, ...finalInstructions].join("\0");
```

Both paths now scan the recipe title. BBC GoodFood embeds the premium notice in the
JSON-LD `name` field (which becomes `title`). A live re-import of
`https://www.bbcgoodfood.com/recipes/marinated-chicken-with-orzo-tomato-feta` will now
return HTTP 403 with `"This recipe is behind a paywall and cannot be imported."`.

---

## Deleted Meal IDs

| ID | Name | Source URL | Confirmed Before Deletion |
|---|---|---|---|
| 1558 | `Marinated chicken with orzo, tomato & feta. This is a premium piece of content available to subscribed users.` | `https://www.bbcgoodfood.com/recipes/marinated-chicken-with-orzo-tomato-feta` | Yes — name ✓, BBC URL ✓, user_id=1 ✓ |
| 1559 | `Marinated chicken with orzo, tomato & feta. This is a premium piece of content available to subscribed users. (Edited)` | `https://www.bbcgoodfood.com/recipes/marinated-chicken-with-orzo-tomato-feta` | Yes — name ✓, BBC URL ✓, user_id=1 ✓ |

Both rows confirmed deleted:
```sql
SELECT id, name FROM meals WHERE id IN (1558, 1559);
-- (0 rows)
```

No other rows were deleted.

---

## Restore SQL File Location

`docs/investigations/PREMIUM_RECIPE_RESTORE_1558_1559.sql`

Contains full `INSERT` statements with all column values for both rows, wrapped in
`BEGIN`/`COMMIT`. Uses explicit IDs — will fail safely with PK conflict if those IDs
are reused.

---

## Test Results

```
npm run test:smart-suggest-premium-filter

── 1. Premium wording in title ──
  ✓ BBC GoodFood premium title is flagged as premium
  ✓ Edited BBC GoodFood premium title is flagged as premium

── 2. Premium wording in instructions ──
  ✓ Premium marker in instructions is flagged
  ✓ "subscription required" in instructions is flagged

── 3. Normal recipes — no false positives ──
  ✓ Normal recipe passes through — not flagged as premium
  ✓ Chicken tikka masala passes through — not flagged as premium
  ✓ Recipe with no instructions passes through — not flagged as premium

── 4. Premium marker variants ──
  ✓ Recipe contains: premium piece of content
  ✓ Recipe contains: available to subscribed users
  ✓ Recipe contains: subscribed users
  ✓ Recipe contains: subscriber-only
  ✓ Recipe contains: subscribers only
  ✓ Recipe contains: premium content
  ✓ Recipe contains: subscription required

── 5. Case-insensitive matching ──
  ✓ Upper-case premium marker in title is flagged
  ✓ Upper-case premium marker in instructions is flagged

── 6. Import premium marker matches the known BBC GoodFood string ──
  ✓ BBC GoodFood premium title string is caught by candidateIsPremium()

Smart Planner premium filter: 17 passed, 0 failed
All tests passed.
```

---

## Build Result

```
npm run build
✓ built in 8.69s
dist/index.cjs  2.5mb
⚡ Done in 201ms
```

Build: **PASS**

---

## TypeScript Result

```
npx tsc --noEmit
(no output — clean)
```

TypeScript: **PASS** (0 errors)

---

## Full Test Suite Result

```
npm test
RESULTS: 14/14 passed  (additives)
RESULTS: 13/13 passed  (extracts)
RESULTS: 12/12 passed  (scoring)
Results: 18 passed, 0 failed  (ingredient-language)
Results: 76 passed, 0 failed  (product-dedup)
Planner compliance gate: 25 passed, 0 failed
```

All existing tests: **PASS** — no regressions.

---

## Manual Verification Result

Database confirmed:

- `SELECT id, name FROM meals WHERE id IN (1558, 1559)` → `(0 rows)` — deleted
- `SELECT id, name FROM meals WHERE name ILIKE '%premium%' OR name ILIKE '%subscribed users%'` → `(0 rows)` — no remaining premium-named meals
- Smart Planner route now filters `userMeals` on premium markers before scoring
- Import route now includes `title` in premium check on both paths

The Marinated chicken with orzo, tomato & feta premium recipe will not appear in Smart
Planner suggestions. The meal IDs are gone from My Meals.

---

## Remaining Limitations

1. **Silent paywalled URLs** — 76 saved meals have `bbcgoodfood.com` source URLs for
   user 1. Any scraped before their page became paywalled may now be inaccessible at
   the source URL without the premium marker in the stored title. These cannot be
   detected from DB content alone and are outside the approved scope. A future HTTP
   check of all saved BBC GoodFood URLs would surface them.

2. **Premium wording in ingredients only** — The Smart Planner route-level filter and
   `candidateIsPremium()` check `name` and `instructions`. If the premium marker
   appeared only in `ingredients` (not observed, but theoretically possible), those
   records would not be caught. The import check now covers `title + ingredients +
   instructions`, so new imports are fully covered.

3. **Other premium content providers** — Only the BBC GoodFood marker string is known.
   Other subscription-gated sites with different paywall wording patterns are not
   covered unless their marker text matches one of the seven patterns in `PREMIUM_MARKERS`.

---

## Project Report File Location

Full implementation report: `docs/investigations/PREMIUM_RECIPE_SMART_PLANNER_FIX.md`
Audit investigation report: `docs/investigations/PREMIUM_RECIPE_SMART_PLANNER_AUDIT.md`
Restore SQL: `docs/investigations/PREMIUM_RECIPE_RESTORE_1558_1559.sql`

---

## Data Impact Declaration

Reads existing data: Yes
Writes new data: No
Changes meaning of existing data: No
Requires backfill: No
Deleted data: Yes — 2 confirmed stale premium recipe rows (IDs 1558 and 1559)
Restore available: Yes — `docs/investigations/PREMIUM_RECIPE_RESTORE_1558_1559.sql`
