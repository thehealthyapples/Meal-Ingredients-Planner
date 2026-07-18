/**
 * test-intelligence-companion-actions.ts — INT40 Companion Task Delegation &
 * Assisted Actions
 * =================================================================================
 * Coverage:
 *   §1  Shopping write handler — delegation, honest gaps, verb guard, auth guard
 *   §2  Planner write handler — ownership sequence replicated (not relaxed),
 *       honest gaps, no day ever guessed
 *   §3  Composed bindings via the full Intent Engine pipeline — read verbs still
 *       work unchanged; "add" requires confirmation before it invokes the write
 *       handler (proves the dormant CONFIRM step is now genuinely exercised)
 *   §4  companion-actions.ts — proposal building gated by executability and
 *       resolved surface hints (no day ever guessed)
 *   §5  companion-action-store.ts (in-memory) — CRUD, idempotent terminal
 *       transitions, workflow grouping
 *   §6  companion-delegation-analytics.ts — every dashboard metric, honest nulls,
 *       minimum-sample-size discipline
 *   §7  End-to-end via ConversationGateway.processUserTurn — actions persisted
 *       and grouped into one workflowId per turn
 *   §8  Client view model (companion-action.ts) — pure, reused directly here
 *
 * Run: npx tsx server/tests/test-intelligence-companion-actions.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
} from "../intelligence/index.js";
import { bindShoppingReadCapability } from "../intelligence/bindings/shopping.js";
import { bindPlannerReadCapability } from "../intelligence/bindings/planner.js";
import { createShoppingWriteHandler } from "../intelligence/handlers/shopping-write-handler.js";
import type { ShoppingWritePort } from "../intelligence/handlers/shopping-write-port.js";
import { createPlannerWriteHandler } from "../intelligence/handlers/planner-write-handler.js";
import type { PlannerWritePort } from "../intelligence/handlers/planner-write-port.js";
import type { ShoppingReadPort } from "../intelligence/handlers/shopping-read-port.js";
import type { PlannerReadPort, PlannerMealRef } from "../intelligence/handlers/planner-read-port.js";
import {
  buildActionProposals,
  type CompanionActionProposalDraft,
} from "../intelligence/conversation/companion-actions.js";
import {
  InMemoryCompanionActionStore,
} from "../intelligence/conversation/companion-action-store.js";
import {
  computeCompletionRate,
  computeMostDelegatedActions,
  computeActionSuccessRate,
  computeActionCancellationRate,
  computePartialCompletionRate,
  computeAverageWorkflowDuration,
  computeMostAbandonedWorkflows,
  computeMostSuccessfulWorkflows,
} from "../intelligence/conversation/companion-delegation-analytics.js";
import { ConversationGateway } from "../intelligence/conversation/conversation-gateway.js";
import { InMemoryConversationStore, resetInMemoryIds } from "../intelligence/conversation/conversation-store.js";
import {
  buildCompanionActionWorkflowViews,
  buildWorkflowOutcomeSummary,
} from "../../client/src/components/conversation/companion-action.js";
import type { Capability, Intent, IntelligenceContext, IntentVerb } from "../intelligence/types.js";
import type { IIntentResolver, ResolvedIntent } from "../intelligence/intent-resolver.js";
import type { ILlmProvider, LlmRequest, LlmResponse } from "../intelligence/conversation/llm-provider.js";
import type { HandleIntentFn } from "../intelligence/conversation/conversation-gateway.js";
import type { IntentOutcome } from "../intelligence/types.js";
import type { PlannerWeek, PlannerDay, Meal, CompanionActionProposal } from "../../shared/schema.js";

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.error(`  ✗ ${label}`);
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ───────────────────────────────────────────`);
}

// ---------------------------------------------------------------------------
// §1 — Shopping write handler
// ---------------------------------------------------------------------------

async function testShoppingWriteHandler(): Promise<void> {
  section("§1 Shopping write handler — delegation, honest gaps, guards");

  const added: { userId: number; name: string; category?: string; alwaysAdd?: boolean }[] = [];
  const deleted: { userId: number; id: number }[] = [];
  const port: ShoppingWritePort = {
    // COMP_ACT1 extended this port; the fixture had not caught up, so the file did
    // not typecheck. Completing the stub (not relaxing the port) is what fixes it.
    deleteShoppingListExtra: async (userId, id) => { deleted.push({ userId, id }); },
    addShoppingListExtra: async (userId, name, category, alwaysAdd) => {
      added.push({ userId, name, category, alwaysAdd });
      return { id: 1, householdId: 100, name, category: category ?? "household", alwaysAdd: alwaysAdd ?? false, inBasket: false, createdAt: new Date() } as any;
    },
  };
  const handler = createShoppingWriteHandler(async () => port);
  const ctx: IntelligenceContext = { role: "user", userId: "1", premium: false };

  const result = await handler({ verb: "add", capabilityId: "shopping", parameters: { name: "  Milk  " } }, ctx);
  assert((result as any).scope === "add", "add returns an { scope: 'add' } result");
  assert(added.length === 1 && added[0].name === "Milk" && added[0].userId === 1, "delegates to the exact owning-service method with trimmed name");

  try {
    await handler({ verb: "add", capabilityId: "shopping", parameters: {} }, ctx);
    assert(false, "missing name throws");
  } catch (err: any) {
    assert(err.name === "CapabilityExecutionError" && err.failureStatus === "gap", "missing { name } is an honest gap, not a fabricated add");
  }

  try {
    await handler({ verb: "delete", capabilityId: "shopping", parameters: { name: "Milk" } }, ctx);
    assert(false, "delete verb throws");
  } catch (err: any) {
    assert(err.failureStatus === "gap", "any verb other than 'add' is an honest gap — no delete/price/basket code path exists here");
  }

  try {
    await handler({ verb: "add", capabilityId: "shopping", parameters: { name: "Milk" } }, { role: "user", userId: undefined, premium: false });
    assert(false, "anonymous throws");
  } catch (err: any) {
    assert(err.failureStatus === "denied", "an unauthenticated context is denied, never a silent write");
  }
}

// ---------------------------------------------------------------------------
// §2 — Planner write handler
// ---------------------------------------------------------------------------

async function testPlannerWriteHandler(): Promise<void> {
  section("§2 Planner write handler — ownership sequence replicated, no day ever guessed");

  const weeks: PlannerWeek[] = [
    { id: 10, userId: 1, householdId: 100, weekNumber: 1, weekName: "Week 1" } as PlannerWeek,
    { id: 20, userId: 2, householdId: 200, weekNumber: 1, weekName: "Other Week" } as PlannerWeek,
  ];
  const days: PlannerDay[] = [
    { id: 1000, weekId: 10, dayOfWeek: 5 } as PlannerDay,
    { id: 2000, weekId: 20, dayOfWeek: 5 } as PlannerDay,
  ];
  const meals: Record<number, Meal> = {
    9000: { id: 9000, isSystemMeal: true, userId: null } as unknown as Meal,
    9001: { id: 9001, isSystemMeal: false, userId: 1 } as unknown as Meal,
    9002: { id: 9002, isSystemMeal: false, userId: 2 } as unknown as Meal, // owned by a different user
  };
  const added: any[] = [];

  const port: PlannerWritePort = {
    getHouseholdForUser: async (userId) => (userId === 1 ? 100 : 200),
    getPlannerDay: async (id) => days.find((d) => d.id === id),
    getPlannerWeek: async (id) => weeks.find((w) => w.id === id),
    getMeal: async (id) => meals[id],
    // COMP_ACT1 additions — stubbed so the fixture satisfies the real port.
    getPlannerEntryById: async () => undefined,
    updatePlannerEntryLocation: async () => undefined,
    replacePlannerEntryMeal: async () => undefined,
    addPlannerEntry: async (dayId, mealSlot, audience, mealId, position, calories, isDrink, drinkType) => {
      const entry = { id: 5000, dayId, mealType: mealSlot, audience, mealId, position, calories, isDrink, drinkType } as any;
      added.push(entry);
      return entry;
    },
  };
  const handler = createPlannerWriteHandler(async () => port);
  const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };

  const ok = await handler(
    { verb: "add", capabilityId: "planner", parameters: { dayId: 1000, mealId: 9000, mealSlot: "dinner" } },
    user1,
  );
  assert((ok as any).scope === "add" && added.length === 1, "a well-formed add with a system meal succeeds and delegates to addPlannerEntry");
  assert(added[0].dayId === 1000 && added[0].mealType === "dinner" && added[0].mealId === 9000, "delegates the exact resolved parameters, no re-derivation");

  for (const missing of [{ mealId: 9000, mealSlot: "dinner" }, { dayId: 1000, mealSlot: "dinner" }, { dayId: 1000, mealId: 9000 }]) {
    try {
      await handler({ verb: "add", capabilityId: "planner", parameters: missing }, user1);
      assert(false, `missing param ${JSON.stringify(missing)} throws`);
    } catch (err: any) {
      assert(err.failureStatus === "gap", `missing a required param is an honest gap, never a guessed day (${JSON.stringify(missing)})`);
    }
  }

  try {
    await handler({ verb: "add", capabilityId: "planner", parameters: { dayId: 1000, mealId: 9000, mealSlot: "brunch" } }, user1);
    assert(false, "invalid mealSlot throws");
  } catch (err: any) {
    assert(err.failureStatus === "gap", "an unsupported mealSlot is an honest gap");
  }

  try {
    await handler({ verb: "add", capabilityId: "planner", parameters: { dayId: 2000, mealId: 9000, mealSlot: "dinner" } }, user1);
    assert(false, "cross-household day throws");
  } catch (err: any) {
    assert(err.failureStatus === "denied", "a day belonging to another household is denied — no cross-household access, no existence leak");
  }

  try {
    await handler({ verb: "add", capabilityId: "planner", parameters: { dayId: 1000, mealId: 9002, mealSlot: "dinner" } }, user1);
    assert(false, "unowned meal throws");
  } catch (err: any) {
    assert(err.failureStatus === "denied", "a meal that is neither a system meal nor owned by the caller is denied");
  }

  const ownMealOk = await handler(
    { verb: "add", capabilityId: "planner", parameters: { dayId: 1000, mealId: 9001, mealSlot: "lunch" } },
    user1,
  );
  assert((ownMealOk as any).scope === "add", "a meal owned by the caller (not a system meal) also succeeds");
}

// ---------------------------------------------------------------------------
// §3 — Composed bindings via the full Intent Engine pipeline
// ---------------------------------------------------------------------------

async function testComposedBindings(): Promise<void> {
  section("§3 Composed bindings — read unchanged, write requires confirmation (CONFIRM step now genuinely exercised)");

  const readPort: ShoppingReadPort = {
    getProductMatchesForUser: async () => [],
    getShoppingListItems: async () => [],
    getShoppingListExtras: async () => [
      { id: 1, householdId: 100, name: "Milk", category: "household", alwaysAdd: true, inBasket: false, createdAt: new Date() } as any,
    ],
  };
  const added: any[] = [];
  const writePort: ShoppingWritePort = {
    deleteShoppingListExtra: async () => {},
    addShoppingListExtra: async (userId, name, category, alwaysAdd) => {
      added.push({ userId, name });
      return { id: 2, householdId: 100, name, category: category ?? "household", alwaysAdd: alwaysAdd ?? false, inBasket: false, createdAt: new Date() } as any;
    },
  };

  const platform = new IntelligencePlatform(new CapabilityRegistry());
  bindShoppingReadCapability(platform, async () => readPort, async () => writePort);

  const cap = platform.getCapability("shopping")!;
  assert(cap.availability === "available", "shopping capability is available once the composed handler is bound");
  assert(cap.executableIntents.includes("add"), "'add' is now a truthfully advertised executable intent");
  assert(cap.executableIntents.includes("read") && cap.executableIntents.includes("explain"), "read/explain remain executable — composition did not remove the original read verbs");

  const ctx: IntelligenceContext = { role: "user", userId: "1", premium: false };

  const readOutcome = await platform.handle({ verb: "read", capabilityId: "shopping", parameters: { scope: "list" } }, ctx);
  assert(readOutcome.status === "ok", "the read verb still works unchanged through the composed handler");

  const unconfirmed = await platform.handle({ verb: "add", capabilityId: "shopping", parameters: { name: "Eggs" } }, ctx);
  assert(unconfirmed.status === "confirmation_required", "an unconfirmed 'add' is held at the CONFIRM step — never silently executed");
  assert(unconfirmed.confirmation === "light", "shopping/add carries the deterministic 'light' confirmation tier");
  assert(added.length === 0, "no write occurred while unconfirmed");

  const confirmed = await platform.handle({ verb: "add", capabilityId: "shopping", parameters: { name: "Eggs" } }, ctx, { confirmed: true });
  assert(confirmed.status === "ok", "a confirmed 'add' invokes the bound write handler and succeeds");
  assert(added.length === 1 && added[0].name === "Eggs", "the write handler that ran is the SAME write handler unit-tested in §1 — no parallel execution path");
}

// ---------------------------------------------------------------------------
// §4 — companion-actions.ts proposal building
// ---------------------------------------------------------------------------

function mealDiscoveryFixture() {
  return [
    {
      domain: "meal",
      summary: "I found 1 meal matching “pasta”.",
      entities: [
        { kind: "meal" as const, ref: { type: "meal", id: 42 }, title: "Spaghetti Bolognese" },
      ],
      actions: [
        { kind: "open" as const, label: "Open Meal", appliesTo: "entity" as const },
        { kind: "add-to-planner" as const, label: "Add to Planner", appliesTo: "entity" as const },
        { kind: "add-to-shopping" as const, label: "Add to Shopping", appliesTo: "entity" as const },
        { kind: "view-all" as const, label: "View All", appliesTo: "results" as const },
      ],
      entityRefs: [{ type: "meal", id: 42 }],
    },
  ];
}

function testCompanionActionsBuilder(): void {
  section("§4 companion-actions.ts — honest-gap-first proposal building");

  const allowAll = () => true;
  const denyAll = () => false;
  const cap = (id: string): Capability => ({
    id, displayName: id, description: "", owner: "", owningService: "", apiSurface: "",
    supportedIntents: ["add"], executableIntents: ["add"],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "write", aiAccess: "W", availability: "available",
  });
  const getCap = (id: string) => cap(id);

  const withHints = buildActionProposals(
    mealDiscoveryFixture(),
    { selectedPlannerDayId: 1000, selectedMealSlot: "dinner" },
    allowAll,
    getCap,
  );
  assert(withHints.length === 2, "with both hints present, both a planner-add and a shopping-add proposal are built");
  const plannerDraft = withHints.find((p) => p.capabilityId === "planner")!;
  assert(plannerDraft.parameters.dayId === 1000 && plannerDraft.parameters.mealSlot === "dinner" && plannerDraft.parameters.mealId === 42, "the planner proposal's parameters are exactly the resolved surface hints + card id — nothing guessed");
  assert(plannerDraft.confirmationTier === "light", "confirmationTier is computed via the shared confirmationFor(), not re-decided here");
  const shoppingDraft = withHints.find((p) => p.capabilityId === "shopping")!;
  assert(shoppingDraft.parameters.name === "Spaghetti Bolognese", "the shopping proposal uses the card's own title as the item name");

  const withoutHints = buildActionProposals(mealDiscoveryFixture(), {}, allowAll, getCap);
  assert(withoutHints.length === 1 && withoutHints[0].capabilityId === "shopping", "with no day/slot hint, the planner-add proposal is silently omitted (honest gap) — only shopping-add is offered");

  const partialHints = buildActionProposals(mealDiscoveryFixture(), { selectedPlannerDayId: 1000 }, allowAll, getCap);
  assert(partialHints.length === 1 && partialHints[0].capabilityId === "shopping", "a day without a slot (or vice versa) is still not enough — no day is ever half-guessed");

  const gated = buildActionProposals(mealDiscoveryFixture(), { selectedPlannerDayId: 1000, selectedMealSlot: "dinner" }, denyAll, getCap);
  assert(gated.length === 0, "when canExecute is false for every capability, nothing is proposed — never a dead action button");

  const nonMealCard = [{
    domain: "planner", summary: "s", entities: [{ kind: "entity" as const, ref: { type: "meal_template", id: 1 }, title: "T" }],
    actions: [{ kind: "add-to-planner" as const, label: "Add", appliesTo: "entity" as const }], entityRefs: [],
  }];
  assert(buildActionProposals(nonMealCard, { selectedPlannerDayId: 1000, selectedMealSlot: "dinner" }, allowAll, getCap).length === 0, "only meal-kind cards with a 'meal' ref can carry add-to-planner/add-to-shopping — mirrors native-discovery.ts, never re-derived differently");
}

// ---------------------------------------------------------------------------
// §9 — COMP_ACT2: surfacing the write verbs COMP_ACT1 bound
// ---------------------------------------------------------------------------

/** A discovery card carrying a row the household already owns (shopping/pantry/diary). */
function ownedRowFixture(domain: string, refType: string, id: number, title: string) {
  return [{
    domain,
    summary: `s`,
    entities: [{ kind: "entity" as const, ref: { type: refType, id }, title }],
    // Deliberately only the actions native-discovery really emits for these
    // domains — `open` + `view-all`. COMP_ACT2 keys on the REF TYPE, so it must
    // work without any add-to-* vocabulary being invented for them.
    actions: [
      { kind: "open" as const, label: "Open", appliesTo: "entity" as const },
      { kind: "view-all" as const, label: "View All", appliesTo: "results" as const },
    ],
    entityRefs: [{ type: refType, id }],
  }];
}

function testCompActTwoSurfacing(): void {
  section("§9 COMP_ACT2 — the COMP_ACT1 write verbs surfaced as contextual proposals");

  const allowAll = () => true;
  const denyAll = () => false;
  const cap = (id: string): Capability => ({
    id, displayName: id, description: "", owner: "", owningService: "", apiSurface: "",
    supportedIntents: ["add"], executableIntents: ["add"],
    permissions: { minimumRole: "user", knowledgeClass: "public", ownershipScoped: true, audited: false },
    capabilityClass: "write", aiAccess: "W", availability: "available",
  });
  const getCap = (id: string) => cap(id);
  const only = (drafts: CompanionActionProposalDraft[], capabilityId: string, verb: string) =>
    drafts.filter((d) => d.capabilityId === capabilityId && d.verb === verb);

  // ── Shopping Delete — the target is a row already on screen ───────────────
  const shopping = buildActionProposals(ownedRowFixture("shopping", "shopping_item", 77, "Oat milk"), {}, allowAll, getCap);
  const del = only(shopping, "shopping", "delete");
  assert(del.length === 1, "a shopping row surfaced this turn is offered for removal — no hint needed, the row IS the context");
  assert(del[0].parameters.id === 77, "the delete parameter is exactly the surfaced row id — the key the handler expects ('id'), never a name");
  assert(del[0].confirmationTier === "strong", "delete is a strong-confirmation action via the shared confirmationFor(), not re-decided here");
  assert(del[0].label.includes("Oat milk"), "the label names the actual row so the household can see what would go");

  // ── Pantry Remove — same shape ────────────────────────────────────────────
  const pantryDel = only(buildActionProposals(ownedRowFixture("pantry", "pantry_item", 9, "Chickpeas"), {}, allowAll, getCap), "pantry", "delete");
  assert(pantryDel.length === 1 && pantryDel[0].parameters.id === 9, "a pantry row surfaced this turn is offered for removal against its own id");
  assert(pantryDel[0].confirmationTier === "strong", "pantry removal is also strong-confirmation");

  // ── Pantry Add — needs a category the household actually chose ────────────
  const foodCard = ownedRowFixture("nutrition", "food", 5, "Olive oil");
  assert(only(buildActionProposals(foodCard, {}, allowAll, getCap), "pantry", "add").length === 0, "without a chosen pantry category, Pantry Add is an honest gap — a food is never filed into a guessed cupboard");
  assert(only(buildActionProposals(foodCard, { selectedPantryCategory: "cellar" }, allowAll, getCap), "pantry", "add").length === 0, "a category the handler would reject is refused at proposal time too — never a button that cannot succeed");
  const pantryAdd = only(buildActionProposals(foodCard, { selectedPantryCategory: "fridge" }, allowAll, getCap), "pantry", "add");
  assert(pantryAdd.length === 1, "with a chosen category, the food in view can be added to the pantry");
  assert(pantryAdd[0].parameters.ingredient === "Olive oil" && pantryAdd[0].parameters.category === "fridge", "parameters are exactly the handler's keys ('ingredient','category') — the chosen category, never a default");
  assert(pantryAdd[0].confirmationTier === "light", "add is a light-confirmation action");

  // ── Diary Log — needs BOTH a day and a slot, guesses neither ──────────────
  assert(only(buildActionProposals(foodCard, { selectedDiaryDate: "2026-07-18" }, allowAll, getCap), "diary", "add").length === 0, "a day without a slot is not enough to log a meal");
  assert(only(buildActionProposals(foodCard, { selectedDiarySlot: "lunch" }, allowAll, getCap), "diary", "add").length === 0, "a slot without a day is not enough either — the platform never resolves 'today' here");
  assert(only(buildActionProposals(foodCard, { selectedDiaryDate: "18-07-2026", selectedDiarySlot: "lunch" }, allowAll, getCap), "diary", "add").length === 0, "a malformed date is refused rather than reformatted into a guess");
  assert(only(buildActionProposals(foodCard, { selectedDiaryDate: "2026-07-18", selectedDiarySlot: "brunch" }, allowAll, getCap), "diary", "add").length === 0, "a slot outside the diary's own vocabulary is refused ('snack' singular, not planner's 'snacks')");
  const diary = only(buildActionProposals(foodCard, { selectedDiaryDate: "2026-07-18", selectedDiarySlot: "snack" }, allowAll, getCap), "diary", "add");
  assert(diary.length === 1, "with both a day and a slot on screen, the food in view can be logged");
  assert(diary[0].parameters.name === "Olive oil" && diary[0].parameters.mealSlot === "snack" && diary[0].parameters.date === "2026-07-18", "parameters are exactly the handler's keys ('name','mealSlot','date') — the day shown, never today-resolved-here");

  // ── Planner Move — entry from the open sheet, target from the selected day ─
  const entryHints = { selectedPlannerEntryId: 500, selectedPlannerEntryDayId: 10, selectedPlannerEntrySlot: "dinner" };
  assert(only(buildActionProposals([], { selectedPlannerDayId: 11 }, allowAll, getCap), "planner", "move").length === 0, "no open entry → nothing to move (honest gap)");
  assert(only(buildActionProposals([], entryHints, allowAll, getCap), "planner", "move").length === 0, "an open entry with no selected target day → still nothing to move");
  assert(only(buildActionProposals([], { ...entryHints, selectedPlannerDayId: 10 }, allowAll, getCap), "planner", "move").length === 0, "a target day equal to the entry's own day is refused — a no-op is worse than silence");
  const move = only(buildActionProposals([], { ...entryHints, selectedPlannerDayId: 11 }, allowAll, getCap), "planner", "move");
  assert(move.length === 1, "an open entry plus a different selected day is a real move");
  assert(move[0].parameters.entryId === 500 && move[0].parameters.dayId === 11 && move[0].parameters.mealSlot === "dinner", "move parameters are the handler's keys ('entryId','dayId','mealSlot') — target day from the selection, slot from the entry's OWN slot");
  assert(move[0].confirmationTier === "required", "move is a required-confirmation action — a dialog, not an inline tap");
  assert(only(buildActionProposals(ownedRowFixture("meal", "meal", 1, "A"), { ...entryHints, selectedPlannerDayId: 11 }, allowAll, getCap), "planner", "move").length === 1, "Move is built once per turn regardless of how many cards were surfaced — never duplicated per card");

  // ── Planner Replace — the open entry, swapped for a meal found this turn ───
  const mealCard = ownedRowFixture("meal", "meal", 42, "Spaghetti Bolognese");
  assert(only(buildActionProposals(mealCard, {}, allowAll, getCap), "planner", "replace").length === 0, "a meal in view with no open entry → nothing to replace");
  assert(only(buildActionProposals(mealCard, { selectedPlannerEntryId: 500, selectedPlannerEntryMealId: 42 }, allowAll, getCap), "planner", "replace").length === 0, "replacing a meal with itself is refused — never a no-op dressed as a suggestion");
  const replace = only(buildActionProposals(mealCard, { selectedPlannerEntryId: 500, selectedPlannerEntryMealId: 7 }, allowAll, getCap), "planner", "replace");
  assert(replace.length === 1 && replace[0].parameters.entryId === 500 && replace[0].parameters.mealId === 42, "replace parameters are the handler's keys ('entryId','mealId') — the open entry, the discovered meal");
  assert(replace[0].confirmationTier === "required", "replace is a required-confirmation action");

  // ── The executability gate and the proposal cap still hold ────────────────
  const allHints = {
    ...entryHints, selectedPlannerDayId: 11, selectedPantryCategory: "fridge",
    selectedDiaryDate: "2026-07-18", selectedDiarySlot: "lunch",
  };
  assert(buildActionProposals(mealCard, allHints, denyAll, getCap).length === 0, "when canExecute is false, not one of the new actions is proposed — the gate is the same one INT40 uses");
  const saturated = buildActionProposals(mealCard, allHints, allowAll, getCap);
  assert(saturated.length <= 4, "even with every pointer present, a turn never carries more than MAX_PROPOSALS buttons");

  // ── No existing behaviour changed ─────────────────────────────────────────
  assert(only(buildActionProposals(mealDiscoveryFixture(), { selectedPantryCategory: "fridge" }, allowAll, getCap), "planner", "add").length === 0, "COMP_ACT2's pointers do not switch on planner ADD — it still needs its own day+slot hints, exactly as before");
}

// ---------------------------------------------------------------------------
// §5 — companion-action-store.ts (in-memory)
// ---------------------------------------------------------------------------

async function testActionStore(): Promise<void> {
  section("§5 companion-action-store.ts — CRUD, idempotent terminal transitions, workflow grouping");

  const store = new InMemoryCompanionActionStore();
  const drafts: CompanionActionProposalDraft[] = [
    { capabilityId: "planner", verb: "add", label: "Add to planner", parameters: { mealId: 1 }, confirmationTier: "light" },
    { capabilityId: "shopping", verb: "add", label: "Add to shopping", parameters: { name: "Milk" }, confirmationTier: "light" },
  ];
  const created = await store.createProposals(500, "wf-1", drafts);
  assert(created.length === 2, "createProposals persists every proposal in the bundle");
  assert(created[0].workflowId === "wf-1" && created[1].workflowId === "wf-1", "every proposal in one bundle shares the same workflowId");
  assert(created[0].status === "proposed", "a new proposal starts in 'proposed' status");

  const fetched = await store.getProposal(created[0].id);
  assert(fetched?.id === created[0].id, "getProposal retrieves by id");

  const succeeded = await store.updateProposalStatus(created[0].id, "succeeded", { resultSummary: "Added." });
  assert(succeeded.status === "succeeded" && succeeded.resolvedAt != null, "a terminal transition stamps resolvedAt");

  const reTransitioned = await store.updateProposalStatus(created[0].id, "failed", { errorMessage: "should not apply" });
  assert(reTransitioned.status === "succeeded", "an already-terminal proposal is never re-transitioned (idempotent double-confirm safety)");

  const workflowRows = await store.listProposalsForWorkflow("wf-1");
  assert(workflowRows.length === 2 && workflowRows[0].id === created[0].id, "listProposalsForWorkflow returns the bundle in id order");

  const all = await store.listProposals();
  assert(all.length === 2, "listProposals returns every persisted proposal for dashboard analytics");
}

// ---------------------------------------------------------------------------
// §6 — companion-delegation-analytics.ts
// ---------------------------------------------------------------------------

function row(
  id: number, workflowId: string, capabilityId: string, verb: string, status: string,
  createdOffsetSec: number, resolvedOffsetSec: number | null,
): CompanionActionProposal {
  const base = new Date(Date.UTC(2026, 6, 2, 0, 0, 0));
  return {
    id, conversationTurnId: 1, workflowId, capabilityId, verb, label: `${capabilityId} ${verb}`,
    parameters: {}, confirmationTier: "light", status,
    resultSummary: status === "succeeded" ? "Done." : null,
    errorCode: status === "failed" ? "denied" : null,
    errorMessage: status === "failed" ? "not allowed" : null,
    createdAt: new Date(base.getTime() + createdOffsetSec * 1000),
    resolvedAt: resolvedOffsetSec != null ? new Date(base.getTime() + resolvedOffsetSec * 1000) : null,
  } as unknown as CompanionActionProposal;
}

function testDelegationAnalytics(): void {
  section("§6 companion-delegation-analytics.ts — every dashboard metric, honest nulls");

  assert(computeCompletionRate([]).rate === null, "completion rate is null with zero terminal proposals — never a fabricated 0%");

  const fixture: CompanionActionProposal[] = [
    // wf-a: single action, succeeded
    row(1, "wf-a", "shopping", "add", "succeeded", 0, 5),
    // wf-b: two actions, one succeeded one failed → partial completion
    row(2, "wf-b", "planner", "add", "succeeded", 10, 20),
    row(3, "wf-b", "shopping", "add", "failed", 10, 25),
    // wf-c: two actions, both succeeded → most-successful workflow
    row(4, "wf-c", "planner", "add", "succeeded", 30, 40),
    row(5, "wf-c", "shopping", "add", "succeeded", 30, 45),
    // wf-d: two actions, never confirmed → abandoned workflow
    row(6, "wf-d", "planner", "add", "proposed", 50, null),
    row(7, "wf-d", "shopping", "add", "proposed", 50, null),
    // wf-e: single action, cancelled
    row(8, "wf-e", "shopping", "add", "cancelled", 60, 61),
  ];

  // Terminal rows: 1,2,3,4,5,8 (6 total) — succeeded: 1,2,4,5 (4); failed: 3 (1); cancelled: 8 (1).
  const completion = computeCompletionRate(fixture);
  assert(completion.totalTerminal === 6 && completion.totalSucceeded === 4, "completion rate counts every terminal (succeeded/failed/cancelled) proposal, not just succeeded ones");
  assert(Math.abs((completion.rate ?? 0) - 4 / 6) < 1e-9, "completion rate = succeeded / total terminal");

  const mostDelegated = computeMostDelegatedActions(fixture);
  assert(mostDelegated.find((m) => m.capabilityId === "shopping" && m.verb === "add")?.count === 5, "shopping/add was proposed 5 times across the fixture (wf-a, wf-b, wf-c, wf-d, wf-e)");
  assert(mostDelegated.find((m) => m.capabilityId === "planner" && m.verb === "add")?.count === 3, "planner/add was proposed 3 times across the fixture (wf-b, wf-c, wf-d)");

  const success = computeActionSuccessRate(fixture);
  assert(success.denominator === 5 && success.numerator === 4, "success rate excludes cancellations from its denominator — a cancellation is a user decision, not a failure");

  const cancellation = computeActionCancellationRate(fixture);
  assert(cancellation.numerator === 1 && cancellation.denominator === 6, "cancellation rate = cancelled / all terminal");

  const partial = computePartialCompletionRate(fixture);
  assert(partial.denominator === 3, "every multi-action (>=2) workflow counts towards the denominator, resolved or not (wf-b, wf-c, wf-d)");
  assert(partial.numerator === 1, "exactly one multi-action workflow (wf-b) had a mix of success and non-success among its resolved actions");

  const duration = computeAverageWorkflowDuration(fixture);
  assert(duration.sampleSize === 4, "only FULLY-resolved workflows contribute to average duration (wf-a, wf-b, wf-c, wf-e) — wf-d is still all-proposed, excluded");
  assert(Math.abs((duration.averageSeconds ?? 0) - 9) < 1e-9, "average duration = mean of (wf-a=5s, wf-b=15s, wf-c=15s, wf-e=1s) = 9s");
  // wf-a: 0→5=5s, wf-b: min(10)→max(25)=15s, wf-c: min(30)→max(45)=15s, wf-e: 60→61=1s. wf-d unresolved, excluded.
  const abandoned = computeMostAbandonedWorkflows(fixture);
  assert(abandoned.length === 1 && abandoned[0].signature === "planner:add → shopping:add" && abandoned[0].stepCount === 2, "wf-d (every step still 'proposed') is the one abandoned workflow signature, ordered by proposal id");

  const successfulWorkflows = computeMostSuccessfulWorkflows(fixture);
  assert(successfulWorkflows.some((w) => w.signature === "planner:add → shopping:add" && w.count === 1), "wf-c (every step succeeded) is counted as a successful workflow of that signature");
  assert(!abandoned.some((a) => a.signature.includes("wf-c")), "an abandoned-workflow signature never leaks into the successful list or vice versa");
}

// ---------------------------------------------------------------------------
// §7 — End-to-end via ConversationGateway
// ---------------------------------------------------------------------------

class StubLlm implements ILlmProvider {
  readonly modelName = "stub";
  readonly isAvailable = true;
  async complete(_request: LlmRequest): Promise<LlmResponse> {
    return { content: '{"text":"Here is a meal.","entityRefs":[]}', model: this.modelName };
  }
}

class StubResolver implements IIntentResolver {
  constructor(private readonly results: ResolvedIntent[]) {}
  async resolve(): Promise<ResolvedIntent[]> {
    return this.results;
  }
}

function mealDiscoveryOutcome(): IntentOutcome {
  return {
    status: "ok",
    capabilityId: "meal-discovery",
    verb: "search",
    message: "ok",
    result: {
      source: "meal-discovery",
      query: "pasta",
      totalCount: 1,
      results: [{ name: "Spaghetti Bolognese", internalId: 42, sourceType: "personal" }],
    },
  };
}

async function testEndToEnd(): Promise<void> {
  section("§7 End-to-end via ConversationGateway.processUserTurn");

  resetInMemoryIds();
  const actionStore = new InMemoryCompanionActionStore();
  const resolvedIntent: ResolvedIntent = { capability: "meal-discovery", verb: "search", parameters: { query: "pasta" }, confidence: 0.9 };
  const handleIntent: HandleIntentFn = async (intent) =>
    intent.capabilityId === "meal-discovery" ? mealDiscoveryOutcome() : { status: "gap", capabilityId: intent.capabilityId, verb: intent.verb as IntentVerb, message: "no data" };

  const gateway = new ConversationGateway(
    new InMemoryConversationStore(),
    new StubLlm(),
    new StubResolver([resolvedIntent]),
    handleIntent,
    undefined,
    actionStore,
  );

  const ctx: IntelligenceContext = { role: "user", userId: "1", premium: false };
  const noHintsResult = await gateway.processUserTurn(1, "find me a pasta recipe", "floating", {}, ctx);
  assert(noHintsResult.actions.length === 1 && noHintsResult.actions[0].capabilityId === "shopping", "without planner-day hints, only the shopping-add action is proposed and persisted");

  resetInMemoryIds();
  const withHintsResult = await gateway.processUserTurn(
    2,
    "find me a pasta recipe",
    "planner",
    { selectedPlannerDayId: 1000, selectedMealSlot: "dinner" },
    ctx,
  );
  assert(withHintsResult.actions.length === 2, "with planner-day hints supplied, both actions are proposed and persisted");
  const workflowIds = new Set(withHintsResult.actions.map((a) => a.workflowId));
  assert(workflowIds.size === 1, "both actions from the same turn share exactly one workflowId — a guided 2-step workflow");

  const persisted = await actionStore.listProposalsForWorkflow(withHintsResult.actions[0].workflowId);
  assert(persisted.length === 2, "the actions are genuinely persisted in the injected store, not just returned in-memory");
}

// ---------------------------------------------------------------------------
// §8 — Client view model (pure, reused directly)
// ---------------------------------------------------------------------------

function testClientViewModel(): void {
  section("§8 companion-action.ts (client view model) — grouping, presentation, outcome summary");

  const proposals = [
    { id: 1, conversationTurnId: 1, workflowId: "wf", capabilityId: "planner", verb: "add", label: "Add to planner", parameters: {}, confirmationTier: "light" as const, status: "succeeded" as const, resultSummary: "Added.", errorCode: null, errorMessage: null, createdAt: "2026-07-02T00:00:00Z", resolvedAt: "2026-07-02T00:00:05Z" },
    { id: 2, conversationTurnId: 1, workflowId: "wf", capabilityId: "shopping", verb: "add", label: "Add to shopping", parameters: {}, confirmationTier: "light" as const, status: "failed" as const, resultSummary: null, errorCode: "denied", errorMessage: "not allowed", createdAt: "2026-07-02T00:00:00Z", resolvedAt: "2026-07-02T00:00:06Z" },
  ];
  const workflows = buildCompanionActionWorkflowViews(proposals);
  assert(workflows.length === 1 && workflows[0].totalCount === 2, "proposals sharing a workflowId are grouped into one workflow view");
  assert(workflows[0].isComplete === true, "a workflow with every action terminal is marked complete");
  assert(workflows[0].isPartialCompletion === true, "one success + one failure is flagged as a partial completion");

  const summary = buildWorkflowOutcomeSummary(workflows[0]);
  assert(summary != null && summary.includes("1 of 2 succeeded"), "the outcome summary honestly names what succeeded and what failed, never a generic 'done'");

  const singleProposed = buildCompanionActionWorkflowViews([
    { id: 3, conversationTurnId: 1, workflowId: "wf2", capabilityId: "shopping", verb: "add", label: "Add milk", parameters: {}, confirmationTier: "light" as const, status: "proposed" as const, resultSummary: null, errorCode: null, errorMessage: null, createdAt: "2026-07-02T00:00:00Z", resolvedAt: null },
  ]);
  assert(buildWorkflowOutcomeSummary(singleProposed[0]) === null, "a still-in-progress workflow has no outcome summary yet — never fabricated before it's true");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  await testShoppingWriteHandler();
  await testPlannerWriteHandler();
  await testComposedBindings();
  testCompanionActionsBuilder();
  testCompActTwoSurfacing();
  await testActionStore();
  testDelegationAnalytics();
  await testEndToEnd();
  testClientViewModel();

  console.log(`\n${"─".repeat(60)}`);
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(`  ✗ ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
