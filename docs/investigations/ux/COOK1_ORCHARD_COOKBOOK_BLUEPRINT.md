# COOK1 — The Orchard Cookbook Blueprint

**Workstream:** `COOK1_Orchard_Cookbook_Blueprint`
**Date:** 2026-07-16
**Rollback:** `rollback/COOK1-orchard-cookbook-blueprint-20260716` → `7d1dd2ce`

> **Status.** This is an **investigation** — point-in-time analysis and history. It is **not** governing architecture, **not** a specification, **not** implementation. It **creates no rule and no second owner**. Everything binding in it is binding because another document already says it, and is cited to that document. Where this file appears to state a law, the citation is the law and this file is commentary.
>
> It was asked to define the Cookbook *as the family's cookbook*, in principles, without designing screens. It does that by **composition and citation** (§ 3), because the Cookbook's philosophy, feeling, exposure, light, material, signature moment and anti-patterns are **already owned completely** by seven governing documents. The honest deliverable was never new law. It is the Cookbook assembled into one legible room, plus the **four deliverables that turn out to be built already and living somewhere else** (§ 5–§ 8), plus what the live product is doing instead (§ 12).

---

## 0. THE MISSION, AND ONE DEVIATION REPORTED

The mission: *"Using the existing Experience architecture and Orchard Blueprint, define the Cookbook as the family's cookbook."*

### 0.1 Filing deviation

The mission said *"store the investigation under `docs/investigations/`"*. A loose file at that root **violates governing architecture** (`REPOSITORY_CONVENTIONS.md:47`; `docs/investigations/README.md:11`) and **fails** `.engineering/scripts/repo-structure-verify.sh`. Filed under **`ux/`** — the Experience workstream, where `HOME1`, `HOME2`, `NORTH2`, `EXPCOMP1`, `ORCH1`, `EXP5` and its direct sibling `PLAN1` live. Filename preserved.

*(A `cookbook/` workstream folder also exists. It was considered and not used: it covers **recipe content and meal modelling** — *"meal detail, meal shells/templates/catalogue, meal-occasion & component modelling, recipe acquisition"* (`investigations/README.md`). This document is about the Cookbook **as a place**, which is the `ux/` workstream's subject. `PLAN1` made the identical decision for identical reasons while a `planner/` folder existed.)*

### 0.2 No noun deviation — and that is itself the finding

`PLAN1` opened by refusing its mission's central noun: *the Planner is not the kitchen*, and the canon said so five times.

**This mission has the opposite problem.** *"The family's cookbook"* is not a word this brief reached for — **it is the canon's own sentence, verbatim**: *"**The Cookbook is the family's living cookbook** — the used, well-thumbed book of what this family cooks, not a catalogue of what anyone could"* (`THA_EXPERIENCE_BLUEPRINT.md:147`). The mission names this room exactly right.

**The platform does not.** § 1 is what happened when the mission's noun was checked against the code.

> **`PLAN1`'s mission used a forbidden word about a room the canon had already got right. `COOK1`'s mission uses the canon's own word about a room the platform has never honoured.** The two investigations invert each other, and the inversion is the reason this document is mostly § 5–§ 8 and § 12 rather than § 3–§ 4.

No other deviation. No architecture modified. No screen designed. Nothing implemented.

---

## 1. HEADLINE

**The Cookbook is the only room in the house named for a family that does not have one — and its five stories are all written, all running, and all told in the Pantry.**

Six findings, in order of how much they should change what happens next:

1. **The room's name makes two claims and the platform backs neither.** *"The family's **living** cookbook"* (`BLUEPRINT:147`):
   - ***family*** — `meals.userId` is `notNull` and there is **no `householdId` on `meals` at all** (`shared/schema.ts:88-137`); `getMeals` filters strictly by user (`server/storage.ts:469-471`). There is no `getMealsForHousehold` anywhere. **A member cannot see another member's recipes.** The family's cookbook is *N* private books.
   - ***living*** / *"well-thumbed"* — **no record of a meal being cooked exists in ninety tables.** No `cooked_at`, no `cook_count`, no `markAsCooked`. The room's one Living Detail is sourced from a fact THA does not have (§ 5).

2. **This was never undiscovered. It is written down twice, in one directory, by two documents that have never been read together.** `capabilities/meals.md:29-32` — also **governing architecture** — already states it plainly: *"own-data is **USER-scoped** … not household-scoped … **There is no household-level meal scoping anywhere in the owner.**"* The Experience canon calls the room a family's; the Capability Card records that no family exists in it. Both are current, both are in `docs/architecture/`, and they sit in different README sections (*Experience Governance* vs *Architecture → Capabilities*). **The gap is not a discovery. It is a directory that does not read itself.**

3. **The mission's four hardest deliverables were designed, typed, tested and shipped — into another room.** *Favourites · discovery · traditions · seasonal cooking* are **four of the five story types in `shared/stories/types.ts:27-32`**, a 752-line engine with a test suite. The **only** UI that renders them is `PantryKnowledgeHub.tsx`, over an endpoint named **`/api/pantry/stories`** (`routes.ts:11453`). *"Family favourites"* is an **Explore topic in the Pantry**, with a ❤️, filed between *"gut health"* and *"seasonal foods"* (`PantryKnowledgeHub.tsx:121`). **The family's living cookbook has never been told the family's story.** § 5–§ 8.

4. **The richer a family's history, the fewer of their stories they are shown.** `PantryKnowledgeHub.tsx:828` renders `storiesData.sections.slice(0, 2)`. Sections emit in fixed order — favourites, discovery, traditions, seasonal, journeys (`engine.ts:244`, `:372`, `:519`, `:584`, `:665`) — and empty ones are never pushed (`:706`). So traditions render **only for a household with at most one of {favourites, discovery}**. ***"Friday became pizza night" is visible only to a household that has no favourite foods.*** § 7.

5. **The Cookbook's arrival is clean, and it is the first room audited of which that is true.** Verified: on a default arrival, **nothing** stands between the room's edge and the first recipe card but two layout divs (`meals-page.tsx:3500`→`:3941`). No hint banner, no always-on strip, no fabricated zero — `CookbookMealIntelligenceStrip` is quadruple-gated and returns `null` on absence (`:78`, `:89`, `:104`). **`PLAN1` found five strips and a scoreboard reading zero; the Cookbook has neither.** This inverts the expected finding and re-aims the work (§ 13.1).

6. **One sentence in this room is the only place in the codebase that breaks the trust model the whole codebase defends** — and the honest version of it already exists, one page away, about the same integer. `CookbookMealIntelligenceStrip.tsx:93`, `:183-186` prints **"Cooked N times"** from a planner row count. `food-detail-page.tsx:91-96` reads *the identical field* under the comment *"household history (careful language)"* and renders *"has featured in your plans N times."* **THA already owns the true sentence and declines to use it here.** § 5.3.

> **The sentence this room is governed by:** ***"the used, well-thumbed book of what this family cooks, not a catalogue of what anyone could"*** (`BLUEPRINT:147`). Every principle below is written to survive that sentence being enforced against the platform — which, today, it does not survive.

---

## 2. THE GATE — APPLIED TO ALL NINE DELIVERABLES

`NORTH2:39` imposes a prior question on any proposal:

> **Is this rule already owned?** If yes, the proposal is not an amendment — it is a **restatement**, and every governing document in this set forbids restatement in identical terms: *"restating a rule creates a second owner of it"*.

Run against the mission's nine deliverables:

| # | Deliverable | Already owned? | Owner |
|---|---|---|---|
| 1 | The Cookbook philosophy | **Yes** | `BLUEPRINT:147`, `:173`; `OHDB § 13.3:240-248`; `EXP5:360-380`; `OLB:72-81` |
| 2 | How the Cookbook should feel | **Yes** | `EXPLANG § 5.3:399-405`; `OHDB:242`; `OLB:74-81` |
| 3 | How family favourites are collected | **⚠️ Owned in code, in another room; the *fact* it needs does not exist** | `BLUEPRINT § 12.2:312`; `stories/engine.ts:175` → § 5 |
| 4 | How new meals are discovered | **Yes — three times, and the three owners disagree with the room** | `RECIPE_ACQUISITION § 2`; `capabilities/meal-discovery.md`; `EXPLANG § 5.3` → § 6 |
| 5 | How traditions are preserved | **⚠️ Built, running, and unreachable** | `stories/engine.ts:393` → § 7 |
| 6 | How seasonal cooking naturally appears | **Yes — and the canon's answer is exact and repeated four times** | `OLB:149-192`; `OHDB § 11:185-193`; `BLUEPRINT § 6.1:207` → § 8 |
| 7 | How the Companion quietly participates | **Yes** | `BLUEPRINT § 13:323-335`; `OLB:78`; `TRANSLATION1:369-383`; `NOTICE_ENGINE § 6` |
| 8 | Moments of delight | **Yes — and the list is closed** | `EXP ARCH § 17.9:333-341` |
| 9 | Anti-patterns to avoid | **Yes** | `BLUEPRINT § 16:439-444`; `OHDB:248`; `EXPLANG § 7`; `OLB:80` |

**Six of nine are owned with no remainder.** So §§ 3–4 and 6, 8–11 are **composition** — the room assembled from owners that each hold a fragment. **§ 5 and § 7 are where this document reports something real**, and § 12 is what the live room is doing instead.

> **Why compose at all, if nothing is new?** For `EXPBLUE1`'s own reason (`BLUEPRINT § 1.3`): the canon *"was becoming a library rather than a blueprint."* The Cookbook's identity is currently distributed across a map row, a design row, a rhythm, a chapter, an exposure level, a Living Detail row, two Capability Cards and an acquisition architecture. **This document makes that one read. It is a table of contents with reasoning, not a constitution.**

---

## 3. THE COOKBOOK PHILOSOPHY

Five principles. Each is a **composition of owned rules**, cited. None is new.

### P1 — It is *theirs*, and that is the whole room

`BLUEPRINT:147` — *"the used, well-thumbed book of **what this family cooks**, not a catalogue of what anyone could."* `OHDB:242` — *"To hold and open **this family's** used cookbook."* `OLB:74` — *"You take down the book that is **yours** — not a catalogue of every dish in the world."*

This is the room's constitutional clause, and it is a **possessive**, not an aesthetic. Every other property of the Cookbook — the warmth, the shelf, the well-thumbed page, the side-light — is downstream of a book *belonging to someone*. **A catalogue with warm lighting is still a catalogue.** § 1.1 is the finding that this clause is currently unbacked at every layer.

### P2 — Recognition, not choosing

`OLB:74` — *"The pleasure is **recognition**: *oh, this one*, and the small warmth of a page that has clearly been opened before."* `OLB:81` — *"makes cooking feel like **remembering rather than choosing**."*

The distinction is load-bearing and it is the room's success measure. A catalogue asks you to **decide**; a family's book asks you to **recall**. Everything in §§ 5–8 is a mechanism of recall — favourites, traditions, seasonal habits and journeys are all *memory*, which is precisely what `shared/stories/types.ts:3-5` says it built: *"Stories … face **BACKWARD** — recognising what happened, not prescribing what to do next. **Stories are memory, not measurement.**"*

### P3 — The book is used, and says so without keeping score

`BLUEPRINT § 12.2:312` — the well-thumbed page: *"**A half-step surface warmth; never a badge, rank, or label.**"* `OLB:76` — *"The ones you cook most often carry a faint, earned warmth, the way a loved page falls open on its own — never a badge, never a rank, never a score. **This book keeps no leaderboard.** It simply shows, quietly, that it is used."*

The code already agrees, in its own voice (`stories/types.ts:12-18`): *"NO rankings, NO scores, NO streaks, NO achievements · NO deficits · NO comparisons · NO judgement · **NO verdicts — only observations, only recognition.**"*

> **The Experience canon and the WS10 engine independently wrote the same rule in the same words, eighteen months apart, and have never been introduced.** That is this document's recurring shape.

### P4 — Appetite is the room's register

`EXP5:360-363` — *"**Appetite and possibility.** Browsing what we could cook — leafing, lingering, being tempted. **The warmest browsing register in the product; the food itself is the colour.**"* `EXP5:378-380` — *"Food photography, where it exists, is the room's **real decoration** — honest, appetising, in real light."*

The consequence is a **budget in the opposite direction from the Planner's**: where `PLAN1 P4` reasoned that the Planner has *less* room for atmosphere because it is doing more, the Cookbook is the room permitted the **most window after Home** (`EXP5:369`) — *"recipes and growing food belong within sight of each other."* This room's density is browsing density, not working density, and E2 is what it buys (§ 8.1 of `PLAN1` inverted).

### P5 — The room's job is to be left, holding one meal

`EXPLANG:405` — *"**Completion** — the meal is planned or begun; the person **returns to browsing or to Home, at rest**."*

The Cookbook is the one room whose completion is explicitly permitted to be *"returns to browsing"* — lingering is legitimate here in a way it is nowhere else (`OLB:74`, *"made for lingering"*). **This is the single largest engagement hazard in the house**, and the guard is `EXP ARCH § 19.2`: *"the household ate better with less effort, **never time in the product**."* Lingering is a permitted *feeling*, never a measured *goal*. § 11.4.

---

## 4. HOW THE COOKBOOK SHOULD FEEL

**Owned in full** by `THA_EXPERIENCE_LANGUAGE.md § 5.3:399-405`, which already applies the canonical six-beat Experience Rhythm to this room. Cited, not restated:

> - **Arrival** — a warm, appetising place that feels like browsing a shelf, not querying a database.
> - **Orientation** — *"here is what I can cook,"* with the food itself carrying the warmth.
> - **Confidence** — meals feel real and honestly presented; nothing over-claims; unknowns render as honest absence.
> - **Action** — one clear intent per meal (cook it, plan it) — the person's most likely intent, never the product's.
> - **Understanding** — choosing a meal leads calmly to its one canonical page, where everything about it lives.
> - **Completion** — the meal is planned or begun; the person returns to browsing or to Home, at rest.

`OHDB:242` fixes the tone — *"Warm, familiar, unhurried browsing — **a well-loved book, not a store**"* — and `OLB:72-81` renders the six beats as lived experience, closing on the feeling to protect: *"**the warmth of a book that is theirs, well-loved and unhurried, that makes cooking feel like remembering rather than choosing**."*

**Two observations about the beats, reported as findings rather than principles:**

- **Beat 1 (*Arrival*) already passes**, and is the first arrival in the audited house that does (§ 12.1). The room *does* open onto the shelf.
- **Beat 3 (*Confidence*) is the one that fails**, and it fails on its own words: *"nothing over-claims; unknowns render as honest absence."* **"Cooked N times" is an over-claim about an unknown** (§ 5.3). The room's honesty beat is broken by the room's only claim about the household.

**The temperature floor** (`EXPLANG § 3A`): the Cookbook's warmth is supposed to come from *the food itself* (`EXP5:362`) — which means this room has a **carrier for warmth that no other room has**, and therefore the least excuse for the cold failure `EXPLANG § 3A.1` calls unrecoverable. It also means the warmth is **contingent on real photography of real food**, and where that is absent the room falls back to `bg-accent/30` and a `UtensilsCrossed` watermark (`meals-page.tsx:3954-3962`). Recorded, not graded.

---

## 5. HOW FAMILY FAVOURITES ARE COLLECTED

**This is the mission's most important deliverable and the platform's clearest failure.** The answer has three parts, and only the first is good news.

### 5.1 The canon's answer: they are *not* collected — they are *noticed*

`BLUEPRINT § 12.2:312` sources the well-thumbed page from **"Cook/plan counts"** — a *derived* fact, never a user action. `OLB:76` is explicit that the warmth is **earned, not declared**: *"The ones you cook most often carry a faint, earned warmth, the way a loved page falls open on its own."*

**There is no star. There is no favourite button, and there must not be one.** A declared favourite is a *rating*, and a rating is a rank (`BLUEPRINT:312` — *"never a badge, rank, or label"*; `stories/types.ts:13` — *"NO rankings, NO scores"*). **A favourite in THA is a thing the household did, never a thing they filed.**

**Verified live: no favourite affordance exists on any Cookbook surface** — no star, no pin, no `isFavourite` column anywhere in `shared/schema.ts`. **The room is correct by omission.** This is the one place where the platform's silence is the canon's answer, and it should be recorded as *compliance*, not as a gap — because the obvious "improvement" here is forbidden.

### 5.2 The engine's answer: already built, and pointed at the Pantry

`shared/stories/engine.ts:175` — `favouriteFoods()`: food-level, ≥3 appearances within ≤180 days. Its output headline is the canon's sentence almost exactly — *"Tomatoes became a family favourite"* (`types.ts:28`) — and its section title is *"**Foods your household loves**"* (`types.ts:160`).

**Where it renders:** `PantryKnowledgeHub.tsx:578` — `storiesData?.sections.find(s => s.type === "favourite_foods")`, fetched from `/api/pantry/stories` (`:206-207`), reachable as an Explore topic (`:121`):

```ts
{ id: "family-favourites", label: "Family favourites", icon: "❤️", searchQuery: "", kind: "stories" as const },
```

**It sits in a list between `gut-health` and `seasonal-foods`.** The household's own loves are a **browsing topic beside generic nutrition themes**, in the pantry, behind a heart emoji — and the room named *"the family's living cookbook"* renders none of it.

> **THA computes which foods this family loves, and tells them in the room where they keep the tins.**

### 5.3 The fact underneath: THA cannot know a page was thumbed

**The Blueprint's data source for this room's Living Detail is `"Cook/plan counts"`. The slash is doing work the data cannot support.**

- **There is no cook count.** No `cooked_at`, `cook_count`, `times_cooked`, or `markAsCooked` column exists (`shared/schema.ts`, verified). `ORCH1:31` found the nearest thing lives in **browser `localStorage`** (`planner:cooked-entries`) — unsynced, unread, invisible to the server.
- **There is only a plan count.** `plannerAppearanceCount` is `rows.length` over `planner_entries` (`server/lib/meal-intelligence-assembler.ts:341-363`) — *"how many times the meal was placed on a plan"*, with no completion predicate.
- **The codebase documents its own conflation, in scare quotes.** `server/lib/food-intelligence-assembler.ts:266`:
  ```ts
  /** Total planner entries (meals placed on the planner) — "meals cooked". */
  ```
- **And the room prints it as fact** (`CookbookMealIntelligenceStrip.tsx:93`, `:183-186`):
  ```ts
  const cookedCount = data.household?.plannerAppearanceCount ?? 0;
  …  Cooked {cookedCount} {cookedCount === 1 ? "time" : "times"}
  ```

Against the trust model **the codebase itself defines** (`shared/stories/types.ts:20-24`):

> *"`planner_entries` witness **PLANNING**, not eating … the verb vocabulary must match the evidence — *'featured in your meals'* (planned) is always safe; *'ate'* (logged) is only warranted when source is a confirmed diary entry."*

`ORCH1:63` already named this room for it: *"**A household that dragged a meal into six planner slots and cooked none of them is told 'Cooked 6 times.'** It is the only place in the codebase that breaks the trust model — and it breaks it in the household's own Cookbook, about their own life."*

**What this document adds is that the fix is already written, one page away, about the same integer** (`client/src/pages/food-detail-page.tsx:85-96`):

```ts
// ── Section: household history (careful language) ──
const n = household.plannerAppearanceCount;
…  `${foodName} has featured in your plans ${times}.`
```

> **The same field. The same product. One page says "has featured in your plans"; the Cookbook says "Cooked".** This is not a missing capability, a missing column, or a design question. **It is one sentence, and THA already knows how to write it.**

**A second surface, recorded so it is not missed:** `server/routes.ts:5691-5696` branches the same count into *"You've cooked with this before"* / *"Your household hasn't cooked with this yet"*. **The claim has already spread past the strip.**

### 5.4 What this section deliberately does not do

It **does not propose** a cook-logging feature, a schema column, a favourite affordance, or a wire from the Diary. `ORCH1 § 1.4` already established that shape and routed it — *"What is missing is not a domain. **It is a wire.**"* — with the Diary (Domain 21) as the outcome's existing owner. **The seam is named and already routed; this document adds the Cookbook as its most damaging consumer, and stops.**

---

## 6. HOW NEW MEALS ARE DISCOVERED

**Owned three times, with no remainder — and the three owners have never been reconciled with the room.**

### 6.1 The three owners

| Question | Owner |
|---|---|
| **Under what right may a recipe enter the book?** | `THA_RECIPE_ACQUISITION_ARCHITECTURE.md § 2` — four lanes (`tha_library`, `licensed_discovery`, `personal_cookbook`, `community_cookbook`), recorded on `meals.acquisition_lane` |
| **Which capability answers "what else is out there?"** | `capabilities/meal-discovery.md` — the discovery sibling of `meals`; *"A discovery search must never surface another user's private meal"* |
| **How should discovering feel?** | `EXPLANG § 5.3:400` — *"browsing a shelf, not querying a database"* |

### 6.2 The boundary the canon needs is already drawn — in the intent router

`capabilities/meals.md:100-113` states it as governing architecture:

> **"An ownership-qualified meal query belongs to `meals`. An unqualified one belongs to `meal-discovery`. The qualifier is the boundary."**
>
> *"`meals` is USER-scoped plus system meals; `meal-discovery` searches the discoverable corpus. **Routing an unqualified query to `meals` silently narrows the answer to what the user already owns**, and routing a qualified query to `meal-discovery` silently widens it past what they asked for. **Neither error is visible in the answer text.**"*

**This is `BLUEPRINT:147`'s sentence — *"what this family cooks, not a catalogue of what anyone could"* — expressed as an intent-routing rule, in a different section of the same directory.**

> **THA has already drawn the line between *the family's book* and *the world's catalogue*. It drew it in the Companion's intent router, and nowhere in the room.**

### 6.3 The tension the room carries and the canon does not name

**The map has no Discovery room** (`BLUEPRINT § 5.1`). So discovery necessarily happens *inside* the room defined as *"not a catalogue"*. Live, that is literal: `meals-page.tsx:3412-3442` is a four-tab control — **My Cookbook / Recipes / My Freezer / Packaged** — and `:3593-3905` is a *"From the Web"* section. **The family's book and the world's catalogue are the same surface, differentiated by a tab.**

This document does **not** resolve it — resolving it would be designing a screen, which the mission forbids, and the room's identity is `BLUEPRINT`'s to own. It records the tension with its citations so the next workstream does not rediscover it, and notes the one thing the canon *does* settle: **lane containment** (`RECIPE_ACQUISITION § 3.3`) — *"Personal Cookbook content never feeds discovery, Smart Suggest candidates, or any other user's view."* **Whatever discovery becomes, it may never turn one family's book into another family's catalogue.**

### 6.4 The engine's answer, again in the Pantry

`stories/types.ts:29` — `"discovery"`: *"This spring you discovered artichokes."* Section title: *"**Foods your household has discovered**"* (`:161`). It renders at `PantryKnowledgeHub.tsx:828`, second of two sections, under the heading *"Your household"*. **The Cookbook does not render it.**

---

## 7. HOW TRADITIONS ARE PRESERVED

**This is the section that reports something genuinely new, and it is not the gap I expected to find.**

### 7.1 Traditions are not unowned. They are built, tested, wired — and unreachable.

`shared/stories/engine.ts:393` — `familyTraditions()`. Thresholds at `:72` (`TRADITION_MIN_COUNT = 3`) and `:74` (`TRADITION_DAY_FRACTION = 0.5`): a day-of-week tradition requires the same weekday ≥3 times **and** ≥50% of appearances; plus a *"go-to"* rule at ≥4 uses in a rolling 30-day window. It emits the canon's sentence: *"Friday became pizza night"* (`types.ts:30`), *"became your go-to weekday meal"*, *"became a household regular"* (`engine.ts:500-501`). Section title: *"**Your household traditions**"* (`types.ts:162`).

It is wired live at `routes.ts:11484`, `:11743` and `server/lib/household-companion-fields.ts:89`.

### 7.2 …and a household with favourites can never see them

`PantryKnowledgeHub.tsx:826-828` — the only UI that renders story sections:

```tsx
{storiesData && storiesData.sections.length > 0 && (
  <FoodSection title="Your household">
    {storiesData.sections.slice(0, 2).map(section =>
```

Sections emit in fixed order — `favourite_foods` (`engine.ts:244`) · `discovery` (`:372`) · `family_traditions` (`:519`) · `seasonal_habits` (`:584`) · `food_journey` (`:665`) — and an empty section is **never pushed** (`:706`). So `.slice(0, 2)` takes the first two **non-empty** sections.

> **Therefore `family_traditions` renders only for a household with at most *one* of {favourites, discovery}. A household that has both — which is every household with a real history — never sees a tradition, a seasonal habit, or a food journey at all.**
>
> **"Friday became pizza night" is visible only to a household that has no favourite foods. The better the family's story gets, the less of it they are told.**

Three of the five story types have, as far as this audit can establish, **no reachable rendering path in the product**.

### 7.3 The weekday the tradition is keyed on is invented

`familyTraditions` groups by `e.date.getDay()` (`engine.ts:418`). That date is manufactured in `server/lib/household-history.ts:44-46`:

```ts
const approxDate = new Date(
  now.getTime() - (weeksAgo * 7 + Math.max(0, 6 - day.dayOfWeek)) * MS_PER_DAY,
);
```

It must be, because **`planner_entries` has no date and no `createdAt`** (`schema.ts:438-454`); `planner_weeks` carries only a `weekNumber` (`:424`) and `planner_days` only a `dayOfWeek` (`:433`). The date is back-projected from `now` in whole-day steps.

**The consequence:** the derived `getDay()` shifts with **the day the query runs**. *The same planner "Monday roast" is a Monday tradition if computed on one day and a Thursday tradition if computed three days later.*

**And the module that builds it documents a safety claim its own consumer breaks** (`household-history.ts:18-20`):

> *"`date` is the same deliberate approximation it has always been (planner weeks carry a week number, not a date), and **the engines downstream use it only for recency ordering**."*

`engine.ts:418` reads it as a **weekday**; `engine.ts:534` reads it as a **season** (§ 8.3). **Neither is recency ordering.** The docblock's justification is not wrong about its intent — it is wrong about its consumers.

This is `THA_HOUSEHOLD_TIME_ARCHITECTURE.md`'s **Rule HT7** exactly: *`planner_weeks.weekStartDate`, written only at week creation and never back-filled, **because a back-filled anchor is the fabrication the architecture exists to retire***. **`buildHouseholdHistory` is that fabrication, and the household's traditions are its output.**

`TIME3:401` already counted it — *"Fabricated-date builders — duplicated despite a docblock stating the extraction exists to prevent it | 2 → 0"* — and the duplication is verified: `routes.ts:11364-11400` is a **verbatim copy** of the extracted module, and **the six story routes call the copy** (`:11411`, `:11458`, `:11482`, `:11550`, `:11628`, `:11740`) while only `notice-gateway.ts:321` calls the extraction. **The module built to prevent the second copy lost to it.**

### 7.4 What traditions cannot yet be

**Annual and calendar traditions are not representable.** No recurrence, annual, birthday, Christmas or holiday concept exists anywhere in `shared/`, `server/` or `client/`. With a horizon of a few planner weeks and no real dates, *"we always have this at Christmas"* cannot be expressed — and `shared/seasonal/trust.ts:52` **deliberately bans** "annual review" language.

**Recorded as a boundary, not a backlog.** `ORCH1:647` is explicit that THA's horizon is *"a boundary the architecture drew deliberately and almost perfectly … the alternative to a horizon is surveillance of a family's table."* A tradition THA cannot witness is one it must not narrate. **The honest tradition is the one the household's own data already evidences — and even that one currently drifts by weekday.**

---

## 8. HOW SEASONAL COOKING NATURALLY APPEARS

**Owned completely, stated four times, and the canon's answer is more precise than the question.**

### 8.1 The house has one season; the household has four

`BLUEPRINT § 6.1:207` — *"**One orchard.** One canonical environment, one owner, **one season**: perpetual bright morning, in leaf, tended."* `OHDB § 11:189` — *"**The Orchard House has one season and one hour, and this is a deliberate design decision, not an unfinished one.**"* `OHDB:193` — seasonal dressing *"was **considered and declined**"* (`EXP5:788-790`).

**And yet the Orchard Living Book has four season chapters.** The resolution is the whole answer to this deliverable, and `OLB` states it four times in four chapters:

> **Spring** (`OLB:151`) — *"The family's year turns, **even though the house's morning does not**. … What is springlike is in the ***family's*** life — what they feel like eating … **the house simply holds it, the way a good kitchen holds every season of a family's cooking without redecorating for each one.**"*
>
> **Spring** (`OLB:155`) — *"The Companion notices the household's real rhythms, **not the calendar's costume** … **Its care shows in understanding *them*, not in dressing the house for a date.**"*
>
> **Autumn** (`OLB:177`) — *"The Companion follows the household into heartier, homelier cooking … as a quiet understanding of their life, never as an autumn theme laid over the house. **It reads the family's season in what they cook, not in a calendar.**"*
>
> **Winter** (`OLB:188`) — *"the friend who makes the warm simple things easy … **never brightens falsely to fight the season** on the family's behalf."*

> **The canon's answer, in one line: seasonal cooking appears in *what the family cooks*, and nowhere else. Never in the room's light, never in the orchard, never on a date.**

**The Cookbook is the room this law was written for**, because it is the only room whose *content is food* — which makes it the one place a season can appear **honestly** (through the household's own cooking) and the one place it is most tempting to appear **dishonestly** (as autumn leaves on a recipe card). § 11.2.

### 8.2 The engine's answer — again, exactly right, and again in the Pantry

`stories/types.ts:31` — `"seasonal_habits"`: *"Summer became: Tomatoes, Basil, Courgettes."* Section title *"Your seasonal habits"* (`:163`). It is derived **entirely from the household's own history** — `stories/engine.ts:534-577` counts the foods the family actually used in that season and names them back. **That is `OLB:177`'s sentence — *"reads the family's season in what they cook"* — implemented.**

`shared/seasonal/engine.ts` (WS11) composes it into a season's story, and its design contract is the canon's, written independently (`:16-23`):

> *"Count **UP**, never down … **Memory, never report card** — a season is recalled, never graded … **Empty is silent** — a barely-cooked season yields few or no blocks, never a padded 'you only…' consolation … **Trust by non-computation** — no ranking of seasons, no 'best', no progress metric is ever calculated, **so none can leak into a future edit**."*

`:12` — *"**Nothing is stored** … no 'season report' table, no cached favourite, no saved summary — **by design, so a seasonal scorecard cannot quietly accrete.**"*

**It renders at `PantryKnowledgeHub.tsx:227`** (`seasonalData?.blocks.find(b => b.type === "seasonal_habits")`) and as the Pantry Explore topic `seasonal-foods` (`:122`). **Not in the Cookbook.**

### 8.3 The season is computed from a date THA invented, in a frame the architecture forbids

Three season implementations exist, exactly as `TIME3:400` counted (*"one exported, two private and byte-identical | 3 → 1"*):

| # | Location | Derivation |
|---|---|---|
| 1 | `shared/discovery/seasonal-map.ts:63-69` `seasonForDate()` — the only exported one | `date.getMonth()`, 0-indexed |
| 2 | `shared/stories/engine.ts:137-143` `seasonOf()` — private | `date.getMonth() + 1` |
| 3 | `shared/seasonal/engine.ts:96-102` `seasonOf()` — private | `date.getMonth() + 1`, identical to #2 |

**They agree behaviourally** (fixed UK meteorological seasons; `seasonal/engine.ts:89-94` explicitly asserts the three-way match). **The duplication is a maintenance risk, not a live divergence** — an honest distinction worth preserving, since three-that-agree is a different defect from `TIME2`'s five-that-disagree.

**Two things about them are not benign:**

1. **All three call `date.getMonth()` — server-process-local.** `TIME3`'s CIVIL/INSTANT model (`README.md:29`) is decisive: *"**every INSTANT consumer in THA is correct and every CIVIL consumer is broken.**"* A season is the purest CIVIL fact in the product — *if this household moved to Tokyo tomorrow, would this value have to change?* Yes, and twice over: the hemisphere inverts. `seasonal/engine.ts:89-94` concedes the point and defers it on the honest grounds that *"the entire current food catalogue and seasonal seed are UK."*
2. **`stories/engine.ts:534` calls `seasonOf(e.date)` on the fabricated `approxDate`** (§ 7.3). **The household's seasonal habits are computed from a manufactured calendar.** *"Summer became: Tomatoes, Basil, Courgettes"* — the **summer** is back-projected from `now`.

> **The Cookbook's seasonal story is the canon's law implemented perfectly on top of a date the platform made up.** The engine reads the family's season in what they cook, exactly as `OLB:177` requires — and then asks a fabricated clock which season that was.

**The seasonal food data itself** (recorded for completeness, since it bounds any future work): `SEASON_SEED` (`shared/discovery/seasonal-map.ts:22-61`) is the operative list at **30 slugs across four seasons**, deliberately small. `canonical_food.peakSeasons` (`schema.ts:2238-2241`) is *declared* to absorb it and become the fact owner, at **~18% coverage (59 of 318 entries)**; the absorption has not completed. `knowledge_foods.seasonality` (`:1541`) is marked **display-only, explicitly not a source of truth**. Finest resolution anywhere: one of four buckets. **There is no month-level or harvest data.**

---

## 9. HOW THE COMPANION QUIETLY PARTICIPATES

**Owned in full**, four times, and cited rather than restated:

- **Its place** — `BLUEPRINT § 13:323-335`: *"not a room… the person in the house"*; *"**One presence, one fixed chair**"*; *"**It arrives a beat after you** … no pulsing, no typing theatrics, no simulated mood, no face."*
- **Its translation into interface** — `TRANSLATION1:369-383`: *"**Invited, not intrusive; suggesting, never deciding; honest about its limits; silence a valid state.**"*
- **Its volume** — `NOTICE_ENGINE § 6:172-183`: *"**Honest absence.** No producer data → no notice → an empty set. The engine never pads, never invents a 'tip of the day'."*; `:138` — *"**Silence is a first-class outcome.**"*
- **Its conduct in *this* room** — `OLB:78`: *"The Companion is **the friend leaning on the counter while you leaf through** — happy to say *'you loved this in the winter'* or *'this one's quick tonight'* if you want it, happy to stay quiet while you decide. **It never turns the browsing into a task or the book into a store.**"*

### 9.1 The friend has no chair in this room

**Verified: the Companion is not in the Cookbook at all.**

- `grep 'AmbientIntelligence'` across `client/src` returns **zero hits in `meals-page.tsx`**. `surfaceKey="cookbook"` returns **zero results product-wide**.
- The system's own declaration names this room first among the surfaces it expects (`client/src/components/intelligence/index.ts:4-5`): *"Home, **Cookbook**, Planner, Shopping, Pantry, Food Pages"*, with `:48-52` — *"the ONE ambient surface. **Every page that surfaces the Decision Engine's opportunity bundle mounts this and nothing else.**"*
- `AmbientIntelligence` is mounted on dashboard, planner, shopping, pantry and nutrition. **The Cookbook mounts it nowhere.**
- `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md:97` names the domains that *"must adopt the Companion Card framework"*. **No Cookbook Companion Card exists.**

**This cuts both ways, and the honest reading is not the obvious one.** `PLAN1 § 7.1` found the Planner running **two** ungoverned notice channels stacked, and `NOTICE_ENGINE:250` calls a second channel a stop condition. **The Cookbook's absence is therefore the compliant state, not the broken one** — it has no convergence debt to retire, and it is the only room that can adopt the Companion Card *correctly the first time*, with nothing to delete first.

> **The Planner must evict a fixture wearing the Companion's name. The Cookbook only has to offer a chair.** `OLB:78`'s friend leaning on the counter is not in the room — and the room is clean enough that putting them there is an addition, not an excavation.

### 9.2 The Companion already knows the family's stories — and only it does

`server/lib/household-companion-fields.ts:38`, `:89` calls `stories()` with `types: [...]` including `family_traditions`. So the Companion **can** say *"you loved this in the winter"* — `OLB:76`'s exact line — because WS10 computes it.

**Combined with § 5.2, § 6.4 and § 7.2, the picture completes:** the household's favourites, discoveries, traditions, seasonal habits and food journeys reach exactly **two** places — the Companion's context, and a Pantry drilldown that truncates three of the five away. **The room they are about renders none of them.**

### 9.3 The unasked question, recorded

`PLAN1 § 7.3` recorded that no governing document says what the friend does when **two people** are at the table. It lands here identically and with one addition: `buildHouseholdHistory(userId)` (`household-history.ts:28`) takes a **user id** and reads **one member's** planner weeks — yet its return type is named **`HouseholdHistory`** and its section titles say *"**Your household** loves"* (`types.ts:160`).

> **The type is called `HouseholdHistory`. The function takes a `userId`. THA is already telling one person that their own history is their household's.**

Recorded as an observation with citations, not adopted as a rule. It is `PLAN1 § 6`'s co-authorship seam, wearing the Cookbook's clothes, and it routes the same way.

---

## 10. MOMENTS OF DELIGHT

**The list of qualifying moments is closed, and the Cookbook does not get to extend it.** `EXP ARCH § 17.9:335-341` owns which moments qualify: a household's **first genuine outcome**; the **completion of a journey that had real effort in it** — *not the completion of a step*; an **honest milestone the household would themselves recognise**. Everything else *"resolves quietly and without ceremony."*

Applying that owner to this room — application, not invention:

### 10.1 The Cookbook's delight is recognition, and it is already specified

`OLB:74` — *"The pleasure is **recognition**: *oh, this one*, and the small warmth of a page that has clearly been opened before."*

This is delight as **care perceived**, and it is the premium test's exact shape (`EXP ARCH:372`): *"if the household would not feel the care, it is decoration; if they would feel its absence, it is craft."* A family would feel the absence of their own book immediately — as a catalogue. **They would never name it. That is the point.**

**Its correct register is a half-step of warmth and nothing else** (`BLUEPRINT:312`). Not a badge, not a rank, not a label. **The delight is that the page falls open. It is not that the page tells you it fell open.**

### 10.2 The genuine milestone this room could own, and its precondition

*"Tomatoes became a family favourite"* (`types.ts:28`) is an **honest milestone a household would themselves recognise** — it qualifies under § 17.9 on its face, and it is already computed.

**But it is not yet honest**, for the reason in § 5.3: a favourite derived from plan counts is a milestone about **intention**, not about the family's life. `EXP ARCH § 17.9`'s bar is *"something real happened for the household"*. **A meal placed in a slot six times and never cooked is not something that happened.**

> **The Cookbook's one qualifying delight is available the moment the wire `ORCH1 § 1.4` names is connected, and not one day before.**

### 10.3 The delights *not* to build, recorded with their refusals

- **The favourite star.** Refused — § 5.1. A declared favourite is a rating; `BLUEPRINT:312` forbids the rank and `stories/types.ts:13` forbids the score. **The absence of this button is compliance. Recorded so a future workstream does not "fix" it.**
- **The streak, the rank, the "you've cooked 50 meals!" badge.** `OLB:80` — *"a streak or a rank competing with the food"*; `TRANSLATION1:367` — *"no scores as trophies, streaks, notification piles, guilt"*; `EXP ARCH:213`.
- **A seasonal celebration.** *"Your autumn wrapped!"* — refused: it is a **report card** (`seasonal/engine.ts:17`, *"Memory, never report card"*), and `:12`'s *"no season report table… so a seasonal scorecard cannot quietly accrete"* is a refusal written into the architecture of the engine itself. **The engine was built to make this specific delight impossible. Recorded so nobody rebuilds it above the engine.**

### 10.4 The moment the Cookbook must never claim

**A planned meal is not a cooked meal, and this is the room where that lie is currently told** (§ 5.3). `ORCH1:39` is precise about where the canon's own list stops: *"`EXP ARCH § 17.9` … names them: 'a first plan made, a first list completed'. **It does not name a first meal cooked.** The canon's celebration list stops exactly where THA's sight stops."*

**The Cookbook may celebrate a page that was opened. It may never celebrate a meal that was eaten** — until the Diary tells it one was.

---

## 11. ANTI-PATTERNS TO AVOID

Every one is **already forbidden by a rule with an owner**. Listed because the Cookbook is the room each is most likely to enter, with the entry route named.

### 11.1 The drawn book — the theme park

`OLB:80` — *"**Never here** — a drawn book with turning-page theatrics."* `OHDB:248` — *"A drawn book with page-turn animation (the theme park)."* `BLUEPRINT:439` — *"illustrated kitchens, drawn furniture, wood-grain, **page-turns**… the moment it becomes a picture of a table, the place has become a costume."*

**Entry route: the word "cookbook" itself**, which is the most literal noun in the map. `BLUEPRINT:167` binds it: *"The analogies are **feelings to design toward, never pictures to draw**."*

### 11.2 Seasonal dressing — the room's most attractive violation

`OHDB § 11:193` — *"A seasonal theme — autumn leaves in October, snow in December, spring blossom in April — is precisely the kind of temporary, fashionable charm § 14 forbids… it is a second orchard by the back door."* `EXP5:788-790` — declined categorically. `OLB:157` — *"Never here — the house or the orchard putting on spring dressing; blossom, pastel, or seasonal decoration mistaken for warmth."*

**Entry route: this mission's own deliverable.** *"How seasonal cooking naturally appears"* is one word away from *"how the Cookbook looks in autumn"*, and the two are opposites (§ 8.1). **The season appears in the food, never in the room.** This is the single most likely misreading of § 8 and it is recorded here for that reason.

### 11.3 The book made into a store

`OHDB:242` — *"a well-loved book, **not a store**."* `OLB:78` — *"It never turns the browsing into a task **or the book into a store**."* `EXPLANG:400` — *"browsing a shelf, **not querying a database**."*

**Entry route: discovery** (§ 6.3). A four-tab control whose second tab is the world's recipes, and a *"From the Web"* section above the family's own meals, is the family's book **arranged like a shop**. Recorded, not graded — the resolution is `BLUEPRINT`'s, not this document's.

### 11.4 The catalogue of what they haven't cooked

`OLB:80` — *"**Never here** — the family's own cookbook made to feel like **a catalogue of everything they haven't cooked**."* `stories/types.ts:14` — *"NO deficits ('only X times', 'fell short')"*; `seasonal/engine.ts:20` — *"a barely-cooked season yields few or no blocks, **never a padded 'you only…' consolation**."*

**Entry route: an empty or thin book.** A new household's Cookbook genuinely *is* mostly things they haven't cooked, and every honest instinct — "suggest more!", "you've only tried 3 of 30!" — converts P1's *their book* into a measure of what it lacks. **`BLUEPRINT § 6.2`'s empty-state rider is the only sanctioned response: "Empty states may open the window one level, never two"** — E2→E3 at most, and only when genuinely empty. **The answer to an empty book is more light, not more prompting.**

### 11.5 The orchard behind the recipe

`BLUEPRINT § 6.1` — *"**The orchard never carries text.**"* `OHDB:248` — *"**the window covered by cards**."* E2 is *"a framed, partial presence in **one committed region the content deliberately does not cover**"* (`BLUEPRINT:222`).

**Entry route: already taken, and not by this room's code.** § 12.2 — the global backdrop plus `bg-card/82` puts 18% of the orchard behind every recipe. **The Cookbook is E2 and is currently rendered as wallpaper**, which is the `BLUEPRINT:439` anti-pattern *"the orchard applied uniformly behind everything, at one strength, on one plane."* **NORTH1 § 5.5 predicted this room specifically**, having watched the North Star's own Cookbook plate fail: *"the whole frame is environment: **all view, no room**"*; *"it shows the render's grammar does not survive contact with functional density."*

### 11.6 Clinical white — the opposite failure

`EXPLANG § 3A.4` — *"**Calm must never become lifeless.**"* `NORTH1:79-80` — *"**One cold plane breaks the room**, and it breaks it more than any other single error, because coldness is the one failure the canon calls unrecoverable."*

**Entry route: fixing § 11.5.** Identical to `PLAN1 § 10.5`, and **more dangerous here**, because this room's warmth is supposed to come from *the food itself* (`EXP5:362`) — so a household whose meals have no photography would be left with a genuinely cold shelf the moment the opacity crutch is removed. **The Cookbook must get clearer without getting colder, and it has the least fallback if it does.**

### 11.7 The Companion deciding what the family cooks

`OLB:78` — *"happy to stay quiet while you decide."* `TRANSLATION1:371-383` — *"suggesting, never deciding."* `NOTICE_ENGINE:135` — *"**No notice executes anything.**"*

**Entry route: a "cook this tonight" auto-pick.** Not currently possible — the Companion is not in this room at all (§ 9.1) — which makes this the anti-pattern to record *before* the chair is offered, not after.

---

## 12. WHAT THE LIVE COOKBOOK IS DOING INSTEAD — REPORTED, NOT FIXED

Verified against live code at `7d1dd2ce`. **Nothing here was changed.** Each is a **conformance defect against an owned rule** — `NORTH2:220-229`'s category: *"not gaps in the architecture; they are the product disagreeing with it… **All of them require work.**"*

The Cookbook is **one file reached by two routes** — `/meals` and `/cookbook` both resolve to `meals-page.tsx` (`App.tsx:384-385`), **6,987 lines**.

### 12.1 The arrival is clean — reported as a PASS, and it is the first one

On a default logged-in, non-demo, non-searching arrival, the DOM path from `<div data-realm="cookbook">` (`meals-page.tsx:3500`) to the first meal `<Card>` (`:3941`) passes through **two layout divs and the grid**. Every candidate lobby element is conditional:

| Element | Line | Guard |
|---|---|---|
| Planner-import banner | `:3502-3522` | `plannerImportCtx` |
| "from list" hint | `:3525-3540` | `isFromList` |
| Demo promo card | `:3547-3555` | `user?.isDemo && !searchTerm` |
| Search-source filter tabs | `:3557-3590` | `searchTerm.length >= 2` |
| "From the Web" section | `:3593-3905` | web results present |

The only unconditional chrome is `WorkspaceHeader` (`:3401`) with its search field and four tabs.

> **Against `EXPLANG:400` — *"a warm, appetising place that feels like browsing a shelf"* — the Cookbook opens onto the shelf.** `PLAN1 § 11.1` found five always-on strips between the Planner's edge and the first cell of the week. **This room has none. It is the compliance finding of this audit, and it is worth as much as any defect below.**

### 12.2 The orchard is behind every recipe

- `client/src/components/layout/orchard-backdrop.tsx:18` — full-bleed `/orchard-bg.webp`, **`opacity: 0.90` hardcoded**, `fixed inset-0`, mounted once in the protected shell — **every room, including this one**.
- `client/src/components/ui/card.tsx:12` — `bg-card/82 backdrop-blur-md shadow-none`. Every meal card is an **82%-opaque** panel with `backdrop-blur-md`.
- Result: **18% of the orchard bleeds up through every recipe card, behind the recipe text.**

`BLUEPRINT § 6.1`'s *"the orchard never carries text"*, live, in an **E2** room rendered as **wallpaper**. This is `EXPCOMP2`'s and `PLAN1 § 11.2`'s opacity-crutch finding, in a **third** room — which is the point: **it is not a room defect. It is `card.tsx:12`, and it is everywhere.**

*(Recorded in passing, as `PLAN1 § 11.2` did: `--orchard-opacity` is defined at `index.css:73` / `:155` and **never consumed** — the backdrop hardcodes `0.90`, so dark mode gets the 90% orchard it was designed not to have.)*

### 12.3 The card grid is canonically correct — a second PASS

`meals-page.tsx:3916` — one grid, **individual `<Card>` per meal** (`:3941-3950`), each `shadow-none` (`card.tsx:12`).

**This is right, and it is right *here specifically*.** `BLUEPRINT:173` gives the Cookbook the ground posture *"Shelf; **recipe cards as objects you pick up**"* and `EXP5:376-378` calls them *"the most **object-like** surfaces in the product."* Where `PLAN1 P3` required the Planner to be **one** solid table and forbade nested cards, the Cookbook is the one room where discrete card objects are **the canonical posture**. **The two rooms' correct grounds are opposites, and both currently obey.** The remaining defect is the material bleeding through them (§ 12.2), not the structure.

*(One nuance, recorded not graded: cards carry a staggered entrance — `motion.div`, `delay: index * 0.03` (`:3935-3939`). Against `BLUEPRINT § 12.1 r5` — *"**Still.** No Living Detail moves"* — this is component motion rather than a Living Detail, so the rule does not reach it. Flagged for the room's eventual review under `UIA § 9`, not asserted as a violation.)*

### 12.4 "Cooked N times"

§ 5.3. `CookbookMealIntelligenceStrip.tsx:93`, `:183-186`; spread to `routes.ts:5691-5696`. **The only place in the codebase that breaks the trust model at `shared/stories/types.ts:20-24`, and the honest sentence exists at `food-detail-page.tsx:91-96`.**

**Reported as a PASS in the same breath, because it matters:** the strip **does not fabricate a zero**. It is quadruple-gated (`:78` `!active`, `:89` `!data`, `:104` `!hasAnything`, plus per-section gates), and the `?? 0` at `:93` is consumed **only** by the `> 0` test at `:99`. On no data it renders `null`. **`PLAN1 § 7.2` and `EXPCOMP2` found `plantCount ?? 0` rendering "0 of 30" on the Planner and Home. The Cookbook's strip is the same coercion written correctly.** Its file header states the rule in its own voice (`:6-9`): *"Empty sections are hidden; no placeholder text is shown. **No content is fabricated or estimated.**"*

> **The strip is honest about what it doesn't know and dishonest about what it does. It will not tell you a zero it never measured, and it will tell you a family cooked a meal they never made.**

### 12.5 The family's stories are in the Pantry

§ 5.2, § 6.4, § 7.2. `PantryKnowledgeHub.tsx:121`, `:206-207`, `:578`, `:828`; `/api/pantry/stories` (`routes.ts:11453`). **Three of five story types have no reachable rendering path.**

### 12.6 The dates are fabricated, twice, by two copies of the same function

§ 7.3. `household-history.ts:44-46` and its **verbatim copy** at `routes.ts:11364-11400`. Six story routes call the copy; one caller uses the extraction. `TIME3:401` counted this; it is confirmed.

---

## 13. CORRECTIONS TO THE CANON

**Both corrections are in the household's favour, and one of them is this document's own expectation being wrong.**

### 13.1 The Cookbook is not the Planner, and the audit's expected shape did not appear

This investigation began by expecting `PLAN1`'s findings: a lobby of strips, a fabricated zero, a room needing clearing. **Three of those are absent** (§ 12.1, § 12.3, § 12.4). **The Cookbook's structure, arrival and empty-state honesty are compliant**, and the room's defects are **one sentence** (§ 5.3), **one shared component** (§ 12.2, `card.tsx:12` — not this room's file), and **five stories filed in the wrong room** (§ 12.5).

> **This substantially re-aims the work. The Planner needs clearing. The Cookbook needs *connecting*.** Nothing in §§ 5–8 asks for a redesign; every one asks for something already built to be pointed at the room it was written about.

### 13.2 `BLUEPRINT § 12.2`'s "Cook/plan counts" should be read as a finding, not a source

`BLUEPRINT:312` sources the well-thumbed page from **"Cook/plan counts"**. **One of those two does not exist** (§ 5.3), and the slash reads as though the choice between them were an implementation detail. It is not: it is the difference between the room's entire premise and a fabrication.

**This document does not propose amending the Blueprint** — that would be filling a gap in an investigation, which `PKR1` R7 and `PLAN1 § 6.5` both forbid. It records that **the Blueprint's most quotable line about this room describes a fact the platform does not have**, and routes it (§ 14). *The correct reading of `:312` today is "plan counts", and `:312` does not say that.*

### 13.3 Not a correction — a confirmation worth recording

`NORTH1 § 5.5` judged the North Star's Cookbook plate *"the image disproving itself"* and predicted the mechanism: *"the render's grammar does not survive contact with functional density."* **The live Cookbook independently confirms the diagnosis from the other side**: it is a 6,987-line functional surface, and the orchard is behind every card of it (§ 12.2). **NORTH1 was right about this room before anyone looked at it.**

---

## 14. WHAT THIS DOCUMENT DID NOT DO

Stated explicitly, because the mission's constraints were explicit:

- **No screens designed.** No layout, no wireframe, no component, no ASCII sketch, no plate. §§ 3–11 are principles and citations only.
- **Nothing implemented.** No code, no schema, no migration, no route, no token, no colour, no value of any kind. **The `.slice(0, 2)` at `PantryKnowledgeHub.tsx:828` was not changed**, though it is a one-character fix — it is a live UI behaviour change and belongs to a workstream, not to an investigation.
- **No architecture modified.** All seven governing Experience documents, both Capability Cards and the Recipe Acquisition Architecture are **byte-untouched**. `docs/architecture/README.md` is untouched — this is an investigation and is not indexed as governing (`README.md:4`).
- **No rule created.** Applying `NORTH2`'s gate to my own output: every principle in §§ 3–11 traces to an owner. **If any statement here duplicates a rule owned elsewhere, the statement here is the defect** (`BLUEPRINT § 18`'s yield clause, applied to this file).
- **The § 5 / § 7 gaps not filled.** Named and routed, per `PKR1` R7. **No favourite affordance, no cook-log design, no tradition model, no seasonal ownership proposal.**
- **Nothing renamed.** The Cookbook remains the family's living cookbook (`BLUEPRINT:147`).
- **The § 12 defects not fixed.** Reported with file:line, as `EXPCOMP2`, `TIME2`, `HOME3` and `PLAN1` did.

**Gates re-run:** `.engineering/scripts/repo-structure-verify.sh` — `docs/investigations/ has no loose files` **PASS**. *(The pre-existing, unrelated FAIL on `.glibcheck.txt` / `.libdirs_uxhome.txt` at root persists — untracked before this session, noted also by `ORCH1` and `PLAN1`.)*

---

## 15. RECOMMENDED FOLLOW-ON WORK

By value, ordered by dependency. **The first two are one sentence and one number.**

1. **Stop saying "Cooked".** `CookbookMealIntelligenceStrip.tsx:183-186` and `routes.ts:5691-5696`. The honest sentence is already written for the same field at `food-detail-page.tsx:91-96` — *"has featured in your plans N times."* **This is a copy-paste from one file to another.** It closes the only breach of `shared/stories/types.ts:20-24` in the codebase, in the room where it does the most damage. § 5.3. **Do this first and alone; it is not blocked by anything and it needs no design.**

2. **Delete `.slice(0, 2)`** — `PantryKnowledgeHub.tsx:828`. Three of five story types are currently unreachable, and the households denied them are the ones with the richest histories (§ 7.2). **Verify before assuming a straight deletion is right**: five sections × three cards may be too much for a drilldown, in which case the fix is a considered limit rather than a truncation that silently prefers the first two types. **Either way, "the family with the most history sees the least of it" is not a defensible resting state.**

3. **Give the Cookbook its family's stories** — the most valuable item here, and the only one that is not a fix. Favourites, discoveries, traditions and seasonal habits are computed, tested, and rendered **in the Pantry** (§ 5.2, § 6.4, § 7.2, § 8.2). The room they are about renders none of them. **This is not a build; it is a re-pointing.** Recommended shape: an investigation (`COOK2`?) that (a) decides whether `/api/pantry/stories` is misnamed or the Cookbook needs its own composition; (b) applies `BLUEPRINT § 12.2`'s ceiling — *"a half-step surface warmth; **never a badge, rank, or label**"* — since story **cards** in a room whose Living Detail is **warmth** may already exceed the budget; (c) routes through `COMPANION_CARD:97` rather than inventing a Cookbook panel, per `NOTICE_ENGINE:250`. **Do not skip (b): the stories are text, and the room's permitted sign of life is not.**

4. **Name and route the family's book** (§ 1.1, § 1.2) — the deepest item, and the one with the longest shadow. `meals.userId` is `notNull` with no `householdId`, and `capabilities/meals.md:29-32` **already records this as governing architecture**. The Experience canon calls the room a family's; the Capability Card says no family exists in it. **Neither document is wrong; they have never been read together.** This is `PLAN1 § 6`'s co-authorship seam in its sharper form — the Planner at least *has* a `householdId`; the Cookbook has no column to scope by. **Note the asymmetry that makes it urgent** (`meal-intelligence-assembler.ts:351`): planner counts are scoped by `plannerWeeks.householdId`, so **the Cookbook already tells you "your household planned this 5 times" about a meal only one member can see.** Any workstream here must decide whether `meals` acquires a household scope or the room's name changes — and `EXP ARCH:211` (*one name per concept*) binds that decision. **It cannot be settled by an investigation, and this one did not try.**

5. **`TIME4` reaches this room too, and TIME2's matrix does not know it** (§ 7.3, § 8.3). The Cookbook's traditions drift by weekday and its seasons are back-projected, both from `buildHouseholdHistory`'s `approxDate` — **Rule HT7's fabrication, named and unbuilt**. Cheap and adjacent: **`routes.ts:11364-11400` is a verbatim copy of `household-history.ts`** and six story routes call the copy (`TIME3:401` counted it; § 12.6 confirms it). **Deleting the copy is a pure deduplication that unblocks the anchor's single point of entry.** The stories engines should be recorded as consumers in `TIME2`'s matrix — as `PLAN1 § 14.5` said of the Planner, they are not there, and they are among the most CIVIL consumers in the product.

6. **Offer the Companion a chair** (§ 9.1) — **last, and deliberately so.** The Cookbook is the only named surface with no ambient presence, which makes it the only room that can adopt the Companion Card *correctly the first time* with nothing to evict first. **That advantage is worth more than the feature**: `NTC-P2` should retire the Planner's two ungoverned channels (`PLAN1 § 14.3`) **before** a third room acquires one, so the Cookbook inherits the converged pattern rather than a fourth variant of it.

**Explicitly not recommended:** any Cookbook visual prototype. `EXP5:951` fixed the sequence — *"EXP5-P2 Cookbook and EXP5-P3 Planner as separate follow-ons, **each a fresh decision** informed by P1's photographs"* — and **P1 (Home) has not run.** Also not recommended: **a favourite button** (§ 5.1, § 10.3) — its absence is compliance, and it is the most likely thing for a well-meaning workstream to add.

---

## 16. THE ONE THING TO REMEMBER

> **The Cookbook is the family's living cookbook, and it is the only room in the house named for a family that does not have one. Its warmth comes from the food; its light comes across the page from a window it earns more of than any room but Home; its pleasure is recognition, not choosing; and its one sign of life is that a loved page falls open on its own — a half-step of warmth, never a badge, never a rank, never a score.**
>
> **All of that was already written. So were the family's favourites, their discoveries, their traditions and their seasons — written, typed, tested, running, and read aloud in the Pantry, behind a heart emoji, between "gut health" and "seasonal foods". The engine that computes them refuses rankings in the same words the canon does, and the two have never been introduced.**
>
> **The work is not to define this room. It is to stop telling a family they cooked a meal they only planned, to stop hiding their traditions from them for the crime of having favourites, and to hand the family's own book back the story it has been keeping about them in another room.**
