# Request → Decision Provenance — Mirroring/Hashing Determination

**Date:** 2026-08-26. Investigation supporting the bounded implementation
decision minted below.

## Governance re-check

`docs/architecture/README.md`: zero Gate mentions, unchanged.
`PROJECT_GOVERNANCE.md`: unchanged. Bootstrap (`tha-dec-96ca5a68c85dd253d4915f7f46e9ded4`
/ `tha-exec-1787779271645-036030de`) re-confirmed live: `DECISION_FACTORY_PROVENANCE_SCOPE`
still classifies as `decision-factory-provenance` with the real,
non-empty `decision-factory-provenance-regression` command.

## Receipt mirroring — determined by direct evidence, not analogy

Re-read `bindDecisionAsCurrent()` in full. The receipt carries
`approval: decision.approval` and `safety: decision.safety` at
construction time, but **grepped and confirmed: neither is ever read back
or compared anywhere in the binding validation** — they are write-time
convenience copies only, never integrity-checked. The **one** genuine
cross-field check between decision and receipt is
`decision.rollbackGate.identifier !== receipt.rollbackGate.identifier`
(line 123) — narrowly tied to correlating the physical rollback package,
not a general precedent for mirroring arbitrary decision content.

The actual integrity mechanism protecting the **entire** decision content —
already covering any field added to `decisionMaterial`, including a future
`sourceRequestId`, with zero special-casing — is the existing whole-document
check: `sha256(decisionBytes) !== receipt.decisionSha256` (line 115). This
transitively covers `sourceRequestId` the moment it becomes part of
`decisionMaterial`, exactly like every other existing field.

**Conclusion: no governance requirement demonstrates that `sourceRequestId`
must be mirrored into the receipt.** Per instruction ("do not duplicate the
fact merely because other fields currently appear in both places"), it is
stored **only** in the decision artifact.

```
PROVENANCE_AUTHORITATIVE_OWNER: the decision artifact (gate7-*.json) alone
RECEIPT_PROVENANCE_ROLE:        none required -- covered transitively by
                                the receipt's existing whole-document
                                decisionSha256 check
MIRROR_REQUIRED:                no
WHY:                            receipt.approval/receipt.safety are proven,
                                by direct grep, to be unvalidated convenience
                                copies, not evidence of a mirroring
                                requirement; the one real cross-check
                                (rollbackGate.identifier) is narrowly about
                                physical rollback-package correlation, not a
                                general precedent
```

## Valid terminal status for provenance

Gate 5 request terminal states (re-verified live, `server.gate5.mjs`):
exactly `complete` and `failed`. A `failed` request produced no usable
investigation output — allowing it to source a decision would misrepresent
the decision as grounded in a preparation that did not actually succeed.

```
VALID_SOURCE_TERMINAL_STATUS: complete only. A receipt with
                              terminalStatus "failed" fails closed if
                              supplied as sourceRequestId provenance.
```

## Decision hashing

`sourceRequestId` is added as a genuine field of `decisionMaterial` (not
bolted on afterward), so it participates in `decisionId =
sha256(JSON.stringify(decisionMaterial))` automatically, exactly like every
other existing field (`purpose`, `scope`, `risk`, etc.) — no special-casing
needed or added.

```
SOURCE_REQUEST_ID_PART_OF_DECISION_HASH: yes
WHY: it is a real field of decisionMaterial, hashed the same way every
     other field already is; two decisions differing only in
     sourceRequestId (or its presence/absence) necessarily get different
     decisionIds.
```
