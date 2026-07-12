# PHASE5B — Intelligence Platform Activation

**Status:** Implementation record — complete
**Date:** 2026-07-12
**Workstream:** PHASE5B
**Predecessor:** PHASE5A — Knowledge Platform Activation (`236660e6`)
**Governing architecture:** `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_DECISION_ENGINE_ARCHITECTURE.md` (DEC1), `THA_OBSERVATION_ENGINE_ARCHITECTURE.md` (OBS1), `THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` (BEH1), `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17), `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| **Rollback tag (whole phase)** | **`rollback/pre-PHASE5B`** → `236660e6` (PHASE5A) |
| **Checkpoint tag (mid-phase)** | `phase5b-1-loop-closed` → `3f47acbf` (loop-closing routes only) |
| Undo the whole phase | `git reset --hard rollback/pre-PHASE5B` |
| Undo only the continuation | `git reset --hard phase5b-1-loop-closed` |
| Schema modified | **None** |
| New engines created | **None** |

This record was written across two sessions; the first was interrupted after the
loop-closing routes were written but before they were verified or committed. That
work was **recovered, verified and committed unchanged** as `3f47acbf` before any
further change was made — nothing was discarded, overwritten or restarted.

---

## 1. THE ARCHITECTURE GATE — A CONFLICT WAS FOUND AND STOPPED ON

The workstream as briefed asked that *every recommendation flow through*:

```
Observation → Behaviour → Decision → Insight → Recommendation
```

This was **halted at the Architecture Bootstrap gate** (`docs/architecture/README.md` STEP 2: *"If a proposed change conflicts with the governing architecture: STOP, explain why, and do not continue until approved"*). Three of the four edges are forbidden by governing documents, and the conflict was escalated and resolved before any code was written.

The canonical pipeline already exists, and it is a different one — DEC1 §2:

```
EVIDENCE → ATTENTION → DECISION → ACTION ──┐
    ▲                                       │
    └───────── (terminal resolution) ───────┘
```

| Briefed edge | Governing rule it breaks | Verdict |
|---|---|---|
| Observation **feeds** Behaviour | OBS1 §7: *"Any behaviour that reads an observation — routing, permissions, confirmation tiers, phrasing, notices, learning — **stop**. Telemetry is operator evidence only."* | ❌ Forbidden |
| Behaviour **feeds** Decision | BEH1: Behaviour owns **voice** — *"the last transform before rendering"*, which *"may never change what is true, what is permitted, or what is **selected**"*. It is downstream of Decision, not upstream. | ❌ Inverted |
| Every recommendation **flows through** Decision | DEC1 §8 (*explicitly rejected — do not build*): *"A central `DecisionEngine.decide()` that domain engines call to rank their own candidates — **absorbs Selection**."* | ❌ Forbidden |
| **Insight Engine** / **Recommendation Engine** as new engines | No such governing document, no such module. "Insight" is an `EnrichmentKind`; "recommendation" is domain-owned Selection. | ❌ Would create new engines |

**Resolution (approved — Option 1):** activate the **canonical loop** instead. PHASE5B activates `Evidence → Attention → Decision → Action → Evidence`, leaves Observation as pure telemetry, and leaves Behaviour as the voice seam. **No new engine. No governing document amended.**

---

## 2. WHAT WAS ACTUALLY BROKEN — AND WHAT ONLY LOOKED BROKEN

An audit of the Intelligence Platform found the engines almost entirely present and wired, and **the loop open at exactly one point**.

| Engine | State before PHASE5B |
|---|---|
| Observation Engine (`observation/`) | ✅ Wired — capture + admin read routes |
| Behaviour Engine (`conversation/behaviour-engine.ts`) | ✅ Wired — sealed `BehaviourDecision`, live at the voice seam |
| Decision Engine (`opportunity-delivery/framework.ts`, DEC1) | ⚠️ **`report` reachable; `review`/`approve`/`delete` had NO HTTP route** |
| Context Composition Engine (`context/`, INT17) | ✅ Wired |
| Household Learning (`evidence-learning/`, EL1/LEARN1) | ⚠️ **Read path live; write path unreachable** |

### The open edge

DEC1 §2 names ACTION's terminal resolution as the edge that closes the loop:

> *"terminal resolution emits Evidence (`resolveOpportunity`) → feeds the next cycle's EVIDENCE. The loop is closed, once, here."*

`resolveOpportunity` was **fully implemented, fully bound, and completely unreachable.** The `opportunity-delivery` capability declares four executable verbs; only `report` had an HTTP route. The consequence was total:

- Opportunities were **delivered**, and a household could **never resolve one**.
- Only a terminal resolution emits Evidence → **zero Evidence events could ever be recorded**.
- Patterns require `MIN_EVIDENCE_COUNT` accumulated events → **no Pattern could ever be detected**.
- Confirmed Understanding requires a confirmed Pattern → **`readConfirmedUnderstanding` always returned empty**.
- Therefore LEARN1's re-weighting in `prioritiseAndGroup` was **structurally inert**.

**The platform's entire household-learning capability was dead code behind a missing route.** Everything downstream was correct and waiting.

---

## 3. WHAT PHASE5B CHANGED

### 3.1 Four HTTP routes — the closing edge (commit `3f47acbf`)

Every route is a thin, ownership-scoped projection over `intelligencePlatform.handle()` — the ordinary registered Intent Engine path. No route imports the Decision Engine's framework or its store directly, so the delivery lifecycle, `mutedOpportunityTypes`, LEARN1's re-weighting and COACH1's ordering all continue to apply exactly once, where they live.

| Route | Capability × verb | Closes |
|---|---|---|
| `GET /api/intelligence/food-opportunities` | `opportunity-delivery` × `report` | DECISION (read) |
| `POST /api/intelligence/food-opportunities/:opportunityId/:action` | `opportunity-delivery` × `review` \| `approve` \| `delete` | **ACTION → EVIDENCE (the closing edge)** |
| `GET /api/intelligence/learning-signals` | `evidence-learning` × `search` | Pattern read |
| `POST /api/intelligence/learning-signals/:signalId/:decision` | `evidence-learning` × `approve` \| `delete` | Pattern → **Confirmed Understanding** |

**Confirmation (DEC1 A7).** `review`/`approve`/`delete` carry the `strong` ConfirmationTier. The routes pass `{ confirmed: true }` — exactly the documented contract of `RouteOptions.confirmed`: *"the caller asserts confirmation, the engine decides whether confirmation was required."* An explicit, per-item `POST` naming one opportunity **is** that assent. The tier is unchanged; the engine still decides. Surfacing never softened acting.

**Permission-aware projection.** The learning-signals route projects `HouseholdLearningSignal` down to the nine fields the client contract declares. `householdId`, `supportingEventIds`, `confirmedByUserId` and `confirmationNotes` are **never** sent to the client — the internal explainability trail stays server-side.

**Honest gaps preserved.** Every non-`ok` outcome is surfaced as the platform's own honest message with `resolved: false`. No route fabricates a success.

### 3.2 Dormant capabilities — retired (Principle 8)

Two dead subsystems were **retired, not revived.** Both had zero importers, zero live references, and zero coverage in the aggregate test suite.

| Retired | Why retire rather than wire |
|---|---|
| **The `uplift` capability binding** — `bindings/uplift.ts`, `handlers/uplift-read-handler.ts`, `handlers/uplift-read-port.ts`, `tests/test-intelligence-uplift-binding.ts` | `"uplift"` is **not in the Capability Registry seed at all**, so `bindUpliftReadCapability` would have **thrown at module load** (`capability-registry.ts:813` — *"Cannot bind handler: unknown capability"*). It was never 90% wired; it was 0% wired. Its own test asserted `getCapability("uplift").availability === "available"` — an assertion that **could never pass** — and was in no npm script. Wiring it would have required a `MEAL_HEALTHIER_COMPOUND` resolver matcher **that does not exist**, reversing the *deliberate* `uplift → food-intelligence` alias (`pattern-intent-resolver.ts:1211`), and would have added a **third** read path to `server/lib/uplift-engine.ts` alongside the batch route and the four assemblers — converging nothing. |
| **The Business Service Composition island** — `conversation/service-composition.ts`, `capabilities/planner-composition.ts`, `conversation/business-service-composition-registry.ts` | A closed 3-node island with zero importers. It **had never typechecked** — all three import `IIntelligencePlatform`, a type that does not exist — which is proof it was never on a live import path. Its function is fully served by the live INT17 Context Composition Engine + `companion-enrichment.ts`. `INTA1` §3.18 / Tier 4 already ordered this deletion. No governing document mandates it. |

Retiring these **shrank the typecheck debt baseline from 175 to 168** — the built-in confirmation that the removal was clean.

`server/lib/uplift-engine.ts` itself is **untouched and still live** — it is domain Selection (deterministic nutrition rules), reached by `routes.ts` and four assemblers, and DEC1 §3 D5 protects it.

### 3.3 Duplicate reasoning — one real duplicate, collapsed

`/api/home/intelligence` and `/api/planner/weeks/:weekId/intelligence` each carried a **byte-identical copy** of the same derivation (~60 lines): the same three engine calls, the same section preferences, the same seasonal fallback, down to the comment text. The two routes differ in exactly one thing — *which* planner week they report progress for — and that difference is not in the duplicated part.

Collapsed into one pure owner: **`server/lib/household-companion-fields.ts`** → `deriveHouseholdCompanionFields(history)`.

It **reasons about nothing**. The ranking is done entirely by three canonical engines that already own it (`stories()`, `seasonalStories()`, `discover()`); the helper only reads the first card of an already-ordered section. It scores nothing, sorts nothing, re-weights nothing. It is pure (no I/O), so an empty history is a correct, complete answer of four nulls — and both routes' prior empty-history behaviour is preserved exactly.

**It is not a second Decision Engine.** Its `opportunity` field is a food-*discovery* suggestion ("aubergine is at its best right now"), not a DEC1 `DeliverableOpportunity`: it carries no `AttentionLevel`, cites no evidence, and is never delivered, muted, suppressed, re-weighted or resolved. Converging the two would be a *product* change, not an activation — recorded under SUGGESTIONS.

Also removed: `filterMealsByPreferences`, imported by `routes.ts` and **never called**.

---

## 4. THREE CLAIMS FROM THE INTERRUPTED SESSION THAT WERE WRONG

The interrupted session's own gap list was re-audited against the code. Three of its findings do not survive, and the record is corrected here rather than quietly inherited.

### ❌ "The Decision Engine has exactly one producer, and Planner/Pantry/Shopping are mapped and waiting with no producer behind them."

**Wrong on the second half, and the first half is not a defect.**

`food-intelligence` is a **cross-domain producer, not a food-only one.** Its three generators emit `owningDomain: "planner"` (`opportunity-engine.ts:193`), `"pantry"` (`:227`) and `"shopping"` (`:272`). `selectSurface()` is called with exactly that domain — so all three `DOMAIN_SURFACE` entries are **live and correctly fed today**. There are no orphaned entries and no empty doors.

And no producer *can* be enrolled honestly today. `planner`, `pantry` and `shopping` have **no `report` verb** in `supportedIntents` (`capability-registry.ts:376`/`535`/`390`) or `executableIntents`, and their handlers return raw domain rows with **no priority field and no evidence field anywhere**. Enrolling them would mean **inventing an attention level and inventing evidence citations** — precisely the fabrication Rules E1 and A1 forbid. Worse, it would fail **silently**: a non-`ok` producer outcome hits the `continue` at `framework.ts:742` and contributes zero opportunities, so the map would *look* extended while delivering nothing.

The correct extension seam is a **new generator inside `opportunity-engine.ts`** (whose `FoodOpportunityType` union documents itself as exactly that seam) or a genuinely new *Domain Intelligence* capability with its own reasoning — **not** a producer entry pointed at a data-owning capability, which would put opportunity reasoning in the wrong layer (Rule FI1: business domains own data, not reasoning). Recorded under SUGGESTIONS.

### ❌ "`routes.ts:11495` duplicates what the Decision Engine and Notice Engine do 40 lines later at `routes.ts:11587`."

**Wrong — those are two different HTTP routes**, not two blocks of one handler. `11445–11562` is `GET /api/planner/weeks/:weekId/intelligence`; `11587` begins `GET /api/intelligence/companion/notices` (COACH1), which **already** goes through `intelligencePlatform.handle({ capabilityId: "opportunity-delivery", verb: "report" })`. Different consumers, different payloads, no duplication. The real duplicate was elsewhere — §3.3 above.

### ❌ "Three independent meal scorers are duplicate reasoning."

**Wrong — they answer three different questions, and collapsing them is forbidden.**

| Scorer | The question it answers |
|---|---|
| `evaluateMeal` (`recommendation-service.ts:32`) | "Does this saved meal violate the user's diet/goals?" |
| `scoreMeal` (`meal-scoring-service.ts:94`) | "How well does this candidate fill **this planner slot, given what I already planned**?" (variety/overlap are properties of the plan-so-far, not of the meal) |
| `scoreMealCompatibility` (`household-meal-matcher.ts:423`) | "Can the **whole household** eat this one meal, and what swaps does each member need?" |

`smart-suggest-service.ts` does not stack them redundantly: it composes two, folding household fit into the ranking **exactly once** (`:910-913`). DEC1 §3 D5 explicitly protects domain Selection, and **`test-dec1-decision-engine.ts:441` asserts the Decision Engine must not import `meal-scoring` / `household-meal-matcher`** — so "consolidating the scorers into the Decision Engine" fails a governing test **by construction**. Left alone, correctly.

Likewise the **four assemblers importing `uplift-engine` directly are not a platform bypass**: `uplift-read-port.ts:9-12` explicitly documents itself as *"mirroring the EXACT pattern already used by `meal-intelligence-assembler.ts` and `food-intelligence-assembler.ts` for the same engine."* `uplift-engine` is a pure, zero-I/O rules library, not a platform-gated capability. `intelligencePlatform.handle()` is the *conversational* seam, not a mandatory gate on every pure function call.

---

## 5. ARCHITECTURE COMPLIANCE

| Principle | Compliance |
|---|---|
| 1 — One canonical identity per entity | No new entity. |
| 2 — One owner per fact | No fact re-owned. `opportunity_deliveries` stays sole-owned by `delivery-store.ts`; `household_learning_signals` by the EL1 store. The four companion fields gain **one** owner where there were two copies. |
| 3 — Progressive enrichment | Each producer/read degrades independently; an honest empty bundle is a correct answer. |
| 4 — Runtime consumes one assembled model | Every new route calls `intelligencePlatform.handle()`. None re-resolves identity or reads a store directly. |
| 5 — Reference vocabularies beside the spine | Unchanged. |
| 6 — No fabricated knowledge | Every non-`ok` outcome surfaces the platform's honest message. **No producer was enrolled by inventing attention or evidence.** |
| 7 — No permanent synchronisation bridge | No new store, no projection, no cache. |
| 8 — Evolution over replacement | Four routes over code that already existed; two dead subsystems retired; one duplicate collapsed. No engine created, none replaced. |

### AI Architecture Compliance

| Check | Result |
|---|---|
| Uses the canonical Intelligence Platform | ✅ `intelligencePlatform.handle()` only |
| Uses the Capability Registry | ✅ Both capabilities already registered and bound |
| Uses the Intent Engine | ✅ Full LOCATE → VALIDATE → PERMISSION → CONFIRM → INVOKE → RESPOND |
| Reuses existing business services | ✅ Decision Engine framework + EL1 framework, unchanged |
| Creates no second assistant | ✅ No conversational surface added |
| Duplicates no conversation state | ✅ |
| Registered capabilities only, permission-aware | ✅ Ownership-scoped; `context.userId` only, never client-supplied |
| Honest gaps, not fabricated knowledge | ✅ Verified against a live database (§6) |

### DEC1 hard-boundary check (§3 D5)

| Boundary | Respected? |
|---|---|
| Never absorbs **Selection** | ✅ No route ranks a meal, compares a product or picks a swap. The three domain scorers were **deliberately left alone**. |
| Never gates or launders **Evidence** | ✅ |
| Never re-derives **Attention** | ✅ Producer-assigned priority passes through verbatim. |
| Never changes what may be **Acted** on | ✅ ConfirmationTier unchanged; the engine still decides. |
| Never **voices** | ✅ Behaviour Engine untouched. |
| Never routes **intent** | ✅ |

### OBS1 §7 check

Observation remains **write-only telemetry**. No route added by PHASE5B reads an observation. `OBS_DISABLE_CAPTURE=1` remains a functional no-op.

---

## 6. VERIFICATION

| Check | Result |
|---|---|
| **Typecheck gate** (`npm run typecheck:ci`) | ✅ **PASS** — no new type errors. Debt **shrank 175 → 168** (the 7 removed were all in the retired files). |
| **Full test suite** (`npm test`, ~70 suites) | ✅ **PASS** — exit 0. Includes DEC1, LEARN1, ATTN1, OD1, EL1, Notice Engine, COACH1, PLAN1, INT50, Observation, Behaviour, and all benchmark guards. |
| **Build** (`npm run build`) | ✅ **PASS** |
| **Manual behaviour — the closed loop, on a live database** | ✅ **PASS** (below) |

The loop was driven end to end through the real platform path:

```
DECISION  report  → 11 opportunities delivered, trust.resolved=true
          picked: shopping-restriction-conflict, domain=shopping, priority=critical
          evidence cited: ["shopping-list", "household-eaters"]     ← Rules E1 + A1 satisfied
EVIDENCE  before resolution: 0 events
ACTION    approve → ok, status="accepted"
EVIDENCE  after resolution:  1 event      → delta +1

          *** LOOP CLOSED — the terminal resolution emitted Evidence ***

PATTERN   search  → ok, 0 pending signals
          (a Pattern needs MIN_EVIDENCE_COUNT consistent events — 0 is correct, not a defect)
HONESTY   approve("does-not-exist") → status="gap", honest message, no fabricated success
```

Before PHASE5B that Evidence event **could not have been written by any code path in the product.**

> **Verification hygiene.** The run above wrote one real resolution to a real household. Because a household never actually made that decision, and because LEARN1 re-weights on exactly this evidence, **both writes were reverted** — the Evidence event was deleted and the delivery row restored to `delivered`/`resolved_at: null`. Confirmed back to the pre-verification state (household evidence 0; total 384; zero learning signals created).

---

## 7. FILES CHANGED

| File | Change |
|---|---|
| `server/routes.ts` | **+4 routes** (the ACTION stage + the Household Learning confirmation door); **−60 lines** of duplicated derivation; **−1** dead import |
| `server/lib/household-companion-fields.ts` | **New** — one pure owner for the four companion fields |
| `server/intelligence/bindings/uplift.ts` | **Retired** |
| `server/intelligence/handlers/uplift-read-handler.ts` | **Retired** |
| `server/intelligence/handlers/uplift-read-port.ts` | **Retired** |
| `server/tests/test-intelligence-uplift-binding.ts` | **Retired** (asserted a condition that could never pass) |
| `server/intelligence/conversation/service-composition.ts` | **Retired** |
| `server/intelligence/conversation/business-service-composition-registry.ts` | **Retired** |
| `server/intelligence/capabilities/planner-composition.ts` | **Retired** (directory now empty and removed) |
| `scripts/ci/typecheck-baseline.json` | Re-recorded: 175 → 168 |
| `docs/implementation/intelligence/PHASE5B_INTELLIGENCE_PLATFORM_ACTIVATION.md` | This record |

**No schema change. No engine created. No governing document amended.**

---

## 8. REMAINING GAPS BEFORE THE NEXT PHASE

Ordered by consequence.

### 1. No client affordance can resolve an opportunity (deliberate — scope lock)

The loop is closed **at the platform layer**: the routes exist, execute, and emit Evidence (proven in §6). But no mounted client surface calls them. `FoodOpportunitiesPanel` and `LearningSignalsPanel` are complete, their hooks match the routes exactly (`acknowledge`/`accept`/`dismiss`, `confirm`/`decline`), and **neither is mounted on any page**.

They were left unmounted deliberately. Mounting them is a **user-facing Experience change** requiring the UX Governance Checklist (`THA_EXPERIENCE_ARCHITECTURE.md` §18), the UI Governance Checklist (`THA_UI_ARCHITECTURE.md` §18) and a Product Registry update — and an ambient opportunity panel brushes PHASE5B's scope lock (*no proactive guidance*). **This is the first thing the next phase should do.**

Until then Household Learning is inert **in practice**, though no longer **by construction** — which is the whole difference PHASE5B made.

### 2. The closed loop has no regression guard

No benchmark or test case exercises `resolve → Evidence → Pattern → Confirmed Understanding → re-weight`. The loop was verified manually (§6) but nothing will catch its regression. **This is the highest-value test addition available**, and it should land before the panels are mounted.

### 3. The INT42 uplift-composition seam is now provably unreachable

`conversation-gateway.ts:595` gates a whole composition stage on `queryable.some(ri => ri.capability === "uplift")` — which is **permanently `false`**: no resolver emits `"uplift"` (`pattern-intent-resolver.ts:1211` deliberately aliases it to `food-intelligence`), and the `MEAL_HEALTHIER_COMPOUND` matcher its own comment names **does not exist anywhere in the repo**.

PHASE5B retired the uplift *capability binding* (§3.2) but **deliberately did not touch this seam**, because removing it means editing `test-int50-food-intelligence-composition.ts` — a **currently-passing test in the aggregate suite** that asserts the seam's pure function. Weakening a passing governing test is a decision an *activation* phase should not make unilaterally. The next phase must either build the matcher or retire the seam (`capability-composition.ts`, the gateway branch, the `"uplift"` member at `food-intelligence-composition.ts:95`, and the orphan `test-intelligence-capability-composition.ts`). See SUGGESTIONS.

### 4. `COMP4A4` documents code that never ran

`docs/investigations/intelligence/COMP4A4_COMPANION_RESPONSE_EXECUTION_TRACE.md:553/714/777` asserts *"planner-composition.ts working / Traces show composition stage runs"* and *"do not modify planner-composition.ts"*. **These claims are false** — that file had zero importers and never typechecked, and PHASE5B has now deleted it. The document should be corrected so a future reader is not misled by it.

---

## 9. SUGGESTIONS — proposed architecture evolution (recorded only, NOT implemented)

Per the workstream's own rule, nothing below was built. Each requires its own approval.

1. **A second opportunity producer, done honestly.** The only compliant routes are (a) a new generator inside `opportunity-engine.ts` — its `FoodOpportunityType` union is the documented seam — or (b) a new *Domain Intelligence* capability that computes its own attention and evidence. What is **not** compliant is enrolling `planner`/`pantry`/`shopping` directly: they are data owners, and giving them a `report` verb would put opportunity reasoning in the wrong layer (Rule FI1) and require fabricating attention and citations (Rules A1/E1).

2. **Resolve INT42.** Either build the `MEAL_HEALTHIER_COMPOUND` matcher and register an `uplift` capability properly, or retire the seam entirely (gap 3 above). It cannot stay permanently dead *and* test-guarded.

3. **One diet vocabulary.** `recommendation-service.ts:12-18` and `meal-scoring-service.ts:55-71` carry **overlapping but divergent** diet-keyword tables. The *vocabulary* is the duplicate, not the scorers. `recommendation-service.ts` has **zero test coverage** and backs `GET /api/meals/recommended`, so tests must land before any convergence.

4. **Ambient surfacing convergence — a product question, not a cleanup.** The `opportunity` field in `deriveHouseholdCompanionFields` is a food-*discovery* suggestion outside the Decision Engine's lifecycle (no attention, no evidence, no muting, no resolution). Routing it through the Decision Engine would change what households see and needs Experience/UI governance. DEC1 §7's rule — *"a workstream adding surfacing logic anywhere else must STOP"* — makes this worth a deliberate decision rather than drift.

---

## 10. SCOPE LOCK — HONOURED

| Forbidden by the brief | Status |
|---|---|
| Companion coaching | ❌ Not implemented |
| Proactive guidance | ❌ Not implemented — and the reason the two panels were left unmounted (gap 1) |
| Conversational experiences | ❌ Not implemented |
| New Insight / Recommendation engines | ❌ Not created — the gate in §1 |
