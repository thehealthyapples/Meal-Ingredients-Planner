# sourceRequestId Provenance — Testability Gap Blocking a Third Mint

**Date:** 2026-08-27. Investigation only. No replacement decision minted.

## Re-verification of the three recurring failure modes (from `executions/tha-exec-1787784725362-7d39e91b.json`, read directly)

1. **EISDIR fixture-path failure — Verified.** Stack trace:
   `readFileHandle -> createAndBindDecision (decision-factory.mjs:274:19) ->
   test-decision-factory-provenance.mjs:86:20`. Line 274 in decision-factory.mjs
   is inside the new sourceRequestId validation code (the `readFile` on the
   receipt path), so the crash is decision-factory.mjs correctly trying to read
   a path that, on disk, was a directory rather than a file. The directory
   was created by the test's own fixture-setup code, not by decision-factory.mjs.

2. **Duplicated receipt field `createdAt` — Verified.** Identical assertion
   failure text as the prior (separate) failed execution:
   `AssertionError: decision artifact must not duplicate receipt field "createdAt"`.

3. **Worktree-vs-real-repository cleanup / unrequested baseline-path filtering — Verified (Hermes verdict), root cause Inferred.**
   Hermes: *"adds an unrequested baseline-path filtering behavior, and the
   test targets the worktree for registry/artifact checks and restoration
   instead of consistently handling the real bridge repository state."*
   Inferred (not verified against the actual worktree diff, which no longer
   exists -- the worktree was already cleaned up before this investigation):
   the worker likely pattern-matched onto the existing `dirtyPreState.baselineFiles`
   / `computeScopeRollbackPlan` baseline-filtering concept already present
   elsewhere in this codebase (`gate8-repair-loop.mjs`) and mistakenly
   reimplemented something resembling it for the test's own cleanup, instead
   of the much simpler "capture registry bytes, restore registry bytes"
   the decision actually asked for.

None of the three findings changed from the prior investigation. Proceeding
per instruction.

## Pattern investigation (required before any mint)

**REPOSITORY_PATH_PATTERN_REUSED: KNOWN.** `const BRIDGE =
path.dirname(fileURLToPath(import.meta.url));` is the standard idiom used
identically in `decision-factory.mjs` itself and in every `prepare-*-decision.mjs`
script in this repository. Since `test-decision-factory-provenance.mjs` sits
in the same directory as `decision-factory.mjs` in every real run context
(both the live bridge repo and an isolated worktree copy both keep the two
files side by side), the test computing its own bridge-root the same way
naturally resolves to the same `preparation-receipts/` directory
`decision-factory.mjs` will look in -- no cross-file import needed.

**FIXTURE_PATTERN_REUSED: NO SAFE EXISTING HELPER -- exact construction steps must be bound directly, not delegated to an import.**
The only existing code that builds a real preparation-receipt fixture is
`writePreparationReceipt()` / `PREPARATION_RECEIPTS_DIR`, exported from
`server.gate5.mjs`. Checked directly: `server.gate5.mjs` calls
`server.listen(PORT, HOST, ...)` at true top level (line 2359), unguarded --
importing this module for any reason binds port 8787 immediately as a side
effect. `test-gate5-read-capabilities.mjs` already pays this cost because it
*is* the Gate5 server's own test. Importing it into an unrelated
decision-factory-provenance test would be undisclosed new behaviour (a stray
HTTP listener, or an `EADDRINUSE` collision with a real running Gate5
server) -- exactly the kind of scope creep this retry is trying to eliminate.
Conclusion: no existing helper is safe to reuse here. Per the fallback
explicitly allowed by the brief ("If no helper exists, bind the exact
construction pattern in the decision instructions"), the mechanical fixture
contract below specifies the literal steps instead.

**CLEANUP_PATTERN_REUSED: UNKNOWN -- no existing precedent found.**
**REGISTRY_BINDING_PATTERN_REUSED: UNKNOWN -- no existing precedent found.**
Searched every test file in the repository for any prior test that (a) calls
the real `createAndBindDecision` / `bindDecisionAsCurrent` against the live
governed root and (b) restores `gate9-current-decision.json` afterward.
Found: `test-gate8-worker-prompt-quality.mjs` references
`createAndBindDecision` only as a string literal inside a mock decision
object -- it never calls it. No other test file references
`gate9-current-decision.json`, calls `createAndBindDecision`, or contains a
capture/restore pattern for the registry. Every real, permanent
`prepare-*-decision.mjs` script in this repository is a one-shot governance
action, never a test that undoes itself.

**This confirms a genuine testability gap, not a wording problem.** The
failed decision's test instructions asked the worker to invent, from prose
alone, a wholly novel test pattern -- mutate the live governed registry
via real decision creation, then restore it -- with zero working code in
the repository to model it on. Both execution attempts reached exactly this
part of the design (attempt 3 in each case) and failed it in a way
consistent with "invented under uncertainty," not "ignored the instruction."

## Per instruction: STOPPING before mint

> "If there is no safe existing precedent for registry/artifact cleanup,
> STOP and report the exact testability gap before minting."

That condition is met. No replacement decision has been prepared or minted.

## What would close the gap (options, not a decision)

- **(a)** Add a small, dedicated, real helper for this exact pattern first
  (e.g. `captureRegistrySnapshot()` / `restoreRegistrySnapshot()` in
  `decision-factory.mjs` or a sibling test-support file) as its own bounded
  decision, giving the provenance test a real function to call instead of
  inventing the capture/restore logic inline. This directly produces the
  "existing helper" the brief says to prefer.
- **(b)** Write the capture/restore logic directly in the replacement
  decision's instructions as an exact, literal code shape (not prose
  description) narrow enough that there is nothing left to invent --
  effectively promoting the prose to pseudocode precise enough to leave no
  discretion. Cheaper than (a), no new file, but still asks the worker to
  transcribe rather than reuse.
- **(c)** Reconsider whether this test needs to exercise the real registry
  end-to-end at all for every case, versus isolating the registry-touching
  assertions to fewer cases and covering the rest (validation/fail-closed
  paths, which throw before any registry rebinding per the design) without
  ever calling the real `createAndBindDecision`.

No option has been chosen. This is a design call, not something the
persisted evidence resolves by itself.
