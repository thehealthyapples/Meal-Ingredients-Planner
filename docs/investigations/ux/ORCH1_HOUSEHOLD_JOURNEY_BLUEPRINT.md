# ORCH1 — The Household Journey Blueprint

## How THA accompanies a household over years

**Status:** INVESTIGATION — a design and a recommendation. **Not** governing architecture, **not** a specification, **not** implementation, **not** a feature list. It creates no rule, no domain, and no second owner. **It amends nothing and builds nothing.**
**Classification:** Experience Governance (investigation)
**Date:** 2026-07-16 (ORCH1)
**Rollback ID:** `rollback/ORCH1-household-journey-blueprint-20260716` → `7d1dd2ce`
**Reviewed against:** [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) · [`THA_EXPERIENCE_BLUEPRINT.md`](../../architecture/THA_EXPERIENCE_BLUEPRINT.md) · [`THA_EXPERIENCE_LANGUAGE.md`](../../architecture/THA_EXPERIENCE_LANGUAGE.md) · [`THA_ORCHARD_LIVING_BOOK.md`](../../architecture/THA_ORCHARD_LIVING_BOOK.md) · [`THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`](../../architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md) · [`THA_KEPT_ROOM_TRANSLATION.md`](../../architecture/THA_KEPT_ROOM_TRANSLATION.md) · [`ARCHITECTURE_PRINCIPLES.md`](../../architecture/ARCHITECTURE_PRINCIPLES.md) · [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](../../architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md) · [`THA_HOUSEHOLD_TIME_ARCHITECTURE.md`](../../architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md) · [`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) · [`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`](../../architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md) · [`THA_OBSERVATION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md) · [`CANONICAL_PUBLICATION_ARCHITECTURE.md`](../../architecture/CANONICAL_PUBLICATION_ARCHITECTURE.md) · `docs/architecture/README.md` (Architecture Bootstrap, STEP 2)
**Prior work read:** [`HOME1`](./HOME1_ARRIVAL_BEHAVIOUR_INVESTIGATION.md) · [`HOME2`](./HOME2_CANONICAL_HOME_DECISION_MODEL.md) · [`NORTH2`](./NORTH2_EXPERIENCE_ARCHITECTURE_REFINEMENT.md) · [`EXPCOMP1`](./EXPCOMP1_THA_EXPERIENCE_COMPLIANCE_STANDARD.md) · [`TIME1`](../platform/TIME1_HOUSEHOLD_TIME_FOUNDATION.md) · [`TIME2`](../platform/TIME2_HOUSEHOLD_TIME_CONSUMER_AUDIT.md)
**No UI designed, no code written, no architecture amended, no platform domain invented, no feature specified.**

---

## 0. TWO DECLARATIONS

**0.1 This is an investigation, not governing architecture.** The mission asked for *"the governing experience blueprint"* and for it to be *"stored in `docs/investigations/`"*. Those are mutually exclusive (`docs/architecture/README.md` line 4; `REPOSITORY_CONVENTIONS.md` § 3). It is written as an investigation; § 13 names the promotion path and what should — and should not — travel it.

**0.2 The specified path is forbidden.** `docs/investigations/ORCH1_…md` (the root) violates `REPOSITORY_CONVENTIONS.md:47`/`:74` and **fails** `.engineering/scripts/repo-structure-verify.sh:52-54`. Filed at `docs/investigations/ux/` — the Experience workstream, where HOME1, HOME2, NORTH2 and EXPCOMP1 live. Filename preserved.

---

## 1. EXECUTIVE SUMMARY

### 1.1 The headline

> **THA is a product about eating well together, and it can observe everything except eating.**

The platform witnesses **intention** with high fidelity — every planner entry, every basket add, every list generated, every barcode scanned. It witnesses **outcome** — cooked, eaten, shopped, enjoyed — **not at all**. Every state that would witness an outcome either:

- lives in **browser `localStorage`** (`planner:cooked-entries`, `tha-sl-last-shop-session`),
- was **typed and never produced** (`MealSource = "logged"`, `shared/stories/types.ts:37`), or
- is **recorded and never read** (`food_diary_entries`, `stuckToPlan`, `food_diary_metrics`).

### 1.2 The canon already knows

This is not a discovery this document makes against the architecture. **It is a boundary the architecture already drew, deliberately, and almost perfectly.**

- **`EXP ARCH § 17.9`** owns which moments qualify for a premium moment, and names them: *"a first plan made, a first list completed"*. **It does not name a first meal cooked.** The canon's celebration list stops exactly where THA's sight stops.
- **`shared/stories/types.ts:20-24`** states the trust model in the code itself: *"planner_entries witness PLANNING, not eating… the verb vocabulary must match the evidence — 'featured in your meals' (planned) is always safe; 'ate' (logged) is only warranted when source is a confirmed diary entry."*
- **A test asserts it:** *"no insight claims a milestone MOMENT — the platform cannot date one, and does not pretend to"* (`server/tests/test-household-nutrition.ts:484`).
- **The Companion is instructed:** *"Never fabricate familiarity. Never invent achievements."* (`companion-growth.ts:5`).

> **THA's honesty about its own horizon is architecturally intentional, documented in four places, and enforced by a test. That is the platform's finest quality, and this blueprint's first job is to protect it.**

### 1.3 The three findings that shape the journey

**First — the horizon is real, and it is the right shape.** THA accompanies the household to the kitchen door. It does not follow them in. That is not a gap to close with surveillance; it is the boundary that makes THA trustworthy in a family's home.

**Second — the household is already telling THA what happened, and nothing is listening.** This is the actual defect, and it is not a missing fact:

- `food_diary_entries` with `sourceType='manual'` is **genuine, household-authored "I ate this" evidence** — and `buildHouseholdHistory` **never queries the diary** (`server/lib/household-history.ts:29` reads planner tables only).
- `sourcePlannerEntryId` **exists as a column** and is **explicitly set to `null`** even in the one path that could close the loop (`server/storage.ts:3615-3616`).
- `stuckToPlan` (`shared/schema.ts:1288`) — the closest thing THA has to *"did the plan become dinner"* — is **consumed by no one**.
- `food_diary_metrics` (weight, mood, sleep) is **real dated health data that no THA narrative reads**.

> **The pieces were designed, typed, documented — and never connected.** This is the third consecutive investigation to reach that shape (TIME1: *the competence is present, the authority is absent*; TIME2: *each domain reasoned correctly in isolation*). **It is now the most reliable signal the architecture has.**

**Third — one surface breaks the model the whole codebase defends.** `CookbookMealIntelligenceStrip.tsx:93` renames a planner count into a cooking claim and renders it (`:183-186`):

```ts
const cookedCount = data.household?.plannerAppearanceCount ?? 0;
…  Cooked {cookedCount} {cookedCount === 1 ? "time" : "times"}
```

> **A household that dragged a meal into six planner slots and cooked none of them is told *"Cooked 6 times."*** It is the only place in the codebase that breaks the trust model `shared/stories/types.ts:20-24` defines — and it breaks it in the household's own Cookbook, about their own life.

### 1.4 Zero new platform domains are required

The mission permits new domains only if the architecture genuinely requires them. **It does not.** Every stage of the eleven-stage journey maps onto a domain that already exists (§ 7). The one stage with a genuine ownership question — *the meal outcome* — is **already owned by the Diary (Domain 21)**, whose `sourceType` vocabulary already distinguishes `'manual'` (ate) from `'copied_from_planner'` (ambiguous), and whose `sourcePlannerEntryId` column already exists to close the loop.

> **What is missing is not a domain. It is a wire.**

---

## 2. THE PRIOR QUESTION: WHAT IS A "JOURNEY"?

This had to be settled first, because the mission and the canon use the word for **different things**, and building on the wrong one would produce the duplicate the architecture forbids.

**The canon's "journey" is a session-scale arc.** `EXP ARCH § 10`:

> *"A journey is the path from a household's intent (**'what's for dinner this week?'**) to its resolution. **Journeys, not screens, are the unit of experience design.**"*
> *"**Every journey starts from Home and ends somewhere restful.**"*

And `EXPLANG § 5` fixes the six-beat Rhythm's scale explicitly:

> *"Every THA experience — **a whole session, a single surface, or one journey** — moves through the same six-beat rhythm."*
> *"**Completion** — the person returns to Home, the calm centre, at rest. Home is where every journey ends as well as begins."*

**The mission's "journey" is a relationship spanning years.** Discovery → onboarding → first meal → … → indispensable.

### 2.1 The gap is genuine, and it is unowned

Verified: **zero hits** for *"household journey"*, *"over months"*, *"over years"* across the entire `docs/` tree. The Master Evolution Roadmap governs the **product's** evolution, not the household's. The Orchard Living Book comes closest — sixteen chapters of ordinary life — but holds the one-morning law and is explicitly *"not architecture… it adds no rule, no gate, and no check."*

> **The canon governs the *visit* exhaustively and the *relationship* not at all.** Every governing Experience document describes THA at the scale of a moment, a room, or a session. **This blueprint's subject is the scale none of them has: a family's life with THA over years.**

### 2.2 The one place the canon reaches for it

`EXP ARCH § 11` contains the single multi-session line in the whole canon:

> *"**The companion remembers the relationship, not just the request.**"*

It is a **Companion** principle — an instruction to one component — not a description of the household's arc. **The relationship is named once, as a duty of the Companion, and nowhere as a subject in its own right.**

### 2.3 The Rhythm does not scale, and that is the finding

The six beats end in **Completion** — *"That's done. I'm at rest."* A relationship has no Completion beat. A household that has "completed" THA has churned.

> **The six-beat Rhythm is the shape of *being helped once*. The relationship is the shape of *being helped again*.** They are different arcs, and the Rhythm must not be stretched over years to cover the gap — that would be the restatement `Blueprint § 18` forbids, and it would break the Rhythm's own meaning.

---

## 3. THE THREE ZONES — THE MODEL THE JOURNEY RESTS ON

Everything below follows from one distinction. **THA's knowledge of a household falls into three zones, and the boundaries between them are the whole architecture of trust.**

| Zone | What it holds | How THA gets it | Today |
|---|---|---|---|
| **Zone 1 — What THA sees** | **Intention.** Planner entries, basket adds, list generation, barcode scans, opportunity accept/dismiss | **Observed** — the household acts inside the product | ✅ **High fidelity** |
| **Zone 2 — What the household tells THA** | **Outcome.** The diary (`sourceType='manual'`), `stuckToPlan`, weight/mood/sleep metrics, learning-signal approvals | **Authored** — the household chooses to say it | 🔴 **Recorded, and read by almost nothing** |
| **Zone 3 — What THA never knows** | Whether dinner was good. Whether the family ate together. Whether anyone enjoyed it. Whether the child ate the vegetables | **Nothing.** No mechanism, and none should be built | ⚪ **Correctly absent** |

**The three rules of the zones:**

1. **Zone 1 may never be spoken of as Zone 2.** A plan is not a meal. This is `shared/stories/types.ts:20-24`'s rule, and § 1.3's defect is its only live breach.
2. **Zone 2 is authored, never inferred.** THA learns what happened because the household **told it** — not because THA watched. `copyPlannerToFoodDiary` is the household saying *"I ate roughly my plan"*; it is a **household act**, not an observation, and its `sourceType='copied_from_planner'` correctly marks the ambiguity.
3. **Zone 3 is not a backlog.** It is the horizon. Closing it would require surveillance of a family's dinner table, and there is no version of that THA should build.

> **The journey blueprint in one line: THA earns, over years, the right to be *told* more — and never the right to *watch* more.**

---

## 4. THE HOUSEHOLD JOURNEY TIMELINE

The eleven stages, with the honest observability verdict beside each. **The last column is the most useful thing in this document**: a stage THA cannot observe is a stage it cannot support, celebrate, or measure.

```
     OUTSIDE THE DOOR │            INSIDE THE HOUSE            │  BEYOND THE DOOR
                      │                                        │   (Zone 3)
  ①────────②────────③─┼──④────────⑤────────⑥────────⑦────────⑧─┼───⑨────────⑩────────⑪
Discover  Onboard  First│ First   Planner  Household Seasonal  Long │Companion Community Indispensable
                  meal  │ shop   confidence knowledge  living  term │
                        │
   ✗       ~binary   ✗  │  ✗        ~         ~         ✓       ~   │    ~        ⚪         ✗
```

| # | Stage | Horizon | Observable today? | The honest verdict |
|---|---|---|---|---|
| **1** | **Discovering THA** | Outside | ❌ **No** | No acquisition surface exists. Pre-auth routes are `/auth` and `/onboarding` only (`App.tsx:300-301`). `invitedByUserId` is declared and **never written** — **THA cannot say who brought whom** |
| **2** | **Onboarding** | Threshold | ⚠️ **Binary only** | 12 steps, **non-resumable** — quit at step 9 and restart at 0 with **zero preferences saved**. **And it never asks who lives here** |
| **3** | **First successful meal** | 🔴 **The hinge** | ❌ **NO** | `localStorage` only. **The household's actual goal is the platform's blind spot** |
| **4** | **First shopping trip** | Inside → out | ❌ **No** | `localStorage`, **singular key** — each trip overwrites the last. **There is no first trip** |
| **5** | **Building planner confidence** | Inside | ⚠️ **Counts, no time series** | `activity_summary` lifetime adds are monotonic and durable — but one row, one `updatedAt`. **You cannot know whether 400 adds took two weeks or two years** |
| **6** | **Growing household knowledge** | Inside | ⚠️ **Architecturally excellent, one input** | EL1 is the most rigorous code in the platform — and **the complete inventory of what THA can learn is whether a household accepted or dismissed suggestion cards** |
| **7** | **Seasonal living** | Inside | ✅ **Rendered** (4 surfaces) | The only stage the household reliably *sees* — built on **fabricated dates** |
| **8** | **Long-term health improvement** | Inside | 🔴 **Proxy, measuring the wrong thing** | The **only** streak input is *tapping a product in the Analyser*. **THA's entire long-term health narrative rests on Analyser page-views** |
| **9** | **Companion relationship** | Inside | ⚠️ **7 turns** | Stores a complete conversational archive **it never re-reads beyond the last 7 turns of one thread** |
| **10** | **Community enrichment** | — | ⚪ **Does not exist** | No code, no register domain, **and no room in the Blueprint's map of the house** |
| **11** | **Becoming indispensable** | — | ❌ **No** | Cannot be measured, because §§ 3, 4 and 8 are unobserved |

### 4.1 The shape of the curve

> **THA's fidelity is highest at the moment of intention and collapses at the moment of outcome — which is the exact inverse of what matters to the household.**

A family does not want a plan. They want dinner. **THA can see the plan perfectly and the dinner not at all**, and the two stages the household would themselves call *"the first time it worked"* — the first meal (③) and the first shop (④) — are the **two least observable events in the entire journey**.

---

## 5. THE ELEVEN STAGES

Each answers the mission's six questions. **"Domains" cites the Blueprint § 5.1 rooms map** — this document does not restate it.

---

### Stage 1 — Discovering THA

| | |
|---|---|
| **Household goal** | *"Is this for families like us?"* |
| **THA's role** | **None — and this is honest, not a gap.** THA's world begins at the door. The Orchard House has no marketing forecourt, and inventing an acquisition domain to fill this stage would be building a room the house does not have |
| **Domains** | **None.** `households.inviteCode` is a **household join secret**, not a referral code — minted at signup for every user (`storage.ts:445-450`), redeemable only by an **existing signed-up adult** joining an existing household |
| **How intelligence helps** | It does not, and must not. There is no honest intelligence about a household THA has never met |
| **Trust gained** | **None yet — but none spent either.** The first trust event is the front door, not an advert |
| **Never** | Never let acquisition reach into the house. Never let a referral mechanic become a household feature. **Never make the household a distribution channel** — *"the companion serves the household's goals, not engagement metrics"* (`EXP ARCH § 11`) |

> **Recorded, not filled:** `invitedByUserId` is a declared, never-written column. THA cannot see the one genuine social event it already has the schema for — one household bringing another in. **That is an observation, not a request to build a referral programme.**

---

### Stage 2 — Onboarding

| | |
|---|---|
| **Household goal** | *"Tell it enough that it's useful, without an interrogation."* |
| **THA's role** | Learn the **minimum that makes the first week safe** — then get out of the way |
| **Domains** | **Household / Profile** (*the family record*) · **Cookbook** (starter meals) |
| **How intelligence helps** | It should not, yet. **THA knows nothing and must not pretend otherwise.** The flow's own honesty disclosure is exemplary and should be the model for the whole product: *"We can't check every meal for [X] yet, so we'll avoid it where we can rather than promise you more than we can keep"* (`onboarding-page.tsx:596-609`) |
| **Trust gained** | **The safety promise.** A household states an allergy and sees THA honour it. This is the highest-stakes trust in the product and it is well-built — the hard/soft restriction split is genuine |
| **Never** | Never lose what they typed. Never ask for what THA cannot yet use. **Never promise safety THA cannot enforce** — the disclosure above is why this stage is trusted |

**Two structural findings, reported not fixed:**

1. **Onboarding is all-or-nothing.** `step` lives in React state (`:259`); the single mutation fires only at `step === TOTAL_STEPS - 1` (`:404`). **A household that quits at step 9 of 12 restarts at 0 with nothing saved** — a direct breach of `EXP ARCH § 10`'s *"Journeys are interruptible and resumable… Leaving mid-journey loses nothing."* **This is the journey principle the canon states most plainly, breached in the first journey a household ever takes.**
2. **The 12-step flow that shapes THA's understanding of a *household* is entirely about one *individual*.** It never asks who lives here. The household is auto-named `${username}'s Household` (`storage.ts:448`) and starts with exactly one eater. **A family product's first conversation does not mention the family.**

---

### Stage 3 — The first successful meal 🔴 **THE HINGE**

| | |
|---|---|
| **Household goal** | *"We cooked something good, and it was easier than usual."* **This is the whole product.** |
| **THA's role** | Prepare everything, then **stand aside**. The meal is the household's, not THA's |
| **Domains** | **Planner** (*the family table*) · **Cookbook** (*the recipe book by the window*) · **Diary** (*the window seat*) — **the Diary is the canonical outcome owner and always was** |
| **How intelligence helps** | Today: **it cannot.** The outcome is invisible, so nothing downstream can reason about it |
| **Trust gained** | **The largest single trust event in the journey — and THA doesn't know it happened.** A household whose first THA dinner worked will forgive a great deal afterwards |
| **Never** | **Never claim it happened.** Never say "cooked" when the evidence says "planned". Never demand a rating as the price of a meal. **Never put a survey between a family and their dinner** |

**The finding, in full.** Three independent proofs that THA cannot distinguish a planned meal from an eaten one:

1. **`planner_entries` has no completion column** (`schema.ts:438-455`).
2. **"Mark as cooked" exists in the UI and writes to `localStorage` only** — `weekly-planner-page.tsx:280-281`: `// Phase 1 execution lifecycle: cooked-state helpers (localStorage, no schema migration needed)`. **Browser-scoped, never household-scoped.** Clear the cache, switch device, or use a partner's phone and every tick vanishes. **The other adult in the household cannot see that dinner was cooked.**
3. **`MealSource = "logged"` has zero producers.** The type exists (`shared/stories/types.ts:37`), the trust model is documented above it (`:20-24`), and **both producers in the codebase emit `source: "planned"`** (`household-history.ts:67`; `routes.ts:11389`). **The honest branch was designed, typed, documented, and never wired.**

**And there is nowhere to say it was good.** No `meal_ratings` table, no rating column, no endpoint. The only human rating in the schema is 👍/👎 **on a Companion reply** (`schema.ts:2395`). **A household can rate THA's sentence about a meal, and cannot rate the meal.**

> **This stage is the hinge of the entire journey.** Stages 5, 6, 8 and 11 are all downstream of it, and all four are weak for exactly this reason. **Fixing Stage 3 is what makes the rest real** — and it needs no new domain (§ 12.1).

---

### Stage 4 — The first shopping trip

| | |
|---|---|
| **Household goal** | *"Get in, get the right things, get out."* |
| **THA's role** | The list is ready before they ask. `EXP ARCH § 17.9` names *"a first list completed"* as a qualifying premium moment — **the last outcome THA can currently see** |
| **Domains** | **Shopping** (*the list by the door*) · **Pantry** · **Analyser** (*the work bench*) |
| **How intelligence helps** | `shopping_fulfilment_memory` is **the platform's quiet triumph** — it remembers which product this household chose for "bread" and stops asking. Durable, household-scoped, and it improves silently |
| **Trust gained** | **Competence.** The list was right, and it got righter |
| **Never** | Never make the shop a logging exercise. Never let the aisle become a form. **Never turn a substitution memory into a recommendation engine** without the household's leave |

**Reported, not fixed:** the shop session is `localStorage` with a **singular key** (`ShoppingListView.tsx:173`) — **each trip overwrites the last**. Even client-side, THA retains exactly one trip. **There is no first trip, no trip count, no history** — so § 17.9's *"a first list completed"*, the canon's own named premium moment, **cannot currently be detected.** `shopping_list.checked` is the live tick-state of a mutable list, erased on regeneration; it is not a trip record.

---

### Stage 5 — Building planner confidence

| | |
|---|---|
| **Household goal** | *"Planning is just what we do now."* |
| **THA's role** | Be reliably, boringly ready. **Confidence is the absence of drama** |
| **Domains** | **Planner** · **Cookbook** · **Household Time** (declared, not built) |
| **How intelligence helps** | Quietly: the picker learns nothing dramatic, the week opens ordered, the same food is one tap away |
| **Trust gained** | **Habit.** The household stops deciding whether to use THA |
| **Never** | Never gamify consistency. Never guilt a missed week. **Never make a streak the reason to plan** — the reason is dinner |

**The structural blocker:** consistency over time is **not computable from the planner**, because planner weeks carry a **week number, not a date** (TIME1 § 3.1). `activity_summary`'s lifetime adds are monotonic and durable — but with **one row and one `updatedAt`**, THA cannot tell two frantic weeks from two steady years. **This is the same root cause as Stage 7's fabricated dates, and `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` Phase 4 is its fix.**

---

### Stage 6 — Growing household knowledge

| | |
|---|---|
| **Household goal** | *"It knows us, and it never got creepy."* |
| **THA's role** | Learn **slowly**, confirm **explicitly**, act **only on what was approved** |
| **Domains** | **Household / Profile** · the EL1 evidence-learning platform |
| **How intelligence helps** | **This is THA's best code and its clearest ethic.** `MIN_EVIDENCE_COUNT = 3`, `MIN_CONSISTENCY = 0.7`, both fixed constants, *"NO machine learning, NO statistical model, NO LLM judgement"* (`framework.ts:5-11`), enforcing one rule: *"**Never infer a permanent preference from a single observation**"* (`:20-27`). A pattern is a **candidate** until the household approves it |
| **Trust gained** | **The deepest kind: THA asked before it assumed.** A `pending_confirmation` signal shown for approval is the household being treated as the authority on themselves |
| **Never** | **Never learn from telemetry** (Observation Engine § 7). Never let a declined pattern return. **Never let "it knows us" become "it watched us"** — the difference is consent, and it is the whole product |

**The finding:** an excellent engine with **one thin input pipe**. The only production writer is the Decision Engine's terminal outcomes (`framework.ts:364-365`), firing on **exactly two events** — `accepted` and `dismissed` (`:350-355`), with `acknowledged` deliberately excluded because *"'seen' is not an opinion"*.

> **The complete inventory of what THA can learn about a household is: whether it accepted or dismissed suggestion cards.** Cooking, eating, shopping, repeating a meal, abandoning one — **none report evidence, because none are observed states**. The schema's own vocabulary anticipates `"completed"` (`schema.ts:2577`) and **nothing produces it.**
>
> **Every capability EL1 lacks is one THA cannot *observe*, not one it cannot *reason about*. Stage 3 is why Stage 6 is empty.**

---

### Stage 7 — Seasonal living

| | |
|---|---|
| **Household goal** | *"We eat with the year without thinking about it."* |
| **THA's role** | Notice the season **on the household's behalf** and mention it once |
| **Domains** | **Food Intelligence** · **Pantry** · **Shopping** · **Home** · **Planner** (four surfaces render it) |
| **How intelligence helps** | Framed as invitation — *"you may enjoy"* — never instruction. `seasonal/engine.ts:266` shows the restraint was deliberate |
| **Trust gained** | **Delight without demand.** The one stage where THA reliably feels alive |
| **Never** | **Never let the season reach the house's light** (`TRANSLATION1` *Morning Rhythm* § 9; `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` HT13). The orchard keeps one morning and one season; **the household's year shows in their data, never in the room** |

**Reported, not fixed:** the season is computed from `approxDate` — invented by subtracting week-number arithmetic from `now` (TIME2 § 3.3). **A household's summer memories silently become autumn memories as the clock moves.** Household Time Phase 6 is the fix; **Phase 4 gates it**.

---

### Stage 8 — Long-term health improvement

| | |
|---|---|
| **Household goal** | *"We're eating better than we were a year ago."* |
| **THA's role** | Hold the long view **without ever grading the household** |
| **Domains** | **Household Nutrition** (*the noticeboard by the garden view*) · **Diary** · **Analyser** |
| **How intelligence helps** | With admirable restraint. `noticeNutritionTrend` returns `[]` on thin data, and the route comment is one of the most honest lines in the codebase: *"NOT a 'nutrition gap': no reference intake, RDA or target value is stored anywhere in this codebase, so no gap against a target can be computed **without fabricating the target**"* (`routes.ts:1688-1691`) |
| **Trust gained** | **Perspective without judgement** — NK2's methodology, honoured |
| **Never** | **Never fabricate a target.** Never turn a trend into a verdict. Never make a household feel measured in their own home |

**The finding, and it is severe.** THA's only streak concept — `isElite = thaRating === 5` (`routes.ts:6691-6702`) — is triggered from **exactly two places**, both on the Analyser page: after a **barcode scan resolves**, and on **tapping a product in search results** (`products-page.tsx:747-751`, `:773-775`).

> **An "elite day" is earned by *looking at* a whole food. Not buying it. Not cooking it. Not eating it.** Searching *"banana"* and tapping the result increments the household's health streak. **A household that cooks five whole-food meals a day from its own Cookbook and never opens the Analyser has a permanent streak of zero.**

This propagates into `user_streaks`, `user_health_trends` (THA's **only** genuine 90-day time series), the Companion's streak-milestone notice, and `noticeNutritionTrend`. **THA's entire long-term health narrative rests on Analyser page-views.**

And the real health data goes unread: `food_diary_metrics` (weight, mood, sleep, dated, longitudinal) is **projected to the Companion and consumed by no narrative**. `savings_events.takeaway_avoided` is minted **one per diary line at a config constant** — THA does not know a takeaway was avoided; it assumes one.

---

### Stage 9 — The Companion relationship

| | |
|---|---|
| **Household goal** | *"It's like asking someone who knows our kitchen."* |
| **THA's role** | Be the friend at the counter — **a presence, not a room** (Blueprint § 5.1) |
| **Domains** | **Companion** · INT17 (context) · INT20 (notices) · INT21 (voice) |
| **How intelligence helps** | Within a strict ethic: *"Never fabricate familiarity. Never invent achievements"* (`companion-growth.ts:5`) |
| **Trust gained** | **Familiarity that was earned** rather than performed |
| **Never** | Never fake memory. Never reveal one member's private context to another (`EXP ARCH § 11`). **Never let the archive become surveillance** |

**The finding:** memory is **7 turns, scoped to one thread** (`conversation-gateway.ts:1314`). Utterances persist forever and are **never re-read beyond those 7**. **THA stores a complete conversational archive it does not use** — which is both a capability gap and, read the other way, a **privacy liability with no compensating benefit**.

> **And the ethic is why it cannot deepen.** *"Never fabricate familiarity"* is honoured — but with Stage 3 unobserved, **there is no real platform data about the household's life to grow familiar with.** The Companion's memory of a family is seven turns and a voice preference. **It is not shallow because it is badly built; it is shallow because the platform has nothing true to tell it.**

---

### Stage 10 — Community enrichment

| | |
|---|---|
| **Household goal** | *"Other families like ours cook things we'd love."* |
| **THA's role** | **Undecided — and that is the opportunity.** |
| **Domains** | **None.** CPuBA Domain 21 — *"reserved lane, dormant"*. `publication-register.ts:1240-1267` **asserts the lane stays empty** |
| **How intelligence helps** | n/a |
| **Trust gained** | n/a |
| **Never** | **Never let a feed into the house.** Never make a family's dinner a performance. Never import engagement mechanics through the one door that has no lock yet. **Never let comparison in** — a household measured against other households is the opposite of this product |

**Three findings:**

1. **Community has no room in the Blueprint § 5.1 map.** Eleven rooms; none is Community. HOME1 § 8.2 found `/dashboard` in exactly this state and called it a **placeless surface** — *"a placeless surface cannot be one home"* (Blueprint § 15.3 Q1).
2. **It is the only domain that could be born correct.** It can be given a place, a verb, and a Household Time contract **before** it is built — the only stage in this journey where doing it right costs **nothing** instead of a migration.
3. **It carries a scope trap already named:** a community event is **CIVIL (foreign zone)** — the venue's time, never the viewer's (`THA_HOUSEHOLD_TIME_ARCHITECTURE.md` § 7). **It is the one domain that will be tempted to mint a second time owner.**

---

### Stage 11 — Becoming indispensable

| | |
|---|---|
| **Household goal** | *"We'd notice if it were gone."* |
| **THA's role** | **Be missed, not be needed.** |
| **Domains** | All of them, quietly |
| **How intelligence helps** | By having been right so often that nobody checks any more |
| **Trust gained** | The relationship stops being evaluated |
| **Never** | **Never make leaving hard.** Never hold the household's data hostage. Never confuse dependence with love. **Never optimise for time in the product** (`EXP ARCH § 11`) |

**The tension this stage contains, resolved.** *"Indispensable"* sits against the canon's own doctrine — *"THA succeeds when you leave"* (Blueprint § 1.5) and *"its success measure is 'the household ate better with less effort', **never 'the household spent more time in the product'**"* (`EXP ARCH § 11`).

> **They are not in conflict once the object is named. THA should be indispensable to the household's *life*, never to their *attention*.** The measure is **dinners**, not sessions. A product that is missed when it is gone has succeeded; a product that is hard to leave has cheated.

**And the sting:** THA's own declared success measure — *"the household ate better with less effort"* — is **unobservable by THA**. *"Ate better"* needs Stage 3. *"Less effort"* has no measure at all.

> **The platform's declared definition of its own success is a sentence it cannot evaluate.** That is the truest statement of the gap in this document.

---

## 6. EXPERIENCE PRINCIPLES

**Held to NORTH2's standard**, which rejected four of five proposed principles because they were already owned: *"Is this rule already owned? If yes, the proposal is not an amendment — it is a **restatement**."*

**Four candidates survived. Two are genuinely unowned; two are applications of existing law at a scale it does not currently reach.** None is created here — this is an investigation.

| # | Candidate | Verdict |
|---|---|---|
| **R1** | **THA accompanies; it does not follow.** There is a place THA does not go — the table — and it is by design, not by deficit. The horizon is a feature | ✅ **Genuinely unowned.** The nearest owners are about *components* (`EXP ARCH § 11`, the companion's discretion) and *technology* (Blueprint § 1.5). **Nothing states the platform's epistemic limit as a virtue.** § 1.2 shows the canon has been *obeying* this rule without ever writing it down |
| **R2** | **The household tells; THA does not watch.** Outcome knowledge is **authored, never observed**. THA earns the right to be told more — never the right to see more | ✅ **Genuinely unowned at this scale.** Observation Engine § 7 forbids telemetry→behaviour (a *mechanism* rule); Core Principle 6 forbids fabrication (a *knowledge* rule). **Neither says the household is the sole author of its own outcomes.** This is the rule Zone 2 rests on |
| **R3** | **The relationship has no Completion beat.** A journey resolves; a relationship recurs | ⚠️ **An application, not a new rule** — but it names a **genuine limit of `EXPLANG § 5`** (§ 2.3). Recommend recording it *in the Rhythm's owner*, as a scope note, **not as a new principle elsewhere** |
| **R4** | **Indispensable to the life, never to the attention.** | ⚠️ **Owned in substance** by `EXP ARCH § 11` (*"never time in the product"*) and Blueprint § 1.5. **Do not adopt** — § 5's Stage 11 is its application, and that is where it belongs |

> **The discipline held: two of four are refused.** And the two that survive are both about **the same thing** — the boundary of what THA may know. **That is the subject the canon has never named, and it is the only thing this blueprint would be justified in adding to it.**

---

## 7. THE DOMAIN INTERACTION MAP

**Blueprint § 5.1 owns what each room *is*.** This map answers a different question it does not: **when does each room enter the household's life, and what does it hand to the next?**

```
STAGE:      1      2       3        4        5        6        7        8       9      10     11
          Disc  Onboard  Meal    Shop    Confid.  Knowl.  Season  Health  Comp.  Comm.  Indisp.
          ────  ───────  ─────   ─────   ───────  ──────  ──────  ──────  ─────  ─────  ───────
Home        ·      ·       ○        ○        ●        ●        ●       ●       ●      ·       ●
Household   ·      ●       ·        ·        ·        ●        ·       ·       ·      ·       ●
Cookbook    ·      ○       ●        ○        ●        ·        ○       ·       ·      ○       ●
Planner     ·      ·       ●        ●        ●        ○        ○       ·       ·      ·       ●
Shopping    ·      ·       ○        ●        ○        ·        ○       ·       ·      ·       ●
Pantry      ·      ·       ○        ●        ·        ·        ●       ·       ·      ·       ○
Diary       ·      ·      🔴        ·        ·        ○        ·       ●       ·      ·       ○
Nutrition   ·      ·       ·        ·        ·        ·        ·       ●       ·      ·       ○
Analyser    ·      ·       ·        ●        ·        ·        ·      🔴       ·      ·       ○
Companion   ·      ·       ○        ○        ○        ●        ●       ○       ●      ·       ●
Food Intel  ·      ·       ·        ○        ○        ●        ●       ●       ○      ·       ●
Community   ·      ·       ·        ·        ·        ·        ·       ·       ·      ⚪       ·
Hh. Time    ·      ·       ○        ·       🔴        ·       🔴       ○       ○      ⚪       ·
```

`●` primary · `○` supporting · `🔴` **should participate and cannot** · `⚪` does not exist · `·` absent

**What the map shows that § 5.1 cannot:**

1. **The Diary is absent from Stage 3 and it should be the star.** It is the canonical outcome owner (`sourceType`, `sourcePlannerEntryId`) and it is **structurally uninvolved in the moment it exists to witness**.
2. **The Analyser carries Stage 8 alone, and should not.** A product-inspection bench is bearing the platform's entire long-term health narrative because it is the only room that reports anything.
3. **Household Time is load-bearing in three stages and is declared-not-built** — Stages 5, 7 and 8 are all blocked on it.
4. **Household/Profile appears twice and disappears in between.** Onboarding, then knowledge — and **nothing in the years between**, because eaters have no lifecycle (§ 11 below).
5. **Community is a column of nothing** — the only room that can still be designed rather than repaired.

### 7.1 The handoffs that carry the journey

| Handoff | Exists? |
|---|---|
| Onboarding → Cookbook (starter meals) | ✅ `starterMealsLoaded` — though seeded on the **wrong days** (TIME2 § 8.1) |
| Cookbook → Planner ("add to week") | ✅ Well-built |
| Planner → Shopping (list generation) | ✅ The platform's strongest seam |
| Shopping → Pantry (what we now have) | ⚠️ Partial |
| **Planner → Diary (what we ate)** | 🔴 **`copyPlannerToFoodDiary` exists and is household-triggered — but `sourcePlannerEntryId` is set to `null` in the one path that could close the loop** |
| **Diary → Food Intelligence (what we ate, remembered)** | 🔴 **Does not exist.** `buildHouseholdHistory` never queries the diary |
| Any → EL1 (evidence) | 🔴 Two events only |
| Any → Companion | ⚠️ 7 turns |

> **The journey's spine is `Cookbook → Planner → Shopping`, and it is excellent. It ends at the door. There is no return path** — nothing carries what happened at the table back into the house.

---

## 8. THE TRUST EVOLUTION MODEL

**Trust in THA is not a score and must never become one.** It is observable only as a behaviour: **what the household chooses to tell it.**

| Phase | The household's posture | What they let THA hold | What earns the next phase | What forfeits it |
|---|---|---|---|---|
| **T0 — Wary** | *"Prove you're safe."* | An allergy | **Honouring it visibly, and admitting the limits** (`onboarding-page.tsx:596-609`) | Any over-promise |
| **T1 — Testing** | *"Prove you're useful."* | One week's plan | A right list | Getting the food wrong |
| **T2 — Habitual** | *"You're part of how we run."* | The weekly rhythm | Boring reliability | Drama, novelty, churn |
| **T3 — Confiding** | *"Here's what actually happened."* | **The diary. Weight. Mood. Sleep.** | **Never using it against them** | **One judgemental sentence** |
| **T4 — Relying** | *"Just tell us what to do."* | The benefit of the doubt | Being right when unwatched | Being wrong loudly |
| **T5 — Missed** | *"We'd notice if it were gone."* | Nothing more — **and that is the point** | Nothing. It is the resting state | Making leaving hard |

### 8.1 The three things this model says

**1. T3 is the phase that matters, and THA is throwing it away.** A household logging their **weight** into THA has extended more trust than one who planned a hundred meals. And `food_diary_metrics` is **read by no narrative**; `stuckToPlan` is **consumed by no one**.

> **The household is already at T3. The platform is still behaving as though it were at T1.** THA is being confided in, and it isn't listening.

**2. Trust is forfeited faster than it is earned, and asymmetrically.** T0→T3 takes months. **One sentence — a fabricated *"Cooked 6 times"*, a judgemental trend, a milestone that never happened — returns a household to T1 permanently**, because the failure is not an error; it is evidence that THA makes things up.

**3. There is no trust metric, and there must not be.** Trust cannot be a score without becoming a target, and a scored household is a measured household. **The only honest instrument is the one above: watch what they tell you.**

---

## 9. MOMENTS THAT DELIGHT

**`EXP ARCH § 17.9` already owns which moments qualify.** This section **applies** that rule to the journey and creates no list of its own:

> *"a household's **first genuine outcome** (a first plan made, a first list completed); the **completion of a journey that had real effort in it**; an **honest milestone the household would themselves recognise** as an achievement — never one manufactured to create an occasion."*

| Moment | Qualifies under § 17.9? | Detectable? |
|---|---|---|
| **The first plan made** | ✅ Named | ✅ Yes |
| **The first list completed** | ✅ Named | 🔴 **No** — the shop session is `localStorage`, singular (§ 5, Stage 4) |
| **The first meal cooked** | ⚠️ **Not named** — and § 1.2 argues this is *why* | 🔴 **No** |
| **A returning favourite** | ✅ *"a milestone they'd recognise"* | ⚠️ From plans only |
| **The list that was already right** | ✅ *"delight that comes from things working"* (Principle 10) | ✅ Yes — **and it needs no celebration at all** |
| **A 7-day "elite" streak** | ❌ **Fails.** A household would **not** recognise "I tapped whole foods in the Analyser for 7 days" as an achievement | ✅ Detected — **and it should not be** |

### 9.1 The two findings

**1. Of the canon's three named premium moments, THA can currently detect one.**

**2. The one milestone THA *does* celebrate fails § 17.9's own test.** The 7-day streak notice is *"a milestone manufactured to create an occasion"* — precisely what § 17.9 forbids — because its evidence is Analyser page-views (§ 5, Stage 8).

> **THA celebrates the one thing the household would not recognise, and cannot celebrate the two things they would.**

**And a structural note:** THA has **no first-time detector anywhere**. `noticeStreak` is *"a **stateless** heuristic… not a persisted 'just crossed' detector"* (`notice-engine.ts:229-235`) — it detects *being at* 7, never *arriving at* 7. **A "first" is a moment, and moments need Household Time.** § 17.9's entire vocabulary — *first*, *milestone* — is currently unimplementable for the same reason `TRANSLATION1` *Morning Rhythm* § 8 is (TIME1 § 8.1).

---

## 10. MOMENTS THAT BUILD LOYALTY

**Loyalty in THA is not retention**, and the canon forecloses the usual playbook: *"its success measure is 'the household ate better with less effort', **never 'the household spent more time in the product'**"* (`EXP ARCH § 11`); *"delight engineered to be compulsive or to extend a session"* is an explicit anti-pattern (Principle 10).

> **So loyalty is not built by moments at all. It is built by their absence.**

| What builds loyalty | Why | Status |
|---|---|---|
| **The list that was already right** | Nothing was celebrated. It just worked | ✅ Live |
| **The substitution it remembered** | `shopping_fulfilment_memory` — it stopped asking, and never mentioned it | ✅ **The platform's quiet triumph** |
| **The allergy honoured on a Tuesday in March** | Six months after onboarding, unwitnessed, unremarked | ✅ Live |
| **The week it said nothing** | Silence as a first-class outcome (INT20 § 4). **A product with the confidence to be quiet is a product that isn't selling** | ✅ Live |
| **The pattern it asked about instead of assuming** | EL1's `pending_confirmation` — *"we noticed this; are we right?"* | ✅ Built, ~unfed |
| **The thing it admitted it couldn't do** | *"we'll avoid it where we can rather than promise you more than we can keep"* | ✅ Live |

### 10.1 The finding

> **Every genuine loyalty moment THA has is a moment where THA did less.**

Not one is a feature. Not one is celebrated. Not one would appear in a release note. They are: *being right, being quiet, remembering, asking, and admitting.* **This is the strongest evidence in this document that THA's Experience canon is correct** — and it is why Stage 11's "indispensable" must never be pursued directly. **Indispensability is a residue, not a goal.**

---

## 11. RISKS TO THE EXPERIENCE

| # | Risk | Severity | The guard |
|---|---|---|---|
| 1 | **The "Cooked N times" defect spreads.** It is currently one surface. It is also the *easiest* pattern to copy — planner counts are the only counts THA has | 🔴 **Highest** | `shared/stories/types.ts:20-24` is the rule. **The verb must match the evidence** |
| 2 | **Stage 3 is closed with surveillance** rather than by wiring the Diary. A "did you cook it?" prompt after every dinner would destroy T3 trust to fill a data gap | 🔴 High | **R2** (§ 6): the household **tells**; THA never watches. **The Diary already exists and is already the household's own voice** |
| 3 | **Engagement mechanics enter through Community**, the one door with no lock | 🔴 High | § 5 Stage 10; `EXP ARCH § 11`. **Give Community a room, a verb and a Household Time contract before it is built** |
| 4 | **A trust score is invented** to make § 8 measurable | 🟡 Medium | § 8.3. A scored household is a measured household |
| 5 | **The Analyser streak is "improved" rather than retired** as a health measure | 🟡 Medium | § 5 Stage 8. It measures page-views. **Improving it makes it a better lie** |
| 6 | **Delight is added to fill Stage 3's silence** — confetti where the meal should be | 🟡 Medium | § 17.9 owns the list. `EXPLANG` Principle 10: *"a product that celebrates every save has abolished the category"* |
| 7 | **The conversational archive is mined** to deepen the Companion | 🟡 Medium | It is stored and unread (§ 5, Stage 9). **The right move is probably to prune it, not to read it** |
| 8 | **Onboarding is lengthened to ask about the family** (the § 5 Stage 2 gap) — and drop-off rises on a flow that already saves nothing | 🟡 Medium | **Fix resumability *before* adding a question.** `EXP ARCH § 10`: journeys lose nothing |
| 9 | **Household composition is modelled as a feature** rather than a fact — "family management" | 🟢 Low | Domain 16 owns eaters. It needs a lifecycle, not a surface |
| 10 | **This blueprint is read as a roadmap** | 🟢 Low | § 12: observations only. Nothing here is authorised |

---

## 12. ARCHITECTURAL OBSERVATIONS

**Observations only. Nothing here is designed, specified, or authorised.**

### 12.1 The meal outcome needs no new domain — it needs a wire

**The Diary (Domain 21) is already the canonical outcome owner**, and every piece exists:

| Piece | State |
|---|---|
| `food_diary_entries.sourceType` — `'manual'` (ate) vs `'copied_from_planner'` (ambiguous) | ✅ **Exists and is correct** |
| `food_diary_entries.sourcePlannerEntryId` — the plan→ate link | ✅ **The column exists** — and is **set to `null`** in the log-meal path (`storage.ts:3615-3616`) |
| `MealSource = "planned" \| "logged"` | ✅ **Typed and documented** — `"logged"` has **zero producers** |
| The trust model | ✅ **Written in the code** (`shared/stories/types.ts:20-24`) |
| `buildHouseholdHistory` reading the diary | 🔴 **Never queries it** |
| `planner:cooked-entries` | 🔴 **A rival outcome store, in a browser** |

> **Observation: THA has two owners of "did we cook it" — one in `localStorage` and one that was typed and never produced — and the canonical one (the Diary) is not wired to the engines that need it.** Principle 2's fail test is met. **The retirement target is the `localStorage` key.**

### 12.2 Household composition has no lifecycle — and it is the defining event of a multi-year journey

`household_eaters` (`schema.ts:1158-1172`) has **no `createdAt`, no age, no status, no `leftAt`** — and **no `DELETE` route**.

| Event | Observable? |
|---|---|
| A baby arrives | An eater can be added — **THA cannot know when, that they are new, or that they are a baby** |
| A child grows up | **No.** A 6-month-old and a 16-year-old are two `displayName` strings |
| **A child leaves home** | **No.** No delete, no status. **They remain an eater forever** |
| An adult leaves and returns | **The record is destroyed** — `joinedAt` overwritten, `leftAt` nulled (`storage.ts:2649`) |

> **Observation: THA cannot observe a family changing shape — which is the defining event of the journey this blueprint describes.** Domain 16 owns eaters; this is a **lifecycle gap in an existing domain**, not a new domain. **And the children — the reason the eater model exists — are the ones with no lifecycle at all.**

### 12.3 The observations, listed

1. **`buildHouseholdHistory` is duplicated verbatim** — `lib/household-history.ts:28-75` and `routes.ts:11356-11397` — in the file whose own header says the extraction exists to prevent it. **Two owners of the household's history.** (Also TIME2 § 3.3.)
2. **`invitedByUserId`** — declared, never written. THA cannot see one household bringing in another.
3. **`stuckToPlan`** — the closest thing to *"did the plan become dinner"*: day-granular, opt-in, **consumed by no one**.
4. **`food_diary_metrics`** — real dated health data, **read by no narrative**.
5. **`savings_events.takeaway_avoided`** — assumed, one per diary line, at a config constant. **THA does not know a takeaway was avoided.**
6. **The conversational archive** — stored forever, never re-read beyond 7 turns. A liability with no benefit.
7. **Onboarding is not resumable** — breaching `EXP ARCH § 10` in the first journey a household takes.
8. **Community has no room** in Blueprint § 5.1 — HOME1 § 8.2's *placeless surface*, but **before** it exists rather than after.
9. **§ 17.9's vocabulary is unimplementable** — *first*, *milestone* are moments; moments need Household Time; Household Time is declared-not-built.

### 12.4 What this blueprint deliberately does not do

**It proposes no schema, no column, no endpoint, no surface, no feature, and no phase.** Each observation above is a **new fact or a new wire**, and both are governed acts (Register Rules 2 and 8; Principle 8). **None may be built on an investigation's say-so.**

---

## 13. RECOMMENDATIONS FOR FUTURE GOVERNING ARCHITECTURE

**Recommended, not created.** Each names what it would own and — more importantly — **what it must not**.

| # | Candidate | Recommendation |
|---|---|---|
| **1** | **The Household Outcome boundary** (the three zones, § 3, and principles **R1**/**R2**, § 6) | ✅ **The strongest candidate, and the only genuinely new law here.** It would own one question nothing owns: *what may THA know about a household, and how may it come to know it?* **It must not own** the Diary's data (Domain 21), the learning mechanics (EL1), or telemetry conduct (Observation Engine § 7). **Recommended home: an amendment to the Experience Architecture (a § 12 Trust extension), not a new document** — the canon is already seven documents deep and Blueprint § 1.3 warns it *"was becoming a library rather than a blueprint"* |
| **2** | **The relationship's scope note** (**R3**, § 6) | ⚠️ **One sentence, in `EXPLANG § 5`'s own text**, recording that the Rhythm governs the visit and not the relationship. **Not a new principle, not a new document.** A scope note in the owner is the whole of it |
| **3** | **Community's place in the house** | ⚠️ **Not architecture yet — a Blueprint § 5.1 row, when Community is built.** It must pass the § 15.3 Experience Test (*which room · how should someone feel · the one thing it helps them do*) **before** any code. **The cheapest governance act available, and its window closes the day the lane opens** |
| **4** | **A Household Journey Architecture** | ❌ **Do not create.** This blueprint is a **snapshot of eleven stages against a platform mid-repair**; it will be stale the first time Stage 3 is wired. **The journey is not a rule — it is a reading.** The one durable thing in it is candidate 1, and that is an amendment, not a document. *(This is EXPCOMP1 § 13.2's resolved precedent: an audit measures; it does not govern.)* |
| **5** | **This document's promotion** | ❌ **Do not promote.** Same reasoning. Its value is as evidence and as a map of where THA is blind — both of which are history the moment Stage 3 lands |

> **The disciplined answer to *"what governing architecture emerges from this?"* is: one amendment, one scope note, one future table row — and no new documents.**

---

## 14. GAPS RECORDED, NOT FILLED

1. **Discovery (Stage 1) has no owner and probably should not have one.** THA's world begins at the door. **Recorded as a boundary, not a gap.**
2. **"Less effort" has no measure** — half of THA's declared success measure is unmeasured and unmeasurable today. **Not invented here.**
3. **What THA should do when a household stops using it** — the journey has no described ending. Churn, pause, return. **Nothing in the canon covers it and this document does not either.**
4. **Whether the conversational archive should be pruned** — a privacy question, not an experience one. **Named, not answered.**
5. **Whether children should have a diary** — `shared/stories/types.ts:64-65` records that they have none, so their entries are always `"planned"`. **A product decision with real safeguarding weight. Not this document's.**

---

## 15. DEFINITION OF DONE

| Requirement | Met |
|---|---|
| End-to-end journey designed | § 4, § 5 — eleven stages |
| Per stage: goal · role · domains · intelligence · trust · never | § 5 — all six, every stage |
| Household Journey Timeline | § 4 |
| Experience Principles | § 6 — **4 candidates, 2 refused**, none created |
| Domain Interaction Map | § 7 — answers what § 5.1 does not |
| Trust Evolution Model | § 8 — T0–T5, no score |
| Moments That Delight | § 9 — **applies § 17.9, creates no list** |
| Moments That Build Loyalty | § 10 |
| Risks to the Experience | § 11 — 10 risks |
| Architectural observations only | § 12 — nothing designed |
| **No new platform domains invented** | § 1.4, § 12.1 — **zero.** The one candidate is owned by Domain 21 already |
| Existing domains referenced, not replaced | § 7 — Blueprint § 5.1 cited, never restated |
| No UI, no implementation, no feature list | Nothing built, nothing specified |

---

## 16. COMPLIANCE

- **Architecture Bootstrap (STEP 2):** read; every governing Experience document and the Household Time Architecture read.
- **NORTH2's test — *"is this rule already owned?"*:** applied to all four principle candidates; **two refused** (§ 6).
- **`EXP ARCH § 17.9`:** cited as the **owner** of qualifying moments; § 9 applies it and creates no rival list.
- **Blueprint § 5.1:** cited as the owner of the rooms; § 7 answers a different question and restates nothing.
- **`EXPLANG § 5`:** its scope limit is **recorded** (§ 2.3), not overridden. The Rhythm is not stretched.
- **Core Principle 6 — honest gaps over invented facts:** the whole spine. Every stage carries its observability verdict; **§ 4's last column is the document's most important content**.
- **Principle 2:** § 12.1 finds two owners of "did we cook it" and names the retirement target.
- **`TRANSLATION1` *Morning Rhythm* § 9 / HT13:** § 5 Stage 7 — the season may never reach the house's light.
- **Observation Engine § 7:** § 5 Stage 6 — learning never reads telemetry.
- **The mission's stop conditions:** honoured. **No UI. No implementation. No feature list. No new platform domain. No architecture amended.**
- **This document creates no rule.** It is an investigation: history the moment it is written, never to be read as law. Where it and any governing document disagree, **this document is the defect.**

---

## 17. THE BLUEPRINT IN ONE PARAGRAPH

THA is a product about eating well together, and it can observe everything except eating: it witnesses every plan, every list and every scan with high fidelity, and the meal itself — the entire point — not at all, because "mark as cooked" lives in a browser's `localStorage`, `MealSource = "logged"` was typed and documented and never produced, and there is nowhere in ninety tables for a family to say they liked their dinner. That is not a failure of ambition but a boundary the architecture drew deliberately and almost perfectly: the canon's own list of moments worth celebrating stops at *"a first list completed"*, the trust model is written into the code, and a test asserts that THA *"cannot date a milestone, and does not pretend to"* — so the horizon is real, and protecting it is this blueprint's first job, because the alternative to a horizon is surveillance of a family's table. What is broken is subtler and sadder: **the household is already telling THA what happened, and nothing is listening** — the diary records genuine "I ate this" evidence that the story engines never query, `stuckToPlan` and weight and mood sit unread, and `sourcePlannerEntryId` is set to `null` in the one path that could close the loop. So no new domain is required; the Diary has been the outcome's owner all along and every piece exists — **what is missing is a wire**, and that makes this the third consecutive investigation to find that THA's competence was present, correct, and simply never connected. The journey that follows from this is therefore not a funnel but a widening permission: a household grants an allergy, then a week, then a rhythm, then — the phase that actually matters — *what really happened at dinner*, and THA's only honest instrument for measuring trust is to watch what it is **told**, never to widen what it **sees**. Which is why indispensability can never be pursued: every genuine loyalty moment this platform has is a moment where THA **did less** — the list that was already right, the substitution it remembered without mentioning, the allergy honoured unwitnessed on a Tuesday in March, the week it said nothing at all. **THA succeeds when a family eats well and forgets it was helped.** Its own declared measure — *"the household ate better with less effort"* — is a sentence it cannot yet evaluate, and closing that gap honestly, by listening rather than by watching, is the whole of the work.

---

*An investigation — a point-in-time design of the household journey against the governing Experience, Platform and Intelligence architectures. It is history the moment it is written and is never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). Subordinate to the Experience Architecture, which prevails in any conflict.*
*Rollback: this document is new and uncommitted — to revert entirely, delete this file. Rollback tag for the ORCH1 workstream: `rollback/ORCH1-household-journey-blueprint-20260716` → `7d1dd2ce`.*
