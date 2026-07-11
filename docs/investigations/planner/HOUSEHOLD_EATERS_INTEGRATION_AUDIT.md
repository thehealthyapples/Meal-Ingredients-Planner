HOUSEHOLD_EATERS_INTEGRATION_AUDIT: COMPLETE

---

**Rollback Identifier:** `investigation/household-eaters-integration-audit-20260608`
**Branch:** main
**Commit at investigation start:** `1e83f32`
**Date:** 2026-06-08
**Risk Level:** GREEN — Read-only. No data written. No code changed.

---

## ROOT FINDING

**`matchMealsForHousehold()` is the only system component still using `household_members` as its household profile source.**

Every other dietary enforcement path in the codebase — Smart Planner, planner-compliance gate, household meal adaptation — uses `household_eaters`. `matchMealsForHousehold()` is an architectural outlier written before the `household_eaters` table existed.

**Lilly and Daisy are excluded from `matchMealsForHousehold()` scoring. They are included in all other system paths.**

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Database Tables                                                         │
│                                                                         │
│  users                  household_members         household_eaters      │
│  ─────────────────       ──────────────────        ──────────────────── │
│  id                     id                        id                   │
│  username               household_id ─────────┐   household_id ──────┐ │
│  displayName            user_id → users.id    │   user_id → users.id │ │
│  dietPattern            role                  │   (NULL for children)│ │
│  dietRestrictions       status                │   displayName        │ │
│                         joinedAt              │   defaultDietTypes   │ │
│  user_preferences                             │   hardRestrictions   │ │
│  ─────────────────                            │                      │ │
│  userId → users.id                            │  plannerEntryEaters  │ │
│  dietTypes                                    │  ─────────────────── │ │
│  excludedIngredients                          │  entryId             │ │
│  healthGoals                                  │  householdEaterId ───┘ │
│  budgetLevel                                  │                        │
│  mealMode                                     │  plannerWeekEaterOverrides │
│  upfSensitivity                               │  ─────────────────────────│
│                                               │  weekId                   │
│  households                                   │  eaterId → householdEaters│
│  ─────────────────                            │  dietTypes (override)     │
│  id ──────────────────────────────────────────┘                        │
│  name                                                                   │
│  inviteCode                                                             │
│  createdByUserId                                                        │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │  getHouseholdForUser(userId)         │
                    │                                      │
                    │  Queries: household_members          │
                    │  Returns: householdId                │
                    │  Used by: ALL lookup paths           │
                    └────────────────┬────────────────────┘
                                     │
              ┌──────────────────────┴──────────────────────────┐
              │                                                  │
              ▼                                                  ▼
   ┌─────────────────────┐                         ┌──────────────────────┐
   │ household_members   │                         │ household_eaters     │
   │                     │                         │                      │
   │ Only user accounts  │                         │ ALL eaters:          │
   │ (userId NOT NULL)   │                         │ - account users      │
   │                     │                         │ - children (null uid)│
   │ Used by:            │                         │                      │
   │ matchMealsFor       │                         │ Used by:             │
   │ Household() ⚠       │                         │ Smart Planner ✓      │
   │                     │                         │ planner-compliance ✓ │
   │ Legacy model        │                         │ adapt-for-household ✓│
   │ (no dietTypes,      │                         │ uplift-ingredients ✓ │
   │ no hardRestrictions)│                         │ week-overrides ✓     │
   └─────────────────────┘                         └──────────────────────┘
```

---

## 1. Current Household Architecture

### `users`

| Property | Value |
|----------|-------|
| Purpose | User account with login credentials |
| Ownership | Platform-level — one row per registered user |
| Planner usage | Dietary pattern (`dietPattern`, `dietRestrictions`) seeded from onboarding; read by Smart Planner route directly from `req.user` |
| Dietary data | `dietPattern` (string e.g. "Mediterranean"), `dietRestrictions` (string[], hard-coded to user account) |
| Restrictions | Stored in `dietRestrictions` on the `users` row |
| Non-account members | No — requires an account |

### `households`

| Property | Value |
|----------|-------|
| Purpose | Named household entity. Provides a stable `householdId` that all other tables reference |
| Ownership | Created when user creates or joins a household |
| Planner usage | Container — all planner weeks have `household_id` |
| Dietary data | None |
| Restrictions | None |
| Non-account members | N/A — the household is a container, not an eater |

### `household_members`

| Property | Value |
|----------|-------|
| Purpose | Access control link: which user accounts belong to which household |
| Ownership | Managed through invite flow |
| Planner usage | `getHouseholdForUser()` uses this to resolve a user's `householdId` |
| Dietary data | None — this is a membership table, not a dietary profile table |
| Restrictions | None stored here — dietary data lives in `user_preferences` per userId |
| Non-account members | **No** — `userId NOT NULL REFERENCES users(id)` |

### `household_eaters`

| Property | Value |
|----------|-------|
| Purpose | Canonical list of ALL people who eat in a household — including children without accounts |
| Ownership | Created via `POST /api/household/eaters` or via `syncMembersAsEaters()` for user-linked members |
| Planner usage | Smart Planner (dietary merge), planner-compliance, adapt-for-household, uplift check |
| Dietary data | `defaultDietTypes` (soft, overridable per week), `hardRestrictions` (always enforced) |
| Restrictions | `hardRestrictions: text[]` — primary restriction store for non-account members |
| Non-account members | **Yes** — `userId` is nullable; children have `userId = null` |

### `user_preferences`

| Property | Value |
|----------|-------|
| Purpose | Extended dietary and UX preferences for user accounts |
| Ownership | One row per user account |
| Planner usage | Smart Planner (dietTypes, excludedIngredients, budgetLevel, mealMode, upfSensitivity) |
| Dietary data | `dietTypes`, `excludedIngredients`, `preferredIngredients`, `healthGoals`, `upfSensitivity` |
| Restrictions | `excludedIngredients` — user-level exclusions; household eater restrictions are separate |
| Non-account members | **No** — linked to userId |

### `getEffectiveDietProfile()`

| Property | Value |
|----------|-------|
| Purpose | Pure function: resolves the effective diet profile for one eater, applying any weekly override |
| Location | `shared/household-eater.ts:141` |
| Inputs | `HouseholdEater`, optional `DietOverride` |
| Outputs | `EffectiveDietProfile { dietTypes, hardRestrictions }` |
| Maturity | Tested (`server/tests/test-household-eater.ts`), used in production routes |
| Current usage | `routes.ts:8335` — adapt-for-household route; reads weekly overrides, applies them per eater |

---

## 2. Planner Profile Construction — Full Call Chain

### Smart Planner (`POST /api/meal-plans/smart-suggest`)

```
routes.ts:4797 — POST /api/meal-plans/smart-suggest
  │
  ├─ settings.dietPattern  ← req.user.dietPattern         (user account — via Passport)
  ├─ settings.dietRestrictions ← req.user.dietRestrictions (user account — via Passport)
  ├─ prefs ← storage.getUserPreferences(req.user.id)      (user_preferences table)
  │
  ├─ routes.ts:4904 — getHouseholdForUser(req.user.id)    (queries household_members)
  │    └─ returns householdId
  │
  ├─ routes.ts:4906 — storage.getHouseholdEaters(householdId) ← ✓ household_eaters
  │    └─ returns ALL eaters including children
  │
  ├─ for each eater:
  │    ├─ merges eater.hardRestrictions → hardRestrictedSet
  │    └─ merges eater.defaultDietTypes → mergedDietTypes
  │
  ├─ mergedPrefs = { ...prefs, excludedIngredients: merged, dietTypes: merged }
  └─ generateSmartSuggestion(userMeals, mergedPrefs, settings, ...)
```

**Lilly and Daisy included: YES** — `household_eaters` query returns all four eaters.

### Planner Compliance Gate (`resolvePlannerComplianceContext`)

```
planner-compliance.ts:69 — resolvePlannerComplianceContext(storage, userId)
  │
  ├─ storage.getUser(userId)        (users table — dietPattern, dietRestrictions)
  ├─ storage.getUserPreferences(userId) (user_preferences — excludedIngredients)
  │
  ├─ getHouseholdForUser(userId)    (queries household_members → householdId)
  │
  └─ storage.getHouseholdEaters(householdId) ← ✓ household_eaters
       └─ merges hardRestrictions into hardSet
```

**Lilly and Daisy included: YES**

### Household Meal Adaptation (`POST /api/planner/:entryId/adapt-for-household`)

```
routes.ts:8315
  │
  ├─ getHouseholdForUser(req.user.id)
  │
  ├─ storage.getHouseholdEaters(householdId) ← ✓ household_eaters
  ├─ storage.getWeekEaterOverrides(week.id)  ← plannerWeekEaterOverrides
  │
  ├─ for each eater:
  │    └─ getEffectiveDietProfile(eater, overrideMap.get(eater.id))
  │         → { dietTypes, hardRestrictions }
  │
  └─ builds AI prompt with full household profiles including Lilly and Daisy
```

**Lilly and Daisy included: YES**

### `matchMealsForHousehold()` — Component Meal Scoring

```
household-meal-matcher.ts:158
  │
  ├─ getHouseholdForUser(userId) → householdId
  │
  ├─ db.select()
  │    .from(householdMembers)               ← ⚠ household_members (NOT household_eaters)
  │    .innerJoin(users, ...)               ← requires userId NOT NULL
  │    .where(householdId AND status=active)
  │
  ├─ for each member:
  │    └─ db.select().from(userPreferences).where(userId=member.userId)
  │
  └─ scoreTemplate(template, members, settings, swapMap)
```

**Lilly and Daisy included: NO** — confirmed from code. The `innerJoin(users, eq(householdMembers.userId, users.id))` requires a real `userId`. Lilly and Daisy have `userId = null` in `household_eaters` and have no rows in `household_members` at all.

---

## 3. `matchMealsForHousehold()` Audit

### Why `household_members` was chosen

`matchMealsForHousehold()` was written at the time `household_eaters` did not exist or had not been populated. The `household_eaters` table was added in migration `2026-04-16_add_household_eaters_tables` (migrations/runner.ts:765). The meal matcher pre-dates or was written before this model was adopted.

**Evidence:**
- `household-meal-matcher.ts:1` imports `householdMembers, users, userPreferences` — no import of `householdEaters`
- The `MemberProfile` interface (`household-meal-matcher.ts:16`) requires `userId: number` (not nullable) — designed for user accounts only
- `MemberChange.userId: number` (`household-meal-matcher.ts:36`) — same assumption

### Would `matchMealsForHousehold()` ignore Lilly and Daisy?

**Yes. Proven from code.**

```typescript
// household-meal-matcher.ts:161–173
const memberRows = await db
  .select({
    member: householdMembers,
    user: { id: users.id, displayName: users.displayName, username: users.username },
  })
  .from(householdMembers)
  .innerJoin(users, eq(householdMembers.userId, users.id))  // ← INNER JOIN requires userId
  .where(
    and(
      eq(householdMembers.householdId, householdId),
      eq(householdMembers.status, "active")
    )
  );
```

- Lilly (eater_id=3, user_id=null): **no row in household_members** → not returned
- Daisy (eater_id=4, user_id=null): **no row in household_members** → not returned

Only users 1 and 38 (who are in `household_members`) would be returned. This means any call to `matchMealsForHousehold(userId=1)` would score templates against the two adult users only, completely missing the children.

### Does `household_eaters` supersede `household_members` for dietary profiling?

**Yes, for dietary purposes.** Evidence:

1. **`syncMembersAsEaters()`** (storage.ts:2709) — the platform auto-populates `household_eaters` rows for adult members on every `GET /api/household/eaters` call. All existing `household_members` users will eventually have a mirror row in `household_eaters`.

2. **Comment at routes.ts:8312:** *"Tailoring always evaluates the FULL household (adults + children)"* — the adapt-for-household route explicitly rejects `plannerEntryEaters` (operational attendance) and opts for `household_eaters` (the full dietary model).

3. **Smart Planner already uses `household_eaters`** (routes.ts:4906) — the production planner route is already migrated.

4. **`household_members` has no dietary fields** — it stores `role`, `status`, `joinedAt`. Dietary data for account-linked eaters comes from `user_preferences`, not from `household_members`.

---

## 4. `getEffectiveDietProfile()` Audit

**Location:** `shared/household-eater.ts:141`

**Purpose:** Resolve the active diet profile for one eater, accounting for weekly overrides.

**Inputs:**
- `member: HouseholdEater` — the runtime model built from a `household_eaters` DB row
- `override?: DietOverride` — a weekly override from `plannerWeekEaterOverrides` (optional)

**Outputs:**
- `EffectiveDietProfile { dietTypes: string[], hardRestrictions: string[] }`

**Logic:**
```typescript
return {
  dietTypes: override ? override.dietTypes : member.defaultDietTypes,
  hardRestrictions: member.hardRestrictions,  // never overridable
};
```

**Maturity:**
- Has a dedicated test file: `server/tests/test-household-eater.ts`
- Tests cover: default profile, override application, hard restriction preservation, empty overrides
- Used in production: routes.ts:8335 for household meal adaptation
- Pure function with no side effects

**Does this solve the Lilly/Daisy problem?**

**Yes, directly.** If `matchMealsForHousehold()` sourced members from `household_eaters` and mapped them through `dbEaterToHouseholdEater()` + `getEffectiveDietProfile()`, it would produce a `MemberProfile` for Lilly and Daisy with correct:
- `dietTypes: ["Vegetarian"]` / `["Mediterranean"]`
- `hardRestrictions: ["Gluten-Free", "Nuts", "Dairy-Free", "Eggs", "Shellfish", "Soy"]` / `["Dairy-Free", "Eggs"]`

For user-linked eaters (users 1 and 38), the current `user_preferences` fields still provide `budgetLevel`, `mealMode`, `upfSensitivity`, `maxPrepTolerance`, and `healthGoals` — fields not present in `household_eaters`. A merged approach reading `household_eaters` first and supplementing with `user_preferences` where `userId` exists would be complete.

---

## 5. Tier 4 Recovery Architecture — Profile Source Options

Tier 4 = component meal shell scoring when Tiers 1–3 return no candidates for a slot.

### Option A — `household_members`

**How:** Keep existing `matchMealsForHousehold()` unchanged.

**Advantages:**
- No code change required
- Direct access to `user_preferences` for full scoring dimensions (upfSensitivity, healthGoals, budgetLevel)

**Disadvantages:**
- Excludes Lilly and Daisy — the exact members the component architecture was designed to serve
- Inconsistent with every other dietary enforcement path
- `household_members` has no dietary fields — dietary data requires a separate join to `user_preferences`

**Compatibility with existing planner:** High (no change). But produces wrong results for households with non-account members.

**Verdict: REJECTED — misses the target population**

---

### Option B — `household_eaters`

**How:** Replace the `household_members` inner join in `matchMealsForHousehold()` with `storage.getHouseholdEaters(householdId)`. Map rows through `dbEaterToHouseholdEater()`. Apply `getEffectiveDietProfile()` per eater. For eaters with `userId != null`, additionally load `user_preferences` to fill `upfSensitivity`, `healthGoals`, and budget fields.

**Advantages:**
- Includes ALL household members — adults and children
- Consistent with Smart Planner, adapt-for-household, and planner-compliance
- `getEffectiveDietProfile()` already handles the weekly override model
- `dbEaterToHouseholdEater()` already handles the DB→runtime mapping
- Infrastructure already exists and is tested

**Disadvantages:**
- Requires a code change to `matchMealsForHousehold()` (approximately 25 lines)
- `MemberProfile` interface requires a nullable `userId` (currently `userId: number`)
- `MemberChange.userId` must also become nullable (can use `id: string | number`)
- For user-linked eaters, `user_preferences` still needs a second query for richer scoring dimensions (upfSensitivity etc.) — but these are non-critical for the dietary safety gate

**Compatibility with existing planner:** High — `scoreTemplate()` only reads `member.dietTypes`, `member.excludedIngredients`, `member.upfSensitivity`, `member.healthGoals`. The dietary fields come from `household_eaters`. Only the preference-quality fields need a supplemental `user_preferences` fetch.

**Verdict: RECOMMENDED**

---

### Option C — Merged profile model

**How:** Build a new resolver that merges data from both `household_eaters` (for all eaters) and `user_preferences` (for account-linked eaters) into a single normalised profile.

**Advantages:**
- Provides the most complete per-member profile
- Could deprecate `household_members` as a dietary source entirely

**Disadvantages:**
- More code than Option B
- The "merge" logic already exists in Option B — supplementing with `user_preferences` is sufficient
- Adds a new abstraction when Option B already covers the requirement

**Verdict: Unnecessary for Tier 4 — Option B covers it without a new layer**

---

### Option D — Another architecture

**How:** Use `plannerEntryEaters` to scope scoring to only the eaters attending a specific entry.

**Advantages:**
- More granular — scores only for the people actually eating this meal

**Disadvantages:**
- Tier 4 recovery runs at planner generation time, before any entry exists
- No entry to query at the time template scoring happens
- Would require two-pass architecture: generate plan → score templates → backfill entries

**Verdict: Wrong phase — not applicable to generation-time recovery**

---

## 6. Data Impact Analysis

If `matchMealsForHousehold()` is updated to source from `household_eaters`:

| System | Impact | Reason |
|--------|--------|--------|
| Smart Planner (meal candidate selection) | **None** | Already uses `household_eaters` at routes.ts:4906 |
| Planner compliance gate | **None** | Already uses `household_eaters` at planner-compliance.ts:82 |
| Household meal adaptation | **None** | Already uses `household_eaters` at routes.ts:8316 |
| Shopping | **None** | Shopping uses `plannerEntryEaters` (per-entry attendance), not the template scorer |
| Pantry | **None** | No dependency on `matchMealsForHousehold()` |
| Meal Templates (CRUD) | **None** | Template management routes don't call the meal matcher |
| Household management (add/remove members) | **Low** | syncMembersAsEaters already creates `household_eaters` rows for new members; no new sync needed |
| MealMatch output — `memberChanges.userId` | **Low** | Would become nullable for children. Any consumer reading `memberChanges[n].userId` to look up a user would need a null-guard |
| Future UI component meal display | **Low** | Would now receive Lilly and Daisy in `memberChanges` — this is the correct behaviour |

No shopping, pantry, or meal template data is affected. The change is scoped to how `matchMealsForHousehold()` constructs its member list.

---

## 7. Lilly / Daisy Inclusion Analysis

### Current state

| Path | Lilly included | Daisy included | Evidence |
|------|---------------|---------------|---------|
| Smart Planner generation | ✓ YES | ✓ YES | routes.ts:4906 — `getHouseholdEaters()` |
| Planner compliance gate | ✓ YES | ✓ YES | planner-compliance.ts:82 — `getHouseholdEaters()` |
| Adapt-for-household | ✓ YES | ✓ YES | routes.ts:8316 — `getHouseholdEaters()` |
| Uplift ingredient check | ✓ YES | ✓ YES | routes.ts:73 — `collectHouseholdHardRestrictions()` → `getHouseholdEaters()` |
| **matchMealsForHousehold()** | **✗ NO** | **✗ NO** | household-meal-matcher.ts:161 — `householdMembers` inner join |

### Why this matters for Tier 4

If Tier 4 recovery calls `matchMealsForHousehold()` without modification, it would:
- Score templates against users 1 and 38 only
- Not exclude eggs from any template (both adults have no egg restriction)
- Not enforce Lilly's Vegetarian or Gluten-Free restrictions
- Return template results that appear valid for the household but would serve Lilly and Daisy unsafe meals

This would be a silent correctness failure. No error is thrown — just wrong member profiles.

---

## 8. Architecture Verdict

**PASS WITH ISSUES**

The `household_eaters` architecture is complete, consistent, and the correct canonical source for dietary profiling. It handles non-account members, weekly overrides, and hard restrictions. It is already used correctly by all major dietary enforcement paths.

The issue is specific and isolated: `matchMealsForHousehold()` in `household-meal-matcher.ts` was not updated when the `household_eaters` model was introduced.

| Dimension | Verdict | Notes |
|-----------|---------|-------|
| Household architecture | PASS | Two-table design (members for access, eaters for dietary) is coherent |
| getEffectiveDietProfile maturity | PASS | Tested, pure, used in production |
| Smart Planner dietary source | PASS | Uses household_eaters correctly |
| Compliance gate dietary source | PASS | Uses household_eaters correctly |
| matchMealsForHousehold dietary source | FAIL | Uses household_members — misses Lilly and Daisy |
| Tier 4 profile source readiness | PASS WITH ISSUES | Correct source identified (household_eaters); migration needed |

---

## 9. Recommended Implementation Path

**Option B — household_eaters**

### Required changes (implementation only — not done here)

1. **`household-meal-matcher.ts`**
   - Remove: `householdMembers`, `users` imports and the inner-join query
   - Add: `householdEaters` import and `storage.getHouseholdEaters(householdId)` call
   - Add: `dbEaterToHouseholdEater()` to map DB rows to `HouseholdEater` runtime model
   - Add: `getEffectiveDietProfile()` call per eater (with weekly override support)
   - Modify: `MemberProfile.userId` → `userId: number | null`
   - Modify: `MemberChange.userId` → `userId: number | null` (or `id: string`)
   - Add: supplemental `user_preferences` fetch for user-linked eaters (upfSensitivity, healthGoals, maxPrepTolerance)

2. **`matchMealsForHousehold()` signature**: No change needed — still accepts `userId: number` to resolve `householdId` via `getHouseholdForUser()`.

3. **`scorePreferenceConfidence()`**: Would still work — it counts members with any data (dietTypes, excludedIngredients, healthGoals). Lilly and Daisy have dietTypes and excludedIngredients, so they count.

### Estimated change size

~40 lines changed in `household-meal-matcher.ts`. No schema changes. No data changes. No route changes.

### Prerequisite

Before implementation: add a `getWeekEaterOverrides(weekId)` call so per-week diet overrides (from `plannerWeekEaterOverrides`) are applied during Tier 4 scoring, consistent with the adapt-for-household route.

---

## Risks

| Risk | Severity | Note |
|------|----------|------|
| `household_eaters` rows may be missing for legacy households | Low | `syncMembersAsEaters()` runs on every `GET /api/household/eaters` call — any user who has viewed the eaters screen will have rows |
| `matchMealsForHousehold()` MemberChange.userId null handling | Low | Any caller reading `.userId` from a MemberChange must null-guard — audit call sites before releasing |
| `user_preferences` not loaded for non-account eaters | Low | Non-critical fields (upfSensitivity, healthGoals) default to "moderate" and [] — same as current behaviour for users with no prefs |
| Weekly overrides not applied if weekId is not passed | Medium | The adapted `matchMealsForHousehold()` would need the current `weekId` as an optional param to apply overrides — or apply only base profiles |
| compatibleDiets case mismatch (Issue 3 from prior audit) | Medium | Unchanged by this fix — adult user diet labels are still lowercase vs title-case in template |

## Stop Conditions

Do not proceed to implementation if:
- `syncMembersAsEaters()` is found to be broken (verify eaters exist for all tested households)
- The `plannerWeekEaterOverrides` table has no rows (verify overrides mechanism is active before wiring it into Tier 4)
- Any existing test suite that calls `matchMealsForHousehold()` directly would break on a null userId (audit first)

---

*Investigation complete. No code changed. No data written.*
