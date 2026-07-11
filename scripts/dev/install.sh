#!/usr/bin/env bash
#
# Idempotent repair for the `call` launcher wiring.
#
# You should not normally need this: `.config/bashrc` and the launcher scripts are
# committed with their executable bits, so a fresh clone or a reopened Replit
# workspace already works. Run it only if `call` stops being found — e.g. someone
# deleted `.config/bashrc`, or a file lost its +x bit.
#
#   bash scripts/dev/install.sh
#
# Then open a new shell tab (or `source .config/bashrc`) to pick up PATH.
#
# See docs/implementation/engineering/ENGINEERING_CLAUDE_LAUNCHER.md
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STUB="$REPO_ROOT/.config/bashrc"

# 1. Executable bits on everything meant to be run.
chmod +x "$REPO_ROOT/scripts/dev/bin/call"
chmod +x "$REPO_ROOT"/scripts/dev/launchers/*.sh
echo "ok: executable bits set on scripts/dev/bin/call and scripts/dev/launchers/*.sh"

# 2. The Replit shell hook. Restored only if missing — never clobber a customised one.
if [ -f "$STUB" ]; then
  echo "ok: .config/bashrc already present"
else
  mkdir -p "$REPO_ROOT/.config"
  cat > "$STUB" <<'STUB_EOF'
# shellcheck shell=bash
# Sourced automatically by Replit's ~/.bashrc for every interactive shell tab.
# Keep this a stub. Real logic belongs in scripts/dev/, which git tracks normally.
# See docs/implementation/engineering/ENGINEERING_CLAUDE_LAUNCHER.md
__repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." 2>/dev/null && pwd)"
if [ -n "$__repo_root" ] && [ -f "$__repo_root/scripts/dev/shell/replit-bashrc.sh" ]; then
  . "$__repo_root/scripts/dev/shell/replit-bashrc.sh"
fi
unset __repo_root
STUB_EOF
  echo "restored: .config/bashrc"
  echo "note: .config/ is ignored by the system-wide /etc/.gitignore."
  echo "note: commit it with  git add -f .config/bashrc"
fi

echo
echo "done. open a new shell tab, then run:  call claude"
