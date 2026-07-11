# Session — TRUST1-O8 Production Schema Protection

| Field | Value |
|---|---|
| **Session ID** | `TRUST1_O8_Production_Schema_Protection` |
| **Date** | 2026-07-11 |
| **Stage** | Complete |
| **Rollback ID** | `rollback/TRUST1-O8-production-schema-protection-20260711` → `4fd5a2969e8ecbf06b5cadeab145fb2ca89bce7c` |
| **Branch** | `int1-intelligence-platform` |
| **Report** | [`docs/implementation/platform/TRUST1_O8_PRODUCTION_SCHEMA_PROTECTION.md`](../../../docs/implementation/platform/TRUST1_O8_PRODUCTION_SCHEMA_PROTECTION.md) |
| **Next action** | None — task complete. See § Recommended next in the report (`O5`, then `O8B` migration baseline reconciliation). |

## Objective

Replace every production-reachable automatic schema mutation with the canonical reviewed migration
process. Close risk **R6** — a git merge could mutate the production schema, and
`drizzle-kit push --force` ran directly at the production database.

## Outcome

**Mechanism convergence: complete.** The production schema now has exactly one owner —
`server/migrations/runner.ts`, applied by `runMigrations()` at boot. `scripts/migrate-prod.sh` is
deleted; the post-merge hook no longer touches any database; `drizzle-kit push` survives in one
guarded file that cannot reach a managed host or run under `NODE_ENV=production`, with no override
for either. A 33-assertion regression suite (`npm test`, first) prevents any of it returning.

**Coverage convergence: 48%, and reported as such.** The reviewed runner creates 42 of the 88 tables
declared in `shared/schema.ts` — the other 46 (including `users`, `meals`, `shopping_list`) exist only
because `drizzle-kit push` once created them. The runner cannot rebuild THA's schema. This is an
honest residual, not a regression introduced here, and it is why deployment is **not** declared safe
to resume.

**Data-loss defect found and fixed:** `barcode_lookup_events` — created by a reviewed migration,
written to on every barcode scan, and never declared in `shared/schema.ts`. Every `push --force`
against production since April was an unattended instruction to drop it.

## Rollback note

The working tree was **dirty at tag time** with the `PDA1` workstream's uncommitted files. The tag
protects committed state only and does **not** cover them. None of PDA1's work was authored, staged
or committed by this session — including `.replit`, which O8 did not modify at all.
