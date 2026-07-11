#!/usr/bin/env bash
# Stop hook — Engineering Session Recovery
#
# Stamps an automatic freshness heartbeat into .engineering/session/CURRENT.md
# just before Claude's final response, so the recovery files always reflect the
# latest activity time even if the session is interrupted immediately after.
#
# The heartbeat is a FRESHNESS SIGNAL only. It does NOT author engineering
# progress — checkpoints, stage, and "Next action" are written by Claude
# following ENGINEERING_SESSION_RECOVERY_PROTOCOL.md. A shell hook cannot
# know the semantics of the work; it can only prove the files are current.
#
# To avoid churn on ordinary conversational turns, it updates only when a
# session is actually marked active (ESR:ACTIVE). Always exits 0.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CURRENT="$ROOT/.engineering/session/CURRENT.md"

[ -f "$CURRENT" ] || exit 0

# Match the marker LINE exactly — CURRENT.md's own comment block mentions both
# "ESR:ACTIVE" and "ESR:IDLE" as prose, so a bare substring grep is always true.
grep -qx "<!-- ESR:ACTIVE -->" "$CURRENT" || exit 0

STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Simultaneous sessions can reach Stop at the same instant; serialise the write.
exec 9>"$ROOT/.engineering/session/.CURRENT.lock"
flock -w 5 9 || exit 0

python3 - "$CURRENT" "$STAMP" <<'PY'
import re, sys
path, stamp = sys.argv[1], sys.argv[2]
with open(path) as f:
    s = f.read()
line = f"_Last automatic heartbeat (Stop hook): {stamp} UTC_"
if "_Last automatic heartbeat" in s:
    s = re.sub(r"_Last automatic heartbeat[^\n]*_", line, s)
else:
    s = s.rstrip() + "\n\n" + line + "\n"
with open(path, "w") as f:
    f.write(s)
PY

exit 0
