# TRUST1-S10 — CI Pipeline Foundation — Implementation

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Workstream:** `platform`
**Parent programme:** [`TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md`](./TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md) §5.2
**Plan:** [`TRUST1_PHASE0_IMPLEMENTATION_PLAN.md`](./TRUST1_PHASE0_IMPLEMENTATION_PLAN.md) — Phase 0, **milestone M5 (first half)** and **M0 (the baseline)**
**Predecessor:** [`TRUST1_S5_AUTHENTICATION_RATE_LIMITING.md`](./TRUST1_S5_AUTHENTICATION_RATE_LIMITING.md)
**Risk:** 🟢 GREEN — no application code, no schema, no migration, no runtime path. CI configuration and two CI-only scripts. Nothing that ships to a household changed.

---

## THE DEFECT

**There was no CI.** No `.github/` directory, no Actions, no Dependabot, no scheduled anything. Nothing on any path to production ran a single check. `deploy.sh` built the bundle and pushed to `main`, from which Render auto-deploys — and it did **not** run the tests.

`npm run release:check` (`typecheck && test && build`) has existed in `package.json` all along, and **nothing has ever run it.**

The consequence is larger than "no dependency scanning", and the Phase 0 plan named it exactly: *until CI exists, no mechanism exists that can enforce anything.* Every test TRUST1 has written — S1's fail-closed test, S8's allowlist, P8's log redaction, S3's 322-route guard audit, S3A's IDOR suite, S5's 68 rate-limit assertions — was **advisory**. Nothing refused to deploy when they failed. Six milestones of security work sat behind a gate that did not exist.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback identifier** | `rollback/TRUST1-S10-ci-pipeline-foundation-20260711` → `c01053b4231c1ebfc7555e160723f61a8ad07fd8` |
| Predecessor | `c01053b` — TRUST1-S5 (Authentication rate limiting, M4) |
| Working tree at tag time | **Intentionally dirty** — the same eleven pre-existing `PDA1`/`PKR` entries present since `TRUST1` was written. Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3 **the tag protects none of it**, and this task did not touch, stage, or commit one byte of it. |
| Rollback command | `git revert <S10 commit>` |
| Full rollback | `git checkout rollback/TRUST1-S10-ci-pipeline-foundation-20260711` |
| Rollback of the CI alone | `rm -rf .github/ scripts/ci/` and revert `package.json` |

**Rollback risk: nil.** CI touches no application code, no schema, and no runtime path. Deleting `.github/` returns the repository to exactly the state it was in this morning: no gate.

---

## A NOTE ON HOW THIS TASK STARTED — `TRUST1-S5` WAS NEVER COMMITTED

When this task began, `HEAD` was `d92a742` (S3A) and **the entire S5 implementation was sitting uncommitted in the working tree** — `server/lib/auth-rate-limit.ts`, the 68-assertion suite, `express-rate-limit`, the `auth_rate_limits` migration and schema, the eight rate-limited routes, and S5's own implementation report. The S5 report stated *"Milestone M4 is complete"*; the milestone commit it described did not exist.

This mattered directly to S10, because S10's mission is to prove the project builds and all TRUST1 suites run **from a clean checkout** — and a clean checkout is the *committed* state. The committed `package.json` had neither `express-rate-limit` nor `test:trust1-s5-*`. CI would have validated a codebase with no rate limiting in it.

It was raised rather than worked around. **A concurrent session then committed S5 as `c01053b` — exactly the nine S5 files, none of the `PDA1`/`PKR` dirt — which is the correct M4 milestone commit.** S10's rollback tag is anchored there. This document records the episode because a milestone that is *reported* complete and is not *committed* is the same class of defect this programme exists to correct: a control that is declared and not enforced (Rule KC8).

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — architecture bootstrap (STEP 2)
- [x] `docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md` — parent programme, §5.2 TRUST1-S10
- [x] `docs/implementation/platform/TRUST1_PHASE0_IMPLEMENTATION_PLAN.md` — Phase 0 scope, the S10 task plan, M0/M5
- [x] `docs/implementation/platform/TRUST1_S5_AUTHENTICATION_RATE_LIMITING.md` — predecessor
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md` — §1 rule 1, §2 root allowlist (this one **rejected a file and changed the design** — see below)
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md` — rollback identifier

---

## ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity created, altered, or keyed. CI reads the repository and a throwaway database;
  it owns no identity and persists nothing.

☑ One owner per fact
  `npm run release:check` (package.json) remains the ONE gate definition. CI INVOKES the
  existing scripts — typecheck, test, build — and defines no rival pipeline. The Node version
  has exactly ONE owner: `engines.node` in package.json, read directly by setup-node.

☑ No duplicate entities
  No entity created. The one new table-touching artefact (the KNOW1 residue fixture) writes
  ONLY to a disposable CI database and is refused outright against a managed host.

☑ No duplicate ownership
  NO SECOND GATE. This is the plan's chief design constraint for S10/V3/O7: "three tasks, one
  gate, not three gates." S10 builds the machinery; V3 ENFORCES it (branch protection); O7
  closes the path around it (deploy.sh). **V3 and O7 are NOT done here** and this task creates
  no branch protection, no required check, and touches deploy.sh not at all.

☑ No duplicate state
  No state. The CI database is created empty and destroyed with the runner.

☑ Extends existing architecture
  Reuses `release:check`'s three commands; imports `runMigrations()` from
  server/migrations/runner.ts (the SAME function server/index.ts calls at boot, not a
  reimplementation) and the same four boot-time seeds server/index.ts runs. A migration that
  would fail in production fails in CI first, because it is literally the same code path.

☑ Progressive enrichment where appropriate
  N/A — not a knowledge entity.

☑ Knowledge domain compliance
  Introduces no knowledge domain. It APPLIES Rule KC8 (declared vs enforced) with unusual
  directness: this task exists because "the tests pass" was DECLARED and never ENFORCED. Every
  claim below was verified against a clean checkout and an EMPTY database — never from source,
  and never from the long-lived development database, which is exactly what had been hiding the
  test-fixture coupling for however long it has existed.

☑ Honest gaps over fabricated information
  The gaps are stated in Definition of Done, not implied away: typecheck is NOT green (175
  pre-existing errors, frozen not fixed); dependency scanning is NOT built; the workflow has
  NEVER run on GitHub; and two suites are coupled to the residue of a historical defect, which
  is recorded as a finding rather than quietly patched.

☑ No permanent synchronisation bridge
  None.

☑ Evolution over replacement
  Nothing replaced. `release:check`, `deploy.sh`, `drizzle.config.ts`, the migration runner and
  every seed are used as they are. The one addition (`typecheck:ci`) sits BESIDE `typecheck`
  rather than replacing it — `npm run typecheck` still does exactly what it always did.
```

**Not user-facing.** No client file, route, surface, or copy is touched. The Experience & UI Governance blocks do not apply.

### A governing-architecture conflict, raised and resolved before it shipped

The obvious way to pin Node is a `.nvmrc` file. **It was written, and then deleted**, because `.engineering/scripts/repo-structure-verify.sh` **failed** on it: `REPOSITORY_CONVENTIONS.md` §2's root allowlist does not permit `.nvmrc`, and a new file at the repository root is a structure violation.

Rather than amend governing architecture unilaterally to suit this task, Node is pinned by **`engines.node` in `package.json`** — an already-permitted root file — and `actions/setup-node@v4` reads the version straight from it (`node-version-file: package.json`). The conflict resolved into a strictly better design: **one source of truth for the Node version instead of two that can drift.** The repo's own enforcement script caught the violation, which is the system working.

`.github/` itself is a **directory**, and the verifier's root allowlist checks files only (`find -maxdepth 1 -type f`) — so it passes. GitHub Actions fixes that path with no alternative. It is not named in §2's folder-ownership table, which is a documentation gap; see Scope Lock suggestion 1.

---

## IMPLEMENTATION

### Files changed — 5

| File | Change |
|---|---|
| `.github/workflows/ci.yml` | **New** — the pipeline. Postgres 16 service container; pinned Node; `npm ci` → DB setup → typecheck gate → `npm test` → `build`. Runs on every push and every PR to `main` |
| `scripts/ci/typecheck-gate.ts` | **New** — the typecheck **regression** gate (this is the load-bearing piece; see below) |
| `scripts/ci/typecheck-baseline.json` | **New** — 175 pre-existing errors, frozen, keyed portably |
| `scripts/ci/setup-test-database.ts` | **New** — schema + ordered migrations + boot seeds + test fixtures, against an empty database |
| `scripts/ci/seed-know1-residue.ts` | **New** — a **test fixture**. See "The fixture nobody knew was there" |
| `package.json` | `engines.node`; three scripts: `typecheck:ci`, `typecheck:baseline`, `ci:setup-db` |

`server/`, `shared/`, `client/`, every existing test, `deploy.sh`, `tsconfig.json` and every migration are **unmodified.**

### The pipeline

```
npm ci  →  ci:setup-db  →  typecheck:ci  →  npm test  →  npm run build
```

Any step failing fails the job. There is no `continue-on-error` anywhere.

### No production secrets — and this is verified, not asserted

Only two variables are `REQUIRED` (`server/lib/platform-status.ts`): `DATABASE_URL` and `SESSION_SECRET`. **CI supplies both itself:**

- `DATABASE_URL` → the ephemeral Postgres service container, created empty, destroyed with the runner.
- `SESSION_SECRET` → `openssl rand -hex 32`, generated **per run**. It is not a production secret, is stored nowhere, and grants access to nothing.

`OPENAI_API_KEY`, `SMTP_*` and every integration key are `FEATURE`/`INTEGRATION` — absent, they degrade features but are not fatal. **The clean-environment verification below ran with every one of them explicitly unset**, and all 65 suites passed. **No suite in `npm test` makes a live call to a paid API.** (`test:companion-benchmark`, which does, is deliberately **not** in `npm test` and is not in the gate.)

`TRUST1-S1` made a missing `SESSION_SECRET` fatal — the server now refuses to boot without one. That is correct, and it is precisely why CI must generate one. The Phase 0 plan predicted this would "bite the first CI runner". It did, and it is handled.

---

## THE THREE THINGS THIS TASK DISCOVERED

The Phase 0 plan called S10 *"the only Phase 0 task whose scope is genuinely unknown"* and demanded a baseline spike as a deliverable in its own right: **does `npm test` pass, from a clean checkout, on a clean machine?** Nobody knew. Now it is known, and the answer was **no** — three times over, for three different reasons, none of which was visible from the development machine.

### 1. `npm run typecheck` has never passed, and cannot be a gate

**`tsc --noEmit` exits non-zero with 175 errors.** It always has. `release:check` is `typecheck && test && build`, so **`release:check` has never been able to pass** — which is a large part of why nothing ever ran it.

A CI job that runs `npm run typecheck` would be red on its first run and every run after, forever. The Phase 0 plan is explicit that this is worse than no gate: *"a gate that is red for reasons unrelated to the change under review teaches everyone to bypass it, and a bypassed gate is worse than no gate, because it is believed."*

The mission's wording is exact, and it is not an accident: fail on **typecheck regressions**. Not "typecheck passes". So `typecheck:ci` **freezes the 175 known errors and fails on a new one.** The debt is locked; it can only shrink.

> **The 175 are not 175 bugs.** 137 are `TS1378` (top-level `await`) and 12 are `TS2802` (iteration) — **149 of 175, or 85%, are a single missing line.** `tsconfig.json` sets `"module": "ESNext"` but **never sets `target`**, which therefore defaults to ES5. Setting `"target": "ES2022"` would retire 149 errors at a stroke and leave ~26 genuine ones. **That change is NOT made here** — it alters typechecking repository-wide and is outside S10's scope. It is Scope Lock suggestion 2, and it is the highest-value small change available to this codebase.

### 2. The typecheck baseline was not portable — and the clean-checkout run is the only thing that caught it

The first version of the gate keyed each error on `(file, code, message)`. It passed perfectly in the workspace. **In the clean checkout it reported three "NEW" regressions that were not new at all.**

TypeScript embeds the **absolute path of the repository inside some error messages**:

```
TS2339: Property 'categories' does not exist on type
        'typeof import("/home/runner/workspace/shared/schema")'
```

In a different directory, the identical error produces a different string, and therefore a different key. **A baseline recorded locally would have been 100% "regressions" on every GitHub runner**, whose checkout path is `/home/runner/work/<repo>/<repo>`. The gate would have been red on its first real run — the exact failure mode above, shipped by the very mechanism meant to prevent it.

`tsc`'s type printer is also not textually stable: the same commit printed the same anonymous type with different property ordering across two runs (this repo sets `incremental: true`).

Errors are now keyed on **`(file, TS code)` with an occurrence count** — insensitive to both path and message. The blind spot this accepts is stated in the source and here: an error that *replaces* another of the same code in the same file leaves the count unchanged and passes. That is narrow, and far smaller than a gate nobody can keep green.

**This is the single strongest argument for the mission's insistence on a clean-environment run.** Nothing else would have found it. It would have been found by the first engineer to open the first PR, who would have concluded the gate was broken and asked for it to be turned off.

### 3. The fixture nobody knew was there

**`npm test` does not pass on an empty database.** Three separate coupling points to the long-lived development database, each invisible from a developer's machine:

| Suite | Failed with | Cause |
|---|---|---|
| `test:additives` | `Detects E250 ❌ / E252 ❌ / E300 ❌` — *8/14 passed* | Reads `SELECT … FROM additives`. The table is **empty** on a fresh database. Not a detection bug — **no reference data** |
| `test:knowledge-food-ownership` | `seed and live table agree on row count — live=0 seed=610` | `knowledge_*` tables unseeded |
| `test:know5-evidence-contract` | **`fixture: the retired 'plant-protein' nutrient still has active composition rows — got 0`** | See below |

The first two are ordinary missing reference data, fixed by running the seeds the repository already ships (`additives`, `knowledge`, `canonical`) — now part of `ci:setup-db`.

**The third is different, and it is the most interesting thing this task found.**

`test:know5-evidence-contract` and `test:knowledge-food-ownership` **require the residue of KNOW1's historical bad import to be present in the database** — 38 orphaned `plant-protein` composition rows, one still-active retired vocabulary row, and two orphaned nutrient→benefit rows. KNOW5's `reconcile` exists to *deactivate* orphaned knowledge rows; to prove that it does, **the test needs orphaned rows to deactivate.** A cleanup test needs dirt to clean. The test's own word for it is `fixture:`.

On the development database the dirt is supplied **by accident of history**, so the dependency was never noticed. On a fresh database there is none, and both suites go red for a reason that has nothing to do with the change under review.

`scripts/ci/seed-know1-residue.ts` therefore **declares** that state instead of inheriting it — the rows reproduced exactly as they exist today, verified by querying the development database. **Not one assertion in either suite was weakened, and no product code was touched.** The tests assert against precisely the state they always have; what changed is that the state is now written down.

> **This should not exist forever, and it is a finding, not a fix.** Two suites in this repository are coupled to the residue of a defect. They will fail **the day someone finally runs `seed:knowledge` with reconcile against a real database and cleans it up** — the tests assert that a bug is still there. That belongs to the KNOWLEDGE workstream (KNOW1/KNOW5), not to TRUST1-S10, and S10 deliberately does not touch their assertions. Scope Lock suggestion 3.

---

## TESTS EXECUTED

### The M0 baseline — recorded, as the plan required

> *"Until `M0` establishes the baseline, 'the tests still pass' is not a verifiable claim — it is a hope."* — Phase 0 plan §5.1

| Question | Answer |
|---|---|
| Does `npm test` pass on the **development** machine? | **YES** — exit 0, 65 suites, 0 failed assertions |
| Does `npm test` pass from a **clean checkout on an empty database**? | **NO — not without the fixtures above.** It failed at suite 7 of 65 |
| Does it pass **after** `ci:setup-db`? | **YES** — exit 0, 65 suites, 0 failed assertions |
| Does `npm run typecheck` pass? | **NO — 175 errors, and it never has** |
| Does `npm run build` pass from clean? | **YES** — `dist/index.cjs`, 3.8 MB |
| Does any gated suite need a paid API key? | **NO** — verified with every key unset |

### The clean-environment run — the load-bearing evidence

Executed **2026-07-11** against a **`git clone` of `c01053b`** (no `node_modules`, no working-tree dirt) and a **brand-new `initdb` Postgres 16 cluster** — proven empty (`0 tables in the fresh database`) — with **every production secret explicitly unset**. This is a faithful reproduction of the GitHub Actions job.

```
npm ci          : ok
ci:setup-db     : exit 0     0 tables -> 91 tables; additives 300, knowledge_foods 610,
                             canonical_food 312; KNOW1 residue 38 + 2
typecheck:ci    : exit 0     baseline 175, current 175 — PASS, no new type errors
npm test        : exit 0     65 suites invoked, 0 failed assertions
npm run build   : exit 0     dist/index.cjs 3.8M

PIPELINE GREEN — clean checkout, empty database, zero production secrets
```

**All six TRUST1 security suites executed and passed** inside that run: `trust1-s1-session-secret`, `trust1-s8-p8-no-secret-disclosure`, `trust1-s2-secure-production-cookies`, `trust1-s3-secure-meal-template-endpoints`, `trust1-s3a-meal-ownership-idor`, `trust1-s5-authentication-rate-limiting`. All six require a database; **without the service container the security gate would not have run at all** — which is the strongest single argument for `ci:setup-db` existing.

### The failure proofs — the gate was made to fail, four ways

A gate that has never failed is a hope, not a control. Each regression was injected, observed, and reverted.

| Injected regression | Gate | Result |
|---|---|---|
| A new type error in `server/lib/sanitizeUser.ts` | `typecheck:ci` | **exit 1** — `NEW server/lib/sanitizeUser.ts :: TS2322`, `1 regression(s)` |
| A deliberately failing assertion in `test:scoring` | `npm test` | **exit 1** |
| **`TRUST1-S1` reintroduced** — a hardcoded `SESSION_SECRET` fallback restored to `requireSessionSecret()`, i.e. authentication silently fails **open** | `npm test` | **exit 1** — 4 assertions failed: *"throws when SESSION_SECRET is unset"*, *"…is the empty string"*, *"…is whitespace only"*, *"the unset error names the variable"* |
| `DATABASE_URL` pointed at an unreachable database | `ci:setup-db` | **exit 1** — *"runMigrations() failed. A migration that CI cannot apply is one production cannot apply either."* |

The third is the one that matters. **The single most dangerous defect in the codebase — a total authentication bypass gated on a configuration mistake — was reintroduced, and the pipeline refused it.** That is the whole purpose of TRUST1-S10 in one line, and it is now demonstrated rather than argued.

---

## MANUAL VERIFICATION

Executed 2026-07-11. Every result below was observed, not inferred.

**1. Run the complete pipeline from a clean checkout.**
`git clone` → fresh `initdb` cluster → `npm ci` → `ci:setup-db` → `typecheck:ci` → `npm test` → `npm run build`. **Green, end to end** (output above). The database began with **0 tables**, verified by query, and ended with 91.

**2. Confirm all TRUST1 suites execute.**
All **six** ran inside `npm test` in the clean run and all six passed. Confirmed by suite invocation, not by reading the script: `grep -cE '^> rest-express@1.0.0 test:'` → **65 suites invoked**.

**3. Confirm failures stop the pipeline.**
Four deliberate regressions, four non-zero exits (table above). Including the reintroduced S1 authentication bypass.

**4. Confirm success produces a green pipeline.**
`PIPELINE GREEN — clean checkout, empty database, zero production secrets`. `CLEAN_RUN_EXIT=0`.

**5. Repository structure.**
`.engineering/scripts/repo-structure-verify.sh` → **"Repository structure is clean."** (It **failed** on the first attempt, on `.nvmrc`. The design was changed rather than the rule.)

**6. YAML validity.**
`ci.yml` parsed with a real YAML parser — triggers, service container, env keys and all eight steps confirmed. A workflow that does not parse fails *silently* on GitHub, which is the worst possible outcome for a gate.

---

## USER ACCEPTANCE EVIDENCE

- **The enforcement machinery exists for the first time.** Yesterday, nothing on any path to production ran a single test. Today, every push and every pull request runs 65 suites, the typecheck regression gate, and the build — from a clean checkout, against a clean database, with no production secret.
- **The security work is now actually enforced.** All six TRUST1 suites run automatically. **Reintroducing TRUST1-S1's total authentication bypass now fails the pipeline** — proven by doing it. Six milestones of security work stopped being advisory.
- **The question the plan called "genuinely unknown" has a recorded answer.** `npm test` did **not** pass from a clean checkout. It does now, and the three reasons it did not are documented rather than patched over: unseeded additives, unseeded knowledge, and two suites coupled to the residue of a historical bug.
- **The gate is one people can actually keep green.** `tsc` reports 175 errors and always has; a naive gate would have been red forever and routed around within a week. The 175 are frozen, a new one fails the build, and **85% of them are one missing `target` line in `tsconfig.json`** — now named, with the fix scoped for approval.
- **A defect in the gate itself was caught before it shipped**, and only because the mission demanded a clean-environment run: the typecheck baseline was keyed on messages containing absolute paths, and would have been 100% false regressions on every GitHub runner.
- **Nothing was fabricated to make it green.** No assertion was weakened, no suite excluded, no test skipped, no `continue-on-error`. The one fixture added reproduces existing rows exactly and is documented as a finding against the KNOWLEDGE workstream.
- **No production secret is required by CI**, verified by running the entire pipeline with every key unset.

---

## DEFINITION OF DONE

Against the Phase 0 plan's stated criteria for S10:

| Criterion | Status |
|---|---|
| **The baseline is recorded** — what `release:check` does on a clean runner, and what it took to make it green | ✅ Recorded above. `typecheck` fails (175, always has); `test` needed three fixture fixes; `build` was fine |
| CI runs `typecheck`, `test` and `build` on every push and PR | ✅ `.github/workflows/ci.yml` |
| Node is pinned | ✅ `engines.node` in package.json (**not** `.nvmrc` — forbidden at the root) |
| Any test requiring a database runs against a service container | ✅ Postgres 16 service container. 12 of 65 suites need it, **including all six TRUST1 suites** |
| Any test requiring a paid external API is excluded from the gate | ✅ **None is in the gate.** Verified by running all 65 with every key unset |
| No test in the gate makes a live call to a paid third-party API | ✅ Same evidence |
| A deliberately-broken commit (type error) fails CI | ✅ Proven |
| A deliberately-failing test fails CI | ✅ Proven |
| The workflow completes in a time a human will wait for | ⚠️ **See gaps** |
| **Dependency scanning with a severity threshold that fails the build** | ❌ **NOT DONE — deliberately.** See gaps |
| A patching SLA by severity is written down | ❌ **NOT DONE** — belongs with the scanning |

### The gaps, stated plainly

1. **Dependency scanning is not built, and the plan's DoD asks for it.** The mission for this task enumerated its objectives explicitly — clean build, `npm install`, migrations, `npm test`, `npm run typecheck`, failure on regressions, TRUST1 suites, no production secrets, document fixtures — and **dependency scanning is not among them**. It was therefore treated as out of scope rather than smuggled in. It is also the one addition most likely to make the gate red for reasons unrelated to the change under review (`npm audit` on this dependency tree will almost certainly report advisories), which is the failure mode the plan warns hardest about. **`TRUST1-S10` is not complete against the parent plan's DoD until it is added, and this document does not claim otherwise.** Scope Lock suggestion 4.

2. **The workflow has never run on GitHub.** It has been proven against a faithful local reproduction — same Node, Postgres 16, empty database, no secrets — and its YAML parses. But `actions/setup-node@v4` reading `engines.node` from `package.json`, the service-container healthcheck, and the npm cache have **not** been exercised on a real runner, because doing so requires pushing, and **this task does not push.** The first real run may need a small correction. That is honest and it is expected.

3. **Runtime is unmeasured on CI hardware and may be unacceptably long.** `npm test` is 65 sequential suites, several of which spawn real HTTP servers and one of which (S5) waits on real rate-limit windows. On this 2-core machine the suite takes roughly 20 minutes; a GitHub standard runner is also 2-core. The plan says that if the serial suite makes the wall-clock unacceptable, **"parallelising or sharding it is part of this task"**. It has not been done: the suites share one database and would collide if run concurrently, so sharding is real work with a real risk of flakiness, and shipping a *correct* serial gate is worth more than a fast flaky one. **The 45-minute job timeout is a guess, not a measurement.** Revisit after the first real runs.

4. **Typecheck is frozen, not fixed.** 175 errors remain. The gate stops new ones; it does not remove old ones. And it accepts one blind spot: an error that replaces another of the same code in the same file passes.

5. **This is only half of milestone M5.** `TRUST1-V3` — branch protection, required status checks, and the emergency-bypass procedure — is **not done**. **Until V3 lands, CI reports but does not enforce**: a red run does not block a merge, and `deploy.sh` still does not run the tests (that is `TRUST1-O7`). The machinery exists; the gate is not yet closed.

---

## DATA IMPACT

- **Reads existing data:** NO (in CI). The development database was **queried read-only, once**, to capture the exact KNOW1 residue rows for the fixture.
- **Writes new data:** **Only to a disposable CI database.** `ci:setup-db` and the residue fixture write schema, seeds and 40 fixture rows into a throwaway Postgres that is created empty and destroyed with the runner.
- **Changes meaning of existing data:** NO
- **Requires backfill:** NO
- **Schema / migration:** **NO.** No migration is added. `ci:setup-db` *applies* the existing ones.

**No production or development database is modified by anything in this change.** `scripts/ci/setup-test-database.ts` runs `drizzle-kit push --force`, which is safe **only** against a disposable database — so it **refuses to run** against a host matching `neon.tech`, `amazonaws.com`, `render.com` or `supabase` unless explicitly overridden. That guard exists because "it was obviously only ever meant for CI" is not a control, and because `TRUST1-O8`/`R6` (the largest data-loss risk in the platform — `drizzle-kit push --force` against production) is still wide open and this task must not add a second path to it.

---

## TRUST CHECK

**Could this mislead the user?**
No household sees CI. It could mislead **an engineer**, which is the failure this programme exists to correct, so the stricter standard applies. The most dangerous available claim was *"CI is green, therefore the code is verified"* — and this document refuses it in three places: typecheck is **frozen, not passing**; dependency scanning is **absent**; and **CI reports but does not enforce** until V3 lands. A green tick that means less than a reader assumes is precisely how `EWO-PRO1` declared three controls that were not in the code.

**Could this fabricate certainty?**
The strongest claim here — *"the pipeline runs from a completely clean checkout with no production secrets"* — is the one that was hardest tested. It was not asserted from the YAML. A **fresh `git clone`** and a **brand-new `initdb` cluster proven to contain zero tables** were used, with **every production secret explicitly unset**, and the entire pipeline run end to end. That run is also what **falsified** the first version of the typecheck gate, which passed locally and would have failed on every GitHub runner. A gate verified only where it was written is not verified.

**Is anything guessed but shown as real?**
No, and four limits are stated rather than smoothed over. **(1)** The workflow has **never run on GitHub** — it is proven against a faithful local reproduction, and the first real run may need a correction. **(2)** The 45-minute timeout is a **guess**, not a measurement on CI hardware. **(3)** `npm test` passing is a fact about *this* commit on *2026-07-11*; the suite is 65 sequential scripts and its stability under CI contention is unmeasured — and I observed exactly that class of failure during this task, when a concurrent process caused `ERR_WORKER_INIT_FAILED` on a 2-core box. **(4)** The KNOW1 residue fixture makes two suites pass by **supplying a defect's residue**; that is what those tests demand, it is documented, and it is flagged for the KNOWLEDGE workstream rather than presented as a clean result.

**What happens if the system is wrong?**
The identifiable failure is a **false red** — CI failing for a reason unrelated to the change under review, which teaches everyone to bypass the gate. Three things mitigate it: the typecheck baseline (so 175 pre-existing errors do not fail every PR), the database service container plus fixtures (so a third of the DB-dependent suites do not fail on a clean runner), and the explicit exclusion of any paid-API test. The residual risk is CI-hardware flakiness in the long serial suite, which is unmeasured and named as such.

The opposite failure — a **false green** — is bounded and stated: CI does not yet block anything (V3), and does not scan dependencies.

- **No architectural duplication introduced:** YES — `release:check`'s commands remain the one gate definition; no second pipeline
- **No new source of truth created:** YES — `engines.node` is the *only* Node version; `runMigrations()` is imported, not reimplemented
- **Runtime behaviour altered:** **NO** — zero application code, zero schema, zero runtime path

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected:            None. CI configuration only.
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

**Justification.** The test is *"would a person's answer to 'what is THA?' be different after this change?"* It would not. No page, route, journey, capability, dialog, integration, setting, or claim is altered. Nothing ships to a household.

---

## ROLLBACK PLAN

| Item | Value |
|---|---|
| **Rollback identifier** | `rollback/TRUST1-S10-ci-pipeline-foundation-20260711` → `c01053b` |
| **Files created** | `.github/workflows/ci.yml`, `scripts/ci/typecheck-gate.ts`, `scripts/ci/typecheck-baseline.json`, `scripts/ci/setup-test-database.ts`, `scripts/ci/seed-know1-residue.ts`, this document |
| **Files modified** | `package.json` (`engines`, 3 scripts) |
| **Rollback command** | `git revert <S10 commit>` |
| **Full rollback** | `git checkout rollback/TRUST1-S10-ci-pipeline-foundation-20260711` |
| **Data to unwind** | **None.** No production or development data was written. |

**Risk of rollback: nil.** No application code, no schema, no runtime path. The repository returns to having no CI.

**Risk of the change:** the only real one is a **false red** — CI failing for a reason unrelated to the change under review. It is mitigated as described in the Trust Check, and it is *why* the typecheck gate is a regression gate and not a pass/fail gate. If CI proves flaky on real runners, the correct response is to fix the flakiness or shard the suite — **not** to add `continue-on-error`, which would turn the gate into decoration.

---

## SCOPE LOCK

**Implemented scope**
- `.github/workflows/ci.yml` — `npm ci`, database setup, typecheck regression gate, `npm test`, `npm run build`, on every push and every PR to `main`.
- A Postgres 16 service container, so the 12 database-dependent suites — **including all six TRUST1 security suites** — actually run.
- `ci:setup-db` — declarative schema + the **same** ordered migrations and boot seeds `server/index.ts` runs, plus the reference seeds and the one test fixture the suite requires. Fails the pipeline on migration failure.
- A typecheck **regression** gate over a portable, frozen baseline of the 175 pre-existing errors.
- Node pinned via `engines.node` (one owner).
- No production secret required, verified by running the whole pipeline with every key unset.
- The M0 baseline, recorded — including the fact that `npm test` did **not** pass from a clean checkout, and exactly why.
- Four proven failure modes: typecheck regression, test regression, **TRUST1 security regression**, migration failure.

**Explicitly excluded — and NOT done**
- **`TRUST1-V3`** (pre-deploy verification gate) — **not started.** No branch protection, no required status check, no emergency-bypass procedure. **CI reports; it does not yet enforce.**
- **`TRUST1-O7`** (deployment pipeline hardening) — **not started.** `deploy.sh` is **untouched**: it still runs `git add -A`, still auto-commits, and still does not run the tests.
- **Deployment, release automation, GitHub releases, CD workflows** — **explicitly not built.** Nothing in this change pushes, publishes, releases, or deploys.
- **Dependency scanning / `npm audit` / Dependabot** — **not built.** Not among the mission's objectives; see Definition of Done gap 1 and suggestion 4.
- **`tsconfig.json`** — **untouched**, despite 149 of 175 errors coming from one missing line in it.
- **Every existing test assertion** — **untouched.** Not one was weakened, skipped, or excluded to make the gate green.
- `server/`, `shared/`, `client/`, `deploy.sh`, every migration and every existing seed — **unmodified.**

**SUGGESTIONS — observed in scope, not implemented, requiring approval**

1. **`REPOSITORY_CONVENTIONS.md` §2 should name `.github/` in its folder-ownership table.** The directory is now real, GitHub fixes its path, and the conventions document does not mention it. The mechanical check passes (it inspects root *files*), so this is a documentation gap, not a violation — but the next person to read §2 will not know whether `.github/` is permitted. **Amending governing architecture is not S10's to do unilaterally.**

2. **Set `"target": "ES2022"` in `tsconfig.json`.** This is the highest-value small change available in this codebase: **149 of the 175 typecheck errors (85%) are `TS1378`/`TS2802`, caused solely by `target` defaulting to ES5** because it is never set. Because `noEmit: true` and the build runs through esbuild/vite, `target` here affects **typechecking only — not the shipped bundle**, which makes the blast radius far smaller than it looks. It should be done as its own change, with the baseline re-recorded, and it would take the frozen debt from 175 to roughly 26 real errors worth actually fixing.

3. **`test:know5-evidence-contract` and `test:knowledge-food-ownership` are coupled to the residue of a historical defect** and should be fixed by the KNOWLEDGE workstream. They assert that KNOW1's bad import is **still present** (38 orphaned rows). They will fail the day anyone actually cleans it up, and they only passed until now because the development database happened to be dirty. S10 supplies the residue as a declared CI fixture rather than weakening their assertions — but the right fix is theirs, and it is to construct the orphans inside the test and roll them back, as `know5` already does for everything else.

4. **Add dependency scanning (`npm audit` / Dependabot) with a severity threshold and a patching SLA.** Required by the parent plan's DoD for S10; deliberately out of scope for this mission. Recommend it lands as a **separate, non-blocking job first**, observed for a week, and only then made blocking — because turning on a blocking audit gate against an unexamined dependency tree is the fastest way to make the whole pipeline something people route around on day one.

5. **`script/build.ts:16` still allowlists `cors` and `jsonwebtoken`, neither of which is installed or used.** Carried forward from S5's suggestions, still true, still misleading to anyone auditing the build config.

---

## OUTCOME

**Enforcement is possible for the first time.**

The lesson worth keeping is that **the clean-checkout requirement was not ceremony.** Everything in this task that mattered was invisible from the development machine, and every one of them would have shipped a gate that was red on its first real run:

- `npm run typecheck` has **never** passed — so `release:check`, the gate the repository already had, could never have passed either. That is not a small detail; it is most of the reason nothing ever ran it.
- The typecheck baseline was keyed on strings containing **absolute paths**, and would have reported 100% false regressions on every GitHub runner. It passed perfectly where it was written.
- `npm test` did **not** pass on an empty database, and one of the three reasons was that **two suites require a historical bug's residue to still be in the database.**

None of that is visible from source. All of it is visible the moment you clone the repository into an empty directory and point it at an empty database — which, until today, nobody had ever done.

The gate now refuses a reintroduced TRUST1-S1 authentication bypass. That was demonstrated, not argued.

---

## NEXT STEPS

**Milestone M5 is half complete.** Remaining TRUST1 Phase 0 tasks:

| Task | Status |
|---|---|
| **`TRUST1-V3`** — Pre-deploy verification gate | **Next, and now unblocked.** S10's baseline is green, which was V3's precondition: *"turn the gate on only once the baseline suite is green."* V3 makes CI a **required status check** on `main`, and must ship with the **emergency-bypass procedure written first** — a gate with no documented 3 a.m. path gets disabled permanently during the first incident |
| **`TRUST1-O7`** — Deployment pipeline hardening | Blocked on V3. `deploy.sh` still runs `git add -A` and still does not test |
| **`TRUST1-S10`** — dependency scanning | The one part of S10's parent DoD not delivered here. Recommend non-blocking first |

**Still unrecorded, and now five milestones overdue:** the **deploy-cadence decision** the Phase 0 plan required *before M1* (§4). **M1, M2, M3, S3A, M4 and now M5a sit committed and undeployed**, closing defects that remain live in production. The plan explicitly recommended deploying M1 and M2 as they landed. **That decision is still owed, and it is now the oldest open item in Phase 0.**

---

*TRUST1-S10. The tests now run before the code ships — on every push, from nothing, with no secrets, and they refuse a reintroduced authentication bypass.*
