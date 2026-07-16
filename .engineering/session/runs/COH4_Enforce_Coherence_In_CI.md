# COH4 — Enforce the Coherence Gate in CI

**Stage:** Complete
**Date:** 2026-07-16
**Rollback ID:** `rollback/COH4-enforce-coherence-in-ci-20260716` → `7d1dd2ce`
**Snapshots:** `.github/workflows/ci.yml` → `<scratchpad>/ci.yml.COH4-pre`; `.engineering/protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md` → `<scratchpad>/PDVG.md.COH4-pre` (both md5-verified pre-edit)
**Scope:** CI workflow + the protocol documenting that job. **No coherence rule altered, no gate lowered or re-baselined, no unrelated CI failure fixed, branch protection untouched.**
**Authority:** `COH3_WIRE_COHERENCE_INTO_RELEASE_CHECK.md` § 4.2 + § 8 item 1 (*"`release:check` is a ritual a human must choose to run; the gate's real home is `ci.yml`"*).
**Report:** [`docs/implementation/governance/COH4_ENFORCE_COHERENCE_IN_CI.md`](../../../docs/implementation/governance/COH4_ENFORCE_COHERENCE_IN_CI.md)

---

## Mission

Implement `CONV1` `COH-4` only. Add `verify:coherence` to the existing CI workflow so it runs on
every push and pull request. **Preserve the required job name and branch-protection context if safely
possible; STOP and present a decision if enforcement requires renaming the job or changing branch
protection.**

## Pre-work checkpoints

- [x] Rollback protection created **before any file was touched** (tag + 2 md5-verified snapshots)
- [x] `git status` confirmed (114 entries; dirty from ~9 concurrent sessions — **preserved**)
- [x] `docs/architecture/README.md`, `COH3…` report, `ci.yml`, `branch-protection.json`, `verify-branch-protection.ts`, `PRE_DEPLOYMENT_VERIFICATION_GATE.md` all read
- [x] **`verify:branch-protection` baselined BEFORE the edit**, so "required-check impact: none" is measured
- [x] **STOP condition evaluated first** — not triggered (see finding 1)

## What changed — 2 files

| File | Change |
|---|---|
| `.github/workflows/ci.yml` | **1 step** in job `verify`, position **5 of 9** — after `npm ci`, before `ci:setup-db`. Job name, triggers, services, permissions, concurrency **untouched** |
| `.engineering/protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md` | § 2 stage 3 (the CI chain) + § 3 (*"Inside the check / Fails when"*) now name the gate |

**`scripts/ci/branch-protection.json` — NOT edited.**

## Findings

1. **★ STOP condition NOT triggered — proof is mechanical.** A required check is matched on the
   **job name**, not its steps. `jobs.verify.name` is **byte-identical**, `branch-protection.json` is
   untouched, and `verify:branch-protection` **Check 1 still PASSES**. No rename, no human reapply.
2. **★ This withdraws `COH-3`'s own overstatement.** `COH-3` § 5 claimed adding the step *"makes the
   name a lie"* and graded the item Low/**Medium** on it. **`ci.yml:43` had already answered:** the
   name is *"an **API identifier, not a label**"*. The job has always run **9 steps and named 3** —
   `npm ci` and `ci:setup-db` were never in it either. *`COH-3` reasoned from a real hazard
   (renaming) to a wrong conclusion (the work is expensive). The cheap approach was always
   available.* **`L1` applies to one's own reports too.**
3. **★ It reports; it does not block.** `verify:branch-protection` **Check 2 FAILS** — *"main is NOT
   protected … nothing blocks an untested merge"* — **identical before and after**, corroborated by
   `AUDIT_2026-07-13` § 80. **An agent must not fix it**: branch protection is production config
   (`COMMIT_PUSH_DEPLOY_PROTOCOL.md` § 3); a named human runs `--print-apply`. *This is not
   coherence's deficiency — `typecheck`, the 65 suites and all six TRUST1 security suites are
   enforced exactly as much. **The gate is unlatched; that is a finding about the door, not the
   lock.***
4. **★★ `COH-4` cannot ship without `DOC-5`, and CI sharpens it** — `push:` has **no branch filter**,
   so pushing this without the Register corrections turns **CI red on every push, on every branch,
   for a defect the pusher did not introduce**. *The fastest way to get the gate switched off (`R2`),
   delivered by the workstream that exists to enforce it.* **DOC-5 + COH-3 + COH-4 are ONE landing.**
5. **Placement measured, not assumed:** **676 ms**, no DB, no secret (ran with `DATABASE_URL`
   **unset** → exit 0; the only `pg` in the script is the `pgTable` **regex** reading `schema.ts` as
   text). Placed after `npm ci` (needs `tsx`) and before `ci:setup-db` — ahead of a Postgres
   container, a **14,065 ms** typecheck, 65 suites and a bundle.
6. **A pre-existing stale claim, found and left:** the protocol asserts *"a direct push to `main` is
   rejected by the server"* and *"the merge button is disabled"* — **neither is demonstrable** (Check
   2). Unrelated, and about protection *state*, not the CI chain. Recorded.

## Verification

- **`verify:coherence` as CI runs it** (`DATABASE_URL` unset, `CI=true`): **exit 0 — 0 failed, 0 warned.**
- **`ci.yml` parsed with a real YAML parser**: valid; `jobs.verify.name = "typecheck · test · build"`;
  coherence step 5 of 9; order `npm ci → verify:coherence → ci:setup-db → typecheck:ci → npm test →
  build`; triggers `push: null` (**every branch**) + `pull_request: [main]`. Step is **not**
  `continue-on-error` and **not** conditional.
- **`verify:branch-protection`**: Check 1 **PASS** (unchanged); Check 2 FAIL (**pre-existing,
  identical**).
- **Rules untouched, verified not asserted**: `verify-governing-coherence.ts` mtime `20:24` predates
  this workstream; `git diff` clean on it, on the other gate scripts, and on `branch-protection.json`.
- **No baseline re-recorded**; `typecheck:ci` still red on its 32 pre-existing regressions, unhidden.
- **Diff: 2 files.** No server/client/shared/schema/migration file touched.
- **★ A mistake caught by the snapshot:** the first § 3 edit **deleted the `ci:setup-db` row** while
  inserting coherence. Caught by diffing against the pre-edit snapshot; restored **verbatim**. Final
  diff = 1 line rewritten + 1 line added, all six rows present in CI's real order. *A workstream
  forbidden to lower a gate came within one unverified edit of deleting one from the protocol — and
  the only thing that caught it was checking instead of trusting.*

## Next action

Complete. **First: land `DOC-5` + `COH-3` + `COH-4` as ONE commit** (finding 4 — not optional).
**Then the highest-value item, and the only one an agent cannot attempt: a named human applies branch
protection to `main`** (`npm run verify:branch-protection -- --print-apply`) — until then every CI
gate reports and none blocks. Then `DOC-6` (the two stale Status rows — **do not merge them**),
**deepening `COH-1` to Appendix A** (green *and* automated now — this is when it bites), the
`xc-register-currency` regex scope, then **P3 — `BEH-1` · `BEH-4` · `BEH-7`** (absorbing `DOC-3`
§ 5.1 first).
