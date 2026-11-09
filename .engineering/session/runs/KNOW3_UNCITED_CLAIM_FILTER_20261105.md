# KNOW3 — Uncited claim source filter

## THA Governance Preflight Receipt

- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Worktree / branch / base HEAD:** `tha-integrated-dev-g-native-20261003` / `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`
- **Git status:** 314 pre-existing modified/untracked entries. Only `server/routes.ts` and `server/lib/knowledge-claim-review-store.ts` overlap implementation files; their exact byte snapshots and SHA-256 values are in `G:\The Healthy Apples\Incoming\Rollback Evidence\KNOW3_UNCITED_CLAIM_FILTER_20261105\manifest.json`. All unrelated work is preserved. The shared session dashboard was also dirty; its pre-session snapshot is included in that manifest.
- **User request:** Add a filter to show pending nutrition claims awaiting a source. Use official sources such as USDA, NHS, and appropriate Canadian official food/nutrition sources when sourcing is performed.
- **Mandatory governance read:** workspace `AGENTS.md`; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `.engineering/standards/RISK_AND_SCOPE_STANDARD.md`.
- **Task-specific governing documents read:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`; `docs/architecture/NK2_THA_NUTRITION_METHODOLOGY.md`; `docs/product/surfaces/admin/adm-knowledge-claims.md`; `docs/product/structure/pages/page-admin-knowledge-claims.md`; `docs/implementation/knowledge/KNOW1_NUTRITION_EVIDENCE_PUBLICATION.md`; `docs/implementation/knowledge/KNOW2_HUMAN_EVIDENCE_PUBLICATION.md`; `docs/implementation/knowledge/KNOW5_SAFE_KNOWLEDGE_EXPANSION.md`.
- **Existing implementation/assets inspected:** `client/src/pages/admin-knowledge-claims-page.tsx`; `server/lib/knowledge-claim-review-store.ts`; `/api/admin/knowledge-claims` in `server/routes.ts`; `shared/knowledge/evidence.ts`; existing KNOW2 tests; the local Admin Claim Review page.
- **Authorised scope:** add source-state filtering and global paging with exact totals to the existing Admin claim review worklist; add server-side filtering so only rows with zero `source_refs` appear in the missing-source view; update the existing Admin Nutrition Claim Review Product Knowledge entries; manually verify in Integrated Dev. Follow-up includes read-only counts and evidence triage by claim type and source role.
- **Explicit non-goals:** no AI source-search/attachment or citation generation; no expansion of trusted-domain allowlist; no approval/rejection or claim data changes; no schema/data migration; no architecture/governance amendment; no production or staging changes; no commit/push/deploy.
- **Architecture/governance conflicts:** no conflict for the bounded filter. **Finalization conflict:** `PROJECT_GOVERNANCE.md` prohibits commit absent explicit owner authorization, while `ENGINEERING_WORKFLOW.md` Step 9 requires a local commit. This task will remain uncommitted unless that conflict is resolved with explicit authorization.
- **Decision/risk status:** direct user instruction authorizes this bounded dev-branch UI/worklist behavior. AMBER: filters existing review items and writes no claim data. Adding official-source admission and AI research is a separate higher-risk decision and is excluded here.
- **Rollback:** `rollback/KNOW3-uncited-claim-filter-20261105` → `3467abad4eca8d82ffc52756fee13874e389597f`.
- **Verification-script note:** `.engineering/scripts/engineering-verify.sh` could not run because the WSL Bash service returned access denied. `npm run build` is used for compile verification. The existing server predates the route changes; its startup runs migrations and pantry-default synchronization, so it was not restarted. Runtime filter/paging verification remains pending.
- **Implementation permitted:** YES for the bounded uncited-source filter on the dev branch. The repository's standing development-branch authority applies after this receipt and the user's direct request; no promotion is authorized.

## Experience Constitution Check (§18.2)

- Hospitality: keep source research in the same review page and make the intended queue state explicit.
- Outcome: reduce confusion and review effort.
- Weight: replace the ambiguous binary toggle with a compact selector within the existing filter row; no new panel.
- Voice: UI reports filter state only.
- Ownership: Admin page owns the filter; existing claim rows remain the source of truth for citation presence.
- Agency: reviewer chooses which queue to see; no decisions are automated.
- Restraint: reuse existing controls and no new badges or AI suggestions.
- Layer: implementation realizes the existing Nutrition Claim Review capability and architecture.

## Scope and Architecture Compliance

- Canonical identity: existing claim edge + row ID unchanged.
- Evidence ownership: existing `source_refs` remains the only source-evidence field.
- No duplicate store, state, workflow, or source of truth introduced.
- Implementation extends `listClaims` and its existing API query; no approval gate or trust validation is changed.
- Product Registry: update the existing Admin claim-review capability and page entries to describe the source-state filter.

## Completion Notes

- Added a Source selector with “Has a source” (default), “Awaiting a source”, and “All source states”.
- Added validated `sourceStatus` API query handling and database predicates for `source_refs` presence/absence. Retained the legacy `citedOnly` option for existing callers. Added stable global paging (50 per page) and exact filtered totals.
- Updated the existing capability and page registry entries.
- `npm run build`: PASS. `git diff --check` on the five scoped files: PASS.
- Browser/API: the signed-in queue page exposes the selector. The running server ignores `sourceStatus=missing` (read-only response includes cited rows) and returns no paging metadata, so new backend code is not live in the current process. Restart and recheck are required. Server startup runs migrations and pantry-default synchronization; no restart was performed pending authorization for that data-impacting startup.
- Live summary: 3,299 uncited claim rows, not unique foods: 1,902 pending food→nutrient composition rows (1 cited, 1,901 awaiting a source), 1,366 direct food→benefit rows (all awaiting a source), and 32 nutrient→benefit rows awaiting a source. A read-only query found 47 pending nutrient→benefit claims, 15 cited and 32 uncited, plus 21 already approved on that edge.
- Official-source role: USDA FDC and Health Canada's CNF support food composition; NHS/NIH ODS support nutrient/health information; EU Commission register defines authorized wording and conditions. Existing sources do support some pending benefit claims, but a citation can still mismatch the exact claim label (for example “muscle-recovery” vs “normal muscle function” / “maintenance of muscle mass”). No source-policy or AI source-discovery changes were made.
- Queue writes/decisions: none. Database/schema/config/live production: untouched.
- Trust policy: unchanged. Current trusted-source domains in `shared/knowledge/evidence.ts` include NHS, UK Government, EFSA and the EU Commission; USDA/Canadian official sources are not in that validator allowlist. Existing knowledge/source-governance investigations discuss USDA and UK CoFID, but no trust allowlist or AI sourcing behavior was changed in this bounded filter task.
- `.engineering/scripts/engineering-verify.sh`: unavailable because the WSL Bash service returned Access Denied.
- Worktree remains uncommitted, preserving all pre-existing dirty work. The governing instructions conflict: `PROJECT_GOVERNANCE.md` requires explicit authorization before committing, while `docs/architecture/ENGINEERING_WORKFLOW.md` Step 9 mandates a local commit. No commit was made.
- No DB, schema, configuration, queue decision, or live approval was changed. The running server was not restarted.
