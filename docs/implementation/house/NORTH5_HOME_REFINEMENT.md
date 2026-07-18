# NORTH5 — Home Refinement

**One Home, three arrangements of the same room.**
Design exploration only. Nothing implemented. No CSS written. Product source byte-untouched.

| | |
|---|---|
| **Session** | `NORTH5_Home_Refinement` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/NORTH5-home-refinement-20260717` → `10573dd2` (tag `north5-wip-snapshot-10573dd2`) |
| **Status** | **Awaiting owner decision.** Three refinements of one chosen direction; recommendation in § 11. |
| **Product changed** | **None.** `home-experience-page.tsx` and `index.css` byte-untouched. |
| **Deliverables** | Three refined proposals, each at desktop / tablet / mobile, as annotated architectural elevations — not rendered mockups (see § 2). |

---

## 1. What has been decided, and what this session refines

NORTH4 offered three *different* rooms (a hall, a panorama, a kitchen) and asked which direction to
take. **That question is now answered.** The owner has chosen:

- **The archway** is the **canonical architectural signature** of the THA Home experience.
- The **orchard-derived material language** (NORTH4 § 3, the measured palette) is the **correct
  material direction**.

So NORTH5 is not a search. It does not return to dashboard thinking, and it does not redesign from a
blank page. It takes the **one** vision — *arrival through an arch, into a room made of the orchard's
own materials* — and refines it into **three arrangements of the same room**, to discover the
*definitive* arrival rather than a *direction*.

The three are deliberately close. They are the **same house, the same wall, the same arch, the same
light, the same six materials** — arranged three ways, the way an interior architect shows a client
three furniture plans for one room, not three houses.

| | |
|---|---|
| **Variation 1** | **The Elegant Entrance Hall** — the calmest possible arrival. |
| **Variation 2** | **The Connected Living Space** — the orchard is another room beyond the arch. |
| **Variation 3** | **The Family Hearth** — the warmest interpretation, from Concept C's materiality, without bands or stacks. |

---

## 2. What this session did, and did not

**Did not:** touch Home, write a line of CSS, author a colour token, render a mockup, amend a
governing document, or author a substitute orchard asset. The canonical `ORCHARD.png` is read in
place and byte-untouched.

**Did:** review the chosen direction and all NORTH4 evidence, define the shared design family that
makes three refinements *one* Home, articulate the single new rule the mission demands (**wall →
furniture → floor**), and compose three arrangements of the room at three breakpoints each.

**On the deliverable format.** NORTH4 rendered standalone HTML mockups to PNGs. This mission is
explicit and repeats itself three ways — *"Do not implement. Do not write CSS. Do not modify the
application."* — so NORTH5 delivers the three variations as **annotated architectural elevations**
(plan/section descriptions with wireframe diagrams and material callouts) rather than rendered
screens. This is the honest reading of a design-exploration brief that forbids CSS: the thinking is
the deliverable, and the elevations describe every breakpoint precisely enough to build from, without
building. If the owner wants any one variation rendered, that is a one-session follow-up (it was
NORTH4's whole method) — but it would require writing the CSS this brief forbids.

**Read before starting:** `docs/architecture/README.md` (the mandatory Bootstrap), `NORTH4_HOME_
CONCEPT_EXPLORATION.md` and all its concept renders, the North Star v2 Home render, the v1 kitchen
concept, the new `ORCHARD.png`, and the derived palette (`scripts/north4-concepts/_palette.css`).

---

## 3. The shared design family — what makes three refinements one Home

These eight elements are **identical across all three variations.** They are the kit of parts. A
variation is only a rearrangement of them; none may add a ninth element or drop one of the eight.
This is the mechanism by which the three provably belong to one family.

### 3.1 The Arch — the canonical opening

The orchard is seen through **an arch cut into the plaster wall** — a real architectural opening with
a soft plaster reveal and rounded shoulders, **not** a picture in a frame and **not** a window with
drawn mullions. Its edge is soft (the plaster turns into the reveal; there is no hard black line).
The arch is the **emotional focal point** of every variation, and nothing is ever placed *on* the
orchard inside it — the arch holds only the orchard and its light.

### 3.2 The Continuous Plaster Wall — one surface, never two bands

Behind everything — behind the arch, behind the furniture, behind the greeting — is **one continuous
warm-plaster wall** (`--plaster`, hue 36, the morning-light value). This is the single most important
inheritance, because it is what stops any variation collapsing into NORTH4-B's forbidden bands: the
arch is a *hole in this wall*; the furniture stands *in front of this wall*; the wall is visible above
the furniture, to its left, and to its right. **The wall never changes colour to mark a section.**

### 3.3 The Furniture Principle — the day rests on oak, never on a rectangle

Today's information is **gently placed on one piece of natural-oak furniture** — a console (V1), a low
sideboard/bench (V2), or a kitchen island / hearth mantel (V3). The furniture:

- is a **bounded object** with the wall visible around it — it never spans edge to edge;
- **casts a soft shadow up onto the plaster wall** behind it (this is what makes it furniture and not
  a panel — a panel has no wall behind it to shadow);
- **stands on the floor** — it has a base, and a contact shadow where it meets the ground;
- holds the day's facts as **things resting on its surface** (ivory on oak, each with its own small
  contact shadow — Concept C's discovery, which the mission names as the reason materiality beats flat
  surfaces), not as a row of cards printed onto it.

### 3.4 The Floor — the third plane

Below the furniture is a **third plane**: a warm stone floor (`--stone`, the orchard's pale path) that
catches the lightfall from the arch. The floor is what makes the space a *room* and not a wall
elevation. The furniture stands on it; the light falls across it.

### 3.5 The Light — one arch, one morning

Light enters **only through the arch**. It is the orchard's own golden morning, and it falls in three
places, always: a wash on the **plaster wall** beside the arch, a **pool on the furniture's surface**
(so the day's information is the brightest-lit thing in the room), and a **fall across the floor**.
There is no second light source — no glow behind a card, no lamp, no scrim. (Blueprint § 7 / § 16 —
one sun, no second sun.)

### 3.6 The Material Flow — orchard becomes interior

Every interior material is the orchard's own material, brought indoors and re-lit (NORTH4 § 3.3 —
*hues are law, saturations are re-derived*):

| Orchard material | Becomes, indoors |
|---|---|
| The gate timber (oak, hue 43) | the **furniture** — console / sideboard / island |
| The pale mown path (stone, hue 32) | the **floor** |
| Lit blossom (ivory, hue 39, `#fdf1da`) | the **ivory surfaces** the day's facts are printed on |
| The morning light (hue 33) | the **plaster wall** |
| Leaf-in-shade (the one true green, hue 74) | the **one green** — the primary action, the growing things |
| Sunlit oak / foliage (gold, hue 43) | the **one warm accent** — the door handles, the ring |

Nothing indoors is a colour the orchard does not contain. This is the whole correction of NORTH4 § 2.

### 3.7 The Palette — the measured orchard set

All three use the NORTH4 derived palette verbatim (`_palette.css`). Plaster `hsl(36 46% 94%)`, ivory
`hsl(39 62% 96%)` (never `#fff`), oak `hsl(43 40% 62%)`, ink olive `hsl(70 30% 13%)` (never grey),
one green `hsl(74 34% 24%)`, one gold `hsl(43 62% 47%)`, olive-tinted shadows. The palette does not
vary between variations — only the arrangement does.

### 3.8 The Blossom Threshold — the outside crosses in

In every variation, **a blossoming branch overhangs the arch reveal** — the orchard's blossom crosses
the plane of the wall and enters the room's air, and petal-light softens the line between inside and
outside. This is the mission's *"the orchard should feel closer — not simply visible, almost
tangible."* The branch is never decoration hung on the wall; it is the real tree, leaning in through
the opening, exactly as it does at the top-left of `ORCHARD.png` itself.

---

## 4. The one rule this refinement adds

> **Wall → furniture → floor. Never upper-band → lower-band.**

The mission's central instruction is *"do NOT simply split the page into an upper section and a lower
section."* NORTH4-B did exactly that — orchard band above, room band below, an oak sill between — and
it works, but it is *one careless edit away from a hero banner over a dashboard, forever.* NORTH4-C
found the cure (materiality — a real oak surface holding real objects) but applied it as a
full-width counter that still read as a lower band and died in portrait.

NORTH5's rule keeps C's materiality and kills the band. The day's information sits on **furniture** —
a discrete object standing in front of a continuous wall — not on a **coloured lower half of the
page.** The difference is checkable:

> **The hand test.** Cover the furniture with your hand. Is there a **continuous plaster wall** behind
> where it was? If yes, it is furniture *in* the room. If the wall *changes colour* where the
> furniture was — if the top of the page is one material and the bottom is another — it is a band, and
> it has failed.

Depth, not stacking. The room reads front-to-back — **wall (behind) → furniture (in front, holding
the day) → floor (below)** — the three grounds of Blueprint § 8 arranged as a *room seen in
perspective*, not three horizontal strips. The room continues behind the furniture; the orchard
continues beyond the arch. This rule is the same in all three variations; the variations differ only
in *which piece of furniture* and *where it stands.*

---

## 5. Variation 1 — The Elegant Entrance Hall

> ### "The house is quiet. Everything is in its place. I can put my bag down."

The calmest possible arrival. A tall, slender arch on a wide, still plaster wall; a narrow oak console
standing against the wall beneath it; the day's few facts resting on the console like post left on a
hall table. The orchard is a **calm vertical slice** — cropped to the mown path (the sun out of frame,
as NORTH4-A did), so it reads as *light and a glimpse of morning* rather than a landscape. This is the
hall of a modern English home: the one room where you are asked to do nothing but arrive.

### Desktop (≈1440)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◐ THE HEALTHY APPLES                                                    ⌾  │  ← plaster wall,
│                                                                            │    edge to edge,
│                       ╭─────────────────╮                                  │    top to bottom
│                    ✿ ╱                   ╲   ← blossom branch crosses       │
│                     ╱      orchard        ╲     the arch reveal (§3.8)      │
│                    │    (calm vertical      │                              │
│                    │     slice — light,     │   ← THE ARCH: focal point,    │
│                    │     path, sun out      │      tall + slender, soft     │
│                    │     of frame)          │      plaster reveal           │
│                    │                        │                              │
│         Welcome home,                       │   ← greeting stands in the    │
│              Chloe          ╰──────────────╯      lightfall on the WALL     │
│         FRIDAY, 17 JULY                            beside the arch          │
│      ┌───────────────────────────────────────┐                            │
│      │  ▫ meals   ·   ▫ shopping   ·   ▫ 0/30 │ ← THE CONSOLE (oak): a      │
│      │═══════════════════════════════════════│    slender table, facts     │
│      └──┬──┘   propped: ⌂ Companion note   └──┬┘   resting on its top;      │
│  ~~~~~~~│~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~│~~~~~~  shadow up onto wall   │
│  floor  │        ( Plan today )              │        stone floor below    │
│ Planner · Cookbook · Pantry · Shopping   ← quiet handles low on the wall    │
└──────────────────────────────────────────────────────────────────────────┘
```

- The **console** is centred beneath the arch, low, so the arch (and its orchard) is the uppermost and
  brightest thing — the focal point is never contested. The console is narrow: plaster wall is clearly
  visible to its left and right, and above it between the facts and the arch.
- The **three glance facts** sit along the console top as small ivory objects (`meals` · `shopping` ·
  `0/30 plants`), each with a soft contact shadow — post on a hall table.
- The **Companion note** is a single ivory card **propped against the wall** on the console top, at one
  end — leaning, not mounted.
- The **greeting** stands on the *wall* in the lightfall beside the arch (identity, in light — a
  nameplate, not a fact on the furniture). Serif, per every North Star render (D4 open).
- The **primary action** ("Plan today") is one considered oak-green object just in front of the
  console on the floor.
- The **four doors** are the quietest thing in the room — small name-and-handle marks low on the wall
  at the floor line (the shell's bottom nav already carries the same four).

### Tablet (≈834, portrait)

The composition is naturally portrait already, so it barely changes. The arch narrows slightly and
sits a touch higher; the console stays centred beneath it; the three facts stay in a row on the
console top (they fit); the Companion note moves from *propped on the console* to *propped against the
wall just beside it*, so nothing crowds. Greeting drops to directly above the console. Doors reflow to
the floor line. **Wall visible around the console on both sides throughout.**

### Mobile (≈390, portrait)

```
┌────────────────────┐
│ ◐ THE HEALTHY  ⌾   │  ← plaster wall
│                    │
│   ╭──────────╮ ✿   │  ← the arch: naturally
│  ╱  orchard   ╲     │    portrait — a tall
│ │   (vertical  │    │    slice fits a phone
│ │    slice)    │    │    better than any
│ │              │    │    landscape ever will
│  ╲            ╱     │
│   ╰──────────╯      │
│  Welcome home,     │  ← greeting on the wall
│      Chloe         │    in the lightfall
│  FRIDAY, 17 JULY   │
│ ┌────────────────┐ │  ← THE CONSOLE, narrowed
│ │ ▫ meals        │ │    but still an object:
│ │ ▫ shopping     │ │    wall visible left+right,
│ │ ▫ 0 / 30       │ │    shadow up onto wall,
│ │════════════════│ │    standing on the floor
│ └──┬──────────┬──┘ │
│ ~~~│~~~~~~~~~~│~~~~ │  ← floor
│   ( Plan today )   │
└────────────────────┘
    (doors → bottom nav)
```

The mission's hardest test — portrait — is this variation's **strongest** breakpoint. A hall is a
portrait shape; a tall arch is a portrait shape. The console narrows but keeps its three furniture
cues (wall around it, shadow on wall, base on floor), so it never collapses into a card stack. The
facts stack *on the console top* as a short list, still reading as things on a surface because the
console frame and its shadow contain them. On the quiet day (192/195 households) this is simply a
tidy hall table — never "broken."

### Emotional journey
Arrival before work. You come through the door into a still, light-filled hall. Your name is in the
morning light on the wall. Nothing asks anything of you for the first three seconds — the room's
confidence is in what it leaves out. When you're ready, the day's few things are exactly where you'd
expect to find them: on the table by the door. One quiet way forward (*Plan today*), and four doors.

### Architectural decisions
- **The arch is tall and slender**, so it reads as a *doorway/opening* rather than a *view* — which is
  what a hall arch is, and which keeps the orchard as *light* (its NORTH4-A role) rather than as
  landscape.
- **The console is the smallest honest piece of furniture** that can hold three facts and a note — a
  hall table, not a sideboard. Restraint is the whole design.
- **Symmetry, single axis.** One centred arch, one centred console. The calm is structural.
- **The wall carries the greeting, the furniture carries the day.** Identity in light; information on
  oak. This division is what lets the room stay empty without feeling empty.

### Strengths
- ✅ **The calmest arrival, by a distance** — it is *"calm before capability"* built as a room.
- ✅ **Best on mobile of all three** — arguably better on a phone than on desktop; a corridor is a
  portrait shape.
- ✅ **The honest empty state.** The quiet day is indistinguishable from the full day — a hall with
  little on the table is a quiet morning, not a broken dashboard. This is the correct answer for the
  192/195 unanchored households (NORTH4 § 4.4).
- ✅ Cheapest to build; ages best; no photographic-contrast problems anywhere.

### Weaknesses
- ❌ **The least orchard.** The arch is small and the orchard is a slice; a reasonable person could say
  it under-delivers on *"the orchard as part of the architecture."* It is the variation that most
  makes the orchard *light* rather than *place*.
- ❌ **Ceremony risk.** A centred, symmetric, sparse arrival is one step from a splash screen (a
  Blueprint anti-pattern). It is saved only by the day's content being genuinely present and reachable
  on the console — but the line is thin.
- ❌ **Lowest information generosity.** If the household wants to *feel* their week at a glance, the
  hall table is the most reserved answer.

---

## 6. Variation 2 — The Connected Living Space

> ### "The morning is right there, one step through the arch. This room opens onto another."

The orchard is not a view here — it is **the next room.** A wide, generous arch you could walk
through; the stone floor of the room **continues through the arch and becomes the orchard's mown grass
path**, so the eye reads one continuous ground running from where you stand out into the trees. The
furniture steps aside — a low oak sideboard set off-axis to one side — so nothing blocks the opening
and the whole room draws you *through* it. This is the most spatially generous of the three, and the
one that most makes the orchard *architecture* rather than *picture*.

### Desktop (≈1440)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◐ THE HEALTHY APPLES                                                    ⌾  │
│                    ✿                                                        │
│  Welcome home,   ╭────────────────────────────╮                           │
│      Chloe      ╱                              ╲    ← THE ARCH: WIDE and    │
│  FRIDAY, 17 JULY│      the orchard as the        │     generous — an        │
│                 │      NEXT ROOM: deep, open,     │     opening you could    │
│   ⌂ Companion   │      inviting; you look         │     step through         │
│   note propped  │      THROUGH, not AT            │                          │
│   against the   │                                 │   ┌──────────────────┐   │
│   wall (left)   │                                 │   │ ▫ meals          │   │
│                  ╲                              ╱  │   │ ▫ shopping       │   │
│  ( Plan today )   ╰──────────┬──────────────────╯  │   │ ▫ 0 / 30 plants  │   │
│                              │  stone floor         │   │══════════════════│   │
│  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~│  RUNS THROUGH the    │   └──┬────────────┬──┘   │
│   floor (stone)             ╱   arch and BECOMES    │  ~~~~│~ SIDEBOARD ~│~~~~  │
│                            ╱    the grass path ~~~~~╱      (oak, off-axis,     │
│                           (the threshold — §6.4)          right, holding day)  │
│  Planner · Cookbook · Pantry · Shopping                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

- **The arch is wide** and its base is low — it reads as an *opening between two rooms*, not a window
  on a wall. You look *through* it.
- **The threshold is the signature move.** The interior stone floor runs to the arch and, through it,
  becomes the orchard's mown grass — one continuous ground plane, inside to outside. This is what makes
  the orchard read as *another room* rather than a *view*, and it is the strongest possible answer to
  *"the orchard should feel closer, almost tangible."* You are not looking at the orchard; you are
  standing at its threshold.
- **The furniture is off-axis** — a low oak **sideboard** against the wall to the right, deliberately
  *not* blocking the arch. The day's facts rest on it as objects; the eye finds them *after* it has
  gone through the arch, which is the correct order (arrival, then the day).
- **The greeting and Companion sit on the wall to the left**, balancing the sideboard on the right and
  keeping the arch's opening clear down the centre. Asymmetric, composed.
- **The blossom branch** overhangs the top-left of the arch (as in the asset), leaning into the room.

### Tablet (≈834, portrait)

The wide arch cannot stay wide in portrait, so it becomes a **tall opening** (nearer V1's proportion)
— but the threshold is preserved: the floor still runs up to and through the arch into grass, which is
the load-bearing idea. The sideboard moves from beside the arch to **beneath** it (still off-centre,
still a bounded object with wall around it, still casting its shadow on the wall). Greeting above;
Companion propped on the sideboard. The "next room" feeling survives because the *threshold*, not the
*width*, is what carried it.

### Mobile (≈390, portrait)

```
┌────────────────────┐
│ ◐ THE HEALTHY  ⌾   │
│  Welcome home,     │  ← greeting on the wall
│      Chloe         │
│   ╭──────────╮ ✿   │  ← the arch, tall in
│  ╱ orchard as ╲     │    portrait; still
│ │  next room   │    │    reads THROUGH
│ │              │    │
│  ╲            ╱     │
│   ╰────┬─────╯      │
│  ~~~~~~│~ floor →   │  ← the THRESHOLD survives:
│        │  grass ~~~ │    floor meets the arch,
│ ┌──────┴─────────┐ │    becomes grass. This is
│ │ ⌂ Companion    │ │    the idea that must not
│ │────────────────│ │    be lost on mobile.
│ │ ▫ meals        │ │
│ │ ▫ shopping     │ │  ← SIDEBOARD, narrowed,
│ │ ▫ 0 / 30       │ │    beneath the arch;
│ │════════════════│ │    still furniture (wall
│ └──┬──────────┬──┘ │    around it, shadow, base)
│   ( Plan today )   │
└────────────────────┘
```

The danger on mobile is that a narrowed arch + a stacked sideboard reads like NORTH4-B's banded phone
layout. The defence is the **threshold**: the floor visibly runs *into* the arch and becomes grass, so
the arch is an *opening in a continuous space*, not the top band of a two-band page. Keep that seam and
V2 stays itself; lose it and it becomes B.

### Emotional journey
Openness and invitation. You arrive and the house is already open to the morning — the next room is
the orchard, and the floor you're standing on runs straight out into it. It is generous without asking
anything; it says *the day is out there and it's beautiful, come and see* — and then, quietly to one
side, here is what's on today.

### Architectural decisions
- **The wide arch + low base** make it an opening between rooms, not a window — the whole difference
  between *the next room* and *a nice view*.
- **The continuous floor-to-grass threshold** is the single decision that carries the concept, and it
  is preserved at every breakpoint even as the arch changes shape.
- **Furniture off-axis** keeps the opening clear so the eye travels through first. Balance is held by
  putting the greeting/Companion on the opposite side — asymmetry, composed, never accidental.

### Strengths
- ✅ **The most orchard connection** — the best answer to *"the orchard as part of the architecture"*
  and *"almost tangible."* The threshold is the strongest single move in this document.
- ✅ **The most generous and welcoming** without becoming a hero banner, because the orchard is *through
  an arch into another room*, not a full-bleed strip across the top.
- ✅ Closest to the governing vision *"a modern home in an ancient orchard"* — you are standing exactly
  on the line between the modern home and the ancient orchard.

### Weaknesses
- ❌ **The threshold is hard to execute** without reading as a collage seam where stone meets grass. It
  is the concept's glory and its risk; done poorly it looks pasted.
- ❌ **The wide arch shows the most orchard, so it shows the most sun** — the § 7 upper-right breach is
  most exposed here (see § 10). Cropping choice matters most in V2.
- ❌ **The empty-room risk** (NORTH4-B's *"nobody home"*) is present because the arch is generous —
  milder than B (it's an arch, not a full-width landscape), but the off-axis furniture must stay
  visibly *occupied* by the day's facts so the open room doesn't read as vacant.
- ❌ Off-axis balance is a craft tightrope: if the greeting side is too empty, the room tips.

---

## 7. Variation 3 — The Family Hearth

> ### "Someone's already lit the hearth. The day is warm and waiting."

The warmest interpretation — Concept C's materiality (oak you could touch, objects with real contact
shadows, *someone has already been here*) rearranged as **furniture in a room**, not as horizontal
colour bands or a stacked layout. The arch here is deep and recessed, like an **inglenook or a
hearth**: the orchard glows *within* it, warm and golden, the way a fire glows in a fireplace. In
front of it stands a substantial oak **island / mantel-shelf** at waist height, where the day's things
are laid out. This is the *home* of the three — the one with a family in it — and it is the descendant
of the v1 kitchen concept, the most THA-feeling image in the repository.

### Desktop (≈1440)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◐ THE HEALTHY APPLES                                                    ⌾  │
│                                                                            │
│  Welcome home,          ╭───────────────────────╮ ✿                        │
│      Chloe            ╱▒▒▒ deep reveal (shadow  ▒▒╲   ← THE ARCH as HEARTH:  │
│  FRIDAY, 17 JULY     │▒▒   falls INSIDE the      ▒▒│     recessed alcove,     │
│                      │▒   arch) — orchard GLOWS   ▒│     orchard glowing      │
│   ⌂ Companion note   │     within, warm + golden   │     within like a fire   │
│   propped on the     │     like a hearth-fire      │                          │
│   mantel (left end)   ╲▒▒                        ▒▒╱                          │
│                        ╰────────────────────────╯                           │
│      ┌────────────────────────────────────────────────────┐                │
│      │  [▫ meals]      [▫ shopping]      [▫ 0/30 plants]    │ ← THE ISLAND /  │
│      │  ivory objects on oak, each w/ its own contact shadow │   MANTEL: oak,  │
│      │▓▓▓▓▓▓▓▓▓▓▓▓▓▓ warm oak, grain, light-pool ▓▓▓▓▓▓▓▓▓▓│   substantial,  │
│      └──────┬──────────────────────────────────────┬───────┘   at waist —    │
│  ~~~~~~~~~~~│~~~~~~~~~~~ ( Plan today ) ~~~~~~~~~~~~│~~~~~~~~~   YOU STAND     │
│  floor      │  plaster wall CONTINUES above + around │        AT IT           │
│ Planner · Cookbook · Pantry · Shopping        the island (NOT a full band)   │
└──────────────────────────────────────────────────────────────────────────┘
```

- **The arch is a deep recess** — its reveal has real depth, and shadow falls *inside* it (C's window
  reveal, which cut the opening *through* the wall rather than mounting a picture *on* it). The orchard
  within is lit warm, the golden-hour glow, so it reads as a *hearth* — the emotional heart of the
  home, radiating warmth into the room.
- **The island is substantial oak** — the heaviest oak presence of the three, at waist height, and you
  stand at it (C's discovery: the ground plane you actually stand at). But — and this is the whole
  refinement over C — **it is a piece of furniture, not the lower half of the page.** The plaster wall
  continues *above* the island (between it and the hearth), *to its left*, and *to its right*; the
  floor is visible below it. Run the hand test (§ 4): cover the island and the wall is continuous
  behind it. C failed this; V3 must pass it.
- **The day's facts are objects on the oak** — ivory forms with real contact shadows, catching the
  light-pool. The Companion note is propped standing on the mantel at one end.
- **Warmth comes from material and light, never from props.** No bowl of apples, no coffee mug (that is
  C's theme-park cliff, § 7 below). The hearth-glow and the oak do the warming.

### Tablet (≈834, portrait)

The island narrows to a **mantel-shelf** proportion but keeps its depth and its light-pool. The hearth
arch stays deep and warm above it. The facts reflow to a short column of objects on the shelf. The
greeting and Companion move above the mantel on the wall. Critically, the wall stays visible above the
shelf and to its sides — the mantel must not grow to fill the width, or it becomes the band the mission
forbids.

### Mobile (≈390, portrait) — the decisive test

```
┌────────────────────┐
│ ◐ THE HEALTHY  ⌾   │
│  Welcome home,     │
│      Chloe         │
│   ╭──────────╮ ✿   │  ← the HEARTH arch,
│  ╱▒ orchard  ▒╲     │    deep + glowing,
│ │▒  glows in  ▒│    │    stays warm even
│ │▒ the hearth ▒│    │    small
│  ╲▒          ▒╱     │
│   ╰──────────╯      │
│ ┌────────────────┐ │  ← THE MANTEL, narrowed
│ │⌂ Companion     │ │    to a shelf but STILL
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │    A PIECE OF OAK:
│ │ ▫ meals        │ │    - wall visible L + R
│ │ ▫ shopping     │ │    - shadow up onto wall
│ │ ▫ 0 / 30       │ │    - the day as objects
│ │▓▓ oak, grain ▓▓│ │    - NOT a card stack
│ └──┬──────────┬──┘ │
│ ~~~│~ floor ~~│~~~~ │
│   ( Plan today )   │
└────────────────────┘
```

This is the breakpoint where NORTH4-C *died* — its counter became "B's idea, a band above you," and it
stopped being itself. V3's job is to **not repeat that.** The fix is the shared kit: the mantel stays a
*bounded oak object* (wall to its left and right, shadow up onto the wall, base on the floor, day laid
on top as objects). As long as the oak is a discrete shelf and not the page's lower half, the hearth
survives portrait. **If on the phone the oak ever reaches both screen edges, V3 has failed and become
C.** This is the single most important constraint on this variation.

### Emotional journey
Being cared for. You arrive and someone has already been here — the hearth is warm, the light is on
the oak, and the day's things are laid out for you on the island where the family gathers. It is the
least ceremonial and the most human; it answers *why does this brand exist* better than either sibling.

### Architectural decisions
- **The arch as a deep recessed hearth** turns the orchard from *view* into *warmth radiating into the
  room* — the emotional focal point becomes literally the heart of the home.
- **The island is the heaviest furniture** of the three because warmth wants mass — but it is held to
  *furniture*, not *band*, by the continuous wall above and around it. This is the entire refinement of
  C, and the hand test is its gate.
- **Warmth by material, not by prop.** The line between *warm home* and *theme park* is exactly the
  line between light-on-oak and a painted bowl of apples. V3 stays on the material side.

### Strengths
- ✅ **The warmest arrival, by a distance**, and the best answer to *"a modern home in an ancient
  orchard, where technology quietly supports timeless family life."*
- ✅ **The best materiality** — furniture-as-object with real contact shadows; the mission names this
  (*"materiality feels better than flat surfaces"*) as the reason to prefer C's discovery. V3 keeps it
  and fixes its layout.
- ✅ The direct descendant of the v1 kitchen concept — the most THA-feeling image THA has produced.

### Weaknesses
- ❌ **The theme-park cliff is closest here.** One prop (a bowl, a mug) and it tips from *calm* to
  *charming*, and Experience Language § 7 warns against charm. It requires the most disciplined hand of
  the three.
- ❌ **The empty island risk.** A substantial surface implies abundance; on the quiet day an island with
  three small objects on it can read *nobody's been here* — the exact opposite of the intended feeling.
  Mitigated (not eliminated) by keeping the hearth glowing so the room is never cold, but this is V3's
  hardest honest state.
- ❌ **Portrait is the constant threat** (see mobile). C proves this concept *can* die on a phone; V3
  survives only by rigid adherence to the furniture rule, forever — a real maintenance hazard.
- ❌ Heaviest to execute well (deep reveal, oak grain, honest light-pool — no clip-path shortcuts, per
  NORTH4-C's own note that *"light had to be drawn as light"*).

---

## 8. How the three differ — one room, three arrangements

They are deliberately *not* three concepts. They share the arch, the wall, the floor, the light, the
six materials, the palette, and the blossom threshold. They differ on exactly **one axis: what the
furniture is, and therefore what the room is for.**

| | **V1 · Entrance Hall** | **V2 · Connected Living Space** | **V3 · Family Hearth** |
|---|---|---|---|
| **The furniture is…** | a **hall console** | an **off-axis sideboard** | a **kitchen island / mantel** |
| **The arch is…** | tall + slender (a doorway) | wide + low (an opening between rooms) | deep + recessed (a hearth) |
| **The orchard is…** | **light** through a slice | **the next room** (threshold) | **warmth** glowing within |
| **Composition** | centred, symmetric, single axis | asymmetric, drawn *through* | frontal, you stand at the island |
| **Emotional register** | calm · reserved · still | open · generous · inviting | warm · human · occupied |
| **Best breakpoint** | **mobile** (portrait-native) | desktop (width shows the depth) | desktop (mass wants room) |
| **On the quiet day** | **unchanged — still a hall** | at slight risk — keep it occupied | at most risk — glowing hearth saves it |
| **Signature risk** | ceremony / splash | collage seam at the threshold | theme-park / portrait collapse |
| **Orchard delivered** | least | **most** | warmest |

All three pass the hand test (§ 4): wall behind the furniture, furniture on the floor, orchard beyond
the arch. None is a band above a dashboard. That is the family resemblance, and it is structural, not
stylistic.

---

## 9. What all three preserve (unchanged from NORTH4)

No API, hook, contract, route, or state is added, removed, or altered — only re-composed. Every
element NORTH4 § 5 listed still has a home in all three variations: the greeting / signature / date;
the Companion note; the three glance facts (`meals` / `shopping` / `plants`); the one primary action;
the four doors; every loading / error / empty / **unanchored** state; and every hook
(`useCurrentPlannerWeek`, `useMealsSummary`, `useCompanionNotices`, `useFoodOpportunities`, …). The
mockups (were they built) would render the **unanchored / quiet-day** state, because that is the
default state for 192 of 195 households (NORTH4 § 4.4) — not a showreel.

**Everything visual is open. Nothing behavioural moves.**

---

## 10. Governance — the path to build (carried from NORTH4, not re-opened)

The direction is chosen, so these are no longer *"which direction?"* questions — they are the named
steps between this document and a build. Per the Architecture Bootstrap, they are reported, not
resolved here.

| # | Item | Status for NORTH5 |
|---|---|---|
| **G1** | **The arch is a drawn frame.** Blueprint § 6 fixes Home at **E3 "the open view — Home only"** and E2 reads *"framed by composition, never by a drawn frame."* The arch — the now-*canonical* signature — is a drawn frame. | **Requires the named § 6 amendment (NORTH4 D2) before any CSS.** Choosing the arch as canonical is the owner's answer to *"which concept"*; it is not yet an amendment to the rule the arch breaks. The amendment should admit a plaster arch as an E3 aperture (an *architectural* opening, which is what the mission asked for) and draw the line against the decorative picture-frame § 6 was written to forbid. |
| **G2** | **The sun is upper-right** in `ORCHARD.png` (measured; NORTH4 § 4.2) vs § 7's *"upper-left, forever."* Each variation crops differently: **V1** crops it out of frame (§ 7 not engaged); **V2**'s wide arch shows the most sky (most exposed); **V3**'s hearth-glow can *absorb* it as warmth. | Unchanged, owner's (NORTH4 D3): mirror the asset, amend § 7, or keep composing by crop. **V1 is the safest under § 7; V2 the most exposed.** |
| **G3** | **The palette.** The orchard-derived set (NORTH4 § 3) is now the *chosen* material direction — but `--primary`/`--foreground`/`--accent` still sit in the 0.01% hue band across the whole product. | Adopting the palette is platform-wide (every button in every room), independent of which variation wins (NORTH4 D1). It remains *the strongest single move*, and NORTH5 assumes it. |
| **G4** | **The signature** — serif (every North Star render) vs Caveat (§ 5.1 *"the greeting in THA's hand"*, shipped since NORTH1). | Unchanged, owner's (NORTH4 D4). All three variations set it in serif and absorb a swap without recomposition. |

Still open from NORTH3, unchanged: Home's header reads **"Home"** above "Welcome home, Chloe"; the
doors duplicate the four in the bottom nav. Neither is a NORTH5 finding; both survive into all three.

---

## 11. Recommendation — the definitive Home

**Develop V2 (The Connected Living Space), carrying V1's discipline and V3's material honesty.**

The mission's own words decide it. The orchard is now *"part of the architecture"* and must feel
*"closer — almost tangible."* Of the three:

1. **V2 delivers the orchard as architecture most completely.** The threshold — the floor running
   through the arch into grass — is the only move in this document that makes the orchard *a place you
   are standing at the edge of* rather than *a thing you are looking at*. That is *"almost tangible,"*
   built.
2. **V1 is the safest and calmest, and it owns the quiet day** — but it is the *least* orchard, and the
   mission has explicitly asked for *more* orchard, not less. Its discipline (the continuous wall, the
   small honest furniture, the empty-state grace) should be **carried into V2** as the antidote to V2's
   one real weakness: the open arch's *"nobody home"* risk. On a genuinely quiet day, V2 should stand
   nearer V1 — a calm threshold, the sideboard lightly set — rather than a generous empty room.
3. **V3 is the warmest and the most human, and it answers "why this brand exists" best** — but it
   carries C's two unresolved hazards (the theme-park cliff and portrait collapse) into a *chosen*
   direction, where they become permanent maintenance liabilities. Its **material honesty** — furniture
   as real oak objects with contact shadows, warmth from light not props — should be **carried into
   V2's sideboard**, so V2's furniture has V3's tangibility.

So the definitive Home is **V2's spatial idea, executed with V1's restraint and V3's materials**: you
arrive at the threshold of the orchard; the day's few things rest, tangible, on an oak sideboard to one
side; and on the quiet morning that is almost every morning, the room is simply calm rather than empty.

The one move that outranks the choice, again, is **G3, the palette** — it is what turns any of these
three from *a beautiful web page* into *a room made of the orchard*, and it is true of all three
equally.

---

## 12. Verification

| Check | Result |
|---|---|
| Product source modified | **None.** `home-experience-page.tsx`, `index.css`, every component — byte-untouched; `git status` modified-list identical to session start. |
| Canonical orchard asset | **Byte-untouched.** Read in place; no substitute authored (NORTH3 owner ruling honoured). |
| CSS written | **None**, by instruction. Deliverables are architectural elevations, not renders (§ 2). |
| Mockups rendered | **None**, by instruction (NORTH4 rendered; NORTH5 forbidden to write CSS). |
| Design family | Eight shared elements (§ 3) inherited by all three; single differing axis (§ 8). Provably one Home. |
| The added rule | One (§ 4): wall → furniture → floor, with the checkable hand test. |
| Governance | Four open items carried from NORTH4 (§ 10), reported not resolved, per the Bootstrap. |
| Rollback | Branch `rollback/NORTH5-home-refinement-20260717` + tag `north5-wip-snapshot-10573dd2` created at HEAD before any work. |
| Migration / gates | **None.** No product code changed. |

**Artifacts**

```
docs/implementation/NORTH5_HOME_REFINEMENT.md     this report
.engineering/session/runs/NORTH5_Home_Refinement.md   the run file
(no scripts, no renders, no CSS — by instruction)
```

---

*NORTH5 — design exploration only. Nothing implemented, by instruction. The direction is chosen; this
document refines it into the definitive Home and names the single amendment that stands between it and
a build.*
