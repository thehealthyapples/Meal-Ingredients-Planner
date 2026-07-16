# COH-4 — Enforce the Coherence Gate in CI

**Workstream:** `COH4_Enforce_Coherence_In_CI`
**Date:** 2026-07-16
**Rollback identifier:** `rollback/COH4-enforce-coherence-in-ci-20260716` → `7d1dd2ce`
**Status:** ✅ **COMPLETE** — coherence runs automatically on every push and pull request, **inside
the required check, without renaming it.**

> **Scope.** `COH-4` only: `verify:coherence` into `.github/workflows/ci.yml`, plus the protocol that
> documents that job. **No coherence rule altered. No gate lowered or re-baselined. No unrelated CI
> failure fixed. Branch protection untouched.** Implementation report — it creates no rule, and where
> it and any governing document disagree, **this document is the defect.**

---

## 0. THE HEADLINE

**The gate now runs by itself.** `COH-3` wired it into `release:check` — a ritual a human must choose
to run, which CI never invokes. **This step is where it finally runs without being remembered**: on
every push, on every pull request to `main`, inside the job whose name *is* the required status
check.

**The STOP condition was evaluated and is not triggered — and the proof is mechanical** (§ 2).
Adding a *step* does not rename a *job*. The required context is matched on `jobs.verify.name`,
which is byte-unchanged, and `npm run verify:branch-protection` **Check 1 still passes**.
`scripts/ci/branch-protection.json` was not edited and needs no human to reapply anything.

**Two things this does not buy, stated here rather than discovered later:**

1. **The check goes red; it blocks nothing.** `main` has **no verifiable protection rule** (§ 4) —
   a **pre-existing** condition, identical before and after this change, and one an agent is
   **forbidden** to fix (`COMMIT_PUSH_DEPLOY_PROTOCOL.md` § 3: branch protection is production
   configuration, applied by a named human).
2. **`COH-4` cannot ship without `DOC-5`**, and the stakes are now higher than at `COH-3`: at `HEAD`
   the two corrected defects are still present, so this step turns **CI red on every push** until the
   Register corrections land with it (§ 5).

---

## 1. CI FILES CHANGED — two, one step and one protocol row

| File | Change |
|---|---|
| `.github/workflows/ci.yml` | **one step** added to job `verify`, at position **5 of 9** — after `npm ci`, before `ci:setup-db`. **Job name, triggers, services, permissions, concurrency: untouched.** |
| `.engineering/protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md` | **§ 2 stage 3** — the CI chain now names `verify:coherence`; **§ 3** — one row added to *"Inside the check / Fails when"* |

```yaml
      - name: Install dependencies from the lockfile
        run: npm ci

      # COH-4 — the cheapest gate in this job: pure filesystem reads. No database, no secret, no
      # build. It runs FIRST for exactly that reason …
      - name: Governing-document coherence (COH-1 · COH-2)
        run: npm run verify:coherence

      - name: Set up the test database (schema + ordered migrations)
        run: npm run ci:setup-db
```

**`scripts/ci/branch-protection.json` — NOT changed.** It is the single source of truth for what
*"main is protected"* means, and nothing in this workstream alters what that sentence means (§ 2).

**Why the protocol is in scope and is not scope creep:** `PRE_DEPLOYMENT_VERIFICATION_GATE.md` § 2
stage 3 and § 3 **enumerate this job's chain, command by command**. They are present-tense claims
about the exact thing `COH-4` edits. **A step added to the job and absent from the protocol that
documents the job is documentation rot, committed by the workstream built to detect documentation
rot** — the same reasoning that put Step 0c in `RELEASE.md` under `COH-3`.

---

## 2. REQUIRED-CHECK IMPACT — **none**, and here is the proof

The mission's STOP condition: *"if enforcement requires renaming the required job or changing branch
protection."* **It requires neither.**

| Link in the contract | Before | After |
|---|---|---|
| `ci.yml` → `jobs.verify.name` | `typecheck · test · build` | **`typecheck · test · build` — byte-identical** |
| `branch-protection.json` → `requiredCheck` | `typecheck · test · build` | **not edited** |
| `branch-protection.json` → `contexts` | `["typecheck · test · build"]` | **not edited** |
| `verify:branch-protection` **Check 1** *(the drift it exists to catch)* | PASS | ✅ **PASS** — *"required check `typecheck · test · build` matches the verify job"* |

**A required status check is matched on the job's NAME, not on its steps.** GitHub reports one
context per job; a job's steps are invisible to the required-check contract. So a step may be added
freely, and the context keeps reporting under the name it always had.

### 2.1 A correction to `COH-3`'s own report

**`COH-3` § 5 overstated this, and the overstatement is withdrawn here.** It said adding coherence to
this job *"makes the name a lie"*, and graded the item **Low/Medium** on that basis. **The
architecture had already answered it, in `ci.yml`'s own comment (`:43`):**

> *"GitHub matches a required check by the job name, so `"typecheck · test · build"` is an **API
> identifier, not a label**: rename it and the required context never reports again."*

**The name was never an inventory of steps.** This job has always run nine steps and named three of
them: `Check out`, `setup-node`, `SESSION_SECRET`, `npm ci` and `ci:setup-db` appear nowhere in it.
**A tenth unnamed step is the shape this job already had** — and the one edit that *would* have
broken the contract is the rename `COH-3` feared, which is precisely why it was not made.

> **`COH-3` reasoned from a real hazard to the wrong conclusion: that the hazard made the work
> expensive. It made one particular approach forbidden, and the cheap approach was always
> available.** Recorded because a wrong cost estimate in a governing report is the same class of
> defect this programme keeps correcting — *`L1`: never inherit a claim, however well cited,
> including one's own.*

---

## 3. PLACEMENT — step 5, ahead of everything that costs anything

`verify:coherence` reads the filesystem and nothing else. **Measured, not assumed:**

| Evidence | Result |
|---|---|
| Runs with **`DATABASE_URL` unset**, `CI=true`, `NODE_ENV=test` | ✅ **exit 0** — safe *before* `ci:setup-db` |
| Reads any env var, DB driver, or secret? | **No.** The only `pg` in the script is the `pgTable` **regex**, which reads `shared/schema.ts` as **text** |
| Cost | **676 ms** — against `typecheck:ci` at **14,065 ms**, plus a Postgres service container, 65 suites, and a bundle behind it |

**So it is placed as early as it can be and no earlier**: after `npm ci` (it needs `tsx`), before
`ci:setup-db` (it needs no database). **A governing document that no longer describes this tree now
fails in under a second, rather than after CI has paid for a database, a typecheck, 65 suites and a
build.** This is the same fail-fast reasoning `COH-3` § 2 applied to `release:check`, and here —
unlike there — **nothing red sits in front of it**, so the gate genuinely runs.

---

## 4. ★ THE HONEST LIMIT — it reports; it does not block

`npm run verify:branch-protection`, run **before and after** this change, **identical both times**:

```
  PASS  required check "typecheck · test · build" matches the verify job in .github/workflows/ci.yml
  FAIL  thehealthyapples/Meal-Ingredients-Planner@main is NOT protected
        GitHub returned 404: no protection rule, or this token is not an admin.
        Nothing blocks an untested merge to main.
```

**Check 2 fails, and it failed before `COH-4` existed.** `AUDIT_2026-07-13.md` § 80 corroborates
independently: *"Branch protection is not applied. `scripts/ci/branch-protection.json` states plainly
that 'nothing in this repository ever sends it'."*

**Stated precisely, because the 404 is ambiguous** (no rule *or* a non-admin token): **this check
cannot confirm that `main` is protected.** So what `COH-4` delivers is exact:

| Claim | Verdict |
|---|---|
| Coherence **runs** automatically on every push and PR | ✅ **Yes** — § 6 |
| A coherence failure **turns the required check red** | ✅ **Yes** — any failing step fails the job |
| A red check **blocks the merge** | ⚠️ **Unverifiable** — depends on a protection rule this repository has never been shown to have |

**`COH-4` did not fix it, and must not.** `branch-protection.json`'s own header is unambiguous:
*"Nothing in this repository ever sends it. A named human applies it — branch protection on main is
production configuration, and `COMMIT_PUSH_DEPLOY_PROTOCOL.md` §3 forbids an agent from changing
production configuration."* The command for that human already exists:
`npm run verify:branch-protection -- --print-apply`.

> **This is not `COH-4`'s deficiency — it is every CI gate's.** `typecheck`, the 65 suites and all
> six TRUST1 security suites are enforced exactly as much as coherence now is: **they report, and a
> human is trusted to look.** Coherence has joined the strongest gate the repository has. **That the
> gate is unlatched is a finding about the door, not the lock.**

### 4.1 A stale claim in the protocol, found and not fixed

`PRE_DEPLOYMENT_VERIFICATION_GATE.md` § 2 states that **"A direct push to `main` is rejected by the
server"** and that a red check means **"The merge button is disabled"**. **Neither is demonstrable
today** — Check 2 says so. Those sentences describe protection that this repository cannot show it
has.

**Not fixed here**: it is an **unrelated** pre-existing defect, it is about branch-protection *state*
rather than the CI chain `COH-4` edits, and correcting it either requires a human to apply the
protection (making the sentences true) or a decision to weaken the protocol's language (an act with
an owner who is not this workstream). **Recorded so it is not rediscovered.**

---

## 5. ★ `COH-4` CANNOT SHIP WITHOUT `DOC-5` — and now it is sharper

`COH-3` § 4.3 recorded this for `release:check`. **CI raises the stakes: it runs on `push:` with no
branch filter — every branch, every push.**

At `HEAD`, both defects `DOC-5` corrected are **still present** (its corrections are uncommitted in
this tree):

```
$ git show HEAD:docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md
  :164  | Authoritative Source | **server/lib/dietRules.ts** |                             ← COH-1 fails
  :302  | Authoritative Source | **Contested** (`nutrition-benefit-library.ts` vs WS0 …) | ← COH-1 fails
```

**Push this workflow without `DOC-5` and CI goes red on the first push, on every branch, for a defect
the pusher did not introduce.** That is the fastest possible way to have the gate switched off
(`R2`), delivered by the workstream that exists to enforce it.

> **`DOC-5` · `COH-3` · `COH-4` are one landing.** The gate is green in this working tree **only
> because `DOC-5` is in this working tree.**

---

## 6. CONFIRMATION — coherence now runs automatically

**`ci.yml` parsed with a real YAML parser, not a regex:**

```
YAML PARSES ✓
jobs.verify.name = "typecheck · test · build"     ← the required context, unchanged
steps: 9   |   coherence step present: true   |   index: 5 of 9
order:  npm ci → npm run verify:coherence → npm run ci:setup-db → npm run typecheck:ci → npm test → npm run build
triggers: {"push": null, "pull_request": {"branches": ["main"]}}
```

- **`push: null`** — no branch filter: **every push, on every branch.**
- **`pull_request: branches: [main]`** — **every pull request to `main`.**
- The step is **inside job `verify`**, whose name is the **required status check**. A coherence
  failure fails the step → fails the job → **the required context reports red.**
- The step is **not** `continue-on-error` and is **not** conditional. It cannot be skipped.

**And the gate itself, run as CI will run it** — no database, CI environment:

```
RESULT: PASS — every declared owner and every file:line citation resolves.
0 failed, 0 warned.        STEP EXIT: 0
```

---

## 7. VERIFICATION COMPLETED

| Check | Result |
|---|---|
| `verify:coherence` (as CI runs it: `DATABASE_URL` unset, `CI=true`) | ✅ **exit 0** — 0 failed, 0 warned |
| `verify:branch-protection` **Check 1** | ✅ **PASS** — required check still matches the `verify` job |
| `verify:branch-protection` **Check 2** | ✗ FAIL — **identical before and after**; pre-existing (§ 4) |
| `ci.yml` YAML parse | ✅ valid; 9 steps; job name byte-identical |
| `branch-protection.json` | **not edited** — `git diff` clean |
| Coherence **rules** | **untouched** — `verify-governing-coherence.ts` mtime `20:24`, predating this workstream; `git diff` clean |
| Other gate scripts | **untouched** — `git diff` clean |
| Baselines | **none re-recorded** — `typecheck:ci` still red on its 32 pre-existing regressions, unhidden |
| Diff | **2 files.** No server/client/shared/schema/migration file touched |

### 7.1 A mistake this workstream made, caught, and is reporting

**The first edit to `PRE_DEPLOYMENT_VERIFICATION_GATE.md` § 3 deleted the `ci:setup-db` row** while
inserting the coherence row — silently removing an existing gate from the document that defines what
the required check *is*. **It was caught by diffing against the pre-edit snapshot**, and the row was
restored **verbatim**; the final diff is **one line rewritten (stage 3) and one line added**, with
all six rows present and in CI's real execution order.

> **The snapshot is why this report can say "no gate was lowered" as a measurement rather than an
> intention.** A workstream forbidden to lower a gate came within one unverified edit of deleting one
> from the protocol — **and the only thing that caught it was checking instead of trusting.**

---

## 8. WHAT `COH-4` DELIBERATELY DID NOT DO

| Not done | Why |
|---|---|
| **Rename job `verify`** | **The one act that breaks the contract.** The name is the required context; renaming strands every open PR on a check that never reports (`ci.yml:43`). Unnecessary anyway — § 2. |
| **Edit `branch-protection.json`** | Nothing about what *"protected"* means changed. **The file is the single source of truth and it is still true.** |
| **Apply branch protection to `main`** | **Production configuration. `COMMIT_PUSH_DEPLOY_PROTOCOL.md` § 3 forbids an agent from changing it** — a named human runs `verify:branch-protection -- --print-apply`. § 4. |
| **Fix `verify:branch-protection` Check 2** | The same act, and an **unrelated** pre-existing failure. |
| **Fix the protocol's *"the merge button is disabled"*** | Unrelated pre-existing defect; § 4.1. |
| **Touch the coherence rules** | *"Do not alter coherence rules."* The `COH-1` ceilings `DOC-5` § 4 found remain open — **deepening a check in the act of enforcing it would make a red CI impossible to attribute to either change.** |
| **Fix `typecheck:ci`'s 32 regressions or `adoption:check`'s 2 failures** | *"Do not fix unrelated CI failures."* `typecheck:ci` is in this job and **stays red**; `adoption:check` is in neither this job nor scope. |
| **Add `adoption:check` / the two `verify:*` release gates to CI** | **CI still runs 4 of the 7 gates** (`AUDIT_2026-07-13` § 81 said 3; coherence makes 4). Real, and **not this mission** — § 9. |
| **Update stage 1's `release:check` summary** | § 2 stage 1 describes it as *"(typecheck regression gate → 65 test suites → build)"* — **already incomplete before `COH-3`** (it never named `verify:deployment-config`, `verify:release-packaging` or `adoption:check`). Pre-existing, unrelated, **recorded not fixed.** |

---

## 9. NEXT — recommended, not decided

| # | Workstream | Why here | Cost |
|---|---|---|---|
| **1** | **Land `DOC-5` + `COH-3` + `COH-4` as ONE commit** | **§ 5 — not optional.** Split them and CI goes red on every push for a defect the pusher did not introduce. | **—** |
| **2** | **A named human applies branch protection to `main`** | **§ 4 — the gate reports and blocks nothing, and this is true of `typecheck`, the 65 suites and all six TRUST1 security suites, not just coherence.** `npm run verify:branch-protection -- --print-apply` prints the exact command. **An agent must not do this**; it needs a person. **This is the highest-value item in this table and the only one `COH-4` cannot even attempt.** | **Low (human)** |
| **3** | **`DOC-6` — the two stale `Status` rows** (Domain 6, Domain 18) | `DOC-5` § 8. Domain 6 nearly free; **Domain 18 needs a live-consumer audit — do not merge them.** | Low / Medium |
| **4** | **Deepen `COH-1` to Appendix A** | `DOC-5` § 4 — the gate is blind to the second copy of every path in the Register. **Now it is green AND automated, this is the moment it starts to bite.** | Low |
| **5** | **Scope `xc-register-currency`'s regex to Domain 22** | `DOC-5` § 6 — it miscounts a `DOC-1` success as drift. **A check that cries wolf is spent from the gate's credibility** (`R2`). | Low |
| **6** | **P3 — `BEH-1` · `BEH-4` · `BEH-7`** | CONV1's order, unchanged. `BEH-4` **must first absorb `DOC-3` § 5.1's `opportunity-engine.ts:82` finding.** | Low |

**P2's two non-negotiable orderings stand:** scaffolding comes down last (`R7`); `BEH-5` cannot
precede `SCH-2` (`R3`).

---

## 10. ROLLBACK

**Identifier:** `rollback/COH4-enforce-coherence-in-ci-20260716` → `7d1dd2ce`

> ⚠️ **The tag is a marker, not a restore point.** `7d1dd2ce` predates every uncommitted P0/P1/P2,
> `DOC-5`, `COH-3` and concurrent-session change in this tree. **A tag checkout would destroy them.**

**To roll back `COH-4`, restore two files** from the md5-verified pre-edit snapshots:

| Action | Path |
|---|---|
| restore | `.github/workflows/ci.yml` — `<scratchpad>/ci.yml.COH4-pre` *(or delete the one `Governing-document coherence` step)* |
| restore | `.engineering/protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md` — `<scratchpad>/PDVG.md.COH4-pre` |
| delete | this report · `.engineering/session/runs/COH4_Enforce_Coherence_In_CI.md` |

**Reverting removes one step from one job and two documentation rows.** No code, schema, migration,
runtime state, coherence rule, or branch-protection setting is involved — **and because the job name
never changed, a rollback also cannot strand the required check.** There is nothing else to undo.

---

*Implementation report for CONV1 item `COH-4`. It creates no rule and is not law. Subordinate to the
governing architecture, which prevails in any conflict.*
