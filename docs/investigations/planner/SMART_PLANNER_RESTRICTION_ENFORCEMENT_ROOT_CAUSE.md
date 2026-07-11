# Smart Planner Restriction Enforcement — Root Cause Investigation

**Date:** 2026-06-12
**Rollback tag:** `investigation/smart-planner-restriction-enforcement-20260612-190700`
**Status:** STATUS C — Restriction model drift affecting multiple planner paths
**Scope:** Investigation only — no code changes.

---

## Executive Summary

The Smart Planner enforces dietary restrictions through two parallel engines that have diverged in coverage and behaviour. The routing between those engines is determined by WHERE a restriction is stored (user profile vs household eater row), not by what the restriction is. This means identical restrictions produce different levels of safety depending on who holds them, which files handle them, and which code path processes them.

Three confirmed bugs. All stem from the same root drift. The most dangerous is that household eater diet types (including Vegetarian) never enter the hard-exclusion pipeline at all.

---

## Rollback Protection

```
git tag: investigation/smart-planner-restriction-enforcement-20260612-190700
restore: git checkout investigation/smart-planner-restriction-enforcement-20260612-190700
```

---

## System Architecture — Two Engines, One Gap

### Engine 1: `dietRules.ts` (keyword-based)
- **Caller:** `candidateDietExcluded()` in `smart-suggest-service.ts:221–236`
- **Input:** `settings.dietPattern` + `settings.dietRestrictions`
- **Source for those settings:** `req.user?.dietPattern` / `req.user?.dietRestrictions` — logged-in user's profile only
- **Gluten coverage:** flour, bread, pasta, noodles, tortilla, panko, hoisin, teriyaki — all covered (`GLUTEN_KEYWORDS` `dietRules.ts:21–25`)
- **Plant milk protection:** `removePlantMilkPhrases()` strips oat milk, coconut milk, almond milk etc. before dairy scan (`dietRules.ts:225–239`)
- **Coconut cream:** NOT protected — "cream" matches `DAIRY_KEYWORDS` after plant-milk removal

### Engine 2: `restriction-library.ts` + `restriction-resolver.ts` (canonical)
- **Caller:** `isHardExcluded()` in `smart-suggest-service.ts:121–138`
- **Input:** `settings.hardExcludedIngredients`
- **Source for those settings:** `prefs.excludedIngredients` + `eater.hardRestrictions` for all eaters
- **Gluten coverage:** flour, bread, pasta, noodles, tortilla, panko, hoisin, teriyaki — ALL MISSING from `derivedIngredients`/`hiddenIngredients` in `restriction-library.ts`
- **Plant milk protection:** NONE — "milk" is a dairy alias; word-boundary matching flags "coconut milk", "oat milk" etc.
- **Coconut cream:** flagged as dairy via `substringIncludes("coconut cream", "cream")` (cream is a derivedIngredient)

### Routing Logic (routes.ts:4899–4943)

```
Logged-in user's dietPattern/dietRestrictions
  └─→ settings.dietPattern / settings.dietRestrictions
        └─→ candidateDietExcluded() → Engine 1 (dietRules.ts) — WELL-MAINTAINED

Household eater hardRestrictions (children only — see Note below)
  └─→ settings.hardExcludedIngredients
        └─→ isHardExcluded() → Engine 2 (restriction-library.ts) — HAS GAPS

Household eater defaultDietTypes
  └─→ mergedPrefs.dietTypes
        └─→ scoreMeal() dietMatch penalty — SCORING ONLY, NOT HARD ENFORCED
```

**Note on adult household eaters:** `household_eaters.defaultDietTypes` and `household_eaters.hardRestrictions` are stored as empty arrays for adult members by design (`syncMembersAsEaters` at `storage.ts:2726–2732`). The authoritative source for adults is the `users` table, but the smart-suggest route reads only from `household_eaters` DB rows and does not enrich them. The GET `/api/household/eaters` endpoint performs display-only enrichment (never writes). Consequence: adult household eater restrictions are COMPLETELY ABSENT from both `mergedDietTypes` and `mergedExcludedIngredients` unless that adult is the request user.

---

## Issue 1 — Vegetarian for Household Eaters

### ANSWER: Vegetarian is NOT hard enforced for household eaters.

### Trace

**Case A — Adult household eater (e.g. Lilly with userId):**

1. `storage.syncMembersAsEaters()` creates row: `defaultDietTypes=[], hardRestrictions=[]` (`storage.ts:2730–2731`)
2. Smart-suggest route reads row: `eater.defaultDietTypes = []`, `eater.hardRestrictions = []`
3. Loop at `routes.ts:4913–4919`: nothing added to `hardRestrictedSet` or `mergedDietTypes`
4. `settings.dietPattern` = `req.user?.dietPattern` (the generating user's pattern, not Lilly's)
5. **Lilly's Vegetarian setting does not enter any enforcement path**

**Case B — Child household eater with `defaultDietTypes = ["vegetarian"]`:**

1. `eater.defaultDietTypes = ["vegetarian"]` (stored in DB for children)
2. Loop at `routes.ts:4918`: "vegetarian" merged into `mergedDietTypes`
3. `mergedPrefs = { ...prefs, dietTypes: mergedDietTypes }` (`routes.ts:4937–4941`)
4. `mergedPrefs` passed to `scoreMeal()` via `generateSmartSuggestion`
5. In `scoreMeal()` (`meal-scoring-service.ts:119–126`): `DIET_EXCLUDED_KEYWORDS["vegetarian"]` = meat+fish keywords → dietMatch score penalised by −10 if present
6. This is a SCORING PENALTY, NOT a hard filter. A meat-containing meal can still be selected if its total score is high enough.
7. **Vegetarian for a child eater is scoring-only — never reaches `candidateDietExcluded()`**

### Exact code point where Vegetarian becomes scoring-only

`routes.ts:4918–4919` — eater diet types are unioned into `mergedDietTypes`, which flows to `mergedPrefs.dietTypes` (line 4940), which is only consumed by `scoreMeal()`. There is no code path that reads `mergedDietTypes` and writes it back to `settings.dietPattern` or `settings.dietRestrictions`.

`settings.dietPattern` is assigned once at `routes.ts:4825` from `req.user?.dietPattern` and never updated.

---

## Issue 2 — Plant Milk False Positives

### ANSWER: YES — plant milks are incorrectly blocked by Dairy-Free household restrictions.

### Affected ingredients and paths

| Ingredient | Via `isHardExcluded()` (Engine 2) | Via `candidateDietExcluded()` (Engine 1) |
|---|---|---|
| coconut milk | ❌ FALSE POSITIVE — "milk" is dairy alias, word-boundary match succeeds | ✅ CORRECT — removed by `removePlantMilkPhrases()` |
| oat milk | ❌ FALSE POSITIVE — same "milk" alias match | ✅ CORRECT — removed by `removePlantMilkPhrases()` |
| rice milk | ❌ FALSE POSITIVE — same "milk" alias match | ✅ CORRECT — removed by `removePlantMilkPhrases()` |
| almond milk | ❌ FALSE POSITIVE — same "milk" alias match | ✅ CORRECT — removed by `removePlantMilkPhrases()` |
| coconut cream | ❌ FALSE POSITIVE — "cream" is dairy derivedIngredient, substringIncludes matches | ❌ FALSE POSITIVE — "cream" in `DAIRY_KEYWORDS`, not in `PLANT_MILK_PHRASES` |

### Exact code path for `isHardExcluded()` false positive

`restriction-resolver.ts:140–144` — alias matching uses `wordBoundaryIncludes`:

```
dairy aliases include: "milk"
ingredient: "coconut milk"
wordBoundaryIncludes("coconut milk", "milk")
  → idx=7, haystack[6]=' ' ✓, afterIdx=11=end ✓
  → returns true → MATCH → dairy restriction triggered
```

`restriction-resolver.ts:148–153` — derived ingredient matching uses `substringIncludes`:

```
dairy derivedIngredients include: "cream"
ingredient: "coconut cream"
substringIncludes("coconut cream", "cream")
  → "coconut cream".includes("cream") → true
  → MATCH → dairy restriction triggered
```

### When does this materialise?

The false positive only occurs when Dairy-Free comes from a household eater's `hardRestrictions` (child eaters), flowing into `settings.hardExcludedIngredients` and then through `isHardExcluded()`. When Dairy-Free is in the logged-in user's `dietRestrictions`, Engine 1 handles it correctly for plant milks (except coconut cream).

### `PLANT_MILK_PHRASES` in dietRules.ts (line 225–229)

The following are protected from false positives via Engine 1:
```
"almond milk", "oat milk", "soy milk", "soya milk", "coconut milk",
"plant milk", "plant-based milk", "rice milk", "hemp milk", "cashew milk",
"hazelnut milk", "pea milk", "macadamia milk", "oat mylk"
```

Notably absent: `"coconut cream"` — this is a gap in Engine 1 as well.

---

## Issue 3 — Gluten Library Mismatch

### ANSWER: YES — gluten-containing meals are incorrectly allowed for household eaters with Gluten-Free hardRestrictions.

### Source of truth comparison

| Ingredient | `dietRules.ts` GLUTEN_KEYWORDS | `restriction-library.ts` gluten definition | `isHardExcluded()` result |
|---|---|---|---|
| flour | ✅ listed (line 21) | ❌ absent from derivedIngredients/hiddenIngredients (only in prohibitedPhrases*) | ALLOWED — false negative |
| bread | ✅ listed (line 21) | ❌ absent | ALLOWED — false negative |
| pasta | ✅ listed (line 21) | ❌ absent | ALLOWED — false negative |
| noodles | ✅ listed (line 21) | ❌ absent | ALLOWED — false negative |
| tortilla | ✅ listed (line 22) | ❌ absent | ALLOWED — false negative |
| panko | ✅ listed (line 25) | ❌ absent | ALLOWED — false negative |
| hoisin sauce | ✅ listed (line 25) as "hoisin" | ❌ absent from hiddenIngredients | ALLOWED — false negative |
| teriyaki sauce | ✅ listed (line 25) as "teriyaki" | ❌ absent from hiddenIngredients | ALLOWED — false negative |

*`prohibitedPhrases` comment in `restriction-library.ts:18–19`: "for future post-generation content validation only; not used in matching."

### Gluten items correctly covered by restriction-library.ts

`derivedIngredients`: wholemeal, wholegrain, bulgur wheat, bulgur, couscous, semolina, spelt, barley, rye, durum, farro, freekeh, kamut
`hiddenIngredients`: soy sauce, malt vinegar, worcestershire sauce, beer, barley malt, malt extract
`aliases`: wheat, wheat-free, coeliac, celiac

### Impact scope

Only affects households where Gluten-Free is in a CHILD eater's `hardRestrictions` (flows to `isHardExcluded()` via Engine 2). A user with Gluten-Free in their own `dietRestrictions` is correctly protected by Engine 1. Most common gluten sources (flour, bread, pasta) are completely absent from the restriction-library gluten entry, which means a child coeliac household eater would receive meals containing these ingredients.

---

## Issue 4 — Candidate Exhaustion

**Note:** Exact per-slot candidate counts require live database access and are not available in this static investigation. The following is a structural analysis of pool collapse mechanics.

### Pool construction sequence in `generateSmartSuggestion()`

```
Phase 0: All user meals + enriched external candidates
         Gate: product/premium/component/drink exclusions

Phase 1: isHardExcluded() filter (hardExcludedIngredients via Engine 2)
         For Dairy-Free child: removes all dairy meals + false positives (plant milks)
         For adult Lilly: nothing removed (empty hardRestrictions in DB)

Phase 2: candidateDietExcluded() filter (user's dietPattern via Engine 1)
         If generating user is Vegetarian: removes all meat/fish candidates

Phase 3: allCandidates pool (used for ALL slots)

Per-slot selection:
  Tier 1: unused slot-fit candidates (SLOT_CATEGORY_MAPPING)
  Tier 2: unused safe-fallback candidates (adjacent categories, no breakfast promotion)
  Tier 3: repeat compliant slot-fit candidates (usedIds relaxed)
  Tier 4: meal shell recovery (matchMealsForHousehold + selectShellRecoveryCandidate)
```

### Structural collapse for Lilly/Daisy household

**Breakfast collapse (most acute):**
- `SLOT_CATEGORY_MAPPING.breakfast = ["breakfast", "smoothie"]` — smallest legal set
- Vegetarian hard filter removes meat/fish from allCandidates
- Dairy-Free child eater restriction removes dairy candidates + all plant-milk-containing candidates (false positive)
- After phase 1 and 2, the already-small breakfast pool shrinks further
- With 7 days × 1 breakfast = 7 slots, unique breakfast candidates exhausted typically by day 3–4
- Tier 3 (controlled repeats) begins early in the week

**Lunch collapse (moderate):**
- `SLOT_CATEGORY_MAPPING.lunch = ["lunch", "snack", "salad"]` — three categories
- After Vegetarian + Dairy-Free filtering: plant-based, non-dairy options only
- Pool typically 2–4× larger than breakfast

**Dinner collapse (least acute):**
- `SLOT_CATEGORY_MAPPING.dinner = ["dinner", "main"]` + null-category fallback
- Largest available pool; Tier 3 repeats occur later in the week

**Cross-slot amplification:** Once `usedIds` fills with breakfast picks (they're reused for Tier 3 across all 7 days), each day reduces the unique pool by 1. For small pools, this creates a cascade: Tier 3 starts on day 2–3, Tier 4 on day 4–5. Tier 4 can also fail if no meal shell has `compatibility === 1` after Vegetarian enforcement.

**Key amplifier:** The plant milk false positive removes coconut milk-based curries, Thai dishes, oat porridge, rice pudding etc. from the pool — meals that would normally fit lunch/dinner slots cleanly. This is a material reduction to the already-constrained plant-based pool.

---

## Issue 5 — Trust Impact Ranking

Ranked by user trust risk (highest first):

| Rank | Issue | Risk type | Severity |
|---|---|---|---|
| 1 | **A. Vegetarian not hard enforced** | Ethical/religious/health safety | Critical |
| 2 | **C. Gluten gaps** | Medical safety (coeliac) | Critical |
| 3 | **B. Plant milks falsely blocked** | False negative — safe meals excluded | Moderate |
| 4 | **D. Candidate exhaustion/repetition** | UX quality | Low–Moderate |

**A is ranked #1** because: Vegetarian is not a preference — for many users it is an ethical, religious (Hindu, Buddhist), or health conviction. The planner silently serving meat to a household member with a stated Vegetarian diet type is the single most likely cause of user distrust and household conflict. It is also invisible — there is no error, the plan appears to succeed.

**C is ranked #2** because: Gluten-Free is frequently medically necessary (coeliac disease). The gap affects flour/bread/pasta/noodles — the most common gluten sources. A child coeliac receiving a pasta meal is a genuine health risk. However, this only triggers when the restriction is in a child eater's hardRestrictions rather than the user's own dietRestrictions.

**B is ranked #3** because: plant milk false positives are safety-safe (the wrong direction — meals excluded rather than included) but create silent pool collapse and cause user confusion when expected recipes vanish.

**D is ranked #4** because: repetition and empty slots are visible but not harmful. They are partly a downstream consequence of issues A, B, and C reducing the available pool.

---

## Issue 6 — Fix Sequencing (no implementation)

Fixes are listed in recommended implementation order. All are independent; no fix depends on another completing first.

---

### Fix 1: Add missing gluten ingredients to restriction-library.ts

**Scope:** Add flour, bread, pasta, noodles, tortilla, panko to `gluten.derivedIngredients`; add hoisin sauce, teriyaki sauce to `gluten.hiddenIngredients`.

**Files likely touched:**
- `shared/restrictions/restriction-library.ts` — data only, no logic change

**Risk rating:** Low
**Schema needed:** No
**Migration needed:** No
**Backfill needed:** No

**Rationale:** Pure data addition. The resolver already handles derivedIngredients/hiddenIngredients correctly — adding entries only expands coverage. No existing matches are removed. Unit tests for the resolver already exist and would catch regressions.

---

### Fix 2: Plant milk false positive — resolver path

**Scope:** Prevent the dairy "milk" alias from matching compound plant-milk ingredient strings. Two implementation options:

Option A (narrower): Add "coconut milk", "oat milk", "almond milk", "rice milk" and other plant milks to `dairy.excludedCompounds` (a new library field) checked before alias matching.

Option B (broader): Before running `resolveIngredientRestrictions` for dairy, strip plant milk phrases from the ingredient text (mirroring `removePlantMilkPhrases()` in dietRules.ts). Could live in `isHardExcluded()` in `smart-suggest-service.ts`.

**Files likely touched:**
- If Option A: `shared/restrictions/restriction-types.ts` (add field), `shared/restrictions/restriction-library.ts` (add data), `shared/restrictions/restriction-resolver.ts` (add check)
- If Option B: `server/lib/smart-suggest-service.ts` (add pre-processing in `isHardExcluded`)

**Risk rating:** Medium — changes resolver matching logic; thorough tests needed
**Schema needed:** Only if Option A adds a new type field
**Migration needed:** No
**Backfill needed:** No

Also address **coconut cream** separately — it needs `PLANT_MILK_PHRASES` in dietRules.ts to include "coconut cream", or Engine 1 will still false-positive on it for user-level Dairy-Free.

---

### Fix 3: Hard-enforce household eater diet types (Vegetarian)

**Scope:** Household eater `defaultDietTypes` (and `users.dietPattern` for adult eaters) must produce hard exclusions, not just scoring penalties. This requires:

1. **Adult eater resolution:** The smart-suggest route currently reads raw DB rows for adult eaters (which store empty arrays). Fix must fetch authoritative diet data from `users.dietPattern` / `userPreferences.dietTypes` for adult eaters, matching what `buildHouseholdContext()` already does in `household-meal-matcher.ts:244–259`.

2. **Diet type to hard filter translation:** Merged household diet types containing "vegetarian" or "vegan" must result in an additional `candidateDietExcluded()` pass — not just a scoring penalty.

**Implementation approach (high-level):** After building `mergedDietTypes`, if "vegetarian" or "vegan" is present AND `settings.dietPattern` is not already one of those values, apply a secondary `candidateDietExcluded()` call with the strictest applicable pattern. The pattern priority order in dietRules.ts (Vegan > Vegetarian) should be respected.

**Files likely touched:**
- `server/routes.ts` — smart-suggest handler: adult eater enrichment + diet type → hard filter logic
- `server/lib/smart-suggest-service.ts` — possibly extend settings or add a secondary filter pass
- `shared/household-eater.ts` — no changes expected

**Risk rating:** High — changes hard filtering logic with wide blast radius. Risk of over-filtering (household member with Vegetarian blocks meat for all) or under-filtering. Requires careful definition of "whose diet pattern wins." Full test coverage required.
**Schema needed:** No
**Migration needed:** No
**Backfill needed:** No

---

### Fix 4: Candidate pool depth improvement

**Scope:** Expand the candidate pool to reduce Tier 3 (repeat) and Tier 4 (shell) activation frequency for restricted households.

Approaches:
- Increase external candidate fetch volume for restricted dietary prefixes
- Add dietary-prefix external search for household eater types, not just profile dietaryPrefix
- Ensure external candidates are enriched with real ingredients before pool construction (already implemented, verify coverage)
- Consider pre-seeding a library of verified vegetarian/vegan/dairy-free recipes for breakfast slots specifically

**Files likely touched:**
- `server/lib/external-meal-service.ts`
- `server/lib/smart-suggest-service.ts`

**Risk rating:** Medium — external API rate-limit implications; breakfast boundary must be preserved
**Schema needed:** No
**Migration needed:** No
**Backfill needed:** No

---

## Final Verdict

### STATUS C
**Restriction model drift affecting multiple planner paths.**

There are not two separate bugs — there is one structural drift. The system has two restriction enforcement engines (`dietRules.ts` and `restriction-library.ts`) that were built independently and have diverged in coverage. The routing between them is implicit (determined by data storage location rather than restriction type), invisible to callers, and never tested for parity.

The consequences are:
- Restrictions enforced with different levels of safety depending on whether they come from the user profile or a household eater row
- Adult household eater restrictions not picked up at all in the smart-suggest route
- The restriction library's gluten definition missing the most common real-world gluten sources
- The restriction resolver's dairy alias matching causing false positives on plant milks

All three reported issues (Vegetarian enforcement, plant milk false positives, gluten gaps) are downstream symptoms of this single drift. Fix 1 (library data) and Fix 2 (resolver behaviour) close the Engine 2 gaps. Fix 3 (enforcement routing) aligns Engine 1/2 usage with the intended semantics of `defaultDietTypes`.

---

## Files Referenced

| File | Role |
|---|---|
| `server/routes.ts:4796–4967` | Smart-suggest route — settings construction, eater merge |
| `server/lib/smart-suggest-service.ts:121–236` | `isHardExcluded()`, `candidateDietExcluded()`, `generateSmartSuggestion()` |
| `server/lib/dietRules.ts:21–338` | Engine 1 — keyword sets, `shouldExcludeRecipe()`, `removePlantMilkPhrases()` |
| `shared/restrictions/restriction-library.ts:31–91` | Engine 2 — gluten definition (gaps) |
| `shared/restrictions/restriction-library.ts:93–154` | Engine 2 — dairy definition (milk alias, cream derived) |
| `shared/restrictions/restriction-resolver.ts:85–164` | Word-boundary and substring matching logic |
| `server/lib/meal-scoring-service.ts:51–65` | `DIET_EXCLUDED_KEYWORDS` — scoring-only, not hard filter |
| `server/lib/household-meal-matcher.ts:243–265` | Correct adult eater diet resolution (not used in main filter path) |
| `server/storage.ts:2710–2741` | `syncMembersAsEaters()` — always stores empty arrays for adults |
| `shared/household-eater.ts` | `HouseholdEater` type, `dbEaterToHouseholdEater()` |
