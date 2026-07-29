#!/usr/bin/env node
/**
 * export-schema-inventory.mjs
 *
 * Read-only PostgreSQL schema inventory exporter.
 *
 * Produces, in the output directory:
 *   schema.json    — machine-readable inventory (canonical, key-sorted, deterministic)
 *   schema.md      — human-readable inventory
 *   schema.sha256  — sha256sum -c compatible checksums for the two files above
 *
 * Design constraints (these are load-bearing — do not relax them):
 *
 *   1. READ ONLY. Every statement runs inside `BEGIN TRANSACTION READ ONLY`, and the
 *      transaction is always closed with ROLLBACK — including on the error path.
 *      The exporter asserts `transaction_read_only = on` before issuing any query.
 *   2. METADATA ONLY. The only table whose rows are read is `schema_migrations`, and
 *      only columns on MIGRATION_COLUMN_ALLOWLIST (migration ids / timestamps) are
 *      selected from it. No other application data is touched.
 *   3. NO CREDENTIALS IN OUTPUT. The connection string is read from the environment,
 *      never logged and never written to disk. Before the artefacts are written, the
 *      serialised payload is scanned for the URL and each of its components; a hit
 *      aborts the run.
 *   4. DETERMINISTIC. Every query carries a total ORDER BY, object keys are sorted
 *      recursively, and timestamps are read as raw strings (no local-timezone drift).
 *      Two runs against an unchanged database produce byte-identical artefacts.
 *   5. PORTABLE. Nothing here is Replit-specific. Point it at Neon staging with
 *      `--url-env STAGING_DATABASE_URL` (or by setting DATABASE_URL) and diff the
 *      resulting `contentHash` against production's.
 *
 * Usage:
 *   node export-schema-inventory.mjs [options]
 *
 *   --url-env <NAME>   Environment variable holding the connection string.
 *                      Default: DATABASE_URL
 *   --out <DIR>        Output directory. Default: the directory containing this script.
 *   --label <TEXT>     Free-text label recorded in meta.source (e.g. "neon-staging").
 *                      Default: derived from the database name.
 *   --print-hash       Print the content hash and exit non-zero on validation failure
 *                      (default behaviour already exits non-zero on failure).
 *   --help
 *
 * Requires: Node >= 18, the `pg` package resolvable from the working directory.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pg = require('pg');
const { Client, types } = pg;

const GENERATOR = 'export-schema-inventory.mjs';
const GENERATOR_VERSION = '1.0.0';
const SCHEMA_FORMAT_VERSION = 1;

/**
 * PostgreSQL system schemas. Excluded everywhere, by name and by prefix — a bare
 * NOT IN list misses the per-backend `pg_temp_N` / `pg_toast_temp_N` schemas.
 */
const SYSTEM_SCHEMAS = ['pg_catalog', 'information_schema'];
const SYSTEM_SCHEMA_PREFIXES = ['pg_toast', 'pg_temp', 'pg_toast_temp'];

/** Reused as a SQL predicate so every query filters identically. */
const NS_FILTER = `
  n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname NOT LIKE 'pg\\_toast%'
  AND n.nspname NOT LIKE 'pg\\_temp%'
`;

/**
 * Columns we are willing to read out of a schema_migrations table. Anything not on
 * this list is migration bookkeeping we do not need, or application data we must not
 * export. Unknown columns are reported in the JSON as `skippedColumns`.
 */
const MIGRATION_COLUMN_ALLOWLIST = [
  'id',
  'version',
  'name',
  'filename',
  'hash',
  'checksum',
  'applied_at',
  'created_at',
  'executed_at',
  'inserted_at',
  'run_on',
  'success',
  'dirty',
];

/** Preference order for choosing the migration table's timestamp sort key. */
const MIGRATION_TIME_COLUMNS = ['applied_at', 'executed_at', 'created_at', 'inserted_at', 'run_on'];

// ---------------------------------------------------------------------------
// Timestamps as raw strings.
//
// node-postgres parses timestamp/timestamptz into JS Date, which then serialises
// through the runner's local timezone. That makes the output machine-dependent and
// breaks the determinism guarantee, so take the wire text verbatim instead.
// ---------------------------------------------------------------------------
const asText = (v) => v;
types.setTypeParser(1082, asText); // date
types.setTypeParser(1114, asText); // timestamp
types.setTypeParser(1184, asText); // timestamptz

// Catalog identifier columns (attname, enumlabel, …) are of type `name`, so
// array_agg over them produces name[] (OID 1003) — a type node-postgres has no array
// parser for, which would silently hand back the raw literal "{id,name}" instead of an
// array. The queries below cast to text for exactly this reason; this registration is
// the belt to that pair of braces, so a missed cast degrades to a parsed array rather
// than a string that breaks downstream consumers.
types.setTypeParser(1003, types.getTypeParser(1009)); // name[] parsed as text[]

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { urlEnv: 'DATABASE_URL', out: null, label: null, printHash: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`Option ${arg} requires a value`);
      return v;
    };
    switch (arg) {
      case '--url-env': opts.urlEnv = next(); break;
      case '--out': opts.out = next(); break;
      case '--label': opts.label = next(); break;
      case '--print-hash': opts.printHash = true; break;
      case '--help': case '-h': opts.help = true; break;
      default: throw new Error(`Unknown option: ${arg}`);
    }
  }
  return opts;
}

const HELP = `
${GENERATOR} v${GENERATOR_VERSION} — read-only PostgreSQL schema inventory

  --url-env <NAME>   env var holding the connection string (default: DATABASE_URL)
  --out <DIR>        output directory (default: this script's directory)
  --label <TEXT>     label recorded in meta.source (e.g. "neon-staging")
  --print-hash       echo the content hash on success
  --help

The connection string is never printed and never written to any artefact.
`.trim();

// ---------------------------------------------------------------------------
// Canonical JSON
// ---------------------------------------------------------------------------

/** Recursively sort object keys so serialisation is independent of insertion order. */
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonicalize(value[key]);
    return out;
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value), null, 2) + '\n';
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------
// Queries
//
// Every query is a bare SELECT with a total ORDER BY. The `statements` log below
// records each one so the run can assert afterwards that nothing but SELECT/SHOW
// was ever sent over the wire.
// ---------------------------------------------------------------------------

const Q = {
  server: `
    SELECT current_database()              AS database,
           version()                       AS version,
           current_setting('server_version') AS server_version,
           current_setting('server_version_num')::int AS server_version_num
  `,

  readOnlyCheck: `SELECT current_setting('transaction_read_only') AS read_only`,

  schemas: `
    SELECT n.nspname                            AS name,
           pg_catalog.pg_get_userbyid(n.nspowner) AS owner,
           obj_description(n.oid, 'pg_namespace') AS comment
    FROM pg_namespace n
    WHERE ${NS_FILTER}
    ORDER BY n.nspname
  `,

  extensions: `
    SELECT e.extname AS name, n.nspname AS schema, e.extversion AS version
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    ORDER BY e.extname
  `,

  relations: `
    SELECT n.nspname                              AS schema,
           c.relname                              AS name,
           c.relkind                              AS kind,
           pg_catalog.pg_get_userbyid(c.relowner) AS owner,
           c.relrowsecurity                       AS row_security_enabled,
           c.relforcerowsecurity                  AS row_security_forced,
           c.relpersistence                       AS persistence,
           obj_description(c.oid, 'pg_class')     AS comment,
           pc.relname                             AS partition_parent,
           pg_get_expr(c.relpartbound, c.oid, true) AS partition_bound,
           CASE WHEN c.relkind IN ('p') THEN pg_get_partkeydef(c.oid) END AS partition_key,
           CASE WHEN c.relkind IN ('v', 'm') THEN pg_get_viewdef(c.oid, true) END AS definition,
           CASE WHEN c.relkind = 'm' THEN c.relispopulated END AS is_populated
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_inherits inh ON inh.inhrelid = c.oid
    LEFT JOIN pg_class pc ON pc.oid = inh.inhparent
    WHERE ${NS_FILTER}
      AND c.relkind IN ('r', 'p', 'f', 'v', 'm')
    ORDER BY n.nspname, c.relkind, c.relname
  `,

  columns: `
    SELECT n.nspname                                        AS schema,
           c.relname                                        AS relation,
           a.attnum                                         AS ordinal_position,
           a.attname                                        AS name,
           format_type(a.atttypid, a.atttypmod)             AS data_type,
           t.typname                                        AS udt_name,
           tn.nspname                                       AS udt_schema,
           NOT a.attnotnull                                 AS is_nullable,
           pg_get_expr(ad.adbin, ad.adrelid)                AS column_default,
           CASE a.attidentity WHEN 'a' THEN 'ALWAYS' WHEN 'd' THEN 'BY DEFAULT' END AS identity,
           CASE a.attgenerated WHEN 's' THEN 'STORED' END   AS generated,
           col.collname                                     AS collation,
           col_description(c.oid, a.attnum)                 AS comment
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_type t ON t.oid = a.atttypid
    JOIN pg_namespace tn ON tn.oid = t.typnamespace
    LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
    LEFT JOIN pg_collation col ON col.oid = a.attcollation AND a.attcollation <> t.typcollation
    WHERE ${NS_FILTER}
      AND c.relkind IN ('r', 'p', 'f', 'v', 'm')
      AND a.attnum > 0
      AND NOT a.attisdropped
    ORDER BY n.nspname, c.relname, a.attnum
  `,

  constraints: `
    SELECT n.nspname                              AS schema,
           r.relname                              AS relation,
           con.conname                            AS name,
           con.contype                            AS type,
           pg_get_constraintdef(con.oid, true)    AS definition,
           con.condeferrable                      AS deferrable,
           con.condeferred                        AS deferred,
           con.convalidated                       AS validated,
           (SELECT array_agg(att.attname::text ORDER BY k.ord)
              FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
              JOIN pg_attribute att
                ON att.attrelid = con.conrelid AND att.attnum = k.attnum) AS columns,
           fn.nspname                             AS references_schema,
           fr.relname                             AS references_table,
           (SELECT array_agg(att.attname::text ORDER BY k.ord)
              FROM unnest(con.confkey) WITH ORDINALITY AS k(attnum, ord)
              JOIN pg_attribute att
                ON att.attrelid = con.confrelid AND att.attnum = k.attnum) AS references_columns,
           CASE con.confupdtype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
                                WHEN 'c' THEN 'CASCADE'   WHEN 'n' THEN 'SET NULL'
                                WHEN 'd' THEN 'SET DEFAULT' END AS on_update,
           CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
                                WHEN 'c' THEN 'CASCADE'   WHEN 'n' THEN 'SET NULL'
                                WHEN 'd' THEN 'SET DEFAULT' END AS on_delete,
           CASE con.confmatchtype WHEN 'f' THEN 'FULL' WHEN 'p' THEN 'PARTIAL'
                                  WHEN 's' THEN 'SIMPLE' END AS match_type
    FROM pg_constraint con
    JOIN pg_class r ON r.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    LEFT JOIN pg_class fr ON fr.oid = con.confrelid
    LEFT JOIN pg_namespace fn ON fn.oid = fr.relnamespace
    WHERE ${NS_FILTER}
      AND con.contype IN ('p', 'f', 'u', 'c', 'x')
    ORDER BY n.nspname, r.relname, con.contype, con.conname
  `,

  indexes: `
    SELECT n.nspname                          AS schema,
           t.relname                          AS relation,
           i.relname                          AS name,
           pg_get_indexdef(x.indexrelid, 0, true) AS definition,
           am.amname                          AS method,
           x.indisunique                      AS is_unique,
           x.indisprimary                     AS is_primary,
           x.indisexclusion                   AS is_exclusion,
           x.indisvalid                       AS is_valid,
           x.indpred IS NOT NULL              AS is_partial,
           (con.oid IS NOT NULL)              AS backs_constraint,
           (SELECT array_agg(att.attname::text ORDER BY k.ord)
              FROM unnest(x.indkey) WITH ORDINALITY AS k(attnum, ord)
              JOIN pg_attribute att
                ON att.attrelid = x.indrelid AND att.attnum = k.attnum
             WHERE k.attnum <> 0)             AS columns
    FROM pg_index x
    JOIN pg_class i ON i.oid = x.indexrelid
    JOIN pg_class t ON t.oid = x.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_am am ON am.oid = i.relam
    -- conindid is ALSO set on foreign-key constraints, where it points at the
    -- REFERENCED table's index. Joining on conindid alone therefore emits one extra
    -- row per inbound FK for every referenced unique/primary index, inflating the
    -- index count. Only p/u/x constraints actually own their index, so restrict to
    -- those and require the constraint to live on the same relation as the index.
    LEFT JOIN pg_constraint con
      ON con.conindid = x.indexrelid
     AND con.conrelid = x.indrelid
     AND con.contype IN ('p', 'u', 'x')
    WHERE ${NS_FILTER}
    ORDER BY n.nspname, t.relname, i.relname
  `,

  enums: `
    SELECT n.nspname                              AS schema,
           t.typname                              AS name,
           pg_catalog.pg_get_userbyid(t.typowner) AS owner,
           (SELECT array_agg(e.enumlabel::text ORDER BY e.enumsortorder, e.enumlabel)
              FROM pg_enum e WHERE e.enumtypid = t.oid) AS labels,
           obj_description(t.oid, 'pg_type')      AS comment
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE ${NS_FILTER} AND t.typtype = 'e'
    ORDER BY n.nspname, t.typname
  `,

  domains: `
    SELECT n.nspname                                    AS schema,
           t.typname                                    AS name,
           format_type(t.typbasetype, t.typtypmod)      AS base_type,
           NOT t.typnotnull                             AS is_nullable,
           t.typdefault                                 AS default_value,
           (SELECT array_agg(pg_get_constraintdef(c.oid, true) ORDER BY c.conname)
              FROM pg_constraint c WHERE c.contypid = t.oid) AS checks
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE ${NS_FILTER} AND t.typtype = 'd'
    ORDER BY n.nspname, t.typname
  `,

  sequences: `
    SELECT n.nspname                              AS schema,
           c.relname                              AS name,
           format_type(s.seqtypid, NULL)          AS data_type,
           s.seqstart                             AS start_value,
           s.seqmin                               AS min_value,
           s.seqmax                               AS max_value,
           s.seqincrement                         AS increment_by,
           s.seqcycle                             AS cycles,
           s.seqcache                             AS cache_size,
           pg_catalog.pg_get_userbyid(c.relowner) AS owner,
           on_n.nspname                           AS owned_by_schema,
           on_t.relname                           AS owned_by_table,
           on_a.attname                           AS owned_by_column
    FROM pg_sequence s
    JOIN pg_class c ON c.oid = s.seqrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_depend d
      ON d.classid = 'pg_class'::regclass AND d.objid = c.oid
     AND d.refclassid = 'pg_class'::regclass AND d.deptype IN ('a', 'i')
    LEFT JOIN pg_class on_t ON on_t.oid = d.refobjid
    LEFT JOIN pg_namespace on_n ON on_n.oid = on_t.relnamespace
    LEFT JOIN pg_attribute on_a ON on_a.attrelid = d.refobjid AND on_a.attnum = d.refobjsubid
    WHERE ${NS_FILTER}
    ORDER BY n.nspname, c.relname
  `,

  triggers: `
    SELECT n.nspname                           AS schema,
           c.relname                           AS relation,
           tg.tgname                           AS name,
           pg_get_triggerdef(tg.oid, true)     AS definition,
           CASE tg.tgenabled WHEN 'O' THEN 'ENABLED' WHEN 'D' THEN 'DISABLED'
                             WHEN 'R' THEN 'ENABLED REPLICA' WHEN 'A' THEN 'ENABLED ALWAYS' END AS enabled,
           fn.nspname                          AS function_schema,
           p.proname                           AS function_name
    FROM pg_trigger tg
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = tg.tgfoid
    JOIN pg_namespace fn ON fn.oid = p.pronamespace
    WHERE ${NS_FILTER} AND NOT tg.tgisinternal
    ORDER BY n.nspname, c.relname, tg.tgname
  `,

  policies: `
    SELECT n.nspname                     AS schema,
           c.relname                     AS relation,
           pol.polname                   AS name,
           pol.polpermissive             AS permissive,
           CASE pol.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
                           WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE'
                           WHEN '*' THEN 'ALL' END AS command,
           (SELECT array_agg(pg_catalog.pg_get_userbyid(r)::text ORDER BY pg_catalog.pg_get_userbyid(r))
              FROM unnest(pol.polroles) AS r) AS roles,
           pg_get_expr(pol.polqual, pol.polrelid, true)      AS using_expression,
           pg_get_expr(pol.polwithcheck, pol.polrelid, true) AS with_check_expression
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE ${NS_FILTER}
    ORDER BY n.nspname, c.relname, pol.polname
  `,

  migrationTables: `
    SELECT n.nspname AS schema, c.relname AS name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE ${NS_FILTER} AND c.relkind IN ('r', 'p') AND c.relname = 'schema_migrations'
    ORDER BY n.nspname, c.relname
  `,

  migrationColumns: `
    SELECT a.attname AS name, format_type(a.atttypid, a.atttypmod) AS data_type
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = $1 AND c.relname = $2 AND a.attnum > 0 AND NOT a.attisdropped
    ORDER BY a.attnum
  `,
};

// ---------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------

const RELKIND_LABEL = {
  r: 'table',
  p: 'partitioned table',
  f: 'foreign table',
  v: 'view',
  m: 'materialized view',
};

const CONTYPE_KEY = { p: 'primaryKey', f: 'foreignKeys', u: 'unique', c: 'check', x: 'exclusion' };

/** Group rows by a composite key so per-relation attachment is a single pass. */
function groupBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

const relKey = (schema, name) => `${schema} ${name}`;

/** Strip nulls so the JSON stays readable; absent means "not applicable". */
function compact(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) out[k] = v;
  }
  return out;
}

async function collect(client, statements) {
  const run = async (name, sql, params) => {
    statements.push({ name, sql: sql.trim() });
    const result = await client.query(sql, params);
    return result.rows;
  };

  const [server] = await run('server', Q.server);
  const [readOnly] = await run('readOnlyCheck', Q.readOnlyCheck);
  if (readOnly.read_only !== 'on') {
    throw new Error('Refusing to continue: transaction is not READ ONLY');
  }

  const [
    schemas, extensions, relations, columns, constraints,
    indexes, enums, domains, sequences, triggers, policies, migrationTables,
  ] = [
    await run('schemas', Q.schemas),
    await run('extensions', Q.extensions),
    await run('relations', Q.relations),
    await run('columns', Q.columns),
    await run('constraints', Q.constraints),
    await run('indexes', Q.indexes),
    await run('enums', Q.enums),
    await run('domains', Q.domains),
    await run('sequences', Q.sequences),
    await run('triggers', Q.triggers),
    await run('policies', Q.policies),
    await run('migrationTables', Q.migrationTables),
  ];

  const columnsByRel = groupBy(columns, (r) => relKey(r.schema, r.relation));
  const constraintsByRel = groupBy(constraints, (r) => relKey(r.schema, r.relation));
  const indexesByRel = groupBy(indexes, (r) => relKey(r.schema, r.relation));
  const triggersByRel = groupBy(triggers, (r) => relKey(r.schema, r.relation));
  const policiesByRel = groupBy(policies, (r) => relKey(r.schema, r.relation));

  const buildColumns = (key) =>
    (columnsByRel.get(key) ?? []).map((c) =>
      compact({
        name: c.name,
        ordinalPosition: c.ordinal_position,
        dataType: c.data_type,
        udtName: c.udt_name,
        udtSchema: c.udt_schema === 'pg_catalog' ? null : c.udt_schema,
        nullable: c.is_nullable,
        default: c.column_default,
        identity: c.identity,
        generated: c.generated,
        collation: c.collation,
        comment: c.comment,
      }),
    );

  const buildConstraints = (key) => {
    const rows = constraintsByRel.get(key) ?? [];
    const out = { primaryKey: null, foreignKeys: [], unique: [], check: [], exclusion: [] };
    for (const c of rows) {
      const base = compact({
        name: c.name,
        definition: c.definition,
        columns: c.columns,
        deferrable: c.deferrable || null,
        deferred: c.deferred || null,
        validated: c.validated === false ? false : null,
      });
      const bucket = CONTYPE_KEY[c.type];
      if (bucket === 'primaryKey') {
        out.primaryKey = base;
      } else if (bucket === 'foreignKeys') {
        out.foreignKeys.push(
          compact({
            ...base,
            referencesSchema: c.references_schema,
            referencesTable: c.references_table,
            referencesColumns: c.references_columns,
            onUpdate: c.on_update,
            onDelete: c.on_delete,
            matchType: c.match_type,
          }),
        );
      } else if (bucket) {
        out[bucket].push(base);
      }
    }
    return out;
  };

  const buildIndexes = (key) =>
    (indexesByRel.get(key) ?? []).map((i) =>
      compact({
        name: i.name,
        definition: i.definition,
        method: i.method,
        columns: i.columns,
        unique: i.is_unique,
        primary: i.is_primary,
        exclusion: i.is_exclusion || null,
        partial: i.is_partial || null,
        valid: i.is_valid === false ? false : null,
        backsConstraint: i.backs_constraint,
      }),
    );

  const buildTriggers = (key) =>
    (triggersByRel.get(key) ?? []).map((t) =>
      compact({
        name: t.name,
        definition: t.definition,
        enabled: t.enabled,
        functionSchema: t.function_schema,
        functionName: t.function_name,
      }),
    );

  const buildPolicies = (key) =>
    (policiesByRel.get(key) ?? []).map((p) =>
      compact({
        name: p.name,
        command: p.command,
        permissive: p.permissive,
        roles: p.roles,
        using: p.using_expression,
        withCheck: p.with_check_expression,
      }),
    );

  const tables = [];
  const views = [];

  for (const rel of relations) {
    const key = relKey(rel.schema, rel.name);
    const common = {
      schema: rel.schema,
      name: rel.name,
      kind: RELKIND_LABEL[rel.kind] ?? rel.kind,
      owner: rel.owner,
      comment: rel.comment,
      columns: buildColumns(key),
    };

    if (rel.kind === 'v' || rel.kind === 'm') {
      views.push(
        compact({
          ...common,
          materialized: rel.kind === 'm',
          populated: rel.is_populated,
          definition: rel.definition,
          indexes: rel.kind === 'm' ? buildIndexes(key) : undefined,
          triggers: buildTriggers(key).length ? buildTriggers(key) : undefined,
        }),
      );
      continue;
    }

    const triggersForRel = buildTriggers(key);
    const policiesForRel = buildPolicies(key);
    tables.push(
      compact({
        ...common,
        persistence: rel.persistence === 'p' ? 'permanent' : rel.persistence === 'u' ? 'unlogged' : 'temporary',
        partitionParent: rel.partition_parent,
        partitionBound: rel.partition_bound,
        partitionKey: rel.partition_key,
        rowSecurity: {
          enabled: rel.row_security_enabled,
          forced: rel.row_security_forced,
          policyCount: policiesForRel.length,
        },
        constraints: buildConstraints(key),
        indexes: buildIndexes(key),
        triggers: triggersForRel,
        policies: policiesForRel,
      }),
    );
  }

  // -------------------------------------------------------------------------
  // Migrations. Only allowlisted id/timestamp columns are read; anything else
  // present on the table is recorded by name only, never by value.
  // -------------------------------------------------------------------------
  const migrations = [];
  for (const mt of migrationTables) {
    const cols = await run('migrationColumns', Q.migrationColumns, [mt.schema, mt.name]);
    const selected = cols.filter((c) => MIGRATION_COLUMN_ALLOWLIST.includes(c.name));
    const skipped = cols.filter((c) => !MIGRATION_COLUMN_ALLOWLIST.includes(c.name)).map((c) => c.name);

    let rows = [];
    if (selected.length > 0) {
      const colList = selected.map((c) => `"${c.name.replace(/"/g, '""')}"`).join(', ');
      const timeCol = MIGRATION_TIME_COLUMNS.find((n) => selected.some((c) => c.name === n));
      const orderParts = [];
      if (timeCol) orderParts.push(`"${timeCol}" ASC NULLS LAST`);
      for (const c of selected) if (c.name !== timeCol) orderParts.push(`"${c.name}" ASC NULLS LAST`);
      const sql =
        `SELECT ${colList} FROM "${mt.schema.replace(/"/g, '""')}"."${mt.name.replace(/"/g, '""')}"` +
        ` ORDER BY ${orderParts.join(', ')}`;
      rows = await run('migrationRows', sql);
    }

    migrations.push({
      schema: mt.schema,
      table: mt.name,
      columnsExported: selected.map((c) => ({ name: c.name, dataType: c.data_type })),
      skippedColumns: skipped,
      count: rows.length,
      entries: rows,
    });
  }

  return {
    server: {
      database: server.database,
      serverVersion: server.server_version,
      serverVersionNum: server.server_version_num,
      versionString: server.version,
    },
    schemas: schemas.map((s) => compact({ name: s.name, owner: s.owner, comment: s.comment })),
    extensions: extensions.map((e) => ({ name: e.name, schema: e.schema, version: e.version })),
    enums: enums.map((e) =>
      compact({ schema: e.schema, name: e.name, owner: e.owner, labels: e.labels ?? [], comment: e.comment }),
    ),
    domains: domains.map((d) =>
      compact({
        schema: d.schema,
        name: d.name,
        baseType: d.base_type,
        nullable: d.is_nullable,
        default: d.default_value,
        checks: d.checks,
      }),
    ),
    tables,
    views,
    sequences: sequences.map((s) =>
      compact({
        schema: s.schema,
        name: s.name,
        dataType: s.data_type,
        startValue: String(s.start_value),
        minValue: String(s.min_value),
        maxValue: String(s.max_value),
        incrementBy: String(s.increment_by),
        cycles: s.cycles,
        cacheSize: String(s.cache_size),
        owner: s.owner,
        ownedBy:
          s.owned_by_table && s.owned_by_column
            ? `${s.owned_by_schema}.${s.owned_by_table}.${s.owned_by_column}`
            : null,
      }),
    ),
    migrations,
  };
}

// ---------------------------------------------------------------------------
// Counts
// ---------------------------------------------------------------------------

function countObjects(inv) {
  const sum = (arr, fn) => arr.reduce((n, x) => n + fn(x), 0);
  const constraintCount = (kind) =>
    sum(inv.tables, (t) => {
      const c = t.constraints ?? {};
      if (kind === 'primaryKey') return c.primaryKey ? 1 : 0;
      return (c[kind] ?? []).length;
    });

  return {
    schemas: inv.schemas.length,
    extensions: inv.extensions.length,
    tables: inv.tables.filter((t) => t.kind === 'table').length,
    partitionedTables: inv.tables.filter((t) => t.kind === 'partitioned table').length,
    foreignTables: inv.tables.filter((t) => t.kind === 'foreign table').length,
    views: inv.views.filter((v) => !v.materialized).length,
    materializedViews: inv.views.filter((v) => v.materialized).length,
    columns: sum(inv.tables, (t) => t.columns.length) + sum(inv.views, (v) => v.columns.length),
    primaryKeys: constraintCount('primaryKey'),
    foreignKeys: constraintCount('foreignKeys'),
    uniqueConstraints: constraintCount('unique'),
    checkConstraints: constraintCount('check'),
    exclusionConstraints: constraintCount('exclusion'),
    indexes: sum(inv.tables, (t) => (t.indexes ?? []).length) + sum(inv.views, (v) => (v.indexes ?? []).length),
    enums: inv.enums.length,
    enumLabels: sum(inv.enums, (e) => e.labels.length),
    domains: inv.domains.length,
    sequences: inv.sequences.length,
    triggers: sum(inv.tables, (t) => (t.triggers ?? []).length) + sum(inv.views, (v) => (v.triggers ?? []).length),
    rlsEnabledTables: inv.tables.filter((t) => t.rowSecurity?.enabled).length,
    rlsPolicies: sum(inv.tables, (t) => (t.policies ?? []).length),
    migrationTables: inv.migrations.length,
    migrationEntries: sum(inv.migrations, (m) => m.count),
  };
}

// ---------------------------------------------------------------------------
// Credential scan
//
// Belt-and-braces: the payload is built from catalog metadata only, so a hit here
// means a bug or a genuinely credential-shaped identifier. Either way, abort.
// ---------------------------------------------------------------------------

/**
 * Secret material only.
 *
 * Deliberately NOT scanned: the username and the hostname. Both legitimately occur
 * in catalog metadata — the connecting role owns every object and so appears in each
 * `owner` field, and a host name is frequently a substring of the database name.
 * Treating them as secrets produces guaranteed false positives and would make the
 * scan unrunnable; they are also not credentials. What must never reach disk is the
 * password, the assembled connection string, and any `user:pass@host` userinfo.
 */
function credentialTokens(connectionString) {
  const tokens = new Set([connectionString]);
  try {
    const u = new URL(connectionString);
    if (u.password) {
      tokens.add(u.password);
      tokens.add(decodeURIComponent(u.password));
      if (u.username) tokens.add(`${u.username}:${u.password}`);
    }
  } catch {
    /* not a URL — the whole-string check above still applies */
  }
  // A 1–3 character password would match almost any text; the URI regex below is the
  // real backstop for those.
  return [...tokens].filter((t) => t && t.length >= 4);
}

/**
 * A token is "ambiguous" when it is too low-entropy to distinguish a leaked secret
 * from ordinary schema vocabulary. A password of literally `password` matches every
 * `password_hash` column in the database; aborting on that would be a false positive,
 * but silently ignoring it would be a hole. Such matches are downgraded to warnings
 * and reported with the token redacted out of the surrounding context, so a human can
 * confirm at a glance that the hits are identifiers rather than a credential.
 */
function isAmbiguousToken(token) {
  return /^[a-z]{1,12}$/.test(token) || /^[a-z0-9_]{1,10}$/.test(token);
}

/** Surrounding text for each match, with the secret itself replaced. */
function redactedContexts(text, token, limit = 3) {
  const contexts = [];
  let from = 0;
  while (contexts.length < limit) {
    const at = text.indexOf(token, from);
    if (at === -1) break;
    const before = text.slice(Math.max(0, at - 40), at).replace(/\s+/g, ' ');
    const after = text.slice(at + token.length, at + token.length + 40).replace(/\s+/g, ' ');
    contexts.push(`…${before}«REDACTED»${after}…`);
    from = at + token.length;
  }
  return contexts;
}

/**
 * Returns { hard, soft }. `hard` entries abort the run; `soft` entries are surfaced
 * to the operator but do not block, and only ever arise from ambiguous tokens.
 */
function scanForCredentials(text, connectionString) {
  const hard = [];
  const soft = [];

  for (const token of credentialTokens(connectionString)) {
    if (!text.includes(token)) continue;
    const matches = text.split(token).length - 1;
    if (isAmbiguousToken(token)) {
      soft.push({
        reason: `low-entropy secret token (${token.length} chars) also occurs as schema vocabulary`,
        matches,
        contexts: redactedContexts(text, token),
      });
    } else {
      hard.push(`secret token (${token.length} chars), ${matches} match(es)`);
    }
  }

  // Shape-based checks. These stay hard regardless of token entropy — they are what
  // an actual leaked connection string looks like, and they cannot false-positive on
  // catalog metadata.
  if (/postgres(ql)?:\/\/[^\s"']*:[^\s"']*@/i.test(text)) hard.push('inline connection URI with userinfo');
  if (/\b(PGPASSWORD|PGPASSFILE)\b/.test(text)) hard.push('PostgreSQL password environment variable');

  return { hard, soft };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(parsed, connectionString, jsonText) {
  const errors = [];
  const checks = [];
  const ok = (name, condition, detail) => {
    checks.push({ name, passed: Boolean(condition), detail: detail ?? null });
    if (!condition) errors.push(`${name}${detail ? `: ${detail}` : ''}`);
  };

  ok('json.parses', parsed && typeof parsed === 'object');
  for (const key of ['meta', 'counts', 'schemas', 'tables', 'views', 'enums', 'sequences', 'migrations']) {
    ok(`json.hasKey.${key}`, Object.prototype.hasOwnProperty.call(parsed, key));
  }

  const declared = parsed.counts ?? {};
  const recomputed = countObjects(parsed);
  const mismatched = Object.keys(recomputed).filter((k) => recomputed[k] !== declared[k]);
  ok('counts.consistent', mismatched.length === 0, mismatched.length ? `mismatched: ${mismatched.join(', ')}` : null);

  const schemaNames = new Set((parsed.schemas ?? []).map((s) => s.name));
  const systemLeak = [...schemaNames].filter(
    (n) => SYSTEM_SCHEMAS.includes(n) || SYSTEM_SCHEMA_PREFIXES.some((p) => n.startsWith(p)),
  );
  ok('schemas.noSystemSchemas', systemLeak.length === 0, systemLeak.join(', ') || null);

  const relations = [...(parsed.tables ?? []), ...(parsed.views ?? [])];
  const orphanSchema = relations.filter((r) => !schemaNames.has(r.schema)).map((r) => `${r.schema}.${r.name}`);
  ok('relations.schemaResolved', orphanSchema.length === 0, orphanSchema.slice(0, 5).join(', ') || null);

  const emptyColumns = (parsed.tables ?? []).filter((t) => !Array.isArray(t.columns) || t.columns.length === 0);
  ok('tables.haveColumns', emptyColumns.length === 0, emptyColumns.map((t) => `${t.schema}.${t.name}`).slice(0, 5).join(', ') || null);

  const tableKeys = new Set((parsed.tables ?? []).map((t) => `${t.schema}.${t.name}`));
  const danglingFks = [];
  for (const t of parsed.tables ?? []) {
    for (const fk of t.constraints?.foreignKeys ?? []) {
      const target = `${fk.referencesSchema}.${fk.referencesTable}`;
      if (!tableKeys.has(target)) danglingFks.push(`${t.schema}.${t.name}.${fk.name} -> ${target}`);
    }
  }
  ok('foreignKeys.targetsResolved', danglingFks.length === 0, danglingFks.slice(0, 5).join(', ') || null);

  // A duplicated index row means a catalog join fanned out (see the pg_constraint
  // note on the index query). Index names are unique per schema, so any repeat is a
  // collection bug rather than a real object.
  const dupIndexes = [];
  for (const r of relations) {
    const seen = new Set();
    for (const i of r.indexes ?? []) {
      if (seen.has(i.name)) dupIndexes.push(`${r.schema}.${r.name}.${i.name}`);
      seen.add(i.name);
    }
  }
  ok('indexes.noDuplicates', dupIndexes.length === 0, dupIndexes.slice(0, 5).join(', ') || null);

  const dupConstraints = [];
  for (const t of parsed.tables ?? []) {
    const c = t.constraints ?? {};
    const names = [
      ...(c.primaryKey ? [c.primaryKey.name] : []),
      ...(c.foreignKeys ?? []).map((x) => x.name),
      ...(c.unique ?? []).map((x) => x.name),
      ...(c.check ?? []).map((x) => x.name),
      ...(c.exclusion ?? []).map((x) => x.name),
    ];
    if (new Set(names).size !== names.length) dupConstraints.push(`${t.schema}.${t.name}`);
  }
  ok('constraints.noDuplicates', dupConstraints.length === 0, dupConstraints.slice(0, 5).join(', ') || null);

  const badEnums = (parsed.enums ?? []).filter((e) => !Array.isArray(e.labels) || e.labels.length === 0);
  ok('enums.haveLabels', badEnums.length === 0, badEnums.map((e) => `${e.schema}.${e.name}`).join(', ') || null);

  const badMigrations = (parsed.migrations ?? []).filter((m) => m.count !== (m.entries ?? []).length);
  ok('migrations.countMatchesEntries', badMigrations.length === 0);

  const migrationLeak = (parsed.migrations ?? []).flatMap((m) =>
    (m.columnsExported ?? []).map((c) => c.name).filter((n) => !MIGRATION_COLUMN_ALLOWLIST.includes(n)),
  );
  ok('migrations.allowlistedColumnsOnly', migrationLeak.length === 0, migrationLeak.join(', ') || null);

  const credScan = scanForCredentials(jsonText, connectionString);
  ok('output.noCredentials', credScan.hard.length === 0, credScan.hard.join(', ') || null);
  ok(
    'output.noConnectionUri',
    !/postgres(ql)?:\/\//i.test(jsonText),
    /postgres(ql)?:\/\//i.test(jsonText) ? 'a postgres:// URI appears in the output' : null,
  );

  return { valid: errors.length === 0, checks, errors, softWarnings: credScan.soft };
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

const mdEscape = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const code = (s) => (s === null || s === undefined || s === '' ? '—' : `\`${mdEscape(s)}\``);

function renderMarkdown(doc) {
  const { meta, counts, schemas, extensions, enums, domains, tables, views, sequences, migrations } = doc;
  const L = [];

  L.push('# PostgreSQL Schema Inventory');
  L.push('');
  L.push(`Read-only structural inventory of \`${meta.source.database}\` (${meta.source.label}).`);
  L.push('');
  L.push('| Field | Value |');
  L.push('| --- | --- |');
  L.push(`| Generated at | ${meta.generatedAt} |`);
  L.push(`| Generator | \`${meta.generator}\` v${meta.generatorVersion} |`);
  L.push(`| Format version | ${meta.schemaFormatVersion} |`);
  L.push(`| Server version | ${meta.source.serverVersion} |`);
  L.push(`| Database | \`${meta.source.database}\` |`);
  L.push(`| Content hash (SHA-256) | \`${meta.contentHash}\` |`);
  L.push('');
  L.push(
    '> The content hash covers the structural payload only — it excludes `meta` (generation time, ' +
      'labels), so the same schema on Replit and on Neon staging hashes identically.',
  );
  L.push('');
  L.push('**Safety:** collected inside a `BEGIN TRANSACTION READ ONLY` block closed with `ROLLBACK`. ' +
    'No DDL, no DML, no application rows. The only table rows read are migration ids and timestamps ' +
    'from `schema_migrations`. Connection details are never recorded in this file.');
  L.push('');

  L.push('## Object counts');
  L.push('');
  L.push('| Object | Count |');
  L.push('| --- | ---: |');
  for (const [key, value] of Object.entries(counts)) {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
    L.push(`| ${label} | ${value} |`);
  }
  L.push('');

  L.push('## Schemas');
  L.push('');
  L.push('| Schema | Owner | Tables | Views | Sequences | Comment |');
  L.push('| --- | --- | ---: | ---: | ---: | --- |');
  for (const s of schemas) {
    L.push(
      `| \`${s.name}\` | ${mdEscape(s.owner)} | ${tables.filter((t) => t.schema === s.name).length} | ` +
        `${views.filter((v) => v.schema === s.name).length} | ` +
        `${sequences.filter((q) => q.schema === s.name).length} | ${mdEscape(s.comment ?? '—')} |`,
    );
  }
  L.push('');

  if (extensions.length) {
    L.push('## Extensions');
    L.push('');
    L.push('| Extension | Schema | Version |');
    L.push('| --- | --- | --- |');
    for (const e of extensions) L.push(`| \`${e.name}\` | \`${e.schema}\` | ${mdEscape(e.version)} |`);
    L.push('');
  }

  L.push('## Enums');
  L.push('');
  if (!enums.length) {
    L.push('_No user-defined enum types._');
  } else {
    L.push('| Type | Labels |');
    L.push('| --- | --- |');
    for (const e of enums) {
      L.push(`| \`${e.schema}.${e.name}\` | ${e.labels.map((l) => `\`${mdEscape(l)}\``).join(', ')} |`);
    }
  }
  L.push('');

  if (domains.length) {
    L.push('## Domains');
    L.push('');
    L.push('| Domain | Base type | Nullable | Default | Checks |');
    L.push('| --- | --- | --- | --- | --- |');
    for (const d of domains) {
      L.push(
        `| \`${d.schema}.${d.name}\` | ${code(d.baseType)} | ${d.nullable ? 'yes' : 'no'} | ` +
          `${code(d.default)} | ${(d.checks ?? []).map((c) => `\`${mdEscape(c)}\``).join('; ') || '—'} |`,
      );
    }
    L.push('');
  }

  L.push('## Views');
  L.push('');
  if (!views.length) {
    L.push('_No views or materialized views._');
  } else {
    L.push('| View | Kind | Columns |');
    L.push('| --- | --- | ---: |');
    for (const v of views) L.push(`| \`${v.schema}.${v.name}\` | ${v.kind} | ${v.columns.length} |`);
    L.push('');
    for (const v of views) {
      L.push(`### \`${v.schema}.${v.name}\``);
      L.push('');
      L.push('```sql');
      L.push(v.definition ?? '-- definition unavailable');
      L.push('```');
      L.push('');
    }
  }
  L.push('');

  L.push('## Triggers');
  L.push('');
  const allTriggers = [...tables, ...views].flatMap((r) =>
    (r.triggers ?? []).map((t) => ({ ...t, relation: `${r.schema}.${r.name}` })),
  );
  if (!allTriggers.length) {
    L.push('_No user-defined triggers._');
  } else {
    L.push('| Relation | Trigger | Enabled | Function | Definition |');
    L.push('| --- | --- | --- | --- | --- |');
    for (const t of allTriggers) {
      L.push(
        `| \`${t.relation}\` | \`${t.name}\` | ${t.enabled} | ` +
          `\`${t.functionSchema}.${t.functionName}\` | ${code(t.definition)} |`,
      );
    }
  }
  L.push('');

  L.push('## Row-level security');
  L.push('');
  const rlsTables = tables.filter((t) => t.rowSecurity?.enabled || (t.policies ?? []).length);
  if (!rlsTables.length) {
    L.push('_RLS is not enabled on any table, and no policies are defined._');
    L.push('');
    L.push('> Access control is therefore enforced entirely in the application layer.');
  } else {
    L.push('| Table | RLS enabled | Forced | Policy | Command | Roles | USING | WITH CHECK |');
    L.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const t of rlsTables) {
      const policies = t.policies ?? [];
      if (!policies.length) {
        L.push(`| \`${t.schema}.${t.name}\` | yes | ${t.rowSecurity.forced ? 'yes' : 'no'} | — | — | — | — | — |`);
        continue;
      }
      for (const p of policies) {
        L.push(
          `| \`${t.schema}.${t.name}\` | ${t.rowSecurity.enabled ? 'yes' : 'no'} | ` +
            `${t.rowSecurity.forced ? 'yes' : 'no'} | \`${p.name}\` | ${p.command} | ` +
            `${(p.roles ?? []).join(', ') || '—'} | ${code(p.using)} | ${code(p.withCheck)} |`,
        );
      }
    }
  }
  L.push('');

  L.push('## Sequences');
  L.push('');
  if (!sequences.length) {
    L.push('_No sequences._');
  } else {
    L.push('| Sequence | Type | Start | Increment | Min | Max | Cycles | Owned by |');
    L.push('| --- | --- | ---: | ---: | ---: | ---: | --- | --- |');
    for (const s of sequences) {
      L.push(
        `| \`${s.schema}.${s.name}\` | ${s.dataType} | ${s.startValue} | ${s.incrementBy} | ` +
          `${s.minValue} | ${s.maxValue} | ${s.cycles ? 'yes' : 'no'} | ${s.ownedBy ? `\`${s.ownedBy}\`` : '—'} |`,
      );
    }
  }
  L.push('');

  L.push('## Migrations');
  L.push('');
  if (!migrations.length) {
    L.push('_No `schema_migrations` table found._');
  } else {
    for (const m of migrations) {
      L.push(`### \`${m.schema}.${m.table}\` — ${m.count} applied`);
      L.push('');
      if (m.skippedColumns.length) {
        L.push(`Columns present but not exported (outside the id/timestamp allowlist): ` +
          `${m.skippedColumns.map((c) => `\`${c}\``).join(', ')}.`);
        L.push('');
      }
      const cols = m.columnsExported.map((c) => c.name);
      L.push(`| # | ${cols.join(' | ')} |`);
      L.push(`| ---: | ${cols.map(() => '---').join(' | ')} |`);
      m.entries.forEach((row, i) => {
        L.push(`| ${i + 1} | ${cols.map((c) => mdEscape(row[c] ?? '—')).join(' | ')} |`);
      });
      L.push('');
    }
  }
  L.push('');

  L.push('## Tables');
  L.push('');
  L.push('| Table | Kind | Cols | PK | FKs | Unique | Checks | Indexes | Triggers | RLS |');
  L.push('| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |');
  for (const t of tables) {
    const c = t.constraints ?? {};
    L.push(
      `| [\`${t.schema}.${t.name}\`](#${anchor(`${t.schema}.${t.name}`)}) | ${t.kind} | ${t.columns.length} | ` +
        `${c.primaryKey ? (c.primaryKey.columns ?? []).join(', ') : '—'} | ${(c.foreignKeys ?? []).length} | ` +
        `${(c.unique ?? []).length} | ${(c.check ?? []).length} | ${(t.indexes ?? []).length} | ` +
        `${(t.triggers ?? []).length} | ${t.rowSecurity?.enabled ? 'on' : 'off'} |`,
    );
  }
  L.push('');

  for (const t of tables) {
    L.push(`### \`${t.schema}.${t.name}\``);
    L.push('');
    const bits = [`kind: ${t.kind}`, `owner: ${t.owner}`, `persistence: ${t.persistence}`];
    if (t.partitionParent) bits.push(`partition of: \`${t.partitionParent}\``);
    L.push(bits.join(' · '));
    L.push('');
    if (t.comment) {
      L.push(`> ${mdEscape(t.comment)}`);
      L.push('');
    }

    L.push('| # | Column | Type | Nullable | Default | Notes |');
    L.push('| ---: | --- | --- | --- | --- | --- |');
    for (const col of t.columns) {
      const notes = [];
      if (col.identity) notes.push(`identity ${col.identity}`);
      if (col.generated) notes.push(`generated ${col.generated}`);
      if (col.collation) notes.push(`collate ${col.collation}`);
      if (col.udtSchema) notes.push(`type \`${col.udtSchema}.${col.udtName}\``);
      if (col.comment) notes.push(mdEscape(col.comment));
      L.push(
        `| ${col.ordinalPosition} | \`${col.name}\` | ${code(col.dataType)} | ` +
          `${col.nullable ? 'yes' : 'NOT NULL'} | ${code(col.default)} | ${notes.join('; ') || '—'} |`,
      );
    }
    L.push('');

    const c = t.constraints ?? {};
    const constraintRows = [];
    if (c.primaryKey) constraintRows.push(['PRIMARY KEY', c.primaryKey.name, c.primaryKey.definition]);
    for (const fk of c.foreignKeys ?? []) constraintRows.push(['FOREIGN KEY', fk.name, fk.definition]);
    for (const u of c.unique ?? []) constraintRows.push(['UNIQUE', u.name, u.definition]);
    for (const ck of c.check ?? []) constraintRows.push(['CHECK', ck.name, ck.definition]);
    for (const ex of c.exclusion ?? []) constraintRows.push(['EXCLUDE', ex.name, ex.definition]);

    if (constraintRows.length) {
      L.push('**Constraints**');
      L.push('');
      L.push('| Type | Name | Definition |');
      L.push('| --- | --- | --- |');
      for (const [type, name, def] of constraintRows) L.push(`| ${type} | \`${name}\` | ${code(def)} |`);
      L.push('');
    }

    if ((t.indexes ?? []).length) {
      L.push('**Indexes**');
      L.push('');
      L.push('| Name | Method | Unique | Definition |');
      L.push('| --- | --- | --- | --- |');
      for (const i of t.indexes) {
        L.push(`| \`${i.name}\` | ${i.method} | ${i.unique ? 'yes' : 'no'} | ${code(i.definition)} |`);
      }
      L.push('');
    }

    if ((t.triggers ?? []).length) {
      L.push('**Triggers**');
      L.push('');
      for (const tg of t.triggers) L.push(`- \`${tg.name}\` (${tg.enabled}) — ${code(tg.definition)}`);
      L.push('');
    }

    if ((t.policies ?? []).length) {
      L.push('**RLS policies**');
      L.push('');
      for (const p of t.policies) {
        L.push(`- \`${p.name}\` ${p.command} for ${(p.roles ?? []).join(', ')} — USING ${code(p.using)}`);
      }
      L.push('');
    }
  }

  return L.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

/** GitHub-style heading anchor for the table-of-contents links. */
function anchor(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s._-]/g, '').trim().replace(/\s+/g, '-').replace(/\./g, '');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    return 0;
  }

  const connectionString = process.env[opts.urlEnv];
  if (!connectionString) {
    console.error(`Environment variable ${opts.urlEnv} is not set.`);
    return 2;
  }

  const outDir = resolve(opts.out ?? dirname(fileURLToPath(import.meta.url)));
  await mkdir(outDir, { recursive: true });

  const statements = [];
  const client = new Client({ connectionString, application_name: 'schema-inventory-readonly' });

  let inventory;
  let transactionClosed = 'not-opened';
  await client.connect();
  try {
    await client.query('BEGIN TRANSACTION READ ONLY');
    statements.push({ name: 'begin', sql: 'BEGIN TRANSACTION READ ONLY' });
    try {
      inventory = await collect(client, statements);
    } finally {
      await client.query('ROLLBACK');
      statements.push({ name: 'rollback', sql: 'ROLLBACK' });
      transactionClosed = 'rolled-back';
    }
  } finally {
    await client.end();
  }

  // Statement audit: prove nothing but read statements went over the wire.
  const nonReadStatements = statements
    .map((s) => s.sql)
    .filter((sql) => !/^(SELECT|SHOW|BEGIN TRANSACTION READ ONLY|ROLLBACK)\b/i.test(sql.trimStart()));

  const counts = countObjects(inventory);

  // Structural payload (hashed) — deliberately excludes `meta`, so the same schema
  // hashes identically regardless of when or against which host it was captured.
  const payload = {
    schemas: inventory.schemas,
    extensions: inventory.extensions,
    enums: inventory.enums,
    domains: inventory.domains,
    tables: inventory.tables,
    views: inventory.views,
    sequences: inventory.sequences,
    migrations: inventory.migrations,
  };
  const contentHash = sha256(canonicalJson(payload));

  const doc = {
    meta: {
      generator: GENERATOR,
      generatorVersion: GENERATOR_VERSION,
      schemaFormatVersion: SCHEMA_FORMAT_VERSION,
      generatedAt: new Date().toISOString(),
      contentHash,
      contentHashCovers: Object.keys(payload).sort(),
      source: {
        label: opts.label ?? `database:${inventory.server.database}`,
        database: inventory.server.database,
        serverVersion: inventory.server.serverVersion,
        serverVersionNum: inventory.server.serverVersionNum,
        connectionStringEnvVar: opts.urlEnv,
      },
      collection: {
        transaction: 'BEGIN TRANSACTION READ ONLY',
        transactionOutcome: transactionClosed,
        statementCount: statements.length,
        nonReadStatementCount: nonReadStatements.length,
        excludedSchemas: [...SYSTEM_SCHEMAS, ...SYSTEM_SCHEMA_PREFIXES.map((p) => `${p}*`)].sort(),
        applicationRowsExported: 'none, except migration ids/timestamps from schema_migrations',
        migrationColumnAllowlist: [...MIGRATION_COLUMN_ALLOWLIST].sort(),
      },
    },
    counts,
    ...payload,
  };

  const jsonText = canonicalJson(doc);
  const jsonPath = resolve(outDir, 'schema.json');
  const mdPath = resolve(outDir, 'schema.md');
  const sumPath = resolve(outDir, 'schema.sha256');

  // Scan before writing: never put a credential on disk, even transiently.
  const preWrite = scanForCredentials(jsonText, connectionString);
  if (preWrite.hard.length) {
    console.error(`ABORT: credential detected in payload (${preWrite.hard.join(', ')}). Nothing written.`);
    return 3;
  }
  if (nonReadStatements.length) {
    console.error(`ABORT: non-read statement detected in the audit log. Nothing written.`);
    return 3;
  }

  await writeFile(jsonPath, jsonText, 'utf8');

  // Validate what actually landed on disk, not the in-memory object.
  const roundTripped = JSON.parse(await readFile(jsonPath, 'utf8'));
  const validation = validate(roundTripped, connectionString, jsonText);

  const markdown = renderMarkdown(roundTripped);
  const mdScan = scanForCredentials(markdown, connectionString);
  if (mdScan.hard.length) {
    console.error(`ABORT: credential detected in markdown (${mdScan.hard.join(', ')}).`);
    return 3;
  }
  await writeFile(mdPath, markdown, 'utf8');

  const jsonHash = sha256(jsonText);
  const mdHash = sha256(markdown);
  const sums = [
    `# SHA-256 checksums — verify with: sha256sum -c schema.sha256`,
    `# content hash (structural payload, excludes meta): ${contentHash}`,
    `${jsonHash}  schema.json`,
    `${mdHash}  schema.md`,
    '',
  ].join('\n');
  await writeFile(sumPath, sums, 'utf8');

  console.log(`Database:      ${inventory.server.database} (PostgreSQL ${inventory.server.serverVersion})`);
  console.log(`Output:        ${outDir}`);
  console.log(`Transaction:   READ ONLY, ${transactionClosed}`);
  console.log(`Statements:    ${statements.length} (${nonReadStatements.length} non-read)`);
  console.log('');
  console.log('Object counts:');
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(22)} ${v}`);
  console.log('');
  console.log('Validation:');
  for (const c of validation.checks) {
    console.log(`  [${c.passed ? 'PASS' : 'FAIL'}] ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
  }
  const warnings = [...(validation.softWarnings ?? []), ...mdScan.soft];
  if (warnings.length) {
    console.log('');
    console.log('Credential-scan warnings (non-blocking — review the redacted contexts):');
    for (const w of warnings) {
      console.log(`  [WARN] ${w.reason} — ${w.matches} match(es)`);
      for (const ctx of w.contexts) console.log(`         ${ctx}`);
    }
  }

  console.log('');
  console.log(`schema.json    sha256 ${jsonHash}`);
  console.log(`schema.md      sha256 ${mdHash}`);
  console.log(`content hash   sha256 ${contentHash}`);

  if (!validation.valid) {
    console.error('\nVALIDATION FAILED:');
    for (const e of validation.errors) console.error(`  - ${e}`);
    return 4;
  }
  if (opts.printHash) console.log(contentHash);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    // Never echo the error's connection context — pg errors can carry it.
    console.error(`FAILED: ${err && err.message ? err.message : String(err)}`);
    process.exit(1);
  });
