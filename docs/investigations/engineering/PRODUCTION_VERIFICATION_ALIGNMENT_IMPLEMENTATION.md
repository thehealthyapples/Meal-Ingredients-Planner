# Production Verification Chain — Alignment Implementation

**Date:** 2026-06-28
**Implementer:** Claude (Opus 4.8)
**Branch:** `safety/preserve-since-last-prod-20260617-1613`
**HEAD at implementation:** `556747e4d30bc1589eb52f4451e0d1ee350fa218`
**Mode:** Code change only. No push. No deploy. No production modification. No schema/data change.
**Investigation source:** `docs/investigations/engineering/PRODUCTION_MIGRATION_VERIFICATION_ALIGNMENT_2026-06-28.md`

---

## Purpose

Apply the minimum safe fix identified by the investigation: sync the two stale
hardcoded expected-migration-head **consumers** to the authoritative migration
owner, so the production release gate (`verify-prod.ts`) stops false-failing and
the release docs state the correct head.

---

## Authoritative source (unchanged)

`server/migrations/runner.ts` remains the single migration owner. Its head is
self-derived from the tail of the append-only `MIGRATIONS[]` array:

```ts
const expectedHead = MIGRATIONS[MIGRATIONS.length - 1]?.id ?? null; // runner.ts
```

Verified the array tail is `2026-06-18_ws0_knowledge_registry` (`runner.ts:1369`,
immediately followed by the array-close `// ← Add new migrations here` comment at
line 1453). **No change was made to the owner.**

→ **Authoritative migration head: `2026-06-18_ws0_knowledge_registry`**

---

## Changes applied (consumers only)

### 1. `scripts/verify-prod.ts` (line 44) — required release-gate fix

```diff
- const expectedHead = "2026-05-23_add_pantry_need_quantity";
+ const expectedHead = "2026-06-18_ws0_knowledge_registry";
```

Removes the false-negative: the script now compares prod's `schema_migrations`
head against the owner's true head instead of a value 6 migrations stale.

### 2. `RELEASE.md` (lines 200 and 283–285) — documentation accuracy

```diff
- [Migrations] Schema at head: 2026-04-19_backfill_shopping_list_null_resolution_state
+ [Migrations] Schema at head: 2026-06-18_ws0_knowledge_registry
```

```diff
- Expected head (as of 2026-04-19):
+ Expected head (as of 2026-06-18):
  ```
- 2026-04-19_backfill_shopping_list_null_resolution_state
+ 2026-06-18_ws0_knowledge_registry
```

### Deliberately NOT changed

- `server/migrations/runner.ts` — the owner; untouched.
- `docs/release-notes.md` — uses the `<latest>` placeholder; already correct.
- Migration history, schema, database — untouched.
- No dynamic derivation introduced in `verify-prod.ts` (flagged as optional in the
  investigation; explicitly out of scope per Scope Lock).

---

## Validation

- `npm run build` — **PASS** (client bundle built in 15.33s; server bundle built;
  only the pre-existing chunk-size warning, unrelated to this change).
- `npx tsc --noEmit --skipLibCheck scripts/verify-prod.ts` — clean (no type errors
  from the edit).
- `git diff --stat` — only `RELEASE.md` (6 lines) and `scripts/verify-prod.ts`
  (1 line) modified. No unrelated tracked files changed.
- The two untracked `.md` files present in `git status` (`GITHUB_TO_RENDER_...` and
  the `PRODUCTION_MIGRATION_VERIFICATION_ALIGNMENT_2026-06-28.md` investigation)
  pre-existed before this work and were not created or modified here.

---

## Definition of Done

**Architecture Compliance:**
- One canonical migration owner — ✅ `server/migrations/runner.ts` unchanged; sole owner.
- No duplicate migration state — ✅ no second runner/history introduced; `verify-prod.ts` only *reads* `schema_migrations`.
- No fabricated migration history — ✅ value `2026-06-18_ws0_knowledge_registry` quoted verbatim from `runner.ts:1369`; nothing invented.
- Consumers updated to match the owner only — ✅ both consumers now mirror the owner; owner not changed to match consumers.
- No schema changes — ✅ none.
- No production data changes — ✅ none.

**Definition of Done:** Both consumer constants synced to the authoritative head; build green; scope limited to the two files identified by the investigation.

**Data Impact:** None. No SQL executed against any database; no migration applied; no rows touched.

**Trust Check:** New head taken directly from the owner array tail (`runner.ts:1369`), independently re-verified before editing. No values fabricated; no derivation logic added.

**Rollback Plan:** Restore the pre-change state with the rollback tag below. Working-tree-only changes can also be reverted with `git checkout -- RELEASE.md scripts/verify-prod.ts`.

**Scope Lock:** Only the two consumer updates were made. No refactor, no migration-system improvement, no dynamic derivation, no unrelated doc changes.

---

## Report

```
FILES CHANGED:
  - scripts/verify-prod.ts   (line 44: expectedHead constant)
  - RELEASE.md               (lines 200, 283, 285)
  - docs/investigations/engineering/PRODUCTION_VERIFICATION_ALIGNMENT_IMPLEMENTATION.md  (this report — new file)

ROLLBACK IDENTIFIER:
  Tag:    rollback/pre-verify-prod-alignment-20260628
  Commit: 556747e4d30bc1589eb52f4451e0d1ee350fa218
  Branch: safety/preserve-since-last-prod-20260617-1613
  Restore: git checkout rollback/pre-verify-prod-alignment-20260628 -- RELEASE.md scripts/verify-prod.ts

NEW AUTHORITATIVE MIGRATION HEAD: 2026-06-18_ws0_knowledge_registry

BUILD STATUS: PASS

READY TO RE-RUN RELEASE GATE: YES
```

---

*Implementation only. No push. No deploy. No production changes.*
