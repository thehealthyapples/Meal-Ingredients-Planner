# GIT1 — Current Work Commit and Push — Implementation

**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Remote:** `origin` → `https://github.com/thehealthyapples/Meal-Ingredients-Planner.git`
**Risk:** 🟠 AMBER
**Reason:** Publishes a large accumulated working tree to a shared remote. It changes no product behaviour, but a push is outward-facing and a mistake in *what* is published (a secret, a cache, 485 MB of the wrong thing) is expensive to reverse.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/GIT1-current-work-commit-and-push-20260719` → `4abab9a7` (annotated), on HEAD `6b93a752` |
| What it protects | The exact commit that was HEAD before any GIT1 commit existed |
| Local rollback | `git reset --hard rollback/GIT1-current-work-commit-and-push-20260719` — **destroys the committed work**; only correct if the intent is to return to the pre-GIT1 state |
| Preferred local rollback | `git revert <sha>` — keeps history honest |
| Remote rollback | `git push --force-with-lease origin rollback/GIT1-current-work-commit-and-push-20260719:int1-intelligence-platform` — **rewrites shared history**; only with explicit agreement |
| Nothing was reset, stashed, discarded or overwritten | Confirmed. No `git reset`, no `git stash`, no `git checkout --`, no force operation was run at any point |

---

## STATE BEFORE THE WORK

| Fact | Value |
|---|---|
| Branch | `int1-intelligence-platform` |
| HEAD | `6b93a752` — *NUT_VERIFY2 — Canonical Resolution Completion* |
| Ahead of remote | **27 commits** — a large body of already-committed work that had never been pushed |
| Behind remote | **0** |
| Modified tracked files | 43 |
| Untracked paths | 71 |
| Working tree size (untracked) | ~500 MB, of which ~485 MB is `docs/ui-audit/` imagery |

**Divergence was verified by a real `git fetch`, not by a stale tracking ref.** After
fetching, the remote head (`9ebba63c`) was confirmed to be an **ancestor of local HEAD**, so
the push is a pure fast-forward and **no concurrent remote work can be lost.** This check
was run *because* the initial reading came from a tracking ref that had not been refreshed —
trusting it would have been the one way this task could have destroyed someone else's work.

---

## ARCHITECTURE COMPLIANCE

| Check | Result |
|---|---|
| Architecture bootstrap read (`docs/architecture/README.md`) | ✅ |
| Creates any entity, owner, capability, route, schema or migration | ❌ None. GIT1 is a repository operation |
| Changes any governing document's rules | ❌ None |
| Introduces a second owner of any fact | ❌ None |
| Product Registry impact | None of its own; it publishes registry edits made by the workstreams it commits (verified: 0 failures, bijection TOTAL) |
| Adoption Register impact | None — no client-side building block created, changed or retired by GIT1 |

The one repository-level change GIT1 makes on its own account is to **`.gitignore`** — see
*Files included and excluded*.

---

## DATA IMPACT

**None.** No migration, no schema change, no table created or altered, no row read or
written, no seed. GIT1 touches version control only. The two tables the committed BUS2A work
declares (`subscriptions`, `billing_events`) are created empty and remain empty; committing
their declaration changes no database.

---

## TRUST CHECK

| Question | Answer |
|---|---|
| Does anything published state something untrue to a household? | No product copy changed in GIT1 |
| Are any secrets, credentials or tokens published? | **No** — scanned, see below |
| Is any personal or household data published? | **No** — no fixtures, dumps or exports are included; the screenshots are of seeded demo data |
| Is a failure being reported as a success? | **No** — three pre-existing failures are reported in full, unfixed and unhidden |

**Secret scan performed** over every untracked text file (34 files) *and* over the added
lines of all 43 modified tracked files, for: OpenAI keys (`sk-…`), Stripe live/test keys
(`sk_live_`, `sk_test_`, `rk_live_`), GitHub tokens (`ghp_`, `gho_`, `github_pat_`), AWS
keys (`AKIA…`), Google keys (`AIza…`), Slack tokens (`xox[baprs]-`), PEM private key blocks,
and Postgres/Mongo connection strings carrying inline credentials.

**Result: zero matches.** Additionally confirmed that no `.env*`, `*.pem`, `*.key`, `*.p12`,
`*.pfx`, `credentials*`, `*.sqlite` or `*.log` file appears anywhere in the staged set.

---

## FILES INCLUDED AND EXCLUDED

### Excluded — and why

| Path | Reason |
|---|---|
| `node_modules/` | Dependency cache. Ignored by `.gitignore:2` |
| `dist/` | Build output. Ignored by `.gitignore:3` |
| `.cache/` | Tooling cache. **Was ignored only by the host's `/etc/.gitignore`** — see below |
| `.env`, `.env.*` | Secrets. Ignored |
| Playwright browser binaries, `test-results/`, `coverage/` | Machine artefacts. None were present; the rules are now declared regardless |

**A portability gap was found and closed.** `.cache/` was excluded **only** by a
machine-level `/etc/.gitignore` on the Replit host — *not* by the repository. On a laptop, a
CI runner, or a fresh clone, `.cache/` is committable, and a cache directory is exactly what
a broad `git add` sweeps up at the end of a long session. `.gitignore` now declares
`.cache/`, `.tmp/`, `*.local`, `coverage/`, `playwright-report/`, `test-results/`,
`.playwright/`, `ms-playwright/`, `*.log` and `.env.*` itself, so the exclusion is a property
of **the repository** rather than of **one host**. Verified afterwards that the untracked
count was unchanged at 71 — the hardening excluded no legitimate work.

### Included — the judgement calls, stated

**All 43 modified tracked files and all 71 untracked paths are included.** Nothing present in
the working tree was withheld. Two inclusions deserve their reasoning in the open:

**1. `docs/ui-audit/` — ~485 MB of imagery across 13 design directories.**
Included, on three independent grounds:
- The repository **already tracks 202 MB** of exactly this material (442 files), so it is an
  established, deliberate convention rather than a novel decision.
- **Every one of the 13 directories is cited by documents already committed** —
  `north4-concepts` alone is referenced in 16. Excluding them would leave broken references
  in reports already in the repository, which is a correctness defect, not a saving.
- No single file exceeds 50 MB, so GitHub's 100 MB hard limit is not approached.

The cost is stated plainly rather than buried: **this roughly triples the repository's
screenshot footprint**, and `.git` was already 1.1 GB. If that is judged wrong, it is far
cheaper to decide now than after further commits land on top — see *Rollback Plan*.

**2. Three loose implementation reports** (`PROD3_…`, `PROD4_…`, `UX_REFINE1_…`) sit directly
in `docs/implementation/` rather than in a workstream subdirectory, which
`repo-structure-verify.sh` flags. They are committed **as-is** because the violation is
**pre-existing and widespread** — 13 already-tracked files sit loose in the same directory,
plus 2 in `docs/investigations/`. Relocating other programmes' reports would break inbound
references and is a separate cleanup workstream, not part of publishing current work.

---

## VALIDATION RESULTS

Run against the full working tree **before** committing.

| Check | Result |
|---|---|
| `npm run build` | ✅ **PASS** — `dist/index.cjs` 4.0 MB |
| `npm run typecheck:ci` | ❌ **FAIL — 18 regressions, all PRE-EXISTING** (see below) |
| `test:bus2a-commercial-foundation` | ✅ **93/93** |
| `test:bus1-trust-and-compliance` | ✅ **42/42** |
| `test:prod6-safety-gate-convergence` | ✅ **76 passed, 0 failed** |
| `test:prod3-companion-restriction-safety` | ✅ **36 passed, 0 failed** |
| `verify-product-inventory` | ✅ 0 failures · bijection **TOTAL** · 40 pre-existing PKR23 warnings |
| `verify:coherence` | ❌ **FAIL — 1, pre-existing** (Domain 34, BUS1's record) |
| `repo-structure-verify.sh` | ❌ **FAIL — 2, pre-existing** (loose files, see above) |

### The three failures, reported honestly and not fixed

**1. `typecheck:ci` — 18 regressions.** The gate's own message is *"Fix them — do NOT
re-record the baseline to make this pass."* **The baseline was not re-recorded.** All 18 sit
in five files — `server/lib/pantry-intelligence-assembler.ts`,
`server/tests/test-cbk2-intelligent-cookbook.ts`,
`server/tests/test-intelligence-shopping-binding.ts`,
`server/tests/test-pantry1-intelligent-pantry.ts`,
`server/tests/test-plan2-planner-evolution.ts`.

**Attribution was verified, not assumed:** every one of those five files is **clean in the
working tree** (unmodified, untracked-free), so the breakage is **committed at HEAD** and is
not introduced by anything GIT1 publishes. This independently corroborates PROD5's finding.
Closing them means building the missing explainability and meal-scoring APIs — feature work,
outside a commit-and-push mission.

**2. `verify:coherence` — Domain 34 (Legal Agreement & Consent)** declares no unsuffixed
`Authoritative Source` row (Register Rule 1). Owned by **BUS1**. Domain 26's identical defect
*was* closed, by BUS2A, because it was BUS2A's own record; Domain 34 is another workstream's
governing document and was deliberately left alone.

**3. `repo-structure-verify.sh`** — loose files in `docs/implementation/` and
`docs/investigations/`. Pre-existing, 15 already-tracked files, reasoning above.

**No test was skipped to make this pass, and no baseline was re-recorded.** The full
`npm test` chain (150+ suites) was not run end to end: PROD5 recorded that several safety
suites each exceed a 2-minute timeout in this environment, so the suites *relevant to the
changed files* were run individually instead. That is a deliberate narrowing and is stated
here rather than presented as full coverage.

---

## COMMIT STRUCTURE — AND WHY IT IS NOT PER-WORKSTREAM

The brief asked for logical per-workstream commits *where distinct workstreams can be
identified*, and one clearly described convergence commit otherwise. **The second case
applies, and the evidence for it is specific:**

- `server/routes.ts` carries **BUS2A (4), PROD5 (2) and PROD6 (7)** marked changes in one file.
- `package.json` carries **BUS2A's and PROD6's test registrations on the same single line**
  (the giant `"test"` chain), so they cannot be separated by line at all.

Splitting these would require hunk-level surgery on shared lines, producing intermediate
commits that **misrepresent the state of each workstream** and may not pass their own tests —
a worse history than one honestly-labelled convergence commit, and a real risk of mangling
work the brief forbids losing.

What *is* cleanly separable is **code and documentation** from **binary visual evidence**, so
the work is split on that axis:

| # | Commit | Contents |
|---|---|---|
| 1 | Convergence — code, docs, tests, reports | 43 modified + all non-`ui-audit` untracked paths |
| 2 | Visual evidence | `docs/ui-audit/` (~485 MB) |

They are pushed **in that order, separately**, so that if the large binary push is slow or
fails, the code and documentation are already safe on the remote.

---

## SCOPE LOCK

GIT1 committed and pushed existing work and hardened `.gitignore`. It did **not**: merge any
branch, open a pull request, deploy to production, rewrite history, force-push, delete or
relocate any file, fix any pre-existing failure, or alter any product behaviour.

---

## COMMIT SHAs, PUSH RESULT AND FINAL STATUS

| # | SHA | Commit | Contents |
|---|---|---|---|
| 1 | `12630697` | Convergence — publish accumulated programme work | 78 files: 43 modified + 35 untracked (code, docs, tests, reports, `.gitignore` hardening) |
| 2 | `8e2252be` | Visual evidence — UI audit screenshots | 288 files, ~499 MB |
| 3 | *(this document's final update)* | GIT1 — record commit SHAs and push result | This section |

**Branch pushed:** `int1-intelligence-platform`
**Remote:** `origin` → `https://github.com/thehealthyapples/Meal-Ingredients-Planner.git`

```
9ebba63c..12630697  int1-intelligence-platform -> int1-intelligence-platform
12630697..8e2252be  int1-intelligence-platform -> int1-intelligence-platform
```

The first push carried the **27 previously-unpushed commits** as well as commit 1 — that
backlog is now published. Both pushes were **fast-forward**; no force, no history rewrite.

**Push verified independently against the remote**, not merely from the push command's own
output:

```
git ls-remote origin refs/heads/int1-intelligence-platform
  8e2252be21786b5c7e64b822e8139a05f34b35ce
git rev-parse HEAD
  8e2252be21786b5c7e64b822e8139a05f34b35ce
git rev-list --left-right --count origin/int1-intelligence-platform...HEAD
  0	0
```

**Final `git status`: completely clean** — 0 modified, 0 untracked, 0 staged.

### The one blocker encountered, and how it was cleared

The first push failed:

```
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for '.../Meal-Ingredients-Planner.git/'
```

Read access worked (`git ls-remote` succeeded) but write did not: no git credential helper
was configured. The `gh` CLI was **already authenticated** as `thehealthyapples` with `repo`
scope, so `gh auth setup-git` was run to register it as git's credential helper, and the push
succeeded unchanged. No token was created, printed, or written into the repository.

### Work deliberately left uncommitted

**None.** Every modified and untracked path present in the working tree was committed. The
only paths not committed are those excluded by `.gitignore` (`node_modules/`, `dist/`,
`.cache/`, `.env*` and the machine artefacts listed above), none of which is project work.

### Not pushed: the rollback tag

`rollback/GIT1-current-work-commit-and-push-20260719` is held **locally only**, matching the
repository's dominant convention: 636 rollback tags exist locally and only 8 have ever been
pushed. It is fully effective locally, which is where a rollback would be performed.

---

## RESUME VERIFICATION — 2026-07-19 (post-interruption)

The session was interrupted after the work above completed. On resume, the repository was
re-inspected **before** any action was taken, to establish how far the workflow had actually
progressed. Every step was already complete:

| Step | Finding on resume |
|---|---|
| Rollback created | ✅ `rollback/GIT1-current-work-commit-and-push-20260719` → `6b93a752` |
| Report created | ✅ This document |
| Commits created | ✅ `12630697`, `8e2252be`, `703c9a31` — contents verified by `git show --stat` |
| Commits pushed | ✅ |
| Remote up to date | ✅ `HEAD` = `origin/int1-intelligence-platform` = `703c9a31`; `git rev-list --left-right --count` → `0 0` **after a real `git fetch`** |

**No commit was recreated, duplicated, amended or rewritten.** No reset, stash, discard,
force-push or merge was performed at any point in the resumed session.

### Residual files committed on resume

Two paths appeared in the working tree *after* commit `703c9a31`, both written by the
Engineering Session Recovery hook rather than by GIT1:

| Path | State | Decision |
|---|---|---|
| `.engineering/session/CURRENT.md` | Modified — heartbeat line only (`00:47:12Z` → `00:54:40Z`) | Committed. The file is tracked; leaving it dirty makes every future `git status` misreport |
| `.engineering/session/runs/NUTPLAN1_Household_Nutrition_Intelligence.md` | Untracked | Committed. Run files are tracked by convention (**154** already in the repository), and this one carries the **live rollback ID and "Next action" of the still-incomplete NUTPLAN1 session** — precisely the state the recovery protocol exists to preserve |

Both were **secret-scanned** (same pattern set as the main scan: OpenAI, Stripe, GitHub, AWS,
Google, Slack, PEM blocks, credentialled connection strings) — **zero matches**. Both are
small UTF-8 markdown; no binary, no cache, no machine artefact.

**Validation was not re-run on resume, and this is a deliberate, stated narrowing.** The
resume commit touches two markdown files under `.engineering/` and this report — no
TypeScript, no schema, no `package.json`, no build input. Re-running `npm run build` or
`typecheck:ci` would exercise nothing the commit changes, and re-reporting their earlier
results as fresh coverage would be dishonest. The validation of record for the *code* remains
the run in *Validation Results* above, **including its three unfixed pre-existing failures**,
which remain open and are not represented as resolved.

### Resume commit and push confirmation

| # | SHA | Commit | Contents |
|---|---|---|---|
| 4 | `35bbf89b` | GIT1 — commit residual session-recovery state and record resume verification | 3 files: `CURRENT.md` heartbeat, NUTPLAN1 run file, this report |
| 5 | *(this SHA-recording update)* | GIT1 — record resume SHA | This table |

```
703c9a31..35bbf89b  int1-intelligence-platform -> int1-intelligence-platform
```

Verified independently against the remote, not from the push command's output:

```
git ls-remote origin refs/heads/int1-intelligence-platform
  35bbf89bd5a7aed4177edb6d2398432352b26912
git rev-parse HEAD
  35bbf89bd5a7aed4177edb6d2398432352b26912
git rev-list --left-right --count HEAD...origin/int1-intelligence-platform
  0	0
```

Fast-forward. No force, no history rewrite.

**Final `git status` after commit 4: completely clean** — 0 modified, 0 untracked, 0 staged.

**Remaining uncommitted files: none.** The one file expected to go dirty again on its own is
`.engineering/session/CURRENT.md`, whose heartbeat line the ESR Stop hook rewrites on every
session tick. That is hook output, not unpublished work.

**GitHub now contains the latest verified THA work** on `int1-intelligence-platform`.

### Note on this document

An earlier save left the footer duplicated. Corrected on resume; no other content was altered.
Commit 5 records commit 4's SHA and is itself the final commit — the chain stops here rather
than recursing.

---

*Implementation report. Owner: Colin Clapson. Written 2026-07-19. Resume verification appended 2026-07-19.*
