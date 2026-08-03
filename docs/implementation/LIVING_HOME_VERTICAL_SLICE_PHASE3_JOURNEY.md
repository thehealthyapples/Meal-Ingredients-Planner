# Living Home — Vertical Slice, Phase 3: The First Complete Journey

**Date:** 2026-08-02 · **Risk:** 🟢 GREEN — navigation-hierarchy validation.
**Branch:** `feat/living-larder-authoritative` · **Rollback:** `rollback/living-home-journey-base` → `e1b38dc8`.
**Governing:** `LIVING_HOME_SPATIAL_BLUEPRINT.md` (four working positions), Model B.

## What was proven

The first complete household journey now runs in-place at `/pantry`:

**Arrival → Shelves → Flours → Wholemeal Flour → Lift → Return**

- **Arrival** — the refined plate as a still stage; an invisible region over the shelving.
- **Shelves** (Level 2) — the Shelf plate; provisions stay **grouped**: Flours, Grains, Rice & pasta, Baking, Seeds (one representative vessel per group, group name on its own chalk plate).
- **Flours** (Level 3) — selecting Flours reveals **only flour vessels** (Wholemeal, White, Strong bread, Self-raising, Spelt, Rye); everything else disappears.
- **Wholemeal** (Level 4) — one vessel comes forward as a Living Object, centred and close; **lift** it by hand and it **returns** to exactly its point.

Each step is a **state change on one page**, never a route/page load. Moving in re-keys the object layer so it fades and settles (`lh-approach`) and the chosen thing grows larger while everything else recedes; a mirrored "step back" retreats. The room holds still; only the objects move.

## Key point — no new imagery

The entire journey reuses the **two existing Environment Plates** and the **five existing jars**. Every flour variant is the *same* flour vessel carrying a different **runtime label** (Model B: one vessel, many labels). **No image was generated** — no missing Environment Plate was proven necessary, so none was made. OpenAI spend this phase: **£0.00**.

## Files changed

| File | Change |
|---|---|
| `client/src/pages/living-home-room.tsx` | rewritten — four-level journey (Arrival/Shelves/Category/Object) on placement points |
| `client/src/pages/living-home-room.css` | added `lh-approach` "moving closer" settle transition |
| `scripts/capture-living-home-journey.ts` | **new** — Playwright walk-through capture |
| `docs/implementation/journey-evidence/*.png` | **new** — evidence |

## Evidence (desktop + mobile)

`docs/implementation/journey-evidence/`: `1-arrival`, `2-shelves` (groups), `3-flours` (only flour vessels), `4-wholemeal` (the Living Object), `5-lift` (lifted off the shelf), `6-return` (settled back) — desktop; `1..4` mobile. Captured headlessly via the no-password trial (`POST /api/demo/start`).

## Regression

- App compiles; **no console errors**; `/pantry` renders the journey; other routes and the bottom nav unchanged.
- **No data writes** (Shopping/Bin still out of scope); no plate or jar asset changed.
- Reduced-motion disables the approach/lift animations; every step remains reachable by click/tap (dnd-kit also exposes keyboard lift).

## Remaining gaps (unchanged from Phase 2, plus)

- Only the **Flours** path is the headline; other groups drill the same way with representative data (their real variant lists come with the data layer).
- **Shopping / Bin / nutrition / recipes / usage** at Level 4 are later phases.
- Category/Object reuse the Shelf plate; **bespoke closer environments** per position are a future option (only if a plate is proven necessary).
- Plate visual acceptance (Arrival-v2, Shelf) still pending Home-Owner sign-off.

## Working Surface refinement (2026-08-02)

Rollback: `rollback/living-home-working-surface-base` → `e1b38dc8`. No new imagery; usability increased, realism not.

Levels 2–4 are now **Working Surfaces**, not photographs to admire. The Environment Plate supplies timber, light and atmosphere and then **recedes to support the work** (a soft veil quiets the plate and darkens the empty upper wall so the eye falls on the shelf). The runtime supplies the working layer:

- **Vessels** — the jars are now plain vessels (the label has left the jar).
- **Legible labels + information** — each vessel carries a **hand-engraved shelf name-plate** mounted on the timber, in clear type, with information (e.g. *Flours · 6 kinds*). The name-plate is the working control — readable and comfortable to hit — furniture on the shelf, not a floating card.
- **Interaction** — hovering a name-plate lifts its vessel; clicking moves closer. The environment is no longer the centre of attention; the interaction is.

Arrival (Level 1) is unchanged — it stays the atmospheric room.

## Definition of done

- ✅ The complete journey Arrival → Shelves → Flours → Wholemeal → Lift → Return runs.
- ✅ Every transition feels like moving closer, not opening a page (in-place, settle-in).
- ✅ No new visual effects, no room redesign, no imagery generated.
- ✅ Levels 2–4 read as a Working Surface: environment recedes, legible labels + information + interaction come forward.
- ✅ The Living Home behaves naturally.
