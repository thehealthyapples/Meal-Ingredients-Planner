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
