# PANTRY1 — Intelligent Pantry Evolution

**Date:** 2026-07-12
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** Additive throughout — no schema change, no migration, no new store, no new engine, no capability added or removed. It extends one shared explanation owner, adds one generator at a documented extension point, and adds one composer. The AMBER (rather than GREEN) is because it puts new **sentences in front of households** about food they own, and a sentence is the hardest thing in THA to take back.

---

## ROLLBACK PROTECTION

| | |
|---|---|
| Rollback tag | `pantry1-before` |
| Tagged commit | `db6ccd222abad2c572ae3cf3931c7a3f49908539` |
| HEAD at tag time | `b4a63af8` — *PHASE5E — Proactive Intelligence* |
| Rollback command | `git checkout pantry1-before -- <file>` (per file), or see below |

> ⚠️ **The working tree was dirty when PANTRY1 began** — 98 files, carrying the uncommitted work of PLAN2, SHOP1, CBK2, HHP2/HHP3, NTC-P2 and PDA1. A plain tag at `HEAD` would therefore have protected **none of it**, and rolling back to `HEAD` would have destroyed five workstreams.
>
> `pantry1-before` is consequently **not** a tag on `HEAD`. It is a tag on a `git stash create` snapshot commit that captures the **full working tree** as it stood before PANTRY1 — every prior phase's uncommitted work included. Untracked files (which `git stash create` does not capture) were archived separately to `pantry1-untracked-backup.tar.gz`, 30 files, outside the repository.
>
> **To roll PANTRY1 back and nothing else:**
> ```
> git checkout pantry1-before -- \
>   server/lib/explainability-service.ts \
>   server/intelligence/food-intelligence/opportunity-engine.ts \
>   server/intelligence/handlers/pantry-read-port.ts \
>   server/intelligence/handlers/pantry-read-handler.ts \
>   server/tests/test-intelligence-pantry-binding.ts \
>   server/routes.ts \
>   client/src/components/PantryIntelligencePanel.tsx \
>   client/src/pages/pantry-page.tsx \
>   package.json
> git reset -- <those files>          # git checkout <commit> -- also stages
> rm server/lib/pantry-intelligence-assembler.ts \
>    server/tests/test-pantry1-intelligent-pantry.ts
> ```
> Do **not** `git reset --hard pantry1-before`: that would restore the snapshot wholesale and is only correct if you also intend to discard everything done since.

---

## 1. SUMMARY

The Pantry was already the most-wired domain in THA and the least intelligent. It knew *what* a household had. It did not know what any of it **meant to them**.

PANTRY1 makes it household-aware, planner-aware, shopping-aware, cookbook-aware, nutrition-aware and reasoned — and the striking thing about the work is how little of it was new. Everything the Pantry needed already existed and had simply never been joined.

### What PANTRY1 cost, measured

| | |
|---|---|
| New engines | **0** |
| New capabilities | **0** (live count stays 23) |
| New stores / tables / columns | **0** |
| Migrations | **0** |
| Schema changes | **0** |
| Lines of delivery, ranking, suppression, budgeting, muting or lifecycle code | **0** |
| Lines added to `OPPORTUNITY_SOURCES` | **0** |
| Lines added to `DOMAIN_SURFACE` | **0** |
| Lines added to `DOMAIN_TO_CATEGORY` | **0** |
| Lines added to `NoticeCategory` | **0** |
| New opportunity generators | **1** |
| New files | **2** (one composer, one test suite) |
| New tsc errors | **0** (168 before, 168 after) |

The five zeroes in the middle of that table are the point. `pantry` was **already** enrolled as an opportunity domain, **already** routed to a surface, **already** mapped to a Companion notice category, and the pantry page **already** mounted `AmbientIntelligence`. PANTRY1's enrolment cost was *literally nothing*, which is the strongest available evidence that DEC1's Decision Engine boundary is real: a domain joins it once, and every later intelligence in that domain inherits delivery for free.

### The six faces of the intelligent Pantry

| Face | Delivered by | Owner reused | New engine? |
|---|---|---|---|
| **Household-aware** | `household-suitability` dimension | `resolveHouseholdSignal` (FI3) + `shared/restrictions` | No |
| **Planner-aware** | `household-history` dimension + the pre-existing `pantry-item-unused-in-plan` card | `planner_entries` via `buildPlannerExplanationContext` | No |
| **Shopping-aware** | `shopping-impact` dimension + **the one new generator** `pantry-need-not-on-shopping-list` | `shopping-read-port` (SHOP1) | No |
| **Cookbook-aware** | `recipe-support` dimension | `meals-read-port` (INT15) + `mealCanonicalFoods` | No |
| **Nutrition-aware** | `plant-diversity` + `seasonal-suitability` dimensions | `plant-classifier` + `seasonal-map` | No |
| **Reasoned** | `generatePantryExplanation` + `pantry:explain` + the panel | `explainability-service.ts` — THE one owner of "why" | No |

---

## 2. THE LOAD-BEARING DECISION — the tautology trap, and why Rule E1 cannot see it

CBK2 established that a cookbook recipe cannot be explained with the Planner's explainer, because five of its sixteen dimensions are week-relative and two of them **lie** against an empty week. The obvious move for PANTRY1 was to copy that: narrow the dimension union, exclude the week, ship.

That is necessary and it is **not sufficient**, because a pantry item is a third kind of subject and it brings a third kind of failure.

A pantry item is not a *candidate* (which the Planner ranks) and not a *recipe* (which the Cookbook describes). It is **a food the household already owns and already put there**. And that means the dimension called `pantry-usage` — whose entire content is *"you already have this"* — is **vacuously true of every pantry item there has ever been**.

It reads from a real owner. It carries a perfect citation to `user_pantry_items`. And **Rule E1 — "no citation, no card" — cannot catch it**, because Rule E1 is a rule about *sourcing*, and sourcing cannot detect *emptiness*. The line passes every guard THA has and arrives in front of a household as:

> **Olive oil** — you have olive oil in your pantry.

That is not a lie. It is a **true sentence carrying no information, wearing the costume of evidence**. And because `reasons` is derived from `evidence`, admitting a tautology to the trail does not merely permit it — it **automatically promotes it to a reason**, in the one place where THA asks a household to trust that a cited sentence was worth saying.

**CBK2's trap was a claim with no basis. PANTRY1's is a claim with a flawless basis and no content.** They need different guards, and only the second one requires reading what the sentence actually *says*.

So `pantry-usage` is excluded from `PantryExplanationDimension` **by construction** — an `Extract<>` narrowing, not a reviewer's memory — and `test-pantry1-intelligent-pantry.ts` §2 asserts mechanically, against a maximally-aware context, that no vacuous sentence can be emitted.

### The corollary: the resting state of a pantry is silence

Follow the trap one step further and it stops being about one dimension.

Almost every pantry item, almost all of the time, is in its **resting state**: no recorded need, not on the shopping list, no restriction conflict, no open opportunity. "You do not need this and it is not on your list" is *true of nearly everything in the cupboard* — and it is exactly the sentence a naive `shopping-impact` implementation emits.

So the shopping dimension has **no `else` branch**. An item in its resting state gets **zero reasons**, and the panel renders nothing at all. A 221-item pantry does not produce 221 cards; on real production data it produced reasoning for the handful of items THA genuinely had something to say about.

*Rare and right beats frequent and wrong.* The Pantry's most important new behaviour is how much it declines to say.

---

## 3. THE SECOND DECISION — the ungated health claim that was sitting right there

The obvious nutrition source for a pantry food is `pantry_ingredient_knowledge.supports` — the **Pantry's own knowledge table**, already read on the very same page, already rendered a few pixels away.

PANTRY1 initially cited it, gated to human-curated rows on the theory that the risk was *AI-authored prose entering an evidence trail*. **Running the code against the production database proved that theory wrong, and the real risk worse.**

The field is not mostly AI-written — **46 of its 50 rows are human-curated and locked**. The problem is what humans put in it. It is free text, of mixed category, and it has never passed an evidence gate:

- **Nutrients** — `Fibre`, `Omega-3`, `Iron`, `Vitamin C`
- **Culinary notes** — `Great for sauces`, `Warm flavour`, `Versatile ingredient`
- **And the fatal ones — health claims** — `Gut health`, `Anti-inflammatory compounds`, `Digestive comfort`, `Antioxidants`

`explainability-service.ts` states at the top of its own file that it **speaks no health claim**: health-benefit claims are gated behind `getEvidenceBackedFoodReport` (SourceRef **plus a human `reviewedAt`**) and belong to the Food Report. Citing `supports` would have let an ungated, unreviewed, hand-typed phrase like *"anti-inflammatory compounds"* enter THA's cited evidence trail **wearing a truthful citation to a real owner** — which is *worse* than an uncited claim, because a household can see an uncited claim coming.

The AI-versus-human distinction was a red herring. The real line is **gated versus ungated**, and it does not care who typed it.

`pantry_ingredient_knowledge` is entirely legitimate where it already lives: the Pantry Knowledge card renders it as **editorial copy**, framed and read as such. It is the *promotion of editorial copy into cited evidence* that is forbidden — not the copy. So `PantryHouseholdFacts` carries **no field for it at all**: the dimension is unreachable by construction, and a future change that wants it back must add the channel and answer the comment first.

The Pantry is still nutrition-aware. `plant-diversity` is a structural fact from the same canonical classifier the Plant Diversity report uses; `seasonal-suitability` comes from the seasonal map; and the evidence-gated Food Report remains one tap away on the same panel. What THA declines to do is **repeat an ungated health claim in its own voice**.

---

## 4. WHAT THE LIVE RUN FOUND THAT INSPECTION DID NOT

PANTRY1 was verified by running the real assembler against the **production database**, for a real household with 221 pantry items — not by reasoning about it. That run found **three defects that every previous check had passed**, and all three are now regression-tested.

**1 — The wrong-subject citation (the serious one).**
The household's pantry held **"Gala apple", "Braeburn apple" and "Granny Smith apple"** — three separate rows, three separate opportunities, and **one canonical slug** (`apple`) shared between all of them.

The `open-opportunity` dimension matched on that slug, so **Gala's opportunity was cited on Braeburn's card**. A household reading about their Braeburns was told a fact about a *different item in their own cupboard*. Every word was true. The citation was perfect. It was a fact about **the wrong subject** — and no sourcing rule, and no tautology check, can catch that: the sentence is genuinely informative, it is simply not about the thing being looked at.

> **The slug identifies the FOOD. A pantry is a place where one food is many items.**

Fixed by additionally requiring the producer's own structured `subjectLabel` to name *this row*. §4b.

**2 — The plural copula.** `"Strawberries is at UK summer peak right now"`. Households name their pantry rows, and name them plurally as often as not. Fixed by dropping the copula entirely (`"At UK summer peak right now"` — the card's title already names the food). §4c.

**3 — The edited quotation.** `lowerFirst()` — inherited from the Planner and Cookbook, which splice a producer's sentence mid-clause — rendered *"Granny Smith apple"* as **"granny Smith apple"**. Rule ET6 says a producer's sentence is cited *verbatim*, and this was a machine quietly editing a sentence it had promised to quote. Pantry rows are proper nouns far more often than recipes are. Fixed: after an em-dash a capital is correct English, so the honest splice is also the tidier one.

None of these was reachable by reading the code. All three were live in the first thing a household would have seen.

---

## 5. ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
✅ Reuses the canonical owner for every fact          — no fact is authored here
✅ Creates no second owner of any fact                — one explainer, one composer,
                                                        one restriction resolver, one
                                                        canonical resolver
✅ No new engine                                      — 1 generator at a documented
                                                        extension point; 1 assembler
                                                        that decides nothing
✅ No duplicate pantry logic                          — the INT8 read port is reused,
                                                        not re-implemented
✅ Evolution over replacement (Rule 8)                — every union extended, none replaced
✅ No schema change, no migration, no new store
✅ Honest gaps (Principle 6)                          — 7 awareness flags; an unreadable
                                                        owner is SILENT, never zero
✅ Deterministic                                      — the reasoning core is PURE; no
                                                        clock, no randomness, no I/O
```

```
AI ARCHITECTURE COMPLIANCE
✅ Uses the canonical Intelligence Platform + Capability Registry + Intent Engine
✅ Reuses existing business services                  — pantry, meals, shopping ports
✅ Creates no second assistant                        — no new capability; count stays 23
✅ Duplicates no conversation state
✅ Registered capabilities only, permission-aware     — `pantry:explain` is ownership-gated
                                                        BEFORE any reasoning is composed
✅ Honest gaps rather than fabricated knowledge       — see §2, §3
✅ No autonomous action                               — the need card SUGGESTS; it never
                                                        adds the line
✅ No model output enters the evidence trail          — and, per §3, no ungated HUMAN claim
                                                        does either
✅ LEARN1 read through EL2's ONE door                 — via buildPlannerExplanationContext;
                                                        the store is never imported
✅ Opportunities read from PRODUCERS, never the       — inherited from PLAN2; a background
   delivery door                                        read must not eat unseen notices
```

```
EXPERIENCE & UI GOVERNANCE COMPLIANCE
✅ No new visual pattern                              — reuses the existing IntelligenceCard
✅ Progressive disclosure                             — reasoning appears on an EXPANDED item,
                                                        never on the collapsed row
✅ Calm before capability                             — the resting state of a pantry item is
                                                        SILENCE (§2 corollary); a 221-item
                                                        pantry does not produce 221 cards
✅ The client writes no prose                         — every sentence is server-authored and
                                                        cited; `reasons` is derived from
                                                        `evidence` server-side, so an
                                                        unsourced reason is UNRENDERABLE
✅ Premium standard                                   — the plural-copula and edited-quotation
                                                        fixes (§4) are exactly the care a
                                                        household would feel the absence of
```

```
PRODUCT REGISTRY COMPLIANCE (Rule KC15)
✅ Affected entries updated IN THE SAME CHANGE
```

**Entries created:** none.
**Entries updated:** `cap-pantry.md` (version 1 → 2; `last_verified` 2026-07-12).
**Entries retired:** none.

---

## 6. DOMAIN IMPACT DECLARATION

```
DOMAIN IMPACT
Pantry      — EVOLVED. Reasons about its contents; emits one new opportunity type.
Cookbook    — READ ONLY. Its meals are counted against a pantry food. Unchanged.
Shopping    — READ ONLY. Its list is checked against a recorded need. Unchanged.
Planner     — READ ONLY. Its history and its context composer are reused. Unchanged.
Household   — READ ONLY. Its restrictions are matched. Unchanged.
Nutrition   — NOT TOUCHED. Deliberately: see §3.
Companion   — INHERITS. The pantry→notice mapping already existed; 0 lines.
Decision    — INHERITS. 0 lines of delivery, ranking, suppression or budgeting.
Learning    — READ ONLY, through EL2's one door. Not yet FED (see Remaining Gaps).
```

---

## 7. DATA IMPACT

- **Reads:** `user_pantry_items`, `meals`, `shopping_list`, `planner_entries`, `household_eaters`, `household_learning_signals` (via EL2), plus the canonical/seasonal/plant seeds.
- **Writes:** **nothing.** PANTRY1 has no write path of any kind.
- **Changes the meaning of an existing field:** **no.**
- **Backfill required:** **none.**
- **New data required for the feature to work:** none. It reasons entirely over data households already have.

---

## 8. TRUST CHECK

**Could this mislead a household?** The three ways it could have, it did — and all three were caught by running it (§4). The wrong-subject citation is the one that matters: it was *true, cited, and about the wrong apple*.

**Could it fabricate certainty?** The seven awareness flags exist to stop exactly that. An unreadable owner is **silent**, never zero. A database outage must never read as *"your cookbook uses this in no recipes"*.

**Is anything guessed but shown as real?** No. The one new card fires **only** on a quantity the household **typed themselves**. It does not model consumption, does not infer that anyone is running low, and does not decide what anyone ought to buy. It reports back a shortfall they *declared*, against a list they own — and it can only be wrong if they changed their mind and did not say so.

**What if the reasoning is wrong?** Every sentence names the owner it came from, so a household can check it. `reasons` is *derived* from `evidence`, so an unsourced sentence is unreachable rather than merely discouraged.

**The honest one.** THA now tells households that a food in their cupboard conflicts with one of their own restrictions. That is a true and useful thing to be able to *ask*, and a hostile thing to be *told* — which is precisely why it is a reasoning dimension you get when you open the item, and **not** an opportunity card that interrupts you (§9). Households stock food that not everyone eats. That is not a defect in the household.

**The second honest one.** The Pantry declines to repeat a health claim that 46 human-curated rows are sitting there offering it (§3). Some of those claims are probably true. THA still will not say them, because it cannot show a household *why* it believes them — and a silence a household can trust is worth more than a paragraph they cannot.

---

## 9. THE OPPORTUNITY THAT WAS NOT MINTED

The tempting second generator was `pantry-item-household-conflict` — a pantry staple that collides with a stored restriction — by exact analogy with the shopping and cookbook twins that already exist.

**It is not minted, because the analogy is false.** A shopping line is a purchase about to be made; a recipe is a meal that would be served to everyone. A pantry item is an **ingredient** — and households correctly and routinely stock ingredients that not every member eats. **Bread in the cupboard of a house with one coeliac member is not an error to be corrected. It is somebody's lunch.**

Minting the type would have put a card in front of essentially every household that has both a restriction and a normal kitchen, and every one of those cards would have been a **real citation attached to a false implication**.

The fact is still worth having, and PANTRY1 delivers it — as the `household-suitability` dimension of the reasoning, where the household is **asking** about that item rather than being **interrupted** about it. This is the same discipline that stopped CBK2 minting *"this recipe brings 5 plants"* as a card.

---

## 10. ARCHITECTURE CONVERGENCE STATUS

```
Domain                      Pantry
Canonical Owner             storage.ts (user_pantry_items, SoT D8–11)
Runtime Consumers           pantry-read-port (INT8) — the ONE seam. Read by the
                            handler, the opportunity engine, and the new assembler.
Duplicate Owners Remaining  0
Duplicate State             0
Duplicate Workflows         0
Explanation Owners          1  (explainability-service.ts — Planner + Cookbook + Pantry)
Convergence                 ~95%
Target                      100%
Next Milestone              Feed LEARN1 from pantry evidence (see Remaining Gaps 3)

Remaining Architectural Risks
  1. NAMING DEBT (inherited, not paid). `planner-explanation-context.ts` is now read by
     the Planner, the Cookbook AND the Pantry while still named for one of them. CBK2
     declined to rename it; PANTRY1 makes it three readers and declines again, on the
     DEC1 precedent ("location unchanged at designation; naming is governance, not
     churn"). Flagged, deliberately deferred — it is now materially misleading.
  2. `PlannerExplanationDimension` is the shared evidence VOCABULARY of three explainers
     while carrying the Planner's name. Same debt, same deferral, one level down.
```

---

## 11. CHANGES MADE

### Modified — server (4)

| File | Change |
|---|---|
| `server/lib/explainability-service.ts` | + `PantryExplanationDimension` (an `Extract<>` narrowing — see §2), `PantryExplanationEvidence`, `PantryExplanation`, `PantryItemCandidate`, `PantryHouseholdFacts`, `EMPTY_PANTRY_HOUSEHOLD_FACTS`, `PANTRY_DIMENSION_RANK`, `generatePantryExplanation` (PURE, no score). + `"recipe-support"` to the shared dimension vocabulary and its rank table. |
| `server/intelligence/food-intelligence/opportunity-engine.ts` | + `pantry-need-not-on-shopping-list` to `FoodOpportunityType` (with the reasoning for the type NOT minted — §9). + `identifyPantryNeedOpportunities` (pure). Orchestrator: the shopping read is **hoisted** so it has two readers, with an explicit `shoppingAware` flag — an *empty* list is a read list, an *unreadable* one must silence the card. |
| `server/intelligence/handlers/pantry-read-port.ts` | + ONE method: `getPantryReasoning(ingredientKey, userId)`. A 1:1 forward to the assembler (the CBK2 `getMealReasoning` precedent — for a composed fact, the owner is the composer). |
| `server/intelligence/handlers/pantry-read-handler.ts` | `explain` now reads BOTH owners. Its gap condition moves from *"no stored knowledge row"* to *"nothing to say from either owner"* — gapping the whole verb because one of two owners is empty would withhold facts THA genuinely holds. `knowledge` becomes nullable; `reasoning` added. + `toReasoningView`. |

### Modified — routes (1)

| File | Change |
|---|---|
| `server/routes.ts` | `/api/pantry/intelligence` accepts an optional `ingredientKey` and returns `reasoning`. Independently optional and try/caught, exactly like the `mealUnlock` section beside it. Still owns nothing. |

### Modified — client (2)

| File | Change |
|---|---|
| `client/src/components/PantryIntelligencePanel.tsx` | + optional `ingredientKey` prop; + the `reasoning` section, rendered with the **existing** `IntelligenceCard` (zero new visual patterns). The panel computes no figure, ranks nothing, and writes no reason. |
| `client/src/pages/pantry-page.tsx` | Passes `ingredientKey={item.ingredientKey}`. One line. |

### Modified — tests (1)

| File | Change |
|---|---|
| `server/tests/test-intelligence-pantry-binding.ts` | Mechanical: the port fake gains `getPantryReasoning`, returning `null`. **No assertion changed** — all 47 still pass, including the honest gap for an ingredient with no stored knowledge. |

### Modified — build (1)

| File | Change |
|---|---|
| `package.json` | + `test:pantry1-intelligent-pantry`, **and** it is added to the aggregate `npm test` chain. *A test nobody runs is a test that does not exist.* |

### Created (2)

| File | Purpose |
|---|---|
| `server/lib/pantry-intelligence-assembler.ts` | The Pantry's ONE composer. **Owns nothing and decides nothing** — every fact is fetched from its existing canonical owner and returned ephemerally. Same shape as WX4/WX1A/HNP1. Reuses `buildPlannerExplanationContext` rather than standing up a second composer of season/history/learning/opportunities. |
| `server/tests/test-pantry1-intelligent-pantry.ts` | 78 assertions. §2 is the load-bearing one. |

### Updated — Product Knowledge Registry (1)

`docs/product/intelligence/intelligence-capabilities/cap-pantry.md` — version 1 → 2.

### Deliberately NOT changed

- **`capability-registry.ts`** — no new capability, no new intent. Live count stays 23, so the ~20 binding tests asserting it need no edit.
- **`OPPORTUNITY_SOURCES`, `DOMAIN_SURFACE`, `DOMAIN_TO_CATEGORY`, `NoticeCategory`, `DOMAIN_LABEL`, the `AmbientIntelligence` mount** — `pantry` was already in every one of them.
- **`shared/schema.ts`** — no expiry column, no "have" quantity. See Remaining Gaps.
- **`knowledge-assembly.ts`** — capability-agnostic; a richer `explain` result flows through it unchanged.
- **`pantry_ingredient_knowledge`** — untouched, and deliberately uncited (§3).

---

## 12. VALIDATION PERFORMED

```
npx tsx server/tests/test-pantry1-intelligent-pantry.ts              78 passed, 0 failed
npx tsx server/tests/test-intelligence-pantry-binding.ts             47 passed, 0 failed
npx tsx server/tests/test-intelligence-pantry-discovery-binding.ts   40 passed, 0 failed
npx tsx server/tests/test-intelligence-food-opportunity-binding.ts   40 passed, 0 failed
npx tsx server/tests/test-shop1-intelligent-shopping.ts              34 passed, 0 failed
npx tsx server/tests/test-cbk2-intelligent-cookbook.ts               49 passed, 0 failed
npx tsx server/tests/test-plan1-planner-intelligence.ts              58 passed, 0 failed
npx tsx server/tests/test-plan2-planner-evolution.ts                 66 passed, 0 failed
npx tsx server/tests/test-dec1-decision-engine.ts                    49 passed, 0 failed
npx tsx server/tests/test-intelligence-opportunity-delivery-binding.ts 60 passed, 0 failed
npx tsx server/tests/test-attn1-attention-platform.ts                29 passed, 0 failed
npx tsx server/tests/test-coach1-proactive-coaching.ts               72 passed, 0 failed
npx tsx server/tests/test-learn1-household-learning.ts               72 passed, 0 failed
npx tsx server/tests/test-hhp3-household-health-delivery-convergence.ts 39 passed, 0 failed
npx tsx server/tests/test-intelligence-registry-executability.ts    126 passed, 0 failed
npx tsx server/tests/test-intelligence-native-discovery.ts           81 passed, 0 failed
npx tsx server/tests/test-intelligence-companion-actions.ts          62 passed, 0 failed
npx tsx server/tests/test-intelligence-platform.ts                   33 passed, 0 failed
npx tsx server/tests/test-intelligence-notice-convergence.ts         64 passed, 0 failed
                                                            ──────────────────────────
                                                            TOTAL   1099 passed, 0 failed
```

`npx tsc --noEmit` — **168 errors before, 168 after; zero in any file PANTRY1 touched.** Proven by extracting the pre-PANTRY1 versions of all six touched files from the `pantry1-before` snapshot, counting, and restoring — *not* by `git stash`, which would have reverted them to `HEAD` and silently discarded the prior phases' uncommitted work in the same files (a false baseline of 202, observed and discarded).

**Verified against the live production database.** `getPantryItemIntelligence` was run for real, for a real household with **221 pantry items**, and its output read line by line. Every owner was genuinely read (`pantry-items, seasonal-map, household-learning, opportunity-producers, meals, shopping-list, household-eaters, explainability-service`). **This is what found the three defects in §4**, none of which was reachable by inspection.

### ⚠️ Not performed — the honest state

- **No browser run.** The panel's rendering was verified by type and by inspection, not by looking at it.
- **No household with a recorded `needQuantityValue` was found in the sample**, so the one new opportunity card was proven against the pure generator (14 assertions) and by inspection of the orchestrator — not observed firing end-to-end on live data.
- `historyAware` was `false` for every item in the live sample. That is **correct** (the household has no planner entries; PLAN2 defines empty history as honestly unaware), but it means the `household-history` dimension was not exercised against real data.

---

## 13. DEFINITION OF DONE

**What success looks like.** A household opens an item in their pantry and THA tells them something true, cited, and worth knowing — or says nothing at all.

**What must not break.** The pantry read/explain binding; the existing pantry, shopping and cookbook opportunity cards; the Decision Engine's delivery of any of them.

**Manual test steps**
1. Open `/pantry`. Expand a food you have several recipes for → the reasoning card leads the panel and names those recipes.
2. Expand a food you have **none** of the above for → **no reasoning card at all** (the resting state, §2).
3. Expand two varieties of the same food (two apples) → each cites **only its own** opportunity (§4).
4. Expand a seasonal food → *"At UK summer peak right now"* — no broken copula.
5. Set a "need" quantity on an item not on your shopping list → the `pantry-need-not-on-shopping-list` card appears ambiently on the pantry surface.
6. Add that item to the shopping list → the card stops firing.
7. Ask Apple to explain a pantry item → `pantry:explain` returns `knowledge` **and** `reasoning`.
8. Confirm no pantry sentence anywhere says "gut health", "antioxidants" or "anti-inflammatory".

---

## 14. SCOPE LOCK

### Implemented scope

| Mission requirement | How it is met | Status |
|---|---|---|
| Household-aware pantry | `household-suitability` dimension, via `resolveHouseholdSignal` + `shared/restrictions` | ✅ |
| Planner-aware pantry | `household-history` dimension + the pre-existing unused-in-plan card | ✅ |
| Shopping-aware pantry | `shopping-impact` dimension + the one new generator | ✅ |
| Cookbook-aware pantry | `recipe-support` dimension, via the INT15 meals port | ✅ |
| Nutrition-aware pantry | `plant-diversity` + `seasonal-suitability`; ungated claims refused (§3) | ✅ |
| Pantry reasoning & explanations | `generatePantryExplanation` + `pantry:explain` + the panel | ✅ |
| Reuse existing architecture | 0 new engines; every owner reused | ✅ |
| No new pantry engines / duplicate logic | 1 generator at a documented extension point; 1 composer that decides nothing | ✅ |

### Explicitly excluded (NOT done)

- **Expiry / use-by / freshness.** Does not exist anywhere in THA — no column, no route, no UI. Adding it is a schema change, a migration, and a data-entry burden on households. **Out of scope and correctly so:** a pantry that *guesses* when food expires would be the most dangerous thing in this document.
- **"Have" quantity / stock levels / consumption modelling.** Only "need" quantity exists. Nothing decrements a pantry item when a meal is cooked. PANTRY1 **never infers depletion** and does not begin to.
- **Executable `add` / `delete` pantry intents.** Still honest gaps. INT8's read-only boundary is intact.

### Suggestions (observed, not implemented — do not action without approval)

1. **`test:cbk2-intelligent-cookbook` and `test:shop1-intelligent-shopping` are NOT registered in `package.json`** — neither as a script nor in the aggregate chain. They run only if someone types the path. By PLAN2's own rule, *a test nobody runs is a test that does not exist*: 83 assertions are currently outside CI. PANTRY1 registered its own and left these alone (scope lock), but this is a two-line fix and should be taken.
2. **`pantry-discovery`'s `quantity`/`unit` fields carry the NEED value**, not stock (`pantry-discovery-port.ts:24-25`). Misleading; worth correcting.
3. **`defaultHave` is dead weight** — stored, projected through the read handler, and read by nothing.
4. **The `pantry-opportunity` notice is a known dead end** — the client fetches `/companion/observations` while the server serves `/companion/notices` (`ntf-pantry-opportunity.md`). PANTRY1's new card inherits this: it is produced, delivered, budgeted and persisted correctly, and the Companion still cannot show it. **PANTRY1 does not fix it and does not depend on it** — the card also reaches the pantry surface via `AmbientIntelligence`, which does work.

---

## 15. REMAINING GAPS

1. 🔴 **The Companion cannot deliver the new card.** Pre-existing (NTC-P2), inherited, not caused. The ambient pantry surface works; the Companion notice path does not. Stated, not solved.
2. 🟡 **Learning is wired but not yet fed.** `learned-preference` reads LEARN1 correctly through EL2's one door, but nothing records *pantry* evidence, so it will match only on a `primary-protein` understanding the Planner happened to confirm. The dimension is honest and mostly silent. (Identical to PLAN2's Gap 3.)
3. 🟡 **The naming debt is now three-deep.** `planner-explanation-context.ts` and `PlannerExplanationDimension` are read by three domains and named for one. Deferred on the DEC1 precedent; it is now materially misleading to a newcomer.
4. 🟡 **`recipe-support` counts the household's OWN meals only.** System/library recipes are excluded by design (a recipe they have never seen is not why they keep tahini), but a household with an empty cookbook therefore gets silence rather than "42 THA recipes use this".
5. 🟡 **The one new card was not observed firing on live data** — no sampled household had recorded a need quantity. Proven pure, not proven in the wild.
6. 🟢 **No browser run.** The panel is type-checked and inspected, not seen.
7. 🟢 **Unidentifiable foods get no reasoning at all.** A food that does not canonically resolve cannot be joined to recipes, the shopping list, the season or opportunities. It is silent, which is correct — but a household with an unusual pantry will notice the silence and not know why.

---

## 16. REPOSITORY CONVENTIONS NOTE

`docs/implementation/pantry/` **did not exist** before this change and was created by it. PANTRY1 has added it to the folder table in `docs/implementation/README.md`.

Two follow-ups remain, neither actioned (scope lock):

1. `REPOSITORY_CONVENTIONS.md` §4's folder table should be amended to admit `pantry/` as well — that document, not the implementation README, is the mechanically-enforced one (`repo-structure-verify.sh`).
2. **`docs/implementation/shopping/` is missing from the implementation README's folder table entirely** — SHOP1 created the folder and never indexed it. `health/`, `nutrition/`, `cookbook/` and `planner/` are all correctly listed; `shopping/` is the sole omission besides the one PANTRY1 has just fixed.
