# OLB1 — The Orchard Living Book (Implementation Report)

**Workstream:** architecture
**Status:** COMPLETE — new canonical design reference adopted; the two blueprints it extends left byte-untouched
**Date:** 2026-07-15
**Rollback Identifier:** `rollback/OLB1-orchard-living-book-20260715` → `b3c650cd`
**Creates:** [`docs/architecture/THA_ORCHARD_LIVING_BOOK.md`](../../architecture/THA_ORCHARD_LIVING_BOOK.md) — the lived, felt account of the Orchard House
**Extends (without overriding):** [`THA_EXPERIENCE_BLUEPRINT.md`](../../architecture/THA_EXPERIENCE_BLUEPRINT.md) (the vision and the place) and [`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`](../../architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md) (the design language) — cites, never restates: [`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (the look) · [`THA_EXPERIENCE_LANGUAGE.md`](../../architecture/THA_EXPERIENCE_LANGUAGE.md) (the feeling) · [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (behaviour)
**Session:** `OLB1_Orchard_Living_Book` ([run file](../../../.engineering/session/runs/OLB1_Orchard_Living_Book.md))

---

## 1. What this workstream did

Created **The Orchard Living Book** — the canonical *living reference* for what it feels like to live inside The Healthy Apples. It is thoughtful design writing, organised as sixteen chapters of ordinary moments in the Orchard House, written so that any future designer, developer or contributor knows the *feeling* they are building toward before they read a single rule. No screen was described, no layout drawn, no component created, no production code touched. Docs only.

The gap it fills: the five existing Experience Governance documents are all written to be *enforced* — the Experience Architecture (do), UI Architecture (look) and Experience Language (feel) state their concerns as checkable rules; the Experience Blueprint draws the house; the Orchard House Design Blueprint gives it a design character. None of them tells a newcomer, in plain readable language, **what it is actually like to live in this house.** The Living Book holds that, and only that — the narrative, first-hand account of dwelling in the house across the moments of a family's life.

## 2. The central decision — a book to be *read*, not a rulebook to be *checked*

The mission was explicit: *NOT architecture, NOT UI, NOT a design system.* The hard constraint of THA governance is equally explicit: *extend the two blueprints without duplicating them* (restating a rule creates a second owner, forbidden by Experience Blueprint § 18 and Architecture Principle 2). These reconcile in exactly one way, stated in the book's own preamble and "How to read this book":

- **It owns only the telling.** Everything the book describes — the one morning, the still orchard, the three grounds, the Living Details, the Companion's manners — is owned and specified elsewhere and is *cited*, not restated. What is genuinely new, and owned nowhere else, is the *narrative of living through it*.
- **It adds no rule, no gate, no check.** Unlike the Orchard House Design Blueprint (which added the Design Character Check), this document adds nothing to any governance gate. Its "enforcement" line is honest: the feeling it describes is already protected by the three governance gates, the Blueprint Checks (Experience Blueprint § 15.2), the Experience Test (§ 15.3) and the Design Character Check (OHDB § 16.2). The book is *what those checks are for*, written down — not a new check.
- **Where it touches a governed concern, it describes rather than legislates**, and cites the owner once, in the framing sections, so the prose stays literary.

## 3. The one governance tension, and how it was resolved

The mission named chapters that appear, on their face, to contradict the house's governing law: **Rain Against The Glass**, **Spring / Summer / Autumn / Winter**, and **Evening In The Orchard**. But the house has, by governing law, exactly **one perpetual bright morning and one season, forever** — no dusk, no weather, no turning calendar; seasonal dressing was considered and *declined* (Experience Blueprint § 6.0, § 6.1, § 7; Orchard House Design Blueprint § 11). Rendering literal rain, autumn leaves, winter snow, or an evening dusk *in the house or on the orchard* would contradict governing architecture — which the workflow requires me to STOP and flag, not do.

The resolution — stated plainly in the book's "How to read this book" and carried through every affected chapter — is that these are chapters about **the household's** rain, seasons and evening, never the house's:

- The house never changes. What changes is the life the household brings through the door — the day it is, the season *they* are in, the weather in *their* world, the mood they arrive carrying.
- So the rain is on the household's side of the glass; the four seasons are the family's own year of cooking and rhythm; the evening is the household's evening spent *beside* a timeless orchard that keeps no clock.
- The constancy is the *point* of these chapters, not a constraint on them: a house that kept a different weather than the world outside is precisely the shelter the design intends. This is the direct felt reading of the governing rule *"time shows through the household's life, never through the house's weather"* (OHDB § 11).

This turned the apparent conflict into the richest expression of the whole vision — *a modern home in an ancient orchard*, where the timeless orchard exists so the family's changing life has something unchanging to turn against — with zero deviation from governing law. It is derivable directly from governance, so it was resolved rather than escalated.

## 4. What the book contains

- **Framing** — the header block (positioning it as a canonical reference that adds no rule and no gate), a preamble on *what this book is*, and a "How to read this book" section that fixes the citation discipline and the one-morning/one-season reading of the seasonal chapters.
- **Sixteen chapters**, exactly as the mission named them: First Light · The View Into The Orchard · Tea Before The Day Begins · The Family Planning Table · The Living Cookbook · The Pantry Shelves · Preparing To Leave For The Shop · Returning Home · Cooking Together · Quiet Moments · Rain Against The Glass · Spring · Summer · Autumn · Winter · Evening In The Orchard. Each is design prose that moves through the nine lived dimensions the mission asked for — *where you are · what is happening · the emotional atmosphere · the quality of the light · the relationship to the orchard · the materials around you · how the Companion behaves · what should never happen · the lasting feeling* — the last two surfaced as a recurring two-line refrain (*Never here — … / What lingers — …*) that gives the book its rhythm while keeping every chapter literary rather than a labelled form.
- **The Orchard Promise** — a single, concise statement of what every future THA experience must protect, closing the book.

No chapter describes a screen, a layout, or a component; every chapter describes the *experience of living in the house*.

## 5. Files created and changed

**Created:**

| File | What it is |
|---|---|
| `docs/architecture/THA_ORCHARD_LIVING_BOOK.md` | The canonical Orchard Living Book (16 chapters + The Orchard Promise) |
| `docs/implementation/architecture/OLB1_ORCHARD_LIVING_BOOK.md` | This report |
| `.engineering/session/runs/OLB1_Orchard_Living_Book.md` | Session run file |

**Changed (additive only — nothing rewritten, nothing removed):**

| File | Change |
|---|---|
| `docs/architecture/README.md` | Experience Governance table: added the Orchard Living Book row directly beneath the Orchard House Design Blueprint. Added one descriptive prose paragraph after the OHDB paragraph — existing rows and paragraphs untouched |
| `.engineering/session/CURRENT.md` | Added the `OLB1_Orchard_Living_Book` dashboard row |

**Untouched:** all production code, all UI, all prototypes and pending decisions. The two blueprints this book *extends* — `THA_EXPERIENCE_BLUEPRINT.md` and `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` — and the three sibling documents it cites — `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_UI_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md` — were not edited at all. The book extends the two blueprints by sitting subordinate to them and citing them, exactly as the Orchard House Design Blueprint extended the Experience Blueprint — not by editing them.

## 6. Architecture compliance

- **One owner per rule (Architecture Principle 2, applied to governance).** The book owns only the *narrative of living in the house* — a concern no governing document holds. Every rule it touches (the one morning, the still orchard, the material grounds, the Living Details, the Companion's arrival beat, exposure) appears only as a description of what the rule already produces, with the owner cited. It creates no second owner of anything.
- **Extend, never rewrite.** The two blueprints and the three sibling documents are byte-untouched; the README change is purely additive (one table row, one prose paragraph).
- **Precedence preserved.** The book declares itself subordinate to the Experience Architecture (which prevails in any conflict) and a non-overriding sibling of the UI Architecture, the Experience Language, and the two blueprints it extends — inserting cleanly at the bottom of the Experience Governance chain without disturbing any existing precedence.
- **No new rule, no new gate (deliberate).** Where the Orchard House Design Blueprint added exactly one check, this book adds none. Its header and closing state this plainly: the feeling it describes is protected by the *existing* gates and checks; it is the felt standard those checks exist to keep, not a new box to tick. This keeps it honest as a *reference* rather than misrepresenting a prose document as an enforcement surface.
- **No governance-path jump.** The book ships no visual value, names no colour/token/component/route/duration, and describes light, material and depth only as lived feeling. It creates and retires nothing runtime; no code reads it. It relies wholly on the governance path the Experience Blueprint fixed (§ 2.4 there) and jumps none of it.
- **The one-morning/one-season law upheld (§ 3 above).** The seasonal, weather and evening chapters are written strictly as the *household's* life against an unchanging house — never as a change in the house's light or the orchard's season — so the book reinforces the governing law (Experience Blueprint § 6.0/§ 6.1/§ 7; OHDB § 11) rather than contradicting it.
- **Not user-facing; registers not affected.** Docs-only change: no UX/UI checklists apply to the change *itself*; no Product Knowledge Registry entries exist yet to update (PKR defined but unpopulated); no client building block was added or retired (Adoption Register unaffected).
- **Repository conventions (HOUSE2).** Report workstream-filed under `docs/implementation/architecture/`; the canonical document lives in `docs/architecture/` — the single canonical home for governing/canonical architecture references.

## 7. Relationship to the Experience Blueprint and the Orchard House Design Blueprint

The three documents now form a clean, non-overlapping progression, each owning one question and citing the others:

| Document | Owns | Written to be |
|---|---|---|
| **Experience Blueprint** (EXPBLUE1/2) | The vision and the *place* — *"a modern home in an ancient orchard"*, One Home Many Places, the orchard, exposure, light and material direction, Living Details | Checked |
| **Orchard House Design Blueprint** (OHDB1) | The *design character* of that house — architectural character, interior philosophy, timeless-not-fashionable, the per-room design reading, the Design Manifesto | Checked |
| **Orchard Living Book** (OLB1) | The *lived experience* of that house — the narrative of dwelling in it across the moments of a family's life | **Read** |

- **It extends the Experience Blueprint** by taking the Blueprint's *place* — the rooms, the one orchard, the one morning, the signs of life — and rendering it as *lived moments* rather than a map. The Blueprint says Home is the threshold at E3 with the greeting in THA's hand; the Living Book's "First Light" chapter is what standing in that threshold *feels like*. Every place-fact it leans on is the Blueprint's, cited.
- **It extends the Orchard House Design Blueprint** by taking OHDB's *design character* — composed emptiness, warmth carried by light and material, timeless-not-fashionable, "design should quietly disappear" — and showing it *in use*, as the texture of ordinary life. OHDB's § 11 (why the house has no seasons) is the direct governing basis for the Living Book's seasonal chapters; OHDB's § 12 atmospheric test (*a home someone keeps, or a screen someone shipped?*) is the standard every chapter is written to.
- **It overrides neither, and neither overrides it.** Where the book and a blueprint appear to differ they are describing the same house from two angles and both are corrected until they agree; any genuine conflict of rule resolves upward — first to the two blueprints, then to the Experience Architecture, which prevails.

## 8. Verification performed

- `bash .engineering/scripts/repo-structure-verify.sh` — the checks this workstream touches pass (canonical document under `docs/architecture/`; report workstream-filed under `docs/implementation/architecture/`; no duplicate documents; no loose files introduced by OLB1). Any pre-existing failure from stray root files (`.glibcheck.txt`, `.libdirs_uxhome.txt`) predates OLB1, was neither created nor touched here, and is left for its owning session.
- Confirmed the sixteen chapter titles match the mission's list exactly and in order, each covering the nine required lived dimensions, and that the book ends with The Orchard Promise.
- Confirmed no chapter describes a screen, layout, or component, and no colour/token/component/route/value appears anywhere in the book.
- Confirmed the two extended blueprints and the three cited sibling documents are unmodified by this session (git status shows no new modification to `THA_EXPERIENCE_BLUEPRINT.md`, `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`, `THA_UI_ARCHITECTURE.md`, `THA_EXPERIENCE_ARCHITECTURE.md`; `THA_EXPERIENCE_LANGUAGE.md`'s modification predates this session).
- Confirmed the README table row and prose paragraph render correctly and contradict nothing existing.

## 9. Open items and follow-ups

- **Inherited, not re-opened.** The four open items the Experience Blueprint named (§ 18 there) — the orchard's canonical owner, the Home header, the pending UIA § 4 amendment, and dark mode — remain the Blueprint's to close. OLB1 creates no new open item.
- **No follow-up required.** The book adds no gate and no check, so there is nothing to wire into `ENGINEERING_WORKFLOW.md`. It is complete as a canonical reference on adoption.

## 10. Confirmation

**OLB1 is complete.** THA now has its **Orchard Living Book** — the lived, felt account of the house, in sixteen chapters of ordinary moments and one Orchard Promise, written to be read rather than checked. It extends the Experience Blueprint and the Orchard House Design Blueprint by rendering their place and design character as lived experience; it restates no rule and owns only the narrative none of them owns; it upholds the house's one-morning, one-season law by placing all weather, seasons and evenings in the *household's* life and never in the house; and both blueprints it extends, and all three siblings it cites, are left byte-untouched.
