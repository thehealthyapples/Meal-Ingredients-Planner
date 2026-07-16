# HOUSE4 — The Orchard House Blueprint

## The house between the rooms

**Workstream:** `HOUSE4_Orchard_House_Blueprint`
**Date:** 2026-07-16
**Rollback:** `rollback/HOUSE4-orchard-house-blueprint-20260716` → `7d1dd2ce`

> **Status.** This is an **investigation** — point-in-time analysis and history. It is **not** governing architecture, **not** a specification, **not** implementation. It **creates no rule and no second owner**. Everything binding in it is binding because another document already says it, and is cited to that document. Where this file appears to state a law, the citation is the law and this file is commentary.
>
> It was asked to define the complete Orchard House, in principles, without designing screens. It does that by **composition and citation** (§ 3, § 4, § 7, § 8, § 10), because the house's philosophy, its rooms' purposes, its orchard, its Companion and its constants are **already owned completely** by seven governing documents. The honest deliverable was never new law. It is the house assembled into one legible place, plus **the three deliverables the canon does not own** (§ 5, § 6, § 9), plus **the findings that are invisible from inside any room** (§ 11, § 12).

---

## 0. THE MISSION, AND FOUR DEVIATIONS REPORTED

The mission: *"Using the existing Experience architecture together with PLAN1, BOOK1, PANTRY1 and SHOP2, define the complete Orchard House… Focus on creating the governing experiential architecture for the entire house rather than individual domains."*

### 0.1 Filing deviation

The mission said *"store the investigation under `docs/investigations/`"*. A loose file at that root **violates governing architecture** (`REPOSITORY_CONVENTIONS.md:47` — `docs/investigations/` explicitly excludes *"loose files at its root"*; `docs/investigations/README.md:11`) and **fails** `.engineering/scripts/repo-structure-verify.sh:52-54`. Filed under **`ux/`** — the Experience workstream, where `ORCH1`, `PLAN1`, `COOK1`, `PANTRY1`, `SHOP2`, `HOME1`, `HOME2`, `NORTH2`, `EXPCOMP1` and `EXP5` live. Filename preserved. **Same deviation, same resolution, as all five siblings.**

### 0.2 The status deviation — the mission asks for two mutually exclusive things

The mission asks for *"the **governing** experiential architecture"* and for it to be *"stored under `docs/investigations/`"*. **Those are mutually exclusive** (`docs/architecture/README.md:4` — *"Architecture documents no longer live in `docs/investigations/` — investigation files there are point-in-time analysis and history only"*; `REPOSITORY_CONVENTIONS.md § 3`).

**This is `ORCH1 § 0.1`'s deviation exactly, and it resolves the same way**: written as an investigation; § 15 names the promotion path and what should — and emphatically should not — travel it. **Nothing in this document governs anything.**

### 0.3 The ID deviation — `HOUSE1`, `HOUSE2` and `HOUSE3` are all taken

| ID | Taken by |
|---|---|
| `HOUSE1` | `docs/implementation/ux/HOUSE1_THE_ENTRANCE_HALL.md` — the Home design specification (2026-07-15) |
| `HOUSE2` | `REPOSITORY_CONVENTIONS.md:3` — *"Established under `HOUSE2` (2026-07-10)"* |
| `HOUSE3` | The repository structure / document filing workstream (`PHASE_C_MILESTONE_CHECKPOINTS.md:36`, commit `4c89cc0`) |

This document is therefore **`HOUSE4`**.

*(**A rollback tag was cut as `rollback/HOUSE1-…` before that collision was found, and was renamed to `rollback/HOUSE4-…` within the same session, before it had been reported or referenced anywhere.** `SHOP2 § 0.1` declined to rename its own colliding tag on the grounds that *"renaming a rollback tag after the fact is worse than an untidy one"* — that reasoning is right and does not apply here, because nothing had yet been filed against the old name. Both point at `7d1dd2ce`. Recorded so the two decisions are not read as inconsistent.)*

### 0.4 The noun deviation — *"the Orchard House Blueprint"* is one word away from a governing document

**The mission's title collides with governing architecture.** `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` (`OHDB1`, 2026-07-15) is indexed in the Architecture Bootstrap and owns *"the house's **architectural character** as a design stance"* (`README.md:82`). *"The Orchard House Blueprint"* and *"The Orchard House **Design** Blueprint"* differ by one word and would be confused in every future citation.

**The obvious workstream ID `OHB1` is free and is refused for the same reason** — `OHB1` against `OHDB1` is a one-letter difference between two documents about the same house. `EXP ARCH:211` binds naming (*"One name per concept, everywhere"*), and `PLAN1 § 6.1` established the discipline when it found *"Shared Plan"* already spent: **a concept must be named before it can be owned, and a name that is already taken is not available merely because it is apt.**

**The file is titled *The Orchard House Blueprint* as instructed and filed as `HOUSE4`**, and § 15 recommends against promoting it — which is what actually keeps the two names from ever having to coexist as law.

> **This is the fifth consecutive noun deviation in six days, and the pattern is now worth naming.** `PLAN1` refused *kitchen* (the canon contradicted it). `COOK1` kept *the family's cookbook* (it **was** the canon's). `PANTRY1` narrowed *larder* (to recover a virtue). `SHOP2` refused **both halves** of *market basket*. `HOUSE4` accepts the mission's noun and refuses its **identifier**. **Five missions, five noun problems — because the house's vocabulary is almost entirely spent, and § 5 is what happens when you try to name the one thing left.**

No other deviation. No architecture modified. No screen designed. Nothing implemented.

---

## 1. HEADLINE

**The Orchard House is completely specified room by room and completely unspecified between the rooms — and the house has no word left to describe the difference.**

Seven findings, ordered by how much they should change what happens next:

1. **The exposure scale's floor level is named after a place that exists in no document.** `BLUEPRINT:224` — ***"E0 · Lit from the hall"***. `BLUEPRINT:181` — Admin is ***"The study off the hall"***. `OHDB:302` — *"kept off the **main hall** (Experience Language § 5.9; Experience Blueprint § 5.1)"*. **Both citations are empty.** The word *hall* appears in `THA_EXPERIENCE_LANGUAGE.md` **zero times** (verified across the whole file), and **§ 5.1's only hall is the phrase `OHDB` is citing it for** — the four words *"the study off the hall"* inside the Admin row's own name cell. **A governed level of a governed scale is named after a room the canon has never admitted.** § 5.1.

2. **Every word the house would need for the space between its rooms is already spent — on something else, by a governing document.** § 5.2:

   | Word | Already means | Owner |
   |---|---|---|
   | **doorway** | **the one primary action** — *"exactly one per surface"* | `TRANSLATION1:148` |
   | **corridor** | **a failure mode** — *"a house whose rooms are indistinguishable is not a home but a corridor"* | `BLUEPRINT:156`, `:424`; `TRANSLATION1:158` |
   | **threshold** | **arrival posture at the top of one surface** | `TRANSLATION1 § 4.1` |
   | **hall / entrance hall** | E0's name · Admin's address · the title of a design spec **about Home** | `BLUEPRINT:224`, `:181`; `HOUSE1` |

   **The canon has a hall it cannot name, a doorway that means something else, a threshold that never leaves the room, and a corridor that is only ever an insult.**

3. **`BLUEPRINT § 4:138` declares the category and never populates it.** *"Every realm, dialog, admin surface, and document is a room, **a doorway**, or a note inside the same house."* **Nothing anywhere says what a doorway connects.** The house's own constitutional sentence names three kinds of thing and defines two.

4. **A rule in force cannot be checked.** `EXP ARCH:178` — *"**The shortest honest path wins.**"* A path has a length; a length needs a graph; **no document defines the graph.** § 6.2.

5. **Five room blueprints ran independently and found the same four shapes.** `card.tsx:12`'s orchard bleed (three rooms), the fabricated zero (two rooms), the last-inch drop (three fields, three mechanisms), the private book reaching through two rooms into a third. **Not one is a room defect. Every one presents as a room defect.** § 11.

6. **The room blueprints could not see the joins, and one of them said so in as many words.** `SHOP2:351` — *"**The two rooms' defects compose into something worse than either.** Recorded here because **neither investigation could see it alone**."* **That sentence is the argument for a house-level read, written by a room that had just hit its own ceiling.** § 11.1.

7. **The Experience Test fails a genuinely new room by existing.** `BLUEPRINT:416-419` — *"Which room of the home is this? **Name it against the map (§ 5.1).** If the screen belongs to no room… **STOP**."* A new room's failure mode is **identical** to a defective screen's. `ORCH1` already met this: Community *"has **no room** in the Blueprint's map of the house"* (`ORCH1:159`). § 9.

> **The sentence this document is governed by:** ***"THA has one home, and the household never leaves it while inside the product. Every realm, dialog, admin surface, and document is a room, a doorway, or a note inside the same house, on the same morning"*** (`BLUEPRINT:138`). **Every principle below is written to survive that sentence being enforced — and it is the second noun in it that does not survive.**

---

## 2. THE GATE — APPLIED TO ALL EIGHT DELIVERABLES

`NORTH2:39` imposes a prior question on any proposal:

> **Is this rule already owned?** If yes, the proposal is not an amendment — it is a **restatement**, and every governing document in this set forbids restatement in identical terms: *"restating a rule creates a second owner of it, which the architecture forbids"* (`BLUEPRINT § 18`; `OHDB § 16.3`; `TRANSLATION1 § 7.3`; Experience Principle 6).

Run against the mission's eight deliverables:

| # | Deliverable | Already owned? | Owner / § |
|---|---|---|---|
| 1 | The philosophy of the house | **Yes — completely** | `BLUEPRINT § 1`, `§ 1.4`, `§ 1.5`, `§ 4`; `OHDB § 3`, `§ 14`, `§ 15`; `EXPLANG § 3`, `§ 3A` → § 3 |
| 2 | The purpose of every room | **Yes — three times over** | `BLUEPRINT § 4.1` (verbs), `§ 5.1` (the map); `OHDB § 13`; `EXPLANG §§ 5.1–5.9` → § 4 |
| 3 | **How the rooms connect** | 🔴 **NO — and the vocabulary is spent** | **Nobody** → **§ 5** |
| 4 | How households naturally move through the house | ⚠️ **Partly — the shape is owned, the graph is not** | `EXP ARCH § 10`; `EXPLANG` B/D; `UIA § 11` → **§ 6** |
| 5 | How the Orchard surrounds the home | **Yes — completely** | `BLUEPRINT § 6`, `§ 6.0`, `§ 6.1`, `§ 6.2` → § 7 |
| 6 | Where the Companion belongs | **Yes — completely** | `BLUEPRINT § 13` → § 8 |
| 7 | **Where future rooms naturally fit** | ⚠️ **Partly — the procedure is owned, the criterion and the position are not** | `BLUEPRINT § 18` (procedure only) → **§ 9** |
| 8 | What should never change as THA evolves | **Yes — completely** | `BLUEPRINT § 5.2`, `§ 14`; `OHDB § 14` → § 10 |

**Five of eight are owned with no remainder.** So §§ 3–4, 7–8 and 10 are **composition** — the house assembled from owners that each hold a fragment. **§§ 5, 6 and 9 are where this document reports something real**, and §§ 11–12 are what only a house-level read can see.

> **Why compose at all, if nothing is new?** For `EXPBLUE1`'s own reason (`BLUEPRINT § 1.3`): the canon *"was becoming a library rather than a blueprint — the vision reconstructible only by reading five documents in the right order."* **There are now seven, plus five room investigations filed in one day.** This document makes that one read. **It is a table of contents with reasoning, not a constitution** — and § 15 is the discipline that keeps it from becoming the eighth document the Blueprint warned about.

---

## 3. THE PHILOSOPHY OF THE HOUSE

**Owned in full.** Five principles, each a **composition of owned rules**, cited. **None is new.**

### P1 — The house is the product, and the sentence is the whole of it

`BLUEPRINT:25-27` — *"**THA is a warm, lived-in home where someone has already thought about dinner.** Not a dashboard reporting to you. Not an app competing for you. A *place* — one house, on one bright morning, with the orchard outside every window — that a household arrives in, moves through, and leaves calmer than it came."*

`BLUEPRINT:29` states its own status: *"That sentence **is** the whole product."*

### P2 — A modern home in an ancient orchard

`BLUEPRINT:43` — *"**The Healthy Apples is a modern home in an ancient orchard.**"* `:54` — *"**Modern intelligence, in the service of timeless household values.**"* `:56` — *"The *form* may be as modern as the work requires; the *feeling* it serves is timeless."*

The contrast is the meaning: the home is the intelligence, the orchard is what the intelligence is *for*.

### P3 — Technology should quietly disappear

`BLUEPRINT:62` — *"**Technology should quietly disappear. The household should always feel present.**"* `:64` — *"A screen that shows off its own cleverness… has made the tool the subject and pushed the family into the background. **In THA the family is always the subject.**"*

`:66` gives the five-word review form: *"**the household present, the technology gone.**"*

### P4 — One home, many places — and the four dials

`BLUEPRINT:158` — *"**A room is differentiated by purpose, light, material, and one sign of life — never by its own architecture, navigation, palette, or theme.**"* `:138` — the constitutional sentence quoted in § 1.

### P5 — The house is honest before it is anything else

`ARCHITECTURE_PRINCIPLES.md:74` — Principle 6, *"No fabricated knowledge — honest gaps over invented facts"* — whose rationale is three words: *"**Trust is the product**… This is non-negotiable"* (`:83`).

**This is the house's philosophy, not the platform's**, and § 11 is why it belongs here: **four of the five room blueprints found the same principle broken by four different mechanisms.** `PANTRY1 § 1.1` (~141 invented items), `COOK1 § 5.3` (*"Cooked N times"*), `PLAN1 § 7.2` (a fabricated `0/30`), `SHOP2 § 1.5` (*"Industrial"* from a null). **A principle broken once is a defect. A principle broken in four rooms by four mechanisms is a property of the house.**

> **The philosophy needs no addition. § 11 is the finding that it needs *enforcing at house scale*, because every one of its live breaches was invisible from inside the room that committed it.**

---

## 4. THE PURPOSE OF EVERY ROOM

**Owned three times over, and this document restates none of it.** The three registers, each complete on its own question:

| Register | What it holds | Owner |
|---|---|---|
| **The verb** | *"The Planner is the family's planning table"*, *"The Cookbook is the family's living cookbook"*, *"The Pantry is the household pantry"*, *"Shopping is preparing to leave the house"* | `BLUEPRINT § 4.1:146-150` |
| **The place identity** | Eleven rows: place in the house · orchard exposure · light character · ground posture · Living Detail | `BLUEPRINT § 5.1:169-181` |
| **The design reading** | Nine rooms: purpose · emotional tone · light · material emphasis · exposure · signature moment · things to avoid | `OHDB § 13` |
| **The rhythm** | The six beats, per room | `EXPLANG §§ 5.1–5.9` |

**And each room now has a one-read composition of all four**, filed the same day as this document: `PLAN1 § 4`, `COOK1 § 3`, `PANTRY1 § 3`, `SHOP2 § 3`. **The purpose of every room is the best-served deliverable in this mission**, and the correct action on it is to cite it.

### 4.1 What the map is, and the one thing it is not

`BLUEPRINT § 5.1` has exactly six columns: *Domain · Place in the house · Orchard exposure · Light character · Ground posture · Living Detail*.

> **There is no adjacency column, no neighbour column, no reached-from column.** The map is a **list of rooms, not a plan of a house** — every room fully specified in isolation, and no edge between any two of them. **A room, in this canon, is a monad.**

This is not a criticism of the map; it is the observation that makes § 5 a finding rather than an opinion. `TRANSLATION1:157` asserts the household *"walks between"* the rooms, across an entry whose nine facets are **all about what is true inside one room**. **The canon says the household walks between the rooms and never says between what and what.**

---

## 5. HOW THE ROOMS CONNECT — **THE ONE GENUINELY UNOWNED DELIVERABLE**

**This is the section reporting something the canon does not own.** It follows `PKR1` Risk R7's discipline and `PLAN1 § 6.5`'s precedent: the finding is **recorded and routed**, not solved here.

### 5.1 The hall is load-bearing, cited twice, and defined nowhere

**The evidence chain, verified in full:**

| # | The claim | Verified |
|---|---|---|
| 1 | `BLUEPRINT:224` names the exposure scale's floor **"E0 · Lit from the hall"** | ✅ |
| 2 | `BLUEPRINT:181` gives Admin the place identity **"The study off the hall"** | ✅ |
| 3 | `OHDB:302` — *"The operational study: the work of running the house, **kept off the main hall** (Experience Language § 5.9; Experience Blueprint § 5.1)"* | ✅ |
| 4 | **`THA_EXPERIENCE_LANGUAGE.md` contains the word *hall* zero times** — grep across the whole file | ✅ |
| 5 | **`BLUEPRINT § 5.1`'s only *hall* is the four words `OHDB` is citing it for** — *"the study off the hall"*, inside the Admin row's own name cell | ✅ |
| 6 | The **only** governing-directory document that *describes* a hall is `OLB:98` — *"the light of **a hallway you move through** rather than a room you dwell in"* | ✅ |
| 7 | …and `OLB:10` declares of itself: *"It is **not architecture**, not UI, and not a design system; it **invents nothing and legislates nothing**"* | ✅ |

> **So: a governed level of a governed scale (E0) and a governed room's place identity (Admin) both depend on a place that is cited to two documents which do not contain it, and described only by the one document that legislates nothing.**

**And the loop closes on a fourth document.** `docs/implementation/ux/HOUSE1_THE_ENTRANCE_HALL.md` is the only file in the repository **named** for the house's circulation — and it is about **Home**, it is **implementation**, and its own status line says it *"creates no rule and no second owner."*

> **THA has a document called *The Entrance Hall*. It is about a different room, it is not governing, and `TRANSLATION1` — which *is* governing — cites it 29 times, including as the source of its Layout, Spacing and Interaction facets** (`TRANSLATION1:148`, `:149`, `:152`, `:153`). **Either `HOUSE1` is an owner and its status line is wrong, or it is not and those citations point at nothing binding.** Recorded as an observation with citations, **not graded** — it is a governance question for the documents' owners, not an investigation's to settle.

### 5.2 The vocabulary is spent — every word, by a governing document

**This is why the gap has survived: naming it is blocked before owning it is.**

- **`doorway`** — `TRANSLATION1:148`: *"A doorway is the **one primary action** — exactly one per surface, always in the same place (Experience Architecture Principle 4; UIA § 5)."* **A doorway, in this canon, does not lead anywhere. It is a button.**
- **`corridor`** — `BLUEPRINT:156`: *"a house whose rooms are indistinguishable is **not a home but a corridor**."* `:424`: *"the room has no emotional job and will **read as a corridor**."* `TRANSLATION1:158`: *"A house whose rooms are indistinguishable **is a corridor**."* **Corridor is only ever the name of a failure.** The canon never once treats circulation as a real thing a house needs — which is precisely how E0 can be *"lit from the hall"* while the hall is not admitted to exist.
- **`threshold`** — `TRANSLATION1 § 4.1 THRESHOLDS` claims it for **the top of a single surface**: *"The threshold is the top of the surface: identity and orientation first, the one door next"* (`:148`). Eight of that entry's nine facets are about entering **one** room; the ninth (`:151`, motion) mentions moving between rooms and **routes the ownership away** — *"(Experience Language Principle D; UIA § 11)"*. **The entry named for the space between rooms explicitly declines to own it.** The word is further spent on Home (`BLUEPRINT:171` — *"The threshold and the heart"*) and on Shopping (`SHOP2 § 0.3` — *"Shopping is not the market. It is the threshold before it"*).
- **`hall`** — § 5.1.

> **`PLAN1 § 6.1` recorded the identical trap about *together*: *"the name for intra-household co-authorship is not available either. Any future workstream here must name the concept before it can own it."* **This is the second occurrence of that exact shape in the same week, in the same canon, and it is now a pattern: the concepts THA has not owned are exactly the concepts whose names it has already spent.**

### 5.3 The ownership partition is exhaustive on its own terms, and the topology falls through it

The canon *does* govern movement — twice, and cleanly:

`BLUEPRINT:134` — *"**The household moves through the house; it is never handed documents.** Moving between realms preserves the sense of one continuous place — walking from room to room, never loading unrelated files. Scrolling is walking further into the same room. ***(Owned by Experience Language Principles B and D.)***"*

Follow the citation. `EXPLANG:302` — *"Movement between realms preserves the sense of one continuous home; the person is carried from room to room, never handed a fresh, unrelated document. **(What a transition *is* — its duration, easing, and motion — is the UI Architecture's § 11; that it must *feel* like moving through one place is this principle's.)**"*

> **That parenthetical is a complete ownership partition of the transition, and it has exactly two halves: the *feeling* (`EXPLANG` B/D) and the *mechanics* (`UIA § 11`). Neither half is *which rooms connect*.** The partition is exhaustive on its own terms — and the topology falls straight through the gap between the two halves it names.

**`TRANSLATION1:151` repeats the partition and cites the same two owners.** `UIA § 11`, the cited mechanics owner, contains no adjacency rule of any kind.

### 5.4 The one adjacency the canon does govern — and it governs it as a panel

`UIA:132` — *"**Workspace surfaces** (the few realms whose work is genuinely two-sided, **such as planning against a cookbook**) may add **one** docked companion panel, provided through the one canonical panel pattern — never a per-surface invention."*

***"Planning against a cookbook"* is two rooms used at once — a genuine adjacency, named in governing architecture.** It is governed there **presentationally**: as permission to dock a panel. **Which realms are "genuinely two-sided" is never enumerated, and no document owns that determination.**

> **The canon's one acknowledgement that two rooms can be open at the same time is a parenthetical example inside a layout rule.**

### 5.5 What the platform does instead — reported, not fixed

Verified at `7d1dd2ce`. **The house's real circulation is built, works, and is described nowhere:**

| Connection | State | Source |
|---|---|---|
| Cookbook → Planner (*"add to week"*) | ✅ Well-built | `ORCH1 § 7.1` |
| Planner → Shopping (list generation) | ✅ *"the platform's strongest seam"* | `ORCH1 § 7.1`; `SHOP2 § 7.1` |
| **Cookbook → Shopping** | ✅ **and it is the Planner's wire, not its own** — *"The Cookbook does not have a shopping wire. It is a caller of the Planner's. **That is the correct shape — one owner, one funnel**"* | `SHOP2 § 7.2` |
| Pantry → Shopping | ✅ One direction | `SHOP2 § 7.3` |
| **Shopping → Pantry** | 🔴 **Refused deliberately** — *"`from-meals` **still never consults the pantry**"* | `SHOP1:419`; `SHOP2 § 7.3` |
| Planner → Diary (*what we ate*) | 🔴 `sourcePlannerEntryId` set to `null` in the one path that could close it | `ORCH1 § 7.1`, `§ 12.1` |
| Diary → Food Intelligence | 🔴 *"Does not exist."* `buildHouseholdHistory` never queries the diary | `ORCH1 § 7.1` |

> **`SHOP2 § 7.2` is the important row, and it is a compliance finding.** The Cookbook reaching Shopping *through the Planner's route* is **one owner, one funnel** — Principle 2 holding at a join, discovered by a room investigation that had no vocabulary to call it one. **The house's best-built connection is unnamed, and its owner does not know it owns a connection.**

### 5.6 What this section deliberately does not do

It **does not propose** a name for the circulation, an adjacency column on the map, a route graph, a hall row, a rule about which rooms touch, or an amendment to `E0`. Every one of those is a **design decision with an owner elsewhere** — `BLUEPRINT § 5.1` for the map, `BLUEPRINT § 6.2` for the scale, `EXP ARCH § 8` for navigation — and `ORCH1`, `PLAN1`, `HOME2` and `TIME2` all establish that the correct move on discovering an unowned seam is to **name it and route it**, not to fill it in an investigation.

**The seam is named: nothing owns the space between two rooms, and the four words that would name it are spent.** It is routed in § 15.

---

## 6. HOW HOUSEHOLDS NATURALLY MOVE THROUGH THE HOUSE

**Partly owned. The *shape* of movement is owned completely; the *graph* it moves over is owned by nobody.**

### 6.1 What is owned — and it is a lot

- **The journey's shape** — `EXP ARCH § 10:174-181`: *"**Journeys, not screens, are the unit of experience design**"*; *"**Every journey starts from Home and ends somewhere restful**"*; interruptible and resumable; no silent forks; *"Completion is acknowledged, quietly."*
- **The hub** — `EXP ARCH:111`: *"**Home is always reachable.** From anywhere in the product, one obvious, consistent gesture returns the person to Home. **Nobody is ever more than one step from the centre.**"* `:110`: *"Home reflects; it does not demand… **acting on something means moving to that thing's canonical place**."*
- **The rhythm** — `EXPLANG § 5`: the six beats, **fractal** — *"a whole session runs it once… and every surface inside that session runs it again in miniature"* (`:382`).
- **The feeling and the mechanics** — § 5.3.

**Together these mandate Home→realm and realm→Home.** `EXP ARCH:152` fixes the mental model as *"**Home → realm → thing**, not a browser trail"*.

> **The house is a hub and spokes, and no document says so.** Three separate rules imply it; none owns it. **Realm→realm is never addressed by any rule in any governing document** — while § 5.5 shows the platform's strongest seams are exactly realm→realm.

### 6.2 The rule in force that cannot be checked

`EXP ARCH:178` — *"**The shortest honest path wins.** No journey contains a step that exists for the product's benefit rather than the person's. **Every added tap must buy the person something.**"*

**The second and third sentences are checkable. The first is not.** *Shortest* is a claim about a graph; **no document defines the graph**; so the rule's headline clause is **in force and unverifiable**, and every review that has ever passed it has passed it on the two sentences underneath.

**This is not a defect in `EXP ARCH § 10`.** It is `PKCA:169`'s **Rule KC8** at experience scale — *"A trust rule that exists only as prose… is not yet a trust guarantee — it is a hope"* — and `UIA § 17`'s finding restated: *for as long as the register did not exist, that sentence was the only rule in the governing architecture with no owner and no way to check it* (`README.md:129`).

### 6.3 The rhythm defines both ends of its recursion and not the middle

`EXPLANG:382` — the rhythm is fractal: **the session runs it once, every surface runs it again.**

> **The canon defines the two ends of that recursion — the session and the surface — and never the middle: the act of leaving one room and entering the next.** The six beats have an **Arrival** and a **Completion**, and *"Completion — the person returns to Home, the calm centre, at rest"* (`ORCH1:88`, quoting `EXPLANG § 5`). **There is no beat for departure that is not a return to Home.** A household walking Cookbook → Planner → Shopping — the platform's strongest seam (§ 5.5) — runs three Arrivals and three Completions and passes through no governed transit at all.

**Recorded as an observation, not a proposed beat.** `ORCH1 § 2.3` established the discipline: *"**the Rhythm must not be stretched** over years to cover the gap — that would be the restatement `Blueprint § 18` forbids, and it would break the Rhythm's own meaning."* **The same applies sideways.** A seventh beat is not the answer, and this document does not propose one.

### 6.4 What the households actually do — recorded from the five siblings

The eleven-stage arc is `ORCH1 § 4`'s and is not restated. What a **house-level** read adds is that **the movement the canon governs least is the movement the household does most**: `ORCH1 § 7.1`'s *"the journey's spine is **`Cookbook → Planner → Shopping`**, and it is excellent"* — **three rooms, two joins, zero governing rules about either join.**

> **`ORCH1:437` closes with the sentence this section exists to point at: *"**It ends at the door. There is no return path**"* — and that is a statement about the house's shape, made by a document about the household's journey, that no document about the house can currently receive.**

---

## 7. HOW THE ORCHARD SURROUNDS THE HOME

**Owned completely.** Cited, not restated:

- **What it is** — `BLUEPRINT:191`: *"**The orchard represents life. Not silence. Not stillness. Not decoration.** Bright, growing, healthy, optimistic, welcoming… Never gloomy, misty, or melancholy."* *(Owned by `EXPLANG § 3A.3`.)*
- **Ancient** — `BLUEPRINT § 6.0:195`: *"mature, long-established, tended for generations — the timeless half of *'a modern home in an ancient orchard.'*"* `:199`: *"Its timelessness **is** its constancy: it was there before this visit and will be there after, **which is exactly why the household never has to tend it**."*
- **The five laws** — `BLUEPRINT § 6.1:207-211`: **one orchard**, one season, one owner; *"**the orchard is never wallpaper**"*; *"**the orchard never carries text**"*; *"**the orchard never animates**"*; it is a governed visual concern needing a named owner.
- **The scale** — `BLUEPRINT § 6.2:217`: *"**Orchard exposure is inversely proportional to functional density.**"* E3 (Home only) · E2 (browsing/reflective) · E1 (working) · E0 (*"lit from the hall"*).
- **The three riders** — `:228-230`: exposure is a **per-domain constant**; *"**Empty states may open the window one level, never two**"*; *"**Emotional surfaces may spend more window; functional surfaces may not.** A form never earns a view upgrade because it looked plain."*
- **Not walked into** — `BLUEPRINT:201`: *"**experienced through windows and subtle connections, never walked into**… Its permanence is felt precisely because it asks nothing and does nothing."*

### 7.1 The house-level observation: the scale is obeyed as a scale and broken as a floor

**The four room investigations each verified their own exposure level and each found the same violation, from a component none of them owns.**

`PLAN1 § 11.2`, `COOK1 § 12.2` and `EXPCOMP2` independently established: `client/src/components/layout/orchard-backdrop.tsx:18` renders a full-bleed orchard at **`opacity: 0.90` hardcoded**, `fixed inset-0`, mounted once in the protected shell — **every room** — and `client/src/components/ui/card.tsx:12` is `bg-card/82`, so **18% of the orchard bleeds up through every card in the product, behind the working text.**

> **`BLUEPRINT § 6.1`'s *"the orchard never carries text"* and § 16's *"**Wallpaper.** The orchard applied uniformly behind everything, at one strength, on one plane"* — both live, in every room at once.** `COOK1:516` states the house-level reading the room could only gesture at: *"**it is not a room defect. It is `card.tsx:12`, and it is everywhere.**"*

**And the scale's own token is dead.** `--orchard-opacity` is defined at `index.css:73` (light) and `:155` (dark) and **never consumed** — the backdrop hardcodes `0.90`, so **dark mode gets the 90% orchard it was designed not to have** (`PLAN1 § 11.2`; `COOK1 § 12.2`).

> **The exposure scale is a per-domain constant (`BLUEPRINT:228`) implemented as a product-wide literal.** Four rooms are assigned four different window sizes and all four render the same one. **No room investigation could have found that; each of them found its own third of it.**

*(Recorded, not fixed. `PLAN1 § 14.6` is right that the remedy is a **`UIA § 4` amendment** question — `--card: 0 0% 100%` — and *"should not be attempted as a Planner fix"*. It should not be attempted as a Cookbook fix either, and that is § 11's whole point.)*

---

## 8. WHERE THE COMPANION BELONGS

**Owned completely** by `BLUEPRINT § 13:323-335`, and cited by all five siblings rather than restated. It is quoted here once and legislated not at all:

- **Not a room** — *"The Companion is not a room. It is **the person in the house** — the knowledgeable friend at the kitchen counter: always in the same place, comfortable in every room, **never following the household around the house talking**."*
- **One presence, one fixed chair** — *"One Companion mark, in the same position in every room… It is **in** the rooms, never a room; its panel is foreground and carries the house's warmth, **not a view of its own**."*
- **A beat after you** — *"In every room, the Companion joins **after** the person has arrived — manners rendered as motion… **no pulsing, no typing theatrics, no simulated mood, no face**."*
- **Its conduct** — `EXP ARCH § 11`. **Its feeling** — `EXPLANG` Principle 7, § 5.7. **Its knowledge and voice** — `INT17`, `PKR2 § 12`. **Its volume** — `NOTICE_ENGINE § 6:138`: *"**Silence is a first-class outcome.**"*

### 8.1 The Companion is the one inhabitant of the space this document says has no name

**This is the house-level observation, and it is the only thing § 8 adds.**

`BLUEPRINT:325` says the Companion is *"comfortable in **every room**"* and *"never following the household around the house talking"*. `BLUEPRINT:333` says *"**One presence, one fixed chair**"* — one position, in every room.

> **The Companion is defined as the thing that is in every room and is not any of them. It is the only entity in the canon whose place is described by its relationship to *all* the rooms at once — and it is described entirely without the vocabulary § 5 says does not exist.** `BLUEPRINT § 13` succeeds precisely because it never needs to say where the Companion *goes*: it goes nowhere. It is already there.

**The four rooms' live states, from the siblings, compose into one finding the rooms could not make:**

| Room | The Companion's chair | Source |
|---|---|---|
| **Shopping** | ✅ **In the right chair** — `AmbientIntelligence surfaceKey="shopping"`, titled *"Worth a look before you shop"* — *"the only title in the house with a **deadline built into its grammar**"* | `SHOP2 § 8.1` |
| **Planner** | 🔴 **Two ungoverned channels stacked** — *"a room fixture wearing the Companion's name"*; `NOTICE_ENGINE:250` — *"**Any second ambient-notice channel**… **stop**"* | `PLAN1 § 7.1` |
| **Cookbook** | ⚠️ **No chair at all** — and *"the **compliant** state, not the broken one… the only room that can adopt the Companion Card **correctly the first time**, with nothing to delete first"* | `COOK1 § 9.1` |
| **Pantry** | ⚠️ One micro-insight, *"chosen by the day of the month"*, *"owned by no intelligence system"* | `PANTRY1 § 4.1` |

> **One presence, one fixed chair — and four rooms with four different pieces of furniture in it.** `COOK1 § 15.6` already drew the only conclusion available: retire the Planner's two channels **before** a third room acquires one, *"so the Cookbook inherits the converged pattern rather than a fourth variant of it."* **That is a sequencing decision across four rooms, and no room can make it.**

### 8.2 The question all four rooms left open, and this document also leaves open

`PLAN1 § 7.3` and `COOK1 § 9.3` both recorded: **no governing document says what the friend at the counter does when two people are in the room.** `SHOP2 § 8.3` found Shopping has answered it in code — `addedByUserId`, *"Added by Dad"* — and `PLAN1 § 6` found the Planner, *the room whose entire purpose is deciding together*, has not.

**This document adds nothing to that** — it is `PLAN1 § 6`'s co-authorship seam, and it routes there unchanged (`PLAN1 § 14.4`). Recorded so the house-level read does not appear to have missed it.

---

## 9. WHERE FUTURE ROOMS NATURALLY FIT

**Partly owned. The *procedure* is owned; the *criterion* and the *position* are not — and the house's own gate rejects a new room on sight.**

### 9.1 What is owned: the procedure, and only the procedure

`BLUEPRINT:467` — *"**Change enters by governance, never by shipping.** **A new room in the map (§ 5.1)**, a change to a domain's exposure level, a new or retired Living Detail, or a new spatial anti-pattern is admitted the way any governing rule is — **named, checked for conflict against this document and its governors, and added deliberately.** A surface that quietly assumes one is a defect regardless of its quality."*

`OHDB:405` echoes it as a check: *"If a **NEW room**: has its reading been added by governance, **not improvised**?"*

**Both are procedures, and identical to the procedure for a Living Detail or an anti-pattern.** Neither says **what makes something deserve to be a room** rather than a section of an existing room, a dialog, or a note. *"Checked for conflict"* is the only substantive test — **and adjacency is not among the things it can conflict with, there being no adjacency rule to conflict with** (§ 5).

### 9.2 The Experience Test fails a new room by existing

`BLUEPRINT:416-419` — the first and bluntest gate in the house:

> *"**1. Which room of the home is this?** Name it against the map (§ 5.1). **If the screen belongs to no room** — or seems to belong to several — **its place has not been decided, and a placeless surface cannot be one home** (§ 4)."*

**Read against a genuinely new room, this is a closed-map conformance test.** Its failure mode for a *new room* is **identical** to its failure mode for a *defective screen*: **belongs to no room → STOP.** The Test cannot distinguish *"this surface was never designed"* from *"this room is new and § 18 has not run yet"* — and it does not reference § 18's escape.

**`BLUEPRINT:433` states the Test's own purpose in a way that makes the gap visible:** *"The Checks verify a designed room was built correctly; **the Test verifies the room was designed at all.**"* **A new room is exactly the case where "designed at all" is true and "on the map" is false**, and the Test collapses the two.

**Q3 of the same test is the nearest thing to a criterion in the whole canon** (`:426-430`): *"**What is the ONE thing this room helps them do?**… **If there are two, the room is doing two rooms' work**; if there are none, it is decoration."* **It is scoped to screens**, routes its authority to `EXP ARCH` Principle 4, and yields **no rule about where the second room would go.**

### 9.3 The only statement of where a new room attaches is a parenthetical

`BLUEPRINT:132` — *"**Home is a place, not a dashboard.** The household *arrives*; the workspace is merely where they land. The dashboard — and **every workspace added after it** — is **a room reached from within the home**, never the home itself. *(Feeling owned by Experience Language Principle G; **this blueprint adds the spatial consequence: as the house grows, new rooms are added — the home is never renamed**.)*"*

> ***"A room reached from within the home"* is the only statement in the canon of where a new room attaches, and *"as the house grows, new rooms are added"* is the only forward-looking statement about growth topology.** Both are delivered **as a parenthetical aside inside a rule about Home not being a dashboard**, neither is framed as a law, and **neither is referenced by § 18's admission rule or by the § 15.3 Test.** They are a hint, not an owner.

### 9.4 The house has already met this, once, and `ORCH1` recorded it

**Community is the live case**, and `ORCH1 § 5` Stage 10 found all three halves of the gap:

1. `ORCH1:347` — *"**Community has no room in the Blueprint § 5.1 map.** Eleven rooms; none is Community. `HOME1 § 8.2` found `/dashboard` in exactly this state and called it a **placeless surface** — *'a placeless surface cannot be one home'*."*
2. `ORCH1:348` — *"**It is the only domain that could be born correct.** It can be given a place, a verb, and a Household Time contract **before** it is built — the only stage in this journey where doing it right costs **nothing** instead of a migration."*
3. `ORCH1:591` — *"**Not architecture yet — a `Blueprint § 5.1` row, when Community is built.** It must pass the § 15.3 Experience Test… **before** any code. **The cheapest governance act available, and its window closes the day the lane opens.**"*

**And `CPuBA` Domain 21 already asserts the lane stays empty** (`publication-register.ts:1240-1267`).

> **`ORCH1` routed Community to a gate that, per § 9.2, would reject it.** That is not a contradiction in `ORCH1` — it is the § 18 / § 15.3 seam, showing up the first time anyone tried to walk a new room through it. **The house has a growth procedure, no growth criterion, and a gate that says stop.**

### 9.5 What this section deliberately does not do

It **does not propose** an admission criterion, a Community row, a position in the navigation, an amendment to § 15.3, or a rule for what earns roomhood. **`ORCH1 § 13` rec 3 already owns the Community routing and this document does not re-route it.** The gap is named and routed in § 15.

---

## 10. WHAT SHOULD NEVER CHANGE AS THA EVOLVES

**Owned completely, in two places, and this document restates neither.**

### 10.1 The per-room invariants

`BLUEPRINT § 5.2:185` — *"For every room, without exception, these are constant and may never vary per domain: **the shell** (§ 14) · the canonical component owners · the semantic token system and both palettes · the type scale and its three voices · the motion vocabulary · the state law (loading / empty / error) · **the one Companion** (§ 13) · the accessibility floors · the two-second rule. **A room that needs to break any of these to feel like itself has not been designed yet.**"*

### 10.2 The walls

`BLUEPRINT § 14:344` — *"**the walls are what make many places one home.** Every room in § 5 is possible *because* the shell is untouchable — **the moment a room modifies the frame to feel more like itself, the house has lost a wall, and every other room pays for it.**"* Its hardest clause, at `:342`: *"**emotional experimentation earns no exception to the shell's constancy**."*

### 10.3 The doctrine

`OHDB § 14` — *"**Timeless, not fashionable.**"* `OHDB:341` — *"**Timeless is not featureless.** New capability enters constantly. **What is timeless is the *design language it enters through*** — the same walls, light, materials, and restraint. **A new room is furnished from the same vocabulary as every old one.**"*

### 10.4 The star

`BLUEPRINT § 17:454` — *"**The Healthy Apples is a modern home in an ancient orchard, where technology quietly supports timeless family life.**"* `:458` — *"**A household should end every visit having thought about food a little less, trusted it a little more, and noticed the product not at all.**"* `:460` — *"When restraint and expression tie, choose restraint. **When the product and the household tie, there is no tie.**"*

### 10.5 The house-level observation

**The four constants above are the best-obeyed law in the product, and the siblings prove it from four directions.** `PLAN1 § 12.1` found the Planner already the single solid ground plane the canon asks for *"and no document knows it"*. `COOK1 § 12.3` found the Cookbook's discrete cards canonically correct — **the opposite posture to the Planner's, and both obeying**. `SHOP2 § 9.3` found the crossing-off *"met to the word"* — *"the room could not celebrate an item if it wanted to"*. `PANTRY1 § 11.3` found the plant-diversity scoreboard exists in the product **and is not in the Pantry**.

> **Four rooms, four different correct answers, one house — and every one of them arrived at without a single room breaking a shared constant.** `BLUEPRINT § 5.2` is not aspirational. **It is being obeyed, and the rooms that obey it did not need to be told.**

**So the honest answer to *"what should never change"* is: nothing in § 10 needs defending from the rooms. § 11 is what it needs defending from.**

---

## 11. WHAT ONLY THE HOUSE CAN SEE

**This is the section that justifies a house-level read, and it is written entirely out of the five siblings' own findings.**

**Five room blueprints ran independently, against the same commit, in one day. Each obeyed `NORTH2`'s gate. Each found six-to-eight of its deliverables already owned. And each found, at the edge of its own room, something it could not resolve from inside.**

### 11.1 The sentence a room wrote when it hit the ceiling

`SHOP2:351` — on the Pantry↔Shopping generation seam:

> *"**The two rooms' defects compose into something worse than either.** Recorded here because **neither investigation could see it alone**: **Shopping must not read the Pantry until the Pantry is true.**"*

**The compound**: `SHOP1:419` refused to deduct the pantry at list-generation time and `SHOP1:129-131` refused to wire `cupboardQuantity` because *"deriving it here would give one fact two owners"* — **Principle 2 held under pressure by an implementation that wanted the feature** (`SHOP2 § 7.3`). Meanwhile `PANTRY1 § 1.1` found **~141 pantry items are fabricated**.

> **A generation path that deducted today's pantry would silently remove real groceries from a real list on the strength of a hardcoded array.** Neither room contains that finding. **The join does.**

### 11.2 The four shapes that presented as room defects and are not

| Shape | Where it presents | What it actually is |
|---|---|---|
| **The orchard behind the text** | `PLAN1 § 11.2` (Planner) · `COOK1 § 12.2` (Cookbook) · `EXPCOMP2` (Home) | **`card.tsx:12` + `orchard-backdrop.tsx:18`.** *"It is not a room defect. It is `card.tsx:12`, and it is everywhere"* (`COOK1:516`). A **`UIA § 4` amendment**, not three room fixes. § 7.1 |
| **The fabricated zero** | `PLAN1 § 7.2` (Planner `0/30`) · `EXPCOMP2` (Home *"0 of 30 plants"*) | **The same `?? 0` coercion, on the same metric, in two rooms**, where the server *deliberately returns `null`* for no validated data. `PLAN1 § 14.1`: *"the honest version is **one workstream fixing both**, since a third instance is likelier than not."* And `COOK1 § 12.4` found **the same coercion written correctly** one room over |
| **The last inch** | `PANTRY1` (`isDefault`) · `SHOP2` (`confidenceLevel`) · `SHOP2` (`headerStatusText`) | *"**THA does not have a confidence problem. It has a *last-inch* problem.** The gates are real, the fields are computed, the values reach the browser — and the sentence that would tell the household is dropped at the final step, **three times, in three rooms, by three different mechanisms**"* (`SHOP2 § 6.2`) |
| **The private book** | `COOK1 § 1.1` (`meals.userId`) → `SHOP2 § 7.2` (a member can't list from a partner's recipe) → `PLAN1 § 6.4.1` (a member can't plan one) | **One line of scope, three rooms.** *"Invisible in every single-member household — which is every household in testing"* (`PLAN1:218`) |

> **Four shapes. Eleven presentations. Zero of them visible from inside the room that reports them.** Each room correctly diagnosed its own third and correctly declined to fix a shared component. **The diagnosis is complete and the remedy has no owner, because the remedy is not in any room.**

### 11.3 The recurring meta-shape, now found six times

`ORCH1:57` named it after three occurrences: *"**The pieces were designed, typed, documented — and never connected.** This is the third consecutive investigation to reach that shape (TIME1: *the competence is present, the authority is absent*; TIME2: *each domain reasoned correctly in isolation*). **It is now the most reliable signal the architecture has.**"*

**Three more landed the same day:**

- `COOK1:109` — *"**The Experience canon and the WS10 engine independently wrote the same rule in the same words, eighteen months apart, and have never been introduced.**"*
- `SHOP2:235` — `SHOP1`'s string-validation rule is `OLB:100`'s Companion *"expressed as a string-validation rule, written independently, three days before the Living Book gave the friend those words. **It is the fourth time this audit series has found the canon and the engine writing the same law in the same voice without ever having been introduced.**"*
- `PANTRY1 § 5.1` — the endpoint's own comment states `ARCHITECTURE_PRINCIPLES.md:44`'s progressive-enrichment contract correctly, unprompted.

> **THA's canon and THA's engineers keep independently deriving the same laws and never meeting.** `COOK1:47` gives the mechanism its plainest form, about two documents **in the same directory**: *"The Experience canon calls the room a family's; the Capability Card records that no family exists in it. Both are current, both are in `docs/architecture/`… **The gap is not a discovery. It is a directory that does not read itself.**"*

**This is the house's actual condition, and it is not a shortage of law.** `NORTH2:229` said it first and this document confirms it at house scale: **the architecture *"needs obeying"*, not extending.**

### 11.4 What the joins say about this document's own subject

**§ 11 is § 5 in a different register.** The four shapes in § 11.2 are all defects **of the space between rooms**: a shared component under every room, a coercion in two rooms, a signal dropped in three, a scope reaching through three. **They are unownable today for exactly the reason § 5 gives — the canon has no place to put a fact about more than one room at once.**

> **The map is a list of rooms with no edges (§ 4.1). The defects live on the edges. That is not a coincidence — it is the same finding, seen from the platform instead of from the canon.**

---

## 12. THE PERIMETER — THE HOUSE'S THREE DOORS

**Three investigations independently reached a boundary of the house. Each described it as a door. Each recorded it as a boundary rather than a gap. None of them is owned, and nowhere is the house's perimeter stated as one thing.**

| Door | The finding | Source |
|---|---|---|
| **The front door** — acquisition | *"**THA's world begins at the door.** The Orchard House has **no marketing forecourt**, and inventing an acquisition domain to fill this stage would be building a room the house does not have."* **Recorded as a boundary, not a gap** | `ORCH1:181`, `:601` |
| **The shop door** — commerce | *"**Shopping is not the market. It is the threshold before it.**"* *"**The house ends at the door. The money is spent outside it — and the code brought the shop indoors without anyone writing down how that should feel.**"* | `SHOP2 § 0.3`, `§ 5.1` |
| **The kitchen door** — the meal | *"**THA accompanies the household to the kitchen door. It does not follow them in.** That is not a gap to close with surveillance; **it is the boundary that makes THA trustworthy in a family's home.**"* | `ORCH1 § 1.3`, `§ 3` |

### 12.1 The three doors are one shape

**Each is a place where THA's world stops. Each stops for a different and good reason. And in all three cases the canon's silence is the *correct* answer, arrived at independently.**

- **The front door** — *"There is no honest intelligence about a household THA has never met"* (`ORCH1:183`).
- **The kitchen door** — *"the alternative to a horizon is surveillance of a family's table"* (`ORCH1:647`). `EXP ARCH § 17.9`'s celebration list *"stops exactly where THA's sight stops"* (`ORCH1:39`).
- **The shop door** — the canon mentions money **four times and every one is a prohibition** (`SHOP2 § 5.1`, verified across all seven Experience documents: *"**Zero hits**"* for `price`, `commerce`, `retailer`, `checkout`, `revenue`).

> **THA's emotional constitution, its blueprint, its design language, its lived account and its behavioural law — five documents, ~2,600 lines — say nothing whatever about how it should feel to spend money, and mention money only to forbid being sold to** (`SHOP2:204`). **Meanwhile `POST /api/basket/checkout` is live** (`routes.ts:829`).

### 12.2 The one asymmetry worth recording

**Two of the three doors are boundaries the canon chose. The third is one the code walked through while the canon wasn't looking.**

The front door and the kitchen door are **silences that are correct** — `ORCH1` argues both at length and this document endorses neither addition. **The shop door is different**: the house's metaphor says *"Shopping is preparing to leave the house"* (`BLUEPRINT:149`) — **the shop is off-stage, and there is no chapter in the Living Book in which the household is at the market** (`SHOP2 § 0.3`) — and the platform runs nine retailers, real prices, and a checkout **inside** it.

> **`SHOP2 § 5.2` states the precise gap and this document does not widen it:** *"A Capability Card governs what the **Companion** may say about retailers. **No document governs what it should *feel like* to be a household spending money inside a house whose entire emotional constitution was written about calm, care, and having nothing sold to you.**"*
>
> **It is not a defect in any document.** Each of the seven is doing its stated job. **It is a question no one has been asked** — and it sits exactly where `BLUEPRINT § 4.1`'s metaphor runs out.

**Recorded and routed (§ 15.5), not answered.** Answering it would be creating governing law inside an investigation.

---

## 13. ANTI-PATTERNS

**Every one is already forbidden by a rule with an owner.** `BLUEPRINT § 16` owns the **spatial** anti-patterns — *the theme park · the costume · wallpaper · all view, no room · the rendered world · metaphor taxing function · the second sun · charm by the batch* — and `EXPLANG § 7` owns the general ones. **Neither is restated.**

This document names **no new anti-pattern**, and records only the two the *house* is most likely to enter — both of them consequences of § 5 rather than of any room:

### 13.1 The corridor that gets built because it has no name

`BLUEPRINT:156` and `TRANSLATION1:158` use *corridor* only as a **failure of differentiation** — rooms so alike the house is a corridor. **That is a real anti-pattern and it stands.**

**The hazard § 5 creates is its mirror**: because the canon has no *legitimate* word for circulation, any future workstream that needs one will reach for the nearest available noun — and every one of them is spent (§ 5.2). **The likeliest outcome is not a bad corridor. It is a second Notice Engine's worth of improvised vocabulary**, each surface coining its own word for the same unowned thing.

**Entry route: this document's own § 5, read as a licence.** `NOTICE_ENGINE:250`'s test is the right one to apply sideways: *"**Any second ambient-notice channel**… **stop.** That is a second Notice Engine wearing different clothes."* **A second word for the space between rooms is a second owner of it, before it has a first.**

### 13.2 The house-level fix attempted as a room-level fix

**This is the anti-pattern § 11 exists to prevent, and three siblings already stepped around it.**

`PLAN1 § 14.6` — the orchard bleed *"is a **`UIA § 4` amendment** question… **not a Planner question, and it should not be attempted as a Planner fix**."* `COOK1 § 15.1` — *"Do this first and alone."* `SHOP2 § 5.4` — SHOP1 named its own successor rather than reaching past its scope.

**Entry route: a well-meaning conformance pass on one room.** `PLAN1 § 14.2` records the exact trap already sprung once: *"**Note the trap `WX13` fell into:** it fixed this by *compressing* the panel, and the compressed panel is now item 5. **The move is removal, not compression.**"*

> **And its opposite is the more dangerous half**: `PLAN1 § 10.5`, `COOK1 § 11.6` and `NORTH1:79-80` all name it — *"**One cold plane breaks the room**, and it breaks it more than any other single error, because **coldness is the one failure the canon calls unrecoverable**"* (`EXPLANG § 3A.4`: *"**Calm must never become lifeless**"*). **Removing the opacity crutch without replacing the warmth in the values is a worse defect than the crutch.** The house must get clearer without getting colder — **in all four rooms at once, or in none.**

---

## 14. WHAT THIS DOCUMENT DID NOT DO

Stated explicitly, because the mission's constraints were explicit:

- **No screens designed.** No layout, no wireframe, no component, no ASCII sketch, no plate. §§ 3–13 are principles and citations only.
- **Nothing implemented.** No code, no schema, no migration, no route, no token, no colour, no value of any kind.
- **No architecture modified.** All seven governing Experience documents are **byte-untouched**. `docs/architecture/README.md` is untouched — this is an investigation and is not indexed as governing (`README.md:4`).
- **No rule created.** Applying `NORTH2`'s gate to my own output: every principle in §§ 3–13 traces to an owner. **If any statement here is found to duplicate a rule owned elsewhere, the statement here is the defect** (`BLUEPRINT § 18`'s yield clause, applied to this file).
- **The § 5, § 6 and § 9 gaps not filled.** Named and routed, per `PKR1` R7 and `PLAN1 § 6.5`. **No name proposed for the circulation, no hall row, no adjacency column, no route graph, no admission criterion, no seventh beat.**
- **Nothing renamed.** The rooms keep their names (`BLUEPRINT § 5.1`); the house keeps its vision (`§ 1.4`).
- **The § 11 defects not fixed**, and **none of them re-diagnosed** — every one is the siblings' finding, cited to the sibling.
- **`ORCH1`'s routings not re-routed.** Community (§ 9.4), co-authorship (§ 8.2) and the outcome boundary all remain where `ORCH1` and `PLAN1` put them.
- **The `HOUSE1`/`TRANSLATION1` citation question not settled** (§ 5.1) — recorded with citations, explicitly not graded.

**Gates re-run:** `.engineering/scripts/repo-structure-verify.sh` — `docs/investigations/ has no loose files` **PASS**. *(The pre-existing, unrelated FAIL on `.glibcheck.txt` / `.libdirs_uxhome.txt` at root persists — untracked before this session, noted also by `ORCH1`, `PLAN1` and `COOK1`.)*

---

## 15. RECOMMENDED FOLLOW-ON WORK

**Recommended, not created.** Ordered by value. **The first is a broken citation between two governing documents and costs nothing.**

### 15.1 Resolve the hall — **do this first; it is not a design question**

**Today, `OHDB:302` cites `Experience Language § 5.9` and `Experience Blueprint § 5.1` for *"the main hall"*, and neither contains it** (§ 5.1). **That is a defect in governing architecture right now**, independent of everything else in this document. Two ways out, and the owners must pick one:

- **(a) Admit the hall** — a `BLUEPRINT § 5` sentence or a `§ 5.1` row. **E0 and the Admin row already depend on it**, so this is recognising a place the canon already uses.
- **(b) Retire the word** — rename `E0` and correct `BLUEPRINT:181` and `OHDB:302`.

**Either is cheap. Neither is optional, because the citation is broken either way.** `BLUEPRINT § 18`'s own yield clause governs: *"If any statement in this blueprint is found to duplicate a rule owned elsewhere, the statement here is the defect and is corrected to a citation."* **A citation to a rule that does not exist is the same class of defect and has no clause yet.**

### 15.2 Populate or retire the doorway category — **one sentence, in its owner**

`BLUEPRINT:138` names *"a room, **a doorway**, or a note"* and defines two of three (§ 1, finding 3). **Either say what a doorway connects, or remove the noun** — and if it is said, it must be said **without the word *doorway***, which `TRANSLATION1:148` already spends on the one primary action (§ 5.2). **This is the naming trap, and § 15.4 is where it resolves.**

### 15.3 The room-admission criterion — **an amendment to `BLUEPRINT § 18`, not a new document**

§ 9's gap, and it is **live**: `ORCH1 § 13` rec 3 routed Community to a gate (`§ 15.3` Q1) that would reject it (§ 9.2). Recommended shape: **§ 18 gains the criterion it lacks, and § 15.3 Q1 gains the escape § 18 already implies** — *"if this is a new room, § 18 applies"*. **Not a new principle, not a new document.** `ORCH1:591` already fixed the deadline: *"**the cheapest governance act available, and its window closes the day the lane opens.**"*

### 15.4 Name and route the circulation — **the most valuable item here, and the only one that is not a fix**

§ 5. **Nothing owns the space between two rooms**, and it is depended on by three governed things: **E0** (*"lit from the hall"*), **`BLUEPRINT:138`**'s doorway category, and **`EXP ARCH:178`**'s *"shortest honest path"* (unverifiable without a graph, § 6.2).

Recommended shape: an investigation that **(a) names the concept** — *doorway*, *corridor*, *threshold* and *hall* are **all spent** (§ 5.2), and `PLAN1 § 6.1` established that **naming precedes owning**; **(b)** decides whether the house is **hub-and-spoke by law or merely by habit** (§ 6.1 — three rules imply it, none owns it); **(c)** tests `UIA:132`'s *"planning against a cookbook"* — the canon's one acknowledged adjacency — as the existing precedent (§ 5.4); **(d)** records `SHOP2 § 7.2`'s *"one owner, one funnel"* as the house's best-built connection, currently unnamed (§ 5.5).

**Do not skip (a).** `EXP ARCH:211` binds it, and **every obvious name is already taken by a governing document.**

### 15.5 The shop door — **route to `ORCH1`'s existing candidate, do not open a new one**

§ 12. `SHOP2 § 5.1`'s question is real and unowned. **`ORCH1 § 13` rec 1 already recommends *"an amendment to the Experience Architecture (a § 12 Trust extension), **not a new document**"*** for the household-outcome boundary, on the explicit grounds that *"the canon is already seven documents deep and `Blueprint § 1.3` warns it *'was becoming a library rather than a blueprint'*."* **The house's perimeter belongs with it.** Three doors, one amendment, no eighth document.

### 15.6 The house-level fixes the rooms correctly declined — **workstreams, not architecture**

Every one is diagnosed, cited, and ownerless because it belongs to no room (§ 11.2):

1. **`card.tsx:12` + `orchard-backdrop.tsx:18`** — one `UIA § 4` amendment closing `BLUEPRINT § 6.1`'s *"the orchard never carries text"* in **three rooms at once**. **`--orchard-opacity` is defined and never consumed** — the cheap, safe half (`PLAN1 § 11.2`). **Read § 13.2 first**: this is the item most likely to cause the unrecoverable failure.
2. **The fabricated zero** — `PLAN1 § 14.1`'s *"one workstream fixing both"* (Planner + Home), *"since a third instance is likelier than not."*
3. **The last inch** — three fields, three rooms, one shape (`SHOP2 § 6.2`).
4. **The Companion's chair, sequenced across four rooms** — `NTC-P2` retires the Planner's two ungoverned channels **before** the Cookbook offers a first one (`COOK1 § 15.6`; `PLAN1 § 14.3`).

### 15.7 This document's promotion — ❌ **do not promote**

**Same reasoning as `ORCH1 § 13` rec 5, and it applies harder here.**

This is **a snapshot of a house mid-repair**, and §§ 11–12 — its most valuable content — are **entirely composed of five investigations' findings, which will be stale the day any of them is actioned**. `ORCH1:592` settled the precedent: *"**The journey is not a rule — it is a reading.**"* **The house is not a rule either — it is already `BLUEPRINT`, and `BLUEPRINT` is not missing.**

> **The disciplined answer to *"what governing architecture emerges from this?"* is: one broken citation corrected, one category populated or retired, one § 18 amendment, one naming investigation, and one door added to an amendment `ORCH1` already recommended — and no new documents.**
>
> **`NORTH2:229` was right and this document is its confirmation at house scale: the architecture needs obeying, not extending. It is missing four words and one edge, and it has seven documents.**

---

## 16. THE ONE THING TO REMEMBER

> **The Orchard House is one home in an ancient orchard, on one bright morning, where technology quietly disappears and the family is always the subject. It has eleven rooms, each fully specified — a purpose, a verb, an exposure, a light, a ground, one sign of life, and a rhythm — and a Companion who is in every one of them and is none of them. The walls never change. The orchard never moves. All of that is written, owned exactly once, and being obeyed better than any document knows.**
>
> **What is not written is the space between the rooms. The map is a list with no edges. E0 is *"lit from the hall"* and there is no hall. The constitutional sentence says every surface is *"a room, a doorway, or a note"* and never says what a doorway connects — because *doorway* already means the one primary action, *corridor* is only ever an insult, *threshold* never leaves the room, and the only document named for the entrance hall is about Home and legislates nothing. *The shortest honest path wins* is in force and cannot be checked, because nobody has drawn the path.**
>
> **And that is exactly where the defects live: an orchard bleeding through every card from a component no room owns; a zero fabricated in two rooms from the same coercion; an honest signal dropped at the last inch in three; a private book reaching through three rooms on one line of scope; a pantry that would delete a real grocery from a real list if the room next door ever asked it a question. Five rooms found their own third of each and correctly declined to fix the rest. Not one of them could see the whole, and one of them said so: *neither investigation could see it alone.***
>
> **The work is not to define this house. It is to notice that the canon and the engineers have now independently written the same law, in the same words, without ever being introduced — six times — and that a directory which does not read itself will keep discovering its own rules forever. Fix the citation that points at a room nobody built. Name the space between the rooms before something else names it badly. Then go and clear the table, hand the family back their book, tell the Pantry the truth, and put the list back by the door.**

---

*An investigation — a point-in-time reading of the whole Orchard House against the governing Experience architecture and the five room and journey blueprints filed the same day. It is history the moment it is written and is never to be read as law (`docs/architecture/README.md:4`; `PKR1 § 4.4`). Subordinate to the Experience Architecture, which prevails in any conflict. Where this document and any governing document disagree, **this document is the defect**.*
*Rollback: this document is new and uncommitted — to revert entirely, delete this file. Rollback tag for the `HOUSE4` workstream: `rollback/HOUSE4-orchard-house-blueprint-20260716` → `7d1dd2ce`.*
