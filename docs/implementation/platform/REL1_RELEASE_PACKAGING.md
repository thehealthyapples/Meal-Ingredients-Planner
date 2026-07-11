# REL1 — Release Packaging — Implementation

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** Adds 135 files (11.8 MB) to version control and one runtime error path; changes no application logic, no schema, and no user-facing behaviour. AMBER rather than GREEN because it changes what a deploy contains.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/REL1-release-packaging-20260711` → `c79b21dd60e28ee04d772338c4e3d833ceaa464c` |
| Working tree | **Intentionally dirty** — see below |
| This task's writes | `data/cookbook/` (27 files), `data/development_world/` (108 files), `scripts/ci/verify-release-packaging.ts`, `package.json`, `RELEASE.md`, `server/development-world/world-reader.ts`, this document |
| Rollback to committed state | `git checkout rollback/REL1-release-packaging-20260711` |

**What the tag does NOT cover.** The tree was dirty when the tag was cut, and a tag protects
committed state only. At tag time these were uncommitted and are **not** captured by it:

- `M .engineering/session/CURRENT.md`, `M .engineering/session/INDEX.md`, `M .replit`
- `?? docs/product/`, `?? docs/investigations/ux/PDA1_*.md` (×2),
  `?? docs/implementation/platform/TRUST1_SOFT_LAUNCH_PRODUCTION_DEPLOYMENT.md`
- `?? scripts/build-product-inventory.ts`, `build-registry-nav.ts`,
  `capture-product-screenshots.ts`, `verify-product-inventory.ts`

**None of it was authored by REL1 and none of it was touched or committed by REL1.** It belongs to
PDA1/PKR and TRUST1 and remains uncommitted, exactly as found. Rolling back to the tag will not
restore it, because it was never in a commit; it will still be sitting in the working tree.

Two things were **deleted**, both snapshotted to the session scratchpad first
(`pre-delete-snapshot/`):

- `./~/` — a stray directory containing two empty files (`.bashrc`, `.zshrc`), created by a
  mis-quoted shell command. Untracked, referenced by nothing.
- `data/cookbook/tha_original_founding_cookbook_500/.DS_Store` — macOS cruft, already matched by
  the `.DS_Store` rule in `.gitignore`, so it was never going to be committed anyway.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md` (§2 folder ownership; the root's permitted categories)
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`
- [x] `.engineering/templates/IMPLEMENTATION_TEMPLATE.md`
- [x] `RELEASE.md` (the release process this work extends)
- [x] `docs/implementation/platform/TRUST1_SOFT_LAUNCH_PRODUCTION_DEPLOYMENT.md` (Blocker 2 — the finding REL1 resolves)

---

## THE PROBLEM

TRUST1's soft-launch audit raised **Blocker 2: "Untracked data is load-bearing at runtime. The
deploy would ship broken features."** REL1 is the resolution of that blocker.

`data/development_world/` and `data/cookbook/` were untracked. They were in no commit, so they
would be in no deploy. Meanwhile `server/development-world/world-reader.ts` read the first of them
at runtime — not from a build script, not from an importer, but from `server/` — and the comment
on line 145 described the file it was reading as:

> `// Parsed-once cache (module scope) — the dataset is a committed, immutable file.`

It was not committed. It had never been committed. The code was three commits old and the
assumption in that comment had been false for every one of them.

**This is the defect class that no existing gate could see.** `npm run typecheck` passed. The test
suite passed. `npm run build` passed. All of them run against a working tree that still has the
files sitting on disk. Only git knew the files were not in the repository, and nothing was asking
git. The feature would have failed for the first person to run a clean checkout — which, on a
deploy, is everybody.

---

## RUNTIME ASSETS DISCOVERED

A full sweep of every filesystem read reachable from `server/index.ts`, plus every asset directory
in the tree. Six non-source files are loaded by the platform:

| Asset | Loaded by | Stage | Was it tracked? |
|---|---|---|---|
| `eng.traineddata` (5.2 MB) | `tesseract.js` via `server/services/ocr.ts` | **PRODUCTION** — resolved from the working directory at runtime | ✅ already tracked |
| `server/data/canonical-map.json` | `server/lib/item-resolver.ts` | **BUILD** — inlined into `dist/index.cjs` by esbuild's JSON loader; no runtime read | ✅ already tracked |
| `server/data/ambiguity-map.json` | `server/lib/item-resolver.ts` | **BUILD** — inlined into `dist/index.cjs`; no runtime read | ✅ already tracked |
| `data/development_world/development_world_foundation_50.v1.json` | `server/development-world/world-reader.ts` | **DEV ONLY** — production refuses via `assertDevelopmentWorldAllowed()` | ❌ **UNTRACKED** |
| `data/development_world/manifests/validation_manifest.json` | `server/development-world/world-reader.ts` | **DEV ONLY** | ❌ **UNTRACKED** |
| `data/cookbook/…/tha_original_founding_cookbook_500.json` | `scripts/import-tha-founding-cookbook-500.ts` | **SEED SOURCE** — imported into the `meals` table; never read at runtime | ❌ **UNTRACKED** |

**`eng.traineddata` is the only file production reads from the filesystem at runtime** other than
its own build output (`dist/`). Everything else production needs is either compiled into
`dist/index.cjs` at build time or lives in the database.

Also confirmed tracked and requiring no action: `attached_assets/` (281 files — Vite resolves two
of them into the client bundle at build time), `client/public/` (10 files), `migrations/` (6),
`server/migrations/runner.ts`. `client/` and `shared/` perform **zero** filesystem access.

### The one that mattered

Only **one** server runtime module reads repo-root `data/` at all: `world-reader.ts`. Its two
entry points (`GET /api/admin/development-world` and `/:id`) each call
`assertDevelopmentWorldAllowed()` *before* any load, and the module is dynamically imported, so
nothing touches the filesystem at boot. **Production was protected by that guard, and only by that
guard.** The blast radius of the untracked data was therefore the DEV and staging experience — and
any `NODE_ENV != production` deploy, where the route would have returned a bare `ENOENT` 500 — not
production itself. That is luck, not design, and it is the kind of luck that expires.

---

## WHAT WAS DECIDED

The mission posed the question as a fork: version-control the runtime assets, or remove the runtime
dependency on local files. The honest answer for THA is **the first for both directories, because
neither is a production runtime asset in the first place.**

- **`data/development_world/` → committed (108 files, 7.9 MB).** It is a *development-only* asset,
  and the correct place for a development asset that development code loads is version control. The
  alternative — moving 50 synthetic households to object storage — would add a network dependency
  and a bucket to maintain, to serve a fixture set that is read exclusively by a DEV-only admin
  page. That is not a canonical loading mechanism; it is a way to make a dev tool fragile. It is
  never read in production, so it imposes no production dependency.

- **`data/cookbook/` → committed (27 files, 3.7 MB).** It is a *seed source*, not a runtime asset —
  the distinction that matters most in this whole workstream. The 500 founding recipes reach
  production as **rows in the `meals` table**, never as files. Committing the JSON does not put it
  on a production code path; it makes the database reproducible from the repository, which is the
  entire point of a release package.

Neither directory enters `dist/`. The production artefact is unchanged by REL1 — verified: after
`npm run build`, `dist/` contains `index.cjs` and `public/` and **no `data/` directory at all**.

Screened before committing: no credentials, no API keys, no private keys, and no real personal
data. Every Development World identity is synthetic and lives on the reserved
`dev.thehealthyapples.dev` domain.

---

## IMPLEMENTATION

**Committed (135 files, 11,838,308 bytes):**

- `data/cookbook/tha_original_founding_cookbook_500/` — 27 files
- `data/development_world/` — 108 files

**Created:**

- `scripts/ci/verify-release-packaging.ts` — the release packaging gate (below)
- `docs/implementation/platform/REL1_RELEASE_PACKAGING.md` — this document

**Modified:**

- `package.json` — added `verify:release-packaging`; **prepended it to `release:check`**, so it now
  runs *first*, before typecheck, tests and build. A packaging failure should stop a release before
  anything expensive runs.
- `RELEASE.md` — added **The Release Package** (the canonical definition of what THA ships and what
  is intentionally excluded) and **Step 0 — Release packaging gate** to the Release Checklist.
- `server/development-world/world-reader.ts` — `loadWorld()` now checks `existsSync` and throws a
  named, actionable error instead of a bare `ENOENT`; the "committed, immutable file" comment is now
  true and says when it became true.

**Deleted:** `./~/` (stray, empty, untracked), one `.DS_Store` (already gitignored).

### The gate

`npm run verify:release-packaging` asks the one question no other check was asking: **can
production be reproduced from a clean checkout?** It touches no database, needs no `DATABASE_URL`,
writes nothing, and exits 1 on any failure. Five checks:

1. **Declared runtime assets are tracked** — every asset in the manifest exists on disk *and* is
   tracked by git. The manifest is the reviewed list of non-source files the platform loads.
2. **No untracked files in asset directories** — nothing under `data/`, `server/data/`,
   `attached_assets/` or `client/public/` may be uncommitted. *This is the check that would have
   caught the defect on the day it was introduced*, and it catches the **next** dataset somebody
   forgets to commit without anyone having to remember to update a manifest.
3. **Server `data/` references resolve to tracked files** — every quoted `../data/…` literal in
   server runtime source is resolved relative to its own file and must land on a tracked path.
4. **Repo-root `data/` is never read by unguarded production code** — `data/` is a dev and
   seed-source tree that the release package does not ship, so any server runtime file reaching into
   it must refuse to run in production. Today exactly one does, and it is guarded. If a second
   appears without a guard, the gate fails.
5. **Build artefact completeness** — when `dist/` exists it contains `index.cjs` and
   `public/index.html`. Skipped, not failed, when `dist/` is absent.

It deliberately does **not** verify the database is seeded. That is `scripts/verify-prod.ts`, which
owns schema-and-data verification against a live production DB. REL1 names that boundary rather
than blurring it — a repository can pass this gate and still serve an empty Cookbook, and the
Remaining Blockers section below says so plainly.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

□ One canonical identity                                                    ✅
  No entity is touched. Development World households keep their existing DW### key
  space and their deterministic owner usernames; the founding cookbook keeps its
  `tha_original:THA-###` import key. REL1 adds no key space and renames nothing.

□ One owner per fact                                                        ✅
  No fact gains a store. The release-package definition gets exactly one owner —
  RELEASE.md ("The Release Package") — and the gate enforces it mechanically. This
  document cites that definition and does not restate it.

□ No duplicate entities                                                     ✅
  Nothing new is created. Files that already existed on disk are placed under
  version control at the same paths, in their canonical `data/` location.

□ No duplicate ownership                                                    ✅
  The packaging gate does not verify the database — verify-prod.ts owns that, and
  is not duplicated or extended here. Repository/artefact completeness and
  production DB state are two questions with two owners.

□ No duplicate state                                                        ✅
  No user state exists in either dataset. Development World is synthetic fixtures;
  the cookbook is authored recipe source. Neither is user data.

□ Extends existing architecture                                             ✅
  Follows the established CI-gate pattern in scripts/ci/ (typecheck-gate.ts,
  verify-schema-migration-coverage.ts, verify-branch-protection.ts): reads files,
  asks a single honest question, prints PASS/FAIL, exits non-zero. Wired into the
  existing `release:check` chain rather than creating a rival release surface.

□ Progressive enrichment where appropriate                                  ✅
  N/A — this is neither a knowledge entity nor transactional state. It is
  release engineering.

□ Knowledge domain compliance                                               ✅
  N/A — introduces and extends no knowledge domain. REL1 changes how the repository
  is packaged, not what THA knows.

□ Honest gaps over fabricated information                                   ✅
  The gate reports what it does not check (the database) rather than implying
  coverage. The Cookbook production-seeding gap is reported as an open blocker, not
  quietly closed. loadWorld() now names a missing dataset instead of throwing ENOENT.

□ No permanent synchronisation bridge                                       ✅
  None. Nothing is kept in sync with anything.

□ Evolution over replacement                                                ✅
  Nothing is replaced. RELEASE.md is extended; no store is retired.
```

**EXPERIENCE & UI GOVERNANCE COMPLIANCE:** N/A — REL1 ships no user-facing surface. No route, page,
dialog, component, or copy changes. The only application file touched is a DEV-only admin reader's
error message.

**PRODUCT REGISTRY COMPLIANCE / IMPACT:** Registry affected: **NO.** The test is *"would a person's
answer to 'what is THA?' be different after this change?"* It would not — REL1 changes what the
repository contains, not what the product is or does. Entries created/updated/retired: NONE. No
product knowledge is written into any prompt, template, fallback string, or capability code.

**AI ARCHITECTURE COMPLIANCE:** N/A — no AI surface touched.

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: NONE (release engineering — repository packaging)
Declared SoT: RELEASE.md § The Release Package (release package definition)
New store created? NO
Existing store extended? NO
Consumer created? NO
```

No schema change. No migration. No database read or write by anything REL1 added. The gate itself
touches no database and requires no `DATABASE_URL`.

---

## VALIDATION PERFORMED

Every claim below is backed by a command that actually ran.

| Check | Command | Outcome |
|---|---|---|
| Gate **catches** the defect | `npm run verify:release-packaging` (before committing the data) | **FAIL, exit 1** — 3 of 5 checks failed, naming all 135 untracked files and the `world-reader.ts → ../../data/development_world` reference that resolved to nothing. The gate reproduces TRUST1 Blocker 2 mechanically. |
| Gate **passes** after the fix | `npm run verify:release-packaging` (after staging) | **PASS** — 5 passed, 0 failed. *"production is reproducible from a clean checkout."* |
| No new type errors | `npm run typecheck:ci` | **PASS** — baseline 175, current 175. Known debt unchanged; nothing added. |
| Production build | `npm run build` | **PASS** — `dist/index.cjs` (3.7 MB) + `dist/public/`. **`dist/` contains no `data/` directory**, confirming the datasets stay out of the artefact. |
| Runtime file loading actually works | Drove the **real** `server/development-world/index.js` module (not a replica) via `tsx`, `NODE_ENV=development` | **PASS** — `listDevelopmentWorldHouseholdStates()` → 50 households; version `1.0.0`; validation manifest `valid: true`, 0 violations, 50 households, 328 recipe refs; `getDevelopmentWorldHouseholdDetail("DW001")` → "Foster Family (Dev)", 4 eaters, 15 pantry items. This is the exact code path `GET /api/admin/development-world` executes. |
| Production guard still refuses | `NODE_ENV=production` against the `developmentWorldAllowed()` predicate | **PASS** — returns `false`; `assertDevelopmentWorldAllowed()` throws. Production cannot read the dev dataset. |
| Datasets safe to commit | Credential/PII screen across all 135 files | **PASS** — no passwords, keys, tokens or private keys. All 100 identities synthetic, on the reserved `dev.thehealthyapples.dev` domain. |

**The full test suite (`npm run test`) was NOT run.** It is ~70 suites, many requiring a live
database, and REL1 changes no application logic that any of them exercise — the single runtime edit
is an `existsSync` check in a DEV-only reader's error path, which the live module drive above
covered directly. `npm run release:check` runs the full suite and now runs the packaging gate ahead
of it.

---

## DATA IMPACT

- Reads existing data: **NO** (the gate reads files, not the database)
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## TRUST CHECK

- **Could this mislead the user?** No user-facing surface changes. It *removes* a latent
  misleading state: a comment asserting a file was committed when it was not.
- **Could this fabricate certainty?** The opposite is the point. The gate reports precisely what it
  verifies (repository completeness) and states what it does not (database seeding). A green gate
  does not claim the Cookbook has content — and the blocker below says so.
- **Is anything guessed but shown as real?** No. Every table entry above was verified by a command.
- **What happens if the system is wrong?** If the gate is wrong, it fails a release that would have
  worked — the safe direction. If it were removed, the failure mode returns silently.
- No architectural duplication introduced: **YES** (none)
- No new source of truth created: **YES** — RELEASE.md becomes the single owner of the release-package definition; this report cites it
- No runtime behaviour altered: **Effectively yes.** One change: `loadWorld()` throws a named error
  instead of `ENOENT` when the dataset is missing. Same failure, legible message. Nothing else in
  the application changed.
- Every "verified" claim backed by a command that ran: **YES**

---

## SCOPE LOCK

**Implemented scope:** runtime-asset inventory; committing the two untracked datasets; the release
packaging gate; the canonical release-package definition and its exclusions in `RELEASE.md`; one
error-path fix in the Development World reader.

**Explicitly excluded scope:**

- **No deployment.** Nothing was deployed or pushed.
- **No redesign of Cookbook or Development World.** Neither feature's behaviour, data model, or
  surface was touched.
- **No unrelated behaviour change.** The `?? docs/product/`, `?? PDA1_*`, `?? TRUST1_SOFT_LAUNCH…`
  and four `scripts/*.ts` files uncommitted in the tree belong to other workstreams. They were not
  authored, touched, or committed by REL1, and are **not** in the milestone commit.
- **`uploads/` was not migrated to object storage** — see Blocker 2 below. That is a behaviour
  change to media storage and is not release packaging.
- **No production seeding path was built for the founding cookbook** — see Blocker 1. Building one
  means changing the Cookbook importer's production guard, which is a Cookbook decision.

---

## REMAINING DEPLOYMENT BLOCKERS

REL1 closes TRUST1 Blocker 2. It does not close these, and does not pretend to.

### 🔴 BLOCKER 1 — The founding cookbook has no production seeding path

The 500 THA-authored recipes reach production only as rows in the `meals` table. The only importer,
`scripts/import-tha-founding-cookbook-500.ts`, **refuses to run when `NODE_ENV=production`** (by
deliberate design — it writes system meals). So the source data is now reproducible from the
repository, but there is **no sanctioned mechanism that puts those 500 recipes into a production
database.** A fresh production DB would serve an empty THA library, and the release package cannot
fix that, because the recipes are not a file — they are rows.

This is a Cookbook/seeding decision (a reviewed migration? a guarded one-shot seed command? an
explicit operator step in `RELEASE.md`?), and it needs an owner before Cookbook is released.

### ✅ ~~🟠 BLOCKER 2~~ — CLOSED by `OPS1` (2026-07-11) — `uploads/` is ephemeral on the deploy target

`server/lib/media-storage.ts:24-26` resolves meal photos to `process.cwd()/uploads/meal-photos`.
The deploy target is Replit **autoscale** (`.replit`: `deploymentTarget = "autoscale"`). That disk
is ephemeral and not shared between instances, so uploaded meal photos are **lost on every redeploy
and invisible to other instances**, while `/uploads/meal-photos/...` URLs persist in the database
pointing at them. This needs object storage. It is a media-storage behaviour change, out of REL1's
scope, and it is a genuine data-loss blocker for any release that lets households upload photos.

> **⚠️ CORRECTION — `REL2`, 2026-07-11.** *The blocker is real. The platform named above is not.*
> THA does not deploy to Replit autoscale. Production is **Render** (GitHub auto-deploy on push to
> `main`) — `RELEASE.md` § Deployment Configuration. REL1 read `.replit`'s `[deployment]` block and
> believed it; that block was dead configuration THA had never released from, and `REL2` has removed
> it for exactly this reason. **The conclusion survives the correction:** a Render web service's
> filesystem is likewise rebuilt on every deploy and not shared between instances, so
> `process.cwd()/uploads/meal-photos` is still ephemeral and photos are still lost on redeploy. Only
> the evidence changes — and it changes to a platform whose disk semantics must be confirmed in the
> **Render dashboard**, not inferred from this repository. Fix the storage; do not fix Replit.

> **✅ CLOSED — `OPS1`, 2026-07-11.** The storage was fixed. Meal photos now go to **S3-compatible
> object storage** (Cloudflare R2, approved 2026-07-11), behind the same `saveMediaFile` /
> `deleteMediaFile` interface REL1 read — no route, no client, and no database change. Critically,
> **local disk can no longer be reached in production by inheritance.** An unconfigured production
> deploy resolves to `unavailable` and declines uploads with a 503 rather than writing bytes to a
> disk that is about to be destroyed; a half-configured bucket declines too, rather than falling back.
> Local disk remains a legitimate production choice with a mounted volume — but only when a human
> types it. See `OPS1_PRODUCTION_MEDIA_STORAGE.md`. **The blocker is closed in code; it closes in
> production the moment the `MEDIA_*` variables are set in Render** (`RELEASE.md` § Media storage).

### ~~🟡 BLOCKER 3 — `.replit` is modified and uncommitted~~ — ✅ CLOSED by `REL2`

The deploy configuration itself is dirty in the working tree (`M .replit`) and was not authored by
REL1, so REL1 did not commit it. **The deployed configuration is therefore not the one in the
repository.** Someone who knows why it changed needs to commit it or revert it before a deploy.

> **✅ RESOLVED — `REL2`, 2026-07-11.** The uncommitted change was `exposeLocalhost = true` on the
> port-5599 mapping, added by workspace tooling. Nothing in the repository binds port 5599 (the
> server binds only `0.0.0.0:5000`; Vite runs in middleware mode), the flag had never appeared in
> any commit in the file's history, and its only effect would have been to publish a
> localhost-bound service. It was **reverted, not committed.** REL2 also found and removed the
> larger drift REL1 had not looked for: the `[deployment]` block itself. `.replit` is now committed
> and clean, and `npm run verify:deployment-config` fails the release if it ever drifts again — the
> check that would have caught this on the day it appeared. See
> `docs/implementation/platform/REL2_DEPLOYMENT_CONFIGURATION_CONVERGENCE.md`.

### Not blockers, but noted

- `server/static.ts:19` reads `dist/public/index.html` with an unguarded `readFileSync` inside the
  production catch-all route. `index.html` is a build artefact and a boot-time `existsSync` check
  already refuses to start without the directory, so this cannot be triggered by a clean deploy. It
  would turn a corrupted `dist/` into a 500 on every page rather than a clear boot failure.
- `docs/product/`, the PDA1 investigations, the TRUST1 soft-launch report, and four `scripts/*.ts`
  files remain untracked. None is on a runtime path — they are documentation and developer tooling,
  so they do not block a deploy. They are, however, someone's uncommitted work.

---

## OUTCOME

**The repository now contains everything production needs, and a gate that keeps it that way.**

Before REL1, `server/` code read a dataset that existed in no commit, and a comment in that code
claimed the opposite. Typecheck, tests and build all passed while the deploy would have shipped a
reader pointed at nothing — because every one of those checks runs against a working tree that
still has the files, and none of them asks git. TRUST1 found it by reading `git status` by hand.

Now: the 135 files those features load are committed; the production release package is defined in
one canonical place (`RELEASE.md`); what is deliberately left out of production is written down
with the guard that enforces each exclusion; and `npm run verify:release-packaging` fails the
release — before typecheck, tests, or build — if any runtime asset is untracked, any asset
directory has uncommitted files, or any server path resolves to a file the repository does not
contain. Run against the pre-REL1 tree, that gate fails with exit 1 and names every one of the 135
files. It is not a check that trusts a comment.

**Is production reproducible from a clean checkout? For the application artefact: yes** — verified
by build, by the gate, and by driving the real reader module against the committed dataset. **For
the database: no, and not because of packaging** — the founding cookbook has no production seeding
path (Blocker 1), and that gap is now stated rather than assumed away.

---

## NEXT STEPS

1. **Blocker 1 needs an owner** — decide how the 500 founding recipes reach a production database.
   Until then, releasing Cookbook ships an empty library.
2. **Blocker 2 (uploads → object storage)** — required before households can upload meal photos in
   production without silent data loss.
3. **Blocker 3 (`M .replit`)** — commit or revert; the deploy config must match the repository.
4. Everything in this milestone is **committed but not pushed, and nothing is deployed.** Deployment
   remains subject to approval, as instructed.
