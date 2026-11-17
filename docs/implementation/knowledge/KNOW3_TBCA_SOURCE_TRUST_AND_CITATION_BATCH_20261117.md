# KNOW3 TBCA source trust and citation batch — 2026-11-17

## Objective and scope

Add the owner-approved Brazilian Food Composition Table (TBCA) domain as a composition-only citation source in Integrated Dev, then attach only exact, qualified citations through the existing guarded claim writers. The work did not approve or reject claims, change claim amounts, alter schema, or deploy anything.

## Governance preflight

- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Branch / HEAD:** `feat/integrated-dev` / `982eb38b3bc7479e6bcfb847373ef29a643b69c6`
- **Risk:** Red — trusted-source policy and development-local citation persistence.
- **User approval:** Colin explicitly approved `tbca.net.br` as composition-only on 2026-11-17. This authorization did not include publication or claim approval.
- **Governing documents read:** `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/ai-operating-model/README.md`; `principles.md`; `risk-and-approval.md`; `rollback-and-output.md`; `evidence-and-architecture.md`; `implementation-and-compliance.md`.
- **Architecture compliance (Verified):** the existing Layer-1 citation validator in `shared/knowledge/evidence.ts` remains the single source-trust owner. Existing consumers include `shared/knowledge/index.ts`, `server/lib/knowledge-claim-review-store.ts`, and the guarded claim citation scripts. No second validator or state store was introduced.
- **Standing dev implementation authority:** the repository is on the designated dev branch and AGENTS.md records standing implementation permission for that branch; this task's narrowly scoped source-policy change was explicitly owner-approved.
- **Pre-change worktree:** unrelated benchmark and intelligence changes were already dirty, including unrelated dirty hunks in `shared/knowledge/evidence.ts`; all were preserved. A byte-exact pre-edit copy of that already-dirty file is at `G:\The Healthy Apples\Incoming\Rollback Evidence\KNOW3-TBCA-20261117\evidence.ts.pre-change` (SHA-256 `E4A83C9EC3EFC92B2F17FE879F09EA796BE72098FF133E721962B1175BDB19DA`).
- **Rollback anchor:** local annotated tag `rollback/KNOW3-tbca-composition-20261117` targets the HEAD above. It protects committed history; the separate pre-edit copy protects the existing dirty file content.

## Change and evidence

### Source trust policy

`shared/knowledge/evidence.ts` now lists `tbca.net.br` in the existing trusted domains and the existing composition-only domain list. This allows TBCA citations on food-to-nutrient composition claims; `isSourceAllowedForClaim` continues to reject composition-only sources for food-benefit and nutrient-benefit edges.

FAO/INFOODS lists TBCA as the Brazilian Food Composition Table maintained by the University of São Paulo Food Research Center. The trust addition follows that official table attribution and is bounded to composition data.

### Guarded citation writes

All writes used `scripts/attach-reviewed-composition-evidence.ts` or `scripts/attach-reviewed-prepared-claim-evidence.ts` with `preview` → `apply` → `verify`, on the development-local Neon branch only:

- **#5136 potato-gnocchi → manganese:** TBCA record BRC0920B describes cooked potato gnocchi with egg, margarine and wheat flour and lists 0.30 mg manganese/100 g. TBCA labels this value calculated; citation is therefore marked emerging and limited to this recipe form.
- **#4331 potato-starch → manganese:** TBCA record BRC1040B lists 0.31 mg manganese/100 g for raw potato starch. Its statistical record identifies USDA SR28 reference 1742 and labels the value attributed, not a TBCA analytical sample; citation is marked emerging with that provenance disclosed.
- **#1646 fenugreek → energy-support:** a PubMed-indexed randomized trial found reduced dysmenorrhea-associated symptoms that included fatigue/lack of energy after fenugreek seed-powder capsules. The citation is marked emerging and explicitly limited to the menstrual-symptom context and capsule-dose form; it does not establish a general energy effect from ordinary servings.
- **#5108 gnocchi → manganese:** TBCA record BRC0920B describes cooked potato, egg, margarine and wheat-flour gnocchi with 0.30 mg manganese/100 g. The citation is marked emerging and explicitly limited to that recipe; it does not generalize the value to all gnocchi.

Each claim was freshly checked as active, pending, and uncited before the guarded write. Post-write verification confirmed the intended source reference is present and `reviewed_at` and `rejected_at` remain null. Claim amounts were not edited.

### Excluded near-match

TBCA's imported star-anise record uses `Illicium verum` as the food name but its value references USDA SR28's “Spices, anise seed,” which is *Pimpinella anisum*. Because anise and star anise are different species, no citation was attached to #1024 or #1025.

## Verification and data impact

- Guarded previews, applies, and verifies succeeded for all four claims.
- Live uncited queue after the writes: **104 total** — 33 composition, 71 food-benefit, 0 nutrient-benefit.
- Live pending rows: composition 173; food-benefit 369; nutrient-benefit 10.
- Approved/rejected counts were unchanged. These citation candidates remain pending and are not visible as signed-off claims.
- No tests were run; the user did not request tests. The guarded scripts exercised validation and writes through the canonical validator and writer. No service restart, migration, production access, schema write, or trust change beyond the single TBCA domain occurred.

## Definition of done / remaining work

Done for this bounded change: the approved domain is composition-only; three evidence-backed candidate citations were attached and verified; all claims remain pending; no amounts or decisions changed; rollback data and an implementation report were preserved.

The broader food-source review is **not complete**. The latest live queue contains 104 uncited claims. Official-table coverage gaps and food-benefit claims requiring direct outcome evidence remain under review; no unsupported proxy citation was added.

## Files and artifacts

- Modified: `shared/knowledge/evidence.ts` (one TBCA-domain addition in each of the existing trust and composition-only lists; pre-existing dirty hunks retained).
- Guarded manifests/receipts: `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-17__codex__KNOW3-tbca-potato-gnocchi-manganese-batch.json` and receipt; `...__KNOW3-tbca-potato-starch-manganese-batch.json` and receipt; `...__KNOW3-fenugreek-energy-support-batch.json` and receipt; `...__KNOW3-gnocchi-manganese-batch.json` and receipt.
- Rollback tag and dirty-file pre-state: listed above.
- Deployment: none. No commit was created.

## Process deviation disclosed during the task

The TBCA trust-policy edit began before the complete required workflow-document preflight was finished and before the rollback tag was reported to the owner. The missing workflow, architecture-principles, source-of-truth, operating-manual and rollback-protocol documents were read in a later audit; the source-policy scope was confirmed to remain within the user's explicit TBCA composition-only authorization. The deviation was disclosed in task commentary and is recorded here. No further code or trust-policy edits were made during the continuation; citation attachments used the existing guarded writers.
