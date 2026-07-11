# shellcheck shell=bash
#
# Development shell wiring — sourced, never executed.
#
# Replit's own ~/.bashrc (a read-only symlink into the Nix store) ends with:
#
#     BASHRC="${REPL_HOME}/.config/bashrc"
#     if [[ -f "${BASHRC}" ]] && [[ -z "${REPLIT_MODE}" ]]; then
#         source "${BASHRC}"
#     fi
#
# That path is inside the repository, so it is the sanctioned, version-controllable
# hook for every interactive shell tab. `.config/bashrc` is a stub that sources this
# file; this file is where the actual wiring lives.
#
# All it does is put scripts/dev/bin on PATH, which is what makes `call` a command.
#
# See docs/implementation/engineering/ENGINEERING_CLAUDE_LAUNCHER.md

__dev_bin="$(cd "$(dirname "${BASH_SOURCE[0]}")/../bin" 2>/dev/null && pwd)"

if [ -n "$__dev_bin" ] && [ -d "$__dev_bin" ]; then
  # Idempotent: re-sourcing the shell must not grow PATH.
  case ":${PATH}:" in
    *":${__dev_bin}:"*) ;;
    *) PATH="${__dev_bin}:${PATH}" ; export PATH ;;
  esac
fi

unset __dev_bin
