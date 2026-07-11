# Plant Milk / Plant Cream Dairy-Free False Positive — Implementation

**Date:** 2026-06-12
**Status:** Complete
**Rollback tag:** `rollback/pre-plant-milk-false-positive-fix` (commit `43fbdda`)

---

## Investigation Summary

Dairy-Free household eaters were incorrectly blocked from recipes containing plant-based milks and creams because:

- `dairy.aliases` contains `"milk"` — matched plant milks like `oat milk`, `coconut milk`, etc. via whole-word boundary check
- `dairy.derivedIngredients` contains `"cream"` — matched plant creams like `coconut cream`, `oat cream`, etc. via forward substring check

The `dietRules.ts` server path already stripped plant milks via `removePlantMilkPhrases()`, but plant creams were not included in that list. The restriction resolver path (used by the household compatibility engine) had no equivalent protection.

Approved fix: resolver-level `excludedCompounds` field (STATUS A from investigation).

---

## Files Changed

| File | Change |
|---|---|
| `shared/restrictions/restriction-types.ts` | Added optional `excludedCompounds?: string[]` to `RestrictionDefinition` |
| `shared/restrictions/restriction-resolver.ts` | Added early-exit check in `matchIngredientAgainstDefinition()` |
| `shared/restrictions/restriction-library.ts` | Added `excludedCompounds` list to dairy definition |
| `server/lib/dietRules.ts` | Extended `PLANT_MILK_PHRASES` to include plant cream phrases |
| `server/tests/test-restriction-resolver.ts` | Added sections 29–32 (44 new assertions) |

---

## Implementation Notes

### 1. `restriction-types.ts` — `excludedCompounds` field

Added after `prohibitedPhrases`:

```typescript
excludedCompounds?: string[];
```

Optional field — definitions without it behave identically to before.

### 2. `restriction-resolver.ts` — Early exit in `matchIngredientAgainstDefinition`

Added as step 0, before id / alias / derived / hidden checks:

```typescript
if (definition.excludedCompounds && definition.excludedCompounds.length > 0) {
  for (const compound of definition.excludedCompounds) {
    if (substringIncludes(normIngredient, norm(compound))) {
      return null;
    }
  }
}
```

Uses forward substring (`substringIncludes`) — same strategy as `derivedIngredients`. An excluded compound anywhere in the normalised ingredient triggers an unconditional `null` return, preventing any alias/derived/hidden match downstream.

`excludedCompounds` are **per-definition only** — they do not affect other restriction definitions. `almond milk` excluded from dairy does not suppress `tree_nut` detection.

### 3. `restriction-library.ts` — Dairy `excludedCompounds`

```
Plant milks (14):
  coconut milk, oat milk, rice milk, almond milk, cashew milk,
  hemp milk, pea milk, soy milk, soya milk, hazelnut milk,
  macadamia milk, plant milk, plant-based milk, oat mylk

Plant creams (7):
  coconut cream, oat cream, soya cream, soy cream,
  almond cream, cashew cream, rice cream
```

### 4. `server/lib/dietRules.ts` — Plant cream phrases added

Extended `PLANT_MILK_PHRASES` (no rename, no redesign):

```typescript
"coconut cream", "oat cream", "soya cream", "soy cream",
"almond cream", "cashew cream", "rice cream",
```

These are stripped before DAIRY_KEYWORDS scanning so the residual `"cream"` keyword does not false-positive in the dietRules path (Vegan and Dairy-Free restriction checks).

---

## Tests Executed

| Suite | Before | After | Result |
|---|---|---|---|
| `test:restriction-resolver` | 267 passed | 311 passed | All pass |
| `test:restriction-safety` | 75 passed | 75 passed | All pass |
| `test:smart-suggest-restrictions` | 30 passed | 30 passed | All pass |
| `test:planner-compliance` | 25 passed | 25 passed | All pass |

New test sections added (sections 29–32):

- **Section 29** — 14 plant milks: none match dairy
- **Section 30** — 7 plant creams: none match dairy
- **Section 31** — 15 genuine dairy ingredients: all still match dairy
- **Section 32** — 6 tree-nut regression checks: almond/cashew milks and creams still match tree_nut; excludedCompounds on dairy does not suppress other restrictions

---

## Verification Results

### Should NOT match Dairy-Free

| Ingredient | Resolver result |
|---|---|
| coconut milk | ✓ no match |
| oat milk | ✓ no match |
| rice milk | ✓ no match |
| almond milk | ✓ no match |
| cashew milk | ✓ no match |
| hemp milk | ✓ no match |
| pea milk | ✓ no match |
| soy milk | ✓ no match |
| soya milk | ✓ no match |
| coconut cream | ✓ no match |
| oat cream | ✓ no match |
| soya cream | ✓ no match |
| almond cream | ✓ no match |
| cashew cream | ✓ no match |
| rice cream | ✓ no match |

### Should STILL match Dairy-Free

| Ingredient | Resolver result |
|---|---|
| milk | ✓ dairy match |
| butter | ✓ dairy match |
| cream | ✓ dairy match |
| cheese | ✓ dairy match |
| yoghurt | ✓ dairy match |
| yogurt | ✓ dairy match |
| ghee | ✓ dairy match |
| cow's milk | ✓ dairy match |
| double cream | ✓ dairy match |
| whipped cream | ✓ dairy match |
| condensed milk | ✓ dairy match |
| evaporated milk | ✓ dairy match |
| sour cream | ✓ dairy match |
| clotted cream | ✓ dairy match |
| milk chocolate | ✓ dairy match |

### Tree nut not suppressed

| Ingredient | Dairy | Tree nut |
|---|---|---|
| almond milk | ✓ no match | ✓ match |
| cashew milk | ✓ no match | ✓ match |
| almond cream | ✓ no match | ✓ match |
| cashew cream | ✓ no match | ✓ match |

---

## Scope Confirmation

Only implemented:

- [x] `excludedCompounds` optional field in `RestrictionDefinition`
- [x] Early-exit excludedCompounds check in `matchIngredientAgainstDefinition`
- [x] Dairy `excludedCompounds` entries (14 milks + 7 creams)
- [x] Plant cream phrase protection in `server/lib/dietRules.ts` `PLANT_MILK_PHRASES`

Not touched:

- [ ] Planner logic
- [ ] Scoring
- [ ] Smart Planner
- [ ] Household matching
- [ ] Routes
- [ ] Schema
- [ ] Database
- [ ] Migrations
- [ ] Vegetarian enforcement
- [ ] Client `dietRules.ts` (no plant-phrase mechanism exists there to extend)

---

## Rollback Identifier

```
git checkout rollback/pre-plant-milk-false-positive-fix
```

Tag points to commit `43fbdda` (checkpoint: pre-nutrition-boost-provenance rollback point).
