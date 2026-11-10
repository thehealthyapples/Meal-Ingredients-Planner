# Priority 7b — LLM Routing Fallback

**Date:** 2026-11-09  
**Repository:** `tha-integrated-dev-g-native-20261003`  
**Branch / starting HEAD:** `feat/integrated-dev` / `dce7028753a24f0808adeb1e995c1d9e279665d7`  
**Risk:** 🟡 Amber — intent-routing behavior.  
**Status:** Implemented on the authorized development branch; not promoted.

## Preflight and authority

Read the workspace `AGENTS.md`, Bridge `AGENTS.md`, repository `AGENTS.md`,
`PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`,
`docs/architecture/ENGINEERING_WORKFLOW.md`,
`docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`,
`docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`, and
`docs/ai-operating-model/{README.md,principles.md,risk-and-approval.md,rollback-and-output.md,evidence-and-architecture.md,implementation-and-compliance.md}`.
The file named `Claude-Priority7b-LLMRoutingFallback-Preflight-2026-11-09.md`
was not present in the workspace. Its design and scope were supplied in the
current task. The repository grants implementation authority for work confined
to `feat/integrated-dev`; no promotion is authorized.

Initial status was clean, with the branch one commit ahead of origin. The
rollback tag `rollback/priority7b-pre-implementation-20261109` points to the
starting HEAD. Rollback is to remove the uncommitted changes in this report's
scope while preserving that tag and unrelated user work; no reset, cleanup, or
commit was performed.

## Scope and implementation

`HybridIntentResolver` wraps the existing `PatternIntentResolver`. It calls the
existing `ILlmProvider` only when the pattern result contains an `unknown` gap.
The prompt receives the live executable capability catalogue. The model may
return only a capability ID and verb; its answer is rechecked against the live
Capability Registry and executable verb list. Model-supplied parameters are not
accepted. If the provider is unavailable, output is malformed, the route is not
registered/executable, or any exception occurs, the original pattern result is
returned unchanged. The Gateway injects its existing provider into this wrapper.

**Files changed:**

- `server/intelligence/hybrid-intent-resolver.ts` — bounded resolver fallback.
- `server/intelligence/conversation/conversation-gateway.ts` — production resolver wiring.
- `server/tests/test-hybrid-intent-resolver.ts` — focused behavior checks.
- This report.

**Non-goals:** no change to matchers, capability handlers, business services,
conversation persistence, schema, prompts for user-facing answers, provider
infrastructure, or production configuration. No database, live service,
scheduled task, or credential was touched.

## Architecture and trust checks

- **Canonical ownership:** the runtime Capability Registry remains the sole
  owner of executable capability/verb metadata; no entity or alternate registry
  was introduced.
- **Architecture extension:** the existing `IIntentResolver`, Gateway, provider,
  Intelligence Platform, and Intent Engine are reused. Existing handlers and
  permission checks remain authoritative.
- **No duplicate state:** no conversation or routing state is persisted.
- **Honest fallback:** model failure or unsupported routes preserve the existing
  pattern result. Model parameters are discarded to avoid invented identifiers.
- **Data impact:** reads the utterance and current in-memory capability metadata;
  writes no data, changes no stored meaning, requires no backfill.
- **Definition of done:** model is called only on genuine unknown misses; only
  live executable routes are accepted; all failures preserve prior behavior.
- **User acceptance:** no live UI acceptance performed; behavior is covered by
  the focused resolver test and existing resolver suite.

## Verification

> **Superseded note (2026-11-10):** the counts below are a snapshot at this
> task's own HEAD. The clarification-continuity follow-up
> (`PRIORITY7B_CLARIFICATION_CONTINUITY_20261109.md`) extended the same test
> file; its own Verification section states the current, accurate count
> (17 assertions) and is authoritative going forward. Left here unedited as
> the historical record of what was true when this report was written,
> per the independent review that found this discrepancy
> (`Claude-Priority7b-Independent-Review-2026-11-09.md`, Finding 1).

- `npx tsx server/tests/test-hybrid-intent-resolver.ts` — passed, 8 assertions
  (at this task's HEAD; see superseded note above).
- `npx tsx server/tests/test-intent-resolver.ts` — passed, 143 assertions.
- `npx tsx server/tests/test-intelligence-conversation-gateway.ts` — blocked
  during an existing database-backed preference read; sandbox denied outbound
  Postgres connections with `EACCES`. (Independently re-run in a different
  environment during the review above: 64/64 passed — the block was
  environment-specific, not a defect in this change.)
- `npm run typecheck` — started but did not complete within the available
  execution window; stopped without a result. No typecheck pass is claimed.

## Remaining assumptions

- **Inferred:** the supplied preflight accurately represents the owner-approved
  intent for Priority 7b; the named file itself was unavailable for inspection.
- **Verified:** the current Gateway provider is `gpt-4o-mini` when configured;
  fallback calls are bounded to genuine pattern misses. API pricing varies and
  the recommended cheapest model is answered separately in chat.

## SUGGESTIONS

- Evaluate model routing on a representative set of real coverage misses before
  considering wider rollout; this implementation has no live benchmark result.
