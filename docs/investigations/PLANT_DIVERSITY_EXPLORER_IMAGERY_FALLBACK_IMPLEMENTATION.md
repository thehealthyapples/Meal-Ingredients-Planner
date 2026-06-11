# Plant Diversity Explorer — Imagery Fallback Implementation

**Date:** 2026-06-10
**Status:** Complete

---

## Rollback Identifier

```
rollback/pre-plant-explorer-imagery-fallback
```

To revert:
```bash
git checkout rollback/pre-plant-explorer-imagery-fallback -- client/src/components/PlantDiversityExplorer.tsx
```

---

## Objective

Add visual emoji fallback markers to each plant row in the Plant Diversity Explorer, using only the existing ingredient imagery infrastructure. No real images added.

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/components/PlantDiversityExplorer.tsx` | Added `getCategoryEmoji` import; replaced commented image placeholder with emoji span |

No other files modified.

---

## Implementation Detail

### What changed

In `PlantTableRow`, the commented-out image placeholder was replaced with an active emoji span:

```tsx
// Before (commented placeholder):
{/* Image placeholder — clean extension point for imagery layer */}
{/* <div className="h-6 w-6 rounded bg-muted/40 flex-shrink-0" /> */}

// After:
<span className="text-base leading-none flex-shrink-0" aria-hidden="true">
  {getCategoryEmoji(row.category)}
</span>
```

The import was added alongside existing imports:

```tsx
import { getCategoryEmoji } from "@/lib/ingredient-imagery";
```

### Functions used

- `getCategoryEmoji(category?: string): string` — from `client/src/lib/ingredient-imagery.ts`

`getIngredientImageWithFallback` was intentionally not used. Since `IMAGE_MAP` is currently empty, calling it would always resolve to the emoji-fallback tier anyway, and the emoji is all that is needed at this stage. Using `getCategoryEmoji` directly is simpler and avoids rendering a no-op `<img>` element.

---

## Fallback Behaviour

`getCategoryEmoji` resolves through `CATEGORY_EMOJI_MAP` keyed on the `PlantCategory` string:

| Category | Emoji |
|----------|-------|
| Vegetables | 🥦 |
| Fruits | 🍎 |
| Whole Grains | 🌾 |
| Herbs & Spices | 🌿 |
| Olive Oil | 🫒 |
| Legumes | 🫘 |
| Seeds | 🌻 |
| Nuts | 🥜 |
| Fermented Foods | 🫙 |
| Leafy Greens | 🥬 |
| Mushrooms | 🍄 |
| Healthy Fats | 🥑 |
| Unknown / undefined | 🌱 |

The Explorer uses `getPlantCategory()` to assign a `PlantCategory` to every row before they reach the table, so the generic `🌱` fallback will only appear for an ingredient that fails category classification.

---

## UI Appearance

Each plant row now renders:

```
▶  🥦  Spinach                          Iron · Folate
▶  🍅  Tomatoes                         Lycopene · Vitamin C
▶  🌻  Pumpkin Seeds                    Zinc · Magnesium
▶  🫙  Sauerkraut                       —
```

The emoji is `aria-hidden="true"` so screen readers skip it — the row name is already the accessible label.

Grid layout is unchanged: `grid-cols-[1fr_auto]` mobile / `md:grid-cols-[1fr_auto_auto_auto]` desktop. The emoji sits inline inside the first cell's flex row alongside the existing chevron and name span. No layout shift on mobile.

---

## TypeScript Result

`npx tsc --noEmit` produced zero errors in:
- `client/src/components/PlantDiversityExplorer.tsx`
- `client/src/lib/ingredient-imagery.ts`

Pre-existing errors in unrelated `server/tests/` files were unchanged.

---

## Definition of Done — Verification

| Check | Result |
|-------|--------|
| Plant rows show safe fallback emoji/category imagery | ✓ |
| No broken `<img>` tags | ✓ — no `<img>` used at all |
| Empty `IMAGE_MAP` causes no issues | ✓ — `getCategoryEmoji` does not touch `IMAGE_MAP` |
| Existing Explorer plant count unchanged | ✓ — count logic untouched |
| Existing row expansion unchanged | ✓ — expanded content untouched |
| Mobile layout remains clean | ✓ — emoji is inline in existing flex cell |
| No real images added | ✓ |
| No external URLs added | ✓ |

---

## What Was NOT Changed

- Plant counting logic
- Category classification
- `CATEGORY_SUGGESTIONS`
- Nutrition Benefit Library
- `IMAGE_MAP` (remains empty)
- Any schema, API, or server file
- Any real image file
