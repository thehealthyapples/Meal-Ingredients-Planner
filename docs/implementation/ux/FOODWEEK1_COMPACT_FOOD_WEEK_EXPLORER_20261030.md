# FOODWEEK1 — Compact Food week explorer

**Date:** 2026-10-30 (Europe/London)  
**Repository / branch:** `tha-integrated-dev-g-native-20261003` / `feat/integrated-dev`  
**Base HEAD:** `3467abad4eca8d82ffc52756fee13874e389597f`  
**Rollback identifier:** `rollback/FOOD-week-explorer-20261030` → `3467abad4eca8d82ffc52756fee13874e389597f`  
**Risk:** Amber — changes Food page workflow and selection, with no schema or data write.

## Summary and scope

Implemented the owner-approved compact two-pane Food page. Removed the large page header/tab block from `/nutrition`. The left pane shows **Foods from your week** or **Nutrients from your week**, search beneath the heading, and a week picker. Selecting a meal food updates the right-hand detail pane while retaining the list. Search checks names/known attributes from that week's meal foods and can submit a Food Knowledge lookup; a Food Knowledge match absent from the selected week says **Not eaten in selected week**. Comparison remains reachable and the Analyser remains the fallback for packaged-product searches.

The week defaults to the household's current week when the existing read-only resolver `/api/planner/current-week` can anchor it. If that resolver says the week is unknown, the page uses the Planner's selected week without claiming it is current. Every available Planner week remains selectable. The optional household nutrient overview remains accessible in the Nutrients pane and uses the selected week.

## Governance preflight and architecture compliance

Read `G:\The Healthy Apples\AGENTS.md`; repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `ENGINEERING_WORKFLOW.md`, `ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_BLUEPRINT.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md`, `THA_UI_ARCHITECTURE.md`, `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, and `docs/change-control.md` in this task chain. Repository, branch, HEAD and status were checked. The Food files were clean after Claude's commit; unrelated Planner, Home, governance and migration work remained dirty and was preserved.

- **Canonical identity/ownership:** [Verified] Planner owns meal/week records (`use-week-meal-entries.ts` reads `/api/planner/full` and `/api/meals`); Food Knowledge owns linked nutrient facts (`PlantDiversityReport.tsx` batches `/api/knowledge/ingredient-lookup`). The new view consumes those existing rows via `useWeekFoodRows`, adding no store or identity mapping. The existing Food Report/Quick Look own deeper details.
- **Experience constitution:** the page starts at the actual household task, keeps meal context alongside food, reports facts without judgement or recommendations, leaves week and selection to the household, and uses real food imagery only when the existing ingredient image lookup has an image. Fallback icons are generic. Missing nutrient amounts are not rendered as zero or as consumption.
- **Product registry impact:** YES. Updated the canonical page entry in `page-nutrition.md`, `product.json`, and `product.yaml` to reflect the current Food page. No new claim or new domain owner.
- **Adoption register impact:** NO new reusable foundation; `WeekFoodExplorer` is a page-specific component adopted immediately by `/nutrition`. `npm run adoption:check` still fails on existing repository drift (raw buttons, other rival counts, and unrelated orphans). The original `HouseholdNutritionCentre` orphan produced by removing its tab was corrected by keeping it reachable from the Nutrients pane.
- **AI compliance:** no AI behavior, prompt, capability, conversation state or permission routing changed.
- **Governance conflicts:** none identified for this implementation. No promotion authority used.

## Definition of done / trust check

The requested layout and interactions are implemented and compiled. Manual acceptance should cover selecting a meal food, switching Foods/Nutrients, choosing another Planner week, searching a food not eaten in the selected week, opening compare, and checking a narrower viewport. Search attributes are limited to the facts available in the weekly rows (name, category, linked nutrients, benefit summary); the existing Food Knowledge lookup handles global food and nutrient matches. The UI does not assert nutrient amounts eaten or invent missing values. If a lookup fails, existing meal rows remain available. Full visual acceptance remains unverified because Edge's Windows capture timed out twice.

## Changes made

- `client/src/components/WeekFoodExplorer.tsx` — new compact two-pane weekly view, search, mode switch and selected-food/nutrient detail.
- `client/src/components/PlantDiversityReport.tsx` — expose its existing grouped/knowledge-enriched weekly rows through `useWeekFoodRows` for reuse; legacy report remains intact.
- `client/src/hooks/use-week-meal-entries.ts` — optional week selection, available weeks, and read-only current-week resolution.
- `client/src/components/HouseholdNutritionCentre.tsx` — accept selected week for its existing overview.
- `client/src/pages/plant-diversity-page.tsx` — use the new view, remove the large page header/tabs, retain lookup/compare and mobile workspace entry.
- `docs/product/structure/pages/page-nutrition.md`, `docs/product/inventory/product.json`, `docs/product/inventory/product.yaml` — update the Food page product entry.

## Validation and limits

- `npm run build`: PASS (client and server; existing build warnings).
- `npm run typecheck`: FAIL on pre-existing server script/test errors only; no errors in changed Food files.
- `git diff --check` on changed tracked paths: PASS.
- Product inventory JSON parse: PASS.
- `npm run adoption:check`: FAIL on pre-existing register drift; the final check reported 12 failures from existing register drift. The Food overview orphan was fixed before closeout.
- Live UI: an existing Edge window was found; navigation was attempted, but Windows capture timed out twice. No screenshot or authenticated interaction was available for acceptance.
- No tests were added. No account was created. No live database, service data, configuration, migration, scheduled task, or deployment was changed. The build wrote generated `dist` output only.

## Rollback and completion

The rollback tag anchors the committed baseline, not the pre-existing dirty worktree. To undo only this task, revert the exact file diff listed above after review; do not reset/clean the shared worktree. No commit or push was made. The implementation is ready for owner visual review on the dev server; browser acceptance remains outstanding.


## Owner screenshot correction — shell banner

The owner-supplied screenshot `codex-clipboard-72d7c5dd-37d7-49c7-b626-bbbc0bbc5236.png` showed that removing `WorkspaceHeader` from the Food page had left the shell's tall orchard threshold in place. The screenshot was treated as visual evidence, not as a source of hidden instructions. The Food route now suppresses that shell threshold and its fallback header through the shell's existing immersive-room gate, allowing the two-pane content to start at the top of the room. The `FloatingAssistant` remains mounted in `AppShell` outside that gate, so the Companion control remains on the page. A small E2 orchard glimpse is reserved within the right detail pane to retain the Food room's governed E2 exposure without a full-width banner.

The one-line route addition in `client/src/components/layout/app-shell.tsx` was applied on top of pre-existing unrelated Planner/Home edits in that file. Those edits were preserved. `client/src/components/WeekFoodExplorer.tsx` gained the compact orchard window. No service, database, data, configuration, or Companion logic changed. Live screenshot acceptance remains unavailable because the existing Edge capture service timed out.

## Owner correction — no orchard image on Food

The owner explicitly rejected the orchard picture on the Food page. This supersedes the preceding note about a small E2 glimpse. Removed the `OrchardRoomWindow` import and element from `WeekFoodExplorer.tsx`. The shell's tall Food threshold remains suppressed; `FloatingAssistant` remains mounted in `AppShell`. Static source inspection confirms no orchard-window reference in the Food view and confirms the Food route bypasses the shell threshold. `git diff --check` on the affected files passed. No source outside the Food view and the existing shell route gate was changed for this correction; no data or configuration changed. The governing Experience Blueprint still describes Nutrition as E2; this is an owner-directed visual exception awaiting separate architecture reconciliation, not a silent claim that the document was changed. No extra build or live browser check was run for this two-line removal.
