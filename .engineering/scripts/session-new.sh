#!/usr/bin/env bash
# Start a new Engineering Session Recovery session.
#
#   .engineering/scripts/session-new.sh <SESSION_ID> "<objective>" <rollback-tag>
#
# Creates runs/<SESSION_ID>.md from the template and registers the session in
# CURRENT.md. Safe to run while other sessions are active: each session owns its
# own run file, and the shared dashboard write is lock-guarded.
set -euo pipefail

SESSION_ID="${1:-}"
OBJECTIVE="${2:-}"
ROLLBACK="${3:-}"

if [ -z "$SESSION_ID" ] || [ -z "$OBJECTIVE" ] || [ -z "$ROLLBACK" ]; then
  echo "usage: $0 <SESSION_ID> \"<objective>\" <rollback-tag>" >&2
  echo "example: $0 UX4_Comparison_Swipe_Cards \"Ship swipe cards\" rollback/ux4-20260710" >&2
  exit 2
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SESSION_DIR="$ROOT/.engineering/session"
RUN="$SESSION_DIR/runs/$SESSION_ID.md"
CURRENT="$SESSION_DIR/CURRENT.md"

if [ -e "$RUN" ]; then
  echo "error: run file already exists: $RUN" >&2
  echo "       resume it instead, or choose a different Session ID." >&2
  exit 1
fi

STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

sed -e "s|<SESSION_ID>|$SESSION_ID|g" \
    -e "s|<git tag created as rollback protection>|$ROLLBACK|" \
    -e "s|<YYYY-MM-DDTHH:MM:SSZ UTC>|$STAMP UTC|" \
    -e "s|<one or two sentences: what this session must achieve>|$OBJECTIVE|" \
    "$SESSION_DIR/runs/_TEMPLATE.md" \
  | grep -v '^<!-- Copy to' | grep -v '^<!-- SESSION_ID is derived' \
  > "$RUN"

# Register in the dashboard: append a row and force the ACTIVE marker.
exec 9>"$SESSION_DIR/.CURRENT.lock"
flock -w 10 9

python3 - "$CURRENT" "$SESSION_ID" "$ROLLBACK" <<'PY'
import sys
path, sid, rollback = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path) as f:
    lines = f.read().split("\n")

row = (f"| `{sid}` | Planning | `{rollback}` | "
       f"Fill in the first concrete step | [runs/{sid}.md](./runs/{sid}.md) |")

# Insert after the last existing table row (lines starting with "| `").
last = max((i for i, l in enumerate(lines) if l.startswith("| `")), default=None)
if last is None:
    # Empty table: insert after the header separator.
    last = next(i for i, l in enumerate(lines) if set(l.strip()) <= set("|-") and "|" in l)
lines.insert(last + 1, row)

out = "\n".join(lines).replace("<!-- ESR:IDLE -->", "<!-- ESR:ACTIVE -->", 1)
with open(path, "w") as f:
    f.write(out)
PY

echo "Session started: $SESSION_ID"
echo "  run file : .engineering/session/runs/$SESSION_ID.md"
echo "  rollback : $ROLLBACK"
echo "  dashboard: .engineering/session/CURRENT.md (marked ESR:ACTIVE)"
echo
echo "Next: fill in Objective / Files being modified / Next action in the run file."
