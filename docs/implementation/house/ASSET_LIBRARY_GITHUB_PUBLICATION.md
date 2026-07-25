# ASSETLIB — Living Home Asset Library — GitHub Publication

**Document ID:** `ASSETLIB`
**Date:** 2026-07-25
**Status:** COMPLETE — the complete Living Home Asset Library is version-controlled on GitHub · **no asset modified, regenerated, renamed or optimised**
**Author of record:** Colin Clapson (Home Owner) · executed by Claude under the Engineering Workflow
**Session record:** `.engineering/session/runs/ASSETLIB_Asset_Library_GitHub_Publication.md`

---

## Filing divergence — surfaced, not silently resolved

The mission specified `docs/implementation/ASSET_LIBRARY_GITHUB_PUBLICATION.md` — a **folder root**, which `REPOSITORY_CONVENTIONS.md` § 2 forbids (*"loose files at its root"*), `ENGINEERING_WORKFLOW.md` STEP 5 forbids by name, and `.engineering/scripts/repo-structure-verify.sh` check 3 mechanically fails on.

Filed at the governed **House** workstream path: **`docs/implementation/house/ASSET_LIBRARY_GITHUB_PUBLICATION.md`**. The same divergence was surfaced and handled identically under `LARDER7` and `VISREG1` on 2026-07-25.

---

## ROLLBACK IDENTIFIER

| Field | Value |
|---|---|
| **Rollback identifier** | `rollback/ASSETLIB-github-publication-20260725` |
| **Resolves to** | `347a092c72e79cd09b274bf2a6c1559c70247aec` |
| **Type** | Annotated tag |
| **Created** | **Before any file was staged, added or changed** |
| **Pre-task dirty-tree snapshot** | `7f9216fc87f988767e7032efa30a862f4bc5454b` (`git stash create`, tracked modifications only) |

---

## COMMIT HASH

**`803eb092afc5352dae74b137465c10a19355de97`** — message exactly as specified: `Add complete Living Home production asset library`

---

## BRANCH

**`claude-work`** — confirmed before any change and unchanged throughout. No other branch was created, checked out or written to.

---

## REPOSITORY LOCATION

| Remote | URL | Used |
|---|---|---|
| **`origin`** | `https://github.com/thehealthyapples/Meal-Ingredients-Planner.git` | **YES** — the GitHub remote, pushed to |
| `gitsafe-backup` | `git://gitsafe:5418/backup.git` | No |
| `subrepl-gpcofgrw` | `git+ssh://git@ssh.spock.replit.dev:/home/runner/workspace` | No |

**Push result:** `ec2014d7..803eb092  claude-work -> claude-work`

The pushed range carries **two** commits: `347a092c` (`VISREG1`, committed in the preceding session and not yet pushed) and `803eb092` (this publication). Recorded rather than left for a reader to discover in the range.

---

## FILES COMMITTED

**21 files, 0 modified, 0 deleted, 0 renamed.** Every one is a **new** binary added to version control; the diff reports `21 files changed, 0 insertions(+), 0 deletions(-)` — the signature of pure addition.

| # | Path | Bytes |
|---|---|---|
| 1 | `attached_assets/THA_Living_Larder_Assets/fruit/tha-larder-fruit-apple-red.png` | 388,756 |
| 2 | `attached_assets/THA_Living_Larder_Assets/jars/large/tha-larder-jar-flour-plain.png` | 282,754 |
| 3 | `attached_assets/THA_Living_Larder_Assets/jars/large/tha-larder-jar-oats-rolled.png` | 345,386 |
| 4 | `attached_assets/THA_Living_Larder_Assets/jars/large/tha-larder-jar-pasta-penne.png` | 246,673 |
| 5 | `attached_assets/THA_Living_Larder_Assets/jars/large/tha-larder-jar-rice-brown.png` | 338,754 |
| 6 | `attached_assets/THA_Living_Larder_Assets/jars/large/tha-larder-jar-rice-white.png` | 324,202 |
| 7 | `attached_assets/THA_Living_Larder_Assets/jars/large/tha-larder-jar-sugar.png` | 262,590 |
| 8 | `attached_assets/THA_Living_Larder_Assets/jars/small/tha-larder-jar-seeds-chia.png` | 219,975 |
| 9 | `attached_assets/THA_Living_Larder_Assets/joinery/cupboards/tha-larder-joinery-cupboard-oak-double.png` | 1,309,164 |
| 10 | `attached_assets/THA_Living_Larder_Assets/joinery/cupboards/tha-larder-joinery-cupboard-oak-single.png` | 669,994 |
| 11 | `attached_assets/THA_Living_Larder_Assets/joinery/drawers/tha-larder-joinery-drawer-unit-oak-deep.png` | 1,288,103 |
| 12 | `attached_assets/THA_Living_Larder_Assets/joinery/drawers/tha-larder-joinery-drawer-unit-oak-shallow.png` | 1,270,201 |
| 13 | `attached_assets/THA_Living_Larder_Assets/joinery/racks/tha-larder-joinery-floating-spice-rack-oak.png` | 715,959 |
| 14 | `attached_assets/THA_Living_Larder_Assets/joinery/shelves/tha-larder-joinery-floating-shelf-oak-medium.png` | 415,282 |
| 15 | `attached_assets/THA_Living_Larder_Assets/joinery/shelves/tha-larder-joinery-floating-shelf-oak-short.png` | 347,882 |
| 16 | `attached_assets/THA_Living_Larder_Assets/joinery/shelves/tha-larder-joinery-floating-shelf-oak-wide.png` | 258,375 |
| 17 | `attached_assets/THA_Living_Larder_Assets/joinery/tables/tha-larder-joinery-preparation-table-oak.png` | 837,173 |
| 18 | `attached_assets/THA_Living_Larder_Assets/joinery/tables/tha-larder-joinery-side-worktable-oak.png` | 582,328 |
| 19 | `attached_assets/THA_Living_Larder_Assets/rejected/tha-larder-fruit-apple-red-rejected-shadow-v1.png` | 649,224 |
| 20 | `attached_assets/THA_Living_Larder_Assets/rejected/tha-larder-jar-seeds-chia-rejected-shadow-v1.png` | 290,721 |
| 21 | `attached_assets/THA_Living_Larder_Assets/vegetables/tha-larder-vegetable-broccoli.png` | 747,863 |

**Why only 21 and not 185:** the remaining **164** files of the library were **already tracked and already on GitHub** before this work began. The audit (`git ls-files --others --exclude-standard`) found the `THA_Living_Larder_Assets` master folder to be the **only** untracked part of the library. Publishing is therefore an addition of exactly what was missing, not a re-commit of what was already safe.

### `.DS_Store` — the one deliberate exclusion

Two `.DS_Store` files exist inside the master folder (`THA_Living_Larder_Assets/.DS_Store`, `THA_Living_Larder_Assets/jars/.DS_Store`) and are excluded by the repository's `.gitignore`. **These are macOS Finder metadata, not assets** — they contain no image data, no prompt, no documentation. They are named here so the exclusion is a recorded decision rather than a silent gap, and `.gitignore` was **not modified** to admit them.

---

## FOLDER STRUCTURE VERIFIED

**Preserved exactly. Nothing compressed, renamed, moved, flattened or reorganised.**

```
attached_assets/THA_Living_Larder_Assets/     ← master source library (13 folders incl. root)
├── fruit/                                     1 asset
├── jars/
│   ├── large/                                 6 assets
│   └── small/                                 1 asset
├── joinery/
│   ├── cupboards/                             2 assets
│   ├── drawers/                               2 assets
│   ├── racks/                                 1 asset
│   ├── shelves/                               3 assets
│   └── tables/                                2 assets
├── rejected/                                  2 archived assets
└── vegetables/                                1 asset
```

The published folder tree on `origin/claude-work` was enumerated with `git ls-tree -r` and matches the local tree path-for-path, at every depth.

---

## SUMMARY — THE COMPLETE LIVING HOME ASSET LIBRARY

Scope of the count: the five areas that together constitute the library — the master source assets, the design/North Star reference imagery, the published production assets, the archive and review set, and the manifests.

### Per-area breakdown

| Area | Role | Files | Folders | Size |
|---|---|---|---|---|
| `attached_assets/THA_Living_Larder_Assets/` | **Master source library** (this commit) | 21 | 12 | 12 MB |
| `attached_assets/design/` | Reference imagery — North Star v1/v2/v3, before/after evidence | 43 | 7 | 35 MB |
| `client/src/assets/living-home/` | **Published production assets** — larder joinery, jars, produce, dressing | 46 | 5 | 15 MB |
| `docs/reference-assets/` | **Archived** rejected predecessors + review contact sheet | 13 | 3 | 2.3 MB |
| `docs/implementation/assets/` | **Manifests**, registers, evidence | 62 | 11 | 6.9 MB |
| **TOTAL** | | **185** | **43** | **70 MB** |

### Image counts by type

| Type | Count | Notes |
|---|---|---|
| **PNG** | **157** | Every master, published and reference raster asset |
| **SVG** | **6** | The Environmental Dressing set (apples, spring flowers, summer fruit, autumn pumpkins, folded blanket, winter evergreens) |
| **WebP** | **2** | Both **archived rejected** predecessors (`larder-counter.webp`, `larder-jars.webp`) |
| **JPG / JPEG** | **0** | None in the library |
| **GIF / AVIF / ICO** | **0** | None in the library |
| **Total image files** | **165** | |

### Non-image files

| Type | Count | What they are |
|---|---|---|
| **Markdown (documentation)** | **10** | READMEs, `NORTH_STAR.md`, `REJECTION_RECORD.md`, evidence notes |
| **JSON (manifests / checksums)** | **8** | incl. `house-asset-register.json`, `checksums-20260723.json` |
| **HTML** | **2** | Companion prototype/comparison artefacts |
| **Total** | **20** | |

### Prompts, prompt history and generation notes

**Location, stated precisely, because the answer is not where one would first look.** The Living Home asset **prompts and generation notes are not loose files inside the asset folders** — the master folder contains **zero** non-image files. They live in two tracked, already-published places:

| Artefact | Path | Status |
|---|---|---|
| **Production asset generation record** — the prompt discipline, the medium disclosure, the candidate labelling | `docs/implementation/pantry/LARDER_PRODUCTION_ASSET_GENERATION.md` | Tracked · on GitHub |
| **Jar master generation script** — the procedural generator for the rejected v1 family | `scripts/generate-larder-jar-masters.ts` | Tracked · on GitHub |
| **Jar asset README** | `client/src/assets/living-home/larder/jars/README.md` | Tracked · on GitHub |
| **Review set README + checksums** | `docs/reference-assets/living-larder-review/` | Tracked · on GitHub |
| **Rejection record** (why each predecessor was refused) | `docs/reference-assets/rejected/living-larder/REJECTION_RECORD.md` | Tracked · on GitHub |

A separate `archive/prompts/` directory holds **28** historical Replit implementation prompts. These are **platform build prompts, not asset-generation prompts**, are already tracked, and were not touched.

### Approximate repository size

| Measure | Size |
|---|---|
| Working tree (excl. `node_modules`, `.git`, caches) | ~1.7 GB |
| `.git` directory | ~1.4 GB |
| **This commit's contribution** | **~11.9 MB** across 21 new binary blobs |

---

## `.GITIGNORE` VERIFICATION — no image unintentionally excluded

**Method: mechanical, not by reading the file.** Every image file in the repository was enumerated and passed through `git check-ignore`.

- **1,409** image files found (`.png .webp .svg .jpg .jpeg .gif .avif .ico`), excluding `node_modules`, `.git`, `.cache`, `.local`, `dist`.
- **16** are ignored by git.
- **All 16 are under `client/dist/public/`** — Vite **build output**, correctly and intentionally excluded by the `dist` rule.
- **0 source, master, candidate, approved, archived or reference images are excluded.**

The root `.gitignore` contains **no image-extension rule of any kind** — no `*.png`, `*.webp`, `*.svg`, `*.jpg`. The only asset-adjacent exclusions are `.DS_Store` (macOS metadata) and `dist` / `client/dist` (build output).

**`.gitignore` was not modified.** No rule was added, removed or relaxed to make this publication possible — which is the correct outcome, because none needed to be.

---

## GITHUB VERIFICATION COMPLETE

Four independent confirmations, all after the push:

1. **Remote HEAD equals local HEAD.** `git fetch origin claude-work` then compare → both `803eb092afc5352dae74b137465c10a19355de97`. Identical.
2. **All 21 assets present in the remote tree.** `git ls-tree -r --name-only origin/claude-work -- attached_assets/THA_Living_Larder_Assets/` returns exactly 21 paths, matching the local tree path-for-path.
3. **Byte-for-byte identity against GitHub.** For each of the 21 files, the blob stored at `origin/claude-work:<path>` was extracted with `git cat-file blob` and its SHA-256 compared with the pre-staging checksum of the local file. **All 21 match.**
4. **Whole-library parity.** Remote file counts equal local file counts in every one of the five areas: 21/21 · 43/43 · 46/46 · 13/13 · 62/62. **Zero untracked files remain** anywhere under the library paths.

**One cross-check worth recording:** the master source `tha-larder-joinery-floating-shelf-oak-wide.png` hashes to `187109d738d1fb4a8c78cf54cff267f51ccb13a4508320b6a32c5a0d20428494`, which is **exactly the `sha256` already recorded for `larder-joinery-floating-shelf-oak-wide` in `docs/implementation/assets/house-asset-register.json`**. The newly published master and the long-published production asset are provably the same bytes — the library is internally consistent, and this publication introduced no divergence between source and product.

---

## DATA IMPACT

- **Reads existing data:** **NO** — no query, no runtime read path. Files were enumerated and hashed on disk only.
- **Writes new data:** **NO** — no schema, table, column, migration or household data. Adding files to version control writes no application data of any kind.
- **Changes meaning of existing data:** **NO** — every register row, checksum, approval record and lifecycle state means exactly what it meant before. Nothing was promoted, approved, retired or reclassified. In particular, **publishing a master to GitHub is not an approval**: the 20 candidate jars remain candidates and the Home Owner approval instrument is untouched.
- **Requires backfill:** **NO.**

---

## TRUST CHECK

- **Could this mislead the user?** **No.** No household-facing surface exists, changes or is reachable. The one place a reader could be misled — *"published"* being taken to mean *"approved"* — is closed explicitly above: version control is storage, never an approval, and `HOMEOWNER1`'s checksum-bound instrument is the only thing that approves an asset.
- **Could this fabricate certainty?** **No.** Every number in this report was produced by a command, not an estimate: file counts from `find` and `git ls-tree`, type counts from extension tally, sizes from `du`, byte sizes from the commit diff, identity from SHA-256 comparison against the remote blob. The `.gitignore` conclusion is the output of `git check-ignore` over all 1,409 images, not a reading of the file.
- **Is anything guessed but shown as real?** **No.** Where the answer was not where one would expect — the prompts and generation notes are not in the asset folders — that is stated plainly with the real locations, rather than a folder being described as containing something it does not.
- **What happens if the system is wrong?** The failure mode is benign and reversible: an asset absent from GitHub would be re-added by a second commit; an asset wrongly added would be removed by `git rm --cached`. **No asset was modified**, verified by 21/21 checksum re-verification after staging, so no original can have been lost. The rollback tag restores the exact pre-task state.
- **No architectural duplication introduced:** **YES** (none). No register, manifest or owner was created or moved.
- **No new source of truth created:** **YES.** The master folder was already the source; it is now backed up. `house-asset-register.json` remains the House Register, `living-details-manifest.ts` the Life Register, `dressing-register.ts` the Dressing Register.
- **No runtime behaviour altered:** **YES** — verified mechanically (Manual Verification step 7), not asserted.

---

## SCOPE LOCK

**Implemented scope**
- Located the complete Living Home Asset Library across all five areas and all subfolders.
- Verified `.gitignore` excludes no source image, mechanically, across all 1,409 images.
- Added the **21** untracked master assets, preserving the folder structure exactly.
- Committed with the specified message; pushed to `origin` (GitHub); verified byte-for-byte against the remote.
- This publication record and its session record.

**Explicitly excluded scope — deliberately not attempted**
- **No asset modified, regenerated, renamed, moved, compressed, optimised, converted or reorganised.** Proven by 21/21 SHA-256 re-verification after staging and by the `0 insertions(+), 0 deletions(-)` diff.
- **No asset generation of any kind.**
- **No runtime code, React, component, schema, migration, token or architecture change.**
- **No `.gitignore` change** — none was needed, and changing one to admit `.DS_Store` would have added noise, not assets.
- **No approval, promotion, retirement or reclassification** of any asset. Candidates stay candidates.
- **No Git LFS migration.** The library is ~70 MB across 165 images and is comfortably within GitHub's limits (largest single file 2.0 MB, against a 100 MB hard limit). Migrating to LFS would **rewrite every blob** — the precise opposite of *do not modify any asset*. Recorded as a decision, not an oversight; see the suggestion below.

**Deliberately not committed — other workstreams' uncommitted work**

The repository holds **32** further untracked files that are **not** part of the Living Home Asset Library. They belong to the in-progress `LARDER6` / `LARDER_CATEGORY_FIRST` workstream, and committing them under the message *"Add complete Living Home production asset library"* would mislabel them, publish unfinished runtime code, and widen this task's scope:

| Group | Count | Why excluded |
|---|---|---|
| `docs/implementation/evidence/2026-07-24-larder-category-first/*.png` | 19 | **Screenshots of a room implementation**, not asset-library assets — another workstream's report evidence |
| `scripts/_tmp-larder*.ts`, `scripts/capture-*`, `scripts/verify-larder-category-first.ts` | 8 | Temporary diagnostic scripts from that workstream |
| `.engineering/session/runs/LARDER6*.md` and siblings | 3 | That workstream's session records |
| `client/src/pages/larder-shelves.ts` | 1 | **Runtime code** — the mission forbids modifying runtime code |
| Modified tracked files (`client/`, `server/`, `shared/`) | 12 | That workstream's in-progress edits, left untouched |

These are **safe on disk and unaffected** by this work. If you want them version-controlled too, that is one command — but it belongs in its own commit with its own message.

**Suggestions recorded, not taken**
1. The master folder holds **no README and no manifest of its own**. A short README naming what the folder is, which assets are candidates against approved, and where the prompts live would make it self-describing to anyone who clones the repository. Not written here — it is content, and content is the Home Owner's.
2. If the library grows past a few hundred megabytes, Git LFS becomes worth a deliberate act. It is not needed today, and it must never be done as a side effect of a publication task.
3. The `.DS_Store` files could be deleted from disk at the Home Owner's convenience; they are inert.

---

## MANUAL VERIFICATION

Every step below was executed; none is inferred.

1. **`git status` and branch confirmed before any change** — branch `claude-work`, HEAD `347a092c`, 1 commit ahead of `origin/claude-work`, with the pre-existing `LARDER6` modifications recorded and left untouched.
2. **Rollback protection created before any staging** — annotated tag verified to resolve to `347a092c`; dirty-tree snapshot `7f9216fc` created and recorded.
3. **`.gitignore` audited mechanically** — 1,409 images enumerated, passed through `git check-ignore`; 16 ignored, all under `client/dist/`; **0 source images excluded**.
4. **Pre-staging SHA-256 recorded for all 21 assets**, before `git add` touched anything.
5. **Post-staging re-verification: `sha256sum -c` → 21 OK, 0 failures.** The assets on disk are byte-identical to what they were before staging.
6. **Git-stored blob compared to worktree file** for sampled assets — identical hashes, proving git stored the bytes verbatim with no filter or conversion.
7. **`npm run verify:living-home-assets` → 31 checks run, 31 passed, 0 failed**, run after the commit. Every checksum-locked asset, every register and every recorded approval is intact. This is the mechanical proof that no production asset changed.
8. **Push confirmed** — `ec2014d7..803eb092  claude-work -> claude-work`.
9. **Remote verified after push** — remote HEAD equals local HEAD; 21/21 assets present; 21/21 byte-for-byte identical to local via `git cat-file blob`; five-area parity 21/43/46/13/62; **0 untracked assets remaining**.
10. **`repo-structure-verify.sh`** run to confirm this report's filing is lawful at its workstream path.

---

## USER ACCEPTANCE EVIDENCE

**State: Complete.** Nothing here is waiting on a decision; the work is verified end-to-end.

**What you can check yourself, in one place:**
`https://github.com/thehealthyapples/Meal-Ingredients-Planner/tree/claude-work/attached_assets/THA_Living_Larder_Assets`

You should see 10 asset folders and 21 PNGs, in the structure shown above.

**The three things worth your attention:**

1. **Publishing is storage, never approval.** The master library is now backed up on GitHub, and **not one asset's status changed**: 7 jars remain approved, 20 remain candidates, the rejected predecessors remain rejected. The library being safe and the library being approved are separate facts, and only the first one changed today.
2. **The library was already 89% published.** 164 of 185 files were tracked before this work; the master source folder was the only gap. That gap was the important one — it held the **originals** — but the scale of the fix is smaller than "publish the library" suggests, and it is stated so rather than dressed up.
3. **32 untracked files from the `LARDER6` / category-first workstream were deliberately left alone** (see Scope Lock). They are safe on disk. If you want them committed, say so and it is one command — but they need their own commit message, and one of them is runtime code this task was told not to touch.

---

*Rollback identifier: `rollback/ASSETLIB-github-publication-20260725` → `347a092c`*
*Commit: `803eb092afc5352dae74b137465c10a19355de97` · Branch: `claude-work` · Remote: `origin` (GitHub)*
*Author of record: Colin Clapson (Home Owner) · executed by Claude under the Engineering Workflow*
*Date: 2026-07-25*
