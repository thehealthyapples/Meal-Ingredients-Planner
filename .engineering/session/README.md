# Engineering Session Recovery

A permanent, developer-only system so an interrupted Claude Code session can
always be resumed quickly — even after a Replit disconnect, and even if Claude's
own session history is unavailable.

This directory records **concise engineering progress only** — enough to safely
resume work. It never records chain-of-thought or conversation transcripts.

---

## One-minute recovery guide

You were disconnected. Do this:

1. Open a terminal in the project root.
2. Run:

   ```
   claude --continue
   ```

3. If that fails (history lost, new machine, different client), start Claude
   normally and paste:

   > Read .engineering/session/CURRENT.md and continue the active session.

4. Claude then:
   - reads `CURRENT.md` and finds the active session row(s),
   - opens that session's run file under `runs/`,
   - resumes from its **Next action**,
   - preserves the recorded **Rollback identifier**,
   - keeps updating the run file as it works.

That is the whole procedure. It works because every fact needed to resume is in
these files, not in Claude's memory. If more than one session is active, pick the
row whose **Session ID** matches the work you were doing.

**To undo instead of resume:** take the Rollback identifier from the run file and
run `git checkout <rollback-tag>`.

---

## Layout

```
.engineering/session/
├── README.md      ← you are here (entry point + one-minute recovery)
├── CURRENT.md     ← dashboard of ACTIVE sessions (read this first to recover)
├── INDEX.md       ← historical index of all sessions
└── runs/
    ├── _TEMPLATE.md          ← copied to start a session
    └── <SESSION_ID>.md       ← one run file per session
```

## Session IDs

Every implementation session has a canonical **Session ID** derived from its
EWO / implementation name, for example:

- `BENCH3_Benchmark_Platform_Integration`
- `UX4_Comparison_Swipe_Cards`
- `NK6J_Canonical_Food_Batch_001`

The run file is named `runs/<SESSION_ID>.md`. Because each session owns a
distinct file, **multiple simultaneous Claude Code sessions are supported** —
they never contend for the same file. `CURRENT.md` lists every live session, and
writes to it are lock-guarded.

## What each run file records

Exactly these fields, and nothing else:

| Field | Purpose |
|---|---|
| Session ID | Canonical name, derived from the EWO |
| Rollback ID | The git tag to return to if the work is abandoned |
| Objective | What this session must achieve |
| Current stage | Where in the lifecycle the work is |
| Files being modified | What is in flight |
| Last checkpoint | The last thing definitely finished |
| Next action | The single next concrete step — the key field on resume |
| Blockers | What is preventing progress, if anything |

**Standard stages:** Planning → Rollback Complete → Implementation → Testing →
Verification → Documentation → Waiting for User → Complete (or Blocked).

## Starting a new session

```
.engineering/scripts/session-new.sh <SESSION_ID> "<objective>" <rollback-tag>
```

That copies the template, fills the header, and registers the session in
`CURRENT.md`. On completion:

```
.engineering/scripts/session-complete.sh <SESSION_ID>
```

which moves the row to `INDEX.md` and marks the dashboard `ESR:IDLE` when no
sessions remain active. Both steps can also be done by hand — the scripts are a
convenience, not a dependency.

## How updates happen

Where the installed Claude Code supports hooks (it does here — see
`.claude/settings.json`), the recovery files are kept current **automatically**:

- A **SessionStart** hook injects a pointer to `CURRENT.md` on every new or
  resumed session, so Claude always knows to continue recorded work.
- A **Stop** hook stamps a freshness heartbeat into `CURRENT.md` before Claude's
  final response.

The substantive progress fields (checkpoints, stage, next action) are written by
Claude at defined trigger points. The full rules — including the manual fallback
for environments without hooks — are in
[`../protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`](../protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md).

## Boundaries

This is engineering tooling. It is not part of The Healthy Apples. It has no
runtime, no API, no UI, no database tables, and stores no user or business data.
See [`../README.md`](../README.md).
