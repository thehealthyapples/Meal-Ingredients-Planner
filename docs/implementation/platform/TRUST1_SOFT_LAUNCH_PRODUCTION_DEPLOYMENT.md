# TRUST1 — Soft-Launch Production Deployment

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Workstream:** `platform`
**Parent programme:** [`TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md`](./TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md)
**Status:** ⛔ **HALTED AT PRE-FLIGHT — NOT DEPLOYED. NOTHING WAS PUSHED.**

---

## OUTCOME, STATED FIRST

**The deployment did not happen, and I did not attempt it.** Five pre-flight checks were run before
any push. **Four failed.** Any one of them is sufficient to stop a release on its own; the fourth
would, on the evidence available, have caused **irreversible production data loss**.

No commit was pushed. No hosted deploy was triggered. No migration was run. No production
configuration or secret was touched. The only mutation this task made to the repository is one local
annotated tag and this document.

---

## ARCHITECTURE COMPLIANCE

### The governing conflict — this must be resolved by a human before anything else

`docs/architecture/README.md` (the Architecture Bootstrap, STEP 2) states: *"If a proposed change
conflicts with the governing architecture: **STOP, explain why, and do not continue until
approved.**"*

The requested action conflicts with a canonical protocol, verbatim:

> **`.engineering/protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md` §3 — Deploy (separate approval — never implicit)**
>
> *"Specifically, an agent must never:*
> - *run a deployment command or trigger a hosted deploy,*
> - ***push to a branch that auto-deploys***,
> - *run migrations against production,*
> - *modify production configuration or secrets.*
>
> *Production is reached by a human who has read the release checklist.* ***If you believe a deploy is
> warranted, say so and stop.***"

The instruction to *"Push the current verified branch to GitHub. Allow Render to deploy"* asks for
precisely the four acts §3 reserves to a named human. §3 is not a "confirm first" rule that a request
satisfies — it is a prohibition on the *agent as an actor*, whose stated remedy is the last sentence.
**This document is me saying so, and stopping.**

Note also that the deployment request cited this protocol as `docs/architecture/COMMIT_PUSH_DEPLOY_PROTOCOL.md`.
**No such file exists.** The canonical protocol is at `.engineering/protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md`,
and it is the document quoted above. This is worth noting because the path cited is the one place the
rule *isn't*, and the rule it contains is the one that forbids the task.

### Architecture Compliance Checklist

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity          No entity created, altered, or keyed.
☑ One owner per fact              No fact restated. The gate, the rollback protocol and the
                                  release checklist are cited, never duplicated.
☑ No duplicate entities           None created.
☑ No duplicate ownership          None. This document owns no procedure; it records one halt.
☑ No duplicate state              None.
☑ Extends existing architecture   Uses the existing gate, rollback and release documents as-is.
☑ Knowledge domain compliance     No knowledge domain introduced.
☑ Honest gaps over fabrication    The whole document is the gap. Nothing is claimed as verified
                                  that was not observed; every unverifiable item is marked
                                  UNVERIFIABLE rather than assumed green.
☑ No permanent sync bridge        None.
☑ Evolution over replacement      Nothing replaced.
```

**Not user-facing.** No client file, route, surface, or copy touched. Experience & UI Governance
blocks do not apply. **Product Registry impact: NO** — nothing shipped to a household.

---

## DEPLOYMENT SUMMARY

| Item | Value |
|---|---|
| **Deployment status** | ⛔ **HALTED — nothing pushed, nothing deployed** |
| **Git commit deployed** | **NONE.** Production remains at `3ef7e8e` |
| Candidate commit (**not** deployed) | `4fd5a29` — TRUST1-V3 (Phase 0, M5b) |
| Candidate branch | `int1-intelligence-platform` |
| Production branch | `main` → `origin/main` = `3ef7e8e` (unchanged) |
| **Rollback identifier** | `rollback/TRUST1-soft-launch-production-deployment-20260711` → `4fd5a29` |
| **True production rollback target** | **`3ef7e8e`** — see Rollback Plan; this is the SHA that matters |
| Render deployment status | **Not triggered.** No deploy exists to report on |
| Working tree at halt | **Dirty** — see Blocker 1 |

### What was actually being asked for

The request describes a *"controlled soft-launch"* of *"TRUST1 security improvements"*. The diff it
would ship is:

```
git diff --shortstat origin/main..HEAD
  2,139 files changed, 1,851,035 insertions(+), 3,439 deletions(-)
  91 commits
  shared/schema.ts: +910 / -5
```

**91 commits and 1.85 million inserted lines.** The nine TRUST1 commits are a *small minority* of it.
The rest is the entire Intelligence platform (ATTN1, DEC1, LEARN1, COACH1, COMP2, BENCHINT4), the
Cookbook import, the Development World, UX0/UX1, PLAN1, KNOW4/KNOW5, and the architecture governance
corpus — none of which has ever run in production.

This is not a soft launch of a security programme. It is **the largest release in the platform's
history**, and calling it a TRUST1 deployment obscures what would actually reach households. That
framing gap is itself a finding.

---

## PRODUCTION VERIFICATION RESULTS

**None of the requested post-deployment verifications could be performed, because there is no
deployment.** Home page, login, registration, Companion, Planner, Cookbook, Shopping, Dashboard,
Admin, Benchmark pages, production migrations, runtime errors, auth regressions, TRUST1 activity —
**all UNVERIFIED, and none of them can be marked otherwise without a deploy.** They are listed in the
Manual Verification Checklist below, all unchecked. No item in this document is reported as green on
the basis of reasoning rather than observation.

---

## ISSUES DISCOVERED

### Pre-flight results

| # | Check (as requested) | Result |
|---|---|---|
| 1 | Git status is clean | ❌ **FAIL** |
| 2 | All completed TRUST1 milestone commits present | ✅ **PASS** — all 9 present |
| 3 | Rollback tag created before deployment | ✅ **PASS** — created, reported below |
| 4 | Production environment variables verified | ❌ **FAIL — UNVERIFIABLE from here** |
| 5 | `SESSION_SECRET` exists | ⚠️ **Dev only.** Production value not verifiable from here |
| 6 | Production database connectivity | ❌ **FAIL — UNVERIFIABLE from here** |

---

### 🔴 BLOCKER 1 — Git status is not clean (the request's own precondition)

The request required *"Confirm git status is clean."* **It is not.**

```
 M .engineering/session/CURRENT.md
 M .engineering/session/INDEX.md
 M .replit                                   ← see Blocker 4
?? data/cookbook/                            ← see Blocker 2
?? data/development_world/                   ← see Blocker 2
?? docs/product/
?? docs/investigations/ux/PDA1_*.md  (×2)
?? scripts/build-product-inventory.ts, build-registry-nav.ts,
   capture-product-screenshots.ts, verify-product-inventory.ts
```

This is the same pre-existing `PDA1`/`PKR` working tree recorded in `TRUST1_V3`'s rollback block. It
is not mine, I did not author it, and per `COMMIT_PUSH_DEPLOY_PROTOCOL.md` §1 (*"Commit only what you
authored and reviewed"*) **I left every byte of it alone.**

It matters here for a reason beyond tidiness — see Blocker 2.

---

### 🔴 BLOCKER 2 — Untracked data is load-bearing at runtime. The deploy would ship broken features.

`data/development_world/` and `data/cookbook/` are **untracked**. They are not in any commit, so they
would **not** be in the deploy. But server code reads them **at runtime**:

```
server/development-world/world-reader.ts:141
    const DATA_DIR = path.resolve(HERE, "../../data/development_world");
```

That is not a build script or an importer — it is **`server/`**, and it resolves a directory that
would not exist in the deployed artefact. Commits `d9de7b5` (DEVWORLD2 + DEVWORLD3 — *"Development
World reader and admin surfaces"*) and `13afc76` (COOKBOOK2 + COOKBOOK3 — *"THA Original Founding
Cookbook import"*) would ship the **code** and leave the **data** behind.

The request said: *"Do not intentionally exclude completed features unless they are known to be
incomplete or unsafe."* **This is that exception, and it is now known.** Deploying these two features
in their current state ships a reader pointed at nothing. This must be resolved — by committing the
data, or by confirming production sources it elsewhere — **before** either feature is released.

---

### 🔴 BLOCKER 3 — The pre-deployment verification gate does not exist yet

`TRUST1-V3` shipped **yesterday** (`4fd5a29`) and says so itself, in its own Definition of Done:

> *"**The gate is not enforced yet, and this task did not enforce it.**"*
> *"CI **reports** and does not block. A red check does not stop a merge. `main` still accepts a direct push."*
> *"**CI has still never run on GitHub.**"*

So the state at this moment is:

- Branch protection on `main`: **not applied**
- The required check `typecheck · test · build`: **has never run on GitHub, once**
- `npm run verify:branch-protection`: **exits non-zero today**

The gate protocol's *"Turning it on"* (§4) is explicit that the check **must go green once before
protection is switched on**, and that a gate which has never refused anything *"is a hope, not a
control."*

**Deploying 91 unverified commits through a gate that has never once run would be the exact failure
TRUST1 was created to prevent** — and it would do so on the day after the gate was written.

---

### 🔴🔴 BLOCKER 4 — `db:push` on merge, against a +910-line schema change. **This is the one that destroys data.**

This is the most serious finding and the reason I stopped rather than asked.

```bash
# scripts/post-merge.sh — wired to .replit's [postMerge] hook
#!/bin/bash
set -e
npm install
npm run db:push          # ← drizzle-kit push. No migration. No review. No gate.
```

`shared/schema.ts` changes by **+910 / −5** across this range. `db:push` diffs a schema against a
live database and applies whatever it thinks the difference is — including **destructive column and
table drops** — with no migration file, no review, and no passage through CI.

The gate protocol names this itself, in §6 *"What this gate does not close"*:

> *"`scripts/post-merge.sh` runs `npm run db:push` automatically after every merge … and
> `scripts/migrate-prod.sh` runs `drizzle-kit push --force` straight at the production database.
> Neither passes through CI, a pull request, or this gate. A schema can therefore still reach
> production without any verification at all. That is **`TRUST1-O8` / risk `R6`**, it is open, and it
> is **the largest data-loss risk in the platform**. **A green check on `main` says nothing about your
> schema.**"*

`TRUST1-O8` is **open**. `R6` is **live**. And `.replit` — the file that wires the `postMerge` hook —
**is one of the modified files in the dirty working tree.**

Only **2 migration files** changed in this range against a **910-line** schema delta. The gap between
those two numbers is what `db:push` would improvise against production, unsupervised.

**I will not push a 910-line schema change into a merge path that auto-runs `db:push`, and I would
advise no one else to either until `TRUST1-O8` is closed.**

---

### 🟠 BLOCKER 5 — Production environment and database cannot be verified from here

The request asked me to verify production env vars, `SESSION_SECRET`, and production DB connectivity.
**I cannot, and I did not fabricate a pass.**

```
DATABASE_URL → host: helium   db: /heliumdb     ← the LOCAL Replit dev database
NODE_ENV     → UNSET
```

`SESSION_SECRET`, `DATABASE_URL` and `OPENAI_API_KEY` are all set **in this dev workspace**. That
tells us nothing about Render. Production values live in Render's environment, and reading or
modifying them is production configuration — `COMMIT_PUSH_DEPLOY_PROTOCOL.md` §3, again.

This matters more than usual because of `TRUST1-S1`: **the session secret now fails closed.** If
`SESSION_SECRET` is absent or weak in Render, the deployed app **refuses to start**. Nobody has
confirmed it is there. That check must be done by a human, in the Render dashboard, *before* the
merge — it is the difference between a soft launch and an outage.

There is also no `render.yaml` in the repository, so Render's configuration is not in version control
and cannot be reviewed here at all.

---

## ROLLBACK PLAN

| Item | Value |
|---|---|
| **Rollback identifier (created)** | `rollback/TRUST1-soft-launch-production-deployment-20260711` → `4fd5a29` |
| **What it protects** | The *candidate* HEAD that was **not** deployed |
| **⚠️ The SHA that actually matters** | **`3ef7e8e`** — current `origin/main`. **This is production.** Since nothing was deployed, **production is already at its rollback point.** |
| **Rollback required?** | **NO.** Nothing shipped. There is nothing to unwind |
| **Data to unwind** | **None.** No production or development database was written by this task |
| Working tree at tag time | **Dirty** — the pre-existing `PDA1`/`PKR` entries. Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3 **the tag protects none of it**, and this task did not touch, stage, or commit one byte of it |

**The tag is honest about its limits.** It marks a commit that never reached production. Its value is
forward-looking: if the release is later approved, `4fd5a29` is the identified candidate, and
`3ef7e8e` is what you return to.

**If a deploy is later performed and goes wrong,** the route back is `PRE_DEPLOYMENT_VERIFICATION_GATE.md`
§5, unchanged: **roll back in Render first** (it re-ships a commit that already passed, and needs no
bypass), then revert through a pull request. `main` is never force-pushed. **But note the asymmetry
that Blocker 4 creates: a Render rollback restores the *code*. It does not restore a table that
`db:push` dropped.** Code rolls back. Data does not.

---

## MANUAL VERIFICATION CHECKLIST

**Every item is unchecked. There is no deployment against which to check any of them.**

| # | Item | Status |
|---|---|---|
| 1 | Login | ⬜ NOT VERIFIED — no deployment |
| 2 | Logout | ⬜ NOT VERIFIED — no deployment |
| 3 | Register | ⬜ NOT VERIFIED — no deployment |
| 4 | Planner | ⬜ NOT VERIFIED — no deployment |
| 5 | Cookbook | ⬜ NOT VERIFIED — no deployment **+ Blocker 2: data not in the deploy** |
| 6 | Shopping | ⬜ NOT VERIFIED — no deployment |
| 7 | Companion | ⬜ NOT VERIFIED — no deployment |
| 8 | Dashboard | ⬜ NOT VERIFIED — no deployment |
| 9 | Admin | ⬜ NOT VERIFIED — no deployment **+ Blocker 2: Development World reader** |
| 10 | Production logs | ⬜ NOT VERIFIED — no deployment |
| 11 | Render health | ⬜ NOT VERIFIED — no deployment |
| 12 | Database connectivity | ⬜ NOT VERIFIED — **Blocker 5**, dev DB only from here |

Additionally unverified from the request's post-deployment list: home page load, benchmark pages,
production migrations, critical runtime errors, authentication regressions, and whether TRUST1
security improvements are active in production. **They are all still inactive in production**, which
is the actual point: the TRUST1 defects remain live for households today.

---

## USER ACCEPTANCE EVIDENCE

- **Nothing was deployed, and that is the deliverable.** Four independent blockers were found in
  pre-flight. The one that matters most — `db:push` improvising a 910-line schema change against the
  production database with no migration and no gate — is documented **in this repository, by this
  programme, as "the largest data-loss risk in the platform"**, and it is open. The release was
  stopped *before* the push, not diagnosed after it.
- **The request's own first precondition failed, and it was not waived.** *"Confirm git status is
  clean."* It was not clean. That check was in the instructions for a reason, and the reason turned
  out to be real: two untracked data directories are read by `server/` at runtime.
- **The framing was corrected rather than accepted.** This was presented as a soft launch of TRUST1
  security work. It is 91 commits and 1.85M lines, of which TRUST1 is a small minority. Whoever
  authorises this release is entitled to know that before they authorise it, not after.
- **Nothing was fabricated green.** Every post-deployment verification is marked NOT VERIFIED. Every
  production environment check is marked UNVERIFIABLE. No item in this report claims an observation
  that was not made. The temptation in a deployment report is to reason a check into passing;
  `TRUST1-V3` named that failure mode by name (`EWO-PRO1` — *"the report was the verification"*), one
  commit ago.
- **The protocol was followed, including the part that made this task impossible.**
  `COMMIT_PUSH_DEPLOY_PROTOCOL.md` §3's stated remedy is *"If you believe a deploy is warranted, say
  so and stop."* A deploy **is** warranted — six TRUST1 milestones are sitting undeployed, closing
  defects that are live in production right now. So: **I believe a deploy is warranted. I have said
  so. I have stopped.**

---

## RECOMMENDED NEXT WORKSTREAM

**`TRUST1-O8` — close the `db:push` production path. Nothing else should be deployed until it is done.**

It is the only blocker here that can cause **irreversible** harm, and it is the one thing standing
between this release and a destructive schema operation against the production database. Everything
else on this list is recoverable; a dropped table is not.

Then, in order:

| # | Action | Owner | Why it is in this position |
|---|---|---|---|
| 1 | **`TRUST1-O8`** — remove/guard `db:push` from `post-merge.sh` and `migrate-prod.sh`; replace with reviewed, ordered migrations | Engineering | **The irreversible one.** `R6`, open, and a 910-line schema delta is queued behind it |
| 2 | **Resolve the dirty tree** — commit or explicitly exclude `data/cookbook/` + `data/development_world/`; decide on `.replit` | Named human | Blocker 2. Until then, Cookbook and Development World are **known-incomplete** and are the request's own stated exception |
| 3 | **Let CI run on GitHub, once** — push the branch, open a PR, get `typecheck · test · build` green | Engineering | Blocker 3. The gate has **never run**. This is step 1 of the gate protocol's *"Turning it on"* |
| 4 | **Apply branch protection** (~2 min) | **Colin Clapson** (named in the gate protocol §7) | `TRUST1-V3`'s single outstanding action. Until then the six security suites cannot stop one merge |
| 5 | **Verify Render env** — confirm `SESSION_SECRET` is present and strong | **Colin Clapson** | Blocker 5. **`TRUST1-S1` fails closed: if it is missing, the deploy does not start** |
| 6 | **Record the deploy-cadence decision** | **Colin Clapson** | Owed since *before M1*. `TRUST1-V3` calls it *"the oldest open item in Phase 0."* **Seven milestones now sit undeployed** |
| 7 | **Split the release** | Engineering | 91 commits in one push is not a soft launch. Deploy TRUST1 (9 commits, security-only, small schema surface) **first and alone** — as the Phase 0 plan originally recommended |

> **Recommendation 7 is the one that gets this unstuck.** The request's instinct — get TRUST1 into
> production — is right, and it is overdue. The problem is that TRUST1 is currently *welded to* 82
> other commits that have never run in production, including a 910-line schema change and two
> features whose data is not in git. **Separating them turns an unshippable release into a shippable
> one**, and it is the smallest change to the plan that makes the original goal achievable.

---

## SCOPE LOCK

**Implemented scope — verification and halt only**
- Five pre-flight checks executed. Four failed. All results recorded above, observed rather than inferred.
- One local annotated tag created: `rollback/TRUST1-soft-launch-production-deployment-20260711` → `4fd5a29`.
- This document.

**Explicitly NOT done — and each is a §3 prohibition**
- ⛔ **No `git push`.** Nothing was pushed to GitHub, to `origin/main`, or to any remote.
- ⛔ **No deploy triggered.** Render was not contacted. `deploy.sh` was **not executed** (it was read, and it still runs `git add -A` and auto-commits the working tree — `TRUST1-O7`, open).
- ⛔ **No migration run against any database.** No `db:push`, no `drizzle-kit`, no `migrate-prod.sh`.
- ⛔ **No production configuration or secret read, written, or modified.** No branch protection applied.
- ⛔ **No implementation work.** The request forbade it; no application code, schema, test, or config was touched. The dirty working tree is byte-for-byte as I found it.

---

*TRUST1 Soft-Launch Deployment. The gate was written yesterday. Today was the first day it could have been used — and the first thing it did was refuse this release. That is the gate working, not the gate failing.*
