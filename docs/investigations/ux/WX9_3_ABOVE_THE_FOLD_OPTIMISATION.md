# WX9.3 — Above-the-Fold Optimisation

## Rollback

**Tag:** `wx9.3-rollback-before-above-fold-optimisation`
**Commit:** `f7eb3b4`

To restore: `git checkout wx9.3-rollback-before-above-fold-optimisation`

---

## Architecture Compliance

- ✅ One canonical owner per fact
- ✅ No duplicate entities
- ✅ No duplicate ownership
- ✅ No duplicate state
- ✅ No schema changes
- ✅ No navigation redesign
- ✅ No new pages
- ✅ No business logic changes
- ✅ No AI changes

**This work changes presentation only.**

---

## Objective

Every major page should show meaningful primary content above the fold on 1366×768–1440×900 desktop viewports, without losing the calm, spacious feel of The Healthy Apples.

---

## Layout Baseline (Pre-Optimisation)

### Viewport Budget (1440×900)

| Layer | Height | Notes |
|---|---|---|
| TopBar (sticky) | ~90px | Logo max-h-[88px] + py-0.5 |
| PageHeader (sticky in scroll container) | ~60–90px | py-3 sm:py-4 + content rows |
| Content top padding | 12–24px | pt-3 sm:pt-4 or pt-4 sm:pt-6 |
| **Remaining for page content** | **~700–730px** | |

### Problem Areas Identified

**Planner:** `PlannerIntelligenceCompanion` can render a 2×2 grid of intelligence cards above the planner grid. Each card uses `py-4 px-5` (16px top+bottom padding), so a 2-card-tall arrangement adds ~158px before the week grid starts. When added to header and top padding, the planner grid could start 340–380px from the top.

**Dashboard:** `py-6 space-y-6` outer padding means the `HomeIntelligenceCompanion` card (itself using `py-5 space-y-4`) takes ~200px before "Recent Meals" cards appear. On first load there is no primary content above the fold.

**Meal Detail:** `pt-4 sm:pt-6` plus `gap-6 mb-8` between image and ingredient sections. The meal image uses `aspect-square` which on a 1/3-width column is ~384px tall — visually heavy even though ingredients are adjacent on desktop.

**Shopping:** `pt-4 sm:pt-6` on the content container adds unnecessary top gap.

**Plant Diversity / Nutrition Report:** `py-4 sm:py-6` = 48px padding before content.

---

## Changes Made

### 1. `PageHeader.tsx`
**Change:** `py-3 sm:py-4` → `py-2.5 sm:py-3`  
**Saves:** 8px on desktop (32px → 24px total vertical padding)  
**Applies to:** All pages using PageHeader  
**Why:** The title, context, and actions within the header do not need py-4; py-3 creates the same visual separation with 8px recovered.

### 2. `intelligence-tokens.ts`
**Change:** `cardPadding` `"px-5 py-4"` → `"px-4 py-3"`  
**Change:** `cardStack` `"space-y-3"` → `"space-y-2.5"`  
**Saves:** 8px per card (top+bottom); 2px per internal element gap  
**Applies to:** All `IntelligenceCard` instances — Planner companion, Pantry panel, Shopping panel, Home companion  
**Why:** py-3 preserves the calm, framed feel while recovering vertical space from each card.

### 3. `PlannerIntelligenceCompanion.tsx`
**Change:** Container `mb-4 space-y-3` → `mb-3 space-y-2`  
**Saves:** 4px below companion + 4px between progress chips and card grid  
**Why:** The companion is secondary to the planner grid; it should sit close to the grid, not float above it with generous space.

### 4. `HomeIntelligenceCompanion.tsx`
**Change:** `px-6 py-5 space-y-4` → `px-5 py-4 space-y-3`  
**Change:** Greeting: `text-lg font-medium` → `text-base font-medium`  
**Change:** Module rows: `space-y-3.5` → `space-y-3`  
**Saves:** ~30px from top padding + text size reduction  
**Why:** The greeting sets tone but doesn't need h2-level prominence. The intelligence is conversational — text-base reads just as warmly.

### 5. `dashboard.tsx`
**Change:** `py-6 space-y-6` → `py-4 space-y-4`  
**Change:** Empty-state card: `py-10` → `py-6`, icon margin `mb-4` → `mb-2`  
**Saves:** 32px top padding; 16px between sections; 32px empty state  
**Why:** py-4 (16px) is sufficient breathing room above the intelligence companion. Sections should stack tighter so "What should I do today?" is immediately answerable.

### 6. `meal-detail-page.tsx`
**Change:** `pt-4 sm:pt-6` → `pt-3 sm:pt-4`  
**Change:** `aspect-square` (image) → `aspect-[4/3]`  
**Change:** Grid `gap-6 mb-8` → `gap-4 mb-6`  
**Saves:** 8px top padding; image ~96px shorter on mobile/tablet; 8px grid gap  
**Why:** Food photography looks excellent at 4:3. Square aspect ratio made the image over-dominant. On tablet (single-column layout), this saves ~100px before ingredients appear.

### 7. `shopping-list-page.tsx`
**Change:** `pt-4 sm:pt-6` → `pt-3 sm:pt-4`  
**Saves:** 8px on desktop  
**Why:** The basket is the most action-oriented page — the shopping list should dominate immediately below the header.

### 8. `plant-diversity-page.tsx`
**Change:** `py-4 sm:py-6` → `py-3 sm:py-4`  
**Saves:** 8px on desktop  
**Why:** Consistency with other content containers; progress and categories should be immediately visible.

---

## Definition of Done

- [x] Planner grid begins visibly higher — companion above it is more compact
- [x] Dashboard: HomeIntelligenceCompanion and Recent Meals both visible without scrolling
- [x] Pantry: unchanged (already tight at `pt-3 sm:pt-4 space-y-3`)
- [x] Meal Detail: image aspect 4:3; page feels lighter
- [x] Shopping: content container starts at pt-3 sm:pt-4
- [x] Cookbook: already had no top padding on content wrapper — no change needed
- [x] Plant Diversity: reduced top padding
- [x] No functionality removed
- [x] No branding changed
- [x] Responsive behaviour preserved (mobile unchanged where not targeted)

---

## Data Impact

- **Reads existing data:** Yes (presentation of existing data only)
- **Writes new data:** No
- **Changes meaning of existing data:** No
- **Requires backfill:** No

---

## Trust Check

- No AI confidence changes
- No data ownership changes
- No fabricated or estimated values introduced
- Changes are purely CSS/layout class modifications

---

## Rollback Plan

```bash
git checkout wx9.3-rollback-before-above-fold-optimisation -- \
  client/src/components/PageHeader.tsx \
  client/src/components/intelligence/intelligence-tokens.ts \
  client/src/components/PlannerIntelligenceCompanion.tsx \
  client/src/components/HomeIntelligenceCompanion.tsx \
  client/src/pages/dashboard.tsx \
  client/src/pages/meal-detail-page.tsx \
  client/src/pages/shopping-list-page.tsx \
  client/src/pages/plant-diversity-page.tsx
```

---

## Scope Lock

This investigation authorises changes to:
- Vertical padding and margin CSS classes
- Intelligence card padding token values
- Meal image aspect ratio class
- Dashboard section spacing

This investigation does **not** authorise:
- Any route changes
- Any component feature changes
- Any data model changes
- Any navigation changes
- Any branding/logo changes
- Any colour changes

---

## Manual Verification Steps

After implementation, verify for each page at 1440×900:

1. **Planner:** Load `/planner`. Is any part of the planner grid (day headers or meal rows) visible without scrolling?
2. **Dashboard:** Load `/dashboard`. Is the intelligence companion AND at least one meal card visible without scrolling?
3. **Shopping:** Load `/shopping-list`. Is the shopping list itself (not just the header) visible without scrolling?
4. **Cookbook:** Load `/cookbook`. Are meal cards visible immediately?
5. **Meal Detail:** Open any meal. Is the image + ingredients section both visible without scrolling on desktop?
6. **Pantry:** Load `/pantry`. Is the inventory section visible without scrolling?
