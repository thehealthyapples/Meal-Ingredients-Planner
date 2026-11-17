# KNOW3 EMA, LWW, and celeriac evidence attachments — 2026-11-17

## Task and authorization

Continue the owner-authorized review of active, pending, uncited food/nutrient claims. This implementation covers trusted-source additions for `ema.europa.eu` and `journals.lww.com`, citations for claims #3274 and #818 only, and a PubMed citation for #684. Risk: **Red** because source trust policy and development-local persistence are involved. Claims remain pending; no decisions or nutrient amounts changed.

## THA Governance Preflight Receipt

- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Worktree / branch / HEAD:** `feat/integrated-dev` / `fdfaef0ef261c95a94bf6022ccb7d6db903540de`
- **Git status:** 17 pre-existing entries before this pass; unrelated edits preserved. This pass added one repository report, for 18 total status entries.
- **User request:** approve LWW as a reputable source; continue attaching relevant evidence to the source queue.
- **Mandatory governance read:** workspace `G:\The Healthy Apples\AGENTS.md`; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs\architecture\README.md`; `docs\architecture\ENGINEERING_WORKFLOW.md`; `docs\ai-operating-model\README.md`; relevant operating-model files.
- **Task-specific architecture / workflow read:** `docs\architecture\PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`; `docs\architecture\THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`; `docs\architecture\ARCHITECTURE_PRINCIPLES.md`; `docs\architecture\THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs\implementation\knowledge\KNOW3_SOURCE_ATTACHMENT_WORKFLOW_20261105.md`; `shared\knowledge\evidence.ts`; `server\lib\knowledge-claim-review-store.ts`; `scripts\attach-reviewed-prepared-claim-evidence.ts`.
- **Existing assets inspected:** the Layer-1 URL allowlist, role-specific composition-only guard, guarded pending-claim writer, live claim rows, audit history, and runtime nutrition registry consumers.
- **Authorized scope:** admit EMA and LWW hosts as trusted benefit-evidence domains; attach EMA monograph to #3274 only and the LWW review to #818 only; attach the exact-food PubMed celeriac study to #684 with an explicit preclinical limitation; keep all pending.
- **Explicit non-goals:** no approval, rejection, amount change, `reviewedAt`/`reviewedBy` change, broad source application, schema/migration, restart, deployment, commit, or promotion.
- **Architecture/governance conflicts:** NONE found.
- **Decision/risk:** approved source-trust and citation scope; Red.
- **Implementation permitted:** YES under Integrated Dev standing dev-branch authority and the user's explicit source approvals.

## Architecture compliance

- **Verified:** canonical claims own `source_refs`; `recordClaimSourceChange` is the only write path used here, with the existing audit ledger. No second evidence store or workflow was introduced.
- **Verified:** `shared/knowledge/evidence.ts` remains the single Layer-1/Layer-2 trust gate. The existing `nutrition-knowledge-registry.ts` consumers continue to require a named human review before rendering; these citations do not publish claims.
- **Verified:** all three updates used the existing guarded writer and development-local database branch. No raw SQL was used.
- **Data domain:** Food Knowledge / claim evidence. New store: NO. Existing claim store extended: YES. New consumer: NO.

## Evidence and changes

1. **#3274 — juniper berries → gut health.** Attached the current EMA/HMPC 2023 final monograph. It describes traditional medicinal use for symptomatic relief of dyspepsia and flatulence, including specified herbal preparations. It does not establish a benefit from ordinary culinary quantities or the broader phrase “gut health.” Citation is marked `emerging`; the limitation is recorded in `evidenceExcerpt`.
2. **#818 — vanilla → digestive comfort.** Attached Keith W. Singletary's 2020 *Nutrition Today* narrative review on the LWW publisher site. The review describes traditional medicinal gastrointestinal use but says evidence for human health benefits is limited and preliminary. The article discloses McCormick and Co. funding. It does not establish a digestive benefit from ordinary culinary amounts. Citation is marked `emerging`; those caveats are recorded in `evidenceExcerpt`.
3. **#684 — celeriac → immune support.** Attached the 2025 peer-reviewed study indexed by PubMed. It tested celeriac root and aerial-part ethanolic extracts in LPS-stimulated macrophage cells and found reduced inflammatory markers. This is preclinical cell evidence, not a human dietary immune-support outcome. The limitation is recorded in `evidenceExcerpt`.

The source-policy change adds `ema.europa.eu` and `journals.lww.com` to the existing trusted-domain list. EMA is official EU medicinal evidence; LWW is a peer-reviewed publisher but its journal review is secondary scientific evidence and is not official health guidance. The trusted-domain mechanism is host-level; actual citation writes in this pass were limited to the three named claims above.

## Data impact and verification

- Reads existing claim rows and audit history: YES.
- Writes new data: YES — one citation and audit event each for #3274, #818, and #684.
- Changes claim meaning or decision state: NO.
- Backfill/schema/migration: NO.
- Live queue before this evidence pass: 78 uncited after the already-completed #4356 DOAE attachment.
- This pass attached 3 citations. Current uncited queue: **75** (15 composition, 60 food-benefit, 0 nutrient-benefit). The 3 affected rows remain active and pending.
- Guarded writer `preview` passed for all 3; `apply` attached all 3; `verify` passed and reported citations present while claims remained pending. `pendingCited` for food-benefit moved from 306 to 309; approvals/rejections unchanged.
- No tests run, by instruction. No raw SQL, production/staging data, service restart, migration, deployment, push, or commit.

## Trust check and remaining uncertainty

- The EMA source is official and current, but its narrow medicinal indication is not proof for culinary use. The LWW journal is peer-reviewed, while the cited vanilla review has a disclosed industry funder and explicitly limited/preliminary human evidence. The celeriac paper is peer-reviewed but preclinical. These distinctions are visible in each evidence excerpt; none of these citations is sign-off.
- **Highest-risk remaining inference:** a host-level trusted-source allowlist admits other pages on the same hosts; the user's approvals limit the citations actually attached here, not the allowlist's host-matching semantics.
- No claim was guessed or presented as approved. Unsupported routes/forms remain uncited and pending.

## Rollback and definition of done

- **Rollback tag:** `rollback/KNOW3-ema-lww-benefit-sources-20261117` → `fdfaef0ef261c95a94bf6022ccb7d6db903540de`.
- **Pre-change snapshot:** `G:\The Healthy Apples\Incoming\Rollback Evidence\KNOW3-EMA-LWW-20261117\evidence.ts.pre-change`, SHA-256 `93926926946C8E6CE96E98A49C433A0601DE83A03E9F6DCFB1469F2CC7E2D51E`.
- **Database receipt:** `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-17__codex__KNOW3-ema-lww-benefit-citations-receipt.json` and `2026-11-17__codex__KNOW3-celeriac-immune-evidence-receipt.json`. Pending citations can be removed through the existing audited source-change operation; do not reset or overwrite the unrelated dirty worktree.
- Done for this pass: approved host entries added; three exact claim citations attached through the guarded writer; all claims remain pending; batch receipts saved.
- The larger source-review task is **not complete**; 75 active pending uncited items remain.

## Scope lock and suggestions

- Implemented: the two approved trusted hosts and the three described evidence attachments only.
- Excluded: claim decisions, broader trust-policy redesign, other source domains, and any further citation applications not yet researched.
- **SUGGESTIONS:** consider a future URL/edge-scoped trust rule if owner intent is that approvals of specific sources should not admit other URLs on those domains; no such redesign was made here.

## Separate caution research note

In line with the owner's standing request to record negative-effect signals in a flat file, the source review added one chervil allergy case to `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-17__codex__food-caution-research-notes.md`. It is one case report involving a patient with other food allergies and is explicitly not presented as a general population warning. No app caution claim was created or changed.

## Capability boundary assessment

- Architecture complete: PARTIAL — existing architecture reused; broader uncited queue remains.
- Engineering complete: PARTIAL — guarded preview/apply/verify completed; no tests run.
- Interaction complete: PARTIAL — citations should be visible in Admin claim review, but no browser confirmation was performed in this pass.
- Existing assets used: trusted-source validator, claim review registry, guarded source-change writer, audit ledger, nutrition knowledge runtime gate.
- New assets required: NONE.
- Remaining gap: 75 uncited claims — **Repository/evidence gap** where exact official or peer-reviewed human food-use evidence is not located; impact is claims remain unavailable for approval; next action is continue exact source research and record unsupported/mismatched findings; capability remains existing KNOW3 claim review.
- Stop test: NO — independent work remains in the 75-row queue.
