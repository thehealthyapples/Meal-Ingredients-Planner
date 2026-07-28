import fs from "node:fs";
import path from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const runnerPath = path.resolve(process.argv[2] ?? "server/migrations/runner.ts");
const source = fs.readFileSync(runnerPath, "utf8");
const appendMarker = "// ← Add new migrations here, appended to the end";
const baselineId = 'id: "2026-07-17_conv1_p10_schema_coverage"';
const knowledgeRepairId = 'id: "2026-07-28_fix_canonical_food_knowledge_food_slug_fkey_order"';
const conversationRepairId = 'id: "2026-07-28_fix_conversation_turn_foreign_key_order"';
const schemaPrerequisiteId = "2026-07-28_reconcile_schema_prerequisites";
const rejectionStateId = "2026-07-19_know2_claim_rejection_state";
const commercialFoundationId = "2026-07-18_bus2a_commercial_foundation";

const idMatches = [...source.matchAll(/^\s*id:\s*"([^"]+)"/gm)];
const baselineIndex = idMatches.findIndex((match) => match[1] === "2026-07-17_conv1_p10_schema_coverage");
assert(baselineIndex >= 0, "baseline migration is missing");
assert(idMatches[baselineIndex + 1], "migration following baseline is missing");

const baselineStart = idMatches[baselineIndex].index!;
const baselineEnd = idMatches[baselineIndex + 1].index!;
const baseline = source.slice(baselineStart, baselineEnd);
const appendStart = source.indexOf(appendMarker);
assert(appendStart > baselineEnd, "append marker is missing");

// A contiguous staging ledger through entry 95 currently stops at KNOW2 because
// knowledge_food_nutrients.reviewed_at is absent. The same inventory audit found six
// additional runner-to-Drizzle column gaps, so one new-ID compatibility migration closes
// all seven before KNOW2; putting it at the physical tail would be unreachable.
const schemaPrerequisiteIndex = idMatches.findIndex((match) => match[1] === schemaPrerequisiteId);
const rejectionStateIndex = idMatches.findIndex((match) => match[1] === rejectionStateId);
const commercialFoundationIndex = idMatches.findIndex((match) => match[1] === commercialFoundationId);

assert(schemaPrerequisiteIndex >= 0, "schema prerequisite reconciliation migration is missing");
assert(rejectionStateIndex >= 0, "KNOW2 rejection-state migration is missing");
assert(commercialFoundationIndex >= 0, "BUS2A commercial-foundation migration is missing");
assert(
  schemaPrerequisiteIndex === commercialFoundationIndex + 1,
  "schema prerequisite reconciliation must run immediately after the 95th applied migration",
);
assert(
  rejectionStateIndex === schemaPrerequisiteIndex + 1,
  "schema prerequisite reconciliation must run immediately before KNOW2 rejection-state migration",
);

const schemaPrerequisiteStart = idMatches[schemaPrerequisiteIndex].index!;
const schemaPrerequisiteEnd = idMatches[rejectionStateIndex].index!;
const schemaPrerequisite = source.slice(schemaPrerequisiteStart, schemaPrerequisiteEnd);
const expectedSchemaPrerequisiteStatements = [
  "ALTER TABLE knowledge_food_nutrients ADD COLUMN IF NOT EXISTS source_refs JSONB NOT NULL DEFAULT '[]'::jsonb",
  "ALTER TABLE knowledge_food_nutrients ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ",
  "ALTER TABLE knowledge_food_nutrients ADD COLUMN IF NOT EXISTS reviewed_by TEXT",
  "ALTER TABLE knowledge_food_benefits ADD COLUMN IF NOT EXISTS reviewed_by TEXT",
  "ALTER TABLE knowledge_nutrient_benefits ADD COLUMN IF NOT EXISTS reviewed_by TEXT",
  "ALTER TABLE conversation_turns ADD COLUMN IF NOT EXISTS fallback_state TEXT",
  "ALTER TABLE knowledge_nutrients ADD COLUMN IF NOT EXISTS family TEXT",
];
const normalizedSchemaPrerequisite = schemaPrerequisite.replace(/\s+/g, " ");
for (const statement of expectedSchemaPrerequisiteStatements) {
  assert(
    normalizedSchemaPrerequisite.includes(statement),
    `schema prerequisite reconciliation is missing: ${statement}`,
  );
}
assert(
  (schemaPrerequisite.match(/ADD COLUMN IF NOT EXISTS/g) ?? []).length === expectedSchemaPrerequisiteStatements.length,
  "schema prerequisite reconciliation must contain exactly seven idempotent column additions",
);
assert(
  !schemaPrerequisite.includes("platform_turn_outcomes"),
  "retired platform_turn_outcomes must not be recreated by schema reconciliation",
);

const createdInBaseline = new Set(
  [...baseline.matchAll(/CREATE TABLE IF NOT EXISTS\s+["`]?([A-Za-z_][A-Za-z0-9_]*)/gi)]
    .map((match) => match[1].toLowerCase()),
);
const baselineStatements = [...baseline.matchAll(/`([\s\S]*?)`/g)].map((match) => match[1]);
const forwardTargets = new Set<string>();

for (const statement of baselineStatements) {
  for (const reference of statement.matchAll(/REFERENCES\s+["`]?([A-Za-z_][A-Za-z0-9_]*)\s*\(/gi)) {
    const target = reference[1].toLowerCase();
    if (createdInBaseline.has(target)) continue;
    forwardTargets.add(target);
    assert(
      statement.includes(`to_regclass('public.${target}') IS NOT NULL`),
      `fresh-schema ordering regression: baseline forward reference to ${target} is not guarded`,
    );
  }
}

assert(
  [...forwardTargets].sort().join(",") === "conversation_turns,knowledge_foods",
  `unexpected baseline forward-reference targets: ${[...forwardTargets].sort().join(",")}`,
);

const knowledgeCreate = source.indexOf("CREATE TABLE IF NOT EXISTS knowledge_foods");
const conversationCreate = source.indexOf("CREATE TABLE IF NOT EXISTS conversation_turns");
const knowledgeRepair = source.indexOf(knowledgeRepairId);
const conversationRepair = source.indexOf(conversationRepairId);
assert(knowledgeCreate > baselineEnd, "knowledge_foods must be created after the baseline");
assert(conversationCreate > baselineEnd, "conversation_turns must be created after the baseline");
assert(knowledgeRepair > knowledgeCreate, "knowledge_foods FK repair must follow table creation");
assert(conversationRepair > conversationCreate, "conversation_turns FK repair must follow table creation");
assert(appendStart > conversationRepair, "conversation-turn FK repair must remain appended at the end");

const conversationRepairSection = source.slice(conversationRepair, appendStart);
const expectedConversationConstraints = [
  "companion_action_proposals_conversation_turn_id_fkey",
  "companion_guidance_events_conversation_turn_id_fkey",
  "companion_response_feedback_conversation_turn_id_fkey",
];
for (const constraint of expectedConversationConstraints) {
  const occurrences = conversationRepairSection.split(constraint).length - 1;
  assert(occurrences === 2, `repair migration must check and add ${constraint} exactly once`);
}
assert(
  (conversationRepairSection.match(/IF NOT EXISTS\s*\(/g) ?? []).length === 3,
  "all three conversation-turn FK repairs must be idempotently guarded",
);

// A fresh database runs the baseline first, so later historical migrations must not blindly
// re-add constraints the baseline already established. A later duplicate is safe only when that
// migration either drops the named constraint first or checks pg_constraint before adding it.
const baselineConstraintNames = new Set(
  [...baseline.matchAll(/(?:ADD\s+)?CONSTRAINT\s+["`]?([A-Za-z_][A-Za-z0-9_]*)/gi)]
    .map((match) => match[1].toLowerCase()),
);
const duplicateOffenders: string[] = [];
for (let i = baselineIndex + 1; i < idMatches.length; i += 1) {
  const entryStart = idMatches[i].index!;
  const entryEnd = idMatches[i + 1]?.index ?? appendStart;
  const entry = source.slice(entryStart, entryEnd);
  for (const add of entry.matchAll(/ADD\s+CONSTRAINT\s+["`]?([A-Za-z_][A-Za-z0-9_]*)/gi)) {
    const name = add[1].toLowerCase();
    if (!baselineConstraintNames.has(name)) continue;
    const beforeAdd = entry.slice(0, add.index);
    const dropsFirst = new RegExp('DROP\\s+CONSTRAINT\\s+IF\\s+EXISTS\\s+["`]?' + name + '\\b', "i").test(beforeAdd);
    const checksFirst = beforeAdd.includes("pg_constraint") && beforeAdd.includes("NOT EXISTS");
    if (!dropsFirst && !checksFirst) duplicateOffenders.push(`${idMatches[i][1]}:${name}`);
  }
}
assert(
  duplicateOffenders.length === 0,
  `later migrations re-add baseline constraints without a guard: ${duplicateOffenders.join(", ")}`,
);

console.log("fresh migration forward-reference audit: PASS");
console.log("later baseline-constraint duplicate audit: PASS");
console.log(`forward targets: ${[...forwardTargets].sort().join(", ")}`);
console.log(`runner: ${runnerPath}`);
