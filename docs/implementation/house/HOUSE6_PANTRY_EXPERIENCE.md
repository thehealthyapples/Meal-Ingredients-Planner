# HOUSE6 — The Pantry

**The third room in the house. Home is the Entrance Hall you come home to; the Kitchen is the working
heart you cook in; the Pantry is the shelves you keep — where food lives.** Same house, its own
personality. This document defines the permanent Pantry: the emotional blueprint that governs the Pantry
experience, designed at desktop · tablet · mobile, and rendered so it is judged rather than asserted.

| | |
|---|---|
| **Session** | `HOUSE6_PANTRY_EXPERIENCE` |
| **Date** | 2026-07-18 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/HOUSE6-PANTRY-EXPERIENCE-20260718` → `7bfad50c` (tag `house6-pantry-experience-wip-snapshot-7bfad50c`; working-tree snapshot object `b7d66cbf`) |
| **Status** | **Blueprint complete. Rendered at three breakpoints in two views. Awaiting owner decision, then the gated build.** 6 viewport renders; E2 + honesty sanity 6/6 clear; Fraunces real. |
| **Product changed** | **None.** Standalone composition (`scripts/north4-concepts/pantry-experience.html`); `pantry-page.tsx` / `index.css` not opened. Canonical `ORCHARD.png` referenced in place; no substitute authored; no invented fullness presented as a real household's stock (warm generic staples stand in for the household's own pantry, as Arrival used a placeholder name and the Kitchen used placeholder dishes). |
| **Builds on** | `HOME_ARRIVAL_PRODUCTION_LOCK` and `HOUSE5_KITCHEN_EXPERIENCE` (the house language it inherits) · the Experience Blueprint's Pantry row (§ 5.1) · the Orchard Living Book's *The Pantry Shelves* · TRANSLATION1's *Shelving* · the Intelligence Language Guide § 4.4 · `BRAND2` (the pressed apple) · `COMP1` (the Companion). |
| **Filing note** | Filed in `docs/implementation/house/` (with `HOUSE5`), per `repo-structure-verify.sh` rules 3 & 8 — `docs/implementation/` permits no loose files and `HOUSE[0-9]` reports live in `house/`. The brief's `docs/implementation/HOUSE6_PANTRY_EXPERIENCE.md` path would fail both checks. |

---

## 0. Why this room, and why now

The house is being built one room at a time, in the order the canon set. `HOME_ARRIVAL_PRODUCTION_LOCK`
locked Home (the Entrance Hall). `HOUSE5_KITCHEN_EXPERIENCE` drew the Kitchen (the Cookbook) — and named,
in its § 8.4 production list, a defect this room inherits: *"favourites, discoveries, traditions and
seasonal habits are … rendered in the Pantry behind a heart emoji, and three of five are unreachable."*
The Kitchen claimed those stories as *its* well-thumbed warmth. So the Pantry arrives with a question
already half-answered: **if the recipe book's memory belongs in the Kitchen, what is the Pantry actually
for?** This document answers it — the Pantry is not where recipes are remembered; it is **where food
lives.**

**What this is, and is not.** This is a **design blueprint** — the emotional identity, architecture,
interior, journey, and the rules the Pantry must obey — rendered at three breakpoints. It is **not**
implementation, and it does not re-open Home or the Kitchen. Every rule below traces to an owner; **if any
statement here restates a rule owned elsewhere, the owner prevails and this file is corrected** (the yield
clause the whole house obeys).

**Read before starting:** `docs/architecture/README.md`, `HOME_ARRIVAL_PRODUCTION_LOCK.md`,
`HOUSE5_KITCHEN_EXPERIENCE.md`, the Experience Blueprint's Pantry row (§ 5.1) and Exposure Scale (§ 6.2),
the Orchard Living Book's *The Pantry Shelves*, the Orchard House Design Blueprint § 13.4, the Intelligence
Language Guide § 4.4, and TRANSLATION1's *Shelving*. Git status confirmed and the rollback created before
any change.

---

## 1. The one line the whole room is built on

The Experience Blueprint already names this room in a single row (§ 5.1 / § 175):

> **Pantry · "the pantry, orchard beyond" · E2 — the smallest window · Practical, morning-warm · Shelf
> strata · Freshness, honestly told.**

Every decision in this document is downstream of that row. The Pantry is **not** "the pantry page with
nicer styling" — it is *the pantry, orchard beyond*, and the four other cells (the **smallest** window in
the house, practical morning-warm light, the **shelf strata**, and *freshness honestly told*) are the whole
design brief, already written. This document's job is to make them one legible room — the one whose entire
content is **what the household already has, told kindly.**

And the Living Book already tells you how it must feel (*The Pantry Shelves*):

> *"You open the cupboard to see, honestly, what is in the house right now. Not what you should have. Not
> what you've run out of, held up as a failing. Just the plain truth of the shelves, told kindly … its
> whole grace is honesty without guilt."*

---

## 2. Emotional philosophy

**The Pantry is the honest room. Home welcomes you; the Kitchen feeds you; the Pantry tells you the truth
about what is in the house — and its whole grace is honesty *without guilt*.** It is the most practical
moment in the house, and the most quietly reassuring: you open the cupboard and simply *see* — what's here,
what's fresh, what's getting on — with nothing to feel bad about (Living Book, *The Pantry Shelves*).

The mission asks for five feelings, and refuses four. Each of the five has an owner in the design, and each
of the four nevers has a single, specific defence:

| It must feel | How the room produces it |
|---|---|
| **Abundant** | The shelves are **full of real things**, generously laid out with air around them — a stocked home *is* abundant. But the abundance is **honest, never painted**: what's there is what's there, and the room never invents fullness to look richer than the cupboard is (Living Book, *"never … invented fullness pretending the cupboard is more than it is"*). |
| **Calm** | E2 restraint and the **strata order** — Larder, Fridge, Freezer, each on its own oak shelf line, everything in its place. A quiet serif voice, matte plaster, the smallest window in the house. Never a dashboard, never an alarm. |
| **Organised** | **Shelf strata** (Blueprint § 5.1). The reassurance of *legible order* — knowing where things are and seeing them plainly, in their places (TRANSLATION1 *Shelving*; Experience Language § 5.6). Grouped the way a home groups food, not the way a database sorts rows. |
| **Inspiring** | The Companion connects **what you have** to **what you might do** — *"there's still a good bit of that squash — it'd be lovely in Sunday's traybake"* (IntLang § 4.4). Inspiration here is a welcome piece of noticing, never a task and never a nudge to buy. This is the room's bridge back to the Kitchen. |
| **Quietly intelligent** | *Freshness, honestly told* — the room reads the food's real state and says it in **helpful human words**, and the Companion surfaces a genuinely-there opportunity and **stays silent when nothing connects** (Living Detail § 12.2; IntLang § 4.4). Intelligence shows as *helpfulness*, never as analysis performed at you. |

**It must never feel like** stock management, a spreadsheet, or supermarket shelving. The single spine that
defeats all three is the same: **this is *their* pantry, and freshness is a kindness, not a count.**

| It must never feel like | The specific defence |
|---|---|
| **Stock management** | No par levels, no reorder points, no "low stock" red, no expiry countdown as an alarm. Freshness is *told* — "fresh", "use soon", "getting on" — in warm words, **never a warning system** (Living Book; Living Detail § 12.2 ceiling; rule P2, P12). |
| **A spreadsheet** | Items are **small objects standing on a real oak shelf**, grouped in strata — never rows and columns of quantities, never a sortable data grid. One ground, never nested (Blueprint § 8.2; TRANSLATION1 *Shelving*; rule P6). |
| **Supermarket shelving** | Warm oak and matte plaster — the Kept House — grouped the way a *home* groups its food (the cupboard, the cold shelf, the bottom drawer), never chrome retail gondolas, never merchandised to sell, never faked into a fully-stocked store (Living Book; Blueprint § 4.1; rule P5). |

> **The philosophy in one line:** *the Pantry is the household's own shelves, seen honestly in the plain
> morning light — abundant when the cupboard is full, calm and warm when it is not, and never once made to
> feel like a failing.*

---

## 3. Architectural blueprint

The Pantry is the same architecture as Arrival and the Kitchen — **NORTH4 Concept B** — with **one
deliberate move that gives it its own personality: the window shrinks to its smallest, and the shelves
become the hero.**

### 3.1 The move that makes it the Pantry — the smallest window (E2, the narrowest in the house)

Arrival is **E3**: the orchard is a full generous wall and *the view is the purpose*. The Kitchen is **E2**
with the window turned to the **side**, so *the food is the hero*. The Pantry is **E2 at its narrowest** —
*"the orchard is at its smallest here, the narrowest window in the house, because this is a working
cupboard and the work is looking, checking, knowing"* (Living Book). So the orchard recedes to **one small,
high window in the corner**, and the rest of the room becomes **shelf** — honest strata of what's in the
house.

This single change does three things at once:
1. **It differentiates the room without leaving the house.** Same orchard, same oak, same one morning — but
   the emphasis moves all the way from *the view* (Home) past *the food* (Kitchen) to **the shelves
   themselves**. You are not looking out, and not looking down at what you cook; you are looking *in* at
   what you have.
2. **It obeys E2 honestly, and most strictly of all.** The orchard is one committed region the content
   never covers — the *smallest* such region in the house. Verified on every render: no reading content
   (item name, tier name, heading) ever crosses onto the glass (6/6 clear).
3. **It lets the shelves be the hero.** With the window reduced to a glimpse, the whole room is the
   **strata** — and the strata are the honest truth of the house.

### 3.2 The planes of the room

| Plane | What it is | Owner |
|---|---|---|
| **The shelf strata** | The room's hero. Open oak shelving in **tiers** — Larder, Fridge, Freezer — grouped the way a home groups food, with a shelf line beneath each tier (*"the strata of the middle ground"*). Each item is a small object resting on the shelf. | Blueprint § 5.1 (Shelf strata), § 8.2; TRANSLATION1 *Shelving* |
| **The small window** | One committed orchard region, **the smallest in the house**, high in the corner — real joinery (head reveal, jamb returns, a mullion), the same view as Arrival, now a glimpse from the working cupboard. | Blueprint § 5.1 (E2), § 6.2 |
| **The oak ledge** | A short shelf lip beneath the window — *not* the Kitchen's working worktop, but the pantry's own sill, where the Companion's line rests. | TRANSLATION1 *Shelving*; HOUSE5 § 3.2 (differentiated from the worktop) |
| **The plaster** | The matte, hand-troweled Kept House wall, carried verbatim; warm near the small window, cooler in the depth of the cupboard. | HOME_ARRIVAL_PRODUCTION_LOCK § 3.2 |
| **The pressed apple** | The sole brand mark — the THA apple pressed into the plaster by the ledge, tone-on-tone, discovered not displayed, exactly as in Arrival and the Kitchen. | BRAND2 § 6 |
| **The doors** | The constant shell along the floor — you can leave the Pantry for any room. "Pantry" reads as *here*. | Experience Blueprint § 14 |

### 3.3 The light

**Practical and morning-warm** — *"the light you'd want to actually see the shelves by"* (Living Book). Not
the wide-open aspect of Home, not the raking side-light of the Kitchen: the plain, honest light of a
working cupboard, warm near the small window and softening into the depth of the shelves. This is a wash on
plaster, **never a second sun** (Blueprint § 16): no glow is added to the orchard. The season **never**
changes the light (§ 7, rule P8).

---

## 4. Interior language

Carried from Arrival's and the Kitchen's **Kept House**, tuned for a working cupboard:

- **Aged oak, matte plaster, gentle patina** — identical material system, so the three rooms are the same
  house. The shelves are oak with a lit front lip; the plaster is chalky and matte.
- **The food itself is the only content that is added.** No painted jars, no drawn produce, no illustrated
  pantry, no fake fullness — all named as forbidden by the Orchard House Design Blueprint § 13.4 and the
  Living Book. The household's own stock is the interior; when a shelf is light, it is *honestly* light.
- **Items as small objects on a shelf.** Each item is a calm surface, a name in the serif hand, a **human
  quantity** (*"still a good bit"*, *"half a bag"* — never a decimal, never a stock count), and, only when
  the data supports it, one honest freshness word. A soft shadow so it reads as a *thing on a shelf*, not a
  cell in a table. One ground; never a card-in-a-card (rule P6, P11).
- **Freshness, honestly told** — the room's one Living Detail. The canonical status vocabulary, rendered as
  a **quiet word in a warm tone** — a calm olive for *fresh*, a soft oak for *use soon*, a softer tone
  still for *getting on*. **Never red, never a badge, never a countdown, never a number-and-alarm.** *"A
  thing to know, not a thing to feel bad about"* (Living Book). It is honest in absence: when the data is
  silent, the word is simply gone and the item is still complete (Living Detail rule 3).
- **The voice is reassurance, plain and kind.** The heading is a serif line in the household's register
  (*"What's in the house"*), not a database label. Sub-lines are honest and warm (*"a good week on the
  shelves"*, *"getting on — lovely roasted"*).

---

## 5. The user journey — from the Kitchen into the Pantry

The mission asks to show how the Pantry **naturally follows the Kitchen** while remaining part of the same
house. It follows because the two rooms are the two halves of one act: the Kitchen answers *"what shall we
cook?"*; the Pantry answers *"what do we have?"* — and each is the other's natural next question.

1. **In the Kitchen**, you are at the worktop with your book open. You reach for the shelf — and the shelf
   *is* the Pantry. Walking through the Pantry door is stepping to the shelves in the same house.
2. **The transition is a continuity, not a cut.** The plaster is the same, the oak is the same, the pressed
   apple is in the same material, the Companion is in the same corner, and **the orchard is still there** —
   now a small high glimpse rather than the Kitchen's side window. The household *knows* they are in the
   same house before they read a word, because every material agreed to stay.
3. **First impression — the honest shelves.** The room opens not onto a search bar or a stock report, but
   onto *their strata*: a warm serif greeting (*"What's in the house"*) and the food they keep, grouped in
   tiers, in the plain morning light. The Living Book's promise is met on arrival — *the plain truth of the
   shelves, told kindly.*
4. **Reassurance, then a quiet idea.** The eye finds the shelves are stocked (*good — we're fine*), and the
   freshness words tell you, kindly, what's worth using first. Then the Companion offers **one** connection
   back to the Kitchen — *the squash would be lovely in Sunday's traybake* — an opportunity that is
   genuinely there, offered and never insisted (IntLang § 4.4).
5. **The Companion is the friend who glances over your shoulder**, not the one who catches you out. *"You've
   got most of tomorrow's already"* — useful, never judging what it sees (Living Book). It never turns the
   cupboard into a task list or the shelves into a shop.
6. **Completion is knowing.** You close the cupboard reassured — you know exactly what's in the house — and
   return to the Kitchen to cook, or to Home, at rest. Lingering is permitted; there is nothing to finish
   and nothing to fix.

---

## 6. The concepts — desktop · tablet · mobile, in two views

Rendered headless at **desktop 1440 · tablet 834 · mobile 390**, `deviceScaleFactor 2`. Fraunces resolved
and loaded. Every render passed the **E2 + honesty sanity check** (6/6): the orchard window is one
committed region and no reading content ever crosses onto the glass, **and** no freshness label ever
computes to a dominant-red hue (the "never an alarm" rule, made mechanical).

Two views are shown because the room has two honest weathers of the household's own cupboard: **a
well-stocked pantry**, and **a near-bare one**. The view never changes the room — only how much is on the
shelves — and the bare pantry is deliberately the **warm** one, never the empty-feeling one.

### 6.1 The stocked pantry — abundance, honestly told *(the emotional heart)*

The family's shelves in strata (Larder · Fridge · Freezer); items as small objects on real oak shelf lines;
freshness told in kind olive-and-oak words; the squash carries a half-step of *noticed* warmth where the
Companion has connected it to a plan; the small orchard window and the Companion's line sit in the corner;
the pressed apple is discovered in the plaster.

![stocked · desktop](../../ui-audit/house6-pantry/pantry-stocked-desktop.png)

| Tablet | Mobile |
|---|---|
| ![stocked · tablet](../../ui-audit/house6-pantry/pantry-stocked-tablet.png) | ![stocked · mobile](../../ui-audit/house6-pantry/pantry-stocked-mobile.png) |

**Desktop** — the shelves are the room (left), the small window + ledge + Companion + pressed apple are the
committed region on the right. Three tiers, an open oak shelf line beneath each. **Tablet & mobile** — the
small window becomes a slim committed band at the top (still the smallest in the house, still E2, the
content never covering it), the Companion's line beneath it, then the greeting and the strata (three-up on
tablet, two-up on mobile). The orchard is the first thing seen on the small screens — the same-house
signal, up front, exactly as the Kitchen does it.

### 6.2 The near-bare pantry — honest, never empty-feeling

The same room with the shelves genuinely light — but **warmer, not colder**: the light lifts, the air
opens, and a warm serif invitation stands where a scarcity alarm would be. *"The shelves are light this
week. That's completely fine — a pantry breathes in and out."* A couple of honest staples, well-spaced.
**Never** a catalogue of what's missing, never *"you're low on 12 things"*, never a red count (rule P10,
P12).

![bare · desktop](../../ui-audit/house6-pantry/pantry-bare-desktop.png)

| Tablet | Mobile |
|---|---|
| ![bare · tablet](../../ui-audit/house6-pantry/pantry-bare-tablet.png) | ![bare · mobile](../../ui-audit/house6-pantry/pantry-bare-mobile.png) |

*(Full-page tablet and mobile captures — where the room continues below the fold — are alongside each
viewport render in `docs/ui-audit/house6-pantry/`.)*

> **A note on the shelf contents.** The items are warm, **generic staples** standing in for the household's
> *own* pantry — deliberately ordinary (butternut squash, chickpeas, orzo), so **no invented fullness is
> presented as a real household's stock**, exactly as Arrival used *"Chloe"* as a placeholder name and the
> Kitchen used placeholder dishes. In production the household's real pantry replaces them 1:1 — and where
> a household's cupboard is genuinely bare, the room falls back **warm, never clinical** (rule P10).

---

## 7. Rules every future Pantry feature must follow

These are the Pantry's governing rules. **None is new** — each is the room-specific face of a rule with an
owner, cited so it can be checked and never becomes a second owner. A Pantry feature that fails any of these
is not in this room.

| # | Rule | Why / owner |
|---|---|---|
| **P1** | **The shelves are the hero; the room is strata.** The Pantry's ground posture is open oak shelving in tiers — not a list, not a grid of metric tiles. Its content is *what is in the house right now.* | Blueprint § 5.1 (Shelf strata), § 8.2; § 4.1; TRANSLATION1 *Shelving* |
| **P2** | **Freshness is honestly told — a kind word, never a warning.** The canonical status vocabulary renders as warm human words ("fresh", "use soon", "getting on"); **never a red alarm, never a badge, never a countdown, never a number.** A thing to know, not to feel bad about. | Living Detail § 12.2 ceiling; Living Book; Experience Language § 7; OHDB § 13.4 |
| **P3** | **Abundance must be real; never paint fullness.** What's on the shelf is what the household has. No painted jars, no drawn produce, no fake stock, no invented fullness to make the cupboard look richer than it is. | Living Book (*"never … invented fullness"*); Living Detail rules 2–3; OHDB § 13.4 |
| **P4** | **The window is E2 — the smallest in the house — one committed region the content never covers.** The orchard is a glimpse because this is a working cupboard; never wallpaper behind the shelves. | Blueprint § 6.2, § 5.1; § 16 |
| **P5** | **It is *their* pantry, not a shop's shelf.** Grouped the way a home groups food (the cupboard, the cold shelf, the bottom drawer), in warm oak and plaster — never retail merchandising, never a supermarket gondola, never arranged to sell. | Living Book; Blueprint § 4.1; TRANSLATION1 (the household present) |
| **P6** | **Not a spreadsheet. One ground, never nested; items are the objects.** Small objects on a real shelf, with human quantities — never rows and columns of decimals, never a sortable data grid, never a dashboard of counts. | Blueprint § 8.2; TRANSLATION1 *Shelving*; § 12 (no metric tiles) |
| **P7** | **The Companion connects what you have to what you might do — welcome noticing, never a scarcity alarm; silence is valid.** It surfaces a genuinely-there opportunity, stays quiet when nothing connects, and never invents a use the pantry data does not support. | IntLang § 4.4; Notice Engine (`pantry-opportunity`, verbatim); Living Book |
| **P8** | **Season appears in the freshness of the food, never in the room.** *"At its best now"* is a property of an item; the room's light, plaster, and orchard never dress for a date. No autumn leaves, no snow, no blossom-as-decoration. | OHDB § 11; Blueprint § 16; (parallel to HOUSE5 K7) |
| **P9** | **This is where food lives, not where recipes are remembered.** Cookbook stories — favourites, discoveries, traditions, seasonal habits — belong in the Kitchen (HOUSE5 § 4, § 8.4), not behind a Pantry heart emoji. The Pantry owns *ingredients in the house*; it does not host the recipe book's memory. | COOK1 § 5.2, § 8.4 (the finding); HOUSE5 § 8.4; Experience Architecture (one canonical place) |
| **P10** | **When the cupboard is bare, get warmer — never accusing.** A light pantry gets lifted light, air, and a warm invitation, never *"you're running low on 12 things"* and never a catalogue of what's missing. Calm must never become lifeless. | Blueprint § 6.2; Living Book; Experience Language § 3A.4; (parallel to HOUSE5 K12) |
| **P11** | **Same house, carried verbatim.** The pressed apple, the Companion apple, the constant shell, the Kept House materials, the one morning — all carried exactly from Arrival and the Kitchen, so the Pantry is unmistakably the same house. | HOME_ARRIVAL_PRODUCTION_LOCK § 3; HOUSE5 § 9; Blueprint § 14 |
| **P12** | **No stock-management vocabulary, ever.** No "par level", "reorder", "low stock", "out of stock", "quantity on hand", or expiry countdown. The honest register is human ("plenty", "a good bit", "getting on"). A stock word is a regression, not a feature. | Experience Language § 7; Living Detail § 12.2 ceiling; IntLang § 4.4 |

---

## 8. Production recommendations

Ordered by dependency. The design is complete; these carry it toward the gated build **and** name the
findings the room's honesty depends on.

1. **Build the shelf strata first, and build them as objects — not a list.** The single highest-value move
   is presenting `pantry-page.tsx`'s existing categories (Larder · Fridge · Freezer, plus the Home pantry)
   as **open oak shelf tiers with items as objects**, in the Kept House materials — retiring any register
   that reads as a checklist or a stock table (rule P1, P6). This is the difference between "an inventory
   screen" and "the shelves of your own house."
2. **Ship *Freshness, honestly told* as a kind word — and design the honest-absence case.** The signature
   moment is the Living Detail (§ 12.2). **Named dependency:** today's `PantryItem` carries no freshness
   field — the design shows the room the platform should grow into (exactly as HOUSE5 did for the
   family-book gap). When freshness data exists, render it as *fresh / use soon / getting on* in warm tones
   (rule P2); when it does not, render **nothing** and let the item stand complete (rule P3). The honest
   lever if a status ever under-reads is *a clearer word, never a redder colour.*
3. **Wire the Companion's pantry-opportunity line — and let it be silent.** The connection *"there's still
   a good bit of that squash — it'd be lovely in Sunday's traybake"* enters as a registered
   `pantry-opportunity` notice, verbatim from its producer through the Notice Engine (IntLang § 4.4), never
   templated into the page. It must surface only a genuinely-there opportunity and **say nothing when
   nothing connects** (rule P7). This is the room's bridge to the Kitchen and the source of its *inspiring*
   feeling.
4. **Move the cookbook stories out of the Pantry and into the Kitchen (close the COOK1 defect).** COOK1
   § 8.4 found favourites/discoveries/traditions rendered *in the Pantry behind a heart emoji*, three of
   five unreachable. HOUSE5 § 8.4 claims them as the Kitchen's well-thumbed warmth. This room's job is to
   **release them** — the Pantry keeps only *ingredients in the house* and the freshness of those
   ingredients (rule P9). Doing both in one change stops the two rooms from owning the same fact twice.
5. **Keep human quantities; refuse the decimal.** The register is *"a good bit"*, *"half a bag"*, *"two
   tins"* — never `0.5 kg` or a stock integer (rule P6, P12). Where the data is a number, translate it to a
   human amount at the edge; the household never reads a spreadsheet cell.
6. **Design the bare-pantry state as a first-class warm room, not an empty grid.** A large share of
   households will arrive at a light cupboard; the answer is lifted light and a warm invitation (*"a pantry
   breathes in and out"*), never a scarcity report (rule P10). Build this state *first-class*, the way the
   Arrival lock built the quiet day first.

**Explicitly not recommended:** a red expiry alarm or "low stock" flag (P2, P12); painted jars or fake
fullness (P3); the orchard as a full-bleed backdrop (P4); a supermarket-style catalogue to "restock from"
(P5); a sortable quantity grid (P6); a favourite star or story card living in the Pantry (P9). Each is the
most likely well-meaning regression, and each is named so it is refused on purpose.

---

## 9. What this keeps, and what it never does

**Kept.** The house language of Arrival and the Kitchen — Concept B architecture, the Kept House interior,
the Warm Hour light (here as the pantry's practical morning-warm), the pressed apple, the Companion apple,
the constant shell — all carried verbatim, so the Pantry is unmistakably the same house. The orchard is the
owner's real `ORCHARD.png`, the same view from the same place, now a small glimpse from the working
cupboard. Hospitality before productivity; technology quieter as it improves; every object earns its place.

**Never done.** No redesign of Home or the Kitchen; no new architectural idea (the room is Concept B with
the window shrunk to its smallest and the shelves made the hero); no painted jars or drawn produce; no fake
fullness; no seasonal room-dressing; no red freshness alarm; no stock-management vocabulary; no favourite
star or cookbook story hosted in the Pantry; no supermarket catalogue; and **no product source, data
source, hook, route, API, behaviour, schema, migration, or test changed** — this is a design blueprint and
renders, exploration only.

---

## 10. Verification

| Check | Result |
|---|---|
| Bootstrap + required reading | ✅ `README`, HOME_ARRIVAL_PRODUCTION_LOCK, HOUSE5_KITCHEN_EXPERIENCE, Blueprint Pantry row + Exposure Scale, Living Book *The Pantry Shelves*, OHDB § 13.4, IntLang § 4.4, TRANSLATION1 *Shelving* — read before starting. |
| Git status confirmed · rollback created + recorded | ✅ `rollback/HOUSE6-PANTRY-EXPERIENCE-20260718` → `7bfad50c` (tag + working-tree snapshot object `b7d66cbf`). |
| Same house as Arrival + the Kitchen | ✅ Concept B · Kept House · one morning · pressed apple · Companion apple · constant shell, all carried verbatim. |
| Own personality | ✅ The window shrinks to the **smallest in the house** (E2); the hero shifts from the view (Home) and the food (Kitchen) to the **honest shelf strata**. |
| E2 honoured (not wallpaper) | ✅ Orchard is one small committed region; **6/6 renders clear** — no reading content crosses onto the glass. |
| Freshness never an alarm (mechanically checked) | ✅ No freshness label computes to a dominant-red hue on any render; told in kind olive/oak words only. |
| The forbidden feelings avoided | ✅ Not stock management (freshness is a kindness, not a count), not a spreadsheet (objects on a shelf, one ground), not supermarket shelving (their home's own groups, warm oak and plaster). |
| Naturally follows the Kitchen | ✅ The two halves of one act — *what shall we cook?* (Kitchen) and *what do we have?* (Pantry); the shelf posture and every material shared (§ 5). |
| Deliverables | ✅ Pantry philosophy (§ 2) · room blueprint (§ 3) · interior language (§ 4) · journey from the Kitchen (§ 5) · desktop/tablet/mobile concepts in two views (§ 6) · production recommendations (§ 8) · permanent Pantry design rules (§ 7). |
| Renders | ✅ 6 viewport (2 views × 3 breakpoints) + 4 full-page, `deviceScaleFactor 2`, Fraunces real. |
| Product / schema / migration / tests | **None** — design blueprint and renders only. `pantry-page.tsx` · `index.css` untouched. |
| Canonical orchard asset | **Byte-untouched.** Referenced in place; no substitute authored. |

**Artifacts**

```
scripts/north4-concepts/pantry-experience.html   the Pantry — two views (stocked · bare), standalone
scripts/north4-concepts/render-pantry.ts          renders 3 breakpoints × 2 views, with the E2 + honesty sanity check
scripts/north4-concepts/_palette.css              the derived Orchard Palette (unchanged, reused)
docs/ui-audit/house6-pantry/                       10 renders (6 viewport + 4 full-page)
```

> **Tooling note.** Chromium will not launch in this sandbox (`libglib-2.0.so.0` missing). Revived exactly
> as the Arrival and Kitchen lines recorded: a curated 64-bit library set symlinked from the ytmdesktop nix
> store target, **excluding** glibc's own libraries **and** libcrypto/libssl/libz (they shadow node's
> OpenSSL and segfault `node`). The apple mark is an inlined SVG data-URI mask (a `file://` mask-image
> loads empty in this headless build). Recipe in the run file; the next session will hit the same wall.

---

*HOUSE6 — The Pantry. You reach from the Kitchen worktop to the shelf, and the house does not change around
you — the same plaster, the same oak, the same morning — but the window shrinks to a glimpse in the corner,
because here the work is looking, and there in front of you are your own shelves: what is in the house right
now, told kindly. The squash that's getting on would be lovely roasted; the spinach is at its best this
week; and when the cupboard is light, the room only says so warmly — a pantry breathes in and out. The
friend glances over your shoulder with one useful line, the apple is pressed into the wall for the eye to
find, and the orchard is still there through the small high window. It is the same house. It is where the
food lives.*
