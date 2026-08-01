# Living Larder — Brass Shelf-Edge Plaque Implementation

**Date:** 2026-08-01 · **Risk:** 🟢 GREEN — UI interaction engineered into the running app.
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/larder-northstar-fidelity-base` → `3b8adef2`.
**Settled language:** Option A shelf-edge plaques, **brass** (Home Owner choice). Not a mock-up — real React/CSS wired to real data.

## What was engineered

- **Promoted the canonical room into runtime:** `client/public/images/living-larder/room/orchard-workroom.png` (the concept-a Orchard Workroom, unchanged — not regenerated).
- **`client/src/pages/larder-plaque-room.tsx`** — the running room: the photoreal room as the fixed, dominant full-bleed background; a **brass plaque built onto each shelf edge** as the interaction surface (absolutely %-anchored to the shelves, seated with a shadow + engraved text + corner screws — not a floating card). Wired to the household's real staples (`/api/pantry`, Domain 30).
- **`client/src/pages/larder-plaque-room.css`** — brass plate material + all states.
- **`client/src/App.tsx`** — `/pantry` now renders the plaque room; the old constructed elevation (`larder-room.tsx`) is **retained as a fallback** (still the declared Life-asset mouth).

## Interaction (progressive disclosure)

- **L1 — Beautiful room.** Plaques subtle at rest (opacity 0.9, receding toward the wood). Only names show.
- **L2 — Hover / select.** Hover gently warms + enlarges the plaque and brightens *only that shelf's* produce (soft-light lift of the real photo, per-shelf region). Selecting makes it the active category — the plaque enlarges further and reveals **count + status**.
- **L3 — Shelf contents.** The selected shelf's jars are listed in a warm drawer — **only ever one shelf at a time**; never all jar names at once.
- **L4 — Jar acted on.** Tapping a jar adds it to shopping (keeps the staple), with a toast. (Fuller per-jar menu is a follow-up.)
The room always wins: no persistent overlay dims it; the drawer is dismissible and bottom-anchored.

## Data mapping (no new owner)

Real staples are placed on the room's shelves by reconciling the two taxonomies:
- `category === fruit | fridge | freezer` → the Fruit basket / Fridge / Freezer areas.
- `larder | household | pet` staples → classified into the six food-group shelves by keyword (`FOOD_GROUPS`). Unclassified staples aren't placed on a shelf (honest; documented).
Status = **Well stocked** unless any item in the bundle carries the Domain-30 running-low flag (**Running low**). No quantity/fill/expiry is shown (LARDER1 §16).

## Home Owner note folded in (fresh fruit basket; fridge/freezer)

- **Fruit & Veg** is a plaque on the worktop (where a basket sits) — fresh produce (`category: fruit`) discloses there.
- **Fridge** and **Freezer** are included as **honest, dimmed "coming soon" stubs** — this room photograph depicts neither, and the room must not be regenerated, so they are not faked into the picture. Making them real needs a room asset that shows cold storage (a content decision, not code).

## Verification boundary (CAPBOUND1 — honest)

This was authored **without a local run** — this environment has no dev server, database, or auth, and positioned plaques over a photoreal image with hover/select/disclosure states are inherently visual-iteration work. Attribution Test: a different implementer *with a dev environment* would not be blocked → this is an **environment boundary, not a THA limitation**. The code is real and complete as a first implementation; it needs a dev-env pass to:
1. **run it** — `npm i && npm run dev`, open `/pantry`;
2. **nudge the %-anchors** in `FOOD_GROUPS` (plaque `x/y` and `shelf` regions) to sit exactly on the shelves at the served aspect ratio;
3. confirm the hover/select/disclosure transitions and the classifier against the household's real items;
4. check responsive framing (the room uses `aspect-ratio` + `cover`).

## Validation

`verify-living-home-assets` — unchanged (26 pass / same 5 known: 4 Windows path artifacts + 1 dressing byte-lock). The new component imports **no** Life assets, so the one-mouth rule is intact; no asset/checksum/Life-Register change.

**Governance to complete:** the promoted room PNG is a new production background asset and should be entered into the House Register (checksum-bound) before release (CB9). Recorded here; not yet added.

## Definition of done

- [x] Brass plaque engineered into the running app (real code, `/pantry`).
- [x] Plaque physically attached to the shelf edge (seated, not floating); room dominant.
- [x] Subtle at rest; hover warms+enlarges; select → active + progressive disclosure; never all jar names at once.
- [x] Wired to real pantry data; Home Owner's fruit-basket + fridge/freezer note reflected (stubs honest).
- [x] No room regeneration, no image generation, no cabinetry/lighting redesign.
- [ ] **Dev-env verification + anchor tuning** — required before release (environment boundary).
- [ ] House-Register entry for the room PNG.
