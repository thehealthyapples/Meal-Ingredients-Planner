/**
 * test-intelligence-companion-enrichment.ts — INT41
 * =====================================================
 * Tests for Capability Enrichment: the Capability Enrichment Registry
 * (capability-registry.ts's ENRICHMENT table + CapabilityRegistry.getEnrichment /
 * IntelligencePlatform.getEnrichment), the deterministic companion-enrichment.ts
 * resolver, and the gateway wiring that attaches enrichment to a successful turn.
 *
 * Coverage:
 *   §1  buildEnrichment — registry resolution, verb scoping, dedup, cap, gating
 *   §2  Capability Enrichment Registry — capability-registry.ts real seed data
 *   §3  Gateway wiring — enrichment attached only on a successful turn
 *   §4  Honesty — no fabrication, deterministic, capability-owned (no duplication)
 *
 * Run: npx tsx server/tests/test-intelligence-companion-enrichment.ts
 */

import {
  buildEnrichment,
  type EnrichmentSource,
  type GetEnrichmentFn,
} from "../intelligence/conversation/companion-enrichment.js";
import { CapabilityRegistry } from "../intelligence/capability-registry.js";
import { intelligencePlatform } from "../intelligence/intelligence-platform.js";
import type { CapabilityEnrichment } from "../intelligence/types.js";
import {
  ConversationGateway,
  type HandleIntentFn,
} from "../intelligence/conversation/conversation-gateway.js";
import {
  InMemoryConversationStore,
  resetInMemoryIds,
} from "../intelligence/conversation/conversation-store.js";
import type { IIntentResolver, ResolvedIntent } from "../intelligence/intent-resolver.js";
import type { ILlmProvider, LlmRequest, LlmResponse } from "../intelligence/conversation/llm-provider.js";
import type { IntelligenceContext, IntentOutcome } from "../intelligence/types.js";

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
// Gateway stubs (mirror test-intelligence-companion-guidance.ts)
// ---------------------------------------------------------------------------

class StubLlm implements ILlmProvider {
  readonly modelName = "stub";
  readonly isAvailable = true;
  async complete(_request: LlmRequest): Promise<LlmResponse> {
    return { content: '{"text":"ok","entityRefs":[]}', model: this.modelName };
  }
}

class StubResolver implements IIntentResolver {
  constructor(private readonly results: ResolvedIntent[]) {}
  async resolve(): Promise<ResolvedIntent[]> {
    return this.results;
  }
}

function stubHandle(perCapability: Record<string, IntentOutcome>): HandleIntentFn {
  return async (intent) => {
    const o = perCapability[intent.capabilityId];
    if (o) return o;
    return { status: "gap", capabilityId: intent.capabilityId, verb: intent.verb, message: "no data" };
  };
}

function makeCtx(userId = 42): IntelligenceContext {
  return { role: "user", userId: String(userId), premium: false };
}

// ---------------------------------------------------------------------------
// INT41 — a small, self-contained fake Capability Enrichment Registry so §1 is
// isolated from the exact contents of the production capability-registry.ts
// seed (which is free to evolve). Mirrors the SHAPE of the real declarations.
// ---------------------------------------------------------------------------

const FAKE_ENRICHMENT: Record<string, CapabilityEnrichment> = {
  "nutrition-knowledge": {
    items: [
      { kind: "explanation", title: "Where these figures come from", body: "Per-serving, from source." },
      { kind: "educational", title: "Balance over any single food", body: "The whole day matters more.", appliesToVerbs: ["read"] },
    ],
  },
  meals: {
    items: [
      { kind: "recommendation", title: "Save often-cooked meals", body: "Easy to find again.", appliesToVerbs: ["search"] },
    ],
  },
  planner: {
    items: [], // a capability may declare enrichment with zero items — never fabricated padding
  },
  shopping: {
    items: [
      { kind: "insight", title: "A", body: "a" },
      { kind: "insight", title: "B", body: "b" },
      { kind: "insight", title: "C", body: "c" },
      { kind: "insight", title: "D", body: "d" },
    ],
  },
};
const fakeGetEnrichment: GetEnrichmentFn = (id) => FAKE_ENRICHMENT[id];

async function main(): Promise<void> {
  // ── §1 buildEnrichment ────────────────────────────────────────────────────
  section("§1 buildEnrichment — registry resolution, verb scoping, dedup, cap, gating");
  {
    const fromNutritionRead = buildEnrichment(
      [{ capabilityId: "nutrition-knowledge", verb: "read" }],
      fakeGetEnrichment,
    );
    assert(fromNutritionRead.length === 2, "nutrition-knowledge on 'read' yields both declared items (one unscoped, one scoped to 'read')");
    assert(fromNutritionRead.every((i) => i.sourceDomain === "nutrition"), "every item records its source domain");
    assert(fromNutritionRead.every((i) => i.sourceCapabilityId === "nutrition-knowledge"), "every item records its source capability id");

    const fromNutritionSearch = buildEnrichment(
      [{ capabilityId: "nutrition-knowledge", verb: "search" }],
      fakeGetEnrichment,
    );
    assert(fromNutritionSearch.length === 1, "nutrition-knowledge on 'search' yields only the unscoped item — the 'read'-scoped item is excluded");
    assert(fromNutritionSearch[0]?.title === "Where these figures come from", "the unscoped item is the one that survives verb-scoping");

    const mealsWrongVerb = buildEnrichment([{ capabilityId: "meals", verb: "read" }], fakeGetEnrichment);
    assert(mealsWrongVerb.length === 0, "an item scoped to 'search' is not offered when the capability answered with 'read'");

    const mealsRightVerb = buildEnrichment([{ capabilityId: "meals", verb: "search" }], fakeGetEnrichment);
    assert(mealsRightVerb.length === 1, "the same item IS offered when the capability answered with the scoped verb");

    const dedup = buildEnrichment(
      [
        { capabilityId: "nutrition-knowledge", verb: "read" },
        { capabilityId: "nutrition-knowledge", verb: "search" },
      ],
      fakeGetEnrichment,
    );
    assert(dedup.length === 2, "the same source capability is only ever consulted once, even if listed twice (first verb wins)");

    const emptyDeclared = buildEnrichment([{ capabilityId: "planner", verb: "read" }], fakeGetEnrichment);
    assert(emptyDeclared.length === 0, "a capability that declares enrichment with zero items yields nothing — never fabricated padding");

    const undeclared = buildEnrichment([{ capabilityId: "pantry", verb: "read" }], fakeGetEnrichment);
    assert(undeclared.length === 0, "a capability with no ENRICHMENT entry at all yields nothing, not a throw");

    const unknownDomain = buildEnrichment([{ capabilityId: "not-a-real-capability", verb: "read" }], fakeGetEnrichment);
    assert(unknownDomain.length === 0, "a capability id with no Companion Card domain mapping is silently skipped");

    const capped = buildEnrichment([{ capabilityId: "shopping", verb: "read" }], fakeGetEnrichment);
    assert(capped.length === 3, "output is capped at MAX_ENRICHMENT_ITEMS(3) even when a capability declares more");
    assert(capped.map((i) => i.title).join("") === "ABC", "capped items are taken in declared order, not shuffled");

    // CONV1 BEH-8 — both modules now read the Capability Registry that owns the
    // domain, rather than sharing one module's private table. No duplicated
    // domain vocabulary, and no bridge to fall behind (Principle 7).
    assert(new CapabilityRegistry().getCompanionDomain("nutrition-knowledge") === "nutrition", "the Companion domain is read from the registry that owns it — no second table");

    // BEH-8 regression — the six enrichment items the retired table killed. Each
    // of these capabilities registered enrichment, was tested and documented, and
    // was silently unreachable because a hand-maintained list in another module
    // had never heard of it.
    const beh8Registry = new CapabilityRegistry();
    for (const [id, expectedItems] of [["food-intelligence", 3], ["evidence-learning", 2], ["opportunity-delivery", 1]] as const) {
      const declared = beh8Registry.getEnrichment(id)?.items.length ?? 0;
      assert(declared === expectedItems, `${id} declares ${expectedItems} enrichment item(s)`);
      const reachable = buildEnrichment(
        [{ capabilityId: id, verb: "read" }],
        (cid) => beh8Registry.getEnrichment(cid),
        (cid) => beh8Registry.getCompanionDomain(cid),
      );
      assert(reachable.length > 0, `${id}'s registered enrichment reaches the Companion (BEH-8 — it did not before)`);
      assert(reachable.every((i) => i.sourceDomain === "platform"), `${id} attributes as platform — an explanation of how the platform reasons is not a fact about a room`);
    }

    const multiSource = buildEnrichment(
      [
        { capabilityId: "meals", verb: "search" },
        { capabilityId: "nutrition-knowledge", verb: "read" },
      ],
      fakeGetEnrichment,
    );
    assert(multiSource[0]?.sourceCapabilityId === "meals" && multiSource.length === 3, "items are appended in source order across multiple capabilities, respecting the overall cap");
  }

  // ── §2 Capability Enrichment Registry — real seed data ───────────────────
  section("§2 Capability Enrichment Registry — capability-registry.ts real seed data");
  {
    const registry = new CapabilityRegistry();
    const nutrition = registry.getEnrichment("nutrition-knowledge");
    assert(nutrition !== undefined && nutrition.items.length > 0, "nutrition-knowledge declares real enrichment content in the production seed");
    assert(nutrition!.items.every((i) => typeof i.title === "string" && i.title.length > 0 && typeof i.body === "string" && i.body.length > 0), "every declared item has a non-empty title and body");

    assert(registry.getEnrichment("administration") === undefined, "a capability with no declared enrichment returns undefined, not a fabricated default");
    assert(registry.getEnrichment("developer") === undefined, "the isolated developer-plane capability declares no enrichment either");

    assert(intelligencePlatform.getEnrichment("meals") !== undefined, "IntelligencePlatform.getEnrichment delegates to the registry (same accessor pattern as getGuidance)");
  }

  // ── §3 Gateway wiring ─────────────────────────────────────────────────────
  section("§3 Gateway wiring — enrichment attached only on a successful turn");
  {
    resetInMemoryIds();
    const nutritionRead: ResolvedIntent = { capability: "nutrition-knowledge", verb: "read", parameters: {}, confidence: 1 };
    const gateway = new ConversationGateway(
      new InMemoryConversationStore(),
      new StubLlm(),
      new StubResolver([nutritionRead]),
      stubHandle({ "nutrition-knowledge": { status: "ok", capabilityId: "nutrition-knowledge", verb: "read", message: "ok", result: { foods: ["broccoli"] } } }),
    );
    const result = await gateway.processUserTurn(1, "what is broccoli good for", "floating", {}, makeCtx());
    assert(result.enrichment.length > 0, "a successful turn grounded in nutrition data carries enrichment items");
    assert(result.enrichment.every((e) => e.sourceDomain === "nutrition"), "enrichment is sourced from the domain that actually succeeded, same as guidance");

    // Unsuccessful (resolver miss) turn — no enrichment.
    resetInMemoryIds();
    const miss: ResolvedIntent = { capability: "planner", verb: "read", parameters: {}, confidence: 0, gap: { kind: "unknown" } };
    const gateway2 = new ConversationGateway(
      new InMemoryConversationStore(),
      new StubLlm(),
      new StubResolver([miss]),
      stubHandle({}),
    );
    const failResult = await gateway2.processUserTurn(1, "wibble flurble", "floating", {}, makeCtx());
    assert(failResult.enrichment.length === 0, "an unsuccessful (no-route) turn carries no enrichment — the honest-gap path never fabricates content");

    // A capability that answered but declares no enrichment (e.g. household-discovery)
    // succeeds with zero enrichment — never a fabricated item for an undeclared capability.
    resetInMemoryIds();
    const pantryRead: ResolvedIntent = { capability: "pantry", verb: "read", parameters: {}, confidence: 1 };
    const gateway3 = new ConversationGateway(
      new InMemoryConversationStore(),
      new StubLlm(),
      new StubResolver([pantryRead]),
      stubHandle({ pantry: { status: "ok", capabilityId: "pantry", verb: "read", message: "ok", result: { items: ["flour"] } } }),
    );
    const pantryResult = await gateway3.processUserTurn(1, "what's in my pantry", "floating", {}, makeCtx());
    assert(Array.isArray(pantryResult.enrichment), "enrichment is always an array, even when empty");
  }

  // ── §4 Honesty — no fabrication, deterministic, no duplicated ownership ──
  section("§4 Honesty — deterministic, capability-owned, no fabrication");
  {
    const first = buildEnrichment([{ capabilityId: "nutrition-knowledge", verb: "read" }], fakeGetEnrichment);
    const second = buildEnrichment([{ capabilityId: "nutrition-knowledge", verb: "read" }], fakeGetEnrichment);
    assert(JSON.stringify(first) === JSON.stringify(second), "buildEnrichment is a pure function — identical input yields byte-identical output, no live/random computation");

    // companion-enrichment.ts must hold no content of its own — every title/body
    // it can ever emit traces back to an item declared in the (injected) registry.
    const emptyRegistry: GetEnrichmentFn = () => undefined;
    const noneFromEmptyRegistry = buildEnrichment(
      [{ capabilityId: "nutrition-knowledge", verb: "read" }, { capabilityId: "meals", verb: "search" }],
      emptyRegistry,
    );
    assert(noneFromEmptyRegistry.length === 0, "with no registry content declared anywhere, the module fabricates nothing of its own");
  }

  // ---------------------------------------------------------------------------
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFailed assertions:");
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
