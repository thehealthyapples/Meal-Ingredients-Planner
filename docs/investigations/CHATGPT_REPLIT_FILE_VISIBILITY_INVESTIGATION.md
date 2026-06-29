# ChatGPT / Replit File Visibility Investigation

**Date:** 2026-06-29
**Branch:** main
**Rollback tag:** `rollback/pre-chatgpt-investigation-2026-06-29`
**Rollback HEAD:** `3ef7e8ef44d6d7077d8178d4eee9c9913e58c9ff`

---

## Architecture Compliance

- No application code modified.
- No deployment performed.
- No push performed.
- Investigation and documentation only.

---

## Files Checked

### File 1

**Path:** `docs/investigations/CLEAN_RELEASE_BRANCH_FROM_SAFETY_2026-06-29.md`
**Absolute path:** `/home/runner/workspace/docs/investigations/CLEAN_RELEASE_BRANCH_FROM_SAFETY_2026-06-29.md`
**Size:** 13,765 bytes
**Last modified:** 2026-06-29 22:06 UTC
**Git status:** UNTRACKED — never committed
**Branch:** main

### File 2

**Path:** `docs/investigations/WX16_PLATFORM_WORKSPACE_DRAWER_ARCHITECTURE.md`
**Absolute path:** `/home/runner/workspace/docs/investigations/WX16_PLATFORM_WORKSPACE_DRAWER_ARCHITECTURE.md`
**Size:** 15,168 bytes
**Last modified:** 2026-06-29 23:15 UTC
**Git status:** UNTRACKED — never committed
**Branch:** main

---

## Git Status at Investigation Start

At the time this investigation began, `git status` reported **11 untracked files** in
`docs/investigations/` and the repository root. None of these files had been added to
git's index or committed. The working tree was otherwise clean (no modified tracked files).

The HEAD commit before this investigation was:

```
3ef7e8ef44d6d7077d8178d4eee9c9913e58c9ff
docs: update migration head references and add project documentation rule
```

---

## Commit SHA (sync test file)

The file `docs/investigations/CHATGPT_SYNC_TEST.md` was staged and committed as part of
this investigation:

```
320d236  docs(investigation): add ChatGPT sync test file
```

---

## Known Facts

1. **Both files are untracked.** Neither `CLEAN_RELEASE_BRANCH_FROM_SAFETY_2026-06-29.md`
   nor `WX16_PLATFORM_WORKSPACE_DRAWER_ARCHITECTURE.md` has ever been committed to git.
   They exist only on the Replit filesystem.

2. **Untracked files do not appear on GitHub.** GitHub's repository view (and its API)
   only serves content that has been committed. Untracked files are invisible to any
   system that reads from GitHub.

3. **Both files are in the same directory, on the same branch, with identical git status.**
   There is no structural difference between the two files that would explain one being
   readable and the other not — both are equally uncommitted.

4. **The test file `CHATGPT_SYNC_TEST.md` is now committed** (SHA `320d236`) and will be
   visible on GitHub once pushed to `origin/main`.

---

## Unknowns

1. **How ChatGPT accessed `CLEAN_RELEASE_BRANCH_FROM_SAFETY_2026-06-29.md`.**
   Since that file is untracked, it cannot have been read from GitHub. The access pathway
   is not confirmed. Possible pathways include: direct upload by the user in a prior
   ChatGPT session; a ChatGPT Replit plugin that reads the filesystem directly; or a
   Replit-hosted URL. The actual mechanism is not known from this repository alone.

2. **Whether ChatGPT's Replit integration reads the filesystem or GitHub.**
   This determines whether committing is required. This is not determinable from the
   repository state alone.

3. **Whether there is a sync delay.** If ChatGPT's Replit integration scans on a schedule,
   a file created after the last scan would be invisible until the next scan, regardless
   of git status.

4. **The exact version or configuration of any ChatGPT Replit plugin in use.**

---

## Possible Causes — Why ChatGPT Read One File But Not The Other

Listed from most to least likely based on confirmed facts:

### Cause 1 — The file was manually uploaded to ChatGPT (Most likely)

ChatGPT cannot read untracked files from GitHub. If ChatGPT successfully read
`CLEAN_RELEASE_BRANCH_FROM_SAFETY_2026-06-29.md`, the most direct explanation is that
it was uploaded directly in that ChatGPT session by the user, not discovered automatically.
ChatGPT has no mechanism to pull an untracked file from a repository unprompted.

### Cause 2 — A Replit plugin with filesystem access and a scan cache

If a ChatGPT Replit plugin reads the filesystem directly (bypassing git), it may cache
a directory listing. A file created after the last cache refresh would be invisible.
`CLEAN_RELEASE_BRANCH_FROM_SAFETY_2026-06-29.md` (created 22:06) predates
`WX16_PLATFORM_WORKSPACE_DRAWER_ARCHITECTURE.md` (created 23:15) by over an hour.
A stale cache could explain the discrepancy.

### Cause 3 — Filename or path issue

Both filenames are well-formed. No unusual characters, whitespace, or encoding issues
were observed. This is an unlikely cause.

### Cause 4 — Branch mismatch

Both files are on `main`. No branch discrepancy exists. This is not a cause.

---

## Recommended Workflow

Based on confirmed facts, the only reliable workflow is:

1. Claude creates or updates an investigation document in `docs/investigations/`.
2. Claude stages and commits the file immediately in the same session.
3. The committed file is then pushed to `origin/main` (by the user or automated process).
4. ChatGPT reads from GitHub — the committed, pushed file is now visible.

**Do not rely on ChatGPT discovering untracked files.** An untracked file exists only
on the Replit container's local disk. It is not accessible via GitHub and its visibility
through any Replit plugin is unconfirmed and non-deterministic.

The step that has been missing from prior sessions: **committing the file after creation.**

---

## Expected ChatGPT Test

The file `docs/investigations/CHATGPT_SYNC_TEST.md` has been committed (SHA `320d236`)
but not yet pushed to `origin/main`.

**Expected result before push:** ChatGPT cannot see the file via GitHub (not on remote).
**Expected result after push:** ChatGPT can see the file via GitHub at the path
`docs/investigations/CHATGPT_SYNC_TEST.md` on branch `main`.

To complete the test: push `main` to `origin`, then ask ChatGPT to read
`docs/investigations/CHATGPT_SYNC_TEST.md`.

---

## Project File Created

`docs/investigations/CHATGPT_REPLIT_FILE_VISIBILITY_INVESTIGATION.md`
