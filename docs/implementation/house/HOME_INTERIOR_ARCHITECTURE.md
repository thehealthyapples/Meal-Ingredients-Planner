# HOME — Interior Architecture Review

**Eight completed interiors for the one approved house. Not eight dashboards — eight homes.**
The structural architecture is locked. This is the interior architect's review of everything a family
*experiences* once the walls, roof and orchard are finished.

| | |
|---|---|
| **Session** | `HOME_INTERIOR_ARCHITECTURE` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/HOME-INTERIOR-ARCHITECTURE-20260717` → `7bfad50c` (tag `home-interior-architecture-wip-snapshot-7bfad50c`) |
| **Status** | **Awaiting owner decision.** 8 interiors, each rendered at desktop + mobile on the same populated day. |
| **Product changed** | **None.** Every interior is a self-contained render; app source is byte-untouched. |

---

## 1. The brief, and how it differs from everything before it

`ARRIVAL1` built a room. `BRAND1`/`BRAND2` signed its wall. `HOME_FINAL_CONCEPTS` gave that one room
five *feelings*. Every one of them kept the **same furniture in the same places** and changed only the
light and the words.

This review does the opposite. The mission promotes the structure to **approved and locked** —

> **LOCKED:** the orchard · the concept of the house · the archway · the philosophy of modern living in
> a traditional English orchard.

— and throws **everything else open**: the arrival, the navigation, the furniture, the cabinetry, the
shelving, the wall and floor treatments, the materials, the lighting, the typography, the composition,
the greeting, the Companion's *place in the house*, and every control. I am no longer a UX designer
refining a screen. I am the **interior architect** of a finished countryside home, and my job is to
design everything the family meets when they walk in.

So these eight are not variations. **Each is a different home.** They should feel as different as walking
from a luxury country kitchen into a Scandinavian retreat into an architect's own house. The test the
mission set is emotional, not functional: *the household should instinctively smile when they arrive.*

**What every interior still contains** (the house's real life, never fabricated): the household's name
in THA's own hand · the day's three true facts (today's meals · shopping · the week's orchard variety,
28/30) · the Companion's one line, verbatim · one clear primary action · the four rooms of the house ·
the real orchard beyond the arch.

**Method.** Each home is built as a complete interior — real `/orchard.webp`, the `ARRIVAL1` material
palette (plaster, oak, stone, ivory, leaf-green hue 74), THA's own type (Inter / DM Sans / Caveat) —
and rendered at **desktop 1440** and **mobile 430**, `deviceScaleFactor 2`, on the *same populated day*
so the eight are directly comparable. The harness is `scripts/capture-home-interior-architecture.ts`;
the renders are in `docs/ui-audit/home-interior-architecture/`. Nothing edits the product.

**How the controls are made architectural** (the spine that runs through all eight). Buttons became
*objects*: navigation is **engraved into oak** (colour recedes into the grain, a lit lower lip catches
the one morning), **embossed into plaster** (dark rim up, lit rim down — a subtraction from the wall,
the BRAND2 physics), or set as **brass plates and knobs** (the one material that returns light). No home
uses a rectangle-with-a-label where a carved, pressed or cast object could carry the same meaning.

---

## 2. The eight homes

For each: **desktop render · mobile render · design philosophy · what changed · why it is better ·
emotional response · strengths · weaknesses.**

---

### 1 — The Long Table
*The luxury country kitchen. One long oak table, and the whole family sits down at it.*

![desktop](../ui-audit/home-interior-architecture/1-long-table-desktop.png)
![mobile](../ui-audit/home-interior-architecture/1-long-table-mobile.png)

**Design philosophy.** The heart of an English country home is not a screen — it is the **kitchen
table**. This home makes the table the interface. A broad oak refectory table stands under a wide
orchard window; the day is laid out on the wood as things you'd actually find there — a folded meal
note, a written list, a bowl of the week's variety — and the **navigation is carved into the table's
own front edge**, PLANNER · COOKBOOK · PANTRY · SHOPPING routed into the oak like a cabinetmaker's
marks. The Companion is a note in THA's hand, left near the head of the table.

**What changed.** The dashboard's "cards on a console" became **objects on a table**. The four doors
stopped being a nav row and became the **carved edge of a single piece of furniture**. The greeting sits
where a person stands to be greeted — at the head of the table, not at the top of a page.

**Why it is better.** It is the truest translation of THA's own thesis — *"a warm, lived-in home where
someone has already thought about dinner"* — into a *room* rather than a layout. Navigation is furniture;
furniture is built into the house; nothing reads as software.

**Emotional response.** *Sit down, you're home.* The unhurried warmth of a big kitchen table with the
day's things already on it.

**Strengths.** The warmest of the "furniture-as-interface" homes; the closest to `ARRIVAL1`'s spirit, so
the lowest-risk to build; the carved edge is a genuinely novel, ownable navigation. Reads instantly on
mobile as *the same table, end-on*.

**Weaknesses.** The orchard is a *wide window above* the table rather than the whole upper architecture —
it honours the orchard but does not let it dominate. The Companion is still a card (a propped note),
which the brief specifically challenges. One large horizontal oak plane risks reading as a band if the
grain and light are not impeccable.

---

### 2 — The Dresser Wall
*The Welsh dresser. One magnificent built-in piece is the entire home.*

![desktop](../ui-audit/home-interior-architecture/2-dresser-wall-desktop.png)
![mobile](../ui-audit/home-interior-architecture/2-dresser-wall-mobile.png)

**Design philosophy.** In an old farmhouse the dresser holds everything and *is* the room. This home is
one floor-to-ceiling built-in oak dresser: the orchard is a window set into its top, the day rests on
its open shelves as plates on a rack, and the **navigation is four engraved drawers** with **brass
label-holders** and pulls — real cabinetry, opened by hand. The Companion is a card propped on the shelf.

**What changed.** The whole interface became **one piece of joinery**. Rooms became **drawers**;
controls became **brass hardware**; the identity became the craft of the cabinet itself.

**Why it is better.** It is the most literal answer to *"navigation carved into oak furniture · furniture
built into the house."* Everything is one made object — deeply premium-through-craft, and endlessly
ownable (every room of the product could be a different piece of the same fitted house).

**Emotional response.** *This was built for you, and it holds your whole life.* The solidity and
pride of a beautiful fitted kitchen.

**Strengths.** The strongest single-object identity; the drawers-as-nav is memorable and tactile; brass
introduces THA's one precious material (BRAND1 Concept 5) honestly. Holds together on mobile as a
narrower cabinet.

**Weaknesses.** The most oak of all eight — a wall of wood can feel heavy and dim, the opposite of the
airy modern home the philosophy also asks for. It leans traditional over *modern* living. The orchard is
a smaller inset, so the view is subordinate to the woodwork.

---

### 3 — The Light Room
*The Scandinavian retreat. Pale, weightless, almost empty — and completely calm.*

![desktop](../ui-audit/home-interior-architecture/3-light-room-desktop.png)
![mobile](../ui-audit/home-interior-architecture/3-light-room-mobile.png)

**Design philosophy.** Strip the room to light and air. A tall arch, vast plaster, and the day resting on
a single **thin picture-rail ledge** — three small things, nothing boxed. The **navigation is embossed
straight into the plaster** as a quiet column, pressed not printed. The name is re-set from the
handwritten flourish into a light, calm weight; the Companion is a whisper of text low on the wall. This
is *premium through restraint* taken to its Nordic end.

**What changed.** Cards, panels and furniture are **gone**. Information floats on a ledge; navigation
becomes a *relief in the wall*; emptiness becomes the primary material.

**Why it is better.** It ages the best of all eight and is the purest expression of "the household's own
life is the only ornament." The embossed plaster nav is the most architecturally honest control in the
review — a mark *in* the wall, not *on* it.

**Emotional response.** *A long, slow exhale.* The composure of a beautifully proportioned, near-empty
room with morning in it.

**Strengths.** The most timeless and the highest design ceiling; impossible to date; the calmest.

**Weaknesses.** 🔴 **Coolness is the mission's named enemy** (Emotional Palette § 3A — *"calm must never
become lifeless"*). This home earns admiration more than affection, and is the least likely to raise a
*smile*. The embossed plaster nav is beautiful but flirts with the **visibility floor** BRAND2 found —
too quiet on an ordinary phone in daylight. The great empty right-hand plane can read as *unfinished*
rather than *serene* to anyone not already design-literate.

---

### 4 — The Garden Room
*The contemporary orchard house. The orchard is not behind the room — the orchard is the room.*

![desktop](../ui-audit/home-interior-architecture/4-garden-room-desktop.png)
![mobile](../ui-audit/home-interior-architecture/4-garden-room-mobile.png)

**Design philosophy.** Make the orchard the **entire upper architecture**. The top of the home is a
full-width run of three tall arched lights — an orangery wall of glass — with the trees pouring in across
all of it. Beneath the glass, a single honed-stone plinth *floats* as the working surface, holding the
day. The **navigation is the slim oak mullions** between the lights: the structure that holds the glass
up is also how you move through the house.

**What changed.** The arch multiplied into a **glazed wall**; the orchard stopped being a view and became
the ceiling and the light. Furniture reduced to one floating stone plinth; navigation dissolved into the
*building's own frame*.

**Why it is better.** It is the boldest, most modern, most unmistakably-THA architecture — no competitor
has *this* wall of orchard. It answers the brief's headline directly: *"the orchard becoming the entire
upper architectural feature rather than a background image."*

**Emotional response.** *Openness, light, a lifted chest.* Standing in a garden room on a bright morning
with the world coming in.

**Strengths.** The most architecturally ambitious and the most alive; the strongest antidote to
"cold/clinical"; the mullion-navigation is a genuinely new idea. Scales gracefully to two lights on
mobile.

**Weaknesses.** The honed-stone plinth is the coolest surface in the review and needs warmth held
carefully or it tips clinical. The Companion is a **detached bar** below the plinth — still a card, not
architecture. The most horizontal composition, so it carries more empty ground than the others and the
day's facts get less room to breathe.

---

### 5 — The Architect's House
*The architect's own home. Confident, spare, a little austere — and quietly awe-inspiring.*

![desktop](../ui-audit/home-interior-architecture/5-architects-house-desktop.png)
![mobile](../ui-audit/home-interior-architecture/5-architects-house-mobile.png)

**Design philosophy.** A double-height volume with one dramatic shaft of light from a tall, narrow arch,
and a single **monolithic oak-and-stone island** standing in the centre like a piece of built architecture.
The name is a light editorial serif; the **navigation is engraved into the stone lintel** across the top
of the island; the day is set into the island's stone in three engraved columns; the Companion lives in a
**niche cut into the wall**. No warmth it hasn't earned.

**What changed.** Furniture became a **monolith**; navigation became an **inscription in stone**; the
greeting became gallery-grade type; the Companion became a **recess in the architecture** rather than a
card — the first home to place it *in* the wall.

**Why it is better.** It reads as *designed by someone with serious taste*, and it treats the household as
someone with taste too. The engraved-stone lintel and the wall-niche Companion are the most literally
*architectural* controls in the review.

**Emotional response.** *Quiet awe, and being trusted.* The composure of standing in a building that
knows exactly what it is.

**Strengths.** The highest architectural authority; the wall-niche is the best answer to *"Companion as
part of the architecture"*; the most premium-restrained after the Light Room.

**Weaknesses.** 🔴 The second-coolest home; austerity can read as *stern* rather than *welcoming*, and a
household home should not feel like a museum you must behave in. The single shaft of light is beautiful
but demanding to execute honestly within the one-morning law. Least cosy; a bet on admiration over
affection.

---

### 6 — The Hearth
*The home with a lit fire at its heart. Come in out of the cold.*

![desktop](../ui-audit/home-interior-architecture/6-hearth-desktop.png)
![mobile](../ui-audit/home-interior-architecture/6-hearth-mobile.png)

**Design philosophy.** Every old home is organised around a **warm centre**. Here the arch becomes a
glowing hearth — a dawn orchard beyond it, a soft warmth spilling onto the wall — and everything gathers
around it. A heavy oak **mantel beam** runs beneath the arch and *carries the navigation*, carved into the
beam. The day rests on the mantel; a **handwritten note is propped against the arch** — the one good thing
about today, left where you'll see it first. The warmest home of the eight.

**What changed.** The arch gained *heat*; navigation became a **carved mantel beam**; the arrival gained a
**note that greets you** before any data does — the explicit "smile" beat.

**Why it is better.** It wins the mission's actual test — *the household should smile when they arrive* —
more directly than any other home. It is unmistakably a *home with people in it*, not a showroom.

**Emotional response.** *The relief of coming in from the cold to a lit fire and a note on the mantel.*
Cosy, generous, expected.

**Strengths.** Best-in-class on the smile; the mantel-beam navigation is warm and architectural; the
propped note is the most disarming arrival moment. Reads beautifully on mobile.

**Weaknesses.** Warmth has a ceiling before it tips **sentimental**, and the terracotta button + glowing
hearth spend more of the warmth budget than THA's restraint usually allows. The dawn glow must stay *one
morning intensified*, never a second light source (Blueprint § 16). Slightly less timeless than the calm
homes.

---

### 7 — The Entrance Hall
*Arrival as ceremony. You come through your own front door.*

![desktop](../ui-audit/home-interior-architecture/7-entrance-hall-desktop.png)
![mobile](../ui-audit/home-interior-architecture/7-entrance-hall-mobile.png)

**Design philosophy.** The one home that designs the **act of arriving** itself. You step into a hall; a
runner draws your eye down the perspective to the **arch at the far end**, the orchard pulling you in. A
slim **hall console** holds the day where post and keys land, and the **navigation is a row of real
panelled doors** off the hall, each with a brass knob — the rooms of the house, visibly *doors*. The
Companion is a note by the door.

**What changed.** The composition gained **depth and perspective** — the first home you move *through*
rather than look *at*. Navigation became **doors you open**; the arch became a destination, not a picture.

**Why it is better.** It is the purest expression of the Experience Language's *"THA is a place · walking,
not scrolling · arrival before work."* Doors-as-navigation is the most intuitive architectural control of
all — everyone already knows how a door works.

**Emotional response.** *The specific small joy of walking into your own front door* and seeing the light
at the end of the hall.

**Strengths.** The strongest sense of *place* and arrival; doors-as-nav needs no explanation; the
perspective is genuinely cinematic.

**Weaknesses.** The perspective floor is the hardest to keep honest across breakpoints and can read as a
*trick* if overdone. The console squeezes the day's facts into a thin ledge — the least room for
information of the eight. Four panelled doors risk looking like a *menu of buttons* if the joinery isn't
convincingly deep.

---

### 8 — The Morning Room · *Claude's own idea*
*The home reduced to its most human moment: a sunny windowsill you actually want to sit at.*

![desktop](../ui-audit/home-interior-architecture/8-morning-room-desktop.png)
![mobile](../ui-audit/home-interior-architecture/8-morning-room-mobile.png)

**Design philosophy.** Forget the whole house for a moment and ask: *where in a home would you most want
to arrive on a good morning?* The answer is a **deep windowsill in the sun**. This home is exactly that —
one great arched window onto the orchard (the arch *is* the window, with slender glazing bars, modern-
traditional), and beneath it a **deep oak windowsill seat** that the day is laid on like things you'd set
down with your coffee. The **arch grows straight out of the sill** — the orchard is the entire upper
architecture, the furniture is built into the wall beneath it. **Navigation is a slim engraved brass
plate-rail** beneath the sill: an architectural object, not a button bar. And the **Companion is the light
itself** — the warm morning pooling on the sill — carrying **one true line in THA's own hand** resting on
the wood, not a card. *"Good morning, Chloe."*

**What changed.** Everything converged onto one intimate, luminous place. The orchard became the great
window (the upper architecture); the arch became *grown from the furniture*; the four rooms became an
**engraved brass rail** (the one truly architectural, truly legible control); and the Companion stopped
being a card and became **the light and one warm sentence** — the first home where the Companion is
genuinely *part of the architecture* rather than another panel.

**Why it is better.** It is the only home that satisfies **every** specific exploration the brief named at
once — orchard as the whole upper feature · the arch growing from what it stands on · furniture built into
the house · navigation as an engraved architectural object · the Companion as architecture, not a card —
**and** wins the emotional test outright. A windowsill in the sun is a place a person *wants to be*; the
smile is not manufactured by a glowing effect, it's the involuntary lift of a good morning at a warm
window. It is also the most **buildable and honest**: one window, one sill, one rail, and one data-borne
sentence.

**Emotional response.** *The quiet happiness of a sunny windowsill with your coffee and the whole day
still ahead.* Intimate, warm, luminous — and unmistakably a place, not a page.

**Strengths.** Best fulfils the *complete* brief; the most emotionally resonant while staying calm and
premium; the Companion-as-light is the review's most original idea; the sill "grows" the arch so the
locked structure feels inevitable, not applied. Translates almost perfectly to mobile — the same room,
held in one hand.

**Weaknesses.** 🔴 Everything rests on the one line being **real** (see § 4) — templated or fabricated, it
becomes brochure voice and breaks Core Principle 6. The brass rail is the one place metal enters the
palette and must stay a single quiet material, never blingy. Slightly less information-dense than the
Long Table or the Architect's House — it chooses intimacy over completeness, and that is a genuine
trade-off, not a free win.

---

## 3. The eight homes at a glance

| # | Home | The one idea | Navigation | Companion's place | Orchard's role | Temperature | Smile | Timeless |
|---|---|---|---|---|---|---|---|---|
| 1 | The Long Table | sit down, you're home | carved table edge | note on the table | wide window above | warm | ★★★★☆ | ★★★★☆ |
| 2 | The Dresser Wall | one built piece holds it all | engraved drawers + brass | card on the shelf | window in the cabinet | warm, woody | ★★★☆☆ | ★★★★☆ |
| 3 | The Light Room | premium through emptiness | embossed plaster | whisper on the wall | tall calm window | 🔴 cool | ★★☆☆☆ | ★★★★★ |
| 4 | The Garden Room | the orchard is the room | oak mullions | detached bar | **the whole glazed wall** | cool-fresh | ★★★★☆ | ★★★★☆ |
| 5 | The Architect's House | designed with real taste | engraved stone lintel | **niche in the wall** | one dramatic light | 🔴 cool | ★★★☆☆ | ★★★★★ |
| 6 | The Hearth | come in from the cold | carved mantel beam | note on the mantel | glowing dawn hearth | warmest | ★★★★★ | ★★★☆☆ |
| 7 | The Entrance Hall | walk into your own door | panelled doors + brass | note by the door | view down the hall | warm | ★★★★☆ | ★★★★☆ |
| 8 | **The Morning Room** | a sunny sill to sit at | **engraved brass plate-rail** | **the light + one line** | **the great window** | warm-luminous | ★★★★★ | ★★★★☆ |

They do not converge. One sits you at the table, one builds you a dresser, one empties the room to light,
one makes the orchard the whole wall, one carves you a monolith, one lights you a fire, one walks you
through the door, and one sits you on a sunny sill. **Same locked house — eight different homes.**

---

## 4. Recommendation — **8, The Morning Room.**

**Make The Morning Room the permanent interior of The Healthy Apples Home.**

I do not recommend it because it is safest — it is not; **1, The Long Table** is the safest, closest to
what is already built and the surest to ship without risk. I recommend The Morning Room because the brief
asked for the *most memorable, emotionally engaging and architecturally beautiful* Home THA could become,
and it is the only interior that wins on all three at once:

1. **It answers every architectural instruction the brief named — together, not one at a time.** The
   orchard becomes the *entire upper architecture* (the great arched window, as in The Garden Room). The
   arch *grows naturally from the orchard* and from the sill it stands on. The furniture is *built into
   the house* (the windowsill seat is part of the wall). The navigation is a genuine *architectural
   object* — an engraved brass plate-rail — not a button bar. And the Companion is finally *part of the
   architecture*: it is the morning light on the sill and one true sentence resting on the wood, not
   another card. No other home does all five; The Morning Room does them as one idea.

2. **It wins the emotional test honestly.** The mission's one measure is *the household should smile when
   they arrive.* The Hearth (6) chases that smile with warmth and a glowing effect; The Morning Room
   *earns* it with a place — a sunny windowsill is somewhere a person genuinely wants to be, and the lift
   is involuntary and renewable every morning. It is warm without tipping sentimental (6's risk) and calm
   without tipping cold (3's and 5's risk). It holds both, which is the whole difficulty the Emotional
   Palette names.

3. **It is the most human, and the most *THA*.** THA's vision is *"a modern home in an ancient orchard,
   where technology quietly supports timeless family life."* A modern-traditional arched window, a deep
   oak sill, the orchard pouring in, one warm line in a hand you know — this is that sentence made into a
   room. It could belong to no other product.

4. **It is buildable and honest.** It is one window, one sill, one engraved rail, three ivory objects and
   one sentence — less new machinery than most of the others. Its single risk is also its single power:
   the one line **must be data-borne** (a real, chosen fact the platform already knows — a planned meal, a
   cleared list, the seasonal note the Companion surfaced), produced by the **Behaviour Engine's** voice
   and rendered **verbatim**, and it must **say less on a quiet day** (Core Principle 6; Blueprint § 12.1;
   the exact discipline `HOME_FINAL_CONCEPTS` § 6 already recorded for concept E). Built that way, *"the
   morning room was ready for you"* is a fact the house can honestly claim.

**Runner-up: 1, The Long Table** — if the owner wants the warmest, most obviously-a-kitchen home with the
least build risk, it is the correct fallback and the natural evolution of `ARRIVAL1`. **Bold alternative:
4, The Garden Room** — the right answer *only if* the platform decides Home should be cooler, more
contemporary and more architecturally dramatic than the Emotional Palette currently allows; it is the
most ambitious building of the eight, and the boldest bet.

**Held for later, deliberately:** the wall-niche Companion (from 5) is the single best idea in the review
for *where the Companion lives*, and it should be **prototyped and grafted onto The Morning Room** — a
Companion that is light *and* a recess in the architecture is stronger than either alone.

---

## 5. What this keeps, and what it never does

**Locked structure — kept in every home.** The orchard is the real `ORCHARD.png`, always beyond the arch;
the house and its rooms are unchanged; the archway is the focal point of every interior; and every home is
*modern living in a traditional English orchard* — contemporary bones, timeless orchard. No home walks
*into* the orchard, adds a second sun, animates the arch, or hangs type on the view (Blueprint § 6.1 /
§ 16 — the Garden Room's greeting was moved off the glass onto the plinth for exactly this reason).

**Never fabricated.** Every fact in every render is the household's real day; the Companion line is the
Behaviour Engine's, verbatim; absences would render as calm empty states, never invented good news. A
home that invents a good morning is worse than one that stays quiet.

---

## 6. Verification

| Check | Result |
|---|---|
| Locked structure preserved (orchard · house · arch · philosophy) | ✅ In all 8 homes. |
| Interiors produced | **8**, each a genuinely different home (not a re-skin of one layout). |
| Per home: desktop + mobile render | ✅ 16 renders, `deviceScaleFactor 2`, same populated day. |
| Per home: philosophy · what changed · why better · emotional response · strengths · weaknesses | ✅ All present (§ 2). |
| Specific explorations covered | ✅ carved-oak nav (1,2,6) · embossed plaster (3) · engraved controls (2,5,6,8) · nav as architecture (all) · orchard as upper architecture (4,8) · arch grown from orchard (4,6,8) · built-in furniture (1,2,8) · Companion as architecture (5,8) · arrival that smiles (6,8). |
| One recommendation, argued on merit not safety | **8 — The Morning Room** (§ 4), with 1 and 4 named as the fallbacks. |
| Product / schema / migration / tests | **None** — interior-architecture review, exploration only. |

**Artifacts**
```
scripts/capture-home-interior-architecture.ts     the render harness (8 homes × desktop + mobile)
docs/ui-audit/home-interior-architecture/          1-long-table … 8-morning-room, each -desktop.png / -mobile.png
```

---

*HOME_INTERIOR_ARCHITECTURE — eight homes for one locked house. A table to sit at, a dresser that holds
everything, a room made of light, a wall of orchard, an architect's monolith, a lit hearth, a hall to
walk through, and a sunny windowsill to arrive at. The recommendation is the one that makes you smile not
because it glows, but because it is somewhere you'd genuinely want to be on a good morning — and can prove
the good morning is true.*
