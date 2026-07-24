# MAT1 — Platform Maturity & Trust

**Session:** `MAT1_Platform_Maturity_And_Trust`
**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Rollback ID:** `rollback/MAT1-platform-maturity-and-trust-20260718` → commit `7bfad50c` (annotated)
**Dirty-tree snapshot:** `stash@{0}` — `MAT1_ROLLBACK: pre-implementation dirty-tree snapshot 2026-07-18` (commit `9f540261`, 249 files)
**Type:** Implementation. Closes the highest-value items from `docs/investigations/intelligence/AFI_VERIFY1_AMBIENT_FOOD_INTELLIGENCE_CONFORMANCE_AUDIT.md`.
**Mandate:** No new features. No new architecture. Strengthen the existing platform only.

---

## 1. Rollback

Created **before** any file was touched, per `ENGINEERING_SESSION_RECOVERY_PROTOCOL.md` §3.1.

| Artefact | Value |
|---|---|
| Annotated tag | `rollback/MAT1-platform-maturity-and-trust-20260718` → `7bfad50c` |
| Dirty-tree snapshot | `stash@{0}` → commit `9f540261` (249 modified files) |

The working tree was already dirty at session start (249 files of prior-session work). The snapshot was taken with `git stash create` + `git stash store` so the tree was **not** disturbed — the prior sessions' uncommitted work stayed exactly where it was and remains recoverable. Every diffstat in §3 is measured against `9f540261`, not against `HEAD`, so it reports MAT1's changes alone and never credits MAT1 with another session's work.

---

## 2. What was done, and why these four

AFI_VERIFY1 scored the platform **6.6 / 10** and named R2 and R3 as *"the recommended gate before wider rollout"*. This session closed both, plus R1, plus two source-of-truth defects found while doing so. It deliberately did **not** attempt R4 or R5 (see §7).

| ID | Audit finding | Severity | Status |
|---|---|---|---|
| **M1** | §4.2 — the engine clamps before the delivery layer can rank | 🟠 HIGH | **Closed** |
| **M2** | §4.3 — the client rendering layer has no tests of any kind | 🟠 HIGH | **Closed** for the registry that mattered |
| **M3** | §4.1 — an entire domain is built, produced, and dead | 🔴 CRITICAL | **Closed** (retired) |
| **M4** | §8 — production verification | — | **Done** (§5) |
| **M5** | *new, found during M3* — `WEEKLY_PLANT_TARGET` declared four times | — | **Closed** |

---

## 3. Files changed

Measured against the session-start snapshot `9f540261`.

```
 client/src/components/HouseholdNutritionPanel.tsx  | 325 --------- (deleted)
 server/lib/household-nutrition-assembler.ts        | 312 --------- (deleted)
 shared/nutrition/household-nutrition.ts            | 129 ---------
 server/tests/test-household-nutrition.ts           | 105 +++-----
 server/intelligence/opportunity-delivery/framework.ts |  47 ++-
 shared/attention/index.ts                          |  43 +++
 server/tests/test-time3-p8-t5-convergence.ts       |  40 ++-
 client/src/components/intelligence/FoodOpportunityCard.tsx | 23 +-
 server/intelligence/food-intelligence/opportunity-engine.ts | 14 +-
 package.json                                       |   8 +-
 client/src/components/PlantDiversityReport.tsx     |   5 +-
 client/src/components/nutrition-variety-chips.tsx  |   5 +-
 client/src/pages/home-experience-page.tsx          |   5 +-
 13 files changed, 204 insertions(+), 857 deletions(-)
```

Plus two additions:
- `server/tests/test-mat1-registry-conformance.ts` — the new suite (wired into `npm test`)
- `scripts/mat1-capture-maturity-screenshots.ts` + `docs/implementation/assets/mat1/` — the production evidence

**Net −653 lines.** This session removed considerably more than it added, which is the correct shape for a maturity workstream.

---

### 3.1 M1 — Household Learning integration (audit §4.2 / R2)

**The defect.** OD1 called each producer with no parameters, so the producer defaulted to `DELIVERY_DEFAULT_LIMIT` (10) and clamped there. OD1 then applied LEARN1's household-learning re-ranking and its own clamp *to the survivors*. Both use the shared DEC1 mechanics, so this was never duplicated logic — it was a **sequencing** error, and its cost was concrete: roughly two-thirds of a household's generated observations were discarded inside the producer, where no amount of Confirmed Understanding could ever reach them.

**The fix**, in `framework.ts`:

```ts
const PRODUCER_CANDIDATE_LIMIT = DELIVERY_MAX_LIMIT;   // the EXISTING canonical ceiling

const outcome = await fetchProducer(capabilityId, source.verb, context, {
  limit: PRODUCER_CANDIDATE_LIMIT,
});
```

`ProducerFetch` gained an optional fourth `parameters` argument; `defaultProducerFetch` forwards it through the ordinary registered intent path. Three properties were deliberately preserved:

- **No new constant.** `DELIVERY_MAX_LIMIT` already existed and the producer's own `prioritizeOpportunities` still bounds at it, so this can never request an unbounded set.
- **No delivery-budget change.** The single household-facing clamp still happens once, in `prioritiseAndGroup`, using the caller's own `requestedLimit`. What a household is *shown* is unchanged; what is *eligible to be ranked* is what widened. A test asserts this explicitly, so the fix cannot silently become a budget increase.
- **No new architecture.** The same shared DEC1 mechanics, composed in the right order.

**No performance cost.** The producer already generated every observation and clamped only at the very end (`identifyOpportunities` → `prioritizeOpportunities`). Asking for 30 rather than 10 does not cause one extra read, join or query — it changes only how many of the already-computed candidates survive the final slice. The total real logic change is four lines.

### 3.2 M2 — Client test coverage (audit §4.3 / R3)

`DOMAIN_LABEL` was declared inside `FoodOpportunityCard.tsx`, which the server test pipeline cannot import. It was therefore the **one unguarded registry of four**, and the last step before the household's eyes: a new domain could pass every existing suite and still reach a real kitchen labelled "Food".

- The registry moved to `shared/attention/index.ts` as `OPPORTUNITY_DOMAIN_LABELS`, beside `ATTENTION_LABELS` — the same class of presentation-edge reference vocabulary, now one source of truth for both sides of the wire. The component imports it; rendering behaviour is unchanged.
- `FoodOpportunityDomain` is now **derived** from a runtime `FOOD_OPPORTUNITY_DOMAINS` array rather than declared beside it. The engine's comment already listed the four registries a new domain must be added to — but a comment cannot fail a build. The closed set is now enumerable, so a suite can walk it.
- `server/tests/test-mat1-registry-conformance.ts` asserts every member is registered in all four places, **through each registry's public surface** (`selectSurface`, `noticeOpportunities`, the shared label map) rather than by reaching into internals.

**On the brief's "one pipeline" constraint.** The audit noted a client test runner "remains worth having". Adding vitest would have created a *second* pipeline, which the brief forbids. Client-layer coverage was instead delivered *inside the existing single `npm test` aggregate* by making the client's registry a genuine shared source of truth. That is the stronger outcome: it fixes the duplication and the coverage gap with one move.

### 3.3 M3 — Production trust: the dead nutrition limb (audit §4.1 / R1)

Independently re-verified before deletion. The limb was dead at **four** layers simultaneously, and the verification found the rot was broader than the audit knew:

| Artefact | Finding |
|---|---|
| `assembleHouseholdNutrition` | Zero importers. No route, no handler, no server caller. |
| `buildOpportunities` / `NUTRITION_OPPORTUNITY_TYPES` | Imported only by the assembler above — dead through dead. |
| `HouseholdNutritionPanel.tsx` | Zero importers repo-wide. No lazy import, no route table, no barrel. |
| `/api/household-nutrition` | **The route does not exist.** The panel's only data source. |
| `"nutrition"` as an `owningDomain` | Registered in **none** of the four registries. |

Retired: the panel, the assembler, and the opportunity limb in `shared/nutrition/household-nutrition.ts`. Two of its three types (`nutrition-planning-gap`, `nutrition-plant-diversity-gap`) duplicated live observations (`planner-empty-day`, `planner-meal-uplift`), so enrolling rather than retiring would have shipped visible duplicate advice on day one — the audit's §4.5 warning.

**One prior decision was overridden, deliberately.** The panel carried an uncommitted comment from the P0 recovery stating it was *"retained (not deleted) because removing it orphans that route, which is HNP1's to decide"*. That rationale is void: the route it names does not exist, so there is nothing left to orphan. The uncommitted comment is preserved in `stash@{0}` if the owner wishes to review the reasoning.

**One wired suite had to be amended.** `test-time3-p8-t5-convergence.ts` source-scanned the assembler to prove it never invents a planner week. Those assertions were **deleted rather than rehomed** — a source-text assertion proves a consumer behaves, so when the consumer is gone there is nothing left to prove, and retargeting them at a surviving file would have kept a green tick while testing something the section never claimed. The T5 decision is unweakened: it is still asserted over every consumer that exists, and two new assertions now prove the retired files *stay* retired, so the dead limb cannot return quietly.

### 3.4 M5 — `WEEKLY_PLANT_TARGET`: one owner (found during M3)

Repairing the orphaned `test-household-nutrition.ts` surfaced a real, pre-existing violation its own assertion had been written to catch and had never run to report: the platform's single most user-visible number was declared **four times** — once in the shared core and again, as a bare `= 30`, in three client surfaces. All three now import the canonical constant.

---

## 4. Verification

### 4.1 The full pipeline

`npm test` — the one aggregate, now including two suites it did not previously run.

**Result: exit code 0. 130 suites, 0 failures.** Notable suites:

| Suite | Result |
|---|---|
| **`test:mat1-registry-conformance`** (new) | **22 passed, 0 failed** |
| **`test:household-nutrition`** (repaired + newly wired) | **54 passed, 0 failed** |
| DEC1 Decision Engine | 49 / 0 |
| LEARN1 Household Learning | 72 / 0 |
| COACH1 Proactive Coaching | 71 / 0 |
| ATTN1 Attention Platform | 29 / 0 |
| OD1 Opportunity Delivery | 60 / 0 |
| FI4 Food Opportunity Engine | 99 / 0 |
| Notice Engine | 65 / 0 |
| SHOP1 Intelligent Shopping | 34 / 0 |
| CONV1 P8 / T5 convergence (amended) | 60 / 0 |

### 4.2 The new tests were negative-controlled

A passing test proves nothing until it has been shown to fail. Both M1 and M2 fixes were reverted in place and the suite re-run:

```
✗ cookbook: registered in OPPORTUNITY_DOMAIN_LABELS — undefined
✗ OD1 requests the full candidate set (30) from each producer — undefined
   20 passed, 2 failed
```

Both assertions bite. The files were then restored and re-verified at 22 / 0.

### 4.3 Typecheck

`npx tsc --noEmit` — **252 errors, all pre-existing.** AFI_VERIFY1 §6 recorded 258 at the rollback commit, so the count fell by 6. **Zero** errors in any file MAT1 touched, confirmed by explicit filename filter.

### 4.4 Production verification — the M1 fix on real household rows

The demo household created by `/api/demo/start` produces only 5 planner observations, which never reach the clamp — so it cannot exercise M1. The fix was therefore measured directly against **real seeded households** through the real engine, which is how AFI_VERIFY1 gathered its own evidence:

| Household | Before (producer asked for 10) | After (asked for 30) | Newly eligible for LEARN1 |
|---|---|---|---|
| user 57 | 10 candidates — pantry 10 | 30 — pantry 30 | **+20** |
| user 183 | 10 — planner 2, pantry 8 | 30 — planner 2, pantry 28 | **+20** |
| user 65 | 10 — shopping 6, pantry 4 | 30 — shopping 6, pantry 24 | **+20** |

This reproduces the audit's measurement exactly: 20 `pantry-item-unused-in-plan` observations per household were being discarded inside the producer. They are now eligible for the household's own Confirmed Understanding to re-rank. Sample of what was previously unreachable:

> *"Cheese is in your pantry but hasn't appeared in any of your planned meals yet."*
> *"Frozen spinach is in your pantry but hasn't appeared in any of your planned meals yet."*

### 4.5 Screenshots

`scripts/mat1-capture-maturity-screenshots.ts` (following the existing AFI3_5 capture pattern) — **7/7 surfaces captured** against a live dev server, into `docs/implementation/assets/mat1/` with a `manifest.json` recording what each shot actually showed.

| Shot | What it evidences |
|---|---|
| `planner-ambient.png` | Cards render with the **"PLANNER"** eyebrow — the relocated shared label registry rendering correctly end-to-end. Also shows the converged `16/30` plant counter. |
| `home-ambient-aggregate.png` | Aggregate surface; Companion card voicing the same OD1 bundle. |
| `shopping-ambient.png` | Five `shopping-item-already-in-pantry` cards under a **"SHOPPING LIST"** eyebrow — a second domain rendering correctly through the relocated registry. |
| `cookbook-ambient.png`, `pantry-ambient.png` | Recorded honestly as **absent** for this household — the surface renders `null` rather than a fabricated all-clear. See the note below. |
| `plant-diversity.png` | The surface whose `WEEKLY_PLANT_TARGET` M5 converged to one owner. |
| `home-companion-notices.png` | The notice channel. |

**A contradiction in the evidence, chased down and fixed rather than explained away.** An earlier run of this script wrote a manifest reading *"5 delivered, planner only"* directly beside a PNG showing five populated **Shopping** cards. The manifest and its own screenshots disagreed.

The cause is not the platform — it is the harness. This demo household seeds planner first and shopping in a **second wave**, with a gap between them long enough that a "has the bundle stopped growing?" poll mistakes the plateau for the end of seeding. The manifest was a snapshot at ~40s; the screenshots span ~40–90s. My first two attempts to fix it by tuning the settle heuristic did not work, because there is no threshold that reliably distinguishes a plateau from an ending.

The fix was to stop trying. The script now re-reads the bundle **after** the captures and records **both ends**, so the manifest states the drift instead of hiding it:

```
--- delivered bundle: 5 opportunities ---     (at settle)
by domain   : {"planner":5}
--- bundle AFTER captures: 10 opportunities ---
by domain   : {"planner":5,"shopping":5}
⚠ seeding continued during capture (5 → 10); the PNGs show the LATER state
```

This is recorded because a maturity-and-trust report whose own evidence quietly contradicts itself would be the exact failure this session was chartered to remove. **The label check was re-run against the final bundle too — every delivered domain is labelled.**

The **Pantry** and **Cookbook** surfaces are absent in the captures and remain absent in the final bundle: this household produced no pantry or cookbook observation, and `AmbientIntelligence` rendered `null` rather than a fabricated all-clear — the honest-gap contract behaving correctly. I did **not** establish *why* those two generators did not fire for this particular demo household; that is a property of the demo seed, not of anything MAT1 changed, and it is not claimed here as verified. The M1 fix is verified against real households in §4.4 instead, which is the stronger evidence anyway.

Three further live probes are recorded in the manifest:
- **Domain labels:** every delivered domain is labelled — no card fell through to the generic "Food".
- **Retired route:** `/api/household-nutrition` is indistinguishable from a control unmatched path (both `200 text/html`, the Vite dev catch-all). Status code alone would have been a false signal here; content-type is the honest test, and both probes are recorded so a reader can check the inference rather than trust it.
- **Companion notices:** delivered observations survive the notice channel, not only the card channel.

---

## 5. A correction to the audit

**AFI_VERIFY1 R2's suggested guard test must not be written as specified.** It proposes *"a test asserting a low-priority opportunity can be promoted above a medium-priority one by Confirmed Understanding."*

That asserts the opposite of a load-bearing safety invariant. `orderByAttention` (`shared/attention/decision.ts:87`) makes attention the **first** sort key and learning a tie-breaker beneath it — deliberately, so that *"a confirmed dislike re-orders advice within its tier; it never buries urgent advice beneath trivia"*. Making R2's literal test pass would require letting a household's preference outrank a safety signal.

The audit's underlying concern was **eligibility** — that clamped-away candidates could never be re-ranked at all — and that is what §2 of the new suite asserts. §3 pins the invariant R2's wording would have broken, in both directions: a confirmed-positive `low` does *not* overtake an unconfirmed `medium`, and within one tier a confirmed-positive opportunity *is* promoted.

---

## 6. Remaining engineering debt

Ordered by value. Nothing here is a correctness fault; each is a suppression, a redundancy or a coverage gap.

| # | Debt | Severity | Note |
|---|---|---|---|
| 1 | **252 pre-existing repo-wide `tsc` errors** | High | Down from 258, but still masks new type regressions. The single largest structural risk left in the repo. Unchanged by MAT1 by design — fixing it is its own workstream. |
| 2 | **LEARN1's granularity is (domain × type), not per-instance** | Medium | *Found during MAT1's own verification.* For user 57 all 30 candidates share one (domain, type), so learning ranks them identically — the fix restored their eligibility but learning cannot yet discriminate *between* them. Widening the key is a real decision (it would let a household's opinion attach to a single pantry item), not a bug fix. |
| 3 | **`shared/nutrition/household-nutrition.ts` now has zero production importers** | Medium | After M3 the surviving residue (score, weekly summary, insights, bands) is reachable from nothing. It was **deliberately kept**: unlike the opportunity limb, it duplicates no live observation, and retiring the scoring model would materially raise the cost of the audit's still-open "enrol nutrition" option. It now has real coverage (54 assertions, newly wired) so it cannot rot silently. **Owner decision required:** retire it, or enrol it through DEC1 §7's one door. |
| 4 | **CBK2 and PANTRY1 suites are still dead** (audit R4) | Medium | ~1,274 lines of committed assertions that fail at module load on missing `explainability-service` symbols. Best coverage-per-effort ratio left on the board. Not attempted here: it requires *building* the missing explainer surface, which is new capability, and the brief forbids new features. |
| 5 | **The Companion states actions without the reasons it already computed** (audit §4.4 / R5) | Medium | `phraseNotice` projects only `suggestedAction`; the producer's `explanation` travels to the client and is discarded at render. Visible in this session's own capture: *"Add a meal to Monday in Week 1"* with no "why". Small change, direct honesty benefit — but it changes what the Companion says, which is a voice decision (INT21), not a maturity fix. |
| 6 | **Two generator pairs can produce overlapping advice** (audit §4.5) | Medium | `shopping-higher-rated-product-available` vs `shopping-less-processed-option`; `pantry-item-unused-in-plan` vs `cookbook-recipe-cookable-now`. Untested against a real household. **M1 raises this from latent to likely** — with 20 more pantry candidates now eligible, the second pair has materially more opportunity to collide. This is the highest-priority follow-on. |
| 7 | **Notice cap has no domain-diversity rule** (audit §4.4) | Low | `applySilenceRules` takes the top 2 by attention with no diversity constraint. Visible in this capture: both notices are `planner-gap`. Emergent rather than decided. |
| 8 | **Two pantry readers disagree on `defaultHave`** (audit §4.7) | Low | Unchanged. |
| 9 | **Three consumer pages still have no ambient surface** (audit §4.6) | Low | Food detail, Diary, Analyser. The audit explicitly recommends *against* closing Diary and Analyser. Food detail becomes more defensible now that M1 has made its two food-level types more reachable. |
| 10 | **`WEEKLY_PLANT_TARGET` still redeclared in two dev sandbox pages** | Low | `pages/dev/arrival-experience.tsx`, `pages/dev/exp2-shared.tsx`. Out of the guarding assertion's scope; harmless, but not zero. |
| 11 | **The canonical filing gate (DOCGOV1) is failing, and was already failing before MAT1** | Medium | `repo-structure-verify.sh` reports `docs/implementation/` and `docs/investigations/` have loose files. **Six** loose implementation reports predate this session (AFI1, AFI2, AFI3_5, COMP_ACT1, COMP_ACT2, FI20 — all untracked, none created by MAT1), plus two loose investigations including AFI_VERIFY1 itself. This report is filed at the exact path the brief specified, so it is the seventh. **Consequence: `session-complete.sh` will refuse to close out any session until these are filed by workstream** — it runs the gate first. That block predates MAT1 and is not MAT1's to resolve unilaterally, since moving another session's unreviewed report would hide it from its owner. |

---

## 7. Deliberately not done

- **R4 (build the explainer surface, wire CBK2/PANTRY1)** — requires building missing capability. The brief forbids new features.
- **R5 (voice the "why")** — changes what the Companion says. A voice decision, not a maturity one.
- **Enrolling the `nutrition` domain** — would add a producer and a capability, and would ship duplicate advice without first reconciling §4.5.
- **A client test runner (vitest)** — would create a second pipeline. The brief requires one.
- **Deleting the `household-nutrition.ts` residue** — a product decision about a gated future workstream, not this session's to make (§6.3).

---

## 8. Platform maturity score

Re-scored on AFI_VERIFY1's own four axes, at MAT1's end state.

| Axis | AFI_VERIFY1 | MAT1 | Movement |
|---|:--:|:--:|---|
| **Coverage** | 7.0 | **7.5** | The dead `nutrition` domain is gone, so coverage now describes what exists rather than being penalised for a limb that reached nothing. Three consumer pages still have no surface, and four types remain hard to reach. |
| **Consistency** | 7.5 | **8.5** | The double-clamp sequencing flaw is closed. The client label registry is no longer a fourth private copy. `WEEKLY_PLANT_TARGET` has one owner instead of four. The domain union is derived from one enumerable set. Deductions remain for the two live duplicate-observation pairs and the two Home channels. |
| **User value** | 6.0 | **7.5** | The largest suppressor in the platform is removed: +20 observations per household restored to eligibility, measured on real rows. Held below 8 because the Companion still withholds the "why" it already computed, and because LEARN1 cannot yet discriminate within a type (§6.2). |
| **Production readiness** | 6.0 | **7.5** | The one unguarded registry is guarded; two previously-orphaned suites are now live in the aggregate; the new tests are negative-controlled; dead code retired; verified end-to-end against real households with screenshots. Held below 8 by the 252 pre-existing `tsc` errors and the two still-dead suites. |

### **Overall: 7.8 / 10** (from 6.6)

**What that number means.** AFI_VERIFY1's verdict was *"READY for the four live domains, with reservations"*, and named R2 and R3 as the gate before wider rollout. **Both are now closed**, along with the CRITICAL §4.1 finding.

Of the six reservations the audit asked to be carried knowingly, three are discharged (the unguarded registry, the suppressed output, the dead limb), one is improved but open (the `tsc` error count), and two are unchanged and now the top of the follow-on list (overlapping advice, the withheld "why").

The score is not higher for one honest reason: this session strengthened the platform's **spine** — sequencing, registries, source-of-truth, dead-code — and left its **edges** where it found them. The remaining 2.2 is mostly items 1, 4, 5 and 6 in §6, each of which is a workstream rather than a fix.

The safety-critical path is untouched and remains the best-tested path in the platform: `shopping-restriction-conflict` is still the sole `critical` emitter, still allowlist-enforced at the producer boundary, and MAT1 added an assertion that a nutrition type could not become `critical` even if a future producer tried.

---

## 9. Provenance

- Rollback: `rollback/MAT1-platform-maturity-and-trust-20260718` → `7bfad50c`; dirty-tree snapshot `stash@{0}` → `9f540261`
- Audit closed: `docs/investigations/intelligence/AFI_VERIFY1_AMBIENT_FOOD_INTELLIGENCE_CONFORMANCE_AUDIT.md`
- Governing architecture: `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_DECISION_ENGINE_ARCHITECTURE.md`, `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`
- New suite: `server/tests/test-mat1-registry-conformance.ts` (wired into `npm test`)
- Repaired + newly wired suite: `server/tests/test-household-nutrition.ts`
- Evidence: `docs/implementation/assets/mat1/` (7 screenshots + `manifest.json`)
- Session record: `.engineering/session/runs/MAT1_Platform_Maturity_And_Trust.md`
