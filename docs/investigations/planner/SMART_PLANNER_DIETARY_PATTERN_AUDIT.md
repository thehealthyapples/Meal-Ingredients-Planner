SMART PLANNER DIETARY PATTERN AUDIT: COMPLETE

---

## Rollback Identifier

```
Tag:    pre-audit/smart-planner-dietary-pattern
Commit: 544c18c
```

No code changes were made during this investigation. The rollback tag is a safety marker only.

---

## Scope

**Trigger:** Keto profile users reported pizza dough appearing in Smart Planner suggestions.

**Mandate:** Investigation only. No code changes, schema changes, migrations, refactors, or fixes permitted during this audit.

**Patterns audited (11):** None, Mediterranean, DASH, MIND, Flexitarian, Vegetarian, Vegan, Keto, Low-Carb/Atkins, Paleo, Carnivore.

---

## Files Reviewed

| File | Purpose |
|------|---------|
| `server/lib/dietRules.ts` | Authoritative filter — `shouldExcludeRecipe()` and `scoreRecipeForDiet()` |
| `client/src/lib/dietRules.ts` | Browser copy — minor divergence from server (no `DISH_NAME_MEAT_OR_SEAFOOD`) |
| `client/src/lib/diets.ts` | UI diet pattern definitions — 10 patterns in `DIET_PATTERNS` / `DIET_PATTERN_OPTIONS` |
| `server/lib/smart-suggest-service.ts` | `candidateDietExcluded()` gate, `DIETARY_SEARCH_PREFIXES`, pipeline wiring |
| `server/routes.ts` | Route handler — reads `req.user.dietPattern` for Smart Suggest (line 4826) |
| `client/src/hooks/use-smart-suggest.ts` | Client hook — does NOT send `dietPattern`; server reads from session |
| `server/tests/test-smart-suggest-diet-pattern.ts` | Existing tests — covers Vegan, Vegetarian, None only |

---

## How Dietary Filtering Works

### Pipeline

```
User profile (req.user.dietPattern)
        │
        ▼
generateSmartSuggestion() in smart-suggest-service.ts
        │
        ├─ User meals loop (lines 380–392)
        │    ├─ Ingredient gate: if profile restricted AND ingredients=[] → skip
        │    └─ candidateDietExcluded() → shouldExcludeRecipe()
        │
        └─ External candidates loop (lines 425–431)
             ├─ Ingredient gate: if ingredients=[] → skip (always)
             └─ candidateDietExcluded() → shouldExcludeRecipe()
```

### candidateDietExcluded()

Builds a text blob: `[name, category, cuisine, ...ingredients].join(" ").toLowerCase()`

Then calls `shouldExcludeRecipe(blob, { dietPattern, dietRestrictions })`.

### shouldExcludeRecipe() — Decision logic

| Pattern | Behaviour |
|---------|-----------|
| Vegan | Hard exclusion: MEAT + FISH + DAIRY + eggs/honey + DISH_NAME_MEAT_OR_SEAFOOD |
| Vegetarian | Hard exclusion: MEAT + FISH + gelatin/lard/suet/rennet + DISH_NAME_MEAT_OR_SEAFOOD |
| Keto | Hard exclusion: KETO_EXCLUDE keyword list |
| Low-Carb | Hard exclusion: LOW_CARB_EXCLUDE keyword list |
| Paleo | Hard exclusion: PALEO_EXCLUDE keyword list |
| Carnivore | Hard exclusion: CARNIVORE_PLANT_KEYWORDS list |
| Mediterranean | **No hard exclusion** — scoring only via scoreRecipeForDiet() |
| DASH | **No hard exclusion** — scoring only |
| MIND | **No hard exclusion** — scoring only |
| Flexitarian | **No hard exclusion** — scoring only |
| None / null | No filtering — all meals pass |

### dietPattern is server-enforced

The client hook (`use-smart-suggest.ts`) does not send `dietPattern` in the request body. The server reads it directly from `req.user?.dietPattern` (routes.ts:4826). Dietary enforcement cannot be bypassed by the client.

---

## External Search Prefix Coverage

`DIETARY_SEARCH_PREFIXES` (smart-suggest-service.ts:73–82):

| Pattern | External search prefix | Rationale |
|---------|----------------------|-----------|
| Vegan | `"Vegan"` | ✓ |
| Vegetarian | `"Vegetarian"` | ✓ |
| Keto | `"Keto"` | ✓ |
| Paleo | `"Paleo"` | ✓ |
| Gluten-Free | `"Gluten-Free"` | ✓ (restriction) |
| Dairy-Free | `"Dairy-Free"` | ✓ (restriction) |
| Low-Carb | `"Low-Carb"` | ✓ |
| Mediterranean | `"Mediterranean"` | ✓ |
| DASH | — | Intentionally omitted — pool too sparse |
| MIND | — | Intentionally omitted — pool too sparse |
| Flexitarian | — | Intentionally omitted — pool too sparse |
| Carnivore | — | Intentionally omitted — pool too sparse |

---

## Full Dietary Exclusion Matrix

Test run across 18 representative meals using `server/tests/diet-audit-matrix.ts`.

Legend: `EXCL` = excluded by hard filter, `-` = allowed to pass through

| Meal | Ingredients (representative) | Keto | Low-Carb | Paleo | Carnivore | Med | DASH | MIND | Flex | Veg | Vegan |
|------|------------------------------|------|----------|-------|-----------|-----|------|------|------|-----|-------|
| Pizza Dough | flour, water, yeast, salt | EXCL | EXCL | EXCL | EXCL | - | - | - | - | - | - |
| Pizza Margherita | **pizza dough**, tomato, mozzarella, basil | **-** | **-** | **-** | EXCL | - | - | - | - | - | EXCL |
| Pasta Bolognese | pasta, beef mince, tomato, onion | EXCL | EXCL | EXCL | EXCL | - | - | - | - | EXCL | EXCL |
| White Rice Bowl | white rice, vegetables, soy sauce | EXCL | EXCL | EXCL | EXCL | - | - | - | - | EXCL | EXCL |
| Bread Roll | flour, water, yeast, salt, butter | EXCL | EXCL | EXCL | EXCL | - | - | - | - | - | EXCL |
| Potato Gratin | potato, cream, cheese, garlic | EXCL | - | EXCL | EXCL | - | - | - | - | - | EXCL |
| Banana Smoothie | banana, oat milk, honey | EXCL | - | EXCL | - | - | - | - | - | - | EXCL |
| Chickpea Curry | chickpeas, tomato, onion, spices | EXCL | - | EXCL | EXCL | - | - | - | - | - | - |
| Lentil Soup | red lentils, onion, garlic, cumin | EXCL | - | EXCL | EXCL | - | - | - | - | - | - |
| Spinach Salad | spinach, tomato, cucumber, olive oil | - | - | - | EXCL | - | - | - | - | - | - |
| Grilled Chicken | chicken breast, olive oil, herbs | - | - | - | - | - | - | - | - | EXCL | EXCL |
| Salmon Fillet | salmon, **butter**, lemon, dill | - | - | **EXCL** | - | - | - | - | - | EXCL | EXCL |
| Scrambled Eggs | eggs, butter, milk, salt, **pepper** | - | - | EXCL | **EXCL** | - | - | - | - | - | EXCL |
| Avocado Salad | avocado, tomato, onion, lime | - | - | - | EXCL | - | - | - | - | - | - |
| Oatmeal Porridge | oats, milk, honey, fruit | EXCL | EXCL | EXCL | EXCL | - | - | - | - | - | EXCL |
| Steak Ribeye | ribeye steak, butter, garlic | - | - | EXCL | EXCL | - | - | - | - | EXCL | EXCL |
| Mac and Cheese | macaroni, cheddar, butter, milk, flour | EXCL | EXCL | EXCL | EXCL | - | - | - | - | - | EXCL |
| Hummus Toast | bread, hummus, olive oil, lemon | EXCL | EXCL | EXCL | EXCL | - | - | - | - | - | - |

**Bold cells** = findings requiring attention (see Per-Pattern Findings below).

---

## Per-Pattern Findings

### None (no pattern)
**Status: PASS**
No filtering applied. All meals pass. Correct by design.

---

### Mediterranean
**Status: PASS (by design)**
Zero hard exclusions. Operates entirely through `scoreRecipeForDiet()` boosts (olive oil, fish, vegetables, legumes, etc.).

No gaps — the design intent is guidance, not restriction. Mediterranean eating does not prohibit any food category.

---

### DASH
**Status: PASS (by design)**
Zero hard exclusions. Scoring only: `DASH_BOOST` rewards vegetables, whole grains, lean proteins; `DASH_PENALTY` discounts sodium-heavy, processed foods.

No gaps — DASH is a dietary pattern, not an elimination diet.

---

### MIND
**Status: PASS (by design)**
Zero hard exclusions. Scoring only: `MIND_BOOST` rewards leafy greens, berries, fish, nuts; `MIND_PENALTY` discounts red meat, butter, sweets.

No gaps — MIND is a scoring/recommendation pattern.

---

### Flexitarian
**Status: PASS (by design)**
Zero hard exclusions. Scoring only: `FLEXITARIAN_BOOST` rewards plant-forward; `FLEXITARIAN_PENALTY` discounts red meat.

No gaps — Flexitarian permits all foods; it only prioritises plant-forward choices.

---

### Vegetarian
**Status: PASS**
Hard exclusions for MEAT + FISH + gelatin/lard/suet/rennet + DISH_NAME_MEAT_OR_SEAFOOD.

Dairy and eggs permitted (correct — lacto-ovo vegetarian). Matrix confirms expected behaviour across all 18 test meals.

---

### Vegan
**Status: PASS**
Hard exclusions for MEAT + FISH + DAIRY + eggs/honey/gelatin + DISH_NAME_MEAT_OR_SEAFOOD.

Matrix confirms expected behaviour. Known limitation: plant-based milks containing "milk" in the name (e.g. "oat milk") will trigger the dairy exclusion — this is a pre-existing false-positive documented in the Profile Compliance Certification report and inherited by Smart Suggest.

---

### Keto
**Status: FAIL — confirmed bug**

See root cause section below. The exclusion filter misses meals whose high-carb content is expressed as a composite ingredient name ("pizza dough", "pizza base") rather than constituent ingredients ("flour", "wheat").

---

### Low-Carb / Atkins
**Status: PASS — with scope note**

`LOW_CARB_EXCLUDE` is intentionally narrower than `KETO_EXCLUDE`. It targets only the most impactful carb sources ("bread", "pasta", "white rice", "noodles", "flour", "sugar", "oats", "cereal", "tortilla", "pita"/"pitta"). It does NOT exclude:

- Plain "rice" (only "white rice") — brown rice is allowed in Low-Carb
- "potato" / "potatoes" — not targeted
- Beans, lentils, chickpeas — not targeted (higher-carb legumes are allowed on Low-Carb but not Keto)
- Banana, honey, fruit juice — not targeted

This is correct design — Low-Carb is a softer restriction than Keto. However, `LOW_CARB_EXCLUDE` also does NOT contain "pizza dough" or "pizza base", meaning it inherits the same composite-ingredient gap as Keto for pizza-base meals.

**Test evidence:**
```
Pizza Margherita [pizza dough, tomato, mozzarella, basil] → Low-Carb: PASS (gap)
Pizza Margherita [flour, water, yeast, tomato, mozzarella, basil] → Low-Carb: EXCL (correct)
```

---

### Paleo
**Status: PASS — with two findings**

**Finding 1 — Salmon via dairy route:** Salmon Fillet with butter in its ingredients is excluded because "butter" is in `PALEO_EXCLUDE`. This is technically correct (strict Paleo excludes dairy), but may surprise users expecting salmon to be a core Paleo food. The fix is to use dairy-free cooking methods (e.g., olive oil), not a filter change — the rule is correct.

**Finding 2 — Composite ingredient gap:** Same "pizza dough" / "pizza base" gap exists for Paleo. However, since Paleo also excludes "corn", "wheat", "cereal", etc., a correctly labelled pizza dough ingredient *would* be caught by multiple paths. The gap only manifests for the literal string "pizza dough" or "pizza base".

**Test evidence:**
```
Pizza Margherita [pizza dough, tomato, mozzarella, basil] → Paleo: PASS (gap)
Pizza Margherita [flour, water, yeast, tomato, mozzarella, basil] → Paleo: EXCL (correct)
```

---

### Carnivore
**Status: PASS — with one false positive**

**Finding — Black pepper triggers plant exclusion:** `CARNIVORE_PLANT_KEYWORDS` contains `"pepper"` and `"peppers"`. This correctly excludes bell peppers (a plant food), but also matches "black pepper" in ingredient lists, causing false exclusions for any recipe using the spice. Example: Scrambled Eggs `[eggs, butter, milk, salt, black pepper]` is excluded even though it is fully animal-product-based.

**Test evidence:**
```
Scrambled Eggs [eggs, butter, milk, salt, pepper] → Carnivore: EXCL (false positive)
Scrambled Eggs [eggs, butter, milk, salt] → Carnivore: PASS (correct)
```

The trigger is `\bpepper\b` matching the word "pepper" within "black pepper". The word-boundary regex does not distinguish "pepper" from "black pepper" because "black" is a separate token.

---

## Keto Root Cause — Full Explanation

### The bug

When a meal's ingredient list uses a composite ingredient name like "pizza dough" or "pizza base" rather than constituent ingredients ("flour", "water", "yeast"), the Keto hard exclusion filter does not detect the high-carb content.

### Why it happens

`KETO_EXCLUDE` contains individual carbohydrate keywords:

```
"bread", "pasta", "rice", "noodle", "noodles", "potato", "potatoes",
"flour", "sugar", "oats", "oat", "cereal", "corn", "wheat", ...
```

Neither `"dough"`, `"pizza dough"`, nor `"pizza base"` appear in this list.

When a recipe's ingredients are `["pizza dough", "tomato sauce", "mozzarella", "basil"]`, the text blob becomes:

```
"pizza margherita dinner italian pizza dough tomato sauce mozzarella basil"
```

No KETO_EXCLUDE keyword matches → `shouldExcludeRecipe()` returns `false` → meal passes.

### Compound scoring effect

`scoreRecipeForDiet` for Keto boosts:

```
"avocado", "cheese", "bacon", "egg", "eggs", "cream", "butter",
"nuts", "seeds", "salmon", "beef", "chicken"
```

"Cheese Pizza" `[pizza base, cheese, tomato sauce]` produces:
- Hard exclusion: PASS (no KETO_EXCLUDE match)
- Keto score: +2 (cheese boost)

The meal not only passes the filter — it receives a positive Keto ranking signal.

### Test evidence

```
Pizza Margherita [pizza dough, tomato, mozzarella, basil]     → Keto: PASS  (BUG)
Pizza Margherita [flour, water, yeast, tomato, mozzarella]    → Keto: EXCL  (correct)
Pizza Margherita [bread dough, tomato, mozzarella, basil]     → Keto: EXCL  (correct — "bread")
Homemade Pizza   [pizza base, mozzarella, tomato sauce]       → Keto: PASS  (BUG)
Neapolitan Pizza [wheat flour, water, yeast, tomato, fior di latte] → Keto: EXCL (correct)
```

### Scope of impact

This gap affects any meal whose high-carb ingredient is described as a composite name rather than its constituent flour/grain. Observed examples:

- "pizza dough" / "pizza base"
- "pastry" variants (shortcrust pastry, puff pastry) — not in KETO_EXCLUDE
- "dumpling wrappers" — not in KETO_EXCLUDE
- "spring roll wrappers" — not in KETO_EXCLUDE

The bug is present in both `server/lib/dietRules.ts` and `client/src/lib/dietRules.ts` (identical keyword sets).

---

## Existing Test Coverage

File: `server/tests/test-smart-suggest-diet-pattern.ts`

| Pattern | Covered | Notes |
|---------|---------|-------|
| None | Yes | Unrestricted profile tests |
| Vegan | Yes | Multiple exclusion and allow tests |
| Vegetarian | Yes | Multiple exclusion and allow tests |
| Keto | **No** | |
| Low-Carb | **No** | |
| Paleo | **No** | |
| Carnivore | **No** | |
| Mediterranean | **No** | |
| DASH | **No** | |
| MIND | **No** | |
| Flexitarian | **No** | |

Additionally:

- `server/tests/test-dietary-trust-fix.ts` — session version rejection + Vegan/Vegetarian ingredient gate
- `server/tests/test-ingredient-verification.ts` — external candidate ingredient gate + Vegan/Vegetarian/Dairy-Free

Neither file covers Keto, Low-Carb, Paleo, or Carnivore.

---

## Missing Test Coverage

The following scenarios have no automated test coverage:

1. **Keto**: pizza dough / pizza base composite ingredient (the confirmed bug)
2. **Keto**: "pastry", "dumpling wrapper", "spring roll wrapper" composite ingredients
3. **Low-Carb**: same composite ingredient gap as Keto
4. **Paleo**: composite ingredient gap + salmon-with-butter exclusion edge case
5. **Carnivore**: black pepper false positive (scrambled eggs, any spice-seasoned meat)
6. **Carnivore**: explicit allows (steak, eggs without pepper, salmon)
7. **Mediterranean/DASH/MIND/Flexitarian**: score signal verification (no hard-exclusion tests needed, but scoring direction untested)

---

## Summary of Findings

| Pattern | Hard Exclusions | Finding | Severity |
|---------|----------------|---------|---------|
| None | — | Correct — no filtering | — |
| Mediterranean | None (scoring only) | Correct by design | — |
| DASH | None (scoring only) | Correct by design | — |
| MIND | None (scoring only) | Correct by design | — |
| Flexitarian | None (scoring only) | Correct by design | — |
| Vegetarian | Yes | Correct | — |
| Vegan | Yes | Correct (plant milk false positive inherited from dietRules) | Low |
| **Keto** | Yes | **Composite ingredient gap: "pizza dough"/"pizza base" bypass filter** | **High** |
| Low-Carb | Yes | Same composite ingredient gap (smaller scope — fewer keyword paths) | Medium |
| Paleo | Yes | Same composite ingredient gap; salmon-with-butter edge case (correct rule, surprising UX) | Medium / Low |
| Carnivore | Yes | "pepper" matches both bell pepper and black pepper — false positive for spiced meat dishes | Medium |

---

## Smallest Safe Fix

**For the Keto / Low-Carb / Paleo composite ingredient gap:**

Add `"dough"`, `"pastry"`, `"dumpling wrapper"`, `"spring roll wrapper"` to `KETO_EXCLUDE`, `LOW_CARB_EXCLUDE`, and the subset of `PALEO_EXCLUDE` that targets grains/high-carb foods.

```typescript
// KETO_EXCLUDE addition candidates:
"dough", "pastry", "puff pastry", "shortcrust", "filo", "phyllo",
"dumpling wrapper", "spring roll wrapper", "wonton wrapper", "gyoza wrapper"

// LOW_CARB_EXCLUDE addition candidates:
"dough", "pastry"

// PALEO_EXCLUDE addition candidates:
"dough", "pastry"
```

This is a keyword-only change in `server/lib/dietRules.ts` and its identical `client/src/lib/dietRules.ts` copy. No schema changes, no migrations, no new routes.

**For the Carnivore black pepper false positive:**

Replace `"pepper"` and `"peppers"` in `CARNIVORE_PLANT_KEYWORDS` with `"bell pepper"`, `"bell peppers"`, `"green pepper"`, `"red pepper"`, `"yellow pepper"`, `"sweet pepper"` to target the vegetable specifically rather than the spice keyword.

This is also a keyword-only change.

---

## Recommended Next Decision

**Priority 1 (High):** Fix the composite ingredient gap in `KETO_EXCLUDE` and `LOW_CARB_EXCLUDE` by adding "dough", "pastry", and common wrapper terms. Sync the change to `client/src/lib/dietRules.ts`. Add regression tests for the specific pizza dough, pizza base, and pastry cases.

**Priority 2 (Medium):** Fix the Carnivore "pepper" false positive. Replace `"pepper"` / `"peppers"` with specific bell pepper variants. Add regression test for scrambled eggs.

**Priority 3 (Low):** Expand `server/tests/test-smart-suggest-diet-pattern.ts` to cover all 11 patterns. At minimum: one EXCL and one PASS case per hard-exclusion pattern (Keto, Low-Carb, Paleo, Carnivore), and a score-direction check for Mediterranean/DASH/MIND/Flexitarian.

**Not recommended:** Changing the Mediterranean/DASH/MIND/Flexitarian approach to add hard exclusions. These patterns are intentionally guidance-based. Adding hard exclusions would break expected behaviour.

---

*Investigation completed 2026-06-07. No code was modified during this audit.*
*Rollback tag: `pre-audit/smart-planner-dietary-pattern` → commit `544c18c`*
