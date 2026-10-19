# Request → Decision Canonical Correlation Investigation

**Date:** 2026-08-26
**Scope:** Investigation only. No code, route, or decision implementation
beyond minting one bounded decision at the end, per instruction. The
verification chain and canonical lifecycle consumption work are treated as
closed and were spot-re-verified only where this investigation required it.

## Governance re-check — no drift

`docs/architecture/README.md`: zero Gate 5/7/9 mentions, unchanged.
`PROJECT_GOVERNANCE.md`: "Gate 9 remains the sole governed implementation
execution authority," zero active bootstrap appointments, unchanged.
**Verified**, re-read this turn.

---

## STEP 1 — Request identity owner

```
REQUEST_ID_OWNER:        server.gate5.mjs::startReadRequest()
REQUEST_ID_FORMAT:       `tha-read-${randomBytes(18).toString('hex')}`
                         (server.gate5.mjs:1671) -- Verified
REQUEST_STATE_OWNER:     two plain in-memory Map()s in the same file:
                         `readRequests` (live) and `expiredReadRequests`
                         (post-expiry retention only) -- Verified,
                         server.gate5.mjs:101-102
REQUEST_PERSISTENCE:     in-memory only. Zero disk writes anywhere in this
                         lifecycle -- Verified: the only output function,
                         `readEvent()` (server.gate5.mjs:109-115), is a bare
                         `console.log(JSON.stringify(...))`, not a file
                         write. No other function in the request lifecycle
                         touches the filesystem.
REQUEST_LIFETIME:        live for READ_REQUEST_TTL_MS = 15 minutes
                         (server.gate5.mjs:92), then moved to
                         `expiredReadRequests` holding only
                         `{requestId -> retentionExpiresAt}` (id and a
                         timestamp -- no requestType, no createdAt, no
                         content) for another 15 minutes, then deleted
                         entirely (`cleanupReadRequests()`,
                         server.gate5.mjs:117-148). Also LRU-capped by
                         `MAX_READ_REQUEST_RECORDS` regardless of time.
REQUEST_TERMINAL_STATES: exactly two stored values: `'complete'`,
                         `'failed'` (server.gate5.mjs:1703, 1714, 1723).
                         `'expired'` is not a stored status -- it is
                         computed only at read time by
                         `activityStatusForReadRequest()`, purely from
                         comparing `expiresAt` to now.
```

**Survives a bridge restart:** nothing. Both Maps are process memory;
nothing about a request's existence, content, or outcome is written
anywhere on disk by this codebase.

**Consumers found:** `requestSummary()` (poll response shape),
`readRequestActivityRecords()` (Activity Projection's `read_request` kind),
`tha-cli.mjs`'s `poll` subcommand (a thin HTTP wrapper, confirmed by direct
read: it only ever takes a `requestId` as a CLI argument typed by the
operator -- it does not generate, store, or forward one anywhere).

---

## STEP 2 — Decision creation path

Traced exactly, every boundary named:

```
prepare-*-decision.mjs (or tha-cli.mjs's `decision` subcommand, an HTTP
wrapper around the same underlying Gate 9 registry)
  -> decision-factory.mjs::createAndBindDecision({purpose, repositoryRoot,
     scope, risk, nonGoals, verificationGates, scopeFileInstructions})
  -> writes gate7-*.json (decision artifact) + gate63-*-receipt.json
     (evidence receipt) + gate63-*-manifest.json (dirty pre-state manifest)
  -> bindDecisionAsCurrent() validates and atomically replaces
     gate9-current-decision.json (the single-slot current-decision registry)
```

**No step in this chain reads from, or is triggered by, a Gate 5 request.**
`createAndBindDecision()`'s full parameter list (`purpose`, `repositoryRoot`,
`scope`, `risk`, `nonGoals`, `verificationGates`, `scopeFileInstructions`)
contains no request-shaped input. Every `purpose` field observed across all
70 historical decision artifacts is free-text prose written by whoever
authored the `prepare-*.mjs` script -- **verified this is prose, not a
functional link**: the two files that mention `readRequests`/
`requestSummary` in their source
(`prepare-pipeline-stabilisation-decision.mjs`,
`prepare-read-capabilities-decision-factory-decision.mjs`) do so only inside
their `purpose` text, describing changes those decisions made *to* the
`readRequests` mechanism itself (adding idempotency, adding observability
fields) -- neither one consumes an actual request object or requestId to
construct itself.

"Do not assume the user manually copying a prompt is part of the canonical
system unless repository evidence says so" -- confirmed: no repository
evidence describes or automates any such step; every decision this session
(and, by the sweep below, every decision ever recorded here) was authored
directly by a human or agent running a script, with no code-level dependency
on any Gate 5 request having occurred.

---

## STEP 3 — Exhaustive provenance-field search

Searched `decision-factory.mjs`'s complete schema, `gate8-repair-loop.mjs`,
`server.gate9.mjs`, and **every one of the 70 decision artifacts and 66
evidence receipts that exist in this repository today** (re-counted live
this turn -- more decisions were minted since the prior investigation's
count of 68) for `requestId`, `sourceRequestId`, `preparationRequestId`,
`parentRequestId`, `originatingRequest`, `provenance`, `source`,
`sourceReceipt`.

One near-match, checked and disambiguated: every evidence receipt does carry
a `provenance` object (`decision-factory.mjs:337`) -- read directly, its
actual shape is `{generator: 'decision-factory.mjs', decisionArtifact,
manifestArtifact}`. **This is decision-generation bookkeeping (which script
and sibling files produced this receipt), not request provenance.**
Confirmed by reading a live example
(`gate63-decision-role-canonical-lifecycle-consumption-no-...-receipt.json`).

| FIELD | OWNER | SOURCE | CARDINALITY | CANONICAL_LINK |
|---|---|---|---|---|
| `provenance` (receipt) | decision-factory.mjs | generator bookkeeping | 1:1 receipt:decision | **no** (unrelated to requests) |
| (any request-shaped field) | — | — | — | **no — none exists anywhere** |

**EXISTING_CANONICAL_LINK: request → decision: CANONICAL LINK ABSENT** --
re-verified live, not carried over from the prior investigation's claim.

---

## STEP 4 — Correct owner to extend, if a link is ever added

`decision-factory.mjs::createAndBindDecision()` is the correct, singular
extension point -- it is already the sole owner of decision-artifact
creation, already accepts a fixed, explicit parameter object (not scope
inference), and already has one precedent for exactly this additive pattern:
the `idempotencyKey` field added to `POST /v1/tha/prepare-task/start` in a
past decision, explicitly designed as **optional**, with "omitted key ->
byte-identical to current behaviour for every existing caller" as its own
stated compatibility bar (`prepare-pipeline-stabilisation-decision.mjs`'s
own purpose text, read directly). Any `sourceRequestId` addition should
follow that exact precedent: optional, additive, zero effect on any existing
caller.

Rejected: Activity Projection is not the correct owner (it would have to
guess), and neither is a brand-new standalone "provenance service" (would
duplicate `decision-factory.mjs`'s existing role as sole decision-creation
owner).

---

## STEP 5 — Cardinality

```
REQUEST → DECISION_CARDINALITY: 0 or many. Today, in practice, every
  request produces exactly zero decisions (no automated path exists). If a
  link is ever added, nothing about a single investigation should be
  artificially capped at producing at most one decision -- one investigate
  request could legitimately inform several small bounded decisions.
DECISION → REQUEST_CARDINALITY: 0 or 1. Demonstrated directly by this very
  session: every decision created in this engagement (all 12 of them) was
  authored with zero Gate 5 request behind it -- confirming decisions
  routinely exist with no originating request at all. A future
  sourceRequestId field must therefore be optional/nullable, never required.
```

Not forced to 1:1, per instruction -- the evidence itself (this session's
own decision-creation pattern) rules out treating "no request" as an
exceptional case.

---

## STEP 6 — Historical/ephemeral consequence (the load-bearing finding)

**EPHEMERAL_REQUEST_PROBLEM: real, verified, severe.** If a decision
persisted `sourceRequestId: "tha-read-<hex>"` today, that identifier would
refer to an in-memory Map entry that:

- is fully gone within **30 minutes at most** (15-minute live TTL + 15-minute
  post-expiry retention window, `server.gate5.mjs:92,117-148`) even under
  ideal conditions, sooner under `MAX_READ_REQUEST_RECORDS` LRU eviction,
- is **instantly** gone on any bridge process restart (pure in-memory state,
  no disk write anywhere in the request lifecycle -- verified above),
- while the decision artifact referencing it is meant to be a **durable**
  governance record (70 decision artifacts persist today, the oldest from
  days ago, none ever deleted).

**PERSISTENT_PROVENANCE_ANCHOR: none exists.** No file, database, or other
durable store anywhere in this codebase records a request's existence,
content, or outcome. `console.log` output (`readEvent()`) is not a
code-guaranteed, structured, queryable record this system treats as
authoritative -- whether it survives anywhere depends entirely on external,
un-governed process-launch redirection, not on anything this repository's
own architecture guarantees.

**STOP, per instruction: request persistence/provenance must be resolved
before request → decision correlation can be canonical.** Adding
`sourceRequestId` alone (Option A) would create exactly the "dangling
reference whose meaning becomes unverifiable after restart" the instructions
warned against -- true in nearly every real case (any decision created more
than ~30 minutes after its originating request, or after any bridge
restart, which is the common case, not the exception).

---

## STEP 7 — Activity Projection role (once/if the canonical link exists)

Minimum future change, once Steps 4-6 are actually resolved: the Activity
Projection's `read_request` record kind would gain a `decisionId` field
(direct, sourced from the decision artifact's own `sourceRequestId`,
resolved in reverse -- or more simply, the `gate9_registry`/`gate9_execution`
records would gain a `sourceRequestId` field, direct from the decision
artifact) -- project only, no inference, no confidence scoring, no
timestamp-proximity guessing. Not designed further here, per instruction not
to implement.

---

## Architecture compliance

```
CANONICAL REQUEST IDENTITY SINGULAR:   yes -- one generation site
                                       (startReadRequest, one randomBytes
                                       call)
CANONICAL DECISION IDENTITY SINGULAR:  yes -- one generation site
                                       (createAndBindDecision's sha256-derived
                                       decisionId)
PROVENANCE OWNER SINGULAR:             n/a today -- no provenance owner
                                       exists yet (this is the gap)
NO DUPLICATED STATE:                   yes -- nothing proposed duplicates
                                       existing state
NO DUPLICATED WORKFLOW:                yes -- the recommended fix (Option B)
                                       extends server.gate5.mjs's own
                                       existing request-lifecycle functions,
                                       does not create a second request
                                       tracker
ACTIVITY PROJECTION REMAINS CONSUMER:  yes -- Step 7 confirms projection-only,
                                       no invention, deferred entirely
EXISTING ARCHITECTURE EXTENDED:        yes -- server.gate5.mjs gains one new,
                                       minimal, additive persistence point at
                                       an existing lifecycle transition
                                       (request reaching a terminal state);
                                       decision-factory.mjs is NOT touched by
                                       this decision (that is the separate,
                                       later Option A)
```

**Consumers found of the current (ephemeral) request state:**
`requestSummary()`, `readRequestActivityRecords()`, `tha-cli.mjs poll`. None
would be affected by adding a new, separate, minimal persistence write at
terminal-state time -- it is purely additive.

---

## OPTIONS

**A — Extend decision-factory.mjs with an optional `sourceRequestId`
alone.** REJECTED as a standalone first step: per Step 6, this creates a
reference to state that is almost always already gone by the time it would
be dereferenced. Not rejected as a concept -- deferred until B exists.

**B — Persist a minimal, immutable preparation/provenance receipt at the
moment a Gate 5 request reaches a terminal state (complete/failed/expired),
written by `server.gate5.mjs` itself.** Recommended as the necessary first
step. Minimal by design: `{requestId, requestType, createdAt, expiresAt,
terminalStatus, terminalAt}` only -- explicitly NOT the request's actual
investigation content/results (avoiding a second copy of Hermes output or
any sensitive content; the point is durable *identity*, not durable
*content*). This is what Step 4 identified as the correct extension point's
true prerequisite: `createAndBindDecision()` cannot honestly accept a
`sourceRequestId` until there is something durable for that id to
anchor to.

**C — Reconstruct request→decision relationships inside Activity Projection
via inference.** REJECTED, per instruction and per this investigation's own
findings -- there is no reliable signal to infer from (timestamps, filenames,
ordering are all explicitly disallowed, and this session's own history
proves ordering/timestamp proximity would be actively misleading: many
decisions this session had zero request anywhere nearby in time).

**Do not combine A and B:** confirmed separable -- different owner
(`server.gate5.mjs`'s request lifecycle vs. `decision-factory.mjs`'s decision
creation), different files, and B is a genuine prerequisite for A to mean
anything, not an optional enhancement to bundle in. **Recommended
sequencing: B now (this decision), A later, as its own separate,
subsequently-approved decision, only once B's receipts exist and have been
observed to actually anchor correctly.**

**RECOMMENDED_OPTION: B**

---

## REQUIRED OUTPUT

```
REQUEST → DECISION CANONICAL CORRELATION INVESTIGATION

REQUEST_OWNER:       server.gate5.mjs::startReadRequest() / readRequests Map
REQUEST_PERSISTENCE: in-memory only, zero disk writes, ~30-minute maximum
                     lifetime, instant loss on restart
DECISION_OWNER:      decision-factory.mjs::createAndBindDecision()
DECISION_CREATION_PATH: prepare-*.mjs / tha-cli.mjs -> createAndBindDecision
                     -> gate7-*.json + gate63-*-receipt.json ->
                     bindDecisionAsCurrent -> gate9-current-decision.json

EXISTING_CANONICAL_LINK: ABSENT (re-verified live, exhaustive sweep of all
                     70 decision artifacts + 66 receipts)
EXISTING_PROVENANCE_FIELDS: one near-match found and disambiguated
                     (receipt.provenance = decision-generation bookkeeping,
                     unrelated to requests) -- no genuine request-provenance
                     field exists anywhere

REQUEST→DECISION_CARDINALITY: 0 or many (not capped at one)
DECISION→REQUEST_CARDINALITY: 0 or 1 (demonstrated directly: every decision
                     this session had zero originating request)

EPHEMERAL_REQUEST_PROBLEM: real and severe -- request identity fully expires
                     within ~30 minutes and instantly on restart; decisions
                     are durable indefinitely. A bare sourceRequestId
                     reference would be dangling in the overwhelming
                     majority of real cases.
PERSISTENT_PROVENANCE_ANCHOR: none exists today

CORRECT_OWNER_TO_EXTEND: decision-factory.mjs (for the eventual
                     sourceRequestId field, later) -- but server.gate5.mjs
                     first, for the provenance receipt this decision
                     actually adds

ACTIVITY_PROJECTION_ROLE: projection-only once the link exists; not designed
                     further here

CANONICAL_IDENTITY_SINGULAR: yes
OWNERSHIP_SINGULAR:          yes (server.gate5.mjs for the new receipt;
                             decision-factory.mjs remains untouched by this
                             decision)
DUPLICATED_STATE:            no
DUPLICATED_WORKFLOW:         no

OPTIONS:
A: sourceRequestId alone -- deferred, not rejected outright, sequenced after B
B: minimal persisted preparation/provenance receipt at request terminal
   state, owned by server.gate5.mjs -- RECOMMENDED, prepared below
C: heuristic inference inside Activity Projection -- REJECTED

RECOMMENDED_OPTION: B

RISK: RED
DECISION_REQUIRED: yes -- for B only. A and B are separable RED
  architectural changes (different owner, different file, B is a genuine
  prerequisite). Not bundled, per instruction.
```

**Bounded decision (Option B) -- minted below, per "prepare ONE bounded RED
decision only... do not implement it."**

Persisted at:
`docs/investigations/governance/REQUEST_DECISION_CANONICAL_CORRELATION_INVESTIGATION.md`

## TRUST CHECK

- Highest-risk claim still Inferred or Assumed: none of the ownership/
  persistence/cardinality findings are Inferred or Assumed -- all directly
  re-verified this turn (in-memory-only confirmed by reading every function
  in the request lifecycle; the `provenance` near-match personally read and
  disambiguated; the 70-artifact/66-receipt sweep re-run live, not reused
  from the prior investigation's smaller count).
- Evidence required to verify the one remaining soft judgement call: whether
  the minimal receipt shape proposed for Option B (`requestId, requestType,
  createdAt, expiresAt, terminalStatus, terminalAt` -- deliberately excluding
  content) is the right minimum, or whether governance wants more/less in
  it. That is a design preference to confirm at approval time, not a fact
  gap.
