# CMP evidence-status distinction — session record

**Session:** `CMP_EVIDENCE_STATUS_DISTINCTION_20261119`
**Stage:** Evidence status distinction implemented; source audit in progress.
**Repository / branch:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, `feat/integrated-dev`
**Base HEAD:** `047fc302991bf42d8b327064ecf0770bc8ebdb84`
**Rollback:** `rollback/CMP-evidence-verification-distinction-20261119` → `047fc302991bf42d8b327064ecf0770bc8ebdb84`

## Objective and scope

Distinguish an explicitly reviewed cell whose developer sources do not report a capability from a matrix cell not assessed yet. Both retain the grey Not verified dot; neither is reported as No. Restore the public comparison routes and Home header link because the page component was not routed or included in the build.

## Current work

- `client/src/pages/features-compare-page.tsx`: separate unknown reasons and expose them in evidence details.
- `client/src/App.tsx`: register canonical and alias public routes.
- `client/src/pages/home-page.tsx`: add the top-level Compare apps link.
- `docs/product/structure/pages/page-features-compare.md`: record the evidence detail behavior.
- `docs/investigations/ux/CMP_EVIDENCE_STATUS_DISTINCTION_2026-11-19.md`: evidence baseline and status rules.

## Samsung Food audit

Reviewed Samsung Food official support pages for its row of 30 tasks. Added claim-specific sources, tier notes, and three “Not reported” reasons; corrected Weekly intake from Yes to Some limits. No No ratings were added. Full record: `docs/investigations/ux/CMP_SAMSUNG_FOOD_EVIDENCE_AUDIT_2026-11-19.md`.

## Next action

Continue with other high-overlap apps: re-review “not reported” and high-priority missing cells against claim-specific official sources. Record source URL, title, checked date, and region/tier when known. Keep cells grey where sources do not support a conclusion; do not mark a feature No from silence.

## Preservation

53 unrelated dirty worktree entries existed before this task and remain untouched. No database, live service, configuration, push or deployment touched.

## MyFitnessPal source-audit tranche — 19 November 2026

**Governance preflight for this tranche:** Verified repository `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, starting HEAD `9b93b18b426f533e8043e888850c020c9c333303`; confirmed and preserved pre-existing unrelated dirty paths. Read `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, mandatory UX architecture `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, and operating-model `principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, `implementation-and-compliance.md`. Standing dev authority and direct user instruction: **Implementation permitted: YES**, scoped to the MyFitnessPal competitor row and its research/session records. Risk 🟡 Amber. Rollback tag created before edits: `rollback/CMP-MFP-evidence-20261119` → `9b93b18b426f533e8043e888850c020c9c333303`.

Reviewed 30 matrix tasks against official MyFitnessPal help articles. Planner offers Premium+ household-sized plans, allergy/restriction settings, and meal sharing; retailer delivery links are limited to US/Canada. Premium supports barcode and meal-photo logging, and weekly reporting is documented. Individual eater profiles, external plan import, paper-plan scan, mood/energy logging, offline barcode lookup and AI tailoring remain unreported rather than marked No. Full task mapping and source links: `docs/investigations/ux/CMP_MYFITNESSPAL_EVIDENCE_AUDIT_2026-11-19.md`. Scoped source update: `client/src/pages/features-compare-page.tsx`.

`npm run build` completed successfully (existing Browserslist/PostCSS/chunk/server-bundling warnings). No tests were run. No live service, database, scheduled task, or configuration touched. Next: audit the next high-overlap competitor, preserving source-specific unknowns and tier/region limits.

Typecheck note for the MyFitnessPal tranche: repository-wide `npm run typecheck` exits 1 with TypeScript diagnostics in unrelated files (including server scripts/tests and other UI components). A filtered rerun showed no diagnostics in `client/src/pages/features-compare-page.tsx`. The successful production build remains recorded above.

## Mealime source-audit tranche — 19 November 2026

Governance was freshly read: `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, and task-routed `docs/ai-operating-model/{principles,risk-and-approval,rollback-and-output,evidence-and-architecture,implementation-and-compliance}.md`. Verified repository/branch/base HEAD `feat/integrated-dev` / `14acbc557a9b9f5a1db17b9d650ec70ec3a75199`; standing dev authority plus user instruction authorized this Amber scope. Pre-edit rollback tag: `rollback/CMP-Mealime-evidence-20261119` → `14acbc557a9b9f5a1db17b9d650ec70ec3a75199`.

Reviewed all 30 matrix tasks using official Mealime support/product documentation. Updated its existing row with supported claims and caveats for dietary filters, URL recipe import, planning, categorized shopping lists, Pro nutrition and pantry filters, account-sharing limits and hands-free cooking. Unreported features remain grey. No confirmed No ratings. Research: `docs/investigations/ux/CMP_MEALIME_EVIDENCE_AUDIT_2026-11-19.md`.

`npm run build` completed successfully with existing toolchain/bundle warnings. Typecheck was not rerun for this row; the prior tranche's full-project typecheck remains known to fail on unrelated files. No tests run. No database, live service, scheduled task, or configuration touched. Next: continue the audit with the next high-overlap app.

## Mealia source-audit tranche — 19 November 2026

Governance read for this tranche: `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, and task-routed AI operating-model implementation documents listed in the prior tranche. Verified repo/branch/base HEAD: `feat/integrated-dev` / `a4af11122c592787fe8a1e92d9cd012d65b29712`; user's instruction to continue and standing dev authority authorize this Amber scope. Pre-edit rollback tag: `rollback/CMP-Mealime-evidence-20261119` → `a4af11122c592787fe8a1e92d9cd012d65b29712`.

Reviewed Mealia against all 30 tasks using official UK product pages and its UK App Store listing. Updated only its existing competitor row and audit records. Its budget-led UK retailer basket is a strong documented differentiator; household preferences do not establish distinct eater profiles. Website and marketplace descriptions differ in supermarket coverage, recorded as a limitation. Unsupported areas stay grey; no No ratings. Full source map: `docs/investigations/ux/CMP_MEALIA_EVIDENCE_AUDIT_2026-11-19.md`.

`npm run build` completed successfully with existing toolchain/bundle warnings. No tests or typecheck run. No database, live service, scheduled task or configuration touched. Next: continue with the next close-overlap competitor, retaining neutral uncertainty where documentation is silent.

## Yuka source-audit tranche — 19 November 2026

Governance read for this tranche: `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, and task-routed AI operating-model implementation documents listed above. Verified repo/branch/base HEAD: `feat/integrated-dev` / `900a75daba03d36c3ee17a16b666323e9b0aefc7`; user continuation and standing dev authority authorize this Amber scope. Pre-edit rollback tag: `rollback/CMP-Yuka-evidence-20261119` → `900a75daba03d36c3ee17a16b666323e9b0aefc7`.

Reviewed all 30 comparison tasks using Yuka official app/help pages and UK App Store listing. Updated the existing Yuka row: documented barcode/product score, nutrient/additive details, alternative recommendations, Premium dietary-alert limits and offline database limit. Meal/plan and diary functions not established by sources remain grey; no No ratings. Internal opportunity note stays in the investigation, not public page. Full source map: `docs/investigations/ux/CMP_YUKA_EVIDENCE_AUDIT_2026-11-19.md`.

`npm run build` completed successfully with existing toolchain/bundle warnings. No tests or typecheck run. No database, live service, scheduled task or configuration touched. Next: continue audit with another close-overlap competitor.

## MyNetDiary source-audit tranche — 19 November 2026

Governance preflight: Verified repository `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, starting HEAD `251ee984e214966434c5ee88335851e75be810df`. Read `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `docs/architecture/README.md`, `ENGINEERING_WORKFLOW.md`, `GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `REPOSITORY_CONVENTIONS.md`, `docs/change-control.md`, and task-routed `docs/ai-operating-model/{principles,risk-and-approval,rollback-and-output,evidence-and-architecture,implementation-and-compliance}.md`. No governance or architecture conflicts found. The verified comparison component remains the single source for the public static matrix. User continuation and standing dev authority authorize the scoped Amber change. Rollback tag `rollback/CMP-MyNetDiary-evidence-20261119` → `251ee984e214966434c5ee88335851e75be810df`.

Reviewed all 30 tasks against official MyNetDiary help pages. The existing MyNetDiary row now covers its seven-day planner, plan reuse, recipe create/import, photo meal logging, food diary, 108-nutrient tracking, mood custom trackers, weight, barcode, offline limitations and Premium Plus suggestions. Family Sharing is distinguished from household meal collaboration. Its list can be shared manually but does not sync between same-account devices; standalone Shopping List is listed as free in the newer feature guide while planner-to-list use remains Premium. The UI now displays a per-cell source checked date alongside each reviewed source link. Undocumented capabilities remain grey, not red. Full source map: `docs/investigations/ux/CMP_MYNETDIARY_EVIDENCE_AUDIT_2026-11-19.md`.

Data impact: static evidence labels/notes and Markdown records only; no personal data, schema, persistent store, service or configuration changed. No additional AI behavior introduced. Highest remaining uncertainty is actual feature behavior and availability by region, platform, subscription and account; this pass reviewed developer documentation only.

## Real Plans source-audit tranche — 19 November 2026

Preflight: repository `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, starting HEAD `759482f7a3b5ea8778a1ad8bd96928a92c1bfb14`. Read repository `AGENTS.md`, mandatory governance section of `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `ENGINEERING_WORKFLOW.md`, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/SOURCE_OF_TRUTH_REGISTER.md`, `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `REPOSITORY_CONVENTIONS.md`, `docs/change-control.md`, and task-routed `docs/ai-operating-model/{principles,risk-and-approval,rollback-and-output,evidence-and-architecture,implementation-and-compliance}.md`. **Conflict:** none found. **Risk:** Amber, limited to the existing comparison row and evidence notes. **Implementation permitted:** YES under the user's continuation and standing dev-branch authority. Verified the existing component is the single public static evidence owner. Pre-edit rollback tag `rollback/CMP-RealPlans-evidence-20261119` → `759482f7a3b5ea8778a1ad8bd96928a92c1bfb14`.

Reviewed all 30 tasks using official Real Plans product/support pages. The row now distinguishes household-size planning from per-eater accounts; records URL/manual recipe import, weekly planning, shopping and guided-cook evidence; and keeps undocumented behavior grey. Nutrition and macro tracking require a separate subscription. Official material mentions freezer reminders and batch-freezing portions, recorded as an internal opportunity only. Full mapping: `docs/investigations/ux/CMP_REALPLANS_EVIDENCE_AUDIT_2026-11-19.md`.

Data impact: static comparison claims only, no personal data, persistence, service, configuration or AI behavior changed. Existing evidence component and source owner remain singular; no duplicate workflow was introduced. `npm run build` passed with existing Browserslist/PostCSS/chunk/server-bundle warnings. No tests or typecheck run; browser acceptance not repeated for this tranche. Pre-existing provider/benchmark and other concurrent dirty files preserved. Incoming report: `G:\The Healthy Apples\Incoming\Agent Reports\Codex-2026-11-19-THA-RealPlans-evidence-audit.md`.

## Lifesum source-audit tranche — 19 November 2026

Preflight: repository `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, starting HEAD `495d0795230c4a024b9d6a788340ae07722ccf39`. Pre-existing dirty state: 66 paths, preserved. Read `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `docs/architecture/README.md`, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/architecture/THA_UI_ARCHITECTURE.md`, `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `docs/architecture/REPOSITORY_CONVENTIONS.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/change-control.md`, `docs/ai-operating-model/README.md`, and routed `principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, `implementation-and-compliance.md`. The root `REPOSITORY_CONVENTIONS.md` path mentioned in older session notes does not exist; the canonical file is under `docs/architecture/`. **Conflict:** none found. **Risk:** Amber, this existing comparator evidence row. **Implementation permitted:** YES by user's continuation and standing `feat/integrated-dev` authority. Existing comparison component remains the only public static evidence owner. Rollback tag `rollback/CMP-Lifesum-evidence-20261119` → `495d0795230c4a024b9d6a788340ae07722ccf39`.

Reviewed all 30 tasks against official Lifesum product and help pages. The row captures Premium AI photo/voice/text tracking, barcode product comparison, body measurement logging, multi-day program plans, recipe nutrition, and shopping-list export; unsupported household/recipe-import/pantry functions stay grey. Weekly Life Score is not presented as a nutrient-total report. Full claim map: `docs/investigations/ux/CMP_LIFESUM_EVIDENCE_AUDIT_2026-11-19.md`.

Data impact: static comparison evidence and records only. No schema, personal data, persistence, service, configuration or AI reasoning touched; no duplicate workflow. `npm run build` passed with existing Browserslist/PostCSS/chunk/server-bundle warnings. No tests or typecheck run; browser acceptance not repeated. No external account, live service, database, scheduled task or deployment touched. Incoming report: `G:\The Healthy Apples\Incoming\Agent Reports\Codex-2026-11-19-THA-Lifesum-evidence-audit.md`.

## Yazio source-audit tranche — 19 November 2026

Preflight: repository `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, starting HEAD `0a55d468d1a291a29d9e14487da0d02fec654961`. Pre-existing dirty state: 66 paths, preserved. Read `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `docs/architecture/README.md`, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/architecture/THA_UI_ARCHITECTURE.md`, `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `docs/architecture/REPOSITORY_CONVENTIONS.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/change-control.md`, `docs/ai-operating-model/README.md` and routed model files `principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, `implementation-and-compliance.md`. No conflicting authority found. Existing comparison component remains the single public static evidence owner. Risk Amber; limited to Yazio's existing row and records. Implementation permitted YES under the user's instruction to continue and standing dev-branch authority. Rollback tag `rollback/CMP-Yazio-evidence-20261119` → `0a55d468d1a291a29d9e14487da0d02fec654961`.

Reviewed all 30 tasks against official Yazio product/help sources. Updated the row with Pro future planning, grocery lists, weekly nutrient analysis, meal-photo AI estimates, measurement tracking, mood/reflections, barcode product comparison and personalized post-meal tips. User recipe storage may be local and Yazio reports a current issue in its custom recipe flow. Unknown capabilities remain grey. Internal development opportunities (contextual diary nutrition tips and product comparison) are recorded only in the internal priorities doc. Full claim map: `docs/investigations/ux/CMP_YAZIO_EVIDENCE_AUDIT_2026-11-19.md`.

Data impact: static evidence only; no schema, personal data, persistence, service, configuration or AI behavior changed. No duplicate owner/workflow introduced. `npm run build` passed with existing Browserslist/PostCSS/chunk/server-bundle warnings. No tests or typecheck run; browser acceptance not repeated. 66 pre-existing dirty paths untouched. Incoming report: `G:\The Healthy Apples\Incoming\Agent Reports\Codex-2026-11-19-THA-Yazio-evidence-audit.md`.

## Carb Manager source-audit tranche — 19 November 2026

Preflight: repository `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, starting HEAD `0c59032b135b14c4ef59a42e4d2900cc071f9230`. Pre-existing dirty state: 66 paths, preserved. Read `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `docs/architecture/README.md`, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/architecture/THA_UI_ARCHITECTURE.md`, `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `docs/architecture/REPOSITORY_CONVENTIONS.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/change-control.md`, `docs/ai-operating-model/README.md` and routed model files `principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, `implementation-and-compliance.md`. No conflicting authority found. The existing comparison component remains the sole public static evidence source. Amber risk; only Carb Manager's row and records. Implementation permitted YES under user's continuation and standing dev authority. Rollback tag `rollback/CMP-CarbManager-evidence-20261119` → `0c59032b135b14c4ef59a42e4d2900cc071f9230`.

Reviewed all 30 tasks against official Carb Manager help pages. The updated row captures Premium meal planning up to 30 days, recipe imports from some websites and cookbook QR, editable shopping lists scaled by people-count, weekly macro charts, food-photo logging and measurement tracking. It distinguishes copying an in-app plan from external plan import and shared friend logs from a shared household plan. Silent features remain grey. Internal development candidates include serving/date controls for shopping and reviewed nutrition add-ons when planned macros fall short. Full task map: `docs/investigations/ux/CMP_CARBMANAGER_EVIDENCE_AUDIT_2026-11-19.md`.

Data impact: static public evidence and Markdown records only; no personal data, schema, persistence, service, configuration or AI logic changed. `npm run build` passed with existing Browserslist/PostCSS/chunk/server-bundle warnings. No tests or typecheck run; browser acceptance not repeated. The 66 pre-existing dirty paths remain outside this scope. Incoming report: `G:\The Healthy Apples\Incoming\Agent Reports\Codex-2026-11-19-THA-CarbManager-evidence-audit.md`.

## Cronometer source-audit tranche

**Verified:** Official Cronometer support pages were reviewed across all 30 tasks on 2026-11-19. The row records recipe URL import (Gold), nutrient targets and suggestions, period-average nutrition reports, barcode/photo food logging and Crono Coach; it separates those documented personal-tracking capabilities from unreported household plans and shopping lists. No No ratings were added. Research audit: `docs/investigations/ux/CMP_CRONOMETER_EVIDENCE_AUDIT_2026-11-19.md`. Rollback: `rollback/CMP-Cronometer-evidence-20261119` → `49815a9fb2350b465b45fec269931f5b484b12a8`.
