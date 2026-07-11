# WX10 — Unified Workspace Header Implementation

**Date:** 2026-06-26  
**Type:** Implementation  
**Branch:** safety/preserve-since-last-prod-20260617-1613  
**Preceding work:** WX9.5 Workspace Header Design Spike (Concept B selected)

---

## Rollback

**Tag:** `wx10-pre-implementation`

To revert:
```bash
git checkout wx10-pre-implementation
# or restore individual files
git diff wx10-pre-implementation..HEAD -- client/src/components/workspace-header.tsx
```

---

## Architecture Compliance

- ✅ One shared Workspace Header component (`client/src/components/workspace-header.tsx`)
- ✅ One owner for authenticated page chrome (WorkspaceHeader replaces TopBar + PageHeader)
- ✅ No duplicated headers
- ✅ No duplicated layout logic
- ✅ Existing page functionality preserved
- ✅ No business logic changes
- ✅ No schema changes
- ✅ No AI behaviour changes

---

## Design Decisions

### 1. Component Architecture

**Decision:** Replace both `TopBar` and `PageHeader` with a single `WorkspaceHeader` component.

**Rationale:**
- TopBar was at ~90px on desktop (logo dominated)
- PageHeader was 52–88px per page
- Combined: 142–178px before content
- WorkspaceHeader: 56px main bar + optional contextBar at ~40px = 56–96px
- Space recovered: **46–122px (32–69% reduction)**

**File created:** `client/src/components/workspace-header.tsx`

### 2. Layout

```
[🍏 Page Title]  [Search placeholder...]  [Actions] [🛒] [⌘]
────────────────────────────────────────────────────────────
[Context bar: tabs, week nav, filters — page-specific]
```

- Left column: THA apple icon + page title (fixed position across all pages)
- Center column: contextual search (placeholder changes per page; for pages with complex search like Analyser, the center accepts a ReactNode)
- Right column: page-specific actions + basket badge + Apple Menu (profile dropdown)

### 3. Search Strategy

| Page | Search behavior |
|------|-----------------|
| Dashboard | "Search meals..." → navigate to /cookbook?q=... |
| Cookbook | "Search recipes..." → filters via URL param q= |
| Planner | "Search meals..." → navigate to /cookbook?q=... |
| Pantry | Drives pantry filter state |
| Shopping Workspace | "Search products..." → ProductsPage navigate |
| Basket | No header search (complex existing mode/view controls) |
| Analyser | Custom search input (barcode + Input) passed as center prop |
| My Diary | No search (personal logging) |
| Others | No search |

### 4. Context Bar

Pages that previously had `center` (complex tabs) or `controlBar` in PageHeader now pass those to `contextBar` prop. The contextBar renders as a sticky strip below the 56px header, keeping both elements in the same sticky container.

| Page | contextBar content |
|------|-------------------|
| Planner | Week navigation, household selector, plant diversity chip, variety chip |
| Cookbook | Mode tabs (My Cookbook, Recipes, My Freezer, Packaged) |
| Pantry | Inventory/Explore switch + category tabs |
| Shopping Workspace | ModeSwitcher + workspace controls |
| Basket | Mode + View dropdowns (moved from PageHeader center) |
| My Diary | Tab switcher (Daily Log / Progress) + date nav |

### 5. Branding

- Authenticated pages: transparent THA apple icon (36×36px) as workspace signature
- `TopBar` logo removed from authenticated routes
- Full horizontal logo retained for public pages, auth, onboarding (via OrchardShell)

### 6. Mobile

- Main 56px bar: apple+title | basket + profile (always visible)
- Center search: shown in a row below the main bar when `search` is provided
- contextBar: shown below search row
- Mobile total: 56px (no extras) to 136px (search + contextBar) — better than current 100-148px

### 7. App.tsx Changes

- `TopBar` import removed from ProtectedRoute
- `PageHeader` is no longer used after migration (retained in codebase for safety)
- Each page renders `WorkspaceHeader` as its first element

---

## Data Impact

- Reads existing data: **Yes** (basket count, user data)
- Writes new data: **No**
- Changes meaning of existing data: **No**
- Requires backfill: **No**

---

## Scope Lock

This implementation does NOT:
- Change navigation structure
- Change page routing
- Change colours or colour system
- Change typography
- Introduce new backend features
- Remove existing functionality
- Change AI behaviour
- Modify database schemas

---

## Sidebar Branding

**Decision:** Sidebar header replaced with a two-state branding zone.

- **Expanded (w-[220px]):** Full `logo-long.png` at h-7, max-w-[136px]. Collapse toggle on the right in the same row.
- **Collapsed (w-16):** Transparent `tha-apple.png` at h-8 w-8, centred. Collapse toggle below in a flex-col layout.

Both states link to `/dashboard`.

### Navigation Label: "Nutrition" (not "Nutrition Centre")

Rationale: "Nutrition" is shorter, more scannable in a sidebar, and consistent with the other one-word nav labels (Planner, Pantry, Cookbook). "Nutrition Centre" is appropriate as a section heading within the page itself, which is preserved in the `HouseholdNutritionCentre` component title.

### Nutrition Realm Colour: hsl(145, …) botanical mid-green

Rationale: Distinct from the existing greens (/planner at 172, /pantry at 115, /list at 95) while staying in the nature/plant family. 145° is a clean mid-green that reads as "health / botanical".

---

## Pages Migrated

1. `dashboard.tsx` — Dashboard
2. `meals-page.tsx` — Cookbook
3. `weekly-planner-page.tsx` — Planner
4. `pantry-page.tsx` — Pantry
5. `list-page.tsx` — Quick List
6. `shopping-workspace-page.tsx` — Shopping Workspace
7. `shopping-list-page.tsx` — Basket
8. `products-page.tsx` — Analyser
9. `food-diary-page.tsx` — My Diary
10. `meal-detail-page.tsx` — Meal Detail
11. `profile-page.tsx` — Profile
12. `partners-page.tsx` — Partners
13. `quick-meal-page.tsx` — Build a Meal
14. `supermarkets-page.tsx` — Supermarkets
15. `plant-diversity-page.tsx` — Nutrition (WX10 addition)

---

## Implementation Steps

1. ✅ Rollback tag created: `wx10-pre-implementation`
2. ✅ Create `WorkspaceHeader` component
3. ✅ Update `App.tsx` — remove `TopBar` from ProtectedRoute
4. ✅ Migrate each page — replace `PageHeader` with `WorkspaceHeader`
5. ✅ Add `nutrition` realm to `PageRealm` type and CSS
6. ✅ Add sidebar branding (expanded logo / collapsed apple)
7. ✅ Add Dashboard + Nutrition to `NAV_ITEMS_MAIN` with realm styles
8. ✅ Migrate `plant-diversity-page.tsx` to `WorkspaceHeader`
9. ✅ Verify no client TypeScript errors
10. ✅ Vite build passes (3245 modules, 0 client errors)

---

## Manual Verification Steps

For each authenticated page, verify:
- [ ] WorkspaceHeader renders at top with apple icon + title
- [ ] Search input appears in center (where applicable)
- [ ] Page actions appear on right (before basket and profile)
- [ ] Basket shows with item count badge
- [ ] Profile/Apple menu works (profile, partners, admin links, logout)
- [ ] contextBar appears below header with correct content
- [ ] Primary content visible above fold
- [ ] Realm colour applied to header background
- [ ] No double headers
- [ ] Mobile layout correct (56px bar + search + contextBar)
- [ ] Sidebar unchanged
- [ ] Mobile bottom nav unchanged
