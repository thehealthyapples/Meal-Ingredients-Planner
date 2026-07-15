# RM4 — Planner Ready Meal Library

**Type:** Implementation (extends the RM2A journey with reuse). Per
`docs/architecture/README.md`, investigations *discover*; implementations *build and
maintain*. This document records what was built, how it was verified, and what remains.

**Date:** 2026-07-15
**Session ID:** `RM4_Planner_Ready_Meal_Library`
**Rollback:** `rollback/RM4-planner-ready-meal-library-20260715` → `da368a39`
**Governing basis:** `docs/investigations/platform/RM1_CANONICAL_READY_MEAL_ROLE.md`
(one identity §2, planner stores `mealId` §4c);
`docs/implementation/platform/RM2A_ANALYSER_TO_PLANNER_JOURNEY.md` (barcode-idempotent
identity, "Add to Planner" journey); `ARCHITECTURE_PRINCIPLES.md` Principle 1 (one
identity), Principle 2 (one owner per fact), Principle 4 (facts resolve at read time).
**Status:** Complete.

---

## 1. Mission

Allow users to quickly find and reuse ready meals they have previously added from the
Analyser: a **"Previously Added Ready Meals"** section within the Planner showing only
the current member's own ready meals, reusing the existing canonical `meals` identity,
with **one-tap Add to Planner** that preserves the week · day · meal-slot selection,
ordered **most recently planned, then most frequently used**, displaying the existing
product information (name, brand, image, Apple Score where available).

Explicitly out of scope, and untouched: no new library entity, no duplicated product
data, no Planner or Cookbook redesign, no change to shopping resolution, no change to
canonical ownership.

---

## 2. What existed (and what was missing)

RM2A made the Analyser → Planner journey work and made product identity idempotent by
barcode. What it did not give the household is **reuse**: to plan the same lasagne next
week, the user had to re-search the Analyser (or scroll the full picker list, where
their own products sit mixed among ~300 generic system ready meals with no history
ordering). The user's previously added ready meals — already canonical `meals` rows —
were *stored* but not *discoverable as theirs*.

The missing piece was therefore **one read-only view + one section in the existing
picker**, not an entity: the identities, the planner history, and the analysis history
all already existed in their canonical owners.

---

## 3. Implementation

### 3.1 A read-only library view over existing owners (the core)

**`server/storage.ts` — new `getReadyMealLibrary(userId)`** (+ the exported
`ReadyMealLibraryItem` type). Three reads over three existing owners, composed at read
time (Principle 4), **duplicating nothing**:

| Fact | Owner it is read from |
|---|---|
| The ready-meal identities (name, brand, image, barcode) | the member's own `meals` rows (`userId = member`, `isReadyMeal = true`) — Domain 12 |
| Planning recency / frequency | the household's `planner_entries` (joined through `planner_days` → `planner_weeks` and filtered to the member's `householdId`) — Domain 14 |
| Apple Score, where the member analysed the product | the member's own `product_history` row, joined by `barcode` |

Ordering: **most recently planned first** (`max(planner_entries.id)` — the table
carries no timestamp, so the serial entry id is the recency proxy), **then most
frequently used** (`count(*)`), then newest identity. Never-planned ready meals appear
after planned ones, newest first, so a just-saved product is immediately findable.

Where no Apple Score exists, `appleScore` is `null` and the UI renders **no score** —
an honest gap, never a fabricated one (Experience Principle 6). Another member's
analysis of the same barcode never leaks in (the join is scoped to the member's own
history, matching RM2A's per-member identity scope).

### 3.2 One route

**`server/routes.ts` — `GET /api/planner/ready-meal-library`** (authenticated,
read-only, fails closed with 401). A thin wrapper over the storage method; it writes
nothing.

### 3.3 The Planner section

**`client/src/components/PlannerMealPickerPanel.tsx`** — a **"Previously Added Ready
Meals"** section inside the existing picker panel, shown while the **Packaged** source
chip is active and no search query is narrowing the list (search already surfaces these
meals through the main list). Each row shows the existing product information — image
(or the ready-meal placeholder), name, brand (when not already part of the name), a
"Ready Meal" badge, "Planned N times", and the `AppleRating` mark where a score exists.

**One-tap Add to Planner:** tapping a row calls the picker's existing `onSelect(mealId)`
— the *identical* path every other picker row uses — which creates a normal
`planner_entries` row in the currently selected week · day · meal-slot (`pickerTarget`
is untouched, so the selection is preserved exactly). Rows are also draggable via the
existing `DraggableSearchResultRow`, like every other picker result. Rows respect the
target's audience and drink filters, mirroring the main list's rules.

Rows use the design-system `Button` (RM4 adds **zero** raw `<button>` elements and two
new adopters: `Button` and `AppleRating` gain an importer each).

### 3.4 Ordering stays live

- `client/src/hooks/use-planner-operations.ts` — `addEntryMutation` now also
  invalidates the library query on settle, so recency reorders after every add.
- `client/src/hooks/use-meals.ts` — `invalidateMealLibrary` now also invalidates the
  library query, so a product newly saved from any Analyser surface appears immediately.

### 3.5 What was deliberately *not* changed

No new table, entity, or key space — the "library" is a *view*, not a store. No schema
change of any kind. `planner_entries` unchanged (still `mealId`-referencing — RM1
option c). Planner and Cookbook structure untouched; the section lives inside the
existing picker panel. Shopping resolution untouched (a planned ready meal still emits
one `unit:'pack'` line; the barcode still rides along as the preferred-match hint).
Canonical ownership untouched — every fact is read from its existing owner at read time.
The ~300 generic system ready meals (`userId=0`) are excluded by definition (the library
is *the member's own* previously added ready meals) and are otherwise untouched.

---

## 4. The user journey, end to end

1. Open the Planner, pick a slot (week · day · meal type — the existing picker target).
2. Activate the **Packaged** source chip.
3. **Previously Added Ready Meals** lists the member's own ready meals, most recently
   planned first, with name, brand, image and Apple Score where available.
4. **One tap** places the meal into the selected slot — a normal `planner_entries` row
   against the same canonical `mealId` (no new identity, ever).
5. Nutrition, Apple Score, dietary safety and shopping resolve from the one identity,
   unchanged.

---

## 5. Verification

**Automated — `server/tests/test-rm4-planner-ready-meal-library.ts`** (new; wired into
the `npm test` chain as `test:rm4-planner-ready-meal-library`). Runs against the real
database, creates and cleans its own users/households/planner rows. **21/21 pass:**

- Library scope: only the member's own ready meals — never another member's, never
  their cooked recipes.
- Ordering: most recently planned first, then frequency, never-planned newest-first
  last; `timesPlanned` / `lastPlannedEntryId` correct.
- Planner history is scoped to the member's household — a foreign household's entries
  never inflate the stats.
- Apple Score joins from the member's **own** `product_history` where available;
  renders the gap (null) where not; another member's analysis never leaks.
- One-tap reuse creates a **normal** planner entry against the existing `mealId`;
  no duplicate meal identity is created; planner history stays correct after reuse.

**Over the wire (isolated server instance, then fully cleaned up):**
- Anonymous `GET /api/planner/ready-meal-library` → **401** (fails closed).
- Authenticated member: library returns their two seeded ready meals with correct
  ordering, stats and Apple Score; `POST /api/planner/days/:dayId/items` (the normal
  add) → **201**; refetch shows `timesPlanned` 1→2 and recency updated.

**Regression — existing suites pass unchanged:**
- `test:rm2a-analyser-to-planner` — 14/14
- `test:intelligence-planner-binding` — 31/31
- `test:intelligence-meals-binding` — 72/72
- `test:product-dedup` — 76/76
- `test:planner-compliance` — 25/25

**Typecheck:** zero errors in any RM4-touched file. The typecheck gate's 32 baseline
regressions all belong to other concurrent sessions' uncommitted working-tree files
(notice-gateway, household-nutrition-assembler, pantry/cbk2/plan2/shop1 tests,
publication verification) — none reference an RM4 file or symbol.

**Manual reasoning against each mission verify point:**
- *Previously planned ready meals are discoverable* — the section lists them first, by
  recency (tests 3.1–3.3; wire check).
- *One-tap reuse creates normal planner entries* — same `onSelect` → same
  `POST /api/planner/days/:dayId/items` as every picker row (test 6; wire check 201).
- *No duplicate meal identities are created* — the library is read-only; reuse
  references the existing `mealId`; RM2A's barcode idempotency untouched (test 6).
- *Planner history remains correct* — counts and recency verified before/after reuse
  (tests 3, 6).
- *Existing planner functionality passes regression* — suites above.

---

## 6. Adoption / compliance notes

RM4 creates **no new client building block** — it adds a section to the existing
`PlannerMealPickerPanel` and adopts existing owners: `components/ui/button.tsx` and
`AppleRating` each gain an importer; `DraggableSearchResultRow` and `Badge` gain new
call sites. **Zero** raw `<button>` elements added. `npm run adoption:check` reports the
same two failures as before RM4 (a `HouseholdNutritionPanel.tsx` orphan and a
raw-`<button>` ceiling overage of 539 vs 538) — **both pre-existing, from other
sessions' uncommitted working-tree files**; RM4 changes neither count. No register edit
is owed by this workstream.

**Product Registry:** `docs/product/` is deliberately not yet created (PKR1/PKR3 —
defined, populated nowhere), so no registry entry exists to update; recorded here so
the obligation is visible when the registry is populated.

---

## 7. Remaining gaps

1. **Recency is entry-id-approximate.** `planner_entries` has no timestamp, so
   "most recently planned" is ordered by the serial entry id — correct for ordering,
   but it cannot say *when*. If the Planner ever wants "planned last Tuesday", entries
   need a `createdAt` (a deliberate schema decision, not taken here — no schema change
   was in scope).
2. **Apple Score coverage is analysis-dependent.** Products saved without the member
   ever opening a full analysis have no `product_history` row and render the honest
   gap. Persisting the score at save time is an ownership decision (who owns a stored
   score — RM1 keeps the Analyser a read lens) deliberately not taken here.
3. **Cross-member canonical identity** (RM2A §7.1) — the library is per member, like
   the identity itself. A shared household-level library follows automatically if the
   platform ever adopts a shared identity per barcode; not taken here.
4. **Ready-meal vocabulary unification** and the fate of the ~300 generic system ready
   meals (RM1 §6.2/§6.3) remain open product decisions, unchanged by RM4.

---

## 8. Milestone commit

Commit: **`RM4 — Planner Ready Meal Library`** (see git log). Files:
`server/storage.ts`, `server/routes.ts`,
`client/src/components/PlannerMealPickerPanel.tsx`,
`client/src/hooks/use-planner-operations.ts`, `client/src/hooks/use-meals.ts`,
`server/tests/test-rm4-planner-ready-meal-library.ts`, `package.json`, this document,
and the session run file. Concurrent sessions' unrelated working-tree changes were
deliberately left unstaged.

---

_Rollback reference: `rollback/RM4-planner-ready-meal-library-20260715` → `da368a39`._
