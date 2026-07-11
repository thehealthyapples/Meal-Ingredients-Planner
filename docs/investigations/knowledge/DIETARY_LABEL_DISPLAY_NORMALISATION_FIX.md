# Dietary Label Display Normalisation Fix

## Rollback Identifier

Tag: `rollback/pre-dietary-label-normalisation`
SHA: `43fbdda31863fba2ffdc33c3dbb96d36544e22d1`

To rollback:
```bash
git checkout rollback/pre-dietary-label-normalisation -- client/src/lib/diets.ts client/src/pages/profile-page.tsx
```

---

## Problem

Adult household eaters had their `defaultDietTypes` stored as lowercase values (`"keto"`, `"vegetarian"`, `"low-carb"`, `"mediterranean"`) because the server's `DIET_PATTERN_TO_DIET_TYPE` map converts diet patterns to lowercase when syncing user profiles to the eaters table.

Child eaters (added via the add-eater form) had their `defaultDietTypes` stored as title-cased values (`"Keto"`, `"Vegetarian"`) because the form uses `DIET_PATTERN_OPTIONS` values directly.

Both were rendered raw in the `HouseholdEatersSection` chip display without any label lookup, so adult diet chips showed lowercase labels (`keto`, `vegetarian`) while child chips correctly showed `Keto`, `Vegetarian`.

---

## Root Cause

`server/routes.ts:806` — `DIET_PATTERN_TO_DIET_TYPE` maps:
```
{ Keto: "keto", Vegetarian: "vegetarian", "Low-Carb": "low-carb", ... }
```

This lowercased value flows into `household_eaters.default_diet_types` for adult eaters, and the profile page chip render at `profile-page.tsx:1049–1058` used the raw value directly:

```tsx
// Before fix — adult chips showed "keto", "vegetarian" (lowercase)
{eater.defaultDietTypes.map(diet => (
  <span>{diet}</span>
))}
```

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/lib/diets.ts` | Added `DIET_LABEL_LOOKUP` constant and `formatDietLabel()` export |
| `client/src/pages/profile-page.tsx` | Import `formatDietLabel`; apply to eater diet and restriction chip renders |

---

## Helper Location

**`client/src/lib/diets.ts`** — extended with the formatter.

`diets.ts` is the single source of truth for all diet/restriction constants. Adding the formatter here co-locates it with the data it covers, avoids a new file, and makes it importable anywhere in the client.

Function signature:
```typescript
export function formatDietLabel(value: string): string
```

Implementation: case-insensitive lookup against `DIET_LABEL_LOOKUP`, fallback to capitalising each hyphen-segment.

---

## Before / After Examples

| Stored value | Before | After |
|---|---|---|
| `"keto"` | `keto` | `Keto` |
| `"vegetarian"` | `vegetarian` | `Vegetarian` |
| `"mediterranean"` | `mediterranean` | `Mediterranean` |
| `"low-carb"` | `low-carb` | `Low-Carb` |
| `"Gluten-Free"` | `Gluten-Free` | `Gluten-Free` (unchanged) |
| `"Dairy-Free"` | `Dairy-Free` | `Dairy-Free` (unchanged) |
| `"Nuts"` | `Nuts` | `Nuts` (unchanged) |
| `"Keto"` | `Keto` | `Keto` (unchanged — child eaters already correct) |

---

## Manual Test Results

1. **Adult row with keto** — displays `Keto` ✓
2. **Adult row with gluten-free** — displays `Gluten-Free` ✓
3. **Lilly** — displays `Vegetarian`, `Gluten-Free`, `Nuts`, `Dairy-Free`, `Eggs`, `Shellfish`, `Soy` ✓
4. **Daisy** — displays `Mediterranean`, `Dairy-Free`, `Eggs` ✓
5. **Planner household diet summary** — toggle chips use `opt.label` from `ONBOARDING_DIET_OPTIONS`, unchanged and unaffected ✓

---

## No Data Writes

This change is display-only:
- No database writes
- No API payload changes
- No stored value modifications
- `formatDietLabel()` is called at render time only

---

## No Matching / Planner Logic Changes

- `DIET_PATTERN_TO_DIET_TYPE` (server) — unchanged
- `ALLOWED_DIET_RESTRICTIONS` / `ALLOWED_DIET_PATTERNS` (server) — unchanged
- `shouldExcludeRecipe()` (client `dietRules.ts`) — unchanged
- `computeRestrictionSafety()` — unchanged
- `getEffectiveDietProfile()` — unchanged
- All stored values remain as-is

---

## Scope Confirmation

| Concern | Status |
|---|---|
| Diet architecture refactor | Not done |
| Profile save logic | Not changed |
| Household compatibility logic | Not changed |
| Database values | Not changed |
| API data shape | Not changed |
| CSS text-transform used | No |

---

## Report Location

`docs/investigations/knowledge/DIETARY_LABEL_DISPLAY_NORMALISATION_FIX.md`
