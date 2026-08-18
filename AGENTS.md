# Healthy Apples Agent Instructions

Read `PROJECT_GOVERNANCE.md` before taking any action in this repository. It is the authoritative project brief and governance entry point for ChatGPT, Claude Code, Codex, Hermes, and any delegated agent.

Before any significant investigation, recommendation, concept, implementation, file modification, or delegation:

1. Follow the Mandatory Governance Bootstrap in `PROJECT_GOVERNANCE.md`.
2. Produce the THA Governance Preflight Receipt required there.
3. Do not modify files or delegate implementation unless that receipt states `Implementation permitted: YES`.
4. Name the exact governance and task-specific architecture documents actually read.
5. If governance is missing, contradictory, or does not authorise the requested work, STOP and report the conflict.

Do not rely on conversation memory as a substitute for repository governance.

Verify exact project assets, routes, services, current worktree state, branch, HEAD, and git status before acting.

Preserve unrelated dirty changes.

Do not commit, push, deploy, migrate, access secrets, alter credentials, or modify production/staging without explicit user authorization.

Delegated agents must independently read the governing repository files specified in their task. A summary from the parent agent is not sufficient.

Agent completion is not acceptance. The parent agent must inspect the actual diff, tests, artifacts, and relevant runtime behaviour against the same governance used during preflight.
