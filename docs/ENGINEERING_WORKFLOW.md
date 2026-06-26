# THA ENGINEERING WORKFLOW

**Adopted:** 2026-06-25
**Supersedes:** `docs/change-control.md` is unchanged — this document adds architecture governance on top of it.
**Governing document:** `docs/ARCHITECTURE_PRINCIPLES.md`

---

## EVERY SIGNIFICANT IMPLEMENTATION MUST FOLLOW THIS WORKFLOW

Steps 1–3 are mandatory before any implementation begins. Steps 4–7 govern the implementation itself.

---

## STEP 1 — ROLLBACK PROTECTION (before anything else)

1. Confirm git status. Report whether the tree is clean or intentionally dirty.
2. Create a rollback tag: `git tag rollback/before-<workstream-name>-<YYYYMMDD> HEAD`
3. Report the rollback identifier before proceeding.

**No implementation may begin until the rollback identifier is reported.**

---

## STEP 2 — READ THE ARCHITECTURE PRINCIPLES

Before designing any implementation, read:

- `docs/ARCHITECTURE_PRINCIPLES.md` (the eight governing principles)
- `docs/investigations/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (domain ownership register)

These are required reading. Do not proceed until both are read.

---

## STEP 3 — ARCHITECTURE COMPLIANCE CONFIRMATION

Complete the mandatory Architecture Compliance Checklist before implementation begins (see below).

If any item fails, implementation must stop and explain why before proceeding.

---

## STEP 4 — DECISION-GATED WORKFLOW

*(From `docs/change-control.md` — unchanged.)*

- Break work into one decision at a time.
- Present only ONE decision per response.
- Wait for explicit approval before the next decision.
- Do not generate implementation until all decisions are approved.

---

## STEP 5 — MANDATORY SECTIONS IN EVERY IMPLEMENTATION DOCUMENT

Every workstream implementation document must contain all six sections:

### Architecture Compliance
*(See checklist below — copy and complete it.)*

### Definition of Done
- What success looks like
- What must not break
- Manual test steps

### Data Impact
- Reads existing data: YES / NO
- Writes new data: YES / NO
- Changes meaning of existing data: YES / NO
- Requires backfill: YES / NO

### Trust Check
- Could this mislead the user?
- Could this fabricate certainty?
- Is anything guessed but shown as real?
- What happens if the system is wrong?
- No architectural duplication introduced: YES / NO
- No new source of truth created: YES / NO
- No runtime behaviour altered (for governance-only work): YES / NO

### Rollback Plan
- Rollback identifier (tag name + commit SHA)
- Files modified
- Rollback commands
- Verification steps after rollback

### Architecture Convergence Status
*(Mandatory for all 🔴 RED architectural implementations. See STEP 8 for full guidance.)*

| Field | Value |
|-------|-------|
| Domain | |
| Current Canonical Owner | |
| Current Runtime Consumer(s) | |
| Duplicate Owners Remaining | |
| Duplicate State Remaining | |
| Duplicate Workflows Remaining | |
| Current Convergence (%) | |
| Target Convergence (%) | |
| Next Planned Milestone | |
| Remaining Architectural Risks | |

**Convergence percentages must be evidence-based. Never estimate without citing the current architecture.**

### Scope Lock
- Implemented scope
- Explicitly excluded scope (list what is NOT being done)
- Suggestions (anything useful observed outside scope — do not implement without approval)

---

## STEP 6 — DOMAIN IMPACT DECLARATION

Every workstream that touches any data domain must declare:

```
DOMAIN IMPACT
=============
Domain affected: [name]
Declared SoT: [file path or DB table]
New store created? YES / NO
  If YES: retirement plan for any replaced store: [plan or N/A]
Existing store extended? YES / NO
Consumer created? YES / NO
  If YES: reads from declared SoT? YES / NO
    If NO: blocked by: [technical dependency]
          Resolution plan: [plan]
```

If any answer creates a duplication without a retirement plan, the workstream is incomplete.

---

## STEP 7 — TRUST AND CLAIMS HARD STOPS

Hard stops that must pause implementation and require explicit approval:

- Any knowledge claim displayed without a source reference (`SourceRef` with URL + `lastReviewed`)
- Any AI-generated health claim anywhere in the product
- Any `emerging` benefit shown as `established`
- Any bridge created that keeps two stores of the same fact in sync
- Any new static client `.ts` file that stores knowledge data overlapping with DB stores

---

## STEP 8 — ARCHITECTURE CONVERGENCE STATUS (🔴 RED implementations only)

Every architectural (🔴 RED) implementation must report the convergence state of each domain it touches.

This section is **mandatory** for RED implementations. It is optional but encouraged for 🟡 AMBER implementations that significantly alter a domain.

### Purpose

Convergence Status makes architectural progress visible and measurable. It prevents drift going undetected across workstreams by requiring every RED implementation to record the current state of duplication in the domain it touches.

### Required Fields

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  [Name of the domain — e.g. Food Intelligence, Pantry Knowledge, Meal Planning]

Current Canonical Owner:
  [The declared source of truth for this domain — file path or DB table from the SoT Register]

Current Runtime Consumer(s):
  [All surfaces currently reading from this domain — list each consumer]

Duplicate Owners Remaining:
  [Any files or tables that still own facts that should belong to the canonical owner.
   Write NONE if none remain.]

Duplicate State Remaining:
  [Any user state stored in more than one place for this domain.
   Write NONE if none remains.]

Duplicate Workflows Remaining:
  [Any code paths that duplicate logic already owned by the canonical owner.
   Write NONE if none remain.]

Current Convergence (%):
  [Percentage of the domain that has converged to the canonical owner.
   Must be supported by evidence from the current architecture.
   Do not estimate without citing specific duplicates counted.]

Target Convergence (%):
  [Target percentage for this workstream — typically 100% unless a phased approach is planned]

Next Planned Milestone:
  [The next workstream or milestone that will move convergence further.
   Write N/A if this workstream completes convergence.]

Remaining Architectural Risks:
  [Any duplication, divergence, or bridge that poses ongoing risk.
   Write NONE if there are no remaining risks.]
```

### Convergence Percentage Rules

- **Must be evidence-based.** Count the specific duplicates that remain and the specific owners that have converged.
- **Never invent a percentage.** If you cannot count the evidence, write "Unknown — requires audit" rather than guessing.
- **Must decrease if new duplication is introduced** by this implementation.
- **May only increase when duplication is genuinely removed** — not when it is hidden or bridged.
- **Must reference the SoT Register** (`docs/investigations/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`) as the authority for what counts as convergence.

### Example

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Food Intelligence

Current Canonical Owner:
  WS0 Knowledge Registry (shared/knowledge/foods.ts + DB canonical_foods table)

Current Runtime Consumer(s):
  Meal Detail, Nutrition Report, Pantry Knowledge Hub, Planner, Discovery

Duplicate Owners Remaining:
  - pantry-knowledge.ts (owns benefit summaries independently)
  - nutrition-variety.ts (owns variety groupings independently)
  - client dietRules.ts (owns diet rule logic independently)

Duplicate State Remaining:
  None

Duplicate Workflows Remaining:
  One remaining — benefit resolution runs in both pantry-knowledge.ts
  and the canonical registry for the same food entities.

Current Convergence (%):
  78% — 18 of 23 benefit attributes now resolve from canonical owner.
  5 attributes remain in pantry-knowledge.ts and nutrition-variety.ts.

Target Convergence (%):
  100%

Next Planned Milestone:
  M2 — Pantry Knowledge Convergence (retire pantry-knowledge.ts and nutrition-variety.ts)

Remaining Architectural Risks:
  client dietRules.ts duplication — client-side diet logic diverges from
  canonical diet attributes and is not currently in scope for retirement.
```

---

## MANDATORY ARCHITECTURE COMPLIANCE CHECKLIST

Copy this into every workstream implementation document. Complete it before any implementation begins.

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

□ One canonical identity
  Each entity touched has exactly one key space.
  Explain: [which entities and their keys]

□ One owner per fact
  No attribute has two stores that must always agree.
  Explain: [which facts and their single owners]

□ No duplicate entities
  No new entity is being created that duplicates an existing entity.
  Explain: [confirm or describe what is new and why it is not a duplicate]

□ No duplicate ownership
  No attribute is being given a second owner.
  Explain: [confirm]

□ No duplicate state
  No user state is being split across two stores.
  Explain: [confirm]

□ Extends existing architecture
  This implementation builds on existing patterns, not beside them.
  Explain: [which existing pattern this extends]

□ Progressive enrichment where appropriate
  If this is a knowledge entity, enrichment follows the identity→core→optional→runtime pattern.
  If this is transactional state, enrichment is not being added.
  Explain: [entity type and enrichment approach]

□ Honest gaps over fabricated information
  Missing knowledge renders as empty/absent, never as invented content.
  Explain: [how gaps are handled]

□ No permanent synchronisation bridge
  No bridge is being built that keeps two owners of the same fact in sync.
  If a bridge exists, it funnels many inputs to one owner (permitted infrastructure).
  Explain: [any bridges and their classification]

□ Evolution over replacement
  If a new store replaces an existing one, the existing store is named and has a retirement plan.
  Explain: [what is being replaced and when/how it retires]
```

**If any item cannot be checked, implementation must stop and explain why before proceeding.**

---

## IMPLEMENTATION TEMPLATE

Use this template for every new workstream implementation document:

```markdown
# [WORKSTREAM NAME] — Implementation

**Date:** YYYY-MM-DD
**Branch:** [branch name]
**Risk:** 🟢 GREEN / 🟡 AMBER / 🔴 RED
**Reason:** [one sentence explaining the risk level]

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/[name]-[YYYYMMDD]` → `[commit SHA]` |
| Working tree | Clean / Intentionally dirty — [reason] |
| This task's writes | [files changed] |
| Rollback to committed state | `git checkout rollback/[name]-[YYYYMMDD]` |

---

## REFERENCE DOCUMENTS READ

- [ ] docs/ARCHITECTURE_PRINCIPLES.md
- [ ] docs/investigations/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md
- [ ] [any workstream-specific documents]

---

## ARCHITECTURE COMPLIANCE CHECKLIST

[Copy and complete the checklist from docs/ENGINEERING_WORKFLOW.md]

---

## DOMAIN IMPACT

[Copy and complete the Domain Impact Declaration from docs/ENGINEERING_WORKFLOW.md]

---

## ARCHITECTURE CONVERGENCE STATUS

*(Mandatory for 🔴 RED implementations. See STEP 8 in docs/ENGINEERING_WORKFLOW.md for guidance and rules.)*

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  [name]

Current Canonical Owner:
  [file path or DB table]

Current Runtime Consumer(s):
  [list each consumer]

Duplicate Owners Remaining:
  [list or NONE]

Duplicate State Remaining:
  [list or NONE]

Duplicate Workflows Remaining:
  [list or NONE]

Current Convergence (%):
  [X% — cite the evidence: N of M attributes / files / workflows converged]

Target Convergence (%):
  [target for this workstream]

Next Planned Milestone:
  [milestone name or N/A if this completes convergence]

Remaining Architectural Risks:
  [list or NONE]
```

---

## IMPLEMENTATION

[Implementation content]

---

## DEFINITION OF DONE

[DoD section]

---

## DATA IMPACT

[Data Impact section]

---

## TRUST CHECK

[Trust Check section]

---

## ROLLBACK PLAN

[Rollback Plan section]

---

## SCOPE LOCK

[Scope Lock section]

SUGGESTION:
[Any out-of-scope observations — do not implement without approval]
```

---

## CHANGE CONTROL (unchanged from `docs/change-control.md`)

All existing change control rules remain in force. This workflow adds architecture compliance governance on top of them. See `docs/change-control.md` for the full decision-gated workflow, risk ratings, and prompt discipline rules.

---

*This document governs all future THA implementation work.*
*Questions or conflicts → stop and report before implementing.*
