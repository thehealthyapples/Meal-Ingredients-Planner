#!/usr/bin/env bash
# Run every engineering-governance verifier — the one command for "is the
# engineering record sound?".
#
#   .engineering/scripts/engineering-verify.sh
#
# Operating Manual Step 2 asks for repo-structure-verify.sh, Step 6 asks for
# verification, and ENGINEERING_BOUNDARIES.md §4 asks for session-verify.sh —
# three separate commands, each remembered independently, and one of them
# (session-verify.sh) was executed by nothing at all until ENGAUTO1. This runs
# all of them, always, in one place.
#
# WHAT THIS IS NOT
# ----------------
# This is NOT a pre-deployment gate and must never become one.
# PRE_DEPLOYMENT_VERIFICATION_GATE.md §1 is explicit: there is exactly one gate
# — the CI job `typecheck · test · build` — and "nothing may be added beside
# it", because a second pipeline is a second answer to "is this safe to ship"
# and within a month the two will disagree.
#
# This script answers a different question, on a different layer: not "is this
# safe to ship" but "is the engineering record internally consistent". It reads
# only .engineering/ and docs/ filing, asserts nothing about the application,
# and is deliberately NOT wired into .github/workflows/ci.yml. It composes
# existing verifiers and introduces no check of its own.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

SCRIPTS=".engineering/scripts"
failed=()
passed=()

run() { # run <label> <script> [args...]
  local label="$1"; shift
  local script="$1"; shift
  if [ ! -x "$script" ]; then
    printf '  SKIP  %s — not executable: %s\n' "$label" "$script"
    return
  fi
  printf '\n──── %s ────\n' "$label"
  if "$script" "$@"; then
    passed+=("$label")
  else
    failed+=("$label")
  fi
}

echo "Engineering verification — all governance verifiers"

run "Repository structure" "$SCRIPTS/repo-structure-verify.sh"
run "Engineering boundary" "$SCRIPTS/session-verify.sh"
run "Rollback protection"  "$SCRIPTS/rollback-verify.sh"

echo
echo "════════════════════════════════════════════════════════════"
for p in "${passed[@]:-}"; do [ -n "$p" ] && printf '  PASS  %s\n' "$p"; done
for f in "${failed[@]:-}"; do [ -n "$f" ] && printf '  FAIL  %s\n' "$f"; done
echo

if [ "${#failed[@]}" -gt 0 ]; then
  echo "Engineering verification FAILED (${#failed[@]} of $(( ${#failed[@]} + ${#passed[@]} )))." >&2
  echo "This blocks session completion, not deployment — the one deploy gate is CI." >&2
  exit 1
fi

echo "Engineering verification passed."
exit 0
