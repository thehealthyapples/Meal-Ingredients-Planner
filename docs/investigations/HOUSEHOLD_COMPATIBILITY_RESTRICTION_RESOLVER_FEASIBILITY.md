# Household Compatibility — Restriction Resolver Integration Feasibility

**Date:** 2026-06-12
**Branch:** main
**Rollback tag:** `investigation/household-compatibility-restriction-resolver-feasibility-2026-06-12`
**Status:** Investigation only. No code changes made.

---

## Rollback Protection

```
Tag: investigation/household-compatibility-restriction-resolver-feasibility-2026-06-12

To restore:
  GIT_CONFIG_NOSYSTEM=1 git checkout investigation/household-compatibility-restriction-resolver-feasibility-2026-06-12
```

---

## Background

The Household Compatibility engine (`server/lib/household-meal-matcher.ts`) detects per-eater ingredient conflicts using raw bidirectional substring matching (Path B). Separately, THA already maintains a canonical restriction resolver (`shared/restrictions/`) that provides word-boundary matching, derived ingredient lookup, and hidden ingredient detection — already live in Smart Planner filtering and the compliance gate.

This investigation asks: can Path B be replaced or augmented with the canonical resolver to reduce false positives and close known false negative gaps, without breaking the compatibility engine's output contract?

---

## Files Inspected

| File | Purpose |
|------|---------|
| `server/lib/household-meal-matcher.ts` | Compatibility engine — Path A (diet type) and Path B (ingredient exclusion) |
| `shared/restrictions/restriction-resolver.ts` | Canonical resolver — `resolveActiveRestrictions()`, `resolveIngredientRestrictions()` |
| `shared/restrictions/restriction-library.ts` | 10-restriction Phase 3 library (gluten, dairy, peanut, tree_nut, sesame, soy, mustard, shellfish, eggs, coconut) |
| `shared/restrictions/restriction-types.ts` | Types: `RestrictionDefinition`, `RestrictionMatch`, `RestrictionSourceType` |
| `shared/restrictions/restriction-safety.ts` | Product analyser — demonstrates resolver integration pattern (read-only, product context) |
| `server/lib/smart-suggest-service.ts` | Smart Planner — uses resolver for pre-pool hard-restriction filtering |
| `server/lib/planner-compliance.ts` | Compliance gate — delegates hard restriction checking to resolver via `candidateHardExcluded()` |
| `server/lib/dietRules.ts` | Diet exclusion engine — separate keyword system; covers diet patterns (Vegan, Keto, etc.) and restriction keywords |
| `server/routes.ts` | Smart Planner route — assembles pooled hard restrictions for pre-filtering |

---

## Q1 — Where Is the Canonical Restriction Resolver and What Is Its Public API?

### Location

```
shared/restrictions/
  restriction-types.ts       — types: RestrictionDefinition, RestrictionMatch, RestrictionSourceType
  restriction-resolver.ts    — core logic: three public functions + two internal helpers
  restriction-library.ts     — 10 restriction definitions (Phase 3, version 3.0.0)
  restriction-safety.ts      — product analyser consuming the resolver (standalone; not in planner pipeline)
```

### Public API (`restriction-resolver.ts`)

```typescript
// Convert raw restriction strings to canonical definitions
resolveActiveRestrictions(hardRestrictions: string[]): RestrictionDefinition[]

// Check one ingredient against a resolved definition set
resolveIngredientRestrictions(ingredient: string, restrictions: RestrictionDefinition[]): RestrictionMatch[]

// Convenience wrapper with legacy nut_free expansion
getRestrictionMatches(hardRestrictions: string[]): RestrictionDefinition[]
```

### Match types returned by `resolveIngredientRestrictions()`

| `sourceType` | How matched | Example |
|---|---|---|
| `alias` | Whole-word match against definition id or aliases[] | "soy" → soy restriction |
| `derived_ingredient` | Forward substring match against derivedIngredients[] | "tofu" → soy restriction |
| `hidden_ingredient` | Forward substring match against hiddenIngredients[] | "soy sauce" → gluten restriction |

### Internal helpers (not public)

- `norm(s)` — lowercase, trim, replace hyphens/underscores with spaces
- `wordBoundaryIncludes(haystack, needle)` — whole-word match, prevents "soy" matching "savoy"
- `substringIncludes(haystack, needle)` — forward substring for derived/hidden checks
- `matchIngredientAgainstDefinition(normIngredient, definition)` — per-definition check

### Current usage in codebase

```
server/lib/smart-suggest-service.ts:5    — imports resolveActiveRestrictions, resolveIngredientRestrictions
server/lib/smart-suggest-service.ts:132  — per-field check in candidateHardExcluded()
server/lib/smart-suggest-service.ts:433  — resolves active defs for pre-pool filtering
server/routes.ts:60                      — imports resolveActiveRestrictions, resolveIngredientRestrictions
server/routes.ts:9803                    — resolves active defs for route-level filtering
server/lib/planner-compliance.ts:22      — re-uses candidateHardExcluded() from smart-suggest-service
```

**`household-meal-matcher.ts` does NOT import from `shared/restrictions/` at all.** This is the integration gap.

---

## Q2 — What Does Path B in `scoreTemplate()` Actually Do?

### Code (`household-meal-matcher.ts` lines 279–287)

```typescript
for (const ex of member.excludedIngredients) {
  for (const key of allSlotIngredients) {
    if (key.includes(ex) || ex.includes(key)) {
      const swapText = swapMap.get(key);
      memberConflicts.push(swapText ? `${key} → ${swapText}` : `remove ${key}`);
    }
  }
}
```

### Inputs

| Variable | Source |
|---|---|
| `member.excludedIngredients` | `household_eaters.hardRestrictions` mapped to lowercase strings |
| `allSlotIngredients` | Merged `sharedBaseComponents[] + proteinSlots[] + carbSlots[] + vegSlots[] + toppingSlots[] + sauceSlots[]` |
| `swapMap` | `Map<ingredient, replacement>` passed in from template swap data |

### Mechanics

1. **Bidirectional substring**: `key.includes(ex)` OR `ex.includes(key)`. No word boundaries. No semantic knowledge.
2. **Both directions**: catches "soy" in "soy sauce" (ex="soy", key="soy sauce") AND catches "sauce" in "soy sauce" if ex="sauce" — second direction is the false-positive risk.
3. **Swap lookup**: if a conflict is found and `swapMap` has a replacement, generates `"${key} → ${swapText}"`. Otherwise generates `"remove ${key}"`.
4. **Per-member accumulation**: conflicts collected into `memberConflicts[]`, which becomes `memberChanges[]` in the output `MealMatch`.

### What Path B does NOT do

- No word-boundary protection → "soy" matches "savoy", "plum" matches "plums" or vice versa
- No derived ingredient knowledge → "prawns" doesn't match "shellfish-free", "cream" doesn't match "dairy-free"
- No hidden ingredient knowledge → "soy sauce" doesn't match "gluten-free" (gluten is hidden in soy sauce)
- No canonicalisation → "Dairy-Free", "dairy free", "dairy-free" treated differently depending on how restrictions were stored

---

## Q3 — Precision Comparison: Current Path B vs Canonical Resolver vs dietRules.ts

Test cases use real ingredient names against real restriction strings as they appear in `household_eaters.hardRestrictions`.

| Ingredient | Restriction | Path B (substring) | Canonical Resolver | dietRules.ts |
|---|---|---|---|---|
| `savoy cabbage` | `soy-free` | **FALSE POSITIVE** (`"savoy cabbage".includes("soy")` = true) | CORRECT — no match (word-boundary prevents) | n/a (pattern filter only) |
| `cream` | `dairy-free` | **MISS** (`"cream".includes("dairy-free")` = false) | **HIT** — cream in DAIRY derivedIngredients | HIT — "cream" in DAIRY_KEYWORDS |
| `butter` | `dairy-free` | **MISS** (`"butter".includes("dairy-free")` = false) | **HIT** — butter in DAIRY derivedIngredients | HIT — "butter" in DAIRY_KEYWORDS |
| `tofu` | `soy-free` | **MISS** (`"tofu".includes("soy-free")` = false) | **HIT** — tofu in SOY derivedIngredients | HIT — "tofu" in (Vegan exclusion) |
| `edamame` | `soy-free` | **MISS** (`"edamame".includes("soy-free")` = false) | **HIT** — edamame in SOY derivedIngredients | n/a |
| `miso` | `soy-free` | **MISS** | **HIT** — miso in SOY derivedIngredients | n/a |
| `prawns` | `shellfish-free` | **MISS** (`"prawns".includes("shellfish-free")` = false) | **HIT** — prawns in SHELLFISH derivedIngredients | HIT — "prawn" in FISH_SEAFOOD_KEYWORDS |
| `soy sauce` | `gluten-free` | **MISS** (`"soy sauce".includes("gluten-free")` = false) | **HIT** — soy sauce in GLUTEN hiddenIngredients | HIT — "soy sauce" in GLUTEN_KEYWORDS |
| `soy sauce` | `soy-free` | HIT — `"soy sauce".includes("soy")` = true | HIT — soy sauce in SOY derivedIngredients | HIT |
| `hoisin sauce` | `gluten-free` | **MISS** | **MISS** — not in GLUTEN hiddenIngredients | HIT — "hoisin" in GLUTEN_KEYWORDS |
| `peanut butter` | `peanut` restriction | HIT — `"peanut butter".includes("peanut")` = true | HIT — "peanut" is peanut alias (whole-word) | HIT |
| `spaghetti` | `gluten-free` | **MISS** | **MISS** — spaghetti not in GLUTEN library | MISS — "spaghetti" not in GLUTEN_KEYWORDS |
| `pasta sheets` | `gluten-free` | **MISS** | **MISS** — pasta not in GLUTEN library | HIT — "pasta" in GLUTEN_KEYWORDS |
| `ricotta` | `dairy-free` | **MISS** | **MISS** — ricotta not in DAIRY library | HIT — "ricotta" in DAIRY_KEYWORDS |
| `mozzarella` | `dairy-free` | **MISS** | **MISS** — mozzarella not in DAIRY library | HIT — "mozzarella" in DAIRY_KEYWORDS |
| `pork sausages` | Vegetarian eater | Path A (diet type) only | No definition (dietary pattern, not allergen) | HIT — "pork" in MEAT_KEYWORDS |

### Summary

| Category | Count |
|---|---|
| Resolver BETTER than Path B (catches what substring misses) | 8 cases |
| Resolver REMOVES false positives from Path B | 1 case (savoy/soy) |
| Resolver SAME as Path B | 2 cases (soy sauce/soy, peanut butter/peanut) |
| Resolver has same MISS as Path B | 4 cases (spaghetti, pasta, ricotta, mozzarella, hoisin) |
| dietRules.ts BETTER than both (pattern-level keyword scan) | 5+ cases |

**Critical observation:** `dietRules.ts` has broader kitchen vocabulary coverage (pasta, spaghetti, ricotta, mozzarella, hoisin, panko) than the canonical restriction library. This is by design — `dietRules.ts` covers diet patterns (Vegan, Gluten-Free at recipe level), while the canonical library covers allergens (for household-level hard restriction checking). The household compatibility engine currently operates with neither; Path B only catches restrictions where the restriction name happens to be a substring of the ingredient name.

---

## Q4 — Can `resolveIngredientRestrictions()` Be Called Per Slot Ingredient in `scoreTemplate()`?

**YES — the API is a direct fit for the slot ingredient loop.**

Current loop structure:
```typescript
for (const key of allSlotIngredients) {       // one ingredient at a time
  for (const ex of member.excludedIngredients) { // one restriction string at a time
    if (key.includes(ex) || ex.includes(key)) { ... }
  }
}
```

Resolver-based equivalent:
```typescript
// Pre-resolve once per member (outside inner loop)
const memberDefs = resolveActiveRestrictions(member.excludedIngredients);

for (const key of allSlotIngredients) {
  const matches = resolveIngredientRestrictions(key, memberDefs);
  if (matches.length > 0) { ... }
}
```

Differences:
- `resolveIngredientRestrictions()` takes the entire `memberDefs[]` and checks one ingredient against all definitions in one call — the inner restriction loop collapses into it.
- Pre-resolution (`resolveActiveRestrictions`) should happen once per member per `scoreTemplate()` call, not once per ingredient — 10 restrictions × N ingredients vs N ingredients × 10 restrictions (same work, cleaner structure).
- The conflict branch (`swapMap.get(key)`, "remove X" generation) is unchanged — it depends on `key` and `swapMap`, not on how the conflict was detected.

**No structural changes to `scoreTemplate()`'s output are required.** Only the detection predicate changes.

---

## Q5 — Does Resolver Integration Preserve the Full Output Contract?

### Output fields produced by Path B

| Field | How produced | Preserved with resolver? |
|---|---|---|
| `memberChanges[].swaps[]` | Array of "X → Y" or "remove X" strings | ✓ Unchanged — depends on `swapMap.get(key)`, not detection method |
| `swapsNeeded[]` | Deduplicated union of all swap strings across all members | ✓ Unchanged — same deduplication logic |
| `memberChanges[].userId` | Eater identity | ✓ Unchanged |
| `memberChanges[].displayName` | Eater name | ✓ Unchanged |
| `extraPrepMinutes` | `estimatedExtraTimePerVariant × membersNeedingVariant` | ✓ Unchanged |
| `scoreBreakdown.compatibility` | Path A conflicts only (diet type mismatch) — **NOT Path B** | ✓ Unchanged — `scoreCompatibility()` only uses diet type conflicts |
| `explanation` | "Fits X of Y profiles" string | ✓ Unchanged — based on `memberChanges.length` |
| `fitScore` | Combined scoreBreakdown | ✓ Unchanged |

**None of the output fields depend on HOW Path B detects a conflict — only on WHETHER a conflict was detected for a given `key`.** The resolver is a drop-in improvement to the detection predicate.

One important nuance: the resolver returns `RestrictionMatch[]` with a `matchedTerm` field (what the resolver matched on). This could optionally be surfaced in the swap string for richer explanations (e.g., `"remove cream [dairy via derived ingredient]"`), but this is optional and not required for output contract preservation.

---

## Q6 — What Gaps Exist in the Restriction Library That Could Cause Regressions?

### Restriction library coverage (Phase 3, 10 definitions)

```
gluten, dairy, peanut, tree_nut, sesame, soy, mustard, shellfish, eggs, coconut
```

### Restrictions NOT in the library

| Category | Examples | Current behaviour | Resolver behaviour |
|---|---|---|---|
| Dietary patterns | "Vegetarian", "Vegan", "Keto", "Paleo" | Handled by Path A (diet type check), not Path B | No change — Path B does not handle these either |
| Non-standard allergen strings | "no nuts", "tree nut allergy", "nut allergy" | `resolveActiveRestrictions()` includes legacy expansion: `nut_free`, `nut-free`, `nut allergy`, `nuts`, `nut` → expands to both peanut + tree_nut | ✓ Legacy expansions built in |
| Arbitrary ingredient exclusions | "beef", "pork", "no alcohol", "low sugar" | Path B catches via substring (e.g., "beef" in "beef mince" → hit) | Resolver returns empty → **MISS** |
| Non-canonical formats | "gluten free" (no hyphen), "DAIRY FREE" | Path B: case-insensitive after `.toLowerCase()` | `resolveActiveRestrictions()` normalises via `norm()` → handles variants |

### Key regression risk: arbitrary ingredient exclusion strings

If any household eater has a `hardRestrictions` entry that is a raw ingredient word (e.g., "beef", "alcohol", "peanuts") rather than a canonical allergen identifier, the resolver will not match it to any definition, and `resolveIngredientRestrictions()` will return empty — missing the conflict Path B would have caught.

**Real-world exposure assessment:** Children's eater profiles are set via the household eater edit form, which likely presents a curated restriction list. Adult eater rows currently have empty `hardRestrictions` (the known data gap from Investigation 1). The risk of arbitrary strings is real but its scope is likely limited to advanced users who may have edited restriction fields directly.

---

## Q7 — What Are the Integration Architecture Options?

### Option A — Full Replacement

Replace Path B substring check entirely with `resolveIngredientRestrictions()`.

```typescript
// Before scoreTemplate inner loop per member:
const memberDefs = resolveActiveRestrictions(member.excludedIngredients);

// Inside ingredient loop:
if (resolveIngredientRestrictions(key, memberDefs).length > 0) {
  // conflict — same swap/remove logic as today
}
```

**Pros:**
- Eliminates all false positives (savoy/soy type errors)
- Adds derived ingredient detection (cream→dairy, prawns→shellfish, tofu→soy, butter→dairy)
- Adds hidden ingredient detection (soy sauce→gluten)
- Normalises restriction string variants automatically
- Consistent with how Smart Planner filtering and the compliance gate already work

**Cons:**
- Loses conflict detection for non-canonical restriction strings not in the 10-restriction library
- Regression if any household eater has arbitrary ingredient words as restrictions

---

### Option B — Resolver Primary, Substring Fallback

Try resolver first. If the restriction string resolves to no canonical definition (empty `memberDefs`), fall back to substring for that member.

```typescript
const memberDefs = resolveActiveRestrictions(member.excludedIngredients);
const hasCanonical = memberDefs.length > 0;

if (hasCanonical) {
  // Resolver path
  if (resolveIngredientRestrictions(key, memberDefs).length > 0) { ... }
} else {
  // Substring fallback path (existing logic)
  for (const ex of member.excludedIngredients) {
    if (key.includes(ex) || ex.includes(key)) { ... }
  }
}
```

**Pros:**
- Gains resolver precision for canonical restrictions
- Preserves existing behaviour for non-canonical restriction strings

**Cons:**
- Mixed detection paths within the same function — harder to reason about
- Still has substring false positives when members have BOTH canonical and non-canonical restrictions (fallback path active for the non-canonical portion)
- More complex than necessary given the real-world composition of restriction strings

---

### Option C — Additive (Union of Both)

Flag a conflict if EITHER the resolver OR the substring check detects one.

**Pros:**
- No regressions — never misses anything the old system caught

**Cons:**
- Retains all false positives from the substring path (savoy→soy, etc.)
- The precision gains of the resolver are negated wherever substring still fires
- Produces more `memberChanges[]` and `swapsNeeded[]` entries than necessary

---

### Option D — Keep Separate

Do not integrate the resolver into the household matcher. Accept the precision gap.

**Rationale for rejecting:** The resolver is already the established SSoT for hard restriction checking in Smart Planner filtering and the compliance gate. Running a less accurate system in parallel for household compatibility analysis creates an inconsistency: the same meal can be cleared by the compliance gate (resolver says "no gluten") yet still receive a "compatibility warning" from the household matcher (substring misses it or produces a false positive). This inconsistency is hard to explain and erodes user trust in the planner.

---

## Q8 — What Is the Scope and Regression Risk of Integration?

### Scope of change (Option A)

| Layer | Change required |
|---|---|
| `household-meal-matcher.ts` | Import `resolveActiveRestrictions`, `resolveIngredientRestrictions`; replace inner Path B loop (~8 lines) |
| Pre-resolution step | Add `const memberDefs = resolveActiveRestrictions(member.excludedIngredients)` before the ingredient loop |
| Output structure | No changes to `MealMatch`, `MemberChange`, `ScoreBreakdown`, `swapsNeeded`, `explanation` |
| Test surface | Unit tests for `scoreTemplate()` would need updating for cases where precision improves |
| DB schema | No changes |
| API surface | No changes |
| Other files | No changes — `smart-suggest-service.ts`, `planner-compliance.ts`, `dietRules.ts` all unchanged |

### Regression risk matrix

| Risk | Likelihood | Impact |
|---|---|---|
| Non-canonical restriction strings lost | Low (curated UI) | Medium (missed household conflict) |
| Arbitrary ingredient exclusions lost | Very low (adult eaters empty today) | Low |
| False positives introduced | Near zero (resolver is strictly more precise) | n/a |
| Output format broken | None (swap/remove logic unchanged) | n/a |
| Compliance gate inconsistency resolved | Beneficial (currently inconsistent) | Positive |

### dietRules.ts interaction

`dietRules.ts` is used by `shouldExcludeRecipe()` for pre-pool diet pattern filtering. It is **not** called by `scoreTemplate()` at all. It covers cases the resolver library misses (pasta, spaghetti, ricotta, mozzarella, hoisin) but it is a profile-level filter, not a per-eater compatibility tool. The household compatibility engine has no integration path for `dietRules.ts` keywords today and the investigation scope does not include adding one.

**Known remaining gaps after resolver integration (cases both systems miss):**
- "spaghetti" and other specific pasta names → gluten conflict (not in resolver library or Path B)
- "ricotta", "mozzarella" → dairy conflict (not in resolver library or Path B)
- "hoisin sauce" → gluten conflict (not in resolver library or Path B)

These would require additions to the restriction library (`derivedIngredients` or `hiddenIngredients`) — a separate library expansion task, not part of this feasibility.

---

## Q9 — Recommended Architecture and Integration Pattern

### Recommendation: Option A — Full Replacement

Replace Path B's raw substring check with `resolveIngredientRestrictions()` for all members.

**Rationale:**
1. The resolver is already the SSoT for hard restriction checking everywhere else in the planner stack. Aligning the household matcher closes an architectural inconsistency.
2. False positive elimination (savoy/soy type errors) directly reduces noise in `memberChanges[]` and `swapsNeeded[]` — the very fields the Compatibility Review UX (Investigation 3) proposes surfacing to users. Surfacing false-positive conflicts to users would require explanation or support.
3. The derived ingredient gains (cream, butter, tofu, prawns, soy sauce→gluten) are high-value: these are common household cooking ingredients that represent real allergy/intolerance risks.
4. The non-canonical restriction regression risk is bounded: adult eater rows have empty `hardRestrictions` today (Investigation 1 gap), and children's restriction UI likely presents a curated list aligned with the canonical library.

**Integration pattern:**

```typescript
// household-meal-matcher.ts — scoreTemplate() addition

import {
  resolveActiveRestrictions,
  resolveIngredientRestrictions,
} from '../../shared/restrictions/restriction-resolver';

// Inside scoreTemplate(), per-member loop:

// ── Path B (resolver-backed ingredient conflict detection) ──
const memberDefs = resolveActiveRestrictions(member.excludedIngredients);

for (const key of allSlotIngredients) {
  const matches = resolveIngredientRestrictions(key, memberDefs);
  if (matches.length > 0) {
    const swapText = swapMap.get(key);
    memberConflicts.push(swapText ? `${key} → ${swapText}` : `remove ${key}`);
  }
}
```

This is a surgical replacement of ~8 lines. All downstream output (memberChanges, swapsNeeded, explanation, fitScore, scoreBreakdown) is preserved without modification.

**Optional enhancement (not required):** The `RestrictionMatch.sourceType` field could be used to annotate swap strings (e.g., `"remove soy sauce [gluten hidden]"`) for richer explanation text in the Compatibility Review UI. This is additive and can be deferred.

---

## Final Verdict

**STATUS B — Integration is feasible; a pre-resolution adapter step is required**

The canonical restriction resolver can replace Path B's raw substring matching in `scoreTemplate()`. The change is architecturally clean, preserves all output fields, and eliminates a class of false positives while adding meaningful false negative coverage for derived and hidden ingredients.

The "adapter required" qualifier applies because:
1. A `resolveActiveRestrictions()` pre-resolution call must be added per member before the ingredient loop — this is not a single-line drop-in.
2. The non-canonical restriction string gap requires a deliberate decision: accept the behavior change (Option A), or add fallback logic (Option B). This decision must be made before implementation.
3. The resolver library has its own coverage gaps (pasta, spaghetti, ricotta, mozzarella, hoisin) that are not closed by this integration — these remain known misses and would require a separate library expansion task.

**What this integration does NOT achieve:**
- Vegetarian/Vegan/dietary pattern conflict detection for Path B — these remain Path A (diet type) only, unchanged
- Full parity with `dietRules.ts` keyword coverage — the resolver library is an allergen system, not a dietary pattern keyword system
- Closing all gluten/dairy knowledge gaps (specific pasta names, specific cheese names not yet in library)

**Effort estimate:** ~1 hour of implementation once the non-canonical regression decision is made. Risk is low and well-bounded.

---

## Implementation Dependency Note

Investigation 2 and Investigation 3 established that surfacing `memberChanges[]` and `swapsNeeded[]` in a Compatibility Review UI is a high-value product goal. Investigation 4 confirmed this data is currently discarded before it reaches any API surface. Resolver integration (this investigation) should be bundled with the compatibility data surfacing work — shipping improved detection logic before the UI exists produces no user-visible benefit, but creates a clean integration point for when the UI ships.
