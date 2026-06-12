# Plant Milk False Positive Fix Path

**Date:** 2026-06-12
**Status:** Investigation complete — recommendation made, no code changed
**Rollback tag:** `rollback/pre-plant-milk-fix` (commit `43fbdda`)

---

## Scope

Dairy-Free household eater `hardRestrictions` incorrectly block plant-based milks and creams via the **restriction resolver path**. The separate `dietRules.ts` path already protects plant milks via `removePlantMilkPhrases()`. This investigation identifies the exact false positives, compares fix approaches, and recommends one path.

Gluten library alignment is already fixed separately. Not revisited here.

---

## 1. Confirmed False Positives

### How the resolver path works

```
hardRestrictions = ["dairy-free"]
  → resolveActiveRestrictions(["dairy-free"])
  → [dairy_def]           ← finds the dairy RestrictionDefinition
  → isHardExcluded(candidate, hardExcluded, [dairy_def])
  → for each field in [name, ...ingredients]:
      resolveIngredientRestrictions(field, [dairy_def])
        → matchIngredientAgainstDefinition(normIngredient, dairy_def)
```

`matchIngredientAgainstDefinition` checks in order:
1. **id** — whole-word: does normIngredient contain `"dairy"` at a word boundary?
2. **aliases** — whole-word: does normIngredient contain any of `['dairy', 'dairy free', 'dairy-free', 'milk', 'milk free', ...]` at a word boundary?
3. **derivedIngredients** — forward substring: does normIngredient contain any of `['butter', 'cream', 'yoghurt', 'yogurt', 'cheese', 'ghee', 'whey', ...]`?
4. **hiddenIngredients** — forward substring: `['milk chocolate', 'white chocolate', 'caramel']`

**Whole-word boundary rule** (`wordBoundaryIncludes`):
- Match only when the needle starts and ends at a space or string edge.
- "milk" in "coconut **milk**" → char before is `' '` ✓, end of string ✓ → **MATCH**

**Forward substring rule** (`substringIncludes`):
- Match whenever needle appears anywhere in the haystack.
- "cream" in "coconut **cream**" → **MATCH**

### Results by ingredient

| Ingredient        | Step that matches | Matched entry        | False positive? |
|-------------------|-------------------|----------------------|-----------------|
| `coconut milk`    | aliases (word-boundary) | `"milk"`         | **YES** |
| `oat milk`        | aliases (word-boundary) | `"milk"`         | **YES** |
| `rice milk`       | aliases (word-boundary) | `"milk"`         | **YES** |
| `almond milk`     | aliases (word-boundary) | `"milk"`         | **YES** |
| `cashew milk`     | aliases (word-boundary) | `"milk"`         | **YES** |
| `hemp milk`       | aliases (word-boundary) | `"milk"`         | **YES** |
| `pea milk`        | aliases (word-boundary) | `"milk"`         | **YES** |
| `soy milk`        | aliases (word-boundary) | `"milk"`         | **YES** |
| `coconut cream`   | derivedIngredients (substring) | `"cream"` | **YES** |
| `oat cream`       | derivedIngredients (substring) | `"cream"` | **YES** |
| `soya cream`      | derivedIngredients (substring) | `"cream"` | **YES** |

### Root cause — two distinct mechanisms

**Plant milks** match because `"milk"` is listed in `dairy.aliases` (restriction-library.ts:113).
Word-boundary matching correctly prevents e.g. "buttermilk" spuriously matching the alias `"milk"`,
but it cannot prevent "coconut **milk**" — `"milk"` genuinely IS at a word boundary there.

**Plant creams** match because `"cream"` is listed in `dairy.derivedIngredients` (restriction-library.ts:123).
Substring matching is intentional (it catches "double cream", "sour cream", "clotted cream"),
but it cannot distinguish `"coconut cream"` from `"dairy cream"` without additional guidance.

Neither mechanism is wrong in isolation — the library simply lacks a way to express exceptions.

---

## 2. Fix Options Compared

### Option A — Add `excludedCompounds` field to RestrictionDefinition

Add an optional `excludedCompounds: string[]` field to `RestrictionDefinition`.
In `matchIngredientAgainstDefinition`, before returning any match, check whether the normalised
ingredient contains any excluded compound (forward substring). If it does, return `null`.

```ts
// restriction-resolver.ts — inside matchIngredientAgainstDefinition, first check:
if (definition.excludedCompounds) {
  for (const compound of definition.excludedCompounds) {
    if (substringIncludes(normIngredient, norm(compound))) return null;
  }
}
```

```ts
// restriction-library.ts — dairy definition:
excludedCompounds: [
  'coconut milk', 'oat milk', 'rice milk', 'almond milk', 'cashew milk',
  'hemp milk', 'pea milk', 'soy milk', 'soya milk', 'plant milk',
  'plant-based milk', 'hazelnut milk', 'pea milk', 'macadamia milk',
  'oat mylk',
  'coconut cream', 'oat cream', 'soya cream', 'cashew cream',
  'almond cream', 'rice cream',
],
```

| Dimension | Assessment |
|-----------|------------|
| Files touched | `restriction-types.ts` (add field), `restriction-library.ts` (add data), `restriction-resolver.ts` (add guard) |
| Behaviour change | Plant milks/creams no longer match dairy via the resolver. All other dairy matching unaffected. |
| Risk | **Low.** The guard runs before any match is returned, not after. No existing match path is modified — only a new early-exit added. Optional field: all existing definitions continue to work unchanged. |
| Duplication risk | **None.** A new mechanism distinct from dietRules phrase-stripping, but colocated with the library definition it affects. Both engines can be correct simultaneously with different implementations. |
| Testability | **Excellent.** Resolver is a pure function. New test cases can call `resolveIngredientRestrictions` directly with no mocks. |
| Affects non-dairy restrictions | **No.** Only definitions that declare `excludedCompounds` are affected. |
| Affects real dairy detection | **No.** `"milk"`, `"cream"`, `"butter"`, `"double cream"`, `"condensed milk"` etc. are not in the excluded list and continue to match. |

**Verdict:** Safest, most self-contained option. The fix lives in the library where it belongs.

---

### Option B — Strip plant milk phrases before dairy matching (mirror dietRules.ts)

Import or re-implement `removePlantMilkPhrases()` and call it on each field before
passing to the resolver inside `isHardExcluded()` and any other resolver call sites.

Sub-variant B1: strip globally (before all restriction checks).
Sub-variant B2: strip only when dairy def is active.

| Dimension | Assessment |
|-----------|------------|
| Files touched | `smart-suggest-service.ts`, `planner-compliance.ts`, `household-meal-matcher.ts` — **all three resolver call sites** |
| Behaviour change | Plant milks stripped from text before resolver sees them. |
| Risk | **Moderate–High.** B1 (global strip) silently breaks tree_nut detection: "almond milk" after stripping → "almond" → still matches tree_nut. But "almond milk" IS a tree nut derivative; a person with a tree nut allergy should be warned. Stripping "almond milk" before the tree_nut check is therefore a **safety regression**. B2 (dairy-specific strip) requires call sites to inspect which restriction defs are active before choosing which preprocessing to apply — this tightly couples site logic to library internals. |
| Duplication risk | **High.** Phrase list must be duplicated or imported from dietRules. If dietRules list grows, resolver sites may lag. |
| Testability | **Moderate.** Strip logic tested separately, but integration requires mocking the full pipeline or exercising all three call sites. |
| Affects non-dairy restrictions | B1: **YES** — breaks tree_nut detection for almond milk. B2: No. |
| Affects real dairy detection | No — stripped phrases are not real dairy. |

**Verdict:** B1 introduces a safety regression (tree nut allergy miss). B2 is safe but creates an awkward coupling that belongs in the library, not the call sites.

---

### Option C — Expand restriction-library dairy definition with explicit exceptions (alias exclusion)

Instead of a new field, restructure the dairy definition so `"milk"` appears only in
`derivedIngredients` (not `aliases`), and add specific multi-word forms:
`"cow's milk"`, `"condensed milk"`, `"evaporated milk"`, `"buttermilk"`, `"skim milk"`.

| Dimension | Assessment |
|-----------|------------|
| Files touched | `restriction-library.ts` only |
| Behaviour change | Moving "milk" from aliases to derivedIngredients does NOT fix the problem: substring matching on "milk" would still match "coconut milk" via derivedIngredients. The problem is the matching semantics, not the list category. |
| Risk | **High.** Restructuring aliases changes what human-readable restriction strings resolve to (e.g. a user who sets their restriction as "milk" in the UI might stop being resolved). Removing "milk" from aliases would break `findRestrictionByAlias("milk")`. |
| Duplication risk | Low — stays in library |
| Testability | Easy |
| Affects non-dairy restrictions | No |
| Affects real dairy detection | **Potentially yes** — if "milk" stops being an alias, resolution of stored strings breaks. |

**Verdict:** Does not actually solve the problem (substring match would still fire). Also risks breaking alias resolution.

---

### Option D — Other safer approach

**D1: Require a minimum compound length for alias/derived matching.**
Require that a derived ingredient match only fires when the ingredient being tested starts with the library term (anchor at start). "milk" would only match ingredients that start with "milk" (e.g. "milk powder"). "coconut milk" starts with "coconut", not "milk" → no match.

Assessment: Changes resolver semantics globally — all derivedIngredient matches would become prefix-only, which would break legitimate matches like `"natural yoghurt"` (yoghurt not at position 0).

**D2: Add a `compoundAliases` field (multi-word aliases with their own matching semantics).**
Treat multi-word entries in `aliases` differently: require that the full compound phrase be present in the ingredient, not just the last word. "milk" remains a whole-word alias for bare "milk", but "condensed milk" → "condensed milk" exact. Plant milks wouldn't match because they don't contain any of the compound alias phrases.

Assessment: Doesn't help — the problem is that "coconut milk" contains "milk", and "milk" is a valid single-word alias that should match bare "milk". The fix needs to express "unless the larger compound is a known plant milk", which is exactly what Option A's `excludedCompounds` does.

**Verdict:** No Option D approach offers improvements over Option A without introducing new risks.

---

## 3. Should Plant Creams Be Protected?

**YES.**

Reasoning:

- `"coconut cream"` is a plant-derived product. It contains no dairy and is explicitly used as a dairy substitute (listed in `dairy.substitutions`).
- `"oat cream"` and `"soya cream"` are similarly plant-derived, dairy-free by definition.
- The current `dairy.derivedIngredients` entry `"cream"` is too broad for substring matching. It correctly catches `"double cream"`, `"clotted cream"`, `"sour cream"`, `"single cream"` — but cannot distinguish these from plant creams without compound context.
- Critically: `dietRules.ts` does NOT protect plant creams either. `removePlantMilkPhrases()` strips milk phrases but not cream phrases. This means `"coconut cream"` is a false positive in **both** the resolver path and the dietRules path.
- Fixing only plant milks while leaving plant creams as false positives would leave an inconsistency where a Dairy-Free household correctly receives oat milk suggestions but incorrectly has coconut cream-containing meals blocked.

The same `excludedCompounds` list that protects plant milks should also cover plant creams.
The fix path is identical — add cream compounds alongside milk compounds in `dairy.excludedCompounds`.

---

## 4. Test Cases for Future Implementation

### Must NOT match Dairy-Free after fix

These should return `[]` from `resolveIngredientRestrictions(ingredient, [dairy_def])`:

```
coconut milk
oat milk
rice milk
almond milk
cashew milk
hemp milk
pea milk
soy milk
soya milk
plant milk
plant-based milk
oat mylk
hazelnut milk
coconut cream
oat cream
soya cream
cashew cream
```

### Must STILL match Dairy-Free (regression guard)

These should return a non-empty match array from `resolveIngredientRestrictions(ingredient, [dairy_def])`:

```
milk               → alias match (whole-word)
cream              → derivedIngredients match
butter             → derivedIngredients match
cheese             → derivedIngredients match
yoghurt            → derivedIngredients match
yogurt             → derivedIngredients match
ghee               → derivedIngredients match
cow's milk         → alias "milk" match (milk at word boundary)
dairy cream        → alias "dairy" + derived "cream" match
double cream       → derivedIngredients match
whipped cream      → derivedIngredients match ("cream" substring)
condensed milk     → derivedIngredients match ("condensed milk")
evaporated milk    → derivedIngredients match ("evaporated milk")
buttermilk         → derivedIngredients match ("buttermilk")
creme fraiche      → derivedIngredients match
fromage frais      → derivedIngredients match
sour cream         → derivedIngredients match
clotted cream      → derivedIngredients match
single cream       → derivedIngredients match
milk chocolate     → hiddenIngredients match
```

### Boundary cases

These should NOT match (verify no regression from alias word-boundary logic):

```
savoy cabbage      → no match (not dairy-related; confirms "soy" word-boundary unrelated)
buttercup          → no match (butter appears but not at word boundary — wait, derivedIngredient
                     "butter" is a substring of "buttercup"... see note below)
```

**Note on "buttercup":** `substringIncludes("buttercup", "butter")` → TRUE. This is an existing
pre-fix false positive unrelated to plant milks, not introduced by this change. Out of scope here.

---

## 5. Final Recommendation

### STATUS A — Use resolver-level `excludedCompounds`

**Rationale:**

1. **Contained blast radius.** Three files touched, all in the restrictions module. Zero changes to service, route, planner, or compliance layers.

2. **Both resolver paths fixed simultaneously.** `household-meal-matcher.ts`, `smart-suggest-service.ts`, and `planner-compliance.ts` all call `resolveIngredientRestrictions` from the resolver. A fix in the resolver fixes all three with no per-site changes.

3. **No safety regression.** Unlike Option B1, tree nut detection for "almond milk" is unaffected — the `excludedCompounds` guard applies only to the `dairy` definition.

4. **Consistent with library design intent.** The library is the single authoritative source of allergen matching rules. Exceptions belong in the library, not scattered across call sites.

5. **Covers plant creams too.** Both the dietRules gap (plant cream false positives) and the resolver gap (plant milk + cream false positives) are closed by the same mechanism.

6. **Mirrors, but doesn't duplicate, dietRules logic.** dietRules uses a different architecture (text blob + keyword arrays + phrase stripping). The resolver uses library-driven per-ingredient matching. Both can have their own protection mechanisms without being redundant; they serve different code paths.

7. **Testable in isolation.** The resolver is a pure function library with no I/O. The fix can be fully covered by unit tests on `resolveIngredientRestrictions` alone.

---

## Appendix: File Map

| File | Role in fix |
|------|-------------|
| `shared/restrictions/restriction-types.ts` | Add `excludedCompounds?: string[]` to `RestrictionDefinition` |
| `shared/restrictions/restriction-library.ts` | Add `excludedCompounds` list to dairy definition |
| `shared/restrictions/restriction-resolver.ts` | Add early-exit guard in `matchIngredientAgainstDefinition` |
| `server/lib/dietRules.ts` | Add plant cream phrases to `PLANT_MILK_PHRASES` (fixes dietRules gap for plant creams) |
| `server/lib/smart-suggest-service.ts` | **No change needed** |
| `server/lib/household-meal-matcher.ts` | **No change needed** |
| `server/lib/planner-compliance.ts` | **No change needed** |

Note: The dietRules.ts change is a separate, parallel fix for the plant cream gap in the
profile-diet filter path. It is not required to complete the resolver fix, but should be
done in the same implementation pass to close both gaps together.
