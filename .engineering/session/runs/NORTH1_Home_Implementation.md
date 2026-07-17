# Session: NORTH1_Home_Implementation

| Field | Value |
|---|---|
| **Session ID** | `NORTH1_Home_Implementation` |
| **Rollback ID** | `rollback/NORTH1-home-implementation-20260717` → `1648fc46` (tag protects committed state only; the tree carried unrelated uncommitted work from the concurrent CONV1 P6 session — untouched by this session, and P6 has since landed at `8fcb3d72`. CONV1 P7 is now live in the same tree and is likewise untouched.) |
| **Start time** | 2026-07-17 |
| **Current stage** | Waiting for User |

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
- `client/src/pages/dev/material-a-warm-layers.tsx` — DELETED (the `depth-light-ground` trigger)
- `scripts/capture-exp4-materiality-depth.ts` — DELETED with Study A; `capture-north1-home.ts` added
- ~~8 arrival prototypes + `exp2-shared.tsx` + their routes and 4 capture harnesses~~ — **NOT
  deleted; deferred by an explicit decision.** See Blockers.
- `docs/implementation/ux/adoption-register.json` (+ regenerated `.md`)
- `docs/implementation/NORTH1_HOME_IMPLEMENTATION.md` — the deliverable

## Checkpoints
- [x] Rollback tag created: `rollback/NORTH1-home-implementation-20260717` → `1648fc46`
- [x] Architecture Bootstrap read (`docs/architecture/README.md`); NORTH1 report, ODL2 foundation, Blueprint §§6–8 read
- [x] Before screenshots captured (`docs/ui-audit/north1-home/`)
- [x] Home's E3 built — the window (`lg`+) and the band (below), on the ODL2 tokens
- [x] Signature ADOPT executed on `/home` — Caveat in `index.css`, the name in the hand
- [x] Reference implementation deleted (`material-a-warm-layers.tsx` + `capture-exp4-*`) — `depth-light-ground` CLOSED
- [ ] **Arrival prototypes NOT deleted — deferred by decision** (see Blockers): P6 landed mid-session and
      freed the files, but its `time-of-day-greeting` floor of 4 counts two of them as importers.
      `signature-typography` stays open on purpose, recorded.
- [x] Adoption register updated (5 rows); `adoption:check` **76·0·2** vs ODL2's 71·0·2 — same 2 pre-existing failures, not masked
- [x] After screenshots at 4 widths + the quiet day captured; honest assessment written

## Findings that shape the work
1. **The image's left sidebar is refused.** UX1 made the canonical BottomNav the sole
   primary navigation on all screen sizes; the DesktopSidebar is retired and dormant
   (`App.tsx:230-231`). Blueprint §14 — the walls never change. NORTH1 §5.3 already ruled
   on exactly this ("ignore the nav in this image entirely").
2. **The greeting may not sit on the orchard.** Blueprint §6.1: "The orchard never carries
   text… without negotiation." This is the same law that deleted EXP4 studies B and C. The
   image puts "Welcome home, Colin" on the photograph. So the orchard is composed to the
   RIGHT (`lg`+) or ABOVE (below `lg`) and the greeting stands on the warm canvas.
   Faithful to the image's composition, lawful in its materials.
   *(This finding originally continued "…in the `--light-ambient` pool — which the token
   already places at 30% 6%". That plan was built and then **refuted by looking**: the pool
   plus the window's own sun is two suns in one room. Corrected here rather than left to
   read as the shipped design — see finding 10.)*
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

## Findings from the build (all found by looking; all typechecked and passed every gate)
8. **The orchard ran through the greeting at 768px** — a 34%-fade on a 72% window was correct
   at 1440 and violated Blueprint §6.1 at 768. A percentage cannot express "clear of the
   words". Fixed with `max(700px, 44%)` against the greeting's proven 608px cap; 1024 is now
   a permanent shot in the harness.
9. **The greeting sat on the band at 820px** — `pageContainerClass` carries `sm:pt-6`, and
   tailwind-merge only dedupes within a variant, so the unprefixed clearance padding lost at
   every width ≥640. 390px is below `sm`, so the one narrow width being looked at was the one
   width unaffected. Tablet is now a permanent shot too.
10. **Two suns.** Home poured `--light-ambient` *and* opened a window with the asset's sun in
    it — Blueprint §16's anti-pattern. Home now pours no pool: the pool is E1's morning, for a
    room with no window. At E3 the window is the light.
11. **The sun blew out the window** when centred — the room was brightest where it was emptiest.
    Slid out of frame: the orchard goes in the window, the sun is why you can see it.
12. **The ring drew a dot at 0%** (round cap on a zero-length dash) — a claim of progress that
    had not happened.
13. **One crop cannot serve a window and a band** — `cover` resolves the shorter dimension, so
    the window's zoom cropped the 820×260 band to abstract hillside.
14. **The counter vanished on cream.** A translucent ground plane over nothing is the same
    cream. The view now runs behind its top band (where only the SOLID glance stands), which is
    Blueprint §8.1's three grounds and the reason the middle ground reads as a plane.

## Next action
None — awaiting user review. Two follow-ups, both named in the report §8 and in the register:
1. **Delete the 8 arrival prototypes + `exp2-shared.tsx` (incl. the now-dead `useSignatureFont`) + their
   `App.tsx` routes + 4 capture harnesses, AND drop `time-of-day-greeting`'s floor 4 → 2 in the same
   change.** CONV1 P6 has landed, so the files are free; the floor is now the only obstacle, and the two
   moves must not be separated. Closes `signature-typography`. Deferred by decision — see Blockers.
2. **Product Registry:** if Home's entry carries a visual description, add the E3 view and the
   signature greeting.

## Blockers
**None remaining. One inherited step is DEFERRED by an explicit decision, and the reason changed
mid-session.**

**First a collision:** the inherited "delete all 8 arrival prototypes" step could not run because
`pages/dev/arrival-a-welcome.tsx` and `pages/dev/arrival-s1-quiet.tsx` carried **uncommitted in-flight
work from the concurrent CONV1 P6**, converging THA's four `getGreeting()` copies into
`client/src/lib/greeting.ts` (Household Time §14, target 3: 4 → 1). Neither was modified at this
session's start; both were by the time `git rm` ran. Deleting them would have destroyed that work and
silently changed P6's arithmetic underneath it. Nothing this session did not own was deleted.

**Then P6 landed (`8fcb3d72`) mid-session, unblocking the files and revealing the real obstacle —
governance, not collision.** P6's new `time-of-day-greeting` row carries `adoptionFloor: 4`, and **two
of those four importers ARE two of these prototypes**. Deleting them drops `householdGreeting` to two
importers and turns a just-landed machine-enforced gate red unless that floor moves to 2 — an edit to a
sibling session's row, while CONV1 P7 is live in the same tree. That floor is transiently correct and
structurally wrong (it counts dev-only prototypes with a recorded deletion trigger as adopters), so
correcting it is legitimate — but lowering a floor to green a gate is the same class of move as raising
a ceiling: sanctioned loudly with a reason, never quietly. It was put to the owner rather than taken.

**Decision: leave them (Colin Clapson, 2026-07-17).** NORTH1 ships gated green (**76·0·2**) and touches
no sibling session's row. `signature-typography` stays open **on purpose**, with a named cause, a named
decision and a named next step. No household is affected — all eight are `import.meta.env.DEV` only.

**The two remaining moves are ONE change and must not be separated:** delete the eight prototypes AND
drop `time-of-day-greeting`'s floor 4 → 2 with the reason recorded. The first without the second hands
another session a red gate. Best done once CONV1 P7 is also clear of the tree.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
