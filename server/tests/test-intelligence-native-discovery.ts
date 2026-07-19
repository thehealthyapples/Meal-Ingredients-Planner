/**
 * test-intelligence-native-discovery.ts — INT36
 * ==============================================
 * Tests for Native THA Discovery Responses.
 * No database, no OpenAI API required (in-memory store + stubs).
 *
 * Coverage:
 *   §1  buildNativeDiscoveryResponse — meal cards link to canonical THA meal pages
 *   §2  External URLs / provenance are never surfaced as the primary response
 *   §3  Provenance (sourceUrl) remains available within the THA Meal Detail read
 *   §4  Gateway end-to-end — discoveries attached alongside the LLM summary;
 *       existing (non-discovery) discovery behaviour continues to function
 *   §5  Every other discovery domain adopts the SAME pattern with no code change
 *
 * Run: npx tsx server/tests/test-intelligence-native-discovery.ts
 */

import {
  buildNativeDiscoveryResponse,
  isDiscoveryResult,
  type NativeDiscoveryResponse,
} from "../intelligence/conversation/native-discovery.js";
import {
  ConversationGateway,
  type HandleIntentFn,
} from "../intelligence/conversation/conversation-gateway.js";
import {
  InMemoryConversationStore,
  resetInMemoryIds,
} from "../intelligence/conversation/conversation-store.js";
import { createMealsReadHandler } from "../intelligence/handlers/meals-read-handler.js";
import type { MealsReadPort } from "../intelligence/handlers/meals-read-port.js";
import type { Meal } from "@shared/schema";
import type {
  IIntentResolver,
  ResolvedIntent,
} from "../intelligence/intent-resolver.js";
import type { ILlmProvider, LlmRequest, LlmResponse } from "../intelligence/conversation/llm-provider.js";
import type { IntelligenceContext, IntentOutcome, Intent } from "../intelligence/types.js";

// ---------------------------------------------------------------------------
// Minimal test harness
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
  console.log(`\n── ${name} ──────────────────────────────────────────`);
}

// ---------------------------------------------------------------------------
// Fixtures — the real result shapes each discovery capability returns
// ---------------------------------------------------------------------------

/** An external provenance URL. It must NEVER appear in a discovery response. */
const EXTERNAL_URL = "https://external-recipes.example.com/pasta-bake";
/** A canonical THA-hosted meal image. It MAY appear on a card. */
const THA_IMAGE = "https://cdn.thehealthyapples.test/meal/42.jpg";

// meal-discovery/search result. Note the first item carries a sourceUrl to prove
// provenance is stripped even when the underlying row exposes it.
const MEAL_DISCOVERY_RESULT = {
  scope: "discovery",
  query: "pasta",
  totalCount: 3,
  results: [
    {
      id: "personal:42", name: "Pasta bake", servings: 4, mealFormat: "recipe",
      dietTypes: [], sourceType: "personal", sourceLabel: "Your Cookbook",
      imageUrl: THA_IMAGE, sourceUrl: EXTERNAL_URL, isAlreadySaved: true,
      importable: false, internalId: 42,
    },
    {
      id: "system:100", name: "Creamy pasta", servings: 2, mealFormat: "recipe",
      dietTypes: ["vegetarian"], sourceType: "system", sourceLabel: "THA Library",
      isAlreadySaved: true, importable: false, internalId: 100,
    },
    {
      id: "template:7", name: "Weeknight pasta", description: "A quick template",
      dietTypes: [], sourceType: "template", sourceLabel: "Meal Templates",
      isAlreadySaved: false, importable: false,
    },
  ],
  sourcesQueried: "your cookbook, the THA library, and meal templates",
  source: "meal-discovery",
} as const;

// ---------------------------------------------------------------------------
// §1  Meal cards link to canonical THA meal pages
// ---------------------------------------------------------------------------

async function main(): Promise<void> {

section("§1  Meal discovery cards → canonical THA meal pages");

const mealResp = buildNativeDiscoveryResponse(MEAL_DISCOVERY_RESULT)!;
assert(mealResp !== null, "meal-discovery result produces a native response");
assert(mealResp.domain === "meal", "domain is 'meal'");
assert(/found 3 meals matching “pasta”/.test(mealResp.summary), "summary follows THA pattern with count + query");
assert(mealResp.entities.length === 3, "one card per result");

const personalCard = mealResp.entities[0];
assert(personalCard.kind === "meal", "personal meal → meal card");
assert(personalCard.ref.type === "meal" && personalCard.ref.id === 42, "meal card ref is canonical THA meal page (type meal, id 42)");
assert(personalCard.title === "Pasta bake", "meal card carries the meal title");
assert(personalCard.imageUrl === THA_IMAGE, "meal card carries the canonical THA image");
assert(personalCard.servings === 4, "meal card carries servings");
assert(personalCard.subtitle === "Your Cookbook", "meal card carries the source label as subtitle");
assert(personalCard.appleScore === undefined, "apple score omitted when no canonical source exposes it (never fabricated)");
assert(personalCard.lastCooked === undefined, "last cooked omitted when no canonical source exposes it (never fabricated)");

const systemCard = mealResp.entities[1];
assert(systemCard.ref.type === "meal" && systemCard.ref.id === 100, "system meal card → canonical THA meal id 100");

const templateCard = mealResp.entities[2];
assert(templateCard.kind === "entity", "template → generic entity card (not a saved meal)");
assert(templateCard.ref.type === "meal_template" && templateCard.ref.id === 7, "template card → canonical THA template page, not an external URL");

// Actions follow the THA pattern
const kinds = mealResp.actions.map(a => a.kind);
assert(kinds.includes("open"), "action: Open Meal");
assert(kinds.includes("add-to-planner"), "action: Add to Planner");
assert(kinds.includes("add-to-shopping"), "action: Add to Shopping");
const viewAll = mealResp.actions.find(a => a.kind === "view-all");
assert(viewAll?.appliesTo === "results" && viewAll?.query === "pasta", "action: View All carries the query and targets the result set");
assert(mealResp.actions.find(a => a.kind === "open")?.label === "Open Meal", "open action labelled 'Open Meal'");

// Canonical refs flattened for traceability
assert(
  mealResp.entityRefs.some(r => r.type === "meal" && r.id === 42) &&
  mealResp.entityRefs.some(r => r.type === "meal" && r.id === 100),
  "entityRefs expose the canonical THA meal refs",
);

// ---------------------------------------------------------------------------
// §2  External URLs / provenance never surface as the primary response
// ---------------------------------------------------------------------------

section("§2  External URLs are not surfaced as primary links");

const serialized = JSON.stringify(mealResp);
assert(!serialized.includes(EXTERNAL_URL), "external source URL never appears anywhere in the response");
assert(!serialized.includes("sourceUrl"), "no sourceUrl field is carried into the response");
assert(
  mealResp.entities.every(c => typeof c.ref.id === "number" && !/^https?:/i.test(c.ref.type)),
  "every card's primary link is a canonical numeric THA ref — never a URL",
);
assert(
  mealResp.entityRefs.every(r => typeof r.id === "number"),
  "every flattened ref is a canonical numeric THA ref",
);

// ---------------------------------------------------------------------------
// §3  Provenance remains available within the THA Meal Detail read
// ---------------------------------------------------------------------------

section("§3  Provenance (sourceUrl) preserved inside THA Meal Detail");

function makeMeal(over: Partial<Meal>): Meal {
  return {
    id: 42, userId: 7, name: "Pasta bake", ingredients: ["pasta"], instructions: ["cook"],
    imageUrl: THA_IMAGE, servings: 4, categoryId: null, sourceUrl: EXTERNAL_URL,
    mealTemplateId: null, mealSourceType: "imported", isReadyMeal: false, isSystemMeal: false,
    mealFormat: "recipe", dietTypes: [], isFreezerEligible: true, audience: "adult",
    isDrink: false, drinkType: null, barcode: null, brand: null, originalMealId: null,
    kind: "meal", createdAt: new Date(), isHouseholdSafeVariant: false, householdSafeFor: null,
    variantKind: null, showInCookbook: false, primarySlot: null, suitableSlots: [],
    energyBand: null, styleTags: [], ...over,
  } as Meal;
}

const mealsReadPort: MealsReadPort = {
  getMeals: async () => [],
  getSystemMeals: async () => [],
  getMealsSummary: async () => [],
  getSystemMealsSummary: async () => [],
  getMeal: async (id) => (id === 42 ? makeMeal({ id: 42, userId: 7 }) : undefined),
  getMealItems: async () => [],
};
const mealsReadHandler = createMealsReadHandler(async () => mealsReadPort);
const detailCtx: IntelligenceContext = { role: "user", userId: "7", premium: false };
const detail = await mealsReadHandler(
  { verb: "read", capabilityId: "meals", parameters: { scope: "detail", mealId: 42 } } as Intent,
  detailCtx,
) as { scope: string; meal: { sourceUrl: string | null } };
assert(detail.scope === "detail", "meals-read detail returns the detail scope");
assert(detail.meal.sourceUrl === EXTERNAL_URL, "Meal Detail still owns provenance — sourceUrl present");
// The same provenance must NOT be on the discovery card for that meal.
assert(!JSON.stringify(personalCard).includes("sourceUrl"), "the discovery card for the same meal carries no provenance");

// ---------------------------------------------------------------------------
// §4  Gateway end-to-end — discoveries attached; existing behaviour preserved
// ---------------------------------------------------------------------------

section("§4  Gateway end-to-end");

class StubLlm implements ILlmProvider {
  readonly modelName = "stub";
  readonly isAvailable = true;
  calls = 0;
  constructor(private readonly reply = '{"text": "I found some pasta meals for you.", "entityRefs": []}') {}
  async complete(_r: LlmRequest): Promise<LlmResponse> {
    this.calls++;
    return { content: this.reply, model: this.modelName };
  }
}
class StubResolver implements IIntentResolver {
  constructor(private readonly results: ResolvedIntent[]) {}
  async resolve(): Promise<ResolvedIntent[]> { return this.results; }
}
function stubHandle(perCapability: Record<string, IntentOutcome>): HandleIntentFn {
  return async (intent: Intent) => perCapability[intent.capabilityId] ?? {
    status: "ok", capabilityId: intent.capabilityId, verb: intent.verb, message: "ok",
    result: { note: "generic data" },
  };
}
function makeGateway(resolver: IIntentResolver, llm: ILlmProvider, handle: HandleIntentFn): ConversationGateway {
  resetInMemoryIds();
  return new ConversationGateway(new InMemoryConversationStore(), llm, resolver, handle);
}
const ctx = (id: number): IntelligenceContext => ({ role: "user", userId: String(id), premium: false });

const MEAL_INTENT: ResolvedIntent = { capability: "meal-discovery", verb: "search", parameters: { query: "pasta" }, confidence: 0.9 };
const MEAL_OUTCOME: IntentOutcome = { status: "ok", capabilityId: "meal-discovery", verb: "search", message: "ok", result: MEAL_DISCOVERY_RESULT };

{
  // PROD3 — this block used user 1 and asserted that meal 42 arrives on the turn.
  //
  // User 1's household (44) is **Gluten-Free**, and meal 42 is "Pasta Bake Test"
  // — `["300g pasta", …]`. The canonical gate refuses it:
  //   isMealSafeForHousehold(42, ctx(user 1)) → { safe:false, reason:"household-hard-restriction" }
  // Meal 100, the other fixture, is refused too (`diet:Keto`).
  //
  // So this assertion — passing, and inside `npm test` — was pinning the delivery
  // of a gluten-bearing pasta bake to a gluten-free household as CORRECT. It was
  // not testing safety and never claimed to; INT36's merge behaviour is what it
  // is for, and it simply had no idea the household it borrowed had allergens.
  //
  // The merge behaviour is still right and is still tested — on an UNRESTRICTED
  // household (user 2, `hardRestrictions: []`, no diet pattern), where the safety
  // gate is inactive and the merge is therefore the only thing under test. The
  // withholding behaviour for a restricted household is owned by
  // `test-prod3-companion-restriction-safety.ts`, which asserts this exact
  // fixture against user 1 and requires meal 42 to be absent.
  const llm = new StubLlm();
  const gw = makeGateway(new StubResolver([MEAL_INTENT]), llm, stubHandle({ "meal-discovery": MEAL_OUTCOME }));
  const r = await gw.processUserTurn(2, "pasta meals", "floating", {}, ctx(2));
  assert(llm.calls === 1, "LLM still writes the natural-language summary (existing behaviour preserved)");
  assert(r.text === "I found some pasta meals for you.", "turn text is the LLM summary");
  assert(r.discoveries.length === 1, "one native discovery response attached");
  assert(r.discoveries[0].domain === "meal" && r.discoveries[0].entities.length === 3, "attached response carries the meal cards");
  assert(
    r.entityRefs.some(x => x.type === "meal" && x.id === 42),
    "canonical THA meal refs are merged onto the turn even though the LLM returned none",
  );
}

// Non-discovery turn: no discoveries, text unchanged (regression guard)
{
  const llm = new StubLlm('{"text": "Your profile looks good.", "entityRefs": []}');
  const PROFILE_INTENT: ResolvedIntent = { capability: "profile", verb: "read", parameters: {}, confidence: 0.8 };
  const PROFILE_OUTCOME: IntentOutcome = { status: "ok", capabilityId: "profile", verb: "read", message: "ok", result: { name: "Colin", diet: "balanced" } };
  const gw = makeGateway(new StubResolver([PROFILE_INTENT]), llm, stubHandle({ profile: PROFILE_OUTCOME }));
  const r = await gw.processUserTurn(2, "what's my diet", "floating", {}, ctx(2));
  assert(r.discoveries.length === 0, "non-discovery turn attaches no discoveries");
  assert(r.text === "Your profile looks good.", "non-discovery turn text unchanged");
}

// Empty search never produces an empty card block (INT35 no-results owns it)
{
  const EMPTY_RESULT = { scope: "discovery", query: "xyzzy", totalCount: 0, results: [], sourcesQueried: "…", source: "meal-discovery" };
  assert(buildNativeDiscoveryResponse(EMPTY_RESULT) === null, "empty discovery result → null (no empty card block)");
}

// ---------------------------------------------------------------------------
// §5  Every other discovery domain adopts the SAME pattern, no code change
// ---------------------------------------------------------------------------

section("§5  Other discovery domains adopt the pattern unmodified");

const OTHER_DOMAINS: Array<{ label: string; result: unknown; refType: string; id: number; title: string }> = [
  {
    label: "planner-discovery", refType: "meal", id: 55, title: "Chicken curry",
    result: { scope: "planner-search", query: "curry", totalCount: 1, weeksScanned: 4,
      results: [{ id: "planner-entry:9", mealName: "Chicken curry", mealId: 55, weekName: "Week 1", weekNumber: 1, mealType: "dinner", source: "planner-discovery" }],
      source: "planner-discovery" },
  },
  {
    label: "shopping-discovery", refType: "shopping_item", id: 12, title: "Tomatoes",
    result: { scope: "shopping-search", query: "tom", totalCount: 1,
      results: [{ id: "shopping-item:12", shoppingItemId: 12, name: "Tomatoes", normalizedName: "tomato", quantity: "3", unit: "pcs", category: "produce", checked: false, source: "shopping-discovery" }],
      source: "shopping-discovery" },
  },
  {
    label: "pantry-discovery", refType: "pantry_item", id: 8, title: "Rice",
    result: { scope: "pantry-search", query: "rice", totalCount: 1,
      results: [{ id: "pantry-item:8", name: "Rice", source: "pantry-discovery" }],
      source: "pantry-discovery" },
  },
  {
    label: "diary-discovery", refType: "diary_entry", id: 33, title: "Porridge",
    result: { scope: "diary-search", query: "porridge", totalCount: 1,
      results: [{ id: "diary-entry:33", diaryEntryId: 33, foodName: "Porridge", mealSlot: "breakfast", date: "2026-07-01", quantity: 1, unit: "bowl", source: "diary-discovery" }],
      source: "diary-discovery" },
  },
  {
    label: "nutrition-discovery", refType: "food", id: 200, title: "Spinach",
    result: { scope: "nutrition-filter", query: "iron", totalCount: 1,
      results: [{ id: "system:200", name: "Spinach", sourceType: "system", sourceLabel: "THA Library", internalId: 200 }],
      source: "nutrition-discovery" },
  },
  {
    label: "household-discovery", refType: "household_member", id: 3, title: "Sam",
    result: { scope: "household-search", query: "", totalCount: 1, householdName: "Home",
      results: [{ id: "household-member:3", displayName: "Sam", userId: 3, role: "adult", dietTypes: [], hardRestrictions: [], source: "household-discovery" }],
      source: "household-discovery" },
  },
];

for (const d of OTHER_DOMAINS) {
  const resp = buildNativeDiscoveryResponse(d.result) as NativeDiscoveryResponse;
  assert(resp != null, `${d.label}: produces a native response through the same builder`);
  assert(resp.entities.length === 1, `${d.label}: one canonical entity card`);
  assert(resp.entities[0].ref.type === d.refType && resp.entities[0].ref.id === d.id, `${d.label}: card links to canonical THA page (${d.refType}:${d.id})`);
  assert(resp.entities[0].title === d.title, `${d.label}: card carries the entity title`);
  assert(resp.actions.some(a => a.kind === "open") && resp.actions.some(a => a.kind === "view-all"), `${d.label}: follows THA action pattern (Open + View All)`);
  // Non-meal domains do not offer meal-only actions.
  assert(!resp.actions.some(a => a.kind === "add-to-planner"), `${d.label}: no meal-only actions leak into other domains`);
  assert(!JSON.stringify(resp).match(/https?:\/\//), `${d.label}: no external URL surfaced`);
}

// isDiscoveryResult guard
assert(isDiscoveryResult(MEAL_DISCOVERY_RESULT), "isDiscoveryResult recognises a discovery payload");
assert(!isDiscoveryResult({ scope: "detail", meal: {}, source: "meals" }), "isDiscoveryResult rejects a non-discovery (meals-read) payload");
assert(!isDiscoveryResult(null) && !isDiscoveryResult("x"), "isDiscoveryResult rejects null / non-object");

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n════════════════════════════════════════════════════════`);
console.log(`  INT36 native discovery: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error(`\n  Failures:\n${failures.map(f => `    ✗ ${f}`).join("\n")}`);
  process.exit(1);
}
console.log(`  ✅ All native discovery tests passed.`);

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
