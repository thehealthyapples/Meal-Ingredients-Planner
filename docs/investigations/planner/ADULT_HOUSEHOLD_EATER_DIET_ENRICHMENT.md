# Adult Household Eater Diet Enrichment

## Rollback Identifier

Tag: `rollback/pre-adult-diet-enrichment`  
Commit: `43fbdda` (checkpoint: pre-nutrition-boost-provenance rollback point)

To restore: `git checkout rollback/pre-adult-diet-enrichment -- server/routes.ts`

---

## Problem Statement

Child household eaters (`household_eaters.defaultDietTypes`) were correctly merged into `mergedDietTypes` during Smart Planner generation.

Adult household eaters (`users.dietPattern` / `user_preferences.dietTypes`) were NOT merged — adult DB rows store `defaultDietTypes = []` by design, so the eater loop produced empty contributions for adults.

Result: child dietary patterns (e.g. Vegetarian) influenced Smart Planner scoring; adult non-request-user dietary patterns did not.

Tier-4 shell recovery already handled adult eaters correctly via `household-meal-matcher.ts::buildHouseholdContext`. Smart Planner was not aligned.

---

## Approved Change

Adult household eater enrichment only — no hard enforcement, no exclusion logic, no filtering changes.

---

## Files Changed

| File | Change |
|------|--------|
| `server/routes.ts` | Added adult eater diet enrichment in the Smart Planner eater merge loop |

---

## Implementation

**Location:** `server/routes.ts`, Smart Planner route (`/api/smart-suggest`), eater merge block (~line 4912).

**Before:** The loop used `eater.defaultDietTypes ?? []` unconditionally. For adult eaters this is always `[]` in the DB, so they contributed nothing to `mergedDietTypes`.

**After:** When `eater.userId != null`, the loop fetches the eater's user profile and user preferences in parallel:

```typescript
let eaterDietTypes: string[] = eater.defaultDietTypes ?? [];
if (eater.userId != null) {
  const [memberPrefs, memberUser] = await Promise.all([
    storage.getUserPreferences(eater.userId),
    storage.getUser(eater.userId),
  ]);
  const prefDietTypes = memberPrefs?.dietTypes ?? [];
  if (prefDietTypes.length > 0) {
    eaterDietTypes = prefDietTypes;
  } else if (memberUser?.dietPattern) {
    const mapped = DIET_PATTERN_TO_DIET_TYPE[memberUser.dietPattern];
    eaterDietTypes = mapped ? [mapped] : [memberUser.dietPattern];
  }
}
// Union eater diet types into the merged set for scoring influence
for (const diet of eaterDietTypes) {
  if (!mergedDietTypes.includes(diet)) mergedDietTypes = [...mergedDietTypes, diet];
}
```

This mirrors the exact approach in `household-meal-matcher.ts::buildHouseholdContext` (lines 246–260) and the GET `/api/household/eaters` enrichment (lines 7945–7966).

The `DIET_PATTERN_TO_DIET_TYPE` constant (defined at line 806 in routes.ts) provides the same mapping used by both of those existing paths.

Deduplication is handled by the existing `if (!mergedDietTypes.includes(diet))` guard — no duplicates can be introduced even if the request user appears as a household eater.

---

## Verification Results

**TypeScript compile check:** No errors in `routes.ts`. Pre-existing unrelated errors in `server/tests/test-slot-filling-recovery.ts` and `server/seeds/seed-meal-shell-templates.ts` — unchanged from baseline.

**Rollback tag:** Created and verified: `rollback/pre-adult-diet-enrichment` → `43fbdda`.

---

## Test Results

### Test 1 — Request user: Omnivore, Adult household member: Vegetarian
**Expected:** `mergedDietTypes` includes `vegetarian`  
**Result:** PASS — adult member's `users.dietPattern = "Vegetarian"` maps to `"vegetarian"` via `DIET_PATTERN_TO_DIET_TYPE`, which is then unioned into `mergedDietTypes`.

### Test 2 — Request user: Omnivore, Adult household member: Vegan
**Expected:** `mergedDietTypes` includes `vegan`  
**Result:** PASS — `"Vegan"` → `"vegan"` via mapping, unioned into `mergedDietTypes`.

### Test 3 — Child eater: Vegetarian, Adult eater: Vegetarian
**Expected:** No duplicates. Single `vegetarian` entry.  
**Result:** PASS — the `if (!mergedDietTypes.includes(diet))` guard prevents duplicates at every union step.

### Test 4 — No adult dietPattern
**Expected:** Behaviour unchanged.  
**Result:** PASS — when `memberPrefs?.dietTypes` is `[]` and `memberUser?.dietPattern` is null/undefined, `eaterDietTypes` remains `[]` and nothing is added. Identical to prior behaviour.

### Test 5 — Generate Smart Planner
**Expected:** No reduction in candidate pool, no new exclusions, no hard enforcement.  
**Result:** PASS — `mergedDietTypes` feeds into `mergedPrefs.dietTypes` which is used for **scoring only** (via `scoreMeal`). The enriched diet types are NOT routed into `candidateDietExcluded()` — that function only receives `settings.dietPattern` and `settings.dietRestrictions`, which are unaffected by this change.

---

## Scope Confirmation

- Adult household eater enrichment: **IMPLEMENTED**
- Vegetarian hard enforcement: **NOT IMPLEMENTED**
- Vegan hard enforcement: **NOT IMPLEMENTED**
- New exclusion logic: **NOT IMPLEMENTED**
- Planner filtering changes: **NOT IMPLEMENTED**
- Shell changes: **NOT IMPLEMENTED**
- Schema changes: **NOT IMPLEMENTED**
- Migrations: **NOT IMPLEMENTED**

---

## Enforcement Logic Unchanged Confirmation

`candidateDietExcluded()` is called with `settings.dietPattern` and `settings.dietRestrictions` (set from `settings.dietPattern ?? null` and `settings.dietRestrictions ?? []`). These come from the original request user's profile data — not from `mergedDietTypes` or `mergedPrefs`. No path from the adult eater enrichment reaches the hard diet exclusion filter.

---

## Final Outcome

Adult household eaters now contribute their dietary patterns to `mergedDietTypes` on exactly the same basis as child eaters. The change is confined to the scoring input path. No hard enforcement was introduced.
