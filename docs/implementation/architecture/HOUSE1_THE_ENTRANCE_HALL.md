# HOUSE1 — The Entrance Hall (Implementation Report)

**Workstream:** ux / architecture (experience design)
**Status:** COMPLETE — design specification delivered; no code, no governing rule created; all six documents it builds on left byte-untouched
**Date:** 2026-07-15
**Rollback Identifier:** `rollback/HOUSE1-the-entrance-hall-20260715` → `b3c650cd`
**Creates:**
- [`docs/implementation/ux/HOUSE1_THE_ENTRANCE_HALL.md`](../ux/HOUSE1_THE_ENTRANCE_HALL.md) — the permanent Home design specification (the definitive Home reference)
- [`docs/implementation/architecture/HOUSE1_THE_ENTRANCE_HALL.md`](./HOUSE1_THE_ENTRANCE_HALL.md) — this report
**Built on (cited, never restated):** [`THA_EXPERIENCE_BLUEPRINT.md`](../../architecture/THA_EXPERIENCE_BLUEPRINT.md) (place) · [`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`](../../architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md) (design language) · [`THA_ORCHARD_LIVING_BOOK.md`](../../architecture/THA_ORCHARD_LIVING_BOOK.md) (lived account) · [`ORCHARD2_FIRST_LIGHT.md`](../ux/ORCHARD2_FIRST_LIGHT.md) (arrival moment) · [`ORCHARD3_VISUAL_CONCEPT_EXPLORATION.md`](../ux/ORCHARD3_VISUAL_CONCEPT_EXPLORATION.md) (visual soul) · and their governors: [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md), [`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md), [`THA_EXPERIENCE_LANGUAGE.md`](../../architecture/THA_EXPERIENCE_LANGUAGE.md)
**Session:** `HOUSE1_The_Entrance_Hall` ([run file](../../../.engineering/session/runs/HOUSE1_The_Entrance_Hall.md))

---

## 1. What this workstream did

Designed the **permanent Home experience** of The Healthy Apples — **The Entrance Hall of the Orchard House** — in the adopted **"The Kept Room"** visual identity (ORCHARD3 Concept B). Where ORCHARD2 First Light designed the single *arrival moment* (the first thirty seconds, first entry of the day), HOUSE1 designs the whole permanent room: the layout at rest and in use, across morning, midday, and evening, and across the many returns of an ordinary day. Because Home is the room every session begins in and every other room is reached through, this specification is also the reference every future THA room inherits.

**Design only. No code, no React components, no production UI, no design tokens, no colour values.** The only diagrams are low-fidelity ASCII spatial-composition sketches showing *where things sit and how they relate* — never appearance. No production file was touched. The Kept Room was taken as the fixed direction (per the mission); no alternative concepts were explored.

## 2. The central design idea

Home is designed as **the Entrance Hall of the Orchard House** — the warm, kept, quietly intelligent room you arrive into, get your bearings in, and return to; never the room the work happens in, and never a dashboard. Two ideas carry the whole specification:

1. **One morning, forever — the household's day shows through the data, never the house's light.** This is HOUSE1's central intellectual contribution and the way it satisfies the mission's *morning / midday / evening* requirement without breaking the one-morning law (Experience Blueprint § 7; OHDB § 11; Orchard Living Book, *Evening In The Orchard*). At every hour the light, orchard, materials, and layout are **identical**; the only thing that changes is the **household's own truth** — the true, useful thing to say for the hour (the week in the morning; tonight's meal at the dinner hour) and the one door drawn from it. *Time shows through the household's life, never the house's weather.*
2. **The Kept Room, made a room.** Home is the first and clearest expression of the adopted visual soul (ORCHARD3 § 5): a warm plaster ground in low morning light, a compact lit oak counter worn by use, the ancient orchard held generously at the E3 window, the household's own life the only ornament — warm minimalism, *modern bones and warm skin*, calm that stays warm because the room is visibly kept.

The one feeling the whole design exists to produce, across a whole day: **the household was welcomed, oriented, and quietly kept — and noticed the home, never the software.**

## 3. The distinction that shaped it — the room vs. its opening beat

The mission asked for the *permanent* Home, so the design turns on the boundary between the room and its arrival:

- **First Light (ORCHARD2)** owns the arrival *moment* — the crossing, the once-a-day greeting, the one light moment, the Companion's beat. HOUSE1 **cites it and does not restate it** (§ 7).
- **HOUSE1** owns the permanent *room* — everything the arrival settles into and everything after it: the at-rest layout, the room in use, the honest quiet state, the many returns, the dinner-hour orientation.

Said plainly: *First Light is how you come in; the Entrance Hall is the room you are in.* This keeps the greeting's once-a-day ceiling intact (Experience Blueprint § 12.2) and cleanly separates what each document governs.

## 4. The mission's deliverables — where each is covered

Every element the mission named is defined in the specification, each with *why it exists · why it belongs in this room · why it supports the household · why it supports The Kept Room*, and each cited to its owner.

| Mission element | Where (HOUSE1 §) |
|---|---|
| Overall spatial composition | § 2 |
| Visual hierarchy | § 4 |
| Arrival sequence | § 7 (cites ORCHARD2) |
| Daily rhythm | § 6 |
| Permanent layout | § 3 |
| What changes throughout the day | § 6.2, § 20 |
| What always remains | § 3, § 6.3, § 20 |
| Companion placement and behaviour | § 9 |
| Orchard relationship | § 10 |
| Information hierarchy | § 5 |
| Motion philosophy | § 14 |
| Material language | § 12 |
| Light behaviour | § 11 |
| Surface depth | § 13 |
| Empty state philosophy | § 15 |
| Returning Home behaviour | § 8 |
| Progressive disclosure | § 16 |
| Interaction philosophy | § 17 |
| Accessibility considerations | § 18 |
| Mobile-first behaviour | § 19.1 |
| Tablet behaviour | § 19.2 |
| Desktop behaviour | § 19.3 |
| Morning / Midday / Evening / repeated returns (narrative) | § 21 |
| Home as the gold standard | § 22 |
| Why every element exists (decision reasons) | § 23 |
| Deliberately absent | § 24 |
| The Entrance Hall design principles (ten) | § 25 |

The six required feelings — *warm · calm · lived-in · quietly intelligent · never busy · never dashboard-like* — are the design's governing constraints throughout, met by: warmth from light and material (§ 11, § 12); calm from air, restraint, and one primary action (§ 4, § 17); lived-in from the household's own data (§ 12, § 15); quietly intelligent from *someone has already thought about dinner* — one door chosen for the hour (§ 5, § 6); never busy from the empty state as a primary warm state and the desktop width becoming air not widgets (§ 15, § 19.3); never dashboard-like from the absence of all metric furniture at any hour (§ 5.3, § 24). *Technology quietly disappears* (Experience Blueprint § 1.5) and *the household is always present* (§ 12, § 21); *the orchard remains a gentle presence beyond the house* (§ 10).

## 5. Architecture compliance

- **Governing-doc bootstrap (README STEP 2):** read before authoring — the README, Experience Blueprint (EXPBLUE1/2), Orchard House Design Blueprint (OHDB1), Orchard Living Book (OLB1), ORCHARD2 First Light, ORCHARD3 The Kept Room, and the session recovery protocol.
- **One owner per rule (Experience Blueprint § 18; Architecture Principle 2):** the specification restates **no** rule. Every rule is cited to its owner (Experience Architecture behaviour, UI Architecture look/values, Experience Language feeling, Experience Blueprint place, OHDB design character). It creates no governing law and no second owner; the README and every governing document are **byte-untouched**. If any line is later found to duplicate an owned rule, that line is the defect and is corrected to a citation (§ 26).
- **The Experience Test, Blueprint Checks, and Design Character Check** (Experience Blueprint § 15.2/§ 15.3; OHDB § 16.2): all pass — see HOUSE1 § 26. Home is designed exactly to its map row (Experience Blueprint § 5.1: E3, full morning, compact counter, greeting Living Detail) and its OHDB design reading (§ 13.1).
- **Governance path declared, not jumped** (HOUSE1 § 0.4): the Kept Room depth/light vocabulary ships only via the UIA § 4 amendment; exposure/light values only as tokens by admission; the greeting only as its own admitted Living Detail; the Kept Room itself only after graduating into the UI Architecture / OHDB by amendment. The two blocking open items (the orchard's owner; Home's header — Experience Blueprint § 18) are named as prerequisites and left unresolved here.
- **Not user-facing code:** this is a design specification, not an implementation. It touches no component, hook, token, route, or database, so the Experience & UI, Product Registry, and Adoption Register compliance blocks apply to the *eventual implementation*, not to this document. No Product Knowledge Registry entry is created (the registry is defined and populated nowhere yet — PKR1/PKR3).
- **Repository conventions (HOUSE2):** both files live in the canonical design location (`docs/implementation/ux/` for the design, `docs/implementation/architecture/` for the report), matching the ORCHARD2 precedent exactly.

## 6. Relationship to all the Orchard documents

HOUSE1 sits at the point where all five prior Orchard documents converge on one room; it is the first to render the whole of Home permanently and in one visual identity.

- **THA Experience Blueprint (EXPBLUE1/2) — the place.** HOUSE1 *applies* the Blueprint's map (Home = the threshold and heart, E3, full morning, compact counter, the greeting Living Detail — § 5.1), the One Home Many Places law (§ 4–5), the Orchard Exposure Scale (§ 6.2), the one-sun light (§ 7), the three grounds and air-as-material (§ 8), the Living Detail constitution (§ 12), the Companion's place (§ 13), the constant shell (§ 14), and the Technology Principle (§ 1.5). It owns none of them; it renders Home from them. It respects the Blueprint's open items as prerequisites.
- **Orchard House Design Blueprint (OHDB1) — the design language.** HOUSE1 realises OHDB's Home design reading (§ 13.1) in full and applies its architectural character (§ 3), interior philosophy of composed emptiness (§ 4), material/light/colour/typography/depth sensibilities (§ 5–9), the house-and-orchard relationship (§ 10), the one-season/one-morning doctrine (§ 11), and above all *Timeless, not fashionable* (§ 14) — which is the direct source of HOUSE1's refusal of an evening theme or dimmed dinner-hour Home.
- **Orchard Living Book (OLB1) — the lived account.** HOUSE1's § 21 narrative and its felt register extend the Living Book's Home chapters directly: *First Light*, *The View Into The Orchard*, *Tea Before The Day Begins*, *Returning Home*, *Quiet Moments*, and *Evening In The Orchard* — the last of which is the source of HOUSE1's core reconciliation (*the household's evening beside a house that keeps its morning*). HOUSE1 is written in the Book's voice while restating none of its (owner-cited) rules.
- **ORCHARD2 — First Light — the arrival moment.** HOUSE1 is First Light's successor and companion: it cites First Light as the Entrance Hall's opening beat (§ 7) and designs the permanent room around it, preserving the First Light / Returning Home distinction (§ 8) that protects the greeting.
- **ORCHARD3 — The Kept Room — the visual soul.** HOUSE1 takes ORCHARD3's recommended and adopted direction (§ 5) as given and renders Home *as* the Kept Room: warm ground before anything else, warmth from light and material never ornament, patina by data never paint, modern restraint so warmth never tips rustic (§ 12, § 25) — including the grafted Pavilion view (E3) and the disciplined orchard light (§ 10). It explores no alternative, exactly as the mission directed.

## 7. Summary of the Home design

**Home is the Entrance Hall of the Orchard House** — a warm, kept, quietly intelligent room the household arrives into, gets its bearings in, and returns to all day. It is the one room at **E3, the open view**: the ancient orchard held generously at the window, still and in leaf, above a **compact warm counter** — the Kept Room's warm plaster ground and lit oak plane — that carries the household's greeting, a thin honest line of orientation, and exactly **one door** chosen for the hour. The Companion keeps a single fixed chair, arrives a beat behind, and stays quiet unless there is something worth saying.

The room keeps **one unchanging morning**. Its daily rhythm is carried entirely by the household's own truth: at breakfast it says the week is calm and tonight is handled; at the dinner hour it says *tonight: the traybake you planned* and points the one door at cooking — the **light, orchard, materials, and layout identical at every hour**, because *time shows through the household's life, never the house's weather*. The first entry each day is First Light; every entry after is a quiet **return** to an unchanged room, the greeting spent once and then simply kept. The **empty state is a primary, warm state** — the composed quiet of a room someone keeps, honest in absence, never dressed into busyness. It is **one room at three sizes** — mobile-first, the same walls and morning and counter and door on a phone, a tablet, and a desktop, where extra width becomes air and view, never a wider dashboard.

Everything is designed so that **technology quietly disappears and the household is always the most present thing in the room**, with the orchard a gentle life beyond the glass. Because Home is entered first and returned to most, this design is the **gold standard every future room inherits** — the arrival grammar, the Kept Room sensibility, the one-morning rhythm, and the permanence contract — free to differ only in the four governed ways a room may differ (purpose, light level, material posture, one sign of life).

**Nothing here ships** until the Kept Room graduates by amendment, the UIA § 4 amendment and token admissions land, the greeting is admitted as its own Living Detail decision, and the Blueprint's open items on the orchard's owner and Home's header are closed (§ 0.4). What is delivered is the definitive *design* — the room drawn in full, ready for that governed path.

---

*An implementation report for a design specification — no code, no governing rule, no second owner; the README and all six source documents left byte-untouched.*
*Rollback: `rollback/HOUSE1-the-entrance-hall-20260715` → `b3c650cd`. To revert entirely, delete the two HOUSE1 files and restore `CURRENT.md`.*
