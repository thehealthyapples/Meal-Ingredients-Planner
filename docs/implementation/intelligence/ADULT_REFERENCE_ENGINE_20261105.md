# ANR1 calculation foundation — 2026-11-05

## Governance preflight and scope

Owning repo G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003; feat/integrated-dev; base HEAD 3467abad4eca8d82ffc52756fee13874e389597f. Pre-change Git status 194 entries; pre-existing work preserved. User approved ANR1, method selection and continuing implementation. Risk Red, personal nutrition reasoning. Implementation permitted YES for the deterministic calculation foundation under existing Food Intelligence; source publication/runtime activation remains subject to the already-approved ANR1 release gate. No delegation.

Read AGENTS.md, PROJECT_GOVERNANCE.md mandatory bootstrap/dev authority, docs/architecture/README.md, ENGINEERING_WORKFLOW.md AI compliance, THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §5.1, NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md ownership/evidence, shared/knowledge/evidence.ts and review gates, shared/schema.ts/profile reader in preceding method audit, and ADULT_NUTRIENT_REFERENCE_METHODS_20261104.md. THA Operating Model skill applied in continuing work. No new authority conflict; sports paper does not pass the existing trusted-domain list and remains a candidate. Trusted domains were not widened.

## Changes and ownership

- shared/knowledge/nutrient-reference-methods.ts defines a typed knowledge method contract and three unpublished protein research candidates. ReviewedAt/reviewedBy remain null and sourceRefs empty; research URLs are separate candidate metadata. No published reference dataset or human sign-off is fabricated.
- server/intelligence/food-intelligence/nutrient-reference-engine.ts adds a pure derived calculation to the existing Food Intelligence area. It reuses isEvidenceBackedClaim, isValidSourceRef and validateReviewState. Only uniquely identified reviewed methods with named reviewers and trusted valid dated citations can calculate.
- The engine supports source-defined mass formulas, genuine lower/upper ranges, and age/sex table lookup. Fixed RNI/PRI values cannot silently become ranges. Missing requested values, unconfirmed scope/mass, invalid units/numbers, ineligible ages, ambiguous table rows and cross-person access produce structured nonnumeric statuses. Independent calculations retain units, method/version, source chain, inputs used, reviewer, assumptions and generation timestamp.
- server/tests/test-adult-nutrient-reference-engine.ts supplies isolated reviewed test fixtures, never production approval. Covers UK/EFSA arithmetic, exercise endpoints, pounds/kg equivalence, age/table boundaries, missing inputs, unavailable methods, withdrawn/future/untrusted review, duplicate IDs, invalid coefficients/overflow, data isolation and provenance.

Verified ownership: method candidates stay in existing Nutrition Knowledge shared seed area; deterministic reasoning lives under Food Intelligence. The engine owns no profile, intake, household record or conversation. No DB, network or model calls occur. No capability is registered or advertised as available; current production candidates always return method-unreviewed. Intended future consumer: an existing registered Food Intelligence/Nutrition handler after the canonical review and integration gates. Current consumer: isolated regression suite only. This is intentionally an unpublished foundation, not a second assistant or approval workflow.

## Validation

- npx tsx server/tests/test-adult-nutrient-reference-engine.ts: 38 checks passed.
- Scoped TypeScript compiler program using existing tsconfig options on the three new files and their dependencies: zero diagnostics; no temporary configuration file or whole-repo error suppression.
- npm run build: client/server passed, existing Browserslist/PostCSS/bundle-size/CJS import.meta warnings.
- Source review/scoped whitespace check: passed. New files inspected; diff --check does not itself inspect untracked contents.
- No personal live-data queries, no additional OpenAI/Claude benchmark or public source requests, no mutation tests against real records. Existing benchmark scores do not measure this unpublished engine.

## Definition of done, trust and data

Foundation acceptance: known independently calculated examples match; no number returned for any current production candidate; source/reviewer/access/eligibility failures remain nonnumeric; no persistence or generated arithmetic. These checks pass. No UI acceptance is claimed because no interface/route is added.

Data impact: new source files only; no schema/backfill/profile/config changes. Trust check: implementation/test claims Verified by commands above. Highest remaining uncertainty: real-world method suitability and reviewed table completeness are not established by these software fixtures. Codex research is not a qualified named source sign-off.

Rollback: rollback/adult-reference-engine-20261105 -> 3467abad4eca8d82ffc52756fee13874e389597f, created/reported before edits. All task source files were new; remove only these task files/report/session record to revert, preserving all pre-existing dirt. Tag protects committed state only. No local commit, push, deployment or promotion performed. Release timing: dev foundation only; no runtime activation.

## Completion boundary and next steps

Calculation foundation complete. Adult personal reference guidance is NOT live. Remaining external evidence gate: named human review of the selected methods, source populations, source admission where needed, source dates/versions and independently checked micronutrient tables. Existing ANR1 §5.1(7) and evidence.ts prohibit treating candidate research as published truth. Remaining repository work: canonical review/publishing integration for this method shape (the engine is not a new sign-off writer); transient confirmed-input/permission integration through existing capability and Context Composition; profile/per-adult/privacy/schema decisions before storing absent age/sex/eligibility; real Companion wording/numerical tests; Product Knowledge availability update in the activation change. Account-less adult and cross-person support remain outside first scope. Diary intake calculation still needs resolved foods and structured portions. No body target or calorie prescription added.

No new runtime exposure was added merely to bypass source review. Independent arithmetic and evidence/access validation were completed before stopping at that boundary. Gaps are external reviewer/evidence and repository integration dependencies, not model capability limitations.
