# Living Larder — North Star Fidelity Pass 01

**Date:** 2026-08-01
**Risk:** 🟢 GREEN — Living Home implementation refinement toward canonical fidelity.
**Authoritative branch:** `feat/living-larder-authoritative`
**Rollback identifier:** `rollback/larder-northstar-fidelity-base` → `3b8adef2`
**Canonical reference (treated as a signed drawing):** `attached_assets/design/north_star/v3/North star atmosphere pantry.png`
**Rule obeyed:** every decision answers "does this make the running app look MORE like the North Star?" — if no, stop. No reinterpretation, no redesign, no new concepts, no generation.

## Architecture compliance

One canonical Living Larder (this branch) · one asset owner (ASSET1 + Life Register § J + House Register) · one Life Register (`living-details-manifest.ts`, untouched) · no duplicated workflows · no duplicated room (the existing `larder-room.tsx`/`.css` is the only room — edited in place, not forked) · existing architecture extended · no duplicate asset state. Read/complied: ASSET1, LARDER1, LHDC1, IMGDIR1, `LIVING_LARDER_VISUAL_ACCEPTANCE_DECISIONS.md`, `NORTH_STAR_VISUAL_ACCEPTANCE_GATE`.

## What the running implementation is vs what the North Star is

- **Running (`larder-room.tsx`/`.css`, LIVING_LARDER_PRODUCTION_IMPLEMENTATION):** a front-on **constructed elevation** — discrete governed oak furniture PNGs with the household's jars seated on them via one physical scale (`--lvcm`), drag-interactive, inside `pageContainerClass`, on a CSS plaster-light background.
- **North Star v3:** a **photoreal, inhabited pantry room** filling the viewport (floor-to-ceiling jar-packed shelving, baskets, crocks; an orchard window on the right with warm daylight; a worktop with potted herbs, a book, garlic, a bowl of onions, linen) with a **translucent category-card data UI** floating over it (status strip, category cards, add-to-shopping, side + bottom nav).

The North Star's character is a photoreal room *image*; the running app is a constructed PNG *elevation*. That medium gap is the spine of the difference register.

## Difference register (identify · explain · classify · correctable with existing assets?)

| # | Difference | Why it exists | Classification | Correctable with existing approved assets? |
|---|---|---|---|---|
| 1 | No photoreal room atmosphere/backdrop (warm plaster, timber depth, inhabited density) | Room is composed from discrete PNGs on a CSS gradient, not a photoreal master | **Missing asset** | **No** — needs the photoreal Pantry master (the Gate's "Primary Pantry visual master") |
| 2 | No orchard window + warm directional daylight | No window/orchard asset; light is a CSS gradient | **Missing asset** (+ lighting) | **No** — window/orchard is unbuilt; light *direction* fixed in code (see change) |
| 3 | Light pooled from the top-left, not the right | CSS `.lv-light` sourced at 18% (left) | **Lighting issue** | **Yes — fixed this pass** (moved to 85%, the window side) |
| 4 | Shelves sparse (7 jars + honest gaps) vs densely packed (~30+) | Data-driven; only 7 jars approved, 20 candidates unapproved | **Missing asset** (approval) + data | **Partly** — approve the 20 candidate jars (approval, not generation); baskets/crocks are missing |
| 5 | No category-card UI (Grains & Flours, Pulses & Beans, …) with photo content | Running app uses direct jar manipulation, not cards | **Interaction/implementation issue**; card content is imagery | **No** — card content photos are missing assets; the card layer is a separate implementation not to be invented here |
| 6 | Missing props: potted herbs, onions, garlic, book, linen, baskets, bowls | Those assets do not exist (only 2 produce, 10 joinery, 7 jars) | **Missing asset** | **No** |
| 7 | Room is bounded in `pageContainerClass`, not full-bleed room-first | Page uses the standard workspace container | **Layout issue** | **Deferred** — even full-bleed, a PNG elevation on a gradient is not the photoreal room; converges only *with* asset #1. Not changed blind. |
| 8 | Overall palette warmth/sepia cast | CSS warm overlay is subtle | **Lighting issue** | Candidate — needs visual verification (see boundary) before a confident value change |

## Change made this pass (fidelity, existing assets only)

`client/src/pages/larder-room.css` — `.lv-light`: the room's morning light now enters from the **right** (`radial-gradient … at 85% 2%`), matching the North Star's window/orchard light source, instead of the top-left. CSS-only; no asset, no layout, no interaction change; a real reduction of a real lighting difference (#3).

## Missing-asset register (differences that CANNOT be resolved with existing approved assets)

In North Star priority order — these are the genuine blockers, not code:

1. **Photoreal Pantry room master** (the "Primary Pantry visual master") — the warm inhabited room, plaster/timber depth, the orchard window and its light. **This is the single asset that unblocks true convergence.** Owner: ASSET1 / LHDC1 admission → Home Owner approval. *Generation batch required (blocked, unnamed).* 
2. **Orchard window + daylight** (or baked into #1).
3. **Category-card content imagery** (grouped-jar photos per category) — if the card layer is adopted.
4. **Dressing/props:** potted herbs, onions, garlic, book, linen, baskets, bowls, crocks.
5. **Denser approved jar set** — begins with **approving the 20 existing candidate jars** (approval, not generation).

Per CB9, any of these produced externally enters through ASSET1/LHDC1 candidate → checksum → Home Owner approval unchanged.

## Boundary (CAPBOUND1 — honest classification)

- **Asset Gap (belongs to the project):** the photoreal Pantry master and the props above. The *specification* (North Star) is complete and signed; the blocker is named assets not yet produced — never a THA limitation (CB3). Convergence beyond lighting/layout cannot proceed until asset #1 exists. This is the LARDER6 anti-pattern avoided: the room is not "unbuildable," it is *blocked on one named asset*, and everything not needing it is done (the full register + the light-direction fix).
- **Environment boundary:** the running `/pantry` cannot be launched/verified here (no `node_modules`, DB, or auth). So each convergence change is reasoned from the code + the canonical image, not screenshot-verified. The light-direction fix is unambiguous from the North Star (light from the window on the right); palette-warmth (#8) and full-bleed layout (#7) are deferred because they need visual verification and/or asset #1 to converge rather than risk regression (CB4/CB5 — no unverifiable change presented as convergence).

## Validation

`npx tsx scripts/ci/verify-living-home-assets.ts` — unchanged from baseline: every jar/room/produce/joinery check passes; no asset bytes/checksums/Life Register changed; the CSS edit adds no asset import (one-mouth intact); no duplicate state; no new generated assets. The 5 reported failures are the unchanged known items (4 Windows path-separator artifacts; 1 pre-existing dressing byte-lock).

## Smallest next action (CB7)

Approve a **named generation batch for the photoreal Pantry room master** (North Star v3 "atmosphere pantry"). That single asset is the gate to real convergence; with it, the running room becomes progressively indistinguishable from the North Star. Until then, the app's fidelity is bounded by a constructed elevation, and only lighting/layout nudges (verified) are available.

## Definition of done (this pass)

- [x] North Star treated as the one canonical vision; no reinterpretation/redesign.
- [x] Every visual difference identified, explained, classified, and tested against existing approved assets.
- [x] Only unresolvable differences placed on the missing-asset register.
- [x] The one confident, existing-asset convergence change made in the running implementation (light direction).
- [x] Validation run; no regression; no new/changed assets.
- [x] Committed as one implementation; not pushed/merged/deployed.
- [x] The convergence blocker named precisely (the photoreal Pantry master) — the next batch, still blocked pending Home Owner approval.

**Rollback:** `rollback/larder-northstar-fidelity-base` → `3b8adef2`.
