# Uncommitted branch payload — recovery

**Date:** 2026-07-26 (recovery of the 2026-07-25 working-tree payload)
**Workstream:** `RECOVERY` — Living Larder WIP preservation
**Risk:** 🔴 RED — preservation of uncommitted work and repository history
**Approved decision:** Option A — dedicated recovery branch with selective WIP commits
**Predecessor:** `docs/investigations/engineering/UNCOMMITTED_BRANCH_PAYLOAD_REVIEW_CLAUDE_WORK_2026-07-25.md`
(read-only review of the same payload; this document is its execution)

---

## 1. Architecture Compliance

**Documents read before modification**

| Document | Bearing on this work |
|---|---|
| `docs/architecture/README.md` | Mandatory architecture bootstrap. Read as the entry point; no governing architecture is amended, created or reclassified by this task. |
| `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md` | § 3 — *a tag points at a commit and therefore protects committed state only*. This is the precise finding that makes this task necessary; see § 4. |
| `.engineering/protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md` | § 1 — one concern per commit; commit only what was reviewed; never `git add -A`; never commit on the default branch. § 2/§ 3 — push and deploy are separate authorisations and were not taken. |
| `.engineering/protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md` | § 1/§ 6 — recovery is file-based; the rollback identifier is preserved, never regenerated. |
| `docs/implementation/pantry/LARDER5_LIVING_LARDER_ARCHITECTURE.md` § 6 | Names the eight untracked items left alone by a prior session and states that they *"need the owner's decision: commit, finish, or discard"*. This task executes the **commit** half of that decision. |
| `docs/implementation/house/ASSET_LIBRARY_GITHUB_PUBLICATION.md` | Records the same payload as deliberately not committed by the ASSETLIB session. Its classification of two files is disputed here with evidence — see § 5.1. |

**Compliance statement.** No governing architecture is created, amended, retired or
reclassified. No route, capability, entity, token, component, string, schema,
migration or business logic is introduced. No runtime behaviour is changed by any
act of this task — the runtime code committed in § 7.2 is preserved **exactly as it
already sat in the working tree**, byte for byte, and was not edited here.

**One declared deviation.** `COMMIT_PUSH_DEPLOY_PROTOCOL.md` § 5 specifies the
commit-subject shape `<WORKSTREAM> — <what changed, imperative>`. The three commit
subjects were specified verbatim by the Home Owner as `RECOVERY: …` / `WIP: …` and
were used as instructed. The rollback identifier is carried in each commit body as
§ 5 requires. Recorded as a deviation taken on instruction, not an oversight.

**Build and test gates were not run, and this is a statement, not a silent skip.**
`npm run typecheck`, `npm run build`, the asset verifier and the test suites were
**not** executed. Two reasons, both explicit: the instruction for this task was to
run *only non-mutating checks needed to verify commit contents*; and the material in
§ 7.2 is **known-unfinished work being preserved, not delivered**, so a green build
would prove nothing about it and a red one would not change what must be preserved.
`COMMIT_PUSH_DEPLOY_PROTOCOL.md` § 4 would require a build for a source change
intended to progress; this change intends only to make an existing working tree
recoverable.

---

## 2. Claim status

Every material ownership and repository-state claim in this report is tagged.

| Tag | Meaning |
|---|---|
| **[Verified]** | Established by a command run in this session, with its output |
| **[Recorded]** | Read from a document in this repository |
| **[Inferred]** | Reasoned from evidence, not directly observed |
| **[Assumed]** | Believed, not checked — flagged for the reader |

---

## 3. Original branch and HEAD

| Field | Value |
|---|---|
| **Original branch** | `claude-work` **[Verified]** |
| **HEAD at start** | `3cfc1f1bdd682452a942f971f9d13e6118bfbdf6` **[Verified]** |
| **HEAD subject** | *ASSETLIB — record the asset library GitHub publication* **[Verified]** |
| **Remote tracking** | `origin/claude-work` at the same SHA — branch was up to date **[Verified]** |
| **Index state at start** | **Nothing staged.** `git diff --cached` was empty **[Verified]** |
| **Working tree at start** | 13 modified tracked files (+2,060 / −656), 34 untracked files across 15 paths **[Verified]** |

---

## 4. Existing rollback identifier — and what it does not protect

```
rollback/GOVERNANCE-tha-ai-operating-model-v4-20260726 → 3cfc1f1bdd682452a942f971f9d13e6118bfbdf6
```

- The tag **exists** and resolves to `3cfc1f1b` via `^{commit}` **[Verified]**
- It is an **annotated** tag (`git cat-file -t` → `tag`), as § 2 of the Rollback
  Protection Protocol requires **[Verified]**
- It resolves to exactly the same commit as `claude-work` **[Verified]**
- **It was preserved, never regenerated.** No new rollback tag was created by this
  task **[Verified]**

**It protects committed history only.** `ROLLBACK_PROTECTION_PROTOCOL.md` § 3 states
this in terms: a tag points at a commit, and does not capture uncommitted
modifications to tracked files, untracked files, or anything gitignored — and names
that gap *"the single most common false sense of safety in this repository"*
**[Recorded]**.

Applied here: at `3cfc1f1b` the entire Living Larder rebuild — 2,060 changed lines
across five source files, plus a 233-line new module that git had never seen — was
**invisible to the tag** **[Verified]**. Had anyone rolled back to it, or run
`git checkout`/`git clean` in that tree, the tag would have restored the repository
perfectly and the work would have been gone. That is the whole justification for
this task.

---

## 5. Read-only inventory — every path classified

Produced before any modification. Categories are the eight specified for this task.

### 5.1 Modified tracked files (13)

| Path | Classification | Evidence |
|---|---|---|
| `shared/schema.ts` | documentation-path correction | 1 line, inside a JSDoc comment **[Verified]** |
| `server/migrations/runner.ts` | documentation-path correction | 1 line, inside a `//` comment **[Verified]** |
| `server/routes.ts` | documentation-path correction | 1 line, inside a `//` comment **[Verified]** |
| `client/src/components/TrialBanner.tsx` | documentation-path correction | 1 line, inside a `//` comment **[Verified]** |
| `shared/cookbook/curation.ts` | documentation-path correction | 1 line, inside a block comment **[Verified]** |
| `shared/nutrition/household-nutrition.ts` | documentation-path correction | 1 line, inside a block comment **[Verified]** |
| `server/tests/test-mat1-registry-conformance.ts` | documentation-path correction | 1 line, inside a block comment **[Verified]** |
| `server/tests/test-planner-continuous-timeline.ts` | documentation-path correction | 1 line, inside a block comment **[Verified]** |
| `client/src/pages/larder-room.css` | Living Larder source | +1,528 / −… , the modelled room **[Verified]** |
| `client/src/pages/larder-room.tsx` | Living Larder source | category-first composition **[Verified]** |
| `client/src/components/layout/app-shell.tsx` | Living Larder source | +54, `ROOMS_OWN_THRESHOLD`, `resolveRoomExposure` **[Verified]** |
| `client/src/components/layout/orchard-backdrop.tsx` | Living Larder source | +59, `<OrchardCasement />` **[Verified]** |
| `.engineering/session/CURRENT.md` | session record | 1 line — the Stop-hook heartbeat timestamp **[Verified]** |

All eight documentation-path corrections were checked twice: the diff touches **only
a comment line** in each file, and **all five renamed targets exist on disk** while
**all five old paths are gone** **[Verified]**.

### 5.2 Untracked paths (15 paths, 34 files)

| Path | Classification | Evidence |
|---|---|---|
| `client/src/pages/larder-shelves.ts` | Living Larder source | New, 233 lines; presentation-only shelf vocabulary **[Verified]** |
| `.engineering/session/runs/LARDER6_North_Star_Implementation.md` | session record | Living Larder run file **[Verified]** |
| `.engineering/session/runs/LARDER_CATEGORY_FIRST_Living_Larder_Evolution.md` | session record | Living Larder run file **[Verified]** |
| `.engineering/session/runs/LIVING_LARDER_Canonical_Experience_Refinement.md` | session record | Living Larder run file **[Verified]** |
| `.engineering/session/runs/GOVAI4_THA_AI_Operating_Model_V4_Adoption.md` | session record — **V4 governance, not this work** | Run file for the paused V4 adoption; stage reads *"STOPPED — conflicting ownership found before implementation"* **[Verified]** |
| `scripts/capture-larder-category-first.ts` | intentional verification script | Header names `LARDER_CATEGORY_FIRST`, carries a usage line, writes to the Larder evidence directory **[Verified]** |
| `scripts/verify-larder-category-first.ts` | intentional verification script | Header names `LARDER_CATEGORY_FIRST`; performs real assertions with a failure counter **[Verified]** |
| `scripts/_tmp-larder-shot.ts` | disposable temporary script | `_tmp-` prefix; hard-codes a dead per-session scratchpad path **[Verified]** |
| `scripts/_tmp-larder6-diag.ts` | disposable temporary script | `_tmp-` prefix; ad-hoc diagnostic **[Verified]** |
| `scripts/_tmp-larder6-diag2.ts` | disposable temporary script | as above **[Verified]** |
| `scripts/_tmp-larder6-diag3.ts` | disposable temporary script | as above **[Verified]** |
| `scripts/_tmp-larder6-shot.ts` | disposable temporary script | `_tmp-` prefix; hard-codes a dead scratchpad path **[Verified]** |
| `scripts/_tmp-larder6b-shot.ts` | disposable temporary script | as above **[Verified]** |
| `docs/implementation/evidence/2026-07-24-larder-category-first/` | large screenshot evidence | 19 PNGs, 47 MB **[Verified]** |
| `docs/investigations/engineering/UNCOMMITTED_BRANCH_PAYLOAD_REVIEW_CLAUDE_WORK_2026-07-25.md` | session record (investigation record of this payload) | The read-only review this task executes **[Verified]** |

**Gitignored, therefore outside the working-tree payload entirely**

| Path | Classification | Evidence |
|---|---|---|
| `tha-ai-operating-model-v4.zip.zip` | V4 source archive | 9,873 bytes; `git check-ignore` → `.gitignore:8:*.zip` **[Verified]** |
| `thehappyapplesexport1.zip` | pre-existing archive, unrelated | Same ignore rule **[Verified]** |

**`tha-ai-operating-model-v4.zip` (single `.zip`) does not exist on disk** **[Verified]**,
and **no extracted V4 governance files exist** anywhere in the tree — the only V4
artefact besides the archive is the `GOVAI4` run file above **[Verified]**.

**Nothing was classified `unknown`, so the STOP condition was not triggered.**

**One classification conflict, resolved with evidence and recorded rather than
buried.** `ASSET_LIBRARY_GITHUB_PUBLICATION.md` § "Deliberately not committed" groups
`scripts/capture-*` and `scripts/verify-larder-category-first.ts` together with the
`_tmp-` scripts as *"Temporary diagnostic scripts from that workstream"* **[Recorded]**.
That grouping is not followed here, on four pieces of evidence **[Verified]**: neither
file carries the `_tmp-` prefix that the same repository uses to mark throwaways;
both open with a workstream-tagged purpose comment and a `Usage:` line; both resolve
their output directory to the committed evidence path rather than to a per-session
scratchpad, which the `_tmp-` scripts do; and `verify-larder-category-first.ts`
exercises the room and counts failures rather than merely taking a picture. The
competing document, `LARDER5_LIVING_LARDER_ARCHITECTURE.md` § 6, lists the same two
files under work *needing the owner's decision* rather than under disposables
**[Recorded]**. Classified as **intentional verification scripts**, matching the
category the Home Owner assigned them in this task's instruction.

---

## 6. Temporary backups — paths and checksums

Created **before** any branch change, outside the repository.

**Location:** `/tmp/claude-1000/-home-runner-workspace/19476a68-3b79-49fc-9645-d9cc6698a361/scratchpad/recovery-backup-2026-07-26/`

| File | Bytes | SHA-256 |
|---|---|---|
| `tracked-working-tree.patch` | 151,074 | `6d1fe50fcea0c40c5ba2cfc3113f2005327a678651ffba28b1e42777750155e5` |
| `staged.patch` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `untracked-text-files.tar.gz` | 18,089 | `6920488b8b581cb7b5bb430d09da1fb8e74d150ea8bd7d73a1a735d9e265b17a` |
| `git-status-at-backup.txt` | 2,942 | `be54401c48ddedb50a96d032b010ada12899e71d30f29ba9cb92c8cf5bc729b6` |
| `head-at-backup.txt` | 41 | `777124d2a3fa7744f3b16804d8c4aec172bae963d03b632cd952a01b7923ef99` |

- `tracked-working-tree.patch` is `git diff --binary HEAD` — all 13 tracked
  modifications against `3cfc1f1b`, 3,243 lines **[Verified]**.
- `staged.patch` is **empty, and legitimately so**: nothing was staged at start.
  `e3b0c442…` is the SHA-256 of the empty input, which is the proof rather than an
  absence of one **[Verified]**.
- `untracked-text-files.tar.gz` is an **addition beyond the two backups specified**
  for this task, declared here rather than made silently. A patch file captures
  tracked changes only, so without it the untracked material that this task
  deliberately does **not** commit — the `GOVAI4` run file, the review document and
  the six `_tmp-` scripts — would have existed in exactly one place on one disk. It
  holds all 14 untracked text files; the 47 MB of PNGs is excluded by size
  **[Verified]**.

**Durability, stated plainly.** These backups sit in a **session-scoped** scratchpad
and should be treated as volatile **[Inferred]**. They are the third recovery route,
not the first. The durable preservation is the recovery branch in § 7.

---

## 7. Recovery branch and commits

**Branch:** `recovery/living-larder-wip-2026-07-25`, branched from `claude-work` at
`3cfc1f1b`, three commits, **no upstream and never pushed** **[Verified]**.

Every commit was staged with an **explicit pathspec**. `git add -A` was never used —
the mechanism `COMMIT_PUSH_DEPLOY_PROTOCOL.md` § 1 names as *"how unrelated,
unreviewed changes get committed"* **[Verified]**.

### 7.1 `2753a300` — RECOVERY: preserve documentation path corrections

`2753a30088cdfd0147966373f6897156f001c4c8` · 8 files, +8 / −8

```
client/src/components/TrialBanner.tsx
server/migrations/runner.ts
server/routes.ts
server/tests/test-mat1-registry-conformance.ts
server/tests/test-planner-continuous-timeline.ts
shared/cookbook/curation.ts
shared/nutrition/household-nutrition.ts
shared/schema.ts
```

Eight files, eight lines, every one inside a comment. Zero executable change
**[Verified]**.

### 7.2 `96705ce9` — WIP: preserve unfinished Living Larder rebuild

`96705ce9ec1eb1f4c5f0fa25ddaa1abcdfa27692` · 5 files, +2,284 / −647

```
client/src/components/layout/app-shell.tsx
client/src/components/layout/orchard-backdrop.tsx
client/src/pages/larder-room.css
client/src/pages/larder-room.tsx
client/src/pages/larder-shelves.ts
```

**This is unfinished work, preserved. It is not complete and it is not tested.** All
three Living Larder run files carry an **unticked** verification checkpoint
**[Recorded]**, all three promised implementation reports are absent from
`docs/implementation/` **[Recorded]**, and no typecheck, build, asset verifier or
test suite was run against this state in any session that can be evidenced here
**[Verified]**. Nothing in this commit should reach production.

### 7.3 `0bd15004` — WIP: preserve Living Larder recovery records

`0bd150044f62dded57b3c2e87c00c5c01e7ac76c` · 5 files, +369

```
.engineering/session/runs/LARDER6_North_Star_Implementation.md
.engineering/session/runs/LARDER_CATEGORY_FIRST_Living_Larder_Evolution.md
.engineering/session/runs/LIVING_LARDER_Canonical_Experience_Refinement.md
scripts/capture-larder-category-first.ts
scripts/verify-larder-category-first.ts
```

**Relationship to this work — Verified, not assumed.** Each run file's objective
names the Living Larder and lists the exact source files preserved in § 7.2
**[Verified]**. Both scripts name `LARDER_CATEGORY_FIRST` in their header, drive
`/pantry`, and resolve their output to
`docs/implementation/evidence/2026-07-24-larder-category-first/` — the same evidence
path the `LARDER_CATEGORY_FIRST` run file names as its evidence target **[Verified]**.

**Known limitation, carried forward rather than fixed:** neither script is wired into
`package.json`, so both are orphaned as committed **[Verified]**. Wiring them is a
decision for the workstream that finishes the room, and was out of scope here.

---

## 8. Excluded files — what was not committed, and why

| Path(s) | Count | Reason |
|---|---|---|
| `scripts/_tmp-*.ts` | 6 | Disposable temporary scripts; excluded by instruction. Each hard-codes a per-session scratchpad path that no longer exists **[Verified]** |
| `docs/implementation/evidence/2026-07-24-larder-category-first/*.png` | 19 | 47 MB of screenshot evidence. Committing it puts 47 MB into history permanently, removable only by a history rewrite **[Verified]** |
| `tha-ai-operating-model-v4.zip.zip` | 1 | V4 source archive; also gitignored by `*.zip`, so structurally uncommittable without `-f` **[Verified]** |
| `tha-ai-operating-model-v4.zip` | 0 | Named in the exclusion list; **does not exist on disk** **[Verified]** |
| Temporary extracted governance files | 0 | **None exist.** No extracted V4 artefact is present anywhere in the tree **[Verified]** |
| `.engineering/session/runs/GOVAI4_THA_AI_Operating_Model_V4_Adoption.md` | 1 | Session record of the **paused V4 adoption**, not of the Living Larder. Unrelated to this work, and committing it would touch a workstream this task must leave paused **[Verified]** |
| `docs/investigations/engineering/UNCOMMITTED_BRANCH_PAYLOAD_REVIEW_CLAUDE_WORK_2026-07-25.md` | 1 | Classified and related, but it is an investigation record, not a session run record, so it falls outside the enumerated content of all three commits. Left uncommitted for the Home Owner's decision; preserved on disk and in the § 6 archive **[Verified]** |
| `.engineering/session/CURRENT.md` | 1 | Tracked modification, but the change is a one-line Stop-hook heartbeat unrelated to the Larder content. Left as an uncommitted modification; preserved in `tracked-working-tree.patch` **[Verified]** |

**No `.gitignore` change was made** — no recovery commit touches it **[Verified]**.
**No excluded file was removed from disk** — see § 9.

---

## 9. Verification results

All checks non-mutating.

| Check | Result |
|---|---|
| Recovery branch active | `recovery/living-larder-wip-2026-07-25` **[Verified]** |
| Commits on the branch | exactly 3 (`2753a300`, `96705ce9`, `0bd15004`) **[Verified]** |
| Total files committed | **18**, matching the three lists above exactly **[Verified]** |
| No `_tmp-` script committed | pattern search over all three commits: **clean** **[Verified]** |
| No screenshot evidence committed | no `evidence/` path, no `.png`: **clean** **[Verified]** |
| No governance archive committed | no `.zip`, no V4/`GOVAI4` path: **clean** **[Verified]** |
| Excluded files untouched on disk | all 14 untracked text files **byte-identical** (`cmp`) to the pre-branch backup; evidence directory still 19 files / 47 MB; sizes and mtimes unchanged **[Verified]** |
| Schema change | **none.** `shared/schema.ts` differs by one comment line; the `weekNumber` column definition is byte-identical **[Verified]** |
| Migration change | **none.** `server/migrations/runner.ts` differs by one comment line; **no entry added to the `MIGRATIONS` array**; no DDL added or removed; no other file under `server/migrations/` touched **[Verified]** |
| Production-data change | **none.** No migration ran, no database was contacted, no data path executed **[Verified]** |
| Runtime API surface | no added or removed line in the committed Larder source touches `useMutation`, `apiRequest`, `/api/` or `queryKey` **[Verified]** |
| `claude-work` intact | `3cfc1f1b`, still equal to `origin/claude-work`, zero commits added **[Verified]** |
| Rollback tag intact | `rollback/GOVERNANCE-…-20260726` → `3cfc1f1b`, still annotated, unmoved **[Verified]** |
| Nothing pushed | recovery branch has **no upstream configured** **[Verified]** |
| No merge, PR, deploy or migration | none attempted **[Verified]** |
| V4 adoption | **still paused.** Its run file is uncommitted and unmodified; no `docs/architecture/` or `docs/implementation/` V4 file was created **[Verified]** |

---

## 10. Data impact

- **Reads** existing repository and working-tree state.
- **Writes** git recovery history (three commits on a new branch) and this report.
- **Does not** change the meaning of any application data.
- **Does not** modify schema or migrations — § 9 evidences both as byte-level
  non-changes inside comments.
- **Requires no backfill.** Nothing to backfill: no column, table, type, index,
  constraint or default changed.
- **Performs no deployment.** No push, no merge, no PR, no migration run.

---

## 11. Trust Check

*Does this leave the household with less to carry, and could they trust everything it
tells them?*

No household sees anything as a result of this task — no runtime behaviour, string,
route or surface changed, and nothing reached production. The honest answer is that
this is invisible to households and neutral to them.

Where trust is at stake is in what this report claims. Two things are stated plainly
rather than allowed to be inferred favourably: the Living Larder work preserved in
§ 7.2 is **unfinished and unverified**, and this task did nothing to advance,
validate or complete it; and the § 6 backups are **volatile**, so anyone relying on
them as the primary recovery route would be relying on the weakest of the three.

---

## 12. Highest-risk Inferred or Assumed claim

**The claim:** that the five source files in § 7.2 constitute the *meaningful*
Living Larder work, and that the six `_tmp-` scripts and 19 PNGs contain nothing that
would be missed. **[Inferred]**

**Why it is the highest risk:** the excluded material is not preserved in git. If a
`_tmp-` script held the only record of a diagnostic that explained the 820 px / 2,093 px
collapse the `LARDER6` run file describes, or if a PNG were the only surviving image
of an approved composition, that knowledge lives on one disk and in one volatile
archive.

**What reduces it:** every excluded file remains on disk, byte-identical and
untouched **[Verified]**; the 14 untracked text files, including all six `_tmp-`
scripts, are additionally in the § 6 archive **[Verified]**; and each `_tmp-` script
was read, and each writes to a per-session scratchpad path that no longer exists
rather than to any governed location **[Verified]**.

**What does not reduce it:** the 19 PNGs are in **no** backup — only on disk. If they
matter, they need a decision of their own.

---

## 13. Scope Lock

**In scope and done:** read the governing documents; confirm branch, HEAD and status;
verify the rollback tag and state what it does not protect; classify every modified
and untracked path; create patch backups outside the repository with checksums;
create the recovery branch; make three selective commits with explicit pathspecs;
verify; write this report.

**Explicitly out of scope, and not done:** no deletion, discard, reset, clean,
overwrite or history rewrite of any kind; no `.gitignore` change; no removal of any
excluded file from disk; no resumption of the V4 governance adoption; no migration,
deploy, push, merge or pull request; no typecheck, build or test run; no edit to any
preserved source file; no return to `claude-work`.

**Scope not widened.** One addition was made beyond the specified backup set — the
untracked-file archive in § 6 — and it is declared there rather than folded in
silently.

---

## 14. Rollback plan

1. **`claude-work` is unchanged** at `3cfc1f1b` and still equal to
   `origin/claude-work`. Returning is `git switch claude-work`; the uncommitted
   `CURRENT.md` modification and the untracked files travel with it, as they did on
   the way here **[Verified]**.
2. **The rollback tag is intact and unmoved** —
   `rollback/GOVERNANCE-tha-ai-operating-model-v4-20260726` → `3cfc1f1b`, annotated
   **[Verified]**. It protects committed history only, exactly as before; what has
   changed is that the working tree it could not protect is now committed on a branch.
3. **The § 6 patch backups are a third route**, independent of both.
4. **Do not delete the recovery branch or the backups.** Nothing in this task
   requires either to be removed, and the branch is now the only durable copy of the
   Living Larder rebuild.

To undo this task entirely, delete the branch (`git branch -D
recovery/living-larder-wip-2026-07-25`) and re-apply
`tracked-working-tree.patch`. **This would destroy the only committed copy of the
unfinished work and is not recommended.**

---

## 15. User Acceptance Evidence

**Starting point** — git branch and status

```
$ git rev-parse --abbrev-ref HEAD
claude-work
$ git rev-parse HEAD
3cfc1f1bdd682452a942f971f9d13e6118bfbdf6
$ git status --porcelain | wc -l
13 modified tracked · 34 untracked files across 15 paths · nothing staged
```

**User action** — inspect the recovery branch and its commits

```
git branch --show-current
git log --oneline claude-work..HEAD
git show --stat 2753a300      # documentation path corrections — 8 files
git show --stat 96705ce9      # unfinished Living Larder rebuild — 5 files
git show --stat 0bd15004      # Living Larder recovery records — 5 files
git log --name-only --pretty=format: claude-work..HEAD | sort -u   # all 18 files
```

**Expected result** — the meaningful unfinished work is recoverable

Three commits exist on `recovery/living-larder-wip-2026-07-25`. The Living Larder
rebuild — 1,528 changed lines of room CSS, the category-first room component, the
new 233-line shelf module, and the shell and backdrop changes the room depends on —
is committed and recoverable from git rather than from one dirty working tree
**[Verified]**.

**Success criteria** — the original branch is intact and excluded material was not
committed

```
$ git rev-parse claude-work
3cfc1f1bdd682452a942f971f9d13e6118bfbdf6          # unchanged
$ git rev-parse rollback/GOVERNANCE-tha-ai-operating-model-v4-20260726^{commit}
3cfc1f1bdd682452a942f971f9d13e6118bfbdf6          # unchanged
$ git log --name-only --pretty=format: claude-work..HEAD | grep -E '_tmp-|\.png$|\.zip|GOVAI4'
(no output — nothing forbidden was committed)
```

**Regression checks**

| Check | Result |
|---|---|
| Schema changed? | No — one comment line in `shared/schema.ts`; column definitions byte-identical **[Verified]** |
| Migration changed? | No — one comment line in `runner.ts`; `MIGRATIONS` array untouched; no DDL **[Verified]** |
| Deployment? | None — nothing pushed, merged, deployed or migrated; recovery branch has no upstream **[Verified]** |
| Governance adoption changed? | No — V4 adoption remains paused; its run file is uncommitted and byte-identical to its pre-task state **[Verified]** |
| Excluded material still on disk? | Yes — all 14 untracked text files byte-identical by `cmp`; evidence directory still 19 files / 47 MB **[Verified]** |

---

## 16. What this report does not claim

The Living Larder implementation is **not** complete, **not** verified and **not**
tested. This task preserved it; it did not progress it. The `LARDER6` run file's own
next action — *"Rebuild `larder-room.css` / `larder-room.tsx` as one volume"* — is
still the next action **[Recorded]**, and `client/src/index.css` still holds the
`.lardr-dock` styles that `LARDER6` lists for retirement **[Recorded]**. The room's
correctness at any viewport is unknown to this report.
