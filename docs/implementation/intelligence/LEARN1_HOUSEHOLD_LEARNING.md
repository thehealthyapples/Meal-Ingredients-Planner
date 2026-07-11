# LEARN1 — Household Learning — Implementation

**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED — activates the platform's continuous-learning loop (EL2's fourth pillar) by wiring its first real Evidence reporter and its first real consumer of Confirmed Understanding.
**Reason:** The Evidence pillar is the only pillar whose output feeds back into an earlier pillar. Closing that loop for the first time changes what the platform does with a household's own behaviour, and is therefore architectural rather than additive.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-learn1-household-learning-20260709` → `5ba6ec2` |
| Working tree | Intentionally dirty — uncommitted COMP2/KNOW4/PLAN1 work and benchmark artifacts were present before this task began and are untouched by it |
| This task's writes | `server/intelligence/evidence-learning/household-observation.ts` (new), `server/intelligence/opportunity-delivery/framework.ts`, `server/tests/test-learn1-household-learning.ts` (new), `server/tests/test-intelligence-opportunity-delivery-binding.ts`, `package.json`, this document |
| Rollback to committed state | `git checkout rollback/before-learn1-household-learning-20260709` |

---

## 0. THE ARCHITECTURE STOP THAT CAME FIRST

**The workstream as briefed could not be built, and STEP 2 of `ENGINEERING_WORKFLOW.md` required it to stop before implementation.** The brief said: *"Activate Household Learning using the existing Observation Engine and Behaviour Engine."* Both named engines forbid exactly that, by name, in their own non-negotiables:

- `THA_OBSERVATION_ENGINE_ARCHITECTURE.md` §7: *"Any behaviour that reads an observation — routing, permissions, confirmation tiers, phrasing, notices, **learning** — **stop.**"* §5.2b closes the loophole explicitly: *"including any future learning loop."*
- `THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` §10: *"Any behaviour decision that is read back by anything — routing, a voice choice, a threshold, a default, a **'learned' preference** — **stop.** … Autonomous learning is a separately gated workstream and is not authorised here."*

Verified against the running code, not the documents alone: the only importers of the observation module outside itself are `intent-engine.ts` and `conversation-gateway.ts`, and both import only `recordObservation` — the write seam. **Nothing in the codebase reads an observation back to make a decision.** LEARN1 would have been the first violation.

Independently of the prohibition, the Observation Engine also **cannot supply the data the brief asks to learn from.** Its §2.3 records no business facts and no content — shapes, counts and timings only — and it is bounded to 30 days / 50,000 rows with opportunistic pruning. Favourite meals, rejected meals and accepted swaps are not in it and could not survive in it. The Behaviour Engine is a pure phrasing layer (verified: no I/O, no storage import) barred by its §3 from touching eligibility, targets or selection, so it cannot influence a recommendation without becoming a second execution plane — CPA1 §12's first stop.

The Observation Engine's own §3 names the correct owner: *"Evidence that must outlive the window (benchmark history, learning evidence) already has its own owner (benchmark artifacts, **EL1**)."*

**The stop was reported, the substitution was approved, and LEARN1 was re-scoped onto EL1.** No governing document was amended, weakened, or bypassed.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md` (the first prohibition)
- [x] `docs/architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` (the second prohibition)
- [x] `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` (graduation pipeline; Layer-3 evidence rule)
- [x] `docs/implementation/knowledge/EL1_EVIDENCE_AND_LEARNING_PLATFORM.md` (the platform LEARN1 activates)
- [x] `docs/investigations/intelligence/EL2_EVIDENCE_AND_LEARNING_ARCHITECTURE_REFINEMENT.md` (Rule EL2; ET1–ET6; the three-gate chain; the two named next milestones LEARN1 delivers)
- [x] Code read in full before writing: `evidence-learning/framework.ts`, `evidence-learning-store.ts`, `evidence-learning-handler.ts`, `evidence-learning-read-port.ts`, `bindings/evidence-learning.ts`, `opportunity-delivery/framework.ts`, `opportunity-delivery/delivery-store.ts`, `opportunity-delivery-handler.ts`, `opportunity-delivery-read-port.ts`, `permissions.ts` (`confirmationFor`), `lib/household.ts`

---

## 1. WHAT WAS BUILT

LEARN1 delivers the three milestones EL2 named and deliberately deferred to "the same EWO that wires the first real reporter":

| EL2's named follow-up | Delivered as |
|---|---|
| "Build the `recordHouseholdObservation()` ergonomic helper (§4)" | `server/intelligence/evidence-learning/household-observation.ts` |
| "Wire … the first real Evidence reporter" | `resolveOpportunity()` — accepted/dismissed advice |
| "Wire a first real consumer of Confirmed Understanding" | `collectOpportunities()` / `prioritiseAndGroup()` — advice re-weighting |

**Zero new AI systems, learning engines, user profiles, conversation state, knowledge stores, tables, columns, verbs, capabilities or migrations.** Every threshold EL1 shipped is untouched, and a test asserts it.

### 1.1 The one door (`household-observation.ts`)

The domain-facing edge of **Rule EL2 — "Evidence flows through one door"**. Both directions live here, and both travel the ordinary Intent Engine pipeline via `intelligencePlatform.handle()`:

- `recordHouseholdObservation()` → the `report` verb (confirmation tier `none`, verified in `permissions.ts`).
- `readConfirmedUnderstanding()` → the `search` verb, `status: "confirmed"`.

Nothing here imports `evidence-learning-store.ts` at runtime or names either evidence table in code — asserted structurally in §6 of the test suite, so Rule EL2 is enforced by a test rather than by discipline.

Both functions are **total**. Evidence capture is a side effect of a real user action: dismissing advice must never fail because the evidence log was unreachable. A failure returns `{ recorded: false, reason }` and logs once.

> This is deliberately **not** the Observation Engine's fire-and-forget telemetry discipline. An Observation is operator telemetry whose loss costs nothing and which nothing may read back. Evidence is a durable household business fact whose loss is small but real — so it is awaited, and a failure is stated rather than silently dropped.

`toConfirmedUnderstanding()` is the pure gate every consumer passes through. It re-checks `status === "confirmed"` even though the query already filtered on it, and **discards any row without a `rationale`**. That makes ET6 structural: an understanding that cannot explain itself is not a weaker understanding, it is not one at all.

### 1.2 The reporter — advice outcomes

`resolveOpportunity()` submits exactly one Evidence event on a **genuine transition into a terminal status**:

| User behaviour | `outcomeType` | `direction` |
|---|---|---|
| Accepted a piece of advice | `opportunity_accepted` | `positive` |
| Dismissed a piece of advice | `opportunity_dismissed` | `negative` |
| Acknowledged ("seen") | *nothing recorded* | — |

The Evidence dimension is `(domain, subjectType: "opportunity", subjectKey: <opportunity type>)`. `subjectKey` is the opportunity's **type**, never its id — an id is unique per instance and could never accumulate the three events a Pattern requires.

Three guards, each preventing a specific way the evidence log could be made to lie about a household:

1. **`transitioned`** — an idempotent re-dismiss changes nothing, so it is not a second act of dismissal. Without this, a client retry would inflate a household's apparent consistency and manufacture confidence out of a network hiccup.
2. **Terminal only** — `acknowledged` means "seen", which is not an opinion. EL2 §5 requires the reporting domain to supply a `direction` reflecting what it *actually knows*, never a guessed default. This framework knows an accepted opportunity was wanted and a dismissed one was not; it does not know what an acknowledged one means.
3. **Never throws into the caller** — resolving an opportunity is the user's action and succeeds on its own terms.

### 1.3 The consumer — advice re-weighting

`collectOpportunities()` reads the household's Confirmed Understanding and passes it to `prioritiseAndGroup()`, where it becomes the sort's **second key, between priority and arrival order**. Two properties follow from that position, and both are asserted:

1. **Learning can never cross a priority tier.** Priority is compared first, so a demoted `high` still outranks every `medium`. A household's confirmed dislike re-orders advice; it never buries urgent advice beneath trivia.
2. **With nothing confirmed — the state every household starts in and stays in until it explicitly confirms a Pattern — every rank is `0` and the function returns exactly what it returned before LEARN1.**

The set is untouched: same opportunities, same ids, same producer-authored priorities, same count. Only order within a tier changes. That is the whole of "re-weight, never author" (NK2 Rule P1: *"household learning never generates new facts, only re-weights existing ones"*).

**Stated plainly, because it is the one real behavioural consequence:** under a `limit`, ordering does decide which of the eligible opportunities are delivered. That is what re-weighting is *for*. It is strictly weaker than `mutedOpportunityTypes`, which removes a type outright and remains the only mechanism that can — and which LEARN1 never writes.

`bundle.metadata.learning` records `confirmedUnderstandingCount` and names the exact opportunity ids whose rank moved, so the influence is auditable rather than invisible.

### 1.4 The three gates are intact

EL2 §8's chain is unchanged and unbypassed. LEARN1 adds no exception to any of it:

```
isolated event          ──✗──▶  Pattern                  (ET1: ≥3 polarised events)
Pattern                 ──✗──▶  Confirmed Understanding  (ET5: explicit strong-tier approve)
Confirmed Understanding ──✗──▶  household preference     (EL1: never adapts a preference itself)
```

LEARN1 acts **only** on the far side of gate 2, and it never attempts gate 3. It re-weights an ordering at read time; it writes no preference anywhere.

---

## 2. HONEST GAPS — the behaviours LEARN1 does NOT learn from, and why

The brief listed eight behaviours. **Four have no observable event in this codebase today**, and inventing evidence for them would be exactly the fabrication the platform's trust rules exist to prevent. Enumerated with evidence rather than estimated:

| Behaviour | Status | Evidence |
|---|---|---|
| **Ignored advice** | ✅ **Delivered** — as explicit dismissal | `opportunity_deliveries.status → dismissed` |
| Accepted advice | ✅ **Delivered** | `opportunity_deliveries.status → accepted` |
| **Rejected meals** | ❌ **No event exists.** `planner_entries` has no `status`/`cooked`/`skipped`/`rejected` column. There is no route recording that a household declined a meal. | `shared/schema.ts` planner tables |
| **Favourite meals** | ❌ **No event exists.** No favourite column and no meal-rating route. `meals.showInCookbook` is gated to `variantKind === "household_safe"` and means "keep this variant", not "we love this". | `routes.ts:10315` |
| **Accepted swaps** | ❌ **No event exists.** `ingredient_swaps` is a static reference table; `POST /api/meals/:id/adapt` computes a swap and **persists nothing**. | `recipe-swap-engine.ts`, `routes.ts:5593` |
| **Shopping preferences** | ⚠️ **Observable, deliberately excluded** — see below | `shopping_fulfilment_memory`, `routes.ts:11441` |
| **Frequently used ingredients** | ⚠️ **Observable, deliberately excluded** — see below | `storage.recordItemUsage`, `storage.ts:3516` |
| **Planning habits / household meal patterns** | ❌ **No honest direction.** Add/remove/swap planner routes exist, but the planner does not know whether a removed entry was disliked or merely rescheduled. EL2 §5 forbids a guessed default `direction`. | `routes.ts:6238–6613` |

**"Ignored" advice, precisely.** Delivered-but-never-resolved is the *absence* of an event and is unobservable at any existing hook. Detecting it would need a background sweep over ageing `opportunity_deliveries` rows — a new mechanism, out of scope. LEARN1 therefore learns from **explicit dismissal**, which is the observable form of rejection, and says so rather than quietly relabelling one as the other.

**Why two observable behaviours were still excluded.** `recordItemUsage` fires on every food-diary entry, and `shopping_fulfilment_memory` on every fulfilment. Both are one-directional (usage is always `positive`), so every ingredient would clear ET1/ET2 at 100% consistency after three uses. That is not learning — it is restating that the household used an ingredient three times, in an append-only, unbounded log. EL2 §5's "many small, easy signals" is about *meaningful* signals. A reporter that manufactures a Pattern for every ingredient a household has ever cooked with would flood the evidence log and devalue every genuine Pattern beside it. Both are named in Scope Lock as candidates that need a **consumer and a grouping dimension** designed first (e.g. cuisine, not ingredient).

**One further honest gap, inherited rather than introduced.** `LearningSignalsPanel.tsx` and `use-learning-signals.ts` exist but are rendered by **no page**. A household can therefore reach the `approve` gate today only through the Companion's conversational action path, not through a panel. This is pre-existing EL1 debt (EL1 shipped with "no UI or route surface for a household to review/confirm/decline Patterns" in its own excluded scope), it is not introduced by LEARN1, and the brief's "No UI changes" forbids fixing it here. **Its consequence is stated plainly: until a confirmation surface is rendered, the consumer will correctly find nothing confirmed and change nothing.** The reporter accumulates Evidence and Patterns from the first dismissal regardless.

---

## 3. ARCHITECTURE COMPLIANCE CHECKLIST

```
□✓ One canonical identity
  Evidence subject: (domain × subjectType × subjectKey). Opportunity identity remains
  `${capabilityId}:${producerOpportunityId}`, unchanged. No new key space.

□✓ One owner per fact
  Evidence rows + learning signals: evidence-learning-store.ts (unchanged, untouched).
  Delivery lifecycle: delivery-store.ts (unchanged). Household preferences: user_preferences
  via its own owner — LEARN1 writes none. Ordering is computed per request, never stored.

□✓ No duplicate entities
  No new entity. The Evidence event and the learning signal are EL1's, created through EL1's
  own `report` verb.

□✓ No duplicate ownership
  No attribute gains a second owner. `mutedOpportunityTypes` stays the sole mechanism that
  can remove an opportunity type; LEARN1 only reorders.

□✓ No duplicate state
  Confirmed Understanding is read per request and never cached, copied or materialised.
  `bundle.metadata.learning` is a projection computed on read, persisted nowhere.

□✓ Extends existing architecture
  Extends EL1 through Rule EL2's one door, and OD1's existing injectable-dependency pattern
  (`fetchProducer` gains two siblings). Mirrors `defaultProducerFetch`'s dynamic-import
  discipline exactly.

□✓ Progressive enrichment where appropriate
  Transactional/behavioural state — no enrichment pattern applied, correctly.

□✓ Honest gaps over fabricated information
  Unreachable evidence store → `[]` → no influence. Unconfirmed Pattern → not actionable.
  Missing rationale → discarded. Four un-observable behaviours → not reported at all (§2).

□✓ No permanent synchronisation bridge
  None. Evidence is written once through one door and read through the same capability.

□✓ Evolution over replacement
  Nothing replaced. EL1 was delivered-but-dormant; LEARN1 wakes it.
```

### AI ARCHITECTURE COMPLIANCE

```
✓ Uses the canonical Intelligence Platform      — intelligencePlatform.handle() for both directions
✓ Uses the Capability Registry                  — evidence-learning + opportunity-delivery, unchanged
✓ Uses the Intent Engine                        — LOCATE→VALIDATE→PERMISSION→CONFIRM→INVOKE→RESPOND
✓ Reuses existing business services             — EL1 framework, OD1 framework, both unchanged
✓ Does not create another assistant             — no assistant, no conversation state touched
✓ Does not duplicate conversation state         — none read or written
✓ Uses registered capabilities only             — `report` / `search`, tier `none` (verified)
✓ Uses permission-aware access                  — ownershipScoped; household resolved server-side
✓ Produces honest gaps rather than fabricated knowledge — §2, and every degrade path
```

---

## 4. DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Household Evidence & Learning (EL1); Opportunity Delivery (OD1)
Declared SoT:    household_evidence_events + household_learning_signals
                 (owner: server/intelligence/evidence-learning/evidence-learning-store.ts)
                 opportunity_deliveries (owner: opportunity-delivery/delivery-store.ts)
New store created? NO
Existing store extended? NO — no table, column, index or migration. EL1's schema is untouched.
Consumer created? YES — opportunity re-weighting reads Confirmed Understanding
  reads from declared SoT? YES — via the `search` verb through the Intent Engine (Rule EL2),
  never by importing the store or querying either table.
```

---

## 5. DEFINITION OF DONE

**What success looks like**
- A household that dismisses the same *type* of advice three times, consistently, produces a Pattern (`pending_confirmation`) carrying its own `rationale` and `supportingEventIds`.
- No Pattern is ever produced from one or two events, nor from a 50/50 household.
- A Pattern changes nothing until the household explicitly confirms it.
- Once confirmed, that advice type sinks within its own priority tier — never below a more urgent tier.
- With nothing confirmed, the platform behaves exactly as it did before LEARN1.

**What must not break**
- No observation is read back by anything (the Observation Engine invariant is untouched).
- No voice, threshold or default adapts to telemetry (the Behaviour Engine invariant is untouched).
- Resolving an opportunity never fails because evidence capture failed.
- `mutedOpportunityTypes` remains the only thing that can remove an opportunity type.
- EL1's thresholds (3 / 0.7 / 90 days) are unchanged.

**Manual test steps** — see §7.

---

## 6. DATA IMPACT

- **Reads existing data:** YES — `household_learning_signals` (via `search`), `opportunity_deliveries` (via the existing store).
- **Writes new data:** YES — rows in `household_evidence_events`, and derived rows in `household_learning_signals`, both through EL1's existing `report` verb. **No new table, column, or migration.**
- **Changes meaning of existing data:** NO. `opportunity_deliveries` rows keep their exact meaning; LEARN1 observes their transitions.
- **Requires backfill:** NO — and none is possible or desirable. Evidence begins accumulating from the first dismissal after deploy. Back-dating evidence from historical `opportunity_deliveries` rows would stamp today's interpretation on past behaviour a household never knew was being learned from. **A row that did not say is not a row that said no.**

---

## 7. MANUAL VERIFICATION

Automated (database-free), all green:

```
$ npx tsx server/tests/test-learn1-household-learning.ts
LEARN1 Household Learning: 72 passed, 0 failed

$ npm run test:intelligence-evidence-learning-binding   → EL1 binding: 59 passed, 0 failed
$ npm run test:intelligence-opportunity-delivery-binding → OD1 framework: 50 passed, 0 failed
$ npm run test:intelligence-food-opportunity-binding     → FI4 engine:    40 passed, 0 failed
$ npm run test:intelligence-platform                     → foundation:    33 passed, 0 failed
$ npm run test:intelligence-registry-executability       → INT6A:        124 passed, 0 failed
```

`npx tsc --noEmit` — **175 errors before LEARN1, 175 after**. The two errors LEARN1 introduced (the OD1 test's hand-built bundle literals, which now need the `learning` metadata field) were fixed rather than suppressed. The 175 are a pre-existing repository baseline, unrelated to this workstream and not touched by it.

### The behavioural walk-through the tests encode

| Step | Expected |
|---|---|
| Dismiss one `pantry-item-unused-in-plan` opportunity | 1 Evidence row, `direction: negative`. **No Pattern** (ET1: 1 < 3) |
| Dismiss it twice more (three different opportunities of the same type) | Pattern appears: `evidenceCount: 3`, `consistency: 1.0`, `confidence: "low"`, `status: "pending_confirmation"`, with a `rationale` |
| Call `report` on `opportunity-delivery` | **Ordering unchanged.** `metadata.learning.confirmedUnderstandingCount: 0` — a Pattern is a candidate, not a belief (ET5) |
| Confirm the Pattern (`approve`, strong tier) | `status: "confirmed"` |
| Call `report` again | That type now sorts last **within its own priority tier**; `metadata.learning.influenced` names it |
| Dismiss the same opportunity id again (retry) | **No second Evidence row** — `transitioned` is false |
| Accept an opportunity, then dismiss it | Exactly one Evidence row (`positive`); status stays `accepted` |
| Acknowledge an opportunity | **No Evidence row** — "seen" is not an opinion |
| Take the evidence store offline | Opportunities still deliver, in their pre-LEARN1 order; dismissal still succeeds |

### Structural assertions (§6 of the suite)

- Neither `household-observation.ts` nor `opportunity-delivery/framework.ts` imports the evidence store at runtime, and neither names `household_evidence_events` or `household_learning_signals` **in code** (comments excluded — both discuss the tables precisely to state that they never touch them). **Rule EL2 is enforced by a test.**
- Exactly one `report` seam and one `search` seam exist in the one door.
- `MIN_EVIDENCE_COUNT === 3`, `MIN_CONSISTENCY === 0.7`, `EVIDENCE_WINDOW_DAYS === 90` — LEARN1 moved no EL1 threshold.

---

## 8. TRUST CHECK

- **Could this mislead the user?** The only user-visible effect is the order of already-eligible advice, and only after that household explicitly confirmed a Pattern about it. Nothing is added, removed, or reworded. No new UI surface asserts anything.
- **Could this fabricate certainty?** No. Confidence remains EL1's deterministic bucket over counted, in-window, agreeing evidence — never an ML score. `toConfirmedUnderstanding` refuses any row that cannot explain itself, so no unexplainable claim can influence anything.
- **Is anything guessed but shown as real?** No — and this is the section §2 exists for. Four of the eight briefed behaviours have no observable event; none of them is inferred, proxied, or reported. `acknowledged` is not silently recast as approval. Historical deliveries are not backfilled into evidence.
- **What happens if the system is wrong?** A wrong Pattern cannot reach the consumer without an explicit household `approve` at the strong confirmation tier. If confirmed and later wrong, the 90-day window (ET3) lets stale evidence age out, and the household's own contrary behaviour accumulates against it. Worst case, a piece of advice appears lower in a list within its own priority tier. No preference is written; nothing is deleted; no urgent advice is suppressed.
- **No architectural duplication introduced:** YES.
- **No new source of truth created:** YES.
- **No runtime behaviour altered when nothing is confirmed:** YES — asserted directly (`prioritiseAndGroup` with an empty understanding list is byte-for-byte its pre-LEARN1 self).

---

## 9. ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Household Evidence & Learning (EL1/EL2)

Current Canonical Owner:
  household_evidence_events + household_learning_signals
  (server/intelligence/evidence-learning/evidence-learning-store.ts)

Current Runtime Consumer(s):
  Reporter: opportunity-delivery/framework.ts::resolveOpportunity (LEARN1 — the first)
  Consumer: opportunity-delivery/framework.ts::collectOpportunities (LEARN1 — the first)
  Both via `evidence-learning`'s registered `report`/`search` verbs (Rule EL2).

Duplicate Owners Remaining:
  NONE

Duplicate State Remaining:
  NONE — Confirmed Understanding is read per request, never cached or copied.

Duplicate Workflows Remaining:
  NONE — no second pattern-detection path exists. `companion-learning-store.ts` (INT35B) is a
  disjoint concern (the Companion's own routing/matcher miss log; never household outcomes).

Current Convergence (%):
  100% of the Evidence pathway — 1 of 1 reporters and 1 of 1 consumers reach the store through
  the one registered door; 0 private read or write paths exist (asserted structurally by
  test-learn1-household-learning.ts §6).

  Separately, BEHAVIOURAL COVERAGE is 2 of 8 briefed behaviours (advice accepted, advice
  dismissed). Four of the remaining six have no observable event in the codebase (§2); two are
  observable and deliberately excluded pending a consumer and a grouping dimension. This number
  is coverage, not convergence, and is reported separately so the first is not mistaken for
  the second.

Target Convergence (%):
  100% (achieved for the pathway). Behavioural coverage has no target here — each new reporter
  is its own gated decision about what the platform may honestly claim to observe.

Next Planned Milestone:
  A rendered confirmation surface (EL1's own excluded scope), without which no Pattern can
  reach `confirmed` except through the Companion's conversational `approve`.

Remaining Architectural Risks:
  ET3's decay is lazy, not proactive (EL2's own named limitation, unchanged by LEARN1): a
  dimension's stats only recompute when new Evidence arrives for that same dimension. A
  confirmed understanding with no further evidence therefore keeps its last computed stats
  indefinitely, and keeps re-weighting. LEARN1 makes this observable for the first time,
  because it is the first workstream with a consumer that acts on it.
```

---

## 10. ROLLBACK PLAN

| Item | Value |
|---|---|
| Rollback identifier | `rollback/before-learn1-household-learning-20260709` → `5ba6ec2` |

**Files modified**
- `server/intelligence/opportunity-delivery/framework.ts` — evidence vocabulary, `learningRankFor`, two injectable deps, reporter call, `metadata.learning`
- `server/tests/test-intelligence-opportunity-delivery-binding.ts` — injects no-op LEARN1 seams to stay database-free
- `package.json` — registers `test:learn1-household-learning`

**Files added**
- `server/intelligence/evidence-learning/household-observation.ts`
- `server/tests/test-learn1-household-learning.ts`
- `docs/implementation/intelligence/LEARN1_HOUSEHOLD_LEARNING.md`

**Rollback commands**
```bash
git checkout rollback/before-learn1-household-learning-20260709 -- \
  server/intelligence/opportunity-delivery/framework.ts \
  server/tests/test-intelligence-opportunity-delivery-binding.ts \
  package.json
rm -f server/intelligence/evidence-learning/household-observation.ts \
      server/tests/test-learn1-household-learning.ts
```

**Data rollback:** none required. Evidence rows already written remain valid, append-only history; with the consumer removed they influence nothing. **No migration to reverse, because none was created.**

**Verification after rollback**
```bash
npx tsc --noEmit                                        # 175 errors (the pre-existing baseline)
npm run test:intelligence-opportunity-delivery-binding  # 50 passed, 0 failed
npm run test:intelligence-evidence-learning-binding     # 59 passed, 0 failed
```

**Kill switch without rollback:** decline (or never confirm) the Patterns. An unconfirmed Pattern influences nothing, so learning is off by default and stays off until a household turns it on.

---

## 11. SCOPE LOCK

**Implemented scope**
- The `recordHouseholdObservation()` / `readConfirmedUnderstanding()` one-door helper (EL2 §4).
- The first real Evidence reporter: advice accepted (`positive`) and dismissed (`negative`), on genuine terminal transitions only.
- The first real consumer of Confirmed Understanding: within-tier re-weighting of already-eligible opportunities, with an auditable influence record.
- 72 database-free assertions, including structural enforcement of Rule EL2 and of EL1's untouched thresholds.
- This document.

**Explicitly excluded (honest gaps, not oversights)**
- **Any use of the Observation Engine or the Behaviour Engine for learning** — forbidden by both engines' non-negotiables (§0). Neither file was touched.
- **Any write to a household preference**, including `mutedOpportunityTypes`, from a confirmed signal — EL2 §8's third gate.
- Reporters for rejected meals, favourite meals, accepted swaps and planning habits — **no observable event exists** (§2).
- Reporters for ingredient usage and shopping fulfilment — observable, but excluded pending a consumer and a meaningful grouping dimension (§2).
- Any UI change, including rendering the existing `LearningSignalsPanel` — the brief forbids it.
- Any backfill of historical `opportunity_deliveries` rows into evidence.
- Any change to EL1's thresholds, tables, verbs, or confirmation tiers.
- Any proactive decay sweep (EL2's named lazy-decay limitation).

**Suggestions (do not implement without approval)**
1. **Render a confirmation surface.** `LearningSignalsPanel.tsx` exists and is rendered nowhere. Until it is, `confirmed` is reachable only via the Companion's conversational `approve`, and the consumer will honestly find nothing. This is the single highest-value follow-up, and it is what makes LEARN1 visible to a household.
2. **A proactive decay sweep** (ET3). LEARN1 is the first workstream with a consumer that acts on a Confirmed Understanding, so it is the first that can be influenced by stale stats. EL2 named this and left it; it is now worth pricing.
3. **A meal-outcome event.** The single highest-value *new* observation would be "we cooked this / we didn't" on a planner entry. It unlocks rejected meals, favourite meals and household meal patterns at once — four of the brief's eight behaviours — and it needs one column and one action, not a learning engine.
4. **Ingredient and shopping reporters**, once a grouping dimension coarser than the entity (cuisine, category) and a consumer for them are designed.
5. **Promote EL2 to governing architecture.** It is cited as a rule (`Rule EL2`, `ET1`–`ET6`) by this implementation and by `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`, yet it still lives in `docs/investigations/`. It is doing a governing document's job from an investigation's shelf.

---

*Implementation record for `LEARN1 — Household Learning`. Governed by `THA_OBSERVATION_ENGINE_ARCHITECTURE.md` §7, `THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` §10 (both of which this workstream obeys by NOT using them), `EL1_EVIDENCE_AND_LEARNING_PLATFORM.md`, and `EL2_EVIDENCE_AND_LEARNING_ARCHITECTURE_REFINEMENT.md` (Rule EL2, ET1–ET6).*
*Rollback: `rollback/before-learn1-household-learning-20260709` → `5ba6ec2`.*
