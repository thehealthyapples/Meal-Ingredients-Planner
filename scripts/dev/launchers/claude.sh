#!/usr/bin/env bash
#
# Launcher: `call claude`
#
# Starts Claude Code with permission prompts bypassed, which is the mode this
# project's development shells expect. Any extra arguments are forwarded, so
# `call claude --resume` and friends still work.
set -euo pipefail

if ! command -v claude >/dev/null 2>&1; then
  echo "call claude: the 'claude' CLI is not on PATH." >&2
  echo "call claude: install it with  npm install -g @anthropic-ai/claude-code" >&2
  exit 127
fi

exec claude --permission-mode bypassPermissions "$@"
