# Session: HOUSE_VISUAL_DESIGN

| Field | Value |
|---|---|
| **Session ID** | `HOUSE_VISUAL_DESIGN` |
| **Rollback ID** | `rollback/HOUSE-VISUAL-DESIGN-20260718` → `7bfad50c` (tag `house-visual-design-wip-snapshot-7bfad50c`; working-tree snapshots `d4defc98` (prior run) · `8100bd78` (this run)) |
| **Start time** | 2026-07-18 |
| **Branch** | `int1-intelligence-platform` |
| **Current stage** | Complete — awaiting owner review |

## Objective

Product Designer role. Using the completed `HOUSE_COMPLETE.md` blueprint, produce **production-quality
visual concepts for every room of The Healthy Apples House** — Entrance Hall · Kitchen · Pantry · Family
Table · Garden Room · Tasting Bench · Family Journal · Mirror — at **desktop · tablet · mobile**, each
defined across thirteen facets (layout · visual hierarchy · materials · typography · depth · lighting ·
orchard exposure · motion · empty state · filled state · Companion behaviour · primary interactions ·
responsive behaviour), and **rendered** in the existing North Star design language.

Deliverable: `docs/implementation/house/HOUSE_VISUAL_DESIGN.md` + rendered concepts.

## Binding constraints (from the mission)

- Do **not** redesign the house · do **not** change room philosophy · do **not** create new metaphors.
- Do **not** introduce new navigation · do **not** redesign the architecture · do **not** create new
  product features.
- Every room must feel like the same house while having its own personality.

## The recovery finding

**A prior run of this exact session was interrupted mid-flight.** Recovered rather than restarted:

| Artefact | State found | Action |
|---|---|---|
| `rollback/HOUSE-VISUAL-DESIGN-20260718` → `7bfad50c` | Already cut | **Preserved** (identifier unchanged) |
| `scripts/north4-concepts/_house.css` | Complete — the shared Kept House language extracted from the three locked rooms into one owner | Reviewed, kept |
| `scripts/north4-concepts/room-{family-table,garden-room,tasting-bench,family-journal,mirror}.html` | Five compositions built | Reviewed, kept/continued |
| `scripts/north4-concepts/render-house-rooms.ts` | Render harness written | Reviewed, continued |
| `docs/ui-audit/house-visual-design/` | **Family Table only** — 8 of the expected renders; `family-table-empty-mobile` missing | Completed |
| `.engineering/session/runs/HOUSE_VISUAL_DESIGN.md` | **Absent** | Created (this file) |

## The three locked rooms — inherited, not redesigned

`HOME_ARRIVAL_PRODUCTION_LOCK` (Entrance Hall) · `HOUSE5` (Kitchen) · `HOUSE6` (Pantry) are **production-
locked and already rendered**. Re-rendering them would be a redesign, which the mission forbids. Their
existing renders are cited in place as the reference concepts and their thirteen facets are read out of
their own locked documents. **Byte-untouched.**

## Checkpoints

- [x] Architecture Bootstrap read (`docs/architecture/README.md`)
- [x] `HOME_ARRIVAL_PRODUCTION_LOCK.md` read
- [x] `HOUSE5_KITCHEN_EXPERIENCE.md` read
- [x] `HOUSE6_PANTRY_EXPERIENCE.md` read
- [x] `HOUSE_COMPLETE.md` read (all 1204 lines)
- [x] Git status confirmed — HEAD `7bfad50c`, branch `int1-intelligence-platform`
- [x] Rollback protection confirmed/preserved + new working-tree snapshot `8100bd78`
- [x] Run file created (this file)
- [x] Five room compositions completed to production quality
- [x] All rooms rendered at desktop · tablet · mobile, both states — **44 renders** (30 viewport + 14 full-page), `deviceScaleFactor 2`, Fraunces real
- [x] Mechanical checks run (per `HOUSE_COMPLETE` § 12.3.4) — **30/30 ALL CLEAR**, 6 house-wide + 16 per-room assertions
- [x] Renders judged **visually**, not only mechanically (this is how defect 3 was caught)
- [x] `docs/implementation/house/HOUSE_VISUAL_DESIGN.md` written — 8 rooms × 3 breakpoints × 13 facets
- [x] All 48 image references verified to resolve
- [x] `repo-structure-verify.sh` — house-misfile check PASSES. The one FAIL (loose files at `docs/implementation/`: AFI1/AFI2/AFI3_5/COMP_ACT1/COMP_ACT2/FI20) is **pre-existing and untracked**, predates this session, and this session adds no violation.
- [x] Verification table completed

## Defects found by rendering (4 found, 4 fixed)

1. **The Mirror had no pressed apple** — an entire room without the house's sole brand mark (Article I /
   BRAND2 § 6). Fixed: added to the record's foot in clear plaster.
2. **The Tasting Bench lost its mark when it started working** — the apple lived inside the
   before-first-use aside, so it existed at E2 and vanished at E1. Fixed: moved outside both state blocks.
3. **A silent state leak** — `.rest { display: flex }` out-specified `.empty-only { display: none }` on
   source order, so the filled week rendered its own empty line underneath itself. **Invisible to every
   check, because both states were individually correct; caught by looking at the render.** Fixed: the
   state law now hides with `!important` and never declares how a shown element displays. A new mechanical
   check was added so it cannot return.
4. **Two false-positive checks** — the pigment test matched bare digits, so a gradient's `50%` stop
   position shifted the RGB triples out of phase; the Journal's darkness test flagged `transparent`, which
   computes to `rgba(0, 0, 0, 0)`. **20 of 26 reported problems were phantoms.** Both now parse real
   colour stops.

## Findings reported, NOT fixed

- **A — two locked documents' renders do not display.** `HOME_ARRIVAL_PRODUCTION_LOCK.md` and
  `HOUSE5_KITCHEN_EXPERIENCE.md` use `../ui-audit/…`, which from `docs/implementation/house/` resolves to
  the non-existent `docs/implementation/ui-audit/`. `HOUSE6` uses the correct `../../ui-audit/`. Not fixed:
  the locked documents are inherited byte-untouched by this session's mandate.
- **B — the pressed apple has two breakpoints for one mark.** Kitchen hides it ≤900px, Pantry ≤980px —
  the exact drift `HOUSE_COMPLETE` § 12.1.2 predicted. `_house.css` resolves it for the five new rooms;
  converging the locked two is a change to locked files.

## Tooling (Chromium revival — recipe extended)

`libglib-2.0.so.0` missing at launch. Curated lib dir at `<scratchpad>/chromium-libs` — 713 libs symlinked
from `/nix/store/995nd0yj67pshcgyyi4v3drxvdizxmcp-ytmdesktop-1.13.0-usr-target/lib`, excluding glibc's own
libraries and libcrypto/libssl/libz **and, new this session, `libstdc++`/`libgcc_s`**: the bundle's
`libstdc++` is older than node's and shadowed it, failing every launch with `GLIBCXX_3.4.32 not found`
(required by node) and `CXXABI_1.3.15 not found` (required by icu4c-76.1). Apple mark inlined as an SVG
data-URI mask (`file://` mask-image loads empty headless).

```
LD_LIBRARY_PATH=<curated> npx tsx scripts/north4-concepts/render-house-rooms.ts
```

**The next session will hit the same wall and should exclude the C++ runtime from the start.**

## Next action

**COMPLETE.** Design reference delivered and rendered. Awaiting owner decision, then the gated build (per
`HOUSE_COMPLETE` § 12.1 sequencing). No follow-up owed by this session.

## Product changed

**None.** Design/exploration only. No product source, data source, hook, route, API, behaviour, schema,
migration, or test opened or edited. Canonical `ORCHARD.png` referenced in place; no substitute authored.
