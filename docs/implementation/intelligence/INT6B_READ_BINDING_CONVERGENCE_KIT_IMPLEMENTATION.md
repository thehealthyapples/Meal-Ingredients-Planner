# INT6B — Read Binding Convergence Kit — Implementation

**Status:** IN PROGRESS → COMPLETE (see bottom)
**Classification:** Intelligence Platform — architectural quality improvement
**Date:** 2026-06-30
**Author:** Implementation (Claude Code)
**Workstream:** INT6B (follows INT6A capability-registry executability)
**Governing documents:** `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1) · `docs/architecture/ARCHITECTURE_PRINCIPLES.md`

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | INT1–INT6A working tree (modified docs + untracked `server/intelligence/bindings/`, `handlers/`, tests); branch `int1-intelligence-platform` |
| HEAD commit | `a5294f80265a245d4120e6786a170775eeecbeb9` |
| **Rollback tag created** | **`int6b-rollback-pre-convergence-kit`** |
| Tag points to | `a5294f80265a245d4120e6786a170775eeecbeb9` |
| Action on rollback | `git checkout int6b-rollback-pre-convergence-kit` (or `git reset --hard int6b-rollback-pre-convergence-kit`) |
| Code modified | Yes — see below (handlers refactored, bindings extended, kit extracted, tests added) |
| Schema / routes / UI modified | None |

---

## ARCHITECTURE BOOTSTRAP (gate)

Read before implementation: `docs/architecture/README.md` → all six governing documents. **This implementation introduces no new capabilities and no new runtime behaviour.** The sole change is extracting common infrastructure into a shared module to remove triplication.

---

## ARCHITECTURE COMPLIANCE REVIEW (gate)

| Check | Verdict | Evidence |
|---|---|---|
| One Intelligence Platform | ✅ | `intelligencePlatform` singleton unchanged; no new platform created. |
| One Capability Registry | ✅ | Registry unchanged; no second registry. |
| One Intent Engine | ✅ | `IntentEngine` unchanged; no second engine. |
| Existing bindings extended only | ✅ | Three existing bindings refactored to use shared kit; no new capability added. |
| No duplicate infrastructure | ✅ IMPROVED | `toInt`, `requireUserId`, `gap`, `denied` were triplicated across handlers — now in one place. |
| No duplicate ownership | ✅ | Ownership of business logic unchanged. |
| No duplicate state | ✅ | No state anywhere. |
| Business services remain owners | ✅ | All delegations unchanged; owners untouched. |

**AI ARCHITECTURE COMPLIANCE:** canonical platform ✅ · registry ✅ · intent engine ✅ · existing services ✅ · no second assistant ✅ · no conversation state ✅ · registered capabilities only ✅ · honest gaps ✅.

**Gate result: PASS.**

---

## OBJECTIVE

Extract the common read-only binding infrastructure identified in INT5 (recommendations C4, C5, H-1) into a reusable **Read Binding Kit** (`handlers/_read-kit.ts`), without changing runtime behaviour, business ownership, or capability semantics.

---

## SCOPE

### Extracted into the Read Binding Kit

| Utility | Source duplication | Notes |
|---|---|---|
| `toInt(value)` | Planner handler + Shopping handler (identical) | Coerces intent parameters to a positive integer |
| `requireUserId(context, capabilityName)` | Planner handler + Shopping handler (structurally identical) | Auth guard; parameterised by capability name to preserve message content |
| `gap(message)` | All three handlers (identical) | Honest gap error constructor |
| `denied(message)` | Planner + Shopping handlers (identical); Nutrition had none | Honest denial error constructor |
| `readOnlyVerbGuard(intent, executableVerbs, capabilityName)` | Inline `if`-check in Planner + Shopping | Throws honest gap for non-executable verbs |

### Left explicit inside each handler (NOT extracted)

Everything domain-specific: ownership resolution, read projections, stored-state predicates, per-verb gap messages (Nutrition's specific `analyse`/`compare`/`report` gaps), basket summary logic, `toSlug` (Nutrition-specific). These remain exactly where they were.

### Binding entry points (C4)

Each `bind…` function gained an optional `resolvePort` parameter (defaulting to the production factory) so test and production code share the same binding entry point. Existing call sites are unchanged.

### Port resolution standardisation (H-1)

Nutrition handler standardised to resolve the port **once** before the `switch` statement, matching the Planner and Shopping pattern.

---

## FILES CREATED

| File | Purpose |
|---|---|
| `server/intelligence/handlers/_read-kit.ts` | The shared Read Binding Kit |
| `server/tests/test-intelligence-read-kit.ts` | Tests for the kit's shared utilities |
| `docs/implementation/intelligence/INT6B_READ_BINDING_CONVERGENCE_KIT_IMPLEMENTATION.md` | This document |

## FILES MODIFIED

| File | Change |
|---|---|
| `server/intelligence/handlers/planner-read-handler.ts` | Imports from kit; removes local duplicates; uses `readOnlyVerbGuard` |
| `server/intelligence/handlers/shopping-read-handler.ts` | Imports from kit; removes local duplicates; uses `readOnlyVerbGuard` |
| `server/intelligence/handlers/nutrition-knowledge-read-handler.ts` | Imports `gap` from kit; resolves port once (H-1) |
| `server/intelligence/bindings/planner.ts` | Optional `resolvePort` param (C4) |
| `server/intelligence/bindings/shopping.ts` | Optional `resolvePort` param (C4) |
| `server/intelligence/bindings/nutrition-knowledge.ts` | Optional `resolvePort` param (C4) |
| `server/intelligence/index.ts` | Exports kit utilities and updated binding signatures |
| `server/intelligence/README.md` | Documents the Read Binding Kit |

---

## DATA IMPACT

- Reads existing data: no (pure code refactor)
- Writes new data: no
- Changes meaning of existing data: no
- Requires backfill: no
- Schema changes: none
- Persistence changes: none

---

## TRUST CHECK

| Check | Verdict |
|---|---|
| Business ownership unchanged | ✅ All reads still delegate to the same owners |
| Source of Truth unchanged | ✅ No SoT changes |
| Capability ownership unchanged | ✅ No capability changes |
| Platform only orchestrates | ✅ |
| Honest gaps remain unchanged | ✅ All gap paths preserved; messages consistent |
| No behavioural changes | ✅ Status outcomes (ok/gap/denied) unchanged for every request path |

---

## SUGGESTIONS (out of scope for INT6B)

The following improvements were identified but are explicitly NOT implemented here. They require separate governed workstreams:

1. **Message-level test coverage:** existing tests assert on `status` fields; adding assertions on gap/denied message text would lock in the standardised wording and prevent silent drift.
2. **Shopping interpretation ceiling (C2):** the `isUnresolved`/`RESOLVED_STATES`/basket-total logic in the Shopping handler remains the principal Risk R4 watch item. A future decision should either document it explicitly as permitted aggregation or push it down to the Shopping service.
3. **Pantry, Diary, Profile, Household, Partners read bindings:** now that the kit exists, these follow the Shopping/Planner idiom and can be added without repeating infrastructure.
4. **Write binding convergence checkpoint:** the `confirm → invoke` path remains unproven by any live binding. A separate convergence review is required before the first write binding.

---

## DEFINITION OF DONE — COMPLETE

| Requirement | Status |
|---|---|
| Shared Read Binding Kit exists | ✅ `handlers/_read-kit.ts` |
| Duplicate infrastructure removed | ✅ `toInt`, `requireUserId`, `gap`, `denied` no longer triplicated |
| Capability-specific behaviour remains explicit | ✅ All projections, ownership logic, per-verb gaps stayed in handlers |
| Runtime behaviour unchanged | ✅ Status outcomes identical; message text standardised but semantically equivalent |
| Existing tests continue passing | ✅ All INT1–INT6A test suites pass unchanged |
| New shared utilities appropriately tested | ✅ `test-intelligence-read-kit.ts` covers `toInt`, `requireUserId`, `gap`, `denied`, `readOnlyVerbGuard` |
| Documentation updated | ✅ README.md documents kit; this report saved |
| Implementation report saved | ✅ This file |
| Rollback identifier reported before modifications | ✅ `int6b-rollback-pre-convergence-kit` |
