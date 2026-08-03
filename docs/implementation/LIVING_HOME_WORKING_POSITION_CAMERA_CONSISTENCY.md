# Living Home — Working Position Camera Consistency

**Date:** 2026-08-03 · **Risk:** 🟢 GREEN — refinement of the approved Working Position model (no redesign).
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-camera-consistency-base` → `e1b38dc8`.
**Governing (locked):** Model B, Spatial Blueprint, Working-Position + ownership model. Unchanged.

## What was corrected

Only the **Pantry Shelves** (and, from the last pass, the front-on **Fridge** and **Tea & Coffee**) used the correct camera language — a camera that repositions the household to *face* the destination. **Fruit, Bread, Store Cupboard and Root-veg** still used *wide-room* plates (edits of the Arrival — same composition, so it felt like "labels appearing over the room"). This pass gives those four their own **dedicated repositioned cameras**, so **every destination now uses one consistent movement language**: Arrival → walk to it → its own Working Position → Living Objects.

Four new **dedicated-camera** plates (fresh text-to-image, *not* zooms/crops of the Arrival):
- **Fruit** — standing at the willow fruit baskets by the window.
- **Bread** — standing at the bread crock and board of loaves.
- **Store Cupboard** — standing directly in front of the open oak cupboard, **both doors open** (its categories→items hierarchy is preserved).
- **Root-veg** — standing at the handcrafted black-steel wire rack.

## Every destination now has its own camera

| Working Position | Camera | Source |
|---|---|---|
| Pantry Shelves | close, facing the shelves | `shelf.png` (unchanged) |
| Fridge | front-on, both doors open | `work-fridge.png` (prev pass) |
| Tea & Coffee | at the drinks station | `work-tea-coffee.png` (prev pass) |
| **Fruit** | at the baskets by the window | **`work-fruit.png` (new)** |
| **Bread** | at the bread store | **`work-bread.png` (replaced)** |
| **Store Cupboard** | in front of the open cupboard | **`work-cupboard.png` (replaced)** |
| **Root-veg** | at the wire rack | **`work-rootveg.png` (replaced)** |

The "same camera + labels appear" model is removed for these four.

## Continuous room navigation (unchanged, still works)

The spatial navigation from Pass 02 is intact: from any Working Position the other destinations remain directly selectable (no return to Arrival). The walk-through capture confirms it — Arrival → Fruit → Fridge → Root-veg → Bread → Tea & Coffee → Cupboard, each reached via its hotspot. *(As before, the peripheral-destination hotspots are positioned to the room layout and are a spatial approximation on each dedicated close-up — the same behaviour the Shelves have always had; a per-plate hotspot tune is a possible future refinement.)*

## Files changed

| File | Change |
|---|---|
| `client/public/images/living-home/room/work-fruit.png` | **new** dedicated Fruit camera |
| `client/public/images/living-home/room/work-bread.png` | **replaced** with dedicated Bread camera |
| `client/public/images/living-home/room/work-cupboard.png` | **replaced** with dedicated (open) Cupboard camera |
| `client/public/images/living-home/room/work-rootveg.png` | **replaced** with dedicated Root-veg camera |
| `client/src/pages/living-home-room.tsx` | Fruit bowl repointed to its own `fruit` plate; `ROOM_PLATES` += `fruit` |
| `client/src/pages/living-home-room.css` | `.lh-plate--fruit` layer |
| `docs/asset-specs/WP_{FRUIT,BREAD,CUPBOARD,ROOTVEG}_SPEC.md` | new — dedicated-camera specs |

## Before / after screenshots

`docs/implementation/household-evidence/`: `fruit-bowl`, `bread`, `cupboard`, `rootveg` now each show a **dedicated camera** (before: the wide-room `rooms-evidence/*.png`).

## Regression checks

- **Camera language consistent across all destinations** (shelves, fridge, tea & coffee, fruit, bread, cupboard, root-veg).
- Continuous navigation and the cupboard categories→items hierarchy still work (walk-through captured); pantry Shelves → Category path intact.
- App compiles; walk-through captured with **no console errors**.
- No architecture, navigation-philosophy, ownership or Companion-ownership change.
- **OpenAI:** 4 fresh generations ≈ **£0.70** (accepted first candidates; within the £5 gate).

## Remaining Home Owner observations
- **Kitchen worktop** still reuses the wide `baskets` plate (large fruit) — a dedicated camera for it is optional/low priority.
- The retired wide-room `work-{bread,cupboard,rootveg}` masters are kept in `artifacts/` for rollback (one owner — the promoted files now point to the dedicated cameras).
- Continuous-nav hotspots could be tuned per dedicated plate in a future craftsmanship pass.

## Definition of done — status
The Living Home now has **one consistent navigation language**: every destination is physically approached and has its own handcrafted Working Position camera. The household moves naturally around one kitchen rather than opening application pages.
