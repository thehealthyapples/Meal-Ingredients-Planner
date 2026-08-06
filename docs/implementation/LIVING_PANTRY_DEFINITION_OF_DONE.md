# Living Pantry — Definition of Done (Acceptance Gate)

**Date:** 2026-08-06 · **Risk:** 🟢 GREEN — acceptance criteria only. **This document is the acceptance gate for the Living Pantry.**
**Governing architecture (immutable):** `LIVING_PANTRY_CANONICAL_PRODUCTION_SET.md`. **Plan:** `LIVING_PANTRY_PRODUCTION_EXECUTION_PLAN.md`.

The Living Pantry is **Done only when every box below is checked** and the Home Owner signs off. A single unchecked box means not done.

## A. Asset gates
- [ ] **Every Working Position approved** (6 ready + Bread + Tea & Coffee once their homes exist).
- [ ] **Every Environment Plate (Master A) approved** — empty; architecture/furniture/lighting/permanent props only; no Living Objects.
- [ ] **Every Canonical Master (Master B) approved** — the locked pair partner of its plate; identical room/camera/composition/furniture/props/lighting/shadows/perspective; only Living Objects differ.
- [ ] **Every Living Object extracted** into the Living Object Library — transparent PNG, correctly cropped/centred, no surrounding background, natural lighting/reflections/perspective retained.
- [ ] **Every Living Object has exactly one Canonical Home** (its Working Position) — matches the Object Library Register.

## B. Architecture-compliance gates
- [ ] **Fixed World:** every camera is a view of the **same** physical room — furniture/walls/windows/architecture do not move between positions.
- [ ] **Camera continuity verified:** every close view is locatable within Arrival at the approved (locked) framing; no closer/zoomed reinvented views.
- [ ] **No duplicated furniture** — the fridge is one appliance (fridge+freezer), the wire rack is one rack, etc., consistent across positions.
- [ ] **No duplicated objects** — no object appears in two Canonical Homes.
- [ ] **Production Pair integrity:** for each pair, removing a Living Object reveals the **real** Environment Plate (Master A) — no invented, reconstructed, or inpainted environment pixels.
- [ ] **Store Cupboard is the corrected furniture** — under-counter cabinet with tins (no jars/glass).
- [ ] **Fridge/Freezer are the oak integrated appliance** (fridge above / freezer below) continuous with Arrival.
- [ ] **Root Vegetables sit beneath the Fruit worktop** — same location proven across Arrival, Fruit, Root Vegetables.

## C. Label gates
- [ ] **Labels verified** to the canonical jar-label spec: matte chalkboard, rounded corners, ~⅓ jar width × ~⅕ jar height, standardised across all jars, "Wholemeal Flour" fits one line (long names wrap to two balanced lines), ingredient visible through the glass.
- [ ] **No floating labels, no software plaques, no detached overlays** — labels are part of the object artwork; runtime edits text only.

## D. Runtime gates
- [ ] **Runtime composition verified:** the room renders as Environment Plate + Living Object Library; deterministic; the plate is never modified.
- [ ] **Interactions verified** for every Living Object: drag · remove · restore · drop on Shopping List · Bin · Companion; removing reveals the plate.
- [ ] **No runtime AI reconstruction / inpainting** anywhere.
- [ ] **Lived-in staging** present (natural ingredient-level variation) without clutter.

## E. Home Owner sign-off
- [ ] **Per-Working-Position sign-off** recorded (table below).
- [ ] **Home Owner approval complete** for the whole Living Pantry.

### Per-Working-Position sign-off
| Working Position | Plate approved | Master approved | Library extracted | Home Owner sign-off |
|---|---|---|---|---|
| Pantry Shelves | ☐ | ☐ | ☐ | ☐ |
| Fridge | ☐ | ☐ | ☐ | ☐ |
| Freezer | ☐ | ☐ | ☐ | ☐ |
| Fruit | ☐ | ☐ | ☐ | ☐ |
| Root Vegetables | ☐ | ☐ | ☐ | ☐ |
| Store Cupboard | ☐ | ☐ | ☐ | ☐ |
| Tea & Coffee *(home first)* | ☐ | ☐ | ☐ | ☐ |
| Bread *(home first)* | ☐ | ☐ | ☐ | ☐ |

## Prerequisites before this gate can begin to be filled
- Production Pair **mechanism proven** on one position.
- **Extraction (matting) capability** confirmed.
- **Bread + Tea & Coffee Canonical Homes** established (for their rows).

*No box above may be checked on inference — each requires the actual approved asset or a verified running-app observation.*
