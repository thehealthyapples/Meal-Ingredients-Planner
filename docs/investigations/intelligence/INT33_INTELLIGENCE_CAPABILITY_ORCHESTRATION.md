# INT33 — Intelligence Capability Orchestration

**Status**: Investigation (RED) — no implementation  
**Date**: 2026-07-01  
**Scope**: How the THA Intelligence Platform should combine existing discovery capabilities into one coordinated answer for cross-domain questions  
**Constraint**: Do not create another assistant. Do not duplicate business logic. Do not duplicate state. Do not change source-of-truth ownership.

---

## ARCHITECTURE COMPLIANCE GATE

Before designing anything, the proposal is validated against THA's governing principles.

| Principle | Compliance | Verdict |
|-----------|-----------|---------|
| One canonical identity per entity | Orchestration introduces no new entities. A cross-domain question is still a transient request object, not a stored entity. | ✅ Pass |
| One owner per fact | The orchestrator reads from existing capability owners. It re-uses results already fetched through the capability layer — it does not own or copy data. | ✅ Pass |
| No duplicate business logic | The orchestrator sequences existing `platform.handle()` calls. It performs no planner logic, nutrition logic, or pantry logic of its own. | ✅ Pass |
| No duplicate state | Results are passed in-memory within one request/response cycle. Nothing is persisted by the orchestration layer. | ✅ Pass |
| No permanent synchronisation bridge | No new tables, no new derived stores. Results are consumed in the same turn they are fetched. | ✅ Pass |
| No fabricated knowledge | The LLM still receives only data produced by capability handlers. The orchestrator adds no data of its own. | ✅ Pass |
| Extend existing architecture | The machinery for parallel multi-capability execution already exists in the gateway. The proposal adds to it, not alongside it. | ✅ Pass |
| Progressive enrichment | Each level of orchestration is additive. Level 1 adds compound patterns. Level 2 adds sequential chaining. The gateway's single-intent path remains unchanged. | ✅ Pass |

**Gate result: PASS.** The investigation continues.

---

## 1. EXECUTIVE SUMMARY

**The good news**: the gateway already supports multi-capability coordination. `buildGroundedResponse()` calls `Promise.all()` on every resolved intent and feeds all results to the LLM as separate context sections. Multi-capability parallel reads are architecturally operational today.

**The gap**: the `PatternIntentResolver` has no compound matchers. Cross-domain questions resolve to at most one capability — the one with the highest confidence among single-domain matchers. The orchestration machinery is ready; the resolver is not generating the compound intent lists it needs.

**The sequential gap**: for questions where the output of one capability call must become the input parameters of the next (e.g. "do I already have the ingredients for my planned meals?"), neither compound patterns nor parallel reads are sufficient. A sequential execution mechanism is needed. This is a distinct, deeper workstream.

**Recommendation**: INT33 = **Level 1 only** — compound matchers in `PatternIntentResolver`. The gateway requires zero changes. Level 2 (sequential orchestration) is documented as a gap for a future INT34.

---

## 2. CURRENT STATE ANALYSIS

### 2.1 What already works

```
PatternIntentResolver.resolve(utterance, hints)
  → ResolvedIntent[]   (up to MAX_INTENTS = 4, sorted by confidence)

ConversationGateway.buildGroundedResponse()
  → Promise.all(resolvedIntents.map(ri => queryCapability(ri, identity)))
  → capData: Record<capabilityId, JSONstring>   (one entry per capability)
  → LLM receives all entries as "### capabilityId\n{data}" context sections
```

The gateway already fans out to multiple capabilities in parallel. If the resolver returns `[planner-discovery, household-discovery]`, both are queried concurrently and both results land in the LLM context. **Multi-capability parallel reads require zero gateway changes.**

### 2.2 What is missing — Gap 1: no compound resolver patterns

The resolver has no matchers that target multiple capabilities simultaneously. For a cross-domain question:

```
"What meals can Lilly eat tomorrow?"
```

The resolver runs each single-capability matcher in sequence. The highest-confidence match wins. Today, this would match a single planner-discovery or household-discovery pattern — not both. The compound intent list `[planner-discovery/search, household-discovery/search]` is never generated.

### 2.3 What is missing — Gap 2: no sequential execution

For questions where data from one capability must flow into another:

```
"Do I already have the ingredients for this week's meals?"
```

Step 1 → `planner-discovery/search(query="")` → returns planned meal names  
Step 2 → `meals/search(query=<meal name from step 1>)` → returns ingredient lists  
Step 3 → `pantry-discovery/search(query="")` → returns pantry items  

Step 2's parameters are only known after Step 1 completes. `Promise.all` can't handle this. Neither can compound patterns — both produce statically-parameterised intents resolved before any capability is called.

### 2.4 Token budget constraint

`CAP_DATA_MAX_CHARS = 1800` per capability. With four capabilities each returning up to 1800 chars, the combined context section is ~7200 chars. This is within GPT-4o-mini's window but can be noisy. The LLM must reason across multiple unstructured JSON blobs — effective for simple cross-referencing; fragile for precise joins over large result sets.

---

## 3. THE FOUR EXAMPLE QUESTIONS — DISSECTED

### 3.1 "What healthy high-protein meals do I have planned this week?"

**Capabilities needed**: `planner-discovery` + `nutrition-discovery`  
**Relationship**: PARALLEL  
- `planner-discovery/search(query="")` → returns all planned meal names for the active planner week.  
- `nutrition-discovery/search(minProtein=20)` → returns meals exceeding a protein threshold.  
- LLM is given both result sets and reasons about the intersection: planned meals that are also high-protein.  

**Gap**: No compound matcher generates both intents. Today: routes to one or the other.  
**Level 1 fix**: A compound matcher targeting "high-protein + planned" generates both intents in one resolver call.  
**Residual limitation**: If a planned meal appears in `planner-discovery` by name but the meal's nutrition data is not in the LLM context (because `nutrition-discovery` only returns meals it has nutrition for), the intersection may be incomplete. The LLM reasons across two separate JSON blobs with no guaranteed join key.

---

### 3.2 "What meals can Lilly eat tomorrow?"

**Capabilities needed**: `household-discovery` + `planner-discovery`  
**Relationship**: PARALLEL  
- `household-discovery/search(query="Lilly")` → returns Lilly's dietary profile (allergens, diet type, preferences).  
- `planner-discovery/search(query="tomorrow")` → returns meals planned for tomorrow.  
- LLM receives both and reasons about compliance: which planned meals satisfy Lilly's dietary constraints.  

**Gap**: No compound matcher.  
**Level 1 fix**: A compound matcher targeting a named household member + "eat/can eat/suitable for" generates `[household-discovery/search(query=<name>), planner-discovery/search(query="tomorrow")]`.  
**Residual limitation**: The LLM must know Lilly's allergens and the planned meals' allergens. `planner-discovery` returns meal names, not allergen data. The LLM can only assess compliance if it has prior knowledge of the meal's allergen profile, or if `meals/read` data is also fetched. This is a join the LLM must approximate from incomplete data.

---

### 3.3 "Do I already have the ingredients for this week's meals?"

**Capabilities needed**: `planner-discovery` → `meals/search` → `pantry-discovery`  
**Relationship**: SEQUENTIAL — step 2 parameters depend on step 1 results  

- Step 1: `planner-discovery/search(query="")` → extracts the list of planned meal names.  
- Step 2: `meals/search(query=<each planned meal name>)` → retrieves ingredient lists for each planned meal. Parameters for step 2 are not known until step 1 completes.  
- Step 3: `pantry-discovery/search(query="")` → retrieves the pantry inventory.  
- LLM compares the ingredient requirements from step 2 against the pantry contents from step 3.  

**Gap**: This requires sequential execution. Neither compound patterns nor parallel reads produce the correct result.  
**Level 1 partial mitigation**: A compound matcher returns `[planner-discovery/search(query=""), pantry-discovery/search(query="")]` in parallel. The LLM receives planned meal names and pantry items, but lacks ingredient lists per meal. The LLM can only make a rough assessment ("you have pasta planned and pasta is in your pantry") not an ingredient-level audit. This is a degraded but honest answer.  
**Full solution**: Requires Level 2 sequential orchestration — scoped out of INT33.

---

### 3.4 "What should I buy for low-carb dinners?"

**Capabilities needed**: `nutrition-discovery` + `pantry-discovery` + `shopping-discovery`  
**Relationship**: PARALLEL  
- `nutrition-discovery/search(maxCarbs=X, mealType="dinner")` → returns low-carb dinner meals.  
- `pantry-discovery/search(query="")` → returns pantry inventory.  
- `shopping-discovery/search(query="")` → returns the current shopping list.  
- LLM synthesizes: "here are low-carb dinner ideas; here's what you already have; here's what's already on your list; here's what you might want to add."  

**Gap**: No compound matcher.  
**Level 1 fix**: A compound matcher generates all three intents. The gateway executes all in parallel. The LLM has three complete data sets and can synthesize a purchasing recommendation.  
**Token budget note**: Three capabilities at up to 1800 chars each = 5400 chars context. Within budget for a focused query with reasonable result set sizes.

---

## 4. LEVEL 1 DESIGN — COMPOUND MATCHERS

### 4.1 What changes

**One file only: `server/intelligence/pattern-intent-resolver.ts`**

Nothing else changes. Not `types.ts`, not `intent-resolver.ts`, not `intent-engine.ts`, not `intelligence-platform.ts`, not `conversation-gateway.ts`, not any binding, handler, port, or engine.

### 4.2 New type: `CompoundMatcher`

The existing `Matcher` type returns a single intent or null:
```ts
type Matcher = (utterance: string) => ResolvedIntent | null;
```

A new sibling type returns an array of intents or null:
```ts
type CompoundMatcher = (utterance: string) => ResolvedIntent[] | null;
```

This is an additive type — no changes to `Matcher` or the existing single-domain matcher arrays.

### 4.3 New array: `ALL_COMPOUND_MATCHERS`

A dedicated array of `CompoundMatcher` instances, each targeting a recognisable cross-domain question pattern. Each entry returns 2–3 `ResolvedIntent` objects with distinct capability IDs. Confidence values are tuned slightly lower than single-domain matchers to acknowledge the inherent ambiguity of multi-domain resolution.

### 4.4 Resolver pipeline change

Currently:
```
1. Run ALL_SPECIFIC_MATCHERS (single domain)
2. Surface-primary fallback
3. Keyword fallbacks
4. Profile always-on
5. Deduplicate (keep highest confidence per capability)
6. Sort, cap at MAX_INTENTS = 4
```

With compound matchers:
```
0. Run ALL_COMPOUND_MATCHERS first — if any match, their intents enter the pool
1. Run ALL_SPECIFIC_MATCHERS (single domain) — enrich/override if higher confidence
2. Surface-primary fallback
3. Keyword fallbacks
4. Profile always-on
5. Deduplicate (keep highest confidence per capability) — already handles correctly
6. Sort, cap at MAX_INTENTS = 4
```

**Why compound matchers run first**: they are pattern-specific and high-confidence for their targeted question shapes. They pre-populate the intent pool for the deduplication step.

**Why single-domain matchers still run**: they may contribute higher-confidence supplementary intents (e.g. profile always-on) and the deduplication step ensures no duplication per capability.

**Deduplication is already correct**: the existing deduplication keeps the highest-confidence intent per capability. Since compound matchers return DISTINCT capabilities, there is no structural conflict. If both a compound matcher and a single-domain matcher target the same capability, the higher-confidence one wins.

### 4.5 Compound pattern coverage

| Question pattern | Compound match generates |
|-----------------|-------------------------|
| High-protein / high-fibre / low-carb + "this week" / "planned" | `nutrition-discovery/search(threshold)` + `planner-discovery/search(query="")` |
| "Can [name] eat [X]?" / "What's suitable for [name]?" | `household-discovery/search(query=<name>)` + `planner-discovery/search(query="")` |
| "Do I have [ingredient] / the ingredients?" + "this week" / "planned" / "my meals" | `planner-discovery/search(query="")` + `pantry-discovery/search(query="")` |
| "What should I buy for [diet type] dinners/meals?" | `nutrition-discovery/search(diet/macro)` + `pantry-discovery/search(query="")` + `shopping-discovery/search(query="")` |
| "What's in my pantry that's [healthy/low-carb/high-protein]?" | `pantry-discovery/search(query="")` + `nutrition-discovery/search(threshold)` |
| "Have I eaten [food] this week?" / "What did I log?" + nutrition context | `diary-discovery/search(query=<food>)` + `nutrition-discovery/search(query=<food>)` |

### 4.6 MAX_INTENTS boundary

`MAX_INTENTS = 4` already accommodates up to 4 intents per turn. A compound match generating 2–3 intents plus the profile always-on intent stays within this limit. If a compound match generates 3 intents, the profile always-on (confidence 0.50) may be displaced by the sort-and-cap step — this is acceptable behaviour (the compound match carries more relevant context).

### 4.7 CAP_DATA_MAX_CHARS

The existing 1800 char per-capability limit applies to each capability result individually. With 2 capabilities at 1800 chars each, the combined context section is ~3600 chars — well within the current prompt budget. With 3 capabilities at 1800 chars, ~5400 chars. This is acceptable but warrants monitoring for large result sets. If the per-turn context budget becomes a concern in a future INT, the limit can be reduced proportionally for compound turns.

### 4.8 What the LLM receives (example: question 3.2)

```
CONTEXT DATA:

### household-discovery
{"scope":"member-search","query":"Lilly","totalCount":1,"results":[{"name":"Lilly","dietType":"vegetarian","allergens":["gluten"],...}],"source":"household-discovery"}

### planner-discovery
{"scope":"planner-search","query":"tomorrow","totalCount":3,"results":[{"mealName":"Lentil Dahl","dayLabel":"Wednesday",...},...],"source":"planner-discovery"}
```

The LLM is instructed to answer only from provided context. With Lilly's dietary profile and tomorrow's planned meals both present, it can make a reasonable compliance assessment. The response will be honest about any information it cannot determine (e.g. if allergen data is absent from the planner entry).

---

## 5. LEVEL 2 DESIGN — SEQUENTIAL ORCHESTRATION (future scope, not INT33)

### 5.1 Why it's out of scope for INT33

Sequential orchestration requires:
- A new `OrchestrationPlan` return type from the resolver (a change to `intent-resolver.ts` types)
- A `executeOrchestrationPlan()` helper in the gateway that sequences `platform.handle()` calls and extracts output fields as parameters for subsequent steps
- Compound pattern matchers that can declare parameter dependencies between steps

This is a meaningfully larger surface area than Level 1. The governing principle "smallest safe change" argues for implementing Level 1 first, validating that it satisfies the example questions adequately, and only building Level 2 if Level 1's degraded partial answers are insufficient.

### 5.2 Shape of Level 2 (if implemented)

```ts
// In intent-resolver.ts — additive type, no changes to existing types
interface OrchestrationStep {
  readonly intent: ResolvedIntent;
  /**
   * Optional: extract a value from a prior step's result to use as a
   * parameter in this step. The step at priorStepIndex must have completed.
   * extractPath is a dot-notation path into the prior step's result JSON.
   * injectAs is the parameter key this value is injected as.
   */
  readonly dependsOn?: {
    readonly priorStepIndex: number;
    readonly extractPath: string;       // e.g. "results[*].mealName"
    readonly injectAs: string;          // e.g. "query"
  };
}

interface OrchestrationPlan {
  readonly steps: readonly OrchestrationStep[];
}
```

The `ResolvedIntent` interface would gain an optional `orchestrationPlan` field. When present, the gateway calls `executeOrchestrationPlan()` instead of running the individual intents through `Promise.all`.

The `executeOrchestrationPlan()` helper:
1. Executes steps in declared order.
2. After each step, extracts the specified field from the result using the `extractPath`.
3. Injects the extracted value as a parameter into the next step's intent before calling `platform.handle()`.
4. Collects all results into the `capData` map as usual.
5. Swallows individual step failures (same contract as `queryCapability()`).

**Ownership**: `executeOrchestrationPlan()` lives in the gateway (it is orchestration, not a business service). It holds zero business logic — it only sequences platform calls and extracts values from their results using declared paths.

### 5.3 Example — "Do I already have the ingredients for this week's meals?"

```
Step 0: planner-discovery/search(query="") → result: {results: [{mealName: "Chicken Curry"}, ...]}
Step 1: meals/search(query=<extracted from step 0: results[0].mealName>) → result: {results: [{name: "Chicken Curry", ingredients: [...]}]}
Step 2: pantry-discovery/search(query="") → result: {results: [{name: "Coconut Milk", ...}, ...]}
```

LLM receives three context sections and can make a complete ingredient-level assessment.

**Limitation**: `extractPath` on an array (e.g. `results[*].mealName`) would produce multiple values, requiring the gateway to make multiple platform calls for step 1 — one per meal. This is a fan-out pattern that requires additional design (loop over step 1 N times, one per extracted value). This adds further complexity and is a reason to keep Level 2 as a separate investigation.

---

## 6. RISK REGISTER

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **R1 — LLM join quality**: The LLM may fail to correctly cross-reference two large JSON blobs (e.g. planned meals vs nutrition data), producing an imprecise or incomplete answer. | Medium | Low | Level 1 is explicitly "best-effort parallel read + LLM reasoning." The LLM is instructed to say "I don't have that information" when the data doesn't permit a precise answer. This is acceptable for an advisory assistant. |
| **R2 — Compound matcher false positives**: A compound pattern may fire on an utterance where only one domain is truly needed, fetching unnecessary capability data and inflating latency. | Low | Low | Compound matchers should require specific cross-domain signals (e.g. a named household member + "eat" + a day reference) rather than single broad keywords. Confidence should be tuned lower than single-domain matchers (0.80–0.88). |
| **R3 — Token budget stress**: Three capabilities × 1800 chars may crowd the LLM context, causing truncation or diluting the signal for any one capability. | Medium | Medium | CAP_DATA_MAX_CHARS per capability can be halved to 900 for turns where 3+ capabilities are active. This is a single-constant tuning in the gateway — no structural change. |
| **R4 — MAX_INTENTS displacement**: A 3-intent compound match may crowd out the profile always-on intent (confidence 0.50), losing personalisation context for the turn. | Low | Low | Profile always-on provides user diet/goal context. For compound cross-domain queries, the capability data is more valuable. Displacement is acceptable; if it becomes a problem, MAX_INTENTS can be raised from 4 to 5 for compound turns. |
| **R5 — Resolver complexity growth**: Adding compound matchers to `pattern-intent-resolver.ts` alongside the 1000+ existing lines risks the file becoming unmanageable. | Medium | Medium | Compound matchers live in a clearly delimited `ALL_COMPOUND_MATCHERS` section at the top of `ALL_SPECIFIC_MATCHERS`. If the file grows beyond ~1500 lines, the compound matchers can be factored into a sibling file `compound-intent-resolver.ts` imported by the main resolver. |
| **R6 — Sequential chain gap for example 3.3**: "Do I already have the ingredients?" gives a degraded answer at Level 1 (meal names vs pantry, without ingredient lists). | High | Medium | The degraded answer is honest. The LLM is constrained to answer only from provided context, so it will acknowledge the limitation. Level 2 resolves this. The degraded Level 1 answer is still more useful than the current state (no cross-domain resolution). |

---

## 7. WHAT IS NOT CHANGING

To be explicit about the boundaries of Level 1:

| Component | Changes? |
|-----------|---------|
| `server/intelligence/types.ts` | ❌ No |
| `server/intelligence/intent-resolver.ts` | ❌ No |
| `server/intelligence/intent-engine.ts` | ❌ No |
| `server/intelligence/intelligence-platform.ts` | ❌ No |
| `server/intelligence/capability-registry.ts` | ❌ No |
| `server/intelligence/conversation/conversation-gateway.ts` | ❌ No |
| `server/intelligence/conversation/context-frame-assembler.ts` | ❌ No |
| Any binding (`bindings/*.ts`) | ❌ No |
| Any handler (`handlers/*.ts`) | ❌ No |
| Any port or engine (`services/*.ts`) | ❌ No |
| `server/storage.ts` | ❌ No |
| Any schema (`shared/schema.ts`) | ❌ No |
| **`server/intelligence/pattern-intent-resolver.ts`** | ✅ Yes — compound matcher section added |

---

## 8. IMPLEMENTATION SCOPE (INT33 ONLY)

**Files to change**: 1 (`pattern-intent-resolver.ts`)  
**New files**: 0  
**Schema changes**: 0  
**New capabilities**: 0  
**New verbs**: 0  
**New bindings**: 0  
**New tests**: 1 (`test-intelligence-compound-resolver.ts`) — verifying compound patterns produce the correct multi-intent lists

**Test coverage required for each compound pattern**:
- Utterance matches compound pattern → correct array of `ResolvedIntent` objects returned
- Each intent in array targets a distinct capability
- Each intent's verb is executable on that capability
- Confidence values are within the declared range
- Non-matching utterances → compound matcher returns null, falls through to single-domain matchers
- `MAX_INTENTS` cap is respected in the full resolver output
- Profile always-on intent is still present when 2-intent compound match leaves room

**Level 2 scoping**: not INT33. If Level 1 answers are insufficient in practice, Level 2 is a separate, governed workstream (`INT34_SEQUENTIAL_ORCHESTRATION`) requiring a change to `intent-resolver.ts` types, a new `executeOrchestrationPlan()` helper in the gateway, and a more complex test suite.

---

## 9. RECOMMENDATION

**Implement INT33 as Level 1 (compound matchers in `PatternIntentResolver`) only.**

Rationale:
1. The gateway already supports multi-capability parallel execution — the gap is exclusively in the resolver, and closing it in one file is the smallest possible change.
2. Three of the four example questions (3.1, 3.2, 3.4) are fully addressable with parallel reads and LLM reasoning. The fourth (3.3) gets a degraded but honest Level 1 answer.
3. Zero changes to the platform, engine, registry, gateway, or any capability handler eliminates integration risk and keeps all existing tests passing without modification.
4. Level 2 (sequential chaining) is technically clean but materially larger in scope, risk, and test surface. It is the right candidate for a subsequent INT, not this one.
5. Compound matchers are fully unit-testable in isolation — deterministic, no storage reads, no platform calls — consistent with the established test pattern for the resolver.

**INT33 deliverable**: `pattern-intent-resolver.ts` with a new `ALL_COMPOUND_MATCHERS` section + `test-intelligence-compound-resolver.ts` with test coverage for all compound patterns. All 18 existing tests pass unchanged.
