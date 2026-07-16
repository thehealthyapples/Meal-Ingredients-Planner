# EXP5 — One Home, Many Places

**Status:** DELIVERED — investigation only, awaiting review
**Classification:** Experience investigation (point-in-time analysis; not governing architecture)
**Date:** 2026-07-15
**Session:** `EXP5_One_Home_Many_Places`
**Rollback:** `rollback/EXP5-one-home-many-places-20260715` → `b3c650cd`
**Governing documents read before work:** `docs/architecture/README.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_UI_ARCHITECTURE.md` (§§ 4–17), `THA_EXPERIENCE_LANGUAGE.md` (incl. § 3A Emotional Palette and § 4A Place Principles)
**Prior explorations reviewed:** `EXP2_ARRIVAL_EXPERIENCE_EXPLORATION.md` (§ 7 carry-forward), `EXP3_ARRIVAL_SYNTHESIS_PROTOTYPES.md` (§ 5 recommendation), `EXP4_MATERIALITY_AND_DEPTH.md` (§ 5 synthesis)
**Visual evidence reviewed:** `docs/ui-audit/current-interface-snapshots/` (desktop 1440 + mobile 390 — home, planner, cookbook, shopping populated, pantry, nutrition, diary, analyser, profile, companion-open), `docs/ui-audit/exp4-materiality-depth/` composed stills

> **What this is.** The design investigation for THA's spatial identity: how
> eleven domains can each feel like a distinct *place* while remaining rooms of
> one warm, lived-in home, every one of them connected to the same living
> orchard. This is spatial psychology and art direction — not literal rooms,
> decorative theming, or skeuomorphism. **Nothing is implemented here.** No UI,
> production code, or governing architecture is changed by this document; every
> idea in it that would touch the visual law enters, if it enters at all,
> through the governed amendment path EXP4 § 6 already named.

> **The core principle, which everything below serves:**
>
> **"Every place in THA should feel different, but every window should look
> onto the same orchard."**

---

## 1. THE GOVERNING CONCEPT — ONE HOME, MANY PLACES

### 1.1 The problem, seen plainly in the current interface

The Experience Language already commits THA to being a *place* (§ 4A Principle
B) with the orchard as its *life* (§ 3A.3). The current interface honours that
commitment in exactly one way: the orchard painting sits behind **every**
surface, at roughly the **same strength**, on **one flat plane**. The
screenshots make the consequence unmissable:

- Home, Planner, Cookbook, Shopping, Pantry, Nutrition, Diary, Analyser and
  Profile are all the same room. The same hills, the same path, the same
  strength of backdrop — only the furniture on top changes. The realms are
  distinguished by their *content* and by a tinted chip in the bottom
  navigation, and by nothing else a person could feel.
- Because the orchard is everywhere at once, it is nowhere in particular. It
  has become exactly what Principle B forbids: *"the orchard flattened into a
  backdrop image instead of being the room itself."* Wallpaper — beautiful
  wallpaper — but wallpaper.
- Everything sits directly on the environment. There is no middle ground:
  cards rest on the landscape the way stickers rest on a photograph
  (EXP4 found this precisely: "cards feel like rectangles placed on a page
  rather than objects within an environment"). Where content is sparse —
  Shopping's lower two-thirds, the Analyser's entire empty state — the raw
  landscape floods forward and the surface stops feeling like a room at all:
  it is all view and no place to stand, which reads as *empty* (§ 3A.1), not
  as calm.

So the platform currently has **one home and one place**: the same
conservatory, eleven times.

### 1.2 The concept

**One Home, Many Places** resolves the tension between two rules that must
both hold:

- **Principle 11 / Principle 9:** THA is ONE product with ONE character and
  ONE shell — learning one surface is learning them all.
- **Principle B / § 5's per-realm rhythms:** each realm is a *different room*
  with a different emotional job — the Planner is not the Diary, and should
  not feel like it.

The resolution is the way a real home resolves it. A good home is
unmistakably one house — one architecture, one daylight, one family living in
it — and yet the kitchen, the study and the window seat feel nothing alike.
What makes them different is never the walls (the walls are constant, like
the shell); it is four quieter things:

1. **Purpose** — what you come there to do, and therefore what the room holds
   ready.
2. **Light** — how much of the day the room lets in, and what the light falls
   on. Same one sun; different windows.
3. **Material** — what the working surface is: a table, a counter, a shelf, a
   noticeboard, an armchair.
4. **Signs of life** — the room is *used*: the family's own things are in it.

And what keeps the rooms one home is that **every window looks onto the same
orchard.** The orchard is the constant world outside the house — bright,
growing, in season, tended (§ 3A.3). No room *contains* the orchard; every
room is *oriented toward* it. Some rooms open wide to it (Home), some glimpse
it past a doorway (Pantry), and some only receive its light across the work
(Planner, Analyser) — but it is always the same orchard, on the same morning,
seen from inside the same house.

Stated as design law:

> **The shell is the walls. The orchard is the world outside the windows. Each
> domain is a room, differentiated by purpose, light, material, and one sign
> of life — never by its own architecture, navigation, palette, or theme. The
> orchard is never wallpaper: it is exposed through each room's "window" at a
> deliberate, governed strength, and it always represents life.**

### 1.3 What this concept is NOT

The distance between "place" and "theme park" is the whole craft, so the
refusals are stated up front, before any domain is described:

- **No literal rooms.** No illustrated kitchens, no drawn furniture, no
  skeuomorphic wood-grain tables. The "family table" is a feeling produced by
  material, light, and composition — never a picture of a table.
- **No themed costumes.** A realm's character is *a whisper of place for
  wayfinding* (UIA § 4) — never its own palette, its own component styling,
  its own decorative border, or a leaf motif.
- **No game-like environment.** The person is at home, not in a rendered
  world. Nothing about the environment invites exploring *it* instead of
  living in it.
- **No metaphor that interferes with function.** The instant a person notices
  the room instead of their work, the room has failed (Principle H's test,
  applied to space). On dense working surfaces, place recedes to almost
  nothing — and that recession is itself the design.
- **No second anything.** One shell, one navigation, one card owner, one
  header, one Companion. A room is a *use* of the canonical owners, never a
  fork of them (UIA § 17).
- **No cold, misty, or melancholy orchard, ever.** The orchard means life:
  warm, bright, growing, optimistic, curious, energised. An orchard at dusk
  or in fog is still an orchard and still wrong (§ 3A.3). "Quiet corner"
  (Diary) means *quieter*, never *darker* — every room in this house is a
  morning room.

### 1.4 Why this is the right next investigation

EXP2/EXP3 solved **arrival** (how you enter the home). EXP4 solved
**material** (what one room is made of — ground, light, air). What neither
answered is the question a household hits thirty seconds after arriving:
*what happens to the sense of place when I walk from Home into the Planner?*
Today the honest answer is "it stays exactly the same, which means it
disappears." EXP5 is the missing layer between the arrival and the material:
the **map of the house**.

---

## 2. THE SHARED VOCABULARY — MATERIALS, LIGHT, AND DEPTH

One vocabulary, spoken in every room. The domains in § 4 differ only in how
they *use* these shared words — no domain coins its own. This section
deliberately builds on EXP4's synthesis (§ 5 there: **A's ground + B's light
+ C's air**) rather than inventing beside it; where EXP5 extends it, the
extension is marked.

### 2.1 The three grounds of depth (foreground, middle ground, background)

The current interface has two layers: environment and content, with nothing
between — which is why content reads as stickers on a photograph. The
concept requires three, and EXP4 already proved the middle one:

| Ground | What lives there | Material character |
|---|---|---|
| **Background — the world** | The orchard environment and the daylight it casts. Canonical, single-owner, never forked per realm. | The painting and the light. Soft, atmospheric, *behind everything*, never carrying text. |
| **Middle ground — the room** | The workspace: EXP4-A's **ground plane** (the prepared counter/table/shelf), and on it the primary and supporting surfaces in EXP4-B's light hierarchy. | Warm, matte, linen-soft; solid where work happens, translucent where the room may breathe. One ground per workspace, never nested (EXP4's law). |
| **Foreground — what floats** | Overlays, dialogs, and the Companion. Already correct: EXP4 found the floating layer needs nothing. | The nearest plane; elevation reserved for what genuinely floats (UIA § 4). |

**The middle ground is the whole trick of "many places."** The background
(orchard) and foreground (shell, Companion) are constant product-wide — they
are what makes it one home. The middle ground is the only layer that varies
by domain — it is what makes each room a place. A domain expresses its
character **entirely within its ground plane and the light that falls on it**,
and touches nothing above or below.

### 2.2 Light — one sun, many windows

EXP4-B's finding graduates from "one study" to "the house rule":

- **One light direction, product-wide.** The morning sun sits upper-left,
  forever, in every room. Every shadow on every surface in every domain
  agrees. (EXP4 § 5 idea 3, unchanged.)
- **Rooms differ by *exposure*, never by direction or hour.** A room's
  character comes from how much light its window admits and what the light
  falls on — a wide-open aspect (Home), a bright working light (Planner,
  Analyser), a warm side-light across a page (Cookbook), a soft pool in a
  corner (Diary). It is always the same morning; no room is ever at dusk, in
  shade-as-mood, or under artificial light.
- **Warm shadows that describe space** (EXP4 § 5 idea 2): room-hued, never
  grey or black; depth = distance, never drama.
- **Penumbra demotion** (EXP4 § 5 idea 4) is the hierarchy language inside
  every room: the primary stands in the light, support waits in the penumbra,
  quiet content sits in the shade — measured against the accessibility floors
  before any adoption (EXP4-B's named condition, inherited unchanged).
- **Light is never an effect.** It never moves, sweeps, or glows. The one
  sanctioned light *moment* remains the arrival's (EXP3-S1); rooms have
  *lighting*, not light shows (Principle F).

### 2.3 Material — the room's working surface

The material vocabulary is small and every domain composes from it:

- **The ground plane** — EXP4-A's discovery, now given its full meaning: the
  ground *is* the room's identity. Home's ground is a prepared counter; the
  Planner's is the family table; the Cookbook's is the shelf and the open
  book; the Analyser's is the workbench. Same material system — one warm
  plane, one radius law, one shadow definition — different *proportions,
  density, and posture* per domain (§ 4). One ground per workspace, ever; a
  ground never nests.
- **Solidity follows importance** (EXP4's tier law): the primary surface is
  solid and lit; supporting surfaces are lower and quieter; quiet content
  lies directly on the ground like a note on the counter. **Support is
  anchored, never naked ink on the environment** — EXP4-C's material floor,
  which several live surfaces currently sit below (§ 7).
- **Air is a material** (EXP4-C): the spacing rhythm one step more generous
  is the resting state of every room. Breathing space is what makes a room
  feel inhabitable rather than furnished to the walls.
- **The hand answers physically**: hover lifts / brings into the light; press
  seats; focus is the canonical ring (EXP4 §§ 2–3). One interaction feel,
  product-wide — rooms never invent their own physics.

### 2.4 Consistency guarantees (what may never vary)

For every domain, without exception: the shell (header, navigation, one way
home) · the canonical component owners (Card, Button, forms, states, dialogs)
· the semantic token system and both palettes (brand green, warm amber,
status colours) · the type scale and its three voices · the motion vocabulary
· the state law (loading/empty/error) · the Companion (one, floating,
mannerly) · the accessibility floors · the two-second rule. A room that needs
to break any of these to feel like itself has not been designed yet.

---

## 3. RULES FOR ORCHARD EXPOSURE

The orchard's presence becomes a **governed, four-level scale** instead of
today's uniform wallpaper. The scale is the "window size" of each room, and
it obeys one inverse law:

> **Orchard exposure is inversely proportional to functional density. The
> more a surface asks the eye to work, the further the orchard recedes —
> first into a glimpse, then into light alone. The orchard is never behind
> working text.**

| Level | Name | What it is | Where it belongs |
|---|---|---|---|
| **E3** | **The open view** | The orchard visible as itself, generously — the widest window in the house. Content is sparse and sits on its ground; the view IS part of the room's purpose. | **Home only.** Arrival is the one moment whose *job* is the view. |
| **E2** | **The window** | A framed, partial presence: the orchard clearly *there* — brighter and more legible in one committed region of the surface (an upper aspect, a margin the content deliberately does not cover) — while the working area sits on solid ground. Framed by composition (where content is not), never by a drawn window frame. | Browsing and reflective rooms: Cookbook, Pantry, Nutrition, Diary. |
| **E1** | **Light only** | The orchard as illumination and warmth, not image: the canvas is warm, the light direction and hue are the orchard's, the ground plane covers most of the environment. You know the orchard is outside because the room is bright — you don't see it while working. | Working rooms: Planner, Shopping, Analyser, Household/Profile, and every dense or form-heavy surface. |
| **E0** | **Lit from the hall** | No orchard image at all; the same warm canvas, tokens, and light temperature. The room is still unmistakably in the house. | Admin, dialogs/overlays, printed or exported documents. |

Rules that ride on the scale:

1. **Exposure is a per-domain constant, set once by design, expressed as
   governed values in the one token source** — never a per-surface or
   per-component choice, and never adjusted for taste mid-feature. (Admission
   path: § 9.2.)
2. **Empty states may open the window one level, never two.** An empty
   working room (Shopping with a clear list, Analyser before a first scan) may
   breathe at E2 — honest emptiness with the view beyond it — but the moment
   content exists, the room returns to its level. Today's behaviour (empty =
   the entire landscape at full strength, i.e. E3+) reads as *nobody home*,
   not as calm.
3. **The orchard never carries text.** Any surface where type must sit
   legibly gets ground plane under that type, full stop. Legibility is never
   negotiated against atmosphere (EXP4-C's floor; UIA § 15).
4. **One orchard.** One canonical environment asset family, one owner, one
   season: perpetual bright morning, in leaf, tended. Realms never get their
   own orchard variant, angle, or season. (What the person sees through
   different windows differs by *how much*, never by *which orchard*.)
5. **The orchard never animates.** No drifting mist, no swaying trees, no
   ambient motion (EXP3-S2 proved place survives total stillness; § 3A keeps
   stillness from becoming deadness through warmth, not through movement).
6. **Emotional surfaces may spend more window; functional surfaces may not.**
   The arrival may stand at E3 for its beat and settle into the destination
   room's level. A form never earns a view upgrade because it looked plain.

---

## 4. THE DOMAIN-BY-DOMAIN PLACE AND ART-DIRECTION MAP

Eleven rooms, one house. Each entry answers the nine questions the mission
asks. The living details named here are drawn from the governed library in
§ 5 — at most ONE per domain, and every one of them is **data-borne** (§ 5.1):
the life in a room is always the household's own life showing, never a prop.

---

### 4.1 HOME — the place of arrival

- **Emotional purpose.** *You're home, you were expected, today is under
  control.* The exhale. Home carries the arrival beat for the whole session
  and is where every journey ends as well as begins (§ 5.1 of the Experience
  Language).
- **Room / place analogy.** The threshold and the heart of the house — the
  hallway opening into the kitchen, morning light everywhere, the day already
  quietly thought about.
- **Relationship to the orchard.** **E3 — the open view.** Home is the one
  room whose window is the widest: the orchard is generously present around
  and behind the (compact) workspace. Home is where the household *sees* the
  world the rest of the house only feels.
- **Quality and direction of light.** Full morning: the brightest room in
  the house. Light falls upper-left across the greeting and the primary card
  — the sun is on today.
- **Material and depth character.** EXP4's synthesis verbatim: one prepared
  counter (ground plane) holding one primary surface in the light, support
  demoted to quiet anchored rows, C's generous air. The workspace is compact
  by design — a counter, not a floor plan — so the view keeps its share.
- **One subtle living detail.** **The greeting in THA's hand** — time-of-day,
  the household's name (EXP3-S1's welcome beat; on return visits, the settled
  form). This is Home's sign of life and it is already real data: the clock
  and the household.
- **Primary visual anchor.** The state sentence + today's meal card — the one
  object on the counter.
- **What must remain canonical.** Everything in § 2.4; the arrival gating
  (full welcome at most once per day, E's register otherwise — EXP2's
  structural finding); Home's hierarchy law (orientation → state → primary →
  support → one way deeper).
- **Risks of gimmick / literalism.** The view swallowing the room (Home as
  landscape screensaver — the current empty-ish Home already leans this way);
  the greeting becoming ceremony (Principle C: welcome is a beat, not a
  toll); adding a second living detail because the first was liked.

---

### 4.2 PLANNER — the family table

- **Emotional purpose.** *The week is held.* Sitting down at the table where
  the family's week gets decided — capable, unhurried, everything to hand.
  The feeling of a plan coming together, never of a spreadsheet demanding
  cells.
- **Room / place analogy.** The kitchen table with the week laid out on it —
  chairs for everyone, the light good enough to work by.
- **Relationship to the orchard.** **E1 — light only.** The Planner is the
  densest working surface in the product; the orchard recedes to warmth and
  brightness. You plan *by* the window's light, not *against* the view.
  (Today's Planner already half-knows this — its wash — but the wash is
  muddy and sits *over* the grid rather than the grid sitting on a table;
  § 7.)
- **Quality and direction of light.** Bright, even working light from the
  same upper-left — the table is well-lit everywhere, with one warmth accent:
  **the sun is on today.** Today's column sits a half-step brighter/warmer
  than the rest of the week (penumbra logic applied to time). Weekend or
  weekday, the plan's "now" is always the lit part.
- **Material and depth character.** The week grid becomes ONE object — the
  table — a single solid ground plane holding the grid, rather than a lattice
  of translucent cells floating on landscape. Meal entries are things *on*
  the table (low, warm, solid); empty slots are visibly bare table — an
  honest, calm "place not yet set", not a hole. The side panel is the one
  docked companion panel the layout law already permits.
- **One subtle living detail.** **The sun on today** (from the library,
  § 5.2 — it is the calendar's own truth rendered as light). Nothing else:
  the week's own meals ARE the life of this room.
- **Primary visual anchor.** The week itself — the table — with today's
  column as its focal point.
- **What must remain canonical.** All planning behaviour, journeys, the
  docked-panel pattern, density law; the grid remains a grid (function is
  sacred — this is the domain where any metaphor that costs one click dies).
- **Risks of gimmick / literalism.** A drawn table edge or wood texture
  (forbidden); "place settings" iconography; today's warmth drifting into a
  status colour (it is light, not state — must stay below the emphasis
  budget); the E1 recession being read as "remove the wash" and replaced
  with clinical white (the room must stay warm; § 3A.1 *cold* is the
  opposite failure).

---

### 4.3 COOKBOOK — the recipe book beside the orchard window

- **Emotional purpose.** *Appetite and possibility.* Browsing what we could
  cook — leafing, lingering, being tempted. The warmest browsing register in
  the product; the food itself is the colour.
- **Room / place analogy.** The well-used recipe book on the shelf by the
  kitchen window — the seat where you flick through it with the light coming
  over your shoulder.
- **Relationship to the orchard.** **E2 — the window.** The orchard is
  present as a bright margin the shelf does not cover — the window *beside*
  the book — while the recipe cards themselves sit on solid shelf. Of all
  rooms, the Cookbook earns the most window after Home: recipes and growing
  food belong within sight of each other.
- **Quality and direction of light.** Warm side-light from the window across
  the page: the top of the shelf region catches slightly more warmth, the
  browsing grid is evenly, generously lit. (This is composition and value,
  not an effect — nothing sweeps or glows.)
- **Material and depth character.** The shelf is the ground plane; recipe
  cards are the most *object-like* surfaces in the product (they are things
  you pick up): solid, warm-white, the lift/settle hand-feel at its most
  natural. Food photography, where it exists, is the room's real decoration
  — honest, appetising, in real light (UIA § 10).
- **One subtle living detail.** **The well-thumbed page**: the household's
  most-cooked recipes carry a barely-there extra warmth in their surface (a
  half-step of the same warm white, at most) — the book falls open where the
  family actually lives. Data-borne (cook counts), invisible until noticed,
  meaningless to a new household (an unthumbed book is just a book — honest).
- **Primary visual anchor.** The recipe grid — the open book itself.
- **What must remain canonical.** MealCard ownership; the one canonical meal
  page; search/filter patterns; the state law for absent images (honest
  absence, never stock filler).
- **Risks of gimmick / literalism.** Page-turn skeuomorphism (forbidden);
  "bookmark" ribbons; the well-thumbed warmth growing into a badge or a
  ranking (it is patina, not praise — the moment it reads as a score it has
  become status colour and broken § 7 of the UIA); the window margin
  becoming a fixed illustration panel.

---

### 4.4 SHOPPING — the list prepared before leaving home

- **Emotional purpose.** *Ready to go.* The calm of a list made — the moment
  by the door with the note in your hand. In the shop: an uninterrupted flow
  that stays out of the way.
- **Room / place analogy.** The notepad by the kitchen door — written at the
  counter, taken off its magnet on the way out.
- **Relationship to the orchard.** **E1 — light only** while the list has
  items (working room; also the room most often used *outside the house*, in
  a shop, one-handed — atmosphere must cost nothing there). **E2 when the
  list is clear** — the honest empty state may breathe with the view: "Your
  list is clear" beside an open window is exactly the right calm (rule § 3.2).
- **Quality and direction of light.** Plain bright morning on the note — the
  most matter-of-fact light in the house. Nothing about this room lingers;
  it is passed through.
- **Material and depth character.** The note is the object: ONE solid ground
  plane sized to its content (today's tall empty paper-slab, § 7, is the
  anti-pattern — a note is as long as the list on it). The handwriting-idiom
  input the surface already has is correct and stays. Checked-off items
  settle into the shade (penumbra, not deletion) — the crossed-out line that
  proves the trip is working.
- **One subtle living detail.** **The crossing-off** — checked items remain
  quietly visible, struck through in the shade, until the trip completes.
  The list visibly *becomes done*, which is the whole satisfaction of a list
  (and it is pure data). Completion resolves to the § 5.4 rest state — done,
  no upsell.
- **Primary visual anchor.** The list itself — the note.
- **What must remain canonical.** The add/review/prep/shop journey; list ↔
  basket ownership; one-handed reach and touch targets (this room is used
  standing in aisles).
- **Risks of gimmick / literalism.** A drawn fridge magnet or paper texture
  (forbidden); receipt skeuomorphism; the strike-through celebrating
  (Principle 10 — routine resolves quietly); any atmosphere that costs a
  frame of scroll performance in the aisle.

---

### 4.5 PANTRY — the pantry with the orchard visible beyond

- **Emotional purpose.** *We have what we need.* Quiet abundance and
  stewardship — knowing what's in the house, using things well, wasting
  little. Upkeep that feels like keeping, not bookkeeping.
- **Room / place analogy.** The pantry just off the kitchen — shelves in
  good order, the small window at the end, the orchard beyond it (the food
  in here *came from* out there — the most literal connection in the house).
- **Relationship to the orchard.** **E2 — the window,** and the smallest one:
  a modest framed presence at one committed region (the surface's upper
  aspect), the shelves solid beneath. The pantry's glimpse is the concept's
  purest expression: stores inside, growth outside, one glance holding both.
- **Quality and direction of light.** Cooler-quiet than the kitchen but
  still morning-warm — a room off the bright room. Even, practical light on
  the shelves; the window region carries the day's brightness.
- **Material and depth character.** Shelves: the inventory sections
  (larder/fridge/freezer/fruit) are solid ground-plane strata, each an
  anchored surface — never floating checklists on landscape (today's two
  translucent panels sit below EXP4-C's floor). Items are quiet rows ON the
  shelf; the fridge/freezer/larder tabs remain the canonical subnav pattern,
  not doors.
- **One subtle living detail.** **Freshness, honestly told**: the fruit
  section's items carry their real state in plain words where the data
  exists ("still good" / "use soon" in the canonical status vocabulary). The
  pantry's sign of life is that its contents are *alive* — which is true, and
  is already the domain's honest job. (Chosen over the window-glimpse as the
  detail because the glimpse is this room's E2 exposure, not a detail.)
- **Primary visual anchor.** The shelves — the inventory itself.
- **What must remain canonical.** Inventory data ownership; the status
  vocabulary for freshness (never invented urgency); add/mark-used flows;
  staleness honesty (§ 5.6: "uncertainty says so plainly").
- **Risks of gimmick / literalism.** Drawn jars, shelf brackets, or a window
  frame (all forbidden); freshness drifting into guilt ("use soon" is a
  helpful note, never a moralising alarm — Experience Language § 5.5 logic
  applies here too); the glimpse growing until the pantry becomes a
  conservatory.

---

### 4.6 NUTRITION — the family noticeboard / the garden view

- **Emotional purpose.** *How we're doing, without being judged.* Curiosity
  and gentle pride — the family's food life visible as growth, met from
  where they are (§ 5.5: never assessed, never behind on a target the
  product invented).
- **Room / place analogy.** The noticeboard in the kitchen where the
  family's things get pinned — next to the window with the garden view. You
  glance at it; it never grades you.
- **Relationship to the orchard.** **E2 — the window as meaning.** Nutrition
  is where the orchard's *meaning* (life, growth, variety) and the
  household's data actually touch: thirty plants a week IS the orchard in
  spreadsheet form. The window presence sits beside the summary tier; the
  tables below are solid working ground (dense data never sits on
  landscape — today's translucent nutrient tables violate exactly this,
  § 7).
- **Quality and direction of light.** Bright and optimistic — garden light.
  The summary tier (the one score that matters, in plain language) stands in
  the light; methodology and tables wait in even working light below.
- **Material and depth character.** Two-register room: a warm noticeboard
  tier (the plant-diversity count, the one headline, pinned-note simplicity
  ON the ground plane) above a solid, quiet, well-ordered data tier
  (evidence available to whoever asks, imposed on nobody — Visual Trust law
  unchanged).
- **One subtle living detail.** **The garden filling in**: the 30-plants
  progress rendered as the room's one warm fact — count and phrasing growing
  week by week ("14 of 30 plants this week — 5 new"). Pure data, already on
  the surface today; the detail is *treating it as the household's garden*
  in copy warmth and placement, not adding imagery. (The magnetic-letters
  idea from the brief was considered for this room and declined — § 5.3.)
- **Primary visual anchor.** The one summary fact (plants this week / the
  score that matters) — the pinned note everything else supports.
- **What must remain canonical.** NK1/NK2 knowledge ownership; evidence and
  confidence presentation (no precision theatre); status colour law; the
  non-judgemental voice.
- **Risks of gimmick / literalism.** Drawn pins, cork texture, or leaf
  clip-art on the count (all forbidden); growth imagery that implies a
  *target owed* rather than an invitation (the garden fills in; it is never
  behind); gamification pull (streaks, badges — forbidden by Principle 10).

---

### 4.7 DIARY — the quieter personal corner

- **Emotional purpose.** *A private word with yourself.* The most personal
  room: reflection without observation, honesty without audit. The person
  writes here; the product mostly listens.
- **Room / place analogy.** The window seat — the corner chair with the
  morning light on it, slightly apart from the kitchen's traffic, still in
  the same house and the same daylight.
- **Relationship to the orchard.** **E2 — the window, softly.** A quieter
  aspect of the same morning: present, bright, alive — but the room's
  attention is inward. Critically: quiet ≠ dim. The Diary is the room most
  at risk of the spa/dusk drift (§ 3A.4), and its art direction must say
  *morning corner*, never *evening retreat*.
- **Quality and direction of light.** A soft pool of the same upper-left
  morning on the writing surface — the most focused light in the house
  (light gathered, not reduced). Around the pool, calm warm canvas.
- **Material and depth character.** One intimate ground plane — the lap
  desk, smaller and more enclosed than any other room's, generous air around
  it. The day's log slots are quiet anchored rows; the writing surface is
  the solid object. Density lowest in the product.
- **One subtle living detail.** **Yesterday's trace**: one quiet line of the
  household's own recent word ("Yesterday you logged three meals" / the last
  mood noted), present only when true, absent in silence otherwise. The sign
  that the corner remembers you — data-borne, one line, never analysed back
  at the person unasked.
- **Primary visual anchor.** Today's page — the log surface.
- **What must remain canonical.** Diary data privacy and ownership; the
  non-judgemental register (BMI/kcal presented as the person's own numbers,
  no verdicts); form anatomy; honest empty states.
- **Risks of gimmick / literalism.** Leather-journal or lined-paper
  skeuomorphism (forbidden); the quiet corner drifting cold/dark/spa-like
  (§ 3A.1 — the palette's whole warning was discovered near rooms like
  this); "reflective" copy becoming therapeutic performance; the trace line
  growing into an unasked analysis of the person.

---

### 4.8 ANALYSER — the work surface for understanding food

- **Emotional purpose.** *Let's look at this properly.* Focused curiosity —
  the household's capable instrument for seeing what's actually in a
  product. Confidence through evidence; never fear, never chemistry-lab
  coldness.
- **Room / place analogy.** The clear counter where you set a product down
  and look at it in good light — the kitchen's work surface, not a
  laboratory. (The distinction is the room's whole temperature: a lab
  examines specimens; a kitchen counter examines *groceries*.)
- **Relationship to the orchard.** **E1 — light only** when working: the
  best task light in the house on a solid bench; the analysis itself is the
  view. **E2 before the first scan** — the honest empty bench may sit
  by the window (rule § 3.2), with one plain invitation. Today's Analyser
  empty state is the single worst wallpaper offence — a full-screen
  landscape with a search box, all view and no bench (§ 7) — and this room
  is where the exposure law pays for itself most visibly.
- **Quality and direction of light.** The clearest, most even light in the
  product — upper-left as everywhere, at working brightness. Clarity is this
  room's warmth (Principle F: clarity is one of light's five permitted
  meanings).
- **Material and depth character.** The bench: one solid ground plane
  holding the examined product as the primary object — the scanned item's
  card is the most "object on a surface" moment in the product (it is,
  conceptually, a physical thing set down). Results in the canonical
  evidence/confidence presentation; alternatives as supporting surfaces in
  penumbra.
- **One subtle living detail.** **Where you left off**: the last-analysed
  product remains quietly on the bench on return (one low card, "Looked at
  yesterday"). A used workbench holds the trace of its last job — pure
  history data the domain already owns.
- **Primary visual anchor.** The analysed product and its rating — the thing
  on the bench.
- **What must remain canonical.** Analyser capability ownership (capability
  card); Apple-rating presentation (one apple, one semantics); Visual Trust
  in full (this room lives or dies by honest confidence); barcode/scan
  journeys; RM-series Analyser→Planner handoffs.
- **Risks of gimmick / literalism.** Lab theming (specimen framing, clinical
  white — § 3A.1 *clinical* is named for this room); alarmism in UPF results
  (danger tier reserved for genuine safety); the bench metaphor adding any
  step to scan→result (function first, always).

---

### 4.9 HOUSEHOLD / PROFILE — the family record

- **Emotional purpose.** *This is us, and it's in good hands.* The trust
  room: who we are, what THA knows, all of it visible, correctable, and
  owned by the household (§ 5.8: no dark corners).
- **Room / place analogy.** The hallway shelf where the family's records
  live — the address book, the noted allergies, the emergency numbers.
  Ordered, respectful, slightly formal by the house's standards, and still
  warm.
- **Relationship to the orchard.** **E1 — light only.** A hallway room: lit
  by the same morning through the house, no window of its own. Settings and
  data forms never sit on landscape (today they do, translucently — § 7).
- **Quality and direction of light.** Even, honest, unshadowed — the light
  you read a record by. Nothing dramatised.
- **Material and depth character.** The record: one solid, calm ground
  plane; sections as anchored strata (the settings-row pattern already
  canonical); the household members' identity tier the only warm-forward
  element. Density modest, forms in canonical anatomy.
- **One subtle living detail.** **The family, first-class**: the member tier
  leads the room — names, the household-shape sentence ("1 adult · 2
  children"), each member's presence rendered warmly (the canonical avatar
  treatment, nothing new). The record's sign of life is *who it is a record
  of.* Already present today in chips; the detail is promoting it to the
  room's opening warmth rather than metadata.
- **Primary visual anchor.** The household members tier.
- **What must remain canonical.** `server/lib/access.ts` as the sole
  authority on who anyone is; profile/household capability cards; consequence-
  proportional guards; the effect-of-change transparency (§ 5.8).
- **Risks of gimmick / literalism.** Family-album theming (photo-corner
  frames — forbidden); warmth tipping into cuteness on what is ultimately a
  trust surface; the formal register tipping into institutional coldness
  (the record is the family's own, not a form the state sent).

---

### 4.10 COMPANION — a calm presence with a permanent place

- **Emotional purpose.** *Someone knowledgeable is in the house, and they
  wait to be asked.* Present, mannerly, on your side (Principle 7). The
  Companion is not a room — it is the **person in the house** — and that
  distinction drives everything.
- **Room / place analogy.** The friend at the kitchen counter: always in the
  same place, comfortable in every room, never following you around the
  house talking.
- **Relationship to the orchard.** None of its own — the Companion is IN the
  rooms, not a room. Its panel is foreground (the nearest plane, already
  correct per EXP4) and carries the house's warmth, not a view. It *speaks
  about* the orchard's world; it does not display it.
- **Quality and direction of light.** The panel shares whatever room it
  opens in — same warmth, same morning. It is never differently lit (a
  differently-lit companion becomes a stage).
- **Material and depth character.** The floating layer, as today — the one
  surface that genuinely floats, and proven to need nothing more. Inside the
  panel: the same ground/air vocabulary at conversational density. Today's
  open panel is one of the coldest surfaces in the product (a tall bare
  void between greeting and input — § 7); its fix is the house vocabulary
  (warmth, one anchored surface, honest quiet), not new invention.
- **One subtle living detail.** **It arrives a beat after you** (EXP2-D,
  EXP3 standard): in every room, the Companion joins *after* the person has
  arrived — manners as motion meaning. This is already proven, costs one
  timing constant, and is the Companion's entire sign of life. Nothing else:
  no pulsing, no typing theatrics, no simulated mood.
- **Primary visual anchor.** The one FloatingAssistant mark, bottom-right,
  identical in every room — the fixed chair at the counter.
- **What must remain canonical.** Everything: one Companion, INT17 context
  composition, notice engine ownership, § 5.7's honesty rhythm, the withheld
  channel, permission-aware knowledge (PKR2 § 12).
- **Risks of gimmick / literalism.** A face, an avatar, emotional theatrics
  (forbidden by UIA § 10); the panel acquiring its own atmosphere or view;
  presence-signalling (glow, bounce) instead of presence-by-manners.

---

### 4.11 ADMIN — the organised working room, still recognisably THA

- **Emotional purpose.** *The house is well kept.* Operational confidence
  for the people who maintain THA — dense, honest, legible, and calm.
  Quieter and denser by necessity, never louder, never anxious, never a
  second product (§ 5.9).
- **Room / place analogy.** The study off the hall — the organised working
  room: files in order, good task light, the same house's floorboards. The
  door is plain; the room is private; nothing about it is a different
  building.
- **Relationship to the orchard.** **E0 — lit from the hall.** No orchard
  image: admin surfaces are the one place the view earns nothing and dense
  truth earns everything. The connection to the house survives entirely in
  the tokens: the same warm canvas, the same type voices, the same light
  temperature, the same component owners. Recognisably THA with the window
  shut.
- **Quality and direction of light.** Even task light, same direction, no
  atmosphere spend. The warmth floor still applies — admin must never drop
  to clinical grey (§ 3A.1 applies to admin *explicitly*; § 5.9 already says
  the rhythm does).
- **Material and depth character.** Solid working ground everywhere; tables
  and dense data in the canonical desktop-table exemptions (recorded in the
  register, per layout law); depth spent only on genuine floating.
- **One subtle living detail.** **None — deliberately.** Restraint is
  admin's detail. (If one is ever wanted: honest currency — real
  `last verified` timestamps rendered plainly — is the only candidate, and
  it is a trust device, not a charm.)
- **Primary visual anchor.** The system-state summary of each admin surface.
- **What must remain canonical.** The shell (admin is not exempt); the state
  law; destructive-operation guards; honest failure; one voice.
- **Risks of gimmick / literalism.** Any spend of place-character here is
  itself the gimmick — admin's risk runs the other way: drifting cold,
  grey, and "internal so it doesn't matter." It matters; it is the same
  house.

---

### 4.12 The map at a glance

| Domain | Place | Exposure | Light character | Ground posture | Living detail (max one) |
|---|---|---|---|---|---|
| Home | Threshold / heart | **E3** | Full morning | Compact counter | Greeting in THA's hand |
| Planner | Family table | **E1** | Even working light; sun on today | The table (one solid grid ground) | The sun on today |
| Cookbook | Recipe book by the window | **E2** | Side-light across the page | Shelf + object-cards | The well-thumbed page |
| Shopping | The list by the door | **E1** (E2 empty) | Plain bright | One note-sized ground | The crossing-off |
| Pantry | Pantry, orchard beyond | **E2** (smallest window) | Practical, morning-warm | Shelf strata | Freshness, honestly told |
| Nutrition | Noticeboard / garden view | **E2** | Garden-bright | Noticeboard tier over solid data tier | The garden filling in |
| Diary | Window seat | **E2** (soft) | Gathered pool of morning | Lap desk, most air | Yesterday's trace |
| Analyser | The work bench | **E1** (E2 before first use) | Clearest task light | The bench + object-card | Where you left off |
| Household | Family record | **E1** | Even, honest | The record | The family, first-class |
| Companion | The friend at the counter | — (foreground) | The room's own | Floating (unchanged) | Arrives a beat after you |
| Admin | The study | **E0** | Task light, warm floor | Solid working ground | None — deliberately |

---

## 5. THE LIVING DETAILS LIBRARY

### 5.1 The laws of a living detail

"Lived-in" is the palette's hardest word (§ 3A.2) and the easiest to fake.
The library therefore opens with its constitution:

1. **One per domain, maximum.** Not one *kind* — one, full stop. A second
   living detail in a room retires the first in the same decision.
2. **Data-borne or dead.** Every living detail renders something TRUE from a
   canonical owner — the clock, the plan, cook counts, list state, freshness
   data, plant counts, diary history, analysis history, household membership,
   the withheld-channel timing. **A living detail is the household's own life
   showing through the surface.** A painted prop (drawn fruit bowl, fake
   steam, decorative crumbs) is fabricated feeling — § 7 of the Experience
   Language names it, and it is forbidden here by construction.
3. **Honest in absence.** When the data is silent, the detail is absent, and
   the room is still complete (EXP2-D's law: no notice, no note). A detail
   that must invent content to exist is not a detail; it is filler.
4. **Below the emphasis budget.** A living detail never competes with the
   primary, never carries status meaning, never animates for attention.
   Removable without functional loss — its loss would be felt only as a
   slight cooling (that felt cooling is the test that it was working).
5. **Still.** No living detail moves. Life is warmth and evidence-of-use,
   not animation (the one exception, already governed: the Companion's
   arrival beat, which is motion *meaning* manners).
6. **Admitted one at a time.** Each detail ships as a named, reviewable
   decision against § 6's review questions — never as a batch of charm.

### 5.2 The library

| Detail | Domain | Data source | What it says | Ceiling |
|---|---|---|---|---|
| **Greeting in THA's hand** | Home | Clock + household name | *You were expected* | Signature voice stays arrival-only (UIA § 8); once per day at most |
| **The sun on today** | Planner | The calendar | *The week has a "now"* | A half-step of warmth/brightness; never a colour, never a border |
| **The well-thumbed page** | Cookbook | Cook/plan counts | *This book is used* | A half-step surface warmth; never a badge, rank, or label |
| **The crossing-off** | Shopping | List item state | *The trip is working* | Struck + settled into shade; no celebration per item |
| **Freshness, honestly told** | Pantry | Item freshness data | *The food in here is alive* | Canonical status vocabulary; helpful words, never guilt |
| **The garden filling in** | Nutrition | Plant-diversity counts | *Variety is growing* | Copy + the existing count; no leaf imagery, no streaks |
| **Yesterday's trace** | Diary | The person's own last entry | *This corner remembers you* | One line, only when true, never analysed back unasked |
| **Where you left off** | Analyser | Analysis history | *A used bench* | One low card; disappears when stale |
| **The family, first-class** | Household | Household membership | *This is a record of people* | Canonical avatar/name treatment; no album theming |
| **Arrives a beat after you** | Companion | Withheld channel timing | *Manners* | The proven ~1.2s beat; no other presence signal, ever |

### 5.3 Considered and declined (recorded so it is not re-asked)

- **Magnetic letters on a fridge** (from the mission brief). Declined. It is
  the one example in the brief that cannot pass law 2: fridge letters that
  spell something are either fabricated content (a prop arranged by the
  product) or a new user-content feature (a real magnetic-letter toy —
  charming, but a *feature investigation*, not an art direction detail, and
  one that would need an owner, moderation thinking, and a reason to exist
  beyond charm). As art direction it is also the most literal-furniture
  item on the list — the exact skeuomorphic edge the mission forbids.
  If the *spirit* of it (family playfulness on a kitchen surface) is wanted,
  the honest carrier already exists: the household's own names and words
  appearing where they truly live (Household's member tier, the greeting,
  Planner meal names). Recorded per the declined-discovery discipline
  (Rule KC12's spirit) so a future audit does not rediscover and re-ask it.
- **Orchard reflection sweeping across cookbook card surfaces** (brief
  example). Declined as stated — a moving reflection is a light effect
  performing (Principle F). Admitted instead in still form: the Cookbook's
  window-side warmth gradient (§ 4.3), which is the same idea with the
  motion removed.
- **Steam, crumbs, worn edges, seasonal dressing.** Declined categorically —
  props, all fabricated (law 2), and seasonal dressing additionally breaks
  "one orchard, one season" (§ 3.4).

---

## 6. WHAT ALREADY SUPPORTS THE CONCEPT

The concept is not a reboot; a real fraction of it is already standing:

1. **One canonical shell, byte-stable across realms** — WorkspaceHeader, the
   bottom navigation, one way home. The walls exist and are trusted (the
   EXP2–EXP4 prototypes proved they can carry radical inner change
   untouched).
2. **One orchard asset behind the whole product** — today's problem is its
   *uniform strength*, but its singularity is exactly right: one world, one
   owner, already shared. The exposure scale (§ 3) is a modulation of an
   asset that already exists, not a new painting per realm.
3. **Realm tints as wayfinding** — the bottom-nav chips already whisper
   per-realm identity inside one system (cookbook warm, diary plum, pantry
   green…). The rooms already have door-plates; they lack interiors.
4. **The warm canvas and palette** — Calm Orchard's cream-warm neutrals are
   the house's daylight already; nothing about the base temperature needs
   correcting, only protecting (several conflicts below are drifts *from*
   it).
5. **"Welcome Home, Chloe." + "How can I help your family today?"** — Home
   already speaks arrival and personhood; EXP3-S1 sharpens rather than
   replaces it.
6. **The state sentence and Home hierarchy** (EXP2-C, reconfirmed EXP4) —
   Home's room-shape is designed and proven, awaiting adoption.
7. **EXP4's entire material vocabulary** — ground plane, one light, warm
   shadows, penumbra, anchored support, generous air: the middle ground this
   concept requires has already been prototyped and photographed in three
   studies on Home.
8. **The Companion's fixed place** — one mark, bottom-right, every realm.
   The friend already has their chair; the withheld channel already enables
   the manners beat.
9. **Shopping's handwriting-idiom input** — the one surface that already
   *feels* like a domestic object (a note you write on); the concept extends
   its logic rather than inventing it.
10. **Per-realm subnav pills** (Inventory/Larder/Fridge…, Foods/Nutrients…,
    Daily Log/Progress) — one consistent pattern giving each room internal
    geography without forking navigation: the same door handles in every
    room.
11. **The honest-state law and Visual Trust** — the discipline that will keep
    living details honest already governs every surface.
12. **The dev-prototype discipline itself** — compile-time dev routes, parity
    controls, binary disposition, capture evidence: the machinery for testing
    rooms without touching the house is built and battle-tested four times
    over.

## 7. WHAT CURRENTLY CONFLICTS WITH THE CONCEPT

Named so the prototypes and any adoption workstream know their targets. None
of these is fixed by this investigation.

1. **The orchard as uniform wallpaper (every realm, ~E3, one plane).** The
   central conflict; §§ 1.1 and 3 exist because of it. Worst cases: the
   **Analyser empty state** (a full-screen landscape with a search bar — all
   window, no room; reads as *nobody home*) and **Shopping** (a small note
   above two-thirds of a screen of raw landscape — the orchard as filler,
   § 8's "filling space because it looked empty").
2. **No middle ground anywhere.** Translucent cards sit directly on the
   environment product-wide; nothing stands between world and content.
   Consequences everywhere: Pantry's floating checklists, Nutrition's
   see-through data tables, Profile's translucent settings forms, Diary's
   washed log rows — all below EXP4-C's "anchored, never naked" floor, all
   paying legibility for atmosphere.
3. **Dense data over landscape.** Nutrition's ingredient tables and
   Planner's grid ask real reading work against a pictorial background —
   the exact combination rule § 3.3 forbids.
4. **The Planner's wash.** The yellow-green veil over the week grid is
   neither table nor light: it muddies cells, dulls text contrast, and makes
   the densest room the *least* clear one. It is the one place the current
   orchard treatment actively fights function.
5. **Instructional banners posing as rooms' first words.** Planner, Pantry,
   Diary and Analyser all open with dismissible how-to strips ("Plan your
   meals for the week ahead…", "Add the ingredients you have at home…",
   "Log what you eat each day…"). A home does not greet you with signage;
   these are work stapled to arrival (Principle C) and they occupy the
   orientation beat in four rooms at once.
6. **Rooms with identical interiors.** Beyond the nav chip, nothing inside
   Planner/Pantry/Nutrition/Diary differs in light, material, or warmth —
   the "many places" half of the concept currently has zero expression.
7. **The Companion panel's cold interior.** Open, it is a tall bare void —
   greeting at top, input at bottom, silence between — the § 3A.1 *empty*
   temperature at the exact moment the product's friendliest presence
   speaks.
8. **Diary's clinical opening.** BMI "–", kcal "–", "Moderate/Optimal" in
   status green: the most personal room opens as a measurement panel —
   correct data, wrong temperature (and status colour spent on
   non-status).
9. **Home header vs realm headers.** The Home screenshot shows a compact
   logo+title strip; every other realm shows the large stacked-logo header.
   Two shell presentations is either an intentional, register-recorded
   Home exception or a Principle 9 drift — it must be resolved to ONE
   answer before Home becomes the flagship room (§ 9.3, unresolved).
10. **Empty states that are holes, not designed calm.** Shopping-empty and
    Analyser-empty currently *are* the wallpaper problem; Diary's empty
    slots are five identical "Empty +Add" rows — honest but unwarmed, a
    missed "place not yet set" moment.
11. **The flat-surface law itself (UIA § 4), knowingly.** As EXP4 § 6
    already declared: the ground plane, penumbra and warm shadows this
    concept assumes sit past "flat, frosted, calm" and require a governed
    UIA amendment to graduate. EXP5 inherits that dependency and adds the
    exposure scale and per-domain light/material values to the same
    amendment's scope (§ 9.2).

## 8. RECOMMENDED PROTOTYPE DOMAINS (DEVELOPMENT-ONLY)

Three rooms, chosen so the three registers of the house each get tested once
— arrival, browsing, working — and every rule in §§ 2–5 gets exercised by at
least one of them:

1. **HOME — the flagship room (E3).** The anchor: EXP4's materials already
   photographed here; EXP3-S1's arrival lands here; the exposure scale's top
   level and the "compact counter before the open view" composition exist
   nowhere else. Home proves *the home*. (Prototype = EXP4's A+B+C synthesis
   composed as one room, with the state sentence, support demotion, and the
   greeting detail — effectively the adoption candidate EXP4 § 5 already
   requested photographs of.)
2. **COOKBOOK — the E2 window and the warmest room.** Tests the framed
   window (orchard present but committed to a region), the shelf ground
   under a browsing grid, object-cards with lift/settle at scale, food
   photography as the room's colour, and one patina-class living detail
   (the well-thumbed page). Browsing is the register Home cannot test.
3. **PLANNER — the hard case (E1).** The proof that place never interferes
   with function: the densest grid becoming one table, the sun-on-today
   detail staying under the emphasis budget, the wash conflict (§ 7.4)
   resolved by ground-not-veil, and the E1 claim ("you feel the orchard you
   cannot see") tested where it is least forgiving. If the concept survives
   the Planner, it survives everywhere.

(Pantry was the runner-up — its small window is the concept's purest emblem —
but it shares E2 mechanics with Cookbook while testing less that is new.
Diary is deliberately *not* an early prototype: it is the room most at risk
of the dusk-drift, and it should be composed after the house's warmth
vocabulary is settled by the other three, not while it is still being found.)

## 9. RECOMMENDATION FOR THE FIRST PROTOTYPE WORKSTREAM

### 9.1 EXP5-P1 — "The First Room": Home at E3

One workstream, one dev-only route (`/dev/place-home`), EXP2's proven
scaffolding (shared data hook, parity control, compile-time route, capture
evidence, binary disposition):

- **Compose, don't invent.** EXP4 § 5's requested synthesis — A's ground,
  B's light, C's air — assembled as one room for the first time, plus the
  three already-recommended Home ideas (state sentence, support demotion,
  Companion beat) and the § 4.1 exposure composition (compact counter, open
  view around it, orchard never under text).
- **Why Home first.** Every ingredient is already individually proven on
  Home; the workstream is the cheapest possible test of the *composition*,
  and it produces the reference photograph every other room will be
  calibrated against ("the house's warmth is THIS"). It also forces the two
  open questions that block everything else: the UIA § 4 amendment shape
  (§ 9.2) and the Home-header question (§ 7.9).
- **Explicit deliverables.** Desktop + mobile stills and recordings;
  the § 6 Experience Review Questions answered in writing; a drafted (not
  enacted) UIA amendment covering: the middle-ground/ground-plane law, the
  one-light law, warm-shadow values, penumbra with measured contrast, and
  the E0–E3 exposure scale as named tokens.
- **Then** EXP5-P2 Cookbook and EXP5-P3 Planner as separate follow-ons, each
  a fresh decision informed by P1's photographs.

### 9.2 Governance path (nothing moves without it)

This investigation changes no law. For any of it to ship: the depth/light
material vocabulary requires the **governed UIA § 4 amendment** EXP4 § 6
already specified; the exposure scale and per-domain light values enter as
**semantic tokens by admission** (UIA § 16); any living detail is admitted
**one at a time** against the Experience Review Questions; realm *place
character* beyond wayfinding tint extends UIA § 4's realm-tinting clause and
belongs in the same amendment. Per-domain rhythm and behaviour stay owned by
the Experience Architecture; feeling by the Experience Language; this
document proposes and owns nothing runtime.

### 9.3 Architecture conflicts and unresolved ownership questions

1. **UIA § 4 flat-surface law vs the middle ground** — known, inherited from
   EXP4, resolved only by governed amendment.
2. **UIA § 4 realm-tinting clause ("wayfinding only") vs room character** —
   light-exposure and ground-posture per domain go beyond tint; the
   amendment must either extend this clause or the concept must shrink to
   fit it. Needs an explicit decision.
3. **Who owns the orchard?** The environment asset is shared but this
   investigation found no named canonical owner for it (no capability card,
   no register row for the backdrop system). Before exposure levels can be
   governed values, the orchard needs one owner the way every other visual
   concern has one (UIA § 17). **Unresolved.**
4. **Home's header vs the realm header** (§ 7.9) — one shell or a recorded
   exemption; currently neither is documented. **Unresolved.**
5. **Dark mode** — the entire light vocabulary is designed in daylight;
   EXP4-B's dark-mode gap ("lamplight?") now scales to the whole house and
   remains real, unexplored design work. Any adoption offering dark mode
   must resolve every exposure/light token in it (UIA § 7's complete-mode
   law).
6. **The instructional banners** (§ 7.5) — retiring or relocating them is
   behaviour, owned by the Experience Architecture, and should be its own
   small workstream regardless of what happens to this concept.

## 10. DISPOSITION

This is an investigation — point-in-time analysis, history the moment it is
read (PKR1's law). It implements nothing and owns nothing. Its proposals
live or die by review:

- **PROCEED** — approve EXP5-P1 (§ 9.1) as the next workstream; Cookbook and
  Planner prototypes follow as separate decisions.
- **REVISE** — correct the concept here before any prototype.
- **DECLINE** — the document remains as the recorded exploration of a door
  not taken.

---

*Files created:* `docs/investigations/ux/EXP5_ONE_HOME_MANY_PLACES.md` (this document), `.engineering/session/runs/EXP5_One_Home_Many_Places.md`, one row in `.engineering/session/CURRENT.md`.
*Untouched:* all governing architecture, all UI and production code, all live surfaces, all prior prototypes and their pending decisions (ARRIVAL1, EXP2, EXP3, EXP4).
*Rollback:* `rollback/EXP5-one-home-many-places-20260715` → `b3c650cd` (tag over committed state; this workstream's own files are new and removable by deletion).
