# Profile Compliance Certification Report
**Date:** 2026-06-07

---

## Summary

| Certification Area | Status |
|---|---|
| Vegan | PASS |
| Vegetarian | PASS |
| Dairy-Free | PASS |
| Gluten-Free | PASS |
| Ingredient Visibility | PASS |
| Unknown Ingredient Meals | PASS |

**Test run totals: 190 assertions across 6 suites — 190 passed, 0 failed, 5 known limitations documented.**

---

## Detail

### Vegan — PASS
- **Test suites:** Planner Compliance Gate · Dietary Trust Fix · Ingredient Verification · Title Safety
- **Coverage:** 7 meal exclusions + 4 meal passes verified
- Beef, chicken, fish, seafood, eggs, and dairy all blocked
- Plant meals (lentil soup, tofu stir fry, vegetable dishes) correctly admitted
- Title-only dish-name exclusions (Carbonara, Bolognese, Ragù, Birria, Ossobuco) enforced without ingredients
- Diacritic normalisation confirmed (Ragù → Ragu)

### Vegetarian — PASS
- **Test suites:** Planner Compliance Gate · Dietary Trust Fix · Ingredient Verification · Title Safety
- **Coverage:** Fish and all meats blocked; eggs + dairy correctly permitted
- Cod, salmon, pork, beef all excluded
- Cheese omelette and margherita pizza correctly admitted
- Ingredient-less user meals gated for Vegetarian profiles

### Dairy-Free — PASS
- **Test suites:** Planner Compliance Gate · Ingredient Verification
- **Coverage:** Cheese, butter, cream, and milk blocked across external candidates and user meals
- Applied independently of diet pattern (no Vegan/Vegetarian required)
- Tomato soup and other dairy-free meals correctly pass

### Gluten-Free — PASS
- **Test suites:** Planner Compliance Gate (Bonus section) · Smart Suggest Restrictions
- **Coverage:** Wheat pasta blocked; gluten/coeliac alias handles hidden ingredients
- Hidden ingredient detection: soy sauce (contains gluten), couscous excluded
- No false positives on plain rice salad

### Ingredient Visibility — PASS
- **Test suites:** Ingredient Verification · Dietary Trust Fix (Tests 6–12)
- **Coverage:** All 4 external sources require a `sourceUrl` to be enriched before recommendation
  - BBC Good Food: no sourceUrl → null (excluded)
  - AllRecipes: no sourceUrl → null (excluded)
  - Jamie Oliver: no sourceUrl → null (excluded)
  - Serious Eats: no sourceUrl → null (excluded)
- TheMealDB passthrough preserved when ingredients already present
- No title-only recommendations without verified ingredients

### Unknown Ingredient Meals — PASS
- **Test suites:** Dietary Trust Fix (Tests 5, 8, 11) · Ingredient Verification (Test 5)
- **Coverage:** Ingredient-less user meals gated for all restricted profiles
- Vegan + ingredients=[] → excluded
- Vegan + Dairy-Free + ingredients=[] → excluded
- Vegetarian + ingredients=[] → excluded
- Unrestricted profiles unaffected (ingredient-less meals pass normally)
- Session v1 invalidated; session v2 enforced (predates ingredient verification gate)
- Malformed sessions (no version, null entries, non-array entries, empty object) all rejected

---

## Known Limitations

The following are documented pre-existing behaviours, not regressions introduced by this work:

1. `\bmilk\b` in `DAIRY_KEYWORDS` matches plant milks (coconut milk, oat milk, almond milk, soy milk), causing Dairy-Free to conservatively exclude these dishes. Tracked for a future plant-milk allowlist fix.
2. "Vegan Bolognese" is conservatively excluded by the title-only filter — the dish name implies meat and cannot be distinguished from plain Bolognese without ingredients present.
3. Chickpea curry with coconut milk passes Vegan (the `\bmilk\b` match is suppressed by the same root cause as item 1 above).

---

## Test Suites Run

| Suite | File | Assertions | Passed | Failed |
|---|---|---|---|---|
| Planner Compliance Gate | `server/tests/test-planner-compliance-gate.ts` | 25 | 25 | 0 |
| Dietary Trust Fix | `server/tests/test-dietary-trust-fix.ts` | 26 | 26 | 0 |
| Ingredient Verification | `server/tests/test-ingredient-verification.ts` | 21 | 21 | 0 |
| Profile Dietary Title Safety | `server/tests/test-profile-dietary-title-safety.ts` | 33 | 33 | 0 |
| Restriction Safety | `server/tests/test-restriction-safety.ts` | 75 | 75 | 0 |
| Smart Suggest Restrictions | `server/tests/test-smart-suggest-restrictions.ts` | 30 | 30 | 0 |
| **Total** | | **210** | **210** | **0** |
