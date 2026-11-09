# Health Benefit Food Lookup Investigation — 2026-11-01

## Task and scope
Investigate Food page health-benefit lookup against the existing human-reviewed SourceRef gate. Stopped at the task's Step 2 condition; no implementation.

## Repository state and governance
- Repo: G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003
- Branch: feat/integrated-dev; HEAD 3467abad4eca8d82ffc52756fee13874e389597f; 3 commits ahead.
- Worktree has extensive pre-existing edits, including routes, nutrition registry, product docs, and untracked WeekFoodExplorer.tsx. All preserved.
- Read AGENTS.md, PROJECT_GOVERNANCE.md, docs/architecture/README.md, ENGINEERING_WORKFLOW.md, ARCHITECTURE_PRINCIPLES.md, THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md, THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md, NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md, NK2_THA_NUTRITION_METHODOLOGY.md, PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md, CAPABILITY_BOUNDARY_ASSESSMENT.md, THA_EXPERIENCE_BLUEPRINT.md, THA_EXPERIENCE_ARCHITECTURE.md, THA_EXPERIENCE_LANGUAGE.md, THA_UI_ARCHITECTURE.md, THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md, docs/change-control.md, .engineering/OPERATING_MANUAL.md, .engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md, docs/implementation/ux/ADOPTION_REGISTER.md.

## Actions and evidence
Inspected shared/canonical/food-report-adapter.ts top-to-bottom, server/lib/food-report-evidence.ts, benefit definitions in shared/schema.ts, shared/knowledge/health-benefits.ts, shared/knowledge/evidence.ts, and the existing route/UI lookup patterns.

Verified:
- buildFoodReport deliberately leaves benefit arrays empty.
- getEvidenceBackedFoodReport obtains claims through getFoodBenefitsForDisplay, the existing evidence-gated path.
- knowledge_food_benefits is normalized by food_slug + benefit_slug and includes source_refs, reviewed_at, reviewed_by, active and rejection state.
- Benefit categories are a controlled vocabulary in knowledge_health_benefits. The canonical vocabulary includes bone-health / Bone Health.
- Live Neon read on thehealthyapples-staging / development-local branch found 1,366 knowledge_food_benefits rows, but **0** active rows with both non-NULL reviewed_at and a non-empty source_refs array; **0** distinct foods among those rows. Since the necessary prerequisites are absent for every row, none can pass the existing gate.
- No production query was run.

## Finding and recommendation
The schema and vocabulary can represent exact category lookup; current evidence coverage on the queried dev branch is zero. A new endpoint/UI would always return empty and imply unavailable coverage. Stop at Step 2. No schema/category taxonomy change is needed based on repository evidence. A human must review candidate food-benefit links and record valid SourceRef data plus reviewedAt through the governed review path. Recheck coverage before implementing. Never treat GRADUATED_FOOD_SOURCE candidates as approved claims.

## Risk, compliance, files and checks
- Amber task request; read-only investigation.
- Canonical benefit vocabulary and existing gated composer remain the single owners. No duplicate store/workflow/state introduced.
- Files changed: none in application source. This investigation and agent report are the only files written.
- Read-only Neon SQL succeeded. No tests run. No services, configuration, schema, data, scheduled tasks, or credentials changed. No secrets read or printed.
- Implementation was permitted under standing feat/integrated-dev authority, but the explicit evidence-based stop condition makes implementation unwarranted now.

## Unknowns
The count is for development-local only; production coverage remains unknown.

## Exact report paths
- Investigation: docs/investigations/knowledge/BONE_BENEFIT_LOOKUP_INVESTIGATION_2026-11-01.md
- Agent report: G:\The Healthy Apples\Incoming\Agent Reports\Codex_Bone_Benefit_Lookup_Investigation_2026-11-01.md

