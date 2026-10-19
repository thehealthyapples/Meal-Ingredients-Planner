# Connected Activity Lifecycle Projection Investigation

**Date:** 2026-08-26
**Scope:** Investigation only. No code, route, or decision implementation.
The verification repair chain (vacuous-PASS investigation, rate-limit
isolation, standalone-invocation enforcement, Follow-up 1, Follow-up 2) is
treated as closed and was re-verified live only where this investigation's
own steps required it, not re-litigated.

## Governance re-check — no drift

`docs/architecture/README.md`: zero Gate 5/7/8/9 mentions, unchanged.
`docs/architecture/UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` §13 (Administration):
still names exactly three sources — `server/lib/access.ts`, `admin_audit_log`,
Domain 32/OBS1 — unchanged. **Verified**, both re-read this turn.

---

## STEP 1 — Current real contract

`GET /v1/tha/activity` (`server.gate5.mjs:1387-1580`, re-read directly this
turn, byte-identical to every prior reading this session — **Verified**, no
drift): `{ ok, mode, timestamp, recordCount, truncated, records[], safety }`.
Four independent, unlinked record kinds, exactly as previously found:

| RECORD_TYPE | AUTHORITATIVE_OWNER | IDENTITY | STATUS/PHASE | TIMESTAMPS | RELATIONSHIP_FIELDS | HISTORY_AVAILABLE | CONSUMERS |
|---|---|---|---|---|---|---|---|
| `read_request` | in-memory `readRequests` Map (`server.gate5.mjs`) | `id` (requestId) | `status` (derived: expiry overrides stored value) | `createdAt`, `expiresAt`, `occurredAt` | **none** | no — 15-min TTL, then cleanup-retention entry with id + expiry only | none found |
| `gate9_registry` | `gate9-current-decision.json` | `id` = `decisionId` (current only) | hardcoded `"current_owner"` — **not** the real lifecycle phase | `occurredAt` = `activatedAt` | `decisionId` (redundant with `id`) | **no — current-only by the registry's own single-slot design** | none found |
| `gate9_execution` | `executions/*.json` | `id` = `executionId` | `status` (raw QUEUED/RUNNING/SUCCEEDED/FAILED) + `phase` (derived via `executionStatusToPhase`, imported from `gate9-lifecycle.mjs`) | `createdAt`, `startedAt`, `finishedAt`, `occurredAt` | **`decisionId` — present and correct** | yes, in principle — one file per execution, never overwritten | none found |
| `gate9_reconciliation` | `reconciliations/*.json` | `id` = `decisionId` | `status`, `closureType`, `approvalStatus` | `occurredAt` = `reconciledAt` | `decisionId` | one file per reconciled decision | none found |

This still matches the shape found in the original investigation, confirmed
by direct re-read rather than assumed unchanged.

### New finding, not previously surfaced — Verified

There is a **second, richer, already-live canonical endpoint**:
`GET /v1/tha/current-decision` (`server.gate9.mjs:650-745`). It already
computes and returns, for the current decision:

```json
{
  "phase": "succeeded",
  "currentDecisionOwner": { "decisionId", "decisionArtifact", "evidenceReceipt" },
  "decision": { "decisionId", "scope", "nonGoals", "risk",
                "approvalStatus", "requiredApprovalPhrase", "boundTo" },
  "readiness": { "readyForApproval", "executable", "alreadyExecuted",
                 "reconciled", "blockers" },
  "safety": { "implementationAuthorised" }
}
```

`phase` is computed by `gate9-lifecycle.mjs::computeLifecyclePhase()` — a
**pure, dependency-free, side-effect-free function** (its own file header:
"safe to import in isolation... without triggering any of server.gate9.mjs's
real side effects") — which already produces exactly the vocabulary an
Activity Monitor needs: `reconciled`, `succeeded`, `executing`, `failed`,
`unknown`, `pending_approval`, `invalid`, `approved_awaiting_execution`. It
already calls `selectLatestExecutionForDecision(decisionId, executionRecords)`
internally to correlate decision → execution, picking the most recent by
timestamp.

**`server.gate5.mjs`'s `buildActivityProjection()` does not import or use
either function.** Its `gate9_registry` record independently re-derives a
much poorer signal (`status: 'current_owner'`, a hardcoded string) from the
raw registry file, duplicating none of this already-computed richness.

Live-queried this turn against the real Follow-up 2 decision
(`tha-dec-bd7801734f6a4dd4adbad801315434bd`):

```json
{
  "phase": "succeeded",
  "readiness": { "readyForApproval": false, "executable": false,
                 "alreadyExecuted": true, "reconciled": false,
                 "blockers": ["scope_changed:server.gate5.mjs",
                              "scope_changed:gate8-last-execution.json"] },
  "decision": { "approvalStatus": "APPROVED",
                "requiredApprovalPhrase": "APPROVE tha-dec-bd7801734f6a4dd4adbad801315434bd" }
}
```

---

## STEP 2 — Trace one real canonical work item

Decision `tha-dec-bd7801734f6a4dd4adbad801315434bd`, execution
`tha-exec-1787759736556-8829ffe7` (the real Follow-up 2 work, re-verified
live this turn):

| Transition | SOURCE_ID | TARGET_ID | LINK_FIELD | OWNER_OF_LINK | VERIFIED_LINK |
|---|---|---|---|---|---|
| request → preparation → decision | *(none exists)* | `tha-dec-bd7801734f6a4dd4adbad801315434bd` | — | — | **CANONICAL LINK: ABSENT** — this decision, like every decision minted this session, was authored directly by a `prepare-*-decision.mjs` script calling `createAndBindDecision()`. No Gate 5 `read_request` was ever created for it. |
| decision → approval | `tha-dec-bd7801734f6a4dd4adbad801315434bd` | (same decision, `approval.status`) | `decision.approval.status` (in-place field on the same artifact) + one-shot transition record in the receipt (`approvalTransition`: before/after sha256, phrase, `approvedAt` timestamp — verified: `gate63-...-receipt.json`) | decision-factory.mjs / `approve-cookbook-candidate-decision.mjs` | yes |
| decision → execution | `tha-dec-bd7801734f6a4dd4adbad801315434bd` | `tha-exec-1787759736556-8829ffe7` | `decisionId` field on the execution record | `server.gate9.mjs` (mints), `gate9-execution-runner.mjs` (writes) | yes — confirmed live: `executions/tha-exec-1787759736556-8829ffe7.json` → `decisionId: "tha-dec-bd7801734f6a4dd4adbad801315434bd"` |
| execution → result | `tha-exec-1787759736556-8829ffe7` | terminal `status: "SUCCEEDED"`, `result: "GATE8_IMPLEMENTATION_PASS"` | same record, in place | `gate9-execution-runner.mjs` | yes |

**This trace also demonstrates the request→decision gap is not specific to
my session's decisions** — a full historical sweep (below, Step 4) confirms
it across every decision ever created in this repository.

---

## STEP 3 — Approval ownership

- **Persisted:** `decision.approval` on the decision artifact itself
  (`{status, requiredPhrase}`), current-state only. **Verified.**
- **Is approval part of the decision artifact:** yes — same file as scope,
  risk, nonGoals, not a separate store. **Verified.**
- **History:** not a full log, but a genuine one-shot transition record
  exists in the receipt (`approvalTransition`: `originalDecisionSha256`,
  `approvedDecisionSha256`, `approvalPhrase`, `approvedAt`) — enough to know
  *when* approval happened and *what phrase* was used, but not a sequence of
  multiple approval attempts/rejections (the schema has no array for that;
  only one transition can exist per decision, since decisions aren't
  re-approved). **Verified.**
- **Would projecting approval expose secrets:** no. `requiredApprovalPhrase`
  is not a secret — it is a deterministic function of the public
  `decisionId` (`` `APPROVE ${decisionId}` ``, verified in
  `decision-factory.mjs:309` and `approve-cookbook-candidate-decision.mjs:14`)
  that itself is already publicly visible on the decision artifact. Nothing
  about it is derived from a credential or random value. **Verified** — this
  resolves the open question from the earlier investigation.
- **Minimum safe exposure:** `approvalStatus` (`NOT_APPROVED`/`APPROVED`) is
  sufficient for "approval required / awaiting approval / approved" —
  already computed, already exposed today by `/v1/tha/current-decision`,
  simply not yet consumed by the Activity Projection.

---

## STEP 4 — Request → decision correlation

Searched systematically for `requestId`, `sourceRequestId`, `preparationId`,
or any receipt/manifest/provenance field carrying a Gate 5 request
identifier, across: `decision-factory.mjs`'s full schema (`purpose`,
`repository`, `scope`, `nonGoals`, `risk`, `rollbackGate`, `evidence`,
`governance`, `verificationGates`, `scopeFileInstructions`, `safety`,
`decisionId`, `createdAt`, `approval` — no such field exists),
`gate8-repair-loop.mjs`, `server.gate9.mjs`. Zero matches.

**Exhaustively re-checked against every decision artifact ever created in
this repository** (`grep -lE 'tha-read-[0-9a-f]{10,}' gate7-*.json` — the
real requestId pattern, e.g. `tha-read-668ff635ed8cb5ac1eda8f12946aa920ca34`,
not the false-positive feature-name matches like
`tha-read-capabilities-decision-factory`): **zero of 68 decision artifacts
reference an actual Gate 5 requestId.**

`readRequests` (the Gate 5 in-memory request/investigate/search objects)
carry no field referencing any decision at all (`server.gate5.mjs:1601-1663`,
re-read this turn).

**CANONICAL LINK: ABSENT.** No invented linkage follows. Every decision
observed in this repository's history — including every decision created in
this session — was authored directly (by a human or agent running a
`prepare-*-decision.mjs` script or `tha-cli.mjs`), never derived from a
completed Gate 5 request. These are two structurally disjoint systems: Gate
5's ephemeral (15-minute TTL), in-memory investigate/search/prepare-task
mechanism, and the decision-factory/Gate 7/8/9 governed-implementation
pipeline. **If this relationship is ever wanted, the owner that would need
extending is `decision-factory.mjs::createAndBindDecision()`** (add an
optional `sourceRequestId` parameter, threaded into `decisionMaterial`) —
that is a distinct, later, architecture-level decision, not something this
investigation invents or this bounded repair should attempt.

---

## STEP 5 — Decision → execution correlation

```
DECISION_OWNER:  decision-factory.mjs / approve-cookbook-candidate-decision.mjs
                (the gate7-*.json artifact)
EXECUTION_OWNER: server.gate9.mjs (mints executionId) +
                gate9-execution-runner.mjs (writes lifecycle state)
LINK_OWNER:      server.gate9.mjs — writes decisionId into the execution
                record at creation time (verified:
                `POST /v1/tha/execute-decision` route, `decisionId: d.decisionId`
                in the initial QUEUED write)
LINK_FIELD:      decisionId (present on every execution record)
CARDINALITY:     one-to-many, by design — not merely possible but explicitly
                coded for: `selectLatestExecutionForDecision()`
                (`gate9-lifecycle.mjs:35-57`) iterates ALL execution records
                matching a decisionId and returns the most recent by
                timestamp. Confirmed further: the re-execution guard
                (`alreadyExecuted`) is keyed to the single-slot
                `gate8-last-execution.json` file (`previous.decisionId ===
                decision.decisionId`), not to a scan of `executions/` for
                that decisionId — so it is a soft guard against *routine*
                accidental re-execution via the normal HTTP path, not a hard
                structural 1:1 guarantee at the ledger-storage level. The
                Activity Projection must not assume exactly one execution
                per decision.
HISTORY:         yes, at the storage level — each execution is its own
                never-overwritten file in `executions/`. Not yet true at the
                projection level: `buildActivityProjection()` already
                returns every execution record found (it does not collapse
                them), so history is *already preserved* in the current
                Activity Projection's raw record list — it is
                `/v1/tha/current-decision` (a different endpoint) that
                deliberately collapses to "latest," for a different purpose
                (current operational status, not history).
```

---

## STEP 6 — Terminal result vocabulary

Read directly from `gate9-execution-runner.mjs` and `gate9-lifecycle.mjs`
(the sole two owners) — not invented from product language:

| CANONICAL_VALUE | OWNER | MEANING | TERMINAL |
|---|---|---|---|
| `QUEUED` | `server.gate9.mjs` (initial write) | executionId minted, runner not yet spawned/started | no |
| `RUNNING` | `gate9-execution-runner.mjs` | runner has spawned Gate 8 as a child, awaiting its exit | no |
| `SUCCEEDED` | `gate9-execution-runner.mjs` | child stdout contained the literal string `GATE8_IMPLEMENTATION_PASS` | **yes** |
| `FAILED` | `gate9-execution-runner.mjs` | child exited without that string, or threw (caught in the runner's own try/catch) | **yes** |

Derived phase vocabulary (`gate9-lifecycle.mjs::executionStatusToPhase` +
`computeLifecyclePhase`, both pure functions, no invention): `executing`
(QUEUED|RUNNING), `succeeded`, `failed`, `unknown` (any unrecognised status
value — never thrown), plus, at the whole-decision level:
`pending_approval`, `invalid`, `approved_awaiting_execution`, `reconciled`.

**There is no `Complete`, `Blocked`, or `Crashed` value anywhere in the
canonical vocabulary** — those are product-language assumptions this
investigation does not adopt. `Blocked`-like meaning is only representable
today as `invalid` with a non-empty `blockers` array (a list of specific
string reasons, e.g. `scope_changed:server.gate5.mjs`), not a dedicated
phase.

**Worker crash before ledger update, now that execution goes through Gate
9:** the runner's own `try/catch` (`gate9-execution-runner.mjs:58-110`)
wraps the entire child-process spawn+wait; any crash, timeout, or thrown
error there is caught and written as `status: 'FAILED'` with the error
message. So a crash *inside the runner's own process* is now captured
(unlike the raw-CLI path, which previously had no wrapper at all for the
two historical direct executions). A crash of the **runner process itself**
(e.g. `node` killed externally, machine restart) between writing `RUNNING`
and writing a terminal state would leave the record permanently stuck at
`RUNNING` — the phase vocabulary has no distinct "stalled" or "orphaned"
value for that; it would continue reading as `executing` forever. **This is
an honest unknown, correctly left unresolved rather than invented** — no
code path distinguishes "genuinely still running" from "orphaned mid-flight
after a process kill."

---

## STEP 7 — History

No canonical decision-history owner exists. Verified by direct search: no
`decision-history`/`decision-index`/`decisions-log`/`decision-registry`-named
file anywhere in the bridge repo; nothing in `server.gate9.mjs` or
`decision-factory.mjs` enumerates or globs `gate7-*.json` as a canonical
set. `gate9-current-decision.json` is explicitly single-slot by its own
schema (`decisionId`, `decisionArtifact`, `decisionSha256`, `evidenceReceipt`,
`receiptSha256`, `activatedAt` — one of each, no array) — intentionally
current-only, not a history owner and must not be treated as one.

Individual `gate7-*.json` files **do** physically persist on disk
indefinitely (68 exist today, none deleted) — but this is incidental file
retention, not a declared, documented, or consumed history contract. A
projection built by globbing that directory would be reaching past every
existing canonical owner into raw filesystem state that mixes decision
artifacts with dozens of unrelated manifests, receipts, and rollback
packages in the same directory, with no schema guarantee that every
`gate7-*.json` there is even well-formed or still relevant.

**STOP, per instruction: no canonical history owner exists.** The Activity
Monitor's "recent governed work" need (beyond the single current decision)
has no existing owner to project from today. Providing it would require a
new, explicitly-designed history mechanism — out of bounds for a projection
task, which must consume existing owners, not become one.

---

## STEP 8 — Minimum connected projection

From only what is canonically owned and verified above:

| FIELD | AUTHORITATIVE_OWNER | SOURCE_FIELD | DIRECT/DERIVED | REQUIRED/OPTIONAL | NULL/ABSENT BEHAVIOUR |
|---|---|---|---|---|---|
| `decisionId` | `gate9-current-decision.json` | `decisionId` | Direct | Required | current-only; absent entirely if registry missing/malformed (existing behaviour, unchanged) |
| `decisionPhase` | `gate9-lifecycle.mjs::computeLifecyclePhase()` | computed from `decisionState` + `latestExecutionForDecision` | **Derived, reusing the existing pure function already live in `/v1/tha/current-decision`** | Required | never throws — always returns one of the 8 known phase strings |
| `approvalStatus` | decision artifact | `approval.status` | Direct | Required | `NOT_APPROVED`/`APPROVED` only, per existing schema |
| `blockers` | `loadDecisionState()` (`server.gate9.mjs`) | `problems` array | Direct | Optional | empty array if none |
| `executions[]` | `executions/*.json` | full record list filtered by `decisionId` | Direct (already how `buildActivityProjection` reads this directory today — no change to this part) | Optional (empty if none yet) | preserves full history per decision, does not collapse to "latest" (that collapsing is `/v1/tha/current-decision`'s job, not the projection's) |
| `reconciliation` | `reconciliations/*.json` | record for this `decisionId`, if any | Direct | Optional | absent if none (mutually exclusive with execution, by design, already established) |
| `requestLink` | **none — no owner exists** | — | — | **Always absent** | must be reported as absent, never inferred from timestamps/ordering/naming |
| `history` (other decisions) | **none — no owner exists** | — | — | **Not includable** | out of scope entirely until a history owner is created |

Shape actually supported by canonical ownership — **not** forced into the
generic template offered in the prompt, since request/preparation and
multi-decision history are genuinely absent:

```
work item (= one decision)
├ decision            (gate9-current-decision.json + decision artifact — current only)
│  └ approval          (decision.approval — in place, one-shot transition history)
└ execution(s)         (executions/*.json, filtered by decisionId — real 1:N, real history)
   └ terminal result   (status/result fields, already vocabularied above)
```

`request/preparation` is not a branch of this tree today because no
canonical link makes it one.

---

## AI / Platform compliance

- No additional assistant, no duplicate conversation state: this
  investigation and its recommendation touch only existing bridge-repo
  read paths (`server.gate5.mjs`, importing `gate9-lifecycle.mjs`) — no new
  service, process, or state store.
- No duplicate workflow: the recommendation is to **import and reuse**
  `gate9-lifecycle.mjs`'s existing pure functions, the same ones
  `server.gate9.mjs` already calls — not to reimplement phase logic a second
  time.
- Existing governed pipeline reused, existing permission/security model
  preserved: `GET /v1/tha/activity` keeps its existing bearer-auth
  requirement; nothing proposed changes authorisation.
- Activity Projection remains read-only: confirmed again this turn —
  `buildActivityProjection()` and every function it calls
  (`readJsonFileIfPresent`, `readJsonDirIfPresent`, `readRequestActivityRecords`)
  perform reads only; `safety.mutatesReadRequestState`/`mutatesGate9State`
  remain `false`.
- No business behaviour consumes Activity state: `buildActivityProjection()`
  is called from exactly one route handler; nothing downstream reads its
  output to make a decision.

## Architecture compliance

```
CANONICAL IDENTITY SINGULAR:   yes — decisionId, executionId, requestId each
                              remain minted by exactly one owner; the
                              recommendation invents no new identity.
OWNERSHIP SINGULAR:            yes — every proposed field traces to exactly
                              one pre-existing owner (table above); phase
                              computation has exactly one implementation
                              (gate9-lifecycle.mjs), about to gain a second
                              CONSUMER, not a second implementation.
NO DUPLICATED STATE:           yes — no field is cached, copied, or
                              persisted a second time; every read is live,
                              same as today.
NO DUPLICATED WORKFLOW:        yes — reusing computeLifecyclePhase() /
                              selectLatestExecutionForDecision() is the
                              opposite of duplication: it is the fix for an
                              existing, unnoticed duplication risk (the
                              Activity Projection's gate9_registry record
                              currently re-derives a weaker signal
                              independently instead of reusing the real one).
EXISTING ARCHITECTURE EXTENDED: yes — server.gate5.mjs would gain one new
                              import from gate9-lifecycle.mjs (already
                              explicitly designed to be dependency-free and
                              side-effect-free for exactly this kind of
                              reuse) and use its output inside the existing
                              gate9_registry record construction; no new
                              file, no new module boundary.
```

---

## ADMINISTRATION ARCHITECTURE GAP

`ADMIN_SOURCE_REGISTRATION_REQUIRED: yes` (carried forward, re-verified, not
re-decided). Evidence: `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` §13 still names
exactly three Administration sources; the bridge governed-pipeline
projection is a fourth, still undeclared, unchanged since the original
investigation. This investigation does not amend that document, per
instruction.

---

## REQUIRED OUTPUT

```
CONNECTED ACTIVITY LIFECYCLE PROJECTION INVESTIGATION

CURRENT_ACTIVITY_CONTRACT: { ok, mode, timestamp, recordCount, truncated,
  records[] (read_request | gate9_registry | gate9_execution |
  gate9_reconciliation, independent/unlinked), safety } — confirmed
  unchanged by direct re-read.

CANONICAL_OWNERS:
* request:          in-memory readRequests (server.gate5.mjs) — ephemeral,
                    15-min TTL, structurally disjoint from decisions
* preparation:       same (status field on the request)
* decision:          gate9-current-decision.json + decision artifact
                    (current only)
* approval:          decision.approval (in place; one-shot transition
                    record in the receipt)
* execution:         executions/*.json, minted+written by server.gate9.mjs
                    + gate9-execution-runner.mjs
* terminal result:   status/result fields on the execution record
* history:           NO OWNER EXISTS (Step 7 STOP)

CANONICAL_LINKS:
* request → decision:   ABSENT (verified across all 68 historical decisions)
* decision → approval:  PRESENT (decision.approval + receipt transition record)
* decision → execution: PRESENT (decisionId field, 1:N, already correctly
                        modelled by gate9-lifecycle.mjs)
* execution → result:   PRESENT (status/result on the same record)

MISSING_CANONICAL_LINKS: request → decision (no owner to extend without a
  new, later, architecture-level decision to decision-factory.mjs itself)

CURRENT_TERMINAL_VOCABULARY: QUEUED, RUNNING (non-terminal) → SUCCEEDED,
  FAILED (terminal); derived phases: executing, succeeded, failed, unknown,
  pending_approval, invalid, approved_awaiting_execution, reconciled. No
  Complete/Blocked/Crashed values exist canonically.

HISTORY_OWNER: none (Step 7 STOP)

MINIMUM_CONNECTED_PROJECTION: decision (+ phase, approvalStatus, blockers,
  all reused from gate9-lifecycle.mjs) → execution(s) (already correctly
  1:N) → terminal result. request/preparation and multi-decision history
  excluded — no owner exists for either.

DUPLICATED_STATE: no
DUPLICATED_WORKFLOW: no — recommendation removes an existing near-duplication
  risk rather than adding one

ADMIN_SOURCE_REGISTRATION_REQUIRED: yes (unchanged, carried forward)

OPTIONS:
A: Project only what already exists canonically — import
   gate9-lifecycle.mjs's computeLifecyclePhase()/selectLatestExecutionForDecision()
   into buildActivityProjection()'s gate9_registry record construction,
   adding phase/approvalStatus/blockers fields sourced from data that is
   already computed and already live at /v1/tha/current-decision. Leave
   read_request records exactly as unlinked as today; do not add history.
B: Extend the authoritative lifecycle creation owner (decision-factory.mjs)
   with a new optional sourceRequestId field, threaded from a Gate 5 request
   at decision-creation time, to close the request→decision gap — a larger,
   separate, later architecture decision, not bundled with A.
C: Reconstruct request→decision or historical relationships heuristically
   inside the Activity Projection (timestamp proximity, naming similarity).
   REJECTED — creates non-authoritative inferred state; no governing
   document permits it; explicitly prohibited by this investigation's own
   instructions.

RECOMMENDED_OPTION: A now; B only as a distinct, later, separately-approved
  decision if request→decision correlation is actually wanted (it is a real
  architecture change to decision-factory.mjs's schema, not a projection
  concern)

RISK: RED

DECISION_REQUIRED: yes — for Option A only (reusing existing computed data
  inside the existing Activity Projection function). Not preparing Option B
  in this same decision; not preparing anything for history or
  request-correlation, since both hit verified STOPs above.
```

**Bounded decision (Option A) — described, NOT minted, per instruction:**

```
DECISION_ID:            not yet minted
WHAT_IT_CONTROLS:        server.gate5.mjs's buildActivityProjection() /
                        gate9RegistryActivityRecords() — import
                        computeLifecyclePhase and
                        selectLatestExecutionForDecision from
                        gate9-lifecycle.mjs (already colocated in the same
                        bridge repo) and add phase, approvalStatus, and
                        blockers fields to the gate9_registry record,
                        replacing the current hardcoded
                        status: "current_owner" string with the real
                        computed phase
FILES_IN_SCOPE:          server.gate5.mjs only (gate9-lifecycle.mjs is
                        consumed, not modified)
CANONICAL_OWNERS_AFFECTED: none newly created; gate9-lifecycle.mjs gains a
                        second consumer of an already-exported, already-pure
                        function
CONSUMERS:               GET /v1/tha/activity (the only caller of
                        buildActivityProjection); GET /v1/tha/current-decision
                        continues unaffected (same function, different
                        caller)
DATA_IMPACT:             reads existing: gate9-current-decision.json,
                        executions/*.json (both already read today);
                        writes new: none; changes meaning: gate9_registry's
                        status field changes from a hardcoded constant to a
                        real computed phase (a strict improvement, not a
                        breaking change to any known consumer — none found);
                        backfill required: no
RELEASE_TIMING:          no deploy implied
ROLLBACK_PLAN:            standard Gate 8 isolated-worktree baseline/receipt
                        mechanism, same as every prior decision in this chain
VERIFICATION_PLAN:        existing Activity Projection regression coverage
                        (test-gate5-read-capabilities.mjs §§9-16) must
                        continue to pass, extended to assert the new
                        phase/approvalStatus/blockers fields appear and
                        match a live-computed /v1/tha/current-decision call
                        for the same decision
DEPLOYMENT_CHECKLIST:    n/a
REQUIRED_APPROVAL_PHRASE: not applicable — not minted
```

Not approved. Not executed. Not minted, per instruction to prepare options
only.

Persisted at:
`docs/investigations/governance/CONNECTED_ACTIVITY_LIFECYCLE_PROJECTION_INVESTIGATION.md`

## TRUST CHECK

- Highest-risk claim still Inferred or Assumed: none of the ownership/link
  findings are Inferred or Assumed — every claim (request→decision absence,
  decision→execution 1:N design, terminal vocabulary, the
  `/v1/tha/current-decision` discovery, the no-history-owner finding) was
  directly verified this turn by reading source and/or querying the live
  server, including an exhaustive check across all 68 historical decision
  artifacts rather than a sample.
- Evidence required to verify the one remaining soft judgement call: whether
  Option B (request→decision correlation) is actually wanted at all — that
  is a product/governance preference about whether Gate 5's ephemeral
  investigate flow and the decision pipeline should ever be linked, not a
  fact this investigation can resolve further.
