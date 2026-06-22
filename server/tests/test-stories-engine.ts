// WS10 — Household Stories Engine: worked examples + trust validation.
// Run: tsx server/tests/test-stories-engine.ts
//
// Produces the five worked examples the brief requires (Tomatoes, Chickpeas,
// Greek yoghurt, Pizza, Mediterranean household), demonstrates all five story
// types, exercises the silence contract (sparse history), and enforces the
// trust gate (no ranking/judgement/gamification/deficit language) as a hard
// gate. Writes a JSON report to data/ for preservation.

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  stories,
  formatStories,
  assertTrustworthy,
} from "../../shared/stories";
import type { MealEntry, StoriesResult } from "../../shared/stories";

const line = "=".repeat(64);
let failures = 0;
const NOW = new Date("2026-06-22");

function allCards(r: StoriesResult) {
  return r.sections.flatMap((s) => s.cards);
}

function checkTrust(label: string, r: StoriesResult) {
  try {
    assertTrustworthy(allCards(r));
    console.log(`  ✓ trust check passed (${allCards(r).length} cards)`);
  } catch (e) {
    failures++;
    console.log(`  ✗ ${label}: ${(e as Error).message}`);
  }
}

function expect(label: string, cond: boolean) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.log(`  ✗ FAILED: ${label}`);
  }
}

function d(iso: string): Date {
  return new Date(iso);
}

const report: Record<string, unknown> = {};

// ── Helpers to build realistic test history ────────────────────────────────────

function repeat(
  entry: Omit<MealEntry, "date">,
  dates: string[],
): MealEntry[] {
  return dates.map((iso) => ({ ...entry, date: d(iso) }));
}

// Fridays in 2025–2026 (verified: Jan 1 2026 = Thursday, so Jan 2 = Friday)
const FRIDAYS_2026 = [
  "2026-01-02", "2026-01-09", "2026-01-16", "2026-01-23",
  "2026-02-06", "2026-02-13", "2026-02-20",
  "2026-03-06", "2026-03-13", "2026-03-27",
  "2026-04-03", "2026-04-17",
  "2026-05-01", "2026-05-15", "2026-05-22",
  "2026-06-05", "2026-06-12", "2026-06-19",
];

// ── 1. TOMATOES WORKED EXAMPLE ─────────────────────────────────────────────────

console.log("WS10 — Household Stories Engine\n");
console.log(line);
console.log("1. TOMATOES — favourite + varieties + seasonal + tradition\n");

// Tomato across Pasta Sauce, Greek Salad, and Pizza (mostly Fridays).
const tomatoHistory: MealEntry[] = [
  // Base tomato in pasta sauce — summer 2025 (seasonal peak)
  ...repeat(
    { food: "tomato", foodName: "Tomato", mealName: "Pasta Sauce", mealSlot: "dinner", source: "planned" },
    ["2025-06-10", "2025-06-24", "2025-07-08", "2025-07-15", "2025-07-29",
     "2025-08-05", "2025-08-12", "2025-08-26"],
  ),
  // Base tomato in Greek salad — summer
  ...repeat(
    { food: "tomato", foodName: "Tomato", mealName: "Greek Salad", mealSlot: "lunch", source: "planned" },
    ["2025-07-01", "2025-07-18", "2025-08-03", "2025-08-19"],
  ),
  // Base tomato on Pizza Fridays — 2026 (recent, keeps recency score high)
  ...FRIDAYS_2026.slice(0, 10).map((iso) => ({
    food: "tomato",
    foodName: "Tomato",
    mealName: "Pizza",
    mealSlot: "dinner" as const,
    source: "planned" as const,
    date: d(iso),
  })),
  // Cherry tomatoes — Greek salad + snacking
  ...repeat(
    { food: "cherry-tomato", foodName: "Cherry Tomato", mealName: "Greek Salad", mealSlot: "lunch", source: "planned" },
    ["2025-07-03", "2025-07-20", "2025-08-01", "2025-08-15",
     "2026-03-10", "2026-04-05", "2026-05-12", "2026-06-01"],
  ),
  // Plum tomatoes — pasta sauce
  ...repeat(
    { food: "plum-tomato", foodName: "Plum Tomato", mealName: "Pasta Sauce", mealSlot: "dinner", source: "planned" },
    ["2025-09-08", "2025-10-14", "2025-11-03", "2026-01-20", "2026-02-10"],
  ),
  // Heirloom tomatoes — summer discovery
  ...repeat(
    { food: "heirloom-tomato", foodName: "Heirloom Tomato", mealName: "Greek Salad", mealSlot: "lunch", source: "planned" },
    ["2025-08-10", "2025-08-24", "2026-07-15"],
  ),
  // Basil — summer herb (makes seasonal habits rich: "Summer became: Tomatoes, Basil")
  ...repeat(
    { food: "basil", foodName: "Basil", mealName: "Pasta Sauce", mealSlot: "dinner", source: "planned" },
    ["2025-06-15", "2025-06-28", "2025-07-06", "2025-07-19",
     "2025-08-02", "2025-08-18", "2026-06-05", "2026-06-19"],
  ),
  // Courgette — another summer vegetable
  ...repeat(
    { food: "courgette", foodName: "Courgette", mealName: "Ratatouille", mealSlot: "dinner", source: "planned" },
    ["2025-07-12", "2025-07-26", "2025-08-09", "2025-08-23", "2026-06-03", "2026-06-17"],
  ),
];

const tomatoResult = stories({
  household: { entries: tomatoHistory },
  now: NOW,
});
console.log(formatStories(tomatoResult));
checkTrust("tomatoes", tomatoResult);

const types1 = tomatoResult.sections.map((s) => s.type);
expect(
  "tomatoes: favourite_foods section generated",
  types1.includes("favourite_foods"),
);
expect(
  "tomatoes: discovery section generated (variety exploration)",
  types1.includes("discovery"),
);
expect(
  "tomatoes: family_traditions section generated (Friday pizza)",
  types1.includes("family_traditions"),
);
expect(
  "tomatoes: seasonal_habits section generated (summer peak)",
  types1.includes("seasonal_habits"),
);

// Verify tomato variety card mentions 3+ varieties
const discoveryCards1 = tomatoResult.sections
  .find((s) => s.type === "discovery")
  ?.cards ?? [];
expect(
  "tomatoes: variety card mentions multiple varieties",
  discoveryCards1.some((c) => c.headline.includes("varieties")),
);

// Verify Friday tradition
const traditionCards1 = tomatoResult.sections
  .find((s) => s.type === "family_traditions")
  ?.cards ?? [];
expect(
  "tomatoes: Friday pizza tradition detected",
  traditionCards1.some(
    (c) =>
      c.headline.toLowerCase().includes("friday") &&
      c.headline.toLowerCase().includes("pizza"),
  ),
);

report["tomatoes"] = tomatoResult;
console.log();

// ── 2. CHICKPEAS — legume food journey ────────────────────────────────────────

console.log(line);
console.log("2. CHICKPEAS — discovery + food journey (legumes)\n");

const legumeDates = {
  // Added recent dates (Jan-Jun 2026) so favourites stay within 180-day recency gate
  chickpeas: ["2024-06-01", "2024-06-15", "2024-07-03", "2024-08-12",
              "2024-09-20", "2024-10-08", "2024-11-14", "2024-12-02",
              "2025-01-10", "2025-02-14", "2025-03-22", "2025-05-05",
              "2026-01-12", "2026-03-18", "2026-05-10", "2026-06-08"],
  butterBeans: ["2024-10-15", "2024-11-01", "2024-12-10", "2025-01-20",
                "2025-03-08", "2025-05-15", "2025-07-03", "2025-09-12",
                "2026-01-25", "2026-03-22", "2026-05-14"],
  cannelliniBeans: ["2025-04-10", "2025-05-20", "2025-07-08", "2025-09-15",
                    "2025-11-01", "2025-12-22", "2026-02-08", "2026-04-18"],
  lentils: ["2024-08-01", "2024-09-10", "2024-10-15", "2024-11-20",
            "2025-01-05", "2025-03-15", "2025-06-08", "2025-08-20",
            "2025-10-14", "2025-12-08", "2026-02-15", "2026-04-10", "2026-06-01"],
};

const chickpeasHistory: MealEntry[] = [
  ...repeat(
    { food: "chickpeas", foodName: "Chickpeas", mealName: "Chickpea Curry", mealSlot: "dinner", source: "planned" },
    legumeDates.chickpeas,
  ),
  ...repeat(
    { food: "butter-beans", foodName: "Butter Beans", mealName: "Butter Bean Stew", mealSlot: "dinner", source: "planned" },
    legumeDates.butterBeans,
  ),
  ...repeat(
    { food: "cannellini-beans", foodName: "Cannellini Beans", mealName: "Bean Soup", mealSlot: "dinner", source: "planned" },
    legumeDates.cannelliniBeans,
  ),
  ...repeat(
    { food: "lentils", foodName: "Lentils", mealName: "Lentil Soup", mealSlot: "dinner", source: "planned" },
    legumeDates.lentils,
  ),
];

const chickpeasResult = stories({
  household: { entries: chickpeasHistory },
  now: NOW,
});
console.log(formatStories(chickpeasResult));
checkTrust("chickpeas", chickpeasResult);

const types2 = chickpeasResult.sections.map((s) => s.type);
expect(
  "chickpeas: favourite_foods generated (4 regular legumes)",
  types2.includes("favourite_foods"),
);
expect(
  "chickpeas: food_journey generated (legume progression)",
  types2.includes("food_journey"),
);

const journeyCards2 = chickpeasResult.sections
  .find((s) => s.type === "food_journey")
  ?.cards ?? [];
expect(
  "chickpeas: legume journey card generated",
  journeyCards2.some((c) => c.headline.toLowerCase().includes("chickpeas")),
);
expect(
  "chickpeas: journey mentions progression (started with...)",
  journeyCards2.some((c) => c.headline.toLowerCase().includes("started with")),
);

report["chickpeas"] = chickpeasResult;
console.log();

// ── 3. GREEK YOGHURT — breakfast habits + seasonal usage ──────────────────────

console.log(line);
console.log("3. GREEK YOGHURT — favourite + seasonal + breakfast habits\n");

const yoghurtHistory: MealEntry[] = [
  // Greek yoghurt — summer peak (breakfast bowls)
  ...repeat(
    { food: "greek-yoghurt", foodName: "Greek Yoghurt", mealName: "Breakfast Bowl", mealSlot: "breakfast", source: "planned" },
    ["2025-06-03", "2025-06-10", "2025-06-17", "2025-06-24",
     "2025-07-01", "2025-07-08", "2025-07-15", "2025-07-22", "2025-07-29",
     "2025-08-05", "2025-08-12", "2025-08-19", "2025-08-26"],
  ),
  // Strawberries — summer fruit with breakfast (makes seasonal_habits: 2+ foods)
  ...repeat(
    { food: "strawberry", foodName: "Strawberry", mealName: "Breakfast Bowl", mealSlot: "breakfast", source: "planned" },
    ["2025-06-05", "2025-06-18", "2025-07-05", "2025-07-20",
     "2025-08-04", "2025-08-18", "2026-06-10", "2026-06-20"],
  ),
  // Blueberries — also summer
  ...repeat(
    { food: "blueberry", foodName: "Blueberry", mealName: "Breakfast Bowl", mealSlot: "breakfast", source: "planned" },
    ["2025-07-10", "2025-07-25", "2025-08-08", "2025-08-22", "2026-06-12"],
  ),
  // Spring 2026 — yoghurt still regular
  ...repeat(
    { food: "greek-yoghurt", foodName: "Greek Yoghurt", mealName: "Breakfast Bowl", mealSlot: "breakfast", source: "planned" },
    ["2026-03-15", "2026-04-02", "2026-04-19", "2026-05-07",
     "2026-05-21", "2026-06-04", "2026-06-18"],
  ),
];

const yoghurtResult = stories({
  household: { entries: yoghurtHistory },
  now: NOW,
});
console.log(formatStories(yoghurtResult));
checkTrust("greek-yoghurt", yoghurtResult);

const types3 = yoghurtResult.sections.map((s) => s.type);
expect(
  "greek-yoghurt: favourite_foods generated (20 uses, recent)",
  types3.includes("favourite_foods"),
);
expect(
  "greek-yoghurt: seasonal_habits generated (summer peak)",
  types3.includes("seasonal_habits"),
);

const favouriteCards3 = yoghurtResult.sections
  .find((s) => s.type === "favourite_foods")
  ?.cards ?? [];
// greek-yoghurt resolves to canonical "yoghurt" — check for that name
expect(
  "greek-yoghurt: favourite card generated (canonical: yoghurt)",
  favouriteCards3.some((c) =>
    c.headline.toLowerCase().includes("yoghurt"),
  ),
);

report["greek-yoghurt"] = yoghurtResult;
console.log();

// ── 4. PIZZA — Friday tradition ────────────────────────────────────────────────

console.log(line);
console.log("4. PIZZA — family tradition (Friday became pizza night)\n");

// 12 pizza meals: 10 on Fridays, 2 on Saturdays
const pizzaHistory: MealEntry[] = [
  ...FRIDAYS_2026.slice(0, 10).map((iso) => ({
    food: "tomato",
    foodName: "Tomato",
    mealName: "Pizza",
    mealSlot: "dinner" as const,
    source: "planned" as const,
    date: d(iso),
  })),
  // Two Saturday pizza entries (non-Friday minority)
  {
    food: "tomato",
    foodName: "Tomato",
    mealName: "Pizza",
    mealSlot: "dinner",
    source: "planned",
    date: d("2026-01-03"),
  },
  {
    food: "tomato",
    foodName: "Tomato",
    mealName: "Pizza",
    mealSlot: "dinner",
    source: "planned",
    date: d("2026-02-07"),
  },
];

const pizzaResult = stories({
  household: { entries: pizzaHistory },
  now: NOW,
  types: ["family_traditions", "favourite_foods"],
});
console.log(formatStories(pizzaResult));
checkTrust("pizza", pizzaResult);

const traditionCards4 = pizzaResult.sections
  .find((s) => s.type === "family_traditions")
  ?.cards ?? [];
expect(
  "pizza: Friday tradition card generated",
  traditionCards4.some(
    (c) =>
      c.headline.toLowerCase().includes("friday") &&
      c.headline.toLowerCase().includes("pizza"),
  ),
);
expect(
  "pizza: tradition headline uses 'night' (warm, not analytical)",
  traditionCards4.some((c) => c.headline.toLowerCase().includes("night")),
);

report["pizza"] = pizzaResult;
console.log();

// ── 5. MEDITERRANEAN HOUSEHOLD ────────────────────────────────────────────────

console.log(line);
console.log("5. MEDITERRANEAN HOUSEHOLD — cuisine journey + favourites + discovery\n");

const mediterHistory: MealEntry[] = [
  // Tomatoes — the cornerstone (spread over two years, still going)
  ...repeat(
    { food: "tomato", foodName: "Tomato", mealName: "Greek Salad", mealSlot: "dinner", source: "planned" },
    ["2024-06-05", "2024-06-20", "2024-07-10", "2024-07-25",
     "2024-08-08", "2024-08-22", "2025-06-12", "2025-07-03",
     "2025-07-18", "2025-08-05", "2026-03-10", "2026-04-20",
     "2026-05-15", "2026-06-01", "2026-06-10", "2026-06-18",
     "2026-03-25", "2026-04-08", "2026-05-02", "2026-06-15"],
  ),
  // Olive oil — almost as frequent
  ...repeat(
    { food: "extra-virgin-olive-oil", foodName: "Extra Virgin Olive Oil", mealName: "Greek Salad", source: "planned" },
    ["2024-06-05", "2024-06-20", "2024-07-10", "2024-07-25",
     "2024-08-08", "2025-06-12", "2025-07-03", "2025-07-18",
     "2025-08-05", "2026-03-10", "2026-04-20", "2026-05-15",
     "2026-06-01", "2026-06-10", "2026-06-18", "2026-06-15",
     "2026-03-25", "2026-04-08"],
  ),
  // Feta — discovered mid-2024
  ...repeat(
    { food: "feta", foodName: "Feta", mealName: "Greek Salad", source: "planned" },
    ["2024-08-01", "2024-09-12", "2024-10-05", "2024-11-20",
     "2025-02-08", "2025-05-14", "2025-07-09", "2025-09-17",
     "2025-11-03", "2026-03-18"],
  ),
  // Chickpeas — the first legume
  ...repeat(
    { food: "chickpeas", foodName: "Chickpeas", mealName: "Chickpea Stew", source: "planned" },
    ["2024-06-15", "2024-07-08", "2024-08-20", "2024-10-14",
     "2025-01-06", "2025-03-10", "2025-06-20", "2025-09-08"],
  ),
  // Aubergine — arrived autumn 2024
  ...repeat(
    { food: "aubergine", foodName: "Aubergine", mealName: "Moussaka", mealSlot: "dinner", source: "planned" },
    ["2024-09-15", "2024-10-02", "2024-11-08", "2025-01-20",
     "2025-05-10", "2025-09-20"],
  ),
  // Courgette — summer vegetable
  ...repeat(
    { food: "courgette", foodName: "Courgette", mealName: "Ratatouille", mealSlot: "dinner", source: "planned" },
    ["2024-07-10", "2024-08-03", "2025-06-18", "2025-07-25", "2026-06-08"],
  ),
  // Butter beans — later legume discovery
  ...repeat(
    { food: "butter-beans", foodName: "Butter Beans", mealName: "Butter Bean Soup", source: "planned" },
    ["2025-02-10", "2025-04-05", "2025-07-20", "2025-10-12",
     "2026-01-15", "2026-04-10"],
  ),
  // Cannellini beans — most recent legume
  ...repeat(
    { food: "cannellini-beans", foodName: "Cannellini Beans", mealName: "Bean Stew", source: "planned" },
    ["2025-11-08", "2025-12-20", "2026-02-14", "2026-04-22"],
  ),
];

const mediterResult = stories({
  household: { entries: mediterHistory },
  now: NOW,
});
console.log(formatStories(mediterResult));
checkTrust("mediterranean", mediterResult);

const types5 = mediterResult.sections.map((s) => s.type);
expect(
  "mediterranean: favourite_foods generated",
  types5.includes("favourite_foods"),
);
expect(
  "mediterranean: food_journey generated (legume + mediterranean)",
  types5.includes("food_journey"),
);
expect(
  "mediterranean: seasonal_habits generated (summer produce)",
  types5.includes("seasonal_habits"),
);

const favouriteCards5 = mediterResult.sections
  .find((s) => s.type === "favourite_foods")
  ?.cards ?? [];
expect(
  "mediterranean: tomato is the top favourite (20 uses, recent)",
  favouriteCards5[0]?.slug === "tomato" ||
    favouriteCards5[0]?.headline.toLowerCase().includes("tomato"),
);

const journeyCards5 = mediterResult.sections
  .find((s) => s.type === "food_journey")
  ?.cards ?? [];
expect(
  "mediterranean: at least one journey card generated",
  journeyCards5.length > 0,
);

report["mediterranean"] = mediterResult;
console.log();

// ── 6. SILENCE CONTRACT — sparse history generates nothing ────────────────────

console.log(line);
console.log("6. SILENCE CONTRACT — sparse history stays silent\n");

// 2 entries — not enough for any story type
const sparseHistory: MealEntry[] = [
  { food: "tomato", foodName: "Tomato", date: d("2026-05-01"), source: "planned" },
  { food: "chickpeas", foodName: "Chickpeas", date: d("2026-06-10"), source: "planned" },
];
const sparseResult = stories({ household: { entries: sparseHistory }, now: NOW });
expect(
  "sparse history: no sections generated (empty is silent)",
  sparseResult.sections.length === 0,
);
console.log(formatStories(sparseResult));
console.log();

// Empty history
const emptyResult = stories({ household: { entries: [] }, now: NOW });
expect(
  "empty history: no sections generated",
  emptyResult.sections.length === 0,
);

// Food used only once — not a confirmed discovery (below DISCOVERY_CONFIRM_COUNT)
const oneOffHistory: MealEntry[] = Array.from({ length: 10 }, (_, i) => ({
  food: "tomato",
  foodName: "Tomato",
  date: d(`2026-${String(i + 1).padStart(2, "0")}-10`),
  source: "planned" as const,
}));
oneOffHistory.push({
  food: "artichoke",
  foodName: "Artichoke",
  date: d("2026-06-01"),
  source: "planned",
});
const oneOffResult = stories({
  household: { entries: oneOffHistory },
  now: NOW,
  types: ["discovery"],
});
expect(
  "one-off food not surfaced as confirmed discovery",
  !oneOffResult.sections
    .find((s) => s.type === "discovery")
    ?.cards.some((c) => c.headline.toLowerCase().includes("artichoke")),
);
console.log();

// ── 7. TYPE NARROWING — only requested types generated ────────────────────────

console.log(line);
console.log("7. TYPE NARROWING — caller controls which story types appear\n");

const narrowedResult = stories({
  household: { entries: tomatoHistory },
  now: NOW,
  types: ["favourite_foods"],
});
expect(
  "type narrowing: only favourite_foods section present",
  narrowedResult.sections.length > 0 &&
    narrowedResult.sections.every((s) => s.type === "favourite_foods"),
);
console.log();

// ── 8. TIMEFRAME NARROWING — discovery within a period ────────────────────────

console.log(line);
console.log("8. TIMEFRAME NARROWING — discoveries scoped to spring 2026\n");

const springWindow = {
  start: d("2026-03-01"),
  end: d("2026-05-31"),
  label: "This spring",
};
const springResult = stories({
  household: { entries: [...tomatoHistory, ...chickpeasHistory] },
  now: NOW,
  types: ["discovery"],
  timeframe: springWindow,
});
console.log(formatStories(springResult));
expect(
  "timeframe: discovery section generated for spring 2026",
  springResult.sections.some((s) => s.type === "discovery"),
);
expect(
  "timeframe: result carries window",
  springResult.window?.label === "This spring",
);
report["spring-2026-discovery"] = springResult;
console.log();

// ── 9. TRUST GATE — all authored text across all examples ─────────────────────

console.log(line);
console.log("9. TRUST GATE — all story text across all examples\n");

const allResults = [
  tomatoResult,
  chickpeasResult,
  yoghurtResult,
  pizzaResult,
  mediterResult,
];

let totalCards = 0;
let trustFailures = 0;
for (const r of allResults) {
  totalCards += allCards(r).length;
  try {
    assertTrustworthy(allCards(r));
  } catch (e) {
    trustFailures++;
    failures++;
    console.log(`  ✗ Trust violation: ${(e as Error).message}`);
  }
}
expect(
  `all ${totalCards} story cards across all examples pass the trust gate`,
  trustFailures === 0,
);
console.log();

// ── 10. Persist report ────────────────────────────────────────────────────────

const outDir = join(process.cwd(), "data", "stories");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "ws10-stories-report.json");
writeFileSync(
  outPath,
  JSON.stringify(
    {
      workstream: "WS10 — Household Stories Engine",
      generatedAt: new Date().toISOString(),
      totalCards,
      examples: report,
    },
    null,
    2,
  ),
);
console.log(`Report written: ${outPath}`);

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${line}`);
if (failures === 0) {
  console.log("✓ WS10 — all worked examples, gates and trust checks passed.");
} else {
  console.log(`✗ WS10 — ${failures} check(s) failed.`);
  process.exit(1);
}
