# GLUTEN_LIBRARY_COVERAGE_ALIGNMENT

**Date:** 2026-06-12  
**Status:** Complete

---

## Investigation Summary

`SMART_PLANNER_RESTRICTION_ENFORCEMENT_ROOT_CAUSE.md` identified a coverage gap between the two gluten enforcement engines:

| Engine | File | Missing coverage |
|--------|------|-----------------|
| Engine 1 (dietRules) | `server/lib/dietRules.ts` | *(complete)* |
| Engine 2 (restriction-library) | `shared/restrictions/restriction-library.ts` | flour, bread, pasta, noodles, tortilla, panko, hoisin sauce, teriyaki sauce |

Household eaters with Gluten-Free `hardRestrictions` were routed through Engine 2 (the restriction-library resolver). Because those ingredients were absent from the canonical gluten definition, meals containing them could pass through the household compatibility check unblocked.

---

## Implementation Notes

Modified the `gluten` restriction definition in `restriction-library.ts` only.

**Added to `derivedIngredients`:**
- `flour`
- `bread`
- `pasta`
- `noodles`
- `tortilla`
- `panko`

**Added to `hiddenIngredients`:**
- `hoisin sauce`
- `teriyaki sauce`

No other restriction definitions were touched. No resolver logic, matching algorithm, schema, or planner logic was changed.

**Resolver behaviour note:** `flour` and `bread` are matched via `derived_ingredient` sourceType for most real-world ingredient strings. However, "wheat flour" and "bulgur wheat" are matched earlier via `alias:wheat` (since `wheat` is in the gluten aliases and the resolver checks aliases before derivedIngredients). This is correct and expected — both are still blocked.

---

## Files Changed

| File | Change |
|------|--------|
| `shared/restrictions/restriction-library.ts` | Added 6 derivedIngredients + 2 hiddenIngredients to the `gluten` definition |

---

## Rollback Identifier

Tag: `rollback/pre-gluten-library-coverage-alignment`  
Commit: `43fbdda` (checkpoint: pre-nutrition-boost-provenance rollback point)

To rollback:
```
git checkout rollback/pre-gluten-library-coverage-alignment -- shared/restrictions/restriction-library.ts
```

---

## Test Results

### Targeted gluten coverage test (34 cases)

**New derivedIngredients — all blocked:**
- ✓ "wheat flour" blocked (via alias:wheat)
- ✓ "plain flour" blocked (derived_ingredient:flour)
- ✓ "flour" blocked (derived_ingredient:flour)
- ✓ "bread" blocked (derived_ingredient:bread)
- ✓ "sourdough bread" blocked (derived_ingredient:bread)
- ✓ "pasta" blocked (derived_ingredient:pasta)
- ✓ "spaghetti pasta" blocked (derived_ingredient:pasta)
- ✓ "noodles" blocked (derived_ingredient:noodles)
- ✓ "rice noodles" blocked (derived_ingredient:noodles)
- ✓ "udon noodles" blocked (derived_ingredient:noodles)
- ✓ "tortilla" blocked (derived_ingredient:tortilla)
- ✓ "flour tortilla" blocked (derived_ingredient:tortilla)
- ✓ "panko" blocked (derived_ingredient:panko)
- ✓ "panko breadcrumbs" blocked (derived_ingredient:panko)

**New hiddenIngredients — all blocked:**
- ✓ "hoisin sauce" blocked (hidden_ingredient:hoisin sauce)
- ✓ "teriyaki sauce" blocked (hidden_ingredient:teriyaki sauce)

**Existing gluten coverage — all preserved:**
- ✓ couscous, barley, semolina, spelt, rye, bulgur wheat, soy sauce, malt vinegar, worcestershire sauce

**Non-gluten pass-through — all clear:**
- ✓ rice, quinoa, chicken, olive oil, tomato, garlic, lemon juice, oat milk, potato

**Result: 34/34 passed**

### Full restriction-resolver test suite

267/267 passed — no regressions in dairy, peanut, tree_nut, sesame, soy, mustard, shellfish, eggs, or coconut definitions.

---

## Final Verification

**Only approved scope implemented:**
- ✓ 6 entries added to gluten `derivedIngredients`
- ✓ 2 entries added to gluten `hiddenIngredients`
- ✓ No dairy rules changed
- ✓ No plant milk handling changed
- ✓ No vegetarian/vegan enforcement changed
- ✓ No planner logic changed
- ✓ No scoring changed
- ✓ No schema changed
- ✓ No resolver behaviour changed
- ✓ No new restriction types introduced
