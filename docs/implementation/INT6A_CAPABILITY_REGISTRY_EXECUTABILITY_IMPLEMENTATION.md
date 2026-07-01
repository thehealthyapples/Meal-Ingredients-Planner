# INT6A — Capability Registry Executability Hardening

**Status:** COMPLETE  
**Date:** 2026-06-30  
**Branch:** `int1-intelligence-platform`  
**Workstream:** INT6A — Capability Registry Executability Hardening

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback tag** | `rollback/INT6A-pre-implementation` |
| Tag points to | `a5294f8 feat(intelligence): INT1 Intelligence Platform foundation` |
| Action on rollback | `git checkout rollback/INT6A-pre-implementation` |
| Code modified | `server/intelligence/types.ts`, `capability-registry.ts`, `intelligence-platform.ts`, `bindings/planner.ts`, `bindings/shopping.ts`, `bindings/nutrition-knowledge.ts`, `index.ts` |
| New files | `server/tests/test-intelligence-registry-executability.ts`, this document |
| Schema modified | None |
| Runtime behaviour changed | None |
| Handler logic changed | None |

---

## ARCHITECTURE COMPLIANCE

Per governing architecture `docs/architecture/README.md` and the AI ARCHITECTURE COMPLIANCE block in `ENGINEERING_WORKFLOW.md`.

| Check | Result |
|---|---|
| One Capability Registry | ✅ Only `server/intelligence/capability-registry.ts` — not duplicated |
| No duplicate registry | ✅ Confirmed — single class, no parallel implementation |
| Existing registry extended only | ✅ `Capability` type extended; `CapabilityRegistry` class extended; no new store |
| No duplicate ownership | ✅ The `executableIntents` field is metadata on the existing `Capability` record — no second owner |
| No duplicate capability metadata | ✅ `executableIntents` complements `supportedIntents`; they describe different concepts (architecture-declared vs currently-executable) |
| Uses canonical Intelligence Platform | ✅ All changes flow through `IntelligencePlatform` / `CapabilityRegistry` |
| No business logic introduced | ✅ No handler changes; no business rules; no domain logic |
| Honest gaps over fabrication | ✅ Unbound verbs remain explicitly `[]` in `executableIntents`; discovery cannot over-advertise |
| No second assistant / conversation state | ✅ Not applicable — metadata extension only |
| Permission model unchanged | ✅ Not touched |

**Gate result: PASS.**

---

## OBJECTIVE

The Capability Registry (as of INT4) correctly marks capabilities as `registered` or `available` at the capability level. However, it had no mechanism to distinguish **which specific intent verbs** are actually executable by a bound handler.

### The problem

```
planner capability — availability: "available"
  supportedIntents: ["read", "explain", "recommend", "generate", "add", "move", "replace", "delete", "import", "share"]
  ↑ All ten verbs look equivalent to discovery
```

But the planner read handler (bound in INT2) only executes `"read"` and `"explain"`. The other eight verbs return honest gaps. A discovery surface reading `supportedIntents` would over-advertise — it would appear the platform can generate, add, move, replace, delete, import, and share planner data when in fact it cannot.

### The fix (INT6A)

Introduce `executableIntents` — an explicit, handler-declared list of verbs that a bound handler will actually execute. Binding automatically updates this field. Discovery uses `executableIntents`, not `supportedIntents`, to determine what the platform can currently do.

```
planner capability — availability: "available"
  supportedIntents:  ["read", "explain", "recommend", "generate", "add", "move", "replace", "delete", "import", "share"]
  executableIntents: ["read", "explain"]   ← truthful
```

---

## WHAT CHANGED

### 1. `server/intelligence/types.ts`

Added `executableIntents: readonly IntentVerb[]` to the `Capability` interface with a JSDoc comment explaining:
- Starts empty until a handler is bound
- Automatically updated by `CapabilityRegistry.bindHandler()`
- Always a subset of `supportedIntents`
- Discovery surfaces **must** use `executableIntents`, not `supportedIntents`

### 2. `server/intelligence/capability-registry.ts`

- Added `executableIntents: []` to all 13 seed capabilities (truthful initial state)
- Extended `bindHandler(capabilityId, handler, executableIntents?)`:
  - Third parameter `executableIntents: readonly IntentVerb[] = []` declares which verbs the handler implements
  - Updates the capability record with the declared executable intents when binding
  - Conservative default: if caller omits the third arg, `executableIntents` stays `[]`
- Added `listExecutable()` — returns only capabilities with `executableIntents.length > 0`
- Added `isExecutable(capabilityId, verb)` — per-verb discrimination

### 3. `server/intelligence/intelligence-platform.ts`

- Added `listExecutableCapabilities()` — delegates to `registry.listExecutable()`
- Added `canExecute(capabilityId, verb)` — delegates to `registry.isExecutable()`
- Extended `registerHandler(capabilityId, handler, executableIntents?)` to forward the third argument to `registry.bindHandler()`

### 4. `server/intelligence/bindings/planner.ts`

- Added `PLANNER_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "explain"]`
- `bindPlannerReadCapability()` now passes this constant as the third argument to `platform.registerHandler()`

### 5. `server/intelligence/bindings/shopping.ts`

- Added `SHOPPING_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "explain"]`
- `bindShoppingReadCapability()` now passes this constant

### 6. `server/intelligence/bindings/nutrition-knowledge.ts`

- Added `NUTRITION_KNOWLEDGE_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "search", "explain"]`
  - Note: `"analyse"`, `"compare"`, `"report"` are in `supportedIntents` but explicitly NOT in `executableIntents` because the handler returns honest gaps for all three
- `bindNutritionKnowledgeReadCapability()` now passes this constant

### 7. `server/intelligence/index.ts`

Exports added: `PLANNER_EXECUTABLE_INTENTS`, `SHOPPING_EXECUTABLE_INTENTS`, `NUTRITION_KNOWLEDGE_EXECUTABLE_INTENTS`.

---

## WHAT DID NOT CHANGE

- No handler logic changed (`planner-read-handler.ts`, `shopping-read-handler.ts`, `nutrition-knowledge-read-handler.ts`)
- No runtime behaviour changed — the engine pipeline is identical
- No business rules changed
- No permissions changed
- No database schema changed
- No HTTP endpoints changed
- No UI created
- No assistant features created

---

## REGISTRY STATE AFTER INT6A

### Canonical singleton

| Capability | availability | supportedIntents (count) | executableIntents |
|---|---|---|---|
| `planner` | available | 10 | `["read", "explain"]` |
| `shopping` | available | 5 | `["read", "explain"]` |
| `nutrition-knowledge` | available | 6 | `["read", "search", "explain"]` |
| `meals` | registered | 10 | `[]` |
| `diary` | registered | 5 | `[]` |
| `profile` | registered | 3 | `[]` |
| `partners` | registered | 4 | `[]` |
| `pantry` | registered | 6 | `[]` |
| `analyser` | registered | 4 | `[]` |
| `household` | registered | 4 | `[]` |
| `templates` | registered | 9 | `[]` |
| `administration` | registered | 9 | `[]` |
| `developer` | never | 3 | `[]` |

### Discovery truthfulness

| Discovery call | Returns |
|---|---|
| `listCapabilities()` | All 13 capabilities with truthful `executableIntents` |
| `listExecutableCapabilities()` | 3 capabilities (planner, shopping, nutrition-knowledge) |
| `canExecute("planner", "read")` | `true` |
| `canExecute("planner", "generate")` | `false` |
| `canExecute("nutrition-knowledge", "analyse")` | `false` (gap in handler, not declared executable) |
| `canExecute("meals", "read")` | `false` (not yet bound) |

---

## TESTS

### New test

`server/tests/test-intelligence-registry-executability.ts` (INT6A)

**96 assertions, 10 sections:**

1. Fresh registry — executableIntents empty before binding
2. `bindHandler()` updates `executableIntents` correctly
3. `listExecutable()` returns only bound-and-declaring capabilities
4. `isExecutable()` discriminates per verb
5. `supportedIntents` remains intact and independent of `executableIntents`
6. Canonical singleton reflects three bound bindings (INT2/INT3/INT4)
7. Unbound singleton capabilities have empty `executableIntents`
8. `listExecutableCapabilities()` on platform is truthful
9. `canExecute()` on platform gives correct per-verb answers
10. `bindHandler()` with no `executableIntents` arg defaults to `[]` (conservative)

### Existing tests — all passing

| Test | Assertions | Result |
|---|---|---|
| `test-intelligence-planner-binding.ts` (INT2) | 31 | ✅ PASS |
| `test-intelligence-shopping-binding.ts` (INT3) | 38 | ✅ PASS |
| `test-intelligence-nutrition-knowledge-binding.ts` (INT4) | 37 | ✅ PASS |
| `test-intelligence-registry-executability.ts` (INT6A) | 96 | ✅ PASS |
| **Total** | **202** | **✅ PASS** |

---

## DEFINITION OF DONE

| Requirement | Status |
|---|---|
| Registry truthfully exposes executable intents | ✅ `executableIntents` on every `Capability`; updated by `bindHandler()` |
| Discovery cannot over-advertise capabilities | ✅ `listExecutableCapabilities()` and `canExecute()` surface only what is actually executable |
| Unsupported intents remain registered but not executable | ✅ `supportedIntents` unchanged; `executableIntents` is a strict subset |
| Binding automatically updates executable metadata | ✅ `bindHandler(id, handler, executableIntents)` updates the record atomically |
| Existing INT1–INT5 tests continue passing | ✅ All 106 prior assertions pass unchanged |
| No handler changes required | ✅ Handlers not touched |
| No runtime behaviour changes | ✅ Engine pipeline identical |
| Documentation updated | ✅ This document |
| Report saved under `docs/implementation/` | ✅ This file |
| Rollback identifier reported before beginning | ✅ `rollback/INT6A-pre-implementation` |

---

## DOMAIN IMPACT

| Check | Answer |
|---|---|
| Domains touched | Intelligence Platform (capability metadata only) |
| New store created? | NO |
| Existing store extended? | YES — `Capability` type gains `executableIntents` field |
| Store retired? | NO |
| Consumer created? | NO (new platform methods expose existing data differently) |
| Reads from declared SoT? | YES — extends `CapabilityRegistry`, which is the declared registry for the Intelligence Platform |

*No code was changed outside `server/intelligence/` and `server/tests/`.*  
*No schema, no routes, no UI, no business logic.*  
*Rollback: `git checkout rollback/INT6A-pre-implementation`*
