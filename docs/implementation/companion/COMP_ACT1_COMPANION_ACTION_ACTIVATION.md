# COMP_ACT1 — Companion Action Activation

**Activating the Companion's first real household actions by connecting existing capabilities to existing
business services — using the established Port → Handler → Service pattern, adding no new intelligence, no new
APIs, and no new business logic.**

Implementation workstream. Executes the P0-1 recommendation of `COMP_VERIFY1`. All business logic remains owned
by existing platform services; the Intelligence Platform only orchestrates.

| | |
|---|---|
| **Doc ID** | `COMP_ACT1` |
| **Date** | 2026-07-18 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `comp-act1-rollback` → HEAD `7bfad50ca198f2b86f6501a4f82d8ae41af9260b` |
| **Status** | **Implemented + verified.** Six new write verbs bound and passing; three orchestration-heavy actions reported as remaining-unbound with reasons. |
| **Predecessors** | `COMP_VERIFY1` (the audit that prioritised this work), INT40 (the first two write verbs — `planner.add`, `shopping.add` — whose pattern this reuses) |

---

## 0. PRE-FLIGHT (as required)

- **Git status confirmed.** Branch `int1-intelligence-platform`, HEAD `7bfad50c`. The working tree carries a
  large set of uncommitted changes from prior sessions; **none were touched by this workstream** beyond the
  files listed in §4.
- **Rollback protection created.** Annotated tag **`comp-act1-rollback`** → `7bfad50ca198f2b86f6501a4f82d8ae41af9260b`.
- **Rollback identifier reported:** **`comp-act1-rollback`**. Undo with `git reset --hard comp-act1-rollback`.

---

## 1. WHAT WAS DONE, IN ONE PARAGRAPH

The Companion was a secure read-mostly assistant: of ~13 supported write verbs, only `planner.add` and
`shopping.add` executed a real business mutation (INT40). COMP_ACT1 binds **six more write verbs** to their
**existing** owning services using the exact **Port → Handler → Binding** pattern INT40 proved — each verb is a
thin handler that replicates its route's ownership check and forwards to one existing `storage`/service method.
No business rule is re-implemented, no route is added, no engine is written. The platform now executes **eight**
real household write actions end-to-end (registry → permission → confirm → handler → owner → response), all
permission-aware, all confirmation-gated, all honest on failure.

---

## 2. COMPLETED ACTIONS

Each binds an existing capability verb to an existing owning-service method. "Owner method" is the **same call**
the equivalent HTTP route makes today — verified against `server/routes.ts`.

| # (priority) | Action | Capability · verb | Owner method (existing) | Ownership replicated from | Confirm tier |
|---|---|---|---|---|---|
| 3 | **Planner Move Meal** | `planner.move` | `storage.updatePlannerEntryLocation` | `PATCH /api/planner/entries/:entryId` (location branch) | required |
| 4 | **Planner Replace Meal** | `planner.replace` | `storage.replacePlannerEntryMeal` | `PATCH /api/planner/entries/:entryId/meal` | required |
| 6 | **Shopping Delete Item** | `shopping.delete` | `storage.deleteShoppingListExtra` | `DELETE /api/shopping-list/extras/:id` | strong |
| 7a | **Pantry Add Item** | `pantry.add` | `storage.addPantryItem` | `POST /api/pantry` | light |
| 7b | **Pantry Remove Item** | `pantry.delete` | `storage.deletePantryItem` | `DELETE /api/pantry/:id` | strong |
| 8 | **Diary Log Meal** | `diary.add` | `storage.createFoodDiaryEntry` | `POST /api/food-diary/:date/entries` | light |

Together with the two INT40 verbs (`planner.add`, `shopping.add`), the platform now executes **8 real business
write actions**. Confirmation tiers are the platform's existing server-side tiers (`permissions.ts`
`confirmationFor`) — unchanged.

**Ownership discipline (per action):**
- **Planner move/replace** replicate the route's exact sequence — `getPlannerEntryById → getPlannerDay →
  getPlannerWeek → getHouseholdForUser`, deny on household mismatch; move additionally re-checks the **target**
  day's household; replace additionally requires the new meal to be a system meal or the caller's own. A
  missing entry and a foreign-household entry return the **identical** denial (no existence leak).
- **Shopping delete / Pantry add+delete / Diary log** are **own-data by construction**: their owner methods
  take the caller's `userId` and scope the write to that user, so no cross-user path exists (the same guarantee
  `shopping.add`/INT40 relies on).

---

## 3. REMAINING UNBOUND ACTIONS

Three priority actions are **intentionally not bound**, because binding them within the stated constraints
("no new intelligence · no new APIs · no duplicate workflows · bind an *existing* capability to an *existing*
service via Port → Handler → Service") is not possible today — each lacks a single delegable owning-service
entry point and would require new orchestration.

| # (priority) | Action | Why not bound | What would unblock it |
|---|---|---|---|
| 1 | **Meal Swap** | `server/lib/recipe-swap-engine.ts` is an ingredient-substitution **suggestion** engine (a read/discovery compute), not a persistence service. The *persisted* act of swapping a planned meal for another **is** `planner.replace` — **delivered** (§2, #4). What remains is the *selection* step (the engine choosing the alternative), which is new reasoning/orchestration the constraints forbid. | A dedicated workstream that surfaces swap suggestions via discovery, then reuses `planner.replace` to persist the chosen one. |
| 2 | **Planner Generate Week** | No single owning-service method exists. Generation is **route-level orchestration** (`rankMealsByIngredients` + `generateSmartSuggestion` + per-slot writes across `server/routes.ts`). Binding it would duplicate a multi-step workflow — explicitly out of scope. | First consolidate week-generation behind one service method (e.g. `generatePlannerWeek(userId, weekId)`); then a 1:1 binding is safe. |
| 5 | **Shopping List Generate** | Same shape: generate-from-plan is orchestration over `grocery-integration` + the plan, not a single delegable method (`api.shoppingList.generateFromMeals`). Binding it would duplicate a workflow. | Consolidate generation behind one service method, then bind. |

> **The honest boundary.** The clean single-service delegations were completed in full; the three
> orchestration-heavy actions are reported here rather than forced, because forcing them would mean writing new
> orchestration inside the Intelligence Platform — precisely what "business logic remains owned by existing
> platform services" forbids. This preserves the architecture the workstream was told to protect.

**A second boundary — surfacing vs. execution.** COMP_ACT1 makes these verbs **executable through the platform**
(the requested Port → Handler → Service binding). *Surfacing* them as one-tap Companion Action **proposals** in
the chat UI (`companion-actions.ts`) is deliberately **not** part of this workstream: today that module builds
proposals only for `add-to-planner`/`add-to-shopping` from meal discovery cards, and extending it to move/
replace/delete/log needs on-screen target context (which entry, which item) that is a UX/discovery concern, not
a capability binding. The verbs are live and confirmable now; wiring them into conversational proposals is the
natural follow-up (see §7).

---

## 4. IMPLEMENTATION REPORT

### 4.1 Pattern (unchanged from INT40)

Every action is a **Port → Handler → Binding** triple:
- **Port** — a narrow interface whose methods are **1:1 forwards** to existing owner methods, built with
  **dynamic imports** (no DB connection at module load). Injectable for tests.
- **Handler** — replicates the route's ownership check (for entry-addressed writes), validates resolved
  parameters, returns **honest gaps** for anything missing, and forwards the one write. Holds **no** business
  rule.
- **Binding** — composes the existing read handler with the write handler into one capability-level dispatcher
  and declares the truthful `executableIntents`. Idempotent.

Confirmation is enforced **upstream** by the Intent Engine's existing CONFIRM step — no handler re-checks it.

### 4.2 Files

**Extended (existing write paths):**
- `server/intelligence/handlers/planner-write-port.ts` — added `getPlannerEntryById`,
  `updatePlannerEntryLocation`, `replacePlannerEntryMeal` forwards.
- `server/intelligence/handlers/planner-write-handler.ts` — added `handleMove`, `handleReplace`, and a shared
  `resolveOwnedEntry` ownership helper; dispatch now covers `add`/`move`/`replace`.
- `server/intelligence/bindings/planner.ts` — `executableIntents` now `["read","explain","add","move","replace"]`.
- `server/intelligence/handlers/shopping-write-port.ts` — added `deleteShoppingListExtra` forward.
- `server/intelligence/handlers/shopping-write-handler.ts` — added `handleDelete`; dispatch covers `add`/`delete`.
- `server/intelligence/bindings/shopping.ts` — `executableIntents` now `["read","explain","add","delete"]`.

**New (first write path for these capabilities):**
- `server/intelligence/handlers/pantry-write-port.ts`, `pantry-write-handler.ts` — `add` + `delete`.
- `server/intelligence/bindings/pantry.ts` — composed read+write; `executableIntents` now
  `["read","explain","add","delete"]`.
- `server/intelligence/handlers/diary-write-port.ts`, `diary-write-handler.ts` — `add` (log a meal).
- `server/intelligence/bindings/diary.ts` — composed read+write; `executableIntents` now
  `["read","explain","add"]`.

**Tests:**
- `server/tests/test-comp-act1-companion-actions.ts` — **new**, 22 assertions.
- `server/tests/test-intelligence-pantry-binding.ts`, `test-intelligence-diary-binding.ts` — updated the two
  now-stale `executableIntents` assertions to reflect the newly-live verbs (the read-only-enforcement sections,
  which bind a *local* read-only platform, are unchanged and still pass).

**No changes to:** the Capability Registry (`capability-registry.ts` — every verb was already in
`supportedIntents`), the Intent Engine, `permissions.ts`, `companion-actions.ts`, any route, any schema, or any
business service. `intelligence-platform.ts` binding order is unchanged (the bindings themselves gained the
write handlers).

### 4.3 Constraint compliance

| Constraint | How met |
|---|---|
| Reuse the existing business service | Each verb forwards to one existing `storage`/service method (§2). |
| Do not duplicate business logic | Handlers hold only parameter validation + the route's ownership check (replicated, as every read binding already does); the write itself is a single forward. |
| Use the existing confirmation flow | The Intent Engine's server-side CONFIRM step + `permissions.ts` tiers, unchanged. |
| Preserve permission-aware access | `canInvokeCapability` runs before every handler; anonymous/insufficient-role → `denied` (tested). |
| Preserve Effective Identity | Handlers act only on `context.userId` (the effective identity resolved by `resolveContext`); no actor/session inspection. |
| Preserve audit trail | The owning services and the Intent Engine's existing observation capture are untouched; each invocation still flows through the one audited choke point. |
| Preserve honest-gap behaviour | Missing/invalid resolved params (dayId, entryId, mealId, id, date, category, mealSlot) return honest gaps — never a guess, never a fabricated success (tested). |
| No new intelligence / no new APIs / no duplicate workflows | No engine, route, or workflow added; the three orchestration-heavy actions are reported unbound (§3) rather than forced. |

### 4.4 Verification (automated)

All run with `npx tsx <file>`:

| Test | Result |
|---|---|
| `test-comp-act1-companion-actions` (**new**) | **22 passed, 0 failed** — each verb: success + delegation + honest gap + ownership/permission denial + confirmation gate |
| `test-intelligence-planner-binding` | 31 passed, 0 failed |
| `test-intelligence-shopping-binding` | 38 passed, 0 failed |
| `test-intelligence-pantry-binding` | 47 passed, 0 failed |
| `test-intelligence-diary-binding` | 56 passed, 0 failed |
| `test-intelligence-registry-executability` | 129 passed, 0 failed |
| `test-intelligence-platform` | 33 passed, 0 failed |
| `test-intelligence-companion-actions` (INT40 proposals) | 62 passed, 0 failed |

*Note:* `test-intelligence-capability-composition` shows 15 passed / 8 failed **both with and without** the
COMP_ACT1 changes (verified by stashing this workstream's edits and re-running) — a **pre-existing** failure in
the working tree, unrelated to `meals`/`food-intelligence`/`opportunity-delivery` composition, which COMP_ACT1
does not touch.

---

## 5. WORKED TRACE (one action end-to-end)

*"Move Thursday's dinner to Friday lunch"* → `planner.move`:
1. **Intent** `{ verb: "move", capabilityId: "planner", parameters: { entryId, dayId, mealSlot: "lunch", position } }` (all ids resolved from surface context — never guessed).
2. **Permission** — `canInvokeCapability` confirms the caller may invoke `planner.move`.
3. **Confirm** — `move` → `required`; unconfirmed returns `confirmation_required` (tested).
4. **Handler** — `resolveOwnedEntry` asserts the entry's week belongs to the caller's household; the target
   day's household is re-checked; then `storage.updatePlannerEntryLocation` (the owner) performs the move.
5. **Respond** — the owner's real relocated entry, or its honest error. No planner rule re-implemented.

---

## 6. USER VERIFICATION STEPS

Because conversational surfacing is a follow-up (§3), verify at the capability layer today:

1. **Automated (fastest):** `npx tsx server/tests/test-comp-act1-companion-actions.ts` → expect
   `✅ COMP_ACT1 — 22 passed, 0 failed`. This drives every new verb through the real platform pipeline with
   injected in-memory owners.
2. **Live smoke (optional, against a running server + authenticated session)** — each verb executes through
   `intelligencePlatform.handle(intent, ctx, { confirmed: true })` and mutates exactly what the equivalent
   route mutates:
   - Pantry add → the item appears in `GET /api/pantry`; pantry delete → it disappears.
   - Diary log → the entry appears in `GET /api/food-diary/:date`.
   - Shopping delete → the extra disappears from the shopping list.
   - Planner move/replace → the entry's day/slot or meal changes in the planner week.
3. **Ownership/permission spot-check:** an unauthenticated context → `denied`; a foreign-household planner
   entry → `denied` with no existence leak; a missing resolved parameter → an honest gap (not a guess).
4. **Confirmation spot-check:** the same intent without `{ confirmed: true }` → `confirmation_required` at the
   tier `permissions.ts` assigns (add → light, move/replace → required, delete → strong).

---

## 7. FOLLOW-UPS (not in scope here)

1. **Surface the new verbs as Companion Action proposals** (`companion-actions.ts`) so users can trigger them
   one-tap in chat — needs on-screen target context (selected entry/item) from `context-frame-assembler.ts`.
2. **Consolidate week-generation and list-generation behind single service methods**, then bind
   `planner.generate` and `shopping.generate` 1:1 (unblocks priorities #2 and #5).
3. **Meal-swap selection** — wire the swap-suggestion engine into discovery, then reuse `planner.replace`
   (already delivered) to persist the chosen alternative (unblocks priority #1's selection half).

---

## 8. DEFINITION OF DONE

- [x] Git status confirmed; rollback protection created; identifier reported — **`comp-act1-rollback`** (§0).
- [x] Highest-value actions activated by binding existing capabilities to existing services via Port → Handler
      → Service — **6 new write verbs** (§2), joining INT40's 2 → **8 real household actions**.
- [x] For every action: reuses the existing service; no business logic duplicated; existing confirmation flow;
      permission-aware; effective identity; audit trail; honest-gap behaviour — all preserved and tested (§4.3–4.4).
- [x] No new intelligence · no new APIs · no duplicate workflows · no architectural change · no schema change (§4).
- [x] Produced: completed actions (§2), remaining unbound actions with reasons (§3), implementation report (§4),
      user verification steps (§6).

**The Companion can now perform its first real household actions — planner move/replace, shopping delete, pantry
add/remove, diary log — orchestrating existing THA capabilities while every business rule remains owned by the
existing platform services.**
