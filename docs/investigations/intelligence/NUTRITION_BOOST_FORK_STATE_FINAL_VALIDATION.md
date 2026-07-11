# Nutrition Boost — Fork State Final Validation

**Date:** 2026-06-11
**Status:** Complete — Investigation only, no implementation
**Rollback tag:** `rollback/nutrition-boost-fork-validation-2026-06-11` → commit `80c5b75`

---

## ROOT CAUSE CONFIRMED FOR ALL SYMPTOMS: YES

One root cause covers all five symptoms. Two synchronous `setQueryData` calls (planner cache + meals cache) are required to close it — both are part of fixing that one root cause.

---

## Rollback Identifier

Tag: `rollback/nutrition-boost-fork-validation-2026-06-11` at commit `80c5b75`

Unstaged modifications exist on tracked files at investigation start. The tag points to HEAD (last commit). No code was changed by this investigation.

---

## Background: What Commit 80c5b75 Already Fixed

Before this validation, three prior investigations documented and partially addressed the problem. The following are **already implemented** in the current codebase:

| Fixed behaviour | Mechanism | File / Line |
|----------------|-----------|-------------|
| Ingredient visible immediately while modal is OPEN | `setMealDetail` updates `mealDetail.meal.id = forkId` and appends ingredient synchronously | `weekly-planner-page.tsx:441–456` |
| Applications cache populated immediately after accept | `qc.setQueryData(["/api/meals", forkId, "uplift-applications"])` in `onSuccess` | `MealUpliftPanel.tsx:181–186` |
| "Added via Nutrition Boost" label visible while modal OPEN | Dialog-level `mealDetailApplications` query shares cache key with MealUpliftPanel | `weekly-planner-page.tsx:932–946` |
| Remove button visible while modal OPEN | Ingredient list annotates boost-accepted ingredients using `boostAcceptedApplications` | `weekly-planner-page.tsx:3701–3728` |
| Non-fork ingredient update (user-owned meals) | `qc.setQueryData(["/api/meals"])` immediately updates cache | `MealUpliftPanel.tsx:190–198` |

**All five symptoms are already fixed for the case where the user does not close and reopen the modal.** The remaining bug is the close-and-reopen case only.

---

## Root Cause (Still Present)

### The gap

`onMealForked` in the dialog JSX (line 3648) only fires `invalidateQueries`:

```typescript
// weekly-planner-page.tsx:3648–3651 — current code
onMealForked={() => {
  qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
  qc.invalidateQueries({ queryKey: ["/api/meals"] });
}}
```

`invalidateQueries` triggers a **background async** refetch. There is no synchronous `setQueryData` to update `entry.mealId = forkId` in the planner cache. The planner cache continues to hold `entry.mealId = originalId` until the background refetch round-trip completes (~50–500 ms).

### The race window

```
User clicks Add (modal open)
  → POST /api/uplift/accept fires
  → Server creates fork (forkId), writes ingredient, updates plannerEntries.mealId = forkId in DB
  → onSuccess fires synchronously:
       setEffectiveMealId(forkId)        ← panel state only, modal-scoped
       onMealForked(forkId)              ← fires invalidateQueries only (async background refetch)
       setMealDetail(prev → forkId + ingredient)  ← mealDetail snapshot correct
       qc.setQueryData applications      ← applications cache correct
       Background refetches start

User closes modal before refetch completes
  → setMealDetail(null) — clears everything including the forkId update

Background refetch NOT yet complete:
  → /api/planner/full cache: entry.mealId = originalId (STALE)
  → /api/meals cache: forkId NOT in cache yet (fork only returned by GET /api/meals after refetch)

User clicks card to reopen modal
  → entry = fullPlanner[...].entries[...] where entry.mealId = originalId (from stale cache)
  → meal = getMeal(entry.mealId) = getMeal(originalId) = original system meal
  → setMealDetail({ entry, meal: originalSystemMeal })
  → mealSnapshot.id = originalId
  → mealDetail.meal.id = originalId
```

This is the exact failing state. Everything that follows uses `originalId` as the meal reference.

---

## Evidence for Each Symptom

### Symptom 1 — Added ingredient not visible until browser refresh

**Source of failure:** `weekly-planner-page.tsx:3020`

```typescript
const meal = meals.find(m => m.id === mealSnapshot.id) ?? mealSnapshot;
```

After stale reopen: `mealSnapshot.id = originalId`. `meals.find(m => m.id === originalId)` returns the original system meal (always present via `getSystemMeals()`, never modified). The fork containing "Pumpkin Seeds" is indexed under `forkId`, not `originalId`. The ingredient is in the DB under `forkId` but the UI resolves by `originalId`.

**After browser refresh:** Both queries fetch fresh simultaneously. `entry.mealId = forkId` (DB is correct). `getMeal(forkId)` returns the fork. Ingredient visible. ✓

**Status:** BROKEN on close+reopen before refetch. CONFIRMED as caused by stale planner cache.

---

### Symptom 2 — "Added via Nutrition Boost" label not visible

**Source of failure:** `weekly-planner-page.tsx:932–933`

```typescript
const { data: mealDetailApplications = [] } = useQuery<MealUpliftApplication[]>({
  queryKey: ["/api/meals", mealDetail?.meal.id, "uplift-applications"],
```

After stale reopen: `mealDetail?.meal.id = originalId`. The query key becomes `["/api/meals", originalId, "uplift-applications"]`.

All accepted applications were created against `forkId` (server records provenance on the fork). The `setQueryData` in `MealUpliftPanel.onSuccess` populated `["/api/meals", forkId, "uplift-applications"]` — a **different key**. The `originalId` key returns empty.

`boostAcceptedApplications = []` → the ingredient list finds no `boostApp` match → no label rendered.

**Status:** BROKEN on close+reopen before refetch. CONFIRMED as caused by stale planner cache.

---

### Symptom 3 — Remove button not visible

**Source of failure:** Same as Symptom 2 (`boostAcceptedApplications = []`).

The remove button at `weekly-planner-page.tsx:3714–3725` is rendered only inside the `if (boostApp)` branch. With `boostAcceptedApplications` empty, `boostApp` is `undefined` for every ingredient. The remove button branch is never reached.

**Status:** BROKEN on close+reopen before refetch. CONFIRMED as same mechanism as Symptom 2.

---

### Symptom 4 — Accepted boost appears as pending again

**Source of failure:** `MealUpliftPanel.tsx:91, 121–136, 240–245`

```typescript
const [effectiveMealId, setEffectiveMealId] = useState(mealId);
// ...
const { data: applications = [] } = useQuery<MealUpliftApplication[]>({
  queryKey: ["/api/meals", effectiveMealId, "uplift-applications"],
// ...
const acceptedIngredientKeys = new Set(
  activeApplications.map((a) => a.ingredient.toLowerCase().trim())
);
const pendingSuggestions = visibleSuggestions.filter(
  (s) => !acceptedIngredientKeys.has(s.ingredient.toLowerCase().trim())
);
```

After stale reopen: `MealUpliftPanel` receives `mealId={meal.id}` where `meal.id = originalId` (stale). The `effectiveMealId` state re-initialises to `originalId` (React state resets when the component unmounts on modal close and remounts on reopen). The applications query uses `originalId`. All applications are stored under `forkId`. The `originalId` query returns empty. `acceptedIngredientKeys = {}`. All suggestions pass the filter. "Pumpkin Seeds" appears as a pending Add idea again.

**Status:** BROKEN on close+reopen before refetch. CONFIRMED as caused by stale planner cache.

---

### Symptom 5 — Multiple forked meal copies (multiple-boost within single session — NO close+reopen)

**Required check result: single session, no close+reopen between adds**

| Step | Request mealId | Server decision | Forks created |
|------|---------------|----------------|---------------|
| Add Pumpkin Seeds | `originalId` | `isSystemMeal: true` → creates fork1 | 1 |
| Add Chickpeas | `fork1Id` (via `effectiveMealId`) | `isSystemMeal: false` → mutates fork1 | 0 (same fork) |
| Add Mixed Seeds | `fork1Id` (via `effectiveMealId`) | `isSystemMeal: false` → mutates fork1 | 0 (same fork) |

**Within a single open modal session: exactly 1 fork is created. The `effectiveMealId` tracking in `MealUpliftPanel` correctly uses `forkId` for all subsequent adds.**

**The multiple-fork risk: close+reopen between adds**

If the user closes the modal (clearing `effectiveMealId` with the component) and reopens before `/api/planner/full` refetches:

| Step | Request mealId | Server decision | Result |
|------|---------------|----------------|--------|
| Add Pumpkin Seeds | `originalId` | `isSystemMeal: true` → creates fork1, planner → fork1 | fork1 exists |
| User closes modal | — | Race: planner cache still has `originalId` | — |
| User reopens | — | `entry.mealId = originalId` (stale), `effectiveMealId` reinitialises to `originalId` | — |
| Add Chickpeas | `originalId` | `isSystemMeal: true` → creates **fork2**, planner → fork2 | fork2 exists |
| Outcome | — | fork1 (Pumpkin Seeds) ORPHANED, planner now points to fork2 (Chickpeas only) | Data pollution |

**Server-side deduplication:** The `/api/uplift/accept` route has **no fork deduplication check**. The `meals.copy` endpoint (line 1298–1302) does check `originalMealId` for an existing user fork — but `/api/uplift/accept` (line 9863) does not. Each call with a system meal `mealId` unconditionally creates a new fork.

**Status:** REAL risk, unmitigated at both client and server level.

---

## Required Check: Three-Boost Sequence Trace

Sequence: Open modal → Add Pumpkin Seeds → Add Chickpeas → Add Mixed Seeds → Close → Reopen (no browser refresh).

| Question | Answer |
|----------|--------|
| How many forked meals are created? | **1** within a single session; **up to N** if user closes+reopens between each add |
| Which meal ID does 1st Add use? | `originalId` (from `effectiveMealId` initialised from prop `mealId = originalId`) |
| Which meal ID does 2nd/3rd Add use? | `fork1Id` (via `effectiveMealId` updated in `onSuccess`) |
| Does `activeApplications` query use originalId or forkId? | `forkId` (after 1st accept updates `effectiveMealId`) |
| Does ingredient list render originalId or forkId? | `forkId` (via `mealDetail` update from `handleUpliftAccepted`) |
| Does planner cache `entry.mealId` change synchronously or after refetch? | **After async refetch only** — this is the unresolved gap |
| On close+reopen BEFORE refetch: what mealId is used? | `originalId` (stale planner cache) → all 5 symptoms manifest |

---

## Exact Failing State Source

**File:** `client/src/pages/weekly-planner-page.tsx`
**Line:** 3648–3651

```typescript
onMealForked={() => {
  qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
  qc.invalidateQueries({ queryKey: ["/api/meals"] });
}}
```

This callback receives `newMealId` (see prop type at line 69: `onMealForked?: (newMealId: number) => void`), but the argument is ignored. Neither `setQueryData(["/api/planner/full"])` nor `setQueryData(["/api/meals"])` is called. The race window is left open.

**Secondary gap:** `handleUpliftAccepted` (line 431–457) updates `mealDetail.meal` for the fork case but does NOT update `qc.setQueryData(["/api/meals"])`. The fork does not enter the meals cache until the background refetch completes. If the planner cache is fixed (entry.mealId = forkId) but the fork is not yet in the meals cache, `getMeal(forkId)` returns `undefined` → the planner card does not render → user cannot click to reopen.

---

## Recommended Smallest Implementation Fix

Two synchronous `setQueryData` calls, both triggered on the fork path. Neither requires server changes.

### Fix A — Synchronous planner cache update (eliminates stale entry.mealId)

In `weekly-planner-page.tsx` at line 3648, change the `onMealForked` callback to use the `newMealId` argument and synchronously update the planner cache. The `entry` variable from the enclosing dialog IIFE closure identifies which entry to update:

```typescript
onMealForked={(newMealId) => {
  qc.setQueryData<FullWeek[]>(["/api/planner/full"], (old = []) =>
    old.map(w => ({
      ...w,
      days: w.days.map(d => ({
        ...d,
        entries: d.entries.map(e =>
          e.id === entry.id ? { ...e, mealId: newMealId } : e
        ),
      })),
    }))
  );
  qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
  qc.invalidateQueries({ queryKey: ["/api/meals"] });
}}
```

This eliminates Symptoms 1, 2, 3, 4, and the multiple-fork risk — on the next modal open, `entry.mealId = forkId` everywhere.

### Fix B — Synchronous meals cache update for fork (ensures card remains visible)

In `MealUpliftPanel.tsx` `acceptMutation.onSuccess`, extend the `setQueryData(["/api/meals"])` block to handle the fork case. Without this, after Fix A, `getMeal(forkId)` returns `undefined` until the background `/api/meals` refetch lands, causing the planner card to not render:

```typescript
// Fork case: add fork to /api/meals cache immediately
// (original meal is in cache under originalId; fork inherits its shape)
if (data.forkedFromMealId && data.added.length > 0) {
  qc.setQueryData<Meal[]>(["/api/meals"], (old = []) => {
    if (old.some(m => m.id === data.mealId)) {
      // Fork already in cache — just append ingredient
      return old.map(m =>
        m.id === data.mealId
          ? { ...m, ingredients: [...(m.ingredients ?? []), ...data.added] }
          : m
      );
    }
    const original = old.find(m => m.id === data.forkedFromMealId);
    if (!original) return old;
    return [
      ...old,
      {
        ...original,
        id: data.mealId,
        isSystemMeal: false,
        ingredients: [...(original.ingredients ?? []), ...data.added],
      },
    ];
  });
}
```

The `invalidateQueries(["/api/meals"])` still fires for server confirmation. The `setQueryData` is a local optimistic write from the server response — no guessing.

---

## Whether One Cache Update Fixes All Symptoms

**NO — two synchronous cache updates are required**, but both are part of fixing the single root cause:

| Fix | What it closes |
|-----|---------------|
| Fix A: `setQueryData(["/api/planner/full"])` | Eliminates stale `entry.mealId`; fixes Symptoms 1, 2, 3, 4, and multiple-fork risk |
| Fix B: `setQueryData(["/api/meals"])` fork branch | Ensures fork is in the meals cache immediately so the planner card remains visible after Fix A is applied |

Fix A alone is sufficient to fix all five symptoms IF the user waits for the `/api/meals` background refetch before clicking the card. Fix A + Fix B together close the complete race window.

---

## Whether Any Separate UI Issue Remains

**No separate UI issue identified.** All five symptoms are the same root cause. The within-modal experience is already correct (commit 80c5b75). The only remaining issue is the close+reopen race, which Fix A + Fix B resolve together.

---

## Evidence Summary Table

| Symptom | Code path | Stale mealId causes this? | Fixed by root cause fix? |
|---------|-----------|---------------------------|--------------------------|
| 1. Ingredient not visible | `meals.find(originalId)` → original meal | YES | YES |
| 2. Label not visible | `mealDetail?.meal.id = originalId` → empty applications | YES | YES |
| 3. Remove button not visible | Same as 2 | YES | YES |
| 4. Appears as pending again | `effectiveMealId` resets to `originalId` → empty applications → `acceptedIngredientKeys = {}` | YES | YES |
| 5. Multiple forks possible | Close+reopen → `effectiveMealId = originalId` → POST sends system mealId → server forks again | YES | YES |

---

## Data Impact Declaration

| Category | Status |
|----------|--------|
| Reads existing data | YES — code and prior investigation documents |
| Writes existing data | NO — investigation only; no DB writes, no application code changes |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Schema changes | NO |

---

## Trust Check

| Claim | Basis |
|-------|-------|
| `onMealForked` only fires `invalidateQueries` | FACT — `weekly-planner-page.tsx:3648–3651` (current code, read this session) |
| `effectiveMealId` resets on modal reopen | FACT — `useState(mealId)` reinitialises when component remounts |
| Applications cache key uses `mealDetail?.meal.id` | FACT — `weekly-planner-page.tsx:933` |
| Server creates fork unconditionally for system meals | FACT — `routes.ts:9863` — no deduplication check |
| `meals.copy` endpoint has fork deduplication; uplift accept does not | FACT — `routes.ts:1298–1302` vs `routes.ts:9863` |
| Within-session multiple adds use `forkId` (safe) | FACT — `effectiveMealId` updated in `onSuccess` before any further Add click is possible |
| Browser refresh eliminates all symptoms | FACT — both queries fetch fresh; `entry.mealId = forkId` from DB |
| `handleUpliftAccepted` does NOT update `/api/meals` cache for fork | FACT — `weekly-planner-page.tsx:431–457` — only `setMealDetail` is updated, no `qc.setQueryData` call |
