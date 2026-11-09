# SHOP4 — Remove legacy Shopping routes

- **Repo / branch / HEAD:** `tha-integrated-dev-g-native-20261003` / `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`.
- **Rollback:** `rollback/SHOP4-remove-shopping-redirects-20261105` at that HEAD; pre-edit dirty-file snapshot: `.engineering/session/rollback-evidence/SHOP4_REMOVE_SHOPPING_REDIRECTS_20261105/manifest.json`.
- **Scope:** remove `/shopping-list`, `/list`, `/basket`, `/analyse-basket` redirects; keep `/shopping-workspace`; clean references and document canonical routes.
- **Risk:** Amber route/navigation behavior. User explicitly requested the removal and link cleanup. Dev branch only; no promotion.
- **Governance read:** workspace AGENTS supplied in the current task; repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `.engineering/OPERATING_MANUAL.md`, `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, product/experience architecture entry points and route/product registry sources as recorded in the task preflight. No missing or conflicting authority found.
- **Changes:** removed four redirect routes, two obsolete route-classifier entries, stale route-color config, and route-map/product-registry claims that represented the retired endpoints as active. Regenerated product inventory. No exact internal UI links to those four routes were found.
- **Verification:** live browser opened `/shopping-workspace`; each former path showed the friendly not-found page. Source has 53 route patterns. `git diff --check` was run; it reports pre-existing CRLF/whitespace issues in unrelated dirty files, including `CURRENT.md` and `PROJECT_GOVERNANCE.md`, so it is not a clean global check. Product inventory generator completed. Tests/build not run.
- **Data impact:** none. No database, API data, migration, secrets, configuration, external provider, or scheduled task touched.
- **Architecture/trust:** existing Shopping workspace remains the sole UI destination and API state owner. No duplicate state/workflow added. Removed aliases are not linked internally; not-found response remains recoverable by Home link.
- **Rollback:** revert only SHOP4-owned hunks/files or restore the captured pre-edit copies; keep unrelated dirty work. No reset, stash, commit, push, or deploy performed.
- **Definition of done:** all four aliases absent, canonical workspace retained, internal references cleaned, route registry accurate, browser confirms missing URLs are handled, report filed.
- **Status:** completed in local development worktree; uncommitted and not deployed.
## Governing sources actually read

- AGENTS.md; PROJECT_GOVERNANCE.md; docs/architecture/README.md; docs/architecture/ENGINEERING_WORKFLOW.md; .engineering/OPERATING_MANUAL.md; docs/architecture/ARCHITECTURE_PRINCIPLES.md; THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md; GOV2_CANONICAL_ALIAS_PRINCIPLE.md; GOVERNING_EXPERIENCE_ARCHITECTURE.md; THA_EXPERIENCE_BLUEPRINT.md; THA_EXPERIENCE_ARCHITECTURE.md; THA_EXPERIENCE_LANGUAGE.md; THA_UI_ARCHITECTURE.md; THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md; .engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md; active route, registry, and task-specific Shopping sources.

## Scope lock / acceptance

Only the four user-named legacy Shopping route aliases are removed. /shopping-workspace stays canonical. Acceptance evidence is the source route declaration, internal-reference search, product inventory generation, and browser not-found observations above. Existing uncommitted changes were preserved. Optional future cleanup of orphaned modules is out of scope.

