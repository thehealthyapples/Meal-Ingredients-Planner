# WX16 — Platform Workspace Drawer Architecture

**Status**: Investigation complete — awaiting approval before implementation  
**Date**: 2026-06-29  
**Rollback tag**: `wx16-investigation-rollback`  
**Scope**: Platform-wide architectural investigation (design only)

---

## Architecture Compliance

| Requirement | Status | Notes |
|---|---|---|
| One Workspace architecture | NOT MET | Two independent implementations exist |
| One reusable Workspace component | NOT MET | `PlannerAssistantPanel` and `CookbookWorkspacePanel` are separate with duplicated structure |
| No duplicate implementations | NOT MET | See inventory below |
| Extend existing layout architecture | PARTIAL | Both use `<aside>` + `shrink-0 w-[244px]` but with no shared base |
| No duplicate responsive behaviour | NOT MET | Different mobile breakpoints (`<768px` vs `<1024px`), different drawer triggers |
| Primary content remains owner of screen space | NOT MET | Both panels always consume 244px regardless of user need or viewport |

---

## Current Workspace Inventory

### 1. Planner Workspace — `PlannerAssistantPanel`

**File**: `client/src/components/PlannerAssistantPanel.tsx`  
**Page**: `/planner` (`weekly-planner-page.tsx`)  

**Desktop layout**:
```tsx
<div className="flex gap-3 items-start">
  <div className="flex-1 min-w-0">   ← planner grid (content)
    ...
  </div>
  <PlannerAssistantPanel />          ← always-on aside
</div>
```
The aside renders as:
```tsx
<aside className="shrink-0 w-[244px] sticky top-28 mt-4 self-start rounded-xl flex flex-col max-h-[calc(100vh-6rem)] overflow-hidden" />
```

**Mobile layout**: Vaul `Drawer` (bottom sheet), opens on `mobileOpen` prop or when a `mode` is set.  
**Mobile breakpoint**: `< 768px` (via `window.matchMedia("(max-width: 767px)")`)  
**Mobile trigger**: `tha:open-workspace` custom event fired by nav repeat-tap  
**Collapse/expand**: None  
**Preference persistence**: None  
**Modes**: hub, smart, smart-review, scan, scan-review, manual, bulk, day, settings, resolve, placeholder-review, analyser, shopping-ready, build (15 modes)  
**Context**: Dedicated `PlannerWorkspaceContext` for settings state  
**Compress problem**: YES — planner grid permanently loses 244px + 12px gap on desktop

---

### 2. Cookbook Workspace — `CookbookWorkspacePanel`

**File**: `client/src/components/CookbookWorkspacePanel.tsx`  
**Page**: `/meals` (also `/cookbook`)

**Desktop layout**: Standalone aside rendered by `meals-page.tsx`:
```tsx
<aside className="shrink-0 w-[244px] sticky top-40 mt-4 self-start rounded-xl flex flex-col max-h-[calc(100vh-10rem)] overflow-hidden" />
```

**Mobile layout**: Vaul `Drawer`, opens on `mobileOpen || !!mode`  
**Mobile breakpoint**: `< 1024px` (via `window.matchMedia("(max-width: 1023px)")`)  
**Mobile trigger**: Workspace button in page header; also auto-opens when a sub-mode is selected  
**Collapse/expand**: None  
**Preference persistence**: None  
**Modes**: null (idle hub), build, scan, filter (4 modes)  
**Context**: Props-based only  
**Compress problem**: YES — cookbook grid permanently loses 244px

---

### 3. Pantry "Workspace" — Mobile Drawer Only

**File**: `client/src/pages/pantry-page.tsx`  
**Page**: `/pantry`

**Desktop layout**: None — no persistent right panel on desktop. `PantryIntelligencePanel` renders **inline** within item rows when an item is expanded.  
**Mobile layout**: Vaul `Drawer` (`max-h-[85vh]`) for the household knowledge hub  
**Mobile trigger**: `tha:open-workspace` custom event from nav repeat-tap  
**Compress problem**: NONE on desktop

---

### 4. Shopping Workspace — Dedicated Page

**File**: `client/src/pages/shopping-workspace-page.tsx`  
**Page**: `/shopping-workspace`

**Pattern**: The entire page IS the workspace. Full-width mode tabs: add, review, prep, shop.  
**Compress problem**: N/A — no sidebar concept

---

### 5. Food Diary Workspace — Minimal Header Action

**File**: `client/src/pages/food-diary-page.tsx`  
**Page**: `/diary`

**Desktop layout**: Dropdown menu (apple icon button) in `WorkspaceHeader` `actions` slot — opens settings/copy from planner/import CSV.  
**Mobile**: `tha:open-workspace` event triggers a mobile sheet (pending investigation of exact content).  
**Compress problem**: NONE — no persistent panel

---

### 6. Nutrition / Plant Diversity — Tab-Based Full-Width

**File**: `client/src/pages/plant-diversity-page.tsx`  
**Page**: `/plant-diversity`

**Desktop layout**: Full-width tab content (Foods, Nutrients, Benefits, Suggestions).  
**Mobile**: `tha:open-workspace` event opens a Drawer (`drawer-nutrition-workspace`).  
**Compress problem**: NONE

---

### 7. Dashboard, Profile, Partners, Admin Pages — No Workspace Panel

These pages use `WorkspaceHeader` for the top bar only. No right-hand panel or drawer. They should remain full-width.

---

## Duplication Audit

| Issue | Detail |
|---|---|
| `useIsMobile` hook | Duplicated in both `PlannerAssistantPanel` and `CookbookWorkspacePanel` with **different breakpoints** |
| Mobile breakpoint disagreement | Planner: `≤767px`, Cookbook: `≤1023px`. A tablet at 900px shows as mobile in Cookbook, desktop in Planner |
| `<aside>` pattern | Identical `shrink-0 w-[244px] sticky ... self-start rounded-xl flex flex-col max-h-[calc(100vh-...)] overflow-hidden` in both components |
| `tha:open-workspace` event | Present in Planner, Pantry, Diary, Plant Diversity — not Cookbook (uses prop-based trigger instead) |
| Drawer pattern | Both use Vaul `Drawer` + `DrawerContent` but with different internal header/close logic |

---

## Pages Requiring Migration

| Page | Current Pattern | Target Pattern | Priority |
|---|---|---|---|
| `/planner` | Fixed `w-[244px]` aside, always-on | Shared WorkspaceDrawer, collapsible | P1 |
| `/meals` `/cookbook` | Fixed `w-[244px]` aside, always-on | Shared WorkspaceDrawer, collapsible | P1 |
| `/pantry` | Mobile drawer only | Mobile drawer only (no change) | P2 — align event pattern |
| `/plant-diversity` | Mobile drawer only | Mobile drawer only (no change) | P3 |
| `/diary` | Header action menu | Header action menu (no change) | P3 |

---

## Proposed Shared Architecture

### WorkspaceDrawer Component

A single `<WorkspaceDrawer>` that wraps any page's workspace content. It owns the layout, responsive behaviour, animation, and preference persistence. Page workspace components (`PlannerAssistantPanel`, `CookbookWorkspacePanel`) become **pure content** with no layout responsibility.

```
WorkspaceDrawer
├── props: width, defaultOpen, storageKey, title, realm
├── children: workspace content (no layout knowledge needed)
└── behaviour: viewport-aware, animated, keyboard-accessible
```

**Signature (proposed)**:
```tsx
<WorkspaceDrawer
  defaultWidth={244}
  storageKey="planner-workspace"
  realm="planner"
  title="Planner Assistant"
  mobileTitle="Assistant"
>
  <PlannerWorkspaceContent ... />
</WorkspaceDrawer>
```

---

## Responsive Behaviour Matrix

| Breakpoint | Width | Mode | Default State | Compresses Content | User Can Toggle |
|---|---|---|---|---|---|
| Desktop `≥1280px` | 244px | Docked | Open | Yes — intentional | Yes (collapse button) |
| Laptop `1024–1280px` | 220px | Docked | Open | Yes — intentional | Yes (collapse button) |
| Tablet `768–1024px` | Full overlay | Overlay drawer | Closed | No — overlays content | Yes (toggle button) |
| Mobile `<768px` | Full / 90vw | Bottom sheet | Closed | No | Yes (via nav / button) |

**Primary content ownership principle**: On Desktop and Laptop, when the drawer is **collapsed** the primary content expands to fill the released space using CSS `transition` on the panel width (not on the content column). The flex layout handles reflow automatically.

---

## Recommended Workspace Behaviour

### Desktop / Laptop — Docked Mode

- Docked by default on first visit.
- User can collapse to zero-width via a `ChevronRight` button on the panel's left edge.
- Collapsed state persists in `localStorage` keyed per realm (e.g. `tha-workspace-planner`, `tha-workspace-cookbook`).
- When collapsed, a thin `32px` trigger strip (or icon-only bar) remains visible so the user can re-open without hunting.
- Animate width: `transition-[width] duration-200 ease-out` — fast so it feels responsive, not decorative.
- On collapse: `w-0` with `overflow-hidden`. On expand: `w-[244px]`.
- The primary content column has `flex-1 min-w-0` and reflows naturally — no JavaScript needed for the resize.

### Tablet — Overlay Mode

- No workspace visible by default.
- A toggle button (in the `WorkspaceHeader` `actions` slot, or floating) opens the panel as an overlay.
- Overlay uses `position: fixed` or a `Sheet`/`Drawer` with `inset-y-0 right-0` so it does not compress primary content.
- Dismissed by backdrop click, Escape, or close button.
- No preference persistence (ephemeral per session).

### Mobile — Bottom Sheet

- Vaul `Drawer` from the bottom (`max-h-[80vh]`).
- Opened by the `tha:open-workspace` event (nav repeat-tap) or by direct action (workspace button in header).
- Never permanently visible, never compresses content.
- No preference persistence.

---

## Workspace Mode Support

| Mode | Should Support | Implementation |
|---|---|---|
| Pinned (docked, always open) | Yes | Default on Desktop/Laptop |
| Temporary (overlay) | Yes | Tablet behaviour |
| Contextual (opens on action) | Yes | Triggered by user action or system event |
| Keyboard shortcut | Yes | `Ctrl+\` (or platform-standard) to toggle |
| Animation | Yes | CSS width transition on desktop, slide-in on mobile |
| Remembered open/closed state | Yes | `localStorage` per realm on Desktop/Laptop |

---

## Shared Hook

A single `useViewport` hook (or `use-breakpoints.ts`) replaces the duplicated `useIsMobile` hooks:

```ts
// Proposed: client/src/hooks/use-viewport.ts
export function useViewport() {
  return {
    isMobile,   // < 768px
    isTablet,   // 768–1023px
    isLaptop,   // 1024–1279px
    isDesktop,  // ≥ 1280px
    isDocked,   // isLaptop || isDesktop
  }
}
```

This resolves the current `<767px` vs `<1023px` disagreement and gives the whole app a single source of truth for breakpoints.

---

## Implementation Phases

### Phase 1 — Foundation (no visible change)

1. Create `client/src/hooks/use-viewport.ts` — shared breakpoint hook
2. Create `client/src/components/WorkspaceDrawer.tsx` — shared layout container
   - Desktop/laptop: collapsible docked panel with animation
   - Tablet: overlay Sheet
   - Mobile: Vaul Drawer (bottom sheet)
   - `localStorage` preference persistence
   - Keyboard shortcut handler
3. No page migration in this phase — just the component exists

**Estimated effort**: 2–3 days

---

### Phase 2 — Cookbook Migration (lower risk)

Migrate `CookbookWorkspacePanel` first because:
- Simpler (4 modes vs 15)
- Props-based, no context
- Smaller blast radius

Steps:
1. Replace the `<aside>` and mobile Drawer rendering inside `CookbookWorkspacePanel` with `WorkspaceDrawer`
2. The panel becomes pure content (renders `WorkspaceIdleContent`, `WorkspaceScanContent`, etc.)
3. Fix mobile breakpoint from `<1024px` → platform standard (`<768px`)
4. Remove duplicated `useIsMobile` from this file

**Estimated effort**: 1–2 days

---

### Phase 3 — Planner Migration (higher risk)

Migrate `PlannerAssistantPanel`:
- Large component (1950+ lines)
- 15 active modes with complex state machine
- `PlannerWorkspaceContext` consumed by child components
- DnD integration (proposal cards draggable from workspace to grid)
- `tha:open-workspace` event listener already present

Steps:
1. Replace the `<aside>` and mobile `Drawer` rendering with `WorkspaceDrawer`
2. `PlannerAssistantPanel` becomes pure content with no layout responsibility
3. DnD prop-drilling to workspace content remains unchanged
4. Verify `tha:open-workspace` event still opens the drawer correctly
5. Regression test all 15 modes

**Estimated effort**: 3–4 days

---

### Phase 4 — Event / Pattern Alignment (cleanup)

Standardise `tha:open-workspace` usage across Pantry, Diary, Plant Diversity so all pages respond to the same event, with the same handler signature.

**Estimated effort**: 0.5–1 day

---

## Migration Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Planner regression (15 modes, DnD) | HIGH | Migrate Cookbook first to validate the architecture, then tackle Planner with comprehensive manual testing |
| Cookbook mobile breakpoint change (`<1024` → `<768`) | MEDIUM | Tablet users currently see a Drawer; after change they'll see a docked panel at `768–1023px`. Monitor UX. May need `isDocked` opt-in per page |
| `localStorage` key collision | LOW | Key per realm (`tha-workspace-{realm}`), matching existing `planner:active-week` convention |
| Width animation jank | LOW | CSS-only transition on the panel element; `flex-1 min-w-0` on content reflows automatically |
| `PlannerWorkspaceContext` coupling | MEDIUM | Context provides settings state to child controls inside the panel. No layout concern. Not affected by this migration |
| DnD draggable proposals from workspace panel | MEDIUM | Must verify `DndContext` wraps both grid and panel (currently yes); drawer overlay mode on tablet would require portal-aware drag |

---

## Recommended First Implementation

**Implement Cookbook migration first** (Phase 1 → 2), validated before touching Planner:

1. The Cookbook workspace is structurally identical but far simpler.
2. It validates the `WorkspaceDrawer` architecture — collapse/expand, localStorage, breakpoints — with low blast radius.
3. Once working, Planner migration has a proven template.

The shared `WorkspaceDrawer` and `use-viewport` hook should be built independently (Phase 1) so they can be reviewed without any page regression.

---

## Files to Create / Modify

| File | Action | Notes |
|---|---|---|
| `client/src/hooks/use-viewport.ts` | Create | Shared breakpoint hook |
| `client/src/components/WorkspaceDrawer.tsx` | Create | Shared layout wrapper |
| `client/src/components/CookbookWorkspacePanel.tsx` | Modify | Remove layout, use WorkspaceDrawer |
| `client/src/components/PlannerAssistantPanel.tsx` | Modify | Remove layout, use WorkspaceDrawer |
| `client/src/pages/meals-page.tsx` | Modify | Adjust how CookbookWorkspacePanel is rendered |

---

## Definition of Done (when approved for implementation)

- [ ] `WorkspaceDrawer` component created and documented
- [ ] `use-viewport` hook replaces duplicated `useIsMobile` hooks
- [ ] Cookbook workspace collapsible on desktop with remembered state
- [ ] Cookbook mobile breakpoint aligned to platform standard
- [ ] Planner workspace collapsible on desktop with remembered state
- [ ] Keyboard shortcut (`Ctrl+\`) toggles drawer on desktop
- [ ] No regression in planner DnD or workspace modes
- [ ] `tha:open-workspace` event opens drawer correctly on all migrated pages
- [ ] Primary content correctly expands when workspace is collapsed

---

*Investigation by Claude Code (WX16) — 2026-06-29*  
*Rollback tag: `wx16-investigation-rollback` at commit `3ef7e8e`*
