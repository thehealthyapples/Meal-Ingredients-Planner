# THA Task Prompt Template

Copy and complete this brief before asking Codex or Luna to implement work.

```text
Work in the authoritative local repository:
C:\Users\Colin\The Healthy Apples\GitHub\tha-integrated-dev

Current development branch:
feat/integrated-dev

Task:
[One concrete outcome]

Context:
[Why this matters and what the user should experience]

Starting point:
[Route, component, service, document, or asset to inspect]

Required reading:
- AGENTS.md
- docs/architecture/README.md for Amber or Red work
- [Relevant architecture or investigation documents]

Risk:
[Green / Amber / Red, with one-sentence reason]

Scope:
- In scope: [items]
- Out of scope: [items]

Constraints:
- Preserve the existing Git state.
- Do not pull, reset, restore, clean, stash, switch branches, delete untracked files, push, deploy, or generate replacement assets unless explicitly approved.
- Extend existing ownership and capabilities; do not create duplicate state, workflows, or assistants.

Before editing:
1. Inspect repository status.
2. Identify the governing architecture and authoritative owner of each affected fact.
3. State the rollback identifier, data impact, definition of done, and verification plan.
4. Stop if implementation conflicts with governing architecture.

Implementation:
[Approved implementation direction]

Verification:
- Starting page:
- User action:
- Expected behaviour:
- Success criteria:
- Regression checks:

Completion report:
- Files changed
- Tests/checks run and outcomes
- Verified/Inferred/Assumed claims
- Data impact
- Rollback identifier
- Report path under docs/implementation/ or docs/investigations/
```
