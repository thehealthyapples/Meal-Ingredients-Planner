/**
 * BENCHINT4 (task 16) — Routing attribution regression test
 * =========================================================
 *
 * BENCHINT3 attributed all twelve R2 misroutes in `2026-07-10T10-48-57Z__8e10ea3` by executing
 * the production resolver against the twelve utterances and capturing the intent pool. Nothing
 * in the repository preserved that evidence: the pool was reproduced in a throwaway harness, and
 * the next matcher edit could silently move any of it.
 *
 * This file pins it. Each assertion below is a fact BENCHINT4 changed or deliberately preserved,
 * stated as the resolver's own output for a real corpus utterance.
 *
 * TWO INVARIANTS ARE LOAD-BEARING BEYOND THE INDIVIDUAL ROWS:
 *
 *  · The always-on `profile` baseline (0.50) must never be displaced from the `MAX_INTENTS = 4`
 *    cap by a coverage floor. The nutrient/benefit vocabulary floor added by T2.2 sits at 0.49
 *    precisely so this holds; at 0.58 it did not (see the pattern's own comment).
 *  · The owner ↔ discovery relationship is declared ONCE, on the Capability Registry, and the
 *    graph is well formed. INT17 §8 open item 5 records what an undeclared pair used to cost:
 *    merging silently stopped for it. It is now a construction-time throw.
 *
 * No benchmark is executed here (ARCH_BENCHMARK_OWNERSHIP_RULE). The resolver is pure and I/O
 * free; the registry is constructed at import.
 */

import { patternIntentResolver } from "../intelligence/pattern-intent-resolver.js";
import type { IntentResolutionHints } from "../intelligence/intent-resolver.js";
import { intelligencePlatform } from "../intelligence/intelligence-platform.js";
import { CapabilityRegistry } from "../intelligence/capability-registry.js";
import type { Capability } from "../intelligence/types.js";
import {
  capabilityVerb, secondaryCapabilityFamilies, resolveCapabilityStatus,
} from "./benchmark/expectations.js";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function eq(name: string, actual: unknown, expected: unknown): void {
  check(name, Object.is(actual, expected), `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

/**
 * The hints every benchmark turn carries: the `floating` surface (production's default too), and
 * a FIXED temporal anchor so a matcher that reads "this week" cannot make this file's assertions
 * depend on the day it runs.
 */
const HINTS: IntentResolutionHints = { surface: "floating", temporalAnchor: "2026-07-10" };

/** The resolved capabilities for an utterance, in the resolver's own descending-confidence order. */
async function route(utterance: string): Promise<string[]> {
  const intents = await patternIntentResolver.resolve(utterance, HINTS);
  return intents.map((i) => i.capability);
}

/** The full pool, as `capability:verb@confidence` (`*` marks the always-on baseline). */
async function pool(utterance: string): Promise<string[]> {
  const intents = await patternIntentResolver.resolve(utterance, HINTS);
  return intents.map((i) => `${i.capability}:${i.verb}@${i.confidence}${i.baseline ? "*" : ""}`);
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  console.log("\n1. The six resolver defects BENCHINT3 attributed are closed");
  // -------------------------------------------------------------------------

  {
    // CB-016 — superlative nutrient form. Was: `meals:read@0.48`, the coverage floor.
    const r = await route("Which meals are highest in protein?");
    eq("CB-016 routes nutrition-discovery first", r[0], "nutrition-discovery");
  }

  {
    // CB-017 — the guard on the same matcher. "Least processed / most whole-food based" carries
    // a superlative and a meal noun but NO nutrient term, and must not become a ranking query.
    const r = await route("Which meals are the least processed or most whole-food based?");
    check("CB-017 does NOT acquire a nutrition-discovery route (no nutrient term)",
      !r.includes("nutrition-discovery"), r.join(", "));
  }

  {
    // CB-018 — interrogative ingredient filter. Was: `meals:read@0.48`.
    const r = await route("Which meals include salmon?");
    eq("CB-018 routes meal-discovery first", r[0], "meal-discovery");
  }

  {
    // CB-012 — the ownership boundary the resolver documents and the Meals Capability Card now
    // records: an ingredient filter WITH an ownership qualifier belongs to `meals`, not to its
    // discovery sibling. CB-018 and CB-012 must route differently, and this is the line.
    const r = await route("What chicken meals do I have?");
    eq("CB-012 stays with the owning `meals` capability", r[0], "meals");
    check("CB-012 never acquires a meal-discovery route", !r.includes("meal-discovery"), r.join(", "));
  }

  {
    // CB-019 — household-wide meal suitability. Was: two independent keyword floors.
    const r = await route("Which meals are suitable for everyone in my household?");
    eq("CB-019 routes meal-discovery first", r[0], "meal-discovery");
    check("CB-019 also routes household", r.includes("household"), r.join(", "));
  }

  {
    // CB-021 — the routing the resolver documented for two workstreams and never performed.
    const p = await pool("Recommend one meal that fits my goals and explain why.");
    check("CB-021 routes meal-discovery:search", p.some((x) => x.startsWith("meal-discovery:search")), p.join("  "));
    check("CB-021 routes profile:read NON-baseline (the fixture's named secondary)",
      p.some((x) => x.startsWith("profile:read") && !x.endsWith("*")), p.join("  "));
    check("CB-021 never asks for the unbound `recommend` verb",
      !p.some((x) => x.includes("meal-discovery:recommend")), p.join("  "));
  }

  {
    // SH-042 — "items" in a shopping frame. Was: `analyser:read` alone.
    const r = await route("Which items should I check for allergens or additives?");
    eq("SH-042 routes shopping first", r[0], "shopping");
    check("SH-042 still routes analyser — the check is read against the additives table",
      r.includes("analyser"), r.join(", "));
  }

  // -------------------------------------------------------------------------
  console.log("\n2. Keyword-fallback precision (RC2)");
  // -------------------------------------------------------------------------

  {
    // ND-058 — `nutritionally` defeated the old `nutrition(?:al)?\b` boundary.
    const r = await route("Which meals were strongest nutritionally this week?");
    check("ND-058 proposes nutrition-knowledge (the `nutritionally` boundary is fixed)",
      r.includes("nutrition-knowledge"), r.join(", "));
  }

  {
    // CG-085 — the planner fallback matched the VERB "plan". The most harmful of the twelve:
    // a nutrition question answered with a planner gap.
    const r = await route("I want to build muscle but also lower cholesterol. How should I plan?");
    check("CG-085 no longer routes planner on the bare verb \"plan\"", !r.includes("planner"), r.join(", "));
    check("CG-085 reaches nutrition-knowledge via the benefit vocabulary",
      r.includes("nutrition-knowledge"), r.join(", "));
  }

  {
    // The planner NOUN must still route. `week` is deliberately retained: it is the only planner
    // route for PL-027 and PL-028, whose fixtures name `planner`. Removing it would demote both
    // to gate R1 (cap 40), strictly worse than the R2 (cap 55) it would close.
    check("planner still routes on a planner noun phrase", (await route("show me my meal plan")).includes("planner"));
    check("PL-027 keeps its planner route (`week` is its ONLY one)",
      (await route("Have I repeated too many meals this week?")).includes("planner"));
    check("…and PL-027 loses it entirely without the token — which is why `week` is retained",
      !(await route("Have I repeated too many meals?")).includes("planner"));
    check("PL-028 keeps its planner route",
      (await route("Where can I add more vegetables to my plan this week?")).includes("planner"));
    check("…via the `my plan` noun phrase, NOT `week` — it does not depend on the token",
      (await route("Where can I add more vegetables to my plan?")).includes("planner"));
    check("the planner verb after a pronoun still does not route",
      !(await route("help me plan")).includes("planner"));
  }

  {
    // The nutrient/benefit vocabulary floor consults the two canonical term lists rather than a
    // third word list. These two are the exact words BENCHINT3 proved the old fallback could not see.
    check("`protein` alone reaches nutrition-knowledge",
      (await route("which foods are high in protein")).includes("nutrition-knowledge"));
    check("`cholesterol` alone reaches nutrition-knowledge",
      (await route("what helps lower cholesterol")).includes("nutrition-knowledge"));
  }

  // -------------------------------------------------------------------------
  console.log("\n3. The coverage floor never displaces the personalisation baseline");
  // -------------------------------------------------------------------------

  {
    // This is the invariant that forced the vocabulary floor to 0.49 rather than 0.58. If it
    // ever rises above 0.50 the `profile` baseline falls out of the MAX_INTENTS=4 cap on exactly
    // the compound turns INT33's tests pin, and the Context Composition Engine is handed the
    // entire 611-food registry on turns that never asked for it (INT17 §8 open item 7).
    const p = await pool("Which meals are highest in protein?");
    const baselineIdx = p.findIndex((x) => x.endsWith("*"));
    const floorIdx = p.findIndex((x) => x.startsWith("nutrition-knowledge:read@0.49"));
    check("the profile baseline survives in the pool", baselineIdx >= 0, p.join("  "));
    check("…and outranks the 0.49 nutrient/benefit coverage floor",
      floorIdx === -1 || baselineIdx < floorIdx, p.join("  "));
    check("…and the pool never exceeds MAX_INTENTS", p.length <= 4, p.join("  "));
  }

  // -------------------------------------------------------------------------
  console.log("\n4. A weekday is never a household member (PL-030)");
  // -------------------------------------------------------------------------

  {
    const r = await route("What would be a good quick dinner for Tuesday?");
    check("PL-030 no longer routes household-discovery on \"Tuesday\"",
      !r.includes("household-discovery"), r.join(", "));
    eq("…and the capability that answers it now wins the turn", r[0], "meal-discovery");

    // The guard must exclude the WEEKDAY, not the sentence. Identical utterance, one token
    // changed: a real given name still reaches the household. Month names are deliberately not
    // excluded — "June" is an ordinary given name, and a household member called June must stay
    // reachable. This asserts the boundary of the guard rather than an accident of it.
    check("the same sentence with a real name still reaches household-discovery",
      (await route("What would be a good quick dinner for Sarah?")).includes("household-discovery"));
    check("…and a household member named June is not lost to the weekday guard",
      (await route("What would be a good quick dinner for June?")).includes("household-discovery"));
  }

  // -------------------------------------------------------------------------
  console.log("\n5. The owner ↔ discovery relationship is declared once, and well formed");
  // -------------------------------------------------------------------------

  {
    const registry = intelligencePlatform.registry;
    const all = registry.list();
    const discovery = all.filter((c) => c.id.endsWith("-discovery"));

    check("the registry declares at least one discovery capability", discovery.length > 0);
    for (const cap of discovery) {
      check(`${cap.id} declares its owner`, registry.discoveryOwnerOf(cap.id) != null);
      check(`…and ${cap.id} is recognised as a discovery capability`, registry.isDiscoveryCapability(cap.id));
    }

    // Every declared owner exists and is itself an owner. This is what the constructor validates;
    // asserting it here means a regression names the offending capability rather than a stack trace.
    for (const cap of all) {
      const owner = cap.discoveryOf;
      if (owner == null) continue;
      check(`${cap.id} -> ${owner} names a registered capability`, registry.get(owner) != null);
      check(`…and ${owner} is not itself a discovery capability`, !registry.isDiscoveryCapability(owner));
    }

    // An owner has at most one discovery sibling.
    const owners = all.map((c) => c.discoveryOf).filter((o): o is string => o != null);
    eq("no owner has two discovery siblings", owners.length, new Set(owners).size);

    // The predicate the Context Composition Engine's merge guard depends on (INT17 §4.5).
    check("an owner and its own discovery sibling are the same entity family",
      registry.sameEntityFamily("meals", "meal-discovery"));
    check("…symmetrically", registry.sameEntityFamily("meal-discovery", "meals"));
    check("a capability is its own family", registry.sameEntityFamily("meals", "meals"));
    check("two owners are NOT the same family", !registry.sameEntityFamily("meals", "pantry"));
    check("two discovery capabilities are NOT the same family",
      !registry.sameEntityFamily("meal-discovery", "pantry-discovery"));
    check("an owner and an unrelated discovery capability are NOT the same family",
      !registry.sameEntityFamily("meals", "pantry-discovery"));
  }

  {
    // A malformed graph must fail LOUDLY at construction — the silence INT17 §8 open item 5
    // describes is the whole reason this field exists.
    const base = intelligencePlatform.registry.list()[0];
    const mk = (over: Partial<Capability>): Capability => ({ ...base, ...over });

    const throws = (seed: Capability[]): boolean => {
      try { new CapabilityRegistry(seed, []); return false; } catch { return true; }
    };

    check("a self-referential discovery owner throws",
      throws([mk({ id: "a", discoveryOf: "a" })]));
    check("a dangling discovery owner throws",
      throws([mk({ id: "a-discovery", discoveryOf: "nope" })]));
    check("a discovery capability naming another discovery capability throws",
      throws([mk({ id: "a", discoveryOf: "b" }), mk({ id: "b", discoveryOf: "c" }), mk({ id: "c" })]));
    check("two siblings claiming one owner throws",
      throws([mk({ id: "a-discovery", discoveryOf: "a" }), mk({ id: "a-search", discoveryOf: "a" }), mk({ id: "a" })]));
    check("a well-formed pair constructs cleanly",
      !throws([mk({ id: "a-discovery", discoveryOf: "a" }), mk({ id: "a" })]));
  }

  // -------------------------------------------------------------------------
  console.log("\n6. The expectation record carries what the fixture actually says");
  // -------------------------------------------------------------------------

  {
    eq("a compound expectation yields its secondary",
      JSON.stringify(secondaryCapabilityFamilies("shopping-list + analyser")), JSON.stringify(["analyser"]));
    eq("…normalised through the same alias table as the primary",
      JSON.stringify(secondaryCapabilityFamilies("meal-discovery.search + household.read")), JSON.stringify(["household"]));
    eq("a single-capability expectation yields none",
      JSON.stringify(secondaryCapabilityFamilies("profile.read")), JSON.stringify([]));
    eq("a secondary that aliases to the primary is not repeated",
      JSON.stringify(secondaryCapabilityFamilies("diet-foods + nutrition")), JSON.stringify([]));

    eq("the fixture's verb is read from its primary token", capabilityVerb("planner.suggest + meals"), "suggest");
    eq("a token with no verb yields null", capabilityVerb("shopping-list + analyser"), null);
    // A dot-suffix that is a SCOPE, not a verb, must not un-require the route.
    eq("a non-verb dot-suffix yields null, keeping the route required",
      capabilityVerb("nutrition.meal-search"), null);
    eq("…and that redirect still resolves to an executable capability",
      resolveCapabilityStatus("nutrition-discovery", null), "registered-executable");
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

console.log("\nBENCHINT4 — intent routing attribution (BENCHINT3 §3 evidence, pinned)");
main().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
