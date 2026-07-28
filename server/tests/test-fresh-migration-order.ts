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

const idMatches = [...source.matchAll(/^\s*id:\s*"([^"]+)"/gm)];
const baselineIndex = idMatches.findIndex((match) => match[1] === "2026-07-17_conv1_p10_schema_coverage");
assert(baselineIndex >= 0, "baseline migration is missing");
assert(idMatches[baselineIndex + 1], "migration following baseline is missing");

const baselineStart = idMatches[baselineIndex].index!;
const baselineEnd = idMatches[baselineIndex + 1].index!;
const baseline = source.slice(baselineStart, baselineEnd);
const appendStart = source.indexOf(appendMarker);
assert(appendStart > baselineEnd, "append marker is missing");

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
