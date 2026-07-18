# THA Engineering Operating Manual

**Status:** Canonical. Established under `EOM1` (2026-07-10).
**Scope:** The process every engineering session on The Healthy Apples follows.
**Audience:** Any engineer or agent about to change this repository.

This document is the **single source of truth for how engineering is performed**.
It does not decide whether a change is architecturally correct — that is
Application Governance, and it lives in
[`docs/architecture/ENGINEERING_WORKFLOW.md`](../docs/architecture/ENGINEERING_WORKFLOW.md).
This manual tells you *when* to invoke that checklist, not what it contains.

---

## The four layers

Everything in this repository belongs to exactly one of these. Confusing them is
the root cause of most structural drift.

| Layer | Lives in | Answers | Ships to production? |
|---|---|---|---|
| **Engineering Governance** | `.engineering/` | *How do we perform engineering?* | **Never** |
| **Application Governance** | `docs/` | *What is the product, and is this change correct?* | No |
| **Runtime Application** | `client/`, `server/`, `shared/`, `migrations/` | *What the product does* | Yes |
| **Production** | The deployed artefact (`dist/`) | *What users actually run* | Is production |

Rules that follow from this:

- **Nothing in `.engineering/` may become part of the application or the
  production deployment.** No API, no UI, no database tables, no user or business
  data, no Intelligence Platform integration. Enforced by
  `.engineering/scripts/session-verify.sh`.
- **Nothing in `docs/` describes how to run a session.** Session process is
  engineering governance and belongs here.
- **Runtime code never imports from `.engineering/` or `docs/`.**
- **Production is reached only by explicit human approval** (Step 11).

See [`standards/ENGINEERING_BOUNDARIES.md`](./standards/ENGINEERING_BOUNDARIES.md).

---

## The workflow

Steps 1–4 are mandatory before any change is made. No exceptions, including for
"small" changes — the cost of a rollback tag is seconds; the cost of not having
one is the session.

### 1. Read Architecture

Read [`docs/architecture/README.md`](../docs/architecture/README.md) — the
canonical index of governing architecture — and the documents it names that bear
on your work. At minimum: `ARCHITECTURE_PRINCIPLES.md` and
`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`.

> **If a proposed change conflicts with the governing architecture: STOP. Explain
> why. Do not continue until approved.**

For any AI-related work, also read the Intelligence Governance documents and
satisfy the **AI Architecture Compliance** block.

### 2. Check Repository Status

```bash
git status
.engineering/scripts/engineering-verify.sh    # structure + boundary + rollback
```

Report whether the tree is clean or intentionally dirty, and **say what the dirt
is**. A working tree carrying someone else's uncommitted work is a hazard: a tag
protects committed state only. If you did not author it, do not touch it and do
not commit it.

### 3. Create Rollback Protection

```bash
git tag -a rollback/<WORKSTREAM>-<slug>-<YYYYMMDD> -m "Rollback point before <WORKSTREAM>" HEAD
git rev-parse "rollback/<WORKSTREAM>-<slug>-<YYYYMMDD>^{commit}"
```

**Report the rollback identifier before proceeding. No implementation may begin
until it is reported.**

A tag captures **committed state only**. If uncommitted work exists, say so
explicitly and snapshot anything you intend to delete. See
[`protocols/ROLLBACK_PROTECTION_PROTOCOL.md`](./protocols/ROLLBACK_PROTECTION_PROTOCOL.md).

### 4. Start / Resume Engineering Session

```bash
# new work
.engineering/scripts/session-new.sh <SESSION_ID> "<objective>" <rollback-tag>

# resuming after a disconnect
claude --continue          # or: "Read .engineering/session/CURRENT.md and continue the active session."
```

The Session ID derives from the EWO name (e.g. `EOM1_Engineering_Operating_Manual`).
Multiple simultaneous sessions are supported — one run file each. Update the run
file at each of the protocol's trigger points. See
[`protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`](./protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md).

### 5. Implement

Work to the declared scope and nothing else. Record excluded scope and any
out-of-scope observation as a **Suggestion** rather than implementing it.

Risk rating and scope discipline: [`standards/RISK_AND_SCOPE_STANDARD.md`](./standards/RISK_AND_SCOPE_STANDARD.md).

### 6. Verify

**Exercise the change; do not merely assert it.** Verification means observing
the behaviour you claim, in the form a user or caller would meet it.

- Run the relevant tests (`npm test`, or the specific `npm run test:*` target).
- Drive the affected path end-to-end where a runtime surface exists.
- When a claim is "no X remains", prove it with a command whose output you show.
- Distinguish failures **you introduced** from failures that **already existed** —
  compare against the rollback tag in a temporary worktree if unsure.

See [`standards/VERIFICATION_STANDARD.md`](./standards/VERIFICATION_STANDARD.md).

### 7. Build

```bash
npm run typecheck     # if types could be affected
npm run build         # if any code file changed
```

If only documentation or `.engineering/` files changed, the build is not
required — **say so and say why**, rather than silently skipping it. A comment
edit inside a source file still counts as a code file changing.

### 8. Review

Re-read the diff as a reviewer would. Confirm:

- Scope lock held; no unrelated refactoring crept in.
- No application behaviour changed unless that was the point of the work.
- No schema change unless explicitly in scope.
- Claims in the report are supported by commands that actually ran.

The relevant checklist from [`checklists/`](./checklists/) is completed here.

### 9. Commit

Group changes into coherent commits. One concern per commit; never mix a
refactor with a behaviour change.

- **A local commit is mandatory** for any task spanning more than a single file
  edit, together with its project document.
- **Do not commit work you did not author and have not reviewed.**
- Report the commit SHA, branch, and rollback identifier.

### 10. Push (optional)

Pushing is **not** automatic. Ask before `git push`. The documentation commit may
ride along with a later feature or release push.

### 11. Deploy (requires separate approval)

**Deployment is never part of an engineering session.** It requires explicit,
separate human approval, and follows the release process. Nothing in this manual
authorises a deploy. See
[`checklists/PRODUCTION_RELEASE.md`](./checklists/PRODUCTION_RELEASE.md) and
[`protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md`](./protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md).

---

## Where the output goes

| Artefact | Home |
|---|---|
| Implementation report (application work) | `docs/implementation/<workstream>/` |
| Investigation (application work) | `docs/investigations/` |
| Implementation report (about `.engineering/` itself) | `.engineering/reports/implementation/` |
| Investigation (about engineering practice) | `.engineering/reports/investigations/` |
| Session record | `.engineering/session/runs/` |

The rule: **a report about the product lives in `docs/`; a report about how we
engineer lives in `.engineering/reports/`.** Naming and folder ownership are
governed by
[`docs/architecture/REPOSITORY_CONVENTIONS.md`](../docs/architecture/REPOSITORY_CONVENTIONS.md).

Templates are in [`templates/`](./templates/). Start from one; do not invent a
shape.

---

## Hard stops

Pause and get explicit approval before any of these:

- A change conflicts with the governing architecture.
- A knowledge claim would render without a source reference.
- An AI-generated health claim appears anywhere in the product.
- A second store of an existing fact is created without a retirement plan.
- A schema change is required that was not in the declared scope.
- Anything would be pushed or deployed.

---

## Quick reference

```
1  Read Architecture ....... docs/architecture/README.md
2  Check Status ........... git status && .engineering/scripts/engineering-verify.sh
3  Rollback ............... git tag -a rollback/<name>-<date>   → REPORT THE ID
4  Session ................ .engineering/scripts/session-new.sh  (or claude --continue)
5  Implement .............. scope-locked
6  Verify ................. exercise it; separate new failures from pre-existing
7  Build .................. npm run build   (if any code file changed)
8  Review ................. complete the checklist
9  Commit ................. local commit mandatory; only what you authored
10 Push ................... ask first
11 Deploy ................. separate approval; never implicit
```

---

## History

Established by `EOM1` (2026-07-10). It consolidates the process content formerly
held in `docs/architecture/ENGINEERING_WORKFLOW.md`, which remains governing
Application Governance and retains the Architecture Compliance Checklist, the AI
Architecture Compliance block, Domain Impact, Trust hard stops, and Architecture
Convergence Status. Neither document restates the other; each invokes the other.
See [`reports/implementation/EOM1_IMPLEMENTATION_REPORT.md`](./reports/implementation/EOM1_IMPLEMENTATION_REPORT.md).
