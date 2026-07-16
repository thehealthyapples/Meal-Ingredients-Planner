# COH3 — Wire the Coherence Gate into `release:check`

**Stage:** Complete
**Date:** 2026-07-16
**Rollback ID:** `rollback/COH3-wire-coherence-into-release-check-20260716` → `7d1dd2ce`
**Snapshots:** `package.json` → `<scratchpad>/package.json.COH3-pre`; `RELEASE.md` → `<scratchpad>/RELEASE.md.COH3-pre` (both md5-verified pre-edit)
**Scope:** `release:check` + the ritual that documents it. **No coherence rule altered, no gate lowered, no unrelated check fixed.**
**Authority:** `CONV1_PHASE_P2_COMPLETION.md` § 6.4 (*"wiring follows the correction"*); `DOC5_SOURCE_OF_TRUTH_PATH_CORRECTIONS.md` § 8 item 1.
**Report:** [`docs/implementation/governance/COH3_WIRE_COHERENCE_INTO_RELEASE_CHECK.md`](../../../docs/implementation/governance/COH3_WIRE_COHERENCE_INTO_RELEASE_CHECK.md)

---

## Mission

Implement `CONV1` `COH-3` only. Wire the now-green `verify:coherence` gate into `release:check`.
Do not alter the coherence rules, do not lower any gate, do not fix unrelated release checks.

## Pre-work checkpoints

- [x] Rollback protection created **before any file was touched** (tag + 2 md5-verified snapshots)
- [x] `git status` confirmed (111 entries; dirty from ~9 concurrent sessions — **preserved**)
- [x] `docs/architecture/README.md`, `CONV1_PHASE_P2_COMPLETION.md` § 6.4, `DOC5…` § 8 read
- [x] **Every gate in the chain baselined BEFORE the edit**, so "I moved nothing" is measured, not asserted
- [x] `DOC-5`'s corrections confirmed still present in the tree (the gate is green *because* they are)

## What changed — 2 files

| File | Change |
|---|---|
| `package.json` | **1 line** — `verify:coherence` inserted at **position 3** of `release:check`, ahead of typecheck/test/build. **Pure insertion**; re-parsed as valid JSON; diff = exactly one line |
| `RELEASE.md` | **Step 0c** added; `:340`'s *"Both gates run…"* → *"All three gates run…"* — the ritual now documents the gate it now runs |

## Findings

1. **The gate is wired, and it buys less than the tick suggests** — reported, not rounded:
2. **`release:check` never reaches it today.** It dies at **gate 1** (`verify:deployment-config`),
   and **all four** pre-existing gates are red. `&&` short-circuits. **The link itself was proved
   live**: run from position 3, coherence passes (exit 0) and hands off to `typecheck:ci`.
3. **CI does not run `release:check` at all.** `ci.yml` runs `typecheck:ci → test → build` directly,
   so **`COH-3` adds no enforcement on any push or PR** (`AUDIT_2026-07-13` § 81 already named it:
   *"CI runs 3 of the 7 gates"*). The gate's real home is `ci.yml` — **not touched**: the required
   status check is matched **by job name** (`"typecheck · test · build"`, defended by
   `verify:branch-protection`), so adding coherence makes the name a lie and renaming it strands
   every open PR. **That is `COH-4`, and it needs its own authorisation.**
4. **★ `COH-3` cannot ship without `DOC-5`.** At `HEAD` both corrected defects are still present
   (`:164`, `:302`). **This line committed alone turns `release:check` red on coherence** — the exact
   `R2` P2 § 6.4 refused. **One landing, or `DOC-5` first.**
5. **Position 1 was considered and rejected.** It is the only placement that would execute in today's
   tree — *because* gate 1 is red. **Optimising against a temporary failure, permanently**; the chain
   dies at gate 1 either way, so it buys nothing and leaves a distortion once the gate is repaired.
6. **A pre-existing gap found and left:** `adoption:check` has been in `release:check` since `PX1-W5`
   and appears **nowhere** in `RELEASE.md`. *The same pattern `DOC-5` found in the Register — a chain
   changed, and the document describing it not.* Unrelated check; **not fixed**, recorded.

## Verification

- **`verify:coherence`: exit 0 — 0 failed, 0 warned. `RESULT: PASS`.**
- **Every other gate re-run AFTER the edit reports its pre-edit numbers to the digit** —
  gate 1: 5 passed/1 failed (`.replit` uncommitted); gate 2: 4 passed/1 failed (2 untracked North
  Star `.png`s); `typecheck:ci`: baseline 168 → 304 = **32 regressions**; `adoption:check`: 64/2.
  **All four are concurrent sessions' uncommitted work. None is `COH-3`'s, none was fixed.**
- **Rules untouched, verified not asserted:** `verify-governing-coherence.ts` mtime **20:24**,
  predating this workstream's first edit; `git diff` reports the other four gate scripts **clean**.
- **No baseline re-recorded.** **No gate lowered** — the only change to the chain is an addition.
- **Diff: 2 files.** No server/client/shared/schema/migration file touched; nothing in the running
  application reads either file.

## Next action

Complete. **Next: `COH-4` — run the coherence gate in CI**, which is where enforcement actually
happens (§ 4.2): `release:check` is a ritual a human must choose to run, and CI never invokes it.
**Not free** — needs a decision on the required-status-check job name.
**And before anything: commit `DOC-5` and `COH-3` together** (finding 4 — not optional).
Then `DOC-6` (the two stale Status rows — **do not merge them**), the `xc-register-currency` regex
scope, deepening `COH-1` to Appendix A (**now that it is wired, this is when it starts to bite**),
then **P3 — `BEH-1` · `BEH-4` · `BEH-7`** (absorbing `DOC-3` § 5.1 first).
