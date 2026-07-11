# INT40 — Companion Task Delegation & Assisted Actions

**Status:** 🟢 IMPLEMENTED
**Date:** 2026-07-02
**Branch:** int1-intelligence-platform
**EWO:** EWO-INT40 (🟡 AMBER)
**Builds on:** [`INT39_CAPABILITY_GUIDANCE_REGISTRY_AND_GOAL_COMPLETION.md`](./INT39_CAPABILITY_GUIDANCE_REGISTRY_AND_GOAL_COMPLETION.md) · [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) §5 (Intent Engine) · [`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`](../../architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md) §5.1 (Confirmation Model)
**Governing architecture:** [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) · [`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`](../../architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md) · [`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`](../../architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md)
**Tests:** `npm run test:intelligence-companion-actions` (62 assertions, new) — in the `npm test` chain. Full chain (28 suites) + `test-intent-resolver.ts` (124 assertions) re-run with zero regressions.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-int40-companion-delegation-20260702` → `4a2da735f5b80bac2da4dd306c387adeb5e431de` |
| Working tree at start | Intentionally dirty — prior uncommitted INT35/INT35B/INT35C/INT36/INT37/INT38/INT39 work already present on this branch, unrelated to this workstream except where this workstream extends it (conversation-gateway.ts, context-frame-assembler.ts, capability bindings) |
| This task's writes | See §7 Files changed |
| Rollback to committed state | `git checkout rollback/before-int40-companion-delegation-20260702` |
| Rollback the new DB table only | `DROP TABLE IF EXISTS companion_action_proposals;` (additive-only; no other table's schema changed; nothing else reads it) |

---

## 1. Objective

Through INT1–INT39 the Intelligence Platform could *read and explain* a user's data and *suggest* where to go next (Companion Cards, INT38/INT39 guidance) — but it could never act. `detectWriteIntent()` intercepted every write-shaped utterance with an honest "coming in a future update" message, and although the Intent Engine's full CONFIRM pipeline (`LOCATE → VALIDATE → PERMISSION → CONFIRM → INVOKE → RESPOND`) and `ConfirmationTier` model existed since INT1, **zero capability handlers had ever bound a write verb** — every write was `not_executable` by construction.

INT40 activates that dormant machinery for the first time, and gives the Companion a way to *propose*, and — only after explicit user confirmation — *perform*, a small number of real platform operations on the user's behalf, exactly matching Phase 2 ("Intent Engine — user write actions") of the roadmap in `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §14.

**Scope-lock (stated up front, not discovered later):** this workstream binds exactly **two** write capabilities as the proof slice —

1. **Shopping — Add** a household staple/shopping-list extra (`confirmationFor` tier: `light`).
2. **Planner — Add** a meal into a specific day + slot, but *only* when that day and slot are already known from explicit surface context (`confirmationFor` tier: `light`).

Chained together (add a discovered meal to the planner, then add a staple to the shopping list) they form a genuine 2-step guided workflow, proving sequencing, per-step progress, and partial-failure recovery end-to-end. Every other example in the EWO (Nutrition Boosts, generate shopping list, replace meals, save recipe, compare products, update household preferences) remains an **honest gap** today. The framework built here makes each of those a "bind one more handler with the same Port → Handler → Binding pattern" follow-up workstream — not a new architecture, exactly the discipline `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` §1 requires ("Adding a capability = registering intents, not building software").

| Piece | Role |
|---|---|
| `handlers/shopping-write-{port,handler}.ts`, `handlers/planner-write-{port,handler}.ts` | New write handlers, mirroring the existing read Port → Handler pattern exactly. Delegate 100% to `storage.addShoppingListExtra` / `storage.addPlannerEntry`, replicating (never relaxing) the exact ownership checks their equivalent HTTP routes already perform. |
| `bindings/shopping.ts`, `bindings/planner.ts` (modified) | Now bind a **composed** handler — the original read handler plus the new write handler — since the registry binds one handler per capability id, not per verb. Read behaviour is untouched. |
| `shared/schema.ts` / `scripts/apply-companion-action-tables.ts` | New table `companion_action_proposals` — the lifecycle record of a proposed Companion Action (proposed → confirmed → succeeded/failed/cancelled), grouped by `workflowId`. |
| `companion-actions.ts` (new, pure) | Turns a turn's Native Discovery Responses (INT36) into Companion Action **proposals** — gated by executability and by explicit, client-supplied context (never a guessed day). |
| `companion-action-store.ts` (new) | Sole owner of `companion_action_proposals` — CRUD + idempotent terminal transitions. |
| `companion-delegation-analytics.ts` (new, pure) | The eight dashboard metrics the EWO asked for, computed from proposal rows. |
| `conversation-gateway.ts` (modified) | Builds and persists proposals on the success path; `TurnResult.actions`. |
| `routes.ts` (modified) | `POST .../actions/:id/confirm` and `.../cancel`; `delegation` on `GET /learning/dashboard`; `actions` on `POST /turn`. |
| `companion-action.ts` (new, client, pure) | View model — grouping into workflows, confirmation presentation, outcome summaries. |
| `FloatingAssistant.tsx` / `admin-companion-intelligence-page.tsx` (modified) | Companion Action UI; Delegated Actions dashboard section. |

---

## 2. Architecture tension identified and resolved

`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` states, as a hard rule: *"A Companion Card must never... own editing — no mutation happens on a card; editing happens on the canonical page."* INT40's own EWO text anticipates this by asking for **"structured Companion Actions that represent executable platform operations rather than conversational suggestions"** — i.e. explicitly a new, distinct type, not a retrofit of the card.

**Resolution:** Companion Actions are an **additive structural type, rendered alongside Companion Cards, never grafted onto them.**

- `companion-card.ts` is **not modified** by this workstream. Cards keep their existing navigate-only contract, unchanged, byte-for-byte.
- `companion-action.ts` is a **new, separate** module with its own view model (`CompanionActionView`, `CompanionActionWorkflowView`), imported nowhere by `companion-card.ts` and importing nothing from it.
- In `FloatingAssistant.tsx`, the `CompanionActionBlock` renders in its own DOM block, below any `DiscoveryBlock` (Companion Cards) and above the `GuidanceBlock` — visually and structurally distinct, never a card action.

The governing principle continues to hold **exactly as written** for cards. Companion Actions are a new, separate, governed surface this workstream introduces — consistent with "Companion Actions are reusable platform capabilities, not bespoke workflows" from the EWO's own architecture principles.

---

## 3. Write execution — activating the dormant CONFIRM step

### 3.1 Why composition, not a second binding

`CapabilityHandler = (intent, context) => Promise<unknown>` is one handler **per capability id**, not per verb — `CapabilityRegistry.bindHandler()` replaces whatever handler was previously bound to that id. Binding a naive "write handler" to `shopping` would have **silently deleted** the existing INT3 read handler.

`bindings/shopping.ts` and `bindings/planner.ts` now bind a small **composing** handler instead:

```ts
function composeShoppingHandler(readHandler: CapabilityHandler, writeHandler: CapabilityHandler): CapabilityHandler {
  return (intent, context) =>
    intent.verb === "add" ? writeHandler(intent, context) : readHandler(intent, context);
}
```

Neither the read handler nor the write handler changed — this is pure dispatch, holding zero business logic of its own (Architecture Principle 2 & TIP1 §5, Risk R4). `executableIntents` grows from `["read", "explain"]` to `["read", "explain", "add"]`, so capability discovery stays truthful (INT6A) without a single other consumer of these bindings needing to change.

### 3.2 The write handlers delegate, they never re-implement

`shopping-write-handler.ts` forwards to `storage.addShoppingListExtra(userId, name, category?, alwaysAdd?)` — the exact call `POST /api/shopping-list/extras` already makes.

`planner-write-handler.ts` replicates, field for field, the ownership sequence `POST /api/planner/days/:dayId/items` performs in `routes.ts` — day exists → the day's week belongs to the caller's household (`getHouseholdForUser`) → the meal is a system meal or owned by the caller — before calling `storage.addPlannerEntry`. A missing `dayId`/`mealId`/`mealSlot` is an honest `gap`; a day/meal the caller doesn't own is an honest `denied` (no existence leak, mirroring the read handlers' cross-household discipline) — **never a guessed value**.

### 3.3 The CONFIRM step, genuinely exercised for the first time

`IntentEngine.route()`'s CONFIRM step (unchanged code, written in INT1) already does exactly what INT40 needed:

```
[4] CONFIRM — if confirmationFor(capability, verb) !== "none" && !options.confirmed
             → return { status: "confirmation_required", confirmation: tier, ... }
```

`confirmationFor()` (`permissions.ts`, also unchanged) already computes `"light"` for the `add` verb deterministically. Test §3 (`test-intelligence-composed bindings`) proves, against a fresh `IntelligencePlatform` instance with in-memory ports:

- an **unconfirmed** `add` intent is held at `confirmation_required` and **no write occurs**;
- a **confirmed** (`{ confirmed: true }`) `add` intent invokes the bound write handler and succeeds;
- the read verb continues to work through the same composed handler, unchanged.

No new confirmation logic was written. The platform's own five-year-old (by EWO numbering) design worked exactly as specified the first time it was actually exercised.

---

## 4. Companion Action proposal → confirm → execute → report

### 4.1 Sourcing — deliberately not a new NLU surface

`companion-actions.ts`'s `buildActionProposals()` builds proposals **only from entities already surfaced this turn via discovery** — the same `add-to-planner` / `add-to-shopping` `DiscoveryAction` vocabulary `native-discovery.ts` already emits for meal cards — never by re-parsing free-text write utterances. `detectWriteIntent()` and the pattern resolver are **untouched**: zero regression risk to the existing, extensively-tested NLU pipeline (confirmed by the unchanged 124/124 `test-intent-resolver.ts` result).

### 4.2 No day is ever guessed

A planner-add proposal requires **both** `selectedPlannerDayId` and `selectedMealSlot` to already be present as explicit, client-supplied surface hints (`context-frame-assembler.ts` — two new optional fields, added the *same way* `selectedMealId`/`activePlannerWeekId` already work: client-supplied, trusted for read-only context assembly per INT18 OQ5, never resolved from "today" or a day name by the platform itself). When either hint is absent, the planner-add proposal is **silently not offered** — an honest gap, not a fabricated default day. Test §4 proves this for all three cases: both hints present, one hint present, neither present.

### 4.2b Live verification caught a real wiring gap (fixed)

Manual end-to-end verification (§11 below) was run against the live dev server and database using a disposable `/api/demo/start` account (never against real user data). It caught a genuine bug the automated test suite could not: `server/routes.ts`'s `POST /api/intelligence/conversation/turn` handler extracted only the three *pre-existing* `surfaceHints` fields (`activePlannerWeekId`, `selectedMealId`, `currentFoodSlug`) from the request body — the two *new* INT40 fields (`selectedPlannerDayId`, `selectedMealSlot`) were added to `SurfaceHints`/`ContextFrame` and consumed by `companion-actions.ts`, but never actually read out of `req.body.surfaceHints` at the route boundary. The unit/integration test suite called `ConversationGateway.processUserTurn()` directly (the established test pattern for this module) and so never exercised the route layer itself — this is exactly the class of bug a live HTTP round-trip catches and a unit test cannot. Fixed with a 2-field additive change to the route handler (§12); re-verified live afterward (§11) and the full 29-suite regression re-run confirmed zero regressions.

**Known limitation, left as scope (see §10):** the *mechanism* is now fully wired end-to-end and proven live — but `FloatingAssistant.tsx` does not yet **populate** `selectedPlannerDayId`/`selectedMealSlot` from real page state (it currently only sends `{ currentPath: window.location.pathname }`). No page in the live app currently exposes "which day+slot is in view" as readable state the assistant could pick up. Until a follow-up workstream wires that (§10), the planner-add Companion Action is reachable and fully functional via the API (proven in §11) but **will not appear in the live UI** — only the shopping-add action will, since it needs no such context. This is an honest, explicitly scoped gap, not a fabricated "done."

### 4.3 Propose → confirm is two separate, cheap operations

Building a proposal (`buildActionProposals`) is a **pure, in-memory computation** — no storage read, no engine call. It reads capability metadata (`intelligencePlatform.getCapability`, `canExecute`) and computes the confirmation tier via the same `confirmationFor()` used by the engine — never a second, divergent tier calculation.

Confirming a proposal (`POST /api/intelligence/conversation/actions/:id/confirm`) is the **only** path that ever executes anything: it re-resolves the caller's `IntelligenceContext` fresh from the session (never trusts the stored proposal for identity), and calls `intelligencePlatform.handle(intent, context, { confirmed: true })` — the exact same authoritative entry point every other capability call goes through. An already-terminal proposal is reported back as-is and **never re-executed** (idempotent double-confirm safety — test §5).

### 4.4 Guided workflows — client-driven sequencing, no new async infrastructure

Every bundle of proposals built on one turn shares a single `workflowId` (even a single proposal is a length-1 workflow — no special-casing). Progress reporting is **client-driven**: `FloatingAssistant.tsx`'s `CompanionActionBlock` calls `confirm` once per action, in order, updating a "Step X of N" readout and a per-row spinner as each resolves — before moving to the next. A failure on one step never blocks the next (partial completion), and the terminal summary (`buildWorkflowOutcomeSummary`) names exactly what succeeded, what failed, and (via `errorMessage`) what to do next. No job queue, no websocket/SSE, no new server-side async state was introduced — the shared `workflowId` column is sufficient for both UI sequencing and dashboard analytics.

---

## 5. Dashboard extensions

One new additive top-level key, `delegation`, on the existing `GET /api/intelligence/learning/dashboard` (unchanged `assertAdmin` gate) — the same pattern INT38 (`feedback`/`guidance`) and INT39 (`goalCompletion`) each used. All eight metrics the EWO asked for, computed purely from `companion_action_proposals` rows (`companion-delegation-analytics.ts`, mirroring `companion-guidance-analytics.ts`'s pure-aggregation discipline):

| Metric | Definition | Honest-null rule |
|---|---|---|
| Delegated task completion rate | succeeded / all terminal | `null` when nothing has resolved yet |
| Most frequently delegated actions | count grouped by (capabilityId, verb) | empty list, never fabricated |
| Action success rate | succeeded / (succeeded + failed) — excludes cancellations (a user decision, not a failure) | `null` below denominator |
| Action cancellation rate | cancelled / all terminal | `null` below denominator |
| Partial completion rate | multi-action workflows with a mix of success/non-success among resolved actions / all multi-action workflows | `null` below denominator |
| Average delegated workflow duration | mean(last `resolvedAt` − first `createdAt`) across **fully-resolved** workflows only | `null` with zero sample |
| Most abandoned delegated workflows | workflow signatures where every action is still `proposed`, ranked by count | `reliable` flag below `MIN_SAMPLE_SIZE = 3`, never hidden |
| Most successful delegated workflows | workflow signatures where every action `succeeded`, ranked by count | `reliable` flag below `MIN_SAMPLE_SIZE = 3`, never hidden |

`admin-companion-intelligence-page.tsx` renders these with the **existing** `StatTile`/`GapTable` primitives only — no new visual language — and every rate renders `"No data yet"` when `null`, per the dashboard-wide convention already enforced everywhere else on the page.

---

## 6. Definition of Done

- **What success looks like:** a user who asks something that returns a discovered meal, on the Planner surface with a day/slot in view, sees an "Add to your planner" and an "Add to your shopping list" Companion Action; confirming either (or both, sequentially) genuinely mutates the real Planner/Shopping data via the existing owning services; a cancel/deny leaves an honest, specific message; the admin dashboard's new Delegated Actions section reflects real numbers after the fact.
- **What must not break:** every existing read capability, discovery response, guidance suggestion, and the write-intent honest-gap message for every capability *not* in this slice. Proven by the unchanged 26-suite `npm test` chain + `test-intent-resolver.ts`.
- **Manual test steps:** see §8 Verification below.

## 7. Data Impact

- Reads existing data: **YES** — `storage.getPlannerDay/getPlannerWeek/getMeal`, `getHouseholdForUser`, existing `companion_*` tables for dashboard analytics.
- Writes new data: **YES** — one new additive table, `companion_action_proposals` (lifecycle of a proposal). Confirmed actions also write through the **existing** owning tables (`shopping_list_extras` via `storage.addShoppingListExtra`; `planner_entries` via `storage.addPlannerEntry`) — the same tables and the same methods their existing HTTP routes already write through.
- Changes meaning of existing data: **NO.**
- Requires backfill: **NO** — the new table starts empty; no historical proposal data exists to backfill.

## 8. Trust Check

- **Could this mislead the user?** No — every proposal is shown before execution, every execution requires an explicit confirm click, and every outcome (success/failure/cancel) is reported with the platform's own honest message, never a fabricated "done".
- **Could this fabricate certainty?** No — a proposal is only ever built when the underlying capability is genuinely `canExecute()`-true and every required parameter is genuinely resolved (never a guessed planner day).
- **Is anything guessed but shown as real?** No — see §4.2.
- **What happens if the system is wrong?** The Intent Engine's own PERMISSION/VALIDATE checks (unchanged) still run at confirm time regardless of what was proposed — a proposal is advisory; the engine is authoritative. A confirm that fails is reported as `failed` with the platform's real error message and never silently swallowed.
- No architectural duplication introduced: **YES** confirmed — one owner per fact throughout (see §9).
- No new source of truth created: **YES** confirmed — `companion_action_proposals` owns only the proposal *lifecycle*; it never duplicates planner/shopping data.
- No runtime behaviour altered for capabilities outside this slice: **YES** confirmed — every other capability's `executableIntents` is unchanged; `detectWriteIntent()`'s existing honest-gap message for unbound write verbs is unchanged.

## 9. Governance compliance

- **Companion Actions reuse existing registered capabilities and business services; the Companion never implements business logic itself** — both write handlers are 1:1 forwards to `storage.*` methods that already existed and already had HTTP routes; ownership checks are *replicated*, never *re-derived differently* (§3.2).
- **User approval before every data-changing action** — the CONFIRM step is server-side and authoritative (§3.3); the client never calls confirm without an explicit user click, and light-tier actions still require a click (never auto-fire) per the EWO's "Before executing any action that changes user data, obtain clear user confirmation" instruction, independent of tier.
- **Honest gaps preserved** — no day is ever guessed (§4.2); every dashboard rate is `null` below its denominator (§5); every other write capability remains an honest "coming in a future update" gap, completely unchanged.
- **Deterministic routing preserved** — proposal building and confirmation-tier computation are pure/static, gated by `canExecute()`; no LLM is in the routing or execution path; `detectWriteIntent()`/`PatternIntentResolver` are untouched (proven by the unchanged 124/124 intent-resolver regression).
- **Existing ownership boundaries preserved** — Planner and Shopping remain the sole owners of planner/shopping business logic and data; `companion_action_proposals` owns only the Companion Action lifecycle, a genuinely new concept with no existing owner to duplicate.
- **Permission-aware access preserved** — every confirm/cancel route is session-authenticated and ownership-checked via the *existing* `DatabaseConversationStore.getTurnOwner()` (reused, not duplicated); the Intent Engine's PERMISSION step (unchanged) still runs at confirm time.
- **Existing Capability Registry ownership preserved** — no second registry; write handlers are bound to the *same* `shopping`/`planner` capability ids via the *same* `bindHandler()` method, composed (not replacing) the existing read handlers.
- **No duplicate workflow ownership** — a "workflow" is a grouping key (`workflowId`) on the single `companion_action_proposals` table, not a second table or a parallel state machine.

---

## 10. Scope Lock

**Implemented:**
- Write execution for exactly two (capability, verb) pairs: `shopping/add`, `planner/add`.
- The full Companion Action framework: proposal building, persistence, confirm/cancel endpoints, client-driven guided-workflow sequencing with progress and partial-failure reporting, and all eight dashboard metrics.
- Two new optional `SurfaceHints`/`ContextFrame` fields (`selectedPlannerDayId`, `selectedMealSlot`) — additive, same trust model as existing hints.

**Explicitly excluded (honest gaps, not implemented):**
- Nutrition Boosts, shopping-list *generation* (basket build), meal replacement (recipe-swap-engine), recipe save, product comparison, and household preference updates remain **not executable** — `detectWriteIntent()`'s existing "coming in a future update" message still covers every utterance shaped like these.
- Any confirmation tier above `light` (`required`/`strong`) is not exercised by this slice (`add` always computes to `light` for these two capabilities) — the client UI's "dialog" confirmation presentation path is built and unit-tested (test §4/§8) but not reachable through the two bound capabilities today.
- No new async job/queue/websocket infrastructure — guided workflows are sequenced client-side.
- No day-name or "today" resolution logic — a planner-add proposal requires the client to already know the day.
- **`FloatingAssistant.tsx` does not populate `selectedPlannerDayId`/`selectedMealSlot` from real page state** (§4.2b). The end-to-end mechanism (route → gateway → proposal → confirm → execute) is fully wired and verified live against the real database (§12); what's missing is a client-side "which day/slot is currently in view" reader on the Planner page itself. Until that follow-up lands, the planner-add Companion Action is API-reachable but not yet visible in the live UI — only shopping-add is, today.

**Suggestions for follow-up workstreams (not implemented without approval):**
- Bind additional write capabilities (Meals-Replace via `recipe-swap-engine`, Household-Add for preferences, Diary-Add) using the identical Port → Handler → Binding + composition pattern established here.
- Wire `FloatingAssistant.tsx` to actually populate `selectedPlannerDayId`/`selectedMealSlot` from the Planner page's own in-view state (client-side only — reads existing page state, invents no new day-resolution logic) so the planner-add Companion Action becomes visible in the live UI, not just reachable via the API.
- A `required`/`strong` tier write capability (e.g. Household membership) to exercise the dialog confirmation presentation path this workstream already built.

---

## 11. Live verification

Automated tests prove the logic is correct in isolation; they cannot prove the HTTP wiring between them is correct (as §4.2b's bug demonstrates). This workstream was additionally verified against the **live dev server and the real database**, using a disposable account created via the app's own `POST /api/demo/start` (never against any real user's data; cleaned up afterward via `DELETE /api/demo/cleanup`):

1. **Golden path — shopping-add, no planner context:** `POST /turn` with "find me a pasta recipe" on the `floating` surface (no day/slot hints) → 4 discovery cards + exactly 4 shopping-add proposals, capped at `MAX_PROPOSALS`, **zero** planner-add proposals (honest gap — correct). Confirmed one → `GET /api/shopping-list/extras` showed the real new row, written by the real `storage.addShoppingListExtra`.
2. **Guided 2-step workflow — planner-add + shopping-add:** same search, `surface: "planner"`, with `selectedPlannerDayId`/`selectedMealSlot` supplied → both a planner-add and a shopping-add proposal, sharing one `workflowId`. Confirmed both in sequence: `GET /api/planner/days/:dayId/entries` showed a genuinely new entry (real `mealId`, real `mealType`); `GET /api/shopping-list/extras` showed the second real row.
3. **Cancel:** cancelling a still-`proposed` action returned `{ status: "cancelled" }` and left no write behind.
4. **Idempotent re-confirm:** re-confirming an already-`succeeded` action returned the same cached result and **did not** create a second planner entry (verified by re-reading `GET /api/planner/days/:dayId/entries` — entry count unchanged).
5. **Guards:** confirming a non-existent action id → `404`; confirming without a session → `401`.

Every one of these hit the real `IntentEngine.route()` pipeline, the real composed handlers, and the real database — not stubs. The one defect this process found (§4.2b) was fixed and re-verified in the same session. Admin dashboard `/admin/companion-intelligence` was **not** opened in a live browser this session (no headless browser could be provisioned in this sandbox — no network access to fetch Chromium, no system browser present; a real admin user's own session was active on the shared dev server throughout and was not used) — the `delegation` payload shape and every metric were instead verified via `tsc --noEmit` against the page's own TypeScript interfaces and via the 14-assertion §6 analytics test section, both against real, non-trivial fixture data.

## 12. Files changed

| File | Change |
|---|---|
| `server/intelligence/handlers/shopping-write-port.ts` | **New** — `addShoppingListExtra` forward |
| `server/intelligence/handlers/shopping-write-handler.ts` | **New** — `add` verb, honest gaps/denials |
| `server/intelligence/handlers/planner-write-port.ts` | **New** — read methods (mirrors `planner-read-port.ts`) + `addPlannerEntry` |
| `server/intelligence/handlers/planner-write-handler.ts` | **New** — `add` verb, replicates the route's ownership sequence |
| `server/intelligence/bindings/shopping.ts` | Composed read+write handler; `executableIntents` gains `"add"` |
| `server/intelligence/bindings/planner.ts` | Composed read+write handler; `executableIntents` gains `"add"` |
| `server/intelligence/intelligence-platform.ts` | Doc-comment ledger entry (INT40 — first executable write verbs) |
| `server/intelligence/index.ts` | + exports for the new write port/handler modules |
| `shared/schema.ts` | + `companionActionProposals` table, insert schema, types |
| `scripts/apply-companion-action-tables.ts` | **New** — idempotent DDL (applied) |
| `server/intelligence/conversation/companion-actions.ts` | **New** — pure proposal builder |
| `server/intelligence/conversation/companion-action-store.ts` | **New** — `ICompanionActionStore` + DB/in-memory implementations |
| `server/intelligence/conversation/companion-delegation-analytics.ts` | **New** — pure dashboard-metric aggregation |
| `server/intelligence/conversation/conversation-gateway.ts` | Builds + persists proposals on the success path; `TurnResult.actions`; constructor accepts an injectable `ICompanionActionStore` |
| `server/intelligence/conversation/context-frame-assembler.ts` | + `selectedPlannerDayId`/`selectedMealSlot` on `SurfaceHints`/`ContextFrame` (client-supplied only) |
| `server/routes.ts` | + `POST .../actions/:id/confirm`, `.../cancel`; `delegation` on `GET /learning/dashboard`; `actions` on `POST /turn`; `POST /turn`'s `surfaceHints` parsing extended with `selectedPlannerDayId`/`selectedMealSlot` (bug found + fixed during live verification, §4.2b) |
| `client/src/components/conversation/companion-action.ts` | **New** — pure client view model, architecturally separate from `companion-card.ts` |
| `client/src/components/conversation/FloatingAssistant.tsx` | + `CompanionActionBlock`/`CompanionActionRow`; footer copy corrected to reflect the platform can now act (with confirmation) |
| `client/src/pages/admin-companion-intelligence-page.tsx` | + Delegated Actions section (5 stat tiles, 3 tables) |
| `server/tests/test-intelligence-companion-actions.ts` | **New** — 62 assertions across 8 sections |
| `package.json` | + `test:intelligence-companion-actions`, added to the `test` chain |

Full chain (`npm test`, 28 suites) passes with zero regressions. `test-intent-resolver.ts` (124 assertions, standalone) unchanged and passing — confirms zero impact on NLU. `tsc --noEmit` clean for every file this workstream touched (pre-existing, unrelated baseline errors in other test files confirmed unchanged before/after this workstream).
