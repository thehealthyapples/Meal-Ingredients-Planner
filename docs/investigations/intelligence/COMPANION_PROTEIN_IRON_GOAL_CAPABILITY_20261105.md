# Companion protein and iron goal capability check — 2026-11-05

## Governance preflight
- Repository/area: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, Companion / Nutrition Knowledge / Food Intelligence.
- Branch/base: `feat/integrated-dev`, `3467abad4eca8d82ffc52756fee13874e389597f`.
- Status: read-only investigation; existing dirty work preserved.
- Governing sources read: `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `docs/change-control.md`, `docs/architecture/REPOSITORY_CONVENTIONS.md`, `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, relevant NK1/NK2 and Experience architecture, `docs/implementation/intelligence/ADULT_NUTRIENT_REFERENCE_METHODS_20261104.md`, and the child-preview implementation report.
- Risk: assessment spans Amber behavior and Red nutrition/health advice. No implementation was authorized by this question.

## Finding
**Verified:** Companion currently does not calculate or retrieve a reviewed personal protein reference for a muscle-building goal, and does not calculate an iron reference or identify iron deficiency. The app's nutrient-reference methods are explicitly candidate-only, with `state: candidate`, empty citations, and null reviewer fields. The production calculator rejects any method that has not passed the existing evidence and named-reviewer gates. Static call-site search found the calculator used only by its tests; the preview helper is used by the Admin review page and Admin preview API, not a Companion runtime route or registered capability.

**Verified:** the Admin synthetic preview contains an exercise-specific protein candidate (1.4–2.0 g/kg/day for its proposed adult population, with exercise and muscle/strength conditions). It is unpublished and cannot be selected by Companion. The recently added child UK protein table is also Admin-only and unpublished.

**Verified:** there is no iron method candidate in `shared/knowledge/nutrient-reference-methods.ts`. Food records and general food knowledge can support descriptions of foods that contain iron, but that is different from assessing an individual's iron requirement, intake, or deficiency. The architecture distinguishes a recorded dietary comparison from diagnosis; incomplete intake data cannot establish deficiency.

## Answer to the owner
- Muscle-building protein: **not yet as a dependable personalized Companion recommendation**. The Admin screen can preview a proposed exercise range for method review, but it is not live Companion behavior.
- Iron deficiency: **no**. Companion must not tell someone they have iron deficiency or prescribe iron/supplement doses from food logs or a question. A future reviewed capability could explain iron-rich foods or compare sufficiently complete recorded intake with an appropriate reference, with clear limitations; suspected deficiency needs clinical assessment.

## Architecture and authority
The existing Companion / Capability Registry / Intent Engine / Context Composition path remains the required route for future behavior. Nutrition Knowledge owns methods and evidence; Food Intelligence derives structured outputs; Diary owns recorded intake; the LLM may phrase an eligible result but may not invent a method, infer deficiency, or perform authoritative arithmetic. No new parallel state or capability was added in this investigation.

The prior user approval for an Admin-only child protein preview does not approve live Companion child guidance. The adult architecture approval admits a design direction, not method review, clinical authority, or runtime release. A future muscle protein change needs its own method/source review and release verification. Any iron-deficiency-related behavior requires a separate tightly scoped owner/clinical-safety decision before implementation.

## Source files checked
- `shared/knowledge/nutrient-reference-methods.ts`
- `server/intelligence/food-intelligence/nutrient-reference-engine.ts`
- `client/src/pages/admin-nutrient-reference-review-page.tsx`
- `server/routes.ts` Admin review route
- `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §§5.1–5.2
- `docs/implementation/intelligence/ADULT_NUTRIENT_REFERENCE_METHODS_20261104.md`
- `docs/implementation/intelligence/CHILD_NUTRIENT_REFERENCE_PREVIEW_20261105.md`

## Actions/data and unknowns
- No files other than this investigation report were changed for the current question; no tests were run.
- No live service, browser account, database, profile, diary, configuration, provider, or scheduled task was accessed or changed.
- This is a repository-level capability trace, not a live Companion conversation check. The local review API was previously observed falling back to Vite HTML, so live saved review behavior remains unavailable until the app server is correctly running.

## Agent report
Exact path: `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-05__companion-protein-iron-capability.md`.
