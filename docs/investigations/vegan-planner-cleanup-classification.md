VEGAN PLANNER CLEANUP CLASSIFICATION REVIEW: COMPLETE

**Date:** 2026-06-06
**Type:** Investigation only — 🟡 AMBER
**Subject:** Classify the 45 non-compliant planner entries from the dry run into Hard Fail vs Adaptable before any cleanup.

---

## Rollback identifier

**Tag:** `rollback/before-vegan-cleanup-classification-2026-06-06` @ `af620b9`

No data changed during this investigation.

---

## Overview

| Category | Unique meals | Planner entries |
|---|---|---|
| **Hard Fail** | 15 | 24 |
| **Adaptable** | 12 | 21 |
| **False positives** | 2 (meals 1566, 1567) | 2 (entries 176, 740) |
| **Total checked** | — | 47 flagged / 45 genuine |

Compliant entries preserved throughout: **9**

---

## SECTION 1 — Hard Fail

**Definition:** The identity of the meal depends on the restricted ingredient. Removing or swapping the ingredient destroys the dish. These should be removed from a Vegan user's planner without requiring recipe changes.

| Meal ID | Meal name | Non-compliant ingredient(s) | Entries | Confidence |
|---|---|---|---|---|
| 109 | Molten cheese-stuffed burgers | Beef mince + pancetta + egg yolk + cheddar + mozzarella | 175, 749 | HIGH |
| 466 | Teriyaki salmon | Salmon fillets | 691, 743 | HIGH |
| 468 | Moules marinière | Mussels + butter | 167 | HIGH |
| 532 | Mussels Mariniere | Mussels + butter | 177 | HIGH |
| 911 | Prawn & harissa spaghetti | King prawns | 170 | HIGH |
| 1387 | Lasagne | Beef mince + bacon + crème fraîche + mozzarella + parmesan | 737, 676 | HIGH |
| 1478 | The best spaghetti bolognese recipe | Beef mince + bacon + parmesan + beef stock | 686 | HIGH |
| 1484 | Pasta Puttanesca (Tart's Spaghetti) | Anchovies (1 of 7 ingredients; defines puttanesca identity) | 165, 746 | HIGH |
| 1560 | Beef burger with sweet potato chilli chips | Beef mince + parmesan | 674, 741 | HIGH |
| 1568 | Seafood paella | King prawns + monkfish + mussels + chicken stock | 681, 750, 685 | HIGH |
| 1569 | Seafood rice | Chorizo + fish stock + seafood mix | 739 | HIGH |
| 1570 | Easy paella | Chicken stock + seafood mix | 173, 742 | HIGH |
| 1634 | Steak Diane | Beef fillet + beef stock + butter + heavy cream | 169 | HIGH |
| 2150 | tuna spahgetti *(planner-placeholder, 0 ingredients)* | Name = tuna | 677 | HIGH |
| 2151 | tuna spahgetti *(planner-placeholder, 0 ingredients)* | Name = tuna | 678, 680 | HIGH |

**Hard Fail totals: 15 unique meals → 24 planner entries**

### Notes on Hard Fail meals

- **Meals 2150 and 2151** are `planner-placeholder` source-type records with zero stored ingredients. The compliance engine flags them on the meal name alone ("tuna" → `FISH_SEAFOOD_KEYWORDS`). These are not real recipe records — they were typed as freetext names. They have no adaptation potential and no value as cookbook entries.
- **Pasta Puttanesca**: anchovies are 1 of only 7 ingredients and define the sauce's identity. A puttanesca without anchovies is not puttanesca. Classified Hard Fail, not Adaptable.
- **Easy paella and Seafood paella**: both contain multiple seafood items or seafood-adjacent stock; the meal identity in both cases is the seafood.
- **Steak Diane**: steak, beef stock, butter, and cream are all non-vegan and all core to the dish. Hard Fail.

---

## SECTION 2 — Adaptable

**Definition:** The meal structure and identity survive intact after a small substitution. The non-vegan ingredient is a cooking medium, garnish, stock, or filling that has a well-established plant-based equivalent.

| Meal ID | Meal name | Non-compliant ingredient(s) | Entries | Adaptation | Confidence |
|---|---|---|---|---|---|
| 75 | Breakfast burrito | 1 egg | 205, 206, 207, 208, 209, 210, 211, 212 | Swap 1 egg → scrambled firm tofu (turmeric + pinch nutritional yeast) | HIGH |
| 399 | Thai curry noodle soup | 150g king prawns (+ possible shrimp paste in curry paste) | 172 | Swap prawns → firm tofu; verify curry paste is vegan | LOW–MEDIUM |
| 400 | Thai Green Curry | 450g chicken + 2 tsp fish sauce | 679 | Swap chicken → firm tofu or chickpeas; fish sauce → soy sauce/tamari; verify curry paste | MEDIUM |
| 1165 | Pizza Margherita in 4 easy steps | 125g mozzarella + parmesan | 168, 744 | Swap mozzarella → vegan mozzarella (e.g. Violife); parmesan → nutritional yeast or vegan parmesan | MEDIUM |
| 1167 | My Big Fat Greek Salad | Feta cheese (1 of 14 ingredients) | 174 | Swap feta → vegan feta (e.g. Violife) | HIGH |
| 1465 | Iced fairy cakes | Butter (×2) + eggs | 687 | Swap butter → vegan block butter (Flora, Stork Plant); eggs → flax eggs or aquafaba; check sprinkles/marshmallows for gelatin | MEDIUM |
| 1555 | Lentil & sweet potato curry | "natural yogurt…to serve" (serving garnish) | 171 | Swap yogurt garnish → coconut or oat plain yogurt | HIGH |
| 1556 | Lentil & sweet potato curry (Edited) | "natural yogurt…to serve" (serving garnish) | 748 | Same as 1555 | HIGH |
| 1563 | Khatti dhal | "oil **or ghee** (or a mixture of oil and unsalted butter)" | 738 | Use the oil option — the recipe itself already offers it | VERY HIGH |
| 1564 | Red lentil & squash dhal | 1.2l chicken stock | 164 | Swap → 1.2l vegetable stock (like-for-like volume) | HIGH |
| 1565 | Chickpea & coconut dhal | Ghee (×2 in recipe — "ghee **or** groundnut oil" for first instance) | 166, 747 | First instance: use groundnut oil (recipe already offers it); second: swap ghee/butter → coconut oil or vegan butter | HIGH |
| 2148 | Green minestrone with tortellini | "chicken **or** vegetable stock" + tortellini (egg pasta + cheese) | 673 | Stock: choose veg option (recipe already offers it); tortellini: swap → vegan tortellini (Waitrose, Unearthed) | MEDIUM |

**Adaptable totals: 12 unique meals → 21 planner entries**

### Notes on Adaptable meals

- **Breakfast burrito (meal 75, 8 entries):** This is by far the highest-impact adaptable meal by entry count. A single egg is the only non-vegan ingredient in an otherwise fully plant-based dish (avocado, kale, tomatoes, wholemeal wrap). The adaptation is trivial and the result is a well-established vegan meal.
- **Khatti dhal (meal 1563):** The recipe explicitly writes "oil or ghee (or a mixture of oil and unsalted butter)" — the vegan path is already documented in the recipe. No recipe rewrite needed, just a shopping/cooking choice.
- **Red lentil & squash dhal (meal 1564):** "1.2l chicken stock" is the sole non-vegan ingredient. Swapping to vegetable stock is a pure like-for-like volume swap with no structural change to the dish.
- **Lentil & sweet potato curry (meals 1555 / 1556):** "natural yogurt" appears in the ingredients as a serving suggestion ("natural yogurt and naan bread, to serve"), not baked into the dish itself. Plant yogurt replaces it without touching the recipe body.
- **Thai curry noodle soup (meal 399) / Thai Green Curry (meal 400):** Both classified Adaptable but at lower confidence because Thai curry pastes often contain shrimp paste. The protein swap is straightforward; the paste needs verification. Adaptation confidence is dragged down by this hidden dependency.
- **Green minestrone with tortellini (meal 2148):** Two issues — the stock (easy: recipe offers the veg option) and the tortellini (harder: requires vegan tortellini to be sourced). Vegan tortellini exists but is less common than other vegan alternatives, hence MEDIUM confidence.
- **Meals 1555 and 1556** are two versions of the same recipe (Edited variant removed the red onion). They are stored as separate meal records.

---

## SECTION 3 — False Positives

**Previously identified (confirmed):**

| Entry ID | Meal ID | Meal name | Why it's a false positive |
|---|---|---|---|
| 176 | 1566 | One-pan coconut dhal | "400g can coconut milk" — "milk" matches `DAIRY_KEYWORDS` but coconut milk is fully plant-based |
| 740 | 1567 | Quick & easy chickpea coconut dhal | Same — "400g can coconut milk" triggers the dairy keyword |

**Additional false positives identified during this investigation:** NONE.

All other 45 flagged entries are correctly identified as containing genuine animal-derived ingredients (confirmed by ingredient list review). The "coconut milk" / "milk" keyword collision affects only these two meals.

**Root cause (out of scope to fix here):** `DAIRY_KEYWORDS` includes `"milk"` as a standalone string. `containsAny()` performs a substring search, so any ingredient containing the word "milk" — including "coconut milk", "oat milk", or "almond milk" — will trigger the dairy filter. This is a pre-existing engine limitation; it does not affect any of the 45 genuinely non-compliant entries.

---

## Key questions answered

**1. Of the 45 proposed removals, how many are genuinely unsuitable for Vegan users?**

All 45 are genuinely non-compliant in their current form — every one contains at least one confirmed animal-derived ingredient. The 21 Adaptable entries are non-compliant now but have a clear path to compliance via recipe changes.

**2. How many are realistically adaptable?**

21 entries (12 unique meals) are realistically adaptable. Of these, 17 entries (10 meals) are HIGH or VERY HIGH confidence — straightforward single-ingredient swaps using widely available plant-based alternatives.

**3. Which adaptations are simple and low risk?**

| Adaptation | Meals | Risk |
|---|---|---|
| Chicken/veg stock → vegetable stock | 1564, 2148 (partial) | 🟢 Very low — volume-for-volume swap |
| Ghee → oil (recipe already offers it) | 1563, 1565 | 🟢 Very low — documented in the recipe |
| Yogurt serving garnish → plant yogurt | 1555, 1556 | 🟢 Very low — garnish, not in recipe body |
| Single egg → tofu scramble | 75 | 🟢 Low — established vegan swap |
| Feta → vegan feta | 1167 | 🟡 Low–medium — needs good vegan feta |
| Mozzarella/parmesan → vegan | 1165, 1565 | 🟡 Medium — vegan cheese quality varies |
| Butter + eggs → vegan alternatives (baking) | 1465 | 🟡 Medium — texture may vary slightly |
| Chicken → tofu + fish sauce → soy | 400, 399 | 🟡 Medium — curry paste shrimp paste caveat |

**4. Which meals should definitely be removed?**

All 24 HARD FAIL entries across 15 meals. These are definitively non-vegan dishes where the animal-derived ingredient is the identity of the meal — beef, salmon, mussels, steak, prawns, tuna (placeholder), seafood paella, seafood rice, bolognese, lasagne, puttanesca, cheeseburgers. There is no vegan version of these meals as written.

**5. What would the planner look like after removing only Hard Fail entries?**

- 9 currently-compliant entries: unchanged
- 21 adaptable entries: remain (still non-compliant, but awaiting recipe adaptation)
- 24 Hard Fail entries: removed
- Net: 30 entries remain, 21 of which need recipe adaptation to become fully compliant
- Many dinner slots across weeks 1–6 would be empty (mostly dinners; the 24 Hard Fail entries are predominantly dinner slots)
- Weeks 2, 3, 4, 6 dinner slots would be heavily affected
- Week 1 has 6 of the 24 Hard Fail entries

---

## Recommended cleanup strategy

### Phase 1 — Hard Fail removal (safe to approve now)
Remove the 24 Hard Fail entries. These are clear, irreversible non-vegan meals with no adaptation path that preserves the dish.

**Entry IDs to delete:** 175, 749, 691, 743, 167, 177, 170, 737, 676, 686, 165, 746, 674, 741, 681, 750, 685, 739, 173, 742, 169, 677, 678, 680

Risk: 🟢 LOW — these are definitively inappropriate; no loss of useful vegan data.

### Phase 2 — Adaptable entry handling (separate decision)
The 21 Adaptable entries should NOT be deleted at the same time as Phase 1. Options:

| Option | Description | Risk |
|---|---|---|
| A. Leave and badge | Keep entries in planner; show "Needs adaptation" badge | 🟢 Low — no deletion |
| B. Leave until recipe is adapted | Remove only after a vegan version of the meal is created and linked | 🟡 Medium — planner remains non-compliant |
| C. Delete now, create vegan equivalents separately | Delete all 21, plan new vegan versions | 🟡 Medium — 21 slots go empty |

**Recommended: Option A or B.** Do not conflate Phase 2 with Phase 1 cleanup.

### Phase 3 — False positive review (separate, engine scope)
Fix `DAIRY_KEYWORDS` to not match "coconut milk", "oat milk", etc. Out of scope for this investigation.

---

## Risk assessment

| Item | Risk |
|---|---|
| Hard Fail entry deletion (24 entries) | 🟢 LOW — clear dietary violations, no vegan use case |
| Adaptable entry deletion (21 entries) | 🟡 MEDIUM — data loss without recipe adaptation is wasteful |
| False positive exclusion (2 entries) | 🟢 LOW — correctly identified; exclusion from cleanup is safe |
| Compliance engine changes | Not in scope |

---

## DATA IMPACT DECLARATION

- Reads existing data: **Yes**
- Writes data: **No**
- Changes meaning of existing data: **No**
- Requires backfill: **No**
- Schema changes: **No**

## CODE CHANGES MADE: NONE
