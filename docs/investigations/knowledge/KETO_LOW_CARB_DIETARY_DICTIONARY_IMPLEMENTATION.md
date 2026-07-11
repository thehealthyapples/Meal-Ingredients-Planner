KETO LOW-CARB DIETARY DICTIONARY IMPLEMENTED: YES

---

## Rollback Identifiers

| Point | Tag | Commit |
|-------|-----|--------|
| Before implementation | `pre-impl/keto-low-carb-dictionary` | `544c18c` |
| After implementation | — | `b48ceee` |

To rollback: `git checkout 544c18c`

---

## Background

The Smart Planner Dietary Audit confirmed Keto and Low-Carb filtering was failing for meals whose high-carb content was expressed as a composite ingredient name rather than a constituent keyword.

Root cause example:
```
Pizza Margherita [pizza dough, tomato sauce, mozzarella, basil]
  → Keto: PASS (bug — "pizza dough" not in old keyword list)

Pizza Margherita [flour, water, yeast, tomato sauce, mozzarella, basil]
  → Keto: EXCL (correct — "flour" matched)
```

The old `KETO_EXCLUDE` was built from `HIGH_CARB_KEYWORDS` (14 terms) plus 12 additional items — 26 terms total. It missed composite foods, bakery products, sweetened sauces, starchy vegetables, and many legume variants.

---

## Files Changed

| File | Change |
|------|--------|
| `server/lib/dietRules.ts` | Replaced `HIGH_CARB_KEYWORDS` / `KETO_EXCLUDE` / `LOW_CARB_EXCLUDE` with 10-category dictionary |
| `client/src/lib/dietRules.ts` | Same replacement — keeps client/server in sync |
| `server/tests/test-keto-low-carb-dictionary.ts` | New — 80 regression tests across 10 sections |

No schema changes. No migrations. No UI changes. No other files affected.

---

## Dictionary Categories Added

Both `KETO_EXCLUDE` and `LOW_CARB_EXCLUDE` are now composed from:

### Category 1 — Sugars and Sweeteners (`DICT_SUGARS`)
`sugar`, `brown sugar`, `cane sugar`, `icing sugar`, `powdered sugar`, `honey`, `maple syrup`, `agave`, `molasses`, `caramel`, `corn syrup`, `glucose syrup`

### Category 2 — Breads and Bakery Products (`DICT_BAKERY`)
`bread`, `sandwich bread`, `sourdough`, `bagel`, `muffin`, `doughnut`, `crumpet`, `english muffin`, `pancake`, `waffle`, `croissant`

### Category 3 — Doughs and Pastry (`DICT_DOUGHS`)
`dough`, `pizza dough`, `pizza base`, `pastry`, `puff pastry`, `shortcrust pastry`, `filo pastry`, `phyllo pastry`, `pie crust`

*(This category is the primary fix for the reported Keto pizza bug.)*

### Category 4 — Grain Products (`DICT_GRAINS`)
`wheat`, `flour`, `rice`, `pasta`, `noodle`, `noodles`, `couscous`, `bulgur`, `barley`, `oats`, `oat`, `oatmeal`, `quinoa`, `polenta`, `cornmeal`, `corn`, `cereal`, `granola`, `muesli`, `rye`, `spelt`, `semolina`

### Category 5 — Snack Carbohydrates (`DICT_SNACK_CARBS`)
`cracker`, `crackers`, `pretzel`, `pretzels`, `popcorn`, `tortilla chips`, `corn chips`, `breadcrumbs`, `breadcrumb`, `panko`

### Category 6 — Starchy Vegetables (`DICT_STARCHY_VEG`)
`potato`, `potatoes`, `sweet potato`, `sweet potatoes`, `yam`, `cassava`, `parsnip`

### Category 7 — Legumes and Beans (`DICT_LEGUMES`)
`beans`, `lentils`, `legumes`, `chickpeas`, `hummus`, `kidney beans`, `black beans`, `pinto beans`, `split peas`, `navy beans`, `cannellini beans`, `lima beans`

### Category 8 — High-Sugar Fruits (`DICT_HIGH_SUGAR_FRUITS`)
`banana`, `grape`, `grapes`, `raisin`, `raisins`, `dates`, `mango`, `pineapple`, `fruit juice`

### Category 9 — Sweetened Sauces (`DICT_SWEETENED_SAUCES`)
`ketchup`, `barbecue sauce`, `bbq sauce`, `teriyaki sauce`, `sweet chilli sauce`, `sweet chili sauce`, `hoisin sauce`, `sweet and sour sauce`

### Category 10 — Composite Wrappers (`DICT_WRAPPERS`)
`tortilla`, `tortillas`, `pita`, `pitta`, `dumpling wrapper`, `wonton wrapper`, `gyoza wrapper`, `spring roll wrapper`

**Note on bare "wrap"/"wraps":** Intentionally omitted. `"tortilla"` already catches flour-based wraps. Bare `"wrap"` would create false positives for keto-friendly lettuce wrap dishes (the dish name "Lettuce Wraps" contains "wrap" even though the ingredients are carb-free).

---

## Low-Carb / Keto Alignment

`LOW_CARB_EXCLUDE` previously contained only 10 terms (a relaxed subset). It now mirrors `KETO_EXCLUDE` exactly:

```typescript
const LOW_CARB_EXCLUDE = [...KETO_EXCLUDE];
```

Both patterns enforce the same hard-exclusion boundary for Smart Planner recommendations. They remain separate constants and can diverge in a future iteration if needed.

---

## Filters Left Unchanged

The following dietary filters were not modified:

| Filter | Status |
|--------|--------|
| Vegan | Unchanged |
| Vegetarian | Unchanged |
| Dairy-Free | Unchanged |
| Gluten-Free | Unchanged |
| Paleo | Unchanged |
| Carnivore | Unchanged |
| Mediterranean | Unchanged |
| DASH | Unchanged |
| MIND | Unchanged |
| Flexitarian | Unchanged |

---

## Tests Added

File: `server/tests/test-keto-low-carb-dictionary.ts`

| Section | Description | Tests |
|---------|-------------|-------|
| A | Keto: composite dough / pastry exclusions | 9 |
| B | Keto: bakery product exclusions | 8 |
| C | Keto: grain product exclusions | 9 |
| D | Keto: starchy vegetable exclusions | 6 |
| E | Keto: sweetened sauce exclusions | 7 |
| F | Keto: legume exclusions | 5 |
| G | Keto: core keto-friendly foods still allowed | 12 |
| H | False-positive guard (cauliflower pizza, zoodles) | 3 |
| I | Low-Carb mirrors Keto exclusions | 12 |
| J | Vegan / Vegetarian unchanged | 9 |
| **Total** | | **80** |

### Key test cases from spec — confirmed passing

**Keto rejects:**
- pizza dough ✓
- pizza base ✓
- bread ✓
- pasta ✓
- rice ✓
- potato ✓
- muffin ✓
- pancake ✓
- waffle ✓
- tortilla ✓
- teriyaki sauce ✓
- ketchup ✓
- lentils ✓
- chickpeas ✓

**Keto still allows:**
- eggs ✓
- chicken ✓
- beef ✓
- salmon ✓
- avocado ✓
- olive oil ✓
- cauliflower ✓
- spinach ✓
- broccoli ✓

**Low-Carb:** same rejection behaviour as Keto ✓

---

## Build Result

```
npx tsc --noEmit → clean (no output, exit 0)
```

## TypeScript Result

```
PASS — zero type errors
```

## Test Result

```
New tests:     80 passed, 0 failed
Diet pattern:  26 passed, 0 failed  (test-smart-suggest-diet-pattern.ts)
Trust fix:     26 passed, 0 failed  (test-dietary-trust-fix.ts)
Verification:  21 passed, 0 failed  (test-ingredient-verification.ts)

Total:        153 passed, 0 failed
```

---

## Manual Verification Result

Validated via direct invocation of `shouldExcludeRecipe` through the test suite against 80 representative meals. The Smart Planner pipeline (`candidateDietExcluded` → `shouldExcludeRecipe`) is unchanged — the dictionary update propagates automatically because both entry points call the same function.

Keto profile — confirmed excluded:
- Any meal with "pizza dough" or "pizza base" as an ingredient
- Bread, pasta, rice, potato, oatmeal, granola, quinoa, couscous, polenta
- Teriyaki sauce, ketchup, barbecue sauce, hoisin sauce, sweet chilli sauce
- Lentils, chickpeas, kidney beans, black beans, hummus
- Banana, mango, raisins, pineapple

Keto profile — confirmed allowed:
- Grilled salmon, pan-seared chicken, ribeye steak, bacon and eggs
- Cauliflower pizza (cauliflower + mozzarella + egg — no dough/flour ingredient)
- Avocado and bacon salad, broccoli cheese bake, wilted spinach
- Cheese omelette (eggs, cheddar, butter — no carb ingredients)

Low-Carb profile — same exclusion behaviour as Keto.

---

## Known Limitation — Text-Blob Dish Name Matching

The filtering system builds a text blob from `[name, category, cuisine, ...ingredients].join(" ")`. Keywords are matched against the whole blob including the dish name. This means:

- A dish called "Cauliflower Pizza Base" (name contains "pizza base") will be excluded even if the ingredients are purely cauliflower-based.
- A dish called "Courgette Noodles" (name contains "noodles") will be excluded even if served as spiralised courgette.

This is a pre-existing characteristic of the text-blob approach (present before this change) and affects the whole filter system equally. The practical impact is low because properly-named keto alternatives ("Cauliflower Crust", "Zoodles") do not contain carb keywords. Documented here for awareness.

---

## Extensibility

The dictionary structure is designed for future extension:

- Adding a new Paleo term: add to the relevant `DICT_*` constant (or a new `PALEO_*` set)
- Adding Carnivore sauce exclusions: create `CARNIVORE_SAUCES` and spread into `CARNIVORE_PLANT_KEYWORDS`
- Diverging Low-Carb from Keto: replace `[...KETO_EXCLUDE]` with an independent list using the shared `DICT_*` constants

---

## Project File Location

`/home/runner/workspace/KETO_LOW_CARB_DIETARY_DICTIONARY_IMPLEMENTATION.md`
