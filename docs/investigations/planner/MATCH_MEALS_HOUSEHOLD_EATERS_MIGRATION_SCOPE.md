MATCH MEALS HOUSEHOLD EATERS MIGRATION SCOPE: COMPLETE

---

**Rollback Identifier:** `investigation/match-meals-household-eaters-migration-scope-20260608`
**Branch:** main
**Commit at investigation start:** `1e83f32`
**Date:** 2026-06-08
**Risk Level:** GREEN — Read-only. No code changed. No data written.

---

## ROOT FINDING

**`matchMealsForHousehold()` is currently dead code. It is exported but never imported or called anywhere in the codebase.**

There is no route, no service, and no test that invokes it. The migration therefore has zero live call-site impact. The entire change is contained to one file.

**Evidence:**
```
grep -rn "matchMealsForHousehold" workspace/ --include="*.ts" --include="*.tsx"

Result:
server/lib/household-meal-matcher.ts:158:export async function matchMealsForHousehold(userId: number): Promise<MealMatch[]>
```

One match. The declaration itself. No import, no call.

**Evidence for `household-meal-matcher` module:**
```
grep -rn "household-meal-matcher" workspace/ (excluding .md files)

Result:
server/seeds/seed-meal-shell-templates.ts:276:  //    Uses the same logic as household-meal-matcher.ts:scoreTemplate() but without
```

One match. A comment in the seed script. Not an import.

**Consequence:** Changing this function cannot break any live code. The only risk is in how correctly it is implemented for future wiring as Tier 4 recovery.

---

## 1. Exact Current Implementation — Line Map

**File:** `server/lib/household-meal-matcher.ts`

### Imports (lines 1–10)

```typescript
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import {
  householdMembers,     // ← REMOVE
  users,               // ← REMOVE
  userPreferences,     // ← KEEP (used for user-linked eater enrichment)
  mealTemplates,       // ← KEEP
  ingredientSwaps,     // ← KEEP
} from "@shared/schema";
import type { MealTemplate } from "@shared/schema";  // ← KEEP
import { getHouseholdForUser } from "./household";    // ← KEEP
```

**Required changes:**
- Remove: `householdMembers`, `users` from schema import
- Add: `householdEaters` to schema import
- Add new import: `import { dbEaterToHouseholdEater, getEffectiveDietProfile } from "@shared/household-eater.js";`

### Interface: `MemberProfile` (lines 15–24)

```typescript
interface MemberProfile {
  userId: number;         // ← CHANGE to: userId: number | null
  displayName: string;
  dietTypes: string[];
  excludedIngredients: string[];
  preferredIngredients: string[];
  maxPrepTolerance: number | null;
  upfSensitivity: string;
  healthGoals: string[];
}
```

**Required change:** Line 16 — `userId: number` → `userId: number | null`

This interface is private (not exported). The change is file-scoped.

### Interface: `MemberChange` (lines 34–38)

```typescript
interface MemberChange {
  userId: number;    // ← CHANGE to: userId: number | null
  displayName: string;
  swaps: string[];
}
```

**Required change:** Line 35 — `userId: number` → `userId: number | null`

This interface is also private. However, `MealMatch` (line 50) is exported and contains `memberChanges: MemberChange[]`. Any future caller reading `memberChanges[n].userId` must null-guard. Since there are no current callers, this is a documentation obligation only.

### Query block (lines 158–192) — full replacement target

```typescript
export async function matchMealsForHousehold(userId: number): Promise<MealMatch[]> {
  const householdId = await getHouseholdForUser(userId);

  // ── REMOVE LINES 161–173 ─────────────────────────────────────────────────────
  const memberRows = await db
    .select({
      member: householdMembers,
      user: { id: users.id, displayName: users.displayName, username: users.username },
    })
    .from(householdMembers)
    .innerJoin(users, eq(householdMembers.userId, users.id))
    .where(
      and(
        eq(householdMembers.householdId, householdId),
        eq(householdMembers.status, "active")
      )
    );

  // ── REMOVE LINES 175–191 ─────────────────────────────────────────────────────
  const members: MemberProfile[] = [];
  for (const { member, user } of memberRows) {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, member.userId));
    members.push({
      userId: member.userId,
      displayName: user.displayName || user.username,
      dietTypes: prefs?.dietTypes ?? [],
      excludedIngredients: prefs?.excludedIngredients ?? [],
      preferredIngredients: prefs?.preferredIngredients ?? [],
      maxPrepTolerance: prefs?.maxPrepTolerance ?? null,
      upfSensitivity: prefs?.upfSensitivity ?? "moderate",
      healthGoals: prefs?.healthGoals ?? [],
    });
  }
  // ─────────────────────────────────────────────────────────────────────────────
```

Lines 161–191 (31 lines) are the complete replacement target. Everything from line 192 onwards is unchanged.

### Lines 192 onwards — UNCHANGED

```
192   // Household-level planning settings come from the calling user's preferences
193   const [callerPrefs] = await db
...
226   }  // end of matchMealsForHousehold
```

```
230   function scoreTemplate(...)  // UNCHANGED
...
398   }  // end of file
```

Everything after line 191 requires zero changes.

---

## 2. Required Data Mapping

### Source: `HouseholdEaterRow` (from `household_eaters`)

```typescript
// From shared/schema.ts householdEaters table:
{
  id: number,                          // serial primary key
  householdId: number,                 // FK to households
  displayName: string,                 // display name
  userId: number | null,               // null for children
  defaultDietTypes: string[] | null,   // soft preferences
  hardRestrictions: string[] | null,   // always enforced
}
```

### Target: `MemberProfile`

```typescript
interface MemberProfile {
  userId: number | null;
  displayName: string;
  dietTypes: string[];
  excludedIngredients: string[];
  preferredIngredients: string[];
  maxPrepTolerance: number | null;
  upfSensitivity: string;
  healthGoals: string[];
}
```

### Mapping logic

```typescript
const eaterRows = await db
  .select()
  .from(householdEaters)
  .where(eq(householdEaters.householdId, householdId))
  .orderBy(householdEaters.id);

const members: MemberProfile[] = [];
for (const row of eaterRows) {
  const eater = dbEaterToHouseholdEater(row);
  const profile = getEffectiveDietProfile(eater);  // applies weekly overrides if passed

  let prefs: UserPreferences | undefined;
  if (eater.userId != null) {
    [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, eater.userId));
  }

  members.push({
    userId: eater.userId ?? null,
    displayName: eater.displayName,
    dietTypes: profile.dietTypes,                               // from household_eaters.defaultDietTypes
    excludedIngredients: profile.hardRestrictions.map(r => r.toLowerCase()),  // from household_eaters.hardRestrictions
    preferredIngredients: prefs?.preferredIngredients ?? [],    // user account only, default []
    maxPrepTolerance: prefs?.maxPrepTolerance ?? null,          // user account only, default null
    upfSensitivity: prefs?.upfSensitivity ?? "moderate",        // user account only, default "moderate"
    healthGoals: prefs?.healthGoals ?? [],                       // user account only, default []
  });
}
```

### Field source mapping

| MemberProfile field | Source | Source field | Fallback for children |
|---------------------|--------|----------|----------------------|
| `userId` | household_eaters | `userId` (nullable) | `null` |
| `displayName` | household_eaters | `displayName` | n/a |
| `dietTypes` | household_eaters | `defaultDietTypes` via `getEffectiveDietProfile()` | `[]` |
| `excludedIngredients` | household_eaters | `hardRestrictions` via `getEffectiveDietProfile()` | `[]` |
| `preferredIngredients` | user_preferences | `preferredIngredients` | `[]` |
| `maxPrepTolerance` | user_preferences | `maxPrepTolerance` | `null` |
| `upfSensitivity` | user_preferences | `upfSensitivity` | `"moderate"` |
| `healthGoals` | user_preferences | `healthGoals` | `[]` |

### Behaviour difference vs current implementation

| Dimension | Current (household_members) | New (household_eaters) |
|-----------|---------------------------|----------------------|
| `dietTypes` source | `user_preferences.dietTypes` | `household_eaters.defaultDietTypes` |
| `excludedIngredients` source | `user_preferences.excludedIngredients` | `household_eaters.hardRestrictions` |
| Children included | No | Yes |
| Adults included | Yes | Yes |
| Weekly overrides | Not supported | Supported via `getEffectiveDietProfile(eater, override)` |

**Important:** For user-linked adult eaters, `dietTypes` now comes from `household_eaters.defaultDietTypes` rather than `user_preferences.dietTypes`. When `syncMembersAsEaters()` creates eater rows for adults, it inserts `defaultDietTypes: []`. This means adult eaters who haven't edited their household_eater profile will have empty `dietTypes`, reducing (not eliminating) diet conflicts in `scoreCompatibility()`. This is correct architectural behaviour — household eater profiles are intentionally separate from personal user preferences and must be configured explicitly.

---

## 3. Weekly Override Handling

### Mechanism

`plannerWeekEaterOverrides` stores per-week diet type overrides for household eaters. Access:
```typescript
// storage.ts:2808
async getWeekEaterOverrides(weekId: number): Promise<WeekEaterOverride[]>
```

Returns `Array<{ weekId, eaterId, dietTypes: string[] }>`. The `getEffectiveDietProfile(eater, override)` function accepts a `DietOverride` that replaces `defaultDietTypes` for that call.

### Where `weekId` would come from in Tier 4

Smart Planner generation happens at `POST /api/meal-plans/smart-suggest`. That route receives a request for a specific planning session. When Tier 4 is wired in, the call sequence would be approximately:

```
POST /api/meal-plans/smart-suggest (week context known from request or active planner week)
  → generateSmartSuggestion() fills slots
    → Tier 3 exhausted for a slot
      → Tier 4: matchMealsForHousehold(userId, weekId?) to find component shell
```

The `weekId` would be the planner week being generated. This context exists at call time but is not currently passed into `matchMealsForHousehold()`.

### Decision: Required now or deferred?

**Deferred. Implement as optional parameter.**

Rationale:
- Weekly overrides are a user-configurable preference, not a safety gate
- Hard restrictions (`hardRestrictions`) are always enforced regardless of overrides — the safety signal is correct without override support
- `getEffectiveDietProfile(eater)` with no override produces correct base behaviour
- The Tier 4 wiring route doesn't exist yet — `weekId` propagation is a future-wiring concern

**Recommended signature:**

```typescript
export async function matchMealsForHousehold(
  userId: number,
  weekId?: number,     // Optional — applies plannerWeekEaterOverrides when provided
): Promise<MealMatch[]>
```

With implementation:
```typescript
let overrideMap = new Map<number, { dietTypes: string[] }>();
if (weekId != null) {
  const overrides = await storage.getWeekEaterOverrides(weekId);
  overrideMap = new Map(overrides.map(o => [o.eaterId, { dietTypes: o.dietTypes }]));
}

// Then in the per-eater loop:
const profile = getEffectiveDietProfile(eater, overrideMap.get(Number(eater.id)));
```

**Note:** This approach adds only ~5 lines for optional weekId support. It costs nothing when `weekId` is not passed (empty Map, no override applied). Recommended to include in the initial implementation to avoid a second signature change later.

However, the current `matchMealsForHousehold()` directly uses `db` — not the `storage` singleton. To call `storage.getWeekEaterOverrides()`, either:
a) The function must import `storage`, or
b) Use `db` directly with the same Drizzle query as in `storage.getWeekEaterOverrides()`

The current file uses `db` directly (no `storage` import) — consistent with other lib files. Option b is the right choice: replicate the `db.select().from(plannerWeekEaterOverrides).where(...)` inline, or import `plannerWeekEaterOverrides` from schema.

---

## 4. Existing Call Sites

### `matchMealsForHousehold` — zero call sites

```
Searched: server/, client/ (all .ts, .tsx files)
Result: 0 callers. Export declaration only.
```

No route calls it. No test calls it. No service calls it.

### `scoreTemplate` — zero external call sites

```
Searched: server/, client/ (all .ts, .tsx files, excluding household-meal-matcher.ts)
Result: 0 external callers.
```

`scoreTemplate` is defined as a private (non-exported) function in `household-meal-matcher.ts`. It is only called from within `matchMealsForHousehold()` at line 220.

### `MealMatch` — zero external references

```
Searched: server/, client/ (all .ts, .tsx files, excluding household-meal-matcher.ts)
Result: 0 external references.
```

`MealMatch` is exported (line 50) but imported nowhere.

### `ScoreBreakdown` — zero external references

```
Searched: all .ts, .tsx files, excluding household-meal-matcher.ts
Result: 0 external references.
```

### `MemberChange` — zero external references

`MemberChange` is private (not exported). Zero exposure.

### `memberChanges` field — zero external readers

Since `MealMatch` is never used externally, `memberChanges` is never read. The nullable `userId` change is safe.

### Nullable `userId` impact

| Concern | Impact |
|---------|--------|
| Live code reading `memberChanges[n].userId` | None — function is dead code |
| TypeScript compilation | Contained to `household-meal-matcher.ts` — private interfaces |
| `MealMatch` exported type | `MemberChange.userId` becomes `number \| null` — future callers must null-guard |
| `buildExplanation()` (line 330) | Does not read `userId` — reads `memberChanges.length` and `swaps` only |
| `scoreSwapSimplicity()` (line 87) | Does not read `userId` — reads `memberChanges.length` and `swaps` only |
| `scorePreferenceConfidence()` (line 131) | Does not read `userId` — reads `dietTypes`, `excludedIngredients`, `healthGoals` |
| `scoreHealthAlignment()` (line 124) | Does not read `userId` — reads `upfSensitivity` |

**No internal function reads `userId` from a `MemberProfile` or `MemberChange` after construction.** The `userId` field is populated at line 182 (old) and read by nothing downstream in the file except being pushed to `memberChanges`. The change is safe within the file.

---

## 5. Testing Plan

Since `matchMealsForHousehold()` is dead code with no existing test coverage, the following tests should be written before any consumer (Tier 4 route) is added.

All tests should be temporary harnesses following the pattern of `test-household-eater.ts` — run-and-remove. They should NOT be added to `package.json` as permanent tests unless the function graduates to a permanent route.

### Test 1 — Lilly and Daisy inclusion (DB required)

**Purpose:** Prove that after migration, eater ids 3 and 4 appear in member list.

```
Input: userId=1 (household owner, household_id=44)
Expected:
- members array has 4 entries (users 1, 38, Lilly, Daisy)
- Lilly entry: userId=null, displayName="Lilly", dietTypes=["Vegetarian"],
  excludedIngredients has "Gluten-Free", "Eggs", "Dairy-Free", "Nuts", "Shellfish", "Soy"
- Daisy entry: userId=null, displayName="Daisy", dietTypes=["Mediterranean"],
  excludedIngredients has "Dairy-Free", "Eggs"
```

### Test 2 — Cooked Breakfast template scoring (DB required)

**Purpose:** Prove `scoreTemplate()` returns a non-null `MealMatch` with correct `sharedIngredients` and `memberChanges` for Lilly and Daisy.

```
Input: userId=1, template=id=633 (Cooked Breakfast)
Expected:
- Result is non-null
- sharedIngredients = [mushrooms, tomatoes, onions, avocado, asparagus]
- memberChanges for Lilly: swaps contains "remove eggs"
- memberChanges for Daisy: swaps contains "remove eggs"
- fitScore > 0
```

### Test 3 — Adult-only household (pure unit test)

**Purpose:** Prove backward compatibility — a household with only user-linked eaters (no children) still works correctly.

```
Synthetic input:
- Two HouseholdEaterRows: both with userId != null, no hardRestrictions, no defaultDietTypes
- Cooked Breakfast template
Expected:
- All members have no memberChanges (no exclusions)
- sharedIngredients = all 5 shared base components
- fitScore high
```

### Test 4 — Empty household_eaters fallback (pure unit test)

**Purpose:** Prove that zero eaters returns empty `MealMatch[]` without error.

```
Synthetic input:
- No household_eaters rows for householdId
Expected:
- matchMealsForHousehold returns []
- No error thrown
```

Note: `scoreTemplate()` with `members = []` returns a MealMatch with all scores at their maximum defaults. The empty array from `matchMealsForHousehold()` is only possible if `allSlotIngredients.length === 0` (line 245 null return). With an empty member list, `scorePreferenceConfidence()` returns 0 (line 133). The function would still return results — just with different scores.

### Test 5 — Null userId in `MemberChange` (pure unit test)

**Purpose:** Prove the type change doesn't panic at runtime.

```
Input: Lilly profile in memberChanges
Expected:
- memberChanges[n].userId === null (no runtime error)
- MealMatch serialises to JSON cleanly (null in JSON is valid)
```

### Test 6 — Weekly override (optional, only if weekId param is implemented)

**Purpose:** Prove override replaces `defaultDietTypes` without affecting `hardRestrictions`.

```
Synthetic input:
- Lilly eater with defaultDietTypes=["Vegetarian"] and hardRestrictions=["Eggs"]
- Weekly override for Lilly: dietTypes=["Mediterranean"]
Expected:
- profile.dietTypes = ["Mediterranean"] (override applied)
- profile.hardRestrictions = ["Eggs"] (override never touches hardRestrictions)
```

This test is largely covered by `test-household-eater.ts` — it tests `getEffectiveDietProfile()` directly. The Tier 4 test only needs to verify that `matchMealsForHousehold(userId, weekId)` correctly passes the override through.

---

## 6. Rollback Plan

The change is in one file only. Rollback is a `git revert` of `household-meal-matcher.ts`.

### Files affected by migration

| File | Change type | Rollback |
|------|------------|---------|
| `server/lib/household-meal-matcher.ts` | Modified | `git checkout HEAD -- server/lib/household-meal-matcher.ts` |

No other files are touched.

### Data cleanup required

**None.** The migration changes only how in-memory `MemberProfile` objects are constructed from DB rows. It reads from `household_eaters` instead of `household_members`. No data is written. No schema is changed. Rollback requires no data cleanup.

### Rollback safety

Because the function is dead code, rolling back has zero runtime impact. Even if a partial implementation is pushed and then reverted, no live path is affected.

---

## 7. Implementation Options

### Option A — Minimal migration (no weekly overrides)

**Scope:** Replace `household_members` query with `household_eaters` query. No `weekId` parameter.

**Files touched:** `server/lib/household-meal-matcher.ts` only.

**Changes:**
- Lines 1–10: 2 imports removed, 1 added, 1 new import line
- Line 16: `userId: number` → `userId: number | null`
- Line 35: `userId: number` → `userId: number | null`
- Lines 161–191: 31 lines replaced with ~23 lines

**Line count:** Net reduction of ~8 lines. ~35 lines touched total.

**Pros:**
- Smallest possible change surface
- Lilly and Daisy immediately included
- Consistent with Smart Planner and compliance gate
- No new dependencies or parameters

**Cons:**
- Weekly overrides not applied during Tier 4 scoring
- Second pass needed to add `weekId` when Tier 4 is wired
- Signature changes require coordination with the future Tier 4 caller

**Risk rating: LOW**

---

### Option B — Full migration (with optional weekId)

**Scope:** Same as Option A, plus optional `weekId` parameter, plus `plannerWeekEaterOverrides` query inside the function.

**Files touched:** `server/lib/household-meal-matcher.ts` only.

**Changes:**
- All changes from Option A
- Function signature: add `weekId?: number`
- Add `plannerWeekEaterOverrides` to schema import
- Add ~8 lines for override loading and Map construction
- Pass override into `getEffectiveDietProfile(eater, overrideMap.get(Number(eater.id)))`

**Line count:** ~43 lines touched. Net zero lines (additions balance removals).

**Pros:**
- Tier 4 wiring can pass `weekId` without a second function signature change
- Consistent with `adapt-for-household` route which applies weekly overrides
- Override mechanism adds ~8 lines only
- `weekId` is optional — calling without it produces identical result to Option A

**Cons:**
- Slightly larger change
- Imports `plannerWeekEaterOverrides` from schema (adds 1 import)
- Weekly override behaviour is not tested until Tier 4 is wired with a real `weekId`

**Risk rating: LOW** (no architectural risk — `weekId` is a no-op when not passed)

---

### Option C — Shared profile resolver

**Scope:** Extract a new function `resolveHouseholdMemberProfiles(householdId, weekId?)` into a shared helper (e.g. `server/lib/household-profile-resolver.ts`). Both `matchMealsForHousehold()` and any future Tier 4 route would call it.

**Files touched:**
- `server/lib/household-meal-matcher.ts` (modified)
- `server/lib/household-profile-resolver.ts` (new file, ~60 lines)

**Changes:**
- New file: exports `resolveHouseholdMemberProfiles()` returning `MemberProfile[]`
- `household-meal-matcher.ts`: calls the new helper instead of inline query
- Smart Planner route (routes.ts:4904): could eventually be refactored to use the same helper, but this is NOT required now

**Pros:**
- DRY — one profile resolution path
- Reusable by any future Tier 4 route
- Makes `household-meal-matcher.ts` smaller

**Cons:**
- Adds a new abstraction for a function currently called by nobody
- The Smart Planner route already has its own inline profile building (routes.ts:4904) — Option C doesn't help unless routes.ts is also refactored
- `MemberProfile` interface is currently private to `household-meal-matcher.ts` — making it shared would require exporting it
- Over-engineering for a first implementation — the shared helper should emerge from duplication, not anticipate it

**Risk rating: MEDIUM** (new abstraction, more files, more coordination for no immediate gain)

---

## Recommendation: Option B

Option B is the correct choice. The `weekId?` optional parameter costs ~8 additional lines, prevents a second signature change when Tier 4 is wired, and matches the architecture of the `adapt-for-household` route. Option A would require a PR two days later to add `weekId` when Tier 4 is connected. Option C adds an abstraction for a function that has no callers — premature.

**Recommended implementation:** Option B with the following exact scope:

| Change | Lines | Description |
|--------|-------|-------------|
| Remove imports | 1–10 | Drop `householdMembers`, `users`; add `householdEaters`, `plannerWeekEaterOverrides` |
| Add import | after line 9 | `import { dbEaterToHouseholdEater, getEffectiveDietProfile } from "@shared/household-eater.js"` |
| Type change | 16 | `userId: number` → `userId: number | null` (MemberProfile) |
| Type change | 35 | `userId: number` → `userId: number | null` (MemberChange) |
| Signature change | 158 | Add `weekId?: number` parameter |
| Query block | 161–191 | Remove 31 lines, replace with ~31 lines (eaters query + override map + member loop) |

**Total lines touched: ~40. Net delta: ~0 lines. One file only.**

---

## Implementation Size Estimate

The previous estimate of "around 40 lines" is confirmed accurate.

| Section | Old lines | New lines | Delta |
|---------|-----------|-----------|-------|
| Import block | 10 | 11 | +1 |
| MemberProfile.userId | 1 | 1 | 0 |
| MemberChange.userId | 1 | 1 | 0 |
| Function signature | 1 | 2 | +1 |
| Override map init | 0 | 5 | +5 |
| Eaters query | 0 | 5 | +5 |
| householdMembers query | 16 | 0 | -16 |
| members loop (household_members) | 15 | 0 | -15 |
| members loop (household_eaters) | 0 | 21 | +21 |
| **Total** | **44** | **46** | **+2** |

**Actual size: approximately 46 lines changed across the function, 44 lines of old code replaced or modified, 46 lines written. Net change: +2 lines in the file.**

The 40-line estimate was correct for the query block alone. Including imports, interface changes, and the override map, the full scope is ~46 lines modified.

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| `household_eaters.defaultDietTypes` is empty for adult users | Low | By design — adult eaters must configure their household profile separately. `scoreCompatibility()` treats empty dietTypes as no diet conflicts. |
| `syncMembersAsEaters()` hasn't run for all households | Low | Verify Lilly/Daisy rows exist before wiring Tier 4. If eaters table is empty, `matchMealsForHousehold()` returns `[]` silently. |
| `MemberChange.userId` becomes nullable | Low | No current callers. Future Tier 4 route must null-guard. Document at call site. |
| `userPreferences` not loaded for children | None | Intentional — children have no `user_preferences`. Defaults are correct. |
| `plannerWeekEaterOverrides` table empty | Low | No overrides set = no change in behaviour vs Option A. |
| Weekly override requires `weekId` from Tier 4 caller | Low | Deferred. Optional parameter, backward-compatible signature. |
| `db` used directly (not `storage`) | Low | Consistent with existing file pattern. All other lib files use `db` directly. |

---

## Stop Conditions

Do not proceed to implementation if:
1. A search finds an undiscovered call site for `matchMealsForHousehold()` that assumes `userId` is non-null in `MemberChange`
2. The `household_eaters` table is found to be empty for all households (run: `SELECT COUNT(*) FROM household_eaters`)
3. An architectural decision is made to merge `household_eaters.defaultDietTypes` with `user_preferences.dietTypes` for adult eaters — this would change the mapping logic and requires a separate decision

---

## Next Decision

**Approve Option B implementation of `matchMealsForHousehold()` migration.**

Scope: One file (`server/lib/household-meal-matcher.ts`), approximately 46 lines changed, no schema changes, no data changes, no route changes.

Post-implementation:
- Run Test 1 and Test 2 (DB-connected harness) to confirm Lilly and Daisy are included
- Remove test harness
- Wire Tier 4 planner recovery route as the next separate task

---

*Investigation complete. No code changed. No data written.*
