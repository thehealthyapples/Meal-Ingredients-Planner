# Planner Boost Count — Card ↔ Modal Reconciliation

**Date:** 2026-06-15
**Area:** Nutrition Boost count shown on the planner card vs. the meal detail dialog.

---

## Symptom

The same meal showed **two different boost counts**:

```
Planner card  → "2 boost ideas"
Meal modal    → 5 suggestions listed
```

The card and the modal are meant to describe the same set of boosts, so the
mismatch read as a bug.

---

## Root cause

The card indicator and the modal panel derived their numbers from **different
data at different cap layers** — they were never reading the same list.

There were **three** independent sources of divergence:

1. **Hard display cap.** The card rendered
   `suggestionCount={Math.min(suggestionCount, 2)}` — an anti-clutter cap at 2.
   The modal (`MealUpliftPanel`) caps visible suggestions at **5**
   (`selectedDiscovery = discoverySuggestions.slice(0, 5 - selectedReuse.length)`).
2. **Fallback boosts omitted on the card.** The modal renders
   `mergedMatches = server uplift rules + buildFallbackUpliftMatch(...)` (the
   deterministic `getMealBoosts` library). The card counted
   `upliftByMealId.get(meal.id)` — **server matches only** — so it never saw the
   deterministic fallback boosts.
3. **Reuse ranking skipped on the card.** The modal applies reuse-aware ranking
   (≤1 "already used this week" slot + discovery). When a meal has more than one
   reuse candidate, this changes the *count*, not just the order (extra reuse
   items beyond the 1 slot are dropped). The card did a flat
   `matches.flatMap(m => m.suggestions).length`.

Net effect: card = `min(serverMatchesCount, 2)`; modal = reuse-ranked, fallback-
merged, capped at 5 (then minus accepted). They could only coincide by accident.

---

## Fix — single shared selector

Both surfaces now build the **same input** and run the **same selector**, so they
cannot drift.

- **`client/src/components/MealUpliftPanel.tsx`** — extracted the reuse-ranking +
  5-item cap into an exported `selectVisibleBoosts(matches, weeklyReuseMap,
  mealName)`. The panel now calls it instead of inlining the logic (behaviour
  identical). It returns the visible `FlatSuggestion[]`; `.length` is the count.
- **`client/src/pages/weekly-planner-page.tsx`**
  - Added module-level `buildMergedMatches(mealName, ingredients, serverMatches,
    householdEaters)` — server uplift rules **+** deduped deterministic fallback —
    extracted from the modal's render gate so the gate and the card build
    identical data.
  - Both card indicators (mobile + desktop) now:
    `buildMergedMatches(...) → selectVisibleBoosts(...).length`, and the
    `Math.min(suggestionCount, 2)` cap was removed.
  - The modal render gate now reuses `buildMergedMatches`. (The verbose
    `[BOOST-PROOF] STEP6` console log in that gate was dropped in the process.)

Result: the card's "N boost ideas" equals the number the modal will list.

---

## Known residual — accepted (provenance) items

The modal subtracts already-accepted boosts (`pendingSuggestions`, via the
per-meal `uplift-applications` provenance query). The card has **no** such query
(it would be one request per visible grid meal). Instead the card flips to
**"Boosted"** when `boostedMealIds.has(meal.id)` — but that set only tracks
accepts made **this session**.

Consequence: a meal with boosts accepted in a *prior* session can still show the
full count on the card while the modal shows fewer (pending only). Closing this
gap requires loading provenance for the whole grid — deliberately out of scope
here.

---

## Out of scope (unchanged)

Boost generation (`nutrition-boosts.ts` / `getMealBoosts`), the uplift engine,
accept/remove mutations, scoring, and planner layout were not touched. This is a
display-count reconciliation only.

---

## Verification

- **Type-check:** no new errors in the changed files (`MealUpliftPanel.tsx`,
  `weekly-planner-page.tsx`). Remaining `tsc` errors are pre-existing and confined
  to unrelated `server/tests/*` fixtures (top-level `await`, mock shapes).
- **Not yet run in-app** — behavioural verification in the running planner is
  pending.
