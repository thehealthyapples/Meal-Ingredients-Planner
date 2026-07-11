# INT7A — Intelligence Capability Factory Specification — Implementation

**Status:** COMPLETE
**Date:** 2026-06-30
**Branch:** `int1-intelligence-platform`
**Workstream:** INT7A — Intelligence Capability Factory Specification
**Governing documents:** `docs/architecture/README.md` → all six governing documents, including `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1)

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback tag** | `int7a-rollback-pre-capability-factory` |
| Tag points to | `a5294f80265a245d4120e6786a170775eeecbeb9` (INT1 foundation commit — working tree has INT2–INT6B uncommitted) |
| Action on rollback | `git checkout int7a-rollback-pre-capability-factory` (or `git reset --hard int7a-rollback-pre-capability-factory`) |
| Code modified | None — this workstream creates documentation only |
| New files | `docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md` (factory), `docs/implementation/governance/INT7A_INTELLIGENCE_CAPABILITY_FACTORY_SPECIFICATION.md` (this report) |
| Files edited | `docs/architecture/README.md` (link to factory as implementation guidance) |
| Schema modified | None |
| Runtime behaviour changed | None |

No implementation began until this rollback protection was confirmed and reported.

---

## ARCHITECTURE BOOTSTRAP (gate)

Read before implementation: `docs/architecture/README.md` — all six governing documents checked.

**This implementation creates no new capabilities, no new handlers, no new bindings, no schema changes, no routes, and no UI.** The sole output is a reusable specification document and this implementation report.

---

## ARCHITECTURE COMPLIANCE

| Check | Verdict | Evidence |
|---|---|---|
| One Intelligence Platform | ✅ | No platform changes. Factory is documentation only. |
| One Capability Registry | ✅ | No registry changes. Factory explains how to bind to existing entries. |
| One Intent Engine | ✅ | No engine changes. |
| No new owner created | ✅ | Factory explicitly requires binding to existing owners. |
| No duplicate state | ✅ | Documentation creates no state of any kind. |
| Existing architecture extended only | ✅ | Factory codifies the existing INT2–INT6B pattern; adds no new extension points. |
| Honest gaps preserved | ✅ | Factory requires honest gaps as a non-negotiable rule; explains the fabrication cases to avoid. |
| No second assistant | ✅ | Not applicable — documentation only. |
| No conversation state | ✅ | Not applicable — documentation only. |

**AI ARCHITECTURE COMPLIANCE:** All checks pass — this workstream produces no runnable code.

**Gate result: PASS.**

---

## OBJECTIVE

INT2, INT3, INT4, INT6A, and INT6B established and refined a repeatable pattern for read-only capability bindings:

- **Port** — a narrow, read-only delegation interface to the existing owner service, with dynamic imports and no business logic.
- **Handler** — an execution handler that routes verbs, enforces read-only via `readOnlyVerbGuard`, delegates to the port, and emits honest gaps for every unanswerable case.
- **Binding** — a registration function that attaches the handler to the canonical platform singleton and declares truthful `executableIntents`.
- **Tests** — an in-memory test suite covering capability lookup, permissions, delegation, scopes, honest gaps, and trust rules.

Until INT7A this pattern lived only in the implementation reports and in the code. Future prompts had to either re-read five INT reports (expensive) or risk deviating from the pattern (dangerous). INT7A extracts the proven pattern into a single reusable factory document so that future capability bindings can be prompted as:

> "Using INT7A Capability Factory, bind Pantry read-only."

---

## WHAT WAS BUILT

### `docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md`

The factory specification. Sections:

| Section | Purpose |
|---|---|
| Prerequisites | Four checks before writing code; STOP if any fails |
| Fill-in Template | 17-field template; all fields must be filled before coding |
| Factory Steps (Step 0–8) | Ordered implementation instructions; rollback → compliance gate → port → handler → binding → exports → tests → README → report |
| Honest Gaps — Rules | Every fabrication-risk case listed; no-fabrication rule stated as a table |
| Avoiding Duplicate Business Logic | Explicit "allowed in handler" vs "belongs to owner" table; five specific anti-patterns |
| Using `executableIntents` | Correct/incorrect examples; declaration and registration pattern |
| Using the Read Binding Kit | Per-export usage table; rule against polluting the kit with domain logic |
| Compact Future Prompt | The six-line prompt template that replaces all prior architectural context |
| Implementation Report Template | Markdown template for the implementation report every binding must produce |
| Quick Reference — Files Created vs Edited | Exact file list: 5 new files, 4 edited files per binding, plus one scope-lock update |
| Architecture Compliance Summary | 10 non-negotiable constraints with governing-document citations |

### Why `docs/architecture/` (not `docs/implementation/`)?

The factory document lives in `docs/architecture/` because it is referenced *before* implementation in every future binding. It is mandatory reading in the same way that TIP1/TIP2/TIP3 are — it defines the implementation contract for the entire binding pattern. It is classified as "Implementation Guidance" (not governing architecture) because it does not define THA's architectural principles; it translates the existing governing architecture into a reusable step sequence.

The `docs/architecture/README.md` is updated to link the factory as implementation guidance, not as a seventh governing document.

---

## SOURCE PATTERN

The factory was derived by analysis of:

| Workstream | Contribution to factory |
|---|---|
| INT2 (Planner) | Port interface pattern; dynamic imports; handler structure; binding activation; `CapabilityExecutionError`; honest-gap cases |
| INT3 (Shopping) | Confirmed Port → Handler → Binding generalises to a second owner; scope-lock assertion update pattern; trust rules table |
| INT4 (Nutrition/Knowledge) | Third confirmation; `resolvePort` once before switch (H-1 root cause); public-knowledge permission model; source-gated gap rules |
| INT6A (Executability) | `executableIntents` pattern; distinction between `supportedIntents` and `executableIntents`; discovery truthfulness |
| INT6B (Read Binding Kit) | Shared kit imports; `readOnlyVerbGuard`; injectable `resolvePort` parameter (C4); rule against adding domain logic to the kit |

Nothing in the factory is novel. Every rule is a direct extraction from the proven implementation record.

---

## EFFICIENCY GAIN

**Before INT7A:** A future "bind Pantry read-only" prompt needed to either:
1. Re-read INT2 + INT3 + INT4 + INT6A + INT6B to reconstruct the pattern (~5 documents, ~600 lines), or
2. Proceed without the full pattern, risking deviation from the architecture.

**After INT7A:** The same prompt reads one document (~200 lines) containing the complete, ordered factory. All architectural context is embedded. The prompt shrinks from "read the five prior INT reports and implement the pattern" to six lines.

---

## DATA IMPACT

| Declaration | Status |
|---|---|
| **Reads existing data** | ❌ No — documentation only |
| **Writes new data** | ❌ No — documentation only |
| **Changes meaning of existing data** | ❌ No |
| **Requires backfill** | ❌ No |
| **Schema changes** | ❌ None |
| **Persistence changes** | ❌ None |

---

## TRUST CHECK

| Check | Verdict |
|---|---|
| Runtime behaviour unchanged | ✅ No code modified |
| Existing bindings unchanged | ✅ No binding files touched |
| No new capability added | ✅ Factory forbids adding capabilities without a separate workstream |
| Honest gaps preserved in factory | ✅ Factory §"Honest Gaps — Rules" states the rules explicitly |
| Business logic boundary preserved in factory | ✅ Factory §"Avoiding Duplicate Business Logic" states the boundary explicitly |
| No fabrication pathway introduced | ✅ Factory documents the non-fabrication constraint as non-negotiable |

---

## FILES CREATED

| File | Purpose |
|---|---|
| `docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md` | The reusable factory specification |
| `docs/implementation/governance/INT7A_INTELLIGENCE_CAPABILITY_FACTORY_SPECIFICATION.md` | This implementation report |

## FILES MODIFIED

| File | Change |
|---|---|
| `docs/architecture/README.md` | Added link to factory under a new "Implementation Guidance" section |

---

## DEFINITION OF DONE

| Requirement | Status |
|---|---|
| Capability Factory specification exists | ✅ `docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md` |
| Documents the proven read-only binding pattern | ✅ Port → Handler → Binding → Tests → Report, all steps |
| Includes compact future prompt template | ✅ Six-line prompt in "Compact Future Prompt" section |
| Explains how to avoid duplicate business logic | ✅ Dedicated section with allowed/forbidden table |
| Explains how to preserve honest gaps | ✅ Dedicated section with fabrication-risk case table |
| Explains how to use `executableIntents` | ✅ Dedicated section with correct/incorrect examples |
| Explains how to use the Read Binding Kit | ✅ Dedicated section with per-export usage table |
| No runtime behaviour changed | ✅ Documentation only |
| Rollback identifier reported before modifications | ✅ `int7a-rollback-pre-capability-factory` |
| Implementation report saved | ✅ This file |
