#!/usr/bin/env bash
# Complete an Engineering Session Recovery session.
#
#   .engineering/scripts/session-complete.sh <SESSION_ID> [final-stage]
#
# Moves the session's row out of CURRENT.md and into INDEX.md. If no active
# sessions remain, flips the dashboard marker to ESR:IDLE so the SessionStart
# hook stops announcing recovery. The run file is kept permanently.
set -euo pipefail

SESSION_ID="${1:-}"
FINAL_STAGE="${2:-Complete}"

if [ -z "$SESSION_ID" ]; then
  echo "usage: $0 <SESSION_ID> [final-stage]" >&2
  exit 2
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SESSION_DIR="$ROOT/.engineering/session"
CURRENT="$SESSION_DIR/CURRENT.md"
INDEX="$SESSION_DIR/INDEX.md"

[ -f "$SESSION_DIR/runs/$SESSION_ID.md" ] || {
  echo "error: no run file for $SESSION_ID" >&2; exit 1; }

exec 9>"$SESSION_DIR/.CURRENT.lock"
flock -w 10 9

DATE="$(date -u +%Y-%m-%d)"

python3 - "$CURRENT" "$INDEX" "$SESSION_ID" "$FINAL_STAGE" "$DATE" <<'PY'
import sys
current, index, sid, stage, date = sys.argv[1:6]

with open(current) as f:
    lines = f.read().split("\n")

marker = f"| `{sid}` |"
row_i = next((i for i, l in enumerate(lines) if l.startswith(marker)), None)
if row_i is None:
    sys.exit(f"error: {sid} is not an active session in CURRENT.md")

cells = [c.strip() for c in lines[row_i].strip().strip("|").split("|")]
rollback = cells[2]  # Session ID | Stage | Rollback ID | Next action | Run file
del lines[row_i]

# No rows left -> dashboard is idle.
if not any(l.startswith("| `") for l in lines):
    lines = [l.replace("<!-- ESR:ACTIVE -->", "<!-- ESR:IDLE -->") for l in lines]

with open(current, "w") as f:
    f.write("\n".join(lines))

# Prepend to INDEX (newest at top): insert after the header separator row.
with open(index) as f:
    ilines = f.read().split("\n")
sep = next(i for i, l in enumerate(ilines) if set(l.strip()) <= set("|-") and "|" in l)
ilines.insert(sep + 1,
    f"| {date} | `{sid}` | {stage} | {rollback} | [runs/{sid}.md](./runs/{sid}.md) |")
with open(index, "w") as f:
    f.write("\n".join(ilines))
PY

echo "Session completed: $SESSION_ID (final stage: $FINAL_STAGE)"
# Match the marker LINE exactly; the file's comment block names both states.
if grep -qx "<!-- ESR:IDLE -->" "$CURRENT"; then
  echo "No active sessions remain — dashboard marked ESR:IDLE."
else
  echo "Other sessions are still active — dashboard stays ESR:ACTIVE."
fi
