# OBS2 — Execution Timeline (Behaviour Admin Workbench)

**Status: COMPLETE.** This workstream delivers the Execution Timeline — the primary debugging and reasoning view for Companion behaviour — inside a new **Behaviour Admin Workbench** (`/admin/behaviour`). The timeline reconstructs the complete execution path of an individual interaction, read-only from Observation Engine data, and introduces the per-turn correlation identifier that makes that reconstruction exact.

**Date:** 2026-07-08
**Branch:** `int1-intelligence-platform` (on top of OBS1)
**Governing architecture:** `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md` (§2.1 correlation identifiers, §6.2 the Behaviour Admin Workbench — both added by this workstream)

---

## 1. THE DECISION THIS WORKSTREAM ENCODES

The Execution Timeline is an **Observation Engine read model, not a Behaviour Engine feature.** Despite the Workbench's name, the Behaviour Engine owns no timeline data, no route reads conversation or capability state, and no timeline table exists — every view is a pure projection computed per request over `platform_observations` (no duplicate telemetry or state).

Correlation uses the Observation Engine's own identifiers, extended once:

- `sessionId` (the conversation thread id, OBS1) groups an interaction.
- **`metadata.turnId` (new)** — the already-persisted user-turn id — groups every observation one conversation turn emits. It rides in the JSONB metadata bag per the schema's extensibility rule ("new analytical needs never add columns"), so **no migration was needed**.
- Rows recorded before OBS2 carry no turnId: the timeline groups them by an honest boundary heuristic (a new turn starts at each `intent-resolution`) and labels them `reconstructed`; legacy feedback that cannot be placed is shown `unassigned` — never guessed into a turn.

## 2. WHAT WAS DELIVERED

### 2.1 Correlation capture (telemetry only — zero behaviour change)

| Change | Files |
|---|---|
| `recordObservation` accepts `turnId` and merges it into the metadata bag | `server/intelligence/observation/observation-engine.ts` |
| `RouteOptions.observation` — the gateway threads `{sessionId, surface, turnId}` into the Intent Engine's single invocation capture point; routing never reads it | `server/intelligence/intent-engine.ts` |
| `buildGroundedResponse` takes `turnId` (the persisted user-turn id, passed by `processUserTurn`); the shared `obs` correlation object carries it into every per-turn capture; `queryCapability`/`HandleIntentFn` forward it (optional param — injected test stubs unchanged) | `server/intelligence/conversation/conversation-gateway.ts` |
| "Behaviour selected": `personalityId` recorded in `response-generation` metadata (ok + error) and in the fallback `recovery` metadata — the voice that phrased the turn | `server/intelligence/conversation/conversation-gateway.ts` |
| `getTurnObservationRef(turnId)` — a turn's thread id + opening user-turn id (ids only, no content), so the feedback route correlates `user-feedback` into the timeline of the turn it rates (best-effort; a lookup failure never fails feedback) | `server/intelligence/conversation/conversation-store.ts` (interface + both implementations), `server/routes.ts` feedback route |

### 2.2 The timeline projections (Observation Engine-owned, pure)

`server/intelligence/observation/execution-timeline.ts` — DB-free, no imports beyond schema types:

- `buildExecutionTimeline(rows, sessionId)` — chronological turns, each with: intent + confidence + resolution outcome, capabilities invoked (with outcomes and durations), Context Views composed, knowledge sources consulted, behaviour (personality) selected, response generation (outcome/model/duration), clarifications, recoveries, escalations, attached feedback, attention flag, per-event `sincePreviousMs` stage gaps, `wallClockMs` and `stageDurationTotalMs`. The user request is honestly `userRequestRecorded: false` (the engine's privacy rule) with a `privacyNote` on every timeline.
- `summarizeTimelineSessions(rows, filter)` — the picker: per-session turn/observation counts, users, surfaces, capabilities, intents, failure signals, attention flag; filters by user, capability, intent, session (AND semantics); benchmark-run and sessionless rows excluded.
- `timelineToCsv(timeline)` — one CSV row per event carrying its turn correlation.

### 2.3 API (admin-only, read-only)

- `GET /api/intelligence/observation/timeline/sessions` — window (`days` ≤ 30, the date filter) + user/capability/intent/session filters.
- `GET /api/intelligence/observation/timeline/session/:sessionId` — the reconstructed timeline.
- `GET /api/intelligence/observation/timeline/session/:sessionId/export?format=json|csv`.

### 2.4 The Behaviour Admin Workbench UI

`client/src/pages/admin-behaviour-workbench-page.tsx`, registered at `/admin/behaviour` in `App.tsx`, the admin hub, and the admin banner nav. Session picker (filters + failure-signal badges) → per-turn cards in chronological flow: summary grid (every field the spec names, honest "—"/"not recorded (privacy)" for absences), a vertical execution flow with severity-coloured markers, per-stage durations and `+gap` markers, click-to-reveal full observation details (all fields + metadata JSON), attention turns highlighted, CSV/JSON export.

### 2.5 Tests

`server/tests/test-intelligence-execution-timeline.ts` (new, 64 assertions, DB-free): the turnId metadata seam, exact grouping, reconstructed grouping + unassigned legacy feedback, every turn projection field (including behaviour-from-recovery on fallback turns), timings, session scoping/privacy note, picker filters/ordering, CSV shape/escaping. Registered as `test:intelligence-execution-timeline` and in the `npm test` chain.

## 3. ARCHITECTURE COMPLIANCE

- **Read only from the Observation Engine:** routes read `observationStore` and nothing else; the UI reads only `GET /api/intelligence/observation/timeline/*`.
- **The Behaviour Engine never owns timeline data:** untouched by this workstream except that its selected personality is now *recorded about* (in existing observation kinds' metadata).
- **No duplicate telemetry or state:** no new table, no new column, no materialised view; correlation is a metadata field on the one store.
- **Capture discipline preserved:** every change is inside existing capture points or optional telemetry parameters; `OBS_DISABLE_CAPTURE=1` remains a functional no-op; the feedback correlation lookup is wrapped so it can never fail the feedback write.
- **Privacy:** no utterance anywhere; the timeline states the gap instead of filling it.

## 4. VERIFICATION

| Check | Result |
|---|---|
| `test-intelligence-execution-timeline` | 64 passed, 0 failed |
| `test-intelligence-observation-telemetry` | 66 passed, 0 failed |
| `test-intelligence-platform` / `test-intelligence-fallback` | 33 / 82 passed, 0 failed |
| `test-intelligence-notice-engine` | 42 passed, 0 failed |
| `test-intelligence-observability` / `test-intelligence-companion-actions` | 60 / 62 passed, 0 failed |
| `test-intelligence-conversation-gateway` | 64 passed, 0 failed |
| Typecheck | No new errors from OBS2 files (baseline issues per OBS1 §5 unchanged, incl. the pre-existing `companionPersonality` error) |
| Runtime | Dev server boots with migrations at head; all three timeline routes registered and 403 unauthenticated (admin gate working) |

## 5. HONEST LIMITS

1. **Timestamps are persist-time.** Observations are fire-and-forget, so `observedAt` marks roughly the end of a stage; inter-stage gaps are approximate. Per-stage `durationMs` is measured at the capture point and is exact.
2. **Legacy rows (pre-OBS2) reconstruct, not correlate.** Grouping is heuristic and labelled as such; legacy feedback stays unassigned. New traffic correlates exactly.
3. **A session timeline reads up to the store's most recent 1,000 rows for that session** (the store's own `listRecent` cap); retention (30 days / 50,000 rows) bounds everything else.

---

*Rollback: revert the OBS2 files; no migration was applied, and pre-OBS2 rows are unaffected (turnId is additive metadata).*
