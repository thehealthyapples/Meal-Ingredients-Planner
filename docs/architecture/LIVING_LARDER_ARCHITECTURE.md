# THA Living Larder Architecture

**Document ID:** `LARDER5`
**Date:** 2026-07-24
**Status:** GOVERNING — the canonical spatial architecture of the Living Larder · governance only, nothing built or changed
**Rollback identifier:** `rollback/larder-architecture-20260724` → annotated tag object `d40190f0`, points at committed `1e0ac8ff`
**Author of record:** Colin Clapson (Home Owner) · drafted by Claude under the Engineering Workflow
**Classification:** Experience Architecture — the **spatial-composition** face of the Larder room. Subordinate to `LARDER1` (and through it to the Experience canon) and to `CRAFT1`; a non-overriding sibling of `LARDER2`, `LARDER3`, `LARDER4` and `ASSET1`.
**Governing documents:** [`LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md`](./LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md) (`LARDER1` — prevails in any conflict) · [`LIVING_LARDER_INTERIOR_ARCHITECTURE.md`](./LIVING_LARDER_INTERIOR_ARCHITECTURE.md) (`LARDER2`) · [`LIVING_LARDER_INTERACTION_CONSTITUTION.md`](./LIVING_LARDER_INTERACTION_CONSTITUTION.md) (`LARDER3`) · [`LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md`](./LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md) (`LARDER4`) · [`LIVING_LARDER_ASSET_LIBRARY.md`](./LIVING_LARDER_ASSET_LIBRARY.md) (`ASSET1`) · [`THA_CRAFTSMANSHIP_CONSTITUTION.md`](./THA_CRAFTSMANSHIP_CONSTITUTION.md) · [`GOVERNING_EXPERIENCE_ARCHITECTURE.md`](./GOVERNING_EXPERIENCE_ARCHITECTURE.md) · [`THA_EXPERIENCE_BLUEPRINT.md`](./THA_EXPERIENCE_BLUEPRINT.md) · [`THA_KEPT_ROOM_TRANSLATION.md`](./THA_KEPT_ROOM_TRANSLATION.md) · [`THA_UI_ARCHITECTURE.md`](./THA_UI_ARCHITECTURE.md) · [`LIVING_HOME_EXPERIENCE_ARCHITECTURE.md`](./LIVING_HOME_EXPERIENCE_ARCHITECTURE.md) · [`HOME_OWNER_ARCHITECTURE.md`](./HOME_OWNER_ARCHITECTURE.md)

---

> **What this document is.** The **canonical architectural definition of the Living Larder as a built space** — where the household stands, what they see, how the room is structured, where its light comes from, where the orchard is, where each wing stands in the volume, how the furniture itself becomes the navigation, and how the same room is composed for a desktop and for a phone. It is the governing design reference every future implementation of the room builds from, and it is written so that an engineer can build the room faithfully **without inventing the experience**.
>
> **What this document is not.** It is **not** an implementation, and it implements nothing: no route, component, token, asset, animation value, schema, migration, capability, string, or business logic changes because it exists, and no runtime code reads it. It is **not a second Larder canon**: it **restates no rule** of `LARDER1`–`LARDER4` or `ASSET1` and mints **no owner of any fact**. Where any of them owns a question, this document cites and defers. On any question of **rule**, that owner prevails and this document is corrected.
>
> **How it was written.** From the governing architecture, as though no implementation of the Larder had ever existed (`CRAFT1` § 7.1/§ 7.2, cited). The built room was opened only *after* the design in Part I and Part II was complete, and then only as reference material for § 16 (Implementation Considerations) — never as design authority (`CRAFT1` § 7.3, cited).

---

## 1. Why this document exists — the gap it closes

The Larder canon describes this room more completely than any other room in the house. `LARDER1` fixes **what the room is** and which owner every fact renders from. `LARDER2` designs **the interior** — the six wings, the furniture, the product forms, the availability-by-looking language, the growth model. `LARDER3` constitutes **how it is inhabited** — the object behaviours, the physics, shopping, removal, memory, search. `LARDER4` fixes **how it is built** — the layered order, the data-binding law, the rejection criteria, the Definition of Done. `ASSET1` specifies **what each object looks like** as an asset.

Between all of them sits one question none of them asks, and every implementation has therefore had to answer for itself, differently, every time:

> **Where is the household standing, what are they looking at, and what holds it all up?**

`LARDER2` names the furniture but not the **room the furniture is in**. It says shelving, cupboards, drawers, baskets, a working surface, cold doors, reserved bays — and it is silent on the walls they are fixed to, the floor they stand on, the eye they are seen with, the opening the light comes through, and the plan that says which wing is where. `LARDER3` says *"the household arrives into a room that is already there"* — and no document says where *there* is.

That silence is not a documentation gap. It is the **load-bearing gap**, because every one of the room's governing rules quietly depends on it:

- *"The furniture is built first and holds still"* (`LARDER4` § 6) requires something for the furniture to be fixed **to**. Without walls and a floor, "furniture" is a set of pictures on a field, and a set of pictures on a field is a card grid with better artwork — the exact defect `LARDER4` § 9 rejects.
- *"Composed emptiness, never bare emptiness"* (`LARDER2` § I.8) is **impossible without an architecture**: an empty shelf is composed emptiness only if there is a room around it. An empty shelf on a blank field is just a blank field.
- *"Take the object out of the house"* (`LARDER3` § 6) needs a **way out**. A room with no door cannot be left.
- *"The room holds still and is known by heart"* (`LARDER3` RM2) needs a **fixed viewpoint**. A room seen from nowhere in particular cannot be memorised.
- *"Solidity descends with importance"* (`LARDER2` § I.4) is a statement about **height in a volume**, and means nothing without an eye level to descend from.

This is a genuine architectural gap in the sense `CRAFT1` § 9 reserves for new architecture — a question the existing canon cannot resolve, in a room whose implementations have repeatedly been technically correct and spatially absent. This document closes it, and closes nothing else.

---

## 2. What this document owns — exactly, and nothing else

It owns the **spatial composition of one room**, in eight parts and no ninth:

1. **The Shell** — the Larder as a built volume: floor, back wall, two returns, the bounded top (§ 5).
2. **The Station Point** — where the household stands, and why (§ 6).
3. **The Viewing Angle** — the one projection the room is drawn in (§ 7).
4. **The Aperture** — the room's single opening: its daylight and its orchard, composed together (§ 8).
5. **The Plan** — where each of `LARDER2`'s wings stands in the volume (§ 9).
6. **Furniture as Navigation** — the room's navigation model: *look · open · reach*, and the refusal of navigation controls (§ 10).
7. **The Two Compositions** — the canonical desktop composition and the canonical mobile composition of one room (§ 11, § 12).
8. **The Personalisation Envelope** and **the Room Composition Principles** future Living Home rooms inherit (§ 13, § 14).

It owns **nothing else.** Every other value belongs to an existing owner and is **cited, never copied**:

| Concern | Canonical owner (cited, never re-owned here) |
|---|---|
| What the room is; the interaction outcomes and which owner each writes to; the accessibility floor; the rename | `LARDER1` |
| The wings, the furniture, the product forms, the availability-by-looking language, the growth model, the Two-Layer Law, the zone→owner map | `LARDER2` |
| The Object Constitution; the Movement Principles; shopping, removal, memory, search behaviour; `LIA1`–`LIA10` and the rejection criteria | `LARDER3` |
| The build order, the data-binding law, the engineering rejection criteria, the Definition of Done | `LARDER4` |
| Every asset specification, material treatment, and the asset lifecycle | `ASSET1` |
| The one sun, the one morning, the Orchard Exposure Scale, the three grounds, the room map | `THA_EXPERIENCE_BLUEPRINT.md` §§ 5.1, 6, 7, 8 |
| Every colour, token, type size, spacing value, radius, shadow and motion value | `THA_UI_ARCHITECTURE.md` |
| How each architectural characteristic becomes interface; the ordering laws | `THA_KEPT_ROOM_TRANSLATION.md` |
| The seven feelings and the emotional palette | `THA_EXPERIENCE_LANGUAGE.md` |
| The craftsmanship standard, the design method, the Quality Standard | `CRAFT1` |
| Final aesthetic approval | `HOME_OWNER_ARCHITECTURE.md` |
| Every business fact (staples · shopping · food identity · season) | Domains 30 · 15 · 2 · 11, per the Source of Truth Register |

**Restate-no-rule** (the `LIVINGHOME2` / `LHDC1` / `CRAFT1` discipline, cited). Every statement of an already-owned value here is a citation. Any sentence later found to duplicate an owned rule, design, behaviour or value is a defect in *this* document and is corrected to a citation.

**It sets no value.** No colour, dimension, ratio, breakpoint, duration, easing, or pixel appears in this document. It fixes *relationships* — what is above what, what is in front of what, what the light falls across, what stands on what — and every value that realises those relationships enters through the UI Architecture and `ASSET1`, by their own paths.

---

# PART I — THE ROOM

*Designed as an architect and production designer would design it: the volume before the furniture, the viewpoint before the composition, the light before the objects. Software is set aside entirely until Part III.*

---

## 3. The purpose of the room

`LARDER1` § 1 owns this and it is cited, not restated: the Larder is **a real household larder, not a list**; the household should feel *"that is my larder"*; and the one thing the room helps them do is **see what they normally keep, and keep that picture true** — without ever counting.

This document adds only the spatial reading of that purpose, which is the sentence the rest of the design follows from:

> **The room's purpose is served by being *seen*, not by being *used*. Every architectural decision below is subordinate to legibility at a glance from one fixed place.**

A larder that must be operated to be understood has already failed, however elegant its controls. So the architecture is chosen to maximise how much of a household's provisioning is answered by **looking**, and to reduce everything else to as few, as physical, and as forgiving acts as possible.

## 4. How the room welcomes

**The Larder does not greet. It is simply already there, and already kept.**

A household opens a larder door dozens of times a week. Nothing about that moment is ceremonial, and the room must not make it so. The welcome is entirely architectural — it is produced by the room being *found in the state it was left in*, warm and lit, with the household's own things where they put them.

Four things constitute the welcome, and each is a spatial decision:

- **The room is complete before you arrive.** Nothing assembles, slides in, staggers, fades up in sequence, or arranges itself while the household watches. The room was standing before the door opened. (`LARDER3` § 2 owns the *behaviour* of arrival — *"nothing loads at them; nothing rearranges for them"* — cited; this document fixes the *composition* that behaviour requires: a shell that can be drawn whole, independent of its contents.)
- **The light is on.** The room is met lit — the one morning already falling across the working surface and the dry store wall (§ 8). Being lit is the whole of the welcome; there is no other greeting device, no banner, no headline written across the room, and no summary to read before the household may look at their own shelves.
- **You can see the whole room from the door.** The composition is chosen (§ 6, § 7) so that a single look takes in every wing. A room that must be explored before it is understood is not hospitable; it is a maze with good manners.
- **The room is warm when it is empty.** A new household, or a household who keeps almost nothing, meets the same complete, lit, quiet room — furniture standing, shelves breathing, light across the wall (`LARDER2` § I.8; `LARDER4` § 4, cited). **Emptiness is a designed state of the architecture, and the architecture is what makes it survivable.**

This is hospitality before productivity (**GEA1**, cited) expressed as building rather than as words: the room receives the household by being a good room, not by saying anything.

## 5. The architectural structure — the shell

**The Larder is a small, single-aspect room, entered from one door, with three walls, one floor, and one window.** It is a *volume*, and the volume is the room's permanent architecture — more permanent than the furniture, which stands within it.

### 5.1 The elements of the shell

| Element | What it is | Why it is there |
|---|---|---|
| **The floor** | One continuous warm ground running from the near edge to the base of every wall, passing beneath every piece of furniture. | **The single most load-bearing element of the room.** A floor is what makes furniture *stand* rather than float. Without it, every shelf and cupboard is an image on a field, and the room is a collage. The floor is also the room's fourth interaction destination (§ 10.4) and its terminus on a phone (§ 12). |
| **The back wall — the Dry Store wall** | The room's focal plane, directly ahead of the household, carrying the full-height open shelving of Wing A. | It is what the household came to look at. Facing it squarely is why the station point is where it is (§ 6), and it is the surface the light is thrown across (§ 8). |
| **The left return — the working wall** | The wall to the household's left, carrying **the aperture** (§ 8), the working surface beneath it, drawers below, the spice rack and bottle run beside it. | A real kitchen puts the working surface at the window. Putting the room's still point in its light is both true and the reason the room feels inhabited rather than stocked. |
| **The right return — the cold and working-house wall** | The wall to the household's right, carrying the cold pair (fridge and freezer), the household cupboard and the hospitality store. | Cold storage belongs away from the window. This is ordinary household truth, and it is what makes the plan read as a real plan rather than an arrangement of panels. |
| **The near edge — the doorway** | The open side the household is standing in, unrendered because it is behind them. | **A room must have a way out.** The doorway is what makes *"take it out of the house"* (`LARDER3` § 6, cited) a direction rather than a metaphor, and it is where the shopping basket stands (§ 10.4). |
| **The bounded top** | The room is closed above by the topmost shelf and a band of quiet, lit wall. **No ceiling is drawn.** | A drawn ceiling lids the room and adds weight for nothing; a band of lit wall closes the volume while keeping it airy. *Surplus space becomes air and view* (**GEA11**, cited). |

### 5.2 The shell in section — how depth works

The room has exactly **three depth planes**, and they are the Blueprint's three grounds (§ 8.1, cited) as this room expresses them. The Larder invents no fourth.

```
        BACKGROUND                 MIDDLE GROUND               FOREGROUND
        (constant, product-wide)   (this room's identity)      (constant, product-wide)

        the orchard and the        THE SHELL AND ITS           overlays, dialogs,
        daylight it casts,         FURNITURE — floor,          the Companion
        seen only through          walls, shelving,
        the aperture (§ 8)         cupboards, drawers,
                                   baskets, cold doors,
                                   and the household's
                                   own provisions on them
```

Two consequences, both binding:

- **The room is entirely middle ground.** *"The middle ground is the whole trick of many places"* (Blueprint § 8.1, cited): the Larder expresses its whole character within its own ground plane and touches neither the background nor the foreground. Its ground posture is the room map's — **shelf strata** (Blueprint § 5.1, cited).
- **One ground per room, never nested** (Blueprint § 8.2, cited). Therefore: **no card, panel, tile, sheet, or bordered container may sit on the room.** The furniture *is* the surface. A summary strip laid across the shelves, a stats row floating above the floor, or a bordered section framing a wing are each a second ground and are refused. Where information must be attached to a thing, it is attached **to the thing** — a shelf edge, a label, a plate on a jar — never to a rectangle drawn over the room.

### 5.3 What the shell must never be

- **Never a background image.** The shell is architecture, drawn as architecture. A photograph or illustration of a pantry, laid behind the furniture, is *wallpaper* — a named spatial anti-pattern (Blueprint § 16, cited) — and it produces the exact contradiction the room cannot survive: furniture that does not touch the wall it is supposedly fixed to.
- **Never a page with a picture on top of it.** A landscape band above the room and a field of furniture below it is not a room; it is a page with a header. The orchard belongs **in the wall** (§ 8), not behind the page.
- **Never a stage.** No vignette, no spotlight, no darkened surround, no theatrical framing. The room is lit by one morning through one window and by nothing else (§ 8).
- **Never a set that changes.** The shell is byte-constant for every household and every season (§ 13; `LIVINGHOME1` — *the house holds still; the life moves*, cited).

## 6. Where the household stands — the station point

> **The household stands one step inside the door, at standing eye height, facing the Dry Store wall square-on.**

This is a fixed constant of the room. It never moves, never rotates, never responds to the pointer, never zooms, and is identical on every device (§ 12).

**Why one step inside rather than at the threshold.** From the threshold you see a doorway; from one step in you see a room, with both returns opening to either side and the floor running away beneath. It is the position from which the room is *entered* rather than *inspected*, and it is the position a person actually occupies when they open a larder and look.

**Why standing rather than seated or overhead.**

- **Never a plan view.** Nobody has ever known their own larder from above. A plan is a *map*, and a map is the exact abstraction — reading instead of seeing — that `LARDER1` exists to abolish.
- **Never a corner three-quarter view.** It looks impressive and it is unbuildable: one wall is always foreshortened into illegibility, the far corner is unreachable, and the shelf lines converge so hard that fullness — the room's entire availability language (`LARDER2` § I.8, cited) — can no longer be read.
- **Never a walk-in first-person space.** A room the household must *travel through* makes navigating the space the task, when the task is provisioning. It also crosses from *beautifully real* into *simulation* — `CRAFT1` § 5's boundary, cited — and it makes the room impossible to hold still (`LARDER3` `LIA5`).

**Why it matters that it is fixed.** A room can only be known by heart if it is always seen from the same place (`LARDER3` RM2/RM3, cited). The fixed station point is what turns *"the cumin is where the cumin lives"* from an aspiration into a fact: the cumin is at the same place on the household's screen today as it was yesterday, in the same light, at the same size.

**The eye level is the room's one datum.** The horizon sits at standing eye height and everything is composed against it — the working surface and drawers below it, the daily shelves at and just beneath it, the rarely-reached strata above it. This is what makes *"solidity descends with importance"* (`LARDER2` § I.4, cited) a spatial truth rather than a figure of speech.

## 7. The viewing angle — one projection, chosen for legibility

> **The room is drawn as a long-lens, one-point elevation: the vanishing point sits behind the centre of the back wall at eye height, and the focal length is long enough that the back wall reads as a true elevation while the returns, the window reveal and the shelf undersides recede just enough to be a volume.**

The whole design turns on one trade-off, and it is worth stating why it resolves the way it does.

- **An elevation is the only projection in which a shelf is legible.** Straight-on, a row of jars is a row of jars: each at its own honest level, each the same size, each readable. That legibility *is* the North Star (`LARDER1` § 1, cited). No amount of atmosphere is worth losing it.
- **But a pure orthographic elevation is a drawing, not a place.** With zero recession there is no depth, no reveal, no underside, no sense of standing anywhere — and a room you are not standing in cannot be entered, cannot be left, and cannot receive an object taken out of it.

The long-lens elevation takes both. It is the production designer's answer, and it is what a real photograph of a larder taken from the door on a long lens actually looks like: the wall you are facing is square and readable; the room around it is unmistakably a room.

**The rules that ride on the projection:**

1. **The perspective is shallow and fixed.** It never deepens, never rotates, never parallaxes, never tracks the pointer, never responds to scroll. The room holds still (`LARDER3` M3/`LIA5`, cited).
2. **The back wall is drawn square.** Shelf lines are horizontal; jars, tins and bottles are undistorted; no object on the focal wall is ever foreshortened out of readability.
3. **Recession is carried by the returns, not by the contents.** Depth is expressed through the side walls, the window reveal, the shelf undersides and the floor — never by shrinking, skewing or tilting a provision. **A jar is never drawn in perspective**; a jar is a jar.
4. **One consistent scale.** Every object is drawn to one scale, so a large jar is genuinely larger than a small jar and a tin is genuinely smaller than a cupboard. Scale is information, and inconsistent scale is a lie about the household's own provisions.
5. **No camera exists.** There is no zoom, no pan, no dolly, no "focus on this shelf". Opening a cupboard does not move the viewer (§ 10.3); it opens a cupboard.

## 8. Daylight and the orchard — the single aperture

> **The Larder has exactly one opening, and it is both the room's window onto the orchard and the room's only source of light. The two are the same thing, because in a real room they always are.**

### 8.1 Where it is, and why

**The aperture is in the left return, set forward — nearest the household — and tall.**

This position is *forced*, not chosen, by a governing law: the house has **one sun, upper-left, one morning, in every room forever, and every shadow on every surface in every domain agrees** (Blueprint § 7, cited). A window drawn on the right while shadows fall to the right is a **second sun** — a named anti-pattern (Blueprint § 16, cited) and the most immediately felt kind of dishonesty a rendered room can commit. One opening, upper-left, is the only composition in which the room's light and the room's view are the same fact.

Placing it *forward* rather than deep does the rest of the work:

- The morning falls **across** the room, left to right, and lands on the **Dry Store wall** — so the room's focal surface is its best-lit one, which is exactly right, because it is the surface the household reads.
- The **working surface sits beneath and beyond it**, so the room's still point stands in its own light (`LARDER2` § I.4, cited).
- The **produce baskets sit in that light** — which is what `LARDER2` § I.5-C1's *"kept at eye level and in the light"* means once the room has a light to be in. This is the room quietly making the fruit bowl the easiest thing to reach, achieved by architecture rather than by advice.
- Every shadow in the room — under every shelf, beside every jar, beneath every cupboard — falls **down and to the right**, from one source, without exception.

### 8.2 What the orchard is, here

The Larder's orchard exposure is **E2 — the window**, and the room map records it as *"the smallest window"* (Blueprint §§ 5.1, 6.2, cited). This document sets no exposure value; it composes the one the Blueprint already fixed:

- **The orchard is seen *through* the architecture, never hung *on* it.** The aperture's edge is the wall's own reveal — the thickness of the wall the household is looking through — and never a drawn frame or moulding. The Blueprint's own test applies: *"a frame you could lift off the wall and hang elsewhere is decorative and forbidden; a reveal the wall turns into, that the orchard is genuinely behind, is architecture"* (§ 6.2 rule 4, cited).
- **It is a window, not an arch.** The plaster aperture admitted by `ARRIVAL1` is **Home only**, explicitly — *"no E2 room gains an arch by this rule"* (Blueprint § 6.2 rule 4, cited).
- **It is one committed region the content deliberately does not cover** (Blueprint § 6.2, E2, cited). No shelf, object, control or provision is ever composed over the view.
- **It carries no type, and it never animates** (Blueprint § 6.1, cited). No weather, no wind, no season, no hour: the orchard keeps its one season and one morning absolutely (`LIVINGHOME1`; `LIVINGHOME2`, cited). *Time may aim words and doors, never light* (`HT13`, cited).
- **It is never behind the page.** The refusal is stated as a rule because it is the failure this room has actually made: an orchard photograph laid as a page-header band above the room turns the view into a **poster** and the room into a page. **The orchard belongs in the wall.**

### 8.3 The empty-room clause

Blueprint § 6.2 rule 2 permits an honestly empty room to open its window **one level, never two**, returning to its level the moment content exists. The Larder may take this: a genuinely empty larder — a new household, or one who keeps nothing yet — may stand at **E3** and let the morning and the orchard fill more of the room, because a warm, light, half-glazed empty larder reads as *ready*, whereas a dim empty larder reads as *abandoned*. It returns to **E2** the moment the household keeps anything at all. This is the Blueprint's rule applied, not a new one; it introduces no second exposure value and no per-surface choice.

## 9. The plan — where each wing stands

`LARDER2` § I.3/§ I.5 owns the six wings, what each is for, what belongs in it, and how a family uses it. It is cited and not restated. This section owns only **where each stands in the volume** — the plan that has been missing, and without which every implementation has had to guess.

### 9.1 The plan (looking down)

```
                          ═══════ BACK WALL — WING A · THE DRY STORE ═══════
                          A3 tins ·  A2 jars & large jars ·  A1 dry goods
                          A7 preserves            │        F2 reserved bays
      ┌───────────────────────────────────────────┴──────────────────────────┐
      │                                                                      │
  L   │  ▓ APERTURE ▓                                          ▒ COLD PAIR ▒ │   R
  E   │  the one morning                                       C2 fridge     │   I
  F   │  E2 · the orchard                                      C3 freezer    │   G
  T   │        ↓ light falls across the room ↘                               │   H
      │  [ WORKING SURFACE ]                                   E1 household  │   T
  R   │  A4 baking · A5 spice · A6 oils                        E2 pet corner │
  E   │  B1 breakfast · B2 tea & coffee                        D1 hospitality│   R
  T   │  C1 produce baskets (in the light)                     D2 drinks     │   E
  U   │                                                        F1 seasonal   │   T
  R   │                                                                      │   .
  N   └──────────────────────┐                    ┌──────────────────────────┘
                             │   ▲  ▲             │
                             │   │  │             │
                             │  DOORWAY           │      ← the household stands here,
                             │  ⌂ the basket      │        one step inside
                             └────────────────────┘
```

### 9.2 The elevation (what the household actually sees)

```
  ┌───────────────────────────────────────────────────────────────────────────┐
  │  ░░░ quiet lit wall — the room's bounded top, no ceiling drawn ░░░        │
  │ ┌──────────┐  ═══════════════════════════════════════════   ┌──────────┐ │
  │ │▓ ORCHARD▓│  ──── A3 · tins ─────────────  F2 · reserved    │ ▒▒▒▒▒▒▒▒ │ │
  │ │▓ E2 the ▓│  ═══════════════════════════════════════════    │ ▒ COLD ▒ │ │
  │ │▓ window ▓│  ──── A2 · jars & large jars ─────────────      │ ▒ PAIR ▒ │ │
  │ │▓ ▁▁▁▁▁▁ ▓│  ═══════════════════════════════════════════    │ ▒ C2·C3▒ │ │
  │ └──┬───────┘  ──── A1 · dry goods ──── A7 · preserves ──     │ ▒▒▒▒▒▒▒▒ │ │
  │  A5│spice     ═══════════════════════════════════════════    ├──────────┤ │
  │ ▁▁▁┴▁▁▁▁▁▁▁                                                  │ E1 · D1  │ │
  │ [ working  ]  ── B1 breakfast ──── B2 tea & coffee ────      │ E2 · D2  │ │
  │ [ surface  ]  ═══════════════════════════════════════════    │ F1       │ │
  │ ▔▔▔▔▔▔▔▔▔▔▔                                                  │ (closed) │ │
  │ ▤ drawers ▤   ◟ C1 produce baskets ◞      A6 · oils          └──────────┘ │
  │ ▤ A4 bake ▤                                                              │
  ├───────────────────────────────────────────────────────────────────────────┤
  │  ╱╱╱  FLOOR — one continuous ground, running to the base of every wall ╱╱ │
  │     ⌂ the shopping basket, by the door, at the household's feet           │
  └───────────────────────────────────────────────────────────────────────────┘
       light falls from the upper left ↘ · every shadow in the room agrees
```

*(Both diagrams are schematics of relationship — what is above, beside, and in front of what. They are **not** a wireframe, a grid, or a set of proportions. Every dimension, ratio and value enters through the UI Architecture and `ASSET1`.)*

### 9.3 The three placement laws

- **Placement follows reach, not taxonomy.** A wing stands where a household would want it, given where they are standing: what is touched daily is at hand and at eye level; what is touched rarely is high, deep, or behind a door; what must be cold is furthest from the light. This is `LARDER2` § I.3's organising principle — *human use, arranged in space* (cited) — finally given the space.
- **Enclosure follows exposure.** The wings a household reads constantly are **open** (Wing A's shelving, the baskets, the spice rack, the working surface). The wings they consult occasionally are **enclosed** (the household cupboard, the hospitality store, the drinks, the seasonal bay, the cold pair). This is not decoration: it is what keeps the room quiet while holding everything. **A room can hold more by showing less.** (**GEA2** — *a more capable THA is a quieter THA*, cited.)
- **The plan is permanent.** A wing never moves. New areas land in the reserved bays (`LARDER2` § I.9's Growth Law, cited); they never displace an existing wing, and the household never returns to find the room rearranged (`LARDER3` RM2, cited).

## 10. Furniture as navigation

> **The furniture is the navigation. The Living Larder contains no navigation control of any kind.**

This is the room's single most consequential structural decision and the one an implementation is most likely to abandon under pressure, because navigation controls are what a page reaches for when it has more content than space. A room reaches for **furniture** instead.

### 10.1 What is refused, explicitly

Inside the room there is **no** tab bar, segmented control, category chip row, filter bar, dropdown, accordion header, breadcrumb, pagination, sort control, view-switcher, or "see all" link. There is no list of categories anywhere. The household never chooses a category; they **look at a shelf, or open a cupboard**.

This is not stylistic. Each of those controls is a *second, abstract copy of the room's structure* laid over the room — so the household would have to learn the room twice, and the abstract copy would win, because it is easier to read. That is precisely how a room becomes a list wearing a room's vocabulary (`LARDER4` § 9, cited).

### 10.2 The three verbs, and no others

| Verb | What it acts on | What it costs the household |
|---|---|---|
| **Look** | Everything open: the Dry Store shelving, the baskets, the spice rack, the working surface, the bottle run | **Nothing.** No act at all. |
| **Open** | Enclosed furniture only: the household cupboard, the hospitality store, the drinks, the seasonal bay, the drawers, the fridge, the freezer | One deliberate act on one physical thing. |
| **Reach** | One object, to act on it: lift a jar, take a tin, pick something from a basket | One deliberate act on one object. |

**The majority of the room is answered by *look*.** That is the design target and the measure of whether the composition succeeded: if a household must *open* things to know what they keep, the room has put too much behind doors, and the balance of § 9.3's enclosure law is wrong.

### 10.3 Opening is disclosure in place

- **A cupboard opens *within* the room.** Its contents are revealed on and around the furniture itself; the room stays visible and unmoved around it. Nothing navigates away, nothing routes, nothing fills the screen, no sheet slides up, no dialog opens, and the viewpoint does not move (§ 7 rule 5).
- **The room has one address.** Nothing inside the Larder is a location. A household's position within their own room is not a thing to be linked, bookmarked, or restored from a URL — you do not have a bookmark for your own cupboard. The way out of an open cupboard is to close it, never the browser's back button.
- **One enclosed thing is open at a time.** Opening a second closes the first, quietly, the way a person closes one cupboard as they open the next. This keeps the composition stable, the room calm, and the household's place in it unambiguous.
- **Everything returns to rest.** A room left alone settles back to closed. Nothing stays hanging open across visits, because a real larder does not.

### 10.4 The four destinations — why the composition makes drag natural

Drag-and-drop is natural in this room for one reason: **the room supplies real places to drag things to.** Every interaction outcome `LARDER1` owns has a physical destination in the composition, visible from the station point, and none of them is an abstract drop zone.

| The household's act | Its destination in the room | The outcome, and its owner (`LARDER1`, cited) |
|---|---|---|
| *"We need another one"* | **The shopping basket, on the floor by the door, at their feet** | Originates a **Domain 15** entry. **The provision stays on its shelf** (`LARDER1` § 8, the load-bearing rule, cited). |
| *"We don't keep this any more"* | **Out through the doorway** — the near edge, the way they came in | A **Domain 30** soft-delete (`LARDER1` § 4.2, cited). Reversible. |
| *"Put it back"* / *"We keep this again"* | **Back onto its own shelf**, or **in from the doorway** | Return to place, or a **Domain 30** restore (`LARDER1` § 4.3, cited). |
| *"Never mind"* | **Its own home** — released anywhere else, it goes back where it lives | No write at all (`LARDER3` M4, forgiving return, cited). |

Three properties fall out of the composition and are the reason it works:

- **The motions are short and downward.** The basket is at the household's feet and the doorway is at the near edge — so both destructive-feeling acts are a movement **toward the viewer and down**, which is exactly the physical motion of putting something in a basket or carrying it out. Nothing requires a long, precise traverse across the room.
- **The destinations are always visible.** The basket and the doorway are in the composition at all times, from every wing, without scrolling on desktop. A drop target the household must go and find is a UI zone, not a place.
- **They are places, not modes.** Nothing "enters drag mode", no zones light up as rectangles, no instructional overlay appears. The basket is a basket whether or not anything is being carried.

**And none of it is required.** Drag is an enhancement; every one of these outcomes is reachable by keyboard, screen reader, switch, and plain tap through the object's own actions, announced as the physical thing it is (`LARDER1` § 10; `LARDER3` M7/`LIA7`, cited). The composition's job is to make the physical route *natural*, never to make it *necessary*.

## 11. The desktop composition

**The whole room, in one view, from the station point.** On a pointer device the household sees the complete volume — both returns, the back wall, the floor, the aperture, the basket by the door — without scrolling. This is the canonical composition; everything else is a transposition of it.

- **Nothing is off-screen.** Every wing is present. Where a wing holds more than its furniture can show, the surplus is **behind a door** (§ 9.3), never below the fold.
- **The room fills the frame; the frame does not crop the room.** As the window widens, the room gains **air and light** — more floor, more lit wall, a more generous aperture — never more furniture and never more content (**GEA11**, cited). As it narrows toward a tablet, the returns compress toward the back wall before anything is dropped, and the room reaches the mobile composition (§ 12) rather than a broken desktop one.
- **The proportions are true at every width.** One scale governs the room, so a jar is the same size relative to its shelf on a laptop as on a large display. The room is never stretched, letterboxed, or re-proportioned per breakpoint.
- **The shell holds the composition together.** The floor runs unbroken beneath everything; the walls meet at their corners; the light crosses the whole room from one source. These three are what make a set of furniture read as one room, and they are the first things to verify in any built pass.

## 12. The mobile composition

**The same room, from the same place, seen through a narrower field of view.** A phone does not get a different Larder, a reduced Larder, or a list. It gets the room a person sees when they stand in the same doorway and can only take in one part of the wall at a time — so they look down it.

`LARDER1` § 5 owns the model — *vertically scrollable physical sections, the same visual Larder, tap and swipe reaching identical outcomes* — and is cited, not restated. This document owns the **composition** that model requires:

- **The station point, the projection, the light and the scale are unchanged.** Same doorway, same eye height, same long-lens elevation, same one morning from the upper left, same object scale. A phone is a narrower view of one room, **never a different room and never a plan**.
- **The three walls are transposed into one continuous wall,** read top to bottom in the order the household moves through the room: **the aperture and the working surface → the Dry Store → the Daily Rhythm → the Cool Store → Hospitality and the Working House → the Seasonal and Growing bay → the floor.**
- **The room is entered through its light.** The aperture sits in the upper-left of the first screenful, so the household meets the orchard and the morning first — exactly as they do on a desktop — and the whole column is lit from that one direction all the way down.
- **The floor is always the last thing.** Reaching the floor is how the household knows they have seen the whole room. A room that ends is a room that can be finished; an infinite scroll is a feed, and this room is not a feed.
- **At least one complete piece of furniture is always in view,** with the wall behind it and the floor or shelf beneath it. Scale is bounded so the room never degenerates into a carousel of large objects with no context — the moment a single jar fills the screen, the household is looking at an item, not a larder.
- **Nothing is dropped, and nothing is added.** Every wing, every piece of furniture and every provision present on a desktop is present on a phone. The field of view narrows; the room does not shrink. Equally, no control appears on mobile that does not exist on desktop — no filter bar "for small screens", no category picker "to save space". § 10's refusal is absolute and device-independent.
- **The basket and the doorway travel with the household.** The two interaction destinations (§ 10.4) must be reachable from wherever they are in the scroll — remaining *places in the room* rather than becoming a floating toolbar. **This is the hardest single composition problem in the room, and it is named here as such rather than solved by a bar pinned to the bottom of the screen**, which would be a navigation control by another name.

## 13. Personalisation — the envelope

The Living Home law is cited and not restated: **the house holds still; the life moves** (`LIVINGHOME1`, cited). Applied to this room's architecture, it draws one clean line.

**Permanently the house's — identical for every household, forever:** the shell (floor, walls, doorway, bounded top), the station point, the viewing angle, the aperture and its light, the plan, the material and colour language, the navigation model. **None of this is ever personalised, chosen, configured, themed, or preferred.**

**Permanently the household's:** *what stands in the room, and where they put it.*

- **Which furniture is present.** A household with no pets has no pet corner; a household that keeps no alcohol has no drinks shelf. The room shows the storage a household actually uses and is warm and quiet where they use none (`LARDER2` § I.5-E2, § I.8, cited) — **honest absence, never a shelf insisting on being filled.**
- **Where a provision lives.** Household-authored arrangement is `LARDER3` RM4's — a lawful future use of the existing `sortOrder` field, **declared and not built** (cited, unchanged, and not advanced by this document).
- **What the room grows into.** New areas arrive by `LARDER2` § I.9's Growth Law, landing in the reserved bays, earned by a real rhythm of family life — never by a preference setting.

**Explicitly refused, permanently:** themes, skins, colour choices, layout choosers, density settings, a rearrangeable dashboard, alternate viewpoints, a "customise your larder" surface, or any control whose purpose is to make the room look different rather than to keep it true. A room that can be configured cannot be known by heart, and being known by heart is the entire point (`LARDER3` § 7, cited).

**Environmental Dressing remains refused in this room.** *No produce dressing in the Pantry room* (`LIVINGHOME2` § 5.1, cited): every basket, jar and bowl in the Larder is the household's own, data-borne. **If the room put it there, it is refused; if the household keeps it, it belongs** (`LARDER2` § II.12, cited).

---

# PART II — THE INHERITANCE

## 14. The Room Composition Principles — what every future Living Home room may inherit

`LARDER1` § 17 records that the Larder's physical-room approach *"also informs the future design of Home, Cookbook and Planner"* — **as a direction, not a definition** (cited). That direction has now been worked out as an actual composition, and the transferable part of it is stated here as twelve principles.

**These are composition principles only.** They define no room but this one. Each is either **new** — owned here — or **the general form of an existing Larder rule**, in which case the room-specific rule stays with its owner and only the generalisation is owned here. **No future room is bound by these until its own North Star adopts them, through its own gates** (`GEA20`, cited).

| # | Principle | Status |
|---|---|---|
| **RC1** | **A room is a volume, not a page.** It has a floor, walls, a bounded top and a way out. Nothing in a room floats on a field. | New |
| **RC2** | **One station point per room, fixed forever.** The household stands in one place; the room never moves under them, and is therefore learnable by heart. | New (general form of `LARDER3` RM2/`LIA5`, cited) |
| **RC3** | **One projection, chosen for legibility.** The long-lens elevation: the focal wall square and readable, the returns carrying the depth. Never a plan, never a rotating space, never a camera. | New |
| **RC4** | **One aperture, and it is the light.** A room's window is its light source; the direction of the light and the direction of the view agree. No second sun; the orchard is in the wall, never behind the page. | New (composes Blueprint §§ 6.2, 7, cited) |
| **RC5** | **The furniture is the navigation.** *Look · open · reach.* No navigation control belongs inside a room. | New |
| **RC6** | **Opening is disclosure in place, never replacement.** A room has one address; nothing inside it is a location. | New |
| **RC7** | **One ground per room; nothing sits on it.** Information attaches to things, never to rectangles drawn over the room. | General form of Blueprint § 8.2, cited |
| **RC8** | **Interaction destinations are places, not zones.** Every gesture ends somewhere the household can see and name, and every one has a non-gestural equivalent. | New (general form of `LARDER1` § 10, cited) |
| **RC9** | **Mobile is a narrower field of view, never a different room.** Same station point, same projection, same light, same scale; the room is transposed, never reduced. | New (general form of `LARDER1` § 5, cited) |
| **RC10** | **The shell is the house; the contents are the household.** Nothing architectural is ever personalised. | General form of `LIVINGHOME1`, cited |
| **RC11** | **The room is complete when empty.** The architecture stands, warm and lit, before any content exists. | General form of `LARDER2` § I.8 / `LARDER4` § 4, cited |
| **RC12** | **The room ends.** It has an edge, a floor and a last thing — never an infinite surface. | New |

**The interaction language these establish, in one sentence:** *in a Living Home room, a household looks at real things standing in a real place seen from one fixed doorway, opens what is enclosed, reaches for what they mean to act on, and carries things to places rather than choosing operations from controls.*

---

# PART III — THE BINDING

## 15. Compliance

### 15.1 Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity — one home, one orchard, one Companion untouched. One
  Larder, one shell, one station point, one projection, one aperture.
☑ One owner per fact — no fact gains a second owner. This document owns only
  the room's spatial composition (§ 2) — a concern no document previously
  owned. Staples stay Domain 30; buying stays Domain 15; food identity stays
  Domain 2; season stays Domain 11.
☑ No duplicate ownership — § 2 lists exactly what is owned; every other value
  is a citation. Any duplicate later found is a defect corrected to a citation.
☑ No duplicate business logic / state — none touched; no store, schema or
  persistence created.
☑ Existing owners remain unchanged — LARDER1–4 and ASSET1 are byte-untouched;
  not one rule, value, token, law, domain or gate moves.
☑ Extends existing architecture — the spatial-composition face of the Larder
  canon, in the OHDB1/LHDC1 mould, adding no gate and no rival governance.
☑ Governance only — designs a room; ships nothing.
☑ Honest gaps over fabricated information — the room states only what its
  owners know; § 8.2 refuses a window that lies about its own light, and § 5.3
  refuses a shell that is a picture of a room rather than a room.
☑ No permanent synchronisation bridge — none; nothing runs.
☑ Evolution over replacement — supersedes no document and retires none.
```

### 15.2 Experience Constitution Check
*(`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 18.2, answered before design began.)*

- **Hospitality (§ 3.1):** ✅ The welcome is architectural — a complete, lit room found as it was left (§ 4). The room receives the household before it asks anything of them.
- **Outcome (§ 3.5):** ✅ *Less to carry.* The composition is chosen so that most of a household's provisioning question is answered by looking, and the rest by two physical acts.
- **Weight (`GEA2`):** ✅ Zero visible weight — a governing document. And the design makes the room lighter as it grows: § 9.3's enclosure law and § 10's refusal of controls mean a household who keeps more meets no more interface.
- **Voice (`GEA8`/`GEA9`):** ✅ No room or Companion voice is added or moved. The room shows; interpretation stays the Companion's, entered through its registered doorway (`LARDER1` § 9, cited).
- **Ownership (`GEA21`/`GEA22`):** ✅ The room observes the way a window observes — it shows what is there and has no view about it. Nothing here gives the room an opinion.
- **Agency (`GEA23`):** ✅ Every act in the composition is the household's, physical, and reversible; nothing is decided for them and nothing is graded (`GEA13`, cited).
- **Restraint (`GEA11`/`GEA13`/`GEA15`):** ✅ Surplus width becomes **air and light, never more content** (§ 11); no score, rank, streak or reward; no number where a glance suffices; the room is silent by default.
- **Layer (`GEA20`):** ✅ It sits at the Experience-Architecture altitude, names the Experience Constitution above it and `LARDER1` above/beside it, cites every fact- and value-owner, and originates no implementation law. It sets no value.

### 15.3 AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ No new AI capability — none defined, registered or consumed. Any Larder
  intelligence routes through the existing, permission-aware `pantry`
  capability (LARDER1 § 9, cited).
✓ Companion ownership unchanged — reasoning, voice, grounding (INT17),
  selection (INT20) and conversation state stay with their owners. The
  Companion remains a presence, not a room (Blueprint § 5.1, cited); this
  document gives it no place in the Larder's shell and no surface of its own.
✓ Reuses existing business services — reads and writes stay with Domains
  30/15/2/11's existing owners; none is touched.
✓ Creates no second assistant · duplicates no conversation state.
✓ Honest gaps over fabricated knowledge — where the room cannot know
  something (quantity, freshness, expiry) it shows nothing rather than
  inventing it (Core Principle 6; LARDER1 § 14, cited).

If any check fails: STOP. Explain why. Do not continue.
```

### 15.4 Data Impact

- **Reads:** nothing new. The room reads exactly what `LARDER1` § 13 and `LARDER2` § II.11 already declare — Domain 30 (staples, place, availability), Domain 2 (food identity), Domain 11 (season, where already exposed).
- **Writes:** **no new runtime data.** This document creates no table, column, row, migration, capability, route, or write path.
- **Changes no existing data meaning.** `category`, `defaultHave`, `sortOrder`, `isDeleted`, `needQuantityValue` and `needUnit` keep exactly their owner's meaning.
- **Requires no backfill.** No column is added and no meaning migrated.

### 15.5 Trust Check
*(The One Question — `THA_BRAND_CONSTITUTION.md`, cited.)*

- **Less to carry?** ✅ The household reads their larder by looking, from one place they never have to learn twice, with no controls to operate and no list to maintain.
- **Could they trust everything it tells them?** ✅ The architecture is built to be honest about itself as well as about the data: **one light source that agrees with the window it comes from** (§ 8.1), **one scale so a large jar is genuinely large** (§ 7 rule 4), **a floor so nothing floats** (§ 5.1), **no drawn fullness the owner does not hold** (`LARDER2` § I.8, cited), and **an empty room that is warm rather than pretending to be full** (§ 4). A room that lies about its own light will not be believed about a household's allergens. The physical metaphor never becomes a claim (`LARDER1` § 14, cited).

## 16. Implementation considerations
*(Recorded, deliberately **not** implemented. `LARDER4` owns the build discipline and § 14 there governs when a build may begin; nothing here authorises one.)*

These are the consequences an implementer will meet. They are observations for whoever builds the room, not instructions and not design.

1. **The shell is the largest missing piece, and it is architecture, not artwork.** The floor, the two returns, the back wall, the window reveal and the bounded top are structural elements that must exist before any furniture is placed (`LARDER4` `LI2`, cited). They are house-class — constant, data-free — and their treatment falls under `ASSET1`'s governance and the Home Owner's approval, not this document's.
2. **The room needs one scale system.** § 7 rule 4 and § 11 both depend on a single scale governing every object and every width. A proportion system of this kind was already discovered once in an earlier pass; whether that work is reused is an implementation judgement under `CRAFT1` § 7.3 (existing code is reference material).
3. **The perspective is drawn, not transformed.** § 7's shallow recession belongs in the composition and in the assets. Achieving it with 3D transforms would make it a camera, which § 7 rule 5 forbids, and would put it at the mercy of a browser's rendering rather than the Home Owner's approval.
4. **The aperture is a composition problem, not an image slot.** § 8 requires the orchard to sit inside the room's middle ground with a wall reveal and consistent light — not as a background layer, a header band, or a page-level image.
5. **`ASSET1` will need architectural classes it may not yet have** — a wall plane, a floor plane, a corner return, a window reveal — distinct from furniture. Whether they exist is an inventory question for `ASSET1`'s owner.
6. **Open-in-place needs one room state.** § 10.3's *one enclosed thing open at a time, everything returns to rest* is a single piece of room state, not per-component state, and it must be keyboard- and screen-reader-operable with disclosure announced as what it physically is (`LARDER1` § 10, cited).
7. **The mobile travelling destinations (§ 12) are the hardest problem in the room.** They must remain places rather than becoming a pinned toolbar. If they cannot be built as places, that is a genuine constraint and `LARDER4` § 2's **STOP rule** applies — surface it, do not silently approximate it.
8. **Most of the room is static.** The shell and the furniture do not change; only the household's provisions do. That is a performance property worth preserving deliberately, and it is also the structural proof of `LARDER4` § 6's law — *products populate the room; the room is never generated from products.*
9. **The empty room is built first and verified first** (`LARDER4` § 4, cited). If the empty room does not look complete, nothing built on top of it will.

## 17. Scope Lock, and the items requiring a separate decision

**This document is an architecture, not an implementation.** It designs one room and fixes the composition every future implementation must build toward. It builds nothing, authorises nothing, and deploys nothing.

**In scope (declared, not built):** the shell; the station point; the viewing angle; the aperture and its light; the wing plan; furniture-as-navigation and the three verbs; the four interaction destinations; the desktop composition; the mobile composition; the personalisation envelope; the twelve Room Composition Principles.

**Out of scope / deliberately deferred:**
- Any UI implementation, component, token, asset, animation value, route, or string.
- Every value — colour, dimension, ratio, breakpoint, duration, easing — which stays the UI Architecture's and enters by its own path.
- Every asset specification, which stays `ASSET1`'s.
- Any new stored fact — quantity, measure, freshness, expiry, or a second categorisation — and any change to Domain 30's category enum. These remain the governed acts `LARDER1` § 15 and `LARDER2` § II.15 declared and did not perform, **unchanged and not advanced here.**
- Household-authored arrangement (`LARDER3` RM4) — declared-not-built at its owner, and left there.
- Renaming internal identifiers (route `/pantry`, the `pantry` capability id, the `user_pantry_items` table).

**Discovered items requiring a separate decision** *(reported, not resolved here)*:

1. **The aperture is on the left; the approved North Star imagery composes the orchard on the right.** This document places the room's single opening in the **left return** because the house's one morning sits **upper-left forever, and every shadow in every room must agree** (Blueprint § 7, cited) — a window opposite the light is a second sun. The North Star imagery guides *feeling, hospitality and composition* and is explicitly not a wireframe, so no rule is broken by the divergence; but it is a **visible** divergence from an approved image, and the choice between *one honest aperture on the left* and *a right-hand view with its light reconciled some other way* is a **Home Owner decision** (`HOMEOWNER1`, cited), recorded here rather than made quietly.
2. **The naming divergence is inherited unchanged.** The user-facing label is *Larder* while the route `/pantry`, Domain 30's Register name, the `pantry` capability id and the `user_pantry_items` table stay "pantry" (`LARDER1` § 15, cited). Unresolved, and not resolved here.

**Position in the canon.** Subordinate to `LARDER1` and, through it, to the Experience canon; subordinate to `CRAFT1`; a non-overriding sibling of `LARDER2`, `LARDER3`, `LARDER4` and `ASSET1`. `LARDER1` owns the room's *destination and owners*; `LARDER2` its *interior*; `LARDER3` its *inhabitation*; `LARDER4` its *build discipline*; `ASSET1` its *objects*; **this document owns only the room's *space*.** Where any conflict appears, **`LARDER1` prevails, then `CRAFT1`, and this document is corrected.**

**Final aesthetic approval** of the room's character — its warmth, its light, its materials, and the admission of the composition above — rests with the **Home Owner** (`HOMEOWNER1`, cited). The room is finished only when the answer to *"Would I happily spend time here?"* is yes (`CRAFT1` § 8, cited).

---

*This is governance. It creates no route, capability, entity, token, component, string, asset, animation value, schema, migration, or business logic, and no runtime code reads it. It sets no value and mints no owner of any fact. It answers one question the Larder canon had left open — where the household is standing, what they are looking at, and what holds it up — and answers nothing else. A larder is not a set of shelves; it is a room with shelves in it, a floor beneath them, a window that lets the morning in, and a door you can carry something out of. Build the room, and the shelves will be somewhere.*
