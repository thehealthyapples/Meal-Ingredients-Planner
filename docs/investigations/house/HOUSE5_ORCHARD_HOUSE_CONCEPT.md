# HOUSE5 — The Orchard House Concept

## The drawing set, and why it is a drawing set

**Workstream:** `HOUSE5_Orchard_House_Concept`
**Date:** 2026-07-16
**Rollback:** `rollback/HOUSE5-orchard-house-concept-20260716` → `7d1dd2ce`

> **Status.** This is an **investigation** — point-in-time analysis and history. It is **not** governing architecture, **not** a specification, **not** implementation, **not** production UI. It **creates no rule and no second owner**, sets **no colour, token, size, duration or value**, and every attribute it draws is cited to the document that owns it. Where this file or its board appears to state a law, the citation is the law and the drawing is commentary.
>
> **The deliverable is the board, not this file.** This document is the concept's written half: the deviations, the reasoning behind the drawing decisions, and the observations. The board itself is at `docs/ui-audit/house5-orchard-house/HOUSE5_orchard_house_concept.html`.

**The board:** [`docs/ui-audit/house5-orchard-house/HOUSE5_orchard_house_concept.html`](../../ui-audit/house5-orchard-house/HOUSE5_orchard_house_concept.html) — ten sheets, `A-000` → `A-900`.
**Published (private):** https://claude.ai/code/artifact/94429b72-6dd9-45bb-91d1-8ffd972fab25

---

## 0. THE MISSION, AND THE DEVIATIONS REPORTED

The mission: *"Using the governing Experience Architecture together with HOUSE4, create the visual concept for the Orchard House… Produce an architect's presentation board rather than application screens… The objective is to create the definitive visual North Star for the THA experience."*

### 0.1 Filing — no deviation, for the first time in six missions

The mission said *"store the concept under `docs/investigations/ux/`"*. **That path is correct as given** — it is the Experience workstream, where `PLAN1`, `COOK1`, `PANTRY1`, `SHOP2`, `HOUSE4`, `ORCH1`, `NORTH2` and `EXP5` all live, and it violates nothing. **This is the first mission in the series whose filing instruction needed no correction.** Recorded because the five before it all did.

**One filing note, not a deviation.** The *concept document* is filed exactly as instructed. The *board* is an HTML artefact and is filed at `docs/ui-audit/house5-orchard-house/`, following `DESIGN1`'s precedent (`docs/ui-audit/design1-home/DESIGN1_home_visual_design.html`) — `docs/investigations/` holds point-in-time **analysis**, and `docs/ui-audit/` is where this repository already keeps visual artefacts. The two are linked in both directions.

### 0.2 The ID deviation — `HOUSE1`, `HOUSE2`, `HOUSE3` and `HOUSE4` are all taken

| ID | Taken by |
|---|---|
| `HOUSE1` | `docs/implementation/ux/HOUSE1_THE_ENTRANCE_HALL.md` — the Home design specification (2026-07-15) |
| `HOUSE2` | `REPOSITORY_CONVENTIONS.md:3` — *"Established under `HOUSE2` (2026-07-10)"* |
| `HOUSE3` | The repository structure / document filing workstream |
| `HOUSE4` | `docs/investigations/ux/HOUSE4_ORCHARD_HOUSE_BLUEPRINT.md` — **this mission's named co-source** (2026-07-16) |

This concept is therefore **`HOUSE5`**. The rollback tag was cut as `rollback/HOUSE5-…` **after** checking, so no rename was required — `HOUSE4 § 0.3` had already established that a tag may be renamed only before it is referenced, and `SHOP2 § 0.1` that it must not be renamed after. **Neither problem arose here because the collision was checked before the tag was cut.**

### 0.3 The noun deviation — *"the definitive visual North Star"* is taken three ways, and the third is fatal

**This is the sixth consecutive noun deviation in six missions.** `HOUSE4 § 0.4` named the pattern at five and predicted the cause: *"the house's vocabulary is almost entirely spent."* It is spent here too, and worse.

| Claim | Already means | Owner |
|---|---|---|
| **"Visual North Star"** | `NORTH1_THE_VISUAL_NORTH_STAR.md` — a concept **render**, delivered 2026-07-15, **whose own author condemned it** | `docs/implementation/ux/` |
| **"North Star"** | **The Design North Star** — *"The Healthy Apples is a modern home in an ancient orchard, where technology quietly supports timeless family life."* **A sentence.** | `BLUEPRINT § 17` — **governing** |
| **"Definitive"** | — | **Nothing an investigation may claim** |

**The third is the one that cannot be complied with.** `BLUEPRINT § 17` is governing architecture; this is an investigation; `README.md:4` — *"Architecture documents no longer live in `docs/investigations/` — investigation files there are point-in-time analysis and history only."* **A document that is not governing cannot produce a *definitive* anything, and a drawing that claimed to supersede § 17 would be an investigation overruling a governing document.**

**The board therefore states the star and declines to be it** (sheet `A-900`): *"That sentence is the North Star, and this board is not… This set is a drawing of the house that sentence describes."*

> **The star already exists, it is governing, and it is a sentence rather than a picture — which is precisely why it has survived.** § 2 is why that distinction turned out to be the entire design brief.

### 0.4 The status deviation — inherited, and the mission got it right

The mission says, twice and unprompted: *"This is NOT implementation. This is NOT production UI."* **That is the correct status and it is honoured without deviation.** Recorded because `HOUSE4 § 0.2` had to *argue* its way to this status against a mission that asked for *"the governing experiential architecture"* stored under `docs/investigations/`. **This mission asked for a concept and called it a concept.**

No other deviation. No architecture modified. No screen designed. Nothing implemented.

---

## 1. HEADLINE

**THA already has a photorealistic visual North Star. Its own author wrote that it must never be built. The single most important decision in this mission was therefore not what to draw — it was what kind of drawing is safe to make.**

Five observations, in the order they changed the work:

1. **The precedent is a warning, written by the artefact itself.** `NORTH1:16` — *"The image is the most valuable artefact the visual programme has produced, and **it must never be built**… it earns its warmth by exactly the means the canon forbids — a drawn kitchen, painted props, an aphorism on the wall. Its power and its danger are the same property: **it is so persuasive that a team will copy the picture instead of extracting the principle**, and copying it produces *the theme park* — **the single most-forbidden thing in the entire document set**."*

2. **The predicted failure has already occurred once, and was recorded.** `PLAN1 § 0` found the render's noun arriving in a mission brief **one day later**, attached to a room: *"the first live instance of the risk NORTH1 predicted."* **This is not a hypothetical hazard. It has a date.**

3. **So the form of the deliverable is the finding.** A render invites copying; **a plan cannot be copied.** Nobody ships a floor plan, nobody pastes a hatch pattern into a component, nobody mistakes an adjacency bubble for a screen. **An architect's drawing set is the one visual form that forces the reader to extract the principle, because the picture is unusable on purpose** — and *"architect's presentation board"* is what the mission asked for. **The mission's own words are the safe answer to the mission's own risk.**

4. **The house's central condition is a void, and an honest drawing has to show it.** `HOUSE4 § 1` — *"The Orchard House is completely specified room by room and completely unspecified between the rooms — and the house has no word left to describe the difference."* Sheet `A-101` therefore stamps the circulation **NIC — Not In Contract**, a real architectural term for a zone outside anyone's scope. § 3.

5. **Drawing the plan honestly produced one observation no prose document has made.** `E0` means *"lit from the hall."* A room lit from the hall **has no window of its own** — so on any true floor plan, **Admin must be drawn with no external wall**, borrowing its only light from the void. **The drawing makes the dependency physical: a governed level of a governed scale takes its light from a room the canon has never admitted exists.** § 4.

---

## 2. WHY A DRAWING SET, AND NOT A RENDER

**This is the mission's central design decision and the only one that was genuinely mine to make.**

### 2.1 The canon forbids the obvious deliverable, in one line

`BLUEPRINT:167` — *"The analogies are **feelings to design toward, never pictures to draw**."*

`BLUEPRINT:439` — *"**The theme park.** Literal rooms: illustrated kitchens, drawn furniture, wood-grain, page-turns, fridge magnets, jar clip-art, photo-corner frames. The 'family table' is a feeling produced by material, light, and composition — **the moment it becomes a picture of a table, the place has become a costume**."*

> **A mission asking for "the visual concept for the Orchard House" is one step from the most-forbidden artefact in the document set — and NORTH1 already took that step, brilliantly, and then wrote down that it was a mistake.**

### 2.2 The distinction that makes a board safe

| | The render (`NORTH1`) | The drawing set (this board) |
|---|---|---|
| **What it shows** | What the house *looks like* | What the house *is* |
| **How it persuades** | By being beautiful | By being checkable |
| **Failure mode** | Copied into production → *the theme park* | **None available** — a plan has no pixels to steal |
| **What a reader takes** | The picture | The principle |
| **Its own verdict** | *"It must never be built"* | Built, and unbuildable |

**An architect's board is not a lesser render. It is a different instrument.** Plans, sections, adjacency diagrams and room schedules are how architects communicate *relationships* — and relationships are exactly what this house's canon owns and what its gaps concern. **The mission asked for the right instrument; the risk was in reading "visual" as "pictorial".**

### 2.3 The one place the board deliberately spends warmth, and the one place it refuses to

**The board's own aesthetic is drafting, not orchard.** It does not use THA's palette, because a board that *looked like* the product would be a render wearing a plan's clothes — and would fail `BLUEPRINT:440`'s *costume* test from the outside. Graphite on drafting paper; **one green**, spent only on the orchard and the exposure fills, because `BLUEPRINT:191` fixes the orchard as *life*; **one red**, spent **only** on conditions no document owns.

> **The red is the argument.** Architects redline unresolved scope. This house has unresolved scope, `HOUSE4` verified exactly where it is, and a drawing that rendered it in warm greens would be lying in the house's own colours.

---

## 3. THE VOID AT THE CENTRE — WHAT THE BOARD DRAWS AND WHAT IT REFUSES TO

**The mission asks for *"how the rooms relate to one another."* `HOUSE4 § 5` is titled *"HOW THE ROOMS CONNECT — THE ONE GENUINELY UNOWNED DELIVERABLE."* Those two sentences are the whole problem.**

### 3.1 What the board draws: only what is built

Sheet `A-101` renders **HOUSE4 § 5.5's verified table** and nothing else — every solid line is a connection that exists in code at `7d1dd2ce`; every dashed red line is one that does not:

| Connection | Drawn as | Source |
|---|---|---|
| Cookbook → Planner → Shopping | **The spine** — heavy, green | `ORCH1 § 7.1`; `HOUSE4 § 6.4` |
| Cookbook → Shopping *via the Planner's wire* | Green, dashed — **one owner, one funnel** | `SHOP2 § 7.2` |
| Pantry → Shopping | Solid, one-way | `SHOP2 § 7.3` |
| Shopping → Pantry | **Red, struck through — refused deliberately** | `SHOP1:419`; `SHOP2 § 7.3` |
| Planner → Diary | **Red, struck through — nulled** | `ORCH1 § 7.1`, `§ 12.1` |
| Home → every room | **Feint dashed — implied by three rules, owned by none** | `HOUSE4 § 6.1` |

### 3.2 What the board refuses to draw

`HOUSE4 § 5.6` is explicit about the discipline, and this board inherits it verbatim: it **does not propose** *"a name for the circulation, an adjacency column on the map, a route graph, a hall row, a rule about which rooms touch, or an amendment to `E0`."*

**A drawing can commit that error more quietly than prose can.** A line drawn between two rooms *is* an adjacency claim. So the board draws **built** lines as observation, **absent** lines as absence, and **the space between** as a stamped void. **It does not draw a hall, because drawing one would be inventing the thing `HOUSE4 § 15.4` routed to a workstream — and a picture of a hall would be believed faster than a sentence proposing one.**

### 3.3 Why *NIC* is the honest stamp

**"Not In Contract"** is the term of art for a zone shown on a drawing that is **outside the scope of the work** — drawn because it exists and must be coordinated around, hatched because nobody in this contract owns it.

That is precisely the circulation's condition:

- **It exists** — the household walks it every time they move between the three rooms they use most (`HOUSE4 § 6.4`).
- **It is depended on** — by `E0` (*"lit from the hall"*), by `BLUEPRINT:138`'s doorway category, and by `EXP ARCH:178`'s *"shortest honest path"* (`HOUSE4 § 15.4`).
- **Nobody owns it** — and *"every word the house would need for it is already spent"*: **doorway** is the one primary action; **corridor** is only ever the name of a failure; **threshold** never leaves its room; **hall** is E0's address and the title of a document about Home (`HOUSE4 § 5.2`).

> **The board's central plate is a room-shaped hole with four crossed-out names beside it. That is not a stylistic choice. It is the most accurate drawing of this house that can currently be made.**

---

## 4. THE OBSERVATION THE DRAWING MADE THAT THE PROSE DID NOT

**This is the only thing in this document that is not composition, and it came from the act of drawing.**

`BLUEPRINT:224` names the exposure scale's floor **"E0 · Lit from the hall."** `BLUEPRINT:181` gives Admin the place identity **"The study off the hall."** `HOUSE4 § 5.1` verified that the hall is cited twice and defined nowhere.

**Prose can hold that as an inconsistency. A floor plan cannot.** A plan must decide, for every room, whether it touches an external wall — because that is what a plan *is*. And the canon's own words decide it:

> **A room "lit from the hall" is, by definition, a room with no window.** So on sheet `A-100`, **Admin is drawn with no external wall at all** — the only room in the house without one — and a dashed red leader carries its light in from the void.

**Three consequences fall out of that single drafting decision, and all three are the canon's, not mine:**

1. **Admin's light source is the one space no document defines.** The dependency was always in the words; the plan makes it physical.
2. **E0 is not "no orchard" — it is *borrowed* orchard.** `BLUEPRINT:224`'s own wording says the light comes *from* somewhere. Every other level describes its own aperture; **E0 alone describes a relationship to a neighbour.**
3. **The scale has four levels and three of them are properties of a room.** E3, E2 and E1 describe how much window a room has. **E0 describes who it borrows from.** *(Recorded as an observation. `HOUSE4 § 5.6` forbids proposing an amendment to E0 and this document does not.)*

> **Drawing a plan is a forcing function that prose is not: you cannot leave a wall undecided.** That is the second argument for this deliverable's form, and I did not anticipate it before drawing.

---

## 5. WHAT THE BOARD SHOWS — SHEET BY SHEET

Each sheet answers one of the mission's seven requirements, and each cites its owner rather than restating it.

| Sheet | Mission requirement | Owner cited | Status |
|---|---|---|---|
| **A-000** | *(the board's own status)* | `NORTH1:16`; `BLUEPRINT § 16` | Why this is not a render |
| **A-001** | **The orchard surrounding the home** | `BLUEPRINT § 6`, § 6.0–6.2 | Composition |
| **A-100** | **The rooms of the house** | `BLUEPRINT § 5.1` — verbatim | Composition **+ § 4's observation** |
| **A-101** | **How the rooms relate** | `HOUSE4 § 5.5` — verified | 🔴 **Observation only** |
| **A-200** | **Light and atmosphere** | `BLUEPRINT § 7`; `EXPLANG § 3A` | Composition |
| **A-300** | **Materials** | `BLUEPRINT § 8`, § 8.1–8.2 | Composition |
| **A-400** | **Where the Companion belongs** | `BLUEPRINT § 13`; `HOUSE4 § 8.1` | Composition + observation |
| **A-500** | **The emotional character of each room** | `BLUEPRINT § 5.1`; `OHDB § 13` | Composition, verbatim |
| **A-600** | **The household journey** | `EXP ARCH § 10`; `HOUSE4 § 6` | Composition + observation |
| **A-700** | *(the perimeter)* | `HOUSE4 § 12`; `ORCH1`; `SHOP2` | 🔴 **Observation only** |
| **A-900** | *(what must never be drawn)* | `BLUEPRINT § 16`, § 17 | Composition |

**Three drawing decisions worth stating, because each is a reading of a rule rather than a taste:**

- **The Companion is drawn as a fixture symbol, not a space** (`A-400`). `BLUEPRINT:325` — *"The Companion is not a room. It is the person in the house."* On a plan, the thing that is in every room and is none of them is a **fixture**: the same mark, same position, every room. **The canon's definition is already a drafting convention; it just had never been drafted.**
- **The room schedule is a real architectural instrument doing real work** (`A-500`). A schedule fixes every room's character in one table — which is exactly what `BLUEPRINT § 5.1` and `OHDB § 13` already are, in two documents that have never been read as one table. **The sheet collects; it invents nothing.**
- **The board does not move.** No animation, no scroll-triggered reveal, no hover theatre. `BLUEPRINT § 12.1 r5` — *"**Still.** No Living Detail moves"*; `EXPLANG:530` — *"Decorative animation… noise wearing the costume of craft."* **An architect's board does not animate, and neither does this house.** The restraint is the subject.

---

## 6. OBSERVATIONS

**The mission asked for observations only. These are the five worth recording, and none is a recommendation.**

### 6.1 The house's vocabulary is spent, and this is now the sixth consecutive proof

`PLAN1` refused *kitchen*. `COOK1` kept *the family's cookbook* — it was the canon's own. `PANTRY1` narrowed *larder*. `SHOP2` refused **both halves** of *market basket*. `HOUSE4` accepted its noun and refused its **identifier**. **`HOUSE5` accepts its brief and refuses its claim** — *"definitive visual North Star"* is taken by a condemned render, by a governing sentence, and by a status an investigation cannot hold.

> **Six missions, six noun problems.** `HOUSE4 § 5.2` diagnosed it: *"the concepts THA has not owned are exactly the concepts whose names it has already spent."* **The pattern has now extended from concepts to deliverables: the house has run out of names for its own artefacts.**

### 6.2 The board is the fourth artefact to find that the canon and the platform wrote the same law independently

`COOK1 § 3` found the WS10 engine refusing rankings *in the canon's own words, eighteen months apart, never introduced.* `PANTRY1 § 6.3` found `canonical-foods-gate.ts` citing Rule KC9 in its own header. `SHOP2 § 5.3` found SHOP1's grammar test to be `OLB:100`'s Companion, *written three days earlier.*

**This board adds a fifth instance of the shape, and it is about the board itself:** `NORTH1:16` — a design document — independently arrived at `BLUEPRINT:167`'s law (*"feelings to design toward, never pictures to draw"*) **by violating it and noticing.** *The render is the only artefact in the set that proves the rule by being the counter-example, and it says so itself.*

### 6.3 The two artefacts this board replaces are both correct, and neither is wrong

**Nothing here supersedes `NORTH1`.** `NORTH2` already assessed its five derived principles and adopted **one**, narrowed; its headline was that *"the Experience Architecture is the wrong document for all five and stays byte-untouched."* **`NORTH1` remains the best evidence in the repository that the Kept Room is real and warm — it simply must not be built.** This board does a different job: it draws what can be built *from* it without being copied.

**And nothing here supersedes `HOUSE4`.** This board is `HOUSE4` rendered — its § 5 void, its § 6 hub, its § 8.1 fixture, its § 12 perimeter — plus § 4's one new observation. **Where the two differ, `HOUSE4` is right and this board is a drawing.**

### 6.4 Two of the schedule's ten signs of life specify a finish nobody can supply

Recorded on sheet `A-500`, from the room audits: the Cookbook's **well-thumbed page** is sourced from *"cook/plan counts"* — and **no cook count exists in ninety tables** (`COOK1 § 13.2`). The Pantry's **freshness, honestly told** is sourced from *"item freshness data"* — and **no expiry, purchase or opened date exists anywhere in the pantry domain** (`PANTRY1 § 12.2`).

> **Both were found by separate investigations asking the same question of different rooms, neither looking for it.** A room schedule is the instrument that makes this legible: **two of ten specified finishes have no supplier.** `PANTRY1 § 14.5` already recommends auditing the remaining eight; this board is the first artefact where all ten sit in one table and the gap is visible at a glance.

### 6.5 The board has one unresolvable tension, and it is stated on the board

`BLUEPRINT:444` — *"**Metaphor taxing function.** Any place-character that costs a click, a legibility point, or a frame of scroll performance… **If the concept ever fights the Planner, the concept loses.**"*

**That note binds this board too, and sheet `A-900` says so.** A ten-sheet architectural concept for a meal-planning product is, on its face, exactly the kind of elaboration that rule exists to check. **The defence is that it is a drawing about relationships rather than an addition to the product** — it costs the household nothing because the household never sees it. **But the rule is right, and if this board ever starts arguing with a room, the board loses.** Recorded so that a future reader does not have to discover the tension themselves.

---

## 7. WHAT THIS CONCEPT DID NOT DO

- **Nothing implemented.** No code, no schema, no component, no route, no token, no colour value in the product, no CSS that ships. The board is a standalone artefact under `docs/ui-audit/`.
- **No production UI.** No screen is designed, mocked, or specified. **No sheet in the set depicts an application surface**, and that is the point of § 2.
- **No architecture modified.** Verified by `git status` at delivery: **all seven governing Experience documents** (`THA_EXPERIENCE_BLUEPRINT`, `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT`, `THA_ORCHARD_LIVING_BOOK`, `THA_KEPT_ROOM_TRANSLATION`, `THA_EXPERIENCE_ARCHITECTURE`, `THA_EXPERIENCE_LANGUAGE`, `THA_UI_ARCHITECTURE`), **`HOUSE4`** and **`NORTH1`** carry **no tracked modification**.
  > **Stated precisely rather than sweepingly:** `ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/architecture/README.md` and `capabilities/household.md` **do** show as modified in the working tree. **None of those edits is this session's** — they belong to concurrent sessions writing at the same time (`CONV1`, `SEC1`; mtimes 15:12–17:01, against this document's 17:02). **This session created two files and edited nothing else.** Recorded this way because a blanket *"everything is byte-untouched"* would have been false, and a claim about a shared working tree is only honest when it names what it actually checked.
- **No rule created.** Applying `NORTH2:39`'s gate to my own output: every attribute drawn traces to an owner. **If any statement on the board duplicates a rule owned elsewhere, the statement on the board is the defect** (`BLUEPRINT § 18`'s yield clause).
- **No value set.** No colour, token, size, radius, duration or spacing enters the product. The board's own palette is drafting graphite and is **deliberately not THA's** (§ 2.3).
- **The circulation not named, drawn, or proposed** (§ 3.2) — `HOUSE4 § 15.4` routed it and this board does not jump the route.
- **`E0` not amended** (§ 4) — the observation is recorded; `HOUSE4 § 5.6` forbids the amendment and this document does not make it.
- **The shop door not opened** (`A-700`) — `SHOP2 § 5.1`'s question is drawn and left unanswered.
- **Not promoted, and not promotable.** `HOUSE4 § 15.7` recommends against its own promotion; **a concept board is even less promotable than an investigation.** This creates no governing law and asks for none.
- **`NORTH1` not superseded, `HOUSE4` not restated** (§ 6.3).

**Gates re-run:** `.engineering/scripts/repo-structure-verify.sh` — `docs/investigations/ has no loose files` **PASS**; `no duplicate documents` **PASS**. *(The pre-existing, unrelated FAIL on `.glibcheck.txt` / `.libdirs_uxhome.txt` at root persists — untracked before this session, noted also by `ORCH1`, `PLAN1`, `COOK1`, `PANTRY1`, `SHOP2` and `HOUSE4`.)*

---

## 8. THE ONE THING TO REMEMBER

> **The Orchard House is a modern home in an ancient orchard, on one bright morning that never moves. Ten rooms, one presence, one sun. Every room's window is sized by how hard it makes the eye work; every room's character was written down before anyone drew it; and the orchard outside every window is life — never decoration, never walked into, never asked to be tended.**
>
> **And at the centre of the plan there is a room-shaped hole. No document owns it. Four words could name it and all four are spent. The exposure scale borrows its floor from it. The Admin study takes its only light from it. And the household walks through it every single time they move between the three rooms they use most.**
>
> **THA asked for a picture of its house once before, got a beautiful one, and its own author wrote that it must never be built. So this is a set of plans instead — because a plan cannot be copied into a theme park, and because you cannot draw a floor plan without deciding where the walls are. That is the whole value: the drawing had to decide what the prose could leave open, and the first thing it discovered was that the house's smallest room has no window, and borrows its light from a room that does not exist.**
