# INT35C — Governed Companion Learning & Intelligence Dashboard

**Status:** 🟢 IMPLEMENTED
**Date:** 2026-07-02
**Branch:** int1-intelligence-platform
**EWO:** EWO-INT35C (🟡 AMBER)
**Builds on:** [`INT35_INTELLIGENT_FALLBACK_AND_NATURAL_LANGUAGE_COVERAGE.md`](./INT35_INTELLIGENT_FALLBACK_AND_NATURAL_LANGUAGE_COVERAGE.md) · [`INT35B_COMPANION_LEARNING_AND_OBSERVABILITY.md`](./INT35B_COMPANION_LEARNING_AND_OBSERVABILITY.md)
**Governing architecture:** [`THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`](../../architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md) · [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) §8 (Administrator Intelligence) & §9 (Feedback Intelligence) · [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](../../architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md)
**Tests:** `npm run test:intelligence-companion-learning` (55 assertions) · included in the `npm test` chain

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/int35c-companion-learning-dashboard-20260702` → `4a2da735f5b80bac2da4dd306c387adeb5e431de` |
| Working tree | Intentionally dirty at start — prior uncommitted INT35/INT35B/INT36/INT37 work already present on this branch, unrelated to this workstream and untouched by it except where noted below |
| This task's writes | See §7 Files changed |
| Rollback to committed state | `git checkout rollback/int35c-companion-learning-dashboard-20260702` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`
- [x] `docs/implementation/intelligence/INT35B_COMPANION_LEARNING_AND_OBSERVABILITY.md`

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
□ One canonical identity
  Explain: Two new entities — a Companion health snapshot and a Companion
  learning recommendation. Each has exactly one key space: the serial `id` on
  companion_health_snapshots / companion_learning_recommendations. Neither
  duplicates an existing entity's identity (they reference conversation_turns
  and users only by id, never by re-deriving identity).

□ One owner per fact
  Explain: companion-learning-store.ts is the SOLE reader/writer of both new
  tables — no other module touches them directly (matches the conversation-
  store.ts precedent for the conversation_turns tables). The five gap
  categories are each computed once, in companion-gap-classifier.ts, from data
  companion-observability.ts (INT35B, unmodified) already owns.

□ No duplicate entities
  Explain: No new "conversation", "turn", or "capability" entity is created.
  The two new tables are net-new aggregate/administrative entities (a
  snapshot, a recommendation) with no existing counterpart anywhere in the
  codebase.

□ No duplicate ownership
  Explain: turn-fallback.ts's log remains the single owner of raw miss events
  (unchanged, still in-memory/bounded). companion-observability.ts remains the
  single owner of the aggregation logic (reused, not reimplemented). The
  Capability Registry remains the single owner of executability/gap facts —
  companion-gap-classifier.ts reads it via the canonical `intelligencePlatform`
  singleton's public `canExecute` / `registry.findGap`, never a second
  registry instance.

□ No duplicate state
  Explain: conversation_turns (INT18) remains the only turn-volume store — a
  new `countTurnsSince` method was added to the EXISTING IConversationStore
  interface (not a new counter table) specifically to avoid creating a second
  owner of turn counts.

□ Extends existing architecture
  Explain: Follows the INT35B precedent exactly — a pure classification layer
  over the existing summary (companion-gap-classifier.ts, extends
  companion-observability.ts's output), an advisory-only LLM generator
  (companion-learning-recommender.ts, extends matcher-suggester.ts's pattern),
  and an interface + Database/InMemory pair for the new store
  (companion-learning-store.ts, extends conversation-store.ts's IConversationStore
  pattern so tests need no live database).

□ Progressive enrichment where appropriate
  Explain: Both new entities are transactional/administrative (a point-in-time
  snapshot, a review-queue row) — not knowledge entities — so single-owner
  state applies, not progressive enrichment. No enrichment pipeline was added.

□ Honest gaps over fabricated information
  Explain: Zero snapshots / one snapshot → `trend.available = false` with an
  explicit note, never an invented trend line (§5, §8 tests). Zero turns →
  `rates.*Rate = null` ("no data"), never a fabricated 0%/100% (§4 tests). An
  LLM provider that is unavailable, errors, or returns unparseable JSON always
  degrades to zero suggestions, never throws and never fabricates a
  recommendation (§7 tests, inherited from INT35B's matcher-suggester.ts
  discipline).

□ No permanent synchronisation bridge
  Explain: No bridge is created. Snapshots are one-way, additive captures
  (write-once, read-many) — nothing is kept "in sync" with the live log; a
  snapshot is a deliberate point-in-time copy, taken only on admin action.

□ Evolution over replacement
  Explain: Nothing is replaced. The INT35 log and INT35B's aggregation/
  suggestion modules are reused completely unmodified (companion-observability.ts
  and matcher-suggester.ts have zero diff in this workstream).
```

---

## AI ARCHITECTURE COMPLIANCE

```
✓ Uses the canonical Intelligence Platform — companion-gap-classifier.ts reads
  the `intelligencePlatform` singleton (server/intelligence/intelligence-platform.ts),
  never a second instance.
✓ Uses the Capability Registry — capability-gap vs knowledge-gap is decided by
  `intelligencePlatform.canExecute()` / `intelligencePlatform.registry.findGap()`,
  read-only.
✓ Uses the Intent Engine — indirectly: the classification operates on outcomes
  the Intent Engine already produced (via turn-fallback.ts's log); no new
  routing path is introduced.
✓ Reuses existing business services — no new business service; the only new
  I/O is the two new tables (companion-learning-store.ts) and one new read
  method on the existing conversation store.
✓ Does not create another assistant — no new conversational surface, no new
  LLM-facing chat loop. The two new LLM calls (matcher — reused from INT35B —
  and capability recommendations) are one-shot structured-JSON generation
  calls, not a conversation.
✓ Does not duplicate conversation state — conversation_turns remains the only
  turn store; countTurnsSince is an aggregate COUNT(*), never a copy of turn
  content.
✓ Uses registered capabilities only — capability recommendations are
  constrained to (capability, verb) pairs already present in the caller's
  input (§7 test: "a capability recommendation naming a pair outside the
  input set is dropped"), and those pairs originate from the resolver's own
  real routing, never LLM invention.
✓ Uses permission-aware access — all five new routes are `assertAdmin`-gated;
  the two write actions (generate, review) are additionally written to
  `admin_audit_log` per THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §8's
  requirement that privileged admin actions are audited.
✓ Produces honest gaps rather than fabricated knowledge — see the Architecture
  Compliance Checklist row above.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Companion Learning (new)
Declared SoT: server/intelligence/conversation/companion-learning-store.ts
              → DB tables companion_health_snapshots, companion_learning_recommendations
New store created? YES
  Governance check (SoT Register Rule 8): is there an existing store for this
  domain? No — INT35's miss log is in-memory/bounded/write-mostly and
  INT35B's observability module is a pure read-time projection with no
  storage of its own; neither can serve as a queue with admin-reviewable
  state or a history longer than the current 200-entry ring buffer. A new
  store is therefore the correct call, not a duplication (Rule 8 satisfied).
  Retirement plan for any replaced store: N/A — nothing is replaced.
Existing store extended? YES — conversation-store.ts's IConversationStore
  gained one new read method (countTurnsSince), implemented in both
  DatabaseConversationStore and InMemoryConversationStore.
Consumer created? YES — the admin dashboard route
  (client/src/pages/admin-companion-intelligence-page.tsx) and the five new
  admin API routes.
  Reads from declared SoT? YES — exclusively via companionLearningStore /
  companion-gap-classifier.ts / companion-observability.ts (unmodified).
```

Note on the SoT Register document itself: neither INT18 (which introduced the `conversations` / `conversation_threads` / `conversation_turns` tables) nor INT35B (which introduced two new advisory modules) added a numbered "Domain" section to `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — that register's Phase 1–8 audit is scoped to food/nutrition knowledge domains and their historical duplication problem. Following that established precedent, INT35C declares ownership inline here (above) rather than appending an out-of-scope domain section to a document whose own audited scope is food knowledge, not Intelligence-platform infrastructure.

---

## 1. Objective

INT35B closed the observability loop but left three things undone, each explicitly out of its scope: no true denominator for a "rate" (the miss log only records failures), no persisted history (the log is an in-memory ring buffer that resets on restart), and no way to act on a suggestion except by reading a JSON response once. EWO-INT35C closes all three:

1. **A true learning loop.** Every dashboard figure is computed from the real INT35/INT35B log and the real `conversation_turns` volume — never from hypothetical examples.
2. **A finer diagnosis.** INT35B could only tell you "the resolver missed it" or "a routed capability failed" — one broad "no-knowledge" bucket. INT35C splits that bucket into what it always secretly contained: a genuine capability gap (the feature doesn't exist), a knowledge gap (the feature exists, the content doesn't), a platform failure (a genuine fault), and — newly tracked — a clarification (not a miss at all).
3. **A governed queue, not a one-shot response.** Recommendations are persisted, reviewable, and status-tracked (pending → approved/rejected → completed) by an admin — and **nothing about reviewing one changes production behaviour**. Acting on an approved recommendation remains a separate, human, code-reviewed edit through the normal `ENGINEERING_WORKFLOW.md` process, exactly as INT35B's matcher-suggester established for matcher proposals.
4. **A dashboard** so an administrator can see all of the above without reading raw log lines.

**Architecture decision (scope rule honoured, as INT35B before it):** no new assistant, no new state owner beyond the one declared new domain, no change to canonical ownership of anything that already had an owner, no change to production routing. The Intelligence Platform, Intent Engine, Capability Registry (read-only), `PatternIntentResolver`'s matcher arrays, and every capability handler are unchanged.

| Piece | Role in INT35C |
|---|---|
| `companion-gap-classifier.ts` (new, pure) | Splits INT35B's two buckets into five: resolver-gap, clarification, capability-gap, knowledge-gap, platform-failure. Also computes the three headline rates. |
| `companion-learning-store.ts` (new) | Sole owner of the two new tables. `ICompanionLearningStore` interface + `DatabaseCompanionLearningStore` / `InMemoryCompanionLearningStore`, mirroring `conversation-store.ts`. Also `computeTrend` (pure). |
| `companion-learning-recommender.ts` (new) | Orchestrates matcher (reused), capability (new), and regression-test (new, templated) advisory generation; queues results as `pending`. |
| `turn-fallback.ts` | Additive `gapKind` field on the log entry (no behaviour change). |
| `conversation-gateway.ts` | Populates `gapKind` at both existing log call sites (no behaviour change). |
| `conversation-store.ts` | Additive `countTurnsSince` on `IConversationStore` (no behaviour change to existing methods). |
| `companion-observability.ts`, `matcher-suggester.ts` | **Unchanged.** Reused exactly as INT35B left them. |
| `routes.ts` | Five new `assertAdmin`-gated routes; two write actions audited to `admin_audit_log`. |
| `admin-companion-intelligence-page.tsx` (new) | The Companion Intelligence Dashboard. |
| Intelligence Platform / Intent Engine / Registry (write path) / handlers / discovery engines / `PatternIntentResolver` matchers | **Unchanged.** |

---

## 2. Scope item — learning from real interactions, not hypothetical examples

Everything on the dashboard is computed live from `getUnsuccessfulQueryLog()` (INT35's real ring buffer of real misses) and `conversation_turns` (INT18's real turn store). No seed data, no fixtures, no hardcoded examples ship in production code — the only fixtures anywhere are in the test file, which exists to prove the pipeline, not to populate the dashboard.

---

## 3. Scope item — grouping and ranking by frequency, impact and trend

- **Frequency** — unchanged from INT35B: `companion-observability.ts`'s existing grouping/ranking (`topUnmatchedUtterances`, `routingFailures`), reused as-is.
- **Impact** — the dashboard's "Improvement Opportunities Ranked by Impact" panel merges resolver-gaps, capability-gaps, and knowledge-gaps into one list ranked by observed frequency, with each row labelled by category. The formula is deliberately simple and disclosed on the panel itself ("Impact = observed frequency across all gap categories") rather than a black-box weighting — Architecture Principle 6 (honest, not fabricated precision).
- **Trend** — `companion-learning-store.computeTrend()` compares the two most-recently-recorded snapshots' unmatched-utterance backlogs and ranks by growth (`currentCount − previousCount`). With fewer than two snapshots it returns `available: false` with an explicit note — never a trend computed from one data point.

---

## 4. Scope item — distinguishing resolver / capability / knowledge / platform gaps

`companion-gap-classifier.ts::classifyGaps()`:

| Category | Source | Test of membership |
|---|---|---|
| `resolver-gap` | unmatched-shaped log entries | `gapKind` is absent or `"unknown"`/`"out-of-scope"` |
| `clarification` | unmatched-shaped log entries | `gapKind` is `"ambiguous"` or `"needs-clarification"` — **newly tracked**; previously indistinguishable from a genuine miss |
| `capability-gap` | `routingFailures` groups | `!intelligencePlatform.canExecute(capability, verb)` — the feature does not exist |
| `knowledge-gap` | `routingFailures` groups | executable, but a `no-knowledge` status was observed — the feature exists, stored content doesn't |
| `platform-failure` | `routingFailures` groups | executable, only `error` statuses observed — a genuine fault |

The `gapKind` split required one additive field on INT35's log entry (§ below) — without it, a clarification-needing turn and a genuine miss were both logged identically as `state: "no-route"`, which is exactly the ambiguity INT35C's scope asks to resolve.

**`gapKind` — the one behavioural-adjacent change, and why it's safe:** `turn-fallback.ts`'s `UnsuccessfulQueryLogEntry` gained an optional `gapKind?: ResolverGap["kind"]` field; `conversation-gateway.ts` now passes it at both existing `logUnsuccessfulQuery` call sites, reading `resolvedIntents[].gap?.kind` — data the gateway already computes for `clarificationPrompt` selection, just not previously logged. **Nothing about turn classification, fallback text, or routing changed** — `classifyTurn()`, `buildFallbackText()`, and every existing INT35/INT35B test still pass unmodified (proven by the full `npm test` run in §8).

---

## 5. Scope item — advisory matcher, capability, and regression-test recommendations

`companion-learning-recommender.ts::generateAndQueueRecommendations()`, admin-triggered via `POST /api/intelligence/learning/snapshot`:

1. **Matcher recommendations** — `matcher-suggester.ts::suggestMatcherImprovements()`, INT35B's module, called unmodified over the `resolver-gap` backlog only (never the `clarification` backlog — a clarification is not a miss to fix).
2. **Capability recommendations (new)** — `suggestCapabilityImprovements()` asks the injected `ILlmProvider` to describe, in human terms, what each `capability-gap` cluster implies is missing, with 2–4 acceptance criteria. Constrained exactly like INT35B's matcher suggester: the LLM may only describe `(capability, verb)` pairs **already present in its input** (themselves drawn from the resolver's own real routing, not LLM invention); a response naming any other pair is dropped (§7 test). Degrades to zero suggestions — never throws, never fabricates — when the provider is unavailable, errors, or the backlog is empty.
3. **Regression test proposals (new)** — pure string templating, **no LLM call**: one `{utterance, expectedCapability, expectedVerb}` skeleton per matcher suggestion (ready to paste into `test-intent-resolver.ts`), one per capability recommendation (an executability-test skeleton for once the capability is bound).

All three land in `companion_learning_recommendations` as `status: "pending"` — see §6.

---

## 6. Scope item — administrator review queue; production behaviour never changes without the governed process

This is the one hard rule this workstream is built around, inherited unchanged from INT35B's matcher-suggester:

- Every `MatcherSuggestion` / capability recommendation / regression-test proposal reaches storage **only** as a `pending` row.
- `companionLearningStore.reviewRecommendation(id, status, adminUserId, notes)` writes **only** `status`, `reviewedBy`, `reviewedAt`, `reviewNotes` — proven by test (§8: "review does NOT alter the original payload / rationale / kind").
- There is no `applied` column, no code path from a recommendation row to `PatternIntentResolver`, the Capability Registry's bind path, or any other production file. Approving a recommendation changes its place in an admin's queue; **implementing it remains a separate, human, code-reviewed change through the normal `ENGINEERING_WORKFLOW.md` process** (e.g. its own future EWO ticket).
- Both write actions (`POST .../snapshot`, `POST .../recommendations/:id/review`) are additionally recorded to `admin_audit_log`, satisfying `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §8's requirement that privileged admin actions are audited.

---

## 7. Scope item — implementation-ready recommendations

Each recommendation payload carries everything a human engineer needs to act without re-deriving it: the matcher/capability target, example phrasings or acceptance criteria, a rationale, a confidence level, and — via the regression-test proposals — a ready-to-paste test skeleton naming the exact expected capability/verb. Nothing is auto-applied; "implementation-ready" describes the payload's completeness, not an automated implementation step.

---

## 8. The Companion Intelligence Dashboard

`client/src/pages/admin-companion-intelligence-page.tsx`, route `/admin/companion-intelligence`, `assertAdmin`-gated end to end (client `ProtectedRoute` + server `assertAdmin` on every backing route). Sections, each backed by `GET /api/intelligence/learning/dashboard`:

| Dashboard requirement | Section |
|---|---|
| Overall understanding rate | Stat tile — `rates.understandingRate` |
| Successful conversation rate | Stat tile — `rates.successfulConversationRate` |
| Clarification request rate | Stat tile — `rates.clarificationRate` |
| Fallback state distribution | "Fallback State Distribution" — `summary.byState` |
| Top unmatched requests | "Top Unmatched Requests" — `classification.resolverGaps`, row click drills into count + surfaces |
| Fastest-growing intent gaps | "Fastest-Growing Intent Gaps" — `trend.fastestGrowingGaps`, honest empty state when `!trend.available` |
| Capability gap analysis | "Capability Gap Analysis" — `classification.capabilityGaps`, drill-down shows the Registry's own gap reason |
| Knowledge gap analysis | "Knowledge Gap Analysis" — `classification.knowledgeGaps` |
| Routing failure analysis | "Routing Failure Analysis (Platform Faults)" — `classification.platformFailures` |
| Most requested new capabilities | "Most Requested New Capabilities" — capability-gaps grouped by capability, summed |
| Improvement opportunities ranked by impact | "Improvement Opportunities Ranked by Impact" — merged, frequency-ranked, formula disclosed on the panel |
| Approved / pending / completed recommendations | "Learning Recommendation Queue" — tabbed (pending/approved/rejected/completed), Approve/Reject/Mark-implemented actions |
| Improvement history over time | "Improvement History" — recharts line chart of understanding rate across snapshots (built per the `dataviz` skill: single axis, thin 2px line, tooltip, honest "not enough history" empty state below two points, reuses the app's existing green chart palette from `dashboard.tsx` rather than introducing a new one) |

**Drill-down / privacy:** every drill-down (a table row click opening a detail dialog) expands data **already present in the fetched, anonymised response** — no additional network call, no new data source, so it cannot cross the privacy boundary INT35 established. The dashboard's own header states this plainly to the admin.

---

## 9. Files changed

| File | Change |
|---|---|
| `shared/schema.ts` | **NEW tables** `companionHealthSnapshots`, `companionLearningRecommendations` + insert schemas/types |
| `server/intelligence/conversation/companion-gap-classifier.ts` | **NEW** — pure gap classification + rate metrics |
| `server/intelligence/conversation/companion-learning-store.ts` | **NEW** — sole owner of the two new tables; `ICompanionLearningStore` + Database/InMemory implementations; `computeTrend` |
| `server/intelligence/conversation/companion-learning-recommender.ts` | **NEW** — advisory-only orchestration (matcher/capability/regression-test) |
| `server/intelligence/conversation/turn-fallback.ts` | Additive `gapKind` field on the log entry |
| `server/intelligence/conversation/conversation-gateway.ts` | Populate `gapKind` at both existing log call sites |
| `server/intelligence/conversation/conversation-store.ts` | Additive `countTurnsSince` on `IConversationStore` + both implementations |
| `server/routes.ts` | Five new `assertAdmin` routes under `/api/intelligence/learning/*`; two write actions audited |
| `client/src/pages/admin-companion-intelligence-page.tsx` | **NEW** — the Companion Intelligence Dashboard |
| `client/src/App.tsx` | Registers `/admin/companion-intelligence` |
| `server/tests/test-intelligence-companion-learning.ts` | **NEW** — 55 assertions (§10) |
| `package.json` | `test:intelligence-companion-learning` script; appended to the `npm test` chain |
| `docs/implementation/intelligence/INT35C_GOVERNED_COMPANION_LEARNING_AND_DASHBOARD.md` | **NEW** — this document |

Not touched: `companion-observability.ts`, `matcher-suggester.ts` (both reused verbatim), Intelligence Platform, Intent Engine, Capability Registry's write path, every handler/binding, `PatternIntentResolver`'s matcher arrays, discovery engines, `companion-card.ts`, native-discovery, schema for every pre-existing table.

---

## 10. Test evidence (`test-intelligence-companion-learning.ts`, 55 assertions)

| Scope requirement | Proven by |
|---|---|
| gapKind additive, no behaviour change | §1: gateway still classifies both clarification and genuine-miss turns as `no-route`; clarification prompt still surfaced verbatim |
| Resolver-gap vs clarification split | §2: `unknown`/no-gapKind → resolverGaps; `ambiguous`/`needs-clarification` → clarifications, never double-counted |
| Capability-gap vs knowledge-gap vs platform-failure split | §3: non-executable pair → capability-gap (with Registry reason); executable + no-knowledge → knowledge-gap; executable + error-only → platform-failure |
| Rate metrics are honest, not fabricated | §4: zero turns → null rates; correct division for populated cases; clamped to [0,1] |
| Trend requires real history | §5: 0 and 1 snapshot → `available:false`; 2 snapshots → correct growth math, sorted descending |
| Recommendation queue CRUD + the advisory hard rule | §6: every insert starts `pending`; `reviewRecommendation` proven to leave payload/rationale/kind untouched; missing id returns `undefined`, never throws |
| End-to-end generation is advisory-only and degrades safely | §7: real gateway pipeline seeds the log; provider-unavailable and empty-backlog paths both degrade to zero suggestions without throwing; capability recommendations naming an out-of-input pair are dropped |
| Privacy — no user/household identity anywhere | §8: serialized snapshot and recommendation rows contain no `userId`/`householdId` keys |
| `countTurnsSince` accuracy | §9: role filter, window filter, future-date edge case |

Full verification run (2026-07-02): `test:intelligence-companion-learning` 55/55 · full `npm test` chain green (all pre-existing INT35/INT35B/INT36/INT37 and binding suites unchanged and passing) · `tsc --noEmit` 153 pre-existing errors, unchanged (0 new) · `npm run db:push` applied cleanly (verified via direct psql inspection of both new tables' column definitions) · manual verification: dev server boots cleanly with the new routes registered (`assertAdmin` correctly returns 403 pre-auth on all five, confirming no import/wiring errors); a direct Postgres round-trip smoke test (record snapshot → insert recommendation → list/filter → review → list snapshots → cleanup) passed against the real database, then the test rows were deleted, leaving both new tables empty.

*(Admin-authenticated UI click-through was not performed — creating or repurposing admin credentials for this was correctly blocked by the environment's own safety controls, and doing so was outside this task's authorization. The dashboard's data-fetching, mutation, and rendering logic is otherwise fully exercised: the backing API contract is proven end-to-end by the test suite and the real-DB smoke test above, and the component was verified to typecheck and build against that exact contract.)*

---

## 11. Behavioural notes & accepted trade-offs

- **Snapshots are admin-triggered only — no scheduler.** Confirmed with the user before implementation. Avoids introducing new background-job infrastructure; matches INT35B's precedent of not adding infrastructure beyond what the ticket strictly requires. A future workstream could add a scheduled snapshot if continuous (rather than admin-initiated) history is wanted.
- **Rate metrics are a documented approximation, not hidden.** `computeRateMetrics` divides event/shape counts from the bounded 200-entry INT35 ring buffer by a turn count over the same window (`windowStart` → now). `routingFailures` counts (capability, verb) occurrences, which can exceed 1 per turn when a turn queries more than one capability — so `totalUnsuccessfulTurns` is an upper-bound approximation of unsuccessful turns, not an exact per-turn tally. This is disclosed in the module's doc comment and is the same order of honesty INT35B used for its own log-based aggregates; an exact per-turn accounting would require persisting a turn-level outcome flag, a larger schema change outside this ticket's scope.
- **The INT35 log itself is still in-memory (unchanged from INT35B).** A snapshot is a deliberate, durable copy of what the log looked like *at the moment an admin generated it* — the underlying log still resets on server restart between snapshots, exactly as before. This is why snapshot-taking is valuable: it is the mechanism that makes history survive what the log itself cannot.
- **`gapKind` is best-effort, not authoritative for old data.** Log entries recorded before this change (none exist in production yet, since INT35B's log is process-local and this ships in the same deploy) have no `gapKind`; the classifier treats a missing `gapKind` as a conservative `resolver-gap` (never silently drops a miss into neither bucket).
- **Capability recommendations have no example utterance.** `routingFailures` groups by `(capability, verb)` only (INT35B's design) — no utterance is retained at that grouping level, so a capability recommendation's regression-test skeleton has an empty `utterance` field with a note explaining it needs one once the capability exists. Retaining utterances there would require widening INT35B's `RoutingFailureGroup` shape, which this ticket does not touch.

---

## DEFINITION OF DONE

- **What success looks like:** An admin can open `/admin/companion-intelligence`, see the eleven required dashboard elements populated from real data, click "Generate recommendations" to get a fresh advisory batch, and approve/reject/complete items in the queue — all without any production routing behaviour changing.
- **What must not break:** Every pre-existing INT35/INT35B behaviour (fallback classification, fallback copy, observability summary, matcher suggestions) — proven unchanged by the full `npm test` run.
- **Manual test steps:** (1) `npm run db:push` to materialise the two tables (done). (2) As an admin, POST `/api/intelligence/learning/snapshot` twice (a few minutes apart, after some Companion misses have occurred) and confirm the dashboard's trend and history sections populate. (3) Approve one pending recommendation and confirm only its status/reviewedBy/reviewedAt change (confirmed by the store's own test suite; can be re-confirmed via `GET .../recommendations/:id`).

## DATA IMPACT

- Reads existing data: YES — the INT35 miss log, `conversation_turns` (aggregate count only), the Capability Registry (read-only).
- Writes new data: YES — two new tables, additive only (INSERT/UPDATE-by-status, no destructive writes).
- Changes meaning of existing data: NO.
- Requires backfill: NO — history simply starts accumulating from the first admin-triggered snapshot; no fabricated backfill was written (Architecture Principle 6).

## TRUST CHECK

- Could this mislead the user? No user-facing (non-admin) surface is touched at all.
- Could this fabricate certainty? No — null rates, unavailable trend, and dropped out-of-scope LLM suggestions are all explicit, tested honest-gap paths.
- Is anything guessed but shown as real? No — the "impact" ranking formula is disclosed on the panel itself rather than presented as a hidden score.
- What happens if the system is wrong? Every output here is advisory. The worst case is a low-quality recommendation sitting in a `pending` queue that an admin rejects — it cannot reach production without a separate, human, code-reviewed change.
- No architectural duplication introduced: YES.
- No new source of truth created for anything that already had one: YES.
- No runtime behaviour altered for governance-only work: N/A (this is not governance-only work — see the `gapKind` note in §4 for the one additive, behaviour-preserving change).

## ROLLBACK PLAN

- Rollback identifier: `rollback/int35c-companion-learning-dashboard-20260702` → `4a2da735f5b80bac2da4dd306c387adeb5e431de`
- Files modified: see §9.
- Rollback commands: `git checkout rollback/int35c-companion-learning-dashboard-20260702` to discard the code changes. The two new tables are additive and empty of any pre-existing data — if a full DB rollback is also wanted, `DROP TABLE companion_learning_recommendations; DROP TABLE companion_health_snapshots;` removes them cleanly (no other table references them; `companion_learning_recommendations` is the only referencer, via `snapshot_id`, and is dropped first).
- Verification steps after rollback: `npm test` should return to the pre-INT35C `npm test` result (INT35B's 60/60 observability suite and all binding suites); `tsc --noEmit` should show 153 pre-existing errors as before.

## SCOPE LOCK

**Implemented:** All items in the EWO-INT35C scope — real-interaction learning, frequency/impact/trend grouping, the five-way gap classification, advisory matcher/capability/regression-test recommendation generation via the existing Intelligence Platform, the admin review queue with the "no production change without the governed process" guarantee, implementation-ready recommendation payloads, and the full Companion Intelligence Dashboard with drill-down.

**Explicitly excluded:**
- A scheduled/background snapshot job (admin-triggered only — confirmed with the user).
- Auto-application of any recommendation to `PatternIntentResolver` or any other production file (structurally impossible by this design, not merely a policy choice).
- Widening `RoutingFailureGroup` to retain example utterances per capability/verb (would touch INT35B's shape; left for a future ticket if wanted).
- Persisting individual turn-level success/failure flags for exact (non-approximated) rate math (a larger schema change than this ticket's turn-count aggregate).
- Any change to `companion-observability.ts` or `matcher-suggester.ts` logic — both reused verbatim.

**Suggestions (not implemented, for a future ticket):**
- A scheduled snapshot job (e.g. daily) would make "improvement history over time" continuous rather than admin-initiated.
- Widening the INT35B routing-failure grouping to retain a bounded sample of example utterances per (capability, verb) would let capability recommendations include a concrete example phrasing, not just the structural gap reason.
