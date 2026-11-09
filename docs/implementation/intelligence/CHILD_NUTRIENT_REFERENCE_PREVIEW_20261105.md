# Child nutrient reference preview — 2026-11-05

## Governance receipt
- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`; branch `feat/integrated-dev`; base HEAD `3467abad4eca8d82ffc52756fee13874e389597f`.
- Pre-existing worktree was substantially dirty (about 1,510 modified/untracked paths). Existing work was preserved.
- Governing sources read: `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `docs/change-control.md`, `docs/architecture/REPOSITORY_CONVENTIONS.md`.
- Task-specific authority read: `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`; `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`; `docs/architecture/NK2_THA_NUTRITION_METHODOLOGY.md`; `docs/implementation/intelligence/ADULT_NUTRIENT_REFERENCE_METHODS_20261104.md`; `docs/investigations/intelligence/CHILD_NUTRIENT_REFERENCE_SCOPE_20261105.md`; and affected implementation sources.
- User explicitly approved: UK protein reference figures ages 1–18 in the Admin review preview only, published age bands/source category as applicable; exclude under 1, exercise/muscle targets, and live Companion child personalization.
- Risk: RED subject area (nutrition references involving minors); implemented scope remains synthetic Admin review preview only. No conflicting authority identified after explicit owner approval.

## What changed
- Added the UK child/adolescent protein RNI candidate to the existing Nutrition Knowledge method registry: ages 1–3 14.5 g/day, 4–6 19.7, 7–10 28.3, 11–14 42.1 male / 41.2 female, 15–18 55.2 male / 45.4 female. It is clearly a fixed age-band population reference, not an adult body-mass formula.
- Generalized the existing preview helper and reused it for the candidate. Ages 11–18 require the source's male/female table category; an unknown category blocks a result. No child weight input or storage is involved. Adult method logic remains unchanged.
- Updated the existing Admin review UI to present age 1–18, hide adult weight/exercise controls for child ages, request source category only where table rows differ, and recalculate from current inputs.
- Reused the existing Nutrition Knowledge review store/audit path and trusted-source admission policy. The candidate is unpublished; it is not exposed to Companion. The UK source URL is a candidate source requiring a named reviewer to confirm current applicability.

## Architecture and AI compliance
- Canonical candidate/method facts remain in `shared/knowledge/nutrient-reference-methods.ts`; calculation is in the existing deterministic Nutrition Knowledge preview helper and existing Food Intelligence engine export; named review continues through the existing Nutrition Knowledge audit store and Admin route. No second assistant, registry, state store, or review workflow was introduced.
- Existing Companion, Capability Registry, Intent Engine, business services, permission-aware runtime access, and conversation ownership are untouched. Child candidate is not approved or available to personal Companion guidance.
- Existing `/admin/nutrient-reference-review` surface was extended; no new product route or registry entry was needed. Product Knowledge Registry remains the owner for discovery; this work creates no separate owner.

## Definition of done and verification
- Admin preview can display age-banded child RNI figures with source category where needed; under 1 and out-of-scope ages yield no candidate result; adult mass-based preview stays intact.
- `npx tsx server/tests/test-child-nutrient-reference-preview.ts` passed boundary, source category, table, trust, and adult-isolation checks.
- `npx tsx server/tests/test-adult-nutrient-reference-engine.ts` passed 39 checks.
- Local Vite page returned HTTP 200 and its TypeScript module transformed without the prior dynamic-import error. `git diff --check` on task-touched files passed.
- A full repository typecheck was attempted and reported unrelated existing errors in server scripts/tests; no diagnostics were reported for the changed implementation modules.
- Runtime service limitation: `http://127.0.0.1:5001/admin/nutrient-reference-review` returns the Vite page, but `/api/admin/nutrient-reference-review` also falls back to Vite HTML rather than JSON. Therefore the API server is not serving the new review API in this session; saved review history/decisions cannot currently be used until the app server is correctly restarted. No restart was performed because startup may run migrations/default synchronization.

## Data, trust, rollback, scope
- Data impact: static candidate definitions only in preview. No profile/diary data, database row, schema, migration, config, process, production/staging service, or scheduled task was touched. No review decision was written.
- Trust: these are values reproduced from UK Department of Health, *Dietary Reference Values for Food Energy and Nutrients for the United Kingdom* (1991), Table 7.1, [official PDF](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/743786/Dietary_Reference_Values_for_Food_Energy_and_Nutrients_for_the_United_Kingdom__1991_.pdf#page=79). The source is old; current applicability must be checked by a qualified named reviewer before approval. Values are not individualized needs, deficiency thresholds, or exercise/muscle targets.
- Rollback tag: `rollback/child-nutrient-reference-preview-20261105` -> `3467abad4eca8d82ffc52756fee13874e389597f`.
- Pre-edit dirty-file snapshots are under `.engineering/session/rollback-evidence/CHILD_REFERENCE_REVIEW_20261105/`. SHA-256: architecture `C0E0439DA480431BE7FF8C952FE826B70569BD529BEC1EF73BF25D5527C41B97`; review store `759078C05ECBC7E3200C3125C4166EAA91098EC51B2FCDBD8E395F22D20F8606`; page `9BA29DF819005C03C28B9082F54197097D184F848D588D046E3DE4E2C8CC8080`; shared methods `36F1F8EB0741DFD7D1A3737873B918558660A5BE272E7D26B54B374C2D0C4E84`; routes `D3895B586D9CCDACD45C4890084D1694FC369BF0A2E928032B891415D5929231`.
- Scope lock honored. No commit, push, deploy, or unrelated worktree cleanup.
- Acceptance evidence: source/table/category inputs and displayed figures verified by deterministic checks; owner review and live runtime acceptance remain outstanding because current local API server is not serving the endpoints.

## Manual use
On the Admin Nutrient Reference Review page, use the example age field. For ages 1–10, the reference appears without a source category. For ages 11–18, choose the source-table category; at age 15, male yields 55.2 g/day and female yields 45.4 g/day. Leave the category unset if unknown; the page will not guess. This remains an unpublished review candidate.
