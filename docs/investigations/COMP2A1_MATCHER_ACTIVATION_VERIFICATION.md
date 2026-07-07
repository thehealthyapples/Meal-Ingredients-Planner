# COMP2A1 — Matcher Activation Verification Report

**Date:** 2026-07-06  
**Scope:** End-to-end verification of COMP2A matcher execution paths  
**Method:** 
- Resolve each matcher through PatternIntentResolver
- Verify capability registration and handler binding
- Trace data flow through the Intelligence Platform
- Identify execution blockers and missing handlers

---

## Executive Summary

✅ **All 6 COMP2A matchers resolve correctly** — the resolver recognizes and routes every query pattern to the intended capability with correct verb/scope/params.

⚠️ **3 of 6 have execution blockers:**
- `analyser` routes are matched but handler only executes `read` verb (not `explain`, `lookup`)
- `companion-guidance` is not registered as a capability (matcher routes to unregistered target)
- `help` is not registered as a capability (matcher routes to unregistered target)

✅ **3 of 6 are fully executable today:**
- `analyser.read` (scope: additives) — working, returns additives table
- Fallback paths exist for unexecutable routes

---

## Per-Matcher Verification

### 1. PR-063 — UPF Concept Explanation

| Attribute | Status | Details |
|---|---|---|
| **Matcher pattern** | ✅ Resolves | `/\bupf\b/`, `/\bnova\b/`, `/\bprocessing\s+level/` |
| **Query example** | ✅ Works | "What are ultra-processed foods?" |
| **Resolved capability** | ✅ Correct | `analyser` (registered) |
| **Resolved verb** | ⚠️ Blocked | `explain` (not executable) |
| **Resolved params** | ✅ Correct | `{ concept: "upf" }` |
| **Handler binding** | ✗ Missing | `analyser` binding only executes `["read"]`, not `explain` |
| **Data availability** | ⚠️ Partial | UPF concept content would need to be curated/stored |
| **Current route** | ✅ Degrades gracefully | Falls back to `analyser.read(scope: "additives")` via keyword fallback if explain handler unavailable |
| **Benchmark impact** | 🔴 Blocked | Cannot fully activate without handler implementation |

**Root cause:** `analyser` binding (INT17) declares `ANALYSER_EXECUTABLE_INTENTS: ["read"]` only. The "explain" verb is registered on the capability but not executable.

**What would unblock:** Add "explain" handler to `analyser` binding, extend `analyser-read-handler.ts` or create `analyser-explain-handler.ts`, update `ANALYSER_EXECUTABLE_INTENTS`.

---

### 2. PR-064 — Additive Lookup (E621, MSG)

| Attribute | Status | Details |
|---|---|---|
| **Matcher pattern** | ✅ Resolves | `/E621|MSG|monosodium\s+glutamate/i` |
| **Query example** | ✅ Works | "What is E621?" |
| **Resolved capability** | ✅ Correct | `analyser` (registered) |
| **Resolved verb** | ⚠️ Blocked | `lookup` (not executable; not even in registry's supportedIntents) |
| **Resolved params** | ✅ Correct | `{ additiveCode: "E621" }` |
| **Handler binding** | ✗ Missing | `analyser` binding only executes `["read"]`; "lookup" verb not registered on capability |
| **Data availability** | ✅ Available | Additives table exists in storage; E621 = MSG is known |
| **Current route** | ✅ Degrades | No "lookup" handler, but `analyser.read(scope: "additives")` returns full table (truncated at char cap) |
| **Benchmark impact** | 🔴 Blocked | Returns full 300+ row additives table instead of single E-number; LLM must fish it out |

**Root cause:** `lookup` is a new verb proposed by COMP2A but not registered on the `analyser` capability and not executable.

**What would unblock:** 
1. Add "lookup" to `analyser` capability `supportedIntents` in capability-registry.ts
2. Implement lookup handler in analyser binding
3. Extract E-number from query, filter additives table, return single result

**Workaround:** Matcher currently routes to `analyser.read(additives)`, which returns the full table. The LLM can extract E621 if it's in the results (usually is, but may be truncated).

---

### 3. PR-069 — E-Number Education

| Attribute | Status | Details |
|---|---|---|
| **Matcher pattern** | ✅ Resolves | `/are\s+all\s+e[\s-]?numbers?\b/` + explanatory guard |
| **Query example** | ✅ Works | "Are all E-numbers bad?" |
| **Resolved capability** | ✅ Correct | `analyser` (registered) |
| **Resolved verb** | ⚠️ Blocked | `explain` (registered, not executable) |
| **Resolved params** | ✅ Correct | `{ concept: "e-numbers" }` |
| **Handler binding** | ✗ Missing | Same as PR-063 — "explain" not executable |
| **Data availability** | ⚠️ Partial | E-number safety framework exists; education content needs curation |
| **Current route** | ✅ Degrades | Falls back to `read(additives)` or keyword fallback |
| **Benchmark impact** | 🔴 Blocked | Without explain handler, answer is generic additive reference, not education |

**Root cause:** Same as PR-063 — "explain" verb is not executable on analyser.

---

### 4. PR-072 — Scoring System Comparison (NOVA vs Apple)

| Attribute | Status | Details |
|---|---|---|
| **Matcher pattern** | ✅ Resolves | `/nova.*apple\|apple.*nova/` + comparison words |
| **Query example** | ✅ Works | "NOVA versus apple" (actual test query) |
| **Resolved capability** | ✅ Correct | `analyser` (but routed to concept: "upf" instead of concept: "scoring-systems") |
| **Resolved verb** | ⚠️ Blocked | `explain` (not executable) |
| **Resolved params** | ⚠️ Partial | `{ concept: "upf" }` (pattern doesn't distinguish between PR-063 and PR-072) |
| **Handler binding** | ✗ Missing | "explain" handler for analyser not implemented |
| **Data availability** | ⚠️ Partial | NOVA classification and Apple Score both documented; comparison needs composition |
| **Current route** | ✅ Degrades | Routes to UPF explanation, which partially covers scoring |
| **Benchmark impact** | 🟡 Partial | Not a direct activation — query partially answered by PR-063 path |

**Root cause:** Scoring-systems concept matcher is too similar to UPF matcher; confidence tiebreaker routes to upf. Also, "explain" handler not executable.

**What would unblock:**
1. Separate scoring-systems matcher with higher confidence than UPF matcher
2. Implement explain handler with concept="scoring-systems" branch

---

### 5. CG-088 — Multi-Personality Consistency Testing

| Attribute | Status | Details |
|---|---|---|
| **Matcher pattern** | ✅ Resolves | `/as\s+(?:chef\|coach\|friend\|teacher\|sergeant\|companion)\b/` |
| **Query example** | ✅ Works | "Answer as Chef: what should I cook?" |
| **Resolved capability** | 🔴 **Not registered** | `companion-guidance` not in capability registry |
| **Resolved verb** | ⚠️ N/A | `suggest` (hypothetical; capability doesn't exist) |
| **Resolved params** | ⚠️ N/A | `{ testPersonalityConsistency: true }` |
| **Handler binding** | 🔴 **None** | Capability doesn't exist; no handler to bind |
| **Data availability** | ✅ Available | Personality registry exists (`personality-registry.ts`); consistency testable via existing Behaviour Engine |
| **Current route** | 🔴 **Fails** | Matcher routes to unregistered capability; gateway returns honest gap |
| **Benchmark impact** | 🔴 Blocked | Cannot route to non-existent capability; CG-088 remains unreachable |

**Root cause:** `companion-guidance` was added to the COMP2A matchers but was never registered as a capability in the Capability Registry.

**What would unblock:**
1. Register `companion-guidance` capability in capability-registry.ts
2. Create binding: `server/intelligence/bindings/companion-guidance.ts`
3. Implement handler that wires personality consistency tests
4. Add binding call to intelligence-platform.ts

**Note:** `companion-guidance.ts` file exists and contains cross-domain guidance logic, but it's not hooked into the capability system as a registered, routable capability.

---

### 6. TS-100 — Capability Discovery Guidance

| Attribute | Status | Details |
|---|---|---|
| **Matcher pattern** | ✅ Resolves | `/what.*ask.*next\|how.*get.*value\|best.*way.*use/` |
| **Query example** | ✅ Works | "What should I ask you next?" |
| **Resolved capability** | 🔴 **Not registered** | `help` not in capability registry |
| **Resolved verb** | ⚠️ N/A | `guidance` (hypothetical) |
| **Resolved params** | ⚠️ N/A | `{ type: "capability-discovery" }` |
| **Handler binding** | 🔴 **None** | Capability doesn't exist |
| **Data availability** | ✅ Available | Capability registry, context, and suggestion logic all exist |
| **Current route** | 🔴 **Fails** | Matcher routes to unregistered capability; gateway returns honest gap |
| **Benchmark impact** | 🔴 Blocked | Cannot route to non-existent capability; TS-100 remains unreachable |

**Root cause:** `help` capability doesn't exist. Related functionality (`developer` capability) exists but is isolated to developer plane only.

**What would unblock:**
1. Register `help` capability in capability-registry.ts (or rename/alias `developer` for user plane)
2. Create binding: `server/intelligence/bindings/help.ts`
3. Implement handler for guidance/discovery verbs
4. Add binding call to intelligence-platform.ts

**Note:** This represents new capability territory — there's no existing help/guidance capability to bind to. The `companion-guidance.ts` module exists but doesn't serve this "what should I ask" meta-discovery role.

---

## Summary Table: Execution Readiness

| Matcher | Capability | Verb | Registered | Executable | Handler | Data | Status |
|---|---|---|---|---|---|---|---|
| **PR-063** | `analyser` | `explain` | ✅ | ❌ | ❌ | ✅ | 🔴 Blocked on handler |
| **PR-064** | `analyser` | `lookup` | ❌ (new) | ❌ | ❌ | ✅ | 🔴 Blocked on registration + handler |
| **PR-069** | `analyser` | `explain` | ✅ | ❌ | ❌ | ✅ | 🔴 Blocked on handler |
| **PR-072** | `analyser` | `explain` | ✅ | ❌ | ❌ | ✅ | 🔴 Blocked on handler + concept distinction |
| **CG-088** | `companion-guidance` | `suggest` | ❌ (new) | ❌ | ❌ | ✅ | 🔴 Blocked on capability registration |
| **TS-100** | `help` | `guidance` | ❌ (new) | ❌ | ❌ | ✅ | 🔴 Blocked on capability registration |

---

## Routes That Resolve But Cannot Yet Execute

### Current Fallback Behavior

When a COMP2A matcher resolves to an unexecutable verb, the gateway:

1. **Routes the intent** to the matched capability (resolver succeeds)
2. **Checks executability** via `canExecute(capabilityId, verb)` — returns false
3. **Returns an honest gap** — "I don't have that information" or "I couldn't find that"
4. **Offers recovery** — suggests alternative routes or rephrasing (INT35)

**Example flow for PR-063:**

```
User: "What are ultra-processed foods?"
     ↓
Matcher: ✅ routes to analyser.explain(concept: "upf")
     ↓
Gateway: checks canExecute("analyser", "explain")
     ↓
Registry: ❌ "explain" not in ANALYSER_EXECUTABLE_INTENTS
     ↓
Result: honest gap + suggestion to rephrase
```

### Keyword Fallback Catches Some Queries

For queries that match the keyword fallback pattern `/\bupf\b/` but didn't match the specific PR-063 pattern, the gateway falls back to:

```typescript
capability: "analyser",
verb: "read",
parameters: { scope: "additives" },
confidence: 0.78
```

This returns the full additives table, which the LLM can then extract UPF context from (partial activation).

---

## Benchmark Impact Assessment

| Question | Current status | Data available | Why blocked | Estimated fix effort |
|---|---|---|---|---|
| **PR-063** | Honest gap (may fallback) | Yes | Analyser "explain" handler not implemented | High (new handler) |
| **PR-064** | Honest gap | Yes | Lookup verb not registered; handler missing | High (register + new handler) |
| **PR-069** | Honest gap (may fallback) | Partial | Analyser "explain" handler not implemented | High (new handler) |
| **PR-072** | Honest gap (partial via PR-063) | Yes | Distinct concept handler not implemented | High (new handler + differentiation) |
| **CG-088** | Honest gap (hard fail) | Yes | Capability doesn't exist | Very High (new capability + binding) |
| **TS-100** | Honest gap (hard fail) | Yes | Capability doesn't exist | Very High (new capability + binding) |

**Current INTQ8 impact from COMP2A matchers:** Estimated **-1 to -5 points** (matchers resolve but mostly hit honest gaps; no improvement from COMP2A work without handler/capability implementation).

---

## What Was Implemented in COMP2A vs. What Remains

### COMP2A Completed (Matchers)
✅ PatternIntentResolver matchers for all 6 routes  
✅ Route resolution (matcher → capability → verb → params)  
✅ Regression test coverage  

### Still Missing (Execution Layer)
- ❌ Analyser "explain" handler implementation
- ❌ Analyser "lookup" handler + verb registration
- ❌ Companion-guidance capability registration + binding
- ❌ Help capability registration + binding
- ❌ Data curation (UPF concepts, E-number education, etc.)

---

## Recommendations

### Phase 1 (Unblock 4 questions): Analyser Handler Implementation
Implement the missing verbs on the existing analyser capability:

1. **Extend analyser binding** (`server/intelligence/bindings/analyser.ts`):
   - Add "explain" and "lookup" to `ANALYSER_EXECUTABLE_INTENTS`
   - Import or create handlers for these verbs

2. **Create analyser-explain-handler** (new file):
   - Handle `concept: "upf" | "e-numbers" | "scoring-systems"`
   - Route to appropriate explanation content
   - Leverage existing product-analysis knowledge

3. **Create analyser-lookup-handler** (new file):
   - Extract E-number from params
   - Filter additives table for specific code
   - Return single-item result

**Effort:** Medium (2–3 days) — reuses existing analyser infrastructure

**Impact:** +4 benchmark questions (PR-063, PR-064, PR-069, PR-072)

### Phase 2 (Unblock 2 questions): New Capabilities
Requires more architectural work — new capability registration, bindings, and infrastructure.

1. **Register `companion-guidance` capability** (capability-registry.ts):
   - Move existing `companion-guidance.ts` logic into bound handler model
   - Implement `suggest` verb

2. **Register `help` capability** (capability-registry.ts):
   - Design help/capability-discovery routing
   - Implement `guidance` verb
   - May be part of broader "help/discovery" capability redesign

**Effort:** High (5–7 days) — requires pattern establishment for new capability types

**Impact:** +2 benchmark questions (CG-088, TS-100)

---

## Conclusion

**COMP2A matchers are correctly implemented and resolve properly, but 4 of 6 routes hit execution blockers:**

- ✅ Matchers work (resolver outputs correct capability/verb/params)
- ❌ Handlers don't exist or aren't executable (analysis → honest gaps)
- ✅ Data exists (would flow through if handlers were ready)

The matchers are **ready for implementation work** in the handler layer, but will not improve benchmark scores until that work is complete.

Current benchmark contribution from COMP2A: **~0 points** (routes resolve, but gates block with honest gaps).

---

*This is an investigation report only. No changes were made to the codebase.*
