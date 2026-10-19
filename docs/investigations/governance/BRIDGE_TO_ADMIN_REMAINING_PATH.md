# Bridge to Admin Remaining Path

**Date:** 2026-08-27  
**Mode:** Investigation only. The only write made by this task is this report.  
**Protected current decision:** `tha-dec-13a290f39e9ec31417a632fb0cdf587b`

## Governance preflight

- **Verified — application authority:** `C:\Users\Colin\The Healthy Apples\GitHub\tha-integrated-dev`, branch `feat/integrated-dev`, HEAD `a007b37f7f62bd9cbb59c20edf8ced2c22144a56`.
- **Verified — bridge authority:** `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge`, branch `main`, HEAD `aae2ea30e34aa92c1a24ecccd40820160d4576c6`.
- **Verified — worktree safety:** both repositories were substantially dirty before this investigation. No existing file, decision, receipt, ledger record, registry pointer, service, or implementation was changed.
- **Governing documents read:** `PROJECT_GOVERNANCE.md`, `AGENTS.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `docs/architecture/THA_UI_ARCHITECTURE.md`, `docs/architecture/UI_CANONICAL_EXPERIENCE_OWNERSHIP.md`, `docs/change-control.md`, and the current Admin product-registry records.
- **Implementation permitted:** NO.

## Current live state

### Pipeline

**Verified:** Gate 5 owns asynchronous read requests and writes create-only, content-free terminal preparation receipts. Gate 7's `decision-factory.mjs` owns decision creation. The decision artifact owns approval state. Gate 9 owns current-decision binding and execution identity; `executions/*.json` is the durable execution ledger; Gate 8 is the bounded implementer only. `gate9-lifecycle.mjs` owns the derived phase vocabulary.

**Verified:** The canonical links currently present are decision → approval and decision → execution → terminal result. The missing link is preparation request → decision. `decision-factory.mjs` contains neither `sourceRequestId` nor the pending `registryPath` seam.

**Verified:** `GET /v1/tha/activity` is implemented, authenticated, bounded to 100 newest-first records, independently rate-limited, redacted, and read-only. It projects four unlinked record kinds: live/retained `read_request`, current-only `gate9_registry`, durable `gate9_execution`, and durable `gate9_reconciliation`. It reuses `gate9-lifecycle.mjs` for phase, but deliberately does not perform Gate 9 repository-validity checks.

**Verified:** the application already contains a contract-independent Admin shell at `/admin/activity`. It owns no lifecycle fact and currently makes no bridge request.

### Protected registryPath decision

**Verified from the canonical ledger:** `tha-dec-13a290f39e9ec31417a632fb0cdf587b` is the current approved decision, but its latest execution `tha-exec-1787824307657-7352affd` is terminal `FAILED`. Attempts 1 and 2 failed with `EISDIR`; attempt 3 ended on Claude availability/session limit. No copy-back occurred: `registryPath` is absent from `decision-factory.mjs` and `test-decision-factory-registry-path-seam.mjs` is absent. Any future retry by Claude remains separate and must be judged only from a later canonical ledger record.

## What the Admin UI can display now

Without inventing a relationship, the existing projection can display:

- a live Gate 5 request's `requestId`, type, pending/complete/failed/expired status, creation/expiry timestamps, and bounded failure reason;
- the current Gate 9 decision ID, approval status, approval/execution/reconciliation phase, approval-level blockers, activation time, and the explicit warning `repositoryValidityChecked: false`;
- every durable Gate 9 execution ID with decision ID, raw status, derived phase, and timestamps;
- reconciliation decision ID, status, closure type, approval status, and reconciliation timestamp;
- projection timestamp, count, truncation, and read-only safety declarations.

It cannot truthfully display request → decision linkage, durable request history after Gate 5 memory/retention is gone, historical decision purpose/scope/approval, full Gate 9 binding validity, worker selection/fallback, Hermes verification, or a connected end-to-end work item.

`openapi.live.yaml` does not currently publish `/v1/tha/activity`. That does not prevent a server-only application consumer, but it confirms that the response is not yet a canonical published application contract.

## Verified dependency sequence

The proposed sequence is directionally correct but incomplete. The shortest truthful path is:

1. **Finish the protected `registryPath` seam through its existing decision.** Owner: `decision-factory.mjs`. Risk: RED. Existing exact Gate 8 family: `decision-factory-registry-path`. Bootstrap: no. Deterministic command already declared: `test-decision-factory-registry-path-seam.mjs`. Current status: failed, awaiting a separately governed retry; this investigation takes no action.
2. **Implement optional, validated `sourceRequestId`.** Owner: the decision artifact created by `decision-factory.mjs`; the preparation receipt remains owner of request facts. Consumers: Gate 9 and Activity Projection. Likely scope: `decision-factory.mjs`, `test-decision-factory-provenance.mjs`. Risk: RED. Existing exact family and command: `decision-factory-provenance`. Bootstrap: no after step 1. Missing today: both implementation and test.
3. **Declare the canonical bridge-to-Administration ownership/publication contract before the UI consumes it.** Owner/approver: THA Governance Owner / appointed architecture owner; Administration remains a pure consumer under `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` §13. Risk: RED architecture. The declaration must name Gate 5 request/receipt ownership, Gate 7 decision/provenance ownership, Gate 9 execution ownership, the Activity Projection as read-only publication, redaction/bounds/authentication, and the application server as consumer. It must also decide the two unresolved owner gaps below rather than allowing the projection or UI to fill them.
4. **Admit exact future scopes through normal Gate 9.** Current Gate 8 has no scope family for Admin application files and no exact family for a durable decision-history/worker-provenance capability. Risk: RED self-hosting verifier change. Bootstrap: one normal Gate 9 scope-admission decision can add separate exact-membership families and tests; no temporary constitutional/manual bootstrap is justified.
5. **Close durable-history and worker-provenance gaps.** Gate 9 has an append-only execution ledger but no canonical decision-history/index owner. Worker/fallback/Hermes evidence is stored only in the single-slot `gate8-last-execution.json` on success or embedded in bounded stdout/stderr on failure; it is not structured per execution and the Activity Projection correctly refuses to parse it. Risk: RED ownership/persistence. Required result: canonical, append-only references/metadata owned by Gate 9, with no copy of request content and no timestamp inference.
6. **Extend the existing Activity Projection, not its ownership.** Likely scope: `server.gate5.mjs`, `test-gate5-read-capabilities.mjs`. Risk: RED because it publishes governed provenance. Existing exact family: `gate5-read-capabilities`. Bootstrap: no. It may consume only explicit `sourceRequestId`, durable preparation receipts, the declared decision-history owner, and structured Gate 9 execution metadata. It must remain authenticated, bounded, redacted, read-only, and fail honestly when a link is absent.
7. **Connect the existing Admin shell through the application server.** Owners: bridge projection for activity facts; `server/lib/access.ts::assertAdmin` for authorisation; application server for credential-protected transport; `/admin/activity` for presentation only. Likely scope: a server-only bridge client/config boundary, an `assertAdmin`-protected route in `server/routes.ts`, the existing Admin Activity page/navigation, focused server/client tests, and product/implementation records. Risk: AMBER for read-only behaviour, elevated to RED if new secret/configuration or architecture ownership is introduced. Dependency: steps 3, 4, and 6. No browser-side bridge token, app database store, lifecycle computation, or second polling state owner is permitted.

## Owner gaps that prevent the four-arrow sequence from being complete

1. **Decision history:** `gate9-current-decision.json` is intentionally single-slot. Historical decision files happen to remain on disk, but no canonical index declares them as a history set. The Activity Projection must not glob them and call that governance history.
2. **Worker orchestration provenance:** Gate 8 knows Claude/Codex selection, fallback, bounded diagnostics, deterministic tests, and Hermes review, but Gate 9's per-execution records expose only status/result/stdout/stderr. A truthful Admin view cannot infer structured worker events from log text.

These gaps mean `registryPath → sourceRequestId → Activity Projection → Admin UI` is sufficient only for a current-decision demonstration. It is not sufficient for durable recent-work provenance or observable ChatGPT/Codex/Claude/Hermes orchestration.

## Safe parallel work while Claude is blocked

**Verified:** the contract-independent `/admin/activity` shell, Admin routing/navigation, honest unavailable/loading/error structures, product-registry entry, focused static regression, and production build already exist in the dirty application worktree.

**Conclusion:** no further implementation is safely independent. Codex may continue read-only contract/test planning and inspect the shell, but any data model, polling rule, bridge client, status rendering, decision linkage, or Activity Projection change would enter the protected provenance/ownership sequence and must wait for its governed decision. In particular, `decision-factory.mjs`, `test-decision-factory-registry-path-seam.mjs`, source provenance, and Activity Projection behaviour are excluded.

## Decision count and path to value

- **Minimum after a successful registryPath seam to a useful connected page:** five governed decisions: source provenance; architecture declaration; exact scope admission; Activity Projection provenance publication; application connection.
- **Minimum to the stated durable-history and multi-worker observability goal:** approximately seven governed decisions, assuming one scope-admission decision can add separately tested exact families and the history/worker owner changes are each one bounded decision. More are required if architecture or scope admission must be split by repository/root.
- **Next decision after registryPath success:** the already-designed, exact-family `sourceRequestId` provenance implementation; no Activity or Admin files in that decision.

## Architecture and drift determination

No current governing architecture document declares Gate 5/7/8/9 lifecycle facts or the Bridge Activity Projection as an Administration source. `PROJECT_GOVERNANCE.md` governs execution authority, while investigations describe point-in-time findings and cannot become architecture by repetition. This is an **architecture gap**, not permission for the UI to invent an owner. There is no observed implementation conflict with the one-owner rule because the current Admin shell remains disconnected and the projection remains a read-only consumer. Architecture must be declared before the application consumes the projection.

## Outcome

`CURRENT_PIPELINE_COMPLETION:` Core asynchronous request, approval, governed execution, terminal ledger, lifecycle phase, and unlinked Activity Projection are live; request→decision, canonical decision history, structured worker provenance, published application contract, and Admin data connection remain incomplete.

`REGISTRYPATH_STATUS:` Current and approved; latest canonical execution `tha-exec-1787824307657-7352affd` FAILED; no implementation copied back; future retry outcome pending.

`REMAINING_BLOCKERS:` registryPath execution; sourceRequestId; undeclared bridge/Admin publication ownership; no decision-history owner; no structured per-execution worker/Hermes metadata; missing Gate 8 Admin/history/worker scope families; no app server bridge client/proxy; no published `/v1/tha/activity` schema.

`SHORTEST_VERIFIED_SEQUENCE:` registryPath success → sourceRequestId → governing ownership/publication declaration → exact Gate 8 scope admission → durable history/worker provenance → Activity Projection consumption → server-only Admin connection.

`ADMIN_UI_CAN_DISPLAY_TODAY:` Four unlinked record streams and their bounded fields listed above; not a connected lifecycle.

`ADMIN_UI_AFTER_PROVENANCE:` Explicit current and historical request→decision→approval→execution/result chains, plus worker/fallback/Hermes evidence only after Gate 9 owns that metadata structurally.

`CODEX_SAFE_PARALLEL_WORK:` Read-only contract/test planning only; the contract-independent shell is already complete.

`NEXT_DECISION_AFTER_REGISTRYPATH_SUCCESS:` Exact `decision-factory-provenance` implementation for optional validated `sourceRequestId`.

`BOOTSTRAPS_STILL_REQUIRED:` One normal Gate 9 exact scope-admission/self-hosting decision; no temporary/manual constitutional bootstrap.

`ARCHITECTURE_DECISIONS_REQUIRED:` YES — one canonical bridge lifecycle/publication/Admin-consumer declaration, including rulings on decision history and worker provenance ownership.

`ESTIMATED_NUMBER_OF_GOVERNED_DECISIONS_REMAINING:` 5 to first useful connected Admin page; about 7 to durable history plus ChatGPT/Codex/Claude/Hermes observability, after registryPath succeeds.

`PATH_TO_FIRST_USEFUL_ADMIN_PAGE:` registryPath → sourceRequestId → architecture declaration → scope admission → current-provenance Activity Projection → server-only Admin connection; show honest absence for history/worker fields until their owners exist.

`INVESTIGATION_PATH:` `docs/investigations/governance/BRIDGE_TO_ADMIN_REMAINING_PATH.md`

