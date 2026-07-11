# WX10E_REV2 — Brand Banner, Sidebar Below Banner, Workspace Command Rules

## Rollback

**Rollback stash:** `stash@{0}: WX10E_REV2_ROLLBACK_KEEP`

To restore:
```sh
git reset --hard HEAD
git stash apply stash@{0}
```

---

## Architecture Compliance Checks

| Check | Status |
|---|---|
| One authenticated shell | ✅ ProtectedRoute in App.tsx |
| One brand banner owner | ✅ BrandBanner in nav-bar.tsx |
| One sidebar/navigation owner | ✅ DesktopSidebar in nav-bar.tsx |
| One Workspace Header owner | ✅ WorkspaceHeader in workspace-header.tsx |
| No duplicate branding | ✅ Logo only in BrandBanner; sidebar no longer has logo |
| No duplicate command inputs | ✅ Workspace commands stay in WorkspaceHeader |
| No duplicate shopping entry points | ✅ Basket icon in WorkspaceHeader; Shopping in sidebar (desktop) |
| No schema changes | ✅ |
| No data changes | ✅ |
| No AI changes | ✅ |

---

## Platform Rules (Permanent)

1. **Brand banner owns brand identity.** The BrandBanner component is the sole owner of the THA long logo on desktop. It renders above the sidebar and workspace content.
2. **Sidebar navigation starts below the brand banner.** The DesktopSidebar's brand zone has been removed. Navigation starts directly under the BrandBanner row.
3. **Workspace Header owns commands.** Search bars, primary actions, basket access, and profile menu all live in WorkspaceHeader. Content areas do not repeat primary commands.
4. **Workspace Content owns information.** Page cards, lists, and data display live below the WorkspaceHeader.
5. **Extra screen width should reveal useful capability, not empty space.** Wide layouts use `max-w-screen-2xl` or `wide` prop.
6. **Whole-page scrolling should be avoided where section scrolling is more appropriate.** Internal scroll containers use `overflow-y-auto max-h-*` rather than relying on full-page scroll.

---

## Changes Made

### Part 1 + 2 — Brand Banner Owns Top Row / Sidebar Starts Below

**`client/src/components/nav-bar.tsx`**

- Added `BrandBanner` export: full-width, desktop-only (`hidden md:flex`), h-11 band using `realm-header-bg` and `realm-header-border`. Displays the THA long logo (max-h-7) permanently on the left, linking to `/dashboard`.
- Removed the brand zone div from `DesktopSidebar`. The sidebar now starts directly with the collapse toggle and nav items — no logo, no h-14 brand zone. The logo is never affected by sidebar collapse/expand.
- The removed brand zone previously showed `logo-long.png` when expanded and `tha-apple.png` when collapsed; that coupling is now broken.

**`client/src/App.tsx`**

- Imported `BrandBanner` from nav-bar.tsx.
- Added `<BrandBanner />` in `ProtectedRoute`, between `TrialBanner` and `SiteBanner`, so it renders above the sidebar+main content split.
- Desktop visual layout is now: `[BrandBanner] → [SiteBanner?] → [Sidebar nav | WorkspaceHeader + Content]`.

### Part 3 — Mobile Basket Uses Shopping Colour

**`client/src/components/workspace-header.tsx`**

- Mobile basket icon (`sm:hidden` zone) now always uses the Shopping workspace teal colour (`hsl(190, ...)`) in both active and inactive states.
- Inactive state before: `text-muted-foreground` (neutral, no Shopping identity).
- Inactive state after: `text-[hsl(190,38%,44%)]` — clearly teal, visually reads as the Shopping entry point at all times.
- Active state gets a subtle teal background pill to confirm the active workspace.

### Part 4 + 5 — Workspace Command Rule / Pantry Search

No changes required. Pantry search was already correctly placed in `WorkspaceHeader` via the `search` prop. The body input in `FoodPantrySection` is an add-item control (`placeholder="Add to ${catLabel}…"`), not a duplicate search. The HomePantrySection body input doubles as add + local filter — this is a single-field UX pattern, not a command duplication.

### Part 6 — Shopping Mobile Stage Selector

**`client/src/pages/shopping-workspace-page.tsx`**

- `ModeSwitcher`: Removed `overflow-x-auto` and `scrollbarWidth: none` (the invisible scroll). All four stage buttons now always render without clipping.
- Labels hidden on mobile (`<span className="hidden sm:inline">`). Each button shows icon only on mobile.
- Added `aria-label={label}` to each button for accessibility.
- On desktop (`sm:` and above): icon + label visible.
- iPhone SE width (375px): four icon-only buttons fit in ~160px, leaving headroom for other contextBar controls.

---

## Definition of Done

| Item | Status |
|---|---|
| Full long THA logo permanently visible top-left (desktop) | ✅ BrandBanner |
| Logo not affected by sidebar collapse | ✅ Logo removed from sidebar |
| Sidebar starts below brand banner | ✅ DesktopSidebar brand zone removed |
| Collapse control starts below brand banner | ✅ Toggle is first item in sidebar nav |
| Mobile Shopping via coloured basket icon | ✅ Teal colour always on |
| Basket is not replaced by trolley | ✅ ShoppingBasket icon retained |
| Pantry search lives in Workspace Header | ✅ Was already correct |
| No duplicate Pantry search in body | ✅ Body input is add-only |
| Workspace command rule enforced | ✅ No new violations introduced |
| Shopping mobile stage selector usable on iPhone SE | ✅ Icon-only on mobile |
| No clipped controls | ✅ Overflow-x-auto removed |
| No hidden inaccessible stages | ✅ All four stages always visible |
| Build passes | ✅ |

---

## Files Changed

```
client/src/App.tsx
client/src/components/nav-bar.tsx
client/src/components/workspace-header.tsx
client/src/pages/shopping-workspace-page.tsx
docs/investigations/ux/WX10E_REV2_BRAND_BANNER_SIDEBAR_AND_WORKSPACE_COMMAND_RULES.md
```

## Files NOT Changed

All pages, routes, business logic, schema, AI, and data queries are unchanged.
