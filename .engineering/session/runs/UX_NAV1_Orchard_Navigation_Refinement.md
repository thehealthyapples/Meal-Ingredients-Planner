# UX_NAV1 — Orchard Navigation Refinement

**Session ID:** `UX_NAV1_Orchard_Navigation_Refinement`
**Objective:** Refine the THA navigation to match the North Star Orchard design —
one continuous shelf instead of nine pills, the active room lit rather than
filled, calmer spacing, better balance with the permanent header.
**Rollback ID:** `rollback/UXNAV1-orchard-navigation-refinement-20260719` → `5d5ccd09`
**Stage:** Complete — awaiting owner review
**Report:** `docs/implementation/UX_NAV1_ORCHARD_NAVIGATION_REFINEMENT.md`

---

## Rollback

Annotated tag `rollback/UXNAV1-orchard-navigation-refinement-20260719` → `5d5ccd09`.

**The tree was effectively clean at tag time, and this commit carries no other
session's work** — which is worth stating plainly, because the two commits before
it did not have that property (`aa2f58cb` carried COMM1A + COMM2; `1f7be63a`
carried seven workstreams).

The one uncommitted file at tag time was `.engineering/session/CURRENT.md`, and
its only modification was an **automated Stop-hook heartbeat timestamp** — not a
session's work. It was checked rather than assumed: NAV1's caveat was inherited
from a genuinely dirty tree, and repeating that warning here without looking
would have been a copied disclaimer rather than a fact.

---

## Scope

Visual refinement only, and it held. **No route, no navigation ownership, no page
behaviour, no business logic changed.** `NAV_ITEMS`, `roomsByHref`, every route,
`app-shell.tsx`, `workspace-header.tsx` and every page file are byte-unchanged.

## What was built

- `nav-bar.tsx` — `REALM_STYLES` lost `mobileActive`/`mobileInactive` (the nine
  filled pills) and gained `hue`, the one number both were built out of. No realm
  changed hue. `BottomNavItem` relit; shelf surface and spacing calmed.
- `index.css` — `.nav-shelf-item` / `.nav-shelf-item--lit`: the glow, the
  light-line, the ink, light and dark. Placed beside the existing
  `.dark [data-realm]` realm blocks, matching that convention.
- `scripts/capture-uxnav1-orchard-navigation.ts` — before/after harness that
  **asserts behaviour is identical** (`headers=1 nav=1 items=9 activePips=1
  errors=0`) rather than only taking pictures.

## The finding worth keeping

Carrying the shelf sheerer exposed that **~5% of the page had always bled through
the navigation** — the nine filled pills had been masking the middle of the bar,
so it only showed in the gaps. Removing the fills made a pre-existing defect
visible end to end. Fixed by making the shelf opaque and retiring `backdrop-blur`
(furniture is opaque; frosted glass is a technology signature, Blueprint § 1.5).
**Removing a decoration can expose what it was covering for — that is the useful
kind of regression.**

## Verified

- Browser: **12/12 before, 12/12 after** (6 rooms × 2 viewports, six realm hues).
  Behaviour asserted identical, not eyeballed.
- `typecheck:ci`: 16 regressions, **all pre-existing** and all in
  `server/tests/test-plan2-planner-evolution.ts`; **0 introduced**.
- `build`: 🟢, same 4 pre-existing warnings.
- `adoption:check`: **83 passed · 0 notices · 9 failed**, all 9 pre-existing and
  unrelated — matches NAV1's baseline.
- Dark variants proven by forcing the `dark` class in a browser; they are
  **unreachable in the running product** (no theme owner exists), and that is
  recorded rather than hidden.

## Honest accounting

⚠️ The `dark:` adoption measure fell **737 → 693**, and that is a **relocation,
not 44 units of debt repaid** — the pattern counts `\bdark:` and does not match
`.dark `. Recorded in the register's Navigation row so it cannot be misread as
progress.

## Test result

🔴 **`npm test` is RED and was already red before this change.** It fails at
`test:benchmark-conversation-isolation`, which NAV1 recorded as failing
deterministically and **reproduced at `993e1bc8` in a clean detached worktree**.
UX_NAV1 changed two client presentation files and one script and cannot reach it.
Not fixed here. NAV1's recommendation stands: **BENCHINT3**.

## Next action

Owner to review `docs/implementation/UX_NAV1_ORCHARD_NAVIGATION_REFINEMENT.md`,
in particular the § 4 opacity finding and the § 6 honest accounting.

Open items, all inherited rather than created: **BENCHINT3** (the red suite),
**NAV2** (the unadopted `RoomActions` rail — deleting the dormant
`DesktopSidebar` with it would retire the third copy of every realm hue),
**COMM2 § 11.4** (nine rooms at 390px, untouched), and the Product Registry
sweep for the shared chrome change.
