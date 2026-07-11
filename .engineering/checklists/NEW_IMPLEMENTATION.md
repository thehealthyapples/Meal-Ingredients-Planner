# Checklist — New Implementation

Complete at Step 8 (Review) of [`../OPERATING_MANUAL.md`](../OPERATING_MANUAL.md).
Template: [`../templates/IMPLEMENTATION_TEMPLATE.md`](../templates/IMPLEMENTATION_TEMPLATE.md).

## Before starting

- [ ] Read `docs/architecture/README.md` and the governing documents it names.
- [ ] Confirmed the change does **not** conflict with governing architecture.
      *(If it does: STOP, explain, get approval.)*
- [ ] `git status` reported; dirty tree explained; other people's uncommitted
      work identified and left alone.
- [ ] Rollback tag created **and the identifier reported**.
- [ ] Session opened (`session-new.sh`) with objective and rollback ID recorded.
- [ ] Risk rated 🟢 / 🟡 / 🔴, with a reason.
- [ ] Scope lock declared: implemented scope, **named** excluded scope.

## Architecture compliance

- [ ] Architecture Compliance Checklist completed (`docs/architecture/ENGINEERING_WORKFLOW.md`).
- [ ] AI Architecture Compliance block completed *(AI-related work only)*.
- [ ] Domain Impact declared; no new store without a retirement plan.
- [ ] Architecture Convergence Status reported *(🔴 RED only)*, evidence-based.

## While implementing

- [ ] Run file updated at each trigger point (stage, checkpoint, next action).
- [ ] Out-of-scope findings recorded as Suggestions, **not implemented**.
- [ ] No schema change unless explicitly in scope.

## Verify

- [ ] The change was **exercised**, not merely read. Behaviour observed.
- [ ] Relevant tests run; output shown.
- [ ] Failures I introduced separated from pre-existing failures
      *(compare against the rollback tag in a worktree if unsure)*.
- [ ] Negative claims ("no X remains") proven by a command whose output is shown.

## Build

- [ ] `npm run typecheck` if types could be affected.
- [ ] `npm run build` if **any** code file changed (a comment counts).
- [ ] If not run: stated explicitly, with the reason.

## Review

- [ ] Diff re-read as a reviewer. Scope lock held.
- [ ] No unrelated refactoring.
- [ ] No application behaviour changed unless that was the point.
- [ ] Every "verified" claim in the report maps to a command that ran.

## Close

- [ ] Implementation report written from the template, filed in
      `docs/implementation/<workstream>/`.
- [ ] Trust Check answered honestly, including what was *not* done.
- [ ] Local commit made; SHA, branch, and rollback ID reported.
- [ ] Push: **asked**, not assumed. Deploy: **not done**.
- [ ] Session closed (`session-complete.sh`).
