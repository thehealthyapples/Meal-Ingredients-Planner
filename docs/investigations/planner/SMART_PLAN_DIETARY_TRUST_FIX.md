SMART PLAN DIETARY TRUST FIX IMPLEMENTED: YES

---

## Rollback Points

| Point | Tag / Commit |
|---|---|
| Before implementation begins | `rollback/before-dietary-trust-fix` |
| After Step 1 (session invalidation) + Step 2 (ingredient gate) | `rollback/after-dietary-trust-steps-1-2` |
| After Step 3 (tests added) | `rollback/after-dietary-trust-fix` |

---

## Files Changed

| File | Change |
|---|---|
| `client/src/hooks/use-smart-suggest.ts` | Session version constant and rejection logic |
| `server/lib/smart-suggest-service.ts` | User meal ingredient gate for restricted profiles |
| `server/tests/test-dietary-trust-fix.ts` | 26 regression tests (new file) |

---

## Step 1 — Session Storage Version Fix

**Commit:** `9f5070d`

**What was done:**

- Added `SMART_SESSION_VERSION = 2` constant to `client/src/hooks/use-smart-suggest.ts`.
- `saveSmartSession` now always writes `version: 2` into the stored object.
- `loadSmartSession` now rejects and clears (via `sessionStorage.removeItem`) any session that:
  - Has no `version` field (pre-fix sessions)
  - Has `version < 2` (any future downgrade scenario)
  - Has malformed or missing `smartResult.entries` array
  - Throws on parse (corrupted data)
- On rejection the hook returns `null` — no stale plan is silently restored.

**Key logic (simplified):**

```ts
const SMART_SESSION_VERSION = 2;

// on load:
if (!data.version || data.version < SMART_SESSION_VERSION) {
  sessionStorage.removeItem(SMART_SESSION_KEY);
  return null;
}
if (!Array.isArray(data.smartResult?.entries)) {
  sessionStorage.removeItem(SMART_SESSION_KEY);
  return null;
}
```

---

## Step 2 — User Meal Ingredient Gate

**Commit:** `9f5070d`

**What was done:**

- Added a `profileRestricted` check in the user-meal candidate loop in `server/lib/smart-suggest-service.ts`.
- A profile is considered restricted if **any** of the following is true:
  - `dietPattern` is set and non-empty
  - `dietRestrictions` has one or more values
  - `hardExcluded` (household hard restrictions) has one or more values
- If the profile is restricted and `meal.ingredients.length === 0`, the meal is excluded and a debug log is emitted.
- Unrestricted profiles (no pattern, no restrictions, no hard exclusions) are completely unaffected — existing behaviour preserved.
- This mirrors the external-candidate ingredient gate added in commit `0644578`.

**Key logic (simplified):**

```ts
const profileRestricted =
  (dietPattern !== null && dietPattern !== "") ||
  dietRestrictions.length > 0 ||
  hardExcluded.length > 0;

if (profileRestricted && meal.ingredients.length === 0) {
  console.debug(`[SmartSuggest] Excluded user meal (no ingredients, restricted profile): "${meal.name}"`);
  continue;
}
```

---

## Step 3 — Tests Added

**Commit:** `c84a7a9`
**File:** `server/tests/test-dietary-trust-fix.ts`
**Total:** 26 tests, 0 failures

Tests cover the following scenarios required by the specification:

| # | Scenario | Result |
|---|---|---|
| 1 | Session with no version field is rejected and cleared | PASS |
| 2 | Session with version 1 is rejected and cleared | PASS |
| 3 | Session with version 2 is accepted | PASS |
| 4 | Malformed session (missing entries) is rejected and cleared | PASS |
| 5 | Vegan profile excludes user meal with `ingredients = []` | PASS |
| 6 | Vegan profile excludes user meal with chicken ingredients | PASS |
| 7 | Vegan profile allows user meal with clearly vegan ingredients | PASS |
| 8 | Vegetarian profile excludes user meal with `ingredients = []` | PASS |
| 9 | Vegetarian profile excludes user meal with fish/meat ingredients | PASS |
| 10 | Unrestricted profile preserves existing behaviour for ingredient-less meals | PASS |
| 11 | External ingredient verification gate still works | PASS |
| 12 | Smart Plan returns usable suggestions for Vegan and Vegetarian profiles | PASS (via existing test suite) |

---

## Build Result

```
✓ Client built in 10.10s
✓ Server built (dist/index.cjs 2.5mb)
```

No errors. Chunk size warning pre-existed and is unrelated to this fix.

---

## TypeScript Result

```
npx tsc --noEmit  →  (no output — 0 errors)
```

---

## Test Result

All 26 tests in `test-dietary-trust-fix.ts` passed (0 failed).

The existing planner compliance gate tests (25 tests) also continue to pass.

---

## Manual Verification Result

Manual verification was not performed as part of this session — the previous session timed out before this step. The fix is covered by automated regression tests. Manual verification steps are documented in the specification above under STEP 4 and remain an open item for the next session or developer review.

---

## Remaining Limitations

1. **Manual verification pending** — A real Smart Plan generation with Profile = Vegan / Vegetarian has not been manually observed in this session. Tests cover the logic; a browser run should confirm the end-to-end experience.

2. **Ingredient-less user meals still exist in the database** — They are now gated out of restricted-profile Smart Plans, but the underlying data is not cleaned up. Users on unrestricted profiles may still receive suggestions for them. This was explicitly out of scope.

3. **External recipes with failed enrichment may have `ingredients = []`** — These are already gated by the external-candidate check (commit `0644578`). The user meal gate in Step 2 is a parallel, independent check for user-owned meals.

4. **Session version 2 is specific to this tab session** — If a user has the app open in two tabs, the second tab will write version 2 on its first Smart Plan run. The first tab, if still showing a stale plan, will have it cleared on next load. No cross-tab race condition affects stored planner data.

5. **Future Smart Plan shape changes must increment `SMART_SESSION_VERSION`** — This is a convention, not enforced by code. Documented in the constant comment in `use-smart-suggest.ts`.

---

## Confirmation

Project report file created: `SMART_PLAN_DIETARY_TRUST_FIX.md` (this file).

---

## What Must Not Break — Status

| Area | Status |
|---|---|
| Smart Plan generation | Not broken — gate only excludes ingredient-less meals for restricted profiles |
| Planner apply | Not affected — no changes to apply path |
| Manual meal add | Not affected — no changes to manual add path |
| Cookbook | Not affected |
| My Meals | Not affected |
| External recipe enrichment | Not affected — gate was already in place (commit `0644578`) |
| Template compliance gate | Not affected |
| Non-restricted users | Explicitly preserved — `profileRestricted` guard is false when no restrictions set |
