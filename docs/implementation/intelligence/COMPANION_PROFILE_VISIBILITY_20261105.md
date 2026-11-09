# Companion profile visibility — 2026-11-05

## Governance preflight
- Repository/area: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, integrated-dev / Profile / Household / Companion health-context display.
- Branch and base: `feat/integrated-dev`, committed HEAD `3467abad4eca8d82ffc52756fee13874e389597f`.
- Risk: **RED** — authenticated personal health information and household-dependent records are added to profile projections.
- Implementation permission: **YES** under the standing dev-branch authority in `PROJECT_GOVERNANCE.md`; user directly requested Companion updates be visible under Profile. No promotion or activation permission is inferred.
- Rollback tag: `rollback/companion-household-health-write-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f`. Exact pre-edit snapshots of the touched files are in `.engineering/session/rollback-evidence/COMPANION_PROFILE_VISIBILITY_20261105/manifest.json`.
- Governing files read: `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/ai-operating-model/README.md`, `docs/ai-operating-model/principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, `implementation-and-compliance.md`, `docs/architecture/capabilities/profile.md`, and `docs/architecture/capabilities/household.md`.

## Architecture and scope
- **Verified owner:** adult and dependent reported-health records live on `household_eaters` (Domain 16); Profile and Household are projections of that owner. No duplicate state or table was added.
- **Verified permission boundary:** the adult's `/api/profile` response is session-scoped; the household eater list is resolved from the active household. Adult reported context is kept out of that shared list. Account-less dependent context is returned only to an active household member with current health-data consent.
- **Change:** Profile now shows a clearly labeled, not-independently-verified card for the caller's own reported health context. Existing Household Eaters cards show dependent records shared with Companion.
- **Scope lock:** display existing Companion-reported health context only. No new field, medical method, diagnosis, restriction, action, migration, database change, or condition-specific nutrition recommendation was added. Specific nutrition-focus preferences (for example, “boost iron”) remain a separate capability gap; broad `healthGoals` is not treated as that owner.
- **AI compliance:** this display consumes the existing profile and household projections; no new assistant, capability, conversation state, or access route was created.
- **Data impact:** authenticated reads only; no stored rows changed. Consent is rechecked for each profile projection. No runtime restart or migration applied.

## Verification and acceptance
- `git diff --check -- server/routes.ts client/src/pages/profile-page.tsx`: passed.
- `npm run typecheck`: failed on pre-existing errors in untouched scripts and test fixtures (missing `categories`, stale resolver/context fixtures, and unrelated discovery/meal mocks). No reported type errors in the changed Profile or route code.
- No test suite run; no live service, browser, database, provider, or scheduled task touched.
- Manual acceptance, not run: sign in to integrated-dev, visit `/profile`, and confirm an adult's own reported context appears in the “Health information shared with Companion” card; confirm a dependent's report appears on that member's Household Eaters card; verify a second adult's private context does not appear in the first adult's household list; withdraw consent and confirm projections hide/clear as expected.
- Activation limitation: current running server must be restarted to load the previously authored health-context migration and this route change; this task did not restart it.

## Remaining claims and SUGGESTIONS
- **Verified:** current profile projections did not include `reportedHealthContext`; now the dev code does.
- **Inferred:** dependent context is appropriate to show to active household adults based on the recorded consent wording and existing household-scoped permission model.
- **SUGGESTION:** define a distinct per-person nutrition-focus field and confirmation intent before Companion starts saving preferences such as “more iron” or “more protein.” Keep it separate from hard restrictions and medical reports.

## Files changed in this task
- `server/routes.ts`
- `client/src/pages/profile-page.tsx`
- Snapshot evidence: `.engineering/session/rollback-evidence/COMPANION_PROFILE_VISIBILITY_20261105/`
