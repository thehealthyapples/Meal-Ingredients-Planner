# HOUSE_COMPLETE — The Healthy Apples House

**The house is finished. Three rooms were already permanent; five are designed here; and the whole house is
stated once — its blueprint, its walking journey, and the constitution every future room must obey.**

| | |
|---|---|
| **Session** | `HOUSE_COMPLETE` |
| **Date** | 2026-07-18 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/HOUSE-COMPLETE-20260718` → `7bfad50c` (tag `house-complete-wip-snapshot-7bfad50c`; working-tree snapshot `0a6f2fe1`) |
| **Status** | **Blueprint complete. Five rooms designed; the house stated whole. Awaiting owner decision, then the gated build.** |
| **Product changed** | **None.** This is a design blueprint. No product source, data source, hook, route, API, behaviour, schema, migration, or test was opened or edited. |
| **Foundation (not re-opened)** | `HOME_ARRIVAL_PRODUCTION_LOCK.md` (Entrance Hall) · `HOUSE5_KITCHEN_EXPERIENCE.md` (Kitchen) · `HOUSE6_PANTRY_EXPERIENCE.md` (Pantry) |
| **Rooms designed here** | The Family Table (Planner) · The Garden Room (Nutrition) · The Tasting Bench (Analyser) · The Family Journal (Diary) · The Mirror (Profile) |
| **Out of scope** | Community · Partners · Admin · Support Hub — **The Orchard World**, a separate programme |

---

## 0. What this document is, and the one thing it is not

**It is** the completion of the house: five room blueprints in the language the first three established, then
the four instruments the mission asked for — the Complete House Blueprint, the Walking Journey, the House
Constitution, and the production recommendations.

**It is not a redesign of anything already settled.** The Entrance Hall, the Kitchen and the Pantry are read,
inherited, and left byte-untouched. They are the permanent architectural foundation, and every room below is
built from their materials rather than beside them.

**Read before starting (per the Architecture Bootstrap):** `docs/architecture/README.md`,
`HOME_ARRIVAL_PRODUCTION_LOCK.md`, `HOUSE5_KITCHEN_EXPERIENCE.md`, `HOUSE6_PANTRY_EXPERIENCE.md`, the
Experience Blueprint § 5.1 (the map of the house), § 6.2 (the Orchard Exposure Scale), § 12 (Living Details),
§ 13 (Companion Presence), § 14 (the shell); the Orchard House Design Blueprint § 13.2 / § 13.6 / § 13.7; the
Experience Language § 5 (the six-beat rhythm, per realm). Git status confirmed and the rollback created
before any change.

> **The yield clause the whole house obeys.** Every rule below traces to an owner. **If any statement here
> restates a rule owned elsewhere, the owner prevails and this file is corrected.** This document creates no
> colour, token, component, route, string, capability, or behaviour.

---

## 1. The finding that shaped this session

**The five remaining rooms were never undesigned.** Every one of them already has a canonical row in the
Experience Blueprint's map of the house (§ 5.1), fixing its place identity, its orchard exposure, its light
character, its ground posture, and its one Living Detail:

| Domain | Place in the house | Exposure | Light | Ground posture | Living Detail |
|---|---|---|---|---|---|
| **Planner** | The family table | **E1** | Even working light; the sun on today | One solid table holding the week | The sun on today |
| **Nutrition** | The noticeboard by the garden view | **E2** | Garden-bright, optimistic | Noticeboard tier over a solid data tier | The garden filling in |
| **Analyser** | The work bench | **E1** (E2 before first use) | The clearest task light in the house | The bench; the examined product as the object on it | Where you left off |
| **Diary** | The window seat | **E2**, softly — quiet, never dim | A gathered pool of the same morning | Lap desk; the most air in the house | Yesterday's trace |
| **Household / Profile** | The family record | **E1** | Even, honest, unshadowed | The record; anchored strata | The family, first-class |

So this session's job is **not to invent five rooms — it is to make five already-written rows into five
legible rooms**, exactly as HOUSE5 made the Cookbook row into the Kitchen and HOUSE6 made the Pantry row into
the Pantry. That is why nothing below is a new architectural idea, and why every room is the same
**NORTH4 Concept B** architecture with **one deliberate move** that gives it its own personality.

**What each of the five already had, and did not.** Only the Planner arrives with a room blueprint of its
own — `PLAN1_ORCHARD_PLANNER_BLUEPRINT.md`, whose findings are carried into § 3 and § 12 rather than
restated. The Garden Room has platform documents but no room blueprint (`WX8`, `HNP1`); **the Tasting Bench
and the Family Journal have neither** — they are the two rooms in this house that have never been designed
at all, which is visible in what they are today (§ 12.2).

**A note on the five names.** The mission names these rooms warmly — *Family Table · Garden Room · Tasting
Bench · Family Journal · Mirror*. The Blueprint names them structurally. Where the two differ, **the
Blueprint's place identity governs and the mission's name is the house's name for it** — and in three cases
the difference is load-bearing enough to be settled explicitly (§ 5.0, § 6.0, § 8.0 below). A warm name must
never quietly re-brief a governed room.

---

## 2. What the three permanent rooms established

Everything below inherits this, verbatim. It is stated once so no room below has to restate it.

| Inherited | What it is | Owner |
|---|---|---|
| **The architecture** | **NORTH4 Concept B** — the orchard behind real joinery, an oak boundary between, a calm plaster room below, the doors along the floor. The viewpoint is permanent; only *how much* of the same orchard is opened changes. | `HOME_ARRIVAL_PRODUCTION_LOCK` § 3.1 |
| **The interior** | **The Kept House** — subtly aged oak, soft matte plaster, a gentle lived-in patina. No decorative props. Age is the luxury; nothing was placed, so nothing reads as staged. | `HOME_ARRIVAL_PRODUCTION_LOCK` § 3.2 |
| **The light** | **One morning**, The Warm Hour. Rooms differ by exposure, never by hour. Never a second sun. | Experience Blueprint § 7, § 16 |
| **The brand** | **The pressed apple** — tone-on-tone in the plaster, discovered rather than displayed. The only mark, in every room. | `BRAND2` § 6 |
| **The Companion** | **The apple carved into a sage disc** — same corner in every room, calm at rest, always available, never dominant. | `COMP1` § 2 |
| **The shell** | The constant doors along the floor; you can leave any room for any room. | Experience Blueprint § 14 |
| **The honest-absence law** | Every room's emptiest state is built **first** and built **warm**: the quiet day (Home), the empty book (Kitchen, K12), the bare cupboard (Pantry, P10). Absence gets more light, never more prompting. | Arrival § 4; HOUSE5 K12; HOUSE6 P10 |

That last row is the house's deepest inherited idea and it recurs in all five rooms below: **THA's emptiest
states are designed before its fullest ones**, because the emptiest state is the one most households are
actually in.

---

## 3. Room 4 — The Family Table *(Planner)*

> **The house's practical centre.** Home is where the household is welcomed; the Family Table is where it
> makes up its mind.

### 3.1 Emotional purpose

Planning the week is the most quietly anxious act in a household's food life, and every other product
answers it with project management: a grid of empty cells, a completion percentage, a red gap where Thursday
should be. The Family Table refuses all of it. **It is a table the family gathers around, not a form they
fill in** (OHDB § 13.2).

| It must feel | How the room produces it |
|---|---|
| **In control** | The whole week is on one surface, at once, legible. Nothing is hidden behind a step, a wizard, or a tab. |
| **Unhurried** | No timer, no urgency, no "3 days left to plan". The table is patient; it has been laid and it waits. |
| **Decisive** | One obvious move at a time, each with a sensible default (Experience Language § 5.2). The room makes deciding easy, and then gets out of the way. |
| **Gathered** | The register is *the family's week*, never *the user's schedule*. "For the table" · "Thursday's open" — the honest language of cooking for people. |
| **Already begun** | Everything THA could prepare, it has. The household arrives to a week that is partly laid, never to a blank grid demanding entries. |

**It must never feel like** a spreadsheet, a scheduling app, a chore rota, or a productivity tool with a
completion score. The single spine that defeats all four: **the week is the household's, and an empty slot is
a laid place — never an accusation.**

> **The philosophy in one line:** *the Family Table is one solid table with the household's week laid on it —
> patient where it is empty, warm where it is today, and finished the moment the family says it is.*

### 3.2 Architectural identity — the room where the window closes

The Family Table is the first room in the house at **E1: light only.** This is its defining move and it is
the largest architectural change since Arrival, so it is defended rather than assumed.

The orchard is not in this room as an image. **The room is bright *because* the orchard is outside** — the
light comes across the table warm and directional, from a window you are not looking at, because you are
looking at the week. This is the Blueprint's own inverse law, applied at its hinge point: *"the more a
surface asks the eye to work, the further the orchard recedes"* (§ 6.2). The Planner asks the eye to work
harder than any room so far, so the orchard becomes light.

**The trap this creates, and the rule that closes it.** Walking from the Kitchen (E2, side window) or the
Pantry (E2, small window) into the Planner is walking *away* from the last visible orchard in the house. If
that reads as the room dimming, the house has lost a room. So: **E1 is broader, never darker.** Where E2
commits the light to one region, E1 lays the same morning across the whole plane. The room has *more* lit
surface than the Kitchen, not less — it simply has no view. Same sun, wider fall.

**The planes of the room**

| Plane | What it is | Owner |
|---|---|---|
| **The table** | The room's hero and its entire ground: **one solid oak plane holding all seven days.** The deepest, widest oak surface in the house — deeper than the Kitchen worktop, wider than the Pantry ledge. The days are *places on the table*, never cards on a grid. | Blueprint § 5.1, § 8.2 |
| **The light across it** | Even working light, warm and directional, falling across the table from the unseen window — with a half-step more warmth where today sits. | Blueprint § 5.1, § 7 |
| **The plaster** | The matte, hand-troweled Kept House wall, carried verbatim; the room's quiet edges. | Arrival § 3.2 |
| **The pressed apple** | The sole brand mark, in the plaster by the table, tone-on-tone, discovered not displayed. | `BRAND2` § 6 |
| **The doors** | The constant shell along the floor. "Planner" reads as *here*. | Blueprint § 14 |

**One ground, never nested.** This is the rule the Planner breaks most easily and must not: a week rendered
as seven cards, each containing meal cards, each containing ingredient chips, is three grounds and a
database. The table is **one plane**; a day is a region of it; a planned meal is an object resting on it.

### 3.3 Interior language

- **Aged oak and matte plaster**, identical to the Kitchen and the Pantry — the same house, at its widest
  surface.
- **The sun on today** — the room's one Living Detail. A **half-step of warmth** on the current day: never a
  colour, never a border, never a `TODAY` chip, never a badge (Blueprint § 12.2 ceiling). The week has a
  *now*, and the light says so; nothing labels it.
  > **Named dependency, stated rather than assumed.** `PLAN1` § 11.4 found that **the Planner cannot
  > currently know what day it is** — there is no date column on `planner_weeks` / `planner_days`, and the
  > page constructs no date at all. So this room's signature Living Detail **has no data source today.** Per
  > Article VII it is *data-borne or dead*: until the anchor exists (CONV1 P7's `weekStartDate`, written
  > only at week creation and never back-filled), **the sun on today is simply absent, and the table is
  > still complete.** It is never faked from the request's own weekday — the exact fabrication CONV1 P9
  > retired.
- **The empty slot is a laid place.** A day with nothing planned is **clear warm oak with air around it** —
  a setting waiting, not a gap. No dashed outline, no ghost card, no "+ Add meal" shouting into the space, no
  red, no count of what is missing. This is the Planner's quiet day, and per the house's honest-absence law
  it is designed first.
- **A planned meal is an object on the table**, not a cell entry: the dish in the serif hand, one honest
  quiet sub-line (*"for the table"* · *"serves 4"*), a soft shadow so it reads as a thing set down.
- **The voice is the household's.** *"The week"*, never *"Week 27"*. *"Thursday's open"*, never
  *"Unplanned: 1"*. *"The plan is made"*, never *"100% complete"*.

### 3.4 Relationship to neighbouring rooms

The Family Table is the room with the most doors, and it is the house's **practical** centre exactly as Home
is its **emotional** one — a distinction worth keeping, because collapsing the two is how Home becomes a
dashboard (Experience Language Principle G, *home is not the dashboard*).

- **← The Kitchen.** You found a dish you know; you bring it to the table. This is the single most-walked
  path in the house and it must be one motion, never a modal maze.
- **← The Pantry.** You know what is in the house; you plan around it. The Pantry's Companion line
  (*"the squash would be lovely in Sunday's traybake"*) is a suggestion **aimed at this room** — and it stays
  a suggestion here (rule T6).
- **→ Shopping.** The list by the door is simply what the table decided. Shopping is downstream and
  derivative; the table is where the thinking happened.
- **↔ Home.** Home's console reports what the table holds (*"three planned · nothing to fetch"*) and Home's
  door leads back to it. The table is the source of Home's most important true sentence.
- **→ The Garden Room.** *"How did that week look?"* — asked afterwards, answered without judgement, and
  never sent back as an instruction (rule G9).

### 3.5 Desktop · tablet · mobile

The responsive rule for this room is one sentence: **you never get fewer days on a smaller screen — you
stand closer to the same table.** The week is never split across screens, never paginated, never collapsed
into an accordion of day-cards.

| | The room |
|---|---|
| **Desktop** | The whole week on one continuous oak plane — seven day-regions across a single table, the light falling across it, a half-step warmer on today. Planned meals rest as objects in their days; open days are clear warm oak. The Companion leans at the end of the table with one line. Doors along the floor. |
| **Tablet** | The table turns rather than breaks: the week reflows to **two bands on the same single plane** (four and three), the shelf line of the table continuous beneath both. Still one ground; still all seven days visible without scrolling to find a day. |
| **Mobile** | **Today at the head of the table**, at full size, with the rest of the week continuing as one horizontal strip you move along — the same plane, seen from closer. Never seven stacked cards; never a day-picker that hides six days to show one. Vertical scroll reveals the depth of a day, horizontal movement walks the week. |

### 3.6 Permanent design rules — the Family Table

**None is new.** Each is the room-specific face of a rule with an owner, cited so it can be checked and never
becomes a second owner.

| # | Rule | Why / owner |
|---|---|---|
| **T1** | **One table, one ground.** The week is a single plane; days are places on it and planned meals are objects on it. Never a grid of day-cards, never a card in a card, never nested. | Blueprint § 8.2, § 5.1; TRANSLATION1 |
| **T2** | **An empty slot is a laid place, never an accusation.** Clear warm oak and air — never a dashed ghost, a red gap, an "unplanned" count, or a completion percentage on the week. | Blueprint § 6.2 rule 2; HOUSE5 K12; HOUSE6 P10 |
| **T3** | **The sun on today is a half-step of warmth** — never a colour, a border, a chip, or a badge. | Blueprint § 12.2 (ceiling) |
| **T4** | **E1 — light only.** The orchard is never behind the week. No view upgrade because the week looked plain; an honestly empty week may open to E2, never two levels. | Blueprint § 6.2 rules 1–3; OHDB § 13.2 |
| **T5** | **E1 is broader, never darker.** Walking in from the Kitchen or the Pantry must never feel like the light left the room. | Blueprint § 7; EL § 3A.4 (*calm must never become lifeless*) |
| **T6** | **The plan is the household's, never the product's.** Suggestions are grounded, offered, and refusable; the Companion never plans the week and nothing is ever auto-filled on the household's behalf. | EL § 5.2; Experience Architecture § 11; OLB:78 |
| **T7** | **No streak, no adherence score, no target THA invented.** *"You planned 5 of 7"* is a regression, not a feature. A week is not a goal the product set. | EL § 5.2, § 5.5; Blueprint § 12.2 |
| **T8** | **Never claim more than THA witnessed.** The table knows what was *planned*; it never says *"cooked"*. | HOUSE5 K5; Core Principle 6 |
| **T9** | **The week resolves to rest.** Completion is *"the plan is made"* — never a prompt to do more, never an upsell, never an immediate next task. | EL § 5.2 (Completion) |
| **T10** | **Season appears in the food, never in the room.** *"In season now"* is a property of a dish; the table's light, oak, and plaster never dress for a date. | OHDB § 11; HOUSE5 K7; HOUSE6 P8 |
| **T11** | **Same house, carried verbatim.** Concept B, the Kept House materials, the one morning, the pressed apple, the Companion apple, the constant shell. | Arrival § 3; HOUSE6 P11 |
| **T12** | **The metaphor yields to the work.** If the table concept ever fights what the Planner has to do, **the concept loses.** A household that cannot plan its week has not been served by a beautiful table. | Blueprint § 16 (*metaphor taxing function*); OHDB § 13.2 |

---

## 4. Room 5 — The Garden Room *(Nutrition)*

> **The most dangerous room in the house — and therefore the most carefully built.** Nutrition is where
> every other product moralises. The Garden Room informs and never assesses.

### 4.0 The name, settled

The mission calls this the **Garden Room**; the Blueprint calls it **the noticeboard by the garden view**
(§ 5.1). They agree, and the difference matters in exactly one way: *"Garden Room"* names a genuinely glazed
architectural type, and if taken literally it would pull this room toward E3 — a wall of glass. **It does
not.** The room is **E2**: one committed garden-bright window, with a noticeboard beside it. The house-name
is admitted; the exposure is unchanged.

### 4.1 Emotional purpose

Every nutrition surface ever built has the same failure mode: it scores a person and calls it help. THA's
answer is written into the Blueprint's choice of Living Detail, and the whole room is built on it — **the
garden filling in.** A garden filling in is *additive*. You cannot fail at it. You can only have planted less
so far, and the answer to that is more sun and more time, never a lower grade.

| It must feel | How the room produces it |
|---|---|
| **Optimistic** | Garden-bright light; a register of growth rather than deficit. The room's frame is *what is filling in*, never *what is missing*. |
| **Non-judgemental** | The household is **met from where they are, never assessed** (EL § 5.5). There is no score of the household anywhere in this room. |
| **Clear** | The one fact that matters, in plain language, first — before any depth (EL § 5.5, Orientation). |
| **Trustworthy** | Every figure can show its working, and **confidence is rendered exactly as strong as the evidence** — no precision theatre. | 
| **Unhurried** | At most one gentle, optional next step. The room informs; it never nags and never prescribes. |

**It must never feel like** a health dashboard, a scorecard, a calorie tracker, a report card, or a medical
chart. The single spine that defeats all five: **THA reports on the food, never on the household.**

> **The philosophy in one line:** *the Garden Room is a noticeboard of true things in plain words, standing
> in garden-bright light over the evidence that backs them — growing, never grading.*

### 4.2 Architectural identity — the two tiers, and why their order is the ethic

The Garden Room is **E2**: one committed window, garden-bright and optimistic, in a region the content never
covers. Its own move is not the window, though — it is **the tiering the Blueprint already specified:
noticeboard tier over a solid data tier** (§ 5.1).

**That order is the entire ethic of the room, rendered as architecture.** Plain human language is *above*;
the evidence is *solid beneath it*, always reachable, imposed on nobody. It is progressive disclosure built
as a building rather than as a chevron: the household reads the sentence, and the working is under it if
they want it. Inverting the tiers — numbers on top, words underneath as a caption — would turn this room
into every other nutrition product in existence, which is why the order is permanent (rule G3).

**The planes of the room**

| Plane | What it is | Owner |
|---|---|---|
| **The noticeboard** | The upper tier and the room's voice: a small number of **pinned true sentences** in plain language, in the household's register. Each note is one true thing, with its working available beneath. Never a row of KPI tiles. | Blueprint § 5.1 |
| **The data tier** | The solid ground beneath: the real figures, methodology, provenance, and citations — calm, complete, and honest, available to whoever asks. | Blueprint § 5.1; EL § 5.5 (Understanding) |
| **The garden window** | One committed E2 region, garden-bright and optimistic — the orchard as the growing thing, seen while the room talks about growth. | Blueprint § 6.2 |
| **The plaster & the oak rail** | The Kept House, carried verbatim; the noticeboard rail is oak, the wall is matte plaster. | Arrival § 3.2 |
| **The pressed apple** | The sole mark, in the plaster, tone-on-tone. | `BRAND2` § 6 |
| **The doors** | The constant shell. "Nutrition" reads as *here*. | Blueprint § 14 |

### 4.3 Interior language

- **The Kept House materials**, carried verbatim, in the brightest and most optimistic light in the house
  after Arrival's.
- **The garden filling in** — the room's one Living Detail: plant-diversity counts rendered as **copy plus
  the existing count**. **No leaf imagery, no drawn garden, no streaks** (Blueprint § 12.2 ceiling, explicit).
  The garden is a *sentence*, not a picture — *"twenty-eight different plants this month"* — and a drawn
  garden here would be the theme park (Blueprint § 16).
- **Every note is one true thing.** A noticeboard note is a sentence THA can defend: what it says, where it
  came from, and how sure it is. Where THA is unsure, the note says so in words and the room is still
  complete (Core Principle 6).
- **No precision theatre.** *"Around thirty"* when THA knows around thirty. A decimal is a claim about
  measurement, and THA does not make claims its evidence cannot carry (EL § 5.5, Confidence).
- **The voice is plain and warm** — *"A good spread this week"*, never *"Dietary diversity index: 7.4/10"*.

### 4.4 Relationship to neighbouring rooms

The Garden Room is the house's **explaining** room, and it has one unusual constraint no other room has: it
receives from everywhere and **must never send an instruction back**.

- **← The Kitchen.** A dish's nutrition, explained honestly, on request.
- **← The Pantry.** What is in the house, read for variety rather than for stock.
- **← The Family Table.** *"How did that week look?"* — asked afterwards, and answered without a verdict.
- **← The Tasting Bench.** A product's processing, explained in the same plain register the bench uses.
- **→ Nowhere, by instruction.** The Garden Room may offer **at most one** gentle optional step (rule G9),
  and the household decides. **The Table decides the week; the Garden Room never plans it.** This boundary is
  what keeps nutrition from becoming the house's authority figure.

### 4.5 Desktop · tablet · mobile

The responsive rule for this room is one sentence: **the words come first at every size, and the evidence is
never demoted to a place that implies it does not matter.**

| | The room |
|---|---|
| **Desktop** | The committed garden window to the right; the noticeboard across the upper left with its small number of pinned true notes; the solid data tier beneath, calm and complete, methodology reachable in place. The Companion's line rests on the noticeboard rail. |
| **Tablet** | The window becomes a committed band at the top (as the Kitchen and Pantry do), the Companion's line beneath it, then the noticeboard, then the data tier — the tier order preserved exactly. |
| **Mobile** | **The noticeboard *is* the room.** The one fact that matters arrives first, in plain language. The data tier continues below on the same ground — **never a separate tab, never behind a chevron** that implies the evidence is optional trivia. Scrolling down is walking closer to the noticeboard, not opening a drawer. |

### 4.6 Permanent design rules — the Garden Room

| # | Rule | Why / owner |
|---|---|---|
| **G1** | **Inform, never assess.** No score of the household, no grade, no traffic light, no ranking, and no comparison against other households. THA reports on the *food*; it never reports on the *people*. | EL § 5.5; Experience Architecture § 4 |
| **G2** | **No target THA invented.** A target exists only if the household set it or public guidance provides it — and it is named as such, with its source. Being "behind" on a number the product made up is the room's cardinal sin. | EL § 5.5 (Completion) |
| **G3** | **Words above numbers — permanently.** The noticeboard tier sits over the data tier at every breakpoint. Inverting them turns the Garden Room into a dashboard. | Blueprint § 5.1 |
| **G4** | **Every figure can show its working.** Provenance, methodology and citation are reachable from the figure itself, imposed on nobody. | EL § 5.5; NK1/NK2; Core Principle 6 |
| **G5** | **Confidence exactly as strong as the evidence.** No precision theatre, no invented decimals; honest uncertainty stated in words, and honest absence rendered as absence. | EL § 5.5; Core Principle 6 |
| **G6** | **The garden filling in is copy plus the real count** — never leaf imagery, never a drawn garden, never a streak, never a progress ring. | Blueprint § 12.2 (ceiling), § 16 |
| **G7** | **Growth is the frame; scarcity is never the headline.** The room reports what is filling in. A quieter period is stated warmly and honestly — never as a decline metric with a red arrow, and never as a catalogue of what the household did not eat. | HOUSE6 P10; EL § 3A.4; Blueprint § 6.2 rule 2 |
| **G8** | **E2 — one committed garden window the content never covers.** Never wallpaper behind the data tier. | Blueprint § 6.2, § 6.1 |
| **G9** | **At most one gentle, optional next step — and never an instruction.** Nutrition informs; the Family Table decides. The room never nags, never moralises, never prescribes. | EL § 5.5 (Action) |
| **G10** | **No medical register, ever.** THA does not diagnose, treat, or imply either; it never adopts clinical vocabulary or a clinical temperature. | EL § 3A.1; NK2; Brand Constitution |
| **G11** | **Season appears in the food, never in the room.** | OHDB § 11; HOUSE5 K7 |
| **G12** | **Same house, carried verbatim.** | Arrival § 3; HOUSE6 P11 |

---

## 5. Room 6 — The Tasting Bench *(Analyser)*

> **The house's threshold for the outside world.** The Entrance Hall is where *people* arrive; the Tasting
> Bench is where *products* do — brought in from the shop and examined in your own light, on your own terms.

### 5.0 The name, settled

The mission calls this the **Tasting Bench**; the Blueprint calls it **the work bench** (§ 5.1). They are the
same bench, and the mission's name adds something true: a *tasting* bench is where **you** judge, with your
own palate, in your own house — which is exactly the inversion this room needs, because the failure mode of
every food-analysis product is a machine handing down a verdict. **The house-name is admitted with one
binding condition: the room never *performs* a tasting.** No verdict reveal, no dramatic score, no theatre
(rule B2). It is a work bench with the household's own judgement at the end of it.

### 5.1 Emotional purpose

| It must feel | How the room produces it |
|---|---|
| **Clear-eyed** | The clearest task light in the house (Blueprint § 5.1). You can see exactly what is in front of you, without flattery. |
| **Capable** | The household is the one examining. THA holds the light and lays out what it found; the conclusion belongs to the person at the bench. |
| **Unhurried** | One object at a time, on a clear surface. Nothing competes for the eye while you are looking at a thing. |
| **Trusting** | Every finding is cited; every gap is admitted. The bench earns belief by being honest about what it does not know. |
| **Uncoloured** | The room has no opinion of the household's shopping. A fact about a product is never a fact about the person who bought it. |

**It must never feel like** a verdict machine, a scoring spectacle, a shaming device, or a shop. The single
spine that defeats all four: **THA examines the product, never the person — and never sells the alternative.**

> **The philosophy in one line:** *the Tasting Bench is a clear oak bench under the best light in the house,
> with one thing on it, everything known about that thing laid out plainly beside it, and the judgement left
> where it belongs — with the household.*

### 5.2 Architectural identity — the clearest light, and the window that closes on first use

The Tasting Bench is **E1: light only** — *"the clearest task light in the house"* — with the Blueprint's own
exception: **E2 before first use.**

**The light is the room's ethic made visible.** You cannot examine something honestly in flattering light.
This is the most neutral, clearest, most even-handed light THA has — and it is **still warm**, because the
warmth floor applies in every room and a clinical temperature would leave the house entirely (EL § 3A.1). The
bench is *clear*, not *clinical*: the distinction is the room.

**The window that closes on first use.** Before the household has ever put anything on the bench, the room is
honestly empty — and an honestly empty working room may open the window one level (Blueprint § 6.2 rule 2).
So the **first** visit to the Tasting Bench is at **E2**: the orchard is there, the bench is clear, and the
room reads as an invitation rather than an empty tool. The moment there is an object on the bench, the window
recedes to light and **the work gets the whole room.** This is a governed behaviour, not an invention, and it
is this room's most characteristic moment.

**The planes of the room**

| Plane | What it is | Owner |
|---|---|---|
| **The bench** | The room's ground: a clear oak working plane with the most honest patina in the house — a bench is *used*, and it shows. Mostly empty by design. | Blueprint § 5.1, § 8.2 |
| **The object** | **The examined product, as the object on the bench** — one at a time, the hero of the room. | Blueprint § 5.1 |
| **The findings** | What is known about the object, laid out beside it in reading order on the same bench plane — never a nested panel, never a tabbed report. | Blueprint § 8.2 |
| **The task light** | The clearest, most even light in the house — warm floor intact. | Blueprint § 5.1, § 7 |
| **The plaster · the pressed apple · the doors** | The Kept House, the sole mark, the constant shell. | Arrival § 3; `BRAND2` § 6; Blueprint § 14 |

### 5.3 Interior language

- **Oak and plaster**, carried verbatim — with the bench carrying the house's most honest patina, because a
  work surface that shows no use is a showroom.
- **Where you left off** — the room's one Living Detail: analysis history rendered as **one low card that
  disappears when stale** (Blueprint § 12.2 ceiling). It says *a used bench*, and nothing more. **Never a
  history list, never a log, never a count of how many products you have analysed.**
- **One object at a time.** The bench is not a comparison grid and not a catalogue. Where the Kitchen is many
  objects on a shelf and the Pantry is many objects in strata, **the bench holds one.**
- **Honest uncertainty is a first-class result.** *"We don't know what's in this"* is a complete, dignified
  answer that fills the bench honestly — never a gap papered over with an estimate, and never a confident
  score computed from missing data (Core Principle 6).
- **The voice is plain, specific, and uncoloured.** *What is in this. What that means. What we do not know.*
  No triumph when a product is poor; no congratulation when it is good. The room does not have feelings about
  the household's shopping.

### 5.4 Relationship to neighbouring rooms

- **← Shopping / the outside world.** The bench is where the shop comes into the house. It is the most
  *outward-facing* room in the building, and it is deliberately not near the Entrance Hall: things get
  examined before they are put away.
- **→ The Pantry.** *This is now in the house.* An examined product that the household keeps becomes an item
  on the honest shelves.
- **→ The Kitchen.** *This is now something you cook with.*
- **→ The Garden Room.** *What does this mean nutritionally?* — the bench states processing facts; the
  Garden Room explains them in the same plain register, and neither one grades the household (rules B3, G1).
- **The boundary that matters most:** the bench may show a household **alternatives**, and it may never do so
  on behalf of a partner, a retailer, or a commercial arrangement (rule B9). Partner surfaces belong to **The
  Orchard World**, outside this house — and the bench is precisely where that boundary would be most
  profitable to cross, which is why it is written down.

### 5.5 Desktop · tablet · mobile

The responsive rule for this room is one sentence: **the object stays the hero at every size, and the
findings stay on the same plane as the object.**

| | The room |
|---|---|
| **Desktop** | A wide clear bench; the examined object left-of-centre at real size; findings laid beside it in reading order across the same plane; the clearest light. The Companion at the bench end. **Before first use:** the window opens (E2), the bench is clear, and the room invites. |
| **Tablet** | The object at the top at full size, findings flowing beneath it on the continuous bench plane. Still one object, still one ground. |
| **Mobile** | **The object first and largest — you are holding the packet.** Findings continue below in one column on the same bench. Never a tabbed report, never a verdict card that must be dismissed to reach the evidence, never a score at the top with the working buried. |

### 5.6 Permanent design rules — the Tasting Bench

| # | Rule | Why / owner |
|---|---|---|
| **B1** | **One object at a time.** The examined product is the hero; the rest of the bench is clear surface. Never a comparison grid, never a catalogue, never a nested report panel. | Blueprint § 5.1, § 8.2 |
| **B2** | **No verdict theatre.** No dramatic score reveal, no animated grade, no red/green judgement delivered as a moment. The findings are laid out; they are not performed. | Blueprint § 16; EL § 7 (decorative delight) |
| **B3** | **THA examines the product, never the person.** A fact about a product's processing is never a fact about the household that bought it. No shaming, no congratulation, no implied verdict on the shopper. | Brand Constitution; EL § 5.5; Experience Architecture § 4 |
| **B4** | **The clearest light in the house — and still warm.** Honesty is never clinical; the warmth floor applies here as everywhere. | Blueprint § 7; EL § 3A.1 |
| **B5** | **Honest uncertainty is a first-class result.** *"We don't know"* is a complete answer. Never estimate into a gap; never compute a confident score from missing data. | Core Principle 6; ARCHITECTURE_PRINCIPLES Principle 6 |
| **B6** | **Every finding is cited and can show its working.** | Core Principle 6; capabilities/analyser.md |
| **B7** | **E1 while working; E2 before first use only** — and it returns the moment an object is on the bench. Never two levels. | Blueprint § 6.2 rules 1–2 |
| **B8** | **Where you left off is one low card that disappears when stale** — never a history log, never an analysis count, never a "products examined" statistic. | Blueprint § 12.2 (ceiling) |
| **B9** | **The bench never sells.** Alternatives, where shown, serve the household and are chosen on the household's evidence — never on a partner's behalf. Commercial surfaces belong to The Orchard World, outside this house. | Experience Architecture § 4; Brand Constitution (*what THA will never become*) |
| **B10** | **Never a gotcha.** The tone toward a heavily-processed product is informative — never triumphant, never scolding, never a moment of drama. | EL § 5.5, § 7; Brand Constitution |
| **B11** | **Season appears in the food, never in the room.** | OHDB § 11 |
| **B12** | **Same house, carried verbatim.** | Arrival § 3; HOUSE6 P11 |

---

## 6. Room 7 — The Family Journal *(Diary)*

> **The quietest room in the house, and the only one with no job.** Every other room helps the household do
> something. The window seat asks nothing at all — and that is precisely its purpose.

### 6.0 The name, and the ownership question it raises

The mission calls this the **Family Journal**; the Blueprint calls it **the window seat** (§ 5.1) and gives
it the Living Detail *"Yesterday's trace — **the person's own** last entry"* (§ 12.2). The place and the
object agree: **the lap desk in the window seat holds the journal.** But *"Family"* and *"the person's own"*
do not automatically agree, and the difference is real.

**The resolution, stated as design:** the window seat is **a personal seat in a family house.** The journal
may hold a household's shared record of its food life, but **what a person wrote is theirs** — and Yesterday's
Trace shows *you* your own last line, never another member's. Sharing an entry is an act the person takes, and
never a default (rule J3).

**And the platform has already answered it — in the other direction.** `food_diary_days`,
`food_diary_entries` and `food_diary_metrics` are **all `userId notNull` with no household column at all**
(`shared/schema.ts:1314-1337`). So today the "Family Journal" is factually **a personal journal**, and the
mission's name describes a room the platform does not yet have.

**This design takes the platform's side, not the name's.** The window seat *should* be personal — the
Blueprint's own Living Detail says *the person's own last entry*, the lap desk is the material tell, and J3
is the rule either way. So the scoping is not a gap to close; **it is very nearly right already.** What is
wrong is one seam, and it is worth naming because it is the same seam COOK1 found in the Kitchen:

> **The one-way seam.** The Planner is **household**-scoped (`planner_weeks.householdId`,
> `schema.ts:426`), and diary entries carry `sourcePlannerEntryId` (`:1331`). So **a household-scoped plan
> flows into a user-private diary** — the family plans together and only one member can see what became of
> it. That is a real ownership question above this document (§ 12.2, D3), and it is the *Planner→Journal*
> direction that needs deciding, not the Journal's own scope.

### 6.1 Emotional purpose

| It must feel | How the room produces it |
|---|---|
| **Quiet** | The most air in the house (Blueprint § 5.1). Quiet is produced by *space*, never by dimming. |
| **Reflective** | A gathered pool of the same morning; a lap desk; nothing else competing for attention. |
| **Gently remembered** | *Yesterday's trace* — one line of the person's own, only when true. The room remembers you without studying you. |
| **Private** | A lap desk is *held*; a table is *shared*. The material says whose this is before a word is read. |
| **Unhurried** | Nothing here is due. There is no streak to keep, nothing incomplete, and no prompt waiting. |

**It must never feel like** a mood tracker, an analytics surface, a wellness journal with prompts and scores,
or a place that reads your own writing back at you as insight. The single spine that defeats all four: **the
room asks nothing and analyses nothing.** The moment the Diary starts interpreting entries, the window seat
becomes surveillance, and the household will feel it long before they can name it.

> **The philosophy in one line:** *the Family Journal is a lap desk in a pool of quiet morning light, with
> more air around it than anywhere else in the house — a place that remembers you and never studies you.*

### 6.2 Architectural identity — the most air in the house

The Family Journal is **E2, softly — quiet, never dim** (Blueprint § 5.1). Its own move is not the window; it
is **space**. Where the Family Table is dense with a week and the Tasting Bench is dense with findings, the
window seat is **mostly empty, on purpose** — the most generous margins, the narrowest single column, the
largest untouched surface in the product.

**The one mistake this room invites, and the rule that closes it.** The instinct when asked for "quiet,
reflective" is to *turn the lights down* — a dimmer room, muted type, drained colour. **That is the
counterfeit calm the Experience Language names** (§ 3A.4) and OHDB § 13.6 forbids explicitly: *"dimming the
room to signal reflective — quieter is never darker."* So the rule, plainly: **quiet is air, never dark.**
The window seat gets its hush from *less content and more space*, and its light stays the same morning as
every other room, simply gathered into a pool where the person sits.

**The planes of the room**

| Plane | What it is | Owner |
|---|---|---|
| **The lap desk** | The room's ground: small, personal, held — **not** a table (the family's), **not** a bench (the work's), **not** a shelf (the store's). Its scale is the tell that this room is one person's. | Blueprint § 5.1, § 8.2 |
| **The air** | The room's real material. The most generous margins in the house, at every breakpoint. | Blueprint § 5.1 |
| **The gathered pool** | E2, softly — the same morning, gathered where you sit rather than spread across the room. Quiet, never dim. | Blueprint § 5.1, § 7; OHDB § 13.6 |
| **The plaster · the pressed apple · the doors** | The Kept House, the sole mark, the constant shell. | Arrival § 3; `BRAND2` § 6; Blueprint § 14 |

### 6.3 Interior language

- **Oak lap desk, matte plaster, the pool of light** — the Kept House at its most restrained.
- **The household's own words are the content.** THA's voice is quieter here than anywhere in the product:
  a serif heading in the household's register, and then *their* words, given room.
- **Yesterday's trace** — the room's one Living Detail: one line from the person's own last entry, **only when
  true, and never analysed back unasked** (Blueprint § 12.2 ceiling). Those seven words are the whole ethic of
  the room. When there is nothing true to show, the trace is simply absent and the room is still complete.
- **Nothing is due.** No prompt, no "you haven't written in five days", no streak, no completion, no empty
  state that reads as a failure to fill. An empty journal is a clean desk in good light, which is a perfectly
  pleasant thing to arrive at.
- **The Companion is at its most restrained here.** Present in its usual corner, available, and **silent about
  what was written.**

### 6.4 Relationship to neighbouring rooms

The window seat is **off the main run of the house.** You do not pass through it on the way to anywhere — you
go to it. That is deliberate and it is why it is the last room in the Walking Journey.

- **← From everywhere.** A meal worth remembering, a good week, a note about how something went. Every room
  can hand the journal something; none of them insists.
- **→ Nowhere.** **This is the only room in the house with no onward action**, and it is correct. It is where
  the journey rests. A "next step" here would be the product refusing to let the household stop, which is the
  precise opposite of what this room is for (rule J9).
- **Its relationship to the Garden Room is a boundary, not a door.** The Garden Room analyses *food*. The
  Family Journal holds *words*. THA may reason over what the household ate; it never reasons over what the
  household wrote (rule J2).

### 6.5 Desktop · tablet · mobile

The responsive rule for this room inverts every other room's: **it gets *more* air on a smaller screen, not
less.** Density is the enemy here, so the small screen is treated as an opportunity for quiet rather than a
constraint on content.

| | The room |
|---|---|
| **Desktop** | A very generous margin; one narrow column of entries, centre-left; the soft window pool to the right; the lap desk plane beneath. Nothing else in the room. The largest untouched surface in the product. |
| **Tablet** | The column centred, the pool of light gathered above it. Margins stay generous — the tablet does not "fill up" because it can. |
| **Mobile** | The single column, with **the most generous line-height and margins anywhere in THA.** One entry reads as one entry. Never a compressed feed, never two columns, never a card list. |

### 6.6 Permanent design rules — the Family Journal

| # | Rule | Why / owner |
|---|---|---|
| **J1** | **The room asks nothing.** No prompt, no streak, no *"you haven't written in five days"*, no completion state, no goal. | EL § 5 (Completion); Blueprint § 12.1 |
| **J2** | **Never analysed back unasked.** THA does not read the household's own words back to them as insight, mood, sentiment, theme, or pattern. Reasoning over food is the Garden Room's; reasoning over *writing* is nobody's. | Blueprint § 12.2 (ceiling); Core Principle 6 |
| **J3** | **A person's words are theirs.** The house never surfaces one member's entry to another. Sharing is an act the person takes, never a default. | Blueprint § 12.2; EL § 5.8 (data owned by the household) |
| **J4** | **Quiet is air, never dark.** The room is hushed by space and restraint — never by dimming light, muting type, or draining colour. Quieter is never darker. | OHDB § 13.6; EL § 3A.4 |
| **J5** | **The most air in the house, at every breakpoint — and more on small screens, not less.** | Blueprint § 5.1, § 8.2 |
| **J6** | **Yesterday's trace is one line, only when true.** Absent when there is nothing true; the room is complete without it. | Blueprint § 12.2 (ceiling), § 12.1 rule 3 |
| **J7** | **The lap desk is personal; the table is the family's.** Never merge the two ground postures — the scale is how the household knows whose room this is. | Blueprint § 5.1, § 8.2 |
| **J8** | **No mood tracking, no sentiment analysis, no wellness scoring — ever.** This is a regression, not a feature, and it is named here so it is refused on purpose. | EL § 7; Brand Constitution (*what THA will never become*) |
| **J9** | **No onward action.** The journey rests here. The room never hands the household a next task. | EL § 5 (Completion) |
| **J10** | **The Companion is at its quietest.** Present, available, and silent about what was written. | Blueprint § 13; EL § 5.7 |
| **J11** | **Season appears in what was written, never in the room.** | OHDB § 11 |
| **J12** | **Same house, carried verbatim.** | Arrival § 3; HOUSE6 P11 |

---

## 7. Room 8 — The Mirror *(Profile / Household)*

> **The room the rest of the house rests on.** If the Mirror is wrong, every other room is confidently wrong.

### 7.0 The name, settled — and the two mirrors THA refuses

The mission calls this the **Mirror**; the Blueprint calls it **the family record** (§ 5.1). This is the one
name that needs care, because *mirror* is the most dangerous metaphor available to a food product: mirrors
mean appearance, weight, self-assessment, vanity, judgement.

**The house-name is admitted in exactly one sense — the honest one.** A good mirror shows what is there,
without flattery and without distortion. THA's Mirror reflects **the record**: the people, their
preferences, their restrictions, and everything THA holds about them — accurately, correctably, with no dark
corners. It reflects; **it never appraises.**

Two mirrors are named so they are refused on purpose:

| The refused mirror | What it would be | Rule |
|---|---|---|
| **The funhouse mirror** | A flattering distortion — a tidier, rosier picture of the household than what THA actually holds. A record that is easier to look at than it is true. | **M4** |
| **The bathroom scale** | The mirror that judges — weight, bodies, progress, "how you're doing". The moment this room appraises a person rather than reflecting a record, THA has become the thing it exists not to be. | **M5** |

### 7.1 Emotional purpose

| It must feel | How the room produces it |
|---|---|
| **Respected** | The people are the room's content, first and at real size — never rows in a settings list (OHDB § 13.7: *never treating people as form fields*). |
| **First-class** | Every household shape is the design's subject; none is the "default" and none an exception (EL § 5.8). |
| **In control** | Everything THA knows is visible here and correctable here. The household owns its record. |
| **Unsurprised** | **No dark corners** (EL § 5.8). Nothing THA holds about a household is discoverable anywhere but here, and nothing here is a surprise when found. |
| **Consequential** | A change shows what it will change — including how it will shape future guidance (EL § 5.8, Understanding). |

**It must never feel like** a settings screen, an account page, a form, or an assessment. The single spine
that defeats all four: **this is a record of people, and the people come first.**

> **The philosophy in one line:** *the Mirror is the household's own record, in even and unshadowed light —
> the people first and at real size, everything THA knows beneath them in an order that never moves, all of
> it true and all of it theirs to correct.*

### 7.2 Architectural identity — the only room with no shadow

The Mirror is **E1: light only**, and its light character is unique in the house: **even, honest,
unshadowed** (Blueprint § 5.1).

**This is the only room in THA with no directional light.** Everywhere else the morning comes from
somewhere — a full wall (Home), the side (Kitchen), a high corner (Pantry), across the table (Planner), a
gathered pool (Journal), the clearest task light (Bench). Here it is *even*, and the reason is the room's
promise: **a shadow is somewhere a thing can hide, and this room has no dark corners.** The light is the ethic
again, exactly as the Bench's clarity is and the Journal's air is.

**Anchored strata.** The ground posture is *the record; anchored strata* (Blueprint § 5.1) — tiers, like the
Pantry, but where the Pantry's strata hold *things*, the Mirror's hold *the record*, and **anchored** means
the order never shuffles. The household finds the same thing in the same place every time, at every
breakpoint. **Permanence is how a record earns trust**: a record that rearranges itself is a record you have
to re-read.

**The planes of the room**

| Plane | What it is | Owner |
|---|---|---|
| **The people** | The room's content and its top stratum: the household's members, at real size, in the canonical avatar/name treatment. Not a header above the settings — **the subject of the room.** | Blueprint § 5.1, § 12.2 |
| **The anchored strata** | Beneath them, in a permanent order: what THA knows · how it is used · what is yours to correct. Each stratum one plane, never nested. | Blueprint § 5.1, § 8.2 |
| **The even light** | The only unshadowed light in the house — no emphasis lighting, because no fact here is louder than another. | Blueprint § 5.1, § 7 |
| **The plaster · the pressed apple · the doors** | The Kept House, the sole mark, the constant shell. | Arrival § 3; `BRAND2` § 6; Blueprint § 14 |

### 7.3 Interior language

- **The Kept House materials**, carried verbatim, in the house's most even light.
- **The family, first-class** — the room's one Living Detail: the canonical avatar and name treatment drawn
  from real household membership, saying *this is a record of people*. **No album theming, no cover imagery,
  no profile decoration** (Blueprint § 12.2 ceiling; OHDB § 13.7, *the costume*).
- **Preferences read as facts about people, never as configuration.** *"Sam doesn't eat fish"* — a sentence
  about Sam. Not a checkbox labelled `pescatarian`, not a toggle in a list, not a tag on a chip. This single
  translation is the difference between a family record and an account settings page.
- **Every change states its consequence, at the moment of the change.** *"From now on, the Kitchen and the
  Family Table will leave fish out of Sam's meals."* The Mirror is upstream of the whole house, so it is the
  one room that owes the household a plain sentence about what its edit will do elsewhere (EL § 5.8).
- **The voice is respectful and plain.** The household, in the second person. Never *"user"*, never
  *"profile"*, never *"account settings"* as this room's name inside the house.

### 7.4 Relationship to neighbouring rooms

The Mirror is **upstream of everything**, which gives it a relationship no other room has: it does not *hand
off* to its neighbours, it **shapes** them.

- **→ The Kitchen.** What this room holds decides which of the family's dishes are surfaced and how.
- **→ The Family Table.** Restrictions and preferences shape every suggestion the table offers.
- **→ The Garden Room.** Household composition is what nutrition is read *for* — and getting it wrong makes
  every figure in that room confidently wrong.
- **→ The Tasting Bench.** What the bench flags for this household depends entirely on what the Mirror holds.
- **→ The Pantry, Shopping, and the Companion.** All of them read this record.

**Which is why the Mirror carries the house's trust.** Every other room can be wrong in one room's worth of
ways. The Mirror can be wrong in all of them at once — silently, and with total confidence. That is the
argument for M3 (*no dark corners*) and M8 (*every change shows its consequence*), and it is why this room,
despite being the least glamorous in the house, is the one whose correctness matters most.

### 7.5 Desktop · tablet · mobile

The responsive rule for this room is one sentence: **the people never get smaller, and the order never
changes.**

| | The room |
|---|---|
| **Desktop** | The household across the top — the people, first-class, at real size, in even light. Beneath them the anchored strata on the same ground: what THA knows, how it is used, what is yours to correct. E1 throughout. |
| **Tablet** | The people as a band at the top, unshrunken; the strata below in the identical order. |
| **Mobile** | **The people first and unshrunken — the one thing in THA that never gets smaller on a small screen.** The strata continue as one column, in the **identical** order to desktop. *Anchored* means anchored at every size; a record that reorders itself on a phone is not anchored. |

### 7.6 Permanent design rules — the Mirror

| # | Rule | Why / owner |
|---|---|---|
| **M1** | **The people come first, at real size, at every breakpoint.** Never a settings list with an avatar at the top. | Blueprint § 12.2; OHDB § 13.7 |
| **M2** | **People are never form fields.** A preference is a sentence about a person, not a labelled toggle or a tag. | OHDB § 13.7; EL § 5.8 |
| **M3** | **No dark corners.** Everything THA holds about a household is visible here and correctable here. A fact THA holds and will not show is a defect, not a design choice. | EL § 5.8; Brand Constitution (*Our Responsibility*) |
| **M4** | **Never the funhouse mirror.** The record is shown as it is — never a tidied, rosier, or more flattering version of what THA actually holds. | Core Principle 6; Brand Constitution (the Trust Test) |
| **M5** | **Never the bathroom scale.** The Mirror never assesses bodies, weight, progress, or performance. It reflects a record; it does not appraise the household. | Brand Constitution; EL § 5.5; parallel to G1 |
| **M6** | **Even, unshadowed light.** No emphasis lighting; no fact in the record is presented as louder than another. | Blueprint § 5.1, § 7 |
| **M7** | **Anchored strata — the order is permanent and identical at every breakpoint.** Trust is knowing where a thing will be. | Blueprint § 5.1, § 8.2 |
| **M8** | **Every change states its consequence, at the moment of the change** — including how it will shape future guidance. | EL § 5.8 (Understanding) |
| **M9** | **Every household shape is first-class; none is the default.** No "primary user", no "head of household", no shape treated as an exception or an edge case. | EL § 5.8; Brand Constitution (Household First) |
| **M10** | **No profile theming, no cover imagery, no album styling.** | Blueprint § 12.2 (ceiling); OHDB § 13.7 (*the costume*) |
| **M11** | **Nothing irreversible as a side effect.** Destructive change is guarded proportionally to its consequence and never happens incidentally. | EL § 5.8 (Completion) |
| **M12** | **Same house, carried verbatim.** | Arrival § 3; HOUSE6 P11 |

---

## 8. The Companion — the presence, not a room

The mission is explicit and so is the governing architecture: **the Companion is not a room.** It is *the
person in the house* — the knowledgeable friend at the counter, always in the same place, comfortable in
every room, never following the household around talking (Experience Blueprint § 13).

Its conduct is owned by Experience Architecture § 11; its feeling by Experience Language Principle 7 and
§ 5.7; its knowledge and voice by the Intelligence Governance documents (INT17 context composition; PKR2
§ 12 for product knowledge); its words at each moment by the Intelligence Language Guide. **This document
adds nothing to any of that.** It records only how the presence reads in the five rooms designed here.

### 8.1 What is constant, in all eight rooms

- **One mark, one fixed chair** — the same carved sage apple, in the same corner, in every room.
- **The light of the room it opens in** — never differently lit, or it becomes a stage (Blueprint § 13).
- **It arrives a beat after you** — manners rendered as the one governed motion exception, and its entire
  sign of life. No pulse, no face, no typing theatrics, no simulated mood (Blueprint § 12.2, § 13).
- **Silence is always valid.** A quiet Companion in a quiet moment is the design working, not failing.
- **It suggests; it never decides.**

### 8.2 What it is *for*, room by room

| Room | What the friend is for here | The line it must never cross |
|---|---|---|
| **Entrance Hall** | One warm true sentence about the household's day. | Never invented good news; a quiet day stays quiet. |
| **Kitchen** | A seasonal or timely nudge toward a dish they already know. | Never picks tonight's dinner (HOUSE5 K8). |
| **Pantry** | Connects what you *have* to what you *might do*. | Never a scarcity alarm; silent when nothing connects (HOUSE6 P7). |
| **Family Table** | Grounded, refusable suggestions for an open day. | **Never plans the week**; nothing is ever auto-filled (T6). |
| **Garden Room** | Explains a figure in plain words, on request. | **Never grades**; never converts a fact into an instruction (G1, G9). |
| **Tasting Bench** | Holds the light — explains what a finding means and what is unknown. | **Never delivers the verdict**; the judgement is the household's (B2, B3). |
| **Family Journal** | Present, available, and quiet. | **Never comments on what was written** (J2, J10). |
| **Mirror** | Explains what a change will do elsewhere in the house. | **Never edits the record itself** (M8, M11). |

### 8.3 Why there is no Support Hub in this house

The mission names four things the Companion carries everywhere: **intelligence, guidance, knowledge, and
product help and issue reporting.** The last of these is the reason the Support Hub is out of scope rather
than merely deferred.

**Help never relocates the household.** A person who is confused in the Family Table is helped *in the
Family Table* — by the friend already standing there, who can see the room they are in. Sending them to a
help centre would be the house admitting that its rooms cannot answer for themselves, and would break the
one thing the Companion exists to provide: *the knowledgeable friend, here, now.* Product help and issue
reporting are therefore **Companion functions in every room**, not a destination — which is exactly why a
Support Hub belongs to a different programme (The Orchard World) and not to this house.

---

## 9. THE COMPLETE HOUSE BLUEPRINT

**Eight rooms, one house, one morning.** Three are permanent foundation; five are designed above. The
Companion is a presence throughout, and the Orchard World lies outside the walls.

### 9.1 The house, stated once

| # | Room | Domain | Place identity | Exposure | Light | Ground posture | The hero | Living Detail | The verb | Must never be |
|---|---|---|---|---|---|---|---|---|---|---|
| **1** | **Entrance Hall** | Home | The threshold and the heart | **E3** | Full morning — the brightest room | Compact counter; the view keeps its share | **The view** | The greeting in THA's hand | *Arrive* | A dashboard |
| **2** | **Kitchen** | Cookbook | The recipe book by the window | **E2** | Warm side-light across the page | Shelf; cards as objects you pick up | **The food** | The well-thumbed page | *Recognise* | A recipe database |
| **3** | **Pantry** | Pantry | The pantry, orchard beyond | **E2** — smallest | Practical, morning-warm | Shelf strata | **The shelves** | Freshness, honestly told | *See* | Stock management |
| **4** | **Family Table** | Planner | The family table | **E1** | Even working light; the sun on today | One solid table holding the week | **The week** | The sun on today | *Decide* | A spreadsheet |
| **5** | **Garden Room** | Nutrition | The noticeboard by the garden view | **E2** | Garden-bright, optimistic | Noticeboard over a solid data tier | **The plain sentence** | The garden filling in | *Understand* | A scorecard |
| **6** | **Tasting Bench** | Analyser | The work bench | **E1** (E2 before first use) | The clearest task light in the house | The bench; the product as the object on it | **The object** | Where you left off | *Examine* | A verdict machine |
| **7** | **Family Journal** | Diary | The window seat | **E2**, softly | A gathered pool of the same morning | Lap desk; the most air in the house | **The air** | Yesterday's trace | *Remember* | A mood tracker |
| **8** | **Mirror** | Profile / Household | The family record | **E1** | Even, honest, unshadowed | The record; anchored strata | **The people** | The family, first-class | *Correct* | A settings screen |
| **—** | **The Companion** | — | The friend at the counter — **a presence, not a room** | — (foreground) | The light of the room it opens in | Floating | **The friend** | Arrives a beat after you | *Accompany* | A room of its own |

*(Rooms 1–3 and every value in their rows are owned by their locked documents; rooms 4–8 restate the
Experience Blueprint § 5.1 map and add only the binding of those owned attributes into one room each.
Shopping and Admin exist in the § 5.1 map and are not designed here — Shopping remains open, Admin belongs
to The Orchard World.)*

### 9.2 The exposure gradient — the shape of the whole house

The house has one governing spatial law, and read across all eight rooms it becomes a single legible
gradient (Blueprint § 6.2): **orchard exposure is inversely proportional to functional density.**

```
E3  ██████████  Entrance Hall .............. the view IS the purpose
E2  ██████      Kitchen ..................... a window to the side, over the work
E2  ████        Garden Room ................. a garden-bright window beside the noticeboard
E2  ████        Family Journal .............. a soft gathered pool, quiet never dim
E2  ███         Pantry ...................... the smallest window in the house
E1  ░░░         Tasting Bench ............... light only  (E2 before first use)
E1  ░░░         Family Table ................ light only
E1  ░░░         Mirror ...................... light only, and unshadowed
E0  ·           [Orchard World: Admin] ...... lit from the hall
```

**Read downward, it is the house's whole argument in one column:** as the household's eye is asked to work
harder, the orchard withdraws — first to a window, then to a glimpse, then to light alone — and it never once
becomes wallpaper behind the work. **The light never leaves; only the view does.**

### 9.3 What makes it one house

Constant in every room, without exception, and never varying per domain (Blueprint § 5.2):

**The shell** · the canonical component owners · the semantic tokens and both palettes · the type scale and
its three voices · the motion vocabulary · the state law (loading / empty / error) · the one Companion · the
accessibility floors · the two-second rule · **and, from the three locked rooms:** Concept B architecture,
the Kept House materials, the one morning, the pressed apple, the Companion apple.

> **A room that needs to break any of these to feel like itself has not been designed yet.**
> *(Experience Blueprint § 5.2, quoted.)*

### 9.4 How each room earns its own personality

Every room is the same architecture. Each differs by **exactly one deliberate move** — and that discipline is
what makes eight rooms one building rather than eight themes:

| Room | The one move |
|---|---|
| **Entrance Hall** | The window opens to a full wall — the view *is* the purpose. |
| **Kitchen** | The window **turns to the side**, and the food becomes the hero. |
| **Pantry** | The window **shrinks to a glimpse**, and the shelves become the hero. |
| **Family Table** | The window **closes to light**, and one solid table holds the week. |
| **Garden Room** | The window stays, and **the tiers invert the industry** — words above numbers. |
| **Tasting Bench** | The light becomes **the clearest in the house**, and the bench holds one object. |
| **Family Journal** | The room **empties** — the most air in the house, and quiet made of space. |
| **Mirror** | The light becomes **even and unshadowed**, and the people come first. |

---

## 10. THE WALKING JOURNEY — from arrival to reflection

*This is the house walked, not the house listed. One morning, one household, one continuous building.*

**You arrive.** The door opens onto the **Entrance Hall**, and the orchard is a full wall of morning behind
real glass — the same view as yesterday, from the same place. The oak sill is worn a shade lighter where
hands have rested. Someone has already thought about today: three quiet true sentences on the wall, or, if
the day is quiet, three honest absences said with dignity — *a clear morning · the list is clear · blossom
this week.* The apple is pressed into the plaster to your right, tone-on-tone, for the eye to find. Nothing
is asked of you. You are simply home.

**You go through to the Kitchen.** The plaster does not change, the oak does not change, the morning does not
change — but the window turns to the side, over the worktop, and the light comes *across* the page. There on
the open shelf is your own book: the things you cook, warm because the food is warm, known because the book
is yours. A page you have opened many times sits a half-step warmer than the others — nobody labelled it; it
just fell open that way.

**You reach to the shelf, and you are in the Pantry.** The window shrinks to a glimpse high in the corner,
because here the work is looking. Your shelves, in their strata: what is in the house right now, told kindly.
The squash is getting on — *lovely roasted.* Nothing is a failing. When the cupboard is light, the room only
says so warmly.

**You carry it all to the Family Table.** The window closes, and the room does not dim — it broadens. The
same morning falls across one solid oak plane, wide enough for the whole week, warmer where today sits.
Thursday is open, and it is a laid place, not a gap. You set Tuesday down. The friend at the end of the table
offers something grounded, and you take it or you don't. When the week is done, it says so and stops asking.
**The plan is made.**

**Later, you wonder how it looked, and you step into the Garden Room.** Garden-bright, optimistic. On the
noticeboard, a few true sentences in plain words — *a good spread this week; twenty-eight different plants
this month* — and beneath them, solid and reachable, every figure that backs them up, with its working. No
grade. No target you did not set. Nothing to be behind on. You leave informed and calm, and nothing follows
you out with an instruction.

**Something comes into the house from the shop, and you take it to the Tasting Bench.** The clearest light in
the house — still warm, never clinical — falls on a clear oak bench with one thing on it. Here is what is in
this. Here is what that means. Here is what we do not know, said plainly rather than guessed at. The house
has no opinion about your shopping; it just holds the light while you look. *(The first time you ever came
here, the bench was clear and the window was open — the room invited you before it worked for you.)*

**And when the day is done, you go — not through, but *to* — the window seat, and the Family Journal.** The
most air in the house. A lap desk, a pool of the same morning gathered where you sit, quiet but never dim.
One line of your own from last time, only because it was true. Nothing is due. Nothing is analysed back at
you. The friend is there in the corner and says nothing about what you wrote.

**And once in a while you stand in front of the Mirror.** Even light, no shadows, no corners. Your household
— the people, first and at real size, not a list of fields. Everything THA knows about you, in an order that
never moves, all of it true and all of it yours to change. You correct one thing, and the house tells you
plainly what will be different tomorrow.

**Then back to the Entrance Hall, where every journey ends as well as begins.** The orchard is where it was.
The light has not moved. It is the same house — and it is still morning.

---

## 11. THE HOUSE CONSTITUTION

**The permanent principles every future room or feature must obey to belong within The Healthy Apples
House.** These are not new law. Each article binds an existing owner's rule into the form a person building
a new room can actually check — and **where any article and its owner conflict, the owner prevails and this
document is corrected.**

### Article I — One house
Every room is the same house. The shell, the component owners, the tokens and palettes, the type scale and
its voices, the motion vocabulary, the state law, the one Companion, the accessibility floors, the two-second
rule, the Concept B architecture, the Kept House materials, the one morning, the pressed apple. **A room that
must break any of these to feel like itself has not been designed yet.** *(Experience Blueprint § 5.2)*

### Article II — One morning, one orchard
One canonical environment, one season, one sun. Rooms differ by *how much* orchard, never by *which* orchard,
and never by what hour it is. No room gets its own variant, angle, season, weather, or second sun. *(Blueprint
§ 6.1, § 7, § 16)*

### Article III — Exposure is a governed constant, and it obeys the inverse law
Every room declares its exposure once, on the E0–E3 scale, and **the more the eye is asked to work, the
further the orchard recedes.** Exposure is never a per-surface or per-component choice, never adjusted for
taste mid-feature. An honestly empty room may open one level, **never two**, and returns the moment content
exists. *(Blueprint § 6.2)*

### Article IV — The light never leaves; only the view does
Every room is lit by the same morning. A working room is not a darker room — **E1 is broader, not dimmer** —
and a quiet room is quiet because it has *more air*, not less light. **Quieter is never darker.** *(Blueprint
§ 7; OHDB § 13.6; Experience Language § 3A.4)*

### Article V — One ground, never nested
Each room has one ground posture — a counter, a shelf, strata, a table, a bench, a lap desk, a record — and
its content are **objects on that ground**. Never a card inside a card, never a grid of metric tiles, never a
dashboard. *(Blueprint § 8.2; TRANSLATION1)*

### Article VI — The household's own life is the only ornament
Nothing decorative is ever placed in a room. The warmth comes from the household's real food, real shelves,
real week, real record, and the honest patina of use. **Data-borne or dead:** a detail that must invent
content to exist is fabricated feeling, and forbidden by construction. *(Blueprint § 12.1; Core Principle 6)*

### Article VII — One Living Detail per room, and it is still
At most one sign of life per room — not one kind, **one**. It renders something true from a canonical owner,
is absent when the data is silent, sits below the emphasis budget, carries no status meaning, and **does not
move.** A second detail retires the first in the same decision. Details are admitted one at a time as named
reviewable decisions, never as a batch of charm. *(Blueprint § 12.1)*

### Article VIII — Honest absence, designed first and designed warm
Every room's emptiest state is built **before** its fullest one, because it is the state most households are
actually in — and it gets **more light and more air, never more prompting.** An empty room is never an
accusation, a catalogue of what is missing, a count of what was not done, or a grid of zeroes. **Calm must
never become lifeless.** *(Arrival § 4; HOUSE5 K12; HOUSE6 P10; Blueprint § 6.2 rule 2; EL § 3A.4)*

### Article IX — Never claim more than THA witnessed
Every sentence a room says must match the evidence behind it. THA cannot witness cooking, so it says
*planned*. It cannot date an unanchored week, so it says nothing rather than inventing a day. **An honest gap
always beats an invented fact.** *(Core Principle 6; ARCHITECTURE_PRINCIPLES Principle 6; HOUSE5 K5)*

### Article X — No room ever scores the household
THA reports on the food, the week, the shelves, and the record. **It never grades the people.** No score, no
grade, no rank, no streak, no adherence percentage, no traffic light on a person, no comparison against other
households, and no target THA invented and then measured them against. *(EL § 5.5; Brand Constitution)*

### Article XI — The Companion is a presence, and help never relocates the household
One friend, one mark, one fixed chair, in the light of whatever room it opens in — never a room, never a
stage, never a face, never following the household about. It suggests and never decides; **silence is always
valid.** And because it is present everywhere, a household needing help is helped **in the room they are
standing in.** *(Blueprint § 13; Experience Architecture § 11; EL § 5.7)*

### Article XII — Season lives in the food, never in the room
*"In season now"* is a property of a dish or an item. The house's light, plaster, oak, and orchard never
dress for a date. No autumn leaves, no snow, no blossom-as-decoration, no holiday theming. *(OHDB § 11;
Blueprint § 6.0–§ 6.1; HOUSE5 K7; HOUSE6 P8)*

### Article XIII — The metaphor yields to the work
The house's rooms are **feelings to design toward, never pictures to draw.** If the concept ever fights what
the room actually has to do, **the concept loses.** A household that cannot plan its week has not been served
by a beautiful table. *(Blueprint § 16; OHDB § 13.2)*

### Article XIV — Never draw the metaphor
No drawn table, no drawn book with page-turns, no painted jars, no illustrated garden, no rendered mirror, no
depicted window seat. Rooms are produced by **material, light, and composition** — never by rendering a
picture of themselves. This is the theme park, and it is forbidden in every room. *(Blueprint § 16; OHDB
§ 13; HOUSE5 K9; HOUSE6 P3)*

### Article XV — One owner per rule; this document restates none
Every rule in the house has exactly one owner. A room's rules are the **room-specific face** of an owned
rule, cited so they can be checked and so they never become a second owner. Restating a rule creates a rival
owner of it, and a rival owner is how a house drifts. *(ARCHITECTURE_PRINCIPLES Principle 2; Blueprint
§ 15)*

### Article XVI — The Admission Test: what a new room must answer before it is built
No room joins this house until it can answer all nine, in writing, as a named reviewable decision:

1. **Which room is this?** — its place identity in the house, in the household's language.
2. **How should someone feel here?** — and which of the seven notes of the emotional palette it plays.
3. **What is the one thing this room helps them do?** — the verb.
4. **What is its orchard exposure**, on E0–E3, and why the inverse law puts it there? *(Article III)*
5. **What is its light character**, and how does it stay the same morning? *(Article II, IV)*
6. **What is its one ground posture**, and what are the objects on it? *(Article V)*
7. **What is its one Living Detail**, its data source, and its ceiling — or is it deliberately none?
   *(Article VII)*
8. **What must this room never feel like?** — named specifically, with the defence for each. *(Articles
   VIII–X, XIII–XIV)*
9. **What does its emptiest state look like**, and is it designed first? *(Article VIII)*

*(Questions 1–3 are the Experience Test, Experience Blueprint § 15.3, quoted; 4–9 are the form the house has
used for all eight of its rooms and are the checkable shape of Articles II–XIV.)*

### Article XVII — The one question, asked of every room
Before any room or feature ships:

> **"Does this leave the household with less to carry, and could they trust everything it tells them?"**
>
> *(The Brand Constitution's One Question, quoted. It sits above every checklist in this house, as the
> identity check each of them verifies a part of — never in place of them.)*

---

## 12. PRODUCTION RECOMMENDATIONS

Ordered by dependency. The design is complete; these carry it toward the gated build. **All eight rooms
remain design blueprints — nothing below has been implemented, and each step is a separate, gated change.**

### 12.1 The sequencing

1. **Ship the locked Entrance Hall first.** `HOME_ARRIVAL_PRODUCTION_LOCK` § 7 is already production-ready
   and gated only on two owner decisions (the BRAND2 apple language; the COMP1 § 320 amendment *if* the aware
   light ships — the calm idle button needs none). **Nothing else in the house should be built before the
   room every other room inherits from exists in code.** Every material below is defined by it.
2. **Extract the house language into shared owners in that same change.** The Kept House materials, the
   Concept B joinery, the pressed apple, the Companion apple, the constant shell and the exposure tokens are
   consumed by all eight rooms. If Arrival ships them as page-local CSS, the second room copies them and the
   house has two owners of its own materials by room three. **Adopt them into the register as canonical
   owners at the moment they are first built** (UIA § 17; ADOPTION REGISTER COMPLIANCE).
3. **Retire the orchard bypasses in the shared primitives — before any room below is built.** The Kitchen's
   highest-value move (`COOK1 § 12.2`) and `dialog.tsx:48` (§ 12.2, last row) are the same class of defect:
   the orchard applied as wallpaper behind dense content from a file no room owns. Fixing them centrally
   corrects Article III **in every room at once**, and is the single cheapest correctness win in the
   programme. Doing it per-room instead means fixing it eight times and missing it twice.
4. **Then the Kitchen, then the Pantry**, in the order their documents set.
5. **Then the Family Table.** It is the house's practical centre, the destination of the most-walked path
   (Kitchen → Table), and the source of Home's most important true sentence. Every room built before it is
   waiting on it — and its own table is already right, so the work is mostly **removal** (§ 12.2).
6. **Then the Mirror.** It is upstream of everything and it carries the house's trust: while it is wrong or
   incomplete, every other room is confidently wrong. It is unglamorous and it should not be last.
7. **Then the Garden Room and the Tasting Bench**, in either order — each is self-contained and each depends
   on the Mirror being right.
8. **The Family Journal last** — it is off the main run, it depends on nothing, and it is the room most
   damaged by being rushed. It is also the **largest single distance** from what exists (a three-column
   dashboard) to what is designed (the most air in the house), so it benefits most from the practice the
   seven rooms before it provide.

### 12.2 The distance between these rooms and the live product

The five rooms above are drawn as they should be. This is what they are **today** — recorded so the build is
costed honestly rather than discovered mid-implementation, exactly as HOUSE5 recorded the orchard-as-wallpaper
defect and HOUSE6 recorded the missing freshness field. Every item is cited; none is fixed by this document.

| Room | What it is today | Which rule it fails |
|---|---|---|
| **Family Table** | The table itself is **already right** — one `Card` wrapping one ruled grid (`weekly-planner-page.tsx:2316`). What is stacked *on top of it* is not: **six always-on strips before the first cell** (header, first-visit hint, week tabs, a diets toggle row, the intelligence strip, ambient intelligence) — `PLAN1` § 11.1's *"a lobby, not an arrival"*. Intelligence cards render inside the page's own card chrome. | **T1** (nested grounds) · Article VIII · EL § 5.2 (Arrival) |
| **Garden Room** | `plant-diversity-page.tsx` — a 3-tab surface whose nutrients tab is an assembly of `IntelligenceCard`s, and which ships **a reachable "Health Benefits Explorer" tab marked *Coming soon***. | **G3** (tiers) · **G5**/Article IX — a shipped empty promise is the opposite of honest absence |
| **Tasting Bench** | `products-page.tsx` (2,222 lines) — a **grid of product cards**, plus a product-history `Card` that itself contains a card grid (`:1213-1258`). The bench holds many objects, not one. `UI1:239` also records a **two-owner defect for `AppleRating`** — two components, both rendering, one of them on this page. | **B1** (one object) · Article V · Article XV (one owner) |
| **Family Journal** | `food-diary-page.tsx` (2,092 lines) — a **three-column dashboard** (`:1729`) of metric tiles, a 2×4 stat row (`:1886`) and three chart cards. It is **the densest room in the house where the Blueprint asks for the most air**, and it renders **Profile's own components** (`HealthSnapshot`, `GoalsPreferences`, `CalorieSettings`, imported from `./profile-page` at `:43`). | **J1**, **J5** (the most air) · Article V · **M3**/Article XV — two rooms owning one fact |
| **Mirror** | `profile-page.tsx` — a stack of ~14 `Card` sections. Its **error and loading states render `WorkspaceHeader realm="diary"`** (`:316`, `:330`) while the success path sets its own realm (`:345`): **the room changes identity when it fails to load.** | **M7** (anchored) · Article I |
| **All five at once** | `dialog.tsx:48` hardcodes `url('/orchard-bg.webp')`, bypassing the one canonical owner — so **every dialog in all five rooms puts the orchard behind dense working text.** The global backdrop mount `PLAN1` § 11.2 found is gone (`App.tsx:207-220`, CONV1 BEH-7), but this shared-primitive bypass and four others remain, self-reported as unfixed in `orchard-backdrop.tsx`'s own header. | **Article III** · Blueprint § 6.1 (*the orchard is never wallpaper*) |

**The highest-value single fix in the house is the last row**, and it is one line in a shared primitive: it
violates the orchard law in five rooms at once, from a file none of those rooms owns.

### 12.2a The four named dependencies this design does not pretend to have closed

Each is an ownership or schema fact above this document. The rooms are drawn as they should be; the platform
should grow into them.

| # | The gap | The room it constrains | What it needs |
|---|---|---|---|
| **D1** | **The family's book is N private books.** `COOK1 § 1.1`, § 15.4: `meals.userId notNull`, no `householdId` (`schema.ts:92`). | Kitchen — and, transitively, the Family Table, which plans from it | A schema/ownership decision above this document. Until then *"the family's cookbook"* is a design aspiration, not a fact. |
| **D2** | **Freshness has no field.** HOUSE6 § 8.2: today's `PantryItem` carries no freshness data. | Pantry — its entire signature Living Detail | The field, with honest absence as the default rendering (rule P3). |
| **D3** | **A household plan flows into a private journal.** The Planner is household-scoped (`schema.ts:426`); the diary is `userId notNull` with no household column (`:1314-1337`); entries carry `sourcePlannerEntryId` (`:1331`). | Family Journal ← Family Table | A decision on the **Planner→Journal direction** (§ 6.0). The Journal's own personal scope is **correct and should be kept**; rule J3 holds either way. |
| **D4** | **The Planner cannot know what day it is.** `PLAN1` § 11.4: no date column on `planner_weeks` / `planner_days`. | Family Table — its signature Living Detail | CONV1 P7's `weekStartDate` anchor. Until it resolves, *the sun on today* is **absent, never faked** (§ 3.3). |

Two further live defects are honesty failures rather than ownership gaps, and should be fixed with their
rooms: `PlannerIntelligenceStrip.tsx:152-156` **fabricates a zero** (`PLAN1` § 11.3 — Article IX), and
`planner_entries` **records no author** while `shopping_list` does (`PLAN1` § 6 — nothing owns intra-household
co-authorship, which is what makes the Family Table a *family* table).

### 12.3 The four things to build first *within* each room

A repeating pattern, drawn from what the three locked rooms proved:

1. **Build the emptiest state first, and build it warm.** The quiet day, the empty book, the bare cupboard,
   the open Thursday, the clear bench, the blank journal. Article VIII is not a polish item — it is the state
   most households are in, and building it second always produces a grid of zeroes.
2. **Wire the Living Detail last, and honour its ceiling exactly.** Each is one line in a table
   (Blueprint § 12.2) and each has a documented ceiling that a well-meaning implementer will exceed by
   default — a chip instead of warmth, a badge instead of a shade, a streak instead of a count.
3. **Wire the Companion's line through the Notice Engine, verbatim from its producer** — never templated into
   the page, and always able to say nothing (INT17; IntLang; HOUSE6 § 8.3).
4. **Verify the exposure mechanically.** Every locked room has shipped with a programmatic check that no
   reading content crosses onto the glass (Arrival 12/12, Kitchen 6/6, Pantry 6/6). **Keep the check and add
   the per-room one:** no freshness label computes to a dominant red (Pantry); no verdict colour computes to
   a dominant red (Bench); no day carries a border or a chip (Table); words render above numbers (Garden
   Room); the strata order is identical at all breakpoints (Mirror).

### 12.4 The regressions to refuse on purpose

Each of these is a well-meaning improvement that would quietly leave the house. They are named so they are
refused deliberately rather than debated repeatedly:

**A completion percentage on the week** (T7) · **an "unplanned" count or a red gap** (T2) · **a `TODAY` chip**
(T3) · **auto-filling the week** (T6) · **a nutrition score for the household** (G1) · **a target THA
invented** (G2) · **numbers above the words** (G3) · **a drawn garden or a leaf motif** (G6) · **a verdict
reveal** (B2) · **an analysis-count statistic** (B8) · **a partner-placed alternative on the bench** (B9) ·
**writing prompts or a journal streak** (J1) · **sentiment or mood analysis of entries** (J2, J8) · **dimming
the Journal to signal "reflective"** (J4) · **a profile cover image or theming** (M10) · **a "primary user"**
(M9) · **any weight, body, or progress metric anywhere in the house** (M5) · **seasonal room-dressing in any
room** (Article XII) · **and the orchard restored as a full-bleed backdrop behind dense content, in any room
at all** (Article III).

### 12.5 The governance gates every one of these rooms must pass

Each build is a user-facing implementation and therefore passes, per `docs/architecture/README.md`:

- the **Architecture Compliance Checklist** (`ENGINEERING_WORKFLOW.md`);
- **EXPERIENCE & UI GOVERNANCE COMPLIANCE** — the UX Governance Checklist (Experience Architecture § 18,
  including the Premium Standard block) and the UI Governance Checklist (UIA § 18), with the Experience
  Architecture prevailing in any conflict;
- the **Experience Review Questions** (EL § 6), the **Blueprint Checks** (§ 15.2), the **Experience Test**
  (§ 15.3), and the **Design Character Check** (OHDB § 16.2);
- **PRODUCT REGISTRY COMPLIANCE** — every affected registry entry created, updated, or retired in the same
  change (Rule KC15);
- **ADOPTION REGISTER COMPLIANCE** — every owner created, adopted, or retired recorded in the register, with
  `npm run adoption:check` passing (UIA § 17);
- **AI ARCHITECTURE COMPLIANCE** for any change that wires a Companion line;
- and, above all of them, **Article XVII**.

**If any check fails: STOP, explain why, do not continue.**

---

## 13. What this keeps, and what it never does

**Kept.** The house language of the three locked rooms, carried verbatim into five more: Concept B
architecture, the Kept House interior, the one morning, the pressed apple, the Companion apple, the constant
shell. The orchard is the owner's real `ORCHARD.png`, the same view from the same place, seen through
progressively smaller windows until it is only light. Hospitality before productivity; technology quieter as
it improves; every object earns its place; the household's own life is the only ornament.

**Never done.** No redesign of the Entrance Hall, the Kitchen, or the Pantry — they are read, inherited, and
left byte-untouched. No new architectural idea: every room below is Concept B with **one** deliberate move.
No new colour, token, component, route, string, capability, or behaviour. No room designed for Community,
Partners, Admin, or the Support Hub — those are The Orchard World, a separate programme, and this document
deliberately leaves them outside the walls. No rule restated as if this document owned it. And **no product
source, data source, hook, route, API, behaviour, schema, migration, or test changed** — this is a design
blueprint, exploration only.

---

## 14. Verification

| Check | Result |
|---|---|
| Bootstrap + required reading | ✅ `docs/architecture/README.md`, `HOME_ARRIVAL_PRODUCTION_LOCK.md`, `HOUSE5_KITCHEN_EXPERIENCE.md`, `HOUSE6_PANTRY_EXPERIENCE.md`, Experience Blueprint § 5.1 / § 6.2 / § 12 / § 13 / § 14, OHDB § 13, Experience Language § 5 — read before any change. |
| Git status confirmed · rollback created + recorded | ✅ `rollback/HOUSE-COMPLETE-20260718` → `7bfad50c` (tag `house-complete-wip-snapshot-7bfad50c`; working-tree snapshot `0a6f2fe1`). |
| Run file created | ✅ `.engineering/session/runs/HOUSE_COMPLETE.md`. |
| Three permanent rooms not redesigned or modified | ✅ Read and inherited; **byte-untouched**. No statement in this document alters or re-opens any of them. |
| Five rooms designed | ✅ Family Table (§ 3) · Garden Room (§ 4) · Tasting Bench (§ 5) · Family Journal (§ 6) · Mirror (§ 7). |
| Each room: emotional purpose | ✅ § 3.1 · § 4.1 · § 5.1 · § 6.1 · § 7.1 |
| Each room: architectural identity | ✅ § 3.2 · § 4.2 · § 5.2 · § 6.2 · § 7.2 |
| Each room: interior language | ✅ § 3.3 · § 4.3 · § 5.3 · § 6.3 · § 7.3 |
| Each room: relationship to neighbours | ✅ § 3.4 · § 4.4 · § 5.4 · § 6.4 · § 7.4 |
| Each room: desktop · tablet · mobile | ✅ § 3.5 · § 4.5 · § 5.5 · § 6.5 · § 7.5 — each with one governing responsive rule. |
| Each room: permanent design rules | ✅ T1–T12 · G1–G12 · B1–B12 · J1–J12 · M1–M12 — **60 rules, none new, each cited to its owner**. |
| Companion treated as a presence, not a room | ✅ § 8 — constant in all eight rooms; what it is *for* per room; why there is no Support Hub. |
| 1. The Complete House Blueprint | ✅ § 9 — the eight rooms stated once (§ 9.1), the exposure gradient (§ 9.2), what makes it one house (§ 9.3), the one move per room (§ 9.4). |
| 2. The Walking Journey | ✅ § 10 — arrival to reflection, walked as one continuous building. |
| 3. The House Constitution | ✅ § 11 — seventeen articles, including the **Admission Test** (Article XVI) every future room must answer. |
| 4. Production recommendations | ✅ § 12 — sequencing (§ 12.1), the live-product distance (§ 12.2), four named dependencies (§ 12.2a), what to build first within each room (§ 12.3), regressions refused on purpose (§ 12.4), the governance gates (§ 12.5). |
| Live product surveyed, not assumed | ✅ All five domains' live surfaces read and cited (§ 12.2); six defect classes recorded with `file:line`, none fixed here. **The shared-primitive orchard bypass (`dialog.tsx:48`) violates Article III in all five rooms at once** and is named as the programme's cheapest correctness win. |
| Signature Living Details checked against real data sources | ✅ Two have none today and are recorded as **absent, never faked**: *the sun on today* (D4, no date column) and *freshness, honestly told* (D2). Article VII's *data-borne or dead* applied rather than asserted. |
| Community / Partners / Admin / Support Hub | ✅ **Not designed.** Named as The Orchard World and deliberately left outside the walls (§ 0, § 8.3, § 13). |
| No rule restated without an owner | ✅ Every rule cites its owner; the yield clause is stated at § 0 and Article XV. |
| Product / schema / migration / tests | **None** — design blueprint only. No product file opened or edited. |
| Canonical orchard asset | **Byte-untouched.** Referenced in place; no substitute authored. |

**Honest limitation, stated plainly.** The three locked rooms each shipped with **rendered concepts** —
headless captures at desktop · tablet · mobile with programmatic collision checks, so the design was *judged
rather than asserted*. **This document has none.** It is a written blueprint: its responsive designs (§ 3.5,
§ 4.5, § 5.5, § 6.5, § 7.5) are specified but **not yet rendered or verified**, and its § 12.3.4 checks are
prescribed rather than run. **Rendering the five rooms is the natural next session**, on the Chromium recipe
the three prior sessions recorded — and until then, these five rooms are held to a lower standard of proof
than the three they join. That gap is named rather than hidden.

---

*HOUSE_COMPLETE — The Healthy Apples House. Eight rooms, one morning. You come home to the open view, turn
into the kitchen where the light crosses the page, reach to the shelves that tell you the truth kindly, carry
it to the wide table where the week is decided, step into the garden-bright room that explains without
grading, examine what came in from the shop under the clearest light in the house, sit in the window seat
where nothing is due and nothing is analysed, and stand once in a while in front of the even, unshadowed
mirror that holds your household exactly as it is. The friend is at the counter in every one of them, in the
same corner, arriving a beat after you. The orchard is behind every window, smaller as the work gets closer,
and gone to pure light where the work is hardest — but the light never leaves. It is one house. It is
finished. And it is still morning.*
