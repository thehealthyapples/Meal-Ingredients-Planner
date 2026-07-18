# HOME2 — The Canonical Home Decision Model

## How THA determines the single primary action on Home

**Status:** INVESTIGATION — a design and a recommendation. **Not** governing architecture, **not** a specification, **not** implementation. It creates no rule, no experience principle, and no second owner (Architecture Principle 2; Experience Principle 6; Blueprint § 18). **It amends nothing and builds nothing.**
**Classification:** Experience Governance (investigation) — with Intelligence Governance dependencies
**Date:** 2026-07-16 (HOME2)
**Rollback ID:** `rollback/HOME2-canonical-home-decision-model-20260716` → `7d1dd2ce`
**Question designed against:** *"The Experience Architecture already requires Home to present one obvious next action. How does THA intelligently determine that one door?"*
**Reviewed against:** [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) · [`THA_EXPERIENCE_BLUEPRINT.md`](../../architecture/THA_EXPERIENCE_BLUEPRINT.md) · [`THA_EXPERIENCE_LANGUAGE.md`](../../architecture/THA_EXPERIENCE_LANGUAGE.md) · [`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) · [`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`](../../architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md) · [`THA_KEPT_ROOM_TRANSLATION.md`](../../architecture/THA_KEPT_ROOM_TRANSLATION.md) · [`ARCHITECTURE_PRINCIPLES.md`](../../architecture/ARCHITECTURE_PRINCIPLES.md) · [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](../../architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md) · [`THA_DECISION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_DECISION_ENGINE_ARCHITECTURE.md) · [`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`](../../architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md) · [`THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md`](../../architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md) · [`THA_OBSERVATION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md) · [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) · [`CANONICAL_PUBLICATION_ARCHITECTURE.md`](../../architecture/CANONICAL_PUBLICATION_ARCHITECTURE.md) · `docs/architecture/README.md` (Architecture Bootstrap, STEP 2)
**Prior work read:** [`HOME1`](./HOME1_ARRIVAL_BEHAVIOUR_INVESTIGATION.md) · [`EXPCOMP1`](./EXPCOMP1_THA_EXPERIENCE_COMPLIANCE_STANDARD.md) · [`NORTH1`](../../implementation/ux/NORTH1_THE_VISUAL_NORTH_STAR.md) · [`NORTH2`](./NORTH2_EXPERIENCE_ARCHITECTURE_REFINEMENT.md)
**No Home redesigned, no code written, no architecture modified, no second decision engine designed, no experience principle created.**

---

## 1. THE HEADLINE FINDING

**The model is designable, total, and calm — and six of the ten inputs the mission names do not exist.**

That is not a shortfall in the design. It is the design's most important constraint, and finding it was most of the work:

> **THA cannot answer *"what is planned for today."*** The planner has **no calendar date field at all** — only `weekNumber` (int) and `dayOfWeek` (int) (`shared/schema.ts:420-454`). And **the server has no timezone, no local time, and no notion of "today"** — not a column, not a library, not one `Intl.` call in the whole of `server/`. The entire attention/decision stack is **deliberately clock-free by construction** (`shared/attention/decision.ts:20-22` — *"PURE AND ZERO-I/O by construction — no clock, no randomness"*).

Two consequences follow, and they shape everything below.

**First: the model must be total *without* a clock — and that turns out to be a virtue, not a compromise.** A door that cannot read the hour cannot jitter with the hour. Every mechanism the mission asks for under *"calm, stable, not reactive"* falls out of clock-freedom for free, rather than needing to be engineered back in.

**Second: `TRANSLATION1` *Morning Rhythm* § 8 is currently unimplementable, and it is law.** It requires that *"the one primary action is **re-aimed by relevance across the day** — look at the week in the morning, start tonight's dinner at the dinner hour."* THA cannot do this today, and the blocker is **not** the missing timezone — it is the planner's missing calendar anchor. Even a perfectly correct local date cannot be joined to a `planner_week`, because no such join exists. **This is a platform gap, not an architecture defect** — the law is right, the facts are absent — and it is recorded in § 8.1, not fixed here.

**The model that survives these facts:**

> **The Home Primary Action is resolved by a pure, total, deterministic resolver over a fixed four-tier ladder of canonical household state — safety, then plan, then shop, then the floor. It ranks nothing, learns nothing, persists nothing, and reads no clock. It consumes the Decision Engine's already-governed output at the safety tier and never reaches around it. It is a *peer* of the Decision Engine, in the exact class the Silence Rules occupy — never a second one.**

And the single sentence that makes it calm, which is a property of the construction rather than a rule added on top:

> **The door changes when the household's state changes, and never when THA's opinion changes.**

---

## 2. THE FIRST QUESTION: IS THIS A DECISION, A SELECTION, OR SOMETHING ELSE?

This had to be settled before any design, because getting it wrong produces the one artefact the mission forbids — a duplicate decision engine. THA's canonical Decision Engine has a strong, explicit claim over adjacent ground:

- **DEC1 § 1** owns: *"Which already-true, already-prioritised items surface NOW — **where**, in what order, within what budget — and why did the rest not?"* — and **"where" is surface routing**, listed inside the DECISION stage's owned mechanics (§ 2).
- **DEC1 § 7** is a tripwire: *"A workstream adding surfacing logic anywhere else must **STOP** and be pointed at this document."*
- **DEC1 § 8** names what must never be built: *"A central `DecisionEngine.decide()` that domain engines call to rank their own candidates — absorbs Selection (TIP1 R4)."*

### 2.1 The asymmetry that settles it

> **The Decision Engine's output may legitimately be empty. The Home Primary Action may never be.**

This is not a detail. It is a structural proof that the two answer different questions, because **a total function cannot be implemented by a partial one.**

The Decision Engine returns an empty bundle in four distinct ways (`framework.ts:855`, `:781`, `:801`, `:773-776`), and it is *designed* to — even the empty moment seals a decision whose reasoning reads *"No producer contributed this moment — the bundle is honestly empty. Nothing was suppressed by decision"* (`framework.ts:678-682`). The Notice Engine is more emphatic still: **"Silence is a first-class outcome"** (INT20 § 4), and Silence Rule 5 guarantees *"No producer data → no notice → an empty set."*

Home's door must be exactly one, always. **So it cannot be a Notice, and it cannot be the Decision Engine's top item** — both are allowed to be silent, and the door is not.

### 2.2 The deeper reason: whose judgement is it?

The asymmetry is a symptom; this is the cause.

| | The Decision Engine / Notice Engine | The Home Primary Action |
|---|---|---|
| **Question** | *"Which of the things **THA has noticed** deserve this household's attention now?"* | *"Where is **this household** most likely trying to go?"* |
| **Whose judgement** | **THA's** — the product's assessment of what matters | **The household's** — a reading of their own state |
| **Origin** | Product-initiated | Person-initiated |
| **May be empty** | **Yes** — by design | **Never** |

**Experience Principle 4 and § 7 make this decisive:** *"The primary action is **the person's most likely intent, not the product's most desired behaviour**."* If the door were the Decision Engine's top-ranked opportunity, Home's primary action would be, by construction, the product's most desired behaviour — **inverting the very principle the door exists to satisfy.**

> **The verdict: the door is neither a Decision nor a Selection. It is a *resolution* — a total function from canonical state to one destination.** It answers a question DEC1 does not ask, over facts DEC1 does not own, with a totality DEC1 cannot provide.

### 2.3 The class it belongs to — and its precedent

THA has already built exactly this shape, and it is the **Behaviour Engine's**:

> **INT21 § 4.1:** *"**Fail-safe default.** `getPersonality()` normalises any unknown, missing, or malformed id to `companion`. **There is no error state at the voice seam — a broken preference degrades to the default voice, never to silence or a crash.**"*
> **INT21 § 2.4:** `resolveBehaviour` is *"**Total**: every input — `null`, an unknown id, a malformed value — resolves to a registered voice."*

So THA already has a governed precedent for a **total resolver that always yields exactly one registered value, with a fail-safe default, never silence.** The Home Primary Action Resolver is that shape, applied to destinations instead of voices. It is pure, zero-I/O, deterministic, and lives beside the entity spine — the class Principle 5 established and `shared/attention/decision.ts` occupies (DEC1 § 4: *"pure, zero-I/O, beside the entity spine — **not a store, not a service, not a capability**"*).

### 2.4 Why this is not a second engine — the precedent, stated

**DEC1 § 6 already blesses exactly this relationship**, for exactly this reason:

> *"The Silence Rules, guidance and proposal caps **keep their seams: they are consumers or peers of the Decision Engine's mechanics, never subordinates** — collapsing them into OD1 was explicitly rejected (it would merge two governed seams, against INT20)."*

The Home Primary Action Resolver is a **peer**, on precisely the footing the Silence Rules hold. It:

- **consumes** the Decision Engine's already-governed output at the safety tier, and **never reaches around it** to a producer's internals or raw tables — the pattern INT20 § 5.2 explicitly blesses (*"What is **not** legitimate is a channel that reaches around the capability to a producer's internals or to raw tables"*);
- **re-ranks nothing, re-derives no attention** (ATTN1 A1), **launders no confidence into attention** (A5), **absorbs no Selection** (DEC1 § 3.1);
- **reuses `shared/attention/decision.ts`** for its one ordering need, because writing a module-local sort, dedupe, or clamp is *"an architecture violation"* on arrival (DEC1 § 4);
- **adds no suppress/rank/budget code** — it adds a *ladder over state* and a *floor*, neither of which DEC1 has or wants;
- **owns one budget at its own seam** — `MAX_DOORS = 1` — exactly as the Silence Rules own `MAX_NOTICES_PER_MOMENT = 2` at theirs.

> **It is not a `DecisionEngine.decide()`. Nothing calls it to rank candidates. It ranks nothing.**

### 2.5 A naming warning, taken seriously

**"Door" is already taken twice in DEC1** — § 7 (*"Producer enrolment (**the door** for every future ambient surface)"*) and § 3.5 (*"Learning — reads only Confirmed Understanding through **EL2's one door**"*). A third "door" in the codebase would collide in grep and in review.

> **Recommendation: the artefact is named the *Home Primary Action* and its resolver the *Home Primary Action Resolver*. "The door" stays prose, in design documents only, and never becomes an identifier.** This document uses "door" as prose throughout and means the Home Primary Action every time.

---

## 3. WHAT THA ACTUALLY HAS — THE INPUT AUDIT

The mission names ten candidate inputs. Each was checked against the code and the Source of Truth Register. **This table is the most load-bearing thing in the document**, because a model built on an input that does not exist is a model that fabricates — and fabrication is forbidden by Core Principle 6 (*"No fabricated knowledge — honest gaps over invented facts"*).

| # | Mission's named input | Exists? | Reality |
|---|---|---|---|
| 1 | **Today's planner** | ⚠️ **PARTIAL** | The planner exists. **"Today" does not.** No date field anywhere (`schema.ts:420-454`); the only "current week" convention is `max(weekNumber)` (`routes.ts:11503-11505`), which means *"the highest-numbered week the household has created"* — **not the current calendar week**. |
| 2 | **Shopping state** | ✅ **YES** | `shopping_list.checked` (`schema.ts:195`). SoT Domain 15. FI4 already reads exactly this distinction (`opportunity-engine.ts:310`). |
| 3 | **Meal preparation** | ❌ **NO** | **Does not exist.** No table, column, endpoint, verb, or in-memory state for "this household is cooking meal X". Every `cooking` hit is static preparation *knowledge* (`shared/knowledge/preparations.ts:87-102`). The state between *planned* and *eaten* does not exist in this system. |
| 4 | **Household reminders** | ❌ **NO** (as an entity) | No reminders table, no scheduling, no snooze. Naturally so — a reminder needs a time, and § 1 explains why there isn't one. **Notice Engine notices exist** (8 categories, ≤2 per moment, may be empty) and are a different thing. |
| 5 | **Pantry state** | ⚠️ **PARTIAL** | Presence only — `defaultHave`, `needQuantityValue` (`schema.ts:1010-1025`). **No freshness, no expiry, no shelf-life, no purchase date.** Pantry is a *stock list*, not a freshness model. **And pantry has no domain in the Source of Truth Register at all** (§ 8.3). |
| 6 | **Companion observations** | ⚠️ **AMBIGUOUS — and one reading is forbidden** | Three different things share the word. `platform_observations` is **operator telemetry and may never be read by behaviour** (§ 3.1). Notice Engine notices: available. LEARN1 confirmed understanding: available, usually empty. |
| 7 | **Household goals** | ❌ **NO** | **No goals entity.** Only `user_preferences.healthGoals` — a free-text string array with no target, progress, or identity (`schema.ts:656`) — and `WEEKLY_PLANT_TARGET = 30`, a **global platform constant** no household can set or opt out of (`shared/nutrition/household-nutrition.ts:96`). |
| 8 | **Active journeys** | ❌ **NO** | **No journey or session-state entity.** `JOURNEY_CLUSTERS` is a static food taxonomy for ≥60-day retrospective storytelling; `JOURNEY_MAP` is a static capability-adjacency table. Neither is household state. |
| 9 | **Time and day** | ❌ **NO** (server-side) | **The server cannot know the household's local time.** No timezone column on any of ~90 tables; no `Intl.` in `server/`; no tz library. "Today" is client-computed and passed as an opaque text string (`GET /api/food-diary/:date`). See § 8.1. |
| 10 | **Existing intelligence services** | ✅ **YES** | DEC1/OD1 (1 producer, 3 opportunity types, 1 critical type), the Notice Engine (8 categories), LEARN1 confirmed understanding. |

**Six of ten do not exist as facts THA owns.** Per EXPCOMP1 § 4.3 — *"Where the canon is silent, **record silence as a gap** — never fill it"* — and Core Principle 6, **the model below reads none of them.** They are recorded in § 8 as gaps, and each is named as an extension point whose precondition is stated rather than assumed.

### 3.1 The forbidden input, named explicitly

**`platform_observations` may never aim the door.** The Observation Engine's § 7 is unambiguous and names routing first:

> *"**Any behaviour that reads an observation** — **routing**, permissions, confirmation tiers, phrasing, notices, learning — **stop.**"*

And its operational test, which the resolver must pass by construction: *"`OBS_DISABLE_CAPTURE=1` must always be a no-op functionally."* **If disabling telemetry changed which door Home shows, the resolver would be illegally reading telemetry.**

> **Consequence, stated once so it is not rediscovered as a "missed opportunity":** there is **no** "most-clicked door", no effectiveness feedback loop, no learned door weighting, and no A/B-tuned ladder. Not because it would be hard — because it is forbidden, and because it is the exact mechanism by which a calm door would become a reactive one.

---

## 4. THE CANONICAL MODEL

### 4.1 The contract

```
resolveHomePrimaryAction(state: HomeState) → HomePrimaryAction
```

| Property | Value | Why / owner |
|---|---|---|
| **Class** | Pure, zero-I/O, deterministic function beside the entity spine | Principle 5; the class `shared/attention/decision.ts` occupies (DEC1 § 4) |
| **Totality** | **Total.** Every input — including empty, broken, and unresolved state — yields exactly one action | The `resolveBehaviour` precedent (INT21 § 2.4, § 4.1): *"never to silence or a crash"* |
| **Cardinality** | Exactly 1. Never 0 (the floor), never 2 (first match wins; `clampLimit(1)`) | The mission's hard requirement; UIA § 5 (*exactly one primary-styled action per surface*) |
| **Clock** | **Reads none** | THA has none (§ 1); the stack is clock-free by construction |
| **Randomness** | **None** | Determinism is the base of stability (§ 6) |
| **Learning** | **None** | Observation Engine § 7; DEC1 § 8 (*"Any learned/adaptive threshold inside the engine — Rule P1"*) |
| **Persistence** | **None.** Owns no data, no table, no cache | Principle 2; DEC1 § 8 (*"A decisions DB table — … a table would be a second store of the same fact"*); Principle 7 (a synced cache over four owners is a **permanent sync bridge** — debt by definition) |
| **I/O** | **None.** The caller assembles `HomeState` from existing owners' read layers | Observation Engine § 4 rule 4 (*"Pure modules … never record — their callers do"*) |
| **Not** | Not a capability, not a service, not an engine, not a store | INT20 § 5.2 (*"not a capability and must not become one"*); DEC1 § 4 |

**The output is a destination, not an operation.** HOME1 § 7.1 fixed this and it binds here: Home is *read-only in spirit* (Experience Architecture § 4 — *"acting on something means moving to that thing's canonical place"*), so **the Home Primary Action is a departure**. The resolver returns *where to go and why*; it never returns something to be done at Home.

```
HomePrimaryAction = {
  tier:        0 | 1 | 2 | 3        // which rung matched — the whole explanation
  destination: <canonical route of an existing room>
  subject?:    <canonical id, when the tier has one>
  provenance:  "signal" | "floor"   // did a real fact aim this, or did the floor fire?
}
```

**`provenance` is provenance, never quality** — the INT21 § 2.4 discipline, reused verbatim in spirit: *"confidence is `1` when an explicit, recognised preference resolved and `0` when the platform default was applied instead. **There is no middle value, because there is no middle knowledge.**" A resolver over a deterministic ladder has no honest confidence in its own ladder; it only knows whether a signal fired or the floor did.

**The words are not the resolver's.** Every user-facing string — the label, the reason, the greeting — is registry content voiced at the one Behaviour Engine seam (INT21 § 0: *"No other component may reword, relabel, reorder-for-tone, or restyle what the platform has already decided to say"*). A hardcoded door label beside a Home route would be *"a second voice nobody chose"* (§ 10), and would re-open the debt CP3 exists to close (§ 8.5, § 9). **Composition order is non-negotiable** (INT21 § 7.2): *"Selection, then phrasing — in that order, with nothing in between."* The resolver picks the door; the Behaviour Engine says it; the voice may never retarget it.

### 4.2 The decision priority hierarchy

**A ladder, not a score.** First match wins. The tiers are a **total order**, so two tiers can never tie and a conflict is impossible by construction (§ 7.1).

> **The ladder is not an invented priority. It is the household's own sequence** — the path Experience Architecture § 10 already describes from intent (*"what's for dinner this week?"*) to resolution: **you make sure it's safe, you plan, you shop.** Every rung is that sequence; none of it is THA's preference about what the household should care about.

| Tier | Name | Fires when | Door | Owner of the fact |
|---|---|---|---|---|
| **0** | **Safety** | A `critical` opportunity is live in the Decision Engine's already-governed output | The subject's canonical page (today: a shopping item) | **DEC1/OD1**, consumed as-is |
| **1** | **The week is unplanned** | The household's current week (`max(weekNumber)`) has empty days | **Planner** — that week | Planner (SoT Domain 14), read directly |
| **2** | **The trip is pending** | The week has no empty days **and** the shopping list has unchecked items | **Shopping** | Shopping (SoT Domain 15), read directly |
| **3** | **The floor — the week** | Always | **Planner** — the current week | Planner (SoT Domain 14) |

**Tier 0 — Safety.** Rule T0's *additive face* (`shared/attention/index.ts:40-43`): *"never fail to surface an unsafe thing the household already has."* This is the one place the product's judgement legitimately aims the door — **and only because it isn't the product's judgement.** `shopping-restriction-conflict` says *the household's own shopping list contains something unsafe for their own household member*. That is a fact about their state, not an opinion about their priorities.

> **Tier 0's legitimacy is exactly as strong as `CRITICAL_TYPES`' closedness, and no stronger.** The allowlist has **exactly one member** today (`shared/attention/index.ts:89`), is governance-gated, and **throws** on violation (`assertCriticalAllowed`, `:115-123`) — degrading the offending producer's whole batch rather than surfacing an inflated harm signal. **If that allowlist ever grows to admit something that is not Rule-T0-backed, Tier 0 becomes a marketing channel at the threshold and this model becomes unsafe.** The dependency is stated here so that any future `CRITICAL_TYPES` review knows Home's door is downstream of it.

**Tier 1 before Tier 2 — plan before shop.** If the week isn't planned, the list is incomplete; shopping now means shopping wrong. This is the household's real sequence, not a preference.

**Tier 3 — the floor.** The floor is what makes the function total, and it is **honest, not filler**: today's plan is a real destination with real content, and *"how are we doing today, and what's next?"* (Experience Architecture § 4) is answered there whether or not anything is outstanding. A household with a planned week, a clear list, and no safety issue is not shown a manufactured task — it is shown **its own week**, which is the truthful answer to *what's next*. This is the distinction between a floor and filler: filler invents content to fill a space (forbidden — Blueprint § 12.1 rule 3, Experience Language Principle 8); a floor routes to content that already exists.

### 4.3 Two kinds of input, treated differently — and why

| Input class | Examples | How the resolver treats it |
|---|---|---|
| **Governed intelligence** | DEC1's delivered `critical` opportunities | **Consumed as-is.** Never re-ranked, never re-read from producers. Inherits muting, lifecycle suppression, de-duplication, and dismissal **for free** (INT20 § 5.2's blessed pattern) |
| **Plain household state** | Planner week shape; shopping unchecked count | **Read from the canonical owner's existing read layer.** Re-derived not at all |

Reading both is explicitly permitted, and the register says so — **Canonical Publication Architecture, Variant 3 (database-owned transactional domains):**

> *"For database-owned transactional domains, **multiple readers are OK if they all read from the same table (no re-derivation)**."*

**And the scope rule that keeps the two classes apart — muting silences notices, never doors.** This is not a new rule; it is the existing rule's scope. `mutedOpportunityTypes` is keyed on *opportunity type* (`framework.ts:319-326`) and means *"stop telling me about empty days."* It does not mean *"never send me to the Planner."* So:

- **Tier 0 consumes DEC1** and correctly inherits **lifecycle suppression** — a dismissed critical is terminal and must not re-aim the door, because dismissal there is *"the informed, per-instance"* act DEC1 preserves. Muting cannot reach Tier 0 anyway: `filterMutedTypes` exempts `critical` by construction (A3).
- **Tiers 1–2 read state directly** and correctly do **not** inherit muting. A household that muted empty-day *notices* still needs a Planner *door* when their week is empty. Routing a door through the mute list would over-apply a rule beyond its scope.

### 4.4 Explicitly rejected: a weighted score

A scoring function over signals was considered and refused. It fails on four counts, each citing an existing owner:

1. **It is a second ranking system.** `shared/attention/decision.ts`'s exports are *"the ONLY implementation of the Decision-stage mechanics; a module-local attention sort, limit-clamp pair, id-dedupe … **is an architecture violation**"* (DEC1 § 4). A bespoke Home score is that violation with extra steps.
2. **It oscillates.** Two signals near a threshold flip the door on trivial state changes — the precise *"reactive"* failure the mission asks to avoid. **A ladder cannot oscillate**: a tier either fires or it doesn't.
3. **It cannot explain itself.** A tier is one sentence (*"your week has empty days"*). A weighted sum is an archaeology exercise, and NK2 H5 requires *"every guidance decision is explainable."*
4. **It invites tuning, and tuning is drift.** Weights are knobs; knobs get turned; the door starts moving because someone changed a number rather than because the household changed a fact. That is the definition of THA's opinion changing, which § 6 forbids.

---

## 5. THE SIGNAL OWNERSHIP MAP

**The resolver owns nothing.** Every fact is read from its existing owner (Principle 2). This is the complete map, including the reds — which are listed precisely so nobody reads their absence as an oversight.

| Signal | Canonical owner | Register status | Used by HOME2? |
|---|---|---|---|
| **`critical` opportunities** | Decision Engine — `server/intelligence/opportunity-delivery/framework.ts` (DEC1) | Appendix A — declared | ✅ **Tier 0** (consumed as-is) |
| **Attention level** | `shared/attention/index.ts` (ATTN1) — producer-assigned, never re-derived (A1) | Declared | ✅ Read, never assigned |
| **Ordering mechanics** | `shared/attention/decision.ts` (DEC1 § 4) | Declared | ✅ Reused (`orderByAttention`, `clampLimit(1)`) |
| **Delivery lifecycle** (delivered → acknowledged → dismissed \| accepted) | `delivery-store.ts`, **sole owner** of `opportunity_deliveries` | Declared | ✅ Inherited via Tier 0 |
| **Muting** (`mutedOpportunityTypes`) | `user_preferences` via `delivery-store.getMutedOpportunityTypes` | Domain 27 | ✅ Inherited at Tier 0; **out of scope** for Tiers 1–3 (§ 4.3) |
| **Planner weeks / days / entries** | `planner_weeks`, `planner_days`, `planner_entries` | **Domain 14** — declared | ✅ **Tiers 1, 3** |
| **Shopping list + `checked`** | `shopping_list` | **Domain 15** — declared | ✅ **Tier 2** |
| **Meals / cookbook** | `meals`; write funnel `storage.createMeal()` | **Domain 12** — declared | ➖ Not needed by the ladder |
| **Household membership** | `households`, `household_members`, `household_eaters` | **Domain 16** — declared | ➖ Reached only through Tier 0's producer |
| **Restriction definitions** | `shared/restrictions/restriction-library.ts` | **Domain 5** — declared | ➖ Reached only through Tier 0's producer |
| **Voice / all user-facing words** | Behaviour Engine + Personality Registry (INT21) | Declared | ✅ **Owns every string** the door shows |
| **Plant diversity** | `plantDiversityGroup()` — `shared/canonical/plant-classifier.ts` | Domain 4/22 — **known gap**: two assemblers over-count | ❌ Not used. *If ever used, read through `plantDiversityGroup()`, never through `household-nutrition-assembler.ts` or `nutrition-centre-assembler.ts`* |
| **`platform_observations`** | Observation Engine | Declared | 🚫 **FORBIDDEN as input** (§ 3.1) |
| **LEARN1 confirmed understanding** | `household_evidence_events` / `household_learning_signals` via EL2's one door | Declared | ❌ Not used — it re-weights *within* a tier; the ladder has no within-tier ranking to re-weight |
| **Pantry contents** | `user_pantry_items` | ⚠️ **NO REGISTER DOMAIN** (§ 8.3) | ❌ Not used |
| **Pantry freshness / expiry** | — | 🔴 **THE FACT DOES NOT EXIST** | ❌ Not used |
| **Household goals** | — | 🔴 **NO ENTITY** | ❌ Not used |
| **Active journeys / session** | — | 🔴 **NO ENTITY** | ❌ Not used |
| **Meal preparation state** | — | 🔴 **DOES NOT EXIST** | ❌ Not used |
| **Time / clock** | — | 🔴 **NO OWNER, SERVER-SIDE NO FACT** | ❌ Not used (§ 8.1) |

**Net: the resolver reads four owners (Decision Engine, Planner, Shopping, Behaviour Engine) and creates zero.**

---

## 6. STABILITY — WHY THE DOOR IS CALM

The mission asks for calm, stable, and helpful rather than reactive. **Not one mechanism below is a new rule.** Each is either a property of the construction or an application of an existing owner's law.

### 6.1 The governing sentence

> **The door changes when the household's state changes, and never when THA's opinion changes.**

This is not a rule imposed on the model — it is a **theorem of it**. The ladder is fixed, reads only canonical facts, reads no clock, and learns nothing. Therefore the door can only move when a *fact* moves. And every fact it reads is one the household themselves moved: they planned a meal, they checked off an item, they dismissed a safety notice. **Every door change is explicable, in one sentence, by something the household did.** There is no mechanism by which THA can change its mind.

### 6.2 The six mechanisms

| # | Mechanism | Grounded in |
|---|---|---|
| 1 | **Determinism.** Same state → same door, always. No clock, no randomness, no learned weights | `shared/attention/decision.ts:20-22`; DEC1 § 5 (*"same inputs, same sentences, every time"*); INT21 § 4.1 |
| 2 | **A ladder, not a score.** Cannot oscillate near a threshold; a tier fires or it doesn't | § 4.4 |
| 3 | **Resolved once per arrival, held for the visit.** The door does not re-resolve under the person's gaze | Experience Language **Principle 1**: *"the moment of entry is **composed, not assembled in front of the person**… nothing lurches into being"*; Experience Architecture § 12: *"never silently rearranges what people rely on"* |
| 4 | **Day-seeded words.** The label varies at most by day, never within one | INT21 § 4.1 (`stablePick`): *"the same personality on the same day says the same words — … **never a jarring re-render**"*; § 10: *"Day-seeded is the ceiling of variety"* |
| 5 | **Phrasing never re-aims.** New words are not a new door | INT21 § 7.2: *"a fact is not resurfaced because its wording changed"*; § 3: *"`voiceGuidanceLabel` never retargets one"* |
| 6 | **Dismissal is terminal and inherited.** A dismissed critical never re-aims the door | DEC1 lifecycle; `delivery-store.ts:42-44` |

Mechanism 3 deserves a note, because it is the one that does real work. **Time boundaries are the only oscillation risk a clock-free ladder could ever have** — and the model has no clock, so it has none. Should a clock ever arrive (§ 8.1), mechanism 3 is what prevents 17:59 → 18:01 from flipping the door under someone's hand: **the door is resolved at arrival and held.** They see the door that was true when they walked in. If they return, it re-resolves.

### 6.3 When the door deliberately does NOT change

Stated as a list, because *"when does it not change"* is the mission's sharpest question and the answer is where calm actually lives:

- **Never because THA learned something.** No adaptive weights, no telemetry read — forbidden by Observation Engine § 7 and DEC1 § 8 (Rule P1).
- **Never because an opportunity was produced below `critical`.** A non-critical opportunity is the *product's* judgement and may never re-aim the door (Experience Principle 4). It reaches the household through its own governed channel — the Notice Engine, at ≤2 per moment — not through the threshold.
- **Never mid-visit.** Resolved once per arrival (§ 6.2 #3).
- **Never because the phrasing varied.** INT21 § 7.2.
- **Never because the hour advanced.** THA has no clock — and when it has one, only at coarse named phases, never a continuous variable.
- **Never because someone tuned a weight.** There are no weights.
- **Never because a dismissed thing recurred.** Terminal is terminal.
- **Never to fill a gap.** When nothing is outstanding, the floor shows the household their own week — it does not invent a task (Blueprint § 12.1 rule 3; Experience Architecture § 6).

---

## 7. EDGE CASES AND CONFLICT RESOLUTION

### 7.1 Conflicts are impossible by construction

**There is no conflict-resolution algorithm, because there is nothing to resolve.** The ladder is a total order over mutually-exclusive rungs; first match wins. Two signals cannot tie because they cannot occupy the same rung.

**The one genuine tie is within Tier 0** — two live criticals — and it is resolved by **reusing the canonical mechanics, not by writing new ones**:

```
orderByAttention(criticals) → clampLimit(1) → first
```

with the fixed ordering basis `attention → learning → seen → arrival` (`framework.ts:662`), which is deterministic and already governed. **Writing a bespoke tie-break here would be the architecture violation DEC1 § 4 names.**

### 7.2 The edge cases

| # | Case | Resolution | Grounded in |
|---|---|---|---|
| 1 | **Brand-new household, nothing exists** | Floor → Planner. Honest: *"plan your first week"* is genuinely the next thing | Tier 3 |
| 2 | **A producer is down / DEC1 returns `trust.resolved: false`** | **Tiers 1–3 are unaffected** — they read state directly, not producers. Only Tier 0 is unavailable, and it degrades **silently and honestly**: a safety door the platform cannot see is not claimed | `framework.ts:846-848` (*"Always returns a complete bundle — never throws"*); Experience Architecture § 14 (*"Degrade gracefully, and honestly"*) |
| 3 | **The planner read fails** | The floor still fires. **The floor requires no successful read** — it is unconditional. This is what "total" buys | INT21 § 4.1 (fail-safe default) |
| 4 | **Everything fails** | Floor → Planner, `provenance: "floor"`. **Never zero** | § 4.1 |
| 5 | **Two live criticals** | § 7.1 | DEC1 § 4 |
| 6 | **The household dismissed the critical** | Terminal; Tier 0 stops firing; the ladder falls through to Tier 1 | `delivery-store.ts:42-44` |
| 7 | **The household muted `planner-empty-day`** | **Tier 1 still fires.** Muting silences notices, not doors (§ 4.3) | `framework.ts:319-326` (scope) |
| 8 | **The week is planned, list clear, nothing critical** | Floor → Planner (this week). The honest answer to *"what's next?"* — not a manufactured task | § 4.2 |
| 9 | **`max(weekNumber)` is not the real current week** | **A known, unfixable-today limitation.** The door says *"your week"*, which is true of the week the household is working on — it never claims *"today"*, which THA cannot know | § 8.1 |
| 10 | **The household has no planner weeks at all** | `/api/planner/full` lazily *creates* them (`routes.ts:6437-6439`). The floor is therefore always reachable | — |
| 11 | **A critical fires while the person is on Home** | **The door does not change under them** (§ 6.2 #3). It resolves on their next arrival. A safety fact reaches them through its own governed channel meanwhile | Experience Language Principle 1 |
| 12 | **`CRITICAL_TYPES` grows** | **Tier 0 inherits whatever the allowlist admits.** This is the model's one governance dependency and is named in § 4.2 | `shared/attention/index.ts:80-89` |

**Case 11 deserves its own line**, because it is the one place calm and urgency genuinely trade. The resolution is not a compromise: the door is a *threshold*, and a threshold that rearranges while you stand in it is not a threshold. A safety fact that arrives mid-visit is not silenced — it reaches the household through the channel built for exactly that (the Notice Engine, calm, inline, dismissible). **The door is where you were going; it is not an alarm, and Experience Principle 8 forbids making it one** (*attention is borrowed, never taken* — the finding NORTH1 § 5.4 already made about an amber badge at the threshold).

---

## 8. GAPS RECORDED, NOT FILLED

Per EXPCOMP1 § 4.3 (*"Cite, or do not grade… where the canon is silent, record silence as a gap — never fill it"*) and its § 6.2 precedent.

### 8.1 The time gap — and a governing rule that is currently unimplementable

**`TRANSLATION1` *Morning Rhythm* § 8 is law, and THA cannot obey it:**

> *"The one primary action is **re-aimed by relevance across the day** — look at the week in the morning, start tonight's dinner at the dinner hour."*

NORTH1 § 8.3's fix cites this same re-aiming as the shape of Home's missing door. **It requires two facts THA does not have, and the harder one is not the one people expect:**

1. **A household clock.** No timezone column exists on any table; no `Intl.` call exists in `server/`; the client computes "today" as `new Date().toISOString().slice(0,10)` — **which is UTC, not local**, and is therefore *already wrong* for any household outside UTC (a household at UTC+13 at 09:00 local gets yesterday's date).
2. **A planner→calendar anchor.** **This is the real blocker.** Even a perfectly correct local date cannot be joined to a `planner_week`, because `planner_weeks` has no date — only `weekNumber`. The codebase states the constraint itself, unprompted: *"planner has no calendar date field to compute this from any other way (confirmed against `shared/schema.ts`)"* (`opportunity-engine.ts:193-196`).

**Recorded, not solved.** Both are schema changes and belong to a governed workstream under Principle 8 and Register Rule 8 — not to an investigation. **The model above is deliberately total without either**, so the door works today and time refines it later rather than enabling it.

> **Related finding, reported not fixed: THA already fabricates dates to work around this.** `buildHouseholdHistory` (`server/routes.ts:11356-11396`) back-projects a synthetic `approxDate` from `weekNumber`/`dayOfWeek` against the server clock, anchored on the assumption that `max(weekNumber)` is the current calendar week. That fabricated date flows into the stories and discovery engines, and from there into `/api/home/intelligence`. **Core Principle 6 is *"No fabricated knowledge — honest gaps over invented facts."*** This is a live conformance defect against it, it predates HOME2, and HOME2 does not touch it — but any workstream that closes the time gap should close this at the same time, because the workaround exists *only* because the fact is missing.

### 8.2 `/api/home/intelligence` — a collision that must be a decision, not an accident

The obvious place to call the resolver is the route Home already uses. **It should not be, without a deliberate decision**, for three reasons:

1. **It is chartered convergence debt.** INT20 § 7.2 names it: *"parallel, ungoverned notice channels are live… bypass mute/de-dupe/lifecycle governance and the Silence Rules… **convergence debt, not defects**"*, and **NTC-P2** exists to converge it. § 9's grandfathering is time-limited: *"§ 7.2's channels are grandfathered *only* until their scheduled convergence."* **A HOME2 implementation added to that route either subsumes NTC-P2 or deepens the debt it is chartered to clear.**
2. **Its `opportunity` field is not DEC1's, and the file says so in capitals.** `server/lib/household-companion-fields.ts:23-30`: *"**NOT THE DECISION ENGINE, AND NOT A SECOND ONE.** The `opportunity` field here is a food-*discovery* suggestion… It carries **no AttentionLevel, cites no evidence**, and is **never delivered, muted, suppressed, re-weighted or resolved**."* **Tier 0 must consume the `opportunity-delivery` capability, never this field.** Confusing the two would give the door an uncited, ungoverned, unmutable aimer.
3. **Its `weeklyProgress` is an N+1×M serial loop** (`routes.ts:11495-11536`) — a `getPlannerEntriesForDay` per day and a `getMeal` per entry. Putting a threshold-critical read behind it is a performance decision that should be taken knowingly.

> **Recommendation: the resolver is a pure function; where it is called from is an implementation decision that must be taken with NTC-P2 in view, not around it.**

### 8.3 Pantry has no owner in the Source of Truth Register

`user_pantry_items` exists in the schema and is named as a canonical owner in `CANONICAL_PUBLICATION_ARCHITECTURE.md` — but **it has no domain in the Source of Truth Register at all.** Worse, two documents (`INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md:216`; `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md:103`) both cite *"SoT D8–D11"* as pantry's source of truth — **and Domains 8–11 are Discovery, Alternatives, Stories, and Seasonal Stories: engines, not an inventory store. That citation is wrong.**

**Recorded, not fixed.** HOME2 does not read pantry, so this does not block it. It is reported because it was found, and because the next workstream that *does* want a pantry signal will hit it.

### 8.4 The absent facts, listed so their absence is not mistaken for an oversight

**Meal preparation state · household goals · active journeys · pantry freshness · household reminders.** Each is named by the mission; **none exists** (§ 3). Each would be a **new fact**, and a new fact is a governed act — Register Rules 2 and 8, Principle 8 (*name what it replaces, state the retirement condition*). **None may be invented inside a Home resolver**, which is precisely how a projection quietly becomes an owner.

Each is a clean extension point: a new rung on the ladder, once the fact has an owner. **The ladder was designed to be extended by governance, not by drift.**

---

## 9. IMPLEMENTATION RECOMMENDATIONS

**No implementation is authorised by this document.** These are recommendations to a future workstream.

1. **Build it as a pure resolver in `shared/`**, beside the entity spine — the class of `shared/attention/decision.ts` and `resolveBehaviour`. **Not** a capability, **not** a service, **not** a route handler, **not** an engine. Test it with a table of `HomeState` → expected tier; it needs no I/O to test, which is the point.
2. **Name it `resolveHomePrimaryAction`. Do not use "door" as an identifier** (§ 2.5).
3. **Reuse `shared/attention/decision.ts`** for the Tier 0 tie-break — `orderByAttention` then `clampLimit(1)`. A module-local sort, dedupe, or clamp is *"an architecture violation"* on arrival (DEC1 § 4).
4. **Consume the `opportunity-delivery` capability for Tier 0** — never `/api/home/intelligence`'s `opportunity` field (§ 8.2), never a producer's internals, never a raw table.
5. **Route every user-facing string through the Behaviour Engine.** Selection then phrasing, nothing in between (INT21 § 7.2). New Home copy outside the registry re-opens **CP3** (§ 8.5, § 9).
6. **Take the NTC-P2 decision explicitly** before choosing the call site (§ 8.2).
7. **Seal the decision; record it only if operator need is demonstrated.** Follow the BEH1/DEC1 pattern exactly — *"the engine seals (pure), the capability handler records"* — and if a `home-primary-action` observation kind is wanted, grow the vocabulary the governed way (Observation Engine § 2.2: *"extend the union, document the capture point"*; BEH1's 12th, CP2's 13th and DEC1's 14th are the precedents — *"no new store, no new seam, no new column, no migration"*). **Nothing may read it back** (§ 7). `provenance` is provenance, not quality (§ 4.1).
8. **Never persist the resolved action.** No table (DEC1 § 8), no cache. `activity_summary` is the cautionary precedent — a cross-domain derived cache that **already drifted** (*"🔴 DRIFT: cache out of sync on 2/9 rows"*), and under Principle 7 a job keeping it in sync with four owners is a **permanent sync bridge**: debt by definition. **The platform's stability mechanism is determinism, not memoisation.**
9. **The door is a departure, not an operation** (HOME1 § 7.1; Experience Architecture § 4). It must not become a fourth card. Exactly one primary-styled action (UIA § 5).
10. **Do not close the time gap opportunistically.** It is a schema change with a governance path (§ 8.1). The model is total without it.
11. **Read plant diversity, if ever needed, through `plantDiversityGroup()`** — never through the two assemblers the register records as over-counting (Domain 22, known gap).
12. **Verify the resolver is telemetry-blind:** `OBS_DISABLE_CAPTURE=1` must not change which door is shown (§ 3.1). This is a testable assertion and worth asserting.

**What this closes.** NORTH1 § 8.3 — *"Resolve Home to orientation + one door"* — calls Home's missing primary action *"the most valuable single change to the product in this list, quite apart from how anything looks."* It is a **conformance defect against Experience Principle 4**, not an architecture gap, and this model needs **no amendment, no new fact, no schema change, and no new service** to close it. It is buildable today.

---

## 10. CONFLICTS WITH GOVERNING ARCHITECTURE

**None found in the model.** The mission's stop condition (*"do not modify governing architecture unless a genuine architectural conflict is discovered"*) is not triggered: **no architecture was modified, and none needs to be.**

What was found instead is **one governing rule the platform cannot currently obey** — `TRANSLATION1` *Morning Rhythm* § 8's re-aiming across the day (§ 8.1). **This is not an architectural conflict.** The rule is correct; the facts are missing. The resolution is a platform workstream (a schema change under Register Rule 8), not an amendment. **Amending the rule to match the platform's limitation would be exactly backwards** — it would ratify a gap as a law.

Three near-misses, checked and cleared:

| Candidate conflict | Verdict |
|---|---|
| **DEC1 § 7** — *"A workstream adding surfacing logic anywhere else must STOP"* | **Cleared.** The resolver adds no surfacing logic: it surfaces no item, ranks nothing, and adds no suppress/rank/budget path. It is a **peer** on the Silence Rules' precedent (DEC1 § 6), consuming DEC1's governed output and never reaching around it. |
| **DEC1 § 8** — no central `DecisionEngine.decide()` | **Cleared.** Nothing calls the resolver to rank candidates. It absorbs no Selection (§ 3.1). |
| **INT20 § 9** — no second ambient-notice channel | **Cleared.** The door is not a notice: it is not passive, not capped at two, not optional, and never empty. Its safety input arrives *through* the governed capability, which is the pattern INT20 § 5.2 blesses. |

---

## 11. DEFINITION OF DONE — CHECK

| Requirement | Met |
|---|---|
| One canonical decision model | § 4 — one pure total resolver, one ladder, one floor |
| Existing ownership preserved | § 5 — reads four owners, creates zero; every fact cited to its owner |
| Existing Intelligence Platform reused | § 4.3 — consumes DEC1's governed output; reuses `shared/attention/decision.ts`; voices through INT21 |
| No duplicate services created | § 2.4, § 10 — a peer on the Silence Rules' precedent; no engine, no capability, no service, no store, no table, no cache |
| One primary action always determinable | § 4.1, § 7.2 — total by the floor; never 0, never 2; case 4 proves it under total failure |
| No implementation performed | Nothing built. No code, no schema, no route, no architecture modified |

---

## 12. COMPLIANCE

- **Architecture Bootstrap (`docs/architecture/README.md`, STEP 2):** read before this investigation; every governing Experience document and every Intelligence Governance document bearing on the question read.
- **One rule, one owner, forever** (Principle 2; Experience Principle 6; Blueprint § 18): the model owns no fact and states no rule. Every constraint above cites an existing owner.
- **Core Principle 6 — honest gaps over invented facts:** the load-bearing test of this design. Six of the mission's ten named inputs do not exist; **the model reads none of them** and records each as a gap (§ 8.4) rather than inferring it.
- **EXPCOMP1 § 4.3 — *"Cite, or do not grade… never fill it":*** honoured. Three gaps recorded and none filled.
- **No experience principle created.** Not one. § 6's mechanisms are each an existing owner's law or a property of the construction.
- **The mission's stop conditions:** honoured. **Nothing implemented. Home not redesigned. No architecture modified. No duplicate decision engine designed** — the duplicate-engine hazard was the first question asked (§ 2) and is cleared against DEC1's own text in § 10.
- **This document creates no rule.** It is an investigation: history the moment it is written, never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). Where it and any governing document disagree, **this document is the defect.**

---

## 13. THE MODEL IN ONE PARAGRAPH

Home's one door is not chosen by an engine, because choosing it is not a decision about what THA wants to say — it is a reading of where the household already is. So it is a **total resolver**, not a ranker: a pure function over a fixed ladder — safety, then plan, then shop, then the floor — that reads four existing owners, creates nothing, persists nothing, learns nothing, and reads no clock, because THA does not have one. It consumes the Decision Engine's governed output where safety is at stake and never reaches around it, standing beside it exactly as the Silence Rules do. It cannot oscillate, because a ladder has no thresholds to tremble at; it cannot drift, because there are no weights to tune; and it cannot be reactive, because the only thing that can move it is the household moving something themselves. **The door changes when the household's state changes, and never when THA's opinion changes** — and that one sentence is not a rule the model obeys, it is a fact about how the model is built.

---

*An investigation — a point-in-time design of the Home Primary Action decision model against the governing Experience and Intelligence architectures. It is history the moment it is written and is never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). Subordinate to the Experience Architecture, which prevails in any conflict.*
*Rollback: this document is new and uncommitted — to revert entirely, delete this file. Rollback tag for the HOME2 workstream: `rollback/HOME2-canonical-home-decision-model-20260716` → `7d1dd2ce`.*
