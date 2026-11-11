# INT Hybrid Weak Intent Fallback

Date: 2026-11-10  
Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
Branch: `feat/integrated-dev`  
Risk: RED — AI reasoning and routing behavior.

## Scope and decision

Enable the existing bounded HybridIntentResolver model fallback for weak-only matches, including the generic planner overview matcher. Specific and compound deterministic matches continue to bypass the model. The owner selected the option to classify generic planner overview wording as weak.

## Changes

- Added transient matcher-tier provenance (`strong`, `weak`, `none`) to PatternIntentResolver without changing its public `resolve()` result.
- Moved only the generic planner overview pattern into the weak tier. Keyword fallbacks are also marked weak; compound and specific patterns take precedence.
- HybridIntentResolver now attempts its existing validated model route for unknown or weak-only results. Legacy injected resolvers remain compatible.
- Added mocked regression cases for three weak-only planner questions, three strong questions, and the original zero-match path. Model-provided parameters remain discarded.

## Architecture and AI compliance

- Verified: this extends the existing PatternIntentResolver and HybridIntentResolver path; it adds no assistant, conversation store, state owner, or workflow. Canonical files: `server/intelligence/pattern-intent-resolver.ts`, `server/intelligence/hybrid-intent-resolver.ts`, and `server/intelligence/conversation/conversation-gateway.ts`.
- Verified: provider output continues through the existing runtime capability registry and executable-verb validation in `server/intelligence/hybrid-intent-resolver.ts`; model parameters are not accepted.
- Verified: no schema, persistence, product capability, registry, or permission-aware access change was made.
- Product knowledge registry impact: none; this changes fallback eligibility for existing intent resolution and introduces no product concept.
- Trust check: specific/compound pattern results are not overridden; weak or absent pattern evidence can ask the already configured provider for a capability/verb route; invalid, malformed, ambiguous, or unavailable model output preserves the deterministic fallback.

## Definition of done and evidence

- `npx tsx server/tests/test-hybrid-intent-resolver.ts` — passed.
- `npx tsx server/tests/test-intent-resolver.ts` — passed, 143 passed, 0 failed.
- `npx tsx server/tests/test-intelligence-conversation-gateway.ts` — incomplete: state-management portion attempted a Postgres connection and sandbox network access returned EACCES. No credentials were inspected or changed.
- `git diff --check` — passed for source changes; existing CRLF line endings in the session dashboard produce Git's line-ending warning.

The gateway integration check remains required in an environment with its permitted database access. No live service, database, scheduled task, or configuration was changed. No deployment or server restart was performed.

## Data, rollback, scope, and acceptance

- Data impact: none; transient in-memory classification only.
- Rollback: tag `rollback/INT-hybrid-weak-fallback-20261110` points to pre-change committed HEAD `82f23226f43a3a8e8298f8863c483239a3e2a89d`. Revert only this task's source/test/report changes; preserve pre-existing meal-image changes in the same working tree.
- Scope lock: only matcher provenance, fallback eligibility, regression coverage, and this task's records were changed. No meal-image files were edited by this task.
- User acceptance: pending owner review; no browser acceptance was performed.

## Known limitation

The existing fallback accepts a validated capability and verb but intentionally discards all model-supplied parameters. These changes therefore establish fallback routing, not extraction of the planner query (for example, “chicken” or a count). A downstream query may still need deterministic parameters or a separately approved design.
