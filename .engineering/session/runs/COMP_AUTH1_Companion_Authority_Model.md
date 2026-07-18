# Session: COMP_AUTH1_Companion_Authority_Model

| Field | Value |
|---|---|
| **Session ID** | `COMP_AUTH1_Companion_Authority_Model` |
| **Rollback ID** | `comp-auth1-companion-authority-model-rollback-20260717` → working-tree snapshot `d5901e8e` |
| **Start time** | 2026-07-17 |
| **Current stage** | Delivered — governing architecture; awaiting registration + owner review |

## Objective
Define the **governing authority model for Companion identity, permissions and impersonation**: Companion
access is always determined by the **effective authenticated identity**, never by the administrator performing
an impersonation, and never by location within the app. Architecture work only: **no implementation, no schema
changes, no AI logic changes.** Establish seven principles (One Companion · permission-aware intelligence ·
effective identity · audit separation · no privilege leakage · exiting impersonation · governing laws) and a
Definition of Done making the doc the governing model for all future Companion implementation, context
composition and permission checks.

## Outcome
Created `docs/architecture/COMP_AUTH1_COMPANION_AUTHORITY_MODEL.md`. Grounded in the real system without
changing it: the existing impersonation mechanism is the session-scoped benchmark facility
(`benchmarkImpersonation = { adminUserId, … }` + login switch; `/api/admin/benchmark-households/:id/impersonate`
and `/api/benchmark-impersonation/stop` in `server/routes.ts`). Read through the model, the retained
`adminUserId` **is** the Actor Identity and the switched login **is** the Effective Identity — so no new store
or schema is required (§ 9). No prior "effective/actor identity" vocabulary existed in the codebase; this doc
introduces it as governing and mechanism-independent (so future support impersonation inherits it unchanged).

Cites its governors rather than restating: `THA_COMPANION_PLATFORM_ARCHITECTURE`,
`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE`, `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY`, and the **PKR
permission model** (`public ⊂ household ⊂ admin ⊂ developer`, monotonic, fails closed to `developer`, keyed on
role not tier, **filtered before prompt composition**) — named as the primary enforcement surface that must
filter on the *effective* role. "One Companion" (§ 3) is the authority-model reading of the identity
COMP1/COMP2/COMP3 lock.

Structure: the problem it closes (location-as-authority + impersonation leakage, § 1); the Actor/Effective
model with the normal-vs-impersonation table (§ 2); the six brief principles as §§ 3–8; effective identity
governs seven channels — capability access, knowledge retrieval, permission checks, context composition,
disclosure, actions, recommendations — with a fail-closed rule and "no eighth channel" (§ 5); eight governing
laws (§ 10, including all six required); Definition of Done (§ 11); governance/scope (§ 12); verification
(§ 13).

## Next action
(1) Register COMP_AUTH1 in `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` and add citations from the Companion
platform / context-composition / capability-registry architectures — a documentation follow-up, deliberately
**not** performed in this workstream to avoid touching tracked docs. (2) Owner review. (3) A later,
separately-gated **conformance review** to verify the current impersonation + context-composition code already
satisfies the eight laws (this doc establishes the law that review checks against; it asserts requirements, not
changes).

## Product changed
**None (governing architecture).** No component, route, data, schema, migration, test, or AI logic touched.
Added: this run file and `docs/architecture/COMP_AUTH1_COMPANION_AUTHORITY_MODEL.md`.
