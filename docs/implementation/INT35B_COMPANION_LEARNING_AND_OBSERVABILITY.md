# INT35B — Companion Learning & Observability

**Status:** 🟢 IMPLEMENTED
**Date:** 2026-07-02
**EWO:** EWO-INT35B (🟡 AMBER)
**Builds on:** [`INT35_INTELLIGENT_FALLBACK_AND_NATURAL_LANGUAGE_COVERAGE.md`](./INT35_INTELLIGENT_FALLBACK_AND_NATURAL_LANGUAGE_COVERAGE.md) · [`INT36_NATIVE_THA_DISCOVERY_RESPONSES.md`](./INT36_NATIVE_THA_DISCOVERY_RESPONSES.md) · [`INT37_COMPANION_CARD_EXPERIENCE_IMPLEMENTATION.md`](./INT37_COMPANION_CARD_EXPERIENCE_IMPLEMENTATION.md)
**Governing architecture:** [`THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`](../architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md) · [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md)
**Tests:** `npm run test:intelligence-observability` (60 assertions) · included in the `npm test` chain

---

## 1. Objective

INT35 gave the Companion four honest, distinguishable unsuccessful-turn states and a bounded, privacy-safe log of every miss. But the log was **write-only** — nothing read it, nothing aggregated it, and the fallback `state` never left the gateway, so the live Companion could not treat fallback turns consistently and no one could see *what* the Companion was failing to understand.

INT35B closes that loop. It makes the four INT35 states first-class on the wire, adds a read-only **observability** view over the miss log, and adds an **AI-assisted, advisory-only** matcher-suggestion path so the resolver backlog can be turned into concrete coverage proposals — **without ever mutating production routing**. It also expands natural-language coverage for a fresh batch of plausible failed queries.

**Architecture decision (scope rule honoured):** no new assistant, no new state owner, no new capability, no schema change, no change to canonical ownership. Every new piece is either a **pure projection** over data INT35 already records or an **advisory** read path. The Intelligence Platform, Intent Engine, Capability Registry, handlers, and the resolver's production routing are all unchanged.

| Piece | Role in INT35B |
|---|---|
| `companion-observability.ts` (new, pure) | Aggregates the INT35 miss log into a diagnostic summary: counts by state/surface, the unmatched-utterance backlog, and capability-side routing failures. No storage, no platform, no LLM. |
| `matcher-suggester.ts` (new) | Turns the unmatched backlog into **advisory** matcher proposals via the injected LLM. Suggests only — it has no import of, and no write path to, the resolver. |
| `conversation-gateway.ts` | Surfaces the INT35 `fallbackState` on `TurnResult` (derived, never persisted) so the live Companion and observability identify fallback turns consistently. |
| `pattern-intent-resolver.ts` | Coverage expansion (§5) for a new batch of failed phrasings. Production routing logic otherwise unchanged. |
| `routes.ts` | `fallbackState` on `POST /turn`; two **admin-only** read paths for the observability summary and advisory suggestions. |
| `FloatingAssistant.tsx` | Consistent honest fallback on hard transport failure — the one unsuccessful path INT35's server-side states cannot reach. |
| Intelligence Platform / Intent Engine / Registry / handlers / discovery engines | **Unchanged.** |

---

## 2. Scope item 1 — INT35 fallback states used consistently in the live Companion

The gateway already classified every turn into `no-route` / `no-knowledge` / `no-results` / `internal-error` and answered with the honest, state-specific copy (INT35 §4). INT35B makes that classification **observable and consistent end-to-end**:

1. **`fallbackState` on `TurnResult`** (`conversation-gateway.ts`). `buildGroundedResponse` already computed the state to pick the copy; it now returns it. `processUserTurn` threads it onto `TurnResult`. It is **derived per turn and never persisted** — the assistant turn still stores only its honest text (TIP3: the conversation store is a reference/outcome log, not a second home for derived state).
2. **`fallbackState` on `POST /turn`** (`routes.ts`), emitted only when the turn did not succeed. The honest text is still in `text`; the field simply lets any client treat fallback turns as a category.
3. **Transport-failure consistency** (`FloatingAssistant.tsx`). INT35's `internal-error` state covers a thrown handler or a failed LLM call *inside* the gateway, but a hard transport failure (network drop, a 500 from the route) never reaches that code — pre-INT35B the client silently dropped the user's turn. It now keeps the user's turn and appends an honest assistant bubble using the same `internal-error` copy, so **every** unsuccessful path — resolver miss, platform gap, empty search, internal fault, and transport failure — ends in an honest, consistent Companion response.

Fallback turns carry `discoveries: []`, so no Companion Card block renders (INT37) — a fallback is always plain, honest text, never an empty card.

---

## 3. Scope item 3 — Companion observability (`companion-observability.ts`)

A **pure** aggregation over the INT35 ring buffer (`getUnsuccessfulQueryLog()`), exposed via `summarizeCompanionHealth(log?)`:

| Field | Meaning |
|---|---|
| `totalEvents`, `windowStart`, `windowEnd` | Volume and time span of retained misses |
| `byStage` | `resolver-unmatched` vs `turn-fallback` counts |
| `byState` | Counts of each of the four canonical states |
| `bySurface` | Miss counts per surface, most-frequent first |
| `topUnmatchedUtterances` | **The matcher backlog** — utterances the resolver did not understand (from `resolver-unmatched` events and `no-route` fallbacks), normalised, grouped, and ranked by frequency, each with the surfaces it was asked from |
| `routingFailures` | **Capability-side gaps** — routed `capability/verb` shapes that came back `no-knowledge` or `error`, ranked by frequency, with observed statuses |

The two backlogs are deliberately **distinct**: `topUnmatchedUtterances` is a *resolver* problem (we did not understand), `routingFailures` is a *capability* problem (we understood, but the platform had no trusted answer). An `ok-empty` search is neither — it is an honest "nothing matched" and appears in neither backlog.

`normalizeUtterance()` is the grouping key: lower-case, collapse whitespace, strip trailing punctuation. It deliberately does **not** stem or drop stop-words, so the grouped text stays faithful to what the user typed — that fidelity is what makes it a usable matcher backlog.

**Privacy (inherited, enforced by test):** the module only ever receives the INT35 log, which already excludes user id, household id, intent parameters, and capability results. It adds nothing, so it **cannot leak user data by construction** — §5 of the test asserts the serialized summary contains no `userId`/`householdId` keys and no `parameters`/`result` payloads.

**Exposure:** `GET /api/intelligence/observability/companion`, guarded by `assertAdmin`. Read-only operator tooling.

---

## 4. Scope items 3 & 4 — AI-assisted matcher suggestions (`matcher-suggester.ts`)

`suggestMatcherImprovements(backlog, llmProvider)` clusters the unmatched utterances and asks the injected LLM to propose, per cluster, a target capability + verb + example phrasings + an advisory regex.

> **The one hard rule.** This module **suggests; it never applies.** It has no import of the resolver's matcher arrays and no write path of any kind. Every `MatcherSuggestion` carries `applied: false` by construction, and every report carries an advisory-only note. Production routing changes remain a human, code-reviewed edit to `PatternIntentResolver` (scope items 4 & 5).

Additional guards, all test-proven:
- **Capability-constrained.** `suggestedCapability` must be one of `KNOWN_CAPABILITIES`; a suggestion naming anything else (e.g. an invented `small-talk`) is dropped — the LLM cannot invent a capability into the review.
- **Dependency-injected provider.** The only external call is to `ILlmProvider` (stubbed in tests, `createDefaultLlmProvider()` in production). Unavailable provider, provider error, unparseable output, and empty backlog all degrade to an advisory report with **zero** suggestions and never throw.
- **Privacy.** The prompt carries only normalised (already privacy-safe) utterances plus the static capability list.

**Exposure:** `POST /api/intelligence/observability/suggest-matchers`, guarded by `assertAdmin`, running the suggester over `unmatchedUtteranceBacklog()`.

---

## 5. Scope item 2 — Natural-language coverage expansion

New coverage in `pattern-intent-resolver.ts` for a fresh batch of plausible failed queries (the kind `topUnmatchedUtterances` would surface), each closed with a specific, guarded matcher and regression-tested:

| Utterance | Before | After |
|---|---|---|
| `high fibre meals` / `high-fiber recipes` | INT35 only routed `high-protein` for a "high-*" descriptor → weak `meals` fallback | **nutrition-discovery / search** |
| `low calorie dinners` / `low-calorie meals` | only `under N calories` was covered; the descriptor phrasing was not | **nutrition-discovery / search** |
| `low sodium meals` / `low salt recipes` | uncovered | **nutrition-discovery / search** |
| `meal ideas` / `dinner ideas` / `healthy dinner ideas` | "ideas" was in no matcher → `no-route` | **meal-discovery / search** (leading descriptor becomes the query: `healthy dinner ideas` → `"healthy"`) |
| `any ideas for dinner tonight` | `no-route` | **meal-discovery / search** |
| `what should I cook tonight` / `what should I make for dinner` | `no-route` | **meal-discovery / search** |

**Guards preserved:** the ingredient form (`what can I cook **with** chickpeas` → still extracts `chickpeas`) and the calorie-bounded form (`what can I have **under 400** calories` → still nutrition-discovery) keep their existing owners — the new "what should I cook" matcher explicitly returns null when `with` or `under N` is present. The unrecognised marker is untouched: a genuine miss (`wibble flurble`) is still marked `gap: { kind: "unknown" }`.

---

## 6. Scope item 5 — Honest gaps & ownership boundaries preserved

- **Honest gaps.** Observability *reports* honest gaps (`no-knowledge`, `routingFailures`); it never papers over them. The suggester proposes coverage but never fabricates an answer or a capability.
- **Ownership.** No new state owner, no duplicated conversation state, no schema change. The miss log stays the single artefact; the observability module reads it, the suggester reads the backlog, and neither writes anywhere. Production routing is owned solely by the human-edited resolver.
- **Permission-aware exposure.** Both new routes are `assertAdmin`-gated operator tooling. The underlying data is already user-anonymised by INT35.

---

## 7. Files changed

| File | Change |
|---|---|
| `server/intelligence/conversation/companion-observability.ts` | **NEW** — pure aggregation: `summarizeCompanionHealth`, `unmatchedUtteranceBacklog`, `normalizeUtterance` |
| `server/intelligence/conversation/matcher-suggester.ts` | **NEW** — advisory-only, capability-constrained LLM matcher suggestions; `KNOWN_CAPABILITIES` |
| `server/intelligence/conversation/conversation-gateway.ts` | Surface `fallbackState` on `TurnResult` (derived, never persisted) |
| `server/intelligence/pattern-intent-resolver.ts` | Coverage expansion (§5); production routing logic otherwise unchanged |
| `server/routes.ts` | `fallbackState` on `POST /turn`; admin-only `GET /observability/companion` and `POST /observability/suggest-matchers` |
| `client/src/components/conversation/FloatingAssistant.tsx` | `fallbackState` field; honest assistant bubble on hard transport failure |
| `server/tests/test-intelligence-observability.ts` | **NEW** — 60 assertions (§8) |
| `package.json` | `test:intelligence-observability` script; appended to the `npm test` chain |
| `docs/implementation/INT35B_COMPANION_LEARNING_AND_OBSERVABILITY.md` | **NEW** — this document |

Not touched: `turn-fallback.ts` (its exports are reused unchanged), `native-discovery.ts`, `companion-card.ts`, intelligence-platform, intent-engine, capability-registry, every handler/port/binding, every discovery engine, schema.

---

## 8. Test evidence (`test-intelligence-observability.ts`, 60 assertions)

| Scope requirement | Proven by |
|---|---|
| Fallback states surfaced consistently in the live Companion | §7: all four states + the LLM-failure path surface the correct `fallbackState` end-to-end through the real gateway pipeline; a successful turn has none |
| Observability aggregates misses | §2: stage/state/surface counts, window bounds, empty-log safety |
| Matcher backlog is usable & correctly scoped | §3: case-insensitive grouping, frequency ranking, per-surface attribution; `ok-empty` searches excluded; `unmatchedUtteranceBacklog` wrapper |
| Routing failures are distinct from the backlog | §4: `no-knowledge`/`error` shapes aggregated with statuses; `no-route` and `ok-empty` excluded; ranked |
| No user data leaks | §5: serialized summary has no `userId`/`householdId` keys, no `parameters`/`result` payloads |
| AI suggests only, never applies | §6: every suggestion `applied === false`; invented capabilities and empty clusters dropped; advisory note present; unavailable/error/unparseable/empty all degrade to zero suggestions without throwing |
| Coverage expansion works & regressions hold | §8: the new INT35B phrasings route; the ingredient/calorie guards hold; INT35 phrasings still route; a genuine miss is still marked unrecognised |

Full verification run (2026-07-02): `test:intelligence-observability` 60/60 · `test:intelligence-fallback` 82/82 · `test-intent-resolver` 124/124 · `test:intelligence-compound-resolver` 109/109 · `test:intelligence-conversation-gateway` 64/64 · `test:intelligence-native-discovery` 81/81 · `test:intelligence-companion-card` 36/36 · `tsc --noEmit` introduces no new errors (153 pre-existing, unchanged).

---

## 9. Behavioural notes & accepted trade-offs

- **The log is in-memory (inherited from INT35).** Observability reads the same bounded ring buffer, so the summary is process-local and resets on restart; the structured `console.info` line INT35 emits per miss remains the durable feed for whatever log aggregation production runs. Persisting misses to a table would be a schema change outside this scope.
- **Suggestions are advisory by design.** Auto-editing production routing from model output would violate the resolver's "human-owned, deterministic, testable" contract. The suggester deliberately has no write path — closing the loop from suggestion to shipped matcher is a human, code-reviewed edit (which is exactly what §5 is).
- **`fallbackState` is derived, not stored.** Like INT37's Companion Cards, it is a per-turn projection surfaced on the response and never persisted — the assistant turn already stores the honest text, and `outcomeRef` still records the first routed platform outcome for traceability.
- **Coverage expansion stays conservative.** Each new matcher is whole-phrase-guarded and defers to more specific existing matchers (ingredient, calorie-bounded), so the additions raise recall without displacing precise routing — proven by the regression assertions in §8.
