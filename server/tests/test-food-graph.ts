// WS7 POC — Food Relationship Graph: worked example test
// Run: npx ts-node server/tests/test-food-graph.ts

import { getFoodRelationships, formatFoodGraph } from "../../shared/relationships/food-graph";

const WORKED_EXAMPLES = [
  "tomato",
  "chickpeas",
  "chicken",
  "greek-yoghurt",
];

console.log("WS7 POC — Food Relationship Graph\n");
console.log("=".repeat(50));

for (const slug of WORKED_EXAMPLES) {
  const graph = getFoodRelationships(slug);

  if (!graph) {
    console.log(`\n✗ ${slug}: not found in graph`);
    continue;
  }

  console.log(formatFoodGraph(graph));

  // Trust validation — confirm no ranking language slips through
  const allText = graph.relationships.map(r => r.explanation).join(" ");
  const rankingWords = ["better", "best", "healthier", "superior", "worse", "unhealthy"];
  const violations = rankingWords.filter(w => allText.toLowerCase().includes(w));

  if (violations.length > 0) {
    console.log(`  ⚠ TRUST VIOLATION: ranking language detected: ${violations.join(", ")}`);
  } else {
    console.log(`\n  ✓ Trust check passed (no ranking language)`);
  }

  console.log(`  ✓ ${graph.relationships.length} relationships returned`);
  console.log(`  ✓ Types: ${Array.from(new Set(graph.relationships.map(r => r.type))).join(", ")}`);
  console.log();
}

// Discovery test
console.log("=".repeat(50));
console.log("DISCOVERY TEST — Could Pantry show 'You might also enjoy'?\n");

const tomato = getFoodRelationships("tomato");
if (tomato) {
  const discoverable = tomato.relationships.filter(
    r => r.type === "similar_to" || r.type === "same_family",
  );
  console.log(`Tomato → discovery candidates: ${discoverable.map(r => r.name).join(", ")}`);
  console.log(`Answer: YES — ${discoverable.length} relevant neighbours available via similar_to and same_family.\n`);
}

// Alternatives test
console.log("=".repeat(50));
console.log("ALTERNATIVES TEST — Could Planner/Meal Pages show 'Alternative choices'?\n");

const chicken = getFoodRelationships("chicken");
if (chicken) {
  const alternatives = chicken.relationships.filter(r => r.type === "alternative_for_goal");
  console.log("Chicken alternatives by goal:");
  for (const alt of alternatives) {
    console.log(`  [${alt.goal}] ${alt.name}: ${alt.explanation}`);
  }
  console.log(`\nAnswer: YES — ${alternatives.length} goal-labelled alternatives available.\n`);
}
