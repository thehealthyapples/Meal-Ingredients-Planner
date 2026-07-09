# THA Observation Engine Architecture

**Status:** GOVERNING ARCHITECTURE — Intelligence Governance (canonical). Established by workstream `OBS1`, 2026-07-08.
**Classification:** Intelligence Governance — the single owner of runtime observations: the platform's one telemetry system, recording what the Intelligence Platform actually did, how confidently, how fast, and with what outcome.
**Governing documents:** `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1), `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2), `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17), `PLATFORM_QUALITY_ARCHITECTURE.md`
**Implementation records:** `docs/implementation/OBS1_OBSERVATION_ENGINE_ACTIVATION.md`, `docs/implementation/OBS2_EXECUTION_TIMELINE.md`, `docs/implementation/BEH1_BEHAVIOUR_ENGINE_ACTIVATION.md` (the twelfth kind)
**Naming history:** This filename was established by INT20 for the Companion's ambient-notice component. OBS1 (2026-07-08) reassigned the **Observation Engine** name to the platform telemetry service defined here; the ambient-notice architecture continues unchanged in meaning as the **Notice Engine** (`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`). The two are disjoint: **notices are user-facing facts about the household's own data; observations are operator-facing telemetry about platform execution.**

---

## 0. MANDATE

**There is one Observation Engine. Every durable record of "what the platform did at runtime" — an intent resolved, a capability invoked, grounding composed, knowledge retrieved or honestly gapped, a response generated, a turn recovered, an action escalated or explicitly confirmed, feedback given, a benchmark scored — is an Observation: one row in one bounded store, written through one fire-and-forget seam, read only by operator views. No other component may create a second telemetry store, a second capture seam, or a second aggregation layer over runtime behaviour.**

The engine's own hard invariant, the reason it is safe to put a capture call anywhere:

> Observation capture may never fail, slow, or alter the observed operation. Telemetry is a side effect of behaviour, never an input to it — no business decision, permission check, confirmation tier, or user-facing output may ever read an observation.

---

## 1. EXECUTIVE SUMMARY

Before OBS1, the platform's runtime evidence was fragmented and mostly aspirational: a designed-but-never-created turn-outcome sink (`platform_turn_outcomes`, EWO-PRO1), benchmark artifacts on disk, the INT35 unsuccessful-query log, and nothing at all recording capability invocations, intent-resolution confidence, context-composition cost, or feedback outcomes durably. The operations endpoint reported from a store that did not exist.

OBS1 activates one canonical telemetry chain:

- **One store.** `platform_observations`, sole-owned by `server/intelligence/observation/observation-store.ts`, bounded (30-day retention, 50,000-row cap, opportunistic pruning). An operational window, not an archive.
- **One capture seam.** `recordObservation()` in `server/intelligence/observation/observation-engine.ts` — fire-and-forget, exception-isolated, disableable (`OBS_DISABLE_CAPTURE=1`) with zero functional difference.
- **One read surface.** Pure aggregation functions over `PlatformObservation[]` (DB-free testable), exposed through admin-only, read-only Workbench routes (`GET /api/intelligence/observation/*`) and rendered by the Observation Admin Workbench (`/admin/observations`).

The never-created EWO-PRO1 turn-outcome sink is **retired, not completed** — recovery and clarification observations are the turn-outcome evidence, and `platform-status.ts`'s operations endpoint now reads `countByKindSince` from this store.

---

## 2. WHAT IS OBSERVED

### 2.1 The definition

An **Observation** is one durable, privacy-bounded record of a runtime event the platform executed: a closed `kind`, a severity, an outcome, correlation fields (user, session, surface, capability, verb, intent), quantities (confidence, duration), and a `metadata` bag of shapes and counts — never content.

Two correlation identifiers tie observations together (OBS2): `sessionId` (the conversation thread id) groups an interaction, and `metadata.turnId` (the persisted user-turn id, carried in the metadata bag per the no-new-columns rule) groups every observation one conversation turn emits — the Execution Timeline's exact-grouping key. Both are telemetry-only: nothing in the platform reads them back to make a decision.

### 2.2 The closed kind taxonomy

Twelve kinds (`OBSERVATION_KINDS`), each with a named capture point. Growing the vocabulary is an architecture decision (extend the union, document the capture point); an event that fits no kind is not recorded — never guessed into one. The twelfth kind, `behaviour-decision`, was added by BEH1 (2026-07-09) through exactly this path: no new store, no new seam, no new column, no migration.

| Kind | Capture point | What it records |
|---|---|---|
| `intent-resolution` | `conversation-gateway.ts` | Resolver ran: top capability/verb, confidence, gap kind, intent counts, duration |
| `capability-invocation` | `intent-engine.ts` (`route()`) | One `(verb × capability)` routed: outcome + duration — the single choke point, so the single capture point |
| `context-composition` | `conversation-gateway.ts` | The Context Composition Engine's own metrics, verbatim: tokens, budget, sections, Context Views used — and, since NCV1, which of those views were **native** (declared by the payload's owner) and which **generic** (derived by the engine) |
| `knowledge-retrieval` | `conversation-gateway.ts` | Grounded vs honest gap; the contributing capabilities |
| `response-generation` | `conversation-gateway.ts` | LLM turn: model, wall time, ok/error |
| `behaviour-decision` | `conversation-gateway.ts` | The Behaviour Engine's sealed decision for one interaction: the voice applied, the voice requested, override + reason, provenance confidence, the outcome (`voiced` / `voiced-fallback` / `voiced-error` / `not-voiced`), the surfaces touched, and the engine's deterministic reasoning. One row per interaction, on every gateway exit path |
| `clarification` | `conversation-gateway.ts` | The resolver could not understand — a clarification surfaced |
| `recovery` | `conversation-gateway.ts` | A turn fell back: fallback state + recovery path taken |
| `escalation` | `conversation-gateway.ts` | Refusal/redirect to manual action (e.g. the write-intent guard) |
| `manual-override` | `intent-engine.ts` | A confirmation-gated intent was explicitly confirmed and executed |
| `user-feedback` | `routes.ts` (feedback route) | Thumbs up/down: rating, reason code, `hasNote` — never the note text |
| `benchmark-run` | `tests/benchmark/runner.ts` | One benchmark execution: headline score, gap rate, latency, duration |

The `behaviour-decision` row is recorded by the **gateway**, never by the Behaviour Engine — §4 rule 4 is why. Its `metadata.reasoning` describes the engine's own transform (which seam it touched, whose disclosure it re-wrapped, how many already-eligible suggestions it reordered); it never carries a household fact, an utterance, or an answer.

Domain intelligence (planner, shopping, food intelligence, discovery…) is deliberately **not** a separate kind: every domain capability is invoked through the one Intent Engine choke point and therefore appears as `capability-invocation` rows sliced by capability id. New analytical needs are met by the closed-but-growable `kind` vocabulary plus the JSONB `metadata` bag — never by schema redesign.

### 2.3 What is never observed

- **No content.** No utterance and no capability result payload is ever recorded alongside a user id. Metadata carries shapes, names, counts, and timings. Feedback notes are recorded as `hasNote`, never the text. (The one adjacent exception is the pre-existing INT35 PII-scrubbed fallback log, which stores a truncated utterance with **no** user attribution — it is separately owned and predates this engine; see §5.3.)
- **No business facts.** The household's planner, pantry, trends, and streaks are the producing capabilities' and the Notice Engine's concern. An observation records that the platform *ran*, never what the user's data *is*.
- **No unmapped events.** No kind, no row.

---

## 3. WHO OWNS OBSERVATIONS

| Fact | Owner | Persistence |
|---|---|---|
| The observation row | `observation-store.ts` — sole owner of `platform_observations` | The engine's one table, bounded retention |
| The kind vocabulary | `observation-engine.ts` (`OBSERVATION_KINDS`, closed) | n/a (code) |
| The capture decision (what each kind records) | The capture point, per the privacy rules in `observation-engine.ts`'s header | n/a |
| The record seam (isolation, disable flag, lazy store) | `observation-engine.ts` (`recordObservation`) | n/a |
| The operator views | `observation-engine.ts`'s pure `summarize*` functions | Never persisted — computed per request |
| The store contract + DB-free test double | `observation-contract.ts` (must stay importable without a database) | n/a |
| The Workbench UI | `client/src/pages/admin-observation-workbench-page.tsx` over `GET /api/intelligence/observation/*` (admin-only, read-only) | n/a |
| The Execution Timeline projections (OBS2) | `execution-timeline.ts` — pure functions over `PlatformObservation[]` | Never persisted — computed per request |
| The behaviour analytics projection (BEH1) | `observation-engine.ts` (`summarizeBehaviour`) — one more pure summarizer, joining `behaviour-decision` to `user-feedback` by `metadata.turnId` | Never persisted — computed per request |
| The Behaviour Admin Workbench UI (OBS2, BEH1) | `client/src/pages/admin-behaviour-workbench-page.tsx` over `GET /api/intelligence/observation/behaviour` and `GET /api/intelligence/observation/timeline/*` (admin-only, read-only) | n/a |

Consequences:

1. **The store is the only new durable fact.** Everything else the engine emits is a pure projection of rows, recomputed per request — no materialised aggregate, no second table, no cache with its own truth.
2. **Retention is the store's, not the operator's.** 30 days / 50,000 rows, pruned opportunistically after writes. Evidence that must outlive the window (benchmark history, learning evidence) already has its own owner (benchmark artifacts, EL1) — the observation is a projection of those events, never their system of record.

---

## 4. THE CAPTURE DISCIPLINE

The rules every capture point obeys, by construction:

1. **Fire-and-forget.** `recordObservation` returns `void`, never a promise the caller awaits. A database problem is logged and swallowed; the observed operation proceeds identically.
2. **Exception-isolated.** The seam never throws — not on a missing store, a failed lazy import (no `DATABASE_URL`), or a write error.
3. **Disableable without difference.** `OBS_DISABLE_CAPTURE=1` turns every capture into a no-op. If disabling capture changes any behaviour, that behaviour was illegally reading telemetry.
4. **Zero new I/O in pure modules.** Capture points live in components that already perform I/O (the gateway, the Intent Engine's route method, a route handler, the benchmark runner). Pure modules (the Notice Engine, the Behaviour Engine, the Context Composition Engine's composer) never record — their callers do.
5. **Privacy at the point of capture.** The store persists exactly what it is given; the no-content rules (§2.3) are enforced where the row is built, and every capture point's metadata is reviewable in one grep of `recordObservation(`.

---

## 5. INTEGRATION

### 5.1 With the Intent Engine and Conversation Gateway (TIP1)

`IntentEngine.route()` is the platform's single capability-invocation choke point, so it is the single `capability-invocation` capture point — a capability handler never records its own invocation. The Conversation Gateway records the per-turn kinds around its existing pipeline steps, correlated by thread id (`sessionId`) and, since OBS2, by user-turn id (`metadata.turnId`); the gateway threads the same correlation into the Intent Engine via `RouteOptions.observation` (telemetry-only — routing never reads it) so invocation observations join their turn, and the feedback route resolves its assistant turn's thread and opening user turn so `user-feedback` joins the timeline of the turn it rates. Neither component's outcomes, messages, or timings visible to callers change.

### 5.2 With the Notice Engine and Companion Platform (CPA1)

Disjoint by architecture. The Notice Engine selects user-facing facts under an attention budget; the Observation Engine records operator-facing execution under a retention budget. No notice is built from an observation; no observation is surfaced to a user. The shared name history is documented (§ header) precisely so the two are never merged.

### 5.1b With the Context Composition Engine (INT17 / NCV1)

The same one-way shape as the Behaviour Engine below, and for the same reason. The Context Composition Engine is a pure module (§4 rule 4), so it records nothing; the gateway records `context-composition` around it and copies the engine's metrics verbatim.

NCV1's native/generic classification is **not** one of those metrics. It is resolved at the capture point by asking the Context View registry — the canonical owner of the answer (`hasNativeContextView`) — precisely so the engine itself never learns which of its inputs was declared and which was inferred. The engine's inability to tell them apart is a governing invariant of INT17 §2.1; observing the difference must not create a way to act on it.

**The classification is never backfilled.** A row written before NCV1 named its views but classified none, and `summarizeContext` reports those uses as `unknown` — never as `generic`. Resolving them against today's registry would answer a question about the present and stamp it on the past, and the rollout the field exists to measure is exactly what changed in between. A row that did not say is not a row that said no.

### 5.2b With the Behaviour Engine (INT21 / BEH1)

One-way, and worth stating because the Workbench's name invites the confusion. **The Behaviour Engine is observed; it never observes.** It records nothing (it is a pure module — §4 rule 4 — so the gateway captures its decision), and it reads nothing: no voice is chosen, adapted, or suppressed because of telemetry. `summarizeBehaviour`, `buildExecutionTimeline`, and every number on `/admin/behaviour` are Observation Engine projections over `platform_observations`; there is no behaviour table and no materialised behaviour aggregate.

The one value the Workbench takes from the Behaviour Engine is `describeBehaviourRegistry()` — a live, read-only **description of the voices**, not telemetry, so a personality is displayed as it is defined today rather than as a copy captured at record time. Telemetry and registry are joined for display and never merged, never persisted together.

"Behaviour effectiveness" is therefore an operator reading, never a platform signal: it is the user-feedback rate observed on turns a voice phrased, `null` when nothing is rated. §7's "no behaviour reads an observation" stop applies to it without exception — including any future learning loop.

### 5.3 With INT35 observability and the benchmark platform

- The **INT35/INT35B unsuccessful-query log** (`logUnsuccessfulQuery`, admin learning routes) predates this engine and remains separately owned. It stores a PII-scrubbed truncated utterance without user attribution — content this engine's privacy rules forbid it to hold. The two answer different questions ("what exactly did users ask that we failed?" vs "how is the platform executing?"); convergence, if ever, is its own gated workstream.
- The **benchmark runner** records one `benchmark-run` observation per scored run, best-effort. The benchmark's artifact store remains the system of record for run results; the observation exists so the Workbench can trend headline scores without parsing artifacts.

### 5.4 With the operations endpoint

`platform-status.ts` reads `countByKindSince(24h)` as optional evidence — an unreachable table must never take the operations endpoint down. This replaces the retired EWO-PRO1 turn-outcome sink.

---

## 6. THE OPERATOR SURFACES

Two admin-only, read-only pages over the same engine — no other operator surface may exist:

### 6.1 The Observation Admin Workbench (`/admin/observations`, OBS1)

- **Views:** overview, capabilities, intents, context, companion, knowledge, planner, benchmarks — each a `GET /api/intelligence/observation/<view>` route that fetches one bounded window (`days` ≤ 30) and aggregates with the engine's pure summarizers.
- **Diagnostics:** `GET /api/intelligence/observation/recent` with kind/capability/severity/session/free-text filters; `GET /api/intelligence/observation/export` (CSV/JSON) for operator evidence.
- **Honest aggregation:** rates are `null` when there is nothing to judge — never a fabricated 0 or 100%. Neutral outcomes (`confirmation_required`) are excluded from success rates rather than counted as failures.
- **Context View rollout (NCV1):** the `context` view counts each Context View's uses as `native`, `generic`, or `not recorded`. The three partition every use, so the rollout's reach is readable without a second store — and a pre-NCV1 row is never counted as generic to make the total look complete.
- The Workbench writes nothing, reads no business data, and holds no state of its own.

### 6.2 The Behaviour Admin Workbench (`/admin/behaviour`, OBS2 + BEH1)

One page, two read-only views over the same store. **The Behaviour Engine never owns timeline or analytics data**; despite the page's name, every byte it shows is Observation Engine telemetry (the sole exception being the live registry description of §5.2b, which is voice metadata, not a runtime record).

**The Behaviour view (BEH1)** — what the Companion's voice decided across a window: the active behaviour selected, the personality applied (with its 12-dimension profile, read live from the registry), behaviour outcome, provenance confidence, effectiveness, overrides, and analytics.

- **Route:** `GET /api/intelligence/observation/behaviour` → `{ telemetry, registry }` — two halves from their two owners, joined for display only.
- **Honest aggregation:** effectiveness, override rate, and confidence are `null` when there is nothing to judge. Feedback that names no recorded decision is reported as `unattributedFeedback`, never guessed into a voice. The overrides table discloses its own listing cap while the counts stay complete.
- **Honest coverage:** `not-voiced` decisions are shown, so interactions where the Companion spoke platform-owned copy rather than registry content are counted rather than disguised (INT21 §8.4).

**The Execution Timeline (OBS2)** — the primary debugging and reasoning view for one interaction: it reconstructs the complete execution path — intent identified (with confidence), capabilities invoked, knowledge sources consulted, Context Views composed (each labelled `native` or `generic`, NCV1), behaviour decided (with the engine's own reasoning), response generated, clarifications, recoveries, escalations, and user feedback — chronologically, with per-stage durations and inter-stage gaps, failures highlighted, and every event clickable through to its underlying observation.

- **Routes:** `GET /api/intelligence/observation/timeline/sessions` (the picker — filterable by user, capability, intent, session over the bounded window), `GET .../timeline/session/:sessionId` (the reconstructed timeline), `GET .../timeline/session/:sessionId/export` (JSON/CSV).
- **Projection, not state:** `execution-timeline.ts` holds only pure functions over `PlatformObservation[]` — no timeline table, no duplicate telemetry.
- **Honest correlation:** turns are grouped exactly by `metadata.turnId`; rows recorded before OBS2 are grouped by boundary heuristic and labelled `reconstructed`, and uncorrelatable legacy feedback is shown as `unassigned` — never guessed into a turn. A turn recorded before BEH1 shows no behaviour decision — absent, never reconstructed — while OBS2's legacy `personalityId` crumb still names the voice.
- **Honest gaps:** the user's request text is displayed as "not recorded (privacy)" — the engine's §2.3 rule — and absent stages render as nulls, never fabricated. A turn recorded before NCV1 shows its Context Views with `native/generic not recorded (pre-NCV1)`, never with every view labelled generic (§5.1b).

---

## 7. NON-NEGOTIABLES

Hard stops, in the spirit of `ENGINEERING_WORKFLOW.md` STEP 7:

- **Any second telemetry store, sink, or capture seam** — a new table of runtime events, a parallel logger with its own aggregations — **stop.** Extend the kind vocabulary and this store, or don't record it.
- **Any behaviour that reads an observation** — routing, permissions, confirmation tiers, phrasing, notices, learning — **stop.** Telemetry is operator evidence only; `OBS_DISABLE_CAPTURE=1` must always be a no-op functionally.
- **Any capture that can fail or slow the observed operation** — an awaited write, an unhandled throw — **stop.**
- **Any content persisted next to a user id** — utterances, result payloads, feedback note text — **stop.** Shapes and counts only.
- **Any unbounded retention or materialised aggregate** — **stop.** The window is the store's; views are pure projections.
- **Any new kind without a documented capture point, or any event guessed into an existing kind** — **stop.**
- **Any non-admin or writing route over the store** — **stop.** The Workbench is read-only, admin-only.
- **Any second Observation Engine, anywhere, rather than the one extended in place** — **stop.**

---

## 8. DEFINITION OF DONE — CHECK

| Requirement | Met by |
|---|---|
| One canonical Observation Engine defined | §0 mandate; §3 ownership; §7 second-system stops |
| What is observed | §2 — closed twelve-kind taxonomy, one capture point per kind, never-observed list |
| Who owns observations | §3 — store, seam, vocabulary, views, each owned once |
| Capture cannot alter behaviour | §4 discipline; §7 stops; `OBS_DISABLE_CAPTURE` |
| Integration with Intent Engine, Notice Engine, Behaviour Engine, INT35, benchmarks, operations | §5 |
| Operator surface | §6 — the Observation Admin Workbench and the Behaviour Admin Workbench (Behaviour view + Execution Timeline) |
| Growing the vocabulary is an architecture decision, not a schema redesign | §2.2 — BEH1's twelfth kind added with no store, seam, column, or migration |
| No conflict with the former use of this name | Naming history (header); `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`; INT20 record re-scope note |

---

*Required reading before recording any new runtime telemetry, adding an observation kind, or building any operator view over platform execution anywhere in THA.*
*Implementation records: `docs/implementation/OBS1_OBSERVATION_ENGINE_ACTIVATION.md`, `docs/implementation/OBS2_EXECUTION_TIMELINE.md`, `docs/implementation/BEH1_BEHAVIOUR_ENGINE_ACTIVATION.md`.*
