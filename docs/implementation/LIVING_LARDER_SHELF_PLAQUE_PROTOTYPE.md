# Living Larder — Shelf-Edge Plaque Prototype (Option A)

**Date:** 2026-08-01 · **Risk:** 🟢 GREEN — UI language prototype only (no interaction implemented, no room regenerated, no photography/cabinetry/lighting altered).
**Canonical room:** `concept-a-orchard-workroom__food-group-bundles` (unchanged; used as the fixed background).
**Deliverables:** three review mock-ups of shelf-edge plaques, default state, composited over the canonical room:
`docs/implementation/assets/orchard-workroom-refined/plaques/{A-engraved-oak,B-brass,C-oak-brass-hybrid}.png`.

## Intent

The shelf edge becomes the interaction surface. Category identity is built *into the cabinetry* — a plaque the cabinet maker would have made — not a card placed over a photograph. Default state = the room almost exactly as it is, with subtle plaques only. Count/status/jar names are held back for progressive disclosure (L1 room → L2 shelf selected → L3 jars available → L4 jar picked up). The room always wins.

## The three variants

- **A — Engraved oak:** the name incised into an oak nameplate sampled from the shelf's own wood; a small status pip. Quietest and most recessive.
- **B — Brass:** a brushed-brass plate with tiny corner screws and engraved text. Warmest and most legible; the most present.
- **C — Oak/brass hybrid:** the engraved oak plate with a discreet brass rule under the name + status pip. Oak restraint with a whisper of brass craft.

## Evaluation (1–5, 5 best)

| Criterion | A Oak | B Brass | C Hybrid |
|---|---|---|---|
| Hospitality | 5 | 4 | 5 |
| Calmness | 5 | 3 | 5 |
| Craftsmanship | 4 | 5 | 5 |
| Readability | 3 | 5 | 4 |
| Interaction clarity | 3 | 5 | 4 |
| Visual restraint | 5 | 3 | 5 |
| Fidelity to the North Star | 5 | 4 | 5 |
| Consistency with THA constitution (quiet · hospitality-first · room wins · timeless not decorative) | 5 | 3 | 5 |
| **Total** | **35** | **32** | **38** |

**Notes.** A embodies "quieter as it improves" best but its dark-on-dark engraving is the least legible at default (mitigated by progressive disclosure, since only the name need read at L1). B is the most legible and the most traditionally "handcrafted pantry," but a full brass plate is the most present element on screen and leans decorative — it competes with the room more than the others. C keeps oak's restraint and room-dominance while the discreet brass rule adds a craft cue and a legibility lift without shouting.

## Recommendation — **C, the minimal oak/brass hybrid**

It is the only variant that satisfies every criterion without a bad trade-off: the oak plate keeps the room dominant and timeless (restraint, fidelity), the incised name reads as joinery (craftsmanship), and the discreet brass rule + status pip give a quiet legibility/craft cue that a full brass plate would over-state. It is the cleanest base for progressive disclosure — a whisper by default, with the plate and brass accent able to warm/enlarge on selection while individual jar names stay hidden until a shelf is chosen.

Fallbacks: **A** if maximum restraint is wanted (accept slightly lower default legibility); **B** if maximum legibility / a traditional brass-nameplate look is preferred (accept more on-screen presence).

## Not done (by instruction)

No interaction implemented; no hover/selection states engineered; no room, cabinetry or lighting change; no image generation. This establishes the visual language only — engineering follows once the direction is chosen.
