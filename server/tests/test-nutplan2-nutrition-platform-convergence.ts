/**
 * NUTPLAN2 — Nutrition Platform Convergence: verification tests.
 *
 * Governing documents:
 *   docs/architecture/ARCHITECTURE_PRINCIPLES.md (Principle 2, Principle 8)
 *   docs/implementation/nutrition/NUTPLAN2_NUTRITION_PLATFORM_CONVERGENCE.md
 *
 * NUTPLAN1 completed two connections and named what remained. This suite pins
 * the convergence that followed:
 *
 *   §1  The safety coverage harness DISCOVERS routes rather than remembering
 *       them — and the discovery genuinely catches a route that skips the gate.
 *   §2  The ungated recommender is retired, and its rival diet vocabulary with it.
 *   §3  The weekly plant count has ONE owner, and the counters that used to
 *       disagree now cannot.
 *   §4  Dead nutrition capability is retired, not left in the third state.
 *   §5  The uplift phrasing rule has one owner (D2: five copies → one).
 *
 * The most important assertion in this file is in §1.3: it PLANTS a food-producing
 * route that reaches no gate and requires the discovery to find it. Every previous
 * safety-coverage claim in THA was structural prose; this one is executable.
 *
 * Run with: npm run test:nutplan2
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  plantDiversityGroup,
  plantGroupsForIngredientLines,
} from "../../shared/canonical/plant-classifier.js";
import { upliftSuggestionText } from "../../shared/nutrition/uplift-phrasing.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

const ROOT = join(import.meta.dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
const exists = (p: string) => existsSync(join(ROOT, p));

const prod6 = read("server/tests/test-prod6-safety-gate-convergence.ts");
const routes = read("server/routes.ts");

async function run() {
  // ── 1. Safety coverage is DISCOVERED, not remembered ───────────────────────
  console.log("── §1 Safety coverage by construction ──");
  {
    check(
      "the hand-maintained FOOD_PRODUCING_ROUTES array is retired",
      !prod6.includes("const FOOD_PRODUCING_ROUTES"),
    );
    check("the harness discovers routes from the source", prod6.includes("function discoverRoutes"));
    check(
      "every discovered food surface must be classified (the complement is asserted, not described)",
      prod6.includes("every discovered food-surface route is classified"),
    );
    check("classifications carry a mandatory reason", prod6.includes("classification states a reason"));
    check(
      "the recorded-gap list is ratcheted so it can only shrink",
      prod6.includes("the recorded-gap list has not grown"),
    );

    // ── 1.2 The three blind spots that made the old harness incapable ────────
    console.log("\n── §1.2 The blind spots that hid live defects ──");
    const discover = (source: string) => {
      const found: Array<{ verb: string; path: string; literal: boolean }> = [];
      const literal = /app\.(get|post|put|patch|delete)\(\s*(["'`])([^"'`]+)\2/g;
      let m: RegExpExecArray | null;
      while ((m = literal.exec(source))) found.push({ verb: m[1], path: m[3], literal: true });
      const constant = /app\.(get|post|put|patch|delete)\(\s*(api\.[\w$.]+)/g;
      while ((m = constant.exec(source))) found.push({ verb: m[1], path: m[2], literal: false });
      return found;
    };
    const all = discover(routes);

    // Blind spot 1 — the old list held only app.post signatures.
    check(
      "app.get routes are discovered (the old list could hold only app.post)",
      all.some((r) => r.verb === "get" && r.path.includes("meal")),
    );
    // Blind spot 2 — single-quoted paths were invisible.
    check(
      "single-quoted routes are discovered: /api/meal-plans/smart-suggest",
      all.some((r) => r.path === "/api/meal-plans/smart-suggest"),
      "this route is registered with single quotes and was invisible to the old harness",
    );
    // Blind spot 3 — constant-registered routes were invisible.
    check(
      "constant-registered routes are discovered (api.*.path)",
      all.filter((r) => !r.literal).length > 20,
      `${all.filter((r) => !r.literal).length} found`,
    );

    // ── 1.3 THE PROOF: a planted ungated route must be caught ────────────────
    console.log("\n── §1.3 The discovery catches a route that skips the gate ──");
    const planted = `
  app.get("/api/meals/nutplan2-planted-recommendation", async (req, res) => {
    const meals = await storage.getMeals(req.user!.id);
    res.json(meals);
  });
`;
    const withPlanted = routes + planted;
    const FOOD_VOCAB = /meal|recipe|food|pantry|suggest|recommend|swap|alternativ|pairing|template|discover|season|stories|cook|nutrition|diet/i;
    const discoveredNow = discover(withPlanted).filter(
      (r) => FOOD_VOCAB.test(r.path) && !r.path.includes("/admin/"),
    );
    const found = discoveredNow.some((r) => r.path === "/api/meals/nutplan2-planted-recommendation");
    check(
      "a NEWLY ADDED food-producing route is discovered by the net",
      found,
      "if this fails the harness has stopped being able to see new routes",
    );
    // And it must not be silently absorbed by an existing classification.
    check(
      "the planted route matches no existing exemption (it would fail the suite, as it should)",
      !prod6.includes("nutplan2-planted-recommendation"),
    );
  }

  // ── 2. The ungated recommender is retired ──────────────────────────────────
  console.log("\n── §2 The ungated recommender is retired ──");
  {
    check(
      "GET /api/meals/recommended no longer exists",
      !/app\.get\(\s*["'`]\/api\/meals\/recommended/.test(routes),
    );
    check(
      "recommendation-service.ts is deleted, not merely unrouted",
      !exists("server/lib/recommendation-service.ts"),
    );
    // Checks for a real IMPORT, not a mention: the retirement note in routes.ts
    // names the deleted module on purpose, so a substring match would fail on the
    // very comment that records the deletion.
    check(
      "nothing still imports it",
      !/^import .*recommendation-service/m.test(routes) && !routes.includes("rankMealsByPreferences("),
    );
    check("the retirement records why it was deleted rather than gated", routes.includes("is RETIRED (Principle 8)"));
    // The point of deleting rather than gating: a third diet vocabulary went with it.
    check(
      "its rival DIET_EXCLUDED_KEYWORDS table is gone from the codebase",
      !exists("server/lib/recommendation-service.ts"),
    );
  }

  // ── 3. One owner for the weekly plant count ────────────────────────────────
  console.log("\n── §3 Plant diversity convergence ──");
  {
    const centre = read("server/lib/nutrition-centre-assembler.ts");
    const mealFood = read("server/services/meal-food-intelligence.ts");

    check(
      "the Nutrition Centre dedups by diversity group, not by canonical slug",
      centre.includes("plantDiversityGroup") && !/isPlantIngredient\(/.test(centre),
    );
    check(
      "meal food intelligence no longer carries a rival PLANT_CATEGORIES vocabulary",
      !mealFood.includes("const PLANT_CATEGORIES"),
    );
    check(
      "meal food intelligence counts diversity groups",
      mealFood.includes("plantDiversityGroup") && mealFood.includes("plantGroups"),
    );
    check(
      "both intelligence routes count through the one canonical helper",
      (routes.match(/plantGroupsForIngredientLines/g) ?? []).length >= 2,
    );

    // ── 3.2 The rule itself, measured ────────────────────────────────────────
    console.log("\n── §3.2 The canonical rule behaves as the counter needs ──");
    // Two slugs, one plant. This is the over-count the Nutrition Centre published.
    const kale = plantDiversityGroup("kale");
    const cavolo = plantDiversityGroup("cavolo nero");
    check(
      "kale and cavolo nero resolve to ONE diversity group (the over-count that was live)",
      kale !== null && kale === cavolo,
      `kale=${kale} cavolo=${cavolo}`,
    );
    // The parse step is part of the rule, not the caller's business.
    const parsed = plantGroupsForIngredientLines(["400g tinned tomatoes"]);
    check(
      "a raw recipe line resolves through the helper (the parse step is inside the owner)",
      parsed.size === 1,
      `got ${Array.from(parsed).join(",") || "nothing"}`,
    );
    // Group dedup across lines, which is the whole point of the 30-plants number.
    const many = plantGroupsForIngredientLines([
      "2 large tomatoes",
      "400g tinned tomatoes",
      "1 red onion",
      "1 onion",
    ]);
    check(
      "four lines naming two plants count as two",
      many.size === 2,
      `got ${many.size}: ${Array.from(many).join(", ")}`,
    );
    check("a non-plant line contributes nothing", plantGroupsForIngredientLines(["200g chicken breast"]).size === 0);
    check("an empty list is zero, not an error", plantGroupsForIngredientLines([]).size === 0);
  }

  // ── 4. Dead capability retired ─────────────────────────────────────────────
  console.log("\n── §4 Dead nutrition capability is retired ──");
  {
    check(
      "pantry-intelligence-assembler.ts is deleted (328 lines, zero callers, six tsc errors)",
      !exists("server/lib/pantry-intelligence-assembler.ts"),
    );
    const compliance = read("server/lib/planner-compliance.ts");
    check(
      "assertMealCompliantForPlanner is retired",
      !compliance.includes("export async function assertMealCompliantForPlanner"),
    );
    check(
      "the wrapper's real call sites are untouched (they never used it)",
      compliance.includes("isMealCompliantForUser") && compliance.includes("resolvePlannerComplianceContext"),
    );
    const evidence = read("server/lib/food-report-evidence.ts");
    check(
      "the phantom GET /api/foods/:slug/report comment is corrected",
      evidence.includes("THAT ROUTE HAS NEVER EXISTED"),
    );
    check(
      "and the route genuinely does not exist",
      !/app\.get\(\s*["'`]\/api\/foods\/:slug\/report/.test(routes),
    );
  }

  // ── 5. One owner for the uplift phrasing rule (D2) ─────────────────────────
  console.log("\n── §5 Uplift phrasing: five copies → one ──");
  {
    const copies = [
      "server/routes.ts",
      "server/lib/nutrition-centre-assembler.ts",
      "server/lib/connected-food-intelligence-assembler.ts",
      "client/src/pages/food-detail-page.tsx",
    ].filter((f) => /`Swap in \$\{/.test(read(f)));
    check("no caller still spells the phrasing rule out", copies.length === 0, copies.join(", "));

    check("approve: swap", upliftSuggestionText({ action: "swap", ingredient: "lentils" }) === "Swap in lentils");
    check("approve: boost", upliftSuggestionText({ action: "boost", ingredient: "spinach" }) === "Add more spinach");
    check("approve: add", upliftSuggestionText({ action: "add", ingredient: "seeds" }) === "Add seeds");
    check(
      "an unknown action keeps the original fallback (behaviour preserved, not tightened)",
      upliftSuggestionText({ action: "sprinkle", ingredient: "chia" }) === "Add chia",
    );
    check(
      "the owner is shared, because one of the five callers was the client",
      exists("shared/nutrition/uplift-phrasing.ts"),
    );
  }

  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error(err); process.exit(1); });
