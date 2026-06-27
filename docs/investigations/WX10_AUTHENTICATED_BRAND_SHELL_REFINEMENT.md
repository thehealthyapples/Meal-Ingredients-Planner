# WX10 — Authenticated Brand Shell Refinement

**Date:** 2026-06-27
**Type:** Refinement / Decision Record
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Preceding work:** WX10 Unified Workspace Header Implementation

---

## Rollback

**Identifier:** `stash@{0}` — "WX10-brand-shell-refinement: pre-change checkpoint"

To revert all brand shell refinement changes:
```bash
git stash pop
# or restore individual files
git checkout HEAD -- client/src/App.tsx
git checkout HEAD -- client/src/components/nav-bar.tsx
# Note: workspace-header.tsx is untracked (new file); remove and restore previous version if needed
```

---

## Decision: Permanent Long Logo in Authenticated Shell

### Previous WX10 Direction

The initial WX10 implementation used the single transparent apple (`tha-apple.png`) as the brand mark when the sidebar was collapsed. In expanded state it showed `logo-long.png`.

### Why That Was Changed

- The single apple alone weakens The Healthy Apples brand in the authenticated experience.
- It risks confusion with Apple (the company) branding — an unacceptable association for a food health product.
- The collapsed sidebar is a common state on laptop-width screens, meaning most desktop users would see only the apple.
- Brand presence should be constant, not conditional on sidebar width.

### New Decision

The full The Healthy Apples long logo (`logo-long.png`) is the permanent authenticated brand mark. It is visible in the sidebar brand zone at all times — in both expanded and collapsed states — scaled to fit the available width rather than replaced with the single apple.

---

## Architecture Compliance

- ✅ One app shell owner (`App.tsx` → `ProtectedRoute`)
- ✅ One Workspace Header owner (`client/src/components/workspace-header.tsx`)
- ✅ One sidebar/navigation owner (`client/src/components/nav-bar.tsx` → `DesktopSidebar`)
- ✅ No duplicate branding systems
- ✅ No schema changes
- ✅ No data changes
- ✅ No AI changes
- ✅ No route changes

---

## Changes Made

### 1. `client/src/components/nav-bar.tsx`

**Added `AppRealmContext`** — a lightweight React context that allows `WorkspaceHeader` (inside each page) to broadcast the active realm upward to `DesktopSidebar` (a sibling in the DOM tree, not a descendant).

```tsx
export interface AppRealmContextValue { realm: string; setRealm: (r: string) => void; }
export const AppRealmContext = createContext<AppRealmContextValue>({ realm: "home", setRealm: () => {} });
export function useAppRealm() { return useContext(AppRealmContext); }
```

**Restructured `DesktopSidebar` brand zone:**

| Before | After |
|---|---|
| Collapse toggle at very top | Brand zone (h-14, realm colour) at very top |
| Expanded: long logo | Expanded: long logo (`max-h-8 max-w-[140px]`) |
| Collapsed: single apple icon | Collapsed: long logo, scaled down (`max-h-[26px] max-w-[52px]`) |
| No realm colour on sidebar top | `data-realm={realm}` + `realm-header-bg` on brand zone |
| Toggle inside brand zone | Toggle in its own row below brand zone |
| Nav items below toggle (same) | Nav items below toggle (unchanged) |

The brand zone uses `h-14` to match the WorkspaceHeader bar height exactly, creating a visually continuous full-width coloured band across the top of the authenticated shell.

### 2. `client/src/components/workspace-header.tsx`

**Added realm sync via context:**
```tsx
const { setRealm } = useAppRealm();
useLayoutEffect(() => { setRealm(realm); }, [realm, setRealm]);
```

`useLayoutEffect` (not `useEffect`) is used so the sidebar brand zone updates in the same visual frame as the page content — no visible flash between realm colours on navigation.

**Removed apple icon from desktop header left column.** The logo now lives exclusively in the sidebar brand zone on desktop. The desktop header left column renders only the page title (`h1.realm-title`). The mobile header (`sm:hidden`) retains the apple icon link + title as before, since mobile has no sidebar.

### 3. `client/src/App.tsx`

**Added `AppRealmContext.Provider`** wrapping the `ProtectedRoute` render tree:
```tsx
const [activeRealm, setActiveRealm] = useState("home");
return (
  <AppRealmContext.Provider value={{ realm: activeRealm, setRealm: setActiveRealm }}>
    ...
  </AppRealmContext.Provider>
);
```

This is the single provider. `WorkspaceHeader` writes to it; `DesktopSidebar` reads from it.

---

## Full-Width Realm Band

The coloured realm band spanning the full page width is achieved through CSS variable inheritance:

1. `WorkspaceHeader` has `data-realm={realm}` on its sticky wrapper → sets `--realm-bg`, `--realm-border`, `--realm-text` via CSS.
2. Sidebar brand zone has `data-realm={activeRealm}` (from context, updated synchronously via `useLayoutEffect`) → resolves the same CSS variables.
3. Both elements use `realm-header-bg` (`.realm-header-bg { background-color: var(--realm-bg); }`) and `realm-header-border`.
4. Both are `h-14` and sit at the top of their respective columns.
5. Visual result: a single unbroken coloured band across the full viewport width.

No CSS hacks, negative margins, or absolute positioning required. The realm variables do the work.

---

## Brand Safety

| Scenario | Logo shown | Notes |
|---|---|---|
| Sidebar expanded (desktop) | Full long logo at `max-h-8` | Clear at all screen widths |
| Sidebar collapsed (desktop) | Full long logo at `max-h-[26px]` | Small but wordmark, not just apple |
| Mobile | Apple icon in WorkspaceHeader | No sidebar on mobile; apple is acceptable brand shorthand |
| Admin pages (no WorkspaceHeader) | Long logo, last active realm colour | Rare pages; acceptable |
| Unauthenticated (auth, onboarding) | Long logo in OrchardShell / auth page | Unchanged |

The single apple (`tha-apple.png`) is retained as:
- The profile/menu dropdown trigger (AppleMenu) — decorative
- Mobile WorkspaceHeader brand icon — functional shorthand
- NOT the sole authenticated app brand identifier

---

## Verification Results

All checks confirmed against production build (`npm run build` — clean, 10.77s):

| Check | Result |
|---|---|
| `logo-long.png` in sidebar brand zone (built JS) | PASS |
| `data-realm` + `realm-header-bg` on sidebar brand zone | PASS |
| Collapse toggle structurally after brand zone | PASS |
| `useLayoutEffect` syncs realm to context | PASS |
| Desktop WorkspaceHeader left col: title only, no apple | PASS |
| Mobile WorkspaceHeader: apple icon retained | PASS |
| No logo duplication in authenticated shell | PASS |
| TypeScript build: clean | PASS |

Pages verified (code path):
- Dashboard (`realm="home"`)
- Cookbook (`realm="cookbook"`)
- Planner (`realm="planner"`)
- Pantry (`realm="pantry"`)
- Analyser (`realm="analyser"`)
- Diary (`realm="diary"`)
- Shopping Workspace (`realm="basket"`)
- Quick List (`realm="list"`)
- Meal Detail (`realm="home"`)
- Partners / Profile (`realm="home"`)

---

## Known Limitations

1. **Admin pages** (`/admin/*`) have no `WorkspaceHeader` and do not update the realm context. The sidebar brand zone will retain the last active realm colour from the previous page. Impact: cosmetic only; admin pages are staff-only and rarely visited.

2. **Collapsed logo legibility** — at `max-h-[26px] max-w-[52px]` the wordmark is small. If future user research shows this is insufficient, options are: increase collapsed sidebar width from `w-16` to `w-20`, or allow the collapsed state to show a tighter crop of the wordmark. The single apple is not an acceptable fallback per this decision record.

3. **Realm flash** — eliminated by `useLayoutEffect`. If `useLayoutEffect` is ever changed to `useEffect` (e.g., for SSR compatibility), a one-frame flash of "home" realm colour will reappear on page load.

---

## Files Changed

| File | Change type |
|---|---|
| `client/src/App.tsx` | Added `AppRealmContext.Provider` + `useState("home")` in `ProtectedRoute` |
| `client/src/components/nav-bar.tsx` | Added `AppRealmContext`; restructured `DesktopSidebar` brand zone |
| `client/src/components/workspace-header.tsx` | Added `useLayoutEffect` realm sync; removed desktop apple icon |

No page files changed. No CSS files changed. No schema changes.

---

## Final Brand Shell Decision

**The Healthy Apples long logo is the permanent authenticated app brand mark.**

It occupies the top-left brand zone of the desktop sidebar at all times. The realm colour band that unifies sidebar and workspace header is a core part of the visual identity — it signals "you are in Cookbook / Pantry / Planner" while keeping the THA brand consistently visible above it.

The single apple icon remains part of the design system as a navigation affordance (menu trigger, mobile icon) but is explicitly not a substitute for the wordmark logo in the main authenticated shell.
