# WX12 — Platform Banner Logo Alignment Fix

**Date:** 2026-06-27
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Rollback tag:** `rollback/pre-wx12`

---

## Problem

The workspace header treated the title row and the workspace navigation row as two
independent components stacked vertically. This was wrong in two ways:

1. The THA Long Logo only spanned Row 1 (48 px), making it appear small and
   disconnected from the workspace navigation below it.
2. The contextBar was rendered in a separate DOM section with its own `border-b`,
   creating a visible horizontal rule between the title row and the toolbar.

The architecture was: `[Header section] + [Toolbar section]` — two separate
components. The correct architecture is: `[Banner = Row 1 + Row 2]` — one component.

---

## Root Cause

`WorkspaceHeader` rendered two sibling `<div>` blocks, each with `realm-header-bg
border-b realm-header-border`:

```
<div class="realm-header-bg border-b ...">   ← title row (logo at max-h-6 = 24px)
  <div class="hidden sm:grid ...">
    [invisible spacer] [contextBar spanning col 2-4]
  </div>
</div>

<div class="realm-header-bg border-b ...">   ← contextBar (separate section)
  <div class="hidden sm:grid ...">
    [invisible spacer] [contextBar spanning col 2-4]
  </div>
</div>
```

The invisible spacer duplicated the logo width to align the contextBar with the
title, but the TWO `border-b` lines created the visual divide.

---

## Solution

Collapse both rows into ONE `<div class="realm-header-bg border-b ...">` using a
2D CSS grid:

```
gridTemplateColumns: "auto auto 1fr auto"
gridTemplateRows:    "48px auto"
```

The logo cell uses `grid-row: 1 / 3` (spans both rows). The divider uses
`self-stretch` inside the logo's flex container so it fills the full banner height.
The contextBar is placed in row 2 via `grid-row: 2; grid-column: 2 / -1`, naturally
aligning its left edge with the page title above.

Logo size changes from `max-h-6` (24 px) to `height: 68 px` when the contextBar is
present — approximately 77 % of the full 88 px two-row banner height (within the
80–90 % target).

---

## Platform Banner Rule (New)

Every primary page has one unified two-row banner:

```
┌──────────────────────────────────────────────────────────────┐
│ THA Long Logo │ Page Title │ Search │ Actions │ Basket │ Prof │  Row 1 — 48 px
│               │ Workspace Navigation / Tabs / Filters        │  Row 2 — 40 px+
└──────────────────────────────────────────────────────────────┘
```

- Logo spans both rows; fills ~80 % of banner height; never stretched; aspect ratio
  preserved.
- Page title and workspace navigation share a column — their left edges align
  exactly.
- One `border-b` at the very bottom of the banner. No visual divide between rows.
- Sidebar begins below the banner. Banner is fixed; sidebar never overlaps it.
- Banner spans the full application width.
- No page implements its own header differently.

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/components/workspace-header.tsx` | Unified two-row grid; logo spans rows; one `border-b`; contextBar moved into main grid |

---

## Verification

Manual test on: Cookbook, Planner, Shopping, Pantry, Diary, Plant Diversity,
Products/Analyser, Dashboard, Partners, Profile.

- Logo fills full banner height ✓
- No divider between title row and workspace navigation row ✓
- Page title and workspace navigation left-align ✓
- Sidebar expands/collapses without moving banner ✓
- Banner height stable across all pages ✓
