# Companion nutrition search improvements — 2026-11-04

## Scope and governance

User requested substantial Companion improvement against existing tests, then added personal nutrition requirements based on age/life stage, size, sex where relevant, activity and goals across nutrients. Repo `tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, base `3467abad4eca8d82ffc52756fee13874e389597f`; 178 pre-existing status entries preserved. Risk Red (AI behavior). Implementation permitted YES under direct user request and PROJECT_GOVERNANCE.md dev authority. Scope of implemented slice: existing Nutrition Discovery search, its canonical household safety gate, and numeric meal-search routing. No schema or profile changes.

Read governing sources: AGENTS.md, PROJECT_GOVERNANCE.md, docs/architecture/README.md, ENGINEERING_WORKFLOW.md AI compliance block, THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md, THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md, THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md, THA_HOUSEHOLD_TIME_ARCHITECTURE.md, capabilities/meal-discovery.md, and docs/change-control.md; continuing review also read Capability Registry/Intent Taxonomy, Companion Platform, NK1/NK2, and Recipe Acquisition architecture. THA AI Operating Model skill applied.

## Verified changes

- NutritionDiscoveryEngine parses highest/most and lowest/least/fewest requests over available protein/calories/carbohydrates/fat/sugar fields as ordering, without inventing a threshold.
- It scans all eligible rows, excludes missing requested values, sorts before capping, and reports complete eligible nutrition coverage rather than stopping coverage counts at 15 results.
- It reuses the existing household-dietary-safety owner before nutrition selection/ranking. Unavailable restrictions fail closed. No dietary rule, new data owner, assistant, or conversation state is created.
- Numeric meal superlatives for sugar/calories reach Nutrition Discovery instead of unrelated lexical meal search. Existing nutrient routes remain intact.
- Product knowledge entry and generated inventory updated. Canonical YAML had timestamped sibling backups before both writes: product.yaml.pre-companion-nutrition-20261104-1.bak and -2.bak.

Consumers affected: registered nutrition-discovery handler, its port result/filters, Context Composition Engine consumption, Companion answer/card consumers of these results; pattern resolver; product registry consumer. Existing production registry/Intent Engine and permission-scoped storage remain owners. Tests inject safety context but use the real safety verdict functions.

## Validation and comparison

- Nutrition Discovery binding suite: 98 passed, 0 failed. Tests include exact CB-016 wording, ranking a candidate beyond the first 15, complete coverage counts, missing macro exclusion, deterministic ties, handler execution, vegetarian chicken exclusion and unavailable-context refusal.
- Routing attribution suite: 81 passed, 0 failed, including sugar/calorie superlatives.
- Test import requires DATABASE_URL; used an unreachable dummy local connection for in-memory suites. Optional telemetry attempted that dummy endpoint and logged refusals; no real test database used.
- Production build passed after nutrition/safety changes, with existing toolchain warnings. Final routing change requires final build recorded in handoff.
- Full 100-question run: docs/intelligence/benchmark/history/2026-11-04T22-45-26Z__3467aba.json and .report.md. Existing BW03 household, no reset, OpenAI app provider, disabled Claude judge. User expressly approved remote development DB/OpenAI flow after automatic review initially rejected it. Run created conversation/telemetry and benchmark artifacts.
- Run score 78.5; capability reach 100%; intent accuracy 94.7%; 4 misroutes; 17 reached-but-empty; zero reported hard gates. Judge disabled and dietary/cross-household gates not measured, so this is not safety certification.
- Earlier full runs: 77.5 and 78.2, but those used single-world/live rather than BW03. These headline scores are NOT a controlled before/after comparison.
- Exact CB-016 changed from nutrition-discovery gap / 74.3 to OK / 81.8 with recorded protein facts. Different household and stochastic generation limit score attribution; in-memory same-input regressions prove the parser/ranking fix independently.
- Full run preceded the final household safety/routing changes. Focused live verification after safety recorded highest-protein OK grounding; lowest-sugar initially routed incorrectly, prompting the routing fix and another focused verification. Raw evidence in .engineering/session/rollback-evidence/COMPANION_NUTRITION_20261104/.

## Data, trust, rollback and acceptance

Final verification: lowest-sugar now reaches nutrition-discovery/search OK with grounding. The answer still inaccurately said a ranked list was unavailable while naming a 0g-sugar meal. Context/answer composition remains unresolved. Final production build and scoped whitespace checks passed after the routing change.

No application data/schema migration, backfill, deployment, model switch or scoring/fixture change. Benchmark activity writes only its ordinary conversation/telemetry plus append-only local result artifacts. No Claude sharing or household reset performed. No commit/push authorized.

Rollback tag: rollback/companion-nutrition-search-20261104 -> 3467abad4eca8d82ffc52756fee13874e389597f. Exact pre-edit source/test snapshots are in .engineering/session/rollback-evidence/COMPANION_NUTRITION_20261104/. Restore only task hunks/snapshots, preserving earlier dirty user work. Tag protects committed state only.

Acceptance: ask highest-protein or lowest-sugar meal questions; eligible meals with known numeric facts should be selected/ordered using those facts; excluded household meals must not enter this result set. Unknown values do not become zero. No claim of personal nutrient intake is added.

## Remaining gaps and capability boundary

Overall requested “vast improvement” is NOT achieved by this slice. Planner week identification, lexical compound queries, missing nutrient/benefit evidence, unsupported generation, and untested/empty domains remain. Planner handler still requires explicit week IDs and describes calendar mapping as absent, whereas the canonical Household Time service now exists. Existing unanchored rota weeks must not be assigned invented dates to improve a score. Investigate integration and real data coverage separately.

Personal nutrition targets require an owner decision: THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md T1 says food/meals rather than bodies; §6.3 prohibits signal-derived diagnosis, supplement/dosing/calorie-target/weight-loss recommendations. The user's broader body-specific requirement must be designed against these rules; this implementation cannot silently amend canonical architecture. Existing preferences hold height/weight/activity/goals; no age/sex fields were found in shared/schema.ts. Diary entries lack structured portion quantities. Reference needs, logged intake and possible food-pattern gaps are separate calculations, never a diagnosis of deficiency. Use nutrient-specific, sourced standards and explicit assumptions, never one rule for every nutrient or guesses about sex, age, body shape or medical status. Canonical profile ownership and consent must be resolved before extending storage. Classification: Architecture Gap/owner policy decision plus Repository/Data Gap; not a limitation of the model.

No optional behavior added beyond scoped search improvements. Highest-risk unverified claim: full real-world dietary correctness remains unproven by deterministic benchmark or narrow regressions. Required next step is a bounded, owner-approved personal-nutrition specification and an unchanged-fixture baseline/after run for subsequent behavior work.
