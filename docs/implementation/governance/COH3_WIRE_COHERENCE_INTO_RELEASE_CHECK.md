# COH-3 — Wire the Coherence Gate into `release:check`

**Workstream:** `COH3_Wire_Coherence_Into_Release_Check`
**Date:** 2026-07-16
**Rollback identifier:** `rollback/COH3-wire-coherence-into-release-check-20260716` → `7d1dd2ce`
**Status:** ✅ **COMPLETE** — wired, and **reported honestly rather than as a green tick** (§ 4).

> **Scope.** `COH-3` only: `verify:coherence` into `release:check`, plus the release ritual that
> documents that chain. **No coherence rule altered. No gate lowered. No unrelated release check
> fixed.** Implementation report — it creates no rule, and where it and any governing document
> disagree, **this document is the defect.**

---

## 0. THE HEADLINE

**The gate is wired — a pure insertion at position 3, ahead of typecheck/test/build.** P2 § 6.4
promised *"wiring follows the correction"*; `DOC-5` made the correction; this is the wiring.

**And it buys less than the tick suggests, which is the part worth reading:**

1. **`release:check` never reaches the new gate today** — it dies at **gate 1**, and **all four**
   pre-existing gates in the chain are red (§ 3). None of them is `COH-3`'s to fix.
2. **CI does not run `release:check` at all** (§ 4.2). `ci.yml` runs `typecheck:ci → test → build`
   directly. **So this wiring adds no automatic enforcement on any push or pull request** — it binds
   the manual release ritual only.
3. **`COH-3` must land in the same commit as `DOC-5`** (§ 4.3). At `HEAD` both corrected defects are
   still present, so **shipping this `package.json` line without `DOC-5`'s Register corrections turns
   `release:check` red on coherence** — manufacturing the exact `R2` that P2 § 6.4 refused.

> **The wiring is correct and the enforcement is thin.** Saying only the first half would be the
> green-check-that-means-nothing this programme exists to end.

---

## 1. WHAT CHANGED — two files, one line and one section

| File | Change |
|---|---|
| `package.json` | **one line** — `verify:coherence` inserted into `release:check` at position 3 |
| `RELEASE.md` | **Step 0c** — the release ritual now documents the gate it now runs |

```diff
- "release:check": "npm run verify:deployment-config && npm run verify:release-packaging && npm run typecheck:ci && npm run adoption:check && npm run test && npm run build"
+ "release:check": "npm run verify:deployment-config && npm run verify:release-packaging && npm run verify:coherence && npm run typecheck:ci && npm run adoption:check && npm run test && npm run build"
```

**A pure insertion.** No existing gate reordered, removed, weakened, or re-baselined. `package.json`
re-parsed as valid JSON; the diff against the pre-edit snapshot is **exactly one line**.

**Why `RELEASE.md` is in scope and is not scope creep:** it is the ritual that *documents this
chain*, and its `:340` sentence — *"Both gates run, in this order, ahead of typecheck/test/build in
`npm run release:check`"* — is a present-tense claim about the very string `COH-3` edits. **A gate
added to the pipeline and absent from the ritual is documentation rot committed by the workstream
whose entire purpose is to detect documentation rot.** The sentence now reads *"All three gates"*.

---

## 2. THE PLACEMENT DECISION — position 3, and why not position 1

`verify:coherence` is a pure filesystem check: no database, no network, no build. It is the
**cheapest gate in the chain**, and it now runs **ahead of typecheck/test/build** — so a governing
document that disagrees with the tree fails before the expensive stages spend anything. That is
exactly the shape `RELEASE.md` already describes for Step 0a/0b.

**Position 1 was considered and rejected.** It is the only placement where the gate would execute in
*today's* tree, because gate 1 is red (§ 3) and `&&` short-circuits. **That is an argument for
optimising against a temporary failure, not for a correct steady state.** Steps 0a/0b are the
deployment-integrity preflight the release ritual documents *first*; reordering a documented ritual
to dodge someone else's red gate would buy nothing — the chain still dies at gate 1 either way — and
would leave a permanent distortion behind once the gate is repaired. **The gate is placed where it
belongs, and the fact that the chain does not reach it today is reported (§ 4.1) rather than
engineered around.**

**Grouping with `adoption:check`** — the other governance gate — was also rejected: it sits at
position 5, behind `typecheck:ci`, and moving it is a change to a gate `COH-3` was told not to touch.

---

## 3. THE MEASURE — every gate in the chain, run here, never inherited (`CP11`)

| # | Gate | Before `COH-3` | After `COH-3` | Whose? |
|---|---|---|---|---|
| 1 | `verify:deployment-config` | ✗ **exit 1** — 5 passed, 1 failed (*"Deployment config committed"* — `.replit` uncommitted) | ✗ **identical** — 5 passed, 1 failed | **concurrent session** |
| 2 | `verify:release-packaging` | ✗ **exit 1** — 4 passed, 1 failed (2 untracked `attached_assets/North Star/*.png`) | ✗ **identical** — 4 passed, 1 failed | **concurrent session** |
| **3** | **`verify:coherence`** ← **NEW** | *not in the chain* | ✅ **exit 0** — **0 failed, 0 warned** | **`DOC-5` + `COH-3`** |
| 4 | `typecheck:ci` | ✗ **exit 1** — baseline 168 → current 304 = **32 regressions** | ✗ **unchanged** | **concurrent sessions** (P2 § 2 proved none is P2's) |
| 5 | `adoption:check` | ✗ **exit 1** — 64 passed, **2 failed** (button ceiling 539>538; `HouseholdNutritionPanel.tsx` orphan) | ✗ **unchanged** — 64/2 | **concurrent session** |
| 6–7 | `test` · `build` | not reached | not reached | — |

**`COH-3` moved no gate's numbers.** Gates 1 and 2 were re-run *after* the edit and report their
pre-edit figures to the digit.

**Rules untouched, verified rather than asserted:** `scripts/ci/verify-governing-coherence.ts` has
mtime **2026-07-16 20:24**, predating this workstream's first edit, and `git diff` reports the other
four gate scripts **clean**. **The coherence rules are P2's, byte-for-byte.**

**All four pre-existing failures are dirty-tree artefacts of ~9 concurrent sessions** — an
uncommitted `.replit`, two untracked images, uncommitted type regressions, uncommitted client
components. **`COH-3` is not authorised to fix any of them**, and did not.

---

## 4. WHAT THIS WIRING DOES *NOT* ACHIEVE

### 4.1 `release:check` does not reach the new gate today

```
$ npm run release:check
> npm run verify:deployment-config && … && npm run verify:coherence && …
  Total: 5 passed, 1 failed
RESULT: FAIL — the deployment configuration in this checkout is not the one that would deploy.
CHAIN EXIT: 1
```

**It stops at gate 1.** `&&` short-circuits, so coherence — and everything after it — never runs.
**The wiring is nonetheless live, and that was proved, not assumed:** run from position 3, the gate
passes (exit 0) and hands off to `typecheck:ci`, which then fails on its own pre-existing
regressions. **The link works; the chain in front of it is red.**

### 4.2 CI does not run `release:check` — so nothing is enforced automatically

`.github/workflows/ci.yml` runs `ci:setup-db → typecheck:ci → npm test → npm run build`. **It never
invokes `release:check`**, and therefore never invokes `verify:coherence`,
`verify:deployment-config`, `verify:release-packaging` or `adoption:check`. `AUDIT_2026-07-13.md`
§ 81 already named this: *"CI runs 3 of the 7 gates. `release:check` chains six; `ci.yml` runs
three."*

> **The mission was `release:check`, and `release:check` is a ritual a human must choose to run.**
> The gate's enforcement home — the thing that runs on every push and is the required status check on
> `main` — is `ci.yml`, and **`COH-3` deliberately did not touch it** (§ 5). **Wiring a gate into a
> chain nobody automated is a smaller act than it sounds, and it is recorded here as such.**

### 4.3 ★ `COH-3` cannot ship without `DOC-5`

At `HEAD`, both defects `DOC-5` corrected are **still present** — `DOC-5`'s corrections are
uncommitted in this tree:

```
$ git show HEAD:docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md
  :164  | Authoritative Source | **server/lib/dietRules.ts** |                                  ← COH-1 fails
  :302  | Authoritative Source | **Contested** (`nutrition-benefit-library.ts` vs WS0 …) |      ← COH-1 fails
```

**So this `package.json` line, committed alone, makes `release:check` red on coherence** — *"wiring
in a red gate is how `R2` is manufactured, not cured"* (P2 § 6.4), committed by the workstream that
quotes it. **`COH-3` and `DOC-5` are one landing**: the Register corrections must be in the same
commit, or ahead of it. **The gate passes in this working tree only because `DOC-5` is in this
working tree.**

---

## 5. WHAT `COH-3` DELIBERATELY DID NOT DO

| Not done | Why |
|---|---|
| **Add `verify:coherence` to `ci.yml`** | **The enforcement that would actually bite** (§ 4.2) — and **not this mission**, which named `release:check`. It is also not a free step: the required status check on `main` is matched **by job name**, and that name is the string `"typecheck · test · build"` — an API identifier, recorded in `scripts/ci/branch-protection.json` and defended by `verify:branch-protection`. **Adding coherence to that job makes the name a lie; renaming it makes every open PR wait forever on a check that no longer exists.** A real decision, needing its own authorisation. **Recommended as `COH-4`.** |
| **Fix any of the four red gates** | *"Do not fix unrelated release checks."* All four are concurrent sessions' uncommitted work (§ 3). **Fixing them to make `COH-3` look green would be lowering gates to flatter a workstream.** |
| **Re-order the chain to put coherence first** | It would run today — **and only because gate 1 is red.** § 2: optimising against a temporary failure, permanently. |
| **Touch the coherence rules** | *"Do not alter the coherence rules."* The script is byte-identical to P2's (§ 3). **The `COH-1` ceilings `DOC-5` § 4 found are real and are still open — and deepening a check while wiring it would make a failure impossible to attribute to either act.** |
| **Document `adoption:check` in `RELEASE.md`** | It is in `release:check` and appears **nowhere** in the release ritual — a **pre-existing** `PX1-W5` documentation gap, found here and **left**: it is an unrelated check, and this workstream documents its own change only (§ 6). |

---

## 6. A PRE-EXISTING GAP, FOUND AND NOT FIXED

`RELEASE.md`'s checklist documents Step 0a (`verify:deployment-config`) and Step 0b
(`verify:release-packaging`) — and **stops**. `adoption:check` has been in `release:check` since
`PX1-W5` (2026-07-13) and **is not mentioned in the release ritual at all**, nor are `test` and
`build` given a step.

> **The pattern `DOC-5` found in the Register is here too: a chain changed, and the document that
> describes it not.** `COH-3` did not repeat it — Step 0c exists — but it did not fix `PX1-W5`'s
> instance either, because that is an unrelated check and this mission forbade it. **Recorded so the
> next reader does not have to rediscover it.**

---

## 7. ARCHITECTURE COMPLIANCE

- **Bootstrap (STEP 2):** `docs/architecture/README.md` read first; `CONV1_PHASE_P2_COMPLETION.md`
  (§ 6.4 — the authority for this item; § 2 — the typecheck baseline) and
  `DOC5_SOURCE_OF_TRUTH_PATH_CORRECTIONS.md` (§ 8 item 1 — this item's specification) read in full.
- **`REPOSITORY_CONVENTIONS.md`:** no new root file; `RELEASE.md` is an existing permitted root
  document. **`repo-structure-verify.sh` unchanged** — same 2 pre-existing untracked strays.
- **Principle 2 / 7 / 8:** not engaged. **No owner, store, bridge, or schema touched.**
- **No runtime behaviour change:** `release:check` is a developer/release script. **No server, client,
  shared, schema, or migration file touched.** The diff is `package.json` (one script string) and
  `RELEASE.md` (documentation). **Nothing in the running application reads either.**
- **No gate lowered:** the only change to the chain is an **addition**. Every other gate re-run after
  the edit reports its pre-edit numbers (§ 3). **No baseline re-recorded** — P2's instruction (*"do
  NOT re-record the baseline to make this pass"*) holds, and `typecheck:ci` remains red on 32
  regressions this workstream did not cause and did not hide.
- **Product Registry / Adoption Register:** no user-facing surface, no client-side building block.
  `adoption:check` **unchanged** (64/2).

---

## 8. NEXT — recommended, not decided

| # | Workstream | Why here | Cost |
|---|---|---|---|
| **1** | **`COH-4` — run the coherence gate in CI** | **§ 4.2 is the finding: `release:check` is not automated, so `COH-3` enforces nothing on a push or a PR.** The gate that runs is `ci.yml`. **Not free** — the required status check is matched by the job name `"typecheck · test · build"` (`branch-protection.json`, `verify:branch-protection`), so this needs a deliberate decision about the name and the required contexts. **Until this lands, coherence is enforced only by whoever remembers to run the ritual.** | **Low / Medium** |
| **2** | **Commit `DOC-5` and `COH-3` together** | **§ 4.3 — not optional.** This line alone turns `release:check` red on coherence at `HEAD`. | **—** |
| **3** | **`DOC-6` — the two stale `Status` rows** (Domain 6, Domain 18) | `DOC-5` § 8. Domain 6 is nearly free (M3 verifiably complete); **Domain 18 needs a live-consumer audit — do not merge them.** | Low / Medium |
| **4** | **Scope `xc-register-currency`'s regex to Domain 22** | `DOC-5` § 6 — the check miscounts a `DOC-1` success as drift. **A check that cries wolf is spent from the gate's credibility** (`R2`). | Low |
| **5** | **Deepen `COH-1` to Appendix A** | `DOC-5` § 4 — the gate is blind to the second copy of every path. **Correct to do now that it is green** (P2 § 9), and **now that it is wired**, this is also the moment it starts to bite. | Low |
| **6** | **P3 — `BEH-1` · `BEH-4` · `BEH-7`** | CONV1's order, unchanged. `BEH-4` **must first absorb `DOC-3` § 5.1's `opportunity-engine.ts:82` finding**. | Low |

**P2's two non-negotiable orderings stand:** scaffolding comes down last (`R7`); `BEH-5` cannot
precede `SCH-2` (`R3`).

---

## 9. ROLLBACK

**Identifier:** `rollback/COH3-wire-coherence-into-release-check-20260716` → `7d1dd2ce`

> ⚠️ **The tag is a marker, not a restore point.** `7d1dd2ce` predates every uncommitted P0/P1/P2,
> `DOC-5` and concurrent-session change in this tree. **A tag checkout would destroy them.**

**To roll back `COH-3`, restore two files** from the md5-verified pre-edit snapshots:

| Action | Path |
|---|---|
| restore | `package.json` — `<scratchpad>/package.json.COH3-pre` *(or delete the ` && npm run verify:coherence` clause from `release:check`)* |
| restore | `RELEASE.md` — `<scratchpad>/RELEASE.md.COH3-pre` |
| delete | this report · `.engineering/session/runs/COH3_Wire_Coherence_Into_Release_Check.md` |

**Reverting removes one gate from one script and one documentation section.** No code, schema,
migration, runtime state, or coherence rule is involved — **there is nothing else to undo.**

---

*Implementation report for CONV1 item `COH-3`. It creates no rule and is not law. Subordinate to the
governing architecture, which prevails in any conflict.*
