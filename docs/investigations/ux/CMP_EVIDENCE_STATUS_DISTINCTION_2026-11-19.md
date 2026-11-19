# Competitor evidence-status distinction — investigation — 19 November 2026

**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
**Branch / base:** `feat/integrated-dev` / `047fc302991bf42d8b327064ecf0770bc8ebdb84`
**Risk:** 🟡 AMBER — clarifies public evidence-detail behavior without changing ratings.
**Rollback:** `rollback/CMP-evidence-verification-distinction-20261119` → `047fc302991bf42d8b327064ecf0770bc8ebdb84`

## Finding

The comparison page used one `unknown` object both for explicit cells whose reviewed developer sources did not establish a feature and as the fallback for every missing topic entry. This made the page say that sources were reviewed even when no app/task record existed.

## Evidence baseline

**Verified in `client/src/pages/features-compare-page.tsx`:** 21 competitor apps × 30 comparison tasks = 630 cells; 102 explicit Yes, 14 Some limits, 21 explicit unknown records, zero competitor No records, and 493 cells with no explicit entry. The page uses an optional cell URL and otherwise falls back to the app's general URL.

## Decision

- **Not reported in reviewed sources:** an explicit unknown cell. The public detail says the feature is not reported in the developer sources reviewed and that this does not prove the app lacks it.
- **Not assessed yet:** a missing app/task entry. The detail says this specific comparison cell has not yet been assessed and that this is not a No.
- Both remain the existing grey **Not verified** state. Green, amber and red dot rules do not change. Red must remain evidence-backed confirmation of absence, not an inference from missing documentation.
- Avoid hiding unknown entries or giving different colors to unknown subtypes; a single neutral dot keeps the grid legible while the detail carries the reason.

## Limits and next work

This change distinguishes the two current sources of uncertainty. It does not yet capture exact claim-specific URLs, source title, review date, country, platform, subscription tier, or conflicting sources for every cell. Re-review those cells with official developer material before setting any to No. Where the source is silent, retain Not reported; where the source was not checked, retain Not assessed. No market ranking or hands-on competitor testing was performed here.

## Architecture and ownership

**Verified:** competitor evidence is authored in the existing comparison component; the page structure record documents its public behavior. This change extends that evidence model and adds no second data store, persistence, API or workflow. The page consumes the same static evidence records. `docs/product/structure/pages/page-features-compare.md` is updated to reflect the behavior.

**Inferred:** claim-specific evidence provenance may eventually justify a structured research record or data model, but no new owner should be selected until the source audit establishes the need. Do not create a duplicate runtime evidence store as a shortcut.

## Route and build integration finding

**Verified:** before this task, `features-compare-page.tsx` had no import or route in `client/src/App.tsx`, no top-level link in `client/src/pages/home-page.tsx`, and its component was absent from the production bundle. The product page record already named these routes and the Home navigation as consumers. This was an implementation-to-census drift, not a conflict in governing architecture. The shared page is now registered at `/features-and-compare` and `/features&compare`, and Home links to the canonical route.

## Samsung Food source-audit tranche

**Verified:** Official Samsung Food help pages were reviewed on 2026-11-19. The existing row now includes claim-specific URLs, tier caveats and explicit “not reported” reasons for eater profiles, external plan import and paper-plan scanning. Weekly intake was corrected from Yes to Some limits because reviewed nutrition sources describe daily targets and detailed recipe nutrition but not consumed weekly totals across diary days. No cell was marked No. Full task mapping and source URLs: `docs/investigations/ux/CMP_SAMSUNG_FOOD_EVIDENCE_AUDIT_2026-11-19.md`.
## MyFitnessPal source-audit tranche

**Verified:** Official MyFitnessPal support pages were reviewed on 2026-11-19 across all 30 comparison tasks. The row now accounts for Premium and Premium+ feature tiers, household-size planning, and regional restrictions on grocery-app handoff. It distinguishes documented weekly intake reports from a linked weekly food explorer, and preserves neutral unknowns for unreported features. No No ratings were added. Full task mapping and sources: `docs/investigations/ux/CMP_MYFITNESSPAL_EVIDENCE_AUDIT_2026-11-19.md`.

## Mealime source-audit tranche

**Verified:** Official Mealime support/product sources were reviewed on 2026-11-19 across all 30 matrix tasks. The row records URL recipe import, meal planning, grocery lists, Pro nutrition, pantry-item planning and guided cooking, alongside family-size, shared-account, and subscription limits. Paper-plan scanning, plan import and other unreported items remain grey; no No ratings were added. Full mapping: `docs/investigations/ux/CMP_MEALIME_EVIDENCE_AUDIT_2026-11-19.md`.

## Mealia source-audit tranche

**Verified from official product and App Store descriptions:** Mealia documents household-sized personalized meal plans, UK supermarket basket building, website recipe import and a budget-first weekly shop. The user reviews the basket and checks out with the retailer. Household preferences are described, but individual eater profiles, diary/nutrition tools and a safety-specific allergen workflow are not established in reviewed sources. The feature row preserves these as grey or limited, not No. Full 30-task mapping and source links: `docs/investigations/ux/CMP_MEALIA_EVIDENCE_AUDIT_2026-11-19.md`.

## Yuka source-audit tranche

**Verified:** Official Yuka app/help pages were reviewed on 2026-11-19 across all 30 matrix tasks. The row distinguishes barcode-based product analysis, product-level nutrition/additive ratings, recommendation alternatives and Premium offline scanning from meal/plan features. Offline availability is limited to the 100,000 most frequently scanned products; dietary preference alerts do not account for ingredient traces and do not replace label checks. Unsupported app capabilities remain neutral grey; no No ratings were added. Full matrix: `docs/investigations/ux/CMP_YUKA_EVIDENCE_AUDIT_2026-11-19.md`.

## MyNetDiary source-audit tranche

**Verified:** All 30 tasks were reviewed against MyNetDiary's official help pages on 2026-11-19. The row now captures seven-day planning, custom plan reuse, recipe creation/import, meal-photo logging, offline limits, custom mood tracking, nutrient reports, and Premium Plus meal suggestions. It distinguishes subscription sharing from shared meal planning and reflects the shopping-list evidence conflict by using the newer free-tier guide for standalone lists while retaining Premium for planner integration. Reviewed cells link to a source and show the review date in the evidence detail. No competitor No ratings were added. Full mapping: `docs/investigations/ux/CMP_MYNETDIARY_EVIDENCE_AUDIT_2026-11-19.md`.

## Real Plans source-audit tranche

**Verified:** Official Real Plans product and support sources were reviewed across all 30 comparison tasks on 2026-11-19. The row now distinguishes household-size planning from individual eater profiles, documents recipe URL/manual import and the plan-to-list/cooking flow, and calls out subscription separation for nutrition/macro tracking. Image-format hints do not establish recipe OCR, so image scanning is limited; silent features stay grey. No cells were marked No. Full claim map: `docs/investigations/ux/CMP_REALPLANS_EVIDENCE_AUDIT_2026-11-19.md`.

## Lifesum source-audit tranche

**Verified:** Lifesum official product/help pages were reviewed across all 30 tasks on 2026-11-19. The row now captures Premium multi-modal AI food logging, barcode product comparison, weight/body measurements, 7–21 day program plans and their shopping-list/export limits, meal creation and nutrition detail, and weekly Life Score feedback. It does not conflate food-photo logging with recipe scanning, or Life Score with weekly consumed-nutrient totals. Family planning and unsupported import/pantry/cooking capabilities remain grey. Full mapping: `docs/investigations/ux/CMP_LIFESUM_EVIDENCE_AUDIT_2026-11-19.md`.

## Yazio source-audit tranche

**Verified:** Official Yazio help pages were reviewed across all 30 tasks on 2026-11-19. The row now captures Pro future meal planning, grocery lists, advanced nutrients and weekly analysis, photo-based AI food logging with estimate limits, body measures, barcode product comparison, mood/symptom/reflection diary tools, and personalized post-meal tips. It also notes that user-created recipes may be local and that current custom-recipe issues are reported by Yazio. THA opportunities are internal only. Unknown household/import/pantry functions remain grey. Full task map: `docs/investigations/ux/CMP_YAZIO_EVIDENCE_AUDIT_2026-11-19.md`.

## Carb Manager source-audit tranche

**Verified:** Official Carb Manager product/help sources were reviewed across all 30 tasks on 2026-11-19. The row captures Premium plans up to 30 days, custom/curated reuse, URL recipe import from some websites, cookbook QR recipes, per-person shopping-list scaling and printing, weekly nutrition totals, photo logging, weight/body measures, and macro-driven add-food suggestions. It distinguishes QR recipes from paper-plan OCR and sharing daily logs/favorites from collaborative household planning. Silent capabilities remain grey. Full map: `docs/investigations/ux/CMP_CARBMANAGER_EVIDENCE_AUDIT_2026-11-19.md`.

## Cronometer source-audit tranche

**Verified:** Official Cronometer help pages were reviewed across all 30 tasks on 2026-11-19. The row captures recipe creation and Gold URL import, editable food suggestions for remaining nutrient targets, daily diary nutrients, weekly/period-average reports, barcode/photo logging and Gold Crono Coach. It distinguishes individual tracking and practitioner/client tools from family meal planning, shopping lists and household profiles, which remain unestablished. No competitor No ratings were added. Full map: `docs/investigations/ux/CMP_CRONOMETER_EVIDENCE_AUDIT_2026-11-19.md`.

## Plan to Eat source-audit tranche

**Verified:** Plan to Eat's official documentation was reviewed across all 30 tasks on 2026-11-19. The row captures recipe URL/social/photo import and OCR, planning, Menus, grocery delivery, freezer batch cooking with quantities/thaw reminders, nutrition, its Beta Food Logger and AI substitutions. The review distinguishes family-size portions from separate eater profiles, recipe scans from paper-plan scans, and pantry suggestions from inventory sync. Unknown diary/scan cells remain grey; no No ratings were added. Full map: `docs/investigations/ux/CMP_PLAN_TO_EAT_EVIDENCE_AUDIT_2026-11-19.md`.

## SideChef source-audit tranche

**Verified:** Official SideChef consumer and product materials were reviewed across all 30 tasks on 2026-11-19. The row captures family-size/diet-aware planning, grocery handoff, recipe nutrition and creation, My Pantry suggestions, guided cook and qualified AI substitution/photo/scanner evidence. It also preserves SideChef's explicit no-sharing statement for plans/lists and the lack of reported food diary/weight/mood workflows. Beta/availability ambiguity remains visible; no No ratings were inferred from silence. Full map: `docs/investigations/ux/CMP_SIDECHEF_EVIDENCE_AUDIT_2026-11-19.md`.
