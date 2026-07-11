# OBS1 — Observation Engine Activation

**Status: COMPLETE.** This workstream activates the Observation Engine — the Intelligence Platform's canonical telemetry service — and delivers the Observation Admin Workbench. It also resolves the INT20 naming conflict by re-homing the ambient-notice component as the **Notice Engine**, so the platform has exactly one component called the Observation Engine and exactly one telemetry system.

**Date:** 2026-07-08
**Branch:** `int1-intelligence-platform` (baseline commit `22e5bc7`)
**Governing architecture:** `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md` (authored by this workstream), `docs/architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` (re-homed by this workstream)

---

## 1. THE DECISION THIS WORKSTREAM ENCODES

INT20 established a governing document called "THA Observation Engine Architecture" for the Companion's **ambient-notice** component. OBS1 needed the same name for something categorically different: the platform's **runtime telemetry** service. The decision, made before implementation and applied throughout:

- **The Observation Engine is the canonical owner of runtime observations/telemetry** — operator-facing records of platform execution.
- **Ambient notices are a consumer-facing capability of the Companion, not the Observation Engine.** The INT20 component continues unchanged in meaning as the **Notice Engine** (`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`; rollout phases renamed OBS-P1…P6 → NTC-P1…P6).
- **No second telemetry system.** The never-created `platform_turn_outcomes` sink (EWO-PRO1) is retired rather than completed; its store and test were deleted and `platform-status.ts` re-pointed at the Observation Engine's store.

The two engines are disjoint: notices are user-facing facts about the household's own data; observations are operator-facing telemetry about platform execution. No notice is built from an observation; no observation is surfaced to a user.

## 2. WHAT WAS DELIVERED

### 2.1 The Notice Engine re-home (rename only — zero behaviour change)

| Change | Files |
|---|---|
| `observation-engine.ts` → `notice-engine.ts`; `Observation` → `Notice`, `observe*` → `notice*`, `applySilenceRules`/caps kept | `server/intelligence/conversation/notice-engine.ts` (+ deleted old file) |
| `phraseObservation` → `phraseNotice` | `server/intelligence/conversation/behaviour-engine.ts` |
| Shared vocabulary comments re-pointed (mapping constant name unchanged) | `shared/companion-interaction.ts` |
| Client hook doc comments re-pointed (route stays dormant until NTC-P1) | `client/src/hooks/use-companion-observations.ts` |
| Test suite renamed and re-pointed | `server/tests/test-intelligence-notice-engine.ts` (+ deleted old file) |
| Governing docs updated: CPA1, INT21 Behaviour Engine, Platform Quality, README; INT20's record carries a re-scope banner and is otherwise preserved as history | `docs/architecture/*`, `docs/implementation/intelligence/INT20_OBSERVATION_ENGINE_ARCHITECTURE.md`, `docs/implementation/intelligence/INT21_BEHAVIOUR_ENGINE_ARCHITECTURE.md` |

### 2.2 The Observation Engine (new)

| Piece | File | Notes |
|---|---|---|
| Engine: closed 11-kind taxonomy, `recordObservation` seam, pure `summarize*` aggregations | `server/intelligence/observation/observation-engine.ts` | Fire-and-forget, exception-isolated, `OBS_DISABLE_CAPTURE=1` no-op |
| Store contract + in-memory test double (DB-free importable) | `server/intelligence/observation/observation-contract.ts` | No database import permitted in this file |
| Durable store — sole owner of `platform_observations` | `server/intelligence/observation/observation-store.ts` | 30-day retention, 50,000-row cap, opportunistic pruning |
| Schema + types | `shared/schema.ts` (`platformObservations`) | JSONB metadata bag; privacy rules in the header |
| Migration | `server/migrations/runner.ts` (`2026-07-08_platform_observations`) | Additive only; applied to the dev database |

### 2.3 Capture points (business behaviour unchanged — telemetry only)

| Kind(s) | Capture point |
|---|---|
| `capability-invocation`, `manual-override` | `server/intelligence/intent-engine.ts` — `route()` wraps `routeInner()`; the platform's single invocation choke point |
| `intent-resolution`, `clarification`, `knowledge-retrieval`, `context-composition`, `response-generation`, `recovery`, `escalation` | `server/intelligence/conversation/conversation-gateway.ts` — correlated by thread id (`sessionId`), no utterance recorded |
| `user-feedback` | `server/routes.ts` feedback route — rating + reason code + `hasNote`, never the note text |
| `benchmark-run` | `server/tests/benchmark/runner.ts` — best-effort; artifact store remains the system of record |

### 2.4 The Observation Admin Workbench

- **API:** ten admin-only, read-only routes under `GET /api/intelligence/observation/*` — `overview`, `capabilities`, `intents`, `context`, `companion`, `knowledge`, `planner`, `benchmarks`, `recent` (filters + free text + session correlation), `export` (CSV/JSON). Window capped at 30 days.
- **UI:** `client/src/pages/admin-observation-workbench-page.tsx`, registered at `/admin/observations` in `App.tsx`, the admin hub (`admin-page.tsx`), and the admin banner nav.
- **Operations endpoint:** `server/lib/platform-status.ts` reads `countByKindSince(24h)` best-effort (replaces the retired turn-outcome sink).

### 2.5 Tests

- `server/tests/test-intelligence-observation-telemetry.ts` (new, 66 assertions, DB-free): the record seam (capture, intent projection, isolation, disable flag), the store contract (filters, ordering, counts), and every Workbench aggregation including honest-null rates and neutral-outcome exclusion.
- `server/tests/test-intelligence-notice-engine.ts` (renamed, 42 assertions): producers, notability gates, verbatim copying, Silence Rules, `phraseNotice`.
- Both registered in `package.json` (`test:intelligence-notice-engine`, `test:intelligence-observation-telemetry`) and in the `npm test` chain.

## 3. ARCHITECTURE COMPLIANCE

- **One owner, one source of truth:** `platform_observations` is owned solely by `observation-store.ts`; views are pure projections, never materialised; no second telemetry table exists (EWO-PRO1 retired).
- **No business behaviour change except to emit observations:** every capture is fire-and-forget and exception-isolated; `OBS_DISABLE_CAPTURE=1` is functionally a no-op; no code path reads an observation to make a decision.
- **Behaviour Engine untouched in role:** the voice seam is unchanged; the only edit was the `phraseObservation` → `phraseNotice` rename.
- **Not a capability:** the Observation Engine registers nothing in the Capability Registry; the Workbench routes are admin diagnostics like INT35B's, not intents.
- **Privacy:** no utterance or capability payload is stored next to a user id; feedback notes recorded as `hasNote`; `userId` nullable and cascade-deleted.

## 4. VERIFICATION

| Check | Result |
|---|---|
| `test-intelligence-observation-telemetry` | 66 passed, 0 failed |
| `test-intelligence-notice-engine` | 42 passed, 0 failed |
| `test-intelligence-platform` | 33 passed, 0 failed |
| `test-intelligence-fallback` (gateway paths incl. new capture) | 82 passed, 0 failed |
| `test-intelligence-observability` (INT35B, adjacent log untouched) | 60 passed, 0 failed |
| `test-intelligence-context-composition` | 105 passed, 0 failed |
| `test-intelligence-opportunity-delivery-binding` | 50 passed, 0 failed |
| `test-benchmark-routing` / `test-benchmark-utilisation` | 101 / 70 passed, 0 failed |
| Typecheck | No new errors introduced by OBS1 files (baseline `tsc --noEmit` is not clean on this branch — see §5) |
| Runtime | Dev server boots with the routes registered; `GET /api/intelligence/observation/overview` returns 403 unauthenticated (admin gate working); `platform_observations` migration applied |

## 5. KNOWN ISSUES OBSERVED, OUT OF OBS1 SCOPE (pre-existing at baseline `22e5bc7`)

1. **`test-intelligence-personality-platform.ts` crashes identically at HEAD and on this branch:** `user_preferences.companionPersonality` is absent from `shared/schema.ts` (apparently lost in the `8b01fff` concurrent-workstreams checkpoint), so the test's `db.update(...).set({ companionPersonality })` builds an empty SET clause → SQL syntax error. The same missing column causes the pre-existing typecheck error at `conversation-gateway.ts` (`prefs?.companionPersonality`). Needs its own restoration workstream.
2. **Baseline `tsc --noEmit` reports ~40 files with errors** (no `target` in tsconfig plus drift in older tests/scripts). OBS1 files typecheck clean.
3. **Test noise:** suites that drive the gateway with synthetic user ids log `[ObservationEngine] record failed: … violates foreign key constraint` — the isolation contract working as designed (logged, swallowed, operation unaffected). Suites wanting silence can set `OBS_DISABLE_CAPTURE=1` or inject the in-memory store.

## 6. WHAT THIS WORKSTREAM DID NOT DO

- It did not wire the Notice Engine's dormant routes (`GET /api/intelligence/companion/notices` etc.) — that remains NTC-P1 in the Notice Engine architecture's gated rollout.
- It did not converge the parallel notice channels (NTC-P2) or touch any producer.
- It did not add retention configuration, alerting, or any write path to the Workbench.

---

*Rollback: revert the working tree to `22e5bc7` (`git checkout 22e5bc7 -- .`); the `platform_observations` migration is additive and safe to leave in place.*
