# HNP2 — Household Nutrition Platform — Implementation

**Status:** Implemented
**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback/HNP2-snapshot-20260719` → `5518caeb10e83781474242cbf96dc474abfb03ac`
**Tests:** `npm run test:hnp2-nutrition-balance-opportunity` (43 assertions)
**Governing architecture:** `THA_DECISION_ENGINE_ARCHITECTURE.md` (DEC1) · `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (FI4) · `MAT1_PLATFORM_MATURITY_AND_TRUST.md` §3.3 (the retirement this workstream reverses in part)

---

## 0. MANDATE

Determine what in `shared/nutrition/household-nutrition.ts` is still valuable business
capability, separate it from orchestration, converge the capability into the canonical
Opportunity Platform, and retire what is no longer required.

Explicitly **not** in scope, and deliberately not done: another nutrition engine, another
scoring system, or a rebuild of the obsolete orchestration MAT1 retired.

---

## 1. THE HONEST BASELINE — WHAT WAS ACTUALLY THERE

Verified first-hand before any change, not taken from any document — because **three
prior documents about this exact module were wrong**, and each was believed.

| Artefact | State on 2026-07-19 |
|---|---|
| `shared/nutrition/household-nutrition.ts` | **Present. 561 lines. 0 non-test callers.** Only `WEEKLY_PLANT_TARGET` live, imported by 3 client files. |
| `server/lib/household-nutrition-assembler.ts` | **ABSENT** — retired by MAT1 |
| `client/src/components/HouseholdNutritionPanel.tsx` | **ABSENT** — retired by MAT1 |
| `GET /api/household-nutrition` | **ABSENT** — zero hits in `routes.ts` |
| The module's own opportunity limb | **DELETED** by MAT1 §3.3 |
| `OPPORTUNITY_SOURCES` | one producer (`food-intelligence`) |
| `nutrition` as an opportunity domain | registered in **none** of the four registries |

### 1.1 Why this workstream is the third attempt, and what that changes

The wiring absent here has been *claimed present* twice:

- **HNP1** (2026-07-12) wrote in the present tense that its opportunities "flow through
  the SAME `opportunity-delivery` framework". They flowed nowhere.
- **HHP2** (2026-07-12) recorded **"Complete"** while wired to nothing — absent from the
  capability registry, absent from `OPPORTUNITY_SOURCES`, its binding never called. Its
  proof was a test that **source-scanned for text that was not in the file**, called its
  handler **directly to bypass the registry it had never been added to**, and **was not in
  `npm test`**, so it never ran to disagree. It stood for five days, and `HHP3` deleted a
  live wire on the strength of it.
- **P0 Food Intelligence Recovery** (2026-07-17) retired the HHP2 activation path and
  ruled the idea legitimate but owed "its own approved workstream, with the reviewed
  enrolment this one skipped."

**This is why every assertion in HNP2's suite drives real code.** The only source-scans
are negative ones, asserting absence — the one thing execution cannot prove. P0's standing
blocker #2 (the server has no adoption register) means nothing structural prevents a
fourth repetition; this suite is the local substitute.

---

## 2. THE INVESTIGATION — CAPABILITY vs ORCHESTRATION

### 2.1 The finding the whole workstream turns on

MAT1 §3.3 retired a **three**-type opportunity limb, and recorded why:

> Two of its three types (`nutrition-planning-gap`, `nutrition-plant-diversity-gap`)
> duplicated live observations (`planner-empty-day`, `planner-meal-uplift`), so enrolling
> rather than retiring would have shipped visible duplicate advice on day one.

Two of three. **The third — `nutrition-balance-gap` — was never called a duplicate.**

Verified rather than inferred: `grep` for `wholeGrains|herbsSpices|oliveOil|
VARIETY_COMPONENT|varietyComponentsPresent` across `opportunity-engine.ts` returns
**nothing**. No live generator observes which of the plant classifier's five variety
components a week's plan lacks. *"Your week contains no whole grains"* is a claim only
this module is in a position to make.

Corroborating residue found in the file: the helper `joinOr` had **zero callers**, and its
single historical caller was the balance opportunity's `suggestedAction`. `AttentionLevel`
was imported and unused for the same reason. **The retirement had left exactly the shape of
the one thing it did not retire.**

### 2.2 The separation

| Kept — business capability | Retired / not rebuilt — orchestration |
|---|---|
| `computeHouseholdNutritionScore`, `scoreDimensions` — the four dimensions, weights, bands, confidence | `server/lib/household-nutrition-assembler.ts` (absent, stays absent) |
| The trust rules: `null` ≠ `0`, weights renormalised over present dimensions, `dimensionsCounted` | `client/src/components/HouseholdNutritionPanel.tsx` (absent, stays absent) |
| `varietyComponentsPresent`, `WEEKLY_PLANT_TARGET`, the component denominators | `GET /api/household-nutrition` (absent, stays absent) |
| The grammar contract — this module is the only author of prose about a household's own nutrition | The two duplicate opportunity types (stay retired) |
| `buildNutritionBalanceOpportunity` — **revived, alone** | `STRONG_ENOUGH = 70` — **not revived**, see §3.2 |

Three assertions in the suite prove the retired orchestration stays retired, so the Scope
Lock is enforced by the pipeline rather than by intention.

---

## 3. THE DESIGN

### 3.1 The whole of it, in one sentence

The Household Nutrition core became reachable by adding **one generator** to the opportunity
engine that already reads the planner week, **one domain**, and **four registry rows** — and
**zero** lines of scoring, ranking, budgeting, suppression, lifecycle or delivery code.

### 3.2 The number that was deliberately not revived

The retired limb suppressed this card unless the balance dimension scored below
`STRONG_ENOUGH = 70`. HNP2 does **not** revive that constant.

`test-household-nutrition.ts` §7 asserts that every number in the core is a **named
denominator THA already owned**, and it fired on the reinstated constant immediately. The
assertion was right: 70 is neither a denominator nor a figure owned anywhere else in the
platform — it was invented, and inherited unexamined.

Its only real effect was to stay silent when exactly **one** of five components was
missing — precisely a gap a household would want named. So the gate is now the honest one
(*is a component actually absent?*), and the noise question is answered where it is already
owned: `low` priority, the attention budget, muting, and dismissal. **The module does not
get to pre-empt those by inventing a number to go quiet behind.**

### 3.3 The architectural choice, and the alternative rejected

**Chosen — a fifth domain on the existing producer.** The balance generator lives in
`opportunity-engine.ts`, alongside the generators that already read this household's
planner week.

**Rejected — a new `household-nutrition` capability enrolled as a second producer in
`OPPORTUNITY_SOURCES`** (HHP2's shape, and what HNP1 §7 G1 anticipated). It was rejected on
evidence, not taste:

1. **It would have created a second reader of the planner week.** FI4 already resolves the
   week, its days, its entries and its meals. A second producer re-reading all four is the
   duplicate ownership this mission exists to remove.
2. **It fails the conformance gate with no clean fix.** `OPPORTUNITY_DOMAIN_LABELS` is
   asserted against `FOOD_OPPORTUNITY_DOMAINS` (`test-mat1-registry-conformance.ts:148`).
   A `nutrition` label whose domain is *not* a member is an **orphan label**, and the suite
   fails. With one producer those two sets coincided; a second producer would have forced
   the domain registry itself to be generalised — a change to a governing gate, in service
   of a capability that did not need one.
3. **It is more architecture, not less.** A read port, a handler, a binding, a registry
   descriptor and a producer entry, to deliver one opportunity per week.

The chosen route needed **no new capability, no new producer, no new read, and no change to
the conformance gate's logic** — only the deliberate widening of its domain count, which is
the governance act that assertion exists to force.

### 3.4 Where the facts come from, and what is honestly missing

The generator supplies the core with facts the orchestrator has **already read**. It does
**not** read `user_health_trends` (the Apple Rating owner) or the Nutrition Centre's
all-time diversity, so both are passed as `null` — that core's own contract for *"this
owner had nothing to say."* Those dimensions are then **excluded** from the score rather
than counted as zero, and `dimensionsCounted` records that it rests on **3 of 4**.

Reading them here would have meant a second reader of each, for figures the one emitted
opportunity does not use. `null` is the truthful answer, not a shortcut.

### 3.5 The contested count, named

`NUTPLAN2` §10 R3 recorded that two plant derivations exist and are **not** interchangeable:
`plantGroupsForIngredientLines` **parses** a line before classifying it;
`mealPlantGroups` asks about the **raw** line. A nutrition producer had to pick one and say
which.

**This one parses** — the same derivation behind the plant-diversity surfaces, so the card
cannot disagree with the ring the household is looking at while reading it. Recorded in the
engine's import comment, not only here.

### 3.6 The meals read, hoisted

The nutrition generator needs the **ingredients** of this week's planned meals; the
planner's own `getMeal` reference carries `{id, name}` only. Rather than open a second read
of the meals owner, the existing cookbook read was **hoisted** to the top of
`identifyOpportunities` and is now shared by both domains — the same move FI4 already made
for the pantry when a third domain needed it. **No new query is introduced.**

The hoist is gated on `mealsRead`: an *unreadable* cookbook and a cookbook whose recipes
record no ingredients are different claims, and only the second is a week that honestly
contains no components. Without the gate, a failed query would have rendered as *"your week
is missing all five components"* — an accusation manufactured from a broken read.

---

## 4. CHANGES MADE

**Created (2)**
```
server/tests/test-hnp2-nutrition-balance-opportunity.ts    43 assertions
docs/implementation/nutrition/HNP2_HOUSEHOLD_NUTRITION_PLATFORM.md
```

**Modified — production (6)**
```
shared/nutrition/household-nutrition.ts        `nutrition-balance-gap` revived ALONE;
                                               STRONG_ENOUGH deliberately not revived;
                                               header corrected — the MAT1 "no production
                                               caller" claim is now false
server/intelligence/food-intelligence/
  opportunity-engine.ts                        + `nutrition` domain (4→5), + the type,
                                               + `planner-week` subject entity,
                                               + the thin generator, meals read HOISTED
server/intelligence/opportunity-delivery/
  framework.ts                                 registry 1 — DOMAIN_SURFACE.nutrition
server/intelligence/conversation/
  notice-engine.ts                             registry 2 — `nutrition-opportunity`
                                               category + DOMAIN_TO_CATEGORY row
shared/attention/index.ts                      registry 3 — OPPORTUNITY_DOMAIN_LABELS
client/src/pages/plant-diversity-page.tsx      registry 4 — the AmbientIntelligence mount
```

**Modified — tests / config (2)**
```
server/tests/test-mat1-registry-conformance.ts  domain scope lock 4 → 5 (the governance act)
package.json                                    test:hnp2-* registered in `npm test`
```

**Notably NOT changed:** `OPPORTUNITY_SOURCES` (byte-untouched — no producer enrolled),
the capability registry, `CRITICAL_TYPES`, and every suppression / ranking / budgeting /
lifecycle path in OD1.

### 4.1 One registration HHP2 required that this workstream did not

HHP2's report lists a `notice-gateway.ts` step. **That file does not exist** — it was
NTC-P2, retired by the P0 recovery. Checked rather than copied.

---

## 5. VALIDATION

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS — 88 errors before, 88 after. Zero new type errors.** Baseline measured on a clean `git worktree` at the rollback ref, never by mutating the dirty tree |
| `npm run test:hnp2-nutrition-balance-opportunity` | **PASS — 43 passed, 0 failed** |
| `npm run test:mat1-registry-conformance` | **PASS — 25 passed, 0 failed**, including all four registries walked for `nutrition` |
| `npm run test:household-nutrition` | **PASS — 54 passed, 0 failed** |
| `npm test` (full chain) | *see §5.2* |
| Data impact | **NONE.** No migration, no schema change, no new table or column |

### 5.1 What verification actually found

**The domain-count scope lock fired at the type level.** Adding `nutrition` broke
`test-mat1-registry-conformance.ts` with `TS2367: types '5' and '4' have no overlap` before
a single test was run. It behaved exactly as designed, and widening it is recorded in the
assertion's own message rather than in a commit note.

**The §7 numeric-literal gate caught the invented threshold** — see §3.2. This is the
finding this workstream is most glad of: the constant arrived by inheritance, and a gate
written for a different reason refused it.

**A fixture in HNP2's own first draft was wrong, and the engine was right.** The suite
asserted a week of `{fruits: 2, vegetables: 4}` covered "3 of 5" components. It covers
**2 of 5** — those numbers are counts *within* a component, not a count *of* components.
The generator disagreed and won; the fixture is now named `TWO_OF_FIVE` with the reasoning
recorded, so the same misreading cannot recur silently.

### 5.2 Full-chain result

`npm test` — **94 suites green, then the chain halted** on `test:benchmark-conversation-
isolation` (24 passed, **2 failed**). Because the chain is a single `&&` sequence, the
suites after that point did not run; the eleven most relevant to this change were then run
individually and are **all green**, including:

```
test:prod6-safety-gate-convergence     158 passed, 0 failed
test:intelligence-notice-engine         65 passed, 0 failed
test:nutplan1 / test:nutplan2       25 / 35 passed, 0 failed
test:restriction-safety                 75 passed, 0 failed
test:food-report-evidence               31 passed, 0 failed
test:household-nutrition-enrichment     22 passed, 0 failed
test:variety-surfacing                  36 passed, 0 failed
test:canonical-food                     46 passed, 0 failed
test:alternatives-engine                all gates and trust checks passed
```

**The halting failure is NOT this workstream's, and is not absorbed.**
`test-benchmark-conversation-isolation.ts` fails on pronoun resolution across conversation
threads — nothing this change touches. Verified by running it **at the rollback ref in a
clean worktree**, where it fails **identically: 24 passed, 2 failed**.

HNP2's own suite ran *inside* the chain, before the halt, and passed there — not only when
invoked directly.

**A second pre-existing failure, outside the chain:** `test-cbk2-intelligent-cookbook.ts`
fails on `SyntaxError — no export generateRecipeExplanation`. It is unregistered in
`npm test` and is one of the seven orphaned tests P0 Food Intelligence Recovery listed as a
standing blocker (§REMAINING BLOCKERS 1). Also reproduced at the rollback ref. Belongs to CBK2.

**Neither is fixed here** — each belongs to another workstream, and absorbing them into this
report would repeat exactly the pattern that let HHP2 pass.

---

## 6. ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Opportunity id `nutrition-balance-gap:<plannerWeekRowId>`, re-keyed from the core's
  week-NUMBER key onto the week ROW id. Two households both in "week 3" can never
  collide — asserted, because the delivery store is keyed (userId, opportunityId) and a
  collision would silently suppress one household's card.

☑ One owner per fact
  The score, dimensions, weights, thresholds and every sentence → the Household Nutrition
  core, untouched. Which foods are plants and which component they fall in → the plant
  classifier. Delivery (rank/suppress/budget/lifecycle) → OD1. HNP2 owns NONE of them; it
  owns one thin projection, asserted by a comment-stripped source-scan anchored to the
  generator.

☑ No duplicate entities
  No new entity, table, column or route. `opportunity_deliveries` carries `domain =
  'nutrition'` rows through existing columns and the existing lifecycle.

☑ No duplicate ownership — AND one removed
  The two retired duplicate types stay retired, asserted by name. The meals read was
  HOISTED rather than duplicated, so the nutrition domain opened no second read of an
  owner FI4 already reads.

☑ No duplicate state
  Recomputed fresh per request, as every FI4 opportunity already is. Only delivery
  metadata persists, owned by OD1's store.

☑ Extends existing architecture
  A fifth domain on an existing producer, through the registration path
  `opportunity-engine.ts:190-208` already documents and MAT1 already enforces.

☑ Progressive enrichment
  Every read is independent and best-effort. No planner anchor → no card. Unreadable
  cookbook → no card, never a fabricated empty week. Two unread owners → two null
  dimensions, and the score says it rests on 3 of 4.

☑ Knowledge domain compliance
  N/A — no knowledge domain, lifecycle or claim row introduced. The opportunity carries
  `EvidenceCitation` (the internal owner trace, Rule E1), NOT `KnowledgeSourceRef`: it
  makes no health-benefit claim, and the human-signoff bar those require is currently
  unreachable platform-wide (0 signed-off citations). Naming a missing food component is
  not a health claim.

☑ Honest gaps over fabricated information
  No week → silence. No missing component → silence. A dimension with no data is null,
  never zero. Silence is first-class throughout.

☑ No permanent synchronisation bridge
  None. One path, one direction.

☑ Evolution over replacement
  `joinOr` and the `AttentionLevel` import — dead residue of the retired limb — are
  returned to a live owner rather than deleted and later re-added. The invented
  `STRONG_ENOUGH` threshold is retired on revival rather than carried forward.
```

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — delivery reaches this domain through the
    already-registered `food-intelligence` producer via `intelligencePlatform.handle()`.
✓ Uses the Capability Registry — no new capability registered, and none needed; the live
    capability count is UNCHANGED, so the 18-owner scope lock (HHP2 G3) is not touched.
✓ Reuses existing business services — the nutrition core, the plant classifier and the
    planner/meals read ports, all verbatim.
✓ Does not create another assistant — no second Companion, no second voice.
✓ Uses permission-aware access — the household is resolved from the caller's
    authenticated id by `resolveHouseholdSignal`; no client-supplied household parameter.
✓ Produces honest gaps rather than fabricated knowledge — see the checklist above.
```

```
----------------------------------------
EXPERIENCE & UI GOVERNANCE COMPLIANCE
----------------------------------------
```
**Applicable, and satisfied with one mount and no new pattern.**

- ✓ **No new visual pattern** — the existing `AmbientIntelligence` surface, the component
  every other domain already renders through. Nothing to retire (UI Principle 5).
- ✓ **The client authors no prose about household data** — every word is the nutrition
  core's, rendered verbatim. The engine composes no sentence, asserted by source-scan.
- ✓ **One primary action** — one `suggestedAction`, the core's own.
- ✓ **Calm before capability** — nutrition competes *within* the existing
  `MAX_NOTICES_PER_MOMENT` budget. It does not add a channel, a badge, or a budget. A
  household already holding two opportunities does not now get three.
- ✓ **Placed where its claim is true** — the mount sits with the weekly plant view, not
  the all-time Nutrition Centre, because the card is a claim about *this week*.

```
----------------------------------------
PRODUCT REGISTRY COMPLIANCE
----------------------------------------
```
**Assessed. Registry impact: YES.** THA now proactively names which food components a
household's week is missing, through the Companion and an ambient surface.

Unlike when HHP2 assessed this, `docs/product/` **exists**. Two entries are owed:
the `nutrition-opportunity` notice category, and the `nutrition` opportunity domain on the
Food Intelligence capability. **They are not written here** — recorded as **G1** below with
both named, per Rule KC12.

---

## 7. TRUST CHECK

| Claim | Substantiated by |
|---|---|
| Every nutrition card is true | The core computes nothing — it reads the plant classifier's own components against the classifier's own denominator |
| Every card cites its source | Rule E1; the opportunity reuses the **dimension's** citation verbatim rather than authoring a second one — asserted |
| No card is fabricated | No week → null, not zero. Unreadable cookbook → silence, not "all five missing" |
| No card can inflate itself to `critical` | ATTN1 A2 — `CRITICAL_TYPES` still holds exactly one type, asserted |
| No number was invented to make it fire | `STRONG_ENOUGH` refused and removed; §7 numeric-literal gate green |
| The household is never louder for this | Enters under the existing 2-notice budget; no new channel |
| A household that muted this never hears it | OD1's `mutedOpportunityTypes` applies with zero new code |
| It does not repeat advice they already have | The two duplicate types stay retired, asserted by name |
| It is actually wired | Every claim proven by calling production code; only negative claims use source-scan |

---

## 8. ROLLBACK PLAN

**Rollback identifier: `rollback/HNP2-snapshot-20260719` → `5518caeb`**

```bash
git checkout rollback/HNP2-snapshot-20260719 -- .   # full tree, tracked + untracked
```

A second tag, `rollback/HNP2-household-nutrition-opportunity-platform-20260719` →
`772eb6ed`, marks HEAD. It protects **committed state only**: the tree carried 45 dirty
entries of sibling NUTPLAN/KNOW2 work that HNP2 builds on, so the snapshot ref — not the
HEAD tag — is the one to restore from. **This distinction is the HHP2 lesson applied**: its
own report had to note the same thing after the fact.

**Partial rollback (silence the domain, keep everything else):** remove `"nutrition"` from
`FOOD_OPPORTUNITY_DOMAINS`, and the `identifyNutritionBalanceOpportunities(...)` call from
`identifyOpportunities`. Nutrition cards stop immediately; nothing else is affected. The
conformance suite will then fail on the domain count until it is returned to 4 — which is
the gate doing its job in the reverse direction.

---

## 9. REMAINING GAPS

**G1 — Two Product Registry entries are owed.** `docs/product/` exists, so unlike HHP2's
G1 this is a real, dischargeable work item, not a blocked one: the `nutrition-opportunity`
notice category and the `nutrition` opportunity domain. Not written here because the mission
scoped this workstream to the convergence. *Owner: the next Product Registry pass.*

**G2 — The client mount is asserted structurally, not rendered.** Registry 4 is proven to
**exist** by a source pattern, because a server-side suite cannot render React and this
environment has no test credentials for an authenticated click-through. The other three
registries are exercised by calling real code. **This is the weakest assertion in the suite
and is named rather than glossed** — it is the same class of gap (authored-but-unverified
at the surface) that P0's blocker #2 warns will recur.

**G3 — `/api/intelligence/food-opportunities` remains a recorded ungated food surface.**
It sits in `KNOWN_UNGATED` (`test-prod6-safety-gate-convergence.ts:271`), ratcheted so the
list may only shrink. HNP2 routes a nutrition card through it and **does not widen the
list** — but nor does it close the gap. The card names food *components* ("whole grains"),
proposes no specific dish and no ingredient, so it introduces no new restriction-safety
exposure; the underlying route gap is real and belongs to the Opportunity pipeline.

**G4 — `buildWeeklySummary` and `buildInsights` remain uncalled.** HNP2 converged the
opportunity path only. `WeeklyNutritionSummary` in particular overlaps the live Nutrition
Centre's `overview`, so it is a **candidate duplicate owner** — but it is covered by 54
passing assertions and retiring it is a separate judgement about a surface that does not
exist yet. **Not silently deleted, and not silently kept: recorded.** *Owner: whoever
decides whether a household nutrition summary surface returns.*

**G5 — the score is 3 of 4 dimensions by construction.** `processing-quality` and
all-time diversity are never read on this path, so the composed score is always
`dimensionsCounted: 3`. Correct and declared today, because only the balance dimension is
surfaced. It becomes a live question the moment anything renders the score itself.

---

## 10. SCOPE LOCK — HELD

**In scope, and delivered:** the investigation and the capability/orchestration split;
reviving the one non-duplicate opportunity; converging it into the canonical Opportunity
Platform; the four registrations; the tests; this document.

**Explicitly NOT done, and deliberately so:**
- No new nutrition engine, and no second scoring system — the core is the sole owner, called.
- **No rebuild of obsolete architecture** — the assembler, the panel and the route stay
  retired, asserted by three tests.
- No new capability, no new producer, no new route, no new table, no schema change.
- No revival of the two duplicate opportunity types MAT1 retired.
- No revival of the invented `STRONG_ENOUGH` threshold.
- No change to OD1's suppression, ranking, budgeting or lifecycle logic.
- No change to the `critical` allowlist.
