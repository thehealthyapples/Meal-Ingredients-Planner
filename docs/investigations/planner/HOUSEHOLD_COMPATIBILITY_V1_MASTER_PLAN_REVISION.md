# Household Compatibility V1 — Master Plan Revision

**Date:** 2026-06-12
**Branch:** main
**Rollback tag:** `pre-household-compatibility-v1-revision` (commit 43fbdda)
**Status:** Planning document only. No code changes. No database changes.
**Revises:** `docs/investigations/planner/HOUSEHOLD_COMPATIBILITY_V1_MASTER_PLAN.md`

---

## Rollback Identifier

```
Tag:    pre-household-compatibility-v1-revision
Commit: 43fbdda (checkpoint: pre-nutrition-boost-provenance rollback point)

To restore:
  git checkout pre-household-compatibility-v1-revision
```

---

## Design Decision

A design decision has been made after the original master plan was written:

> Adult dietary data is owned by the user profile and must not be duplicated into `household_eaters`.
> Adults are **profile-derived**. Children continue using `household_eaters` exclusively.

This decision supersedes the Phase 1 sync architecture described in Section 4 of the master plan.

**This document records:**
- What changes in the master plan as a result
- What remains unchanged
- The full revised architecture
- Implementation impact per phase
- Risks introduced and removed
- A recommendation

This document does not modify the original master plan. It is an addendum that replaces the relevant sections.

---

## What Changes

| Area | Original Plan | Revised Plan |
|------|--------------|--------------|
| Phase 1 purpose | Sync profile data into `household_eaters` | Derive adult dietary data from user profile at query time |
| Phase 1 writes | Writes to `household_eaters.defaultDietTypes` / `hardRestrictions` | No writes to `household_eaters` |
| Phase 1 backfill | One-time backfill of existing adult rows | No backfill required |
| Adult data source in engine | `household_eaters.defaultDietTypes` / `hardRestrictions` | `users.diet_pattern` / `users.diet_restrictions` |
| Profile save handler | Syncs to `household_eaters` on profile PUT | No change to profile PUT handler |
| `syncMembersAsEaters()` | Changed to read user profile on insert | Unchanged |
| Source of truth count | Two (profile + eater row copy) | One (profile only) |

## What Does Not Change

All other phases remain as specified in the master plan:

| Phase | Status |
|-------|--------|
| Phase 2 — Normal Meal Compatibility Adapter | Unchanged |
| Phase 3 — Compatibility Data Propagation | Unchanged |
| Phase 4 — Compatibility Review UI | Unchanged |
| Phase 5 — Restriction Resolver Integration | Unchanged |
| API surface (`householdFit` shape) | Unchanged |
| UX model (five-tier, fit strip, review sheet) | Unchanged |
| Success criteria | Unchanged |
| Risks table (Phases 2–5) | Unchanged |

---

## Q1 — Revised Architecture

### Full Architecture Diagram

```
══════════════════════════════════════════════════════════════
 DATA OWNERSHIP LAYER
══════════════════════════════════════════════════════════════

ADULT USER                              CHILD EATER
      │                                       │
      ▼                                       ▼
 users table                         household_eaters table
   diet_pattern                         defaultDietTypes  ←── set at creation
   diet_restrictions                    hardRestrictions  ←── set at creation / PATCH
      │                                 userId = NULL
 user_preferences table                        │
   diet_types (bridge copy)                    │
   excluded_ingredients                        │
      │                                        │
      │  [ownership stays here]                │  [ownership stays here]
      │  profile PUT handler writes here       │  POST/PATCH handlers write here
      │  NO copy to household_eaters           │  NO reference to users table
      │                                        │

══════════════════════════════════════════════════════════════
 READ / DERIVATION LAYER  (query-time, no writes)
══════════════════════════════════════════════════════════════

GET /api/household/eaters
      │
      ├── for each eater with userId IS NOT NULL (adult):
      │     derive defaultDietTypes  ← users.diet_pattern
      │     derive hardRestrictions  ← users.diet_restrictions
      │     [included in response, NOT persisted to DB]
      │
      └── for each eater with userId IS NULL (child):
            defaultDietTypes  ← household_eaters.defaultDietTypes
            hardRestrictions  ← household_eaters.hardRestrictions
            [stored values, returned as-is]

══════════════════════════════════════════════════════════════
 COMPATIBILITY ENGINE LAYER
══════════════════════════════════════════════════════════════

matchMealsForHousehold()
      │
      │  for each eater row:
      │
      ├── userId IS NOT NULL (adult)
      │     dietTypes         ← users.diet_pattern (via JOIN on userId)
      │     excludedIngredients ← users.diet_restrictions (via JOIN on userId)
      │     preferredIngredients ← user_preferences (existing join, unchanged)
      │     maxPrepTolerance  ← user_preferences (existing join, unchanged)
      │     upfSensitivity    ← user_preferences (existing join, unchanged)
      │     healthGoals        ← user_preferences (existing join, unchanged)
      │
      └── userId IS NULL (child)
            dietTypes         ← household_eaters.defaultDietTypes
            excludedIngredients ← household_eaters.hardRestrictions
            [no user_preferences join — userId is null]
      │
      ▼
scoreTemplate() / scoreMealCompatibility()  [Phase 2]
      │
      ├── Path A: template.compatibleDiets vs member.dietTypes
      ├── Path B: allSlotIngredients vs member.excludedIngredients
      │           [Phase 5: replaced by restriction resolver]
      └── OUTPUT: MealMatch
            memberChanges[]
            swapsNeeded[]
            fitScore
            explanation
            extraPrepMinutes
            scoreBreakdown
      │
      ▼
householdFit on ScoredCandidate / SmartCandidate  [Phase 3]
      │
      ▼
Compatibility Review UI  [Phase 4]
  Household Fit Strip: ● Colin  ● Daisy  ◐ Lilly
  "Fits 2 of 3 · 1 easy swap · Review →"
  Bottom sheet: per-eater adaptation details
```

### Data Source Summary (Revised)

| Eater Type | Diet Types Source | Hard Restrictions Source |
|------------|-----------------|--------------------------|
| Child (`userId` IS NULL) | `household_eaters.defaultDietTypes` | `household_eaters.hardRestrictions` |
| Adult (`userId` IS NOT NULL) — engine | `users.diet_pattern` (JOIN at query time) | `users.diet_restrictions` (JOIN at query time) |
| Adult (`userId` IS NOT NULL) — UI API response | Derived from `users.diet_pattern` at read time, returned in response | Derived from `users.diet_restrictions` at read time, returned in response |

`household_eaters.defaultDietTypes` and `household_eaters.hardRestrictions` remain empty for adult rows. They are not written to, read from, or backfilled for adults under this architecture.

---

## Q2 — Adult Ownership Model

### Authoritative Fields (adults)

| Field | Table | Role |
|-------|-------|------|
| `diet_pattern` | `users` | Primary diet category (e.g., "Mediterranean", "Vegan") |
| `diet_restrictions` | `users` | Hard restrictions array (e.g., ["Gluten-Free", "Dairy-Free"]) |
| `diet_types` | `user_preferences` | Bridge copy of `diet_pattern` in array form |
| `excluded_ingredients` | `user_preferences` | Explicit ingredient exclusions |

These fields are authoritative. They are written by `PUT /api/profile`. No other table is a source of truth for adult dietary data.

### Fields No Longer Used for Adults

| Field | Table | Status under revised plan |
|-------|-------|--------------------------|
| `defaultDietTypes` | `household_eaters` | Remains empty for adult rows. Not read for adults. Not backfilled. |
| `hardRestrictions` | `household_eaters` | Remains empty for adult rows. Not read for adults. Not backfilled. |

These fields retain their role for child eaters (`userId IS NULL`) and are unchanged for that use case.

### Mapping: Profile → Engine Member Context

When `matchMealsForHousehold()` assembles the member context for an adult eater:

```
users.diet_pattern         → member.dietTypes        (Path A diet filter)
users.diet_restrictions    → member.excludedIngredients  (Path B ingredient exclusion)
user_preferences fields    → member preferences        (unchanged — existing join)
plannerWeekEaterOverrides  → applied on top of above   (unchanged — see Q8)
```

The mapping from `diet_pattern` (single string) to `dietTypes` (array) is already established in `user_preferences.diet_types` (bridge copy). The engine can use either; reading `users.diet_pattern` directly and wrapping it as `[diet_pattern]` is equivalent for Path A filtering.

---

## Q3 — Household Eaters Read Model

### Options Evaluated

**Option A — Enrich API responses at read time**
`GET /api/household/eaters` returns adult eater rows with `defaultDietTypes` and `hardRestrictions` populated from the user's profile data. These values are computed in the route handler, not stored. The client receives a consistent shape for all eaters with no special-casing.

**Option B — Server-side merged context only (engine-only)**
Only `matchMealsForHousehold()` is updated to read from user profile for adults. `GET /api/household/eaters` continues to return empty arrays for adult `defaultDietTypes` / `hardRestrictions`. The UI does not display dietary chips for adults, and the planner's `allDietTypes` derivation continues to exclude adults.

**Option C — Client-side fallback**
The client checks `eater.userId === currentUser.id` and falls back to profile data from its own state. Creates special-case branching in every consumer of eater data.

### Recommendation: Option A

**Enrich `GET /api/household/eaters` at read time.**

Reasons:

1. **No client changes required.** The chip rendering in `HouseholdEatersSection`, the planner's `allDietTypes` computation, and any future consumers all read `eater.defaultDietTypes` and `eater.hardRestrictions`. If these fields are populated correctly in the API response, all consumers work without modification.

2. **Single enrichment point.** The route handler for `GET /api/household/eaters` is the one place where the derivation logic lives. No duplication across engine, UI, and planner.

3. **Option B leaves the UI broken.** Adult eaters would still show no dietary chips in the Household Eaters section, which is the visible symptom of the current data gap. Fixing only the engine without fixing the API response is a half-fix.

4. **Option C multiplies risk.** Every client consumer of eater data would need the fallback conditional. New consumers in V2 would need to learn and replicate it.

### Implementation of Option A

In `server/routes.ts` — `GET /api/household/eaters` handler:

After fetching eater rows and before returning the response, for any row where `userId IS NOT NULL`:

1. Fetch the linked user record (`users.diet_pattern`, `users.diet_restrictions`)
2. Populate `defaultDietTypes` as `[users.diet_pattern].filter(Boolean)` (or the `user_preferences.diet_types` array if available)
3. Populate `hardRestrictions` as `users.diet_restrictions ?? []`
4. Return the enriched value in the response — these are **not written back to the database**

This is a read-time derivation. The `household_eaters` table is not written to. If the user later updates their profile, the next call to `GET /api/household/eaters` returns fresh data automatically. No sync discipline required.

---

## Q4 — Impact on Phase 1 (Revised)

### Original Phase 1

> **Adult Eater Data Fix**
> Populate `household_eaters.defaultDietTypes` and `household_eaters.hardRestrictions` for adult eater rows from the user's profile data. Sync on profile save. One-time backfill for existing rows.

This is **replaced in full** by the revised Phase 1 below.

---

### Revised Phase 1 — Profile-Derived Adult Context

**Purpose:** Make adult dietary data available to the compatibility engine and the household eaters UI by deriving it from the user's profile at query time. No data is copied. No sync is required. The user profile remains the single source of truth for adult dietary preferences.

**What changes:**

1. `server/routes.ts` — `GET /api/household/eaters` handler:
   - After fetching eater rows, for rows with `userId IS NOT NULL`, fetch the linked user record and `user_preferences`.
   - Populate `defaultDietTypes` and `hardRestrictions` in the response from profile data.
   - Do NOT write these derived values back to `household_eaters`.

2. `server/lib/household-meal-matcher.ts` — member assembly loop (lines 159–239, referenced in investigation):
   - When `eater.userId IS NOT NULL`, extend the existing `user_preferences` JOIN to also select `users.diet_pattern` and `users.diet_restrictions`.
   - Use `users.diet_pattern` (mapped to array) as `dietTypes` instead of `household_eaters.defaultDietTypes`.
   - Use `users.diet_restrictions` as `excludedIngredients` instead of `household_eaters.hardRestrictions`.
   - The existing `user_preferences` join for preference/tolerance fields is unchanged.

**What does NOT change:**

- `syncMembersAsEaters()` in `server/storage.ts` — not modified. Adult eater rows continue to be inserted with empty `defaultDietTypes` and `hardRestrictions`. This is now correct by design, not a gap.
- `PUT /api/profile` handler — not modified. No sync to `household_eaters` on profile save.
- `household_eaters` schema — no change.
- No migration or backfill required.
- Child eater rows — unaffected. They continue using `household_eaters` fields exclusively.

**Files affected:**

| File | Change |
|------|--------|
| `server/routes.ts` | `GET /api/household/eaters` — enrich adult rows at read time |
| `server/lib/household-meal-matcher.ts` | Member assembly — read `users.diet_pattern` / `diet_restrictions` for adult eaters via extended JOIN |

**Risks:**

| Risk | Severity | Notes |
|------|----------|-------|
| Extra DB query per adult eater in `GET /api/household/eaters` | LOW | One additional SELECT per adult eater per call. Households typically have 1 adult user. Negligible at expected scale. |
| `matchMealsForHousehold()` already JOINs `user_preferences` for each adult eater | LOW | Extending this JOIN to also read `users` fields follows established pattern. No new join infrastructure needed. |
| `diet_pattern` is a single string; `dietTypes` expects an array | LOW | Wrap as `[diet_pattern].filter(Boolean)`. Vocabulary mapping is the same as the existing bridge in `user_preferences.diet_types`. |
| If a user has no `diet_pattern` set, `defaultDietTypes` returns `[]` | LOW | Same behaviour as current child rows with no diet set. Engine handles empty arrays correctly (Path A silently skips). |

**Dependencies:** None. Revised Phase 1 has no prerequisites. It is still the prerequisite for all subsequent phases (Phase 2–5 produce unreliable output for adults until this is in place).

---

## Q5 — Impact on Compatibility Engine

### How Adult Data Enters the Engine (Revised)

The three scoring functions are unchanged in signature and output contract. Only the data source for two fields changes for adult eaters.

#### `matchMealsForHousehold()`

Currently (broken state):
```
adult eater → household_eaters.defaultDietTypes = []   → member.dietTypes = []
adult eater → household_eaters.hardRestrictions = []   → member.excludedIngredients = []
```

After revised Phase 1:
```
adult eater → users.diet_pattern (JOIN)                → member.dietTypes = ["Mediterranean"]
adult eater → users.diet_restrictions (JOIN)           → member.excludedIngredients = ["Gluten-Free", "Dairy-Free"]
```

The existing `user_preferences` join for `preferredIngredients`, `maxPrepTolerance`, `upfSensitivity`, `healthGoals` is not changed.

#### `scoreTemplate()`

No change. Receives `members[]` from `matchMealsForHousehold()`. Those members now have correct `dietTypes` and `excludedIngredients` for adults. No internal change required.

#### `scoreMealCompatibility()` (Phase 2 — new function)

No change to design. Receives the same `members[]`. Correct adult data flows through automatically once the member assembly in `matchMealsForHousehold()` is fixed.

### No Duplication

Under the revised architecture, adult dietary data is read once per planning request from the profile tables and used directly. It is not stored in `household_eaters`, not cached in the engine, and not copied anywhere. The engine receives a `members[]` array assembled at query time from the correct authoritative sources. No duplication exists.

---

## Q6 — Impact on Household Eaters UI

### Current State (broken)

```
HouseholdEatersSection (profile-page.tsx ~line 1034)
  adult eater: eater.defaultDietTypes = []   → no chips rendered
  child eater: eater.defaultDietTypes = [..] → chips rendered
```

### After Revised Phase 1 (Option A — API enrichment)

```
GET /api/household/eaters
  adult eater row: server derives defaultDietTypes from users.diet_pattern
                                    hardRestrictions from users.diet_restrictions
                   response includes populated arrays

HouseholdEatersSection — unchanged
  adult eater: eater.defaultDietTypes = ["Mediterranean"]   → chips rendered
  adult eater: eater.hardRestrictions = ["Gluten-Free"]    → chips rendered
  child eater: unchanged
```

No special-case UI logic is required. The component reads the same fields from all eater objects. The server is responsible for ensuring those fields are populated correctly.

### Chips for Adults vs Children

Both adult and child eaters render chips through the same code path. The only distinction is the data source on the server side. From the UI's perspective, all eaters are equal.

This is the correct outcome. The UI should not need to distinguish adult from child eaters when rendering dietary information.

---

## Q7 — Impact on Smart Planner

### `resolvePlannerComplianceContext()` — Unchanged

This function already reads `users.diet_pattern` and `users.diet_restrictions` directly from the compliance gate. It is correct today and remains correct under the revised architecture. No change.

### Planner `allDietTypes` Derivation

Currently in `weekly-planner-page.tsx` line 309:
```typescript
const allDietTypes = householdEaters.flatMap((e) => e.defaultDietTypes);
```

This reads from the API response. After revised Phase 1 (Option A), adult eaters in the API response include `defaultDietTypes` derived from their profile. The planner derivation picks these up automatically. No change to the planner code.

### Candidate Generation — Adult Dietary Patterns and Restrictions

Under the revised architecture, `matchMealsForHousehold()` reads adult `dietTypes` and `excludedIngredients` from `users` at query time. The compatibility engine receives correct adult data when scoring candidates. Planner candidate generation obtains adult dietary constraints via the member assembly in `matchMealsForHousehold()` — same call, corrected data source.

No separate mechanism is needed to feed adult dietary data into candidate generation. The engine path already exists; the fix is upstream in member assembly.

---

## Q8 — Future Household Overrides (`plannerWeekEaterOverrides`)

### Compatibility Assessment: YES — fully compatible

`plannerWeekEaterOverrides` stores per-week dietary changes keyed on `eater_id` (the `household_eaters.id`). Adult eaters still have rows in `household_eaters` (with empty stored dietary fields). Override rows reference these `eater_id` values, which remain stable.

### How Overrides Apply Under Revised Architecture

In `matchMealsForHousehold()`, after the member context is assembled from the authoritative source:

```
For adult eater (userId IS NOT NULL):
  base.dietTypes         = users.diet_pattern      (from JOIN)
  base.excludedIngredients = users.diet_restrictions (from JOIN)

Then apply overrides:
  plannerWeekEaterOverrides (keyed on eater_id)
  → additionalExclusions, dietTypeOverrides, etc.
  → merged on top of base context
```

This is logically identical to the sync architecture, except the base layer is profile-derived rather than a stored copy. The override mechanism is indifferent to where the base data comes from. It operates additively on top of whatever base exists.

### V2 Accept Flow

The V2 "Accept for this week" flow writes accepted swaps to `plannerWeekEaterOverrides` (referenced as Option A in the master plan Section 10). This still works:

1. User accepts "beef mince → Quorn mince" for Lilly this week.
2. Server writes override row: `{ eaterId: Lilly.id, weekId: current, additionalExclusions: ["beef mince"], preferredSwaps: [...] }`.
3. Next planning cycle reads the override and applies it on top of Lilly's base context (profile-derived for adults, `household_eaters` fields for children).

No structural change to the override flow is required.

---

## Q9 — Architecture Comparison

### Option A — Profile → Sync → `household_eaters` (original plan)

```
WRITE PATH:
  users.diet_pattern / diet_restrictions
      │
      ▼ [on profile save + on syncMembersAsEaters]
  household_eaters.defaultDietTypes / hardRestrictions
      │
      ▼ [on matchMealsForHousehold / GET /api/household/eaters]
  compatibility engine / UI
```

| Dimension | Assessment |
|-----------|-----------|
| Simplicity (read path) | Simple — engine reads one table for all eaters |
| Simplicity (write path) | Complex — profile save must also update eater row; sync function must read profile at insert time |
| Maintenance | High — two locations must stay in sync; profile edits must not overwrite manual eater edits |
| Future drift risk | High — any code path that writes to `users` without also updating `household_eaters` silently creates stale data |
| Planner compatibility | Unaffected |
| Compatibility engine impact | None — engine reads `household_eaters` for all eaters |
| Backfill requirement | Yes — existing adult rows need a one-time update |
| Source of truth count | Two (profile + copy in `household_eaters`) |

### Option B — Profile-Derived Adults (revised plan)

```
READ PATH:
  users.diet_pattern / diet_restrictions
      │
      ▼ [at query time, via JOIN in matchMealsForHousehold / GET handler]
  compatibility engine / UI
  (household_eaters stores children; adult rows remain with empty fields)
```

| Dimension | Assessment |
|-----------|-----------|
| Simplicity (read path) | Slightly more complex — engine branches on userId to choose data source |
| Simplicity (write path) | Simple — profile save writes profile only; no secondary write |
| Maintenance | Low — only one location to update when adult dietary preferences change |
| Future drift risk | None — there is no copy to drift |
| Planner compatibility | Unaffected |
| Compatibility engine impact | Targeted change to member assembly loop in `matchMealsForHousehold()` |
| Backfill requirement | None |
| Source of truth count | One (profile) |

### Comparison Summary

| Criterion | Option A (sync) | Option B (profile-derived) |
|-----------|----------------|---------------------------|
| Simplicity | Simple reads, complex writes | Simple writes, reads slightly more complex |
| Maintenance | Dual-write discipline required permanently | None — single write path |
| Drift risk | Permanent (any missed sync creates stale data) | None |
| Planner compatibility | Equal | Equal |
| Engine impact | Minimal | Minimal (targeted member assembly change) |
| Backfill | Required | Not required |
| Sources of truth | Two | One |
| Override compatibility | Full | Full |

Option A is simpler to read but introduces permanent dual-write maintenance burden and drift risk. Option B requires a small increase in read-path complexity (a JOIN already performed for `user_preferences`) in exchange for eliminating drift risk entirely and removing the backfill requirement.

---

## Q10 — Final Recommendation

### STATUS A: Master plan should be updated to profile-derived adults.

**Evidence:**

1. **The sync architecture creates a maintenance contract the codebase cannot automatically enforce.** Every future code path that writes adult dietary data — new profile fields, preferences migrations, import flows — must also update `household_eaters`. There is no DB-level enforcement (foreign key constraint, trigger, or generated column) to guarantee this. Divergence is a permanent risk.

2. **The JOIN required for profile-derived adults already exists.** `matchMealsForHousehold()` already JOINs `user_preferences` via `userId` for adult eaters. Adding `users.diet_pattern` and `users.diet_restrictions` to the same JOIN is a minimal extension of an established pattern, not a new architectural dependency.

3. **No backfill is needed.** The sync plan required a backfill operation touching all existing adult eater rows. The profile-derived plan requires no data migration. This reduces delivery risk for Phase 1 and eliminates the possibility of a botched backfill corrupting existing data.

4. **The investigation confirmed the root cause is a missing sync path, not a missing data location.** The data exists in `users.diet_pattern` and `users.diet_restrictions` today. The problem is that the engine and UI do not read it. Profile-derivation solves this directly. Sync solves it indirectly (creates a copy the engine can read) at the cost of a permanent maintenance burden.

5. **`plannerWeekEaterOverrides` compatibility is unaffected.** Overrides apply additively on top of the base context regardless of whether the base is a stored copy or a profile-derived value. V2 accept flow is unaffected.

6. **The design decision has been made.** The revised approach aligns with the stated intent: adult dietary data remains owned by the user profile.

---

## Implementation Impact Summary

| Phase | Impact | Severity |
|-------|--------|----------|
| Phase 1 (data fix) | **Replaced.** Purpose, scope, files, and approach all change. See revised Phase 1 above. | HIGH (different implementation) |
| Phase 2 (normal meal adapter) | None. `scoreMealCompatibility()` receives correctly assembled `members[]`. | NONE |
| Phase 3 (propagation) | None. `householdFit` shape and attachment points unchanged. | NONE |
| Phase 4 (UI) | None. `HouseholdEatersSection` chip rendering unchanged; it reads the same fields. | NONE |
| Phase 5 (resolver) | None. The resolver integration is a detection-path change, not a data source change. | NONE |
| API surface | None. `householdFit` shape is unchanged. `GET /api/household/eaters` response shape is unchanged (same fields, correct values). | NONE |
| DB schema | None. No columns added, no columns removed, no migrations. | NONE |

---

## Risks Introduced

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Extra DB read per adult eater in `GET /api/household/eaters` | LOW | Households typically have one adult user account. The additional SELECT on `users` by primary key is effectively free. |
| `matchMealsForHousehold()` reads two tables for adult eaters vs one | LOW | Already performs a `user_preferences` JOIN. Extending to `users` is one additional column in the same query or a trivially cheap second lookup. |
| `users.diet_pattern` may be NULL if user never completed profile | LOW | Engine handles empty `dietTypes` arrays today (Path A silently skips). Same behaviour for NULL `diet_pattern` mapped to `[]`. No regression. |
| If `diet_pattern` and `diet_restrictions` are populated differently from `user_preferences.diet_types` / `excluded_ingredients`, the engine and compliance gate could use slightly different data | LOW-MEDIUM | `user_preferences.diet_types` is a bridge copy of `diet_pattern` (confirmed in investigation). Choose one canonical source and use it consistently. Recommendation: use `users.diet_pattern` and `users.diet_restrictions` as the authoritative source in the engine (matches the compliance gate). |

---

## Risks Removed

| Risk Removed | Notes |
|-------------|-------|
| Diet pattern divergence between `users` and `household_eaters` copy | Eliminated. There is no copy. |
| Profile save silently failing to sync eater row | Eliminated. No sync required on profile save. |
| Backfill operation corrupting existing adult rows | Eliminated. No backfill. |
| `syncMembersAsEaters()` creating stale eater rows with empty arrays | Eliminated. Empty arrays for adults are now correct by design — they are not used for adults. |
| Future code paths creating adult data outside the profile save handler | Eliminated. The engine reads from the profile table directly; any path that writes to the profile table is automatically picked up. |
| Dual-write discipline required for all future dietary preference additions | Eliminated. New preference fields added to `users` or `user_preferences` are available to the engine without a second write. |

---

## Overall Confidence Level

**HIGH**

The revised Phase 1 is simpler than the original Phase 1 in every dimension except the read path, where it adds a trivially cheap JOIN that follows an existing established pattern. The data already exists in the correct authoritative location today. The change is a redirection of reads, not an architectural invention. All other phases are unaffected. No schema changes, no migrations, no backfills, no new maintenance contracts. The design decision aligns the implementation with the data ownership model that already exists.

---

*Document ends. This revision replaces Section 4 — Phase 1 and Section 3 — Data Source Summary of the original master plan. All other sections of the original master plan remain as written.*
