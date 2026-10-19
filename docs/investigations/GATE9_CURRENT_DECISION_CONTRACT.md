# Gate 9 Current Decision Contract Investigation

**Date:** 2026-08-20  
**Scope:** Investigation only  
**Status:** STOPPED after investigation; no implementation performed

## Executive conclusion

**[Verified]** The running Gate 9 implementation currently consumes the historical pair:

- `gate7-final-cookbook-decision.json`
- `gate63-cookbook-evidence-receipt.json`

Both are hard-coded in `server.gate9.mjs`; the Gate 8 execution script independently hard-codes the same old repository, decision ID, and receipt model.

**[Verified]** The newer `gate7-integrated-dev-cookbook-decision.json` is not referenced by any producer or consumer discovered in this investigation. It is therefore not the current executable decision in the implementation.

**[Verified]** No governing architecture document inspected declares a canonical current-decision pointer, registry, or owner for Gate 9.

**[Inferred]** The architecture is incomplete at the decision-publication boundary. The safe resolution is to establish one governed current-decision publication mechanism, then adapt all consumers to that single contract. This should be a separately approved architecture/implementation task.

**[Verified]** The historical Cookbook decision remains protected and must not be reused, transferred, amended, approved, or executed.

## Authority and governing context

**[Verified]** The active development repository is:

`C:\Users\Colin\The Healthy Apples\GitHub\tha-integrated-dev`

on branch `feat/integrated-dev`, HEAD `a007b37f7f62bd9cbb59c20edf8ced2c22144a56`.

**[Verified]** The architecture bootstrap identified and read the repository architecture and operating-model documents, including:

- `docs/architecture/README.md`
- `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- `docs/architecture/ENGINEERING_WORKFLOW.md`
- `docs/architecture/REPOSITORY_CONVENTIONS.md`
- `docs/change-control.md`
- `.engineering/OPERATING_MANUAL.md`
- `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`
- `.engineering/standards/RISK_AND_SCOPE_STANDARD.md`

**[Verified]** These documents govern architecture compliance, source-of-truth ownership, decision/change control, rollback protection, and risk handling, but no inspected document defines a Gate 9 current-decision registry or names a canonical decision-contract owner.

**[Verified]** The requested output path is the exact path specified for this investigation. `REPOSITORY_CONVENTIONS.md` ordinarily expects investigations under a workstream subdirectory and with an EWO-based filename. That filing convention was not changed; the explicit task path was followed for this report.

## 1. Canonical owner of the current executable decision

**[Verified]** No canonical owner is declared in the inspected governing architecture for the phrase “current executable decision”.

**[Verified]** In the implementation, Gate 9 acts as the effective consumer of the current contract because `server.gate9.mjs` selects the hard-coded decision and receipt files and exposes their validated state through `/v1/tha/current-decision`.

**[Verified]** Gate 8 also reads the old decision and receipt directly, rather than receiving a canonical validated decision object from Gate 9.

**[Inferred]** Gate 9 and Gate 8 are consumers, not appropriate canonical owners. A canonical owner should publish or select one governed decision contract; execution workers should consume the already-validated decision and must not create a second governance authority.

## 2. Which contract Gate 9 is intended to consume

### Current implementation

**[Verified]** Current implementation is option **A**: the old decision plus an external Gate 63 evidence receipt. Gate 9 validates the decision repository fields, the receipt hash, receipt governance hashes, dirty-state baselines, and execution markers.

### New contract

**[Verified]** Option **B**, consuming the new self-contained integrated-dev decision, is not implemented. Gate 9 does not load that file.

### Canonical pointer or registry

**[Verified]** Option **C**, a canonical current-decision pointer or registry, was not found in the inspected repository or bridge code.

**[Inferred]** The intended architecture should be option C, with a versioned decision contract and explicit activation/publication. This avoids making a filename inside Gate 9 the authority and avoids silently creating a parallel decision owner.

## 3. Producer of the newer integrated-dev format

**[Verified]** Search of the inspected scripts found no producer that creates or publishes `gate7-integrated-dev-cookbook-decision.json`.

**[Verified]** `gate7-create-final-decision.mjs` creates the old `gate7-final-cookbook-decision.json` and requires the old Gate 63 receipt.

**[Verified]** `prepare-integrated-dev.mjs` prepares or records integrated-dev worktree state but does not create or register the newer decision as Gate 9’s current decision.

**[Assumed]** The newer JSON was authored manually or by a process outside the inspected producer set. Its provenance is not encoded in a producer receipt or registry, so this assumption must not be used as an authority claim.

## 4. Whether the new format intentionally replaces Gate 63 evidence

**[Verified]** No inspected producer, consumer, architecture document, or migration record states that the new format intentionally replaces `gate63ReceiptSha256` or the Gate 63 evidence-receipt model.

**[Verified]** The old producer and old consumers still require the external receipt model.

**[Verified]** The new decision contains no `evidence`, `receipt`, or `gate63ReceiptSha256` field.

**[Inferred]** The new file is an unregistered parallel contract, not a proven replacement. Treating its omission of the receipt as an intentional replacement would weaken evidence and rollback validation without an approved architecture decision.

## 5. Field-by-field validation mapping

| Old Gate 9 validation | New integrated-dev field or equivalent | Finding |
|---|---|---|
| Repository root | `repository.root` | **[Verified]** Direct equivalent exists. Gate 9 does not read it because it reads the old file. |
| Branch | `repository.branch` | **[Verified]** Direct equivalent exists. |
| HEAD | `repository.head` | **[Verified]** Direct equivalent exists. |
| Worktree status fingerprint | `repository.statusFingerprint` | **[Verified]** Direct equivalent exists. |
| Governance file hashes | `governance.trackedFiles[]` | **[Verified]** A direct-shaped equivalent exists, but the tracked-file set differs from the old receipt and is not currently enforced against this file. |
| Scoped-file baselines | `rollbackGate.identifier`, `rollbackGate.method` | **[Verified]** The new decision has no actual baseline-file path/hash manifest equivalent. An identifier alone is insufficient to reproduce the old byte-for-byte baseline checks. |
| Rollback completion | `rollbackGate.status`, `rollbackGate.requiredBeforeImplementation` | **[Verified]** Direct status fields exist. **[Inferred]** Their provenance and evidence are not independently bound because no rollback manifest/receipt is referenced. |
| Approval | `approval.status`, `approval.requiredPhrase` | **[Verified]** Fields exist, but semantics differ: the new file says `APPROVED`, while the old Gate 8 flow expects `NOT_APPROVED` before it accepts the exact approval phrase as the execution trigger. |
| Already-executed protection | None | **[Verified]** No equivalent field exists in the new decision. Old Gate 9 uses `gate8-last-execution.json` and active execution records. |
| Implementation authorisation | `safety.implementationAuthorised` | **[Verified]** A field exists and is `false`; no transition rule or evidence makes it true after approval. |
| Historical decision protection | `governance.historicalDecisionProtection` | **[Verified]** The new file explicitly records protection of the old decision. This is a governance safeguard, not a replacement for current-decision publication. |

## 6. Validation genuinely absent from the new contract

**[Verified]** The following old-contract protections have no sufficient equivalent in the new JSON:

- immutable external evidence-receipt hash and receipt provenance;
- explicit dirty pre-state baseline file list, hashes, protected copies, and paths;
- a binding between the decision and the actual rollback artifacts;
- prior-gate result/receipt identity;
- already-executed and active-execution protection;
- a defined approval transition compatible with the execution runner;
- a canonical activation/publication identity;
- proof that the new governance tracked-file set is the complete required set for this contract.

**[Inferred]** These omissions mean the new format cannot safely replace the old contract merely by changing the filename.

## 7. Producers and consumers

### Old contract

**[Verified] Producers:**

- `gate63-create-evidence-receipt.mjs` creates `gate63-cookbook-evidence-receipt.json` and protected baseline copies.
- `gate7-create-final-decision.mjs` consumes the Gate 63 receipt and creates `gate7-final-cookbook-decision.json`.

**[Verified] Consumers:**

- `server.gate9.mjs` loads and validates both files for `/v1/tha/current-decision` and `/v1/tha/execute-decision`.
- `gate8-execute-approved-decision.mjs` independently loads both files and applies additional old-root, old-branch, old-decision, and old-scope checks.
- `gate9-execution-runner.mjs` invokes Gate 8 after Gate 9 queues an execution.
- The GPT Action/OpenAPI layer consumes the HTTP endpoints, not the JSON files directly.

### New contract

**[Verified] Producers:** No producer or publication script was found.

**[Verified] Consumers:** No Gate 9, Gate 8, runner, or current-decision script references the new filename or decision ID.

**[Inferred]** The new contract currently has no authoritative producer-consumer chain.

## 8. Hard-coded filename and architectural compliance

**[Verified]** `server.gate9.mjs` hard-codes the old decision and receipt filenames. `gate8-execute-approved-decision.mjs` also hard-codes the old repository, decision filename, receipt filename, decision ID, and scope.

**[Verified]** No inspected governing document explicitly authorises Gate 9 to define the current decision by a hard-coded historical filename.

**[Inferred]** Hard-coding a historical filename as the current executable authority conflicts with the governing source-of-truth principle and with the requirement that a decision be bound to the current repository/worktree context. It also prevents the approved integrated-dev decision from being consumed without a code change.

## 9. Is the integrated-dev decision executable now?

**[Verified]** No. The approved integrated-dev decision is not executable through the current Gate 9 path because Gate 9 does not load it.

**[Verified]** It also lacks the external evidence/receipt and explicit baseline manifest that the current validation model requires.

**[Verified]** Gate 8’s execution path remains bound to the old Cookbook repository and old decision ID, so merely pointing Gate 9 at the new JSON would not produce a coherent end-to-end execution path.

**[Inferred]** Additional governed gates are incomplete: canonical current-decision publication, contract version/adapter rules, evidence and baseline provenance, and coordinated consumer changes. No implementation should begin from this investigation.

## 10. Why `safety.implementationAuthorised` is false

**[Verified]** The new decision has `approval.status = APPROVED`, `rollbackGate.status = COMPLETE`, and `safety.implementationAuthorised = false`.

**[Verified]** Approval and rollback completion are separate conditions. Approval records the user’s approval state; rollback completion records that the required rollback gate was declared complete. Neither field itself proves that the execution authority has validated every runtime, evidence, binding, and already-executed protection.

**[Verified]** The old decision generators also keep implementation-authorisation safety fields false. In the old flow, the exact approval phrase is handled as an execution trigger by Gate 8; it is not represented as a mutation of the safety field in the decision JSON.

**[Inferred]** The false value is consistent with fail-closed separation of approval from implementation authorisation. However, the new contract does not define a complete, governed transition from approved decision to executable decision, so its status cannot be interpreted as proof that implementation is authorised.

## Architecture drift report

### ARCHITECTURE

**[Verified]** Governing documents require controlled source-of-truth ownership, decision/change control, rollback protection, and preservation of historical decisions. No inspected architecture document defines the canonical current-decision publication mechanism for Gate 9.

### IMPLEMENTATION

**[Verified]** Gate 9 and Gate 8 consume a hard-coded old decision/receipt pair. The integrated-dev decision is not registered or consumed. Gate 8 also contains old repository and decision-specific assumptions.

### CONFLICT

**[Verified]** The implementation has no end-to-end consumer path for the approved integrated-dev decision.

**[Inferred]** The absence of a canonical decision owner and activation mechanism is an architecture/implementation contract gap. The new JSON cannot safely be treated as a replacement merely because it has a newer name and approval state.

### IMPACT

**[Verified]** Read-only status can continue to expose the old contract, while execution remains unavailable or bound to the wrong historical context. The historical decision remains protected, but the new decision is not executable through the governed bridge.

### RECOMMENDED RESOLUTION

**[Inferred]** Choose and approve option C below: define one canonical current-decision pointer/registry or equivalent publication record, define a versioned contract with explicit evidence/baseline provenance, and update Gate 9, the execution runner, and Gate 8 coherently so workers remain implementation details. Preserve the old contract as immutable historical evidence and add an explicit compatibility adapter only if required.

## Options

### Option A — Continue the old decision plus external receipt

**[Verified]** This is the current implementation.

**Trade-offs:** Minimal immediate change and preserves existing checks, but cannot execute the integrated-dev decision, preserves hard-coded historical authority, and leaves the current-worktree mismatch unresolved. Not recommended for the new task.

### Option B — Make the self-contained integrated-dev decision authoritative

**Trade-offs:** Simpler file consumption and fewer moving parts, but requires adding the missing evidence/baseline/execution protections or proving their equivalent, defining approval semantics, and changing every consumer together. Without those changes it weakens governance. Not recommended as an unqualified filename switch.

### Option C — Establish a canonical current-decision pointer/registry

**Trade-offs:** Requires a new governed contract and coordinated changes, but gives one owner, explicit activation, immutable historical records, versioned compatibility, and a clear boundary between decision authority and worker selection. Recommended, subject to a separate architecture and implementation approval.

## Data impact

**[Verified]** This investigation changes no application data, database schema, decision JSON, evidence receipt, bridge behavior, authentication behavior, OpenAPI contract, repository source, or runtime process.

**[Verified]** The only authorized artifact is this investigation report.

## Rollback implications

**[Verified]** No implementation rollback is required because no application or bridge behavior was changed.

**[Inferred]** Any future contract migration must preserve both historical decision/receipt artifacts byte-for-byte, create a separately verifiable baseline for the active worktree, activate the new contract through one explicit governed publication step, and retain a reversible pointer/registry change before consumer changes are made.

## Highest-risk remaining uncertainty

**[Assumed]** The provenance and intended authority of `gate7-integrated-dev-cookbook-decision.json` are unknown because no producer or publication record was found. This is the highest-risk remaining assumption: treating that file as approved current authority without a canonical producer/registry could create duplicate decision ownership or bypass missing evidence gates.

## Final status

**[Verified] INVESTIGATION COMPLETE — STOP.** No decision was created, altered, approved, transferred, or executed. No implementation was performed. The identified drift is reported for a separate governed resolution.
