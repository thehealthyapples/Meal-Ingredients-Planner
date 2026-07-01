/**
 * test-intelligence-nutrition-knowledge-binding.ts (INT4)
 * ======================================================
 * Verifies the THIRD live capability binding: the read-only Nutrition / Knowledge
 * capability. It proves the reusable Port → Handler → Binding pattern (shown for the Planner
 * in INT2 and the Shopping binding in INT3) against a third, independent owner, end-to-end —
 *
 *   intent → capability registry → permission check → nutrition/knowledge (owner) → response
 *
 * — WITHOUT a live database, by injecting an in-memory owner (NutritionKnowledgeReadPort)
 * that stands in for the source-gated registry. The same handler in production is injected
 * with the real owner; the contract under test is identical.
 *
 * Covered: capability lookup (three live capabilities), permission validation, handler
 * invocation, owner delegation, known food read, unknown slug handling, source-gated
 * explanation, no fabricated benefits (unlinked benefit → gap), unsupported intent handling,
 * honest-gap behaviour (analyse/compare/report/unknown scope/empty search), and the absence
 * of any write path.
 *
 * Run with: npx tsx server/tests/test-intelligence-nutrition-knowledge-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  createNutritionKnowledgeReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type NutritionKnowledgeReadPort,
} from "../intelligence/index.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ---------------------------------------------------------------------------
// In-memory owner (stands in for the source-gated nutrition-knowledge-registry).
// Every shape mirrors the registry's display-safe helpers — the internal evidence /
// confidence / source signals are already stripped by the owner before this point.
// ---------------------------------------------------------------------------

const benefitObj = (slug: string, name: string, description: string | null) =>
  ({ slug, name, description, icon: "leaf" }) as any; // full KnowledgeHealthBenefit row — only display fields used

const calls: string[] = [];

function makePort(): NutritionKnowledgeReadPort {
  return {
    getFoodDetailView: async (slug) => {
      calls.push(`getFoodDetailView(${slug})`);
      if (slug !== "broccoli") return undefined; // unknown food → owner returns undefined
      return {
        food: {
          slug: "broccoli",
          name: "Broccoli",
          category: "vegetables",
          subcategory: "brassica",
          description: "A green cruciferous vegetable.",
          aliases: ["calabrese"],
          commonForms: ["floret"],
          storageGuidance: "Refrigerate.",
          seasonality: "autumn",
          imageUrl: null,
        },
        benefits: [{ slug: "heart-health", name: "Heart health", icon: "heart" }],
        nutrients: [{ slug: "vitamin-c", name: "Vitamin C", amount: "high" }],
      };
    },
    getNutrientDetailView: async (slug) => {
      calls.push(`getNutrientDetailView(${slug})`);
      if (slug !== "vitamin-c") return undefined;
      return {
        nutrient: { slug: "vitamin-c", name: "Vitamin C", description: "An antioxidant vitamin.", category: "vitamin" },
        foods: [{ slug: "broccoli", name: "Broccoli", category: "vegetables", subcategory: "brassica", description: null }],
        benefits: [{ slug: "immune-support", name: "Immune support", icon: "shield" }],
      };
    },
    getBenefitDetailView: async (slug) => {
      calls.push(`getBenefitDetailView(${slug})`);
      if (slug !== "heart-health") return undefined;
      return {
        benefit: { slug: "heart-health", name: "Heart health", description: "Supports cardiovascular health.", icon: "heart" },
        foods: [{ slug: "broccoli", name: "Broccoli", category: "vegetables", subcategory: "brassica", description: null }],
      };
    },
    getFoodBenefitsForDisplay: async (foodSlug) => {
      calls.push(`getFoodBenefitsForDisplay(${foodSlug})`);
      if (foodSlug !== "broccoli") return [];
      return [{ benefit: benefitObj("heart-health", "Heart health", "Supports cardiovascular health."), ranking: 1, source: "EFSA" }];
    },
    searchKnowledgeRegistry: async (query) => {
      calls.push(`searchKnowledgeRegistry(${query})`);
      return {
        query,
        foods: [{ slug: "broccoli", name: "Broccoli", category: "vegetables", subcategory: "brassica", description: null }],
        nutrients: [],
        benefits: [],
      };
    },
    listFoodCategories: async () => {
      calls.push("listFoodCategories()");
      return [{ category: "vegetables", count: 1 }];
    },
    listFoodCards: async (category) => {
      calls.push(`listFoodCards(${category ?? ""})`);
      return [{ slug: "broccoli", name: "Broccoli", category: "vegetables", subcategory: "brassica", description: null }];
    },
  };
}

const user: IntelligenceContext = { role: "user", userId: "1", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

function platformWithFakeKnowledge(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("nutrition-knowledge", createNutritionKnowledgeReadHandler(async () => makePort()));
  return p;
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("Capability lookup — Nutrition / Knowledge is the third live capability");
  assert(
    intelligencePlatform.getCapability("nutrition-knowledge")!.availability === "available",
    "canonical singleton: nutrition-knowledge capability is 'available' (handler bound)",
    intelligencePlatform.getCapability("nutrition-knowledge")!.availability,
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(live.length === 12, "exactly TWELVE capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser + meal-discovery) — scope lock (updated by INT26)", String(live.length));
  assert(
    live.some((c) => c.id === "planner") && live.some((c) => c.id === "shopping") && live.some((c) => c.id === "nutrition-knowledge") && live.some((c) => c.id === "pantry") && live.some((c) => c.id === "diary") && live.some((c) => c.id === "profile") && live.some((c) => c.id === "household") && live.some((c) => c.id === "partners") && live.some((c) => c.id === "meals") && live.some((c) => c.id === "templates"),
    "the ten live capabilities are planner, shopping, nutrition-knowledge, pantry, diary, profile, household, partners, meals and templates",
  );
  assert(
    intelligencePlatform.getCapability("nutrition-knowledge")!.capabilityClass === "read-only",
    "nutrition-knowledge is a read-only capability (no write/confirmation surface)",
  );

  const platform = platformWithFakeKnowledge();
  assert(platform.getCapability("nutrition-knowledge")!.availability === "available", "test platform: nutrition-knowledge bound → available");

  // -------------------------------------------------------------------------
  section("Handler invocation + owner delegation (known food read)");
  calls.length = 0;
  const food = await platform.handle({ verb: "read", capabilityId: "nutrition-knowledge", parameters: { scope: "food", slug: "broccoli" } }, user);
  assert(food.status === "ok", "read food → ok", food.status);
  const fr = food.result as any;
  assert(fr?.scope === "food" && fr?.name === "Broccoli", "returns the owner's food detail", String(fr?.name));
  assert(fr?.benefits?.[0]?.slug === "heart-health" && fr?.nutrients?.[0]?.slug === "vitamin-c", "display-safe benefits + nutrients surfaced");
  assert(fr?.source === "nutrition-knowledge-registry", "result is attributed to the source-gated owner");
  assert(calls.some((c) => c === "getFoodDetailView(broccoli)"), "delegated to the knowledge owner (no logic in the platform)");
  // The internal evidence/confidence/source signals are never present on the projection.
  assert(!("evidenceStrength" in (fr?.benefits?.[0] ?? {})) && !("source" in (fr?.benefits?.[0] ?? {})), "no internal evidence/source signal leaks into the benefit view");

  // -------------------------------------------------------------------------
  section("Other read scopes — nutrient, benefit, categories, foods");
  const nutrient = await platform.handle({ verb: "read", capabilityId: "nutrition-knowledge", parameters: { scope: "nutrient", slug: "vitamin-c" } }, user);
  assert(nutrient.status === "ok" && (nutrient.result as any)?.name === "Vitamin C", "read nutrient → ok", nutrient.status);

  const benefit = await platform.handle({ verb: "read", capabilityId: "nutrition-knowledge", parameters: { scope: "benefit", slug: "heart-health" } }, user);
  assert(benefit.status === "ok" && (benefit.result as any)?.foods?.[0]?.slug === "broccoli", "read benefit → ok (supporting foods listed)", benefit.status);

  const categories = await platform.handle({ verb: "read", capabilityId: "nutrition-knowledge", parameters: { scope: "categories" } }, user);
  assert(categories.status === "ok" && (categories.result as any)?.categories?.[0]?.category === "vegetables", "read categories → ok", categories.status);

  const foods = await platform.handle({ verb: "read", capabilityId: "nutrition-knowledge", parameters: { scope: "foods", category: "vegetables" } }, user);
  assert(foods.status === "ok" && (foods.result as any)?.foodCount === 1, "read foods (by category) → ok", foods.status);

  // -------------------------------------------------------------------------
  section("Search — delegated unified search");
  const search = await platform.handle({ verb: "search", capabilityId: "nutrition-knowledge", parameters: { query: "brocc" } }, user);
  assert(search.status === "ok" && (search.result as any)?.foods?.[0]?.name === "Broccoli", "search → ok with owner results", search.status);

  // -------------------------------------------------------------------------
  section("Source-gated explanation — owner editorial wording only");
  const explainPair = await platform.handle({ verb: "explain", capabilityId: "nutrition-knowledge", parameters: { foodSlug: "broccoli", benefitSlug: "heart-health" } }, user);
  assert(explainPair.status === "ok", "explain (food, linked benefit) → ok", explainPair.status);
  const ep = explainPair.result as any;
  assert(ep?.scope === "food-benefit" && ep?.benefits?.[0]?.description === "Supports cardiovascular health.", "grounded benefit description surfaced, not fabricated");
  assert(ep?.source === "nutrition-knowledge-registry", "explanation is attributed to the source-gated owner");

  const explainFood = await platform.handle({ verb: "explain", capabilityId: "nutrition-knowledge", parameters: { foodSlug: "broccoli" } }, user);
  assert(explainFood.status === "ok" && (explainFood.result as any)?.scope === "food-benefits", "explain a food's benefits → ok", explainFood.status);

  const explainBenefit = await platform.handle({ verb: "explain", capabilityId: "nutrition-knowledge", parameters: { benefitSlug: "heart-health" } }, user);
  assert(explainBenefit.status === "ok" && (explainBenefit.result as any)?.scope === "benefit", "explain a benefit alone → ok", explainBenefit.status);

  // -------------------------------------------------------------------------
  section("No fabricated benefits — unlinked (food, benefit) → honest gap");
  const unlinked = await platform.handle({ verb: "explain", capabilityId: "nutrition-knowledge", parameters: { foodSlug: "broccoli", benefitSlug: "cures-everything" } }, user);
  assert(unlinked.status === "gap", "explain an UNLINKED benefit → honest gap (no fabricated claim)", unlinked.status);
  assert(/will not fabricate a health benefit|unsupported food↔benefit/.test(unlinked.message), "gap message refuses to fabricate an unsupported food↔benefit claim");

  // -------------------------------------------------------------------------
  section("Unknown slug handling — never an invented fact");
  const unknownFood = await platform.handle({ verb: "read", capabilityId: "nutrition-knowledge", parameters: { scope: "food", slug: "unobtainium" } }, user);
  assert(unknownFood.status === "gap", "unknown food slug → honest gap", unknownFood.status);
  assert(/will not infer or fabricate/.test(unknownFood.message), "unknown-food gap refuses to fabricate facts");

  const unknownBenefit = await platform.handle({ verb: "read", capabilityId: "nutrition-knowledge", parameters: { scope: "benefit", slug: "nope" } }, user);
  assert(unknownBenefit.status === "gap", "unknown benefit slug → honest gap", unknownBenefit.status);

  // -------------------------------------------------------------------------
  section("Permission validation — public general knowledge (mirrors owner's access rules)");
  // General food knowledge is public on the owner; the platform's capability gate (role ≥ user,
  // public class) still applies. An anonymous web context still resolves to role 'user'.
  const anonRead = await platform.handle({ verb: "read", capabilityId: "nutrition-knowledge", parameters: { scope: "categories" } }, anon);
  assert(anonRead.status === "ok", "general food knowledge is public (no own-data surface) → ok", anonRead.status);

  // -------------------------------------------------------------------------
  section("Unsupported intent + honest gaps (no fabrication)");
  // 'add' is not in the nutrition-knowledge allow-list → engine-level unsupported_intent.
  const add = await platform.handle({ verb: "add", capabilityId: "nutrition-knowledge", parameters: {} }, user);
  assert(add.status === "unsupported_intent", "write verb (add) not in allow-list → unsupported_intent", add.status);

  const badScope = await platform.handle({ verb: "read", capabilityId: "nutrition-knowledge", parameters: { scope: "everything" } }, user);
  assert(badScope.status === "gap", "read with an unknown scope → honest gap", badScope.status);

  const emptySearch = await platform.handle({ verb: "search", capabilityId: "nutrition-knowledge", parameters: { query: "  " } }, user);
  assert(emptySearch.status === "gap", "empty search query → honest gap", emptySearch.status);

  // analyse / compare / report are in the allow-list but have no safe grounded owner read here.
  const analyse = await platform.handle({ verb: "analyse", capabilityId: "nutrition-knowledge", parameters: {} }, user);
  assert(analyse.status === "gap", "analyse → honest gap (no grounded analysis read; not fabricated)", analyse.status);
  assert(/will not compute or fabricate/.test(analyse.message), "analyse gap refuses to fabricate an analysis");

  const compare = await platform.handle({ verb: "compare", capabilityId: "nutrition-knowledge", parameters: { a: "broccoli", b: "kale" } }, user);
  assert(compare.status === "gap", "compare → honest gap (owner exposes no grounded comparison)", compare.status);
  assert(/will not fabricate a comparison/.test(compare.message), "compare gap refuses to fabricate a comparison/judgement");

  const report = await platform.handle({ verb: "report", capabilityId: "nutrition-knowledge", parameters: {} }, user);
  assert(report.status === "gap", "report (user-specific nutrition summary) → honest gap (diary-linked, out of scope)", report.status);

  // -------------------------------------------------------------------------
  section("Read-only enforcement — no write path exists in the binding");
  // Every supported nutrition-knowledge verb is read-only, so none requires confirmation and
  // none mutates. Confirm no verb produces a write/confirmation outcome.
  const readNoConfirm = await platform.handle({ verb: "read", capabilityId: "nutrition-knowledge", parameters: { scope: "categories" } }, user);
  assert(readNoConfirm.confirmation === "none" || readNoConfirm.confirmation === undefined, "read-only verbs never require confirmation (no write path)");
  // The handler exposes no mutating method; verbs outside the allow-list never reach a write.
  const del = await platform.handle({ verb: "delete", capabilityId: "nutrition-knowledge", parameters: {} }, user);
  assert(del.status === "unsupported_intent", "delete is not supported → unsupported_intent (no delete path)", del.status);

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT4 Nutrition / Knowledge read-only binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
