# WX10C — Shopping Workspace Canonical Ownership

**Branch:** safety/preserve-since-last-prod-20260617-1613  
**Date:** 2026-06-27  
**Rollback checkpoint:** `dd5f5efd477636117f7c1ff7b5db588d3df3151d` (git stash)

---

## Architecture Compliance Checks

| Check | Status |
|---|---|
| One canonical Shopping Workspace | ✅ `/shopping-workspace` |
| One owner for shopping state | ✅ `ShoppingWorkspacePage` |
| One owner for shopping inputs | ✅ Moved Quick List add UI into workspace |
| One owner for shopping history | ✅ localStorage history owned by workspace |
| No duplicate shopping workflows | ✅ Quick List removed |
| Extend existing Shopping architecture | ✅ New "add" mode added |
| No schema changes | ✅ |
| No AI changes | ✅ |
| No duplicate routes left active | ✅ Old routes redirect |

---

## Problem Statement

Before this change the app had two parallel shopping entry points:

- `/shopping-list` → `ListPage` ("Quick List") — a standalone textarea-first page for typing a list
- `/shopping-workspace` → `ShoppingWorkspacePage` — the full Review/Prep/Shop workspace

Users thinking "I need to buy something" faced an ambiguous choice between two destinations. This contradicts the one-entity-one-owner architecture principle.

---

## Canonical Decision

Shopping Workspace (`/shopping-workspace`) owns **all** shopping interactions:

- Quick Add (formerly Quick List)
- Shopping List (Review)
- Prep Mode
- In-Store Mode (Shop)
- Shopping History
- Product Search / Scan / Voice

---

## Files Changed

### `client/src/components/nav-bar.tsx`
- Removed "Quick List" from `NAV_ITEMS_MAIN` and `MOBILE_BOTTOM_ITEMS`
- Renamed "Shop" → "Shopping"
- Changed href from `/shopping-workspace?stage=shop` → `/shopping-workspace`
- Removed `ListPlus` icon import (no longer used)
- Mobile nav goes from 7 items to 6 items (List removed, Shopping replaces Shop)

### `client/src/App.tsx`
- `/list` route: `<Redirect to="/shopping-workspace" />`
- `/shopping-list` route: `<Redirect to="/shopping-workspace" />`
- Removed `ListPage` import

### `client/src/pages/shopping-workspace-page.tsx`
- Added `"add"` as first `WorkspaceMode` (default)
- Ported Quick List textarea functionality into workspace
- Added `parsedAddItems` memoization, `resizeAddTextarea`, `toggleAddSpeech`, `handleAddImageCapture`
- Added `processAndAddToList()`: parses list, calls server APIs, switches to review mode
- Added localStorage history: `loadAddHistory`, `saveAddToHistory`
- Added desktop 2-column layout for Add mode (history sidebar left, add UI right)
- Added mobile history list below add textarea
- Updated empty state in Review/Prep/Shop to link back to Add mode
- Updated mode sync useEffect to handle "add"
- Updated default mode to "add"

---

## Routing Decision

| Old Route | New Behaviour |
|---|---|
| `/quick-list` | Never existed — no action needed |
| `/list` | Permanent redirect → `/shopping-workspace` |
| `/shopping-list` | Permanent redirect → `/shopping-workspace` |
| `/shopping-workspace` | Canonical — unchanged |

Chose **redirect** over compatibility route. No independent Quick List experience remains. No data is lost (shopping list items live in the database, history in localStorage).

---

## UX Flow After Migration

```
User thinks: "I need to buy something"
↓
Navigate to Shopping (sidebar / mobile nav)
↓
/shopping-workspace — lands in Add mode (default)
↓
[Textarea: milk, eggs, bananas]
[Voice] [Scan] [Upload]
↓
[Add to shopping list] button
↓
Items added to DB → Switch to Review mode
↓
Review / Prep / Shop workflow (unchanged)
```

---

## Desktop Layout — Add Mode

```
┌─────────────────┬────────────────────────────────────────┐
│  Recent Lists   │  Write your list...                    │
│  ─────────────  │  milk, eggs                           │
│  milk, eggs...  │  bananas, yoghurt                     │
│  3 items · 2h   │  oven chips                           │
│                 │                                         │
│  bread, milk... │  [Voice] [Camera] [Upload]             │
│  2 items · 1d   │  ─────────────────────────────         │
│                 │  [Add to shopping list — 3 items]      │
└─────────────────┴────────────────────────────────────────┘
```

Desktop: 260px sidebar (recent lists) + flex-1 main
Mobile: Textarea full-width, history below

---

## Data Impact

- Reads existing data: Yes (shopping list items, pantry, household eaters)
- Writes new data: No
- Changes meaning of existing data: No
- Requires backfill: No
- Shopping list history stored in localStorage (client-only, unchanged key `tha-quick-list-history`)

---

## Trust Check

- Shopping data: ✅ Not lost
- User lists: ✅ Not lost  
- Shopping history: ✅ Preserved (same localStorage key)
- Only ownership and presentation changed

---

## Manual Verification Checklist

- [ ] Shopping navigation works (sidebar + mobile)
- [ ] Quick List redirect works (`/shopping-list` → `/shopping-workspace`)
- [ ] Add mode loads by default
- [ ] Textarea accepts multi-line input
- [ ] Voice input works
- [ ] Camera scan opens
- [ ] Items submit and appear in Review mode
- [ ] Recent history loads and can be restored
- [ ] Desktop shows history sidebar
- [ ] Mobile shows history below textarea
- [ ] Review / Prep / Shop modes unchanged
- [ ] Basket button works
- [ ] Build passes

---

## Architecture Principle

> Shopping is not one feature among many. It is the canonical workspace for everything related to buying food.
> Every interaction that starts with "I need to buy…" naturally begins and ends within the Shopping Workspace.
