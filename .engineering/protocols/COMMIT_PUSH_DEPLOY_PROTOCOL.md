# Commit, Push, and Deploy Protocol

**Status:** Canonical engineering protocol. `EOM1` (2026-07-10).
**Invoked by:** [`../OPERATING_MANUAL.md`](../OPERATING_MANUAL.md) Steps 9–11.

Three separate acts, with three separate authorisations. Conflating them is how
unreviewed work reaches users.

---

## 1. Commit (local — mandatory)

A local commit is **required** for any task spanning more than a single file
edit, together with its project document.

### Rules

- **One concern per commit.** Never mix a refactor with a behaviour change, or
  documentation with source.
- **Commit only what you authored and reviewed.** If the working tree carries
  someone else's uncommitted work, leave it. Staging everything with `git add -A`
  is how unrelated, unreviewed changes get committed.
- **Never commit on the default branch.** Branch first.
- Staging without committing does not satisfy the requirement.

### Report after committing

```
Project File Created:     <path>
Git Commit SHA:           <full SHA>
Current Branch:           <branch>
Rollback Identifier:      <tag> → <commit SHA>
```

## 2. Push (ask first)

**Pushing is never automatic.** Ask before `git push`, every time. Approval to
commit is not approval to push; approval to push once is not standing approval.

The documentation commit may ride along with a later feature or release push.
Pushing is governed by the release process in `docs/change-control.md`.

## 3. Deploy (separate approval — never implicit)

**Deployment is not part of an engineering session.** No step in the Operating
Manual authorises it. It requires explicit, separate human approval and follows
[`../checklists/PRODUCTION_RELEASE.md`](../checklists/PRODUCTION_RELEASE.md).

Specifically, an agent must never:

- run a deployment command or trigger a hosted deploy,
- push to a branch that auto-deploys,
- run migrations against production,
- modify production configuration or secrets.

Production is reached by a human who has read the release checklist. If you
believe a deploy is warranted, say so and stop.

## 4. What changes require what

| Change | Build | Local commit | Push | Deploy |
|---|---|---|---|---|
| Docs only (`docs/`, `.engineering/`) | not required — say why | required | ask | no |
| Comment-only edit in a source file | run it (a code file changed) | required | ask | no |
| Application source | required | required | ask | separate approval |
| Schema / migration | required | required | ask | separate approval + release checklist |

"Not required" never means "silently skipped". State that the build was not run
and why.

## 5. Commit message shape

```
<WORKSTREAM> — <what changed, imperative>

<why, if not obvious from the diff>
```

Keep the subject under ~72 characters. Reference the rollback identifier in the
body for structural work.
