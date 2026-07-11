# Profile Save 400 — Diet Restrictions Validation Fix

## 1. Rollback Identifier

Tag: `rollback/pre-diet-restriction-validation-fix`

Created before any implementation work began.

---

## 2. File Modified

`server/routes.ts`

---

## 3. Exact Code Change

**Before:**
```ts
const ALLOWED_DIET_RESTRICTIONS = ["Gluten-Free", "Dairy-Free"] as const;
```

**After:**
```ts
const ALLOWED_DIET_RESTRICTIONS = ["Gluten-Free", "Dairy-Free", "Nuts", "Eggs", "Shellfish", "Soy", "Sesame"] as const;
```

Location: `server/routes.ts:912`

No other files were modified.

---

## 4. Manual Test Results

| Test | Selection | Expected | Result |
|------|-----------|----------|--------|
| 1 | Gluten-Free + Nuts | 200 OK | PASS |
| 2 | Shellfish | 200 OK | PASS |
| 3 | Soy + Sesame | 200 OK | PASS |
| 4 | Gluten-Free + Dairy-Free | 200 OK (still works) | PASS |
| 5 | Reload profile — selections persist | Persisted | PASS |

---

## 5. Verification Results

All seven values now accepted by Zod validation:
- Gluten-Free ✓
- Dairy-Free ✓
- Nuts ✓
- Eggs ✓
- Shellfish ✓
- Soy ✓
- Sesame ✓

No 400 validation errors for any supported UI value.

---

## 6. Confirmation: No Migrations

No database migrations required. The `dietRestrictions` column is already a text array; expanding the backend allowlist does not change the storage schema.

---

## 7. Confirmation: No Schema Changes

`shared/schema.ts` was not modified. The Zod validation constant lives entirely within `server/routes.ts` as a local route-level guard.

---

## 8. Confirmation: Scope Lock Maintained

Only `ALLOWED_DIET_RESTRICTIONS` was expanded. The following were not touched:
- `shared/schema.ts`
- Database schema / migrations
- Profile UI
- Household eater UI
- Compatibility engine
- Planner
- Restriction resolver
- No refactors, shared constants, or architecture changes introduced.

---

## 9. Location of Saved Report

`docs/investigations/ux/PROFILE_SAVE_DIET_RESTRICTIONS_VALIDATION_FIX.md`
