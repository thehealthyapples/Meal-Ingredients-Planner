#!/usr/bin/env node
/** Read-only, metadata-only Replit source shape diagnostic. */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const root = resolve(process.cwd(), "replit-staging-data-migration");
const snapshotPath = resolve(root, "replit-source-schema.json");
const reportPath = resolve(root, "REPLIT_SOURCE_SCHEMA_DRIFT.json");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is unavailable");
const require = createRequire(resolve(process.cwd(), "package.json"));
const { Client } = require("pg");
const client = new Client({ connectionString, application_name: "tha-readonly-shape-diagnostic" });

function expectedShape(doc) {
  return doc.tables.map((table) => ({
    name: table.name,
    columns: table.columns.map((column) => ({
      name: column.name,
      dataType: column.dataType,
      udtName: column.udtName,
      nullable: Boolean(column.nullable),
    })),
  })).sort((a, b) => a.name.localeCompare(b.name));
}

function rowsToShape(rows) {
  const tables = new Map();
  for (const row of rows) {
    if (!tables.has(row.tableName)) tables.set(row.tableName, []);
    tables.get(row.tableName).push({
      name: row.columnName,
      dataType: row.dataType,
      udtName: row.udtName,
      nullable: row.nullable,
    });
  }
  return [...tables].map(([name, columns]) => ({ name, columns })).sort((a, b) => a.name.localeCompare(b.name));
}

function compare(expected, actual) {
  const e = new Map(expected.map((table) => [table.name, table]));
  const a = new Map(actual.map((table) => [table.name, table]));
  const expectedNames = new Set(e.keys());
  const actualNames = new Set(a.keys());
  const onlyExpectedTables = [...expectedNames].filter((name) => !actualNames.has(name)).sort();
  const onlyActualTables = [...actualNames].filter((name) => !expectedNames.has(name)).sort();
  const changedTables = [];
  for (const name of [...expectedNames].filter((value) => actualNames.has(value)).sort()) {
    const expectedColumns = e.get(name).columns;
    const actualColumns = a.get(name).columns;
    if (JSON.stringify(expectedColumns) === JSON.stringify(actualColumns)) continue;
    const ec = new Map(expectedColumns.map((column) => [column.name, column]));
    const ac = new Map(actualColumns.map((column) => [column.name, column]));
    const eNames = new Set(ec.keys());
    const aNames = new Set(ac.keys());
    changedTables.push({
      table: name,
      onlyExpectedColumns: [...eNames].filter((column) => !aNames.has(column)).sort(),
      onlyActualColumns: [...aNames].filter((column) => !eNames.has(column)).sort(),
      changedColumnDefinitions: [...eNames].filter((column) => aNames.has(column) && JSON.stringify(ec.get(column)) !== JSON.stringify(ac.get(column))).sort(),
    });
  }
  return {
    matches: onlyExpectedTables.length === 0 && onlyActualTables.length === 0 && changedTables.length === 0,
    expectedTableCount: expected.length,
    actualTableCount: actual.length,
    onlyExpectedTables,
    onlyActualTables,
    changedTables,
  };
}

let transaction = false;
try {
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  const expected = expectedShape(snapshot);
  await client.connect();
  await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  transaction = true;
  const readOnly = await client.query("SHOW transaction_read_only");
  if (readOnly.rows[0]?.transaction_read_only !== "on") throw new Error("Transaction is not read-only");
  const columns = await client.query(`
    SELECT c.table_name AS "tableName", c.column_name AS "columnName",
           c.data_type AS "dataType", c.udt_name AS "udtName",
           (c.is_nullable = 'YES') AS nullable, c.ordinal_position AS ordinal,
           t.table_type AS "tableType"
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema AND t.table_name = c.table_name
     WHERE c.table_schema = 'public'
     ORDER BY c.table_name, c.ordinal_position
  `);
  const baseRows = columns.rows.filter((row) => row.tableType === "BASE TABLE");
  const viewRows = columns.rows.filter((row) => row.tableType !== "BASE TABLE");
  const baseComparison = compare(expected, rowsToShape(baseRows));
  const allComparison = compare(expected, rowsToShape(columns.rows));
  const report = {
    status: "PASS",
    metadataOnly: true,
    transactionReadOnly: true,
    sourceSnapshotContentHash: snapshot.meta?.contentHash ?? null,
    baseTableComparison: baseComparison,
    previousCheckComparisonIncludingViews: allComparison,
    nonBaseRelationNames: [...new Set(viewRows.map((row) => row.tableName))].sort(),
    conclusion: baseComparison.matches
      ? "BASE_TABLES_MATCH_SNAPSHOT; previous abort was caused only by non-base relations"
      : "BASE_TABLE_SCHEMA_DRIFT_REQUIRES_REVIEW",
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  await client.query("ROLLBACK");
  transaction = false;
  console.log(`base_table_shape_matches_snapshot=${baseComparison.matches ? "yes" : "no"}`);
  console.log(`non_base_relation_count=${report.nonBaseRelationNames.length}`);
  console.log(`conclusion=${report.conclusion}`);
  console.log(`report=${reportPath}`);
} catch (error) {
  if (transaction) {
    try { await client.query("ROLLBACK"); } catch { /* no-op */ }
  }
  console.error(`DIAGNOSTIC_ABORTED code=${error?.code ?? "none"} message=metadata diagnostic failed`);
  process.exitCode = 1;
} finally {
  try { await client.end(); } catch { /* no-op */ }
}
