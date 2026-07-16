# PLAN2 — INTELLIGENT PLANNER EVOLUTION — Implementation

**Date:** 2026-07-12
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED
**Reason:** This is the first change that alters **which meal the Planner chooses**. PLAN1 changed what the Planner *says*; PLAN2 changes what it *does*. No schema change, no new store, no new engine — but meal selection is user-visible behaviour and a regression here is silent.

> **Naming.** The `PLAN1` ID was already held by [`PLAN1_PLANNER_INTELLIGENCE.md`](./PLAN1_PLANNER_INTELLIGENCE.md) (2026-07-09), which shipped the planner's explanation layer. This workstream is its successor and carries the next ID rather than shadowing it (`REPOSITORY_CONVENTIONS.md` § 3 — the EWO ID prefix is what makes a document findable and orderable). It was requested as "PLAN1 — Intelligent Planner Evolution"; the ID was corrected to **PLAN2** with approval before implementation began.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/plan1-intelligent-planner-evolution-20260712` → `b4a63af861b2ec14fc5f09b69db7441c81115fab` |
| Working tree | **Intentionally dirty** — 71 files of uncommitted HHP3 / PDA1 / notice-convergence work predate PLAN2 |
| Dirty-tree snapshot | `rollback/plan1-worktree-backup-20260712` → `2c7050784dfa24348b8383473247f83be0c62bc5` |
| Rollback to committed state | `git checkout rollback/plan1-intelligent-planner-evolution-20260712` |
| Restore the pre-PLAN2 dirty tree | `git stash apply 2c7050784dfa24348b8383473247f83be0c62bc5` |

A tag captures commits only. Because the tree carried substantial uncommitted work that PLAN2 did not author, the working tree was **also** snapshotted as a real commit object and tagged, so the pre-PLAN2 state is recoverable in full and not merely the last commit.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/THA_DECISION_ENGINE_ARCHITECTURE.md` (DEC1 — the hard boundaries)
- [x] `docs/architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`
- [x] `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md` § 17–18, `THA_UI_ARCHITECTURE.md` § 18
- [x] `docs/implementation/planner/PLAN1_PLANNER_INTELLIGENCE.md` (the predecessor this completes)

---

## THE CENTRAL FINDING

PLAN1 taught the Planner to **explain** itself from nine canonical owners. It did not teach it to **choose** by them, and it said so plainly in its own SUGGESTION 2:

> *"`meal-scoring-service` cannot see pantry or seasonality. PLAN1 explains using them but scoring never ranks by them, so the Planner will happily recommend a meal using nothing you own in a season nothing is at peak — and then honestly say so."*

So the Planner had reached the strange state of being **articulate but not intelligent**: a recommendation engine whose reasons were sourced, accurate, and completely disconnected from the decision they described. PLAN2 closes that loop. It is not a new planner. It feeds the existing scorer the intelligence the existing explainer was already reading.

**Three defects were found in the seam and had to be fixed before any weight could be trusted:**

1. **The meal's score had two owners.** `scoreMeal` returned a score out of 100; `smart-suggest-service.ts:910` then added `compatBonus = (fitScore/100) * 10` *outside* it and clamped to 100 — while storing the *pre-bonus* `scoreBreakdown`. The breakdown therefore did not explain the score it accompanied, and household fit was invisible to the explainer.
2. **Household fit was measured for user meals only.** External candidates never had `householdFit` attached, so they never received the bonus. They were down-ranked by up to 10 points not because they fitted the household worse, but because nobody had *asked*. A measurement artefact was acting as a preference.
3. **The two weight tables had drifted.** `SCORE_WEIGHTS` (scorer) and `WEIGHT_MAX` (explainer) disagreed on six of eight keys, and `simplicityBonus` was absent from the explainer entirely. Thresholds like `bd.goalAlignment >= WEIGHT_MAX.goalAlignment` were consequently unreachable in the ordinary case, and `healthScore`/`budgetScore` divided by the wrong denominators.

A weight system with two disagreeing tables and a score with two owners cannot be extended safely. PLAN2 converges both **first**, then adds intelligence to the single owner that remains.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Every food fact is keyed by canonical food slug via shared/canonical/resolver.ts.
  Pantry items, seasonal foods, opportunity subjects and meal ingredients all enter
  that one key space before comparison. Plant diversity is keyed by
  diversityGroupSlug — the same key the 30-plants counter uses. Opportunities are
  keyed by their producer-assigned `type`, never re-derived. No new key space.

☑ One owner per fact
  PLAN2 REMOVES an ownership violation rather than adding one. Before: the meal's
  score was composed in two places (meal-scoring-service.scoreMeal + the compatBonus
  line in smart-suggest-service). After: scoreMeal is the SOLE owner of a candidate's
  score, and its breakdown fully explains it. Each intelligence dimension names the
  owner it reads:
    household fit        → household-meal-matcher (household_eaters)
    pantry               → DB user_pantry_items (storage.getPantryItems)
    seasonality          → shared/discovery/seasonal-map ∪ canonical peakSeasons
    plant diversity      → shared/canonical/plant-classifier (diversity_group)
    learned preference   → LEARN1 Confirmed Understanding (readConfirmedUnderstanding)
    open opportunities   → the registered producer capabilities, via the Intent Engine
  PLAN2 stores none of these. It reads each from its existing owner at request time.

☑ No duplicate entities
  No new engine, no new planner, no new store, no new capability. The one new concept
  — a candidate's intelligence signals — is an ephemeral per-request object derived
  from owners, in the same shape as PLAN1's read-only composer.

☑ No duplicate ownership
  Selection stays domain-owned in meal-scoring-service (DEC1 § 3, hard boundary 1 —
  "the engine ... never ranks meals"). The Decision Engine is READ, never asked to
  rank. Learning is READ through EL2's one door and only ever re-weights (NK2 Rule
  P1). Attention is never re-derived. No second suppress/rank/budget path is built.

☑ No duplicate state
  No user state is written. PLAN2 performs reads only. The one write path it
  deliberately does NOT take is documented below (opportunity delivery lifecycle).

☑ Extends existing architecture
  Extends three existing owners in place: scoreMeal (selection), the PLAN1
  explanation composer (facts), and explainability-service (rationale). Follows the
  DEC1 precedent — "location unchanged at designation; naming is governance, not
  churn" — so PLAN1's composer is EXTENDED and designated the Planner's intelligence
  context, not renamed into a second file.

☑ Progressive enrichment where appropriate
  N/A by design. The Planner is transactional state (Principle 3 / "WHAT UDEA DOES
  NOT APPLY TO"), so NO enrichment pipeline is bolted onto planner rows. Nothing is
  persisted onto planner_entries. All intelligence is computed per request and
  discarded.

☑ Knowledge domain compliance
  N/A — PLAN2 introduces and extends no knowledge domain. It is a consumer of five
  existing ones (Food, Nutrition, Household, Recipes, and LEARN1's household
  learning) and fills no new row in PKCA § 1.1.

☑ Honest gaps over fabricated information
  Structural, not promised. Every intelligence dimension carries an `applicable`
  flag. A dimension whose owner could not be read is REMOVED FROM THE DENOMINATOR
  rather than scored zero — so an unreadable pantry silences the pantry dimension
  instead of quietly ruling that the meal uses nothing you own. An unknown fact
  never becomes a bad verdict. Reasons remain DERIVED from evidence (PLAN1's
  invariant), so a sentence without a named owner stays unconstructible.

☑ No permanent synchronisation bridge
  None. Every read is a one-directional pull from a canonical owner at request time.
  Nothing is kept in sync.

☑ Evolution over replacement
  Nothing is replaced. scoreMeal's third parameter stays optional and its pre-PLAN2
  two- and three-argument call sites remain valid and are regression-tested: with no
  intelligence context supplied, scoreMeal is byte-identical to its pre-PLAN2 self.
  The duplicate compatBonus line is RETIRED in this same change (Principle 8 —
  retire on introduction), not left dormant beside its successor.
```

---

## AI ARCHITECTURE COMPLIANCE

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — opportunities and learning are read
  through intelligencePlatform.handle() on the ordinary Intent Engine path. The
  Planner imports neither opportunity-delivery/framework.ts nor
  evidence-learning-store.ts.
✓ Uses the Capability Registry — reads the registered `household-health` and
  `food-intelligence` capabilities (both capabilityClass: "read-only"). PLAN2
  registers NO new capability and adds NO verb to any existing one.
✓ Uses the Intent Engine — every cross-capability read is an Intent, permission-
  checked and ownership-scoped like any other.
✓ Reuses existing business services — household-meal-matcher, storage.getPantryItems,
  fetchHouseholdPlannerFoods, plant-classifier, seasonal-map, readConfirmedUnderstanding.
✓ Does not create another assistant — no LLM call, no prompt, no generation. Every
  score component is arithmetic over a fetched fact; every sentence is deterministic
  string composition.
✓ Does not duplicate conversation state — no conversation state touched.
✓ Uses registered capabilities only — no unregistered reach-around.
✓ Uses permission-aware access — every read resolves through getHouseholdForUser /
  requireUserId. No userId, no household read; the intelligence context degrades to
  empty and the Planner scores exactly as it did before PLAN2.
✓ Produces honest gaps rather than fabricated knowledge — see the denominator rule
  above and the Trust Check below.
```

**No hard stop triggered (STEP 7).** PLAN2 makes **no health claim**. Every line it speaks is a structural fact about the meal, the week, the household, or the pantry. The PLAN1 regression test asserting the Planner speaks no claim word (`reduces`, `prevents`, `protects against`, `anti-inflammatory`, …) is retained and extended to the new dimensions.

### The compliance decision that matters most: reading opportunities WITHOUT consuming them

The obvious way to make the Planner opportunity-aware is to call the `opportunity-delivery` capability's `report` verb — the door every other surface uses. **That would have been a silent, serious defect.**

`collectOpportunities` calls `store.insertDelivered(...)`. `report` is a **delivery** door, not a **query** door: calling it records that these opportunities were *delivered to this household*. The Planner scores candidates in the background, on every Smart Suggest run, and shows the household none of them. Had it called `report`, it would have told the Companion the household had already seen opportunities they had never seen — and COACH1's "seen yields to unseen" ordering and the lifecycle suppression rules would then have demoted or hidden them on the surfaces where they *would* have been read. The Planner would have been quietly eating the household's notices.

PLAN2 therefore reads the **producers** — `household-health:report` and `food-intelligence:report`, both registered, both `capabilityClass: "read-only"`, both side-effect free — and never the Decision Engine's delivery door. This respects DEC1 § 3 exactly: the Planner does not rank, suppress, budget, or re-derive attention, and it does not touch delivery lifecycle. It reads already-true facts and does its own domain-owned selection with them, which is precisely what the boundary reserves to it.

---

## EXPERIENCE & UI GOVERNANCE COMPLIANCE

PLAN2 is user-facing: it changes which meal is recommended, and it changes what the "Why?" disclosure shows.

```
----------------------------------------
EXPERIENCE & UI GOVERNANCE COMPLIANCE
----------------------------------------
✓ UX Governance Checklist (THA_EXPERIENCE_ARCHITECTURE.md § 18) completed in full
✓ UI Governance Checklist (THA_UI_ARCHITECTURE.md § 18) completed in full
✓ No conflict arose between them
✓ Nothing owns a fact at the presentation layer — every reason is read from its
    single owner server-side; a dimension with no origin label renders the reason
    and NO origin, never an invented one
✓ No new visual pattern introduced, so nothing needed retiring at the UI layer
```

The checks worth stating rather than merely ticking:

- **Calm before capability.** The Planner became considerably more intelligent and the surface got **no** new badge, banner, count, or motion. The only visible change is *inside* a disclosure the household has to open. Capability was admitted without noise.
- **Progressive disclosure.** The essence (the reason) leads; the origin sits beneath it in the file's existing `text-[10px] text-muted-foreground/40` idiom — quiet, secondary, skippable. No new type scale or spacing step was introduced.
- **Honest content.** Every score can now explain itself on request, which is the point. A reason whose dimension has no household-facing label renders with no origin line rather than a guessed one.
- **Language.** The server's `source` strings name canonical owners — `user_pantry_items`, `household-meal-matcher (household_eaters)`. Those are engineering names and would have been a governance failure had they reached a household. The client maps the stable `dimension` enum (the contract) to warm language: *"From your pantry"*, *"From what you've chosen before"*. The server owns the fact; the canonical page owns the phrasing of it (Intelligence Discovery & Presentation Principle).
- **Companion conduct.** The Planner suggests; it does not decide. A confirmed *negative* learned preference re-weights silently and is **never spoken back at the household** — telling someone "we ranked this lower because you keep rejecting lamb" is a judgement about them, not a fact about the food. Asserted by test.

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Planner meal selection (transactional; derived, ephemeral)
Declared SoT:    server/lib/meal-scoring-service.ts (scoreMeal) — now the SOLE owner
                 of a candidate's score, which it was not before PLAN2.
New store created? NO
Existing store extended? NO — no store. All intelligence is computed per request and
                              persisted nowhere. planner_entries is untouched.
Consumer created? NO new consumer. server/lib/planner-explanation-context.ts (PLAN1's
                  read-only composer) is EXTENDED with two further guarded reads.
  Reads from declared SoT? YES — each fact from that fact's declared owner
  (user_pantry_items, planner_entries, household_eaters, user_preferences,
  seasonal-map, diversity_group, household_learning_signals via EL2's door, and the
  registered opportunity producers via the Intent Engine).
```

A duplication is **removed** (the second score owner). No duplication is created, so no new retirement plan is required beyond that one.

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Planner meal selection (the score that decides which meal is recommended)

Current Canonical Owner:
  server/lib/meal-scoring-service.ts :: scoreMeal

Current Runtime Consumer(s):
  smart-suggest-service.ts (one call site) → POST /api/meal-plans/smart-suggest
  → use-smart-suggest.ts → SmartReviewPanelContent.tsx

Duplicate Owners Remaining:
  NONE. PLAN2 retired the one that existed: the compatBonus applied outside
  scoreMeal in smart-suggest-service.ts:910. Household fit is now a scored
  dimension inside the single owner, visible in the breakdown it accompanies.

Duplicate State Remaining:
  NONE — selection is derived per request and stored nowhere.

Duplicate Workflows Remaining:
  NONE — one scorer, one call site, one weight table.

Current Convergence (%):
  100% — 1 of 1 producers of a candidate's score (was 2 of 2 before PLAN2).
  1 of 1 weight tables (was 2, disagreeing on 6 of 8 keys).
  6 of 6 intelligence dimensions resolve through existing named owners;
  0 new owners introduced.

Target Convergence (%):
  100%

Next Planned Milestone:
  N/A for this domain. See Remaining Gaps for the Planner-as-opportunity-producer
  seam, which is a different domain (opportunity production, not selection).

Remaining Architectural Risks:
  `overlapScore` (shopping-impact weight, 8 pts) is effectively dead: it builds a Set
  of whole ingredient STRINGS and then tests membership with single WORDS, so it only
  fires when a used ingredient happens to be one bare word. It is left untouched and
  reported rather than fixed, because repairing it silently re-weights every existing
  recommendation and deserves its own tested change (see Remaining Gaps).
```

---

## IMPLEMENTATION

### 1. `server/lib/meal-scoring-service.ts` — one scorer, one weight table, six new dimensions

The eight base weights are unchanged in their relative shape and continue to sum to 100. Intelligence is admitted as a **bounded share of the envelope**, never as an unbounded bonus on top (which would saturate at the 100-clamp and collapse the ranking it was meant to sharpen):

```
score = base8 × (1 − INTELLIGENCE_SHARE) + intelligencePct × 100 × INTELLIGENCE_SHARE
```

with `INTELLIGENCE_SHARE = 0.30`. Base contributes 0–70, intelligence 0–30.

The six intelligence dimensions and their weights (summing to 30):

| Dimension | Weight | Owner read | Mission bullet |
|---|---|---|---|
| `householdFit` | 8 | `household-meal-matcher` (`household_eaters`) | household-aware |
| `plantDiversity` | 6 | `plant-classifier` / `diversity_group` | nutrition-aware |
| `pantryUse` | 5 | DB `user_pantry_items` | contextual |
| `learnedPreference` | 5 | LEARN1 Confirmed Understanding | learning-aware |
| `opportunityFit` | 4 | registered opportunity producers | opportunity-aware |
| `seasonality` | 2 | `seasonal-map` ∪ canonical `peakSeasons` | contextual |

**The denominator rule — why an honest gap is not a zero.** Each dimension carries an `applicable` flag. `intelligencePct` is `earned ÷ applicableMax`, summed over applicable dimensions **only**. A household whose pantry cannot be read does not get a pantry score of zero (which would be the Planner ruling, on no evidence, that the meal uses nothing they own) — the dimension leaves the denominator and the remaining dimensions are judged on their own terms. If *no* dimension is applicable, `scoreMeal` returns exactly what it returned before PLAN2. This is what makes "no fabricated knowledge" a property of the arithmetic rather than a promise in a review.

**Two kinds of absence, deliberately distinguished.** For pantry, season and household fit, absence means *the owner could not be read* → drop from the denominator. For learning and opportunities, absence is a legitimate **neutral**: a household that has confirmed nothing is not a household with a gap, it is a household we know nothing about yet. Those dimensions score the neutral midpoint when the owner was read but had nothing to say, so that a *positive* signal genuinely lifts and a *negative* one genuinely drops. Collapsing these two kinds of absence would have made learning unable to influence anything at all — the dimension would have renormalised itself away exactly when it mattered.

`learnedPreference` grades by confidence (`high` 1.0, `medium` 0.75, `low` 0.5) in the direction LEARN1 confirmed, and **only ever re-weights** — it never authors a fact, writes a preference, or excludes a meal (NK2 Rule P1). A hard exclusion remains the exclusive business of the compliance gates.

### 2. `server/lib/planner-explanation-context.ts` — the Planner's one intelligence context

PLAN1's read-only composer gains two further **independently guarded** reads, and is designated the Planner's single intelligence context (extended in place, per the DEC1 naming precedent — a second file would have created the second owner this workstream exists to remove):

| New field | Owner read | Door |
|---|---|---|
| `learnedPreferences` / `learningAware` | `household_learning_signals` | `readConfirmedUnderstanding(userId)` — EL2's one door |
| `openOpportunities` / `opportunityAware` | the registered producers | `intelligencePlatform.handle({ capabilityId, verb: "report" })` |

Only opportunity types with a **meal-discriminating predicate** participate. An opportunity the Planner cannot honestly act on is skipped, never guessed at:

| Opportunity type | Planner predicate | Participates |
|---|---|---|
| `nutrition-plant-diversity-gap` | candidate adds ≥1 plant group new to the week | ✅ |
| `pantry-item-unused-in-plan` | candidate's canonical foods contain the named pantry item | ✅ |
| `nutrition-balance-gap` | missing components are named only in prose, not structured | ❌ honest gap |
| `planner-empty-day`, `nutrition-planning-gap` | any meal fills a day — cannot discriminate between candidates | ❌ honest gap |
| `shopping-restriction-conflict` | critical, not advanced by a meal choice | ❌ honest gap |

### 3. `server/lib/explainability-service.ts` — what it optimises is now what it explains

The two divergent weight tables are converged: `WEIGHT_MAX` is **deleted** and the explainer imports `SCORE_WEIGHTS` from the scorer, which is now the single owner of what a dimension is worth. Two new evidence dimensions (`learned-preference`, `open-opportunity`) join PLAN1's, so the reasons the household reads are the same facts that moved the score. PLAN1's structural invariant is retained unchanged: `reasons` is derived from `evidence`, so a reason without a named owner is unconstructible.

### 4. `server/lib/household-meal-matcher.ts` — household fit for every candidate

`scoreMealCompatibility` read only `meal.ingredients` and `meal.dietTypes`, but its signature demanded a full `Meal` — which is why external candidates never got a household fit. The shared core (`computeIngredientCompatibility`) is now reachable through an exported `scoreCandidateCompatibility(ingredients, dietTypes, …)`, which `scoreMealCompatibility` itself delegates to. One owner, no duplication, and the household is now consulted about **every** candidate rather than only the ones that happened to be ours.

### 5. Client — the evidence trail becomes visible

PLAN1 plumbed `evidence[]` (each entry naming the owner it was read from) all the way to the client and rendered none of it; the "Why?" toggle showed bare `reasons`. PLAN2 renders the trail with its sources, so the Planner is *visibly* evidence-based rather than merely honest in private. Progressive disclosure is preserved — the surface is unchanged until the household asks "Why?", and calm-before-capability means no new badge, banner, or motion is introduced.

---

## DEFINITION OF DONE

**Success looks like:** the Planner recommends the meal that is best for *this* household, this week — using the pantry they actually hold, the season they are actually in, the plants their week is actually missing, the fit with the people who will actually eat it, what they have confirmed they actually like, and the opportunities that are actually open — and every one of those reasons is readable, sourced, and the same fact that moved the score.

**What must not break:**
- Hard compliance gates (diet pattern, household hard restrictions, premium, drinks, alcohol). Intelligence re-weights; it never admits a meal a gate excluded.
- `scoreMeal` with no intelligence context — byte-identical to pre-PLAN2.
- The pre-PLAN1 two-argument `generateMealExplanation(candidate, prefs)` call.
- Sessions persisted before PLAN2.
- The Planner speaks no health claim.

**Automated verification** — `npm run test:plan2-planner-evolution` → **66 passed, 0 failed**

| Suite | Result | What it protects |
|---|---|---|
| `test:plan2-planner-evolution` (new) | **66 passed, 0 failed** | The five PLAN2 claims |
| `test:scoring` (golden) | 12/12 passed | Selection is byte-identical without intelligence |
| `test:plan1-planner-intelligence` | 58 passed, 0 failed | PLAN1's non-fabrication invariant |
| `test:planner-compliance` | 25 passed, 0 failed | The hard dietary gates |
| `test:intelligence-planner-binding` | 31 passed, 0 failed | The planner capability |
| `test:dec1-decision-engine` | 49 passed, 0 failed | **The Decision Engine's boundaries** |
| `test:hhp3-household-health-delivery-convergence` | 39 passed, 0 failed | **"exactly two producers" still true** |
| `test:hhp2-household-health-opportunities` | 49 passed, 0 failed | The producer contract PLAN2 reads |
| `test:learn1-household-learning` | 72 passed, 0 failed | EL2's one door, Rule P1 |
| `test:attn1-attention-platform` | 29 passed, 0 failed | Attention never re-derived |
| `test:intelligence-opportunity-delivery-binding` | 60 passed, 0 failed | Delivery lifecycle intact |
| `test:coach1-proactive-coaching` | 72 passed, 0 failed | Seen-yields-to-unseen ordering |
| `test:smart-suggest-tailoring`, `test:tier4-shell-recovery`, `test:diet-reconciliation-bridge` | all passed | The other scorer consumers |
| `tsc --noEmit` on all touched files | clean | — |

`test:plan2-planner-evolution` is registered in the aggregate `npm test` chain — a test nobody runs is a test that does not exist.

**Manual test steps:**
1. Run **Smart Suggest**, expand **"Why?"** → each reason now names the owner it came from.
2. Empty the pantry → pantry reasons and the pantry dimension **disappear**; they do not become "uses 0 of your ingredients", and the remaining dimensions are re-judged on their own terms.
3. Plan a week with no plants → confirm the plant-diversity opportunity opens, and that Smart Suggest then *prefers* meals that add new plant groups.
4. A brand-new household → confirm no learning or history line appears at all, and the score is unchanged from pre-PLAN2 behaviour.

---

## PRODUCT REGISTRY IMPACT

**Registry affected: YES — but the registry does not exist yet.**

`PKR1`/`PKR3` define the Product Knowledge Registry and its 28 sections beneath `docs/product/`, and both state explicitly that the directory is *"defined here and populated nowhere"* — `docs/product/` does not exist in this repository. PLAN2 changes what the Planner *does* (it now chooses meals using household, pantry, seasonal, plant, learning and opportunity intelligence), which is a genuine change to "what is THA?" and would owe entries under **Capabilities** and **Journeys**.

Per Rule KC12 (*a declined discovery is recorded, or every future audit rediscovers it and re-asks the same question forever*), this is recorded here rather than silently skipped: **PLAN2 creates no registry entry because the registry has no canonical location to create it in.** Creating `docs/product/` unilaterally inside a planner workstream would make a planner change the founder of a platform-wide knowledge domain, which is exactly the kind of ownership drift `PKR3` exists to prevent. The entry PLAN2 owes is named in Remaining Gaps so the registry's first population picks it up rather than rediscovering it.

---

## DATA IMPACT

- Reads existing data: **YES** — `user_pantry_items`, `planner_entries`, `household_eaters`, `user_preferences`, `household_learning_signals` (via EL2's door), and the opportunity producers' own reads.
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**
- Schema change: **NO**

Deliberately **not** written: `opportunity_deliveries`. See the compliance decision above — the Planner reads producers, not the delivery door, precisely so that scoring a meal never marks an opportunity as seen.

---

## TRUST CHECK

**Could this mislead the user?**
The Planner now *acts* on what it says, so a wrong reason is no longer merely a wrong sentence — it is a wrong meal. Three defences: (a) `reasons` remains derived from `evidence`, so every line has a named owner; (b) the denominator rule means an unreadable owner silences its dimension rather than voting zero; (c) opportunity types the Planner cannot honestly evaluate are skipped rather than parsed out of prose.

**Could this fabricate certainty?**
No model, no prompt, no inference. Every component is arithmetic over a fetched fact. Confidence is never manufactured: LEARN1's own `confidence` band grades the learning weight, and a `low`-confidence understanding moves the score by less than a `high` one.

**Is anything guessed but shown as real?**
No. The place where guessing could creep in — "the household has nothing in the pantry" vs "we could not read the pantry" — is exactly what the `applicable` flags separate, and the arithmetic is structured so the two cannot be conflated.

**What happens if the system is wrong?**
Each owner read is independently try/caught. A failing owner silences its own dimension and nothing else; meal generation always completes. With every intelligence owner unavailable, `scoreMeal` degrades precisely to its pre-PLAN2 self — the Planner gets less intelligent, never broken.

- No architectural duplication introduced: **YES** (one is removed)
- No new source of truth created: **YES** (none)
- Runtime behaviour altered: **YES — deliberately.** Meal selection now changes. This is the point of the workstream and the reason it is RED.

---

## ROLLBACK PLAN

| Item | Value |
|---|---|
| Rollback identifier | `rollback/plan1-intelligent-planner-evolution-20260712` → `b4a63af861b2ec14fc5f09b69db7441c81115fab` |
| Dirty-tree snapshot (pre-PLAN2) | `rollback/plan1-worktree-backup-20260712` → `2c7050784dfa24348b8383473247f83be0c62bc5` |

**Rollback commands**

Revert PLAN2 only, preserving the unrelated uncommitted work:
```bash
git checkout <plan2-commit>^ -- server/lib/meal-scoring-service.ts \
                                server/lib/smart-suggest-service.ts \
                                server/lib/explainability-service.ts \
                                server/lib/planner-explanation-context.ts \
                                server/lib/household-meal-matcher.ts \
                                client/src/lib/planner-types.ts \
                                client/src/components/SmartReviewPanelContent.tsx \
                                package.json
rm -f server/tests/test-plan2-planner-evolution.ts
```

Full return to the pre-PLAN2 committed state:
```bash
git checkout rollback/plan1-intelligent-planner-evolution-20260712
```

**Behavioural rollback without a code revert.** Because intelligence is gated on the context being supplied, setting `INTELLIGENCE_SHARE = 0` — or passing no intelligence context from `smart-suggest-service` — restores pre-PLAN2 selection exactly, with no other code change. This is the fastest safe response if selection quality regresses in production.

**Verification after rollback**
```bash
npm run test:scoring                       # 12/12
npm run test:planner-compliance            # 25 passed
npm run test:plan1-planner-intelligence    # 58 passed
npm run test:intelligence-planner-binding  # 31 passed
```

---

## SCOPE LOCK

**Implemented scope — PLAN2 only.**

| Mission requirement | How it is met | Status |
|---|---|---|
| Nutrition-aware planning | `plantDiversity` scored from `diversity_group`; nutrition opportunities read from Household Health | ✅ |
| Household-aware planning | `householdFit` folded into the scorer and extended to **every** candidate, not just user meals | ✅ |
| Opportunity-aware planning | Open opportunities read from the registered producers; `opportunityFit` scores candidates that advance them | ✅ |
| Learning-aware planning | LEARN1 Confirmed Understanding read through EL2's one door; re-weights only (NK2 P1) | ✅ |
| Contextual meal recommendations | pantry, season, and week state now *move the choice*, not just describe it | ✅ |
| Planner reasoning and explanations | PLAN1's evidence trail extended to the new dimensions and made **visible** in the UI | ✅ |
| Reuse existing architecture | No new engine, capability, store, verb, or planning logic. Six owners read; zero created | ✅ |

**Explicitly excluded (NOT done):**
- **The Planner is not enrolled as an opportunity producer.** It consumes; it does not emit. (Decided with approval — see Remaining Gaps.)
- No new planner engine, capability, verb, store, or conversation state.
- No change to the hard compliance gates. Intelligence re-weights; it never admits what a gate excluded.
- No `overlapScore` repair — reported, not silently re-weighted.
- No LLM anywhere in the Planner.

---

## CHANGES MADE

| File | Change |
|---|---|
| `server/lib/meal-scoring-service.ts` | `SCORE_WEIGHTS` exported (now the single weight owner); `INTELLIGENCE_SHARE`, `INTELLIGENCE_WEIGHTS`, `MealIntelligenceSignals`, `IntelligenceBreakdown`, `scoreIntelligence` added; `scoreMeal` takes an optional intelligence context and composes the 70/30 envelope |
| `server/lib/planner-explanation-context.ts` | Extended with `learnedPreferences` / `learningAware` (LEARN1 via EL2's door) and `openOpportunities` / `opportunityAware` (the registered producers); adds `opportunitiesAdvancedBy`, `matchLearnedPreference`, `toPlannerOpportunitySignal`, `PLANNER_ACTIONABLE_OPPORTUNITY_TYPES`, `PLANNER_OPPORTUNITY_PRODUCERS` |
| `server/lib/smart-suggest-service.ts` | Builds per-candidate intelligence signals (canonical resolution memoised per run); household fit now attached to **external** candidates; the out-of-band `compatBonus` and `COMPATIBILITY_RANKING_BONUS` **retired** |
| `server/lib/explainability-service.ts` | `WEIGHT_MAX` converged onto the scorer's `SCORE_WEIGHTS` (fixing the drift); two new evidence dimensions (`learned-preference`, `open-opportunity`) |
| `server/lib/household-meal-matcher.ts` | `scoreCandidateCompatibility` exported; `scoreMealCompatibility` delegates to it (one core, two entry points) |
| `client/src/components/SmartReviewPanelContent.tsx` | The "Why?" disclosure renders PLAN1's sourced evidence trail; `EVIDENCE_ORIGIN` maps the stable dimension enum to household language |
| `server/tests/test-plan2-planner-evolution.ts` | **New** — 66 assertions |
| `package.json` | `test:plan2-planner-evolution` registered, and added to the aggregate `test` chain |
| `docs/implementation/planner/PLAN2_INTELLIGENT_PLANNER_EVOLUTION.md` | This document |

No schema change. No new store. No new capability, verb, engine, or route.

---

## REMAINING GAPS

**1. 🔴 A hard-gate test is flaky — and its regex, not the gate, is wrong (pre-existing).**
`test-household-vegan-vegetarian-hard-enforcement` fails intermittently (0–2 failures per run). PLAN2 did **not** cause it: the failure distribution is identical on a pristine pre-PLAN2 worktree (`2,1,2,0,1,1`) and after (`0,1,1,1,1,2`). The cause is now known precisely. The assertion greps served entries with a bare substring regex, `/(...|milk|...)/`, and the token that trips it is **`milk` inside `coconut milk`**, in a Thai Pumpkin Soup — a vegan dish. Because the suite calls a **live external recipe API**, whether that soup is served varies per run.

So the dietary gate is **not** leaking; the *test* is. But a hard-gate test that cries wolf is worse than no test, because the one failure that is real will be waved through as "that flaky vegan one". It should be given word boundaries (and, separately, a deterministic candidate pool — a hard-safety test must not depend on a third-party API being up or returning the same recipes twice). Left untouched here: PLAN2 must not edit a safety test it did not break, and a fix wants its own change.

**2. The Planner does not yet produce opportunities.** It consumes them (decided, with approval). The platform has a **planner-shaped hole already carved and empty**: `DOMAIN_SURFACE.planner`, `DOMAIN_TO_CATEGORY.planner → "planner-gap"`, and the `planner-gap` notice category all exist, and **nothing emits into them**. Enrolling the Planner would let it say "your week has no oily fish" in the Companion's voice, and would cost: `"report"` added to the `planner` capability's `supportedIntents`, a handler verb returning `{ opportunities: [...] }`, and **one line** in `OPPORTUNITY_SOURCES`. It also means deliberately updating the HHP3 assertion that exactly two producers exist. Everything else — muting, lifecycle, budget, LEARN1 re-weight, ordering, the sealed decision, the Evidence loop — is inherited free.

**3. Learning is wired but not yet fed.** The Planner reads Confirmed Understanding through EL2's door and re-weights by it correctly (asserted). But **nothing currently records planner evidence**, so no household has a `domain: "planner"` understanding yet, and the dimension sits at its neutral midpoint for everyone. The seam is live and costs nothing until evidence exists. Feeding it means calling `recordHouseholdObservation` at a real planner choice — a household *applying* a suggestion is positive evidence for that meal's cuisine and protein; *rerolling* a slot is negative evidence — which is a write path and deserves its own workstream.

**4. `overlapScore` is dead code worth 8 points.** It builds a `Set` of whole ingredient **strings** and tests membership with single **words**, so it fires essentially never. Repairing it would silently re-weight every existing recommendation, so it is reported rather than fixed.

**5. The Intelligence-Platform `explain` verb still returns household-adaptation rationale, not `MealExplanation`.** The Companion therefore cannot yet answer "why did you suggest this?" from PLAN2's evidence. Re-deriving it for a placed entry needs no new store (contrary to PLAN1's assumption) — but "why it fits your week *now*" is a subtly different question from "why it was chosen *then*", and conflating them would be dishonest.

**6. Product Knowledge Registry entry owed.** PLAN2 changes what the Planner *is*, but `docs/product/` does not exist. Recorded under Rule KC12 rather than skipped — see Product Registry Impact.

**7. Selection remains stochastic.** Smart Suggest picks randomly from the top 3. PLAN2 sharpens *what reaches* the top 3; it does not change the dice. Worth revisiting now that the ranking means more than it did.
