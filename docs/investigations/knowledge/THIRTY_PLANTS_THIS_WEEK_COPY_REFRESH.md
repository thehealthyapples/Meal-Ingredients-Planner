# 30 Plants This Week — Copy Refresh

**Date:** 2026-06-09
**Scope:** Display copy only — no logic, data, schema, or planner changes

---

## Rollback Identifier

Tag: `rollback/before-thirty-plants-copy-refresh`

To restore: `git checkout rollback/before-thirty-plants-copy-refresh -- client/src/components/nutrition-variety-chips.tsx`

---

## Files Changed

| File | Change type |
|---|---|
| `client/src/components/nutrition-variety-chips.tsx` | Copy update only |

---

## Exact Copy Changes

### Visible label (line 305)

**Before:**
```
Plant Diversity
```

**After:**
```
30 Plants This Week
```

### Tooltip title (line 309)

**Before:**
```
Plant Diversity
```

**After:**
```
30 Plants This Week
```

### Tooltip body (lines 311–313)

**Before:**
```
Counts unique plant foods (fruit, veg, whole grains, herbs & spices,
olive oil) across your week's meals. Aim for 30 different plants per week.
This is an approximation based on ingredient names.
```

**After:**
```
5 a day is the minimum. Build towards 30 different plants a week —
fruit, veg, whole grains, herbs & spices, and olive oil all count.
This is an approximation based on ingredient names.
```

---

## What Was NOT Changed

- Counter value and calculation logic — unchanged
- Progress bar and colour coding — unchanged
- Scoring logic — unchanged
- `data-testid` attributes (`weekly-plant-diversity-counter`, `plant-diversity-count`, `plant-diversity-bar`) — unchanged
- Component and interface names (internal code identifiers) — unchanged
- Code comment on line 253 (`// ── Weekly Plant Diversity Counter`) — unchanged (not visible in UI)
- Schema, database, server — no changes

---

## "Plant Diversity" Audit

After change, confirmed no "Plant Diversity" text appears in any visible UI string.
The only remaining occurrence is a developer code comment (line 253) which is not rendered.

---

## Mobile Impact

The label `30 Plants This Week` is the same character length as `Plant Diversity` (approximately).
It sits in a `flex` row with `text-[10px]` sizing. No layout changes required.
The counter (`18 / 30`) remains on the same line and is unaffected.

## Desktop Impact

No layout changes. Tooltip width increased slightly (`max-w-[240px]` from `max-w-[220px]`) to accommodate the new two-sentence tooltip body without wrapping awkwardly.

---

## Manual Test Checklist

1. Planner loads normally — no functional change
2. Counter displays correct value (e.g. `18 / 30`) — unchanged logic
3. Progress bar unchanged — same `barColor` / `pct` calculation
4. Mobile layout remains readable — same text size and flex layout
5. Desktop layout remains readable — tooltip slightly wider, no overflow issues
6. Tooltip reflects new philosophy — "5 a day is the minimum. Build towards 30 different plants a week."
7. No "Plant Diversity" text in visible planner UI — confirmed

---

## Data Impact Declaration

- Reads existing data: YES
- Writes new data: NO
- Changes meaning of existing data: NO
- Requires backfill: NO
- Schema changes: NO
- Migration required: NO

---

## Trust Check

Could this mislead users? No. The feature continues to measure plant variety. Copy improves clarity only.

Could this fabricate certainty? No. The tooltip retains "approximation based on ingredient names" caveat. No health claims made.
