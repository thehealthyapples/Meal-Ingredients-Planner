# Activity Projection Verification Conflict — Gate 8 PASS vs. Direct 429

**Date:** 2026-08-26
**Scope:** Investigation only. Read-only against the bridge repo
(`C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge`) and this repo's
governance docs. No code, route, test, or decision was created or modified.
No `/admin/activity` work performed. No application proxy created. No
Activity Projection contract enrichment performed.
**Relationship to prior work:** This extends
`docs/investigations/governance/BRIDGE_ACTIVITY_PROJECTION_LIVE_STATE_VERIFICATION.md`
(same session, earlier), which reproduced the 429 twice and named the rate-limit
mechanism as **[Verified]**, but left the Gate 8-vs-direct discrepancy itself as
its single highest-risk **unresolved** item ("why `gate8-last-execution.json`
records PASS while direct re-run fails — I did not have access to Gate 8's own
internal verification harness output"). That gap is now closed, below.

---

## ROOT CAUSE — Verified

`gate8-execute-approved-decision.mjs` only ever executes a scope's own test
file if `buildVerificationPlan()` (`gate8-repair-loop.mjs:170-294`) puts a
command for it into `verificationCommands`. That field is built here
(`gate8-repair-loop.mjs:286-290`):

```js
verificationCommands: kind === 'bridge-orchestration'
  ? BRIDGE_VERIFICATION_COMMANDS
  : kind === 'decision-factory-porcelain-repair'
    ? DECISION_FACTORY_PORCELAIN_REPAIR_VERIFICATION_COMMANDS
    : Object.freeze([]),
```

Decision `tha-dec-a3dace1dbb1605d91474cada3f54385c`'s scope
(`server.gate5.mjs`, `test-gate5-read-capabilities.mjs`) matches
`GATE5_READ_CAPABILITIES_SCOPE` exactly, which resolves `kind` to
`'gate5-read-capabilities'` (`gate8-repair-loop.mjs:225-226`). That kind hits
neither branch above, so `verificationCommands` is the frozen empty array —
**no command is ever run for this scope kind**, not `test-gate5-read-capabilities.mjs`,
not anything else.

The execution loop only populates `tests` by iterating `verificationCommands`
(`gate8-execute-approved-decision.mjs:1195-1206`):

```js
for (const command of verificationPlan.verificationCommands || []) { ... tests.push(...) }
```

With zero commands, `tests` stays `[]`. The failure gate is
(`gate8-execute-approved-decision.mjs:1240`):

```js
if (tests.some(x => !x.pass)) { ... throw ... }
```

`[].some(...)` is `false` by definition, so this branch can never fire, and
the code unconditionally reaches (`gate8-execute-approved-decision.mjs:1254`):

```js
console.log('Deterministic verification: PASS');
```

This is exactly what the persisted evidence shows. `gate8-last-execution.json`
records `"deterministicVerification": []` — an empty array, not a list of
passed checks — alongside the printed string `"Deterministic verification: PASS"`
in `stdout`. **The PASS is vacuous: it is "zero checks ran, so none failed,"
not "the regression test ran and passed."** `test-gate5-read-capabilities.mjs`
was never invoked inside Gate 8's isolated worktree for this decision.

This fully explains the discrepancy the prior investigation could not resolve.
It is not a timing difference, not a different worktree state, not a
different rate-limit environment, and not a test-file content mismatch (all
ruled out below) — Gate 8 simply never ran the test.

**Status: Verified** — confirmed by direct code read of both files plus
cross-reference against the actual persisted `gate8-last-execution.json`
(`"deterministicVerification": []`, `"attempts":[{"status":"verified","passedSteps":[]},...]`),
not inferred from behaviour or stack traces.

---

## INVESTIGATION 1 — Reproduce (fresh process, this task)

```
GATE5_DIRECT_COMMAND:  node test-gate5-read-capabilities.mjs
CWD:                   C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge
NODE VERSION:          v24.18.0
SERVER LIFECYCLE:      in-process — test imports server.gate5.mjs directly
                       (no separate server process); fresh in-memory
                       rate-limit map per test run
ENV (rate-limit-relevant): THA_BRIDGE_PORT=18788 (default, test-set),
                       GENERAL_RATE_LIMIT=20 and RATE_WINDOW_MS=60_000 are
                       hard-coded constants in server.gate5.mjs (not env-
                       configurable)
EXIT CODE:             1
```

Full HTTP request sequence observed (from the server's own `http_access`
structured logs), in order:

| # | Method | Path | Bucket | Result |
|---|---|---|---|---|
| 1 | POST | /v1/tha/search | general | 200 |
| 2 | POST | /v1/tha/file-range | general | 200 |
| 3 | POST | /v1/tha/diff | general | 200 |
| 4 | POST | /v1/tha/file-range | general | 200 |
| 5 | POST | /v1/tha/file-range | general | 200 |
| 6 | POST | /v1/tha/file-range | general | 200 |
| 7 | POST | /v1/tha/file-range | general | 200 |
| 8 | POST | /v1/tha/search | general | 200 |
| 9 | POST | /v1/tha/file-range | general | 200 |
| 10 | GET | /v1/tha/activity | general | 401 (no-auth negative case) |
| 11 | GET | /v1/tha/activity | general | 200 |
| 12 | POST | /v1/tha/investigate/start | general | 200 (accepted) |
| 13 | GET | /v1/tha/activity | general | 200 |
| 14 | GET | /v1/tha/requests/:id | **poll** (separate bucket) | 200 |
| 15 | GET | /v1/tha/requests/:id | **poll** | 200 |
| 16 | GET | /v1/tha/requests/:id | **poll** | 200 |
| 17 | GET | /v1/tha/activity | general | 200 |
| 18 | GET | /v1/tha/activity | general | 200 |
| 19 | GET | /v1/tha/activity | general | 200 |
| 20 | GET | /v1/tha/activity | general | 200 |
| 21 | GET | /v1/tha/activity | general | 200 |
| 22 | GET | /v1/tha/activity | general | 200 |
| 23 | GET | /v1/tha/activity | general | 200 |
| **24** | **POST** | **/v1/tha/search** | **general** | **429 — crosses limit** |

Excluding the 3 `poll`-bucket requests (#14-16, confirmed by code:
`GET /v1/tha/requests/:id` uses a distinct `poll` bucket at 60/min,
`server.gate5.mjs`), request #24 is the **21st** request against the
`general` bucket (`GENERAL_RATE_LIMIT = 20` per 60s window) — one over the
limit. It is exactly the compatibility-section `POST /v1/tha/search` call at
`test-gate5-read-capabilities.mjs:370-374`, producing:

```
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
429 !== 200
    at test-gate5-read-capabilities.mjs:374:8
```

**Proven, not theorised:** the Activity Projection test additions (9 of the
21 general-bucket calls, #10-11, #13, #17-23) are what push the run's
cumulative general-bucket count from what would have been 12 (pre-existing
calls only) to 21, crossing the 20 cap before the pre-existing compatibility
assertion executes. Removing hypothetically the 9 activity calls would leave
12 general-bucket calls — under the limit — confirming the activity test
additions are the proximate cause of the shared-bucket exhaustion, independent
of and in addition to the Gate 8 verifier gap above.

```
GATE8_TEST_FILE:    test-gate5-read-capabilities.mjs (same file at same content
                     — sha256 800a7b1e...fa00b64 recorded in
                     gate8-last-execution.json `applied[]` matches the live
                     tracked file; no divergence)
DIRECT_COMMAND:      node test-gate5-read-capabilities.mjs
DIRECT_EXIT_CODE:    1
DIRECT_TEST_OUTPUT:  AssertionError [ERR_ASSERTION]: 429 !== 200, at
                     test-gate5-read-capabilities.mjs:374:8 (full log captured
                     this task)
```

---

## INVESTIGATION 2 — Gate 8 evidence

`GATE8_VERIFICATION_TRANSCRIPT`: a `stdout` blob **is** persisted (in
`executions/tha-exec-1787739457240-381b1f9f.json` and duplicated in
`gate8-last-execution.json`), but it is a linear console-log capture, not a
per-test transcript — because, per the root cause above, no test command was
ever invoked, there is no test stdout/stderr to show. There is no separate
"verification transcript," "worker output" beyond the one Hermes review text,
or Hermes evidence beyond the single embedded `hermesVerification.response`
string. No isolated-worktree filesystem snapshot survives (the worktree is
torn down after execution — `execution-worktrees/` does not contain an entry
for this decision ID, confirmed by directory listing).

```
GATE8_COMMAND:        (none — verificationCommands resolved to [] for this
                       decision's scope kind; no subprocess was spawned for
                       test-gate5-read-capabilities.mjs)
GATE8_TEST_FILE:      test-gate5-read-capabilities.mjs (in scope, present in
                       the isolated worktree per gate8-execute-approved-
                       decision.mjs's own scope-completeness check, but never
                       executed)
GATE8_EXIT_CODE:      n/a — not run
GATE8_TEST_OUTPUT:    "Deterministic verification: PASS" (printed
                       unconditionally when `tests` is empty; see root cause)
GATE8_ENVIRONMENT:    isolated Gate 8 worktree, worker "Claude CLI isolated
                       worktree", attempt 1/3, no repair loop needed
                       (gate8-last-execution.json)
DIRECT_COMMAND:        node test-gate5-read-capabilities.mjs
DIRECT_EXIT_CODE:      1
DIRECT_TEST_OUTPUT:    AssertionError 429 !== 200 at line 374 (see Investigation 1)
```

This is **not** `GATE 8 VERIFICATION TRANSCRIPT: NOT PERSISTED` — evidence
does exist and was located (`gate8-last-execution.json`,
`executions/tha-exec-1787739457240-381b1f9f.json`); it simply documents that
zero deterministic checks ran, which is itself the answer to the objective
question.

---

## INVESTIGATION 3 — Compare states

| Candidate cause | Verdict | Evidence |
|---|---|---|
| A. different test file contents | **Ruled out** | sha256 of live `test-gate5-read-capabilities.mjs` matches `applied[]` in `gate8-last-execution.json` exactly |
| B. different commit/worktree | **Ruled out** | same branch/HEAD (`main` @ `aae2ea30e...`) recorded in both the decision and this task's direct run against the live tree |
| C. different request ordering | **Not applicable** | irrelevant — no requests were sent under Gate 8 at all |
| D. different server lifecycle | **Not applicable** | irrelevant for the same reason |
| E. different rate-limit state | **Not applicable** | irrelevant — no requests were sent under Gate 8, so no bucket was ever touched during Gate 8's run |
| F. test isolation/reset behaviour | **Not applicable** | irrelevant, same reason |
| **G. Gate 8 did not actually execute the claimed test** | **Confirmed — root cause** | `verificationCommands: []` for `kind: 'gate5-read-capabilities'`; `deterministicVerification: []` in evidence |
| H. verification evidence is incomplete | Secondary, true but not causal | the evidence is complete for what ran (nothing) — it is the *plan*, not the *evidence capture*, that is defective |
| I. another cause | Not needed | G fully explains the discrepancy |

---

## INVESTIGATION 4 — Ownership

```
CANONICAL IDENTITY SINGULAR:
- Gate 5 general rate-limit policy:        one constant pair (GENERAL_RATE_LIMIT,
                                            RATE_WINDOW_MS) + one function
                                            (rateAllowed) in server.gate5.mjs
- Activity Projection rate-limit policy:   none distinct exists — it inherits
                                            the general bucket (this absence is
                                            part of the finding, not a
                                            duplicate policy)
- Gate 5 regression-test sequencing:       one file, test-gate5-read-capabilities.mjs
- Gate 8 deterministic verification def.:  one function, buildVerificationPlan()
                                            in gate8-repair-loop.mjs
- Gate 8 verification evidence/receipt:    one writer, gate8-execute-approved-
                                            decision.mjs, writing gate8-last-
                                            execution.json + executions/*.json

OWNERSHIP SINGULAR:            yes for every concern above — no duplicate
                                limiter, no duplicate verification-plan
                                builder, no duplicate evidence writer found
                                anywhere in the bridge repo.

DUPLICATED STATE:               none found.

DUPLICATED WORKFLOW:            none — the defect is an absence (an unwired
                                 switch branch), not a second competing
                                 implementation.

EXISTING ARCHITECTURE EXTENDED: any repair extends buildVerificationPlan()'s
                                 existing kind-keyed verificationCommands
                                 switch (already has two live branches to
                                 follow the same pattern for) and
                                 server.gate5.mjs's existing rateAllowed(ip,
                                 bucket, maximum) function (already
                                 parameterised for a distinct bucket — the
                                 exact mechanism already used for `poll`).
```

Consumers found of `buildVerificationPlan` / the scope constants: `gate8-execute-approved-decision.mjs`,
`test-gate8-repair-loop.mjs`, `test-gate8-verification-scope.mjs`,
`test-gate8-gate9-lifecycle-phase-scope.mjs`, `test-gate8-gate5-read-capabilities-scope.mjs`,
`test-gate8-read-capabilities-scope.mjs`, and the `prepare-*-decision.mjs`
factory scripts that mint decisions against these scopes. All read the same
single source; none re-implement it.

`docs/architecture/` (this repo) has no owner for Gate 5/7/8/9 at all — this
was already established as **[Verified]** in the prior investigation and is
unchanged by this one.

---

## DRIFT CHECK

**Classification: verifier defect (primary) + implementation gap (secondary),
not architecture drift, not governance-document drift.**

- No `docs/architecture/` document asserts a contract for what Gate 8's
  "deterministic verification" must cover per scope kind, so there is no
  document for the code to be in conflict *with* — hence **ARCHITECTURE
  DRIFT: no**.
- `PROJECT_GOVERNANCE.md` establishes Gate 8/Gate 9 roles and delegation but
  does not itself specify per-scope-kind verification command wiring — hence
  no direct governance-text contradiction, but the recorded artifact's own
  self-description ("Deterministic verification: PASS") is misleading given
  zero checks executed, which is a governance **evidence-integrity** gap
  regardless of doc silence — **GOVERNANCE DRIFT: yes** (in the sense that
  the decision record now certifies something untrue about what was
  verified).
- **VERIFIER DEFECT: yes** — root cause, `gate8-repair-loop.mjs:286-290`
  omits a `verificationCommands` branch for `kind === 'gate5-read-capabilities'`.
- **TEST DEFECT: yes** — secondary, real, independently reproducible: the
  activity test additions and pre-existing compatibility check share one
  under-sized bucket.
- **IMPLEMENTATION DEFECT: yes** — secondary: `GET /v1/tha/activity` was
  given no bucket of its own in `server.gate5.mjs`, unlike the precedent
  already set for `poll`.
- Architecture and implementation do not conflict (no architecture document
  exists to conflict with) — so the STOP-on-conflict clause does not apply;
  this is a code-level defect classification, not an architecture/
  implementation mismatch requiring escalation beyond a bounded repair
  decision.

```
ARCHITECTURE: no docs/architecture owner exists for Gate 5/7/8/9 (unchanged
              from prior investigation); no per-scope-kind verification
              contract is documented anywhere.
IMPLEMENTATION: buildVerificationPlan() silently returns zero verification
              commands for the 'gate5-read-capabilities' kind; the execution
              loop then treats an empty test list as an unconditional pass.
CONFLICT:     none between architecture and implementation (no architecture
              text to conflict with) — the conflict is between the recorded
              evidence artifact's PASS claim and the actual (non-)execution
              it purports to describe.
IMPACT:       every future decision scoped to GATE5_READ_CAPABILITIES_SCOPE
              (or any other kind not explicitly wired) will record
              "Deterministic verification: PASS" while running zero checks,
              silently certifying unverified code as verified. This is a
              structural gap in the Gate 8 verifier, not limited to this one
              decision.
RECOMMENDED RESOLUTION: bounded repair decision, scoped only to (1) wiring a
              verificationCommands entry for kind 'gate5-read-capabilities'
              that runs test-gate5-read-capabilities.mjs, and (2) removing
              the shared-bucket exhaustion that would otherwise make that new,
              now-actually-running check fail deterministically. See options
              below.
```

---

## REQUIRED DECISION PREPARATION (not executed — investigation only)

Repair is genuinely required (root cause is a structural verifier gap, not a
one-off flake). One bounded decision, addressing only the rate-limit/test
repair — explicitly excluding Activity Projection lifecycle enrichment,
`/admin/activity`, and Administration architecture registration, per
instruction.

The repair has two parts that must land together, because wiring the test
into Gate 8 without also fixing the rate-limit collision would just convert
today's *silent* false pass into a *loud*, permanent, reproducible Gate 8
failure:

1. Add a `gate5-read-capabilities` branch to `buildVerificationPlan()`'s
   `verificationCommands` (`gate8-repair-loop.mjs:286-290`), running
   `test-gate5-read-capabilities.mjs`, following the exact existing pattern
   used for `bridge-orchestration`/`decision-factory-porcelain-repair`.
2. Resolve the shared general-bucket exhaustion so the now-actually-executed
   test passes deterministically.

**OPTIONS for part 2** (part 1 is common to all three and not itself a
design choice — it simply follows the established pattern):

**A — Give `GET /v1/tha/activity` its own rate bucket (recommended).**
Call the existing `rateAllowed(ip, 'activity', N)` with a distinct bucket
name, exactly as already done for `poll` (`server.gate5.mjs`). Extends the
existing, already-parameterised owner; zero new limiter code. Trade-off:
introduces one more named bucket to reason about, and requires picking a
sensible `N`.

**B — Raise `GENERAL_RATE_LIMIT`.**
Single-constant change. Simplest possible diff. Trade-off: loosens the
shared-bucket ceiling for every existing general-bucket route
(`search`/`file-range`/`diff`/`investigate`), not just activity — a
blast-radius increase beyond the feature that caused the problem, and only
delays the same collision at a higher N as more read routes accrue calls in
one test run.

**C — Reduce/space the test's own activity-bucket calls** (e.g. reuse a
single cached response across assertions instead of issuing 9 separate
calls, or insert deliberate spacing). Trade-off: makes the test's request
count an implicit, undocumented constraint tied to the current limit — any
future test addition to *any* general-bucket route silently re-introduces
the same collision; does not fix the underlying shared-bucket design gap for
real traffic (only for the test).

**Recommended: A.** It extends the exact mechanism this codebase already
uses for exactly this purpose (`poll`'s dedicated bucket), fixes the
collision for real traffic (not just the test), and keeps the blast radius
scoped to the one new route rather than every existing general-bucket route.

---

## FINAL OUTPUT

```
ACTIVITY PROJECTION VERIFICATION CONFLICT

ROOT CAUSE: buildVerificationPlan() (gate8-repair-loop.mjs:286-290) resolves
            verificationCommands to an empty array for kind
            'gate5-read-capabilities' (the kind this decision's scope maps
            to). The execution loop only runs commands from that array and
            treats an empty result set as an unconditional pass. Gate 8
            therefore never invoked test-gate5-read-capabilities.mjs for this
            decision; "Deterministic verification: PASS" is a vacuous pass
            over zero executed checks, not a real pass of the regression
            test.
ROOT CAUSE STATUS: Verified

GATE 8 RECORDED RESULT:      Deterministic verification: PASS (vacuous —
                              deterministicVerification: [] in the persisted
                              evidence)
DIRECT REPRODUCTION RESULT:  FAIL — AssertionError 429 !== 200 at
                              test-gate5-read-capabilities.mjs:374, exit code 1,
                              reproduced fresh this task

GATE8_COMMAND:    (none — no verification command was ever configured or run
                  for this scope kind)
GATE8_EXIT_CODE:  n/a
GATE8_EVIDENCE:   gate8-last-execution.json,
                  executions/tha-exec-1787739457240-381b1f9f.json (both
                  located and read directly; deterministicVerification: [])
DIRECT_COMMAND:   node test-gate5-read-capabilities.mjs
DIRECT_EXIT_CODE: 1

RATE LIMIT OWNER:            server.gate5.mjs (GENERAL_RATE_LIMIT, rateAllowed())
TEST SEQUENCE OWNER:         test-gate5-read-capabilities.mjs
GATE 8 VERIFICATION OWNER:   gate8-repair-loop.mjs::buildVerificationPlan()

ARCHITECTURE DRIFT:     no
GOVERNANCE DRIFT:       yes (recorded evidence artifact certifies verification
                        that did not occur)
IMPLEMENTATION DEFECT:  yes (GET /v1/tha/activity shares an under-sized bucket)
TEST DEFECT:            yes (test's own call volume against that shared bucket
                        collides with a pre-existing compatibility assertion)
VERIFIER DEFECT:        yes (root cause — unwired verificationCommands branch)

IMPACT: any decision scoped to a verification-plan `kind` without an explicit
        verificationCommands branch — today, that is every kind except
        `bridge-orchestration` and `decision-factory-porcelain-repair` —
        records "Deterministic verification: PASS" while running zero
        checks. This is a structural Gate 8 gap, not unique to this decision.

OPTIONS (for the rate-limit component of the bounded repair; test-wiring
component is common to all three):
A: Give GET /v1/tha/activity its own rate bucket via the existing
   rateAllowed(ip, bucket, maximum) function (same pattern as `poll`).
B: Raise GENERAL_RATE_LIMIT.
C: Reduce/space the test's own call count against the shared bucket.

RECOMMENDED OPTION: A
RISK: RED

DECISION REQUIRED: yes
```

```
DECISION_ID:                (new — to be minted at approval time; none exists yet)
WHAT IT CONTROLS:            (1) gate8-repair-loop.mjs — add a
                              verificationCommands branch for kind
                              'gate5-read-capabilities' running
                              test-gate5-read-capabilities.mjs;
                              (2) server.gate5.mjs — give GET /v1/tha/activity
                              its own rate bucket via the existing
                              rateAllowed(ip, bucket, maximum) function
FILES IN SCOPE:               gate8-repair-loop.mjs, server.gate5.mjs
                              (bridge repo)
DATA IMPACT:                  none — no persisted data shape changes; rate
                              bucket state is in-memory only
RELEASE TIMING:               no deployment implied by this decision (Gate 8
                              execution evidence already shows
                              commitCreated/pushed/deployed: false for the
                              underlying feature) — repair applies to the
                              Gate 8 tooling and the bridge server file, not
                              to any deployed service
ROLLBACK PLAN:                Gate 8's own isolated-worktree-then-apply
                              mechanism with pre-state baselines (the same
                              mechanism used for every other Gate 8
                              execution) — revert the two files to their
                              pre-repair sha256 baselines if the fix
                              regresses anything
VERIFICATION PLAN:            after the fix, run
                              `node test-gate5-read-capabilities.mjs`
                              directly (exit code must be 0) AND confirm the
                              next Gate 8 execution against this scope kind
                              records a non-empty deterministicVerification
                              array with pass:true for the new command
DEPLOYMENT CHECKLIST:         n/a — no deploy in scope
REQUIRED APPROVAL PHRASE:     APPROVE <decision-id-once-minted>
```

Repair was **not** executed. This document is investigation-only, per
instruction.

---

## TRUST CHECK

- **Highest-risk claim still Inferred or Assumed:** none of the load-bearing
  claims above are Inferred or Assumed — the root cause (empty
  `verificationCommands` for this scope kind), the rate-limit collision
  mechanism, and the exact request that crosses the limit are all Verified
  by direct code reading and/or fresh independent execution performed in
  this task. The one soft judgement call is the **GOVERNANCE DRIFT: yes**
  classification, which is an interpretive label (does a vacuous-but-
  technically-not-contradicting-any-document PASS count as "governance
  drift") rather than a factual claim — the underlying facts it is based on
  are all Verified.
- **Evidence that would remove even that soft judgement call:** an explicit
  ruling from the governance owner on whether "Deterministic verification:
  PASS" is defined, project-wide, to mean "zero checks failed" (current code
  behaviour) or "at least the scope's own regression test ran and passed"
  (the natural reading of the phrase, and the reading that lines up with why
  this scope's test file was frozen into the approved decision in the first
  place).
