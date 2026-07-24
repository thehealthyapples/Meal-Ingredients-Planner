
# Session: AFI1_Ambient_Food_Intelligence

| Field | Value |
|---|---|
| **Session ID** | `AFI1_Ambient_Food_Intelligence` |
| **Rollback ID** | `rollback/AFI1-ambient-food-intelligence-20260717` |
| **Start time** | 2026-07-17T23:20:00Z UTC |
| **Current stage** | Complete — awaiting owner review (implementation + verification + 3 screenshots + doc all done) |

## Rollback
| Item | Value |
|---|---|
| Tag | `rollback/AFI1-ambient-food-intelligence-20260717` → `7bfad50c` |
| Working tree at start | **Dirty — NOT MINE + FI20.** Pre-existing sibling-session uncommitted changes (HHP2/HHP3, notice-gateway, publication-register, home-experience, etc.) PLUS FI20's own uncommitted work (Food Comparison activation, awaiting owner review). Tag protects committed state (`7bfad50c`) only. Do not commit sibling or FI20 work. |

## Objective
Implement the FIRST Ambient Food Intelligence capability as ONE reusable
Observation → Insight → Recommendation pipeline, surfaced across Planner, Meal
cards, Pantry, Shopping, Food pages, Companion. No new nutrition knowledge; reuse
existing Food Intelligence / Household / Knowledge / Capability services. Surface
only genuinely-useful recommendations; every one answers "How does this help my
household right now?" Household-specific, evidence-aware, actionable, calm. Prefer
one excellent recommendation over many. Do NOT duplicate recommendation logic.

## Plan (CONFIRMED — connection not addition)
**The reusable Observation → Insight → Recommendation pipeline ALREADY EXISTS**
(FI4 "Ambient Food Intelligence & Opportunity Engine" + OD1 delivery framework +
DEC1 decision mechanics + PHASE5C `AmbientIntelligence`/`FoodOpportunityCard`):
- Observation: household planner/pantry/shopping reads via existing read ports
- Insight: pure generators in `opportunity-engine.ts`
- Recommendation: `FoodOpportunity` → `prioritizeOpportunities` (DEC1) → `report`
  verb → OD1 delivery/store → `use-food-opportunities` hook (grouped by domain,
  accept/dismiss/acknowledge) → generic `AmbientIntelligence` → generic
  `FoodOpportunityCard` (Companion "Why this?" already wired to
  `opportunity-delivery:explain`).
- `FoodOpportunityType` is a **closed-but-extensible union**; FI4's own named next
  milestone is *"add a fourth opportunity type."*

**AFI1 = add ONE excellent new opportunity generator** into that pipeline (no new
pipeline, no duplicate logic), reusing Food Intelligence + Household + Knowledge +
Capability, then ensure it surfaces across the 6 named surfaces via the generic
components. The client renders new types automatically — the new type flows to
already-mounted surfaces (Planner/Pantry/Shopping/Home/Dashboard) with zero card
changes; remaining named surfaces (Meal cards, Food pages, Companion) surfaced
contextually/calmly.

Candidate for the one recommendation (pending data-availability confirmation from
reconnaissance): a **simply-better swap** — "you often cook X; Y is a
simply-better choice for your household" — reusing WX5 connected-food
`simply-better` + household familiarity; household-specific, cited, actionable,
calm. Fallback: seasonal-peak or FI4's named benefit-coverage type.

## DESIGN LOCKED — the one excellent recommendation
**New opportunity type `planner-meal-uplift`** (owning domain `planner`, priority
`low`). ONE best per week (prefer one excellent over many).
- **Observation:** the household's CURRENT anchored planner week's planned meals
  (reuse planner read already in `identifyOpportunities`; resolve names via `getMeal`).
- **Insight:** run the Uplift Rules engine (`matchUpliftRules` over
  `buildRuleIndex(UPLIFT_RULES)`) on each planned meal; DROP any suggested ingredient
  conflicting with a household hard restriction (`resolveIngredientRestrictions` —
  never suggest what they can't have); pick the single best (rule priority → confidence).
- **Recommendation:** one calm `FoodOpportunity` — "Your planned [meal] on [day]
  could have a small lift: [add/swap] [ingredient] — [why]." evidence = uplift rule
  `why` + planner entry. subject entity `planner-meal` (new, additive).
- **Reuses (no new knowledge):** `resolveHouseholdSignal`, planner read port,
  `resolveHouseholdPlannerWeek`, uplift engine (`matchUpliftRules`/`buildRuleIndex`/
  `UPLIFT_RULES`), `resolveIngredientRestrictions`. Framework/delivery/card/companion
  are generic on `type` — new type flows through with ZERO framework change (verified).

**Surfacing across the 6 named surfaces:**
- Planner / Home / Dashboard / Companion: automatic (planner domain + Notice Engine voices it)
- Pantry / Shopping: existing ambient surfaces unchanged
- **Meal cards (`meal-detail-page.tsx`): NEW `AmbientIntelligence` mount** scoped to the
  new type via an additive optional `types?` prop on the shared component (the one gap I close)
- **Food pages: already surface the same uplift knowledge** via `ConnectedFoodPanel.simplyBetterChoices` — documented, NOT duplicated

## Checkpoints
- [x] Rollback tag created + resolved (`7bfad50c`); session registered
- [x] Existing ambient/opportunity/decision infra mapped — pipeline EXISTS (FI4/OD1/DEC1/PHASE5C); reuse, do not duplicate
- [x] Reconnaissance complete — uplift engine is the reusable "simply better" knowledge; framework generic on `type` (verified)
- [x] Server: `identifyPlannerMealUpliftOpportunities` generator + `planner-meal-uplift` type + `planner-meal` subject + orchestration wiring (opportunity-engine.ts, +147/-4)
- [x] Client: additive `types?` filter on `AmbientIntelligence`; mounted scoped on `meal-detail-page.tsx`
- [x] Tests: extended `test-intelligence-food-opportunity-binding.ts` → 51 passed, 0 failed (was 40; +11 AFI1)
- [x] Typecheck: AFI1 files clean (0 new errors; pre-existing baseline breakage in unbuilt cbk2/pantry1/shop1 tests + COMP1 port stub, not mine)
- [x] Verified in running app — API end-to-end: demo 201 → food-opportunities returns the cited uplift ("Overnight Oats with Berries" (Tue) → add chia seeds; evidence planner-week + nutrition-enhancement)
- [x] Screenshots — home aggregate (new card clearly), planner ambient (system + type). Meal-card scoped shot re-capturing after demo rate-limit window (5/hr exhausted) resets (~8 min).
- [x] AFI1 doc + report written — `docs/implementation/intelligence/AFI1_AMBIENT_FOOD_INTELLIGENCE.md`

- [x] Meal-card scoped screenshot re-captured (real meal id 4769; "A small lift for this week · 1" mount confirmed). All 3 shots final.
- [x] Downstream regression clear: OD1 60/60, DEC1 49/49, ATTN1 29/29, notice-engine 65/65.

**Last checkpoint (COMPLETE 2026-07-18):** AFI1 delivered. New `planner-meal-uplift`
ambient recommendation through the EXISTING FI4/OD1/DEC1/PHASE5C pipeline (no new
pipeline, no duplicated logic). Verified end-to-end (API cited output, 51/51 unit +
203 downstream assertions green, typecheck-clean, 3 screenshots). Doc:
`docs/implementation/intelligence/AFI1_AMBIENT_FOOD_INTELLIGENCE.md`.

⚠️ **HAZARD OBSERVED:** a concurrent sibling process deleted two UNTRACKED docs
mid-session (`docs/implementation/AFI1_...md` and the prior session's
`FI20_...md`) — likely a `git stash -u` / `git clean` in the shared dirty tree.
Both restored from context + backed up to scratchpad (`doc-backups/`). My tracked-file
edits and screenshots were unaffected. **Durability risk remains** until committed;
cannot commit safely (would sweep sibling + FI20 uncommitted work). Owner should
commit AFI1's files to protect them.

## Next action
None — deliverables complete. Owner to review the doc and decide commit (recommended
soon, given the clobber hazard) + the 5 follow-ons (esp. #2 ingredient-aware matching).

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
