# ESR2 — Engineering Session Recovery: Implementation Report

**Date:** 2026-07-10
**Session ID:** `ESR2_Engineering_Session_Recovery`
**Status:** Complete
**Type:** Developer tooling. No product change.

---

## 1. Rollback identifier

```
rollback/ESR2-engineering-session-recovery-20260710  →  678b1aee2eeb2df775d1bc7f163c30eda1d39df4
```

Annotated git tag created before any file was touched, per `ENGINEERING_WORKFLOW.md`
STEP 1. To undo this work entirely:

```bash
git checkout rollback/ESR2-engineering-session-recovery-20260710
rm -rf .engineering            # untracked; the tag does not remove it
git checkout -- .claude/settings.json 2>/dev/null || true
```

## 2. Context — this supersedes ESR1

An earlier session (`ESR1`, same day) had already built this system, but under
`docs/session/` with hooks in `.claude/hooks/`. That is the wrong location: this
is build tooling, not product documentation.

Before migrating, ESR1's files were confirmed **untracked** (never committed) and
**unreferenced** by anything outside themselves. The move therefore lost nothing
and broke no links. ESR1's run file is preserved as history at
`session/runs/ESR1_Engineering_Session_Recovery.md`, annotated to say its paths
are historical. `docs/session/` no longer exists.

## 3. Files created

```
.engineering/
├── README.md                                     boundaries; why it is never deployed
├── session/
│   ├── README.md                                 entry point + one-minute recovery guide
│   ├── CURRENT.md                                live dashboard of ACTIVE sessions
│   ├── INDEX.md                                  historical index
│   ├── .gitignore                                ignores the dashboard lock file
│   └── runs/
│       ├── _TEMPLATE.md                          run-file template
│       ├── ESR1_Engineering_Session_Recovery.md  migrated history (superseded)
│       └── ESR2_Engineering_Session_Recovery.md  this session
├── hooks/
│   ├── session-recovery-start.sh                 SessionStart — injects recovery pointer
│   └── session-recovery-stop.sh                  Stop — stamps freshness heartbeat
├── scripts/
│   ├── session-new.sh                            open + register a session
│   ├── session-complete.sh                       close a session; CURRENT → INDEX
│   └── session-verify.sh                         assert the hard boundaries
└── protocol/
    ├── ENGINEERING_SESSION_RECOVERY_PROTOCOL.md  when/how records are updated
    └── ESR2_IMPLEMENTATION_REPORT.md             this report
```

> **Amended by `EOM1` (2026-07-10).** The tree above records what ESR2 created and
> is left as written. Since then: `protocol/` was renamed `protocols/` (which now
> holds only protocols and standards), and this report moved to
> `.engineering/reports/implementation/ESR2_IMPLEMENTATION_REPORT.md` — because a
> protocol says *how* engineering is performed, while a report records *what* was
> performed. See
> [`EOM1_IMPLEMENTATION_REPORT.md`](./EOM1_IMPLEMENTATION_REPORT.md).

**Modified:** `.claude/settings.json` — the two hook commands repointed from
`.claude/hooks/` to `.engineering/hooks/`.

**Deleted:** `docs/session/` (4 files) and `docs/implementation/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`
— all untracked ESR1 artefacts, migrated into `.engineering/`.

No tracked file was modified. `.engineering/` contains no TypeScript.

## 4. Hooks — enabled

**Yes.** Claude Code 2.1.206 supports hooks, and both are wired in
`.claude/settings.json`:

| Hook | Effect |
|---|---|
| `SessionStart` | If the dashboard marker is `ESR:ACTIVE`, injects a pointer telling Claude to read `CURRENT.md`, open the active run file, and continue from **Next action**, preserving the Rollback ID. |
| `Stop` | Before the final response, stamps a freshness heartbeat into `CURRENT.md` under a lock. |

Both always `exit 0`, guard on file existence, and act only when a session is
active — a recovery hook must never block a session from starting.

Hooks author **freshness and visibility**, never engineering semantics. A shell
script cannot know what the next action is; Claude writes those fields at the
protocol's four trigger points. Where hooks are unavailable, §6 of the protocol
documents the fallback: the same four triggers applied manually, to the same
files. The recovery contract is file-based, so hooks are an accelerator, not a
dependency.

They require the project to be trusted in the local Claude Code install. If
`/hooks` does not list them, approve once.

## 5. Verification completed

`.engineering/scripts/session-verify.sh` — **18/18 checks pass.**

Structural boundary proofs, not keyword assertions:

| Requirement | How it was verified | Result |
|---|---|---|
| Never part of the application | `grep` for `.engineering` across `client/ server/ shared/` | no references |
| No API, UI, or DB tables | directory contains only `.md`, `.sh`, `.gitignore` — 0 `.ts/.tsx/.js/.sql` files, so it cannot mount a route, render a component, or declare a table | structurally impossible |
| Never deployed | `script/build.ts` bundles only `client/ server/ shared/` → `dist/`; prod runs `node dist/index.cjs`. `.engineering` is not an input | unreachable from build |
| No user/business data | hooks and scripts touch no database and no network (no `psql`, `DATABASE_URL`, `drizzle`, `curl`, `wget`) | verified |
| No Intelligence Platform integration | no code files exist here to import it | structurally impossible |
| No transcripts / chain-of-thought | `runs/` scanned for speaker-prefixed lines (`User:`, `Assistant:`, …) | none |
| Hooks non-blocking | both executed with no dashboard present | both `exit 0` |

Behaviour exercised end-to-end, not merely inspected:

- **SessionStart hook** emitted valid JSON `additionalContext` against the live dashboard.
- **Stop hook** wrote the heartbeat, and is idempotent — run twice, still exactly one heartbeat line.
- **Simultaneous sessions:** two `session-new.sh` invocations run concurrently both
  registered; all rows survived, the table stayed well-formed (5 cells each). The
  `flock` guard on `CURRENT.md` holds.
- **Full lifecycle** in an isolated copy: `session-new` → `session-complete` moved the
  row to `INDEX.md`, flipped the marker to `ESR:IDLE` at the last session, and the
  SessionStart hook then correctly went silent.
- **Error path:** completing a non-active session fails cleanly with exit 1.
- **Typecheck:** `npx tsc --noEmit` fails only in `server/tests/test-slot-filling-recovery.ts`
  and `server/tests/test-tier4-shell-recovery-activation.ts` — both **clean at `HEAD`**,
  untouched by ESR2, pre-existing. `.engineering/` contributes no TypeScript.

### Bug found and fixed during verification

ESR1's hooks tested for an active session with `grep -q "ESR:ACTIVE" CURRENT.md`.
But `CURRENT.md`'s own instructional comment block contains the literal strings
`"ESR:ACTIVE"` and `ESR:IDLE` as prose, so **the substring match was always true**.
An idle dashboard would have announced a live session to every new Claude session
forever, telling it to resume work that had already finished. The same flaw made
`session-complete.sh` report "marked ESR:IDLE" while the marker still read
`ESR:ACTIVE`.

Fixed in both hooks and the completion script by matching the marker **line**
exactly (`grep -qx "<!-- ESR:ACTIVE -->"`). The old logic was reproduced against a
synthetic idle dashboard to confirm it misfired, and the new logic to confirm it
stays silent. A regression test for this exact case is now check #18 in
`session-verify.sh`.

## 6. Recovery contract

After any disconnect:

```
claude --continue
```

or, if session history is gone:

> Read .engineering/session/CURRENT.md and continue the active session.

Under a minute, because every fact needed to resume — Session ID, Rollback ID,
objective, stage, files in flight, last checkpoint, next action, blockers — lives
in the run file, not in Claude's memory.

## 7. Trust check

- Rollback identifier reported before any change: **yes**.
- Governing architecture read first (`docs/architecture/README.md`): **yes**. This
  work is developer tooling and touches no governed surface — no Intelligence
  Platform binding, no capability, no schema — so no Architecture Compliance or AI
  Architecture Compliance gate applies.
- Claims in this report were executed, not assumed. Every "verified" above
  corresponds to a command that ran and passed.
- Product behaviour, database schema, and production data: **unchanged**.
