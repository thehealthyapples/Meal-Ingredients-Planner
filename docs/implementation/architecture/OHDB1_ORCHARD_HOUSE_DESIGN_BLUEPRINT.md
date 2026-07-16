# OHDB1 — Orchard House Design Blueprint (Implementation Report)

**Workstream:** architecture
**Status:** COMPLETE — new governing document adopted; the Experience Blueprint extended, nothing rewritten
**Date:** 2026-07-15
**Rollback Identifier:** `rollback/OHDB1-orchard-house-design-blueprint-20260715` → `b3c650cd`
**Creates:** [`docs/architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`](../../architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md) — the design language of the Orchard House
**Extends (without overriding):** [`THA_EXPERIENCE_BLUEPRINT.md`](../../architecture/THA_EXPERIENCE_BLUEPRINT.md) (the vision and the place) — cites, never restates: [`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (the look) · [`THA_EXPERIENCE_LANGUAGE.md`](../../architecture/THA_EXPERIENCE_LANGUAGE.md) (the feeling) · [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (behaviour)
**Session:** `OHDB1_Orchard_House_Design_Blueprint` ([run file](../../../.engineering/session/runs/OHDB1_Orchard_House_Design_Blueprint.md))

---

## 1. What this workstream did

Created the **THA Orchard House Design Blueprint** — the governing visual design language that translates the Experience Blueprint's vision (*"a modern home in an ancient orchard"*) into a coherent design identity. No screen was designed, no UI was implemented, no component was created, no production code was touched. Docs only.

The problem it solves: the Experience Blueprint (`EXPBLUE1`/`EXPBLUE2`) says what THA *is* and owns the *place* — the rooms, the orchard, the light, the materials, the signs of life. The UI Architecture owns every visual *value*. The Experience Language owns the *feeling*. But no document said, in one coherent design voice, **what that house looks and feels like as a piece of design** — its architectural character, its interior philosophy, why its restraint is a design decision rather than an absence, and how a designer a decade from now keeps building the *same house* instead of a fashionable copy of it. That is the gap this document fills, and the only thing it owns.

## 2. The central design decision — extend by citation, own only the unowned

The mission's hard constraint was *"do not duplicate existing architecture"* and *"extend the governing Experience Blueprint."* Almost everything the mission asked the document to *capture* — material palette, light, colour, typography, texture/depth, the house↔orchard relationship, seasonal behaviour, emotional atmosphere, and how every room should feel — is **already owned** by the Experience Blueprint (§§ 4–8, § 12), the UI Architecture (§ 4, § 7, § 8, § 9, § 16), or the Experience Language (§ 3, § 3A, § 5). Restating any of it would create the second owner the architecture forbids (Experience Blueprint § 18; Architecture Principle 2).

These reconcile exactly one way, stated in the document's own preamble and § 2.2: **it restates no rule; it cites the owner and legislates only what has no owner.** Concretely:

| Mission topic | Treatment | Owner cited |
|---|---|---|
| Architectural style of the home | **Owned here** (§ 3) — design character | (new) |
| Interior design philosophy | **Owned here** (§ 4) | (new) |
| Material palette | **Cited** (§ 5) | Experience Blueprint § 8; UIA § 4/§ 9/§ 16 |
| Light philosophy | **Cited** (§ 6) | Experience Blueprint § 7; UIA § 7; EXPLANG P6/F |
| Colour philosophy | **Cited** (§ 7) | UIA § 7; EXPLANG § 3/§ 3A |
| Typography feeling | **Cited** (§ 8) | UIA § 8; Experience Blueprint § 10 |
| Texture and depth | **Cited** (§ 9) | Experience Blueprint § 7/§ 8; UIA § 4 (+ § 2.4 path) |
| House ↔ orchard relationship | **Cited** (§ 10) | Experience Blueprint § 6; EXPLANG § 3A.3 |
| Seasonal behaviour | **Cited** (§ 11) | Experience Blueprint § 6.0/§ 6.1/§ 7 |
| Emotional atmosphere | **Cited** (§ 12) | EXPLANG § 3/§ 3A |
| How every room should feel | **Cited reading** (§ 13) | Experience Blueprint § 5.1/§ 6.2/§ 12.2; EXPLANG § 5; § 16 / EXPLANG § 7 |
| "Timeless, not fashionable" | **Owned here** (§ 14) | (new) |
| Design Manifesto | **Owned here** (§ 15) | (new; points at Experience Blueprint § 17) |

The document owns exactly five things (§ 2.2): the **architectural character**, the **interior philosophy**, the **timeless-not-fashionable doctrine**, the **per-room design reading**, and the **Design Character Check** + **Design Manifesto**. A **yield clause** (§ 16.3) makes any accidental duplication the defect here, to be corrected to a citation; and it commits to yielding ownership if a concern later graduates into a fuller home (e.g. the architectural character into UIA's Calm Orchard by amendment).

## 3. What the Blueprint contains

Sixteen sections. Highlights of the four **owned** contributions:

- **§ 3 — The architectural style of the home.** Five characteristics as a design stance: structural honesty · glazed toward the orchard · natural light and material · uncluttered planes · quiet confidence. "Contemporary in form, timeless in feeling," with feeling winning any tie — read from Experience Blueprint § 1.4, cited not restated.
- **§ 4 — Interior design philosophy.** Composed emptiness (never bare); everything present is meant; the household's own life as the only ornament; shared furniture, particular room; designed for the person in the doorway.
- **§ 13 — How every room should feel.** A cited design reading of the nine rooms the mission named (Home · Planner · Cookbook · Pantry · Shopping · Diary · Profile · Companion · Admin), each with Purpose · Emotional tone · Light · Material emphasis · Orchard exposure · Signature moment · Things to avoid — **every attribute cited to its owner**; what is owned here is only the binding of them into one coherent room. The three further rooms (Nutrition, Analyser, Household) are noted as following the same pattern from the existing map.
- **§ 14 — Timeless, not fashionable.** Why THA refuses UI trends (the orchard is timeless; trust compounds with constancy; trends are the technology becoming the subject; fashion is cheap, restraint is expensive), the decision-moment test (*serves the household, or merely current?* / *would it look right in ten years?* / *does removing it cost anything?* / *deepen or re-skin?*), and what timeless is **not** (not stagnant, not anti-modern, not featureless).
- **§ 15 — The Design Manifesto.** Ten lines to steer THA's design for a decade, closing on the Experience Blueprint's North Star test, quoted.

Plus § 1 (the design vision, rendering the Blueprint's vision as design; and "design should quietly disappear too"), § 2 (how it governs — the five-owner map, what it owns/never owns, precedence, the governance path), and § 16 (governance: the one-check **Design Character Check** wired into the gate, the yield clause, and the four open items it inherits from the Blueprint but does not re-open).

## 4. Files created and changed

**Created:**

| File | What it is |
|---|---|
| `docs/architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` | The governing Orchard House Design Blueprint (16 sections) |
| `docs/implementation/architecture/OHDB1_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` | This report |
| `.engineering/session/runs/OHDB1_Orchard_House_Design_Blueprint.md` | Session run file |

**Changed (additive only — nothing rewritten, nothing removed):**

| File | Change |
|---|---|
| `docs/architecture/README.md` | Experience Governance table: added the Orchard House Design Blueprint row directly beneath the Experience Blueprint it extends. Added one descriptive prose paragraph after the EXPBLUE paragraph — existing paragraphs untouched |
| `.engineering/session/CURRENT.md` | Added the `OHDB1_Orchard_House_Design_Blueprint` dashboard row |

**Untouched:** all production code, all UI, all prototypes and pending decisions; `THA_EXPERIENCE_BLUEPRINT.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_UI_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md` — the documents this one cites were not edited at all. In particular the Experience Blueprint is byte-untouched: this document *extends* it by sitting subordinate to it and citing it, not by editing it.

## 5. Architecture compliance

- **One owner per rule (Architecture Principle 2, applied to governance).** Verified topic by topic (§ 2 of this report): every rule owned elsewhere appears in the new document only as a citation; the five concerns it owns appear in no other governing document.
- **Extend, never rewrite.** The Experience Blueprint and the three sibling documents are byte-untouched; the README change is purely additive.
- **Precedence preserved.** The document declares itself subordinate to the Experience Blueprint (and, through it, the Experience Architecture, which prevails in any conflict) and a non-overriding sibling of the UI Architecture and Experience Language — inserting cleanly one level below the Blueprint without disturbing the existing precedence chain.
- **No governance-path jump (the EXPBLUE1/EXP4 lesson).** The document's vivid descriptions of light, depth, and material change no visual law and ship only through the path the Experience Blueprint fixed (§ 2.4 there): the UIA § 4 amendment, tokens by admission, one Living Detail at a time. § 2.4 and § 16.3 here state this as the document's own law; the Design Character Check does not re-open the Blueprint's "governance path" check, it relies on it.
- **Enforceability (the ARCH-VERIFY1 lesson).** Rather than declaring an unreachable checklist, the document adds exactly one check — the **Design Character Check** (§ 16.2) — positioned inside the existing Experience & UI Governance Compliance gate, after the Experience Test and Blueprint Checks, duplicating neither. *(A follow-up may wire an explicit ✓ line into `ENGINEERING_WORKFLOW.md`'s compliance block, exactly as EXPBLUE1 did for the Blueprint Checks; noted as the single open follow-up in § 7.)*
- **Nothing runtime.** The document names no colour, token, component, route, duration, or framework; no code reads it. Its § 2.2 states this as its own law.
- **Not user-facing; registers not affected.** Docs-only change: no UX/UI checklists apply to the change *itself*; no Product Knowledge Registry entries exist yet to update (PKR defined but unpopulated); no client building block was added or retired (Adoption Register unaffected).
- **Repository conventions (HOUSE2).** Report workstream-filed under `docs/implementation/architecture/`; the governing document lives in `docs/architecture/` — the single canonical home for governing architecture.

## 6. Verification performed

- `bash .engineering/scripts/repo-structure-verify.sh` — every check this workstream touches passes (no loose files under `docs/implementation/` or `docs/investigations/`; workstream filing respected; no duplicate documents). Any pre-existing failure from stray root files (`.glibcheck.txt`, `.libdirs_uxhome.txt`) predates OHDB1, was neither created nor touched here, and is left for its owning session.
- Manual cross-check of every citation target in the new document (section numbers in the Experience Blueprint, UIA2, EXPLANG1, Experience Architecture) against the current documents.
- Confirmed the Experience Governance table row and prose paragraph in `README.md` render correctly and contradict nothing existing.
- Confirmed the four cited sibling documents are unmodified (git status shows no new modification to `THA_EXPERIENCE_BLUEPRINT.md`, `THA_UI_ARCHITECTURE.md`, `THA_EXPERIENCE_ARCHITECTURE.md`; `THA_EXPERIENCE_LANGUAGE.md`'s modification predates this session).

## 7. Open items and follow-ups

- **Inherited, not re-opened.** The four open items the Experience Blueprint named (§ 18 there) — the orchard's canonical owner, the Home header, the pending UIA § 4 amendment, and dark mode — remain the Blueprint's to close. OHDB1 creates no new open item; its § 5–§ 9 descriptions depend on all four resolving before they can ship.
- **Single follow-up (optional, additive).** Wire an explicit Design Character Check ✓ line into the Experience & UI Governance Compliance block of `ENGINEERING_WORKFLOW.md`, mirroring how EXPBLUE1 wired in the Blueprint Checks — making the gate name this document explicitly. Deferred here to keep OHDB1 to a single governing-document addition with no edit to the workflow document; recommended as the next small governance change.

## 8. Confirmation

**OHDB1 is complete.** THA now has a governing **design language** for the Orchard House: the architectural character of the house (structural honesty · glazed toward the orchard · natural light and material · uncluttered planes · quiet confidence), an interior philosophy of composed emptiness decorated only by the household's real life, a cited design reading of all nine named rooms, the **"Timeless, not fashionable"** doctrine that keeps the house from chasing trends, and a ten-line **Design Manifesto** to steer the next decade — with every pre-existing rule still owned exactly once, in exactly the document that always owned it, and the Experience Blueprint it extends left byte-untouched.
