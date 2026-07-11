# THA Implementation Reports — Index

**Implementation reports for completed work, filed by workstream.**

This directory holds implementation reports — each records what was actually
built, with a rollback identifier and verification. Analysis that changes nothing
is an *investigation* and belongs in [`../investigations/`](../investigations/)
instead.

Every document is filed under a **workstream** folder — the root itself holds only
this index. The workstream vocabulary is shared with `docs/investigations/` and is
governed by [`../architecture/REPOSITORY_CONVENTIONS.md`](../architecture/REPOSITORY_CONVENTIONS.md)
§4. Workstream filing was established under `HOUSE2` and unified across both trees
under `DOCSTRUCT1` (2026-07-10); see
[`./engineering/ENGINEERING_DOCUMENT_STRUCTURE.md`](./engineering/ENGINEERING_DOCUMENT_STRUCTURE.md).

## Workstreams

| Folder | Covers |
|---|---|
| [`intelligence/`](./intelligence/) | Intelligence Platform, capability bindings, companion, engines, conversation/intents, Food Intelligence runtime |
| [`knowledge/`](./knowledge/) | Canonical knowledge, evidence, nutrition knowledge, food imports, knowledge review workbench |
| [`ux/`](./ux/) | Companion presence and identity, UI and interaction reports |
| [`benchmarking/`](./benchmarking/) | Benchmark framework, execution, measurement, reporting |
| [`governance/`](./governance/) | Architecture promotions, specifications, engineering rules |
| [`cookbook/`](./cookbook/) | Recipes and meal content, meal detail, meal shells/templates |
| [`admin/`](./admin/) | Admin domain shell, navigation, admin regressions |
| [`planner/`](./planner/) | Meal planning and meal discovery |
| [`platform/`](./platform/) | Platform resilience, operations, release engineering |
| [`development_world/`](./development_world/) | Development World import and admin surfaces (DEVWORLD*) |
| [`engineering/`](./engineering/) | Engineering workflow & process, repository structure, documentation standards |

New reports are filed by workstream automatically per
`../architecture/ENGINEERING_WORKFLOW.md` STEP 5 (Document location).
