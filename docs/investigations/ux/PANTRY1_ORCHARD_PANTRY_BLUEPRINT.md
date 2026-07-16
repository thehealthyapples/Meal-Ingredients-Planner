# PANTRY1 — The Orchard Pantry Blueprint

**Workstream:** `PANTRY1_Orchard_Pantry_Blueprint`
**Date:** 2026-07-16
**Rollback:** `rollback/PANTRY1-orchard-pantry-blueprint-20260716` → `7d1dd2ce`

> **Status.** This is an **investigation** — point-in-time analysis and history. It is **not** governing architecture, **not** a specification, **not** implementation. It **creates no rule and no second owner**. Everything binding in it is binding because another document already says it, and is cited to that document. Where this file appears to state a law, the citation is the law and this file is commentary.
>
> It was asked to define the Pantry *as the household larder*, in principles, without designing screens. It does that by **composition and citation** (§ 3–§ 4, § 7–§ 10), because the Pantry's philosophy, feeling, exposure, light, material, signature moment and anti-patterns are **already owned completely** by seven governing documents. The honest deliverable was never new law. It is the Pantry assembled into one legible room, plus **the two deliverables where the canon describes a room the platform has not built** (§ 5, § 6), plus what the live room is doing instead (§ 11).

---

## 0. THE MISSION, AND THE DEVIATIONS REPORTED

The mission: *"Using the existing Experience architecture and Orchard Blueprint, define the Pantry as the household larder."*

### 0.1 Filing deviation

The mission said *"store the investigation under `docs/investigations/`"*. A loose file at that root **violates governing architecture** (`REPOSITORY_CONVENTIONS.md:47` — `docs/investigations/` explicitly excludes *"loose files at its root"*; `docs/investigations/README.md:11` — *"Every document is filed under a **workstream** folder — the root itself holds only this index"*) and **fails** `.engineering/scripts/repo-structure-verify.sh`. Filed under **`ux/`** — the Experience workstream, where `HOME1`, `HOME2`, `NORTH2`, `EXPCOMP1`, `ORCH1`, `EXP5` and its direct siblings `PLAN1` and `COOK1` live. Filename preserved.

*(Unlike `COOK1`, this decision had no competing candidate: **there is no `pantry/` workstream folder.** The eleven that exist are `backups`, `benchmarking`, `cookbook`, `development_world`, `engineering`, `governance`, `intelligence`, `knowledge`, `planner`, `platform`, `ux`.)*

### 0.2 A noun deviation, and it is the mission's only inaccuracy — in the household's favour

The mission says *"the household **larder**."* The canon does not use that word. Its sentence is *"**The Pantry is the household pantry** — what is in the house right now, honestly told"* (`BLUEPRINT:148`), and the room's own chapter is *The Pantry Shelves* (`OLB:83`).

**This is a distinction worth one paragraph, because "larder" quietly imports the wrong model.** A larder is a *store of provisions* — a thing measured by what it holds and how much. The canon's pantry is not a store; it is **a truthful account**: *"You open the cupboard **to see, honestly, what is in the house right now**"* (`OLB:85`). The noun of the room is not the food. It is the **honesty**. `OLB:85` closes the point in the canon's own words: *"its whole grace is **honesty without guilt**."*

**I have kept the canon's noun.** The mission is not wrong about the room's subject; it is looser than the canon about the room's *virtue*, and this room's virtue is the only thing it has.

> **`PLAN1` refused its mission's noun because the canon contradicted it. `COOK1` kept its mission's noun because it *was* the canon's, and found the platform ignoring it. `PANTRY1` narrows its mission's noun — and then finds the platform violating the exact virtue the narrowing recovers.**

No other deviation. No architecture modified. No screen designed. Nothing implemented.

---

## 1. HEADLINE

**The Pantry is the one room in the house whose entire purpose is to tell the household the truth about their own home — and it is the only room that invents its contents and presents them as fact.**

Seven findings, ordered by how much they should change what happens next:

1. **A new household's pantry contains roughly 141 items they never put there, and nothing tells them so.** `seedDefaultFoodPantryItems` (`storage.ts:2224-2374`, list inline at `:2232-2353`, ~122 foods) and `seedDefaultHouseholdItems` (`:2187-2222`, list at `:2195-2202`, 19 items) assert Pink Lady apples, passion fruit, gooseberries, garam masala, redcurrants and bleach into an empty pantry. **The truth is that a hardcoded array said so.** Against the room's own sentence — *"Just the plain truth of the shelves, told kindly"* (`OLB:85`) — and against `ARCHITECTURE_PRINCIPLES.md:74`, **Principle 6, *"No fabricated knowledge — honest gaps over invented facts"*, whose rationale is three words long: *"Trust is the product… This is non-negotiable"* (`:83`).**

2. **THA computes the honest signal, ships it to the browser, and throws it away.** `isDefault` is on the row (`schema.ts:1018`), set `true` by both seeds (`storage.ts:2214`, `:2365`), and **declared on the client's item type at `pantry-page.tsx:58` — where it is referenced once and never used again.** No badge, no caveat, no filter. **This is not a missing capability. The truth is already in the browser, and the room declines to say it.**

3. **A `GET` writes it.** `routes.ts:7788-7799` — opening the Pantry page performs the entire seed as a side effect of a read. **The household takes no action, gives no consent, and is asked nothing.** The same seed fires from the shopping list, which reads `/api/pantry` (`shopping-list-page.tsx:1588`) — so a household that never opened the Pantry is told, on their list, that Milk, Eggs, Butter and Olive oil are *staples they already have* (`:1763-1766`).

4. **The room's one permitted sign of life is sourced from a fact that does not exist anywhere in the platform.** `BLUEPRINT:314` — *"**Freshness, honestly told** | Pantry | **Item freshness data** | *The food in here is alive*"*. **There is no freshness data.** No `expiry`, `bestBefore`, `useBy`, `openedAt`, `purchasedAt` on `user_pantry_items` (`schema.ts:1010-1025`, verified). THA knows exactly **one bit** about your house per food: does a row exist. § 5.2.

5. **The canon names an action the platform does not have — in the room's own rhythm.** `EXPLANG:427` — *"**Action** — one easy motion at a time (**mark used**, add an item)"*. **There is no "mark used."** No `consumed`, `usedAt`, `depleted`, `ranOut` anywhere in the pantry domain. `savingsEvents`' `'pantry_used'` type is **declared at `schema.ts:1351` with no producer — always zero** (`storage.ts:3722`). *The Pantry can be filled and never emptied.* § 5.3.

6. **The Pantry passes the test the Cookbook failed, and it was passed deliberately.** `user_pantry_items.householdId` exists (`schema.ts:1013`) and **every read and write scopes to it** (`storage.ts:2134`, `:2145`, `:2164`, `:2174`). The migration comment proves intent (`runner.ts:820-822`): *"This constraint was UNIQUE(user_id, ingredient_key). It only prevented a single user from adding the same key twice — **not two household members**."* **`COOK1 § 1.1` found `meals` has no `householdId` at all. The Pantry is genuinely one shared larder for the family.** § 12.1.

7. **The room is telling four other rooms' stories, and the truncation `COOK1` reported lives here.** `/api/pantry/stories` (`routes.ts:11453`) and `PantryKnowledgeHub.tsx:828`'s `.slice(0, 2)` are the Pantry's code, in the Pantry's file. **`COOK1 § 12.5` found the Cookbook's stories filed in this room; from this side the finding is that the Pantry is carrying a load that was never its own** — and dropping three-fifths of it. § 6.5.

> **The sentence this room is governed by:** ***"You open the cupboard to see, honestly, what is in the house right now. Not what you should have… Just the plain truth of the shelves, told kindly… its whole grace is honesty without guilt"*** (`OLB:85`). Every principle below is written to survive that sentence being enforced against the platform — which, today, it does not survive, in the one way that matters most: **the shelves are not the household's.**

---

## 2. THE GATE — APPLIED TO ALL EIGHT DELIVERABLES

`NORTH2:39` imposes a prior question on any proposal:

> **Is this rule already owned?** If yes, the proposal is not an amendment — it is a **restatement**, and every governing document in this set forbids restatement in identical terms: *"restating a rule creates a second owner of it, which the architecture forbids"* (Blueprint § 18; OHDB § 16.3; TRANSLATION1 § 7.3; Experience Principle 6).

Run against the mission's eight deliverables:

| # | Deliverable | Already owned? | Owner |
|---|---|---|---|
| 1 | The Pantry philosophy | **Yes** | `BLUEPRINT:148`, `:175`; `OHDB § 13.4:250-256`; `OLB:83-90`; `EXP5` |
| 2 | How the Pantry should feel | **Yes — completely, and it names the room's live defects** | `EXPLANG § 5.6:423-429`; `OHDB:252`; `OLB:85-90` |
| 3 | How food is understood rather than stored | **⚠️ Owned as a *principle*; the platform stores and does not understand** | `ARCH_PRINCIPLES:44`, `:74`; `BLUEPRINT:314` → § 5 |
| 4 | How household knowledge naturally grows | **Yes — owned twice, and the two owners disagree about this room** | `PKCA § 1`, `:139`; EL1/EL2 → § 6 |
| 5 | How seasonal living appears | **Yes — stated four times, and the canon's answer is exact** | `OLB:151`, `:155`, `:177`, `:188`; `OHDB § 11:189-193`; `BLUEPRINT § 6.1` → § 7 |
| 6 | How the Companion quietly participates | **Yes — and this room has the canon's only *quoted line* for it** | `OLB:87`; `BLUEPRINT § 13`; `NOTICE_ENGINE § 6` → § 8 |
| 7 | Moments of delight | **Yes — and the list is closed** | `EXP ARCH § 17.9:333-341` |
| 8 | Anti-patterns to avoid | **Yes** | `BLUEPRINT § 16:435-445`; `OHDB:256`; `EXPLANG § 7:526-551`; `OLB:89` |

**Six of eight are owned with no remainder.** So §§ 3–4 and 7–10 are **composition** — the room assembled from owners that each hold a fragment. **§ 5 and § 6 are where this document reports something real**, and § 11 is what the live room is doing instead.

> **Why compose at all, if nothing is new?** For `EXPBLUE1`'s own reason (`BLUEPRINT § 1.3`): the canon *"was becoming a library rather than a blueprint."* The Pantry's identity is currently distributed across a verb line, a map row, an exposure level, a light character, a ground posture, a Living Detail row, a design reading, a rhythm, a chapter and a translated characteristic. **This document makes that one read. It is a table of contents with reasoning, not a constitution.**

---

## 3. THE PANTRY PHILOSOPHY

Five principles. Each is a **composition of owned rules**, cited. None is new.

### P1 — The room's subject is the truth, not the food

`BLUEPRINT:148` — *"The Pantry is the household pantry — what is in the house right now, **honestly told**."* `OHDB:252` — *"**Purpose.** To tell the household, **honestly**, what is in the house right now."* `OLB:85` — *"its whole grace is **honesty without guilt**."*

Every other room's constitutional clause names a *thing*: the Planner's table, the Cookbook's book, Shopping's list. **The Pantry's names an *adverb*.** Strip the honesty out and there is no room left — an inventory that might be wrong is not a quieter pantry, it is a different product. This is why § 1.1 is a philosophical failure and not a data-quality one: **a pantry that invents its contents has not degraded; it has inverted.**

### P2 — Not what you should have; not what you lack

`OLB:85` — *"**Not what you should have. Not what you've run out of, held up as a failing.**"*

The room is defined as much by its two refusals as by its subject, and both refusals are aimed at the same instinct: **the pantry is the most natural place in the house to build a scold.** It knows what you have; therefore it knows what you don't; therefore it could tell you. The canon closes that door before it opens: `OLB:87` — *"**Nothing here scolds you.**"* `OHDB:252` — *"helpful, **never guilt-inducing**."*

**Live, this refusal holds** — and it is the room's best compliance finding (§ 11.3). The plant-diversity scoreboard exists in this product (`PlannerIntelligenceStrip.tsx:175`, `PlantDiversityReport.tsx:887-901`) and **it is not in the Pantry.**

### P3 — Reassurance is the room's register

`OLB:87` — *"**The feeling is reassurance.**"* `OHDB:252` — *"**Emotional tone.** Practical, honest, reassuring."*

Reassurance is a *lower* register than the Cookbook's appetite and a *warmer* one than the Analyser's precision, and it is the hardest of the three to fake — because reassurance is **entirely a function of the household believing you**. `EXPLANG:426` states the mechanism as the room's Confidence beat: *"the pantry's state feels accurate; **staleness or uncertainty says so plainly rather than posing as current**."*

> **Reassurance is the only feeling in the house that cannot be produced by design.** Warmth can be lit; calm can be spaced; appetite can be photographed. **Reassurance can only be earned by being right** — and by saying so when you are not sure. § 4.2.

### P4 — The smallest window in the house, and that is a promotion

`BLUEPRINT:175` — *"**E2 — the smallest window**"*. `OLB:87` — *"The orchard is at its smallest here, the narrowest window in the house, **because this is a working cupboard and the work is looking, checking, knowing**."*

This obeys the exposure law exactly (`BLUEPRINT:216`): *"**Orchard exposure is inversely proportional to functional density.**"* But note what the canon does *not* do: it does not demote the Pantry to E1 with the Planner and Shopping. **It keeps the Pantry in the window band** (`BLUEPRINT:222` — E2 belongs to *"Browsing and reflective rooms: Cookbook, Pantry, Nutrition, Diary"*), and gives it *"Practical, morning-warm"* light — *"the light you'd want to actually see the shelves by"* (`OLB:87`).

**The reasoning is the room's, and it is precise: you cannot check what you cannot see.** The Pantry's window is small because the work is dense, and it is still a window because the work is *looking*. **The narrowest window in the house is not the least light — it is the most task-shaped light.**

### P5 — The room's job is to be left, believing the shelves

`EXPLANG:429` — *"**Completion** — the pantry is up to date; the person **returns to their day, at rest**."*

Where the Cookbook may be lingered in (`COOK1 P5`, `OLB:76` — *"made for lingering"*), the Pantry may not. *"It is the **most practical moment in the house**"* (`OLB:85`); *"the person returns to their day"* (`:429`). **This room's success is measured in its own absence** — and that makes it the room least at risk from `EXP ARCH:192`'s engagement hazard (*"the household ate better with less effort, never the household spent more time in the product"*) and most at risk from the opposite failure: **upkeep**. `EXPLANG:427` names it — *"low-friction upkeep, **never bookkeeping**."* § 10.4.

---

## 4. HOW THE PANTRY SHOULD FEEL

**Owned in full** by `THA_EXPERIENCE_LANGUAGE.md § 5.6:423-429`, which already applies the canonical six-beat Experience Rhythm to this room. Cited, not restated:

> - **Arrival** — a calm, ordered store; a sense of *what we have*, not a chore list.
> - **Orientation** — *"here is what's in the house,"* legible at a glance.
> - **Confidence** — the pantry's state feels accurate; staleness or uncertainty says so plainly rather than posing as current.
> - **Action** — one easy motion at a time (mark used, add an item); low-friction upkeep, never bookkeeping.
> - **Understanding** — changes reflect immediately and honestly; the person sees the store update.
> - **Completion** — the pantry is up to date; the person returns to their day, at rest.

`OHDB:252` fixes the tone — *"Practical, honest, reassuring — helpful, never guilt-inducing"* — and `OLB:85-90` renders the six beats as lived experience, closing on the feeling to protect: *"**the quiet reassurance of knowing exactly what's in the house, told plainly and kindly, with nothing to feel guilty about.**"*

**Three observations about the beats, reported as findings rather than principles:**

### 4.1 Beat 1 (*Arrival*) nearly passes, and its one occupant is the room's weakest tenant

On a default logged-in, non-demo, returning arrival, **exactly one unconditional element** stands between the room's edge (`pantry-page.tsx:1150`, `<div data-realm="pantry">`) and the household's own shelves: a micro-insight at `:1154-1156`, drawn from a 9-item array (`:18-28`) selected by `MICRO_INSIGHTS[new Date().getDate() % MICRO_INSIGHTS.length]` (`:1095`).

**`PLAN1 § 11.1` found five always-on strips in the Planner; `COOK1 § 12.1` found none in the Cookbook. The Pantry has one** — and it is the cheapest possible kind, a static fact rather than a fabricated metric. **Recorded as a near-PASS.**

But it is the wrong tenant for *this* room specifically: it is generic nutrition copy (*"Different plant foods feed different gut bacteria"*), **not derived from this household's data, undismissable, and owned by no intelligence system.** Against `EXPLANG:424` — *"a sense of ***what we have***, not a chore list"* — the first thing the room says is not about what this household has. It is a fact about gut bacteria, chosen by the day of the month. § 11.2.

### 4.2 Beat 3 (*Confidence*) is the beat this room fails, and it fails on its own words

*"The pantry's state feels accurate; **staleness or uncertainty says so plainly rather than posing as current**"* (`:426`).

**The Pantry has no concept of staleness or uncertainty at all** — no dates, no provenance surfaced, no confidence (§ 5.2) — and ~141 of its items **pose as current** while having never been true (§ 1.1). The beat does not merely go unmet; **it names the exact defect, in the exact vocabulary, and it was written before anyone looked.**

> **`COOK1 § 4` found the Cookbook failing its Confidence beat on one sentence — *"Cooked N times"* — an over-claim about an unknown. The Pantry fails the same beat on its entire contents.** The Cookbook lies about a number. The Pantry is wrong about the room.

### 4.3 Beat 4 (*Action*) names a motion the platform does not have

*"one easy motion at a time (**mark used**, add an item)"* (`:427`). **"Add an item" exists** (`POST /api/pantry`, `routes.ts:7808`). **"Mark used" does not exist anywhere** (§ 5.3).

**Recorded as a canon/platform gap, not a canon defect.** `EXPLANG § 5` is the *rhythm* of the room — how it should feel to use — and a rhythm may honestly describe a room not yet built. This document does **not** propose amending `:427`; it records that **half of the room's Action beat has no implementation**, and that this is the same class of finding as `COOK1 § 13.2` (`BLUEPRINT:312`'s *"Cook/plan counts"*, half of which does not exist). § 12.2.

**The temperature floor** (`EXPLANG § 3A`): the Pantry's warmth cannot come from its content — a list of larder staples has no photography and no appetite to trade on (contrast `COOK1 § 4`, where *"the food itself is the colour"*). **This room's warmth must come almost entirely from its light and its language**, which makes `OLB:87`'s *"practical and morning-warm"* and `BLUEPRINT:314`'s *"helpful words, never guilt"* not stylistic preferences but the room's **only two carriers of warmth**. A Pantry that becomes clinical has nothing to fall back on, and `EXPLANG:546` calls that failure — *"Clinical minimalism… the room with the furniture removed"* — by name.

---

## 5. HOW FOOD IS UNDERSTOOD RATHER THAN STORED

**This is the mission's sharpest deliverable, and the platform's answer is the exact inverse of it: THA stores food and does not understand it.** Four parts.

### 5.1 The canon's answer: understanding is *resolution to a canonical owner*, and it is owned

The mission's distinction is not new language — it is `ARCHITECTURE_PRINCIPLES.md:44`'s, verbatim:

> *"**Knowledge entities** (Food, Meal, Product, Household) support **progressive enrichment: identity → core trusted facts → optional sourced context → runtime assembled model**. Gaps render as gaps, never as fabricated content."*

**That is the whole answer.** *Stored* is a string in a row. *Understood* is a string resolved to a **canonical identity** that carries trusted facts with sources — and where it cannot, *"gaps render as gaps."* The Pantry's `PantryKnowledgeHub` and `/api/pantry/intelligence` are exactly this principle's surface, and the endpoint's own comment states the contract correctly (`routes.ts:5639-5641`):

> *"Trust & progressive enrichment: a name that does not resolve to a canonical food returns `{ resolved: false }` and the panel hides. Each section is independently optional and **traces to a canonical owner**."*

**Live, that gate is real and correct** — `routes.ts:5651-5653` and `:5666-5668` both return `{resolved: false}`. **Recorded as a PASS**, and as the domain's best-designed edge.

### 5.2 The fact underneath: THA knows one bit about your house

`user_pantry_items` (`schema.ts:1010-1025`) holds `ingredientKey`, `displayName`, `category`, `defaultHave`, `isDefault`, `isDeleted`, `sortOrder`, `notes`, `needQuantityValue`, `needUnit`, `createdAt`. **Verified absent: `quantity`, `amount`, `stockLevel`, `expiry`, `bestBefore`, `useBy`, `openedAt`, `purchasedAt`.**

**So the entire inventory model is: does a row exist, or not.**

**And `needQuantityValue` is not a stock level — it is a shopping intent.** Four independent confirmations: the UI labels it *"Quantity needed"* (`pantry-page.tsx:110`) and renders *"Need 2l"* (`:136`); the error copy is *"Couldn't update **how much you need**"* (`:361`, `:826`); and the grouping is decisive (`:469-470`):

```js
const needItems = displayedItems.filter(i => i.needQuantityValue !== null);
const inPantryItems = displayedItems.filter(i => i.needQuantityValue === null);
```

> **"In Pantry" is literally defined as "no need-quantity is set on this row"** (`:470`, rendered under the header at `:592`). **Flagging that you need milk removes milk from "In Pantry" in the UI — while every intelligence consumer still counts it as present.** One field, two contradictory meanings, in one room.

**Against `BLUEPRINT:314`, this is the finding that matters most for the room's design:** the Living Detail *"Freshness, honestly told"* is sourced from *"Item freshness data"*, and **freshness data does not exist**. The freezer has it — `freezerMeals.expiryDate` (`schema.ts:813`), `remainingPortions` (`:811`). **The pantry does not.**

> **The room's one permitted sign of life (`BLUEPRINT § 12.1 r1` — *"One per domain, maximum"*) is `BLUEPRINT § 12.1 r2`'s dead case: *"Data-borne or dead."* There is no data. Today, the Pantry's Living Detail is dead — and r3 (*"Honest in absence… the room is still complete"*) is the rule that makes that survivable rather than fatal.**

### 5.3 The room can be filled and never emptied

Searched across the pantry domain for `consumed`, `used`, `depleted`, `ranOut`, `waste`, `expired`, `usedAt`, `consumedAt`, `binned`, `discarded`: **zero hits.** The only lifecycle transitions are **add** (`storage.ts:2138`) and **delete** (`storage.ts:2169`).

- `savingsEvents`' `'pantry_used'` type is **declared at `schema.ts:1351` and emitted by nothing** — `storage.ts:3722` initialises it to zero and no route ever increments it.
- `userItemUsage.lastUsedAt` (`schema.ts:1369-1371`) is a **`userId`-scoped autocomplete recall list** (`:1363` — *"Epic 3: Usage tracking — recent and frequent items per user"*), not wired to pantry items and not a record of consumption.

**THA cannot know you finished the milk three weeks ago, and will keep telling the intelligence layer you have it.** § 11.5's consequence: `routes.ts:5793` computes which meals the household is *"missing exactly ONE"* ingredient for, over a pantry that includes ~141 invented items and has never removed a consumed one.

### 5.4 The understanding is real, and it is thrown away after every request

The resolution path is a **per-request lexical guess, never persisted**:

- **Write-time**: `addPantryItem` calls `normalizeIngredientKey(ingredient)` (`storage.ts:2140`) — a string normaliser. **No canonical resolution, no validation, and no foreign key from `user_pantry_items` to any canonical table** (`schema.ts:1010-1025` — its only FK is `userId` → `users`). *A typo becomes a permanent, first-class pantry row.*
- **Read-time**: `resolveCanonicalFood` (`routes.ts:5649`, `:5762`) resolves the row's text on every request and discards the result.
- **On failure**: the *panel* hides honestly (`:5651`); the *item* fails **silently** (`:5763` — `if (r.canonicalSlug) pantrySlugs.add(...)`). **An unresolvable item still sits on the shelf, still renders, and is invisible to every intelligence surface, with no signal to anyone.**

> **The room named for knowledge stores strings and resolves them at read time, per request, without a foreign key.** `ARCH_PRINCIPLES:44`'s *"identity → core trusted facts"* has its arrow pointing the wrong way here: identity is **recomputed from the display name**, not held. **The pantry does not store what the food is. It stores what someone typed.**

### 5.5 What this section deliberately does not do

It **does not propose** an expiry column, a stock model, a "mark used" flow, a canonical FK, or a resolution cache. Each is a design decision belonging to a workstream, and `PKR1` R7 forbids an investigation filling a gap it found. **The seams are named and cited; that is the deliverable.**

---

## 6. HOW HOUSEHOLD KNOWLEDGE NATURALLY GROWS

**Owned — and the mission's phrasing is, gently, the thing the owner rejects.**

### 6.1 The owner, and the correction it makes to the question

`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md:14` is the governing law of how every knowledge domain grows:

> *"**Every knowledge domain THA ships must grow through the same graduation pipeline**, be governed by the same three-layer evidence chain, and be spoken by exactly one adapter."*

The pipeline (`PKCA:36-55`, Rule KC1 at `:57`): **candidate → gate → confirm → publish**, with rejection terminal (Rule KC2, `:59`). Cited, not restated.

**But the mission says household knowledge grows *naturally*, and `PKCA:139` is a direct refusal of that word** — worth quoting in full because it is the single most load-bearing sentence available to this deliverable:

> *"**Why Household patterns have no MVF row:** this is a **deliberate, correct exception, not a gap**… a pattern below Confirmed Understanding is not a 'thin' fact awaiting enrichment, **it is *not yet a fact at all*.**"*

> **Food knowledge grows naturally — progressively enriched, gaps rendering as gaps (`ARCH_PRINCIPLES:44`). Household knowledge does not, and must not. It is confirmation-gated: THA does not know a thing about a family until the family has agreed it is true.**

The platform states it in its own voice, at `routes.ts:11763-11764`:

> *"**THA does not tell a household what it has learned about them until they have agreed it is true.**"*

**The governed path is real and it works.** EL1/EL2 (`server/intelligence/evidence-learning/`): `MIN_EVIDENCE_COUNT = 3` (`framework.ts:53`), `MIN_CONSISTENCY = 0.7` (`:56`), both enforced by actual guards (`:150`, `:156`); status starts `pending_confirmation` (`schema.ts:2628`) and only an explicit `approve` moves it (`routes.ts:11995`); `declined` is terminal and never silently re-asked (`schema.ts:2606-2610`). **`PKCA § 4.1:173`'s claim that Layer 3 is a *"real, running gate"* is verified true.**

### 6.2 The Pantry's own knowledge skips the confirm stage entirely — the finding

**`pantry_ingredient_knowledge` (`schema.ts:1378-1392`) is a shared, cross-household knowledge table populated by AI and published straight to households.**

The schema says so (`schema.ts:1374-1377`):

> *"Shared enrichment cache — one row per canonical ingredient_key. Populated from static seed data (source='manual') or **OpenAI enrichment (source='ai')**. Locked rows are never overwritten by AI."*

The growth path (`routes.ts:7886-7896`): a **cache miss on one household's read** fires `enrichIngredient(canonicalKey)` and **writes the OpenAI output directly into the shared table** with `"ai"` as its source. There is no queue, no batch, no review.

Mapped against `PKCA § 1`:

| Stage | `pantry_ingredient_knowledge` |
|---|---|
| **1 Candidate** | ✅ OpenAI output (`routes.ts:7893`) |
| **2 Gate** | ✅ Real — a wording firewall banning `prevents`/`cures`/`treats`/`clinical`/`superfood`/`proven to` (`openai-enrichment.ts:43-58`) |
| **3 Confirm** | ❌ **Does not exist.** No `reviewStatus`, no `pending`, no human, no tier |
| **4 Publish** | ✅ …immediately, to the next household that asks |
| **Rejection** | ❌ **Silent.** An invalid response is discarded; the next household's cache miss re-asks it |

**This violates four rules of the document that governs it:**

- **Rule KC1** (`PKCA:57`) — *"A domain that skips a stage… has not built a knowledge pipeline — **it has built a fabrication risk**."*
- **Rule KC2** (`:59`) — rejection must be terminal, not silently retried.
- **Rule KC3** (`:61`) — *"A user-facing surface must never be able to confuse a draft… with a published/confirmed one. Where no visible distinction is possible yet, **the fact does not render**."* **The client never receives provenance**: grepping the whole client for `enrichmentSource` / `isLocked` returns nothing but the one fetch at `pantry-page.tsx:432`. An AI sentence and a hand-written one are identical on the shelf.
- **Rule KC9** (`:245`) — *"**Automation authors candidates, never publishes them.** No automated process may move a fact past the Gate stage on its own authority."*

**And `isLocked` — the table's one protection — is a lock with no key.** It defaults `false` (`schema.ts:1390`), the upsert honours it (`storage.ts:3528-3536`), and **no code path anywhere sets it true.** No route, no admin surface, no script.

### 6.3 The pattern was known, available, and applied twenty lines away

**`ingredient_classifications` (`schema.ts:1400-1415`) — the next table but one in the same file, AI-populated in the same way — does it correctly:**

`schema.ts:1396-1399` — *"Shared, **admin-reviewable** classification records… source priority: manual > deterministic > ai"*. It has `reviewStatus` defaulting to `'pending'` (`:1411`), a real gate (`classification-store.ts:62` — `return c.source !== 'ai' || c.reviewStatus === 'approved';`), an admin review surface (`routes.ts:10878`, `:10930` approve, `:10947` reject), and **terminal rejection honoured** (`backfill-classifier.ts:98`; `classification-store.ts:147`).

**And the identical defect was already found and fixed once, elsewhere, citing the same rule.** `server/lib/canonical-foods-gate.ts:5-26`:

> *"**This module writes nothing to the knowledge_\* tables. It used to.** Until KNOW2 it inserted food identities straight into `knowledge_foods`… **346 of 610 live foods arrived that way, unstamped (so they wore the default `source: "THA editorial"` despite being `authored_by: ChatGPT` drafts)** and invisible to the declared owner… **Rule KC9 — automation authors candidates, never publishes them. The gate's output is a reviewable record, not a row.**"*

> **THA found AI-authored content masquerading as editorial in a knowledge table, named it, fixed it, and wrote the remediation into a header comment citing Rule KC9. The same defect is live in the Pantry's knowledge table, and nobody has applied the precedent to it.** This is Rule KC8 (`PKCA:169`) applied to Rule KC9: *"A trust rule that exists only as prose in a governing document is not yet a trust guarantee — **it is a hope**."*

### 6.4 What THA learns about *this* household — and the governance hole it sits in

`shared/stories/` (WS10) promotes observations into five story types (`types.ts:26-32`) — `favourite_foods`, `discovery`, `family_traditions`, `seasonal_habits`, `food_journey` — over real thresholds (`engine.ts:53-87`): favourites at ≥3 appearances within ≤180 days (`:54`, `:56`, enforced `:210`, `:212`); traditions at ≥3 same-weekday and ≥50% (`:72`, `:74`); seasons at ≥5 entries (`:82`); journeys at ≥3 foods over ≥60 days (`:85`, `:87`). Its trust guard fails **closed** (`trust.ts:17-18`) and bans surveillance language outright — *"we tracked", "we noticed"* (`trust.ts:30`).

**It is excellent work. It has no row in any PKCA table** — not § 1.1 (pipeline), not § 2.1 (one mouth), not § 3.1 (MVF), not § 6.1 (completion). And it renders to the household **with no confirmation step**, from this room's endpoints.

**The collision is visible in one file, twenty lines apart.** `routes.ts:11763-11764` says *"THA does not tell a household what it has learned about them until they have agreed it is true"* — and `routes.ts:11743-11748`, in the same handler, pushes a seasonal story derived from that household's history into the same notice list, unconfirmed.

**The honest counter-argument, stated rather than omitted:** a story is a **recollection of what the household itself planned** (*"Tomatoes appeared in 27 meals"*), not an **inference about what they prefer**. `PKCA:139` draws its line at exactly that distinction, and WS10's ban on *"we noticed"* shows its authors chose voice-level mitigation over a gate, deliberately.

**But `PKCA` has never adjudicated it, because Stories is not in `PKCA`** — and `PKCA:139` explicitly hands the question forward: *"any future… capability should ask **which of the two this new knowledge more resembles** before choosing a completeness model."* **WS10 predates PKCA and was never asked.** § 14.4.

### 6.5 The room is carrying four other rooms' stories, and dropping three-fifths of them

`COOK1 § 12.5` reported this from the Cookbook's side. **From this side it reads differently**: `/api/pantry/stories` (`routes.ts:11453`), `/api/pantry/seasonal` (`:11479`), `/api/pantry/discover` (`:11407`) and `PantryKnowledgeHub.tsx:828`'s `.slice(0, 2)` are **the Pantry's code, in the Pantry's file, under the Pantry's route.**

`PantryKnowledgeHub.tsx:121` — *"Family favourites"*, ❤️, filed between *"gut health"* and *"seasonal foods"*, in a pill list of editorial browsing topics.

> **The Pantry is not hoarding the Cookbook's stories. It is the only room that ever built a place to put them** — and it built that place as an *Explore topic*, beside Mediterranean and Better sleep, which is precisely the wrong shelf for a fact about this family.

**`COOK1 § 15.2` recommends deleting the `.slice(0, 2)`. This document seconds it and adds the caution from this side:** the truncation is in the Pantry's file, so the fix lands on the Pantry's budget — and `BLUEPRINT § 12.1 r4` (*"below the emphasis budget"*) plus this room's E2 density make *more story cards in the Pantry* the wrong resolution. **The stories should leave, not multiply.**

---

## 7. HOW SEASONAL LIVING APPEARS

**Owned completely, stated four times, and the canon's answer is more precise than the question.**

### 7.1 The house has one season; the household has four

`BLUEPRINT § 6.1:207` — *"**One orchard.** One canonical environment, one owner, **one season**."* `OHDB § 11:189` — *"**The Orchard House has one season and one hour, and this is a deliberate design decision, not an unfinished one.**"* `OHDB:193` — seasonal dressing *"was **considered and declined**."*

**And the Orchard Living Book has four season chapters.** The resolution is the whole answer, stated four times:

> **Spring** (`OLB:151`) — *"The family's year turns, **even though the house's morning does not**… **the house simply holds it, the way a good kitchen holds every season of a family's cooking without redecorating for each one.**"*
>
> **Spring** (`OLB:155`) — *"The Companion notices the household's real rhythms, **not the calendar's costume**."*
>
> **Autumn** (`OLB:177`) — *"**It reads the family's season in what they cook, not in a calendar.**"*
>
> **Winter** (`OLB:188`) — *"**never brightens falsely to fight the season** on the family's behalf."*

> **The canon's answer, in one line: seasonal living appears in *what the household has and cooks*, and nowhere else. Never in the room's light, never in the orchard, never on a date.**

`OHDB § 11:195` extends it to this room by name: *"The only thing in the house that changes with time is the household's own data — the clock in the greeting, the sun on today's plan, **the freshness of the pantry**… **Time shows through the household's life, never through the house's weather.**"*

### 7.2 The Pantry is the room where seasonal living is *supposed* to be visible — and it is the only room where it is

`PantryKnowledgeHub.tsx:288` renders `` `This season · ${seasonalData.label}` `` with a 🌿, gated on `hasSeasonalContent` (`:287`); `:290` and `:296` render the household's seasonal habits and what is coming. `shared/seasonal/engine.ts`'s design contract is the canon's, written independently (`:16-23`): *"Count **UP**, never down… **Memory, never report card** — a season is recalled, never graded… **Empty is silent**… **Trust by non-computation** — no ranking of seasons, no 'best'… **so none can leak into a future edit**."* And `:12` — *"**Nothing is stored**… **by design, so a seasonal scorecard cannot quietly accrete.**"*

**Recorded as a PASS, and as the strongest single piece of engineering this audit touched.** It is `OLB:177`'s sentence implemented, and it implements it by **refusing to compute** the thing it must never say.

### 7.3 …and it asks a clock THA invented which season it is

`COOK1 § 8.3` established this; it is confirmed from this room, and it lands harder here because **this is the room the seasonal surface actually lives in**:

- Three season implementations (`TIME3:400` counted them: *"one exported, two private and byte-identical | 3 → 1"*) — `shared/discovery/seasonal-map.ts:63-69`, `shared/stories/engine.ts:137-143`, `shared/seasonal/engine.ts:96-102`. **They agree** (fixed UK meteorological seasons; `seasonal/engine.ts:89-94` asserts the three-way match). **Duplication is a maintenance risk, not a live divergence** — a distinction worth preserving.
- **All three call `date.getMonth()` — server-process-local.** `TIME3`'s CIVIL/INSTANT model (`README.md:29`) is decisive: *"every INSTANT consumer in THA is correct and **every CIVIL consumer is broken**."* A season is the purest CIVIL fact in the product — *if this household moved to Tokyo tomorrow, would this value have to change?* Yes, and twice: the hemisphere inverts. `seasonal/engine.ts:89-94` concedes and defers it on the honest grounds that the catalogue is UK-only.
- **`stories/engine.ts:534` computes the season from `household-history.ts:44-46`'s back-projected `approxDate`** — Rule HT7's fabrication (`README.md:29` — *"a back-filled anchor is the fabrication the architecture exists to retire"*).

> **The Pantry renders THA's seasonal living correctly, from an engine built to refuse a scorecard, on top of a calendar the platform made up.**

---

## 8. HOW THE COMPANION QUIETLY PARTICIPATES

**Owned in full — and this room has something no other room has: the canon gives the Companion an actual line here.**

- **Its place** — `BLUEPRINT § 13` — *"not a room… the person in the house"*; *"One presence, one fixed chair"*; *"It arrives a beat after you… no pulsing, no typing theatrics, no simulated mood, no face."*
- **Its translation into interface** — `TRANSLATION1:369-383` — *"Invited, not intrusive; suggesting, never deciding; honest about its limits; silence a valid state."*
- **Its volume** — `NOTICE_ENGINE § 6` — *"**Honest absence.** No producer data → no notice → an empty set. The engine never pads, never invents a 'tip of the day'."*; *"**Silence is a first-class outcome.**"*
- **Its conduct in *this* room** — `OLB:87`:

> *"The Companion, if it speaks, is **the friend who glances over your shoulder and says something *useful*** — **'you've got most of tomorrow's already'** — never something that makes you feel you've been caught out. **It helps you see; it never judges what it sees.**"*

**That quoted line is the deliverable.** It is the only room in the sixteen chapters where the canon writes the Companion's actual words, and every clause is load-bearing: it is about **what the household has** (not what they lack); it is **useful** (not observational); it is **glanced** (not announced); and it is offered *"if it speaks"* — silence assumed as the default.

### 8.1 The friend has a chair here, and this is the only audited room of which that is true

**Verified: the Pantry mounts `AmbientIntelligence` exactly once** (`pantry-page.tsx:1160-1164`), `surfaceKey="pantry"`, `domains={["pantry"]}`, and it **renames the row to `title="Ways to use what you have"`** — the only one of the five surfaces that overrides the default *"Things you could do"* (`AmbientIntelligence.tsx:59`). It self-gates honestly: `AmbientIntelligence.tsx:105` — `if (isPending || items.length === 0) return null;`.

> **That title is `OLB:87`'s line, in production.** *"Ways to use what you have"* is *"you've got most of tomorrow's already"* wearing a heading — about what the household **has**, useful, and silent when there is nothing to say. **`PLAN1 § 7.1` found the Planner running two ungoverned notice channels; `COOK1 § 9.1` found the Cookbook with no Companion at all. The Pantry is the only audited room where the friend is in the right chair, saying the right kind of thing.** Recorded as this audit's clearest PASS.

### 8.2 The room has a second tip channel, and it is the one thing in the chair that does not belong

The micro-insight (`pantry-page.tsx:1154-1156`, § 4.1) is a **permanent, undismissable tip channel owned by no intelligence system**, sitting *above* the Companion's own row. `NOTICE_ENGINE:250` calls a second channel a stop condition, and `NOTICE_ENGINE § 6`'s *"never invents a 'tip of the day'"* is almost a literal description of an array indexed by the day of the month (`:1095`).

*(`FirstVisitHint` at `:1166-1169` is the correct kind — one-time, localStorage-dismissed. It is not the problem.)*

**This is `PLAN1 § 14.3`'s convergence debt in its mildest form: one strip, no fabricated data, in the room otherwise doing it right.**

### 8.3 The unasked question, recorded

`PLAN1 § 7.3` and `COOK1 § 9.3` both recorded that no governing document says what the friend does when **two people** are at the table. **In this room it is answered — and that is the point of recording it.** The pantry is genuinely household-scoped (§ 12.1); `getPantryItems` reads the *household's* shelves (`storage.ts:2134`). **When the Companion says *"you've got most of tomorrow's already"* in the Pantry, "you" is honestly plural.** It is the only room of the three audited where that sentence is true.

**One residual, recorded not graded:** `user_pantry_items.userId` carries `ON DELETE CASCADE` (`schema.ts:1012`). **If the member who added an item is deleted, the item vanishes from the household's pantry** — a household fact deleted by a personal event. `householdId` is also nullable with no FK (`:1013`), and null-household rows are invisible to every read and excluded from the unique index (`runner.ts:836`).

---

## 9. MOMENTS OF DELIGHT

**The list of qualifying moments is closed, and the Pantry does not get to extend it.** `EXP ARCH § 17.9:333-341` owns which moments qualify: a household's **first genuine outcome**; the **completion of a journey that had real effort in it** — *"not the completion of a step"*; an **honest milestone the household would themselves recognise**. Everything else *"resolves quietly and without ceremony"* (`:341`).

Applying that owner to this room — application, not invention:

### 9.1 The Pantry's delight is reassurance, and it is already specified

`OLB:90` — *"What lingers — **the quiet reassurance of knowing exactly what's in the house, told plainly and kindly, with nothing to feel guilty about.**"*

This is delight as **care perceived**, and it is the premium test's exact shape (`EXP ARCH:372`): *"if the household would not feel the care, it is decoration; **if they would feel its absence, it is craft**."*

**Run that test honestly against this room and it produces the audit's sharpest sentence.** A household would not notice a correct pantry. **They would notice — immediately, and permanently — a pantry that told them they had passion fruit when they did not.** The absence of care here is not felt as coldness; **it is felt as the product being wrong about their kitchen**, which is the one thing this room exists not to be.

> **The Pantry's delight is the only one in the house that is *entirely* a subtraction. There is nothing to add. There is only a lie to remove.**

### 9.2 The genuine moment this room could own, and its precondition

*"Freshness, honestly told"* (`BLUEPRINT:314`) — *"the food in here is alive"* — is an honest sign of life a household would recognise, at the ceiling the Blueprint already sets: *"**Canonical status vocabulary; helpful words, never guilt.**"*

**It is not available**, for the reason in § 5.2: there is no freshness data, of any kind, anywhere in the pantry domain. **The Pantry's one Living Detail is currently un-buildable** — and `BLUEPRINT § 12.1 r2`'s *"Data-borne or dead"* means the correct response is **dead**, not painted. `r3` makes that survivable: *"When the data is silent, the detail is absent, **and the room is still complete**."*

> **The Pantry's signature moment is available the day THA honestly knows when food came into the house, and not one day before. Until then the room has no sign of life, and `BLUEPRINT § 12.1 r3` says that is a complete room, not a broken one.**

### 9.3 The delights *not* to build, recorded with their refusals

- **A pantry score, a "well-stocked" rating, a stocked-percentage.** `OLB:85` — *"Not what you should have."* `BLUEPRINT:314`'s ceiling — *"helpful words, never guilt"*. `EXPLANG:533` — *"Attention seeking… badging."*
- **A waste or expiry alarm.** `OLB:87` — *"Freshness is told in helpful, human words, **never in a red warning or a wagging finger** — a thing to know, not a thing to feel bad about."* **The red badge is the single most conventional pantry-app feature in existence, and this room's chapter forbids it in one sentence.**
- **A "you're 1 ingredient away!" celebration.** The capability exists (`routes.ts:5793`) — and per § 1.1 it is currently computed over invented contents. Under `EXP ARCH § 17.9`, being *near* something is *"the completion of a step"*, explicitly excluded.
- **A stocking streak, a "you've added 50 items!" badge.** `EXP ARCH:341` — *"routine saves, navigations, edits… resolve quietly and without ceremony."*

### 9.4 The moment the Pantry must never claim

**The Pantry must never tell a household what is in their house unless a human put it there.** § 1.1 is that claim, live, ~141 times per new household.

`EXPLANG:539` names the species precisely — *"**Fabricated feeling.** Calm faked with emptiness, welcome faked with a splash screen… **the feeling must be a consequence of care, never a performance of it**"* — and `OLB:89` names it in this room's own words: *"**Never here — painted jars or invented fullness pretending the cupboard is more than it is.**"*

> ***"Invented fullness pretending the cupboard is more than it is"* is in the Orchard Living Book as a *metaphor about visual design*. It is also, word for word, an accurate description of `storage.ts:2232`.**

---

## 10. ANTI-PATTERNS TO AVOID

Every one is **already forbidden by a rule with an owner**. Listed because the Pantry is the room each is most likely to enter, with the entry route named.

### 10.1 Painted jars and invented fullness — and the one that is already live

`OLB:89` — *"**Never here** — painted jars or invented fullness pretending the cupboard is more than it is."* `OHDB:256` — *"**Things to avoid.** Painted jars, drawn produce, or **fake fullness** (the theme park; **fabricated feeling**)."* `TRANSLATION1:271` — *"**No painted jars, no drawn produce, no fake fullness** — the shelf tells the plain truth of what is there… **No shelf pretending to hold more than the data says.**"*

**Entry route: taken, at the data layer, by a route nobody was watching.** Three governing documents forbid fake fullness, and all three were read as *visual* rules — jars, produce, clip-art. **`storage.ts:2232` achieves the same thing without drawing anything.** `TRANSLATION1:271`'s clause is the one that reaches it exactly: *"no shelf pretending to hold more than the data says"* — **except here the data says it too, because THA wrote the data.**

> **This is the most important line in this document. The canon's anti-pattern was aimed at illustrators and hit a seed function.**

### 10.2 Status that shames

`OHDB:256` — *"**status that shames rather than helps**."* `OLB:87` — *"never in a red warning or a wagging finger."* `BLUEPRINT:314` — *"helpful words, never guilt."* `TRANSLATION1:271` — *"**No status that shames**; freshness is *helpful words, never guilt*."*

**Entry route: the freshness feature, whenever it is built.** Every convention in the category — red badges, "expiring soon!", waste counters, use-it-up urgency — is this anti-pattern, and the room's Living Detail is the *only* sanctioned expression. **Recorded now, before the data exists, because the moment `expiryDate` lands on `user_pantry_items` this becomes the most likely mistake in the product.**

### 10.3 The catalogue of what they lack

`OLB:85` — *"**Not what you've run out of, held up as a failing.**"* `stories/types.ts:14` — *"NO deficits ('only X times', 'fell short')"*; `seasonal/engine.ts:20` — *"never a padded 'you only…' consolation."*

**Entry route: an empty or thin pantry** — and, more insidiously, **the seed itself, read as the fix for one.** The ~141 items exist because an empty pantry looked bad. **The canon's sanctioned response to an honestly empty room is `BLUEPRINT § 6.2 r2`: *"Empty states may open the window one level, never two"* — E2→E3, and only while genuinely empty. The answer to an empty cupboard is more light, not invented groceries.**

### 10.4 Bookkeeping

`EXPLANG:427` — *"low-friction upkeep, **never bookkeeping**."* `OLB:85` — *"the most practical moment in the house."* `EXPLANG:424` — *"a sense of *what we have*, **not a chore list**."*

**Entry route: the honest fix for § 5.2.** The straight-line answer to "THA doesn't know what's in the house" is *ask the household* — quantities, expiry dates, a check-in flow. **That is the anti-pattern, and it is the one this document is most likely to be misread as recommending.** Any future stock model has to survive `:427` and `:429` (*"returns to their day, at rest"*). **A pantry that is accurate because the household maintains a database is not this room.**

### 10.5 The orchard behind the shelves

`BLUEPRINT § 6.1:208` — *"**The orchard is never wallpaper.** No room *contains* the orchard; every room is *oriented toward* it. **A backdrop applied uniformly behind everything is the flattening the Place Principles forbid.**"* `BLUEPRINT:442` — *"**All view, no room.**"* E2 is *"a framed, partial presence in **one committed region the content deliberately does not cover**"* (`:222`).

**Entry route: already taken, and not by this room's code.** `orchard-backdrop.tsx:18` — full-bleed `/orchard-bg.webp`, **`opacity: 0.90` hardcoded**, `fixed inset-0`, mounted once in the protected shell (`App.tsx:210`) — **every room, no opt-out**. `card.tsx:12` — `bg-card/82 backdrop-blur-md`. The Pantry's two cards (`pantry-page.tsx:478`, `:901`) override nothing.

**So 18% of the orchard bleeds through the shelves of the room the canon calls *the smallest window in the house*.** This is `EXPCOMP2`'s, `PLAN1 § 11.2`'s and `COOK1 § 12.2`'s finding in a **fourth** room — which is the point: **it is not a room defect. It is `card.tsx:12`, and it is everywhere.** *(Recorded in passing, as both siblings did: `--orchard-opacity` is defined at `index.css:73`/`:155` and never consumed.)*

**One finding new to this room:** `PantryKnowledgeHub` does **not** use `Card` — its shell is a hand-rolled `rounded-2xl border bg-background` (`:157`), fully opaque, no blur. **So Explore mode and Inventory mode are materially different rooms under one route** — opaque `rounded-2xl` vs translucent `bg-card/82 backdrop-blur-md rounded-xl`. Against `BLUEPRINT § 5`'s *"A room is differentiated by purpose, light, material, and one sign of life — never by its own architecture"*, **a tab is currently changing the material.**

### 10.6 Clinical white — and this room has the least protection against it

`EXPLANG § 3A.4:133` — *"**Calm must never become lifeless.**"* `EXPLANG:546` — *"**Clinical minimalism.** Emptiness and sterility wearing the costume of elegance… **the room with the furniture removed**."*

**Entry route: fixing § 10.5.** Identical to `PLAN1 § 10.5` and `COOK1 § 11.6`, and **worse here than in either.** The Cookbook at least has food photography to fall back on when the opacity crutch is removed (`COOK1 § 11.6`). **The Pantry has a list of larder staples and no imagery of any kind** (§ 4's temperature floor). **It is the room with the least material warmth and the smallest window — which makes it the room where "calm" most easily becomes a spreadsheet.** Its only two carriers are its light and its language, and one of them is currently a hardcoded `0.90` backdrop.

### 10.7 The Companion judging what it sees

`OLB:87` — *"**It helps you see; it never judges what it sees.**"* `TRANSLATION1:371-383` — *"suggesting, never deciding."* `NOTICE_ENGINE:135` — *"**No notice executes anything.**"*

**Entry route: the Pantry is the room where the Companion knows the most and is most tempted to comment.** It can see the whole shelf. *"You've got most of tomorrow's already"* (`OLB:87`) and *"You still haven't used those lentils"* are the same capability, one clause apart. **The room's current title — *"Ways to use what you have"* (`pantry-page.tsx:1163`) — is on the right side of that line, and it is one word from the wrong one.** Recorded to protect a PASS, not to report a defect.

---

## 11. WHAT THE LIVE PANTRY IS DOING INSTEAD — REPORTED, NOT FIXED

Verified against live code at `7d1dd2ce`. **Nothing here was changed.** Each is a **conformance defect against an owned rule** — `NORTH2:220-229`'s category: *"not gaps in the architecture; they are the product disagreeing with it… **All of them require work.**"*

The Pantry is **one route** (`App.tsx:408`) over three files: `pantry-page.tsx` (1,230 lines), `PantryKnowledgeHub.tsx` (1,018), `PantryIntelligencePanel.tsx` (289). Explore is a query param (`?mode=explore`), not a route.

### 11.1 ~141 invented items, written by a GET, never disclosed — the defect

§ 1.1, § 1.2, § 1.3. `routes.ts:7788-7799`; `storage.ts:2224-2374` (list `:2232-2353`); `storage.ts:2187-2222` (list `:2195-2202`). `isDefault` transmitted (`pantry-read-handler.ts:97`) and discarded (`pantry-page.tsx:58`).

**Three consequences, each verified:**

- **Neither seed sets `defaultHave`**, so all ~141 rows take the column default `true` (`schema.ts:1017`) — which makes the **one live filter that reads it a no-op**: `planner-explanation-context.ts:230` (`if (!item.defaultHave) continue;`) **excludes nothing**, because nothing ever sets it false.
- **Pantry Opportunities reasons over the seed.** `routes.ts:5758-5763` builds `pantrySlugs` from *all* items; `:5793` computes meals the household is *"missing exactly ONE"* ingredient for. The route's own comment claims the feature is *"evidence-gated and never fabricated"* (`:5635-5636`) — **the gate is real for meals and absent for contents. The evidence *is* the seed.**
- **A re-sync resurrects deliberate deletions.** `syncAllPantryDefaults` (`storage.ts:2376-2395`) re-runs both seeds per household owner. Soft-deleted defaults (`:2177-2181`) are invisible to the partial unique index (`runner.ts:835-836`), so `.onConflictDoNothing()` (`:2369`) does not fire and **every default the household deliberately removed comes back.**

### 11.2 The room's one always-on element belongs to nobody

§ 4.1, § 8.2. `pantry-page.tsx:18-28`, `:1095`, `:1154-1156`.

### 11.3 There is no scoreboard — reported as a PASS, and it is a real one

**Verified: no score, no progress bar, no streak, no ranking, no percentage, no plant counter on any Pantry surface.** The plant-diversity scoreboard exists in this product — `PlannerIntelligenceStrip.tsx:175` (*"N of 30 plant foods this week"*), `PlantDiversityReport.tsx:887-901`, `HouseholdNutritionPanel.tsx:204` — and **none of them is imported by any of the three Pantry files** (verified by import inspection).

**And the room's single `?? 0` is provably unreachable.** `PantryIntelligencePanel.tsx:136` (`const mealCount = data.mealSupport?.count ?? 0;`) is gated at `:186` and, decisively, **the server cannot construct a zero**: `routes.ts:5672-5679` returns `mealSupport` as `null` rather than `{count: 0}`. **"In 0 meals in your Cookbook" can never render.**

> **`PLAN1 § 7.2` and `EXPCOMP2` found `plantCount ?? 0` rendering "0 of 30" on the Planner and Home. `COOK1 § 12.4` found the same coercion written correctly in the Cookbook. The Pantry is the third correct one — and it is the room where the scold would have been most natural and most damaging.** § 3 P2 holds, live.

### 11.4 The Knowledge Hub breaks its own stated trust rule

`PantryKnowledgeHub.tsx:26-31` declares its contract in its own header:

> *"• No scores, rankings, grades, percentages anywhere.*
> *• **Empty sections are silent (never "nothing yet")**."*

**Rule 1 holds.** **Rule 2 is violated three times**, all in `TopicView`: `EmptyState … title="Nothing to show here yet."` at `:604`, `:620`, `:628`. The Home view is correct — sections at `:268`, `:287`, `:304`, `:324` are all silent on absence — so the breach is scoped to topic pages reached by tapping an Explore pill.

Against `NOTICE_ENGINE § 6`'s *"honest absence"* and `EXPLANG:424`'s *"not a chore list"*. **The file wrote the rule and then broke it four hundred lines later.**

*(One dead element, recorded: `PantryKnowledgeHub.tsx:819-821` renders a self-closing `<p>` with padding and a top border and no content — a visible empty bordered strip. Neither honest absence nor content: it draws a box that holds nothing.)*

### 11.5 The pantry can be filled and never emptied

§ 5.3. No consumption, depletion, expiry or waste concept exists. `'pantry_used'` declared at `schema.ts:1351`, emitted by nothing, always zero (`storage.ts:3722`).

### 11.6 The shopping list asserts possession before purchase

**The only list↔pantry wire runs the wrong way.** `shopping-list-page.tsx:1778-1795` — **typing an item onto the shopping list immediately POSTs it to `/api/pantry`** (`:1787`), before it is bought or the household has left the house. The mapping is lossy (everything lands in `larder`, `:1785`) and the `catch` swallows all errors, not just the 409 its comment claims (`:1791`).

**And buying changes nothing.** No purchase, checkout, or basket handler writes to `user_pantry_items` (verified absent). Pantry→basket is telemetry only (`routes.ts:3751-3761`). `sendToBasket` sends the UI-local `sendQty` (default 1) rather than the recorded `needQuantityValue` (`pantry-page.tsx:451`, `:461`) — **"Need 2 litres" reaches the basket as 1** — and sending to basket never clears the need flag, so the item stays under "Need" until cleared by hand.

> **THA learns you have something when you *type it on a list*, and learns nothing when you actually buy it.**

### 11.7 The Pantry's knowledge table publishes AI output unreviewed

§ 6.2. `routes.ts:7886-7896`; `schema.ts:1374-1392`. **KC1, KC2, KC3, KC9 violated; `isLocked` is a lock with no key; `ingredient_classifications` twenty lines away does it right** (§ 6.3).

*(Recorded: `schema.ts:1374-1377`'s comment describes columns `source='manual'`/`source='ai'`. **The column is `enrichment_source`.** The comment documents a column name that does not exist.)*

### 11.8 The orchard is behind the shelves; Explore is a different material

§ 10.5. `orchard-backdrop.tsx:18`; `card.tsx:12`; `pantry-page.tsx:478`, `:901`; `PantryKnowledgeHub.tsx:157`.

### 11.9 Recorded as a PASS: the room does not move

**Neither `pantry-page.tsx` nor `PantryKnowledgeHub.tsx` nor `PantryIntelligencePanel.tsx` imports `framer-motion`.** No entrance animation, no staggered reveal. All motion is hover/toggle/pending feedback (`:626` chevron, `animate-spin` loaders, `transition-colors`). The one framer-motion path arrives via `AmbientIntelligence.tsx:148` with `initial={false}` — **so it does not animate on mount either.**

Against `BLUEPRINT § 12.1 r5` (*"**Still.** No Living Detail moves"*) and `EXPLANG:531` (*"Motion without meaning"*): **the Pantry is the stillest room audited.** `COOK1 § 12.3` had to flag the Cookbook's staggered card entrance (`delay: index * 0.03`). **The Pantry has nothing to flag.**

---

## 12. CORRECTIONS TO THE CANON

### 12.1 The expected finding inverted — the Pantry is genuinely the household's

`COOK1 § 1.1`'s headline was that `meals` is `userId`-scoped with no `householdId`, so *"the family's cookbook is N private books."* **This investigation began by expecting the same, and found the opposite.**

`user_pantry_items.householdId` exists (`schema.ts:1013`); `getPantryItems`, `addPantryItem`, `updatePantryItemQuantity` and `deletePantryItem` **all** scope to it (`storage.ts:2134`, `:2145`, `:2164`, `:2174`). Every method takes `userId` **only to resolve the household** (`getHouseholdForUser`, `household.ts:17-29`). **There is no `getPantryItemsForHousehold` — and none is needed, because `getPantryItems` *is* it.** The signature reads user-scoped; the behaviour is household-scoped.

**And it was done on purpose, with the reasoning recorded** (`runner.ts:820-822`, quoted at § 1.6). The migration dropped `UNIQUE(user_id, ingredient_key)` for `UNIQUE(household_id, ingredient_key) WHERE is_deleted = FALSE` (`:834-836`), after a backfill de-dupe (`:805-818`).

> **The Pantry is the room that passed the test the Cookbook failed. When the Companion says *"you've got most of tomorrow's already"* in this room, *"you"* is honestly plural — and it is the only audited room where that is true.**

**This is a correction to the *expectation*, not to the canon** — and it is worth as much as any defect above, because it is the existence proof that `COOK1 § 15.4`'s hardest recommendation is achievable. **THA has already scoped a domain to the household deliberately, and left the migration comment explaining why.**

### 12.2 `BLUEPRINT § 12.2`'s "Item freshness data" should be read as a finding, not a source

`BLUEPRINT:314` sources the Pantry's Living Detail from *"Item freshness data"*. **That data does not exist, in any form, anywhere in the pantry domain** (§ 5.2).

This is `COOK1 § 13.2`'s shape and a **strictly worse instance of it.** `COOK1` found *"Cook/plan counts"* — where the slash hides that one of the two exists and the other does not, so the room renders the wrong one. **Here there is no slash and no fallback: the Living Detail's sole named source is absent entirely.** The room's one sign of life has nothing to be borne by.

**This document does not propose amending the Blueprint** — filling a gap in an investigation is what `PKR1` R7 and `PLAN1 § 6.5` both forbid. It records that **two of the Blueprint's ten Living Details are sourced from facts the platform does not have**, that both were found by asking the same question of two different rooms, and that this is now a **pattern worth checking against the remaining eight** (§ 14.5).

### 12.3 `PKCA § 6.1` is stale, and its own Rule KC15 says that is a defect

`PKCA:265` states the Household Evidence completion criterion as *"At least one real reporting capability and one real consuming capability wired (**currently zero of either**)"*; `:284` (Phase 3) still lists it pending.

**Both are wired.** Reporter: `opportunity-delivery/framework.ts:364` → `recordHouseholdObservation`, on terminal resolutions only (`:352-355`), with `acknowledged` deliberately excluded (`:344-348` — *"'seen' is not an opinion"*). Consumer: `framework.ts:369` → `readConfirmedUnderstanding`. Second consumer: the Notice Engine (`routes.ts:11765-11778`).

**Recorded, not fixed** — `PKCA` is governing architecture and this is an investigation. Per its own **Rule KC15** (*"maintenance is not a follow-up; it **is** the work"*), a governing document whose completion table is false is exactly the defect that rule exists to name. § 14.4.

### 12.4 Not a correction — a confirmation worth recording

`COOK1 § 12.5` reported the family's stories rendering in the Pantry, from the Cookbook's side. **Verified from this side, in this room's files, and the picture completes:** `PantryKnowledgeHub.tsx:121`, `:206-207`, `:828`; `/api/pantry/stories` (`routes.ts:11453`). **COOK1 was right about this room before anyone audited it.**

---

## 13. WHAT THIS DOCUMENT DID NOT DO

Stated explicitly, because the mission's constraints were explicit:

- **No screens designed.** No layout, no wireframe, no component, no ASCII sketch, no plate. §§ 3–10 are principles and citations only.
- **Nothing implemented.** No code, no schema, no migration, no route, no token, no colour, no value of any kind. **The seed at `storage.ts:2232` was not touched**, though § 1.1 is the most serious finding in this document — it is a live data-behaviour change affecting every existing household and belongs to a workstream, not an investigation. **The `.slice(0, 2)` at `PantryKnowledgeHub.tsx:828` was not changed** either, for the reason `COOK1 § 14` gave.
- **No architecture modified.** All seven governing Experience documents, `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`, `ARCHITECTURE_PRINCIPLES.md` and the Source of Truth Register are **byte-untouched**. `docs/architecture/README.md` is untouched — this is an investigation and is not indexed as governing (`README.md:4`).
- **No rule created.** Applying `NORTH2`'s gate to my own output: every principle in §§ 3–10 traces to an owner. **If any statement here duplicates a rule owned elsewhere, the statement here is the defect** (`BLUEPRINT § 18`'s yield clause, applied to this file).
- **The § 5 / § 6 gaps not filled.** Named and routed, per `PKR1` R7. **No stock model, no expiry design, no "mark used" flow, no canonical FK proposal, no review queue for `pantry_ingredient_knowledge`.**
- **`PKCA` not amended** (§ 12.3), and **WS10 not adjudicated** (§ 6.4) — both are governance decisions, and an investigation that made them would be the second owner `PKR13` forbids.
- **Nothing renamed.** The Pantry remains the household pantry (`BLUEPRINT:148`). The mission's *"larder"* is discussed (§ 0.2) and not adopted.
- **The § 11 defects not fixed.** Reported with file:line, as `EXPCOMP2`, `TIME2`, `HOME3`, `PLAN1` and `COOK1` did.

**Gates re-run:** `.engineering/scripts/repo-structure-verify.sh` — `docs/investigations/ has no loose files` **PASS**. *(The pre-existing, unrelated FAIL on `.glibcheck.txt` / `.libdirs_uxhome.txt` at root persists — untracked before this session, noted also by `ORCH1`, `PLAN1` and `COOK1`.)*

---

## 14. RECOMMENDED FOLLOW-ON WORK

By value, ordered by dependency.

1. **Stop inventing the household's pantry.** § 1.1, § 11.1. `routes.ts:7788-7799`; `storage.ts:2232-2353`, `:2195-2202`. **This is the most serious finding in this document and the most serious in any of the three room audits** — `PLAN1` found a fabricated *zero*, `COOK1` found a fabricated *verb*, and this is a fabricated *inventory*, in the room whose only virtue is honesty, against `ARCHITECTURE_PRINCIPLES.md:74` (*"non-negotiable"*). **Do not treat this as a UI ticket.** It needs a decision an investigation may not make: *does the seed become a suggestion list the household confirms (the canon's shape — candidate → confirm, `PKCA § 1`), or does it go away?* **Note the cheap interim that is not the fix**: `isDefault` is already in the browser (`pantry-page.tsx:58`), so the room could *tell the truth today* while the decision is made. Surfacing it is one afternoon. **Deciding the shape is the workstream.** Also in scope: `syncAllPantryDefaults` resurrecting deliberate deletions (`storage.ts:2376`), and the `defaultHave` no-op (`planner-explanation-context.ts:230`).

2. **Stop asserting possession when someone types a list.** § 11.6. `shopping-list-page.tsx:1787`. **A second fabrication vector, independent of the seed, cheaper to fix, and no household ever asked for it.** Adding "chorizo" to a list does not put chorizo in the house. Adjacent and worth the same visit: `sendQty` overriding `needQuantityValue` (`pantry-page.tsx:451`) and the basket never clearing the need flag. **Do this alongside #1 or the seed fix will be undone by the list.**

3. **Give `pantry_ingredient_knowledge` a confirm stage.** § 6.2, § 6.3, § 11.7. **The pattern is already in this repository twice** — `ingredient_classifications` (`classification-store.ts:62` + the admin routes at `routes.ts:10878-10947`) and `canonical-foods-gate.ts:5-26`, which fixed *this exact defect* elsewhere and wrote Rule KC9 into its header while doing so. **This is not a design problem; it is an unapplied precedent.** Minimum: a `reviewStatus` column, a read gate, a terminal `rejected`, and — per **Rule KC3** — either provenance on the surface or the fact does not render. **And give `isLocked` a key, or delete it**: a lock nothing can set is worse than no lock, because it reads as protection.

4. **Ask governance the two questions this document may not answer.** (a) **Is WS10 Stories inside `PKCA` or outside it?** § 6.4 — it is household knowledge, threshold-promoted, rendered unconfirmed, with **no row in any PKCA table**, and `PKCA:139` explicitly hands this question forward. The counter-argument (a recollection is not an inference) is real and should be adjudicated, not assumed. (b) **`PKCA § 6.1:265` and § 7 Phase 3 `:284` are stale** — § 12.3. Both are governance decisions; **an investigation making them would create the second owner `PKR13` forbids.**

5. **Check the other eight Living Details against their named data sources.** § 12.2. Two of ten are now confirmed to be sourced from facts the platform does not have — *"Cook/plan counts"* (`COOK1 § 13.2`) and *"Item freshness data"* (this document) — **found by two investigations asking the same question of two rooms, neither looking for it.** `BLUEPRINT § 12.2:302-315` names eight more. **A one-day audit answers whether the library is a design and a plan, or a design and a wish** — and it is worth doing *before* any room's Living Detail is built, not after.

6. **Retire the micro-insight, or give it an owner.** § 4.1, § 8.2, § 11.2. `pantry-page.tsx:18-28`, `:1095`, `:1154-1156`. **The smallest item here and the easiest to get wrong.** The Pantry is otherwise the best-behaved room audited — one always-on element, no scoreboard, no motion, the Companion in the right chair with the right title. **This one strip is a permanent tip channel owned by nothing, in the room the Notice Engine already serves correctly.** Its removal costs nothing; its *replacement* with anything data-borne is `BLUEPRINT § 12.1 r2` and needs the § 14.5 answer first.

**Explicitly not recommended:**

- **Any Pantry visual prototype.** `EXP5:951` fixed the sequence — *"EXP5-P2 Cookbook and EXP5-P3 Planner as separate follow-ons, **each a fresh decision**"* — and **P1 (Home) has not run.** The Pantry is not even in that queue.
- **A freshness/expiry feature, yet.** It is the room's Living Detail (`BLUEPRINT:314`) and it is the **single most likely thing to be built next and built wrong** (§ 10.2 — every convention in the category is a red badge, which `OLB:87` forbids in one sentence). **It also cannot be honest until #1 lands**: freshness dates on invented items would make the fabrication worse by making it specific.
- **A stock-level or check-in model.** § 10.4. The obvious fix for § 5.2 is bookkeeping, and `EXPLANG:427` forbids it by name.

---

## 15. THE ONE THING TO REMEMBER

> **The Pantry is the household pantry — what is in the house right now, honestly told. It is the smallest window in the house, because the work is looking, checking, knowing; its light is practical and morning-warm, the light you would want to actually see the shelves by; its register is reassurance, the one feeling in this house that cannot be designed and can only be earned by being right; and its whole grace, in the canon's own words, is honesty without guilt.**
>
> **It is also the best-behaved room this audit has seen. It keeps no scoreboard in the room where a scoreboard would be most natural. It renders no fabricated zero. It does not move. It is genuinely scoped to the household — the test the Cookbook failed — and somebody left the migration comment explaining why they made it so. The Companion sits in exactly the chair the Living Book gives it, under a heading that is that chapter's own sentence: "Ways to use what you have."**
>
> **And roughly a hundred and forty-one of the things on its shelves are not there. THA put them there, on a read, without asking, and says nothing. It computes the flag that would tell the truth, sends it to the browser, and drops it. Three governing documents forbid "fake fullness" and all three were read as rules about drawing jars — while a seed function achieved the same thing without drawing anything, and every other room now reasons confidently over the result.**
>
> **The work is not to define this room. The room is defined, four times over, better than this document could. The work is to stop telling a family what is in their own kitchen.**
