# Priority 7b — Clarification Continuity

**Date:** 2026-11-09  
**Repository:** `tha-integrated-dev-g-native-20261003`  
**Branch / HEAD:** `feat/integrated-dev` / `dce7028753a24f0808adeb1e995c1d9e279665d7`  
**Risk:** 🔴 Red — Companion AI interpretation and user-facing conversation behaviour.  
**Status:** Implemented in the development worktree; no promotion or deployment.

## Governance preflight

Read the workspace `AGENTS.md`, Bridge `AGENTS.md`, repository `AGENTS.md`,
`PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`,
`docs/architecture/ENGINEERING_WORKFLOW.md`,
`docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`,
`docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`,
`docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`,
`docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`,
`docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`,
`docs/architecture/capabilities/planner.md` (attempted; absent),
`docs/ai-operating-model/{README.md,principles.md,risk-and-approval.md,rollback-and-output.md,evidence-and-architecture.md,implementation-and-compliance.md}`,
`docs/product/README.md`, and the affected Companion product entry.

`docs/architecture/capabilities/planner.md` is absent. This is not an authority
gap for the clarification-only work: no Planner capability or business behavior
is added, and the existing Planner read-port and runtime registry were
inspected. The repository's standing `feat/integrated-dev` authority permits
this development work. The user's “agreed” authorizes the described flow only;
promotion remains outside scope.

The worktree already contained the uncommitted Priority 7b routing fallback
from the preceding task. It was preserved. Before this follow-up's edits,
byte-exact copies of the affected dirty files were saved under
`G:\The Healthy Apples\Incoming\Rollback Evidence\Priority7b-Clarification-20261109`.
Timestamped sibling copies of `product.yaml` and `product.json` were created
before their respective writes. Rollback tag
`rollback/priority7b-clarification-20261109` points to the starting committed
HEAD; it does not contain uncommitted worktree state.

## Scope and changes

The canonical Pattern Intent Resolver still runs first. When the hybrid
resolver finds one plausible, currently executable route but the LLM marks it
uncertain, the Companion asks a yes/no clarification. A bare rejection yields
“No problem — what did you mean?” without another model call. On the next turn,
if pattern matching still misses, the existing provider receives the current
utterance plus at most four recent user/assistant turns (each truncated to 400
characters), and may route only to a live executable capability/verb. Model
parameters remain discarded. Ordinary turns do not add history to resolver
input. Provider, parse, or registry failures retain the original fallback.

This uses the existing Conversation Store as the only history owner. No
clarification state, schema, table, capability, assistant, service, or business
logic was added. The existing Intent Engine remains authoritative for
permission checks and invocation.

The Companion Product Knowledge entry was updated in its authored Markdown and
YAML source; `product.json` was regenerated from that source as required by the
registry's single-authoring rule.

## Files changed

- `server/intelligence/intent-resolver.ts` — optional transient clarification context.
- `server/intelligence/hybrid-intent-resolver.ts` — route-vs-clarify output, rejection follow-up, contextual retry.
- `server/intelligence/conversation/conversation-gateway.ts` — derives bounded context from existing turns only during a clarification exchange.
- `server/tests/test-hybrid-intent-resolver.ts` — routing and clarification regression coverage.
- `docs/product/intelligence/companion-capabilities/cap-companion.md` — present-tense Companion behavior.
- `docs/product/inventory/product.yaml` — authored Companion inventory record.
- `docs/product/inventory/product.json` — generated projection.
- This report.

## Architecture, trust, and data impact

- **One assistant and history:** Verified against TIP3 and Companion Platform architecture. Existing Conversation Store remains the sole owner; context is derived for the request and never stored separately.
- **One capability boundary:** only live executable registry entries can be proposed or routed; the Intent Engine keeps permission enforcement.
- **No fabricated route details:** the model cannot supply parameters or entity IDs. Ambiguity is asked as a question; a rejection is not interpreted as consent.
- **Data impact:** reads at most four existing turn texts during an active clarification. The same configured provider already used by the Gateway receives the bounded excerpt when pattern matching misses. No new persistent data, semantic changes, or backfill.
- **Definition of done:** confirmed ambiguity asks a question; bare “no” asks what the user meant without an LLM call; the next reply retries patterns and then the LLM with the bounded exchange; invalid routes and failures preserve the existing fallback.
- **User-acceptance evidence:** the user approved this interaction design in chat. Automated stubs exercise the flow; no live UI session or household data was used.
- **Highest-risk remaining claim — Inferred:** the model will distinguish “route now” from “ask first” well enough for household language. No representative benchmark has been run.

## Verification

- `npx tsx server/tests/test-hybrid-intent-resolver.ts` — passed, 17 assertions.
- `npx tsx server/tests/test-intent-resolver.ts` — passed, 143 assertions.
- `git diff --check` — passed.
- `npx tsx scripts/build-product-inventory.ts` — passed; generated 165 records.
- `npx tsx scripts/verify-product-inventory.ts` — **fails with 6 unrelated bijection errors and 180 warnings**. Failures concern `glossary.md`, `screenshots/README.md`, `OWNERS.md`, `README.md`, `adm-activity-monitor.md`, and `VISIBILITY.md`; none is the Companion entry or a file changed here. The Companion entry has a matching generated record.
- `npm run typecheck` — fails on multiple existing diagnostics in unrelated pages, scripts, and tests; no diagnostic names a file changed by this task.
- Gateway end-to-end test not rerun: the preceding run reached an existing database-backed preference read and failed with sandbox `EACCES` to Postgres. The new pure context extraction is directly covered in the resolver test.

## Rollback and scope lock

Restore the pre-follow-up copies from
`G:\The Healthy Apples\Incoming\Rollback Evidence\Priority7b-Clarification-20261109`
to the named source paths; restore the timestamped product inventory siblings
for their exact previous bytes. Keep the rollback tag and all backup files.
Do not reset, clean, delete, commit, push, promote, deploy, migrate, or touch
production/staging as part of this rollback. The uncommitted Priority 7b work
that existed before this follow-up remains preserved in the backup set.

## Implementation Completion Report

Architecture Complete: **YES for the approved clarification flow**.  
Engineering Complete: **YES for scoped implementation; repo-wide typecheck is not clean**.  
Interaction Complete: **Automated flow coverage passed; live UI acceptance not performed**.  
Existing Assets Used: **N/A**.  
New Assets Required: **NONE**.  
Remaining Gaps:

| Classification | Reason | Impact | Recommended next action | Recommended capability |
|---|---|---|---|---|
| Repository Gap | The Product Registry verifier reports six bijection failures in untouched glossary, screenshot README, registry navigation/readme, and admin activity-monitor entries. The Companion entry maps successfully. | The repository-wide registry check cannot pass, so full registry compliance cannot be claimed. | Triage and repair those six entries in a separate Product Registry maintenance task. | Product Knowledge Registry owner |
| Repository Gap | `npm run typecheck` reports multiple diagnostics in unrelated existing pages, scripts, and tests; none names a file changed here. | A clean repository-wide typecheck cannot be claimed. | Repair the baseline diagnostics in a separate engineering task, then rerun the full check. | Application engineering owner |
| External Dependency | The Gateway end-to-end test reaches a database-backed preferences read, and this sandbox denies the Postgres connection (`EACCES`). | The full Gateway regression could not be completed in this environment; pure resolver/context behavior is covered by stubs. | Rerun the Gateway test in the authorized dev environment with its configured database reachable. | Dev runtime / test environment |
| External Dependency | No live UI session was available for acceptance; the flow was verified with deterministic stubs and the interaction was agreed in chat. | Live rendered wording and interaction timing remain unobserved. | Exercise the sequence in the dev app: ambiguous question → candidate confirmation → “No” → correction. | Companion dev runtime |
| Model Capability Gap | No representative utterance benchmark or live model run was performed for the new `route` versus `clarify` choice. | Real-world clarification precision is inferred from the prompt and route-validation tests, not measured. | Evaluate a household-approved set of ambiguous and clear utterances before promoting this behavior. | Intent-routing evaluation capability |

The repository's Engineering Workflow additionally requires staging and a local
documentation commit before a task is considered complete. The supplied
workspace instructions prohibit commits without explicit user authorization;
no commit authorization was given here. Changes therefore remain uncommitted,
and promotion is not authorized.
