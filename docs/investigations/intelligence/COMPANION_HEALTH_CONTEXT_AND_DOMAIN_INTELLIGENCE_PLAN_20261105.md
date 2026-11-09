# Companion health context and broader intelligence — readiness review — 2026-11-05

## Preflight
- Owning repository/area: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`; Companion, Intelligence Platform, Profile, Nutrition Knowledge, Food Intelligence.
- Branch/HEAD: `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`.
- Worktree: about 210 pre-existing modified/untracked entries; preserved. This review adds only this investigation document and its required Incoming report.
- Governance actually read: `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/ai-operating-model/README.md`; `docs/ai-operating-model/principles.md`; `risk-and-approval.md`; `evidence-and-architecture.md`; `implementation-and-compliance.md`; `rollback-and-output.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; and `docs/change-control.md`.
- Governing task architecture actually read: `docs/architecture/THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md`; `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`; `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §§5–6; `COMP_AUTH1_COMPANION_AUTHORITY_MODEL.md`; `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`; `THA_INTELLIGENCE_LANGUAGE_GUIDE.md`; `GOVERNING_EXPERIENCE_ARCHITECTURE.md`; `THA_EXPERIENCE_ARCHITECTURE.md`; `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`; `NK2_THA_NUTRITION_METHODOLOGY.md`; and `docs/implementation/intelligence/ADULT_NUTRIENT_REFERENCE_METHODS_20261104.md`.
- Risk: RED for any implementation of persistent health context or condition-informed food selection (special-category data and AI behavior). No implementation or database/runtime action was taken in this review.

## Verified current state
- `server/intelligence/handlers/profile-read-handler.ts` and `server/intelligence/bindings/profile.ts` expose a permission-aware, own-profile **read-only** Companion capability. Writes intentionally fall through as an honest gap.
- Profile/settings code can edit existing preference fields using `/api/profile` and `storage.updateUserPreferences`, but the canonical model has no structured “user-reported health context” fact. The generic `healthGoals` list is not a safe substitute for a reported condition.
- `shared/privacy/consent.ts` has an account-level `health-data-processing` consent for storing household allergies, dietary restrictions, and health goals. Trust architecture classifies health information as special-category data, requires explicit consent, and requires consent vocabulary changes to accompany a real new processing purpose. The user's request adds a distinct reported-condition use and use for meal personalization; existing wording should not silently be stretched.
- `server/privacy/personal-data-registry.ts` owns profile/preference export and erasure. Any new persisted field must remain inside that owner's lifecycle, not create a second conversation-memory store.
- Food Intelligence architecture §5.1 admits reviewed adult general-wellbeing methods, but explicitly excludes diagnosis/treatment and says medical conditions require a separately reviewed scope and method before personalization. Companion may phrase structured, cited results; deterministic domain services choose results and foods.
- `shared/knowledge/nutrient-reference-methods.ts` currently contains only unpublished candidates (`state: candidate`, empty source refs, no reviewer); iron is absent. `server/intelligence/food-intelligence/nutrient-reference-engine.ts` blocks unreviewed methods. Call-site search found no Companion runtime caller; the current numeric reference preview is used by Admin.
- Nutrition/food suggestions already have canonical knowledge/composition and recipe services, but iron-specific meal ranking must trace to reviewed composition and source evidence; no claim that an iron-rich meal corrects deficiency should be emitted.
- Existing child protein approval remains Admin-preview-only and does not grant child health-context memory or Companion personalization.

## Recommended staged delivery

### First vertical slice: adult self-reported iron context and food discovery
1. Companion recognizes the statement as user-reported: “You’ve told me a clinician said you have iron deficiency.” It must never promote it to an app-verified diagnosis.
2. Companion asks separately whether to save that report to the caller's own profile. No save happens before an explicit yes. The user can inspect, correct, or remove it through the existing Profile/Privacy experience. No other household member or child is affected.
3. If declined, the current turn can still receive general, source-grounded information and meal ideas, without memory.
4. On request, use the existing canonical food/recipe and dietary-safety services to offer meals and foods with verified iron composition. Explain the food evidence and avoid claiming treatment, a guaranteed correction, deficiency severity, supplement/dose, or a personalized clinical iron target.
5. Write actions flow through the existing Capability Registry and Intent Engine to the Profile owner; reads use permission-aware bindings. The one Companion and conversation state remain unchanged.
6. Include consent purpose wording, user-reported provenance, export/erasure, access controls, auditability, and a refusal/revocation path. Obtain nutrition/editorial review of the method/evidence and applicable clinical/privacy review before runtime release.

This first slice is deliberately adult and caller-self-only. It does not imply child support, household-member attribution, other conditions, lab interpretation, deficiency diagnosis, supplement/dose advice, or a general nutrient target engine.

### Broader intelligence after that slice
Build a measured domain coverage map (intent → registered capability → canonical owner → source/evidence → permission → outcome/benchmark) across diary history, nutrient intake, missing-data honesty, recipes, shopping/food swaps, planner, pantry, household, and profile. Prioritize uncovered user questions and close them one vertical slice at a time. Reuse the existing Intelligence Platform/Capability Registry/Intent Engine, domain services, Context Composition, and Product Knowledge Registry. Keep model phrasing downstream of deterministic facts. Add cross-domain benchmarks for exact answer, evidence, permissions, clarifying questions, and honest gaps.

## Scope decision required before implementation
The owner's request is a clear product direction. The concrete adult iron flow above is recommended as its first slice, but it expands the current architecture's scope for storing user-reported medical context and personalizing food discovery from it. The current architecture says that condition-specific personalization needs separate explicit scope authority. The implementation would also touch sensitive-data consent/profile persistence, potentially schema, access/export/erasure, source review, and Companion AI behavior. A code change is therefore blocked until the owner approves this specific first-slice boundary and the detailed architecture/data decision is recorded.

If approved, the implementation plan must include a rollback tag at current HEAD and dirty-state preservation; migration/data impact and rollback; consent wording/version/re-consent handling; deterministic evidence and safety gates; cross-user and withdrawn-consent isolation; and manual Companion acceptance. Deployment is not included. No tag, migration, source-policy change, or implementation was started for this review.

## Sol question
Switching the model used for this Codex conversation does not change the model or capabilities running inside the app. Sol is not required to design this feature. The app gains dependable intelligence mainly from domain coverage, reliable data, permissions, evidence, and deterministic capability execution; the model can phrase those grounded results.

## Evidence paths
- `shared/privacy/consent.ts`
- `shared/schema.ts` (`userPreferences`)
- `server/privacy/personal-data-registry.ts`
- `server/intelligence/handlers/profile-read-handler.ts`
- `server/intelligence/bindings/profile.ts`
- `server/intelligence/capability-registry.ts`
- `server/intelligence/pattern-intent-resolver.ts`
- `server/routes.ts` (`/api/profile` and Admin-only nutrient-reference preview)
- `shared/knowledge/nutrient-reference-methods.ts`
- `server/intelligence/food-intelligence/nutrient-reference-engine.ts`
- `docs/architecture/THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md`
- `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`

No tests were run and no application data, services, provider, environment, or database were accessed or changed.
