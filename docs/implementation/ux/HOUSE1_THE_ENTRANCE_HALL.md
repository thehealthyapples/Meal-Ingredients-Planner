# HOUSE1 — The Entrance Hall

## The Permanent Home Experience of The Healthy Apples

**Status:** DESIGN SPECIFICATION — the definitive design of the *permanent* Home experience, in the adopted **"The Kept Room"** visual identity; the canonical reference every future THA room inherits. **Not** governing architecture: it *applies* the governing blueprints and owns only the concrete design of one room; it creates no rule and no second owner (Experience Blueprint § 18; Architecture Principle 2).
**Classification:** Experience / UX design (implementation). Successor and companion to [`ORCHARD2_FIRST_LIGHT.md`](./ORCHARD2_FIRST_LIGHT.md).
**Date:** 2026-07-15 (HOUSE1)
**Scope:** The whole of **Home** — the permanent room, at rest and in use, across a full day (morning, midday, evening) and across repeated returns. Home only. Not a dashboard; not any other room. Where First Light designed the *arrival moment*, HOUSE1 designs the *room that moment arrives into* and everything that follows it through the day.
**Adopted visual direction (fixed):** **The Kept Room** — warm minimalism, *modern bones, warm skin* — recommended by [`ORCHARD3_VISUAL_CONCEPT_EXPLORATION.md`](./ORCHARD3_VISUAL_CONCEPT_EXPLORATION.md) § 5 and taken as given here. This document does **not** re-explore alternatives; it renders Home *as* the Kept Room.
**Built on:** [`THA_EXPERIENCE_BLUEPRINT.md`](../../architecture/THA_EXPERIENCE_BLUEPRINT.md) (the vision and the place) · [`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`](../../architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md) (the design language) · [`THA_ORCHARD_LIVING_BOOK.md`](../../architecture/THA_ORCHARD_LIVING_BOOK.md) (the lived account) · [`ORCHARD2_FIRST_LIGHT.md`](./ORCHARD2_FIRST_LIGHT.md) (the arrival moment) · [`ORCHARD3_VISUAL_CONCEPT_EXPLORATION.md`](./ORCHARD3_VISUAL_CONCEPT_EXPLORATION.md) (the visual soul)
**Cites, never restates:** [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (behaviour) · [`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (the binding look — every colour, token, type value) · [`THA_EXPERIENCE_LANGUAGE.md`](../../architecture/THA_EXPERIENCE_LANGUAGE.md) (the feeling)
**Fidelity:** Design intent only. **No code, no React components, no production UI, no design tokens, no colour values, no hexes.** The diagrams are low-fidelity spatial-composition sketches — they show *where things sit and how they relate*, never how they look. Every visual value remains the UI Architecture's.

> **What this document is.** ORCHARD2 First Light designed the first thirty seconds of Home — the *crossing of the threshold* the first time each day. It stopped, deliberately, at the arrival. But a household does not live in an arrival; it lives in a *room*, all day, coming and going. This document designs that room: the permanent Home — what it is when arrival has settled, what it holds through the morning, what it becomes at the dinner hour, what greets the fourth return of an ordinary day. It is the definitive specification of Home as a *place*, and because Home is the Entrance Hall of the Orchard House — the room every session begins in and every other room is reached through — it is also the reference every future room inherits. It renders Home *as The Kept Room* (ORCHARD3 § 5), the visual identity THA has adopted. Where it touches a governed concern — the one morning, Home's exposure, the greeting, the Companion's manners, the shell, the Living Detail — it **applies** the owner's rule and cites it; it never rewrites it. Nothing here ships until the governance path the Blueprint fixed has been walked (§ 0.4).

---

## 0. FRAME

### 0.1 The one room, named

Every design in THA answers three questions before anything else — the Experience Test (Experience Blueprint § 15.3). For the permanent Home:

- **Which room of the home is this?** **Home** — *the threshold and the heart* of the house, the one room at **E3, the open view** (Experience Blueprint § 4, § 5.1, § 6.2; Experience Architecture § 4). It is the Entrance Hall (§ 1): the room you enter through and the room you can always come back to.
- **How should someone feel here?** *At home.* Welcomed and expected on arrival; oriented and unhurried while here; calm and kept on return — the seven feelings at their governed warm temperature (Experience Language § 3, § 3A). The one sentence that governs every decision below is the vision itself: **"a warm, lived-in home where someone has already thought about dinner"** (Experience Language § 3A; Experience Blueprint § 1.1).
- **What is the ONE thing this room helps them do?** **Arrive and be oriented** — *how are we doing, and what's next?* — and, from that calm centre, step into the one thing worth doing next, at whatever hour of their day they came (Experience Architecture Principle 4; Experience Blueprint § 4.1). Home does not *do* the household's work; it welcomes them, tells them where things stand, and opens the one right door into the rooms that do.

### 0.2 HOUSE1 and First Light — the room and its opening beat

First Light and the Entrance Hall are one room described at two scales, and the boundary between them is load-bearing:

- **First Light (ORCHARD2) owns the arrival *moment*** — the crossing of the threshold the first time each day: the greeting in THA's hand, the one sanctioned light moment, the Companion's arrival beat, the first thirty seconds. HOUSE1 **does not restate it**; it cites it as the room's opening (§ 7).
- **HOUSE1 owns the permanent *room*** — everything First Light arrives *into* and everything that happens after it: the layout at rest, the room in use through the day, the honest empty state, the fourth return of the afternoon, the dinner-hour orientation, the way Home behaves when the household simply stands in it doing nothing (Orchard Living Book, *Quiet Moments*).

Said plainly: **First Light is how you come in; the Entrance Hall is the room you are in.** One is a beat; the other is the place that keeps.

### 0.3 The one law that governs the whole day: one morning, forever

The mission asks for Home across **morning, midday, and evening** — and the single most important design decision in this document is *how* Home has a daily rhythm **without a single change to its light**. The house has exactly one morning, and it never moves to dusk (Experience Blueprint § 7; OHDB § 6, § 11; Orchard Living Book, *Evening In The Orchard*). Reconciling those two facts is the whole intellectual work of HOUSE1, and the answer is fixed here as the room's founding principle:

> **The house keeps one unchanging morning; the household's day moves through it. Home's "rhythm" is carried entirely by what is *true right now* — the household's data and the orientation drawn from it — never by the house's light, theme, palette, or mood.**

At breakfast, midday, and the dinner hour, the *light is identical*, the *orchard is identical*, the *materials are identical*, the *layout is identical*. What differs is only the **household's own truth**: at 7am the relevant thing is that tonight is handled and the week is calm; at 6pm the relevant thing is *what's for dinner in the next hour and is everything in for it*. Home reflects the hour of the household's life by **saying the true and useful thing for that hour**, and by nothing else. This is *"time shows through the household's life, never through the house's weather"* (Orchard Living Book, *How to read this book*; OHDB § 11), applied to the clock of a single day. Every "morning / midday / evening" section below is a description of the **household's** hour and the **data** it makes relevant — never of a change in the room.

### 0.4 The governance path — what this design may become, and when

This is design intent. It jumps none of the governed gates (Experience Blueprint § 2.4; OHDB § 2.4):

1. The **Kept Room's depth / ground-plane / warm-light vocabulary** described here (the warm plaster ground, the lit oak counter, the soft single-direction shadow) sits *beyond* the UI Architecture's current flat-surface law (UIA § 4) and **may not ship until the governed UIA § 4 amendment admits it.** Until then, UIA § 4 as written is the binding law of any shipped Home.
2. **Home's exposure and light values** (E3; the morning hue and direction; the Kept Room's warm neutral ground) enter only as **semantic tokens by admission** (UIA § 16) — never as per-surface choices in a component.
3. The **greeting** and every other Living Detail are admitted **as their own named decisions** against the Experience Review Questions (Experience Blueprint § 12.1, rule 6).
4. **The Kept Room itself** is a *recommended* visual direction (ORCHARD3 § 5.4), not yet a governing amendment. HOUSE1 designs Home in it on the mission's instruction, and its shipping is gated on the Kept Room's own graduation into the UI Architecture / Orchard House Design Blueprint by amendment.

Two of the Blueprint's four open items (§ 18) bear directly on Home and must be closed before it ships: the **orchard's canonical owner** (the E3 view has no owned environment asset yet) and **Home's header** (the live Home and the realm surfaces currently present two shell treatments; one must be made canonical). This document depends on both; it does not resolve them.

---

## 1. THE ENTRANCE HALL — WHY HOME IS THIS ROOM

Before the composition, the metaphor, because it decides everything after it. In the Orchard House, **Home is the entrance hall**: the room you come in through, the room that connects to every other room, and the room you can always step back into. The choice of *entrance hall* — rather than "dashboard," "landing page," or "home screen" — is the whole posture of the design.

- **It is the threshold.** Every session begins at Home (Experience Architecture § 4). An entrance hall is the first room of a house: you are *in the house* the moment you are in it, and everywhere else is a door away. **Why it belongs here:** Home is the one room whose job is *entering* — being welcomed, getting your bearings, deciding where to go. **Why it supports the household:** the first thing a person feels is arrival, not work (Experience Language Principle 1). **Why it is the Kept Room:** an entrance hall is warm and kept and quiet — never the busiest room, never where the work piles up; it is where you take your coat off (Orchard Living Book, *First Light*).
- **It is the heart.** An entrance hall in a well-loved home is not merely a corridor; it is where the household passes each other, checks the day, drops the keys — the room the whole house turns around. Home answers *"how are we doing, and what's next?"* before anything else is asked (Experience Blueprint § 4). **Why it supports the household:** they can always return to one calm centre and know where things stand. **Why it is the Kept Room:** the heart of a kept house is warm and lived-in, evidenced by the family's own life passing through it — exactly the Living Detail (Experience Blueprint § 12).
- **It is always one step away.** From any room, Home is in the anchor position of the shell (Experience Architecture § 8; Experience Blueprint § 4). An entrance hall is reachable from everywhere because everywhere leads back to it. **Why this matters:** the household is never lost and never trapped; there are no dead ends, only the way back to the hall.
- **It is the room that sets the standard.** The entrance hall is where a visitor forms their sense of the whole house — its light, its materials, its calm. Because Home is entered first and returned to most, its design *is* the household's sense of THA. That is why Home is the gold standard every future room inherits (§ 22): get the entrance hall right and every room off it is already half-designed.

> **Home is the Entrance Hall of the Orchard House: the warm, kept, quietly intelligent room you arrive into, get your bearings in, and return to — never the room the work happens in, and never a dashboard reporting to you.**

---

## 2. OVERALL SPATIAL COMPOSITION

*(Low-fidelity spatial sketches — relationships and proportion, not appearance. All values are the UI Architecture's; the Kept Room depth ships only via the § 0.4 path. Home is **E3, the open view** — the one room where the orchard is visible as itself, generously, and the view *is* part of the room's purpose; the working surface is a **compact counter that keeps its share** so the view keeps its own — Experience Blueprint § 5.1, § 6.2, § 8.)*

### 2.1 The room, at rest (arrival settled; nothing pending)

```
 ┌──────────────────────────────────────────────────────────┐
 │  ▓ THA          Home  Planner  Cookbook  Pantry  …    ⌂   │  ← THE WALLS (shell)
 │                                                          │    one frame · one nav · Home in
 ├──────────────────────────────────────────────────────────┤    the anchor · byte-identical in
 │                                                          │    every room, every hour (EXPARCH
 │       ~ ~ ~   the open view — E3   ~ ~ ~                 │    §8 · UIA §6 · unchanged all day)
 │     ~   ancient orchard, one morning light   ~          │
 │       (still · in leaf · never wallpaper ·              │  ← THE VIEW (background ground)
 │        never carries text · never animates)             │    orchard = setting, not decoration
 │                                                          │    (EXPBLUE §6). Generous, quiet.
 │      ┌────────────────────────────────────────┐         │
 │      │  Good morning, Sarah.        (THA's hand)│        │  ← THE COUNTER (middle ground)
 │      │  Thursday · a calm week ahead            │        │    THE KEPT ROOM: warm plaster
 │      │                                          │        │    ground; a lit oak working plane;
 │      │  You're all set for tonight.             │        │    holds greeting · orientation ·
 │      │  [ Look at the week ]   ← one clear door │        │    ONE primary action. Compact, so
 │      └────────────────────────────────────────┘         │    the view keeps its share (§8.2)
 │                                            ( ◐ )         │  ← THE COMPANION (foreground)
 │                                                          │    fixed chair at the counter, all
 └──────────────────────────────────────────────────────────┘    day; arrives a beat after you (§9)
```

Three grounds, exactly as the material law fixes them (Experience Blueprint § 8.1), and Home is the room that spends the most of its frame on the first. **Why this composition exists:** it is the architecture of a real kitchen at the good hour — you look up and out to the orchard, the morning meets the counter at one horizon, and everything you might *do* is gathered low and near, where a hand rests. **Why it is the Kept Room:** the soul of the Kept Room is *inside* — the warm tended ground plane — with the ancient orchard welcome at exactly its window size (ORCHARD3 § 5.1). The counter, not the view, carries the household; the view carries the calm.

### 2.2 The vertical rhythm — view above, counter below, one horizon

```
        top of frame
   ─────────────────────────  ← the walls (shell): constant, never part of the moment, any hour
        ▓ orchard / open view ▓          the view holds the upper field —
        ▓  (E3, generous)     ▓          you look UP and OUT, as from a sink
   ~ ~ ~ ~ ~  one soft horizon ~ ~ ~ ~    the morning meets the counter here
        ▒ the counter (compact) ▒         warm oak plane on warm plaster ground
        ▒ greeting · state · 1 door ▒     solid ground under ALL text (never on view)
        · · Companion at the counter · ·  foreground, lower-right, its usual place
   ─────────────────────────
        bottom of frame — one viewport. No scroll to arrive or be oriented. (§2.4)
```

The frame reads top-to-bottom as **sky → light → surface → hand**. **Why it belongs in Home specifically:** only Home is E3, so only Home earns this much sky; every other room lowers the horizon because it has more work (Experience Blueprint § 6.2). This vertical order is Home's signature and the first thing a new room learns *not* to copy wholesale — it inherits the *grammar* (arrive, one ground, one door, the friend a beat behind), not the E3 horizon (§ 22).

### 2.3 The room, in use (the household has arrived and there is genuinely more to show)

When the day has real content — meals to confirm, a shortage worth naming, a plan half-made — Home does not become busy; it lets the person *walk further into the same room* by scrolling, and the arrival stays complete above the fold (Experience Language Principle D; Experience Blueprint § 4).

```
 ┌──────────────────────────────────────────────────────────┐
 │  ▓ THA   Home  Planner  Cookbook  Pantry  …          ⌂   │  walls — unchanged
 ├──────────────────────────────────────────────────────────┤
 │        ~ ~   the open view — E3, quieter now   ~ ~       │  view narrows a touch as content
 │      ┌────────────────────────────────────────┐         │  earns the room; NEVER below its
 │      │  Good afternoon, Sarah.                  │        │  E3 floor, never a theme change
 │      │  Tonight: the traybake you planned.      │        │  ← the counter, primary
 │      │  [ Start tonight's dinner ]              │        │
 │      └────────────────────────────────────────┘         │
 │   · · · · · · · · one horizon of air · · · · · · · · ·   │  air is a material (§8.2)
 │      ┌──────────────┐   ┌──────────────┐                 │  ← quiet content, ON the ground,
 │      │ this week     │   │ in the house │                 │    like notes on a counter —
 │      │ (a calm line) │   │ (a calm line)│                 │    lower, quieter, never tiles
 │      └──────────────┘   └──────────────┘                 │    of a dashboard (§4, §5)
 │                                            ( ◐ )         │
 └──────────────────────────────────────────────────────────┘   ↓ walk further only if there is
                                                                   genuinely more; else it ends here
```

**Why "in use" still is not a dashboard:** the secondary notes sit *on the ground plane like notes on a counter*, never as a grid of metric tiles standing to attention (Experience Blueprint § 8.2, § 16; Experience Language Principle G). They are *disclosed* because there is something true to say, and they are *absent* when there is not (§ 15, § 16). **Why it is the Kept Room:** a kept room in use is still calm — a few things set out because they are needed, generous air around them, nothing crowded to the walls (OHDB § 4).

---

## 3. THE PERMANENT LAYOUT — WHAT ALWAYS REMAINS

The fixed anatomy of Home, present in every state and at every hour. This is the layout a returning household never has to relearn (Orchard Living Book, *Returning Home*).

| Element | Where it always sits | Why it is permanent |
|---|---|---|
| **The walls (shell)** | Header, one nav, Home in the anchor — the frame | The walls make many rooms one house; they are byte-identical everywhere and never animate (Experience Blueprint § 14; Experience Architecture § 8) |
| **The open view (E3)** | The upper field; the background ground | The view *is* part of Home's purpose; it is the one constant of the ancient orchard outside the window (Experience Blueprint § 6.2, § 6.0) |
| **The counter (middle ground)** | Centred-low, meeting the view at one horizon | The one warm working surface that carries everything the household reads and does; one ground, never nested (Experience Blueprint § 8.2) |
| **The greeting / orientation region** | The top of the counter | Home's answer to *how are we / what's next* always lives in the same place (Experience Architecture § 4) |
| **The one primary door** | On the counter, in the light | Exactly one primary action, always reachable in the same spot (Experience Architecture Principle 4) |
| **The Companion's chair** | Lower-right foreground | One presence, one fixed chair, in every room and every hour (Experience Blueprint § 13) |

> **The permanence contract:** a household that has used Home once knows where everything is forever. Nothing in the permanent layout moves to seem fresh, to signal an hour, or to mark an occasion. **Why it supports the household:** familiarity is a form of rest — you do not spend attention finding your bearings in your own home (Experience Language Principles 9, 11, E). **Why it is the Kept Room:** the Kept Room's whole value is that it is *always the same warm morning* (OHDB § 14.1); a layout that rearranged itself would be the opposite of kept.

---

## 4. VISUAL HIERARCHY

*(Composition of weight, not styling. Every value is the UI Architecture's; the Kept Room depth ships via § 0.4.)*

The order in which the eye meets Home, at rest:

```
   1st  ●  The greeting / orientation — the household in THA's hand or plain warm voice
           the single warmest, most human mark; who we are, how we are
   2nd  ◐  The one primary door — the next step, standing in the light
           the brightest-weighted UI element AFTER the greeting
   3rd  ~  The orientation line(s) — "how we're doing / what's next"
           calm human sentences on the counter, low contrast
   4th  ▓  The open view — the orchard: LARGE in area, QUIET in attention
           it holds the eye's rest between reading and reaching, never its work
   5th  ·  The Companion — present, foreground, waiting; lowest emphasis until invited
       —  The walls — read as PLACE, not content; never competing
```

The deliberate inversion is Home's signature: **the orchard is the largest thing and the quietest thing** — area, not attention (Experience Blueprint § 6.2; ORCHARD2 § 3.2). **Why hierarchy is carried by light and weight, not colour:** the primary leads by *standing in the morning light*, not by wearing an accent the room lacks (OHDB § 6, § 7). **Why it is the Kept Room:** in a warm minimalist room, hierarchy is made of light and material, so colour and motion never have to shout (ORCHARD3 § 3; OHDB § 5). Contrast is measured against the accessibility floors before adoption (UIA § 15; § 18 below).

---

## 5. INFORMATION HIERARCHY

*(What Home says, in what order, and — as importantly — what it withholds until asked. Progressive disclosure is the interior principle: calm at the threshold, capability on request — Experience Architecture Principle 2; OHDB § 4. See § 16.)*

### 5.1 The three things Home says, in order — at any hour

```
  LAYER 1 — WHO / HOW WE ARE     "Good morning, Sarah."  (arrival)
  (identity + welcome + state)   "Good afternoon, Sarah. You're all set for tonight."  (return)
        │                         Known; expected; oriented. Signature voice ONCE a day (§7).
        ▼
  LAYER 2 — WHAT'S NEXT          "Thursday · a calm week ahead" · "Tonight: the traybake."
  (the honest, human state)       One or two calm lines — the true, useful thing for THIS hour.
        │                         Never a metrics wall. Honest in absence. (EXPARCH §4)
        ▼
  LAYER 3 — THE ONE DOOR         [ Look at the week ]  ·  [ Start tonight's dinner ]
  (a single primary action)       One step, chosen by the product for the hour; the person chooses
                                  to take it. Everything else is one nav-step away, not here. (P4, P5)
```

### 5.2 The hierarchy laws for Home

- **Orientation is human, honest, and thin.** *"A calm week ahead,"* not *"7/7 days planned, 82% score"* (Experience Architecture § 4; Experience Language § 5.1). **Why:** Home answers as a friend at the counter, not a manager to a report.
- **Honest in absence.** If there is nothing worth saying, Home has the confidence to stay quiet, and quiet never curdles into cold (Experience Language § 3A.4; Orchard Living Book, *Tea Before The Day Begins*). No number is shown for the sake of showing a number.
- **One door, chosen for the household, not a menu.** The single primary action is the most useful next step *for the current hour* — decided by the product, taken by the person (Experience Architecture Principle 5). **Why it is the Kept Room:** *"someone has already thought about dinner"* is made literal — the room has already decided the one useful thing (Experience Language § 3A).
- **Everything deeper is disclosed, not displayed.** Counts, breakdowns, history, settings — one step away, none of it greeting the arrival (OHDB § 4; § 16).

### 5.3 What Home never leads with, at any hour

No streaks, no scores as trophies, no notification pile, no *"you haven't…"* guilt, no unread badges, no onboarding checklist (Experience Blueprint § 16; Orchard Living Book, *Returning Home*). These are the dashboard proving it was busy while you were gone — the exact opposite of a home that simply kept.

---

## 6. THE DAILY RHYTHM — THE HOUSEHOLD'S DAY ACROSS ONE UNCHANGING MORNING

This section is the mission's *morning / midday / evening* — designed under the founding principle of § 0.3: **the room is identical at every hour; only the household's truth changes.** What follows describes the **household's** hour and the **data** it makes relevant, never a change to the house.

### 6.1 The reconciliation, stated as a table

| At this hour of the household's day | The house's light / orchard / material / layout | What Home *says* (the only thing that changes) |
|---|---|---|
| **Morning** (first entry, § 7) | **Unchanged — full morning** | *"Good morning, Sarah. A calm week ahead. You're all set for tonight."* The greeting in THA's hand (once/day); orientation to the day and the week; one door toward planning or the day ahead. |
| **Midday** (a return; check-in) | **Unchanged — full morning** | *"Good afternoon, Sarah. Tonight's handled."* No greeting re-performed (§ 8). A quieter orientation — what's still ahead today, anything worth a glance; often nothing, and that is complete. |
| **Evening** (the dinner hour) | **Unchanged — full morning** | *"Tonight: the traybake you planned."* The one useful thing is now *the meal in the next hour* — is everything in for it, one door to start it. The **household's** evening, beside a house that keeps its morning (Orchard Living Book, *Evening In The Orchard*). |

The house does not know it is evening; it knows the household's *plan for tonight* is now the nearest true thing, and it says that. **This is the entire mechanism of Home's daily rhythm.**

### 6.2 What changes through the day

Only these, and every one is the household's own truth from a canonical owner — never a house-side theme:

- **The orientation content** — the true, useful thing for the hour (the week in the morning; tonight's meal at the dinner hour). Drawn from the plan, the calendar, the pantry (Experience Architecture § 4).
- **The one primary door** — its destination follows the orientation: *look at the week* in the morning, *start tonight's dinner* in the evening. One door, re-aimed by relevance (Experience Architecture Principle 5).
- **The greeting word** — "morning" / "afternoon" / "evening" as a plain reading of the clock, in the **once-a-day** greeting only (§ 7); every later return is quieter and does not re-greet (§ 8).
- **The Living Detail's data** — *the greeting in THA's hand* renders the real clock and name (Experience Blueprint § 12.2). It is the household's day showing through, honestly.

### 6.3 What always remains (the same at breakfast and at the dinner hour)

The light (one upper-left morning, never dusk), the orchard (still, in leaf, ancient), the materials (warm plaster ground, lit oak counter), the layout (§ 3), the shell (§ 14 ref), the Companion's chair, the E3 exposure floor, and the seven feelings' warm temperature. **Why nothing here may change with the hour:** *quieter is never darker* — an evening theme, a dusk palette, or a "wind-down" mood is *the second sun*, a governed anti-pattern (Experience Blueprint § 7, § 16; OHDB § 11). **Why it supports the household:** at the end of a long day there is something profoundly restful about a room that will look exactly the same at dawn (Orchard Living Book, *Evening In The Orchard*). **Why it is the Kept Room:** the Kept Room's timelessness *is* its constancy (OHDB § 14.1); a house that dressed for the evening would have followed a fashion of the hour.

### 6.4 The absolute rule of the daily rhythm

> **Home shows the hour of the household's life by telling the true thing for that hour — never by changing its own light, colour, or mood. If a design proposes an "evening Home," a "night mode as atmosphere," or a dimmed dinner-hour palette, it has broken the one-morning law and must STOP (Experience Blueprint § 7, § 16).**

---

## 7. ARRIVAL SEQUENCE

*(Owned by [`ORCHARD2_FIRST_LIGHT.md`](./ORCHARD2_FIRST_LIGHT.md). Cited, not restated.)*

The first entry of each day is **First Light**: the threshold crossed, the greeting in THA's hand (once a day), the one sanctioned light moment settling warmly on the counter, orientation resolving beneath the greeting, the Companion arriving a beat after you, and the one door becoming reachable — the whole choreography complete in one viewport in a few seconds, always subordinate to content (ORCHARD2 §§ 5, 8). HOUSE1 changes nothing about it and adds only its *place in the room*: First Light is **the Entrance Hall's opening beat**, spent at most once per day, after which the room settles into its permanent, at-rest state (§ 2.1) for the rest of that day's comings and goings.

**Why the arrival is a separate, rationed thing:** the greeting's power is its scarcity (Experience Blueprint § 10, § 12.2). A welcome re-performed on every return would wear out until it meant nothing — *"the greeting worn out by overuse"* (Orchard Living Book, *First Light*). The Entrance Hall protects the greeting by spending it once and then simply *keeping*.

---

## 8. RETURNING HOME — THE MANY ENTRIES OF AN ORDINARY DAY

*(The lived rule is the Orchard Living Book's chapter *Returning Home*; the greeting ceiling is Experience Blueprint § 12.2. Applied here to the permanent room.)*

A household enters Home many times a day — before work, at lunch, on the way past, at the dinner hour, late. **Every entry after the first is a *return*, not an arrival**, and the design of a return is the design of *constancy*:

```
  FIRST ENTRY (once/day)          LATER RETURNS (every other entry)
  ───────────────────────         ─────────────────────────────────
  greeting in THA's hand   →      NO greeting re-performed; a plain, quiet state line
  the one light moment      →     no light moment; the room is simply, already, there
  Companion arrives a beat  →     Companion in the same chair, a beat behind, as always
  full orientation to day   →     the true thing for THIS hour, often a single calm line
  "I've come home."         →     "…it kept. I'm just back."
```

- **The room is exactly as it was left.** Same warm morning, same still orchard, same honest planes; nothing rearranged to seem fresh, nothing greeting you differently to prove it was busy (Orchard Living Book, *Returning Home*). **Why:** the particular relief of a return is a place that did *not* change under you (Experience Language Principle E).
- **The greeting is not re-spent.** Returns get a plain warm state line, not the signature hand (Experience Blueprint § 12.2). **Why it supports the household:** the warmth of return is *being kept*, not being performed at.
- **Orientation is even thinner on return.** Often there is nothing new worth saying, and Home stays quiet — present, ready, complete in its quiet (Experience Language § 3A.4; Orchard Living Book, *Quiet Moments*). **Why it is the Kept Room:** *the quiet of a room someone keeps, not the quiet of a room no one uses* (OHDB § 4).
- **The Companion is there again, in the same chair**, arriving a beat behind as it always does — not pouncing with everything that happened while you were out (Orchard Living Book, *Returning Home*; § 9).

> **The returning-home test:** *does coming back to Home feel like walking back into your own kitchen — unchanged, warm, one step from anywhere — or like reloading an app that rearranged itself while you were gone?*

---

## 9. COMPANION PLACEMENT AND BEHAVIOUR

*(Conduct is Experience Architecture § 11's; feeling is Experience Language Principle 7 and § 5.7's; place in the house is Experience Blueprint § 13's. Applied to the permanent Home.)*

The Companion is **the knowledgeable friend at the counter** — a presence, not a room — and in Home it holds its most characteristic and most restrained form, all day.

- **Placement: one fixed chair, foreground, lower-right.** The same position at every hour and in every room (Experience Blueprint § 13). **Why it belongs here:** an entrance hall has a person in it who knows the house; that person always stands in the same place, so you never hunt for them. **Why it is the Kept Room:** the Companion carries the room's own warm light, never a view or a stage of its own (Experience Blueprint § 13; OHDB § 13.8).
- **Behaviour: arrives a beat after you.** On first arrival and on every return, the person crosses first; the Companion joins after (Experience Blueprint § 12.2). That beat is its entire sign of life — no pulse, no typing dots, no face, no simulated mood (UIA § 10). **Why:** manners rendered as timing keep the household the subject.
- **Behaviour: waits, and silence is a valid state.** It says nothing until there is something worth saying (Experience Language § 5.7; Orchard Living Book, *Tea Before The Day Begins*). **Why it supports the household:** a friend who fills every silence to seem useful is exhausting; one content to simply keep you company is a comfort.
- **Behaviour: if it speaks, it offers once and never decides.** A single low, plain line when something genuinely needs the household — *"you're low on the thing you use every week"* — offered the way a friend slides it across the counter, then out of the way (Experience Architecture Principle 5). **Why it is the Kept Room:** the care is real and quiet; the household's choice always stays theirs.

**What the Companion never does in Home:** greet you *before* the house has (it never pre-empts the welcome); follow you around the room; perform helpfulness; open a return with everything that happened while you were away; or be lit differently from the room so it becomes a stage (Experience Blueprint § 13). Its finest hour in the Entrance Hall is the one where, a few seconds in, you have forgotten it is software at all (Orchard Living Book, *Cooking Together*).

---

## 10. ORCHARD RELATIONSHIP

*(The orchard — one canonical environment, one season, always present, never walked into — and the Orchard Exposure Scale are the Experience Blueprint's (§ 6). Its meaning as *life* is the Experience Language's (§ 3A.3). Applied to Home, the one E3 room.)*

Home is the **one room at E3, the open view** — the only room in the house where the orchard is visible as itself, generously, because at Home *looking is part of the purpose* (Experience Blueprint § 6.2; Orchard Living Book, *The View Into The Orchard*).

- **The orchard is the setting, never the decoration** (Experience Blueprint § 6, § 16). Even at its most generous, it holds the eye's *rest*, never its *work* (§ 4). **Why Home earns the most orchard:** every other room has more to do and lowers the horizon; Home's job includes the view, so Home keeps it (§ 6.2).
- **It is ancient and timeless** — mature, in leaf, in one perpetual morning, tended for generations; never gloomy, misty, autumnal, or turning with a calendar (Experience Blueprint § 6.0; Experience Language § 3A.3). **Why it supports the household:** a thing that does not change is a thing you can trust and never have to tend — its permanence is the whole comfort (Orchard Living Book, *The View Into The Orchard*).
- **It never carries text, never animates, never invites exploration of itself** (Experience Blueprint § 6.1). Any type sits on the counter's ground, never on the landscape; legibility is never traded for atmosphere. **Why it is the Kept Room:** the Kept Room grafts the Glass Pavilion's *disciplined* view — a generous quiet window where looking is the point — while leaving its coldness behind (ORCHARD3 § 5.2). The orchard is the light and life of the room, sized to Home's purpose, and nothing more.
- **The orchard is the household's gentle companion beyond the house, all day.** It is the reason Home feels open rather than enclosed, warm rather than clinical — the life outside the window that makes the calm inside feel *alive* rather than empty (Experience Language § 3A.3, § 3A.4). It stays exactly as bright and alive at the dinner hour as at breakfast (§ 6.3).

---

## 11. LIGHT BEHAVIOUR

*(The house's light — one sun, one direction, one morning — is the Experience Blueprint's (§ 7); its meaning is the Experience Language's (Principles 6, F); every value is the UI Architecture's (§ 7). Home is the brightest room.)*

Home is lit by the same low, warm, **upper-left morning sun** that lights every room, and it is the **brightest room of them all** — full morning, the most open exposure (Experience Blueprint § 5.1, § 7). It is the light of a kitchen at the good hour: warm, generous, optimistic, and utterly consistent. Every shadow in the room agrees on one direction, because the house has exactly one sun and always will.

- **Light carries five meanings and no others — welcome · warmth · calm · clarity · optimism** — and never performs or alarms (Experience Language Principles 6, F).
- **Light is hierarchy's quietest instrument.** The greeting and the one door stand in the light; orientation waits a half-step back in the penumbra; the view rests in generous even morning — depth meaning distance, never drama (Experience Blueprint § 7; OHDB § 6). All contrast is measured against the accessibility floors before adoption (UIA § 15).
- **The house has lighting, not light shows.** The one sanctioned light *moment* is the arrival's (§ 7 → ORCHARD2 § 5.2); it reads as morning sun settling on a surface, once, softly. Outside that single moment, light never moves, sweeps, or glows (Experience Blueprint § 7).
- **The light never changes with the hour.** This is the load-bearing law of § 6: no dusk, no night mode as atmosphere, no shade as mood. **Why it is the Kept Room:** the Kept Room's warmth is carried by *warm morning light on warm material* (ORCHARD3 § 5.1); to darken it in the evening would be to trade the room's whole soul for a novelty of the hour.

---

## 12. MATERIAL LANGUAGE — HOME AS THE KEPT ROOM

*(The material *direction* — the three grounds, the ground plane as the room's identity, air as a material — is the Experience Blueprint's (§ 8); the *sensibility* is the Orchard House Design Blueprint's (§ 5) and ORCHARD3's Kept Room (§ 5.1, § 5.3). Every material *value* — radius, shadow definition, surface tokens, spacing — is the UI Architecture's (§ 4, § 9, § 16). The design reading only; nothing here ships ahead of § 0.4.)*

Home is the first and clearest expression of **The Kept Room** — warm minimalism, modern bones and warm skin (ORCHARD3 § 5). Its material sensibility:

- **The warm ground before anything else.** Home's default is a warm, hand-finished-feeling ground plane in low morning light — the plaster wall of a Barragán interior at the good hour — never a white or cool canvas (ORCHARD3 § 5.3; Experience Language § 3A). **Why it is the Kept Room:** warmth is carried by *light and material, never by ornament* (OHDB § 12); if a surface feels cold, the fix is warmer light and honester material, never a decorative flourish.
- **The counter is warm oak, worn smooth by use.** The middle ground — the compact working counter — is where the room becomes itself (Experience Blueprint § 8.1). One solid, warm, lit plane; one ground, never nested (Experience Blueprint § 8.2). **Why it belongs in Home:** an entrance hall has one honest surface where the day's things are set down; Home's is compact so the view keeps its share (§ 2).
- **Texture is implied by light and honesty, never painted on.** The fine tooth of plaster, the grain of oak — felt because the surface is a real warm working plane, never because a wood-grain or paper-fibre was illustrated onto it (OHDB § 3, § 9). **Why:** structural honesty is the first law of the house's design; a drawn texture would be *the theme park* (Experience Blueprint § 16).
- **Patina by data, never by paint.** The only ornament is the household's own life showing through — the greeting's real clock and name (Experience Blueprint § 12). A drawn crumb, a faux worn edge, a decorative flourish is fabricated feeling, forbidden by construction (Experience Blueprint § 12.1; OHDB § 3). **Why it is the Kept Room:** the Kept Room's whole tradition is *warmth and calm produced by material honesty and the evidence of use* (ORCHARD3 § 2.2).
- **Modern restraint, so warmth never tips to rustic.** Clean structure, generous air, one primary action, no literal furniture, no farmhouse motif (OHDB § 3, § 4; ORCHARD3 § 4.3). **Why:** the Kept Room is warm *minimalism* — plaster and oak handled with modern discipline, not a cottage rendered literally (ORCHARD3 § 4.3, its named handling risk).

---

## 13. SURFACE DEPTH

*(The depth vocabulary — ground plane, warm shadow, penumbra, the three grounds, the hand answering physically — is the Experience Blueprint's material and light direction (§ 7, § 8) and the OHDB's design reading (§ 9); it remains unshippable until the governed UIA § 4 amendment lands (§ 0.4). The sensibility only.)*

Depth in Home is **soft, warm, and shallow** — the depth of a well-lit room, never a dramatic stage (OHDB § 9):

- **Depth means distance, not drama.** Three grounds — the world behind (the orchard), the room in the middle (the counter), what floats in front (the Companion, overlays). Elevation is reserved for what genuinely floats; the counter sits calmly in the room's light (Experience Blueprint § 8.1). No deep drop-shadows for effect, no parallax, no game-like depth (Experience Blueprint § 16, *the rendered world*).
- **Shadow is warm and soft and single-direction.** One family of soft warm shadows agreeing on the one morning sun (Experience Blueprint § 7; OHDB § 9). A hard, cool, or multi-directional shadow would read as a second sun (§ 16).
- **The hand answers physically, identically to every other room.** Hover lifts into the light; press seats; focus is the canonical ring — one interaction feel product-wide (Experience Blueprint § 8.2; § 17). **Why it is the Kept Room:** depth is something the household *feels through their pointer*, subtly and consistently, far more than something they see (OHDB § 9).

---

## 14. MOTION PHILOSOPHY

*(Motion is fully owned — vocabulary of durations and easings is the UI Architecture's (§ 11); what it must feel like is the Experience Language's (Principles 4, 12, D). This section composes the owned rules into the permanent room and adds no rule.)*

> **The one test, quotable in any review:** *if the person notices the animation before they notice the content, the animation has failed* (Experience Language Principle H; Experience Blueprint § 9).

- **The one sanctioned light moment is the arrival's, spent once a day** (§ 7 → ORCHARD2 § 5.2). Returns and the rest of the day have no light moment; the room is simply, already, there.
- **The one mannered motion is the Companion's arrival beat** (§ 9). Nothing else in Home moves for its own sake.
- **The shell never moves; the orchard never moves; Living Details never animate** (Experience Blueprint § 6.1, § 12.1, § 14). Place survives total stillness; the view's life is warmth and light, never movement.
- **Motion yields instantly to intent.** If the person acts during any settle — taps the door, starts navigating — the motion completes immediately and gets out of the way (Experience Language Principle 12; Experience Architecture Principle 8, *attention is borrowed, never taken*). **Why it is the Kept Room:** restraint in motion is what keeps Home feeling timeless rather than of a fashionable moment (OHDB § 14); a kept room is still.

---

## 15. EMPTY STATE PHILOSOPHY

*(Composed emptiness is the OHDB's interior philosophy (§ 4); the empty-state exposure rule is the Experience Blueprint's (§ 6.2, rule 2); honest-in-absence is the Experience Language's (§ 3A.4). Applied to Home.)*

Home is frequently, legitimately quiet — a well-run household on a calm day has little to report — so the empty state is not an edge case here; it is a *primary* state, and it must be the warmest one, not the coldest.

- **Composed emptiness, never bare emptiness.** A quiet Home is *the deliberate quiet of a room someone keeps, not the emptiness of a room no one uses* (OHDB § 4; Orchard Living Book, *Quiet Moments*). **Why it is the Kept Room:** this exact distinction is the Kept Room's founding idea and the reason it was chosen over the Glass Pavilion's cold calm (ORCHARD3 § 4.3, § 5).
- **Honest in absence.** When there is nothing worth saying, Home says nothing — and stays complete (Experience Language § 3A.4). The greeting and the orchard and the warm ground are enough; the room does not invent content to fill itself (Experience Blueprint § 12.3). **Why it supports the household:** a calm day should *feel* calm, not be dressed up into busyness to justify the screen.
- **The window may open one level for an honest empty state — never two.** Home is already E3, the top of the scale, so this rule mostly protects the rooms off it; at Home the equivalent is that a quiet day lets the *view breathe* and the counter stay small, and the moment there is genuine content the counter takes its share back (Experience Blueprint § 6.2, rule 2). A full-strength room with nothing in it must never read as *nobody home* (§ 16, *all view, no room*) — the greeting, the orientation's honest line, and the Companion's quiet presence keep a quiet Home unmistakably *kept*.
- **The single guard against calm curdling into cold** is that a quiet Home is visibly *lived in*: the household's own name in the greeting, the orchard alive beyond the glass, the friend in the chair (Experience Language § 3A.4; Orchard Living Book, *Quiet Moments*). **Why:** an empty white room is funeral-parlour calm — the one thing THA must never be (Experience Language § 3A.1); a warm, tended, quiet room is the thing it must always be.

---

## 16. PROGRESSIVE DISCLOSURE

*(Owned as behaviour by Experience Architecture Principle 2 and as an interior principle by OHDB § 4. Applied to Home.)*

Home practises *calm at the threshold, capability on request*:

- **Arrival greets with almost nothing** — a name, a line, a door (§ 5). The room's depth is revealed only as the household reaches for it. **Why it belongs in the Entrance Hall:** a hall does not show you the whole house at once; it lets you choose which door to open.
- **Scrolling is walking further into the same room, not a second screen** (Experience Language Principle D; Experience Blueprint § 4). If Home has more to show, it is *below*, reached by walking in — never crammed above the fold. Arrival stays complete in one viewport (§ 2.2).
- **Counts, breakdowns, history, and settings are one nav-step away, never on the counter** (OHDB § 4). Home *orients*; the rooms off it hold the depth. **Why it supports the household:** the person is never made to process everything to understand anything; stress comes *down* across a visit, not up (ORCHARD2 § 8.1).
- **The Companion's knowledge is disclosed on request, not displayed** (§ 9; Experience Architecture § 11). It waits; it does not unfold everything it knows the moment you arrive.

---

## 17. INTERACTION PHILOSOPHY

*(Behaviour owned by Experience Architecture Principles 4, 5, 8; the physical feel by Experience Blueprint § 8.2. Applied to Home.)*

- **One primary action, always.** Home offers exactly one door forward, chosen for the hour (§ 5, § 6). **Why:** a single door removes the small stress of a menu at the threshold and demonstrates the product has already thought on the household's behalf — the core of *"someone has already thought about dinner."*
- **The product orients; the person chooses.** Home decides the *most useful* next step and offers it; it never takes the step for the household, and the full house stays reachable through the constant navigation (Experience Architecture Principle 5). **Why it is the Kept Room:** quiet competence on the household's side, never a decision made over their head.
- **The hand answers physically and identically to every room.** Hover lifts into the light, press seats, focus is the canonical ring (Experience Blueprint § 8.2; § 13). Home invents no gesture, no swipe, no interaction its neighbours lack. **Why:** one interaction feel product-wide is part of what makes many rooms one house.
- **Attention is borrowed, never taken.** Nothing in Home interrupts, modals the arrival, or demands input before the welcome has landed (Experience Architecture Principle 8; ORCHARD2 § 12). **Why it supports the household:** the welcome is a gift, never a gate.

---

## 18. ACCESSIBILITY CONSIDERATIONS

*(Every floor and value is the UI Architecture's (§ 15) and the Experience Architecture's; this section names how Home meets them — it sets no new value.)*

Accessibility is not a layer added to Home; it is a condition of the Kept Room being *honest*. A warm room no one can read is not warm — it is decoration.

- **Contrast is measured against the floors before any adoption.** The warmth of the ground and the softness of the light never trade legibility for atmosphere: all text sits on the counter's solid ground, never on the orchard, and every greeting, orientation line, and door meets the contrast floor (UIA § 15; Experience Blueprint § 6.1). **Why it is the Kept Room:** *legibility is never traded for atmosphere* is a house law, not an accessibility afterthought.
- **Reduced-motion is fully honoured.** The one light moment and the Companion's arrival beat both respect the reduced-motion preference; with motion reduced, Home is simply *already there*, complete and correct, losing nothing (Experience Language Principle 12; UIA § 11). **Why:** the arrival is *felt, not watched* (ORCHARD2 § 5) — so a person who cannot or does not want motion still gets the whole of it.
- **Hierarchy never rests on colour alone.** The primary door leads by standing in the light and by weight, not by an accent hue (§ 4; OHDB § 7); status and emphasis are legible without relying on colour (UIA § 15). **Why:** colour-blind and low-vision households must read Home exactly as clearly as anyone.
- **Structure is semantic and keyboard-complete.** The shell, the greeting region, the one door, and the Companion are reachable and operable by keyboard and screen reader in the same order the eye meets them (§ 4); focus order follows the visual hierarchy; the canonical focus ring is always visible (Experience Blueprint § 8.2; UIA § 15). **Why it belongs in the Entrance Hall:** a hall everyone can enter the same way is the most basic courtesy of a home.
- **Text scales without breaking the room.** Generous measure and leading mean Home reflows, never crops, when type is enlarged (OHDB § 8; UIA § 9). The counter grows to hold more; it never shrinks the type to fit (§ 12). **Why:** the house never crowds its type to fit more in.

> **The accessibility test for Home:** *can every household — however they see, hear, move, or read — arrive, be oriented, and take the one door, with the same calm and the same warmth as anyone else?* If not, the room is not finished.

---

## 19. RESPONSIVE BEHAVIOUR — ONE HOUSE AT THREE SIZES

*(The responsive system and every breakpoint value are the UI Architecture's; this section names the design intent — the same room, honestly proportioned to the device — and sets no value. Mobile-first, per Experience Architecture and the platform-experience work PX1.)*

Home is **one room** whether entered on a phone, a tablet, or a desktop — same walls, same morning, same orchard, same counter, same one door. The device changes the room's *proportions*, never its *identity* (Experience Blueprint § 4, § 5.2). It is designed **mobile-first**, because that is where most households arrive.

### 19.1 Mobile — the room in the hand (the primary design)

```
 ┌───────────────────────┐
 │ ▓ THA            ⌂    │  walls: compact header
 ├───────────────────────┤
 │   ~ open view (E3) ~  │  the orchard keeps a
 │  ~  one morning   ~   │  generous BAND at the
 │                       │  top — E3 held, not
 ├───────────────────────┤  dropped, on a phone
 │  Good morning, Sarah. │  ← the counter fills
 │  A calm week ahead.   │    the width; greeting,
 │  You're set tonight.  │    state, ONE door
 │  [ Look at the week ] │    stacked in reading
 │                       │    order
 ├───────────────────────┤
 │        (nav bar)  ( ◐)│  canonical bottom nav
 └───────────────────────┘    (UX1); Companion in
                              its fixed corner
```

- **The vertical rhythm is the phone's native gift** — sky above, counter below, one horizon — so Home's composition (§ 2.2) is *most* itself on mobile. **Why mobile-first:** the household most often arrives on a phone, between other things; the room must be complete and calm in a thumb's reach.
- **The counter takes the full width; the view keeps a generous band above it.** E3 is *held* on mobile — the orchard is not dropped to a thin strip, because Home's purpose still includes the view (Experience Blueprint § 6.2). The counter is compact in the vertical, not the horizontal.
- **One primary door, thumb-reachable, in the lower third.** Everything the household reads is above it in reading order (§ 5). **Why it supports the household:** the one useful thing is exactly where a thumb rests.
- **The canonical bottom navigation is the shell on mobile** (UX1 — Canonical Bottom Navigation); the Companion keeps its fixed corner. The walls are the same walls, sized for the hand.

### 19.2 Tablet — the room on the table

```
 ┌────────────────────────────────────┐
 │ ▓ THA   Home Planner Cookbook … ⌂  │  walls: fuller nav returns
 ├────────────────────────────────────┤
 │     ~ ~   open view (E3)   ~ ~     │  the view widens; the
 │   ~   ancient orchard, morning ~   │  horizon lengthens
 │   ┌────────────────────────────┐   │
 │   │ Good morning, Sarah.        │   │  ← counter centres, keeps
 │   │ A calm week ahead.          │   │    comfortable measure —
 │   │ [ Look at the week ]        │   │    does NOT stretch full
 │   └────────────────────────────┘   │    width (§8.2 air)
 │                           ( ◐ )    │
 └────────────────────────────────────┘
```

- **The room widens, the counter does not sprawl.** As width grows, the counter holds a comfortable measure and lets *air* take the extra room (Experience Blueprint § 8.2; OHDB § 8). **Why:** the house never crowds or stretches its type to fill a screen; generous air is the resting state.
- **The horizon lengthens; the view becomes more like a window onto a landscape.** Tablet is where E3 begins to feel most like *standing at the wide window* (Orchard Living Book, *The View Into The Orchard*). **Why it is the Kept Room:** the disciplined generous view is the Pavilion's gift, kept at Home (ORCHARD3 § 5.2).
- **The fuller shell navigation returns** where width allows (Experience Architecture § 8); the Companion keeps its corner.

### 19.3 Desktop — the room entire

```
 ┌──────────────────────────────────────────────────────────┐
 │ ▓ THA        Home  Planner  Cookbook  Pantry  …      ⌂    │
 ├──────────────────────────────────────────────────────────┤
 │        ~ ~ ~   the open view — E3, widest   ~ ~ ~        │  the fullest horizon in
 │      ~   ancient orchard in one morning light   ~       │  the house; generous sky
 │         ┌────────────────────────────────────┐          │
 │         │ Good morning, Sarah.                │          │  ← counter stays COMPACT and
 │         │ Thursday · a calm week ahead.       │          │    CENTRED — the extra width
 │         │ You're all set for tonight.         │          │    becomes air and view, never
 │         │ [ Look at the week ]                │          │    a wider dashboard (§16 anti-
 │         └────────────────────────────────────┘          │    pattern: all view, no room —
 │                                          ( ◐ )          │    avoided by the counter's real
 └──────────────────────────────────────────────────────────┘    weight and content)
```

- **The extra space becomes air and view, never more widgets.** The single greatest desktop temptation is to fill the width with a dashboard grid; Home refuses it (Experience Blueprint § 16; Experience Language Principle G). The counter stays compact and centred; the width becomes generous morning and orchard. **Why it supports the household:** a bigger screen should feel *calmer*, not busier — more room to breathe, not more to process.
- **The counter keeps real weight and content** so the wide view never becomes *all view, no room* (Experience Blueprint § 16). **Why it is the Kept Room:** the Kept Room's soul is the warm interior ground, not the panorama; even at its widest, Home is a room with a view, not a view with a search box.
- **The one door and the Companion hold their positions**; nothing about the interaction changes across sizes (§ 17). One house, three proportions.

> **The responsive test for Home:** *at every size, is this unmistakably the same room — same walls, same morning, same counter, same one door — proportioned honestly to the device, and never turned into a wider dashboard because there was room for one?*

---

## 20. WHAT ALWAYS REMAINS, AND WHAT CHANGES — THE PERMANENCE CONTRACT

The single reference table a future designer keeps. If a proposed change moves something from the left column, it must STOP (Experience Blueprint § 15.2; § 6.4).

| ALWAYS REMAINS (the house) | MAY CHANGE (the household's own truth) |
|---|---|
| One upper-left morning light — never dusk, never dimmed (§ 11) | The greeting word — morning / afternoon / evening (clock, once/day) (§ 6.2) |
| The still, in-leaf, ancient orchard at E3 (§ 10) | The orientation line — the true, useful thing for the hour (§ 5) |
| The warm plaster ground and lit oak counter (§ 12) | The one door's destination — re-aimed by relevance (§ 6.2) |
| The permanent layout and the counter's position (§ 3) | The Living Detail's data — real clock, real name (§ 6.2) |
| The shell / walls, byte-identical, all hours (§ 14 ref) | Whether Home is quiet or has content to disclose (§ 15, § 16) |
| The Companion's fixed chair and manners (§ 9) | — nothing else — |
| The seven feelings' warm temperature (§ 6.3) | |
| One primary action, the hand's physics, the accessibility floors (§ 17, § 18) | |

> **The permanence contract, in one line:** *the house keeps; the household's day shows through. Everything the household could rely on yesterday is exactly where it was today — and the only thing new is whatever is genuinely true right now.*

---

## 21. THE FULL DAY — A NARRATIVE

*(Prose, so the feeling is legible before the rules. Each moment describes the **household's** hour and the **data** that makes it what it is; the house — light, orchard, material, layout — is identical in every one. This narrative restates no rule; it renders §§ 2–20 as lived experience, in the voice of the Orchard Living Book it extends.)*

**Morning.** Sarah opens THA before the day has asked anything of her. This is First Light (§ 7): the house was expecting her and says so once, gently, in a hand that looks written — her name, the hour, nothing more. The morning light is warm and low across the counter; the ancient orchard stands in it beyond the wide window, in leaf, unhurried, needing nothing. A calm line tells her the week is easy and tonight is handled. One door — *look at the week* — waits in the light. The Companion takes its chair a beat after her and says nothing, because there is nothing that needs saying. She is oriented in a glance and carries one sentence away: *I've come home.*

**Midday.** She comes back for a moment between things (§ 8). There is no second greeting — the house does not perform the welcome twice — just the same warm room, exactly as she left it, and a plain quiet line: *tonight's still handled.* Often there is nothing new at all, and the room has the confidence to stay quiet without turning cold (§ 15). The light has not moved. The orchard has not moved. She checks, she is reassured, she goes. The whole visit is a few seconds of *it kept.*

**Evening.** The household's day is winding toward dinner — but the house is still the same bright morning, and that is the point (§ 6, § 11). What has changed is only what is *true now*: the nearest real thing is tonight's meal, so Home says it — *tonight: the traybake you planned* — and the one door is now *start tonight's dinner.* Everything is in for it, and Home says so plainly. Sarah steps through the door into the Planner or the day's cooking, and the technology quietly disappears, leaving the meal and the people (Orchard Living Book, *Cooking Together*). The room she leaves behind is exactly as warm and morning-lit as it was at breakfast — so that at the end of a long day, there is one place that did not tire, dim, or change under her.

**And the returns in between.** Before work, at lunch, on the way past, late — each entry is a *return*, not a fresh arrival (§ 8): the same chair, the same morning, the friend a beat behind, the true thing for the hour said once and quietly, and nothing rearranged to seem busy. Across a whole ordinary day of comings and goings, Home's job was the same each time and it never raised its voice: *welcome her, tell her where things stand, open the one right door — and otherwise, simply keep.*

---

## 22. HOME AS THE GOLD STANDARD — WHAT EVERY FUTURE ROOM INHERITS

Home is the Entrance Hall, so its design *is* the household's sense of the whole house — which is exactly why it is the reference every room inherits (§ 1). What a future room takes from Home, stated once:

1. **Arrive before you work.** Every room opens with its own miniature arrival — a calm posture before its first task — as Home opens the whole session (Experience Language § 5, the fractal rhythm; Experience Blueprint § 11). Home is where that pattern is shown first and cleanest.
2. **Size the view to the room's purpose.** Home spends the most view (E3) because looking is its purpose; every other room spends less, down its exposure level, because it has more work (Experience Blueprint § 6.2). The *principle* — view sized to purpose — is Home's gift; the *level* is each room's own. **A future room inherits the discipline, not the E3 horizon.**
3. **One warm working ground, one primary action, the friend a beat behind, constant walls.** These do not change room to room; Home shows them first (§ 3, § 9, § 14, § 17).
4. **One morning, one orchard, one Companion, one shell — forever.** The constants Home establishes are the constants every room keeps (Experience Blueprint § 5.2).
5. **The Kept Room sensibility.** Warm ground before anything else; warmth from light and material, never ornament; patina by data, never paint; modern restraint so warmth never tips rustic (§ 12; ORCHARD3 § 5.3). Every room is furnished from this same sensibility.
6. **The permanence contract and the one-morning rhythm** (§ 6, § 20). A future room, too, shows its hour through the household's data, never through its own light.

A future room is **not** free to reinterpret arrival, light, the orchard, the Companion, the shell, or the Kept Room sensibility. It is free only in the four governed ways a room may differ — purpose, light *level*, material *posture*, and one sign of life (Experience Blueprint § 5). **The Entrance Hall is the worked example that makes that freedom safe.**

---

## 23. THE REASON BEHIND EVERY MAJOR DESIGN DECISION

Why each decision is the way it is — so a future designer changes it only with the reason in hand. (Each routes to its owner; none is new law.)

| # | Decision | Why it exists · why it belongs in Home · why it supports the household · why it is the Kept Room |
|---|---|---|
| 1 | **Home is the Entrance Hall, not a dashboard** | The product's whole promise is *a home, not a dashboard* (Experience Blueprint § 4; Experience Language Principle G). An entrance hall is entered, returned to, and connected to every room — the exact posture Home needs. It supports the household by making the first feeling *arrival*, not work. It is the Kept Room because a hall is warm, kept, and quiet — never where the work piles up. |
| 2 | **One unchanging morning carries the whole day; only the household's data changes** | *Quieter is never darker; time shows through the household's life, never the house's weather* (Experience Blueprint § 7; OHDB § 11). Home belongs to the household's whole day, so it must serve every hour — and it does so by *saying the true thing*, not by changing its light. It supports the household by giving them one place that never tires or dims. It is the Kept Room because the Kept Room's timelessness *is* its constancy (OHDB § 14.1). |
| 3 | **The permanent layout never moves** | Familiarity is rest (Experience Language Principles 9, 11, E). A hall you never have to relearn belongs at the heart of the house. It supports the household by spending none of their attention on finding their bearings. It is the Kept Room because a room that rearranged itself would be the opposite of kept. |
| 4 | **Home is E3; the counter is compact** | Home is the one room whose *purpose includes the view* (Experience Blueprint § 6.2). A compact counter is the mechanism that keeps the view generous without *all view, no room* (§ 16). It supports the household by giving them openness *and* a real working surface. It is the Kept Room because the Kept Room grafts the Pavilion's disciplined view onto a warm interior soul (ORCHARD3 § 5.2). |
| 5 | **The orchard is largest in area, quietest in attention, still, ancient, and never carries text** | The orchard is *the setting, not the decoration*, and it means *life* (Experience Blueprint § 6; Experience Language § 3A.3). It belongs at Home because Home is the one E3 room. It supports the household as the living presence that keeps the calm from going cold. It is the Kept Room because life is carried by warmth and light, never motion or wallpaper (ORCHARD3 § 5.2). |
| 6 | **The greeting is spent once a day; returns are quieter** | Scarcity is the signature's entire value (Experience Blueprint § 10, § 12.2). The first entry of the day is First Light; every return is *Returning Home*. It supports the household because the warmth of return is *constancy*, not a repeated performance. It is the Kept Room because a kept house welcomes once and then simply keeps (Orchard Living Book, *Returning Home*). |
| 7 | **Orientation is one or two human lines, honest in absence** | Home answers *how are we / what's next* as a friend, not a manager (Experience Architecture § 4; Experience Language § 5.1). A thin honest line belongs where the household checks in. It supports the household by never dressing a calm day into false busyness. It is the Kept Room because a quiet that stays warm is the room's founding idea (OHDB § 4). |
| 8 | **One primary door, chosen by the product for the hour** | *One primary action* and *the product orients, the person chooses* (Experience Architecture Principles 4, 5). One door belongs at a threshold. It supports the household by removing the stress of a menu and proving the product already thought on their behalf. It is the Kept Room because *someone has already thought about dinner* is made literal. |
| 9 | **The Companion has one fixed chair and arrives a beat behind, all day** | Manners rendered as timing is its entire sign of life (Experience Blueprint § 13, § 12.2). A person who knows the house belongs in the hall, always in the same place. It supports the household by being present without pressure. It is the Kept Room because the friend carries the room's own warm light, never a stage. |
| 10 | **One light moment (arrival only); otherwise the room is still** | The house has lighting, not light shows (Experience Blueprint § 7, § 9). Stillness belongs in a kept room. It supports the household because motion noticed *as* motion has failed the governing test. It is the Kept Room because restraint keeps Home timeless, not fashionable (OHDB § 14). |
| 11 | **The shell is byte-identical at every hour and every size** | The walls make many rooms one house (Experience Blueprint § 14). A constant frame belongs around a room entered so often. It supports the household by making return effortless. It is the Kept Room because the same walls, forever, are what let the household relax into a place they know. |
| 12 | **The empty state is a primary, warm state — composed, not bare** | A well-run household is often calm (OHDB § 4; Experience Language § 3A.4). A warm quiet belongs at the heart of the house. It supports the household by letting a calm day *feel* calm. It is the Kept Room because *the quiet of a room someone keeps* is the exact reason the Kept Room was chosen over the cold Pavilion (ORCHARD3 § 5). |
| 13 | **Mobile-first; the same room honestly proportioned; the desktop width becomes air, not widgets** | Most households arrive on a phone (PX1; Experience Architecture). One room at three sizes belongs to *one home* (Experience Blueprint § 5.2). It supports the household by feeling *calmer* on a bigger screen, not busier. It is the Kept Room because even at its widest, Home is a room with a view, never a view with a search box (§ 16, *all view, no room*). |
| 14 | **No dashboard furniture — no scores, streaks, badges, notification piles, at any hour** | These prove the product was busy while you were away; a home simply *kept* (Orchard Living Book, *Returning Home*; Experience Blueprint § 16). Their absence belongs at a threshold meant to lower stress. It supports the household by keeping them the subject, not the software. It is the Kept Room because the only ornament is the household's own life (OHDB § 4; § 12). |

---

## 24. WHAT IS DELIBERATELY ABSENT

Named so their absence is understood as a decision, not an omission (Experience Blueprint § 16; Experience Language § 7):

- **No dashboard, metric tiles, or KPI row** — Home is a place, not a report (Experience Language Principle G).
- **No evening theme, night mode as atmosphere, dusk palette, or dimmed dinner-hour Home** — one morning, forever; quieter is never darker (Experience Blueprint § 7, § 16; § 6.4). *This is the absence most specific to HOUSE1.*
- **No re-performed greeting on return** — the signature voice is spent once a day (Experience Blueprint § 12.2; § 8).
- **No rearrangement to seem fresh** between visits — the permanence contract (§ 3, § 20).
- **No red badges, unread counts, or notification pile** at the door (Experience Blueprint § 16).
- **No onboarding modal, coach-mark, tour, or checklist** interrupting the welcome (Experience Architecture Principle 8).
- **No marketing hero, carousel, or promotional band** — nothing is sold to the household in their own home.
- **No animated orchard** — no drifting mist, swaying trees, moving light, parallax, or ambient life (Experience Blueprint § 6.1).
- **No second sun** — no fog, spa-light, or drama; one morning (Experience Blueprint § 16).
- **No signature voice beyond the single daily greeting** (Experience Blueprint § 10).
- **No fabricated warmth** — no drawn kitchens, painted produce, fake steam, faux wood-grain, handwriting-being-drawn effects; every warm thing is *true* (Experience Blueprint § 12; OHDB § 3; § 12).
- **No widening into a desktop dashboard** because the screen had room (§ 16, *all view, no room*; § 19.3).
- **No confetti, reward animation, or celebration** — earned delight only; arrival and return are not achievements (Experience Language Principle 10).

---

## 25. THE DESIGN PRINCIPLES OF THE ENTRANCE HALL

The ten principles that make a permanent Home a *kept* one. Each is the applied, Home-specific reading of an owned rule; a design a decade from now stays the Entrance Hall by keeping these.

1. **The house keeps one morning; the household's day shows through.** Home reflects the hour by saying the true thing for it, never by changing its light, colour, or mood. *(Experience Blueprint § 7; OHDB § 11.)*
2. **Arrive once; return many times; relearn never.** The first entry is First Light; every entry after is a quiet return to an unchanged room. *(Experience Blueprint § 12.2; Orchard Living Book, *Returning Home*.)*
3. **The layout is permanent; the truth is fresh.** Everything the household relied on is where it was; only what is genuinely true right now is new. *(Experience Blueprint § 15.2; § 20.)*
4. **The view is generous and quiet; Home alone is E3.** The orchard holds the eye's rest, never its work, and never carries text. *(Experience Blueprint § 6.2.)*
5. **The warm ground is the soul; the counter keeps its share.** A warm plaster ground and a lit oak counter, compact so the view keeps its own — the Kept Room made a room. *(ORCHARD3 § 5; Experience Blueprint § 8.)*
6. **One door, chosen for the hour.** Exactly one primary action, re-aimed by what is true now — the product orienting, the person choosing. *(Experience Architecture Principles 4, 5.)*
7. **Quiet is a warm state, not a cold one.** A calm Home stays composed and lived-in — the quiet of a room someone keeps, honest in absence, never dressed into busyness. *(OHDB § 4; Experience Language § 3A.4.)*
8. **The friend keeps one chair, all day.** Present, a beat behind, silent unless there is something worth saying — never re-performing, never following. *(Experience Blueprint § 13.)*
9. **One room at three sizes.** The same walls, morning, counter, and door on a phone, a tablet, and a desktop — width becomes air and view, never a wider dashboard. *(Experience Blueprint § 5.2; § 16.)*
10. **The walls never move; the household is the subject.** The shell is byte-identical and silent; technology and design both quietly disappear, leaving a person, welcomed, in a place that kept. *(Experience Blueprint § 14, § 1.5; OHDB § 1.2.)*

> **The Entrance Hall test, in one line:** *Across a whole ordinary day of comings and goings, was the household welcomed, oriented, and quietly kept — in one warm morning that never changed — and did they notice the home, never the software?*

---

## 26. COMPLIANCE

This is a design specification, not governing law and not an implementation; it touches no code, no component, no token, and no governing document. It is checked against the gates it will one day be built under.

- **The Experience Test (Experience Blueprint § 15.3):** *Which room?* Home, the Entrance Hall (§ 0.1, § 1). *How should someone feel?* At home — welcomed, oriented, kept, warm (§ 0.1). *The one thing?* Arrive and be oriented, then take the one right door (§ 0.1). **Passes.**
- **The Blueprint Checks (Experience Blueprint § 15.2):** one home (§ 1, § 3); a room not a theme (§ 12, § 24); the map respected — Home E3, full morning, compact counter (§ 2, § 10, § 11); orchard law — still, ancient, never wallpaper or text or animation (§ 10); one morning — no dusk at any hour (§ 6, § 11); material honesty — one ground, never nested, air generous (§ 12, § 13); Living Detail discipline — one, the greeting, data-borne, honest in absence (§ 7, § 15); the Companion in its chair (§ 9); the walls untouched (§ 3, § 14 ref); the governance path declared, not jumped (§ 0.4). **Passes.**
- **The Design Character Check (OHDB § 16.2):** architectural character — structural honesty, glazed toward the orchard, natural light and material, uncluttered, quietly confident (§ 12, § 13); interior philosophy — composed emptiness, everything meant, decorated only by real life (§ 12, § 15); timeless not fashionable — one morning, no evening theme, no trend (§ 6, § 24); design disappears (§ 0, § 25.10); the room reading honoured — matches OHDB § 13.1 Home exactly (§ 2, § 10, § 11). **Passes.**
- **One owner per rule (Experience Blueprint § 18; Architecture Principle 2):** every rule is cited to its owner; this document creates none. If any line here is found to duplicate an owned rule, this line is the defect and is corrected to a citation.

---

*A design specification — the definitive design of the permanent Home experience, in the adopted Kept Room identity, built on the Experience Blueprint (the place), the Orchard House Design Blueprint (the design language), the Orchard Living Book (the lived account), ORCHARD2 First Light (the arrival moment), and ORCHARD3 (the visual soul). It applies their rules and owns only the concrete design of one room; it restates no rule and creates no second owner. Subordinate to the Experience Architecture, which prevails in any conflict.*
*Nothing here ships until the governance path of § 0.4 is walked (the Kept Room's graduation by amendment · the UIA § 4 amendment · tokens by admission · the greeting admitted as its own decision) and the Blueprint's open items on the orchard's owner and Home's header are closed.*
*Rollback: this document is new and uncommitted — to revert entirely, delete the file. Rollback tag for the HOUSE1 workstream: `rollback/HOUSE1-the-entrance-hall-20260715` → `b3c650cd`.*
