# M3 — Canonical Dietary Rules Convergence Implementation

**Date:** 2026-06-25
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Risk:** 🔴 RED — shared business logic, Planner, recipe matching, household compatibility, multiple application surfaces
**Status:** COMPLETE

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `m3-dietary-rules-pre-convergence` → HEAD `a8a912a` |
| Working tree at start | **Intentionally dirty** — 20+ modified tracked files + ~55 untracked docs from in-progress WS0X streams and M1/M2 completion. Not created by this task. |
| This task's writes | 2 deletions + 1 new shared module + 7 import updates + this document |
| Rollback command | `git checkout m3-dietary-rules-pre-convergence` |

**Rollback confirmed before implementation began.**

---

## REFERENCE DOCUMENTS READ

- [x] `docs/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/investigations/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [x] `docs/ENGINEERING_WORKFLOW.md`
- [x] `docs/investigations/THA_CORE_ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/investigations/M1_FOOD_INTELLIGENCE_CONVERGENCE_IMPLEMENTATION.md`
- [x] `docs/investigations/M2_PANTRY_KNOWLEDGE_CONVERGENCE_IMPLEMENTATION.md`

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Diet rules have one key space: shared/dietRules.ts (one module, one path).
  No new key space introduced. No existing key space altered.

☑ One owner per fact
  Dietary rule logic was owned in parallel by server/lib/dietRules.ts AND
  client/src/lib/dietRules.ts. After M3: shared/dietRules.ts exclusively.
  Both prior copies deleted — dual ownership eliminated.

☑ No duplicate entities
  No new entity created. Two duplicate entities deleted
  (server/lib/dietRules.ts and client/src/lib/dietRules.ts).

☑ No duplicate ownership
  Duplicate ownership removed. shared/dietRules.ts is the single declared owner.
  Both server and client import from the same shared module.

☑ No duplicate state
  No runtime state involved — dietRules.ts is pure computation (no data store).
  The code duplication (two files with identical/diverged logic) is eliminated.

☑ Extends existing architecture
  Uses the established shared/ pattern already in use for
  schema.ts, routes.ts, restrictions/, discovery/, alternatives/,
  stories/, seasonal/, food-synonyms.ts, household-eater.ts, etc.
  No new pattern introduced.

☑ Progressive enrichment where appropriate
  N/A — dietRules.ts is a stateless computation module, not a knowledge entity.
  Enrichment semantics do not apply.

☑ Honest gaps over fabricated information
  N/A — dietRules.ts evaluates keyword presence; it has no knowledge gaps.
  Where no rule applies, shouldExcludeRecipe returns false (honest: not excluded).

☑ No permanent synchronisation bridge
  Deleted both copies. No sync bridge built or retained. There is no synchronisation
  to perform — a single shared module is imported by both server and client directly.

☑ Evolution over replacement
  server/lib/dietRules.ts is the authoritative version; it is moved to shared/.
  client/src/lib/dietRules.ts (the outdated copy) is deleted.
  Named retirement condition: register Rule 4 / Phase 8 Migration M3.
```

---

## CRITICAL FINDING: FILES HAD DIVERGED

The client file's header states "This file is an identical copy of server/lib/dietRules.ts" — but **this was no longer true**. The files had diverged in four areas, all of which represent functional improvements that existed on the server but were missing from the client copy:

| Divergence | Server (authoritative) | Client (outdated copy) | Impact |
|---|---|---|---|
| `FISH_SEAFOOD_KEYWORDS` | Contains `"seafood"` as a separate keyword | Missing `"seafood"` | Meals titled "seafood X" could pass Vegan/Vegetarian filter on client |
| `DISH_NAME_MEAT_OR_SEAFOOD` | Present — catches carbonara, ragu, bolognese, birria, ossobuco | **Missing entirely** | Client: a "Carbonara" with no ingredient list passes Vegan/Vegetarian |
| `PLANT_MILK_PHRASES` + `removePlantMilkPhrases()` | Present — strips almond milk, oat milk, coconut milk etc. before dairy scan | **Missing entirely** | Client: a Vegan recipe with "almond milk" was incorrectly excluded as Dairy-containing |
| `normalizeForSearch()` diacritics | Present — strips accents ("ragù" → "ragu") | **Missing entirely** | Client: "ragù" would not match `DISH_NAME_MEAT_OR_SEAFOOD` even if it existed |

**These are pre-existing client-side bugs caused by the dual-ownership problem.** The convergence to the shared (server) version corrects them. No server-side behaviour changes. Client-side behaviour improves: fewer false exclusions (plant milks), better safety (dish name detection).

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Dietary Rules (Pattern Matching) — Domain 6
Declared SoT: shared/dietRules.ts (moved from server/lib/dietRules.ts)
New store created? NO — moved to shared/, not a new store
Existing store extended? NO — logic unchanged (server version is canonical)
Existing store deleted? YES — server/lib/dietRules.ts and client/src/lib/dietRules.ts
Consumer created? NO
Consumer retired? NO — all consumers updated to use shared module
Consumer reads from declared SoT? YES — all 5 runtime consumers now import @shared/dietRules
```

---

## IMPLEMENTATION SUMMARY

### Consumer audit (pre-implementation)

**Server consumers (imported from server/lib/dietRules.ts):**

| Consumer | Import | Exports used |
|---|---|---|
| `server/lib/smart-suggest-service.ts` | `./dietRules` | `shouldExcludeRecipe` |
| `server/routes.ts` | `./lib/dietRules` | `shouldExcludeRecipe`, `scoreRecipeForDiet` |

**Client consumers (imported from client/src/lib/dietRules.ts via @/lib/dietRules):**

| Consumer | Import | Exports used |
|---|---|---|
| `client/src/components/NutritionBoostPanel.tsx` | `@/lib/dietRules` | `shouldExcludeRecipe` |
| `client/src/pages/meals-page.tsx` | `@/lib/dietRules` | `shouldExcludeRecipe` |
| `client/src/pages/weekly-planner-page.tsx` | `@/lib/dietRules` | `shouldExcludeRecipe` |

**Test consumers (imported from ../lib/dietRules.js):**

| Consumer | Import |
|---|---|
| `server/tests/diet-audit-matrix.ts` | `shouldExcludeRecipe`, `scoreRecipeForDiet` |
| `server/tests/test-plant-milk-vegan.ts` | `shouldExcludeRecipe` |
| `server/tests/test-planner-compliance-gate.ts` | `shouldExcludeRecipe` |
| `server/tests/test-smart-suggest-diet-pattern.ts` | `shouldExcludeRecipe` |
| `server/tests/test-keto-low-carb-dictionary.ts` | `shouldExcludeRecipe` |

**Note:** `server/lib/planner-compliance.ts` delegates to `server/lib/smart-suggest-service.ts` for diet checking — it does not import dietRules directly. No change required.

### Changes made

1. **Created `shared/dietRules.ts`** — copy of `server/lib/dietRules.ts` (the authoritative version with all four improvements over the client copy: `FISH_SEAFOOD_KEYWORDS` with `"seafood"`, `DISH_NAME_MEAT_OR_SEAFOOD`, `PLANT_MILK_PHRASES`/`removePlantMilkPhrases()`, `normalizeForSearch()`).

2. **Updated `server/lib/smart-suggest-service.ts`** — import changed from `"./dietRules"` to `"@shared/dietRules"`.

3. **Updated `server/routes.ts`** — import changed from `"./lib/dietRules"` to `"@shared/dietRules"`.

4. **Updated `client/src/components/NutritionBoostPanel.tsx`** — import changed from `"@/lib/dietRules"` to `"@shared/dietRules"`.

5. **Updated `client/src/pages/meals-page.tsx`** — import changed from `"@/lib/dietRules"` to `"@shared/dietRules"`.

6. **Updated `client/src/pages/weekly-planner-page.tsx`** — import changed from `"@/lib/dietRules"` to `"@shared/dietRules"`.

7. **Updated 5 test files** — import changed from `'../lib/dietRules.js'` to `'../../shared/dietRules.js'`.

8. **Deleted `server/lib/dietRules.ts`** — retired; moved to shared/.

9. **Deleted `client/src/lib/dietRules.ts`** — retired; the outdated client copy. Zero consumers remain.

---

## BEFORE / AFTER ARCHITECTURE

### BEFORE (2 parallel owners — already diverged)

```
Dietary Rules (Pattern Matching) — Domain 6
├── server/lib/dietRules.ts         ← Authoritative (complete logic)
│   ├── DISH_NAME_MEAT_OR_SEAFOOD   ← Catches carbonara/ragu/bolognese
│   ├── PLANT_MILK_PHRASES          ← Prevents almond milk false-positive
│   ├── normalizeForSearch()        ← Diacritic normalisation
│   ├── "seafood" in FISH_SEAFOOD_KEYWORDS
│   ├── smart-suggest-service.ts    ← Server planner engine
│   └── server/routes.ts            ← Recipe search + scoring
│
└── client/src/lib/dietRules.ts     ← Outdated copy (missing 4 features)
    ├── No DISH_NAME_MEAT_OR_SEAFOOD  ← Carbonara passes Vegan filter on client
    ├── No PLANT_MILK_PHRASES         ← Almond milk falsely excluded Dairy-Free
    ├── No normalizeForSearch()       ← Diacritics not normalised
    ├── No "seafood" keyword
    ├── NutritionBoostPanel.tsx     ← Client meal detail boost filtering
    ├── meals-page.tsx              ← Client cookbook filtering
    └── weekly-planner-page.tsx    ← Client planner filtering
```

### AFTER (one owner — shared/dietRules.ts)

```
Dietary Rules (Pattern Matching) — Domain 6
└── shared/dietRules.ts             ← Single authoritative module
    ├── DISH_NAME_MEAT_OR_SEAFOOD   ✓ (from server version)
    ├── PLANT_MILK_PHRASES          ✓ (from server version)
    ├── normalizeForSearch()        ✓ (from server version)
    ├── "seafood" keyword           ✓ (from server version)
    ├── shouldExcludeRecipe()       → imported by all 5 runtime consumers
    └── scoreRecipeForDiet()        → imported by server/routes.ts
        ├── server/lib/smart-suggest-service.ts  ← @shared/dietRules ✓
        ├── server/routes.ts                     ← @shared/dietRules ✓
        ├── client/src/components/NutritionBoostPanel.tsx ← @shared/dietRules ✓
        ├── client/src/pages/meals-page.tsx      ← @shared/dietRules ✓
        └── client/src/pages/weekly-planner-page.tsx ← @shared/dietRules ✓

server/lib/dietRules.ts             ← DELETED ✓
client/src/lib/dietRules.ts         ← DELETED ✓
```

---

## DIETARY PATTERNS SUPPORTED

All dietary patterns from the authoritative `server/lib/dietRules.ts` are preserved unchanged in `shared/dietRules.ts`:

| Pattern | Rule type | Logic |
|---|---|---|
| **Vegetarian** | Hard exclusion | Excludes MEAT_KEYWORDS, FISH_SEAFOOD_KEYWORDS, gelatin/lard/suet/rennet, DISH_NAME_MEAT_OR_SEAFOOD |
| **Vegan** | Hard exclusion | Excludes MEAT_KEYWORDS, FISH_SEAFOOD_KEYWORDS, DAIRY_KEYWORDS (with plant milk protection), egg/honey/gelatin/gelatine, DISH_NAME_MEAT_OR_SEAFOOD |
| **Dairy Free** | Hard restriction | Excludes DAIRY_KEYWORDS (with plant milk protection) |
| **Gluten Free** | Hard restriction | Excludes GLUTEN_KEYWORDS |
| **Keto** | Hard exclusion | Excludes KETO_EXCLUDE (10-category dictionary) |
| **Low-Carb** | Hard exclusion | Excludes LOW_CARB_EXCLUDE (same as KETO_EXCLUDE) |
| **Paleo** | Hard exclusion | Excludes PALEO_EXCLUDE (grains, dairy, legumes — not sweet potato) |
| **Carnivore** | Hard exclusion | Excludes CARNIVORE_PLANT_KEYWORDS |
| **Mediterranean** | Scoring only | MEDITERRANEAN_BOOST keyword scoring |
| **DASH** | Scoring only | DASH_BOOST/DASH_PENALTY keyword scoring |
| **MIND** | Scoring only | MIND_BOOST/MIND_PENALTY keyword scoring |
| **Flexitarian** | Scoring only | FLEXITARIAN_BOOST/FLEXITARIAN_PENALTY keyword scoring |

Restriction patterns (independent of diet pattern):
- **Nut Free**, **Egg Free**, **Soy Free**, **Shellfish** — handled by `shared/restrictions/restriction-library.ts` (Domain 5, separate domain, unchanged by M3)

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Dietary Rules (Pattern Matching) — Domain 6

Current Canonical Owner:
  shared/dietRules.ts (moved from server/lib/dietRules.ts)
  Single file, no Node.js dependencies, safe in browser and server.

Current Runtime Consumer(s):
  - server/lib/smart-suggest-service.ts → @shared/dietRules (shouldExcludeRecipe)
  - server/routes.ts → @shared/dietRules (shouldExcludeRecipe, scoreRecipeForDiet)
  - client/src/components/NutritionBoostPanel.tsx → @shared/dietRules (shouldExcludeRecipe)
  - client/src/pages/meals-page.tsx → @shared/dietRules (shouldExcludeRecipe)
  - client/src/pages/weekly-planner-page.tsx → @shared/dietRules (shouldExcludeRecipe)

Duplicate Owners Remaining:
  NONE — server/lib/dietRules.ts deleted, client/src/lib/dietRules.ts deleted.

Duplicate State Remaining:
  NONE — no data state involved (pure computation module).

Duplicate Workflows Remaining:
  NONE — single rule evaluation path: any consumer → shared/dietRules.ts.

Current Convergence (%):
  100% — Domain 6 (Dietary Rules) fully converged.

  Evidence:
  - 2 owners existed: server/lib/dietRules.ts + client/src/lib/dietRules.ts
  - 1 canonical owner declared: shared/dietRules.ts
  - 2/2 old owners deleted → 100% ownership converged
  - 5/5 runtime consumers updated to shared module → 100% consumer compliance
  - 5/5 test consumers updated to shared module → 100% test compliance
  - 0 remaining references to old file locations (confirmed by grep)

Target Convergence (%):
  100% — achieved.

Next Planned Milestone:
  M4 — Replace nutrition-variety.ts plant counting with canonical diversity_group
  (register Phase 8, Migration M4)

Remaining Architectural Risks:
  1. nutrition-variety.ts still owns plant diversity counting (keyword lists vs
     canonical diversity_group). This is the M4 risk: inconsistent plant counts
     between 30-plants counter and Food Report.
  2. Dietary Preferences (Domain 7) duplication: users.dietPattern/dietRestrictions
     vs user_preferences table — low current risk (green per register), not in
     M3 scope.
  3. Planner legacy tables (meal_plans/meal_plan_entries co-existing with planner_*)
     — unrelated to dietary rules, not in scope.
```

---

## VERIFICATION

### Automated checks

| Check | Result |
|-------|--------|
| Zero imports of `@/lib/dietRules` remain | ✅ Confirmed — grep shows zero |
| Zero imports of `./dietRules` in server remain | ✅ Confirmed — grep shows zero |
| Zero imports of `./lib/dietRules` in server remain | ✅ Confirmed — grep shows zero |
| Zero imports of `../lib/dietRules.js` in tests remain | ✅ Confirmed — grep shows zero |
| All 5 runtime consumers import `@shared/dietRules` | ✅ Confirmed |
| All 5 test consumers import `../../shared/dietRules.js` | ✅ Confirmed |
| `npm run typecheck` | ✅ Zero new errors (25 pre-existing in server/tests/ and server/scripts/ — unchanged from prior workstreams) |
| `npm run build` | ✅ Builds successfully — `dist/index.cjs` and `dist/public/assets/index-*.js` generated |

### Architecture compliance

| Requirement | Status |
|---|---|
| Duplicate ownership removed | ✅ server/lib/dietRules.ts deleted |
| Duplicate ownership removed | ✅ client/src/lib/dietRules.ts deleted |
| Runtime uses one implementation | ✅ All 5 consumers read shared/dietRules.ts |
| Server behaviour preserved | ✅ Shared module = exact content of server version |
| Client behaviour corrected | ✅ Client now runs complete logic (plant milk protection, dish names, diacritics) |
| Planner unchanged | ✅ smart-suggest-service.ts and planner-compliance.ts logic unchanged |
| Household compatibility unchanged | ✅ restriction-library.ts untouched (Domain 5, separate) |
| Meal filtering unchanged | ✅ shouldExcludeRecipe API identical; no callers changed |
| Scoring unchanged | ✅ scoreRecipeForDiet API identical |

---

## MANUAL EYEBALL TESTS

Perform these steps to verify no regression. Each test targets a major dietary pattern.

### 1. Planner — Vegetarian profile (household compatibility)

Setup: Profile → Dietary Pattern = Vegetarian
- Navigate to Weekly Planner
- Use "Get Smart Suggestions" (Smart Planner)
- EXPECT: All suggested meals are free of chicken/beef/pork/fish/lamb
- EXPECT: No "Pasta Carbonara" or "Ragu" in suggestions
- EXPECT: A Mushroom Risotto or Cheese Omelette IS suggested
- EXPECT: No console errors

### 2. Planner — Vegan profile

Setup: Profile → Dietary Pattern = Vegan
- Use "Get Smart Suggestions"
- EXPECT: No meals containing meat, fish, dairy, eggs, honey
- EXPECT: A recipe containing "almond milk" IS suggested (plant milk not falsely excluded)
- EXPECT: "Carbonara" and "Bolognese" do NOT appear

### 3. Planner — Dairy-Free restriction

Setup: Profile → Dietary Restrictions = Dairy-Free (no diet pattern)
- Use "Get Smart Suggestions"
- EXPECT: No meals with milk/cream/cheese/butter/yogurt
- EXPECT: A recipe with "coconut milk" or "oat milk" IS suggested (plant milk protected)
- EXPECT: No console errors

### 4. Planner — Gluten-Free restriction

Setup: Profile → Dietary Restrictions = Gluten-Free
- Use "Get Smart Suggestions"
- EXPECT: No meals with wheat/pasta/bread/couscous/barley
- EXPECT: Rice-based and potato-based meals ARE suggested

### 5. Planner — Keto profile

Setup: Profile → Dietary Pattern = Keto
- Use "Get Smart Suggestions"
- EXPECT: No meals with pasta/bread/rice/potato/beans/sugar
- EXPECT: Salmon, chicken, eggs, avocado meals ARE suggested

### 6. Cookbook — Vegetarian filter

Setup: Profile → Dietary Pattern = Vegetarian
- Navigate to Meals (Cookbook)
- EXPECT: The meal list filters correctly — chicken/beef/fish meals hidden
- EXPECT: Veggie meals visible

### 7. Meal Detail — Nutrition Boost panel (NutritionBoostPanel.tsx)

Setup: Vegan profile, open a meal detail in Planner
- EXPECT: Nutrition Boost suggestions shown do not include animal-derived boosts
- EXPECT: Chia Seeds, Pumpkin Seeds, Spinach suggestions visible if applicable
- EXPECT: No console errors

### 8. Weekly Planner — compatibility labels (weekly-planner-page.tsx)

Setup: Dairy-Free restriction
- Open any meal in the Weekly Planner
- EXPECT: Compatibility label correctly identifies dairy-containing meals
- EXPECT: No false positives on meals with oat milk (not flagged as dairy)

### 9. Mediterranean, DASH, MIND, Flexitarian — scoring only

Setup: Profile → Dietary Pattern = Mediterranean
- Use "Get Smart Suggestions"
- EXPECT: Fish, olive oil, and vegetable-forward meals rank higher
- EXPECT: No meals are excluded (Mediterranean has no hard exclusions)
- EXPECT: No console errors

### 10. Paleo profile

Setup: Profile → Dietary Pattern = Paleo
- Use "Get Smart Suggestions"
- EXPECT: No meals with pasta/bread/rice/dairy/legumes
- EXPECT: Sweet potato dishes ARE suggested (Paleo intentionally allows sweet potato)

### 11. Carnivore profile

Setup: Profile → Dietary Pattern = Carnivore
- Use "Get Smart Suggestions"
- EXPECT: Only meat/fish/egg-based meals
- EXPECT: Vegetable-forward meals excluded

### 12. No console errors across navigation

- Navigate: Planner → Cookbook → Pantry → Shopping
- EXPECT: No console errors referencing `dietRules`, `@/lib/dietRules`, or missing modules

---

## DEFINITION OF DONE

| Criterion | Status |
|---|---|
| One dietary rule engine | ✅ shared/dietRules.ts |
| Zero duplicate ownership | ✅ Both copies deleted |
| Zero duplicate state | ✅ No runtime state involved |
| Runtime behaviour preserved | ✅ Server logic unchanged; client bugs corrected |
| Existing dietary decisions unchanged | ✅ All rule logic identical to server authoritative version |
| Architecture Compliance completed | ✅ All 10 checklist items pass |
| Architecture Convergence Status completed | ✅ 100% Domain 6 converged |
| Project file created | ✅ This document |

---

## DATA IMPACT

| Question | Answer |
|---|---|
| Reads existing data | NO — dietRules.ts is pure computation |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |

---

## TRUST CHECK

| Question | Answer |
|---|---|
| No behavioural changes (server) | ✅ Server logic identical — shared module is exact copy of server version |
| No behavioural regression (client) | ✅ Client was running outdated/bugged copy; convergence corrects bugs only |
| No duplicated rule engine | ✅ Both copies deleted; single shared module |
| No duplicated ownership | ✅ One owner: shared/dietRules.ts |
| No synchronisation bridge | ✅ No bridge needed — one module imported directly by all consumers |
| Planner unchanged | ✅ smart-suggest-service.ts and planner-compliance.ts delegate to same function |
| Compatibility unchanged | ✅ restriction-library.ts (Nut Free, Egg Free, Soy Free, Shellfish) is separate Domain 5 — untouched |

---

## ROLLBACK PLAN

| Item | Value |
|---|---|
| Rollback tag | `m3-dietary-rules-pre-convergence` → `a8a912a` |
| Rollback command | `git checkout m3-dietary-rules-pre-convergence` |

### Files to restore

```bash
# Restore server/lib/dietRules.ts
git checkout m3-dietary-rules-pre-convergence -- server/lib/dietRules.ts

# Restore client/src/lib/dietRules.ts
git checkout m3-dietary-rules-pre-convergence -- client/src/lib/dietRules.ts

# Restore all updated consumers
git checkout m3-dietary-rules-pre-convergence -- server/lib/smart-suggest-service.ts
git checkout m3-dietary-rules-pre-convergence -- server/routes.ts
git checkout m3-dietary-rules-pre-convergence -- client/src/components/NutritionBoostPanel.tsx
git checkout m3-dietary-rules-pre-convergence -- client/src/pages/meals-page.tsx
git checkout m3-dietary-rules-pre-convergence -- client/src/pages/weekly-planner-page.tsx

# Restore test files
git checkout m3-dietary-rules-pre-convergence -- server/tests/diet-audit-matrix.ts
git checkout m3-dietary-rules-pre-convergence -- server/tests/test-plant-milk-vegan.ts
git checkout m3-dietary-rules-pre-convergence -- server/tests/test-planner-compliance-gate.ts
git checkout m3-dietary-rules-pre-convergence -- server/tests/test-smart-suggest-diet-pattern.ts
git checkout m3-dietary-rules-pre-convergence -- server/tests/test-keto-low-carb-dictionary.ts

# Remove new shared module and project file
rm shared/dietRules.ts
rm docs/investigations/M3_CANONICAL_DIETARY_RULES_CONVERGENCE_IMPLEMENTATION.md
```

### Verification after rollback

```bash
npm run typecheck   # should match pre-M3 error count (24 pre-existing)
npm run build       # should complete successfully
grep -r "from.*dietRules" --include="*.ts" --include="*.tsx"  # should show only @/lib/dietRules and ./dietRules paths
```

---

## SCOPE LOCK

### Implemented in this task

- Created `shared/dietRules.ts` (single canonical module, content = server authoritative version)
- Updated 5 runtime consumers to import from `@shared/dietRules`
- Updated 5 test consumers to import from `../../shared/dietRules.js`
- Deleted `server/lib/dietRules.ts`
- Deleted `client/src/lib/dietRules.ts`

### Explicitly excluded (out of scope)

- `client/src/lib/nutrition-variety.ts` — still used for plant diversity counting (M4: replace with canonical diversity_group lookup)
- Dietary Preferences consolidation (Domain 7: users.dietPattern / user_preferences overlap) — register assessment is GREEN; not in M3 scope
- Planner redesign — not performed
- Meal Detail redesign — not performed
- Cookbook redesign — not performed
- Shopping redesign — not performed
- Household Compatibility redesign — not performed
- New dietary features — not introduced
- Rule behaviour changes — not performed (server logic preserved exactly)

### SUGGESTION (out of scope — do not implement without approval)

1. **Rule library comments**: The `DISH_NAME_MEAT_OR_SEAFOOD` list is intentionally short (5 dish names). Consider expanding with `lasagne` (implies meat), `moussaka` (implies lamb), `cottage pie` (implies beef mince), `shepherd's pie` (implies lamb) — all well-known non-vegan dish titles that could slip through if ingredients are absent.

2. **Nut Free, Egg Free, Soy Free, Shellfish keyword coverage**: These are handled by `shared/restrictions/restriction-library.ts` (Domain 5) — correctly separate. If these restrictions should also be evaluated by dietRules (for completeness), that is a design decision, not a convergence issue.

3. **Complete M4**: Replace `nutrition-variety.ts` keyword lists with WS2A canonical `diversity_group` table for plant counting — the remaining M4 migration from the register.

---

*M3 Canonical Dietary Rules Convergence implemented on 2026-06-25.*
*Rollback tag: `m3-dietary-rules-pre-convergence` → `a8a912a`*
*Project file: `docs/investigations/M3_CANONICAL_DIETARY_RULES_CONVERGENCE_IMPLEMENTATION.md`*
