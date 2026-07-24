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

Every report lives in exactly one of these. Rows marked **†** are folders this
tree carries that are **not yet in the shared vocabulary table** of
[`../architecture/REPOSITORY_CONVENTIONS.md`](../architecture/REPOSITORY_CONVENTIONS.md)
§4 — a divergence between the conventions and the tree, recorded here rather than
resolved (amending the conventions is a governance decision for its owner).

| Folder | Covers |
|---|---|
| [`intelligence/`](./intelligence/) | Intelligence Platform, capability bindings, engines (observation, behaviour, decision, attention), conversation/intents, Food Intelligence runtime. **Not the Companion** — see `companion/` |
| [`companion/`](./companion/) | The Companion as a surface and as intelligence: identity, presence, conversation, authority, integration, runtime behaviour. Carved out of `intelligence/` and `ux/` under `DOCGOV2` (2026-07-18) |
| [`house/`](./house/) | The House experience: Home, Arrival, the North Star, the Orchard House, rooms, spatial experience, the household interior design language, the Living Home and its Environmental Dressing. Carved out of `ux/` under `DOCGOV2` |
| [`ux/`](./ux/) | **General** UI/interaction system work: dialogs, density/layout, workspace/header, navigation, profile display, copy/rename, platform-wide visual language. **Not** the Companion (→ `companion/`) and **not** the House experience (→ `house/`) |
| [`experience/`](./experience/) † | Cross-room Experience-Governance work: the Experience Constitution and its adoption, experience-language completion, experience convergence and verification passes |
| [`architecture/`](./architecture/) † | Reports whose *product* is a governing architecture document — a blueprint, a constitution, an ownership map, a rename of a governing file |
| [`knowledge/`](./knowledge/) | Canonical food & nutrition knowledge, evidence, food imports (WS0/WS0X/WS1–WS11), plant diversity, dietary dictionaries, knowledge review workbench |
| [`nutrition/`](./nutrition/) † | The household nutrition platform and its verification |
| [`health/`](./health/) † | The household health opportunity platform; profile allergy safety |
| [`cookbook/`](./cookbook/) | Recipes and meal content, meal detail, meal shells/templates/catalogue, meal-occasion & component modelling, recipe acquisition |
| [`planner/`](./planner/) | Weekly & smart planner, plan generation, meal–household compatibility, dietary enforcement in plans, meal discovery for planning |
| [`pantry/`](./pantry/) † | The Pantry domain and the **Larder** room — its North Star implementation passes, rebuilds, asset governance and production build |
| [`shopping/`](./shopping/) † | Shopping list and shopping-surface convergence |
| [`community/`](./community/) † | Community, the Orchard room, invitations and referrals |
| [`admin/`](./admin/) | Admin domain shell, navigation, admin regressions, the Support Hub |
| [`platform/`](./platform/) | Platform architecture & quality, resilience, operations, release engineering, launch-readiness, platform regressions |
| [`production/`](./production/) † | Product-completion programmes and launch/trust verification |
| [`governance/`](./governance/) | Architecture promotions, specifications, source-of-truth and governance decisions |
| [`engineering/`](./engineering/) | Engineering workflow & process, repository structure, release/deployment mechanics, documentation rules, session/dev-status records |
| [`repository/`](./repository/) † | Commit-and-push and repository-housekeeping session records |
| [`rebuild/`](./rebuild/) † | The `NSR1` North Star room-by-room reconstruction programme |
| [`benchmarking/`](./benchmarking/) | Benchmark framework, execution, measurement, scoring, reporting |
| [`development_world/`](./development_world/) | Development World dataset, import, and admin surfaces (DEVWORLD*) |
| [`assets/`](./assets/) † | Report attachments — prototypes, contact sheets and generated artefacts cited by a report |
| [`screenshots/`](./screenshots/) † | Screenshot evidence cited by reports |
| [`evidence/`](./evidence/) † | Dated verification evidence bundles cited by reports |

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
