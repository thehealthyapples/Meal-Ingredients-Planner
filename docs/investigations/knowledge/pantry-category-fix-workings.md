# Pantry Category Architecture Fix — Request & Workings

## Request Summary

Fix Pantry Fruit and Pet category architecture inconsistency so the visible Pantry UI matches backend/API support (Phase 0 only).

---

## Investigation Findings

### What the UI Exposes (pantry-page.tsx)

Two category groups are defined in the current pantry-page.tsx:

```
FOOD_CATS: larder, fridge, freezer, fruit
HOME_CATS: household, pet
```

All six values are passed directly to POST /api/pantry when a user adds an item.

### What the API Accepted (before fix)

`server/routes.ts` line 7015:
```ts
category: z.enum(["larder", "fridge", "freezer", "household"]),
```
Missing: `fruit`, `pet`

### What the DB CHECK Constraint Allowed (before fix)

Last set by migration `2026-04-02_add_fruit_pantry_category`:
```sql
CHECK (category IN ('larder','fridge','freezer','household','fruit'))
```
Missing: `pet`

### Gap Summary

| Layer | larder | fridge | freezer | household | fruit | pet |
|-------|--------|--------|---------|-----------|-------|-----|
| UI    | ✓      | ✓      | ✓       | ✓         | ✓     | ✓   |
| API   | ✓      | ✓      | ✓       | ✓         | ✗     | ✗   |
| DB    | ✓      | ✓      | ✓       | ✓         | ✓     | ✗   |

`fruit` was accepted by DB but rejected at API. `pet` was rejected at both API and DB.

### Storage Seed Type (secondary)

`server/storage.ts` line 1978 had a TypeScript type annotation for the seed array that did not include `"household"` or `"pet"`. This was a type-only gap — the seed data itself only uses larder/fridge/freezer/fruit — but aligning it prevents future false-type-safety issues.

---

## Changes Made

### 1. server/routes.ts — API validation widened

Before:
```ts
category: z.enum(["larder", "fridge", "freezer", "household"]),
```
After:
```ts
category: z.enum(["larder", "fridge", "freezer", "household", "fruit", "pet"]),
```

### 2. server/migrations/runner.ts — New migration added

```ts
{
  id: "2026-05-23_add_pet_pantry_category",
  statements: [
    "ALTER TABLE user_pantry_items DROP CONSTRAINT IF EXISTS user_pantry_items_category_check",
    "ALTER TABLE user_pantry_items ADD CONSTRAINT user_pantry_items_category_check CHECK (category IN ('larder','fridge','freezer','household','fruit','pet'))",
  ],
},
```

Pattern follows existing migrations (2026-03-13, 2026-04-02): DROP IF EXISTS then ADD.
No data deleted, no data rewritten, no backfill. Additive widening only.

### 3. server/storage.ts — Seed type annotation aligned

Before:
```ts
const defaults: { name: string; category: "larder" | "fridge" | "freezer" | "fruit"; sortOrder: number }[] = [
```
After:
```ts
const defaults: { name: string; category: "larder" | "fridge" | "freezer" | "household" | "fruit" | "pet"; sortOrder: number }[] = [
```

---

## Build & Type Check Results

- `npm run build`: clean (✓ built in 7.96s)
- `npx tsc --noEmit`: clean (no output = no errors)

---

## Rollback Information

- Rollback tag: `rollback/pre-pantry-category-fix` (points to `e63de65`)
- Fix commit: `bcb90e6`
- To rollback: `git revert bcb90e6` or `git reset --hard rollback/pre-pantry-category-fix`
- Data impact on rollback: any `pet` rows created after deployment would need removal or category update before a narrower constraint could be re-applied

---

## Architecture Alignment Check (Post-Fix)

| Layer | larder | fridge | freezer | household | fruit | pet |
|-------|--------|--------|---------|-----------|-------|-----|
| UI    | ✓      | ✓      | ✓       | ✓         | ✓     | ✓   |
| API   | ✓      | ✓      | ✓       | ✓         | ✓     | ✓   |
| DB    | ✓      | ✓      | ✓       | ✓         | ✓     | ✓   |

---

## Phase 1 Readiness

Phase 0 is complete. Category support is fully consistent across UI, API, and DB.

Phase 1 (Pantry quantity) can safely proceed. The category foundation is now reliable.
No quantity fields were added. No Pantry visual redesign was made.
Shopping and Planner were not touched.
