# THA Larder Room North Star Architecture

**Document ID:** `LARDER1`
**Date:** 2026-07-22
**Status:** GOVERNING — North Star in force · governance only, nothing built or changed
**Rollback identifier:** `rollback/LARDER-north-star-20260722` → `539a3172`
**Author of record:** Colin Clapson (owner) · drafted by Claude under the Engineering Workflow
**Classification:** Experience Architecture — single-room North Star (subordinate to the Experience canon)
**Governing documents:** [`GOVERNING_EXPERIENCE_ARCHITECTURE.md`](./GOVERNING_EXPERIENCE_ARCHITECTURE.md) · [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md) · [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](./THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md) · [`UI_CANONICAL_EXPERIENCE_OWNERSHIP.md`](./UI_CANONICAL_EXPERIENCE_OWNERSHIP.md)

> **What this document is.** The approved North Star for one room — the room the household knows today as the **Pantry**, renamed the **Larder** — stating what it must become and, as firmly, what it must never own. It is an *experience North Star*: it fixes the destination and the ownership boundaries every future implementation of that room must respect. It **implements nothing** — no route, component, token, schema, migration, capability, string, or business logic changes because this document exists, and no runtime code reads it. It **restates no rule**: every canonical owner it touches is cited to its existing document and left byte-untouched.

---

## 1. Purpose and North Star

### The North Star

**The Larder is a real household larder, not a list.**

A household knows its own larder as a *place*: shelves with jars and large jars, tins stacked at the back, herbs by the hob, bottles of oil, a basket of onions, a drawer of odds and ends. You know what you keep and roughly how much is left by *looking* — not by reading a spreadsheet of your own cupboards. The room THA ships today asks the household to read an inventory of hollow checkboxes and per-row *"+ Need"* pills (`HOMEOWNER2_LIVING_HOME_REVIEW.md` § 4, cited as the point-in-time critique this North Star answers). The Larder replaces that reading with *seeing*.

> **The Healthy Apples' Larder behaves like the household's own larder: a physical place they recognise, where what they keep is arranged where it lives, and its approximate availability is read at a glance — never a quantity, never a form.**

### What the room is *for* (the Experience Test — `THA_EXPERIENCE_BLUEPRINT.md` § 15.3, cited)

- **Which room is this?** The Larder — the household's own store of staples, the pantry room within the one home.
- **How should someone feel here?** *"That is my larder."* Recognition, calm, ownership — the warmth of a well-kept store, not the load of an audit.
- **What is the one thing this room helps them do?** See what the household normally keeps, and keep that picture true — mark something as needing buying, take something out that is no longer a staple, put something back — without ever counting.

### Why now, and why a North Star rather than a build

The physical-room reading is a decision about *what the room is*, and it must be settled before it is built so that every future implementation pass builds the same room rather than re-deriving it. This is the standing `TIME3` / `LIVINGHOME1` precedent — **declare the destination first, so nothing rival grows while the room is built.** The document is the North Star; the room is built later, by others, surface by surface, each pass verified against this.

---

## 2. Canonical ownership and consumers

The Larder is a **rename and a re-presentation of an existing room. It creates no new owner of any fact.** The one distinction this document rests on: *the Larder changes how the household sees and touches their staples; it changes nothing about who owns them.*

| Fact | Canonical owner (unchanged, cited) | The Larder's relationship |
|---|---|---|
| **Household staples · what the house normally keeps · approximate availability** | **Domain 30 — Pantry State.** `user_pantry_items` (`shared/schema.ts`), household-grained; `server/storage.ts` the only writer (add / update / soft-delete). Transactional, household-authored — "owned by nobody else" (Register, cited). | **The Larder is Domain 30's room.** It reads and writes this owner through its existing service surface. It mints **no** second staples store (Principle 2 / Principle 8, cited). |
| **What needs purchasing** | **Domain 15 — Shopping State.** `shopping_list`, `shopping_list_extras`, `shopping_fulfilment_memory`. | **Shopping remains the sole owner of what needs buying.** The Larder can *originate* a shopping entry (§ 8) but never holds a rival "to buy" list. |
| **Ingredient identity and knowledge** | **Domain 2 — Canonical Food Identity.** `shared/canonical/foods.ts` → published `canonical_food` (verified equal — PUB1). | **Canonical Food remains the sole owner of what a food *is*.** Every jar, tin and herb in the Larder resolves its identity against Domain 2; the Larder invents no food, alias, or variety. |
| **Seasonality / approximate freshness knowledge** | Domain 11 (season) and the knowledge owners. | Consumed where already exposed (e.g. `GET /api/pantry/seasonal`, Domain 11 ∩ Domain 30); never re-owned. |
| **Companion enrichment of the room** | The registered `pantry` capability in `server/intelligence/capability-registry.ts` (permission-aware, ownership-scoped). | The Companion may enrich (§ 9) **only** through this registered, permission-aware capability, and owns **no** Larder or Shopping data. |

**Primary consumers of the Larder's own state** are unchanged from Domain 30's entry in `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` § 6 (cited): the Larder room itself, the seasonal pantry surface, Shopping, and future Life-register bindings. This document adds **no new consumer of the data** — the physical interface is a new *presentation* of an existing consumer, not a new owner or a new store.

### The rename, precisely

**"Larder" is a user-facing display-name change over the unchanged Domain 30 owner.** The room label the household reads becomes *Larder*; the domain, table (`user_pantry_items`), writer (`server/storage.ts`), and capability id (`pantry`) are **not** renamed by this document. This mirrors the display-name discipline of `GOV2_CANONICAL_ALIAS_PRINCIPLE.md` (cited by analogy — *one identity, one display name*; GOV2 governs canonical **entities**, not room labels, so it is cited as the pattern, not the owner): a new label for the same thing never forks the thing. The internal name already anticipates this — `user_pantry_items.category` defaults to `"larder"` today, and the current room already speaks of *"larder staples"* — so the label and the internal category term converge rather than diverge. Whether the route `/pantry`, the Register's Domain 30 name, and the `pantry` capability id should *also* be renamed is deliberately **out of scope here** and recorded as a separate decision (§ 15, Discovered items).

---

## 3. Physical layout model

The Larder presents Domain 30's staples as a **physical store**, not a list. The physical vocabulary — **shelves, jars, large jars, tins, herbs, bottles, baskets, drawers** — is a *reading* of data the owner already holds; it introduces no new stored fact.

- **Sections are the household's own storage places.** The physical grouping is a presentation of the existing `user_pantry_items.category` column (today: `larder`, `fridge`, and the room's other locations). A category becomes a *place in the room* (the larder shelves, the fridge, the drawer), not a tab in a segmented control. No new categorisation is owned; the room reads the column that exists.
- **Items sit where they physically live.** A staple's `sortOrder` and `category` place it on a shelf, in a jar, in a basket; the household recognises the arrangement because it is theirs.
- **Availability is approximate and read by looking.** *Have / running low / out* is expressed through the existing `defaultHave` boolean and the household's own sense — a fuller jar, a nearly-empty tin — **never a number.** The Larder introduces no quantity fact and reads none: `needQuantityValue` / `needUnit` exist on the owner today and the Larder neither surfaces them as measures nor adds to them (§ 12, non-goals).
- **The room owns no time.** Domain 30 "owns no time" — no expiry, best-before, purchase date or shelf life (Register, cited). The physical metaphor must not imply one: a jar looking low is *approximate availability*, not a countdown. Adding any freshness/ageing fact is a governed act under `ARCHITECTURE_PRINCIPLES.md` Rule 8 and is **not** part of this North Star.

The physical model is one room, one arrangement, on every device — the differences are only in *how it is touched* (§ 4, § 5), never in what it is.

---

## 4. Desktop interaction model

On a pointer device the Larder is **directly manipulable**: the household acts on an item *where it physically sits*, by dragging it.

From an item's physical position, the household can drag it:

1. **Onto the visible Shopping List → mark it as needing purchase.** Originates a Domain 15 entry through Shopping's owner (§ 8). **The item stays in the Larder** — dragging to Shopping never removes the staple (§ 8, the load-bearing rule).
2. **Out of the Larder → remove it as a household staple.** Retires the staple through Domain 30's existing soft-delete (`user_pantry_items.isDeleted`, via `server/storage.ts`). The household is saying *"we don't keep this any more,"* not *"we're out of it."*
3. **Back into the Larder → restore it as a staple.** Re-instates a previously removed staple through the same owner (un-delete / re-add). The two directions are the inverse of each other, over one owner.

Every drag resolves to an **existing operation on an existing owner** — a Domain 15 create, or a Domain 30 soft-delete / restore. Drag is a new *gesture*, not a new *capability*: it commissions no new write path and no new state. The gesture must be forgiving (clear drop targets, an obvious cancel, an undo consistent with the reversibility the operations already have) and never destructive without recovery — removing a staple is a soft-delete, and the household can put it back.

---

## 5. Mobile interaction model

Mobile shows **the same visual Larder** — the same physical store, the same sections, the same recognition. It is not a different room or a reduced list; it is the Larder, arranged for a touch device.

- **Vertically scrollable physical sections.** The physical places (larder shelves, fridge, drawers, baskets) stack as sections the household scrolls through — the same arrangement as desktop, laid out for a narrow, tall screen.
- **Tap and swipe replace drag.** The three desktop drag outcomes are reachable by touch-native gestures — a tap to open an item's actions, a swipe to mark *needs buying* (→ Shopping, § 8) or to take a staple *out*, with restore reachable the same way. The gestures differ; the **outcomes, owners, and rules are identical** to § 4. Nothing a household can do on desktop is unreachable on mobile, and vice versa.

Parity is a requirement, not an aspiration: the Larder is one room the household carries between devices, and its physical truth does not change with the pointer.

---

## 6. Search and addition behaviour

**Search remains available for adding new items**, unchanged in purpose from today's room.

- Search is how a household **adds a staple that is not yet in the Larder** — they name it, it resolves against **Canonical Food (Domain 2)** for identity, and a new `user_pantry_items` row is authored through `server/storage.ts`. The Larder adds **no** food identity of its own; an unmatched name is a canonical resolution question (one resolver, `GOV2` Rule 5, cited), never a silently minted entity.
- Search and addition are **the same single gesture across the room** — one add-item control, not the two divergent controls the current room shows (`HOMEOWNER2` § 4, note 4, cited). Adding is the only path that *creates* a staple; drag and swipe only *move, remove, or restore* staples that already exist.
- Addition introduces **no quantity or measure** — a staple is added as *something the household keeps*, with approximate availability, never *"how much."*

---

## 7. (reserved — see § 8)

*Shopping integration is § 8. This numbering keeps the required section order legible: layout (§ 3) · desktop (§ 4) · mobile (§ 5) · search & addition (§ 6) · shopping (§ 8) · accessibility (§ 10).*

---

## 8. Shopping integration

**Shopping remains the sole owner of what needs purchasing.** The Larder is a *source of intent*, never a rival list.

- **The visible Shopping List in the Larder is a composition, not an owner.** Where the Larder shows the Shopping List as a drop target, it renders Domain 15's *published state* under the composition rules of `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (cited): compose from the owner's state, **persist nothing, add no voice, never widen authority.** The Larder holds no shopping rows and no shopping count of its own.
- **Marking a Larder item as needed originates a Domain 15 entry** through Shopping's existing owner — the same fact the current *"+ Need"* pill produces, reached now by a physical gesture. The Notice Engine remains the sole owner of *when to remind* anyone of anything (Domain 15 "Does Not Own," cited); the Larder decides nothing about reminders.

### The load-bearing rule

> **Moving an item to Shopping must not remove its household-staple status.**

Adding a staple to the shopping list and *keeping* it as a staple are **two facts at two scopes** — *"we normally keep this"* (Domain 30) and *"we need to buy this"* (Domain 15) — which can legitimately both be true at once (Principle 2's scope test — *can these two stores legitimately disagree?* — yes, cited). A household that runs low on olive oil needs to buy it **and** still keeps it as a staple. The drag-to-Shopping gesture therefore writes **only** Domain 15 and leaves the Domain 30 staple untouched. Only the explicit *out of the Larder* gesture (§ 4.2 / § 5) retires a staple. Conflating the two — letting *"buy this"* silently delete the staple — is forbidden by this North Star.

---

## 9. Companion enrichment

**The Companion may enrich the Larder experience — it may never own Larder or Shopping data.**

- Any Companion presence in the Larder enters as a **registered, permission-aware capability** — the existing `pantry` capability in `server/intelligence/capability-registry.ts` (ownership-scoped, permission-filtered), never as a private read of the room's state. The Intelligence Platform "owns no business facts and no business logic … every fact it states is read from that fact's existing authoritative owner" (`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, cited); pantry, shopping and food facts "live with their TIP2 owners and are never copied into conversation state" (`UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` § 3, cited).
- Enrichment is **permission-aware and composed, never authored** — the Companion may speak only from what the requesting identity is entitled to see, filtered by `access.ts` *before* composition (`PKR2` Rules PKR26–PKR28, cited), and it composes over owners' state rather than duplicating it into a prompt, template, or fallback string (Rule PKR27, cited).
- **The rooms observe; the Companion understands; the household decides** (`GEA21`–`GEA23`, cited). The Larder *reports* what the household keeps and its approximate availability, and offers the controls to change it; it does not counsel. Interpretation ("you've been buying a lot of tinned tomatoes lately") is the Companion's, grounded in evidence, offered — never the room's, and never deciding on the household's behalf.

---

## 10. Accessibility and non-drag alternatives

**Drag is an enhancement, never the only way.** A physical, drag-first room must not become a room only a precise pointer can operate.

- **Every drag outcome has a non-drag equivalent.** Mark-as-needed, remove-as-staple, and restore are each reachable without dragging — through the item's own actions (a menu, a control, the touch gestures of § 5) — so a household using a keyboard, a screen reader, a switch device, or simply preferring not to drag can do everything the room offers.
- **Keyboard and screen-reader operable.** Items, sections, and drop targets are reachable and operable by keyboard, with roles and names that describe the *physical* arrangement truthfully (a shelf is announced as what it is), and actions announced as what they do (*"add to shopping list," "remove from larder"*) — never as a THA score or grade (`PRESENCE1` precedent, cited).
- **Honest, non-decorative motion.** Any drag animation respects reduced-motion preferences and never becomes the mechanism by which an action is confirmed; the confirmation is the state change, legible without the animation.
- **Availability read without colour alone.** *Have / running low / out* must be distinguishable without relying on colour or the fullness of an illustration alone — the approximate state carries a text or shape cue as well.

Accessibility here is not a later pass; it is part of what "the same visual Larder for everyone" means.

---

## 11. Architecture Compliance

*(Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` STEP 2 — this is a governance document; the checklist is answered for the architecture it declares.)*

- **Principle 2 — one owner per fact.** ✅ No fact gains a second owner. Staples stay Domain 30; what-needs-buying stays Domain 15; food identity stays Domain 2. The *keep* fact and the *buy* fact are distinct facts at distinct scopes (§ 8), which the scope test permits.
- **Principle 3 — single-owner state for transactional entities; do not bolt enrichment onto transactional state.** ✅ The Larder is transactional Domain 30; this North Star adds a *presentation*, not an enrichment pipeline, and no parallel store.
- **Principle 4 — one assembled model per entity.** ✅ The room reads staples from Domain 30's owner and food identity from Domain 2's assembled model; it re-resolves nothing locally.
- **Principle 7 — no permanent synchronisation bridge.** ✅ Drag-to-Shopping is a *funnel into* Domain 15's owner (permitted infrastructure), not a bridge keeping two staples stores in sync (there is one).
- **Principle 8 — retire on introduction / no parallel stores.** ✅ Nothing is introduced that supersedes an existing store; the Larder *is* Domain 30, renamed at the surface. The list-based presentation it replaces is a presentation, not a store, and carries no data to migrate.
- **Experience Constitution Check** (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 18.2, answered before design):
  - **Hospitality (§ 3.1):** ✅ The room receives the household by showing them their own larder, not an audit to complete.
  - **Outcome (§ 3.5):** ✅ *Less to carry* — the household reads availability at a glance instead of maintaining a list.
  - **Weight (GEA2):** ✅ A more capable room is a *lighter* one — the per-row pills and hollow checkboxes give way to a place read by looking.
  - **Voice (GEA8/GEA9):** ✅ The room reports and offers controls; coaching stays the Companion's.
  - **Ownership (§ 7.4, GEA21/GEA22):** ✅ The Larder observes (shows what is there); the Companion understands (notices across time).
  - **Agency (GEA23):** ✅ The household decides — every change is theirs; removing a staple is reversible, and nothing is decided for them.
  - **Restraint (GEA11/GEA13/GEA15):** ✅ No score, rank, streak or reward; surplus space becomes the room's air; no number where a glance suffices.
  - **Layer (GEA20):** ✅ This document sits at the Experience-Architecture altitude, names the Constitution above it, and cites the fact-owners beside it; it originates no implementation law.
- **Experience & UI Governance.** The full UX and UI Governance Checklists (`THA_EXPERIENCE_ARCHITECTURE.md` § 18 · `THA_UI_ARCHITECTURE.md` § 18) are the gates the *implementation* of this room must pass; this North Star defers no rule to avoid them and pre-empts none of their values.

**No check fails. No governing rule is contradicted.** One naming divergence is surfaced as a separate decision rather than resolved here (§ 15).

---

## 12. AI Architecture Compliance

*(AI ARCHITECTURE COMPLIANCE block, `ENGINEERING_WORKFLOW.md`.)*

- **Canonical Intelligence Platform · Capability Registry · Intent Engine.** ✅ Any Larder intelligence routes through the existing `pantry` capability and the platform's Intent Engine; no bespoke assistant, no private model read.
- **Reuses existing business services.** ✅ Reads and writes go through Domain 30's and Domain 15's existing owners.
- **Creates no second assistant · duplicates no conversation state.** ✅ No new conversational surface; business facts are never copied into conversation state.
- **Registered capabilities only, with permission-aware access.** ✅ Enrichment is permission-filtered by `access.ts` before composition (`PKR2` PKR26–PKR28, cited).
- **Honest gaps over fabricated knowledge.** ✅ Where the Larder cannot know something (exact quantity, freshness, expiry), it says nothing rather than inventing it — Domain 30 owns no time, and the room does not pretend otherwise (Core Principle 6, cited).

---

## 13. Data Impact

This architecture task declares the following, and **binds every implementation pass that follows it to the same envelope**:

- **Reads:** existing **household staple data** (Domain 30 — `user_pantry_items`) and existing **canonical food data** (Domain 2 — `canonical_food` and its projections). These are the only owners the Larder reads for its own room.
- **Writes:** **no new runtime data in this architecture task.** This document creates no table, column, row, migration, or write path. (When the room is *built*, its writes are the *existing* Domain 30 soft-delete/restore and the *existing* Domain 15 add — no new state is introduced by the North Star.)
- **Changes no existing data meaning.** `defaultHave`, `category`, `sortOrder`, `isDeleted` and every other Domain 30 field keep exactly the meaning their owner gives them; "Larder" is a display label over the same facts.
- **Requires no backfill at this stage.** No column is added, no meaning is migrated, and no historical row must be rewritten. The rename is a surface label; the data is untouched.

---

## 14. Trust Check

*(The One Question — `THA_BRAND_CONSTITUTION.md`, cited: "Does this leave the household with less to carry, and could they trust everything it tells them?")*

- **Less to carry?** ✅ The household reads their larder by looking, not by maintaining a list of checkboxes.
- **Could they trust everything it tells them?** ✅ The Larder states only what its owners know — what the household keeps, and its *approximate* availability. It shows **no exact quantity it does not have**, **no freshness or expiry it does not own**, and **no count it cannot substantiate.** Approximate availability is presented *as* approximate. This is the honest-absence discipline the canon already enforces (Domain 30 owns no time; Core Principle 6 — *trust is the product*), applied to a physical metaphor whose great risk is implying precision it lacks. The metaphor must never become a claim: a low-looking jar is a feeling, not a measurement.

---

## 15. Scope Lock

**This document is a North Star, not an implementation.** It fixes the destination and the ownership boundaries; it builds nothing.

**In scope (declared, not built):** the physical-room reading of the Larder; the rename of the *user-facing* room label Pantry → Larder; the desktop drag model; the mobile scroll/tap/swipe model; the search-to-add behaviour; the Shopping origination gesture and its load-bearing rule; the Companion enrichment boundary; the accessibility floor.

**Out of scope / deliberately deferred:**
- Any UI implementation, component, token, route, or string — the room is built later, surface by surface, each pass verified against this North Star and passing the full Experience & UI gates.
- Renaming internal identifiers (the route `/pantry`, Domain 30's Register name "Pantry State", the `pantry` capability id, the `user_pantry_items` table). This document renames **only the user-facing label**.
- Any new stored fact — quantity, measure, freshness, expiry, purchase date, shelf life. Introducing one is a governed Rule 8 act, out of this scope.
- Environmental Dressing of the Larder (produce, baskets-as-decoration) — `LIVINGHOME2` § "no produce dressing in the Pantry room" stands; the physical items here are the household's *own staples* (data-borne), never dressing.

**Discovered items requiring a separate decision** (reported, not resolved here):
1. **Naming divergence.** The user-facing label becomes *Larder* while the route `/pantry`, Domain 30's name, the `pantry` capability id, and the `user_pantry_items` table stay "pantry." This is lawful (display name vs internal identity) but leaves a divergence a future owner may wish to converge. Whether to rename the internal identifiers is a separate decision, owned by the Register and the capability owners, not by this North Star.

---

## 16. Explicit non-goals

The Larder is **not**, and this North Star must never be read to authorise:

- **A quantities or measures feature.** No exact amounts, units, or counts are introduced anywhere in the room. Approximate availability only.
- **A second owner of what needs purchasing.** Shopping (Domain 15) remains the sole owner; the Larder originates intent and owns no shopping list.
- **A second owner of food identity or knowledge.** Canonical Food (Domain 2) remains the sole owner; the Larder invents no food, alias, variety, or nutrition fact.
- **A freshness, expiry, or ageing tracker.** Domain 30 owns no time; the physical metaphor must not smuggle one in.
- **A Companion that owns room data.** The Companion enriches through a registered, permission-aware capability and copies no Larder or Shopping fact into conversation state.
- **A place that grades the household.** No score, rank, streak, target, or reward — the room shows the food, it never grades the family (GEA13, cited).
- **A gesture-only room.** Drag is an enhancement; every outcome is reachable without it.

---

## 17. A note beyond this room: the physical-room interface principle

The Larder is the **first** room to be given a physical-room interface, and the approach it establishes — *a room the household recognises as a real place, directly manipulable, reading facts the household already owns and never inventing precision it lacks* — **also informs the future design of Home, Cookbook and Planner.** A physical planning table, a living cookbook on a shelf, a home read as a place rather than a dashboard are the same instinct applied to other rooms.

This is recorded here as a **direction, not a definition.** This document **does not define, own, or govern** the Home, Cookbook, or Planner rooms; each remains owned by its own place in the canon (`HOME_OWNER_ARCHITECTURE.md`, the Blueprint's room map, and the respective capability owners). When any of those rooms adopts a physical-room interface, it will be declared in its own North Star, passing its own gates — this note only records that the Larder lit the path.

---

*This is governance. It creates no route, capability, entity, token, component, string, schema, migration, or business logic, and no runtime code reads it. It renames one user-facing label and re-presents one existing room over its unchanged owners. Every fact it touches stays with the owner the canon already gives it.*
