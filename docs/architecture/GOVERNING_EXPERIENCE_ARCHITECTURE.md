# THA Governing Experience Architecture

**Status:** Governing architecture. `EXPGOV1` (2026-07-20). **Amended by `EXPGOV2` (2026-07-20)** — § 7.4, which promotes *The Rooms Observe · The Companion Understands · The Household Decides* to a permanent constitutional principle (**GEA21–GEA23**).
**Scope:** The **Experience Constitution** of The Healthy Apples — the principles, intent, philosophy, ownership model and verification model by which every UX, UI, frontend and visual decision is made.
**Required reading before any user-facing implementation.** It is the *first* of the Experience Governance documents to be read, and the one that tells you which of the others binds you.
**Layer:** Constitution. It states principles and never mechanisms; the existing architecture documents remain the authoritative owners of their domains (§ 2.1, § 17.1).

---

## 1. Purpose of Experience Architecture

THA has, for some time, had a complete and unusually careful body of experience law. Four governing documents divide one experience cleanly — the Experience Architecture owns what it must **do**, the Experience Language owns how it must **feel**, the UI Architecture owns how it must **look**, and the Experience Blueprint owns the **vision and the place**. Two further documents give the house a design character (`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`) and translate it into interface (`THA_KEPT_ROOM_TRANSLATION.md`), and a seventh describes what it is like to live there (`THA_ORCHARD_LIVING_BOOK.md`).

Between them they say, in remarkable detail, **what the rules are**. What none of them says, in one place, is **why those are the rules** — the reasoning that runs from a household's actual condition to the conclusion that a home is the correct form for this product and an application is the wrong one; that a large screen should become quieter rather than fuller; that a logo is a detail of the architecture rather than an asset of a brand; that a household should close THA feeling better than when they opened it.

That gap is not academic. A rule whose reasoning is unrecorded survives exactly as long as the people who remember why it was made. The next person inherits a constraint with no argument attached, and a constraint with no argument is indistinguishable from an arbitrary preference — so it is negotiated away, politely, one reasonable exception at a time. This document exists so that in five years someone can read not only *that* THA holds its measure on a wide screen, but *why*, and can therefore tell the difference between a change that serves the household and a change that merely serves the screen.

**Experience Architecture is therefore the layer that holds the reasoning, the principles, and the map.** Its four jobs:

1. **State the principles** from which the existing rules follow — so that a decision the rules do not cover can still be made correctly.
2. **Own the questions no other document owns** — hospitality, presence, joy, silence, space as architecture, identity as detail, the household outcome, and **who owns which kind of statement** (§ 7.4).
3. **Hold the map** — one place that names every experience owner and every experience gate, so that "which document binds me here?" has an answer that takes seconds rather than an afternoon.

4. **Name the layers** — Constitution, Architecture, Implementation — and fix the direction work flows between them (§ 2.1), so that a statement written at the wrong altitude is a recognisable defect rather than a matter of taste.

It defines **principles, not components**. It sets no colour, token, size, duration, breakpoint or pixel; it names no component; it contains no CSS. Everything it touches that already has an owner, it **cites**.

### 1.1 What this document is not

It is not a redesign, a design system, a style guide, or a roadmap. It creates no route, no capability, no entity, no string, and no runtime dependency: **no code may read it, and no code may branch on it.** It is read by people, before they build.

It is also not a second copy of the law. THA's engineering constitution binds this document as it binds every other: **one owner per fact** (`ARCHITECTURE_PRINCIPLES.md` Principle 2). Where this document states a rule that another owns, that statement is the defect — it is corrected to a citation, not defended. § 2.4 makes that obligation explicit.

---

## 2. Position, precedence, and ownership boundary

### 2.1 The three layers of experience governance

THA's experience work divides into three layers. They answer different questions, they have different owners, and they change at different rates. Naming them is what makes "one owner per fact" enforceable at the presentation layer, because most duplication in experience work happens when a statement is made at the wrong altitude — a principle written into a component, a rule restated in a constitution, an implementation detail promoted to law.

| Layer | Question it answers | Owner | Changes |
|---|---|---|---|
| **Experience Constitution** | *Why does the experience exist, what philosophy governs it, and what should a household feel as a result?* | **This document** | Rarely. An amendment (§ 19). |
| **Experience Architecture** | *How are those principles realised — what must the experience do, feel like, look like, and where does everything sit in the house?* | The seven documents in § 17.1 | By governed amendment |
| **Experience Implementation** | *How is that architecture physically built in the product?* | The codebase, the Adoption Register, and the implementation reports under `docs/implementation/ux/` | Continuously |

**Work flows downward, and only downward:**

```
        EXPERIENCE CONSTITUTION          why · philosophy · principles · outcome
                    ↓                    (this document)
        EXPERIENCE ARCHITECTURE          behaviour · feeling · look · place
                    ↓                    (Experience Architecture, Experience Language,
                    ↓                     UI Architecture, Experience Blueprint,
                    ↓                     Design Blueprint, Kept Room Translation)
        EXPERIENCE IMPLEMENTATION        components · tokens · routes · pixels
                                         (the product)
```

**What each layer may and may not do:**

- **The Constitution states principles and never mechanisms.** It contains no colour, token, size, duration, breakpoint, component or pixel, and names no file. If a statement here could be violated by a CSS change alone, it is written at the wrong altitude and belongs one layer down.
- **The Architecture states rules and never reasoning it does not own.** It is the authoritative owner of its domain — behaviour, feeling, look, place, character, translation — and this document never overrides it (§ 2.3). Where it needs to explain *why*, it cites the Constitution rather than re-arguing it.
- **The Implementation states nothing.** It is where the architecture is realised, and it may not originate law. A pattern that appears first in a component and is later described as a principle has inverted the flow, and the description is a rationalisation rather than a rule.

**Upward flow is the defect this model exists to prevent.** Its two forms:

*Implementation becoming architecture by habit* — a component ships, is copied, becomes ubiquitous, and is thereafter defended as though it were governed. THA has already recorded this failure precisely: `PX1` found that *"THA's experience defects are not defects of knowledge. They are defects of adoption"* — a platform that authors foundations, never adopts them, and never retires what they were meant to replace (`docs/implementation/ux/PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md`). The remedy is not more law. It is that every architectural owner has a live consumer and every predecessor is retired (**GEA18**).

*Architecture reaching up into principle* — a rule's owner, needing to justify itself, writes the reasoning into its own document. That reasoning then exists twice, drifts, and the two copies are eventually cited against each other. This is why this document holds the *why* and cites the *what*, and why the four Experience Governance documents deliberately restate no rule of each other's.

**Consequently, a new piece of experience work begins at the layer its question belongs to.** A question of *should we?* is constitutional. A question of *what must it do, feel like, look like, or where does it sit?* is architectural, and belongs to one of the seven owners. A question of *how is it built?* is implementation, and creates no law at all. Work that starts in the middle — the common case — must be able to name the principle above it and the owner beside it before it ships.

### 2.2 Where this document sits

```
ARCHITECTURE_PRINCIPLES.md            engineering law — binds everything
        │
THA_BRAND_CONSTITUTION.md             enduring identity — who THA is
        │
► GOVERNING_EXPERIENCE_ARCHITECTURE.md   the experience constitution —
        │                                 principles, reasoning, the map
        │
THA_EXPERIENCE_ARCHITECTURE.md        BEHAVIOUR — prevails in every conflict of rule
        │
THA_EXPERIENCE_BLUEPRINT.md           VISION and PLACE
        │
THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md DESIGN CHARACTER
        │
THA_KEPT_ROOM_TRANSLATION.md          TRANSLATION into interface
```

Beside that spine, **non-overriding and never overridden**: `THA_UI_ARCHITECTURE.md` (the binding look — every colour, token, type value, shadow and duration), `THA_EXPERIENCE_LANGUAGE.md` (the feeling), and `THA_ORCHARD_LIVING_BOOK.md` (the lived account, which adds no rule and no gate).

### 2.3 Precedence, stated once

This document sits **upstream of the Experience Governance documents on the axis of principle, and downstream of every one of them on the axis of rule.**

That is deliberate and it is the whole of its constitutional position. It is read **first**, because it frames the question. It **loses every conflict**, because it answers a different one.

- On any question of **principle or reasoning** — *why is this the rule, and what should we do where no rule reaches?* — this document is the owner.
- On any question of **rule** — what must happen, what it must look like, what it must feel like, where it sits in the house — **the rule's owner prevails and this document is corrected**, in the same change that discovers the conflict.
- Between the four Experience Governance documents themselves, the existing precedence is untouched: **the Experience Architecture prevails** (`THA_EXPERIENCE_ARCHITECTURE.md` § 2.1).

This mirrors the two-axis position the Brand Constitution already holds (`THA_BRAND_CONSTITUTION.md` § 11), and for the same reason: a document that states *why* must never be able to overrule the document that states *what*, or the reasoning quietly becomes a second, rival law.

### 2.4 The yield clause

THA's experience canon holds a rule its documents apply to themselves: **one rule, one owner, forever** — and where a document duplicates a statement another owns, *the duplicate is the defect and is corrected to a citation* (`THA_EXPERIENCE_BLUEPRINT.md` § 18; `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 16.3; `THA_KEPT_ROOM_TRANSLATION.md` § 7.3).

This document is bound by that clause twice over, because a constitution is the document most tempted to restate everything beneath it.

**It therefore owns exactly eight things, and nothing else:**

| # | What this document owns | Why no one else could |
|---|---|---|
| 1 | The **reasoning** behind the home form (§ 4), the room form (§ 6), spatial restraint (§ 9), identity placement (§ 11), and the household outcome (§ 3.5) | Every existing document *asserts* these. None argues from the household's condition to the conclusion. |
| 2 | **Hospitality before productivity** and **Presence over engagement** as named principles (§ 3.1, § 3.4) | Their consequences are owned in several places. The principles themselves were unstated. |
| 3 | **Joy** as a positive principle (§ 13) | The word appears nowhere in the canon. Delight exists only as a constraint — rationed, earned, capped. Nothing said THA should *produce* it. |
| 4 | **Silence** as a named principle (§ 15) | It exists as a notification default and as one clause inside a principle about space. Nothing has silence as its subject. |
| 5 | **Surplus space becomes air and view** as *governing* law (§ 9.2, **GEA11**) | The rule existed only in `THA_KEPT_ROOM_TRANSLATION.md` § 4.1 and § 6, both citing `HOUSE1` § 19.3 — a document explicitly marked *"DESIGN SPECIFICATION — Not governing architecture"*. THA's most quotable spatial principle rested on a non-governing single-room spec. § 9.2 promotes it. |
| 6 | The **experience ownership map** (§ 17) and the **experience verification map** (§ 18) | Each owner names its own gate. Nothing named them all together, so no one could see the whole gate. |
| 7 | The **three-layer model** and its direction of flow (§ 2.1, **GEA20**) | Each document declares its own precedence relative to its neighbours. Nothing declared the *altitudes* — which meant no one could say whether a given statement was written at the wrong one. |
| 8 | **The Rooms Observe · The Companion Understands · The Household Decides** — the division of experience ownership between the three parties (§ 7.4, **GEA21–GEA23**) | Two of the three halves had owners: room conduct is `THA_EXPERIENCE_ARCHITECTURE.md`, Companion conduct and authority are its own documents. Nothing owned the *division between them*, and nothing named the household as a party that owns anything at all — so the one boundary most often crossed was the one no document was responsible for. |

Everything else in this document is a **citation**. Where a section below appears to state a rule, read the owner named beside it: that is where the rule lives, and that is the text that binds.

### 2.5 Change enters by governance, never by shipping

An amendment to this document is an amendment, made deliberately, in its own change, with its reasoning recorded. Nothing here changes because an implementation found it inconvenient. If a change cannot satisfy a principle, the correct move is to **stop and say so** — not to ship and let the principle erode silently. This is the standard clause every governing document in this directory carries, and it applies here without exception.

---

## 3. Core Philosophy

Four tenets. They are not a summary of the canon below them; they are the ground the canon stands on. Where a decision is genuinely uncovered by any rule, these decide it, in order.

### 3.1 Hospitality before productivity

**A guest is welcomed before they are put to work.**

Most software optimises for throughput: the fewest taps, the densest screen, the shortest path from intent to completion. That is a good instinct applied to the wrong subject. Throughput is the correct measure for a tool used *by choice, at work, to produce something*. Feeding a family is not that. It is unpaid, recurring, non-optional, and already carrying an emotional load before the product opens — the household is not looking for a faster way to do a task they enjoy; they are looking for relief from a task they cannot put down.

Hospitality is what you extend to someone in that condition. It costs a little efficiency and returns something efficiency cannot buy: the sense that arriving here is not the beginning of more work.

In practice this means THA will sometimes take a beat that a productivity tool would remove — an arrival before the workspace, a sentence before the grid, a room that greets before it asks. Those are not inefficiencies to be optimised away in a later pass. They are the product.

> **GEA1 — Where hospitality and efficiency conflict, hospitality wins.** A change that saves a household two seconds and costs them the feeling of being welcomed is a net loss, and must be recorded as one.

This does not license slowness. Effort is still the enemy (`THA_EXPERIENCE_LANGUAGE.md` § 4A Principle A — *less to carry, not more*), and speed is itself a form of courtesy. The tenet governs only the case where the two genuinely compete, which is rarer than it is claimed to be — and the claim should be checked before the trade is made.

### 3.2 Homes before software

**THA is built as a place, and the place is not a metaphor.**

The distinction matters because metaphors are decorative and places are structural. A metaphor can be applied at the end — a warm colour, a house icon, some cosy copy — and removed as easily. A place constrains everything: a place has a fixed geography, so the household can learn it once; a place persists whether or not you are looking at it, so returning to it is returning rather than reloading; a place has rooms with purposes, so what belongs where is decided by the architecture and not re-litigated per feature.

THA's canon already holds this as a fact about the product: the room analogy *"is not a skin over a set of features; it is what the product is"* (`THA_EXPERIENCE_BLUEPRINT.md` § 4.1). This tenet states its engineering consequence: **when a decision can be made either as software or as architecture, make it as architecture.** Where does this belong? — that is a question about rooms, not about routes. What happens when there is nothing here? — that is a question about a tended, empty room, not about a null state.

### 3.3 Technology becomes quieter as it becomes better

**Capability should be felt as ease, never seen as machinery.**

The Technology Principle is owned outright by `THA_EXPERIENCE_BLUEPRINT.md` § 1.5 — *"technology should quietly disappear; the household should always feel present"* — and its design consequence by `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 1.2. What this tenet adds is the **direction of travel**, which is the part that governs a roadmap rather than a screen.

The ordinary trajectory of a maturing product is louder: more intelligence means more panels announcing intelligence, more capability means more controls, more knowledge means more places the product tells you it knows things. THA's trajectory is the inverse. **A more capable THA is a quieter THA** — because capability that has been genuinely absorbed into the experience needs no surface of its own. The strip that explains what the system inferred is the visible residue of an inference that has not yet been made useful. When it is made useful, it becomes a better answer somewhere the household was already looking, and the strip comes down.

> **GEA2 — New capability must not increase the felt weight of the room it lands in.** If it can only be delivered as another panel, another badge or another strip, it is not finished. Ship it where the household is already looking, or hold it.

This is the single hardest tenet to honour, because it asks a team to do more work to produce less interface, and the work is invisible in the result. That is precisely why it is written down.

### 3.4 Presence over engagement

**THA succeeds when a household is present in their own life, not present in THA.**

Engagement is the wrong objective function for this product, and not for squeamish reasons — it is *inverted*. A product that reduces the burden of feeding a family will be opened **less** as it succeeds: fewer anxious re-checks, less deliberation, shorter visits. Optimising for time-in-app therefore optimises against the product's purpose, and every mechanism that raises engagement (the streak, the nudge, the unfinished progress ring, the notification with nothing behind it) buys attention from the household's actual evening.

THA measures the visit, not the session: *did they think about food a little less, trust it a little more, and notice the product not at all* (`THA_EXPERIENCE_BLUEPRINT.md` § 17). Attention is borrowed, never taken (`THA_EXPERIENCE_ARCHITECTURE.md` § 3, Principle 8), and the household's interest wins where the product's competes (`THA_BRAND_CONSTITUTION.md` § 7).

> **GEA3 — No surface may be designed to increase return frequency, session length, or completion for its own sake.** A prompt to return must carry a reason the household would accept if it were spoken aloud by a person.

### 3.5 The household outcome — why a household should feel happier

The canon measures THA in calm, trust, and reduced load. Those are correct, and they are means. This section names the end, because a means with no end attached drifts toward whatever is easiest to measure.

**A household should be perceptibly happier after using THA than before opening it.**

The claim sounds soft, and it is the most demanding thing in this document. Here is the argument for it.

Feeding a family is one of the few recurring domestic burdens that is simultaneously **compulsory** (it happens every day, and skipping it is not available), **collaborative** (it involves other people's preferences, health and moods), **judged** (by yourself, and often by others), and **invisible** (the work of deciding is never seen; only the result is). That combination produces a specific and very common form of low-grade unhappiness: not distress, but a persistent background friction — the six o'clock deliberation, the guilt about the last three days, the sense of never quite being on top of it.

A product placed exactly there has only two honest options. It can add itself to the load — one more thing to maintain, one more record of how you are doing, one more surface asking for attention — in which case it makes the unhappiness slightly worse while appearing to help. Or it can **take some of the load off**, in which case the household is measurably better off in a dimension they can feel, immediately, without being told.

There is no neutral third option. A food product occupying the deliberation moment either lightens it or adds to it. This is why *"does this leave the household with less to carry?"* is the first half of the release question (`THA_BRAND_CONSTITUTION.md` § 9) and why THA refuses the gamified treadmill (`THA_BRAND_CONSTITUTION.md` § 6): a streak is a load presented as a reward.

**Happier, in THA's specific sense, means four things:**

| | The household should leave with… | Because THA… |
|---|---|---|
| 1 | **Less on their mind** than when they arrived | answered a question they were carrying, or made it not need answering |
| 2 | **More confidence** in a decision already made | showed them their own life clearly, rather than grading it |
| 3 | **Less guilt** than the same facts would produce elsewhere | reports without judging, and never manufactures a deficit |
| 4 | **A small, true, unearned pleasure** | the Companion noticed something real about their household and said it plainly (§ 13; § 7.4, **GEA22**) |

Note what is absent: achievement, streaks, scores, and praise. Those produce a *spike* that is indistinguishable from happiness at the moment of delivery and is a debt afterwards, because each one raises the floor for the next. THA's version compounds in the other direction — a household that trusts the product carries less every time they open it.

> **GEA4 — Every user-facing change must be able to answer: which of the four does this produce?** A change that produces none of them, however clean, has not improved the experience. It has only changed it.

---

## 4. The Home

**Owner of the rule:** `THA_EXPERIENCE_ARCHITECTURE.md` § 3 (Principle 1) and § 4 — Home is the emotional centre; not a menu, dashboard or feed; reflects rather than demands; never the everything page. Home's place in the house is `THA_EXPERIENCE_BLUEPRINT.md` § 4; its feeling is `THA_EXPERIENCE_LANGUAGE.md` § 4A Principle G (*Home is not the dashboard*); its design reading is `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 13.1.

This section adds the reasoning, and one rule.

### 4.1 Why THA is a home rather than an application

An application is a **tool you pick up to perform a task, and put down when it is done.** Its virtues follow from that: it should be fast to enter, obvious to operate, and quick to leave. It has a task surface, a menu of capabilities, and a state that reflects the work in progress. Almost all software is this, correctly.

The form is wrong for THA for four reasons, and they compound.

**First: there is no task.** "Feeding a family" is not a task with a completion state; it is an ongoing condition. A household does not finish it, and never arrives with a single well-formed intent to execute. They arrive mid-stream, carrying a vague question — *what are we doing tonight, are we doing all right, is there anything I've forgotten* — which is a question about a **situation**, not a request for a function. Applications answer requests. Places answer situations, because you can look around a place.

**Second: the subject is the household, not the work.** An application's state is the state of the work: your document, your cart, your project. THA's state is the state of a *family* — what they eat, what they avoid, who lives there, what they have been managing lately. A tool that holds that much of a family's life and presents it as a work surface has made a category error about what it is holding. The natural form for a durable record of a household's own life is not a workspace. It is a home.

**Third: it must be returned to, indefinitely.** Applications are used and abandoned; there is no cost to a screen that is merely efficient, because nobody is going to be looking at it in four years. THA is meant to be lived with. Over that horizon the qualities that matter invert: **familiarity beats novelty, constancy beats optimisation, and the geography must stay still.** Those are properties of places, and applications actively lack them — an application that reorganises its navigation has improved; a home that moves its rooms has betrayed someone.

**Fourth: the emotional starting condition is negative.** An application may reasonably assume a neutral user with an intent. THA must assume a household arriving with a small weight already on them (§ 3.5). Applications have no vocabulary for that; they open onto work. Homes do — arrival, welcome, a room already in order, someone who has thought about this before you got here. THA needs that vocabulary, so THA must be that form.

The conclusion is not that the home is a warmer way to present an application. **It is that the application form cannot express what THA has to express**, and every attempt to hybridise the two produces the failure the canon names precisely: *Home reduced to a dashboard* (`THA_EXPERIENCE_LANGUAGE.md` § 7).

### 4.2 The consequence for the everything-page

The pressure on Home is permanent and comes from the best possible motive: everything genuinely is important, and Home is where everyone is. Each addition is individually defensible and the sum is a dashboard. The canon forbids the outcome (`THA_EXPERIENCE_ARCHITECTURE.md` § 4). The reasoning here supplies the defence: **Home is a room in which the household is a guest, and a guest is not handed the household's entire operational state on arrival.**

> **GEA5 — There is exactly one Home, and no rival may be built.** A second surface that answers *"how are we doing, and what's next?"* is not an alternative view of Home; it is Home, built twice, and the duplicate is retired in the change that discovers it (`ARCHITECTURE_PRINCIPLES.md` Principle 2; UI Principle 5 on retire-on-introduction).

---

## 5. The Orchard

**Owner of the rule:** `THA_EXPERIENCE_BLUEPRINT.md` § 6 — the ancient orchard, the laws of the one orchard (one orchard, one owner, one season; never wallpaper; never carries text; never animates), and the **Orchard Exposure Scale E0–E3** with the inverse law (*exposure is inversely proportional to functional density*) at § 6.2. The orchard's meaning — *life: bright, growing, optimistic, never gloomy or melancholy* — is owned by `THA_EXPERIENCE_LANGUAGE.md` § 3A.3. Its design reading is `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 10.

This section adds the reasoning, and resolves one ambiguity the scale leaves open.

### 5.1 Why the orchard should always remain present

The orchard is the only element of THA that is **not about the household's work**, and that is its entire function.

Every other thing in the house is instrumental: the planner plans, the pantry records, the cookbook holds, the shopping list prepares. A house made only of instruments is an office. What makes a home a home is that it contains things which are simply *there* — a view, the light, the outside continuing whether or not anyone is looking. Those elements do no work, and their doing no work is precisely why the room feels like somewhere to be rather than somewhere to produce.

The orchard is also THA's only permanent statement of **what the product is for**. Every functional surface speaks in the language of management — items, weeks, quantities, entries. The orchard speaks in the language of food before it becomes management: growing, seasonal, alive, good. A household deep in the shopping list is doing admin; the orchard beyond it is the quiet reminder of why the admin is worth doing. Remove it, and THA is a household logistics tool that happens to be about food. Keep it, and THA is about food, with logistics in service of it.

And it is the guarantee of **one place**. The single strongest signal that a household has not left the house is that the same orchard is outside every window. A shell can be reproduced; a navigation bar can be shared; those establish consistency. The orchard establishes **location** — the sense of being somewhere particular — which is what makes the rooms one home rather than a well-themed set of pages (`THA_EXPERIENCE_BLUEPRINT.md` § 5.2).

### 5.2 Present is not the same as visible

The Exposure Scale (`THA_EXPERIENCE_BLUEPRINT.md` § 6.2) correctly assigns some rooms **E0 — no orchard drawn at all**, because a dense functional surface must not compete with a view. That is right, and this section does not touch it.

It does resolve the ambiguity between "always present" and "E0", because the two read as a contradiction and the resolution is architectural:

> **GEA6 — The orchard is a permanent fact of the site, not a feature of a room.** A room at E0 is **shuttered, not relocated**. The house has not moved; this room simply has no window on this wall. It follows that the orchard is never *earned*, never *unlocked*, never *removed as a simplification*, and never *drawn differently* by the room that draws it — a room may only choose how much of the one orchard it admits, and that choice is a governed per-domain constant, never a per-surface or per-state decision.

The practical test: if the orchard's presence in the product could be *reduced to a single screen's decoration* by deleting a few lines, it was never a fact of the site — it was an image on the home page, and the house was never actually in an orchard.

---

## 6. Rooms

**Owner of the rule:** `THA_EXPERIENCE_BLUEPRINT.md` § 4 (One Home), § 5 (Many Places — *a room is differentiated by purpose, light, material, and one sign of life, never by its own architecture, navigation, palette or theme*), § 5.1 (the canonical map of the house), § 5.2 (what keeps the rooms one house), and § 15.3 (**the Experience Test**, mandatory for every screen). The per-room emotional job and rhythm are `THA_EXPERIENCE_LANGUAGE.md` §§ 5.1–5.9; the per-room design reading is `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 13; the interior philosophy is its § 4; the spatial anti-patterns are `THA_EXPERIENCE_BLUEPRINT.md` § 16.

### 6.1 Purpose, atmosphere, relationship

A room in THA is defined by three things, in this order.

**Purpose — the one thing it helps a household do.** Not the features it contains; the single verb it exists for. A room whose purpose takes two sentences is two rooms, or one room and a lodger. This is the first question of the Experience Test and it is answered *before* anything is designed.

**Atmosphere — how it should feel to be in it.** Rooms in a real house differ enormously in feeling while sharing every material: a kitchen is busy and a bedroom is calm, and neither is a different building. THA's rooms differ the same way and by the same means — how much light, how much view, how much air, how much is asked of you — and never by acquiring their own visual identity. The canon is exact about this, because the failure is so tempting: differentiation by theme produces *the costume* and *the theme park* (`THA_EXPERIENCE_BLUEPRINT.md` § 16), which read as several products sharing a login.

**Relationship — what lies next to it, and why a household moves between them.** Rooms are not a flat list; they have adjacency, and the adjacency should follow the household's actual sequence — you plan, then you check what you have, then you prepare to go out. A room that can only be reached from the menu is a page with a door drawn on it. Movement between rooms is *walking, not scrolling* (`THA_EXPERIENCE_LANGUAGE.md` § 4A Principle D), and it must preserve the sense of having gone somewhere without the sense of having left.

### 6.2 Why every room should feel like a room before it feels like a page

A page and a room are answers to different questions, and which one a surface is gets decided in the first second, before any content is read.

**A page is content delivered to you.** Its implied posture is *here is what we have for you*; you are a reader, the surface is the subject, and when the content changes the page has changed. **A room is a place you are in.** Its implied posture is *you are here, and your things are here*; you are the subject, the surface is the setting, and when the content changes nothing about the room has changed — the household's life moved, and the room accommodated it, which is what rooms do.

Three consequences follow, and each is a real defect when the ordering is reversed.

**The room must exist when it is empty.** A page with nothing on it is broken — it has failed to deliver. A room with nothing in it is simply quiet, and can be perfectly pleasant. If a surface only makes sense when full, it was designed as a page, and the household's very first visit — when everything is empty — will feel like a failure rather than a beginning. This is why *composed emptiness* is a design requirement (`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 4) rather than empty-state polish.

**The room must hold still.** Pages are free to reorganise around their content; that is a page doing its job. A room whose furniture rearranges itself according to what is in it cannot be learned, and a household that cannot learn the house must read it every time — which is exactly the cognitive load THA exists to remove. Layout is architecture and belongs to the room; content is the household's and belongs to them.

**The room must not perform.** A page's success is measured in attention: it wants to be looked at. A room's success is measured in use: it wants to be *lived in*, and the compliment it seeks is being unremarkable. This is the point at which the room framing stops being a design preference and becomes the mechanism enforcing § 3.4.

> **GEA7 — A surface is designed as a room before it is built as a page.** The Experience Test (`THA_EXPERIENCE_BLUEPRINT.md` § 15.3) is answered — which room, how should they feel, what one thing — **before** layout begins, not retrofitted at review. A surface that cannot answer all three is not a room, and must either become one or become part of one.

### 6.3 The room is not the unit of ownership

One clarification, because it is the most common way the room framing is misapplied. A room is a *place*, not a *codebase*. Rooms share every owner — the shell, the components, the tokens, the type scale, the motion vocabulary, the state law, the one Companion (`THA_EXPERIENCE_BLUEPRINT.md` § 5.2). A room that has acquired its own header, its own colours, its own card, or its own way of showing a loading state has not expressed its character; it has forked the house. Character comes from purpose, light, material and one sign of life. It never comes from a private implementation.

---

## 7. Companion

**Owner of the rule:** `THA_EXPERIENCE_ARCHITECTURE.md` § 11 owns Companion behaviour (invited not intrusive; discovers and refers; honest about its nature and limits; suggests, the person decides; serves the household's goals, not engagement). Its **place in the house** — one presence, one fixed chair, in the rooms and never a room — is `THA_EXPERIENCE_BLUEPRINT.md` § 13. Its **voice, persona and tone** are `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3) § 11–12; its **per-moment word-craft** is `THA_INTELLIGENCE_LANGUAGE_GUIDE.md`; its **authority** is `COMP_AUTH1_COMPANION_AUTHORITY_MODEL.md`; its **imagery** is `THA_UI_ARCHITECTURE.md` § 10.

**What this section owns** is the *division* between the three parties — which kind of statement belongs to a room, which to the Companion, and which decisions belong permanently to the household. That division is stated whole in **§ 7.4**.

### 7.1 Why the Companion is the sole conversational and coaching voice

THA speaks to households in two registers, and only two. There are three *parties* — the rooms, the Companion, and the household — but only the first two speak; the third is the one that decides, and § 7.4 states all three together.

**Rooms report.** A room states what is true — what is planned, what is in, what was eaten, what is missing. This is factual, impersonal, and owned by the surface displaying it. A room saying *"three meals planned this week"* is not speaking; it is showing.

**The Companion advises.** Anything that interprets, suggests, encourages, contextualises, notices a pattern, or tells a household what they might do next is **coaching**, and coaching is conversation whether or not it appears in a conversational interface.

Everything reduces to a single question: *is this surface reporting, or is it advising?* If it is advising, it is the Companion's, wherever it appears.

The reason for consolidating advice into one voice is not tidiness. It is that **advice requires a speaker**, and a household will construct one whether or not the architecture provides one. A tip strip on the planner, a "did you know" panel in the pantry, and an encouraging line in the diary are heard by a household as *the product* talking — the same product, three times, in three registers, with three levels of confidence and no shared memory of what it has already said. That produces four specific failures:

**It cannot be honest about what it knows.** The Companion is bound to say plainly when it does not know something. An authored strip in a room has no such faculty — it was written before the household existed, so it is confident by construction. The moment advice is authored rather than reasoned, non-fabrication (`ARCHITECTURE_PRINCIPLES.md` Principle 6) becomes unenforceable at that surface: a static sentence cannot detect that it has become false.

**It cannot be declined.** The Companion is *invited, not intrusive* — it can be closed, and closing it means something. Advice embedded in a room cannot be declined without leaving the room, so a household that does not want coaching today has no way to say so, and the product's restraint becomes a fiction.

**It cannot remember.** One presence accumulates a relationship: it knows what it said last week and does not say it again. Five independent surfaces repeat themselves indefinitely, and repetition converts advice into noise — after which the household stops reading all of it, including the safety-relevant part.

**It cannot be governed.** The Companion's words pass through a composition path that owns every byte the model reads, and a language guide that owns the sentence at each moment. A hard-coded string in a page bypasses all of it. It has no owner, no review, no context, and no way to be corrected except by someone finding it.

> **GEA8 — Coaching is the Companion's, wherever it appears.** No surface outside the Companion may interpret, advise, encourage, contextualise, or suggest a next action in its own voice. A room may **report** a fact it owns, and may **refer** to the Companion. It may not counsel.
>
> **GEA9 — Advice is composed, never authored.** Any sentence that adapts to a household's situation is produced through the Companion's composition path, from data, at the moment it is said. A static string that reads as personal guidance is a fabrication with a long fuse: it was true for someone once, and will eventually be false for everyone.
>
> *Provenance: GEA8 codifies an owner ruling made during `UX3` (2026-07-19, commit `7a5b48cf`) — "the Companion owns the coaching" — which until now existed only in a commit message and the Adoption Register. `HOUSE_ACT2` had previously mounted household-learning panels into four rooms on the opposite rationale (meet the household where the behaviour occurred); `UX3` retired all four as duplicates of the capability. Both rationales are on record and they contradict. `UX3` is the current state, and GEA8 is the principle that settles the next such question without re-litigating it.*

### 7.2 What this does not forbid

Intelligence may absolutely surface *in* rooms — that is the entire point of it, and the alternative (all intelligence locked behind a chat window) is worse. The distinction is **who is speaking**:

- A room showing an intelligence-derived **fact**, in the room's own factual register, presented as a property of the household's data — permitted. That is reporting.
- A room showing an intelligence-derived **opinion** in a personal voice — not permitted. That is the Companion, misplaced.
- The Companion **appearing** within a room to say something, in its own presence and register, declinable — permitted, and the correct pattern. It is *in* the rooms; it is never a room (`THA_EXPERIENCE_BLUEPRINT.md` § 13).

The boundary is workable in practice: *would a household attribute this sentence to a someone?* If yes, it belongs to the only someone THA has.

### 7.3 Presence

The Companion's presence is governed by one idea from which its manners follow: **it is a person in the house, not a feature of the interface.** A friend at the counter does not follow you room to room, does not speak into every silence, does not perform attentiveness, and does not simulate feelings it lacks — and equally, is not absent, not hidden behind a menu, and not different in each room. `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 13.8 lists what this rules out (a face, a pulse, typing theatrics, simulated mood, a stage), and `THA_EXPERIENCE_BLUEPRINT.md` § 13 owns its one permitted sign of life.

### 7.4 The three owners, stated whole

Everything in § 7.1–§ 7.3 divides one question — *who is speaking, and with what standing?* — and the division has, until now, been stated only in halves: rooms report, the Companion advises. That is two of the three parties. The third is the one the product exists for, and leaving it unnamed is what allows a well-intentioned change to take a decision away from a household while satisfying every rule about voice.

Stated whole, and permanently:

> ## The Rooms Observe.
> ## The Companion Understands.
> ## The Household Decides.

This is a **constitutional principle, not an implementation guideline.** The difference is not emphasis, it is enforceability. A guideline describes how work is usually done and is negotiable by anyone with a reasonable case; a constitutional principle names *who owns a kind of statement*, so that a proposal which puts the wrong owner behind a sentence is wrong **structurally** — wrong before anyone examines whether the sentence is good, well-written, well-placed, or well-intentioned. Most of the surfaces `EXPGOV1` § 3 (C1) and `PRESENCE1` removed were individually defensible. They were not defensible as a question of ownership, and that is the only question this principle asks.

#### 7.4.1 What each party owns

| | **Rooms own** | **Rooms must never own** |
|---|---|---|
| | facts | coaching |
| | household state | encouragement |
| | workflow | congratulations |
| | controls | persuasion |
| | truthful reporting | behavioural interpretation |
| | | emotional judgement |

A room's whole duty is to be **true and legible**. It shows what is planned, what is in, what was eaten, what is missing, and it gives the household the controls to change any of it. It states no opinion about what those facts *mean*, and no opinion at all about the people they describe.

| | **The Companion owns** | **The Companion must always** |
|---|---|---|
| | interpretation | ground every statement in evidence |
| | observations | never invent an observation |
| | coaching | prefer silence over weak guidance |
| | encouragement | explain its reasoning when asked |
| | reassurance | respect household agency |
| | explanation | |
| | recommendations | |

The five duties are not new law and are not stated here as new law. Grounding and non-invention are `ARCHITECTURE_PRINCIPLES.md` Principle 6 (non-fabrication) reaching the presentation layer, composed through `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`, which owns every byte the model reads. Silence over weak guidance is **GEA15** applied to the one voice permitted to speak. Explanation on request and the limits of what the Companion may assert are `COMP_AUTH1_COMPANION_AUTHORITY_MODEL.md`. Agency is `THA_EXPERIENCE_ARCHITECTURE.md` § 11 — *it suggests, the person decides*. They are collected here because **a sole owner of interpretation is only safe for as long as it is held to the standard it was given the monopoly under**, and that standard had never been written next to the monopoly. `PRESENCE2` found the cost of the gap directly: the last two scoring surfaces in the platform were the Companion's own.

| | **The household always owns** |
|---|---|
| | decisions |
| | priorities |
| | values |
| | pace of change |

**The Companion never takes a decision away from the household** — not by making it, not by pre-making it and presenting the result as a default, and not by narrowing the options presented until only one remains available. A recommendation the household cannot decline is not a recommendation.

#### 7.4.2 The two senses of *observe*, resolved

The principle says the rooms observe, and § 7.4.1 gives observations to the Companion. That is not a contradiction, and the distinction is load-bearing enough that it is fixed here rather than left to be re-derived.

**A room observes the way a window observes.** It faces the household's life and shows it accurately. It has no view about what it is showing.

**The Companion observes the way a person observes.** It notices something across time, understands what it means, and says so.

So the rule is: **the rooms observe without speaking about what they see, and the Companion is the only party that may say what it noticed.** *"Lentils appeared in eleven meals this month"* rendered as a fact of the household's data is a room observing. The same sentence said as a noticing — *"lentils have quietly become a habit here"* — is the Companion. The room may hold the fact; only the Companion may make anything of it.

#### 7.4.3 The principles

> **GEA21 — The rooms observe.** A room owns facts, household state, workflow, controls, and truthful reporting of all four. It may never own coaching, encouragement, congratulation, persuasion, behavioural interpretation, or emotional judgement. A room may show what is true and refer to the Companion; it may not tell a household what it means (§ 7.1, **GEA8**; honest absence, **GEA17**).
>
> **GEA22 — The Companion understands.** Interpretation, observation, coaching, encouragement, reassurance, explanation and recommendation have exactly one owner in THA, and it is the Companion. It holds that ownership on five permanent conditions: every statement is grounded in evidence; no observation is ever invented; silence is preferred to weak guidance; the reasoning is explained on request; and household agency is respected. A sole voice that is not held to these is worse than the many voices it replaced, because it is trusted more.
>
> **GEA23 — The household decides.** Decisions, priorities, values and the pace of change belong permanently to the household, and no surface, notice, default or recommendation may take one of them. THA may make a decision easier, better informed, or unnecessary. It may never make it on the household's behalf and present the result as settled.

#### 7.4.4 Why this is permanent

The three owners are not a division of labour that a future architecture might reasonably re-cut. Each of the three is a party that cannot be substituted:

- A room that interprets is a speaker with no memory, no evidence path, no way to be declined, and no way to detect that it has become false (§ 7.1).
- An interpretation with no single owner is an interpretation with no standard, because a standard applied to one of five voices is a standard applied to none.
- A household that does not decide is not being kept house for. It is being managed — which is the precise thing `THA_BRAND_CONSTITUTION.md` says THA must never become, and which **GEA3** and **GEA13** each forbid one face of.

The principle therefore states a permanent property of what THA *is*, not a preference about how it is currently built, and it is amended only by § 19.

---

## 8. Light

**Owner of the rule:** `THA_EXPERIENCE_BLUEPRINT.md` § 7 — one sun, one direction, one hour; every room is a morning room; rooms differ by *exposure*, never by *hour*; rooms have lighting, not light shows. The **light vocabulary** (the ground plane, one light, warm shadow, the penumbra) and every light *value* are `THA_UI_ARCHITECTURE.md` § 4 and § 7. The permitted **meanings** of light — exactly five: welcome, warmth, calm, clarity, optimism — are `THA_EXPERIENCE_LANGUAGE.md` § 4A Principle F. The design reading is `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 6.

### 8.1 Why light is architecture

Light is the only element in THA that touches every surface without being on any of them, which makes it the cheapest possible source of both coherence and chaos.

Its architectural role is that it does the work of hierarchy **before** hierarchy is expressed in anything a household can name. A well-lit room needs less colour, fewer rules, fewer borders and less weight to be legible, because the eye has already been told what is near, what is far, and what is resting on what. Every emphasis mechanism THA does *not* need is a mechanism that cannot later be misused.

This is why the one-sun law is a law rather than a preference. Two light sources are not twice as expressive; they are **incoherent**, because depth stops being readable — a surface lifted by one light and flattened by another has no position in space, and the household's eye stops trusting elevation to mean anything at all. Once that trust is gone it cannot be recovered by using elevation more carefully; it has to be recovered by using something else, which is how a calm interface acquires borders, bolder colour and heavier type.

### 8.2 Light carries meaning, and only five

Because light reaches everything, anything encoded in it becomes a global language. Five meanings are permitted and the list is closed (`THA_EXPERIENCE_LANGUAGE.md` § 4A Principle F). The reason for the closure is that light is a **poor carrier of specific information** and an excellent carrier of atmosphere: a household can feel that a room is welcoming, but cannot read that a value is 12% below target from a warmth. Encoding status, urgency, time of day, or performance in light does not communicate them; it degrades the atmosphere while communicating nothing, and it means every future room must be lit around a data condition.

> **GEA10 — Light expresses atmosphere and depth. It never encodes state, status, urgency, time, or performance.** Those have owners at the presentation layer (`THA_UI_ARCHITECTURE.md` § 7 and § 12); light is not one of them.

---

## 9. Space & Scale

**Owner of the rule:** `THA_UI_ARCHITECTURE.md` § 6 owns the canonical page anatomy, including *"content never stretches to fill whatever width exists; the column serves reading, not the viewport"*; its § 9 owns the spacing scale, density as the responsive model, one breakpoint truth, and touch as the default. *Air is a material* is `THA_EXPERIENCE_BLUEPRINT.md` § 8.2. The feeling of space is `THA_EXPERIENCE_LANGUAGE.md` § 4 Principle 8.

This section owns the **principle** those rules serve, and promotes one rule that has never had a governing home.

### 9.1 Space is architecture, not responsive design

Responsive design asks a question about the **viewport**: given this much room, how should the interface reflow? It is a technique for keeping a fixed set of content usable across sizes, and it is measured by whether anything breaks.

THA asks a question about the **room**: given this much space, how should the room feel? That is an architectural question, and it has a different answer, because a room and a layout have opposite relationships with surplus space. A layout treats surplus as **capacity** — space that is not carrying content is space being wasted, so a wider viewport should carry more. A room treats surplus as **the thing itself** — the space in a room is not a container for the furniture, it is what makes it a room, and a room whose owner keeps adding furniture as it gets bigger has not been improved.

The distinction has a practical edge: it explains why a well-behaved responsive implementation can still produce a worse experience on a larger screen. Nothing broke. Every breakpoint behaved. The room simply got busier, which is the one outcome the architecture is trying to prevent.

### 9.2 Why more screen should improve the room, not enlarge the interface

The argument is about **what a household actually gained** when they opened THA on a bigger screen.

They did not gain a need for more information. Their household is the same size, their week has the same seven days, and the decision in front of them is identical. Nothing about their situation scaled. What changed is only that there is more room — and more room, in a home, is worth having for its own sake. Adding two more columns converts a genuine improvement (space) into a genuine cost (density), and does so silently, because each additional column is individually justifiable and the aggregate is never reviewed.

There is a second, harder reason. **Density is not neutral; it is a claim on attention.** Six cards across is not "the same content, better used" — it is a screen that asks the household to scan six items to find one, where three asked them to scan three. The larger screen was an opportunity to make the decision *easier*, and it was spent making the survey *bigger*. That is the exact inversion of § 3.3: the product became more capable of showing things and less good at helping.

And a third, which is about the house. A room's proportions are part of its identity. If the Cookbook is three cards wide on a laptop and six on a desktop, it is not one room seen from two distances — it is two rooms, and a household that uses both has learned neither. Constancy across devices is the same property as constancy across visits (§ 4.1), and it fails the same way.

> **GEA11 — Surplus space becomes air and view, never additional interface.** As a viewport grows: the content column holds its measure; the number of items shown at once does **not** increase; the space becomes breathing room, and — where the room's exposure permits it — more of the orchard. A room may become *calmer* on a larger screen. It may not become *fuller*.
>
> *Provenance: this rule existed in THA only in `THA_KEPT_ROOM_TRANSLATION.md` § 4.1 and § 6, both sourced to `HOUSE1` § 19.3 — a document explicitly marked "DESIGN SPECIFICATION — Not governing architecture", scoped to a single room. `EXPGOV1` promotes it to governing law for the whole house. The Kept Room Translation's statements are correct and unchanged; they are now translations of a rule that has an owner.*

### 9.3 The two honest exceptions

**A grid whose items are the household's actual, bounded set** — the seven days of a week — is not density; it is the shape of the thing itself, and showing all seven at once is the correct answer at every size. GEA11 governs *unbounded* collections, where "how many at once" is a design decision rather than a fact.

**A second column carrying a different register** — a workspace and a docked Companion panel, which `THA_UI_ARCHITECTURE.md` § 6 already permits — is not additional interface; it is the room revealing that it has always had a counter in it. The test is whether the second region is *the same kind of thing repeated* (forbidden) or *a different thing that was previously overlapping* (permitted).

---

## 10. Materials

**Owner of the rule:** `THA_EXPERIENCE_BLUEPRINT.md` § 8.1 owns the three grounds — background/the world (constant), middle ground/the room (**the only layer that varies by domain**), foreground/what floats (constant) — and § 8.2 owns the material laws (the ground plane is the room's identity, one ground per workspace and never nested; solidity follows importance; air is a material; the hand answers identically everywhere). The material vocabulary and every material *value* are `THA_UI_ARCHITECTURE.md` § 4, § 9 and § 16. The sensibility is `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 5 and § 9; the per-material translations are `THA_KEPT_ROOM_TRANSLATION.md` § 4.2.

### 10.1 Why materials, and why few

A material vocabulary answers a question that a component library cannot: **what is this thing made of, and therefore how does it behave?** Components tell you what exists; materials tell you what is heavy, what floats, what is near, what is fixed, and what may be moved — which is what the eye needs in order to stop reading and start recognising.

The vocabulary is deliberately tiny, and the smallness is the design. Materials communicate by *contrast*, so their expressive power is inversely proportional to their number: with three, a household learns the whole language in a session and thereafter reads every surface at a glance. With ten, nothing means anything in particular, and each new surface has to be read from scratch. Every material added subtracts meaning from all the others — which is why a new one is admitted deliberately, once, with a reason, and never introduced by an implementation that needed a slightly different card.

### 10.2 Honesty

The governing constraint is **structural honesty**: materials describe real relationships in the interface, not decoration applied over it. A raised surface is raised because it is nearer and interactive; a shadow is the consequence of the one light (§ 8), not a style; texture is *"the honesty of a surface, not an applied grain"* (`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 9).

The reason this matters beyond taste is that dishonest materials are a slow lie about the interface's structure, and households read them faster than they read text. A surface that looks liftable and is not, or floats but does nothing, teaches the household that appearance does not predict behaviour — after which they must click to find out, and the interface has stopped being legible. **Every material claim is a promise about what will happen.**

---

## 11. Identity

**Owner of the rule:** `THA_UI_ARCHITECTURE.md` § 10 (Brand Identity Architecture) is the sole owner of THA's visual identity — the logos, the apple, domain icons, illustration and image style, Companion imagery, empty-state imagery — including *exactly one apple, one canonical mark, one semantics*, identity positions only, and never re-drawn, re-coloured, or embedded in content. Its § 8 owns the signature typeface; § 17 owns how a new asset class is admitted. THA's **enduring** identity, which touches no pixel, is `THA_BRAND_CONSTITUTION.md`.

This section adds the reasoning for the placement.

### 11.1 Why logos belong to the architecture rather than to branding

The instinct to file identity under branding is strong and, for most products, harmless. It is wrong for THA for a reason that is structural rather than territorial.

**Branding governs how a product presents itself to people who do not use it.** Its natural habitat is the outside of the product — acquisition, campaigns, the landing page — and its natural behaviour is *variation*: a brand system exists to be applied flexibly across contexts, refreshed periodically, and adapted per surface. Variation is a virtue there. A brand that looks identical in every context has failed at its job.

**Architecture governs how a product behaves for people who live in it.** Its natural behaviour is *invariance*, and it is measured over years.

The mark sits in both territories, and THA has to choose which behaviour governs it — because the two are incompatible. Filed under branding, the mark is an asset applied wherever it strengthens recognition: it multiplies (a header version, a compact version, a rating version, a loading version), it varies (recoloured to suit a room, restyled to suit a campaign), and it accumulates meanings (the mark, and also a rating scale, and also a decorative motif). Each step is individually reasonable. The end state is that the household sees five apples that mean four different things, and the mark has stopped identifying anything — it has become a texture.

**Filed under architecture, the mark is a detail of the building.** A detail is placed once, in the positions the architecture defines, and is not reapplied wherever it might look good. This is what the canon means by *exactly one apple*: not that only one image file may exist, but that the apple carries **one meaning**, and a second apple with a second meaning is a brand failure (`THA_UI_ARCHITECTURE.md` § 10).

There is a further reason specific to THA. The house is built on restraint — the household's own life is the only ornament (`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 4). A logo repeated through the interior is **the product decorating with itself**, which is the most direct possible violation of that principle and of § 3.4: every additional mark is the product making itself present in a room where the household is supposed to be the subject. An architectural detail is quiet, appears where the architecture calls for it, and is noticed once.

> **GEA12 — Identity marks are placed by the architecture, never applied for reinforcement.** A mark appears in identity positions only. It is never recoloured to suit a room, never redrawn for a context, never used as decoration or as texture, and never carries a second meaning. A room that wants a mark for warmth wants light, material or air instead (§ 8, § 10, § 9).

### 11.2 The corollary: identity is not evidence

One misuse worth naming, because it is subtle and appears trustworthy. A mark placed beside a claim reads as endorsement — *THA says this is good* — which converts an identity element into a **truth claim**, and a truth claim has a completely different owner (`THA_UI_ARCHITECTURE.md` § 14, Visual Trust; `ARCHITECTURE_PRINCIPLES.md` Principle 6). Where THA rates or scores a **product**, the presentation is owned by the rating's owner and must be legible as a rating with a stated basis. **Recommendation** is not a presentation question at all — it belongs to the Companion, and to nothing else (§ 7.4, **GEA22**). Identity may not be borrowed to lend authority to a number.

---

## 12. Colour & Atmosphere

**Owner of the rule:** `THA_UI_ARCHITECTURE.md` § 7 owns colour law — the semantic tiers, no raw colour, one meaning per colour, colour never the sole carrier of meaning, light and dark as value sets — and § 4 owns the Calm Orchard visual language. The **emotional palette** is `THA_EXPERIENCE_LANGUAGE.md` § 3A: the eight temperatures THA must never feel (§ 3A.1), the seven-note palette it must always feel (§ 3A.2), the orchard as life (§ 3A.3), and the governing principle **"calm must never become lifeless"** (§ 3A.4). The seven feelings are its § 3. The colour philosophy is `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 7; atmosphere is its § 12.

### 12.1 Why warmth is the correct register

THA's atmosphere is warm, and the alternative registers are not neutral choices — each contradicts something the product claims.

A **clinical** register (cool, precise, high-contrast, medical) is the natural aesthetic for nutrition data, and it is wrong here for a plain reason: it frames food as a health problem being managed. THA's position is that food is a good part of family life that has become effortful, and that the effort is the problem. An interface that feels like a clinic has argued the opposite case before a word is read, and the copy cannot recover it.

A **luxury** register (dark, sparse, high-contrast, restrained to the point of severity) is the natural aesthetic for premium, and it is wrong because THA's premium is *care taken on the household's behalf*, explicitly not exclusivity (`THA_EXPERIENCE_ARCHITECTURE.md` § 17). Luxury signals *this is for a certain kind of person*. A home signals *you live here*.

A **playful** register is wrong because it condescends to a real burden, and because charm consumes the credibility that safety information depends on.

Warmth is what remains, and it is not a fallback: it is the atmospheric expression of § 3.1. Warmth is what hospitality looks like when it has no words.

### 12.2 The counterfeit

The failure mode of a calm, warm, restrained product is not noise. It is **lifelessness** — and the canon names it precisely, because it is a counterfeit that passes every check: an interface can be beautifully calm, correctly restrained, perfectly tokenised, and feel like nobody lives there. `THA_EXPERIENCE_LANGUAGE.md` § 3A.1 lists *silent*, *sterile*, *empty*, and *funeral parlour calm* among the eight temperatures THA must never have, and § 3A.4 states the governing principle.

The architectural point is that **life comes from the household, not from decoration.** An interface that feels lived in has the household's own life in it — their meals, their week, their people, visible and recognisable. An interface that feels dead has been emptied of everything except the product's own structure, and the usual remedy (add warmth: an illustration, a colour, a friendly line) is exactly wrong, because it adds the *product's* presence where the *household's* was missing. The fix for a lifeless room is more of the household, not more of THA.

---

## 13. Joy

Nothing in THA's canon has ever asked the product to produce joy. Delight appears only as a constraint — rationed, earned, capped, punctuation not texture (`THA_EXPERIENCE_ARCHITECTURE.md` § 17.6 and § 17.9; `THA_EXPERIENCE_LANGUAGE.md` § 4 Principle 10; `THA_EXPERIENCE_BLUEPRINT.md` § 12). Those constraints are right and this section does not loosen one of them. But a product built only of constraints on delight will reliably produce none, and § 3.5 requires some. This section states the positive principle.

### 13.1 Quiet delight

**THA's joy is the pleasure of being noticed accurately.**

Not celebrated. Not rewarded. *Noticed* — the small, specific, slightly surprising pleasure of a product observing something true about your household that you had not put into words, and **the Companion** mentioning it plainly, without making anything of it. *You have cooked with lentils eleven times this year.* *Everyone in the house eats this one.* *This is the third spring you have planted the same thing.*

The speaker is not incidental to the mechanism, and § 7.4 fixes it: a room may **hold** any of those three facts, and only the Companion may **say what it noticed** (**GEA21**, **GEA22**; the two senses of *observe* are separated at § 7.4.2). A room that mentions one of these in its own voice has not produced this pleasure — it has produced the generic encouragement the next paragraph explains cannot work.

The pleasure has a precise source, and understanding it is what keeps the mechanism honest. It is not the fact itself, which is trivial. It is the evidence the fact carries: **that something has been paying attention to your household, over time, and got it right.** That is why it cannot be manufactured — a generic encouragement produces nothing, because it demonstrates no attention. The joy is a *by-product of accuracy*, which means it can only be produced by actually knowing the household, and can never be produced by the copy layer.

Three properties follow, and they are what separate this from every mechanism THA refuses:

**It is unearned.** The household did nothing to receive it and cannot lose it. Nothing is being awarded, so nothing is being withheld.

**It asks for nothing.** It is not a prompt, has no action attached, and does not begin a sequence. A household that ignores it entirely has lost nothing.

**It is true, or it is silent.** Every such moment is data-borne. This is already the law for Living Details — *data-borne or dead*, honest in absence (`THA_EXPERIENCE_BLUEPRINT.md` § 12.1) — and it is the whole safeguard: a joy mechanism that can fire without a real fact behind it will, within a release or two, be firing on nothing.

### 13.2 Why never gamification

Gamification is the industry-standard method of producing exactly the feeling § 13.1 describes, and it is forbidden. The reason is not that games are undignified. It is that gamification and THA's purpose are in direct opposition, and the opposition is mechanical.

**A game creates a burden and then rewards you for carrying it.** A streak has no value outside the system that grants it; it is a debt the product issues to itself and then charges the household to service. The mechanism works — that is why it is everywhere — but what it produces is *engagement*, which is the thing § 3.4 identifies as inverted for this product. THA exists to reduce the household's load. A streak adds one, disguises it as an achievement, and the household ends up with **more** to carry, feeling briefly better about it.

**It converts intrinsic activity into extrinsic performance.** Feeding your family is meaningful on its own. Scoring it does not add motivation; it *replaces* the motivation with a worse one, and the replacement is not reversible — the household that has been eating well for a 40-day streak has partly stopped eating well for their family. When the streak breaks, as it must, what is lost is not the streak.

**It manufactures failure at a rate the product controls.** Any score has a below. Any streak has a break. Any progress ring is mostly empty. THA operates in a domain where households already carry guilt about food (§ 3.5), and a scoring mechanism does not measure that guilt — it **produces** it, on a schedule, in service of engagement. This is the direct violation of the Household First Principle (`THA_BRAND_CONSTITUTION.md` § 7).

**It corrupts the honest facts next to it.** Once a household learns that a surface exists to motivate them, they discount everything on it, including the parts that are simply true. Gamification spends the product's credibility, and credibility is what a household relies on when THA says something about an allergen.

> **GEA13 — THA never scores, ranks, streaks, or rewards a household.** Specifically forbidden: streaks and consecutive-day counts; points, XP, levels, badges, trophies, tiers or ranks; scores presented as a verdict on the household or their food; progress bars toward a target the household did not set; celebration effects for ordinary use; and any mechanism whose purpose is to make the household return.
>
> **Permitted, and different in kind:** *reporting a quantity a household asked for* (how many plants this week — a fact, not a grade); *stating a rating with an explicit, published basis* where the subject is a **product**, not the household (`THA_UI_ARCHITECTURE.md` § 10 and § 14); and *acknowledging a genuine milestone once*, in the Companion's voice, without ceremony (`THA_EXPERIENCE_ARCHITECTURE.md` § 17.9).
>
> The distinguishing test: **does this measure the food, or grade the household?** A rating on a jar of sauce is information. The same rating aggregated into a verdict on a family's week is a judgement, and THA does not judge.

---

## 14. Movement

**Owner of the rule:** `THA_UI_ARCHITECTURE.md` § 11 owns motion law and every motion value — functional, brief, optional; one vocabulary; nothing loops for attention; reduced motion as a first-class mode. The feeling of motion is `THA_EXPERIENCE_LANGUAGE.md` § 4 Principle 4 and Principle 12; its restraint test — *"if the person notices the animation before they notice the content, the animation has failed"* — is its § 4A Principle H. The house adds no motion rule of its own (`THA_EXPERIENCE_BLUEPRINT.md` § 9).

### 14.1 Why movement is explanation

Movement in THA has exactly one job: **to explain a change that would otherwise have to be re-read.**

When something appears, moves, expands or disappears, the household has to work out what happened — did this replace that, did it come from there, is it still here. Motion answers that question continuously and pre-verbally, in a way that no static rearrangement can: a panel that slides out of a button was clearly produced by the button, where a panel that simply exists must be located and understood. Used this way, motion *reduces* cognitive load, which is why it is permitted at all in a product otherwise committed to stillness.

Everything else motion is used for — drawing attention, expressing personality, signalling quality, rewarding an action — spends the household's attention rather than saving it, and does so on the product's behalf. That is § 3.4 again, at the level of milliseconds.

### 14.2 Why the house is still

A house does not move. Its stillness is what allows the life inside it to be the thing in motion, and it is the single most reliable source of calm the architecture has: a household can look at a still interface for as long as they like without being asked for anything. Anything that moves without being asked to has taken something.

This is why looping animation is forbidden outright, and why the only sanctioned exception in the whole house is the Companion arriving a beat after you (`THA_EXPERIENCE_BLUEPRINT.md` § 13) — a person entering a room is the one thing in a house that is *supposed* to move, and it is a single arrival, not a behaviour.

> **GEA14 — Motion is caused by the household, or it does not happen.** Every movement in THA is the visible consequence of something the household did, or of the one governed exception. Nothing animates on arrival for effect, nothing loops, and nothing moves to attract attention to itself.

---

## 15. Silence

Silence exists in the canon as a notification posture (`THA_EXPERIENCE_ARCHITECTURE.md` § 15) and as one clause inside a principle about space (`THA_EXPERIENCE_LANGUAGE.md` § 4 Principle 8). It has never been the subject of a principle, and it needs to be, because it is the mechanism behind half of THA's other commitments — and because it has a failure mode the canon explicitly forbids.

### 15.1 The two silences

There is a distinction here that has to be drawn precisely, because `THA_EXPERIENCE_LANGUAGE.md` § 3A.1 lists **silent** among the eight temperatures THA must never feel, and § 3A.4 warns against *excessive silence*. Those are not in tension with this section; they name a different thing.

**Silence as absence** — an interface with nothing in it, saying nothing, offering nothing, indistinguishable from broken or abandoned. This is forbidden, and it is what § 3A.1 means. It reads as neglect.

**Silence as restraint** — a product that has plenty to say and says almost none of it, because most of it would not help. This is required, and it reads as composure. The difference is legible instantly: a silent room feels empty; a restrained room feels *tended*. Same word count, opposite meaning, and the discriminator is whether the household can tell that a choice was made.

**THA's principle is restraint, never absence.** The room is complete, considered, and warm; it simply is not talking.

### 15.2 Why silence is the default

**Because everything THA says costs the household something.** Attention is finite and already committed elsewhere — that is the entire premise of § 3.5. Every sentence, badge, banner and notification draws on the same account, and the balance is not replenished. A product that speaks whenever it has something valid to say will, given enough features, speak constantly, because each individual utterance passes its own test.

**Because silence is what makes speech mean anything.** A product that comments continuously cannot be heard when it matters — and THA has things that genuinely matter, including an allergen. The credibility to interrupt a household is built entirely out of the thousands of occasions on which THA had something mildly interesting to say and did not. Every unnecessary notice is a withdrawal from the account that safety information draws on. This is the strongest practical argument in this document: **THA's silence is a safety mechanism.**

**Because most of what a product knows is not worth a household's evening.** The default assumption should be that an observation is interesting to the team that built it and irrelevant to the family receiving it. The burden of proof runs one way.

> **GEA15 — Silence is the default; speech is the exception that must be justified.** THA speaks when it has something **true**, **useful now**, and **not already known** to the household. Anything that fails all three is not said. Silence is never expressed as an empty surface: a room with nothing to say is complete, tended, and quiet — never blank (`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 4, composed emptiness).

### 15.3 Honest absence

The hardest silence is the one about THA's own limits. When THA does not know something, the pressure to produce a plausible answer is enormous and the alternative feels like failure. It is not. **An honest gap is a feature of a trustworthy product**, and it is already law (`ARCHITECTURE_PRINCIPLES.md` Principle 6). Its experience consequence: an empty state that says plainly *there is nothing here yet* is worth more than a filled one that invented something, because the household is going to find out either way, and the second version costs the product everything the first version cost it nothing.

---

## 16. Technology

**Owner of the rule:** `THA_EXPERIENCE_BLUEPRINT.md` § 1.5 owns the Technology Principle — *"technology should quietly disappear; the household should always feel present"*. Its design consequence is `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 1.2; its ordering laws are `THA_KEPT_ROOM_TRANSLATION.md` § 5.

### 16.1 Technology is the house's plumbing

A well-built house has extraordinary technology in it and displays none of it. Nobody admires the wiring; they notice that the light comes on. The technology is judged entirely by the absence of trouble, and its highest achievement is being forgotten.

THA's intelligence is held to the same standard. This is a genuinely uncomfortable position, because intelligence is expensive, differentiating, and the thing everyone wants to show. The temptation is to make it visible — a panel that explains what was inferred, a label announcing that a suggestion is personalised, a badge for the model. Every one of those is the wiring on the outside of the wall.

The reason it is refused is not modesty. It is that **announcing intelligence is a substitute for delivering it.** A strip explaining what the system noticed is what a system produces when the noticing has not yet been turned into a better answer. When it has, the strip is unnecessary — the answer is simply better, and the household experiences that as the product being good rather than as the product being clever. A product that has to tell you it is intelligent is reporting a capability rather than exercising one.

### 16.2 What this does not mean

It does not mean hiding how THA works. **Honesty about the product's nature and limits is required** (`THA_EXPERIENCE_ARCHITECTURE.md` § 11), and a household must always be able to find out why something was suggested and on what basis. The distinction is between **available** and **announced**: an explanation the household can ask for is transparency; an explanation delivered unasked, in every room, is the technology making itself the subject.

> **GEA16 — Intelligence is experienced as a better answer, never as a visible mechanism.** THA does not label its own cleverness, narrate its reasoning unasked, or give its intelligence surfaces of its own. Where a household wants to know why, the answer is available on request, in the Companion's voice (§ 7).

---

## 17. Experience Ownership

Every experience question in THA has exactly one owner. This section is the **map** — the only thing in this document that is a lookup table rather than an argument. It creates no ownership; it records what each document already declares, in one place, so that the question *"who governs this?"* is answerable in seconds.

It is organised by the three layers of § 2.1, because the layer is usually the faster half of the answer: knowing that a question is architectural rather than constitutional eliminates most of the candidates immediately.

### 17.1 The owners, by layer

**Layer 1 — Experience Constitution** *(why · philosophy · principles · outcome)*

| Question | Owner |
|---|---|
| Why THA exists; enduring identity; the Household First Principle; the Trust Test; the One Question | `THA_BRAND_CONSTITUTION.md` |
| **Why the rules are the rules**; hospitality; presence; joy; silence; space as architecture; identity as detail; the household outcome; the layer model; this map | **This document** |
| **Who owns which kind of statement** — the rooms observe, the Companion understands, the household decides (§ 7.4) | **This document** |

**Layer 2 — Experience Architecture** *(behaviour · feeling · look · place · character · translation)*

| Question | Owner |
|---|---|
| What the experience must **do** — Home, progressive disclosure, calm before capability, one primary action, journeys, Companion behaviour, trust, errors, notifications, accessibility, the premium standard | `THA_EXPERIENCE_ARCHITECTURE.md` |
| How it must **feel** — the seven feelings, the emotional palette, the thirteen Principles of Feeling, the eight Place Principles, the six-beat Rhythm, the anti-patterns | `THA_EXPERIENCE_LANGUAGE.md` |
| How it must **look** — every colour, token, type value, spacing value, shadow, radius, duration; page anatomy; state presentation; Visual Trust; Brand Identity Architecture | `THA_UI_ARCHITECTURE.md` |
| The **place** — One Home Many Places, the map of the house, the orchard and E0–E3, the one sun, the three grounds, Living Details, the Companion's chair, the shell | `THA_EXPERIENCE_BLUEPRINT.md` |
| The house's **design character** — architectural character, interior philosophy, per-room design reading, *timeless not fashionable*, the Design Manifesto | `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` |
| The **translation** of each architectural characteristic into interface | `THA_KEPT_ROOM_TRANSLATION.md` |
| What it is **like to live here** (no rule, no gate) | `THA_ORCHARD_LIVING_BOOK.md` |
| The Companion's **voice, persona and tone** | `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` |
| The Companion's **words at each moment** | `THA_INTELLIGENCE_LANGUAGE_GUIDE.md` |
| The Companion's **authority** — what it may assert, decide, and do | `COMP_AUTH1_COMPANION_AUTHORITY_MODEL.md` |
| Every byte the model reads as grounding | `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` |

**Layer 3 — Experience Implementation** *(components · tokens · routes · pixels — originates no law)*

| Question | Owner |
|---|---|
| Which client-side building blocks exist, are adopted, and are retired | `docs/implementation/ux/ADOPTION_REGISTER.md` (mandated by `THA_UI_ARCHITECTURE.md` § 17; gated by `npm run adoption:check`) |
| What THA **is** — the census of surfaces, routes, journeys and claims | `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` |
| What was built, when, and why | the implementation reports under `docs/implementation/ux/` |

The Product Knowledge Registry sits at Layer 3 because it is a **census, not a law** — it records what exists, and where it conflicts with an owner above it, the owner prevails and the registry is corrected (`THA_EXPERIENCE_ARCHITECTURE.md` § 2.2).

### 17.2 The rules of experience ownership

These are the engineering constitution applied at the presentation layer. They restate no rule; they name where each already-owned rule bites in experience work.

> **GEA17 — The presentation layer owns no fact.** Every value a household sees is read from its single owner. A room may not compute, cache, default, round, or invent a fact in order to display it, and where the owner has nothing, the room shows honest absence (`ARCHITECTURE_PRINCIPLES.md` Principle 2 and Principle 6).
>
> **GEA18 — One owner per experience concern, and the successor retires the predecessor in the same change.** Two headers, two homes, two greens, two apples, two empty-state patterns or two coaching voices are each a defect, not a transition — and an unadopted successor left beside its predecessor is the same defect with better intentions (`THA_UI_ARCHITECTURE.md` § 17; `ARCHITECTURE_PRINCIPLES.md` Principle 8).
>
> **GEA19 — A room may not fork the house.** A room expresses its character through purpose, light, material and one sign of life. It may not introduce its own shell, header, navigation, palette, card, loading state or breakpoint. If a room genuinely needs something the house does not have, the house acquires it by governance, once, for everyone (§ 6.3).
>
> **GEA20 — Experience work flows Constitution → Architecture → Implementation, and never upward.** A principle is stated in the Constitution, realised by an Architecture owner, and built in the Implementation. An implementation may not originate a rule; an architecture may not originate a principle it does not own. Where work discovers something durable and unowned, it is written **up** to the correct layer in the same change that discovered it — not left in the report that found it (§ 19.3).

---

## 18. Experience Verification

Experience work in THA is already gated in eight separate places, each owned by the document that wrote it. Nothing here replaces or duplicates them. This section does two things: it puts the whole gate in one place, and it adds the one check the existing gates cannot perform.

### 18.1 The full gate, in order

| Order | Gate | Owner | Asks |
|---|---|---|---|
| 0 | **The Experience Constitution Check** | **This document, § 18.2** | Was this designed from the principles at all? |
| 1 | **The Experience Test** | `THA_EXPERIENCE_BLUEPRINT.md` § 15.3 | Which room, how should they feel, what one thing — *was the room designed?* |
| 2 | **UX Governance Checklist** (incl. the Premium Standard block) | `THA_EXPERIENCE_ARCHITECTURE.md` § 18 | Does it behave correctly? |
| 3 | **UI Governance Checklist** | `THA_UI_ARCHITECTURE.md` § 18 | Does it look correct? |
| 4 | **Experience Review Questions** | `THA_EXPERIENCE_LANGUAGE.md` § 6 | Does it produce the right feeling? |
| 5 | **Blueprint Checks** | `THA_EXPERIENCE_BLUEPRINT.md` § 15.2 | Does it respect the house? |
| 6 | **Design Character Check** | `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` § 16.2 | Is it still the same house? |
| 7 | **Intelligence Language Check** | `THA_INTELLIGENCE_LANGUAGE_GUIDE.md` § 8 | Are the words right? *(AI-related work)* |
| 8 | **Adoption Register** + `npm run adoption:check` | `THA_UI_ARCHITECTURE.md` § 17 | Did the successor retire the predecessor? |
| 9 | **The One Question** | `THA_BRAND_CONSTITUTION.md` § 9 | *Less to carry, and could they trust it?* |

Gates 1–8 are made mandatory by the **EXPERIENCE & UI GOVERNANCE COMPLIANCE** block of `ENGINEERING_WORKFLOW.md`. Gate 9 sits above them all. Gate 0 is added by this document and runs first, because it is the only one that can fail a change which is *correct in every particular and wrong in conception*.

### 18.2 The Experience Constitution Check

Eight questions. Answered **before** design begins, not at review — a checklist run at the end can only verify that a thing was built well, never that it was the right thing.

```
----------------------------------------
EXPERIENCE CONSTITUTION CHECK  (GOVERNING_EXPERIENCE_ARCHITECTURE.md § 18.2)
----------------------------------------

For every UX, UI, frontend or visual change confirm:

✓ HOSPITALITY (§ 3.1) — Where this trades welcome against efficiency, welcome
    won; or the trade was not actually required and is recorded as such.

✓ OUTCOME (§ 3.5) — This change produces at least one of the four: less on the
    household's mind · more confidence in a decision · less guilt · a small,
    true, unearned pleasure. Name which.

✓ WEIGHT (§ 3.3, GEA2) — The room this lands in is not heavier than before.
    If capability was added, it was absorbed into an answer the household was
    already looking at — not delivered as another panel, badge or strip.

✓ VOICE (§ 7, GEA8/GEA9) — Nothing here coaches, interprets, encourages or
    suggests in its own voice. Rooms report; the Companion advises. Any
    adaptive sentence is composed at the moment it is said, never authored.

✓ OWNERSHIP (§ 7.4, GEA21/GEA22) — THE ROOMS OBSERVE · THE COMPANION
    UNDERSTANDS · THE HOUSEHOLD DECIDES. Every statement this change adds is
    named as one of: a fact a room owns, or an interpretation the Companion
    owns. Nothing in a room congratulates, persuades, or judges the household.
    Anything the Companion says is grounded in evidence, invents no
    observation, and stays silent rather than guess.

✓ AGENCY (§ 7.4, GEA23) — This takes no decision, priority, value, or pace of
    change away from the household. Nothing here decides on their behalf and
    presents the result as settled, and nothing narrows the options until only
    one remains.

✓ RESTRAINT (§ 9 / § 13 / § 15) — Surplus space became air and view, not more
    interface (GEA11). Nothing scores, streaks, ranks or rewards the household
    (GEA13). Nothing is said that is not true, useful now, and not already
    known (GEA15).

✓ LAYER (§ 2.1, GEA20) — This change sits at one layer and names the one above
    it: the principle it serves, and the Architecture owner (§ 17.1) whose rule
    it realises. Nothing here originates law at the implementation layer, and
    anything durable it discovered has been written UP to its owner in this
    same change.
```

**If any check fails: STOP, explain why, do not continue.**

### 18.3 What verification cannot do

A checklist verifies compliance, and compliance is not the objective. THA's canon already anticipates this — the Experience Review Questions exist precisely because a change can pass every box and still feel cold (`THA_EXPERIENCE_LANGUAGE.md` § 6), and the Experience Test exists because a screen can be well-built without ever having been designed as a room.

This document's contribution to that problem is the reasoning itself. **The gates catch the failures we have already seen. The principles are how you avoid the ones we have not.** When a decision is genuinely uncovered — and in a decade of work most of them will be — the sequence is: § 3.1 (hospitality before productivity), then § 3.2 (build it as architecture, not software), then § 3.3 (does this make the product quieter?), then § 3.4 (whose interest does this serve?). If those four do not settle it, the question belongs in an amendment, not in an implementation.

---

## 19. Amendment

This document is amended the way every governing document in this directory is amended: **deliberately, in its own change, with the reasoning recorded, and never by an implementation that found a principle inconvenient.**

Three specific obligations:

1. **A conflict of rule is resolved against this document.** If a section here contradicts an owner named in § 17, the owner is right and this document is corrected in the change that discovers it (§ 2.3).
2. **A concern that outgrows this document yields.** If one of the eight things owned here (§ 2.4) grows enough to deserve a fuller home, ownership moves and this document keeps a citation — the same yield clause the Blueprint, the Design Blueprint and the Translation each apply to themselves.
3. **A new principle enters here, once.** If experience work discovers a durable principle that no document owns, it is added here rather than left in the implementation report that found it. *Discovery is not ownership* (`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` § 9.3): a finding that stays inside the document that found it will be rediscovered from scratch by whoever asks next, and THA has repeated that failure often enough to have written it down.

---

## 20. The principles, in one place

For quotation in review.

| | |
|---|---|
| **GEA1** | Where hospitality and efficiency conflict, hospitality wins. |
| **GEA2** | New capability must not increase the felt weight of the room it lands in. |
| **GEA3** | No surface may be designed to increase return frequency, session length, or completion for its own sake. |
| **GEA4** | Every user-facing change must produce one of the four household outcomes, and name which. |
| **GEA5** | There is exactly one Home, and no rival may be built. |
| **GEA6** | The orchard is a permanent fact of the site, not a feature of a room. A room at E0 is shuttered, not relocated. |
| **GEA7** | A surface is designed as a room before it is built as a page. |
| **GEA8** | Coaching is the Companion's, wherever it appears. Rooms report; they do not counsel. |
| **GEA9** | Advice is composed, never authored. |
| **GEA10** | Light expresses atmosphere and depth. It never encodes state, status, urgency, time, or performance. |
| **GEA11** | Surplus space becomes air and view, never additional interface. |
| **GEA12** | Identity marks are placed by the architecture, never applied for reinforcement. |
| **GEA13** | THA never scores, ranks, streaks, or rewards a household. |
| **GEA14** | Motion is caused by the household, or it does not happen. |
| **GEA15** | Silence is the default; speech is the exception that must be justified. |
| **GEA16** | Intelligence is experienced as a better answer, never as a visible mechanism. |
| **GEA17** | The presentation layer owns no fact. |
| **GEA18** | One owner per experience concern; the successor retires the predecessor in the same change. |
| **GEA19** | A room may not fork the house. |
| **GEA20** | Experience work flows Constitution → Architecture → Implementation, and never upward. |
| **GEA21** | The rooms observe. A room owns facts, state, workflow, controls and truthful reporting — never coaching, encouragement, congratulation, persuasion, behavioural interpretation or emotional judgement. |
| **GEA22** | The Companion understands. Interpretation, observation, coaching, encouragement, reassurance, explanation and recommendation have one owner, held to evidence, non-invention, silence over weak guidance, explanation on request, and household agency. |
| **GEA23** | The household decides. Decisions, priorities, values and the pace of change are permanently theirs, and nothing may take one of them. |

---

*The Healthy Apples is a home. A household should be able to live in it for a decade, learn it once, trust everything it says, and leave every visit with a little less to carry than they arrived with. Everything above is only the reasoning for that sentence.*
