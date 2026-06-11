# NUTRITION_BOOST_ACCEPT_TRANSACTION_VERIFICATION

**Date:** 2026-06-11  
**Status:** INVESTIGATION COMPLETE — NO SCHEMA CHANGES APPLIED  
**Classification:** RED — Runtime Transaction Boundary Investigation  
**Rollback tag:** `pre-uplift-transaction-investigation-2026-06-11` (commit `80c5b75`)

---

## ROLLBACK POINT

Created before any work began:

```
git tag pre-uplift-transaction-investigation-2026-06-11 HEAD
```

To restore: `git checkout pre-uplift-transaction-investigation-2026-06-11`

Git status at tagging: 6 tracked files modified, investigation docs untracked. No migration applied. No schema changed. Dev write was limited to one test ingredient written then immediately reverted on meal 2221.

---

## TOP-LINE RESULTS

```
TRANSACTION RESULT:
PARTIAL SUCCESS

INGREDIENT PERSISTED DESPITE 500:
YES

FORK PERSISTED DESPITE 500:
YES (for system meals — see Section 6)

PLANNER ENTRY UPDATED DESPITE 500:
YES (for system meals with plannerEntryId — see Section 6)

ROOT CAUSE:
POST /api/uplift/accept performs two independent database operations
with no wrapping transaction:
  1. storage.updateMeal()              — UPDATE meals — commits immediately
  2. storage.createUpliftApplication() — INSERT meal_uplift_applications — fails (table missing)

Step 1 commits before Step 2 is attempted. Step 2 failure does not
roll back Step 1. There is no transaction boundary around both operations.

IMPACT OF MISSING TABLE:
Every POST /api/uplift/accept call silently writes the ingredient to
the meal, then returns HTTP 500. The user sees no UI confirmation.
The ingredient is permanently in the database with no provenance record.
The Remove button in the uplift panel will never appear for these ingredients.
The user's only evidence of success is a browser refresh showing the ingredient.

MIGRATION WOULD FIX:
- HTTP 500 on POST /api/uplift/accept
- HTTP 500 on GET /api/meals/:id/uplift-applications
- HTTP 500 on DELETE /api/uplift/applications/:id
- Missing provenance records for future accepted suggestions
- Missing "Added" UI label after acceptance (requires onSuccess to fire)
- Missing "Remove" button for future accepted suggestions

MIGRATION WOULD NOT FIX:
- Ingredients already silently persisted before the migration (they exist
  without provenance records — these are orphaned uplift ingredients)
- The Remove button for those already-accepted ingredients (no application
  row exists to delete)
```

---

## SECTION 1 — ROUTE OPERATION ORDER

**File:** `server/routes.ts:9835`

The full operation sequence of `POST /api/uplift/accept`:

```
┌─────────────────────────────────────────────────────────────────────┐
│  POST /api/uplift/accept                                            │
│  (single try/catch block — no DB transaction wrapper)              │
├─────────────────────────────────────────────────────────────────────┤
│  1. req.isAuthenticated()                    ← auth gate            │
│  2. Parse req.body: mealId, plannerEntryId,  ← input validation     │
│     suggestions                                                     │
│  3. storage.getMeal(mealId)                  ← READ (no write)      │
│  4. IF meal.isSystemMeal:                    ← system meal path     │
│       storage.createMeal(...)                ← WRITE — commits now  │  ← (A)
│       IF plannerEntryId:                                            │
│         storage.updatePlannerEntryMealId()   ← WRITE — commits now  │  ← (B)
│  5. mergeUpliftIngredients()                 ← pure function, no DB │
│  6. IF added.length > 0:                                            │
│       storage.updateMeal(meal.id, ...)       ← WRITE — commits now  │  ← (C)
│  7. FOR each suggestion:                                            │
│       storage.createUpliftApplication(...)   ← WRITE — FAILS HERE  │  ← (D)
│  8. return res.status(201).json(...)         ← never reached        │
├─────────────────────────────────────────────────────────────────────┤
│  catch(err):                                                        │
│    console.error('[Uplift] Accept error:', err)                     │
│    return res.status(500).json({ message: 'Failed to accept uplift'})│
└─────────────────────────────────────────────────────────────────────┘
```

**Critical finding:** Steps (A), (B), and (C) each auto-commit to the database as standalone Drizzle ORM queries. They are not wrapped in a `db.transaction()` block. Step (D) fails, but it is too late to undo the committed writes.

---

## SECTION 2 — TRANSACTION BOUNDARY ANALYSIS

### No transaction wrapper

`storage.updateMeal()` implementation (`server/storage.ts:449`):

```typescript
async updateMeal(id: number, data: ...) {
  const [meal] = await db.update(meals).set(data).where(eq(meals.id, id)).returning();
  return meal;
}
```

This is a raw `db.update()`. Drizzle auto-commits this immediately. There is no `db.transaction(tx => { ... })` wrapping the sequence.

`storage.createUpliftApplication()` implementation (`server/storage.ts:3554`):

```typescript
async createUpliftApplication(data: InsertMealUpliftApplication) {
  const [row] = await db.insert(mealUpliftApplications).values(data).returning();
  return row;
}
```

Also a standalone query. Also auto-committed. Also fails immediately because the table does not exist.

### Commit sequence when table is missing

```
storage.updateMeal()         → SQL: UPDATE meals SET ingredients=... WHERE id=?
                               PostgreSQL: OK, 1 row updated, AUTO-COMMITTED
storage.createUpliftApplication() → SQL: INSERT INTO meal_uplift_applications ...
                               PostgreSQL: ERROR 42P01 — relation does not exist
                               Exception thrown
                             → catch(err) in route handler fires
                             → res.status(500) sent
                             → updateMeal commit is NOT reversed (already committed)
```

**Partial success is structurally guaranteed** given the current route implementation.

---

## SECTION 3 — DEV RUNTIME TEST

### Test methodology

A TypeScript test script (`server/tests/test-uplift-transaction-boundary.ts`) was written and executed using `tsx`. It calls the same storage methods the route calls, in the same order, against the live dev database (meal 2221, user 38).

### Pre-test baseline (meal 2221)

```
Meal ID:    2221
Meal name:  Quick seafood linguine
Ingredient count: 9
Ingredients:
  [0] 1 tbsp olive oil
  [1] 1 onion chopped
  [2] 1 garlic clove chopped
  [3] 1 tsp paprika
  [4] 400g can chopped tomatoes
  [5] 1l chicken stock (from a cube is fine)
  [6] 300g linguine or spaghetti, roughly broken
  [7] 240g frozen seafood mix defrosted
  [8] handful of parsley leaves, chopped, and lemon wedges, to serve
```

Test ingredient `__UPLIFT_TX_BOUNDARY_TEST__` was NOT present.

### Test execution — full output

```
=== UPLIFT TRANSACTION BOUNDARY TEST ===

PRE-TEST:
  Meal ID:    2221
  Meal name:  Quick seafood linguine
  Ingredients (9): [baseline above]
  Test ingredient present: false

STEP 1: storage.updateMeal() — adding test ingredient (no transaction)
  Result: SUCCESS
  Ingredient count after update: 10
  Test ingredient appended: true

MID-TEST (after updateMeal, before createUpliftApplication):
  Test ingredient in DB: true

STEP 2: storage.createUpliftApplication() — INSERT into missing table
  Result: FAILED (expected)
  Error code:    42P01
  Error message: relation "meal_uplift_applications" does not exist

POST-FAILURE CHECK:
  Test ingredient PERSISTED despite step 2 failure: YES
  Ingredient count: 10

CLEANUP: Removing test ingredient
  Test ingredient still present after cleanup: false
  Ingredient count restored to: 9

=== VERDICT ===
TRANSACTION RESULT:       PARTIAL SUCCESS
INGREDIENT PERSISTED:     YES
STEP 2 ERROR:             relation "meal_uplift_applications" does not exist
PARTIAL SUCCESS PROVEN:   YES
```

### Post-test database verification

Confirmed via psql after test script completed:

```sql
SELECT id, array_length(ingredients, 1) AS ing_count FROM meals WHERE id = 2221;
-- Result: ing_count = 9 (baseline restored)
```

Test ingredient does not appear in the database. Cleanup successful.

### PostgreSQL error code

```
Code:    42P01
Message: relation "meal_uplift_applications" does not exist
Class:   42 (Syntax Error or Access Rule Violation)
```

This is the error that propagates through Drizzle ORM → `createUpliftApplication()` → `catch(err)` in the route handler.

---

## SECTION 4 — USER OBSERVATION EXPLAINED

**Observation:** After clicking "Add Nutrition Boost", no UI update is visible. After browser refresh, the ingredient appears in the meal.

**Cause:** Three separate failures, each contributing.

### Failure A — Server 500 silences onSuccess

The client code (`MealUpliftPanel.tsx:153`):

```typescript
const acceptMutation = useMutation({
  mutationFn: async (suggestion) => {
    const res = await apiRequest("POST", "/api/uplift/accept", { ... });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? "Failed to add to meal");  // ← thrown on 500
    }
    return res.json();
  },
  onSuccess: (data, suggestion) => {
    // ← NEVER CALLED on 500
    setJustAdded(...)              // → "Added" badge NOT set
    qc.invalidateQueries(["/api/meals"])  // → meals cache NOT refreshed
    qc.invalidateQueries([...uplift-applications...]) // → provenance NOT refreshed
    onUpliftAccepted?.(data.mealId)
  },
  // ← NO onError handler defined
});
```

When the server returns 500:
- `res.ok` is `false`
- `throw new Error(...)` fires
- React Query catches it; sets `acceptMutation.isError = true`
- `onSuccess` is never called
- **No toast, no error UI, no user feedback**
- **No query invalidation** → React cache stays stale
- The button returns to its default state silently

### Failure B — No error handler means silent failure

There is no `onError` callback in `acceptMutation`. The error is swallowed by React Query's internal error state, which the component never renders. The user sees the button return to its pre-click appearance with no feedback.

### Failure C — Provenance query also 500s

Even if the client tried to show the ingredient as accepted, `GET /api/meals/:id/uplift-applications` also returns 500 (table missing). So `activeApplications` is always empty — the "Added" badge and "Remove" link derive from this query, and both remain invisible.

### Why refresh shows the ingredient

A browser refresh causes `/api/meals` to be fetched fresh from the server. The ingredient was committed to the `meals` table in Step 1 before the 500. The fresh GET returns the meal with the ingredient already present. The React cache is cold after a refresh, so the stale pre-uplift data is gone.

**The ingredient is genuinely in the database.** The 500 does not indicate failure of the write — it indicates success of the write followed by failure of the provenance insert.

---

## SECTION 5 — SYSTEM MEAL FORK ANALYSIS

When the target meal is a **system meal** (`isSystemMeal = true`), the route executes additional writes before the ingredient update:

```
(A) storage.createMeal()              — creates fork, COMMITS
(B) storage.updatePlannerEntryMealId() — redirects planner entry to fork, COMMITS
(C) storage.updateMeal(fork.id, ...)  — adds ingredient to fork, COMMITS
(D) storage.createUpliftApplication() — FAILS (table missing)
```

All three committed writes (A), (B), (C) survive the Step (D) failure.

**For system meal uplifts:**

| Side effect | Persists despite 500? |
|---|---|
| Fork meal created in `meals` table | **YES** |
| Planner entry redirected to fork (`plannerEntries.mealId`) | **YES** (if `plannerEntryId` provided) |
| Ingredient added to the forked meal | **YES** |
| Provenance record in `meal_uplift_applications` | NO (table missing) |

This is more severe than the user-owned meal case. A ghost fork is created on every system meal uplift attempt — permanently orphaned, with no provenance, and with the planner entry pointing at it.

---

## SECTION 6 — ENDPOINT IMPACT SUMMARY

| Endpoint | HTTP result | DB side effect | Reversible? |
|---|---|---|---|
| `POST /api/uplift/accept` (user meal) | 500 | Ingredient written to meal | Not automatically — no remove button |
| `POST /api/uplift/accept` (system meal) | 500 | Fork created, planner redirected, ingredient added | Not automatically |
| `GET /api/meals/:id/uplift-applications` | 500 | None | N/A |
| `DELETE /api/uplift/applications/:id` | 500 | None | N/A |

---

## SECTION 7 — DATA WRITTEN DURING THIS INVESTIGATION

| Table | Operation | Data | Reverted? |
|---|---|---|---|
| `meals` (id=2221) | UPDATE ingredients (test ingredient appended) | `__UPLIFT_TX_BOUNDARY_TEST__` | YES — removed immediately after test |
| `meals` (id=2221) | UPDATE ingredients (restore) | Original 9 ingredients | N/A |

**No data was written to `meal_uplift_applications`** (table does not exist).  
**No migration was applied.**  
**No schema was changed.**

Post-test baseline confirmed: meal 2221 has 9 ingredients, test ingredient absent.

---

## DATA IMPACT DECLARATION

| Category | Status |
|---|---|
| Reads existing data | YES — read meal 2221 (user 38's Quick seafood linguine) |
| Writes existing data | YES — test ingredient written to meal 2221 and immediately reverted |
| Changes meaning of existing data | NO |
| Requires backfill | NO (for this investigation) |
| Schema changes | NO |
| Migration executed | NO |

---

## FACTS / ASSUMPTIONS / RECOMMENDATIONS

### FACTS (all proven by code read + runtime test)

1. `POST /api/uplift/accept` has no DB transaction wrapping `updateMeal()` and `createUpliftApplication()`. (Code: routes.ts:9835–9934; storage.ts:449, 3554)

2. `storage.updateMeal()` is a standalone `db.update()` that auto-commits immediately. (storage.ts:450)

3. `storage.createUpliftApplication()` throws `Error: relation "meal_uplift_applications" does not exist` (PostgreSQL error code 42P01). (Runtime test; previous investigation)

4. When Step (D) fails, Step (C) does not roll back. The ingredient is permanently in the database. (Runtime test: ingredient persisted after step 2 failure, count went 9→10)

5. The mutation has no `onError` handler. (MealUpliftPanel.tsx: grep for "onError" returns 0 results)

6. `onSuccess` is never called on 500. (Code: the `throw` in mutationFn prevents onSuccess from firing)

7. No query invalidation fires on 500 — the meals cache is not refreshed until a browser reload. (MealUpliftPanel.tsx:259)

8. `GET /api/meals/:id/uplift-applications` returns 500 (same root cause — table missing). Confirmed in prior investigation.

9. Meal 2221 was restored to baseline 9 ingredients after the test. (Post-test psql query: ing_count=9)

### ASSUMPTIONS

1. Production behaviour is identical to dev. Same code, same missing table, same structural absence of transaction. (Not tested on production — not authorised.)

2. Every previous "Add Nutrition Boost" action by any user has silently persisted the ingredient while returning 500. The scale of this is unknown — no count is possible without the table.

### RECOMMENDATIONS

_(Suggestions only — no implementation authorised.)_

**Priority 1 — Apply the migration.**  
The migration plan in `MEAL_UPLIFT_APPLICATIONS_MIGRATION_VALIDATION.md` is the prerequisite fix. Until the table exists, all three uplift persistence endpoints remain broken.

**Priority 2 — Wrap the route in a DB transaction.**  
After the migration, consider wrapping the meal update and provenance insert in `db.transaction()` so that a future provenance insert failure rolls back the ingredient update. This prevents a new class of partial success if any future error occurs inside the provenance loop.

**Priority 3 — Add an onError handler to acceptMutation.**  
Currently, 500s are silent. A toast error ("Failed to add ingredient — please try again") would have surfaced this failure immediately.

**Priority 4 — Audit orphaned ingredients (post-migration).**  
Any ingredient added via uplift before the migration has no provenance record. These cannot be removed via the "Remove" button in the uplift panel. A one-time audit query can identify meals with uplift-pattern ingredients that have no corresponding application row — but this is a data cleanup task, not a migration prerequisite.

---

## INVESTIGATION ARTEFACTS

| Artefact | Location | Purpose |
|---|---|---|
| Test script | `server/tests/test-uplift-transaction-boundary.ts` | Runtime proof of partial persistence |
| Prior investigation | `docs/investigations/MEAL_UPLIFT_APPLICATIONS_MIGRATION_VALIDATION.md` | Table absence proof, migration plan |
| Rollback tag | `pre-uplift-transaction-investigation-2026-06-11` | Restore point |
