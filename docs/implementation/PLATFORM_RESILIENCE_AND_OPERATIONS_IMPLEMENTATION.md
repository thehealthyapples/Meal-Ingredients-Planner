# EWO-PRO1 — Platform Resilience & Operations — Implementation

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED
**Reason:** Platform-spine work — one new durable store, process-lifecycle changes, and a shared resilience mechanism every future capability inherits.

---

## GOVERNING ARCHITECTURE

There is no standalone "Platform Resilience & Operations" architecture document. The governing architecture for this workstream is **`docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md` (PQA)**, whose Quality Spine names OPERATIONS as the loop-closing tier (§1, §8) and whose §11 roadmap defers the concrete resilience/observability/operations work to "a governed workstream in its own right." This workstream is that workstream. It implements:

- **PQA §11.3** — an external, durable sink for the Observability turn-classification log.
- **PQA §11.4** — insertion of the Platform Quality Compliance Checklist into `ENGINEERING_WORKFLOW.md`.
- **PQA §3's ownership test applied to resilience** — timeouts, retries, circuit-breaking, and dependency health were previously per-capability habits ("every author remembers `AbortSignal.timeout`"); they are now a platform responsibility enforced by one mechanism.
- **PQA §8 Operational Excellence's evidence needs** — health/readiness probes and an admin operations endpoint so an operator can answer "what failed, how often, where" without reading source code.

Explicitly **not** implemented (remain open under PQA §11): `performanceBudget` registry metadata (§11.1), `accessibilityProfile` registry metadata (§11.2), and the platform-wide accessibility standard (§11.5) — each is its own governed workstream and none is resilience/operations work.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-platform-resilience-ops-20260703` → `3460519` |
| Working tree | Intentionally dirty — carries prior uncommitted workstreams (EWO2, EWX1, FI5, EL2, OD1 docs/code) untouched by this work |
| This task's writes | See "Files changed" in the Rollback Plan below |
| Rollback to committed state | `git checkout rollback/before-platform-resilience-ops-20260703` |

---

## REFERENCE DOCUMENTS READ

- [x] docs/architecture/README.md (architecture bootstrap — canonical entry point)
- [x] docs/architecture/ARCHITECTURE_PRINCIPLES.md
- [x] docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md
- [x] docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md (the governing architecture for this workstream)
- [x] docs/architecture/ENGINEERING_WORKFLOW.md

---

## WHAT WAS BUILT

Four platform capabilities, all shared spine — no page-specific work anywhere in this implementation.

### 1. Resilient — one shared resilience mechanism (`server/lib/platform-resilience.ts`, new)

- `executeWithResilience(dependency, operation, options)` — per-attempt timeout, optional retry with exponential backoff + jitter, and a per-dependency **circuit breaker** (closed → open after N consecutive failures → half-open probe after cooldown → closed on success). While open, calls fail in milliseconds with `DependencyUnavailableError` instead of stacking timeouts.
- `guardedFetch(dependency, url, init, options)` — the same guarantees around `fetch`, with the socket genuinely aborted on timeout (`AbortSignal`).
- `getDependencyHealthReport()` — live circuit state, failure/timeout/refusal counts, last error message, last latency for every dependency the platform has called. Operational facts only; never payloads, user data, or keys.

**Wired into every live outbound dependency path:**

- `server/intelligence/conversation/llm-provider.ts` — the OpenAI call now runs under `executeWithResilience("openai-llm", …, { timeoutMs: 30_000 })` (no retry — a duplicate LLM call costs money, and the Conversation Gateway already classifies the failure honestly as `internal-error`).
- `server/lib/external-meal-service.ts` — all 10 outbound call sites (TheMealDB, BBC Good Food, AllRecipes, Jamie Oliver, Serious Eats, Edamam, API-Ninjas, BigOven, FatSecret ×2) converted from raw `fetch` + inline `AbortSignal.timeout` to `guardedFetch` with per-source dependency names; zero raw `fetch(` calls remain in the module. Existing per-call `try/catch` degradation is preserved — a circuit-open error degrades exactly like the network error it summarises.

### 2. Observable — the durable turn-outcome sink (PQA §11.3, closed)

- **New table `platform_turn_outcomes`** (`shared/schema.ts`, migration `2026-07-03_platform_turn_outcomes` in `server/migrations/runner.ts`, appended at the end of the ordered list). Columns: stage, state, gap_kind, surface, truncated utterance, routing-shape intents (JSONB), created_at. Indexed on created_at and state.
- **New sole owner `server/intelligence/conversation/turn-outcome-store.ts`** — `record`, `listRecent`, `countByStateSince`, `prune`. Bounded retention: 30 days age cap + 5,000-row count cap, pruned opportunistically every 50 writes, fire-and-forget.
- **`turn-fallback.ts` gains a registrable external sink** (`setUnsuccessfulQuerySink`) — the module's hard boundary (pure classification, no storage) is preserved: the DB store registers itself from server startup, and the sink receives the *identical, already-PII-scrubbed record* the ring buffer retains (no user id, no household id, no parameters, no payloads — nothing more exists to leak). Sink errors are isolated so a failing database can never affect a conversation turn.
- The in-memory ring buffer is unchanged and remains what INT35B/C aggregations read: a bounded, process-local recent-window cache. The durable table is the canonical historical record.

### 3. Supportable — health probes and the admin operations console (`server/routes.ts`, `server/lib/platform-status.ts` new)

- `GET /api/health` — liveness (unauthenticated; status + uptime only, reveals nothing else).
- `GET /api/health/ready` — readiness: bounded 2s `SELECT 1` probe; returns **503** when the database is unreachable so orchestrators/monitors stop routing to the instance. Boolean + latency only.
- `GET /api/admin/platform/operations` (admin-gated) — the operator payload: service facts (version, node, uptime), memory, database status + latency, the full dependency health report (circuit states), 24h turn-outcome counts by canonical state from the durable sink, and configuration availability.
- `GET /api/admin/platform/turn-outcomes` (admin-gated) — the durable turn-outcome log, newest first.
- **`server/lib/platform-status.ts` is now the one owner of the environment-variable inventory** (required/feature/integration). It was previously declared inline in `server/index.ts`; the startup audit and the operations endpoint now read the same declaration, so they can never disagree (SoT discipline applied to configuration facts). The endpoint reports **presence booleans only — never values**.

### 4. Recoverable — process lifecycle discipline (`server/index.ts`)

- **Graceful shutdown:** SIGTERM/SIGINT → stop accepting connections, drain in-flight requests, close the PG pool, exit — with a 10s hard deadline so a hung connection can never prevent the process being replaced.
- **Last-resort fault classification:** `unhandledRejection` logged loudly (process continues); `uncaughtException` logged and triggers graceful shutdown with exit 1 (undefined process state → let the orchestrator restart clean). No fault is silently swallowed (PQA §6 "classify every outcome").
- **Durable sink registration at startup**, after migrations, so the table exists before the first write.

### 5. Governance (PQA §11.4, closed)

- The six-box **Platform Quality Compliance Checklist** inserted into `docs/architecture/ENGINEERING_WORKFLOW.md` as a mandatory section for every capability-affecting implementation, plus a matching section in the implementation template.
- PQA §11 items 3 and 4 marked **closed under EWO-PRO1** with dated notes; the §2 Observability status row updated (alerting remains the named open gap).

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  platform_turn_outcomes rows are identified by serial id; dependencies in the
  health report by their unique dependency name string.

☑ One owner per fact
  Turn-outcome history: turn-outcome-store.ts (durable) — the in-memory ring
  buffer is a bounded process-local cache of the most recent window, not a
  second owner (same pattern as PQA §2's "derived, rebuildable index").
  Env inventory: platform-status.ts (moved from inline server/index.ts — the
  previous single copy relocated, not duplicated).
  Dependency health: platform-resilience.ts, in-process only.

☑ No duplicate entities
  platform_turn_outcomes is new and stores what no table stored (durable turn
  outcomes). It does NOT duplicate companion_health_snapshots — snapshots are
  point-in-time aggregate summaries; this is the underlying event log.

☑ No duplicate ownership
  Confirmed. The env inventory MOVED to one owner; index.ts now consumes it.

☑ No duplicate state
  No user state anywhere in this workstream — no table touched carries a user
  or household id.

☑ Extends existing architecture
  Extends turn-fallback's INT35 log (a sink, not a fork), the INT35B/C
  observability surface (new admin routes beside the existing ones), the
  migration runner pattern, and the assertAdmin gate. Nothing built beside an
  existing mechanism.

☑ Progressive enrichment where appropriate
  Not a knowledge entity — operational/transactional records; no enrichment
  added.

☑ Honest gaps over fabricated information
  The operations endpoint reports errors as errors (database.error message,
  turnOutcomes24h.error when the sink is unreachable) — it never fabricates a
  healthy status. Circuit state reports what was observed, nothing predicted.

☑ No permanent synchronisation bridge
  The sink is a one-way funnel (in-memory log events → one durable owner) —
  permitted infrastructure, not a two-owner sync.

☑ Evolution over replacement
  Nothing replaced. The ring buffer, INT35B/C aggregations, and all existing
  fetch degradation behaviour are preserved unchanged.
```

## AI ARCHITECTURE COMPLIANCE

This workstream registers no capability, adds no assistant, and touches the AI plane only at the LLM provider's transport layer and the fallback log's persistence.

```
✓ Uses the canonical Intelligence Platform          (no new platform; sink + transport only)
✓ Uses the Capability Registry                       (no registry change)
✓ Uses the Intent Engine                             (untouched)
✓ Reuses existing business services                  (no business logic added)
✓ Does not create another assistant                  (none)
✓ Does not duplicate conversation state              (turn outcomes ≠ conversation turns; no utterance stored beyond what INT35 already retained)
✓ Uses registered capabilities only                  (n/a — no capability invoked)
✓ Uses permission-aware access                       (all new admin routes assertAdmin-gated; health probes reveal only liveness/readiness booleans)
✓ Produces honest gaps rather than fabricated knowledge (failures classified and reported as failures)
```

## PLATFORM QUALITY COMPLIANCE

```
☑ Security — new operational routes are assertAdmin-gated server-side; the two
  unauthenticated probes reveal only liveness/readiness booleans + latency.
☑ Privacy — platform_turn_outcomes carries no user id, household id,
  parameters, or payloads (identical class to the INT35 log it makes durable);
  the operations payload is PII-free by construction and reports configuration
  PRESENCE only, never values.
☑ Performance — all new request-time work is bounded: readiness probe 2s cap,
  durable-log reads limit-capped (≤1000), sink writes fire-and-forget off the
  turn path, retention pruning amortised (every 50th write).
☑ Observability — this workstream IS the observability closing work; its own
  failures are classified and logged (sink failures, prune failures, shutdown
  errors), never swallowed.
☑ Accessibility — no conversational or visual surface added; JSON operator
  endpoints only.
☑ Trust — no knowledge claims anywhere; every reported status is an observed
  operational fact or an explicit error.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Platform Operations (turn-outcome observability; new operational domain)
Declared SoT: platform_turn_outcomes (DB) via server/intelligence/conversation/turn-outcome-store.ts
New store created? YES
  If YES: retirement plan for any replaced store: N/A — nothing replaced. The
  in-memory ring buffer (turn-fallback.ts) is retained by design as the
  process-local recent-window cache consumed by INT35B/C; the durable table is
  the canonical historical record.
Existing store extended? NO
Consumer created? YES (admin routes /api/admin/platform/operations and
  /api/admin/platform/turn-outcomes; buildOperationsStatus)
  If YES: reads from declared SoT? YES
```

No other data domain is touched: dependency health is ephemeral in-process state; the env inventory is code configuration, relocated to one owner.

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Platform Operations (resilience, observability, operational status)

Current Canonical Owner:
  - Outbound resilience & dependency health: server/lib/platform-resilience.ts
  - Durable turn outcomes: platform_turn_outcomes via turn-outcome-store.ts
  - Operational status & env inventory: server/lib/platform-status.ts

Current Runtime Consumer(s):
  llm-provider.ts, external-meal-service.ts (resilience); conversation
  gateway via turn-fallback sink (durable outcomes); /api/health,
  /api/health/ready, /api/admin/platform/* (status); server/index.ts
  (startup audit, shutdown).

Duplicate Owners Remaining:
  Outbound calls NOT yet routed through platform-resilience.ts: raw fetch
  with ad hoc/no timeout remains in usda-whole-food-service.ts,
  openfoodfacts-importer.ts, recipe-scraper.ts, price-lookup.ts,
  grocery-integration.ts, openai-enrichment.ts / openai-item-classifier.ts
  (OpenAI SDK calls outside the conversation provider), and email.ts (SMTP).

Duplicate State Remaining:
  NONE (dependency health and turn outcomes each have exactly one owner).

Duplicate Workflows Remaining:
  The per-call-site AbortSignal.timeout pattern persists in the files above
  until they converge on guardedFetch/executeWithResilience.

Current Convergence (%):
  ~60% — of the two highest-traffic outbound surfaces named by this
  workstream (LLM provider, external meal sources), 11 of 11 call sites are
  converged (100%); across all outbound-calling modules in server/lib,
  roughly 7 modules remain on raw fetch (counted above).

Target Convergence (%):
  100% of outbound dependency calls through platform-resilience.ts.

Next Planned Milestone:
  EWO-PRO2 (proposed): converge remaining outbound modules onto guardedFetch;
  add alerting on the durable turn-outcome log (the PQA §2 gap that remains).

Remaining Architectural Risks:
  - No alerting: the durable log is auditable but nothing pages anyone
    (named open in PQA §2 as updated).
  - Dependency health is per-process (resets on restart) — correct for
    circuit-breaking, but multi-instance deployments see per-instance state.
```

---

## DEFINITION OF DONE

**Success looks like (all verified live, 2026-07-03):**

- `npm run test:platform-resilience` — 26/26 pass (timeout, retry, accounting, full circuit lifecycle closed→open→refused→half-open→closed, report hygiene). ✅
- `npm run test:platform-turn-outcome-sink` — 9/9 pass (sink receives the scrubbed record, throwing sink never breaks logging, unregistration). ✅
- Existing suites for touched modules unchanged: `test:intelligence-fallback` 82/82, `test:intelligence-observability` 60/60, LLM provider suite 41/41. ✅
- `npm run typecheck` — zero errors in any file created or modified by this workstream (pre-existing errors in three untouched old test files remain, unchanged). ✅
- Live boot on port 5599: migration `2026-07-03_platform_turn_outcomes` applied once and recorded; sink registered; `/api/health` 200; `/api/health/ready` 200 with DB latency; `/api/admin/platform/operations` 403 unauthenticated; durable rows written and read back; SIGTERM → "shutting down gracefully" → "shutdown complete". ✅

**Must not break (verified):** conversation turns (fallback suite green; sink failures isolated by test), external meal search degradation (every converted call site keeps its surrounding try/catch), startup sequence (boot log identical apart from the new audit source and sink line).

**Manual test steps:**
1. `curl /api/health` → `{"status":"ok",…}`; `curl /api/health/ready` → 200 + latency (503 if DB stopped).
2. As admin, GET `/api/admin/platform/operations` → service/memory/database/dependencies/turnOutcomes24h/configuration payload; confirm no secret values appear.
3. Ask the assistant an unanswerable question; as admin, GET `/api/admin/platform/turn-outcomes` → the classified entry, no user identifiers.
4. `kill -TERM <pid>` → graceful shutdown lines in the log, exit 0.

---

## DATA IMPACT

- Reads existing data: **YES** (readiness `SELECT 1`; aggregate counts over the new table only)
- Writes new data: **YES** (`platform_turn_outcomes` — PII-free operational events, bounded retention)
- Changes meaning of existing data: **NO**
- Requires backfill: **NO** (history before this workstream was never durable; the log honestly starts now)

## TRUST CHECK

- Could this mislead the user? **No** — no user-facing surface changed; fallback copy untouched. A circuit-open failure renders through the same honest `internal-error`/empty-result paths as the network failure it stands for.
- Could this fabricate certainty? **No** — the operations payload reports observed facts and explicit errors; the durable log records what the existing classifier already decided.
- Is anything guessed but shown as real? **No.**
- What happens if the system is wrong? A wrongly-open circuit self-heals via the half-open probe within 30s; a failed sink write loses only that log entry (turn unaffected); a wrong readiness answer is bounded by the 2s probe and next poll.
- No architectural duplication introduced: **YES** (one new owner per new fact; env inventory consolidated from one place to one place).
- No new source of truth created without declaration: **YES** — declared above (Domain Impact).
- No runtime behaviour altered (for governance-only work): **N/A** — this is implementation work; runtime changes are intended and listed.

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/before-platform-resilience-ops-20260703` → commit `3460519`
- **Files created:** `server/lib/platform-resilience.ts`, `server/lib/platform-status.ts`, `server/intelligence/conversation/turn-outcome-store.ts`, `server/tests/test-platform-resilience.ts`, `server/tests/test-platform-turn-outcome-sink.ts`, this document.
- **Files modified:** `server/intelligence/conversation/turn-fallback.ts`, `server/intelligence/conversation/llm-provider.ts`, `server/lib/external-meal-service.ts`, `server/index.ts`, `server/routes.ts`, `shared/schema.ts`, `server/migrations/runner.ts`, `package.json`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md`.
- **Rollback commands:** `git checkout rollback/before-platform-resilience-ops-20260703 -- <files above>` then delete the created files. Database: the migration is additive and idempotent; to fully revert, `DROP TABLE IF EXISTS platform_turn_outcomes;` and `DELETE FROM schema_migrations WHERE id = '2026-07-03_platform_turn_outcomes';` (safe — nothing else references the table).
- **Verification after rollback:** `npm run typecheck` (same pre-existing-only errors), `npm run test:intelligence-fallback` green, server boots, `/api/version` responds, `/api/health` 404s again.

---

## SCOPE LOCK

**Implemented scope:** exactly the four platform capabilities above plus the two PQA §11 closures (items 3 and 4). Platform-wide only; zero page-specific code; zero client changes.

**Explicitly excluded scope:**
- PQA §11.1 (`performanceBudget` registry metadata), §11.2 (`accessibilityProfile`), §11.5 (platform accessibility standard) — separate governed workstreams.
- Alerting/paging on the durable log — named as the remaining Observability gap.
- Converging the remaining raw-fetch modules (USDA, OpenFoodFacts, price lookup, grocery integration, recipe scraper, OpenAI enrichment/classifier, SMTP) onto the resilience mechanism — proposed as EWO-PRO2.
- Any admin UI over the operations endpoints — the JSON contract is the platform deliverable; a dashboard page is presentation work.
- SoT Register amendment — following the precedent of OD1/EL1/INT35C (new stores declared in their implementation documents; the register has not been amended per-workstream since 2026-06-23).

**SUGGESTION** (observed out of scope — not implemented): `server/index.ts` seeds (`seedReadyMeals`, `seedFoodKnowledge`, …) swallow errors to `console.error` with no startup-status surface; a future EWO-PRO2 could add "last startup task outcomes" to the operations payload. Also, `res.json` response bodies are logged verbatim by the request logger in `index.ts` — worth a privacy review, unrelated to this workstream.

---

*Verification evidence: test runs and live-boot probes executed 2026-07-03 on branch `int1-intelligence-platform`; see Definition of Done for the observed outputs.*
