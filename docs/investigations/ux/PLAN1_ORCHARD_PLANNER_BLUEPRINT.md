# PLAN1 — The Orchard Planner Blueprint

**Workstream:** `PLAN1_Orchard_Planner_Blueprint`
**Date:** 2026-07-16
**Rollback:** `rollback/PLAN1-orchard-planner-blueprint-20260716` → `7d1dd2ce`

> **Status.** This is an **investigation** — point-in-time analysis and history. It is **not** governing architecture, **not** a specification, **not** implementation. It **creates no rule and no second owner**. Everything binding in it is binding because another document already says it, and is cited to that document. Where this file appears to state a law, the citation is the law and this file is commentary.
>
> It was asked to define the Planner *as a place*, in principles, without designing screens. It does that by **composition and citation**, because — as § 3 demonstrates — the Planner's purpose, feeling, light, material, exposure, signature moment and anti-patterns are **already owned, completely, by seven governing documents**. The honest deliverable was never new law. It is the Planner assembled into one legible room, plus the **one thing genuinely unowned** (§ 6), plus what the live product is doing instead (§ 11).

---

## 0. THE MISSION, AND TWO DEVIATIONS REPORTED

The mission: *"Using the existing Experience architecture, EXP1–EXP5 and the North Star reference, define the Planner as the kitchen of the THA home."*

### 0.1 Filing deviation

The mission said *"store the investigation in `docs/investigations/`"*. A loose file at that root **violates governing architecture** (`REPOSITORY_CONVENTIONS.md:47`, `:74`; `docs/investigations/README.md:11`) and **fails** `.engineering/scripts/repo-structure-verify.sh:52-54`. Filed under `ux/` — the Experience workstream, where `HOME1`, `HOME2`, `NORTH2`, `EXPCOMP1`, `ORCH1` and `EXP5` live. Filename preserved. Same deviation, same resolution, as `TIME2` and `ORCH1`.

### 0.2 The noun deviation — the Planner is not the kitchen, and the canon says so five times

**This is the mission's central instruction and it cannot be carried out as worded.** The reasoning is § 2. In summary: the Planner is **already named**, the word *kitchen* is **already spent**, and its literal use is **already an anti-pattern by name**. But the *intent* behind the instruction is not merely legal — **it is already the canon's own analogy, in the exact words the mission reached for** (§ 2.3). So this blueprint delivers what the mission wanted and declines the word it used, and § 2 shows its working rather than quietly substituting a name.

No third deviation. No architecture modified. No screen designed. Nothing implemented.

---

## 1. HEADLINE

**The Planner is the room where the whole Orchard concept is on trial, and it is passing more of that trial than the canon's own investigation believes.**

Five findings, in order of how much they should change what happens next:

1. **The mission's noun is unavailable; the mission's instinct is canon.** The Planner is **"the family table"** (`THA_EXPERIENCE_BLUEPRINT.md:172`). *Kitchen* is the **whole house's** one-sentence feeling, the Companion's address, and THA's voice — not one of its rooms; and *drawing* a kitchen is the first noun in the theme-park anti-pattern (`:439`). But `EXP5` § 4.2 already gives the Planner the analogy the mission was reaching for, verbatim: ***"The kitchen table with the week laid out on it."*** The Planner is the kitchen **table**. The house is the kitchen. § 2.

2. **This blueprint creates no law, and that is the finding, not a shortfall.** Applying `NORTH2`'s gate — *"Is this rule already owned? If yes, the proposal is not an amendment — it is a restatement"* (`NORTH2:39`) — **every one of the mission's seven deliverables is already owned**, most of them three times over. § 3 maps all seven to their owners. `NORTH2`'s conclusion holds here without modification: the architecture ***"needs obeying"*** (`NORTH2:229`), not extending.

3. **The one genuinely unowned thing is the word the canon uses most about this room: *together*.** `THA_EXPERIENCE_BLUEPRINT.md:146` — *"where the week is laid out and decided **together**"*. **Nothing owns intra-household co-authorship.** Domain 14 owns the week's state; Domain 16 owns the household's people; **nothing owns the relationship between them.** In the platform: `planner_entries` records **no author** (`shared/schema.ts:438-458`) while `shopping_list` records one **and surfaces it by name** (`schema.ts:177`; `storage.ts:2814-2829`). **THA already knows how to say "Dad added this" — everywhere except the room whose entire purpose is deciding together.** The plan knows every mouth at the table and no hand that set it. § 6.

4. **`EXP5` § 7 is stale about the Planner in the household's favour, and it matters.** Verified against live code: the week grid is **not** *"a lattice of translucent cells floating on landscape"* — it is **one `Card` wrapping one ruled CSS grid, `shadow-none`** (`weekly-planner-page.tsx:2316-2322`; `card.tsx:12`; cell rule `:2403`). **The Planner is already the single solid ground plane the canon asks for.** Empty slots are already *"visibly bare table"* — no dashed holes exist anywhere (`:2636-2650`, a 12px `+` at 40% opacity). **The table is right. What is stacked on it is not** (§ 11). This inverts the work: the Planner does not need building into a table; it needs **clearing**.

5. **"The sun on today" — the Planner's one permitted Living Detail — is currently unimplementable, and the reason is not visual.** `weekly-planner-page.tsx` contains **zero `Date` constructions in 4,252 lines**; `planner_weeks` and `planner_days` have **no date column** (`schema.ts:420-436`). **The room built to hold the household's week does not know which day is today.** This independently confirms `TIME1`/`HOME3` from the Experience side and routes the Planner's signature moment to `planner_weeks.weekStartDate` (Domain 14, Rule HT7, declared and unbuilt). § 8.3.

> **The sentence this room is governed by**, and the reason it is the hard case: ***"If the concept ever fights the Planner, the concept loses."*** (`THA_EXPERIENCE_BLUEPRINT.md:444`; `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md:238`.) Every principle below is written to survive that sentence being enforced against it.

---

## 2. THE NOUN — WHY THE PLANNER IS NOT THE KITCHEN

The mission's instruction is refused on the word and granted on the meaning. Both halves matter, so both are shown.

### 2.1 The Planner is already named — three registers, one room

| Register | Name | Owner |
|---|---|---|
| The map of the house | **The family table** | `THA_EXPERIENCE_BLUEPRINT.md:172` |
| The digital-home reading | **The family's planning table** | `THA_EXPERIENCE_BLUEPRINT.md:146` |
| The design reading | **Planner — the family table** | `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md:230` |
| The lived account | **The Family Planning Table** | `THA_ORCHARD_LIVING_BOOK.md:61` |

Renaming it is forbidden twice, independently:

- **`THA_EXPERIENCE_ARCHITECTURE.md:211`** — *"**One name per concept, everywhere.** Each concept in THA has exactly one user-facing name, used identically in navigation, pages, messages, and conversation."*
- **`THA_EXPERIENCE_BLUEPRINT.md:132`** — *"as the house grows, new rooms are added — **the home is never renamed**."*

### 2.2 The word *kitchen* is already spent — four times, none of them a room

**No room in the map is the kitchen.** The word is load-bearing elsewhere:

| Use | Owner |
|---|---|
| **The whole product's one-sentence feeling** — *"THA feels like walking into a calm kitchen at the right moment"* | `THA_EXPERIENCE_LANGUAGE.md:36-38`; restated as the lived-in home at `:123` |
| **The Companion's address** — *"the knowledgeable friend at the **kitchen counter**"*, explicitly *"comfortable in every room"* | `THA_EXPERIENCE_BLUEPRINT.md:325` |
| **THA's voice** — *"THA speaks as one voice: a knowledgeable friend at the **kitchen table**"*; *"THA is a **kitchen-table product**"* | `THA_EXPERIENCE_ARCHITECTURE.md:208`, `:276` |
| **The theme park's first noun** — *"Literal rooms: **illustrated kitchens**, drawn furniture, wood-grain…"* | `THA_EXPERIENCE_BLUEPRINT.md:439` |

So *"the Planner is the kitchen"* would do four things at once: rename a named room; **shrink the whole product's governing feeling to one sixth of the house**; give the Companion — which lives in *every* room — a **fixed address inside one of them**; and reach for the exact noun the spatial anti-patterns name first.

`NORTH1` settled the last point already, having watched the North Star render make the metaphor literal (`NORTH1:99-102`):

> **There is no kitchen in the software.** There never was. The kitchen was always the metaphor *for* the feeling; the render made it literal in order to test the feeling, and the test succeeded. **The correct response to a successful test is to keep the result and discard the apparatus. Keep the light. Delete the room.**

**The North Star reference the mission cites is the two files at `attached_assets/North Star/` — named `kitchen concept.png` and `kitchen concept 1.png`.** They are almost certainly where the mission's noun came from, and `NORTH1` is the governed reading of exactly those images: *"the most valuable artefact the visual programme has produced, **and it must never be built**"* (`NORTH1:16`); *"**it is so persuasive that a team will copy the picture instead of extracting the principle**"* (`:18`). **The mission is the first live instance of the risk `NORTH1` predicted** — the render's noun arriving in a brief a day later, attached to a room. That is not a criticism of the brief; it is evidence `NORTH1` was right, and it is recorded here so the next reader does not have to rediscover it.

### 2.3 …and the canon already grants what the instruction was reaching for

The instinct behind *"the Planner is the kitchen"* is that **the Planner is where the household's food life is actually made** — the working heart, not the showroom. That reading is correct, and it is **already the canon's own analogy, in the mission's own words** (`EXP5:316-354`):

> **Room / place analogy.** ***The kitchen table with the week laid out on it*** *— chairs for everyone, the light good enough to work by.*

And the "working heart" half is owned too — the Planner is *"the densest working surface in the product"* (`EXP5`), and it is the room the concept must yield to (`BLUEPRINT:444`). Both readings of the mission are already law.

> **The resolution, and the only sentence in § 2 worth carrying forward:**
> **The house is the kitchen. The Planner is the table in it. The Companion is the friend at its counter. Nothing is drawn.**
>
> The mission asked for a room and named the building. The canon's answer is more precise than the question, and it was written first.

---

## 3. THE GATE — APPLIED TO ALL SEVEN DELIVERABLES

`NORTH2:39` imposes a prior question on any proposal:

> **Is this rule already owned?** If yes, the proposal is not an amendment — it is a **restatement**, and every governing document in this set forbids restatement in identical terms: *"restating a rule creates a second owner of it, which the architecture forbids"*.

Run against the mission's seven deliverables:

| # | Deliverable | Already owned? | Owner |
|---|---|---|---|
| 1 | The Planner philosophy | **Yes** | `BLUEPRINT:146`, `:172`; `OHDB:230-238`; `EXP5:316-354` |
| 2 | How the Planner should feel | **Yes** | `EXPLANG § 5.2:391-397`; `OHDB:232`; `OLB:61-70` |
| 3 | How households plan together | **⚠️ PARTLY — the seam is open** | Purpose owned (`BLUEPRINT:146`); **co-authorship owned by nobody** → § 6 |
| 4 | How the Companion participates | **Yes** | `BLUEPRINT § 13:323-335`; `TRANSLATION1:369-383`; `NOTICE_ENGINE § 6:172-183`; `OLB:67` |
| 5 | How the Orchard language appears | **Yes** | `BLUEPRINT:172` (E1), `:223`; `NORTH2:66-77` (silent at E1); `OHDB:236` |
| 6 | Moments of delight | **Yes — and the list is closed** | `EXP ARCH § 17.9`; `BLUEPRINT § 12` |
| 7 | Anti-patterns to avoid | **Yes** | `BLUEPRINT § 16:439-444`; `OHDB:238`; `EXPLANG § 7`; `OLB:69` |

**Six of seven are owned with no remainder.** So §§ 4–5 and 7–10 below are **composition** — the Planner assembled into one legible room from owners that each hold a fragment. § 6 is the one place this document reports a **gap**, and it reports it rather than filling it.

> **Why compose at all, if nothing is new?** For the reason `EXPBLUE1` was written: `THA_EXPERIENCE_BLUEPRINT.md:33`'s own § 1.3 warns the canon *"was becoming a library rather than a blueprint — the vision reconstructible only by reading five documents in the right order."* There are now seven, and **the Planner's identity is currently distributed across all seven with no single legible statement of it.** A reader asking *"what is the Planner?"* must read a map row, a design row, a rhythm, a chapter, a translation, an exposure scale and a refusal register — and hold them simultaneously. This document makes that one read. **It is a table of contents with reasoning, not a constitution.**

---

## 4. THE PLANNER PHILOSOPHY

Five principles. Each is a **composition of owned rules**, cited. None is new.

### P1 — The week is held, not filled in

The Planner's emotional purpose is *"The week is held"* (`EXP5:318`) — *"the feeling of a plan coming together, never of a spreadsheet demanding cells."* `OHDB:232` fixes the tone: *"In control, unhurried, decisive — **a table the family gathers around, not a form they fill in**."*

The distinction is not decorative. A form is **owed completion**; a table is **available**. A form with three of seven cells filled is 43% done and failing. **A table with three meals on it is a table with three meals on it.** Everything in §§ 9–10 follows from which of those two the Planner is.

### P2 — Function is sacred; the room yields, always

`BLUEPRINT:444` — *"On dense working surfaces place recedes to almost nothing — **and that recession is itself the design.** If the concept ever fights the Planner, the concept loses."*

`EXP5:348` states the same as a scope rule: *"the grid remains a grid (**function is sacred** — this is the domain where any metaphor that costs one click dies)."*

This is the Planner's constitutional clause, and it is **asymmetric on purpose**: the Planner may refuse the concept; the concept may never refuse the Planner.

### P3 — The table is one object

`BLUEPRINT:172` — ground posture: *"One solid table holding the week."* `OHDB:234` — *"One solid table holding the whole week — **one ground, never nested**."* `EXP4` § 5's structural finding is the reason: *"**Depth is believable exactly when it describes ONE room.** One ground, one light, one direction… The historical failure ('cards with drop shadows everywhere') was many imaginary rooms on one page."*

**Verified live: the Planner already obeys this** (§ 12.1). It is the one canonical posture the room currently gets right, and `EXP5` § 7 does not know it.

### P4 — The Planner is where the household's food life is made

The room the mission called the kitchen. `EXP5:322` — *"the densest working surface in the product"*; `OLB:63` — *"Now there is work, and **it is the good kind**."*

The consequence is a **budget**, not a mood: the Planner has less room for atmosphere than any other domain **because it is doing more**. E1 is not the Planner being denied a view — E1 is the view standing back for the work. `OLB:65`: *"the orchard has stepped back to being warmth and daylight through the room rather than a view, **because the work is the point and the work deserves the room**."*

### P5 — The completion is rest, not reward

`EXPLANG:397` — *"**Completion** — the week resolves to *'the plan is made'* — **a restful, finished state, not a prompt to do more**."*

The Planner's success condition is **the household leaving it**. `EXP ARCH § 19.2`'s success measure — *"the household ate better with less effort, **never time in the product**"* — binds this room hardest, because the Planner is the room most able to manufacture engagement out of incompleteness. See § 10.4.

---

## 5. HOW THE PLANNER SHOULD FEEL

**Owned in full** by `THA_EXPERIENCE_LANGUAGE.md § 5.2:391-397`, which already applies the canonical six-beat Experience Rhythm to this room. It is cited, not restated:

> - **Arrival** — the week opens as a calm, ordered surface, not a spreadsheet demanding entries.
> - **Orientation** — *"here is the week, here is what's planned, here are the gaps."*
> - **Confidence** — the plan reads as trustworthy; suggestions show they are grounded, not invented.
> - **Action** — one obvious move at a time (fill this slot, accept this suggestion), each with a sensible default.
> - **Understanding** — the plan visibly updates; the person sees exactly what changed and why.
> - **Completion** — the week resolves to *"the plan is made"* — a restful, finished state, not a prompt to do more.

`OLB:63-70` renders the same six beats as lived experience, and closes on the feeling to protect: *"**the feeling of a week gently gathered and under control, decided together, with time left over for the eating**."*

**The one thing this document adds is an observation about beat one, and it is a finding, not a rule.** § 5.2's *Arrival* beat says the week **opens**. Live, **five always-on strips stand between the room's edge and the first cell of the week** (§ 11.1). The Planner currently has no Arrival beat at all — it has a lobby. That is a conformance defect against an owned rule, reported in § 11, not a new principle here.

**The temperature floor** (`EXPLANG § 3A`, via `EXP5:352-354`): the two failure modes are **symmetric**, and the second is the one a conformance fix causes. Muddying the table with a wash is one failure. *"The E1 recession being read as 'remove the wash' and replaced with **clinical white**"* is the other — and *cold* is the one failure `EXPLANG § 3A.1` calls unrecoverable. **The Planner must get clearer without getting colder.** § 11.2 is where this bites live.

---

## 6. HOW HOUSEHOLDS NATURALLY PLAN TOGETHER

**This is the one section of this document reporting something the canon does not own.** It follows `PKR1` Risk R7's discipline: the finding is *recorded and routed*, not solved here.

### 6.1 The canon says *together* and never defines it

`BLUEPRINT:146` — *"where the week is laid out and decided **together**"*. `OHDB:232` — *"To lay out and decide the week **together**"*. `OLB:70` — *"decided **together**"*. `BLUEPRINT:21`, the THA Promise — *"more time to simply eat **together**"*.

Four uses, no owner. **No governing document states what it means for one artefact to be authored by several people**, and the strongest sentence in the canon for the shared plan — *"**The planner is one shared plan.** … The clock must sit at the same scope as the thing it dates"* — sits in a **rejected-options table inside a retired investigation** (`TIME1:284`), reachable only as an argument about *time* (Rule HT4, `REGISTER:283`).

**Terminology trap, recorded so it is not walked into:** in THA canon **"Shared Plan" already means something else** — the public token-shared plan at `/shared/:token`, a plan shared *outside* the household, and a named domain that *"consumes nothing and must acquire no clock"* (`THA_HOUSEHOLD_TIME_ARCHITECTURE.md:242`; *"a shared plan is a template, not a calendar"*). **The name for intra-household co-authorship is not available either.** Any future workstream here must name the concept before it can own it, and `EXP ARCH:211` binds that naming.

### 6.2 The platform models eaters exhaustively and planners not at all

This is the finding, stated as the asymmetry:

| | Who the plan is **FOR** | Who the plan is **BY** |
|---|---|---|
| Table | `household_eaters` (`schema.ts:1155-1168`) | `household_members` (`schema.ts:1142-1153`) |
| Depth | Per-person soft diets **and** *"hard restrictions — always enforced, never overridable"*; children without accounts (`userId = null`); per-week overrides (`:1196-1204`); per-entry one-off `GuestEater`s (`shared/household-eater.ts:1-16`) | A `role` column with a rank ladder (`server/lib/household.ts:6-10`) |
| Enforced? | Yes, throughout | **No** — `requireHouseholdRole` (`household.ts:41`) is a **placeholder wired into nothing**, by its own docstring: *"Phase 1A: placeholder — not wired into routes yet"* |

**The plan knows every mouth at the table and no hand that set it.**

### 6.3 The table is shared; the chairs are anonymous

Verified:

- **The week is genuinely household-shared** at storage and authorisation — every read and write is household-scoped (`storage.ts:1204-1274`), and the guard is uniform and role-free (`routes.ts:6030-6033`). `planner_weeks.userId` is **vestigial**: keyed per-user by a legacy unique constraint the code now works *around* (`storage.ts:1237-1242`), never read as identity.
- **`planner_entries` has no author** — no `addedBy`, no `createdBy`, **no timestamps at all** (`schema.ts:438-458`).
- **`shopping_list` has one, and surfaces it by name** — `addedByUserId` (`schema.ts:177`), written on every insert (`storage.ts:691`, `:744`), resolved to a display name and returned to the UI (`storage.ts:2814-2829`), with its own migration (`migrations/runner.ts:345`).

> **"Dad added this" is already built — for the list by the door, not for the family table.** The one shared-write surface in THA with no memory of who decided is the room whose entire canonical purpose is deciding together.

### 6.4 Three further findings, recorded not solved

1. **The shared table draws from private books.** `meals.userId` is `notNull` (`schema.ts:90`), `getMeals(userId)` filters by it (`storage.ts:469-471`), and every planner write re-asserts personal ownership: *"`if (!meal || (!meal.isSystemMeal && meal.userId !== req.user!.id))`"* (`routes.ts:6039-6042`, and at ten further call sites). **A member cannot put another member's own recipe on the family week.** Only system meals cross between people. This is the most concrete gap between `BLUEPRINT:146` and the platform, and it is invisible in every single-member household — which is every household in testing.
2. **"Together" is asynchronous and lossy.** No presence, no history, no conflict resolution, no realtime anywhere (no WebSocket/SSE in `server/` or `client/src`; `ws@^8.18.0` is a Neon transitive dep imported by no source file). `upsertPlannerEntry` is last-write-wins with no version or etag; invalidation is local-session-only (`weekly-planner-page.tsx:530`, `:804`, `:913`, `:1009`). **Two members planning on a Sunday evening silently clobber each other, and neither ever knows.** The Planner's only concurrency awareness in the platform is a defensive `23505` catch during week *creation* (`storage.ts:1240`).
3. **Even the canon's most lyrical account of the family table describes one person sitting at it.** `OLB:63-70` opens *"the kind a family does together around a table rather than the kind a person fills in alone"* and closes *"decided together"* — and every verb between them is second-person **singular**: *"steady under **your** hand"*, *"the choice stays **yours**"*. The Companion *"sits with **you**"*. This is not an error in the Living Book; it is the same gap, showing up in prose. **The canon has never had to imagine two people at the table, because nothing has ever asked it to.**

### 6.5 What this section deliberately does not do

It **does not propose** an attribution field, a presence model, a permissions design, a merge strategy, or a governing "Co-Authorship" principle. Every one of those is a **design decision with an owner elsewhere** — Domain 14 (Planner State) for facts, Domain 16 (Household Profiles) for people, the Experience Architecture for behaviour — and `ORCH1`, `HOME2` and `TIME2` all establish that the correct move on discovering an unowned seam is to **name it and route it**, not to fill it in an investigation. `PKR1` Risk R7 names the alternative as THA's most repeated failure: *something is found, written down beautifully, read once, and never maintained.*

**The seam is named: nothing owns co-authorship of the household's week.** It is routed in § 14.

---

## 7. HOW THE COMPANION QUIETLY PARTICIPATES

**Owned in full**, four times, and cited rather than restated:

- **Its place** — `THA_EXPERIENCE_BLUEPRINT.md § 13:323-335`: *"not a room… the person in the house"*; *"**One presence, one fixed chair**"*; *"It is **in** the rooms, never a room"*; *"**It arrives a beat after you** … That beat is its entire sign of life: no pulsing, no typing theatrics, no simulated mood, no face."*
- **Its translation into interface** — `THA_KEPT_ROOM_TRANSLATION.md:369-383`: *"**Invited, not intrusive; suggesting, never deciding; honest about its limits; silence a valid state.** It speaks only when there is something worth saying, offers once, and **puts back the attention it borrowed**."*
- **Its volume** — `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md § 6:172-183`, the Silence Rules: at most two notices per moment; *"**Honest absence.** No producer data → no notice → an empty set. The engine never pads, never invents a 'tip of the day'."*; `:138` — *"**Silence is a first-class outcome.** Most true facts should never be surfaced… the default disposition of a noticeable fact is *unspoken*."*
- **Its conduct at this table** — `THA_ORCHARD_LIVING_BOOK.md:64`: *"The Companion sits with you the way a knowledgeable friend sits at the table: it might suggest, it might notice you're short a night or repeating a meal, but **it never reaches over and decides for you**. The choice stays yours, every time."*

### 7.1 The Planner's Companion is not the Companion

**The finding, reported not fixed.** What the Planner has today is `PlannerIntelligenceStrip.tsx` (279 lines), mounted unconditionally at `weekly-planner-page.tsx:2017-2021`, with a **second** always-on intelligence panel directly beneath it (`AmbientIntelligence surfaceKey="planner"`, `:2027-2032`).

Read against `BLUEPRINT § 13`, the strip is the Companion's opposite on every clause:

| `BLUEPRINT § 13` says the Companion is… | The strip is… |
|---|---|
| Not a room; *in* the rooms | **Furniture in the room's ground plane** |
| One presence, one fixed chair, foreground | **A pinned band across the top of the table** |
| Arrives a beat after you | **Already there, before the week is** |
| Invited, not intrusive | **Unconditional — no guard, no invitation** |
| Silence a first-class outcome | **Cannot be silent** — § 7.2 |

And the governance position is already recorded: `NOTICE_ENGINE:201` names `/api/planner/weeks/:weekId/intelligence` among the *"**live, ungoverned notice channels**"* that *"**bypass mute/de-dupe/lifecycle governance and the Silence Rules**"*, classed as *"**convergence debt, not defects**"*, with `NTC-P2` (`:226`) as the named exit. `:250` states the fail test plainly: *"**Any second ambient-notice channel** … **stop.** That is a second Notice Engine wearing different clothes."*

Separately, `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md:97` names **Planner first** among the domains that *"must adopt the Companion Card framework rather than creating domain-specific conversation layouts."* **No Planner Companion Card exists.**

> **The Planner Companion is a room fixture wearing the Companion's name.** That is not a new rule — it is `NOTICE_ENGINE:201`'s convergence debt and `BLUEPRINT § 13`'s law, meeting in one component that predates both.

### 7.2 The strip announces a zero before you have cooked anything

**A live defect new to the canon**, and the sharpest single illustration of § 7.1.

`PlannerIntelligenceStrip.tsx:152-156` returns its bordered container **unconditionally**. On an empty week the query is disabled (`:110`), `pills` is empty (`:123-135`), and `plantCount` computes locally to `0` (`:120`). The result renders:

> **🍎 This Week · 🌱 0/30**

**A household that has planned nothing is greeted by a scoreboard reading zero.** Against owners:

- `NOTICE_ENGINE:177` — *"**Honest absence.** No producer data → no notice → an empty set."* A `0` computed locally from no data is not an honest absence; it is a **fabricated measurement**, and it is the identical class of defect `EXPCOMP2` found on Home (`plantCount ?? 0` → *"0 of 30 plants"* where the server deliberately returns `null` for *no validated data*). **The same coercion, in the same metric, in a second room.**
- `TRANSLATION1:367` — *"**Never dashboard furniture** in place of the household — no scores as trophies, streaks, notification piles, guilt, or 'you haven't…'"*
- `EXP ARCH:213` — *"**Encouraging, never judgmental** … Progress is framed by what the household did, not what it failed to do."*
- `OLB:91` — *"the household made to feel it is failing at its own kitchen."*

This is not a styling problem. **It is the room telling a household it is at zero, on the household's first visit, using a number nobody measured.**

### 7.3 The unasked question, recorded

Every canonical rule governs the Companion's relationship with **a person**: *arrives a beat after **you***; *keeps **you** company*; *the choice stays **yours***. **No governing document says what the friend at the counter does when two people are at the table.**

This document does not answer it — it is § 6's gap wearing the Companion's clothes, and it resolves the same way. But the canon's own disposition suggests the answer is *less than one might assume*: `NOTICE_ENGINE:138` (*"silence is a first-class outcome"*) and `OLB:199` (*"if tomorrow is thought-through, it lets that be quietly true and says nothing"*) both point the same direction. **A friend at a table where two people are deciding says less, not more.** Recorded as an observation with citations, not adopted as a rule.

---

## 8. HOW THE ORCHARD LANGUAGE APPEARS

### 8.1 E1 — light only, and the recession *is* the design

`BLUEPRINT:172` maps the Planner to **E1**. `:223` defines it: *"**E1 · Light only** — the orchard as illumination and warmth, not image… **You know the orchard is outside because the room is bright — you don't see it while working.**"* `OHDB:236` — *"A working room; the orchard is warmth and daylight, not image."*

The law it serves (`BLUEPRINT § 6.2`): *"**Orchard exposure is inversely proportional to functional density.** The more a surface asks the eye to work, the further the orchard recedes… **The orchard is never behind working text.**"*

Riders that bind this room (`EXP5:243-266`, graduated): exposure is *"a per-domain constant, set once by design… never a per-surface or per-component choice, and never adjusted for taste mid-feature"*; *"**Empty states may open the window one level, never two**"*; *"**The orchard never carries text.**"*; and the one that governs every future Planner review — *"**Emotional surfaces may spend more window; functional surfaces may not.** A form never earns a view upgrade because it looked plain."*

### 8.2 The aperture does not bind here — recorded so it is not misapplied

`NORTH2` adopted exactly one of `NORTH1`'s five proposals — the aperture — and **narrowed it to E2–E3 with an explicit silence at E1** (`NORTH2:66-77`):

> ***(At E1 and E0 there is no image and this rule is silent — the orchard is light alone, and its recession is the design.)***

with the reasoning (`:68`): *"A rule saying 'the orchard enters through apertures' would, read flatly, **require an aperture in rooms that must not have one**… **The rule governs the image's boundary, never its existence.**"*

**The Planner is E1. The Planner therefore has no aperture, and must not acquire one.** Recorded because the aperture is the newest and most quotable idea in the canon, and the Planner is exactly the room it would be wrongly imported into.

`NORTH2 § 3.4` is worth naming here too, because **the Planner is the disproof it used**: `NORTH1`'s *"the room always remains the primary experience"* was **refused as law** on the grounds that *"**In the Planner, the Analyser, and every dense surface, the work is the primary experience and the room is deliberately almost gone.** Home is E3 — the exception the scale exists to bound — not the rule the house follows."*

### 8.3 "The sun on today" — the one Living Detail, and why it cannot be built yet

`BLUEPRINT:172` grants the Planner exactly one Living Detail: **The sun on today.** `OHDB:237` — *"**Signature moment.** *The sun on today* — a half-step of warmth on the current day, **never a colour or a border**."* `EXP5:758` — *"A half-step of warmth/brightness; never a colour, never a border."*

**Why it is legal at all**, given `NORTH2` rejected time-varying atmosphere outright: it is *"the **calendar's own truth** rendered as light"* (`EXP5:342`), not the house's light changing with the hour. `OHDB § 11` — *"**Time shows through the household's life, never through the house's weather.**"* The one-morning law is untouched: **the sun does not move; today is simply where it already falls.**

**Verified live: it is currently unimplementable.**

- `weekly-planner-page.tsx` — **4,252 lines, zero `Date` constructions**. No `toDateString`, no `date-fns`, no `dayjs`. The page cannot know what day it is.
- `schema.ts:420-428` (`planner_weeks`: `id`, `userId`, `householdId`, `weekNumber`, `weekName`) and `:430-436` (`planner_days`: `id`, `weekId`, `dayOfWeek`). **No date column in either.**
- The only column distinction that exists is **selection, not time**: `isSelected ? "bg-primary/10" : "hover:bg-accent/30"` (`:2326`, `:2331`) — *"a teal click-state, not warmth, and it follows the mouse, not the sun."*

> **The room built to hold the household's week does not know which day is today.** This is the Experience-side confirmation of `TIME1` and `HOME3`, arrived at independently: the blocker on the Planner's signature moment is **not visual design** — it is `planner_weeks.weekStartDate`, Domain 14, Rule HT7, **declared and not built** (`REGISTER:255-265`).
>
> **The Planner's one permitted moment of life is waiting on a column.** Any attempt to deliver it before that column exists would have to invent a today — which, from 2026-07-16, is a violation of `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` whether or not the module exists yet (`README.md:29`).

---

## 9. MOMENTS OF DELIGHT

**The list of qualifying moments is closed, and the Planner does not get to extend it.** `EXP ARCH § 17.9` owns which moments qualify for ceremony — `ORCH1` established this and it binds identically here: a household's **first genuine outcome**; the **completion of a journey that had real effort in it** — *not the completion of a step*; an **honest milestone the household would themselves recognise**. Everything else *"resolves quietly and without ceremony."*

Applying that owner to this room — application, not invention:

### 9.1 The Planner has exactly one qualifying moment: *the plan is made*

`EXPLANG:397` — *"the week resolves to **'the plan is made'** — a restful, finished state, not a prompt to do more."* This qualifies under § 17.9 as *the completion of a journey that had real effort in it*: planning a household's week **is** real effort, and the household would recognise the milestone unprompted.

**Its correct register is rest, not celebration.** `OLB:70` — *"the feeling of a week gently gathered and under control, decided together, **with time left over for the eating**."* The delight is **the absence of remaining work**, felt. A confetti burst here would convert the one honest moment into the ceremony `EXP ARCH § 17`'s *"Not ceremony"* clause forbids.

### 9.2 The quiet delight: the table gives you more room

`OLB:67` — *"when there is more to consider, **the table gives you more room, it never crowds the week to fit**."* This is delight as **care perceived**, and it is the premium test's exact shape (`EXP ARCH:372`): *"if the household would not feel the care, it is decoration; if they would feel its absence, it is craft."* A household would feel the absence of this immediately — as a week compressed to fit a viewport. **They would never name it. That is the point.**

### 9.3 The delight *not* to build, recorded with its refusal

**The streak, the score, the "you planned 7/7!" badge.** Refused, with owners: `TRANSLATION1:367` (*"no scores as trophies, streaks, notification piles, guilt"*); `EXP ARCH:213` (*"no shame-flavoured streak language"*); `EXP ARCH § 19.2` (*"the household ate better with less effort, never time in the product"*).

Recorded because `WX3:121-129` already lists **"Family Meal Streaks"** as a documented-but-unbuilt Planner suggestion. **It is documented, unbuilt, and forbidden** — and without a recorded refusal, a future workstream finds it in a suggestions list and builds it. This is the discipline `BLUEPRINT § 12.2`, `EXP5 § 5.3` and `NORTH2 § 6` apply to declined Living Details, applied here to a declined delight.

### 9.4 The moment the Planner must never claim

**A planned meal is not an eaten meal.** `ORCH1`'s headline — *THA is a product about eating well together, and it can observe everything except eating* — lands directly on this room, and it has a live instance: `CookbookMealIntelligenceStrip.tsx:93`, `:183-186` renders `plannerAppearanceCount` as **"Cooked N times"**. **A household that planned a meal six times and cooked none is told "Cooked 6 times".**

The Planner is the **source of that number**. Any Planner delight built on "what you cooked" would be built on intention data wearing an outcome's name — the fabrication `EXP ARCH`'s honesty principle and `BLUEPRINT § 12.1 r2` (*"Data-borne or dead"*) both forbid. **The Planner may celebrate a plan. It may never celebrate a meal.** The Diary (Domain 21) owns outcomes; `ORCH1` § "Next action" routes the wire.

---

## 10. ANTI-PATTERNS TO AVOID

Every one is **already forbidden by a rule with an owner**. Listed because the Planner is the room each is most likely to enter, with the entry route named.

### 10.1 The drawn table — the theme park

`BLUEPRINT:439` — *"**The theme park.** Literal rooms: illustrated kitchens, drawn furniture, wood-grain, page-turns, fridge magnets, jar clip-art, photo-corner frames. **The 'family table' is a feeling produced by material, light, and composition — the moment it becomes a picture of a table, the place has become a costume.**"* `BLUEPRINT:167` — *"The analogies are **feelings to design toward, never pictures to draw**."*

**Entry route: this mission, and the two PNGs it cites.** § 2.2. Also `EXP5:352` — *"A drawn table edge or wood texture (forbidden); 'place settings' iconography."*

### 10.2 Metaphor taxing function

`BLUEPRINT:444`; `OHDB:238` — *"metaphor taxing the work — **if the concept ever fights the Planner, the concept loses**."*

**Entry route: a well-meaning Orchard conformance pass.** `NORTH1 § 5.5` independently rediscovered the mechanism by watching the render's own Cookbook plate collapse: *"**it shows the render's grammar does not survive contact with functional density**"* — the exposure scale's thesis, *"independently rediscovered by failure."* The Planner is denser than that Cookbook.

### 10.3 The view upgrade because the week looked plain

`OHDB:238` — *"**A view upgrade because the week looked plain**; the orchard behind the grid."* `EXP5:264` — *"**Emotional surfaces may spend more window; functional surfaces may not.** A form never earns a view upgrade because it looked plain."*

**Entry route: an empty week.** An empty Planner *does* look plain, and the rider is precise about the ceiling: *"Empty states may open the window one level, never two"* — E1→E2 at most, and only when genuinely empty.

### 10.4 The table turned into a form

`OLB:69` — *"**Never here** — the table turned into a form to be completed; the plan crowded until it feels like a chore."* `OHDB:232` — *"a table the family gathers around, **not a form they fill in**."*

**Entry route: progress.** *"3 of 7 days planned"*, a completion ring, an empty-slot count. Each converts P1's available table into an owed form, and each is a **score** under `TRANSLATION1:367`. **The live `0/30` (§ 7.2) is this anti-pattern already in the room.**

### 10.5 Clinical white — the opposite failure

`EXP5:352-354` — *"the E1 recession being read as 'remove the wash' and **replaced with clinical white** (the room must stay warm; § 3A.1 *cold* is the opposite failure)."* `EXPLANG § 3A.4` — *"**Calm must never become lifeless.**"* `NORTH1:79-80` — *"**One cold plane breaks the room, and it breaks it more than any other single error, because coldness is the one failure the canon calls unrecoverable.**"*

**Entry route: fixing § 11.2.** This is the anti-pattern a correct diagnosis causes. The Planner's opacity crutch **is** a defect; removing it without replacing the warmth in the values is a **worse** one. `EXPCOMP2` already found the values: `--card: 0 0% 100%` warmed only by an 18% cream bleed.

### 10.6 The Companion deciding

`OLB:67` — *"it **never reaches over and decides for you**. The choice stays yours, every time."* `TRANSLATION1:371-383` — *"suggesting, never deciding."* `NOTICE_ENGINE:135` — *"**No notice executes anything.** Accepting an opportunity transitions a delivery record; **it does not touch a planner entry**… Acting requires a separate, confirmed intent."*

**Entry route: auto-fill.** A one-tap "plan my week" that writes seven entries is the Planner's most obviously useful feature and the most direct violation of this room's one absolute rule. **It is not forbidden to suggest a week. It is forbidden to have decided one.**

### 10.7 A home does not greet you with signage

`EXP5:863-868` — instructional banners are *"work stapled to arrival"*; *"**A home does not greet you with signage.**"*

**Entry route: already taken, twice.** § 11.1.

### 10.8 The second Notice Engine

`NOTICE_ENGINE:250` — *"**Any second ambient-notice channel** — a route, panel, or prompt block that surfaces unprompted facts without passing OD1 governance and the Silence Rules — **stop.**"*

**Entry route: already taken.** § 7.1. The Planner currently runs **two** stacked, both ungoverned.

---

## 11. WHAT THE LIVE PLANNER IS DOING INSTEAD — REPORTED, NOT FIXED

Verified against live code at `7d1dd2ce`. **Nothing here was changed.** Each is a **conformance defect against an owned rule** — `NORTH2:220-229`'s category: *"not gaps in the architecture; they are the product disagreeing with it… **None of these requires an amendment. All of them require work.**"*

### 11.1 The Planner has no Arrival beat — it has a lobby

**Five always-on strips stand between the room and the first cell of the week** (desktop, DOM order in `weekly-planner-page.tsx`):

| | Element | Line |
|---|---|---|
| 1 | `WorkspaceHeader` | `:1767` |
| 2 | `FirstVisitHint` — dismissible how-to strip | `:1925-1928` |
| 3 | `Tabs` — week switcher | `:1931` |
| 4 | "This week's household diets" toggle row (+ a `Card` when open, `:1954`) | `:1936` |
| 5 | `PlannerIntelligenceStrip` — **always renders** | `:2017` |
| 6 | `AmbientIntelligence` "Gaps in your week" — **always renders** | `:2027` |

Plus a **second** `FirstVisitHint` on mobile (`:2039-2043`, *"Tip: Long press a meal for quick actions…"*).

Against `EXPLANG:392` (*"the week **opens** as a calm, ordered surface"*) and `EXP5:865` (*"A home does not greet you with signage"*). The file is **4,252 lines**. `WX13:47-52` already recorded the same shape in 2026 — *"the four-card intelligence section… consumed roughly one third of the viewport before the planner grid appeared"* — and **fixed it by compressing the panel rather than removing it**; the strip it created is item 5, and item 6 arrived beside it.

### 11.2 The wash is real, global, and not where `EXP5` said it was

- `client/src/components/layout/orchard-backdrop.tsx:18` — full-bleed `/orchard-bg.webp`, **`opacity: 0.90`, hardcoded**, `fixed inset-0`, mounted once in the protected shell (`App.tsx:210`) — **every room, including this one**. Mounted redundantly twice more (`orchard-shell.tsx:6`, `home-page.tsx:45`).
- `App.tsx:219` — `<main className="… bg-background/25 …">`, so the orchard reads through at **~75%**.
- **The actual mechanism**: `client/src/components/ui/card.tsx:12` — `bg-card/82 backdrop-blur-md`. The week grid is wrapped in a bare `<Card>` (`:2316`), so **18% of the orchard image bleeds up through the grid cells and behind the meal text.**

This is `BLUEPRINT § 6.2`'s *"the orchard is never behind working text"*, live, in the room the rule was written for. It is also `EXPCOMP2`'s opacity-crutch finding, in a second room.

**Dead code found in passing:** `--orchard-opacity: 0.72` (light, `index.css:73`) and `0.18` (dark, `:155`) are **defined and never consumed** — the backdrop hardcodes `0.90`. **The intended dark-mode dimming never fires; dark mode gets the same 90% orchard as light.** Only `--orchard-sidebar-opacity` is read (`nav-bar.tsx:613`).

### 11.3 The strip fabricates a zero

§ 7.2. `PlannerIntelligenceStrip.tsx:152-156`, `:120`. **Same defect class as `EXPCOMP2`'s Home finding, same metric, second room.**

### 11.4 Today is unknowable

§ 8.3. Zero `Date` in 4,252 lines; no date column in `planner_weeks` or `planner_days`.

---

## 12. CORRECTIONS TO THE CANON

`EXP5` § 7 is **history, not law** (`README.md:80` — its concepts graduated to the Experience Blueprint; EXP5 remains point-in-time). Its Planner findings are nonetheless read as current by anyone arriving at this room, so two are corrected and one path is dead. **This is the good kind of correction: the product is better than the record says.**

### 12.1 The grid is not a lattice — it is already the ground plane

`EXP5:336-340` describes the target as *"The week grid becomes ONE object — the table — a single solid ground plane holding the grid, **rather than a lattice of translucent cells floating on landscape**."*

**Verified: the "rather than" clause is false. The Planner already is the table.**

- `weekly-planner-page.tsx:2316-2322` — **one `<Card>`** wrapping **one CSS grid** (`gridTemplateColumns: "var(--ws-col-label) repeat(7, 1fr)"`).
- `card.tsx:12` — **`shadow-none`**. No floating.
- Cell className `:2403` — `border-l` + `border-b` only, **suppressed on the last row**: classic table ruling, not per-cell borders.

**The Planner already obeys P3 (§ 4), the hardest posture in the canon, and no document knows it.** The remaining defect is the 18% bleed *through* that ground (§ 11.2) — a **material** problem, not a **structural** one. This substantially reduces the Planner's distance from the map and re-aims the work from *build a table* to **clear the table**.

### 12.2 Empty slots are already bare table — no dashed holes exist

`EXP5:340` asks for *"empty slots… visibly bare table — an honest, calm 'place not yet set', not a hole."*

**Verified: already true.** `grep "dashed"` across `weekly-planner-page.tsx` and `PlannerDragDrop.tsx` returns **nothing**. An unfilled slot is the plain ruled cell plus a **12px `+` at 40% muted-foreground**, bottom-left, no border, no prompt text (`:2636-2650`). The only cell decoration is transient drag feedback (`PlannerDragDrop.tsx:139`).

*(One honest nuance: the `+` renders **unconditionally**, so filled cells carry it too — a persistent affordance rather than an empty-state prompt. Recorded as an observation, not graded.)*

### 12.3 A dead path

`EXP5 § 7.4` and `NORTH1 § 8.1` cite **`client/src/components/orchard-backdrop.tsx`**. **That file does not exist.** It is `client/src/components/layout/orchard-backdrop.tsx`. Anyone verifying either claim finds nothing and may conclude the defect was fixed. **It was not** (§ 11.2).

*(`NORTH1 § 8.1`'s other error — asserting a parallax that does not exist — was already corrected by `EXPCOMP2`. This is the second stale citation in the same finding.)*

---

## 13. WHAT THIS DOCUMENT DID NOT DO

Stated explicitly, because the mission's constraints were explicit:

- **No screens designed.** No layout, no wireframe, no component, no ASCII sketch, no plate. § 4–§ 10 are principles and citations only.
- **Nothing implemented.** No code, no schema, no migration, no route, no token, no colour, no value of any kind.
- **No architecture modified.** All seven governing Experience documents are **byte-untouched**. `docs/architecture/README.md` is untouched — this is an investigation and is not indexed as governing (`README.md:4`; `REPOSITORY_CONVENTIONS.md:47`).
- **No rule created.** Applying `NORTH2`'s gate to my own output: every principle in § 4–§ 10 traces to an owner. **If any statement here is found to duplicate a rule owned elsewhere, the statement here is the defect** (`BLUEPRINT § 18`'s yield clause, applied to this file).
- **The § 6 gap not filled.** Named and routed, per `PKR1` R7.
- **Nothing renamed.** The Planner remains the family table (§ 2).
- **The § 11 defects not fixed.** Reported with file:line, as `EXPCOMP2`, `TIME2` and `HOME3` did.

**Gates re-run:** `.engineering/scripts/repo-structure-verify.sh` — `docs/investigations/ has no loose files` **PASS**. *(A pre-existing, unrelated FAIL persists on `.glibcheck.txt` / `.libdirs_uxhome.txt` at root — untracked before this session, noted also by `ORCH1`.)*

---

## 14. RECOMMENDED FOLLOW-ON WORK

By value, ordered by dependency. **The first three are blocked by nothing and are deletions or one-liners.**

1. **Delete the fabricated zero** (`PlannerIntelligenceStrip.tsx:152-156`). Guard the container on real data; never compute `plantCount` locally. **One guard.** It closes a live instance of the exact defect `EXPCOMP2` found on Home — *the same coercion, same metric, second room* — which suggests the honest version is **one workstream fixing both**, since a third instance is likelier than not. § 7.2.
2. **Clear the lobby** (§ 11.1). The Planner's Arrival beat is owned (`EXPLANG:392`) and unbuilt; five strips stand where the week should be. Start with the two `FirstVisitHint` banners — *"a home does not greet you with signage"* — which are pure deletions. **Note the trap `WX13` fell into:** it fixed this by *compressing* the panel, and the compressed panel is now item 5. **The move is removal, not compression.**
3. **Retire the strip into the Companion** — `NTC-P2`, already chartered (`NOTICE_ENGINE:226`). The Planner runs **two** ungoverned notice channels stacked (§ 7.1); `COMPANION_CARD:97` names Planner **first** among domains that must adopt the card framework, and no Planner card exists. This is convergence debt with a named exit, not new design.
4. **Name and route co-authorship** (§ 6) — **the most valuable item here and the only one that is not a fix.** Nothing owns what *together* means. Recommended shape: an investigation (`PLAN2`?) that (a) names the concept — *"Shared Plan" is taken* (§ 6.1); (b) tests `shopping_list`'s `addedByUserId` as the existing precedent for attribution (`schema.ts:177`; `storage.ts:2814-2829`); (c) decides whether `meals.userId` (§ 6.4.1) is a defect or a design — **a member cannot put another member's recipe on the family week**, and that gap is invisible in every single-member household; (d) records last-write-wins (§ 6.4.2) as accepted or not. **Do not skip (a)**: `EXP ARCH:211` binds it, and the obvious name is already spent.
5. **`TIME4` unblocks the Planner's one moment of life** (§ 8.3). "The sun on today" waits on `planner_weeks.weekStartDate` — Domain 14, Rule HT7, declared and unbuilt. Nothing visual is on this critical path. **The Planner should be recorded as a consumer in `TIME2`'s matrix**, which it is not: it is the room the anchor exists for, and it is the one surface whose *entire* Living Detail is a Household Time consumer.
6. **The warmth, last and only with (2) done** (§ 11.2, § 10.5). The 18% orchard bleed through the grid violates *"the orchard is never behind working text"*. **This is the item most likely to cause the opposite defect**: removing the crutch without replacing warmth in the values yields clinical white — *the one failure the canon calls unrecoverable*. It is a **UIA § 4 amendment** question (`--card: 0 0% 100%`), not a Planner question, and it should not be attempted as a Planner fix. Cheap and safe in the meantime: **`--orchard-opacity` is defined and never consumed** (`index.css:73`, `:155`) — dark mode gets a 90% orchard it was designed not to have.

**Explicitly not recommended:** any Planner visual prototype. `EXP5:951` fixed the sequence — *"EXP5-P2 Cookbook and EXP5-P3 Planner as separate follow-ons, **each a fresh decision** informed by P1's photographs"* — and **P1 (Home) has not run**, so the reference photograph every other room is calibrated against does not exist. Building the hard case first inverts the order the canon set. `EXP5:925`: *"**If the concept survives the Planner, it survives everywhere**"* — which is a reason to go there last, not first.

---

## 15. THE ONE THING TO REMEMBER

> **The Planner is the family table in the house that is the kitchen. It is the densest working surface in the product, and therefore the room where the concept has the least to say and the most to prove. The orchard is here as light and never as a view. The Companion sits at it and never reaches across it. The week is held, not filled in; the plan is made, and then the household leaves — which is the whole point of the room, and the only delight it is permitted to celebrate.**
>
> **All of that was already true and already written. The work is not to define this room. It is to clear the five strips off the table, stop telling households they are at zero, and let the week be the first thing they see.**
