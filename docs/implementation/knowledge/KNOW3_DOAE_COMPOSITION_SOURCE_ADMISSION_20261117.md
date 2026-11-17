# KNOW3 Thai DOAE composition source admission — 2026-11-17

## Task and scope

User-authorized, narrowly scoped addition of Thailand Department of Agriculture (`doae.go.th`) as a composition-only source and attachment of its kaffir lime leaf vitamin C record to pending development claim #4362. This is a trust-policy change (Red) plus one guarded development-local citation write. No approvals, rejections, amount edits, schema changes, migrations, deployment, or production-data access.

## Governance preflight

- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`.
- Branch / base HEAD: `feat/integrated-dev` / `fdfaef0ef261c95a94bf6022ccb7d6db903540de`.
- Governance read: `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `docs/ai-operating-model/evidence-and-architecture.md`; `docs/ai-operating-model/rollback-and-output.md`.
- Task architecture read: `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`; `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`; evidence owner `shared/knowledge/evidence.ts`.
- Implementation permitted: YES under standing Integrated Dev branch authority; user explicitly approved `doae.go.th` composition-only and claim #4362.
- Architecture compliance: one trust-gate owner (`shared/knowledge/evidence.ts`) remains authoritative; existing composition-only edge gate is reused. No duplicate source registry, claim store, or workflow introduced. Runtime validation consumers include seed validation, guarded writers, knowledge-claim review, and evidence-backed rendering.
- Dirty pre-state: unrelated modifications to `server/intelligence/conversation/conversation-gateway.ts`, `server/intelligence/conversation/llm-provider.ts`, `server/intelligence/handlers/shopping-read-handler.ts`, `server/intelligence/pattern-intent-resolver.ts`, and untracked startup logs. Preserved untouched.

## Rollback and scope lock

- Rollback tag: `rollback/KNOW3-doae-composition-20261117` → `fdfaef0ef261c95a94bf6022ccb7d6db903540de`.
- The annotated tag protects committed HEAD only; it does not include any dirty worktree state.
- Code scope: add `doae.go.th` to the trusted source list and to the existing composition-only domain list in `shared/knowledge/evidence.ts`.
- Data scope: one `source_refs` citation on development-local `knowledge_food_nutrients.id=4362` only.
- Excluded: all claim status/decision changes, nutrient amounts, other rows, other domains, trust tiers, deployments, migrations, restarts, commits, and production/staging.

## Evidence and execution

- Primary source: Thailand Department of Agriculture, “Leech Lime Leaf”, `https://www.doae.go.th/en/leech-lime-leaf/`.
- The page identifies the leaf as *Citrus hystrix* and reports vitamin C 20 mg per 100 g edible portion. It does not give sample/analytical-method details; this limitation is included in the stored citation excerpt.
- Fresh pre-write DB check: #4362 was active, pending, uncited, with null amount and no review/rejection timestamps.
- Guarded writer: `scripts/attach-reviewed-composition-evidence.ts` preview, apply, and verify all completed. No raw SQL write was used.
- Receipt: `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-17__codex__KNOW3-doae-kaffir-lime-leaf-vitamin-c-receipt.json`.
- Verification: #4362 now has exactly one source; amount remains null; `reviewed_at`, `reviewed_by`, and `rejected_at` remain null. Development-local composition pending-cited count increased 152 → 153; uncited count decreased 21 → 20. Food-benefit uncited remains 63; nutrient-benefit uncited remains 0; total uncited is 83.
- Automated tests were not run. The authorized guarded writer preview/apply/verify was used for persistence verification.
- User-acceptance evidence: attached citation is visible in the development database record; the claim remains pending for the human reviewer.

## Remaining gaps and follow-up

- 83 uncited claims remain: 20 composition and 63 food-benefit. Source review continues.
- Exact research matches that did not support a pending benefit edge: chives bone/immune and celeriac immune literature was either non-food intervention, extract/preclinical-only, or the wrong outcome; soy sauce/vinegar fermentation papers describe manufacturing, microbial content, or animal models rather than demonstrated human benefit from the specific queued condiment; a spearmint source search found no direct tea/gut-health evidence. These were not attached.
- Official Thai Agriculture evidence surfaced for kaffir lime leaves but does not cover the queued kaffir-lime vitamin K claim. Thai FCD/ASEAN table leads are hosted outside the currently trusted domains and were not added under this authorization.
- No code commit or promotion was made. Existing dirty work remains untouched.

## Definition of done / trust / data

The scoped source is trusted for composition only; the current benefit-edge guard prevents it supporting health-benefit claims. Existing user-facing evidence gate still requires human sign-off, so adding this prepared source does not publish the claim. One dev citation row changed; no other data changed.

## Required implementation completion fields

- Change: trusted Thai DOAE composition source plus one citation on #4362.
- Files changed: `shared/knowledge/evidence.ts`; this report.
- Verification: guarded writer preview/apply/verify passed; DB state rechecked.
- Rollback: `rollback/KNOW3-doae-composition-20261117` → `fdfaef0ef261c95a94bf6022ccb7d6db903540de`.
- Remaining gaps: 83 pending uncited claims remain and are under review.
- Commit/promotion: none.

## Follow-on evidence pass
- USDA SR Legacy “Dock, raw” (*Rumex* spp.) leaves vitamin K blank and is broader than garden sorrel; it does not support claim #4376. No citation was attached.
- A high-amount sorrel oxalate/kidney-injury lead is recorded with dose/species limitations in `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-17__codex__food-caution-research-notes.md`.
- Queue remains 83 uncited (20 composition; 63 food-benefit; 0 nutrient-benefit).
