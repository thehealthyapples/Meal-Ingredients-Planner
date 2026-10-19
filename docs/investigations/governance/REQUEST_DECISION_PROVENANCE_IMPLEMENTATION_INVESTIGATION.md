# Request → Decision Provenance — Implementation Investigation

**Date:** 2026-08-26
**Scope:** Investigation, plus minting ONE bounded bootstrap decision (not
approved, not executed). The actual `sourceRequestId` implementation is
explicitly deferred to a separate, later decision, per instruction and per
the "ONE DECISION ONLY" discipline already used throughout this session.

## Governance re-check — no drift

`docs/architecture/README.md`: zero Gate mentions, unchanged.
`PROJECT_GOVERNANCE.md`: Gate 9 sole-authority text unchanged. The
preparation-receipt prerequisite (`tha-dec-6339923ddaa900a8d0057d0026aefd29`
/ `tha-exec-1787777616324-81958a00`) re-confirmed live: still `SUCCEEDED`.

---

## STEP 1 — Decision creation owner

```
DECISION_CREATION_OWNER:  decision-factory.mjs::createAndBindDecision()
                          (sole function; verified — every prepare-*.mjs
                          script in the repo calls this exact function,
                          re-confirmed by listing every caller live)
DECISION_ID_OWNER:        same function — decisionId = 
                          `tha-dec-${sha256(JSON.stringify(decisionMaterial)).slice(0,32)}`
DECISION_ARTIFACT_OWNER:  same function — writes gate7-*.json
DECISION_SCHEMA_OWNER:    same function — the object literal building
                          `decisionMaterial`/`decision`
```

**Every caller, enumerated live:** 20 `prepare-*-decision.mjs` scripts (every
one authored this session and historically), all following the identical
`createAndBindDecision({purpose, repositoryRoot, scope, risk, nonGoals,
verificationGates, scopeFileInstructions})` call shape.
`test-gate8-worker-prompt-quality.mjs`'s one match is a string-content
assertion on a worker prompt template (checking the prompt text mentions
`createAndBindDecision`), not a real caller. No second factory exists
anywhere.

---

## STEP 2 — How request provenance enters decision creation today

Traced the full parameter list of `createAndBindDecision` (verified live,
unchanged: `purpose, repositoryRoot, scope, risk, nonGoals,
verificationGates, scopeFileInstructions`) — no request-shaped parameter
exists. Every one of the 71 decision artifacts in this repository was
created directly by a human/agent running a script, with zero automated
path from a completed Gate 5 request.

```
REQUEST → DECISION: 0..many (confirmed — nothing structurally caps it; a
                     single investigation could legitimately inform several
                     bounded decisions)
DECISION → REQUEST:  0..1 (confirmed directly — every decision this entire
                     session had zero originating request; forcing
                     `sourceRequestId` to be required would break every
                     legitimate direct-authorship decision, which is the
                     overwhelming majority of real usage today)
```

---

## STEP 3 — Persistent provenance validation rule

**Preferred shape confirmed viable by live evidence:** optional
`sourceRequestId`; when supplied, decision creation validates that
`preparation-receipts/{sourceRequestId}.json` exists and is structurally
valid (parses as JSON, contains the six expected keys, and its own
`requestId` field matches the supplied `sourceRequestId`) before creating
anything. The decision artifact stores only the identity reference — never
the six receipt fields copied in, never request content. The receipt
(`server.gate5.mjs::writePreparationReceipt`, verified this session) remains
the sole owner of request provenance *facts*; the decision only records that
a relationship exists.

---

## STEP 4 — Failure semantics

```
No sourceRequestId supplied:                decision created normally,
                                            sourceRequestId: null
sourceRequestId supplied, receipt exists,
  well-formed, requestId matches:            decision created with the
                                            reference
sourceRequestId supplied, receipt file
  does not exist:                            FAIL CLOSED — throw before any
                                            side effect (placed before the
                                            existing purpose/risk checks'
                                            try block even begins, so zero
                                            placeholder files are written)
sourceRequestId supplied, receipt malformed
  (JSON parse fails, missing an expected
  key, or requestId field mismatch):         FAIL CLOSED — same as above,
                                            never silently stripped
Same receipt used by multiple decisions:    permitted — no uniqueness
                                            constraint added, preserving the
                                            confirmed 0..many cardinality
```

---

## STEP 5 — Field name

```
RECOMMENDED_FIELD_NAME: sourceRequestId
WHY: matches the exact term used consistently across every governance
     instruction in this investigation chain; does not collide with the
     receipt's own already-existing, differently-scoped `provenance` object
     (decision-factory.mjs's evidence receipt already uses "provenance" to
     mean "which generator script produced this receipt" -- reusing the
     word for "which request this decision came from" would overload an
     existing term with a second, unrelated meaning). No other existing
     convention in this codebase names anything comparable.
```

---

## STEP 6 — Storage location

**Authoritative storage: the decision artifact** (`gate7-*.json`,
`decisionMaterial`/`decision` object) — the one canonical representation of
a decision.

**Derived mirror, following existing precedent:** the evidence receipt
already mirrors and cross-validates several decision fields for integrity
purposes — verified directly: `bindDecisionAsCurrent()` already checks
`decision.rollbackGate.identifier !== receipt.rollbackGate.identifier` and
carries `approval`/`safety` copies for the same reason. Mirroring
`sourceRequestId` into the receipt with the identical cross-validation
pattern is consistent with this **existing, already-governed** duplication
mechanism (a validated mirror for integrity checking, not a second
independent owner) — not a new violation of "one entity, one owner."

**Not touched:** the dirty-pre-state manifest (unrelated concern — protected
file baselines) and the Gate 9 registry (`gate9-current-decision.json`,
intentionally minimal — decisionId/decisionArtifact/hashes/activatedAt only;
consumers already resolve the full decision artifact through its existing
`decisionArtifact` pointer, so no registry change is needed for a consumer
to eventually read `sourceRequestId`).

---

## Architecture compliance

```
CANONICAL_REQUEST_IDENTITY_SINGULAR:      yes
CANONICAL_DECISION_IDENTITY_SINGULAR:     yes
PROVENANCE_RELATIONSHIP_OWNER_SINGULAR:   yes -- decision-factory.mjs alone
NO_DUPLICATED_REQUEST_STATE:              yes -- only the identifier is
                                          referenced, never the six receipt
                                          fields or any content
NO_DUPLICATED_WORKFLOW:                   yes -- one validation added to the
                                          one existing factory function
EXISTING_DECISION_FACTORY_EXTENDED:       yes -- createAndBindDecision gains
                                          one new optional parameter and one
                                          new validation block; nothing else
                                          changes
ACTIVITY_PROJECTION_UNCHANGED:            yes -- explicitly not touched in
                                          this decision or its bootstrap
```

---

## OPTIONS

**A — Optional `sourceRequestId` on the decision artifact, validated against
the durable preparation receipt.** Confirmed viable by live ownership
evidence (Steps 1-6). **Recommended.**

**B — Duplicate preparation metadata (the six receipt fields) into the
decision.** Rejected — creates a second, driftable copy of facts the
receipt already owns; violates "one entity, one owner" directly.

**C — Keep decisions unchanged; infer request links later in Activity
Projection.** Rejected — inference from timestamps/ordering was already
explicitly rejected in the original correlation investigation, and doing it
here would just relocate the same rejected approach.

**RECOMMENDED_OPTION: A**

---

## THE BOOTSTRAP PROBLEM — verified, not assumed

`decision-factory.mjs` is not a member of any scope family that admits it
alone. Verified live:

```
buildVerificationPlan({scope: ['decision-factory.mjs']}, {})
  -> THREW: "Verification scope is missing, mixed, or ambiguous."
```

It belongs to exactly two existing families, both **exact-length-match**
(re-confirmed by reading the classifier: `decisionFactoryCapabilityOnly`/
`decisionFactoryPorcelainRepairOnly` both require `scope.length ===
<family>.length`, unlike the subset-based `bridgeOnly`/`cookbookOnly`):

- `DECISION_FACTORY_CAPABILITY_SCOPE = ['decision-factory.mjs', 'tha-cli.mjs']`
- `DECISION_FACTORY_PORCELAIN_REPAIR_SCOPE = ['decision-factory.mjs', 'gate8-repair-loop.mjs', 'test-decision-factory-porcelain-parser.mjs']`

Using either would force an irrelevant file into scope purely to satisfy
classification — `tha-cli.mjs`'s "decision" subcommand is a plain
`GET /v1/tha/current-decision` read wrapper with nothing to add for
provenance, and the porcelain-parser test is unrelated to request
provenance. Neither is a truthful scope for this change. This is the same
structural pattern already solved twice this session for `.gitignore`
(`gitignore-config` bootstrap).

**Per instruction ("If implementation conflicts with governing
architecture: STOP") and per "ONE DECISION ONLY": the actual
`sourceRequestId` implementation is NOT minted this turn.** Only the
bootstrap — a new, minimal, honestly-named scope family — is minted below,
mirroring the exact precedent already used successfully for
`gitignore-config`.

---

## FINAL OUTPUT

```
REQUEST → DECISION PROVENANCE INVESTIGATION

DECISION_CREATION_OWNER:       decision-factory.mjs::createAndBindDecision()
PROVENANCE_RELATIONSHIP_OWNER: same (extends it; no second owner)
REQUEST→DECISION_CARDINALITY:  0..many
DECISION→REQUEST_CARDINALITY:  0..1

RECOMMENDED_FIELD_NAME:        sourceRequestId
AUTHORITATIVE_STORAGE_LOCATION: decision artifact (gate7-*.json); mirrored
                                and cross-validated in the evidence receipt
                                per existing precedent (rollbackGate/
                                approval/safety already work this way)

OPTIONS: A (recommended), B (rejected -- duplicated state), C (rejected --
  inference)

DECISION_REQUIRED: yes, but split -- bootstrap now, real implementation
  later, per the verified scope-classification gap above
```

Persisted at:
`docs/investigations/governance/REQUEST_DECISION_PROVENANCE_IMPLEMENTATION_INVESTIGATION.md`

## TRUST CHECK

- Highest-risk claim still Inferred or Assumed: none of the ownership,
  cardinality, or scope-classification findings are Inferred or Assumed --
  all directly re-verified live this turn, including the exact-match vs
  subset-match distinction in the classifier and every caller of
  createAndBindDecision.
- Evidence required to verify the one remaining soft judgement call
  (field name `sourceRequestId` vs an alternative): none outstanding -- this
  is a naming preference consistent with prior instruction language, not a
  fact gap.
