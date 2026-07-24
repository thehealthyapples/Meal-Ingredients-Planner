# AFI2 — Planner Ambient Intelligence

**Extends Ambient Food Intelligence into the Planner with ONE new, calm, evidence-backed observation — "you've planned this meal on several days this week; cook one batch and it covers them all" — delivered through the one existing Observation → Insight → Recommendation pipeline, not a second one.**
Connection, not addition. No new nutrition knowledge; no new pipeline; no duplicated recommendation logic; no second recommendation engine.

| | |
|---|---|
| **Session** | `AFI2_Planner_Ambient_Intelligence` |
| **Date** | 2026-07-18 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/AFI2-planner-ambient-intelligence-20260718` → `7bfad50c` |
| **Status** | **Implemented and verified.** New recommendation renders live end-to-end; 64/64 unit tests (+13 AFI2); screenshots captured. Awaiting owner review before commit. |
| **Product changed** | Additive: one new opportunity generator (server reasoning) + one new union type member + one additive field on an existing type. No client change (the planner already mounts the one ambient surface). No owner, no schema, no knowledge, no new capability, no new route. |

---

## 1. The reusable pipeline already exists — AFI2 extends it, never duplicates it

The brief asks to "extend Ambient Food Intelligence into the Planner… reuse the
existing Observation → Insight → Recommendation pipeline… do not create a second
recommendation engine… do not add new nutrition knowledge." Reconnaissance
(and AFI1 before it) established that the pipeline already exists and is live
(FI4 / OD1 / DEC1 / PHASE5C):

| Stage | Owner (reused verbatim) |
|---|---|
| **Observation** | The household's own current planner week, read through the existing planner read port; household context via `resolveHouseholdSignal` (engine.ts). |
| **Insight** | The **Food Opportunity Engine** — `server/intelligence/food-intelligence/opportunity-engine.ts` — pure, deterministic generators. |
| **Recommendation** | `FoodOpportunity` → `prioritizeOpportunities` (DEC1 attention math) → the `food-intelligence`/`report` producer in OD1's `OPPORTUNITY_SOURCES` → delivery lifecycle → `GET /api/intelligence/food-opportunities` → `useFoodOpportunities` → the generic `AmbientIntelligence` surface the Planner already mounts → the generic `FoodOpportunityCard` → and, for the Companion, the Notice Engine. |

Because the delivery framework, ranking, muting, learning, card and Companion
voicing are all generic on `type`, a new generator flows through the entire
pipeline with **zero framework change** — the definition of not duplicating the
recommendation logic. AFI1 added the fourth opportunity type through this exact
seam; **AFI2 is the fifth**, and it needs no client change at all: the Planner
page already mounts `AmbientIntelligence domains={["planner"]}`, so a new
`owningDomain: "planner"` opportunity appears there automatically.

---

## 2. The one excellent recommendation: `planner-batch-cook`

> **You've planned "Overnight Oats with Berries" on 3 days this week (Tuesday, Wednesday and Friday) — cook one batch and it covers them all.**
> *Batch-cook "Overnight Oats with Berries" once and portion it across Tuesday, Wednesday and Friday.*

For a meal the household has **planned on multiple days of this week**, offer the
single calmest "cook once, cover the week" observation — the brief's *ingredient
reuse / leftovers* opportunity, made **ambient and timely** in the Planner. It
answers *"how does this improve THIS week's plan?"* directly: it names a meal the
household **already chose**, on **this** week's plan, and one thing they can do —
batch it — that removes effort and waste across the days it recurs.

It meets every principle in the brief:

- **Household-specific** — it reads *their* current planner week and names *their*
  repeated meal and the *actual* days it is on; it is never a generic tip.
- **Evidence-aware** — every card cites the plan it read (`planner-week`: *"…is on
  your plan for 3 of the week's days (Tuesday, Wednesday and Friday)…"*). Rule E1:
  no citation, no card.
- **Actionable** — the suggested action is one concrete thing to do: batch-cook it
  once and portion it across the named days.
- **Calm** — priority `low`; the surface is collapsed by default and may be ignored
  forever; exactly **one** opportunity is emitted for the whole week (the meal on the
  most days — the biggest single win), never a list of average ones.
- **No new knowledge** — it reasons only over the household's OWN plan (the planned
  meals AFI1 already resolves). It asserts nothing about nutrition, bodies or
  outcomes (Rule T1 — it names a meal and the days it is on), owns no data (Rule FI1),
  and touches **no contested domain**.

**Why not plant diversity / nutritional balance (the brief's first-listed items)?**
Those observations already exist as a pure, cited core
(`shared/nutrition/household-nutrition.ts` `buildOpportunities` — a plant-diversity
gap and a balance gap, keyed to this week) and the first AFI2 design re-voiced them
through the ambient pipeline. **A runtime probe proved that whole weekly-nutrition
subsystem is broken at the committed HEAD (`7bfad50c`):** its assembler
(`assembleHouseholdNutrition`) reads `planner.byWeek` / `PlannerWeekFacts`, but its
source read (`fetchHouseholdPlannerFoods`) returns neither — so the call throws, its
`/api/household-nutrition` route is not even wired, and its panel is self-described
as orphaned. Building on dead code means a card that can never surface. And plant
diversity is a **contested domain** the codebase explicitly forbids computing a
second time — so re-deriving it in the ambient engine was never an option either.
Both roads require fixing a *different* workstream's subsystem (out of AFI2 scope,
and a real hazard in a shared dirty tree). The pivot to `planner-batch-cook` keeps
AFI2 entirely within the brief's list, reuses only **working** reads, and creates no
new owner of anything. See §8 follow-on #1.

---

## 3. Rollback

| Item | Value |
|---|---|
| **Tag** | `rollback/AFI2-planner-ambient-intelligence-20260718` |
| **Resolves to** | `7bfad50c` (`7bfad50ca198f2b86f6501a4f82d8ae41af9260b`) |
| **HEAD at session** | `7bfad50c` — matches the tag; committed state fully protected. |
| **Working-tree caveat** | The tree was **dirty at session start — NOT this session's changes** (~217 entries: pre-existing sibling-session edits **plus** AFI1's and FI20's own uncommitted work, each awaiting its own review). The tag protects **committed** state only. **AFI1's changes to `opportunity-engine.ts` are themselves uncommitted** (AFI1 committed nothing), so AFI2 is layered on top of AFI1 in the same file — a raw `git diff HEAD` conflates the two. AFI2 committed nothing and left all sibling/AFI1/FI20 work byte-untouched except for the additive AFI2 lines described in §4. As AFI1 observed, a concurrent sibling process has clobbered untracked docs mid-session before — this doc and the screenshots are backed up to the session scratchpad. |

**Roll back AFI2 only:** discard this session's writes (§4). Because AFI1's work is
also uncommitted, discarding AFI2's specific additions (the `planner-batch-cook`
type, the `identifyPlannerBatchCookOpportunities` generator, the `mealId` field, the
`joinDays` helper, the orchestrator push, and the AFI2 test block) returns
`opportunity-engine.ts` to its AFI1 state. Every AFI2 edit is additive and
independently revertible; nothing outside AFI2's own lines depends on the new type.

---

## 4. Files changed (this session's writes)

**Modified** (additive; AFI2's own lines, layered on AFI1's uncommitted edits in the same files)

| File | AFI2's own change |
|---|---|
| `server/intelligence/food-intelligence/opportunity-engine.ts` | New pure generator `identifyPlannerBatchCookOpportunities(plannedMeals, week)`; new union member `planner-batch-cook`; additive `mealId` field on `PlannedMealRef` (the AFI1 uplift generator ignores it); a small display helper `joinDays`; orchestration — the same `plannedMeals` AFI1 resolves now also carry `mealId` and feed the new generator (no new read, no new query, no new owner). |
| `server/tests/test-intelligence-food-opportunity-binding.ts` | New §1 block: 13 assertions for the generator (one-excellent / most-days, type/domain/`low` priority, subject keyed on the meal id, names the real meal + days, cited evidence, the distinct-days rule — same meal twice on one day is not a batch, determinism, and two honest-none cases). Plus `mealId` added to the two AFI1 `PlannedMealRef` fixtures. |

**New**

| File | Role |
|---|---|
| `scripts/afi2-capture-ambient-screenshots.ts` | Playwright capture of the Planner ambient surface against a live dev server + seeded demo household. Read-only; writes only PNGs. |
| `docs/implementation/intelligence/AFI2_PLANNER_AMBIENT_INTELLIGENCE.md` | This doc. |
| `docs/implementation/assets/afi2/*.png` + `manifest.json` | The captured screenshot set. |

> No new capability, no new route, no schema, no owner, no knowledge file. **No client
> change:** the Planner already mounts the one ambient surface, so the new type appears
> there (and on Home/Dashboard and in the Companion) automatically. The platform's
> live-capability count is unchanged; `food-intelligence`/`report` already carried this
> producer.

---

## 5. Surfacing — the new observation reaches every surface through the one pipeline

| Surface | How the new observation reaches it |
|---|---|
| **Planner** | The opportunity's owning domain is `planner`; the planner page's existing `AmbientIntelligence domains={["planner"]}` picks it up automatically (verified — §6, §7). |
| **Home / Dashboard** | The aggregate `AmbientIntelligence` (no domain filter) shows it beside the other opportunities through the same generic card (verified — §7 home shot). |
| **Companion** | The Notice Engine reads the same delivery bundle and voices opportunities (evidence-gated); the card's "Why this?" routes to `opportunity-delivery:explain`. Unchanged — the new type flows through automatically. |
| **Meal cards / Pantry / Shopping / Food pages** | Unchanged. The batch-cook observation is about the *week's plan as a whole*, so it belongs on the planner/aggregate surfaces, not a single meal, pantry item, shopping list, or food page — surfacing it elsewhere would borrow an unrelated-domain card (calm over complete). |

---

## 6. Verification results

### 6.1 Automated tests — green, with new coverage
`npm run test:intelligence-food-opportunity-binding` → **64 passed, 0 failed**
(was 51 after AFI1; +13 AFI2 assertions). New coverage proves: exactly one
batch-cook per week (prefer one excellent) selecting the meal on the **most distinct
days**; correct type/domain/`low` priority; subject keyed on the **meal** id (it
recurs across entries); the explanation names the real meal and its real days;
evidence cites the plan (Rule E1); the **distinct-days** rule (the same meal twice on
one day is not a batch — never a false positive); determinism (Rule LT3); and two
honest-none cases (no repeat across days, no planned meals).

Downstream, the new type flows through unchanged: `opportunity-delivery-binding`
**60/60**, `dec1-decision-engine` **49/49**, `attn1-attention-platform` **29/29**,
`notice-engine` **65/65** — zero regression across delivery, ranking, attention and
Companion voicing.

### 6.2 Typecheck — AFI2 files clean
`tsc --noEmit` over `opportunity-engine.ts` reports **zero** errors. (An early draft
tripped the DEC1 "no local attention sort" guard by indexing `ATTENTION_RANK`
directly, and the project target flagged raw `Map`/`Set` iteration — both fixed:
selection now goes through the canonical `orderByAttention` where needed, and the
generator uses `Array.from(...)`, the codebase convention.) The only tree-wide error
touching an AFI2 file is the **pre-existing** COMP1 `assembleFoodComparison` port
stub in the test's §2 fixture (documented in AFI1 §6.2, red at `HEAD`, not AFI2's).

### 6.3 End-to-end in the running app
Fresh dev server (loaded with the new generator) + seeded demo household:
`POST /api/demo/start` → **201**; `GET /api/intelligence/food-opportunities` →
**resolved**, returning the new opportunity in the `planner` group, verbatim:

```
type: planner-batch-cook
priority: low
explanation: You've planned "Overnight Oats with Berries" on 3 days this week (Tuesday, Wednesday and Friday) — cook one batch and it covers them all.
suggestedAction: Batch-cook "Overnight Oats with Berries" once and portion it across Tuesday, Wednesday and Friday.
evidence: [planner-week]
subject: { entity: "planner-meal", id: <meal id>, label: "Overnight Oats with Berries" }
```

The demo household's own plan repeated one meal across three days and produced a
cited, actionable cook-once observation — from real seeded data, through the whole
pipeline, alongside the AFI1 uplift and the planner-gap opportunities.

---

## 7. Screenshots

Captured by `scripts/afi2-capture-ambient-screenshots.ts` → `docs/implementation/assets/afi2/`.
Live dev server, seeded demo household, mobile viewport 430×932. The ambient surface
is collapsed-by-default (calm before capability), so each shot expands it first.

| File | Surface | What it shows |
|---|---|---|
| `planner-batchcook-card.png` | Planner (card, focused) | The **new `planner-batch-cook` card, clearly** — *"…Overnight Oats with Berries" on 3 days this week (Tuesday, Wednesday and Friday) — cook one batch and it covers them all*, with the concrete **batch-cook** action and **Helpful / Not now / Why this?** + a **Why** evidence toggle, through the one generic `FoodOpportunityCard`. |
| `planner-ambient-batchcook.png` | Planner (full surface) | The planner's own ambient surface, expanded ("Gaps in your week · 5") — the new cook-once joins the existing planner opportunities in the same surface, ranked calm (`low`) after the medium empty-day gaps. |
| `home-ambient-aggregate.png` | Home aggregate | The new card sitting **calmly beside the AFI1 uplift**, both under PLANNER, both through the one generic card — the aggregate Home surface picks up the new type automatically. |

---

## 8. Follow-on recommendations

1. **Repair the weekly household-nutrition subsystem, then re-voice plant diversity / balance through this same seam (highest-value follow-on).** The brief's first-listed observations (plant diversity, nutritional balance) already exist as a pure, cited core (`shared/nutrition/household-nutrition.ts`), but `assembleHouseholdNutrition` is **broken at `HEAD`**: it reads `planner.byWeek` / `PlannerWeekFacts` that `fetchHouseholdPlannerFoods` never returns. Once that canonical read is repaired (its own workstream — it is a contested domain and must have exactly one owner), a `planner-week-nutrition` generator can re-voice its single most useful current-week observation through the ambient pipeline **exactly as AFI2 does for batch-cook** — the design is already worked out (select the highest-attention non-planning observation via `orderByAttention`, carry its evidence verbatim, drop `nutrition-planning-gap` to avoid duplicating the planner's own empty-day card). This is a genuine gap surfaced by AFI2, not introduced by it.
2. **Ingredient-reuse across *different* meals (a natural sibling).** AFI2 surfaces the same meal repeated across days. A companion observation — a substantive ingredient shared by two *different* planned meals this week — is available from the working `fetchHouseholdPlannerFoods.bySlug` (its `mealCounts` already map slug → meals) with no new knowledge. It needs a small rule for which foods are "substantive" (not pantry staples like oil/garlic/salt) so it stays useful; worth designing deliberately before adding.
3. **Seasonal opportunities.** `shared/seasonal/engine.ts` (`seasonalStories`) is live and already consumed by the Notice Engine — a calm "a food your household enjoys is at its seasonal best this week" observation is reachable through this seam, but it introduces a time/season input (Rule LT3 asks generators to stay deterministic), so pass the date in explicitly rather than reading the clock inside the generator.
4. **Accept/dismiss learning is already wired.** AFI2 inherits OD1/LEARN1's Evidence loop for free (accept → positive, dismiss → negative, keyed on `type`). Worth confirming the new type accumulates a Confirmed Understanding as intended once real households use it.
5. **Commit soon — the shared dirty tree is a durability hazard.** AFI1 observed a concurrent sibling process clobbering untracked docs mid-session. AFI2's files are backed up to the session scratchpad, but the durable fix is for the owner to review and commit AFI1 + AFI2 together (AFI2 builds directly on AFI1's uncommitted `opportunity-engine.ts` changes).

---

## 9. Provenance

- **Pipeline reused:** FI4 Food Opportunity Engine · OD1 Opportunity Delivery Framework · DEC1 Decision mechanics · PHASE5C/E Ambient Intelligence + Food Opportunity card · EWX1 Notice Engine (Companion). Built directly on **AFI1**, which added the fourth type through the same seam.
- **Services reused:** `resolveHouseholdSignal` (household), the planner read port, `resolveHouseholdPlannerWeek` (current-week anchor) — all already in `identifyOpportunities`. The new generator adds **no** read: it reuses the `plannedMeals` AFI1 already resolves.
- **Knowledge added:** none. No nutrition knowledge, no contested-domain computation, no new owner or data.
- **Screenshot discipline:** the PDA1 pattern (real Chromium, seeded demo household), as AFI1 and FI20 used.
- **Run file:** `.engineering/session/runs/AFI2_Planner_Ambient_Intelligence.md`.
