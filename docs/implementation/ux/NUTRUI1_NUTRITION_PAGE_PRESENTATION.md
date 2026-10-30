# NUTRUI1 — Nutrition page presentation

**Date:** 2026-10-27  
**Branch:** `feat/integrated-dev`  
**Risk:** 🟢 GREEN — presentation hierarchy and scope wording only; existing data and interactions are retained.  
**Objective:** Implement the plan's bounded presentation foundation while deferring the plant-count authority decision.

## Rollback protection

| Item | Value |
|---|---|
| Rollback tag | `rollback/nutrition-implementation-plan-20261027` → `bffc533d65f58ae30c1faf7d3026b50dcc17be89` |
| Working tree | Intentionally dirty before work; extensive unrelated experience, Planner, Home and other work remains untouched. The tag covers committed HEAD only. |
| This task's tracked writes | Three Nutrition UI files; the Nutrition and route-map registry entries; generated `product.json`. |
| Rollback to committed state | Inspect first, then restore only the seven listed tracked files from the tag. Do not check out the tag as a whole because the working tree contains unrelated edits. |

A new annotated tag could not be created because the sandbox has no Git committer identity. No Git identity was configured. The existing annotated plan tag resolves to the exact current HEAD and was reused. A byte-exact pre-session copy of the shared session dashboard is at `G:\The Healthy Apples\Incoming\Rollback Evidence\NUTRUI1_NUTRITION_PRESENTATION_20261027\CURRENT.md.pre-session`.

## Reference documents read

- Workspace instructions supplied by the user; repository `AGENTS.md` and `PROJECT_GOVERNANCE.md`.
- `docs/architecture/README.md`, `ARCHITECTURE_PRINCIPLES.md`, `ENGINEERING_WORKFLOW.md`, `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (§18.2), `THA_EXPERIENCE_BLUEPRINT.md` (§6.2 and §15), `THA_EXPERIENCE_ARCHITECTURE.md` (§18), `THA_EXPERIENCE_LANGUAGE.md` (§6), `THA_UI_ARCHITECTURE.md` (§§4, 8, 16–18), `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`, `NK2_THA_NUTRITION_METHODOLOGY.md`, `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, and `CAPABILITY_BOUNDARY_ASSESSMENT.md`.
- `docs/ai-operating-model/principles.md`, `risk-and-approval.md`, `rollback-and-output.md`; `.engineering/OPERATING_MANUAL.md`, rollback and session-recovery protocols, session README and template.
- Nutrition implementation plan, prior Agent Report, current `plant-diversity-page.tsx`, `PlantDiversityReport.tsx`, `HouseholdNutritionCentre.tsx`, `use-week-meal-entries.ts`, `nutrition-centre-assembler.ts`, `App.tsx`, shared `Card`, `IntelligenceCard`, the Nutrition Product Registry entry, route-map entry and authored inventory.

## Architecture compliance

- **Verified:** `/nutrition` is the canonical route and `/plant-diversity` redirects to it (`client/src/App.tsx`). Foods reads the active Planner week (`client/src/hooks/use-week-meal-entries.ts`); Nutrients reads the existing `/api/nutrition-centre` assembly and represents available Planner history (`server/lib/nutrition-centre-assembler.ts`, existing empty-state copy).
- **Verified:** The UI remains a projection over the existing Planner, Food Intelligence and Nutrition Centre owners. It adds no entity, state, query owner, calculation, workflow, route, or persistence.
- **Verified:** Existing `Card` and `IntelligenceCard` remain the canonical solid surfaces. No new client-side building block, token, or visual owner was introduced.
- **Verified:** The page labels nutrient and benefit counts as knowledge linked to foods, and explicitly says they are not amounts consumed. No health advice, intake, target, or recommendation was added.
- **Architecture principles:** identity and owners remain singular; no parallel state or calculation was added; the existing assembled model is reused; unknowns are not fabricated. AI architecture changes are not applicable.
- **Experience Constitution Check:** Hospitality is preserved through clear scope before detail; outcome is less interpretation effort and greater confidence; the page gains no new workflow or decision; room copy stays factual; recommendations remain with the Companion; the household retains agency; no score, streak, or judgment is added; implementation realises the existing Experience and UI owners.
- **Experience/UI review:** Same Nutrition room and orchard shell, no image or exposure change, canonical solid cards below the view, semantic numeric type, responsive grid, and existing loading/empty/error owners. The Blueprint screen purpose remains “understand the foods and food knowledge represented by the household's Planner activity.”

## Product Registry compliance and impact

The previously stale Nutrition page entry described retired tabs, advice, nutrient intake, and `/plant-diversity` as the page route. Updated `page-nutrition.md` and its authored inventory record to describe the current two-tab scope, canonical `/nutrition` route, `/plant-diversity` redirect, and coverage-versus-intake distinction. Updated the route-map entry and `product.yaml`; regenerated `product.json`. Owner and `household` visibility are unchanged. No entries were created or retired; two entries were updated. No product knowledge was added to prompts or runtime code.

The complete Product Registry verifier still exits 1 on six unrelated bijection/structure failures: `docs/product/assets/glossary.md`, `docs/product/assets/screenshots/README.md`, `docs/product/OWNERS.md`, `docs/product/README.md`, `docs/product/surfaces/admin/adm-activity-monitor.md`, and `docs/product/VISIBILITY.md`. It reported 165 inventory records, 166 prose entries and 196 warnings. The updated Nutrition entries were not among its failures. Those other paths were left untouched.

**Adoption Register impact:** No building block was created, adopted, or retired; the register is unchanged.

## Changes made

- Added a compact solid scope card to each Nutrition tab: selected Planner week for Foods; all available Planner history for Nutrients.
- Reordered the Foods summary to lead with distinct ingredients this week. Existing plant and category counts remain visible and unchanged.
- Reordered the Nutrients overview around its existing food-history count and clarified that nutrient/benefit counts represent knowledge linked to foods, not intake. The existing all-history data window and calculations are unchanged.
- Corrected the Product Knowledge Registry's Nutrition page and route map records to match the current route and current two-tab experience.

## Definition of Done

- Success: each tab states its time scope; the first fact is unambiguous; coverage is not presented as consumption; current data sources and actions are preserved.
- Must not break: `/nutrition`, the legacy redirect, tab selection, existing Planner reads, Nutrition Centre assembly, food detail links, or distinct empty/loading/error states.
- Manual review steps: open `/nutrition`; compare Foods with the active Planner week and Nutrients with all available history; switch tabs by keyboard and pointer; review no-history, partial-knowledge, loading and error states; check phone width, enlarged text and 200% zoom; confirm no new recommendation or intake claim appears.
- **User-acceptance evidence:** not captured in an authenticated live household session. The production client bundle compiled, but viewport and data-state acceptance remains for owner review.

## Validation performed

- `git diff --check` on the seven tracked files — passed.
- `npm exec tsx -- scripts/build-product-inventory.ts` — passed; generated 165 entries.
- `npm exec vite -- build --outDir <isolated writable folder> --emptyOutDir` — passed; built the client in 50.17s. Existing warnings: outdated Browserslist data, PostCSS missing `from`, and large chunks over 500 kB.
- `npm run typecheck` — failed with 14 TypeScript diagnostics in server scripts/tests; none point to the three changed client files.
- `npm exec tsx -- scripts/verify-product-inventory.ts` — failed on the six unrelated registry structure issues above.
- Tests were not run. Full `npm run build` was not run because `script/build.ts` recursively deletes the existing `dist` directory before building; the directory already contained `dist/index.cjs` and assets.
- No live services, databases, scheduled tasks, configuration, production data or deployments were touched.

## Data impact

- Reads existing Planner and Nutrition Centre projections: YES.
- Writes household data: NO.
- Changes calculation or meaning of existing metrics: NO; copy clarifies the existing data window and knowledge coverage.
- Backfill or migration: NO.

## Trust check

No new certainty or health claim is introduced. The plant-count calculation remains untouched and visible as before; its architecture conflict is not represented as resolved. No duplicate owner, state, source of truth, or runtime behavior was added.

## Rollback plan

- Identifier: `rollback/nutrition-implementation-plan-20261027` → `bffc533d65f58ae30c1faf7d3026b50dcc17be89`.
- Restore only the three Nutrition source files, `page-nutrition.md`, `routes-map.md`, `product.yaml`, and generated `product.json`, after reviewing each current diff. Preserve all other dirty paths. The session-dashboard preimage is separately saved at the path above.

## Scope lock

- Implemented: Green presentation hierarchy, tab-scope copy, knowledge-coverage clarity, and required Product Registry maintenance.
- Excluded for later decisions: shared period selection, source drill-down, persistence, calculation or canonical ownership changes, and any new nutrient intake or health interpretation.

**SUGGESTIONS:** Resolve Domain 22 of the Source of Truth Register before relying on the disputed plant-count definition for future acceptance or changing its calculation.

## Capability Boundary Assessment and Implementation Completion Report

**Architecture Complete: PARTIAL.** The presentation work follows the read-only UI architecture. One Architecture Gap remains: Domain 22 of `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` says the Nutrition Centre counts by slug and names `server/lib/household-nutrition-assembler.ts`; the current `nutrition-centre-assembler.ts` uses `plantDiversityGroup()`, and the named second assembler is absent. The plant-count question was deferred by the user; no calculation was changed.

**Engineering Complete: PARTIAL.** The focused client build and diff check passed. Repository typecheck and Product Registry verification retain unrelated failures; full build was not run because it would delete existing output. No test suite was run.

**Interaction Complete: PARTIAL.** Existing interactions and state owners were preserved, but authenticated viewport, keyboard, 200% zoom and data-state acceptance was not captured.

**Existing assets used:** `Card`, `CardTitle`, `CardDescription`, `IntelligenceCard`, `useWeekMealEntries`, existing Nutrition Centre API projection and current orchard shell.

**New assets required:** NONE.

### Remaining gaps

1. **Architecture Gap — Source of Truth Register Domain 22.** Evidence: Register lines 404–415 versus `nutrition-centre-assembler.ts`'s `plantDiversityGroup()` implementation; `server/lib/household-nutrition-assembler.ts` is absent. Attribution Test: **YES**, another implementer would still need the canonical owner to resolve this conflict. Impact: households continue to see the existing plant-count metric, whose canonical counting contract remains disputed; this implementation did not alter it. Recommended next action: Colin resolves Domain 22's rule and consumer list. Recommended capability: **Architecture decision required**.
2. **Repository Gap — Product Registry bijection.** Evidence: `verify-product-inventory.ts` reports six failures in unrelated registry files and 165 records versus 166 prose entries. Attribution Test: **YES**, another implementer would encounter the same repository state. Impact: NONE to the Nutrition runtime; the repository-wide Product Registry verification gate remains red. Recommended next action: its owner resolves those six path/entry mismatches and reruns verification. Recommended capability: **Continue implementation**.

**Stop Test:** No additional Green presentation change was required to meet the bounded implementation scope. The remaining metric, registry-wide, and acceptance items are stated above or explicitly excluded for later decisions.
