# Household Eaters — Adult Chips Profile-Only Fix

**Date:** 2026-06-12  
**Scope:** `GET /api/household/eaters` adult row enrichment only

---

## Rollback Identifier

```
rollback/pre-adult-chips-profile-only-fix
```

To restore: `git checkout rollback/pre-adult-chips-profile-only-fix -- server/routes.ts`

---

## Files Changed

| File | Change |
|------|--------|
| `server/routes.ts` | Replaced adult enrichment logic (lines ~7945–7966) |

No other files were changed. No migrations. No database writes. No UI changes.

---

## Problem

The previous enrichment checked `user_preferences.diet_types` first and fell back to `users.diet_pattern` only when `diet_types` was empty. This caused internal preference tags (`style:*`, `upf-free`, `family-friendly`, `whole-foods`) stored in `user_preferences` to leak into the chips display.

---

## Fix

**Before:**
```ts
const [userRow, prefs] = await Promise.all([
  storage.getUser(eater.userId),
  storage.getUserPreferences(eater.userId),
]);

let defaultDietTypes: string[];
const prefDietTypes = prefs?.dietTypes ?? [];
if (prefDietTypes.length > 0) {
  defaultDietTypes = prefDietTypes;            // ← pulled from user_preferences.diet_types
} else if (userRow?.dietPattern) {
  const mapped = DIET_PATTERN_TO_DIET_TYPE[userRow.dietPattern];
  defaultDietTypes = mapped ? [mapped] : [userRow.dietPattern];
} else {
  defaultDietTypes = [];
}
const hardRestrictions: string[] = userRow?.dietRestrictions ?? [];
```

**After:**
```ts
const userRow = await storage.getUser(eater.userId);

let defaultDietTypes: string[];
if (userRow?.dietPattern) {
  const mapped = DIET_PATTERN_TO_DIET_TYPE[userRow.dietPattern];
  defaultDietTypes = mapped ? [mapped] : [userRow.dietPattern];
} else {
  defaultDietTypes = [];
}
const hardRestrictions: string[] = userRow?.dietRestrictions ?? [];
```

- `defaultDietTypes` now reads **only** `users.diet_pattern` (mapped via `DIET_PATTERN_TO_DIET_TYPE`).
- `hardRestrictions` reads **only** `users.diet_restrictions` (unchanged, already correct).
- `getUserPreferences` call removed from this path entirely.

---

## API Before / After

### Before (adult with `user_preferences.diet_types = ["keto","style:batch-cook","upf-free"]`):
```json
{
  "defaultDietTypes": ["keto", "style:batch-cook", "upf-free"],
  "hardRestrictions": ["gluten-free"]
}
```

### After (same adult, `users.diet_pattern = "Keto"`, `users.diet_restrictions = ["gluten-free"]`):
```json
{
  "defaultDietTypes": ["keto"],
  "hardRestrictions": ["gluten-free"]
}
```

### Expected display per user:
- **hotmail adult** (`diet_pattern = "Keto"`, `diet_restrictions = []`): chips → `[Keto]`
- **outlook adult** (`diet_pattern = "Keto"`, `diet_restrictions = ["gluten-free"]`): chips → `[Keto] [Gluten-Free]`

---

## Manual Test Results

1. **`GET /api/household/eaters` — adult `defaultDietTypes` from `users.diet_pattern`**  
   ✓ Confirmed: only the mapped `dietPattern` value appears; no `style:*` or preference tags present.

2. **`GET /api/household/eaters` — adult `hardRestrictions` from `users.diet_restrictions`**  
   ✓ Confirmed: restrictions come exclusively from `users.diet_restrictions`; no bleed from other sources.

3. **Household Eaters profile section shows adult chips**  
   ✓ Confirmed: adult eater rows display clean chips matching `users.diet_pattern` / `users.diet_restrictions`.

4. **Lilly and Daisy unchanged**  
   ✓ Confirmed: child rows (`userId == null`) pass through unenriched; `defaultDietTypes` and `hardRestrictions` are their stored values.

5. **No `style:*` chips appear**  
   ✓ Confirmed: `user_preferences` is not consulted in this path; internal tags cannot surface.

---

## Confirmation: No Database Writes

- `syncMembersAsEaters` upserts the `household_eaters` row shell — unchanged, as before.
- The enrichment block is read-only: no `storage.update*`, `db.insert`, or `pool.query` calls introduced.
- `household_eaters.default_diet_types` and `household_eaters.hard_restrictions` columns are **not written**.

---

## Confirmation: Scope Lock Maintained

- Child rows: untouched.
- Planner UI: not changed.
- Compatibility UI: not changed.
- Migrations: none added.
- Schema: not changed.
- Only file modified: `server/routes.ts` (enrichment read path, ~12 lines).
