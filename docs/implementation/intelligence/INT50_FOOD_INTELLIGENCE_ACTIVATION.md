# INT50 — Food Intelligence Activation

**Status:** 🟢 IMPLEMENTED
**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** Additive, read-only composition seam in the one existing per-turn pipeline — no schema change, no new store, no write path; it changes which registered capability READS ground a food turn.
**Builds on:** [`INT42_CAPABILITY_COMPOSITION_FOUNDATION.md`](./INT42_CAPABILITY_COMPOSITION_FOUNDATION.md) (the sequential composition seam this generalises) · [`INT33_INTELLIGENCE_CAPABILITY_ORCHESTRATION_IMPLEMENTATION.md`](./INT33_INTELLIGENCE_CAPABILITY_ORCHESTRATION_IMPLEMENTATION.md) (parallel compound matchers) · [`INT18_CONTEXT_COMPOSITION_ENGINE_IMPLEMENTATION.md`](./INT18_CONTEXT_COMPOSITION_ENGINE_IMPLEMENTATION.md) (INT17 CCE)
**Governing architecture:** [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) · [`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) · [`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md) · [`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`](../../architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md) · [`THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`](../../architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md) · [`THA_OBSERVATION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md) · [`THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md`](../../architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md) · [`ARCHITECTURE_PRINCIPLES.md`](../../architecture/ARCHITECTURE_PRINCIPLES.md) · [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](../../architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md)
**Tests:** `npm run test:int50-food-intelligence-composition` (21 assertions, new, in the `npm test` chain).

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-int50-food-intelligence-activation-20260709` → `7508b399e8d1d07c3f83f7b65c1b28f6edc7cbd7` |
| Working tree at start | Intentionally dirty — uncommitted KNOW4 work from a prior session (`FoodReport.tsx`, `food-intelligence-assembler.ts`, `meal-intelligence-assembler.ts`, `routes.ts`, `food-report-adapter.ts`, `shared/knowledge/*`, `package.json`, plus KNOW4's new files) was present before this workstream began and is untouched, except that `package.json`'s (single-line) `test` chain now carries both KNOW4's and INT50's entries |
| This task's writes | See §6 Files changed |
| Rollback to committed state | `git checkout rollback/before-int50-food-intelligence-activation-20260709` (also reverts the unrelated KNOW4 working-tree changes — see the per-file commands in ROLLBACK PLAN below for an INT50-only rollback) |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (via governed-constraint review)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (via governed-constraint review)
- [x] All nine Intelligence/Food/Context/Observation/Behaviour governing documents listed above
- [x] `docs/implementation/intelligence/INT42_CAPABILITY_COMPOSITION_FOUNDATION.md` and `INT33_INTELLIGENCE_CAPABILITY_ORCHESTRATION_IMPLEMENTATION.md` (the composition precedents)

---

## 1. Objective — and how the governing architecture shaped it

The mission: activate the existing Food Intelligence Platform so the Companion **composes answers across existing capabilities instead of answering from a single source** — reasoning across sources, explaining recommendations, reusing existing services, respecting canonical ownership, returning honest gaps.

The governing architecture pins down exactly one compliant shape for this:

- **INT17 (CCE) §0/§7** — no component other than the one Context Composition Engine may serialise, truncate, order, or budget what the model reads. So INT50 must not "compose the prompt"; it may only decide **which registered capability reads are worth asking**, and hand their Full Results to the one CCE like every other result.
- **TIP1 §5 / TIP2 §1** — every orchestrated action must be a registered `(verb × capability)` pair through the one Intent Engine; no business logic in routing; no freeform execution. So INT50 executes only registered reads through the gateway's existing `queryCapability` seam.
- **Food Intelligence §2** — Domain Intelligence never contains cross-domain orchestration or conversation state; per-turn cross-capability composition is the **Conversation Gateway's** job ("the one existing seam already trusted to compose across capabilities per turn", §4.4). So INT50 lives in `server/intelligence/conversation/`, beside the INT42 seam it generalises — not inside the Food Intelligence engine.
- **TIP3 §5 / R1** — context is derived per turn and discarded; no second conversation or context store. INT50 is a pure function over this turn's own first-wave results.
- **Observation Engine §7** — nothing user-facing may read an observation. INT50 *emits* composition telemetry (via its I/O-performing caller); it reads none back.
- **Behaviour Engine §0** — all phrasing stays with the Behaviour Engine; INT50 contributes facts (capability Full Results), never words.

**Result:** INT50 is the *general* pre-response composition seam INT42 explicitly named as future work ("Remaining orchestration gaps" §5.1), built as the same kind of pure module in the same gateway slot — activating the platform's existing food-knowledge capabilities as a composed, multi-source grounding for every food conversation.

## 1.1 How the mission's named sources participate (each through its governed interface)

| Mission source | How it participates in INT50 |
|---|---|
| Canonical Food Knowledge | The **trigger**: a turn grounded by `food-intelligence` / `nutrition-knowledge` / `uplift` / `opportunity-delivery` / `nutrition-discovery` (all existing registered capabilities over the WS0/NK1 canonical stores) marks the turn as a food conversation |
| Household | Composed **always** on food-grounded turns: `household/read {scope:"dietary-context"}` — the household owner's own aggregated restrictions/diet-pattern projection (safety before relevance) |
| Pantry | Composed on recommendation-shaped turns: `pantry/read {scope:"list"}` — connect recommendations to what the household already has |
| Planner | Composed on recommendation-shaped turns **only when the surface supplied an active week id** — the planner owns no calendar mapping and INT50 never guesses a week (Principle 6) |
| Shopping | Composed on recommendation-shaped turns: `shopping/read {scope:"list"}` — connect recommendations to what is already on the list |
| User Goals | Already composed on **every** turn: the resolver's always-on `profile/read` baseline carries `preferences.healthGoals`, pinned by the native `profile:read` Context View. INT50 derives nothing — deriving it again would create a second read path to the same fact |
| Observation Engine | Participates as the **observer**, never a source: the gateway records each composition decision (capability + deterministic reason) on the existing `knowledge-retrieval` observation's metadata. Reading observations to shape output is a hard stop (Observation Engine §7) — the mission's "compose from the Observation Engine" is honoured through its governed interface: capture, not read |
| Behaviour Engine | Participates as the **voice**, exactly as it already does: it phrases the multi-source answer; INT50 adds no phrasing anywhere (Behaviour Engine §0 hard stop) |
| Explainability | Three governed planes: (1) the composed context reaches the model with ids/provenance preserved by the CCE, and the existing prompt rules ("SYNTHESISE", "EXPLAIN THE WHY") make the Companion connect and explain across them; (2) Food Intelligence's own cited `explain`/`recommend` results remain the source-referenced knowledge plane; (3) every composition decision carries a deterministic `reason` surfaced to operators via telemetry. The standalone `explainability-service.ts` (pure helper over `ScoredCandidate`s) is **not** composable here without inventing scoring inputs — an honest gap, recorded in Scope Lock |

---

## 2. What was implemented

### 2.1 `server/intelligence/conversation/food-intelligence-composition.ts` (new, pure)

One decision function and one shaping helper — structurally the INT42 pattern (`capability-composition.ts`), generalised from one named chain to the food-conversation context rule:

```ts
deriveFoodContextQueries(firstWave: readonly FirstWaveQuery[], hints): ComposedContextQuery[]
toBaselineContextIntent(query: ComposedContextQuery): ResolvedIntent
```

- **Input is shape, not payload:** `{capability, verb, baseline, okData}` per first-wave query. The module joins nothing, parses no result, asserts no fact.
- **Trigger:** at least one **routed** (non-baseline) capability from the closed food-knowledge set produced `ok-data`. Baseline reads and gaps never trigger. Non-food turns return `[]` — the pipeline is unchanged byte-for-byte.
- **Derivations:** household dietary-context always; pantry/planner/shopping only when the turn is recommendation-shaped (a food capability fired with verb `recommend`/`report`); planner only with a surface-supplied active week id.
- **Never overwrites:** any capability the resolver already routed this turn is skipped (the INT42 rule).
- **Every derived query carries a deterministic `reason`** — the explainability record for operators.
- **Derived intents are `baseline: true`, confidence 0.45** (below the profile baseline's 0.50): grounding, never "understanding". They therefore never count as routing, never flip INT35 turn classification, never enter discoveries/guidance/enrichment sources, and never claim the INTQ8 primary outcome — all enforced by the existing pipeline's own `baseline` filters, unchanged.

### 2.2 `conversation-gateway.ts` — the INT50 second wave

Inserted immediately after the INT42 sequential block, before turn description/classification: derive → execute each derived intent through the **same `queryCapability` seam** (so each is a registered `(verb × capability)` invocation via `intelligencePlatform.handle`, permission-checked by the Intent Engine, and observed as a normal capability invocation) → merge into the same `queryResults`/`queryable` the rest of the unchanged pipeline reads. Knowledge assembly, enrichment, the INT17 CONTEXT DATA block, and the LLM's grounding all see the composed sources automatically. The system prompt, CCE, and Behaviour Engine are untouched.

The existing `knowledge-retrieval` observation's free-form metadata now additionally carries `composedContext: [{capability, reason}]` — telemetry only, nothing reads it back, empty on every non-food turn. No new observation `kind` (extending that closed taxonomy is an architecture decision INT50 does not take).

### 2.3 Runtime shape

```
User: "What fibre-rich foods should I add?"

Wave 1 (resolver, unchanged):   food-intelligence/recommend {scope:"nutrient", slug:"fibre"} → ok-data
                                profile/read (always-on baseline, carries healthGoals)       → ok-data
        │
        INT42 seam (unchanged): nothing to derive here
        │
Wave 2 (INT50, baseline-only):  household/read {scope:"dietary-context"} → ok-data (nut allergy, vegetarian)
                                pantry/read    {scope:"list"}             → ok-data (oats, chickpeas…)
                                shopping/read  {scope:"list"}             → ok-data
                                planner/read   {scope:"week", weekId}     → only when a week is in view
        │
        assembleKnowledge → INT17 composeContext (one budget, balance guarantee)
        → LLM answers from SIX owners' data → Behaviour Engine voice
```

The Companion's answer can now honestly say *which* fibre foods suit **this** household (restrictions), note what is already in the pantry or on the list, and connect to the visible plan — with every fact still owned, projected, and cited by its own capability.

---

## 3. ARCHITECTURE COMPLIANCE CHECKLIST

```
☑ One canonical identity
  No entity is created or re-keyed. All entities (foods, households, pantry items,
  planner weeks, shopping items) flow through their existing capabilities' own ids.

☑ One owner per fact
  INT50 owns zero facts. Household restrictions stay with Household, pantry contents
  with Pantry, plans with Planner, lists with Shopping, food knowledge with the
  WS0/NK1 registries — each projected by its own registered read handler.

☑ No duplicate entities
  Nothing new is stored or modelled. The one new concept (ComposedContextQuery) is a
  transient per-turn value, discarded with the turn.

☑ No duplicate ownership
  No attribute gains a second owner. INT50 passes each owner's Full Result through
  untouched; the CCE remains the single owner of prompt composition.

☑ No duplicate state
  No state at all — pure function; nothing persisted; nothing cached across turns
  (TIP3 §5: context is rebuilt every turn and discarded).

☑ Extends existing architecture
  Generalises the INT42 seam in the same gateway slot with the same module pattern;
  reuses the resolver's existing `baseline` vocabulary (the always-on profile read);
  executes through the existing queryCapability → intelligencePlatform.handle path.

☑ Progressive enrichment where appropriate
  Not a knowledge entity; transactional per-turn derivation — no enrichment added.

☑ Honest gaps over fabricated information
  No week id → no planner query (never guessed). A derived read that returns a gap
  (e.g. no household membership) stays a gap in the pipeline's existing honest
  vocabulary. Non-food turns compose nothing. explainability-service.ts is named as
  not-composable rather than force-fitted.

☑ No permanent synchronisation bridge
  No bridge. Reads only, per turn, from each single owner.

☑ Evolution over replacement
  Nothing replaced. INT42's seam remains, unchanged, for its dependent-parameter
  chain; INT50 adds the context-composition rule beside it.
```

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform    — every derived query executes via
                                                intelligencePlatform.handle
✓ Uses the Capability Registry                — only registered capabilities/verbs
                                                (household, pantry, planner, shopping reads)
✓ Uses the Intent Engine                      — LOCATE→VALIDATE→PERMISSION→INVOKE
                                                pipeline unchanged for every derived query
✓ Reuses existing business services           — each read handler delegates to its
                                                existing owning service via its port
✓ Does not create another assistant           — no new prompt, voice, or runtime;
                                                one gateway, one LLM call per turn
✓ Does not duplicate conversation state       — pure per-turn derivation, nothing stored
✓ Uses registered capabilities only           — closed capability/verb lists; no
                                                freeform execution, no raw storage reads
✓ Uses permission-aware access                — same IntelligenceContext identity;
                                                own-household scoping enforced by handlers
✓ Produces honest gaps rather than fabricated — no guessed week, no fabricated
  knowledge                                     household, gaps flow through unchanged
```

---

## 4. DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Intelligence (composition only), Household, Pantry, Planner,
                 Shopping (each read-only via its registered capability)
Declared SoT: unchanged for every domain — Household (households/household_members/
              household_eaters), Pantry (userPantryItems), Planner (planner_weeks/
              planner_days/planner_entries), Shopping (shopping_list/
              shopping_list_extras), Food Knowledge (WS0 registry / knowledge_* / 
              shared/knowledge)
New store created? NO
Existing store extended? NO
Consumer created? YES — the gateway's INT50 seam is a new READ consumer
  Reads from declared SoT? YES — exclusively through each domain's registered
  read capability, which delegates to the owning service
```

## 4a. DATA IMPACT

- Reads existing data: **YES** (via registered read capabilities only)
- Writes new data: **NO** (one free-form metadata field added to an existing telemetry observation)
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

## 4b. TRUST CHECK

- **Could this mislead the user?** No new claim is generated anywhere. The model sees more of the user's own data (each piece projected by its owner) and remains bound by the unchanged HARD RULES 1–5. Risk considered: composed context could crowd the 600-token budget — the CCE's existing balance guarantee and relevance ranking own that decision, unchanged, and derived sections rank behind utterance-driven ones (lower confidence, later resolver order).
- **Could this fabricate certainty?** No. Derived reads that gap stay gaps; the planner is never guessed; non-food turns are untouched.
- **Is anything guessed but shown as real?** No. The recommendation-shaped/informational distinction is a closed verb-set lookup, not a semantic guess; when wrong in the conservative direction the answer simply has tighter context.
- **What happens if the system is wrong?** Worst case: an extra own-data read is composed whose context the CCE ranks low — the answer degrades to exactly the pre-INT50 answer, never below it.
- No architectural duplication introduced: **YES (none)**
- No new source of truth created: **YES (none)**
- No runtime behaviour altered (governance-only): **N/A — this is a runtime change**, scoped to which registered reads ground a food turn.

---

## 5. VALIDATION PERFORMED

- **New suite:** `npm run test:int50-food-intelligence-composition` — 21 assertions across §1 pure derivation (triggering, shaping, honest gaps, never-overwrite), §2 baseline vocabulary, §3 end-to-end gateway wiring (composed second wave fires, is baseline-excluded from the routed `resolvedIntent`, is absent on non-food turns, never double-queries). All pass.
- **Full chain:** `npm test` (the full suite chain, including KNOW4's uncommitted suite) — exit 0, zero failures, run after all INT50 changes on 2026-07-09.
- **Typecheck:** `npx tsc --noEmit` — zero errors in every file this workstream touched. The repository baseline of pre-existing errors (190 lines, all in untouched `server/tests/*`/`server/scripts/*` files, e.g. `test-intelligence-compound-resolver.ts`, the `*-discovery-binding` suites) is unchanged before/after.
- One test-design correction during the run: the "no planner week" end-to-end case originally used a user with real planner weeks in the live DB — the context-frame assembler's *existing* fallback (surface hint → entity ref → first stored week) correctly resolved a week and INT50 correctly read it. The test now uses a data-free user id; the behaviour was right, the fixture was wrong.

## 5a. MANUAL VERIFICATION STEPS

1. Sign in and open the Companion (floating surface).
2. Ask an **informational** food question: *“what is vitamin K good for?”* → expect the usual cited answer; if your household has restrictions/diet patterns, the reply may acknowledge them. In the admin Observation dashboard (`/api/intelligence/observation/*` surfaces), the turn's `knowledge-retrieval` observation metadata shows `composedContext: [{capability: "household", …}]`.
3. Ask a **recommendation** question: *“what fibre-rich foods should I add?”* → expect the answer to connect recommendations to your own context (e.g. restrictions respected; pantry/list items acknowledged when relevant). The same observation now lists household + pantry + shopping (+ planner only if you asked from the planner page with a week open).
4. Ask from the **planner page** with a week open → `composedContext` additionally lists planner, and the answer can reference the visible week.
5. Ask a **non-food** question: *“what's on my shopping list?”* → `composedContext` is empty; behaviour is exactly pre-INT50.
6. Negative check (honest gap): with an account that has no household membership, ask a food question → the answer must not fabricate a household; the household read records an honest gap in the turn's queried statuses.

---

## 6. Files changed

| File | Change |
|---|---|
| `server/intelligence/conversation/food-intelligence-composition.ts` | **New** — the pure INT50 composition seam (decision + baseline-intent shaping) |
| `server/intelligence/conversation/conversation-gateway.ts` | + import; + INT50 second-wave block between the INT42 seam and turn description; + `composedContext` metadata on the existing `knowledge-retrieval` observation |
| `server/tests/test-int50-food-intelligence-composition.ts` | **New** — 21 assertions |
| `package.json` | + `test:int50-food-intelligence-composition` script, added to the `test` chain |
| `docs/implementation/intelligence/INT50_FOOD_INTELLIGENCE_ACTIVATION.md` | **New** — this document |

Nothing else: no schema, no bindings, no handlers, no registry entries, no resolver matchers, no prompt text, no CCE/Behaviour/Observation engine code, no client code.

---

## 7. ROLLBACK PLAN

- **Rollback identifier:** `rollback/before-int50-food-intelligence-activation-20260709` → `7508b399e8d1d07c3f83f7b65c1b28f6edc7cbd7`
- **Files modified:** the five files in §6 only.
- **INT50-only rollback commands** (preserves the unrelated, uncommitted KNOW4 work):
  ```bash
  git checkout HEAD -- server/intelligence/conversation/conversation-gateway.ts
  rm server/intelligence/conversation/food-intelligence-composition.ts
  rm server/tests/test-int50-food-intelligence-composition.ts
  rm docs/implementation/intelligence/INT50_FOOD_INTELLIGENCE_ACTIVATION.md
  # package.json is shared with uncommitted KNOW4 work — remove only the two INT50
  # lines by hand (the "test:int50-food-intelligence-composition" script entry and
  # its "&& npm run test:int50-food-intelligence-composition" chain segment).
  ```
- **Verification after rollback:** `npx tsc --noEmit` shows only the pre-existing baseline; `npm test` passes; a Companion food question grounds exactly one capability again (check the `knowledge-retrieval` observation has no `composedContext` key).

---

## 8. SCOPE LOCK

**Implemented:**
- The INT50 Food Intelligence composition seam (pure module + gateway second wave + telemetry metadata), 21 new automated assertions, this document.

**Explicitly excluded (honest gaps, not implemented):**
- **No general declarative orchestration planner** (INT42 §5.1's `OrchestrationPlan`) — INT50 is the second named consumer of the seam pattern, still rule-shaped, not engine-shaped.
- **No `explainability-service.ts` composition** — it consumes `ScoredCandidate`s that only the meal-scoring flow produces; wiring it here would mean inventing scoring inputs (fabrication). Its role is served by the CCE's provenance preservation + Food Intelligence's cited explains.
- **No Observation Engine reads** — hard stop (§7); composition decisions are captured, never consumed.
- **No new `pantry:read` Context View spec** — pantry grounding flows through the CCE's generic derivation today. A native spec would improve its projection, but `pantry:read` is pinned as the canonical *generic* exemplar across three NCV1 test suites (`NATIVE_CONTEXT_VIEW_KEYS.length === 7` etc.); flipping it is an NCV1-follow-up decision, not INT50's.
- **No new observation `kind`** — the closed taxonomy is untouched; composition telemetry rides existing kinds' free-form metadata.
- **No resolver/matcher, prompt, benchmark-fixture, or write-path changes.**

**SUGGESTION (observed, not implemented — needs approval):**
- `package.json`'s committed `test` chain no longer contains INT42's documented `test:intelligence-uplift-binding` / `test:intelligence-capability-composition` scripts (both test files still exist and INT42's doc records them as added) — an apparent regression predating INT50, worth restoring in a housekeeping change.
- The benchmark harness still hardcodes `surfaceHints: {}` (INT42 §5.2), so planner-week-gated composition is invisible to the corpus — the same fixture-format extension INT42 named would let the benchmark exercise INT50's planner leg.
