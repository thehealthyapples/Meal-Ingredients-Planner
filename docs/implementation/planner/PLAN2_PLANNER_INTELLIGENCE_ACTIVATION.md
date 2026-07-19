# PLAN2 — Planner Intelligence Activation — Implementation

**Status:** Implemented
**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback/PLAN2-planner-intelligence-activation-20260719` → `f7b0fa0605b298ef53f0f0957095dec905938ee7`
**Tests:** `npm run test:plan2-planner-intelligence-activation` (22 assertions)
**Depends on:** PLAN1 (the planner explanation layer) · HNP2 (the `nutrition` opportunity domain) · PROD6 (the never-silently-shorten rule) · FI4/OD1 (the Opportunity Platform)

> ## ⚠️ NAMING — THE `PLAN2` ID IS HELD BY ANOTHER DOCUMENT
>
> [`PLAN2_INTELLIGENT_PLANNER_EVOLUTION.md`](./PLAN2_INTELLIGENT_PLANNER_EVOLUTION.md)
> (2026-07-12) already owns `PLAN2`. That document itself argues that an EWO ID is what
> makes a document findable and orderable (`REPOSITORY_CONVENTIONS.md` §3) — it was
> renamed PLAN1→PLAN2 for exactly this reason.
>
> This file was created at the path the mission specified. **The collision was raised with
> the owner before implementation and is unresolved**; `PLAN3` was recommended. Recorded
> here rather than silently resolved either way — see §9 G1.
>
> **The two are unrelated in substance.** That workstream changed *which meal the planner
> chooses*. This one changes *what the planner shows*, and alters no selection.

---

## 0. MANDATE

Surface the Food Intelligence, Household Nutrition and Opportunity Platform that THA
**already computes** throughout the planner; explain planner decisions; remove duplicate
planner intelligence.

Explicitly **not** in scope, and deliberately not done: another planner, another
intelligence engine, or any change to which meal the planner chooses.

---

## 1. THE HONEST BASELINE

The planner was **not** short of intelligence. It was short of *readers*. Every capability
activated below already existed, already ran, and already shipped its result — to nothing.

| Intelligence | Computed | Reached the planner | Verified by |
|---|---|---|---|
| `MealExplanation.evidence[]` — the named owner behind every reason | ✅ since PLAN1 | ❌ **zero readers** | `grep '\.evidence'` over the review panel → no hits |
| `nutrition-balance-gap` — this week's missing food components | ✅ since HNP2 | ❌ nutrition page only | `AmbientIntelligence domains={["planner"]}` |
| Compliance withhold reason | ✅ | ❌ logged, then discarded | `routes.ts` → `console.log` + `{skipped, reason}` |
| Per-meal nutrients / variety on the page | ❌ | ❌ | 4 imports, each used exactly once (the import line) |

### 1.1 The defect behind three of the four

`reasons` is **derived** from `evidence` and capped at `MAX_REASONS = 6`; the trail itself
is uncapped and carries `source` — the owner each sentence was read from. PLAN1's central
claim is that *"each reason names the owner it was read from."* That is **true
server-side and was invisible to the household**. The citation never rendered, and any
reason ranked seventh or lower was composed and dropped on the floor.

This is the same shape as HHP2 and NTC-P2: **code-complete, tested, and dormant.** It is
the client-side instance of the failure P0 named as a standing blocker.

---

## 2. CHANGES MADE

**Created (2)**
```
server/tests/test-plan2-planner-intelligence-activation.ts    22 assertions
docs/implementation/planner/PLAN2_PLANNER_INTELLIGENCE_ACTIVATION.md
```

**Modified — production (4)**
```
client/src/components/SmartReviewPanelContent.tsx   renders PLAN1's evidence trail —
                                                    source + detail, uncapped
client/src/pages/weekly-planner-page.tsx            `nutrition` joins `planner` on the ONE
                                                    AmbientIntelligence mount;
                                                    4 dead imports removed
client/src/hooks/use-smart-suggest.ts               withheld counted apart from failed;
                                                    renders the SERVER's note verbatim
server/routes.ts                                    smart-apply gate returns a human
                                                    `withheldNote` beside the machine
                                                    `reason`
```

**Modified — config (1)**
```
package.json                                        test:plan2-* registered in `npm test`
```

**Notably NOT changed:** `meal-scoring-service.ts`, `smart-suggest-service.ts`,
`explainability-service.ts`, `household-meal-matcher.ts` — **no scoring, ranking or
selection logic was touched.** No schema change, no migration, no new route, no new engine.

---

## 3. THE FOUR ACTIVATIONS

### 3.1 PLAN1's evidence trail now reaches the household

`SmartReviewPanelContent` rendered `reasons` only. It now also renders the trail beneath
them: each entry's `source` (the owner) and `detail` (what was read).

**Nothing new is computed.** The server has sent this since PLAN1. The trail is
**additive** — `reasons` renders exactly as before — and **guarded**, because `evidence`
is optional by contract: sessions generated before PLAN1 carry reasons and no trail, and
must keep working.

### 3.2 The nutrition domain reaches the planner

HNP2 made the household's weekly balance gap an opportunity in the `nutrition` domain and
mounted it on the nutrition page. Its claim is about **this week's plan** — *"no whole
grains are planned"* — and the plan is on the planner. The household now reads the gap in
the room where they can act on it, not the room that reports on it afterwards.

**One mount, not two.** `AmbientIntelligence` takes a domain *list* and filters the same
shared bundle client-side, so this costs no extra request and no second attention budget.
A second component would have re-fetched and re-budgeted the same opportunities beside the
ones already there. Asserted (`§2`: exactly one mount).

### 3.3 A withheld meal is no longer reported as a failure

The smart-apply compliance gate withholds a meal that breaks the household's own dietary
rules, logs why, and returned `{ skipped: true, reason }`. The client counted that as
`failedCount`, so a deliberate safety decision reached the household as **"1 could not be
added."**

This is **PROD6's silent shortening** — the same defect `day-view-drawer.tsx:280` already
fixed for meal pairings, still live on this path. Now:

```
3 meals added to Week 3. 1 left out because it doesn't suit your household's dietary needs.
```

**The note is composed on the SERVER.** `ComplianceResult.reason` is documented
machine-readable (`"household-hard-restriction"`, `"diet:Vegan"`); showing it would have
been worse than the message it replaced. The client authors no prose about household data
— the same seam `withheldNote` already uses for pairings and ingredient suggestions. The
machine `reason` is kept beside it for callers that reason about it, and is asserted never
to reach the client.

**The note names no restriction and no member.** `household-nutrition-enrichment.ts`
already holds the discipline *"name the restriction, never the household member who holds
it."* A toast is a broadcast surface, so this names **neither**. Asserted.

### 3.4 Four dead imports removed

`computeMealVariety`, `EMPTY_VARIETY_SCORE`, `getMealNutrients` and `MealNutrientTags`
were imported into the planner page and used **nowhere** — each appeared exactly once, on
its own import line. The per-meal nutrient/variety render was wired as far as the import
and no further.

**Removed rather than completed.** `PlannerMealCard` already draws the variety dots and
`nutrition-variety-chips` the chips. Finishing the render here would have put a *second*
per-meal nutrition render on a page that already delegates it — creating the duplicate
ownership Objective 5 exists to remove. Verified at the moment of deletion that the live
owners still import what they use.

---

## 4. WHAT WAS FOUND AND DELIBERATELY NOT DONE

### 4.1 PLAN2 (Intelligent Planner Evolution) was implemented, then reverted

Investigating the orphaned `test-plan2-planner-evolution.ts` produced a finding that is
**not** what the standing record says.

P0 Food Intelligence Recovery lists it as *"half-landed… test imports exports that were
never written."* **That diagnosis is wrong.** The exports were written, verified, and then
silently reverted on 2026-07-13 — **1,579 lines across 7 files**:

```
git show de0062c9:server/lib/meal-scoring-service.ts
  :101  export const SCORE_WEIGHTS = {
  :125  export const INTELLIGENCE_SHARE = 0.3;
  :211  export function scoreIntelligence(...)
```

Those symbols exist today **only inside the orphaned test**. The work is **recoverable,
not lost** — `git show de0062c9:<path>` yields all seven files.

**This matters for triage.** Retiring the orphaned test — the obvious move — would discard
a real, tested implementation.

### 4.2 Three defects that document claims to have fixed are live

Verified by reading the current tree, not either document:

| Defect | Evidence today |
|---|---|
| Two owners of a candidate's score | `smart-suggest-service.ts:90` `COMPATIBILITY_RANKING_BONUS = 10`; `:915-918` `adjustedScore = score + compatBonus`, layered on `meal-scoring-service`'s score |
| Two disagreeing weight tables | `SCORE_WEIGHTS` = 22/13/13/13/13/8/5/**13** vs `WEIGHT_MAX` = 25/15/15/15/15/10/5/**absent** |
| Explanation branches dead by arithmetic | `explainability-service.ts:194` tests `bd.goalAlignment >= WEIGHT_MAX.goalAlignment` — that is `13 >= 15`, **never true**, so that explanation can never fire |

The third is a live user-visible defect and sits on this mission's Objective 3.

**None of the three was fixed here, and that is deliberate.** Converging those weight
tables **changes which meal the planner chooses** — the original workstream rated itself
🔴 RED for exactly that — and this mission's Scope Lock is *"only activate existing
intelligence within the planner."* Activation and altering meal selection are different
risks and deserve different gates. Escalated to the owner, recorded as **G2**, not
absorbed. Absorbing another workstream's unfinished change under an activation banner is
how the HHP2 record came to be written.

---

## 5. VALIDATION

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS — 88 before, 88 after. Zero new type errors.** |
| `npm run build` | **PASS — exit 0** (these are React changes; the build is the gate a server-side suite cannot be) |
| `npm run test:plan2-planner-intelligence-activation` | **PASS — 22 passed, 0 failed** |
| `npm run test:prod6-safety-gate-convergence` | **PASS — 158 passed, 0 failed** (a compliance path was touched) |
| `npm run test:planner-compliance` | **PASS — 25 passed, 0 failed** |
| `npm run test:plan1-planner-intelligence` | **PASS — 58 passed, 0 failed** (the layer being surfaced) |
| `npm run test:hnp2-nutrition-balance-opportunity` | **PASS — 43 passed, 0 failed** |
| `npm run test:mat1-registry-conformance` | **PASS — 25 passed, 0 failed** |
| `npm run test:restriction-safety` | **PASS — 75 passed, 0 failed** |
| Data impact | **NONE.** No migration, schema change, new table, column or route |

### 5.1 What the test suite can and cannot prove

**Most of this activation is client rendering, and a server-side suite cannot mount React.**
§1–§3 are **structural** assertions over source text: they prove a render site *exists*,
not that it paints. Every such assertion is labelled `[structural]` in its own output
rather than dressed up as execution.

Structural assertions are used **because the defects were themselves structural** — a
field on the wire with zero readers, and four imports never used. Absence of a reader is
precisely what a source-scan can prove, and is what regressed here. §4 executes real code,
and `npm run build` is the standing proof the components compile and mount.

**This is the same limitation HNP2 recorded as its G2, and it has the same cause:** no
authenticated click-through is possible in this environment. It is named, not glossed.

---

## 6. ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity — no identity introduced. Opportunities keep their existing ids.

☑ One owner per fact
  Explanation prose + evidence → explainability-service (PLAN1), unchanged.
  The nutrition balance gap → the Household Nutrition core via HNP2, unchanged.
  The withhold decision AND its human sentence → the server's compliance gate.
  The client renders all three and owns none of them.

☑ No duplicate entities — no entity, table, column or route added.

☑ No duplicate ownership — AND one removed
  Four dead imports that would have become a second per-meal nutrition render on a page
  that already delegates it are REMOVED rather than completed.

☑ No duplicate state — nothing cached, nothing mirrored. One shared opportunity bundle,
  filtered client-side; adding a domain adds no request and no second attention budget.

☑ Extends existing architecture
  `AmbientIntelligence` already takes a domain list. `withheldNote` already exists as the
  PROD6 seam. `evidence` already shipped. Every activation used a seam that existed.

☑ Progressive enrichment
  The evidence trail is guarded — a pre-PLAN1 session with no trail still renders its
  reasons. A household with no nutrition gap simply sees no nutrition card.

☑ Knowledge domain compliance — N/A. No knowledge domain, lifecycle or claim introduced.

☑ Honest gaps over fabricated information
  THE POINT OF THIS WORKSTREAM. A withheld meal is named as withheld rather than reported
  as an error; a reason now carries the owner it was read from rather than asserting
  unsourced; a capped reason list no longer silently drops its tail.

☑ No permanent synchronisation bridge — none.

☑ Evolution over replacement
  The `reasons` render is untouched and the trail is additive. Dead imports are removed,
  not completed into a rival render.
```

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — the nutrition card arrives through the same
    Decision Engine bundle the planner already consumed.
✓ Reuses existing business services — PLAN1's explainability service, HNP2's nutrition
    core, the planner compliance gate. All read, none re-implemented.
✓ Does not create another assistant — no second Companion, no second voice.
✓ Uses permission-aware access — every path is the existing authenticated one; no new
    route and no client-supplied household parameter.
✓ Produces honest gaps rather than fabricated knowledge — see the checklist above.
```

```
----------------------------------------
EXPERIENCE & UI GOVERNANCE COMPLIANCE
----------------------------------------
```
**Applicable, and satisfied with no new visual pattern.**

- ✓ **No new pattern** — the existing `AmbientIntelligence` surface and the existing "Why?"
  expander. Nothing added to retire (UI Principle 5).
- ✓ **The client authors no prose about household data** — the evidence trail is the
  server's strings; the withhold sentence is the server's sentence. The client composes
  only counts and connectives. Asserted.
- ✓ **Calm before capability** — nutrition enters *under* the existing attention budget on
  a mount that already existed. No new channel, badge or budget.
- ✓ **Progressive disclosure** — the trail renders only inside the already-opt-in "Why?"
  expander. A household that does not ask is not shown more than before.
- ✓ **Privacy at a broadcast surface** — the withhold names neither restriction nor member.

```
----------------------------------------
PRODUCT REGISTRY COMPLIANCE
----------------------------------------
```
**Assessed. Registry impact: MINOR.** No capability, route or notice category added. The
planner surface now displays the `nutrition` opportunity domain and an evidence trail —
a change to what an existing surface shows, not to what THA can do. Recorded as **G3**.

---

## 7. TRUST CHECK

| Claim | Substantiated by |
|---|---|
| Every reason now names its source | PLAN1's `evidence[]`, rendered verbatim — the client composes none of it |
| No reason is silently dropped | The uncapped trail renders beneath the capped `reasons` |
| A withheld meal is never called a failure | Counted separately; asserted that a compliance skip increments `withheld` |
| The household is never shown a machine string | `reason` asserted absent from the client; the human note is server-composed |
| No one's allergy is announced in a toast | The note names no restriction and no member — asserted by pattern |
| The planner got no louder | One existing mount gained a domain; no new request, budget or channel |
| No meal choice changed | No scoring, ranking or selection file was touched — see §2 |

---

## 8. ROLLBACK PLAN

**Rollback identifier: `rollback/PLAN2-planner-intelligence-activation-20260719` → `f7b0fa06`**

```bash
git checkout rollback/PLAN2-planner-intelligence-activation-20260719 -- .
```

A full snapshot of the working tree — tracked modifications **and** untracked files —
taken before any change, without touching HEAD, the index, or the working tree. This
matters: the branch carried 53 dirty entries including all of HNP2, so a tag at `HEAD`
alone would have protected none of the code this workstream builds on.

**Partial rollback:** each of the four activations is independent. Reverting any one file
in §2 disables exactly that activation and affects nothing else.

---

## 9. REMAINING GAPS

**G1 — The `PLAN2` ID is used twice.** See the banner above. Raised before implementation,
unresolved; `PLAN3` was recommended. *Owner: whoever rules on the ID.*

**G2 — The reverted PLAN2 implementation is unrestored, and three defects stay live.**
See §4. The work is recoverable at `de0062c9`. Restoring it changes meal selection and
needs its own gated workstream and its own risk rating. **The dead explanation branch
(`13 >= 15`) is the most user-visible of the three and would be fixed by that restore.**
*Owner: a gated PLAN-restore workstream.*

**G3 — Product Registry entry owed** for the planner surface's new content. Minor; no
capability changed. *Owner: the next Product Registry pass.*

**G4 — Client rendering is proven structurally, not visually.** See §5.1. `npm run build`
proves compilation; nothing here proves pixels. Unchanged from HNP2's G2 and blocked on
the same missing test credentials.

**G5 — Explanations still exist only for Smart-Suggest entries.** Every other way a meal
enters the planner — picker, drag/drop, scan review, templates, bulk assign, day view —
produces no explanation at all, because `SmartSuggestEntry.explanation` is the only
carrier. PLAN2 surfaced the trail that exists; it did not create trails where none are
composed. **This is the largest remaining planner-intelligence gap.**

**G6 — Four rival "why?" producers remain unconverged.** `explainability-service`,
`household-meal-matcher.buildExplanation`, `recipe-swap-engine.applyRecipeSwaps` and
`planner-read-handler.explainSelection` answer "why this meal?" in four vocabularies.
The Companion and the planner can give **different answers about the same entry**.
Converging them is architectural, not activation. *Recorded, not attempted.*

---

## 10. SCOPE LOCK — HELD

**In scope, and delivered:** surfacing PLAN1's evidence trail; surfacing HNP2's nutrition
domain in the planner; naming a withheld meal honestly; removing dead duplicate-render
imports; tests; this document.

**Explicitly NOT done, and deliberately so:**
- **No second planner** — no planner surface, route, store or state machine added.
- **No second intelligence engine** — every activation reads an existing owner.
- **No change to which meal the planner chooses** — no scoring, ranking, weighting or
  selection file touched.
- No restoration of the reverted PLAN2 implementation (G2) — it belongs behind its own gate.
- No convergence of the four rival explanation producers (G6).
- No new route, table, schema change or capability.
