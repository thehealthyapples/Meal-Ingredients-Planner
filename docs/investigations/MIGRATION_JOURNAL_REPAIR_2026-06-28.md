# Migration Journal Investigation & Repair — 2026-06-28

**Author:** Claude (Claude Code)
**Branch:** safety/preserve-since-last-prod-20260617-1613
**HEAD:** e3db63f
**Scope:** Investigate the "migration journal out of sync" blocker from
`ACCESS_CHECK_2026-06-28.md`. No deploy, no push, no production backfill, no
production data modification.

---

## Rollback protection

- `git status` before work: clean working tree; only untracked report files
  (`ACCESS_CHECK_2026-06-28.md`, `RELEASE_RECAP_2026-06-28.md`,
  `RELEASE_REPORT_2026-06-28_BLOCKED.md`).
- **Rollback tag created:** `migration-journal-repair-rollback-20260628-223249`
  (annotated, at `e3db63f`).
- To roll back any change from this task: `git reset --hard migration-journal-repair-rollback-20260628-223249`
  (note: nothing in tracked source was changed — see "Files changed").

---

## What the blocker assumed

`ACCESS_CHECK_2026-06-28.md` reported:
- `migrations/0001_m4_5_fermented_attribute.sql` exists on disk
- `migrations/meta/_journal.json` lists only `0000_conscious_nuke`
- `0001` is not registered → "migration not at head" risk → release blocked

This framed the fix as "register 0001 in `_journal.json`." **Investigation shows
that framing is based on a misidentified migration system.** The drizzle journal
is not on either production deploy path.

---

## Investigation findings

### Finding 1 — There are TWO unrelated migration mechanisms in this repo

**A. drizzle-kit folder (`migrations/`) — NOT used to deploy schema**
- `drizzle.config.ts` points `out: ./migrations`, `schema: ./shared/schema.ts`.
- The only drizzle script is `"db:push": "drizzle-kit push"`. There is **no**
  `drizzle-kit migrate` and **no** `drizzle-kit generate` script anywhere.
- `drizzle-kit push` diffs `shared/schema.ts` directly against the target DB and
  applies the difference. **It does not read `migrations/*.sql` or
  `migrations/meta/_journal.json` at all.**
- Production schema apply uses push, via `scripts/migrate-prod.sh`:
  `npx drizzle-kit push --force` (and `scripts/post-merge.sh`: `npm run db:push`).
- Therefore `_journal.json` + `migrations/*.sql` + `migrations/meta/*_snapshot.json`
  are **vestigial artifacts** — consumed by no deploy step.

**B. Custom runtime runner (`server/migrations/runner.ts`) — the REAL system**
- A hand-maintained `MIGRATIONS` array of dated, idempotent SQL migrations
  (ids like `2026-06-18_ws0_knowledge_registry`), tracked in a
  `schema_migrations` table, applied **at server startup**.
- This is what emits the `[Migrations] Schema at head: <latest>` log line that
  `docs/release-notes.md` step 5 tells the release manager to confirm.
- `scripts/verify-prod.ts` checks the head of **`schema_migrations`**
  (`expectedHead = "2026-05-23_add_pantry_need_quantity"`), i.e. the custom
  runner's history — **not** the drizzle journal.
- Real current head in code: `2026-06-18_ws0_knowledge_registry`.
- The runner contains **no** reference to `fermented` or `canonical_food`.

### Finding 2 — `0001_m4_5_fermented_attribute.sql` is an orphaned drizzle artifact
- It is a single statement:
  `ALTER TABLE "canonical_food" ADD COLUMN "fermented" boolean DEFAULT false NOT NULL;`
- It has **no matching snapshot**: only `migrations/meta/0000_snapshot.json` exists;
  there is no `0001_snapshot.json`, and `git log --all` shows one never existed.
- It is **not** in `_journal.json`.
- It was committed in `58c8b73` (a wx7 checkpoint), not in a drizzle-generate commit.
- Conclusion: it was **hand-authored**, never produced by `drizzle-kit generate`
  (which would have written both the snapshot and the journal entry). drizzle
  ignores it entirely (`drizzle-kit check` → "Everything's fine").

### Finding 3 — The `fermented` column already reaches production correctly
- `shared/schema.ts` (the single schema owner) declares it at line 1657:
  `fermented: boolean("fermented").notNull().default(false)`.
- Because prod schema is applied by `drizzle-kit push --force` (diff of schema.ts
  → DB), the `fermented` column **will be created on prod from schema.ts**,
  independent of the orphaned `.sql` and the journal.
- Data impact: additive column, `DEFAULT false NOT NULL` → existing rows get
  `false` automatically. **No backfill required** for the column itself.
  (Seed-driven `fermented: true` values in `shared/canonical/foods.ts` are applied
  by the normal canonical seed path, not by a schema migration.)

---

## Decision: should `0001` be registered in `_journal.json`?

**NO. Do not modify `_journal.json`. Stop.**

Reasons:
1. **It is on no deploy path.** Neither the custom runner nor `drizzle-kit push`
   reads `_journal.json`. Registering `0001` would change nothing about how
   production is built, so it cannot be the real blocker.
2. **Registering it "correctly" would require fabricating migration state.**
   A valid drizzle entry needs a chained `migrations/meta/0001_snapshot.json`
   (with the correct `prevId`/`id` hashes and the post-0001 schema). None exists.
   Hand-writing one violates the Architecture Compliance rule **"No fabricated
   migration state."** Regenerating via `drizzle-kit generate` would diff the
   *current* schema.ts (95 commits of drift) against the stale `0000_snapshot.json`
   and emit a large multi-table migration — not a clean "register 0001."
3. **The column is already owned by `shared/schema.ts`** and deploys via push.
   No journal action is needed for it to ship.

This satisfies the compliance constraints: one schema owner (`shared/schema.ts`),
no duplicate migration path created, no manual prod schema change, no fabricated
state, existing history left intact.

---

## Recommendation (not done in this task — needs separate approval)

The genuine cleanup is to remove the confusion source, not to feed it:
- Quarantine/delete the orphaned `migrations/0001_m4_5_fermented_attribute.sql`
  (and consider whether the whole drizzle `migrations/` folder should be retired,
  since deploy uses `push` + the custom runner). Left untouched here per
  "Do not touch unrelated files" / "If no, explain why and STOP."
- Separately, note for the release re-check: `scripts/verify-prod.ts`
  `expectedHead` is `2026-05-23_add_pantry_need_quantity`, but the runner's head
  in code is now `2026-06-18_ws0_knowledge_registry`. That mismatch is a **real**
  release item (verify-prod would fail/false-flag) and should be addressed during
  the release access-check, but it is outside this journal task.

---

## Final output

- **ROOT CAUSE:** `0001_m4_5_fermented_attribute.sql` is a hand-authored, orphaned
  drizzle-kit artifact (no snapshot, never journaled). It was mistaken for a real
  pending migration. The drizzle `migrations/` folder + `_journal.json` is not the
  production migration mechanism — prod schema is applied by `drizzle-kit push --force`
  (from `shared/schema.ts`) plus the custom runtime runner `server/migrations/runner.ts`
  (`schema_migrations` table). The `fermented` column is already declared in
  `shared/schema.ts` and deploys via push.

- **FILES CHANGED:** None in tracked source / migrations. Only added:
  `docs/investigations/MIGRATION_JOURNAL_REPAIR_2026-06-28.md` (this report) and the
  git tag `migration-journal-repair-rollback-20260628-223249`.
  `migrations/meta/_journal.json` was intentionally **not** modified.

- **ROLLBACK IDENTIFIER:** `migration-journal-repair-rollback-20260628-223249` (at `e3db63f`).

- **MIGRATION JOURNAL STATUS:** In sync for what it governs. `drizzle-kit check` →
  "Everything's fine 🐶🔥" (registered history `0000` is internally consistent).
  `0001.sql` is an unregistered orphan that drizzle ignores and that no deploy path
  uses. No "migration not at head" condition exists on any real deploy path. The
  original blocker is dismissed as a false positive.

- **CHECKS RUN:**
  - `drizzle-kit check` → PASS ("Everything's fine").
  - `npm run build` (production bundle) → PASS (exit 0).
  - `npm run typecheck` (`tsc --noEmit`) → pre-existing failures ONLY in
    `server/scripts/*` and `server/tests/*` standalone debug/test files (top-level
    await / downlevel-iteration / test fixture casts). These are not in the
    production bundle path and are unchanged by this task (zero source edits).

- **READY FOR RELEASE ACCESS CHECK RE-RUN:** **YES** — the migration-journal blocker
  is resolved (it was a false positive; no change needed). Note: this does **not**
  unblock the release. The other ACCESS_CHECK blockers remain (no confirmed prod
  `DATABASE_URL`, no Render deploy/log access) and a newly surfaced real item —
  `verify-prod.ts` `expectedHead` lags the runner head — should be handled in the
  release access check. Release remains BLOCKED until separately approved.
