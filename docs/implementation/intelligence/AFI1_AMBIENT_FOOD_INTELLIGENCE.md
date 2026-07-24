# AFI1 — Ambient Food Intelligence

**The first new Ambient Food Intelligence capability since FI4: a single, calm, evidence-backed "small lift" for a meal the household has ALREADY planned this week — delivered through the one existing Observation → Insight → Recommendation pipeline, not a second one.**
Connection, not addition. No new nutrition knowledge; no new pipeline; no duplicated recommendation logic.

| | |
|---|---|
| **Session** | `AFI1_Ambient_Food_Intelligence` |
| **Date** | 2026-07-18 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/AFI1-ambient-food-intelligence-20260717` → `7bfad50c` |
| **Status** | **Implemented and verified.** New recommendation renders live end-to-end; 51/51 tests; screenshots captured. Awaiting owner review before commit. |
| **Product changed** | Additive: one new opportunity generator (server reasoning), one additive optional client prop, one meal-card mount. No owner, no schema, no knowledge, no new capability, no new route. |

---

## 1. The reusable pipeline already exists — AFI1 extends it, never duplicates it

The brief asks for "one reusable Observation → Insight → Recommendation pipeline"
surfaced across Planner, Meal cards, Pantry, Shopping, Food pages and Companion,
with the hard rule **do not duplicate recommendation logic**. Reconnaissance
established that **that pipeline already exists and is live** (built as FI4/OD1/
DEC1/PHASE5C):

| Stage | Owner (reused verbatim) |
|---|---|
| **Observation** | The household's own planner/pantry/shopping state, read through existing Intelligence Platform read ports; household context via `resolveHouseholdSignal` (engine.ts). |
| **Insight** | The **Food Opportunity Engine** — `server/intelligence/food-intelligence/opportunity-engine.ts` — pure, deterministic generators. |
| **Recommendation** | `FoodOpportunity` → `prioritizeOpportunities` (DEC1 attention math) → the `food-intelligence`/`report` producer registered in OD1's `OPPORTUNITY_SOURCES` → delivery lifecycle (`opportunity_deliveries`) → `GET /api/intelligence/food-opportunities` → `useFoodOpportunities` → the generic `AmbientIntelligence` surface → the generic `FoodOpportunityCard` → and, for the Companion, the Notice Engine's `noticeOpportunities`. |

FI4 left `FoodOpportunityType` a **"closed-but-extensible union"** and named its own
next milestone: *"a fourth opportunity type."* **AFI1 is exactly that fourth type.**
Because the delivery framework, ranking, muting, learning, card and Companion
voicing are all generic on `type`, a new generator flows through the entire
pipeline with **zero framework change** — the definition of not duplicating the
recommendation logic.

---

## 2. The one excellent recommendation: `planner-meal-uplift`

> **"Overnight Oats with Berries" (Tuesday in "Week 1") could have a small lift — add chia seeds.**
> *When you make "Overnight Oats with Berries", add chia seeds.*  —  Why: [the uplift rule's own approved reason]

For a meal the household has **already planned this week**, offer the single best
evidence-backed lift the **Uplift Rules** already know — the same "simply better"
knowledge the Food page's *Simply better choices* shows per-food, now made
**ambient and timely**. It answers *"how does this help my household right now?"*
directly: it names a meal on **this** week's plan and a change they can make when
they cook it.

It meets every principle in the brief:

- **Household-specific** — it reads *their* planner week and names *their* planned meal; it is never a generic tip.
- **Evidence-aware** — every card cites two sources: the plan it read (`planner-week`) and the uplift rule's own approved, user-facing `why` (`nutrition-enhancement`). Rule E1: no citation, no card.
- **Actionable** — the suggested action is a concrete thing to do next time they cook that meal (add / swap in / add more an ingredient).
- **Calm** — priority `low`; the surface is collapsed by default and may be ignored forever; exactly **one** opportunity is emitted for the whole week (lowest rule priority wins), never a list of average ones.
- **Safe** — a suggested ingredient that conflicts with a stored household hard restriction is dropped via the **same** `resolveIngredientRestrictions` matcher the shopping-safety generator uses. The engine never suggests adding something a named member cannot have.
- **No new knowledge** — the Uplift Rules are read verbatim from the one canonical `UPLIFT_RULES`; AFI1 adds no fact and owns no data (Rule FI1).

---

## 3. Rollback

| Item | Value |
|---|---|
| **Tag** | `rollback/AFI1-ambient-food-intelligence-20260717` |
| **Resolves to** | `7bfad50c` (`7bfad50ca198f2b86f6501a4f82d8ae41af9260b`) |
| **HEAD at session** | `7bfad50c` — matches the tag; committed state fully protected. |
| **Working-tree caveat** | The tree was **dirty at session start — NOT this session's changes.** ~132 pre-existing sibling-session edits **plus** FI20's own uncommitted Food-Comparison work (awaiting its own review). The tag protects **committed** state only. AFI1 left all of that byte-untouched and committed nothing. |

**Roll back AFI1 only:** discard this session's files (§4) — the tree returns to
its pre-AFI1 (still sibling/FI20-dirty) state. Every AFI1 edit is additive and
independently revertible; nothing outside AFI1's own files depends on the new
type.

---

## 4. Files changed (this session's writes)

**Modified**

| File | Δ | Change |
|---|---|---|
| `server/intelligence/food-intelligence/opportunity-engine.ts` | +147/−4 | New pure generator `identifyPlannerMealUpliftOpportunities`; new union member `planner-meal-uplift`; new subject entity `planner-meal`; new `PlannedMealRef` type; a memoised uplift rule index (same pattern the food-page/meal assemblers use); orchestration in `identifyOpportunities` resolves planned-meal names via the planner port's own `getMeal` (no new query) and calls the generator. |
| `client/src/components/intelligence/AmbientIntelligence.tsx` | +16/−4 | Additive optional `types?` prop — narrows a subject-scoped surface (e.g. a meal card) to a specific opportunity type. Omitted = prior behaviour (all types). Re-ranks nothing (DEC1 §3). |
| `client/src/pages/meal-detail-page.tsx` | +15 | Mounts `AmbientIntelligence` in the Meal Intelligence section, scoped `domains={["planner"]} types={["planner-meal-uplift"]}`, title "A small lift for this week". |
| `server/tests/test-intelligence-food-opportunity-binding.ts` | +52 | New §1 block: 11 assertions for the generator (one-excellent, type/domain/priority, cited evidence, grounded explanation, determinism, honest-none, and the safety filter). |

**New**

| File | Role |
|---|---|
| `scripts/afi1-capture-ambient-screenshots.ts` | Playwright capture of the ambient surfaces against a live dev server + seeded demo household. Read-only; writes only PNGs. |
| `docs/implementation/intelligence/AFI1_AMBIENT_FOOD_INTELLIGENCE.md` | This doc. |
| `docs/implementation/assets/afi1/*.png` + `manifest.json` | The captured screenshot set. |

> No new capability, no new route, no schema, no owner, no knowledge file. The
> platform's live-capability count is unchanged; `food-intelligence`/`report`
> already carried this producer.

---

## 5. Surfacing across the six named surfaces

The new recommendation reaches all six through the **one** pipeline — not six copies of it:

| Surface | How the ambient intelligence reaches it |
|---|---|
| **Planner** | The new opportunity's owning domain is `planner`; the planner page's existing `AmbientIntelligence domains={["planner"]}` picks it up automatically (verified — see §6). |
| **Meal cards** | **New** scoped `AmbientIntelligence` mount on `meal-detail-page.tsx` — the one surface that lacked any ambient/opportunity presence. Scoped to `planner-meal-uplift` so a meal page shows only that calm lift, never an unrelated planner/pantry/shopping card. |
| **Pantry** | Existing `AmbientIntelligence domains={["pantry"]}` — unchanged. |
| **Shopping** | Existing `AmbientIntelligence domains={["shopping"]}` — unchanged. |
| **Food pages** | Already surface the **same** uplift knowledge via `ConnectedFoodPanel`'s *Simply better choices* section (per-food). Left as-is — mounting a second ambient surface here would duplicate that and add unrelated-opportunity noise, violating "calm / only when genuinely useful". |
| **Companion** | The Notice Engine's `noticeOpportunities` reads the same delivery bundle and voices opportunities (evidence-gated); the card's "Why this?" affordance routes to `opportunity-delivery:explain`. Unchanged — the new type flows through automatically. |

---

## 6. Verification results

### 6.1 Automated tests — green, with new coverage
`npm run test:intelligence-food-opportunity-binding` → **51 passed, 0 failed**
(was 40; +11 AFI1 assertions). New coverage proves: exactly one lift per week
(prefer one excellent), correct type/domain/`low` priority, evidence cites both
the plan and the uplift `why`, the explanation names the real planned meal,
determinism (Rule LT3), honest none when a meal has no known lift, and — the
safety property — **a suggested ingredient that conflicts with a household hard
restriction is never surfaced** (the Rule T0 matcher swaps it for a safe
alternative or emits nothing).

### 6.2 Typecheck — AFI1 files clean
`tsc --noEmit` over the four AFI1 files reports **zero** errors. The tree-wide
pre-existing errors are unrelated baseline breakage: authored-but-unbuilt
opportunity generators referenced by `test-cbk2`/`test-pantry1`/`test-shop1`
(not in the test chain, already red at `HEAD`) and the COMP1 `assembleFoodComparison`
port stub FI20 already documented. AFI1 introduces none of them.

### 6.3 End-to-end in the running app
Fresh dev server (loaded with the new generator) + seeded demo household:
`POST /api/demo/start` → **201**; `GET /api/intelligence/food-opportunities` →
**resolved**, returning four opportunities including the new one, verbatim:

```
type: planner-meal-uplift
explanation: "Overnight Oats with Berries" (Tuesday in "Week 1") could have a small lift — add chia seeds.
suggestedAction: When you make "Overnight Oats with Berries", add chia seeds.
evidence: [planner-week, nutrition-enhancement]
subject: { entity: "planner-meal", id: <planner entry id>, label: "Overnight Oats with Berries" }
```

The demo household's own planned meal matched a reviewed uplift rule and produced a
cited, safe, actionable lift — from real seeded data, through the whole pipeline.

---

## 7. Screenshots

Captured by `scripts/afi1-capture-ambient-screenshots.ts` → `docs/implementation/assets/afi1/`.
Live dev server, seeded demo household, mobile viewport 430×932. The ambient
surface is collapsed-by-default (calm before capability), so each shot expands it first.

| File | Surface | What it shows |
|---|---|---|
| `home-ambient-aggregate.png` | Home aggregate | The new **`planner-meal-uplift` card, clearly** — *"Overnight Oats with Berries" (Tuesday…) could have a small lift — add chia seeds*, with **Helpful / Not now / Why this?** and a **Why** evidence toggle — sitting calmly beside a planner-gap and a pantry card, all through the one generic `FoodOpportunityCard`. |
| `planner-ambient-uplift.png` | Planner | The planner's own ambient surface, expanded ("Gaps in your week · 4") — the new uplift joins the existing planner opportunities in the same surface, ranked calm (low) after the gaps. |
| `meal-card-ambient-uplift.png` | Meal card | The **new scoped mount** — "A small lift for this week" on `meal-detail-page`, showing only the `planner-meal-uplift` card and no unrelated domain-mates. |

> **Capture note.** The demo-household endpoint is rate-limited to 5/hour per IP;
> the meal-card shot was re-captured once a slot freed (the initial attempt used
> the opportunity's planner-*entry* id as a meal id and landed on "Meal not found"
> — a capture-script bug, since fixed to resolve the meal id by name; the product
> mount was always correct, as the identical card in the Home shot demonstrates).

---

## 8. Follow-on recommendations

1. **A second observation source for the uplift, for weeks with a thin plan.** Today the generator reads *planned meals*. When the plan is empty it honestly emits nothing. A calm fallback — the household's most-*familiar* cooked food (already available in `resolveHouseholdSignal`'s `familiarAppearances`) — would keep the lift useful in a sparse week, still one-excellent and cited.
2. **Ingredient-aware matching.** The generator matches the uplift engine on the meal *name* only (the planner port's cheap `getMeal`). Feeding the meal's ingredient list (via the meal-intelligence read the meal page already performs) would find more, better-targeted lifts — without any new knowledge.
3. **Close the two pre-existing typecheck gaps** noted in §6.2 (unbuilt cbk2/pantry1/shop1 generator tests + the COMP1 port stub). Unrelated to AFI1, but they keep the tree red; each is a small, separate fix.
4. **Accept/dismiss learning is already wired** — AFI1 inherits OD1/LEARN1's Evidence loop for free (accept → positive, dismiss → negative, keyed on `type`). Worth a follow-up to confirm the new type accumulates a Confirmed Understanding as intended once real households use it.
5. **A per-meal (not per-week) variant, if desired.** AFI1 deliberately emits one lift for the whole week (prefer one excellent). If product wants the meal card to show the lift for *that specific meal*, extend the generator to key per planned entry and have the meal-card mount filter by `subject.id` — a bounded, additive change.

---

## 9. Provenance

- **Pipeline reused:** FI4 Food Opportunity Engine · OD1 Opportunity Delivery Framework · DEC1 Decision mechanics · PHASE5C/E Ambient Intelligence + Food Opportunity card · EWX1 Notice Engine (Companion).
- **Knowledge reused:** the Uplift Rules (`server/lib/uplift-engine.ts`, `uplift-rules.ts`) — the same "simply better" source the Food page and Meal Intelligence assemblers read.
- **Services reused:** `resolveHouseholdSignal` (household), planner read port, `resolveHouseholdPlannerWeek`, `resolveIngredientRestrictions` (safety), the capability registry's `food-intelligence`/`report` binding.
- **Screenshot discipline:** the PDA1 pattern (real Chromium, seeded demo household), as FI20 also used.
- **Run file:** `.engineering/session/runs/AFI1_Ambient_Food_Intelligence.md`.
