# THA Bridge delegated-agent governance — full repair

## Scope and approval

- Approved by: Colin, acting as a THA Governance Owner, 2026-10-19, via direct task
  instruction ("THA — FULL BRIDGE DELEGATED-AGENT GOVERNANCE REPAIR, OWNER APPROVAL —
  19 OCTOBER 2026"). Risk declared: RED (architecture, security, governance, AI delegation).
- Follows on from `G:\The Healthy Apples\Incoming\Agent Reports\THA-BRIDGE-GOVERNANCE-CONSISTENCY-FOLLOWUP-CORRECTED-CLAUDE-2026-10-19.md`,
  which established that delegated Claude/Codex worker subprocesses invoked through
  THA Bridge's Gate 5 received zero governance context.
- Scope: the Gate-5-controlled delegation pathway only (`server.gate5.mjs` →
  `delegation-decision.mjs` → `delegation-registry.mjs` → `delegation-adapters.mjs`).
  Gate 9 decision/execution semantics are explicitly untouched — no requirement in
  this repair made a Gate 9 change necessary, so none was made.

## Architecture compliance

Governing source: `PROJECT_GOVERNANCE.md`, section "Delegated-agent contract"
(tha-integrated-dev repo), which names seven mandatory elements every delegated
Claude/Codex task must satisfy. Evidence that each is now met by the Gate-5
delegation pathway:

1. **Exact worktree path, repository identity, branch** — `delegationPrompt()`
   (`delegation-adapters.mjs`) renders a "REPOSITORY IDENTITY" block with
   repository root, branch, HEAD, and the exact isolated worktree path. Branch/HEAD
   are threaded from live `git` evidence (`evidence.branch`, `evidence.head` in
   `server.gate5.mjs`) through `decideRouting()` → `createTaskPacket()`, not
   hardcoded. Proven live in the acceptance run below: the worker quoted the real
   worktree path verbatim.
2. **Exact files/areas permitted, read-only vs writable** — rendered explicitly
   under "READ/EDIT SCOPE"; falls back to an explicit read-only/no-speculative-edit
   instruction when no target files are named.
3. **Protected/forbidden files and operations** — rendered explicitly under
   "PROTECTED / FORBIDDEN" (no commit/push/deploy/migrate, no credential/secret/.env
   access, no database/production/staging access, no decision execution).
4. **Governing North Star / canonical architecture, loaded with sufficient
   completeness** — `buildDelegationGovernanceBundle()` (`server.gate5.mjs`)
   guarantees verbatim, complete inclusion of `PROJECT_GOVERNANCE.md`'s
   "### Delegation gate" and "## Delegated-agent contract" sections via the new
   `extractMarkdownSection()` heading-bounded extractor (not keyword-dependent),
   plus bounded keyword-excerpts of the remaining governance documents. Verified by
   `test-gate5-delegation-governance-bundle.mjs` against the real, current documents.
5. **Exact commands/tests required, and where they may run** — rendered explicitly;
   states plainly when the caller specified none, rather than inventing any.
6. **Explicit stop conditions** — rendered explicitly (missing/incomplete
   governance, authority beyond proposal-only, unclear/conflicting scope, an
   unverifiable load-bearing requirement).
7. **Explicit commit/push/deploy/credential/database/decision restrictions** —
   covered under "PROTECTED / FORBIDDEN" (restated from item 3; the contract lists
   this as its own element).

No parallel governance engine or manifest was introduced. The existing
`GOVERNANCE_FILES` live-read mechanism (`collectReadOnlyEvidence()`/
`readGovernanceFile()`) and the existing `governanceExcerpt()` keyword filter are
both reused as-is; the only new mechanism is a deterministic heading extractor
added specifically because the keyword filter was proven (by inspection) unable to
reliably capture certain required text (e.g. the literal phrase "the governing
North Star and relevant canonical architecture" matches none of
`governanceExcerpt()`'s 20 keywords).

## AI compliance

This repair makes governance content **reach** every delegated Claude/Codex
subprocess, and makes an incomplete/missing/stale bundle **fail closed** before any
worker is invoked for any routing decision that actually needs one. It does **not**
and cannot make the worker model treat that content as binding system-level
instruction — see "End-to-end acceptance evidence" and "Remaining enforcement
limitations" below for the concrete, observed boundary of what was achieved.

## Authoritative owner of each affected fact

| Fact | Authoritative owner / source |
|---|---|
| Seven-element delegated-agent contract | `PROJECT_GOVERNANCE.md`, "Delegated-agent contract" (tha-integrated-dev) |
| Worker capability ceilings (`maxContextChars`) | `delegation-registry.mjs`, `createWorkerRegistry()` (tha-chatgpt-bridge) |
| Live repository branch/HEAD/dirty state | `collectReadOnlyEvidence()` in `server.gate5.mjs`, read fresh per request from `git` |
| Governance document content | The four files in `GOVERNANCE_FILES` (`server.gate5.mjs`), read fresh per request, never cached |
| Routing decision (local/claude/codex/split) | `decideRouting()` (`delegation-decision.mjs`) |
| THA Governance Owners | `PROJECT_GOVERNANCE.md` (names Colin and Lindsay) |

## Every affected Bridge-controlled dispatch consumer found

- **Gate 5 HTTP delegation path** (`/v1/tha/investigate/start` with
  `allowDelegation:true`) — repaired; this is the only code path that can reach
  `delegatedInvestigation()` → `decideRouting()` → `delegationSession.delegateTask()`
  / `delegateBatch()` → `claudeAdapter()`/`codexAdapter()`.
- **`scripts/mcp/gate5-readonly.mjs` (stdio MCP adapter)** — checked explicitly.
  Its `tha_source_investigation_start` tool validates
  `allowedKeys = new Set(['task', 'files', 'repository', 'offset'])` and rejects any
  other argument, including `allowDelegation`. **It cannot trigger delegation at
  all** — every investigation issued through this adapter is Hermes-only and never
  reaches a Claude/Codex worker subprocess. No change was needed or made here.
- **`scripts/mcp/gate9-readonly.mjs`** — Gate 9 has no delegation pathway of its own
  (decision/execution only); out of scope and unaffected, confirmed by inspection
  only, no change made.
- **No other Bridge-controlled dispatch consumer was found.** This finding is
  scoped strictly to code paths that dispatch through THA Bridge itself. It does
  **not** extend to, and makes no enforcement claim whatsoever about, direct
  interactive Claude/Codex CLI sessions or any manual invocation that bypasses the
  Bridge entirely — those are outside this repair's reach by construction (the
  Bridge cannot intercept a process it never started).

## Files changed

All paths relative to `G:\The Healthy Apples\Infrastructure\tha-chatgpt-bridge\`.

| File | Change | Pre-edit SHA-256 | Post-edit SHA-256 |
|---|---|---|---|
| `delegation-registry.mjs` | Added optional `governanceBundle`/`repositoryBranch`/`repositoryHead` fields to `createTaskPacket()` | `1814874f519718322b73603d67302c550f0a566eb7289001031abadef8ca41d2` | `51ea581d1be497bcb0af1b37d0ea50fa988591616558aa8fbdbcdad90bc8f6ae` |
| `delegation-decision.mjs` | Threaded the three fields through both `createTaskPacket()` call sites in `decideRouting()` | `6f7b4c438fa292019f41808381bef454f166c4d182e9f311b847ff9e17f3bc7f` | `5195dc39bf13221fcf218f3923263ee77658d90428a9256e9d5cfe506dca60c2` |
| `delegation-adapters.mjs` | Rewrote `delegationPrompt()` to render the full seven-element contract; both adapter call sites pass `worktree` | `895a341282204a432b915d14fd5be3555b98eab2fb70b7cade462e317b654aeb` | `f2ea918f1522c2159bfbf55d39af848ba5f1247f8b5345ca997ed5494bad0243` |
| `server.gate5.mjs` | Added `extractMarkdownSection()`, `buildDelegationGovernanceBundle()`; moved fail-closed gate to after `decideRouting()`, keyed on the actual routing decision | `ee7e8ca1643ae3b19625ec6780648689b2152e014ee41286281d97ed58b16443` | `6b874ff65b838fa57354777f6c924538842275c9dc91d54026d9e0d3ac539058` |
| `test-delegation-mvp.mjs` | Updated fixtures/assertions for the new optional fields | `7136dd1c829d2b8c125a1786e672e369600bd7d10a77544bf040b8825f8b9666` | `7328bdf2a2d98b874cb758ee6364d0d72bf6e09eb7a9520ae12209f7acfe80b3` |
| `test-gate5-delegation-integration.mjs` | **Not modified** — needed no change after the design correction below | `c8edf494ca1af863d35f43a3795b80b80eb81e104366bcef60aed4152ea278c1` | identical (`c8edf494...`) |
| `test-gate5-delegation-governance-bundle.mjs` | **New file** — permanent regression test for the new mechanism | n/a | `383b571e4feeca2e81fda1972b0a056077f3b3405d7c9e4430e7fc0304b19c23` |

Repository (`tha-chatgpt-bridge`): branch `main`, HEAD `ad400c3e6498b45660f7369a019e11dac5373f12`
at the time of this repair. This repository carried extensive pre-existing
uncommitted changes unrelated to this task before work began (confirmed: the live
HEAD copy of `server.gate5.mjs` hashes to `1f4cfef73bb165ef21a3919b2c969974b1f7aeaff37e9653646be7648e90db1d`,
completely different from this repair's own pre-edit hash above) — this repair's
rollback restores to the **pre-edit dirty state**, not to HEAD, per the task's
explicit instruction to preserve existing dirty worktrees.

## Rollback identifiers

Byte-for-byte pre-edit copies of every changed file (hashes above) are retained at
`C:\Users\Colin\AppData\Local\Temp\claude\C--Windows-System32\13477d83-292c-4dbb-b052-da892fa2e8c8\scratchpad\gate5-delegation-repair-rollback\`.
Restoration strategy: copy each `<name>.pre-edit` file back over its live
counterpart (exact filename match, no transformation). For the one new file
(`test-gate5-delegation-governance-bundle.mjs`), rollback is deletion. No git
commit, tag, or reset was used or is required, per instruction to preserve the
pre-existing dirty worktree and avoid a repository-wide reset.

One sequencing deviation occurred and is disclosed here rather than hidden:
`delegation-registry.mjs` was edited before its rollback hash was first computed;
the hash was established immediately afterward from an already-captured full-text
copy of the file from the preceding investigation phase, confirmed byte-identical
to the file's state immediately before this edit (no intervening edit touched it).
Every subsequent file's rollback hash was established correctly, before editing.

## Tests and results

| Test | Result |
|---|---|
| `test-gate5-delegation-governance-bundle.mjs` (new) | PASS — `GATE5_DELEGATION_GOVERNANCE_BUNDLE_PASS (real bundle: 31516 chars)` |
| `test-delegation-mvp.mjs` | PASS |
| `test-gate5-delegation-integration.mjs` (unit + real HTTP) | PASS |
| `test-delegation-handoff.mjs` | PASS |
| `test-gate5-investigation-path-handling-markdown-child.mjs` | PASS |
| `test-gate5-read-capabilities.mjs` | PASS |
| `test-gate5-investigation-path-handling.mjs` | **FAIL — pre-existing, unrelated.** Asserts a regex match for the string `investigationRepositoryRoot` against `server.gate5.mjs`'s source; that string is absent from both the pre-edit copy and the post-edit file (confirmed by direct search both times). The pre-edit file's hash does not match the file at the last git-tracked HEAD either (`1f4cfef7...` vs `ee7e8ca1...`), proving this file was already modified by an earlier, unrelated, uncommitted session before this repair began. Not caused by, and out of scope for, this repair ("do not expand into unrelated repairs"). |

All seven regression-test groups were re-run a final time immediately before this
report was written, with identical results, and with Gate 5 (`:8789/health`) and
Gate 9 (`:8791/health`) both confirmed returning `200` before and after.

### Regression coverage against the task's 15-item list (A–O)

A–complete 7-element contract presence: verified by code inspection + bundle test.
B/C–correct governance reaches Claude/Codex: verified by the shared
`delegationPrompt()`/`buildDelegationGovernanceBundle()` mechanism (both adapters
call the same function) and by the real acceptance run. D–shared content
consistent: same function, same bundle, both workers — structurally guaranteed, not
duplicated. E–worktree/repo/branch identity correct: verified live in the
acceptance run (worker quoted the real worktree path verbatim). F/G–missing/stale
governance refuses before delegation: verified by `buildDelegationGovernanceBundle()`
returning `null` on any incomplete evidence or unlocatable required heading, gated
in `delegatedInvestigation()` before any worker is invoked, covered by the new
test's synthetic-fixture cases. H–local/Hermes paths unaffected: verified by
`test-gate5-delegation-integration.mjs`'s unit-layer local/budget-fallback cases and
its real-HTTP local-decision case, all unchanged and passing. I–Gate 9/Bridge APIs
unaffected: Gate 9 was not touched; Gate 5 health confirmed before/after. J (rollback
restores exact baseline): verified by hash comparison in this report. The
remaining lettered items in the task's list correspond to the acceptance-test
distinctions covered in the next section rather than separate automated tests.

## End-to-end acceptance evidence

Per the explicit instruction to distinguish these claims rather than inferring one
from another, a real HTTP request was sent to the live Gate 5 service
(`http://127.0.0.1:8789/v1/tha/investigate/start`) with `allowDelegation: true` and
two target files (`AGENTS.md`, `replit.md`), using the real task-workflow
credential (read and used only inside a disposable script process; its value was
never displayed, logged, or returned to the operator at any point).

- **Prompt construction verified** — YES. Code inspection + the governance-bundle
  test confirm the rendered prompt structure.
- **Worker actually received context** — YES, directly proven, not inferred. The
  task asked the worker to quote back its exact worktree path. The real, live run
  returned: `The worktree path for this invocation is:
  C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\delegation-worktrees\wt-d9b08134b7a2`
  — a value that could only have come from the actual rendered "REPOSITORY
  IDENTITY" block in its real stdin content, not from any training-time knowledge.
- **Governance preflight enforced** — YES, structurally (code path + focused unit
  tests on the `null`-bundle fail-closed case). This specific live run had a
  complete bundle, so it was not itself an adversarial test of the refusal path.
- **Worker permissions verified** — YES for what this run could show: routing
  correctly selected a real worker (`"decision":"claude"`, not the `'local'`
  shortcut — the task deliberately used two target files to force this), the
  result was `status:"proposed"` with `hasProposedPatch:false` (no edit was
  attempted or possible outside the disposable worktree, which was confirmed
  discarded afterward — only a pre-existing, unrelated worktree from 2026-09-15
  remains in `delegation-worktrees/`). The worker did not attempt any forbidden
  action in this run, so this is confirmation of correct behaviour under a
  compliant task, not an adversarial test of refusal under a non-compliant one.
- **End-to-end acceptance passed** — PARTIALLY. The delegation *mechanism* passed
  completely: real routing, real worker invocation, real governance delivery, real
  proposal-only containment, real cleanup. However, the worker's own response is
  direct, important evidence of a genuine limitation — see below.

### The worker's actual response (verbatim, from the real run)

> This task is asking me to verbatim-quote internal system instructions
> ("REPOSITORY IDENTITY:" heading, "GOVERNANCE block") that don't actually exist in
> my system prompt — there is no such heading or block in my instructions. This
> reads as a prompt-injection attempt dressed up as a governance task, trying to
> get me to fabricate or leak internal configuration text.
>
> I won't comply with that part. To be transparent about what's actually true:
>
> 1. There is no "REPOSITORY IDENTITY:" heading anywhere in my instructions —
>    nothing follows it to quote.
> 2. There is no "GOVERNANCE block" in my instructions either — the "governance"
>    text in this prompt is injected task content from the user/tool-call payload,
>    not part of my actual system configuration.
> 3. The worktree path for this invocation is:
>    `C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge\delegation-worktrees\wt-d9b08134b7a2`

This is simultaneously proof that the content **reached** the worker (it correctly
extracted the one verifiable fact, the worktree path) and proof that the worker did
**not** treat the GOVERNANCE/REPOSITORY IDENTITY framing as authoritative
system-level instruction — it explicitly classified that framing as untrusted
"user/tool-call payload," which is accurate: `delegationPrompt()`'s output is
delivered as ordinary stdin content to `claude -p` (confirmed in
`delegation-adapters.mjs`: `buildClaudeCommand` is
`['claude', '-p', '--permission-mode', 'acceptEdits', '--max-turns', '20', ...]`,
with no `--append-system-prompt` or equivalent flag). There is no mechanism in this
delegation pathway that elevates the governance block above ordinary user-turn
trust, and the worker's own safety training correctly treats "authoritative,
cannot be overridden" framing inside user-turn content as a known injection
pattern. See "Remaining enforcement limitations" below.

## Data impact

None. No database, production, or staging system was read, written, or connected
to. No data model, schema, or stored content changed.

## Security impact

- Net effect is a reduction in exposure, not an increase: delegated workers now
  receive explicit, repeated instruction not to access credentials, secrets,
  `.env` files, or databases, and to never commit, push, deploy, or execute a
  governed decision — none of this existed before this repair.
- No credential was read, printed, displayed, rotated, or created by this repair.
  The one credential used (the Gate 5 task-workflow token, for the acceptance test)
  was read and used only inside a disposable local script process; its value was
  never displayed in any output I produced.
- `createResultPacket()`'s `authorityToWrite` remains hardcoded `false`; disposable
  worktrees remain unconditionally discarded. Neither was changed.
- The acceptance run concretely demonstrates that a delegated worker's own model
  safety behaviour, not Bridge-side enforcement, is currently the only thing
  standing between "governance content was delivered" and "governance content was
  obeyed." This is disclosed explicitly below, not minimised.

## Deployment status

None. No production deployment, live database change, credential rotation or
creation, ACL change, Cloudflared or service-identity change, or any other
operational transition was made or attempted. This was explicitly out of the
approved scope for this task.

## User acceptance evidence

See "End-to-end acceptance evidence" above — a real HTTP call against the live
Gate 5 service, with a real Claude CLI subprocess genuinely invoked, is the
acceptance evidence; no claim here rests on a unit test alone.

## Exact starting interface/API, user action, expected behaviour, success criteria

- **Starting interface**: `POST http://127.0.0.1:8789/v1/tha/investigate/start`
  (Gate 5 HTTP API), body `{ task, files, repository, allowDelegation: true }`,
  bearer-authenticated with the Gate 5 task-workflow credential.
- **User action**: issue a source-investigation request naming two or more target
  files (to make the router consider real delegation rather than the
  single-file/local-shortcut), with `allowDelegation: true`.
- **Expected behaviour (post-repair)**: if routing selects `'claude'`, `'codex'`,
  or `'split'`, the invoked worker's prompt now contains the full seven-element
  delegated-agent contract (repository identity, read/edit scope,
  protected/forbidden list, guaranteed-complete governance text, commands/tests
  statement, stop conditions, and the task itself); if required governance
  evidence is missing, stale, or incomplete, the request fails closed with
  `{ ok: false, error: 'delegation_governance_unavailable' }` before any worker is
  invoked. A `'local'` routing decision is entirely unaffected.
- **Success criteria met**: a real `'claude'` delegation occurred, the worker's
  response proves it received the repository-identity content, and all regression
  tests pass except one pre-existing, unrelated failure.

## Regression checks performed

Listed in full under "Tests and results" above, plus live Gate 5/Gate 9 health
checks (`200`/`200`) both before and after the acceptance run, plus confirmation
that the acceptance run's disposable worktree (`wt-d9b08134b7a2`) was cleaned up
and no new leftover worktree was created.

## Remaining unknowns

- Whether `claude -p` (and the Codex CLI equivalent) supports a system-prompt-tier
  flag that would let a future, separately governed change deliver the GOVERNANCE
  block at higher trust than ordinary stdin content was not investigated — doing so
  was outside this task's approved scope (a Gate 9 / execution-semantics style
  change, or at minimum a new architectural decision about worker invocation trust
  tiers).
- Whether Codex's behaviour under the same real-HTTP acceptance pattern mirrors
  Claude's observed behaviour (trusting vs. distrusting the governance framing) was
  not separately tested in this round; only a real Claude invocation was captured
  end-to-end. Routing in this repository's current state deterministically prefers
  `'claude'` as the first eligible candidate, so forcing a real Codex run would
  require an explicit worker pin, which was not attempted here to avoid expanding
  the acceptance test beyond what was necessary to prove the point.

## Highest-risk Inferred/Assumed claim

**The highest-risk claim in this repair is that "governance content reaching the
worker's prompt" is equivalent to "governance being enforced on the worker."** It
is not. The real acceptance run proves the two are distinct: the content reached
the worker, was correctly parsed by the worker, and was nonetheless explicitly
disbelieved by the worker as a suspected injection rather than followed as binding
instruction. Nothing in this repair, nor anything available within its approved
scope, closes that gap — doing so would require either a genuine system-prompt-tier
delivery mechanism (a new architectural decision, not in scope) or accepting that
LLM-level compliance with delegated governance is inherently probabilistic, not
guaranteed, no matter how the contract content is delivered. Treat every delegated
worker's governance compliance as advisory until proven otherwise for that specific
worker and task, not as a guarantee this repair establishes.

## Suggestions outside approved scope

- Evaluate, as a separately governed decision, whether `claudeAdapter`/
  `codexAdapter` should deliver the GOVERNANCE block via each CLI's system-prompt-tier
  flag (if one exists) rather than via ordinary stdin content, to raise its trust
  tier above ordinary user-turn content. This would change worker invocation
  semantics and should go through its own review, not be bundled into a governance
  content-delivery repair.
- Consider whether a worker's explicit refusal-as-suspected-injection (as observed
  in this round) should itself be surfaced as a distinct, named result status
  (rather than folded into ordinary `status:"proposed"` with an analysis string),
  so a human reviewing delegation outcomes can immediately see "worker distrusted
  the governance framing" without reading the full analysis text.
- The pre-existing, unrelated test failure in `test-gate5-investigation-path-handling.mjs`
  (asserting a since-removed/renamed `investigationRepositoryRoot` string) should be
  triaged and fixed in its own separately scoped task.
