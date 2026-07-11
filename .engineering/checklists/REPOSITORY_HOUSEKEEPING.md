# Checklist — Repository Housekeeping

Moves and deletes files. Changes no behaviour. The danger is not the code — it is
deleting something irreplaceable, or silently breaking a reference.

Template: [`../templates/REPOSITORY_HOUSEKEEPING_TEMPLATE.md`](../templates/REPOSITORY_HOUSEKEEPING_TEMPLATE.md).
Rules: [`../../docs/architecture/REPOSITORY_CONVENTIONS.md`](../../docs/architecture/REPOSITORY_CONVENTIONS.md).

## Before starting

- [ ] Read `docs/architecture/README.md` and `REPOSITORY_CONVENTIONS.md`.
- [ ] `git status` reported.
- [ ] Rollback tag created and identifier reported.
- [ ] **Stated what the tag does not cover** — uncommitted and untracked work.
- [ ] Confirmed: this housekeeping will touch no file it did not author.

## Before deleting anything

- [ ] Snapshotted every file to be deleted, outside the repository.
- [ ] For each file, verified **at the moment of deletion** (not from earlier
      analysis) that a canonical copy exists.
- [ ] "Duplicate" proven **by content** (`cmp` / `sha1sum`), never by filename.
      *An investigation and its implementation report share a name and are not
      duplicates.*
- [ ] `grep` confirms nothing references the path being removed.
- [ ] Used `git rm` for tracked files, so deletion is recoverable from history.
- [ ] Anything I did not create, and that contradicts how it was described:
      **surfaced, not deleted.**

## Before moving anything

- [ ] Destination is the canonical location per `REPOSITORY_CONVENTIONS.md`.
- [ ] Moving will not overwrite a larger, canonical file at the destination.
- [ ] No unnecessary renames.
- [ ] Runtime assets that resolve from the working directory are **left alone**
      (moving them changes behaviour).

## Reference integrity

- [ ] All inbound references rewritten (`docs/x/FILE` → `docs/x/<folder>/FILE`).
- [ ] Relative links **inside** moved documents fixed for the depth change.
- [ ] Historical records excluded from rewriting: stored patches, transcripts.
      *Rewriting them would falsify history.*
- [ ] Link check run over all documentation.
- [ ] **Baseline comparison** performed: same check against the rollback tag in a
      temporary worktree. Both numbers reported.
- [ ] Any reference broken by this work: found, fixed, and disclosed.

## Build and close

- [ ] Any code file changed? A comment-only edit counts.
      - [ ] If yes: `npm run build` run, result reported.
      - [ ] If no: stated that it was not required, and why.
- [ ] `.engineering/scripts/repo-structure-verify.sh` passes.
- [ ] `.engineering/scripts/session-verify.sh` passes.
- [ ] Report filed; deletions, moves, and folders created all listed.
- [ ] Nothing committed that I did not author. Nothing pushed. Nothing deployed.
