import fs from "node:fs";
import path from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const runnerPath = path.resolve(process.argv[2] ?? "server/migrations/runner.ts");
const source = fs.readFileSync(runnerPath, "utf8");

const baselineId = 'id: "2026-07-17_conv1_p10_schema_coverage"';
const registryId = 'id: "2026-06-18_ws0_knowledge_registry"';
const fixId = 'id: "2026-07-28_fix_canonical_food_knowledge_food_slug_fkey_order"';
const appendMarker = "// ← Add new migrations here, appended to the end";
const fkSql = /ALTER TABLE\s+"canonical_food"\s+ADD CONSTRAINT\s+"canonical_food_knowledge_food_slug_fkey"[\s\S]*?REFERENCES\s+knowledge_foods\(slug\)\s+ON DELETE SET NULL;/g;

const baselineStart = source.indexOf(baselineId);
const registryStart = source.indexOf(registryId);
const fixStart = source.indexOf(fixId);
const appendStart = source.indexOf(appendMarker);

assert(baselineStart >= 0, "baseline migration is missing");
assert(registryStart > baselineStart, "knowledge registry migration must follow the baseline");
assert(fixStart > registryStart, "FK repair migration must follow knowledge_foods creation");
assert(appendStart > fixStart, "FK repair migration must remain the final appended migration");

const baselineSection = source.slice(baselineStart, registryStart);
const registrySection = source.slice(registryStart, fixStart);
const fixSection = source.slice(fixStart, appendStart);

assert(
  (baselineSection.match(fkSql) ?? []).length === 1,
  "baseline must preserve the historical canonical_food knowledge_foods FK statement",
);
assert(
  baselineSection.includes("to_regclass('public.knowledge_foods') IS NOT NULL"),
  "fresh-schema ordering regression: baseline FK must be deferred until knowledge_foods exists",
);
fkSql.lastIndex = 0;
assert(
  /CREATE TABLE IF NOT EXISTS knowledge_foods\s*\(/.test(registrySection),
  "knowledge registry migration must create knowledge_foods",
);
assert(
  (fixSection.match(fkSql) ?? []).length === 1,
  "final repair migration must add the canonical_food knowledge_foods FK exactly once",
);
assert(
  fixSection.includes("pg_constraint") && fixSection.includes("IF NOT EXISTS"),
  "final FK repair must remain idempotently guarded",
);

console.log("fresh migration order: PASS");
console.log(`runner: ${runnerPath}`);
