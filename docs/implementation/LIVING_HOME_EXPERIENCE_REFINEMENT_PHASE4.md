# Living Home — Experience Refinement, Phase 4 (Craftsmanship)

**Date:** 2026-08-02 · **Risk:** 🟢 GREEN — Living Home experiential refinement.
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-experience-phase4-base` → `e1b38dc8`.
**Governing:** `LIVING_HOME_SPATIAL_BLUEPRINT.md`, Model B (architecture frozen — not touched).

## The problem corrected

Deeper in the journey the room had begun to **disappear** — the previous "Working Surface" pass dimmed the plate behind a veil and enlarged the jar, so a working position started to feel like a separate application screen. Phase 4 applies the new principle: **moving closer reveals MORE of the home, not less.** The room stays fully present at every level; neither environment nor runtime dominates; only the focus changes.

## Implementation notes (before → after)

| Level | Before (Phase 3 working-surface) | After (Phase 4) |
|---|---|---|
| **All working levels** | plate dimmed/desaturated behind a darkening veil — room receding | **veil and desaturation removed**; the pantry keeps its full warmth; only a whisper of grounding at the very base |
| **Shelves / Category** | bare empty shelves — felt isolated | **dressed Shelf plate**: permanent ceramic bowl + folded linen, wooden flour scoop + rolling pin, willow proving basket — at the shelf *ends*, central span left clear; the household is plainly still in a real pantry |
| **Living Object** | jar **enlarged** to dominate the frame | jar kept **approximately life-size** on the shelf; the **information context grows** beside it — availability, Nutrition, Recipes, Household usage, and Add-to-shopping / Replace / Take-out — as a warm, translucent in-room note, room visible around and through it |

The jars are seated on canonical placement points re-tuned to the dressed plate (lower jars keep to the left-centre so the permanent scoop and they share the shelf naturally). Arrival (Level 1) is unchanged — it remains the atmospheric room.

## Environment Plate refinement (dressed Shelf plate)

- **Method:** `images/edits` on the approved empty Shelf plate — the shelves, brackets, timber, plaster, right-hand light and composition preserved; only permanent, non-interactive craftsmanship added at the ends. This is a craftsmanship *dressing* refinement (as the brief's Shelf Working Position section directs — "retain permanent environmental craftsmanship"), not an architecture/composition redesign.
- **Generation gate:** searched — no scoop/bowl/linen props exist as assets; the dressing had to be baked into the plate. **1 edit ≈ £0.19** (session total ≈ £0.73) — within £5. The empty plate is retained at `artifacts/.../shelf/shelf-empty-backup.png` (fully revertible).
- **Status:** the dressed Shelf plate (and the Arrival-v2 plate) remain **candidates** pending Home-Owner visual acceptance (ASSET1/LHDC1).

## Files changed

| File | Change |
|---|---|
| `client/src/pages/living-home-room.css` | removed the darkening veil + desaturation; added the Living Object in-room context styles |
| `client/src/pages/living-home-room.tsx` | Object jar kept life-size (HERO scale/position); added the information context; placement points re-tuned to the dressed plate |
| `client/public/images/living-home/room/shelf.png` | promoted the **dressed** Shelf plate (craftsmanship) |
| `docs/asset-specs/SHELF_PLATE_V2_CRAFTSMANSHIP_SPEC.md` | new — dressing edit spec |

## Screenshots (desktop + mobile)

`docs/implementation/journey-evidence/`: `1-arrival`, `2-shelves`, `3-flours`, `4-wholemeal`, `5-lift`, `6-return`.
"Before" (the receding working-surface) is preserved in `Project summaries/Living Home Phase3 Journey/evidence/` for comparison.

## Validation — the hospitality test

At every level: *"Does this feel like another step into the same home?"*
- **Arrival → Shelves → Flours → Wholemeal** all share the same timber, plaster, right-hand light and permanent dressing — it reads as moving through one pantry, not switching screens.
- The room is present in every shot; only the focus narrows. The object stays physically believable; the software (labels, context) is warm and in-room, and does not out-shout the room.
- No console errors; other routes and nav unchanged; **no data writes** (the Object-level actions are presentation affordances — not wired; no feature expansion this phase).

## Remaining refinements

- **Plate acceptance** — Arrival-v2 + dressed Shelf plates await Home-Owner sign-off before becoming checksum-locked House-Register assets.
- **Object context wiring** — Nutrition / Recipes / usage and Add-to-shopping / Replace / Take-out are revealed affordances; wiring them to Domain 15/30 and the Companion is a later (feature) phase, deliberately not done here.
- **Context restraint** — if the context note ever reads as too UI-like, it can move toward an even more in-room material (slate / recipe-card); currently warm translucent parchment.
- **Object-level availability** — shows a representative "well stocked"; real have/running-low comes from Domain 30 when wired.

## Definition of done

- ✅ The Living Home no longer feels like a sequence of screens.
- ✅ The room remains present at every stage; only the focus changes.
- ✅ Moving closer reveals more of the home (dressing, then context) — not less.
- ✅ The Living Object stays approximately life-size and physically believable.
- ✅ No architecture, navigation or Model-B change; craft only.
