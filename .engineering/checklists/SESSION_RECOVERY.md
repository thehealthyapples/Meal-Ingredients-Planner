# Checklist — Session Recovery

You were disconnected. This gets you back to work in under a minute, without
losing the rollback identifier or redoing finished work.

Protocol: [`../protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`](../protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md).

## Recover

- [ ] From the project root, run:

      ```
      claude --continue
      ```

- [ ] If that fails (history lost, new machine, different client), start Claude and say:

      > Read .engineering/session/CURRENT.md and continue the active session.

- [ ] Open [`../session/CURRENT.md`](../session/CURRENT.md). Find the active row.
      If more than one session is live, pick the **Session ID** matching your work.
- [ ] Open that session's run file under `../session/runs/`.

## Re-establish state before touching anything

- [ ] Read **Next action**. That is what you do next — not what you remember doing.
- [ ] **Preserve the recorded Rollback identifier. Never regenerate it.**
- [ ] Read **Last checkpoint** and **Blockers**.
- [ ] Run `git status`. Reconcile it with the run file's *Files being modified*.
      If they disagree, trust the filesystem and correct the run file.
- [ ] Confirm work recorded as complete actually is. A checkpoint written just
      before a disconnect may describe an action that never finished.

## Resume

- [ ] Continue from **Next action**.
- [ ] Update the run file at each trigger point, as normal.
- [ ] If the interruption left the tree in a broken intermediate state, say so
      before continuing — do not quietly repair and proceed.

## If recovery fails

- [ ] The dashboard marker (`ESR:ACTIVE` / `ESR:IDLE`) is on line 1 of
      `CURRENT.md`. If it reads `ESR:IDLE`, no session is live — start a new one.
- [ ] Hooks not firing? Check they are trusted in this install: `/hooks`.
- [ ] Run file missing but the row exists? The session was interrupted before the
      first checkpoint. Start again from the recorded rollback identifier.

## Close

- [ ] When the work completes, `.engineering/scripts/session-complete.sh <SESSION_ID>`
      moves the row to `INDEX.md` and marks the dashboard idle if it was the last.
