# NORTH2 — Experience Architecture Refinement Review

## Assessing the NORTH1 findings against the governing Experience Architecture

**Status:** INVESTIGATION — point-in-time analysis and a recommendation. **Not** governing architecture, **not** a specification, **not** implementation. It creates no rule and no second owner (Experience Blueprint § 18; Architecture Principle 2), and **it amends nothing**.
**Classification:** Experience Governance (investigation)
**Date:** 2026-07-16 (NORTH2)
**Rollback ID:** `rollback/NORTH2-experience-architecture-refinement-20260716` → `7d1dd2ce`
**Source under review:** [`NORTH1_THE_VISUAL_NORTH_STAR.md`](../../implementation/ux/NORTH1_THE_VISUAL_NORTH_STAR.md) — treated here strictly as an **evaluation document**, never as architecture.
**Reviewed against:** [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) · [`THA_EXPERIENCE_BLUEPRINT.md`](../../architecture/THA_EXPERIENCE_BLUEPRINT.md) · [`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`](../../architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md) · [`THA_EXPERIENCE_LANGUAGE.md`](../../architecture/THA_EXPERIENCE_LANGUAGE.md) · [`THA_KEPT_ROOM_TRANSLATION.md`](../../architecture/THA_KEPT_ROOM_TRANSLATION.md) · [`THA_ORCHARD_LIVING_BOOK.md`](../../architecture/THA_ORCHARD_LIVING_BOOK.md) · [`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) · `docs/architecture/README.md` (Architecture Bootstrap, STEP 2)
**No UI designed, no UI implemented, no architecture modified, no second visual language created.**

---

## 1. THE TWO HEADLINE FINDINGS

**First: the Experience Architecture should not be touched, and none of the five proposals belongs in it.**

The mission is framed as *refining the Experience Architecture*. Applying the document's own boundary honestly, it is the wrong document for every one of the five. It is explicitly **technology-independent** and **deliberately not a visual style guide** (§ 1); it governs *behaviour* while the UI Architecture governs *presentation*, and § 2.1 fixes the line: *"this document decides what may happen; the UI Architecture decides how it looks when it happens."* All five proposals — an orchard's boundedness, object honesty, a felt temperature, spatial share, and light-by-hour — are **place, design, and feeling** concerns. They are owned by the Experience Blueprint, the Orchard House Design Blueprint, and the Experience Language. Putting any of them into the Experience Architecture would be the first time that document named a visual concern, and would create a second owner of a rule those documents already hold.

> **Recommendation: `THA_EXPERIENCE_ARCHITECTURE.md` stays byte-untouched.** NORTH1 produced no behavioural finding that is not already law there.

**Second: four of the five proposals are already owned — one completely enough that adopting it would damage the canon.**

| # | Proposal | Verdict | Owner (existing or proposed) |
|---|---|---|---|
| 1 | **The Aperture Principle** | **ADOPT — narrowed** | Experience Blueprint § 6.1 (extends) |
| 2 | **Truthful Objects** | **DO NOT ADOPT** — owned three times over | Blueprint § 12.1 r2 · OHDB § 4 · TRANSLATION1 *Patina* |
| 3 | **Presence** | **DO NOT ADOPT** — owned, precisely, already | Experience Language § 3A.2 / § 3A.4 · OHDB § 4 |
| 4 | **The Interface as Guest** | **DO NOT ADOPT** — half owned, half **conflicts** | Blueprint § 8.2 (owned half) · **conflicts § 6.2, § 16** |
| 5 | **Time** | **REJECT** — reverses the one-morning law | Blueprint § 7 · TRANSLATION1 *Morning Rhythm* |

**One amendment recommended, of one bullet, to one document.** That is the whole of it, and the small number is the finding — not a disappointing result from it. The Experience Blueprint's own § 1.3 warns that this canon *"was becoming a library rather than a blueprint — the vision reconstructible only by reading five documents in the right order."* There are now seven. **The discipline that protects a canon this size is refusing to write things twice**, and four of these five would be written twice.

---

## 2. THE TEST APPLIED

Each proposal was put through the same five questions the mission specifies, but gated by one prior question the architecture itself imposes:

> **Is this rule already owned?** If yes, the proposal is not an amendment — it is a **restatement**, and every governing document in this set forbids restatement in identical terms: *"restating a rule creates a second owner of it, which the architecture forbids"* (Blueprint § 18; OHDB § 16.3; TRANSLATION1 § 7.3; Experience Principle 6).

A finding that a render violated an existing rule is **evidence the rule is correct**, not evidence that a new rule is needed. NORTH1 is mostly that kind of evidence, and that is a good outcome for the architecture — it means the canon predicted the failure before the render produced it.

---

## 3. THE FIVE PROPOSALS

### 3.1 The Aperture Principle — **ADOPT, narrowed**

*The orchard is experienced through composed openings separated by solid architectural ground; the orchard is never continuous behind the interface.*

**Should it become governing architecture?** **Yes** — but only the part that is genuinely new, which is smaller and sharper than the proposal as stated.

**What is already owned.** Most of it. Blueprint § 6.1: *"The orchard is never wallpaper. No room contains the orchard; every room is oriented toward it. A backdrop applied uniformly behind everything is the flattening the Place Principles forbid."* § 6.2 (E2): *"a framed, partial presence in one committed region the content deliberately does not cover... Framed by composition, never by a drawn frame."* The prohibition on continuous backdrop is fully owned; restating it would be the defect.

**What is genuinely new — two things, and only these:**

1. **Boundedness binds at E3, not only E2.** § 6.2 defines E3 as *"the orchard visible as itself, generously; sparse content on its ground"* — and says nothing about whether that view is bounded. **A full-bleed orchard running to the frame's edge is currently legal at Home.** That is a loophole wide enough for the wallpaper anti-pattern to walk back through, one room at a time, and NORTH1 found the live product already standing in it.
2. **Plurality is permitted, and the ground between openings is load-bearing.** § 6.2's E2 says *"one committed region"* — singular. The reference shows two openings with wall between them, and the wall is what makes each read as a view rather than a hole. Nothing in the canon says a room may have two openings, nor that the ground between them is doing the work.

**Which document should own it?** **The Experience Blueprint § 6.1** — the laws of the one orchard. It already owns *"the orchard is never wallpaper"*; this is that prohibition's constructive form, and it belongs beside it. Not the Experience Architecture (visual), not the UI Architecture (this sets no value), not OHDB (which cites § 6 and must keep citing it).

**Extends or new section?** **Extends § 6.1 — one bullet.** No new section, no renumbering.

**Does it conflict?** **Not with any governing rule** — provided it is narrowed as follows. Two things must be got right:

- **It must bind only where the orchard appears as image (E2–E3).** At **E1** the orchard is *"light only... not image"* and at **E0** there is no orchard at all (§ 6.2). A rule saying "the orchard enters through apertures" would, read flatly, require an aperture in rooms that must not have one — contradicting the exposure scale it is meant to serve. The rule governs the *image's boundary*, never its existence.
- **The wording must be "bounded", not "separated".** "Separated by solid ground" presumes two openings and cannot be satisfied by E2's single committed region. The general form is: solid ground on every side where the orchard meets the interface, **and** between any two openings.

**One real downstream cost, named rather than buried.** This constrains a composition the design work has already adopted. DESIGN1 § 4 and HOUSE1 § 2.2 read Home top-to-bottom as **sky → light → surface → hand** — a *horizon*, which is orchard bounded below by the counter and bleeding freely to the top and side edges. **A horizon is not an aperture.** Adopting this principle means Home's anatomy is drawn as a view *within an architectural frame* rather than as an open horizon, and DESIGN1 § 4 / HOUSE1 § 2.2 would need revisiting in the same decision. Neither is governing architecture (DESIGN1 is a visual design specification; HOUSE1 a written one), so **neither is an architectural conflict — both yield to the Blueprint by their own terms**. But the cost is real and should be accepted knowingly, not discovered later.

**The smallest architectural change.** One bullet appended to Blueprint § 6.1, in the section's existing voice:

> - **The orchard is bounded wherever it is seen.** Where a room shows the orchard as image (E2–E3), the view is held by solid architectural ground on every side it meets the interface, and by solid ground between any two openings — it never bleeds to the frame's edge and never runs continuously behind the working surface. The bounding ground is not the absence of the view; it is what makes the view read as a view rather than a backdrop. *(At E1 and E0 there is no image and this rule is silent — the orchard is light alone, and its recession is the design.)*

Nothing else changes. No value, no token, no exposure level, no anti-pattern (§ 16's *wallpaper* already covers the failure this prevents, and must not be extended to say it twice).

---

### 3.2 Truthful Objects — **DO NOT ADOPT**

*Distinguish decorative props from genuine household artefacts; objects permitted only when generated from real household state or canonical data; decorative objects remain forbidden.*

**Should it become governing architecture?** **No.** Every clause is already law, in three documents, in stronger language than the proposal uses.

**Where it is owned:**

- **Blueprint § 12.1 rule 2** — *"Data-borne or dead. Every detail renders something TRUE from a canonical owner... A painted prop (drawn fruit, fake steam, decorative crumbs) is fabricated feeling, **forbidden by construction**."* The proposal's exact rule, including its exact examples.
- **Blueprint § 12.1 rule 3** — *"Honest in absence."* The proposal omits this; the existing rule is stronger.
- **OHDB § 4** — *"The household's own life is the only ornament... The house is warm because it is lived in, not because it was dressed."*
- **TRANSLATION1 *Patina* § 9** — *"Patina by paint, never by data."* And *Handmade ceramics* § 9 — *"Imperfection is carried by real data, never by faux distress."*
- **Experience Architecture Principle 7 and § 12** — *"Never fabricate"* — the behavioural root all three inherit from.

**Which document should own it?** It is owned. Blueprint § 12 is the canonical owner of what may exist as an object in a room, and TRANSLATION1 translates it to interface.

**Extends or new?** Neither. **Nothing to add.**

**Does it conflict?** Only by existing. Blueprint § 18's yield clause is explicit: *"If any statement in this blueprint is found to duplicate a rule owned elsewhere, the statement here is the defect and is corrected to a citation."* A new Truthful Objects principle would be that defect on the day it was written.

**Smallest change: none.** NORTH1 § 5.2's finding is that a render violated § 12.1 rule 2. The correct response is to refuse the render, which NORTH1 already does.

---

### 3.3 Presence — **DO NOT ADOPT**

*Define the feeling that the home is cared for and lived in; explain how this differs from luxury, decoration or minimalism.*

**Should it become governing architecture?** **No** — and this is the most emphatic of the four refusals, because the proposal's exact content, including its three-way contrast, is already the most carefully constructed section in the canon.

**Where it is owned — clause by clause:**

- **"Cared for and lived in"** — Experience Language § 3A.2 names *lived-in* as the palette's defining addition and defines it: *"A home has life in it: light, warmth, food, evidence of care. **A show home has none, however beautiful, and THA must never feel like one.**"*
- **The positive target** — § 3A.4: *"calm must never become lifeless"*, with a good/avoid pair (*warm morning light · freshness · breathing space · optimism · quiet confidence* against *empty luxury · spa-like stillness · meditation-retreat aesthetics · excessive silence · emotional coldness*). This is precisely the *"positive thing to aim at"* the proposal seeks, and it already exists.
- **How it differs from luxury** — § 3A.1 lists *"luxury for luxury's sake"* among the eight never-feelings; § 7 names *"Cold luxury"*; Experience Architecture § 17.12 adds *"Not exclusivity."*
- **How it differs from decoration** — § 3A.3: *"The orchard represents life. Not silence. Not stillness. **Not decoration.**"* OHDB § 4: the household's life is the only ornament. OHDB § 12: *"warmth is carried by light and material, never by ornament."*
- **How it differs from minimalism** — § 7: *"**Clinical minimalism.** Emptiness and sterility wearing the costume of elegance... reduction pursued until nothing warm survives it."* OHDB § 4: *"Composed emptiness, never bare emptiness — the deliberate quiet of a room someone keeps, not the emptiness of a room no one uses."*

All three contrasts the mission asks for are already drawn, each by a named owner. § 3A exists *because* the Arrival reviews found this exact gap, and EXPLANG1B closed it deliberately in July.

**Which document should own it?** Experience Language § 3A (the feeling) and OHDB § 4 (the interior philosophy that produces it). Both already do.

**Extends or new?** Neither. Adding an eighth note to a governed seven-note palette, or a second definition of *lived-in*, would damage the most load-bearing section in the emotional constitution.

**Does it conflict?** Yes — with § 3A itself, by duplication.

**Smallest change: none.** If anything here is a gap, it is that § 3A.2's definition is not *reachable* from the place documents by citation. That is a navigation concern, not a rule, and it does not justify an amendment.

---

### 3.4 The Interface as Guest — **DO NOT ADOPT**

*The interface occupies only the space required for its task. The room always remains the primary experience.*

This proposal has two halves, and they fail for opposite reasons.

**The first half is sound and already owned.** *"The interface occupies only the space required for its task"* is Blueprint § 8.2 (*"Air is a material. Generous breathing space is the resting state of every room"*), UIA § 9 (*"content that will not fit with its air intact is split, not compressed"*), and TRANSLATION1 *Space* § 4 (*"the extra width of a large screen becomes air and view, never more widgets"*). Nothing to add.

**The second half is false in this architecture, and this is the report's second substantive finding.**

> *"The room always remains the primary experience"* **contradicts the Orchard Exposure Scale and the spatial anti-patterns.**

- Blueprint § 6.2's inverse law: *"exposure is inversely proportional to functional density. The more a surface asks the eye to work, the further the orchard recedes."*
- Blueprint § 16, *metaphor taxing function*: *"On dense working surfaces place recedes to almost nothing — **and that recession is itself the design**. If the concept ever fights the Planner, the concept loses."*
- Blueprint § 16, *all view, no room*: a working surface that is mostly environment *"reads as nobody home"* — named as an anti-pattern.

In the Planner, the Analyser, and every dense surface, **the work is the primary experience and the room is deliberately almost gone.** Home is E3 — the exception the scale exists to bound — not the rule the house follows. Adopting "the room always remains primary" would generalise Home's exception into a law and invert § 6.2's central mechanism.

**Which document would own it?** None, because the sound half is owned and the novel half must not be law.

**Does it conflict?** **Yes — directly, with Blueprint § 6.2 and § 16.** Per the mission's own instruction (*"do not modify architecture yet if conflicts exist"*), this is a hard stop regardless of the rest.

**Smallest change: none.** NORTH1 § 4.4's underlying observation — that the reference's panel is small and off-centre — is a **composition insight for Home's design**, correctly recorded in an implementation document, and it should stay there. It is not a law, and as a law it would be a wrong one.

---

### 3.5 Time — **REJECT**

*Evaluate whether the architecture should recognise time as part of the experience. Morning, afternoon and evening should influence atmosphere without becoming themes or visual gimmicks.*

**Should it become governing architecture?** **No.** This is not an addition to the architecture — it is a **reversal** of its single most load-bearing law, and the canon anticipates it by name in five places.

- **Blueprint § 7:** *"One sun, one direction, one hour. The morning sun sits upper-left, forever, in every room... It is always the same bright morning — no room is ever at dusk, in shade-as-mood, or under artificial light. **Every room in this house is a morning room.**"*
- **Blueprint § 16, *the second sun*:** *"A room at dusk, in fog, in spa-light, or under drama — any lighting that breaks the one morning. Quieter never means darker."*
- **OHDB § 11:** *"The Orchard House has one season and one hour, and **this is a deliberate design decision, not an unfinished one**."*
- **TRANSLATION1 *Morning Rhythm* § 9:** *"**No evening theme, night mode as atmosphere, or dimmed dinner-hour palette** — that is the second sun, and it breaks the one-morning law; **STOP**."*
- **TRANSLATION1 *Light* § 3:** the interface *"never darkens for the hour, the mood, or 'night as atmosphere'."*

The proposal's qualifier — *"without becoming themes or visual gimmicks"* — is the exact escape the canon has already refused. **"Atmosphere" is the trap.** An atmosphere that varies by hour *is* a theme; there is no third thing between "the light changes with the clock" and "the light does not." The Orchard Living Book spends four chapters (*Rain Against The Glass*, *Autumn*, *Winter*, *Evening In The Orchard*) establishing why: *"the rain is on your side of the glass, never inside"*; the house keeps a different weather than the world outside, and **that refusal is the entire comfort**.

**And yet the architecture already recognises time — completely, and better than the proposal.** This is the part worth carrying forward. Time is not absent from THA; it is routed away from the light and into the truth:

- **TRANSLATION1 *Morning Rhythm* § 3:** *"A surface's 'rhythm of the day' is carried **entirely by what is true right now — the household's data — never by the house's light, theme, palette, or mood.** The interface reflects the hour by saying the true and useful thing for it, and by nothing else."*
- **TRANSLATION1 *Morning Rhythm* § 8:** *"The one primary action is **re-aimed by relevance** across the day — look at the week in the morning, start tonight's dinner at the dinner hour."*
- **Blueprint § 12.2:** the greeting is *"Clock + household name"* — data-borne, from the real hour.
- **OHDB § 11:** *"**Time shows through the household's life, never through the house's weather.**"*

So the honest answer to *"should the architecture recognise time?"* is: **it already does, and the mechanism it chose is the better one.** The house has one hour; the household has all of them. THA already changes across the day — in *what it says and what it offers*, which the household actually feels — and refuses to change in *how it looks*, which would only cost them the constancy the whole house is built to give.

**Which document should own it?** Owned: Blueprint § 7 (the one morning), TRANSLATION1 *Morning Rhythm* (time through data).

**Does it conflict?** **Yes — frontally, with the most-cited law in the canon.** Hard stop.

**Smallest change: none.** If a future decision genuinely wants to revisit the one-morning law, that is not a refinement — it is a **reversal of the Blueprint's § 7, OHDB § 11, and the Living Book's premise**, and it must be proposed as such, on its own, with the cost named: the household loses the one place that does not change under them.

---

## 4. RECOMMENDED AMENDMENTS

**One amendment. Not applied — the mission instructs that no architecture be updated without explicit instruction, and it has not been given.**

| Document | Section | Change | Size |
|---|---|---|---|
| `THA_EXPERIENCE_BLUEPRINT.md` | § 6.1 (the laws of the one orchard) | Append the *"the orchard is bounded wherever it is seen"* bullet, verbatim as drafted in § 3.1 above | **One bullet.** No new section, no renumbering, no value, no token |

**Conditions that must hold before it is applied:**

1. The bullet must be **narrowed to E2–E3** as drafted — it must be silent at E1/E0, or it contradicts the exposure scale it serves.
2. **DESIGN1 § 4 and HOUSE1 § 2.2 must be accepted as needing revision in the same decision** — their sky → light → surface → hand horizon is not an aperture (§ 3.1 above). Neither is governing, so neither blocks; both should be corrected knowingly rather than left to drift.
3. It is recorded as a **named governance decision** per Blueprint § 18 (*"change enters by governance, never by shipping"*), citing NORTH1 as its discovery source in the way § 2.4 records the EXP2–EXP5 graduations.

**Documents that must not change:** `THA_EXPERIENCE_ARCHITECTURE.md` (§ 1 — no behavioural finding), `THA_UI_ARCHITECTURE.md` (no value proposed), `THA_EXPERIENCE_LANGUAGE.md` (§ 3A already owns Presence), `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` (§ 4 already owns the interior philosophy), `THA_KEPT_ROOM_TRANSLATION.md` (a translation follows its source; if § 6.1 changes, *Orchard views* § 4 may later need one citation, which is a consequence, not a decision), `THA_ORCHARD_LIVING_BOOK.md` (adds no rule).

---

## 5. PRINCIPLES THAT SHOULD EXPLICITLY NOT BE ADOPTED

Recorded here so that no future audit rediscovers and re-asks them — the discipline Blueprint § 12.2 and `EXP5` § 5.3 already apply to declined Living Details.

| Proposal | Why it is refused |
|---|---|
| **Truthful Objects** | Owned three times over (Blueprint § 12.1 r2 · OHDB § 4 · TRANSLATION1 *Patina*). Adopting creates the second owner § 18 forbids. |
| **Presence** | Owned by Experience Language § 3A.2 / § 3A.4 and OHDB § 4, including all three contrasts (luxury § 3A.1, decoration § 3A.3, minimalism § 7). § 3A exists because EXPLANG1B closed this exact gap in July. |
| **The Interface as Guest** | Sound half owned (Blueprint § 8.2). Novel half — *"the room always remains the primary experience"* — **conflicts** with § 6.2's inverse law and § 16's *metaphor taxing function*; it would generalise Home's E3 exception into a law. |
| **Time-varying atmosphere** | **Conflicts** with Blueprint § 7, § 16 (*the second sun*), OHDB § 11, and TRANSLATION1 *Morning Rhythm* § 9, which forbids it by name and instructs STOP. Time is already recognised — through the household's data, never the house's light. |
| **Any second visual language** | Out of scope by instruction and by § 5.2 / § 16 (*the costume*). Nothing in NORTH1 or this review proposes one. |

---

## 6. WHAT NORTH1 LEAVES BEHIND — CONFORMANCE, NOT ARCHITECTURE

The most consequential NORTH1 findings are **not gaps in the architecture; they are the product disagreeing with it.** They are recorded here so the distinction is not lost, and they belong to implementation workstreams, not to this review:

- **The orchard backdrop** (`client/src/components/layout/orchard-backdrop.tsx:9`) — a photographic orchard at `opacity: 0.90` behind every room, with a 10px parallax. This is Blueprint § 16's *wallpaper* **and** *the rendered world*, and § 6.1's *"the orchard never animates"* — already forbidden, shipped anyway. The recommended § 6.1 bullet does not create this defect's illegality; it closes the horizon-shaped loophole the defect could otherwise retreat into.
- **Home has no primary action** (`client/src/pages/home-experience-page.tsx:179-397`) — Experience Principle 4 and § 7 already require exactly one. A conformance defect, not a missing principle.
- **`--card: 0 0% 100%`** (`client/src/index.css:11`) — the working surface is the one cold plane in a warm palette, masked by an opacity crutch. UIA § 7's warm palette already governs it.
- **Home's container divergence** — Blueprint § 18.2's open item, now located precisely.

**None of these requires an amendment. All of them require work.** That the canon already forbids every one of them, in writing, before the render exposed them, is the strongest available evidence that the architecture is sound and does not need refining — it needs **obeying**.

---

## 7. COMPLIANCE

- **Architecture Bootstrap (`docs/architecture/README.md`, STEP 2):** read before this review; every governing Experience document read in full.
- **One rule, one owner, forever (Blueprint § 18; Architecture Principle 2; Experience Principle 6):** the load-bearing test of this review. Four of five proposals fail it, and are refused on that ground.
- **The mission's stop condition — *"do not modify architecture yet if conflicts exist"*:** honoured. Conflicts exist for proposals 4 and 5 and are named rather than resolved. **No architecture was modified at all.**
- **Scope:** no UI designed, no UI implemented, no component, token, route, or dependency touched, no second visual language created. NORTH1 was treated as an evaluation document throughout and is cited, never promoted.
- **This document creates no rule.** The § 3.1 bullet is drafted as a **proposal to the Experience Blueprint**, deliberately written in that document's voice so it can be adopted or discarded as one decision. Until adopted there, it is not law, and this investigation is not its owner.

---

*An investigation — point-in-time analysis of the NORTH1 findings against the governing Experience Architecture and its siblings. It is history the moment it is written and is never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). Subordinate to the Experience Architecture, which prevails in any conflict.*
*Rollback: this document is new and uncommitted — to revert entirely, delete this file. Rollback tag for the NORTH2 workstream: `rollback/NORTH2-experience-architecture-refinement-20260716` → `7d1dd2ce`.*
