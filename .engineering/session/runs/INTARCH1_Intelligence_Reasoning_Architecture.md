# Session: INTARCH1_Intelligence_Reasoning_Architecture

| Field | Value |
|---|---|
| **Session ID** | `INTARCH1_Intelligence_Reasoning_Architecture` |
| **Rollback ID** | `intarch1-rollback` → HEAD `7bfad50ca198f2b86f6501a4f82d8ae41af9260b` |
| **Start time** | 2026-07-17 |
| **Current stage** | Delivered — governing architecture; awaiting registration + owner review |

## Objective
Define the **governing Intelligence Reasoning Architecture**: the one canonical pipeline that turns intent into
trusted answers and actions — Intent → Effective Identity → Permission Resolution → Context Composition →
Capability Selection → Knowledge Retrieval → Evidence Validation → Reasoning → Response → Action. Architecture
work only: **no implementation, no schema changes, no AI logic changes.** Extend the existing Intelligence
Platform architecture and reference (never duplicate) the Intent Engine, AI Capability Registry, Context
Composition Engine, Product Knowledge Registry, Companion Platform, and COMP_AUTH1.

## Outcome
Created `docs/architecture/INTARCH1_INTELLIGENCE_REASONING_ARCHITECTURE.md`. Ten-stage pipeline, each stage
defined by purpose / authoritative owner / inputs / outputs / responsibilities / must-never-own, deferring to
each stage's existing owner:
- Intent → Intent Engine (TIP1 §5) + Capability Registry (TIP2)
- Effective Identity → COMP_AUTH1 + `server/lib/access.ts`
- Permission Resolution → PKR §11 model (`public ⊂ household ⊂ admin ⊂ developer`, fails closed to developer,
  role not tier) + Capability Registry allow-list + access.ts
- Context Composition → Context Composition Engine (INT17)
- Capability Selection → AI Capability Registry (TIP2, one owner per capability)
- Knowledge Retrieval → the fact's owner (PKR / NK1-NK2 via nutrition-knowledge-registry / Food Intelligence /
  derived index / owning business service); SoT Register names owners
- Evidence Validation → evidence gate (`shared/knowledge/evidence.ts`, DEC1 Rule E1: no citation no card) +
  EFSA firewall
- Reasoning → LLM under the Companion Platform invariant + honest-gap guarantee; deterministic logic stays with
  services/Decision Engine
- Response → Companion Platform (CPA1) Behaviour Engine
- Action → the existing business service; Intent Engine only invokes

Also: 11 governing principles (§4); the six-outcome decision logic — answer directly / retrieve / invoke /
act / clarify / honest gap, with permission precedence (§5); five worked examples traced end-to-end (why-meal-
recommended, publish-canonical-foods, recover-production, compare-foods, plan-next-week) (§6); the nine
governing architectural laws + effective-identity corollary (§7); DoD (§8); governance/follow-ups (§9).

Restates no rule it does not own — it owns only the pipeline shape and stage order; cites governors. Followed
COMP_AUTH1's precedent (same branch, 2026-07-17): did **not** edit tracked README/SoT-register; left
registration as a documented follow-up.

## Next action
(1) Register INTARCH1 in `docs/architecture/README.md` (Intelligence Governance) and
`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`. (2) Add citations to INTARCH1 from TIP1/TIP2/INT17/CPA1/
COMP_AUTH1. (3) Owner review. (4) Later separately-gated conformance review that the live runtime executes the
ten stages in order. All deliberately not done in this workstream to avoid touching tracked docs / code.

## Product changed
**None (governing architecture).** No component, route, data, schema, migration, test, or AI logic touched.
Added: this run file and `docs/architecture/INTARCH1_INTELLIGENCE_REASONING_ARCHITECTURE.md`.
Rollback: `git reset --hard intarch1-rollback`.
