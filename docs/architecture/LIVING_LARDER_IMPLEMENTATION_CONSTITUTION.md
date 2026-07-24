# THA Living Larder Implementation Constitution

**Document ID:** `LARDER4`
**Date:** 2026-07-22
**Status:** GOVERNING — the engineering constitution for building the Larder · governance only, nothing built or changed
**Rollback identifier:** `rollback/living-larder-implementation-constitution-20260722` → `0d547f62` (annotated tag object `1905d98d`)
**Author of record:** Colin Clapson (Home Owner) · drafted by Claude under the Engineering Workflow
**Classification:** Implementation Governance — the implementation-engineering face of the Larder room. Subordinate to `LARDER1` (and through it to the Experience canon), and to `CRAFT1` (the general craftsmanship standard and design method); a non-overriding sibling of `LARDER2` and `LARDER3`.
**Governing documents:** [`LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md`](./LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md) (`LARDER1`, the room's North Star — prevails in any conflict) · [`LIVING_LARDER_INTERIOR_ARCHITECTURE.md`](./LIVING_LARDER_INTERIOR_ARCHITECTURE.md) (`LARDER2`, the room's interior architecture) · [`LIVING_LARDER_INTERACTION_CONSTITUTION.md`](./LIVING_LARDER_INTERACTION_CONSTITUTION.md) (`LARDER3`, the room's interaction behaviour) · [`THA_CRAFTSMANSHIP_CONSTITUTION.md`](./THA_CRAFTSMANSHIP_CONSTITUTION.md) (`CRAFT1`, the general craftsmanship standard and architecture-first design method — cited, never restated) · [`GOVERNING_EXPERIENCE_ARCHITECTURE.md`](./GOVERNING_EXPERIENCE_ARCHITECTURE.md) · [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md) · [`UI_CANONICAL_EXPERIENCE_OWNERSHIP.md`](./UI_CANONICAL_EXPERIENCE_OWNERSHIP.md) · [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](./THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md) · [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md)

---

> **What this document is.** The **engineering constitution of the Larder** — the governing statement of *how an engineer translates the Larder architecture into software without drifting away from it.* It completes the Larder canon on the fourth face: **`LARDER1`** owns *what the room is, what interactions exist, and which owner each writes to*; **`LARDER2`** owns *the room's interior design — its furniture, wings, and product forms*; **`LARDER3`** owns *how the household inhabits it and how every object behaves*; **this document (`LARDER4`)** owns *the order and discipline of building all three into running software, and the bar an implementation must clear before it is done.* It governs **implementation principles, not user experience** — the manner of the making, never the thing made.
>
> **What this document is not.** It is **not** an implementation, and it **implements nothing**: no route, component, token, animation value, schema, migration, capability, string, or business logic changes because it exists, and no runtime code reads it. It **restates no rule.** The *general* craftsmanship standard and architecture-first design method are `CRAFT1`'s and are **cited, never re-owned** — this document is that method's Larder-specific application, not a rival to it. The room's *destination and owners* stay `LARDER1`'s; its *interior design* stays `LARDER2`'s; its *interaction behaviour and feeling* stay `LARDER3`'s; each *fact* stays with its Domain owner (30, 15, 2, 11); each *visual and motion value* stays the UI Architecture's. On any question of **rule**, that owner prevails and this document is corrected.
>
> **The one instruction.** *The implementation must faithfully realise the architecture — it must never reinterpret it. Where an implementation constraint conflicts with the architecture: STOP, report the constraint, and do not silently approximate the design.*

---

## 1. Purpose and position in the canon

### Why this document exists

`LARDER1`, `LARDER2` and `LARDER3` describe a room completely — what it is, how it is built, and how it is lived in. What they do not, and must not, describe is the **software engineering discipline** that turns three governing documents into a running room without losing them along the way. That discipline is the one thing standing between a faithful Larder and a plausible-looking approximation of it, and until now it was left for each implementation pass to invent for itself.

This document owns that discipline. It exists for a single, well-evidenced failure mode: **an implementation that satisfies the letter of the architecture while quietly abandoning its substance** — a room that renders the right data through the wrong structure, a "larder" that is a list wearing a larder's vocabulary, a set of "objects" that are generic cards with new labels. The canon has already named the general shape of this defect in its own words — *"THA's experience defects are not defects of knowledge. They are defects of adoption"* (`PX1`, cited via `GOVERNING_EXPERIENCE_ARCHITECTURE.md`). `LARDER4` is the Larder-specific instrument against it: the ordered, layered method of building the room, and the engineering criteria that reject a build which has drifted.

### Its altitude, and why it is not new experience architecture

`CRAFT1` § 9 declared architectural design work complete and made **implementation the priority**, admitting new architecture **only** where a genuine architectural conflict is discovered. This document introduces **no** such conflict and **no** new experience rule. It sits at the **Implementation layer** of the three-layer model (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 2.1: Constitution → Architecture → Implementation), at the *engineering-discipline* altitude of that layer — the same altitude `CRAFT1` occupies for the *whole house*, narrowed to *one room's build.* It originates no law that flows upward (**GEA20**, cited); it is the operationalisation of the descent `CRAFT1` § 9 calls for — *"the architecture exists; build it"* — applied to the Larder. Writing it is building, not re-architecting.

### What this document owns — exactly, and nothing else

It owns **three** things and no fourth:

1. **The implementation philosophy and principles** — that the build must *faithfully realise* rather than reinterpret the architecture, the STOP-on-conflict discipline, and the layered build order (architecture before implementation · furniture before products · room before interactions · objects before behaviours · behaviours before polish) — § 2, § 3.
2. **The recommended implementation passes** — the order in which the room is assembled so that each pass produces a usable improvement and the whole experience is never attempted in one leap — § 8.
3. **The engineering rejection criteria and the Definition of Done** — the build-side structures that betray the architecture and must be refused, and the bar an implementation clears before it is finished — § 9, § 10.

It owns **nothing else.** Every value it touches belongs to an existing owner and is **cited, never copied:**

| Concern | Canonical owner (cited, never re-owned here) |
|---|---|
| The general craftsmanship standard; the architecture-first design method; the Quality Standard ("would I happily spend time here?") | `THA_CRAFTSMANSHIP_CONSTITUTION.md` (`CRAFT1`) |
| What the room *is*; the interaction outcomes and which owner each writes to; the accessibility floor | `LARDER1` |
| The room's furniture, wings, product forms, availability-by-looking language, growth model; the Two-Layer Law and zone→owner map | `LARDER2` |
| How the household inhabits the room; the Object Constitution; the Movement Principles; the interaction rejection criteria (`LIA1`–`LIA10`, § 9.2) | `LARDER3` |
| Which owner every rendered fact renders from; UI renders published state | `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (`UIOWN1`) |
| Every colour, token, type size, spacing, and motion value | `THA_UI_ARCHITECTURE.md` |
| One owner per fact; retire on introduction; no parallel stores | `ARCHITECTURE_PRINCIPLES.md` |
| Each business fact (staples · shopping · food identity · season) | Domains 30 · 15 · 2 · 11, per the Source of Truth Register |

**Restate-no-rule (the `CRAFT1` § 1 discipline, cited).** Every statement of an already-owned value here is a **citation**. Any sentence later found to duplicate an owned rule, design, behaviour, or value is a defect in *this* document and is corrected to a citation. `LARDER4` adds no second source of Larder governance; it assembles the existing Larder canon into one method of building and one bar of doneness, and owns only those.

---

## 2. Implementation philosophy

**The implementation must faithfully realise the architecture. It must not reinterpret it.**

The architecture (`LARDER1`/`LARDER2`/`LARDER3`) is settled and complete. An implementation's job is not to have opinions about the room — it is to *build the room the architecture already decided.* The engineer's creativity is spent entirely on *realising* the design faithfully and beautifully (`CRAFT1` § 3–§ 6, cited), never on re-deciding what the room should be. Where an implementation "improves" on the architecture, it has in fact forked it, and a forked room is no longer the Larder.

This is the direct, room-level application of `CRAFT1` § 7.3 — **the architecture owns the design; the existing implementation does not.** Existing Larder code (the committed reconstruction, `docs/implementation/pantry/LARDER_NORTH_STAR_RECONSTRUCTION.md` and its successors) is **reference material, never design authority** (`CRAFT1` § 7.1/§ 7.3, cited): it records what is currently built; it does not decide what should be. Each pass rebuilds toward the architecture and grades the existing code against it — never the reverse.

### The STOP rule — the load-bearing discipline

If an implementation constraint conflicts with the architecture — a platform limit, a technical impossibility, a cost, a deadline, a library that will not do what the design requires:

> **STOP. Report the constraint. Do not silently approximate the design.**

A silent approximation is the most dangerous outcome this document exists to prevent, precisely because it is invisible: the room still renders, the demo still works, and the substance is gone. The correct response to a genuine constraint is never to quietly build a lesser room and present it as the Larder — it is to **surface the conflict to the owner** and let the owner of the rule in question decide (the Architecture Bootstrap's STOP discipline; `CRAFT1` § 9; `HOMEOWNER1`'s *authority through the documents, never around them*, all cited). An honest "this cannot be built as specified, here is why" is worth infinitely more than a dishonest room that looks right.

This is not a licence to stop at the first difficulty. It is the requirement that the *design is never degraded without a decision.* Difficulty is met with craft; genuine conflict is met with STOP.

---

## 3. Implementation principles

The room is assembled **in layers, from the architecture outward.** These principles fix the order and the discipline of that assembly. They are the Larder-specific reading of `CRAFT1` § 7's architecture-first method (cited) — that method says *design from the architecture as though no code existed*; these principles say, for this room, *and build it in this order, one honest layer at a time.*

- **`LI1` — Architecture before implementation.** No line of the room is written before its governing architecture is read and its Experience Constitution Check answered (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 18.2, *before design begins*; `CRAFT1` § 7.2, cited). The build starts from `LARDER1`/`LARDER2`/`LARDER3`, not from the current page.
- **`LI2` — Furniture before products.** The room's permanent structure — its shelving, cupboards, drawers, baskets, working surface, cold doors, reserved bays (`LARDER2` § I.4, cited) — is built **before** any pantry item is bound to it. The furniture exists first and holds still; the provisions arrive into a room that was already there to receive them (`LARDER2` § I.1, the mission's own instruction, cited).
- **`LI3` — Room before interactions.** The room must exist and feel complete as a *place* before a single interaction is wired to it. A room that only makes sense once you can act on it was never a room; it was a control panel (`LARDER1` § 1; `LARDER2` § I.2, cited).
- **`LI4` — Objects before behaviours.** Each physical object (jar, tin, bottle, basket, drawer, cold door) is built as a real object that presents itself honestly (`LARDER3` § 3, the Object Constitution, cited) **before** its behaviours (lift, carry, take out, put back) are attached. Behaviour is given to objects that already exist; it is never the thing that conjures them.
- **`LI5` — Behaviours before polish.** The interactions are made correct, owned, and reversible (`LARDER1` § 4/§ 8; `LARDER3` § 5–§ 7, cited) **before** motion, timing, and refinement are applied. Polish makes a true room beautiful; it can never make a wrong room right, and applied first it only hides the wrongness (`LARDER3` § 4, *the confirmation is the state, not the animation*, cited).

**The room is assembled in layers, and never in a single pass.** No implementation may attempt to build the entire experience at once. A single-pass build collapses the layered order above into an undifferentiated whole, which is exactly how the substance is lost — furniture, products, objects, behaviours and polish decided together become impossible to grade separately, and the first thing to slip is always the least visible (the room-ness itself). Each layer is built, verified against its owning architecture, and only then built upon (§ 8).

---

## 4. Room implementation

**The room itself must exist before any pantry data is displayed.**

The physical room is built first: the **shelves, cupboards, drawers, fridge, freezer, working surfaces, and storage furniture** of `LARDER2` § I.4 (cited). This furniture is the room's permanent architecture, and it is implemented as the room's permanent structure — present whether the shelves are full or bare. The wings of `LARDER2` § I.3/§ I.5 (the Dry Store, the Daily Rhythm, the Cool Store, Hospitality, the Working House, the Seasonal & Growing Room) are laid out as the room's fixed bones before any provision populates them.

**The room must still feel complete when empty.** This is the acceptance test for the room layer, taken directly from `LARDER2` § I.8 (cited): a Larder with nothing in it is **composed emptiness, never bare emptiness** — warm air and light, an open invitation, never a cold blank or an error state. An implementation whose empty room looks broken, unfinished, or accusing has built an inventory screen that happens to be empty, not a room that is ready. The empty room is a *designed state* and it is built as one, first — because if the room only works once it is full of data, the products are holding the room up, and the architecture requires the exact opposite (`LARDER2` § I.1; § 6 below).

Only after the room stands does data populate it.

---

## 5. Object implementation

**Every physical object is its own implementation unit.**

The room's objects — **shelves, cupboards, drawers, jars, tins, bottles, baskets, packets, boxes** and the cold doors (`LARDER3` § 3, cited) — are each built as a distinct thing with its own presentation and its own behaviour. A jar knows how to be a jar: how it is discovered in its home, how it reads its level, how it behaves lifted and returned, how it looks when full and when down to its last (`LARDER3` § 3.2, cited). A basket knows how to be a basket. A drawer knows how to be a drawer.

Two engineering rules bind object implementation:

- **`LO1` — Objects own their own presentation and behaviour.** An object's appearance and its interactions belong to the object, sourced from its constitution in `LARDER3` § 3 (cited), not imposed by a generic container that treats every provision identically. This is what makes the room *readable*: the form is information (`LARDER2` § I.7, cited), and information is lost the moment every object is drawn the same way.
- **`LO2` — Objects are never simulated by generic cards.** A jar is not a card labelled "jar"; a tin is not a list row with a tin icon; a basket is not a tile grid of produce thumbnails. The moment an object is a generic card with a swapped label, the room has become a card catalogue wearing a larder's vocabulary — the precise defect `LARDER3` § 9.2 rejects (*"relies on card grids"*, cited). Objects are built as objects, or the room is not the Larder.

Building each object as its own unit is also what makes the room *maintainable for a decade* (`LARDER2` § I.9, cited): a new object earns its place by being built to the same constitution, landing in a reserved bay, without the room being rebuilt around it.

---

## 6. Data binding

The rule of data binding is one direction, and the direction is the whole discipline:

> **Products populate the room. The room is never generated from products.**

This is the engineering form of `LARDER2` § II.10's **Two-Layer Law** (cited), and it is the single most important structural decision in the whole build:

- **The furniture owns presentation.** Layer 1 — the wings, shelving, objects, and availability-by-looking language — is a *presentation* that exists independently and **owns no fact** (`LARDER2` § II.10, cited). It is built first (§ 4) and is real whether or not any product is bound to it.
- **Canonical data owns content.** Layer 2 — every actual jar, tin, and basket — is **read from its owner and written only to its owner:** household staples and their place and availability from **Domain 30**; food identity from **Domain 2**; what needs buying to **Domain 15**; the season from **Domain 11** (`LARDER2` § II.10–II.11; `LARDER1` § 2, cited). The room *reads* these owners to know what to place on its furniture; it never *becomes* them.
- **One source of truth. No duplicate ownership. No duplicate state.** The room mints no second staples store, no rival shopping list, no local food registry, and no shadow copy of any owner's state (`ARCHITECTURE_PRINCIPLES.md` Principle 2 — one owner per fact; Principle 8 — no parallel stores; `LARDER1` § 2, cited). Availability is read from `defaultHave` and the household's own need-to-buy flag — **never** a quantity, and never a number the room invents and then has to keep (`LARDER1` §§ 3, 16; `LARDER2` § II.11, cited). Arrangement is presented from the owner's existing `sortOrder`; it invents no new stored fact (`LARDER2` § II.11; `LARDER3` RM4, cited).

A build that generates the room *from* the product list — deriving structure, sections, or object types by iterating the data rather than placing the data into a room that already exists — has inverted this law. It will produce a room that collapses to nothing when the data is empty (failing § 4), that reshapes itself as the data changes (violating `LARDER3` RM2/`LIA5`, cited), and that is, structurally, a list. **The furniture is built first and holds still; the products are read from their owners and placed into it.** That order is not a preference — it is the difference between a room and a list.

---

## 7. Interaction implementation

**Interactions belong to physical objects — never to a data layer exposed to the household.**

Every interaction is built as an act on an object (`LARDER3` § 9.1, `LIA1` — *objects, not records*, cited), resolving to an existing operation on an existing owner (`LARDER1` § 4 — a Domain 15 create, or a Domain 30 soft-delete / restore, cited). The engineering discipline of the interaction layer:

- **`LX1` — Do not implement CRUD workflows.** The room is not built as create/read/update/delete over `user_pantry_items`. "Add" is *putting a provision away into its home* (`LARDER3` S1/S3, cited); "remove" is *taking an object out of the house*, reversibly (`LARDER3` § 6, cited); "need more" is *a decision carried to the shopping basket that leaves the provision on the shelf* (`LARDER3` § 5; `LARDER1` § 8, the load-bearing rule, cited). These write the same owners a CRUD form would — but they are never *built or presented* as CRUD.
- **`LX2` — Do not expose implementation or database concepts.** No id, foreign key, timestamp, `isDeleted`, `category` code, sync state, save button, or record-of-the-record ever reaches the household (`LARDER3` § 9.1 `LIA10`; § 9.2, cited). The household sees provisions in a room; the machinery disappears entirely (Kept Room Translation § 5, cited via `LARDER3` § 1). No modal record-editor stands between the household and their provision (`LARDER3` § 9.2, *relies on modal editing*, cited).
- **`LX3` — Interaction emerges from the object.** The way to act on a jar is to handle the jar (`LARDER3` § 2, cited); the way to act on a basket is to reach into it. The interaction is a property of the object, built into the object (§ 5), not a toolbar of operations bolted beside a data grid. Every outcome has a non-drag, keyboard- and screen-reader-operable equivalent, announced as the physical thing it is (`LARDER1` § 10; `LARDER3` M7/`LIA7`, cited) — the interaction is built for everyone, never only for a precise pointer.

The interaction layer is built **after** the room and its objects stand (§ 3, `LI3`/`LI4`), and its correctness — right outcome, right owner, reversible — is established **before** any motion is applied (`LI5`).

---

## 8. Implementation passes

The room is assembled in the following recommended order. **Each pass must produce a usable improvement** — a room that is more itself than before the pass, never a half-built scaffold that only makes sense once a later pass lands. This is the layered assembly of § 3 made concrete, and it is the guard against the single-pass build that loses the room's substance.

| Pass | What it builds | The usable improvement it delivers | Verified against |
|---|---|---|---|
| **Pass 1 — Room structure** | The room as a place: the wings and their layout, the light and materials, the empty-but-complete room. | A warm, recognisable, *empty* Larder a household would know as theirs — before any data. | `LARDER2` § I.2–I.5; § 4 above |
| **Pass 2 — Furniture** | The permanent storage furniture: shelving, cupboards, drawers, baskets, working surface, cold doors, reserved bays. | A fully furnished room, still empty, that feels complete and ready to receive provisions. | `LARDER2` § I.4; `LI2` |
| **Pass 3 — Storage surfaces** | The reading surfaces of the furniture: shelves that hold, drawers that pull open, baskets that show their whole contents, cold doors that open onto compartments. | A room whose surfaces behave as real storage — openable, legible — still ahead of the data. | `LARDER2` § I.4–I.5; `LARDER3` § 3.1/§ 3.3 |
| **Pass 4 — Product population** | Binding Domain 30 / Domain 2 data into the furniture as real objects (jars, tins, bottles, baskets, packets, boxes), reading availability by looking. | The household's *own* provisions, placed where they live, availability read at a glance — the room becomes theirs. | `LARDER2` § I.7–I.8, § II.10–II.11; § 5, § 6 above |
| **Pass 5 — Object interactions** | The interactions on the objects: lift and return, take out and put back, "need another one" to the basket, search-to-add — each writing its existing owner. | A room the household can *handle* — every provision actionable, every change owned and reversible. | `LARDER1` § 4–§ 8; `LARDER3` § 2, § 5–§ 8; § 7 above |
| **Pass 6 — Motion and refinement** | The physics of the room: continuous movement, forgiving return, calm never-celebratory motion, reduced-motion honoured; and the final craft of spacing, type, and light. | A room that moves like a real household object moves, and is finished to the Craftsmanship Standard. | `LARDER3` § 4 (`M1`–`M7`); `CRAFT1` § 3–§ 6; UI Architecture motion law |

The passes are a **recommended order, not a rigid pipeline** — but their *dependencies* are law: furniture cannot precede the room, products cannot precede the furniture, interactions cannot precede the objects, and polish cannot precede correctness (§ 3). An implementation may combine or subdivide passes as the work warrants, provided each shipped increment is a usable improvement and no layer is built before the layer it stands on.

---

## 9. Engineering rejection criteria

The behavioural and experiential rejection criteria are `LARDER3` § 9.2's (cited) — *feels like CRUD · exposes database concepts · exposes inventory management · relies on modal editing · relies on card grids · breaks the illusion of a real room.* This section names their **engineering-structural companions**: the build-side structures that *produce* those rejected behaviours. It is not a rival list; it is the same failures seen from inside the code, so an engineer can catch them before they ever reach the household.

**An implementation is rejected if it:**

- **Replaces furniture with cards.** Renders the room as a card/tile/list component rather than building the furniture of `LARDER2` § I.4 as the room's permanent structure. *(Produces `LARDER3` § 9.2 "relies on card grids"; violates `LI2`, `LO2`.)*
- **Replaces the room with a list.** Builds a scrollable list/table/grid of items as the primary surface, so the "room" is a presentational skin over a list control. *(Violates § 4, § 6; `LARDER3` `LIA1`/`LIA4`.)*
- **Replaces objects with icons.** Draws each provision as a generic icon-plus-label rather than the object it is, discarding the form-as-information the room reads by (`LARDER2` § I.7). *(Violates `LO1`, `LO2`.)*
- **Relies on modal editing.** Interposes a dialog/form the household opens, fills, and submits to change a provision — the record-editor pattern the room exists to abolish. *(Produces `LARDER3` § 9.2 "relies on modal editing"; violates `LX1`.)*
- **Flattens the room into CRUD.** Structures the code as create/update/delete operations over `user_pantry_items` surfaced to the household, rather than acts on objects that write existing owners. *(Produces `LARDER3` § 9.2 "feels like CRUD"; violates `LX1`, `LX2`.)*
- **Duplicates state.** Holds a local copy, cache, or shadow store of any owner's facts as a second source of truth, or a rival shopping/staples/food store. *(Violates `ARCHITECTURE_PRINCIPLES.md` Principle 2/Principle 8; § 6.)*
- **Invents new ownership.** Mints a new stored fact — a quantity, a freshness/expiry date, a second categorisation, a room-owned "to buy" list — without the governed act at the fact's owner (`LARDER1` § 15; `LARDER2` § II.15). *(Violates § 6; the Two-Layer Law.)*
- **Breaks governing architecture.** Contradicts any rule of `LARDER1`, `LARDER2`, `LARDER3`, `CRAFT1`, or the Experience canon above them. *(Violates the whole basis of this document.)*

**If any of these occur: STOP. Redesign.** The build is corrected to pass before it continues — an implementation that meets a rejection criterion is not shipped and iterated; it is *rejected* and rebuilt from the architecture (§ 2; `CRAFT1` § 7, cited). A room that flattens, duplicates, or re-owns is not a lesser Larder — it is a different room.

---

## 10. Definition of Done

The Larder implementation is complete only when **all** of the following hold. This is the engineering bar; it sits beneath — and never in place of — `CRAFT1` § 8's Quality Standard (*"Would I happily spend time here?"*, the Home Owner's final question) and the Experience & UI Governance gates (`ENGINEERING_WORKFLOW.md`, cited), all of which also bind.

- [ ] **The room exists independently of pantry contents.** The empty Larder is warm, complete, and correct on its own (§ 4; `LARDER2` § I.8). Emptying the data does not break the room.
- [ ] **Every object feels physical.** Each jar, tin, bottle, basket, drawer, and cold door is built as its own object with its own honest presentation and behaviour, never a generic card (§ 5; `LARDER3` § 3).
- [ ] **The architecture is faithfully represented.** What is built is the room `LARDER1`/`LARDER2`/`LARDER3` describe — not an approximation, a reinterpretation, or a plausible-looking substitute (§ 2).
- [ ] **The implementation follows the governing documents.** Every fact renders from its owner (`UIOWN1`); the Two-Layer Law holds (§ 6); every interaction writes only an existing owner (§ 7); no rejection criterion is met (§ 9).
- [ ] **No implementation shortcut undermines the Living Larder experience.** No silent approximation stands in for the design (§ 2); no CRUD, modal, card grid, duplicated state, or invented ownership has crept in under deadline (§ 9). Where a constraint forced a compromise, it was surfaced and decided, never hidden (§ 2, the STOP rule).

A build that ticks every box here still faces the Home Owner's *"would I happily spend time here?"* (`CRAFT1` § 8, cited) — this Definition of Done confirms the room was built *right*; that question confirms it was built *worth living in.* Both must be satisfied.

---

## 11. Compliance

*(Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` STEP 2 — answered for the governance this document declares. It creates no code; the checklist confirms the discipline contradicts no rule.)*

- **Principle 2 — one owner per fact.** ✅ This document owns only the Larder's implementation discipline (the build order, the rejection criteria, the Definition of Done) — a fact no document previously owned in one place. Every other value is a citation (§ 1 table). It mints no owner of any business fact; the data-binding law it states (§ 6) *enforces* Principle 2 rather than competing with it.
- **Principle 8 — retire on introduction / no parallel stores.** ✅ It creates no store and mandates none; § 6 and § 9 forbid the implementation from creating parallel stores or duplicate state.
- **`CRAFT1` relationship.** ✅ Subordinate to `CRAFT1` and originating no rival to it: `CRAFT1` owns the *general* craftsmanship standard and architecture-first method for the whole house; this document is that method's *Larder-specific application* (§ 1, § 2), citing it throughout and restating none of it. It adds no gate to `ENGINEERING_WORKFLOW.md`.
- **Experience Constitution Check** (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 18.2, cited):
  - **Hospitality (§ 3.1):** ✅ The build order exists so the *room receives the household* — the empty room is warm and complete before any data (§ 4), never an audit shell.
  - **Outcome (§ 3.5):** ✅ *Less to carry* — a faithfully built Larder is read by looking; the discipline exists to keep it from degrading into a list the household must maintain.
  - **Weight (`GEA2`):** ✅ Zero visible weight — a governing document; and the layered method it mandates keeps the room *lighter*, never heavier, as it is built (`LI3`, § 4).
  - **Voice (`GEA8`/`GEA9`):** ✅ No room or Companion voice is added or moved; § 7 keeps interpretation the Companion's, entered through its registered doorway.
  - **Ownership (`GEA21`/`GEA22`):** ✅ Nothing here decides for the household; § 6/§ 7 keep the room observing and the household acting.
  - **Agency (`GEA23`):** ✅ Every interaction the discipline governs is the household's and reversible (§ 7); the room grades nobody (`GEA13`, cited).
  - **Restraint (`GEA11`/`GEA13`/`GEA15`):** ✅ "Delete before adding" and "beauty through restraint" (`CRAFT1` § 6, cited) order every pass; § 9 rejects the additive defects (cards, grids, modals) that betray restraint.
  - **Layer (`GEA20`):** ✅ It sits at the Implementation-layer engineering-discipline altitude, names `CRAFT1` and `LARDER1`/`LARDER2`/`LARDER3` above and beside it, cites its fact- and value-owners, and originates no law that flows upward.

**No check fails. No governing rule is contradicted.**

## 12. AI Architecture Compliance

*(AI ARCHITECTURE COMPLIANCE block, `ENGINEERING_WORKFLOW.md`.)*

- **No new AI capability.** ✅ None defined, registered, or consumed; any Larder intelligence routes through the existing, permission-aware `pantry` capability (`LARDER1` § 9, cited).
- **Companion ownership unchanged.** ✅ Reasoning, voice, grounding (INT17), selection (INT20), and conversation state stay with their owners; § 7 keeps discovery the Companion's, offered at the object and only when asked.
- **Reuses existing business services · creates no second assistant · duplicates no conversation state.** ✅ The discipline *requires* reads and writes through Domain 30/15/2's existing owners (§ 6, § 7) and forbids duplicate state (§ 9).
- **Honest gaps over fabricated knowledge.** ✅ § 2's STOP rule and § 6's no-invented-fact discipline are the honest-absence principle applied to the build: where the room cannot know something, it says nothing rather than inventing it (Core Principle 6, cited).

**If any check fails: STOP. Explain why. Do not continue.**

## 13. Data Impact

**This document establishes governance only.**

- **Reads / writes no runtime data.** It creates no table, column, row, migration, capability, route, or write path. It *constrains* how a future implementation reads Domain 30/2/11 and writes Domain 30/15 — always through their existing owners — and mandates that the implementation create none of its own (§ 6).
- **Changes no existing data meaning.** `category`, `defaultHave`, `sortOrder`, `isDeleted`, `needQuantityValue`, `needUnit` keep exactly their owner's meaning (`LARDER1` § 13; `LARDER2` § II.14, inherited).
- **Requires no backfill.** No column is added and no meaning migrated.

**Trust Check** (the One Question, `THA_BRAND_CONSTITUTION.md`, cited). *Less to carry?* ✅ The discipline exists to keep the built Larder a room read by looking, never a list to maintain. *Could they trust everything it tells them?* ✅ Its central rule — STOP and report rather than silently approximate (§ 2) — is *trust is the product* applied to the act of building: the room the household is given is the room that was designed, or the difference is surfaced and decided, never hidden.

---

## 14. Scope Lock

**This document is an implementation constitution, not an implementation.** It fixes how the room is built and how a build is judged done; it builds nothing. **Do not begin implementation on the strength of this document alone** — it is the engineering reference an implementation is measured against, not authorisation to start one.

**In scope (declared, not built):** the implementation philosophy and the STOP-on-conflict rule; the layered build principles (`LI1`–`LI5`); the furniture-first room implementation and the empty-room-complete test; per-object implementation (`LO1`–`LO2`); the data-binding law (§ 6); the interaction-implementation discipline (`LX1`–`LX3`); the recommended implementation passes (§ 8); the engineering rejection criteria (§ 9); and the Definition of Done (§ 10).

**Out of scope / deliberately deferred:**
- Any UI implementation, component, token, animation value, route, string, or asset — this document governs *how* the room is built; it builds no part of it.
- The general craftsmanship standard, the Quality Standard, and the architecture-first design method — those are `CRAFT1`'s, cited and applied here, never re-owned.
- The room's design itself — its destination and owners (`LARDER1`), interior (`LARDER2`), and behaviour (`LARDER3`) — restated nowhere here.
- Any new stored fact — quantity, measure, freshness, expiry, or a second categorisation — and any rename of internal identifiers (route `/pantry`, the `pantry` capability id, the `user_pantry_items` table). These remain the governed acts and the separate decision `LARDER1` § 15 surfaced, unchanged here.

**Position in the canon.** Subordinate to `LARDER1` (and through it the Experience canon) and to `CRAFT1` (the general standard and method); a non-overriding sibling of `LARDER2` and `LARDER3`. `LARDER1` owns the room's *destination and owners;* `LARDER2` its *interior design;* `LARDER3` its *interaction behaviour;* `CRAFT1` the *general standard and method;* **this document owns only the *implementation discipline* for realising all of them in software.** Where any conflict appears, **`LARDER1` prevails, then `CRAFT1`, and this document is corrected.**

**Discovered item requiring a separate decision** (reported, not resolved): the committed reconstruction (`docs/implementation/pantry/LARDER_NORTH_STAR_RECONSTRUCTION.md`, and the `LARDER` rebuild at `a788d212`) is an existing implementation of this room. Whether it satisfies this constitution — whether its furniture-first structure, its objects, its data binding, and its interactions clear § 9 and § 10 — is an **implementation** judgement to be made *when the room is next built or refined*, under `CRAFT1` § 7 (this constitution and the architecture are authority; the existing code is reference material). It is carried to that implementation phase, not made here.

---

*This is governance. It creates no route, capability, entity, token, component, string, animation value, schema, migration, or business logic, and no runtime code reads it. It builds no part of the Larder; it states how the Larder is built. Every rule of the room stays with its owner — the destination `LARDER1`'s, the interior `LARDER2`'s, the behaviour `LARDER3`'s, the craft and method `CRAFT1`'s, each fact its Domain's, each value the UI Architecture's. This document owns only the discipline of the making: build the architecture, faithfully and in order — the room before the products, the objects before their behaviours, the truth before the polish — and where the room cannot be built as designed, STOP and say so, rather than hand the household a lesser room and call it the Larder.*
