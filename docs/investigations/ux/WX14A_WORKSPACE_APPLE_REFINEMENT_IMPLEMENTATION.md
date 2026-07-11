# WX14A — Workspace Apple Behaviour Refinement & Platform Navigation Rule

**Goal:** Stop the Workspace Apple from duplicating controls that already exist in the
workspace banner, and establish a permanent platform rule that the Workspace Apple is
**optional** — present only when a page has genuine actions not represented elsewhere.

---

## Rollback Protection

- **Git status at start:** clean working tree on branch
  `safety/preserve-since-last-prod-20260617-1613`.
- **Rollback tag created:** `rollback/wx14a-pre-20260628`
  (points at `4667feb`, the WX14-complete commit, before any WX14A change).
- To revert: `git reset --hard rollback/wx14a-pre-20260628`.

---

## Architecture Compliance Review (pre-implementation)

| Check | Result |
|-------|--------|
| One canonical WorkspaceHeader | ✓ `client/src/components/workspace-header.tsx` |
| One owner for workspace navigation | ✓ banner `contextBar` (Row 2) |
| One owner for workspace actions | ✓ `actions` slot → Workspace Apple |
| No duplicate navigation | ✗ FAIL on Pantry & Nutrition (fixed by this work) |
| No duplicate state | ✓ apple read existing state; no new state owners |
| No duplicate controls | ✗ FAIL on Pantry & Nutrition (fixed by this work) |
| Extend existing architecture only | ✓ no new components |
| No schema changes | ✓ |
| No API changes | ✓ |

The two failures are precisely what WX14A removes.

---

## Findings — Workspace Apple contents (WX14 baseline)

| Page | Apple contents (before) | Verdict |
|------|------------------------|---------|
| Shopping | Match Products, Split by shop, Scan, Fullscreen, units, Send to Supermarket, Export, Recalculate, Basket, Clear | ✓ genuine actions (reference) |
| Planner | Send week to basket, Save/Load Week, Share Plan, Clear Week | ✓ genuine actions |
| Cookbook | Scan Recipe, Import Library | ✓ genuine actions |
| Diary | Diary Settings, Copy from Planner, Import CSV | ✓ genuine actions |
| Analyser | Regulatory scoring, Sound, Barcode scanner | ✓ genuine settings/actions |
| **Pantry** | **Inventory / Explore** | ✗ pure duplicate of banner mode tabs (`contextBar`) |
| **Nutrition** | **Foods / Nutrients / Benefits / Suggestions** | ✗ pure duplicate of banner tabs (`contextBar`) |

Pantry's banner already renders Inventory/Explore as `role="tab"` mode buttons, and
Nutrition's banner already renders the four tabs. The apples mirrored them exactly —
no genuine actions existed on either page.

---

## Decision

Pantry and Nutrition have **no genuine, non-duplicated actions** today. Building real
Import/Export/Settings would require API and business-logic changes, which this task
explicitly forbids. Per direction from the product owner:

> Remove the Workspace Apple completely from Pantry and Nutrition for now. Do not
> fabricate actions. Do not add disabled placeholders.

So both apples were **removed entirely** (no fabricated actions, no disabled stubs).

---

## Changes Made

### Pantry — `client/src/pages/pantry-page.tsx`
- Removed the `actions={…}` Workspace Apple dropdown (Inventory/Explore — duplicated the banner mode tabs).
- Removed now-unused imports: `thaAppleSrc`, and the `DropdownMenu*` component import.
- Banner mode switcher (Inventory/Explore) in `contextBar` is unchanged — it remains the single owner of that navigation.

### Nutrition — `client/src/pages/plant-diversity-page.tsx`
- Removed the `actions={…}` Workspace Apple dropdown (Foods/Nutrients/Benefits/Suggestions — duplicated the banner tabs).
- Removed now-unused imports: `thaAppleSrc`, and the `DropdownMenu*` component import.
- Banner tab strip in `contextBar` and the mobile workspace drawer are unchanged.

### Documentation
- `docs/investigations/ux/WX14_PLATFORM_NAVIGATION_OWNERSHIP_AND_GLOBAL_HEADER_IMPLEMENTATION.md` — appended the corrected, canonical platform rule (Workspace Apple is optional) and a superseding note for the Pantry/Nutrition entries.
- This report.

Pages left unchanged (apples already correct): Shopping (reference), Planner, Cookbook, Diary, Analyser.

---

## Permanent Platform Design Rule

**Workspace banner (Row 2) owns navigation** — answers *"Where am I going?"*
(tabs, views, filters, sections, modes). Navigation appears **only** here.

**The Workspace Apple owns actions** — answers *"What can I do from here?"*
(import, export, print, share, settings, tools, utilities, advanced options).

**The Workspace Apple is OPTIONAL.** It appears **only** when a workspace contains
genuine actions that are **not already represented elsewhere in the interface**. A
page with no such actions shows no apple. The apple must **never** duplicate
navigation already in the banner, and must **never** be padded with fabricated or
disabled placeholder items.

**Shopping remains the reference implementation** because it naturally has many
genuine workspace actions.

---

## Platform Verification (ownership model per page)

| Page | Banner = nav | Apple = actions only | Basket | Account Apple | No duplicated controls |
|------|:---:|:---:|:---:|:---:|:---:|
| Planner | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cookbook | ✓ | ✓ | ✓ | ✓ | ✓ |
| Shopping | ✓ | ✓ (reference) | ✓ | ✓ | ✓ |
| Pantry | ✓ | n/a (no apple) | ✓ | ✓ | ✓ |
| Nutrition | ✓ | n/a (no apple) | ✓ | ✓ | ✓ |
| Diary | ✓ | ✓ | ✓ | ✓ | ✓ |
| Analyser | ✓ | ✓ | ✓ | ✓ | ✓ |
| Partners | ✓ | n/a | ✓ | ✓ | ✓ |
| Profile | ✓ | n/a | ✓ | ✓ | ✓ |

---

## Data Impact

- Reads existing data: yes (unchanged)
- Writes new data: no
- Changes meaning of existing data: no
- Requires backfill: no

## Trust Check

- No business logic changes.
- No schema changes.
- No API changes.
- Navigation/actions ownership only — two dropdowns removed plus their dead imports.

---

## Verification

- `tsc --noEmit`: no new errors in `pantry-page.tsx` or `plant-diversity-page.tsx`
  (pre-existing errors elsewhere in `server/scripts` and `server/tests` are unrelated
  and predate this work).
- Build: see "Implementation Result" below.

### Manual verification checklist
- [ ] Pantry: no Workspace Apple in header; Inventory/Explore still switch via banner; search works; desktop + mobile.
- [ ] Nutrition: no Workspace Apple in header; four tabs still switch via banner; mobile workspace drawer still works.
- [ ] Planner / Cookbook / Diary / Analyser: apples unchanged, actions only.
- [ ] Shopping: unchanged (reference).
- [ ] Account Apple: Profile / Partners / Admin / Logout only.

---

## Implementation Result

**Rollback tag:** `rollback/wx14a-pre-20260628`
**Files changed:**
1. `client/src/pages/pantry-page.tsx`
2. `client/src/pages/plant-diversity-page.tsx`
3. `docs/investigations/ux/WX14_PLATFORM_NAVIGATION_OWNERSHIP_AND_GLOBAL_HEADER_IMPLEMENTATION.md`
4. `docs/investigations/ux/WX14A_WORKSPACE_APPLE_REFINEMENT_IMPLEMENTATION.md` (this file)

**Commit:** `5cf522b`
**Build:** `✓ built in 14.14s (client) ⚡ Done in 815ms (server)` — passes clean.
