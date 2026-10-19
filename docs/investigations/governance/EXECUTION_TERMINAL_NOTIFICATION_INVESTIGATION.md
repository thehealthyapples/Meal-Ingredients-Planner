# Execution Terminal Notification Investigation

> **CORRECTION, appended after a controlled trial (`tha-exec-1787780547872-538ff6ce`, `bcfc3l5t5`):**
> the root cause is NOT ambiguous harness behaviour. It is a concrete, verified bug in my own
> reusable polling snippet: `JSON.parse(d).status` reads a field that does not exist at that
> path — the real response shape from `GET /v1/tha/executions/:id` is `{ok, execution: {status,
> ...}}`, so `.status` (top-level) is always `undefined`. Every background poll this session used
> this exact snippet. Because the `until [ "$STATUS" = "SUCCEEDED" ] || [ "$STATUS" = "FAILED" ]`
> condition can never become true against the literal string `"undefined"`, the loop can never
> exit on its own — it just sleeps and re-checks forever. Direct evidence: the background task's
> own output file (`bcfc3l5t5.output`) shows 50+ consecutive `status=undefined, waiting...` lines
> and, at time of writing, the shell is **still actively running**, roughly 17 minutes after the
> real Gate 9 execution reached FAILED at 21:51:30Z — well past the 600000ms (10-minute) timeout
> I specified for that Bash call, which evidently does not hard-kill a backgrounded process at
> that mark. This fully explains why manual "check status" messages were always needed: not
> because the harness failed to notify, but because my own script never reached a state where
> there was anything valid to notify about. The two early "automatic" notifications documented
> below should now be read with that in mind — they most plausibly reflect the harness noticing
> the wrapper process's eventual exit (by whatever means), not confirmation that my `until`
> condition was ever correctly satisfied. This correction supersedes the "root gap" conclusion
> below; the fix is trivial (read `.execution.status`, not `.status`) and is not applied here,
> per instruction to investigate only.

**Date:** 2026-08-26
**Scope:** Investigation only. No repository files modified except this
report. No decision minted. Nothing repaired. Confirmed before starting: no
Gate 9 execution is currently running (the sourceRequestId implementation
decision, `tha-dec-5dfc0d5e1f21b822d11bada560734939`, was only minted this
turn, not approved or executed) — there was nothing to wait for.

## Governance re-check

`docs/architecture/README.md`: zero Gate mentions, unchanged.
`PROJECT_GOVERNANCE.md`: unchanged. Neither document says anything about
notification, callbacks, or execution-completion push mechanisms — this
entire topic is outside what either governs.

---

## The chain, traced end to end, split by side

This investigation spans two genuinely different systems: the **THA bridge**
(fully inspectable — every line of code was read this session) and the
**Claude Code harness's background-task mechanism** (not part of this
repository; only its documented contract and this session's own directly
observed behaviour are available as evidence, not source code).

### Bridge side — fully verified from source, zero push mechanism found

```
Claude/orchestrator
  -> POST /v1/tha/execute-decision (server.gate9.mjs:650-905)
       - mints executionId, writes initial QUEUED record to executions/*.json
       - spawns gate9-execution-runner.mjs detached (child.unref()) and
         returns HTTP 202 immediately -- the HTTP request/response cycle
         ends here; nothing about the caller's connection is held open
  -> gate9-execution-runner.mjs (110 lines, re-read in full this turn --
     unchanged from earlier full reads)
       - writes RUNNING
       - spawns gate8-execute-approved-decision.mjs as a child process and
         AWAITS it synchronously (execFileAsync)
       - Gate 8 runs the isolated worktree, worker, and Hermes review
         in-process, all synchronous/awaited within that one child process
       - Hermes itself (gate8-execute-approved-decision.mjs:350-480) is
         invoked as a plain blocking child-process CLI call
         (hermes.exe) -- verified: no separate async service, no
         session-resumable callback capability, just a spawned executable
         whose stdout is awaited directly
       - once the child exits, writes the terminal SUCCEEDED/FAILED record
         to executions/{executionId}.json
  -> (nothing further happens on the bridge side)
```

**Grepped directly, this turn:** `gate9-execution-runner.mjs` and
`server.gate9.mjs` contain zero matches for `fetch`, `http.request`,
`https.request`, `webhook`, `WebSocket`, `EventEmitter` (as an outbound
signal), `process.send`, or any callback/notify-URL parameter. There is no
Server-Sent-Events route, no WebSocket upgrade handler, no long-poll route —
only the existing plain `GET /v1/tha/executions/:id`, which returns whatever
the ledger file currently says, once, per request.

**Hermes itself (point 7):** verified — Hermes is a synchronous, blocking
CLI subprocess call (`hermes.exe`) inside Gate 8's own process; it has no
independent event/wake capability of its own to reuse. It cannot notify
anything after Gate 8 already awaits its exit.

**Conclusion: the bridge is 100% poll-based.** The only way to learn an
execution's terminal state is to read `executions/{executionId}.json` (via
`GET /v1/tha/executions/:id` or a direct file read) after the fact. This
appears to be a deliberate property of a local, single-operator governance
tool, not an oversight — nothing in `PROJECT_GOVERNANCE.md` or
`docs/architecture/` calls for push notification, and none of Gate 9's
existing consumers (`server.gate5.mjs`'s Activity Projection,
`complete-reconciliation-decision.mjs`) expect one either.

---

### Harness side — Claude Code's own background-task mechanism (not part of this repository)

This is not bridge code; it cannot be read as source in this repository. Two
kinds of evidence are available and are labelled as such, not conflated:

**Documented contract (from the tool's own description, available to me as
part of my operating instructions):** a Bash call with
`run_in_background: true` is stated to produce an automatic notification
when the backgrounded command exits — "you will be notified when it
completes" — without requiring a further user message to trigger that
notification.

**Directly observed in this conversation (not inferred, not assumed):**
early in this session, two background poll commands I started
(`bl80ykktp`, `bv2jh99lj`) were followed by a `<task-notification>` system
message with `<status>completed</status>` that arrived as its own event,
**before** any user "check status" message — i.e. the automatic mechanism
did fire, at least twice, exactly as documented. Later in the session, the
user began sending "check status" (or a clipboard instruction) shortly
after each background poll started, in every case before any automatic
notification had visibly arrived first. This does not prove the automatic
mechanism stopped working later — it is equally consistent with a race
where the user's manual message simply arrived first each time — but it
also means **this session cannot furnish a clean, later-session example of
the automatic path completing unprompted**, because it was consistently
preempted.

```
BACKGROUND_POLL_OWNER: the Bash tool's own run_in_background feature
                        (harness-level, outside this repository)
HOW_BACKGROUND_POLL_ACTUALLY_WORKS: I run a shell `until ... ; do sleep N;
                        done` loop against `GET /v1/tha/executions/:id`
                        inside the backgrounded command; the loop exits on
                        its own once the ledger shows a terminal status,
                        and the whole backgrounded command then exits
DOES_IT_SURVIVE_CONVERSATION_IDLE: per the documented contract, yes -- the
                        background process is not tied to a live
                        conversational turn; per this session's own
                        directly observed evidence (the two early
                        instances), yes
DOES_IT_WAKE_CLAUDE_AUTOMATICALLY: per the documented contract, yes; this
                        session directly observed it happen twice; this
                        session cannot additionally rule out that later
                        instances would also have fired automatically,
                        since a user message always arrived first
```

---

## Failure/edge paths

```
SUCCESS_PATH:            executions/{id}.json reaches SUCCEEDED; discoverable
                         only by reading it; no push
FAILURE_PATH:            same file reaches FAILED; same, no push
GATE8_CRASH_PATH:        gate9-execution-runner.mjs's own try/catch
                         (verified, lines ~95-110) catches any error from
                         the awaited child process (including a Gate 8
                         crash) and writes a FAILED record with the error
                         message attached -- this path is exactly as
                         poll-visible as a normal failure, no different
GATE9_RUNNER_CRASH_PATH: NOT COVERED. If the runner process itself is killed
                         (not the awaited Gate 8 child, but the outer
                         runner) between writing RUNNING and writing a
                         terminal state, nothing writes a terminal record at
                         all -- verified as an existing, disclosed gap in
                         the earlier docs/investigations/governance/
                         CONNECTED_ACTIVITY_LIFECYCLE_PROJECTION_INVESTIGATION.md
                         (Step 6): the record would stay at RUNNING forever,
                         with no distinct "stalled"/"orphaned" phase value
STALE_RUNNING_PATH:      same as above -- no watchdog anywhere in this
                         codebase detects a RUNNING record that has not
                         progressed; `activeExecution()` would keep treating
                         it as legitimately in-flight and block any new
                         execution indefinitely (409 execution_already_running)
POLL_PROCESS_FAILURE_PATH: if my own backgrounded polling shell dies (or the
                         harness process hosting it is killed) before its
                         `until` loop observes a terminal state, nothing
                         resumes it -- this is a harness-level concern, not
                         bridge code, and I have no code to inspect for it;
                         labelled Unknown, not guessed
```

**Bounded timeout/watchdog check (point 6):** none exists anywhere in this
codebase for a stale/stuck RUNNING execution. The only timeout present is
`gate9-execution-runner.mjs`'s own `execFileAsync` call to Gate 8, capped at
`30 * 60 * 1000` ms (30 minutes) — if Gate 8 itself hangs past that, the
runner's own await would eventually reject and the runner's catch block
would write FAILED. But if the **runner process itself** is killed (not
Gate 8 hanging), there is no timeout anywhere that would ever write a
terminal state — confirmed, not guessed.

---

## Answering the direct question

**IF I HAD NOT SENT "CHECK STATUS" DURING THE EXECUTIONS TODAY, WHAT WOULD
HAVE HAPPENED?**

Based on verified bridge-side evidence plus the documented and (twice)
directly-observed harness contract: my background polling command would
have continued running server-side, checking `GET
/v1/tha/executions/:id` every 15-20 seconds, for as long as it took the
real Gate 8 execution to finish (observed this session: roughly 1-4
minutes per execution, always well inside the loop's own 10-minute Bash
timeout and the runner's 30-minute internal cap). Once the ledger reached a
terminal state, the loop's own `until` condition would have become true and
the backgrounded shell command would have exited on its own. Per the
documented harness contract — and consistent with the two instances
directly observed earlier in this same session — that exit should trigger
an automatic notification back to me, without requiring you to send
anything, and I would have reported the result in that following turn
unprompted.

**What this cannot claim:** that this *would certainly* have happened for
every later execution in this session, since every later one was preempted
by your own message arriving first. That specific gap is reported as
genuinely unresolved, not glossed over.

---

## Root gap, ownership, and reusable mechanisms

```
EXECUTION_STATE_OWNER:      server.gate9.mjs (mints) + gate9-execution-runner.mjs
                            (writes lifecycle states) -- unchanged, no
                            second owner found or proposed
TERMINAL_STATE_WRITER:      gate9-execution-runner.mjs alone
TERMINAL_STATE_CONSUMERS:   GET /v1/tha/executions/:id (server.gate9.mjs),
                            server.gate5.mjs's Activity Projection (reads
                            the same files), complete-reconciliation-decision.mjs

HERMES_EXISTING_CAPABILITY: none reusable -- confirmed a plain blocking
                            CLI subprocess, no independent wake capability
REUSABLE_EXISTING_MECHANISM: the harness's own background-task completion
                            notification (Bash run_in_background) --
                            already documented, already observed working
                            twice this session, requires no new bridge-side
                            mechanism at all

ROOT_GAP:            not a missing push mechanism on the bridge (which is
                     deliberately, architecturally poll-only, matching every
                     one of its existing consumers) and not a broken harness
                     feature (the documented contract exists and fired
                     correctly at least twice this session) -- the gap is
                     that this session cannot demonstrate the automatic
                     path held up consistently later on, because a manual
                     message always arrived first each time. Whether that
                     reflects the automatic notification actually failing to
                     arrive, arriving but not being noticed/trusted, or
                     simply always losing a race to a faster human, is not
                     established by available evidence.
ROOT_GAP_STATUS:     Inferred for the "why" (I cannot instrument the
                     harness to prove which of the three explanations is
                     correct); Verified for the "what" (bridge is
                     poll-only; the documented automatic notification
                     contract exists and fired at least twice this session)

ARCHITECTURE_DRIFT:   no -- nothing in governing bridge architecture
                     promises push notification; it was never claimed
GOVERNANCE_DRIFT:     no
IMPLEMENTATION_DEFECT: no bridge-side defect found relative to its own
                     stated design (poll-only is consistent throughout);
                     the one genuine, separately-already-disclosed gap is
                     the runner-crash/stale-RUNNING case, unrelated to
                     notification timing
```

---

## Options

**A — Rely on the existing harness notification mechanism as-is; stop
proactively narrating "polling in the background" as if user action were
expected, and simply wait for the automatic notification to arrive before
reporting.** No new mechanism. Matches "do not create a second
execution-state owner or another assistant/orchestrator" directly — there
is nothing to create; the reusable mechanism already exists per the
documented contract and this session's own two confirmed instances.
Residual uncertainty: cannot fully rule out that the automatic path
sometimes doesn't fire in practice (Inferred, not Verified) — if that
occurs, forward progress would stall until a user message arrives, exactly
as observed today.

**B — Add a bridge-side push mechanism (webhook/SSE/callback URL) so Gate 9
actively notifies on completion.** Rejected as disproportionate: would
create a second, bridge-owned notification path duplicating what the
harness's own background-task mechanism is already designed to provide,
for a single-operator local tool with no other consumer that has ever asked
for push behaviour. Violates "do not create a second execution-state owner"
in spirit if it duplicates completion-signalling responsibility.

**C — Add a bounded watchdog/timeout inside the bridge itself (e.g. a
periodic sweep marking a RUNNING record stale after N minutes with no
progress) to at least guarantee a terminal-ish state is always eventually
reachable by polling, addressing the separate runner-crash/stale-RUNNING
gap identified above.** A real, smaller, more targeted fix for a distinct,
already-disclosed problem (not the notification-timing question this
investigation was asked to resolve) — worth its own future decision, not
bundled here.

**RECOMMENDED_OPTION: A**, with **C** flagged as a legitimate, separate,
smaller future decision addressing the distinct stale-RUNNING gap — not the
notification-timing question itself.

```
RISK: RED (per instruction framing) -- though the actual finding is that no
      bridge code needs to change; the risk classification concerns process/
      orchestration behaviour, not repository state
DECISION_REQUIRED: no, for the notification question itself -- the existing
      harness mechanism (Option A) requires no bridge change. A separate,
      optional future decision could address Option C's stale-RUNNING gap,
      but that is not what this investigation was asked to resolve and is
      not proposed for minting here.
```

---

Persisted at:
`docs/investigations/governance/EXECUTION_TERMINAL_NOTIFICATION_INVESTIGATION.md`

## TRUST CHECK

- Highest-risk claim still Inferred or Assumed: the root-gap explanation
  above (why later-session automatic notifications cannot be confirmed) is
  Inferred, not Verified — I cannot instrument or inspect the harness's
  internal notification delivery to determine definitively why a manual
  message always arrived first later in this session.
- Evidence required to verify it: a controlled trial — start a background
  poll and deliberately have the user send no further message at all,
  observing whether the automatic `<task-notification>` system message
  still arrives once the loop's `until` condition is met. This session's
  own conversation history cannot supply that evidence, because every later
  instance was preempted by a user message before such a trial could be
  observed.
