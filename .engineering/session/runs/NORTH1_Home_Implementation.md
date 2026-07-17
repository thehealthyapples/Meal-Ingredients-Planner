# Session: NORTH1_Home_Implementation

| Field | Value |
|---|---|
| **Session ID** | `NORTH1_Home_Implementation` |
| **Rollback ID** | `rollback/NORTH1-home-implementation-20260717` → `1648fc46` (tag protects committed state only; the tree carries unrelated uncommitted work from the concurrent CONV1 P6 session — untouched by this session) |
| **Start time** | 2026-07-17 |
| **Current stage** | Implementation |

## Objective
Implement the Home North Star (`attached_assets/design/north_star/v2/NORTH_STAR_V2_HOME_DESKTOP_MOBILE.png`)
using the approved Calm Orchard visual language (UIA §4, as amended by ODL2) and the
governed tokens ODL2 valued. Home stands at **E3 — the open view** (Blueprint §6.2,
Home only). Preserve all existing behaviour, architecture and data.

Deliverable: `docs/implementation/NORTH1_HOME_IMPLEMENTATION.md`.

## What this session inherits (ODL2 §7 — "execution, not decisions")
1. **Build Home's E3** — consume `--orchard-exposure-e3` + the ground/shadow/light tokens.
2. **Delete the reference** — `pages/dev/material-a-warm-layers.tsx` +
   `scripts/capture-exp4-materiality-depth.ts` (the `depth-light-ground` closing trigger).
3. **Execute the signature ADOPT** — Caveat `@import` into index.css, `/home` named as the
   one permitted surface, delete all 8 arrival prototypes.

## Files being modified
- `client/src/components/layout/orchard-backdrop.tsx` — the orchard-environment owner gains Home's open-view shape
- `client/src/pages/home-experience-page.tsx` — the North Star room
- `client/src/index.css` — Caveat `@import` (signature ADOPT)
- `client/src/App.tsx` — dev route deletions
- `client/src/pages/dev/*` — 8 arrival prototypes + exp2-shared + material-a DELETED
- `scripts/capture-*` — arrival/exp4 capture harnesses deleted; `capture-north1-home.ts` added
- `docs/implementation/ux/adoption-register.json` (+ regenerated `.md`)
- `docs/implementation/NORTH1_HOME_IMPLEMENTATION.md` — the deliverable

## Checkpoints
- [x] Rollback tag created: `rollback/NORTH1-home-implementation-20260717` → `1648fc46`
- [x] Architecture Bootstrap read (`docs/architecture/README.md`); NORTH1 report, ODL2 foundation, Blueprint §§6–8 read
- [ ] Before screenshots captured
- [ ] Home's E3 built
- [ ] Signature ADOPT executed
- [ ] Reference implementation + arrival prototypes deleted
- [ ] Adoption register updated; `adoption:check` at or better than baseline
- [ ] After screenshots captured; honest assessment written

## Findings that shape the work
1. **The image's left sidebar is refused.** UX1 made the canonical BottomNav the sole
   primary navigation on all screen sizes; the DesktopSidebar is retired and dormant
   (`App.tsx:230-231`). Blueprint §14 — the walls never change. NORTH1 §5.3 already ruled
   on exactly this ("ignore the nav in this image entirely").
2. **The greeting may not sit on the orchard.** Blueprint §6.1: "The orchard never carries
   text… without negotiation." This is the same law that deleted EXP4 studies B and C. The
   image puts "Welcome home, Colin" on the photograph. So the orchard is composed to the
   upper-RIGHT and the greeting stands top-left on the warm canvas, in the `--light-ambient`
   pool — which the token already places at `30% 6%` (top-left). Faithful to the image's
   composition, lawful in its materials.
3. **A room may never mount `OrchardBackdrop`** (register row `orchard-environment`;
   component docstring). The prohibition targets the *wallpaper shape* (`fixed inset-0`
   behind everything), not the asset — Blueprint §6.2 expressly gives Home E3, "the orchard
   visible as itself, generously". So the open view is added to **the same owner file**
   rather than a second component, keeping one owner for the asset (UIA §17).
4. **The image's props are refused** — the notebook/soup/jars/tote photos on the room tiles
   and the apple bowl. Blueprint §12.1 rule 2: "Data-borne or dead… a painted prop is
   fabricated feeling, forbidden by construction." NORTH1 §5.2: "where the render puts a
   bowl of apples, the software puts the household's actual plan."
5. **"Nourishing food. Happy home." is refused** — a marketing line inside the product
   (NORTH1 §5.7; TRANSLATION1 *Thresholds* §9). Replaced by the data-borne state sentence
   ("Today is planned." / "Today is open."), which is Study A's own instrument.
6. **Family and Pantry glance columns have no Home data** and are not invented — inventing
   them would be a new fetch and a fabricated fact. The glance keeps THA's real three:
   meals, shopping, plants. The image's ring gauge is preserved on the plants column,
   which is where "From the orchard" honestly belongs.
7. **`shadow-[shadow:var(--x)]` type hint is mandatory** — without it Tailwind reads the
   var as a shadow *colour* and emits no shadow, silently, with every gate green (ODL2 §6.3).

## Next action
Capture before screenshots, then build Home's E3.

## Blockers
None. ODL2 §7 confirms every governance gate is open.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
