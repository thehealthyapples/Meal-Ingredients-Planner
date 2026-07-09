/**
 * KNOW3 — canonical → knowledge food binding verification.
 *
 * `canonical_food.knowledge_food_slug` is how a canonical identity reaches its
 * nutrients and benefits. Seven canonical foods sat beside an identically named
 * knowledge food with nothing joining them, because the gate that reconciles an
 * incoming draft reads `resolution.knowledgeFoodSlug` — which is null for an
 * unbound canonical food, so the draft looked new and promoted cleanly.
 *
 * Nothing enforced the binding, so nothing noticed. These checks are the
 * enforcement. Three layers:
 *
 *   1. The binder refuses to guess    — alias matches never auto-bind.
 *   2. The seed refuses to ship a gap — validateCanonicalSeed() carries the audit.
 *   3. The gate names the binding owed — the blind spot is closed at authoring time.
 *
 * Layer 2 is asserted by REMOVING a binding and proving the validator fails.
 * A validator that has never been seen to refuse is a validator nobody has tested.
 *
 * Run with:  npm run test:canonical-knowledge-binding
 */
import { writeFileSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { CANONICAL_SEED } from "../../shared/canonical/foods.js";
import { FOOD_SEED } from "../../shared/knowledge/foods.js";
import {
  validateCanonicalSeed,
  auditKnowledgeBindings,
  resolveKnowledgeBinding,
  knowledgeFoodClaims,
  bindables,
  DEFERRED_KNOWLEDGE_BINDINGS,
  KNOWLEDGE_BINDING_COVERAGE,
  resolveCanonicalFood,
  type BindableKey,
} from "../../shared/canonical/index.js";
import { gateCanonicalFood } from "../lib/canonical-foods-gate.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

const foodEntry = (slug: string) => CANONICAL_SEED.find((e) => e.food.slug === slug)!;

/** The seven bindings KNOW3 assigned. Each is identity-to-identity name equality. */
const KNOW3_BINDINGS: Array<[string, string]> = [
  ["grapefruit", "grapefruit"],
  ["semi-skimmed-milk", "semi-skimmed-milk"],
  ["plain-wheat-flour", "plain-wheat-flour"],
  ["pearl-couscous", "pearl-couscous"],
  ["wholewheat-pasta", "wholewheat-pasta"],
  ["cacao-powder", "cacao-powder"],
  ["kombucha", "kombucha"],
];

async function run() {
  console.log("\nKNOW3 — Canonical → Knowledge Food Binding\n");

  // ── 1. The seed is clean, and the bindings landed ───────────────────────────
  console.log("Seed integrity");
  const problems = validateCanonicalSeed();
  check("validateCanonicalSeed() is clean", problems.length === 0, problems.slice(0, 3).join(" | "));

  const audit = auditKnowledgeBindings();
  check("auditKnowledgeBindings() reports no problems", audit.problems.length === 0, audit.problems.slice(0, 3).join(" | "));

  const knowledgeSlugs = new Set(FOOD_SEED.map((f) => f.slug));
  for (const [canonical, knowledge] of KNOW3_BINDINGS) {
    const e = foodEntry(canonical);
    check(`canonical "${canonical}" binds knowledge "${knowledge}"`,
      !!e && e.food.knowledgeFoodSlug === knowledge, `got ${JSON.stringify(e?.food.knowledgeFoodSlug)}`);
    check(`knowledge food "${knowledge}" exists`, knowledgeSlugs.has(knowledge));
  }

  // Every declared binding points at a real knowledge food. validateCanonicalSeed
  // already checks this; asserting it here means a regression names itself.
  const dangling = bindables().filter((b) => b.knowledgeFoodSlug && !knowledgeSlugs.has(b.knowledgeFoodSlug));
  check("no binding points at a knowledge food that does not exist", dangling.length === 0,
    dangling.map((b) => `${b.slug}→${b.knowledgeFoodSlug}`).join(", "));

  // ── 2. One canonical identity, one owner per fact ───────────────────────────
  console.log("\nOne owner per fact");
  const claims = knowledgeFoodClaims();
  const doubled: string[] = [];
  claims.forEach((owners, slug) => { if (owners.length > 1) doubled.push(`${slug}: ${owners.join(", ")}`); });
  check("no knowledge food is bound by two canonical identities", doubled.length === 0, doubled.join(" | "));

  check("the canonical seed mints no duplicate food identity",
    new Set(CANONICAL_SEED.map((e) => e.food.slug)).size === CANONICAL_SEED.length);

  // The 7 bindings must not have stolen a knowledge food from an existing owner.
  for (const [canonical, knowledge] of KNOW3_BINDINGS) {
    check(`knowledge "${knowledge}" is claimed only by canonical "${canonical}"`,
      (claims.get(knowledge) ?? []).join(",") === `food:${canonical}`,
      (claims.get(knowledge) ?? []).join(", "));
  }

  // ── 3. The binder never fabricates ──────────────────────────────────────────
  console.log("\nThe binder refuses to guess");

  // `pepper` (the bell pepper plant, all colours) shares the alias "bell pepper"
  // with knowledge `red-pepper`. An alias-tolerant matcher binds them — giving the
  // parent the red variety's facts, and knowledge `red-pepper` a second claimant
  // on top of the `red-pepper` VARIETY that already owns it.
  const pepper = resolveKnowledgeBinding({ slug: "pepper", name: "Pepper" });
  check("canonical `pepper` does not bind knowledge `red-pepper` via a shared alias",
    pepper.kind !== "unique", pepper.kind === "unique" ? `bound to ${pepper.knowledgeFoodSlug}` : "");
  check("canonical `pepper` stays unbound in the seed", foodEntry("pepper").food.knowledgeFoodSlug == null);

  // An alias is a pointer, not proof of identity — in either direction.
  const aliasOnly = resolveKnowledgeBinding({ slug: "cavolo-nero", name: "Cavolo Nero" });
  check("a name that reaches a knowledge food only by its alias set never auto-binds",
    aliasOnly.kind !== "unique", aliasOnly.kind);

  // A name with no knowledge food is an honest gap, not a defect and not a guess.
  for (const slug of ["ghee", "gorgonzola", "mutton", "coffee"]) {
    const e = foodEntry(slug);
    const b = resolveKnowledgeBinding({ slug: e.food.slug, name: e.food.name });
    check(`canonical "${slug}" has no knowledge food — reported as a gap, not invented`, b.kind === "none", b.kind);
  }
  check("gaps are counted, not hidden", audit.unmatched > 0 && audit.unmatched === KNOWLEDGE_BINDING_COVERAGE.unmatched);

  // A variety with a null binding INHERITS its parent's knowledge food (resolver.ts).
  // It is not an unbound identity, and must not be reported as one.
  const cherry = resolveKnowledgeBinding(
    { slug: "cherry-tomato", name: "Cherry Tomato" },
    { isVariety: true, inheritsFrom: "tomatoes" },
  );
  check("a variety named as a form of its parent's knowledge food is `inherited`",
    cherry.kind === "inherited" && cherry.from === "tomatoes", cherry.kind);
  check("the same variety read as a FOOD would be refused, not bound",
    resolveKnowledgeBinding({ slug: "cherry-tomato", name: "Cherry Tomato" }).kind === "ambiguous");
  check("inherited varieties are counted", audit.inherited > 0);

  // ── 4. Ambiguous matches are blocked for human review ───────────────────────
  console.log("\nAmbiguity is blocked, with a stated reason");
  const deferredKeys = Object.keys(DEFERRED_KNOWLEDGE_BINDINGS).sort();
  check("exactly two bindings are deferred", deferredKeys.length === 2, deferredKeys.join(", "));
  check("they are `food:lentils` and `food:pasta`", deferredKeys.join(",") === "food:lentils,food:pasta", deferredKeys.join(","));

  for (const key of deferredKeys as BindableKey[]) {
    const entry = DEFERRED_KNOWLEDGE_BINDINGS[key]!;
    const slug = key.slice("food:".length);
    const e = foodEntry(slug);
    check(`${key}: reason is stated`, entry.reason.trim().length > 20);
    check(`${key}: is genuinely unbound`, e.food.knowledgeFoodSlug == null);
    const b = resolveKnowledgeBinding(
      { slug: e.food.slug, name: e.food.name },
      { claims, selfKey: key },
    );
    check(`${key}: the binder independently calls it ambiguous`, b.kind === "ambiguous", b.kind);
    if (b.kind === "ambiguous") {
      check(`${key}: recorded candidates match the seed`,
        [...entry.candidates].sort().join(",") === b.candidates.join(","),
        `recorded [${entry.candidates}] vs actual [${b.candidates}]`);
    }
  }

  // `pasta` is refused because knowledge `pasta` already has a canonical claimant.
  check("knowledge `pasta` is bound by canonical `wheat-pasta`, not `pasta`",
    (claims.get("pasta") ?? []).join(",") === "food:wheat-pasta", (claims.get("pasta") ?? []).join(","));

  // ── 5. LOAD-BEARING: the validator is seen to refuse ────────────────────────
  // Every check above passes on a clean tree. None of them proves the gate bites.
  // Remove a binding and the seed must refuse — that is the whole mechanism.
  console.log("\nThe seed refuses a missing or duplicated binding (load-bearing)");

  const grapefruit = foodEntry("grapefruit").food;
  const savedGrapefruit = grapefruit.knowledgeFoodSlug;
  grapefruit.knowledgeFoodSlug = null;
  const withMissing = validateCanonicalSeed();
  check("removing a binding makes validateCanonicalSeed() refuse",
    withMissing.length > 0 && withMissing.some((p) => p.includes('food "grapefruit"') && p.includes("no binding is declared")),
    withMissing.slice(0, 2).join(" | "));
  check("the refusal names the knowledge food to bind",
    withMissing.some((p) => p.includes('knowledgeFoodSlug: "grapefruit"')));
  grapefruit.knowledgeFoodSlug = savedGrapefruit;
  check("restoring the binding makes it clean again", validateCanonicalSeed().length === 0);

  // Two canonical identities on one knowledge food.
  const kombucha = foodEntry("kombucha").food;
  const savedKombucha = kombucha.knowledgeFoodSlug;
  kombucha.knowledgeFoodSlug = "grapefruit";
  const withDouble = auditKnowledgeBindings().problems;
  check("two canonical identities on one knowledge food is refused",
    withDouble.some((p) => p.includes('knowledge_food "grapefruit"') && p.includes("one owner per fact")),
    withDouble.slice(0, 2).join(" | "));
  kombucha.knowledgeFoodSlug = savedKombucha;

  // A deferral that no longer describes reality is refused, so the register cannot rot.
  const register = DEFERRED_KNOWLEDGE_BINDINGS as Record<string, { candidates: string[]; reason: string }>;
  register["food:tomato"] = { candidates: ["tomatoes"], reason: "fabricated deferral for a bound food" };
  const withStale = auditKnowledgeBindings().problems;
  check("a deferral on an already-bound food is refused as stale",
    withStale.some((p) => p.includes('food "tomato"') && p.includes("stale deferral")),
    withStale.slice(0, 2).join(" | "));
  delete register["food:tomato"];

  const savedLentils = register["food:lentils"];
  register["food:lentils"] = { candidates: ["lentils"], reason: savedLentils.reason };
  check("a deferral whose recorded candidates drift from the seed is refused",
    auditKnowledgeBindings().problems.some((p) => p.includes('food "lentils"') && p.includes("stale")));
  register["food:lentils"] = savedLentils;
  check("the register is restored and the audit is clean", auditKnowledgeBindings().problems.length === 0);

  // ── 6. The gate's blind spot is closed ──────────────────────────────────────
  console.log("\nThe gate names the binding a draft owes");

  // The mechanism, stated plainly: an unbound canonical food resolves with a null
  // knowledgeFoodSlug, which `isForeignIdentity()` discards as "no collision".
  check("a bound canonical food exposes its knowledge food to the resolver",
    resolveCanonicalFood("tomato").knowledgeFoodSlug === "tomatoes");
  check("an unbound canonical food resolves with a null knowledge food (the blind spot)",
    resolveCanonicalFood("ghee").matched && resolveCanonicalFood("ghee").knowledgeFoodSlug === null);

  const dir = mkdtempSync(join(tmpdir(), "know3-"));
  try {
    // `ghee` is an existing canonical food with no knowledge food and no binding.
    // Before KNOW3 this draft promoted silently, orphaning the two identities.
    const draft = join(dir, "ghee.yaml");
    writeFileSync(draft, [
      "record:",
      "  canonical_slug: ghee",
      "  display_name: Ghee",
      "identity:",
      "  food_category: oil",
      "  aliases:",
      "  - clarified butter",
      "nutrition_profile:",
      "  notable_nutrients:",
      "  - nutrient: vitamin-a",
      "    confidence: well_established",
      "benefit_language:",
      "- area: gut-health",
      "",
    ].join("\n"));

    const res = await gateCanonicalFood(draft);
    check("the draft still promotes — it is new knowledge, not a fork", res.outcome === "promote", `${res.outcome}: ${res.errors.join("; ")}`);
    check("the gate records the canonical binding the draft owes",
      res.identity.requiredBinding?.canonicalFoodSlug === "ghee" && res.identity.requiredBinding?.knowledgeFoodSlug === "ghee",
      JSON.stringify(res.identity.requiredBinding));
    check("the emitted graduation record carries that binding",
      res.record?.canonicalBinding?.knowledgeFoodSlug === "ghee");
    check("the reviewer is warned in prose",
      res.warnings.some((w) => w.includes("declares no knowledgeFoodSlug") && w.includes("seed:canonical refuses")),
      res.warnings.join(" | "));

    // A draft naming a canonical food that IS bound is a fork, and is blocked. A
    // blocked draft is never promoted, so it owes no binding.
    const fork = join(dir, "carrot.yaml");
    writeFileSync(fork, [
      "record:",
      "  canonical_slug: carrot",
      "  display_name: Carrot",
      "identity:",
      "  food_category: vegetable",
      "nutrition_profile:",
      "  notable_nutrients:",
      "  - nutrient: fibre",
      "    confidence: well_established",
      "benefit_language:",
      "- area: gut-health",
      "",
    ].join("\n"));
    const forked = await gateCanonicalFood(fork);
    check("a draft that would fork a bound identity is still blocked", forked.outcome === "blocked", forked.outcome);
    check("a blocked draft owes no binding", forked.identity.requiredBinding === null);

    // `pasta` names the unbound canonical parent AND is already a knowledge identity.
    // The seed owns it, so there is nothing to promote — and nothing to bind. A gate
    // that demanded a binding here would contradict the register that defers it.
    const owned = join(dir, "pasta.yaml");
    writeFileSync(owned, [
      "record:",
      "  canonical_slug: pasta",
      "  display_name: Pasta",
      "identity:",
      "  food_category: whole_grain",
      "nutrition_profile:",
      "  notable_nutrients:",
      "  - nutrient: fibre",
      "    confidence: well_established",
      "benefit_language:",
      "- area: gut-health",
      "",
    ].join("\n"));
    const already = await gateCanonicalFood(owned);
    check("a draft the seed already owns is `existing`", already.outcome === "existing", already.outcome);
    check("an already-owned draft owes no binding", already.identity.requiredBinding === null);
    check("...and claims no promotion in its warnings",
      !already.warnings.some((w) => w.includes("Promoting requires")), already.warnings.join(" | "));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  // ── 7. Coverage is measured, not asserted ──────────────────────────────────
  console.log("\nCoverage");
  const c = KNOWLEDGE_BINDING_COVERAGE;
  check("every canonical food and variety is accounted for",
    c.total === CANONICAL_SEED.length + CANONICAL_SEED.reduce((n, e) => n + (e.varieties?.length ?? 0), 0),
    `${c.total}`);
  console.log(`  bound=${c.bound} deferred=${c.deferred} inherited=${c.inherited} unmatched=${c.unmatched} (${c.pctOfBindable}% of bindable)`);
  console.log(`  ${audit.warnings.length} binding(s) rest on editorial judgement the audit cannot verify`);

  console.log(`\n${failed === 0 ? "✅" : "❌"} ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((err) => { console.error(err); process.exit(1); });
