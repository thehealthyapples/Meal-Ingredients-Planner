# Multi-Recipe Planner Slots

## Overview
The 6-week planner supports multiple recipes per meal slot. Each slot (Breakfast, Lunch, Dinner, Snacks, Drinks) can hold any number of meals. The main grid stays compact by showing only a count badge and the primary meal title. Full editing is available in the Day View drawer.

## Data Model

### position column
`planner_entries` has a `position INTEGER NOT NULL DEFAULT 0` column added for ordering entries within a slot.

Sorting is always deterministic: **position ASC, then id ASC**.

### Entry filtering
- **Meal slots**: `mealType === slot AND audience === "adult" AND isDrink === false`
- **Drinks**: `isDrink === true` (stored as `mealType="snacks"`, `isDrink=true`)
- Multi-audience (baby/child) continues to work as before — each audience is a separate entry

## API Endpoints

### Add item to slot (multi-recipe)
```
POST /api/planner/days/:dayId/items
```
Body:
```json
{
  "mealSlot": "dinner",
  "mealId": 123,
  "position": 0,
  "audience": "adult",
  "isDrink": false,
  "drinkType": null
}
```
Returns 201 with the new `PlannerEntry`. Does NOT replace existing entries — always inserts a new row.

For drinks: `mealSlot="snacks"`, `isDrink=true`.

### Update entry position
```
PATCH /api/planner/entries/:entryId
```
Body: `{ "position": 2 }`

Position can be negative (used for collision-safe swap via temp value of -1).

### Delete entry (ownership-safe)
```
DELETE /api/planner/entries/:entryId
```
Now validates that the entry belongs to the authenticated user before deleting.

### Existing upsert (single-slot, backward compat)
```
PUT /api/planner/days/:dayId/entries
```
Preserved for existing "set meal" button and template import. Still enforces one entry per (dayId, mealType, audience, isDrink) combination.

## Grid Summary Rules (compact display)

Each slot row in the 6-week grid is fixed height (single line):

| Entry count | Label | Meal display |
|---|---|---|
| 0 | "Dinner" | "+ Add" dashed button |
| 1 | "Dinner" | Meal name (truncated) |
| ≥ 2 | "Dinner (3)" | First entry (by position/id) only, truncated |

Same applies to Drinks row: "Drinks" or "Drinks (N)".

## Day View Drawer

Opened by clicking the **LayoutList expand button** in each day column header.

Shows 5 sections:
1. **Breakfast** (mealType=breakfast, isDrink=false)
2. **Lunch** (mealType=lunch, isDrink=false)
3. **Dinner** (mealType=dinner, isDrink=false)
4. **Snacks** (mealType=snacks, isDrink=false)
5. **Drinks** (isDrink=true)

Each section supports:
- View all entries sorted by position ASC, id ASC
- Up/Down reorder with **collision-safe 3-step swap**
- Remove individual entries
- Search and add new recipes/drinks via inline search

### Safe Reorder Swap
To swap entries A (pos=a) and B (pos=b) without transient duplicate positions:
1. PATCH A → position: -1 (temp)
2. PATCH B → position: a
3. PATCH A → position: b

## Basket / Shopping List Compatibility
**No changes required.** The `collectMealSelections` function in the planner client already iterates all `day.entries` regardless of how many exist per slot. All multi-recipe entries are automatically included in basket generation.

## Template Import Compatibility
Template import uses the existing `upsertPlannerEntry` path, which enforces one entry per slot. Templates continue to store and import one meal per slot. Multi-recipe state is not preserved in templates (future enhancement).
