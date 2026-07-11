#!/usr/bin/env bash
# SessionStart hook — Engineering Session Recovery
#
# Injects a pointer to the active session dashboard so a resumed or freshly
# started Claude Code session immediately knows there may be interrupted work
# to continue. Non-destructive: it only reads files and prints context.
#
# Always exits 0 — a recovery hook must never block a session from starting.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CURRENT="$ROOT/.engineering/session/CURRENT.md"

# Nothing to recover if the dashboard is absent.
[ -f "$CURRENT" ] || exit 0

# Only speak up when at least one session is marked active. Match the marker
# LINE exactly — CURRENT.md's own comment block mentions both "ESR:ACTIVE" and
# "ESR:IDLE" as prose, so a bare substring grep is always true.
grep -qx "<!-- ESR:ACTIVE -->" "$CURRENT" || exit 0

MSG="Engineering Session Recovery is ACTIVE. If you are resuming interrupted work: read .engineering/session/CURRENT.md, open the active run file under .engineering/session/runs/, and continue from its \"Next action\". Preserve the recorded Rollback identifier and keep the run file updated at each trigger point per .engineering/protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md."

# Emit the pointer as SessionStart additionalContext (JSON on stdout).
printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":%s}}\n' \
  "$(printf '%s' "$MSG" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')"

exit 0
