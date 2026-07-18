# COMP_ACT2 — Companion Action Surfacing

**Surfacing the six write verbs COMP_ACT1 bound as contextual Companion Action proposals — built in the
existing pure proposal builder from context the household has already put on screen, adding no new
capability, API, business logic or architecture.**

Implementation workstream. Executes COMP_ACT1's own recorded next action: *"surface new verbs as one-tap
Companion Action proposals (`companion-actions.ts`) — needs on-screen target context."*

| | |
|---|---|
| **Doc ID** | `COMP_ACT2` |
| **Date** | 2026-07-18 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/COMP_ACT2-companion-action-surfacing-20260718` → `7bfad50c` |
| **Status** | **Implemented + verified.** All six verbs proposed live through the real gateway against real household rows; every sufficiency refusal confirmed live. Browser screenshots not captured — see §7. |
| **Predecessors** | `COMP_ACT1` (bound the six write verbs), INT40 (the first two proposals — `planner.add`, `shopping.add` — whose seam and pointer-hint pattern this reuses), PHASE5E (the second user of that hint seam) |

---

## 0. PRE-FLIGHT (as required)

- **Git status confirmed.** Branch `int1-intelligence-platform`, HEAD `7bfad50c`. The working tree carries a
  large set of uncommitted changes from sibling sessions (COMP_ACT1, AFI1, AFI2, FI20); **none were touched
  by this workstream** beyond the files listed in §4.2.
- **Rollback protection created.** Annotated tag
  **`rollback/COMP_ACT2-companion-action-surfacing-20260718`** → `7bfad50c`.
- **Rollback identifier reported:** **`rollback/COMP_ACT2-companion-action-surfacing-20260718`**.
  Undo with `git reset --hard rollback/COMP_ACT2-companion-action-surfacing-20260718`.

---

## 1. WHAT WAS DONE, IN ONE PARAGRAPH

After COMP_ACT1, eight write verbs were **executable and confirmable but only two were ever offered**: the
Companion could move a planner meal if asked in exactly the right way, but never proposed it. COMP_ACT2 closes
that gap entirely inside the existing seam. `buildActionProposals` — the pure, storage-free builder already
called once per turn by the conversation gateway — gains **six proposal builders**, and the existing
client→server **pointer-hint channel** (the documented extension point INT40 and PHASE5E both used) gains
**seven pass-through pointers** naming what the household currently has open. No capability, route, API,
storage call, business rule, engine or client view component was added: the client action row is generic on
the proposal, so all six new verbs render, confirm and execute through machinery that did not change.

---

## 2. THE SIX SURFACED ACTIONS

Each proposal is built from (a) entities the platform **already discovered this turn** and/or (b) pointers the
surface publishes about what the household has open. Nothing is looked up, resolved or guessed to make a
proposal possible.

| Action | Capability · verb | Target comes from | Confirm tier (existing) |
|---|---|---|---|
| **Shopping Delete** | `shopping.delete` | discovery `shopping_item` ref | strong |
| **Pantry Remove** | `pantry.delete` | discovery `pantry_item` ref | strong |
| **Pantry Add** | `pantry.add` | discovery `food`/`meal` title + chosen category | light |
| **Diary Log** | `diary.add` | discovery `food`/`meal` title + date & slot pointers | light |
| **Planner Move** | `planner.move` | open-entry pointers + selected target day | required |
| **Planner Replace** | `planner.replace` | open-entry pointers + discovery `meal` ref | required |

Confirmation tiers are the platform's existing server-side tiers (`permissions.ts` `confirmationFor`) —
**unchanged**. Every proposal is additionally gated by the existing `canExecute(capabilityId, verb)`, so a
household without permission is never offered the action.

### 2.1 Sufficiency rules — when an action is offered, and when it is honestly absent

A proposal appears **only** when the context to execute it truthfully exists. Otherwise there is no proposal —
an honest gap, never a half-filled action the household has to correct.

| Action | Sufficiency rule | Why the refusal matters |
|---|---|---|
| Shopping Delete | `shopping_item` ref present | The row id is the user's own; nothing else needed. |
| Pantry Remove | `pantry_item` ref present | Same. |
| Pantry Add | category pointer present **and** a known category | Nothing on screen says where a food belongs. Defaulting to `larder` would file someone's shopping into a cupboard they never picked. |
| Diary Log | **both** date and slot present, date well-formed, slot known | Matches `diary-write-handler.ts`, which "never guesses which day". |
| Planner Move | entry + slot + target day present **and** target day ≠ the entry's own day | The second clause refuses a no-op move — a suggestion the household must read, think about and dismiss. |
| Planner Replace | entry present **and** discovered meal ≠ the entry's current meal | Same: never proposes replacing a meal with itself. |

### 2.2 Pointer discipline

The seven new hints are **pure pass-through**. The client sends them, `routes.ts` type-checks and drops
anything unrecognised, and the server **never resolves, infers or invents one**. They are not authority: every
id is re-validated and re-checked for household ownership by the COMP_ACT1 handler before anything is written.
A dropped pointer simply means the action is not offered.

New hints: `selectedPlannerEntryId`, `selectedPlannerEntryMealId`, `selectedPlannerEntryDayId`,
`selectedPlannerEntrySlot`, `selectedPantryCategory`, `selectedDiaryDate`, `selectedDiarySlot`.

> **Why a new name rather than the existing `selectedMealSlot`:** reusing it would silently switch on
> `planner.add` proposals in a context where the planner deliberately returns an honest gap today
> (`weekly-planner-page.tsx` refuses to publish it). **COMP_ACT2 changes no existing action's behaviour.**

### 2.3 Only deliberate household choices are published

Each page publishes a pointer only where the underlying state is a real "I am working with *this*" act, not a
render default:

- **Planner** — `contextEntry`/`mealDetail` carry `entry.id`, `dayId` and `mealType` only while an entry sheet
  or dialog is open. `selectedPlannerDayId` (an explicit day-header click) was already published by INT40.
- **Pantry** — the category tab is always concrete, but its initial `larder`/`household` value is a **render
  default, not a choice**. The pointer is published only once the household actually changes tab; before that,
  an honest gap.
- **Diary** — `date` is always exactly the day rendered. The slot is published only from an unambiguous single
  slot act (`addModalSlot`, or `expandedSlots` when exactly one is open).
- **Shopping** — **no page change was needed**; its target comes from discovery.

---

## 3. WHAT WAS DELIBERATELY NOT DONE

- **No new capability, verb, route, API or storage call.** The six verbs, their handlers, ports, ownership
  checks and confirmation tiers are COMP_ACT1's, untouched.
- **No new business logic.** The builder is pure: no storage read, no `handle()`, no LLM call, deterministic.
- **No new client view component.** `buildCompanionActionWorkflowViews` → `FloatingAssistant` is generic on the
  proposal row; the new verbs render with **zero** client view change.
- **No change to the confirmation flow.** Tier → inline/dialog → confirm route is exactly as before.
- **No planner-entry id sourced from discovery.** `planner-discovery` deliberately refs the underlying
  catalogue `meal` (`idField: "mealId"`), discarding `planner-entry:<id>`. Rather than change that
  long-standing decision, planner move/replace take their entry pointer from the surface.

---

## 4. IMPLEMENTATION REPORT

### 4.1 Pattern (unchanged from INT40)

```
page state (a deliberate household choice)
  → companion-context hint channel
  → POST /api/intelligence/conversation/turn  (routes.ts: type-check, drop unknown)
  → conversation-gateway
  → context-frame-assembler  (SurfaceHints — pointers only)
  → buildActionProposals()   (PURE — the only place COMP_ACT2 adds logic)
  → existing proposal persistence → existing client view → existing confirm flow
  → existing COMP_ACT1 handler (re-validates + re-checks ownership) → existing service
```

### 4.2 Files

| File | Change |
|---|---|
| `server/intelligence/conversation/companion-actions.ts` | +277 / −16 — six proposal builders + hint types |
| `server/intelligence/conversation/context-frame-assembler.ts` | +42 — seven pointer fields on `SurfaceHints` |
| `server/intelligence/conversation/conversation-gateway.ts` | +12 — pass-through to the builder |
| `server/routes.ts` | +49 — type-check + drop-unknown for the seven hints |
| `client/src/components/conversation/companion-context.tsx` | +50 / −2 — hint channel extended |
| `client/src/pages/weekly-planner-page.tsx` | +24 — publish open-entry pointers |
| `client/src/pages/pantry-page.tsx` | +32 — publish chosen category only |
| `client/src/pages/food-diary-page.tsx` | +19 — publish date + unambiguous slot |
| `server/tests/test-intelligence-companion-actions.ts` | +110 — §9, 31 new assertions |

**601 insertions, 16 deletions across 9 files.** No file outside this list was modified.

### 4.3 Inherited defect repaired

Four **pre-existing** typecheck errors in the INT40 test's port fixtures — COMP_ACT1 extended
`ShoppingWritePort`, `PlannerWritePort` and `ShoppingReadPort` without updating the stubs. The **stubs were
completed; the ports were never relaxed.**

---

## 5. VERIFICATION PERFORMED

### 5.1 Automated

| Suite | Result |
|---|---|
| `test-intelligence-companion-actions.ts` (incl. §9, +31 assertions) | **93 passed, 0 failed** (was 62) |
| `test-comp-act1-companion-actions.ts` | **22 passed, 0 failed** |
| Conversation gateway | 64 / 0 |
| Planner · Shopping · Pantry · Diary | 31 / 0 · 38 / 0 · 47 / 0 · 56 / 0 |
| Typecheck | Clean on every COMP_ACT2-touched file |

### 5.2 Live — real gateway, real storage, real household rows

Driven through `conversationGateway.processUserTurn` with a genuine `intelligencePlatform.contextFor(user)`
against real DB users. **All six verbs produced correct proposals with correct tiers and byte-exact
parameters, and every sufficiency refusal fired.**

| Probe | Result |
|---|---|
| Planner Move (entry 4997, own day 14455 → target 1) | ✅ `planner.move [required] {entryId:4997, dayId:1, mealSlot:"dinner"}` |
| Planner Move (target == own day) | ✅ **no proposal** — no-op refused |
| Planner Replace (entry 4997, current meal 4019) | ✅ `planner.replace [required] {entryId:4997, mealId:1350 / 1363}` — current meal correctly excluded |
| Diary Log (date + slot) | ✅ `diary.add [light] {name, mealSlot:"breakfast", date:"2026-07-18"}` |
| Diary Log (slot missing) | ✅ **no proposal** — never guesses the slot |
| Pantry Add (category chosen) | ✅ `pantry.add [light] {ingredient, category:"fridge"}` |
| Pantry Add (no category) | ✅ **no proposal** — never defaults to `larder` |
| Pantry Remove (from discovery) | ✅ `pantry.delete [strong] {id:8924888…}` — real user-owned rows |
| Shopping Delete (from discovery) | ✅ `shopping.delete [strong] {id:3257…}` — real user-owned rows |

Regression control: `planner.add` was confirmed **not** switched on by the new pointers (§9 assertion), so no
existing action's behaviour changed.

---

## 6. WORKED TRACE (Planner Replace, end-to-end)

1. Household opens a planner entry sheet → page publishes `selectedPlannerEntryId: 4997`,
   `selectedPlannerEntryMealId: 4019`.
2. They ask *"show me some chicken meals"* → discovery returns 15 `meal` cards.
3. `buildActionProposals` sees an open entry and, for each discovered meal **that is not 4019**, emits
   `planner.replace` at tier `required`.
4. Client renders it in the existing action row; `required` opens the existing confirmation dialog.
5. On confirm, the existing COMP_ACT1 `planner.replace` handler re-runs `getPlannerEntryById → getPlannerDay →
   getPlannerWeek → getHouseholdForUser`, denies on household mismatch, and forwards to
   `storage.replacePlannerEntryMeal`.

Nothing in steps 4–5 was written by COMP_ACT2.

---

## 7. KNOWN GAP IN VERIFICATION

**Browser screenshots were not captured.** Dev registration is closed
(`POST /api/register` → 403 when `!isProduction`) and login additionally requires `isBetaUser`, so no
authenticated browser session could be established without credentials. Live verification was therefore
performed through the real gateway in-process (§5.2), which exercises assembler → discovery → builder →
persistence, but **not** the rendered action row or the confirmation dialog. Those remain covered by the
existing INT40 client tests and §8's view-model assertions.

**Side effect to clean up:** an early probe run auto-selected user 1 (`colinclapson@hotmail.co.uk`, the owner
account) before the fixture user was pinned, writing **~36 fallback conversation turns** to thread 286.
**Zero action proposals** were persisted to that account. The turns are harmless chat history and can be
deleted on request; they were left in place rather than issuing an unrequested destructive delete.

---

## 8. FOLLOW-UPS (not in scope here)

1. **Browser-level verification** of the six proposals once beta credentials are available.
2. **Planner entry refs in discovery** — if `planner-discovery` ever emits `planner-entry:<id>`, planner
   move/replace could be proposed from discovery alone, without surface pointers.
3. **Delete the 36 probe turns** from user 1 thread 286 if the owner wants the history clean.

---

## 9. DEFINITION OF DONE

- [x] Six contextual proposals built in the **existing** pure builder
- [x] Planner Move · Planner Replace · Shopping Delete · Pantry Add · Pantry Remove · Diary Log
- [x] Existing Companion, Intent Engine, Capability Registry, Context Frame Assembler and confirmation flow reused
- [x] No new capability, API, architecture or business logic
- [x] Sufficiency rules — an action is offered only when its context truthfully exists
- [x] No existing action's behaviour changed
- [x] Tests green (93/0, 22/0) and typecheck clean; four inherited errors repaired
- [x] All six verbs verified live against real household data
- [ ] Browser screenshots — blocked on credentials (§7)
