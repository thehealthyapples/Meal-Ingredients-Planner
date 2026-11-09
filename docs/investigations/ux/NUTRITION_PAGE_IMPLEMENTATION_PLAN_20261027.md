# Nutrition page — implementation plan

**Date:** 2026-10-27  
**Status:** Proposed staged plan; no Nutrition application code or data changed.  
**Owning repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / base:** `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89`  
**Pre-plan dirty paths:** 117. Existing work was preserved. A planning rollback tag, `rollback/nutrition-implementation-plan-20261027`, anchors the current committed HEAD; pre-plan status is recorded at `G:\The Healthy Apples\Incoming\Rollback Evidence\NUTRITION-PLAN-20261027\pre-status.txt`.

## Decision summary

Build Nutrition as **a garden-facing noticeboard for understanding, with a solid data ground beneath it**. First reconcile the metric/source records, then make the existing Foods and Nutrients views easier to read. Add interactions or new calculations only through separate risk-gated decisions.

The five concepts are in `artifacts/nutrition-implementation-plan-20261027/`. They reuse the repository's existing orchard image and current palette. The pictures are not accepted assets or a pixel specification. Every displayed number is marked as illustrative; the values must not be mistaken for a live household report.

## Governance preflight and authority

**Verified:** The workspace and repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, and `docs/architecture/ENGINEERING_WORKFLOW.md` were read. Task-specific sources read were `GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_BLUEPRINT.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md`, `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`, `THA_UI_ARCHITECTURE.md`, `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`, `NK2_THA_NUTRITION_METHODOLOGY.md`, `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, and `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`. The original twenty-point proposal and Claude's review were read. The source files for `/nutrition`, Foods, Nutrients, the centre assembler and the food report adapter were inspected.

**Experience Constitution Check:** Nutrition's purpose is to help the household understand the food it has eaten. The page should reduce interpretation effort, show facts at the strength of their evidence, leave recommendations to the Companion, and avoid ranking or guilt. Its E2 garden view remains a view; readable data sits on the governed noticeboard/solid ground. This follows Blueprint §§5.1, 5.2, 6, 8 and 16, and Experience Architecture GEA21–GEA23.

**Risk:** Green for layout, labeling, typography, chart equivalents and responsive presentation that do not change meaning or workflow. Amber for changing date/period selection, source navigation, chart interactions, or empty-state actions. Red for changing canonical ownership, nutrient/plant calculations, persisted data, AI reasoning or Companion behavior. This document is a plan only; it authorizes no implementation or promotion. The repository's standing dev-branch authority applies to future implementation after its required preflight, but does not waive the separate Amber/Red decision gates or release approval.

## Verified current shape

- **Verified:** `/nutrition` is the canonical route; `/plant-diversity` redirects to it. The owning page is `client/src/pages/plant-diversity-page.tsx`.
- **Verified:** Foods is a weekly view. It calls `useWeekMealEntries()` (`client/src/hooks/use-week-meal-entries.ts`) and renders `PlantDiversityReport` (`client/src/components/PlantDiversityReport.tsx`) using the active Planner week and ingredient lookup. It currently presents a weekly plant/food report and sort/expand detail.
- **Verified:** Nutrients is a different time scope. `HouseholdNutritionCentre` reads `/api/nutrition-centre`; `server/lib/nutrition-centre-assembler.ts` assembles planner history with the existing Food Intelligence assembler, plant classifier, WS0 Nutrition Knowledge Registry, Discovery and Seasonality owners. Its empty state explicitly says “all-time, not just this week.” Current figures include counts of known nutrients/benefits/categories; they are not measured nutrient intake.
- **Verified:** `FoodReport` consumes the shared `buildFoodReport()` adapter. Food detail links already exist. The Nutrients view withholds some sections when their validated owners provide no content; loading, error and no-planner-history states already have distinct render paths.
- **Verified:** The page has Foods and Nutrients tabs today. The product should clarify their time scopes rather than imply they share a period when the underlying owners do not.
- **Verified:** The server assembler still constructs a `simplyBetter` suggestion projection, while the Nutrition client does not render that field. The current page comments explicitly keep recommendations with the Companion. Do not add a second recommendation surface; audit this unused response separately if its removal or reuse is proposed.
- **Verified:** The Source of Truth Register has stale/conflicting statements: Domain 22 says the Nutrition Centre's plant count still deduplicates by canonical slug, while the current assembler uses `plantDiversityGroup()` before counting; older duplication tables also describe client libraries and consumers that the current tree no longer has. Treat that as a documentation/authority reconciliation gate before relying on disputed counts or changing their semantics.

## Staged implementation sequence

### Gate 0 — reconcile sources and define the truthful report contract

1. Compare each visible number, label and state in Foods and Nutrients against its live component, API projection, assembler and authoritative source.
2. Resolve the Source of Truth Register drift named above with the register's governing owner. Confirm the actual plant-count rule and remove stale consumers/duplication claims only under their own decision. Do not “fix” the register by silently editing a governing fact during UI work.
3. Produce a field matrix with: rendered claim, time scope, unit, source owner, calculation, evidence/provenance path, and behavior when missing. In particular distinguish “nutrients linked to foods in the knowledge registry” from nutrient amounts a household consumed.
4. Confirm whether the active-week `planner:active-week` client read and server-side planner-history query represent the same canonical household period. If not, preserve the distinction in copy and controls.
5. Capture a baseline of current Foods/Nutrients, loading, error, no-meal, partial-knowledge and dense-data states at desktop, laptop, phone, and 200% zoom. Preserve household data and use synthetic fixtures for any concept-only scenario.

**Exit:** every visible claim has a named owner and an honest time window; stale authority conflicts are resolved or explicitly marked as blockers. If nutrient amounts or provenance cannot be proven, the design reports knowledge coverage only and does not imply intake.

### Phase 1 — Green presentation foundation

6. Keep the route, shared shell, E2 orchard owner, same orchard/morning and E2 exposure. Give the orchard a single, consistently bounded glimpse; put all copy, charts and controls on solid ground below it. No new room photograph or orchard variant.
7. Reshape the page around one plain-language, sourced fact at the top of the selected tab, then the current report and its detail. Keep advanced breakdowns below the useful first fact.
8. Keep Foods and Nutrients as separate, clearly described tabs. Foods names the selected Planner week. Nutrients names all available Planner history until a governed period source exists. Do not present matching-looking selectors that control different data.
9. Give every existing chart or count a title, unit, period and source cue. Use neutral palette and typography; remove any rank, target, red/green moral cue, streak or celebratory judgment. Only add charts where the source has the fields needed to support them.
10. Standardize food, ingredient, plant and nutrient labels through their existing canonical display owners. Keep knowledge coverage visually distinct from measured quantity, health interpretation and household preference.
11. Preserve current loading, error and no-history distinctions. Explain partial or missing source coverage in plain language; unknown remains unknown and does not become zero or a completed bar.
12. Add a table/text equivalent to each chart and preserve keyboard, screen-reader and contrast behavior. Check phone widths, large type and 200% zoom before accepting the layout.

**Risk:** Green while the displayed facts and actions stay the same. Changing what a metric means or a state transition is Amber/Red and returns to its separate gate below.

### Phase 2 — Amber interaction decisions, one at a time

13. **Decision A — period synchronization.** Decide whether the Nutrients data owners can supply the same selected week as Foods. If yes, change the server query/contract only through its existing owner and retain a clearly labeled “all history” option if supported. If no, keep honest separate scopes and defer the shared selector. Trade-off: visual symmetry versus truthful, owner-backed data windows. Do not solve this with a client-side filter over an all-time aggregate.
14. **Decision B — evidence drill-down.** Decide whether chart rows/segments should open existing Food Pages or a source-meal detail. Prefer the current `/foods/:slug` and canonical meal/planner detail routes. Add no duplicate report/calculation. Show a source only when the owning assembler can identify it and the permission-aware route permits it.
15. **Decision C — period and source persistence.** If selected periods or expanded detail should persist across tabs/device, identify an existing preference owner. Do not create new Nutrition-owned state or browser-local shadow state. Default to URL/transient view state if persistence is not required.
16. Keep interpretation and recommendations out of the room. The user can request advice from the registered Companion; do not copy `simplyBetter` or Discovery suggestions into Nutrition. Any integration must use the existing Intelligence Platform, Capability Registry, Intent Engine, current business services and permission-aware access, with no second assistant or conversation state.

Each Amber decision receives its own implementation approval, scope, acceptance criteria and focused verification. Do not bundle A/B/C into one behavioral change.

### Phase 3 — Red evidence/calculation work, only if Gate 0 finds it necessary

17. For each disputed plant/nutrient claim, trace the canonical entity, source row, inclusion/exclusion rule, normalization, aggregation window and published output. Compare a representative fixture against the canonical owner and current assembler.
18. Correct the owner or calculation only after the SoT Register conflict is resolved and the owner confirms the intended meaning. Add migration/backfill only if the verified design actually needs persisted state; the current UI plan does not imply one.
19. Do not introduce estimated nutrient intakes, personal requirements, deficiency labels, health recommendations, new targets or fabricated reference values. The current coverage counts cannot be relabeled as consumed amounts. Any AI interpretation or change to reasoning is a separate Red decision and must go through existing intelligence governance.

**Red release gates:** explicit decision for each ownership/calculation change; data impact and migration decision; independent calculation checks; pre/post evidence; rollback and restore; privacy/permission review; deployment checklist; and owner approval for promotion. If any is absent, ship only the Green presentation scope.

### Phase 4 — acceptance and release

20. Verify the same evidence contract in desktop, laptop, phone and zoom states; test actual weekly, all-time, partial-coverage, no-history, error and slow-loading cases. Check chart/text equivalence, focus order, keyboard access, labels/units/windows, and ensure no recommendation or claim appears without its owner.
21. Compare each visible metric against canonical source output for the same household and window; verify no duplicated state, workflow, query owner or competing orchard asset.
22. Owner reviews the five concepts, then the implemented route and the acceptance matrix. Record scope, claim owners, Product Registry impact, data impact, trust check, rollback tag, and outstanding gates in the implementation report and Agent Report. Dev completion is not promotion approval.

## Mapping the twenty proposals to the sequence

| Proposal | Planned work | Risk / condition |
|---|---|---|
| 1. One factual report at a time | Phase 1, one sourced fact before detail | Green if wording preserves source meaning |
| 2. Data on solid ground | Phase 1, bounded E2 view plus solid noticeboard | Green, same existing orchard owner |
| 3. One garden region | Phase 1, reuse existing E2 window | Green |
| 4. Clear Foods/Nutrients purpose | Phase 1, labels and scope descriptions | Green |
| 5. Chart title, unit, period | Phase 1, only where source supports a chart | Green; new aggregation goes to Red gate |
| 6. Incomplete input | Phase 1, render known/unknown honestly | Amber if changing state transitions/calculation |
| 7. Neutral self-comparison | Phase 1; use selected period only when backed | Amber if comparison semantics/data window change |
| 8. Subtle garden detail | Phase 1, actual source-derived detail only | Green |
| 9. One fact before detail | Phase 1 | Green |
| 10. Consistent plain labels | Phase 1, canonical display owners | Green unless ownership changes |
| 11. Source drill-down | Decision B | Amber |
| 12. Consistent periods | Decision A; never fake by client filtering | Amber |
| 13. Advice via Companion | Keep room factual; assess unused API projection | Existing Companion use is separate Red if it changes AI/reasoning |
| 14. No moral colors/streaks | Phase 1 | Green |
| 15. Chart text equivalent | Phase 1 | Green; data-source expansion may be Amber |
| 16. Phone number readability | Phase 1 and acceptance | Green |
| 17. Gentle no-data state | Phase 1, preserve empty/loading/error difference | Amber if the state semantics change |
| 18. Evidence separate from interpretation | Phase 1; existing source-grounded copy | Green for layout; claim changes are Red |
| 19. Zoom and large text | Phase 1 acceptance | Green |
| 20. Trace canonical claim/calculation | Gate 0 and Phase 3 | Red before any calculation/meaning change |

## Five visual concepts

All files are marked **concept only** and use illustrative sample values, not live household facts. They are deliberately staged as five Nutrition states, not five approved room themes:

1. [Foods overview — desktop](../../artifacts/nutrition-implementation-plan-20261027/01-foods-overview-desktop.svg): one weekly fact, canonical labels, clear list, solid data tier.
2. [Nutrient knowledge — desktop](../../artifacts/nutrition-implementation-plan-20261027/02-nutrients-knowledge-desktop.svg): coverage labels explicitly say “knowledge linked to foods”; no false intake graph.
3. [Evidence detail — desktop](../../artifacts/nutrition-implementation-plan-20261027/03-source-detail-desktop.svg): proposed source trail and existing Food Page path, contingent on proven source links.
4. [Incomplete/no-history state — desktop](../../artifacts/nutrition-implementation-plan-20261027/04-incomplete-data-desktop.svg): unavailable values are explained, not shown as zero or invented progress.
5. [Nutrition — phone](../../artifacts/nutrition-implementation-plan-20261027/05-nutrition-phone.svg): same hierarchy and orchard window in a narrow layout, no data over image.

The [concept index](../../artifacts/nutrition-implementation-plan-20261027/index.html) shows all five together. No image is approved for product use.

## Architecture, data and rollout checks

- **Single identity/owner:** keep `/nutrition` and its Foods/Nutrients tabs. Existing page, `PlantDiversityReport`, `HouseholdNutritionCentre`, Food Intelligence assembler and WS0 registry remain the owners/consumers in their current roles. UI remains a projection.
- **No duplicate store/workflow:** no local Nutrition database, shadow week selector, parallel food calculation, second report adapter, or new assistant. Period selection must come from an existing or explicitly approved owner.
- **Registry impacts:** Product Knowledge Registry — no planned change. Adoption Register — review if the implementation changes component ownership/consumers. Source of Truth Register — reconcile its conflicting/stale statements in the owning workstream before relying on those entries.
- **Data impact:** Green plan: reads and presents existing facts only; no writes, schema, persistence, backfill or change of meaning. Any Phase 3 proposal must specify these independently.
- **Trust:** display only source-backed facts; label all-time versus week; show source coverage and unavailable states; no invented precision; no adviser-like wording in Nutrition.
- **Rollback:** before each implementation, create a fresh rollback tag and byte-exact pre-state capture under repo protocol. Roll back only the phase's own files; preserve all unrelated dirty work. The planning tag here anchors committed HEAD only.
- **Definition of done:** Gate 0 resolved; approved Green scope implemented; each Amber/Red decision separately approved; canonical claims match source output; all states and screen sizes pass the acceptance matrix; visible charts have units/windows and equivalents; no recommendation ownership leak; reports and rollback evidence complete.
- **Scope lock:** this task creates this plan and five concept images only. Suggestions are limited to separate later work.

## Suggestions

- Have the owning architecture/source-register maintainer resolve the Nutrition register drift before using contested plant counts as acceptance targets.
- Consider deferring new nutrient charts until Gate 0 proves suitable period-based data exists. The current centre coverage counts do not represent nutrient intake.
