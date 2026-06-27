# WX10F — Header / Sidebar Layout Correction

**Date:** 2026-06-27  
**Rollback tag:** `wx10f-rollback-265cadd`  
**Branch:** `safety/preserve-since-last-prod-20260617-1613`

---

## Problem

The desktop sidebar competed with the `WorkspaceHeader` (brand/banner row) because both occupied the same flex row:

```
[SiteBanner — full width                                              ]
[DesktopSidebar | WorkspaceHeader (logo + title + actions) + content ]
```

The sidebar was a flex sibling of `<main>`, and `WorkspaceHeader` rendered as the first child of `<main>`. So the sidebar appeared beside the logo/header, not below it.

---

## Required Structure

```
[TrialBanner / SiteBanner — full width, if present]
[WorkspaceHeader — full width: logo | title | search | actions | basket | profile]
[DesktopSidebar | workspace content                                               ]
[MobileNav — fixed bottom on mobile]
```

---

## Fix Strategy: React Portal Slot

Rather than restructuring every page (15 pages use `WorkspaceHeader`), we use a **portal slot** pattern:

1. `ProtectedRoute` in `App.tsx` renders a `<div ref={setHeaderSlot}>` above the sidebar/main flex row.
2. `WorkspaceHeaderSlotContext` (exported from `workspace-header.tsx`) carries the slot element to any consumer.
3. `WorkspaceHeader` uses `createPortal(content, slot)` when a slot is available, rendering inline as fallback.

This means:
- Zero changes to the 15 page files.
- On first paint the header may render inline (slot not yet attached). React's synchronous commit attaches the ref and re-renders before the browser paints — no visible flash.
- Mobile layout is also improved: header renders above the scrollable `<main>` with no sticky positioning needed.

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/components/workspace-header.tsx` | Export `WorkspaceHeaderSlotContext`; use `createPortal` when slot available |
| `client/src/App.tsx` | Add slot div + `WorkspaceHeaderSlotContext.Provider` in `ProtectedRoute` |

---

## DOM Before / After

**Before:**
```html
<div class="flex flex-col h-[100dvh]">
  <div class="site-banner" />
  <div class="flex flex-1 overflow-hidden">
    <aside class="desktop-sidebar" />           ← sidebar beside header
    <main>
      <div class="page-sticky-header">          ← WorkspaceHeader inside main
        logo | title | actions
      </div>
      <!-- page content -->
    </main>
  </div>
  <nav class="mobile-bottom-nav" />
</div>
```

**After:**
```html
<div class="flex flex-col h-[100dvh]">
  <div class="site-banner" />
  <div id="ws-header-root" class="shrink-0 w-full">   ← portal target
    <div class="page-sticky-header">                   ← WorkspaceHeader portaled here
      logo | title | actions
    </div>
  </div>
  <div class="flex flex-1 overflow-hidden">
    <aside class="desktop-sidebar" />                  ← sidebar BELOW header ✓
    <main>
      <!-- page content only, no header -->
    </main>
  </div>
  <nav class="mobile-bottom-nav" />
</div>
```

---

## Architecture Compliance

- One brand/header row — `WorkspaceHeader` (portaled above sidebar). ✓
- No duplicate logo. ✓
- No duplicate header. ✓
- Sidebar begins below header (flex row is below the portal slot). ✓
- Sidebar collapse/expand does not affect header. ✓
- No schema/data/AI changes. ✓
- No new pages, no new routes, no new API calls. ✓

---

## Verification Checklist

- [ ] Desktop collapsed sidebar — header spans full width, sidebar below it
- [ ] Desktop expanded sidebar — same, sidebar pops out under header
- [ ] Planner — WorkspaceHeader with contextBar (week nav) above sidebar
- [ ] Pantry — contextBar above sidebar
- [ ] Cookbook — search in header, above sidebar
- [ ] Shopping workspace — contextBar with ModeSwitcher above sidebar
- [ ] Nutrition — wide header above sidebar
- [ ] Mobile — header above scrollable content, no sidebar competition
- [ ] Build passes (TypeScript)
