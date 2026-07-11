# WX10E_REV1 — Desktop & Mobile Navigation and Workspace Standardisation

**Branch:** safety/preserve-since-last-prod-20260617-1613  
**Date:** 2026-06-27  
**Rollback tag:** `wx10e-rev1-rollback-20260627-pre-implementation`

---

## Architecture Compliance Audit

| Principle | Status |
|---|---|
| One canonical navigation system | ✓ DesktopSidebar + MobileNav only |
| One owner of workspace navigation | ✓ WorkspaceHeader owns workspace actions |
| One Workspace Header architecture | ✓ workspace-header.tsx |
| Desktop and mobile use identical workspace ordering | ✓ confirmed (see NAV_ITEMS_MAIN vs MOBILE_BOTTOM_ITEMS) |
| Platform differences only where required by screen size | ✓ |
| Extend existing components | ✓ no new components |
| No schema changes | ✓ |
| No API changes | ✓ |
| No business logic changes | ✓ |

---

## Pre-implementation State

- Desktop sidebar: long logo expanded, apple icon collapsed ✓
- Mobile nav: Planner, Nutrition, Cookbook, Pantry, Analyser, Diary ✓
- Desktop nav order: Planner, Nutrition, Cookbook, Pantry, Analyser, Shopping, Diary ✓
- Dashboard NOT in navigation ✓
- Shopping NOT in mobile nav ✓
- Shopping accessed via basket icon in header ✓
- Basket icon currently uses golden `hsl(62,...)` colour — needs Shopping teal `hsl(190,...)`
- Sidebar brand zone and workspace header both use `realm-header-bg` but visually broken by `border-r border-border` on aside
- Pantry page: `pantrySearch` state wired to WorkspaceHeader but NOT connected to FoodPantrySection filtering — card has its own internal search/add input

---

## Changes

### 1. Basket Icon Colour → Shopping Workspace Teal

**Files:** `workspace-header.tsx`, `nav-bar.tsx`

The basket button previously used `hsl(62,...)` (warm golden olive). Changed to Shopping workspace colour `hsl(190,...)` (market teal) to match the Shopping nav item colour across:
- WorkspaceHeader desktop basket button
- WorkspaceHeader mobile basket button
- TopBar desktop basket button (legacy — not used in authenticated routes but kept consistent)
- TopBar mobile basket button

### 2. Sidebar Visual Continuity

**File:** `nav-bar.tsx` — DesktopSidebar

The `border-r border-border` on the aside element created a gray vertical line cutting through the realm-coloured brand zone, visually disconnecting it from the workspace header.

Fix:
- Removed `border-r border-border` from the `<aside>` element
- Added `border-r` to the brand zone div — inherits `realm-header-border` so the right border matches the bottom border colour, creating a seamless horizontal band from sidebar left edge through to workspace header right edge
- Added `border-r border-border` to a new wrapper div around the collapse toggle and nav body

### 3. Pantry Search → Workspace Header

**File:** `pantry-page.tsx`

The `pantrySearch` state was already passed to `WorkspaceHeader` as the `search` prop, but the value was not connected to the actual filtering logic in `FoodPantrySection`. The section had an independent `query` state and a combined search+add input inside its card.

Fix:
- Added `searchFilter?: string` prop to `FoodPantrySection`
- `displayedItems` useMemo now uses `searchFilter` for filtering when provided (falls back to internal `query`)
- Removed the search input from inside `FoodPantrySection` card — search lives exclusively in WorkspaceHeader
- Retained the add-only input inside the card (simplified — no search icon, add-focused placeholder)
- Added `searchFilter={pantrySearch}` prop from `PantryPage` → `FoodPantrySection`
- HomePantrySection: search+add input retained (it is secondary content — drawer-based on mobile, smaller column on desktop; its internal query is appropriate)

---

## Implementation Status

All changes implemented and TypeScript-verified (no client-side errors).

| Change | Status |
|---|---|
| Basket icon → Shopping teal hsl(190,...) in workspace-header.tsx (desktop) | ✓ |
| Basket icon → Shopping teal hsl(190,...) in workspace-header.tsx (mobile) | ✓ |
| Basket icon → Shopping teal hsl(190,...) in nav-bar.tsx TopBar (desktop) | ✓ |
| Basket icon → Shopping teal hsl(190,...) in nav-bar.tsx TopBar (mobile) | ✓ |
| Sidebar aside: removed border-r border-border | ✓ |
| Sidebar brand zone: added border-r (inherits realm-header-border) | ✓ |
| Sidebar nav body: wrapped with border-r border-border | ✓ |
| FoodPantrySection: added searchFilter prop | ✓ |
| FoodPantrySection: activeFilter derived from searchFilter ∥ query | ✓ |
| FoodPantrySection: search input replaced with add-only input | ✓ |
| PantryPage: searchFilter={pantrySearch} passed to FoodPantrySection | ✓ |

---

## Verification Checklist

### Desktop
- [ ] Long THA logo permanently visible when sidebar expanded
- [ ] Collapsed sidebar shows single apple
- [ ] Basket icon is Shopping teal colour (not golden)
- [ ] Realm-coloured banner spans from sidebar left edge to page right edge (no grey break at sidebar boundary)
- [ ] Pantry search input appears in WorkspaceHeader center column
- [ ] Typing in pantry header search filters Food section items
- [ ] Pantry Food section card has add-only input (no search icon)
- [ ] Sidebar nav order: Planner, Nutrition, Cookbook, Pantry, Analyser, Shopping, Diary
- [ ] Dashboard not in sidebar nav

### Mobile
- [ ] Bottom nav: Planner, Nutrition, Cookbook, Pantry, Analyser, Diary
- [ ] No Shopping in bottom nav
- [ ] Basket button opens Shopping workspace
- [ ] Basket icon is Shopping teal colour
- [ ] THA logo in mobile workspace header links to Dashboard
- [ ] Pantry header search collapses/expands correctly on mobile

---

## Rollback

```
git checkout wx10e-rev1-rollback-20260627-pre-implementation -- client/src/components/nav-bar.tsx client/src/components/workspace-header.tsx client/src/pages/pantry-page.tsx
```
