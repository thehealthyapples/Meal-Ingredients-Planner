# Living Home — Household Storage Philosophy

**Date:** 2026-08-03 · **Risk:** 🟢 GREEN — runtime refinement (household organisation only).
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-household-storage-base` → `e1b38dc8`.
**Governing (locked):** Model B, Spatial Blueprint, Working-Position + ownership model. Architecture, navigation, interaction and Companion ownership unchanged.

## What changed

Food is now organised by **"where would this household naturally look for it?"** — not by supermarket category. This is a **taxonomy/config reorganisation** of the existing runtime plus two new handcrafted household fixtures the brief asked to *create* (a root-vegetable rack and a bread store). No new interaction concept; the same journey (Arrival → approach → Working Position → Living Objects → Companion) now reaches household-true locations.

## Revised storage zones & justification

| Household location | Lives here | Why a household looks here |
|---|---|---|
| **Fruit bowl** | apples, bananas, pears, satsumas, oranges, mangoes, avocados | ready-to-eat fruit kept visible; quietly encourages healthy snacking |
| **Kitchen worktop** | watermelon, pineapple, pumpkin, squash | large produce that naturally stays out, not hidden in storage |
| **Fridge** | milk, yoghurt, cheese, eggs, **berries, grapes, leafy herbs**, leftovers, prepared meals | foods that benefit from cold — *berries live here, not the fruit bowl* |
| **Freezer** | frozen veg, frozen fruit, meat, fish, prepared meals | the frozen store |
| **Root veg rack** *(new)* | potatoes, sweet potatoes, onions, garlic, shallots | cool, dry roots — a handcrafted black-steel wire rack, where a home keeps spuds & onions |
| **Store cupboard** | tomatoes, beans, soups, tuna, coconut milk | tinned & long-life goods |
| **Pantry shelves** | flours, grains, pulses, rice & pasta, oils & vinegars, baking | dry cooking staples |
| **Tea & coffee** | black tea, herbal teas, coffee, hot chocolate | the household's drinks station, grouped as they'd recognise it |
| **Bread store** *(new)* | bread, rolls, wraps, bagels | a natural bread location, like a normal family kitchen |

**Key relocations away from retail categorisation:** berries/grapes/leafy herbs → **fridge** (not a fruit shelf); potatoes/onions/garlic/shallots → **root veg rack** (not "fruit & veg"); teas & coffee → their own **drinks station** (off the pantry shelves); large melons/pineapple → **kitchen worktop**; bread given its own **store**; oils & vinegars consolidated onto the **pantry shelves**.

## Files changed

| File | Change |
|---|---|
| `client/src/pages/living-home-room.tsx` | `GROUPS` reorganised (household dry staples); `ZONES` reorganised into household locations, each with a `plate`; `ROOM_PLATES`; plate rendering keyed on the zone's plate |
| `client/src/pages/living-home-room.css` | `--rootveg` and `--bread` plate layers |
| `client/public/images/living-home/room/work-{rootveg,bread}.png` | promoted two new fixture plates |
| `docs/asset-specs/WORK_{ROOTVEG,BREAD}_SPEC.md`, `scripts/capture-living-home-household.ts` | new — specs + household walk-through capture |

## Before / after screenshots

`docs/implementation/household-evidence/`: `arrival`, `fruit-bowl`, `fridge`, `rootveg` (the new black-steel rack with Potatoes/Sweet potatoes/Onions/Garlic/Shallots), `bread`, `tea-coffee`, `cupboard`. The previous supermarket-style "Fruit & veg" basket (apples+onions+potatoes together) is replaced by a **Fruit bowl** (fruit) and a **Root veg rack** (roots) — the before is preserved in `docs/implementation/rooms-evidence/baskets.png`.

## Regression checks

- **Canonical pantry path intact:** Arrival → Shelves → Category still works, now with household staple groups (flours, grains, pulses, rice & pasta, oils & vinegars, baking).
- App compiles; the household walk-through captured end-to-end (arrival + 6 zones + back) with **no console errors**.
- No architecture, navigation, ownership or Companion change — taxonomy + two fixtures only.
- **OpenAI:** 2 plate edits ≈ **£0.38** (session total well under £5); no room re-composed from scratch (both edits of the canonical room).

## Remaining Home Owner review items

- **Shared plates (representative):** the Fruit bowl and Kitchen worktop currently share the baskets plate, and Tea & coffee shares the shelf plate — bespoke close-up plates for each are a follow-up.
- **Arrival orientation:** the canonical Arrival plate was preserved, so it does not yet *show* the new root-veg rack and bread store (approaching them works; adding them to the orientation view is an optional follow-up rather than redesigning the room now).
- **Hotspot placement:** the new zones' approach regions are placed over sensible arrival areas but are approximate/close together — worth a tuning pass.
- **Dynamic transitions** (e.g. avocado ripe → fridge) are *not* implemented (not required); the architecture supports them naturally — an item is simply data assigned to a location, so re-homing it later is a data move.
- Zone Living Objects remain **representative labels** (not individual object PNGs), as in the prior expansion.

## Definition of done — status

The Living Home no longer mirrors supermarket aisles; it mirrors how a real household stores food, and the household instinctively knows where to look (berries in the fridge, spuds on the veg rack, bread in the bread store, drinks at the tea & coffee station). Home-Owner acceptance of the two new fixture plates, and the follow-ups above, remain.
