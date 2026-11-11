# Session: COMPANION_DIET_CONFLICT_NOTICES_20261111

| Field | Value |
|---|---|
| **Session ID** | `COMPANION_DIET_CONFLICT_NOTICES_20261111` |
| **Rollback ID** | `rollback/COMPANION-CONCISE-DIET-CONFLICT-NOTICES-20261111` → `82f23226f43a3a8e8298f8863c483239a3e2a89d` |
| **Start time** | 2026-11-11T17:20:33Z UTC |
| **Current stage** | Waiting for User |

## THA Governance Preflight Receipt

- Owning repository/branch: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, `feat/integrated-dev`; start HEAD `82f23226f43a3a8e8298f8863c483239a3e2a89d`.
- Risk: AMBER for concise grouping; RED for persistent Companion acknowledgement/snooze lifecycle and additive schema migration.
- Governing files read: workspace `G:\The Healthy Apples\AGENTS.md` (owner supplied in this task); repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2; `docs/architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`; `docs/architecture/THA_DECISION_ENGINE_ARCHITECTURE.md`; `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`; `docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`; `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`; `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`; `.engineering/OPERATING_MANUAL.md`; `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`; `docs/ai-operating-model/README.md`, `principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, `implementation-and-compliance.md`; `MIGRATIONS.md`; `docs/product/README.md`.
- Narrow steering: `rg --files -g AGENTS.md` found only repository root `AGENTS.md`; no nested instruction files.
- Missing/conflicting authority: initial Notice Engine contract had no snooze and kept acknowledged notices visible. Owner resolved the decision in this chat: **“Approve snooze in Opportunity Delivery.”** The canonical Notice Engine architecture is updated to place the Companion-only expiry in OD1's existing delivery record and to have the Notice Engine apply acknowledgement/snooze before its existing attention budget.
- Approval: Implementation permitted: YES under the standing `feat/integrated-dev` authority in `PROJECT_GOVERNANCE.md`; owner directly requested the UI behavior and explicitly approved snooze ownership in Opportunity Delivery. No promotion/deployment approval.
- Scope: group shopping restriction conflict notices by restriction and show a concise list of source-owned shopping item labels. Add Companion-only acknowledge and fixed 24-hour snooze controls for those grouped warning rows. Acknowledgement removes the notice from the Companion while the underlying opportunity remains on domain surfaces. Snooze suppresses only the Companion notice until expiry; eligible again on a later fetch (scheduled refresh when the panel remains open). Do not change shopping items, hard restrictions, critical priority, source opportunity content, other notice types, or meal-image/intent work.
- Architecture/AI compliance: Food Intelligence remains owner of item/restriction facts; Opportunity Delivery remains sole owner of per-user delivery interaction state; Notice Engine remains sole owner of order/volume and filters only the household's explicit ack/snooze choice; existing Intent Engine and `opportunity-delivery:review` action are reused; permission-aware authenticated routes remain in place. No parallel assistant, business state, capability, verb, or conversation state.
- Experience Constitution: hospitality—less repetitive warning text; outcome—less on the household's mind; weight—one row per restriction and disappears on action; voice—source-owned label facts, no invented prose; ownership—the Companion advises, household decides; agency—actions only affect the Companion presentation, never the shopping list; restraint—one row per restriction; layer—presentation consumes structured labels and delivery state.
- Definition of done: grouped concise conflict rows; acknowledge hides the active warning in Companion; snooze hides it for 24 hours and allows it again after expiry; other opportunity channels retain the underlying conflict; schema addition is nullable, idempotent and has no backfill.
- Data impact: additive nullable `companion_snoozed_until` on existing `opportunity_deliveries`; no new table, backfill, deletion, shopping/planner/household writes, or direct DB access performed. If a dev server restarted automatically, its normal migration runner may have applied the migration; runtime migration state was not inspected. No restart or deployment was intentionally triggered.
- Red release/deployment: implementation stays on `feat/integrated-dev`; no shared/main, staging, or production release in this task. Deployment remains separately gated by explicit owner approval. Verification must include the repository migration runner and Companion action behavior before any release.
- Rollback: annotated tag above protects committed HEAD only; it does not include the pre-existing dirty work listed in the worktree. Reverting code leaves the additive nullable column unused; no DB rollback/drop is needed. No runtime DB was modified.
- Worktree at start was intentionally dirty in unrelated resolver/context/test work and prior session records; preserve it. Runtime target files for this task were clean before editing.
- Verification plan: `npm run typecheck`; `git diff --check` on changed files; parse updated product inventory JSON. Per developer instruction, do not add/run tests without a user request. Do not run `npm run build`: `script/build.ts` recursively deletes and recreates `dist`.
- User acceptance: open local Planner/Companion with multiple unchecked shopping items matching Gluten; expect one `Gluten conflict: …` row with Acknowledge and Snooze 24h; acknowledge hides it, snooze hides for 24 hours; planner/shopping data is unchanged. Live UI acceptance not performed.

## Files being modified
- `client/src/components/conversation/FloatingAssistant.tsx` — group structured conflicts and add Companion acknowledgement/snooze controls.
- `server/intelligence/food-intelligence/opportunity-engine.ts` — expose producer-owned restriction labels.
- `server/intelligence/opportunity-delivery/framework.ts`, `delivery-store.ts`, and `policy.ts` — carry source labels/status; persist snooze in the existing owner.
- `server/intelligence/handlers/opportunity-delivery-handler.ts` and `opportunity-delivery-read-port.ts` — reuse the registered `review` action for snooze.
- `server/intelligence/conversation/notice-engine.ts` — preserve structured notice facts and filter acknowledged/currently snoozed rows before its existing cap.
- `server/routes.ts` and `server/intelligence/capability-registry.ts` — transport mapping and accurate capability description.
- `shared/schema.ts` and `server/migrations/runner.ts` — additive nullable expiry field and reviewed migration entry.
- `docs/architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` — record the approved OD2 ownership/behavior contract.
- `docs/product/intelligence/companion-capabilities/cap-companion.md` and `docs/product/inventory/product.json` — maintain the product registry.
- This session record, implementation report, and Incoming Agent Report.

## Checkpoints
- [x] Governance bootstrap, worktree/branch review, and annotated rollback tag.
- [x] Implement concise grouping, acknowledgement, and Companion-only snooze.
- [x] Finish source review and reports; report verification limits accurately.

**Last checkpoint:** Typecheck completed but exited nonzero on errors in unrelated files; no errors listed in this task's changed files. JSON parse and changed-source diff checks passed. Tests not run; build skipped because it deletes `dist`.

## Next action
Owner retest in the local Companion; no further code change is pending.

## Blockers
Live visual acceptance remains for owner retest. No migration command or deployment was intentionally triggered; automatic dev migration state is unverified.







## Commit-all follow-up verification — 2026-11-11

Generic `test-intelligence-notice-engine.ts` passed 75/75, `test-intelligence-opportunity-delivery-binding.ts` exited 0 (60/60), and `test-intelligence-food-opportunity-binding.ts` passed 99/99. None supplies feature-specific regression coverage for this added acknowledge/snooze lifecycle; no claim of complete flow verification is made. The Conversation Gateway integration suite remains blocked by Postgres `EACCES`. Claude's owner-provided runtime report states the startup migration `2026-11-11_opportunity_delivery_companion_snooze` was applied; Codex did not inspect the database.
