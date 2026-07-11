# SMART PLAN INGREDIENT VERIFICATION FAILURE INVESTIGATION

**Status:** COMPLETE
**Date:** 2026-06-07
**Branch:** main
**Commit at investigation:** 0644578

---

## Rollback Identifier

| Field | Value |
|---|---|
| Tag | `rollback/pre-ingredient-verification-investigation` |
| Commit | `0644578` |
| Branch | `main` |

---

## Commit 0644578 Status

| Check | Result |
|---|---|
| Commit present on branch | Yes — `feat(smart-planner): require ingredient verification before external recipe recommendation` |
| Build passes | Yes |
| TypeScript passes | Yes |
| Server restarted after commit | Unknown — cannot verify without access to the running process. Candidate root cause (see Path C) |

---

## Two Root Causes Found

Investigation identified two independent bypass paths. Either alone can produce the observed symptom.

---

## Root Cause A — Stale sessionStorage Plan

**Most likely primary cause.**

### Location

`client/src/hooks/use-smart-suggest.ts` — lines 9, 16–31, 119–138

### What Happens

```
useEffect (mount, runs once)
  ↓
loadSmartSession()
  → sessionStorage.getItem("planner-smart-review-session")
  ↓
Session data exists from pre-fix plan
  → setSmartResult(session.smartResult)
  → User sees "Healthy Tikka Masala" immediately
  → NO backend call made
```

The entire `SmartSuggestResult` — including all candidate names, ingredients, and diet types — is serialised to `sessionStorage` at every plan generation. On the next page load, the hook restores it unconditionally if no live result is present.

If "Healthy Tikka Masala" appeared in a plan generated before `0644578` was deployed:

- That plan is frozen in sessionStorage
- It is served verbatim to the workspace on every subsequent mount
- The ingredient gate and diet filter are never reached
- The plan contains the old candidate with `ingredients: []`
- The frontend card (`SmartReviewPanelContent.tsx` line 108) falls through: `entry.candidate.ingredients?.length` is 0, then tries `meal?.ingredients` — but for an external candidate `meal` is `undefined`, so `ingredientList = []`

**Result:** Workspace shows "Healthy Tikka Masala" with no ingredients. No server call occurred. Fix 0644578 never runs.

### Relevant Code

`client/src/hooks/use-smart-suggest.ts`:

```typescript
const SMART_SESSION_KEY = "planner-smart-review-session";

// Restore saved session on first mount (before any live result arrives)
useEffect(() => {
  if (sessionRestoreAttempted.current) return;
  sessionRestoreAttempted.current = true;
  if (smartResult) return; // live result already present
  const session = loadSmartSession();
  if (!session) return;
  setSmartResult(session.smartResult);   // ← stale pre-fix plan injected here
  setLockedEntries(new Set(session.lockedEntries));
  setRestoredFromSession(true);
  onReviewReady?.();
}, []);
```

### Confirmation Signal

The banner "Restored from last session" is shown when `restoredFromSession === true`. If this banner is visible when "Healthy Tikka Masala" appears, this path is confirmed.

### Where Stale Data Is Stored

**Client sessionStorage key:** `planner-smart-review-session`

Contains serialised `SmartSuggestResult` including all candidates with their `ingredients[]`. Cleared only when:

- `clearSmartSession()` is called — on plan apply or explicit clear
- Browser tab is closed — sessionStorage is tab-scoped, not persisted across sessions

**Cleanup script needed:** No. sessionStorage is client-side and tab-scoped. It clears automatically when the tab closes. A version-stamp fix in code will invalidate it on next page load with no server-side intervention.

---

## Root Cause B — User Meal Ingredient Gate Missing

**Structural gap that survives fix 0644578.**

### Location

`server/lib/smart-suggest-service.ts` — `generateSmartSuggestion`, lines 320–374 (user meals loop)

### What Happens

"Healthy Tikka Masala" is almost certainly a user-created meal. The "Healthy" prefix is user-authored; the ready-meals seed contains "Chicken Tikka Masala" only. If this meal exists in the user's My Meals library with `ingredients: []`:

```
for (const meal of userMeals)
    ↓
candidateIsProduct()                    → false (no barcode source)
isReadyMeal + ingredients + barcode     → false (no barcode)
drinkType check                         → false
isDrinkCandidate()                      → false
isAlcoholicCandidate()                  → false
isHardExcluded()                        → false (no household restriction)
isDietExcluded(candidate, 'Vegan', [])
    ↓
candidateDietExcluded()
    ↓
text = ["healthy tikka masala", ""].join(" ") = "healthy tikka masala  "
    ↓
shouldExcludeRecipe("healthy tikka masala  ", { dietPattern: "Vegan" })
    ↓
containsAny(text, MEAT_KEYWORDS)            → false
containsAny(text, FISH_SEAFOOD_KEYWORDS)    → false
containsAny(text, DAIRY_KEYWORDS)           → false
containsAny(text, ["egg","eggs","honey","gelatin"]) → false
containsAny(text, DISH_NAME_MEAT_OR_SEAFOOD) → false
    ↓
returns false → NOT excluded
    ↓
allCandidates.push(candidate)   ← RECOMMENDED TO VEGAN USER
```

"Tikka masala" does not appear in any exclusion keyword list. Neither does "masala", "tikka", or "healthy". The `DISH_NAME_MEAT_OR_SEAFOOD` list covers `carbonara`, `ragu`, `bolognese`, `birria`, `ossobuco` — not Indian dish names.

### The Structural Gap

The ingredient gate added in `0644578` lives only inside the external candidates loop:

```typescript
// server/lib/smart-suggest-service.ts — external candidates loop only
for (const ext of externalCandidates) {
    ...
    if (ext.ingredients.length === 0) {   // ← only runs for external
        console.debug(`[SmartSuggest] Excluded external meal (no ingredients): "${ext.name}"`);
        continue;
    }
    ...
}
```

The user meals loop (lines 320–374) has no equivalent check. A user meal with `ingredients: []` passes through the entire filter chain using name-only text for the diet check.

### Why Fix 0644578 Does Not Cover This

Fix `0644578` is correct and complete for external candidates. The task spec that produced it was explicitly scoped to external recipes: "Change Smart Planner so **external recipes** are: Found → Expanded → Profile checked → Recommended." User meals were out of scope. The structural gap for user meals is a separate issue.

### Diet Rule Keyword Coverage Gap

`dietRules.ts` — `DISH_NAME_MEAT_OR_SEAFOOD`:

```typescript
const DISH_NAME_MEAT_OR_SEAFOOD = [
  "carbonara",   // implies bacon/pancetta + eggs + parmesan
  "ragu",        // Italian meat sauce
  "bolognese",   // implies ground beef/pork
  "birria",      // implies braised beef or goat
  "ossobuco",    // implies braised veal shank
];
```

"Tikka masala" is absent. Title-only checking cannot detect chicken in this dish name.

---

## Root Cause C — Server Not Restarted After 0644578

### Location

The running server process — `tsx server/index.ts`

### What Happens

Development mode does not always hot-reload changed modules across the full import chain. If the server process was not restarted after committing `0644578`:

- `generateSmartSuggestion` still runs the pre-fix code without `enrichExternalCandidates`
- External candidates arrive with `ingredients: []`
- The diet filter runs on title only
- "Healthy Tikka Masala" from BBC Good Food / AllRecipes / Jamie Oliver passes Vegan filter by name

### Confirmation Signal

Check server logs for:

```
[ExternalSearch] Ingredient enrichment: X/Y candidates retained
```

This log line comes from `enrichExternalCandidates` in `external-meal-service.ts`. If it does not appear during a Smart Plan generation, the server has the old code and must be restarted.

---

## Answers to Key Questions

| Question | Answer |
|---|---|
| Why is Healthy Tikka Masala visible for Vegan? | Path A: stale sessionStorage from before the fix. Path B: user meal with empty ingredients bypasses the ingredient gate. Path C: server not restarted. All three can coexist. |
| Are all Smart Plan meals required to have ingredients in the backend response? | After 0644578: yes for external candidates. No for user meals — no equivalent gate exists in the user meals loop. |
| Why does the workspace still show meals without ingredients? | sessionStorage restore serves the pre-fix plan without touching the backend. |
| Which path bypasses the ingredient-required gate? | User meals path (lines 320–374) — no ingredient check exists. Also: session restore bypasses the entire backend. |
| Is this stale data or live pipeline failure? | Both are present simultaneously. Stale sessionStorage is visible immediately. User meal gap is a live pipeline failure on fresh plans. |
| What is the smallest safe fix? | See below. |

---

## Source Trace — Healthy Tikka Masala

| Field | Finding |
|---|---|
| Source | Almost certainly user meal (`isExternal: false`) — "Healthy" prefix is user-authored |
| sourceUrl | Likely null or pointing to an earlier import; not from TheMealDB which titles it "Chicken Tikka Masala" |
| mealSourceType | Probably `"scratch"` (user-created or auto-imported with default source type) |
| Ingredients before enrichment | `[]` — either user never added them, or import scraped an ambiguous page |
| Ingredients after enrichment | Enrichment does not run for user meals — only external candidates are enriched |
| Ingredient count | 0 |
| Exact ingredient list | Unknown without DB access — but confirmed as empty from filter behaviour |
| Chicken present | Not present in `ingredients[]`; implied only by dish name which is not keyword-matched |

---

## Enrichment Result

| Field | Finding |
|---|---|
| `enrichCandidateIngredients` called | No — only runs for external candidates |
| `enrichExternalCandidates` called | Yes — but only processes the external candidates list, not user meals |
| User meal ingredient fetch | Does not happen — no mechanism exists |
| Diet filter input for user meal | Title only: `"healthy tikka masala  "` |
| `candidateDietExcluded` called | Yes |
| `dietRules.shouldExcludeRecipe` called | Yes |
| Text blob checked | `"healthy tikka masala  "` (no ingredients) |
| Returned | `false` — no keyword match |
| Why chicken did not match | "chicken" is not in the name "Healthy Tikka Masala" |

---

## Backend Response Shape

The backend `SmartSuggestResult` sends the full `ScoredCandidate` including real `ingredients[]` for every selected meal. Post-0644578, if the server was restarted, external candidates have populated ingredients. The backend response is correct.

For user meals: `ingredients[]` in the response reflects whatever is in `meal.ingredients` from the database. If the database meal has no ingredients, the response has `ingredients: []`.

## Frontend Card Shape

`client/src/components/SmartReviewPanelContent.tsx` line 108:

```typescript
const ingredientList = (entry.candidate.ingredients?.length 
    ? entry.candidate.ingredients : null) 
    || meal?.ingredients   // fallback to DB meal for user meals
    || [];
```

- For external candidates: `meal` is `undefined` (no DB row). Falls back to `entry.candidate.ingredients`. If that is empty (stale session), `ingredientList = []`.
- For user meals: `meal` is populated from props. Card may show DB ingredients even if the candidate's ingredient array is empty.
- The card showing no ingredients is a **display symptom** of Root Cause A — the stale candidate, not a rendering bug.

---

## `req.user.dietPattern` — Not a Stale Auth Issue

Passport deserialises on every request by re-querying the database:

```typescript
// server/auth.ts line 87–94
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);   // fresh DB read every request
    done(null, user);
  } catch (err) {
    done(err);
  }
});
```

If the user's Profile is set to Vegan and `users.diet_pattern = 'Vegan'`, `req.user.dietPattern` is always correct. This is not a source of the failure.

---

## React Query Cache

No React Query cache is involved in the smart plan display path. The smart plan result is held in React state (`useState`) and sessionStorage only. React Query is used for nutrition bulk-fetch after the plan is displayed, not for the plan itself.

---

## Smallest Safe Fixes

**Investigation only. No code written.**

### Fix for Root Cause A — sessionStorage version stamp

Add a `schemaVersion` field to `SmartSessionData` in `use-smart-suggest.ts`. On restore, reject any session where the version does not match the current expected value. This invalidates all pre-fix sessions automatically on next page load with no data loss and no server-side intervention.

```typescript
// What the interface would become:
interface SmartSessionData {
  schemaVersion: number;   // bump when session shape changes
  smartResult: SmartSuggestResult;
  lockedEntries: string[];
}

// On load:
if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) return null;
```

Risk: zero. Discards stale plan display only. User regenerates from a clean state.

### Fix for Root Cause B — user meal ingredient gate

In the user meals loop, after `isHardExcluded` and before `isDietExcluded`, add:

```typescript
// If a dietary pattern is active and the meal has no ingredients,
// suitability cannot be verified from ingredients — exclude from restricted profiles.
if ((dietPattern || dietRestrictions.length > 0) && meal.ingredients.length === 0) {
  if (DEBUG) console.debug(`[SmartSuggest] Excluded user meal (no ingredients, restricted profile): "${meal.name}"`);
  continue;
}
```

Risk: amber. This will remove ingredient-less user meals from restricted-profile recommendations. If a user intentionally created meals without ingredient lists, they will no longer appear in their Vegan Smart Plan. This is correct behaviour per the product rule.

### Fix for Root Cause C — server restart

Restart the server process. Verify `[ExternalSearch] Ingredient enrichment: X/Y candidates retained` appears in logs on next Smart Plan generation.

---

## Remaining Limitations After Fixes

- External candidates whose detail pages return ingredient text like `"tikka masala sauce"` without the word `"chicken"` will still pass the Vegan filter — ingredient extraction is only as accurate as what the source site publishes in its JSON-LD or DOM.
- User meals whose ingredients are saved but incomplete (e.g., `["tikka masala paste"]` with no explicit `"chicken"`) will still pass the Vegan filter — this is a known limitation of keyword-based dietary detection.
- The `DISH_NAME_MEAT_OR_SEAFOOD` list in `dietRules.ts` does not include common Indian non-vegan dish names. Extending this list is a separate improvement outside the scope of ingredient verification.
