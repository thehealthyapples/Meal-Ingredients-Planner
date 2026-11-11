# OPPACTION1 session run — progress checkpoint

Date: 2026-11-11. Repo `tha-integrated-dev-g-native-20261003`, branch `feat/integrated-dev`, HEAD `82f23226f43a3a8e8298f8863c483239a3e2a89d`. Read-only audit; existing worktree dirt preserved. No code/config/data edits.

Governing chain: workspace AGENTS, repo AGENTS/PROJECT_GOVERNANCE, architecture index, repository conventions, and attention/opportunity source. The user authorized report-only scope.

## Progress
- [x] Create separate investigation from CTXVIEW1: policy/wording/render path is a distinct topic.
- [x] Read CRITICAL_TYPES, isCritical/assertCriticalAllowed, and decision clamp.
- [ ] Finish all `isCritical` and CRITICAL_TYPES call-site/producer review; decide platform-wide completeness.
- [ ] Review each of 10 action templates with its evidence/explanation in the same opportunity object.
- [ ] Trace opportunity and notice render surfaces and whether each provides a reason path.
- [ ] Review line 1146 passthrough source if feasible.

Partial report: `docs/investigations/platform/OPPACTION1_OPPORTUNITY_ACTION_WORDING_20261111.md`. Resume from Part A call-site completeness, then template-specific lines.

Incremental confirmed evidence:
- [x] Sole observed source assignment of critical priority is `shopping-restriction-conflict` in opportunity-engine.ts.
- [x] Opportunity Delivery adapter calls assertCriticalAllowed(type, priority) before adapting food opportunity records.
- [ ] Completeness across every critical-capable producer/path remains open.
- [x] Reviewed action/evidence/explanation pairs at lines 408, 444, 590, 659: terse but clear, no findings.
- [ ] Remaining six templates and UI reason-path trace remain open.

Incremental update:
- [x] Reviewed action/evidence/explanation at lines 752, 812, 881, 943, 1015, 1079: all terse but clear; no finding.
- [x] Identified line 1146 as pass-through from buildNutritionBalanceOpportunity in food-intelligence/engine.ts; original source pending.
- [ ] Critical producer coverage final verdict pending.
- [ ] UI rendering paths and reason affordance per surface pending.

Rendering progress:
- [x] Located Home hook usage and opportunity-array handoff (`home-experience-page.tsx:188,340`).
- [x] Confirmed notices hook carries both voiced text and underlying fact (`use-companion-notices.ts:20–54`).
- [ ] Trace Home opportunity component and reason affordance.
- [ ] Trace notice consumer components and reason affordance.
- [ ] Complete all-surface search/verification.

Part A progress:
- [x] Investigated cookbook-recipe-household-conflict. Source explicitly distinguishes a cookbook recipe merely stored for later (medium/advisory, household retains choice) from an unchecked item about to be bought (critical). Verdict: medium deliberate; no allowlist expansion finding from this evidence.
- [x] Searched production literal critical assignments: one, shopping-restriction-conflict at opportunity-engine.ts:482. Confirmed Opportunity Delivery adapter checks every food opportunity with assertCriticalAllowed before adaptation at framework.ts:257.
- [x] Checked other isCritical callers: downstream ordering/budget/muting/telemetry, not producers.
- [x] Critical allowlist completeness verdict recorded for opportunity critical-priority production path; Notice Engine has a separate high/medium/low priority model.

Rendering trace update:
- [x] Identified FloatingAssistant and two dev concept pages consuming notices hook.
- [ ] Home Food Opportunity renderer and its explanation affordance.
- [ ] FloatingAssistant notice rendering of fact/evidence and expand/why affordance.
- [ ] Verify all notice and food-opportunity UI consumers and record surface-by-surface reason paths.

Rendering-path closeout:
- [x] Home trace: opportunities feed only `resolveHomePrimaryAction`; Meals glance card destination changes, but no opportunity action/explanation is shown there. No reason-path issue because no suggestedAction is displayed.
- [x] FloatingAssistant trace: notice text is displayed with tappable `Why?` invoking `handleExplainNotice(n.text)`; reason is available through Companion conversation. Fact is retained but not inline-rendered.
- [x] Concluded the ten opportunity suggestedActions are not standalone displayed actions in these two production consumers. No confirmed no-reason UI finding in this path.
- [x] All Part A/B/UI tasks complete; investigation report has final status.
