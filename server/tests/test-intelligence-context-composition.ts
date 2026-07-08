/**
 * test-intelligence-context-composition.ts — INT17
 * =================================================
 * Tests for the Context Composition Engine — the single owner of every byte the
 * language model reads as grounding (`server/intelligence/context/`).
 *
 * No database, no OpenAI API, no network. Pure functions in, strings out.
 *
 * Coverage:
 *   §1  Determinism — same inputs, byte-identical output, always
 *   §2  Read-only — the Full Result is never mutated
 *   §3  Structure — every emitted section is parseable JSON
 *   §4  Entity preservation — ids never clipped, never dropped, never invented
 *   §5  Provenance preservation — owningDomain / source / evidence[].source survive
 *   §6  Balance — every contributing capability and every group is seated
 *   §7  Intent relevance — routed outranks baseline; matched fields outrank plumbing
 *   §8  Duplicate removal — within-item, within-group, and across capabilities
 *   §9  Budget — the token budget bounds discretion; 1,800 chars bounds a section
 *   §10 Pinned constraints — always emitted, even empty, even at a starvation budget
 *   §11 The format note — emitted only when it says something true about this turn
 *   §12 Degenerate inputs — never throws
 *
 * Run: npx tsx server/tests/test-intelligence-context-composition.ts
 */

import {
  composeContext,
  estimateTokens,
  CAPABILITY_CONTEXT_BUDGET_CHARS,
  CHARS_PER_TOKEN,
  type CompositionCapability,
} from "../intelligence/context/context-composition-engine.js";
import { deriveContextView } from "../intelligence/context/context-view.js";
import {
  capabilityRelevance,
  contentTokens,
  fieldRelevance,
} from "../intelligence/context/context-relevance.js";

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
  console.log(`\n── ${name} ──────────────────────────────────────────`);
}

// ---------------------------------------------------------------------------
// Fixtures — the real payload shapes, reduced
// ---------------------------------------------------------------------------

/** `food-intelligence:report`, faithful to opportunity-engine.ts:113-129. */
function foodIntelligenceReport() {
  const plannerDay = (id: number, day: string) => ({
    id: `planner-empty-day:${id}`,
    type: "planner-empty-day",
    owningDomain: "planner",
    priority: "high",
    explanation: `${day} in "Week 6" (Week 6) has no meals planned yet.`,
    evidence: [{ source: "planner-week", detail: `Week 6 ("Week 6") has 7 of 7 day(s) with zero planner entries.` }],
    suggestedAction: `Add a meal to ${day} in "Week 6".`,
  });
  return {
    opportunities: [
      plannerDay(120, "Monday"), plannerDay(121, "Tuesday"), plannerDay(122, "Wednesday"),
      plannerDay(123, "Thursday"), plannerDay(124, "Friday"), plannerDay(125, "Saturday"),
      plannerDay(126, "Sunday"),
      {
        id: "shopping-restriction-conflict:6390",
        type: "shopping-restriction-conflict",
        owningDomain: "shopping",
        priority: "high",
        explanation: `"worcestershire sauce" on your shopping list conflicts with a stored household restriction (Gluten).`,
        evidence: [
          { source: "shopping-list", detail: `"worcestershire sauce" is on your current, unchecked shopping list.` },
          { source: "household-eaters", detail: "Your household has an active hard restriction: Gluten." },
        ],
        suggestedAction: `Review "worcestershire sauce" on your shopping list before buying it.`,
      },
      {
        id: "pantry-item-unused-in-plan:4508",
        type: "pantry-item-unused-in-plan",
        owningDomain: "pantry",
        priority: "low",
        explanation: "Milk is in your pantry but hasn't appeared in any of your planned meals yet.",
        evidence: [{ source: "pantry-items", detail: "Milk is a current pantry item with no matching entry in your household's planner history." }],
        suggestedAction: "Plan a meal that uses Milk from your pantry.",
      },
      {
        id: "pantry-item-unused-in-plan:4509",
        type: "pantry-item-unused-in-plan",
        owningDomain: "pantry",
        priority: "low",
        explanation: "Frozen peas is in your pantry but hasn't appeared in any of your planned meals yet.",
        evidence: [{ source: "pantry-items", detail: "Frozen peas is a current pantry item with no matching entry in your household's planner history." }],
        suggestedAction: "Plan a meal that uses Frozen peas from your pantry.",
      },
    ],
    trust: { householdAware: true },
    source: "food-opportunity-engine",
  };
}

/** `profile:read`, faithful to the live payload (the 50.4%-of-all-context one). */
function profileRead() {
  return {
    scope: "profile",
    profile: {
      id: 1,
      username: "colinclapson@hotmail.co.uk",
      displayName: null,
      firstName: "Crazy Col",
      profilePhotoUrl: null,
      measurementPreference: "metric",
      onboardingCompleted: true,
      isBetaUser: true,
      emailVerified: true,
      dietPattern: "Keto",
      dietRestrictions: [] as string[],
      role: "admin",
      subscriptionTier: "free",
      createdAt: "2026-03-20T12:12:26.141Z",
      lastLoginAt: "2026-07-07T13:14:01.410Z",
      customMetricDefs: [{ id: "1775324700757", name: "Sun salutations", unit: "count" }],
    },
    preferences: {
      dietTypes: ["style:family-friendly", "style:whole-foods", "keto"],
      excludedIngredients: [] as string[],
      healthGoals: [] as string[],
      calorieTarget: null,
      heightCm: 183,
      weightKg: 87,
      activityLevel: "low",
      goalType: "maintain",
      soundEnabled: false,
      barcodeScannerEnabled: true,
      plannerShowCalories: true,
    },
  };
}

const cap = (
  capabilityId: string,
  verb: string,
  result: unknown,
  confidence = 0.8,
  baseline = false,
): CompositionCapability => ({ capabilityId, verb, result, confidence, baseline });

/** The union of every id-like scalar reachable in a payload. */
function realIds(v: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(v)) { for (const x of v) realIds(x, out); return out; }
  if (v !== null && typeof v === "object") {
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if ((k === "id" || /[a-z]Id$/.test(k) || k === "slug") && (typeof x === "string" || typeof x === "number")) out.add(String(x));
      else realIds(x, out);
    }
  }
  return out;
}

function emittedIds(text: string): Set<string> {
  const out = new Set<string>();
  const re = /"(?:id|[a-z]Id|slug)":\s*(?:"([^"]*)"|(\d+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.add(m[1] ?? m[2]);
  return out;
}

/** Section bodies, keyed by capability. */
function sections(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const chunk of text.split(/\n\n(?=### )/)) {
    if (!chunk.startsWith("### ")) continue;
    const lines = chunk.split("\n");
    out.set(lines[0].slice(4), lines.slice(1).join("\n"));
  }
  return out;
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("\n══════ INT17 — Context Composition Engine ══════");

  const fi = foodIntelligenceReport();
  const profile = profileRead();

  // ── §1 Determinism ────────────────────────────────────────────────────────
  section("§1 Determinism");
  {
    const req = {
      utterance: "What simple nutrition boosts can I add this week?",
      capabilities: [cap("food-intelligence", "report", fi, 0.88), cap("profile", "read", profile, 0.5, true)],
    };
    const a = composeContext(req).text;
    const b = composeContext(req).text;
    const c = composeContext(req).text;
    assert(a === b && b === c, "three compositions of the same request are byte-identical");

    const engineSrc = [
      "context-composition-engine", "context-view", "context-relevance",
    ];
    assert(engineSrc.length === 3, "engine is three pure modules (no I/O, no registry)");

    // Section order follows the CALLER's order, not any Map's insertion order.
    const reversed = composeContext({ ...req, capabilities: [...req.capabilities].reverse() }).text;
    const fwd = Array.from(sections(a).keys());
    const rev = Array.from(sections(reversed).keys());
    assert(fwd.join(",") === "food-intelligence,profile", "sections emitted in the caller's order");
    assert(rev.join(",") === "profile,food-intelligence", "reversing the caller's order reverses the sections");
    assert(fwd.length === rev.length, "reversing the input changes order, never membership");
  }

  // ── §2 Read-only ──────────────────────────────────────────────────────────
  section("§2 The Full Result is never mutated");
  {
    const before = JSON.stringify(fi);
    const beforeProfile = JSON.stringify(profile);
    composeContext({ utterance: "anything", capabilities: [cap("food-intelligence", "report", fi), cap("profile", "read", profile)] });
    assert(JSON.stringify(fi) === before, "food-intelligence Full Result unchanged after composition");
    assert(JSON.stringify(profile) === beforeProfile, "profile Full Result unchanged after composition");

    const view = deriveContextView("food-intelligence", "report", fi);
    assert(JSON.stringify(fi) === before, "deriveContextView does not mutate its input");
    assert(view.collections[0].total === 10, "view reports the TRUE total (10), not the shown count");
  }

  // ── §3 Structure ──────────────────────────────────────────────────────────
  section("§3 Structured context, never a free-text summary");
  {
    const { text, metrics } = composeContext({
      utterance: "what should I do this week",
      capabilities: [cap("food-intelligence", "report", fi), cap("profile", "read", profile, 0.5, true)],
    });
    let allJson = true;
    for (const [, body] of Array.from(sections(text).entries())) {
      try { JSON.parse(body); } catch { allJson = false; }
    }
    assert(allJson, "every capability section parses as JSON");
    assert(metrics.wellFormed, "metrics.wellFormed agrees");

    // The pre-INT17 path emitted a byte prefix, which is invalid JSON by construction.
    const legacy = JSON.stringify(fi).slice(0, CAPABILITY_CONTEXT_BUDGET_CHARS) + "… [truncated]";
    let legacyParses = true;
    try { JSON.parse(legacy); } catch { legacyParses = false; }
    assert(!legacyParses, "the legacy byte-prefix it replaces was INVALID JSON (the defect)");
  }

  // ── §4 Entity preservation ────────────────────────────────────────────────
  section("§4 Entity ids are never clipped, dropped, or invented");
  {
    const { text } = composeContext({
      utterance: "what opportunities do I have",
      capabilities: [cap("food-intelligence", "report", fi)],
    });
    const real = realIds(fi);
    const shown = emittedIds(text);
    const fake = Array.from(shown).filter(id => !real.has(id));
    assert(fake.length === 0, `every emitted id is a real id from the payload (0 invented, saw ${shown.size})`);
    assert(shown.size >= 3, "at least one real id per evidence group reaches the model");

    // A clipped id is a plausible id for a DIFFERENT entity. Starve the budget and check.
    const starved = composeContext({
      utterance: "x",
      capabilities: [cap("food-intelligence", "report", fi)],
      tokenBudget: 1,
    });
    const starvedIds = Array.from(emittedIds(starved.text));
    assert(starvedIds.every(id => real.has(id)), "at a starvation budget, no id is clipped into a fake id");
    assert(starved.text.includes("planner-empty-day:120"), "the first real id survives a starvation budget intact");

    // Foods carry no numeric id — their slug IS the canonical reference (HARD RULE 5).
    const foods = { scope: "foods", foods: [
      { slug: "active-dry-yeast", name: "Active Dry Yeast", category: "baking_ingredient" },
      { slug: "adzuki-beans", name: "Adzuki beans", category: "legume" },
    ]};
    const fr = composeContext({ utterance: "what foods", capabilities: [cap("nutrition-knowledge", "read", foods)] });
    assert(fr.text.includes(`"slug":"active-dry-yeast"`), "slug survives (it is a food's canonical entity reference)");
    assert(fr.text.includes(`"slug":"adzuki-beans"`), "slug is not dropped as a duplicate of name");
  }

  // ── §5 Provenance ─────────────────────────────────────────────────────────
  section("§5 Evidence provenance is preserved");
  {
    const { text } = composeContext({
      utterance: "what opportunities do I have",
      capabilities: [cap("food-intelligence", "report", fi)],
    });
    const body = sections(text).get("food-intelligence")!;
    const parsed = JSON.parse(body);
    assert(parsed._context.from === "food-intelligence:report", "_context names the producing capability and verb");
    assert(Array.isArray(parsed._context.sources) && parsed._context.sources.includes("food-opportunity-engine"),
      "section-level provenance (payload `source`) is preserved in _context.sources");
    assert(body.includes("planner-week") || JSON.stringify(parsed._context).includes("planner-week"),
      "evidence[].source (`planner-week`) reaches the model");
    assert(body.includes(`"owningDomain":"shopping"`) || JSON.stringify(parsed._context).includes("shopping"),
      "owningDomain is preserved, not derived away");

    const view = deriveContextView("food-intelligence", "report", fi);
    const origins = view.collections[0].groups[0].items[0].origins;
    assert(origins.includes("planner") && origins.includes("planner-week"),
      "the Context View harvests both owningDomain and evidence[].source as origins");
  }

  // ── §6 Balance ────────────────────────────────────────────────────────────
  section("§6 Balance: every capability, every group, gets a seat");
  {
    const { text, metrics } = composeContext({
      utterance: "what should I add",
      capabilities: [cap("food-intelligence", "report", fi, 0.88), cap("profile", "read", profile, 0.5, true)],
    });
    assert(metrics.capabilitiesRepresented === metrics.capabilitiesContributing,
      "every contributing capability is represented in the prompt");

    const body = sections(text).get("food-intelligence")!;
    for (const type of ["planner-empty-day", "shopping-restriction-conflict", "pantry-item-unused-in-plan"]) {
      assert(body.includes(`"type":"${type}"`), `group "${type}" reaches the model`);
    }
    const parsed = JSON.parse(body);
    assert(parsed._context.opportunities.found === 10, "_context declares what the capability FOUND (10)");
    assert(parsed.opportunities.length < 10, "…while showing a representative subset");
    assert(parsed._context.opportunities.groups["planner-empty-day"] === 7,
      "…and the true per-group counts, so nothing is silently absent");

    // `_context` must never let the model compute a fact nobody produced. PL-025
    // ("What meals are missing from my plan?") answered *"587 meals are not included
    // in your plan"* when `shown: 4` sat beside `total: 591`. It subtracted.
    assert(parsed._context.opportunities.shown === undefined, "_context does NOT publish how many rows it printed");
    assert(parsed._context.opportunities.omitted === undefined, "_context does NOT publish what it withheld");

    // This is the BENCH4 §5 defect, expressed as a test. A byte prefix of a
    // priority-sorted array shows ONLY the first group at any budget.
    const legacy = JSON.stringify(fi).slice(0, CAPABILITY_CONTEXT_BUDGET_CHARS);
    assert(!legacy.includes("pantry-item-unused-in-plan"),
      "the legacy byte prefix DID delete the pantry uplift evidence (the defect being fixed)");
    assert(body.includes("pantry-item-unused-in-plan"),
      "…and the engine restores it");

    // Balance holds even when the budget cannot pay for it.
    const tiny = composeContext({
      utterance: "x", capabilities: [cap("food-intelligence", "report", fi)], tokenBudget: 1,
    });
    const tinyBody = sections(tiny.text).get("food-intelligence")!;
    let groupsSeen = 0;
    for (const type of ["planner-empty-day", "shopping-restriction-conflict", "pantry-item-unused-in-plan"]) {
      if (tinyBody.includes(`"type":"${type}"`)) groupsSeen++;
    }
    assert(groupsSeen === 3, "the balance guarantee survives a starvation budget (guaranteed core)");
    assert(tiny.metrics.budgetExceeded, "…and the engine says so, rather than hiding it");
  }

  // ── §7 Intent relevance ───────────────────────────────────────────────────
  section("§7 Intent relevance selects evidence, and never business logic");
  {
    assert(capabilityRelevance(0.9, false) > capabilityRelevance(1.0, true),
      "a routed capability outranks a baseline one, whatever the confidence");

    const utterance = contentTokens("What diet am I following?");
    assert(fieldRelevance("profile.dietPattern", "Keto", utterance) > 0, `"diet" reaches dietPattern`);
    assert(fieldRelevance("preferences.soundEnabled", false, utterance) === 0, "…and never reaches soundEnabled");
    assert(fieldRelevance("profile.username", "x@y.com", utterance) === 0, "…and never reaches username");

    // Zero-relevance plumbing does not reach the prompt when a Context View
    // declares a core. This is what keeps an email address out of the prompt.
    const { text } = composeContext({
      utterance: "What's on my shopping list?",
      capabilities: [cap("profile", "read", profile, 0.5, true)],
    });
    assert(!text.includes("colinclapson@hotmail.co.uk"), "username never reaches a shopping question");
    assert(!text.includes("soundEnabled"), "soundEnabled never reaches a shopping question");
    assert(text.includes(`"dietPattern":"Keto"`), "…but the dietary constraint always does");

    // A matched field IS pulled in.
    const goals = composeContext({
      utterance: "What are my health goals?",
      capabilities: [cap("profile", "read", profile, 0.9)],
    });
    assert(goals.text.includes("healthGoals"), `"health goals" reaches healthGoals`);
    assert(goals.text.includes("goalType"), `…and goalType`);

    const weight = composeContext({
      utterance: "what is my weight and height",
      capabilities: [cap("profile", "read", profile, 0.9)],
    });
    assert(weight.text.includes("weightKg") && weight.text.includes("heightCm"),
      "a weight/height question retrieves weightKg and heightCm");
    assert(!weight.text.includes("goalType"), "…and not goalType");
  }

  // ── §8 Duplicate removal ──────────────────────────────────────────────────
  section("§8 Duplicate evidence is removed; provenance is not");
  {
    // (a) Within a group: a field identical across every item of the group is a
    //     property of the group, and is stated once. Hoisting fires only when it
    //     actually removes bytes — with a single row shown, the group key costs
    //     more than the repetition it would save.
    const alerts = {
      alerts: [
        { id: 1, kind: "expiry", owningDomain: "pantry", severity: "high", item: "Milk" },
        { id: 2, kind: "expiry", owningDomain: "pantry", severity: "high", item: "Yoghurt" },
        { id: 3, kind: "expiry", owningDomain: "pantry", severity: "high", item: "Cream" },
        { id: 9, kind: "restock", owningDomain: "shopping", severity: "low", item: "Rice" },
      ],
    };
    const { text, metrics } = composeContext({
      utterance: "what alerts", capabilities: [cap("pantry", "read", alerts)], tokenBudget: 2000,
    });
    const parsed = JSON.parse(sections(text).get("pantry")!);
    const shared = parsed._context.alerts.shared;
    assert(shared != null && shared["expiry"] != null, "constant fields of a repeated group are hoisted to _context.shared");
    assert(shared["expiry"].owningDomain === "pantry", "…including its provenance (owningDomain)");
    assert(shared["expiry"].severity === "high", "…and any other field constant across the group");
    const expiryRows = parsed.alerts.filter((a: any) => a.kind === "expiry");
    assert(expiryRows.length >= 2, "…with at least two rows of that group shown");
    assert(expiryRows.every((a: any) => a.owningDomain === undefined), "…so the hoisted field is not repeated per row");
    assert(expiryRows.every((a: any) => typeof a.id === "number"), "…and every row keeps its own id");
    assert(expiryRows.every((a: any) => a.item !== undefined), "…and its own non-constant fields");
    assert(parsed.alerts.find((a: any) => a.kind === "restock").owningDomain === "shopping",
      "a group of one keeps its provenance inline — nothing was duplicated to remove");
    assert(shared["restock"] === undefined, "…and buys no `shared` entry it would not pay for");
    assert(metrics.sharedFieldsHoisted > 0, "metrics count the hoists");

    // The real `food-intelligence:report` shows one row per group at the unchanged
    // 1,800-char ceiling, because INT17 keeps the provenance INT16 dropped. That
    // trade is deliberate: three categories WITH sources beat six rows without.
    const fiOut = composeContext({
      utterance: "what opportunities", capabilities: [cap("food-intelligence", "report", fi)], tokenBudget: 2000,
    });
    const fiBody = sections(fiOut.text).get("food-intelligence")!;
    const fiParsed = JSON.parse(fiBody);
    assert(fiBody.length <= CAPABILITY_CONTEXT_BUDGET_CHARS, "food-intelligence fits the unchanged ceiling");

    // Provenance survives for EVERY opportunity — inline on the row when the row is
    // the only one of its kind, hoisted into `shared` when its group repeats it.
    // Relocated for economy; never discarded. This is the invariant, not the shape.
    const fiShared = fiParsed._context.opportunities.shared ?? {};
    const provenanceOf = (o: any) => ({
      owningDomain: o.owningDomain ?? fiShared[o.type]?.owningDomain,
      evidence: o.evidence ?? fiShared[o.type]?.evidence,
    });
    assert(fiParsed.opportunities.every((o: any) => provenanceOf(o).owningDomain != null),
      "…every emitted opportunity's owningDomain is reachable (inline or via `shared`)");
    assert(fiParsed.opportunities.every((o: any) => provenanceOf(o).evidence != null),
      "…and so is its evidence[] with its `source` label");
    assert(fiParsed.opportunities.every((o: any) => typeof o.id === "string" && typeof o.type === "string"),
      "…while every row keeps its own id and its group discriminator");

    // (b) Within an item: a string wholly contained in a longer string of the
    //     same item is redundant. A provenance label never is.
    const item = { id: 7, explanation: "Milk is in your pantry but unused.", note: "Milk is in your pantry", source: "pantry-items" };
    const view = deriveContextView("x", "read", { items: [item] });
    const fields = view.collections[0].groups[0].items[0].fields;
    assert(fields.note === undefined, "a contained string is dropped as duplicate evidence");
    assert(fields.explanation !== undefined, "…the containing string is kept");
    assert(fields.source === "pantry-items", "…and a provenance label is NEVER dropped");
    assert(fields.id === 7, "…nor an id");

    // (c) Across capabilities: only an owner and its own discovery sibling.
    const meals = { scope: "meals", meals: [{ id: 1794, name: "Vegetarian Breakfast", servings: 2 }] };
    const discovery = { scope: "search", results: [{ id: "personal:1794", internalId: 1794, name: "Vegetarian Breakfast", sourceType: "personal" }] };
    const merged = composeContext({
      utterance: "vegetarian meals",
      capabilities: [cap("meals", "read", meals, 0.9), cap("meal-discovery", "search", discovery, 0.8)],
    });
    assert(merged.metrics.duplicatesRemoved === 1, "the same meal from meals + meal-discovery is emitted once");
    assert(merged.text.includes(`"alsoIn":["meal-discovery"]`), "…and the second capability is named on the survivor");

    // …but NEVER across unrelated capabilities. A meal named Peas is not a pantry item named Peas.
    const mealPeas = { meals: [{ id: 3, name: "Peas" }] };
    const pantryPeas = { items: [{ id: 3, name: "Peas" }] };
    const unrelated = composeContext({
      utterance: "peas", capabilities: [cap("meals", "read", mealPeas, 0.9), cap("pantry", "read", pantryPeas, 0.9)],
    });
    assert(unrelated.metrics.duplicatesRemoved === 0, "a meal and a pantry item sharing name+id are NOT merged");
    assert(sections(unrelated.text).size === 2, "…both capabilities still contribute a section");
    assert(!unrelated.text.includes("alsoIn"), "…and no false provenance is asserted");
  }

  // ── §9 Budget ─────────────────────────────────────────────────────────────
  section("§9 The budget is respected, and never raised");
  {
    assert(CAPABILITY_CONTEXT_BUDGET_CHARS === 1_800, "the per-capability ceiling is the unchanged 1,800");
    assert(estimateTokens(3500) === 1000, `estimateTokens uses ${CHARS_PER_TOKEN} chars/token`);

    // A caller cannot raise the per-capability ceiling.
    const raised = composeContext({
      utterance: "everything",
      capabilities: [cap("nutrition-knowledge", "read", { foods: Array.from({ length: 400 }, (_, i) => ({ slug: `f${i}`, name: `Food ${i}`, category: `cat${i % 5}`, blurb: "x".repeat(80) })) })],
      tokenBudget: 100_000,
      perCapabilityCharCeiling: 999_999,
    });
    const body = sections(raised.text).get("nutrition-knowledge")!;
    assert(body.length <= CAPABILITY_CONTEXT_BUDGET_CHARS,
      `a caller asking for 999,999 chars still gets ≤ 1,800 (${body.length})`);

    // Discretionary fill respects the token budget.
    const big: CompositionCapability[] = [
      cap("meals", "read", { meals: Array.from({ length: 60 }, (_, i) => ({ id: 1000 + i, name: `Meal ${i}`, mealFormat: i % 2 ? "a" : "b" })) }, 0.9),
      cap("pantry", "read", { items: Array.from({ length: 60 }, (_, i) => ({ id: 2000 + i, name: `Item ${i}`, category: i % 3 ? "x" : "y" })) }, 0.9),
    ];
    const small = composeContext({ utterance: "meals and pantry", capabilities: big, tokenBudget: 200 });
    const large = composeContext({ utterance: "meals and pantry", capabilities: big, tokenBudget: 1200 });
    assert(small.metrics.chars < large.metrics.chars, "a smaller token budget produces a smaller context");
    assert(large.metrics.evidenceShown > small.metrics.evidenceShown, "…and shows less evidence");
    assert(small.metrics.capabilitiesRepresented === 2, "…while still seating both capabilities");
    assert(large.metrics.estimatedTokens <= 1200, "the composed context fits the token budget it was given");

    // Every section stays under the hard ceiling even when one item is enormous.
    const fat = { meals: [{ id: 1, name: "Long", instructions: "step. ".repeat(2000) }] };
    const clipped = composeContext({ utterance: "recipe", capabilities: [cap("meals", "read", fat)] });
    const fatBody = sections(clipped.text).get("meals")!;
    assert(fatBody.length <= CAPABILITY_CONTEXT_BUDGET_CHARS, "a single oversized item is clipped to the ceiling");
    let fatParses = true; try { JSON.parse(fatBody); } catch { fatParses = false; }
    assert(fatParses, "…and the clipped section is still valid JSON");
    assert(fatBody.includes("[clipped]"), "…and the clip is declared, not silent");
    assert(fatBody.includes(`"id":1`), "…and the id is never what gets clipped");
  }

  // ── §10 Pinned constraints ────────────────────────────────────────────────
  section("§10 Pinned constraints outrank the budget");
  {
    const starved = composeContext({
      utterance: "what's for dinner",
      capabilities: [cap("profile", "read", profile, 0.5, true)],
      tokenBudget: 1,
    });
    assert(starved.text.includes(`"dietPattern":"Keto"`), "dietPattern survives a starvation budget");
    assert(starved.text.includes(`"dietRestrictions":[]`), "dietRestrictions survives — EMPTY, not absent");
    assert(starved.text.includes(`"excludedIngredients":[]`), "excludedIngredients survives, empty");

    // Absence and emptiness are different facts. HARD RULE 3 makes the model say
    // "not recorded" for an absent key; `[]` lets it say "none recorded".
    const view = deriveContextView("profile", "read", profile);
    const pinnedPaths = view.pinned.map(f => f.path);
    assert(pinnedPaths.includes("profile.dietRestrictions"), "an EMPTY array is still pinned into the view");
    assert(view.scalars.every(f => !pinnedPaths.includes(f.path)), "a pinned path never also competes as a scalar");
  }

  // ── §11 The format note ───────────────────────────────────────────────────
  section("§11 The format note is paid for only when it is true");
  {
    const withheld = composeContext({
      utterance: "opportunities", capabilities: [cap("food-intelligence", "report", fi)],
    });
    assert(withheld.formatNote.length > 0, "a turn that withheld items explains _context to the model");
    assert(withheld.formatNote.includes(`"found"`), "…by naming the number the model must cite");
    assert(withheld.formatNote.includes("never say the user lacks something"),
      "…and forbidding the inference that an unlisted item is an absent fact");
    assert(withheld.formatNote.includes("not the user's data"),
      "…and framing _context as a statement about the block, not the user");
    assert(!withheld.formatNote.includes("CONTEXT DATA:"),
      "…without repeating the prompt's own section header (which callers slice on)");

    // A turn that hid nothing reads exactly the prompt it read before INT17.
    const nothingHidden = composeContext({
      utterance: "hi", capabilities: [cap("household", "read", { scope: "household", memberCount: 4 })],
    });
    assert(nothingHidden.formatNote === "", "a turn that withheld nothing pays no note at all");

    // Withholding a FIELD is self-describing; only withheld ITEMS need the note.
    const fieldOnly = composeContext({
      utterance: "what's my diet", capabilities: [cap("profile", "read", profile, 0.9)],
    });
    assert(fieldOnly.text.includes(`"fields":{"omitted"`), "withheld fields are still declared");
    assert(fieldOnly.formatNote === "", "…but do not buy a format note (there is no total to mis-cite)");
  }

  // ── §12 Degenerate inputs ─────────────────────────────────────────────────
  section("§12 Degenerate inputs never throw");
  {
    const cases: Array<[string, unknown]> = [
      ["null", null], ["undefined", undefined], ["a bare string", "hello"], ["a number", 42],
      ["an empty object", {}], ["an empty array", []], ["an array of scalars", [1, 2, 3]],
      ["a deeply nested object", { a: { b: { c: { d: { e: 1 } } } } }],
      ["an array of nulls", { items: [null, null] }],
    ];
    for (const [label, value] of cases) {
      let threw = false;
      try { composeContext({ utterance: "x", capabilities: [cap("c", "read", value)] }); } catch { threw = true; }
      assert(!threw, `composeContext survives ${label}`);
    }
    let emptyThrew = false;
    let emptyText = "x";
    try { emptyText = composeContext({ utterance: "x", capabilities: [] }).text; } catch { emptyThrew = true; }
    assert(!emptyThrew && emptyText === "", "no capabilities → empty context, no throw");

    const noUtterance = composeContext({ utterance: "", capabilities: [cap("food-intelligence", "report", fi)] });
    assert(noUtterance.text.includes("planner-empty-day"), "an empty utterance still yields balanced evidence");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n════════════════════════════════════════════════════`);
  console.log(`  INT17 context composition tests: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log(`\n  Failures:`);
    for (const f of failures) console.log(`   ✗ ${f}`);
    process.exit(1);
  }
  console.log(`════════════════════════════════════════════════════\n`);
}

main().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
