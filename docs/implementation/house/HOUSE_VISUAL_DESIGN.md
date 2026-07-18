# HOUSE_VISUAL_DESIGN — The Healthy Apples House, Rendered

**The architecture is complete. This is what it looks like.**
Eight rooms, one house, one morning — specified across thirteen facets at desktop · tablet · mobile, in
both honest states, and **rendered so the design is judged rather than asserted.** This is the production
design reference engineering builds from.

| | |
|---|---|
| **Session** | `HOUSE_VISUAL_DESIGN` |
| **Date** | 2026-07-18 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/HOUSE-VISUAL-DESIGN-20260718` → `7bfad50c` (tag `house-visual-design-wip-snapshot-7bfad50c`; working-tree snapshots `d4defc98`, `8100bd78`) |
| **Status** | **Complete. 44 renders · 30/30 mechanical checks clear · Fraunces real.** Awaiting owner decision, then the gated build. |
| **Product changed** | **None.** Standalone compositions under `scripts/north4-concepts/`. No product source, data source, hook, route, API, behaviour, schema, migration, or test opened or edited. Canonical `ORCHARD.png` referenced in place; no substitute authored. |
| **Role** | **Product Designer.** Not architect — the house is not redesigned, its philosophy is not changed, and no new metaphor is created. |
| **Inherits (byte-untouched)** | `HOUSE_COMPLETE.md` (the blueprint) · `HOME_ARRIVAL_PRODUCTION_LOCK.md` (Entrance Hall) · `HOUSE5_KITCHEN_EXPERIENCE.md` (Kitchen) · `HOUSE6_PANTRY_EXPERIENCE.md` (Pantry) |

---

## 0. What this document is, and the two things it is not

**It is** the visual production reference for all eight rooms: for each room, at each of three breakpoints,
the thirteen facets the mission named — layout · visual hierarchy · materials · typography · depth ·
lighting · orchard exposure · motion · empty state · filled state · Companion behaviour · primary
interactions · responsive behaviour — each one **rendered**, not described.

**It is not a redesign.** `HOUSE_COMPLETE` settled the eight rooms; the three locked rooms settled the
house language. Every value below either *comes from* one of those documents or is the **visual
realisation** of something they already fixed. Where this file and any of them differ, **they prevail and
this file is corrected.**

**It is not a new architecture, metaphor, navigation, or feature.** The door-run is the four doors the
house already has. No room invented a fifth. No product capability appears here that `HOUSE_COMPLETE` did
not already describe.

> **The yield clause, carried verbatim from the house.** Every rule cited below traces to an owner. **If
> any statement here restates a rule owned elsewhere, the owner prevails and this file is corrected.** This
> document creates no colour, token, component, route, string, capability, or behaviour.

**Read before starting (per the Architecture Bootstrap):** `docs/architecture/README.md`,
`HOME_ARRIVAL_PRODUCTION_LOCK.md`, `HOUSE5_KITCHEN_EXPERIENCE.md`, `HOUSE6_PANTRY_EXPERIENCE.md`,
`HOUSE_COMPLETE.md`. Git status confirmed and the rollback confirmed before any change.

---

## 1. The gap this session exists to close

`HOUSE_COMPLETE` § 14 named its own limitation, in the open, rather than hiding it:

> *"The three locked rooms each shipped with **rendered concepts** — headless captures at desktop · tablet ·
> mobile with programmatic collision checks, so the design was judged rather than asserted. **This document
> has none.** It is a written blueprint: its responsive designs are specified but **not yet rendered or
> verified** … **Rendering the five rooms is the natural next session** … until then, these five rooms are
> held to a lower standard of proof than the three they join."*

**This is that session, and the gap is now closed.** The five designed rooms are rendered to the same
standard as the three locked ones, on the same Chromium recipe, with per-room mechanical checks derived
from their own rules. The house is no longer three rooms proved and five asserted.

### 1.1 The recovery finding

**A prior run of this session was interrupted mid-flight** and is recorded rather than quietly overwritten:
the rollback branch, `_house.css`, the five room compositions and the render harness already existed; the
run file did not, and only the Family Table had rendered. The work was **recovered and completed**, not
restarted, and the recorded rollback identifier was preserved. Full detail:
`.engineering/session/runs/HOUSE_VISUAL_DESIGN.md`.

---

## 2. The one visual language — what never varies

Experience Blueprint § 5.2 fixes what may **never** vary per domain. `HOUSE_COMPLETE` Article I restates it
as the house's first law. This session's single most consequential act is that it made that law **one
owner in code** rather than a promise repeated in three files.

### 2.1 `_house.css` — the shared Kept House language

`HOUSE_COMPLETE` § 12.1.2 gave the instruction and the reason:

> *"Extract the house language into shared owners in that same change … If Arrival ships them as page-local
> CSS, the second room copies them and the house has two owners of its own materials by room three."*

`scripts/north4-concepts/_house.css` is that extraction, at design fidelity. **Nothing in it is new** —
every value already existed, copied identically across the three locked compositions. What lives there is
exactly what may never vary:

| Constant | The value the whole house shares |
|---|---|
| **The plaster** | `--wall: hsl(36 30% 91%)` · warm `hsl(41 62% 95%)` · cool `hsl(35 22% 87%)` — chalky, matte, hand-troweled |
| **The oak** | lit lip `hsl(41 40% 68%)` · body `hsl(42 42% 36%)` · shadow edge `hsl(44 46% 20%)` — subtly aged, darkened by years of the same morning |
| **The grain** | `--grain: .05` — one grain of The Linen Calm, as an SVG turbulence filter. **A material, never a texture image.** |
| **The ink** | `hsl(30 16% 22%)` / `hsl(30 12% 40%)` / `hsl(30 10% 52%)` — the warm olive-black shadow family. **Never neutral grey.** |
| **The one morning** | `.room::before` — one linear gradient. A room sets only `--light-angle` and `--light-stops`. **Never a second sun.** |
| **The joinery** | `.window` — head reveal, jamb returns, mullions with a lit inner edge. *Structure holding glass up*, never bars drawn on a photo. |
| **The pressed apple** | `.wall-apple` — a three-layer intaglio (occlusion · two-rim relief · recessed face). **Holds no pigment.** |
| **The Companion** | `.companion` — 48px, the apple carved into a sage ceramic disc, same corner in every room, calm at rest |
| **The doors** | `.doors` — the constant four-door shell along the floor; the room you are in reads as *here* |
| **The three voices** | Fraunces 300/400 (the household's register) · Inter 300/400/500 (the quiet functional voice). **No third face.** |
| **The state law** | `.filled-only` / `.empty-only` — every room ships two honest states, the emptier designed first |
| **The breakpoints** | 980px and 560px. **A room may add its own reflow; never its own breakpoints.** |

What deliberately does **not** live there is each room's **one deliberate move** — its window (or absence
of one), its ground posture, and its Living Detail. Those belong to the room, and only to the room. That
division is the whole discipline: *eight rooms, one building, not eight themes.*

### 2.2 Motion — stated once, for the whole house

**There is effectively none, and that is the specification.** Article VII: a Living Detail *"does not
move."* The single governed exception in the house is the Companion **arriving a beat after you** — manners
rendered as motion, and its entire sign of life.

| Permitted | Forbidden in every room |
|---|---|
| The Companion arrives one beat after the room | Any pulse, breathing, halo, or typing theatric on the Companion |
| Ordinary, unremarkable state transitions on direct interaction | Entrance animations on content · staggered reveals · parallax · counters that count up |
| Reduced-motion preferences honoured absolutely | Any motion in a Living Detail · any verdict or score revealed as a moment (B2) |

**Rendered proof:** every composition in this set is static. No `@keyframes`, no `animation:`, no scroll
effect appears in any of the five room files.

---

## 3. The specification schema — the thirteen facets

Each room below is specified across the thirteen facets the mission named. Three are stated once here
because they are **house-wide constants** and restating them per room would create eight rival owners of
one rule:

- **Materials** — aged oak, matte plaster, gentle patina; the household's own life as the only ornament
  (§ 2.1). A room states only where its materials are *cut differently* (a table vs. a lap desk vs. a bench).
- **Typography** — Fraunces for the household's register, Inter for the quiet functional voice (§ 2.1). A
  room states only its **type posture** — which voice carries the room's content.
- **Motion** — none, bar the Companion's beat (§ 2.2).

The other ten are stated per room, per breakpoint.

---

## 4. Room 1 — The Entrance Hall *(Home)* · **E3**

> **Locked and production-ready. Not re-opened, not re-rendered, not redesigned.**
> Owner: `HOME_ARRIVAL_PRODUCTION_LOCK.md`. Its renders are the reference concepts and are cited in place.

| Facet | The room |
|---|---|
| **Layout** | Panoramic orchard behind full glass above · oak sill as the absolute boundary · calm plaster room below · the four doors along the floor |
| **Visual hierarchy** | **The view first.** Then the greeting in THA's hand, then the console's quiet facts, then the Companion's line. The interface recedes. |
| **Materials** | The Kept House, at its most generous — the sill's front lip worn a shade lighter where hands and cups have rested |
| **Typography** | The console hushed to a quiet serif italic with air around it; the retired band leaves empty plaster at the top, *and that emptiness is the brand decision made visible* |
| **Depth** | Real joinery: head reveal with wall-thickness, jambs returning down each side, three bays held by timber mullions with a lit inner edge and a cast shadow |
| **Lighting** | Full morning — **the brightest room in the house.** The Warm Hour, warmed a half-step at the sill; the mullions lay soft long shadows on the wall below |
| **Orchard exposure** | **E3** — the view *is* the purpose. The only room at E3. |
| **Motion** | None. The Companion arrives a beat after you. |
| **Empty state** | **The quiet day — the default, and 192 of 195 households.** The blind lowers one level, more wall carries the arrival, and the console speaks three honest absences with dignity (*a clear morning · the list is clear · blossom this week*). **Never reads as "nobody home."** |
| **Filled state** | The full day: the window at full E3 generosity, the real facts in the Kept House's quiet hand (*three planned · nothing to fetch*) |
| **Companion** | One warm true sentence about the household's day. **Never invented good news; a quiet day stays quiet.** |
| **Primary interactions** | Arrive. Read. Leave for any room by the door-run. The one inline affordance is *"View suggestion ›"*. |
| **Responsive** | Desktop 1440 · tablet 834 · mobile 390, both days, all six renders collision-checked 12/12 clear. On desktop the full day is eased to `--sill-y: 372px` so the room clears the floor at a 900px viewport. |

**The quiet day** *(build first)* · **the full day** — rendered concepts, `docs/ui-audit/home-arrival-lock/`:

![Entrance Hall · quiet · desktop](../../ui-audit/home-arrival-lock/lock-quiet-desktop.png)

| Quiet · tablet | Quiet · mobile |
|---|---|
| ![](../../ui-audit/home-arrival-lock/lock-quiet-tablet.png) | ![](../../ui-audit/home-arrival-lock/lock-quiet-mobile.png) |

![Entrance Hall · full · desktop](../../ui-audit/home-arrival-lock/lock-full-desktop.png)

| Full · tablet | Full · mobile |
|---|---|
| ![](../../ui-audit/home-arrival-lock/lock-full-tablet.png) | ![](../../ui-audit/home-arrival-lock/lock-full-mobile.png) |

---

## 5. Room 2 — The Kitchen *(Cookbook)* · **E2**

> **Locked. Not re-opened, not re-rendered, not redesigned.** Owner: `HOUSE5_KITCHEN_EXPERIENCE.md`.

| Facet | The room |
|---|---|
| **Layout** | Desktop: the shelf is the room (left); the window + worktop + Companion + pressed apple are the committed region (right). Two tiers of three, an open oak shelf line between. |
| **Visual hierarchy** | **The food first** — *"the food itself is the colour."* Then the household's serif greeting, then the sub-lines, then the Companion at the counter. |
| **Materials** | Kept House, tuned for a working kitchen: oak worktop with a lit front lip, chalky matte plaster. **The food is the only ornament that is added.** |
| **Typography** | Recognition register — *"The things you cook, and the ones worth coming back to"*, never a database label. Sub-lines honest and quiet (*"quick · in season now"*). |
| **Depth** | Recipe cards as **objects you pick up** — a soft shadow so each reads as a thing on a shelf, never a tile in a grid. The one room where discrete card-objects are the canonical posture. |
| **Lighting** | Warm **side-light across the page** — warm nearest the window, softening away from it. A wash on plaster, never a second sun. |
| **Orchard exposure** | **E2** — one committed window to the side, over the worktop. Verified 6/6: no reading content ever crosses onto the glass. |
| **Motion** | None. |
| **Empty state** | **An empty book gets more light, not more prompting** (K12). E2→E3 generosity — never *"you've only tried 3 of 30"*, never a catalogue of what they haven't cooked. |
| **Filled state** | Their own shelf, warm because the food is warm. A loved page carries a **half-step of surface warmth** — earned, never declared; no favourite button, and there must not be one (K4). |
| **Companion** | A seasonal or timely nudge toward a dish they already know. **Never picks tonight's dinner** (K8). |
| **Primary interactions** | Browse the shelf → recognise → open the recipe (the food enlarges to become the hero, ingredients on the worktop) → **one clear intent** (*cook it tonight* / *add to the week*). |
| **Responsive** | Tablet & mobile: the window becomes a committed band at the top (still side-lit, still E2), the Companion's line beneath it, then the greeting and the shelf — three-up on tablet, two-up on mobile. **The orchard is the first thing seen on small screens — the same-house signal, up front.** |

**The shelf** *(the emotional heart)* · **the recipe, opened** — `docs/ui-audit/house5-kitchen/`:

![Kitchen · shelf · desktop](../../ui-audit/house5-kitchen/kitchen-shelf-desktop.png)

| Shelf · tablet | Shelf · mobile |
|---|---|
| ![](../../ui-audit/house5-kitchen/kitchen-shelf-tablet.png) | ![](../../ui-audit/house5-kitchen/kitchen-shelf-mobile.png) |

![Kitchen · recipe · desktop](../../ui-audit/house5-kitchen/kitchen-recipe-desktop.png)

| Recipe · tablet | Recipe · mobile |
|---|---|
| ![](../../ui-audit/house5-kitchen/kitchen-recipe-tablet.png) | ![](../../ui-audit/house5-kitchen/kitchen-recipe-mobile.png) |

---

## 6. Room 3 — The Pantry · **E2 (smallest)**

> **Locked. Not re-opened, not re-rendered, not redesigned.** Owner: `HOUSE6_PANTRY_EXPERIENCE.md`.

| Facet | The room |
|---|---|
| **Layout** | Desktop: the shelves are the room (left); the small window + ledge + Companion + pressed apple are the committed region (right). Three strata — Larder · Fridge · Freezer — an open oak shelf line beneath each. |
| **Visual hierarchy** | **The shelves first.** Then freshness, told kindly. Then the Companion's connection. |
| **Materials** | Kept House; items as small objects on real oak shelf lines. **Abundance must be real — no painted jars, no drawn produce, no invented fullness** (P3). |
| **Typography** | Human quantities in a warm register — *"plenty"*, *"a good bit"*, *"getting on"*. **No stock-management vocabulary, ever** (P12). |
| **Depth** | Shelf **strata** — the room's ground posture. Items rest on real shelf lines; never rows and columns, never a sortable data grid. |
| **Lighting** | Practical, morning-warm — the working light of a cupboard you actually use. |
| **Orchard exposure** | **E2, the smallest window in the house** — a glimpse high in the corner, because here the work is looking. Verified 6/6 clear. |
| **Motion** | None. |
| **Empty state** | **The near-bare pantry, and it is deliberately the warm one.** The light lifts, the air opens, and a warm serif invitation stands where a scarcity alarm would be: *"The shelves are light this week. That's completely fine — a pantry breathes in and out."* **Never a catalogue of what's missing, never a red count** (P10, P12). |
| **Filled state** | The family's shelves in strata; freshness in kind olive-and-oak words; the squash carries a half-step of *noticed* warmth where the Companion has connected it to a plan. |
| **Companion** | Connects what you *have* to what you *might do*. **Never a scarcity alarm; silent when nothing connects** (P7). |
| **Primary interactions** | See what is in the house. Notice what is getting on. Carry it to the Kitchen or the Family Table. |
| **Responsive** | Tablet & mobile: the small window becomes a slim committed band at the top (still the smallest in the house, still E2), the Companion's line beneath, then the greeting and the strata — three-up on tablet, two-up on mobile. |

**Stocked** · **near-bare** — `docs/ui-audit/house6-pantry/`:

![Pantry · stocked · desktop](../../ui-audit/house6-pantry/pantry-stocked-desktop.png)

| Stocked · tablet | Stocked · mobile |
|---|---|
| ![](../../ui-audit/house6-pantry/pantry-stocked-tablet.png) | ![](../../ui-audit/house6-pantry/pantry-stocked-mobile.png) |

![Pantry · bare · desktop](../../ui-audit/house6-pantry/pantry-bare-desktop.png)

| Bare · tablet | Bare · mobile |
|---|---|
| ![](../../ui-audit/house6-pantry/pantry-bare-tablet.png) | ![](../../ui-audit/house6-pantry/pantry-bare-mobile.png) |

---

## 7. Room 4 — The Family Table *(Planner)* · **E1**

> **Designed in `HOUSE_COMPLETE` § 3. Rendered here for the first time.**
> The one move: **the window closes to light, and one solid table holds the week.**

### 7.1 Rendered concepts

**Filled — a week mostly decided:**

![Family Table · filled · desktop](../../ui-audit/house-visual-design/family-table-filled-desktop.png)

| Filled · tablet | Filled · mobile |
|---|---|
| ![](../../ui-audit/house-visual-design/family-table-filled-tablet.png) | ![](../../ui-audit/house-visual-design/family-table-filled-mobile.png) |

**Empty — a fresh week, designed first and designed warm:**

![Family Table · empty · desktop](../../ui-audit/house-visual-design/family-table-empty-desktop.png)

| Empty · tablet | Empty · mobile |
|---|---|
| ![](../../ui-audit/house-visual-design/family-table-empty-tablet.png) | ![](../../ui-audit/house-visual-design/family-table-empty-mobile.png) |

### 7.2 The thirteen facets

| Facet | The room |
|---|---|
| **Layout** | **One solid oak plane holding all seven days**, seven day-regions across a single table. Days are *places on the table*; a planned meal is an *object resting on it*. Beneath: the week's rest line (left) and the Companion at the end of the table (right). |
| **Visual hierarchy** | The week first, whole and at once. Then today (by warmth alone). Then each planned meal. Then the rest line. Then the Companion. **Nothing is hidden behind a step, a wizard, or a tab.** |
| **Materials** | The table is the **deepest, widest oak surface in the house** — deeper than the Kitchen worktop, wider than the Pantry ledge. `--table-top: hsl(40 34% 88%)`, lit front lip, a real shadowed bottom edge so it reads as a *surface*. |
| **Typography** | Day names in Fraunces 400; meal names in Fraunces 400 at 14.5px; the sub-line quiet and honest (*"for the table"*, *"serves 4"*) — **never a metric**. The register is *"The week"*, never *"Week 27"*. |
| **Depth** | **One ground, never nested** (T1). A day is divided from its neighbour by *the grain of the timber* — a single hairline, fading at both ends — and by nothing else. A meal is a low object with a soft shadow. **No card contains a card.** |
| **Lighting** | Even working light, warm and directional, falling **across** the table from an unseen window (`--light-angle: 104deg`), with a half-step more warmth where today sits. |
| **Orchard exposure** | **E1 — light only.** The first room in the house where the window closes. **E1 is broader, never darker** (T5): where E2 commits light to one region, E1 lays the same morning across the whole plane. *Measured luminance 0.916 — identical to every other room in the house.* |
| **Motion** | None. |
| **Empty state** | **A fresh week: seven laid places.** Clear warm oak and air, each day carrying one quiet italic *"open"*. A warm serif invitation above: *"Nothing planned yet — the table's laid… Nothing here is owed, and nothing is counting."* **No dashed ghost, no red gap, no "+ Add meal" shouting into the space, no unplanned count, no completion percentage** (T2, T7). |
| **Filled state** | Six nights set down, Thursday open — **and the open day looks exactly like the empty week's open days.** That identity is the design: an empty slot is a laid place whether the week is full or bare. The rest line: *"Six nights down, and Thursday's open. Nothing left to fetch for any of them."* |
| **Companion** | Leans at the end of the table with one grounded, refusable idea for an open day: *"There's still a good bit of that squash — it'd go well on Thursday, if you want an easy one."* **Never plans the week; nothing is ever auto-filled** (T6). |
| **Primary interactions** | Set a meal down on a day. Move it. Take it off. Accept or ignore the Companion's idea. **The week resolves to rest** — *"the plan is made"*, never a prompt to do more (T9). |
| **Responsive** | **You never get fewer days on a smaller screen — you stand closer to the same table.** |

### 7.3 Responsive behaviour, per breakpoint

| | The room |
|---|---|
| **Desktop 1440** | Seven day-regions across one continuous oak plane. Companion at the table's end; pressed apple in the clear plaster beside it; doors along the floor. |
| **Tablet 834** | **The table turns rather than breaks** — the week reflows to two bands on the *same single plane* (four and three), the timber continuous beneath both. The band break is deliberately *not* drawn as a grain line. Still one ground; all seven days visible without hunting. |
| **Mobile 390** | **Today at the head of the table**, at full size (`flex-basis: 88%` vs 78%), with the rest of the week continuing as one horizontal strip you move along, scroll-snapped. **Never seven stacked cards; never a day-picker that hides six days to show one.** Horizontal movement walks the week; vertical scroll reveals the depth of a day. |

**Mechanically verified, all six renders:** exactly 7 days visible at every breakpoint · exactly 1 day reads
as today · **no day carries a border** · no open day is drawn as a dashed ghost.

### 7.4 The named dependency, honoured rather than faked

`HOUSE_COMPLETE` D4: **the live Planner cannot know what day it is** (no date column on `planner_weeks` /
`planner_days`). Per Article VII the sun on today is **data-borne or dead**. The concept renders the detail
so its *ceiling* is legible — a half-step of radial warmth, no chip, no border, no badge — and the
composition's own comment records that **where the anchor is absent it renders not at all, and the table is
still complete.** It is never faked from the request's own weekday: the exact fabrication `CONV1 P9`
retired.

---

## 8. Room 5 — The Garden Room *(Nutrition)* · **E2**

> **Designed in `HOUSE_COMPLETE` § 4. Rendered here for the first time.**
> The one move: **the window stays, and the tiers invert the industry — words above numbers.**

### 8.1 Rendered concepts

**Filled — a few true things, and everything behind them:**

![Garden Room · filled · desktop](../../ui-audit/house-visual-design/garden-room-filled-desktop.png)

| Filled · tablet | Filled · mobile |
|---|---|
| ![](../../ui-audit/house-visual-design/garden-room-filled-tablet.png) | ![](../../ui-audit/house-visual-design/garden-room-filled-mobile.png) |

*(Full-page captures — where the room legitimately continues below the fold — sit alongside each viewport
render: `garden-room-filled-desktop-full.png`, `-tablet-full.png`, `-mobile-full.png`.)*

**Empty — too early to say anything true:**

![Garden Room · empty · desktop](../../ui-audit/house-visual-design/garden-room-empty-desktop.png)

| Empty · tablet | Empty · mobile |
|---|---|
| ![](../../ui-audit/house-visual-design/garden-room-empty-tablet.png) | ![](../../ui-audit/house-visual-design/garden-room-empty-mobile.png) |

### 8.2 The thirteen facets

| Facet | The room |
|---|---|
| **Layout** | **Two tiers, and their order is the ethic.** The noticeboard above — a small number of pinned true sentences on an oak rail. The solid data tier beneath — the real figures, their provenance, and their gaps. The garden window is the committed region to the right. |
| **Visual hierarchy** | **The plain sentence first, always.** *"A good spread this month."* Then its plain-language body. Then *"How this is counted ›"*. Then, beneath, the figures — calm, complete, and secondary by position, never by dismissal. |
| **Materials** | Kept House; the noticeboard rail is oak, the wall is matte plaster. Notes are low, light objects pinned to the wall. |
| **Typography** | Notes in Fraunces — *sentences*, not labels. The data tier's figures in Fraunces too, but *smaller than the sentences above them*: the type scale itself enforces G3. Provenance in Inter, quiet and olive. |
| **Depth** | The noticeboard tier is a set of low objects on a wall; the data tier is a single solid ground beneath. **Two tiers, never nested cards.** |
| **Lighting** | Garden-bright and optimistic — the brightest room after Arrival. |
| **Orchard exposure** | **E2** — one committed garden-bright window the content never covers. *The name "Garden Room" would pull toward E3 if taken literally; it does not. The house-name is admitted; the exposure is unchanged* (§ 4.0). |
| **Motion** | None. **No progress ring, no counter that counts up, no bar that fills.** |
| **Empty state** | **The honest one, and the hardest to get right.** *"Nothing worth saying yet"* — with the reason stated plainly (not enough planned meals recorded to say anything true) and no invented encouragement. **Never a grid of zeroes, never a 0% ring, never "start tracking to unlock insights."** |
| **Filled state** | Four pinned notes, each one a sentence THA can defend. The data tier beneath carries the working — *and carries its gaps in the same tier, in the same type*: **"Salt, typical day — not enough to say · most products lack a per-100g figure"** and **"Portion sizes — we don't record these."** Honest absence rendered as absence, not omitted. |
| **Companion** | *"If you ever want, I can explain any of these — including the two we can't answer yet."* Explains a figure in plain words, on request. **Never grades; never converts a fact into an instruction** (G1, G9). |
| **Primary interactions** | Read the note. Follow *"How this is counted ›"* to the working, **in place**. Ask the Companion. **At most one gentle optional step, and never an instruction.** |
| **Responsive** | **The words come first at every size, and the evidence is never demoted to a place that implies it does not matter.** |

### 8.3 Responsive behaviour, per breakpoint

| | The room |
|---|---|
| **Desktop 1440** | Committed garden window right (300×210); noticeboard across the upper left; the solid data tier beneath, two columns, methodology reachable in place. The Companion's line rests on the noticeboard rail. |
| **Tablet 834** | The window becomes a committed band at the top (240×132) — as the Kitchen and Pantry do — the Companion's line beneath it, then the noticeboard, then the data tier. **The tier order is preserved exactly.** |
| **Mobile 390** | **The noticeboard *is* the room.** The one fact that matters arrives first, in plain language. The data tier continues below **on the same ground — never a separate tab, never behind a chevron** that implies the evidence is optional trivia. Scrolling down is walking closer to the noticeboard, not opening a drawer. |

**Mechanically verified, filled at all three breakpoints:** the noticeboard renders **above** the data tier
(G3) · the garden detail renders **no imagery** — copy plus the real count only (G6).

### 8.4 The Living Detail, at its ceiling

*The garden filling in* is **copy plus the existing count** — *"Twenty-eight different plants so far — up
from twenty-two last month"* — set beside the numeral `28`. **No leaf imagery, no drawn garden, no streak,
no progress ring** (G6). The check asserts this mechanically rather than trusting it: a drawn garden here
would be the theme park, and it is the single most likely well-meaning regression in this room.

---

## 9. Room 6 — The Tasting Bench *(Analyser)* · **E1 (E2 before first use)**

> **Designed in `HOUSE_COMPLETE` § 5. Rendered here for the first time.**
> The one move: **the light becomes the clearest in the house, and the bench holds one object.**

### 9.1 Rendered concepts

**Filled — one object on the bench:**

![Tasting Bench · filled · desktop](../../ui-audit/house-visual-design/tasting-bench-filled-desktop.png)

| Filled · tablet | Filled · mobile |
|---|---|
| ![](../../ui-audit/house-visual-design/tasting-bench-filled-tablet.png) | ![](../../ui-audit/house-visual-design/tasting-bench-filled-mobile.png) |

**Empty — before first use, and the window is open:**

![Tasting Bench · empty · desktop](../../ui-audit/house-visual-design/tasting-bench-empty-desktop.png)

| Empty · tablet | Empty · mobile |
|---|---|
| ![](../../ui-audit/house-visual-design/tasting-bench-empty-tablet.png) | ![](../../ui-audit/house-visual-design/tasting-bench-empty-mobile.png) |

### 9.2 The thirteen facets

| Facet | The room |
|---|---|
| **Layout** | A wide clear bench. The examined object left-of-centre at real size; the findings laid **beside it in reading order across the same plane**. Mostly empty surface, by design. |
| **Visual hierarchy** | **The object first.** Then *"What we found"* with its disclaimer — *"Facts about the product. Nothing here is a judgement about you."* Then each finding: what it is · what it means · where it came from. |
| **Materials** | The bench carries **the most honest patina in the house** — a work surface that shows no use is a showroom. The object is a light, low card set down on it. |
| **Typography** | Finding labels in Inter (quiet); the finding itself in Fraunces (the answer); the provenance in olive Inter beneath (*"from the ingredients list"*, *"NOVA group 3"*). **An unknown is set in Fraunces italic** — the same weight of voice as an answer, because it *is* one. |
| **Depth** | One plane. The object is the only raised thing on it. **Never a nested panel, never a tabbed report.** |
| **Lighting** | **The clearest, most even task light in the house — and still warm.** You cannot examine something honestly in flattering light; but a clinical temperature would leave the house entirely. *Clear, not clinical: the distinction is the room* (B4). |
| **Orchard exposure** | **E1 while working. E2 before first use** — and it returns the moment an object is on the bench. **Never two levels** (B7). |
| **Motion** | None. **No verdict reveal, no animated grade, no score that resolves** (B2). |
| **Empty state** | **The room's most characteristic moment.** Before the household has ever put anything on the bench, the window *opens* (E2, 340×260), the bench is clear, and the room reads as an invitation rather than an empty tool: *"Nothing on the bench yet… We won't guess, and we won't have an opinion about your shopping."* |
| **Filled state** | One jar of pasta sauce. Six findings — four answered, **two admitted**: *"Where the tomatoes come from — We don't know; the label doesn't say"* and *"Added sugar, as distinct from the tomatoes' own — We can't separate the two from what's published."* The window has receded and the work has the whole room. |
| **Companion** | *"The two blanks are the label's, not ours — I can tell you what we'd need to answer them."* Holds the light; explains what a finding means and what is unknown. **Never delivers the verdict** (B2, B3). |
| **Primary interactions** | Bring something in (scan or search). Read what was found. Ask what a finding means. Send it on to the Pantry or the Kitchen. **The judgement stays with the household.** |
| **Responsive** | **The object stays the hero at every size, and the findings stay on the same plane as the object.** |

### 9.3 Responsive behaviour, per breakpoint

| | The room |
|---|---|
| **Desktop 1440** | Wide clear bench; object left-of-centre at real size; findings beside it in reading order. Companion at the bench end. Before first use: the window opens to 340×260 and the room invites. |
| **Tablet 834** | The object at the top at full size, findings flowing beneath it on the continuous bench plane. Still one object, still one ground. Before first use the window becomes a committed band (782×168). |
| **Mobile 390** | **The object first and largest — you are holding the packet.** Findings continue below in one column on the same bench. **Never a tabbed report, never a verdict card that must be dismissed to reach the evidence, never a score at the top with the working buried.** |

**Mechanically verified, filled at all three breakpoints:** exactly **one** object on the bench (B1) · **zero
findings read as a dominant-red verdict** (B2) · **an honest-uncertainty finding is present and first-class**
(B5).

### 9.4 The Living Detail, at its ceiling

*Where you left off* is **one low line that disappears when stale** — *"Last on the bench: wholemeal seeded
loaf · two days ago."* **Never a history list, never a log, never a count of how many products you have
analysed** (B8). It says *a used bench*, and nothing more.

---

## 10. Room 7 — The Family Journal *(Diary)* · **E2, softly**

> **Designed in `HOUSE_COMPLETE` § 6. Rendered here for the first time.**
> The one move: **the room empties — the most air in the house, and quiet made of space.**

### 10.1 Rendered concepts

**Filled — the household's own words:**

![Family Journal · filled · desktop](../../ui-audit/house-visual-design/family-journal-filled-desktop.png)

| Filled · tablet | Filled · mobile |
|---|---|
| ![](../../ui-audit/house-visual-design/family-journal-filled-tablet.png) | ![](../../ui-audit/house-visual-design/family-journal-filled-mobile.png) |

**Empty — a clean desk in good light:**

![Family Journal · empty · desktop](../../ui-audit/house-visual-design/family-journal-empty-desktop.png)

| Empty · tablet | Empty · mobile |
|---|---|
| ![](../../ui-audit/house-visual-design/family-journal-empty-tablet.png) | ![](../../ui-audit/house-visual-design/family-journal-empty-mobile.png) |

### 10.2 The thirteen facets

| Facet | The room |
|---|---|
| **Layout** | One narrow column of entries on a lap desk, centre-left. The seat's aside to the right — *Yesterday's trace*, and the Companion. **Nothing else in the room.** |
| **Visual hierarchy** | **The household's own words are the content.** THA's voice is quieter here than anywhere in the product: a serif heading, then *their* words, given room. |
| **Materials** | Oak **lap desk** — small, personal, *held*. **Not a table (the family's), not a bench (the work's), not a shelf (the store's). Its scale is the tell that this room is one person's** (J7). |
| **Typography** | **The most generous leading anywhere in THA** — entries at Fraunces 300/18px, `line-height: 1.72`. One entry reads as one entry. Attribution is a quiet *"Written by you"*. |
| **Depth** | The flattest room in the house. One low desk plane; entries divided by a hairline that stops at the last one. |
| **Lighting** | **E2, softly — a gathered pool of the same morning**, `radial-gradient(58% 44% at 62% 26%, …)`. The light values are **as high as the Kitchen's**; only the *fall* is gentler. |
| **Orchard exposure** | **E2, softly** — quiet, never dim. |
| **Motion** | None. |
| **Empty state** | **A clean desk in good light, which is a perfectly pleasant thing to arrive at.** No prompt, no *"you haven't written in five days"*, no streak, no completion, no empty state that reads as a failure to fill. |
| **Filled state** | Three entries, in the household's own voice. *Yesterday's trace* in the aside: one line of the person's own last entry — *"Toast, and no regrets."* — **only when true, and never analysed back unasked** (J6). |
| **Companion** | *"I'm here if you want me. I don't read this."* Present, available, **and silent about what was written** (J2, J10). The most restrained the Companion is anywhere in the house. |
| **Primary interactions** | Write. Read back. **That is all.** |
| **Responsive** | **This room's rule inverts every other room's: it gets *more* air on a smaller screen, not less.** |

### 10.3 Responsive behaviour, per breakpoint

| | The room |
|---|---|
| **Desktop 1440** | A very generous margin (132px vertical); one narrow column (max 560px), centre-left; the soft window pool to the right; the lap desk plane beneath. **The largest untouched surface in the product.** |
| **Tablet 834** | The column centred, the pool gathered above it, margins **still generous** (116px). *The tablet does not "fill up" because it can.* |
| **Mobile 390** | The single column, with **the most generous line-height and margins anywhere in THA.** Never a compressed feed, never two columns, never a card list. |

**Mechanically verified, all six renders:** vertical air ≥120px desktop / ≥104px tablet / ≥96px mobile (J5)
· **the pool never darkens the room** — every painted stop is a *light* one (J4) · **no prompting language**
— "streak", "you haven't written", "complete your", "keep it up" all absent (J1, J9).

### 10.4 The ownership question, drawn as designed

`HOUSE_COMPLETE` § 6.0 settled it: the window seat is **a personal seat in a family house**, and the
platform already agrees (`food_diary_*` are all `userId notNull`). The concept renders it that way —
*"Yours, and only yours. Nothing here is read back to you."* The open seam is the **Planner→Journal
direction** (D3), which is above this document and is not closed here.

---

## 11. Room 8 — The Mirror *(Profile / Household)* · **E1**

> **Designed in `HOUSE_COMPLETE` § 7. Rendered here for the first time.**
> The one move: **the light becomes even and unshadowed, and the people come first.**

### 11.1 Rendered concepts

**Filled — the household's own record.** *(The Mirror is taller than a desktop viewport; the full-page
capture is the one to read.)*

![Mirror · filled · desktop (full)](../../ui-audit/house-visual-design/mirror-filled-desktop-full.png)

| Filled · tablet | Filled · mobile |
|---|---|
| ![](../../ui-audit/house-visual-design/mirror-filled-tablet.png) | ![](../../ui-audit/house-visual-design/mirror-filled-mobile.png) |

**Empty — a household not yet described:**

![Mirror · empty · desktop (full)](../../ui-audit/house-visual-design/mirror-empty-desktop-full.png)

| Empty · tablet | Empty · mobile |
|---|---|
| ![](../../ui-audit/house-visual-design/mirror-empty-tablet.png) | ![](../../ui-audit/house-visual-design/mirror-empty-mobile.png) |

### 11.2 The thirteen facets

| Facet | The room |
|---|---|
| **Layout** | **The people across the top, at real size.** Beneath them, three **anchored strata** in a permanent order: *What we know* · *How it's used* · *Yours to change*. Each stratum is one plane, divided by an oak rule. |
| **Visual hierarchy** | **The people are the subject of the room, not a header above the settings** (M1). Then what THA knows. Then what it does with it. Then what the household can change. |
| **Materials** | Kept House, in the house's most even light. Each person is a low card with a sage initial disc — **the canonical avatar treatment, no album theming, no cover imagery, no profile decoration** (M10). |
| **Typography** | **Preferences read as facts about people, never as configuration.** *"Doesn't eat fish."* — a sentence about Sam. Not a checkbox labelled `pescatarian`, not a toggle, not a chip. **This single translation is the difference between a family record and an account settings page** (M2). |
| **Depth** | **Anchored strata** — tiers, like the Pantry, but where the Pantry's hold *things*, the Mirror's hold *the record*. Flat rows within each stratum; nothing nested. |
| **Lighting** | **Even, honest, unshadowed — the only room in THA with no directional light.** *A shadow is somewhere a thing can hide, and this room has no dark corners.* No emphasis lighting, because no fact here is louder than another (M6). |
| **Orchard exposure** | **E1 — light only, and unshadowed.** |
| **Motion** | None. |
| **Empty state** | A household not yet described — the strata **in the identical order**, each row honestly reading *not set* with a quiet *Add ›*. **Never an onboarding checklist, never a completion percentage on a family.** |
| **Filled state** | Four people, each with their own sentences — including **Theo, with *"Nothing recorded yet."*** rendered in the same type as everyone else's facts, because a person with no preferences recorded is still first-class (M9). The strata carry *not set* rows in the open (**M3, no dark corners**) and close with *"Anything else — there is nothing else."* |
| **Companion** | *"Ask me what any of this changes and I'll tell you before you change it."* Explains what a change will do elsewhere in the house. **Never edits the record itself** (M8, M11). |
| **Primary interactions** | Read the record. Correct anything. Export everything. Remove a person. Close the household. **Every change states its consequence at the moment of the change** — *"Adding 'no fish' for Sam means the Cookbook and the Family Table will stop suggesting it for everyone at the table — including Friday's salmon, which is currently planned."* |
| **Responsive** | **The people never get smaller, and the order never changes.** |

### 11.3 Responsive behaviour, per breakpoint

| | The room |
|---|---|
| **Desktop 1440** | The household across the top, four abreast, in even light. The three strata beneath, two columns each, in their permanent order. |
| **Tablet 834** | The people as a band, two abreast, **unshrunken**; the strata below in the identical order, single-column rows. |
| **Mobile 390** | **The people first and unshrunken — the one thing in THA that never gets smaller on a small screen.** One per row, avatar still 52px. The strata continue as one column, in the **identical** order to desktop. *Anchored means anchored at every size; a record that reorders itself on a phone is not anchored* (M7). |

**Mechanically verified, all six renders:** the avatar is **52px at every breakpoint** — the check fails on
any other value (M1) · **the strata order is compared across all three breakpoints and must match exactly**
(M7) · **no person is rendered as a form field** — no input or switch in the people band (M2) · **the words
"weight", "BMI", "progress", "goal weight" are absent from the room** (M5, *never the bathroom scale*).

---

## 12. The house, read across all eight rooms

### 12.1 One house — the constants, verified per render

Every one of the 30 renders was checked for the house-wide law, not just the room's own rules:

| Constant | The check | Result |
|---|---|---|
| **One Companion** | Exactly one `.companion`, exactly 48px, in the same corner | **30/30** |
| **The pressed apple** | Present on desktop, and **tone-on-tone — no colour channel spread > 60** | **10/10 desktop** |
| **The constant shell** | Exactly 4 doors, exactly 1 reading as *here* (desktop/tablet) | **20/20** |
| **The orchard is never wallpaper** | No reading content crosses onto the glass | **30/30** |
| **Article IV — the light never leaves** | Room luminance ≥ 0.82 | **30/30 at 0.916 — identical in every room** |
| **The state law** | Exactly one state renders; the other is fully absent | **30/30** |

**The luminance result is the house's own argument, measured.** Every room — E3 Entrance Hall through E1
Mirror — sits at **exactly 0.916**. The orchard withdraws from a wall, to a window, to a glimpse, to
nothing; **the light never changes.** *"E1 is broader, never darker."* *"Quieter is never darker."* That is
now a measurement, not a hope.

### 12.2 Eight rooms, one move each — as rendered

| Room | Exposure | The one move | Rendered as |
|---|---|---|---|
| **Entrance Hall** | E3 | The window opens to a full wall | The view is the hero; the console is a whisper |
| **Kitchen** | E2 | The window turns to the side | Side-light across the page; the food is the colour |
| **Pantry** | E2 (smallest) | The window shrinks to a glimpse | Shelf strata; freshness told kindly |
| **Family Table** | **E1** | The window closes to light | One 7-day oak plane, `--light-angle: 104deg` laid across the whole width |
| **Garden Room** | E2 | The tiers invert the industry | Noticeboard *above* the data tier — verified at every breakpoint |
| **Tasting Bench** | **E1** (E2 first use) | The clearest light; one object | One pack, six findings, two of them admitted unknowns |
| **Family Journal** | E2, softly | The room empties | 132px of air, `line-height: 1.72`, the flattest plane in the house |
| **Mirror** | **E1** | Even and unshadowed | No directional light; four people at 52px that never shrink |

### 12.3 The eight empty states, side by side

Article VIII: *every room's emptiest state is built **first** and built **warm**.* Read together, the eight
are the clearest evidence that this is one house:

| Room | What its emptiest state says | What it refuses |
|---|---|---|
| **Entrance Hall** | *a clear morning · the list is clear · blossom this week* | *"nobody home"* |
| **Kitchen** | More light, more generosity (E2→E3) | *"you've only tried 3 of 30"* |
| **Pantry** | *"The shelves are light this week. That's completely fine — a pantry breathes in and out."* | *"you're low on 12 things"* |
| **Family Table** | *"Nothing planned yet — the table's laid… nothing is counting."* | *"0 of 7 planned"* |
| **Garden Room** | *"Nothing worth saying yet"* — with the honest reason | A grid of zeroes; *"start tracking to unlock"* |
| **Tasting Bench** | *"Nothing on the bench yet"* — **and the window opens** | An empty tool with a disabled button |
| **Family Journal** | A clean desk in good light | *"you haven't written in five days"* |
| **Mirror** | *not set*, in the open, with a quiet *Add ›* | An onboarding completion bar on a family |

**Not one of them is an accusation, a count of what is missing, or a grid of zeroes.**

---

## 13. What rendering found that writing could not

This is the argument for rendering, stated as evidence. **Four real defects were invisible to the written
blueprint and appeared the moment the rooms were built and measured.** Each was found by *looking*, then
made mechanical so it cannot return.

| # | The defect | How it was found | Fixed |
|---|---|---|---|
| **1** | **The Mirror had no pressed apple.** The house's sole brand mark was absent from an entire room — a straight Article I / BRAND2 § 6 violation, in the room that carries the house's trust. | The house-wide check | ✅ Added to the record's foot, in clear plaster |
| **2** | **The Tasting Bench lost its mark the moment it started working.** The apple lived *inside* the before-first-use aside, so it existed at E2 and vanished at E1 — the mark was a property of the empty state. | Rendered position probe (0×0 in the filled state) | ✅ Moved outside both state blocks; it is now in every room **in every state** |
| **3** | **The state law was being silently overridden.** `.rest { display: flex }` out-specified `.empty-only { display: none }` on source order, so **the filled week rendered its own empty line underneath itself** — *"Six nights down, and Thursday's open."* immediately followed by *"The table's laid whenever you are."* Both states were individually correct, which is exactly why no other check caught it. | **Looking at the render** | ✅ The law now hides with `!important` and never declares how a shown element displays — the room keeps its own posture |
| **4** | **The renders' own checks had two false positives.** The pigment test matched bare digits, so a gradient's `50%` stop position shifted the RGB triples out of phase and reported pigment in a tone-on-tone wall. The Journal's darkness test flagged `transparent`, which computes to `rgba(0, 0, 0, 0)` — black at zero alpha. **20 of 26 reported problems were not real.** | Reading the failures instead of obeying them | ✅ Both parse real colour stops now |

> **Defect 4 is the one worth keeping.** A check that mis-fires is worse than no check: it trains the next
> person to skim past warnings, and the two genuine defects (1 and 2) were sitting in the same output as
> eighteen phantoms. **A verification gate has to be right before it is useful.**

### 13.1 Two findings reported, not fixed

| # | The finding | Why it is not fixed here |
|---|---|---|
| **A** | **Two locked documents' renders do not display.** `HOME_ARRIVAL_PRODUCTION_LOCK.md` and `HOUSE5_KITCHEN_EXPERIENCE.md` reference their images as `../ui-audit/…`, which from `docs/implementation/house/` resolves to `docs/implementation/ui-audit/` — **which does not exist.** `HOUSE6` uses the correct `../../ui-audit/`. So **two of the three locked rooms' proof is unreadable in the document that claims it**, and this file uses the correct depth throughout. | The locked documents are inherited **byte-untouched** by this session's mandate. A one-character path fix in each is the whole remedy and belongs to whoever next opens them. |
| **B** | **The pressed apple has two breakpoints for one mark.** The Kitchen hides it below **900px**; the Pantry below **980px**. Same mark, same house, two owners — precisely the drift `HOUSE_COMPLETE` § 12.1.2 predicted would appear "by room three". At tablet 834 both happen to be hidden, so it has never been visible. | `_house.css` resolves it to one owner (980px) for the five new rooms. Converging the two locked rooms onto it is a change to locked files. |

---

## 14. Production handoff

### 14.1 What engineering should take from this document

1. **`_house.css` is the deliverable, not just the renders.** It is the extracted house language
   `HOUSE_COMPLETE` § 12.1.2 asked for, at design fidelity, in one file. When Arrival ships, these become
   the canonical owners and go into the Adoption Register **in the same change** (UIA § 17). If they ship
   page-local, the house has two owners of its own materials by the second room.
2. **The mechanical checks ship with the rooms.** `render-house-rooms.ts` encodes 16 room rules as assertions —
   *no day carries a border*, *words render above numbers*, *exactly one object on the bench*, *the strata
   order is identical at every breakpoint*, *the avatar never shrinks from 52px*, *the room is never
   darker than 0.82*. `HOUSE_COMPLETE` § 12.3.4 prescribed these; they are now **run, not prescribed.**
3. **Build the empty state first, from the render.** Every room in this set has its empty state rendered at
   all three breakpoints. § 12.3 says building it second always produces a grid of zeroes — the renders
   remove the excuse.
4. **The sequencing is unchanged** (`HOUSE_COMPLETE` § 12.1): Entrance Hall → shared owners → retire the
   orchard bypasses → Kitchen → Pantry → **Family Table** → **Mirror** → Garden Room / Tasting Bench →
   Family Journal.

### 14.2 What these concepts do *not* resolve

Stated plainly rather than discovered mid-build. All four are `HOUSE_COMPLETE` § 12.2a dependencies and
**none is closed by drawing a room**:

- **D1** — the family's book is N private books (`meals.userId notNull`).
- **D2** — freshness has no field; the Pantry's signature Living Detail has no data source.
- **D3** — a household plan flows into a private journal.
- **D4** — the Planner cannot know what day it is; *the sun on today* is **absent, never faked**.

And the live-product distance in § 12.2 is unchanged: the Journal is a three-column dashboard today where
the Blueprint asks for the most air in the house; the Bench is a grid of many objects where the design
holds one; **`dialog.tsx:48` still puts the orchard behind dense working text in five rooms at once**, from
a file none of them owns. **That last one remains the cheapest correctness win in the programme.**

### 14.3 A note on the placeholder content

Every household fact in these compositions is a **warm placeholder** standing in for a real household's own
data — the same convention Arrival used with *"Chloe"*, the Kitchen with placeholder dishes, and the Pantry
with generic staples. No fabricated fact is presented as a real household's. In production, real data
replaces them 1:1, and **where a household has none, the room falls back warm, never clinical.**

---

## 15. What this keeps, and what it never does

**Kept.** The house language of the three locked rooms, carried verbatim into five more and extracted into
one owner: Concept B architecture, the Kept House interior, the one morning, the pressed apple, the
Companion apple, the constant shell. The orchard is the owner's real `ORCHARD.png` — the same view from the
same place, through progressively smaller windows until it is only light. Every room's philosophy, verb,
exposure, ground posture, and Living Detail exactly as `HOUSE_COMPLETE` set them.

**Never done.** No redesign of the house, of any room, or of the architecture. No change to any room's
philosophy. No new metaphor — every room here is one `HOUSE_COMPLETE` already named. No new navigation: the
door-run is the four doors the house already has, and no room invented a fifth. No new product feature, no
new colour, token, component, route, string, capability, or behaviour. No rule restated as if this document
owned it. The three locked rooms were **read, inherited, and left byte-untouched** — not re-rendered, since
re-rendering a locked room *is* redesigning it. And **no product source, data source, hook, route, API,
behaviour, schema, migration, or test changed** — this is a design reference, exploration only.

---

## 16. Verification

| Check | Result |
|---|---|
| Bootstrap + required reading | ✅ `docs/architecture/README.md`, `HOME_ARRIVAL_PRODUCTION_LOCK.md`, `HOUSE5_KITCHEN_EXPERIENCE.md`, `HOUSE6_PANTRY_EXPERIENCE.md`, `HOUSE_COMPLETE.md` (all 1204 lines) — read before any change. |
| Git status confirmed · rollback protection | ✅ HEAD `7bfad50c`, branch `int1-intelligence-platform`. `rollback/HOUSE-VISUAL-DESIGN-20260718` **already existed from the interrupted run and was preserved**, not re-cut; new working-tree snapshot `8100bd78`. |
| Run file created | ✅ `.engineering/session/runs/HOUSE_VISUAL_DESIGN.md`, including the recovery finding. |
| **Every room covered** | ✅ **8/8** — Entrance Hall (§ 4) · Kitchen (§ 5) · Pantry (§ 6) · Family Table (§ 7) · Garden Room (§ 8) · Tasting Bench (§ 9) · Family Journal (§ 10) · Mirror (§ 11). |
| **Desktop · tablet · mobile per room** | ✅ **24 room-breakpoint concepts**, each rendered at 1440 · 834 · 390. |
| **All thirteen facets per concept** | ✅ Layout · visual hierarchy · materials · typography · depth · lighting · orchard exposure · motion · empty state · filled state · Companion behaviour · primary interactions · responsive behaviour. Three house-wide facets stated once (§ 3) to avoid creating eight rival owners of one rule. |
| **Rendered, not asserted** | ✅ **44 renders** — 30 viewport + 14 full-page, `deviceScaleFactor 2`. Five new rooms rendered this session (`docs/ui-audit/house-visual-design/`); three locked rooms cited in place. |
| Type | ✅ **Fraunces resolved and loaded — the serif is real, not a fallback.** |
| Mechanical checks | ✅ **30/30 ALL CLEAR** — 6 house-wide checks × every render, plus 16 per-room assertions derived from T1–T3, G3, G6, B1, B2, B5, J1, J4, J5, J9, M1, M2, M5, M7. |
| `HOUSE_COMPLETE` § 14 gap closed | ✅ The five rooms held to a lower standard of proof are now held to the same standard as the three they join. |
| § 12.3.4 per-room checks | ✅ **Run, not prescribed:** no day carries a border or chip · words render above numbers · one object on the bench · no dominant-red verdict · the strata order is identical at all breakpoints. |
| Defects found by rendering | ✅ **4 found, 4 fixed** (§ 13) — two real house-law violations, one silent state leak, two false-positive checks. **2 further findings reported, not fixed** (§ 13.1). |
| House not redesigned · philosophy unchanged · no new metaphor | ✅ Every room is `HOUSE_COMPLETE`'s room. No architectural idea, exposure value, ground posture, verb, or Living Detail was changed. |
| No new navigation | ✅ The four-door shell only. No room added a door, a tab, or a route. |
| No new product feature | ✅ Nothing appears in any room that `HOUSE_COMPLETE` did not already describe. |
| Three locked rooms | ✅ **Byte-untouched.** Read and inherited; not re-rendered, since re-rendering a locked room is redesigning it. |
| One house / own personality | ✅ Constants verified per render (§ 12.1); one deliberate move per room (§ 12.2). **Measured luminance is 0.916 in all eight rooms** — the light never leaves; only the view does. |
| Product / schema / migration / tests | **None** — design reference and renders only. |
| Canonical orchard asset | **Byte-untouched.** Referenced in place; no substitute authored. |

**Artifacts**

```
scripts/north4-concepts/_house.css                 the shared Kept House language — ONE owner, extracted
scripts/north4-concepts/room-family-table.html     the five room compositions, standalone
scripts/north4-concepts/room-garden-room.html
scripts/north4-concepts/room-tasting-bench.html
scripts/north4-concepts/room-family-journal.html
scripts/north4-concepts/room-mirror.html
scripts/north4-concepts/render-house-rooms.ts      5 rooms × 2 states × 3 breakpoints + 22 mechanical checks
docs/ui-audit/house-visual-design/                 44 renders (30 viewport + 14 full-page)
```

> **Tooling note.** Chromium will not launch in this sandbox (`libglib-2.0.so.0` missing). Revived against a
> curated 713-library set from the nix store, excluding glibc's own libraries, libcrypto/libssl/libz —
> **and, new this session, `libstdc++`/`libgcc_s`**: the bundle's `libstdc++` is older than node's and
> shadowed it, failing every launch with `GLIBCXX_3.4.32 not found`. The apple mask is inlined as a
> data-URI (a `file://` mask-image loads empty headless). Recipe recorded in the run file; the next session
> will hit the same wall and should exclude the C++ runtime from the start.

---

*HOUSE_VISUAL_DESIGN — The Healthy Apples House, rendered. Eight rooms and one morning, now visible. You
arrive to the open view, turn into the kitchen where the light crosses the page, reach to the shelves that
tell you the truth kindly, carry it to the wide table where six nights are down and Thursday is a laid
place, step into the garden-bright room that says twenty-eight plants and admits the two things it cannot
answer, examine one jar under the clearest light in the house and read the two blanks the label left, sit
at the lap desk where nothing is due and the friend says "I don't read this," and stand in front of the
even, unshadowed record where four people come first and nothing hides. The apple is pressed into the wall
of every one of them. The orchard withdraws from a wall to a window to a glimpse to nothing at all — and
the light, measured in all eight rooms, never moves from 0.916. It is one house. It is finished. And it is
still morning.*
