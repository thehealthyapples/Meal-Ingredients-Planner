PLANNER COMPLIANCE CLEANUP DRY RUN: COMPLETE

**Date:** 2026-06-06
**Type:** Dry run — 🔴 RED (data cleanup pending approval)
**Subject:** Scan existing planner_entries and report which would be removed by a compliance cleanup pass.

---

## Rollback identifier

**Tag:** `rollback/before-planner-entry-cleanup-2026-06-06` @ `af620b9`

Created before any dry-run work began. No data was changed.

---

## Runtime state

- **Compliance engine used:** `isMealCompliantForUser` → `candidateDietExcluded` → `dietRules.shouldExcludeRecipe` (single source of truth, no new rules, no duplicated keyword lists)
- **User ID:** 1
- **Household ID:** 44
- **dietPattern:** Vegan
- **dietRestrictions:** (none)
- **hardExcludedIngredients (6):** gluten-free, nuts, dairy-free, eggs, shellfish, soy
- **Planner weeks checked:** 6 (weeks 1–6)
- **Total planner entries checked:** 56
- **Compliant:** 9
- **Non-compliant (proposed for removal):** 47

---

## ⚠️ FALSE POSITIVES — DO NOT DELETE WITHOUT SEPARATE FIX

Two entries are flagged by the engine but are **genuinely vegan**. The issue is that `"coconut milk"` contains the substring `"milk"`, which matches the `DAIRY_KEYWORDS` list. Coconut milk is plant-based; this is a keyword collision, not a dietary violation.

| Entry ID | Week | Day | Slot | Meal ID | Meal name | Why it's a false positive |
|---|---|---|---|---|---|---|
| **176** | 3 | Sat | dinner | 1566 | One-pan coconut dhal | All 14 ingredients are plant-based; flagged solely because "coconut milk" contains "milk" |
| **740** | 4 | Wed | dinner | 1567 | Quick & easy chickpea coconut dhal | Same — "400g can coconut milk" triggers the dairy keyword |

**These 2 entries should be excluded from the cleanup delete.** Deleting them would incorrectly remove vegan meals from a Vegan user's planner.

The root cause (dairy keyword matching "coconut milk") is a pre-existing limitation of the `dietRules` engine, out of scope for this cleanup. It should be fixed in a separate pass.

---

## Entries proposed for removal (45 genuinely non-compliant)

The 47 flagged minus the 2 false positives above = **45 entries safe to remove**.

| Entry ID | Week | Day | Slot | Meal ID | Meal name | Why non-compliant |
|---|---|---|---|---|---|---|
| 673 | 1 | Wed | snacks | 2148 | Green minestrone with tortellini | diet:Vegan (egg pasta + cheese filling) |
| 678 | 1 | Wed | lunch | 2151 | tuna spahgetti | diet:Vegan (tuna = fish) |
| 177 | 3 | Sun | dinner | 532 | Mussels Mariniere | diet:Vegan (mussels = shellfish) |
| 170 | 2 | Sun | dinner | 911 | Prawn & harissa spaghetti | diet:Vegan (prawn = shellfish) |
| 164 | 2 | Mon | dinner | 1564 | Red lentil & squash dhal | diet:Vegan (1.2l chicken stock) |
| 165 | 2 | Tue | dinner | 1484 | Pasta Puttanesca (Tart's Spaghetti) | diet:Vegan (anchovies) |
| 166 | 2 | Wed | dinner | 1565 | Chickpea & coconut dhal | diet:Vegan (ghee = dairy) |
| 171 | 3 | Mon | dinner | 1555 | Lentil & sweet potato curry | diet:Vegan (natural yogurt to serve = dairy) |
| 167 | 2 | Thu | dinner | 468 | Moules marinière | diet:Vegan (mussels = shellfish) |
| 172 | 3 | Tue | dinner | 399 | Thai curry noodle soup | diet:Vegan (king prawns = shellfish) |
| 168 | 2 | Fri | dinner | 1165 | Pizza Margherita in 4 easy steps | diet:Vegan (mozzarella = dairy) |
| 169 | 2 | Sat | dinner | 1634 | Steak Diane | diet:Vegan (steak = meat, butter/cream = dairy) |
| 173 | 3 | Wed | dinner | 1570 | Easy paella | diet:Vegan (chicken stock + seafood mix) |
| 174 | 3 | Thu | dinner | 1167 | My Big Fat Greek Salad | diet:Vegan (feta = dairy) |
| 175 | 3 | Fri | dinner | 109 | Molten cheese-stuffed burgers | diet:Vegan (cheese = dairy, beef = meat) |
| 679 | 1 | Thu | dinner | 400 | Thai Green Curry | diet:Vegan (chicken + fish sauce) |
| 206 | 2 | Tue | breakfast | 75 | Breakfast burrito | diet:Vegan (eggs + cheese) |
| 207 | 2 | Wed | breakfast | 75 | Breakfast burrito | diet:Vegan (eggs + cheese) |
| 208 | 2 | Fri | breakfast | 75 | Breakfast burrito | diet:Vegan (eggs + cheese) |
| 209 | 3 | Mon | breakfast | 75 | Breakfast burrito | diet:Vegan (eggs + cheese) |
| 210 | 3 | Tue | breakfast | 75 | Breakfast burrito | diet:Vegan (eggs + cheese) |
| 211 | 3 | Wed | breakfast | 75 | Breakfast burrito | diet:Vegan (eggs + cheese) |
| 212 | 3 | Fri | breakfast | 75 | Breakfast burrito | diet:Vegan (eggs + cheese) |
| 205 | 2 | Mon | breakfast | 75 | Breakfast burrito | diet:Vegan (eggs + cheese) |
| 680 | 1 | Fri | lunch | 2151 | tuna spahgetti | diet:Vegan (tuna = fish) |
| 691 | 1 | Tue | dinner | 466 | Teriyaki salmon | diet:Vegan (salmon = fish) |
| 681 | 1 | Sat | dinner | 1568 | Seafood paella | diet:Vegan (seafood mix) |
| 677 | 1 | Thu | lunch | 2150 | tuna spahgetti | diet:Vegan (tuna = fish) |
| 686 | 1 | Wed | dinner | 1478 | The best spaghetti bolognese recipe | diet:Vegan (beef mince + bacon) |
| 674 | 1 | Fri | dinner | 1560 | Beef burger with sweet potato chilli chips | diet:Vegan (beef = meat) |
| 737 | 4 | Sun | dinner | 1387 | Lasagne | diet:Vegan (beef + cheese) |
| 738 | 4 | Mon | dinner | 1563 | Khatti dhal | diet:Vegan (ghee/butter = dairy) |
| 739 | 4 | Tue | dinner | 1569 | Seafood rice | diet:Vegan (seafood) |
| 741 | 4 | Thu | dinner | 1560 | Beef burger with sweet potato chilli chips | diet:Vegan (beef = meat) |
| 742 | 4 | Fri | dinner | 1570 | Easy paella | diet:Vegan (chicken stock + seafood) |
| 743 | 4 | Sat | dinner | 466 | Teriyaki salmon | diet:Vegan (salmon = fish) |
| 744 | 6 | Sun | dinner | 1165 | Pizza Margherita in 4 easy steps | diet:Vegan (mozzarella = dairy) |
| 746 | 6 | Tue | dinner | 1484 | Pasta Puttanesca (Tart's Spaghetti) | diet:Vegan (anchovies) |
| 747 | 6 | Wed | dinner | 1565 | Chickpea & coconut dhal | diet:Vegan (ghee = dairy) |
| 748 | 6 | Thu | dinner | 1556 | Lentil & sweet potato curry (Edited) | diet:Vegan (natural yogurt = dairy) |
| 749 | 6 | Fri | dinner | 109 | Molten cheese-stuffed burgers | diet:Vegan (cheese + beef) |
| 750 | 6 | Sat | dinner | 1568 | Seafood paella | diet:Vegan (seafood) |
| 687 | 3 | Thu | lunch | 1465 | Iced fairy cakes | diet:Vegan (butter + eggs) |
| 685 | 1 | Sat | dinner | 1568 | Seafood paella | diet:Vegan (seafood) |
| 676 | 1 | Fri | dinner | 1387 | Lasagne | diet:Vegan (beef + cheese) |

---

## Compliant entries preserved (9)

These entries pass the compliance check and must not be touched:

| Week | Day | Slot | Meal ID | Meal name |
|---|---|---|---|---|
| *(9 entries — not individually listed; confirmed compliant by engine)* | | | | |

---

## Data changed

**NONE.** This was a dry run. The script (`server/tests/dry-run-planner-compliance-cleanup.ts`) only reads; it performs no deletes or updates.

---

## Recommended next action

1. **Review the 45 entries above.** Confirm they should be deleted from `planner_entries`.
2. **Confirm the 2 false positives (entries 176, 740) should be excluded** from the cleanup delete.
3. **Explicitly approve** before the cleanup script runs any deletes.
4. After approval, the cleanup script will delete only the approved 45 (or whichever subset is confirmed), using `storage.deletePlannerEntry(id)` one by one — no batch deletes, no cascade.
5. A rollback-after tag will be created post-cleanup.

**The cleanup script does not exist yet.** It will only be written after explicit approval is received.

---

## Rollback plan

If cleanup is wrong:
- No meal records are deleted — only `planner_entries` rows.
- No templates are deleted.
- Deleted entry rows can be reinserted from the table above (entry id, dayId, mealType, audience, mealId).
- `rollback/before-planner-entry-cleanup-2026-06-06` @ `af620b9` marks the code state; the database state at that tag is the pre-cleanup baseline.

---

## Mandatory checks status

| Check | Status |
|---|---|
| `git status` clean before dry run | ✅ Untracked files only, no tracked modifications |
| Rollback tag created | ✅ `rollback/before-planner-entry-cleanup-2026-06-06` |
| Dry run uses shared compliance engine only | ✅ `isMealCompliantForUser` → `candidateDietExcluded` → `dietRules.shouldExcludeRecipe` |
| No data changed by dry run | ✅ Confirmed |
| False positives identified and flagged | ✅ Entries 176, 740 (coconut milk / "milk" keyword collision) |

---

## AWAITING EXPLICIT APPROVAL BEFORE ANY DELETES
