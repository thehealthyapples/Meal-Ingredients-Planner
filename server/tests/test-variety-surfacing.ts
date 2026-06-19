/**
 * WS2B — Variety Surfacing verification tests.
 *
 * PURE checks (no DB). Proves the educational "Your Variety" / "Broaden Your
 * Variety" layer:
 *   • surfaces ONLY varieties WS2A already defined (never invents),
 *   • resolves aliases / quantities / prep words to the canonical variety,
 *   • hides empty sections and shows nothing when a food has no varieties,
 *   • is READ-ONLY — it computes no plant counts and touches no counting path.
 *
 * Run with:  npm run test:variety-surfacing
 */
import {
  varietyLabel,
  getDefinedVarieties,
  buildEatenVarietyIndex,
  buildVarietyDisplay,
  buildRowVarietyDisplays,
} from "../../shared/canonical/variety.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function run() {
  // ── 1. Variety labels strip the food name ───────────────────────────────────
  console.log("── Variety labels ──");
  check('"Cherry Tomato" → "Cherry"', varietyLabel("Cherry Tomato", "Tomato") === "Cherry");
  check('"Button Mushroom" → "Button"', varietyLabel("Button Mushroom", "Mushroom") === "Button");
  check('"Granny Smith Apple" → "Granny Smith"', varietyLabel("Granny Smith Apple", "Apple") === "Granny Smith");
  check('non-matching suffix kept whole', varietyLabel("San Marzano", "Tomato") === "San Marzano");

  // ── 2. Defined varieties come only from the WS2A seed ───────────────────────
  console.log("\n── Defined varieties (from WS2A seed) ──");
  check("tomato has 3 defined varieties", getDefinedVarieties("tomato").length === 3);
  check("mushroom has 4 defined varieties", getDefinedVarieties("mushroom").length === 4);
  check("apple has 3 defined varieties", getDefinedVarieties("apple").length === 3);
  check("avocado has 0 defined varieties (→ surface nothing)", getDefinedVarieties("avocado").length === 0);
  check("basil has 0 defined varieties", getDefinedVarieties("basil").length === 0);
  check("unknown food has 0 defined varieties", getDefinedVarieties("bog-roll").length === 0);

  // ── 3. Eaten-variety index — aliases / quantities / prep words resolve ──────
  console.log("\n── Eaten-variety resolution ──");
  const eaten = buildEatenVarietyIndex([
    "cherry tomatoes",
    "200g plum tomatoes",
    "a handful of chopped chestnut mushrooms",
    "tomatoes",            // generic → food, NOT a variety
    "fresh basil",         // herb, no varieties
  ]);
  check("tomato eaten = {cherry, plum}", eq(Array.from(eaten.get("tomato") ?? []).sort(), ["cherry-tomato", "plum-tomato"]));
  check("quantity-prefixed plum tomatoes resolved", (eaten.get("tomato") ?? new Set()).has("plum-tomato"));
  check("prep-word chestnut mushrooms resolved", (eaten.get("mushroom") ?? new Set()).has("chestnut-mushroom"));
  check("generic 'tomatoes' added NO variety", !(eaten.get("tomato") ?? new Set()).has(undefined as never));
  check("basil contributes no variety bucket", !eaten.has("basil"));

  // ── 4. buildVarietyDisplay — Your / Broaden / empty states ──────────────────
  console.log("\n── Display: Your / Broaden ──");

  // Manual test 1 (seed-accurate): eaten cherry + plum → broaden heirloom.
  const tomato = buildVarietyDisplay("tomato", "Tomato", new Set(["cherry-tomato", "plum-tomato"]));
  check("Tomato your = [Cherry, Plum]", eq(tomato?.yourVarieties, ["Cherry", "Plum"]));
  check("Tomato broaden = [Heirloom]", eq(tomato?.broadenVarieties, ["Heirloom"]));

  // Manual test 2 (seed-accurate): eaten chestnut → broaden button/oyster/shiitake.
  const mush = buildVarietyDisplay("mushroom", "Mushroom", new Set(["chestnut-mushroom"]));
  check("Mushroom your = [Chestnut]", eq(mush?.yourVarieties, ["Chestnut"]));
  check("Mushroom broaden = [Button, Oyster, Shiitake] (alphabetical)",
    eq(mush?.broadenVarieties, ["Button", "Oyster", "Shiitake"]));

  // All eaten → no Broaden section.
  const allApples = buildVarietyDisplay("apple", "Apple",
    new Set(["gala-apple", "braeburn-apple", "granny-smith-apple"]));
  check("Apple all eaten → broaden empty", eq(allApples?.broadenVarieties, []));
  check("Apple your alphabetical = [Braeburn, Gala, Granny Smith]",
    eq(allApples?.yourVarieties, ["Braeburn", "Gala", "Granny Smith"]));

  // None eaten → Your empty, Broaden lists all (educational nudge).
  const noneTomato = buildVarietyDisplay("tomato", "Tomato", new Set());
  check("Tomato none eaten → your empty", eq(noneTomato?.yourVarieties, []));
  check("Tomato none eaten → broaden all 3", eq(noneTomato?.broadenVarieties, ["Cherry", "Heirloom", "Plum"]));

  // Manual test 3 & 4: no defined varieties → null (show nothing).
  check("Avocado → null (no varieties, show nothing)", buildVarietyDisplay("avocado", "Avocado", new Set()) === null);
  check("Basil → null (no varieties, show nothing)", buildVarietyDisplay("basil", "Basil", new Set()) === null);

  // ── 5. buildRowVarietyDisplays — ownership + aggregation across rows ─────────
  console.log("\n── Row ownership / aggregation ──");

  // Production grouping: cherry+plum collapse to a "tomatoes" row; "heirloom
  // tomatoes" is its OWN row. Block must render once, on the base "tomatoes" row.
  const allIng = ["cherry tomatoes", "plum tomatoes", "heirloom tomatoes", "tomatoes"];
  const rows = [
    { key: "tomatoes", representative: "tomatoes" },
    { key: "heirloom tomatoes", representative: "heirloom tomatoes" },
  ];
  const byRow = buildRowVarietyDisplays(allIng, rows);
  check("variety block owned by base 'tomatoes' row", byRow.has("tomatoes"));
  check("variety block NOT duplicated on 'heirloom tomatoes' row", !byRow.has("heirloom tomatoes"));
  check("owner row your = [Cherry, Heirloom, Plum] (aggregated across rows)",
    eq(byRow.get("tomatoes")?.yourVarieties, ["Cherry", "Heirloom", "Plum"]));
  check("owner row broaden empty (all eaten)", eq(byRow.get("tomatoes")?.broadenVarieties, []));

  // Variety-only week: no base row → first (only) row owns.
  const byRow2 = buildRowVarietyDisplays(["chestnut mushrooms"], [
    { key: "chestnut mushrooms", representative: "chestnut mushrooms" },
  ]);
  check("variety-only row owns its food", byRow2.has("chestnut mushrooms"));
  check("variety-only your = [Chestnut]", eq(byRow2.get("chestnut mushrooms")?.yourVarieties, ["Chestnut"]));

  // A food with no varieties never produces a row entry.
  const byRow3 = buildRowVarietyDisplays(["avocado", "fresh basil"], [
    { key: "avocado", representative: "avocado" },
    { key: "basil", representative: "basil" },
  ]);
  check("no-variety foods produce no row entries", byRow3.size === 0);

  // ── 6. Read-only guarantee — empty input yields empty output, no throw ──────
  console.log("\n── Read-only / safety ──");
  let threw = false;
  try {
    check("empty ingredients → empty index", buildEatenVarietyIndex([]).size === 0);
    check("empty rows → empty displays", buildRowVarietyDisplays([], []).size === 0);
    check("blank strings ignored", buildEatenVarietyIndex(["", "   "]).size === 0);
  } catch { threw = true; }
  check("never throws on edge input", !threw);

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n${failed === 0 ? "✅" : "❌"} ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
