# Companion confirmed profile health-context writes — 2026-11-05

## Governance preflight receipt

- **Owning repository / area:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003` — Companion, Profile, Household, Trust & Compliance, Food Intelligence.
- **Branch / HEAD:** `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`.
- **Implementation permitted:** YES — standing development-branch authority in this repository's `PROJECT_GOVERNANCE.md` § application dev-branch authority, with the user's direct request to implement confirmed Companion profile writes. This does not authorize promotion.
- **Risk:** RED — persistent special-category health information, child records, AI-mediated writes, and a schema change.
- **Rollback anchor:** `rollback/companion-household-health-write-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f` (committed state only).
- **Pre-existing worktree:** 212 modified/untracked status entries before this task. Preserved. Exact-byte snapshots were taken before editing the dirty files `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/product/intelligence/companion-capabilities/cap-companion.md`, `.engineering/session/CURRENT.md`, `server/migrations/runner.ts`, `server/routes.ts`, and `server/storage.ts`; SHA-256 values are in `.engineering/session/rollback-evidence/COMPANION_HOUSEHOLD_HEALTH_WRITE_20261105/manifest.json`.
- **Governing files read:** `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/ai-operating-model/README.md`, `principles.md`, `risk-and-approval.md`, `evidence-and-architecture.md`, `implementation-and-compliance.md`, `rollback-and-output.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `docs/change-control.md`, and `C:\Users\Colin\.codex\plugins\cache\personal\tha-bridge\0.2.0\skills\thehealthyapples-ai-operating-model\SKILL.md`.
- **Task architecture read:** `docs/architecture/THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` Domain 16, `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`, `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`, `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §§5–6, `COMP_AUTH1_COMPANION_AUTHORITY_MODEL.md`, `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`, `THA_INTELLIGENCE_LANGUAGE_GUIDE.md`, `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, NK1 and NK2.
- **Implementation permitted under scope lock:** confirmed adult-self and dependent-child capture of explicitly reported, food-relevant health context. No adult-to-adult edits, diagnosis, treatment, condition-specific recommendation method, deployment, production/staging action, or schema application is included.

## What changed

Companion now recognizes a narrow set of explicit health statements, resolves the intended person, and creates an action proposal. The chat displays the exact fact and target. The existing confirmation endpoint is the only write path; the user must confirm the proposal.

- An adult may save a report only to their own linked eater profile.
- An active adult household member may save a report to a dependent child's no-account eater record in that same household. The Companion resolves the child from household data; if the name is ambiguous or absent with multiple children, it asks.
- Both proposal and execution require a granted health-data consent for the current privacy-policy version. An outdated consent is surfaced in Privacy Settings for review and re-consent.
- Adult reported context is returned only in that adult's Profile projection. Child reported context is returned only to active household members after current consent. All values remain labelled as user-reported, not verified.
- The conversation timeline stores a neutral placeholder for these health statements. The pending proposal carries the exact value only until it succeeds, fails, or is cancelled; terminal proposals clear their parameters and label. A successful save then lives in the canonical eater profile.
- Consent withdrawal blocks use immediately and clears the caller's own profile context plus only dependent-child entries that caller reported; another adult's private context and child reports are preserved. Account export includes dependent-child entries the account holder reported; account erasure removes those entries while preserving entries reported by another adult.
- An additive migration adds `household_eaters.reported_health_context` as JSONB with an empty-array default. No backfill is needed.

## Architecture compliance

- **Verified canonical owner:** `household_eaters`, Domain 16. Adult and dependent-child facts live on their existing person records. No second profile store, Companion memory, or new conversation state was created.
- **Verified single workflow:** existing Intelligence Platform → Capability Registry → Intent Engine → permission/confirmation lifecycle is reused. Existing Profile and Household handlers/ports delegate to `server/storage.ts`; the existing action-confirm endpoint remains the sole executor.
- **Verified authority:** authorization derives from the authenticated account and active household membership. Adults can only update their own linked row; child writes require `user_id IS NULL` and an eater ID in the caller's server-resolved active household.
- **Scope boundary:** the Companion prompt labels reports as unverified and forbids diagnosis, treatment, cure, or condition-specific personalization without an explicitly reviewed method. The architecture now records that capture permission does not approve condition-specific advice.
- **Product Knowledge Registry:** updated `cap-companion` to describe confirmed health-context saving and its limits.
- **Adoption Register:** no new client building block was introduced; the existing Button, Profile/Privacy surfaces, and Companion action card are reused. No Adoption Register entry required.

## Data impact

- Reads existing account, household membership, eater, and consent records.
- Adds `reported_health_context` to the canonical eater record; no existing data is reinterpreted and no backfill is planned.
- New entries contain a UUID, the user's exact reported text, the reporting adult's user ID, and a timestamp. Entries are limited to 180 characters and 20 per person; exact duplicates are not appended.
- The migration is **authored but not applied**. No database, profile, diary, or household data was read or changed during implementation. No app process was restarted.

## Trust and privacy

- Consent and privacy-policy copy now include reported conditions/nutrient concerns and dependent children; the policy version is `1.1.0`.
- Consent withdrawal scrubs the caller's own profile context and child entries they reported; another adult's private context is preserved. Current-version consent is checked again at write time. Failure to erase is returned as an error rather than reported as success.
- Account export/erasure includes only child reports attributed to that account, so one adult's request does not remove another adult's reports.
- **Remaining risk:** the owner should review the updated special-category and child-data disclosures before any shared release. The implementation is development-only. Current capture consent does not create evidence for condition-specific meal recommendations.

## Definition of done and user acceptance

1. Open `/privacy-settings`; read the current Privacy Policy and grant the current health-data consent. Older consent versions cannot authorize a write.
2. In Companion, say: “I have been told I am iron deficient.” Expect a proposal that shows the exact statement as reported. No profile change should occur before confirmation.
3. Confirm the proposal. Expect success; a later Profile read should return the statement labelled as reported. A cancelled proposal should write nothing.
4. For one dependent child, say: “My daughter Ava has been told she is iron deficient.” The proposal must name Ava and show the exact statement. With multiple or ambiguous children, Companion must ask instead of choosing.
5. Confirm the child proposal. A later Household read should show that child's reported context to active household members; it must not show an adult member's private health context to another adult.
6. Withdraw health-data consent in Privacy Settings. Expect reported health context to be erased and subsequent reads/proposals to be blocked until consent is granted again.

These are manual acceptance steps, **not run**. No test suite was run. `git diff --check` passed for the clean files changed in this task. `npm run typecheck` did not pass: it reports existing errors in untouched scripts/tests (missing `categories` exports, stale resolver/context fixtures, and unrelated discovery/meal fixtures); the new-path type errors found in the first run were corrected and do not appear in the second output.

## Rollback and release

- **Code rollback:** restore only this task's edits using the recorded exact-byte snapshots for pre-existing dirty files; for formerly clean files, reverse this task's diff. Do not check out/reset the whole branch.
- **Tag:** `rollback/companion-household-health-write-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f`. The tag does not include uncommitted work.
- **Schema:** migration is additive and has not been applied. If applied later, do not drop the column while it contains reports; first export/erase the data through the governed privacy lifecycle, then remove the column only under a separate approved migration.
- **Release timing:** dev only; no promotion or deployment authorized/performed. The running server was not restarted, so the feature is not active in the current browser session. Restarting it will apply the migration through the existing startup runner and remains a separate runtime action.

## Remaining limitation

This delivers the requested consent-gated, confirm-before-write profile path. It does **not** yet enable condition-specific recommendations such as “meals for iron deficiency.” That remains blocked until a condition-specific source/method is reviewed and published through the existing Nutrition Knowledge evidence process.
