<!-- Copy this file. Housekeeping moves and deletes files. It changes no behaviour. -->

# [EWO_ID] — Repository Housekeeping

**Date:** YYYY-MM-DD
**Type:** Repository housekeeping. No application behaviour, schema, or production change.
**Risk:** 🟢 GREEN

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/[name]-[YYYYMMDD]` → `[commit SHA]` |
| Rollback command | `git checkout rollback/[name]-[YYYYMMDD]` |

> **A tag protects committed state only.** If the working tree carries
> uncommitted work, name it here and confirm this housekeeping did not touch it.
> Snapshot everything you intend to delete, before deleting it.

---

## FILES DELETED

For **each** deletion, state the evidence gathered *at the moment of deletion*:

| File | Why safe to delete | Evidence |
|---|---|---|
| | duplicate / temporary artefact | canonical twin at `<path>`; `sha1sum` identical; `grep` shows no inbound reference |

- Deleted with `git rm` (recoverable from history): YES / NO
- Snapshotted before deletion: YES / NO — [where]

## FILES MOVED

| From | To | Why |
|---|---|---|

### Deliberately left in place

[Files that *look* misplaced but are not — with the reason. A runtime asset that
resolves from the working directory is not a stray file.]

## FOLDERS CREATED

| Folder | Files | Covers |
|---|---|---|

---

## REFERENCE INTEGRITY

Moving a file breaks every reference to it. Prove none broke:

- Inbound references rewritten: [N references across M files]
- Relative links inside moved documents fixed (depth changed): [N]
- **Baseline comparison:** run the same link check against the rollback tag in a
  temporary worktree.

| | Baseline (before) | After |
|---|---|---|
| Broken links | | |

- References broken by this work and then fixed: [list, or NONE]
- Pre-existing breakage not introduced here: [list, or NONE]
- Historical records deliberately **not** rewritten: [transcripts, stored patches
  — rewriting them would falsify history]

---

## BUILD

Did any code file change? [YES / NO — a comment-only edit still counts.]

- If YES: `npm run build` — [result]
- If NO: state that the build was not required, and why.

---

## DATA IMPACT

None. No schema change, no migration, no production configuration change, no
production data touched.

---

## TRUST CHECK

- Every deletion verified against a canonical copy at the moment of deletion: YES / NO
- "Duplicate" claims proven by content hash, not filename: YES / NO
- "No broken references" is a measured result, not an assumption: YES / NO
- Nothing committed, pushed, or deployed without approval: YES / NO

---

## OUTCOME

[Before → after, in counts.]

## NEXT STEPS

[What is uncommitted and awaiting review.]
