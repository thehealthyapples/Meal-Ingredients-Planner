# MyNetDiary comparison evidence update

- **Date:** 19 November 2026
- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Branch / starting HEAD:** `feat/integrated-dev` / `251ee984e214966434c5ee88335851e75be810df`
- **Governance preflight:** Read `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `docs/architecture/README.md`, `ENGINEERING_WORKFLOW.md`, `ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_BLUEPRINT.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md`, `THA_UI_ARCHITECTURE.md`, `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `REPOSITORY_CONVENTIONS.md`, `docs/change-control.md`, and task-routed `docs/ai-operating-model/{principles,risk-and-approval,rollback-and-output,evidence-and-architecture,implementation-and-compliance}.md`. No conflict found. User continuation and standing dev-branch authority permit this scoped implementation. **Risk: Amber** — public comparator claims and detail behavior are refined.
- **Rollback:** `rollback/CMP-MyNetDiary-evidence-20261119` → `251ee984e214966434c5ee88335851e75be810df`. This tag covers committed HEAD, not pre-existing dirty worktree files.
- **Scope:** MyNetDiary's existing static evidence row and source-review records; the existing detail panel now shows the checked date for claims that carry reviewed provenance.

## Architecture compliance

- **Verified:** `client/src/pages/features-compare-page.tsx` remains the single owner/consumer of the static public comparison matrix and its detail interaction. This extends its existing `Evidence` shape; it adds no entity, store, API, service, persistence, or second workflow.
- **Verified:** no meal, household, diary, or nutrition runtime fact is read or written. No Product Knowledge Registry entry is changed because THA's own capabilities and page purpose are unchanged; only source-reviewed competitor evidence is refined.
- **AI compliance:** No THA AI logic or claim was introduced. Competitor AI descriptions are sourced and include plan tier plus review caveats.

## Experience Constitution Check

- **Hospitality:** the table remains a concise one-page grid; provenance is available in the existing detail interaction.
- **Outcome:** improves confidence in comparison claims.
- **Weight:** no additional row or permanent surface was added.
- **Voice and ownership:** evidence details report documented facts and limits; they do not advise or rank a household.
- **Agency:** evidence leaves the choice with the reader.
- **Restraint:** no score or winner is introduced; uncertainty remains grey.
- **Layer:** implementation expresses the evidence and source-reference requirements of the governing experience and architecture; no new rule is established.

## Changes and impact

Reviewed all 30 MyNetDiary tasks against its official help center. The row now includes its weekly planner and plan reuse, custom recipes and imports, photo logging, food and nutrient diary, weight and barcode tracking, offline limits, custom mood trackers, and Premium Plus meal suggestions/AI Coach. It distinguishes Apple Family Sharing from a shared meal-planning workflow, and flags that shopping lists do not sync across devices under the same account. Standalone shopping lists are listed as Free by the newer feature guide; using the weekly Meal Planner to generate the list remains Premium. Every assessed MyNetDiary cell now carries a claim URL and `lastReviewed` date; the existing evidence detail displays that date.

**Data impact:** Reads public official help documentation; writes static competitor comparison labels and Markdown records. No personal data read, new persistent data, meaning change to household data, schema change, or backfill.

**Trust check:** Material claims have direct developer sources and a checked date. Unknowns are neutral and do not state absence. Highest residual uncertainty: actual behavior/availability by platform, region, subscription, account and rollout; this was not hands-on tested.

## Definition of done and acceptance

- All 30 comparison tasks are mapped in the audit record.
- No unsupported capability is colored red; “not reported” remains grey.
- **Starting page:** `/features&compare`.
- **User action:** select MyNetDiary from the competitor names, then open a dot.
- **Expected:** rows sort by MyNetDiary's evidence; detail includes the claim/limitation, source link and `Source checked 2026-11-19`.
- **Regression:** app routing and matrix selection are unchanged; production build succeeds.
- **Verification result:** build passed and emitted `features-compare-page` in the bundle. Browser acceptance passed on the local page: selecting MyNetDiary sorted its features, and opening photo logging showed the documented limitation plus the checked date. Repository-wide typecheck failed on existing diagnostics in other files; no diagnostics named the comparison component. `git diff --check` result recorded after review.

## Scope lock, rollback and completion

No competitor rows other than MyNetDiary were changed. No deployment, push, database, live service, scheduled task or configuration was touched. Roll back this slice by reverting its scoped local commit; the tag above marks the committed starting point but does not restore unrelated dirty content.

**Product Registry Impact:** NO — no change to THA product description, route purpose, visibility, or capability.

**Adoption Register Impact:** NO — no client-side building block was introduced, adopted or retired.

**Domain Impact:** comparison evidence only; no product domain store changed, no new store, no new consumer.

**Engineering completion:** implementation and production build complete; typecheck is blocked by unrelated pre-existing diagnostics; local browser acceptance passed. **Remaining gap:** none for this slice.

## SUGGESTIONS

Continue the same all-30-task source audit with the next high-overlap competitor. A popularity ranking remains a separate evidence task after the review set is current.
