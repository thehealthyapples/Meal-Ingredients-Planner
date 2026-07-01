# THA Intelligence Capability Factory

**Classification:** Implementation Guidance (not governing architecture)
**Status:** ACTIVE — established INT7A, 2026-06-30
**Applies to:** Read-only capability bindings on the THA Intelligence Platform

> **How to use this document.** A future prompt can be as short as: "Using INT7A Capability Factory, bind Pantry read-only." The implementer fills in the template below, follows the factory steps in order, and produces a governed binding without re-reading all prior INT workstreams. This document is the distilled pattern — not a shortcut past architecture compliance.

---

## Permanent Engineering Rules

These rules are permanent and non-negotiable. They apply to every capability binding produced by this factory, and to every cross-capability fix workstream. They cannot be waived by a future prompt, an implementation shortcut, or a scope-reduction agreement.

---

### Rule PER-1 — Capability completion gate

**A capability binding is not complete until both test suites pass:**

1. **Capability tests** — the binding's own test file (`server/tests/test-intelligence-<capability>-binding.ts`), covering all sections in Step 6 of this factory.
2. **Conversation Gateway integration tests** — the full gateway test suite (`server/tests/test-intelligence-conversation-gateway.ts`).

A binding whose handler works in isolation but whose capability data never reaches the LLM (because `buildCapabilityParams` sends the wrong params, `selectCapabilities` never selects it, or the gateway silently swallows a gap) is **not complete**. Gateway-level integration coverage is mandatory, not optional.

**Checklist addition to every Definition of Done:**

```
[ ] server/tests/test-intelligence-<capability>-binding.ts — all assertions pass
[ ] server/tests/test-intelligence-conversation-gateway.ts — all assertions pass
    (including at least one assertion that the capability's params reach the handler correctly)
```

**Origin:** INT20 audit found that 5 of 11 bound capabilities (shopping, household, partners,
templates, analyser) always returned null to the LLM because `buildCapabilityParams` had no
case for them. All 5 handler test suites passed; the gateway test suite had no assertions for
them. The gap was not caught until a dedicated investigation.

---

### Rule PER-2 — Convergence workstream for shared-root defects

**When an investigation identifies multiple defects with a shared architectural root cause, they must be resolved through a single named Convergence workstream — not through multiple isolated implementations.**

A Convergence workstream:
- Is named `<PARENT-INVESTIGATION>-Convergence` (e.g. `INT20-Convergence` → implemented as `INT21`).
- Addresses all defects that share the root cause in one set of changes.
- Produces a single implementation report documenting every defect resolved and the shared root cause.
- Is explicitly linked to its parent investigation report.

**Why a single workstream, not many:** Isolated fixes applied to a shared architectural root
tend to be incomplete. Each individual fix looks correct in isolation, but the root cause
re-manifests for the next capability added. A Convergence workstream forces a systemic fix
(e.g. fixing the gateway parameter-builder for all missing cases at once) rather than a
series of one-off patches that leave the architecture brittle.

**Scope rule:** A Convergence workstream may only address defects identified in its parent
investigation. It does not introduce new features, new capabilities, schema changes, or UI
changes. If additional work is warranted, it is proposed as a follow-up, not absorbed into
the Convergence scope.

**Origin:** INT20 identified 6 root causes affecting 6 of 11 capabilities. INT21 resolved
RC-1 through RC-3 (5 missing params cases + 1 scope typo + 4 missing keyword routes) in a
single convergence pass. The alternative — one workstream per defect — would have produced
6 separate PRs for what was ultimately three lines of code per fix site.

---

## Prerequisites

Before using this factory:

1. Read `docs/architecture/README.md` — the mandatory architecture bootstrap.
2. Confirm the target capability already exists in the Capability Registry (check `server/intelligence/capability-registry.ts`). Do not create a new capability without a separate governed workstream.
3. Confirm the target capability is `registered` (not `never`). A `never` capability requires a governing decision before it can be bound.
4. Identify the existing business service that owns the data. Locate its existing read methods. **Do not create a new owner.**

If any prerequisite fails: **STOP, explain why, do not continue.**

---

## Fill-in Template

Complete every field before writing a single line of code.

```
Capability ID:          # must match exactly the id in capability-registry.ts
Capability name:        # human-readable (e.g. "Pantry", "Diary")
Owner service:          # file path of the authoritative owner (e.g. server/storage.ts)
Source of Truth:        # SoT register entry (e.g. "D14 — planner_* tables")
Access scope:           # "own-data only (household-scoped)" | "public (no auth)" | "own-data (user-scoped)"
Supported read intents: # which verbs from supportedIntents have a safe, grounded owner read?
Executable intents:     # the subset above with a live handler code path (no gaps allowed here)
Allowed scopes:         # e.g. "list | unresolved | basket" — what the owner exposes safely
Honest gaps:            # list each case that returns gap() not a result
Permission model:       # mirrors the owner's existing access rules (cite owner routes/middleware)
Port methods:           # one line per method — owner method → port method mapping
Handler responsibilities: # what each executable verb does; what each gap case covers
Binding registration:   # CAPABILITY_EXECUTABLE_INTENTS constant value
Tests required:         # tick-list of test sections (see Test Coverage below)
Documentation updates:  # README.md section, architecture/README.md if warranted
Data impact:            # reads / writes / schema / backfill (read-only bindings: all No except reads)
Trust rules:            # capability-specific rules (e.g. "no fabricated prices", "source-gated only")
```

**Rule:** If a field cannot be filled in from existing codebase evidence, the binding is not ready. Do not guess.

---

## Factory Steps (in order)

### Step 0 — Rollback protection

Before modifying anything:

```
git tag <workstream>-rollback-pre-<capability>-binding
# e.g. int8-rollback-pre-pantry-binding
```

Report the tag in the implementation report before any code is written.

### Step 1 — Architecture Compliance gate

Fill in the Architecture Compliance Checklist:

```
[ ] One canonical Intelligence Platform — extending the existing singleton only
[ ] One Capability Registry — binding to the existing capability entry, no new registry
[ ] One Intent Engine — unchanged routing; no second engine
[ ] Owner remains owner — handler delegates every read; holds no business logic of its own
[ ] No duplicate state — no parallel store, no cached copy of owner data
[ ] Existing architecture extended only — reuses the registerHandler seam (INT1 extension point)
```

Also fill in the AI Architecture Compliance block:

```
[ ] Uses canonical Intelligence Platform (intelligencePlatform singleton)
[ ] Uses the AI Capability Registry (binds the existing capability)
[ ] Uses the Intent Engine (full pipeline)
[ ] Reuses the existing owner service (via the port)
[ ] Does not create another assistant
[ ] Does not duplicate conversation state
[ ] Uses registered capabilities only
[ ] Permission-aware access
[ ] Produces honest gaps rather than fabricated knowledge
```

If any check fails: **STOP.**

### Step 2 — Port file (`handlers/<capability>-read-port.ts`)

Create the delegation surface. Rules:

- Interface name: `<Capability>ReadPort`
- Methods: **1:1 forwards** to existing owner methods only. One method per owner call. No aggregation logic.
- **No write methods** — the interface has no mutation surface by construction.
- **No business logic** — no filtering, no sorting, no calculation, no interpretation. Those belong to the owner.
- Production factory: `createStorage<Capability>ReadPort(): Promise<<Capability>ReadPort>`
  - Use **dynamic imports** so binding does not open a database connection at import time.
  - The factory simply wires the owner methods to the port interface.
- The port interface is injectable (passed as a parameter to the handler factory) so tests can use an in-memory owner.

Pattern:

```typescript
export interface <Capability>ReadPort {
  // each method is a thin delegation to an existing owner method
  get<Thing>(id: number): Promise<<Thing> | undefined>;
}

export async function createStorage<Capability>ReadPort(): Promise<<Capability>ReadPort> {
  const { storage } = await import("../../storage.js");       // dynamic — no connection at import
  return {
    get<Thing>: (id) => storage.get<Thing>(id),
  };
}
```

### Step 3 — Handler file (`handlers/<capability>-read-handler.ts`)

Create the execution handler. Rules:

1. **Resolve the port once** before the verb switch (INT6B recommendation H-1). Do not resolve inside each case.
2. **Call `requireUserId`** at the top (before the switch) for any user-scoped or household-scoped capability. Public capabilities (like nutrition knowledge) skip this.
3. **Call `readOnlyVerbGuard`** at the top, passing `EXECUTABLE_INTENTS` and the capability name. This emits an honest gap for any verb the binding does not execute.
4. Switch on `intent.verb`. For each executable verb: delegate to the port, project the result, return `{ status: "ok", data: ... }`.
5. For each honest gap case within an executable verb: throw `gap(message)`. Never fabricate.
6. For ownership failures: throw `denied(message)`.

Import everything from the Read Binding Kit:

```typescript
import { gap, denied, requireUserId, toInt, readOnlyVerbGuard } from "./_read-kit.js";
```

Structure:

```typescript
export function create<Capability>ReadHandler(
  resolvePort: () => Promise<<Capability>ReadPort> = createStorage<Capability>ReadPort,
) {
  return async (intent: Intent, context: IntelligenceContext): Promise<IntentResult> => {
    // 1. Auth guard (for user/household-scoped capabilities)
    const userId = requireUserId(context, "<Capability>");

    // 2. Read-only verb guard
    readOnlyVerbGuard(intent, <CAPABILITY>_EXECUTABLE_INTENTS, "<Capability>");

    // 3. Resolve port once
    const port = await resolvePort();

    // 4. Route by verb
    switch (intent.verb) {
      case "read": {
        // delegate → project → return ok
      }
      case "explain": {
        // delegate → project → return ok
        // honest gap if no stored rationale / no stored link
      }
      default:
        throw gap(`"${intent.verb}" has no live code path in the <Capability> read binding.`);
    }
  };
}
```

### Step 4 — Binding file (`bindings/<capability>.ts`)

```typescript
export const <CAPABILITY>_CAPABILITY_ID = "<capability-id>";

export const <CAPABILITY>_EXECUTABLE_INTENTS: readonly IntentVerb[] = [
  "read",
  // ...only verbs with a live code path in the handler
];

export function bind<Capability>ReadCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<<Capability>ReadPort> = createStorage<Capability>ReadPort,
): void {
  platform.registerHandler(
    <CAPABILITY>_CAPABILITY_ID,
    create<Capability>ReadHandler(resolvePort),
    <CAPABILITY>_EXECUTABLE_INTENTS,
  );
}
```

Then call `bind<Capability>ReadCapability(intelligencePlatform)` once in `server/intelligence/intelligence-platform.ts`, immediately after the last existing binding.

### Step 5 — Exports

Add to `server/intelligence/index.ts`:
- The port interface and factory function
- The handler factory function
- The binding function and executable-intents constant

### Step 6 — Test file (`server/tests/test-intelligence-<capability>-binding.ts`)

#### Required test sections

| Section | What to assert |
|---|---|
| Capability lookup | `<capability>` is `available` on the singleton after binding |
| Scope lock | The count of live capabilities matches the current total (update the previous binding's scope-lock assertion to the new count) |
| Permission validation | Anonymous → `denied`; wrong household/user → `denied` with no existence leak |
| Handler invocation + delegation | Each executable verb returns `status: "ok"` with owned data; delegation to port methods is observed (spy) |
| Read scopes | Each allowed scope returns the right projection |
| Honest gaps | Each documented gap case returns `status: "gap"` (unknown id/slug, missing data, empty result, unsupported grounded read) |
| Unsupported intent | A verb outside the allow-list → `status: "unsupported_intent"` |
| Read-only enforcement | Write verbs return honest `gap` even when `confirmed: true` |
| Trust rules | Capability-specific rules from the fill-in template verified by assertion |

Always use an injected in-memory port (never a live database in unit tests).

Update the previous binding's scope-lock assertion from N to N+1 (same justified edit as INT3 updated INT2, INT4 updated INT3).

**PER-1 gate (mandatory):** After the capability test suite passes, run the Conversation
Gateway test suite and add at least one assertion confirming that:
- `selectCapabilities` selects this capability (via its surface primary and/or a keyword).
- `buildCapabilityParams` produces the correct scope parameter for this capability's default path.

These assertions belong in `server/tests/test-intelligence-conversation-gateway.ts` under
`§ 2 — selectCapabilities`. A binding that has no gateway assertions does not satisfy PER-1.

Add a test script to `package.json`:
```json
"test:intelligence-<capability>-binding": "npx tsx server/tests/test-intelligence-<capability>-binding.ts"
```
Append it to the `"test"` script value.

### Step 7 — README update

Add a row to the live bindings table in `server/intelligence/README.md`. Do not rewrite surrounding sections.

### Step 8 — Implementation report

Save to `docs/implementation/<WORKSTREAM>_<CAPABILITY>_CAPABILITY_BINDING_IMPLEMENTATION.md`.

Use the report template in the Implementation Report Template section below.

---

## Honest Gaps — Rules

A capability binding **must** produce a `gap` outcome (never a fabricated answer) in every case where:

| Situation | Rule |
|---|---|
| An id or slug is not found in the owner's store | `gap("unknown <entity>")` — never an invented record |
| An owner method returns `undefined` or an empty collection | `gap(message)` — never a zero-total, empty list, or placeholder |
| The owner has not linked two entities (e.g. a food↔benefit link that was not stored) | `gap(message)` — never assert a link the owner did not store |
| The intent verb is in `supportedIntents` but not in `executableIntents` (no safe, grounded owner read in scope) | `readOnlyVerbGuard` throws a gap automatically |
| The requested data is user-specific and this binding is public-only | `gap(message)` — surface the gap explicitly; do not attempt to fetch it |
| Any case where the handler would have to author, interpret, or compose an answer | `gap(message)` — the platform never authors a fact |

**Never return a fallback value.** A £0 basket when there are no stored prices is a fabrication. An invented rationale for a planner entry with no recorded rationale is a fabrication. A benefit that the owner does not link to that food is a fabrication.

---

## Avoiding Duplicate Business Logic

The hardest discipline is keeping business logic where it belongs.

**The test:** Can every line in the handler be described as "look up id X from the port, return the value"? If a line does arithmetic, applies a filter rule, makes a decision, or computes a derived field — it is business logic that belongs to the owner.

| In the handler (allowed) | Belongs to the owner (not in the handler) |
|---|---|
| `if (!result) throw gap(...)` | Any rule about what constitutes a valid result |
| `return { status: "ok", data: result }` | Any enrichment, transformation, or interpretation of `result` |
| `requireUserId(context, ...)` | Household membership or ownership rules (delegated to the port) |
| `readOnlyVerbGuard(...)` | Which operations a user is authorised to perform on the owner's data |
| `toInt(intent.params.id)` | How to resolve a name to an id (delegated to the owner) |
| Projecting `result.name` and `result.id` (safe fields) | Deciding which fields are safe to surface (the owner's display helpers handle this) |

**Specific patterns to avoid:**

- Do not compute a total, sum, average, or score in the handler. Delegate to the owner.
- Do not filter a list based on domain predicates in the handler. Ask the owner for the filtered set.
- Do not choose between multiple results in the handler. If the owner returns multiple, surface them all or gap.
- Do not resolve a name to an id in the handler. Use existing resolver services (via the port).
- Do not interpret an enum or status code in the handler. Surface the owner's stored value; let the consumer interpret it.

---

## Using `executableIntents`

`executableIntents` (introduced in INT6A) is the truthful registry of what this binding will actually execute.

**Rule:** A verb is in `executableIntents` if and only if the handler has a live code path that returns `{ status: "ok" }` for it. A verb that returns an honest `gap` — even for good reason — is **not** executable.

```typescript
// Correct:
export const PLANNER_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "explain"];
// "generate", "add", "delete" are in supportedIntents but NOT here — they gap.

// Wrong:
export const PLANNER_EXECUTABLE_INTENTS: readonly IntentVerb[] = ["read", "explain", "generate"];
// "generate" cannot be included if the handler returns gap() for it.
```

Declare the constant in the binding file. Pass it as the third argument to `platform.registerHandler()`. The registry uses it to populate `capability.executableIntents`, which discovery surfaces (`listExecutableCapabilities()`, `canExecute()`).

---

## Using the Read Binding Kit

The Read Binding Kit (`server/intelligence/handlers/_read-kit.ts`) contains shared plumbing. Import and use it rather than re-implementing.

| Export | When to use |
|---|---|
| `gap(message)` | Any honest-gap case in a handler |
| `denied(message)` | Any ownership or authentication failure |
| `requireUserId(context, capabilityName)` | At handler entry for user-scoped or household-scoped capabilities |
| `toInt(value)` | When coercing an intent parameter to a positive integer id or number |
| `readOnlyVerbGuard(intent, executableVerbs, capabilityName)` | At handler entry, before the verb switch, to guard non-executable verbs |

**Do not add to the kit** unless the utility is provably needed by three or more handlers and contains zero domain logic. Domain-specific helpers belong in the handler, not the kit.

The kit rule: if it touches a domain concept (planner, shopping, pantry, nutrition…), it does not belong in `_read-kit.ts`.

---

## Compact Future Prompt

Once this factory document exists, a future prompt can be:

```
Using INT7A Capability Factory (docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md),
bind <Capability> read-only.

Capability ID: <id from registry>
Owner service: <file>
Supported read intents: <verbs>
Allowed scopes: <scopes>
Honest gaps: <list>
Trust rules: <list>
```

The implementer reads this document, fills in the template, and follows the factory steps. No prior INT workstream documents need to be re-read unless a deviation from the factory pattern is under consideration.

---

## Implementation Report Template

Use this template for the implementation report saved under `docs/implementation/`:

```markdown
# <WORKSTREAM> — <Capability> Capability Binding (Read-only) — Implementation

**Status:** COMPLETE
**Date:** <date>
**Branch:** <branch>
**Workstream:** <id>

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `<tag>` → `<commit sha>` |
| Code modified | <list> |
| Schema modified | None |

## ARCHITECTURE BOOTSTRAP (gate)

[ ] Read docs/architecture/README.md and all six governing documents.

## ARCHITECTURE COMPLIANCE

<compliance table>

Gate result: PASS / FAIL

## WHAT WAS BUILT

<Port, Handler, Binding sections>

## FILES CREATED / MODIFIED

<table>

## DATA IMPACT

| Reads existing data | ✅ Yes — <description> |
| Writes new data | ❌ No |
| Changes meaning of existing data | ❌ No |
| Requires backfill | ❌ No |
| Schema changes | ❌ None |

## TRUST CHECK

<trust check table>

## TESTING

<test summary>

## SCOPE LOCK

<what was NOT built>

## DEFINITION OF DONE

[ ] Fill-in template completed before any code was written
[ ] Architecture Compliance gate: all checks pass
[ ] Port file created — no business logic, no write methods, dynamic import
[ ] Handler file created — delegates only, honest gaps, ownership gate replicated
[ ] Binding file created — registered on intelligencePlatform singleton
[ ] Capability test suite: all assertions pass
[ ] Conversation Gateway test suite (PER-1): all assertions pass,
    including selection and params assertions for this capability
[ ] README.md row added
[ ] package.json test script added
[ ] Implementation report saved
```

---

## Quick Reference — Files Created vs Files Edited

### New files (4 files per binding)

| File | Purpose |
|---|---|
| `server/intelligence/handlers/<capability>-read-port.ts` | Delegation surface (interface + production factory) |
| `server/intelligence/handlers/<capability>-read-handler.ts` | Execution handler (verb switch, honest gaps, delegation) |
| `server/intelligence/bindings/<capability>.ts` | Activation (registers handler + executableIntents on singleton) |
| `server/tests/test-intelligence-<capability>-binding.ts` | Test suite |
| `docs/implementation/<WS>_<CAPABILITY>_BINDING_IMPLEMENTATION.md` | Implementation report |

### Edited files (4 files per binding)

| File | Change |
|---|---|
| `server/intelligence/intelligence-platform.ts` | Add `bind<Capability>ReadCapability(intelligencePlatform)` call |
| `server/intelligence/index.ts` | Add exports for port, handler, binding, executable-intents constant |
| `server/intelligence/README.md` | Add row to live bindings table |
| `package.json` | Add `test:intelligence-<capability>-binding` script |

Plus: update the scope-lock assertion in the **previous** binding's test file from N to N+1.

---

## Architecture Compliance Summary

Every binding produced by this factory must satisfy these non-negotiable constraints. They map directly to the governing architecture in `docs/architecture/`:

| Constraint | Source |
|---|---|
| One Intelligence Platform — no second platform | TIP1 §2 |
| One Capability Registry — bind to existing entry only | TIP1 §6.2 (capability boundary) |
| One Intent Engine — no second engine, no routing branch | TIP1 §5 |
| Owner remains owner — delegation only, no business logic in handler | TIP1 §5.4, Principle 2 |
| No duplicate state — no parallel store, no cached owner data | Principle 7 |
| Honest gaps over fabrication — never author a fact the owner did not store | Principle 6, TIP1 Risk R2 |
| Permission model mirrors owner — server-side gate before any read | TIP1 §6.2 |
| Read-only by construction — port interface has no write method | INT2 pattern |
| `executableIntents` is truthful — verbs that gap are never listed | INT6A |
| Dynamic imports — no database connection at import time | INT2 pattern |
