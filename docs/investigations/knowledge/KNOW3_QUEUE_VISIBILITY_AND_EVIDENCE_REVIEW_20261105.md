# KNOW3 — Queue visibility and evidence triage

**Date:** 2026-11-05  
**Owning repository/area:** Integrated Development — Admin Nutrition Claim Review and canonical food knowledge.  
**Risk:** Amber investigation of existing review behavior; no claim decisions or evidence data were written.

## Governing authority read

`G:\The Healthy Apples\AGENTS.md`; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `.engineering/standards/RISK_AND_SCOPE_STANDARD.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`; `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`; `docs/architecture/NK2_THA_NUTRITION_METHODOLOGY.md`; `docs/investigations/knowledge/KNOW5_KNOWLEDGE_EXPANSION_READINESS.md`; `docs/implementation/knowledge/KNOW1_NUTRITION_EVIDENCE_PUBLICATION.md`; `docs/implementation/knowledge/KNOW2_HUMAN_EVIDENCE_PUBLICATION.md`; `docs/implementation/knowledge/KNOW5_SAFE_KNOWLEDGE_EXPANSION.md`; `shared/knowledge/evidence.ts`; `shared/knowledge/claim-sources.ts`; `shared/knowledge/composition-sources.ts`; `server/lib/knowledge-claim-review-store.ts`; `/api/admin/knowledge-claims` in `server/routes.ts`.

No governing conflict was found for the source filter or paging. Trust-domain expansion and automatic source discovery remain separate behavior/AI-governance changes; not implemented here.

## What the 3,299 means

**Verified from the signed-in Admin summary API at `http://127.0.0.1:5001/api/admin/knowledge-claims/summary`:**

| Claim edge | Pending | Cited | Awaiting source |
|---|---:|---:|---:|
| Food → nutrient (composition) | 1,902 | 1 | 1,901 |
| Food → benefit (direct) | 1,366 | 0 | 1,366 |
| Nutrient → benefit (physiological) | 47 | 15 | 32 |
| Preparation effect | 0 | 0 | 0 |
| **Total** | **3,315** | **16** | **3,299** |

They are relationship/claim rows, not unique foods. This explains why searching for “3,299 foods” is misleading. The 1,366 direct food-benefit rows are a different evidence question from nutrient composition. The app architecture treats this edge as optional corroboration; it should not be used to jump around the food→nutrient→benefit chain.

**Verified with a read-only API query:** 47 nutrient-benefit rows are pending, 15 carry citations, and 32 do not; 21 nutrient-benefit rows are already approved. So benefit evidence exists in the system. It does not cover every pending relationship, and a URL/domain match alone does not establish that its exact text supports the mapped benefit. Example pending labels include `protein → muscle-recovery` with a citation titled “Protein contributes to the maintenance of muscle mass”, and `magnesium → muscle-recovery` with a citation titled “Magnesium contributes to normal muscle function”. These are related but not semantically identical claims; a human reviewer should check wording before approval.

## Why the user cannot see all rows yet

- The browser UI currently shows the source selector, but the running backend ignores `sourceStatus=missing`. A read-only request for missing-source claims returned cited nutrient-benefit rows too, proving the runtime route is stale relative to source. It also omitted paging metadata.
- The implementation in the worktree now filters against `source_refs` and pages globally in stable order (50 rows per page, exact total). `npm run build` passes.
- The existing app process is not restarted. `server/index.ts` calls `runMigrations()` and `storage.syncAllPantryDefaults()` during startup. Restarting may apply pending development migrations and synchronize missing pantry defaults, so it was not done without owner authorization. Browser-visible filter/paging remains unverified until the service reloads.

## Evidence sources and correct roles

- **Food composition:** USDA FoodData Central publishes nutrient composition data; it can support a food→nutrient amount/source claim, not a physiological outcome. [USDA FoodData Central](https://fdc.nal.usda.gov/about-us/).
- **Canadian composition:** Health Canada's Canadian Nutrient File is an official Canadian food-composition reference. Its 2026 dataset includes nutrient amounts for common foods. The older CNF FAQ explains that prior versions derived much data from USDA and adjusted for Canadian fortification/regulatory context; use current CNF records and their own metadata rather than assuming every row is independent. [Health Canada: Canadian Nutrient File](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/nutrient-data/canadian-nutrient-file-about-us.html), [CNF FAQ](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/nutrient-data/frequently-asked-questions-canadian-nutrient-file.html).
- **UK consumer/public-health information:** NHS iron page supports the role of iron and lists specific foods as iron sources. [NHS: Iron](https://www.nhs.uk/conditions/vitamins-and-minerals/iron/).
- **Nutrient health effects and evidence summaries:** NIH Office of Dietary Supplements provides evidence-based fact sheets for health professionals and consumers. It can help research nutrient→benefit claims, with evidence limitations and population context. [NIH ODS: Iron for health professionals](https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/), [ODS health information](https://ods.od.nih.gov/HealthInformation/healthinformation.aspx).
- **Permitted health-claim wording:** the European Commission's Health Claims Register identifies authorized and non-authorized claims and their conditions/restrictions. It is a wording/authorization authority, not a general discovery source for every food-health pairing. [EU Register of Health Claims](https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/eu-register-health-claims_en), [Commission health claims](https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/health-claims_en).

**Verified from `shared/knowledge/evidence.ts`:** trusted domains currently include NHS, UK Government, EFSA, European Commission, EUR-Lex, NIH ODS and British Nutrition Foundation. USDA and Health Canada are not in the validator allowlist. Existing seed code contains cited claims; this task does not modify the allowlist. An “any official website” wildcard would be too broad: source trust must be assigned by role (composition, health effects, permitted wording), exact statement and conditions.

## Architecture alignment and recommendation

Canonical claim IDs/edges and their single `source_refs` owner remain unchanged. Food Intelligence architecture requires external evidence to pass editorial review before it becomes canonical/user-visible; generated reasoning must not author claims. Reuse the current Admin claim review, canonical knowledge store and evidence validator.

A safe source-research flow should propose a claim-keyed candidate with: exact official page/table, quote or nutrient row, food identity and preparation match, nutrient/benefit relation, units/portion context where needed, source role, date/version, uncertainty/conflicts and a reviewer action. AI can locate and summarize candidates, but it should never become evidence, silently attach an unsupported pair, or approve/sign off. Start with nutrient-benefit gaps and specific composition claims; do not try to source all 3,299 uniformly. The direct food-benefit edge needs an architecture-aware decision before research automation.

## Scope and side effects

The accompanying code change adds filter/paging only. No queue records, source refs, approvals, schema, trust policy, database, production config, live service or scheduled task were changed. The app server was not restarted. Rollback tag: `rollback/KNOW3-uncited-claim-filter-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f`. Snapshots for the follow-up code edits are at `G:\The Healthy Apples\Incoming\Rollback Evidence\KNOW3_QUEUE_PAGING_20261105\manifest.json`.
