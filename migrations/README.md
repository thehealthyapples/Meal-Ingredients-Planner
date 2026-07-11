# These SQL files are NOT the migrations. Nothing runs them.

**The canonical migrations live in [`server/migrations/runner.ts`](../server/migrations/runner.ts).**
See [`MIGRATIONS.md`](../MIGRATIONS.md) for how to add one.

---

This folder is `drizzle.config.ts`'s `out` directory — the place `drizzle-kit generate` would write
SQL if anybody ran it. Here is the entire truth about what is in it:

- **Nothing executes these files.** There is no `drizzle-kit migrate` anywhere in this repository —
  not in `package.json`, not in CI, not in the deploy path, not at boot. Verified under `TRUST1-O8`.
- **They are stale, and were never a complete record.** `meta/_journal.json` lists exactly one
  entry (`0000_conscious_nuke`). The two files beside it — `0001_m4_5_fermented_attribute.sql` and
  `0002_know5_composition_evidence.sql` — are not in the journal at all, so even `drizzle-kit` would
  not consider them part of the sequence.

They are kept only because deleting generated output is not `TRUST1-O8`'s business, and history is
cheap. **Do not add to them, do not run them, and do not read them as a description of the schema.**

## Why this file exists

A directory named `migrations/`, full of numbered `.sql` files, sitting next to a `drizzle.config.ts`
that points at it, looks exactly like the migration system. It is not the migration system. Under
`TRUST1-O8` — which exists because THA had **two owners of one schema** and lost track of which one
was real — leaving that ambiguity unlabelled would be repeating the mistake in the middle of fixing
it. So it is labelled.

## Where the schema actually comes from

| Thing | File | Applied by | Reviewed? |
|---|---|---|---|
| **Ordered migrations** — the only thing that may change a **production** schema | `server/migrations/runner.ts` | `runMigrations()` at server boot, in a transaction, once, recorded in `schema_migrations` | **Yes** — it is a code change, so it goes through review and CI |
| **Declarative schema** — the Drizzle table definitions the app reads and writes through | `shared/schema.ts` | `drizzle-kit push`, via `scripts/db/schema-push-guard.ts`, **for CI and disposable dev databases only** | No — which is exactly why the guard will not let it near production |
| These files | `migrations/*.sql` | **nothing** | — |
