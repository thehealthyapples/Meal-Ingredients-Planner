# REL2 — Deployment Configuration Convergence — Implementation

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** Changes deployment configuration and the release gate chain. No application code, no runtime behaviour, and no schema is touched — but the file edited is the one that describes how the workspace runs, and the block removed from it *looked* load-bearing for years while being provably dead.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/rel2-20260711` → `c04e6528` |
| Working tree | **Intentionally dirty.** The tag does NOT cover concurrent, unrelated work in the tree: `docs/product/`, the `PDA1` audit files, `scripts/build-product-inventory.ts`, `scripts/build-registry-nav.ts`, `scripts/capture-product-screenshots.ts`, `scripts/verify-product-inventory.ts`, and `.engineering/session/*`. **None of these are REL2's, and none are in REL2's commit.** |
| This task's writes | `.replit`, `package.json`, `RELEASE.md`, `scripts/ci/verify-deployment-config.ts`, `docs/implementation/platform/REL1_RELEASE_PACKAGING.md`, this file |
| Rollback to committed state | `git checkout rollback/rel2-20260711` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [x] `RELEASE.md` (the release runbook, and now the canonical owner of deployment configuration)
- [x] `docs/implementation/platform/REL1_RELEASE_PACKAGING.md` (the blockers REL2 inherits)

---

## THE PROBLEM

REL1 proved the repository contains everything production **loads**. It could not prove the repository contains what decides how production **runs** — and while it was proving the first thing, it got the second thing wrong, in writing, from a file nobody was checking.

Two defects, one file, the same root cause: **`.replit` was never verified against anything.**

**1. `.replit` was modified and uncommitted, for days.** `exposeLocalhost = true` had appeared on the port-5599 mapping, added by workspace tooling. The configuration on disk was therefore not the configuration in the repository, and nothing anywhere checked. TRUST1 found it by reading `git status` by hand. REL1 raised it as Blocker 3 and could not close it, because REL1 had not authored it and did not know why it was there.

**2. `.replit` declared a deployment target THA has never released from.** The file carried:

```toml
[deployment]
deploymentTarget = "autoscale"
run = ["node", "./dist/index.cjs"]
build = ["npm", "run", "build"]
```

THA does not deploy from Replit. Production is GitHub → Render, auto-deploying on push to `main` — a fact `RELEASE.md:168` has stated in a committed line all along. Nothing ever released from that block.

**But a dead deployment declaration does not sit quietly. It gets believed.** REL1 read it and diagnosed its ephemeral-uploads blocker against *Replit autoscale* — the wrong platform. That is the cost, and it is not hypothetical: a rival source of truth for "where does this deploy" produced a confidently-wrong conclusion in a governing implementation report, written by someone who was being careful.

Neither defect is visible to typecheck, to the test suite, or to the build. **None of them reads `.replit`, and none of them asks git whether the config on disk is the config that is committed.**

---

## WHAT WAS DECIDED

Three decisions, all approved before implementation.

**1. Remove the `[deployment]` block.** It is dead configuration and an active source of error. It is replaced by a comment in `.replit` explaining *why the absence is deliberate*, so that the next person to notice a missing deployment block does not helpfully restore it.

**2. Do NOT create a `render.yaml`.** This was the tempting fix and it is the wrong one. A Render service created from the dashboard — as THA's was — **ignores** a `render.yaml`. Committing one would produce a file that looks authoritative, that Render never reads, and that drifts silently from the real configuration. That is strictly worse than the honest gap: it is a second owner of a fact, forbidden by *one owner per fact*, and it would fabricate exactly the reassurance a reader is looking for. **REL2 refuses to invent configuration it cannot verify.**

**3. Record the Render Dashboard as the current production source of truth, and report it as a governance gap.** The build command, start command, environment variables, health check and instance settings live in a web UI, outside version control, unreadable by anything in this repository. That is a real, open blocker. It is named as one (**Blocker A**, below), stated in `RELEASE.md`, and printed by the gate **on every run, pass or fail**, so that a green gate can never be mistaken for a verified deployment.

---

## IMPLEMENTATION

### Files changed (6)

| File | Change |
|---|---|
| `.replit` | **Removed** the `[deployment]` block. **Reverted** `exposeLocalhost = true` (port 5599). Added a comment explaining why no `[deployment]` block exists. |
| `scripts/ci/verify-deployment-config.ts` | **NEW.** Six-check deployment configuration gate. |
| `package.json` | Added `verify:deployment-config`; prepended it to `release:check`, ahead of typecheck/test/build. |
| `RELEASE.md` | **NEW § Deployment Configuration** — the canonical owner of where THA deploys. New **Step 0** (deployment gate) ahead of the existing packaging gate, now Step 0b. |
| `docs/implementation/platform/REL1_RELEASE_PACKAGING.md` | Corrected Blocker 2 (wrong platform named); closed Blocker 3. |
| `docs/implementation/platform/REL2_DEPLOYMENT_CONFIGURATION_CONVERGENCE.md` | **NEW.** This report. |

### The `exposeLocalhost` revert — reverted, not committed

The flag was **reverted rather than committed**, on evidence, not on preference:

| Question | Command | Answer |
|---|---|---|
| Does anything in THA bind port 5599? | `grep -rn 5599 server/ shared/ script/ scripts/ vite.config.ts` | **No.** The server binds only `0.0.0.0:5000` (`server/index.ts:166-169`); Vite runs in middleware mode. |
| Has the flag ever been committed? | `git log --all -S exposeLocalhost -- .replit` | **Never.** It appears in no commit in the file's history. |
| What would it do? | — | Publish a service that deliberately bound to localhost. |

A flag that exposes a localhost-bound service is a **security decision**. It may not arrive as a tooling artefact, and it may not be committed by someone who does not know why it is there. It is gone, and check 3 of the gate fails the release if it returns.

### The gate — `npm run verify:deployment-config`

It asks one question mechanically: **is the deployment configuration the one in the repository?** Six checks:

1. **Deployment config is committed** — `.replit` is tracked *and* has no uncommitted modifications. This is the check that would have caught Blocker 3 on the day it appeared, and it catches the next silent tooling edit without anyone remembering to read `git status`.
2. **No rival deployment target** — no `[deployment]` block. Comments are stripped before matching, so the explanatory comment in `.replit` cannot itself trip the check.
3. **No silent localhost exposure** — no `exposeLocalhost` on any `[[ports]]` entry. Resolves the flag to its *own* port block rather than pairing the first `localPort` in the file with a flag several blocks later — the gate must not itself produce confidently-wrong evidence.
4. **The served port is declared once** — `.replit`'s `[env] PORT` matches `server/index.ts`'s own fallback. Two disagreeing port declarations mean one is a lie.
5. **Declared hooks resolve** — `[postMerge] path` names a file that exists *and* is tracked. A hook pointing at a file absent from a clean checkout silently does nothing.
6. **The start command matches the build output** — `npm start` runs the artefact `script/build.ts` actually emits (`dist/index.cjs`). Render runs `npm start`; if these drift, the deploy boots nothing.

It touches no database, needs no `DATABASE_URL`, contacts no deployment provider, and writes nothing. It reads files and asks git.

**What it cannot do — printed on every run:** it cannot verify Render. That limitation is emitted as a NOTE whether the gate passes or fails, precisely so a PASS is never read as "the deployment is verified." A PASS means *THA's own configuration is committed, coherent, and singular.* It does not mean Render agrees with it, because nothing in this repository can know what Render thinks.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

□ One canonical identity                                                    ✅
  No entity is touched. REL2 adds no key space, renames nothing, and reads no
  entity. It is release engineering over configuration files.

□ One owner per fact                                                        ✅
  This is the whole point of REL2. The fact "where does THA deploy" had TWO
  declared owners: RELEASE.md (Render) and .replit's [deployment] block (Replit
  autoscale). They disagreed, and the wrong one was believed. REL2 leaves exactly
  one owner — RELEASE.md § Deployment Configuration — and a gate that fails the
  release if a second one reappears. The refusal to write render.yaml is the same
  rule applied a second time: an unverifiable file that Render never reads would
  be a second owner of Render's own configuration.

□ No duplicate entities                                                     ✅
  Nothing new is created. One config block is removed; one gate is added, in the
  established scripts/ci/ pattern.

□ No duplicate ownership                                                    ✅
  The deployment gate verifies the repository's configuration. It does NOT verify
  the release package (verify-release-packaging.ts owns that) and does NOT verify
  the database (verify-prod.ts owns that). Three questions, three owners, no
  overlap.

□ No duplicate state                                                        ✅
  No user state is touched. No state of any kind is written.

□ Extends existing architecture                                             ✅
  Follows the established CI-gate pattern in scripts/ci/ (typecheck-gate.ts,
  verify-release-packaging.ts, verify-schema-migration-coverage.ts): reads files,
  asks one honest question, prints PASS/FAIL, exits non-zero. Wired into the
  existing `release:check` chain rather than creating a rival release surface.

□ Progressive enrichment where appropriate                                  ✅
  N/A — neither a knowledge entity nor transactional state.

□ Knowledge domain compliance                                               ✅
  N/A — introduces and extends no knowledge domain. REL2 changes how the
  repository is deployed, not what THA knows.

□ Honest gaps over fabricated information                                   ✅
  The load-bearing check of this implementation. REL2 could have written a
  plausible render.yaml and closed the gap on paper. It did not. The gap is named
  as Blocker A, stated in RELEASE.md, and printed by the gate on EVERY run — pass
  or fail — so a green gate cannot be mistaken for a verified deployment.

□ No permanent synchronisation bridge                                       ✅
  None. Explicitly refused: a render.yaml would have required keeping a committed
  file in sync with a dashboard nobody can read from CI. That is the bridge this
  implementation declined to build.

□ Evolution over replacement                                                ✅
  .replit's [deployment] block is retired, not replaced — it is named, its removal
  is justified in the file itself, and the gate prevents its silent return.
  RELEASE.md is extended, not superseded.
```

**EXPERIENCE & UI GOVERNANCE COMPLIANCE:** N/A — REL2 ships no user-facing surface. No route, page, dialog, component, or copy changes. No application file is touched at all.

**PRODUCT REGISTRY COMPLIANCE / IMPACT:** Registry affected: **NO.** The test is *"would a person's answer to 'what is THA?' be different after this change?"* It would not — REL2 changes how the repository deploys, not what the product is or does. Entries created/updated/retired: NONE. No product knowledge is written into any prompt, template, fallback string, or capability code (Rule PKR27).

**AI ARCHITECTURE COMPLIANCE:** N/A — no AI surface touched.

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: NONE (release engineering — deployment configuration)
Declared SoT: RELEASE.md § Deployment Configuration (where THA deploys)
New store created? NO
Existing store extended? NO
Consumer created? NO
```

No schema change. No migration. No database read or write. The gate requires no `DATABASE_URL`.

---

## VALIDATION PERFORMED

Every claim below is backed by a command that actually ran.

| Check | Command | Outcome |
|---|---|---|
| Gate **catches** both real defects | `npx tsx scripts/ci/verify-deployment-config.ts` (before the fix) | **FAIL, exit 1** — 4 passed, 2 failed. It independently reproduced *both* known defects: `.replit` uncommitted (REL1 Blocker 3) **and** `exposeLocalhost` on port 5599, naming the correct port. |
| Gate **passes** after the fix | `npx tsx scripts/ci/verify-deployment-config.ts` (after revert + commit) | **PASS** — 6 passed, 0 failed. *"the repository's deployment configuration is committed, coherent, and singular."* |
| The uncommitted-config check is real, not decorative | Same script, run while `.replit` was staged but uncommitted | **FAIL** — check 1 correctly refused a staged-but-uncommitted `.replit`. It only went green once the config was genuinely in a commit. This is the check working, not a bug. |
| Port 5599 is bound by nothing | `grep -rn 5599 server/ shared/ script/ scripts/ vite.config.ts` | **No hits.** Server binds `0.0.0.0:5000` only. |
| `exposeLocalhost` was never sanctioned | `git log --all -S exposeLocalhost -- .replit` | **No commits.** It has never existed in the file's committed history. |
| `render.yaml` genuinely absent | `ls render.yaml` | **Absent** — confirming the gap the gate reports is real and not a stale note. |
| No new type errors | `npm run typecheck:ci` | **PASS** — baseline 175, current 175. Known debt unchanged; nothing added. |
| No regression in the sibling gate | `npm run verify:release-packaging` | **PASS** — 5 passed, 0 failed. REL1's guarantee still holds. |

**The full test suite (`npm run test`) was NOT run.** REL2 changes **zero application files** — the diff is one TOML config, one `package.json` script entry, one new CI script, and documentation. No test in the suite reads `.replit` or exercises anything REL2 touched. `npm run release:check` runs the full suite and now runs this gate ahead of it.

**No deployment was performed.** REL2 did not deploy, and could not have: it holds no Render credentials and adds no deploy path.

---

## DATA IMPACT

- Reads existing data: **NO** (the gate reads files and asks git)
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## TRUST CHECK

- **Could this mislead the user?** No — REL2 has no user surface. Its whole purpose is to *stop* the repository misleading its own engineers, which is what the dead `[deployment]` block did to REL1.
- **Could this fabricate certainty?** This was the live risk, and it is the one REL2 was most careful about. A `render.yaml` would have manufactured exactly that certainty. It was refused. The gate goes further and states its own blind spot on every run, so its PASS cannot be over-read.
- **Is anything guessed but shown as real?** No. Every claim in `RELEASE.md § Deployment Configuration` is either verifiable in the repository (`build`, `start`, `PORT`, `dist/index.cjs`) or explicitly marked as living in the Render dashboard and **not** verifiable from here. The Render target itself is not invented: `RELEASE.md:168` has declared it in a committed line all along.
- **What happens if the system is wrong?** If the gate is wrong about `.replit`, the release stops and a human reads a diff — a safe failure. If **Render's dashboard** disagrees with `RELEASE.md`, the gate cannot tell, and it says so on every run. That is Blocker A, open and named.
- No architectural duplication introduced: **YES (none introduced — one was removed)**
- No new source of truth created: **YES** — `RELEASE.md` is *named* as the single existing owner; a rival was deleted.
- No runtime behaviour altered: **YES** — no application file is touched.
- Every "verified" claim backed by a command that ran: **YES** (table above)

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/rel2-20260711` → `c04e6528`
- **Files modified:** `.replit`, `package.json`, `RELEASE.md`, `scripts/ci/verify-deployment-config.ts`, `docs/implementation/platform/REL1_RELEASE_PACKAGING.md`, this file
- **Rollback command:** `git checkout rollback/rel2-20260711`
- **Verification after rollback:** `npm run typecheck:ci` (expect 175/175). Note that rolling back **restores the misleading `[deployment]` block** and removes the gate — it does not restore `exposeLocalhost`, which was never committed by anyone.

---

## SCOPE LOCK

- **Implemented scope:** Deployment configuration convergence — one declared deployment target, `.replit` committed and clean, a mechanical gate wired into `release:check`, and the Render dashboard gap stated honestly in `RELEASE.md`.
- **Explicitly excluded scope:**
  - **No deployment.** Nothing was deployed and no deploy path was added.
  - **No `render.yaml`.** Deliberate — see *What Was Decided*.
  - **No application behaviour change.** Zero application files touched.
  - **No object storage.** The ephemeral-`uploads/` blocker is corrected but not fixed (Blocker B).
  - **No change to Cookbook or Development World.**

SUGGESTION *(out of scope — do not implement without approval)*: the Render dashboard settings could be transcribed into `RELEASE.md` by a human with dashboard access, converting Blocker A from *unknown* to *reviewable* at zero risk. That is a read-and-write-down task, not an engineering change, and it needs someone with credentials.

---

## REMAINING DEPLOYMENT BLOCKERS

### 🟠 BLOCKER A — Render's service configuration is not in version control *(NEW — raised by REL2)*

**Production's deployment configuration is not reproducible from the repository.** The build command, start command, environment variables, health check, and instance settings live in the **Render dashboard**. There is no `render.yaml`, and REL2 deliberately did not invent one (a dashboard-created Render service ignores it, so it would be a second owner that Render never reads).

This is a **governance gap, not a code defect**: the Render Dashboard is, today, the real source of truth for how THA runs in production, and it is a web UI that no gate, test, or reviewer can see. Nothing in the repository can verify that `RELEASE.md § Deployment Configuration` matches reality.

**To close it,** a human with dashboard access must either (a) adopt a Render Blueprint deliberately, migrating the service so `render.yaml` is genuinely authoritative, or (b) transcribe the live settings into `RELEASE.md`, where they can at least be reviewed and drift becomes visible. Option (b) is cheap, safe, and available today.

**Until then, the gate prints this limitation on every run.** A green deployment gate does not mean the deployment is verified.

### 🟠 BLOCKER B — `uploads/` is ephemeral on the deploy target *(inherited from REL1, corrected by REL2)*

`server/lib/media-storage.ts:24-26` resolves meal photos to `process.cwd()/uploads/meal-photos`. **The blocker is real; REL1's stated platform was not.** REL1 named Replit autoscale, having believed the dead `[deployment]` block. Production is Render.

**The conclusion survives the correction:** a Render web service's filesystem is likewise rebuilt on every deploy and is not shared between instances, so uploaded meal photos are still lost on redeploy while `/uploads/meal-photos/...` URLs persist in the database pointing at them. Only the evidence changes — and it changes to a platform whose disk semantics must be **confirmed in the Render dashboard**, not inferred from this repository (see Blocker A; the two are linked).

This needs **object storage**. It is a media-storage behaviour change, explicitly out of REL2's scope, and it remains a genuine data-loss blocker for any release that lets households upload photos.

### ✅ CLOSED — REL1 Blocker 3 (`.replit` modified and uncommitted)

Closed by REL2. The uncommitted change was `exposeLocalhost = true`, reverted on evidence (never committed, binds nothing, exposes a localhost-bound service). `.replit` is now committed and clean, and check 1 of the gate fails the release if it ever drifts again.

### ✅ CLOSED — REL1 Blocker 1 (cookbook production seeding)

Closed by `CBK1` (`c04e6528`), not by REL2. Noted here only so this list is complete.

---

## OUTCOME

**THA now declares exactly one deployment target, and a machine checks that it stays that way.**

Before REL2, the repository contained two rival answers to "where does this deploy" — `RELEASE.md` said Render, `.replit` said Replit autoscale — and the wrong one was believed by a governing implementation report, in writing. The deployment configuration on disk was not the configuration in the repository, and had not been for days. Nothing was checking, because nothing *could*: no typecheck, test, or build reads `.replit` or asks git whether the config that deploys is the config that is committed.

That is now a gate, and it runs ahead of everything else in `release:check`. `RELEASE.md § Deployment Configuration` is the single owner of the fact. The dead block is gone, and `.replit` explains why its own absence is deliberate, so the next person to notice does not restore it.

What REL2 did **not** do is the part worth stating plainly: **it did not close the gap it could not honestly close.** Render's real configuration still lives in a dashboard, outside version control, invisible to every check in this repository. REL2 could have written a confident-looking `render.yaml` and turned that blocker green. It would have been a lie with a filename — a second owner of Render's configuration that Render itself never reads. Instead the gap is named, written into the release runbook, and printed by the gate on every single run, pass or fail.

**REL2 is complete as scoped.** Deployment configuration is now honest and, to the boundary of the repository, reproducible. Two deployment blockers remain open (A and B), both requiring decisions REL2 was correctly not permitted to make.

---

## NEXT STEPS

1. **Blocker A** — a human with Render dashboard access records the live settings in `RELEASE.md`, or adopts a Blueprint deliberately. Cheap, safe, unblocks review of the deployment.
2. **Blocker B** — object storage for meal photos. A media-storage behaviour change; needs its own workstream and approval. Confirm Render's disk semantics in the dashboard while doing Blocker A.
3. Nothing is awaiting deployment approval from REL2, because **REL2 deploys nothing.**

**Commit status:** REL2's six files are committed. Unrelated concurrent work (`docs/product/`, `PDA1`, product-inventory scripts, `.engineering/session/*`) remains **uncommitted in the working tree and is deliberately not part of REL2's commit.** The branch is unpushed.
