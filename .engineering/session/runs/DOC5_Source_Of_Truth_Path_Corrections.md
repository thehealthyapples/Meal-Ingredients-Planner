# DOC5 — Source of Truth Register Path Corrections

**Stage:** Complete
**Date:** 2026-07-16
**Rollback ID:** `rollback/DOC5-sot-register-path-corrections-20260716` → `7d1dd2ce`
**Snapshot:** `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` → scratchpad (`REGISTER.md.DOC5-pre`, md5-verified pre-edit)
**Scope:** Governing documentation only. **No code, no schema, no runtime, no ownership.**
**Authority:** `CONV1_PHASE_P2_COMPLETION.md` § 9 item 1 (`DOC`-class, `P1`-shaped); the two `COH-1` failures.
**Report:** [`docs/implementation/governance/DOC5_SOURCE_OF_TRUTH_PATH_CORRECTIONS.md`](../../../docs/implementation/governance/DOC5_SOURCE_OF_TRUTH_PATH_CORRECTIONS.md)

---

## Mission

Implement `CONV1` `DOC-5` only. Correct the two documentation defects the new `COH-1` coherence gate
fired on — Source of Truth Register **Domain 6** and **Domain 18** source paths. No ownership change,
no application code, no schema, no runtime change. Verify `verify:coherence` passes afterwards.

## Pre-work checkpoints

- [x] Rollback protection created **before any file was touched** (tag `7d1dd2ce` + md5-verified snapshot)
- [x] `git status` confirmed (dirty tree, ~9 concurrent sessions — **preserved, nothing of theirs touched**)
- [x] `docs/architecture/README.md` read (Architecture Bootstrap, STEP 2)
- [x] `CONV1_PHASE_P2_COMPLETION.md` read — § 6.1 (the defects), § 6.4 (why the gate shipped red), § 9 (this item)
- [x] **Both defects reproduced at source before editing** — `verify:coherence` run first: `2 failed, 0 warned`
- [x] **Every claim verified against the tree** (`L1` — never inherit a claim, however well cited)

## What changed — 1 governing document, 3 rows

| Row | Was | Now |
|---|---|---|
| **Domain 6** Authoritative Source (`:178`) | `server/lib/dietRules.ts` | **`shared/dietRules.ts`** |
| **Domain 18** Authoritative Source (`:339`) | *"Contested (`nutrition-benefit-library.ts` vs WS0)"* | **Contested — WS0 (`shared/knowledge/` → DB `knowledge_*`) vs a library absent from the tree** |
| **Appendix A** Dietary Rules (`:1081`) | `server/lib/dietRules.ts` ← *duplicated in client* | **`shared/dietRules.ts`** — one module, both planes |

**Both `Status` rows byte-unchanged.** Phases 3–8 (history + migration plans) **not edited**, per this
document's own OWN-5 doctrine: *"the correction of record is this row"*.

## Findings

1. **Both defects were exactly what P2 said: path rot, zero ownership change.** Domain 6's owner *is*
   `dietRules.ts` — Rule 4 and `ARCHITECTURE_PRINCIPLES.md` § M3 ordered it to `shared/`, **M3 is
   verifiably complete** (both rivals deleted; client `meals-page.tsx:46` and server both import
   `@shared/dietRules`), **and nobody told the Register**.
2. **Domain 18's rival was condemned by this document five sections below the row calling it live** —
   Phase 4: *"Retire. Superseded by WS0."* The file is absent from tree **and `HEAD`**, with **zero
   consumers** of `getNutritionBenefit`/`BENEFIT_MAP`. The replacement wording is **verbatim Rule 1's
   own example** of an acceptable declaration — not composed.
3. **The defect had a THIRD site the gate cannot see** (`:1081`, Appendix A). `COH-1` reads only
   `### Domain N:` blocks' Authoritative Source rows; **Appendix A holds a second copy of every
   path**. Correcting the row alone would have left the Register answering one question two ways —
   certified green. `DOC-1` had already set the precedent of correcting both.
4. **Both `Status` rows are stale and were deliberately left** — recording a contest as over is an
   ownership act. Domain 18's additionally needs a **live-consumer audit**: a missing rival does not
   prove WS0 serves the fact today.
5. **`xc-register-currency` is firing falsely** and was firing before this change: it claims the
   Register *"still marks Plant Diversity Contested"*. It does not — Domain 22 reads *"Authoritative
   — published and verified"*. Its 400-char regex spans from Appendix A `:1079` into **Domain 7's**
   legitimately-contested row, **which `DOC-1` itself wrote**. Not fixed: that is code.

## Verification

- **`npm run verify:coherence`: `2 failed` → `0 failed, 0 warned` — `RESULT: PASS`, exit 0.**
- **Coverage identical** — 33 domains · 102 citations · 91 tables. **The gate was not lowered**;
  0 warns proves both rows still declare a real, resolving owner rather than gate-invisible prose.
- `verify:publication` **identical** to P2's baseline: 22 domains (🟢5 · 🟡12 · 🔴5), 60 checks
  (31/21/8). `xc-register-currency` predicates **identical before and after**.
- `repo-structure-verify.sh` — same 2 pre-existing root strays (`.glibcheck.txt`,
  `.libdirs_uxhome.txt`, untracked, `18:52`, **not this workstream's**).
- **Diff: 1 file, 3 rows, docs only.** Only two code paths read this file (the two gates) — **both
  run**; every other `server/`/`shared/` mention verified to be a comment citation.
- All three cited owners exist **at `HEAD`** with no uncommitted modifications — the corrections hold
  on a clean checkout.

## Next action

Complete. **Next: `COH-3` — wire `verify:coherence` into `release:check`.** This is the item `DOC-5`
existed to unblock: P2 § 6.4 refused to wire a red gate (*"wiring follows the correction"*) and the
gate is now green. A one-line `package.json` change — **but a code act, not this workstream's**.
⚠️ Coherence can be wired **alone**: `typecheck:ci` carries 32 pre-existing regressions and
`verify:publication` is red on 5 domains, so neither can follow yet.

Then, in CONV1's unchanged order: **`DOC-6`** (resolve the two stale Status rows — Domain 6 nearly
free, Domain 18 needs the consumer audit; **do not merge them**), the `xc-register-currency` regex
scope, deepening `COH-1` to Appendix A, and **P3 — `BEH-1` · `BEH-4` · `BEH-7`** (which must first
absorb `DOC-3` § 5.1's `opportunity-engine.ts:82` finding).
