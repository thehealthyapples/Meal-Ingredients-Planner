# Household Eaters — Adult Profile Data Source Investigation

**Date:** 2026-06-12
**Branch:** main
**Rollback tag:** `investigation/household-eaters-adult-profile-datasource-2026-06-12`
**Status:** Investigation only. No code changes made.

---

## Rollback Protection

```
Tag: investigation/household-eaters-adult-profile-datasource-2026-06-12
Commit: 43fbdda (checkpoint: pre-nutrition-boost-provenance rollback point)

To restore:
  GIT_CONFIG_NOSYSTEM=1 git checkout investigation/household-eaters-adult-profile-datasource-2026-06-12
```

---

## Background

A recent UI change replaced truncated text with compact chips in the Household Eaters section. Chips are rendered from:

- `household_eaters.defaultDietTypes`
- `household_eaters.hardRestrictions`

Adult users synced into `household_eaters` have empty arrays in both fields. Their dietary preferences appear to live in `users.diet_pattern` and `users.diet_restrictions`. Children show chips; adult users show only their display name with no visible planning restrictions.

---

## Files Inspected

| File | Purpose |
|------|---------|
| `shared/schema.ts` | Database table definitions — `users`, `user_preferences`, `household_eaters` |
| `shared/household-eater.ts` | `HouseholdEater` interface and `dbEaterToHouseholdEater` converter |
| `server/routes.ts` | Profile API (GET/PUT), Household Eaters API (GET/POST/PATCH) |
| `server/storage.ts` | `syncMembersAsEaters()` — the adult user auto-sync function |
| `server/lib/household-meal-matcher.ts` | `matchMealsForHousehold()` — primary meal matching logic |
| `server/lib/planner-compliance.ts` | `resolvePlannerComplianceContext()` — compliance gate logic |
| `client/src/pages/profile-page.tsx` | Profile save UI, `HouseholdEatersSection` display component |
| `client/src/pages/weekly-planner-page.tsx` | Weekly planner — reads `allDietTypes` from household eaters |

---

## Data Flow Diagram

```
ADULT USER SAVES PROFILE
        │
        ▼
  PUT /api/profile
        │
        ├──► users table
        │      diet_pattern        ← "Mediterranean", "Vegan", etc.
        │      diet_restrictions   ← ["Gluten-Free", "Dairy-Free"]
        │      eating_schedule
        │
        └──► user_preferences table
               diet_types          ← bridge copy of diet_pattern
               excluded_ingredients
               health_goals
               preferred_ingredients
               max_prep_tolerance
               upf_sensitivity

        NO WRITE to household_eaters
        ↕ (gap — no sync path exists)

HOUSEHOLD EATERS TABLE
        │
        ├── adult eater rows (userId populated)
        │      defaultDietTypes  = []  ← EMPTY (set by syncMembersAsEaters)
        │      hardRestrictions  = []  ← EMPTY (set by syncMembersAsEaters)
        │
        └── child eater rows (userId null)
               defaultDietTypes  = [populated by user at creation/edit]
               hardRestrictions  = [populated by user at creation/edit]

HOUSEHOLD EATERS UI (profile-page.tsx)
        │
        └── reads eater.defaultDietTypes + eater.hardRestrictions ONLY
               → adults: no chips rendered (arrays are empty)
               → children: chips rendered (arrays populated)
               NO fallback to users.diet_pattern

WEEKLY PLANNER (weekly-planner-page.tsx:309)
        │
        └── allDietTypes = householdEaters.flatMap(e => e.defaultDietTypes)
               → adults contribute nothing (empty arrays)

matchMealsForHousehold (household-meal-matcher.ts)
        │
        ├── household_eaters.defaultDietTypes  ← primary diet filter
        ├── household_eaters.hardRestrictions  ← hard exclusions
        ├── plannerWeekEaterOverrides           ← per-week overrides
        └── user_preferences.excludedIngredients (adult only, via userId join)
               NOTE: users.diet_pattern / users.diet_restrictions NOT read here

resolvePlannerComplianceContext (planner-compliance.ts)
        │
        ├── users.diet_pattern             ← read (compliance gate)
        ├── users.diet_restrictions        ← read (compliance gate)
        ├── user_preferences.excludedIngredients
        └── household_eaters.hardRestrictions (all eaters, unioned)
               NOTE: this gate is for Smart Meal Plan generation only
               NOT used for meal chip display or household eater rendering
```

---

## Question-by-Question Answers

### Q1 — Where are adult user dietary preferences stored?

**Two separate tables.**

#### `users` table — `shared/schema.ts` lines 23–25
```typescript
dietPattern: text("diet_pattern"),
dietRestrictions: text("diet_restrictions").array(),
eatingSchedule: text("eating_schedule"),
```

#### `user_preferences` table — `shared/schema.ts` lines 630–664
```typescript
dietTypes: text("diet_types").array().notNull().default([]),
excludedIngredients: text("excluded_ingredients").array().notNull().default([]),
healthGoals: text("health_goals").array().notNull().default([]),
```

#### Profile API (PUT) — `server/routes.ts` ~lines 936–1008
Accepts `dietPattern`, `dietRestrictions`, `eatingSchedule` and writes them to `users`. Also writes a bridge copy of `dietPattern` into `user_preferences.dietTypes`. Does **not** touch `household_eaters`.

#### Response shape (GET /api/profile)
```typescript
{
  dietPattern: user.dietPattern ?? null,
  dietRestrictions: user.dietRestrictions ?? [],
  eatingSchedule: user.eatingSchedule ?? null,
  preferences: prefs || {},   // includes diet_types, excluded_ingredients, etc.
}
```

---

### Q2 — Where are household eater dietary preferences stored?

**`household_eaters` table only.**

#### Schema — `shared/schema.ts` lines 1069–1079
```typescript
export const householdEaters = pgTable("household_eaters", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  displayName: text("display_name").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  defaultDietTypes: text("default_diet_types").array(),
  hardRestrictions: text("hard_restrictions").array(),
});
```

#### Create (POST) — `server/routes.ts` ~lines 7952–7969
Accepts: `displayName`, `defaultDietTypes`, `hardRestrictions`.

#### Edit (PATCH) — `server/routes.ts` ~lines 7972–7997
Accepts: `displayName`, `defaultDietTypes`, `hardRestrictions`.

#### Fetch (GET) — `server/routes.ts` ~lines 7936–7949
Returns array of `HouseholdEater` objects via `dbEaterToHouseholdEater`.

---

### Q3 — Are adult users represented in household_eaters?

**YES. But they are synced with empty dietary fields.**

#### `syncMembersAsEaters` — `server/storage.ts` lines 2710–2735
```typescript
await db.insert(householdEaters).values({
  householdId,
  displayName: m.displayName || m.username,
  userId: m.userId,
  defaultDietTypes: [],    // ← EMPTY on creation
  hardRestrictions: [],    // ← EMPTY on creation
});
```

This function is called on every `GET /api/household/eaters` request (`server/routes.ts` line 7941) to lazily sync any household members who do not yet have an eater row.

The `userId` field links the household eater row back to the `users` table. When `userId` is set, the UI renders the eater with `kind: "user"` (adult). When null, `kind: "child"`.

**Why defaultDietTypes/hardRestrictions are empty:** The sync function never reads `users.diet_pattern` or `users.diet_restrictions`. It inserts the row with empty arrays and leaves population to a manual edit flow — but the Household Eaters edit form for adult eaters does not pre-populate from the user's profile.

---

### Q4 — Does Smart Planner use user profile fields, household_eaters fields, merged data, or something else?

**Answer: C (merged data) — but only partially.**

#### `matchMealsForHousehold` — `server/lib/household-meal-matcher.ts` lines 159–239

For **diet types and hard restrictions**: reads exclusively from `household_eaters.defaultDietTypes` and `household_eaters.hardRestrictions`, modified by any `plannerWeekEaterOverrides`.

For **excluded ingredients / preferences** (adult eaters only): joins to `user_preferences` via `eater.userId`:
```typescript
if (eater.userId != null) {
  [prefs] = await db.select().from(userPreferences)
    .where(eq(userPreferences.userId, eater.userId));
}
members.push({
  dietTypes: profile.dietTypes,                          // from household_eaters
  excludedIngredients: profile.hardRestrictions.map(…), // from household_eaters
  preferredIngredients: prefs?.preferredIngredients ?? [], // from user_preferences
  maxPrepTolerance: prefs?.maxPrepTolerance ?? null,      // from user_preferences
  upfSensitivity: prefs?.upfSensitivity ?? "moderate",    // from user_preferences
  healthGoals: prefs?.healthGoals ?? [],                  // from user_preferences
});
```

`users.diet_pattern` and `users.diet_restrictions` are **not read** here. An adult with an empty `household_eaters` row contributes no diet type filtering to meal matching.

---

### Q5 — Does matchMealsForHousehold use user profile fields, household_eaters fields, merged data, or something else?

*(Covered under Q4 above.)*

**Diet type filtering:** `household_eaters` fields only.
**Preference/tolerance fields:** `user_preferences` fields (via userId join).
**`users.diet_pattern` / `users.diet_restrictions`:** NOT used.

The compliance gate (`resolvePlannerComplianceContext`, `server/lib/planner-compliance.ts`) does read `users.diet_pattern` and `users.diet_restrictions`, but this is invoked only during Smart Meal Plan generation to validate proposed meals — not during household eater chip rendering or `matchMealsForHousehold`.

---

### Q6 — Is there currently any sync path from user profile preferences into household_eaters?

**NO.**

- `PUT /api/profile` writes to `users` and `user_preferences` only. (`server/routes.ts` ~lines 941–994)
- `syncMembersAsEaters` inserts eater rows with empty dietary arrays. (`server/storage.ts` lines 2730–2731)
- No hook, trigger, or middleware exists that propagates `users.diet_pattern` → `household_eaters.defaultDietTypes` or `users.diet_restrictions` → `household_eaters.hardRestrictions`.

---

### Q7 — Is there currently any fallback display path from user profile preferences into Household Eaters UI?

**NO.**

#### `HouseholdEatersSection` — `client/src/pages/profile-page.tsx` ~lines 1034–1082

```typescript
{(eater.defaultDietTypes.length > 0 || eater.hardRestrictions.length > 0) && (
  <div className="flex flex-wrap gap-1 mt-1">
    {eater.defaultDietTypes.map(diet => (
      <span …>{diet}</span>
    ))}
    {eater.hardRestrictions.map(r => (
      <span …>{r}</span>
    ))}
  </div>
)}
```

Reads `eater.defaultDietTypes` and `eater.hardRestrictions` directly. No conditional fallback to `user.dietPattern` or `user.dietRestrictions`.

#### Weekly planner — `client/src/pages/weekly-planner-page.tsx` line 309

```typescript
const allDietTypes = householdEaters.flatMap((e) => e.defaultDietTypes);
```

Same: reads household eater fields only. No fallback.

---

## Final Verdict

**STATUS B**

> Adult preferences are stored only in user profile fields and are not synced into household_eaters.

Adult users are auto-created as household eater rows (via `syncMembersAsEaters`) with `defaultDietTypes: []` and `hardRestrictions: []`. Their dietary preferences exist in `users.diet_pattern`, `users.diet_restrictions`, and `user_preferences.diet_types` — but none of these are copied into `household_eaters` at any point. The Household Eaters UI and weekly planner read exclusively from `household_eaters` fields. No sync path and no fallback display path exist.

---

## Safest Next Implementation Option

**Populate adult household_eaters rows from user profile data at sync time, with a one-time backfill for existing rows.**

Specifically:
1. In `syncMembersAsEaters` (`server/storage.ts`), when inserting a new adult eater row, read `users.diet_pattern` and `users.diet_restrictions` and map them into `defaultDietTypes` and `hardRestrictions`.
2. Add a migration or on-demand backfill that updates existing adult eater rows that have empty `defaultDietTypes`/`hardRestrictions` but have profile preferences set.
3. On profile save (`PUT /api/profile`), update the corresponding `household_eaters` row (where `userId` matches) with the new diet values.

This approach:
- Does not change `matchMealsForHousehold` logic
- Does not change the compliance gate
- Does not change the UI rendering
- Makes the data source for adult chips consistent with children

---

## Risk Classification

**LOW–MEDIUM**

| Risk | Detail |
|------|--------|
| Data correctness | Mapping `diet_pattern` (single string) to `defaultDietTypes` (array) is straightforward but requires a confirmed vocabulary mapping |
| Divergence on edit | If a user later edits their household eater dietary fields independently of their profile, the two sources diverge (STATUS C) — the implementation must decide which wins on profile save |
| Backfill scope | Backfill touches all adult household eater rows; scoped to rows with `userId IS NOT NULL AND defaultDietTypes = '{}'`, which is safe to re-run |
| Regression surface | No change to meal matching or compliance gate logic; risk is limited to the sync insert path and the profile PUT handler |

The main decision point before implementation: **should the household eater dietary fields be a permanent independent copy, or a derived view from user profile?** Choosing "permanent copy" allows per-eater overrides but requires sync discipline. Choosing "derived view" simplifies the data model but removes the ability for a user to have different household eater settings from their profile.
