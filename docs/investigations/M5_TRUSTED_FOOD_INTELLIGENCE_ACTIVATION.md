# M5 — Trusted Food Intelligence Activation

**Date:** 2026-06-25
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Risk:** 🔴 RED
**Reason:** Canonical food identity, shared runtime knowledge, large-scale activation, multiple application surfaces.
**Status:** COMPLETE

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `m5-rollback-pre-20260625` → HEAD `a8a912a` |
| Working tree at start | **Intentionally dirty** — 30+ modified tracked files + untracked docs from in-progress WS0X streams and M1–M4 completion. Not created by this task. |
| This task's writes | `shared/canonical/foods.ts` (+4 canonical foods, +1 variety, +10 aliases, -5 migrated aliases) · this document |
| Rollback command | `git checkout m5-rollback-pre-20260625` |

**Rollback confirmed before implementation began.**

---

## REFERENCE DOCUMENTS READ

- [x] `docs/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/ENGINEERING_WORKFLOW.md`
- [x] `docs/investigations/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [x] `docs/investigations/M1_FOOD_INTELLIGENCE_CONVERGENCE_IMPLEMENTATION.md`
- [x] `docs/investigations/M2_PANTRY_KNOWLEDGE_CONVERGENCE_IMPLEMENTATION.md`
- [x] `docs/investigations/M3_CANONICAL_DIETARY_RULES_CONVERGENCE_IMPLEMENTATION.md`
- [x] `docs/investigations/M4_CANONICAL_DIVERSITY_GROUP_CONVERGENCE_IMPLEMENTATION.md`
- [x] `docs/investigations/M4_5_FERMENTED_FOOD_ATTRIBUTE_IMPLEMENTATION.md`
- [x] `docs/investigations/WS0X_10_PROGRESSIVE_FOOD_INTELLIGENCE_PROMOTION_MODEL.md`
- [x] `docs/investigations/WS0X_10A_PROGRESSIVE_FOOD_INTELLIGENCE_IMPLEMENTATION.md`
- [x] `docs/investigations/WS0X_11_MASS_FOOD_INTELLIGENCE_PROMOTION_PHASE1.md`
- [x] `docs/investigations/WS0X_7_INGREDIENT_RESOLUTION_ENGINE_COMPLETENESS_PROGRAM.md`
- [x] `shared/canonical/foods.ts` (CANONICAL_SEED)
- [x] `shared/canonical/diversity-groups.ts` (DIVERSITY_GROUP_SEED)
- [x] `shared/canonical/food-context.ts` (FOOD_CONTEXT_SEED)
- [x] `shared/canonical/index.ts` (validateCanonicalSeed, isContextRequired)
- [x] `shared/canonical/resolver.ts` (buildCanonicalIndex, resolveCanonicalFood)
- [x] `shared/canonical/plant-classifier.ts` (isPlantIngredient, GROUP_TO_PLANT_CATEGORY)
- [x] `shared/knowledge/foods.ts` (FOOD_SEED — 265 WS0 knowledge foods)
- [x] `shared/knowledge/relationships.ts` (FOOD_NUTRIENTS, FOOD_BENEFITS)
- [x] `server/services/nutrition-knowledge-registry.ts` (matchIngredientToSlug)
- [x] `server/services/meal-food-intelligence.ts` (buildMealFoodIntelligence)

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Each of the 4 new canonical foods receives exactly one slug. The
  white-cabbage WS0 food is activated via a variety entry (slug
  "white-cabbage") under canonical food "cabbage" — one resolution
  path per identifier. Aliases migrated from parent foods (not
  duplicated) so the anti-fork invariant holds: each string maps to
  at most one canonical food.

☑ One owner per fact
  Aliases previously owned by parent foods (e.g. "ground almonds" on
  "almonds", "baby corn" on "corn") are transferred to the new
  dedicated canonical foods. Dual ownership is eliminated, not added.
  Five aliases removed from parents; 15 aliases added to new foods —
  net ownership is singular throughout.

☑ No duplicate entities
  Four new canonical foods replace alias stubs on parent foods. One
  new variety (white-cabbage) establishes an identity that was
  previously absent. No entity is created alongside an existing one
  for the same real-world food.

☑ No duplicate ownership
  The canonical resolver's anti-fork lock (unique alias_key check +
  resolver key-collision test) enforces single ownership at build
  time. validateCanonicalSeed() returns 0 problems after all changes.

☑ No duplicate state
  No user state involved. These are editorial seed facts, not
  transactional state. No runtime state is split or duplicated.

☑ Extends existing architecture
  All new canonical entries follow the exact same pattern as existing
  canonical foods (almond-milk, almond-butter, coconut-oil, etc.).
  The progressive enrichment pipeline (food-context.ts → seed build →
  canonical_food table) is unchanged and picks up the new entries
  automatically because their slugs were already in food-context.ts.

☑ Progressive enrichment where appropriate
  All four new canonical foods are knowledge entities with full Level 2
  context (availability, peakSeasons, originRegion already pre-staged
  in food-context.ts by WS0X.2/WS0X.8). validateCanonicalSeed() reports
  0 context warnings — no Level-1 staging needed; these enter as fully
  enriched canonical foods.

☑ Honest gaps over fabricated information
  diversityGroupSlug: null is preserved for foods where plant
  classification is not appropriate (kombucha, etc.). New foods only
  receive diversity groups that genuinely apply (almond-flour → almonds,
  baby-corn → corn, coconut-flour → coconut, spelt-flour → spelt).
  No origin, season, or availability is fabricated. All context values
  were pre-authored editorially.

☑ No permanent synchronisation bridge
  No bridge created. New canonical foods read directly from the
  canonical resolver; the seed runner is the single write path.

☑ Evolution over replacement
  The four aliases removed from parent foods are retired to the new
  dedicated foods (not duplicated). The white-cabbage WS0 food is
  given a canonical variety entry. Alias tables are updated atomically
  at seed time (ON CONFLICT DO UPDATE). The parent canonical foods
  (almonds, corn, coconut, spelt) are retained and enriched with new
  aliases where appropriate (Dutch cabbage, hard cabbage on cabbage).
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Canonical Food Identity
Declared SoT: shared/canonical/foods.ts → DB canonical_food / food_variety / canonical_food_alias
New store created? NO
Existing store extended? YES — 4 new canonical_food rows, 1 new food_variety row, 10 net new alias rows
Consumer created? NO — all existing consumers (plant-classifier, resolver, seed runner) read the same store

Domain affected: Food Intelligence (WS0 Knowledge Registry)
Declared SoT: shared/knowledge/foods.ts → DB knowledge_foods (unchanged by M5)
New store created? NO — knowledge foods already authored in WS0X.2
Existing store extended? NO — knowledge registry is unchanged
Consumer created? NO — resolution consumers (nutrition-knowledge-registry.ts) already cover all WS0 foods
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Canonical Food Intelligence

Current Canonical Owner:
  Canonical spine: shared/canonical/foods.ts → DB canonical_food
  Knowledge registry: shared/knowledge/foods.ts → DB knowledge_foods
  (two owners at different scopes — legitimate distinct facts per Principle 2)

Current Runtime Consumer(s):
  Plant Diversity: shared/canonical/plant-classifier.ts (client-side)
  Meal Detail Food Intelligence: server/services/meal-food-intelligence.ts (server-side, reads WS0 registry)
  Nutrition Report: server/services/nutrition-knowledge-registry.ts
  Pantry Knowledge Hub: server/services/nutrition-knowledge-registry.ts
  Discovery, Alternatives, Stories: shared/discovery/, shared/alternatives/, shared/stories/

Duplicate Owners Remaining:
  ONE: yoghurt WS0 knowledge food (slug "yoghurt") is not linked from any canonical food.
  The canonical "yoghurt" food links to WS0 "live-yogurt" instead. The "yoghurt" WS0 food
  (Dairy category, nutrients: calcium, vitamin-b12, vitamin-d) has distinct but overlapping
  content with "live-yogurt" (Fermented foods, nutrients: live-cultures, calcium, vitamin-b12).
  This is a design decision deferred to M6 — see SUGGESTION.

Duplicate State Remaining:
  NONE

Duplicate Workflows Remaining:
  NONE

Current Convergence (%):
  264 of 265 WS0 knowledge foods now linked from canonical (foods or varieties).
  99.6% — only "yoghurt" WS0 food remains unlinked.

Target Convergence (%):
  100%

Next Planned Milestone:
  M6 — resolve the yoghurt WS0 food linkage (editorial decision: does canonical yoghurt
  link to "yoghurt" WS0 food for general dairy nutrients or to "live-yogurt" for
  fermented-food framing?). Low urgency — both WS0 foods cover similar content.

Remaining Architectural Risks:
  One WS0 knowledge food ("yoghurt") is not linked from any canonical food.
  No user-facing defect — the canonical "yoghurt" food resolves and displays
  live-yogurt nutrients correctly. Risk is limited to the "yoghurt" WS0 food's
  vitamin-d attribution not appearing when "yoghurt" is in a meal ingredient list.
```

---

## PHASE 1 — DATA AUDIT

### Pre-M5 Baseline (measured from current working tree before implementation)

| Metric | Count | Evidence |
|--------|-------|---------|
| Canonical foods | 250 | `CANONICAL_SEED.length` |
| Canonical varieties | 57 | `FOOD_VARIETY_SEED.length` |
| Canonical aliases | 716 | `CANONICAL_FOOD_ALIAS_SEED.length` |
| Diversity groups | 173 | `DIVERSITY_GROUP_SEED.length` |
| WS0 knowledge foods | 265 | `FOOD_SEED.length` |
| Foods with nutrient data | 265 | `Object.keys(FOOD_NUTRIENTS).length` — 100% |
| Foods with benefit links | 265 | `Object.keys(FOOD_BENEFITS).length` — 100% |
| Foods with food context | 259 | `Object.keys(FOOD_CONTEXT_SEED).length` |
| Knowledge foods linked from canonical | 259 | canonical food knowledgeFoodSlug + variety knowledgeFoodSlug |
| Knowledge foods NOT linked | 6 | almond-flour, baby-corn, coconut-flour, spelt-flour, white-cabbage, yoghurt |
| Foods ready for Level 1 activation | 5 | almond-flour, baby-corn, coconut-flour, spelt-flour, white-cabbage — all had food context pre-staged |
| Foods requiring editorial review | 0 | All 5 had complete WS0 editorial content and pre-staged context |
| Foods blocked by missing knowledge | 0 | All 265 WS0 foods have nutrient data |

### Key architectural finding

The dual resolution architecture was confirmed:
- **WS0 resolver** (`matchIngredientToSlug`): resolves ingredient strings → WS0 knowledge food slugs for Food Intelligence (nutrients, benefits, origin, availability)
- **Canonical resolver** (`resolveCanonicalFood`): resolves ingredient strings → canonical food slugs for Plant Diversity, identity, anti-fork

Both resolvers were already serving all 265 knowledge foods. The gaps identified were:

1. **Canonical coverage gap**: `almond-flour` had no canonical entry → "almond flour" resolved via WS0 resolver (nutrients displayed ✓) but NOT via canonical resolver (plant diversity not counted ✗)
2. **Alias specificity**: baby-corn, coconut-flour, spelt-flour existed only as form-aliases on parent foods → no independent canonical identity for Food Report and future per-food surfaces
3. **Missing aliases**: "Dutch cabbage" and "hard cabbage" → not resolvable by canonical resolver
4. **Variety gap**: white-cabbage WS0 food not linked from canonical variety

---

## PHASE 2 — TRUSTED ACTIVATION

### Summary

All 5 foods satisfying Level 1 trust requirements were activated. Full Level 2 context was applied (not Level 1/catalogue staging) because food-context.ts entries were already authored for all 5 foods.

### Changes to `shared/canonical/foods.ts`

#### Aliases removed from parent foods (transferred to new canonical foods)

| Alias removed | Was on | Transferred to |
|--------------|--------|----------------|
| "ground almonds" | canonical `almonds` | new canonical `almond-flour` |
| "baby corn" | canonical `corn` | new canonical `baby-corn` |
| "baby sweetcorn" | canonical `corn` | new canonical `baby-corn` |
| "coconut flour" | canonical `coconut` | new canonical `coconut-flour` |
| "spelt flour" | canonical `spelt` | new canonical `spelt-flour` |

#### New standalone canonical foods (4 added)

| Slug | Name | Category | knowledgeFoodSlug | diversityGroupSlug | Aliases |
|------|------|----------|-------------------|--------------------|---------|
| `almond-flour` | Almond Flour | Grains / Flours | `almond-flour` | `almonds` | "ground almonds", "almond meal", "blanched almond flour" |
| `baby-corn` | Baby Corn | Vegetables / Grain vegetables | `baby-corn` | `corn` | "baby corn", "baby sweetcorn", "miniature corn", "young corn" |
| `coconut-flour` | Coconut Flour | Grains / Flours | `coconut-flour` | `coconut` | "coconut flour", "desiccated coconut flour" |
| `spelt-flour` | Spelt Flour | Grains / Flours | `spelt-flour` | `spelt` | "spelt flour", "whole spelt flour", "white spelt flour", "spelt wholemeal flour" |

All four inherit full food context automatically (food-context.ts entries pre-staged):
- `almond-flour`: fc("common", [], "middle-east", ["imported"])
- `baby-corn`: fc("common", [], "southeast-asia", ["imported"])
- `coconut-flour`: fc("common", [], "southeast-asia", ["imported"])
- `spelt-flour`: fc("common", [], "europe", [])

#### New variety (1 added)

| Variety slug | Parent canonical | knowledgeFoodSlug |
|-------------|-----------------|-------------------|
| `white-cabbage` | `cabbage` | `white-cabbage` |

#### New aliases added to canonical `cabbage`

| Alias | Type |
|-------|------|
| "Dutch cabbage" | common_name |
| "hard cabbage" | common_name |

---

## PHASE 3 — PLATFORM ACTIVATION

All 4 new canonical foods and 1 new variety became available to all platform surfaces immediately via the existing architecture (no UI changes required):

| Surface | Improvement | Mechanism |
|---------|-------------|-----------|
| **Plant Diversity** | "almond flour", "ground almonds" now count as the `almonds` plant | `resolveCanonicalFood` → `diversityGroupSlug: "almonds"` → `isPlantIngredient()` |
| **Plant Diversity** | "baby corn" now has its own identity (was resolving to parent `corn`) | `resolveCanonicalFood` → `diversityGroupSlug: "corn"` |
| **Plant Diversity** | "coconut flour" resolves to own canonical food | `diversityGroupSlug: "coconut"` |
| **Plant Diversity** | "spelt flour" resolves to own canonical food | `diversityGroupSlug: "spelt"` |
| **Resolution** | "Dutch cabbage", "hard cabbage" now resolve canonically | New aliases on `cabbage` |
| **Resolution** | "miniature corn", "young corn" now resolve | New aliases on `baby-corn` |
| **Resolution** | "almond meal", "blanched almond flour" now resolve | New aliases on `almond-flour` |
| **Meal Detail Food Intelligence** | Unchanged — WS0 resolver already covered all these foods | `nutrition-knowledge-registry.ts` reads WS0 registry |
| **Nutrition Report** | Unchanged — nutrients already covered for all WS0 foods | WS0 registry unchanged |
| **Pantry Knowledge Hub** | Unchanged — all 265 WS0 foods already searchable | WS0 registry unchanged |
| **Planner** | Unchanged — no planner code touched | Out of scope |
| **Discovery** | Unchanged — discovery reads WS0 slugs already | Out of scope |

No UI redesign. Improvements occur through better data only, as specified.

---

## PHASE 4 — COVERAGE REPORT (POST-M5)

| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Canonical foods | 250 | **254** | +4 |
| Canonical varieties | 57 | **58** | +1 |
| Canonical aliases | 716 | **726** | +10 |
| Diversity groups | 173 | **173** | 0 |
| WS0 knowledge foods | 265 | **265** | 0 |
| Foods with nutrient data | 265 | **265** | 0 (all) |
| Knowledge foods linked from canonical | 259 | **264** | +5 |
| Knowledge foods NOT linked | 6 | **1** (yoghurt only) | -5 |
| Canonical foods with food context | 250 | **254** | +4 (context pre-staged) |
| Canonical→knowledge coverage | 97.7% | **99.6%** | +1.9% |

### New resolver coverage (canonical resolution)

| Ingredient string | Before | After |
|------------------|--------|-------|
| "almond flour" | NOT FOUND | → `almond-flour` (dg:almonds, plant:Nuts) |
| "ground almonds" | → `almonds` (general) | → `almond-flour` (dg:almonds) |
| "almond meal" | NOT FOUND | → `almond-flour` (dg:almonds) |
| "blanched almond flour" | NOT FOUND | → `almond-flour` (dg:almonds) |
| "baby corn" | → `corn` (general) | → `baby-corn` (dg:corn, plant:Vegetables) |
| "baby sweetcorn" | → `corn` (general) | → `baby-corn` (dg:corn) |
| "miniature corn" | NOT FOUND | → `baby-corn` (dg:corn) |
| "young corn" | NOT FOUND | → `baby-corn` (dg:corn) |
| "coconut flour" | → `coconut` (general) | → `coconut-flour` (dg:coconut, plant:Fruits) |
| "desiccated coconut flour" | NOT FOUND | → `coconut-flour` (dg:coconut) |
| "spelt flour" | → `spelt` (general) | → `spelt-flour` (dg:spelt, plant:Whole Grains) |
| "whole spelt flour" | NOT FOUND | → `spelt-flour` (dg:spelt) |
| "white spelt flour" | NOT FOUND | → `spelt-flour` (dg:spelt) |
| "spelt wholemeal flour" | NOT FOUND | → `spelt-flour` (dg:spelt) |
| "Dutch cabbage" | NOT FOUND | → `cabbage` (dg:cabbage, plant:Vegetables) |
| "hard cabbage" | NOT FOUND | → `cabbage` (dg:cabbage) |

### Verification evidence

- `validateCanonicalSeed()` → **0 problems** (verified post-M5)
- `canonicalSeedContextWarnings()` → **0 warnings** (all 4 new foods have full context)
- `resolveCanonicalFood("almond flour")` → `{matched: true, canonicalSlug: "almond-flour", diversityGroupSlug: "almonds"}` ✓
- `isPlantIngredient("almond flour")` → **true** ✓
- `getPlantCategory("almond flour")` → **"Nuts"** ✓
- All existing tests: **80/80 (keto), 27/27 (plant milk), 26/26 (diet pattern), 25/25 (planner compliance)** — 0 regressions

---

## PHASE 5 — REMAINING GAPS

| Gap | Count | Details |
|-----|-------|---------|
| `yoghurt` WS0 food unlinked | 1 | Canonical `yoghurt` → `live-yogurt` WS0 food. The `yoghurt` WS0 food (dairy, vitamin-d) is unlinked. Design decision needed: general dairy framing vs fermented-food framing. |
| Knowledge foods outside canonical scope | ~7 | Some WS0 knowledge foods exist for editorial purposes (natto, kombucha have knowledgeFoodSlug: null by design) |
| New canonical foods from future batches | TBD | Additional editorial review needed for any expansion beyond 254 canonical foods |
| Resolver: French-language ingredients | ~400 | Structural — require new WS0 foods or translation layer. Out of scope for M5. |
| Resolver: bad data strings | ~60 | Nutritional-data strings as ingredients (fat7g, etc.) — data quality issue, not resolvable via canonical. |

### Quantification

5 gaps identified. 5 resolved by M5. 1 design decision deferred (yoghurt). 0 new blockers introduced.

---

## DEFINITION OF DONE

✓ **Trusted Food Intelligence activated.** All 5 foods satisfying Level 1 trust requirements (identity, aliases, diversity group, knowledge link, food context) are now in the canonical spine.

✓ **Unified architecture preserved.** No new stores, no duplicate ownership, no sync bridges. The canonical spine and WS0 knowledge registry remain the sole owners of their respective domains.

✓ **No duplicate ownership.** Aliases transferred from parents to new canonical foods atomically. Anti-fork lock holds (0 validateCanonicalSeed problems).

✓ **No fabricated information.** All new canonical entries have pre-authored editorial context. No origin, season, availability, or nutrient data was guessed or fabricated.

✓ **Honest gaps maintained.** Unknown ingredients, foods outside the H1 set, and the yoghurt design question remain as explicit gaps. `resolveCanonicalFood` still returns `{matched: false}` for unrecognised strings.

✓ **Architecture Compliance completed.** Full compliance checklist above.

✓ **Architecture Convergence Status completed.** 99.6% canonical→knowledge coverage (264/265). One residual gap documented.

✓ **Coverage metrics reported.** Phases 1–5 above.

✓ **Project file created.** This document.

---

## DATA IMPACT

- **Reads existing data:** YES — reads canonical seed, food context seed, knowledge foods, relationships
- **Writes new data:** YES — 4 new canonical_food rows, 1 new food_variety row, 10 net new alias rows (5 transferred, 10 added)
- **Changes meaning of existing data:** NO — parent foods unchanged except alias removal; resolver output for parent foods unchanged
- **Requires backfill:** NO — food context was pre-staged; no DB-level backfill needed beyond normal seed run

---

## TRUST CHECK

- Could this mislead the user? **NO.** All new canonical entries point to WS0 knowledge foods with editorial nutrients. No fabricated claims.
- Could this fabricate certainty? **NO.** Food context was pre-authored with correct availability/origin. No inference.
- Is anything guessed but shown as real? **NO.** Diversity groups assigned only where botanically correct (almond-flour → almonds plant; baby-corn → corn plant; coconut-flour → coconut fruit; spelt-flour → spelt grain).
- What happens if the system is wrong? Canonical resolution falls back to `{matched: false}` for unknown strings. Plant diversity counts go to 0 for unmatched items, not to a wrong category.
- No architectural duplication introduced: **YES** ✓
- No new source of truth created: **YES** ✓
- No runtime behaviour altered for non-M5 foods: **YES** ✓

---

## ROLLBACK PLAN

| Item | Value |
|------|-------|
| Rollback identifier | `m5-rollback-pre-20260625` → commit `a8a912a` |
| Files modified | `shared/canonical/foods.ts` only |
| Rollback command | `git checkout m5-rollback-pre-20260625 -- shared/canonical/foods.ts` |

### After rollback, verify

```bash
# Re-run validator
npx tsx -e "const { validateCanonicalSeed } = require('./shared/canonical/index.ts'); console.log(validateCanonicalSeed());"

# Check counts returned to pre-M5 baseline
npx tsx -e "const { CANONICAL_FOOD_SEED, FOOD_VARIETY_SEED, CANONICAL_FOOD_ALIAS_SEED } = require('./shared/canonical/index.ts'); console.log('foods:', CANONICAL_FOOD_SEED.length, 'varieties:', FOOD_VARIETY_SEED.length, 'aliases:', CANONICAL_FOOD_ALIAS_SEED.length);"
# Expected: foods: 250, varieties: 57, aliases: 716

# Verify new foods removed
npx tsx -e "const { resolveCanonicalFood } = require('./shared/canonical/resolver.ts'); console.log(resolveCanonicalFood('almond flour').matched);"
# Expected: false (almond-flour canonical food no longer present)
```

---

## SCOPE LOCK

### Implemented scope

- Added 4 new canonical foods to `shared/canonical/foods.ts`: almond-flour, baby-corn, coconut-flour, spelt-flour
- Added 1 new canonical variety to `shared/canonical/foods.ts`: white-cabbage (under cabbage)
- Removed 5 aliases from parent foods (transferred to new canonical foods)
- Added 10 new aliases (9 to new canonical foods + 2 to canonical cabbage: Dutch cabbage, hard cabbage)
- All new foods have full Level 2 context via pre-staged food-context.ts entries

### Explicitly excluded scope

- No UI redesign
- No Planner redesign
- No Meal Detail redesign
- No Pantry redesign
- No Shopping redesign
- No changes to WS0 knowledge foods (shared/knowledge/foods.ts) — already complete
- No changes to FOOD_NUTRIENTS / FOOD_BENEFITS (already complete)
- No changes to food-context.ts (context was pre-staged)
- No changes to resolver, plant-classifier, or any server service
- No USDA data ingestion
- No new Food Intelligence systems

---

## SUGGESTION

### S1 — Resolve yoghurt WS0 food linkage (medium priority)

The `yoghurt` WS0 food (slug: "yoghurt", category: Dairy, nutrients: calcium, vitamin-b12, vitamin-d) is the only WS0 knowledge food not linked from any canonical food. The canonical `yoghurt` food currently links to `live-yogurt` WS0 food (Fermented foods, nutrients: live-cultures, calcium, vitamin-b12) which emphasises the fermented food angle.

**Options:**
- Change canonical `yoghurt` → `knowledgeFoodSlug: "yoghurt"` (show general dairy nutrients including vitamin-d; lose live-cultures emphasis)
- Keep current (live-yogurt link; accurate for the health-food angle THA takes)
- Retire `yoghurt` WS0 food as redundant (fold any unique content into `live-yogurt`)

**Recommendation:** Change to `knowledgeFoodSlug: "yoghurt"` — vitamin-d attribution is accurate for all yoghurt, not just live-culture varieties. The fermented status is already captured by `fermented: true` on the canonical food. THA to confirm before implementing.

### S2 — Plant-classifier coverage for flours (low priority)

`almond-flour`, `coconut-flour`, `spelt-flour` now have canonical entries and correct diversity groups. However, `plant-classifier.ts` GROUP_TO_PLANT_CATEGORY and GROUP_TO_VARIETY_KEY maps currently map `almonds → "Nuts"`, `coconut → "Fruits"`, `spelt → "Whole Grains"` at the diversity group level. These flours will correctly appear in those categories (via inherited diversity group slug). No change needed — the category assignments are correct. Noting for awareness only.
