# Pre-Deployment Verification Gate

**Status:** Canonical engineering protocol. `TRUST1-V3` (2026-07-11).
**Owns:** the required status checks on `main`, the branch-protection settings that enforce them,
the promotion path from a developer's machine to production, and the emergency bypass.
**Machine-readable spec:** [`../../scripts/ci/branch-protection.json`](../../scripts/ci/branch-protection.json) — the values live there, not here.
**Verifier:** `npm run verify:branch-protection`
**Related:** [`COMMIT_PUSH_DEPLOY_PROTOCOL.md`](./COMMIT_PUSH_DEPLOY_PROTOCOL.md) (who may push and deploy) ·
[`ROLLBACK_PROTECTION_PROTOCOL.md`](./ROLLBACK_PROTECTION_PROTOCOL.md) (rollback identifiers) ·
[`../checklists/PRODUCTION_RELEASE.md`](../checklists/PRODUCTION_RELEASE.md) (the release checklist)

---

## 1. There is one gate

The pre-deployment gate is **the CI pipeline built by `TRUST1-S10`** — `.github/workflows/ci.yml`,
job `verify`, reported to GitHub as the status check **`typecheck · test · build`**.

That is the *only* gate. There is no second pipeline, no separate release workflow, and no
parallel verification job. `npm run release:check` runs the same three commands on a developer's
machine that CI runs on the runner — it is the same gate, executed early, not a rival to it.

**Nothing may be added beside it.** If a check is worth blocking a deploy for, it belongs in that
job. A second pipeline is a second answer to "is this safe to ship", and within a month the two
will disagree.

---

## 2. The promotion path

Every line of code that reaches a household travels this path, and no other.

| # | Stage | What happens | What stops a bad change here |
|---|---|---|---|
| **1** | **Developer** | Work on a branch — *never* on `main`. Before pushing: `npm run release:check` (typecheck regression gate → 65 test suites → build) | The same three commands CI will run. Failing here costs a minute; failing in CI costs twenty |
| **2** | **GitHub** | Push the branch. Open a pull request against `main`. **A direct push to `main` is rejected by the server** — protection requires a pull request | `git push origin main` fails. So does `./deploy.sh`, at its push step (see §6) |
| **3** | **CI** | `typecheck · test · build` runs on the pull request: `npm ci` → `verify:coherence` (`COH-4`) → `ci:setup-db` (Postgres service container, schema, migrations, seeds) → `typecheck:ci` → `npm test` (65 suites, **including all six TRUST1 security suites**) → `npm run build` | Any failing step fails the job. The check goes red. **The merge button is disabled** |
| **4** | **Approved merge** | A named human merges, having read [`../checklists/PRODUCTION_RELEASE.md`](../checklists/PRODUCTION_RELEASE.md). The branch must be up to date with `main` (`strict: true`), so the green check was produced against what will actually land | A red or missing check blocks the merge — **for administrators too** (`enforce_admins: true`). Green CI is *necessary*, never *sufficient*: the human authorisation is still required |
| **5** | **Deployment** | Render auto-deploys from `main`. **The merge in stage 4 *is* the deployment** | `main` can only advance through stage 4. Therefore production can only be reached by a commit whose required check was green |

**Read stage 5 twice.** Because Render deploys `main` automatically, merging to `main` is deploying
to production. There is no separate "deploy" decision after the merge, and no one should be waiting
for one. The pull request is the release.

---

## 3. The required status checks

**One required check: `typecheck · test · build`.** It is green only when all of these passed, on a
clean runner, against an empty database, with no production secret:

| Inside the check | Fails when |
|---|---|
| `npm ci` | The lockfile is inconsistent |
| `npm run verify:coherence` | A Source of Truth Register domain names an owner that does not exist (`COH-1`), or a `file:line` citation in `docs/architecture/` resolves to nowhere (`COH-2`) — *a governing document has stopped describing the code it governs*. Added by `COH-4`; runs first, because it is the only gate needing no database, no secret and no build |
| `npm run ci:setup-db` | A migration cannot be applied to an empty database — *which means production could not apply it either* |
| `npm run typecheck:ci` | A **new** type error appears against the frozen baseline (`scripts/ci/typecheck-baseline.json`) |
| `npm test` | Any of 65 suites fails — **including `trust1-s1`, `trust1-s2`, `trust1-s3`, `trust1-s3a`, `trust1-s5`, `trust1-s8-p8`** |
| `npm run build` | The bundle does not build |

**The six TRUST1 security suites are mandatory and are not optional, skippable, or `continue-on-error`.**
Reintroducing the `TRUST1-S1` authentication bypass fails the gate; that was demonstrated, not
assumed. Removing a TRUST1 suite from `npm test` removes it from the gate — treat any such change
as a security change.

> **The check name is load-bearing.** GitHub matches a required check by the CI **job's name**.
> Rename the `verify` job in `ci.yml` and the required context never reports again: every pull
> request then waits forever on a check that no longer exists. `npm run verify:branch-protection`
> asserts the two still match, and fails if they have drifted.

---

## 4. Branch protection on `main`

The settings are in [`../../scripts/ci/branch-protection.json`](../../scripts/ci/branch-protection.json).
They are not repeated here — one owner per fact. What each one is *for*:

| Setting | Why it exists |
|---|---|
| `required_status_checks.contexts: ["typecheck · test · build"]` | The gate. Without this, CI reports and nothing waits for it |
| `required_status_checks.strict: true` | The branch must be up to date with `main` before merging. A branch that passed CI three days ago has not been tested against what is on `main` now |
| `required_pull_request_reviews` (0 approvals) | Requires a **pull request**, which is what closes direct pushes to `main`. Zero approvals because THA has one maintainer — a gate that *cannot* be satisfied is a gate that gets switched off, and requiring a second human to approve on a solo repository is exactly that gate |
| `enforce_admins: true` | **The most important setting here.** Without it, the one person who can merge is the one person the gate does not apply to, and the gate is decoration. With it, bypassing is a deliberate, visible act — which is the entire design of §8 |
| `allow_force_pushes: false` | History on `main` cannot be rewritten around the gate |
| `allow_deletions: false` | `main` cannot be deleted and recreated unprotected |
| `required_conversation_resolution: true` | An unresolved review comment cannot be merged past silently |

### Turning it on — the order matters

**CI has never run on GitHub.** It was proven locally against a faithful reproduction (`TRUST1-S10`),
and its first real run may need a correction. A required check that has never reported blocks *every*
merge, so do not enable protection before the check exists:

1. Push a branch and open a pull request. Let `typecheck · test · build` run **at least once** and go green. (If the first run needs a fix, fix it — that is expected.)
2. Apply the protection: `npm run verify:branch-protection -- --print-apply` prints the exact command. Run it yourself. **No script in this repository applies it** — branch protection is production configuration, and `COMMIT_PUSH_DEPLOY_PROTOCOL.md` §3 reserves that to a human.
3. Verify it took: `npm run verify:branch-protection` → all PASS.
4. Prove it blocks: open a pull request with a deliberately failing test, confirm the merge button is disabled, then close it. **A gate that has never refused anything is a hope, not a control.**

### If protection is unavailable

Branch protection is not offered on **private repositories on the GitHub Free plan**. If
`npm run verify:branch-protection` returns 403, the gate **cannot be enforced by GitHub** on this
repository. Do not assume it is on. The options are: make the repository public, upgrade the plan,
or accept that promotion is enforced only by `TRUST1-O7`'s hardened `deploy.sh` and by discipline —
**and record that acceptance in writing**, because an unenforceable gate everyone believes in is
worse than no gate at all.

---

## 5. Rollback, through the gate

A rollback is a promotion like any other. It does not get a free pass.

| Situation | Do this | Why |
|---|---|---|
| **A bad deploy is live and production is degraded** | **Roll back in Render** — redeploy the previous successful deploy. Then open a revert pull request through the normal path | This is the fastest safe action and it needs **no bypass at all**: it ships a commit that already passed the gate. Reach for this *before* §8, always |
| **A bad commit is on `main`, production is fine** | `git revert <sha>` on a branch → pull request → green check → merge | The revert is code. Code passes the gate. `main` is never force-pushed (`allow_force_pushes: false`), so a rollback is always a *new commit*, never a rewritten history |
| **A rollback tag exists** (`rollback/<WORKSTREAM>-<slug>-<date>`) | Unchanged — see [`ROLLBACK_PROTECTION_PROTOCOL.md`](./ROLLBACK_PROTECTION_PROTOCOL.md). Restore from it on a branch, then promote the restoration through the gate | The tag protects committed state. The gate governs how that state gets back to `main` |

**The gate makes rollback safer, not slower.** The one thing it forbids is putting *untested* code on
`main` in a hurry — which is how most incidents are made worse.

---

## 6. What this gate does **not** close

Stated plainly, because a gate people over-trust is more dangerous than one they distrust.

- **`deploy.sh` still runs `git add -A`, still auto-commits the entire working tree, and still does not run the tests.** After protection is applied, its `git push origin main` is **rejected by the server** — so it can no longer reach production. But it will already have committed whatever was lying in your working tree before it fails. Hardening it is **`TRUST1-O7`**, and it is the next task.
- **`scripts/post-merge.sh` runs `npm run db:push` automatically after every merge** (wired to `.replit`'s `[postMerge]` hook), and **`scripts/migrate-prod.sh` runs `drizzle-kit push --force` straight at the production database.** Neither passes through CI, a pull request, or this gate. A *schema* can therefore still reach production without any verification at all. That is **`TRUST1-O8` / risk `R6`**, it is open, and it is the largest data-loss risk in the platform. **A green check on `main` says nothing about your schema.**
- **Render can be deployed by hand from its dashboard.** Nothing in git prevents it.
- **CI does not scan dependencies.** No `npm audit`, no Dependabot (`TRUST1-S10`'s remaining half).
- **Typecheck is frozen, not clean.** 175 pre-existing errors are baselined. The gate stops new ones; it does not mean the code typechecks.

---

## 7. Who may bypass

**The accountable owner (Colin Clapson) — and no one else.** Not "an admin", not "whoever is
on call". One named person.

---

## 8. Emergency bypass procedure

> **Read §5 first.** Almost every emergency is better served by a Render rollback to the last good
> deploy, which requires **no bypass**. Bypass only when *new* code must reach production *now* and
> the gate cannot deliver it.

**A bypass is permitted only when all three are true:**

1. **Production is broken or a live security exposure is being actively exploited** — not "a deadline", not "the fix is obvious", not "the failure is unrelated to my change".
2. **Rolling back in Render does not resolve it** (§5).
3. **The gate cannot produce a green check in time** — because it is failing for a reason unconnected to the fix, or the ~20-minute suite is genuinely too slow for the harm being done.

If all three hold, the accountable owner — **and only the accountable owner** — may proceed.

### The procedure

```bash
# 0. WRITE DOWN THE TIME. The clock starts now. The bypass window is 60 minutes.

# 1. Open the gate — for admins only, and deliberately. This is an auditable act, not a silent one.
gh api -X DELETE repos/<owner>/<repo>/branches/main/protection/enforce_admins

# 2. Ship the fix. Smallest possible change. Nothing else rides along.
#    Open a PR and merge it as an admin (the red check no longer blocks you), or push directly.
#    Run whatever you can of the suite locally first — `npm run release:check`, or at minimum the
#    six TRUST1 security suites. "No time to test" is not the same as "no time to test anything".

# 3. CLOSE THE GATE. Before you tell anyone it is fixed. Before coffee. Before anything.
gh api -X POST repos/<owner>/<repo>/branches/main/protection/enforce_admins

# 4. Prove it closed. A setting you have not verified is a claim, not a control.
npm run verify:branch-protection        # must print: ✓ ... enforced on main
```

**Step 3 is the step that gets forgotten**, and a gate that was disabled once and never re-enabled
is the normal end of a gate's life. If you do only one thing from this document, do step 3.

### Within 24 hours — the bypass is not finished until this is done

1. **Log it in §9 below.** A bypass with no row in that table did not happen, officially, and will happen again.
2. **Make the gate green.** The code that went in under bypass must be brought back under the gate — a follow-up pull request that passes `typecheck · test · build` in full. If it cannot pass, you shipped something that does not pass the tests, and that is now the most important thing in the backlog.
3. **Write down why the gate could not be used.** If the answer is "the suite is too slow", that is a fixable engineering problem (shard it), not a permanent licence to bypass. If it is "a suite is flaky", fix the flake. **Every bypass is evidence of a defect in the gate, and the gate is what protects the households.**

### Never

- **Never disable the required status check itself** (removing the context from protection). Re-enabling `enforce_admins` is one command and is obviously reversible; a removed required check looks like a configured gate and is not one. That is exactly how `EWO-PRO1` declared three controls that were not there.
- **Never force-push `main`** to "clean up" afterwards.
- **Never bypass to ship a feature.** There is no feature that is worth it.

---

## 9. Bypass log

Every bypass, appended here, newest first. **No bypass is complete until its row exists.**

| Date / time (UTC) | Who | Why the gate could not be used | What was merged (SHA) | Protection restored at | Follow-up PR that made it green |
|---|---|---|---|---|---|
| — | — | *No bypass has been used.* | — | — | — |
