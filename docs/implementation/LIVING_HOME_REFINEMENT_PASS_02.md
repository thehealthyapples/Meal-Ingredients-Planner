# Living Home — Refinement Pass 02

**Date:** 2026-08-03 · **Risk:** 🟢 GREEN — runtime refinement (no new features, no redesign).
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-refinement-02-base` → `e1b38dc8`.
**Governing (locked):** Model B, Spatial Blueprint, Working-Position + ownership model, Companion ownership. Unchanged.

## What was refined

### #2 Continuous room navigation (the headline)
The room is no longer hub-and-spoke. From **any** Working Position, every **other visible destination stays directly selectable** — you turn and walk across the kitchen; you do not go *back → arrival → select*. Because every Working plate is the same room, each destination sits in the same place in every view, so its approach region is always live. Only the Arrival remains as the orientation retreat.
*Evidence:* `refine02-evidence/3-shelves-to-fridge.png` and `4-fridge-to-cupboard.png` — the walk **Shelves → Fridge → Store cupboard** happened with no return to Arrival.

### #4 Cupboard hierarchy mirrors the shelves
The store cupboard now has the shelves' depth: **Cupboard → categories → a category's Living Objects.** Categories: Tinned fish, Soups, Beans, Tomatoes, Tinned veg, Coconut — each opening its own items (e.g. **Beans → Kidney · Butter · Chickpeas · Cannellini · Black**), via the same "step closer" transition as the shelves, not a label reveal.
*Evidence:* `refine02-evidence/5-cupboard-beans.png`.

### #1 Every destination uses a Working Position
Fridge, Freezer, Store cupboard, Root-veg rack and Bread store each have their own open Working-Position plate; the Shelves have theirs. (Fruit bowl & Kitchen worktop currently share the baskets plate; Tea & coffee shares the shelf plate — bespoke plates for those are noted below.)

### #3 Root vegetable rack now in the Arrival (Orientation)
The handcrafted **black-steel wire root-veg rack** (potatoes, sweet potatoes, onions, garlic, shallots) is now permanent furniture in the Arrival plate — visible on entry, not only after selection.

### #5 Microgreens — natural growing position
The tray that perched on the worktop edge is replaced by a **suspended timber window planter** of microgreens in the daylight.

### #6 Kombucha — authentic fermentation vessel
Now a clear glass jar with a visible **SCOBY** and amber tea, on a **handcrafted timber stand with a dispensing tap** and a cloth-tied neck.

### #7 Glass materials
The jars read further as genuine glass — the empty upper shoulders are more see-through (room visible through them), with a crisper lid, more internal contrast/depth, and grounded contact shadows so they rest on the timber.

### #8/#9 Orientation & household storage — preserved
Arrival remains representative dressing only (no inventory); food stays organised by household behaviour (berries/grapes/herbs in the fridge, roots on the rack, drinks at Tea & coffee, etc.).

### #10 Companion presence — reviewed (not changed this pass)
Reviewed as instructed; recommendation recorded below. Not altered, to avoid touching the shared 1,900-line `FloatingAssistant` in a refinement pass — ownership/interaction are correct and must not change.

## Files changed

| File | Change |
|---|---|
| `client/src/pages/living-home-room.tsx` | continuous-navigation destinations (every other destination selectable from anywhere); store-cupboard `categories → items` depth; `zone-category` level; unchanged pantry/zone/ownership logic |
| `client/src/pages/living-home-room.css` | `.lh-layer` made click-through (so nav hotspots stay reachable) with name-plates capturing; refined jar glass (#7) |
| `client/public/images/living-home/room/arrival.png` | promoted **arrival-v6** (root-veg rack in arrival + hanging microgreens + tapped kombucha) |
| `docs/asset-specs/ARRIVAL_PLATE_V6_REFINE_SPEC.md`, `scripts/capture-living-home-continuous.ts` | new — spec + continuous-nav capture |

## Regression checks

- **Bug found & fixed during capture:** the jar layer covered the stage and blocked the new nav hotspots; made `.lh-layer` click-through except its name-plates. Continuous nav now works and name-plate selection still works (verified — beans items selectable).
- **Canonical pantry path intact:** Arrival → Shelves → Category (real jars, multi-select, Ask Apple) unchanged.
- App compiles; the continuous walk-through captured end-to-end with **no console errors**.
- No architecture, navigation-philosophy, ownership or Companion-ownership change — refinement only.
- **OpenAI:** 1 plate edit ≈ **£0.19** (session total well under £5).

## Remaining Home Owner observations

- **Working-plate dressing consistency:** the zone Working plates (fridge/freezer/cupboard/rootveg/bread/baskets) are edits of the *earlier* arrival, so they still show the old microgreens/kombucha. Regenerating them from arrival-v6 would make the continuous room fully consistent — a follow-up (~6 edits).
- **Own plates for Fruit bowl / Kitchen worktop / Tea & coffee** (currently shared) — to complete #1.
- **Fridge label row** (9 items) reads a little crowded — a label-layout tuning pass.
- **Companion presence (#10):** recommend softening the assistant's entrance and idle so it reads as a quiet household companion, not an app control — a small, isolated change inside `FloatingAssistant` (quieter idle, gentle fade/timing, less button-chrome), deferred here to avoid risk to the shared component.
- **Nav hotspot placement** is sensible but approximate/close together — worth a tuning pass.

## Definition of done — status

The Living Home now behaves like one continuous kitchen: you move destination-to-destination as physical steps (turn, cross the room, open another cupboard), the store cupboard mirrors the shelves' depth, the root-veg rack lives in the room, and the glass, microgreens and kombucha read as genuine home craft. The follow-ups above (plate consistency, remaining own-plates, Companion presence) are the next refinements.
