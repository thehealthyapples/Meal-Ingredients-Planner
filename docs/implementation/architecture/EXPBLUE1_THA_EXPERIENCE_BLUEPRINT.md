# EXPBLUE1 — THA Experience Blueprint (Implementation Report)

**Workstream:** architecture
**Status:** COMPLETE — new governing document adopted; existing governance extended, nothing rewritten
**Date:** 2026-07-15
**Rollback Identifier:** `rollback/EXPBLUE1-tha-experience-blueprint-20260715` → `b3c650cd`
**Creates:** [`docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`](../../architecture/THA_EXPERIENCE_BLUEPRINT.md) — the unifying blueprint of Experience Governance
**Unifies (without overriding):** [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (behaviour) · [`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (look) · [`THA_EXPERIENCE_LANGUAGE.md`](../../architecture/THA_EXPERIENCE_LANGUAGE.md) (feeling)
**Sources graduated:** `ARRIVAL1`, `EXP2`–`EXP4` (arrival/materiality prototypes), [`EXP5_ONE_HOME_MANY_PLACES.md`](../../investigations/ux/EXP5_ONE_HOME_MANY_PLACES.md) — all remain point-in-time history
**Session:** `EXPBLUE1_THA_Experience_Blueprint` ([run file](../../../.engineering/session/runs/EXPBLUE1_THA_Experience_Blueprint.md))

---

## 1. What this workstream did

Created the **THA Experience Blueprint** — the single governing source of truth for how THA should feel, look, and behave — by *unifying* the existing experience governance rather than rewriting any of it. No UI was implemented, no screen was redesigned, no production code was touched. Docs only.

The problem it solves: between 2026-07-10 and 2026-07-15 the experience layer accumulated three governing documents (Experience Architecture, UI Architecture, Experience Language) plus five discovery workstreams (ARRIVAL1, EXP2–EXP5). Each document is complete on its own question and deliberately silent on the others' — which meant **no single document held the vision they all serve**, and the "One Home, Many Places" spatial concept discovered in the prototypes had no governing home at all (EXP5 is an investigation — history the moment it was written, never law). The Blueprint closes both gaps.

## 2. What the Blueprint contains

Eighteen sections covering every topic the mission named:

| Mission topic | Blueprint section | Ownership treatment |
|---|---|---|
| Vision | § 1 | **Owned here** (new) — including the one-sentence vision and the experience in one paragraph |
| Experience principles | § 3 | **Cited** — a map of the four principle families with their owners (EXP1 § 3/§ 17, EXPLANG § 3/§ 3A/§ 4/§ 4A); nothing restated |
| One Home | § 4 | Mostly cited (EXP1 § 4, EXPLANG Principles 1/9/B/C/D/E/G); **owns** the one-home law ("the household never leaves the house") |
| Many Places | § 5 | **Owned here** (graduated from EXP5) — the four differentiators (purpose · light · material · one sign of life) and the domain-by-domain map of the house |
| The Orchard | § 6 | Meaning cited (EXPLANG § 3A.3); **owns** the one-orchard laws and the **Orchard Exposure Scale (E0–E3)** with its inverse-density law |
| Light | § 7 | Feeling cited (EXPLANG Principles 6/F); **owns** the house rules: one sun, one direction, one morning; exposure never hour; penumbra as hierarchy |
| Materials | § 8 | **Owned here** (graduated from EXP4/EXP5) — the three grounds, the ground plane as room identity, solidity-follows-importance, air as material |
| Motion | § 9 | **Fully cited** (UIA § 11; EXPLANG Principles 4/12/H) — the Blueprint adds no motion rule, only the house reading |
| Typography | § 10 | **Fully cited** (UIA § 8) — adds only the house reading of the signature voice (the greeting at Home is its one mapped surface) |
| Rhythm | § 11 | **Fully cited** (EXPLANG § 5) — adds only the spatial reading of the six beats |
| Living Details | § 12 | **Owned here** (graduated from EXP5 § 5) — the six laws and the complete ten-detail library; declined details cited, not restated |
| Companion Presence | § 13 | Conduct/feeling/knowledge cited (EXP1 § 11, EXPLANG P7/§ 5.7, INT17, PKR2 § 12); **owns** the Companion's place in the house (one fixed chair; arrives a beat after you) |
| Canonical Shell | § 14 | **Fully cited** (EXP1 § 8, UIA § 6, EXPLANG Principles 9/E) — adds only "the walls are what make many places one home" |
| Experience Review Checklist | § 15 | § 15.1 points to the three existing gates unchanged; § 15.2 adds the **Blueprint Checks** — ten checks covering only what this document owns |
| Anti-patterns | § 16 | General anti-patterns cited (EXPLANG § 7); **owns** the eight spatial anti-patterns (the theme park, the costume, wallpaper, all-view-no-room, the rendered world, metaphor taxing function, the second sun, charm by the batch) |
| Design North Star | § 17 | **Owned here** (new) — the tie-breaking star every gate points toward |

Plus § 2 (how the Blueprint governs: the ownership map, what it owns and never owns, precedence, and the governance path for graduated values) and § 18 (governance, admission, and four named open items: the orchard's missing canonical owner, the Home-header question, the pending UIA § 4 amendment, dark mode).

## 3. The central design decision — unify by citation, own only the unowned

The mission's hard constraint was *"do not duplicate existing architecture"* while being *"the single source of truth."* These reconcile only one way, and the Blueprint states it in its own preamble: **it restates no rule from any other governing document — restating a rule creates a second owner of it — it cites the owner and adds only what has no owner.** Concretely:

- **Behaviour, look, and feeling remain exactly where they were.** The Blueprint's §§ 9–11 and § 14 (motion, typography, rhythm, shell) legislate nothing: they state the unified house reading and cite UIA/EXPLANG/EXP1 for every rule.
- **The Blueprint owns only the previously unowned:** the Vision, One Home Many Places, the Orchard Exposure Scale, the house's light/material direction, the Living Details, the Companion's place, the Blueprint Checks, the spatial anti-patterns, and the Design North Star.
- **A yield clause is built in** (§ 18): if any Blueprint statement is later found to duplicate a rule owned elsewhere, the Blueprint statement is the defect; and when a concern owned there graduates to a fuller home (e.g. the depth/light vocabulary entering the UI Architecture by amendment), the Blueprint yields ownership in the same change.

## 4. Graduation without law-jumping

Adopting the EXP4/EXP5 concepts into governance does **not** ship them, and the Blueprint says so explicitly (§ 2.4). Three constraints the discoveries themselves declared are preserved verbatim in force:

1. The ground-plane/warm-shadow/penumbra vocabulary sits beyond UIA § 4's flat-surface law and may not ship on any surface until the **governed UIA amendment** (EXP4 § 6 / EXP5 § 9.2) lands — until then UIA § 4 as written remains the binding law of every shipped surface.
2. Exposure levels and per-domain light values enter only as **semantic tokens by admission** (UIA § 16).
3. Living Details are admitted **one at a time** against the Experience Review Questions.

The Blueprint Check "The governance path" (§ 15.2) makes jumping this path a named, checkable failure.

## 5. Files created and changed

**Created:**

| File | What it is |
|---|---|
| `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` | The governing THA Experience Blueprint (18 sections) |
| `docs/implementation/architecture/EXPBLUE1_THA_EXPERIENCE_BLUEPRINT.md` | This report (new `architecture` workstream folder) |
| `.engineering/session/runs/EXPBLUE1_THA_Experience_Blueprint.md` | Session run file |

**Changed (extensions only — nothing rewritten, nothing removed):**

| File | Change |
|---|---|
| `docs/architecture/README.md` | Experience Governance table: added the Blueprint row (first, as the unifying document). Added one descriptive prose paragraph after the existing Experience Governance prose — the existing paragraphs are untouched |
| `docs/architecture/ENGINEERING_WORKFLOW.md` | STEP 2 required reading for user-facing work: added the Blueprint line above the three existing lines. Experience & UI Governance Compliance block: "Three governing documents" → "Four", added the Blueprint row to the ownership table, and added one ✓ line for the Blueprint Checks (§ 15.2). All existing rows, lines, and checks unchanged |
| `.engineering/session/CURRENT.md` | Added the `EXPBLUE1_THA_Experience_Blueprint` dashboard row |

**Untouched:** all production code, all UI, all prototypes and their pending decisions (ARRIVAL1, EXP2, EXP3, EXP4, EXP5 dispositions remain the user's), `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_UI_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md` — the three unified documents were not edited at all.

## 6. Architecture compliance

- **One owner per rule (Core Principle 2, applied to governance).** Verified section by section (§ 2 of this report): every rule owned elsewhere appears in the Blueprint only as a citation; every rule the Blueprint owns appears in no other governing document.
- **Extend, never rewrite.** The three sibling documents are byte-untouched; README and ENGINEERING_WORKFLOW changes are purely additive.
- **Precedence preserved.** The Blueprint declares itself subordinate to the Experience Architecture (which prevails in any conflict) and a non-overriding sibling of the UI Architecture and Experience Language — the same footing EXPLANG holds.
- **Enforceability (the ARCH-VERIFY1 lesson).** A checklist unreachable from `ENGINEERING_WORKFLOW.md` is hoped for, not enforced — so the Blueprint Checks were wired into the Experience & UI Governance Compliance block in this same change, not left for a follow-up.
- **Nothing runtime.** The Blueprint names no colour, token, component, route, duration, or framework; no code reads it. Its § 2.2 states this as its own law.
- **Not user-facing; registers not affected.** Docs-only change: no UX/UI checklists apply to the change itself, no Product Knowledge Registry entries exist yet to update (PKR is defined but unpopulated), no client building block was added or retired (Adoption Register unaffected).
- **Repository conventions (HOUSE2).** The report is workstream-filed under the new `docs/implementation/architecture/` folder; the governing document lives in `docs/architecture/` — the single canonical home for governing architecture.

## 7. Verification performed

- `bash .engineering/scripts/repo-structure-verify.sh` — every check this workstream touches passes (no loose files under `docs/implementation/` or `docs/investigations/`; workstream filing respected; no duplicate documents). One pre-existing failure is unrelated and predates EXPBLUE1: two stray root files (`.glibcheck.txt`, `.libdirs_uxhome.txt`) left by an earlier session, not created or touched here, left for their owning session to clear.
- Manual cross-check of every Blueprint citation target (section numbers in EXP1, UIA2, EXPLANG1, EXP5) against the current documents.
- Confirmed the Experience Governance prose in `README.md` and the compliance block in `ENGINEERING_WORKFLOW.md` render correctly and contradict nothing existing.

## 8. Confirmation

**EXPBLUE1 is complete.** THA now has one governing Experience Blueprint: the vision (*"a warm, lived-in home where someone has already thought about dinner"*), the map of the house (eleven domains as rooms of one home, differentiated only by purpose, light, material, and one sign of life), the orchard fixed as the living world outside every window with a governed E0–E3 exposure scale, one morning light, a three-ground material vocabulary, a ten-entry Living Details library under six laws, the Companion's fixed chair, the sacred shell, ten Blueprint Checks wired into the engineering gate, eight spatial anti-patterns, and a Design North Star — with every pre-existing rule still owned exactly once, in exactly the document that always owned it.
