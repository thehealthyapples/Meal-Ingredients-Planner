# NUTPLAN2 — Nutrition Platform Convergence

**Status:** ✅ Complete — awaiting owner review.
**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback/NUTPLAN2-nutrition-platform-convergence-20260719` → `81e50625` (worktree snapshot) · `rollback/NUTPLAN2-head-20260719` → `772eb6ed` (committed HEAD)
**Governing architecture:** [`README.md`](../../architecture/README.md) bootstrap read · [`ARCHITECTURE_PRINCIPLES.md`](../../architecture/ARCHITECTURE_PRINCIPLES.md) Principles 2 & 8
**Follows:** [`NUTPLAN1`](./NUTPLAN1_HOUSEHOLD_NUTRITION_INTELLIGENCE.md) §9.3 and §10 · [`PROD6`](../platform/) safety gate convergence

---

## 1. Executive summary

NUTPLAN1 closed two *instances* of a defect and said plainly that it had not closed the *class*:

> *"§6.1 closes this **instance**, not the **class**. The next unenumerated food-producing route will be equally invisible."*

**It was right, and the class was worse than it looked.** PROD6's coverage suite — the one THA relies on to prove every food-producing route reaches the dietary safety gate — opens by criticising nineteen other suites for enumerating consumers rather than asserting the complement. Its own header claims §1 *"asserts the COMPLEMENT … so a future endpoint that skips it fails here rather than shipping."*

**It did not.** There was no scan, no set difference, and no discovery step. The complement was asserted in *prose* and enumerated *by hand* — six `app.post` signature strings in a literal array. And that array had three structural blind spots which meant it could not have found what it claimed to cover:

| # | Blind spot | What it hid |
|---|---|---|
| 1 | Every entry was an **`app.post`** signature | No `app.get` route could ever be checked — and `GET /api/meal-pairings/:mealId` was a **live, ungated meal recommender** sitting in it |
| 2 | It matched **double quotes only** | `app.post('/api/meal-plans/smart-suggest'` is single-quoted and was invisible |
| 3 | It matched **string literals only** | **43 routes** are registered from the shared API contract (`app.get(api.search.recipes.path, …)`) and were invisible — including recipe search, whose diet filter **fails open** |

This workstream replaces that array with mechanical discovery, and **inverts the default**: a food-surface route is now discovered automatically and must be explicitly classified. An unclassified one fails the suite. Previously the default was silence.

The discovery immediately produced its own justification: it found **75 food-surface routes**, of which **9** reach the gate, **26** are genuinely exempt, and **43 are recorded gaps that reach no gate at all.** None of those 43 was visible to any THA safety suite before today.

Alongside it, four convergences NUTPLAN1 deferred are complete: one ungated recommender retired, plant diversity converged onto one owner, dead capability retired, and the uplift phrasing rule reduced from five copies to one.

---

## 2. What was implemented

### 2.1 Safety coverage by construction (Objectives 1, 2, 7)

`server/tests/test-prod6-safety-gate-convergence.ts` §1 is rebuilt. It now:

1. **Discovers** every route registration in `server/routes.ts` — all three quote styles *and* constant-registered paths (274 literal + 43 constant = 317 registrations).
2. Filters to **food surfaces** by a deliberately **wide** vocabulary. Over-matching costs one line of classification; under-matching costs a household an allergic reaction.
3. Requires every discovered surface to fall into exactly one of three classifications, **each carrying a mandatory written reason**:
   - `GATED_ROUTES` — asserted to reach a canonical gate symbol, in the handler or in a **declared** delegate module (`via`), so "the gate is somewhere else" is a reviewed declaration rather than a silent pass.
   - `EXEMPT_ROUTES` — the gate does not apply, and why.
   - `KNOWN_UNGATED` — **recorded gaps**, not exemptions on merit.
4. **Fails** on any unclassified route, any stale classification naming a route that no longer exists, any reason under 20 characters, and any growth of the recorded-gap list (a ratchet: it may only shrink).

The suite grew **78 → 158 assertions**.

**The pass message was corrected too.** It used to read *"Every food-producing route reaches the canonical safety gate."* That was true of the six routes the old list named and silent about everything else. It now reads *"Every **CLASSIFIED** food-producing route…"* and prints the counts, including the 43 gaps. A green suite that concealed them would be the false assurance `REL3` was bitten by — a verifier reporting PASS against a database twenty migrations behind.

### 2.2 The ungated meal recommender that was in blind spot 1

`GET /api/meal-pairings/:mealId` joins `meal_pairings.suggested_meal_id` to `meals` and returns **full meal rows** — THA choosing food and putting it in front of a household immediately after they add a meal, wired live to `day-view-drawer.tsx`. It reached **no gate at all**.

It now resolves the household **server-side**, **fails closed** with `503 HOUSEHOLD_SAFETY_UNAVAILABLE` (an empty list would say *"there are no pairings"*, which is a different and false statement from *"we could not check"*), filters through `isMealSafeForHousehold`, and **never presents a filtered list as the whole answer** — the response carries `withheldForSafety` and the client renders the note.

### 2.3 The route that was dead, live, and lying (Objective 5)

`GET /api/meals/recommended` reached no gate. Worse than ungated: when a household had no `user_preferences` row it returned **every meal stamped `compatible: true, score: 100, warnings: []`** — an explicit safety claim about people with real allergies that nothing had checked. Its only occurrence anywhere in the repository was its own registration: **zero consumers**. Dead, but authenticated and reachable.

**Deleted rather than gated**, and the reason is the second win: `recommendation-service.ts` (deleted with it) carried its own `DIET_EXCLUDED_KEYWORDS` table naming **15 keywords for "vegetarian"**, sitting behind the canonical restriction library's thirteen properly-resolved restrictions. That is NUTPLAN1 finding **D4**, half-closed by a deletion. Gating the route would have preserved a third diet engine THA does not need.

### 2.4 Plant Diversity convergence (Objective 4)

NUTPLAN1 fixed two client-side derivations and left three. All three are now converged onto `plantDiversityGroup` — the owner whose own docstring says *"THIS IS THE KEY A PLANT COUNT MUST DEDUPE ON."*

| Site | Was | Now |
|---|---|---|
| `nutrition-centre-assembler.ts:150` | Filtered a list of **canonical slugs** with `isPlantIngredient` and took `.length` | Dedups by diversity group |
| `meal-food-intelligence.ts:52,152` | A hardcoded `PLANT_CATEGORIES` set of six strings, incremented **per slug** | The canonical owner, deduped by group |
| `routes.ts` ×2 | The parse→singularize→group chain written out **verbatim twice** | Both call `plantGroupsForIngredientLines` |

The first was **live and wrong on screen**: kale and cavolo nero are two slugs in one group, and every tomato variety has its own slug, so the Nutrition Centre told households *"including N different plants"* where N was too high — the same over-count NUTPLAN1 fixed on the planner strip, surviving here under a third rule. It is published twice: in the Nutrition Centre and as a Companion milestone.

The second was **already flagged by THA's own verification register** as an open `one-owner` violation (`pd-rival-owner`). **Plant Diversity moved 🟡 → 🟢 and the platform gained a healthy domain (6 → 7).**

`plantGroupsForIngredientLines` was added to the canonical classifier rather than to a caller, because **the parse step is part of the rule**: NUTPLAN1 §7.2 measured that asking the classifier about the raw line `400g tinned tomatoes` returns "not a plant", while parsing first resolves it to `tomato`. A counter that skips the parse under-counts.

> **A divergence found and deliberately not smoothed over.** `mealPlantGroups` (`planner-explanation-context.ts:162`) asks about **raw** lines and therefore answers a slightly different question from the new helper. The two are **not interchangeable**. Converging them would change plant counts inside Smart Suggest's scoring and the explainability service — a behaviour change in a recommendation path, which this mission's Scope Lock forbids. It is recorded in §10 instead.

### 2.5 Dead capability retired (Objective 5)

| Retired | Evidence |
|---|---|
| `server/lib/pantry-intelligence-assembler.ts` (328 lines) | **Zero callers, including tests** — its own export name appeared exactly once, at its definition. It also carried **6 TypeScript errors**, so nothing had ever compiled against it. The route bearing its name (`/api/pantry/intelligence`) is served by the WX4/WX5 assemblers instead |
| `assertMealCompliantForPlanner` | **Zero callers.** All fifteen real call sites use the underlying trio directly and skip the wrapper built for them |
| A comment citing the deleted assembler | Corrected in `opportunity-engine.ts` |
| The phantom route comment | `food-report-evidence.ts:25` claimed *"The client reads it via GET /api/foods/:slug/report."* **That route has never existed** — the string appeared exactly once in the repository, in that comment |

Each was deleted rather than left, because the third state costs most: dead code reads as the sanctioned entry point while protecting nothing.

### 2.6 Duplicate nutrition logic removed (Objectives 3, 6)

**D2 — the uplift phrasing rule: five copies → one.** The `swap → "Swap in X" / boost → "Add more X" / else → "Add X"` ternary appeared **verbatim** in two route handlers, two assemblers and a page component. The copies spanned **both planes** — four rendered server-side, one in the browser — so the same suggestion could have been worded differently in the Nutrition Centre and on the food page with no test able to see it. One owner: `shared/nutrition/uplift-phrasing.ts`, in `shared/` because one of the five callers was the client.

> **A correction to NUTPLAN1.** Its D2 entry cites a sixth, divergent copy at `server/intelligence/opportunity-engine.ts:508`. **That file does not exist.** D2 is five sites, not six.

---

## 3. Architecture Compliance

| Item | Answer |
|---|---|
| Architecture Bootstrap read | ✅ `docs/architecture/README.md` before any change |
| Extends existing architecture? | ✅ Every change connects a surface to an owner that already existed, or deletes one that had none. **No new owner, engine, table, route, or capability** |
| One owner per fact (P2)? | ✅ **Strengthened four times** — the weekly plant count 4 rules → 1; "is this a plant" 2 owners → 1; the uplift phrasing 5 → 1; diet-exclusion keyword tables 2 → 1 |
| Retire on introduction (P8)? | ✅ Every convergence **deletes** the rival: `PLANT_CATEGORIES`, `recommendation-service.ts`, `pantry-intelligence-assembler.ts`, `assertMealCompliantForPlanner`, five phrasing copies, two now-unused imports |
| No permanent sync bridge (P7)? | ✅ None introduced |
| Non-fabrication (P6)? | ✅ The pass message was corrected to stop overstating coverage; 43 gaps are **published, not hidden**; the phantom-route comment is corrected rather than left |
| Safety gate reached? | ✅ §2.2, and the coverage assertion is now mechanical rather than remembered |
| Schema / migration / seed? | ✅ **None** |
| Household Time (HT7)? | ✅ Untouched. No change reads a clock, a date, or a week anchor |

## 4. AI Architecture Compliance

| Item | Answer |
|---|---|
| New capability registered? | ✅ N/A — **no capability added** (Scope Lock) |
| Reaches the model only via INT17? | ✅ Untouched; no change is in a model path |
| No prompt-templated facts? | ✅ **No prompt altered.** The four AI adaptation paths and their `validateAdaptationSafety` assertions are byte-unchanged |
| No second assistant / recommendation engine? | ✅ One was **removed** (`recommendation-service.ts`); none added |
| Honest gaps over fabricated knowledge? | ✅ The 43 recorded gaps and the corrected pass message are the instances |

## 5. Definition of Done

| Objective | State | Evidence |
|---|---|---|
| Discover every remaining nutrition-producing route | ✅ | Mechanical discovery over all registration styles; 317 registrations, 75 food surfaces |
| Every route reaches the canonical gate | ⚠️ **Partial, and measured** | 9 gated (one newly), 26 exempt with reasons, **43 recorded gaps** — see §10. Previously *unknown*, now *enumerated and ratcheted* |
| Converge remaining duplicate nutrition ownership | ✅ | §2.4, §2.6 — four facts converged to one owner each |
| Complete Plant Diversity convergence | ✅ | All 3 remaining derivations converged; `pd-rival-owner` closed; domain 🟡 → 🟢 |
| Retire or connect dead nutrition capability | ✅ | §2.3, §2.5 — four retirements, two comment corrections |
| Remove remaining duplicate nutrition logic | ✅ | D2 5 → 1; D4 half-closed by deletion |
| Verify end-to-end nutrition ownership | ✅ | §7 |

**Honest reading of the second row:** the mission asked that *every* route reach the gate. This workstream did not gate 43 routes, and says so rather than claiming otherwise. What changed is that they moved from **invisible** to **enumerated, reasoned, and ratcheted** — and the mechanism that hid them is gone. Gating them is engineering with real product consequences (several surface foods rather than meals, for which no food-level verdict exists) and belongs in sessions that can take each on its merits.

## 6. Data Impact

**None.** No schema change, no migration, no seed change, no row written or deleted.

Two figures a household sees will **change value** — both because they were wrong:

| Figure | Direction | Why |
|---|---|---|
| Nutrition Centre *"including N different plants"* | **Decreases** | Was counting canonical slugs; now counts diversity groups |
| Meal *"Contains N plant foods"* | **Decreases** | Was counting slugs against a rival category set; now counts groups |

Both move **towards the truth**, and towards the number the planner strip and Plant Diversity Report already showed. No household's stored data changes.

## 7. Verification

Baseline captured from the rollback snapshot in a separate worktree, so a regression would be attributable rather than argued.

| Gate | Baseline | After | Verdict |
|---|---|---|---|
| `tsc --noEmit` | **113** comparable¹ | **107** | **0 introduced · 6 removed** (the dead assembler that never compiled). Every other error-bearing file is identical |
| `npm run build` (vite) | 🟢 | 🟢 | Unchanged |
| `test:prod6-safety-gate-convergence` | 78 | **158** | +80 from real discovery |
| `test:nutplan1` | 23 | **25** | +2; one assertion re-pointed (§9) |
| `test:nutplan2` *(new)* | — | **35 / 0** | Includes the planted-route proof |
| `verify:publication` | 🟡 Plant Diversity | **🟢 Plant Diversity** | Healthy domains 6 → 7; platform reds **unchanged at 4** |
| `adoption:check` | 83 / 0 | **83 / 0** | Unchanged |

¹ The raw snapshot reports 120; **7** of those are artefacts of untracked KNOW2 files absent from a `git stash create` snapshot, not real errors. 113 is the comparable figure.

**Full regression — all green, 0 failed:**
`test:variety-surfacing` 36 · `test:nut-verify1` 55 · `test:nut-verify2` 81 · `test:household-nutrition` 54 · `test:canonical-food` 46 · `test:plan1-planner-intelligence` 58 · `test:planner-compliance` 25 · `test:knowledge-evidence-gate` 116 · `test:know5-evidence-contract` 112 · `test:know2-human-evidence-publication` 72 · `test:knowledge-food-ownership` 28 · `test:food-report-evidence` 31 · `test:restriction-safety` 75 · `test:prod3-companion-restriction-safety` 36 · `test:surf1b-dietary-restriction-safety-path` 54.

### 7.1 The assertion that makes this "by construction"

`test-nutplan2` §1.3 **plants** a food-producing route that reaches no gate, and requires the discovery to find it. Every previous safety-coverage claim in THA was structural prose about a hand-written list; this one is executable. If the harness ever stops seeing new routes, that assertion fails.

## 8. Trust Check

| Question | Answer |
|---|---|
| Was any safety gate weakened? | **No.** No gate function was edited. `validateAdaptationSafety`, `isMealSafeForHousehold` and the four AI paths are byte-unchanged |
| Did any route lose a gate? | **No.** One gained one; one ungated route was deleted |
| Can the client supply a safety decision? | Unchanged where it could not; `/api/pantry/alternatives` still can and is **recorded as a gap**, not quietly exempted |
| Does a green suite now overstate coverage? | **No** — that was the old failure, and the pass message was corrected in the same change |
| Could a future route skip the gate silently? | **No.** It fails the suite unless someone classifies it, in a reviewed edit |
| Was any household-facing number fabricated? | **No.** Two decrease, both towards the truth |

## 9. Scope Lock

**Held.** No new nutrition capability. No new recommendation engine — one was **deleted**. No new owner: `plantGroupsForIngredientLines` and `upliftSuggestionText` are existing duplicated rules moved into the module that already owned them.

**Two existing tests were changed, both disclosed:**

- `test-nutplan1` asserted the week route contained `plantDiversityGroup` **inline**. The convergence moved that symbol into the shared helper. It now checks **both** ends — both routes reach the canonical helper, *and* the helper dedups by group — which is stronger than the inline check, since that could only ever see one of the two copies.
- `test-prod6` §1 is rebuilt, as described. **Nothing was removed from §2–§7**; all the behavioural safety assertions are untouched.

**Deliberately not done:** gating the 43 recorded gaps (§10); converging `mealPlantGroups` (§2.4 — a scoring-path behaviour change); retiring `shared/nutrition/household-nutrition.ts` (§10 R4); the stale HT7 figures (NUTPLAN1 §9.1 — another domain's governing architecture); KNOW1 F1 (needs a named human reviewer).

## 10. Remaining Risks

| # | Risk | Severity | Status |
|---|---|---|---|
| **R1** | **43 food-surface routes reach no dietary gate.** The sharpest: `/api/pantry/alternatives`, whose only dietary input is a **client-supplied `diet` query param** — the exact "client is the source of a safety decision" shape PROD5 found on `/api/meals/:id/adapt`; `/api/plan-templates/:id/apply`, which **writes a whole week of meals** into a planner ungated; and `/api/search-recipes`, whose diet source **fails open** | 🔴 High | **Enumerated and ratcheted.** Was invisible; now every one is named with its consequence and the list cannot grow silently |
| **R2** | Four of those surface **foods, not meals**, and `isMealSafeForHousehold` takes a meal shape. Gating them needs a food-level verdict that does not exist | 🟠 Med | Recorded. Creating one is new capability — forbidden by Scope Lock |
| **R3** | `mealPlantGroups` and `plantGroupsForIngredientLines` answer slightly different questions (raw vs parsed lines), so Smart Suggest's internal plant counts differ from the displayed ones | 🟠 Med | Recorded, not smoothed over (§2.4) |
| **R4** | `shared/nutrition/household-nutrition.ts` — **561 lines, 0 non-test callers**; only the constant `WEEKLY_PLANT_TARGET` is live. Its named orchestrator does not exist | 🟠 Med | **Neither retired nor connected, on purpose.** It is the scoring core HNP1's M2 roadmap plans to wire into the Opportunity pipeline. Deleting it inside a convergence session would destroy planned work; wiring it is new capability. It needs an owner's decision, and saying so is more honest than picking one |
| **R5** | The discovery net is a **path vocabulary**. A food-producing route whose path contains none of those words is still invisible | 🟡 Low | Net is deliberately wide; a structural signal (does the handler return meal rows?) would be stronger and is follow-on work |
| **R6** | `computeRestrictionSafety` runs **client-side only** and its `unknown` differs from the server's `unsafe` (D7) | 🟠 Med | Carried forward from NUTPLAN1, untouched |
| **R7** | 107 pre-existing `tsc` errors remain, none in touched files | 🟡 Low | Four sessions old; unrelated |

## 11. Manual Verification Steps

1. `npm run test:prod6-safety-gate-convergence` — expect **158 passed**, and read the closing two lines: 9 gated · 26 exempt · 43 recorded gaps.
2. `npm run test:nutplan2` — expect **35 passed**, including §1.3's planted-route proof.
3. **Prove the inversion yourself:** add `app.get("/api/meals/anything-new", …)` to `server/routes.ts` with no gate, re-run step 1, and confirm it **fails** with your route named. Remove it.
4. Sign in, open a food page with an uplift suggestion, and confirm the "Simply Better" wording is unchanged (`Swap in …` / `Add more …` / `Add …`).
5. Open the Nutrition Centre and note *"including N different plants"*. It should be **lower than before** if the household has ever planned two foods from one diversity group (kale + cavolo nero; two tomato varieties), and equal otherwise.
6. Add a meal in the planner day drawer to trigger the pairings panel. For a household with a hard restriction, confirm the panel shows *"We left out N suggestion(s)…"* rather than silently shortening.
7. Confirm `GET /api/meals/recommended` now returns 404.
8. `npm run verify:publication` — Plant Diversity should read 🟢.

## 12. User Acceptance Evidence

Automated and reproducible: **158 + 35 assertions** across the two suites directly covering this work, plus **15 regression suites, 0 failures**, and a clean production build. §7.1's planted-route test is the acceptance evidence for the central claim — that coverage is now by construction rather than by memory.

**Not obtained:** human confirmation of the two decreased plant figures against a real household's planner. They are arithmetic corrections with a proven rule, but the *visible* change is a number going down, and an owner should see it on a real account before it is considered accepted.

## 13. Recommended follow-on work

| Session | Scope | Value |
|---|---|---|
| **NUTPLAN3 — Close the recorded gaps** | Work `KNOWN_UNGATED` down from 43. Start with `/api/pantry/alternatives` (client-supplied diet), `/api/plan-templates/:id/apply` (writes a week of meals), `/api/search-recipes` (fails open) | 🔴 High |
| **NUTPLAN3b — A food-level safety verdict** | R2 — the four pantry surfaces need one before they can be gated. New capability, so it needs its own mission | 🟠 Med |
| **NUTPLAN4 — `household-nutrition.ts` decision** | R4 — retire or wire. An owner's call, not an engineering one |
| **Structural discovery** | R5 — classify by what a handler *returns* rather than what its path is *called* | 🟠 Med |
| **D7** | Bring the analyser's client-side restriction path under a server verdict | 🟠 Med |
| **TIME4** | NUTPLAN1 §9.1 — the stale "192 of 195 households" figure, measured | 🟡 Med |

---

## 14. Files changed

| File | Change |
|---|---|
| `server/tests/test-prod6-safety-gate-convergence.ts` | §1 rebuilt as mechanical discovery + classification; honest pass message (78 → 158) |
| `server/routes.ts` | `GET /api/meals/recommended` **retired**; `/api/meal-pairings/:mealId` **gated**; both plant loops converged; uplift phrasing ×2 converged |
| `server/lib/recommendation-service.ts` | **Deleted** — dead, ungated, and a third diet vocabulary |
| `server/lib/pantry-intelligence-assembler.ts` | **Deleted** — 328 lines, 0 callers, 6 tsc errors |
| `server/lib/planner-compliance.ts` | `assertMealCompliantForPlanner` retired (0 callers) |
| `server/lib/nutrition-centre-assembler.ts` | Plant count converged to diversity groups; uplift phrasing converged; unused import retired |
| `server/services/meal-food-intelligence.ts` | Rival `PLANT_CATEGORIES` retired; counts diversity groups |
| `server/lib/connected-food-intelligence-assembler.ts` | Uplift phrasing converged |
| `server/lib/food-report-evidence.ts` | Phantom-route comment corrected |
| `server/intelligence/food-intelligence/opportunity-engine.ts` | Comment citing the deleted assembler corrected |
| `shared/canonical/plant-classifier.ts` | **+** `plantGroupsForIngredientLines` — the duplicated loop, moved to its owner |
| `shared/nutrition/uplift-phrasing.ts` | **New** — the one owner of the uplift wording (D2) |
| `client/src/pages/food-detail-page.tsx` | Uplift phrasing converged |
| `client/src/components/day-view-drawer.tsx` | Reads the gated pairings shape; renders the withheld note |
| `server/tests/test-nutplan2-nutrition-platform-convergence.ts` | **New** — 35 assertions |
| `server/tests/test-nutplan1-household-nutrition-intelligence.ts` | One assertion re-pointed and strengthened (§9) |
| `package.json` | Registers `test:nutplan2` |

**No schema · no migration · no seed · no row written · no capability added · no gate weakened.**

## 15. Rollback

```
rollback/NUTPLAN2-nutrition-platform-convergence-20260719  →  81e50625   (worktree snapshot: all 21 tracked modifications)
rollback/NUTPLAN2-head-20260719                           →  772eb6ed   (committed HEAD)
```

`git reset --hard rollback/NUTPLAN2-nutrition-platform-convergence-20260719` restores the tree. Two files were **deleted** via `git rm`, so they return with it.

> **Caveat, stated because it matters.** This session began with **two prior workstreams uncommitted** (KNOW2 and NUTPLAN1). The snapshot captures every **tracked** modification; `git stash create` does **not** capture untracked files, so the 8 untracked deliverables are not in it — but `git reset --hard` does not delete untracked files, so they survive a rollback regardless. No schema, seed, or migration was touched, so rollback is a pure code revert with no data consequence.
