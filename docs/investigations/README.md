# THA Investigations — Index

**Point-in-time analysis and history, filed by workstream.**

This directory holds investigations, audits, assessments, and root-cause
analyses. Each is a historical record: it analyses and recommends; it changes
nothing (an investigation that records a rollback identifier and a Changes Made
section is an *implementation report* and belongs in
[`../implementation/`](../implementation/) instead).

Every document is filed under a **workstream** folder — the root itself holds only
this index. The workstream vocabulary is shared with `docs/implementation/` and is
governed by [`../architecture/REPOSITORY_CONVENTIONS.md`](../architecture/REPOSITORY_CONVENTIONS.md)
§4. Filing was established under `DOCSTRUCT1` (2026-07-10); see
[`../implementation/engineering/ENGINEERING_DOCUMENT_STRUCTURE.md`](../implementation/engineering/ENGINEERING_DOCUMENT_STRUCTURE.md).

## Workstreams

| Folder | Covers |
|---|---|
| [`intelligence/`](./intelligence/) | Intelligence Platform, companion, engines (observation, behaviour, decision, attention), conversation/intents, Food Intelligence, nutrition-boost feature |
| [`knowledge/`](./knowledge/) | Canonical food & nutrition knowledge, evidence, food imports (WS0/WS0X/WS1–WS11), plant diversity, dietary dictionaries, knowledge review |
| [`planner/`](./planner/) | Weekly & smart planner, plan generation, meal–household compatibility, dietary enforcement, meal discovery for planning |
| [`ux/`](./ux/) | UI/interaction, dialogs, density/layout, workspace/header, profile display, copy/rename |
| [`cookbook/`](./cookbook/) | Recipes and meal content, meal detail, meal shells/templates/catalogue, meal-occasion & component modelling, recipe acquisition |
| [`benchmarking/`](./benchmarking/) | Benchmark framework, execution, scoring, measurement |
| [`platform/`](./platform/) | Platform architecture & quality, resilience, launch-readiness, platform regressions |
| [`engineering/`](./engineering/) | Engineering workflow & process, repository structure, release/deployment mechanics, documentation rules, dev-status records |
| [`governance/`](./governance/) | Architecture principles, source-of-truth, roadmap, governance decisions |
| [`development_world/`](./development_world/) | Development World dataset, import, and coverage (DEVWORLD*) |
| [`backups/`](./backups/) | Historical patch files and agent transcripts — preserved verbatim, never rewritten |

New investigations are filed by workstream automatically per
`../architecture/ENGINEERING_WORKFLOW.md` STEP 5 (Document location).
