/**
 * test-comp2-natural-conversation.ts — COMP2
 * ===========================================
 * Proves the Intelligence Platform understands households SPEAKING, not only
 * households issuing commands — and that it does so without gaining a second
 * intent engine, a conversation store, or a licence to invent facts.
 *
 * Nothing here runs the Companion, the LLM, or a database. The resolver is pure
 * over (utterance, hints); the registry assertions read the same runtime registry
 * the Intent Engine routes through, so a COMP2 matcher cannot pass these tests by
 * naming a capability or verb the platform could not actually execute.
 *
 * Coverage:
 *   §1  The five mission utterances each reach a registered capability
 *   §2  Every COMP2 intent is a REGISTERED, EXECUTABLE (capability × verb) pair
 *   §3  Read-only: no COMP2 route can mutate, none skips a confirmation gate
 *   §4  Multi-intent: compound shapes fan out to distinct capabilities
 *   §5  No fabrication: quantities, money and pronouns never become search terms
 *   §6  Clarification only when genuinely required (never alongside a route)
 *   §7  Statement frames never poach question-shaped utterances (regression)
 *   §8  detectWriteIntent still precedes the resolver and blocks no statement
 *
 * Run: npx tsx server/tests/test-comp2-natural-conversation.ts
 */

import { PatternIntentResolver } from "../intelligence/pattern-intent-resolver.js";
import { detectWriteIntent } from "../intelligence/conversation/conversation-gateway.js";
import { intelligencePlatform } from "../intelligence/intelligence-platform.js";
import { confirmationFor } from "../intelligence/permissions.js";
import type { IntentResolutionHints, ResolvedIntent } from "../intelligence/intent-resolver.js";
import type { IntentVerb } from "../intelligence/types.js";

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string, detail = ""): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
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
  return { surface, temporalAnchor: "2026-07-09", ...overrides };
}

const resolve = (u: string, s?: IntentResolutionHints["surface"]) => resolver.resolve(u, hints(s));

/** The intents that actually route this turn — the baseline profile read is context, not a route. */
const routed = (intents: ResolvedIntent[]) => intents.filter((i) => !i.baseline && !i.gap);

const capabilities = (intents: ResolvedIntent[]) => routed(intents).map((i) => i.capability);

function find(intents: ResolvedIntent[], capability: string): ResolvedIntent | undefined {
  return routed(intents).find((i) => i.capability === capability);
}

/** The clarification prompt this turn would surface, if any. */
function clarification(intents: ResolvedIntent[]): string | null {
  const gap = intents.map((i) => i.gap).find((g) => g?.kind === "needs-clarification");
  return gap?.clarificationPrompt ?? null;
}

/** The five utterances COMP2 exists to understand. */
const MISSION_UTTERANCES: ReadonlyArray<[string, string]> = [
  ["We've got half a cauliflower...", "meal-discovery"],
  ["The kids don't fancy chicken.", "planner-discovery"],
  ["Can we eat cheaply this week?", "shopping"],
  ["We've only got £30 left.", "shopping"],
  ["I need something quick tonight.", "meal-discovery"],
];

/** Conversational utterances beyond the five, exercising each shape's variants. */
const CONVERSATIONAL_UTTERANCES: readonly string[] = [
  ...MISSION_UTTERANCES.map(([u]) => u),
  "I've got a bag of frozen peas",
  "There's chicken in the fridge",
  "we have some leftover roast chicken",
  "I don't fancy pasta tonight",
  "nobody wants fish",
  "the kids won't eat broccoli",
  "everyone hates courgette",
  "we're sick of pasta",
  "the children aren't keen on salmon",
  "something easy for tea",
  "I'm in a rush tonight, what can we eat",
  "how do we keep the food bill down?",
  "we've got £20 to feed everyone",
];

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("1. The five mission utterances each reach a registered capability");
  // -------------------------------------------------------------------------

  for (const [utterance, expected] of MISSION_UTTERANCES) {
    const intents = await resolve(utterance);
    assert(
      routed(intents).length > 0,
      `"${utterance}" routes at least one capability`,
      `got ${JSON.stringify(capabilities(intents))}`,
    );
    assert(
      capabilities(intents).includes(expected),
      `"${utterance}" → ${expected}`,
      `got ${JSON.stringify(capabilities(intents))}`,
    );
    assert(
      !intents.some((i) => i.gap?.kind === "unknown"),
      `"${utterance}" is no longer an INT35 no-route`,
    );
  }

  // The specific parameters the mission examples must produce.
  const cauliflower = await resolve("We've got half a cauliflower...");
  assert(
    find(cauliflower, "meal-discovery")?.parameters.query === "cauliflower",
    `"half a cauliflower" → query "cauliflower" (quantity stripped)`,
    JSON.stringify(find(cauliflower, "meal-discovery")?.parameters),
  );

  const chicken = await resolve("The kids don't fancy chicken.");
  assert(
    find(chicken, "planner-discovery")?.parameters.query === "chicken",
    `"the kids don't fancy chicken" searches the PLAN for "chicken"`,
    JSON.stringify(find(chicken, "planner-discovery")?.parameters),
  );
  assert(
    !capabilities(chicken).includes("meal-discovery"),
    `an exclusion never asks meal-discovery for "anything but chicken"`,
  );

  const quick = await resolve("I need something quick tonight.");
  assert(
    find(quick, "meal-discovery")?.parameters.query === "quick",
    `"something quick tonight" → meal-discovery query "quick"`,
  );

  // -------------------------------------------------------------------------
  section("2. Every COMP2 intent is a REGISTERED, EXECUTABLE (capability × verb)");
  // -------------------------------------------------------------------------

  for (const utterance of CONVERSATIONAL_UTTERANCES) {
    const intents = await resolve(utterance);
    for (const intent of routed(intents)) {
      const capability = intelligencePlatform.registry.get(intent.capability);
      assert(
        capability !== undefined,
        `"${utterance}" → ${intent.capability} is registered`,
      );
      if (!capability) continue;
      assert(
        capability.supportedIntents.includes(intent.verb as IntentVerb),
        `"${utterance}" → ${intent.capability}:${intent.verb} is on the allow-list`,
      );
      assert(
        capability.executableIntents.includes(intent.verb as IntentVerb),
        `"${utterance}" → ${intent.capability}:${intent.verb} has a bound handler`,
        `executable: ${JSON.stringify(capability.executableIntents)}`,
      );
    }
  }

  // -------------------------------------------------------------------------
  section("3. Read-only: no COMP2 route mutates, none skips a confirmation gate");
  // -------------------------------------------------------------------------

  const WRITE_VERBS: readonly IntentVerb[] = [
    "add", "move", "replace", "delete", "import", "export", "share", "order", "generate", "approve", "review",
  ];

  for (const utterance of CONVERSATIONAL_UTTERANCES) {
    const intents = await resolve(utterance);
    for (const intent of routed(intents)) {
      assert(
        !WRITE_VERBS.includes(intent.verb as IntentVerb),
        `"${utterance}" → ${intent.capability}:${intent.verb} is not a write verb`,
      );
      const capability = intelligencePlatform.registry.get(intent.capability);
      if (!capability) continue;
      assert(
        confirmationFor(capability, intent.verb as IntentVerb) === "none",
        `"${utterance}" → ${intent.capability}:${intent.verb} needs no confirmation`,
      );
    }
  }

  // -------------------------------------------------------------------------
  section("4. Multi-intent: compound shapes fan out to distinct capabilities");
  // -------------------------------------------------------------------------

  const multiIntent: ReadonlyArray<[string, readonly string[]]> = [
    ["We've got half a cauliflower...", ["meal-discovery", "pantry-discovery"]],
    ["The kids don't fancy chicken.", ["planner-discovery", "household-discovery"]],
    ["Can we eat cheaply this week?", ["shopping", "planner"]],
  ];

  for (const [utterance, expected] of multiIntent) {
    const intents = await resolve(utterance);
    const caps = capabilities(intents);
    for (const cap of expected) {
      assert(caps.includes(cap), `"${utterance}" fans out to ${cap}`, JSON.stringify(caps));
    }
    assert(
      new Set(caps).size === caps.length,
      `"${utterance}" routes each capability at most once`,
      JSON.stringify(caps),
    );
  }

  // A money statement with no week signal reads the priced basket and nothing else.
  const thirtyPounds = await resolve("We've only got £30 left.");
  assert(
    capabilities(thirtyPounds).includes("shopping"),
    `"we've only got £30 left" grounds on the priced basket`,
  );
  assert(
    find(thirtyPounds, "shopping")?.parameters.scope === "basket",
    `"£30 left" → shopping scope "basket" (the only priced view)`,
  );
  assert(
    !capabilities(thirtyPounds).includes("planner"),
    `"£30 left" alone carries no week signal, so the plan is not read`,
  );

  // planner-discovery substring-matches a meal name, so it is only ever given a
  // named food — never a whole utterance that could not match anything.
  for (const utterance of CONVERSATIONAL_UTTERANCES) {
    const intents = await resolve(utterance);
    const plannerSearch = find(intents, "planner-discovery");
    if (!plannerSearch) continue;
    const query = String(plannerSearch.parameters.query ?? "");
    assert(
      query.length > 0 && query.split(/\s+/).length <= 3 && !/[?]/.test(query),
      `"${utterance}" → planner-discovery is given a named food, not an utterance`,
      JSON.stringify(query),
    );
  }

  // -------------------------------------------------------------------------
  section("5. No fabrication: quantities, money and pronouns never become terms");
  // -------------------------------------------------------------------------

  // The amount is a signal that the basket is relevant — never a stored budget,
  // never a parameter, never echoed back as a fact the platform knows.
  for (const intent of routed(thirtyPounds)) {
    const serialised = JSON.stringify(intent.parameters);
    assert(!/30/.test(serialised), `"£30 left" → no intent carries the amount (${intent.capability})`);
    assert(!/budget/i.test(serialised), `"£30 left" → no intent invents a budget parameter`);
  }

  const noFabrication: ReadonlyArray<[string, string]> = [
    ["we've got some left over", "a bare quantity is not searched as a food"],
    ["we've got a bit left", "a bare quantity is not searched as a food"],
    ["The kids don't fancy it.", "a pronoun is not searched as a food"],
    ["I have a nut allergy", "a profile fact is not searched as an ingredient"],
    ["we have vegan guests", "a household fact is not searched as an ingredient"],
  ];

  for (const [utterance, label] of noFabrication) {
    const intents = await resolve(utterance);
    assert(!capabilities(intents).includes("meal-discovery"), `"${utterance}": ${label}`,
      JSON.stringify(routed(intents).map((i) => `${i.capability}:${JSON.stringify(i.parameters)}`)));
  }

  // The dog is not a household member the platform has any record of.
  const dog = await resolve("the dog won't eat chicken");
  assert(
    routed(dog).length === 0,
    "an unrecognised subject is left unrouted rather than attributed to the household",
    JSON.stringify(capabilities(dog)),
  );

  // -------------------------------------------------------------------------
  section("6. Clarification only when genuinely required");
  // -------------------------------------------------------------------------

  const vague = await resolve("we've got some left over");
  assert(clarification(vague) !== null, "a possession naming no food asks which ingredient");
  assert(routed(vague).length === 0, "a clarification turn routes NO capability (gateway needs no-route)");

  const pronoun = await resolve("The kids don't fancy it.");
  assert(clarification(pronoun) !== null, "an exclusion naming no food asks which food");
  assert(routed(pronoun).length === 0, "the clarification turn routes NO capability");
  assert(
    !pronoun.some((i) => i.gap?.kind === "unknown"),
    "a recognised-but-underspecified shape is needs-clarification, not unknown",
  );

  // The gateway only voices a clarification on a no-route turn, so a clarification
  // must never be emitted alongside a route it would be silently discarded behind.
  for (const utterance of CONVERSATIONAL_UTTERANCES) {
    const intents = await resolve(utterance);
    if (clarification(intents) === null) continue;
    assert(routed(intents).length === 0, `"${utterance}" never clarifies AND routes`);
  }

  // Groundable statements are answered, never asked back.
  for (const [utterance] of MISSION_UTTERANCES) {
    const intents = await resolve(utterance);
    assert(clarification(intents) === null, `"${utterance}" is answered, not clarified`);
  }

  // A clarification survives a surface that would otherwise supply a primary capability.
  const onPlanner = await resolve("The kids don't fancy it.", "planner");
  assert(
    clarification(onPlanner) !== null && routed(onPlanner).length === 0,
    "surface-primary is suppressed while a clarification is pending",
    JSON.stringify(capabilities(onPlanner)),
  );

  // -------------------------------------------------------------------------
  section("7. Statement frames never poach question-shaped utterances");
  // -------------------------------------------------------------------------

  const regressions: ReadonlyArray<[string, string]> = [
    ["do I have flour in my pantry?", "pantry-discovery"],
    ["what's in my pantry?", "pantry-discovery"],
    ["what can I cook with chickpeas?", "meal-discovery"],
    ["what is broccoli good for?", "nutrition-knowledge"],
    ["have I got any chicken recipes?", "meals"],
    ["does anyone in my household have a nut allergy?", "household-discovery"],
    ["which items could I swap for cheaper alternatives?", "shopping"],
    ["what meals do I have this week?", "planner"],
    ["compare cheddar and brie", "food-intelligence"],
    ["show me pasta recipes", "meal-discovery"],
  ];

  for (const [utterance, expected] of regressions) {
    const intents = await resolve(utterance);
    assert(
      capabilities(intents).includes(expected),
      `regression: "${utterance}" still → ${expected}`,
      JSON.stringify(capabilities(intents)),
    );
  }

  // "do I have flour in my pantry" contains "I have" but is a question: the
  // possession frame is start-anchored, so it must not add a meal-discovery route.
  const pantryQuestion = await resolve("do I have flour in my pantry?");
  assert(
    !capabilities(pantryQuestion).includes("meal-discovery"),
    `"do I have flour in my pantry" is not read as a possession statement`,
  );

  // "everyone wants pasta" is a positive preference, not a dislike.
  const positive = await resolve("everyone wants pasta");
  assert(
    !capabilities(positive).includes("planner-discovery"),
    `"everyone wants pasta" is not read as a dislike`,
    JSON.stringify(capabilities(positive)),
  );

  // -------------------------------------------------------------------------
  section("8. detectWriteIntent still precedes the resolver and blocks no statement");
  // -------------------------------------------------------------------------

  for (const [utterance] of MISSION_UTTERANCES) {
    assert(
      detectWriteIntent(utterance) === null,
      `"${utterance}" is not misread as a write command`,
      String(detectWriteIntent(utterance)),
    );
  }

  assert(
    detectWriteIntent("add chicken to my shopping list") !== null,
    "a genuine imperative write is still blocked before resolution",
  );

  // -------------------------------------------------------------------------
  console.log("\n══════════════════════════════════════════════════════");
  console.log("COMP2 — Natural Conversation tests");
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  if (failed > 0) {
    console.error("\nFailures:");
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log("All tests passed ✓");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
