# PROFILE SAVE 400 — INVALID PROFILE DATA INVESTIGATION

**Date:** 2026-06-12
**Rollback tag:** `rollback/pre-profile-save-400-investigation`
**Status:** Root cause confirmed. No code changes made.

---

## 1. Observed Symptom

Profile page → Cuisine section → user selects an allergy/intolerance chip (e.g. "Nuts") → clicks Save:

```
Toast: "Couldn't save changes"
       "400: Invalid profile data"
```

Reported context:
- Account: colinclapson@outlook.com
- Top summary chips: Keto, Gluten-Free aware
- Cuisine section shows: Vegetarian (diet pattern selector)
- Allergies & Intolerances shows: Gluten-Free, Nuts

---

## 2. Rollback Point Confirmed

```
Tag: rollback/pre-profile-save-400-investigation
Commit: 43fbdda (checkpoint: pre-nutrition-boost-provenance rollback point)
Branch: main, 18 commits ahead of origin/main
```

---

## 3. Exact PUT /api/profile Request Payload

The `GoalsPreferences` component (`profile-page.tsx:1304`) calls `onSave()` with:

```json
{
  "dietPattern": "Keto",
  "dietRestrictions": ["Gluten-Free", "Nuts"],
  "eatingSchedule": null,
  "preferences": {
    "goalType": "...",
    "activityLevel": "...",
    "healthGoals": [...]
  }
}
```

The failing field is `dietRestrictions`. With "Nuts" included, the array becomes `["Gluten-Free", "Nuts"]`.

---

## 4. Exact Server Response Body (400)

The route handler at `server/routes.ts:1002`:

```typescript
if (err instanceof z.ZodError) {
  return res.status(400).json({ message: "Invalid profile data", errors: err.errors });
}
```

Response body:
```json
{
  "message": "Invalid profile data",
  "errors": [
    {
      "code": "invalid_enum_value",
      "options": ["Gluten-Free", "Dairy-Free"],
      "path": ["dietRestrictions", 1],
      "message": "Invalid enum value. Expected 'Gluten-Free' | 'Dairy-Free', received 'Nuts'"
    }
  ]
}
```

---

## 5. Validation Schema That Rejects the Payload

`server/routes.ts:911–913`:

```typescript
const ALLOWED_DIET_PATTERNS = ["Mediterranean", "DASH", "MIND", "Flexitarian", "Vegetarian", "Vegan", "Keto", "Low-Carb", "Paleo", "Carnivore"] as const;
const ALLOWED_DIET_RESTRICTIONS = ["Gluten-Free", "Dairy-Free"] as const;   // ← only 2 values
const ALLOWED_EATING_SCHEDULES = ["None", "Intermittent Fasting"] as const;
```

`server/routes.ts:920`:

```typescript
dietRestrictions: z.array(z.enum(ALLOWED_DIET_RESTRICTIONS)).optional(),
```

This Zod enum only accepts `"Gluten-Free"` or `"Dairy-Free"`. Any other value causes `invalid_enum_value`.

---

## 6. Exact Field Causing Failure

**Field:** `dietRestrictions`
**Array element:** any value other than `"Gluten-Free"` or `"Dairy-Free"`
**Specifically from this report:** `"Nuts"` (index 1 in `["Gluten-Free", "Nuts"]`)

All five additional frontend options that will also trigger this 400:
- `"Nuts"`
- `"Eggs"`
- `"Shellfish"`
- `"Soy"`
- `"Sesame"`

---

## 7. Frontend/Backend Mismatch — Quantified

**Frontend** `ALLERGY_INTOLERANCE_OPTIONS` (`client/src/lib/diets.ts:40`):

```typescript
export const ALLERGY_INTOLERANCE_OPTIONS = [
  { value: "Gluten-Free", label: "Gluten-Free" },  // ✓ backend accepts
  { value: "Dairy-Free",  label: "Dairy-Free" },   // ✓ backend accepts
  { value: "Nuts",        label: "Nuts" },          // ✗ backend rejects
  { value: "Eggs",        label: "Eggs" },          // ✗ backend rejects
  { value: "Shellfish",   label: "Shellfish" },     // ✗ backend rejects
  { value: "Soy",         label: "Soy" },           // ✗ backend rejects
  { value: "Sesame",      label: "Sesame" },        // ✗ backend rejects
];
```

**Backend** `ALLOWED_DIET_RESTRICTIONS` (`server/routes.ts:912`):

```typescript
const ALLOWED_DIET_RESTRICTIONS = ["Gluten-Free", "Dairy-Free"] as const;
```

5 of 7 frontend options are rejected by the backend.

---

## 8. Root Cause — Git Blame Trail

### Stage 1: Original safe state

Before commit `16c914d`, the `GoalsPreferences` component used `DIET_RESTRICTIONS` (same 2 values as backend) for restriction chips:

```typescript
// profile-page.tsx BEFORE 16c914d
import { DIET_PATTERNS, DIET_RESTRICTIONS, EATING_SCHEDULES } from "@/lib/diets";
// ...
{DIET_RESTRICTIONS.map((r) => (  // ← only Gluten-Free, Dairy-Free — in sync with backend
```

### Stage 2: Household eaters commit introduces mismatch

**Commit:** `16c914d` — "Add household eaters feature with meal adaptation and shopping list context"
**Date:** Thu Apr 16, 2026

This commit:
1. Added `ALLERGY_INTOLERANCE_OPTIONS` to `diets.ts` with 6 items (adding Nuts, Eggs, Shellfish, Soy for child eater profiles)
2. Changed `GoalsPreferences` label from "Dietary restrictions" → "Allergies & intolerances"
3. **Switched `GoalsPreferences` restriction chips from `DIET_RESTRICTIONS` → `ALLERGY_INTOLERANCE_OPTIONS`**
4. Did NOT update `ALLOWED_DIET_RESTRICTIONS` in `server/routes.ts`

The `ALLERGY_INTOLERANCE_OPTIONS` was designed for the new household eater form (which stores values in `hardRestrictions` — a free-form string array with no Zod enum constraint). It was simultaneously applied to the profile page form, which maps to `dietRestrictions` — a field guarded by the strict enum schema.

Diff evidence (`profile-page.tsx` in `16c914d`):
```diff
-              <Label ...>Dietary restrictions</Label>
+              <Label ...>Allergies &amp; intolerances</Label>
               <div className="flex flex-wrap gap-2">
-                {DIET_RESTRICTIONS.map((r) => (
+                {ALLERGY_INTOLERANCE_OPTIONS.map((r) => (
```

### Stage 3: Sesame added, mismatch widens further

**Commit:** `51c5dc3` — "feat(ui): add Sesame to hard restriction selector options"
**Date:** Wed Jun 3, 2026

Added "Sesame" to `ALLERGY_INTOLERANCE_OPTIONS`. Commit notes state "No resolver changes, no schema changes, no migrations required" — the profile PUT schema was not audited. Backend still at 2 values.

---

## 9. Database Schema — No DB-Level Constraint

`shared/schema.ts:24`:

```typescript
dietRestrictions: text("diet_restrictions").array(),
```

Plain `text[]` column — no enum constraint at the database layer. The DB will accept any string array. The rejection is **exclusively in the Zod schema layer** of the PUT handler. No data migration is needed to fix this.

---

## 10. Household Compatibility Phase 1 — Not a Factor

Household Compatibility Phase 1 (recent commits) was investigated. The `ALLOWED_DIET_RESTRICTIONS` constant and the `profileUpdateSchema` Zod shape in `server/routes.ts` were not touched by Phase 1 changes. The bug predates Phase 1 by approximately 2 months (introduced April 16, 2026).

---

## 11. "Vegetarian under Cuisine" Context

The profile page renders `GoalsPreferences` under a card labelled **"Cuisine"** (`profile-page.tsx:1332`). This card contains both the diet pattern selector (showing Vegetarian, Keto, etc.) and the Allergies & Intolerances chips in the same component. The "Cuisine" label is cosmetically misleading (Keto and Vegetarian are not cuisines in the traditional sense) but is **not related to the 400 error** — it is just the section heading.

The "Keto" chip appearing in the top summary (profile chips) reflects the user's persisted `dietPattern`, which is accepted by the backend without issue.

---

## 12. Answers to Investigation Questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Exact PUT payload | `{ dietPattern: "Keto", dietRestrictions: ["Gluten-Free", "Nuts"], eatingSchedule: null, preferences: {...} }` |
| 2 | Exact 400 response | `{ "message": "Invalid profile data", "errors": [{ "code": "invalid_enum_value", "path": ["dietRestrictions", 1], "message": "... received 'Nuts'" }] }` |
| 3 | Validation schema | `z.array(z.enum(["Gluten-Free", "Dairy-Free"]))` at `server/routes.ts:920` |
| 4 | Failing field | `dietRestrictions` — specifically any value outside `["Gluten-Free", "Dairy-Free"]` |
| 5 | Failing value source | `dietRestrictions` — not cuisine, dietPattern, userPreferences.dietTypes, or excludedIngredients |
| 6 | Phase 1 contribution | None. Phase 1 did not touch `ALLOWED_DIET_RESTRICTIONS` or `profileUpdateSchema`. |
| 7 | Vegetarian/Keto / Cuisine link | Unrelated. "Cuisine" is just the card label. Keto = persisted `dietPattern`, which passes validation. |
| 8 | Final verdict | **A — Frontend payload shape bug** (frontend options were expanded without synchronising the backend schema) |

---

## 13. Final Verdict: A — Frontend Payload Shape Bug

The frontend shows 7 allergy options. The backend accepts only 2. Selecting any of the 5 unsupported options (Nuts, Eggs, Shellfish, Soy, Sesame) then saving triggers the 400.

This is not:
- A backend schema that is too strict for a designed feature (B) — the schema was simply never updated
- An invalid option value (C) — the values are meaningful and the restriction engine already handles them
- Stale profile state (D) — the failure is on new selection, not stale data replay
- A Household Compatibility Phase 1 regression (E) — the mismatch predates Phase 1

---

## 14. Safest Next Implementation Decision

**Extend `ALLOWED_DIET_RESTRICTIONS` in `server/routes.ts` to match `ALLERGY_INTOLERANCE_OPTIONS`.**

```typescript
// server/routes.ts:912 — change this:
const ALLOWED_DIET_RESTRICTIONS = ["Gluten-Free", "Dairy-Free"] as const;

// To this:
const ALLOWED_DIET_RESTRICTIONS = [
  "Gluten-Free", "Dairy-Free", "Nuts", "Eggs", "Shellfish", "Soy", "Sesame"
] as const;
```

**Why this is the safest change:**
- Backend-only change — no frontend modification, no DB migration
- Zero data loss risk — the DB column is `text[]` with no existing constraints
- The restriction resolver already handles all seven values (they were added to `ALLERGY_INTOLERANCE_OPTIONS` precisely because the engine supports them)
- Additive — only widens what the validator accepts; does not remove any existing valid values
- Surgical — one line, one constant, no cascading changes
- Reversible — widening an enum is always safer than narrowing

**What NOT to do:**
- Do not narrow the frontend options back to 2 — households rely on the expanded `ALLERGY_INTOLERANCE_OPTIONS` for child eater profiles
- Do not add a frontend-only filter to strip unsupported values before sending — this would silently discard valid user preferences

**Secondary cleanup (non-blocking):**
- Also keep `ALLERGY_INTOLERANCE_OPTIONS` and `ALLOWED_DIET_RESTRICTIONS` in sync as a shared constant so the mismatch cannot recur. Consider importing the frontend values into a shared module, or deriving the backend enum from the same source of truth.
