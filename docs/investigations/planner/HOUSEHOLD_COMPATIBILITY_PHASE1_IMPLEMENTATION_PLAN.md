# Household Compatibility — Phase 1 Implementation Plan
# Profile-Derived Adult Context

**Date:** 2026-06-12
**Branch:** main
**Rollback tag:** `pre-household-compatibility-phase1-plan` (commit 43fbdda)
**Status:** Planning document only. No code changes. No database changes.
**Authoritative design:** `docs/investigations/planner/HOUSEHOLD_COMPATIBILITY_V1_MASTER_PLAN_REVISION.md`

---

## Rollback Identifier

```
Tag:    pre-household-compatibility-phase1-plan
Commit: 43fbdda (checkpoint: pre-nutrition-boost-provenance rollback point)

To restore:
  git checkout pre-household-compatibility-phase1-plan
```

---

## Scope Lock

This plan covers Phase 1 only:

> **Profile-Derived Adult Context** — adult dietary data flows from the user profile into the compatibility engine and household eaters API at query time. No copies. No sync. No backfill.

Out of scope for this plan:
- Phase 2 (normal meal compatibility adapter)
- Phase 3 (householdFit propagation)
- Phase 4 (compatibility review UI)
- Phase 5 (restriction resolver)
- V2 overrides / accept flow
- Nutrition enhancement

---

## OUTPUT 1 — Rollback Identifier

```
Tag:    pre-household-compatibility-phase1-plan
Commit: 43fbdda
```

---

## OUTPUT 2 — Canonical Dietary Source Recommendation

### Q2 — Canonical Dietary Source Validation

#### Field Inventory

| Field | Table | Type | Current value for adults |
|-------|-------|------|--------------------------|
| `diet_pattern` | `users` | `text` (nullable, single string) | Set at onboarding — e.g. "Keto", "Mediterranean" |
| `diet_restrictions` | `users` | `text[]` (nullable) | Set at onboarding — e.g. ["Gluten-Free", "Dairy-Free"] |
| `diet_types` | `user_preferences` | `text[]` (NOT NULL, default []) | Bridge copy of `diet_pattern`, lowercase canonical — e.g. ["keto"] |
| `excluded_ingredients` | `user_preferences` | `text[]` (NOT NULL, default []) | Manual ingredient exclusions — e.g. ["anchovies", "coriander"] |
| `defaultDietTypes` | `household_eaters` | `text[]` (nullable) | Always `[]` for adults (never written) |
| `hardRestrictions` | `household_eaters` | `text[]` (nullable) | Always `[]` for adults (never written) |

#### The Bridge: `users.diet_pattern` → `user_preferences.diet_types`

In `server/routes.ts` lines 958–994 (inside `PUT /api/profile`):

```
On every profile save where dietPattern changes:
  1. Read current user_preferences.diet_types
  2. Strip all canonical values (vegan, keto, mediterranean, etc.)
  3. Derive new canonical value from diet_pattern via DIET_PATTERN_TO_DIET_TYPE map
  4. Write back to user_preferences.diet_types
  5. Preserves non-canonical extras (halal, kosher, style:*, etc.)

Note: this is non-fatal — bridge failure does not fail the profile save.
```

Mapping (`routes.ts` lines 966–977):
```
"Vegan"          → "vegan"
"Vegetarian"     → "vegetarian"
"Flexitarian"    → "flexitarian"
"Keto"           → "keto"
"Low-Carb"       → "low-carb"
"Paleo"          → "paleo"
"Carnivore"      → "carnivore"
"Mediterranean"  → "mediterranean"
"DASH"           → "dash"
"MIND"           → "mind"
```

#### Drift Risk Between the Two Fields

The bridge is non-fatal. A user who set `diet_pattern` before the bridge existed (or whose bridge write silently failed) may have a populated `users.diet_pattern` with an empty `user_preferences.diet_types`. This is a real gap.

#### Recommendation: Dual-Source with Fallback

**For `defaultDietTypes` (soft diet preferences):**

Primary: `user_preferences.diet_types` — already an array, already canonical lowercase, already the form the engine and planner expect.

Fallback: If `user_preferences.diet_types` is empty AND `users.diet_pattern` is non-null, derive from `users.diet_pattern` using the canonical `DIET_PATTERN_TO_DIET_TYPE` mapping.

This covers users with stale `user_preferences.diet_types`. It costs one extra check and no additional query (both sources are fetched in the same two lookups).

**For `hardRestrictions` (dietary restriction labels):**

Authoritative: `users.diet_restrictions` — the label array ("Gluten-Free", "Dairy-Free"). This matches the `household_eaters.hardRestrictions` vocabulary exactly.

Do NOT use `user_preferences.excluded_ingredients` for `hardRestrictions`. They are different concepts:
- `users.diet_restrictions` = dietary labels ("Gluten-Free") → `hardRestrictions`
- `user_preferences.excluded_ingredients` = specific ingredient names ("anchovies") → separate concept, not mapped into `hardRestrictions`

#### Summary

| Target field | Authoritative source | Fallback |
|-------------|---------------------|---------|
| `defaultDietTypes` | `user_preferences.diet_types` | `users.diet_pattern` via mapping |
| `hardRestrictions` | `users.diet_restrictions` | None needed (nullable → return []) |

---

## OUTPUT 3 — Files Requiring Modification

Phase 1 touches exactly **two files**.

### File 1: `server/routes.ts`

| Location | Change |
|----------|--------|
| Module scope (~line 900 area, before profile handler) | Extract `DIET_PATTERN_TO_DIET_TYPE` map to module-level constant (currently defined inline at lines 966–977 inside `PUT /api/profile`) |
| `GET /api/household/eaters` handler (lines 7937–7949) | After fetching rows, enrich adult rows with profile-derived `defaultDietTypes` and `hardRestrictions` before returning |

**No other changes to `server/routes.ts`.**

Specifically, `PUT /api/profile` is not changed. The bridge that syncs `diet_pattern → user_preferences.diet_types` is not changed. `syncMembersAsEaters()` is not called or changed from the route. The PATCH handler for eaters is not changed.

### File 2: `server/lib/household-meal-matcher.ts`

| Location | Change |
|----------|--------|
| Imports (lines 1–12) | Add `users` table to the import from `@shared/schema` |
| Member assembly loop (lines 181–203) | For adult eaters (`eater.userId != null`), read `users.diet_restrictions` and use `prefs?.dietTypes` as `dietTypes` instead of the empty `profile.dietTypes` from `getEffectiveDietProfile()` |

**No other changes to this file.** `scoreTemplate()`, `buildExplanation()`, `matchMealsForHousehold()` signature, and all output fields are unchanged.

### Files Confirmed NOT Requiring Changes

| File | Reason |
|------|--------|
| `server/storage.ts` | `syncMembersAsEaters()` not changed — empty arrays for adults are now correct by design |
| `shared/household-eater.ts` | `dbEaterToHouseholdEater()` and `getEffectiveDietProfile()` not changed |
| `shared/schema.ts` | No schema changes |
| `client/src/pages/weekly-planner-page.tsx` | See Q5 — no client changes required |
| `client/src/pages/profile-page.tsx` | HouseholdEatersSection reads `eater.defaultDietTypes` — correct values now come from API |
| `server/lib/planner-compliance.ts` | Already reads `users.diet_pattern` and `users.diet_restrictions` directly — correct today, unchanged |

---

## OUTPUT 4 — API Enrichment Design

### Q3 — GET /api/household/eaters Enrichment

#### Current behaviour (broken for adults)

Request: `GET /api/household/eaters`

Current route handler (`server/routes.ts` lines 7937–7949):
1. `syncMembersAsEaters(householdId)` — ensures adult rows exist (with empty arrays)
2. `storage.getHouseholdEaters(householdId)` — fetches raw DB rows
3. `rows.map(dbEaterToHouseholdEater)` — converts raw rows to `HouseholdEater` objects
4. Returns array

Adult row as currently returned:
```json
{
  "id": "42",
  "displayName": "Colin",
  "kind": "user",
  "userId": 7,
  "defaultDietTypes": [],
  "hardRestrictions": []
}
```

Child row (correct, unchanged):
```json
{
  "id": "43",
  "displayName": "Lilly",
  "kind": "child",
  "defaultDietTypes": ["Vegetarian"],
  "hardRestrictions": ["Gluten-Free"]
}
```

#### Revised behaviour

After the enrichment step, for adult rows (`row.userId IS NOT NULL`):

1. Fetch `users` row for `row.userId` → read `diet_pattern`, `diet_restrictions`
2. Fetch `user_preferences` row for `row.userId` → read `diet_types`
3. Derive `defaultDietTypes`:
   - If `user_preferences.diet_types` is non-empty → use it
   - Else if `users.diet_pattern` is set → map through `DIET_PATTERN_TO_DIET_TYPE` → wrap as array
   - Else → `[]`
4. Derive `hardRestrictions`:
   - `users.diet_restrictions ?? []`
5. Return enriched `HouseholdEater` with derived values

**Adult row as returned after enrichment (example: Keto user):**
```json
{
  "id": "42",
  "displayName": "Colin",
  "kind": "user",
  "userId": 7,
  "defaultDietTypes": ["keto"],
  "hardRestrictions": []
}
```

**Adult row — Mediterranean + Dairy-Free:**
```json
{
  "id": "42",
  "displayName": "Colin",
  "kind": "user",
  "userId": 7,
  "defaultDietTypes": ["mediterranean"],
  "hardRestrictions": ["Dairy-Free"]
}
```

**Adult row — no dietary preferences set:**
```json
{
  "id": "42",
  "displayName": "Colin",
  "kind": "user",
  "userId": 7,
  "defaultDietTypes": [],
  "hardRestrictions": []
}
```

**Child row — unchanged:**
```json
{
  "id": "43",
  "displayName": "Lilly",
  "kind": "child",
  "defaultDietTypes": ["Vegetarian"],
  "hardRestrictions": ["Gluten-Free"]
}
```

#### Important: These values are NOT persisted

The enriched `defaultDietTypes` and `hardRestrictions` values for adult rows are computed at read time in the route handler. They are **not written to `household_eaters`**. The `household_eaters` table for adult rows continues to store empty arrays. The database does not change.

#### Transformation Logic Detail

```
Source fields queried per adult eater:
  users.diet_pattern         → string | null
  users.diet_restrictions    → string[] | null
  user_preferences.diet_types → string[] (not null, default [])

Derive defaultDietTypes:
  if user_preferences.diet_types.length > 0:
    → use user_preferences.diet_types as-is
  else if users.diet_pattern is non-null:
    → mapped = DIET_PATTERN_TO_DIET_TYPE[users.diet_pattern]
    → if mapped: return [mapped]
    → else: return [users.diet_pattern]  (preserve unknown patterns)
  else:
    → return []

Derive hardRestrictions:
  return users.diet_restrictions ?? []
```

#### Concurrency note

The enrichment involves one additional `users` lookup and one `user_preferences` lookup per adult eater row. Households typically have one adult user account. In single-adult households, this is two lookups total (both can be parallelised). These queries are by primary key and are effectively free at expected scale.

---

## OUTPUT 5 — Compatibility Engine Design

### Q4 — matchMealsForHousehold() Member Assembly

#### Current member assembly (lines 181–203)

```typescript
const members: MemberProfile[] = [];
for (const row of eaterRows) {
  const eater = dbEaterToHouseholdEater(row);
  const profile = getEffectiveDietProfile(eater, overrideMap.get(Number(eater.id)));

  let prefs: typeof userPreferences.$inferSelect | undefined;
  if (eater.userId != null) {
    [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, eater.userId));
  }

  members.push({
    userId: eater.userId ?? null,
    displayName: eater.displayName,
    dietTypes: profile.dietTypes,                          // ← [] for adults (broken)
    excludedIngredients: profile.hardRestrictions.map(r => r.toLowerCase()), // ← [] for adults (broken)
    preferredIngredients: prefs?.preferredIngredients ?? [],
    maxPrepTolerance: prefs?.maxPrepTolerance ?? null,
    upfSensitivity: prefs?.upfSensitivity ?? "moderate",
    healthGoals: prefs?.healthGoals ?? [],
  });
}
```

`profile.dietTypes` comes from `getEffectiveDietProfile()` which reads `eater.defaultDietTypes` — which is `[]` for adults.
`profile.hardRestrictions` comes from `eater.hardRestrictions` — which is `[]` for adults.

#### Revised member assembly

For adult eaters (`eater.userId != null`):
- `dietTypes` ← `prefs?.dietTypes ?? []` (from existing `user_preferences` query — no new query needed)
- `excludedIngredients` ← `users.diet_restrictions` for that userId, mapped to lowercase (new `users` join)
- Override for `dietTypes` still applied: if `overrideMap.get(eater.id)` exists, use `override.dietTypes` (same semantics as `getEffectiveDietProfile`)
- `hardRestrictions` cannot be overridden — always uses `users.diet_restrictions`

For child eaters (`eater.userId == null`):
- Path unchanged: `getEffectiveDietProfile(eater, override)` → `profile.dietTypes`, `profile.hardRestrictions`

#### Before/After Member Object

**Adult eater — before (Keto user, broken):**
```json
{
  "userId": 7,
  "displayName": "Colin",
  "dietTypes": [],
  "excludedIngredients": [],
  "preferredIngredients": ["salmon", "avocado"],
  "maxPrepTolerance": 30,
  "upfSensitivity": "high",
  "healthGoals": ["weight-loss"]
}
```

**Adult eater — after (Keto user, correct):**
```json
{
  "userId": 7,
  "displayName": "Colin",
  "dietTypes": ["keto"],
  "excludedIngredients": [],
  "preferredIngredients": ["salmon", "avocado"],
  "maxPrepTolerance": 30,
  "upfSensitivity": "high",
  "healthGoals": ["weight-loss"]
}
```

**Adult eater — after (Mediterranean + Dairy-Free):**
```json
{
  "userId": 7,
  "displayName": "Colin",
  "dietTypes": ["mediterranean"],
  "excludedIngredients": ["dairy-free"],
  "preferredIngredients": [],
  "maxPrepTolerance": null,
  "upfSensitivity": "moderate",
  "healthGoals": []
}
```

**Child eater — before and after (unchanged):**
```json
{
  "userId": null,
  "displayName": "Lilly",
  "dietTypes": ["Vegetarian"],
  "excludedIngredients": ["gluten-free"],
  "preferredIngredients": [],
  "maxPrepTolerance": null,
  "upfSensitivity": "moderate",
  "healthGoals": []
}
```

#### Override Interaction (adults)

`plannerWeekEaterOverrides` still applies. The override map is keyed on `eater.id` (the `household_eaters.id` integer). Adult eaters still have `household_eaters` rows. The override mechanism is unchanged:

```
base dietTypes for adult   = user_preferences.diet_types (profile-derived)
override present           = override.dietTypes replaces base (same as before)
hardRestrictions           = users.diet_restrictions (never overridden — correct)
```

#### New Import Required

`server/lib/household-meal-matcher.ts` needs `users` added to its schema import:

```typescript
// Before (line 3–9):
import {
  householdEaters,
  plannerWeekEaterOverrides,
  userPreferences,
  mealTemplates,
  ingredientSwaps,
} from "@shared/schema";

// After:
import {
  householdEaters,
  plannerWeekEaterOverrides,
  userPreferences,
  users,           // ← added
  mealTemplates,
  ingredientSwaps,
} from "@shared/schema";
```

---

## OUTPUT 6 — Planner Impact Assessment

### Q5 — `weekly-planner-page.tsx` allDietTypes

**Answer: NO client changes required.**

#### Evidence

`weekly-planner-page.tsx` line 311:
```typescript
const allDietTypes = householdEaters.flatMap((e) => e.defaultDietTypes);
```

This reads `eater.defaultDietTypes` from the `householdEaters` array, which is populated from the `GET /api/household/eaters` API response.

After Phase 1, the API response includes correctly derived `defaultDietTypes` for adult rows. The client reads those values unchanged. `allDietTypes` will now include adult diet types. No client code changes.

#### Secondary planner usage (`weekly-planner-page.tsx` lines 1897–1946)

The week diet UI also reads `eater.defaultDietTypes` as the base for the override toggle:
```typescript
const activeDiets: string[] = override ? override.dietTypes : eater.defaultDietTypes;
```

After Phase 1, adult eaters will show their profile-derived diet types as the default in the toggle UI. Toggling creates `plannerWeekEaterOverrides` on top of those defaults. This is correct behaviour.

#### MealUpliftPanel (indirect planner dependency)

`allDietTypes` is passed to boost filtering (lines 311, 318–319):
```typescript
for (const diet of allDietTypes) {
  if (shouldExcludeRecipe(boost.name, { dietPattern: diet, dietRestrictions: [] })) return false;
}
```

After Phase 1, adult diet types are included in `allDietTypes`. Boosts that conflict with the adult's diet pattern (e.g., a sugar boost for a Keto adult) will be correctly filtered out. This is the intended behaviour — currently missing because adult diet types are absent.

**Planner impact assessment: NO code changes required. Behaviour change is intentional and correct.**

---

## OUTPUT 7 — Data Impact Declaration

| Question | Answer | Notes |
|----------|--------|-------|
| Reads existing data | **YES** | Reads `users.diet_pattern`, `users.diet_restrictions`, `user_preferences.diet_types` — all existing fields |
| Writes new data | **NO** | No writes to any table. No inserts, updates, or deletes. |
| Changes meaning of existing data | **NO** | All fields retain their current semantics. `household_eaters.defaultDietTypes` is not changed in meaning — it simply remains unused for adult rows (empty by design). |
| Requires migration | **NO** | No schema changes. No new columns. No new tables. |
| Requires backfill | **NO** | No data needs to be moved. Profile data stays in profile tables. |
| Changes API response shape | **NO** | Response shape is unchanged. Same fields, same types. Adult rows now have correct values instead of empty arrays. |
| Breaking change | **NO** | All consumers of `defaultDietTypes` and `hardRestrictions` already handle these fields. Empty → populated is backwards compatible. |

---

## OUTPUT 8 — Trust Check

### Q7 — Behavioural Impact Assessment

#### Could planner behaviour change?

**YES — intentionally.**

The weekly planner's `allDietTypes` derivation currently excludes adults (their arrays are empty). After Phase 1, adult diet types are included. The boost filter (`shouldExcludeRecipe`) will now correctly exclude boosts that conflict with adult dietary patterns. A Keto adult will no longer receive carbohydrate-heavy boost suggestions.

Assessment: **Correct fix. Expected behaviour change.**

#### Could compatibility scores change?

**YES — intentionally.**

`matchMealsForHousehold()` currently scores all templates with adult members as if adults have no dietary preferences. After Phase 1, adult dietary data enters the engine. Templates incompatible with an adult's diet pattern will score lower. Templates aligned with the adult's diet pattern will score higher.

Assessment: **Correct fix. Scores were unreliable before. They will be reliable after.**

#### Could Smart Planner results change?

**POTENTIALLY — intentionally, but monitor.**

The smart planner uses `matchMealsForHousehold()` at Tier-4. After Phase 1, adult dietary constraints influence which shell templates score highest. For an adult with "Keto" in their profile, shell templates with carbohydrate-heavy base slots will score lower. The Tier-4 candidate selection may favour different templates.

This is the intended correction. The concern is not whether results change (they should) but whether the change is proportionate. If an adult has unusual values in `diet_restrictions` (e.g., free-text entries that do not match the resolver's vocabulary), Path B substring matching may produce unexpected exclusions.

Mitigation: Test with realistic profile values before shipping. Document that Phase 5 (resolver) improves precision but is not a prerequisite.

#### Could any existing households become newly restricted?

**YES — for households with adult members who have set dietary preferences.**

An adult with "Gluten-Free" in their `users.diet_restrictions` will now contribute a `gluten-free` exclusion to the engine's ingredient matching. If a shell template contains gluten ingredients, it will now conflict for that adult eater. Previously, it appeared compatible.

This is the **correct outcome** — the previous "fully compatible" result for that adult was a false positive. The engine was silently ignoring the adult's actual dietary profile.

Assessment: **No false restrictions introduced. Previously false negatives become correct conflicts.**

#### Edge Cases

| Case | Behaviour | Safe? |
|------|-----------|-------|
| Adult with no dietary preferences set (`diet_pattern = null`, `diet_restrictions = null`) | `defaultDietTypes: []`, `hardRestrictions: []` — same as before | Yes |
| Adult with `diet_pattern` set but `user_preferences.diet_types` empty (stale bridge) | Fallback derivation from `diet_pattern` using mapping | Yes |
| Adult with `diet_pattern` not in the `DIET_PATTERN_TO_DIET_TYPE` map | Unknown pattern preserved as-is in array | Yes — treated as opaque string, engine handles unknown values gracefully |
| Single-adult household | One `users` lookup, same result | Yes |
| Multi-adult household | One `users` lookup per adult row | Yes — N lookups by primary key |
| Week diet override active for adult | Override `dietTypes` applied on top of profile-derived base (same semantics) | Yes |

---

## OUTPUT 9 — Definition of Done

### Q8 — Success Criteria

Phase 1 is complete when all of the following are true:

#### API Criteria

- [ ] `GET /api/household/eaters` returns `defaultDietTypes` populated from `user_preferences.diet_types` (or fallback from `users.diet_pattern`) for adult eater rows
- [ ] `GET /api/household/eaters` returns `hardRestrictions` populated from `users.diet_restrictions` for adult eater rows
- [ ] Child eater rows are unaffected — `defaultDietTypes` and `hardRestrictions` still read from `household_eaters` as before
- [ ] The `household_eaters` DB table is NOT written to by the GET handler

#### Engine Criteria

- [ ] `matchMealsForHousehold()` assembles adult members with `dietTypes` from `user_preferences.diet_types` (non-empty) or fallback from `users.diet_pattern`
- [ ] `matchMealsForHousehold()` assembles adult members with `excludedIngredients` from `users.diet_restrictions` (mapped to lowercase)
- [ ] Week diet overrides (`plannerWeekEaterOverrides`) still apply correctly for adult eaters — override `dietTypes` takes precedence over profile-derived base
- [ ] Child members assembled with `getEffectiveDietProfile()` — path unchanged

#### Planner Criteria

- [ ] `allDietTypes` in `weekly-planner-page.tsx` now includes adult diet types without any client code change
- [ ] Week diet toggle UI shows adult's profile-derived diet types as defaults
- [ ] Boost filter correctly excludes boosts conflicting with adult diet patterns

#### What Must Not Break

- [ ] Child eater chips continue to render correctly in `HouseholdEatersSection`
- [ ] `PATCH /api/household/eaters/:eaterId` continues to reject adult eater edit attempts (line 7980: `if (target.userId !== null) return res.status(403)`)
- [ ] `syncMembersAsEaters()` still creates adult rows with empty arrays — this is now correct, not a bug
- [ ] `PUT /api/profile` continues to write to `users` and `user_preferences` without touching `household_eaters`
- [ ] `planner-compliance.ts` is untouched and continues to read from `users` directly — no regression
- [ ] Solo user (no household eaters) unaffected

### Q8 — Manual Test Plan

#### Test 1: Adult Keto

**Setup:** User profile — `diet_pattern: "Keto"`, no `diet_restrictions`

**Steps:**
1. Navigate to Profile → Household Eaters section
2. Observe adult eater row for the current user

**Expected:**
- Chip rendered: "keto" (from `user_preferences.diet_types` bridge) or "Keto" (from fallback)
- No hard restriction chips

**API verification:**
```
GET /api/household/eaters
→ adult row: { defaultDietTypes: ["keto"], hardRestrictions: [] }
```

**Engine verification:** Run `matchMealsForHousehold()` — adult member has `dietTypes: ["keto"]`, `excludedIngredients: []`

---

#### Test 2: Adult Mediterranean + Dairy-Free

**Setup:** User profile — `diet_pattern: "Mediterranean"`, `diet_restrictions: ["Dairy-Free"]`

**Steps:**
1. Navigate to Profile → Household Eaters section
2. Observe adult eater row

**Expected:**
- Chips rendered: "mediterranean" (diet type) + "Dairy-Free" (hard restriction)

**API verification:**
```
GET /api/household/eaters
→ adult row: { defaultDietTypes: ["mediterranean"], hardRestrictions: ["Dairy-Free"] }
```

**Engine verification:** Adult member has `dietTypes: ["mediterranean"]`, `excludedIngredients: ["dairy-free"]`

---

#### Test 3: Child "Lilly" — Regression Check

**Setup:** Lilly is a child eater with `defaultDietTypes: ["Vegetarian"]`, `hardRestrictions: ["Gluten-Free"]` stored in `household_eaters`

**Steps:**
1. Navigate to Profile → Household Eaters section
2. Observe Lilly's row

**Expected:** Lilly's row is completely unchanged — chips show "Vegetarian" and "Gluten-Free" exactly as before Phase 1

**API verification:**
```
GET /api/household/eaters
→ Lilly row: { kind: "child", defaultDietTypes: ["Vegetarian"], hardRestrictions: ["Gluten-Free"] }
```

**Engine verification:** Lilly member assembled via `getEffectiveDietProfile()` — path unchanged, same values

---

#### Test 4: Child "Daisy" — Regression Check

Same approach as Test 3 for any other child eater. Confirm no unintended changes.

---

#### Test 5: Household Eaters Chips (Profile Page)

**Steps:**
1. Adult user with Keto diet navigates to Profile
2. Scroll to Household Eaters section
3. Observe their own eater row

**Expected:** Chips render for the adult eater. Previously: no chips (empty arrays). After Phase 1: "keto" chip visible.

**Regression:** All other eater rows (children) show same chips as before.

---

#### Test 6: Planner Summary — Adult Diet Types

**Steps:**
1. Adult with Mediterranean diet opens Smart Planner
2. Open "This week's household diets" toggle
3. Observe adult's diet pills

**Expected:** "Mediterranean" shown as the adult's current diet type. Toggle works correctly (creates override, reverts on removal).

---

#### Test 7: Compatibility Engine Inputs

**Steps:**
1. Call `matchMealsForHousehold(userId)` with an adult user who has Keto + a child who is Vegetarian
2. Inspect the assembled `members[]` array (via debug log or test)

**Expected members:**
```
members[0] (adult, Keto):
  dietTypes: ["keto"]
  excludedIngredients: []
  
members[1] (child, Vegetarian + Gluten-Free):
  dietTypes: ["Vegetarian"]
  excludedIngredients: ["gluten-free"]
```

**Previously broken (before Phase 1):**
```
members[0] (adult):
  dietTypes: []
  excludedIngredients: []
```

---

#### Test 8: No dietary preferences — Edge Case

**Setup:** Adult user with `diet_pattern: null` and `diet_restrictions: null`

**Expected:** Adult eater row returns `defaultDietTypes: []`, `hardRestrictions: []`. No error. No change from before Phase 1 for this user.

---

#### Test 9: Week Diet Override — Adult

**Setup:** Adult with "Keto" profile. Week diet override exists for this eater in `plannerWeekEaterOverrides` with `dietTypes: ["flexitarian"]`

**Expected in engine:** Override takes precedence — `member.dietTypes: ["flexitarian"]` (not `["keto"]`)

**Expected in planner UI:** Toggle shows "flexitarian" selected (not "keto")

---

## OUTPUT 10 — Rollback Plan

### Q9 — Rollback Plan (RED Risk Classification)

Phase 1 is classified RED because:
- It changes values returned by a live API endpoint (`GET /api/household/eaters`)
- It changes inputs to the compatibility engine (`matchMealsForHousehold`)
- It touches the Smart Planner pipeline (via allDietTypes)

No data is written, so there is no data rollback needed. All changes are in application logic.

#### Exact Files Touched

| File | Change |
|------|--------|
| `server/routes.ts` | Extract `DIET_PATTERN_TO_DIET_TYPE` to module scope; enrich adult rows in GET handler |
| `server/lib/household-meal-matcher.ts` | Add `users` import; revise adult member assembly |

Two files. No schema files. No migration files. No client files.

#### Rollback Approach

**Option A — Git tag restore (complete rollback):**
```bash
git checkout pre-household-compatibility-phase1-plan -- server/routes.ts server/lib/household-meal-matcher.ts
```
Restores both files to exact pre-Phase-1 state. Takes seconds. Adults revert to empty arrays. No data loss (no data was written).

**Option B — Feature flag (preferred for staged rollout):**
Add an environment variable `HOUSEHOLD_ADULT_PROFILE_DERIVATION=true` that gates the enrichment logic. If rollback needed, set to `false` or unset — no deployment required, just an env var change. Both files still change, but the behaviour is toggleable without a redeploy.

Recommendation: implement Option B for production safety. The flag check is a single conditional in each of the two change locations.

**Option C — Immediate revert PR:**
If deployed to production and issues found, a revert PR touching only the two files can be merged in minutes. No migration or data cleanup required.

#### Verification Approach

**Before deployment:**
1. Run existing test suite — confirm no regressions
2. Manual test plan (Output 9 above) — all 9 tests pass
3. Confirm `household_eaters` DB table unchanged (no unexpected writes)
4. Confirm `users` and `user_preferences` DB tables unchanged (reads only)

**After deployment:**
1. `GET /api/household/eaters` for a known adult user — confirm `defaultDietTypes` populated
2. `GET /api/household/eaters` for a known child eater — confirm values unchanged
3. Smart Planner run for a household with mixed adult/child — confirm no error
4. Profile save (PUT) — confirm profile still saves successfully, no regression to household_eaters table

**Monitoring signals (rollback trigger):**
- `GET /api/household/eaters` 500 error rate spike
- Smart Planner (`/api/smart-suggest`) 500 error rate spike
- User reports of incorrect dietary chip display

#### Release Validation Approach

Phase 1 can be validated in staging before production:

1. Create a test adult user with `diet_pattern: "Keto"`, `diet_restrictions: ["Dairy-Free"]`
2. Add a child eater with `defaultDietTypes: ["Vegetarian"]`
3. Call `GET /api/household/eaters` — assert adult row has correct fields, child row unchanged
4. Run Smart Planner for that user — assert no errors, observe member inputs in debug log
5. Confirm no writes to `household_eaters` table for the adult row

---

## OUTPUT 11 — Final Status

### Q10 — Final Recommendation

**STATUS A: Phase 1 is ready for implementation.**

**Evidence:**

1. **Both change locations are confirmed and bounded.** Two files. Two targeted changes. The member assembly loop in `household-meal-matcher.ts` is lines 181–203 — the change affects only the `dietTypes` and `excludedIngredients` assignment for adult eaters, within existing conditional logic. The GET route handler is lines 7937–7949 — enrichment is additive.

2. **No unknowns remain.** The canonical sources are confirmed (`user_preferences.diet_types` primary, `users.diet_restrictions` for restrictions). The fallback path for stale bridge values is designed. The override interaction is verified as compatible.

3. **No schema changes. No migrations. No backfills.** Delivery risk is bounded to application logic in two files.

4. **`getEffectiveDietProfile()` does not need to change.** The child eater path is untouched. Only the adult path adds a new data source. The shared module remains clean.

5. **The `users` import in `household-meal-matcher.ts` is the largest structural change** — adding one table to an existing import statement. All query patterns used (SELECT by primary key, existing `db` infrastructure) are already established in the file.

6. **The DIET_PATTERN_TO_DIET_TYPE extraction** removes code duplication between the PUT and GET handlers. This is a pure improvement with zero behavioural risk.

7. **Rollback is instant.** Two files, no data written, git tag exists.

**Confidence: HIGH.**

---

## Appendix — Key Line References

| Location | Lines | Description |
|----------|-------|-------------|
| `shared/schema.ts` | 23–24 | `users.diet_pattern`, `users.diet_restrictions` columns |
| `shared/schema.ts` | 630–664 | `user_preferences` table definition |
| `shared/schema.ts` | 1069–1079 | `household_eaters` table definition |
| `shared/household-eater.ts` | 97–112 | `dbEaterToHouseholdEater()` — not changed |
| `shared/household-eater.ts` | 141–149 | `getEffectiveDietProfile()` — not changed |
| `server/storage.ts` | 2710–2735 | `syncMembersAsEaters()` — not changed |
| `server/routes.ts` | 936–994 | `PUT /api/profile` — not changed (includes bridge) |
| `server/routes.ts` | 966–977 | `DIET_PATTERN_TO_DIET_TYPE` map — **extract to module scope** |
| `server/routes.ts` | 7937–7949 | `GET /api/household/eaters` — **enrich adult rows** |
| `server/lib/household-meal-matcher.ts` | 1–12 | Imports — **add `users`** |
| `server/lib/household-meal-matcher.ts` | 181–203 | Member assembly loop — **revise adult path** |
| `client/src/pages/weekly-planner-page.tsx` | 311 | `allDietTypes` derivation — **not changed** |

---

*Document ends. Phase 1 planning only. Do not expand into Phase 2–5.*
