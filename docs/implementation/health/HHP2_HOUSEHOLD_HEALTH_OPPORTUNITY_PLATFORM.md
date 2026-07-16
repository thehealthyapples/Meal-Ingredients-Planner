# HHP2 — Household Health Opportunity Platform — Implementation

**Status:** Complete
**Date:** 2026-07-12
**Governing architecture:** `docs/architecture/THA_DECISION_ENGINE_ARCHITECTURE.md` (DEC1) — §7 producer enrolment is the door this workstream walks through.
**Depends on:** HNP1 (Household Nutrition Platform), OD1/DEC1 (Opportunity Delivery Framework = the canonical Decision Engine), ATTN1, LEARN1/EL2, COACH1, INT20/NTC-P2 (Notice Engine + Gateway).

---

## ROLLBACK PROTECTION

**Rollback identifier: `hhp2-rollback` → commit `24be7bc98be0374480f7be6251355fd27fa7f6e8`**

A full snapshot of the working tree — **tracked modifications *and* untracked files** — taken before any change, without touching HEAD, the index, or the working tree. This matters here: the branch carried substantial *uncommitted* work at the time (HNP1's own files among it), so a tag at `HEAD` alone would have protected none of the code HHP2 actually builds on.

```bash
# Restore every file to its pre-HHP2 state:
git checkout hhp2-rollback -- .

# Inspect what HHP2 changed:
git diff hhp2-rollback
```

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/THA_DECISION_ENGINE_ARCHITECTURE.md` (DEC1 — the enrolment door, the hard boundaries, the budget doctrine)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (compliance checklists)
- [x] `shared/attention/index.ts` (ATTN1 — the attention vocabulary and the closed `critical` allowlist)
- [x] `shared/nutrition/household-nutrition.ts` + `server/lib/household-nutrition-assembler.ts` (HNP1 — the domain owner being registered)

---

## THE FINDING THIS WORKSTREAM EXISTS TO FIX

HNP1 built a complete, correct Household Health domain: a score, four independently-nullable dimensions, insights, and a set of opportunities **in the exact shape FI4 already produces**. Its own source header stated, in the present tense, that those opportunities:

> "flow through the SAME `opportunity-delivery` framework, adapted by the SAME `adaptFoodIntelligence` adapter, and therefore inherit its prioritisation, muting, de-duplication, delivery lifecycle, attention budget and Evidence→Learning loop without one line of new delivery code."

**They did not.** `OPPORTUNITY_SOURCES` contained exactly one producer (`food-intelligence`). HNP1 never enrolled one, so its opportunities were reachable only through `GET /api/household-nutrition` and one React panel. They reached the canonical Decision Engine not at all — no muting, no delivery lifecycle, no attention budget, no learning re-weight, no sealed decision, no Evidence→Learning loop, and **not one word from the Companion about a household's own health**.

The shape was right and the wiring was absent. That is the most expensive kind of near-miss, because *the comment asserting it had shipped is exactly what stops the next reader from checking.* HHP2 makes the claim true rather than deleting it, and the stale comment is corrected in the same change.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Opportunity id: `${capabilityId}:${producerOpportunityId}` — the framework's existing
  key space, unchanged. Household health ids are `household-health:nutrition-*-gap:<week>`.
  Two producers can never collide, because the capability id is part of the key.

☑ One owner per fact
  Household health SCORE/dimensions/insights/opportunities → HNP1's pure core
  (`shared/nutrition/household-nutrition.ts`), sole owner, untouched by HHP2.
  DELIVERY of an opportunity (rank/suppress/budget/lifecycle) → the Decision Engine
  (OD1's framework), sole owner, untouched by HHP2.
  HHP2 owns NEITHER. It owns one thing that did not exist: the registered capability
  that lets the second owner call the first.

☑ No duplicate entities
  No new entity. No new table. `opportunity_deliveries` (OD1's, SoT-registered) now
  carries household health rows exactly as it carries food rows — same columns, same
  lifecycle, no schema change.

☑ No duplicate ownership
  HHP2 computes no score, no threshold, no weight, no ranking, no prose. Asserted
  structurally by a source-scan over all three HHP2 modules (test §5), run against the
  source with comments stripped so a violation cannot hide behind the word describing it.

☑ No duplicate state
  None. Household health opportunities are recomputed fresh from the producer on every
  `report` (as FI4's already are); only delivery metadata is persisted, by OD1's store.

☑ Extends existing architecture
  This IS the extension point DEC1 §7 defines: "a producer enrols by adding one entry to
  OPPORTUNITY_SOURCES: a capability id, the verb to call, and an adapt()". HHP2 is the
  first exercise of that door, and it cost exactly what DEC1 promised it would.

☑ Progressive enrichment where appropriate
  Transactional/derived — no enrichment pipeline added. Every owner HNP1 reads is read
  independently and best-effort; a household with no planner, no analysed products or no
  Nutrition Centre contributes no dimension and is not scored on it (HNP1 Trust Rule 1).

☑ Knowledge domain compliance
  N/A — HHP2 introduces no knowledge domain and no new knowledge lifecycle. It registers
  a capability over the Nutrition/Household Knowledge domains that PKCA §1.1 already
  admits, and adds no row to it.

☑ Honest gaps over fabricated information
  Anonymous caller → gap. Unresolvable household → gap. A household with NO history →
  `ok` with `available: false` and zero opportunities (see "the empty week is not a gap",
  below). A dimension with no data is not scored, never scored as zero.

☑ No permanent synchronisation bridge
  None. There is one path (the Intent Engine) and one direction (Decision Engine →
  producer). Nothing is kept in sync with anything.

☑ Evolution over replacement
  `adaptFoodIntelligence` is RETIRED, not left beside its generalisation
  (`adaptOpportunityReport`). Its identifier no longer exists — grep-asserted in test §1.
  Nothing else is replaced; HNP1, OD1, ATTN1, LEARN1 and COACH1 are all unchanged.
```

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform — `household-health` is bound via the standard
    Port → Handler → Binding pattern; the Decision Engine reaches it through
    `intelligencePlatform.handle()`, never around it.
✓ Uses the Capability Registry — a full descriptor is registered (owner, owningService,
    apiSurface, supportedIntents, permissions, class, availability).
✓ Uses the Intent Engine — the producer fan-out calls the registered `report` verb.
✓ Reuses existing business services — HNP1's assembler and pure core, verbatim.
✓ Does not create another assistant — no second Companion, no second voice.
✓ Does not duplicate conversation state — none touched.
✓ Uses registered capabilities only — household resolution goes through the canonical
    household read port; nothing reaches around an owner.
✓ Uses permission-aware access — `minimumRole: user`, `ownershipScoped: true`. The
    household is RESOLVED from the caller's authenticated id; there is no client-supplied
    household parameter (asserted by source-scan, test §2).
✓ Produces honest gaps rather than fabricated knowledge — see above.
```

```
----------------------------------------
EXPERIENCE & UI GOVERNANCE COMPLIANCE
----------------------------------------
```
**Applicable — and satisfied without a UI change.** HHP2 is user-facing in effect (the Companion can now speak about a household's health) but ships **zero client code**. The notice reaches the household through the existing, already-governed ambient channel: the Notice Engine's attention budget (`MAX_NOTICES_PER_MOMENT = 2`, INT20), the Behaviour Engine's voice seam (INT21), and the existing `AmbientIntelligence` surface, which renders notices generically and switches on no category.

- ✓ **No new visual pattern** — therefore none to retire (UI Principle 5).
- ✓ **Nothing owns a fact at the presentation layer** — every sentence a household reads is HNP1's own, projected verbatim through the Decision Engine and voiced (never reworded) by the Behaviour Engine. The client authors no prose about household data.
- ✓ **One primary action** — an opportunity carries exactly one `suggestedAction`, HNP1's own.
- ✓ **Calm before capability / no notification feed** — household health enters *under* the existing 2-notice budget and competes for it. It does not add a channel, a badge, or a budget. **This is the point:** a household that already has two food opportunities does not now get four. It gets the two the attention budget judged most worth their attention, across both producers.
- ✓ **Premium standard (EXP2 §17)** — the care taken here is the care *not* taken: the household's existing mute preference, dismissals and confirmed patterns already apply to health advice on day one, because they are owned once. Nothing had to be re-taught to a second system, and nothing the household already told THA has been forgotten.

```
----------------------------------------
PRODUCT REGISTRY COMPLIANCE
----------------------------------------
```
**Assessed. Registry impact: YES — and it cannot be discharged in this change.**

Would "what is THA?" answer differently now? **Yes.** THA now proactively coaches a household on its own nutrition health through the Companion — a capability it did not have.

The affected entries would be: **Capabilities** → `household-health` (new); **Capabilities** → `opportunity-delivery` (updated: two producers, not one); **Notifications** → the `nutrition-opportunity` ambient notice category (new).

**These entries were NOT created, and this is a deliberate, declared gap rather than an omission.** The Product Knowledge Registry is **defined and populated nowhere**: `docs/product/` does not exist. `PKR1` defines the 28 canonical sections and their folder structure and *"deliberately does not create or populate"* them; `PKR3` restates that it *"deliberately does not create"* `docs/product/`. HHP2 cannot add an entry to a registry that has no home, and **creating that home is a governance act belonging to PKR, not a side-effect of a health workstream** — doing it here would make a capability implementation the de-facto author of the registry's structure, which is precisely the "second owner" failure PKR13 forbids.

Recorded below as **Remaining Gap G1**, with the three entries named, so that whoever stands `docs/product/` up inherits a work item rather than rediscovering this from scratch (PKCA §9.3 — *investigations discover; the registry owns; implementations maintain*; Rule KC12 — a declined discovery is **recorded**, or every future audit re-asks the same question forever).

---

## IMPLEMENTATION

### The whole of it, in one sentence

Household Health became an opportunity producer by adding **one entry to `OPPORTUNITY_SOURCES`** and **one row to `DOMAIN_SURFACE`** — and **zero lines** of suppression, ranking, budgeting, lifecycle, learning, or decision code.

### 1. The capability (new — the one thing that did not exist)

| File | What it is |
|---|---|
| `server/intelligence/handlers/household-health-read-port.ts` | The narrow read seam. Two methods, both 1:1 forwards to existing owners: `getHouseholdForUser` (the canonical household-membership owner, SoT D16) and `assembleHouseholdHealth` (HNP1's assembler). Dynamic imports — binding opens no DB connection. |
| `server/intelligence/handlers/household-health-handler.ts` | Makes `report` executable. Delegates entirely; projects HNP1's output verbatim. Owns no score, no threshold, no rank, no prose. |
| `server/intelligence/bindings/household-health.ts` | `HOUSEHOLD_HEALTH_CAPABILITY_ID = "household-health"`, executable intents `["report"]`. The standard binding. |

**Why a separate capability from `household`.** The `household` capability's owner is the household-*membership* store (who is in this household, what they cannot eat). Household *Health*'s owner is HNP1's reasoning core (planner + plant classifier + `user_health_trends` + Nutrition Centre). Different owners, different questions. Folding health into `household` would give one capability two owners — the exact thing "one owner per fact" forbids.

### 2. The enrolment (the actual HHP2)

`server/intelligence/opportunity-delivery/framework.ts`:

- `adaptFoodIntelligence` → **`adaptOpportunityReport`**, and it is now **shared by both producers**. Its logic did not change by one character, because it never read a food-specific field: it only ever read the fields the Decision Engine's own contract defines. FI4's `FoodOpportunity` and HNP1's `HouseholdNutritionOpportunity` both satisfy that contract independently and by construction. **The second producer needed a capability id, not a second adapter.** The old identifier is retired (Principle 8).
- `OPPORTUNITY_SOURCES` gains `"household-health": { verb: "report", adapt: adaptOpportunityReport }`.
- `DOMAIN_SURFACE` gains `nutrition: "nutrition"` — **an exact match to an existing `ConversationSurface`**, not a new surface. Without the row, the domain would fall back to `floating`, which is the right *default* for a domain nobody has mapped and the wrong *answer* for one that has.

### 3. The Notice seam (the step that would have silently swallowed the whole workstream)

`noticeOpportunities()` maps an opportunity's `domain` to a `NoticeCategory` and **drops any domain it does not recognise** — an honest no-op, and correct as a default. But it meant that without this step, household health opportunities would have been collected, ranked, budgeted, persisted, learned from, and then **silently dropped one step before the household could read them.** Enrolled, and invisible.

- `notice-engine.ts`: new `NoticeCategory` **`nutrition-opportunity`**, and `DOMAIN_TO_CATEGORY` gains `nutrition → nutrition-opportunity`.
- `notice-gateway.ts`: `nutrition-opportunity` added to `NOTICE_SCOPE.companion` **and** to the `wanted(...)` gate that decides whether the opportunity fetch runs at all.

**It is a sibling of `planner-gap`/`pantry-opportunity`/`shopping-opportunity`, not of `nutrition-trend`.** `nutrition-trend` is an *observation* about processed-food ratings over time and proposes nothing; a `nutrition-opportunity` is an *actionable, cited, dismissible, learnable card with a lifecycle*. Mapping HNP1's opportunities onto `nutrition-trend` would have given one category two owners and two meanings.

**One capability call, not two.** The gateway still makes exactly one `opportunity-delivery` call — the Decision Engine fans out across producers itself. A second call would have re-fetched, re-ranked and re-budgeted the same bundle beside the one that already exists. Grep-asserted (test §6).

### 4. The empty week is not a gap

A household whose household *resolves* but which has planned nothing returns `ok` with `available: false` and no opportunities — it does **not** throw. This distinction is load-bearing for the sealed `DeliveryDecision`: a producer that throws is counted as **unreached** and vanishes from the record entirely, while one that returns an empty list is counted as **reached-and-offered-nothing** (`offered: 0`).

*"This household has no health opportunities right now"* is a true and useful statement about a delivery moment. *"Household Health was unreachable"* would be a false one.

---

## FILES CHANGED

**Created (5)**
```
server/intelligence/handlers/household-health-read-port.ts       the read seam
server/intelligence/handlers/household-health-handler.ts         the `report` verb
server/intelligence/bindings/household-health.ts                 the binding
server/tests/test-hhp2-household-health-opportunities.ts         49 assertions
docs/implementation/health/HHP2_HOUSEHOLD_HEALTH_OPPORTUNITY_PLATFORM.md
```

**Modified — production (6)**
```
server/intelligence/opportunity-delivery/framework.ts     THE enrolment: shared adapter,
                                                          + household-health producer,
                                                          + nutrition→nutrition surface
server/intelligence/capability-registry.ts                household-health descriptor;
                                                          opportunity-delivery description
                                                          corrected (two producers)
server/intelligence/intelligence-platform.ts              bind household-health BEFORE the
                                                          Decision Engine that calls it
server/intelligence/conversation/notice-engine.ts         `nutrition-opportunity` category
                                                          + nutrition domain mapping
server/intelligence/conversation/notice-gateway.ts        category into companion scope +
                                                          the gather gate
shared/nutrition/household-nutrition.ts                   the stale comment corrected — the
                                                          claim is now load-bearing, not
                                                          aspirational
```

**Modified — tests (24)**
```
package.json                                              test:hhp2-* registered in `npm test`
server/tests/test-dec1-decision-engine.ts                 producer double now dispatches on
server/tests/test-learn1-household-learning.ts            capabilityId, as production does
server/tests/test-coach1-proactive-coaching.ts            (see "Two classes of test breakage")
server/tests/test-attn1-attention-platform.ts
server/tests/test-intelligence-opportunity-delivery-binding.ts
server/tests/test-intelligence-platform.ts                registered-capability count 24 → 25
server/tests/test-intelligence-notice-convergence.ts      companion scope count 11 → 12
+ 18 × test-intelligence-*-binding.ts                     live-capability scope lock 22 → 23
```

### Two classes of test breakage, and why neither was "fixed" by weakening an assertion

Enrolling the second producer broke 6 suites. Both causes were real signals, not noise:

**(a) Stale producer doubles (5 suites).** Their stub `fetchProducer` returned the same food opportunities for **any** `capabilityId` — it ignored the argument. While exactly one producer was registered, such a double was indistinguishable from a correct one. With two registered, it handed the same fixtures to both and every count silently doubled (`offered: 6` from *both* producers). Production's `defaultProducerFetch` dispatches by capability id via `intelligencePlatform.handle()`. **The doubles were made faithful to production; not one assertion was relaxed.** Each remains a deliberate one-producer scenario, and each suite now passes on its original claims.

**(b) Capability-count scope locks (21 assertions across 20 files).** These pin the number of registered/live capabilities and exist *precisely* so that adding one is a deliberate act. They fired exactly as designed and were updated to name `household-health`.

> **Observation, not a change:** that same enumerated scope-lock string is copy-pasted across 18 binding tests — one fact with eighteen owners, in the test suite. Adding a capability therefore requires editing 18 files that have nothing to do with it. Out of scope for HHP2; recorded as **Remaining Gap G3**.

---

## DEFINITION OF DONE

- [x] Household Health registered as a canonical capability on the Intelligence Platform.
- [x] Household Health enrolled as an opportunity **producer** in the canonical Decision Engine.
- [x] Household health opportunities inherit — **proven by test, not asserted** — muting, delivery lifecycle, attention budget + A3 critical exemption, LEARN1 re-weighting, COACH1 seen-ordering, the sealed `DeliveryDecision`, and the terminal Decision→Evidence loop.
- [x] The Companion can voice a household health opportunity, under the existing notice budget and voice seam.
- [x] No new opportunity system, scoring system, or engine — enforced by comment-stripped source-scan.
- [x] `npm test` — **70 suites, all green, exit 0.**
- [x] `npx tsc --noEmit` — **zero new type errors** (168 pre-existing before, 168 after; diffed against the rollback snapshot in a clean worktree).

**Verification**
```bash
npm run test:hhp2-household-health-opportunities   # 49 passed, 0 failed
npm test                                            # 70 suites, exit 0
```

---

## DATA IMPACT

**None.** No migration, no schema change, no new table, no new column. `opportunity_deliveries` (OD1's, SoT-registered) now carries rows whose `capability_id` is `household-health` and whose `domain` is `nutrition` — existing columns, existing lifecycle. `priority` remains a non-authoritative snapshot (ATTN1 A6).

---

## TRUST CHECK

| Claim | Substantiated by |
|---|---|
| Every household health card is true | HNP1's core, which computes nothing and reads every figure from an existing owner. |
| Every card cites its source | Rule E1 — `noticeOpportunities` drops any uncited opportunity; every HNP1 opportunity carries the dimension's own evidence. Asserted in test §3. |
| No card is fabricated | A dimension with no data is not scored (`null`), never scored as zero. A household with nothing at all yields silence, never a zero score. |
| No card can inflate itself to `critical` | ATTN1 A2 — closed allowlist. `assertCriticalAllowed` throws at the producer adapter for any nutrition type. Asserted in test §5. A quiet plant week is not a harm signal. |
| The household is never louder for this | Health competes *within* the existing 2-notice budget; it does not add one. |
| A household that muted this never hears it | `mutedOpportunityTypes` applies to health types with zero new code. Asserted in test §4. |
| "Why didn't I see X?" is answerable | The sealed `DeliveryDecision` names `household-health`, what it offered, and every suppression by rule. Asserted in test §4. |

---

## ROLLBACK PLAN

**Rollback identifier: `hhp2-rollback` → `24be7bc98be0374480f7be6251355fd27fa7f6e8`**

```bash
git checkout hhp2-rollback -- .
```

**Partial rollback (disable the producer, keep the capability):** delete the single line
`"household-health": { verb: "report", adapt: adaptOpportunityReport },` from `OPPORTUNITY_SOURCES`.
Household health opportunities stop being delivered immediately; nothing else is affected; the capability remains registered and callable. **That one line is the entire on/off switch** — which is itself the clearest evidence the enrolment door was real.

---

## REMAINING GAPS

**G1 — Product Knowledge Registry entries are owed and cannot yet be written.**
`docs/product/` does not exist; `PKR1`/`PKR3` deliberately define the registry and populate nothing. Three entries are owed the moment it is stood up: **`household-health`** (new capability), **`opportunity-delivery`** (updated — two producers now, not one), and **`nutrition-opportunity`** (new ambient notice category). Recorded here rather than silently skipped, per Rule KC12. *Owner: whoever stands up `docs/product/`.*

**G2 — `nutrition-opportunity` notices are voiced, but not deep-linked.**
The opportunity routes to the `nutrition` `ConversationSurface`, and the Companion voices it. Whether tapping it should land on the Household Nutrition panel (`HouseholdNutritionPanel`) — and whether that panel should show the *delivered* opportunities rather than re-deriving its own from `GET /api/household-nutrition` — is a genuine product/UX decision, deliberately not taken here. **Note the live duplication it leaves:** the panel currently renders HNP1's opportunities *directly*, so a household could in principle see an opportunity on the panel that it has already dismissed in the Companion. Converging the panel onto the delivered bundle would close that, and is the natural HHP3.

**G3 — the live-capability scope lock has 18 owners.**
The enumerated capability-count assertion is copy-pasted across 18 binding test files, so registering any capability requires editing 18 unrelated tests. One fact, eighteen owners — the exact smell the architecture forbids in production code, living in the test suite. A single shared `expectLiveCapabilities()` helper would retire it. Out of scope for HHP2.

**G4 — `weekNumber` is accepted but never supplied.**
The `report` verb accepts an optional `weekNumber` parameter (HNP1 supports it), but the Decision Engine's producer fan-out calls `report` with no parameters, so it always reports the household's **latest planned week** — which is the correct default and the only one any current caller wants. The parameter is live for a future caller; no caller uses it today.

---

## SCOPE LOCK

**In scope, and delivered:** registering Household Health as a canonical capability; enrolling it as a producer in the existing Decision Engine; the Notice seam required for it to actually reach a household; tests; this document.

**Explicitly NOT done, and deliberately so:**
- No new opportunity system, scoring system, engine, table, or HTTP route.
- No change to HNP1's reasoning — not one weight, threshold, sentence or figure.
- No change to OD1/DEC1's suppression, ranking, budgeting or lifecycle logic.
- No client code. No new visual pattern.
- No change to the `critical` allowlist (ATTN1 A2) — health is never critical.
- No second `opportunity-delivery` call, and no second notice channel.
