# DESIGN1 — The Entrance Hall · Canonical Home Visual Design — Implementation Report

**Workstream:** DESIGN1 — Canonical Home Visual Design (the first visual product-design work)
**Date:** 2026-07-15
**Author session:** `DESIGN1_Home_Visual_Design`
**Classification:** Experience / UX design (implementation). Design artefacts only — no code, no components, no tokens, no governing-architecture change.

---

## 1. Rollback identifier

| Field | Value |
|---|---|
| **Rollback tag** | `rollback/DESIGN1-home-visual-design-20260715` |
| **Points at** | `b3c650cd` (`RM4 — Planner Ready Meal Library`) — HEAD at session start |
| **Type** | Annotated git tag |
| **To revert entirely** | Delete the four new files (below) and remove the tag: `git tag -d rollback/DESIGN1-home-visual-design-20260715`. No commit, no code, no data, no governing document was changed, so deletion is a complete rollback. |

---

## 2. Files created

All new; nothing modified; nothing deleted. No source code, schema, token, component, or governing document touched.

| File | Purpose |
|---|---|
| `docs/ui-audit/design1-home/DESIGN1_home_visual_design.html` | **Primary visual deliverable** — a self-contained plate-set of eleven annotated design plates (also published as a shareable Artifact). |
| `docs/implementation/ux/DESIGN1_HOME_VISUAL_DESIGN.md` | The canonical written design specification companion to the plates (the 11 deliverables, reasoning, and per-element evaluation, citing owners and TRANSLATION1 throughout). |
| `docs/implementation/architecture/DESIGN1_HOME_VISUAL_DESIGN.md` | This implementation report. |
| `.engineering/session/runs/DESIGN1_Home_Visual_Design.md` | Engineering Session Recovery run file (developer tooling). |

Also updated: `.engineering/session/CURRENT.md` (dashboard row — developer tooling only).

**Deliberately NOT touched:** `docs/architecture/README.md` and every governing document. DESIGN1 is a design specification, not governing architecture — exactly as its predecessor HOUSE1 added no README row and created no rule. It is discoverable via `docs/implementation/ux/` beside HOUSE1, ORCHARD2 and ORCHARD3.

**Published Artifact:** the plate-set is live at a private claude.ai artifact URL (shareable by the user from the page's share menu). It is a render of the repo file at the same path — the repo file is canonical.

---

## 3. The eleven mission deliverables — where each is drawn

| # | Mission deliverable | Plate | Status |
|---|---|---|---|
| 1 | Desktop Home concept | Plate 01 | ✓ |
| 2 | Annotated layout diagrams | Plate 02 | ✓ |
| 3 | Visual hierarchy | Plate 03 | ✓ |
| 4 | Tablet Home concept | Plate 04 | ✓ |
| 5 | Mobile Home concept | Plate 05 | ✓ |
| 6 | Typography hierarchy | Plate 06 | ✓ |
| 7 | Spacing strategy | Plate 07 | ✓ |
| 8 | Companion placement | Plate 08 | ✓ |
| 9 | Motion notes | Plate 09 | ✓ |
| 10 | Empty state | Plate 10 | ✓ |
| 11 | Returning Home state | Plate 11 | ✓ |

Two further plates hold the reference tables the mission implies: **the permanence contract** (what always remains vs. may change) and **the gold standard** (what every future room inherits).

---

## 4. Architecture compliance

DESIGN1 is a design specification. It passes the gates it will one day be built under (Experience Blueprint § 2.5; TRANSLATION1 § 2.5), and creates no rule.

- **Experience Test (Experience Blueprint § 15.3):** *Which room?* Home, the Entrance Hall. *How should someone feel?* At home — welcomed, oriented, kept, warm. *The one thing?* Arrive and be oriented, then take the one door. **Passes.**
- **Blueprint Checks (Experience Blueprint § 15.2):** one home; a room not a theme; the map respected (Home E3, full morning, compact counter); the orchard laws (still, ancient, never wallpaper/text/animation); one morning (no dusk at any hour); material honesty (one ground, never nested, air generous); Living Detail discipline (one — the greeting — data-borne, honest in absence); the Companion in its chair; the walls untouched; the governance path declared, not jumped. **Passes.**
- **Design Character Check (OHDB § 16.2):** architectural character (structural honesty, glazed toward the orchard, natural light and material, uncluttered, quietly confident); interior philosophy (composed emptiness, everything meant, decorated only by real life); timeless not fashionable; design disappears; the room reading matches OHDB § 13.1 Home. **Passes.**
- **The four evaluation questions (mission):** every element was evaluated against *does it belong in this house · does it preserve the Kept Room · does technology disappear · does the household remain present.* Applied per element in the spec §§ 3–13. **Passes.**
- **One owner per rule (Experience Blueprint § 18; Architecture Principle 2):** every design decision cites its owner; DESIGN1 owns only the concrete visual design of one room and creates no second owner. If any line duplicates an owned rule, that line is the defect and is corrected to a citation.
- **Governance path (Experience Blueprint § 2.4; OHDB § 2.4; TRANSLATION1 § 2.4) — declared, not jumped:** the Kept Room's warm depth/ground/light vocabulary ships only via the UIA § 4 amendment; exposure and light enter only as tokens by admission (UIA § 16); the greeting is admitted as its own Living Detail decision; the Kept Room graduates by amendment. The Blueprint's two Home-bearing open items (§ 18 — the orchard's canonical owner and Home's header) remain open; DESIGN1 depends on both and resolves neither.
- **No code / no product surface:** touches no React, component, hook, token, route, schema, or runtime; therefore the AI Architecture Compliance, Product Registry Compliance and Adoption Register Compliance blocks are not engaged (no capability, no product-knowledge surface, no client-side building block created, adopted or retired).

---

## 5. Translation compliance (TRANSLATION1 as the governing bridge)

The mission required every significant decision to reference the governing architecture **and TRANSLATION1**. DESIGN1 treats the Kept Room Translation as the dictionary each plate is read against, and every plate routes its interface consequence to a § 4 characteristic translation:

| Plate | Primary TRANSLATION1 § 4 characteristic(s) rendered |
|---|---|
| 01 Desktop | § 4.1 *Windows*, *Orchard views*; § 4.2 *Kitchen island* |
| 02 Annotated layout | § 6 *three grounds*; § 4.2 *Kitchen island*; § 5.4 *depth before shadows* |
| 03 Visual hierarchy | § 5.2 *light before colour*; § 4.1 *Light* |
| 04 Tablet | § 4.1 *Space* |
| 05 Mobile | § 4.1 *Rooms*, *Windows* |
| 06 Typography | § 6 *one quiet human voice*; § 4.1 *Thresholds* (the hand); § 4.2 *Linen* |
| 07 Spacing | § 4.1 *Space*; § 5.1 *space before decoration*; § 4.3 *Calm* |
| 08 Companion | § 4.4 *Companion presence* |
| 09 Motion | § 4.3 *Morning Rhythm*; § 4.1 *Light*; § 4.3 *Calm* |
| 10 Empty state | § 4.3 *Quiet corners* |
| 11 Returning Home | § 4.3 *Permanence*; § 4.4 *Companion presence* |

The two disciplines TRANSLATION1 § 3 says the whole document rests on are held throughout:

- **Feeling produced by material and light, never a picture.** The plates draw *warm ground, lit counter, morning light* — not a drawn wood-grain, not an illustrated countertop, not a photo-real orchard. The orchard is an abstract tonal band (warmth + a low-contrast treeline suggestion), still and never wallpaper. No theme-park literalism (TRANSLATION1 § 3, § 4.2 *Oak*/*Kitchen island*).
- **Warmth and life, never coldness.** Every plate is checked against *calm must never become lifeless*; the empty-state plate (10) is drawn as the warmest state, not the coldest (TRANSLATION1 § 3, § 4.3 *Quiet corners*).

The nine **governing UI translation principles** (§ 5) are honoured as the ordering laws of the design: *space before decoration* (Plate 07), *light before colour* (Plate 03), *materials before effects* and *depth before shadows* (Plate 02), *calm before information* (the one-door hierarchy), *household before technology* and *people before data* (the greeting leading every plate), *truth before charm* (patina by data — the empty state invents nothing), *restraint before expression* (Plate 09). And the two the document exists to protect — *technology should quietly disappear* and *the household should always feel present* — are the third and fourth of the mission's four evaluation questions, applied to every element.

**One-owner integrity with TRANSLATION1.** DESIGN1 sets no value TRANSLATION1 forbids it to set: no colour, hex, token, radius, shadow value, duration, or type size. The plates are tonal design intent; every binding value remains the UI Architecture's, entering only by the § 2.4 path. When the Kept Room graduates and the depth/light/material vocabulary is admitted by the UIA § 4 amendment, DESIGN1 needs no change — it already defers every value to that owner.

---

## 6. Summary of the canonical Home design

**Home is the Entrance Hall of the Orchard House — the warm, kept, quietly intelligent room a household arrives into, gets its bearings in, and returns to; never the room the work happens in, and never a dashboard.** DESIGN1 renders that room as **The Kept Room** (warm minimalism — *modern bones, warm skin*) across desktop, tablet and mobile, and draws its visual, typographic, spacing, motion, companion, empty and returning systems as a single coherent design.

The design rests on **one load-bearing decision**: the house keeps **one unchanging morning**, and Home's daily rhythm is carried entirely by *what is true right now* — the household's own data — never by the house's light, theme, palette or mood. Time shows through the household's life, never the house's weather. The presentation demonstrates this literally: its plates keep one warm morning even when the frame is viewed in dark theme — the frame changes, the room does not.

The room is built from **three grounds** — the ancient orchard behind (constant, still, largest in area and quietest in attention), the warm lit oak counter in the middle (the only layer that varies from room to room; compact, so the view keeps its share), and the Companion and overlays in front. Hierarchy is carried by **light and material, not colour**; motion is spent on exactly two moments (the arrival's light, the Companion's beat) and otherwise the room is still; space is a material and the resting state; the empty state is the warmest, most *kept* state; and every return is the design of constancy.

Because Home is entered first and returned to most, **its design is the household's sense of the whole house** — so DESIGN1 is the **gold standard every future THA room inherits**: the grammar (arrive before you work; one warm ground; one primary action; the friend a beat behind; constant walls; one morning, one orchard, one Companion, one shell) carries to every room, while the E3 horizon does not — each room sizes its own view to its own purpose.

DESIGN1 is **design intent, not implementation**. It creates no rule, sets no binding value, and jumps no governance path; it ships only once the Kept Room graduates by amendment, the UIA § 4 amendment admits its depth/light vocabulary, exposure and light enter as tokens by admission, the greeting is admitted as its own Living Detail decision, and the Blueprint's open items on the orchard's owner and Home's header are closed.

---

*Report for the DESIGN1 workstream. Design artefacts only — no code, no components, no tokens, no governing-architecture change. Rollback: `rollback/DESIGN1-home-visual-design-20260715` → `b3c650cd`.*
