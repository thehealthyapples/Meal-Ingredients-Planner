# WX14 — Platform Navigation Ownership and Global Header Implementation

Sequential fix log. Pre-implementation investigation, then per-page changes.

**Rollback identifier:** `wx14-nav-before`

---

## Git Status at Start

Branch: `safety/preserve-since-last-prod-20260617-1613`
Working tree: clean
Head commit: `4636ca6` docs(wx15b)

---

## Architecture Pre-Check

- ✓ One canonical platform shell: `WorkspaceHeader` in `workspace-header.tsx`
- ✓ Single THA apple asset: `tha-apple.png`
- ✓ Single long logo: `logo-long.png` in `/public`
- ✓ Account Apple (`ProfileMenu`) already owns only account navigation
- ✓ Shopping Trolley (`basketIcon`) already dedicated to `/shopping-workspace`
- ✓ No duplicate navigation controls
- ✓ No schema changes required
- ✓ No API changes required

All pre-checks pass.

---

## Header Ownership Model (Target State)

```
┌────────────────────────────────────────────────────────────────────┐
│ THA Logo │ Page Title │ Center Content │ Workspace Apple │ Basket │ Account │
│          │ Workspace Navigation / Tabs / Filters                  │
└────────────────────────────────────────────────────────────────────┘
```

| Slot | Control | Responsibility |
|------|---------|----------------|
| Left | THA Long Logo | Dashboard (global home) |
| Col 2 | Page Title | Current workspace label |
| Col 3 | Search / center content | Page-level search |
| Right[1] | Workspace Apple | Current workspace actions |
| Right[2] | Shopping Trolley | Shopping Workspace |
| Right[3] | Account Apple | Profile / Partners / Admin / Logout |

The `actions` prop in `WorkspaceHeader` maps to the **Workspace Apple** slot. This is positioned left of the basket, right of center content — matching the target layout.

---

## Current State Per Page

| Page | `actions` content | Problem |
|------|-------------------|---------|
| Shopping | THA apple dropdown (comprehensive menu) | ✓ already correct |
| Planner | `MoreHorizontal` icon dropdown | Wrong icon — should be THA apple |
| Cookbook | Create Meal CTA + Import Library button | No workspace apple; import is standalone button |
| Pantry | nothing | Missing workspace apple entirely |
| Analyser | Compare button + Filter popover | No workspace apple; filter is floating popover |
| Nutrition | nothing | Missing workspace apple entirely |
| Diary | SlidersHorizontal settings button (desktop-only) | Single icon, not workspace apple; hidden on mobile |

---

## Account Apple (ProfileMenu) — Current Content

Already compliant. Contains only account-level items:
- Profile
- Partners
- Admin: Users, Picks, Recipe Sources (admin-only, appropriate)
- Log out

No workspace items. No changes required.

---

## Changes Required

### 1. Planner — Change trigger icon
File: `client/src/pages/weekly-planner-page.tsx`
Change: Replace `MoreHorizontal` trigger button with THA apple image (same dropdown content)
Import: Add `thaAppleSrc from "@/assets/icons/tha-apple.png"`

### 2. Cookbook — Add workspace apple alongside Create Meal CTA
File: `client/src/pages/meals-page.tsx`
Change:
- Move "Import Library" button from standalone conditional button into workspace apple dropdown
- Add THA apple workspace dropdown after Create Meal CTA in `actions`
- Workspace items: Import Library (conditional), Scan Recipe

### 3. Pantry — Add workspace apple
File: `client/src/pages/pantry-page.tsx`
Change: Add `actions` prop with THA apple dropdown
Content: Mode switcher (Inventory / Explore) — mirrors the contextBar tabs which are the primary workspace navigation. These give desktop users the same navigation access as the contextBar on a second glance.
Import: Add `thaAppleSrc`, DropdownMenu components

### 4. Analyser — Add workspace apple
File: `client/src/pages/products-page.tsx`
Change: Add THA apple workspace dropdown alongside existing compare button and filter popover in `actions`
Content: Analyser settings (regulatory scoring, sound effects, barcode scanner)
Note: Filter popover stays as-is — it's a primary search tool, not a workspace menu. The workspace apple adds settings access.
Imports: Add DropdownMenu components (thaAppleSrc already imported)

### 5. Nutrition — Add workspace apple
File: `client/src/pages/plant-diversity-page.tsx`
Change: Add `actions` prop with THA apple dropdown
Content: View shortcuts (Foods / Nutrients / Benefits / Suggestions) — mirrors contextBar tabs
Imports: Add DropdownMenu components, thaAppleSrc

### 6. Diary — Enhance to workspace apple dropdown
File: `client/src/pages/food-diary-page.tsx`
Change: Replace bare `SlidersHorizontal` settings button with THA apple workspace dropdown
Content: Diary Settings, Copy from Planner, Import CSV
Benefit: Works on both mobile and desktop (current settings button is `hidden md:flex`)
Imports: Add DropdownMenu components (thaAppleSrc already imported)

---

## Visual Consistency Rule

All workspace apples use:
```
h-9 w-9 rounded-lg  (matches basket + account apple dimensions)
```

Image: `h-[34px] w-[34px] object-contain` inside the button (matches ProfileMenu icon).

---

## Mobile Safety Analysis

After WX15B, mobile header shows THA long logo (max 120px, 28px tall) instead of single apple.
Right side with workspace apple: [workspace 36px] + [basket 36px] + [profile 36px] = ~112px + gaps.
Title is `truncate max-w-[160px]`.
Content area on 375px phone: 375 - 24px padding = 351px.
Logo (~100px) + gap(8px) + title(avg ~70px) = ~178px + 112px right = ~290px → fits within 351px ✓

Shopping workspace already uses this layout (THA apple as workspace action + basket + profile). The pattern is proven.

---

## Files Changed

1. `client/src/pages/weekly-planner-page.tsx`
2. `client/src/pages/meals-page.tsx`
3. `client/src/pages/pantry-page.tsx`
4. `client/src/pages/products-page.tsx`
5. `client/src/pages/plant-diversity-page.tsx`
6. `client/src/pages/food-diary-page.tsx`

`workspace-header.tsx` — NOT changed (interface already correct).
`nav-bar.tsx` — NOT changed (Account Apple already clean).

---

## Verification Plan

After implementation:
- [ ] Planner header: THA apple trigger → workspace menu
- [ ] Cookbook header: THA apple + Create Meal button coexist
- [ ] Pantry header: THA apple trigger → mode options
- [ ] Analyser header: THA apple trigger → settings
- [ ] Nutrition header: THA apple trigger → view options
- [ ] Diary header: THA apple trigger → settings + import actions (mobile AND desktop)
- [ ] Shopping: unchanged ✓
- [ ] Account Apple: Profile / Partners / Admin / Logout only (no workspace items)
- [ ] Build passes

---

*Written before code changes, as required.*
