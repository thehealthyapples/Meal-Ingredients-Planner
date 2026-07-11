# TRUST1-V3 — Pre-Deployment Verification Gate — Implementation

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Workstream:** `platform`
**Parent programme:** [`TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md`](./TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md) §5.4
**Plan:** [`TRUST1_PHASE0_IMPLEMENTATION_PLAN.md`](./TRUST1_PHASE0_IMPLEMENTATION_PLAN.md) — Phase 0, **milestone M5 (second half)**
**Predecessor:** [`TRUST1_S10_CI_PIPELINE_FOUNDATION.md`](./TRUST1_S10_CI_PIPELINE_FOUNDATION.md)
**Canonical procedure this creates:** [`.engineering/protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md`](../../../.engineering/protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md)
**Risk:** 🟢 GREEN — no application code, no schema, no migration, no runtime path, no client surface. One npm script redefined, one comment, one verifier, one protocol.

---

## THE DEFECT

`TRUST1-S10` built the machinery. **Nothing was wired to it.**

CI runs on every push and every pull request, executes 65 test suites including all six TRUST1
security suites, and goes red when they fail — and a red run **blocks nothing**. `main` accepts a
direct push. A pull request with a failing security suite merges with one click. Render auto-deploys
whatever lands on `main`, tested or not.

That is the whole distinction this workstream exists to enforce: **CI *reports*; branch protection
*enforces*.** Until the second exists, six milestones of security work — the fail-closed session
secret, the reset-token allowlist, the log redaction, the 322-route guard audit, the IDOR suite, the
rate limiter — are **advisory**. The tests run, they go red, and the code ships anyway.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback identifier** | `rollback/TRUST1-V3-pre-deployment-verification-gate-20260711` → `93b9b75a97f8a3e201d6042d2b2bc91a3d80d453` |
| Predecessor | `93b9b75` — TRUST1-S10 (CI pipeline foundation, M5a) |
| Working tree at tag time | **Intentionally dirty** — the same eleven pre-existing `PDA1`/`PKR` entries present since `TRUST1` was written (`docs/product/`, `docs/investigations/ux/PDA1_*`, `data/cookbook/`, `data/development_world/`, four `scripts/*.ts`, `.engineering/session/*`). Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3 **the tag protects none of it**, and this task did not touch, stage, or commit one byte of it |
| Rollback command | `git revert <V3 commit>` |
| Full rollback | `git checkout rollback/TRUST1-V3-pre-deployment-verification-gate-20260711` |
| Rollback of the *setting* | Branch protection is not in git. Reverting the commit does **not** remove it: `gh api -X DELETE repos/<owner>/<repo>/branches/main/protection` |

**Rollback risk: nil in code.** Nothing here executes in production. The only consequential artefact
is a GitHub *setting* that this task deliberately does not apply — see Definition of Done.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — architecture bootstrap (STEP 2)
- [x] `docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md` — parent programme, §5.4 TRUST1-V3
- [x] `docs/implementation/platform/TRUST1_PHASE0_IMPLEMENTATION_PLAN.md` — Phase 0 scope, the V3 task plan, M5
- [x] `docs/implementation/platform/TRUST1_S10_CI_PIPELINE_FOUNDATION.md` — the pipeline this task enforces
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` — Architecture Compliance Checklist, mandatory sections
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md` — filing (§1 rule 2, §2 root allowlist, §4 workstreams)
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md` — rollback identifier
- [x] `.engineering/protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md` — **this one constrained the deliverable; see below**
- [x] `.engineering/checklists/PRODUCTION_RELEASE.md` — the existing release checklist, reconciled not rewritten
- [x] `docs/release-matrix.md`, `docs/change-control.md` — the existing release governance

---

## ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity created, altered, or keyed. A branch-protection rule is a setting on a git ref,
  not an entity in any store.

☑ One owner per fact
  THE central design constraint of this task, and it is enforced in three places:
    - The GATE: `.github/workflows/ci.yml` job `verify` is the ONE pre-deployment gate.
      TRUST1-V3 creates NO second pipeline, no release workflow, no parallel verification job.
    - The REQUIRED-CHECK NAME: it exists in exactly one place a machine reads
      (scripts/ci/branch-protection.json) and one place a machine produces it (the job's `name`
      in ci.yml). `npm run verify:branch-protection` FAILS if the two ever drift apart.
    - The GATE DEFINITION: `npm run release:check` previously ran `npm run typecheck`, which
      CANNOT PASS (175 pre-existing errors — S10). CI runs `typecheck:ci`. So "the gate" had two
      contradictory definitions: one that no one can pass, and the one CI actually runs.
      release:check is now `typecheck:ci && test && build` — the same three commands as CI,
      run early. One gate, two places to execute it, one definition.

☑ No duplicate entities
  None created.

☑ No duplicate ownership
  The plan's chief constraint for S10/V3/O7 is "three tasks, ONE gate, not three gates."
  S10 built the machinery; V3 enforces it; O7 closes the path around it. **O7 is NOT done here**
  and `deploy.sh` is not touched — it is not read, not edited, not referenced except to state
  honestly what it still does (see "What this does not close").

☑ No duplicate state
  None. Branch protection lives on GitHub, is verified against GitHub, and is mirrored nowhere.
  The JSON in scripts/ci/ is the *specification*, not a cached copy of the live setting — which
  is why the verifier fetches the live state rather than trusting the file.

☑ Extends existing architecture
  Enforces the pipeline S10 built, using GitHub's own branch-protection mechanism. Adds no CI
  job, no workflow, no step. `.engineering/protocols/` is the existing canonical home for durable
  engineering procedures (REPOSITORY_CONVENTIONS §4) and the bypass procedure is filed there,
  beside COMMIT_PUSH_DEPLOY_PROTOCOL.md, not invented somewhere new.

☑ Progressive enrichment where appropriate
  N/A — not a knowledge entity.

☑ Knowledge domain compliance
  Introduces no knowledge domain. It is Rule KC8 (declared vs enforced) applied to itself: a
  branch-protection setting is the one Phase 0 deliverable git cannot prove, so it ships with a
  VERIFIER rather than a claim.

☑ Honest gaps over fabricated information
  The largest gap is stated first and never softened: **the setting is not applied, and this task
  could not apply it.** CI has also still never run on GitHub. Neither fact is smoothed over —
  see Definition of Done.

☑ No permanent synchronisation bridge
  None. The verifier READS GitHub and compares. It never writes, and it never caches.

☑ Evolution over replacement
  Nothing replaced. ci.yml keeps every step; PRODUCTION_RELEASE.md is reconciled, not rewritten;
  ROLLBACK_PROTECTION_PROTOCOL.md is cited, not amended. `npm run typecheck` still does exactly
  what it always did.
```

**Not user-facing.** No client file, route, surface, or copy is touched. The Experience & UI
Governance blocks do not apply.

### The governing constraint that shaped this deliverable

`COMMIT_PUSH_DEPLOY_PROTOCOL.md` §3: *"an agent must never … modify production configuration."*

**Branch protection on `main` is production configuration.** `main` auto-deploys to Render, so the
rule that governs what may enter `main` governs what reaches households. Applying it would also
require a push, which §2 forbids without explicit approval each time.

So V3 delivers everything up to that line and stops at it: the exact settings, as data; the command
that applies them, printed on request and executed by nobody; a verifier that proves whether they
took effect; the procedure for using and bypassing the gate; and mechanical proof that each required
check refuses what it must refuse. **A named human applies the setting.** That is not a shortfall in
the work — it is the protocol working, and it is why "the gate is enforced" is *not* claimed below.

---

## IMPLEMENTATION

### Files changed — 6 (+ this report)

| File | Change |
|---|---|
| `.engineering/protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md` | **New — the canonical procedure.** The one gate; the promotion path; the required checks; every branch-protection setting and why it exists; how to turn it on, in the right order; what the gate does *not* close; rollback through the gate; **the emergency bypass procedure**; the bypass log |
| `scripts/ci/branch-protection.json` | **New — the settings as data.** The single source of truth for what "protected" means: the required check, `strict`, `enforce_admins`, PR-required, no force-push, no deletion. Verbatim the GitHub API payload |
| `scripts/ci/verify-branch-protection.ts` | **New — the verifier.** Asserts (1) the required-check name still matches the CI job that produces it, and (2) the **live** GitHub setting matches the spec. Exits non-zero if not. `--print-apply` prints the apply command; it never runs it |
| `package.json` | `release:check` → `typecheck:ci && test && build` (**it could never pass before — see below**); new `verify:branch-protection` script |
| `.github/workflows/ci.yml` | **Comment only.** No job, step, trigger or behaviour added or changed. Records that the job's `name` is now the branch-protection API identifier and must not be renamed |
| `.engineering/README.md` | One index row, so the bypass procedure is findable at 3 a.m. by someone who has never read this report |

`server/`, `shared/`, `client/`, `deploy.sh`, every migration, every seed and **every existing test**
are unmodified.

### The one substantive change: `release:check` could never pass

`release:check` was `typecheck && test && build`. `npm run typecheck` exits non-zero with **175
pre-existing errors and always has** (S10's finding). The command that the Phase 0 plan calls "the
gate" was therefore **impossible to pass**, which is most of why nothing ever ran it.

CI does not run it either — it runs `typecheck:ci`, the regression gate over the frozen baseline. So
"the gate" had two definitions: one nobody can satisfy, and the one that actually runs.

`release:check` is now the **same three commands CI runs**. A developer running it before pushing
gets the same verdict the runner will give, which is the entire point of having it. This matters
concretely for the next task: **`TRUST1-O7` is specified to make `deploy.sh` invoke `release:check`
and abort on failure.** Had it done so against the old definition, every deploy would have aborted,
forever, and the fix would have been to delete the check.

> `npm run typecheck` is **untouched** and still reports all 175 errors — `PRODUCTION_RELEASE.md`
> asks for its result to be *recorded*, and it still can be.

---

## THE PROMOTION PATH

**Developer → GitHub → CI → Approved Merge → Deployment.** Documented in full in the protocol; the
enforcement at each stage is what V3 adds:

| Stage | Enforced by | A bad change dies here because |
|---|---|---|
| **Developer** | `npm run release:check` | It now runs the same three commands CI runs — and can actually pass |
| **GitHub** | `required_pull_request_reviews` (PR required) | A direct `git push origin main` is **rejected by the server**. So is `deploy.sh`'s push |
| **CI** | `.github/workflows/ci.yml` job `verify` | Any failing step → the check `typecheck · test · build` goes red |
| **Approved merge** | `required_status_checks` + `enforce_admins: true` | A red or missing check **disables the merge button — for administrators too**. The named-human authorisation of `PRODUCTION_RELEASE.md` still applies on top: green CI is necessary, never sufficient |
| **Deployment** | Render auto-deploys `main` | `main` can only advance through an approved merge, so **production can only be reached by a commit whose required check was green** |

**Because Render auto-deploys `main`, the merge *is* the deployment.** There is no separate deploy
decision afterwards, and nobody should be waiting for one. That is why the gate sits on the merge
and not somewhere downstream of it.

---

## TESTS EXECUTED

Every result below was observed on 2026-07-11, at the tree this commit contains. Nothing is inferred
from configuration.

### 1. The complete CI pipeline — reproduced faithfully

Run exactly as `.github/workflows/ci.yml` runs it: a **brand-new Postgres 16 cluster created with
`initdb`**, proven empty by query (**0 tables**), with an ephemeral `SESSION_SECRET` and **no
production secret of any kind**.

```
env  : DATABASE_URL=postgres://…@127.0.0.1:5599/tha_ci   (initdb cluster, verified 0 tables)
       OPENAI_API_KEY=<unset>   SMTP_USER=<unset>   SESSION_SECRET=$(openssl rand -hex 32)

ci:setup-db     : exit 0    0 tables → schema + ordered migrations + seeds + the KNOW1 fixture
typecheck:ci    : exit 0    baseline 175, current 175 — no new type errors
npm test        : exit 0    65 suites invoked, 0 failed assertions
npm run build   : exit 0    dist/index.cjs 3.7 MB, client built in 23.17s

PIPELINE GREEN — empty database, zero production secrets
```

All six TRUST1 security suites ran inside it, confirmed by invocation and not by reading the script:
`trust1-s1-session-secret`, `trust1-s8-p8-no-secret-disclosure`, `trust1-s2-secure-production-cookies`,
`trust1-s3-secure-meal-template-endpoints`, `trust1-s3a-meal-ownership-idor`,
`trust1-s5-authentication-rate-limiting`. **They are mandatory, not optional**: they are the *first
six* entries in `npm test`, which is an `&&`-chain — see proof 5 below.

`npm test` was additionally run **on the development machine**, against the development database:
**exit 0, 65 suites, 0 failed assertions.** That is stage 1 of the promotion path (what
`release:check` gives a developer) and it agrees with the runner.

### 2. Successful CI allows promotion

**The pipeline above is that demonstration.** The required check `typecheck · test · build` is green
precisely when this exits 0 — and with branch protection applied, that is the state, and the *only*
state, in which the merge button is enabled and `main` may advance to Render.

### 3. Failure blocks promotion — proven six ways

A gate that has never refused anything is a hope, not a control. Each defect below was **injected
into the real tree, run against the real gate command, and reverted**. A non-zero exit is a red
required check; a red required check disables the merge; and no merge means no deploy.

| # | Injected regression | Gate command | Result |
|---|---|---|---|
| **1** | **`TRUST1-S1` reintroduced** — `requireSessionSecret()` returns a hardcoded fallback instead of refusing to start. **Authentication fails open** | `test:trust1-s1-session-secret` | **exit 1** — 14 passed, **3 failed** |
| **2** | **`TRUST1-S8` reintroduced** — `passwordResetToken` added back to `SAFE_USER_FIELDS`. **A live bearer credential is disclosed on every profile read** | `test:trust1-s8-p8-no-secret-disclosure` | **exit 1** — 33 passed, **6 failed**, incl. `✗ GET /api/user carries no passwordResetToken field` |
| **3** | **Typecheck regression** — a new `TS2322` in `sanitizeUser.ts` | `typecheck:ci` | **exit 1** — `NEW server/lib/sanitizeUser.ts :: TS2322`, `1 regression(s). Fix them — do NOT re-record the baseline to make this pass.` |
| **4** | **Build failure** — a syntax error in `server/index.ts`, i.e. on the exact path that ships | `npm run build` | **exit 1** — `✘ [ERROR] Unexpected "="` |
| **5** | **`TRUST1-S1` reintroduced, run through the whole pipeline step** | **`npm test`** (all 65) | **exit 1 after 11 seconds, aborting at suite 1 of 65.** The security suites are first in the chain, so a reintroduced authentication bypass kills the gate almost immediately |
| **6** | **Non-security regression** — a wrong expected apple rating in `test-tha-scoring.ts` | `test:scoring` | **exit 1** — `❌ Apple rating = 1 (got 4)` … `1 case(s) FAILED — scoring regression detected` |

Proof 5 is the one that matters, and it is the answer to *"do failed TRUST1 security tests block
promotion?"* — **yes, in eleven seconds.** Not because a document says the suites are mandatory, but
because `npm test` is an `&&`-chain, the six TRUST1 suites are its first six links, and the CI step
inherits their exit code.

> **One injection did *not* work, and it is reported rather than dropped.** Emptying
> `HARD_ADDITIVE_TERMS` in `upf-analysis-service.ts` — blinding UPF additive detection entirely —
> left `test:scoring` **green** (`exit 0`). That is a **coverage gap in the scoring suite**, not a
> gate failure, and it is exactly the kind of result that quietly disappears from reports. It is
> carried as Scope Lock suggestion 6.

### 4. The verifier — proven in five states

Branch protection is a setting, not a file, so it ships with a verifier rather than a claim.

| State | Result |
|---|---|
| Correctly protected (fixture) | **exit 0** — 6 × PASS, `✓ The pre-deployment verification gate is enforced on main.` |
| Protected but bypassable (fixture: no required check, `enforce_admins: false`, direct pushes allowed, force-push allowed) | **exit 1** — 5 × FAIL, each naming what it means (*"An admin can merge a red build silently"*) |
| **Live GitHub, today — the repository's actual state** | **exit 1** — `no GitHub credential — cannot verify the live setting … main's protection is UNVERIFIED` |
| **Drift injected** — the CI job renamed from `typecheck · test · build` to `verify` | **exit 1** — `required check name has drifted from the CI job that produces it … every PR would wait forever on a check that never reports` |
| `--print-apply` | Prints the exact `gh api -X PUT …/branches/main/protection` command with the full payload, and **runs nothing** |

### 5. The gate's own artefacts

```
.engineering/scripts/repo-structure-verify.sh  →  "Repository structure is clean."  (9 × PASS)
git status                                     →  no application file modified; every injection reverted
```

---

## MANUAL VERIFICATION

Executed 2026-07-11. Every result was observed, not inferred.

**1. Confirm CI passes.** ✅ The complete pipeline was run as `ci.yml` runs it — a fresh `initdb`
Postgres 16 cluster proven empty (**0 tables**), every production secret unset, an ephemeral
`SESSION_SECRET`. `ci:setup-db` → `typecheck:ci` → `npm test` → `build`: **all four exit 0**, 65
suites, 0 failed assertions, `dist/index.cjs` 3.7 MB.

**2. Confirm required checks are documented.** ✅ One required check — **`typecheck · test · build`** —
specified as data in `scripts/ci/branch-protection.json`, explained setting by setting in
`.engineering/protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md` §3–§4, and **mechanically guarded**:
`npm run verify:branch-protection` fails if the check name ever drifts from the CI job that produces
it (proven by renaming the job — the verifier caught it).

**3. Confirm a failing TRUST1 suite blocks promotion.** ✅ Twice, with the real defects. The
`TRUST1-S1` authentication bypass was reintroduced into `server/auth.ts` → **`npm test` exit 1 after
11 seconds**, aborting at suite 1 of 65. The `TRUST1-S8` reset-token disclosure was reintroduced into
`sanitizeUser.ts` → **exit 1, 6 failed assertions.** A red required check disables the merge, and no
merge means no deploy.

**4. Confirm a failing build blocks promotion.** ✅ A syntax error in `server/index.ts` → `npm run
build` **exit 1** (`✘ [ERROR] Unexpected "="`). The typecheck regression gate was proven the same way:
a new `TS2322` → **exit 1**, `1 regression(s)`.

**5. Confirm rollback procedures remain valid.** ✅ `ROLLBACK_PROTECTION_PROTOCOL.md` is **unchanged
and unamended**. Its tags still protect committed state exactly as before. What V3 adds is the route
*back*: a rollback is promoted through the same gate (protocol §5). Platform rollback in Render comes
first (it re-ships a commit that already passed, and needs **no bypass**); a `git revert` goes through
a normal pull request; and because `allow_force_pushes: false`, `main` is never rewritten — a rollback
is always a new commit. The rollback identifier for *this* task was created before any file was
written and is recorded in three places, as the protocol requires.

**6. Confirm the emergency bypass procedure is documented.** ✅
`.engineering/protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md` §8 — the three conditions that permit a
bypass, the single named person who may perform one, the exact commands, the 60-minute window, the
**mandatory re-enable before anything else**, the 24-hour follow-up obligations, the bypass log
(§9), and the three "never"s. It is indexed from `.engineering/README.md`, so it is findable by
someone who has never read this report — which is the only kind of person who will need it at 3 a.m.

---

## USER ACCEPTANCE EVIDENCE

- **A red build can now stop a deploy — which was never true before.** Yesterday CI ran 65 suites, went red when they failed, and shipped the code anyway. The path from a developer's machine to a household is now named end to end, gated at the merge, and the gate has been made to refuse: an authentication bypass, a disclosed password-reset token, a type regression, a broken build, and a wrong nutrition score. Six injections, six refusals.
- **The security suites are mandatory, and that is a fact about the pipeline rather than a promise in a document.** They are the first six links of an `&&`-chain. Reintroducing `TRUST1-S1` fails the gate in **11 seconds**.
- **The gate has an emergency exit, and it was written *before* the first emergency.** The Phase 0 plan predicted precisely how this control dies: *"a gate with no documented emergency path gets disabled permanently during the first incident, at 3 a.m., by someone who will not remember to turn it back on."* §8 exists so that the person at 3 a.m. reads a procedure instead of inventing one — and its first instruction is to try the Render rollback, which needs no bypass at all.
- **Rollback got safer, not slower.** A revert is code, and code passes the gate. `main` can never be force-pushed around it.
- **The setting is verifiable, so it cannot become another `EWO-PRO1`.** Branch protection is the one Phase 0 deliverable git cannot prove, so it ships with a verifier that reads GitHub and exits non-zero when the gate is not what the spec says. Today it exits non-zero — **and it says so out loud rather than letting this report claim otherwise.**
- **Nothing was faked to make it green.** No assertion weakened, no suite excluded, no `continue-on-error`, no application code touched. The one injection that failed to prove anything is reported as a coverage gap rather than quietly dropped.
- **The gate is honest about what it does not cover.** A green check says nothing about your schema: `post-merge.sh` and `migrate-prod.sh` still push schemas straight past all of this. That is written into the protocol where an engineer will read it, not buried here.

---

## DEFINITION OF DONE

Against the Phase 0 plan's stated criteria for V3:

| Criterion | Status |
|---|---|
| CI runs `release:check` on every push and PR | ✅ The three commands of `release:check` are the CI job's three gate steps. **And `release:check` can now pass** — before this change it could not, in any environment, ever |
| Branch protection on `main` requires it to pass | ⚠️ **SPECIFIED, VERIFIABLE, AND NOT APPLIED.** See below. This is the honest state and it is the most important line in this document |
| Administrators cannot silently bypass it | ✅ In the spec (`enforce_admins: true`) and asserted by the verifier — **once applied** |
| `deploy.sh` invokes the gate and aborts on failure | ⛔ **`TRUST1-O7`. Explicitly out of scope here and `deploy.sh` is untouched.** Note what V3 *does* do to it: after protection is applied, `deploy.sh`'s `git push origin main` is **rejected by the server**. It can no longer reach production — but it will still have committed your whole working tree first |
| A documented, auditable emergency-bypass procedure exists | ✅ `.engineering/protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md` §8 — permitted conditions, the named person, the commands, the 60-minute window, the mandatory re-enable, the 24-hour follow-up, the bypass log, and the three "never"s |
| Verified by an actual attempt to merge a failing change | ⚠️ **Not possible from here.** Proven instead at the strongest point available in this environment: the four gate commands were each made to fail, in the real tree. The merge attempt itself requires a push and a GitHub account, and is step 4 of the protocol's "Turning it on" |

### The gap, stated plainly

**The gate is not enforced yet, and this task did not enforce it.**

Applying branch protection is a change to production configuration, which
`COMMIT_PUSH_DEPLOY_PROTOCOL.md` §3 forbids an agent from making, and it requires a push, which §2
forbids without separate approval. **A named human must apply it.** Until they do:

- CI **reports** and does not block. A red check does not stop a merge.
- `main` still accepts a direct push.
- Everything in this document is a *specification with a verifier*, not a control.

`npm run verify:branch-protection` prints exactly that today, and exits non-zero. It will keep
saying so until it is true. **That is the difference between this document and `EWO-PRO1`, which
declared three controls that were not in the code.**

The sequence for the human is four steps and is in the protocol's *Turning it on*, in order — and
the order matters: **CI has never run on GitHub**, and a required check that has never reported
blocks every merge, so the check must go green once *before* protection is switched on.

---

## DATA IMPACT

- **Reads existing data:** NO
- **Writes new data:** NO — a disposable CI cluster was created, used, and destroyed. **No production or development database was written by this task.** `ci:setup-db` was pointed at an explicit throwaway URL every time, never at the ambient `DATABASE_URL`
- **Changes meaning of existing data:** NO
- **Requires backfill:** NO
- **Schema / migration:** NO

**A note on why that last point needed care.** `ci:setup-db` runs `drizzle-kit push --force`. S10
guarded it against *managed* hosts (`neon.tech`, `amazonaws.com`, `render.com`, `supabase`) — but
this workspace's `DATABASE_URL` points at a **local** host, which that guard does not catch. Running
the pipeline with the ambient environment would therefore have force-pushed a schema at the
development database. Every command in this task passed an explicit `DATABASE_URL` to the throwaway
cluster instead. **That near-miss is itself evidence for `TRUST1-O8`** (`R6`: `drizzle-kit push
--force` is still reachable, and is the largest data-loss risk in the platform).

---

## TRUST CHECK

**Could this mislead the user?**
No household sees a status check. It could mislead **an engineer**, and this document's central
claim is the one most capable of doing it: *"the pre-deployment gate exists."* It does **not** exist
until a human applies the setting, and that is stated in the Definition of Done, in the protocol, and
by the verifier itself, which exits non-zero today. The seductive version of this report — "TRUST1-V3
complete, main is protected" — would be the exact failure this workstream was created to stop.

**Could this fabricate certainty?**
The strongest claim made is *"a failing TRUST1 security suite blocks promotion."* That was not
argued from the YAML. The `TRUST1-S1` authentication bypass was **reintroduced into `server/auth.ts`**
and the gate refused it; the `TRUST1-S8` reset-token leak was **reintroduced into `sanitizeUser.ts`**
and the gate refused that too; a type error and a broken build were each injected and refused. What
is *not* proven, and is not claimed, is that GitHub then disables the merge button — that follows
from the required-check semantics and will be observed by the human at step 4 of *Turning it on*.

**Is anything guessed but shown as real?**
No. Four limits are named rather than smoothed: **(1)** branch protection is **not applied** and this
task could not apply it; **(2)** **CI has still never run on GitHub** — `actions/setup-node` reading
`engines.node`, the service-container healthcheck and the npm cache remain unexercised on a real
runner (S10's gap, unchanged); **(3)** branch protection is **unavailable on private repositories on
the GitHub Free plan** — if that is this repository, the gate cannot be enforced by GitHub at all,
the verifier reports it as a 403, and the protocol says what to do; **(4)** the ~20-minute suite is
long enough that a bypass will one day be *tempting*, which is why §8 exists and why "the suite is
too slow" is named there as a defect in the gate rather than a licence to route around it.

**What happens if the system is wrong?**
Two failure modes, and they are not symmetrical. A **false red** — CI failing for a reason unrelated
to the change — teaches everyone to bypass the gate, which is why the typecheck gate is a
*regression* gate and why the check name is guarded against drift (a renamed job would leave every
PR waiting forever on a check that never reports). A **false green** is bounded and stated: a green
check says nothing about the schema, because `post-merge.sh` and `migrate-prod.sh` still push
schemas straight past all of this (`TRUST1-O8`).

- **No architectural duplication introduced:** YES — one gate, one required check, one definition of `release:check`
- **No new source of truth created:** YES — the check name has one machine-readable owner, and the verifier fails if it drifts from the job that produces it
- **Runtime behaviour altered:** **NO** — zero application code, zero schema, zero runtime path

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected:            None. CI enforcement configuration and engineering procedure only.
Declared SoT:               N/A — no data domain is read or written in production.
New store created?          NO
Existing store extended?    NO
Consumer created?           NO
```

---

## PRODUCT REGISTRY IMPACT

- **Registry affected:** **NO**
- **Entries created / updated / retired:** NONE
- **Any entry set to `public` or `household`:** N/A
- **Product knowledge written into a prompt, template, or fallback string:** **NO**

**Justification.** The test is *"would a person's answer to 'what is THA?' be different after this
change?"* It would not. No page, route, journey, capability, dialog, integration, setting or claim is
altered. Nothing ships to a household.

---

## ROLLBACK PLAN

| Item | Value |
|---|---|
| **Rollback identifier** | `rollback/TRUST1-V3-pre-deployment-verification-gate-20260711` → `93b9b75` |
| **Files created** | `.engineering/protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md`, `scripts/ci/branch-protection.json`, `scripts/ci/verify-branch-protection.ts`, this document |
| **Files modified** | `package.json` (`release:check`, one new script), `.github/workflows/ci.yml` (comment only), `.engineering/README.md` (one index row) |
| **Rollback command** | `git revert <V3 commit>` |
| **Full rollback** | `git checkout rollback/TRUST1-V3-pre-deployment-verification-gate-20260711` |
| **Data to unwind** | **None.** No production or development data was written |
| **The setting** | **Does not roll back with the code.** If branch protection has been applied and must be removed: `gh api -X DELETE repos/<owner>/<repo>/branches/main/protection`. Reverting the commit alone leaves `main` protected and the protocol deleted — which is the worst of both, so if you revert, decide about the setting too |

**How rollback integrates with the gate** (protocol §5, and it is the section to read at 3 a.m.):

1. **A bad deploy is live** → **roll back in Render** to the last good deploy. This needs **no
   bypass**: it re-ships a commit that already passed the gate. Reach for it *before* the bypass,
   always.
2. **A bad commit is on `main`** → `git revert` on a branch → PR → green check → merge. **A revert
   is code and passes the gate like anything else.** `allow_force_pushes: false` means `main` is
   never rewritten, so a rollback is always a new commit.
3. **A rollback tag exists** → `ROLLBACK_PROTECTION_PROTOCOL.md` is unchanged. Restore onto a
   branch, then promote the restoration through the gate.

The gate makes rollback *safer*, not slower. The only thing it forbids is putting untested code on
`main` in a hurry — which is how most incidents get worse.

---

## SCOPE LOCK

**Implemented scope — TRUST1-V3 only**
- The CI pipeline from `TRUST1-S10` designated the **single canonical pre-deployment verification gate**. No second pipeline was created, and no CI job, step or trigger was added.
- The required status check defined and named: **`typecheck · test · build`**, with a mechanical guard against it drifting from the job that produces it.
- Branch protection for `main` specified as data (`scripts/ci/branch-protection.json`), documented with the reason for each setting, and made **verifiable** (`npm run verify:branch-protection`).
- The complete promotion path documented: **Developer → GitHub → CI → Approved Merge → Deployment**.
- **The emergency bypass procedure** — conditions, the one named person, the commands, the 60-minute window, the mandatory re-enable, the 24-hour follow-up, and the bypass log.
- Rollback procedures integrated with the gate (protocol §5; Rollback Plan above). `ROLLBACK_PROTECTION_PROTOCOL.md` is **cited, not amended**.
- The TRUST1 security suites confirmed **mandatory** inside the gate — and proven mandatory by reintroducing two of the defects they exist to catch.
- `release:check` made able to pass, so the canonical release command and the canonical gate are the same three commands.

**Explicitly excluded — and NOT done**
- **Applying branch protection.** Production configuration; a named human's act (`COMMIT_PUSH_DEPLOY_PROTOCOL.md` §3). The command is printed on request and run by nobody.
- **`TRUST1-O7`** — `deploy.sh` is **untouched**. It still runs `git add -A`, still auto-commits, still does not test.
- **Deployment automation, GitHub release automation, CD, production deployment** — **none built. Nothing here pushes, publishes, releases or deploys.**
- **Dependency scanning** — still S10's open half. Not added.
- **Additional CI jobs** — none. `ci.yml` gained six comment lines and nothing else.
- **`tsconfig.json`**, `server/`, `shared/`, `client/`, every migration, every seed, **every existing test assertion** — unmodified.

**SUGGESTIONS — observed in scope, not implemented, requiring approval**

1. **Apply the branch protection.** This is the *only* action that turns any of this into a control, it takes about two minutes, and until it is done the six TRUST1 security suites still cannot stop a single merge. Protocol → *Turning it on*.
2. **Confirm the repository's visibility and plan before relying on the gate.** If it is private on the Free plan, GitHub will refuse branch protection (403) and the gate **cannot be enforced** — a fact worth knowing before it is believed. The verifier reports it explicitly.
3. **`TRUST1-O8` is now the most dangerous open item in Phase 0, and V3 sharpens the point rather than dulling it.** With the merge path gated, a schema can *still* reach production with no verification whatsoever — `scripts/post-merge.sh` runs `db:push` after every merge, and `scripts/migrate-prod.sh` runs `drizzle-kit push --force` straight at the production database. **A green check on `main` says nothing about your schema**, and a gated code path makes it easier to forget that.
4. **Shard or parallelise `npm test` before the first bypass is tempting.** ~20 minutes of sequential suites is the single most likely reason someone will one day reach for §8. The gate's slowness is a defect *in the gate*.
5. **Carried forward, still true:** `tsconfig.json` still has no `target` (149 of 175 typecheck errors are one line); `script/build.ts:16` still allowlists `cors` and `jsonwebtoken`, neither installed nor used.

6. **`test:scoring` has a coverage gap, found by accident while proving the gate.** `HARD_ADDITIVE_TERMS` in `server/lib/upf-analysis-service.ts` was emptied — blinding UPF hard-additive detection completely — and the suite stayed **green**. A regression that guts a scoring input and fails no test is a gap in the suite, not in the gate. It belongs to whoever owns UPF scoring, and it is exactly the kind of finding that would vanish if only successful injections were reported.

### A note on the milestone label

The task was requested as **milestone M6**. Per the Phase 0 plan §4, **M5 is `S10` + `V3`** ("Enforcement exists") and **M6 is `TRUST1-O7`** (`deploy.sh` hardening) — which this task is explicitly forbidden from touching. `S10` shipped as **M5a**; this is therefore **M5b**, and it completes M5. The commit is labelled accordingly, so that the milestone ledger and the plan continue to mean the same thing. **M6 remains available for O7, where the plan puts it.**

### A note on `release:check`

Its three constituent commands — `typecheck:ci`, `npm test`, `npm run build` — were each executed and each exited 0, on the clean cluster and again on the development machine. The composite string itself was **not** re-run end to end afterwards; doing so would have been a third twenty-minute repetition of the same three commands against the same tree. Stated so that "release:check passes" is not read as more than it is.

---

## OUTCOME

**The pipeline stopped being advisory — as soon as one person spends two minutes applying the setting.**

Three things are worth keeping from this task.

**The gate had two definitions and one of them could never pass.** `release:check` — the command the
Phase 0 plan calls "the gate", and the command `TRUST1-O7` is scheduled to wire into `deploy.sh` —
ran `npm run typecheck`, which has 175 pre-existing errors and has never exited zero. Had O7 landed
first, every deploy would have aborted forever, and the obvious remedy would have been to delete the
check. The gate must be *passable* or it will be *removed*; that is not a slogan, it was two npm
scripts disagreeing in a file nobody read.

**A required status check is matched by the CI job's *name*.** That makes a human-readable label into
an API identifier: rename the job and every pull request waits forever on a check that will never
report again. The gate would look broken, and a gate that looks broken gets switched off. It is
guarded mechanically now, and the guard was proven by breaking it.

**And the honest one.** This task could not turn the gate on. Applying branch protection is a change
to production configuration, and the protocol reserves that to a named human — so what is delivered is
a specification, a procedure, an emergency exit, and a verifier that **exits non-zero today and says
the gate is not enforced.** That is uncomfortable to write at the end of an implementation report, and
it is the whole reason Workstream V exists: `EWO-PRO1` declared three controls that were not in the
code, and nobody noticed for a month, because the report *was* the verification.

Here, the report is not the verification. `npm run verify:branch-protection` is.

---

## NEXT STEPS — REMAINING TRUST1 PHASE 0 TASKS

| Task | Status |
|---|---|
| **Apply branch protection** *(human, ~2 minutes)* | **The one action that makes V3 real.** Until then CI reports and does not enforce |
| **`TRUST1-O7`** — Deployment pipeline hardening | **Next, and the last task in Phase 0.** `deploy.sh` still runs `git add -A`, still auto-commits the working tree, still does not run the tests. Its push to `main` will now be *rejected* by the server once protection is applied — which closes the hole loudly rather than quietly, but does not tidy the script |
| **`TRUST1-S10`** — dependency scanning | The half of S10 not delivered. Recommend non-blocking first |

**Still unrecorded, and now six milestones overdue:** the **deploy-cadence decision** the Phase 0
plan required *before M1* (§4). **M1, M2, M3, S3A, M4, M5a and now M5b sit committed and undeployed**,
closing defects that are still live in production. The plan explicitly recommended deploying M1 and
M2 as they landed. **That decision is still owed, and it is the oldest open item in Phase 0.**

---

*TRUST1-V3. The tests could always go red. From here, red means the code does not ship — once a human turns the key.*
