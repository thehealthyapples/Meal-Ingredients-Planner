/**
 * test-intent-resolver.ts — INT24
 * ================================
 * Unit tests for the Canonical Intent Engine (PatternIntentResolver).
 * No database, no OpenAI API, no platform calls required.
 *
 * Coverage:
 *   §1  Broccoli → nutrition-knowledge explain (INT22 root-cause fix)
 *   §2  Sleep → nutrition-knowledge search (benefit→foods path)
 *   §3  All 11 capabilities routed by the resolver
 *   §4  Write intents: detectWriteIntent fires BEFORE resolver
 *   §5  Confidence ordering and cap at 4
 *   §6  Surface-based primary capability routing
 *   §7  Entity slug normalisation
 *
 * Run: npx tsx server/tests/test-intent-resolver.ts
 */

import { PatternIntentResolver } from "../intelligence/pattern-intent-resolver.js";
import { detectWriteIntent } from "../intelligence/conversation/conversation-gateway.js";
import type { IntentResolutionHints, ResolvedIntent } from "../intelligence/intent-resolver.js";

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
// Helpers
// ---------------------------------------------------------------------------

const resolver = new PatternIntentResolver();

function hints(
  surface: IntentResolutionHints["surface"] = "floating",
  overrides: Partial<IntentResolutionHints> = {},
): IntentResolutionHints {
  return {
    surface,
    temporalAnchor: "2026-07-01",
    ...overrides,
  };
}

function hasCapability(results: ResolvedIntent[], cap: string): boolean {
  return results.some(r => r.capability === cap);
}

function firstWith(results: ResolvedIntent[], cap: string): ResolvedIntent | undefined {
  return results.find(r => r.capability === cap);
}

function topResult(results: ResolvedIntent[]): ResolvedIntent {
  return results[0];
}

async function resolve(
  utterance: string,
  surface: IntentResolutionHints["surface"] = "floating",
  overrides: Partial<IntentResolutionHints> = {},
): Promise<ResolvedIntent[]> {
  return resolver.resolve(utterance, hints(surface, overrides));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {

  // ── §1 — Broccoli → nutrition-knowledge explain (INT22 fix) ──────────────
  section("Broccoli: nutrition-knowledge explain (INT22 root-cause fix)");

  {
    const r = await resolve("What is broccoli good for?");
    const top = topResult(r);
    assert(top.capability === "nutrition-knowledge", "broccoli: top capability is nutrition-knowledge");
    assert(top.verb === "explain",                   "broccoli: verb is explain (not read)");
    assert(
      (top.parameters.foodSlug as string) === "broccoli",
      "broccoli: foodSlug is 'broccoli'",
    );
    assert(top.confidence >= 0.88,                  "broccoli: confidence >= 0.88");
  }

  {
    const r = await resolve("What are the benefits of broccoli?");
    const top = topResult(r);
    assert(top.capability === "nutrition-knowledge", "benefits-of: capability is nutrition-knowledge");
    assert(top.verb === "explain",                   "benefits-of: verb is explain");
    assert(
      (top.parameters.foodSlug as string) === "broccoli",
      "benefits-of: foodSlug is 'broccoli'",
    );
  }

  {
    const r = await resolve("Benefits of kale");
    const top = topResult(r);
    assert(top.capability === "nutrition-knowledge", "benefits-of-kale: capability is nutrition-knowledge");
    assert(top.verb === "explain",                   "benefits-of-kale: verb is explain");
    assert(
      (top.parameters.foodSlug as string) === "kale",
      "benefits-of-kale: foodSlug is 'kale'",
    );
  }

  {
    const r = await resolve("Is broccoli good for me?");
    const top = topResult(r);
    assert(top.capability === "nutrition-knowledge", "is-good-for-me: capability is nutrition-knowledge");
    assert(top.verb === "explain",                   "is-good-for-me: verb is explain");
    assert(
      (top.parameters.foodSlug as string) === "broccoli",
      "is-good-for-me: foodSlug is 'broccoli'",
    );
  }

  {
    const r = await resolve("Why is broccoli healthy?");
    const top = topResult(r);
    assert(top.capability === "nutrition-knowledge", "why-healthy: capability is nutrition-knowledge");
    assert(top.verb === "explain",                   "why-healthy: verb is explain");
  }

  {
    const r = await resolve("What does salmon do for your body?");
    const top = topResult(r);
    assert(top.capability === "nutrition-knowledge", "what-does-do-for: capability is nutrition-knowledge");
    assert(top.verb === "explain",                   "what-does-do-for: verb is explain");
    assert(
      (top.parameters.foodSlug as string) === "salmon",
      "what-does-do-for: foodSlug is 'salmon'",
    );
  }

  // ── §2 — Sleep → nutrition-knowledge search (benefit→foods path) ──────────
  section("Sleep: nutrition-knowledge search (benefit→foods path)");

  {
    const r = await resolve("Tell me 5 foods that help with sleep");
    const top = topResult(r);
    assert(top.capability === "nutrition-knowledge", "sleep5: capability is nutrition-knowledge");
    assert(top.verb === "search",                    "sleep5: verb is search");
    assert(
      (top.parameters.query as string) === "sleep",
      "sleep5: query is 'sleep'",
    );
    assert(top.termQuery === "sleep",                "sleep5: termQuery is 'sleep'");
    assert(top.confidence >= 0.80,                   "sleep5: confidence >= 0.80");
  }

  {
    const r = await resolve("Foods that help with sleep");
    const top = topResult(r);
    assert(top.capability === "nutrition-knowledge", "foods-help-with-sleep: capability is nutrition-knowledge");
    assert(top.verb === "search",                    "foods-help-with-sleep: verb is search");
    assert(
      (top.parameters.query as string) === "sleep",
      "foods-help-with-sleep: query is 'sleep'",
    );
  }

  {
    const r = await resolve("What helps with sleep?");
    assert(hasCapability(r, "nutrition-knowledge"),  "what-helps-sleep: includes nutrition-knowledge");
    const n = firstWith(r, "nutrition-knowledge")!;
    assert(n.verb === "search",                      "what-helps-sleep: verb is search");
    assert(
      (n.parameters.query as string) === "sleep",
      "what-helps-sleep: query is 'sleep'",
    );
  }

  {
    const r = await resolve("10 foods that help with digestion");
    const top = topResult(r);
    assert(top.capability === "nutrition-knowledge", "numbered-foods: capability is nutrition-knowledge");
    assert(top.verb === "search",                    "numbered-foods: verb is search");
    assert(
      (top.parameters.query as string) === "digestion",
      "numbered-foods: query is 'digestion'",
    );
  }

  {
    const r = await resolve("Foods good for immunity");
    assert(hasCapability(r, "nutrition-knowledge"),  "foods-good-for: includes nutrition-knowledge");
    const n = firstWith(r, "nutrition-knowledge")!;
    assert(n.verb === "search",                      "foods-good-for: verb is search");
    assert(
      (n.parameters.query as string) === "immunity",
      "foods-good-for: query is 'immunity'",
    );
  }

  // ── §3 — All 11 capabilities routed ──────────────────────────────────────
  section("All 11 capabilities: routing coverage");

  // 1. planner
  {
    const r = await resolve("What meals do I have this week?", "planner");
    assert(hasCapability(r, "planner"),  "planner: query on planner surface routes to planner");
    const p = firstWith(r, "planner")!;
    assert(p.verb === "read",            "planner: verb is read");
  }

  {
    const r = await resolve("what meals do I have this week?", "floating");
    assert(hasCapability(r, "planner"),  "planner keyword: floating + 'meals this week' → planner");
  }

  // 2. shopping
  {
    const r = await resolve("show me my shopping list", "shopping");
    assert(hasCapability(r, "shopping"), "shopping: query on shopping surface routes to shopping");
    const s = firstWith(r, "shopping")!;
    assert(s.verb === "read",            "shopping: verb is read");
  }

  {
    const r = await resolve("what's in my basket?", "floating");
    assert(hasCapability(r, "shopping"), "shopping keyword: 'basket' → shopping");
  }

  // 3. nutrition-knowledge
  {
    const r = await resolve("what vitamins are good for energy?", "floating");
    assert(hasCapability(r, "nutrition-knowledge"), "nutrition-knowledge keyword: 'vitamins' → nutrition-knowledge");
  }

  {
    const r = await resolve("tell me about nutrients in spinach", "floating");
    assert(hasCapability(r, "nutrition-knowledge"), "nutrition-knowledge keyword: 'nutrients' → nutrition-knowledge");
  }

  // 4. pantry
  {
    const r = await resolve("what's in my pantry?", "floating");
    assert(hasCapability(r, "pantry"),  "pantry: 'what's in my pantry' → pantry");
    const p = firstWith(r, "pantry")!;
    assert(p.verb === "read",           "pantry: verb is read");
    assert(p.parameters.scope === "list", "pantry: scope is list");
  }

  {
    const r = await resolve("what's in my fridge?", "floating");
    assert(hasCapability(r, "pantry"),  "pantry: 'fridge' → pantry");
  }

  // 5. diary
  {
    const r = await resolve("what did I eat today?", "diary");
    assert(hasCapability(r, "diary"),   "diary: query on diary surface routes to diary");
    const d = firstWith(r, "diary")!;
    assert(d.verb === "read",           "diary: verb is read");
  }

  {
    const r = await resolve("my food diary", "floating");
    assert(hasCapability(r, "diary"),   "diary: 'my food diary' → diary");
  }

  // 6. profile — always included
  {
    const r = await resolve("hi there", "floating");
    assert(hasCapability(r, "profile"), "profile: always included for neutral utterance");
    const p = firstWith(r, "profile")!;
    assert(p.verb === "read",           "profile: verb is read");
  }

  {
    const r = await resolve("what is broccoli good for?", "floating");
    assert(hasCapability(r, "profile"), "profile: included alongside nutrition-knowledge");
  }

  // 7. household
  {
    const r = await resolve("who's in my household?", "floating");
    assert(hasCapability(r, "household"), "household: 'who's in my household' → household");
    const h = firstWith(r, "household")!;
    assert(h.verb === "read",             "household: verb is read");
    assert(h.parameters.scope === "household", "household: scope is household");
  }

  // 8. partners
  {
    const r = await resolve("which supermarkets does THA support?", "floating");
    assert(hasCapability(r, "partners"), "partners: 'supermarkets' → partners");
    const p = firstWith(r, "partners")!;
    assert(p.verb === "read",            "partners: verb is read");
  }

  {
    const r = await resolve("what retailers can I export to?", "floating");
    assert(hasCapability(r, "partners"), "partners: 'retailers' → partners");
  }

  // 9. meals
  {
    const r = await resolve("find me a recipe for chicken curry", "floating");
    assert(hasCapability(r, "meals"),    "meals: 'find recipe' → meals");
    const m = firstWith(r, "meals")!;
    assert(m.verb === "search",          "meals: find-recipe verb is search");
    assert(
      (m.parameters.query as string) === "chicken curry",
      "meals: query is 'chicken curry'",
    );
  }

  // INT25B F1 — noun-last phrasing
  {
    const r = await resolve("Find me a chicken curry recipe", "floating");
    assert(hasCapability(r, "meals"), "meals (INT25B): 'find me a X recipe' → meals");
    const m = firstWith(r, "meals")!;
    assert(m.verb === "search", "meals (INT25B): noun-last verb is search");
    assert(
      (m.parameters.query as string) === "chicken curry",
      "meals (INT25B): noun-last query is 'chicken curry'",
    );
  }

  {
    const r = await resolve("Show me a pasta recipe", "floating");
    assert(hasCapability(r, "meals"), "meals (INT25B): 'show me a X recipe' → meals");
    const m = firstWith(r, "meals")!;
    assert(m.verb === "search", "meals (INT25B): show-me-recipe verb is search");
    assert(
      (m.parameters.query as string) === "pasta",
      "meals (INT25B): show-me-recipe query is 'pasta'",
    );
  }

  {
    const r = await resolve("I want a fish pie recipe", "floating");
    assert(hasCapability(r, "meals"), "meals (INT25B): 'I want a X recipe' → meals");
    const m = firstWith(r, "meals")!;
    assert(m.verb === "search", "meals (INT25B): i-want-recipe verb is search");
    assert(
      (m.parameters.query as string) === "fish pie",
      "meals (INT25B): i-want-recipe query is 'fish pie'",
    );
  }

  {
    const r = await resolve("What can I cook with chickpeas?", "floating");
    assert(hasCapability(r, "meals"), "meals (INT25B): 'cook with X' → meals");
    const m = firstWith(r, "meals")!;
    assert(m.verb === "search", "meals (INT25B): cook-with verb is search");
    assert(
      (m.parameters.query as string) === "chickpeas",
      "meals (INT25B): cook-with query is 'chickpeas'",
    );
  }

  {
    const r = await resolve("Give me something with salmon", "floating");
    assert(hasCapability(r, "meals"), "meals (INT25B): 'something with X' → meals");
    const m = firstWith(r, "meals")!;
    assert(m.verb === "search", "meals (INT25B): something-with verb is search");
    assert(
      (m.parameters.query as string) === "salmon",
      "meals (INT25B): something-with query is 'salmon'",
    );
  }

  {
    const r = await resolve("what meals do I have?", "meals");
    assert(hasCapability(r, "meals"),    "meals: meals surface routes to meals");
  }

  // 10. templates
  {
    const r = await resolve("do I have any plan templates?", "floating");
    assert(hasCapability(r, "templates"), "templates: 'template' keyword → templates");
    const t = firstWith(r, "templates")!;
    assert(t.verb === "read",             "templates: verb is read");
  }

  {
    const r = await resolve("show me my meal plan templates", "floating");
    assert(hasCapability(r, "templates"), "templates: 'meal plan templates' → templates");
  }

  // 11. analyser
  {
    const r = await resolve("what additives should I watch out for?", "floating");
    assert(hasCapability(r, "analyser"), "analyser: 'additives' → analyser");
    const a = firstWith(r, "analyser")!;
    assert(a.verb === "read",            "analyser: verb is read");
    assert(a.parameters.scope === "additives", "analyser: scope is additives");
  }

  {
    const r = await resolve("what UPF classification does it have?", "floating");
    assert(hasCapability(r, "analyser"), "analyser: 'UPF' → analyser");
  }

  {
    const r = await resolve("tell me about additives", "analyser");
    assert(hasCapability(r, "analyser"), "analyser: analyser surface always includes analyser");
    assert(hasCapability(r, "profile"),  "analyser surface: profile always present");
  }

  {
    const r = await resolve("show me my templates", "templates");
    assert(hasCapability(r, "templates"), "templates: templates surface always includes templates");
    assert(hasCapability(r, "profile"),   "templates surface: profile always present");
  }

  // ── §4 — Write intents: detectWriteIntent fires BEFORE resolver ───────────
  section("Write intents: guard fires before resolver (gateway boundary)");

  // These tests confirm detectWriteIntent intercepts before the resolver is called.
  // The resolver itself has no write-intent knowledge — the gateway guards it.
  {
    const writeUtterances = [
      "add salmon to my shopping list",
      "delete Monday's dinner",
      "move Tuesday dinner to Wednesday",
      "replace the chicken with tofu",
      "create a new meal plan for next week",
      "update my profile diet to vegan",
    ];
    for (const u of writeUtterances) {
      const detected = detectWriteIntent(u);
      assert(detected !== null, `write guard: '${u.slice(0, 40)}' → detected as write`);
    }
  }

  {
    const readUtterances = [
      "what is broccoli good for?",
      "tell me 5 foods that help with sleep",
      "what meals do I have this week?",
      "show me my shopping list",
      "what's in my pantry?",
      "what did I eat today?",
    ];
    for (const u of readUtterances) {
      const detected = detectWriteIntent(u);
      assert(detected === null, `write guard passes read: '${u.slice(0, 40)}'`);
    }
  }

  // ── §5 — Confidence ordering and cap at 4 ────────────────────────────────
  section("Confidence ordering and cap at 4");

  {
    const r = await resolve("What is broccoli good for?", "floating");
    assert(r.length <= 4, "cap: result never exceeds 4 intents");
    for (let i = 0; i < r.length - 1; i++) {
      assert(
        r[i].confidence >= r[i + 1].confidence,
        `ordering: result[${i}].confidence >= result[${i+1}].confidence`,
      );
    }
  }

  {
    const r = await resolve("what meals and shopping and pantry and diary do I have?", "floating");
    assert(r.length <= 4, "cap: many keywords still capped at 4");
  }

  {
    const r = await resolve("hi there", "floating");
    assert(r.length >= 1, "cap: always at least 1 result (profile)");
    assert(r.length <= 4, "cap: neutral utterance capped at 4");
  }

  // ── §6 — Surface-based primary capability ────────────────────────────────
  section("Surface-based primary routing");

  {
    const r = await resolve("hi", "planner");
    assert(hasCapability(r, "planner"), "planner surface: planner included even for neutral utterance");
    assert(hasCapability(r, "profile"), "planner surface: profile always present");
  }

  {
    const r = await resolve("hi", "shopping");
    assert(hasCapability(r, "shopping"), "shopping surface: shopping included for neutral utterance");
  }

  {
    const r = await resolve("hi", "nutrition");
    assert(hasCapability(r, "nutrition-knowledge"), "nutrition surface: nutrition-knowledge included");
  }

  {
    const r = await resolve("hi", "pantry");
    assert(hasCapability(r, "pantry"), "pantry surface: pantry included");
  }

  {
    const r = await resolve("hi", "diary");
    assert(hasCapability(r, "diary"), "diary surface: diary included");
  }

  {
    const r = await resolve("hi", "household");
    assert(hasCapability(r, "household"), "household surface: household included");
  }

  {
    const r = await resolve("hi", "meals");
    assert(hasCapability(r, "meals"), "meals surface: meals included");
  }

  {
    const r = await resolve("hi", "templates");
    assert(hasCapability(r, "templates"), "templates surface: templates included");
  }

  {
    const r = await resolve("hi", "analyser");
    assert(hasCapability(r, "analyser"), "analyser surface: analyser included");
  }

  {
    const r = await resolve("hi", "partners");
    assert(hasCapability(r, "partners"), "partners surface: partners included");
  }

  // ── §7 — Entity slug normalisation ───────────────────────────────────────
  section("Entity slug normalisation");

  {
    const r = await resolve("What is sweet potato good for?");
    const top = topResult(r);
    assert(top.verb === "explain", "slug: sweet potato → explain");
    assert(
      (top.parameters.foodSlug as string) === "sweet-potato",
      "slug: 'sweet potato' → 'sweet-potato'",
    );
  }

  {
    const r = await resolve("What is oily fish good for?");
    const top = topResult(r);
    assert(top.verb === "explain", "slug: oily fish → explain");
    assert(
      (top.parameters.foodSlug as string) === "oily-fish",
      "slug: 'oily fish' → 'oily-fish'",
    );
  }

  {
    const r = await resolve("Foods that help with gut health");
    const n = firstWith(r, "nutrition-knowledge")!;
    assert(n.verb === "search", "termQuery: gut health → search");
    assert(
      (n.parameters.query as string) === "gut health",
      "termQuery: query is 'gut health'",
    );
    assert(n.termQuery === "gut health", "termQuery field is set");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════");
  console.log("INT24 — Canonical Intent Resolver (PatternIntentResolver) tests");
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  if (failures.length > 0) {
    console.error("\nFailed assertions:");
    failures.forEach(f => console.error(`  ✗ ${f}`));
    process.exit(1);
  } else {
    console.log("All tests passed ✓");
  }
}

main().catch(err => {
  console.error("[test-intent-resolver] Unexpected error:", err);
  process.exit(1);
});
