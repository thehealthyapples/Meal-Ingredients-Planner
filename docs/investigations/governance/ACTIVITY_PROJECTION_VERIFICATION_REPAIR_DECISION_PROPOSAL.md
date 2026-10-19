# Activity Projection Verification Repair — Decision Proposal (Not Executed)

**Date:** 2026-08-26
**Status:** Proposal only. No decision has been created via the bridge's
decision factory. No file has been modified. Awaiting explicit approval
before any preparation script or Gate 8 execution runs.
**Predecessor:** `docs/investigations/governance/ACTIVITY_PROJECTION_VERIFICATION_CONFLICT.md`
(root-cause investigation — read first for full evidence trail).

---

## Live-state re-verification (this task, before preparing anything)

| Check | Result | Tag |
|---|---|---|
| `gate9-current-decision.json` decisionId | still `tha-dec-a3dace1dbb1605d91474cada3f54385c` | Verified |
| `gate8-last-execution.json` `deterministicVerification` | still `[]` | Verified |
| `buildVerificationPlan()` `verificationCommands` switch (`gate8-repair-loop.mjs:286-290`) | unchanged — still only branches on `bridge-orchestration` / `decision-factory-porcelain-repair` | Verified |
| `server.gate5.mjs` rate dispatch (`:1789-1794`) | unchanged — only `isPollRequest` gets a dedicated bucket; `GET /v1/tha/activity` still falls through to the default `rateAllowed(ip)` general bucket | Verified |

**No drift since the investigation.** Nothing changed underneath this task.

---

## COMPLIANCE

```
CANONICAL IDENTITY SINGULAR:   yes — one GATE5_READ_CAPABILITIES_SCOPE
                                constant, one buildVerificationPlan()
                                function, one rateAllowed() function. The
                                repair adds one new frozen command-list
                                constant and one new bucket name string; it
                                does not introduce a second identity for
                                anything that already has one.
OWNERSHIP SINGULAR:            yes — repair edits only the two files that
                                already own these facts; no new owner created.
NO DUPLICATED STATE:           confirmed — no new persisted state, no new
                                in-memory map. The new bucket reuses the
                                existing `limits` Map inside rateAllowed()
                                (keyed by `${bucket}:${ip}`, the same pattern
                                'poll' already uses).
NO DUPLICATED WORKFLOW:        confirmed — no second verifier, no second
                                rate-limiting framework. The repair is two
                                additive branches in two existing switches
                                (buildVerificationPlan's kind switch;
                                server.gate5.mjs's isPollRequest ternary).
EXISTING ARCHITECTURE EXTENDED: yes — both repairs follow a pattern the
                                codebase already uses for an equivalent case
                                (BRIDGE_VERIFICATION_COMMANDS for verification
                                wiring; the 'poll' bucket for rate isolation).
```

### Authoritative owners — independently re-verified this task

| Fact | Owner (file) | Verified how |
|---|---|---|
| Gate 5 rate-limit policy | `server.gate5.mjs` — `GENERAL_RATE_LIMIT`, `POLL_RATE_LIMIT`, `rateAllowed()` (:82-84, :151-172) | Read directly |
| Gate 5 read-capability regression sequencing | `test-gate5-read-capabilities.mjs` | Read directly, executed fresh in the prior task |
| Gate 8 verification-plan definition | `gate8-repair-loop.mjs::buildVerificationPlan()` (:170-294) | Read directly |

### Consumers found (every one checked for breakage from this repair)

**Of `buildVerificationPlan` / `GATE5_READ_CAPABILITIES_SCOPE`:**
`gate8-execute-approved-decision.mjs` (runtime consumer — will now actually
receive a non-empty `verificationCommands` for this kind; this is the
intended effect, not a break), `test-gate8-gate5-read-capabilities-scope.mjs`
(**breaks** — asserts `plan.verificationCommands` deep-equals `[]` at line
23; must be updated as part of this decision's scope, since that assertion
currently locks in the defect), `test-gate8-read-capabilities-scope.mjs` and
`test-gate8-gate9-lifecycle-phase-scope.mjs` (unaffected — they assert
emptiness for *different* kinds, `read-capabilities-decision-factory` and
`gate9-lifecycle-phase`, which this repair does not touch),
`test-gate8-repair-loop.mjs` and `test-gate8-verification-scope.mjs`
(unaffected — they assert on `bridge-orchestration`'s command list, untouched
by this repair), `prepare-pipeline-stabilisation-decision.mjs` and
`prepare-read-capabilities-decision-factory-v2-decision.mjs` (decision
factories for other, unrelated scope kinds — unaffected).

**Of `rateAllowed` / the rate dispatch block:** exactly one call site
(`server.gate5.mjs:1789-1794`) gates every route. Adding an
`isActivityRequest` branch there is scoped to that one dispatch point; no
other file calls `rateAllowed` directly.

**`isRepairableVerificationFailure()`** (`gate8-repair-loop.mjs:312-325`)
already generically allows any command name present in
`plan.verificationCommands` — the new command is automatically covered by
Gate 8's existing bounded-repair-attempt logic with no separate change
required. Confirmed by direct read, not assumed.

---

## OPTIONS — Repair B (rate-limit isolation)

| | A. Dedicated activity bucket | B. Raise shared general limit | C. Reduce/space test's call volume |
|---|---|---|---|
| Production correctness | Fixes it for real traffic, not just the test | Only delays the same collision as more general-bucket routes accrue calls | Does not fix production at all — only the test's own footprint |
| Isolation | Activity Projection polling (a UI-facing, potentially frequent read) no longer competes with `search`/`file-range`/`diff`/`investigate` | No isolation — widens the shared ceiling for every existing consumer | No isolation — leaves the shared-bucket design as-is |
| Existing architecture | Reuses `rateAllowed(ip, bucket, maximum)` exactly as `poll` already does | Reuses the same function but changes a shared constant, not a scoped one | No production code changed |
| Regression integrity | Test passes because production behaviour genuinely changed, not because the test was weakened | Test passes, but only because unrelated routes now tolerate more load too — the test would stop being a genuine regression signal for the general bucket's real ceiling | Explicitly disallowed by this decision's own scope (no removing calls, no sleeps) |
| Least additional mechanism | One new bucket name string + one new constant — same shape as existing `poll` | One constant edit — smallest diff, but wrong axis (fixes the symptom's blast radius, not its cause) | No new mechanism, but converts a real capacity fact into an implicit, undocumented test constraint that silently re-breaks on the next unrelated addition to any general-bucket route |
| Effect on existing Gate 5 consumers | None — `search`/`file-range`/`diff`/`investigate`/default routes keep `GENERAL_RATE_LIMIT` exactly as today | Every general-bucket consumer gets more headroom, whether or not it needed it — an unreviewed capacity change to routes untouched by this decision | None |

**Recommended: A.** It is the only option that fixes the actual production
condition (Activity Projection polling should not be able to starve unrelated
read routes, and vice versa), stays inside this decision's declared scope,
and is the direct, already-precedented extension of the existing owner.

---

## THE BOUND DECISION (proposed — not yet created via decision factory)

```
DECISION_ID:            not yet minted. The bridge repo mints decisionIds as
                         content hashes at decision-factory creation time
                         (e.g. tha-dec-a3dace1dbb1605d91474cada3f54385c for
                         the predecessor) — fabricating one here would be an
                         Assumed claim, so none is stated. Proposed factory
                         slug: gate5-read-capabilities-truthful-verification-
                         and-activity-rate-isolation-one-bounded

WHAT IT CONTROLS:
  Repair A: gate8-repair-loop.mjs — add
    GATE5_READ_CAPABILITIES_VERIFICATION_COMMANDS = Object.freeze([
      Object.freeze({
        name: 'gate5-read-capabilities-regression',
        args: Object.freeze(['test-gate5-read-capabilities.mjs'])
      })
    ])
  and wire it into buildVerificationPlan()'s existing verificationCommands
  switch as a third branch for kind === 'gate5-read-capabilities' (alongside
  the two existing branches; no other branch changes).

  Repair B: server.gate5.mjs — add an ACTIVITY_RATE_LIMIT constant and an
  isActivityRequest check (GET /v1/tha/activity) alongside the existing
  isPollRequest check at the single rate-dispatch call site (:1789-1794),
  routing activity requests to rateAllowed(ip, 'activity', ACTIVITY_RATE_LIMIT)
  instead of the default general bucket — same call shape already used for
  'poll'.

  Consumer update (required by Repair A, not a third repair): update
  test-gate8-gate5-read-capabilities-scope.mjs's assertion #1
  (currently `assert.deepEqual(plan.verificationCommands, [])`) to assert the
  new one-entry command list instead — otherwise this decision would break an
  existing, currently-passing regression test.

OPTIONS A/B/C:           see table above (Repair B only; Repair A has no
                         design alternative — it is a direct application of
                         the existing pattern)
RECOMMENDED OPTION:      A — dedicated activity rate bucket

TRADE-OFFS:              Option A adds one new bucket name to reason about
                         (offset by reusing the exact existing mechanism);
                         it is the only option that fixes production
                         behaviour rather than only the test.

REPOSITORY:              C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge
BRANCH:                  main (HEAD aae2ea30e34aa92c1a24ecccd40820160d4576c6
                         at time of investigation — to be re-verified as
                         current HEAD at actual Gate 8 execution time)
FILES IN SCOPE:          gate8-repair-loop.mjs
                         server.gate5.mjs
                         test-gate8-gate5-read-capabilities-scope.mjs

CANONICAL OWNERS:        gate8-repair-loop.mjs::buildVerificationPlan()
                         (Gate 8 verification-plan definition);
                         server.gate5.mjs (Gate 5 rate-limit policy)
CONSUMERS:               see "Consumers found" table above — every consumer
                         of both owners was enumerated and checked; only one
                         (test-gate8-gate5-read-capabilities-scope.mjs) needs
                         a change, and that change is in scope.

DATA IMPACT:
  reads existing:        test-gate5-read-capabilities.mjs (now actually read
                         and executed by Gate 8, as the approved scope always
                         implied); the existing `limits` in-memory rate map
                         (now keyed with one additional bucket prefix)
  writes new:            none persisted — the new rate bucket is in-memory
                         only, same lifetime as the existing 'general'/'poll'
                         buckets (process lifetime, no persistence)
  changes meaning:       "Deterministic verification: PASS" for
                         gate5-read-capabilities-scoped decisions changes
                         meaning from "zero checks ran" to "the regression
                         suite ran and passed" — this is the entire point of
                         Repair A
  backfill required:     none — this decision's predecessor
                         (tha-dec-a3dace1dbb1605d91474cada3f54385c) already
                         executed and is not re-verified retroactively by
                         this decision; only future gate5-read-capabilities
                         executions are affected

RELEASE TIMING:          no deployment implied — both files are local/bridge
                         tooling and server source; the predecessor decision's
                         own evidence already shows commitCreated/pushed/
                         deployed: false, and this repair does not change
                         that posture
ROLLBACK PLAN:           standard Gate 8 isolated-worktree-then-apply
                         mechanism with pre-state baselines (identical to
                         every other Gate 8 execution) — revert the three
                         files to their pre-repair sha256 baselines if
                         anything regresses
VERIFICATION PLAN:       (1) node test-gate5-read-capabilities.mjs from a
                         fresh process — must exit 0; (2) node
                         test-gate8-gate5-read-capabilities-scope.mjs — must
                         exit 0 with the updated assertion; (3) node
                         test-gate8-repair-loop.mjs and node
                         test-gate8-verification-scope.mjs — must still exit
                         0 unchanged (bridge-orchestration kind untouched);
                         (4) a live Gate 8 execution against this decision's
                         own scope — inspect the resulting
                         gate8-last-execution.json and confirm
                         deterministicVerification contains one entry with
                         pass: true and name
                         'gate5-read-capabilities-regression', not []
DEPLOYMENT CHECKLIST:    n/a — no deploy in scope
```

---

## DEFINITION OF DONE

1. `gate5-read-capabilities` receives a real deterministic verification
   command — via `GATE5_READ_CAPABILITIES_VERIFICATION_COMMANDS` wired into
   `buildVerificationPlan()`.
2. Gate 8 executes that command — verified by inspecting the next
   `gate8-last-execution.json` for this scope kind.
3. Persisted execution evidence contains the actual verification result
   (`deterministicVerification` has one entry with `name`, `pass`, `output`)
   rather than `[]`.
4. `node test-gate5-read-capabilities.mjs` exits 0 from a fresh process,
   unmodified from its current assertions.
5. Activity Projection requests no longer exhaust the general compatibility
   bucket during legitimate regression execution — verified by re-running the
   same request-sequence trace produced in the investigation and confirming
   no 429 appears anywhere in it.
6. `search`/`file-range`/`diff`/`investigate`/default routes remain governed
   by the unmodified `GENERAL_RATE_LIMIT = 20` — no widening.
7. The existing dedicated `poll` bucket (`POLL_RATE_LIMIT = 60`) is untouched
   and still effective — verified by `test-gate5-read-capabilities.mjs`'s own
   poll-path assertions continuing to pass.
8. `test-gate8-repair-loop.mjs`, `test-gate8-verification-scope.mjs`,
   `test-gate8-read-capabilities-scope.mjs`, and
   `test-gate8-gate9-lifecycle-phase-scope.mjs` all still exit 0 unmodified —
   confirming no other scope kind's verification plan changed.
9. No Activity Projection contract/lifecycle field is added, removed, or
   reshaped — `buildActivityProjection()` and its four record kinds are
   untouched by this decision.
10. No `/admin/activity` or other application-layer file is touched — file
    scope is limited to the three bridge-repo files named above.

---

## USER ACCEPTANCE EVIDENCE

**Starting point:** Existing Bridge Activity Projection
(`tha-dec-a3dace1dbb1605d91474cada3f54385c`, already executed, unchanged by
this decision).

**User action:** Run the existing governed Activity Projection
execution/verification path — i.e. approve and execute this decision through
Gate 8 exactly as any other decision.

**Expected behaviour:** Gate 8 actually executes
`test-gate5-read-capabilities.mjs` inside its isolated worktree and records
the real result in `deterministicVerification`, instead of printing PASS over
an empty check list.

**Success criteria:** No vacuous deterministic PASS (non-empty
`deterministicVerification` with a genuine `pass: true`/`false` from an
actually-run command), and the legitimate Activity Projection regression run
completes without any request in its sequence receiving 429 from the
unrelated general/compatibility bucket.

**Regression checks (named from the live repository):**
- `test-gate5-read-capabilities.mjs` (the Gate 5 read-capability regression
  suite itself — must pass unmodified)
- `test-gate8-gate5-read-capabilities-scope.mjs` (verification-plan
  classifier test for this exact scope kind — updated as part of this
  decision, then must pass)
- `test-gate8-repair-loop.mjs` (bridge-orchestration plan + repairability
  logic — must remain unaffected)
- `test-gate8-verification-scope.mjs` (cross-kind verification-plan
  classifier coverage, including cookbook/bridge kinds — must remain
  unaffected)
- `test-gate8-read-capabilities-scope.mjs` and
  `test-gate8-gate9-lifecycle-phase-scope.mjs` (other scope-kind classifiers
  whose own `verificationCommands: []` assertions must remain correct and
  unaffected, since this decision does not touch their kinds)

---

## TRUST CHECK

- Every material ownership, architecture, and implementation-status claim
  above is tagged **Verified** — each was re-read directly from the live
  bridge repository in this task (not carried over unchecked from the prior
  investigation), including the full consumer enumeration and the discovery
  that one existing test (`test-gate8-gate5-read-capabilities-scope.mjs`)
  currently hard-codes the defect as expected behaviour.
- **Highest-risk claim still Inferred or Assumed:** the exact numeric value
  to use for `ACTIVITY_RATE_LIMIT`. No document or code comment states an
  intended request rate for Activity Projection polling; `POLL_RATE_LIMIT =
  60` is a precedent for a similarly lightweight read endpoint, but using it
  (or any other number) for `ACTIVITY_RATE_LIMIT` would be an Assumed choice,
  not a Verified one, absent an explicit ruling.
- **Evidence required to verify it:** an explicit value (or explicit
  delegation to "same as poll") from the decision approver at approval time,
  since no governing document currently specifies Activity Projection's
  intended request rate.

---

**Not executed.** No decision-factory script has been run. No file has been
modified. Awaiting the exact approval phrase below before any preparation or
Gate 8 execution proceeds.

**Required approval phrase (once the decision is actually minted by the
bridge's decision factory and receives a real decisionId):**
`APPROVE <decision-id>`
