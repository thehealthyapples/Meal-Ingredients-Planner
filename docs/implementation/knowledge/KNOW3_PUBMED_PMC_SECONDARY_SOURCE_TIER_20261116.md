# KNOW3 PubMed / PMC secondary source tier — 2026-11-16

## Scope and approval

Added PubMed and PubMed Central hosts to the existing Layer-1 source URL gate so claim reviewers can attach peer-reviewed scientific literature when official government or regulator sources do not address an exact claim. The owner approved this scoped trust-policy change in the current chat and required clear disclosure that PubMed/PMC literature is secondary to official sources such as NHS, USDA, Health Canada, and EFSA.

The change adds only `pubmed.ncbi.nlm.nih.gov` and `pmc.ncbi.nlm.nih.gov` to `shared/knowledge/evidence.ts`. It adds no claim, changes no source reference, and does not approve, reject, or alter any claim amount.

## Governance preflight receipt

- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Worktree / branch:** Integrated Dev, `feat/integrated-dev`
- **Base HEAD:** `9dda30555d83db0fe5bcc300ff370ef028926e3c`
- **Status:** Pre-existing dirty work preserved. In particular, `.engineering/session/CURRENT.md`, `shared/knowledge/evidence.ts`, benchmark files, local benchmark artifacts, and startup logs were already dirty/untracked. No unrelated changes were touched.
- **User request:** Continue source review; allow PubMed/PMC peer-reviewed literature as a secondary tier, prioritize peer-reviewed sources where available, and distinguish its status from official government/regulatory authorities.
- **Mandatory governance read:** workspace `G:\The Healthy Apples\AGENTS.md`; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/change-control.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`.
- **Task-specific architecture read:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`; `docs/architecture/NK2_THA_NUTRITION_METHODOLOGY.md`; `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`; `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`; `shared/knowledge/evidence.ts`; `client/src/pages/admin-knowledge-claims-page.tsx`.
- **Authoritative owner / consumers:** Food Knowledge claims remain owned by the existing `knowledge_*` registry and its source gate. The existing admin claim-review UI displays `SourceRef.body`, `title`, and URL; thus a prepared citation can label the source as peer-reviewed journal literature and name the journal, distinct from official guidance. No second store, writer, or review workflow was introduced.
- **Authorised scope:** two host allowlist entries in the existing Layer-1 validator only.
- **Non-goals:** no health-claim approvals/rejections; no composition amount changes; no citations written to the database; no database/schema/migration change; no runtime restart, deployment, or commit.
- **Architecture/governance conflicts:** None identified.
- **Risk:** 🔴 Red, because the trusted-source allowlist changes which URLs may pass the evidence gate.
- **Implementation permitted:** YES, under the owner's explicit approval for this exact scope.

## Rollback protection

- New scoped checkpoint: `rollback/KNOW3-pubmed-pmc-trust-20261116` → `9dda30555d83db0fe5bcc300ff370ef028926e3c`.
- Existing continuing-session checkpoint remains: `rollback/KNOW3-norwegian-source-20261116` → `9dda30555d83db0fe5bcc300ff370ef028926e3c`.
- Both tags protect committed state only; the repository had unrelated dirty/untracked work before the change, which is not captured by either tag.

## Architecture and data impact

- Canonical claim identity and ownership remain singular in the existing Food Knowledge registry.
- The existing source gate is extended; no parallel source registry, assistant, claim store, or review workflow is introduced.
- **Reads existing data:** no new application-data read.
- **Writes new data:** code allowlist only; no database rows written.
- **Changes meaning of existing data:** no existing citation or claim is reinterpreted. Eligible URLs from the two newly allowed hosts can now pass Layer 1 after the code is loaded.
- **Backfill:** none.
- **Trust condition:** prefer an official source when it directly supports the exact claim. Use PubMed/PMC only for the actual peer-reviewed article/review, verify article type and food form, and label the citation body with the journal and “peer-reviewed study/review” so users can distinguish it from government/regulator guidance. PubMed indexing alone is not a quality endorsement and does not turn a non-matching study into evidence.

## Definition of done and verification

- **Success:** only PubMed and PMC exact hosts are added; existing official domains and HTTPS requirement remain intact; source body/title remain visible in admin review for transparent labeling.
- **Must not break:** non-allowlisted sites remain blocked; approved claims and amount fields remain untouched; no source write or approval is performed by this policy change.
- **Verification performed:** inspected current `TRUSTED_SOURCE_DOMAINS` and `isTrustedSourceUrl`; confirmed the admin review UI renders `body`, `title`, and URL; inspected the diff for the existing source-gate file.
- **Not performed:** automated tests/build; server restart; citation writes. No guarded citation writer was available in this session, and the isolated in-app browser reached the app sign-in page. The local code change has therefore not been loaded into the running server.
- **Data impact / rollback:** restore the prior `TRUSTED_SOURCE_DOMAINS` entries from the rollback tag to block PubMed/PMC URLs again. No data cleanup or backfill is needed.

## Evidence review begun

- EFSA's 2026 open-access European Food Composition Database is an official composition resource covering approximately 28,000 commodities, harmonised from at least 16 national databases. EFSA exposes it through its European Food Composition Dashboard. The data dashboard endpoint returned HTTP 403 in the web extraction tool, so no item-level EFSA citation was attached in this pass.
- PubMed result `PMID 28890765` reports measured dietary fibre, protein and proximate composition for dried *Ulva lactuca*. It is a candidate for the queued sea-lettuce fibre row only if the canonical form matches the dried specimen. It does not establish an undifferentiated fresh/dried composition claim.
- PubMed results on konjac glucomannan include a randomized trial on supplementation for constipation and microbiota. They do not establish a health effect for the amount/form in the queued konjac-noodle food row, so they were not attached.

## Current queue and remaining work

The last verified live queue baseline remains 291 uncited claims (123 composition; 168 food-benefit; zero nutrient-benefit). This turn made no database changes, so the count is not expected to change. Continue exact-form evidence review and use only the application's guarded source writer. Keep claims pending and amounts unchanged.

## SUGGESTIONS

- The source record has no dedicated “official vs peer-reviewed literature” tier field. The current visible `body` field can disclose this distinction without changing schema; a formal source-tier field would be a separate architecture decision.
- The public dashboard's item-level export should be retrieved through its documented browser export or EFSA's downloadable model/data files once an accessible route is available.

## Completion state

This is a scoped trust-gate change and source-review continuation, not completion of the 291-claim review. No commit, restart, deployment, migration, claim approval/rejection, amount change, or citation write was made.
