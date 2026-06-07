# Smart Planner Proposed Meal Preview Card

**Date:** 2026-06-06
**Risk:** Green — UI inspection only
**Schema changes:** None | **Migration:** None | **Backfill:** None

---

## Rollback Points

| Point | Tag |
|---|---|
| Before | `rollback/before-smart-plan-preview` (commit `c0ea8d5`) |
| After | `rollback/after-smart-plan-preview` (same commit, working tree) |

---

## What Was Changed

### Problem

Smart Plan proposed meals in the `smart-review` panel were not inspectable. Each meal showed an image, title, source, diet badges, ingredient *count*, and servings — but the full ingredient name list was never shown, and there was no way to open the same preview card used by planner search results.

### Solution

Made the image + info header area of each `SmartMealEntryCard` interactive:

- **Desktop:** hovering the header opens a floating `MealPreviewBubble` (same portal-based card used in planner search), positioned to the left of the panel
- **Mobile:** tapping the header toggles a `MealPreviewInline` card inline below the entry, with a "View recipe" action for internal meals (My Meals / Cookbook) and a "Close"-only button for external meals (BBC Good Food, TheMealDB)
- **Keyboard:** Escape closes the desktop floating preview

The preview card shows: image, title, source badge, diet type badges, and the ingredient name list (first 6, same as search preview).

---

## Files Changed

### `client/src/components/MealPreviewBubble.tsx`

- Made `onAction` and `actionLabel` optional in `MealPreviewInlineProps`
- When no action is provided, only the "Close" button renders (full-width)
- All existing callers (`PlannerMealPickerPanel`, `PlannerAssistantPanel`) are unaffected — they still pass both props

### `client/src/components/SmartReviewPanelContent.tsx`

- Added `useIsMobile` hook (same breakpoint pattern as `PlannerMealPickerPanel`, `< 768px`)
- Added `useMealPreview()` at `SmartReviewPanelContent` level — one shared floating bubble state for the whole panel
- Added Escape key handler to close desktop preview
- Added three new props to `SmartMealEntryCardProps`: `onOpenPreview`, `onScheduleClose`, `isMobile`
- Each card builds a typed `PreviewItem` via `useMemo`:
  - Internal meals (My Meals, Cookbook): `{ kind: "meal", meal }` — full `Meal` object
  - External meals (BBC Good Food, TheMealDB): `{ kind: "web", recipe }` — shaped from `SmartCandidate` fields (`id`, `name`, `image`, `sourceUrl`, `category`, `cuisine`, `ingredients`, `source`)
- Image + info header wrapped in an interactive `role="button"` div with hover (desktop) and click (mobile) handlers
- Each card tracks its own `showMobilePreview: boolean` state
- `MealPreviewBubble` rendered at the bottom of the panel's JSX (renders to `document.body` via `createPortal`)

---

## Behaviour by Source

| Source | Desktop | Mobile | Action button |
|---|---|---|---|
| My Meals | Hover → floating bubble | Tap → inline card | "View recipe" → `/meals/:id` |
| Cookbook | Hover → floating bubble | Tap → inline card | "View recipe" → `/meals/:id` |
| BBC Good Food | Hover → floating bubble | Tap → inline card | None (Close only) |
| TheMealDB | Hover → floating bubble | Tap → inline card | None (Close only) |

---

## What Was Not Changed

- Smart Plan scoring logic
- Candidate filtering
- Meal generation
- Existing planner search preview (picker panel)
- Existing card actions (lock, refresh, basket, analyse, freeze)
- Any server-side code

---

## Build Results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ Zero errors |
| `npm run build` | ✅ Clean |

---

## Manual Test Steps

1. Generate a Smart Plan — panel switches to smart-review mode
2. **Desktop:** hover the image/title area of any proposed meal → floating preview card appears to the left showing image, title, source, and ingredient list
3. **Mobile:** tap the image/title area → inline preview opens below the card
4. For a My Meals or Cookbook entry on mobile: confirm "View recipe" button navigates to the meal detail page
5. For a BBC Good Food or TheMealDB entry on mobile: confirm only "Close" button appears
6. Press Escape (desktop) or tap Close → preview closes, planner remains usable
7. Confirm existing planner search preview (picker panel hover/tap) still works
8. Confirm lock, refresh, basket, and analyse buttons on each card still work
