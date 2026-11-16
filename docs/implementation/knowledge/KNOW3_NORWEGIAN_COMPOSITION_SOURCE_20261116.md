# KNOW3 — Official Norwegian composition source

**Date:** 2026-11-16  
**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
**Branch / base:** `feat/integrated-dev` / `9dda30555d83db0fe5bcc300ff370ef028926e3c`  
**Risk:** RED — source trust policy and persistent evidence  
**Rollback:** `rollback/KNOW3-norwegian-source-20261116` → `9dda30555d83db0fe5bcc300ff370ef028926e3c` (committed state only)

## Governance preflight

Read the workspace `AGENTS.md`; repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/change-control.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `.engineering/protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`; `docs/implementation/knowledge/KNOW3_SOURCE_ATTACHMENT_WORKFLOW_20261105.md`; and `shared/knowledge/evidence.ts`.

**Verified ownership:** WS0 Knowledge Registry owns the canonical food claim rows and their source references. The existing claim-review store and guarded composition script were reused; no evidence store or workflow was added. `matvaretabellen.no` is an exact-host exception and is composition-only, so it cannot substantiate food or nutrient benefit edges.

## Request and scope

The owner accepted official and reputable sources, including the official Norwegian Food Composition Table. Scope was limited to adding `matvaretabellen.no` to the trusted-source policy for composition edges and attaching exact official records to pending claims #2004 and #4332. No broad `.no` wildcard was added.

## Changes made

- Added `matvaretabellen.no` to `TRUSTED_SOURCE_DOMAINS` with a composition-only comment.
- Added it to the existing `compositionOnly` host list in `isSourceAllowedForClaim()`.
- Attached one prepared citation to composition claim #2004 (`goji-berries → beta-carotene`) through `scripts/attach-reviewed-composition-evidence.ts`, which calls the canonical `recordClaimSourceChange` writer.
- Evidence: the Norwegian table's exact **Goji berries, dried** entry reports **311 µg beta-carotene / 100 g** and identifies source reference 621 (Swedish Food Agency's 2022 nutrient-analysis project). The excerpt explicitly excludes the FunFactz iron comparison and goji-to-carrot ratio.
- Attached one prepared citation to composition claim #4332 (`potato-starch → protein`) through the same guarded writer. The exact potato-starch record reports **0.0 g protein / 100 g** and identifies its source as database reference 400g (Swedish National Food Agency, 2017-12-15). This is a source for the zero composition value, not evidence of a protein benefit.
- Citation `lastReviewed` remains empty; it is a sourced candidate, not a human source review or claim approval.

## Architecture compliance

- **Canonical identity:** one food claim row remains the entity; no duplicate claim or source state.
- **Ownership:** WS0 Knowledge Registry remains the owner; the existing source-reference field and audit ledger remain authoritative.
- **Workflow:** the existing pending-only guarded writer is reused; source attachment remains separate from human approval.
- **Extension:** exact official composition host added to the existing Layer-1 trust gate and composition-edge rule. No parallel trust system.
- **AI compliance:** not applicable; no AI reasoning or assistant behavior changed.

## Data impact and verification

- Development-local claim rows #2004 and #4332 each received one citation and one source-attachment audit event. No claim status, amount, active flag, reviewer, or review timestamp was edited.
- Guarded preview rechecked each exact subject, active/pending status, and no existing source reference before writing.
- Guarded apply reported two attachments. Guarded verification confirmed both attached citations and that both rows remain pending.
- Queue before: composition 173 pending / 48 cited; food-benefit 369 / 194 cited; nutrient-benefit 10 / 10 cited. Total uncited: 300.
- Queue after: composition 173 pending / 50 cited; food-benefit 369 / 194 cited; nutrient-benefit 10 / 10 cited. Total uncited: **298** (123 composition, 175 food-benefit, 0 nutrient-benefit).
- Focused source-policy check passed: the official host is trusted for composition and rejected for a benefit edge.
- `npm run build` passed. Existing warnings: old Browserslist data, PostCSS `from`, large client chunks, and CommonJS `import.meta` / `NODE_ENV` warnings.
- `git diff --check` passed for task files. Existing benchmark modifications/history and startup logs were preserved.
- No schema migration, runtime restart, deployment, commit, or push.

## Definition of done

The exact official Norwegian domain is accepted for composition citations only; claims #2004 and #4332 carry their exact-form official table records; both remain pending; the uncited count decreased by two; and the build passes. An owner can verify via Admin → Knowledge Review → composition claims by locating `goji-berries → beta-carotene` and `potato-starch → protein`, inspecting the source details, and confirming both remain pending. Each citation is an unreviewed prepared source (`lastReviewed` empty).

## Trust check

- **Verified:** the official table entry and source provenance; the database row's exact subject/status/activity/source count; before/after pending-cited counts; source-gate behavior; build result.
- **Highest-risk remaining unknown:** the current running application process may still hold its pre-change validator in memory; no restart was performed. The persisted citation and Admin row can be inspected from the database-backed page, but a server restart is needed before the updated policy is used by the long-running server for future attachments.

## Follow-up source check — goji iron

The same official Norwegian table's **Goji berries, dried** entry reports **3.1 mg iron / 100 g**, attributed to source reference 621 (Swedish Food Agency's 2022 nutrient-analysis project). This is an official composition value; it does not validate the FunFactz comparison or a claim that goji contains more iron than a different food without a matched comparison. A fresh read of active pending composition claims found only #2004 (`goji-berries → beta-carotene`), already cited above; no pending uncited goji-iron claim was available for attachment. No additional DB write was made for this follow-up.

## Rollback and scope lock

- Code rollback: restore only the two task-scoped lines in `shared/knowledge/evidence.ts` to the tagged baseline. Do not revert unrelated dirty work.
- Data rollback: use the existing audited pending-claim source-removal action for claims #2004 and #4332 if the owner directs removal.
- No additional domains or claim types are in scope. No promotion is authorized.

## User acceptance evidence

Starting page: Admin → Knowledge Review. Find claims #2004 and #4332 and confirm the official Norwegian citations are visible, their excerpts report 311 µg beta-carotene/100 g for dried goji and 0.0 g protein/100 g for potato starch, and both claims still say Awaiting review. The confirmed database summary moved the uncited total from 300 to 298.

## SUGGESTIONS

- Review remaining composition claims against exact-form records in official national composition tables, preserving form, unit, and provenance caveats.
- Restart Integrated Dev only when the owner chooses to activate the updated validator in the long-running server; startup can perform its documented development synchronization.

## Activity boundary

Database writes were limited to one guarded development-local source attachment and its normal audit event. No secrets were read or reported. No external provider received project material.
