# LARDER7 — Living Larder Visual Concepts

**Document ID:** `LARDER7`
**Date:** 2026-07-25
**Status:** DESIGN INVESTIGATION — point-in-time exploration. **Not governing architecture. Nothing is approved. No concept is selected.**
**Rollback identifier:** `rollback/LARDER7-living-larder-visual-concepts-20260725` → `bcab1846`
**Author of record:** Colin Clapson (Home Owner) · explored by Claude as Creative Director under the Engineering Workflow
**Aesthetic authority:** **The Home Owner** ([`HOME_OWNER_ARCHITECTURE.md`](../../architecture/HOME_OWNER_ARCHITECTURE.md), cited). This document *recommends*; it decides nothing.

> **What this is.** Five genuinely different senior-level visual concepts for the Living Larder, explored **before engineering resumes**, each with its own identity, as though authored by five different senior interior designers. Its purpose is to open the design space, not to close it.
>
> **What this is not.** Not an implementation, not architecture, not an approval. **No React, no CSS, no component, no token, no runtime behaviour, no production asset, no schema, no deployment.** It changes nothing and no code reads it. Where it touches a governed rule it **cites** the owner and never restates or amends it.
>
> **It deliberately does not converge.** Five concepts are presented as five, with their real strengths and their real weaknesses. A recommendation is given at the end because a Creative Director who refuses to recommend is not doing the job — but **the recommendation is not a decision**, and the four unrecommended concepts are left fully specified so that any of them remains buildable if the Home Owner prefers it.

---

## 1. Reading, and method

**Read in full before any concept was drawn** (Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` `STEP 2`):

| Document | What it fixed for this exploration |
|---|---|
[`docs/architecture/README.md`](../../architecture/README.md) | The governing canon and its precedence |
| [`LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md`](../../architecture/LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md) (`LARDER1`) | What the room *is* — a real larder, never a list; never a quantity; every drag outcome has a non-drag equivalent |
| [`LIVING_LARDER_INTERIOR_ARCHITECTURE.md`](../../architecture/LIVING_LARDER_INTERIOR_ARCHITECTURE.md) (`LARDER2`) | The six wings, the furniture, the nine product forms, availability-by-looking, the Growth Law |
| [`LIVING_LARDER_INTERACTION_CONSTITUTION.md`](../../architecture/LIVING_LARDER_INTERACTION_CONSTITUTION.md) (`LARDER3`) | The Object Constitution, the Movement Principles `M1`–`M7`, Room Memory |
| [`LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md`](../../architecture/LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md) (`LARDER4`) | The build order and the STOP rule |
| **[`LIVING_LARDER_ARCHITECTURE.md`](../../architecture/LIVING_LARDER_ARCHITECTURE.md) (`LARDER5`)** | **The binding spatial frame** — shell · station point · projection · aperture · plan · furniture-as-navigation · the two compositions · `RC1`–`RC12` |
| [`LIVING_LARDER_ASSET_LIBRARY.md`](../../architecture/LIVING_LARDER_ASSET_LIBRARY.md) (`ASSET1`) | 59 specified assets across nine categories, each on 21 dimensions; the feeling standard; the canonical style |
| [`CAPABILITY_BOUNDARY_ASSESSMENT.md`](../../architecture/CAPABILITY_BOUNDARY_ASSESSMENT.md) (`CAPBOUND1`) | How every gap below is classified |
| The approved **Pantry North Star** — `attached_assets/design/north_star/v3/North star atmosphere pantry.png`, and the `pantry new.png` variant | **Read as images**, at full size. The governing reference for *feeling, atmosphere and hospitality* — explicitly **not a wireframe** (`LARDER5` § 17, cited) |
| The existing asset library | **Read on disk and inspected visually** — 27 jar masters, 10 joinery masters, 2 produce, 6 dressing SVGs |

**Method** (`CRAFT1` § 7, cited). Each concept was designed **from the governing architecture as though no implementation of the Larder had ever existed.** The built room was not opened, and the existing asset library was consulted **only after** all five concepts were designed — so that no concept was shaped by what happens to exist. `CRAFT1`'s direction is the reason: *existing implementation is reference material, never design authority.* Where a concept therefore needs an asset that does not exist, that is recorded as a gap in § 15 and **never resolved by reaching for a file that happens to be nearby.**

---

## 2. The fixed frame — what all five concepts obey

Five concepts are only genuinely different if they differ *inside* the same architecture. `LARDER5` is governing and none of the following is a design variable. Every concept below obeys all of it:

| Fixed by `LARDER5` | Consequence for all five concepts |
|---|---|
| **The shell** — floor, back wall, two returns, doorway at the near edge, bounded top, **no ceiling drawn** | Each concept is a real volume. None is a background image, a page with a picture on it, or a stage (§ 5.3) |
| **The station point** — one step inside the door, standing eye height, facing the Dry Store wall square-on | No concept offers a plan view, a corner three-quarter view, a walk-in space, or an alternate viewpoint |
| **The projection** — long-lens one-point elevation; focal wall square; recession carried by the returns; **a jar is never drawn in perspective**; no camera | No concept zooms, pans, parallaxes or rotates. One consistent scale in all five |
| **The aperture** — exactly **one** opening, in the **left return**, which is both the orchard window (**E2**) and the room's only light; the house's one morning, upper-left; every shadow agrees | All five put the window on the left. None draws a second sun. None hangs the orchard behind the page |
| **The plan** — Wing A on the back wall; aperture, working surface, drawers, spice, oils, breakfast, tea, produce baskets on the left; cold pair, household, hospitality, drinks, seasonal on the right; basket by the door | All five share the plan. Concepts differ in *how each wing is built*, never in where it stands |
| **Furniture as navigation** — **no** tab, chip, filter, dropdown, accordion, breadcrumb, sort, view-switcher or category list, ever; **look · open · reach**; opening is disclosure in place; the room has one address | No concept contains a navigation control. This is absolute and device-independent |
| **One ground** — no card, panel, tile, sheet or bordered container may sit on the room; information attaches **to things** | No concept overlays a summary strip, a stats row, or a bordered section |
| **The compositions** — desktop: the whole volume in one view, surplus width becomes air and light; mobile: the same room, narrower field of view, entered through its light, **ending on the floor** | All five specify both, and all five inherit `LARDER5` § 12's named hardest problem |
| **The envelope** — the shell, viewpoint, light, plan and navigation are permanently the house's and are never themed, configured or preferred | No concept is a "theme". **Exactly one of the five would be built, for every household, forever** |
| **Environmental Dressing is refused in this room** (`LIVINGHOME2` § 5.1; `LARDER5` § 13) | Nothing in any concept is placed by the room. *If the room put it there it is refused; if the household keeps it, it belongs* |

**And one rule that shapes every concept's success or failure:** *"The majority of the room is answered by **look**. That is the design target and the measure of whether the composition succeeded"* (`LARDER5` § 15.2, cited). Every concept below is judged against it, and two of the five are in real tension with it.

---

## 3. Three divergences found before design began — surfaced, not resolved

A Creative Director's first duty is to say what is already in conflict. Three things are, and all three are **the Home Owner's to decide** (`HOMEOWNER1`, cited). None is resolved here.

### 3.1 The approved North Star is a card layout; the governing architecture forbids cards

This is the largest finding in this investigation and it must be said plainly, because **no concept below can look like the approved imagery, and the reason is not a shortfall in the concepts.**

Both North Star renders show, laid over a photographic larder: a three-tile status strip (*Well stocked 18 · Running low 6 · Need attention 4*), a **3 × 3 grid of bordered category cards** (*Grains & Flours 12 items ›*, *Pulses & Beans 8 items ›* …), an *Add to shopping* bar, and — in the `pantry new.png` variant — a *Smart suggestions* row of recipe chips.

Every one of those is refused by the governing architecture, by name:

- **The cards are a second ground.** *"No card, panel, tile, sheet, or bordered container may sit on the room"* (`LARDER5` § 5.2, cited).
- **The category grid is a navigation control.** *"There is no list of categories anywhere. The household never chooses a category; they look at a shelf, or open a cupboard"* (`LARDER5` § 15.1, cited).
- **The item counts are quantities.** *"Never a quantity"* (`LARDER1`, cited); *"the form is read, never counted"* (`LARDER2` § I.7, cited).
- **The photographic room behind the cards is wallpaper.** *"Never a background image … a photograph or illustration of a pantry, laid behind the furniture, is wallpaper"* (`LARDER5` § 5.3, cited).
- **The Smart suggestions row is coaching in a room.** *"Rooms report, they do not counsel"* (**GEA8**, cited).

`LARDER5` § 17 already records that the North Star *"guides feeling and composition and is explicitly not a wireframe."* This investigation confirms that reading is the only one that reconciles the two documents — and it means the North Star's **contribution is its atmosphere, its warmth, its light, its hospitality and its materials**, all of which every concept below takes seriously, and **not its layout**, which the architecture retired. If the Home Owner intends the card layer literally, that is a decision to amend `LARDER5`, and it should be made as an amendment at `LARDER5` rather than discovered halfway through a build.

### 3.2 The aperture is on the left; the North Star's orchard is on the right

Already recorded and routed to the Home Owner (`LARDER5` § 17, cited). Restated here only because it is visible in every concept: `LARDER5` § 8.1 forces the window into the **left** return, since the house's one morning is upper-left and *"a window opposite the light is a second sun."* The North Star's orchard is on the right, with light raking in from the right. **The two cannot both be true.** All five concepts follow `LARDER5`.

### 3.3 `ASSET1` specifies four assets that `LARDER5` and `LIVINGHOME2` now forbid

`ASSET1` is dated 2026-07-23; `LARDER5` is dated 2026-07-24. Four `ASSET1` entries did not survive the day after they were written, and no correction has been made at either owner:

| `ASSET1` entry | What now forbids it |
|---|---|
| **H1 — Pendant Light** (hanging light above the working surface) | `LARDER5` § 8: the room is lit *"by one morning through one window **and by nothing else**"*; § 5.3: *"never a stage — no vignette, no spotlight"* |
| **H2 — Under-Shelf Lighting** | Same. A second light source contradicts the one-sun law (Blueprint § 7, cited) |
| **H8 — Seasonal Flowers** | `LIVINGHOME2` § 5.1 and `LARDER5` § 13: **Environmental Dressing is refused in this room.** Flowers the room placed are dressing; the household does not keep cut flowers as a Domain 30 staple |
| **I7 — Evening Warmth** | The one-morning law: *"one morning, in every room forever"* (Blueprint § 7); *time may aim words and doors, never light* (`HT13`, cited) |

A fifth is genuinely ambiguous and worth an explicit ruling rather than a guess: **H4 — Herb Pot.** The North Star shows herb pots on the sill and they are among the most alive things in the image. Under `LARDER5` § 13's test — *if the room put it there, it is refused; if the household keeps it, it belongs* — a herb pot is lawful **only** if a household's own kept herbs are a real provision the Larder renders from an owner. That is a decision, not a detail, and every concept below marks the sill herbs as **conditional on it**.

**None of these is amended here.** Each is an **Architecture Gap** in § 12.

---

## 4. What the canon leaves genuinely open — the design axes

With § 2 fixed and § 3 surfaced, these are the axes on which a senior designer can legitimately differ. The five concepts are differentiated on *all eight*, not restyled on one:

1. **The building fabric** — what kind of larder this is: conserved stone, fitted painted joinery, oak farmhouse workroom, glazed modern, or edited-minimal.
2. **The joinery language** — freestanding vs fitted vs floating vs planar; painted vs raw vs glazed.
3. **The open : enclosed ratio** — how much of the room is answered by *look* versus behind a door. Bounded by § 15.2's target, not fixed by it.
4. **The cold treatment** — whether an appliance is ever visible, and if so as what.
5. **The store-room** — where a household's bulk and overflow physically lives.
6. **Jar, tin and label presentation** — vessel family, uniformity, and where the household's own words appear.
7. **The aperture's size, height and glazing** — within *one opening, left return, E2*.
8. **The light's quality** — within *one morning, upper-left*: crisp and raking, or wide and diffuse.

> **A governance note on axis 8, which applies to all five.** The light's *direction* is fixed house-wide (Blueprint § 7). Its *quality* is not stated by any owner — but a Larder lit by a crisp raking beam beside a Home lit by a wide diffuse morning would be **two mornings in one house**, which is the one-sun law's own failure in slower motion. **Whichever concept is chosen, its light quality becomes the house's**, and that consequence is named per concept rather than left for the second room to discover.

---

# THE FIVE CONCEPTS

---

## 5. CONCEPT 1 — THE KEPT SCULLERY

### *The sensibility of a conservator: a room that was here before the household, and will be here after them.*

### 1 · Overall design philosophy

The larder is **not designed; it is inherited.** This is a late-Georgian English scullery-larder that has kept food for two hundred years and has been *conserved* rather than styled — lime-plastered rubble walls a foot thick, worn stone flags, a marble cold slab, scrubbed pine furniture that stands on the floor rather than being fixed to the wall, and iron hooks driven into the joists by somebody long dead.

Its governing idea is **the room outlives its contents.** Nothing in it looks chosen. There is no cabinetry, because cabinetry is a modern idea; there are *shelves on brackets*, a *table*, a *slab*, and *hooks*. The household's provisions are the newest things in the room by two centuries, and the room's dignity comes from that contrast.

The design position it takes against the other four: **permanence beats convenience.** A stone room cannot be reconfigured, and that is its argument.

### 2 · Emotional feeling on entering

**Coolness, quiet, and reverence.** The temperature drop as you step in. A sense of being in a room that has *already* looked after generations, which quietly transfers some of the burden of provisioning off the household and onto the house. Not cosy — *steady*. The feeling is closest to a church vestry or a walled kitchen garden's potting shed: entirely unsentimental care.

Against the Experience Language's palette (`EXPLANG1B`, cited): it aims squarely at **calm · thoughtful · comforting**, and it is the concept that must work hardest to avoid **cold · clinical · funeral-parlour calm.** Its answer is the household's own things — the warmth in this room is not in the fabric, it is in the provisions, the linen and the light.

### 3 · Front-on room composition

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │ ░░ lime plaster, uneven, lit ░░ ── bounded top, no ceiling ── ░░░░░░░░ │
  │  ┌────────┐  ══════════════════════════════════════   ┌──────────────┐ │
  │  │▓ORCHARD│  ▬▬ planked pine on iron brackets ▬▬▬▬    │  ┃ THE COLD  │ │
  │  │▓ small ▓│  crocks · tins · stoneware               │  ┃ CUPBOARD  │ │
  │  │▓ deep  ▓│  ══════════════════════════════════════  │  ┃           │ │
  │  │▓ set   ▓│  ▬▬ glass clamp-tops, paper tags ▬▬▬     │  ┃ one tall  │ │
  │  │▓▁▁▁▁▁▁▓│  ══════════════════════════════════════   │  ┃ panelled  │ │
  │  └─┬──────┘  ▬▬ dry goods · paper sacks ▬▬▬▬▬▬        │  ┃ door      │ │
  │  ▒▒│ STONE   ══════════════════════════════════════   │  ┃ (C2 + C3  │ │
  │  ▒▒│ SILL    ⌐ iron hooks · linen · bunched herbs ¬   │  ┃  within)  │ │
  │  ▒▒│ baskets                                          │  ┗━━━━━━━━━━ │ │
  │  ▒▒┴▒▒▒▒▒▒▒  ┌──────────────────────────┐             ├──────────────┤ │
  │  [ scrubbed pine table, freestanding    ]             │ ▬ MARBLE ▬▬▬ │ │
  │  [ open beneath — baskets on the floor  ]             │ ▬ COLD SLAB  │ │
  │  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔              └──────────────┘ │
  ├────────────────────────────────────────────────────────────────────────┤
  │ ╱╱ WORN STONE FLAGS — irregular, one continuous cool ground ╱╱╱╱╱╱╱╱╱╱ │
  │    ⌂ a willow shopping basket, on the flags by the door                │
  └────────────────────────────────────────────────────────────────────────┘
     one cool morning from the upper left ↘ · low contrast · long soft shadows
```

*(A schematic of relationship — what is above, beside and in front of what. **Not a wireframe**, not a grid, no proportions. Every value stays the UI Architecture's and `ASSET1`'s.)*

### 4 · Furniture layout

Freestanding and demountable throughout — **nothing in this room is fitted.**

- **Back wall (Wing A):** four tiers of thick planked pine on visible black iron brackets, running the full width. Wide gaps between tiers; the plaster is a full participant between them.
- **Left return:** the deep-set window with a **stone sill deep enough to stand baskets in**; below it a freestanding scrubbed pine table (the working surface) with **open space beneath**, where sacks and baskets sit on the flags. A pine shelf beside the window for oils. No drawers — a Georgian larder has none. The spice collection lives in a small pine rack on the wall by the table.
- **Right return:** one tall panelled **cold cupboard** door, and beneath the return a **marble cold slab** on brick piers.
- **Above and between:** iron hooks in the beam line for linen, string, bunched herbs.
- **The floor:** baskets and sacks stand directly on it. This is the only concept where the floor is *used*.

### 5 · Fridge, freezer, pantry and store-room treatment

**Its most radical move: no appliance is ever visible.**

- **Fridge and freezer** are two compartments **behind one tall panelled door** in the right return — *the cold cupboard*. Closed, it is joinery from 1790. Opened, it is honest: a cold-lit interior with the fridge above and the freezer below, both plainly modern, because pretending otherwise inside the door would be the fakery `ASSET1`'s feeling standard forbids. The concept's claim: a household does not need to see two large white boxes to know they own them; they need to know *which door*.
- **The marble cold slab** carries the daily cold things — butter, cheese, milk, eggs — in the historically correct place, in the coolest part of the room, furthest from the light. It is the one genuinely novel storage idea in the five concepts and it is *true*: this is what larders did before refrigeration.
- **Pantry / dry store** is the back wall, entirely open. Nothing is hidden here.
- **Store-room** is the deep recess to the right of the cold cupboard, closed by a **coarse linen curtain on an iron rod** — the household's bulk, overflow, hospitality store and seasonal keeping, behind cloth rather than a door. A curtain is honest about being a curtain, costs the composition almost nothing, and is period-true.

### 6 · Floating shelf design

**Explicitly refused, and the refusal is the design position.** A floating shelf is a modern cantilever; in a stone-and-plaster room it would be the one impossible object, and its impossibility would be *felt* even by someone who could not name it. Every shelf here is **carried** — thick pine on visible iron brackets, so the eye can see what holds it up. This concept's answer to *how does the shelf stay up?* is *you can see how.*

### 7 · Jar, tin and ingredient presentation

**Deliberately mixed and deliberately unmatched** — a real larder accumulates, and this room's history is its whole argument.

- **Glass clamp-top jars** for everything whose availability must be read by level: flour, rice, oats, pasta, pulses, sugar. These carry the room's availability language, so they are glass without exception (`LARDER2` § I.8, cited).
- **Stoneware crocks** for salt, and for the flour a household buys in bulk — lidded, opaque, and therefore **read by presence, never by level**, which is honest because a crock genuinely cannot be read.
- **Tin canisters** for tea and coffee. **Tins** stacked plainly on the upper tier.
- **Paper sacks** standing on the floor beneath the table, folded and clipped.
- **Labels: paper tie-on tags, in the household's own hand.** Not on the jar's face — hung from the clasp, so the glass stays clear and the level stays readable. This is the most human labelling of the five and the one most likely to feel like *the household's* room rather than the product's.

### 8 · Orchard relationship

**The orchard as a distance, seen out of a thick wall.** A small deep-set casement in the left return: the reveal is the *wall's own thickness*, splayed, plastered, and clearly a foot deep. You do not look *at* the orchard, you look *through* something at it. The view is a bright rectangle in a cool room, and the contrast does the work of a much larger window.

Consequence, stated honestly: this is the **smallest** orchard of the five, and therefore the **least** orchard presence. It is exactly what Blueprint § 5.1's *"the smallest window"* describes — but if the Home Owner wants the orchard to be a felt presence rather than a glimpse, this concept gives the least of it.

### 9 · Daylight and lighting

**One cool, even, low-contrast morning.** North-facing light: no beam, no visible sunbeam, no dust in the air. Shadows are long, soft and unmistakably directional to the lower right. The room's light is *sufficient and unremarkable* — you can read every shelf and nothing is dramatised.

**No artificial light exists.** `ASSET1`'s H1 pendant and H2 under-shelf lighting are refused here (§ 3.3) and this concept is the one that would suffer least from that, because a stone larder never had electric light.

**House-wide consequence:** a cool, low-contrast morning becomes the house's morning. That reads beautifully in a Larder and would need testing against Home's warmth.

### 10 · Materials and craftsmanship

Lime plaster (uneven, absorbent, chalky). Worn stone flags, irregular, with a visible wear path. Scrubbed pine, silvered with age, end-grain dark. Black wrought iron — brackets, hooks, the curtain rod. White marble, veined, cool. Coarse linen. Willow. Salt-glazed stoneware.

**Craftsmanship shows as age, not as finish.** The joints are visible and slightly loose; the pine has cupped; the flags are chipped at the door. This is the only concept where *wear is the primary craft signal*, and it is the hardest to fake — a *new* stone floor reads instantly as new, and would sink the concept.

### 11 · Hospitality

**Hospitality is behind the curtain, and it is generous.** The linen recess holds the hospitality store and the drinks — the good things, kept back, not on display. The concept's position: in an old house, hospitality is *the cellar and the cool larder*, not a display cabinet. A guest is welcomed with something **fetched**, and the fetching is part of the welcome.

Weakness of that position, stated: it puts `LARDER2`'s Wing D almost entirely behind cloth, so a household cannot see their own readiness to receive people by looking. That is a real cost against `LARDER5` § 15.2.

### 12 · Desktop composition

The whole cool volume in one view. The stone floor is generous — **it is the concept's air** — and as the window widens, the room gains **more floor and more lit plaster**, never more shelving. The back wall's four tiers sit centrally with wide breathing gaps; the marble slab and cold cupboard anchor the right; the deep window and pine table anchor the left. The composition is horizontally calm and vertically sparse.

### 13 · Mobile composition

Strong, because the room has **few, large, distinct pieces**: window and stone sill → pine table and the floor beneath it → the four pine tiers in two screenfuls → the marble slab → the cold cupboard door → the linen recess → the flags, and the willow basket on them. The plaster is continuous behind everything so the column never fragments. **It ends decisively on stone.**

Its mobile weakness is § 12's named hard problem: the shopping basket sits on the flags at the very bottom of the column, so on a phone it is furthest from the shelves the household is looking at.

### 14 · Interaction philosophy

***You handle provisions in a room that does not respond to you.*** The room is completely inert — no hover states on the architecture, no lifting shelves, no reactive surfaces. Only the **provisions** answer to touch. *Look* is almost everything; *open* is exactly three acts (the cold cupboard, the curtain, the spice rack is open); *reach* lifts a jar off its shelf into the hand.

The concept's distinctive interaction idea: **the tie-on tag is the affordance.** Reaching for a jar shows its tag more clearly; that is the whole of the feedback. Nothing glows.

### 15 · Why it supports drag-and-drop naturally

- **The floor is real and it is used.** Baskets and sacks already stand on it, so *carrying something down to the willow basket by the door* is a motion the room has already taught. In a room where nothing else touches the floor, a basket on the floor is an odd object; here it is one of several.
- **The doorway is a stone threshold** — a visibly different material at the near edge. *Out of the house* has a physical line to cross, which makes the removal gesture legible without any indicator.
- **Short, downward motions.** Both destinations are low and near, exactly as `LARDER5` § 15.4 requires.
- **The curtain is a forgiving destination.** Releasing something at the recess reads as *put it away*, not as *delete* — useful, because the least reversible-feeling gestures should be the deliberate ones.
- **And none of it is required** — every outcome is reachable by keyboard, screen reader, switch and plain tap (`LARDER1` § 10, cited).

### 16 · Assets already available

**Almost none, and none legitimately.** The 10 oak joinery masters are the wrong material and the wrong century; using them here would be exactly the substitution `CB4` forbids. The 27 glass jar masters are *closer* — the clamp-top form is right — but their **baked-in black scalloped chalkboard label** contradicts this concept's paper tie-on tags, so they would need relabelling at the master, not at runtime. The 2 produce masters (apple, broccoli) are material-neutral and usable.

**Honest total: 2 of ~40 objects this concept needs.**

### 17 · Assets still required

Shell: stone flag floor plate, lime plaster wall plates (three planes + splayed reveal), stone threshold, bounded-top lit band. Joinery: planked pine shelf (3 widths), iron brackets, pine table, pine spice rack, iron hooks, panelled cold-cupboard door (closed + open), marble cold slab on piers, linen curtain (drawn + open). Vessels: clamp-top glass in 3 sizes **without a baked label**, stoneware crocks (3), tin canisters (2), tins, bottles, paper sacks, willow baskets (3), the willow shopping basket. Cold interiors: fridge and freezer compartments. Materials: cool north morning light plate, wall shadow, ambient shadow. Produce: the full loose-produce set.

---

## 6. CONCEPT 2 — THE PAINTED PANTRY

### *The sensibility of a cabinetmaker: the room is the cabinetry, and the cabinetry is perfect.*

### 1 · Overall design philosophy

**One fitted run, floor to bounded top, in one soft painted colour, with the open bays cut into it.** This is the concept that takes `ASSET1`'s own named canonical style — *deVOL · Plain English · Neptune* — and executes it completely rather than partially: hand-painted timber joinery, in-frame doors, a single continuous piece of furniture that *is* the room's walls, with brass or unlacquered-bronze hardware and a stone worktop.

Its governing idea is **everything has a designed place, and the room is finished.** Nothing is freestanding, nothing is provisional, nothing was added later. The walls are barely visible because the cabinetry reaches them.

The design position it takes against the other four: **order is a form of hospitality.** A household should never have to decide where something goes, and a fitted room decides for them, once, permanently.

### 2 · Emotional feeling on entering

**Being competently looked after.** The specific pleasure of opening a well-made drawer. It is the *calmest* of the five and the most immediately recognisable as premium: the feeling of a kitchen somebody spent real money and real thought on, and then stopped fussing over.

It is also the concept most at risk of the emotional failure `EXPLANG1B` names — **luxury-for-luxury's-sake** — and its defence is entirely in the paint colour and the wear. A pristine painted room reads as a showroom; a painted room with a chipped door edge by the handle reads as a home.

### 3 · Front-on room composition

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │ ░░ painted cornice-less top rail — one soft colour — lit ░░░░░░░░░░░░░ │
  │  ┌────────┐  ┌──────────────────────────────────────┐  ┌────────────┐  │
  │  │▓ORCHARD│  │ ═══ open painted bay ═══ tins ══════  │  │ ▤ in-frame │  │
  │  │▓  tall ▓│  │ ═══ open painted bay ═══ jars ══════ │  │ ▤ painted  │  │
  │  │▓ painted│ │ ═══ open painted bay ═══ jars ══════  │  │ ▤ COLD     │  │
  │  │▓ reveal▓│  │ ═══ open painted bay ═══ dry goods ═ │  │ ▤ PAIR     │  │
  │  │▓▁▁▁▁▁▁▓│  ├──────────────┬───────────────────────┤  │ ▤ (matched │  │
  │  └─┬──────┘  │ ▤ in-frame   │ ═══ open bay ═════════│  │ ▤  doors)  │  │
  │  ▤▤│ painted │ ▤ doors      │ breakfast · tea       │  ├────────────┤  │
  │  ▤▤│ spice   │ ▤ (overflow) │═══════════════════════│  │ ▤ LARDER   │  │
  │  ▤▤┴▤▤▤▤▤▤▤  └──────────────┴───────────────────────┘  │ ▤ CUPBOARD │  │
  │  ▬▬ STONE WORKTOP ▬▬▬▬▬▬▬▬▬▬  ◟ painted plinth ◞       │ ▤ bi-fold  │  │
  │  ▤ deep  ▤ ▤ shallow ▤       ◟ produce drawer  ◞       │ ▤ (store)  │  │
  │  ▤ drawer▤ ▤ drawers ▤                                 │ ▤▤▤▤▤▤▤▤▤▤ │  │
  ├────────────────────────────────────────────────────────────────────────┤
  │ ╱╱ PALE LIMESTONE — one continuous ground, running under the plinth ╱╱ │
  │    ⌂ a painted timber shopping tray, by the door                       │
  └────────────────────────────────────────────────────────────────────────┘
     one warm-neutral morning from the upper left ↘ · soft, bounced off paint
```

### 4 · Furniture layout

A **single continuous fitted run** wrapping all three walls, articulated as:

- **Back wall (Wing A):** four **open painted bays** occupying the upper two-thirds — bays, not shelves: each has a painted back, painted sides, and a painted shelf, so an empty bay is a composed void rather than a bare plank. Below them, a run of in-frame doors (overflow dry store) and one further open bay for breakfast and tea.
- **Left return:** the tall window in a **painted reveal**; the **stone worktop** beneath and beyond it; deep and shallow **drawer banks** below the worktop; a painted **spice run** as a shallow open bay beside the window; oils in a narrow **pull-out** against the worktop.
- **Right return:** the cold pair behind **in-frame painted doors matched to the run**, and beneath/beside them the tall **larder cupboard** with a bi-fold door.
- **Everything stands on a painted plinth**, set back, so the run reads as furniture meeting a floor rather than as walls.

### 5 · Fridge, freezer, pantry and store-room treatment

- **Fridge and freezer: fully integrated and invisible.** Two in-frame painted doors, identical to their neighbours, distinguished only by their **hardware** (a longer pull) and their **position**. Opening reveals a cold, bright, plainly modern interior — the contrast between the painted door and the cold interior is the concept's most satisfying single moment, and it is honest.
- **Pantry / dry store:** the four open bays. This is the concept's chief virtue: an open bay with a painted back holds provisions *and* holds emptiness gracefully, which is exactly `LARDER2` § I.8's *composed emptiness* solved by joinery rather than by styling.
- **Store-room: the larder cupboard.** A tall bi-fold door which, opened, discloses internal shelves, a spice ladder on the door's inner face, and racks — the classic fitted larder cupboard. All of Wing D, E and F live inside it. **This is the concept's answer to density: the visible room stays serene because the cupboard is deep.**
- The **overflow doors** beneath the back wall's bays take Wing A's surplus, so the open bays never have to be crowded.

### 6 · Floating shelf design

**Reinterpreted rather than refused.** There are no floating planks — a cantilevered oak shelf against painted in-frame joinery would read as a foreign material and a foreign construction. Instead the concept's "shelf" is the **open painted bay**: a shelf with a back and two sides, integral to the run.

This is a genuine design gain and worth naming: a bay's painted back gives a jar a *ground to be seen against*, so a row of glass jars reads far more crisply than the same row on an open plank against plaster. It is the best jar-legibility of the five.

Its cost: the existing three oak floating-shelf masters are **unusable** here, and the concept loses the airiness a plank-on-plaster gives.

### 7 · Jar, tin and ingredient presentation

**One matched family, disciplined, calm.** A single clamp-top glass jar form in three sizes, in rows, spaced evenly, aligned. Tins stacked squarely in their own bay. Bottles standing in the pull-out. Packets and boxes behind the in-frame doors — **out of sight**, which is this concept's licence to keep the visible room composed.

- **Labels: small ceramic or enamel plates, clipped to the jar's clasp**, hand-lettered. Not painted on the glass, not a sticker. The plate is a *made object* and it matches the room's construction logic.
- The rhythm is the point: **matched jars at their own honest levels** is `LARDER2` § I.5-A2's own image (*"a row of matched jars, each holding a different staple at its own honest level"*, cited), and this concept realises it most literally of the five.

### 8 · Orchard relationship

**A tall window in a painted reveal, and the orchard is bright.** The reveal is the joinery's own thickness, painted the same colour as the run, so the orchard is framed by the room's material rather than by a moulding — satisfying Blueprint § 6.2 rule 4's reveal-not-frame test (cited). Against pale paint the orchard's green reads at its most saturated of the five.

The concept's spatial trick: the painted sill is deep, and it is the *only* horizontal surface in the room that is not the worktop, so it is where the household's own herbs and the produce baskets sit — in the light, as `LARDER2` § I.5-C1 requires.

### 9 · Daylight and lighting

**A warm-neutral morning, softly bounced.** Pale paint returns light into the room, so this is the **brightest and most evenly lit** of the five, with the gentlest shadows. There is no beam and no drama; the light's direction is read from the soft gradient across the painted run and the shadow beneath each bay's shelf.

**No artificial light** (§ 3.3). This concept feels that refusal most keenly — a fitted painted larder in real life almost always has under-bay lighting, and its absence must be compensated by the bounced daylight being genuinely generous.

**House-wide consequence:** a bright, soft, warm-neutral morning becomes the house's. This is the most *portable* of the five light qualities and the least likely to fight another room.

### 10 · Materials and craftsmanship

Hand-painted tulipwood or oak-carcassed timber in one soft, muted colour (a warm off-white, a pale clay, a soft sage — the specific value is the UI Architecture's and the Home Owner's, not this document's). Honed pale limestone worktop. Unlacquered bronze or aged brass hardware. Painted interiors. Pale limestone floor. Linen. Ceramic label plates.

**Craftsmanship shows as precision:** in-frame doors with consistent shadow gaps, a scribed plinth, mitred bay returns, hardware that lines up. And crucially, **wear at the touch points** — the paint thinned around each handle, the worktop's edge slightly dulled. Precision without wear is a showroom.

### 11 · Hospitality

**Hospitality is the larder cupboard, opened.** The concept's hospitality gesture is a *door swung wide to reveal abundance* — the bi-fold cupboard opening onto the hospitality store, the drinks, the good things, all racked and visible at once. It is theatrical in the best sense and it is genuinely how a fitted larder cupboard behaves.

Its position: **readiness kept behind a door you are proud to open.** This is stronger than Concept 1's curtain, because opening it is one deliberate act that reveals *everything* at once rather than a rummage.

### 12 · Desktop composition

The most *architecturally resolved* of the five at wide widths, because a fitted run genuinely continues: as the window widens, the run gains **more painted wall and a wider aperture**, and the plinth line runs further — the room grows the way a real fitted room grows, without gaining content. The bays' rhythm across the back wall is the composition's spine, and it stays legible at any width.

### 13 · Mobile composition

Good, and slightly at risk. The run transposes cleanly into a vertical column: window and worktop → drawer banks → the four bays → breakfast and tea → the cold doors → the larder cupboard → the plinth and floor. Each bay is a self-contained composition with its own painted frame, which suits a narrow field of view unusually well.

The risk: **four stacked bays of matched jars can read as four rows of a list** on a phone, because a bay *is* a rectangle. The defence is that the bays are visibly joinery — with a plinth, a frame, hardware and a floor — and the discipline required to keep that true on a 390 px column is this concept's principal engineering danger.

### 14 · Interaction philosophy

***You open things, and they are beautifully made.*** This is the most *open*-weighted of the five: the cold pair, the larder cupboard, the overflow doors, the drawers, the pull-out — five classes of enclosure, each behaving as its real mechanism does (a door swings, a drawer slides toward you and shows its contents from above, a bi-fold folds, a pull-out comes out).

Its distinctive idea: **the mechanism is the pleasure.** `LARDER3`'s Object Constitution is honoured most fully here, because there are more real mechanisms to honour.

Its distinctive risk: it is the concept furthest from § 15.2's *"the majority of the room is answered by look"*, and the balance has to be watched. The four open bays plus the spice run plus the sill must carry enough of the household's provisions that opening is a pleasure rather than a requirement.

### 15 · Why it supports drag-and-drop naturally

- **Every destination is a real fitting.** The painted shopping tray by the door, the doorway itself, and the bay a jar came from are all constructed objects with edges, shadows and a plinth — nothing is an abstract rectangle.
- **The bay is a superb *return* destination.** Because each bay is enclosed on three sides, dropping a jar anywhere in its bay unambiguously means *put it back here* — the forgiving return of `LARDER3` M4 (cited) becomes geometrically obvious rather than a rule.
- **The plinth line reads as the floor's edge**, so downward motion toward the tray is naturally bounded — you cannot drop something "into" the floor.
- **The doorway is a painted jamb** at the near edge: a clear, made threshold.
- **And none of it is required.** Every outcome has a non-drag equivalent.

### 16 · Assets already available

**Effectively none.** All 10 joinery masters are **raw oak**; this concept is painted in-frame joinery, and using an oak cupboard master in a painted run is the visible-substitution failure `CB4` forbids — it would read as one wrong cupboard in a good room, which is worse than a missing one. The 27 jar masters are the **right form** and the **wrong label** (black chalkboard vs ceramic plate). Produce masters are usable.

**Honest total: 2 of ~45 objects.** This is the most expensive concept in new assets and the assessment should say so plainly.

### 17 · Assets still required

Shell: pale limestone floor, painted wall/return plates, painted reveal, painted plinth, bounded top rail. Joinery (all painted, in-frame): open bay (4 widths), in-frame door (single/double), drawer bank (deep/shallow), bi-fold larder cupboard (closed/open, with door-face racking), pull-out bottle run, painted spice run, stone worktop, painted shopping tray, bronze hardware set. Cold: two matched in-frame doors + two cold interiors. Vessels: clamp-top glass ×3 sizes **unlabelled**, ceramic label plates, tins, bottles, cartons, boxes, packets, baskets. Materials: warm-neutral bounced morning, bay shadow, ambient shadow. Produce: the full set.

---

## 7. CONCEPT 3 — THE ORCHARD WORKROOM

### *The sensibility of a farmhouse naturalist: the first room in from the orchard, where the harvest lands.*

### 1 · Overall design philosophy

**The larder is half outdoors.** It is the room between the orchard and the kitchen — where baskets come in, where produce is sorted, where things are hung to dry. Warm oak, raw plaster, terracotta, linen, willow, and the household's own produce in quantity. This is the most **abundant** and most **alive** of the five, and it is the closest in feeling to the approved North Star.

Its governing idea is **provisioning is a happy, physical, seasonal activity, and the room should look like it.** Where Concept 2 hides packaging to stay serene, this concept shows nearly everything and finds its calm in warmth rather than in order.

The design position it takes against the other four: **generosity beats restraint.** A larder should look like a household that eats well.

### 2 · Emotional feeling on entering

**Warmth, plenty, and welcome — the feeling the North Star actually produces.** Sunlight, colour in the produce, the smell of oak and onions. It is the only one of the five that would make a visitor say *"oh, this is lovely"* out loud, and the only one whose first emotion is **pleasure** rather than calm or reverence.

Against `EXPLANG1B` (cited): it hits **warm · comforting · energised · curious** most directly, and it is the concept least at risk of **cold · clinical · empty · sterile.** Its risk is the opposite one — **busy**, which the palette does not name but **GEA2** does: *a more capable THA is a quieter THA.*

### 3 · Front-on room composition

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │ ░░ warm raw plaster ░░ ── bounded top, lit, no ceiling ── ░░░░░░░░░░░░ │
  │  ┌─────────┐ ══════════════════════════════════════   ┌─────────────┐  │
  │  │▓▓▓▓▓▓▓▓▓│ ▬▬ FLOATING OAK SHELF (upper) ▬▬▬▬▬▬     │ ▬ open oak  │  │
  │  │▓ ORCHARD│ baskets · crocks · terracotta            │ ▬ dresser   │  │
  │  │▓  tall  │ ══════════════════════════════════════   │ ▬ top       │  │
  │  │▓  near- │ ▬▬ FLOATING OAK SHELF (eye height) ▬▬    │ ═══════════ │  │
  │  │▓  full  │ glass clamp-tops, slate plates           │ ┃ CREAM      │  │
  │  │▓  height│ ══════════════════════════════════════   │ ┃ COLD       │  │
  │  │▓  herbs │ ▬▬ FLOATING OAK SHELF (lower) ▬▬▬▬▬      │ ┃ CUPBOARD   │  │
  │  │▓  on    │ tins · bottles · preserves               │ ┃ (fridge)   │  │
  │  │▓  sill  │ ══════════════════════════════════════   │ ┗━━━━━━━━━━━ │  │
  │  │▓▁▁▁▁▁▁▁▓│  ⌐ hooks · linen · drying herbs ¬        │ ▭ chest      │  │
  │  └──┬──────┘  ┌────────────────────────────┐          │ ▭ freezer    │  │
  │  ▬▬▬┴ OAK WORKTOP ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬               ├──────────────┤  │
  │  ▤ oak drawers ▤    ◟ willow baskets, produce ◞       │ ⌇ LINEN     │  │
  │  ▤▤▤▤▤▤▤▤▤▤▤▤▤▤     ◟ terracotta crocks       ◞       │ ⌇ CURTAIN   │  │
  ├────────────────────────────────────────────────────────────────────────┤
  │ ╱╱ WIDE OAK BOARDS — one continuous warm ground ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱ │
  │    ⌂ a large willow harvest basket, by the door                        │
  └────────────────────────────────────────────────────────────────────────┘
     one warm gold raking morning from the upper left ↘ · high contrast · dust in the beam
```

### 4 · Furniture layout

- **Back wall (Wing A):** **three long unbracketed floating oak shelves** running the full width — the concept's signature. Thick, chunky, with visible end grain, appearing to grow out of the plaster. Upper tier: baskets, crocks, terracotta, the rarely reached. Eye height: the glass jars. Lower: tins, bottles, preserves. Hooks in the wall between the upper shelf and the bounded top, for linen and drying herbs.
- **Left return:** a **near-full-height window** with a low sill, herbs on it; a generous **oak worktop** running beneath and beyond it; oak drawers below; willow baskets and terracotta crocks standing on the floor in the light; a small oak spice rack on the wall.
- **Right return:** an **open oak dresser top** above, a **freestanding cream cold cupboard** (the fridge) beside it, a **chest freezer** low beneath the return, and a **linen-curtained recess** for the store.
- **The floor is used.** Baskets, crocks and sacks stand on it, as in Concept 1 — but here the floor is warm oak boards, so standing things on it reads as abundance rather than as thrift.

### 5 · Fridge, freezer, pantry and store-room treatment

**The most honest and least concealed treatment of the five.**

- **Fridge: a freestanding cream-panelled cold cupboard.** Visibly an appliance, visibly a nice one, standing on the floor with a shadow beneath it. Not integrated, not hidden, not pretending to be joinery. The concept's argument: a farmhouse larder *has* a fridge standing in it, and hiding it would be the first dishonest thing in an honest room.
- **Freezer: a chest freezer, low, beneath the right return**, with a lid that opens upward — which is genuinely the right form for `LARDER2` § I.5-C3's *"the deep reserve … organised by drawer and compartment"* read literally: you look **down** into a chest freezer and see everything at once, which is a better match to *availability by looking* than a stack of drawers.
- **Pantry / dry store:** three open floating shelves. **Nothing at all is hidden on the back wall** — the most `look`-weighted concept of the five, and therefore the strongest against `LARDER5` § 15.2.
- **Store-room: a linen-curtained recess** in the right return, holding Wings D, E and F. Curtain rather than door, for the same reason as Concept 1 but with a warm linen rather than a coarse one.

### 6 · Floating shelf design

**The concept's defining element, and the one place the existing asset library is natively correct.**

Three thick oak planks, **unbracketed**, apparently let into the plaster. Deep enough to stand a large jar with room behind it; long enough to run wall to wall without a break, so the eye reads *one shelf* rather than *a set of shelves*. Square-edged with a slight arris; end grain visible at both ends; the underside catching a soft reflected bounce from the shelf below.

Why unbracketed matters here: brackets would divide each shelf into bays, and this concept's whole rhythm depends on **long uninterrupted horizontals** that carry the eye across the room. It is the exact opposite of Concept 2's bay logic, and the two cannot be blended.

### 7 · Jar, tin and ingredient presentation

**Layered by height, mixed by material, abundant.**

- **Eye height: matched glass clamp-tops**, the availability language, at the best-lit level in the room.
- **Above: terracotta, stoneware crocks, willow baskets, ceramic bowls** — opaque, read by presence, and providing the colour and texture contrast the concept lives on.
- **Below: tins, standing bottles, preserve jars** — the shelf a household actually rummages in.
- **On the floor and worktop: loose produce in willow baskets**, in quantity — onions, garlic, squash, citrus, apples.
- **Labels: chalk on a small slate plate**, hung or leaned against the jar. This is the labelling the existing 27 jar masters already carry — a **black scalloped chalkboard baked into the glass face** — which makes this the **only** concept whose existing jar masters are usable as they stand.

**One honesty note that matters.** This concept's abundance is the *household's data*, not the room's. A household who keeps twelve things will see three long shelves holding twelve things. The concept must therefore be judged on how it looks **sparse**, not on how it looks full — and § 2's refusal of Environmental Dressing means the room may not add a single basket to help. This is the concept's most serious risk and dimension 9's raking light is its main defence.

### 8 · Orchard relationship

**The largest orchard presence of the five, and the most integrated.** A near-full-height window in the left return with a sill low enough that the room's floor line and the orchard's ground line very nearly meet — so the orchard reads as *continuous with the room* rather than as a view from inside it. Herbs in terracotta pots on the sill (conditional on § 3.3's H4 ruling). The reveal is the plaster's own thickness, splayed.

This is the concept where the room's name is earned: it genuinely is *the orchard workroom*, and the orchard is a participant rather than a picture. It is also the concept that leans hardest on Blueprint § 6.2's E2 ceiling — and if the Home Owner reads it as exceeding *"the smallest window"*, the correct response is to shrink the aperture, not to relocate it.

### 9 · Daylight and lighting

**One warm gold raking morning, high contrast, with dust in the beam.** The most dramatic light of the five: a defined shaft entering the tall window, striking the oak worktop, and washing across the plaster onto the back wall's shelves. Deep warm shadows under each floating shelf. Rim light on the jars at eye height.

**This is the concept's greatest asset and its greatest liability.** It is what makes the North Star's image feel the way it does. It is also the light quality that most easily becomes **theatrical** — and `LARDER5` § 5.3 refuses *"never a stage — no vignette, no spotlight, no darkened surround."* The line between *a real raking morning* and *a lit set* is thin, and a concept that crosses it fails a governing rule rather than a taste test.

**House-wide consequence, and it is the largest of the five:** a high-contrast golden morning becomes **every room's** morning. Home, Planner, Cookbook and Shopping would all have to carry it. That is a very significant commitment and it should be made deliberately, at the Blueprint's level, not inherited from a Larder decision.

### 10 · Materials and craftsmanship

Warm European oak (worktop, shelves, drawers, dresser) with visible medullary flecking and a soft oiled sheen. Raw warm plaster, softly troweled. Wide oak floorboards with a wear path. Terracotta. Salt-glazed stoneware. Willow. Linen. Slate. Cream-painted steel (the cold cupboard). Aged iron hooks.

**Craftsmanship shows as material honesty and use:** oil-darkened worktop around the chopping area, a shelf edge softened by hands, oak that has moved slightly. This is the most forgiving concept to execute, because warmth and abundance conceal small imperfections that Concept 2's precision would expose.

### 11 · Hospitality

**The strongest hospitality feeling of the five, and it is architectural rather than stored.** The room *itself* is the welcome: it is warm, it is full, it smells of food, and its worktop is a surface a guest would naturally stand at with a cup of tea. Wing D's store is behind the linen, but hospitality here is not really the store — it is that **the whole room reads as a household that feeds people.**

This is the concept that best expresses **GEA1** (hospitality before productivity) and `CRAFT1`'s *"would I happily spend time here?"* — and if that single question is the Quality Standard, this concept currently answers it best of the five.

### 12 · Desktop composition

The most immediately impressive, and the one that most needs discipline. As width increases, the three long shelves lengthen and the room gains **more oak floor and more lit plaster** — but the temptation to fill the lengthened shelves is enormous, and **GEA11** forbids it: surplus width becomes *air and light*, never more furniture and never more content. Every additional inch of shelf must stay empty unless the household keeps more.

### 13 · Mobile composition

Weakest of the five, and honestly so. Three full-width shelves plus a tall window plus a worktop plus baskets on the floor plus a cold cupboard plus a chest freezer plus a curtained recess is a **long** column, and the high-contrast light that makes the desktop composition sing makes a narrow column feel dark in its lower half. The floor arrives a long way down, which risks a room that is scrolled rather than finished (**RC12**).

Its saving grace: the three horizontal shelves transpose naturally into three distinct screenfuls, each with plaster behind and a shelf beneath, which satisfies `LARDER5` § 12's *"at least one complete piece of furniture always in view."*

### 14 · Interaction philosophy

***You handle food, and the room is generous about it.*** *Look* dominates — almost nothing on the back wall is enclosed. *Open* is four acts (cold cupboard, chest freezer lid, drawers, curtain). *Reach* lifts a jar, takes a tin, or **picks a single item out of a basket** — the last being distinctive: this is the only concept where reaching into a basket for one onion is a natural gesture, because the baskets are open, at hand, and full.

Its distinctive idea: **the basket is a first-class container**, not a decorative holder. Loose produce is reached individually.

### 15 · Why it supports drag-and-drop naturally

**The strongest drag affordance of the five, for four reasons:**

- **The room is already full of things standing on other things.** Baskets on the floor, crocks on shelves, produce in baskets — the room's entire visual logic is *objects resting on surfaces*, which is precisely what makes picking one up and putting it somewhere else feel like the room's native verb rather than an interface gesture.
- **The harvest basket by the door is the largest, most obvious destination in any of the five.** A big willow basket on a warm oak floor at the household's feet, in the same material family as the baskets already on the shelves — you would try to put something in it without being told.
- **Long unbracketed shelves are forgiving.** There are no bays and no compartments, so releasing a jar anywhere along its shelf reads as *back on the shelf* — the most generous possible reading of `LARDER3` M4's forgiving return.
- **The doorway is an oak threshold onto a darker floor**, so *out of the house* is legible as a material change at the near edge.
- **And none of it is required** — every outcome has a keyboard, screen-reader, switch and tap equivalent.

### 16 · Assets already available

**By far the most, and — importantly — legitimately, because this concept was designed in oak before the library was consulted.**

- **3 floating oak shelves** (short/medium/wide) — natively correct: the concept's signature element, in the right material, front-on, transparent.
- **1 floating oak spice rack** — correct.
- **2 oak drawer units** (deep/shallow) — correct.
- **1 oak preparation table + 1 oak side worktable** — usable as the worktop and dresser base.
- **2 oak cupboards** (single/double) — usable for the enclosed runs.
- **27 clamp-top glass jar masters with a slate/chalkboard label** — **the only concept where these are correct as they stand**, because it is the only concept whose labelling position is chalk on slate.
- **2 produce masters** (apple, broccoli).

**Honest total: ~36 of ~42 objects have a candidate master.** No master is *approved* — all 27 jars and the joinery remain `candidate` with `visualApproval: null`, and `LARDER5`'s § 17 items and the Home Owner's review are still outstanding.

**The reuse is legitimate and not convenient.** The test applied was `CB4`'s: would this asset be chosen if the library were empty? For the oak shelves, drawers, spice rack, worktables and chalk-labelled glass jars in an oak farmhouse workroom, the answer is yes.

### 17 · Assets still required

Shell: **oak board floor plate, warm plaster wall plates (three planes + splayed reveal), oak threshold, bounded-top lit band** — the whole shell, which does not exist for any concept. Aperture: tall window frame, glazing, and the **orchard view plate** at E2. Objects: terracotta crocks and pots, stoneware, willow baskets (produce/onion/garlic/harvest/shopping), tins, standing bottles, preserve jars, cartons, boxes, packets, linen cloth, iron hooks, slate plates as **separate** objects (for shelf-edge use), cream cold cupboard (closed/open), chest freezer (closed/open), linen curtain (drawn/open), oak dresser top. Materials: **the warm gold raking morning light plate, the beam, shelf shadows, ambient shadow.** Produce: the full loose set (~20 items) — 2 of ~20 exist.

---

## 8. CONCEPT 4 — THE GLASS DRY STORE

### *The sensibility of a modernist: read the room through glass; hide nothing, show nothing loudly.*

### 1 · Overall design philosophy

**"A modern home in an ancient orchard"** (`EXPBLUE2` § 1.4, cited) taken at its word — and this concept is the *modern home* half, executed without apology. One continuous frameless run in a pale, quiet material, fronted almost entirely in **glass**: clear glass over the dry store, **reeded (fluted) glass** over everything that would otherwise be enclosed.

Its governing idea is **translucency instead of concealment.** `LARDER5` § 9.3 says *a room can hold more by showing less*; this concept proposes a third state between showing and hiding — **showing softly.** Behind reeded glass a household can see *that there are bottles*, *that the shelf is stocked*, *roughly how much*, without the visual noise of forty legible labels. Almost nothing in the room is truly out of sight, and almost nothing is loud.

The design position it takes against the other four: **the quietest room wins.** This is the only concept designed primarily against **GEA2** — *a more capable THA is a quieter THA* — rather than against warmth, order, history or restraint.

### 2 · Emotional feeling on entering

**Clarity.** A held breath. The specific calm of a room where every plane is continuous and nothing is competing. It is not cold — the material palette is warm-pale, not white, and the oak-toned interior surfaces glow through the glass — but it is the **least historical** and the **least domestic-by-default** of the five, and it knows it.

Against `EXPLANG1B`: it aims at **calm · thoughtful · decisive** and must actively work against **clinical · sterile · emotionally distant.** Its defences are the reeded glass (which is soft and imperfect, never plate) and the warm interior glow behind it.

### 3 · Front-on room composition

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │ ░░ one continuous pale plane ░░ ── bounded top, lit ── ░░░░░░░░░░░░░░░ │
  │  ┌────────┐ ┌───────────────────────────────────────┐ ┌──────────────┐ │
  │  │▓▓▓▓▓▓▓▓│ │░░░░░ CLEAR GLASS SLIDING FRONT ░░░░░░│ │▒▒▒▒▒▒▒▒▒▒▒▒▒▒│ │
  │  │▓ORCHARD│ │  ─── tins ────────────────────────    │ │▒ REEDED ▒▒▒▒▒│ │
  │  │▓ full- │ │  ─── jars ────────────────────────    │ │▒ GLASS  ▒▒▒▒▒│ │
  │  │▓height │ │  ─── jars ────────────────────────    │ │▒ COLD   ▒▒▒▒▒│ │
  │  │▓ slot  │ │  ─── dry goods ───────────────────    │ │▒ PAIR   ▒▒▒▒▒│ │
  │  │▓ razor │ │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │▒ (silhouette)│ │
  │  │▓ thin  │ ├───────────────────────────────────────┤ │▒▒▒▒▒▒▒▒▒▒▒▒▒▒│ │
  │  │▓ reveal│ │▒▒ REEDED SLIDING PANELS ▒▒▒▒▒▒▒▒▒▒▒▒▒▒│ ├──────────────┤ │
  │  │▓▁▁▁▁▁▁▓│ │▒▒ breakfast · tea · overflow ▒▒▒▒▒▒▒▒▒│ │▒ REEDED     ▒│ │
  │  └─┬──────┘ └───────────────────────────────────────┘ │▒ STORE RUN  ▒│ │
  │  ▒▒│reeded  ▬▬ PALE STONE WORKTOP, one slab ▬▬▬▬▬▬    │▒ (sliding)  ▒│ │
  │  ▒▒│spice   ┌─────────────────────────────────────┐   │▒▒▒▒▒▒▒▒▒▒▒▒▒│ │
  │  ▒▒┴▒▒▒▒▒▒  │▒▒ reeded drawer fronts ▒▒▒▒▒▒▒▒▒▒▒▒▒│   └──────────────┘ │
  ├────────────────────────────────────────────────────────────────────────┤
  │ ╱╱ PALE SEAMLESS FLOOR — one continuous ground, shadow gap at the base ╱│
  │    ⌂ a shallow pale-stone tray, recessed at the door                   │
  └────────────────────────────────────────────────────────────────────────┘
     one neutral morning from the upper left ↘ · diffused by the reeded glass
```

### 4 · Furniture layout

A **single continuous frameless run**, wall to wall to wall, with no visible carcass, no plinth (a **shadow gap** at the floor instead), and no hardware — sliding fronts are moved by a routed finger recess.

- **Back wall (Wing A):** four tiers behind **clear glass sliding fronts** in two leaves. Fully legible. Interiors are a warm pale tone so the provisions read against them.
- **Left return:** a **full-height glazed slot** (the aperture) with a razor-thin reveal; a single **pale stone worktop slab** beneath; **reeded drawer fronts** below; a **reeded spice run** beside the window; oils behind a reeded panel.
- **Right return:** the cold pair behind **full-height reeded glass doors** — contents legible as *silhouette and mass*; below and beside, the **reeded store run** on sliding panels.
- **Nothing stands on the floor.** The floor is empty and continuous — this is the only concept where the floor is purely a plane, and its emptiness is the concept's air.

### 5 · Fridge, freezer, pantry and store-room treatment

**Its radical move: the cold pair is translucent.**

- **Fridge and freezer behind full-height reeded glass.** From the station point you see soft vertical bands of colour and mass — *there is milk in the door, the shelves are stocked, there is a lot in the freezer* — with no legible labels and no clutter. Opened, the door reveals a sharp, cold, precisely-lit interior. The concept's argument is genuinely interesting: **a reeded cold door lets a household read their fridge without opening it**, which no other concept can offer and which is the purest expression of *availability by looking* in this investigation.
- **Its counter-argument, equally real:** reeded glass makes **fullness harder to read precisely**, and fullness is the room's primary availability language (`LARDER2` § I.8, cited). The concept trades *precision* for *calm*, and whether that trade is acceptable is a Home Owner judgement, not an engineering one.
- **Pantry / dry store:** clear glass. Fully readable, protected from visual noise by being *behind* a plane rather than by being hidden.
- **Store-room:** the reeded run on the right return. Wings D, E, F. Legible as mass, not as items.

### 6 · Floating shelf design

**Explicitly refused.** In a room whose whole idea is continuous planes, a cantilevered plank is a discontinuity. Every shelf here is an **internal shelf behind a front** — it has no visible edge to the room at all. The existing three oak floating-shelf masters are unusable, and using them would destroy the concept's single organising idea.

### 7 · Jar, tin and ingredient presentation

**Uniform to the point of severity, and the most radical labelling position of the five.**

- One jar form, one glass, one lid, three heights. Borosilicate-clean. No clasp ornament.
- Tins in a single stacked block. Bottles in a single row. Everything aligned to the shelf's front edge.
- **No label plates, no tags, no chalk, no printing — anywhere.** The concept's position: **position is the label.** *The cumin is where the cumin lives* (`LARDER2` § I.5-A5, cited) is taken as sufficient, and the household's own word for a provision appears only on **reach**, as a quiet mark on the shelf edge beneath it.

**This position has a governing problem and it must be stated, not glossed.** `LARDER1` § 10 requires the room to be readable **without relying on colour or fullness alone**, and `LARDER5`'s accessibility floor inherits it. A room with no visible labels, read through reeded glass, where the only textual cue appears on interaction, risks failing that floor for a household who cannot distinguish white rice from white pasta by silhouette. **The concept is not viable without a governed alternative** — a permanent shelf-edge word, or an always-visible mark — and designing that alternative is an unresolved item, recorded in § 15 as an Architecture Gap rather than waved through.

### 8 · Orchard relationship

**A full-height glazed slot, and the orchard as a bright vertical column.** The reveal is razor-thin — the wall's edge, not its thickness — so the orchard is not framed at all; it simply *is* the left edge of the room, floor to bounded top. The most abstract orchard treatment of the five, and arguably the most beautiful: a tall band of moving green light beside a still, pale room.

It satisfies Blueprint § 6.2 rule 4's reveal test only just, and deserves an explicit check: a razor-thin reveal is *the wall turning*, not a frame hung on it — but it is close enough to a frame that the Home Owner should look at it specifically.

### 9 · Daylight and lighting

**One neutral morning, heavily diffused.** Light enters the slot, is broken and softened by every reeded surface it touches, and fills the room almost shadowlessly — with exactly **one crisp edge** where the direct light meets the worktop. The lowest-contrast light of the five.

**Its honesty risk is the inverse of Concept 3's.** Concept 3 risks theatricality; this concept risks **shadowlessness**, and `LARDER5` § 5.1's floor exists so *nothing floats*. In an almost shadowless room, the shadow gap at the base of the run and the single crisp worktop edge are carrying the entire weight of *this room is real*. They must be exact.

**House-wide consequence:** a neutral, diffuse morning becomes the house's. Portable and safe — but it would remove the warm gold the North Star's atmosphere depends on from **every** room, which is a much larger decision than this room.

### 10 · Materials and craftsmanship

Reeded and clear glass. Pale micro-cement or honed limestone (floor, worktop, planes). Warm pale interior linings. Blackened or bronze-anodised slimline framing where glass must be held. Nothing else. **Five materials, total** — against Concept 3's eleven.

**Craftsmanship shows as tolerance:** the shadow gap consistent to a hair, the sliding fronts running true, the glass edges polished, the reeded pitch identical everywhere, the worktop a single uninterrupted slab. There is nowhere to hide: this is the concept where a 1 px inconsistency is *visible*, and it is therefore the least forgiving of the five to build well.

**And the honest reservation:** `ASSET1`'s feeling standard requires every asset to feel *hand crafted · lived in · domestic — made for a home, not a shop or a museum.* Glass, micro-cement and precision tolerance run *toward* the shop and the museum. This concept must earn *domestic* against its own material palette, and the only tools it has are the warm interior glow, the reeded glass's softness, and the household's own provisions.

### 11 · Hospitality

**The weakest hospitality of the five, and the concept should own that.** A room with no visible timber, no basket, no cloth and no wear is not what most people mean by *welcoming*. Its hospitality argument is a different one: **it is restful**, and rest is a form of welcome — a room that asks nothing of you. Wing D lives behind reeded glass, readable as mass, retrievable in one slide.

If the Home Owner's test is `CRAFT1` § 8's *"would I happily spend time here?"*, this concept is the one most likely to be answered *"I would happily look at it."* That is not the same answer.

### 12 · Desktop composition

Superb at large widths, and the best of the five at *very* large widths. Continuous planes extend indefinitely without gaining content: extra width becomes **more pale plane, more floor, and a wider glazed slot**, which is `GEA11` satisfied almost automatically. There is no rhythm to break and no bay to leave awkwardly half-empty.

### 13 · Mobile composition

Good, with one specific hazard. The run transposes to a clean vertical column of alternating clear and reeded bands: slot and worktop → drawers → clear dry store (2–3 screenfuls) → breakfast/tea → cold pair → store run → floor. Continuity is automatic because every element shares one plane.

**The hazard:** a column of full-width horizontal bands, each containing a row of similar objects, is *visually indistinguishable from a list* on a 390 px screen. Concept 2 has this risk and can answer it with joinery, hardware and a plinth. This concept has removed all three. **It is the concept most likely to become a list on a phone**, and the discipline needed to prevent that is its principal engineering danger.

### 14 · Interaction philosophy

***You slide, and you read through.*** *Look* is answered *through glass* — a genuinely novel third state between the canon's open and enclosed. *Open* is a single gesture repeated everywhere: **slide**. Every enclosure in the room slides, so there is exactly one mechanism to learn (against Concept 2's five). *Reach* lifts a jar once the front is open.

Its distinctive idea: **one mechanism, everywhere.** This is the most learnable room of the five and the least tactilely various.

### 15 · Why it supports drag-and-drop naturally

**The weakest drag support of the five, and this is a structural consequence rather than an oversight.**

- **A sliding front must be opened before anything can be reached**, so most drags begin with a preceding act. In the other four concepts the dry store is directly reachable.
- **The floor is empty by design**, so a tray sitting on it is the only object on the room's largest plane — conspicuous, but foreign. A **recessed** pale-stone tray at the door (as specified) is the concept's answer: recessing it makes it part of the plane rather than an object on it.
- **Where it is genuinely strong:** the shadow gap at the base of the run is a precise, visible line that reads as *the boundary of the room's furniture* — an unusually clear cue for *this is where the room ends and the floor begins*, which makes the downward motion toward the tray legible.
- **The doorway is a change of plane**, which is subtle. *Out of the house* is the least physically legible of the five, and would lean hardest on the non-drag equivalent.
- **And none of it is required** — which matters more here than anywhere: this is the concept where the **tap route is likely to be the primary route**, and the drag route the enhancement.

### 16 · Assets already available

**None usable.** All 10 joinery masters are oak with visible edges, brackets and carcasses — the opposite of this concept's frameless planes. The 27 jar masters have a **clamp-top with a silver bail and a black scalloped chalkboard label**; this concept requires a plain lid and no label, so they are the wrong object, not merely the wrong finish. The 2 produce masters are usable.

**Honest total: 2 of ~30 objects.** It needs the fewest objects of the five (its severity is economical) and can reuse almost nothing.

### 17 · Assets still required

Shell: pale seamless floor plate, three pale plane wall surfaces, razor-thin reveal, shadow-gap detail, bounded-top lit band. Fronts: clear glass sliding leaf (2 widths), reeded glass panel (4 widths), reeded drawer front (2), reeded cold door (2 heights), reeded spice run, finger-recess detail. Interiors: warm pale lining plates, cold interiors ×2. Vessels: plain-lid glass jar ×3 heights **unlabelled**, tins, bottles, cartons, boxes, packets. Fittings: recessed pale-stone tray, single-slab worktop. Materials: neutral diffuse morning, the one crisp worktop edge, the shadow gap, ambient shadow. **Plus the unresolved accessibility alternative to labels (§ 7).**

---

## 9. CONCEPT 5 — THE HOUSEHOLD WALL

### *The sensibility of a restrained editor: the room's power is how little is in it.*

### 1 · Overall design philosophy

**Three shelves, one worktop, one basket, three doors, and a great deal of air.** This concept takes **GEA11** (*surplus space becomes air and view*) and `CRAFT1` § 6 (*delete before adding*) to their conclusion: a larder whose visible content is deliberately, radically limited, with all density displaced into a deep store-room behind a flush door.

Its governing idea is **a larder should reduce what a household carries, and a full room does not do that.** The other four concepts show a household's provisions; this one shows a household's provisions *edited* — the things they reach for weekly, grouped as they think of them, with visible gaps between groups.

The design position it takes against the other four: **less is not a style here, it is the function.** The room's job is to answer *"are we provisioned?"* in one look, and fewer objects answer it faster.

### 2 · Emotional feeling on entering

**Relief.** The only one of the five whose first emotion is the *absence* of a demand. Not abundance, not order, not reverence, not clarity — **quiet**. The feeling of a room where nothing needs doing.

Against `EXPLANG1B`: it aims at **calm · reassuring · quietly memorable**, and its risk is precisely the one `EXPLANG1B` § 3A names as a counterfeit — **empty**, and *calm becoming lifeless*. It has one defence and it is the light (dimension 9): a wide, low wash across a warm worktop with a bowl of the household's own fruit in it. Take that away and the concept dies.

### 3 · Front-on room composition

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │ ░░░░ warm lit plaster — the upper wall is quiet and almost empty ░░░░░ │
  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
  │              ▬▬▬▬ OAK SHELF (upper) ▬▬▬▬▬▬▬▬▬▬▬▬▬▬                    │
  │              tins · the hospitality few                                │
  │                                                          ┌───────────┐ │
  │              ▬▬▬▬ OAK SHELF (middle) ▬▬▬▬▬▬▬▬▬▬▬▬▬       │ ▢ flush   │ │
  │              jars ·· gap ·· jars ·· gap ·· jars          │ ▢ door    │ │
  │              ┌shelf-edge words─────────────────┐         │ ▢ (cold)  │ │
  │              ▬▬▬▬ OAK SHELF (lower) ▬▬▬▬▬▬▬▬▬▬▬▬▬        ├───────────┤ │
  │  ┌──────────┐ bottles ·· gap ·· preserves                │ ▢ flush   │ │
  │  │▓▓▓▓▓▓▓▓▓▓│                                            │ ▢ door    │ │
  │  │▓ ORCHARD ▓│ ▬▬▬ OAK WORKTOP, low and long ▬▬▬▬▬▬▬     │ ▢ (cold)  │ │
  │  │▓ letterbox│  ◟ one bowl of fruit, in the light ◞      ├───────────┤ │
  │  │▓ at work- │                                           │ ▢ flush   │ │
  │  │▓ top      │                                           │ ▢ door    │ │
  │  │▓ height   │                                           │ ▢ (STORE) │ │
  │  └──────────┘                                            └───────────┘ │
  ├────────────────────────────────────────────────────────────────────────┤
  │ ╱╱ WARM STONE — one continuous ground, entirely clear ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱ │
  │    ⌂ one willow basket, by the door — the only object on the floor     │
  └────────────────────────────────────────────────────────────────────────┘
   one wide low wash from the upper-left letterbox ↘ · worktop bright, upper wall quiet
```

### 4 · Furniture layout

Radically reduced:

- **Back wall (Wing A):** **three** thick oak floating shelves — and only three — occupying the middle band of the wall. **The upper wall is deliberately almost empty**: warm lit plaster, closing to the bounded top. Provisions are **grouped with visible gaps between groups**, so the household reads their own habits as clusters rather than as a run.
- **Beneath each shelf: a thin oak shelf-edge strip** carrying the household's own words. **The label is on the room, not on the jar.**
- **Left return:** a **letterbox aperture at worktop height** — wide, low, and long. Beneath and beyond it, a **low oak worktop** running the return, with one bowl of the household's own fruit standing in the light. No drawers on show; nothing beneath the worktop but shadow and floor.
- **Right return:** **three flush doors**, identical, unlabelled, distinguished only by position: cold, cold, store.
- **The floor is empty** except for one willow basket by the door.

### 5 · Fridge, freezer, pantry and store-room treatment

**Its radical move: the three doors are indistinguishable, and that is the design.**

- **Fridge, freezer and store-room are three identical flush oak doors** in the right return, in fixed positions, forever. No labels, no handles beyond a finger recess, no size difference. The concept's argument is `LARDER3` RM2 and **RC2** taken literally: *a room can only be known by heart if it is always seen from the same place* — so the household learns *top is cold, middle is cold, bottom is the store*, once, and never relearns it. Every other concept differentiates its doors visually; this one differentiates them **only by position** and trusts memory.
- **Its honest risk, stated:** this fails a first-time household and it fails an accessibility check. `LARDER1` § 10's floor requires the room to be readable without relying on a single channel, and *position alone* is a single channel. The concept therefore **requires** a permanent non-visual differentiator — an accessible name on each door, at minimum — and specifying it is unresolved work, recorded in § 15.
- **The store-room is where all the density lives.** Wings D, E, F, the dry-store overflow, the packaging, the bulk — everything. Opened, it is deep, racked, and genuinely full: the contrast between the serene room and the working store behind the third door is the concept's most satisfying moment.
- **Pantry / dry store:** the three shelves only. Everything else is in the store.

### 6 · Floating shelf design

**The concept's only furniture on the back wall, and therefore its most considered element.**

Three thick oak planks, unbracketed, wide, deep, and **few**. Square-edged, honest end grain, an oiled surface with visible flecking, and a soft shadow beneath each that grounds it against the plaster. The spacing between them is generous — noticeably more generous than a real kitchen would allow — because the gaps are load-bearing: they are what makes three shelves read as *a considered wall* rather than *a nearly-empty wall*.

**And beneath each, the shelf-edge strip.** This is the concept's most transferable idea: moving the label from the object to the architecture keeps the vessels pure, gives the household's own words a permanent legible home at a consistent height, and — unlike a label on a jar — remains readable when the jar is removed, so a gap still says what is missing. That last property is a genuine advance on the availability language, because `LARDER2` § I.8's *out* state (*"a gap on the shelf where the thing lived"*) currently has nothing to identify the gap with.

### 7 · Jar, tin and ingredient presentation

**Few, large, and spaced.**

- **Large clamp-top glass jars only** on the middle shelf, in groups, with real gaps between groups. No small jars on show — the spice collection lives in the store, which is this concept's most contentious omission, since `LARDER2` § I.5-A5 wants spices *"shallow and at eye level"*.
- **Tins** on the upper shelf, few, stacked in one block.
- **Bottles and preserves** on the lower shelf.
- **Loose produce: one bowl, on the worktop, in the light.** Not baskets on the floor, not a produce wall — one bowl, and it is the room's only colour.
- **Labels: on the shelf edge, never on the vessel.** The glass stays clear so the level reads perfectly; the word sits below at a constant height.

### 8 · Orchard relationship

**A wide low letterbox at worktop height — the most unusual aperture in this investigation, and the one with a genuine architectural tension.**

The window is long, low and horizontal, set so its sill *is* the worktop. You see the orchard **as you work**, at the height of your hands, rather than as you enter. It is a beautiful and unusual idea: the orchard becomes a *companion to the surface* rather than a view from the door.

**The tension, stated rather than hidden.** `LARDER5` § 8.1 requires the aperture to throw the morning **across the room onto the Dry Store wall**, because *"the room's focal surface is its best-lit one, which is exactly right, because it is the surface the household reads."* A letterbox at worktop height throws light **low** — brilliantly across the worktop, weakly onto the shelves above. So this concept's most distinctive move directly weakens the rule that makes the focal wall legible. Three resolutions exist and none is chosen here: raise the letterbox to sit *between* the worktop and the lowest shelf; accept a dimmer focal wall as the concept's signature and seek an amendment at `LARDER5`; or abandon the letterbox for a tall window and lose the concept's best idea. **This is an Architecture Gap, and it belongs to the Home Owner and to `LARDER5`.**

### 9 · Daylight and lighting

**One wide, low, soft wash.** Light enters along the letterbox and washes horizontally across the worktop and the lower back wall, leaving the upper wall in quiet, even shade. The composition is **inverted** from every other concept: bright at hand height, calm above.

This is genuinely lovely and genuinely risky. Lovely, because it lights exactly where a person works and leaves the room's air undisturbed. Risky, because a dim upper wall above three sparse shelves is very close to `EXPLANG1B`'s *empty* and *emotionally distant*, and because of dimension 8's tension.

**House-wide consequence:** a wide, low, soft morning becomes the house's. This is a *sunnier, lower* morning than the canon has assumed, and it would change how every other room's shadows fall.

### 10 · Materials and craftsmanship

Warm oak (three shelves, worktop, three flush doors, shelf-edge strips). Warm lime-washed plaster. Warm honed stone floor. Willow. One ceramic bowl. **Four materials.**

**Craftsmanship shows as proportion and as edge quality.** With so few objects, everything is a focal point: the shelves' thickness relative to their length, the exact reveal around each flush door, the shelf-edge strip's depth, the softening of the worktop's front arris. There is no abundance to hide behind and no precision-tolerance language to hide behind either — only **proportion**, which is the hardest thing to get right and the most valuable when it is.

### 11 · Hospitality

**Hospitality is the fewest things done best.** A short row of the good things on the upper shelf; a bowl of fruit in the light; a clear worktop a guest could put a cup down on. Wing D's store is in the store-room.

Its position, and it is a real one: **a clear surface is hospitality.** Every other concept's worktop is partly occupied; this one's is offered. The household can *use* their larder, which the other four make slightly harder.

Its weakness: the room does not *look* like a household that feeds people, and if hospitality is meant to be visible (as `LARDER2` Wing D's existence implies), this concept keeps it out of sight.

### 12 · Desktop composition

Excellent, and the most naturally compliant with **GEA11** of the five: as the window widens, the three shelves lengthen slightly, the gaps between groups widen, and the room gains a great deal of **lit plaster and empty floor**. It cannot gain content, because there is almost none to gain.

Its desktop risk is the mirror image: at very wide widths, three sparse shelves in a large volume can tip from *composed emptiness* into *a large empty room*. The gaps must scale with intent, not proportionally.

### 13 · Mobile composition

**The best of the five, decisively.** Three shelves plus a worktop plus three doors plus a floor is a **short** column: worktop and letterbox → the three shelves in two or three screenfuls → the three doors → the floor and the basket. It reaches the floor quickly, so the room can genuinely be **finished** rather than scrolled (**RC12**), and every screenful holds a complete piece of furniture with plaster behind and shadow beneath.

It is also the concept where `LARDER5` § 12's named hardest problem is smallest: with a short column, the basket by the door is never far from anything.

### 14 · Interaction philosophy

***You reach for very few things, and you always know where they are.*** *Look* answers almost everything visible, but the visible set is small. *Open* is three acts — three identical doors. *Reach* lifts a jar from a shelf.

Its distinctive idea: **the shelf edge is the room's only text, and it is permanent.** The household reads words at one consistent height, in one place, and nowhere else. Nothing else in the room is labelled, and the room therefore has a single reading rhythm.

Its distinctive risk: the store-room door becomes the busiest object in the room, and a store-room that must be opened constantly means the visible room is under-provisioned — the failure `LARDER5` § 15.2 warns of, and the reason this concept must be judged on **what proportion of a real household's provisions the three shelves can honestly hold.**

### 15 · Why it supports drag-and-drop naturally

**Very strong, and for a reason none of the others share: the room is nearly empty, so a moving object is unmissable.**

- **One basket, on an otherwise empty floor.** It is the only object on the room's largest plane and it is at the household's feet. There is no competing destination and nothing to hit on the way.
- **The gaps between groups are the drop targets.** Because provisions sit in spaced clusters, there is genuine empty shelf between them — so returning a jar has a large, obvious, forgiving landing area, and *"put it back"* is the easiest gesture in any of the five.
- **The shelf-edge strip identifies the gap.** When a jar is lifted, the word beneath it stays — so the household can see exactly where it came from throughout the drag. **This is the clearest drag feedback in the investigation and it is produced entirely by architecture, with no indicator, no highlight and no drop-zone rectangle.**
- **The doorway is the room's only other opening**, and with an empty floor the path to it is unobstructed.
- **And none of it is required** — every outcome has a non-drag equivalent, and this concept's small object count makes an accessible list of actions genuinely short.

### 16 · Assets already available

**The second-most, and legitimately** — the concept was specified in oak on plaster before the library was opened.

- **3 floating oak shelves** (short/medium/wide) — natively correct, and this concept needs *only* shelves on its back wall.
- **1 oak preparation table / side worktable** — usable as the low worktop.
- **27 clamp-top glass jar masters** — the right form and the right family, but the **baked-in black chalkboard label contradicts the shelf-edge labelling** that is this concept's central idea. They would need reissuing **unlabelled**. Using them as they are would put a label in two places, which is worse than either alone.
- **2 produce masters** — usable in the one bowl.
- The 2 oak cupboards and 2 drawer units are **not** used: this concept has no visible drawers and its doors are flush, not panelled.

**Honest total: ~6 of ~22 objects** — and it needs by far the fewest objects of the five, which makes it the **cheapest concept to complete** in absolute terms.

### 17 · Assets still required

Shell: warm stone floor plate, lime-washed plaster wall plates (three planes + letterbox reveal), oak threshold, bounded-top lit band. Joinery: **oak shelf-edge strip** (3 widths — new, and the concept's signature), low oak worktop, **three identical flush oak doors** (closed + open ×3), the store-room's racked interior, two cold interiors. Vessels: large clamp-top glass **unlabelled** (1–2 sizes only), tins, bottles, preserve jars, one ceramic fruit bowl, one willow shopping basket. Materials: **the wide low letterbox wash**, shelf shadows, ambient shadow. Produce: a modest loose set (~8 items). **Plus the unresolved door-differentiation and the § 8 aperture-height tension.**

---

# ASSESSMENT

## 10. The five side by side

| | **1 · Kept Scullery** | **2 · Painted Pantry** | **3 · Orchard Workroom** | **4 · Glass Dry Store** | **5 · Household Wall** |
|---|---|---|---|---|---|
| **Sensibility** | Conservator | Cabinetmaker | Farmhouse naturalist | Modernist | Restrained editor |
| **First emotion** | Reverence | Being looked after | Pleasure | Clarity | Relief |
| **Building fabric** | Stone · lime · pine · iron | Painted in-frame joinery | Oak · plaster · terracotta | Glass · micro-cement | Oak · lime wash · stone |
| **Materials** | 8 | 6 | 11 | **5** | **4** |
| **Joinery** | Freestanding, bracketed | Fitted, in-frame | Floating + freestanding | Frameless planes | Floating only |
| **Open : enclosed** | High open | **Low open** | **Highest open** | Translucent | Low open, high store |
| **Cold treatment** | Hidden behind period door | Fully integrated | **Honest, freestanding** | **Translucent** | Indistinguishable flush |
| **Store-room** | Linen curtain | Bi-fold larder cupboard | Linen curtain | Reeded sliding run | **Deep flush door** |
| **Floating shelves** | Refused | Reinterpreted as bays | **Signature** | Refused | **Signature** |
| **Labels** | Paper tie-on tags | Ceramic clip plates | Chalk on slate | **None (position)** | **Shelf edge** |
| **Aperture** | Small, deep-set | Tall, painted reveal | **Near full height** | Full-height slot | **Low letterbox** |
| **Light** | Cool, even, low contrast | Bright, soft, bounced | **Warm gold, raking** | Neutral, diffuse | **Wide, low wash** |
| **Desktop** | Calm | **Most resolved** | Most impressive | **Best at width** | Excellent |
| **Mobile** | Strong | At risk of a list | **Weakest** | **Most at risk of a list** | **Best** |
| **Drag support** | Strong | Strong | **Strongest** | **Weakest** | Very strong (clearest feedback) |
| **Existing masters usable** | 2 of ~40 | 2 of ~45 | **~36 of ~42** | 2 of ~30 | ~6 of ~22 |
| **New objects needed** | ~38 | ~43 | **~6** + the shell | ~28 | ~16 |
| **Closest to the North Star** | Furthest | Middle | **Closest** | Furthest | Middle |
| **Unresolved governing conflict** | — | — | Light quality is house-wide | **Accessibility (§ 7)** | **Aperture height (§ 8)** |

---

## 11. Strengths of each concept

**Concept 1 — The Kept Scullery**
- The most **authentic** and the least fashionable. It could not date, because it is already old.
- **Best empty-room behaviour of the five.** A stone-and-plaster room with four sparse pine shelves is beautiful with almost nothing in it — which matters enormously, since `LARDER5` § 12 and `LARDER2` § I.8 require the room to be complete when empty, and most households will not fill it.
- The **marble cold slab** is the one genuinely original storage idea in this investigation, and it is historically true rather than invented.
- Paper tie-on tags in the household's own hand are the most **personal** labelling of the five.
- Its material palette makes the *floor* usable, which strengthens drag toward the basket.

**Concept 2 — The Painted Pantry**
- The **calmest** and the most immediately legible as premium to a British audience.
- **Best jar legibility of the five:** a painted bay gives every row of glass a ground to be read against.
- **Best empty-state joinery:** an empty painted bay is genuinely *composed emptiness*, solved by construction rather than by styling.
- **Most resolved desktop composition**, and the safest light quality to export house-wide.
- Honours `LARDER3`'s Object Constitution most fully — five real mechanisms, each behaving as itself.
- The bi-fold larder cupboard is the strongest single **hospitality gesture** in the investigation.

**Concept 3 — The Orchard Workroom**
- **Closest to the approved North Star**, and therefore the lowest aesthetic risk with the Home Owner.
- **Best hospitality and warmth**; the concept most likely to answer `CRAFT1` § 8's *"would I happily spend time here?"* with an unqualified yes.
- **Strongest against `LARDER5` § 15.2** — nothing on the back wall is enclosed, so *look* genuinely answers the room.
- **Strongest drag affordance**, because the room's whole visual logic is already objects resting on surfaces.
- **Overwhelmingly the most complete asset position** — and legitimately so, since it was specified in oak before the library was consulted.
- The chest freezer is a better match to *availability by looking* than a drawer stack, and nobody had noticed.

**Concept 4 — The Glass Dry Store**
- **The quietest room**, and the only concept designed primarily against **GEA2**.
- **Reeded glass is a genuine third state** between the canon's *open* and *enclosed* — a real conceptual contribution, and the only proposal in this investigation that lets a household read their **fridge** without opening it.
- **Best behaviour at very large widths**; continuous planes extend without gaining content.
- **One mechanism everywhere** (slide) makes it the most learnable room.
- The most **timeless-modern** reading of `EXPBLUE2`'s *"a modern home in an ancient orchard"*, and the strongest expression of *technology quietly disappearing*.
- Needs the fewest distinct objects.

**Concept 5 — The Household Wall**
- **Best mobile composition by a clear margin**, and the only concept whose column genuinely *ends* quickly enough to satisfy **RC12** comfortably.
- **The shelf-edge label is the single best idea in this investigation**, and it is transferable to any of the other four: it keeps the vessel pure, gives the household's words a permanent home, and — uniquely — **names the gap when a provision is out**, which the availability language currently cannot do.
- **Clearest drag feedback of the five**, produced entirely by architecture with no indicator, no highlight and no drop-zone rectangle.
- **Cheapest to complete** in absolute asset terms, and second-best existing coverage.
- **Best expression of `GEA11` and `CRAFT1`'s *delete before adding***, and the only concept whose first emotion is the absence of a demand.
- A clear worktop is a real and under-considered form of hospitality.

---

## 12. Weaknesses of each concept

**Concept 1 — The Kept Scullery**
- **Coolness is its central risk.** `EXPLANG1B` § 3A names *cold · clinical · funeral-parlour calm* as temperatures THA must never feel, and a stone larder with a cool north light sits close to all three. Its warmth depends entirely on the household's own provisions — so a sparse household gets a *cold* room, not a *quiet* one.
- **Hospitality is behind a curtain**, so a household cannot see their readiness to receive people by looking — a real cost against `LARDER5` § 15.2.
- **Highest asset cost after Concept 2**, and the hardest materials to produce convincingly: a *new-looking* stone floor or *new-looking* lime plaster would collapse the concept, and wear is the one quality that cannot be faked cheaply.
- **The smallest orchard of the five** — if the orchard is meant to be felt, this gives least of it.
- Diverges furthest from the North Star's warmth, alongside Concept 4.

**Concept 2 — The Painted Pantry**
- **The most expensive concept in new assets** (~43 objects), and it renders every existing oak joinery master unusable. The assessment should not soften this.
- **Furthest from `LARDER5` § 15.2** of the five: five classes of enclosure means *open* competes with *look*, and the balance is fragile.
- **Showroom risk.** Painted in-frame joinery is the most photographed kitchen aesthetic of the last decade; without convincing wear at the touch points it reads as *luxury for luxury's sake* — an `EXPLANG1B` anti-temperature.
- **A single paint colour is a very large brand commitment.** If it drifts toward a THA brand colour it becomes the *costume* the Blueprint names as a spatial anti-pattern.
- **On a phone, a stacked bay is a rectangle**, and four of them in a column is close to a list. It has joinery to defend itself with — but it must actually use it.

**Concept 3 — The Orchard Workroom**
- **The busiest room, and the most exposed to GEA2.** *A more capable THA is a quieter THA*; abundance is the opposite instinct, and every provision a household adds makes this room heavier.
- **It looks worst when sparse, and it may not fill.** Its whole appeal is plenty, the plenty is the household's data, and `LIVINGHOME2` § 5.1 forbids the room adding a single basket to help. A household keeping twelve things gets three long shelves holding twelve things and a great deal of oak — the exact case the concept is least designed for.
- **The greenery and the sill herbs are unresolved** (§ 3.3, H4/H8): if the Home Owner rules that the room may not place a plant, the concept loses a meaningful part of its life.
- **Its light is its biggest liability.** A high-contrast golden raking morning is one step from the *stage* `LARDER5` § 5.3 forbids — and adopting it commits **every room in the house** to a dramatic morning, which is far beyond a Larder decision.
- **Weakest mobile composition:** the longest column, with its lower half in the darkest part of its own light.

**Concept 4 — The Glass Dry Store**
- **It has a governing accessibility problem, not a stylistic one.** No visible labels, contents read through reeded glass, and text only on reach, against `LARDER1` § 10's requirement to be readable without relying on a single channel. **The concept is not viable until a governed alternative is designed** — and that is a real gate, not a caveat.
- **Reeded glass weakens fullness**, and fullness is the room's primary availability language. It trades the canon's central mechanism for calm.
- **It must fight its own materials to feel domestic.** `ASSET1`'s feeling standard asks for *hand crafted · lived in · made for a home, not a shop or a museum*; glass, micro-cement and hairline tolerance pull the other way.
- **Weakest drag support**, structurally: most drags begin with opening a sliding front, and the doorway is the least legible threshold of the five.
- **Most at risk of becoming a list on a phone**, having removed the joinery, hardware and plinth that Concepts 2 and 5 defend themselves with.
- **Weakest hospitality**, and it knows it: a room one would happily *look at* is not the same as a room one would happily *spend time in*.

**Concept 5 — The Household Wall**
- **Its aperture contradicts `LARDER5` § 8.1** (§ 8 above): a letterbox at worktop height cannot throw the morning onto the Dry Store wall, and that rule exists to keep the focal surface the best-lit one. Its most distinctive idea is also its one governing conflict.
- **Three indistinguishable doors fail a first visit and fail an accessibility check.** Position alone is a single channel; the concept requires a permanent non-visual differentiator it does not yet specify.
- **Its restraint is only honest if the store-room absorbs the surplus — and if it does, too much has moved behind a door**, which is `LARDER5` § 15.2's failure. **The concept's viability rests on one unanswered empirical question: how much of a real household's provisions can three shelves honestly hold?**
- **The spice collection is out of sight**, against `LARDER2` § I.5-A5's explicit *"shallow and at eye level."*
- **Closest of the five to `EXPLANG1B`'s *empty*.** A dim upper wall above three sparse shelves is one bad decision away from lifeless, and its only defence is the light — which is the same element § 8 puts in question.
- **The room does not look like a household that feeds people**, which the existence of Wing D implies it should.

---

## 13. Recommended concept

> ### Recommendation: **Concept 3 — The Orchard Workroom**, with **two elements grafted from Concept 5** and **one weakness treated as a governing question rather than a detail.**
>
> **This is a recommendation, not a decision.** Aesthetic approval is the Home Owner's alone (`HOMEOWNER1`, cited), refusal needs no rule, and the other four concepts are left fully specified precisely so that any of them remains buildable.

### Rationale

**1. It is the only concept whose feeling the canon has already approved.** The North Star's atmosphere — warmth, oak, plenty, gold morning light, produce, hospitality — is the approved reference for how this room should *feel* (`LARDER5` § 17, cited), and Concept 3 is that feeling designed properly rather than transcribed. Recommending a concept whose atmosphere the Home Owner has already endorsed is the lowest-risk path to a room that gets built; recommending Concept 4's clarity or Concept 5's restraint would mean asking the Home Owner to abandon the atmosphere they approved, on a document's argument. That is a legitimate thing to *offer* and the wrong thing to *recommend*.

**2. It is strongest on the rule that decides whether the room works.** `LARDER5` § 15.2 makes it explicit: *"the majority of the room is answered by look. That is the design target and the measure of whether the composition succeeded."* Concept 3 encloses **nothing** on the back wall. Concept 2 encloses the most; Concept 5 displaces the most into a store; Concept 4 puts a plane in front of everything. On the canon's own stated measure, Concept 3 wins outright — and this is the single most important discriminator in the investigation, because a Larder that must be opened to be understood has failed however beautiful it is.

**3. Its drag affordance is native rather than designed-in.** The mission asks why each design supports drag-and-drop naturally. Concept 3's answer is the only one that needs no mechanism at all: the room is already full of objects resting on surfaces, so picking one up and putting it in the basket by the door is the room's existing grammar. `LARDER5` § 15.4's requirement — *"the room supplies real places to drag things to … none of them is an abstract drop zone"* — is satisfied by the furniture rather than by anything added.

**4. Its asset position is overwhelmingly the best, and the reuse is legitimate.** ~36 of ~42 objects have a candidate master, against 2 for Concepts 1, 2 and 4. Crucially this is **not** implementation convenience driving design: every concept was specified before the library was opened, and Concept 3's coverage is high because the library was itself built in oak toward this sensibility. `CB4`'s test — *would this asset be chosen if the library were empty?* — is answered **yes** for the oak shelves, drawers, spice rack, worktables and chalk-labelled jars. Had the answer been no, the coverage would count for nothing.

**5. It is the concept most likely to survive `CRAFT1` § 8's Quality Standard.** *"Would I happily spend time here?"* — and if the answer is no, the room is not finished. Concept 4 would most likely be answered *"I would happily look at it."* Concept 1 risks *"it is impressive and I feel a little cold."* Concept 3 is the only one whose first emotion is pleasure.

### The two grafts, and why

Concept 3 has two real weaknesses that Concept 5 has already solved, and taking them costs Concept 3 nothing:

- **Graft the shelf-edge label strip** (Concept 5, dimension 6). Replace the chalk-on-slate-plate labelling with a thin oak strip beneath each floating shelf carrying the household's own words. Three gains: the glass stays clear so the *level* — the room's primary availability signal — reads perfectly; the words sit at one consistent height, which is better for accessibility than a plate hung at a jar's own angle; and, uniquely, **the word survives the jar's removal**, so `LARDER2` § I.8's *out* state gains something to identify the gap with. It also fixes Concept 3's worst detail: a black chalkboard on the face of a clear jar is the one element of the existing masters that fights the concept's own logic.
- **Graft the deliberate gaps between groups** (Concept 5, dimensions 4 and 7). Concept 3's abundance is its main exposure to **GEA2** and to the sparse-household case. Grouping provisions with real gaps between clusters means a household who keeps twelve things sees *twelve things in three considered clusters* rather than *three long shelves mostly bare* — and a household who keeps a hundred still reads their own habits as groups rather than as a run. This is the cheapest available insurance against the concept's biggest risk, and it costs one composition rule.

**The cost of the grafts, stated:** the 27 existing jar masters would need reissuing **unlabelled**. That drops Concept 3's usable coverage from ~36 to ~9 objects and makes the jars the single largest asset item in the recommended path. It is worth it — a label in two places is worse than either alone — but the recommendation should not pretend the graft is free.

### The one weakness that is a governing question, not a detail

**Concept 3's light quality is a house-wide decision and must not be made here.** A high-contrast warm gold raking morning is what makes the North Star's image work, and adopting it commits **Home, Planner, Cookbook, Shopping, Diary and every future room** to the same dramatic morning, because the house has **one** morning (Blueprint § 7, cited). It also sits closest of the five to the *stage* `LARDER5` § 5.3 forbids.

**Recommended handling:** treat the light quality as a **Blueprint-level decision taken deliberately**, with the Larder as its first application — not as a Larder decision that the rest of the house inherits by accident. If the Home Owner prefers a softer morning house-wide, Concept 3 survives it: it loses its most photogenic quality and keeps every one of the five reasons above.

### Why each of the other four was not recommended — in one line each

- **Concept 1** — the strongest empty-room behaviour in the investigation, and the temperature risk is too close to three named anti-temperatures for a room whose warmth depends on a household's data.
- **Concept 2** — the calmest and most resolved room, and the most enclosed, the most expensive, and the one asking the largest single brand commitment.
- **Concept 4** — the most original thinking here (reeded glass as a third state, a readable fridge), and it is gated on an unresolved accessibility problem and trades the room's central availability mechanism for calm.
- **Concept 5** — the best mobile composition and the best single idea in the investigation, and its signature aperture conflicts with `LARDER5` § 8.1 and its viability rests on an unanswered question about how much three shelves can hold.

**Two of these deserve explicit note for the Home Owner beyond their ranking:** Concept 4's *reeded cold door* and Concept 5's *shelf-edge label* are both better than anything in the recommended concept, and both are separable from the concepts that produced them.

---

## 14. What exists today — the honest asset position

Verified on disk, and **inspected visually**, on 2026-07-25:

| Category | Files | State |
|---|---|---|
| **Jar masters** | 27 PNG, 512×768 transparent | **`candidate`, none approved.** One clamp-top form, clear glass, silver bail, ~70% fill, front-on, lit upper-left, with a **black scalloped chalkboard label baked into the glass face** |
| **Joinery masters** | 10 PNG, warm oak, front-on, transparent | 3 floating shelves (short/medium/wide) · 1 floating spice rack · 2 cupboards (single/double) · 2 drawer units (deep/shallow) · 1 preparation table · 1 side worktable. **Candidate** |
| **Produce masters** | 2 PNG | apple-red, broccoli. **Candidate** |
| **Dressing SVGs** | 6 | **Unusable in this room** — `LIVINGHOME2` § 5.1 and `LARDER5` § 13 refuse Environmental Dressing in the Larder |
| **The shell** | **0** | Floor, wall planes, returns, reveal, threshold, bounded top: **nothing exists, for any concept** |
| **The aperture and the orchard view** | **0** | No window frame, no glazing, no orchard plate at E2 |
| **Tins · bottles · baskets · packets · boxes · cartons · crocks · cold doors · store doors · label plates** | **0** | All specified by `ASSET1`; none produced |

**Against `ASSET1`'s specification: ~12 of 59 specified assets have a candidate master, and 0 are approved.** The entire **I** category — I1 oak flooring, I2 plaster wall, I4 stone worktop, I5 wall shadow, I6 morning sunlight, I8 window light, I9 ambient shadow — the room's whole fabric and light, is specified and **unproduced.** That, not the jars, is the real gap: **no concept in this investigation can be built without the shell, and the shell does not exist in any medium.**

---

## 15. Capability Boundary Assessment

Applied under [`CAPABILITY_BOUNDARY_ASSESSMENT.md`](../../architecture/CAPABILITY_BOUNDARY_ASSESSMENT.md) (`CAPBOUND1`). Every item carries one classification with its evidence, and the **Attribution Test** is answered for each: *would a different implementer, with this same repository, this same architecture and this same approval state, still be blocked?*

### 15.1 The Stop Test — answered first

**Was any work available that did not depend on a boundary?** Yes, and it was done: all five concepts are specified across all seventeen required dimensions, with relationship schematics, comparison, strengths, weaknesses, recommendation and rationale. Three governing conflicts were found and surfaced. The asset position was verified on disk and visually. **Nothing that could be written was left unwritten**, and the investigation stopped only where § 15.3's single Model Capability Gap begins.

### 15.2 Architecture Gaps — decisions, not work

| Gap | Evidence | Attribution | Impact | Smallest next action | Capability |
|---|---|---|---|---|---|
| **The North Star's card layer vs `LARDER5`** (§ 3.1) | Both renders show a status strip, a 3×3 category card grid with item counts, an *Add to shopping* bar and a suggestions row; `LARDER5` §§ 5.2, 5.3, 10.1 and `LARDER1` refuse each by name | **YES** — the project's | **Household: none today.** Platform: every concept here will look unlike the approved imagery, and a build will re-discover this conflict under deadline | Home Owner ruling: the North Star governs *atmosphere*, not *layout* — or an amendment at `LARDER5` | **Architecture decision required** |
| **Aperture side** (§ 3.2) | `LARDER5` § 8.1 forces the window left; the North Star's orchard is right | **YES** | Household: none | Already routed at `LARDER5` § 17 — awaiting the ruling | **Architecture decision required** |
| **`ASSET1` H1, H2, H8, I7 vs `LARDER5` / `LIVINGHOME2`** (§ 3.3) | `ASSET1` (07-23) specifies a pendant light, under-shelf lighting, seasonal flowers and *evening warmth*; `LARDER5` § 8 (07-24) lights the room *"by nothing else"*, § 5.3 refuses a stage, § 13 refuses dressing, and Blueprint § 7 fixes one morning | **YES** — two owners disagree and neither is corrected | Household: none. Platform: four specified assets would be produced and then refused | Correct the four entries at `ASSET1`, citing `LARDER5` | **Architecture decision required** |
| **H4 herb pot — dressing or provision?** (§ 3.3) | The North Star shows sill herbs; `LARDER5` § 13's test is *if the room put it there it is refused* — and no owner holds "the household's kept herbs" | **YES** | Household: a small but genuinely alive element is either lawful or not | One ruling, plus (if lawful) naming the owner the herbs render from | **Architecture decision required** |
| **The house's morning *quality*** (§ 4, § 8) | Blueprint § 7 fixes the sun's direction and hour; no owner states whether the morning is crisp or diffuse. Concepts 3, 4 and 5 imply three different house-wide answers | **YES** | Household: none directly. Platform: the chosen Larder concept silently sets every future room's light | Decide the quality at the **Blueprint**, with the Larder as its first application | **Architecture decision required** |
| **Concept 5's letterbox vs `LARDER5` § 8.1** (Concept 5, dimension 8) | § 8.1 requires the morning to fall across the room onto the Dry Store wall; a worktop-height letterbox throws it low | **YES** | Only if Concept 5 is chosen: a dimmer focal wall | Raise the letterbox, accept it via a `LARDER5` amendment, or drop it | **Architecture decision required** |
| **Concept 4's labelless presentation vs `LARDER1` § 10** (Concept 4, dimension 7) | No visible labels + reeded glass + text on reach, against a floor requiring readability without a single channel | **YES** | Only if Concept 4 is chosen: it would fail its accessibility floor | Design a governed always-visible alternative, or drop the position | **Architecture decision required** |
| **Concept 5's three indistinguishable doors** (Concept 5, dimension 5) | Position alone is a single channel | **YES** | Only if Concept 5 is chosen | Specify a permanent non-visual differentiator | **Architecture decision required** |
| **Which owner supplies the orchard view** | `LIVINGHOME1` records an **inherited, unclosed two-orchard convergence**; `client/src/components/layout/orchard-backdrop.tsx` exists in the tree | **YES** | Platform: generating a second orchard before resolving ownership would *widen* a recorded convergence debt | Resolve orchard ownership **before** any orchard plate is produced | **Architecture decision required** |

### 15.3 The single Model Capability Gap

| | |
|---|---|
| **Gap** | **This investigation can specify five concepts completely; it cannot *show* them.** No visual concept board exists for any of the five. |
| **Classification** | **Model Capability Gap** |
| **Evidence** | The architecture is settled (`LARDER5`), no repository work is required (this is a document), no artefact is owed by a third party, and no external party is awaited. The only missing thing is the capability to generate photographic-grade concept imagery. This environment produced text and relationship schematics; it did not produce, and cannot produce, a rendered interior. |
| **Attribution Test** | **NO.** A different implementer, with this same repository, this same architecture and this same approval state, **but with image generation**, would not be blocked. The boundary is the tool's, not THA's. |
| **Reason** | Stated in the tool's own voice, per `CB3`: *the five concepts are fully specified in § 5–§ 9; this environment cannot render an interior image. Five concept boards are specified and unproduced.* This is **not** a limitation of THA's architecture, of `ASSET1`, of the repository, or of the North Star — all of which are sufficient to produce the boards. |
| **Impact** | **Household: NONE** — no household-visible effect, now or later. **Home Owner: significant and immediate.** Aesthetic approval is the Home Owner's (`HOMEOWNER1`) and it is a *visual* judgement; asking for it on 21,000 words of prose and five ASCII schematics asks the wrong sense to do the work. This is the one gap that materially slows the decision this investigation exists to inform. |
| **Recommended next action** | Generate **five concept boards, one per concept** — a front-on elevation of each room from the station point, at the specified light, materials and density, drawn directly from § 5–§ 9 of this document, which contains everything needed as a prompt. **Nothing else.** Not production assets, not the shell, not objects — five images for one decision. |
| **Recommended capability** | **Generate governed asset using ChatGPT Image Generation** (or commissioned illustration / photography). |
| **The governance that still applies** | `CB9`, in full: a concept board is a **decision aid, not an admitted asset.** It enters nothing, ships nowhere, and is not a production master. Any *production* asset later derived from an approved board must pass `ASSET1`'s 21 dimensions, `LHDC1`'s admission standard, the candidate → verification → checksum → recorded-approval lifecycle, and the Home Owner's approval — **entirely unchanged.** Naming an external producer states who can make the file; it is never a route around a gate. |

### 15.4 Asset Gaps — files that do not exist, for whoever produces them

All are **the project's** boundary (Attribution Test: **YES**), all are specified by `ASSET1`, and all are honestly **unproduced** rather than unspecified. They are listed once, at the level a producer can act on, rather than repeated per concept:

| Asset gap | Specified at | Impact | Smallest next action | Capability |
|---|---|---|---|---|
| **The shell** — floor plate, three wall planes, the reveal, threshold, bounded-top band, in the chosen concept's materials | `ASSET1` I1, I2, I4 | **The largest gap in the room.** No concept is buildable without it; it exists in no medium | Produce the shell for **the chosen concept only** — never five | **Generate governed asset using ChatGPT Image Generation**, or photograph / commission |
| **The light** — the morning plate, wall shadow, ambient shadow, in the chosen quality | `ASSET1` I5, I6, I8, I9 | Without it nothing in the room agrees about where the sun is — the dishonesty `LARDER5` calls the most immediately felt | Produce with the shell, from one light direction | Same |
| **The orchard view plate** at E2 — still, one season, one morning | `ASSET1` I8; Blueprint § 6.2 | The room's only view | **Blocked on § 15.2's ownership decision first** | Same, *after* the ruling |
| **Cold doors and interiors; the store-room door and its racked interior** | `ASSET1` B1, B2, A2 | Three of six wings unbuildable | Produce in the chosen concept's language | Same |
| **Tins · bottles · cartons · boxes · packets · crocks · baskets** | `ASSET1` C5–C8, D1–D5, E1–E7, F1–F10 | Wings A3, A6, C1, D1, D2, E1 unbuildable. **C1 is named by `LARDER2` as the single most important wing for how a household eats** | Produce the ~15 forms that cover the real inventory | Same |
| **Loose produce set** (~20 items; 2 exist) | `ASSET1` E-adjacent | C1 cannot be populated | Produce the common set | Same |
| **Jar masters reissued unlabelled** (if the recommended shelf-edge graft is taken) | `ASSET1` C1–C4 | Otherwise a label appears in two places | Reissue 27 masters without the chalkboard face | Same |
| **The shelf-edge strip** (Concept 5's idea, recommended for grafting) | **Unspecified** — no `ASSET1` entry exists | The recommended labelling has no specification | Add a 21-dimension `ASSET1` entry **before** producing it | *Architecture first, then* **Extend repository assets** |

### 15.5 External Dependencies

| Dependency | Act awaited | Owner |
|---|---|---|
| **Concept selection** | The aesthetic verdict between five concepts, and on the two grafts | **The Home Owner** (`HOMEOWNER1`) — refusal needs no rule; approval must be recorded, and an unrecorded approval is not an approval |
| **The nine Architecture Gaps** in § 15.2 | Rulings, or amendments at their owners | The Home Owner (character) and the rule owners (`LARDER5`, `ASSET1`, the Blueprint) |
| **Approval of the 39 existing candidate masters** | The pending checksum-bound approval | The Home Owner — pending since 2026-07-23; **this is the lifecycle working, not a defect** |

### 15.6 Repository Gaps

**None blocking, and one worth naming.** No code is required by this investigation. When a build resumes it will need the shell geometry, the composition and the interaction layer — all ordinary work under `LARDER4`'s build order, none of it a boundary. **A Repository Gap *is* the work** (`CAPBOUND1` § 5.2), and none of it is a reason for anything to stop.

---

## 16. Compliance

### 16.1 Architecture Compliance

- **One canonical identity · one owner per fact.** No entity, owner, register or store is created. Every rule cited belongs to `LARDER1`–`LARDER5`, `ASSET1`, the Blueprint, the UI Architecture or `HOMEOWNER1`, and this document **restates none of them and amends none of them.** All six governing Larder documents are **byte-untouched.**
- **No duplicate entities · ownership · state.** This is a point-in-time investigation, not a source of rule. *Investigations discover; the registry owns* (`PKR1`, cited).
- **Extends existing architecture.** It works inside `LARDER5`'s frame (§ 2) rather than beside it, and applies `CAPBOUND1` rather than inventing a second way to classify gaps.
- **Honest gaps over fabricated information.** Three governing conflicts are surfaced rather than smoothed (§ 3); the one Model Capability Gap is named in the tool's own voice (§ 15.3); no concept's asset coverage is overstated, and the recommended graft's cost to that coverage is stated (dimension 8).
- **No permanent synchronisation bridge · evolution over replacement.** Nothing is replaced, retired, or kept in sync.
- **`CRAFT1` § 7 design method observed.** Every concept was designed from the architecture before the existing library was opened; the reuse in Concepts 3 and 5 passes `CB4`'s *would this be chosen if the library were empty?* test, and the reuse refused in Concepts 1, 2 and 4 is refused for that reason.

### 16.2 AI Architecture Compliance

**Not applicable.** No capability, registry, intent, prompt, Context View, conversation state or model call is touched. No assistant is created. The Companion is not affected and does not read this. No runtime code reads it.

### 16.3 Experience & UI Governance

**No user-facing surface changes**, so the gates are not triggered — but the Experience Constitution Check was used as a *design tool*, since that is what it is for (`EXPGOV1` § 18.2 — answered *before design begins*):

- **Hospitality** (§ 3.1) — every concept states its hospitality position, and one is judged weakest on it by its own author.
- **Outcome** (§ 3.5) — all five serve *less to carry*: see what you keep, without counting.
- **Weight** (**GEA2**) — used as a discriminator, not a box: Concept 4 is designed *for* it; Concept 3 is judged *against* it.
- **Voice** (**GEA8**/**GEA9**) — no concept contains coaching, a suggestion row, a score or a verdict. The North Star's *Smart suggestions* row is refused on this ground (§ 3.1).
- **Ownership and agency** (**GEA21**–**GEA23**) — every concept reports and none counsels; nothing decides for a household. **And this document decides nothing: the Home Owner's authority is untouched.**
- **Restraint** (**GEA11**/**GEA13**/**GEA15**) — every concept states what surplus width becomes; none scores, ranks or streaks; no concept counts.
- **Layer** (**GEA20**) — this is Implementation-layer exploration. It **originates no law**, and the architecture above it stays the authority.

### 16.4 Product Registry Impact

**Registry affected: NO.** Nothing a household can perceive changes; a person's answer to *"what is THA?"* is unchanged. No entry created, updated or retired. No product knowledge enters a prompt, template or fallback string (Rule PKR27).

### 16.5 Adoption Register Impact

**Register affected: NO.** No component, hook, token, utility class or shared client pattern.

### 16.6 Data Impact

- Reads existing data: **YES** — repository documentation and image assets only.
- Writes new data: **NO** — investigation documentation only.
- Changes meaning of existing data: **NO.** Requires backfill: **NO.** Database writes: **NONE.** Runtime changes: **NONE.** Schema changes: **NONE.** Deployment: **NONE.**

### 16.7 Trust Check

- **Could this mislead the user?** No — no household encounters it. It exists to give the Home Owner a truthful design choice.
- **Could this fabricate certainty?** No. It presents five options, recommends one, and states each one's weaknesses in the same detail as its strengths — including two ideas in unrecommended concepts judged **better** than anything in the recommended one.
- **Is anything guessed but shown as real?** No. Asset counts were verified on disk; two assets were inspected visually; every citation was checked. Where the answer is unknown — *how much can three shelves hold?* — it is written as unknown.
- **What happens if the system is wrong?** Nothing is built on this. The five concepts remain available and the Home Owner's verdict is unconstrained.
- No architectural duplication introduced: **YES.** No new source of truth created: **YES.** No runtime behaviour altered: **YES.**
- **The One Question** (`THA_BRAND_CONSTITUTION.md`, cited). *Less to carry?* Every concept is judged on it; two are marked down for failing it. *Could they trust everything it tells them?* The investigation refuses to pretend that the approved North Star and the governing architecture agree, and refuses to present prose as a substitute for a picture. **`LARDER5`'s own reasoning applies to this document as much as to the room: a room that lies about its own light will not be believed about a household's allergens — and an investigation that overstates what it produced will not be believed about what it found.**

---

## 17. Scope Lock

**Implemented scope:** concept exploration only. Five concepts across seventeen dimensions each; five relationship schematics; the fixed-frame statement; three governing conflicts surfaced; the eight open design axes; the comparison matrix; strengths and weaknesses per concept; a recommendation with rationale and two named grafts; the verified asset position; and a full Capability Boundary Assessment.

**Explicitly excluded:** **no** React, CSS, component, token, hook, route, schema, migration, capability, string, runtime behaviour or business logic; **no production asset of any kind**; **no concept board** (§ 15.3 — the one Model Capability Gap); no amendment to `LARDER1`–`LARDER5`, `ASSET1`, `LIVINGHOME2`, the Blueprint or any Experience Governance document — **all byte-untouched**; **no selection of a final concept**; no approval of the 39 pending candidate masters; no resolution of any of the nine Architecture Gaps; **no deployment.**

**Filing divergence, surfaced not silently resolved.** The mission specified `docs/investigations/LARDER7_LIVING_LARDER_VISUAL_CONCEPTS.md` — a tree root, which `REPOSITORY_CONVENTIONS.md` § 1 rule 5 forbids (*"a report written to the root is a defect, not a filing decision"*) and which `.engineering/scripts/repo-structure-verify.sh` check #5 mechanically fails. Filed instead at the governed path for the **House** workstream (`DOCGOV2` routing — rooms · spatial experience · household interior design language): **`docs/investigations/house/LARDER7_LIVING_LARDER_VISUAL_CONCEPTS.md`**. The filename is unchanged. Reported to the Home Owner rather than adjusted quietly.

**SUGGESTION** *(not implemented — do not action without approval):*
1. **`ASSET1`'s four superseded entries (H1, H2, H8, I7) should be corrected regardless of which concept is chosen** — they are unaffected by the aesthetic decision and will otherwise be produced and then refused.
2. **The shelf-edge label strip deserves an `ASSET1` entry whichever concept wins.** It is the one idea here that improves the availability language itself, by giving the *out* state something to name it with.
3. **Concept 4's reeded cold door merits separate consideration** even if Concept 4 is not chosen: it is the only proposal in this investigation that lets a household read their fridge without opening it.
4. **The orchard ownership question should be closed before any orchard asset is produced**, or `LIVINGHOME1`'s inherited two-orchard convergence widens rather than closes.

---

## 18. Implementation Completion Report

*(Filed under `CAPABILITY_BOUNDARY_ASSESSMENT.md` § 7.1. An investigation is not an implementation, but the standard's value is precisely at a stop, and this one has a boundary worth classifying.)*

```
IMPLEMENTATION COMPLETION REPORT
================================

Architecture Complete:   YES  (as an investigation)
  Governing documents bound:
    LARDER1 · LARDER2 · LARDER3 · LARDER4 · LARDER5 · ASSET1 ·
    THA_EXPERIENCE_BLUEPRINT · GOVERNING_EXPERIENCE_ARCHITECTURE ·
    THA_EXPERIENCE_LANGUAGE · LIVINGHOME1 · LIVINGHOME2 · LHDC1 ·
    CRAFT1 · HOMEOWNER1 · CAPBOUND1 · REPOSITORY_CONVENTIONS
  Rules satisfied:
    Rollback taken and reported before any change (STEP 1) — bcab1846 ·
    Architecture Bootstrap read in full before design (STEP 2) ·
    CRAFT1 § 7 method: all five concepts designed from the architecture
      BEFORE the existing asset library was opened ·
    LARDER5's fixed frame obeyed by all five (§ 2) ·
    Restate-no-rule: all six Larder documents byte-untouched ·
    CB4 applied: reuse refused in 3 of 5 concepts, on the record ·
    No concept selected — HOMEOWNER1's authority untouched
  Rules NOT satisfied: NONE

Engineering Complete:    N/A — no code, no asset, no runtime artefact was in
                         scope. Nothing was built, so nothing is claimed built.
  Commands run and outcome:
    repo-structure-verify.sh   → see § 18 Engineering note
    asset inventory verified on disk; 2 masters inspected visually
    every cited path checked for existence
  Gates not run, and why:
    build / typecheck / verify:coherence / adoption:check → not run.
      No .ts, .tsx, .css, schema or config file was touched. Running them
      would report the repository's pre-existing baseline as a result.

Interaction Complete:    N/A — no interaction was implemented. Each concept's
                         interaction philosophy is SPECIFIED (dimension 14) and
                         its drag rationale argued (dimension 15); neither is
                         built, and neither is claimed built.

Existing Assets Used:
  The governing canon (cited, never restated) · the approved North Star
  imagery, read as images · the existing 39 candidate masters, inspected and
  then accepted or refused per concept on CB4's test · ASSET1's 59-asset
  specification and 21-dimension frame · CAPBOUND1's classification.
  No new document, register, owner or standard was authored.

New Assets Required:
  See § 15.3 and § 15.4 in full. Summary:
    5 concept boards          — UNSPECIFIED as assets (decision aids, not
                                admitted assets); needed for the Home Owner's
                                verdict; nothing stands in their place
    the shell + the light     — specified (ASSET1 I1/I2/I4/I5/I6/I8/I9);
                                unproduced in any medium; no placeholder
    the orchard view plate    — specified; BLOCKED on an ownership decision
    cold/store doors, tins,
    bottles, baskets, boxes,
    packets, crocks, produce  — specified (ASSET1 B, C, D, E, F); unproduced
    27 jars reissued unlabelled — specified; needed only if the recommended
                                graft is taken
    the shelf-edge strip      — UNSPECIFIED; needs an ASSET1 entry first

Remaining Gaps:          11 gaps — 9 Architecture · 1 Model Capability · and
                         the Asset Gap set of § 15.4 (counted as one item)

  The single Model Capability Gap, in full:
    Classification:      Model Capability Gap
      Evidence:          architecture settled, no repository work required,
                         no artefact owed by a third party, no external party
                         awaited — only the capability to render an interior
      Attribution Test:  NO — a different implementer with image generation,
                         on this repository and this architecture, would not
                         be blocked. The boundary is the tool's.
    Reason:              The five concepts are fully specified in § 5–§ 9.
                         This environment cannot produce photographic-grade
                         interior imagery. Five concept boards are specified
                         and unproduced. This is NOT a limitation of THA's
                         architecture, ASSET1, the repository or the North
                         Star — each is sufficient to produce the boards.
    Impact:              Household: NONE. Home Owner: significant — aesthetic
                         approval is a visual judgement and this document asks
                         the wrong sense to make it.
    Recommended next action:
                         Generate five concept boards — one front-on elevation
                         per concept, from § 5–§ 9, which contains everything
                         needed as a prompt. Nothing else.
    Recommended capability to complete it:
                         Generate governed asset using ChatGPT Image
                         Generation (or commissioned illustration /
                         photography). CB9 applies in full: a board is a
                         decision aid, never an admitted asset, and any
                         production asset derived from an approved board
                         passes ASSET1, LHDC1, the candidate → checksum →
                         approval lifecycle and Home Owner approval unchanged.

  The 9 Architecture Gaps are tabulated with all five fields at § 15.2.
  The Asset Gap set is tabulated with all five fields at § 15.4.
  No gap here is a Repository Gap: no code was required (§ 15.6).

Stop Test:               NO remaining work independent of these gaps was left
                         unattempted. All five concepts are specified across
                         all seventeen dimensions; the comparison, strengths,
                         weaknesses, recommendation and rationale are complete;
                         three governing conflicts were found and surfaced; the
                         asset position was verified on disk and visually. The
                         investigation stopped exactly where rendering begins.
```

---

*This is a design investigation. It creates no route, capability, entity, token, component, string, asset, schema, migration or business logic; it changes no user-facing surface; and no runtime code reads it. Every rule of the room stays with its owner — the destination `LARDER1`'s, the interior `LARDER2`'s, the behaviour `LARDER3`'s, the build `LARDER4`'s, the space `LARDER5`'s, each asset `ASSET1`'s, the craft `CRAFT1`'s, and **the verdict the Home Owner's**. Five rooms are offered, one is recommended, none is chosen — and the one thing this investigation could not do is show them.*
