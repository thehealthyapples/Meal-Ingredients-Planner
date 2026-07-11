<!-- ESR:IDLE -->
<!--
  Engineering Session Recovery — ACTIVE-SESSION DASHBOARD
  Keep the marker above as "ESR:ACTIVE" while ANY session below is live.
  Change it to "ESR:IDLE" only when every session has moved to the archive
  (INDEX.md) and the table is empty. The Claude Code hooks read this marker.
-->

# Active Sessions — Recovery Dashboard

This is the first file to read when recovering an interrupted session.
Find the active session, open its run file, and continue from **Next action**.

| Session ID | Stage | Rollback ID | Next action | Run file |
|---|---|---|---|---|

> Multiple rows may be active at once — simultaneous Claude Code sessions are
> supported. Each session owns exactly one run file named by its Session ID, so
> concurrent sessions never write to the same file, and writes to this dashboard
> are serialised with a lock.

When a session reaches **Complete**, move its row out of this table and add a
line to [INDEX.md](./INDEX.md) — `.engineering/scripts/session-complete.sh` does
both. If no active sessions remain, set the top marker to `ESR:IDLE`.

_Last automatic heartbeat (Stop hook): 2026-07-10T07:24:52Z UTC_
