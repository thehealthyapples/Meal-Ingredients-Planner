# Competitor comparison — enhancement priorities (internal)

**Date:** 19 November 2026
**Visibility:** Internal development planning; do not publish on the public comparison page.
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
**Branch / base:** `feat/integrated-dev` / `4224d8bb50bbcd71f996f424c085e55dcf772aa7`
**Rollback:** `rollback/CMP-internal-opportunities-20261119` → `4224d8bb50bbcd71f996f424c085e55dcf772aa7`

## Priority order

### P0 — Keep development opportunities off the public page — completed

Removed the public “Signals from the competitor review” section and its six idea cards. The public comparison table, evidence notes, sources and THA feature description remain. These development directions are retained here for internal planning.

### P1 — Make competitor evidence statuses trustworthy and auditable

Audit all cells and replace ambiguous absence with a structured internal reason. Keep the public traffic-light mapping simple: green = documented support; amber = support with stated limits; red = reviewed evidence explicitly confirms the capability is absent; grey = not verified. Internally distinguish at least: not yet reviewed, official sources reviewed with no finding, evidence too ambiguous, conflicting sources, and source/capability scope mismatch. Missing words on a page must never become a red “No.”

**Verified baseline in `client/src/pages/features-compare-page.tsx`:** 21 competitors × 30 tasks = 630 cells. There are 137 explicit competitor-topic entries (102 Yes, 14 Some limits, 21 explicitly unknown), 493 cells inherit the generic unknown fallback, and no competitor cell is currently marked confirmed No. The current record holds a level, note and optional URL; URLs may fall back to the competitor's general page. A single shared unknown note does not explain which evidence gap applies to each cell.

**Next action:** define a lightweight source record per assessed claim (claim/task, status and reason, exact source URL, source title, checked date, and applicable region/tier where known). Then re-review the matrix, prioritizing highest-overlap tasks and Samsung Food. Do not change public claim colors until the review supports them.

**Progress (19 November 2026):** missing matrix entries now resolve to **Not assessed yet**; explicit unknown entries resolve to **Not reported in reviewed sources**. Both remain grey and explicitly avoid claiming absence. The comparison component was also found unrouted and absent from the build; its documented public route, alias and Home link have now been restored. Samsung Food is the first competitor row reviewed against official sources; its claim URLs and Food+ limits are recorded in `docs/investigations/ux/CMP_SAMSUNG_FOOD_EVIDENCE_AUDIT_2026-11-19.md`. Remaining competitor rows and per-cell review dates still need a source audit.

### P2 — Establish the fundamentals used by the most-used overlapping apps

Build a defensible top-20 set from current, dated market/app-store evidence and the existing 21-app competitor set. Define region, platforms, timeframe and “popular” before ranking. Find the workflows most often shared by those apps and test the comparison against them. Treat popularity as a selection method, not proof that THA should copy a feature.

### P3 — Complete a Samsung Food category-by-category benchmark

Compare THA and Samsung Food across every current matrix task, then verify category gaps from current developer sources. Separate feature presence from quality, limits, availability, tier, and user control. Use the resulting gap list to decide where parity matters and where THA's household-first approach should remain different.

### P4 — Audit THA's real feature depth before adding more breadth

For each THA capability, trace the user journey through its current owner and test whether the comparison description is accurate. Cover household meals and per-person restrictions; balanced meals and positive nutrition additions; personal-requirement assistance; recipe and meal-plan creation, import and scanning; social import; shopping; weekly nutrition analysis; diary logging (including weight, mood, energy/ability); batch cooking and “Add to Freezer”; pantry and product scanning. Record what works, what has limits, and what is missing.

### P5 — Turn evidence-backed gaps into a staged improvement scheme

Create work items only after P1–P4 provide evidence and ownership. Improve reliability, discoverability and depth in core workflows before adding new breadth. Use “more green circles” as a directional coverage signal only: do not publish a winner or optimize a raw count that treats a limited or unverified capability as equivalent to a complete, reliable workflow. Track evidence coverage and quality alongside capability coverage.

## Source and ownership notes

- **Verified:** the public comparison source is `client/src/pages/features-compare-page.tsx`, routed through the existing application route; the product page census is `docs/product/structure/pages/page-features-compare.md`.
- **Verified:** the point-in-time capability review is `docs/investigations/ux/THA_FOOD_APP_COMPARISON_CAPABILITY_AUDIT_2026-11-19.md`.
- **Verified:** the current comparison uses four evidence levels and defaults missing task entries to unknown; it does not maintain a capability evidence service or a source-review history.
- **Inferred:** a research-side evidence ledger would make findings easier to audit before considering a runtime data model. It should remain an investigation artifact until architecture review identifies an owner and a need for runtime behavior.
- **Architecture constraint:** extend the existing comparison and its evidence source. Do not add a duplicate runtime capability, persistence store, score, or workflow. Product priorities belong to the owner of the evolution roadmap; this note is a point-in-time recommendation, not a roadmap amendment or product commitment.

## Scope and non-goals

This note is internal planning, not a public page, customer promise, approved product commitment, or change to competitor capability data. It does not assert current market rankings or re-verify competitor claims. Promotion, deployment, schema, persistence, AI behavior and competitor evidence edits are outside this work.

**Progress (19 November 2026 — MyFitnessPal):** The second high-overlap competitor row has now been audited across all 30 tasks. Its Premium+ household planning, allergy settings and grocery list are represented alongside plan/region restrictions; weekly reporting and diary/scan tools have source-specific coverage. Undocumented tasks remain grey. Detailed official-source record: `docs/investigations/ux/CMP_MYFITNESSPAL_EVIDENCE_AUDIT_2026-11-19.md`. Continue with the next high-overlap competitor; do not infer absence from silence.

**Progress (19 November 2026 — Mealime):** The third competitor row is audited across all 30 tasks. The review clarified Mealime's shared-account workaround, household-size serving scale, URL recipe import, Pro nutrition/fridge tools, grocery list and hands-free cook mode. Gaps from reviewed documentation remain grey rather than red. Full source record: `docs/investigations/ux/CMP_MEALIME_EVIDENCE_AUDIT_2026-11-19.md`.

**Progress (19 November 2026 — Mealia):** The fourth competitor row has been reviewed across all 30 tasks. The strongest documented overlap is its weekly budget-to-supermarket basket flow; household preferences and portions are described, while per-eater profiles and nutrition/diary breadth remain unestablished. The UK site and store listing differ in supermarket coverage, captured as a source limitation. Full report: `docs/investigations/ux/CMP_MEALIA_EVIDENCE_AUDIT_2026-11-19.md`.

**Progress (19 November 2026 — Yuka):** The fifth competitor row is reviewed across all 30 tasks, including the product-scanning depth you highlighted. It now differentiates barcode scan, nutrient/additive product explanation, higher-rated product recommendations and limited offline coverage from meal and plan scans. Preference alerts include Yuka's own caveats. An internal-only idea about THA scan-to-explanation flow is recorded in the investigation, not on the public page.

**Progress (19 November 2026 — MyNetDiary):** The sixth competitor row is now reviewed across all 30 tasks. It strengthens the comparison around personal diary depth, photo logging, offline use and AI meal suggestions while keeping household collaboration and pantry claims bounded by the evidence. No unreported feature was marked No. Audit: `docs/investigations/ux/CMP_MYNETDIARY_EVIDENCE_AUDIT_2026-11-19.md`.

**Progress (19 November 2026 — Real Plans):** The seventh competitor row is reviewed across all 30 tasks. The audit makes family-size planning, recipe capture, nutrition subscription boundaries, shopping, pantry limits and guided cooking more specific. Official sources also mention freezer reminders and batch-freezing portions. **SUGGESTION:** assess connecting THA's existing freezer action to batch cooking, planned portions and thaw reminders. This remains internal research, not public-page content or an approved feature commitment. Audit: `docs/investigations/ux/CMP_REALPLANS_EVIDENCE_AUDIT_2026-11-19.md`.

**Progress (19 November 2026 — Lifesum):** The eighth competitor row is now reviewed across all 30 tasks. Its personal nutrition and tracking depth is clearer: photo/voice/text AI food logging, barcode comparison, body measurements, multi-day programs, linked shopping-list export and weekly Life Score. The audit distinguishes these from family planning, recipe scanning and weekly nutrient totals, which remain unestablished. Audit: `docs/investigations/ux/CMP_LIFESUM_EVIDENCE_AUDIT_2026-11-19.md`.

**Progress (19 November 2026 — Yazio):** The ninth competitor row is reviewed across all 30 tasks. Yazio documents Pro future planning, weekly nutrition analysis, mood/reflection tracking, barcode comparison and post-meal nutrition tips. **SUGGESTIONS for internal review:** consider an optional contextual Nutrition Boost after a diary entry and assess side-by-side product comparison in THA's Analyser, reusing existing owners and safety/restriction checks. Yazio's custom recipe storage may not sync across devices; use this as a reminder to make THA's household recipe ownership/sync state clear. These are evidence-led research candidates, not public claims or approved feature changes. Audit: `docs/investigations/ux/CMP_YAZIO_EVIDENCE_AUDIT_2026-11-19.md`.

**Progress (19 November 2026 — Carb Manager):** The tenth competitor row is reviewed across all 30 tasks. The review adds custom planning up to 30 days, recipe URL/QR import, people-count shopping-list scaling and print output, week-level macro totals and macro-based food suggestions. **SUGGESTION:** evaluate whether THA's existing shopping flow should make range and servings/count controls more explicit, and whether plan-level nutrition gaps should prompt optional food additions. Both remain internal candidates for product review, not public promises or implementation authorization. Audit: `docs/investigations/ux/CMP_CARBMANAGER_EVIDENCE_AUDIT_2026-11-19.md`.

**Progress (19 November 2026 — Cronometer):** The eleventh competitor row is reviewed across all 30 tasks. It adds evidence for granular nutrient targets, food suggestions to address remaining daily targets, period-average nutrition reports, barcode/photo logging, Gold recipe URL import and personalized Coach guidance. Household planning and shopping lists remain unreported. **SUGGESTION:** examine how THA's weekly nutrition view could identify a nutrient gap and offer optional, household-compatible additions, while preserving the positive “add nutrition” framing and existing nutrition/AI ownership. This stays internal research. Audit: `docs/investigations/ux/CMP_CRONOMETER_EVIDENCE_AUDIT_2026-11-19.md`.

**Progress (19 November 2026 — Plan to Eat):** The next high-overlap app is reviewed across all 30 tasks. Official sources establish social and paper-recipe capture, a reusable meal calendar, generated date-range shopping lists, freezer batch cooking with portion/list adjustments and thaw reminders, per-serving nutrition, a Beta food diary/weekly macro chart, and AI ingredient substitutions. **SUGGESTIONS:** compare THA recipe OCR review; connect “Add to Freezer” with batch portions, shopping quantities and thaw prompts; and clarify planned versus eaten nutrition. Internal research only. Audit: `docs/investigations/ux/CMP_PLAN_TO_EAT_EVIDENCE_AUDIT_2026-11-19.md`.

**Progress (19 November 2026 — SideChef):** The next high-overlap app is reviewed across all 30 tasks. SideChef documents family-size personalized meal plans, diet/allergy preferences, grocery ordering, a pantry-led recipe explorer, guided cooking and AI ingredient substitution. Plan/list sharing is explicitly unsupported; diary depth is not established; photo recipe generation and scanner input have Beta/rollout caveats. **SUGGESTIONS:** compare THA member-specific restriction/adaptation, trustworthy pantry updates, recipe-step guidance and retailer basket review. Internal only. Audit: `docs/investigations/ux/CMP_SIDECHEF_EVIDENCE_AUDIT_2026-11-19.md`.

**Research correction (19 November 2026 — Mealime):** Official site and App Store notices state that Mealime was to shut down on 21 October 2026; the date has passed. Keep its existing matrix as a historical comparator for now, clearly labeled as such. Exclude it from the active 40-app shortlist and current top-20 overlap selection. Service status was not hands-on checked. Audit: `docs/investigations/ux/CMP_MEALIME_SERVICE_STATUS_2026-11-19.md`.

**Progress (19 November 2026 — 40-app UK candidate universe):** A dated UK candidate universe is now recorded in `docs/investigations/ux/CMP_40_APP_UK_CANDIDATE_INVENTORY_2026-11-19.md`. It separates UK store-chart popularity signals from feature overlap and explicitly treats chart positions as store- and chart-specific snapshots. It includes the 21 active comparators already in the matrix and 19 additional planning, nutrition, scanner, condition-specific and adjacent apps. The final top 20 is **not yet selected**: applying today's sparse/uneven matrix cells would bias selection toward apps with more completed audits. The next work is a comparable 30-task source review of the candidate tranche, starting with mise, Mob, MealPrepPro, Recipe Keeper, Nutracheck, Foodvisor, Ivy, WW, Eat This Much and HelloFresh. After that, rank overlap, evidence confidence and popularity separately, select the top 20, then identify shared-feature gaps against the THA implementation audit. No new product capability should be implemented until that evidence produces a specific gap and owner-approved scope.
