# OWN5 — Source of Truth Register Missing Domains

**Stage:** Complete
**Date:** 2026-07-16
**Rollback ID:** `rollback/OWN5-source-of-truth-register-domains-20260716` → `7d1dd2ce`
**Stash:** `OWN5_ROLLBACK: pre-implementation dirty-tree snapshot 2026-07-16` (`stash@{0}`, re-applied — tree preserved)
**Scope:** Governing documentation only. **No code, no schema, no runtime behaviour.**
**Authority:** `CONV1` § Tier 1 item `OWN-5`; § 7 phase P1 — **the final P1 item**.
**Report:** [`docs/implementation/governance/OWN5_SOURCE_OF_TRUTH_REGISTER_DOMAINS.md`](../../../docs/implementation/governance/OWN5_SOURCE_OF_TRUTH_REGISTER_DOMAINS.md)

---

## Mission

Implement CONV1 item `OWN-5` only. Declare the missing Source of Truth Register domains
(Pantry, Benchmarks, Learning/EL1, Observations/OBS1). Register Rule 1 — *"every major domain
must declare a named source of truth"* — was breached by omission for four live domains.
No code, no schema, no runtime change.

## Pre-work checkpoints

- [x] Rollback protection created **before any file was touched** (tag + stash, tree re-applied)
- [x] `git status` confirmed (87 entries, dirty tree from concurrent sessions — preserved)
- [x] Tree verified restored after stash apply (19 modified, 578/380 — identical to pre-stash)
- [x] `docs/architecture/README.md` read (Architecture Bootstrap, STEP 2)
- [x] `CONV1` read — item `OWN-5`, principle CP1, § 7 phase P1
- [x] SoT Register read — Rule 1, Rule 5, Rule 8, Phase 1 inventory, Domain 28/29 format, Appendix A
- [x] **All four domains verified against live code, not inherited from CPI1/CONV1** (V1–V12)

## What changed — 1 governing document

| Document | Blocks |
|---|---|
| `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` | 3 — Phase 1 inventory (note + rows 28–33); Phase 2 declarations (Domains 30–33); Appendix A (4 rows) |

**134 insertions, ZERO deletions** vs the session-start tree — purely additive, nothing renumbered,
every existing `SoT D14`-style citation still resolves. No related architecture document required
updating; the check was run, not assumed (report § 2.1, V10).

## Findings — three corrections to the programme's own claims

1. **Benchmarks owns NO table.** `CPI1:173` (quoted by CONV1 `OWN-5`) calls Benchmarks, Learning and
   Observations *"three live, **table-owning**, runtime-read domains"*. **Benchmarks is not
   table-owning** — all 88 `pgTable`s enumerated, none benchmark; both benchmark trees swept for
   `pgTable`/`pg-core`, zero. Its SoT is an authored fixture + an append-only **filesystem** history
   store. Declared as table-owning, its row would have named a table that does not exist.
2. **Citation drift:** `capability-registry.ts:725` → the `owner:` string is now **`:711`**.
   Third P1 item to find a drifted citation.
3. **EL1's shipped sole-ownership claim is FALSE**, not merely unregistered — **7 direct-access
   sites** bypass the store, incl. `publication-register.ts:1298`, *the verifier itself*. Root cause:
   `IEvidenceLearningStore` exposes no reset method, and no test asserts the rule.

## Verification

- `repo-structure-verify.sh`: **all `docs/` rules PASS**. Root FAIL is pre-existing
  (`.glibcheck.txt`, `.libdirs_uxhome.txt` — untracked, present before this session, not touched).
- Application gates not applicable — one Markdown file, no runtime surface.
- **P1 confirmed complete**: `DOC-1`·`DOC-2`·`DOC-3`·`DOC-4` reports all read as `IMPLEMENTED`, and
  DOC-3's fix verified live at `routes.ts:11390` (`0 = Sunday … Rule HT8`).

## Next action

Complete. **CONV1 phase P1 is complete; Tier 2 / `OWN-1` is unblocked.**
CONV1 § 8 puts **`SEC-2`/`SEC-3`** next — cheap, out-of-band, latent-not-exploitable (`CP11`).
`OWN-1` is now *legal* to start but is P4 and carries the programme's whole risk.
**Six follow-ons filed** in report § 6.2 — **F1 (EL1's 7 ownership violations) is the highest** and
needs a store reset method + a gate, not seven edits.
