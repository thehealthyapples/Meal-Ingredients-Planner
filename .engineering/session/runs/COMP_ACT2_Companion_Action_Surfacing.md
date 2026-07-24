# Session: COMP_ACT2_Companion_Action_Surfacing

| Field | Value |
|---|---|
| **Session ID** | `COMP_ACT2_Companion_Action_Surfacing` |
| **Rollback ID** | `rollback/COMP_ACT2-companion-action-surfacing-20260718` |
| **Start time** | 2026-07-18 |
| **Current stage** | Complete — awaiting owner review |

## Rollback
| Item | Value |
|---|---|
| Tag | `rollback/COMP_ACT2-companion-action-surfacing-20260718` → `7bfad50c` (annotated; == HEAD) |
| Working tree at start | **Dirty — NOT MINE.** 225 entries (133 untracked, 51 modified, 31 renamed, 10 deleted) from sibling sessions incl. COMP_ACT1's own uncommitted write bindings, AFI1, AFI2, FI20. Tag protects committed state only. Do NOT commit sibling work. Scope COMP_ACT2 to its own additive lines. Hazard: a concurrent sibling process has clobbered untracked docs before (AFI1/AFI2) — back up new docs/screenshots to scratchpad. |

## Objective
Surface the write verbs COMP_ACT1 already bound as **contextual Companion Action
proposals**: Planner Move, Planner Replace, Shopping Delete, Pantry Add, Pantry
Remove, Diary Log. Implement only. Reuse the EXISTING Companion, Intent Engine,
Capability Registry, Context Frame Assembler and confirmation flow. **No new
capability, API, business logic or architecture.** Offer an action ONLY when
sufficient context exists. Confirmation flow before execution, unchanged.

This is COMP_ACT1's own recorded "Next action (2)": *"surface new verbs as one-tap
Companion Action proposals (companion-actions.ts) — needs on-screen target context."*

## Inherited context (COMP_ACT1, complete, uncommitted)
8 executable verbs total: `planner.add`, `shopping.add` (INT40) + `planner.move`,
`planner.replace`, `shopping.delete`, `pantry.add`, `pantry.delete`, `diary.add`
(COMP_ACT1). All already in `supportedIntents`; ports/handlers/bindings bound to
existing storage services. Executable + confirmable today, but NOT proposed
conversationally — that gap is this session's whole scope.

## Reconnaissance (decisive findings)
**The seam.** `buildActionProposals(discoveries, hints, canExecute, getCapability)`
(companion-actions.ts:146) is PURE — no storage, no `handle()`. It builds proposals from
(a) entities discovery already surfaced this turn and (b) client surface hints. Called once,
conversation-gateway.ts:907. Client view layer (`buildCompanionActionWorkflowViews` →
FloatingAssistant) is GENERIC on the proposal row — new verbs render with ZERO client
view change. Confirmation flow (tier → inline/dialog → confirm route) is untouched.

**What discovery already gives us (no new read).** `native-discovery.ts` emits real
USER-OWNED row ids for `shopping_item` (`shoppingItemId`), `pantry_item` (composite
`pantry-item:<id>`) and `diary_entry` — plus `meal`/`food`. **But a planner ENTRY id NEVER
reaches a card:** planner-discovery deliberately refs the underlying catalogue `meal`
(`idField: "mealId"`, :138), discarding `planner-entry:<id>`. So planner move/replace can
NOT be sourced from discovery — they need an entry pointer from the surface.

**Confirmation tiers** (permissions.ts verb switch; all 4 capabilities `audited: false`):
`pantry.add`/`diary.add` → `light` (inline); `planner.move`/`planner.replace` → `required`
(dialog); `shopping.delete`/`pantry.delete` → `strong` (dialog).

**Exact params** (must match handlers byte-for-byte): planner.move `{entryId, dayId, mealSlot}`;
planner.replace `{entryId, mealId}`; shopping.delete `{id}`; pantry.add `{ingredient, category}`;
pantry.delete `{id}`; diary.add `{name, mealSlot, date}`. **Gotcha: planner slot is `snacks`,
diary slot is `snack` (singular).**

**On-screen state that honestly exists** (audited per page — only deliberate user choices used):
- Planner: `contextEntry`/`mealDetail` carry `entry.id` + `dayId` + `mealType` while an entry
  sheet/dialog is open (a real "I am working with THIS entry" act). `selectedDayId` (explicit
  day-header click, sessionStorage-persisted) is ALREADY published.
- Pantry: `activeFood`/`activeHome` tabs are always a concrete category — but initial
  `"larder"`/`"household"` is a RENDER DEFAULT, not a choice → publish only once the user
  actually changes tab (`categoryChosen` flag), else honest gap.
- Diary: `date` (`selectedDate ?? householdToday`) is always exactly the day rendered.
  `addModalSlot` is the one unambiguous single-slot user act; `expandedSlots` is honest only
  when `size === 1`.

## DESIGN (locked)
Extend the EXISTING pointer-hint seam — the documented extension point INT40 and PHASE5E
both used — with pass-through-only pointers, then build the 6 proposals in the EXISTING
pure builder. No new capability, route, API, storage call, business rule or architecture.

New hints (pure pass-through; server NEVER resolves or guesses one):
`selectedPlannerEntryId`, `selectedPlannerEntryMealId`, `selectedPlannerEntryDayId`,
`selectedPlannerEntrySlot`, `selectedPantryCategory`, `selectedDiaryDate`, `selectedDiarySlot`.

> **Deliberately a NEW name, not the existing `selectedMealSlot`:** reusing it would silently
> switch on `planner.add` proposals in a context where the planner today returns an honest gap
> (weekly-planner-page.tsx:1628 refuses to publish it). COMP_ACT2 changes no existing action's
> behaviour.

Sufficiency rules (no fabrication; each is an honest gap when unmet):
| Action | Source of target | Sufficiency rule |
|---|---|---|
| Shopping Delete | discovery `shopping_item` ref | ref present |
| Pantry Remove | discovery `pantry_item` ref | ref present |
| Pantry Add | discovery `food`/`meal` title + category hint | category hint present (user chose a tab) |
| Diary Log | discovery `food`/`meal` title + date+slot hints | BOTH date and slot present |
| Planner Move | entry hints + `selectedPlannerDayId` | entry + target day present AND target day ≠ entry's own day (never a no-op move) |
| Planner Replace | entry hints + discovery `meal` ref | entry present AND meal ≠ entry's current meal (never a no-op replace) |

Every proposal additionally gated by the EXISTING `canExecute(capabilityId, verb)` +
`confirmationFor(capability, verb)` — unchanged.

## Checkpoints
- [x] git status confirmed (225 dirty entries, none mine); rollback tag created + resolved
- [x] Map surfacing seam: companion-actions, context-frame-assembler, native-discovery, registry, permissions, client hint channel
- [x] Design locked (above) — context sufficiency rules per verb
- [x] Server: 6 proposal builders in the EXISTING pure `buildActionProposals` + hint
      pass-through (context-frame-assembler → conversation-gateway → routes.ts validation)
- [x] Client: hint channel extended (companion-context) + published from EXISTING page state
      (planner `contextEntry`/`mealDetail`; pantry chosen tab; diary `date` + explicit slot).
      Shopping needed NO page change — its target comes from discovery.
- [x] Tests: +31 assertions (§9) → companion-actions **93/0** (was 62). Downstream all green:
      COMP_ACT1 22/0, gateway 64/0, planner 31/0, shopping 38/0, pantry 47/0, diary 56/0
- [x] Typecheck clean on every COMP_ACT2-touched file. **Also repaired 4 INHERITED typecheck
      errors** in the INT40 test's port fixtures (COMP_ACT1 extended ShoppingWritePort/
      PlannerWritePort/ShoppingReadPort without updating the stubs) — stubs completed, port
      never relaxed.
- [x] Verify live: all 6 verbs proposed through the REAL gateway (`processUserTurn` +
      `intelligencePlatform.contextFor`) against real DB users — correct tiers, byte-exact
      params, real user-owned row ids. Every sufficiency refusal fired (no-op move, no-op
      replace, missing diary slot, unchosen pantry category). `planner.add` confirmed NOT
      switched on. **Screenshots NOT captured** — dev registration returns 403 and login
      requires `isBetaUser`, so no browser session was obtainable.
- [x] Doc: docs/implementation/companion/COMP_ACT2_COMPANION_ACTION_SURFACING.md written

## Next action
Owner to review `docs/implementation/companion/COMP_ACT2_COMPANION_ACTION_SURFACING.md` and decide
commit + follow-ons. Two open items for the owner:
1. **Browser screenshots** still uncaptured — needs beta credentials (see doc §7).
2. **Cleanup decision:** an early probe run auto-selected user 1 (`colinclapson@hotmail.co.uk`,
   owner account) before the fixture user was pinned, writing ~36 fallback conversation turns
   to thread 286. **Zero action proposals** persisted. Left in place rather than issuing an
   unrequested destructive delete — say the word and they go.

## Blockers
none (screenshots deferred, not blocking — see Next action)

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
