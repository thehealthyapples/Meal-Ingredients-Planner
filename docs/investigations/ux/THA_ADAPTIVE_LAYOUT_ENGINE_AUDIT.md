# THA Adaptive Layout Engine — Audit & Investigation

**Investigation type:** Read-only audit  
**Date:** 2026-06-16  
**Status:** Complete — no code changes made

---

## 1. Rollback Identifier

```
Tag:    rollback/pre-adaptive-layout-audit
Commit: 9fe2c02  (fix(planner): reconcile boost count between planner card and meal modal)
Branch: main
```

To roll back to this point:
```bash
git checkout rollback/pre-adaptive-layout-audit
# or
git reset --hard 9fe2c02
```

> **Note:** git status at investigation start had two unstaged files  
> (`MealUpliftPanel.tsx`, `weekly-planner-page.tsx`) and two untracked doc files.  
> HEAD was clean. Tag was placed at HEAD.

---

## 2. Current Responsive System

### 2.1 Tailwind Breakpoint Inventory

No custom breakpoints are defined in `tailwind.config.ts`. THA uses default Tailwind screens only.

| Breakpoint | Width   | Usage count (components) | Primary patterns |
|------------|---------|--------------------------|------------------|
| `sm:`      | ≥ 640px | ~200 usages              | show/hide, padding, grid-cols, max-w |
| `md:`      | ≥ 768px | ~40 usages               | nav show/hide, table-cell, a few show/hide |
| `lg:`      | ≥ 1024px | ~60 usages              | grid-cols-3/4, px-8, h-screen |
| `xl:`      | ≥ 1280px | 7 usages                | cookbook xl:grid-cols-4 only |
| `2xl:`     | ≥ 1536px | 0 in components          | not used |

**Key observation:** There is a massive gap between `sm:` (640px) and `lg:` (1024px).  
Tablets (768–1023px) and small laptops (1024–1280px) receive almost no dedicated treatment.  
`md:` barely exists outside the navigation bar. `xl:` and `2xl:` are essentially unused.

### 2.2 Mobile-Detection Methods (Three Different Approaches)

THA uses three separate mobile-detection mechanisms — none of them consistent:

**A) `useIsMobile()` hook** — `client/src/hooks/use-mobile.tsx`
```
Threshold: 768px
Returns:   boolean (isMobile)
Used by:   useIsMobile() → PlannerMealPickerPanel, day-view-drawer, SmartReviewPanelContent, sidebar.tsx
```

**B) Inline `window.innerWidth < 768`**  
Duplicated in: `PlannerMealPickerPanel.tsx:18`, `day-view-drawer.tsx:18`,  
`PlannerAssistantPanel.tsx:442`, `SmartReviewPanelContent.tsx:24`  
(These components define their own local `useLocalMobile()` and also call `useIsMobile()` —  
double-detection in the same file.)

**C) `window.innerWidth < 1024`** — different threshold  
Used by: `PageHeader.tsx:76,94` and `CookbookWorkspacePanel.tsx:42`  
These treat ≥ 768px as still "mobile" — the opposite of the shared hook.

**This inconsistency is a root cause of tablet layout failures.**  
At 900px a user is "desktop" in the nav but "mobile" in CookbookWorkspace and PageHeader.

### 2.3 App Shell Layout

```
ProtectedRoute
  └── div h-[100dvh]
        ├── TrialBanner (demo only)
        ├── TopBar      (always — renders different markup inside via md: classes)
        ├── SiteBanner
        ├── div flex flex-1 overflow-hidden
        │     ├── DesktopSidebar  hidden on < 768px (md:hidden/md:flex)
        │     └── main  flex-1 overflow-y-auto overflow-x-hidden
        └── MobileNav   visible on < 768px (md:hidden)
```

The shell flip happens at `md:` (768px) — which is correct and consistent with the nav only.  
But page layouts inside `<main>` use `sm:` (640px) and `lg:` (1024px) — different points.

### 2.4 CSS-Level Breakpoints

Only two exist in `index.css`:

```css
@media (min-width: 768px) {
  :root { --topbar-h: 44px; }   /* 60px on mobile, 44px on desktop */
}

/* inside @layer utilities: */
.main-safe {
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 80px); /* mobile nav */
}
@media (min-width: 768px) {
  .main-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }
}
```

No CSS-level breakpoints beyond 768px exist. All responsive logic above 768px lives in Tailwind classes.

---

## 3. Hardcoded Sizing Inventory

### 3.1 Fixed Widths (pixel values that cannot flex)

| Value | Count | Contexts |
|-------|-------|----------|
| `w-[220px]` | 7 | DesktopSidebar expanded width |
| `w-[244px]` | 3 | CookbookWorkspacePanel filter sidebar |
| `w-[600px]` | 5 | Dialogs (various) |
| `w-[560px]` | 2 | Dialogs |
| `w-[420px]` | 2 | Dialogs |
| `w-[360px]` | 2 | Dialogs + decorative |
| `w-[280px]` | 2 | Dialogs |
| `w-[200px]` | 3 | Various |
| `w-[180px]` | 4 | Various |
| `w-[160px]` | 6 | Various |
| `w-[140px]` | 7 | SelectTriggers, labels |
| `w-[120px]` | 5 | SelectTriggers |

**Most critical:** `nav-bar.tsx:566` — `w-[220px]` for sidebar.  
**Most critical:** `CookbookWorkspacePanel.tsx:480` — `w-[244px] sticky top-40` filter panel — entirely rigid.

### 3.2 Fixed Heights (viewport-relative and absolute)

| Value | Count | Risk |
|-------|-------|------|
| `h-[85vh]` | 16 | Medium — clips on short viewports |
| `h-[90vh]` | 10 | Medium — clips on short viewports |
| `h-[75vh]` | 4 | Medium |
| `h-[60vh]` | 2 | Medium |
| `h-[100dvh]` | 8 | OK — dynamic viewport |
| `h-[92dvh]` | 3 | OK — dynamic viewport |
| `h-[56px]` | 4 | TopBar height — fine |
| `h-[60px]` | 3 | Various — fine |
| `h-[300px]` | 1 | Fixed height card |
| `h-[220px]` | 1 | Fixed height panel |
| `h-[120px]` | 2 | Fixed height panels |

**vh-based heights are problematic on landscape phone/tablet** where viewport height is much less than portrait. `h-[85vh]` on a landscape phone (360px tall) = only 306px of usable space.

### 3.3 Dialog/Sheet Max-Widths (hardcoded pixel values)

Found scattered across all pages and components:

```
sm:max-w-[760px]   — PlannerScanReview (widest dialog in the app)
sm:max-w-[640px]   — weekly-planner-page meal detail sheet  
sm:max-w-[600px]   — meals-page (×5), RecipeScanReview, create-meal-modal
sm:max-w-[580px]   — scan-confirm-dialog
sm:max-w-[560px]   — ShoppingListScanReview, shopping dialogs (×2)
sm:max-w-[540px]   — ShoppingListScanReview
sm:max-w-[500px]   — meals-page
sm:max-w-[420px]   — shopping dialogs (×2)
sm:max-w-[360px]   — shopping workspace
sm:max-w-lg        — day-view-drawer, camera-modal
sm:max-w-md        — dialogs (×5)
sm:max-w-sm        — dialogs (×6) — most common for simple confirmation
max-w-sm           — 15 dialog instances
max-w-md           — 6 instances
max-w-2xl          — shopping list price comparison
max-w-4xl          — shopping list price comparison
```

**23+ different dialog widths across the app.** No central system.

### 3.4 Hardcoded Font Sizes (pixel values that don't scale)

| Value | Count | Risk |
|-------|-------|------|
| `text-[10px]` | 430 | Very high — unreadable at 1x scaling |
| `text-[11px]` | 160 | High |
| `text-[9px]` | 22 | Very high |
| `text-[10.5px]` | 16 | High |
| `text-[12px]` | 13 | Medium |
| `text-[22px]` | 5 | PageHeader titles — OK at this size |

The density of `text-[10px]` and `text-[11px]` usages (590+ instances total) means many labels are at the absolute minimum readable size with no room to scale down on smaller screens.

### 3.5 Horizontal Scroll Regions

| Location | Class | Risk |
|----------|-------|------|
| `weekly-planner-page.tsx:2253` | `overflow-x-auto` on desktop grid | Tablet must scroll |
| `shopping-list-page.tsx:3812` | `overflow-x-auto` on price table | Always forced scroll |
| `shared-plan-page.tsx:41` | `min-w-[520px]` table | Forces scroll on mobile |
| `import-diary-modal.tsx:347` | `overflow-x-auto` table | Forced scroll |
| `templates-panel.tsx:119` | `overflow-x-auto` | Forced scroll |
| `product-picker-sheet.tsx:185` | `overflow-x-auto scrollbar-none` | Chip strip (acceptable) |

The planner grid's desktop version (`hidden sm:block overflow-x-auto`) is the most significant: tablet users (768–1280px) see the full 7-column desktop grid in a horizontal scroll container rather than a purpose-built tablet layout.

---

## 4. Tablet Problem Areas

The gap between 640px (`sm:`) and 1024px (`lg:`) is the primary failure zone.  
At 768–1023px, THA renders "desktop" layouts in most places but has only ~35% of the width.

### Critical tablet failures:

**1. Planner page** (`weekly-planner-page.tsx`)  
- Mobile view: stacked day cards (`sm:hidden`)  
- Desktop view: 7-column horizontal-scroll grid (`hidden sm:block overflow-x-auto`)  
- Tablet (768px): gets the desktop grid in a horizontal scroll box — uncomfortably cramped

**2. Cookbook workspace** (`CookbookWorkspacePanel.tsx`)  
- Filter sidebar is `w-[244px] sticky` — rigid, no collapse on tablet  
- Triggers at `1024px` mobile threshold, so 768–1023px shows full sidebar eating ~32% of width  
- Grid: `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` — jumps from 2 to 3 at 1024px only

**3. Diary page** (`food-diary-page.tsx:1613`)  
```
lg:grid-cols-[minmax(0,1fr)_280px_220px]
```
Fixed 280px + 220px sidebars only activate at 1024px+. Below that: single stacked column.  
On a 1024px viewport the content column gets: 1024 - 280 - 220 - gaps = ~490px. Tight.

**4. PlannerAssistantPanel** (`PlannerAssistantPanel.tsx`)  
- Inline `window.innerWidth < 768` to set workspace section defaults  
- Panels (shopping, plan week, add meals, manage) default to collapsed on mobile but open on desktop  
- At 800px: panels default open but there's no room — nothing collapses them  

**5. Shopping list table** (`shopping-list-page.tsx`)  
- `min-w-[520px]` table inside `overflow-x-auto` — tablet always scrolls horizontally

**6. Navigation** (`nav-bar.tsx`)  
- Desktop sidebar at 768px+: `w-[220px]` or `w-16` collapsed  
- At 768px the sidebar + content area is tight — no intermediate "icon-only always" mode for tablet

---

## 5. Adaptive Density Model — Feasibility

### 5.1 Proposed Density Tiers

| Tier | Viewport width | Device context | Expected experience |
|------|---------------|----------------|---------------------|
| **COMPACT** | < 640px | Phone portrait, split-screen, small embedded | Smaller cards, fewer chips, tighter padding, stacked layouts |
| **COMFORTABLE** | 640–1279px | Tablet, small laptop, phone landscape | Current desktop baseline — 2-3 columns, medium padding |
| **EXPANDED** | ≥ 1280px | Large desktop, ultrawide | More whitespace, more metadata visible, wider sidebars |

### 5.2 Derivation Signals

All these can be read from the browser without any library:

```
viewport width      → primary density tier signal
window.innerWidth   (already used everywhere)

touch capability    → isTouch
navigator.maxTouchPoints > 0

pointer precision   → isCoarsePointer
window.matchMedia("(pointer: coarse)")

orientation         → orientation
window.matchMedia("(orientation: landscape)")

pixel density       → isHighDPI
window.devicePixelRatio > 1.5

ultrawide           → isUltrawide
window.innerWidth >= 1536 (or 1920)
```

### 5.3 Derived Compound states

```
isPhone     = COMPACT && isTouch
isTablet    = COMFORTABLE && isTouch
isLaptop    = COMFORTABLE && !isTouch
isDesktop   = EXPANDED && !isTouch
```

### 5.4 Is COMPACT / COMFORTABLE / EXPANDED sufficient?

**Yes, for most of THA's needs.** The three-tier model maps naturally to the existing design intent:

- COMPACT maps to "mobile": stacked, reduced metadata, collapsed sidebars
- COMFORTABLE maps to "current desktop": 2–3 columns, workspace sidebars open by default
- EXPANDED adds: 4-column cookbook grids, wider planner columns, visible nutrition metadata

The key improvement over the current system: **COMFORTABLE covers 640–1279px** instead of falling through the cracks between sm: and lg:.

### 5.5 What the hook would look like (conceptual — not implemented)

```typescript
// NOT implemented — conceptual for investigation only
type Density = "compact" | "comfortable" | "expanded";

interface AdaptiveDensityResult {
  density: Density;
  isCompact: boolean;
  isComfortable: boolean;
  isExpanded: boolean;
  isTouch: boolean;
  isCoarsePointer: boolean;
  orientation: "portrait" | "landscape";
  isUltrawide: boolean;
}
```

The hook would replace:
- `useIsMobile()` (768px binary)
- Inline `window.innerWidth < 768` (×4 locations)
- Inline `window.innerWidth < 1024` (×2 locations)
- CSS class-only responsive switches like `sm:hidden hidden sm:block`

---

## 6. Component Classification Matrix

### Class A — Already responds naturally

These components adapt well without structural changes needed.

| Component | Why it works |
|-----------|--------------|
| `PageHeader` | Mobile collapse logic, sm:/lg: padding, chevron toggle |
| `TopBar` + `MobileNav` | Clean md: split, correct 768px threshold |
| `DesktopSidebar` | Collapsible, renders nothing on mobile |
| Profile cards | `p-4 sm:p-5`, fluid content |
| Auth page | lg:grid-cols-2 split, appropriate for its usage |
| Onboarding | Card-based, stacks cleanly |
| Home page | lg:grid-cols-2, sm: padding, responsive CTAs |
| Simple dialogs (max-w-sm) | Fit within most viewports |
| `product-picker-sheet` | Sheet-based, bottom drawer, appropriate |

### Class B — Needs small changes

These are close but have one or two hardcoded values that cause problems at certain sizes.

| Component | Issue | Fix complexity |
|-----------|-------|---------------|
| `PlannerMealCard` | `sm:` shows 2nd chip, `lg:` shows labels — correct but uses Tailwind classes, not density | Low |
| Cookbook grid | `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` — no tablet intermediate | Low |
| Dashboard grid | `grid-cols-2 lg:grid-cols-4` — fine but could be 3 on tablet | Low |
| `PageHeader` controlBar | Padding always same, could tighten on compact | Low |
| Shopping filter chips | `overflow-x-auto scrollbar-none` strip — acceptable on mobile, could expand on desktop | Low |
| Dialogs (sm:max-w-[600px]) | Correct pattern, just inconsistent values | Medium |
| `AdaptationReviewSheet` | `h-[92dvh]` bottom sheet — good, minor height tuning possible | Low |
| Pantry cards | `p-4 sm:p-5` — already good | None |
| `day-view-drawer` | Renders as Dialog on desktop, Drawer on mobile — good pattern | None |

### Class C — Requires adaptive density support

These have structural problems that require density-aware rethinking.

| Component | Problem | Density fix needed |
|-----------|---------|-------------------|
| **Planner grid** (`weekly-planner-page.tsx:1980,2253`) | Dual DOM trees (mobile vs desktop) with `sm:hidden / hidden sm:block` — no tablet state | COMFORTABLE layout as true intermediate |
| **PlannerAssistantPanel** | Three separate mobile checks (768 hook + inline 768 + inline 1024); workspace sections default blindly on/off | useAdaptiveDensity to control section defaults |
| **CookbookWorkspacePanel** | `w-[244px]` rigid sidebar, 1024px threshold contradicts 768px nav threshold | Sidebar collapses to icon strip at COMFORTABLE |
| **Diary layout** (`food-diary-page.tsx`) | `lg:grid-cols-[minmax(0,1fr)_280px_220px]` — fixed pixel sidebars | Fluid cols or single col until EXPANDED |
| **Shopping list table** | `min-w-[520px]` inside scroll container | Card-based layout at COMPACT, table at COMFORTABLE+ |
| **PlannerScanReview dialog** | `sm:max-w-[760px]` — wider than most mobile viewports (375–414px) | Density-aware: full-screen at COMPACT, 640px at COMFORTABLE, 760px at EXPANDED |
| **ShoppingListView** virtual list | `style={{ height: "calc(100vh - 9rem)" }}` — hardcoded rem offset, brittle | Use dvh or flex-based sizing |
| **SmartReviewPanelContent** | Duplicate local isMobile state + useIsMobile() hook | Consolidate to single hook |
| **Drawers/Sheets heights** | Mix of 85vh, 88vh, 90vh, 92dvh — no system | Standardise by density |
| **MealImageWidget** | `hidden sm:block` for some UI — fine, but should be density-aware | Low priority |

---

## 7. Migration Strategy

### Phase 1 — Adaptive Density Hook (Enabler)

**Goal:** Replace the three inconsistent detection methods with a single source of truth.

**Scope:**
- Create `useAdaptiveDensity()` in `client/src/hooks/`
- Wire into a thin context provider in `App.tsx`
- Export convenience aliases: `useIsCompact()`, `useIsExpanded()`, etc.

**What it replaces:**
- `useIsMobile()` at 768px
- `window.innerWidth < 768` inline (×4 files)
- `window.innerWidth < 1024` inline (×2 files — PageHeader, CookbookWorkspacePanel)

**Effort:** ~1 day  
**Risk:** Low — no UI changes, purely adds infrastructure  
**Backwards compatibility:** High — existing hook continues to export `useIsMobile()` as a shim

---

### Phase 2 — Cards, Chips, Page Headers

**Goal:** Apply density to the repeating atomic units so they scale correctly at every tier.

**Scope:**
- `PlannerMealCard`: replace `hidden sm:inline-flex` / `hidden lg:inline` with density checks
- Cookbook card grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (3 at COMFORTABLE)
- Dashboard grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- `PageHeader`: unify the `< 1024` check with the density hook
- Dialog widths: define 3 standard dialog sizes (compact=full, comfortable=600px, expanded=760px)

**Effort:** ~2 days  
**Risk:** Low — visual changes, no data path changes  
**Backwards compatibility:** High — visual refinements only

---

### Phase 3 — Planner, Cookbook, Shopping

**Goal:** Replace dual-DOM-tree mobile/desktop switches with single density-aware tree.

**Scope:**
- Planner grid: add COMFORTABLE tier as 3-column or 2-column adaptive view instead of scroll
- `PlannerAssistantPanel`: consolidate mobile detection, density-based section defaults
- `CookbookWorkspacePanel`: collapse filter sidebar to icon strip at COMFORTABLE, full at EXPANDED
- Shopping list: card layout at COMPACT, table layout at COMFORTABLE+

**Effort:** ~4–6 days  
**Risk:** Medium — planner is the most complex component (4,187 lines), high interaction surface  
**Backwards compatibility:** Medium — planner layout changes are user-visible

---

### Phase 4 — Dialogs, Drawers, Tables

**Goal:** Standardise remaining floating surfaces.

**Scope:**
- Audit all 23+ dialog widths and reduce to 3 canonical sizes
- Standardise sheet/drawer heights to density-aware values
- Fix `shopping-list-page` table with `min-w-[520px]` — convert to responsive card/table toggle
- Fix `food-diary-page` diary layout sidebars to fluid-width or collapse

**Effort:** ~2–3 days  
**Risk:** Low — surface-level layout changes  
**Backwards compatibility:** High

---

### Effort & Risk Summary

| Phase | Effort | Risk | Backwards compat |
|-------|--------|------|-----------------|
| 1. Density hook | Low (1 day) | Low | Full |
| 2. Cards/chips/headers | Medium (2 days) | Low | High |
| 3. Planner/Cookbook/Shopping | High (4–6 days) | Medium | Medium |
| 4. Dialogs/Drawers/Tables | Medium (2–3 days) | Low | High |
| **Total** | **~10–12 days** | **Medium overall** | **High** |

---

## 8. Answering the Key Questions

### Q1: Can THA naturally adapt to phones, tablets, laptops, ultrawides, split-screen?

**Currently: No.**

- Phone portrait: workable but small fonts, crowded cards
- Tablet (768–1023px): worst tier — gets desktop grid in a horizontal scroll box; planner, cookbook workspace both misbehave
- Small laptop (1024–1280px): mostly correct but some components still cramped
- Large desktop (1280–1536px): fine, underutilised whitespace
- Ultrawide (1536px+): no treatment at all — content lakes with max-w-screen-xl on 2560px display
- Split screen: equivalent to tablet, same failures

**With adaptive density: Yes** — all six contexts map cleanly to COMPACT / COMFORTABLE / EXPANDED.

---

### Q2: Would COMPACT / COMFORTABLE / EXPANDED be sufficient?

**Yes, with one addition: `isTouch` as a separate signal.**

Three density tiers handle viewport width. But touch vs mouse affects:
- Hover previews (`PlannerMealPickerPanel` disables hover on isMobile)
- Drag handles (visible on desktop, hidden on touch)
- Tap targets (min 44px height on touch)

The hook returning both `density` and `isTouch` covers all real cases without adding a 4th tier.

---

### Q3: Can adaptive density become THE design system for THA?

**Yes — and it should be built as such from phase 1.**

The density value would become the single input to all spacing, sizing, and layout decisions:

```
density = compact    → padding-3, chips hidden, card h-auto
density = comfortable → padding-4/5, 1 chip, normal cards
density = expanded    → padding-6, 2 chips, larger cards, extra metadata
```

Dialog widths, planner column widths, cookbook grid columns, chip visibility, 
sidebar open/collapsed — all become a lookup from density.

This would eliminate the recurring pattern of fixing one screen at a time.

---

### Q4: What existing code already supports this?

| Code | How it already helps |
|------|---------------------|
| `useIsMobile()` hook | Correct pattern, just wrong threshold for tablet support |
| `PageHeader` scroll-collapse | Solid pattern, extend to density levels |
| `PlannerMealCard` sm:/lg: chips | Already does exactly what density tiers would do — just via Tailwind |
| `day-view-drawer` (Dialog vs Drawer) | Good density-aware branching pattern |
| `--topbar-h` CSS variable | Good precedent for density-driven CSS tokens |
| `.main-safe` utility | Good responsive padding precedent |
| `product-picker-sheet` (bottom sheet) | Right approach for compact — extend to other drawers |
| `camera-modal` (full-screen at sm, modal at sm+) | Perfect compact/comfortable pattern to copy |
| Realm colour system (CSS vars per `data-realm`) | Model for density tokens — same architecture |

---

### Q5: What currently blocks it?

| Blocker | Severity | Breaks |
|---------|----------|--------|
| Three different mobile thresholds (768/1024/class) | High | Consistent density derivation |
| Planner dual DOM trees (`sm:hidden / hidden sm:block`) | High | Single-tree density rendering |
| 430+ `text-[10px]` instances | Medium | Minimum font size at compact |
| `CookbookWorkspacePanel` `w-[244px]` rigid sidebar | Medium | Comfortable layout |
| 23+ different dialog widths | Medium | Standard dialog density |
| No CSS density tokens | Medium | CSS-driven density scaling |
| `useIsMobile()` returns only boolean, no tiers | Medium | Density hook requires refactor |
| `PlannerAssistantPanel` (1,952 lines) mixes layout + logic | Medium | Clean density extraction |
| `vh` heights without `dvh` fallback | Low | Landscape phone/tablet |

---

## 9. Risks

### Risk 1 — Planner complexity (HIGH)
The planner page is 4,187 lines. The dual-DOM-tree mobile/desktop pattern is deeply embedded. 
Refactoring it to a single density-aware tree touches drag-and-drop logic, meal slot rendering,
and mobile gesture handling simultaneously.  
**Mitigation:** Phase 3 should tackle planner in isolation on a feature branch.

### Risk 2 — Regression at existing sizes (MEDIUM)
Any change to the tablet tier (640–1023px) could introduce regressions at a breakpoint
that currently has few users and limited test coverage.  
**Mitigation:** Phase 2 changes must be reviewed at 375px, 768px, 1024px, and 1440px.

### Risk 3 — Touch detection false positives (LOW)
`navigator.maxTouchPoints > 0` is true on some Windows laptops with touch screens
even when used with mouse+keyboard. This could trigger compact/touch behaviour incorrectly.  
**Mitigation:** Use `pointer: coarse` media query as the primary touch signal (more accurate).

### Risk 4 — Text size floor (MEDIUM)
430+ usages of `text-[10px]` mean that a COMPACT density reduction in font size
would make labels unreadably small. Compact mode must not reduce font size below 10px —
it can only reduce padding and card height.  
**Mitigation:** COMPACT density reduces spacing only, not font sizes.

### Risk 5 — User-visible planner layout change (MEDIUM)
Tablet users who have adapted to the horizontal-scroll planner grid would see a changed
layout if Phase 3 introduces a true tablet layout. Not a regression — an improvement —
but one that needs user communication.

---

## 10. Recommendation

### Proceed. The adaptive density model is the right architectural direction.

THA has organically outgrown per-screen fixes. The codebase now has:
- 3 different mobile detection thresholds
- 4 inline copies of the mobile-check pattern
- 23+ different dialog widths
- 0 tablet-specific layouts despite a clear tablet use case

The three-tier COMPACT / COMFORTABLE / EXPANDED model is:
- Sufficiently granular for THA's actual screen range
- Simple enough to communicate to the team
- Derivable from signals THA can already read (viewport width, pointer type)
- Extensible via `isTouch`, `isUltrawide`, `orientation` without adding new tiers

**Recommended entry point:** Phase 1 (density hook) as a standalone PR with no UI changes.
This gives THA a shared vocabulary and a migration path without risk. Phase 2 (cards/chips)
follows immediately as proof of concept. Phases 3 and 4 can be scheduled around feature work.

**Do not start with Phase 3 (planner).** The planner carries the most risk and should only
move after Phase 1 and 2 have demonstrated the density hook pattern working in production.

---

## 11. Confirmation

> **No code changes were made during this investigation.**  
> All findings are read-only observations.  
> No hooks, CSS variables, design tokens, Tailwind config changes, or component modifications  
> were created. The only git operation performed was creating the rollback tag.

Files read (not modified):
- `client/src/hooks/use-mobile.tsx`
- `client/src/App.tsx`
- `client/src/index.css`
- `tailwind.config.ts`
- `client/src/components/PageHeader.tsx`
- `client/src/components/nav-bar.tsx` (grep)
- `client/src/components/CookbookWorkspacePanel.tsx` (grep)
- `client/src/components/PlannerAssistantPanel.tsx` (grep)
- `client/src/components/PlannerMealCard.tsx` (partial)
- `client/src/components/layout/orchard-shell.tsx`
- `client/src/pages/weekly-planner-page.tsx` (grep)
- `client/src/pages/meals-page.tsx` (grep)
- `client/src/pages/shopping-list-page.tsx` (grep)
- `client/src/pages/pantry-page.tsx` (grep)
- `client/src/pages/food-diary-page.tsx` (grep)
- `client/src/pages/profile-page.tsx` (grep)
- `client/src/pages/dashboard.tsx` (grep)
- All source files via grep for breakpoint class inventory
