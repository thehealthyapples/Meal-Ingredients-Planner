# Rollback Protection Protocol

**Status:** Canonical engineering protocol. `EOM1` (2026-07-10).
**Invoked by:** [`../OPERATING_MANUAL.md`](../OPERATING_MANUAL.md) Step 3.

Rollback protection is the first thing that happens in a session and the last
thing anyone wants to need. It costs seconds. Skipping it costs the session.

---

## 1. The rule

**No implementation may begin until a rollback identifier has been created and
reported.**

This applies to every task type without exception, including documentation-only
work and "one-line" fixes.

## 2. Creating it

```bash
git tag -a rollback/<WORKSTREAM>-<slug>-<YYYYMMDD> \
  -m "Rollback point before <WORKSTREAM> — <one line>" HEAD

git rev-parse "rollback/<WORKSTREAM>-<slug>-<YYYYMMDD>^{commit}"
```

Report both the tag name and the resolved commit SHA:

```
rollback/EOM1-engineering-operating-manual-20260710 → 678b1aee…
```

Use an **annotated** tag (`-a`). A lightweight tag carries no author, date, or
message, and `git rev-parse <tag>` on an annotated tag returns the tag object,
not the commit — always resolve with `^{commit}`.

## 3. What a tag does and does not protect

A tag points at a **commit**. It therefore protects **committed state only**.

It does **not** capture:

- uncommitted modifications to tracked files,
- untracked files,
- anything gitignored.

**This is the single most common false sense of safety in this repository.** If
the working tree is dirty when you tag, say so explicitly in your report, and
state what the tag does not cover.

### Consequences

- If uncommitted work exists that you did not author: **do not touch it, do not
  commit it.** Scope your change so the tag is sufficient.
- If you intend to **delete** anything, snapshot it first, outside the repo:

  ```bash
  mkdir -p "$SCRATCH/pre-delete-snapshot"
  cp <files> "$SCRATCH/pre-delete-snapshot/"
  ```

- Prefer `git rm` over `rm` for tracked files, so the deletion is recoverable
  from history rather than only from your snapshot.

## 4. Verifying a deletion is safe

Before deleting anything, verify **at the moment of deletion** — not from an
analysis you performed earlier in the session, which may now be stale:

1. The canonical copy exists (`test -f <canonical>`).
2. Nothing references the path you are removing (`grep -rIl <path> .`).
3. If claiming "duplicate", prove it by content, not filename:
   `cmp -s a b` or compare `sha1sum`. An investigation and its implementation
   report legitimately share a name and are *not* duplicates.

## 5. Rolling back

```bash
# inspect first
git show --stat rollback/<tag>

# return committed state to the tag
git checkout rollback/<tag>
```

Untracked files created during the session are not removed by this; delete them
explicitly. Report what the rollback did and did not restore.

## 6. Recording it

The rollback identifier is a mandatory field in:

- the session run file (`.engineering/session/runs/<SESSION_ID>.md`),
- the active dashboard (`.engineering/session/CURRENT.md`),
- the final implementation report (Rollback Information section).

It must be identical in all three. If a session is resumed, the identifier is
**preserved, never regenerated**.

## 7. Naming

`rollback/<WORKSTREAM>-<slug>-<YYYYMMDD>` — e.g.
`rollback/HOUSE2-repository-cleanup-20260710`. The workstream prefix makes the
tag findable years later; the date disambiguates repeated attempts.

Historic tags use `rollback/before-<name>-<date>`; both forms are acceptable and
existing tags are never renamed.
