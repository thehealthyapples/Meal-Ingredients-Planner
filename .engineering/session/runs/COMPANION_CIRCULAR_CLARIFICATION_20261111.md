<!-- Engineering Session Recovery: concise progress only. -->

# Session: COMPANION_CIRCULAR_CLARIFICATION_20261111

| Field | Value |
|---|---|
| **Session ID** | `COMPANION_CIRCULAR_CLARIFICATION_20261111` |
| **Rollback ID** | `rollback/COMPANION-circular-clarification-20261111` → `82f23226f43a3a8e8298f8863c483239a3e2a89d` |
| **Start date** | 2026-11-11 |
| **Current stage** | Waiting for User |

## Objective
Explain why Companion repeatedly asks “Are you asking whether…” for “how much chicken is needed this week” and identify the true answerability boundary.

## Governance preflight
- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`.
- Branch / HEAD: `feat/integrated-dev` / `82f23226f43a3a8e8298f8863c483239a3e2a89d`.
- Starting worktree: 21 pre-existing dirty status entries. Preserve all.
- Risk: RED investigation of Companion AI intent resolution.
- Scope: read-only source investigation and documentation records only. Product-code changes are not authorized by this turn.
- Documentation/report writes permitted under dev-branch authority; no runtime change.
- Governing files read: root `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/REPOSITORY_CONVENTIONS.md`, `docs/architecture/CAPABILITY_BOUNDARY_ASSESSMENT.md`, `docs/ai-operating-model/README.md`, `principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, `implementation-and-compliance.md`, plus task-specific Intelligence Platform, AI Capability Registry, AI Experience/Conversation, and INTARCH1 architecture documents.
- Rollback tag created before report-file edits: `rollback/COMPANION-circular-clarification-20261111` → the HEAD above.

## Findings
- **Verified:** HybridIntentResolver's system prompt tells the model to choose a route only when clear and to return `kind=clarify` when a plausible interpretation needs confirmation (`server/intelligence/hybrid-intent-resolver.ts`).
- **Verified:** when the model returns `clarify`, the resolver sanitizes the summary only for whitespace/length/question-mark constraints, then mechanically prefixes `Are you asking whether `. It does not check whether the question distinguishes alternatives or adds information.
- **Verified:** `buildClarificationContext` reuses the previous no-route clarification and up to four turns (`server/intelligence/conversation/conversation-gateway.ts`). HybridIntentResolver has a special no-call path for a bare “no”; a substantive restatement is sent to the model again. The model can therefore return another `clarify` and repeat the cycle.
- **Verified:** the recent query extraction applies only after a `kind=route` response. The reported transcript follows the `kind=clarify` branch, so query verification never runs and could not prevent this prompt.
- **Verified:** `planner-discovery` searches across planner weeks by matching the query against meal names (`server/intelligence/services/planner-discovery-engine.ts`); its handler returns matching meal entries/count and never reads recipe ingredient quantities.
- **Verified:** `shopping-discovery` searches the caller's existing shopping list by product/normalized name and returns the quantity and unit already stored on those rows (`server/intelligence/services/shopping-discovery-engine.ts`, `shopping-discovery-port.ts`). It does not calculate totals from planned recipes.
- **Inferred:** the model is uncertain which existing route fits “how much chicken is needed this week” because the prompt gives it only executable capability IDs/names/verbs, while the request could mean a stored shopping-list amount or an amount derived from planned recipe ingredients. The actual provider JSON for these turns is not available, so the model's internal rationale cannot be proven.
- **Verified:** the user's second message restates the same request. Asking whether they mean the same words is circular and not a useful clarification, even if the system lacks the requested data path.

## Recommended product behavior
Do not echo a paraphrase as a yes/no clarification. If Companion can see a stored shopping-list quantity, search that list and state that this is the amount already listed. If the user expects a total computed from this week's recipe ingredients, the current planner-discovery capability cannot answer it; return that limitation honestly or implement the separately governed aggregation path. A meaningful clarification, if still needed, should distinguish those two sources of quantity.

## Scope and completion
- No product source, tests, handler, port, service, database, configuration, live process, or image task was changed.
- No test suite run; this was a read-only root-cause investigation.
- Live runtime evidence is the transcript supplied by the user; no browser or provider logs were inspected.
- Highest remaining inference: why the model selected `kind=clarify`; verifying that requires the sanitized provider classification trace for that turn.
- Investigation report: `docs/investigations/companion/COMPANION_CIRCULAR_CLARIFICATION_20261111.md`.
- Shared agent report: `G:\The Healthy Apples\Incoming\Agent Reports\companion-circular-clarification-investigation-2026-11-11.md`.

## Next action
Owner to decide whether the desired quantity is the amount already stored on the shopping list or a sum derived from this week's planned recipes. Keep those meanings separate; no behavior change is included in this investigation.

---
_Stages: Planning → Rollback Complete → Investigation → Documentation → Waiting for User → Complete (or Blocked)._

## Follow-up — implemented on 2026-11-11

Owner requested recipe-derived weekly ingredient quantities. Follow-up implementation now routes and calculates them from planner recipe lines, and asks a two-meaning clarification when needed. Pattern Resolver 148/148, Planner Binding 53/53, Context Composition 171/171, and Hybrid Resolver passed; Gateway/Postgres integration remains blocked by `EACCES`. The implementation supersedes the investigation's recommendation to defer planner totals; live Companion acceptance is still pending.
