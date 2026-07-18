# HOME — Arrival, Reimagined

**Eight radically different ways of arriving home, with the orchard — not the arch — as the emotional anchor.**
The arch is set down. The defining feature of Arrival is no longer an architectural motif; it is *the journey
home*, and the orchard is the real landscape the family comes back to, always seen from the same place.

| | |
|---|---|
| **Session** | `HOME_ARRIVAL_REIMAGINED` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/HOME-ARRIVAL-REIMAGINED-20260717` → `7bfad50c` (tag `home-arrival-reimagined-wip-snapshot-7bfad50c`) |
| **Status** | **Awaiting owner decision.** 8 arrivals, each rendered at desktop + mobile on the same real day. |
| **Product changed** | **None.** Every arrival is a self-contained composition; app source is byte-untouched. |

---

## 1. The instruction, and what it asks me to forget

Every previous Home session — `ARRIVAL1`, `HOME_FINAL_CONCEPTS`, `HOME_INTERIOR_ARCHITECTURE` — built
outward from **the arch**. The arch was the focal point; the orchard was the thing seen *behind* it. This
mission stops that. It is not a request to reframe the arch more beautifully. It is a request to **forget it**
and begin from a different question:

> **What would it actually feel like to arrive home?**

The interface is not the starting point. The *feeling* is. And the mission fixes one fact that changes
everything about how the orchard must be used:

> Arrival is the **one** place in the product where the landscape is always viewed from the **same location**.
> This is the view the family sees **every time they come home**. Every other room in THA may look onto a
> different part of the property. Arrival must not — so the orchard here must create **emotional familiarity**.

So the orchard is not decoration and not a background image. It is *the constant* — the one unchanging view a
household returns to while their own life changes around it. That is the emotional job of Arrival, and it is
the job every concept below is measured against.

**Challenged (everything):** the banner, the hero image, where navigation lives, standard application layout,
the dashboard, and the arch itself. **Never challenged (the four fixed truths):**

1. modern living in a traditional English orchard
2. hospitality before productivity
3. technology becoming quieter as it becomes better
4. **Arrival is coming home.**

---

## 2. Method — the real orchard, eight real buildings

Each arrival is a **from-scratch architectural composition**, not a re-skin of the existing room. Each embeds
the owner's real orchard asset (`client/public/orchard.webp` — the v2 North Star orchard, apple trees, blossom,
the mown path, the oak gate), the `ARRIVAL1` material palette (plaster, oak, stone, ivory, leaf-green hue 74)
and THA's own type (Inter · Cormorant-grade serif · Caveat for the hand). Each is rendered headless at
**desktop 1440** and **mobile 430**, `deviceScaleFactor 2`, on the **same real day** so the eight are directly
comparable:

> Chloe · *three meals planned today* · *nothing left to fetch* · *28 of 30 orchard varieties this week* · one
> Companion line (*"Spring greens are at their best — shall we plan something for the weekend?"*) · one primary
> action · four rooms (Planner · Cookbook · Pantry · Shopping).

Nothing here edits the product. The harness is `scripts/capture-home-arrival-reimagined.ts`; the renders are in
`docs/ui-audit/home-arrival-reimagined/`. Every fact shown is the household's real day — never fabricated; the
one-morning light law (Blueprint § 6) is kept in every composition (one soft morning, never a second sun).

**The one line each design honours differently.** Two arrivals (The Clearing) lean on a single *good-news*
sentence rather than a Companion card; where they do, that sentence is bound by the same discipline
`HOME_FINAL_CONCEPTS` § 6 recorded — **data-borne or dead**, the Behaviour Engine's voice rendered verbatim,
saying *less* on a quiet day (Core Principle 6). No arrival invents good news.

---

## 3. The eight arrivals

For each: **desktop render · mobile render · design philosophy · the arrival journey · why the composition
works · the relationship between orchard and interior · strengths · weaknesses.**

---

### 1 — The Threshold
*A contemporary orchard house. You come home to the whole orchard, with nothing in the way.*

![desktop](../ui-audit/home-arrival-reimagined/1-threshold-desktop.png)
![mobile](../ui-audit/home-arrival-reimagined/1-threshold-mobile.png)

**Design philosophy.** A modern house opens its whole face to the orchard. There is no arch, no frame, no
window — the orchard *is* the wall you stand before, edge to edge, filling the upper two-thirds of the view. A
single hairline of warm brass marks where the glazing meets the floor. Beneath it, a calm plaster sill holds
the day: the household's name in THA's own hand, one Companion line, the three facts, one action, four rooms.
The orchard leads; the interface is the quiet ledge you set your keys on.

**The arrival journey.** You open the door and the *whole landscape* is simply there — before your name, before
a single task. A beat of view, then your eye falls to the warm sill and finds, without hunting, the one thing
worth doing today. Nothing announces itself; the room has already arranged the day and stepped back.

**Why the composition works.** It answers the mission's core instruction more literally than any other: the
family sees the *same full orchard from the same place every morning*, so familiarity is built by construction.
It is unmistakably a *view*, not a banner — because it has no frame to become one. Hospitality before
productivity is the literal reading order: world, then welcome, then work.

**Orchard ↔ interior.** They meet at a single honest seam — the brass sightline. Above it is entirely orchard;
below it is entirely home. The interior does not compete with the view for even one pixel; it receives it.

**Strengths.** The purest expression of *"the view you come home to."* The most orchard of all eight, and the
most emotionally direct. Frameless — so it can never read as a hero-image-with-a-dashboard-under-it. Buildable
and honest; scales to mobile as the same sill under the same view.

**Weaknesses.** Its restraint is its risk: with the whole top given to the view, the day's facts get one calm
band and no more — a household wanting a denser morning briefing will find it deliberately quiet. The seam
between view and sill must be impeccably level or the whole composition tilts.

---

### 2 — The Courtyard
*An architect's private residence. The orchard is a green heart the house is built around.*

![desktop](../ui-audit/home-arrival-reimagined/2-courtyard-desktop.png)
![mobile](../ui-audit/home-arrival-reimagined/2-courtyard-mobile.png)

**Design philosophy.** A modernist house holds the orchard as an internal courtyard — a contained green void the
architecture wraps on every side. The orchard sits in a precise rectangle at the centre; the interface is the
*cloister* around it: the name at the top-left, the wordmark answering at the top-right, the day's facts down a
quiet left margin, the Companion line and controls along the lower ambulatory. Gridded, spare, deliberate.

**The arrival journey.** You step into a still, ordered space and the eye is pulled to the light at its centre —
the courtyard. You read the day *around* the view the way you'd walk a cloister around a garden: name, then the
three facts down the side, then the one action. Calm, exact, unhurried.

**Why the composition works.** It is the one arrival that reads as *designed by an architect* — the taste is in
the proportion and the restraint, not in any ornament. Containing the orchard makes it feel **private and
owned**: this is *your* courtyard, not a landscape anyone can see.

**Orchard ↔ interior.** Inverted from The Threshold: here the interior *surrounds* the orchard rather than
receiving it. The building is the constant frame; the orchard is the jewel it protects.

**Strengths.** The highest design authority; the most obviously premium-through-restraint. Endlessly ownable —
every room of the product could wrap its own courtyard. The clearest information hierarchy of the eight.

**Weaknesses.** 🔴 Coolness is the mission's named enemy (Emotional Palette § 3A). Contained and gridded, it
risks reading *composed* rather than *warm* — it earns admiration more easily than a smile. The framed rectangle
is the closest of the eight to the "framed print" the Blueprint warns against; it works only because the frame
is architecture (a wall opening), not a mounted picture.

---

### 3 — The Restored Farmhouse
*A beautifully restored farmhouse. Thick walls, deep-set windows, the orchard through old glass.*

![desktop](../ui-audit/home-arrival-reimagined/3-farmhouse-desktop.png)
![mobile](../ui-audit/home-arrival-reimagined/3-farmhouse-mobile.png)

**Design philosophy.** The warmest, most characterful reading. A lime-plaster wall with **three deep-set
arched windows** across it, the orchard seen through all three — the same landscape, three views, the way an old
farmhouse gives you the garden through whatever window you pass. A worn oak sill runs beneath the middle window
and carries the day; the greeting sits below in THA's hand, the rooms on a rail beneath it.

**The arrival journey.** You come into a room with real age in its walls, and the morning is already coming
through the windows. It feels *lived in before you arrived* — not a showroom, a home someone has kept. You settle
to the middle window, where the day's things rest on the sill.

**Why the composition works.** Multiple windows is the most literal fulfilment of the mission's own list of
permitted solutions (*"multiple windows · glazing"*), and it is the reading that most says **traditional
English orchard** — the "modern living" is in the calm typography and the honest data, the "traditional" is in
the thick walls and old glass. Familiarity comes from the walls as much as the view.

**Orchard ↔ interior.** The most *architectural* relationship: the orchard is genuinely *behind a wall*, admitted
through three considered openings. The interior has real mass and depth; the view is earned by looking through it.

**Strengths.** The warmest and most human without a single glowing effect; the lowest-risk emotionally. Deeply
characterful and unmistakably English-countryside. Reads instantly as a *home*, which is THA's whole thesis.

**Weaknesses.** The three windows show near-identical crops of one image; without genuine parallax between them
it can read as one view repeated rather than three. The most *traditional* of the eight — it must hold its
modern discipline in the type and spacing or it drifts toward pastiche. The orchard is subordinate to the wall,
so it is the least orchard-dominant reading after The Long Light.

---

### 4 — The Long Light
*A Scandinavian woodland home. Pale, weightless, a long ribbon of orchard and a great deal of calm.*

![desktop](../ui-audit/home-arrival-reimagined/4-long-light-desktop.png)
![mobile](../ui-audit/home-arrival-reimagined/4-long-light-mobile.png)

**Design philosophy.** Strip arrival to light and air. A single **horizontal letterbox of orchard** runs across
the upper third — a Nordic clerestory — and beneath it a vast, pale, almost-empty plane holds the day in a light
Inter weight, generous white space, a hairline dividing the calm from the controls. This is *premium through
restraint* taken to its Scandinavian end: the greeting is set, not written, and nothing is boxed.

**The arrival journey.** A long, slow exhale. The ribbon of orchard gives you the morning in one calm glance;
the emptiness below gives you room to think before you act. There is nothing to parse — just your name, one line,
three quiet facts, and one door worth opening.

**Why the composition works.** It ages better than any other arrival: there is nothing to date and nothing to
tire of. It is the truest to *"the household's own life is the only ornament"* — the room supplies only light and
space, and the family's real day is the only content in it.

**Orchard ↔ interior.** The orchard is a **band of light** the pale interior is organised beneath, not a view you
stand before. The interior dominates by area; the orchard dominates by being the only colour in the room.

**Strengths.** The most timeless and the calmest; the highest design ceiling for longevity. The clearest, most
effortless information layout. Beautiful, quiet, and impossible to make look cheap.

**Weaknesses.** 🔴 The closest to the *cold / clinical / emotionally distant* temperatures the Emotional Palette
forbids. With so little orchard and so much pale space, it is the least likely to raise a smile and the most
dependent on flawless typography to feel *warm* rather than *empty*. It gives the orchard the smallest share of
the eight — a real cost when the orchard is the anchor.

---

### 5 — The Glasshouse
*A luxury countryside retreat. An orangery of glass — the orchard is the wall and the light pours in.*

![desktop](../ui-audit/home-arrival-reimagined/5-glasshouse-desktop.png)
![mobile](../ui-audit/home-arrival-reimagined/5-glasshouse-mobile.png)

**Design philosophy.** The orchard becomes a full glazed wall — a conservatory of tall slim mullions with the
trees pouring through every light, a soft skylight glow washing down from above and morning falling across the
room in slow diagonal beams. Beneath the glass, a warm floating plinth holds the day. This is arrival as a
*bright garden room* — the most generous, most luxurious light of the eight.

**The arrival journey.** You walk into a room made of morning. The orchard is everywhere the glass is, and the
light comes down onto the plinth where the day is laid out for you. It feels indulgent and calm at once — the
retreat you'd pay to wake up in.

**Why the composition works.** It reads unmistakably as **luxury countryside** without a single expensive
material — the luxury is the *quantity of light and orchard*. The mullions give the glass real structure so the
view feels like architecture, not a photo, and the plinth keeps the day honest and grounded beneath it.

**Orchard ↔ interior.** The most immersive relationship short of stepping outside: the orchard is the entire far
wall *and* the source of the light in the room. The interior is a single calm object standing in that light.

**Strengths.** The most *alive* and optimistic; the strongest antidote to cold. The most architecturally
ambitious after The Courtyard, and the most obviously premium. Scales gracefully — fewer mullions on mobile,
same room.

**Weaknesses.** The floating plinth is the coolest surface in the composition and needs its warmth held
carefully or it tips clinical. The many mullions add visual busyness the calmer arrivals avoid, and the overhead
light must stay *one morning intensified*, never a theatrical second source (Blueprint § 16).

---

### 6 — The Reflection
*A luxury retreat at a still dawn. The orchard, and the orchard again in water that hasn't moved yet.*

![desktop](../ui-audit/home-arrival-reimagined/6-reflection-desktop.png)
![mobile](../ui-audit/home-arrival-reimagined/6-reflection-mobile.png)

**Design philosophy.** The orchard appears **twice** — real across the upper half, and mirrored in a still
reflecting pool below, the two meeting at a bright shoreline of morning light. The greeting straddles the seam;
the day rests low on the calm water. This is the most *poetic* arrival — the orchard doubled at the one moment of
the day when the water is perfectly still.

**The arrival journey.** You arrive at a held breath. The stillness does the welcoming — the world and its
reflection, and your name written across the line where they meet. It is beautiful before it is useful, and the
usefulness (the day, the one action) waits quietly on the water until you're ready.

**Why the composition works.** A reflection is *memory made visible* — it is the most literal image of a place
you return to and know. It is the single most unforgettable frame of the eight; nobody who arrives here forgets
it. And it is the most unownable by any competitor — no one else has *this* orchard, doubled in *this* water.

**Orchard ↔ interior.** The interior almost disappears — it becomes text floating on the surface of the view
itself. The orchard isn't behind the interface or beside it; the interface sits *on* the orchard's own mirror.

**Strengths.** The most emotionally memorable and the most distinctly THA. Genuinely poetic without a fabricated
effect — the reflection is the real orchard, honestly mirrored. A frame people would screenshot.

**Weaknesses.** Text legibility over a mirrored, rippling surface is the hardest of the eight to keep crisp
across states and breakpoints — it leans on scrims and shadows that must never muddy the water. It is the
arrival most at risk of feeling *arty* rather than *homely* if the balance tips. A reflection is a beautiful
idea that must survive a household seeing it 700 mornings a year.

---

### 7 — The Walk
*Arrival as a journey. You come up the mown path, through the trees, toward home.*

![desktop](../ui-audit/home-arrival-reimagined/7-walk-desktop.png)
![mobile](../ui-audit/home-arrival-reimagined/7-walk-mobile.png)

**Design philosophy.** The one arrival that is *the journey home itself*. The orchard fills the frame and you
stand at the head of the mown path, the rows receding to the oak gate — you are not looking at the orchard from
inside, you are *in* it, walking up to your own door. The day materialises softly in the near foreground, the
ground darkening just enough to hold the words, the light on the path drawing you in.

**The arrival journey.** Literally the walk home: the path opens ahead, the gate waits at the end, and your name
and the day rise gently out of the near grass as you arrive. It is the most *cinematic* opening — movement implied
by a still frame, the Experience Language's *"walking, not scrolling"* made into the first thing you see.

**Why the composition works.** It fulfils the mission's own headline — *"the defining feature is the journey
home"* — more directly than any other. The receding path is the strongest possible cue of *place and return*: a
household doesn't just see the orchard, they feel themselves arriving in it, every morning, from the same step.

**Orchard ↔ interior.** There is no interior — there is only *outside, arriving*. The interface is light and
handwriting resting on the landscape; the orchard isn't a view the home contains, it is the world the home sits in.

**Strengths.** The strongest sense of *place and arrival* of the eight; the most emotionally kinetic. Immersive
and unmistakable; the path is a genuinely ownable signature. Beautiful on mobile — the same walk, held in one hand.

**Weaknesses.** Words over a full-bleed landscape always cost contrast; the lower gradient that makes them
legible must stay a whisper or it becomes a heavy scrim and kills the openness. Being fully *outside*, it has the
least architectural anchoring — it must hold "modern living in a traditional orchard" through type and restraint
alone, with no wall, sill, or glass to carry the "modern."

---

### 8 — The Clearing · *Claude's own idea*
*Technology, finally quiet enough to disappear. You arrive in the orchard, and the house is only light and a few true words.*

![desktop](../ui-audit/home-arrival-reimagined/8-clearing-desktop.png)
![mobile](../ui-audit/home-arrival-reimagined/8-clearing-mobile.png)

**Design philosophy.** The most radical, and the most faithful to the third fixed truth — *technology becoming
quieter as it becomes better.* There is **no room, no window, no frame, no card, no panel, no button bar.** You
arrive standing *in* the orchard at first light, and the entire interface has dissolved into the landscape: the
household's name written in THA's hand across the morning sky, a single true line of good news resting in the
air, the day's three facts as the faintest dew low in the grass, and the four rooms as four mown paths leading
away between the trees. The product has become so quiet it has vanished into the land — and left only the
household, the morning, and one thing worth knowing.

**The arrival journey.** You don't open an app — you *step outside on a good morning.* Your name is in the sky,
one warm true sentence meets you at eye level, and the day is barely-there beneath your feet until you look for
it. To move through the house you simply choose a path. It is the calmest, most human, most un-app-like arrival
imaginable — the opposite of a dashboard in every possible way.

**Why the composition works.** It is the arrival people would *remember for years* — because it doesn't look like
software at all, it looks like a place and a feeling. It takes the mission's hardest instruction (technology
disappears) and actually does it, rather than gesturing at it. And it makes the orchard total: there is nothing
else, so the anchor is absolute.

**Orchard ↔ interior.** There is no distinction left to describe. The interior *is* the orchard; the interface
*is* light and handwriting on it. This is the end state of "the orchard is the real landscape" — the interface
stopped being a layer over the view and became weather in it.

**Strengths.** The most memorable and the most original; the single arrival that could belong to no other product
and no other category. The truest to *technology quietly disappearing.* The most emotionally disarming — a home
that greets you with the morning and one kind, true thing.

**Weaknesses.** 🔴 Its power and its risk are the same: with no panel, the day's facts float on a bright, busy
landscape and legibility is the hardest of all eight — the dew-text must never become unreadable, and on a phone
in daylight this is a genuine engineering constraint, not a nicety. 🔴 Everything rests on the one line being
**real** (data-borne, Behaviour-Engine-voiced, verbatim, *quieter on a quiet day*); templated or fabricated, it
becomes brochure voice and breaks Core Principle 6. It asks the most trust of the household: a first-time user
may briefly wonder *"where is everything?"* — answered the moment they choose a path, but a real first beat.

---

## 4. The eight at a glance

| # | Arrival | The one idea | Archetype | Orchard's role | Where the interface lives | Temperature | Memorability | Timelessness |
|---|---|---|---|---|---|---|---|---|
| 1 | **The Threshold** | the whole view, nothing in the way | contemporary orchard house | full frameless wall (upper ⅔) | a quiet plaster sill below | warm-calm | ★★★★☆ | ★★★★☆ |
| 2 | The Courtyard | a private green heart | architect's residence | a contained central void | a cloister wrapping it | 🔴 cool | ★★★☆☆ | ★★★★★ |
| 3 | The Restored Farmhouse | the orchard through old glass | restored farmhouse | three deep-set windows | an oak sill + wall below | warmest | ★★★☆☆ | ★★★★☆ |
| 4 | The Long Light | a ribbon of orchard, a room of air | Scandinavian woodland home | a horizontal clerestory band | a vast pale plane beneath | 🔴 cool | ★★☆☆☆ | ★★★★★ |
| 5 | The Glasshouse | a room made of morning | luxury countryside retreat | a full glazed wall + skylight | a floating plinth in the light | warm-fresh | ★★★★☆ | ★★★★☆ |
| 6 | The Reflection | the orchard, doubled at dawn | poetic luxury retreat | real + mirrored in still water | text floating on the water | warm-still | ★★★★★ | ★★★★☆ |
| 7 | The Walk | the journey home itself | cinematic arrival | the path you come up | light on the near landscape | warm | ★★★★☆ | ★★★★☆ |
| 8 | **The Clearing** | technology disappeared into the land | completely original | total — the whole world | dissolved into light + hand | warm-luminous | ★★★★★ | ★★★★☆ |

They do not converge. One opens the whole face of the house; one wraps a courtyard; one keeps the old windows;
one gives the orchard as a band of light; one builds a glasshouse of it; one doubles it in water; one walks you
up the path; and one lets the whole interface dissolve into the morning. **Same orchard, same day — eight
different ways of arriving home.**

---

## 5. Recommendation — **1, The Threshold.** (And where THA should be brave next.)

**Adopt The Threshold as the definitive Arrival of The Healthy Apples.**

I want to be explicit that this is **not** the safest choice. The safest arrival here is **3, The Restored
Farmhouse** — warm, conventional, familiar, the surest to be liked and the least likely to be remembered — or
**4, The Long Light**, which is beautiful and will never look dated. I am not recommending either. The mission
asked for the arrival people will remember *years later as unmistakably The Healthy Apples*, and The Threshold is
the one that earns that while remaining a home a family can live in for a decade of ordinary mornings:

1. **It is the mission's own instruction, built.** The brief's emotional core is *"the view the family sees
   every time they come home,"* *"always viewed from the same location,"* *"emotional familiarity."* The Threshold
   is that sentence made literal — the whole orchard, frameless, from the same step, every morning. Nothing is
   between the household and the landscape they come home to. No other concept commits to the view this completely
   while staying a place a person can actually *use* each day.

2. **It is genuinely bold, not merely nice.** It does the thing every prior session refused to do: it **sets down
   the arch entirely** and removes the front wall of the house toward the orchard. There is no motif, no frame, no
   hero-with-a-dashboard — just the view and a quiet sill. Against three years of designing *around* an arch, an
   arrival with no arch at all is the braver move, and the more confident one.

3. **It holds all four fixed truths at once, honestly.** *Modern living in a traditional orchard* — a
   contemporary frameless glazed face onto a timeless English orchard. *Hospitality before productivity* — the
   reading order is world → welcome → work, enforced by the layout itself. *Technology becoming quieter* — the
   interface is a single calm ledge that never competes with the view. *Arrival is coming home* — it is,
   unmistakably, the moment of walking in and seeing home. And it needs **no** fabricated content and **no**
   governing amendment: the facts are the household's real day, the light is one morning, the orchard is the
   owner's own asset.

4. **It is the most buildable of the memorable options.** The Reflection and The Clearing are more *arresting*,
   but both carry a real legibility-over-landscape burden and (for The Clearing) a hard dependency on the
   good-news line being perfect every day. The Threshold gets most of their emotional payload — *you come home to
   the orchard* — with a clean, honest seam between view and sill that is straightforward to build and to keep
   legible in every state.

**Where THA should be brave next — 8, The Clearing.** I am not recommending it as *today's* Home, but I am
recommending it be **prototyped and held as the north star.** It is the truest realisation of *"technology
becoming quieter as it becomes better"* the product has ever drawn, and it is the arrival people would genuinely
remember for years. The path from here to there is real: as the good-news line, the honest-day facts, and the
Companion's voice all mature, Arrival can shed more and more chrome until, one day, it can honestly be nothing
but the orchard, the morning, and one true thing. The Threshold is that journey's first, confident step; The
Clearing is its destination.

**Most memorable single frame: 6, The Reflection** — the one to reach for if the owner wants Arrival to be
*unforgettable* over *inhabitable*, and the strongest case for a signature moment used sparingly (a seasonal
first-light state, perhaps) rather than every day.

---

## 6. What this keeps, and what it never does

**Kept in every arrival.** The orchard is the owner's real `orchard.webp`, always the *same* view from the same
place (the mission's familiarity law); the light is one soft morning, never a second sun (Blueprint § 6 / § 16);
every fact is the household's real day; the four fixed truths are intact in all eight.

**Never done.** No arrival invents good news — absences would render as calm quiet, never a fabricated line
(Core Principle 6; `HOME_FINAL_CONCEPTS` § 6). None animates the view, adds a second light source, or hangs type
*on* the orchard as decoration rather than resting it *in* the composition. And none of this touches the product:
it is exploration only — no data source, hook, route, API, behaviour, schema, migration, or test changed.

---

## 7. Verification

| Check | Result |
|---|---|
| Bootstrap + required reading (`README`, `ARRIVAL1`, `HOME_FINAL_CONCEPTS`, `HOME_INTERIOR_ARCHITECTURE`) | ✅ Read before starting. |
| Git status confirmed · rollback protection created | ✅ `rollback/HOME-ARRIVAL-REIMAGINED-20260717` → `7bfad50c` (+ snapshot tag). |
| Arch set down · orchard as the emotional anchor | ✅ No arrival uses the arch as its focal point; the orchard anchors all eight. |
| Arrivals produced | **8**, each a genuinely different building (not a re-skin of one layout). |
| Per arrival: desktop + mobile render | ✅ 16 renders, `deviceScaleFactor 2`, same real day. |
| Per arrival: philosophy · arrival journey · why it works · orchard↔interior · strengths · weaknesses | ✅ All present (§ 3). |
| Archetypes covered | ✅ contemporary orchard house (1) · restored farmhouse (3) · Scandinavian woodland home (4) · luxury retreat (5, 6) · architect's residence (2) · original interpretation (7, 8). |
| Four fixed truths never challenged | ✅ Modern-in-traditional · hospitality-before-productivity · quiet technology · arrival-is-coming-home — in all eight. |
| One recommendation, argued on memorability not safety | **1 — The Threshold** (§ 5), with **8 — The Clearing** as the north star and **6 — The Reflection** as the most memorable frame. |
| Product / schema / migration / tests | **None** — exploration only. |

**Artifacts**
```
scripts/capture-home-arrival-reimagined.ts     the render harness (8 arrivals × desktop + mobile)
docs/ui-audit/home-arrival-reimagined/          1-threshold … 8-clearing, each -desktop.png / -mobile.png
```

---

*HOME_ARRIVAL_REIMAGINED — the arch set down, the orchard raised. Eight ways of coming home: through the whole
open face of the house, around a private courtyard, through old farmhouse glass, under a ribbon of Nordic light,
inside a glasshouse of morning, across still water that shows the orchard twice, up the mown path to your own
gate, and — one day — into the orchard itself, where the technology has grown quiet enough to disappear, and only
the morning and one true thing are left to meet you. The recommendation is the one built from the mission's own
sentence: you come home, and the whole orchard is simply there.*
