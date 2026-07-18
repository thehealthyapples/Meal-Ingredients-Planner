# Engineering Session Recovery Protocol

**Status:** Active developer tooling (ESR2, 2026-07-10). Developer-only.
**Scope:** How Claude Code implementation sessions record and recover work.
**Non-goals:** No product behaviour, no schema, and no production data are
affected by this protocol. It touches only `.engineering/` and `.claude/`.

This protocol makes interrupted sessions recoverable in under a minute. The
recovery files live in [`../session/README.md`](../session/README.md); this
document defines *when and how* they are updated.

---

## 1. Principles

- **Recover from files, not history.** Everything needed to resume lives in
  `.engineering/session/`. Recovery works even if `claude --continue` / session
  history is unavailable.
- **Concise progress only.** Record engineering state — stage, checkpoints, next
  action, blockers. **Never** record chain-of-thought or conversation
  transcripts.
- **One file per session.** Each session owns `runs/<SESSION_ID>.md`. This is
  what makes **simultaneous sessions safe** — no two sessions write the same
  file. The one shared file, `CURRENT.md`, is written under a lock.
- **Always keep "Next action" true.** On resume, Claude does exactly what that
  field says. It is the single most important field.
- **Tooling, not documentation.** This lives at top-level `.engineering/`, not
  under `docs/`, because it describes how the codebase is built rather than what
  it is. It must never reach the application or production.

## 2. Session ID

Derive a canonical Session ID from the EWO / implementation name, e.g.
`BENCH3_Benchmark_Platform_Integration`, `UX4_Comparison_Swipe_Cards`,
`NK6J_Canonical_Food_Batch_001`. Use it as the run filename.

## 3. Lifecycle

1. **Rollback first.** Create rollback protection (annotated git tag) per
   `ENGINEERING_WORKFLOW.md` STEP 1 and capture the identifier.
2. **Open a run file.** `.engineering/scripts/session-new.sh <SESSION_ID>
   "<objective>" <rollback-tag>` — copies the template, fills the header, and
   registers the session. (Doing it by hand is equally valid.)
3. **Work through the stages**, updating the run file at each trigger point (§4).
   Standard stages: Planning → Rollback Complete → Implementation → Testing →
   Verification → Documentation → Waiting for User → Complete (or Blocked).
4. **Close out.** `.engineering/scripts/session-complete.sh <SESSION_ID>` moves
   the row from `CURRENT.md` to `INDEX.md` and sets the marker to `ESR:IDLE` if
   no sessions remain active. Before it moves anything it runs
   `repo-structure-verify.sh` as a **canonical filing gate** (DOCGOV1): if any
   report is misfiled, a stray sits at the root, or a new architecture document
   is unindexed, completion is refused and nothing is moved. Canonical filing is
   therefore self-enforcing — fix the filing and re-run to close out.

## 4. When to update the session record (mandatory triggers)

Update the active run file (and `CURRENT.md`'s Stage / Next action):

1. **Immediately after rollback protection** — set stage `Rollback Complete` and
   record the Rollback ID.
2. **Before every long-running operation** — builds, tests, benchmarks, imports,
   migrations. Set a `Next action` that assumes the operation may be interrupted
   mid-run.
3. **After every significant implementation milestone** — tick the checkpoint,
   update `Last checkpoint` and `Next action`.
4. **Before the final response to the user** — reconcile stage and `Next action`
   so the file is accurate the instant a disconnect could happen.

Keep each update to a few lines. The goal is resumability, not a journal.

## 5. Automatic updates (hooks)

The installed Claude Code (2.1.x) supports hooks, so two are wired in
[`../../.claude/settings.json`](../../.claude/settings.json):

| Hook | Script | Effect |
|---|---|---|
| `SessionStart` | `.engineering/hooks/session-recovery-start.sh` | If a session is active (`ESR:ACTIVE` in `CURRENT.md`), injects a pointer telling Claude to read `CURRENT.md` and continue from **Next action**, preserving the Rollback ID. |
| `Stop` | `.engineering/hooks/session-recovery-stop.sh` | Before the final response, stamps a freshness heartbeat timestamp into `CURRENT.md`, under a lock. |

Both hooks are **non-blocking and idempotent** — they always `exit 0`, guard on
file existence, and act only when a session is active, so they never interfere
with ordinary turns or with sessions that opt out.

**What hooks do and do not do.** Hooks prove the files are *current* (heartbeat)
and *surfaced* (SessionStart pointer). They deliberately do **not** author
engineering semantics — a shell hook cannot know the current checkpoint or the
next action. Those fields are written by Claude at the §4 triggers. This split is
intentional: automation guarantees freshness and visibility; the agent guarantees
meaning.

Hooks require the project to be trusted in this Claude Code install. Verify with
`/hooks`; if they are not listed, approve them once.

## 6. Fallback when hooks are unavailable

If a future environment lacks hook support (older Claude Code, a different
client, or hooks disabled), the system still works with **zero** infrastructure —
the fallback is simply the §4 discipline applied manually:

- Claude updates `runs/<SESSION_ID>.md` and `CURRENT.md` directly (via the
  editor) at each of the four trigger points in §4.
- The `SessionStart` pointer is replaced by the human prompt documented in
  `../session/README.md` → *One-minute recovery guide*, step 3.
- Nothing else changes: the same files, the same fields, the same recovery steps.

Because the recovery contract is file-based, hooks are an accelerator, not a
dependency. This is the simplest documented fallback and requires no tooling.

## 7. Recovery (operator steps)

See [`../session/README.md` → One-minute recovery guide](../session/README.md#one-minute-recovery-guide).
In short: `claude --continue`; if that fails, start Claude and prompt:
*"Read .engineering/session/CURRENT.md and continue the active session."*

## 8. Boundaries

`.engineering/` is developer tooling and must never become part of the
application, be deployed, expose APIs or UI, create database tables, store user
or business data, or integrate with the Intelligence Platform. See
[`../README.md`](../README.md). `.engineering/scripts/session-verify.sh` asserts
these mechanically.

## 9. Definition of Done

- [x] Lives at top-level `.engineering/`, not under `docs/`.
- [x] Multiple simultaneous sessions supported (one run file per Session ID;
      locked dashboard writes).
- [x] Recovery after disconnect takes under one minute (file-based).
- [x] Recovery works even if Claude session history is unavailable.
- [x] Automatic updates enabled where supported (SessionStart + Stop hooks).
- [x] Documented fallback exists where hooks are unavailable (§6).
- [x] Records only the required fields; no transcripts, no chain-of-thought.
- [x] No product behaviour · no schema · no production data · no API/UI · no
      Intelligence Platform integration.

## 10. History

**ESR1** (2026-07-10) first built this system under `docs/session/`, with hooks in
`.claude/hooks/`. **ESR2** (2026-07-10) relocated it to top-level `.engineering/`
and added the lifecycle and verification scripts, because the system is build
tooling rather than product documentation. The ESR1 run file is retained at
`../session/runs/ESR1_Engineering_Session_Recovery.md` as history; its file paths
are historical and no longer exist. No ESR1 file was ever committed, so the move
lost nothing.
