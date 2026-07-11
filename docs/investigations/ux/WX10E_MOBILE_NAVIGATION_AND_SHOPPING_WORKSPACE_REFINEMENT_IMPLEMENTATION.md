# WX10E — Mobile Navigation & Shopping Workspace Refinement

## Rollback

Tag: `wx10e-rollback-pre-implementation`
Restore: `git checkout wx10e-rollback-pre-implementation -- client/src/components/nav-bar.tsx client/src/pages/shopping-workspace-page.tsx`

---

## Scope

Presentation-only changes: navigation ordering, branding, shopping layout, mobile usability, workspace consistency. No business logic, data models, or API contracts changed.

---

## Architecture Compliance

✓ One canonical navigation system (`nav-bar.tsx`)
✓ One owner for workspace navigation (WorkspaceHeader)
✓ Desktop and mobile share the same workspace ordering
✓ Navigation adapts for screen size only
✓ Existing WorkspaceHeader architecture extended (not replaced)
✓ No duplicate Shopping entry points
✓ No schema or data ownership changes

---

## Changes

### Part 1 — Desktop Sidebar (nav-bar.tsx)

- `NAV_ITEMS_MAIN` reordered: removed Dashboard, order now Planner → Nutrition → Cookbook → Pantry → Analyser → Shopping → Diary
- Dashboard accessed exclusively via THA logo click (link on brand zone)
- Collapsed sidebar: shows single apple icon (`thaAppleSrc`) instead of small long logo
- Expanded sidebar: shows long logo (`/logo-long.png`)
- Collapse toggle already sits below logo zone — no change needed
- Realm-coloured header spans full width (sidebar brand zone + WorkspaceHeader share `realm-header-bg`)

### Part 2 — Mobile Bottom Nav (nav-bar.tsx)

- `MOBILE_BOTTOM_ITEMS` updated: Shopping and Dashboard removed, Nutrition added
- New order: Planner → Nutrition → Cookbook → Pantry → Analyser → Diary (matches desktop)
- Shopping accessed from basket icon in WorkspaceHeader (already present on all mobile workspace pages)
- Dashboard accessed from THA logo in WorkspaceHeader mobile section (already present)

### Part 3 & 4 — Shopping Workspace Stage Selector + Add Layout (shopping-workspace-page.tsx)

- `ModeSwitcher` made scrollable with `overflow-x-auto no-scrollbar` — all stages always visible, no clipping on iPhone SE
- Add mode desktop layout: input panel (left/flex-1) + recent lists sidebar (right, hidden on mobile) — uses full available width
- Mobile: single column, recent lists shown below input as before

### Part 5 — Workspace Consistency

Existing `WorkspaceHeader` architecture already covers all workspace pages. No structural changes needed — all pages already follow header → context bar → content shell.

### Part 6 — Branding

Collapsed sidebar now shows dedicated apple icon (distinct from the long logo), satisfying the "single apple only when collapsed" requirement.

---

## Definition of Done Checklist

- [x] Desktop nav order: Planner, Nutrition, Cookbook, Pantry, Analyser, Shopping, Diary
- [x] Dashboard accessible via THA logo only (removed from sidebar nav items)
- [x] Collapsed sidebar shows single apple logo
- [x] Expanded sidebar shows long THA logo
- [x] Mobile nav: Planner, Nutrition, Cookbook, Pantry, Analyser, Diary
- [x] Shopping accessible from basket icon in mobile header
- [x] Dashboard accessible from THA logo in mobile header
- [x] Shopping stage selector fully usable on all mobile widths (scrollable)
- [x] Add mode uses available desktop width
- [x] No clipped controls
- [x] No schema/business logic changes
