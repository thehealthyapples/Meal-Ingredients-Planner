# HOME_INTERIOR_ARCHITECTURE — Run File

**Reimagine the complete interior architecture of The Healthy Apples Home, preserving the approved structure.**

| | |
|---|---|
| **Session** | `HOME_INTERIOR_ARCHITECTURE` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/HOME-INTERIOR-ARCHITECTURE-20260717` → `7bfad50c` (tag `home-interior-architecture-wip-snapshot-7bfad50c`) |
| **Status** | **Complete — awaiting owner decision.** 8 homes rendered; review written; recommendation made. |

## Mission

Act as **Lead Interior Architect**. The structural architecture is LOCKED:
**the orchard · the concept of the house · the archway · the philosophy of modern living in a
traditional English orchard.** Everything else (arrival, navigation, furniture, cabinetry, shelving,
wall treatments, flooring, materials, lighting, typography, composition, greeting, Companion placement,
interaction patterns, controls, transitions, spatial hierarchy) is open for radical redesign.

Produce **6–8 radically different interior architecture concepts** — each must feel like a *different
home*, not a different dashboard. For each: desktop render · mobile render · design philosophy · what
changed · why it is better · emotional response · strengths · weaknesses. Then recommend **ONE** — the
most memorable, emotionally engaging, architecturally beautiful Home THA could become.

**Read before starting (done):** `docs/architecture/README.md`, `ARRIVAL1_DEFINITIVE_HOME.md`,
`BRAND1_ARCHITECTURAL_BRANDING.md`, `BRAND2_EMBOSSED_APPLE_EXPLORATION.md`, `HOME_FINAL_CONCEPTS.md`.

## The eight homes

1. **The Long Table** — a luxury country-kitchen refectory table; navigation carved into the oak edge.
2. **The Dresser Wall** — a built-in Welsh dresser; navigation engraved in oak drawers with brass labels.
3. **The Light Room** — a Scandinavian retreat; navigation embossed into pale plaster pilasters.
4. **The Garden Room** — the orchard as the entire glazed upper architecture; oak mullion navigation.
5. **The Architect's House** — a concrete-and-oak monolith island; navigation engraved in a stone lintel.
6. **The Hearth** — the home around a warm heart; navigation carved into an oak mantel beam.
7. **The Entrance Hall** — arrival as ceremony; a hall console; navigation as doors off the hall.
8. **The Morning Room** *(Claude's own)* — a deep oak windowsill under a great arch; brass plate-rail navigation.

## Method

Each home is built as a self-contained HTML interior (real `/orchard.webp`, the ARRIVAL1 material
palette, THA's own type) and rendered at **desktop 1440 + mobile 430**, `deviceScaleFactor 2`, on the
same populated day (3 meals · 5 shopping · 28/30 plants · one Companion line) so the homes are directly
comparable. Nothing edits app source — this is an interior-architecture review, exploration only.

## Progress / Next action

- [x] Read all required docs; git status confirmed; rollback protection created.
- [x] Run file created.
- [x] Built the capture harness (`scripts/capture-home-interior-architecture.ts`) — 8 homes.
- [x] Rendered all 8 at desktop + mobile → `docs/ui-audit/home-interior-architecture/` (16 PNGs).
- [x] Reviewed every render; fixed ring colour + Garden Room greeting-on-glass; re-rendered.
- [x] Wrote `docs/implementation/HOME_INTERIOR_ARCHITECTURE.md` (full review + recommendation).

**Recommendation:** **8 — The Morning Room** (runners-up: 1 The Long Table, 4 The Garden Room).
**Next action:** none — awaiting owner decision. No product/schema/test changes (exploration only).
