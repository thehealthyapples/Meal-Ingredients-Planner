# Bridge Activity Projection — Live State Verification

**Date:** 2026-08-26
**Scope:** Investigation only (read-only verification of live governed state, plus independent execution of the existing regression test). No code, route, UI, or decision was created or modified by this task.
**Status:** STOPPED after investigation, as instructed. No `/admin/activity` design or implementation performed.

## Executive summary

**[Verified]** The Bridge Activity Projection (`GET /v1/tha/activity` in `server.gate5.mjs`, bridge repo `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge`) is now implemented and applied to the live tracked tree, under decision `tha-dec-a3dace1dbb1605d91474cada3f54385c`, executed successfully by Gate 8 on the first attempt (10:17–10:24 UTC) with independent Hermes review returning `VERDICT: PASS`.

**[Verified]** Re-running the decision's own regression test (`node test-gate5-read-capabilities.mjs`) independently, twice, reproduces an `AssertionError` at line 374 (`429 !== 200`) on an unrelated pre-existing compatibility assertion (`POST /v1/tha/search`), caused by the new activity-projection test additions consuming enough of the pre-existing shared `GENERAL_RATE_LIMIT = 20`-per-60s bucket (which `GET /v1/tha/activity` shares with `search`/`file-range`/`diff`/`investigate`) that the final compatibility call in the same run gets rate-limited. This contradicts the "Deterministic verification: PASS" recorded in `gate8-last-execution.json` for this same test file — see Step 2/6 below.

**[Verified]** The real, implemented contract projects four record kinds (`read_request`, `gate9_registry`, `gate9_execution`, `gate9_reconciliation`) as independent, unlinked lists — it does **not** establish request→decision→execution→reconciliation relationships, does **not** expose approval status, worker identity, or fallback occurrence, and has no distinct phase for a crashed run (one was directly observed earlier this session; it leaves no execution record at all). See Step 3/4.

**[Verified]** `docs/architecture/` (the application's governing architecture) contains no owner for this pipeline at all — Gate 5/7/8/9 exist solely in `PROJECT_GOVERNANCE.md`. This is a genuinely fourth Administration source, alongside `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` § 13's three named ones. **[Inferred]** This is very likely intentional (Administration is declared "pure consumer" and this is a consumer view of an external system), but no document states it, so an architecture-owner decision is still open. See Step 5/7.

---

## STEP 1 — Live governed state

Read directly from the bridge repo, not from any earlier conversation report.

| Field | Value | Tag |
|---|---|---|
| DECISION_ID | `tha-dec-a3dace1dbb1605d91474cada3f54385c` | Verified — `gate9-current-decision.json` |
| PHASE | Executed (Gate 8 ran and succeeded) | Verified — `gate8-last-execution.json`, `executions/tha-exec-1787739457240-381b1f9f.json` |
| APPROVAL | `APPROVED` | Verified — decision artifact `gate7-...-20260826-095903.json` |
| IMPLEMENTATION_AUTHORISED | `true` (as frozen at decision creation) | Verified |
| EXECUTABLE | `false` in the frozen decision snapshot — this field is a creation-time snapshot, not live status; Gate 8 re-verifies independently at run time | Verified (field value) / Inferred (its meaning, from observing Gate 8's own behaviour succeed against a decision carrying this same static value earlier today) |
| BLOCKERS | None remaining for implementation. One reproducible test failure remains (see Step 2/6) | Verified |
| REPOSITORY | `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge` | Verified |
| BRANCH | `main`, HEAD `aae2ea30e34aa92c1a24ecccd40820160d4576c6` | Verified |
| FROZEN_FILES | `server.gate5.mjs`, `test-gate5-read-capabilities.mjs` | Verified |
| ROLLBACK/RECEIPT | `rollback-bridge-activity-projection-implement-one-bounded-20260826-095903` (status `COMPLETE`); receipt `gate63-...-095903-receipt.json` | Verified |
| GATE_8_STATUS | Succeeded, attempt 1 of 3, no repair loop needed this run | Verified — `gate8-last-execution.json` |
| GATE_9/RECONCILIATION_STATUS | Not applicable — see Step 6 | Verified |

Three prior decisions for this same feature existed earlier in today's session (`tha-dec-b6c2719f...` — crashed on attempt 3 of a repair loop; `tha-dec-2fb2dd6e...` — a re-frozen, never-approved snapshot created by that crash's own repair-loop lifecycle). Neither is current; both are superseded by `tha-dec-a3dace1dbb1605d91474cada3f54385c`, which is the one actually executed. **[Verified]** the earlier crash left the tracked scope files byte-identical to baseline — nothing from the failed attempts landed in the tree.

---

## STEP 2 — Implementation verification

| Check | Result | Tag |
|---|---|---|
| ACTIVITY_ROUTE_PRESENT | yes — `server.gate5.mjs:1821` (`GET /v1/tha/activity`) | Verified |
| IMPLEMENTATION_MATCHES_APPROVED_DECISION | yes — scope limited to the two approved files, matches `applied` hashes in `gate8-last-execution.json` exactly against live file hashes | Verified |
| TEST_COVERAGE_PRESENT | yes — activity-specific assertions exist in `test-gate5-read-capabilities.mjs` §§9–16 | Verified |
| EXECUTION_ALREADY_OCCURRED | yes | Verified |

**New finding, not in the recorded execution evidence:** running `node test-gate5-read-capabilities.mjs` directly, twice (5 seconds apart, each a fresh process/port), **reproduces a failure both times**, at the identical line, in the identical (pre-existing, unrelated) compatibility section:

```
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
429 !== 200
    at test-gate5-read-capabilities.mjs:374:8
```

Root cause, traced in `server.gate5.mjs`: every request (except `GET /v1/tha/requests/:id`, which uses a separate `poll` bucket at 60/min) shares one `general` rate bucket capped at `GENERAL_RATE_LIMIT = 20` per `RATE_WINDOW_MS = 60_000`ms (`server.gate5.mjs:82–84,151,1789–1794`). `GET /v1/tha/activity` was **not** given its own bucket. The new test additions (§§9–15) make roughly 9 extra `general`-bucket calls to `/v1/tha/activity` within the same sub-two-second test run that already makes ~9 `general`-bucket calls to `search`/`file-range`/`diff`/`investigate`. That pushes the run's cumulative `general`-bucket count past 20 before the pre-existing compatibility check (§16, line 370) runs, so it gets a `429` that it would not have gotten before this feature's test additions existed. **[Verified]** — reproduced twice, identical failure point both times, root cause confirmed by direct code reading (not conjectured from the stack trace alone).

This **contradicts** the "Deterministic verification: PASS" recorded for this same file in `gate8-last-execution.json` (10:24:39). **[Inferred]** the discrepancy is most plausibly either (a) Gate 8's isolated verification step does not run this exact test file to completion the same way `node test-gate5-read-capabilities.mjs` does, or (b) a timing/ordering difference inside the isolated worktree avoided tripping the same window. I did not have access to Gate 8's own internal verification harness output beyond what `gate8-last-execution.json` records, so I cannot resolve which. **This is the highest-risk unresolved claim in this report — see Trust Check.**

---

## STEP 3 — Real response contract (verified by direct code read of `server.gate5.mjs:1385–1580`, cross-checked against the passing portions of the live test run)

`GET /v1/tha/activity` — `Authorization: Bearer <token>` required (401 otherwise) — returns:

```json
{
  "ok": true,
  "mode": "THA_BRIDGE_ACTIVITY_PROJECTION_V1",
  "timestamp": "<ISO>",
  "recordCount": 0,
  "truncated": false,
  "records": [ /* up to ACTIVITY_RECORD_LIMIT = 100, newest-first by occurredAt, then kind, then id */ ],
  "safety": {
    "mutatesReadRequestState": false,
    "mutatesGate9State": false,
    "derivedFromAuthoritativeTimestampsOnly": true
  }
}
```

Four independent, **unlinked** record shapes populate `records`:

| FIELD | MEANING | AUTHORITATIVE OWNER | SOURCE | DERIVED/DIRECT | NULL/ABSENT BEHAVIOUR | CONSUMERS FOUND |
|---|---|---|---|---|---|---|
| `kind: "read_request"` | one Gate 5 read/investigate request | in-memory `readRequests` map | `server.gate5.mjs` runtime state | Direct | n/a | none (unimplemented consumer) |
| `.status` (read_request) | `pending`\|`complete`\|`failed`\|`expired` | same | `activityStatusForReadRequest(request, now)` | **Derived** — expiry overrides stored status | if expired, always `expired` regardless of stored status | none |
| `.reason` (read_request) | failure reason, only when `status==='failed'` | same | request's own `.error` | Direct | absent (key omitted) when not failed | none |
| `kind: "gate9_registry"` | the **current** decision only — no history | `gate9-current-decision.json` | file read | Direct | absent entirely if registry file missing/malformed | none |
| `.status` (gate9_registry) | always literally `"current_owner"` | — | hard-coded string | Direct | n/a — **does not expose the decision's actual approval/phase/executable state** | none |
| `kind: "gate9_execution"` | one Gate 8 execution attempt | `executions/*.json` | directory read | Direct | a crashed run that never wrote its execution file produces **no record at all** (verified — the crash I observed earlier this session left no file in `executions/`) | none |
| `.phase` (gate9_execution) | `executing`\|`succeeded`\|`failed`\|`unknown` | `gate9-lifecycle.mjs::executionStatusToPhase` (pre-existing, reused — not reimplemented) | maps raw `status` (`QUEUED`/`RUNNING`→executing, `SUCCEEDED`→succeeded, `FAILED`→failed, anything else→unknown) | Derived | unrecognised/missing status → `unknown`, never thrown | none |
| `kind: "gate9_reconciliation"` | one closed reconciliation | `reconciliations/*.json` | directory read | Direct | none exist for a decision that went through Gate 8 execution (see Step 6 — mutually exclusive by design) | none |

**Explicitly redacted, confirmed never present on any record** (`test-gate5-read-capabilities.mjs:305–309`): `stdout, stderr, content, result, analysis, proposedPatch, files, file, token, authorization, decisionArtifact, evidenceReceipt, verifiedScopeHashes, verification, scope, raw, response`.

**Concepts the endpoint does NOT expose — confirmed absent, not inferred as missing:**
- No field links a `read_request.id` to a `decisionId` — a request and the decision it eventually produced cannot be joined through this projection.
- No approval status (`APPROVED`/`NOT_APPROVED`) anywhere.
- No worker identity (`claude`/`codex`) anywhere — this lives only in `gate8-last-execution.json`'s `attempts[]` and in `stdout`, both outside the projection and the latter explicitly redacted.
- No fallback-occurred flag anywhere.
- No distinct "blocked" or "crashed" phase — `executionStatusToPhase` has exactly four outputs (`executing`/`succeeded`/`failed`/`unknown`), and a crash before the execution ledger write (observed directly, earlier this session) produces **zero record**, indistinguishable in the projection from "not yet started."
- Only the **current** decision is visible via `gate9_registry` — the two decisions superseded earlier today (`tha-dec-b6c2719f...`, `tha-dec-2fb2dd6e...`) do not and will never appear.

---

## STEP 4 — One real lifecycle, exercised live (test run §11, `test-gate5-read-capabilities.mjs:245–271`, independently re-executed this task)

| # | Question | Answer through the projection | Tag |
|---|---|---|---|
| 1 | What was requested? | Yes — `id` + `requestType` (e.g. `"investigate"`) | Verified |
| 2 | Has preparation/read completed? | Yes, for the read request itself, via `.status` | Verified |
| 3 | What decision belongs to it? | **No** — no linking field exists | Verified absence |
| 4 | Is approval required? | **No** — not exposed | Verified absence |
| 5 | Has approval been recorded? | **No** — not exposed | Verified absence |
| 6 | Is execution underway? | Only for executions that reached the point of writing an `executions/*.json` record; a crash before that point is invisible | Verified |
| 7 | Which worker executed it? | **No** — not in the projected shape | Verified absence |
| 8 | Did fallback occur? | **No** — not in the projected shape | Verified absence |
| 9 | Complete / fail / crash / block? | Complete and fail are covered (`phase`); crash and block have no representation — a crash is silent absence | Verified |
| 10 | Has reconciliation completed? | Not applicable for an executed decision — see Step 6 | Verified |

No state was inferred to fill these gaps; absence is reported as absence, per instruction.

---

## STEP 5 — Architecture compliance

- **CANONICAL IDENTITY SINGULAR:** yes — `decisionId`/`executionId`/`requestId` each remain the one identifier minted by their owning system; the projection invents none.
- **OWNERSHIP SINGULAR:** yes — every field traces to exactly one of the four pre-existing owners in the table above; none is duplicated.
- **DUPLICATED STATE:** no — `buildActivityProjection()` (`server.gate5.mjs:1544`) reads and re-shapes on every call; nothing is cached or persisted.
- **DUPLICATED WORKFLOW:** no — `phase` derivation reuses the pre-existing `gate9-lifecycle.mjs::executionStatusToPhase` rather than reimplementing it (confirmed by import at `server.gate5.mjs:12`).
- **EXISTING ARCHITECTURE EXTENDED:** yes — three pre-existing on-disk owners (`gate9-current-decision.json`, `executions/`, `reconciliations/`) plus one pre-existing in-memory owner (`readRequests`), read-only.

The projection remains a consumer, not an owner, of every fact it shows — confirmed by direct code read, not by the decision's own self-description alone.

---

## STEP 6 — Reconciliation

**[Verified]** Reconciliation and execution are mutually exclusive by construction, not merely by convention. `complete-reconciliation-decision.mjs::noExecutionFor(decisionId)` (lines 44–49) **throws and refuses** if any file in `executions/` already names that `decisionId`. Since `executions/tha-exec-1787739457240-381b1f9f.json` names `tha-dec-a3dace1dbb1605d91474cada3f54385c`, reconciliation is not merely "not yet run" for this decision — it is **architecturally inapplicable** and would be refused if attempted. The only pre-existing reconciliation record in the repo (`reconciliations/tha-dec-b81ce3057a76044d4bd9dd5c491f397e.json`) belongs to an unrelated, older decision.

```
IMPLEMENTATION: complete
TESTS: FAIL on independent re-run (unrelated pre-existing rate-limit interaction — see Step 2). PASS as recorded by Gate 8's own verification at execution time; that record and my independent re-run disagree, and I could not resolve why within this task's read-only scope.
RECONCILIATION: not applicable (mutually exclusive with execution, by design, confirmed in code)
CONTRACT VERIFIED: yes, from direct code and one live-exercised lifecycle — with the boundaries in Step 3/4 explicitly named as absent rather than assumed present
```

---

## STEP 7 — App handoff readiness

**Not all four gating conditions hold cleanly** (implementation complete: yes; tests pass: **contested — see above**; reconciliation: not applicable/moot rather than "complete"; contract verified: yes). Given the instruction to gate the handoff on all four, and given a reproducible test failure exists that I could not resolve read-only, I am treating **APP CONSUMER READY TO GOVERN: NO** pending your decision on how to treat the rate-limit finding — even though the route itself works and its contract is now known precisely.

**Architecture gap named, not silently resolved:** `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` § 13 names exactly three Administration sources (`access.ts`, `admin_audit_log`, Domain 32/OBS1). A bridge pipeline-lifecycle projection is a genuine fourth. **[Inferred, not decided]** this is very likely compatible with Administration's existing "Owns: nothing, pure consumer" framing (§ 13 already says Administration owns no domain of its own — a consumer view of one more external, read-only source is consistent with that framing in spirit), but no governing document states this, and I am not authorised to decide it silently. **ARCHITECTURE DECISION REQUIRED: yes** — a short amendment or ratification naming this fourth source explicitly, or an explicit ruling that no amendment is needed, before `/admin/activity` is designed against it.

If you resolve the test-failure question and the architecture-source question, the smallest next governed decision would be scoped to exactly the real, verified contract in Step 3 (not the seven-stage concept from earlier in this conversation, which the implementation only partially realises) — but that scoping is for the next task, not this one.

---

## FINAL OUTPUT

```
ACTIVITY PROJECTION STATUS:
DECISION_ID:            tha-dec-a3dace1dbb1605d91474cada3f54385c
APPROVAL:                APPROVED
EXECUTION:               SUCCEEDED (Gate 8, attempt 1/3, Hermes VERDICT: PASS)
RECONCILIATION:          NOT APPLICABLE (mutually exclusive with execution, by design)
CONTRACT VERIFIED:       YES (direct code read + one live-exercised lifecycle)

ROUTE:                   GET /v1/tha/activity
METHOD:                  GET
AUTH:                    Bearer token, shared with existing Gate 5 routes; 401 if absent/invalid
REAL RESPONSE SHAPE:     { ok, mode, timestamp, recordCount, truncated, records[], safety }
                         records: read_request | gate9_registry (current only) |
                         gate9_execution | gate9_reconciliation — independent, UNLINKED

CANONICAL OWNERS:
* request:                in-memory readRequests (server.gate5.mjs)
* preparation:             same (status field)
* decision:                gate9-current-decision.json (CURRENT ONLY — no history)
* approval:                NOT EXPOSED by this projection
* execution:               executions/*.json, phase via gate9-lifecycle.mjs (pre-existing, reused)
* reconciliation/terminal: reconciliations/*.json — inapplicable for executed decisions

DUPLICATED STATE:         no
DUPLICATED WORKFLOW:      no

OBSERVATION ENGINE INVOLVEMENT:   none — confirmed, disjoint system (docs/architecture/ has no Gate 5/7/8/9 owner at all)
ADMIN_AUDIT_LOG INVOLVEMENT:      none

ARCHITECTURE GAP:                 UI_CANONICAL_EXPERIENCE_OWNERSHIP.md §13 names 3 Administration
                                   sources; this is a verified 4th, undeclared
ARCHITECTURE DECISION REQUIRED:   yes

APP CONSUMER READY TO GOVERN:     NO
```

**Exact remaining blockers:**
1. A reproducible test failure exists on independent re-run of the decision's own regression test (429 rate-limit collision, root cause identified in Step 2) that is unresolved against the "PASS" recorded at execution time — needs your call on whether this is real drift worth a fix-forward decision, or an artifact of how Gate 8's own verification differs from a direct run.
2. `UI_CANONICAL_EXPERIENCE_OWNERSHIP.md` § 13 does not yet name this fourth Administration source — needs an explicit ratification or amendment before `/admin/activity` is designed against it, per the Delegation gate's "STOP and report the conflict" rule.
3. The real contract (Step 3) is materially narrower than the seven-stage concept discussed earlier this session — no linkage between requests and decisions, no approval/worker/fallback fields, no crash/blocked phase. Any future `/admin/activity` spec must be re-scoped against this real shape, not the earlier placeholder one.

## TRUST CHECK

- **Highest-risk claim still Inferred or Assumed:** why my independent test re-run fails (429, reproducible twice) while `gate8-last-execution.json` records the same test file as having passed at execution time. I have a verified root-cause mechanism (shared rate-limit bucket exhaustion) but not a verified explanation for the discrepancy with the recorded PASS.
- **Evidence needed to verify it:** the actual stdout/verification transcript from Gate 8's isolated worktree run for this decision (not just its `pass: true` summary) — to see whether it ran this exact test file to completion, ran a subset, or ran under different timing/env conditions than my direct invocation.

---

**Report location note:** filed at `docs/investigations/governance/BRIDGE_ACTIVITY_PROJECTION_LIVE_STATE_VERIFICATION.md` per `REPOSITORY_CONVENTIONS.md` §4 (investigation, `governance` workstream — this concerns bridge/pipeline governance state, not application Admin UI). Not yet staged or committed — `PROJECT_GOVERNANCE.md` requires explicit user authorization before any commit; `ENGINEERING_WORKFLOW.md` STEP 9 requires a local commit for task completion, so this is pending your go-ahead.
