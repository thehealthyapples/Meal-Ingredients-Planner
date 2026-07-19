# NUTPLAN1 — Household Nutrition Intelligence

**Status:** ✅ Complete — awaiting owner review.
**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback/NUTPLAN1-household-nutrition-intelligence-20260719` → `6b93a752` (annotated tag + branch); worktree snapshot `refs/snapshots/NUTPLAN1-worktree-20260719` → `a1db1cd5`
**Governing architecture:** [`README.md`](../../architecture/README.md) bootstrap read in full.

---

## 1. Mission

Complete the **remaining** household nutrition intelligence that powers planning decisions, by
extending the existing Canonical Food, Knowledge and Planner architecture.

**Explicitly out of scope:** another planner, another intelligence engine, any duplicate business
logic. Every recommendation must be evidence-backed where applicable and must respect the
canonical Household Dietary Safety Gate (`server/lib/household-dietary-safety.ts`, completed by
`PROD6`).

Because the mission word is **complete**, not *build*, the first act of this session is an
inventory. Building a capability THA already has would be the precise failure the mission forbids.

**The inventory justified itself.** Both gaps implemented below are cases of a *surface not
reaching an owner THA already had* — not of a missing owner. Neither adds a rule, an engine, a
keyword list or a schema column. Had this session started from a feature list rather than an
inventory, the likely output was a second plant counter and a second safety filter.

---

## 2. Preflight

| Step | Result |
|---|---|
| Architecture bootstrap (`docs/architecture/README.md`) | ✅ Read in full |
| Git status confirmed | ✅ `int1-intelligence-platform`; rollback tag `6b93a752`; HEAD at resume `703c9a31` |
| Rollback protection created | ✅ See below |
| `rollback-verify.sh` | ✅ PASS — tag exists, is annotated, resolves to a commit |
| Rollback **re-verified on resume** | ✅ tag → `6b93a752`, snapshot → `a1db1cd5` |
| Session registered on the recovery dashboard | ⚠️ **Was missing** — see §2.1 |

### Rollback identifier

```
rollback/NUTPLAN1-household-nutrition-intelligence-20260719  →  6b93a752   (annotated tag + branch)
refs/snapshots/NUTPLAN1-worktree-20260719                    →  a1db1cd5   (tracked-file worktree snapshot)
```

The snapshot captures **tracked** modifications only (`git stash create` does not include untracked
files). Untracked deliverables from prior sessions are not at risk: restoring the snapshot does not
remove untracked files.

### 2.1 A recovery-protocol defect found on resume

NUTPLAN1 had **no run file** under `.engineering/session/runs/` and **zero mentions in
`CURRENT.md`**, despite this document recording preflight as complete. The session was never
registered on the recovery dashboard, so the protocol's own entry point — *"read `CURRENT.md`, open
the active run file, continue from Next action"* — would have found nothing. Had the session been
interrupted again, the only recoverable state was this document.

Closed at the start of the resumed session:
[`runs/NUTPLAN1_Household_Nutrition_Intelligence.md`](../../../.engineering/session/runs/NUTPLAN1_Household_Nutrition_Intelligence.md).
Recorded here because a rollback identifier nobody can find is not rollback protection.

---

## 3. Architecture & AI Architecture Compliance

Confirmed against `ENGINEERING_WORKFLOW.md`. Both checklists are completed in **§8**.

**Binding constraints carried into every decision below:**

- **Principle 2 — one owner per fact.** No nutrition fact may gain a second owner.
- **Principle 6 — non-fabrication.** Honest gaps over invented content.
- **Principle 8 — retire on introduction.** Any rival logic found is retired, not left beside.
- **AI compliance** — capabilities register through the Capability Registry and reach the model
  only via INT17 Context Composition.
- **Household Time** — season resolves only through `shared/seasonal/season-rule.ts`; planner-week
  meaning only through the `weekStartDate` anchor (**HT7**). Any weekly claim must degrade honestly
  for unanchored households.
- **Safety** — every food-producing surface reaches the canonical gate (`PROD6`).

---

## 4. Inventory of existing capability

Four parallel read-only passes: nutrition domain, planner intelligence, client surfacing (in both
directions), and the knowledge/evidence layer with live data counts. Every claim below is cited to
`file:line` or to a live query. Findings the session verified independently are marked **✔ verified
by this session**.

### 4.1 Already implemented and surfaced (working end-to-end)

| Capability | Owner | Route → Client |
|---|---|---|
| Nutrition Knowledge Registry (WS0) | `server/services/nutrition-knowledge-registry.ts` | `/api/knowledge/*` → `PantryKnowledgeHub`, `HouseholdNutritionCentre` |
| Household Nutrition Centre | `server/lib/nutrition-centre-assembler.ts:126` | `/api/nutrition-centre` → `HouseholdNutritionCentre.tsx` |
| Food Intelligence (single food) | `server/lib/food-intelligence-assembler.ts:399` | `/api/foods/:slug/intelligence` → `food-detail-page.tsx` |
| Connected Food Intelligence | `server/lib/connected-food-intelligence-assembler.ts:292` | `/api/foods/:slug/connected` → `ConnectedFoodPanel.tsx` |
| Meal Intelligence | `server/lib/meal-intelligence-assembler.ts:467` | `/api/meals/:id/intelligence` → `CookbookMealIntelligenceStrip.tsx` |
| Meal Food Intelligence | `server/services/meal-food-intelligence.ts` | `/api/meals/:id/food-intelligence` → `MealFoodIntelligenceSection.tsx` |
| Food Comparison | `server/intelligence/food-intelligence/comparison-engine.ts:558` | `/api/foods/compare` → `FoodComparisonView.tsx` |
| Nutrition Uplift ("Simply Better") | `server/lib/uplift-engine.ts` + `uplift-rules.ts` | `/api/uplift/batch` → `MealUpliftPanel.tsx` |
| Smart Suggest (whole-week) | `server/lib/smart-suggest-service.ts:491` | `/api/meal-plans/smart-suggest` → `use-smart-suggest.ts` |
| Canonical Household Dietary Safety | `server/lib/household-dietary-safety.ts:169` | 12 call sites; fails closed |
| Plant classification & variety | `shared/canonical/plant-classifier.ts` | shared module, both planes |
| Per-meal macros | `server/services/meal-analysis.ts:255` | `/api/nutrition/bulk` → planner, cookbook |
| UPF / Apple Rating | `server/lib/upf-analysis-service.ts` | analyser surfaces |
| Preparation Knowledge | WS0 extended (Domain 28) | `getPreparationsForFood()` |

### 4.2 Implemented but NOT surfaced (route exists, no client consumer)

| Route | Owner | Note |
|---|---|---|
| `GET /api/meals/recommended` | `recommendation-service.ts:32` | Dead route. **Also reaches no safety gate** — mitigated only by having no caller |
| `GET /api/food-knowledge` (list) | `seed-food-knowledge.ts` | Client only ever fetches `/:slug` |
| `GET /api/food-knowledge/search` | `routes.ts:10849` | No client fetch |
| `GET /api/admin/ingredient-classifications` (+ PATCH / approve / reject) | `routes.ts:11241-11302` | A complete human-review workflow with **zero** admin UI |
| `GET /api/pantry/search-index` | `routes.ts:5972` | *Unconfirmed* — may be reached via a constructed URL |

### 4.3 Implemented but NOT connected (no route at all)

| Capability | Owner | Evidence |
|---|---|---|
| Household nutrition scoring — 4 dimensions, band, confidence, weekly summary, insights | `shared/nutrition/household-nutrition.ts:260,355,411,452` | Assembler + UI retired as dead code (MAT1). Only caller is its own test. `LAUNCH1:628` — *"of the module's 18 exports, the only thing any client imports is the constant `WEEKLY_PLANT_TARGET = 30`. All 561 lines of scoring logic are dead."* |
| Pantry Item Intelligence | `server/lib/pantry-intelligence-assembler.ts:120` | 328 lines, tested, **zero callers**. Name collision: `/api/pantry/intelligence` exists but calls a different owner |
| `resolveMacros` / `SR_LEGACY_MACROS` | `shared/catalogue/macro-fallback.ts:46,89` | No consumer outside its own directory |
| `GET /api/foods/:slug/report` | — | `food-report-evidence.ts:25` states the client reads this route. **The route does not exist** (stale comment) |
| `assertMealCompliantForPlanner` | `planner-compliance.ts:188` | Exported, zero callers |

### 4.4 Implemented but DATA-LIMITED (correct code, no useful output)

Live counts, queried 2026-07-19:

| Capability | State |
|---|---|
| **Health-benefit chips** | **0 render, platform-wide.** 49 of 1,988 composition links carry a citation; **0** are signed off by a named human. The Nutrition room says *"0 Health benefits supported"* |
| `getFoodsForBenefit()` | Correct, full-chain gated, returns `[]` for every benefit |
| `Established` evidence confidence | **Unreachable platform-wide** — requires a cited food→benefit row; **0 of 1,366** carry one |
| Preparation effects | 39 preparations, 420 links, **0 effects** |
| Nutrition context prose | 10 of 312 canonical foods (3.2%) |
| Additive knowledge (Domain 20) | 12 entries; covers no E-number individually |
| Knowledge Review Workbench | 2,028 lines, **0 releases**; governs *vocabulary only*, cannot address the claim backlog |
| Meal template slots | **1,261 of 1,316 templates carry no slot data** (PROD3) |
| `planner_week_eater_overrides` | **0 rows** — the `weekId` threaded through Smart Suggest changes nothing (dead branch) |
| Existing sign-offs | All **21** are anonymous (`reviewed_by IS NULL`) — no claim can be audited or withdrawn |

**The ceiling behind the ceiling:** even signing off every citation THA holds lights 89 chips across
29 foods — **8% of canonical foods**. The real constraint is curation (3,299 uncited claim rows),
not engineering.

### 4.5 Duplicate capability (two owners for one fact)

Ordered by consequence.

| # | Duplicate | Evidence |
|---|---|---|
| **D1** | **Weekly plant count derived 5×, under 2 incompatible dedup rules** | Group-dedup (correct): `routes.ts:11868`, `routes.ts:11951`, `PlantDiversityReport.tsx:267`. Ingredient-key dedup (**over-counts**): `nutrition-variety-chips.tsx:307`, `PlannerIntelligenceStrip.tsx:76`. A 5th, different rule (slug dedup): `nutrition-centre-assembler.ts:149`. **✔ verified by this session — fixed, §6.2** |
| **D2** | Uplift phrasing rule copied 5×, a 6th diverges | `nutrition-centre-assembler.ts:294`, `connected-food-intelligence-assembler.ts:265`, `routes.ts:5687`, `routes.ts:5809`, `food-detail-page.tsx:402`; divergent lowercase at `opportunity-engine.ts:508` |
| **D3** | "What do we know about this food" owned by **3 stores** | `knowledge_*` (evidence-gated, 610) · `food_knowledge` (ungated, 12) · `pantry_ingredient_knowledge` (ungated **health claims**, 47 + AI-enriched) |
| **D4** | Two diet-exclusion keyword tables, **diverged** | `meal-scoring-service.ts:57` vs `recommendation-service.ts:12`. Both are *third* engines behind `dietRules.ts` and the canonical library |
| **D5** | Two scoring paths ranking the same candidate | `meal-scoring-service.ts:94` (8 factors) and `household-meal-matcher.ts:171` (7 factors); both run in one Smart Suggest pass and can disagree |
| **D6** | Two suggestion engines | `smart-suggest-service.ts:491` (gated) vs `smart-meal-creation-engine.ts:109` (**was ungated** — §6.1) |
| **D7** | Two safety verdict shapes | `isMealSafeForHousehold` (server, fails closed) vs `computeRestrictionSafety` (client-bundled, returns `unknown` where the server returns `unsafe`). Both share `restriction-resolver`, so the *matcher* has one owner; the **fail semantics differ** |
| **D8** | A sixth week notion | `user_streaks.weekStartDate` written from a server-clock Monday, not the planner anchor |
| **D9** | "Is this a whole food" vocabulary | `smp-rating-service.ts:5` — ~250 hand-maintained terms overlapping `CANONICAL_SEED` without referencing it |
| **D10** | Meat/dairy/egg keywords client-side | `PlantDiversityReport.tsx:107-127` re-derives what `shared/canonical/foods.ts` category data owns |

### 4.6 Genuinely missing capability

| # | Missing | Note |
|---|---|---|
| M1 | **A dietary safety gate on `POST /api/meals/smart-create-from-ingredients`** | **✔ verified by this session — fixed, §6.1** |
| M2 | Nutrition opportunities never enter the Opportunity Delivery pipeline | HNP1 G1 — *"the single largest gap"* |
| M3 | No RNI/RDA/DRV/SACN/NHS reference standard anywhere in THA | CoFID under OGL identified as the unblocked route |
| M4 | No age/DOB on `household_eaters` (387 eaters, 0 nutritional attributes) | Correctly held behind a legal review — a birth date is Art. 9-adjacent |
| M5 | Plant diversity reads the **planner**, never the **diary** | A product decision about what the number measures |
| M6 | Compound "A or B" ingredient lines unresolved | NUT_VERIFY2 R1 — the largest remaining share of unresolved lines |
| M7 | `getPlantCategory` still fed the display key | NUT_VERIFY2 R2 — **why Legumes stays unticked** despite chickpeas resolving |
| M8 | No admin UI for claim sign-off | KNOW1 F6 |
| M9 | Sign-off is approve-all-valid, not per-claim | KNOW1 F5 — a rubber stamp at import scale |

### 4.7 Facts that are stale rather than missing

**✔ verified by this session against the live database, 2026-07-19:**

| Fact | Documented platform-wide | Measured |
|---|---|---|
| Households | 195 | **356** |
| Households with planner weeks | — | **234** |
| Anchored households | 3 | **49** |
| Unanchored households | 192 | **185** |
| Planner weeks (total / anchored) | 1,152 / 0 | **1,404 / 294** |
| `households.time_zone` set | — | **15 of 356** |
| Knowledge food seed split | 272 editorial + 338 graduated | **264 + 346** (total 610 correct) |

The *direction* of HT7 is unchanged and its rule is untouched — most households are unanchored and
never will be. But **"192 of 195" is now false**, and it is repeated verbatim in the mandatory
Architecture Bootstrap, the Household Time Architecture, the Source of Truth Register, the
Intelligence Language Guide, and five live code comments. Deliberately **not corrected by this
session** — see §9.1.

---

## 5. Gaps selected for implementation

Selection rule: implement only where a surface fails to reach an owner that **already exists**.
Everything requiring a *new* owner, a schema change, a seed change, or another domain's governing
document is roadmap, not this session.

| Gap | Why selected |
|---|---|
| **M1** — ungated food-producing route | A live consumer is served food with no allergen check. The gate exists and is 150 lines away in the same file |
| **D1** — plant count over-counted on the planner | A wrong number on screen, in the one figure the household is asked to act on. The correct value was already in the payload and being ignored |

**Explicitly rejected for this session:** D2/D3/D4/D5/D9 (convergence surgery deserving its own
rollback point), M3/M4 (blocked on external data and legal review), and **KNOW1 F1** — see §9.2.

---

## 6. Implementation

### 6.1 M1 — the canonical safety gate on ingredient-led meal recommendation

**The defect.** `POST /api/meals/smart-create-from-ingredients` (`server/routes.ts:11175`) returns
meals a household is invited to cook. It reached **no dietary gate of any kind**:
`rankMealsByIngredients` scores ingredient overlap and has no dietary awareness
(`smart-meal-creation-engine.ts`), and the route's only filter was a hardcoded drink-name regex. A
peanut household typing *"flour, butter, sugar"* was offered whatever the cookbook matched.

It is the exact sibling of `/api/suggest-from-ingredients`, which `PROD6` closed. **It survived
because it was never enumerated.** `PROD6`'s coverage test asserts "the complement" in prose but
enumerates routes **by hand**, and this route recommends *existing* meals rather than generating
new ones, so it never called `new OpenAI()` and never read as an "AI path". That is `PROD6`'s own
Remaining Risk #1 collecting.

**The change.** Adopts the gate the platform already has — no new rule, no second engine:

1. `resolveHouseholdSafetyContext(req.user!.id)` — resolved **server-side**, never from `req.body`.
2. **Fails closed**: an `unavailable` context returns `503 HOUSEHOLD_SAFETY_UNAVAILABLE` rather
   than letting the gate silently drop every meal and returning an empty list that reads as
   *"we found nothing"*.
3. Every candidate is put to `isMealSafeForHousehold` — the correct gate for *recommending an
   existing meal*, as that function's own header states (`validateAdaptationSafety` is for
   adaptations that **invent** ingredients).
4. **Never presents a filtered list as the whole answer** (PROD6's rule): the response carries
   `withheldForSafety` and a `withheldNote`, and the client renders it.

Response shape changed from a bare array to `{ meals, withheldForSafety?, withheldNote? }`;
`client/src/pages/meals-page.tsx` updated in the same change so the withheld count is *shown*, not
swallowed.

`server/tests/test-prod6-safety-gate-convergence.ts` gains the route, so the platform's own
coverage assertion now protects it: **76 → 78 assertions**.

### 6.2 D1 — one owner for the weekly plant count

**The defect.** `PlannerIntelligenceStrip.tsx` declared `weeklyProgress.plantCount` in its payload
type — the server's canonically-derived value — and then **ignored it**, recomputing locally with a
rival rule. Its comment claimed the local rule existed *"so counts stay consistent across the UI"*,
which is precisely what it broke.

**Measured before designing** (reproduced as a test, §4 of the new suite):

| Rule | Count |
|---|---|
| Server — dedup by **diversity group** (SoT Domain 4 / CPI1 S1-2) | **7** |
| Client — dedup by `normaliseForReuse(raw)` | **9** |

The client scored `red onion` / `onion` as two plants and `red pepper` / `pepper` as two more, and
called `isPlantIngredient` on **raw recipe lines**, which NUT_VERIFY1 proved unreliable — the
canonical index is exact-key, never substring. The two errors push in opposite directions; the
over-count wins. A household was told they were **closer to the 30-plant target than they were**.

**The change.** The server derives; the client renders.

- `PlannerIntelligenceStrip.tsx` — `computePlantCount` deleted; renders `data?.weeklyProgress?.plantCount`.
- `nutrition-variety-chips.tsx` — `WeeklyPlantDiversityCounter` takes `plantCount: number` as a
  prop and derives nothing. Its `normaliseForReuse` and `isPlantIngredient` imports are retired
  (Principle 8 — retired, not left beside).
- **Honest absence**: when the query has not resolved or the week holds no meals, the counter
  renders **nothing** rather than a `0` that reads as a measured result (Core Principle 6).

`computeMealVariety` (the per-meal 5-component variety score) is a **different fact with a
different owner** and legitimately stays client-side.

---

## 7. Verification evidence

Baseline captured **before** any edit, so a regression would be attributable rather than argued.

| Gate | Baseline | After | Verdict |
|---|---|---|---|
| `tsc --noEmit` | 94 | **94** | 0 introduced; **0 in touched files** |
| `npm run build` | 🟢, 4 warnings | 🟢, **4 warnings** | Proven equal by stashing the change and rebuilding |
| `test:prod6-safety-gate-convergence` | 76 | **78** | +2 from the newly covered route |
| `test:nutplan1` *(new)* | — | **23 / 0** | |
| `test:household-nutrition` | 54 | 54 | unchanged |
| `test:nut-verify1` | 55 | 55 | unchanged |
| `test:nut-verify2` | 81 | 81 | unchanged |
| `test:canonical-food` | 46 | 46 | unchanged |
| `test:knowledge-evidence-gate` | 116 | 116 | unchanged |
| `test:knowledge-claim-coverage` | 14 | 14 | unchanged |
| `test:knowledge-food-ownership` | 28 | 28 | unchanged |
| `test:canonical-knowledge-binding` | 67 | 67 | unchanged |
| `test:food-report-evidence` | 31 | 31 | unchanged |
| `test:planner-compliance` | 25 | 25 | unchanged |
| `test:plan1-planner-intelligence` | 58 | 58 | unchanged |
| `test:variety-surfacing` | 36 | 36 | unchanged |

**No schema change · no seed row · no migration · no scoring change · no new owner.**

### 7.1 The new suite pins the *reason*, not just the result

`server/tests/test-nutplan1-household-nutrition-intelligence.ts` (23 assertions, registered as
`npm run test:nutplan1`):

- **§1 structural** — the route resolves the household server-side, calls the gate, fails closed,
  declares `withheldForSafety`, and gates *before* assembling the response.
- **§2 behavioural** — a peanut household is refused satay, **still offered roast chicken** (the
  gate must narrow the list, not empty it), and an `unavailable` context refuses **even the
  objectively safe meal**. That last property is what makes the 503 correct.
- **§3 ownership** — the strip renders the server's count and derives none; the counter takes a
  prop; neither imports a classifier to count with.
- **§4 the measurement** — reproduces the divergence, and re-pins NUT_VERIFY2's safety finding from
  this side: **`black pepper` must NOT collapse into `pepper`**, because colour is *identity* for
  that food. If the descriptor peeler ever reaches it, households are credited with the wrong plant.

### 7.2 Three of the new tests failed on first run, and the code was right

Recorded because the failures were more useful than the passes. The suite initially asserted that
seven lines yield four plants, that three tomato spellings collapse to one, and that every line is
recognised by `isPlantIngredient`. All three were **my assumptions, not defects** — measured:

- Seven lines yield **three** plants (tomato, onion, pepper). The assertion was arithmetic error.
- **`vine tomatoes` resolves to `null`** — `vine` is absent from the descriptor vocabulary, so it
  contributes **zero** plants. A genuine **under**-count, opposite in direction to the over-count
  §6.2 fixed, and previously unrecorded.
- `isPlantIngredient` on a raw line is `false` for `400g tinned tomatoes` while the canonical chain
  resolves it to `tomato` — NUT_VERIFY1's finding, now pinned as the *property that justifies*
  §6.2 rather than as prose.

`vine tomatoes` is pinned as a **known gap in CI** rather than hidden, with an instruction to
delete the assertion and close the roadmap item when it is fixed. It was **not fixed here**:
NUT_VERIFY2 recorded that folding changes into that vocabulary caused three suite regressions, and
a descriptor change belongs in the session that owns the vocabulary, not in a nutrition session
that happened to find it.

---

## 8. Compliance checklists

### Architecture Compliance

| Item | Answer |
|---|---|
| Extends existing architecture? | ✅ Both changes connect a surface to an existing owner. No new owner, engine, table, or route |
| One owner per fact (P2)? | ✅ Strengthened — the weekly plant count goes from 2 live rules to 1 |
| Non-fabrication (P6)? | ✅ Honest absence when the count is unknown; the withheld note states the list was shortened; the stale HT7 figures are reported rather than silently repeated |
| Retire on introduction (P8)? | ✅ `computePlantCount` deleted; the counter's rival dedup and its two imports retired |
| No permanent sync bridge (P7)? | ✅ None introduced |
| Safety gate reached? | ✅ That is §6.1; coverage test extended so it stays reached |
| Schema / migration? | ✅ None |
| Household Time (HT7)? | ✅ The per-week route is **not** anchor-dependent (it takes `weekId` from the URL), so this fix serves all 234 planned households, not only the 49 anchored |

### AI Architecture Compliance

| Item | Answer |
|---|---|
| New capability registered? | ✅ N/A — no capability added |
| Reaches the model only via INT17? | ✅ Untouched; neither change is in a model path |
| No prompt-templated facts? | ✅ No prompt altered |
| No second assistant? | ✅ None |

### Experience & UI Governance

| Item | Answer |
|---|---|
| Honest empty state? | ✅ The counter renders nothing rather than `0` when unknown |
| One primary action / calm before capability? | ✅ No new surface; one line of copy added, in THA's plain register |
| Says what it withheld? | ✅ *"We left out 2 meals that don't suit your household's dietary needs."* — never a silent shortening |
| Safety is never a paid feature (C4)? | ✅ The gate is unconditional |

---

## 9. Remaining risks

### 9.1 The stale HT7 figures — reported, deliberately not corrected

"192 of 195 households" is false (§4.7) and appears in the **mandatory Architecture Bootstrap**, the
Household Time Architecture, the Source of Truth Register, the Intelligence Language Guide, and
five live code comments.

**Not corrected by this session, on purpose.** Editing another domain's governing architecture —
and specifically the headline figure of the Household Time convergence — inside a nutrition session
is exactly the unreviewed cross-domain change the governance model exists to prevent. The figure is
also load-bearing for *design* arguments in several documents ("the quiet day is the default day"),
which remain true at 185/234 but should be re-argued by their owner rather than find-and-replaced.

Note also that `docs/investigations/**` carries the figure in four places and **must not be
edited** — under `PKR1`, an investigation is history the moment it is written.

**Recommended as a small, self-contained `TIME4` correction pass** with the measured figures above.

### 9.2 KNOW1 F1 — the highest-value item in the platform, and it is not an engineering task

Signing off 64 cited claims lights **89 benefit chips across 29 foods** and replaces the Nutrition
room's *"0 Health benefits supported"*. It is one command.

**This session did not run it, and no future automated session should.**
`signoff-knowledge-claims.ts` stamps `reviewed_by` with a **named human reviewer**. Running it
would fabricate a qualified person's review of health claims — precisely what the evidence gate
exists to prevent, and a Principle 6 violation of the most consequential kind THA can commit. It
requires a named, qualified human. (The 21 existing sign-offs are all anonymous, which the audit
already records as unauditable — that is the same defect, already realised once.)

### 9.3 Carried forward, unaddressed

- **The route coverage list is still hand-maintained.** §6.1 closes this *instance*, not the
  *class*. The next unenumerated food-producing route will be equally invisible. A structural
  discovery pass — enumerate every `app.post`/`app.get` that returns meals, and assert the
  complement mechanically — is the real fix.
- **`GET /api/meals/recommended` still reaches no safety gate.** Left alone because it has **no
  client consumer**; the correct action is *deletion*, which is a retirement decision with an owner,
  not a nutrition fix. If it is ever wired to a surface, it ships an ungated recommender.
- `computeRestrictionSafety` runs **client-side only** and appears in **zero** non-test server
  files. The analyser's allergy verdicts are never server-validated, and its `unknown` differs from
  the server's `unsafe` (D7).
- Smart Suggest's service is callable directly with an empty restriction set and would fail open;
  correct today only because its route populates it.
- 94 pre-existing `tsc` errors, three sessions old.

---

## 10. Recommended roadmap

| Session | Scope | Value | Cost |
|---|---|---|---|
| **NUTPLAN2 — Safety Coverage by Construction** | Replace PROD6's hand-maintained route list with mechanical discovery of food-producing routes; retire or gate `/api/meals/recommended`; bring the analyser's client-side restriction path under a server verdict (D7) | 🔴 High | M |
| **NUTPLAN3 — Plant Count Convergence** | The remaining 3 derivations (D1): `nutrition-centre-assembler`'s slug-dedup and the two `routes.ts` copies → one owner. Carries NUT_VERIFY1 R5 / NUT_VERIFY2 R3, twice deferred | 🟠 Med-High | M |
| **NUT_VERIFY3** | NUT_VERIFY2's own R1 + R2: compound "A or B" lines, and `getPlantCategory` fed the canonical slug (**why Legumes stays unticked**). Add `vine` and audit the descriptor vocabulary for sibling gaps (§7.2) | 🟠 Med-High | M |
| **KNOW2 — Claim Sign-off (human-led)** | KNOW1 F1 by a **named qualified reviewer**; then F5 (per-claim approve/reject) and F6 (admin UI) so the next tranche is not a rubber stamp; re-attribute the 21 anonymous sign-offs | 🔴 **Highest product value** | S (human) / M (tooling) |
| **TIME4 — Measured Figures Correction** | §9.1, with the live numbers; investigations left untouched | 🟡 Med | S |
| **NUTPLAN4 — Retire or Connect** | Decide, per item in §4.3: the dead 561-line scoring core, `getPantryItemIntelligence`, `resolveMacros`, the phantom `/api/foods/:slug/report` comment, `assertMealCompliantForPlanner`. Either wire or delete — leaving them is the third state that costs most | 🟠 Med | M |
| **NUTPLAN5 — Knowledge Store Convergence** | D3: three stores answering one question, one of them serving **ungated health claims** (`pantry_ingredient_knowledge`) | 🟠 Med | L |
| **HNP2** | M2 — nutrition opportunities into the Opportunity Delivery pipeline. HNP1's *"single largest gap"* | 🟠 Med | M |

**Ordering note.** KNOW2 delivers the most visible product change (a room that currently reports
zero) but is gated on a human, so it should start first and run in parallel. NUTPLAN2 is the
highest *engineering* priority: §6.1 proves the class of defect is live, and the mechanism that let
it through is still in place.

---

## 11. Files changed

| File | Change |
|---|---|
| `server/routes.ts` | Canonical safety gate on `smart-create-from-ingredients`; fails closed; withheld-count response |
| `client/src/pages/meals-page.tsx` | Reads the new response shape; renders the withheld note |
| `client/src/components/PlannerIntelligenceStrip.tsx` | Renders the server's plant count; local derivation deleted |
| `client/src/components/nutrition-variety-chips.tsx` | `WeeklyPlantDiversityCounter` takes `plantCount`; rival dedup + 2 imports retired |
| `server/tests/test-prod6-safety-gate-convergence.ts` | Newly gated route added to coverage (76 → 78) |
| `server/tests/test-nutplan1-household-nutrition-intelligence.ts` | **New** — 23 assertions |
| `package.json` | Registers `test:nutplan1` in the suite and the aggregate chain |
| `.engineering/session/runs/NUTPLAN1_...md` | **New** — the missing run file (§2.1) |

---

## 12. Rollback

```
rollback/NUTPLAN1-household-nutrition-intelligence-20260719  →  6b93a752
refs/snapshots/NUTPLAN1-worktree-20260719                    →  a1db1cd5
```

Re-verified on resume and unchanged. No schema, seed, or migration was touched, so rollback is a
pure code revert with no data consequence.
