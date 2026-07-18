# Session: BRAND2_Embossed_Apple_Exploration

| Field | Value |
|---|---|
| **Session ID** | `BRAND2_Embossed_Apple_Exploration` |
| **Rollback ID** | `rollback/BRAND2-embossed-apple-20260717` → `7bfad50c` |
| **WIP snapshot** | tag `brand2-wip-snapshot-7bfad50c` |
| **Start time** | 2026-07-17 |
| **Current stage** | Waiting for User (report delivered) |

## Objective
Refine the **embossed apple** (BRAND1 Concept 2) into the **definitive architectural identity** of the
ARRIVAL1 Home. **Do NOT redesign** the room / orchard / archway / furniture / layout — all canonical
and byte-untouched. Explore **8–12 genuinely different architectural treatments of the same idea**
(shallow emboss · deep carved relief · lime plaster · polished plaster · aged hand-worked · shadow
relief · integrated into the arch · beside the arch · centred above the greeting · offset placement ·
discovered by light · and any that surpass these). Investigate **ideal size · height · placement ·
depth · interaction with orchard light · whether it should ever carry colour (challenge this) · whether
it should be visible always or reveal itself through light**. For each: render · emotional feeling ·
premium quality · discoverability · first-visit impact · six-month impact · implementation complexity.
Recommend **ONE canonical treatment** strong enough to become THA's permanent architectural signature.

## Outcome
**12 architectural treatments + 3 investigations (size/height/colour) + 1 canonical**, all rendered on
the live canonical `/home` by injecting each emboss in the browser only (app source byte-untouched).
Grounded in one physical constraint — Home has a single morning light from the arch, so a true press
reads dark-rim-up / lit-rim-down. Key findings: the shallowest press, the polished-gloss press, the
shadow-only press and the light-conditional press all **fall below the visibility floor** on the bright
plaster; a mark on the arch reveal is both washed out and intrusive; **colour (esp. the orchard's own
green) reads best of all — the mission's assumption, confirmed wrong on visibility — but is rejected on
architecture** (pigment turns the press back into a logo, breaking its one claim to premium: that it *is*
the wall). Discoverability is solved with depth/size/raking light, never paint.

**Canonical recommendation — "The Pressed Apple":** aged hand-worked **lime** plaster, **tone-on-tone**,
a **medium-shallow deboss** (dark rim up, lit rim down), **~150–165px** (`clamp(112px, 11vw, 168px)`),
**eye height**, on the **open plaster beside the arch, offset right**, **always faintly present and
deepened where the arch's morning grazes it** — never on the arch, the greeting's axis, the floor, or a
corner. Recurs once per room as the house's single quiet signature (platform decision, recorded not taken).

Report: `docs/implementation/BRAND2_EMBOSSED_APPLE_EXPLORATION.md`.

## Next action
Awaiting owner decision on the canonical treatment. **Nothing implemented** — if approved, a later
separately-scoped change adds one relief treatment to the `.home-arrival` wall (masked pseudo-element,
two-rim deboss filter, lime fill, responsive size token); arch and all data/behaviour untouched.

## Product changed
**None (exploration only).** Room byte-untouched. Adds: this run file, the report, a render harness,
and `docs/ui-audit/brand2-embossed/` renders (+ a throwaway injected apple asset).
