# M1A — WS0 Knowledge Seed + Canonical Food Display Implementation

**Date:** 2026-06-24  
**Branch:** safety/preserve-since-last-prod-20260617-1613  
**Risk:** 🔴 RED (writes production knowledge data, changes report display identity)  
**Status:** COMPLETE

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Tag created | `rollback/m1a-ws0-seed-canonical-display-20260624` |
| Points to | HEAD `f531216` (feat(ws11): Seasonal Stories Engine) |
| Branch | `safety/preserve-since-last-prod-20260617-1613` |
| Working tree at tag | Modified: MealUpliftPanel.tsx, PantryKnowledgeHub.tsx, PlantDiversityReport.tsx, routes.ts, nutrition-knowledge-registry.ts, foods.ts |

### Rollback commands

**Code changes only (revert files):**
```
git checkout rollback/m1a-ws0-seed-canonical-display-20260624 -- shared/ingredient-aliases.ts
git checkout rollback/m1a-ws0-seed-canonical-display-20260624 -- client/src/components/PlantDiversityReport.tsx
```

**Seed data reversal:**  
The seed is an idempotent UPSERT. The `knowledge_foods` table cannot be rolled back to 69 entries by re-running the seed. To revert the database state:
```sql
-- Remove all foods seeded in WS0.8 (119 new foods)
-- The safe reversal is to restore from a database snapshot.
-- If no snapshot exists, the seed data is editorial-only and the display
-- degrades gracefully (shows "—" dashes) — it does not corrupt any user data.
```

**Note:** The seed does NOT touch user data, planner data, meal data, or any other table. Rollback of the seed data only affects `knowledge_foods`, `knowledge_food_nutrients`, `knowledge_food_benefits` tables. Worst case of not rolling back: the report shows more populated data than before.

---

## IMPLEMENTATION APPROACH

### Part 1: WS0 Knowledge Seed

**Root cause (from investigation):** The WS0.8 expansion commit (`bad86ca`, 2026-06-21) added 119 foods to the editorial seed code (`shared/knowledge/foods.ts`, `shared/knowledge/relationships.ts`) but `npm run seed:knowledge` was never run after that commit. The live database remained at the pre-WS0.8 state of 69 foods.

**Fix:** Run the idempotent seed runner:
```
npm run seed:knowledge
```

No code changes required for Part 1.

### Part 2: Canonical Display Grouping

**Root cause (from investigation):** Two independent problems:
1. Database not seeded (fixed by Part 1)
2. Client-side `ingredient-aliases.ts` had no mappings for chicken cuts, so `getDisplayKey("Chicken Breasts")` returned "chicken breasts" — three separate rows instead of one "Chicken" row

**Fix:** 
- Added chicken cut aliases in `shared/ingredient-aliases.ts`
- Added apple variety aliases in `shared/ingredient-aliases.ts`
- Added `formsUsed: string[]` tracking to `PlantDiversityReport.tsx`
- Added `computeFormLabel` helper to extract the cut/variety portion of the raw ingredient
- Added "Forms used this week" expanded view for non-plant rows

**Architecture:** Uses existing alias mechanism (`resolveIngredientAlias` in `ingredient-aliases.ts`). No new grouping system created. The existing flow:
```
raw "Chicken Breasts"
  → EXTRA_UNIT_RE strip → "Chicken Breasts"
  → normaliseForReuse() → stripForMatch() → "chicken breasts"
  → resolveIngredientAlias("chicken breasts") → "chicken"  [NEW alias]
  → displayKey = "chicken"
  → all cuts group to one row
  → POST /api/knowledge/ingredient-lookup with "chicken"
  → server resolves "chicken" → slug "chicken" → nutrients + benefits
```

---

## FILES CHANGED

| File | Change |
|------|--------|
| `shared/ingredient-aliases.ts` | Added 10 chicken cut aliases + 9 apple variety aliases |
| `client/src/components/PlantDiversityReport.tsx` | Added `formsUsed` field + `computeFormLabel` helper + expanded "Forms used this week" UI |
| DB: `knowledge_foods` | Seeded from 69 → 188 (idempotent UPSERT) |
| DB: `knowledge_food_nutrients` | Seeded from 232 → 670 |
| DB: `knowledge_food_benefits` | Seeded from 192 → 503 |
| DB: `knowledge_nutrient_benefits` | Seeded from 0 → 68 |

---

## DATABASE COUNTS

### Before

| Table | Count |
|-------|-------|
| knowledge_foods | 69 |
| knowledge_nutrients | 30 |
| knowledge_health_benefits | 15 |
| knowledge_food_nutrients | 232 |
| knowledge_food_benefits | 192 |
| knowledge_nutrient_benefits | 0 |

### After

| Table | Count |
|-------|-------|
| knowledge_foods | 188 |
| knowledge_nutrients | 30 |
| knowledge_health_benefits | 15 |
| knowledge_food_nutrients | 670 |
| knowledge_food_benefits | 503 |
| knowledge_nutrient_benefits | 68 |

---

## FOOD PRESENCE VERIFICATION

All required foods confirmed present in `knowledge_foods` after seeding:

| Slug | Name | Category |
|------|------|----------|
| chicken | Chicken | Proteins |
| eggs | Eggs | Proteins |
| beef | Beef | Proteins |
| lamb | Lamb | Proteins |
| pork | Pork | Proteins |
| turkey | Turkey | Proteins |
| duck | Duck | Proteins |
| tuna | Tuna | Healthy fats |
| milk | Milk | Dairy |
| yoghurt | Yoghurt | Dairy |

---

## ALIAS ADDITIONS

### Chicken cuts (`shared/ingredient-aliases.ts`)

```
"chicken breast"    → "chicken"
"chicken breasts"   → "chicken"
"chicken thigh"     → "chicken"
"chicken thighs"    → "chicken"
"chicken leg"       → "chicken"
"chicken legs"      → "chicken"
"chicken wing"      → "chicken"
"chicken wings"     → "chicken"
"chicken drumstick" → "chicken"
"chicken drumsticks"→ "chicken"
```

**Trust basis:** All chicken cuts share the same key micronutrients (selenium, vitamin B6, zinc, vitamin B12) and health benefit profile (muscle recovery, energy support). Fat content varies slightly (breast lower, thigh/leg slightly higher) but no meaningful health story differs across cuts for a weekly food diversity report.

### Apple varieties (`shared/ingredient-aliases.ts`)

```
"braeburn"           → "apple"
"braeburn apple"     → "apple"
"braeburn apples"    → "apple"
"pink lady"          → "apple"
"pink lady apple"    → "apple"
"pink lady apples"   → "apple"
"granny smith"       → "apple"
"granny smith apple" → "apple"
"granny smith apples"→ "apple"
```

**Trust basis (from investigation):** All common apple varieties share the same key nutrients and health story. Granny Smith has marginally higher polyphenols and lower glycaemic index, but differences are not materially significant for a weekly food diversity report. WS0 already has a single "apples" slug with generic variety aliases.

---

## KEEP SEPARATE (documented decisions)

| Food | Decision | Reason |
|------|----------|--------|
| Red Pepper | Keep separate | Vastly different beta-carotene and vitamin C vs other peppers |
| Yellow Pepper | Keep separate | High vitamin C, lower beta-carotene than red |
| Green Pepper | Keep separate | Lower vitamin C than red/yellow; unripe variety |
| Sweet Potato | Keep separate | Significant beta-carotene (completely absent in white potato); lower GI; higher fibre |
| White Potato / New Potato | Keep separate from sweet | Different nutrient profile entirely |

---

## EXPECTED DISPLAY

### Before (3 rows, no data)

```
Meat & Fish

Chicken Breasts    Meat & Fish    —    —    Monday      Chicken Marengo
Chicken Legs       Meat & Fish    —    —    Wednesday   Nutty Chicken Curry
Chicken Thighs     Meat & Fish    —    —    Wednesday   Nutty Chicken Curry
```

### After (1 row, data populated)

```
Meat & Fish

Chicken    Meat & Fish    Muscle Recovery · Energy Support    Selenium · Vitamin B6    Multi    2 meals

  ▼ Expanded:
  Forms used this week:  [ Breasts ]  [ Legs ]  [ Thighs ]

  Meals:
    Monday:     Chicken Marengo
    Wednesday:  Nutty Chicken Curry
```

---

## AUTOMATED TEST RESULTS

| Test | Result |
|------|--------|
| `npm run typecheck` | PASS for changed files (`shared/ingredient-aliases.ts`, `PlantDiversityReport.tsx`) |
| Pre-existing typecheck errors | 20 errors in `server/scripts/` and `server/tests/` — all pre-existing, unrelated to M1A |
| Project unit tests | None found in project (only in third-party cache) |

---

## TRUST REVIEW

### Could canonical grouping hide meaningful nutrition?

**Chicken cuts → No.** All cuts (breast, thigh, leg, wing, drumstick) contribute the same key micronutrients (selenium, vitamin B6, zinc, vitamin B12). The fat content variation is real but minor: breast ~3g/100g, thigh ~9g/100g. For a weekly food diversity report showing which nutrients a household is receiving, grouping as "Chicken" is accurate and not misleading.

The raw ingredient strings are preserved in the "Forms used this week" expanded view, so no information is hidden from the user. They can see exactly which cuts were used.

### Could it inflate diversity?

**No.** Grouping three chicken cuts into one row REDUCES the apparent diversity, not inflates it. Before: 3 rows of chicken. After: 1 row. The plant count (the primary diversity metric) is not affected — chicken is not a plant.

### Could it reduce diversity?

**No impact on plant count.** The 30-plants counter operates on `isPlantIngredient(raw)` before aliasing (Pass 1 in `computeAllRows`). Chicken aliases are irrelevant to plant counting.

### Could it create misleading reporting?

**No.** The change is display-only. The nutritional data shown (selenium, vitamin B6, zinc, vitamin B12; muscle recovery, energy support) is identical to what would be shown for each cut individually. The "Forms used this week" section makes the grouping transparent.

### Safeguards in place

1. **Forms are displayed** — user sees exactly which cuts were eaten
2. **Trust guard principle applied** — only merging when nutritional equivalence is confirmed
3. **Peppers remain separate** — Red/Yellow/Green have materially different beta-carotene profiles
4. **Sweet Potato remains separate from Potato** — different nutrient profiles
5. **Plant count is unaffected** — aliases don't touch the plant counting pass
6. **Idempotent seed** — re-running `npm run seed:knowledge` is always safe

---

## MANUAL VERIFICATION STEPS

### TEST 1 — Chicken shown as single row

Open `/plant-diversity`. In the Meat & Fish section:
- **Expected:** One row labelled "Chicken"
- **Not expected:** Separate rows for "Chicken Breasts", "Chicken Legs", "Chicken Thighs"

### TEST 2 — Supports populated

In the Chicken row:
- **Expected:** Supports column shows e.g. "Muscle Recovery · Energy Support" (not "—")

### TEST 3 — Key Nutrients populated

In the Chicken row:
- **Expected:** Key Nutrients column shows e.g. "Selenium · Vitamin B6" (not "—")

### TEST 4 — Forms in expanded view

Click the Chicken row to expand:
- **Expected:** "Forms used this week" section shows badge chips: "Breasts", "Legs", "Thighs"

### TEST 5 — Peppers remain separate

In the Plant Based section:
- **Expected:** Separate rows for Red Pepper, Yellow Pepper, Green Pepper
- **Not expected:** A single merged "Pepper" row

### TEST 6 — Sweet Potato and Potato remain separate

- **Expected:** Sweet Potato and Potato appear as separate rows in their respective sections

### TEST 7 — Eggs populated

In the Eggs section, expand the Eggs row:
- **Expected:** Supports and Key Nutrients populated (e.g. "Brain Health", "Vitamin D · Vitamin B12")

---

## ROLLBACK INSTRUCTIONS

### Rollback code changes only

```bash
git checkout rollback/m1a-ws0-seed-canonical-display-20260624 -- shared/ingredient-aliases.ts
git checkout rollback/m1a-ws0-seed-canonical-display-20260624 -- client/src/components/PlantDiversityReport.tsx
```

**Effect:** Report reverts to showing separate rows per chicken cut. Nutrients/benefits will still show (because the seed data is now in the DB), but grouping reverts. This is a safe partial rollback.

### Rollback both code + seed

The seed cannot be un-run by re-running the seed. To remove the 119 new food rows, restore from a database backup/snapshot taken before this implementation, OR run:
```sql
DELETE FROM knowledge_food_benefits WHERE food_slug IN (SELECT slug FROM knowledge_foods WHERE is_active = true);
DELETE FROM knowledge_food_nutrients WHERE food_slug IN (SELECT slug FROM knowledge_foods WHERE is_active = true);
-- Then delete the 119 new foods by slug (list available from shared/knowledge/foods.ts WS0.8 additions)
```

**Important:** This SQL approach is destructive and requires careful execution. The preferred rollback for the seed is database snapshot restoration.

---

## SUGGESTIONS (out of scope — for future consideration)

**SUGGESTION 1 — Chicken Stock / Chicken Stock Cube**  
These have no WS0 entry and no alias. After this fix they remain in the "Other" section with "—" for both columns. A dedicated WS0 entry (sodium content, trace protein note) would populate them. Estimated effort: 30 minutes.

**SUGGESTION 2 — Extend forms display to plant-based rows**  
Currently `formsUsed` is tracked for all rows but only displayed for non-plant rows (plant rows use WS2A FoodReport for variety display). If the FoodReport variety display is removed or insufficient, `formsUsed` could be shown for plant rows too. No code change needed — just remove the `row.section !== "plant-based"` guard.

**SUGGESTION 3 — Turkey cuts → Turkey**  
The WS0 has aliases "turkey breast", "turkey mince", "turkey steak" → "turkey" slug. Adding ingredient-aliases.ts entries for these would group turkey variants the same way chicken was grouped. Estimated effort: 5 minutes.

**SUGGESTION 4 — Beef/Pork/Lamb cuts → canonical**  
Similar pattern: "beef mince", "steak" → "beef"; "pork chops", "pork loin" → "pork"; "lamb chops", "lamb mince" → "lamb". Each WS0 food already has these as server-side aliases. Client-side ALIASES entries would complete the display grouping. Estimated effort: 10 minutes.

**SUGGESTION 5 — Retire `nutrition-benefit-library.ts`**  
Now that the WS0 registry is fully seeded (188 foods), the 24-food static library is obsolete. `MealUpliftPanel.tsx` and `PlantDiversityReport.tsx` already read from WS0 via `/api/knowledge/ingredient-lookup`. The library is no longer consumed by any active surface. Retirement is safe.

---

## DEFINITION OF DONE CHECKLIST

| Item | Status |
|------|--------|
| Rollback tag created | ✅ `rollback/m1a-ws0-seed-canonical-display-20260624` |
| WS0 seeded | ✅ 188 foods in knowledge_foods |
| Chicken present in DB | ✅ slug "chicken", Proteins category |
| Eggs present in DB | ✅ slug "eggs", Proteins category |
| Beef/Lamb/Pork/Turkey/Duck/Tuna/Milk/Yoghurt present | ✅ All 10 required foods confirmed |
| Plant Diversity uses canonical display | ✅ ingredient-aliases.ts + PlantDiversityReport.tsx updated |
| Chicken shown once | ✅ All cuts alias to "chicken" displayKey |
| Forms displayed | ✅ "Forms used this week" chips in expanded row |
| Nutrients populated | ✅ WS0 seed provides chicken nutrients |
| Benefits populated | ✅ WS0 seed provides chicken benefits |
| Red/Yellow/Green Pepper remain separate | ✅ No pepper aliases added |
| Sweet Potato and Potato remain separate | ✅ No merge aliases added |
| TypeScript typecheck | ✅ Zero errors in changed files |
| Project file created | ✅ This document |
| Trust review completed | ✅ See Trust Review section above |
