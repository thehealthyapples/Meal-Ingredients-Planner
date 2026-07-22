# THA Craftsmanship Constitution

**Document ID:** `CRAFT1`
**Date:** 2026-07-22
**Status:** GOVERNING — the final governing design constitution · the permanent implementation standard for every user experience · governance only, nothing built or changed
**Rollback identifier:** `rollback/CRAFT1-craftsmanship-constitution-20260722` → tag object `e645bbed`, points at committed `65e39ca9`
**Author of record:** Colin Clapson (Home Owner) · drafted by Claude under the Engineering Workflow
**Classification:** Experience Governance — the craftsmanship and design-method standard governing the Implementation layer (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 2.1). Subordinate to the Experience Constitution; a non-overriding sibling of the Experience Architecture owners.
**Governing parents (cited, never restated):** [`GOVERNING_EXPERIENCE_ARCHITECTURE.md`](./GOVERNING_EXPERIENCE_ARCHITECTURE.md) (the Experience Constitution, GEA1–GEA23) · [`HOME_OWNER_ARCHITECTURE.md`](./HOME_OWNER_ARCHITECTURE.md) (the single creative authority) · [`THA_BRAND_CONSTITUTION.md`](./THA_BRAND_CONSTITUTION.md) (enduring identity, the One Question)

> **What this document is.** The **final governing design constitution** — the one that defines **HOW** every future room of The Healthy Apples is designed and built to standard, so that a decade of implementation reaches one house. It does **not** replace existing architecture and it originates **no** rule any owner already holds: it governs **implementation quality and design method**, the one thing the canon described everywhere and owned in no single place. After this document is approved, **implementation becomes the priority** — the architectural design work is complete, and future work should normally be implementation, refinement, and verification only. It creates **no** route, capability, entity, token, component, string, schema, migration, or business logic, and **no runtime code reads it.**

---

## 0. Why this document exists, and why last

The Healthy Apples has, over its governing canon, said *what* it is (the Brand Constitution), *why* its experience is shaped as it is (the Experience Constitution), *how it must behave · look · feel* (the Experience Architecture, UI Architecture, Experience Language), *what the house is and what it is like to live there* (the Blueprint, the Orchard House Design Blueprint, the Living Book), *how each characteristic of the house becomes interface* (the Kept Room Translation), *who approves whether it is beautiful* (the Home Owner Architecture), and *what each room must become* (the room North Stars). Between the completed architecture and the finished product there remained one unowned question, the one every implementation pass silently answered for itself and no document held:

> **When we sit down to build a room, how do we do the work — and how good must it be before it is finished?**

That question has, until now, been answered by whatever code already existed. A room was "designed" by opening its current implementation and improving it — which quietly made the **existing implementation the design authority**, in a canon whose entire discipline is that authority flows *downward* from architecture to pixels and never the reverse (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` **GEA20**, cited). `PX1` recorded the consequence in the platform's own words — *"THA's experience defects are not defects of knowledge. They are defects of adoption"* (cited via `GOVERNING_EXPERIENCE_ARCHITECTURE.md`): the rules were right, and the built product was behind them, because the built product kept being derived from the built product.

This document closes that gap **as a standard and a method, not as a new rule.** It states the standard of craft every finished room must meet, and the design method every implementation must follow to reach it — and it fixes the direction the whole canon depends on: **the architecture owns the design; the existing implementation does not.**

It is written last on purpose. A craftsmanship standard written before the architecture was complete would have been a preference; written now, against a settled canon, it is the executable conclusion of everything the canon already decided. **This is the final governing design constitution before implementation.**

---

## 1. What this document owns — exactly, and nothing else

This is a governing document at the **craftsmanship-and-method altitude of the Implementation layer** (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 2.1, cited): it governs *how the descent from architecture to a built room is performed, and how good the result must be*. It owns **two** things and no third:

1. **The Craftsmanship Standard** — the single, permanent statement of the execution quality every finished user experience must meet: usability, craft, honesty, restraint, and the feeling of a place worth spending time in (§ 3–§ 6). This is not a new set of feelings or laws; it is the standard of *care* to which the existing feelings and laws must be built.
2. **The Design Method** — the mandatory order of work for designing and building any room: architecture first, room designed from it, existing code judged only afterwards (§ 7). This is not a new workflow that rivals `ENGINEERING_WORKFLOW.md`; it is the design-discipline the workflow's gates already assume and never stated as a method.

It owns **nothing else.** In particular it **creates no** feeling, colour, token, material, motion value, component, behaviour, or design rule of its own — every such thing belongs to an existing owner and is **cited, never copied**:

| Concern | Canonical owner (cited, never re-owned here) |
|---|---|
| Why the experience is shaped as it is; the twenty-three principles; the Experience Constitution Check | `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (`EXPGOV1`/`EXPGOV2`) |
| How the experience must **behave**; the UX Governance Checklist; the Premium Principles | `THA_EXPERIENCE_ARCHITECTURE.md` (`EXP1`/`EXP2`) |
| How it must **look**; colour, typography, spacing, motion law, tokens, visual trust | `THA_UI_ARCHITECTURE.md` (UIA) |
| How it must **feel**; the seven feelings, the emotional palette, the Experience Review Questions | `THA_EXPERIENCE_LANGUAGE.md` (`EXPLANG1`/`1A`/`1B`) |
| The place, the light, the materials, the Exposure Scale, the Experience Test | `THA_EXPERIENCE_BLUEPRINT.md` (`EXPBLUE1`/`EXPBLUE2`) |
| The house's design character; "timeless, not fashionable"; the Design Manifesto | `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` (`OHDB1`) |
| Each material characteristic → interface translation; the ordering laws | `THA_KEPT_ROOM_TRANSLATION.md` (`TRANSLATION1`) |
| **Final aesthetic approval** of every room; the Decision Framework; refusal on character | `HOME_OWNER_ARCHITECTURE.md` (`HOMEOWNER1`) |
| Which owner every rendered fact renders from; UI renders published state | `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` (`UIOWN1`) |
| Each room's destination and ownership boundaries | the room North Stars (e.g. `LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md`) |
| Enduring identity; the One Question; the ten Principles | `THA_BRAND_CONSTITUTION.md` |

**Restate-no-rule (the `LIVINGHOME2` / `LHDC1` discipline, cited).** Every statement of an already-owned value in this document is a **citation**. Any sentence later found to duplicate an owned feeling, colour, token, behaviour, or law is a defect in *this* document and is corrected to a citation. This constitution adds **no** second source of experience governance; it assembles the existing canon into one standard of craft and one method of work, and owns only those two.

**On any question of *rule*, the rule's owner prevails and this Constitution is corrected** (the two-axis position the Brand Constitution and the Experience Constitution both hold — `GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 2.3, cited). This document is a standard of *how well* and *in what order*; it never overrules a *what*.

---

## 2. The foundation: a home before it is software

**The Healthy Apples is a home before it is software.** This is not a metaphor to decorate the product; it is the founding fact the whole canon rests on (*"a warm, lived-in home where someone has already thought about dinner"* — `THA_EXPERIENCE_BLUEPRINT.md` § 1, cited; *"A beautiful home does not happen accidentally"* — `HOME_OWNER_ARCHITECTURE.md`, cited). Every consequence in this document follows from it:

- **Every room is designed as a place, not a page.** A page is arranged; a place is inhabited. A room is designed by asking how it should feel to *be in* — the Experience Test's three questions (*which room is this · how should someone feel here · what is the one thing this room helps them do* — `THA_EXPERIENCE_BLUEPRINT.md` § 15.3, cited) are asked before a single element is placed, and the answer to the middle one governs the room.
- **The product should feel like somewhere a household wants to spend time** — and, held against the canon's inverted engagement law, *wants to*, never *is made to* (**GEA3** — nothing may be designed to increase return frequency or session length, cited). A household spends time in this home because it is calm and welcoming, and leaves it lighter; it is never kept.
- **Technology should disappear behind the experience.** The household should always feel present; the technology never (`THA_EXPERIENCE_BLUEPRINT.md` § 1.5, the Technology Principle, cited). Intelligence is experienced as a better answer, never a visible mechanism (**GEA16**, cited). A room in which the household feels the software is a room not yet finished.

This is the lens through which the two things this document owns — the standard and the method — are read. Craft that does not make the home feel more like a home is not craft; a method that does not build a *place* has built a page.

---

## 3. The Craftsmanship Standard — world-class craft

**Every detail is intentional.** Nothing visible ships by accident, habit, default, or inheritance from what was there before (`HOME_OWNER_ARCHITECTURE.md` Principle 2 — *beauty is intentional; everything present is meant*, cited). The standard applies, without exception, to every facet of a room:

- **Spacing** — as the Kept Room Translation's ordering law demands, *space before decoration*; surplus space becomes air and view, never filled to look busy (**GEA11**, cited; `TRANSLATION1` § 5, cited).
- **Typography** — every size, weight, and measure a deliberate reading of UIA's type law, never a component default left unexamined (`THA_UI_ARCHITECTURE.md`, cited).
- **Motion** — what little moves, moves for a reason; stillness is the default and motion the earned exception (the stillness laws, Blueprint § 6.1; UIA motion law, cited). Motion never becomes the mechanism by which an action is confirmed.
- **Illustration** — one coherent hand, in the house's palette, warm and unhurried; it decorates meaning and never substitutes for content or fakes it (`THA_UI_ARCHITECTURE.md` § 10, cited).
- **Composition** — the arrangement of a room reads as composed emptiness, everything present meant, the household's own life the ornament (`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` interior philosophy, cited).
- **Lighting** — one sun, one morning, upper-left, in every room forever; light carries welcome, warmth, calm, clarity, optimism, and never drama or signal (`THA_EXPERIENCE_BLUEPRINT.md` § 7, **GEA10**, cited).
- **Materials** — the house's own: warm timber, stone, linen, ceramic, paper, air; natural, honest, matte, lived-with; a material is what it appears to be (`THA_EXPERIENCE_BLUEPRINT.md` § 8; `TRANSLATION1` § 4, cited).

The standard for each facet is the same: **the perceptible result of care taken on the household's behalf** (`THA_EXPERIENCE_ARCHITECTURE.md` § 17, the Premium definition, cited) — *if the household would not feel the care, it is decoration; if they would feel its absence, it is craft.* World-class craftsmanship is not ornament, density, motion, or expense (§ 17 there, cited); it is the visible evidence that someone cared for every detail of the home.

---

## 4. The Craftsmanship Standard — Nintendo-level usability

The standard of *use* is stated as its own thing, because a room can be beautifully made and still hard to live in. Every finished room must be:

- **Effortless** — the one thing the room helps the household do is reachable without thought; the room is calm before it is capable, and a new capability makes the room *lighter*, never heavier (calm before capability, `THA_EXPERIENCE_ARCHITECTURE.md`; **GEA2** — *a more capable THA is a quieter THA*, cited).
- **Immediately understandable** — a household knows what the room is and how to use it by *looking*, the way they know their own larder by looking (`LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md` § 1, cited as the pattern). Understanding is designed into the arrangement, not deferred to instruction.
- **Joyful** — joy is a positive principle of this house, not a rationed indulgence (**GEA** on joy, cited): a room may be quietly delightful, warm, and alive. *Calm must never become lifeless* (`THA_EXPERIENCE_LANGUAGE.md` § 3/§ 3A, cited) — the standard guards both edges, against noise and against the cold.
- **Confidence without explanation** — the household trusts what the room tells them and how to use it without a tour, a tooltip tutorial, or a manual. A room that needs explaining to be usable has failed this standard, not the household.

**Nintendo-level** names the bar precisely: a thing anyone can pick up and use well immediately, that feels good in the hand, that never makes the user feel small for not understanding it. It is usability held to the standard of *joy and confidence*, not merely of *function*. This standard is bounded, absolutely, by the canon's restraint and honesty laws — joy is never gamification (**GEA13** — THA never scores, ranks, streaks, or rewards a household; the test *does this measure the food, or grade the household?*, cited), and confidence is never manufactured (Core Principle 6 — *trust is the product*, cited).

---

## 5. Beautifully real

The house's register, stated as a permanent boundary on all craft:

- **Beautifully real. Never fantasy.** The home is a *modern home in an ancient orchard* (`THA_EXPERIENCE_BLUEPRINT.md` § 1.4, cited) — real light, real materials, real food in real light (UIA § 10, cited). It is never a themed world, a mascot, a stylised universe, or a picture of a home; it is a home. The spatial anti-patterns the Blueprint bans — the theme park, the costume, wallpaper, the second sun — bind every room (`THA_EXPERIENCE_BLUEPRINT.md`, cited).
- **Never gamified.** No score, rank, streak, reward, target, badge, or progress-bar-as-motivation ever grades a household or manufactures a reason to return (**GEA3**, **GEA13**, cited). Delight comes from care and warmth, never from a mechanic.
- **Never decorative for its own sake.** Every element earns its place by strengthening the experience; ornament that adds no felt warmth is removed (the with-and-without subtraction test — `LHDC1` § 18, cited; `HOME_OWNER_ARCHITECTURE.md` Principle 3 — *hospitality before decoration*, cited). Beauty in this house is *through restraint* (§ 6), not through addition.

"Beautifully real" is the register in one phrase: the home is warm, crafted, and alive **because it is true**, never because it is dressed up to seem so. The moment a room reaches for charm it cannot substantiate, it has left the house.

---

## 6. The design values that order every decision

Four values order every craft decision. They are not new principles — each is an existing law, collected here as the working priorities a person applies at the moment of a choice:

- **Delete before adding.** The first tool of craft is subtraction. Before an element, a control, a card, or a component is added, the room is first asked what can be *removed* — surplus space becomes air and view (**GEA11**, cited); removal is as legitimate an act of care as addition (`HOME_OWNER_ARCHITECTURE.md` Principle 2; `LIVINGHOME2` § 9.9, cited). A room improves far more often by losing something than by gaining something.
- **Components survive only if they strengthen the experience.** No component, pattern, hook, or token has tenure. Existing building blocks are kept only where they make the room better; where they do not, they are removed or replaced, and the removal is recorded in the Adoption Register (`THA_UI_ARCHITECTURE.md` § 17, cited). *Authored-but-unadopted must be impossible to hide* — a component that survives only because it already exists is exactly the defect `PX1` found (cited).
- **Hospitality before productivity.** Where receiving the household well and getting a task done efficiently conflict, hospitality wins (**GEA1** — hospitality wins over efficiency, cited; **presence over engagement**, cited). The room exists to receive a household, not to optimise a throughput.
- **Beauty through restraint.** The house is beautiful because it withholds, not because it displays (*premium through restraint* — `THA_EXPERIENCE_LANGUAGE.md` § 4A, cited; **GEA15** — silence is the default and speech the exception, cited). A room with three well-chosen things is warm; a room with thirty is a shop window (`LIVINGHOME2` ED7, cited).

These four are the craft in practice. When two of them appear to conflict in a specific decision, the ordering laws of the Kept Room Translation settle it (`TRANSLATION1` § 5, cited), and where a *rule* is genuinely at stake, its owner prevails (§ 1).

---

## 7. The Design Method — architecture-first, existing code last

This is the load-bearing method of the document, and the one behaviour it most exists to fix. It states the mandatory order of work for designing and building any room.

### 7.1 Every room is treated as though it has never existed

**When a room is designed, it is designed from the governing architecture — as if no implementation of it had ever been written.** The existing code is not the starting point, not the design, and not the authority. This is the direct application of **GEA20** (work flows downward only: Constitution → Architecture → Implementation; the Implementation layer originates no law) to the act of design itself: a room derived from its existing implementation is a room whose design flowed *upward* from the pixels, which is the one direction the canon forbids.

### 7.2 The mandatory order

For every room, in this order, without exception:

1. **Read the governing architecture.** The Experience Constitution and its Check (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 18.2, answered *before design begins*), the room's own North Star where one exists, the Blueprint's Experience Test, the UI and Experience-Language law, the Kept Room Translation, and `UIOWN1`'s statement of which owner every fact renders from.
2. **Design the room from that architecture.** Answer the Experience Test's three questions, decide what the room *is* and how it should feel to be in, and design the place — before opening the current implementation, so the design is not anchored to what happens to exist.
3. **Only afterwards, decide what existing code deserves to remain.** With the intended room designed, the existing implementation is consulted as **reference material** — a source of what is currently built, what works, and what can be reused — and each existing component, pattern, and string is kept **only if it strengthens the designed room** (§ 6). Anything that does not is removed or rebuilt. Reuse is an outcome of the design, never its constraint.

### 7.3 The principle stated plainly

> **The architecture owns the design. The existing implementation does not.**

**Existing implementation is reference material, never design authority.** It records what is; it does not decide what should be. A room is *rebuilt from architecture*, and the current code is graded against the rebuilt design — never the reverse. This does not license waste: reuse is expected wherever the existing code genuinely serves the designed room (Principle 8 — retire on introduction, and its inverse, keep what still serves; cited). It licenses *honesty* — the room that gets built is the room the architecture describes, not the room the last implementation happened to leave behind.

### 7.4 Why the order matters

An implementation that starts from existing code inherits every unexamined decision in it — the defaults nobody chose, the component that shipped because it was there, the "temporary" placeholder that stayed (`HOME_OWNER_ARCHITECTURE.md` Design Authority, cited: *a skipped state, a default style, a "temporary" placeholder that ships — each is an aesthetic decision made by omission, and omission is not approval*). Designing from architecture first is the only way the room that ships is the room that was decided, rather than the room that accumulated.

---

## 8. The Quality Standard — the one question that finishes a room

Every finished room is held to one final question, asked by the Home Owner after every gate has done its mechanical work:

> **"Would I happily spend time here?"**

**If the answer is no, the room is not finished.** This standard sits *above* the gates, exactly as the Home Owner's Decision Framework does (`HOME_OWNER_ARCHITECTURE.md`, cited): the gates verify that the rules were followed; this question asks what no checklist can — whether the result is a *place a household would want to be*. It is the working form of the canon's One Question (*"Does this leave the household with less to carry, and could they trust everything it tells them?"* — `THA_BRAND_CONSTITUTION.md`, cited) and of the Blueprint's Experience Test, applied to the finished room.

The standard is deliberately demanding and deliberately never satisfied by "good enough": **completion is a release milestone; refinement is continuous** (`HOME_OWNER_ARCHITECTURE.md` Principle 11, cited). A room can pass every checklist and still fail this question, and that failure is final — it is the Home Owner's refusal-on-character, which needs no further rule (`HOME_OWNER_ARCHITECTURE.md`, cited). A room that fails a *gate*, conversely, cannot be rescued by passing this question; that is the amendment path, not the approval path.

The question is the whole standard compressed: a home you would happily spend time in is calm, welcoming, effortless, honest, beautiful, and yours. If it is not yet that, there is more care to take.

---

## 9. The Completion Rule — the end of architectural design work

**This constitution marks the end of architectural design work.** The canon is complete: identity, behaviour, look, feel, place, character, translation, ownership, authority, and each room's destination are all owned. What remains is to *build the house the architecture describes, to the standard this document sets.*

**After this document is approved, implementation becomes the priority.** Future work should **normally consist only of**:

- **implementation** — building each room from its governing architecture, by the method of § 7, to the standard of § 3–§ 6;
- **refinement** — the continuous care that keeps a built room worth returning to (`HOME_OWNER_ARCHITECTURE.md` Principle 11, cited), never novelty for its own sake (Principle 9 — consistency over novelty, cited);
- **verification** — confirming, at every gate and against the Quality Standard, that what was built is the room the architecture describes.

**New architecture should only be introduced if a genuine architectural conflict is discovered** — a case the existing canon cannot resolve, or two owners in true contradiction. That is the standing discipline the canon already holds: a conflict is surfaced, the STOP is taken, and the *owner* of the rule in question decides (the Architecture Bootstrap's STOP discipline; **GEA20**; `HOMEOWNER1`'s *authority through the documents, never around them*, all cited). Absent such a conflict, the answer to *"should we write new architecture for this?"* is now, by default, **no** — the architecture exists; build it.

This is not a freeze on thinking. It is the deliberate shift of the project's centre of gravity from *deciding what the house is* to *building it beautifully* — the point every well-architected home reaches, where the plans are done and the craft begins.

---

## 10. Relationship with existing architecture

- **Experience Constitution (`EXPGOV1`/`EXPGOV2`)** — this document is subordinate to it and originates no principle. Where the Experience Constitution owns *why* the experience is shaped as it is (GEA1–GEA23) and its Check runs *before design begins*, this document owns *how well and in what order* the work is done, and its Quality Standard runs *at completion*. The two are the same discipline at the two ends of a room's making.
- **Home Owner Architecture (`HOMEOWNER1`)** — the closest sibling. `HOMEOWNER1` names *who* holds final aesthetic authority and *by what framework* they judge; this document states *the standard of craft and the method of work* that authority judges against. A room is done when its facts render from their owners (`UIOWN1`), its feeling passes the Home Owner (`HOMEOWNER1`), **and** its craft and design method meet this Constitution.
- **UI Canonical Experience Ownership (`UIOWN1`)** — the two share an axis-split with `HOMEOWNER1`'s: `UIOWN1` binds every element to the owner of its *fact*; `HOMEOWNER1` names authority over its *feeling*; this document sets the standard of its *craft* and the *method* of its making. None touches another's axis.
- **The room North Stars (e.g. `LARDER1`)** — each owns *what one room must become*; this document owns *how any room is designed and built to standard*. A North Star is the destination; this Constitution is the manner of the journey and the bar at the door. `LARDER1` § 17's observation — that a room is designed as *a place the household recognises, reading facts they already own, inventing no precision it lacks* — is the room-level instance of this document's method; this Constitution generalises it to every room.
- **The Living Home Design Constitution (`LHDC1`)** — the precedent for this document's shape: `LHDC1` is the object-level admission standard for one class of dressing object; this is the room-level craftsmanship standard for every user experience. Both own only a standard and a method, restate no rule, and route final approval to the Home Owner.
- **`ENGINEERING_WORKFLOW.md`** — this document adds no gate and no step; the existing gates (the Experience Constitution Check, the UX/UI Governance Checklists, the Experience Review Questions, the Blueprint Checks, the Design Character Check, the Adoption Register, the Product Registry) all bind exactly as their owners state. This Constitution is the *standard those gates serve* and the *method of design they assume*, stated once so it is no longer left to each implementation to reinvent.

---

## 11. Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity — one home, one orchard, one Companion untouched. One
  craftsmanship standard (this document), one design method, one Quality
  Standard, one approval authority (the Home Owner, HOMEOWNER1).
☑ One owner per fact — every feeling stays EXPLANG's; every colour/token/motion
  UIA's; every principle the Experience Constitution's; each room's destination
  its North Star's; final approval HOMEOWNER1's. This document owns only the
  craftsmanship standard and the design method (§ 1) — a pair of facts no
  document previously owned in one place.
☑ No duplicate ownership — § 1 lists exactly what is owned; every other value is
  a citation (§ 1 table). Any duplicate later found is a defect corrected to a
  citation (restate-no-rule, § 1).
☑ No duplicate business logic — none touched; the Does-Not-Own boundary is the
  § 1 table's canonical owners, unchanged.
☑ No duplicate state — no state, store, schema, or persistence created; a
  governing document only.
☑ Existing owners remain unchanged — not one rule, value, token, law, domain,
  engine, or gate moves. Authority is exercised through the owners' own paths.
☑ Extends existing architecture — the craftsmanship-and-method face of the
  Experience Constitution and the Home Owner Architecture, in the LHDC1/OHDB1
  mould (a design-language/standard face of a governing parent), inventing no
  rival governance and adding no gate.
☑ Governance only — defines a standard and a method; ships nothing.
☑ Honest gaps over fabricated information — the standard forbids manufactured
  confidence and decorative charm a room cannot substantiate (§ 4, § 5);
  Core Principle 6 (trust is the product) is cited, untouched.
☑ No permanent synchronisation bridge — none; no scheduler; nothing runs.
☑ Evolution over replacement — replaces no document; it is the standard the
  completed canon is now built to (§ 9).

Experience Constitution Check (GOVERNING_EXPERIENCE_ARCHITECTURE.md § 18.2,
answered for the governance this document declares):
  hospitality — the standard puts hospitality before productivity (§ 6) and
                holds every room to "would I happily spend time here?" (§ 8).
  outcome     — a house that can be built to one standard for a decade and stay
                one home; the household carries nothing new.
  weight      — zero visible: a governing document; no asset, code, or token; and
                the method it mandates makes rooms lighter, not heavier (§ 4).
  voice       — no room and no Companion gains a voice; rooms report, the
                Companion advises (GEA8/GEA9, cited); this document adds neither.
  ownership   — nothing decides for the household; authority is over the
                product's craft, never over a household (GEA23; HOMEOWNER1).
  agency      — the household decides; the Quality Standard is about the home,
                never a judgement of the family (GEA13, cited).
  restraint   — restraint is a design value the document elevates (delete before
                adding, beauty through restraint — § 6).
  layer       — it names the Experience Constitution above it and the Experience
                Architecture owners beside it, and originates no implementation
                law (GEA20); it governs the manner of the descent, not its rules.
```

## 12. AI Architecture Compliance

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ No new AI capability — none defined, registered, or consumed.
✓ Companion ownership unchanged — reasoning, voice, grounding (INT17),
  selection (INT20), and conversation state stay with their owners; this
  document reaches only the craftsmanship standard every surface is built to.
✓ Intelligence Platform unchanged — no spine component gains or loses an owner,
  input, or authority. Intelligence is still experienced as a better answer,
  never a visible mechanism (GEA16, cited).
✓ Capability Registry unchanged — no binding added, moved, or removed.
✓ Intent Engine unchanged — no intent, path, or bypass.
✓ No prompt, Context View, or byte the model reads is created or altered — this
  document says nothing to any model and adds no capability.

If any check fails: STOP. Explain why. Do not continue.
```

## 13. Impact

**This document establishes governance only.**

- **No runtime behaviour changes.** Nothing renders, routes, or resolves differently.
- **No schema changes.** No table, column, or migration.
- **No APIs.** No endpoint added, changed, or removed.
- **No implementation.** No code, token, asset, string, component, or store is touched.

The only observable change is governance: the standard of craft and the method of design that every implementation already needed now have a single, permanent, governing statement — and the project's centre of gravity moves, deliberately, from architecture to implementation.

---

*A house is drawn before it is built, and the drawings are done. What remains is the craft: the hand that plans the oak true, sets the light where it belongs, and leaves the room quiet enough to be lived in. This document does not draw another room — it names how every room is built from the drawings, and how good it must be before the household is welcomed in. The architecture owns the design; the craft owns the making; and the home is finished only when someone would happily spend time there.*
