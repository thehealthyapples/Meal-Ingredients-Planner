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

## Living registers

One artefact in this tree is **not** a report. A report is history: it records what
was built on a day, and is never edited afterwards. A **register** is present tense:
it describes the codebase as it is *now*, and it is *corrected* rather than
superseded. A stale row in it is a defect, not drift.

| Register | Owns | Enforced by |
|---|---|---|
| [`ux/ADOPTION_REGISTER.md`](./ux/ADOPTION_REGISTER.md) | **Component adoption and retirement** — every canonical Platform Experience owner, what it owns, which surfaces have adopted it, which are exempt and why, which predecessors are retired, and which migrations remain outstanding and to whom | `npm run adoption:check` (`scripts/ci/adoption-register-gate.ts`) |

It lives here, beside the implementation, because
[`../architecture/THA_UI_ARCHITECTURE.md`](../architecture/THA_UI_ARCHITECTURE.md) § 17
— which mandates it — says it must: *"the register lives beside the implementation (it
is operational, not architectural)."* It creates no law. It makes the existing law
checkable, which for the whole of THA's history it had not been.

It is generated from `ux/adoption-register.json`, which is its single source of truth;
the gate fails if the two ever disagree. **Do not edit the Markdown by hand.**

It is distinct from the [Product Knowledge Registry](../product/) and does not overlap
it: the Product Knowledge Registry owns *what THA is* — its surfaces, journeys, claims
and settings, read by the Companion. The Adoption Register owns *what THA is built
from*, and no runtime code reads it.
