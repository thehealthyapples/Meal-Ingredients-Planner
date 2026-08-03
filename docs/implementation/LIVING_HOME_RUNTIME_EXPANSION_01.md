# Living Home — Runtime Expansion 01 (Fridge · Freezer · Store Cupboard · Baskets)

**Date:** 2026-08-02 · **Risk:** 🟢 GREEN — extending the approved runtime (no redesign).
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-runtime-expansion-01-base` → `e1b38dc8`.
**Governing (locked):** Model B, Spatial Blueprint, Working-Position + ownership model. Architecture unchanged.

## What was built

The Living Larder is the canonical implementation; the four remaining zones of **the same room** — the **Fridge**, **Freezer**, **Store Cupboard** and **Fruit & Veg Baskets** — now follow it exactly. They are not separate application pages: they are destinations you *approach from the same Arrival room*, so the household walks one continuous home.

**Environments (this pass's priority) — four Working-Position plates**, each produced by `images/edits` on the canonical Arrival plate, so every one is **the same room with only that zone opened**:

| Zone | Arrival (orientation) | Working Position (open, stocked) |
|---|---|---|
| **Fridge** | oak doors closed | upper doors open → milk, yoghurt, cheese, eggs, leftovers, sauces |
| **Freezer** | drawer fronts closed | lower drawers open → frozen veg, fruit, meat, fish, prepared meals |
| **Store Cupboard** | cabinetry closed | lower doors open → tins of tomatoes, beans, soup, tuna, coconut milk |
| **Baskets** | baskets with representative fruit | fuller baskets → apples, bananas, oranges, onions, garlic, potatoes |

**The same journey, same runtime, for every zone:**
Arrival (orientation, all closed) → **approach** (a hotspot over the zone) → **Working Position** (the open plate crossfades in) → **Living Objects** (selectable name-plates + the multi-selection tray) → **Companion awareness** ("Ask Apple"). Add-to-shopping writes Domain 15 for zone items too.

## Evidence — each room follows the canonical architecture

- **One runtime, one component.** `living-home-room.tsx` renders all zones from a `ZONES` config using the *same* crossfade plates, the *same* selectable name-plate + multi-selection tray + single-item context, the *same* `addToShopping` (Domain 15) and `askApple` (Companion). No new interaction concept was added.
- **Same camera / light / craftsmanship / hospitality.** Every working plate is an *edit of the Arrival plate* — literally the same pixels except the opened zone — so camera, lighting, oak, plaster, worktop and dressing are identical across rooms. The household immediately recognises the same home.
- **Ownership preserved.** Arrival exposes no inventory (representative orientation dressing only); Living Objects own selection/shopping/removal; the Companion owns knowledge. Verified: the arrival level renders no interactive object; zone interaction appears only at the Working Position.
- **Screenshots (in-app, desktop):** `docs/implementation/rooms-evidence/{arrival,fridge,freezer,cupboard,baskets}.png` — the walk-through actually clicked each zone hotspot and stepped back. Full-resolution plates in `artifacts/living-home-environment-plates/work-*/`.

## Files changed

| File | Change |
|---|---|
| `client/src/pages/living-home-room.tsx` | `ZONES` config; arrival zone hotspots; a `zone` Working Position; `ZoneLabel` Living Objects; `addToShopping`/`askApple` generalised to any workspace (pantry category **or** zone) — pantry shelves/category path unchanged |
| `client/src/pages/living-home-room.css` | four zone plate layers (`--fridge/--freezer/--cupboard/--baskets`) |
| `client/public/images/living-home/room/work-{fridge,freezer,cupboard,baskets}.png` | promoted the four Working-Position plates |
| `docs/asset-specs/WORK_*.md`, `scripts/capture-living-home-rooms.ts` | new — plate specs + zone walk-through capture |

## Implementation gaps (honest)

- **Zone Living Object placement is representative** — a tidy row of selectable name-plates along the bottom of each Working plate, not yet aligned to the specific stocked items. Full parity (labels seated on each item, or individual object PNGs on empty interiors as the pantry jars are) is a later asset/placement pass. Environments first, as instructed.
- The pantry shelves path uses **real jar PNG Living Objects**; the new zones currently use **stocked plates + label Living Objects** — the *interaction model* is identical; only the object rendering differs (deferred to asset work).
- **Replace / Take-out** remain affordances (need real Domain-30 ids); approaching the zones is one level (no sub-categories yet).
- Working plates are **candidates** pending Home-Owner visual acceptance.

## Regression checks

- **Canonical pantry path unchanged:** Arrival → Shelves → Category (real jars, multi-select, Ask Apple) still works exactly as before.
- App compiles; the zone walk-through capture ran end-to-end (arrival + 4 zones + back) with **no console errors**.
- No architecture, navigation, ownership or Companion change — the runtime was **extended**, not redesigned.
- **OpenAI:** 4 plate edits ≈ **£0.76** (session total well under £5). No jar or room regenerated from scratch; every plate is an edit of the canonical room.

## Definition of done — status

The Living Home Runtime is **proven beyond the pantry**: five destinations (shelves, fridge, freezer, cupboard, baskets), one Arrival room, one journey, one interaction model, one continuous home. Home-Owner acceptance of the four Working-Position plates, and the later per-zone Living-Object placement pass, are the remaining steps.
