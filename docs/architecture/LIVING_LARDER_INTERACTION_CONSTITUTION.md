# THA Living Larder Interaction Constitution

**Document ID:** `LARDER3`
**Date:** 2026-07-22
**Status:** GOVERNING — the behavioural constitution of the Larder room · governance only, nothing built or changed
**Rollback identifier:** `rollback/living-larder-interaction-constitution-20260722` → `5faa05f4`
**Author of record:** Colin Clapson (owner) · drafted by Claude under the Engineering Workflow
**Classification:** Experience Architecture — the interaction-behaviour face of the Larder room (subordinate to `LARDER1`, and through it to the Experience canon)
**Governing documents:** [`LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md`](./LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md) (`LARDER1`, the room's North Star — prevails in any conflict) · [`LIVING_LARDER_INTERIOR_ARCHITECTURE.md`](./LIVING_LARDER_INTERIOR_ARCHITECTURE.md) (`LARDER2`, the room this document is inhabited within) · [`GOVERNING_EXPERIENCE_ARCHITECTURE.md`](./GOVERNING_EXPERIENCE_ARCHITECTURE.md) · [`THA_KEPT_ROOM_TRANSLATION.md`](./THA_KEPT_ROOM_TRANSLATION.md) · [`THA_UI_ARCHITECTURE.md`](./THA_UI_ARCHITECTURE.md) (owner of the motion vocabulary — cited, never overridden) · [`THA_EXPERIENCE_LANGUAGE.md`](./THA_EXPERIENCE_LANGUAGE.md) · [`THA_CRAFTSMANSHIP_CONSTITUTION.md`](./THA_CRAFTSMANSHIP_CONSTITUTION.md) · [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md)

---

> **What this document is.** The **behavioural constitution of the Larder** — how a household physically *inhabits and interacts with* the room `LARDER2` designed. It completes the Larder trio: **`LARDER1`** owns *what the room is, what interactions exist, and which owner each writes to*; **`LARDER2`** owns *the room's interior design — its furniture, wings, and product forms*; **this document (`LARDER3`)** owns *how the household moves within it and how every object behaves under the hand.* It describes **behaviour, not software** — the physical life of the room, not its UI implementation.
>
> **What this document is not.** It is **not** an implementation, and it **implements nothing**: no route, component, token, animation value, schema, migration, capability, string, or business logic changes because it exists, and no runtime code reads it. It **restates no rule**: the interaction *outcomes and their owners* stay `LARDER1`'s (drag-to-Shopping writes Domain 15; out-of-the-Larder is a Domain 30 soft-delete; the load-bearing rule; every gesture has a non-drag equivalent); the *motion vocabulary* — every duration, easing, and token — stays the UI Architecture's; the *feeling* stays the Experience Language's; the *materials and stillness* stay the Kept Room Translation's. This document sets **no motion value** and coins **no token**; it governs the *character and honesty* of interaction and cites every owner it stands on. On any question of **rule**, that owner prevails and this document is corrected.
>
> **The one sentence.** *In the Living Larder, a household never edits records — they handle their own provisions; nothing teleports, nothing pops into being, nothing behaves like a spreadsheet, everything has a home, and every change the household makes is a thing they did to a real object, not a row they altered in a table.*

---

## 1. The governing feeling

`LARDER1` fixed the North Star — *the Larder is a real household larder, not a list.* `LARDER2` built the room. This document governs the moment a hand reaches for a jar. Its whole content is the protection of one feeling:

> **The household is interacting with real objects in a real room — never with a database of their own cupboards.**

Everything below is that sentence made into law. When any future interaction is designed, it is measured against this feeling first: *does this feel like handling a provision, or like editing a record?* If it feels like the record, it is wrong, however correct its data (`CRAFT1` § 8 — *"Would I happily spend time here?"*; the Experience Constitution Check runs *before* design, `GEA` § 18.2, cited).

**The five founding principles** (the mission's design principles, adopted as this document's law):

1. **The household never feels they are editing records.** Every action is expressed as a thing done to an object — lifting, returning, taking out, putting back — never as *create / update / delete.*
2. **Nothing teleports.** State changes are continuous and legible. An object that leaves goes *somewhere;* an object that arrives comes *from* somewhere and lands in its place.
3. **Nothing suddenly appears.** New provisions arrive *into their home,* the way shopping is put away — never popping into a list from nowhere.
4. **Nothing behaves like a spreadsheet.** No rows, no cells, no columns, no bulk-edit, no sort-by-header, no inline field a value is typed into as data.
5. **Everything has a home.** Every object has one place it lives and one place it returns to; the room is known by memory, not by search (§ 8).

And the principle beneath all five, inherited from the canon: **technology disappears behind the experience** (Kept Room Translation § 5 — *"technology should quietly disappear; the household should always feel present"*; cited). The household should never see the machinery — no ids, no timestamps, no sync state, no save button, no record of the record.

---

## 2. Moving through the room — the natural journey

This is how a person passes through the Larder. It is written as behaviour: what the household *does* and what the room *does back.* Each moment names its owner where it touches a fact (`LARDER1`), and stays silent on UI mechanism.

**Entering the room.** The household arrives into a room that is *already there* — warm, lit by the one morning (`LARDER2` § I.2), its wings and shelves in the same places they were yesterday. Nothing loads *at* them; nothing rearranges *for* them. Arrival is recognition, not orientation: *"that is my larder"* (`LARDER1` § 1, cited). The room does not greet with a summary to read or a task to start; it simply opens, kept.

**Looking around.** The household takes the room in by *looking* — the wings, the fuller and lower jars, the stocked and sparse shelves — and reads availability at a glance (`LARDER2` § I.8). Looking is free and costs nothing: no hover-panels crowd in, no counts demand attention, no tour is offered. The room rewards a calm eye.

**Opening a cupboard.** A closed cupboard (the household store, the overflow) is opened to *reveal what is kept inside* — its contents were always there; opening simply shows them. A cupboard opens *toward* the household and its contents are disclosed, not conjured (Kept Room Translation § 4.1 *Space* — *"discloses progressively, never crowds"*; cited).

**Opening a drawer.** A drawer is *pulled toward you* and its contents are seen from above, all at once — the loose and the low (flour, potatoes, the odds and ends). It slides open and slides shut; nothing jumps.

**Opening the fridge / the freezer.** A cold door is *opened onto its compartments* — the door of bottles, the shelves, the fresh drawer; the freezer's stacked drawers. Opening is a reveal of what is cold, not a fetch of a list. Closing returns the door to rest.

**Lifting a jar.** A jar is *lifted from its place* to act on it — to look closer, to decide, to move it. Lifting is the gesture of *intent:* the household has taken hold of this object and is about to do something with it. While lifted, the jar is plainly *in hand* — the room shows it is held.

**Returning a jar.** A jar that is lifted and not moved *returns to exactly where it lived.* This is the most important small behaviour in the room: **an object always has one home, and an incomplete action returns it there** (§ 5, § 8). The household can pick a thing up and change their mind, and the room forgives it completely.

**Moving a bottle.** A bottle is *slid or carried from one place to another* — from the shelf toward the shopping basket, or out of the room. It moves along a path the eye can follow; it does not blink from A to B. Where it lands is where it now is.

**Taking something from a basket / putting it back.** From an open basket of produce, a thing is *taken by hand;* it can be *put back* the same way. Take and put-back are inverses, over one owner (`LARDER1` § 4, cited) — the household is never afraid to handle their own things, because everything can be set back down.

**Adding something to the shopping basket.** The household notices a jar is low and decides *"we need another one"* — and that decision is carried to the shopping basket while **the jar stays on the shelf** (§ 6; `LARDER1` § 8, the load-bearing rule, cited). Deciding to buy more is not removing what you have.

**Removing something from the household.** When a provision is no longer something the family keeps, it is *taken out of the room* — carried out, not deleted (§ 7; `LARDER1` § 4.2, cited). It leaves the way a thing leaves a house: deliberately, and reversibly, because it can be brought back in.

**Discovering something new.** New knowledge about a provision — a use, a pairing, a note — is *offered at the object,* like a card tucked beside a jar, and only when asked for. Discovery never rearranges the room and never speaks unbidden; interpretation is the Companion's, entered through its registered doorway, never authored by the room (`LARDER1` § 9; `GEA8`, cited).

**Searching without breaking the feeling of the room.** Search is how the household *finds a place for something not yet kept* and *puts it away into its home* (§ 9). Searching is the household walking to the right shelf — it names a provision, the provision resolves its identity against Canonical Food (Domain 2), and it *arrives into its wing.* Search never turns the room into a filtered result set, never flattens the shelves into a list, and never leaves the household staring at a query box where a room used to be (§ 10, rejection criteria).

---

## 3. The Object Constitution

Every physical object in the Larder has a constitution: **why it exists · how it is discovered · how it is interacted with · where it naturally returns · how it behaves when empty · how it behaves when full.** These are the room's nouns, and their behaviour is fixed here so that every future implementation gives the same jar the same life.

Two laws bind the whole table:

- **Every object has exactly one home** (§ 8). It is discovered *there,* returns *there,* and is never found somewhere it does not live.
- **Fullness is read, never counted** (`LARDER2` §§ I.7–I.8; `LARDER1` §§ 3, 16, cited). "Full" and "empty" below describe how an object *looks and behaves* at the ends of its range — never a number, never a measured level, never a percentage.

### 3.1 Containers of place — shelves, cupboards, drawers, baskets

**Shelf**
- *Why it exists.* The open, ordered stratum a household stores and finds things on (Kept Room Translation § 4.2 *Shelving*, cited) — the dominant surface of the room.
- *How discovered.* Always in view; a shelf is never hidden, because seeing the shelves *is* reading the larder.
- *How interacted with.* Objects are placed on it and taken from it; it is not itself moved, opened, or edited. It holds; it does not act.
- *Where it returns.* A shelf does not move — it *is* the return-place for the objects that live on it.
- *When empty.* **Composed emptiness, never bare emptiness** (Kept Room Translation § 4.3 *Quiet corners*; `LARDER2` § I.8, cited): warm air and light, an open invitation to keep something — never a cold blank or an accusing gap.
- *When full.* Ordered and legible *because it breathes, not because it is packed* (Kept Room Translation § 4.2 *Shelving*, cited) — never a crammed warehouse, never fake fullness.

**Cupboard**
- *Why it exists.* Enclosed keeping for what does not want to be on show (the household store, overflow).
- *How discovered.* A closed door in its known place; the household knows what is behind it before opening.
- *How interacted with.* Opened to reveal its contents, closed to rest. Opening *discloses;* it never fetches or generates.
- *Where it returns.* Closes back to exactly the same closed state; its contents keep their places inside.
- *When empty.* Opens onto quiet, kept space — honestly empty, never an error or a prompt to fill it.
- *When full.* Opens onto ordered contents that were always there; disclosure is calm, not a cascade.

**Drawer**
- *Why it exists.* For the low, heavy, and loose — seen from above, all at once (`LARDER2` § I.4).
- *How discovered.* A drawer front in its known place.
- *How interacted with.* Pulled toward the household to reveal, slid back to close. It slides; it never springs or jumps.
- *Where it returns.* Slides fully closed to its resting position.
- *When empty.* Slides open onto quiet space — a place waiting, not a fault.
- *When full.* Slides open onto its contents laid out to be seen together; nothing spills or reflows chaotically.

**Basket**
- *Why it exists.* The open holder of things that breathe — loose produce, seen whole (`LARDER2` §§ I.4, I.5-C1).
- *How discovered.* Always open and in view; a basket has no lid to hide behind.
- *How interacted with.* Things are taken from it by hand and put back the same way.
- *Where it returns.* The basket stays; what is taken from it either leaves the room (used, removed) or is put back into it.
- *When empty.* An empty basket is honestly empty — the household is out of that produce, or does not keep it — shown as a settled, waiting basket, never hidden and never shaming.
- *When full.* Generous and alive — colour and freshness, the most vivid image in the room (`LARDER2` § I.5-C1). Its fullness is the produce itself, **the household's own — never decorative fruit the room invented** (`LIVINGHOME2` § 5.1 / `ED3`; `LARDER2` § II.12, cited).

### 3.2 Objects of provision — jars, tins, bottles, packets, boxes

**Jar (and large jar)**
- *Why it exists.* The decanted, level-reading staple — the room's signature object (`LARDER2` §§ I.5-A2, I.7).
- *How discovered.* In its home on its shelf, at its known place, at its own honest level.
- *How interacted with.* Lifted to act on, returned if the action is abandoned, carried to the shopping basket (stays — § 6) or out of the room (removed — § 7).
- *Where it returns.* To the exact place it was lifted from; a jar never resettles somewhere new of its own accord.
- *When empty.* Down to its last — shown as a low jar *and* a plain, un-shaming cue (Kept Room Translation § 4.2 — *"freshness is helpful words, never guilt"*, cited). An empty jar is an invitation to add it to the shop, offered — never a warning.
- *When full.* A fuller jar, settled — *the household has this; nothing to do* (`LARDER2` § I.8).

**Tin**
- *Why it exists.* The stacked, presence-reading reserve (`LARDER2` §§ I.5-A3, I.7).
- *How discovered.* On the tinned shelf, in its stack.
- *How interacted with.* Read by presence — *do we have it in?* — lifted, carried to shopping, or taken out.
- *Where it returns.* To its stack on the tinned shelf.
- *When empty / out.* A gap in the stack where the tin lived — an honest space, fillable from the shop.
- *When full / stocked.* Present in its stack; the room shows *have,* never a count.

**Bottle**
- *Why it exists.* The standing, pour-by-eye liquid — oils, vinegars, drinks, sprays (`LARDER2` §§ I.5-A6/D2/E1, I.7).
- *How discovered.* Standing upright in its run, near where it is used.
- *How interacted with.* Slid or carried; read by level.
- *Where it returns.* Upright in its place in the run.
- *When empty.* Low to its last — a plain cue, an offer to replace.
- *When full.* Standing at a fuller level; nothing to do.

**Packet**
- *Why it exists.* The soft, flexible, back-of-shelf staple (`LARDER2` § I.7).
- *How discovered.* Behind the jars, on its shelf, read by presence.
- *How interacted with.* Taken, carried to shopping, or removed.
- *Where it returns.* To its place behind the jars.
- *When empty / out.* A gap on the shelf — honest, fillable.
- *When full / present.* On the shelf, unremarkable and kept.

**Box**
- *Why it exists.* The stackable dry or frozen good — cereals, crackers, tea, frozen produce (`LARDER2` § I.7).
- *How discovered.* Stacked in its place — the breakfast station, the hospitality store, the freezer.
- *How interacted with.* Read by presence; taken, carried, or removed.
- *Where it returns.* To its stack in its place.
- *When empty / out.* A gap in the stack.
- *When full / present.* Stacked and kept; presence, not tally.

### 3.3 The cold doors — fridge door, freezer drawer

**Fridge door**
- *Why it exists.* The threshold onto cold keeping (`LARDER2` § I.5-C2).
- *How discovered.* A closed cold door in its place — the most-opened door in the house.
- *How interacted with.* Opened onto compartments (door bottles, shelves, fresh drawer); provisions are taken and put back within; closed to rest.
- *Where it returns.* Closes back to its resting state; its contents keep their compartments.
- *When empty.* Opens onto quiet cold space — honestly empty, never an alarm.
- *When full.* Opens onto ordered compartments; the daily proof the family is fed (`LARDER2` § I.5-C2). No expiry, no countdown — *cold keeping, not a clock* (`LARDER1` § 3; Domain 30 owns no time, cited).

**Freezer drawer**
- *Why it exists.* The threshold onto long cold keeping — the deep reserve (`LARDER2` § I.5-C3).
- *How discovered.* A stacked cold drawer in its place.
- *How interacted with.* Pulled open onto its compartment; provisions taken and put back; slid closed.
- *Where it returns.* Slides fully closed to rest.
- *When empty.* Opens onto quiet space — a reserve waiting to be stocked.
- *When full.* Opens onto the stocked reserve — read by presence, never by a countdown.

---

## 4. Movement Principles — the physics of the room

Objects move as real household objects move: **calm, intentional, predictable, natural.** But movement in this room is disciplined by the canon, and the discipline is what keeps it a *home* and not a *toy.* This section reconciles the mission's movement language with three standing rules of the house — and the reconciliation is load-bearing:

- **The room is still by default** (Kept Room Translation § 4.2 *Shelving* — *"still; the one sanctioned per-item change is an item struck and settled into shade… data-borne and calm, never a celebration"*, cited). Movement is the *exception,* occasioned by the household's own hand; the room does not move on its own, does not animate to attract, and never celebrates.
- **The motion vocabulary is the UI Architecture's** (`THA_UI_ARCHITECTURE.md`, cited). This document sets **no** duration, easing, distance, or token. It governs the *character* of movement — that it is continuous, calm, and honest — and defers every *value* to the owner of the motion vocabulary.
- **The confirmation is the state change, never the animation** (`LARDER1` § 10, cited). Movement *shows* what happened; it is never the *mechanism* by which it happened. The change is true and legible with the motion stripped away.

Within that discipline, the physics:

**M1 — Continuity over teleportation.** An object that changes place travels a path the eye can follow, from where it was to where it now is. It never blinks out of one location and into another. *Nothing teleports* (mission principle 2).

**M2 — Arrival, not apparition.** A provision that enters the room comes *from* the household's act (a search, a put-back, a restore) and lands *in its home.* It never simply materialises in a list. *Nothing suddenly appears* (mission principle 3).

**M3 — Permanence of place.** An object at rest stays where it lives. The room does not resettle, reorder, or rearrange itself under the household (Kept Room Translation § 4.3 *Permanence* — *"no re-skin, no fashionable redesign"*, cited). Objects move only when the household moves them.

**M4 — Forgiving return.** An action begun and abandoned returns the object to exactly its home (§ 2, *returning a jar*). Lifting is not committing; the household can always set a thing back down.

**M5 — One legible outcome per act.** A single household act produces a single, understandable result. No cascade, no reflow of the whole room, no chain of consequences the household did not ask for.

**M6 — Calm, never celebratory.** Movement is quiet and matter-of-fact — the calm of putting shopping away, never confetti, bounce, reward, or fanfare. *Beautifully real, never gamified* (`CRAFT1` § 5; `GEA13`, cited).

**M7 — Movement is a courtesy, not a requirement.** The physical feeling is produced *for everyone,* and never depends on a pointer or a steady hand. Every outcome that a lift-and-carry achieves is equally reachable by keyboard, screen reader, switch, or a plain tap on the object's own actions (`LARDER1` § 10 — *"drag is an enhancement, never the only way"*, cited); the object is announced as the physical thing it is. When the household prefers less motion, the room honours it: the object still goes home, the state is still true, the animation simply quiets (`LARDER1` § 10, reduced-motion, cited). **A room that can only be operated by dragging has broken this constitution** (§ 10).

---

## 5. Shopping — "we need another one"

The lived experience of adding a provision to Shopping must feel like a household decision, never a data entry.

**The feeling.** A household member sees the olive oil is low, and thinks: *"we need another one."* They carry that decision to the shopping basket. That is the whole gesture — noticing, and deciding to restock.

**What must be true of the behaviour:**

- **The provision stays on the shelf.** Deciding to buy more does not remove what you have. The jar remains, at its low level, in its home — because *"we normally keep this"* and *"we need to buy this"* are two true things at once (`LARDER1` § 8, the load-bearing rule, cited). **The room remains truthful about what is still present** (mission requirement).
- **It reads as a decision, not an edit.** The household is not setting a `needed` flag or filling a quantity field; they are saying *get more of this.* No number is asked for, no form is opened (`LARDER1` §§ 6, 16 — *no quantity, no measure*, cited).
- **It lands in the shopping basket, which is Shopping's.** The decision is carried into Domain 15 through Shopping's own owner; the Larder holds no rival list and decides nothing about *when* to remind anyone (`LARDER1` § 8; the Notice Engine owns reminders, cited). The basket in the Larder is a composition of Shopping's state — a place to drop a decision, not a second list (`LARDER2` § II.11).
- **It is reversible as a decision.** Changing your mind about buying more is as easy as making the decision, and never disturbs the provision on the shelf.

---

## 6. Removal — taking something out of the house

The lived experience of no longer keeping a provision must feel like taking the object out of the house, never like deleting a record.

**The feeling.** *"We don't keep this any more."* The household carries the object out of the room. It leaves.

**What must be true of the behaviour:**

- **It is a departure, not a deletion.** The object is taken *out of the Larder* — an act with a direction and a destination (out) — never a row struck from a table (`LARDER1` § 4.2, cited). The household should never see the word *delete,* an id, or a confirmation dialog phrased as data loss.
- **It is distinct from being out of stock.** *"We don't keep this"* (removal) is a different act from *"we've run low"* (§ 5). Removal is deliberate and rare; running low is ordinary. The room never conflates them, and never lets *"buy more"* quietly remove a staple (`LARDER1` § 8, cited).
- **It is reversible — the object can be brought back in.** Removal is a soft departure (Domain 30's soft-delete, via `server/storage.ts`), and the inverse gesture *puts the object back into the room* (restore). The household is never punished for taking something out; the door swings both ways (`LARDER1` § 4.3, cited).
- **The room stays honest after it.** Once removed, the object is *gone from the room* — no ghost row, no lingering greyed record. Where it lived is now honest space (§ 3, empty behaviour), open to something else.

---

## 7. Room Memory — how the room becomes known

A well-kept larder is known by heart. The household should gradually know where everything belongs, and the room should **reward familiarity rather than searching.** This is the room's memory, and it has two halves — the room's own permanence, and the household's authored arrangement.

**RM1 — Everything has one home, and returns to it.** Every object lives in one place, is discovered there, and returns there after any incomplete or reversible act (§ 3, § 4). The household learns the room the way they learn their own kitchen: *the cumin is where the cumin lives.*

**RM2 — The room does not rearrange itself.** The Larder never reorders its shelves, reshuffles its wings, or moves an object the household did not move (Kept Room Translation § 4.3 *Permanence*, cited). A room that reorganises under the household can never be learned; a room that holds still can be known by heart. **The house holds still; the life moves** (`LIVINGHOME1` — the Living Home Principle; `LARDER2` § I.1, cited).

**RM3 — Familiarity beats search.** Because the room is stable and every object has a home, the household reaches for things by memory, not by querying. Search exists for the *unfamiliar* — the thing not yet kept (§ 9) — never as the primary way to find what is already home. A room that must be searched to be used has failed its memory (§ 10).

**RM4 — The household may author the arrangement, and the room remembers it.** Where the household places a provision is *theirs;* the room keeps that placement so it is there tomorrow. This is a lawful *use of an existing fact* — the owner already holds a per-item place and order (`user_pantry_items.category` and `sortOrder`, `LARDER2` § II.11) — not a new one. **Household-authored ordering is a declared-not-built future use of `sortOrder`** (§ 11): it introduces no new stored fact, and until it is built the room presents a stable arrangement rather than a shifting one. Either way, RM2 holds — only the household ever changes where a thing lives.

---

## 8. Search and discovery — finding without breaking the room

Search is the one moment most likely to collapse the room back into a list, so its behaviour is constituted tightly.

**S1 — Search is walking to the right shelf, then putting a thing away.** The household names a provision they want to keep; it resolves its identity against Canonical Food (Domain 2), and it *arrives into its home wing* (§ 2, *searching*; `LARDER1` § 6, cited). The end of a search is a provision *put away in its place,* not a result to click.

**S2 — Search never replaces the room with results.** While searching, the room does not dissolve into a flat, filtered list, does not hide the wings, and does not become a query box where a place used to be. Search is a way *into* the room, never a substitute *for* it (§ 10, rejection criteria).

**S3 — Adding is the only gesture that creates a provision.** Search-to-add is the single path that brings a new object into being; lifting, carrying, taking out and putting back only *move, remove, or restore* objects that already exist (`LARDER1` § 6, cited). There is one add-gesture, not several rival ones.

**S4 — Discovery is offered at the object, and only when asked.** Learning something about a provision — a use, a pairing, a piece of knowledge — appears *beside the object,* like a note tucked next to a jar, and only when the household reaches for it. It never interrupts, never rearranges the room, and is always the Companion's interpretation entered through its registered, permission-aware doorway — never the room authoring advice of its own (`LARDER1` § 9; `GEA8`/`GEA21`–`GEA23`, cited). *The room observes; the Companion understands; the household decides.*

---

## 9. The Constitution — the law every future interaction is judged against

This is the enforceable heart of the document: the principles below govern **every** future Larder interaction, and the rejection criteria are teeth, not guidance. An implementation that violates a rejection criterion is **rejected** — *"STOP, explain why, do not continue"* (the canon's compliance rule, cited).

### 9.1 The governing principles (`LIA1`–`LIA10`)

- **`LIA1` — Objects, not records.** Every interaction is expressed as an act on a physical object, never as create/update/delete on data.
- **`LIA2` — Nothing teleports.** State changes are continuous and legible; objects travel, they do not blink between states (§ 4, M1).
- **`LIA3` — Nothing appears from nowhere.** Provisions arrive from a household act, into their home (§ 4, M2).
- **`LIA4` — Everything has a home, and returns to it.** One place per object, discovered and returned there; the room is known by memory (§ 3, § 7).
- **`LIA5` — The room holds still.** It never rearranges, reorders, or moves an object the household did not move (§ 4 M3, § 7 RM2).
- **`LIA6` — Movement is calm, occasional, and never celebratory.** Still by default; motion is the household's, quiet, and matter-of-fact (§ 4).
- **`LIA7` — The confirmation is the state, not the animation.** Every outcome is true and legible with motion stripped away; motion is never the mechanism (§ 4, M7; `LARDER1` § 10).
- **`LIA8` — Buying is deciding, keeping is unchanged.** "We need another one" adds to Shopping and leaves the provision present (§ 5; `LARDER1` § 8).
- **`LIA9` — Removal is a departure, reversible.** "We don't keep this" takes the object out of the house and can be undone (§ 6).
- **`LIA10` — Technology disappears.** No ids, timestamps, sync state, save buttons, quantities, or record-of-the-record ever surface; the household only ever sees their provisions (§ 1; `LARDER1` §§ 3, 16).

Each principle inherits, and never overrides, its owner: interaction *outcomes and owners* are `LARDER1`'s; *motion values* are the UI Architecture's; *feeling* is the Experience Language's; *materials and stillness* are the Kept Room Translation's; *no-scoring/agency* are `GEA13`/`GEA23`'s.

### 9.2 Rejection criteria — a future implementation is rejected if it:

- **Feels like CRUD.** Presents create/read/update/delete as the shape of interaction, or names actions as data operations. *(Violates `LIA1`.)*
- **Exposes database concepts.** Surfaces ids, foreign keys, timestamps, `isDeleted`, `category` codes, sync/save state, or any record-of-the-record. *(Violates `LIA10`.)*
- **Exposes inventory management.** Turns the room into stock-keeping — quantities, units, counts, reorder levels, min/max, or an audit to reconcile. *(Violates `LIA10`; `LARDER1` § 16.)*
- **Relies on modal editing.** Interposes a dialog/form the household must open, fill, and submit to change a provision — the record-editor pattern the room exists to abolish. *(Violates `LIA1`.)*
- **Relies on card grids.** Presents provisions as a uniform grid of cards, tiles, or rows to be scanned and clicked, rather than objects living in a room. *(Violates `LIA1`, `LIA4`.)*
- **Breaks the illusion of a real room.** Teleports objects, pops things into being, rearranges the room under the household, animates for reward, dissolves the room into a search result, or requires a drag no keyboard or tap can equal. *(Violates `LIA2`–`LIA7`.)*

If any criterion is met: **STOP, explain why, do not continue** until the interaction is redesigned to pass.

---

## 10. Ownership, compliance, and relationship to the canon

**The Two-Layer Law is inherited unchanged** (`LARDER2` § II.10, cited). Every interaction here is a *presentation behaviour* over facts owned elsewhere: it *reads* Domain 30 (staples, place, availability) and Domain 2 (identity), and *writes* only through their existing owners — Domain 30's soft-delete/restore (`server/storage.ts`) and Domain 15's add. **This document mints no new owner of any fact and creates no new write path** (`LARDER1` §§ 2, 13, cited).

**Position in the canon.** Subordinate to `LARDER1` and, through it, to the Experience canon. `LARDER1` owns the interaction *outcomes and owners;* `LARDER2` owns the *interior design;* this document owns the *interaction behaviour and feel.* It restates none of their rules and adds no gate to the pipeline. Where any conflict appears, **`LARDER1` prevails and this document is corrected.**

**Experience Constitution Check** (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 18.2, cited):
- **Hospitality (§ 3.1):** ✅ The household handles their own provisions in a room that receives them — never an audit to reconcile.
- **Outcome (§ 3.5):** ✅ *Less to carry* — decisions feel like real acts, not data maintenance; the machinery disappears.
- **Weight (`GEA2`):** ✅ A more capable interaction is a *lighter* one — the record-editor gives way to handling an object.
- **Voice (`GEA8`/`GEA9`):** ✅ The room reports and lets the household act; interpretation stays the Companion's, offered at the object, only when asked.
- **Ownership (`GEA21`/`GEA22`):** ✅ The room observes and responds to the household's hand; the Companion understands across time.
- **Agency (`GEA23`):** ✅ The household decides and acts; every change is theirs, and every change is reversible.
- **Restraint (`GEA11`/`GEA13`/`GEA15`):** ✅ Still by default; no score, reward, or celebration; no number where a glance suffices; motion is a courtesy, never a demand.
- **Layer (`GEA20`):** ✅ Sits at the Experience-Architecture altitude, names the Constitution above it and `LARDER1`/`LARDER2` beside it, cites the motion, feeling, and fact owners, and originates no implementation law.

**Feeling and craft.** The interactions must produce the seven feelings (Experience Language § 3) and the emotional palette (§ 3A) — *calm, warm, effortless, reassuring* — and never *clinical, sterile,* or *funeral-parlour calm* (§ 3A.1, cited); *calm must never become lifeless* (§ 3A.4). Usability is held to **Nintendo-level** — effortless, immediately understandable, confidence without explanation (`CRAFT1` § 3–§ 4, cited) — and the room is finished only when the Home Owner can answer *"Would I happily spend time here?"* with yes (`CRAFT1` § 8; `HOMEOWNER1`, cited).

**Data Impact.** Reads Domain 30 and Domain 2; **writes no new runtime data** and creates no table, column, migration, capability, or write path. Changes no existing data meaning. Requires no backfill. (`LARDER1` § 13, inherited.)

---

## 11. Scope Lock

**This document is a behavioural constitution, not an implementation.** It fixes how the room is inhabited and how every future interaction is judged; it builds nothing.

**In scope (declared, not built):** the governing feeling and its five founding principles; the natural journey through the room; the Object Constitution (per-object behaviour); the Movement Principles; the lived experience of shopping and of removal; Room Memory; search-and-discovery behaviour; and the enforceable Constitution (`LIA1`–`LIA10` and the rejection criteria).

**Out of scope / deliberately deferred:**
- Any UI implementation, component, token, **animation value**, route, or string — the room is inhabited *as built,* surface by surface, each pass verified against this document, `LARDER1`, and `LARDER2`, and passing the full Experience & UI gates. This document sets no motion value; those remain the UI Architecture's.
- **Household-authored arrangement** (RM4) — a lawful *future use of the existing `sortOrder` field,* declared here and **not built;** it introduces no new stored fact. Until built, the room presents a stable arrangement.
- Any new stored fact — quantity, measure, freshness, expiry, or a second categorisation. Introducing one is a governed act outside this scope (`LARDER1` § 15; `LARDER2` § II.15, inherited).
- Renaming internal identifiers (route `/pantry`, the `pantry` capability id, the `user_pantry_items` table) — the naming divergence `LARDER1` § 15 surfaced remains a separate decision, unchanged here.

**Discovered item requiring a separate decision** (reported, not resolved): the committed reconstruction (`5faa05f4` and prior; `docs/implementation/LARDER_NORTH_STAR_RECONSTRUCTION.md`) presents inventory sections inside per-shelf drawers. Whether that presentation, and any card-grid or modal remnants within it, fully satisfy the rejection criteria of § 9.2 is an **implementation** judgement under `CRAFT1` § 7 (architecture-first: this constitution is authority; the existing code is reference material) — carried to the implementation phase, not made here.

---

*This is governance. It creates no route, capability, entity, token, component, string, animation value, schema, migration, or business logic, and no runtime code reads it. It governs how a household handles their own provisions in a room built over unchanged owners, and mints not one new owner of any fact. Every interaction outcome stays `LARDER1`'s; every motion value stays the UI Architecture's; every feeling stays the Experience Language's; every material stays the Kept Room Translation's. The household handles real objects in a real room — never records in a table — and the room holds still so it can be known by heart.*
