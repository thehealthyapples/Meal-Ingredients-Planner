# Adult nutrient review preview fix — 2026-11-05

## THA Governance Preflight Receipt
- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- Worktree / branch: `feat/integrated-dev`
- Base HEAD: `3467abad4eca8d82ffc52756fee13874e389597f`
- Git status: highly dirty at start (over 1,500 entries); unrelated entries preserved. The affected page and engine files were pre-existing untracked files from the review workbench. Shared candidate methods had a pre-task snapshot under `.engineering/session/rollback-evidence/ADULT_REFERENCE_PREVIEW_LOCAL_20261105/`.
- User request: fix the review page because entering example details showed no result; explain how to test.
- Mandatory governance read: `AGENTS.md`; `PROJECT_GOVERNANCE.md` (bootstrap, dev-branch standing authority); `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `docs/change-control.md`; `docs/architecture/REPOSITORY_CONVENTIONS.md`.
- Task-specific governing material read: `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` (required UX first read); `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`; `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`; `docs/architecture/NK2_THA_NUTRITION_METHODOLOGY.md`.
- Existing assets inspected: nutrient reference review page, shared candidate methods, Food Intelligence reference engine, existing review API route/store, existing targeted engine test, Vite frontend-only configuration, live dev endpoints.
- Authorized scope: make synthetic review calculation visible locally; show candidate methods while the review API is unavailable; prevent writing approval/rejection while API unavailable.
- Non-goals: no Companion live activation, no formula or candidate change, no personal profile use, no DB writes, no API/server restart, no schema/migration, no production/staging action.
- Architecture/governance conflicts: NONE identified. UI extends existing Admin review workbench and uses the canonical candidate method/helper. No parallel state owner is added.
- Risk: RED subject matter (nutrition method review); this change is presentation and invocation of the existing deterministic synthetic calculation only. No runtime advice or persistence changed.
- Rollback identifier: `rollback/adult-reference-preview-local-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f` (annotated commit tag; committed state only; pre-existing dirty work is not covered).
- Implementation permitted: YES under standing `feat/integrated-dev` development authority.

## What changed
- The page now runs `previewAdultReferenceMethod` in the browser using the shared canonical candidate definition, so calculation does not depend on the stale backend endpoint.
- If review candidates/history cannot load, the page displays the static candidate methods and an explicit service-unavailable notice. Approval and rejection are disabled until the review API responds with data.
- The action label now says “Calculate this example”; the resulting value/range appears directly beneath that button and is explicitly labelled unpublished.
- Reused one shared pure preview helper in both browser and server; no duplicate formula implementation.

## Evidence and checks
- `http://127.0.0.1:5000/api/admin/nutrient-reference-review` returned HTTP 200 `text/html` beginning with the app document, not JSON. PID 15256 listening on port 5000 started 2026-11-03 11:31:21, before the review route was added. This is why the prior server-backed preview did not render.
- Vite transformed `/src/pages/admin-nutrient-reference-review-page.tsx` with HTTP 200 and the module contained the new local calculation path; no transform error markers.
- Direct deterministic preview check: 35 years / 70 kg UK RNI candidate = 52.5 g/day; exercise + muscle-strength candidate = 98–140 g/day.
- `npx tsx server/tests/test-adult-nutrient-reference-engine.ts`: 38 checks passed.
- `npm run typecheck`: existing unrelated repository errors remain in scripts/tests (including stale `schema.categories` references and several test fixture type mismatches). No errors remained in the changed review page, shared helper, or reference engine after fixes.
- No browser visual interaction was automated. Reload the page, enter example values, then click “Calculate this example”; result appears immediately below the relevant candidate button.

## Data impact, trust, and rollback
- Reads: static candidate method definitions in the browser. The page still attempts to read review history; current server fails closed by serving HTML instead of JSON.
- Writes: none from simulation. Approval/rejection controls remain disabled when API data is unavailable.
- Existing data meaning / backfill: unchanged / none.
- Trust: result is a deterministic candidate calculation, marked unpublished; it is not a personal nutrient recommendation or confirmation of intake.
- Rollback: revert only this task's edits to the page, `shared/knowledge/nutrient-reference-methods.ts`, and `server/intelligence/food-intelligence/nutrient-reference-engine.ts` using their pre-edit snapshots in `.engineering/session/rollback-evidence/ADULT_REFERENCE_PREVIEW_LOCAL_20261105/` where available. Do not reset or overwrite other dirty work. The annotated tag anchors committed HEAD only.
- Live services/database/configuration: inspected local HTTP service only; no process restart, DB connection, write, schema change, or configuration change.

## Follow-up: live recalculation after input changes
- User reported that the displayed values stayed the same after changing example values. Root cause: the page stored a snapshot of the calculation only when the button was clicked.
- Replaced the stored preview snapshot with a derived calculation from current controlled input state. After the first preview is started, all candidate results update immediately as age, body mass/unit, exercise, and muscle-goal inputs change.
- Labelled the candidate rate as static and each preview as calculated from the current age and mass; the displayed equation makes the static coefficient and derived result distinguishable.
- Verification: direct helper checks at 45 kg yield 33.75 g/day (UK RNI candidate) and 63.0–90.0 g/day (exercise candidate); at 90 kg yield 67.5 g/day and 126.0–180.0 g/day. Vite transform HTTP 200. Full typecheck still fails on unrelated server scripts/test fixtures; no errors point to the changed client page or shared helper.
- Rollback remains `rollback/adult-reference-preview-local-20261105` at `3467abad4eca8d82ffc52756fee13874e389597f`; this follow-up is the same task and preserves its rollback anchor.
