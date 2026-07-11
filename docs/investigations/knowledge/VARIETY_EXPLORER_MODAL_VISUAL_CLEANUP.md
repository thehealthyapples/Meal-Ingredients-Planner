# Variety Explorer Modal Visual Cleanup

## Rollback Identifier

**Tag:** `rollback/variety-explorer-modal-visual-cleanup-pre`
**Commit at tag:** `1e83f32` (fix(smart-planner): Tier-3 controlled-repeat fallback for exhausted slot pools)

To roll back:
```
git checkout rollback/variety-explorer-modal-visual-cleanup-pre -- client/src/components/PlantDiversityExplorer.tsx
```

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/components/PlantDiversityExplorer.tsx` | Added `bg-background` to `DialogContent` className; added `backgroundAttachment: "initial"` to inline style |

---

## Root Cause

`dialog.tsx` (the shared Shadcn `DialogContent` component) injects an inline style:

```ts
style={{
  backgroundImage: "url('/orchard-bg.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
}}
```

`PlantDiversityExplorer` already overrode `backgroundImage: "none"` to remove the orchard image, but:
1. No solid background colour class was set — the content surface was fully transparent.
2. `backgroundAttachment: "fixed"` remained, causing any residual background context to anchor to the viewport rather than the element.

Result: the planner's week grid was visible directly through every part of the modal panel (header, table cells, expanded rows, suggestion chips).

---

## Implementation Summary

**Change in `PlantDiversityExplorer.tsx` (line ~469):**

Before:
```tsx
<DialogContent
  className="max-w-2xl max-h-[88vh] flex flex-col overflow-hidden p-0"
  style={{ backgroundImage: "none" }}
  data-testid="dialog-plant-diversity-explorer"
>
```

After:
```tsx
<DialogContent
  className="max-w-2xl max-h-[88vh] flex flex-col overflow-hidden p-0 bg-background"
  style={{ backgroundImage: "none", backgroundAttachment: "initial" }}
  data-testid="dialog-plant-diversity-explorer"
>
```

- `bg-background` — sets the Shadcn CSS-variable-backed solid background colour (opaque in both light and dark mode). All child sections (`bg-muted/20`, `bg-muted/10`, `bg-muted/30`) now render against this solid surface rather than the transparent viewport.
- `backgroundAttachment: "initial"` — resets the `fixed` attachment so no fixed-position background context bleeds in.
- `backgroundImage: "none"` — retained (was already present) to confirm the orchard image is suppressed.

The shared `dialog.tsx` was **not modified** — this change is scoped entirely to `PlantDiversityExplorer`.

---

## What Was Not Changed

- Plant counting logic (`computePlantData`, `isPlantIngredient`, `normaliseForReuse`)
- Variety calculation and `PlantRow` derivation
- Category grid, suggestion chips, or completion logic
- Table sorting / filtering / expand-collapse behaviour
- Planner integration (`weekMeals` prop, `WeekMealEntry` interface)
- Backdrop overlay opacity (remains `bg-black/30` — planner visible as context, not competing)
- Mobile layout or scroll behaviour

---

## Test Results

### Desktop
- Open Variety Explorer → modal surface is fully opaque; planner grid no longer shows through header, table cells, or expanded rows.
- Table rows remain readable with clear separation.
- Herbs & Spices, Olive Oil rows maintain correct contrast against solid background.
- `bg-muted/20` table header and `bg-muted/10` expanded row tints render correctly as subtle elevation cues on top of the solid base.

### Mobile
- Modal layout unchanged; scrolling within `flex-1 overflow-y-auto` body functions normally.
- No layout shift or overflow issues introduced.

---

## Before / After

| Area | Before | After |
|------|--------|-------|
| Modal content background | Fully transparent (orchard image removed but no fill set) | Solid `bg-background` (opaque, theme-aware) |
| Planner text visible through modal | Yes — meal titles, day labels, slot colours all bleed through | No — content panel fully occludes underlying UI |
| Table row readability | Noisy — background interference | Clean — rows render against solid surface |
| Section backgrounds (`bg-muted/*`) | Semi-transparent against viewport | Semi-transparent against solid `bg-background` — subtle tint as intended |
| Backdrop opacity | `bg-black/30` | `bg-black/30` (unchanged — shows planner as context) |
