# PLAN1 — PLANNER INTELLIGENCE — Implementation

**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** Extends the existing planner explanation owner with additional sourced reasons; additive, no schema change, no new store, no runtime path altered beyond the explanation payload.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-plan1-planner-intelligence-20260709` → `6795a0c4a65acf5e7983945ab5c63dfe9a1bb4eb` |
| Working tree | **Intentionally dirty** — uncommitted COMP2 + KNOW4 work predates PLAN1 |
| Dirty-tree snapshot | `a04698e29743d1350391b49d29a12b634adac465` (stored as `stash@{0}`, tree left intact) |
| This task's writes | `server/lib/planner-explanation-context.ts` (new), `server/lib/explainability-service.ts`, `server/lib/smart-suggest-service.ts`, `client/src/lib/planner-types.ts`, `server/tests/test-plan1-planner-intelligence.ts` (new), `package.json` |
| Rollback to committed state | `git checkout rollback/before-plan1-planner-intelligence-20260709` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Domain Ownership Quick Reference)
- [x] `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (evidence/citation conventions)

---

## THE CENTRAL FINDING

A "why was this meal recommended?" path **already existed** and was already wired end-to-end:

```
smart-suggest-service.ts:905  generateMealExplanation(chosen, prefs)
  → explainability-service.ts  MealExplanation { title, reasons[], scoreBreakdown }
  → SmartSuggestEntry.explanation
  → POST /api/meal-plans/smart-suggest
  → SmartReviewPanelContent.tsx  "Why?" toggle → renders reasons[] as bullets
```

It explained a meal from the eight `scoreMeal` weights alone. It never consulted household suitability (despite `candidate.householdFit` being attached three lines earlier and then ignored), the pantry, seasonality, plant diversity, or the household's planner history.

**PLAN1 is therefore an enrichment of the single existing explanation owner, not a new system.** No new planner, no new AI, no new conversation state, no new knowledge store, no second explanation producer. The seam was already there; it was under-fed.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Every food fact is keyed by canonical food slug, resolved through the single
  resolver `shared/canonical/resolver.ts::resolveCanonicalFood`. Pantry items,
  seasonal foods, planner-history foods and meal ingredients all enter the same
  key space before being compared. No second key space is introduced.
  Plant diversity is keyed by `diversityGroupSlug` — the same key the 30-plants
  counter uses — so tomato varieties collapse to one plant here exactly as there.

☑ One owner per fact
  Each explanation line names the owner it was read from:
    household suitability → household-meal-matcher (household_eaters)
    nutrition goals       → user_preferences.healthGoals
    pantry usage          → DB user_pantry_items
    seasonal suitability  → shared/discovery/seasonal-map + canonical peakSeasons
    plant diversity       → shared/canonical/plant-classifier (diversity_group)
    household history     → DB planner_entries (via fetchHouseholdPlannerFoods)
    planner balance       → planner week state (protein distribution)
    week opportunity      → planner week state + smart-suggest settings
    shopping impact       → meal-scoring-service.overlapScore + week budget state
  PLAN1 stores none of these. It reads each from its existing owner at request time.

☑ No duplicate entities
  `planner-explanation-context.ts` is a read-only composer in the same shape as
  `food-intelligence-assembler.ts` (WX4). It owns nothing, caches nothing, and
  returns an ephemeral object. `PlannerWeekState` is a read-only VIEW of the
  smart-suggest selection loop's own variables — not a copy of them.

☑ No duplicate ownership
  No attribute gains a second owner. The seasonality read unions SEASON_SEED with
  canonical `peakSeasons`; `validateCanonicalSeed` already enforces
  SEASON_SEED ⊆ peakSeasons, so the union cannot introduce a fact absent from the
  owner — it only widens coverage to canonical foods that declare the season.

☑ No duplicate state
  No user state is written. PLAN1 performs reads only.

☑ Extends existing architecture
  Extends `explainability-service.ts` — the existing single owner of planner
  recommendation rationale. The evidence-with-named-source shape mirrors the Food
  Intelligence engines' `FoodOpportunityEvidence { source, detail }` and
  `ComparisonEvidence { owner, fact }`, and obeys the same Rule E1: no citation,
  no card.

☑ Progressive enrichment where appropriate
  The Planner is transactional state (Principle 3 / "WHAT UDEA DOES NOT APPLY TO"),
  so NO enrichment pipeline is bolted onto planner state. The enrichment happens
  on the ephemeral explanation object, assembled per request from knowledge
  entities that legitimately carry enrichment. Planner rows are untouched.

☑ Honest gaps over fabricated information
  The awareness flags (`pantryAware`, `historyAware`, `seasonAware`) gate each
  dimension. An owner that cannot be read produces SILENCE, never a guess. An
  ingredient that does not resolve to a canonical food is dropped rather than
  reasoned over. Structurally enforced: `reasons` is DERIVED from `evidence`
  (`evidence.slice(0, 6).map(e => e.detail)`), so a reason without a named source
  is unconstructible, not merely discouraged.

☑ No permanent synchronisation bridge
  No bridge. Every read is a one-directional pull from a canonical owner at
  request time. Nothing is kept in sync.

☑ Evolution over replacement
  Nothing is replaced. `generateMealExplanation`'s third parameter is optional, so
  the pre-PLAN1 two-argument call site remains valid and is regression-tested.
```

---

## AI ARCHITECTURE COMPLIANCE

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — reads the same owners the Food
  Intelligence engines read; adds no parallel intelligence.
✓ Uses the Capability Registry — unchanged. PLAN1 registers no new capability
  and alters no intent binding.
✓ Uses the Intent Engine — unchanged; the planner capability's `explain` verb is
  untouched (see Scope Lock).
✓ Reuses existing business services — household-meal-matcher, storage.getPantryItems,
  fetchHouseholdPlannerFoods, plant-classifier, seasonal-map, meal-scoring-service.
✓ Does not create another assistant — no LLM call, no prompt, no generation.
  Every sentence is deterministic string composition over a fetched fact.
✓ Does not duplicate conversation state — no conversation state touched.
✓ Uses registered capabilities only — no new capability.
✓ Uses permission-aware access — pantry and planner history resolve through
  `getHouseholdForUser(userId)`, the existing household-scoping gate. No userId,
  no household read.
✓ Produces honest gaps rather than fabricated knowledge — see the invariant above.
```

**No hard stop triggered (STEP 7).** PLAN1 makes **no health claim**. Every line is a
structural fact about the meal, the week, the household, or the pantry. Health-benefit
claims remain gated behind `getEvidenceBackedFoodReport` (SourceRef + human `reviewedAt`)
and are deliberately *not* surfaced by the Planner. A regression test asserts the Planner
speaks no claim word (`reduces`, `prevents`, `protects against`, `anti-inflammatory`, …).

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Planner recommendation rationale (derived, ephemeral)
Declared SoT:    server/lib/explainability-service.ts
New store created? NO
Existing store extended? NO — no store. The explanation is computed per request
                              and persisted nowhere.
Consumer created? YES — server/lib/planner-explanation-context.ts
  If YES: reads from declared SoT? YES — reads each fact from that fact's declared
          owner (user_pantry_items, planner_entries, household_eaters,
          user_preferences, seasonal-map, diversity_group / plant-classifier).
```

No duplication is created, so no retirement plan is required.

---

## ARCHITECTURE CONVERGENCE STATUS

*(Optional at AMBER; included because the domain is newly named.)*

```
Domain:
  Planner recommendation rationale

Current Canonical Owner:
  server/lib/explainability-service.ts (generateMealExplanation)

Current Runtime Consumer(s):
  smart-suggest-service.ts → POST /api/meal-plans/smart-suggest
  → use-smart-suggest.ts → SmartReviewPanelContent.tsx ("Why?" toggle)

Duplicate Owners Remaining:
  NONE for planner recommendation rationale.
  Adjacent, legitimately distinct rationale facts (Principle 2 scope test — they
  can legitimately disagree, because they answer different questions):
    • planner-read-handler.ts PlannerExplainResult.rationale — why a PLACED entry
      was ADAPTED for the household (not why it was recommended)
    • planner-compliance.ts ComplianceResult.reason — why a meal was REJECTED
    • recipe-swap-engine.ts SwapResult.explanation — why an INGREDIENT was swapped
    • household-meal-matcher MealCompatibilityResult.explanation — household fit
      sentence, consumed BY this owner rather than competing with it

Duplicate State Remaining:
  NONE — the explanation is derived per request and stored nowhere.

Duplicate Workflows Remaining:
  NONE — one composer, one call site.

Current Convergence (%):
  100% — 1 of 1 producers of planner recommendation rationale. All 9 requested
  dimensions resolve through 9 named existing owners; 0 new owners introduced.

Target Convergence (%):
  100%

Next Planned Milestone:
  N/A for this domain. See SUGGESTION for the Intelligence-Platform `explain`
  verb, which is a separate (non-duplicating) surface.

Remaining Architectural Risks:
  NONE introduced. Pre-existing: `meal-scoring-service.varietyScore` measures
  PROTEIN variety, while `plant-classifier` measures BOTANICAL plant diversity.
  These are different facts under the same word "variety" and are now sourced
  distinctly in the evidence trail, which removes the ambiguity at the surface.
```

---

## IMPLEMENTATION

### 1. `server/lib/planner-explanation-context.ts` — NEW (read-only composer)

Reads, once per suggestion run, every fact an explanation may cite:

| Field | Owner read |
|---|---|
| `season`, `seasonalFoods` | `shared/discovery/seasonal-map` (`seasonForDate`, `SEASON_SEED`) ∪ `canonical_food.peakSeasons` |
| `pantryFoods` | DB `user_pantry_items` via `storage.getPantryItems` (only `defaultHave` items) |
| `familiarFoods` | DB `planner_entries` via `fetchHouseholdPlannerFoods` (the single canonical read) |

Plus three pure, directly testable derivations: `buildSeasonalFoods`,
`mealCanonicalFoods`, `mealPlantGroups`.

Three design decisions worth recording:

- **Awareness flags, not empty maps.** `pantryAware: false` (owner unreadable) is a
  different fact from `pantryFoods.size === 0` (owner read, nothing held). Only the
  latter may be reasoned about. Collapsing the two would let a DB outage silently
  render as "you have nothing in your pantry".
- **The DB-backed owners are imported dynamically.** `server/db.ts` throws at import
  when `DATABASE_URL` is absent. Static imports would make the pure composition logic
  untestable without a database. Nothing reaches a DB until a `userId` is supplied.
- **Each read is independently guarded.** One failing owner degrades exactly one
  dimension to an honest gap. It never fails meal generation.

### 2. `server/lib/explainability-service.ts` — the non-fabrication invariant

`MealExplanation` gains `evidence: PlannerExplanationEvidence[]`, where each entry is
`{ dimension, source, detail }` and `source` names the owner the fact came from.

The load-bearing change is one line:

```ts
reasons: evidence.slice(0, MAX_REASONS).map((e) => e.detail),
```

`reasons` is **derived from** `evidence`, not written alongside it. A sentence therefore
cannot reach a user without a named owner. This is what makes "never fabricated" a
structural property of the code rather than a promise in a review.

Nine dimensions were added (`appendIntelligenceEvidence`), each a fact lookup — none
infers, estimates, or generates. Evidence is ranked by `DIMENSION_RANK` so household and
goal fit lead and generic score notes trail; `reasons` shows the top 6, `evidence`
returns the full uncapped trail.

### 3. `server/lib/smart-suggest-service.ts` — wiring

- Context built once per run, concurrently with the household context and external
  candidate fetch. Failure falls back to `EMPTY_PLANNER_EXPLANATION_CONTEXT`.
- `weekPlantGroups: Set<string>` accumulates diversity groups across the week —
  including from **locked** entries, so a later meal is never credited with a plant a
  locked meal already put on the plan.
- Week state is captured **before** the chosen meal mutates `usedProteins`, `fishCount`,
  `totalCost`. "First fish meal this week" and "adds 2 new plants" therefore describe
  the plan the meal is *joining*, not the one it has already changed.

### 4. `client/src/lib/planner-types.ts` — type mirror only

`evidence?` is optional: `use-smart-suggest.ts` persists sessions
(`SMART_SESSION_VERSION = 2`), so a session cached before PLAN1 carries `reasons`
without the trail. **No UI change.** The existing "Why?" toggle renders `reasons[]`
exactly as before — it simply has better reasons to render.

### 5. Two defects found and fixed during manual verification

- **Planner balance was stated twice.** A meal could show both "Adds variety to your
  protein sources" (generic score weight) and "First fish meal this week" (actual week
  state). On a hand-built breakdown the two could directly *contradict* ("adds variety"
  + "already on your plan 3 times"). The week-state fact — what the plan actually
  holds — now supersedes the generic weight. Regression-tested.
- **Money rendered without a currency symbol** ("about 3.40 of 45.00") in a UK product
  whose budget thresholds are GBP. Now `£3.40 of £45.00`. This also corrected the
  pre-existing `Cost-effective meal (est. ~3.40)` line, which now reads `~£3.40` — see
  Scope Lock.

---

## DEFINITION OF DONE

**Success looks like:** every recommended meal in the Smart Planner carries an
explanation composed from the intelligence THA already owns, where each reason names
the owner it was read from, and no reason is ever invented.

**What must not break:**
- Meal generation, ranking, and selection — scoring is untouched; no candidate's score
  changes and no meal is chosen differently.
- Hard compliance gates (diet pattern, household hard restrictions, premium, drinks).
- The existing "Why?" toggle and `reasons[]` rendering.
- The pre-PLAN1 two-argument `generateMealExplanation(candidate, prefs)` call.
- Sessions persisted before PLAN1.

**Automated verification** — `npm run test:plan1-planner-intelligence` → **58 passed, 0 failed**

| Suite | Result |
|---|---|
| `test:plan1-planner-intelligence` (new) | 58 passed, 0 failed |
| `test:scoring` | 12/12 passed |
| `test:planner-compliance` | 25 passed, 0 failed |
| `test:intelligence-planner-binding` | 31 passed, 0 failed |
| `tsc --noEmit` on all touched files | clean (repo's 175 pre-existing errors are in unrelated files) |

**Manual test steps:**
1. Open the Weekly Planner, run **Smart Suggest**.
2. Expand **"Why?"** on any suggested meal.
3. Confirm reasons now cite household fit, pantry items you actually hold, foods at UK
   peak season, plants the meal *adds* to the week, and progress toward fish/red-meat
   targets — not only the generic score lines.
4. Empty your pantry → confirm pantry lines **disappear** rather than becoming
   "you have 0 ingredients".
5. Lock a tomato-based meal, re-run → confirm a later tomato meal does **not** claim to
   add tomato as a new plant.
6. A brand-new household with no planner history → confirm no household-history line
   appears at all (not "planned 0 times before").

---

## DATA IMPACT

- Reads existing data: **YES** — `user_pantry_items`, `planner_entries`, `household_eaters`, `user_preferences`.
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

`MealExplanation.evidence` is additive to an API response that is already computed fresh
on every request and never persisted server-side.

---

## TRUST CHECK

**Could this mislead the user?**
Only if a reason claimed something untrue. Three defences: (a) `reasons` is derived from
`evidence`, so every line has a named owner; (b) awareness flags make an unreadable owner
silent rather than empty-valued; (c) unresolvable ingredients are dropped, never guessed.
The week state is captured before mutation, so counts (`0 so far`, `already 3 times`) are
accurate at the moment of choice rather than off by one.

**Could this fabricate certainty?**
No. There is no model, no prompt, no inference. Every sentence is deterministic string
composition over a fetched fact. The Planner makes **no health claim** — asserted by test.

**Is anything guessed but shown as real?**
No. The one place guessing could creep in — "the household has no history" vs "we could
not read the history" — is explicitly separated by `historyAware`, and a household with
zero planner entries is treated as *not history-aware* precisely so it cannot be told
what it has or hasn't cooked before.

**What happens if the system is wrong?**
Each owner read is independently try/caught. A failing owner silences its own dimension
and nothing else; meal generation always completes. Worst case, the user sees the
pre-PLAN1 explanation.

- No architectural duplication introduced: **YES** (none)
- No new source of truth created: **YES** (none)
- No runtime behaviour altered: **Scoring, ranking and selection unchanged.** The
  explanation payload gains an `evidence` array and richer `reasons`.

---

## ROLLBACK PLAN

| Item | Value |
|---|---|
| Rollback identifier | `rollback/before-plan1-planner-intelligence-20260709` → `6795a0c4a65acf5e7983945ab5c63dfe9a1bb4eb` |
| Dirty-tree snapshot (pre-PLAN1) | `a04698e29743d1350391b49d29a12b634adac465` → `stash@{0}` |

**Files modified**
```
server/lib/planner-explanation-context.ts      (new)
server/lib/explainability-service.ts           (extended)
server/lib/smart-suggest-service.ts            (wiring: 4 hunks)
client/src/lib/planner-types.ts                (type mirror)
server/tests/test-plan1-planner-intelligence.ts (new)
package.json                                    (test script registration)
docs/implementation/PLAN1_PLANNER_INTELLIGENCE.md (this document)
```

**Commit boundary.** `package.json` is deliberately **left uncommitted**: it already
carried COMP2 and KNOW4 test-script registrations from prior uncommitted work, and
committing it would sweep those workstreams into the PLAN1 commit while their source
files remain untracked (producing a commit whose `npm test` references files that do not
exist). The other five PLAN1 files were clean before this task and commit in isolation.

**Rollback commands**

Revert PLAN1 only, preserving the unrelated uncommitted COMP2/KNOW4 work:
```bash
git checkout <plan1-commit>^ -- server/lib/explainability-service.ts \
                                server/lib/smart-suggest-service.ts \
                                client/src/lib/planner-types.ts \
                                package.json
rm -f server/lib/planner-explanation-context.ts \
      server/tests/test-plan1-planner-intelligence.ts \
      docs/implementation/PLAN1_PLANNER_INTELLIGENCE.md
```

Full return to the pre-PLAN1 committed state (discards COMP2/KNOW4 too):
```bash
git checkout rollback/before-plan1-planner-intelligence-20260709
```

Restore the pre-PLAN1 dirty tree (COMP2/KNOW4 as they were, PLAN1 absent):
```bash
git stash apply a04698e29743d1350391b49d29a12b634adac465
```

**Verification after rollback**
```bash
npm run test:scoring                     # 12/12
npm run test:planner-compliance          # 25 passed
npm run test:intelligence-planner-binding # 31 passed
```
Then run Smart Suggest and confirm the "Why?" toggle still renders reasons.

---

## SCOPE LOCK

**Implemented scope — PLAN1 only.** All nine requested dimensions:

| Requested | Owner it reads | Status |
|---|---|---|
| Household suitability | `household-meal-matcher` (`household_eaters`) | ✅ |
| Nutrition goals | `user_preferences.healthGoals` | ✅ |
| Plant diversity | `plant-classifier` / `diversity_group` | ✅ |
| Planner balance | planner week state (protein distribution) | ✅ |
| Pantry usage | DB `user_pantry_items` | ✅ |
| Shopping impact | `overlapScore` + week budget state | ✅ |
| Seasonal suitability | `seasonal-map` + canonical `peakSeasons` | ✅ |
| Previous household preferences | DB `planner_entries` | ✅ |
| Opportunities to improve the week | week state + `fishPerWeek` / `redMeatPerWeek` | ✅ |

**Explicitly excluded (NOT done):**
- No UI redesign. `SmartReviewPanelContent.tsx` is untouched; the existing "Why?" toggle
  renders the improved `reasons[]`. The `evidence` trail is available to the client but
  is deliberately **not rendered** — surfacing it is a UI decision, not PLAN1's.
- No new AI system, planner, conversation state, or knowledge store.
- No change to scoring, ranking, or meal selection. Explanations describe the choice;
  they do not influence it.
- The Intelligence-Platform `explain` verb (`planner-read-handler.ts`) is untouched. It
  answers a different question (why an entry was *adapted*) and still returns its honest
  gap when no `adaptationResult` exists.
- No health-benefit claims surfaced in the Planner.
- No `emerging` benefit shown as `established` — no benefit shown at all.

**In-scope copy correction (disclosed):** the pre-existing line `Cost-effective meal
(est. ~3.40)` now reads `~£3.40`. This is a one-character correction to a *planner
explanation line* — the surface PLAN1 owns — made because PLAN1's new budget line sits
directly beside it, and one showing `£` while the other did not would read as a bug. Not
a redesign; no layout, component, or interaction changed.

**SUGGESTION (out of scope — do not implement without approval):**

1. **Render the evidence trail.** `MealExplanation.evidence` now carries `source` per
   reason, uncapped, while the UI shows the top 6 details only. A disclosure showing
   "read from your pantry" beside each reason would make the Planner visibly
   evidence-based. Needs a UI decision.
2. **`meal-scoring-service` cannot see pantry or seasonality.** PLAN1 *explains* using
   them but scoring never *ranks* by them, so the Planner will happily recommend a meal
   using nothing you own in a season nothing is at peak — and then honestly say so.
   Feeding `pantryFoods`/`seasonalFoods` into `scoreMeal` as weights would close the gap
   between what the Planner explains and what it optimises. This is a genuine behaviour
   change and needs its own workstream.
3. **The Intelligence-Platform `explain` verb could reuse this composer**, letting the
   Companion answer "why did you suggest this?" conversationally from the same evidence.
   Requires persisting the evidence trail on the planner entry, which is a new store —
   governance review required (Rule 8).
4. **`varietyScore` is protein variety, not plant diversity**, despite the shared word.
   Renaming it `proteinVarietyScore` would remove a standing ambiguity in
   `meal-scoring-service.ts`.
```
