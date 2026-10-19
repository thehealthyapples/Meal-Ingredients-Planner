# THA AI Operating Model

This directory contains the operating rules Codex and Luna should use when planning, inspecting, or changing The Healthy Apples.

## Required reading by task

1. Always read the root `AGENTS.md`.
2. Before Amber or Red work, read `docs/architecture/README.md` and the relevant governing architecture documents.
3. Read only the operating-model files relevant to the task, using the routing below.

The copyable task brief is in `task-prompt-template.md`.

| Task | Read |
|---|---|
| Any implementation | `principles.md`, `risk-and-approval.md`, `rollback-and-output.md` |
| Architecture, ownership, data, or AI | `evidence-and-architecture.md`, `implementation-and-compliance.md` |
| Living Home, Pantry, or layered visuals | `principles.md`, then the relevant `docs/architecture/` Living Home/Larder documents |
| Documentation-only change | `principles.md`, `rollback-and-output.md` |

## Governing sentence

One entity. One owner. One source of truth. Progressively enriched. Never duplicated. When uncertain, stop and investigate.

## Task response format

Before implementation, state: objective, risk class, files/areas in scope, governing architecture, data impact, approval status, rollback plan, and verification plan.

After implementation, report: files changed, tests/checks run, user-acceptance evidence, remaining inferred or assumed claims, and the implementation-report path.
