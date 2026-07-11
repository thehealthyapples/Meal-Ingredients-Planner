#!/usr/bin/env bash
# Assert the hard boundaries of .engineering/ — see .engineering/README.md.
#
#   .engineering/scripts/session-verify.sh
#
# Exits non-zero if this tooling has started leaking into the application.
# Run it after changing anything under .engineering/.
#
# The checks are STRUCTURAL, not keyword-based: prose in these documents is
# allowed to discuss databases and the Intelligence Platform, but no file here
# may be code that touches them. Nothing greps for words it is itself allowed
# to contain.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

fail=0
check() { # check <description> <0-if-ok>
  if [ "$2" -eq 0 ]; then printf '  PASS  %s\n' "$1"
  else printf '  FAIL  %s\n' "$1"; fail=1; fi
}

echo "Engineering Session Recovery — boundary verification"
echo

# --- Structure -------------------------------------------------------------
for p in session/CURRENT.md session/INDEX.md session/README.md session/runs \
         hooks scripts protocols standards templates checklists \
         reports/implementation reports/investigations \
         README.md OPERATING_MANUAL.md; do
  [ -e ".engineering/$p" ]; check "exists: .engineering/$p" $?
done

# Protocols define HOW engineering is performed; reports record WHAT was
# performed. They must never share a folder.
[ -z "$(find .engineering/protocols -name '*_REPORT.md' -o -name '*_IMPLEMENTATION_REPORT.md' 2>/dev/null)" ]
check "protocols/ contains no implementation reports" $?

# --- Not part of the application -------------------------------------------

# 1. Application code must never reference this directory.
! grep -rIq --exclude-dir=node_modules "\.engineering" client server shared 2>/dev/null
check "no client/server/shared reference to .engineering" $?

# 2. No executable application code lives here. Markdown + shell + .gitignore
#    only. This is what structurally guarantees the four checks below: a
#    directory with no .ts/.tsx/.js/.sql cannot declare a table, mount a route,
#    render a component, or bind an Intelligence capability.
offenders="$(find .engineering -type f \
  ! -name '*.md' ! -name '*.sh' ! -name '.gitignore' ! -name '.CURRENT.lock')"
[ -z "$offenders" ]
check "contains only .md, .sh, .gitignore (no .ts/.tsx/.js/.sql)" $?
[ -n "$offenders" ] && printf '        unexpected: %s\n' $offenders

# 3. The shell scripts must not reach a database or the network. (Scoped to
#    executable files: the .md documents may freely discuss these things.
#    The two verify scripts are excluded — they necessarily name the patterns
#    they police: this one hunts them, and repo-structure-verify.sh lists
#    drizzle.config.ts among the files permitted at the repository root.)
! grep -rIqE "psql|DATABASE_URL|drizzle|curl |wget " \
    --exclude="session-verify.sh" --exclude="repo-structure-verify.sh" \
    .engineering/hooks .engineering/scripts
check "hooks/scripts touch no database and no network" $?

# 4. Not reachable from the production build.
! grep -Iq "engineering" script/build.ts 2>/dev/null
check "not an input to script/build.ts" $?

# 5. Session records must contain no conversation transcript. Scoped to runs/,
#    and matched on transcript SHAPE (speaker-prefixed lines), not on keywords.
! grep -rIqE "^(User|Assistant|Human|Claude): " .engineering/session/runs 2>/dev/null
check "no conversation transcripts in session records" $?

# --- Hooks are safe --------------------------------------------------------

# 6. Executable.
for h in .engineering/hooks/*.sh; do
  [ -x "$h" ]; check "executable: $h" $?
done

# 7. Non-blocking: a recovery hook must exit 0 even with no dashboard present,
#    or it would stop every Claude session from starting. Prove it, don't assume.
tmp="$(mktemp -d)"
( cd "$tmp" && bash "$ROOT/.engineering/hooks/session-recovery-start.sh" >/dev/null 2>&1 )
check "SessionStart hook exits 0 with no dashboard present" $?
( cd "$tmp" && bash "$ROOT/.engineering/hooks/session-recovery-stop.sh" >/dev/null 2>&1 )
check "Stop hook exits 0 with no dashboard present" $?

# 8. An IDLE dashboard must produce NO recovery announcement. Regression test:
#    CURRENT.md's comment block names both "ESR:ACTIVE" and "ESR:IDLE" as prose,
#    so a substring grep would wrongly fire on an idle board, telling every new
#    session to resume work that finished. The marker must be matched as a line.
mkdir -p "$tmp/.engineering/session"
printf '<!-- ESR:IDLE -->\n<!--\n  Keep the marker above as "ESR:ACTIVE" while ANY session is live.\n-->\n' \
  > "$tmp/.engineering/session/CURRENT.md"
out="$( cd "$tmp" && bash "$ROOT/.engineering/hooks/session-recovery-start.sh" 2>/dev/null )"
[ -z "$out" ]
check "SessionStart hook stays silent on an ESR:IDLE dashboard" $?
rm -rf "$tmp"

echo
if [ "$fail" -eq 0 ]; then
  echo "All boundary checks passed."
else
  echo "Boundary violations found — .engineering/ must stay developer-only." >&2
fi
exit "$fail"
