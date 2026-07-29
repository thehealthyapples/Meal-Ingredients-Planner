#!/usr/bin/env node
/**
 * Transactionally replace Neon staging application rows with Replit rows.
 *
 * Credentials are accepted only through environment variables populated by the
 * hidden-input Python launcher. They are never printed or written to disk.
 *
 * Preserved in Neon: schema, constraints, indexes, schema_migrations ledger.
 * Cleared but not copied: session (stale login sessions must not migrate).
 * Excluded: platform_turn_outcomes (retired; absent from current target schema).
 */
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

const sourceUrl = process.env.REPLIT_SOURCE_DATABASE_URL;
const targetUrl = process.env.NEON_STAGING_DATABASE_URL;
const sourceSnapshotPath = process.env.REPLIT_SCHEMA_SNAPSHOT;
const targetSnapshotPath = process.env.NEON_SCHEMA_SNAPSHOT;
const reportPath = process.env.DATA_MIGRATION_REPORT;
const nodeModules = process.env.MIGRATION_NODE_MODULES;
const expectedTargetIdentityHash = process.env.EXPECTED_NEON_STAGING_IDENTITY_SHA256;
const confirmation = process.env.MIGRATION_CONFIRM;

for (const [name, value] of Object.entries({
  REPLIT_SOURCE_DATABASE_URL: sourceUrl,
  NEON_STAGING_DATABASE_URL: targetUrl,
  REPLIT_SCHEMA_SNAPSHOT: sourceSnapshotPath,
  NEON_SCHEMA_SNAPSHOT: targetSnapshotPath,
  DATA_MIGRATION_REPORT: reportPath,
  MIGRATION_NODE_MODULES: nodeModules,
  EXPECTED_NEON_STAGING_IDENTITY_SHA256: expectedTargetIdentityHash,
})) {
  if (!value) throw new Error(`${name} is required`);
}
if (confirmation !== "REPLACE NEON STAGING DATA") {
  throw new Error("Exact destructive-staging confirmation was not supplied");
}

function endpointIdentityHash(connectionString) {
  const url = new URL(connectionString);
  const identity = [
    url.hostname.toLowerCase(),
    url.port || "5432",
    decodeURIComponent(url.pathname.replace(/^\//, "")),
    decodeURIComponent(url.username),
  ].join("\u0000");
  return createHash("sha256").update(identity).digest("hex");
}

function redactConnectionDetails(message) {
  let safe = String(message ?? "Unknown migration failure");
  for (const connectionString of [sourceUrl, targetUrl]) {
    let url;
    try {
      url = new URL(connectionString);
    } catch {
      continue;
    }
    const secrets = [
      connectionString,
      url.hostname,
      url.host,
      decodeURIComponent(url.username),
      decodeURIComponent(url.password),
    ].filter((value) => value && value.length > 0);
    for (const secret of secrets) safe = safe.split(secret).join("[REDACTED]");
  }
  return safe.replace(/postgres(?:ql)?:\/\/\S+/gi, "[REDACTED]");
}

let actualTargetIdentityHash;
try {
  actualTargetIdentityHash = endpointIdentityHash(targetUrl);
} catch {
  throw new Error("Neon target URL could not be parsed; aborting before connection");
}
if (actualTargetIdentityHash !== expectedTargetIdentityHash) {
  throw new Error("Neon target does not match the securely pinned staging identity; aborting before connection");
}

const require = createRequire(resolve(nodeModules, "package.json"));
const { Client } = require("pg");
const source = new Client({ connectionString: sourceUrl, application_name: "tha-replit-read-source" });
const target = new Client({ connectionString: targetUrl, application_name: "tha-neon-staging-refresh" });

const qid = (value) => `"${String(value).replaceAll('"', '""')}"`;
const tableSql = (name) => `${qid("public")}.${qid(name)}`;
const stableJson = (value) => JSON.stringify(value, Object.keys(value ?? {}).sort());

function snapshotShape(doc) {
  return doc.tables
    .map((table) => ({
      name: table.name,
      columns: table.columns.map((column) => ({
        name: column.name,
        dataType: column.dataType,
        udtName: column.udtName,
        nullable: Boolean(column.nullable),
      })),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function liveShape(client) {
  const result = await client.query(`
    SELECT c.relname AS "tableName", a.attname AS "columnName",
           format_type(a.atttypid, a.atttypmod) AS "dataType",
           t.typname AS "udtName", NOT a.attnotnull AS nullable,
           a.attnum AS ordinal
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_type t ON t.oid = a.atttypid
     WHERE n.nspname = 'public'
       AND c.relkind IN ('r', 'p')
       AND a.attnum > 0
       AND NOT a.attisdropped
     ORDER BY c.relname, a.attnum
  `);
  const tables = new Map();
  for (const row of result.rows) {
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

function assertSameShape(label, expected, actual) {
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error(`${label} live table/column shape differs from its verified snapshot; aborting before writes`);
  }
}

async function connectionIdentity(client) {
  const result = await client.query(`
    SELECT current_database() AS db, inet_server_addr()::text AS addr, inet_server_port() AS port
  `);
  return result.rows[0];
}

async function ledgerIds(client) {
  const result = await client.query(`SELECT id FROM public.schema_migrations ORDER BY applied_at, id`);
  return result.rows.map((row) => String(row.id));
}

async function dependencyOrder(client, applicationTables) {
  const allowed = new Set(applicationTables);
  const result = await client.query(`
    SELECT child.relname AS child, parent.relname AS parent
      FROM pg_constraint c
      JOIN pg_class child ON child.oid = c.conrelid
      JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
      JOIN pg_class parent ON parent.oid = c.confrelid
      JOIN pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
     WHERE c.contype = 'f'
       AND child_ns.nspname = 'public'
       AND parent_ns.nspname = 'public'
  `);
  const adjacency = new Map(applicationTables.map((name) => [name, new Set()]));
  const indegree = new Map(applicationTables.map((name) => [name, 0]));
  const seen = new Set();
  for (const row of result.rows) {
    if (!allowed.has(row.child) || !allowed.has(row.parent) || row.child === row.parent) continue;
    const key = `${row.parent}\u0000${row.child}`;
    if (seen.has(key)) continue;
    seen.add(key);
    adjacency.get(row.parent).add(row.child);
    indegree.set(row.child, indegree.get(row.child) + 1);
  }
  const ready = [...applicationTables.filter((name) => indegree.get(name) === 0)].sort();
  const order = [];
  while (ready.length) {
    const name = ready.shift();
    order.push(name);
    for (const child of [...adjacency.get(name)].sort()) {
      indegree.set(child, indegree.get(child) - 1);
      if (indegree.get(child) === 0) {
        ready.push(child);
        ready.sort();
      }
    }
  }
  if (order.length !== applicationTables.length) {
    throw new Error("Target foreign-key graph contains a cycle; aborting before writes");
  }
  return order;
}

function preparedValue(table, column, value, transforms) {
  let prepared = value;
  if (table === "food_diary_metrics" && column === "custom_values" && prepared === null) {
    transforms.foodDiaryNullCustomValues += 1;
    prepared = {};
  }
  const targetType = targetColumnTypes.get(`${table}\u0000${column}`);
  if (prepared !== null && (targetType === "json" || targetType === "jsonb")) {
    return JSON.stringify(prepared);
  }
  return prepared;
}

async function insertRows(client, table, columns, rows, transforms) {
  if (!rows.length) return;
  const maxParameters = 60000;
  const batchSize = Math.max(1, Math.min(250, Math.floor(maxParameters / columns.length)));
  const columnSql = columns.map(qid).join(", ");
  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const values = [];
    const tuples = batch.map((row) => {
      const placeholders = row.map((value, index) => {
        values.push(preparedValue(table, columns[index], value, transforms));
        return `$${values.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });
    await client.query(`INSERT INTO ${tableSql(table)} (${columnSql}) VALUES ${tuples.join(", ")}`, values);
  }
}

async function resetOwnedSequences(client, table) {
  const result = await client.query(`
    SELECT column_name AS column
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_default LIKE 'nextval(%'
     ORDER BY ordinal_position
  `, [table]);
  for (const row of result.rows) {
    const aggregate = await client.query(
      `SELECT COALESCE(MAX(${qid(row.column)}), 1) AS maximum, COUNT(*) > 0 AS called FROM ${tableSql(table)}`,
    );
    const sequence = await client.query(`SELECT pg_get_serial_sequence($1, $2) AS name`, [`public.${table}`, row.column]);
    if (sequence.rows[0]?.name) {
      await client.query(`SELECT setval($1::regclass, $2, $3)`, [
        sequence.rows[0].name,
        aggregate.rows[0].maximum,
        aggregate.rows[0].called,
      ]);
    }
  }
}

const sourceSnapshot = JSON.parse(await readFile(sourceSnapshotPath, "utf8"));
const targetSnapshot = JSON.parse(await readFile(targetSnapshotPath, "utf8"));
const targetTables = targetSnapshot.tables.map((table) => table.name);
const infrastructure = new Set(["schema_migrations", "session"]);
const applicationTables = targetTables.filter((name) => !infrastructure.has(name));
const targetColumns = new Map(targetSnapshot.tables.map((table) => [table.name, table.columns.map((column) => column.name)]));
const targetColumnTypes = new Map(
  targetSnapshot.tables.flatMap((table) =>
    table.columns.map((column) => [`${table.name}\u0000${column.name}`, column.udtName]),
  ),
);
const expectedLedger = targetSnapshot.migrations.flatMap((migration) => migration.entries.map((entry) => String(entry.id)));
if (expectedLedger.length !== 103 || new Set(expectedLedger).size !== 103) {
  throw new Error("Verified target snapshot must contain exactly 103 unique migration IDs");
}

let activeTable = null;
let sourceTransaction = false;
let targetTransaction = false;
let committed = false;
const report = {
  startedAt: new Date().toISOString(),
  sourceStructuralHash: sourceSnapshot.meta.contentHash,
  targetStructuralHash: targetSnapshot.meta.contentHash,
  applicationTableCount: applicationTables.length,
  copiedRowsByTable: {},
  totalCopiedRows: 0,
  skipped: { sessionRows: 0, retiredPlatformTurnOutcomeRows: 0 },
  transforms: { foodDiaryNullCustomValues: 0 },
  ledgerPreserved: false,
  rowCountsVerified: false,
};

try {
  await source.connect();
  await target.connect();
  const [sourceIdentity, targetIdentity] = await Promise.all([connectionIdentity(source), connectionIdentity(target)]);
  if (sourceIdentity.db === targetIdentity.db && sourceIdentity.addr === targetIdentity.addr && sourceIdentity.port === targetIdentity.port) {
    throw new Error("Source and target resolve to the same database; aborting");
  }

  assertSameShape("Replit source", snapshotShape(sourceSnapshot), await liveShape(source));
  assertSameShape("Neon target", snapshotShape(targetSnapshot), await liveShape(target));
  const beforeLedger = await ledgerIds(target);
  if (JSON.stringify(beforeLedger) !== JSON.stringify(expectedLedger)) {
    throw new Error("Neon target migration ledger is not the verified 103-ID sequence; aborting before writes");
  }

  const order = await dependencyOrder(target, applicationTables);
  if (order.length !== 101) throw new Error(`Expected 101 application tables, found ${order.length}`);

  await source.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  sourceTransaction = true;
  const readOnly = await source.query("SHOW transaction_read_only");
  if (readOnly.rows[0]?.transaction_read_only !== "on") throw new Error("Source transaction is not read-only");

  const sessionCount = await source.query(`SELECT COUNT(*)::bigint AS count FROM public.session`);
  report.skipped.sessionRows = Number(sessionCount.rows[0].count);
  const retiredCount = await source.query(`SELECT COUNT(*)::bigint AS count FROM public.platform_turn_outcomes`);
  report.skipped.retiredPlatformTurnOutcomeRows = Number(retiredCount.rows[0].count);

  await target.query("BEGIN");
  targetTransaction = true;
  await target.query("SET LOCAL lock_timeout = '60s'");
  await target.query("SET LOCAL statement_timeout = '0'");
  const truncateTables = [...applicationTables, "session"].map(tableSql).join(", ");
  await target.query(`TRUNCATE TABLE ${truncateTables} RESTART IDENTITY CASCADE`);

  for (const table of order) {
    activeTable = table;
    const columns = targetColumns.get(table);
    const sourceRows = await source.query({
      text: `SELECT ${columns.map(qid).join(", ")} FROM ${tableSql(table)}`,
      rowMode: "array",
    });
    await insertRows(target, table, columns, sourceRows.rows, report.transforms);
    const targetCount = await target.query(`SELECT COUNT(*)::bigint AS count FROM ${tableSql(table)}`);
    const copied = Number(targetCount.rows[0].count);
    if (copied !== sourceRows.rowCount) throw new Error(`Row-count mismatch while copying table ${table}`);
    report.copiedRowsByTable[table] = copied;
    report.totalCopiedRows += copied;
    await resetOwnedSequences(target, table);
    console.log(`${table}: ${copied} rows`);
  }

  const afterLedger = await ledgerIds(target);
  if (JSON.stringify(afterLedger) !== JSON.stringify(expectedLedger)) {
    throw new Error("Migration ledger changed during data refresh; rolling back");
  }
  report.ledgerPreserved = true;
  report.rowCountsVerified = true;

  await target.query("COMMIT");
  targetTransaction = false;
  committed = true;
  await source.query("ROLLBACK");
  sourceTransaction = false;

  report.completedAt = new Date().toISOString();
  report.status = "PASS";
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(`PASS: copied ${report.totalCopiedRows} rows across ${applicationTables.length} application tables`);
  console.log(`Report: ${reportPath}`);
} catch (error) {
  if (targetTransaction) {
    try { await target.query("ROLLBACK"); } catch { /* connection may already be closed */ }
  }
  if (sourceTransaction) {
    try { await source.query("ROLLBACK"); } catch { /* connection may already be closed */ }
  }
  const safe = {
    message: redactConnectionDetails(error?.message),
    code: error?.code ?? null,
    table: activeTable ?? error?.table ?? null,
    constraint: error?.constraint ?? null,
    column: error?.column ?? null,
  };
  if (committed) {
    console.error(`DATA_COMMITTED_BUT_REPORT_FAILED. ${JSON.stringify(safe)}`);
    process.exitCode = 2;
  } else {
    console.error(`ABORTED_AND_ROLLED_BACK. ${JSON.stringify(safe)}`);
    process.exitCode = 1;
  }
} finally {
  try { await source.end(); } catch { /* no-op */ }
  try { await target.end(); } catch { /* no-op */ }
}
