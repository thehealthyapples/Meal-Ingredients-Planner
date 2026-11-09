# Healthy Apples Project Governance

This file is the authoritative project brief for ChatGPT, Claude Code, Codex, and any other delegated agent working in this repository.

## Repository and safety

## Root governance authority

The ultimate THA governance authority is held by the equal THA Governance Owners:

- Colin — `ownerId: tha-governance-owner-001`
- Lindsay — `ownerId: tha-governance-owner-002`

Either Governance Owner may independently appoint or remove subordinate governance
owners, appoint architecture owners, define Gate 9 execution-governance ownership,
approve governing-architecture amendments, define governed repository boundaries,
resolve ownership gaps, delegate or revoke bounded authority, and ratify or supersede
governance contracts. Joint approval is required only to remove or materially reduce
the other owner's authority, transfer ultimate THA ownership, change this root-of-trust
model, appoint a successor to ultimate ownership, or for a matter explicitly marked
joint-approval-only.

The Governance Owners' authority is bounded by the safeguards in this repository:
Gate 9 remains the sole normal governed implementation execution authority. The only
exception is the explicitly recorded, temporary `THA_ROOT_BINDING_BOOTSTRAP_OPERATOR`
appointment below, which exists solely to restore Gate 9's own governed repository-root
capability when normal Gate 9 execution is circularly impossible. Historical
decisions and evidence remain immutable; rollback, security, production-data,
deployment, and migration controls remain in force; and no delegated owner may create
a second execution authority.

Root-governance approvals are recorded in the affected governing document and its
implementation/governance record, identifying the approving owner, stable owner ID,
scope, decision, effective date, and rollback information where applicable. A change
to this root-of-trust model or succession requires joint approval and a deliberate
replacement of this declaration.

### Execution governance delegation

The Governance Owners may delegate the bounded role `THA_EXECUTION_GOVERNANCE_OWNER`.
That role owns only Gate 9 execution-boundary governance, the governed repository-root
allowlist, the Gate 8 execution-root contract, worker-lifecycle governance, and their
verification requirements. It does not own product, domain, experience, or application
architecture outside execution governance. Delegation and revocation must be recorded
here or in a directly indexed governance record by an identified Governance Owner.

The governed repository-root allowlist is exactly:

- Application: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- Bridge: `G:\The Healthy Apples\Infrastructure\tha-chatgpt-bridge`

(Updated 2026-10-03: previously `C:\Users\Colin\The Healthy Apples\GitHub\tha-integrated-dev` and `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge` — the owner-directed G: cutover of the active development authority and Bridge repository. The prior C: locations remain intact as rollback/reference copies, not deleted or altered. Historical appointment records elsewhere in this document that cite the former C: paths describe what was true when each record was made and are preserved unchanged.)

Every governed decision must declare exactly one authoritative root. Gate 9 remains the
sole governed implementation execution authority, and Gate 8 may execute only against
the root declared by the current approved decision. The selected root drives repository
identity, branch, HEAD, status fingerprint, governance hashes, protected baselines,
rollback validation, isolated worktree, writable scope, and copy-back destination.
Decision and receipt roots must match exactly. Missing, unknown, unallowlisted,
mismatched, mixed-root, absolute, escaping, traversal, cross-root, branch, HEAD,
status, governance, rollback, and historical-root mutations fail closed. Existing
application-root decisions retain their prior semantics; bridge-root decisions use the
same Gate 9 approval, evidence, current-decision, and execution process. Manual
execution outside Gate 9 remains prohibited except for the active bootstrap appointment
below, within its exact recorded scope and safeguards.

- The authorised local THA development repository context for new work is `tha-integrated-dev`, at `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003` (updated 2026-10-03; previously `C:\Users\Colin\The Healthy Apples\GitHub\tha-integrated-dev`), on branch `feat/integrated-dev`. ChatGPT, Hermes, Codex, Claude, and delegated agents must verify that exact worktree, branch, base commit, and Git status before new THA work begins.
- The previous source worktrees remain preserved historical worktrees and must not be deleted, reset, cleaned, stashed, or modified merely because development authority has moved: `C:\Users\Colin\The Healthy Apples\GitHub\tha-cookbook-real-book-functional` and `C:\Users\Colin\The Healthy Apples\GitHub\tha-living-larder-authoritative`.
- Historical governance decisions remain bound to the repository, branch, and HEAD against which they were created. In particular, `tha-dec-69609e354424604161bb3dd2d501ce99` remains NOT APPROVED and historically bound to `feat/cookbook-real-book-functional` at `a007b37f7f62bd9cbb59c20edf8ced2c22144a56`; it must not be transferred, rebound, approved, or executed against `feat/integrated-dev`.
- Establishing `tha-integrated-dev` as development authority does not itself authorise application implementation. *(This bullet previously read "The backend currently running from `tha-living-larder-authoritative` on port 5000 may remain there temporarily for runtime safety; that runtime location is not the governing development authority" — corrected 2026-11-02 after live-process verification: `netstat`/`wmic` against the PIDs actually listening on ports 5000 and 5001 found no `tha-living-larder-authoritative` process running at all. Both the backend (`tsx server/index.ts`, port 5000) and the frontend (`vite --config vite.frontend-only.config.ts`, port 5001) are running from `tha-integrated-dev-g-native-20261003`. The runtime has moved to the governing development authority; the prior sentence is retained here as history of a temporary state that has since ended, not as current fact. A separate dated agent report, `2026-11-02__repo-attribution-correction__living-larder-vs-integrated-dev.md`, records the verification evidence and re-attributes an unrelated same-day Codex UX review's findings — mislabelled by that review as `tha-living-larder-authoritative` — to `tha-integrated-dev`.)*
- Current feature worktree/branch must be verified before every delegated task.
- Do not commit, tag, push, open PRs, deploy, migrate the database, change credentials, or modify production/staging without explicit user authorization.
- Never read, print, copy, or expose secrets. Treat local `.env` files as authoritative and confidential.
- Preserve unrelated dirty-worktree changes. Do not reset, clean, or overwrite them.

### Objective-bounded child admission (V2b)

**Ratification status:** JOINTLY RATIFIED  
**Effective at:** `2026-08-28T09:46:09Z`  
**Ratifying owners:** Colin (`tha-governance-owner-001`) and Lindsay (`tha-governance-owner-002`) — Lindsay's approval given by phone and relayed for the record by Colin.  
**Amendment:** `Objective-bounded child admission (V2b)`

This amendment is ratified and effective. It authorizes the concept and the
`admission` field's semantics described below. It does not itself constitute or
authorize any implementation: the code implementing this section — the
`decision-factory.mjs` child-minting function, the `gate8-execute-approved-decision.mjs`
admission wiring, and the Gate 9 lineage exposure — remains its own separate,
normally-governed RED decision, requiring its own human-approved parent objective,
its own verification-family registration, and independent deterministic and Hermes
verification, exactly as every prior capability in this workstream has. No such
implementation decision has been created, approved, or executed as of this
ratification.

This amendment creates one new, narrowly bounded authorization channel for decision
execution. It does not alter, redefine, or create any second way to set
`approval.status`. Everywhere in this repository, `approval.status: 'APPROVED'`
continues to mean exactly what it has always meant: a human typed the exact required
phrase for that specific decision. This amendment does not change that invariant for
any decision, including any decision admitted under it.

**The new channel.** A decision may additionally carry an `admission` field, distinct
from and independent of `approval`, of the form `{ status: 'ENVELOPE_ADMITTED',
parentObjectiveId, admittedAt }`. Gate 8 may treat a decision as executable if either
its `approval.status` is `'APPROVED'` (the existing, unchanged path), **or** all of the
following hold simultaneously:

1. The decision's `admission.status` is `'ENVELOPE_ADMITTED'`.
2. `admission.parentObjectiveId` identifies a decision whose own `approval.status` is
   `'APPROVED'` by a human-typed phrase, which carries a hash-bound `objectiveEnvelope`
   (per the ratified Objective Envelope Binding capability), and which is, at the
   moment of admission, currently bound as Gate 9's current decision, unexpired, and
   re-validated live — not read from a cached prior check.
3. `governed-objective-policy.mjs`'s `admitChildFile()` predicate passes, evaluated
   live at the moment of admission against the parent's current envelope: the child's
   file is an exact member of the envelope's declared capability family, the child's
   independently classified risk (never self-declared) is at or below the envelope's
   risk ceiling, the envelope has not expired, and the envelope's admission budget is
   not exhausted.
4. The child decision was minted with its own fresh `decisionId`, receipt, repository
   status fingerprint, dirty-pre-state baseline, rollback package, and execution-ledger
   entry — never inherited, copied, or reused from the parent decision's or any sibling
   child's worktree, baseline, or in-flight state.

Any decision lacking `admission` behaves exactly as every decision does today; this
amendment adds no new requirement or check to the existing human-phrase path.

**Fail-closed, unconditionally, regardless of family or ceiling fit:** a
canonical-owner mismatch against the SoT register; a file classified security,
authentication, governance, schema, or application-root by the independent risk
classifier; expansion beyond the envelope's declared capability family; risk above the
declared ceiling; an expired envelope; an exhausted admission budget; any attempt by a
child to widen its own worker policy beyond the parent envelope's ceiling; and any
attempt by a child decision to redefine its own family, verification plan, acceptance
criteria, or root/owner. Each of these routes to the same outcome execution failure
already produces today: rollback restored, run stopped, no copy-back.

**This amendment does not:**
- create a second execution authority — Gate 9 remains the sole approval/binding/
  readiness authority and Gate 8 remains the sole isolated implementation/
  verification/copy-back authority;
- grant any standing or permanent admission capability — each parent objective's
  envelope is itself a single, human-approved, expiring, budget-bounded decision;
- authorize commit, push, deployment, migration, or any production/staging action for
  any admitted child, which remain exactly as unreachable to Gate 8 as they are today;
- retroactively apply to any decision approved before this amendment's ratification
  date.

## Temporary root-binding bootstrap appointment

**Status:** TERMINATED — verification matrix passed; no residual authority.

Colin, `ownerId: tha-governance-owner-001`, appoints the following bounded bootstrap
instrument under the root governance authority. This is a temporary constitutional
bootstrap exception, not a general manual-execution path, because normal Gate 9 cannot
execute the bridge-root repair required to restore its own root capability.

- **Role ID:** `tha-root-binding-bootstrap-operator-001`
- **Role:** `THA_ROOT_BINDING_BOOTSTRAP_OPERATOR`
- **Appointing owner:** Colin (`tha-governance-owner-001`)
- **Effective at:** `2026-08-21T20:00:01.1935937Z`
- **Rollback:** `rollback/tha-root-binding-bootstrap-appointment-20260821-205945`
- **Terminated at:** `2026-08-21T21:08:00Z`

The role may implement only the minimum Gate 9/Gate 8 repository-root binding needed
to govern exactly these repositories:

- `C:\Users\Colin\The Healthy Apples\GitHub\tha-integrated-dev`
- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge`

Its permitted implementation scope is limited to `server.gate9.mjs`,
`gate8-execute-approved-decision.mjs`, one strictly necessary governed-root/path
validation helper, and directly necessary root-binding regression tests in the bridge
repository. It may not approve decisions, replace Gate 9, create another execution
authority, modify product/application source, alter historical decisions or receipts,
change unrelated governance, modify Hermes, deploy, migrate, change production or
staging data, commit, push, or perform cross-root writes.

The role must preserve exact single-root-per-decision binding, selected-root validation
and execution, fail-closed unknown/mixed/escaping/cross-root paths, application-root
compatibility, bridge-root isolation, historical immutability, and no-copy-back-after-
failed-validation. A fresh annotated rollback tag, complete dirty-state preservation,
tracked patch, external untracked/binary preservation, SHA-256 manifest, registry
pre-state/hash, and restore procedure are required before implementation.

This appointment automatically terminates with status `TERMINATED` once Gate 9 has
validated both governed roots, bridge execution selects the bridge repository,
application execution remains unchanged, cross-root/unknown-root tests pass, and
rollback and historical-immutability tests pass. After termination the role has no
residual authority. Gate 9 again becomes the sole governed implementation execution
authority without exception, and all subsequent bridge-root work must use normal Gate 9
decisions, approval, evidence, current-decision ownership, and execution.

### Ratified repeat-bootstrap amendment

**Ratification status:** JOINTLY RATIFIED  
**Effective at:** `2026-08-21T21:30:00Z`  
**Ratifying owners:** Colin (`tha-governance-owner-001`) and Lindsay (`tha-governance-owner-002`)  
**Amendment:** `Repeat temporary constitutional bootstrap appointments`

The Governance Owners jointly ratify the repeat-bootstrap amendment. A Governance
Owner may appoint a temporary `THA_ROOT_BINDING_BOOTSTRAP_OPERATOR` only when Gate 9
cannot execute the change required to restore its own governed capability and normal
Gate 9 execution is therefore circularly impossible. Each appointment must have a
unique role ID, explicit circular-self-repair reason, exact permitted and prohibited
scope, fresh rollback/pre-state package, verification matrix, effective timestamp,
automatic termination condition, zero residual authority, and an explicit statement
that Gate 9 remains the sole normal governed implementation execution authority.

Repeat appointments are permitted only after the prior appointment has terminated and
only for the same narrowly bounded self-repair class. They may not approve or execute
decisions, create a parallel authority, alter historical artifacts, bypass Gate 9 for
ordinary work, or modify unrelated dirty state. After the recorded verification matrix
passes, the role terminates immediately and all subsequent work returns to normal Gate
9 decision, approval, evidence, current-owner, and execution controls.

### Temporary current-decision owner bootstrap appointment

**Status:** TERMINATED — verification matrix passed; no residual authority.  
**Role ID:** `tha-current-decision-owner-bootstrap-operator-001`  
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`  
**Appointing owner:** Colin (`tha-governance-owner-001`)  
**Reason:** Gate 9 root binding is repaired, but the current-decision owner transition capability is missing; normal Gate 9 execution is circularly unable to create that capability.  
**Effective at:** `2026-08-21T21:30:00Z`  
**Terminated at:** `2026-08-21T21:45:00Z`  
**Rollback:** `rollback/tha-transition-tool-bootstrap-20260821-213000`  
**Bridge pre-state package:** `C:\Users\Colin\AppData\Local\Temp\tha-transition-tool-bootstrap-20260821-213000`

Permitted files and decision target only:

- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\transition-current-decision-owner.mjs`
- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\test-transition-current-decision-owner.mjs`
- Candidate `tha-dec-3c4c4c1e8f36976ccd0c38eb9b009d5f` only, after the tool's validation passes.

Prohibited: application source; Cookbook, Pantry, or Planner; Gate 8 verifier;
Gate 9 root-binding implementation; Hermes; governance ownership; historical
decisions, receipts, approvals, or execution records; unrelated dirty files; any
other decision; cross-root writes; approval; execution; commit; push; deployment;
migration; or production/staging data operations.

The required verification matrix is: valid NOT_APPROVED candidate accepted; candidate
state remains NOT_APPROVED with implementationAuthorised=false and executable=false;
only `gate9-current-decision.json` changes on activation; prior current and historical
artifacts remain byte-identical; malformed, wrong-schema, hash-mismatched,
repository/branch/HEAD/status/governance/rollback-mismatched, and APPROVED candidates
fail closed; atomic-write failure preserves the previous registry; and no execution
is triggered. The role terminates automatically when this matrix passes, with zero
residual authority. Gate 9 remains the sole normal governed implementation authority.

### Temporary Gate 8 dependency-free verifier bootstrap appointment

**Status:** TERMINATED — verification matrix passed; zero residual authority.  
**Role ID:** `tha-gate8-dependency-free-verifier-bootstrap-operator-001`  
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`  
**Appointing owner:** Colin (`tha-governance-owner-001`)  
**Reason:** Gate 9 cannot execute the approved Gate 8 verifier repair because the
current verifier requires bridge `node_modules` before it can apply the repair;
normal Gate 9 execution is therefore circularly incapable of restoring its own
dependency-free bridge verification capability.  
**Effective at:** `2026-08-21T21:47:05.2356376Z`  
**Terminated at:** `2026-08-21T21:49:36.0000000Z`  
**Rollback:** `rollback/tha-gate8-dependency-free-verifier-bootstrap-20260821-223500`  
**Bridge pre-state package:** `C:\Users\Colin\AppData\Local\Temp\tha-gate8-bridge-dependency-free-verifier-20260821-223500`

The role may implement only this exact Gate 8 dependency-free bridge/orchestration
verification repair and its direct regression proof:

- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\gate8-execute-approved-decision.mjs`
- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\gate8-repair-loop.mjs`
- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\test-gate8-repair-loop.mjs`
- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\test-gate8-verification-scope.mjs`

The permitted repair is limited to an explicit dependency-free Node verification
mode for bridge/orchestration scope. It must not install or copy dependencies,
weaken isolation, suppress unrelated tests, add permissive scope matching, or alter
the application verification path.

Prohibited: application source; Cookbook, Pantry, or Planner; Hermes; Gate 9;
historical decisions, receipts, approvals, or execution records; governance
ownership; unrelated dirty files; dependency installation or copying; cross-root
writes; approval; execution of any other decision; commit; push; deployment;
migration; or production/staging data operations.

The required verification matrix is: application scope retains its existing
node_modules/typecheck/build behavior; bridge scope runs only the exact declared
dependency-free Node regression tests; missing dependencies do not block bridge
scope; Cookbook contract does not run for bridge scope; missing, malformed, unknown,
mixed, or cross-domain scope fails closed; protected-path, root-binding, bounded
retry, and copy-back protections remain active; failed verification cannot copy back;
and all unrelated protected paths remain unchanged. The role terminates immediately
when this matrix passes, with zero residual authority. Gate 9 remains the sole normal
governed implementation authority, and all subsequent work returns to normal Gate 9
decision, approval, evidence, current-owner, and execution controls.

### Temporary Gate 8 restart-summary verifier bootstrap appointment

**Status:** TERMINATED — verification failure on the sole edit attempt; zero residual authority.  
**Role ID:** `tha-gate8-restart-summary-verifier-bootstrap-operator-001`  
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`  
**Appointing and approving owner:** Colin (`tha-governance-owner-001`), explicitly approved in the 2026-10-21 Codex conversation after independent review.  
**Effective at:** `2026-10-21T13:31:10Z`  
**Terminated at:** `2026-10-21T13:32:15Z`  
**Governed root / branch / HEAD:** `G:\The Healthy Apples\Infrastructure\tha-chatgpt-bridge` / `main` / `d34be625edf167d9c96926537e3643c6e962c3d8`.  
**Dirty-state binding:** 31 entries (9 modified, 22 untracked); raw porcelain SHA-256 `403e416038a03ef371a8bb9e8d3198140fd1304d80e6869dcce1bd03a9f3810c`.  
**Bridge rollback tag:** `rollback/tha-gate8-restart-summary-verifier-bootstrap-20261021`, annotated tag object `d4c0df15ee81589a731eff459bde08ec617f600e`, target HEAD above.  
**Bridge pre-state package:** `G:\The Healthy Apples\Incoming\Rollback Evidence\THA-GATE8-RESTART-VERIFIER-CODEX-20261021`, manifest SHA-256 `734592CD4167A7193098A9BF266C7C1F28E6256C5AACD1BBF16F63458960D6E2`; all 31 dirty-file copies verified against live bytes with zero mismatches. The clean sole-edit target's pre-state SHA-256 is `5F7F2E1FE6B54466FC330FB68862A88059ED246A8F8478C71B266E430AB0AC52`.  
**Governance-record rollback:** `rollback/tha-gate8-restart-verifier-governance-20261021`, annotated tag object `9245f1ccd0878c41820ae5c4086b9f73381b05a7`, target integrated HEAD `bffc533d65f58ae30c1faf7d3026b50dcc17be89`; byte-exact `PROJECT_GOVERNANCE.md` pre-state copy is in the Bridge package's `governance-prestate` directory, SHA-256 `02D8520F2318F03FB40123187281EA1E00F728F0A91E811F4036C634891987EC`.

**Circular-self-repair reason:** `test-gate8-verification-scope.mjs` rejects the existing Gate 9 restart-summary formatter call. The exact one-file repair has no Gate 8 verification family; the normal two-file self-hosting verification-family registration requires this same currently failing test to pass, and its additive-only gate cannot authorize the non-additive assertion repair. Normal Gate 9 cannot restore its own prerequisite verifier gate. This appointment is an exception only for that bounded self-repair; Gate 9 remains the sole normal governed implementation execution authority.

The temporary operator may make **one edit attempt** in exactly one Bridge file: `test-gate8-verification-scope.mjs`, limited to its restart-summary non-disclosure assertion and directly necessary focused negative assertions. It may accept only the exact `Write-Host (Format-ThaGate9RestartSummary -RestartResult $restartResult -ExplicitValues $gate9ExplicitValues)` call after proving the formatter outputs only boolean key presence and no map value. The existing receipt ban, direct token/map output ban, and token handoff checks remain. The owner-approved detailed scope, protected hashes, and verification matrix are directly indexed at `G:\The Healthy Apples\Incoming\Agent Reports\THA-GATE8-RESTART-VERIFIER-BOOTSTRAP-APPOINTMENT-PROPOSED-2026-10-21.md` and the final activation package of the same date. No other Bridge file may be edited.

**Prohibited:** editing the Claude-owned `start-tha-services.ps1`, `scripts/gate9-restart-only.ps1`, or `test-gate9-restart-only-lifecycle.ps1`; editing `gate8-repair-loop.mjs`, root/decision mechanisms, unrelated dirty state, or application files; altering approval/execution semantics; creating, approving, replaying, binding, or executing a decision; skipping or weakening verification; credentials/configuration, services, database, scheduled tasks, cross-root writes, commit, push, deploy, migration, reset, clean, stash, staging, or branch switch. This recorded appointment is the sole authorized governance-record change; it does not allow the operator to amend governance again except to record its terminal status and evidence.

**Required matrix:** syntax and exact one-file diff review; `node test-gate8-verification-scope.mjs`; `node test-gate8-repair-loop.mjs`; PowerShell `test-gate9-restart-only-lifecycle.ps1` and `test-gate9-readonly-token-forwarding.ps1` under process-only execution-policy bypass; deterministic negative tests proving direct token/map output, formatter value interpolation, changed formatter invocation, and receipt leakage fail; unchanged hashes for all protected dependencies and 31 unrelated dirty files; and no decision, service, credential, database, scheduled-task, or application side effect. No test may be skipped or suppressed.

**Single-use automatic termination:** this role terminates immediately with `TERMINATED` status and zero residual authority on the first of successful matrix completion, **any** verification failure, baseline/package drift, actual or attempted scope violation, or owner revocation. On failure, preserve evidence and stop all writes; no retry or restoration edit is authorized by the expired role. Another attempt needs a new owner-reviewed appointment and binding. Upon termination all future work returns to the normal Gate 8/Gate 9 process. The byte-exact package can restore only the sole target after separate rollback authorization; the tags protect committed HEAD and do not restore dirty files. Never use blanket reset, clean, or checkout over unrelated work.

**Termination evidence:** `node --check test-gate8-verification-scope.mjs` passed. The next required check, `node test-gate8-verification-scope.mjs`, failed at the newly added `assertKeyPresenceOnly` assertion: it counted both the formatter parameter declaration and its single `ContainsKey` use (`2 !== 1`). This is a verification failure under the single-use rule, so the appointment terminated immediately. No corrective edit, retry, or remaining verification command was run. The one-file failed diff and external pre-state package are preserved for separate owner review and rollback authorization.

### Temporary Gate 8 restart-summary verifier correction bootstrap appointment

**Status:** TERMINATED — full verification matrix passed on the sole edit attempt; zero residual authority.
**Role ID:** `tha-gate8-restart-summary-verifier-bootstrap-operator-002`
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`
**Appointing and approving owner:** Colin (`tha-governance-owner-001`), who approved this exact appointment verbatim in a 2026-10-21 ChatGPT conversation, using the wording and bindings independently reviewed by Claude in `G:\The Healthy Apples\Incoming\Agent Reports\THA-GATE8-RESTART-VERIFIER-CORRECTION-APPOINTMENT-INDEPENDENT-REVIEW-CLAUDE-2026-10-21.md`.
**Owner approval evidence (verbatim, as supplied to the operator):**

> I, Colin (`tha-governance-owner-001`), approve the proposed single-use `tha-gate8-restart-summary-verifier-bootstrap-operator-002` appointment exactly as written, bound to Bridge `main` HEAD `d34be625edf167d9c96926537e3643c6e962c3d8`, 32-entry status fingerprint `b75f8487e9418b0c49dcc8ca8d9a8a8f7735656fed8c4566cdf9c02e47535dd0`, target pre-state `4694BB48B050FA88DD6E315153E2BE5A646659CCDF035A9DA197FF38A837F77C`, and manifest `4A6F8B210AE7BA2BB1F56705A2FFB0D69095787CEFA175F44629C2E91BEB2052`. I authorize a fresh annotated rollback tag and the authoritative appointment record. This approval permits only the specified assertion-site correction and verification matrix; it does not approve any Gate 9 decision or execution.

**Effective at:** `2026-10-21T14:58:00Z`
**Governed root / branch / HEAD:** `G:\The Healthy Apples\Infrastructure\tha-chatgpt-bridge` / `main` / `d34be625edf167d9c96926537e3643c6e962c3d8`.
**Dirty-state binding:** 32 entries (10 tracked modified, 22 untracked); raw `git status --porcelain=v1 --untracked-files=all` SHA-256 `b75f8487e9418b0c49dcc8ca8d9a8a8f7735656fed8c4566cdf9c02e47535dd0`.
**Target pre-state:** `test-gate8-verification-scope.mjs` SHA-256 `4694BB48B050FA88DD6E315153E2BE5A646659CCDF035A9DA197FF38A837F77C` — the prior terminated appointment's failed diff, preserved unchanged; this appointment's sole edit is made on top of it, not a reset to the original clean file.
**Protected dependency hashes (read-only, unchanged):** `gate8-repair-loop.mjs` `17E9C448A7EB4294F11937835F678712B00370A6ABC3B5D56DC883002318CD61`; `start-tha-services.ps1` `FA3DAD4D7EBB811F6EF288E0FBC2BD2CEB83A59AF8A643AEE4CBF8C2CBCAB9D4`; `scripts/gate9-restart-only.ps1` `E557E8CBBCB9D0228D36F0FDDA565AA7A735B589AFD5208814C13B4851224D54`; `test-gate9-restart-only-lifecycle.ps1` `529AA1EF749648F91A29CAD8D4954AE348E6D86FFF6F53317D3B089B936B1517`.
**Bridge rollback tag:** `rollback/tha-gate8-restart-summary-verifier-correction-20261021`, annotated tag object `e3a7e980500f313de25864dee1f3b49922531b1a`, target HEAD above. Created and independently verified by the operator immediately before this record.
**Bridge pre-state package:** `G:\The Healthy Apples\Incoming\Rollback Evidence\THA-GATE8-RESTART-VERIFIER-CORRECTION-CODEX-20261021`, manifest SHA-256 `4A6F8B210AE7BA2BB1F56705A2FFB0D69095787CEFA175F44629C2E91BEB2052`; all 32 dirty-file copies independently re-verified against live bytes by the operator with zero mismatches immediately before this record.
**Governance-record rollback:** byte-exact `PROJECT_GOVERNANCE.md` pre-state copy captured by the operator immediately before this edit at `G:\The Healthy Apples\Incoming\Rollback Evidence\THA-GATE8-RESTART-VERIFIER-CORRECTION-CODEX-20261021\governance-prestate\PROJECT_GOVERNANCE.md.pre-operator-002`, SHA-256 `3A908FB9800475F6C7F4A1862C770547F271A5C13F99FCB71FF82F131459C44E`. The existing committed-history tag `rollback/tha-gate8-restart-verifier-governance-20261021` (target `bffc533d65f58ae30c1faf7d3026b50dcc17be89`) remains valid for the committed baseline beneath both this and the prior appointment's uncommitted governance text; this file remains uncommitted working-tree content, consistent with every other pre-existing dirty file in this repository.

**Circular-self-repair reason [Verified]:** the first role (`operator-001`) made its one authorized edit attempt and its own new `assertKeyPresenceOnly` assertion failed (`2 !== 1`, counting the formatter's `param(...)` declaration of `$ExplicitValues` as a second use alongside its one real `ContainsKey` use), terminating that appointment immediately with zero residual authority, as recorded above. Claude's independent root-cause review (`THA-GATE8-RESTART-VERIFIER-FAILED-DIFF-ROOT-CAUSE-AND-CORRECTED-LOGIC-CLAUDE-2026-10-21.md`) confirmed this by direct reproduction against live source and validated, in a disposable scratch script, that counting `$ExplicitValues` only in the function body (excluding the `param(...)` block) yields exactly 1 and leaves every other assertion in the failed diff passing. The exact one-file repair scope still has no registered Gate 8 verification family of its own, and the normal additive self-hosting family cannot register one while depending on this same currently-failing suite. Gate 9 remains the sole normal governed implementation execution authority; this is a bounded, single-use exception for a circular verifier self-repair, not new architecture or a second standing authority.

**Exact permission:** the operator may modify **only** `G:\The Healthy Apples\Infrastructure\tha-chatgpt-bridge\test-gate8-verification-scope.mjs`, and **only** the `assertKeyPresenceOnly` assertion-site correction below. No other line of the existing failed diff, and no other file, may change:

```diff
-    assert.equal([...formatter.matchAll(/\$ExplicitValues\b/g)].length, 1, 'restart summary must not use explicit values elsewhere');
+    const formatterBody = formatter.replace(/param\s*\(\s*[\s\S]*?\)\s*\n/, '');
+    assert.equal([...formatterBody.matchAll(/\$ExplicitValues\b/g)].length, 1, 'restart summary must not use explicit values elsewhere');
```

**Prohibited:** editing any other Bridge file, any other line of the prior failed diff, `gate8-repair-loop.mjs`, root or decision mechanisms, current/historical decisions, approvals, receipts, execution ledger, unrelated dirty state, governance documents beyond this owner-approved appointment/terminal record, application code, credentials/configuration, services, database, scheduled tasks; creating, approving, replaying, binding, or executing any Gate 9 decision; weakening or skipping verification; commit, push, deploy, migrate, reset, clean, stash, stage, branch switch, or cross-root write. The role cannot authorize itself or expand its own scope.

**Required verification matrix (sequential; any first failure immediately terminates this role):**

1. `node --check test-gate8-verification-scope.mjs` passes; the live diff against the fresh package's failed-diff pre-state contains only the exact assertion-site replacement above, no other line or file change.
2. `node test-gate8-verification-scope.mjs` passes in full, including the exact-call-count check, the real launcher output scan, all four unsafe-line negatives, the formatter-value-interpolation negative, the receipt-leakage negative, and every existing Gate 8 scope assertion.
3. `node test-gate8-repair-loop.mjs` passes.
4. `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\test-gate9-restart-only-lifecycle.ps1` and the equivalent invocation for `test-gate9-readonly-token-forwarding.ps1` both pass, with no real token value read or printed.
5. All four protected-dependency hashes and the other 31 unrelated dirty-file hashes remain byte-unchanged; Bridge HEAD/tag, root, branch, governance record, and decision/current-owner state remain as authorized; no service, database, scheduled task, credential/configuration, or application side effect occurs.

**Single-use automatic termination:** this role terminates immediately with `TERMINATED` status and zero residual authority on the first of: full matrix success, **any** verification failure, baseline or package drift, actual or attempted scope violation, or owner revocation. No retry or corrective edit is authorized under an expired role; a further attempt would require a new owner-reviewed appointment and fresh binding. Upon termination, all subsequent work returns to the normal Gate 8/Gate 9 process. This recorded appointment is the sole authorized governance-record change it permits; it does not allow the operator to amend governance again except to record its own terminal status and evidence.

**Terminated at:** `2026-10-21T15:05:00Z`

**Termination evidence — full matrix PASS, in order:**

1. `node --check test-gate8-verification-scope.mjs` passed. Diffed (line-ending normalised) against the exact pre-operator-002 package copy of the failed diff: the only content change is the authorized `assertKeyPresenceOnly` replacement — `const formatterBody = formatter.replace(/param\s*\(\s*[\s\S]*?\)\s*\n/, '');` plus counting on `formatterBody` instead of `formatter`. No other line or file changed. New file SHA-256: `6EC50FAE7D42EDAFF4C4DF0C81C03BF188484A75C5A7115E18B277E095D1E21F`.
2. `node test-gate8-verification-scope.mjs` → `Gate 8 scope-aware verification tests passed.` (exit 0). Includes the exact-call-count check, the full real launcher-output-line scan, all four unsafe-line negative cases, the formatter-value-interpolation negative case, the receipt-leakage negative case, and every pre-existing Gate 8 scope assertion — none skipped or suppressed.
3. `node test-gate8-repair-loop.mjs` → `Gate 8 bounded repair-loop tests passed.` (exit 0).
4. `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\test-gate9-restart-only-lifecycle.ps1` → `GATE9_RESTART_ONLY_LIFECYCLE_PASS` (exit 0); `...\test-gate9-readonly-token-forwarding.ps1` → `GATE9_READONLY_TOKEN_FORWARDING_PASS` (exit 0). Neither printed a real token value.
5. Bridge HEAD independently reconfirmed unchanged at `d34be625edf167d9c96926537e3643c6e962c3d8`. All four protected-dependency hashes and all 31 unrelated dirty-file hashes (every manifest entry except the one authorized target) independently reconfirmed byte-identical to the package and pre-edit state; zero mismatches. No decision, current-owner, approval, execution-ledger, service, database, scheduled-task, credential/configuration, or application-file change occurred; no Gate 9 action of any kind was taken.

All five matrix items passed in sequence with no skip and no suppressed failure. The appointment terminates here with zero residual authority. The Gate 8 restart-summary verifier is restored; the V2b/delegation-dispatch readiness blockers reported separately on 2026-10-21 (the `GOVERNED_ROOTS` substring-ambiguity defect and the orphaned `tha-dec-fdf1ff5c4bb383241ba247de51158c0c` decision) are unrelated and remain open.

### Temporary bridge governance-pipeline bootstrap appointment

**Status:** TERMINATED — verification matrix passed; zero residual authority.  
**Role ID:** `tha-bridge-governance-pipeline-bootstrap-operator-001`  
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`  
**Appointing owner:** Colin (`tha-governance-owner-001`)  
**Reason:** Gate 9 cannot execute the bridge-owned readiness and Hermes transport repairs required to restore its own governed execution pipeline; normal Gate 9 execution is circularly impossible.  
**Effective at:** `2026-08-27T20:41:11.3136165Z`  
**Rollback:** `rollback/tha-bridge-governance-bootstrap-20260827-204037`  
**Bridge pre-state package:** `C:\Users\Colin\AppData\Local\Temp\tha-bridge-governance-bootstrap-20260827-204037`

The role may implement only the following bridge/executor infrastructure repairs and their directly necessary focused regression tests/helpers:

- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\gate9-live-status-check.mjs`
- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\gate8-execute-approved-decision.mjs`
- directly necessary focused tests/helpers required to prove those two repairs and restore the existing Gate 8 → Gate 9 path

The role may not modify application/product code, Cookbook, Pantry, Planner, Hermes installation or architecture, FTP or ChatGPT artifact endpoints, unrelated bridge code, historical decisions/receipts/approvals/executions, or unrelated dirty files. It may not approve or execute decisions, bypass Gate 9, weaken Hermes verification, weaken approval, create another authority, commit, push, deploy, migrate, perform production/staging operations, or perform cross-root writes.

Required verification is: bridge-root executor resolution; application-root behavior unchanged; bounded Hermes transport with complete evidence; no oversized argv; preserved Hermes/session and multi-chunk behavior; fail-closed stale/tampered/missing/traversal/symlink/junction handling where applicable; existing Gate 8/Gate 9 approval, isolation, verification, rollback, and copy-back controls unchanged; focused and existing regressions pass; no unrelated dirty-state mutation; and durable repair evidence records the before/after state and rollback point.

The appointment terminates automatically with status `TERMINATED` immediately when this verification matrix passes. It then has zero residual authority. Gate 9 remains the sole normal governed implementation execution authority, and all subsequent work returns to normal Gate 9 decision, approval, evidence, current-owner, and execution controls.

### Temporary reconciliation-verifier bootstrap appointment

**Status:** TERMINATED — verification matrix passed; zero residual authority.
**Role ID:** `tha-reconciliation-verifier-bootstrap-operator-001`
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`
**Appointing owner:** Colin (`tha-governance-owner-001`)
**Reason:** The canonical reconciliation mechanism (`complete-reconciliation-decision.mjs`) requires a deterministic verifier bound to the exact scope of decision `tha-dec-28c9ce94e07e5e331f3501fabb72ce31` (`server.gate5.mjs`, `start-tha-services.ps1`, `.env.example`, `test-gate5-reboot-persistence.mjs`), but no such verifier exists and the file that would need to register one (`complete-reconciliation-decision.mjs`) is itself a dirty-pre-state baseline file frozen by that same decision's Gate 63 evidence receipt — as is the missing test file's would-be sibling scope. Modifying either to add the missing capability necessarily invalidates that decision's repository-status-fingerprint binding, so normal Gate 9 execution cannot perform this repair without first breaking the very decision the repair exists to let be reconciled; normal Gate 9 execution is therefore circularly impossible for this narrow capability gap.
**Effective at:** `2026-08-29T23:28:09Z`
**Rollback:** `rollback/rollback-reconciliation-verifier-bootstrap-20260829-232809`
**Bridge pre-state package:** `C:\Users\Colin\AppData\Local\Temp\tha-rollback-reconciliation-verifier-bootstrap-20260829-232809`

The role may implement only:

- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\test-gate5-reboot-persistence.mjs` (new file — the deterministic verifier itself)
- the minimum additive `verifierForScope()` registration in `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\complete-reconciliation-decision.mjs` binding the persistence decision's exact scope to that new test

The role may not execute `tha-dec-28c9ce94e07e5e331f3501fabb72ce31`, modify its Gate 7 artifact or Gate 63 receipt, alter any historical decision/receipt/approval/execution, perform reconciliation, transition `gate9-current-decision.json`, modify Gate 9 execution admission or the atomicity gap identified alongside this appointment, touch persistence implementation beyond authoring the required test, change Action/OpenAPI files, touch Admin integration, modify application-repository files, widen `verifierForScope()` into a general framework, alter either existing registered scope signature, commit, push, deploy, or perform cross-root writes. It may not repair any genuine persistence defect the new test exposes — such a defect must be reported and separately governed, not fixed under this appointment.

Required verification is: the new test exists and is syntactically valid; it is derived from the decision's own recorded `verificationGates` and passes against every assertion the current implementation actually satisfies; both existing `verifierForScope()` signatures remain byte-identical and their bound tests (`test-gate8-worker-routing.mjs`, `test-approval-transition.mjs`, `test-gate8-repair-loop.mjs`, `test-gate9-lifecycle.mjs`) still pass unmodified; the new signature resolves to exactly the new test for the decision's exact scope array; no execution, reconciliation, or current-decision transition occurred; no file outside the two authorised paths was modified (git status confirmed unchanged apart from the two new/edited paths); and durable rollback/pre-state evidence was captured before any edit.

**Verification result:** the authored test found 12 of 13 assertions passing and one genuine, pre-existing defect: `.env.example` still documents `THA_REPO=...\tha-cookbook-real-book-functional` rather than the canonical `...\tha-integrated-dev`, contradicting the decision's own `scopeFileInstructions` for that file. Per this appointment's explicit prohibition, that defect was not fixed here; it is reported for separate governance. This appointment's own edits are confirmed additive-only (one new file; one new line in `complete-reconciliation-decision.mjs`) and, as an accepted and anticipated consequence stated in the Reason above, they change the bridge repository's working-tree status fingerprint away from the value `tha-dec-28c9ce94e07e5e331f3501fabb72ce31` is bound to — that decision's binding is therefore now invalid pending its own separately governed reconciliation, which this appointment does not perform.

The appointment terminates automatically with status `TERMINATED` immediately when this verification matrix passes. It then has zero residual authority. Gate 9 remains the sole normal governed implementation execution authority, and all subsequent work — reconciliation, atomicity repair, a fresh persistence decision — returns to normal Gate 9 decision, approval, evidence, current-owner, and execution controls.

### Temporary Gate 8 openapi.live.yaml verification-family bootstrap appointment

**Status:** TERMINATED — verification matrix passed; zero residual authority.
**Role ID:** `tha-gate8-openapi-verify-bootstrap-operator-001`
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`
**Appointing owner:** Colin (`tha-governance-owner-001`)
**Reason:** Gate 8's exact-match verification-family registry lives inside `gate8-repair-loop.mjs` itself. The GREEN decision `tha-dec-77d20a8a1db7338f17d144775b3a2969` ("ChatGPT Action long-poll and rejection-clarity documentation," scope `['openapi.live.yaml']`) cannot execute through Gate 9/Gate 8 because no exact verification family exists for that scope, and none has ever persisted for the two structurally identical prior repairs to this same file tonight (`admin-banner-visual`, `transition-current-decision-owner`), both of which required the same bootstrap treatment. Registering the missing family requires editing `gate8-repair-loop.mjs`, but Gate 8 can only execute a decision whose scope resolves to exactly one registered family — so normal Gate 9 execution is circularly impossible for this narrow capability gap.
**Effective at:** `2026-08-30T20:28:33Z`
**Rollback:** `rollback/rollback-gate8-openapi-verify-bootstrap-20260830-202833`
**Bridge pre-state package:** `C:\Users\Colin\AppData\Local\Temp\tha-rollback-gate8-openapi-verify-bootstrap-20260830-202833`

The role may implement only:

- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\gate8-repair-loop.mjs` — add exactly one new frozen exact-match scope (`['openapi.live.yaml']`) and its wiring (one `*Only` predicate, one `matchCount` entry, one `kind` branch, one gate-language check, one `verificationCommands` entry); no change to any existing family or to the `matchCount !== 1` fail-closed check.
- One new deterministic verification script, `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\test-verify-openapi-live-yaml-documentation-only.mjs` (new file), proving: `openapi.live.yaml` parses under a restricted structural dialect (fails closed on tabs or unrecognised constructs); every non-`description` structural line is byte-identical to the file's own git `HEAD` baseline; the known OpenAPI anchors (`openapi: 3.1.0`, the four `operationId` values, `paths:`, `components:`) remain present.
- One disposable proof harness (`_test-openapi-live-yaml-verification-family.mjs`), following this session's established convention (as used for the admin-banner-visual and transition-current-decision-owner family additions) of proving the new family in isolation without editing the checked-in `test-gate8-repair-loop.mjs` / `test-gate8-verification-scope.mjs` suites.

Prohibited: modifying `openapi.live.yaml` itself; approving or executing `tha-dec-77d20a8a1db7338f17d144775b3a2969`; changing any other Gate 8 family; changing Gate 5 or Gate 9 semantics; weakening exact-match or fail-closed behaviour; adding wildcard/generic verification; changing authentication, allowlists, repository access, execution policy, or application code; commit, push, deploy, or migration.

Required verification is: every pre-existing registered family still resolves to exactly one match; `['openapi.live.yaml']` resolves to exactly one match; a mixed scope (that file plus any other) and an empty scope both remain rejected; the new verifier script passes against the real, currently-unchanged `openapi.live.yaml` (a true-negative/no-op-diff sanity check) and correctly fails against at least one deliberately structural-change fixture; existing Gate 8 regression suites (`test-gate8-repair-loop.mjs`, `test-gate8-verification-scope.mjs`) pass unmodified; no application-repository file is touched; and git status confirms only the explicitly authorised bootstrap files changed.

**Verification result:** `openapi.live.yaml` is untracked (never committed), so the new verifier's baseline comes from this decision's own Gate 63 receipt (`receipt.dirtyPreState.baselineFiles`) rather than `git show HEAD:...` — an implementation detail within the authorised scope, not a deviation from it. All 16 checks in the isolated proof harness (`_test-openapi-live-yaml-verification-family.mjs`) passed: the new family resolves `['openapi.live.yaml']` to exactly one match and requests neither typecheck/build/node_modules; missing openapi/documentation gate language, a mixed scope, and an empty scope are all still rejected; the pre-existing `admin-banner-visual` and `transition-current-decision-owner` families are unaffected; the new verifier passes a real no-op diff, passes a genuine `description`-body-only edit, correctly rejects a change to a non-`description` field (`summary`) as out of the whitelist, and correctly fails a structural change (the `wait` parameter's own `maximum` bound). Both pre-existing regression suites (`test-gate8-repair-loop.mjs`, `test-gate8-verification-scope.mjs`) pass unmodified. `openapi.live.yaml` itself and `gate9-current-decision.json` are confirmed byte-identical (sha256-verified) to their state before this appointment began; a diff of `git status` before/after shows exactly two new untracked files (the verifier and its disposable proof harness) and no other change. `tha-dec-77d20a8a1db7338f17d144775b3a2969` remains unapproved and unexecuted.

The appointment terminates automatically with status `TERMINATED` immediately when this verification matrix passes. It then has zero residual authority. Gate 9 remains the sole normal governed implementation execution authority, and all subsequent work — including any decision to approve or execute `tha-dec-77d20a8a1db7338f17d144775b3a2969` itself — returns to normal Gate 9 decision, approval, evidence, current-owner, and execution controls.

### Temporary Gate 8 markdown-handoff-write verification-family bootstrap appointment

**Status:** TERMINATED — verification matrix passed; zero residual authority.
**Role ID:** `tha-gate8-markdown-handoff-write-verify-bootstrap-operator-001`
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`
**Appointing owner:** Colin (`tha-governance-owner-001`)
**Reason:** Gate 8's exact-match verification-family registry lives inside `gate8-repair-loop.mjs` itself. The write-side Markdown handoff projection scope — two new `tha-integrated-dev` application-repository files, `.engineering/scripts/project-markdown-handoff.mjs` and `.engineering/scripts/test-project-markdown-handoff.mjs` — cannot execute through Gate 9/Gate 8 because no exact verification family exists for that scope, and Gate 8 can only execute a decision whose scope resolves to exactly one registered family. Registering the missing family requires editing `gate8-repair-loop.mjs`, so normal Gate 9 execution is circularly impossible for this narrow capability gap — the same shape already resolved once for `tha-gate8-openapi-verify-bootstrap-operator-001` above.
**Effective at:** `2026-09-01T06:53:54Z`
**Rollback:** `gate8-repair-loop.mjs` was untracked in the bridge repository at the time of this appointment (no commit, no index entry — `git ls-files` returns nothing for it, `git log` shows no history), so no git tag can capture its pre-edit content. Its pre-state is instead a byte-exact reconstruction: the eight edits applied under this appointment were recorded verbatim and reverse-applied to the post-edit file, then round-trip-verified (forward-applying all eight recorded edits to the reconstruction reproduces the post-edit file byte-for-byte). **Process note, disclosed rather than omitted:** this pre-state package was captured immediately *after* the edits were made and verified retroactively, not before — the edits were applied first on the (incorrect, since corrected) assumption that the file was index-tracked and therefore git-recoverable. The round-trip verification closes that gap with equivalent evidentiary strength to a prior snapshot, but the sequencing itself is recorded here for an honest record rather than presented as if capture preceded edit.
**Bridge pre-state package:** `C:\Users\Colin\AppData\Local\Temp\tha-markdown-handoff-write-bootstrap-prestate\gate8-repair-loop.mjs.pre-bootstrap` (reconstructed original) and `...\gate8-repair-loop.mjs.post-bootstrap` (state immediately after this appointment's edits, for comparison)

The role may implement only:

- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\gate8-repair-loop.mjs` — add exactly one new frozen exact-match scope, `MARKDOWN_HANDOFF_WRITE_SCOPE = ['.engineering/scripts/project-markdown-handoff.mjs', '.engineering/scripts/test-project-markdown-handoff.mjs']`, and its wiring (one new `*Set`/`*Only` predicate pair, one `matchCount` entry, one `kind` branch, one gate-language check, one `verificationCommands` entry) — plus the one additive exclusion this required in the pre-existing `requestsHermesArtifactHandoff` gate-sniffing guard (`!markdownHandoffWriteOnly &&`, mirroring the guard's existing `!markdownHandoffReadOnly &&` exclusion for its sibling read family), needed because the new family's own required gate language (`markdown`/`handoff`) would otherwise be intercepted by that unrelated, pre-existing guard. No other existing family's matching logic, scope, or `kind` was changed.
- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\_test-markdown-handoff-write-verification-family.mjs` (new file) — a disposable proof harness, following this session's established convention (as used for `admin-banner-visual`, `transition-current-decision-owner`, and `openapi-live-yaml-documentation`) of proving the new family in isolation without editing the checked-in `test-gate8-repair-loop.mjs` / `test-gate8-verification-scope.mjs` suites.

Prohibited: modifying `.engineering/scripts/project-markdown-handoff.mjs` or `.engineering/scripts/test-project-markdown-handoff.mjs` themselves (their content is governed separately, by the tracked-scope stub already staged in `tha-integrated-dev` pending its own decision); approving or executing any decision against the new scope; changing any other Gate 8 family's scope or matching; changing Gate 5 or Gate 9 semantics; weakening exact-match or fail-closed behaviour; adding wildcard/generic verification; changing authentication, allowlists, repository access, or execution policy; commit, push, deploy, or migration.

Required verification is: every pre-existing registered family still resolves to exactly one match, spot-checked for `markdown-handoff-read`, `admin-banner-visual`, `openapi-live-yaml-documentation`, and `transition-current-decision-owner`; the new `MARKDOWN_HANDOFF_WRITE_SCOPE` resolves to exactly one match regardless of array order, requests no typecheck/build/`node_modules`, and wires its verification command to the correct application-repo-relative test path; a mixed scope (one write-scope file plus one unrelated file), an incomplete scope (one of the two required files), an empty scope, and a combined write-scope-plus-read-scope union are all rejected as `missing, mixed, or ambiguous`; missing markdown/handoff gate language is rejected; the checked-in `test-gate8-repair-loop.mjs` and `test-gate8-verification-scope.mjs` suites pass unmodified; no application-repository file is touched; and `git status` in the bridge repository confirms only the two authorised bootstrap files appear as new/modified, with all pre-existing dirty state (773 unrelated status lines at the time of this appointment) unchanged.

**Verification result:** `node --check gate8-repair-loop.mjs` passes. The disposable proof harness (`_test-markdown-handoff-write-verification-family.mjs`) reports 13/13 checks passed: the new family resolves the exact two-file scope (in either order) to exactly one match, wires `markdown-handoff-write-regression` → `.engineering/scripts/test-project-markdown-handoff.mjs`, and requests neither typecheck, build, nor `node_modules`; missing gate language, a mixed scope, an incomplete (one-file) scope, an empty scope, and a combined write+read scope are all correctly rejected; the pre-existing `markdown-handoff-read`, `admin-banner-visual`, `openapi-live-yaml-documentation`, and `transition-current-decision-owner` families are all confirmed unaffected. Both pre-existing regression suites (`test-gate8-repair-loop.mjs`, `test-gate8-verification-scope.mjs`) pass unmodified (`Gate 8 bounded repair-loop tests passed.` / `Gate 8 scope-aware verification tests passed.`). `git status` in the bridge repository shows exactly the two authorised files as new/modified beyond the pre-existing dirty state, confirmed by direct enumeration. No `tha-integrated-dev` file was touched by this appointment. No decision was approved or executed.

The appointment terminates automatically with status `TERMINATED` immediately when this verification matrix passes. It then has zero residual authority. Gate 9 remains the sole governed implementation execution authority, and all subsequent work — including creating and approving the markdown-handoff-write application decision itself — returns to normal Gate 9 decision, approval, evidence, current-owner, and execution controls.

### Temporary Gate 8 planner-page verification-family bootstrap appointment

**Status:** TERMINATED — verification matrix passed; zero residual authority.
**Role ID:** `tha-gate8-planner-page-verify-bootstrap-operator-001`
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`
**Appointing owner:** Colin (`tha-governance-owner-001`)
**Reason:** Gate 8's exact-match verification-family registry lives inside `gate8-repair-loop.mjs` itself. A bounded, presentation-only Planner decision whose exact scope is `['client/src/pages/weekly-planner-page.tsx']` cannot execute through Gate 9/Gate 8 because no exact verification family exists for that single-file scope — the only registered Planner family, `PLANNER_PHYSICAL_PRESENTATION_SCOPE`, requires exactly three files (the page, `planner-physical.css`, and the accepted target PNG) and correctly rejects any subset. Registering the missing single-file family requires editing `gate8-repair-loop.mjs`, but Gate 8 can only execute a decision whose scope resolves to exactly one registered family — so normal Gate 9 execution is circularly impossible for this narrow capability gap, the same shape already resolved for `tha-gate8-openapi-verify-bootstrap-operator-001` and `tha-gate8-markdown-handoff-write-verify-bootstrap-operator-001`.
**Effective at:** `2026-09-19T14:22:06Z`
**Rollback:** `rollback/gate8-planner-page-verify-bootstrap-20260919-142206` (annotated tag on bridge-repo HEAD `ad400c3e6498b45660f7369a019e11dac5373f12`, created before any edit; protects committed state only)
**Bridge pre-state package:** `C:\Users\Colin\AppData\Local\Temp\tha-gate8-planner-page-verify-bootstrap-20260919-142206\gate8-repair-loop.mjs.pre-bootstrap` (byte-exact copy of the file's already-dirty pre-edit content, sha256 `4c36571707f82916fccc191367b817c4e4966e3df438360815fbbb788f5d56fe`, captured before modification, since the rollback tag alone cannot recover uncommitted working-tree content)

The role may implement only:

- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\gate8-repair-loop.mjs` — add exactly one new frozen exact-match scope, `PLANNER_PAGE_PRESENTATION_SCOPE = ['client/src/pages/weekly-planner-page.tsx']` (single entry), and its wiring in `deriveVerificationGatesForScope` and `buildVerificationPlan` (one `*Only` predicate, one `matchCount`/`kind` branch, one gate-language check, requesting `runTypecheck: true, runBuild: true` via the same mechanism already used by `planner-physical-presentation`, no new verification command). No change to `PLANNER_PHYSICAL_PRESENTATION_SCOPE`, any other existing family, or the `matchCount !== 1` fail-closed check.
- One new disposable proof harness, `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\_test-planner-page-verification-family.mjs` (new file), proving the new family in isolation without editing the checked-in `test-gate8-repair-loop.mjs` / `test-gate8-verification-scope.mjs` suites.

Prohibited: modifying `client/src/pages/weekly-planner-page.tsx` or any other application file; modifying `decision-factory.mjs` or `gate9-decision-create.mjs`; approving or executing any decision against the new scope; changing `PLANNER_PHYSICAL_PRESENTATION_SCOPE` or any other Gate 8 family; changing Gate 5 or Gate 9 semantics; weakening exact-match or fail-closed behaviour; introducing subset/superset or wildcard matching; changing OpenAPI, authentication, allowlists, repository access, or execution policy; modifying the Activity Monitor; resetting, stashing, cleaning, reverting, or staging any pre-existing dirty file in either repository; commit, push, deploy, or migration.

Required verification is: every pre-existing registered family still resolves to exactly one match, spot-checked including `planner-physical-presentation`; `['client/src/pages/weekly-planner-page.tsx']` resolves to exactly one match and requests `runTypecheck`/`runBuild` and no `verificationCommands`; an empty scope, the full 3-file `PLANNER_PHYSICAL_PRESENTATION_SCOPE` superset, `planner-physical.css` alone, the target PNG alone, and any unrelated/sibling frontend page are all rejected by the new family; `node --check gate8-repair-loop.mjs` passes; `test-gate8-repair-loop.mjs` and `test-gate8-verification-scope.mjs` pass unmodified; `git status` in the bridge repository shows only the two authorised bootstrap files as new/changed beyond the pre-existing dirty baseline; no `tha-integrated-dev` file is touched; no decision is approved or executed.

**Verification result:** `node --check gate8-repair-loop.mjs` passes. The disposable proof harness (`_test-planner-page-verification-family.mjs`) reports 9/9 checks passed: `['client/src/pages/weekly-planner-page.tsx']` resolves to exactly one match (`planner-page-presentation`) requesting `runTypecheck`/`runBuild`/`requiresNodeModules` and no `verificationCommands`/test files; an empty scope, that path plus `planner-physical.css`, that path plus the accepted target PNG, and an unrelated frontend page (`contact-page.tsx`) are all correctly rejected by the new family; the pre-existing three-file `PLANNER_PHYSICAL_PRESENTATION_SCOPE` still resolves correctly to its own unchanged family and still rejects the one-file subset that is now the new family's own exact scope; gate-text mismatch fails closed; reversed-order input still matches (pre-existing order-independence, not new subset/superset behaviour). Both checked-in regression suites pass unmodified (`Gate 8 bounded repair-loop tests passed.` / `Gate 8 scope-aware verification tests passed.`). `git diff --check` reports no whitespace/conflict errors. A CRLF-normalized diff against the byte-exact pre-bootstrap snapshot shows exactly 7 hunks, all additive, matching precisely the authorised wiring (one scope/gates constant pair, one `deriveVerificationGatesForScope` branch, one `*Set`/`*Only` predicate pair, one `matchCount` entry, one `kind` branch, one gate-language check, one `requiresNodeModules`/`runTypecheck`/`runBuild` wiring addition) — no other family, including `PLANNER_PHYSICAL_PRESENTATION_SCOPE`, was altered. `git status` in the bridge repository shows the same 34 pre-existing tracked-modified files as the pre-appointment baseline (`gate8-repair-loop.mjs` already among them) plus exactly one new untracked file, `_test-planner-page-verification-family.mjs`; total status line count moved from 1260 to 1261, i.e. +1. No `tha-integrated-dev` file other than this governance record was touched. No decision was created, approved, or executed.

The appointment terminates automatically with status `TERMINATED` immediately when this verification matrix passes. It then has zero residual authority. Gate 9 remains the sole normal governed implementation execution authority, and all subsequent work — including creating and approving the Planner single-file decision itself — returns to normal Gate 9 decision, approval, evidence, current-owner, and execution controls.

### Temporary Gate 9 pantry-sync household-resolution verification-family bootstrap appointment

**Status:** TERMINATED — verification matrix passed; zero residual authority.
**Role ID:** `tha-gate9-pantry-sync-verify-bootstrap-operator-001`
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`
**Appointing owner:** Colin (`tha-governance-owner-001`)
**Reason:** Gate 9's exact-match verification-family registry lives inside `gate8-repair-loop.mjs` itself. A prepared, bounded AMBER repair to `tha-integrated-dev`'s Pantry startup-sync household-resolution defect (`syncAllPantryDefaults()` discarding its already-known owner-membership `household_id` and re-deriving a possibly-different household via `getHouseholdForUser(userId)` inside `seedDefaultFoodPantryItems`/`seedDefaultHouseholdItems`) cannot execute through Gate 9/Gate 8 because no exact verification family exists for its scope (`server/storage.ts` + a new dedicated regression test), and Gate 8 can only execute a decision whose scope resolves to exactly one registered family — so normal Gate 9 execution is circularly impossible for this narrow capability gap, the same shape already resolved repeatedly this session for `tha-gate8-openapi-verify-bootstrap-operator-001`, `tha-gate8-markdown-handoff-write-verify-bootstrap-operator-001`, and `tha-gate8-planner-page-verify-bootstrap-operator-001`. This appointment creates verification-governance support only — it does not implement the Pantry fix, run `syncAllPantryDefaults()`, write application data, or touch the separately-tracked soft-delete/reinsert issue.
**Effective at:** `2026-09-20T07:50:16Z`
**Rollback:** `rollback/gate9-pantry-sync-verify-bootstrap-20260920-075016` (annotated tag on bridge-repo HEAD `ad400c3e6498b45660f7369a019e11dac5373f12`, created before any edit; protects committed state only)
**Bridge pre-state package:** `C:\Users\Colin\AppData\Local\Temp\tha-gate9-pantry-sync-verify-bootstrap-20260920-075016\gate8-repair-loop.mjs.pre-bootstrap` (byte-exact copy of the file's already-dirty pre-edit content, sha256 `2ecee61206e817306fad0e2bbe0b8439765a583f13f7cc6f8e3cd2a2e0f1f9f2`, captured before modification, since the rollback tag alone cannot recover uncommitted working-tree content)

The role may implement only:

- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\gate8-repair-loop.mjs` — add exactly one new frozen exact-match scope, `PANTRY_SYNC_HOUSEHOLD_RESOLUTION_SCOPE = ['server/storage.ts', 'server/tests/test-pantry-sync-household-resolution.ts']` (repository `tha-integrated-dev`), and its wiring in `deriveVerificationGatesForScope` and `buildVerificationPlan` (one `*Only` predicate, one `matchCount` entry, one `kind` branch, one gate-language check, requesting `runTypecheck: true, runBuild: false, tsxTestFiles: ['server/tests/test-pantry-sync-household-resolution.ts']` via the same mechanism already used by `contact-subject-counter`, no new verification command). No change to any existing family.
- One new disposable proof harness, `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\_test-pantry-sync-verify-family.mjs` (new file), proving the new family in isolation without editing the checked-in `test-gate8-repair-loop.mjs` / `test-gate8-verification-scope.mjs` suites.

Prohibited: modifying `server/storage.ts`, `server/auth.ts`, `server/routes.ts`, `shared/schema.ts`, any migration file, or any other application file; creating the new test file's actual content; running `syncAllPantryDefaults()` or writing any application/database data; approving or executing any decision against the new scope; changing any other Gate 8 family; changing Gate 5 or Gate 9 semantics; weakening exact-match or fail-closed behaviour; introducing subset/superset or wildcard matching; authorising `routes.ts`, `auth.ts`, schema, migration, or runtime/launcher files into this family; changing OpenAPI, authentication, allowlists, repository access, or execution policy; modifying the Activity Monitor or Planner; resuming the runtime-move investigation; resetting, stashing, cleaning, reverting, or staging any pre-existing dirty file in either repository; commit, push, deploy, or migration.

Required verification is: every pre-existing registered family still resolves to exactly one match, spot-checked including `contact-subject-counter`; `['server/storage.ts', 'server/tests/test-pantry-sync-household-resolution.ts']` (repository `tha-integrated-dev`) resolves to exactly one match and requests `runTypecheck`/`tsxTestFiles` and no `runBuild`/`verificationCommands`; an empty scope, `server/storage.ts` alone, the test file alone, and any unrelated/sibling application file are all rejected by the new family; `node --check gate8-repair-loop.mjs` passes; `test-gate8-repair-loop.mjs` and `test-gate8-verification-scope.mjs` pass unmodified; `git status` in the bridge repository shows only the two authorised bootstrap files as new/changed beyond the pre-existing dirty baseline; no `tha-integrated-dev` file is touched; no decision is approved or executed; no database write occurs.

**Verification result:** `node --check gate8-repair-loop.mjs` passes. The disposable proof harness (`_test-pantry-sync-verify-family.mjs`) reports 10/10 checks passed: `['server/storage.ts', 'server/tests/test-pantry-sync-household-resolution.ts']` resolves to exactly one match (`pantry-sync-household-resolution`) requesting `runTypecheck`/`requiresNodeModules`/`tsxTestFiles: ['server/tests/test-pantry-sync-household-resolution.ts']` and no `runBuild`/`verificationCommands`; an empty scope, `server/storage.ts` alone, the test file alone, an unrelated application file (`server/routes.ts`, `server/auth.ts`, `shared/schema.ts`), and the exact scope plus an extra unrelated file are all correctly rejected by the new family; the pre-existing `contact-subject-counter` family is confirmed unaffected; gate-text mismatch fails closed; reversed-order input still matches (pre-existing order-independence, not new subset/superset behaviour). Both checked-in regression suites pass unmodified (`Gate 8 bounded repair-loop tests passed.` / `Gate 8 scope-aware verification tests passed.`). `git status` in the bridge repository shows the same 34 pre-existing tracked-modified files as the pre-appointment baseline (`gate8-repair-loop.mjs` already among them) plus exactly one new untracked file, `_test-pantry-sync-verify-family.mjs`; total status line count moved from 1268 to 1269. A CRLF-normalized diff against the byte-exact pre-bootstrap snapshot shows exactly 8 hunks, all additive, matching precisely the authorised wiring. No `tha-integrated-dev` file (including `server/storage.ts`) was touched. No decision was created, approved, or executed. No database write occurred.

The appointment terminates automatically with status `TERMINATED` immediately when this verification matrix passes. It then has zero residual authority. Gate 9 remains the sole normal governed implementation execution authority, and all subsequent work — including creating and approving the Pantry household-resolution repair decision itself — returns to normal Gate 9 decision, approval, evidence, current-owner, and execution controls.

### Temporary Gate 9 typecheck-gate Windows-portability verification-family bootstrap appointment

**Status:** TERMINATED — verification matrix passed; zero residual authority.
**Role ID:** `tha-gate9-typecheck-gate-verify-bootstrap-operator-001`
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`
**Appointing owner:** Colin (`tha-governance-owner-001`)
**Reason:** Gate 9's exact-match verification-family registry lives inside `gate8-repair-loop.mjs` itself. A prepared, bounded AMBER portability fix to `tha-integrated-dev`'s `scripts/ci/typecheck-gate.ts` (replacing its Windows-broken `execFileSync("npx", ["tsc", "--noEmit"], ...)` with a direct, shell-free `execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "--noEmit"], ...)` invocation, already proven read-only to reach the existing baseline comparison unmodified) cannot execute through Gate 9/Gate 8 because no exact verification family exists for its scope, and Gate 8 can only execute a decision whose scope resolves to exactly one registered family — so normal Gate 9 execution is circularly impossible for this narrow capability gap, the same shape resolved repeatedly this session for the Hermes, Planner-page, and Pantry household-resolution bootstraps. This appointment creates verification-governance support only — it does not implement the fix, does not edit `typecheck-baseline.json`, does not address the 16 pre-existing unrelated baseline regressions, and does not touch Pantry.
**Effective at:** `2026-09-20T09:22:04Z`
**Rollback:** `rollback/gate9-typecheck-gate-verify-bootstrap-20260920-092204` (annotated tag on bridge-repo HEAD `ad400c3e6498b45660f7369a019e11dac5373f12`, created before any edit; protects committed state only)
**Bridge pre-state package:** `C:\Users\Colin\AppData\Local\Temp\tha-gate9-typecheck-gate-verify-bootstrap-20260920-092204\gate8-repair-loop.mjs.pre-bootstrap` (byte-exact copy of the file's already-dirty pre-edit content, sha256 `36b987e63cd67019ef2530aae023ff7ebba046db6acdfdcfdb17d7f033e23218`, captured before modification, since the rollback tag alone cannot recover uncommitted working-tree content)

The role may implement only:

- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\gate8-repair-loop.mjs` — add exactly one new frozen exact-match scope, `TYPECHECK_GATE_WINDOWS_FIX_SCOPE = ['scripts/ci/typecheck-gate.ts', 'scripts/ci/test-typecheck-gate-windows-fix.ts']` (repository `tha-integrated-dev`), and its wiring in `deriveVerificationGatesForScope` and `buildVerificationPlan` (one `*Only` predicate, one `matchCount` entry, one `kind` branch, one gate-language check, requesting `runTypecheck: false, runBuild: false, tsxTestFiles: ['scripts/ci/test-typecheck-gate-windows-fix.ts']`, no new verification command, no `runTypecheck` since the change is to the typecheck tooling itself and the future dedicated test already exercises `tsc --noEmit` end-to-end). No change to any existing family.
- One new disposable proof harness, `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\_test-typecheck-gate-verify-family.mjs` (new file), proving the new family in isolation without editing the checked-in `test-gate8-repair-loop.mjs` / `test-gate8-verification-scope.mjs` suites.

Prohibited: modifying `scripts/ci/typecheck-gate.ts`, `scripts/ci/typecheck-baseline.json`, or any other application file; creating the new test file's actual content; fixing the 16 pre-existing unrelated baseline regressions; touching Pantry or its verification family; running `syncAllPantryDefaults()` or writing any application/database data; approving or executing any decision against the new scope; changing any other Gate 8 family; changing Gate 5 or Gate 9 semantics; weakening exact-match or fail-closed behaviour; introducing subset/superset or wildcard matching; changing OpenAPI, authentication, allowlists, repository access, or execution policy; modifying the Activity Monitor or Planner; resuming the runtime-move investigation; resetting, stashing, cleaning, reverting, or staging any pre-existing dirty file in either repository; commit, push, deploy, or migration.

Required verification is: every pre-existing registered family still resolves to exactly one match, spot-checked including `pantry-sync-household-resolution`; `['scripts/ci/typecheck-gate.ts', 'scripts/ci/test-typecheck-gate-windows-fix.ts']` (repository `tha-integrated-dev`) resolves to exactly one match and requests `tsxTestFiles` and no `runTypecheck`/`runBuild`/`verificationCommands`; an empty scope, either file alone, and any unrelated/sibling application file are all rejected by the new family; `node --check gate8-repair-loop.mjs` passes; `test-gate8-repair-loop.mjs` and `test-gate8-verification-scope.mjs` pass unmodified; `git status` in the bridge repository shows only the two authorised bootstrap files as new/changed beyond the pre-existing dirty baseline; no `tha-integrated-dev` file is touched; no decision is approved or executed; no database write occurs.

**Verification result:** `node --check gate8-repair-loop.mjs` passes. The disposable proof harness (`_test-typecheck-gate-verify-family.mjs`) reports 10/10 checks passed: `['scripts/ci/typecheck-gate.ts', 'scripts/ci/test-typecheck-gate-windows-fix.ts']` resolves to exactly one match (`typecheck-gate-windows-fix`) requesting `requiresNodeModules`/`tsxTestFiles: ['scripts/ci/test-typecheck-gate-windows-fix.ts']` and explicitly no `runTypecheck`/`runBuild`/`verificationCommands`; an empty scope, either target file alone, unrelated files (including `scripts/ci/typecheck-baseline.json`, `server/storage.ts`, `package.json`), and the exact scope plus an extra unrelated file are all correctly rejected by the new family; the pre-existing `pantry-sync-household-resolution` family is confirmed unaffected; gate-text mismatch fails closed; reversed-order input still matches (pre-existing order-independence, not new subset/superset behaviour). Both checked-in regression suites pass unmodified (`Gate 8 bounded repair-loop tests passed.` / `Gate 8 scope-aware verification tests passed.`). `git status` in the bridge repository shows the same 34 pre-existing tracked-modified files as the pre-appointment baseline (`gate8-repair-loop.mjs` already among them) plus exactly one new untracked file, `_test-typecheck-gate-verify-family.mjs`. A CRLF-normalized diff against the byte-exact pre-bootstrap snapshot shows exactly 8 hunks, all additive, matching precisely the authorised wiring. No `tha-integrated-dev` file (including `scripts/ci/typecheck-gate.ts` or `typecheck-baseline.json`) was touched. No decision was created, approved, or executed. No database write occurred.

The appointment terminates automatically with status `TERMINATED` immediately when this verification matrix passes. It then has zero residual authority. Gate 9 remains the sole normal governed implementation execution authority, and all subsequent work — including creating and approving the typecheck-gate portability repair decision itself — returns to normal Gate 9 decision, approval, evidence, current-owner, and execution controls.

### Temporary Gate 5 prospective-untracked evidence-capture verification-family bootstrap appointment

**Status:** TERMINATED — verification matrix passed; zero residual authority.
**Role ID:** `tha-gate5-prospective-untracked-evidence-capture-verify-bootstrap-operator-001`
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`
**Appointing owner:** Colin (`tha-governance-owner-001`)
**Reason:** Gate 9's exact-match verification-family registry lives inside `gate8-repair-loop.mjs` itself. A planned bounded Gate5 capability — capturing evidence (normalized path, byte length, SHA-256, bounded content) from exactly one governed-repository-relative untracked regular file, confined to the governed root, rejecting directories/symlinks/reparse points/traversal, never broadening `startThaInvestigation`'s existing tracked-only semantics — spans `server.gate5.mjs`, `test-gate5-investigation-path-handling.mjs`, `openapi.live.yaml`, and `test-verify-openapi-live-yaml-documentation-only.mjs`, none of which has an existing exact verification family together, so normal Gate 9 execution is circularly impossible for this six-file scope (the four capability files plus `gate8-repair-loop.mjs` and `test-gate8-verification-scope.mjs`, required to register and permanently test the exact family itself) — the same shape resolved repeatedly this session for the Hermes, Planner-page, Pantry household-resolution, and typecheck-gate bootstraps. This appointment creates verification-governance support only — it does not implement the evidence-capture capability, does not touch Pantry, does not modify `server/storage.ts` or `scripts/ci/typecheck-gate.ts`, and does not reopen the completed typecheck-gate repair.
**Effective at:** `2026-09-20T21:36:35Z`
**Rollback:** `rollback/gate5-prospective-untracked-evidence-capture-bootstrap-20260920-213635` (annotated tag on bridge-repo HEAD `ad400c3e6498b45660f7369a019e11dac5373f12`, created before any edit; protects committed state only)
**Bridge pre-state package:** `C:\Users\Colin\AppData\Local\Temp\tha-gate5-prospective-untracked-evidence-capture-bootstrap-20260920-213635\gate8-repair-loop.mjs.pre-bootstrap` (byte-exact copy of the file's already-dirty pre-edit content, sha256 `27b8d72b2147054b3f63afd8e8c047a95ed1eadb9665487a642e708fcf60c73`) and `...\test-gate8-verification-scope.mjs.pre-bootstrap` (sha256 `e7f014494a521169dafeb3ec99a33bc72d8ae1c6bfebe4bdba4220afdffdf62`), both captured before modification, since the rollback tag alone cannot recover uncommitted working-tree content.

The role may implement only:

- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\gate8-repair-loop.mjs` — add exactly one new frozen exact-match scope, `PROSPECTIVE_UNTRACKED_EVIDENCE_CAPTURE_SCOPE = ['server.gate5.mjs', 'test-gate5-investigation-path-handling.mjs', 'openapi.live.yaml', 'test-verify-openapi-live-yaml-documentation-only.mjs', 'gate8-repair-loop.mjs', 'test-gate8-verification-scope.mjs']`, and its wiring in `deriveVerificationGatesForScope` and `buildVerificationPlan` (one `*Only` predicate, one `matchCount` entry, one `kind` branch, one gate-language check, requesting no `requiresNodeModules`/`runTypecheck`/`runBuild`/`tsxTestFiles` and `verificationCommands` running `test-gate5-investigation-path-handling.mjs`, `test-verify-openapi-live-yaml-documentation-only.mjs`, `test-gate8-repair-loop.mjs`, and `test-gate8-verification-scope.mjs`). No change to any existing family.
- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\test-gate8-verification-scope.mjs` — add permanent deterministic coverage (not a disposable harness this time, per explicit instruction) proving the new six-file family resolves by exact-set match only: the exact scope resolves to the new gates; reversed order still matches; every proper five-file subset (each file omitted in turn) is rejected; the scope plus one extra unrelated file is rejected; gate-text mismatch fails closed; no existing family (including the differently-scoped `prospective-file-admission-repair` and `openapi-live-yaml-create-scope-field` families) is altered.

Prohibited: implementing the evidence-capture capability itself in `server.gate5.mjs` or `openapi.live.yaml`; creating `test-gate5-investigation-path-handling.mjs`'s new capability test content; modifying `server/storage.ts`, `scripts/ci/typecheck-gate.ts`, or any other application file; touching Pantry or its verification family; running `syncAllPantryDefaults()` or writing any application/database data; approving or executing any decision against the new scope; changing any other Gate 8 family; changing Gate 5 or Gate 9 runtime semantics; weakening exact-match or fail-closed behaviour; introducing subset/superset or wildcard matching; changing authentication, allowlists, repository access, or execution policy; fixing `startThaTaskPreparation`'s repository routing; resetting, stashing, cleaning, reverting, or staging any pre-existing dirty file in either repository; commit, push, deploy, or migration.

Required verification is: every pre-existing registered family still resolves to exactly one match, spot-checked including `typecheck-gate-windows-fix` and `pantry-sync-household-resolution`; the exact six-file scope resolves to exactly one match (`prospective-untracked-evidence-capture`) and requests no `requiresNodeModules`/`runTypecheck`/`runBuild`/`tsxTestFiles` and the four named `verificationCommands`; an empty scope, any proper subset, and any unrelated/sibling file are all rejected by the new family; `node --check gate8-repair-loop.mjs` and `node --check test-gate8-verification-scope.mjs` pass; `test-gate8-repair-loop.mjs` and the updated `test-gate8-verification-scope.mjs` pass; `git status` in the bridge repository shows only the two authorised bootstrap files as changed beyond the pre-existing dirty baseline; no `tha-integrated-dev` file is touched; no decision is approved or executed; no database write occurs.

**Verification result:** `node --check gate8-repair-loop.mjs` and `node --check test-gate8-verification-scope.mjs` both pass. A disposable pre-check probe (`_probe-prospective-untracked-evidence-capture-family.mjs`, run then deleted before the permanent test edit) reported 12/12 checks passed: the exact six-file scope resolves to exactly one match (`prospective-untracked-evidence-capture`) requesting no `requiresNodeModules`/`runTypecheck`/`runBuild`/`tsxTestFiles` and the four named `verificationCommands` (`test-gate5-investigation-path-handling.mjs`, `test-verify-openapi-live-yaml-documentation-only.mjs`, `test-gate8-repair-loop.mjs`, `test-gate8-verification-scope.mjs`); an empty scope, every proper five-file subset, and the scope plus an unrelated extra file are all rejected; gate-text mismatch fails closed; reversed-order input still matches; the `typecheck-gate-windows-fix`, `pantry-sync-household-resolution`, and `prospective-file-admission-repair` sibling families are confirmed unaffected. Permanent coverage proving the identical assertions was then added to the checked-in `test-gate8-verification-scope.mjs` itself (not a disposable harness, per this appointment's explicit instruction), including confirmation that the three other families sharing one or more of this family's six files by pre-existing design (`gate5-investigation-path-handling`, `openapi-live-yaml-create-scope-field`, `prospective-file-admission-repair`) still independently resolve unchanged. Both checked-in regression suites pass (`Gate 8 bounded repair-loop tests passed.` / `Gate 8 scope-aware verification tests passed.`). `git status` in the bridge repository shows the same 34 pre-existing tracked-modified files as the pre-appointment baseline (`gate8-repair-loop.mjs` and `test-gate8-verification-scope.mjs` already among them); the two most recently modified files in the entire working tree are exactly these two, and the disposable probe file was deleted before this check. A diff against the byte-exact pre-bootstrap snapshots shows 7 additive hunks in `gate8-repair-loop.mjs` (0 removed lines) and 2 additive hunks in `test-gate8-verification-scope.mjs` (0 removed lines), matching precisely the authorised wiring. No `server.gate5.mjs`, `openapi.live.yaml`, or other application/capability file was touched. No `tha-integrated-dev` application file was touched (only this governance record). No decision was created, approved, or executed. No database write occurred.

The appointment terminates automatically with status `TERMINATED` immediately when this verification matrix passes. It then has zero residual authority. Gate 9 remains the sole normal governed implementation execution authority, and all subsequent work — including creating and approving the six-file evidence-capture repair decision itself — returns to normal Gate 9 decision, approval, evidence, current-owner, and execution controls.

### Temporary Gate 8 typecheck-isolation verification-family bootstrap appointment

**Status:** TERMINATED — verification matrix passed; zero residual authority.
**Role ID:** `tha-gate8-typecheck-isolation-verify-bootstrap-operator-001`
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`
**Appointing owner:** Colin (`tha-governance-owner-001`)
**Reason:** Gate 9's exact-match verification-family registry lives inside `gate8-repair-loop.mjs` itself. A VERIFIED, directly-reproduced executor defect blocks a bounded repair: `gate8-execute-approved-decision.mjs`'s `requiresNodeModules` block provisions every isolated worktree's `node_modules` via a Windows junction to the live repository's actual `node_modules`, and `tha-integrated-dev`'s `tsconfig.json` places its incremental build-info cache (`tsBuildInfoFile`) inside that same shared `node_modules`. Any `npm run typecheck` invocation anywhere (another concurrent worktree, the live repo, or a manual run) overwrites that one shared cache mid-execution, so Gate 8's own baseline-vs-post `compareTypecheck` comparison intermittently reports spurious added/removed diagnostics unrelated to any real code change. This was proven by direct, controlled reproduction: an isolated baseline/post capture with no interleaving diff'd clean (0 added), while deliberately interleaving one `npm run typecheck` run against a second worktree between the same baseline and post captures reproduced the exact spurious-diagnostic failure shape, including a "removed" entry literally containing the other worktree's absolute path baked into its cached text. This is the confirmed cause of two consecutive genuinely-correct Pantry household-resolution executions (`tha-dec-f7b763b9f36fb187e3f629a2461a9d77`, executions `tha-exec-1789982023124-fdf0eeb4` and `tha-exec-1789983245901-1146484f`) failing only on `typecheck`, both flagging the same two already-baselined, unrelated diagnostics as new. No scope other than `gate8-execute-approved-decision.mjs` and its own dedicated regression test is implicated; `tsconfig.json`, Pantry, and Planner are unaffected by the defect and must not be touched by this repair. This appointment creates verification-governance support only — it does not implement the isolation fix, does not touch Pantry, Planner, or `tsconfig.json`, and does not modify any other Gate 8 family.
**Effective at:** `2026-09-21T10:41:07Z`
**Rollback:** `rollback/gate8-typecheck-isolation-bootstrap-20260921-104107` (annotated tag on bridge-repo HEAD `ad400c3e6498b45660f7369a019e11dac5373f12`, created before any edit; protects committed state only)
**Bridge pre-state package:** `C:\Users\Colin\AppData\Local\Temp\tha-gate8-typecheck-isolation-bootstrap-20260921-104107\gate8-repair-loop.mjs.pre-bootstrap` (byte-exact copy of the file's already-dirty pre-edit content, sha256 `b9970e9674ea3fec7ab3eabccc9cae20cd39f1b0d035a65e9c54a1fea7eda634`) and `...\test-gate8-verification-scope.mjs.pre-bootstrap` (sha256 `31e944dfc8981e331b85fbdbd5f8d174d9a989b0aa26b9c4ce9c27da5c0a566a`), both captured before modification, since the rollback tag alone cannot recover uncommitted working-tree content.

The role may implement only:

- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\gate8-repair-loop.mjs` — add exactly one new frozen exact-match scope, `GATE8_TYPECHECK_ISOLATION_REPAIR_SCOPE = ['gate8-execute-approved-decision.mjs', 'test-gate8-typecheck-isolation.mjs']`, and its wiring in `deriveVerificationGatesForScope` and `buildVerificationPlan` (one `*Only` predicate, one `matchCount` entry, one `kind` branch, one gate-language check, requesting `requiresNodeModules: true` and `verificationCommands: [{ name: 'gate8-typecheck-isolation', args: ['test-gate8-typecheck-isolation.mjs'] }]`, no `runTypecheck`/`runBuild`/`tsxTestFiles`). No change to any existing family.
- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\test-gate8-verification-scope.mjs` — add permanent deterministic coverage (not a disposable harness) proving the new family resolves by exact-set match only: the exact scope resolves to the new gates; reversed order still matches; every proper one-file subset is rejected; the scope plus one extra unrelated file is rejected; gate-text mismatch fails closed; no existing family (especially the several pre-existing families that already reference `gate8-execute-approved-decision.mjs` in other, larger scopes) is altered.

Prohibited: implementing the typecheck-isolation fix itself in `gate8-execute-approved-decision.mjs`; creating `test-gate8-typecheck-isolation.mjs`'s actual test content; modifying `tsconfig.json` or any other application file; touching Pantry, Planner, or their verification families; running `syncAllPantryDefaults()` or writing any application/database data; approving or executing any decision against the new scope; changing any other Gate 8 family; changing Gate 5 or Gate 9 runtime semantics; weakening exact-match or fail-closed behaviour; introducing subset/superset or wildcard matching; resetting, stashing, cleaning, reverting, or staging any pre-existing dirty file in either repository; commit, push, deploy, or migration.

Required verification is: every pre-existing registered family still resolves to exactly one match, spot-checked including `pantry-sync-household-resolution`, `typecheck-gate-windows-fix`, and `prospective-untracked-evidence-capture`; the exact two-file scope resolves to exactly one match (`gate8-typecheck-isolation`) and requests `requiresNodeModules: true` and the one named `verificationCommand`, no `runTypecheck`/`runBuild`/`tsxTestFiles`; an empty scope, either file alone, and the scope plus an unrelated extra file are all rejected; `node --check gate8-repair-loop.mjs` and `node --check test-gate8-verification-scope.mjs` pass; `test-gate8-repair-loop.mjs` and the updated `test-gate8-verification-scope.mjs` pass; `git status` in the bridge repository shows only the two authorised bootstrap files as changed beyond the pre-existing dirty baseline; no `tha-integrated-dev` file is touched; no decision is approved or executed; no database write occurs.

**Verification result:** `node --check gate8-repair-loop.mjs` and `node --check test-gate8-verification-scope.mjs` both pass. A disposable pre-check probe (`_probe-gate8-typecheck-isolation-family.mjs`, run then deleted before the permanent test edit) reported 11/11 checks passed: the exact two-file scope resolves to exactly one match (`gate8-typecheck-isolation-repair`) requesting `requiresNodeModules: true` and the one named `verificationCommand`, no `runTypecheck`/`runBuild`/`tsxTestFiles`; an empty scope, either file alone, and the scope plus an unrelated extra file are all rejected; gate-text mismatch fails closed; reversed-order input still matches; the `pantry-sync-household-resolution`, `typecheck-gate-windows-fix`, and `prospective-untracked-evidence-capture` sibling families (the last of which also references both bootstrap-scope files, by pre-existing design) are confirmed unaffected. Permanent coverage proving the identical assertions was then added to the checked-in `test-gate8-verification-scope.mjs` itself, including confirmation that `PROSPECTIVE_FILE_ADMISSION_REPAIR_SCOPE` (a larger pre-existing family also referencing `gate8-execute-approved-decision.mjs`) still independently resolves unchanged. Both checked-in regression suites pass (`Gate 8 bounded repair-loop tests passed.` / `Gate 8 scope-aware verification tests passed.`). `git status` in the bridge repository shows the same 35 pre-existing tracked-modified files as the pre-appointment baseline (`gate8-repair-loop.mjs` and `test-gate8-verification-scope.mjs` already among them); the two most recently modified files in the entire working tree are exactly these two, and the disposable probe file was deleted before this check. A diff against the byte-exact pre-bootstrap snapshots shows 8 hunks in `gate8-repair-loop.mjs` and 2 hunks in `test-gate8-verification-scope.mjs`; 6 of the 8 in the former are purely additive (new export block, new `deriveVerificationGatesForScope` check, new Set/Only pair, new kind-ternary branch, new gate-text check, new verificationCommands-ternary branch), and 2 extend existing single-line array-literal/boolean-disjunction expressions (`matchCount`, `requiresNodeModules`) by appending exactly one new identifier each — a line-level modification of the diff tool's own accounting, not a removal of any existing entry or behaviour; both `test-gate8-verification-scope.mjs` hunks are purely additive. No `gate8-execute-approved-decision.mjs`, `tsconfig.json`, or other application/executor file was touched. No `tha-integrated-dev` application file was touched (only this governance record). No decision was created, approved, or executed. No database write occurred.

The appointment terminates automatically with status `TERMINATED` immediately when this verification matrix passes. It then has zero residual authority. Gate 9 remains the sole normal governed implementation execution authority, and all subsequent work — including creating and approving the typecheck-isolation repair decision itself — returns to normal Gate 9 decision, approval, evidence, current-owner, and execution controls.

## Mandatory governance bootstrap

Before any significant investigation, recommendation, concept, implementation, or delegated task:

1. Verify the exact repository root, current worktree/branch, HEAD commit, and `git status`.
2. Read `docs/architecture/README.md`. It is the mandatory entry point to the governing architecture.
3. Read and follow `docs/architecture/ENGINEERING_WORKFLOW.md`.
4. Identify the domain affected by the request and read the relevant governing architecture named by the Architecture README.
5. For any UX, UI, frontend, visual, room, Cookbook, Planner, Larder, or Living Home work, read `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` before design or implementation and follow its Experience Constitution Check.
6. Apply `docs/change-control.md` where a material product or implementation decision is required.
7. Do not rely on conversation memory or a summary where the authoritative repository document is available.
8. If authoritative documents conflict, are missing, or do not support the requested change, STOP and report the conflict. Do not choose an interpretation silently.
9. Do not modify files or delegate implementation until the Governance Preflight Receipt below has been produced.

### THA Governance Preflight Receipt

Before implementation or delegation, report:

- Repository
- Worktree / branch
- Base HEAD commit
- Git status
- User request
- Mandatory governance documents actually read
- Task-specific governing documents actually read
- Existing implementation/assets inspected
- Authorised scope
- Explicit non-goals
- Architecture or governance conflicts: NONE or details
- Decision/risk status
- Implementation permitted: YES or NO

A statement such as "I followed the architecture" is not sufficient. Name the exact governing documents actually read.

### Delegation gate

No Claude, Codex, subagent, or other implementation agent may be delegated a THA task from conversation context alone.

Every delegated task must include the repository/worktree identity, authorised scope, non-goals, protected areas, tests, stop condition, and exact governing files to read.

The delegated agent must independently read those files before editing. A parent-agent summary is not a substitute for the authoritative files.

### Verification gate

Agent completion is not acceptance.

After implementation, the parent agent must independently inspect the actual diff and compare it against the same governing documents used during preflight.

A technically working implementation that violates architecture, governance, approved visual direction, ownership, or scope is a failure.

## Product North Star

Healthy Apples is a materially honest home and kitchen experience. It must feel like moving through a real home, not a dashboard or ordinary webpage placed over scenery.

- Physical rooms and household objects are primary.
- Navigation is bottom-only. Do not add a left rail.
- Preserve believable scale, lighting, materials, architecture, and environmental cues.
- Semantic controls and real operations must remain available beneath visual treatments.
- Mobile requires a readable flat fallback.
- Do not use generic grey application modals, floating dashboard cards, childish/basic computer graphics, or unrelated stock imagery as a substitute for project assets.

## Visual governance

- Existing Healthy Apples room/home/kitchen assets and established visual language are the source of truth.
- Before creating a concept, locate and inspect the exact repository assets that define the room, kitchen, shelf, window, fridge, Cookbook, Larder, or Planner context.
- A concept must use the actual project scene or a governed edit of it. Do not use Unsplash or unrelated stock photography unless Colin explicitly authorizes it.
- The real room/kitchen context must remain visibly present and materially believable. A working object such as the Planner may become the dominant usable surface on its dedicated workspace when readability requires it, while remaining physically integrated with the photographed kitchen. Never turn it into a detached generic dashboard, poster, or unrelated UI board.
- Photorealistic means actual photographic/composited pixels with realistic light, shadows, materials, perspective, and scale. HTML/CSS diagrams and schematic panels are not photorealistic concepts.
- Keep concept outputs quarantined under `artifacts/`, label them UNACCEPTED until Colin approves them, and provide exact paths plus a contact sheet.
- Passing a build, contract, screenshot generator, or agent report is not visual approval. Colin is the human visual acceptance owner.

## Architecture and canonical behavior

- Reuse existing routes, services, hooks, data models, dialogs, mutations, and callbacks. Do not invent parallel business paths in concept pages.
- Preserve `useMeals()`, `shelfForMeal()`, `/api/freezer`, `usePlannerMealSearch`, Planner infrastructure, scanner/review flow, and `CompanionContextProvider`.
- Cookbook canonical shelves and placement language are owned by `shared/cookbook/curation.ts`.
- Canonical ingredient identity uses the shared parser, normalizer, resolver, and controlled variants. Do not add local synonym/token matching.
- Actions must execute the real operation. Shopping adds meal ingredients to the existing shopping list; Freezer uses the existing freezer workflow; Planner uses existing Planner infrastructure.
- Preserve legacy functionality at `/cookbook/grid` while `/cookbook` is the Real Book surface.
- Keep provenance/source URLs and acquisition information intact.

## Planner direction

The Planner remains functionally a weekly day/meal-slot grid, but its visual presentation must be a real-world kitchen object rather than a dashboard grid.

- The intended direction is a physical weekly Planner hanging from or attached near an existing shelf, window, rail, fridge, or other real kitchen feature.
- Natural daylight may illuminate it; the Planner must belong to the actual project kitchen scene.
- The Planner remains a physically believable object within the real kitchen scene. On the dedicated Planner workspace, the accepted Planner photograph may fill most or all of the available viewport so the weekly paper grid is large and readable. The Planner must remain visibly part of the kitchen and must never become a generic dashboard, poster, or detached UI board.
- Preserve the existing seven-day, meal-time, search, drag/drop, assignment, removal, and accessibility behavior.
- Do not implement Planner visual changes until the concept has been grounded in the actual project assets and Colin has reviewed the pixels.

## Delegated-agent contract

Every Claude/Codex task must include:

- the exact absolute worktree path, branch, and repository identity;
- exact files allowed to read/edit;
- protected files/areas and forbidden scope;
- the governing North Star and relevant canonical architecture;
- exact commands/tests to run;
- a stop condition;
- no commit/push/deploy/credential/database side effects.

Agent completion is not acceptance. The parent agent must inspect `git status`, `git diff`, actual artifacts, focused tests, build output, and live behavior where relevant. For visual work, the parent must inspect the actual full-resolution pixels and reject violations before delivery.

## Delegation responsibility split

For the Planner migration and visual implementation:

- When a Planner feature-parity audit is required, Codex may be used as the read-only audit worker. During that audit it must enumerate every current Planner feature, interaction, route, service, hook, data flow, mutation, accessibility behavior, responsive behavior, and edge case that must be preserved. It must not redesign or edit implementation during the audit. Performing the audit does not reserve later implementation work to either Codex or Claude.
- Planner visual implementation is assigned by the THA orchestrator to Claude or Codex only after the Governance Preflight, task-fit and complexity assessment, and current capacity review. Claude is normally preferred for nuanced visual-fidelity work, but this is a routing preference rather than ownership. The selected worker must remain narrowly scoped and must not decide feature scope, remove existing behavior, invent architecture, replace canonical services/routes, or use generic UI patterns.
- Hermes/Luna, or ChatGPT when acting as the parent orchestrator, reconciles any parity audit with the repository architecture, recommends or selects the implementation worker under the governed THA routing rules, gives that worker exact bounded implementation directions, and independently verifies the resulting diff, tests, runtime behavior, and visual pixels where applicable.
- If an agent cannot locate the governing principle, canonical implementation, required asset, or safe behavior in project files, it must stop and ask for direction. It must not infer, substitute, or proceed generically.
- The accepted Planner visual base is `artifacts/planner-target-blank/PLANNER_TARGET_BLANK_ACCEPTED.png`. Do not create a replacement visual direction without Colin's explicit approval.
- Planner implementation must use the accepted image as the physical surface and place semantic live overlays over its blank content area. Do not recreate the image, cupboard, window, paper, wood, lighting, or Planner frame with generic CSS.
- The Planner must feel familiar to the accepted Real Book Cookbook: physical-object-first, materially honest, readable, calm, household-scale, and functionally direct. Reuse the Cookbook's established interaction language and canonical controls where architecture supports it; do not invent a second visual system or generic dashboard card treatment.
- Planner visual acceptance requires the approved hanging Planner photograph to fill the available screen as the physical surface; desktop days must run horizontally Monday through Sunday, meal types vertically down the side, and live meal information must occupy the paper grid. Planner typography must mirror the Cookbook's established typography and material voice. The page title should use the established family-meal voice, with the working wording: "Planner — The meals that bring our family together, every day". Controls must be calm and restrained: reduce visible button-heavy chrome without removing semantic access to existing Planner actions.

## Status vocabulary

### Temporary decision-factory pre-state bootstrap appointment

**Status:** TERMINATED — verification matrix passed; zero residual authority.  
**Role ID:** `tha-decision-factory-prestate-bootstrap-operator-001`  
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`  
**Appointing owner:** Colin (`tha-governance-owner-001`)  
**Reason:** Gate 9 decision creation is circularly blocked by recursive generated
`execution-worktrees/**` paths entering the dirty pre-state baseline; normal Gate 9
execution cannot repair the boundary that it must traverse to create the repair
decision.  
**Effective at:** `2026-09-10T00:00:00Z`  
**Terminated at:** `2026-09-10T00:12:00Z`  
**Rollback:** `rollback/tha-decision-factory-prestate-bootstrap-20260910-004332`  
**Bridge pre-state package:** `C:\Users\Colin\AppData\Local\Temp\tha-decision-factory-prestate-bootstrap-20260910-004332`

The role may modify exactly this tracked bridge file, and no other repository file:

- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\decision-factory.mjs`

The repair is limited to excluding generated `execution-worktrees` paths from the
dirty pre-state baseline while preserving authoritative decision, execution,
reconciliation, rollback, and evidence paths.  The role may not modify
`gate8-repair-loop.mjs`, tests, registry or historical evidence; create, approve, or
execute a decision; alter application files; change governance or authorization
semantics; commit, push, deploy, migrate, restart services, or perform cleanup.

Required verification is: the exact generated-worktree exclusion is present; the
existing porcelain parser regression passes; syntax checks pass; the registry,
historical evidence, and all unrelated dirty paths remain unchanged; and no Gate 9
decision is created or executed.  The role terminates immediately after this matrix
passes and has zero residual authority.  Gate 9 remains the sole normal governed
implementation authority.

### Temporary Gate 9 candidate-creation error-provenance bootstrap appointment

**Status:** TERMINATED — verification matrix passed; zero residual authority.  
**Role ID:** `tha-gate9-candidate-error-provenance-bootstrap-operator-001`  
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`  
**Appointing owner:** Colin (`tha-governance-owner-001`)  
**Reason:** Normal Gate 9 candidate creation reaches its internal artifact-creation path, but `gate9-decision-create.mjs` discards the original exception, leaving the circularly blocking candidate-creation failure impossible to diagnose through normal Gate 9.  
**Effective at:** `2026-09-10T00:20:00Z`  
**Terminated at:** `2026-09-10T00:32:00Z`  
**Rollback:** `rollback/tha-gate9-error-provenance-bootstrap-20260910-000759`  
**Bridge pre-state package:** `C:\Users\Colin\AppData\Local\Temp\tha-gate9-error-provenance-bootstrap-20260910-000759`

Permitted bridge source files only:

- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\gate9-decision-create.mjs`
- `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\server.gate9.mjs`

The permitted change is limited to bounded, sanitized server-side provenance for
internal candidate-creation failures while preserving the outward
`decision_creation_refused` contract. The unknown underlying failure must not be
fixed under this appointment. No decision may be created, approved, bound, or
executed; no authority, validation, verification, binding, approval, or execution
semantics may change; and no credentials, secrets, tokens, request bodies, absolute
paths, or unrestricted stacks may be recorded. `gate9-current-decision.json`,
`execution-worktrees`, historical evidence, and unrelated dirty state are protected.

Required deterministic verification must prove the outward refusal contract,
bounded provenance, sensitive-data exclusion, registry and evidence immutability,
and no decision or execution side effect. The appointment terminates immediately
after the matrix passes, with zero residual authority. Gate 9 remains the sole
normal implementation authority.

**Verification result:** PASS. Both authorized files passed syntax checks and the
synthetic injected-failure regression preserved `decision_creation_refused` while
retaining only bounded allowlisted provenance; bearer tokens, credentials,
environment values, request bodies, absolute paths, stacks, and causes were not
retained. `gate9-current-decision.json` remained byte-identical; no decision was
created, approved, bound, or executed; execution-worktrees, historical evidence,
and unrelated dirty state were untouched; and no commit, push, deploy, migration,
or restart occurred. The unknown underlying candidate-creation failure was not
fixed. Gate 9 is again the sole normal implementation authority.

Distinguish: coding complete, technically verified, integrated, visually reviewed, human-approved, and deployed. Never collapse them into one completion claim.

### Temporary Gate 9 risk-classifier alignment bootstrap appointment

**Status:** ACTIVE — one bounded classifier-correction decision only; zero residual authority for any other work.  
**Role ID:** `tha-gate9-risk-classifier-alignment-bootstrap-operator-001`  
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`  
**Appointing and approving owner:** Colin (`tha-governance-owner-001`), explicitly authorized in the Codex conversation on 2026-10-22.  
**Effective date:** 2026-10-22. **Expires:** 2026-10-29T23:59:59Z, or earlier on completion, any verification failure, scope/baseline drift, or owner revocation.  
**Governed root / branch / HEAD:** `G:\The Healthy Apples\Infrastructure\tha-chatgpt-bridge` / `main` / `d34be625edf167d9c96926537e3643c6e962c3d8`.  
**Governance-record root / branch / HEAD:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003` / `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89`.  
**Rollback anchors:** Bridge `rollback/tha-gate9-risk-classifier-bridge-20261022`; governance `rollback/tha-gate9-risk-classifier-governance-20261022`. These tags anchor committed HEAD only; pre-existing dirty work is preserved separately and is not included in either tag.  
**Dirty-state binding:** 53 existing Bridge status entries and 6 existing integrated-development status entries. Combined pre-appointment status SHA-256: `75519917F98775BB4F310F4B899C1EB8F5BA4AD5768073C821EA98741C6B9C29`. Byte-exact pre-appointment copy of this already-dirty governance file: `G:\The Healthy Apples\Incoming\Rollback Evidence\THA-GATE9-RISK-CLASSIFIER-BOOTSTRAP-20261022\PROJECT_GOVERNANCE.md.pre-appointment` (SHA-256 `B48E9B43ECE2081C10699859F5C2BCBF12BB7B395ACBB1826BD347B274D56951`). Manifest: `G:\The Healthy Apples\Incoming\Rollback Evidence\THA-GATE9-RISK-CLASSIFIER-BOOTSTRAP-20261022\manifest.json`.

**Reason:** the reviewed result-path repair changes governed execution, persisted lifecycle/results, result projection, and rollback. The shared THA risk rubric treats persistence/security changes as RED, while current Gate 9 path classification returns AMBER for the exact eight-file repair scope. The exact family registration already exists; the mismatch is in independent risk classification, not missing verification-family registration.

**Appointment scope:** the operator may prepare exactly one normal Gate 9 decision with scope `['governed-objective-policy.mjs', 'test-governed-objective-policy.mjs']` for the bounded child-admission policy risk-classification correction below. This appointment does not authorize editing either file, approving the resulting decision, or executing it. The normal Gate 9 decision must be reviewed and separately approved by the owner using its exact generated phrase before any implementation. No caller-supplied risk override is permitted. Until the correction is separately approved and executed, the decision-creation API may report AMBER for this classifier-change decision; this appointment requires RED-depth review and verification controls for that one decision and does not alter what Gate 9 reports.

**Exact proposed classifier correction for that separate decision:** add independent RED classifications for the Bridge-relative paths `gate8-execute-approved-decision.mjs`, `gate9-execution-status.mjs`, and `server.gate9.mjs`; add exact regression assertions in `test-governed-objective-policy.mjs` for forward- and backslash forms. Preserve every existing RED classification. Confirm an ordinary application path and `tha-cli.mjs` remain AMBER. This makes the already-registered eight-file result-path repair scope derive RED through the existing maximum-risk rule. The correction must not change risk derivation, verification-family matching, route/auth behavior, approval semantics, or any other path classification.

**Required verification for the separate classifier decision:** `node --check governed-objective-policy.mjs`; `node --check test-governed-objective-policy.mjs`; `node test-governed-objective-policy.mjs`; `node test-gate9-decision-create.mjs`; `node test-gate8-repair-loop.mjs`; and `node test-gate8-verification-scope.mjs`. The full deterministic tests must prove the three named paths classify RED in both slash forms, existing RED cases remain RED, ordinary and CLI paths remain AMBER, the exact eight-file result-path scope derives RED after correction, and existing verification families remain unchanged. Any failure or need for another file stops this appointment and requires a revised exact-scope owner decision.

**Prohibited:** direct or manual code edits under this appointment; approving or executing the classifier decision under this appointment; implementing the result-path repair; touching the previous failed execution; editing any other Bridge or integrated-development file; changing authentication, authorization, route surface, risk derivation, verification-family registration, decisions, approvals, receipts, execution ledger, credentials/configuration, services, databases, scheduled tasks, or application data; committing, pushing, deploying, migrating, resetting, cleaning, stashing, staging, switching branches, or altering unrelated dirty state.

**Termination:** this appointment terminates immediately after its one decision is prepared, on any deviation/failure/drift, on expiry, or on owner revocation. Preparing the decision does not approve it. All implementation remains subject to a separate exact Gate 9 approval. This appointment grants no authority for the eight-file result-path repair; that remains a separate RED decision.
### Temporary Gate 9 child-admission policy dispatch bootstrap appointment

**Status:** ACTIVE — authority for one normal Gate 9 decision-preparation request only; no residual implementation authority.
**Role ID:** `tha-gate9-child-admission-policy-dispatch-bootstrap-operator-001`
**Authority type:** `TEMPORARY_CONSTITUTIONAL_BOOTSTRAP`
**Appointing and approving owner:** Colin (`tha-governance-owner-001`), explicitly authorized in the Codex conversation on 2026-10-22.
**Effective date:** 2026-10-22. **Expires:** 2026-10-29T23:59:59Z, or earlier on completion, any verification failure, scope/baseline drift, or owner revocation.
**Governed root / branch / HEAD:** `G:\The Healthy Apples\Infrastructure\tha-chatgpt-bridge` / `main` / `d34be625edf167d9c96926537e3643c6e962c3d8`.
**Governance-record root / branch / HEAD:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003` / `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89`.
**Rollback anchors:** Bridge local tag `rollback/tha-gate9-policy-dispatch-bootstrap-20261022`; governance commit tag `rollback/tha-gate9-risk-classifier-governance-20261022`. Both anchor committed HEAD only. Byte-exact pre-appointment copy of the already-dirty governance file: `G:\The Healthy Apples\Incoming\Rollback Evidence\THA-GATE9-POLICY-DISPATCH-BOOTSTRAP-20261022\PROJECT_GOVERNANCE.md.pre-appointment` (SHA-256 `76916652D4AB0881484388E0B45C1E39C0DBFCCAF5F5714A21A6926D071E9F53`). Manifest: `G:\The Healthy Apples\Incoming\Rollback Evidence\THA-GATE9-POLICY-DISPATCH-BOOTSTRAP-20261022\manifest.json`.
**Dirty-state binding:** 53 existing Bridge status entries and 6 existing integrated-development status entries. Combined pre-appointment status SHA-256: `1D509D446934656E79E68AA380B700ED6CFE21ACD616DC1D65FBCE81F977DBE4`. Preserve all existing dirty content byte-for-byte; the snapshot protects the pre-existing governance-file content.

**Reason:** the exact child-admission policy family already exists in `gate8-repair-loop.mjs` and its Gate 8 plan builder, but `deriveVerificationGatesForScope()` has no corresponding Gate 9 decision-creation dispatch. The owner's normal Gate 9 request for `governed-objective-policy.mjs` and `test-governed-objective-policy.mjs` was rejected with `verification_scope_not_supported` before a decision was created. The existing verification-system-repair family supports the exact bootstrap decision scope below; no alternate API or bypass is authorized.

**Appointment scope:** prepare exactly one normal Gate 9 decision with Bridge scope `['gate8-repair-loop.mjs', 'test-gate8-verification-scope.mjs']` for the bounded registration-only change below. Use the existing `VERIFICATION_SYSTEM_REPAIR_SCOPE` and its exact existing verification gate as the bootstrap decision family. If Gate 9 does not accept that exact scope/family, stop. This appointment does not authorize editing either Bridge file, approving the resulting decision, or executing it. Any implementation requires the separately generated decision and the owner's separate approval using its exact phrase.

**Exact proposed dispatch correction for that separate decision:** add one exact `CHILD_ADMISSION_POLICY_SCOPE` case to `deriveVerificationGatesForScope()` that returns a policy-specific verification gate compatible with the existing `child-admission-policy` plan kind. Reuse `CHILD_ADMISSION_POLICY_VERIFICATION_COMMANDS` and existing `buildVerificationPlan()` behavior; do not create a new family or change its scope, commands, or semantics. Add permanent regression assertions in `test-gate8-verification-scope.mjs` proving the exact two-file policy scope resolves to the child-admission policy verification behavior, reversed order remains supported, and missing, extra, duplicate, and wrong-family scopes fail closed. Preserve every existing family, verification gate, `matchCount` entry, kind branch, and the `matchCount !== 1` guard.

**Required verification for the separate dispatch decision:** `node --check gate8-repair-loop.mjs`; `node --check test-gate8-verification-scope.mjs`; `node test-gate8-verification-scope.mjs`; `node test-gate8-repair-loop.mjs`; and `node test-gate9-decision-create.mjs`. Confirm the new exact scope resolves to the child-admission policy verification behavior, all near-matches remain rejected, and the existing verification-system-repair family and all existing families remain unchanged. Recheck the exact dirty-state delta against the pre-decision baseline. Any failure, baseline drift, scope change, or need for another file terminates this appointment; no retry or expansion is authorized.

**Prohibited:** direct or manual Bridge source edits under this appointment; approving or executing the prepared decision under this appointment; implementing the child-admission risk-table correction; implementing the result-path repair; touching or reconciling the prior failed execution; editing any other file or repository; changing risk derivation, caller input, verification families beyond the exact dispatch, routes, authorization, decisions, approvals, receipts, execution ledger, credentials/configuration, services, databases, scheduled tasks, or application data; committing, pushing, deploying, migrating, resetting, cleaning, stashing, staging, switching branches, or altering unrelated dirty state.

**Termination:** this appointment terminates immediately after one decision is prepared, on any deviation/failure/drift, on expiry, or on owner revocation. Preparing the decision does not approve it. All implementation remains subject to a separate exact Gate 9 approval. This appointment grants no authority for the classifier correction or the eight-file result-path repair.

### Owner Amendment — Sole Project Authority, Dev-Branch Work, and Promotion (2026-10-24)

**Ratification status:** JOINTLY RATIFIED
**Effective at:** `2026-10-24T21:51:07Z`
**Ratifying owners:** Colin (`tha-governance-owner-001`) and Lindsay (`tha-governance-owner-002`) — Lindsay's approval to relinquish joint-approval authority was relayed for the record by Colin.
**Amendment:** `Sole project authority, dev-branch work, and promotion approval`
**Rationale:** Allow ordinary application development to proceed continuously within the development branch while keeping movement into shared repository state and later release environments under the owner's explicit control.

**Sole project authority.** For this application project, Colin is the sole governance authority. Joint approval from Lindsay is not required for any project matter within this repository. This supersedes prior provisions identifying Colin and Lindsay as equal Governance Owners for this application project or requiring their joint approval for this project. It does not transfer ultimate THA ownership or alter any other repository's governance.

**Development-branch work.** Work confined to the verified application development branch `feat/integrated-dev` may proceed without per-task owner approval, including work affecting authentication, payments, and file deletion. The local AI Agent Bridge may execute such application tasks directly without a per-task Gate 9 decision or approval. Before every write to a configuration file, the worker must create a timestamped sibling backup containing the exact prior bytes. A failed backup prevents that write. A new backup is required before each subsequent write to the same configuration file.

**Promotion approval.** Moving work from the development branch into the shared/main repository state requires Colin's explicit approval before that movement occurs. Moving shared work onward to staging or production also requires Colin's explicit approval before each such promotion. Completion of a development task is not promotion approval. This promotion checkpoint replaces per-task implementation approval for ordinary application development.

**Bridge-root scope.** This amendment applies only to application-repository development. It does not change Bridge-root governance or Gate 9's role for Bridge-root work.
