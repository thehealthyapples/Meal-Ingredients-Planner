# Dietary Pattern / Cuisine Preference Separation — Existing Structure Feasibility

**Date:** 2026-06-12  
**Status:** Investigation complete — STATUS B  
**Rollback tag:** `pre-dietary-cuisine-separation-investigation` (commit `43fbdda`)  
**No code changes made.**

---

## Rollback Protection

```
git checkout pre-dietary-cuisine-separation-investigation
```

---

## 1. Where does `preferredCuisine` already exist?

### Locations and data flow

| File | What it does |
|------|-------------|
| `server/lib/smart-suggest-service.ts:22` | `SmartSuggestSettings` interface — `preferredCuisine?: string` |
| `server/lib/smart-suggest-service.ts:429–430` | Passed as `cuisine:` and `query:` to external meal fetcher |
| `server/lib/smart-suggest-service.ts:780` | Forwarded to `scoreCandidates()` as `preferredCuisine` |
| `server/lib/meal-scoring-service.ts:102` | Scoring context accepts `preferredCuisine?: string` |
| `server/lib/meal-scoring-service.ts:196–198` | Adds `cuisineBonus = 5` when `candidate.cuisine` matches |
| `server/routes.ts:4815` | POST `/api/smart-suggest` reads `body.preferredCuisine` |
| `client/src/hooks/use-smart-suggest.ts:196,287` | Sends `preferredCuisine: smartCuisine` in both generate and refresh |
| `client/src/components/PlannerAssistantPanel.tsx:231–246` | "Cuisine preference" Select UI (session state only) |

### Data flow summary

```
PlannerAssistantPanel (Select UI)
  → smartCuisine (React useState, session only)
  → use-smart-suggest.ts hook
  → POST /api/smart-suggest { preferredCuisine: smartCuisine }
  → smart-suggest-service.ts
  → meal-scoring-service.ts → cuisineBonus (+5)
```

### Persisted or session-only?

**Session-only.** `smartCuisine` lives in `useState` inside `use-smart-suggest.ts` and is exposed
via `PlannerWorkspaceContext`. It is never written to any database table. There is no
`preferred_cuisine` or `cuisine_preference` column anywhere in the schema.

---

## 2. Can the Profile UI label be corrected without schema changes?

**Yes. Two string literals need changing, nothing else.**

```
client/src/pages/profile-page.tsx:1332   "Cuisine"  →  "Dietary Pattern"
client/src/pages/profile-page.tsx:1344   label="Cuisine"  →  label="Dietary Pattern"
```

The underlying stored field is already named `dietPattern` / `diet_pattern`. The variable
`cuisineSummary` (line 1315) is local — its name is irrelevant to users. The ProfileSummary
component also uses a local variable `cuisine` (line 151) to hold the display value — that name
is also irrelevant to users; only the chip content is visible.

No server routes, no schema, no API shape, no validation enum changes needed.

---

## 3. Can Mediterranean be removed from the Dietary Pattern chips?

### What Mediterranean currently does in diet_pattern

- **No hard exclusions.** In `server/lib/dietRules.ts:334` and `client/src/lib/dietRules.ts:277`,
  the comment explicitly states "Mediterranean, DASH, MIND, Flexitarian — no hard exclusions, only scoring."
- **Scoring only.** `server/lib/dietRules.ts:352` and `client/src/lib/dietRules.ts:295` apply a
  penalty score for bacon, salami, pepperoni, processed meats. Positive ingredients (olive oil,
  fish, legumes) score higher.
- **Not a dietary restriction.** Unlike Vegan or Keto, Mediterranean excludes nothing absolutely.
  It is purely a preference signal.

### The conflict

Mediterranean is simultaneously:
1. A **cuisine origin** (Italian/Greek geography) — correctly represented in the Smart Planner
   "Cuisine preference" Select (`PlannerAssistantPanel.tsx:243`).
2. A **dietary pattern** (eating style defined by food group ratios) — currently stored in
   `users.diet_pattern` and used in scoring.

These are genuinely different concepts. A British person can eat Mediterranean-style food
(dietary pattern) without selecting Mediterranean cuisine (origin). A Mediterranean cuisine
meal (Greek salad) may not follow the Mediterranean dietary pattern in its macros.

### Is removal safe right now?

**Not completely.** The blocker is persistence, not logic:

- The Smart Planner cuisine selector already has Mediterranean and already routes it correctly
  through `preferredCuisine` to scoring. That path works.
- But `preferredCuisine` is **session-only** — not persisted.
- If Mediterranean is removed from the Profile chip list, users with `diet_pattern = 'Mediterranean'`
  stored in the DB would no longer be able to select it via Profile. Their stored value persists
  but is uneditable via UI (though the server would still accept it if submitted).
- New users would have no persisted way to express Mediterranean preference.
- Removing Mediterranean from `ALLOWED_DIET_PATTERNS` in `routes.ts:911` would cause a **400
  error** for any profile save that includes `dietPattern: "Mediterranean"` — breaking existing
  users who re-open their profile while having that value stored.

**Safe partial move:** Remove Mediterranean from the Profile chip display only (the `DIET_PATTERNS`
array in `diets.ts`) while keeping it in `ALLOWED_DIET_PATTERNS` on the server. Existing stored
values are unaffected; the server still accepts them; existing users just can't re-select it.
This is low risk but creates an invisible gap (stored value that can't be re-chosen).

**Full move** requires a persisted cuisine field first.

---

## 4. Is there any existing persisted field that can safely store cuisine preference?

### Fields audited

| Table | Field | Type | Can it store cuisine? |
|-------|-------|------|-----------------------|
| `users` | `diet_pattern` | `TEXT` | Current location for Mediterranean; single value only |
| `users` | `diet_restrictions` | `TEXT[]` | Hard restrictions — wrong semantic |
| `user_preferences` | `diet_types` | `TEXT[]` | Mixed use — already bridged from diet_pattern |
| `user_preferences` | `preferred_ingredients` | `TEXT[]` | Ingredient names — wrong semantic |
| `household_eaters` | `default_diet_types` | `TEXT[]` | Per-eater diet types — wrong scope for user cuisine |
| `meal_templates` | `cuisine` | `TEXT` | Per-meal property, not user preference |
| `meals` | `cuisine` | `TEXT` | Per-meal property |

### `user_preferences.diet_types` — the closest existing option

The bridge in `routes.ts:973–993` already writes `"mediterranean"` (lowercase) to
`user_preferences.diet_types` when `diet_pattern = "Mediterranean"` is saved. This means
Mediterranean IS currently persisted via `diet_types`, just not as a first-class cuisine preference.

Could a `"cuisine:mediterranean"` prefix value be added to `diet_types` (like `"style:simple-meals"`
is currently stored)? Technically yes, but:
- All consumers of `diet_types` would need to filter out `cuisine:*` prefix values to avoid
  treating them as diet restrictions.
- The reconciliation bridge would need updating.
- This is a schema-without-schema hack that adds hidden coupling.

**Verdict:** No existing field is cleanly suitable for a first-class cuisine preference. Adding
`preferred_cuisine TEXT` to `user_preferences` is a single-column migration with no risk.

---

## 5. Smallest safe change if no persisted field exists

The smallest safe changes, in order of increasing complexity:

**Step 1 (zero risk):** Rename the two "Cuisine" string literals in `profile-page.tsx` to
"Dietary Pattern". No schema, no API, no logic changes.

**Step 2 (low risk):** Keep Mediterranean in `DIET_PATTERNS` chip list and `ALLOWED_DIET_PATTERNS`
server enum. Existing behavior is preserved. The label rename in Step 1 already clarifies to users
that these are dietary patterns, not cuisine origins. Deferring Mediterranean's reclassification
is safe until persistence exists.

**Step 3 (deferred):** Once `preferred_cuisine` column is added to `user_preferences`, wire the
Smart Planner cuisine selector to read/write that column, and then optionally remove Mediterranean
from the Profile chip list.

---

## 6. What breaks if Mediterranean stays temporarily in diet_pattern?

**Nothing functional breaks.** Specifically:
- `dietRules.ts` continues to apply scoring (no hard exclusions for Mediterranean)
- The bridge continues to sync "mediterranean" to `user_preferences.diet_types`
- The Smart Planner cuisine selector's Mediterranean option continues to work independently
- Profile summary chip shows "Mediterranean" correctly
- No validation errors; no data corruption

The only issue is **conceptual/UX**: the Profile card header says "Cuisine" when it stores dietary
patterns. The label rename (Step 1 above) resolves the user-visible confusion without touching
Mediterranean at all.

---

## 7. What breaks if Mediterranean is removed from diet_pattern before schema exists?

### Removing from UI chip list only (diets.ts DIET_PATTERNS)

- Existing stored `diet_pattern = 'Mediterranean'` values are unaffected.
- Server still accepts Mediterranean via `ALLOWED_DIET_PATTERNS`.
- Existing users cannot re-select Mediterranean from Profile UI — invisible to them unless they look.
- The Smart Planner cuisine selector still has Mediterranean — session-based.
- **Net effect:** Low risk but creates an unreachable stored state for existing users.

### Removing from server ALLOWED_DIET_PATTERNS (routes.ts enum) — DANGEROUS

- Any profile save with `dietPattern: "Mediterranean"` returns **400 Bad Request**.
- Existing users who have Mediterranean stored: if they open and save their profile (even to change
  something unrelated), the stored value will be re-submitted and rejected.
- This is a **breaking change** for existing users and must not happen before migration.

### Removing from dietRules.ts scoring — DANGEROUS

- Users with `diet_pattern = 'Mediterranean'` would silently receive zero scoring benefit.
- Meals would not be penalised for processed meats even though the user expects Mediterranean scoring.
- Stored value loses meaning without matching logic.

---

## 8. Final recommendation

### STATUS B — UI and logic can be partially separated now without schema.

**Reasoning:**

The conceptual separation already exists in the codebase:
- `users.diet_pattern` / `dietRules.ts` — the dietary pattern track (scoring, compliance)
- `SmartSuggestSettings.preferredCuisine` / `meal-scoring-service.ts` cuisineBonus — the cuisine
  track (geographic preference, soft bonus)
- `PlannerAssistantPanel.tsx` — already has a proper "Cuisine preference" selector

What is **achievable without schema changes:**

1. **Rename Profile labels** `"Cuisine"` → `"Dietary Pattern"` in `profile-page.tsx` (2 string
   literals). Corrects the user-visible mislabelling. Zero risk.

2. **Document Mediterranean's dual nature** and leave it in both `DIET_PATTERNS` chip list and
   `ALLOWED_DIET_PATTERNS` server enum. No breakage. The scoring path in `dietRules.ts` remains
   valid and continues to benefit users who have it set.

3. **No logic changes required.** The Smart Planner cuisine path already works correctly and
   independently.

What requires schema before it is safe:

4. **Moving Mediterranean exclusively to the cuisine track** — this requires `preferred_cuisine`
   column in `user_preferences` so the preference is not lost when removed from `diet_pattern`.

5. **Persisting Smart Planner cuisine choice** — currently session-only; persistence requires the
   same column.

### Why not STATUS A?

Schema is not required before the label rename. The rename delivers real user-facing clarity.

### Why not STATUS C?

STATUS C is technically correct but undersells what is safe. Beyond the label rename, the team
can also:
- Confirm that Mediterranean can safely remain in diet_pattern long-term without scoring harm.
- Confirm that the Smart Planner cuisine selector already provides the correct separation path.
- Plan the single-column migration as the next concrete step.

STATUS B frames the current state accurately: partial separation exists, the label rename is the
safe immediate action, and the migration is small and well-scoped.

---

## Appendix: Mediterranean in the codebase — full reference

| File | Purpose | Safe to change now? |
|------|---------|---------------------|
| `client/src/lib/diets.ts:2,27,72` | Chip list and label definitions | Yes — label rename only |
| `client/src/pages/profile-page.tsx:1344` | Profile row label "Cuisine" | Yes — string rename |
| `client/src/pages/profile-page.tsx:1332` | Card header "Cuisine" | Yes — string rename |
| `client/src/components/PlannerAssistantPanel.tsx:243` | Smart Planner cuisine Select option | No change needed — correct location |
| `server/routes.ts:911` | ALLOWED_DIET_PATTERNS validation enum | Do not remove Mediterranean yet |
| `server/lib/dietRules.ts:352` | Mediterranean scoring switch case | No change needed |
| `server/migrations/runner.ts:48` | Historical backfill — already run | Immutable |
| `server/lib/household-meal-matcher.ts:23` | DIET_PATTERN_TO_DIET_TYPE map | No change needed |
