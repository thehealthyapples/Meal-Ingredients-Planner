# Meal Dialog Information Density Reduction

**Date:** 2026-06-09
**Scope:** Presentation only — no logic, data, schema, or planner changes

---

## Rollback Identifier

Tag: `rollback/before-meal-dialog-density-reduction`

To restore:
```
git checkout rollback/before-meal-dialog-density-reduction -- client/src/pages/weekly-planner-page.tsx
```

---

## Files Changed

| File | Change type |
|---|---|
| `client/src/pages/weekly-planner-page.tsx` | Presentation only |

---

## Changes Made

### Part 1 — "Who's Eating This?" collapsed by default

**State added (line 772):**
```tsx
const [eatersOpen, setEatersOpen] = useState(false);
```

**Before:**
```
Who's eating this?          ← static h3 heading, always visible
[ ] Alice
[ ] Bob
[ ] Charlie
[ ] Dan
─────────────────
Guests
  Add guest
  No guests for this meal.
```

**After:**
```
Who's eating this? (4)  ⌄   ← collapsible button, collapsed by default
```

When expanded (clicking the row):
```
Who's eating this? (4)  ∧
  [ ] Alice
  [ ] Bob
  [ ] Charlie
  [ ] Dan
  ─────────────────
  Guests
    Add guest
    No guests for this meal.
```

- Count `(N)` shows `householdEaters.length`
- ChevronDown when collapsed, ChevronUp when expanded
- `aria-expanded` set for accessibility
- All existing eater controls and guest controls unchanged — just hidden until expanded
- Both household member checkboxes and guest section are inside the same collapsible

---

### Part 2 — Household Adaptation card compressed

**Header title changed:**

| Before | After |
|---|---|
| `Tailor for household` | `Household Adaptation` |

**Count added to header:**

`(N)` — calculated as `householdEaters.length + entryGuests.length`

**"Evaluating full household" italic removed:**

This was a status string shown when no adaptation result yet existed. Replaced by the count badge which communicates the same information more concisely.

**"household-safe variant active" badge shortened:**

`household-safe variant active` → `household-safe` (still teal, same styling)

**Pre-tailor info block removed entirely:**

The following block was rendered below the header when no adaptation result existed:
```
Will evaluate 4 household members (4 total)
```
This duplicated the count now shown in the header `(4)`. Block removed.

**Result:** The card is now a single header line even before Tailor has been run:
```
[Users] Household Adaptation (4)    [Tailor]
```

After tailoring:
```
[Users] Household Adaptation (4)  [N checked]    [Re-tailor]  [∧]
```

---

## Before/After Layout Summary

| Area | Before | After |
|---|---|---|
| Who's Eating This? | Always expanded, shows all members | Collapsed by default, one row |
| Guest section | Always visible below member list | Hidden inside collapsible |
| Adaptation header title | "Tailor for household" | "Household Adaptation (N)" |
| Adaptation status line | "Evaluating full household" italic | Removed (count in header instead) |
| Pre-tailor info row | "Will evaluate N household members (N total)" | Removed |

**Estimated vertical space saved:** ~6–10 lines depending on household size.

---

## Mobile Impact

- "Who's Eating This?" reduces from N rows to 1 row when collapsed
- Household Adaptation card reduces from 2 blocks to 1 header line
- Meal Enhancements section scrolls into view much sooner
- No layout changes to buttons or touch targets

## Desktop Impact

- Same savings apply
- Dialog scrolling reduced
- Nutrition features (Meal Enhancements, 30 Plants counter) appear higher in dialog

---

## What Was NOT Changed

- Eater checkbox logic — unchanged
- Guest add/remove flow — unchanged
- Adaptation (Tailor) trigger — unchanged
- Adaptation result display — unchanged
- Collapse/expand of adaptation result — unchanged
- Nutrition scoring, variety chips, boost panel — unchanged
- Any data, schema, or server code — unchanged

---

## Manual Test Checklist

1. Dialog opens — "Who's Eating This?" is collapsed showing `Who's eating this? (4)  ⌄`
2. Clicking the row expands to show all household member checkboxes
3. Clicking again collapses
4. Guest section appears inside expanded state; Add guest button works
5. Household Adaptation card shows single header line: `Household Adaptation (4)  [Tailor]`
6. No "Evaluating full household" text visible
7. No "Will evaluate N household members" text visible
8. Tailor button triggers adaptation as before
9. After tailoring: result displays, collapse toggle appears, Re-tailor button available
10. If household-safe variant active: "household-safe" badge appears in header
11. Meal Enhancements section appears higher in the dialog

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

Could this mislead users? No. All information is still accessible — just collapsed by default.

Could this fabricate certainty? No. This is a display-only change.
