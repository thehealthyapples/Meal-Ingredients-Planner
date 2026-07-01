# INT18 Phase 0 — Conversation Store Implementation Report

**Status:** IMPLEMENTED AND TESTED
**Date:** 2026-07-01
**Branch:** `int1-intelligence-platform`
**HEAD at start:** `bf73e32` (INT19 investigation)
**Investigation source:** `docs/investigations/INT18_CONVERSATION_PLATFORM_DESIGN.md`

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Commit SHA before implementation | `bf73e32d7ed23ef2f90d5736780921ff244400b5` |
| Rollback tag | `rollback/before-int18-phase0-conversation-store-20260701` — note: git tag creation is blocked in the main agent sandbox; create this tag manually before running migrations in production |
| **Files modified** | `shared/schema.ts` (append-only), `server/migrations/runner.ts` (append-only) |
| **Files created** | `server/intelligence/conversation/conversation-store.ts`, `server/tests/test-intelligence-conversation-store.ts` |
| **Files deleted** | None |
| **Rollback command** | `git checkout bf73e32 -- shared/schema.ts server/migrations/runner.ts && rm server/intelligence/conversation/conversation-store.ts server/tests/test-intelligence-conversation-store.ts` |

---

## ARCHITECTURE COMPLIANCE

| Principle | Compliance |
|---|---|
| **One canonical assistant** | Store only — no assistant logic introduced |
| **One conversation history** | One `conversations` row per user (`UNIQUE (user_id)`) |
| **No duplicate state** | `entityRefs`, `contextFrameRef`, `outcomeRef` store pointer IDs only — never business rows (TIP3 Risk R1) |
| **One owner per table** | `ConversationStore` is the sole writer of all three new tables; no other module touches them |
| **No new platform** | Store is a persistence layer, not an intelligence engine |
| **Extend, not replace** | Zero modifications to existing tables, routes, or services |
| **Progressive enrichment** | Tables are inert until Phase 1 wires the Conversation Gateway |
| **No runtime behaviour change** | No route added; store not referenced from any live call path; migration is additive |

---

## SCOPE

Exactly as specified in the user's instruction and INT18 Phase 0 definition:

| Deliverable | Status |
|---|---|
| `conversations` table + migration | ✅ |
| `conversation_threads` table + migration | ✅ |
| `conversation_turns` table + migration | ✅ |
| `ConversationStore` module (`IConversationStore` + `DatabaseConversationStore` + `InMemoryConversationStore`) | ✅ |
| Tests: get/create conversation | ✅ |
| Tests: open thread | ✅ |
| Tests: get active thread | ✅ |
| Tests: close thread (+ idempotency) | ✅ |
| Tests: append turn | ✅ |
| Tests: get recent turns (bounded, oldest-first) | ✅ |
| Tests: get last entity refs | ✅ |
| Tests: pointer discipline | ✅ |
| No routes | ✅ |
| No UI | ✅ |
| No LLM | ✅ |
| No Conversation Gateway | ✅ |
| No Voice | ✅ |
| No runtime behaviour change | ✅ |

---

## FILES CHANGED

### `shared/schema.ts` — append-only

Three new Drizzle table definitions + insert schemas + types appended after the existing `canonicalFoodAliases` section:

- `conversations` — one per user, `UNIQUE(user_id)`
- `conversationThreads` — context-coherent stretches, `closedAt: null` = active
- `conversationTurns` — atomic turn record; all JSONB columns hold pointer IDs only

Types exported: `Conversation`, `InsertConversation`, `ConversationThread`, `InsertConversationThread`, `ConversationTurn`, `InsertConversationTurn`.

### `server/migrations/runner.ts` — append-only

New migration appended before the `// ← Add new migrations here` marker:

```
id: "2026-07-01_int18_conversation_store"
```

Three `CREATE TABLE IF NOT EXISTS` statements. Idempotent — safe to re-run. No existing table, column or row modified. `conversation_turns.role` has a `CHECK` constraint (`'user' | 'assistant' | 'system'`).

### `server/intelligence/conversation/conversation-store.ts` — new file

**`IConversationStore` interface** — the six methods:
- `getOrCreateConversation(userId)` — lazy create, idempotent
- `openThread(conversationId, surface)` — creates an active thread
- `getActiveThread(conversationId)` — most-recent open thread or null
- `closeThread(threadId)` — sets `closedAt`; idempotent
- `appendTurn(threadId, turn)` — persists turn; all JSONB serialised
- `getRecentTurns(threadId, limit=20)` — bounded, oldest-first
- `getLastEntityRefs(threadId)` — most-recent non-empty refs for pronoun resolution

**`DatabaseConversationStore`** — production implementation using `pool` from `server/db.ts`.

**`InMemoryConversationStore`** — in-memory implementation for tests. No database, no migrations, no network required. Identical interface.

**INT18 Risk R5 decision** (OQ1 from the investigation): separate store class — **not** added to `IStorage`. Keeps conversation testing isolated from the main storage layer. The Conversation Gateway (Phase 1) injects it independently.

### `server/tests/test-intelligence-conversation-store.ts` — new file

55 tests across 8 sections. All pass. Run with:
```
npx tsx server/tests/test-intelligence-conversation-store.ts
```

---

## TEST RESULTS

```
── getOrCreateConversation ──         7 assertions — all ✓
── openThread ──                      6 assertions — all ✓
── getActiveThread ──                 3 assertions — all ✓
── closeThread ──                     3 assertions — all ✓
── appendTurn — persists fields ──   11 assertions — all ✓
── Pointer discipline ──             10 assertions — all ✓
── getRecentTurns ──                  8 assertions — all ✓
── getLastEntityRefs ──               7 assertions — all ✓

Passed: 55   Failed: 0
```

---

## DATA IMPACT

| Question | Answer |
|---|---|
| Reads existing data | No — store not called from any live path |
| Writes new data | The migration creates three new tables. At runtime, the store writes to them only when called. No live call path exists until Phase 1. |
| Changes meaning of existing data | No |
| Requires backfill | No — all three tables start empty |

---

## TRUST CHECK

| Question | Answer |
|---|---|
| Could this mislead the user? | No — no user-facing surface changed |
| Could this fabricate certainty? | No — no LLM, no response generation |
| Is anything guessed but shown as real? | No |
| What happens if the system is wrong? | Migration failure rolls back automatically (the runner wraps each migration in a transaction). The three tables don't exist; the application behaves identically to before. |
| No architectural duplication introduced | ✅ |
| No new source of truth created | ✅ — pointer IDs only in all JSONB columns |
| No runtime behaviour altered | ✅ — store is not referenced from any live call path |

---

## DEFINITION OF DONE

| Requirement | Status |
|---|---|
| Tables created via idempotent migration | ✅ |
| `ConversationStore` passes unit tests for all six methods | ✅ 55/55 |
| No business data in any test turn — only IDs and pointers | ✅ (pointer discipline test section) |
| Zero routes added | ✅ |
| Zero UI added | ✅ |
| No runtime behaviour change | ✅ |

---

## OPEN QUESTIONS RESOLVED

| OQ | Resolution |
|---|---|
| OQ1 — Separate `IConversationStorage` vs. extension of `IStorage`? | **Separate** — `IConversationStore` is its own interface; `DatabaseConversationStore` and `InMemoryConversationStore` implement it independently. Not coupled to `IStorage`. |
| OQ2–OQ6 | Not applicable to Phase 0. Remain open for Phase 1. |

---

## ROLLBACK PLAN

```bash
# 1. Roll back code changes
git checkout bf73e32 -- shared/schema.ts server/migrations/runner.ts
rm server/intelligence/conversation/conversation-store.ts
rm server/tests/test-intelligence-conversation-store.ts

# 2. If migration has already been applied to the database:
psql $DATABASE_URL -c "DROP TABLE IF EXISTS conversation_turns CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS conversation_threads CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS conversations CASCADE;"
psql $DATABASE_URL -c "DELETE FROM schema_migrations WHERE id = '2026-07-01_int18_conversation_store';"
```

The tables are new and empty — no user data at risk.

---

## SCHEMA AUDIT (per database audit rule in `replit.md`)

Every column in the three new Drizzle table definitions (`shared/schema.ts`) is covered by the migration (`2026-07-01_int18_conversation_store`):

| Table | Column | Migration coverage |
|---|---|---|
| `conversations` | `id`, `user_id`, `created_at`, `updated_at` | ✅ `CREATE TABLE IF NOT EXISTS conversations` |
| `conversation_threads` | `id`, `conversation_id`, `surface`, `opened_at`, `closed_at` | ✅ `CREATE TABLE IF NOT EXISTS conversation_threads` |
| `conversation_turns` | `id`, `thread_id`, `role`, `surface`, `utterance`, `resolved_intent`, `context_frame_ref`, `entity_refs`, `outcome_ref`, `created_at` | ✅ `CREATE TABLE IF NOT EXISTS conversation_turns` |

Audit: **PASS**.

---

## NEXT STEP — Phase 1

INT18 Phase 1 requires:
1. `server/intelligence/conversation/context-frame-assembler.ts`
2. `server/intelligence/conversation/conversation-gateway.ts`
3. API routes: `POST /api/intelligence/conversation/turn`, `GET /api/intelligence/conversation/turns`, `GET /api/intelligence/conversation/threads`
4. UI: `FloatingAssistant`, `ConversationThread`, `TurnBubble`, `AssistantInput`, `QuickActions`, `PersonaLabel`
5. LLM call grounded on the 11 live read-only handlers

Phase 1 gate (from INT18): LLM must be grounded-only; write intents must return honest gaps; Context Frame assembler must store pointers only; non-fabrication must be verified before merge.

Note: the test script can be added to `package.json` when desired:
```json
"test:intelligence-conversation-store": "tsx server/tests/test-intelligence-conversation-store.ts"
```
This was not done because `package.json` edits require user approval per the project rules.
