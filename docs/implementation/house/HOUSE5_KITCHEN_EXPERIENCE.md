# HOUSE5 — The Kitchen

**The second room in the house. Where Arrival is the Entrance Hall you come home to, the Kitchen is the
working heart you cook in — the same house, its own personality.** This document defines the permanent
Kitchen: the emotional blueprint that governs the Cookbook experience, designed at desktop · tablet ·
mobile, and rendered so it is judged rather than asserted.

| | |
|---|---|
| **Session** | `HOUSE5_KITCHEN_EXPERIENCE` |
| **Date** | 2026-07-17 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/HOUSE5-KITCHEN-EXPERIENCE-20260717` → `7bfad50c` (tag `house5-kitchen-experience-wip-snapshot-7bfad50c`; working-tree snapshot `3cc05f9f`) |
| **Status** | **Blueprint complete. Rendered at three breakpoints in two views. Awaiting owner decision, then the gated build.** 6 renders; E2 sanity 6/6 clear; Fraunces real. |
| **Product changed** | **None.** Standalone composition (`scripts/north4-concepts/kitchen-experience.html`); `meals-page.tsx` / `index.css` not opened. Canonical `ORCHARD.png` referenced in place; no substitute authored; no fabricated dish presented as a real household's meal (warm placeholders stand in for the household's own photography, as Arrival used a placeholder name). |
| **Builds on** | `HOME_ARRIVAL_PRODUCTION_LOCK` (the house language it inherits) · `COOK1_ORCHARD_COOKBOOK_BLUEPRINT` (the Cookbook's philosophy, by citation) · `BRAND1`/`BRAND2` (the pressed apple) · `COMP1` (the Companion). |

---

## 0. Why this room, and why now

`COOK1 § 15` recorded one precondition on any Cookbook visual work: *"EXP5:951 fixed the sequence — EXP5-P2
Cookbook and EXP5-P3 Planner as separate follow-ons, each a fresh decision **informed by P1's
photographs** — and **P1 (Home) has not run.**"* **P1 has now run.** The Arrival line
(`NORTH4` → `HOME_ARRIVAL_PRODUCTION_LOCK`) locked Home, so the Kitchen is the sanctioned next room, in the
order the canon set. This document is EXP5-P2, arriving on schedule.

**What this is, and is not.** This is a **design blueprint** — the emotional identity, architecture,
interior, journey, and the rules the Cookbook must obey — rendered at three breakpoints. It is **not**
implementation, and it does not re-open Home or Arrival. Where `COOK1` deliberately *designed no screens*
and instead established the Cookbook's philosophy by citation, this document draws the room that philosophy
describes. Every rule below traces to an owner; **if any statement here restates a rule owned elsewhere,
the owner prevails and this file is corrected** (the yield clause the whole house obeys).

**Read before starting:** `docs/architecture/README.md`, `HOME_ARRIVAL_PRODUCTION_LOCK.md`,
`BRAND1_ARCHITECTURAL_BRANDING.md`, `COOK1_ORCHARD_COOKBOOK_BLUEPRINT.md`, the Experience Blueprint's
Cookbook row (§ 5.1) and TRANSLATION1's kitchen-island/shelving translations. Git status confirmed and the
rollback created before any change.

---

## 1. The one line the whole room is built on

The Experience Blueprint already names this room in a single row (§ 5.1):

> **Cookbook · "The recipe book by the window" · E2 · warm side-light across the page · Shelf; recipe cards
> as objects you pick up · The well-thumbed page.**

Every decision in this document is downstream of that row. The Kitchen is **not** "the Cookbook page with
nicer styling" — it is *the recipe book by the window*, and the four other cells (E2, side-light, the shelf
of objects, the well-thumbed page) are the whole design brief, already written. This document's job is to
make them one legible room.

---

## 2. Emotional philosophy

**The Kitchen is the emotional heart of The Healthy Apples — the room where the house stops welcoming you
and starts feeding you.** Arrival is *hospitality*: you have come home, the view is the hero, you are at
rest. The Kitchen is *nourishment*: you are at the counter, the **food** is the hero, and the room is warm
because the food is warm.

It must feel like eight things, and each has an owner in the design:

| Feeling | How the room produces it |
|---|---|
| **Confidence** | Their *own* book, not a catalogue — recognition, not choosing (`COOK1 P2`; OLB:74). You already know these dishes. |
| **Warmth** | The warmth comes from **the food itself** — *"the food itself is the colour"* (`EXP5:362`). The room's real decoration is honest, appetising photography of real food. |
| **Craftsmanship** | Aged oak worktop, matte plaster, a real window with depth — the Kept House, carried from Arrival. Materials, not effects. |
| **Preparation** | The oak **worktop** by the window is a *working* surface — deeper than Arrival's sill, a plane you prep on. The recipe's ingredients sit *"on the worktop."* |
| **Gathering** | *"For the table"* · *"serves 4"* — the honest register of cooking for people, never a management widget. |
| **Creativity** | The shelf invites browsing — *"appetite and possibility"* (`EXP5:360`), the warmest browsing register in the product. |
| **Calm** | E2 restraint: one committed window, a quiet serif voice, air around the food. Never a dashboard. |
| **Nourishment** | Every card is a real meal this family cooks; the room's whole content is food. |

**It must never feel like** a recipe database, a dashboard, a collection of cards, or kitchen-management
software. The single defence against all four is the same: **the food is the colour, and the family's own
book is the content.** A grid of identical UI cards over a cold plane is a database; the same grid where
each card is a photograph of a dish *this family cooks*, on a warm shelf, lit from the side, is a kitchen.

> **The philosophy in one line:** *the Kitchen is the family's own recipe book, open on the worktop by the
> window — warm because the food is warm, and known because the book is theirs.*

---

## 3. Architectural blueprint

The Kitchen is the same architecture as Arrival — **NORTH4 Concept B** — with **one deliberate move that
gives it its own personality: the window turns to the side.**

### 3.1 The move that makes it the Kitchen — the side window (E2, not E3)

Arrival is **E3**: the orchard is a full generous wall above, and *the view is the purpose*. The Cookbook
is **E2** (Blueprint § 6, line 222): *"a framed, partial presence in one committed region the content
deliberately does not cover; the working area on solid ground."* So the orchard becomes **one committed
window to the side**, over the worktop — like a real kitchen window over the counter — and the light **rakes
in from the side, across the page** (the Blueprint's *"warm side-light across the page"*), rather than
falling from a wall overhead.

This single change does three things at once:
1. **It differentiates the room without leaving the house.** Same orchard, same oak, same one morning — but
   the emphasis moves from *the view* to *the surface*. You are no longer looking out; you are looking down
   at what you cook.
2. **It obeys E2 honestly.** The orchard is in *one region the content never covers* — never the wallpaper
   behind every recipe card that the live product currently renders (`COOK1 § 12.2`, the room's headline
   defect). Verified on every render: no reading content ever crosses onto the glass (6/6 clear).
3. **It lets the food be the hero.** With the window committed to one side, the rest of the room is the
   **shelf** — and the shelf is food.

### 3.2 The planes of the room

| Plane | What it is | Owner |
|---|---|---|
| **The window** | One committed orchard region to the side, over the worktop — real joinery (head reveal, jamb returns, a mullion), the same view as Arrival, seen from the kitchen. | Blueprint § 5.1 (E2), § 6 |
| **The oak worktop** | The working plane beneath the window — a *counter*, deeper than Arrival's boundary sill; where today's one thing rests and the Companion leans. Never nested, never a grid of metric tiles, never drawn. | TRANSLATION1 § 4 (the Kitchen Island); Blueprint § 8.2 |
| **The shelf** | Open oak shelving — tiers of recipe cards as objects you pick up, a shelf line beneath each tier (*"the strata of the middle ground"*). The room's ground posture. | Blueprint § 5.1 (Shelf); TRANSLATION1 § 4 (Shelving) |
| **The plaster** | The matte, hand-troweled Kept House wall, carried from Arrival; warm where the side-light falls, cooler away from the window. | HOME_ARRIVAL_PRODUCTION_LOCK § 3.2 |
| **The pressed apple** | The sole brand mark — the THA apple pressed into the plaster by the worktop, tone-on-tone, discovered not displayed (BRAND2), exactly as in Arrival. | BRAND2 § 6 |
| **The doors** | The constant shell along the floor — you can leave the Kitchen for any room. "Cookbook" reads as *here*. | Experience Blueprint § 14 |

### 3.3 The light

One morning, from the side. The room is **warm nearest the window and softens away from it** — *side-light
across the page*. This is a wash on plaster, **never a second sun** (Blueprint § 16): no glow is added to
the orchard, no scrim laid over it. The food catches this side-light (a soft highlight on each dish, top
toward the window); the well-thumbed cards catch a half-step more. The season **never** changes the light
(§ 7, rule K7).

---

## 4. Interior language

Carried from Arrival's **Kept House**, tuned for a working kitchen:

- **Aged oak, matte plaster, gentle patina** — identical material system to Arrival, so the two rooms are
  the same house. The worktop is oak with a lit front lip; the plaster is chalky and matte.
- **The food is the only ornament that is added.** `EXP5:378` — *"Food photography, where it exists, is the
  room's real decoration — honest, appetising, in real light."* Nothing else is placed: no props, no drawn
  utensils, no illustrated kitchen. The household's own dishes are the interior.
- **Recipe cards as objects you pick up.** The one room in the house where discrete card-objects are the
  *canonical* posture (`COOK1 § 12.3`) — the opposite of the Planner's single table. Each card is a small
  object: a photograph, a name in the serif hand, a quiet honest sub-line; a soft shadow so it reads as a
  thing on a shelf, not a tile in a grid.
- **The well-thumbed page** — the room's one Living Detail. A loved recipe carries *a half-step of surface
  warmth* — a faint warmth behind the caption, a slightly deeper shadow, as if the page falls open on its
  own. **Never a badge, rank, label, score, or star** (Blueprint § 12.2; `COOK1 § 5.1`, § 10.3). It is
  *earned, never declared* — there is no favourite button, and there must not be one.
- **The voice is recognition, warm and unhurried.** The heading is a serif line in the household's register
  (*"The things you cook, and the ones worth coming back to"*), not a database label. Sub-lines are honest
  and quiet (*"quick · in season now"*, *"for the table"*).

---

## 5. The user journey — from Arrival into the Kitchen

1. **In Arrival**, the doors run along the floor of the plaster room; one reads **Cookbook**. Walking
   through it is walking deeper into the same house.
2. **The transition is a continuity, not a cut.** The plaster is the same, the oak is the same, the pressed
   apple is in the same material, the Companion is in the same corner, and **the orchard is still there** —
   now framed in the kitchen window to the side. The household *knows* they are in the same house before
   they read a word, because every material agreed to stay.
3. **First impression — the shelf.** The room opens not onto a search bar or a database, but onto *their
   shelf*: a warm serif greeting and the food they cook, lit from the side. `EXPLANG:400`'s beat 1
   (*"a warm, appetising place that feels like browsing a shelf, not querying a database"*) is met on
   arrival — and `COOK1 § 12.1` verified the live room already opens clean, with nothing between its edge
   and the first recipe. This design keeps that and warms it.
4. **Recognition, then intent.** The eye finds a dish it knows (*oh, this one*). One tap opens the recipe —
   the food enlarges to become the page's hero, the ingredients sit *on the worktop*, the method reads
   unhurried, and there is **one clear intent** (*cook it tonight* / *add to the week*) — the person's most
   likely intent, never the product's (`EXPLANG:403`).
5. **The Companion is at the counter, not in the way.** A single data-borne line rests on the worktop by the
   window — *"the greens are at their best this week…"* — offered, never insisted; happy to stay quiet
   (OLB:78). It never turns the browsing into a task or the book into a store.
6. **Completion is rest.** The meal is planned or begun; the household returns to browsing or to Home, at
   rest (`EXPLANG:405`). Lingering is a permitted feeling, never a measured goal (`COOK1 P5`).

---

## 6. The concepts — desktop · tablet · mobile, in two views

Rendered headless at **desktop 1440 · tablet 834 · mobile 390**, `deviceScaleFactor 2`. Fraunces resolved
and loaded. Every render passed the **E2 sanity check** (6/6): the orchard window is one committed region
and no reading content — card name, recipe title, ingredient, method, heading — ever crosses onto the glass.

Two views are shown because the room has two moments: **arriving at the shelf**, and **a recipe opened**.

### 6.1 The shelf — arriving in the Kitchen *(the emotional heart)*

The family's book on the open shelving; the food is the colour; the loved pages carry an earned warmth; the
orchard window and the Companion's line sit to the side over the worktop; the pressed apple is discovered in
the plaster.

![shelf · desktop](../ui-audit/house5-kitchen/kitchen-shelf-desktop.png)

| Tablet | Mobile |
|---|---|
| ![shelf · tablet](../ui-audit/house5-kitchen/kitchen-shelf-tablet.png) | ![shelf · mobile](../ui-audit/house5-kitchen/kitchen-shelf-mobile.png) |

**Desktop** — the shelf is left (the room), the window + worktop + Companion + pressed apple are the
committed region on the right. Two tiers of three, open oak shelf line between. **Tablet & mobile** — the
window becomes a committed band at the top (still side-lit, still E2, the content never covering it), the
Companion's line beneath it, then the greeting and the shelf (three-up on tablet, two-up on mobile). The
orchard is the first thing seen on the small screens — the same-house signal, up front.

### 6.2 The recipe, opened — recipe presentation

One recipe brought to the worktop and lit from the side — a real page on a real surface, **never a drawn
book with page-turns** (the theme park, forbidden). The food is the hero (the room's real decoration); the
title is in the serif hand; the history line is honest (*"featured in your plans"*, never *"cooked"*); there
is one clear intent; the ingredients sit *on the worktop* and the method reads *unhurried*.

![recipe · desktop](../ui-audit/house5-kitchen/kitchen-recipe-desktop.png)

| Tablet | Mobile |
|---|---|
| ![recipe · tablet](../ui-audit/house5-kitchen/kitchen-recipe-tablet.png) | ![recipe · mobile](../ui-audit/house5-kitchen/kitchen-recipe-mobile.png) |

*(Full-page tablet and mobile captures — where the room continues below the fold — are alongside each
viewport render in `docs/ui-audit/house5-kitchen/`.)*

> **A note on the food images.** The tiles are warm, appetising **placeholders** standing in for the
> household's *own* photography — the room's real decoration (`EXP5:378`). They are deliberately generic
> (no fabricated specific dish presented as a real household's meal), exactly as Arrival used *"Chloe"* as a
> placeholder name. In production, real photography replaces the fill 1:1 — and where a household has none,
> the room must fall back **warm, never clinical** (rule K10).

---

## 7. Rules every future Cookbook feature must follow

These are the Kitchen's governing rules. **None is new** — each is the room-specific face of a rule with an
owner, cited so it can be checked and never becomes a second owner. A Cookbook feature that fails any of
these is not in this room.

| # | Rule | Why / owner |
|---|---|---|
| **K1** | **The food is the colour.** Warmth comes from real, honest photography of the family's own food — never from decoration, tint, or a warm-coloured chrome. | `EXP5:362`, `:378` |
| **K2** | **It is *their* book, not the world's catalogue.** The room's content is *what this family cooks*. Discovery of new recipes may live here but must never arrange the family's book like a shop (*"not a store"*). | Blueprint:147; `COOK1 § 6.3`, § 11.3 |
| **K3** | **Recognition, not choosing.** Design for *remembering* — the family's own dishes surfaced back to them — never for deciding among a database. | OLB:74–81; `COOK1 P2` |
| **K4** | **The well-thumbed page is a half-step of warmth — never a badge, rank, label, score, or star.** A loved recipe is *shown* used, never *told*. There is no favourite button, and adding one is a regression, not a feature. | Blueprint § 12.2; `COOK1 § 5.1`, § 10.3 |
| **K5** | **Never say "cooked" for a planned meal.** THA cannot witness cooking; the honest sentence is *"has featured in your plans N times."* Any claim about the household's life must match the evidence. | `COOK1 § 5.3`; stories/types.ts:20-24 |
| **K6** | **The window is E2 — one committed region the content never covers.** The orchard is a framed side window, never wallpaper behind the cards. | Blueprint § 6 (E2); `COOK1 § 12.2` |
| **K7** | **Season appears in the food, never in the room.** *"In season now"* is a property of a dish; the room's light, plaster, and orchard never dress for a date. No autumn leaves, no snow, no blossom-as-decoration. | `COOK1 § 8`, § 11.2; OHDB § 11 |
| **K8** | **The Companion is the friend at the counter — invited, suggesting, never deciding; silence is valid.** It never turns browsing into a task or the book into a store, and it never auto-picks tonight's dinner. | OLB:78; TRANSLATION1; `COOK1 § 9`, § 11.7 |
| **K9** | **No drawn book, no page-turn theatrics.** A recipe is a real page on a real surface, lit — never an illustration of a cookbook. The metaphors are feelings to design toward, never pictures to draw. | Blueprint:167, § 16; OHDB:248; `COOK1 § 11.1` |
| **K10** | **Get clearer without getting colder.** When photography is absent, the fallback stays warm — matte plaster and oak, never a clinical white plane. Calm must never become lifeless. | `EXPLANG § 3A.4`; `COOK1 § 11.6` |
| **K11** | **One ground, never nested; recipe cards are the objects.** The shelf is the single ground; cards are the pick-up objects on it. Never a card-in-a-card, never a dashboard of metric tiles. | Blueprint § 8.2; TRANSLATION1 § 4; `COOK1 § 12.3` |
| **K12** | **An empty book gets more light, not more prompting.** A new household's shelf is mostly things they haven't cooked; the answer is E2→E3 generosity, never *"you've only tried 3 of 30."* Never a catalogue of what they haven't cooked. | Blueprint § 6.2; OLB:80; `COOK1 § 11.4` |

---

## 8. Production recommendations

Ordered by dependency. The design is complete; these carry it toward the gated build **and** name the
`COOK1` findings the room's honesty depends on.

1. **Build the shelf first, and build it as E2.** The single highest-value move is retiring the live
   orchard-as-wallpaper (`COOK1 § 12.2`, `card.tsx:12` + the hardcoded backdrop) and committing the orchard
   to **one side window**. This is the difference between "database with a nice background" and "the recipe
   book by the window," and it is a shared-component change, not a Cookbook-only one.
2. **Ship the honest history sentence with the room.** *"Featured in your plans N times"* — never *"cooked"*
   (K5). `COOK1 § 15.1` notes the honest sentence is already written one page away
   (`food-detail-page.tsx:91-96`); the Kitchen must adopt it, not the strip's over-claim.
3. **Real photography is the decoration — commission or source it, and design the warm fallback (K10).** The
   room's whole warmth strategy is `EXP5:362`. The placeholder tiles here prove the layout; production needs
   real food in real light, plus a matte-plaster fallback for households without photos.
4. **Hand the family their own stories — in this room.** `COOK1 § 5.2`, § 7.2, § 8.2: favourites,
   discoveries, traditions and seasonal habits are computed and tested, but rendered *in the Pantry* behind
   a heart emoji, and three of five are unreachable. The Kitchen is where they belong — as the *well-thumbed
   warmth* and the *"in season now"* sub-line, **applied through K4's ceiling** (a half-step of warmth, not
   a story card that becomes a badge).
5. **Name and route the family's book (the deepest dependency).** `COOK1 § 1.1`, § 15.4: `meals` is
   user-scoped with no `householdId`, so *"the family's cookbook"* is today N private books. The room is
   *designed* as a family's; making it one is a schema/ownership decision above this document, and it
   `EXP ARCH:211`-binds (one name per concept). The design does not pretend the gap is closed — it shows the
   room the platform should grow into.
6. **The Companion gets its chair here, last and correctly.** `COOK1 § 9.1`, § 15.6: the Cookbook is the
   only named surface with no ambient Companion presence — which makes it the one room that can adopt the
   converged Companion Card *correctly the first time*, after the Planner's ungoverned channels are retired.
   The design places the chair (the counter line); the wiring is a separate, gated change.

**Explicitly not recommended:** a favourite star (K4); any seasonal room-dressing (K7); a "cooked" claim
(K5); a drawn book (K9); or restoring the orchard as a full-bleed backdrop (K6). Each is the most likely
well-meaning regression, and each is named so it is refused on purpose.

---

## 9. What this keeps, and what it never does

**Kept.** The house language of Arrival — Concept B architecture, the Kept House interior, the Warm Hour
light, the pressed apple, the Companion apple, the constant shell — all carried verbatim, so the Kitchen is
unmistakably the same house. The orchard is the owner's real `ORCHARD.png`, the same view from the same
place, now seen through the kitchen window. Hospitality before productivity; technology quieter as it
improves; every object earns its place.

**Never done.** No redesign of Home or Arrival; no new architectural idea (the room is Concept B with the
window turned to the side); no drawn book; no seasonal dressing; no "cooked" claim; no favourite star; no
orchard behind the cards; no invented dish presented as a real household's meal; and **no product source,
data source, hook, route, API, behaviour, schema, migration, or test changed** — this is a design blueprint
and renders, exploration only.

---

## 10. Verification

| Check | Result |
|---|---|
| Bootstrap + required reading | ✅ `README`, HOME_ARRIVAL_PRODUCTION_LOCK, BRAND1, COOK1, Blueprint Cookbook row, TRANSLATION1 — read before starting. |
| Git status confirmed · rollback created + recorded | ✅ `rollback/HOUSE5-KITCHEN-EXPERIENCE-20260717` → `7bfad50c` (tag + working-tree snapshot `3cc05f9f`). |
| Same house as Arrival | ✅ Concept B · Kept House · Warm Hour · pressed apple · Companion apple · constant shell, all carried. |
| Own personality | ✅ The window turns to the side (E2, *side-light across the page*); the hero shifts from the view to the food. |
| E2 honoured (not wallpaper) | ✅ Orchard is one committed region; **6/6 renders clear** — no reading content crosses onto the glass. |
| The forbidden feelings avoided | ✅ Not a database (food is the colour), not a dashboard (one ground, no metric tiles), not a collection of cards (objects on a warm shelf), not management software (recognition, not controls). |
| `COOK1` hard findings honoured | ✅ No "cooked" (K5), no favourite star (K4), season in the food not the room (K7), not a store (K2), orchard not wallpaper (K6). |
| Deliverables | ✅ Emotional philosophy (§ 2) · architectural blueprint (§ 3) · interior language (§ 4) · journey from Arrival (§ 5) · desktop/tablet/mobile concepts (§ 6) · production recommendations (§ 8) · rules (§ 7). |
| Renders | ✅ 6 viewport (2 views × 3 breakpoints) + 4 full-page, `deviceScaleFactor 2`, Fraunces real. |
| Product / schema / migration / tests | **None** — design blueprint and renders only. `meals-page.tsx` · `index.css` untouched. |
| Canonical orchard asset | **Byte-untouched.** Referenced in place; no substitute authored. |

**Artifacts**

```
scripts/north4-concepts/kitchen-experience.html   the Kitchen — two views (shelf · recipe), standalone
scripts/north4-concepts/render-kitchen.ts          renders 3 breakpoints × 2 views, with the E2 sanity check
scripts/north4-concepts/_palette.css               the derived Orchard Palette (unchanged, reused)
docs/ui-audit/house5-kitchen/                        10 renders (6 viewport + 4 full-page)
```

> **Tooling note.** Chromium revived against the curated nix library set (excluding glibc's own libraries
> and libcrypto/libssl/libz); the apple mask is inlined as a **data-URI** (`file://` mask-image loads empty
> headless). Same recipe as the Arrival line; recorded in the run file.

---

*HOUSE5 — The Kitchen. You walk from the Entrance Hall through the Cookbook door and the house does not
change around you — the same plaster, the same oak, the same morning — but the window turns to the side, the
light comes across the page, and there on the open shelf is your own book: the things you cook, warm because
the food is warm, known because the book is yours. The friend leans on the counter with one quiet line, the
apple is pressed into the wall for the eye to find, and the orchard is still there through the kitchen
window. It is the same house. It is the heart of it.*
