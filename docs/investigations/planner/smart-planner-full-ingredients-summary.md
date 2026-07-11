# Smart Plan Preview — Full Ingredient List

**Date:** 2026-06-06
**Risk:** Green — UI display only
**Schema changes:** None | **Migration:** None | **Backfill:** None

---

## Rollback Points

| Point | Tag |
|---|---|
| Before | `rollback/before-smart-plan-full-ingredients` (commit `c0ea8d5`) |
| After | `rollback/after-smart-plan-full-ingredients` (same commit, working tree) |

---

## Problem

The `PreviewCardContent` component in `MealPreviewBubble.tsx` truncated the ingredient list to the first 6 items and applied `line-clamp-3`. This is shared between planner search previews and the Smart Plan proposed meal previews added in the previous session.

Users had no way to verify dietary suitability (Vegan, Vegetarian, Keto, allergies) from a Smart Plan preview because the full ingredient list was never visible.

---

## Solution

Added a `showAllIngredients` boolean prop that threads from `MealPreviewBubble` / `MealPreviewInline` into `PreviewCardContent`. When `true`, the ingredient section renders a scrollable `<ul>` showing every ingredient. When `false` (the default), the existing truncated comma-joined string is rendered unchanged.

Only the Smart Plan preview call sites pass `showAllIngredients`. Planner search call sites pass nothing, so they receive the default `false` and are unaffected.

---

## Files Changed

### `client/src/components/MealPreviewBubble.tsx`

- `PreviewCardContent`: added `showAllIngredients?: boolean` prop (default `false`)
  - When `true`: renders a `<ul>` with one `<li>` per ingredient, capped at `max-h-36 overflow-y-auto` (~10 lines visible, scrolls for more)
  - When `false`: existing behaviour — `ingredients.slice(0, 6).join(", ")` with `line-clamp-3`
- `MealPreviewBubble`: added `showAllIngredients?: boolean` prop, forwarded to `PreviewCardContent`
- `MealPreviewInline`: added `showAllIngredients?: boolean` prop, forwarded to `PreviewCardContent`

### `client/src/components/SmartReviewPanelContent.tsx`

- Desktop `MealPreviewBubble` call: added `showAllIngredients`
- Mobile `MealPreviewInline` call (inside `SmartMealEntryCard`): added `showAllIngredients`

---

## Behaviour

| Context | `showAllIngredients` | Ingredient display |
|---|---|---|
| Smart Plan desktop preview | `true` | All ingredients, `max-h-36` scrollable list |
| Smart Plan mobile preview | `true` | All ingredients, `max-h-36` scrollable list |
| Planner search desktop preview | `false` (default) | First 6, comma-joined, `line-clamp-3` |
| Planner search mobile preview | `false` (default) | First 6, comma-joined, `line-clamp-3` |

---

## What Was Not Changed

- Ingredient truncation for planner search previews (unchanged, `showAllIngredients` defaults to `false`)
- Smart Plan scoring
- Candidate filtering
- Meal generation
- Diet logic
- Any server-side code
- All existing card actions (lock, refresh, basket, analyse)

---

## Build Results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ Zero errors |
| `npm run build` | ✅ Clean |

---

## Manual Test Steps

1. Generate a Smart Plan
2. **Desktop — My Meals / Cookbook:** hover the image/title area of a proposed meal → confirm all ingredients visible as a bulleted list (scrollable if > ~10)
3. **Desktop — BBC Good Food:** hover → confirm full ingredient list
4. **Desktop — TheMealDB:** hover → confirm full ingredient list
5. **Mobile — any source:** tap image/title area → confirm full ingredient list in inline card, scrollable if long
6. **Regression — planner search:** open the meal picker (search mode), hover a cookbook result → confirm ingredient display is still truncated to first 6 (unchanged)
7. **Regression — planner search mobile:** tap a search result → confirm inline card still shows first 6 ingredients
